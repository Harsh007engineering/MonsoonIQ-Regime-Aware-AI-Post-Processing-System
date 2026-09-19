"""
MonsoonIQ FastAPI Application.
High-performance REST API serving:
- Real-time and historical regime-aware bias-corrected rainfall forecasts (grid and district modes)
- Calibrated heavy-rain exceedance probabilities (64.5, 115.6, 204.5 mm)
- Detailed district views with P10/P50/P90 uncertainty intervals
- Bilingual advisories (English & Hindi) and CAP-format emergency alerts
- SHAP model explainability
- Interactive historical case replays (Kerala 2018, Mumbai 2005, Uttarakhand 2013)
- Verification scorecards and downloadable publication PDF reports
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import pandas as pd
import numpy as np

from src.regime.ml_classifier import MLRegimeClassifier
from src.correction.mixture_of_experts import MonsoonIQMixtureOfExperts
from src.heavy_rain.heavy_rain_classifier import HeavyRainProbabilityModule
from src.correction.quantile_regressor import QuantileRegressor
from src.api.advisory import AdvisoryGenerator
from src.api.cache import LRUCache
from src.api.schemas import (
    HealthResponse, RegimeResponse, CorrectedForecastResponse,
    HeavyProbabilityResponse, SingleDistrictDetailResponse, ExplainabilityResponse
)

logger = logging.getLogger("MonsoonIQ_API")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

app = FastAPI(
    title="MonsoonIQ API",
    description="Regime-Aware AI Post-Processing System for Monsoon Rainfall Forecasts over India",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage and state
STATE = {
    "df_districts": None,
    "geojson": None,
    "grid_samples": None,
    "regime_clf": None,
    "moe": None,
    "hrc": None,
    "qr": None,
    "cache": LRUCache(capacity=512)
}


@app.on_event("startup")
def load_artifacts():
    """Load models, datasets, and precomputed artifacts into memory."""
    logger.info("Initializing MonsoonIQ models and dataset cache...")
    try:
        data_path = "data/synthetic/district_daily.parquet"
        if os.path.exists(data_path):
            STATE["df_districts"] = pd.read_parquet(data_path)
            logger.info(f"Loaded district dataset ({len(STATE['df_districts'])} rows).")

        geojson_path = "data/geojson/india_districts.geojson"
        if os.path.exists(geojson_path):
            with open(geojson_path, "r", encoding="utf-8") as f:
                STATE["geojson"] = json.load(f)
            logger.info("Loaded India Districts GeoJSON.")

        grid_path = "data/synthetic/grid_sample_dates.npz"
        if os.path.exists(grid_path):
            STATE["grid_samples"] = np.load(grid_path, allow_pickle=True)
            logger.info("Loaded Gridded Spatial Sample Fields.")

        # Load ML Models
        if os.path.exists("artifacts/models/regime_classifier.joblib"):
            r_clf = MLRegimeClassifier()
            r_clf.load()
            STATE["regime_clf"] = r_clf
            logger.info("Loaded ML Regime Classifier.")

        if os.path.exists("artifacts/models/mixture_of_experts.joblib"):
            STATE["moe"] = MonsoonIQMixtureOfExperts.load()
            logger.info("Loaded MoE Engine.")

        if os.path.exists("artifacts/models/heavy_rain_module.joblib"):
            STATE["hrc"] = HeavyRainProbabilityModule.load()
            logger.info("Loaded Heavy Rain Module.")

        if os.path.exists("artifacts/models/quantile_regressor.joblib"):
            STATE["qr"] = QuantileRegressor.load()
            logger.info("Loaded Quantile Regressor.")

    except Exception as e:
        logger.error(f"Error during model startup load: {e}")


@app.get("/health", response_model=HealthResponse)
def health():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        data_mode="synthetic",
        models_loaded=bool(STATE["moe"] is not None),
        total_districts=len(STATE["geojson"]["features"]) if STATE["geojson"] else 0
    )


@app.get("/districts")
def list_districts():
    """Return all districts with metadata and coordinates."""
    if not STATE["geojson"]:
        raise HTTPException(status_code=500, detail="Districts geojson not loaded")
    districts = []
    for f in STATE["geojson"]["features"]:
        props = f["properties"]
        districts.append({
            "district_id": props["district_id"],
            "district_name": props["district_name"],
            "state_name": props["state_name"],
            "zone": props["zone"],
            "centroid_lat": props["centroid_lat"],
            "centroid_lon": props["centroid_lon"],
            "elevation_m": props.get("elevation_m", 100)
        })
    return {"total": len(districts), "districts": districts}


@app.get("/districts/geojson")
def get_districts_geojson():
    """Return complete GeoJSON for district polygons."""
    if not STATE["geojson"]:
        raise HTTPException(status_code=500, detail="GeoJSON not loaded")
    return STATE["geojson"]


@app.get("/regime")
def get_regime_for_date(date: Optional[str] = Query(None, description="Date in YYYY-MM-DD")):
    """Get spatial regime probabilities and dominant regime for a date."""
    df = STATE["df_districts"]
    if df is None:
        raise HTTPException(status_code=500, detail="Dataset not ready")

    target_date = date or "2023-07-15"
    sub_df = df[df["date"] == target_date]
    if sub_df.empty:
        target_date = df["date"].iloc[-1]
        sub_df = df[df["date"] == target_date]

    # Overall dominant regime on that date
    regime_counts = sub_df["regime_name"].value_counts()
    dominant_regime = regime_counts.index[0]
    dom_id = int(sub_df[sub_df["regime_name"] == dominant_regime]["regime"].iloc[0])

    # Soft probabilities average across India
    p_probs = {r: round(float((sub_df["regime_name"] == r).mean()), 3) for r in sub_df["regime_name"].unique()}

    return {
        "date": target_date,
        "dominant_regime": dominant_regime,
        "dominant_regime_id": dom_id,
        "soft_probabilities": p_probs,
        "available_dates_range": [str(df["date"].min()), str(df["date"].max())]
    }


@app.get("/forecast/corrected")
def get_corrected_forecast(date: Optional[str] = Query(None),
                           lead_time_days: int = Query(1, ge=1, le=5),
                           mode: str = Query("district", pattern="^(district|grid)$")):
    """
    Retrieve regime-aware corrected forecasts vs Raw NWP at district or grid scale.
    Includes P10/P50/P90 bounds and heavy-rain probabilities.
    """
    cache_key = f"corrected_{date}_{lead_time_days}_{mode}"
    cached = STATE["cache"].get(cache_key)
    if cached:
        return cached

    df = STATE["df_districts"]
    if df is None:
        raise HTTPException(status_code=500, detail="Dataset not loaded")

    target_date = date or "2023-07-15"
    sub_df = df[df["date"] == target_date].copy()
    if sub_df.empty:
        target_date = "2023-07-15"
        sub_df = df[df["date"] == target_date].copy()

    nwp_col = f"raw_nwp_d{lead_time_days}"
    if nwp_col not in sub_df.columns:
        nwp_col = "raw_nwp_d1"

    # Compute inference from models
    regime_clf = STATE["regime_clf"]
    moe = STATE["moe"]
    hrc = STATE["hrc"]
    qr = STATE["qr"]

    p_regimes = regime_clf.predict_proba(sub_df)
    preds = moe.predict_all_systems(sub_df, nwp_col=nwp_col, regime_probs=p_regimes)
    prob_preds = hrc.predict_probabilities(sub_df, nwp_col=nwp_col)
    quant_preds = qr.predict_quantiles(sub_df, nwp_col=nwp_col)

    districts_list = []
    for idx, (_, row) in enumerate(sub_df.iterrows()):
        raw_val = float(preds["raw_nwp"][idx])
        corr_val = float(preds["monsooniq"][idx])
        delta = corr_val - raw_val

        p_h = float(prob_preds["heavy"][idx])
        p_vh = float(prob_preds["very_heavy"][idx])
        p_eh = float(prob_preds["extremely_heavy"][idx])

        alert_level = AdvisoryGenerator.determine_alert_level(
            corr_val, float(quant_preds["p90"][idx]), p_h, p_vh
        )

        item = {
            "district_id": row["district_id"],
            "district_name": row["district_name"],
            "state_name": row["state_name"],
            "zone": row["zone"],
            "centroid_lat": row["latitude"],
            "centroid_lon": row["longitude"],
            "elevation_m": row["elevation"],
            "dominant_regime": row["regime_name"],
            "raw_nwp": round(raw_val, 2),
            "monsooniq_corrected": round(corr_val, 2),
            "bias_delta": round(delta, 2),
            "observed_rain": round(float(row["obs_rain_mean"]), 2),
            "p10": round(float(quant_preds["p10"][idx]), 2),
            "p50": round(float(quant_preds["p50"][idx]), 2),
            "p90": round(float(quant_preds["p90"][idx]), 2),
            "p_heavy": round(p_h, 3),
            "p_very_heavy": round(p_vh, 3),
            "p_extremely_heavy": round(p_eh, 3),
            "alert_level": alert_level,
            "alert_code": alert_level.upper()
        }
        districts_list.append(item)

    resp = {
        "date": target_date,
        "lead_time_days": lead_time_days,
        "mode": mode,
        "provenance": "SYNTHETIC_DATASET",
        "total_districts": len(districts_list),
        "districts": districts_list
    }
    STATE["cache"].set(cache_key, resp)
    return resp


@app.get("/forecast/heavy-probability")
def get_heavy_probabilities(date: Optional[str] = Query(None),
                            lead_time_days: int = Query(1, ge=1, le=5)):
    """Calibrated probability of exceeding IMD heavy rainfall thresholds."""
    forecast = get_corrected_forecast(date=date, lead_time_days=lead_time_days, mode="district")
    return {
        "date": forecast["date"],
        "lead_time_days": lead_time_days,
        "thresholds_mm": {"heavy": 64.5, "very_heavy": 115.6, "extremely_heavy": 204.5},
        "district_probabilities": [
            {
                "district_id": d["district_id"],
                "district_name": d["district_name"],
                "p_heavy": d["p_heavy"],
                "p_very_heavy": d["p_very_heavy"],
                "p_extremely_heavy": d["p_extremely_heavy"],
                "alert_level": d["alert_level"]
            }
            for d in forecast["districts"]
        ]
    }


@app.get("/district/{district_id}")
def get_district_detail(district_id: str,
                        date: Optional[str] = Query(None),
                        lead_time_days: int = Query(1, ge=1, le=5)):
    """Deep-dive district view with bands, regimes, bilingual advisory, and CAP export."""
    forecast = get_corrected_forecast(date=date, lead_time_days=lead_time_days, mode="district")
    matched = next((d for d in forecast["districts"] if d["district_id"] == district_id), None)
    if not matched:
        raise HTTPException(status_code=404, detail=f"District ID {district_id} not found")

    df = STATE["df_districts"]
    row_match = df[(df["date"] == forecast["date"]) & (df["district_id"] == district_id)].iloc[0]

    # Generate bilingual advisory
    advisory = AdvisoryGenerator.generate_advisory(
        district_name=matched["district_name"],
        state_name=matched["state_name"],
        regime_name=matched["dominant_regime"],
        mean_rain=matched["monsooniq_corrected"],
        max_rain=matched["p90"],
        p_heavy=matched["p_heavy"],
        p_very_heavy=matched["p_very_heavy"]
    )

    cap_alert = AdvisoryGenerator.generate_cap_alert(
        district_id=district_id,
        district_name=matched["district_name"],
        state_name=matched["state_name"],
        date_str=forecast["date"],
        advisory_data=advisory
    )

    return {
        "district_id": district_id,
        "district_name": matched["district_name"],
        "state_name": matched["state_name"],
        "zone": matched["zone"],
        "date": forecast["date"],
        "lead_time_days": lead_time_days,
        "elevation_m": matched["elevation_m"],
        "dominant_regime": matched["dominant_regime"],
        "forecast": {
            "raw_nwp": matched["raw_nwp"],
            "monsooniq_corrected": matched["monsooniq_corrected"],
            "bias_delta": matched["bias_delta"],
            "observed_rain": matched["observed_rain"]
        },
        "uncertainty_bands": {
            "p10": matched["p10"],
            "p50": matched["p50"],
            "p90": matched["p90"]
        },
        "heavy_probabilities": {
            "p_heavy_64_5": matched["p_heavy"],
            "p_very_heavy_115_6": matched["p_very_heavy"],
            "p_extremely_heavy_204_5": matched["p_extremely_heavy"]
        },
        "advisory": advisory,
        "cap_alert": cap_alert
    }


@app.get("/explain/{district_id}/{date}")
def explain_forecast(district_id: str, date: str):
    """SHAP feature attribution explaining why MonsoonIQ corrected the forecast."""
    df = STATE["df_districts"]
    if df is None:
        raise HTTPException(status_code=500, detail="Dataset not ready")

    matches = df[(df["date"] == date) & (df["district_id"] == district_id)]
    if matches.empty:
        # Fallback to nearest date
        matches = df[df["district_id"] == district_id].head(1)
        if matches.empty:
            raise HTTPException(status_code=404, detail="District not found")

    row = matches.iloc[0].to_dict()
    regime_clf = STATE["regime_clf"]
    explanation = regime_clf.explain_sample(row)
    explanation["district_id"] = district_id
    explanation["date"] = date
    return explanation


@app.get("/verification/summary")
def get_verification_summary():
    """Retrieve full verification summary comparing all 4 benchmark systems."""
    path = "artifacts/metrics/verification_summary.json"
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Verification summary not yet generated")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@app.get("/verification/heavy-events")
def get_heavy_events_summary():
    """Retrieve dedicated heavy and very heavy rainfall skill with event counts."""
    path = "artifacts/metrics/heavy_events_summary.json"
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Heavy events summary not found")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@app.get("/verification/report.pdf")
def download_verification_pdf():
    """Download official publication-grade verification report PDF."""
    pdf_path = "artifacts/reports/MonsoonIQ_Official_Verification_Report.pdf"
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Verification report PDF not found")
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename="MonsoonIQ_Official_Verification_Report.pdf"
    )


@app.get("/case-replays")
def get_historical_case_replays():
    """Pre-configured historical extreme events with multi-day time sliders."""
    return {
        "cases": [
            {
                "id": "kerala_2018",
                "name": "Kerala Flood Event (August 2018)",
                "region": "Wayanad, Idukki & Malabar Coast",
                "regime": "Orographic + Active Low-Level Jet",
                "dates": ["2018-08-14", "2018-08-15", "2018-08-16", "2018-08-17"],
                "description": "Unprecedented orographic surge along the Western Ghats windward slopes combined with strong Somali jet moisture transport.",
                "key_districts": ["KL_WAY", "KL_IDK", "KL_EKM", "KL_TVM"],
                "is_synthetic": True
            },
            {
                "id": "mumbai_2005",
                "name": "Mumbai Megacity Downpour (July 2005-style)",
                "region": "Konkan Coast / Mumbai Suburban",
                "regime": "Mesoscale Coastal Convergence",
                "dates": ["2019-07-25", "2019-07-26", "2019-07-27"],
                "description": "Frictional coastal boundary convergence line stalling over the Mumbai coastline producing localized extreme rainfall rates (> 150 mm/day).",
                "key_districts": ["MH_MUM", "MH_SUB", "MH_THN", "MH_RTG"],
                "is_synthetic": True
            },
            {
                "id": "uttarakhand_2013",
                "name": "Uttarakhand Cloudburst & Flood (June 2013-style)",
                "region": "Rudraprayag / Kedarnath / Dehradun",
                "regime": "Western Disturbance & Monsoon Interaction",
                "dates": ["2023-07-09", "2023-07-10", "2023-07-11"],
                "description": "Upper-tropospheric westerly trough interacting with northward-shifted monsoon depression moisture, triggering catastrophic mountain flash floods.",
                "key_districts": ["UK_RUD", "UK_DRN", "UK_UTK", "HP_SML"],
                "is_synthetic": True
            }
        ]
    }


# Mount built frontend static assets if available (enables single-container full-stack deployment)
from fastapi.staticfiles import StaticFiles

frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")
if not os.path.exists(frontend_dist):
    frontend_dist = "frontend/dist"

if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend-static")
    logger.info(f"Mounted frontend static build from {frontend_dist}")

