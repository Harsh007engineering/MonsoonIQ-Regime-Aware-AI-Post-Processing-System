"""
Export real trained MonsoonIQ model predictions, SHAP explanations, verification metrics,
GeoJSON, and official PDF report into frontend/public/static-data/ so the application
runs with 100% full functionality on Vercel (zero credit card, instant CDN) as well as
Docker/FastAPI backends.
"""
import os
import json
import shutil
import pandas as pd
import numpy as np

from src.regime.ml_classifier import MLRegimeClassifier
from src.correction.mixture_of_experts import MonsoonIQMixtureOfExperts
from src.heavy_rain.heavy_rain_classifier import HeavyRainProbabilityModule
from src.correction.quantile_regressor import QuantileRegressor
from src.api.advisory import AdvisoryGenerator

OUT_DIR = os.path.join("frontend", "public", "static-data")
os.makedirs(OUT_DIR, exist_ok=True)


def main():
    print("1. Copying static verification, GeoJSON, and PDF artifacts...")
    shutil.copyfile("data/geojson/india_districts.geojson", os.path.join(OUT_DIR, "india_districts.geojson"))
    shutil.copyfile("artifacts/metrics/verification_summary.json", os.path.join(OUT_DIR, "verification_summary.json"))
    shutil.copyfile("artifacts/metrics/heavy_events_summary.json", os.path.join(OUT_DIR, "heavy_events_summary.json"))
    shutil.copyfile(
        "artifacts/reports/MonsoonIQ_Official_Verification_Report.pdf",
        os.path.join(OUT_DIR, "MonsoonIQ_Official_Verification_Report.pdf"),
    )

    with open("data/geojson/india_districts.geojson", "r", encoding="utf-8") as f:
        geojson = json.load(f)

    geo_elevations = {}
    for feat in geojson.get("features", []):
        p = feat.get("properties", {})
        if "district_id" in p:
            geo_elevations[p["district_id"]] = round(float(p.get("elevation_m", 100)))

    print("2. Loading trained ML models and dataset...")
    df = pd.read_parquet("data/synthetic/district_daily.parquet")
    regime_clf = MLRegimeClassifier()
    regime_clf.load()
    moe = MonsoonIQMixtureOfExperts.load()
    hrc = HeavyRainProbabilityModule.load()
    qr = QuantileRegressor.load()

    key_dates = [
        "2023-07-15",
        "2023-08-05",
        "2023-08-18",
        "2022-07-22",
        "2023-06-25",
        "2022-03-24",
        "2018-08-14", "2018-08-15", "2018-08-16", "2018-08-17",
        "2019-07-25", "2019-07-26", "2019-07-27",
        "2023-07-09", "2023-07-10", "2023-07-11",
    ]

    forecasts_by_date = {}
    regimes_by_date = {}
    shap_by_district_date = {}

    for target_date in key_dates:
        sub_df = df[df["date"] == target_date].copy()
        if sub_df.empty:
            continue

        # Regime summary
        regime_counts = sub_df["regime_name"].value_counts()
        dominant_regime = regime_counts.index[0]
        dom_id = int(sub_df[sub_df["regime_name"] == dominant_regime]["regime"].iloc[0])
        p_probs = {r: round(float((sub_df["regime_name"] == r).mean()), 3) for r in sub_df["regime_name"].unique()}

        regimes_by_date[target_date] = {
            "date": target_date,
            "dominant_regime": dominant_regime,
            "dominant_regime_id": dom_id,
            "soft_probabilities": p_probs,
            "available_dates_range": [str(df["date"].min()), str(df["date"].max())],
        }

        # Precompute D1 forecast with real models
        nwp_col = "raw_nwp_d1"
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
            p10_v = float(quant_preds["p10"][idx])
            p50_v = float(quant_preds["p50"][idx])
            p90_v = float(quant_preds["p90"][idx])

            alert_level = AdvisoryGenerator.determine_alert_level(corr_val, p90_v, p_h, p_vh)
            elev_val = geo_elevations.get(row["district_id"], round(float(row.get("elevation", 100))))

            districts_list.append({
                "district_id": row["district_id"],
                "district_name": row["district_name"],
                "state_name": row["state_name"],
                "zone": row["zone"],
                "centroid_lat": round(float(row["latitude"]), 4),
                "centroid_lon": round(float(row["longitude"]), 4),
                "elevation_m": elev_val,
                "dominant_regime": row["regime_name"],
                "raw_nwp": round(raw_val, 2),
                "monsooniq_corrected": round(corr_val, 2),
                "bias_delta": round(delta, 2),
                "observed_rain": round(float(row["obs_rain_mean"]), 2),
                "p10": round(p10_v, 2),
                "p50": round(p50_v, 2),
                "p90": round(p90_v, 2),
                "p_heavy": round(p_h, 3),
                "p_very_heavy": round(p_vh, 3),
                "p_extremely_heavy": round(p_eh, 3),
                "alert_level": alert_level,
                "alert_code": alert_level.upper(),
                "raw_nwp_d2": round(float(row["raw_nwp_d2"]), 2),
                "raw_nwp_d3": round(float(row["raw_nwp_d3"]), 2),
                "raw_nwp_d4": round(float(row["raw_nwp_d4"]), 2),
                "raw_nwp_d5": round(float(row["raw_nwp_d5"]), 2),
            })

            # Also compute SHAP for default date 2023-07-15 for all districts
            if target_date == "2023-07-15":
                expl = regime_clf.explain_sample(row.to_dict())
                shap_by_district_date[row["district_id"]] = expl

        forecasts_by_date[target_date] = districts_list

    bundle = {
        "regimes_by_date": regimes_by_date,
        "forecasts_by_date": forecasts_by_date,
        "shap_baseline": shap_by_district_date,
    }

    bundle_path = os.path.join(OUT_DIR, "precomputed_bundle.json")
    with open(bundle_path, "w", encoding="utf-8") as f:
        json.dump(bundle, f, separators=(",", ":"))

    size_kb = os.path.getsize(bundle_path) / 1024
    print(f"3. Successfully exported precomputed_bundle.json ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
