"""
MonsoonIQ Evaluation & Report Compilation Script.
Evaluates trained models strictly on the held-out test years (2022-2023).
Computes all continuous, contingency, probabilistic, and stratified metrics.
Compiles the official PDF verification report.
"""

import os
import json
import logging
import numpy as np
import pandas as pd

from src.regime.ml_classifier import MLRegimeClassifier
from src.correction.mixture_of_experts import MonsoonIQMixtureOfExperts
from src.heavy_rain.heavy_rain_classifier import HeavyRainProbabilityModule
from src.correction.quantile_regressor import QuantileRegressor
from src.verification.evaluator import VerificationEvaluator
from src.verification.report_generator import VerificationReportGenerator

logger = logging.getLogger("MonsoonIQ_Evaluate")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


def run_evaluation_pipeline(data_path: str = "data/synthetic/district_daily.parquet"):
    logger.info("=== Starting MonsoonIQ Evaluation Pipeline ===")

    df = pd.read_parquet(data_path)
    test_mask = df["year"].isin([2022, 2023])
    test_df = df[test_mask].copy().reset_index(drop=True)
    logger.info(f"Loaded held-out test partition: {len(test_df)} records (Years 2022-2023)")

    # 1. Load Models
    regime_clf = MLRegimeClassifier()
    regime_clf.load()

    moe = MonsoonIQMixtureOfExperts.load()
    hrc = HeavyRainProbabilityModule.load()
    qr = QuantileRegressor.load()

    # 2. Predict Regime Soft Probabilities
    logger.info("Generating soft regime probabilities for test partition...")
    p_regimes = regime_clf.predict_proba(test_df)

    # 3. Predict All 4 Systems (Raw, Global QM, Global LGB, MonsoonIQ MoE)
    logger.info("Computing predictions across all 4 benchmark systems...")
    all_preds = moe.predict_all_systems(test_df, nwp_col="raw_nwp_d1", regime_probs=p_regimes)

    # 4. Predict Calibrated Heavy Rain Probabilities
    logger.info("Generating calibrated heavy rain probabilities...")
    prob_preds = hrc.predict_probabilities(test_df, nwp_col="raw_nwp_d1")

    # 5. Predict P10, P50, P90 Quantiles
    quant_preds = qr.predict_quantiles(test_df, nwp_col="raw_nwp_d1")

    # 6. Run Verification Evaluator
    evaluator = VerificationEvaluator()
    summary = evaluator.evaluate_test_set(test_df, all_preds, probabilities=prob_preds)

    # 7. Generate Verification PDF
    logger.info("Generating official publication-quality verification report PDF...")
    rep_gen = VerificationReportGenerator()
    pdf_path = rep_gen.generate_pdf()

    # 8. Print Executive Comparison Table
    print("\n" + "=" * 80)
    print("        MONSOONIQ VERIFICATION SUMMARY ON HELD-OUT TEST YEARS (2022-2023)")
    print("=" * 80)
    print(f"{'System':<25} | {'RMSE (mm)':<10} | {'MAE (mm)':<10} | {'Bias (mm)':<10} | {'Heavy CSI (>=64.5)':<18}")
    print("-" * 80)
    for sys_id, name in [("raw_nwp", "Raw NWP"), ("global_qm", "Global QM"),
                         ("global_lgb", "Global LightGBM"), ("monsooniq", "MonsoonIQ (MoE)")]:
        c = summary["continuous_metrics"][sys_id]
        h_csi = summary["threshold_metrics"]["64.5"][sys_id]["csi"]
        print(f"{name:<25} | {c['rmse']:<10.2f} | {c['mae']:<10.2f} | {c['bias']:<+10.2f} | {h_csi:<18.3f}")
    print("=" * 80)
    print(f"Official PDF Report: {pdf_path}")
    print("=" * 80 + "\n")

    return summary


if __name__ == "__main__":
    run_evaluation_pipeline()
