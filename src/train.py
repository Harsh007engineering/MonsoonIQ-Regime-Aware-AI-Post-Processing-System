"""
MonsoonIQ End-to-End Training Pipeline.
Enforces strict time-based train/val/test split (no leakage).
Trains:
1. ML Regime Classifier (Calibrated LightGBM multiclass)
2. MonsoonIQ Mixture-of-Experts Engine (QM + Residual Experts per regime + Global baselines)
3. Quantile Regressor (P10, P50, P90 non-crossing)
4. Heavy Rain Probability Module (Calibrated binary models for 64.5, 115.6, 204.5 mm)
Saves all model artifacts to artifacts/models/.
"""

import os
import time
import logging
import numpy as np
import pandas as pd

from src.regime.ml_classifier import MLRegimeClassifier
from src.correction.mixture_of_experts import MonsoonIQMixtureOfExperts
from src.correction.quantile_regressor import QuantileRegressor
from src.heavy_rain.heavy_rain_classifier import HeavyRainProbabilityModule

logger = logging.getLogger("MonsoonIQ_Train")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


def run_training_pipeline(data_path: str = "data/synthetic/district_daily.parquet"):
    start_time = time.time()
    logger.info("=== Starting MonsoonIQ Training Pipeline ===")

    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}. Run generator first.")

    df = pd.read_parquet(data_path)
    logger.info(f"Loaded {len(df)} records across years: {sorted(df['year'].unique())}")

    # Strict time-based split: No random splitting, no future leakage
    train_mask = df["year"].isin([2016, 2017, 2018, 2019, 2020])
    val_mask = df["year"].isin([2021])
    test_mask = df["year"].isin([2022, 2023])

    train_df = df[train_mask].copy().reset_index(drop=True)
    val_df = df[val_mask].copy().reset_index(drop=True)
    test_df = df[test_mask].copy().reset_index(drop=True)

    logger.info(f"Temporal Splits -> Train: {len(train_df)} (2016-2020), Val: {len(val_df)} (2021), Test: {len(test_df)} (2022-2023)")

    # 1. Train ML Regime Classifier
    logger.info("--- Step 1: Training ML Regime Classifier ---")
    regime_clf = MLRegimeClassifier()
    regime_metrics = regime_clf.train(train_df, val_df, target_col="regime")
    logger.info(f"Regime Classifier Val Accuracy: {regime_metrics['validation_accuracy']:.4f}")

    # 2. Train Mixture-of-Experts Bias Correction
    logger.info("--- Step 2: Training Regime Mixture of Experts & Baselines ---")
    moe = MonsoonIQMixtureOfExperts()
    moe_metrics = moe.fit(train_df, val_df, nwp_col="raw_nwp_d1", obs_col="obs_rain_mean", regime_col="regime")
    logger.info("MoE and Baselines trained successfully.")

    # 3. Train Quantile Regressor (P10, P50, P90)
    logger.info("--- Step 3: Training Quantile Regressor (P10, P50, P90) ---")
    qr = QuantileRegressor()
    qr.fit(train_df, obs_col="obs_rain_mean", nwp_col="raw_nwp_d1")
    logger.info("Quantile Regressors fitted.")

    # 4. Train Heavy Rain Module
    logger.info("--- Step 4: Training Calibrated Heavy Rain Module ---")
    hrc = HeavyRainProbabilityModule()
    hrc_metrics = hrc.fit(train_df, val_df, target_col="obs_rain_max", nwp_col="raw_nwp_d1")
    logger.info(f"Heavy Rain Module fitted for thresholds: {list(hrc_metrics.keys())}")

    elapsed = round(time.time() - start_time, 2)
    logger.info(f"=== MonsoonIQ Training Pipeline Completed in {elapsed} seconds ===")
    return {
        "train_samples": len(train_df),
        "val_samples": len(val_df),
        "test_samples": len(test_df),
        "elapsed_seconds": elapsed
    }


if __name__ == "__main__":
    run_training_pipeline()
