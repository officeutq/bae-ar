"""
Ideal OBJ Render Warp Lab p,P dataset analysis.

This file is intentionally written as Colab-friendly cells. Open it in Colab
or paste each "# %%" block into a notebook cell.

Input:
  obj_pose_mapping_dataset_v2 JSON from tools/ideal-obj-render-warp-lab

Outputs:
  obj_pose_mapping_analysis_summary.md
  obj_pose_mapping_model_comparison.csv
  obj_pose_mapping_posewise_evaluation.csv
  obj_pose_mapping_excluded_samples.csv
  obj_pose_mapping_filtered_samples.csv
  pose_mapping_profile_candidate.json
  plots/*.png
"""

# %% [markdown]
# # 1. import / settings

# %%
from __future__ import annotations

import argparse
import json
import math
import os
import sys
import textwrap
import warnings
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

import numpy as np
import pandas as pd

try:
    import matplotlib.pyplot as plt
except Exception:
    plt = None

from sklearn.base import BaseEstimator, RegressorMixin, clone
from sklearn.exceptions import ConvergenceWarning
from sklearn.linear_model import LinearRegression, Ridge, RidgeCV
from sklearn.metrics import mean_squared_error
from sklearn.mixture import GaussianMixture
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsRegressor, NearestNeighbors
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import PolynomialFeatures, StandardScaler
from sklearn.tree import DecisionTreeRegressor


SEED = 42
POSE_COLUMNS = ["yaw", "pitch", "roll"]
INPUT_COLUMNS = ["P_yaw", "P_pitch", "P_roll"]
TARGET_COLUMNS = ["p_yaw", "p_pitch", "p_roll"]

HARD_POSE_MARGIN_DEG = 20.0
MAX_ABS_RETURNED_YAW_DEG = 90.0
MAX_ABS_RETURNED_PITCH_DEG = 90.0
MAX_ABS_RETURNED_ROLL_DEG = 90.0

EXPECTED_LANDMARK_COUNT = 478
FACE_BOUNDS_MARGIN = 0.5
MIN_LANDMARK_XY_SPAN = 0.02
MAX_LANDMARK_XY_SPAN = 2.0
MAX_ABS_LANDMARK_Z = 5.0

RESIDUAL_MAD_MULTIPLIER = 5.0
RESIDUAL_QUANTILE = 0.995
LOCAL_CONSISTENCY_ENABLED = True
LOCAL_CONSISTENCY_K = 12
LOCAL_CONSISTENCY_MAD_MULTIPLIER = 5.0
MIN_MODEL_SAMPLES = 40
TEST_SIZE = 0.2

RIDGE_ALPHAS = np.array([0.01, 0.1, 1.0, 10.0, 100.0, 1000.0])
TREE_MAX_DEPTH_CANDIDATES = [3, 4, 5, 6]
TREE_MIN_SAMPLES_LEAF_CANDIDATES = [40, 80, 120, 150, 200]
POLYNOMIAL_DEGREES = [3, 4, 5]
GMM_COMPONENT_CANDIDATES = [3, 4, 5, 6, 8, 10]
GMM_COVARIANCE_TYPES = ["full", "diag"]
GMM_MIN_EFFECTIVE_COMPONENT_SAMPLES = 25.0

EXCLUDED_RATIO_WARNING = 0.10
EXCLUDED_RATIO_STRONG_WARNING = 0.20

DEFAULT_OUTPUT_DIR = "obj_pose_mapping_analysis_outputs"


# %% [markdown]
# # 2. dataset JSON upload / load

# %%
def upload_dataset_in_colab() -> Path:
    try:
        from google.colab import files  # type: ignore
    except Exception as exc:
        raise RuntimeError("Colab upload is available only inside Google Colab.") from exc
    uploaded = files.upload()
    if not uploaded:
        raise RuntimeError("No file uploaded.")
    return Path(next(iter(uploaded.keys())))


def load_dataset_json(dataset_path: str | Path | None = None) -> dict[str, Any]:
    path = Path(dataset_path) if dataset_path else upload_dataset_in_colab()
    with path.open("r", encoding="utf-8") as file:
        data = json.load(file)
    if data.get("schemaVersion") not in {"obj_pose_mapping_dataset_v1", "obj_pose_mapping_dataset_v2"}:
        raise ValueError(f"Unsupported schemaVersion: {data.get('schemaVersion')}")
    data["_loadedPath"] = str(path)
    return data


# %% [markdown]
# # 3. samples flatten to DataFrame

# %%
def as_float(value: Any) -> float:
    try:
        return float(value)
    except Exception:
        return float("nan")


def get_nested(mapping: dict[str, Any], *keys: str, default: Any = None) -> Any:
    current: Any = mapping
    for key in keys:
        if not isinstance(current, dict) or key not in current:
            return default
        current = current[key]
    return current


def pose_to_columns(prefix: str, pose: dict[str, Any] | None) -> dict[str, float]:
    pose = pose or {}
    return {
        f"{prefix}_yaw": as_float(pose.get("yaw")),
        f"{prefix}_pitch": as_float(pose.get("pitch")),
        f"{prefix}_roll": as_float(pose.get("roll")),
    }


def normalize_landmark(raw: Any) -> dict[str, float] | None:
    if isinstance(raw, dict):
        x = raw.get("x")
        y = raw.get("y")
        z = raw.get("z", 0.0)
    elif isinstance(raw, (list, tuple)) and len(raw) >= 2:
        x = raw[0]
        y = raw[1]
        z = raw[2] if len(raw) >= 3 else 0.0
    else:
        return None
    return {"x": as_float(x), "y": as_float(y), "z": as_float(z)}


def extract_landmarks(sample: dict[str, Any]) -> list[dict[str, float]] | None:
    candidate_keys = [
        "landmarks",
        "faceLandmarks",
        "returnedLandmarks",
        "mediapipeLandmarks",
        "P_landmarks",
    ]
    raw: Any = None
    for key in candidate_keys:
        if key in sample:
            raw = sample[key]
            break
    if raw is None and isinstance(sample.get("result"), dict):
        raw = sample["result"].get("faceLandmarks") or sample["result"].get("landmarks")
    if raw is None:
        return None
    if isinstance(raw, list) and len(raw) == 1 and isinstance(raw[0], list):
        raw = raw[0]
    if not isinstance(raw, list):
        return None
    landmarks = [normalize_landmark(item) for item in raw]
    return [item for item in landmarks if item is not None]


def landmark_stats(landmarks: list[dict[str, float]] | None) -> dict[str, Any]:
    if landmarks is None:
        return {
            "landmarkPresent": False,
            "landmarkCount": np.nan,
            "landmarkMinX": np.nan,
            "landmarkMaxX": np.nan,
            "landmarkMinY": np.nan,
            "landmarkMaxY": np.nan,
            "landmarkMinZ": np.nan,
            "landmarkMaxZ": np.nan,
            "landmarkWidth": np.nan,
            "landmarkHeight": np.nan,
            "landmarkHasFiniteXYZ": np.nan,
        }
    xs = np.array([lm["x"] for lm in landmarks], dtype=float)
    ys = np.array([lm["y"] for lm in landmarks], dtype=float)
    zs = np.array([lm["z"] for lm in landmarks], dtype=float)
    finite = np.isfinite(xs).all() and np.isfinite(ys).all() and np.isfinite(zs).all()
    return {
        "landmarkPresent": True,
        "landmarkCount": len(landmarks),
        "landmarkMinX": float(np.nanmin(xs)) if len(xs) else np.nan,
        "landmarkMaxX": float(np.nanmax(xs)) if len(xs) else np.nan,
        "landmarkMinY": float(np.nanmin(ys)) if len(ys) else np.nan,
        "landmarkMaxY": float(np.nanmax(ys)) if len(ys) else np.nan,
        "landmarkMinZ": float(np.nanmin(zs)) if len(zs) else np.nan,
        "landmarkMaxZ": float(np.nanmax(zs)) if len(zs) else np.nan,
        "landmarkWidth": float(np.nanmax(xs) - np.nanmin(xs)) if len(xs) else np.nan,
        "landmarkHeight": float(np.nanmax(ys) - np.nanmin(ys)) if len(ys) else np.nan,
        "landmarkHasFiniteXYZ": bool(finite),
    }


def flatten_dataset(dataset: dict[str, Any]) -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    schema = dataset.get("schemaVersion")
    if schema == "obj_pose_mapping_dataset_v2":
        for index, sample in enumerate(dataset.get("samples", [])):
            row = {
                "sampleIndex": index,
                "sampleId": sample.get("sampleId", f"sample_{index}"),
                "poseId": sample.get("poseId"),
                "detected": bool(sample.get("detected", True)),
                "failureReason": "",
                "detectMs": sample.get("detectMs"),
            }
            row.update(pose_to_columns("p", sample.get("p")))
            row.update(pose_to_columns("P", sample.get("P")))
            row.update(landmark_stats(extract_landmarks(sample)))
            rows.append(row)
        offset = len(rows)
        for failed_index, sample in enumerate(dataset.get("failedSamples", [])):
            row = {
                "sampleIndex": offset + failed_index,
                "sampleId": sample.get("sampleId", f"failed_{failed_index}"),
                "poseId": sample.get("poseId"),
                "detected": False,
                "failureReason": sample.get("failureReason", "detect_failed"),
                "detectMs": sample.get("detectMs"),
            }
            row.update(pose_to_columns("p", sample.get("p")))
            row.update(pose_to_columns("P", None))
            row.update(landmark_stats(extract_landmarks(sample)))
            rows.append(row)
    else:
        for index, sample in enumerate(dataset.get("samples", [])):
            row = {
                "sampleIndex": index,
                "sampleId": sample.get("sampleId", f"sample_{index}"),
                "poseId": sample.get("poseId"),
                "detected": bool(sample.get("detected", False)),
                "failureReason": sample.get("errorMessage") or "",
                "detectMs": sample.get("detectMs"),
            }
            row.update(pose_to_columns("p", sample.get("p")))
            row.update(pose_to_columns("P", sample.get("P")))
            row.update(landmark_stats(extract_landmarks(sample)))
            rows.append(row)

    df = pd.DataFrame(rows)
    for col in TARGET_COLUMNS + INPUT_COLUMNS:
        if col not in df:
            df[col] = np.nan
        df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


def dataset_metadata(dataset: dict[str, Any]) -> dict[str, Any]:
    return {
        "schemaVersion": dataset.get("schemaVersion"),
        "createdAt": dataset.get("createdAt"),
        "loadedPath": dataset.get("_loadedPath"),
        "source": dataset.get("source") or dataset.get("objSummary"),
        "renderSettings": dataset.get("renderSettings"),
        "renderAppearance": dataset.get("renderAppearance"),
        "poseSampling": dataset.get("poseSampling"),
        "summary": dataset.get("summary") or dataset.get("counts"),
        "searchRange": dataset.get("searchRange"),
    }


# %% [markdown]
# # 4. hard filter

# %%
def infer_returned_pose_limits(raw_df: pd.DataFrame, dataset: dict[str, Any]) -> dict[str, tuple[float, float]]:
    limits: dict[str, tuple[float, float]] = {}
    hard_abs = {
        "yaw": MAX_ABS_RETURNED_YAW_DEG,
        "pitch": MAX_ABS_RETURNED_PITCH_DEG,
        "roll": MAX_ABS_RETURNED_ROLL_DEG,
    }
    search_range = dataset.get("searchRange") or {}
    for axis in POSE_COLUMNS:
        metadata_min = get_nested(search_range, axis, "min", default=None)
        metadata_max = get_nested(search_range, axis, "max", default=None)
        if metadata_min is None or metadata_max is None:
            values = raw_df[f"p_{axis}"].replace([np.inf, -np.inf], np.nan).dropna()
            if len(values) > 0:
                metadata_min = float(values.min())
                metadata_max = float(values.max())
        if metadata_min is None or metadata_max is None:
            metadata_min = -hard_abs[axis]
            metadata_max = hard_abs[axis]
        lo = max(-hard_abs[axis], float(metadata_min) - HARD_POSE_MARGIN_DEG)
        hi = min(hard_abs[axis], float(metadata_max) + HARD_POSE_MARGIN_DEG)
        limits[axis] = (lo, hi)
    return limits


def hard_filter(raw_df: pd.DataFrame, dataset: dict[str, Any]) -> tuple[pd.DataFrame, pd.DataFrame]:
    limits = infer_returned_pose_limits(raw_df, dataset)
    rows: list[pd.Series] = []
    excluded_rows: list[pd.Series] = []
    for _, row in raw_df.iterrows():
        reasons: list[str] = []
        if not bool(row.get("detected", False)):
            reasons.append("detect_failed")
        target_values = row[TARGET_COLUMNS].to_numpy(dtype=float)
        input_values = row[INPUT_COLUMNS].to_numpy(dtype=float)
        if not np.isfinite(target_values).all() or not np.isfinite(input_values).all():
            reasons.append("pose_nan")
        if np.isfinite(input_values).all():
            for axis in POSE_COLUMNS:
                value = float(row[f"P_{axis}"])
                lo, hi = limits[axis]
                if value < lo or value > hi:
                    reasons.append("returned_pose_out_of_range")
                    break
        if bool(row.get("landmarkPresent", False)):
            if int(row.get("landmarkCount", 0)) != EXPECTED_LANDMARK_COUNT:
                reasons.append("landmark_missing")
            if not bool(row.get("landmarkHasFiniteXYZ", False)):
                reasons.append("landmark_distribution_invalid")
            min_x, max_x = row.get("landmarkMinX"), row.get("landmarkMaxX")
            min_y, max_y = row.get("landmarkMinY"), row.get("landmarkMaxY")
            min_z, max_z = row.get("landmarkMinZ"), row.get("landmarkMaxZ")
            width, height = row.get("landmarkWidth"), row.get("landmarkHeight")
            if (
                min_x < -FACE_BOUNDS_MARGIN
                or max_x > 1.0 + FACE_BOUNDS_MARGIN
                or min_y < -FACE_BOUNDS_MARGIN
                or max_y > 1.0 + FACE_BOUNDS_MARGIN
            ):
                reasons.append("landmark_bounds_invalid")
            if (
                width < MIN_LANDMARK_XY_SPAN
                or height < MIN_LANDMARK_XY_SPAN
                or width > MAX_LANDMARK_XY_SPAN
                or height > MAX_LANDMARK_XY_SPAN
            ):
                reasons.append("landmark_bounds_invalid")
            if abs(min_z) > MAX_ABS_LANDMARK_Z or abs(max_z) > MAX_ABS_LANDMARK_Z:
                reasons.append("landmark_distribution_invalid")

        out = row.copy()
        out["excludedReasons"] = ";".join(sorted(set(reasons)))
        out["hardExcluded"] = bool(reasons)
        if reasons:
            excluded_rows.append(out)
        else:
            rows.append(out)
    kept_df = pd.DataFrame(rows).reset_index(drop=True)
    hard_excluded_df = pd.DataFrame(excluded_rows).reset_index(drop=True)
    return kept_df, hard_excluded_df


# %% [markdown]
# # 5. residual outlier detection

# %%
def finite_model_df(df: pd.DataFrame) -> pd.DataFrame:
    mask = df[INPUT_COLUMNS + TARGET_COLUMNS].replace([np.inf, -np.inf], np.nan).notna().all(axis=1)
    return df[mask].copy().reset_index(drop=True)


def pose_error_magnitude(y_true: np.ndarray, y_pred: np.ndarray) -> np.ndarray:
    return np.sqrt(np.sum((y_pred - y_true) ** 2, axis=1))


def robust_threshold(values: np.ndarray, multiplier: float, quantile: float | None = None) -> float:
    values = np.asarray(values, dtype=float)
    values = values[np.isfinite(values)]
    if len(values) == 0:
        return float("inf")
    median = float(np.median(values))
    mad = float(np.median(np.abs(values - median)))
    mad_sigma = 1.4826 * mad
    threshold = median + multiplier * max(mad_sigma, 1e-9)
    if quantile is not None and 0.0 < quantile < 1.0:
        threshold = max(threshold, float(np.quantile(values, quantile)))
    return threshold


def baseline_degree2_ridge() -> Pipeline:
    return Pipeline([
        ("poly", PolynomialFeatures(degree=2, include_bias=False)),
        ("scaler", StandardScaler()),
        ("ridge", RidgeCV(alphas=RIDGE_ALPHAS)),
    ])


def detect_residual_outliers(hard_kept_df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, dict[str, Any]]:
    model_df = finite_model_df(hard_kept_df)
    if len(model_df) < MIN_MODEL_SAMPLES:
        summary = {
            "warning": f"Too few samples for residual outlier detection: {len(model_df)}",
            "residualThreshold": None,
            "localDeviationThreshold": None,
        }
        kept = hard_kept_df.copy()
        kept["residualMagnitude"] = np.nan
        kept["nearestLocalDeviation"] = np.nan
        return kept, hard_kept_df.iloc[0:0].copy(), summary

    X = model_df[INPUT_COLUMNS].to_numpy(dtype=float)
    y = model_df[TARGET_COLUMNS].to_numpy(dtype=float)
    baseline = baseline_degree2_ridge()
    baseline.fit(X, y)
    pred = baseline.predict(X)
    residual = pose_error_magnitude(y, pred)
    residual_threshold = robust_threshold(residual, RESIDUAL_MAD_MULTIPLIER, RESIDUAL_QUANTILE)

    local_deviation = np.zeros(len(model_df), dtype=float)
    local_threshold = None
    if LOCAL_CONSISTENCY_ENABLED and len(model_df) > LOCAL_CONSISTENCY_K + 1:
        neighbor_count = min(LOCAL_CONSISTENCY_K + 1, len(model_df))
        nn = NearestNeighbors(n_neighbors=neighbor_count)
        nn.fit(X)
        _, indices = nn.kneighbors(X)
        for row_index, neighbor_indices in enumerate(indices):
            neighbor_indices = neighbor_indices[neighbor_indices != row_index]
            median_neighbor_p = np.median(y[neighbor_indices], axis=0)
            local_deviation[row_index] = float(np.sqrt(np.sum((y[row_index] - median_neighbor_p) ** 2)))
        local_threshold = robust_threshold(local_deviation, LOCAL_CONSISTENCY_MAD_MULTIPLIER, RESIDUAL_QUANTILE)
    else:
        local_deviation[:] = np.nan

    model_df["residualMagnitude"] = residual
    model_df["nearestLocalDeviation"] = local_deviation
    residual_only_mask = model_df["residualMagnitude"] > residual_threshold
    local_only_mask = np.zeros(len(model_df), dtype=bool)
    residual_mask = residual_only_mask.copy()
    if local_threshold is not None:
        local_only_mask = (model_df["nearestLocalDeviation"] > local_threshold).to_numpy(dtype=bool)
        residual_mask = residual_mask | local_only_mask

    outlier_ids = set(model_df.loc[residual_mask, "sampleId"])
    residual_outlier_ids = set(model_df.loc[residual_only_mask, "sampleId"])
    local_outlier_ids = set(model_df.loc[local_only_mask, "sampleId"])
    residual_outliers: list[pd.Series] = []
    kept_rows: list[pd.Series] = []
    residual_lookup = model_df.set_index("sampleId")[["residualMagnitude", "nearestLocalDeviation"]]
    for _, row in hard_kept_df.iterrows():
        out = row.copy()
        if row["sampleId"] in residual_lookup.index:
            out["residualMagnitude"] = residual_lookup.loc[row["sampleId"], "residualMagnitude"]
            out["nearestLocalDeviation"] = residual_lookup.loc[row["sampleId"], "nearestLocalDeviation"]
        else:
            out["residualMagnitude"] = np.nan
            out["nearestLocalDeviation"] = np.nan
        if row["sampleId"] in outlier_ids:
            reasons = []
            if row["sampleId"] in residual_outlier_ids:
                reasons.append("residual_outlier")
            if row["sampleId"] in local_outlier_ids:
                reasons.append("local_consistency_outlier")
            out["excludedReasons"] = ";".join(reasons)
            out["residualExcluded"] = True
            residual_outliers.append(out)
        else:
            out["residualExcluded"] = False
            kept_rows.append(out)

    summary = {
        "residualThreshold": residual_threshold,
        "localDeviationThreshold": local_threshold,
        "residualMedian": float(np.median(residual)),
        "residualP95": float(np.quantile(residual, 0.95)),
        "residualP99": float(np.quantile(residual, 0.99)),
        "residualMax": float(np.max(residual)),
    }
    return (
        pd.DataFrame(kept_rows).reset_index(drop=True),
        pd.DataFrame(residual_outliers).reset_index(drop=True),
        summary,
    )


# %% [markdown]
# # 6. raw / filtered dataset summary

# %%
def reason_counts(excluded_df: pd.DataFrame) -> Counter:
    counter: Counter = Counter()
    if "excludedReasons" not in excluded_df:
        return counter
    for text in excluded_df["excludedReasons"].fillna(""):
        for reason in str(text).split(";"):
            if reason:
                counter[reason] += 1
    return counter


def pose_ranges(df: pd.DataFrame) -> dict[str, dict[str, float | None]]:
    ranges: dict[str, dict[str, float | None]] = {}
    for col in TARGET_COLUMNS + INPUT_COLUMNS:
        values = pd.to_numeric(df.get(col), errors="coerce").replace([np.inf, -np.inf], np.nan).dropna()
        ranges[col] = {
            "min": float(values.min()) if len(values) else None,
            "max": float(values.max()) if len(values) else None,
        }
    return ranges


def add_pose_buckets(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    for axis in POSE_COLUMNS:
        values = out[f"p_{axis}"].replace([np.inf, -np.inf], np.nan)
        finite = values.dropna()
        if len(finite) >= 4:
            bins = np.unique(np.quantile(finite, [0.0, 0.25, 0.5, 0.75, 1.0]))
            if len(bins) > 1:
                out[f"{axis}Bucket"] = pd.cut(values, bins=bins, include_lowest=True).astype(str)
            else:
                out[f"{axis}Bucket"] = "all"
            edge_threshold = float(np.quantile(np.abs(finite), 0.8))
        else:
            out[f"{axis}Bucket"] = "all"
            edge_threshold = 0.0
        out[f"{axis}Edge"] = np.abs(values) >= edge_threshold
    edge_flags = [out[f"{axis}Edge"].fillna(False) for axis in POSE_COLUMNS]
    out["mixedExtremePose"] = (edge_flags[0].astype(int) + edge_flags[1].astype(int) + edge_flags[2].astype(int)) >= 2
    return out


def exclusion_by_bucket(raw_df: pd.DataFrame, excluded_df: pd.DataFrame) -> pd.DataFrame:
    raw_bucketed = add_pose_buckets(raw_df)
    excluded_ids = set(excluded_df.get("sampleId", []))
    raw_bucketed["excluded"] = raw_bucketed["sampleId"].isin(excluded_ids)
    rows: list[dict[str, Any]] = []
    for axis in POSE_COLUMNS:
        bucket_col = f"{axis}Bucket"
        for bucket, group in raw_bucketed.groupby(bucket_col, dropna=False):
            rows.append({
                "bucketKind": bucket_col,
                "bucket": str(bucket),
                "sampleCount": len(group),
                "excludedCount": int(group["excluded"].sum()),
                "excludedRatio": float(group["excluded"].mean()) if len(group) else 0.0,
            })
    for flag in ["yawEdge", "pitchEdge", "rollEdge", "mixedExtremePose"]:
        for bucket, group in raw_bucketed.groupby(flag, dropna=False):
            rows.append({
                "bucketKind": flag,
                "bucket": str(bucket),
                "sampleCount": len(group),
                "excludedCount": int(group["excluded"].sum()),
                "excludedRatio": float(group["excluded"].mean()) if len(group) else 0.0,
            })
    return pd.DataFrame(rows)


def dataset_filter_summary(
    raw_df: pd.DataFrame,
    hard_excluded_df: pd.DataFrame,
    residual_excluded_df: pd.DataFrame,
    filtered_df: pd.DataFrame,
) -> dict[str, Any]:
    excluded_df = pd.concat([hard_excluded_df, residual_excluded_df], ignore_index=True)
    excluded_ratio = len(excluded_df) / len(raw_df) if len(raw_df) else 0.0
    warning = ""
    if excluded_ratio > EXCLUDED_RATIO_STRONG_WARNING:
        warning = "strong warning: excluded ratio > 20%"
    elif excluded_ratio > EXCLUDED_RATIO_WARNING:
        warning = "warning: excluded ratio > 10%"
    return {
        "rawSampleCount": int(len(raw_df)),
        "hardFilterExcludedCount": int(len(hard_excluded_df)),
        "residualOutlierExcludedCount": int(len(residual_excluded_df)),
        "filteredSampleCount": int(len(filtered_df)),
        "excludedSampleCount": int(len(excluded_df)),
        "excludedRatio": float(excluded_ratio),
        "warning": warning,
        "excludedReasonCounts": dict(reason_counts(excluded_df)),
        "poseRangeBefore": pose_ranges(raw_df),
        "poseRangeAfter": pose_ranges(filtered_df),
    }


# %% [markdown]
# # 7. train / test split

# %%
def make_model_dataset(raw_df: pd.DataFrame, filtered_df: pd.DataFrame) -> dict[str, pd.DataFrame]:
    raw_model_df = finite_model_df(raw_df[raw_df["detected"] == True].copy())
    filtered_model_df = finite_model_df(filtered_df.copy())
    return {"raw": raw_model_df, "filtered": filtered_model_df}


def split_dataset(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    if len(df) < MIN_MODEL_SAMPLES:
        raise ValueError(f"Too few model samples: {len(df)}")
    return train_test_split(df, test_size=TEST_SIZE, random_state=SEED, shuffle=True)


# %% [markdown]
# # 8. model helpers and baseline models

# %%
def model_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    errors = y_pred - y_true
    mag = pose_error_magnitude(y_true, y_pred)
    metrics = {
        "poseMAE": float(np.mean(np.abs(mag))),
        "poseRMSE": float(math.sqrt(mean_squared_error(np.zeros_like(mag), mag))),
        "poseP50": float(np.quantile(mag, 0.50)),
        "poseP95": float(np.quantile(mag, 0.95)),
        "poseP99": float(np.quantile(mag, 0.99)),
        "poseMAX": float(np.max(mag)),
    }
    for axis_index, axis in enumerate(POSE_COLUMNS):
        axis_abs = np.abs(errors[:, axis_index])
        metrics[f"{axis}MAE"] = float(np.mean(axis_abs))
        metrics[f"{axis}P95"] = float(np.quantile(axis_abs, 0.95))
        metrics[f"{axis}MAX"] = float(np.max(axis_abs))
    return metrics


def make_baseline_models(train_count: int) -> list[tuple[str, Any, str]]:
    knn_neighbors = min(15, max(3, int(math.sqrt(train_count))))
    return [
        (
            "linear_regression",
            Pipeline([("scaler", StandardScaler()), ("linear", LinearRegression())]),
            "baseline linear regression",
        ),
        (
            "polynomial_degree2_ridgecv",
            baseline_degree2_ridge(),
            "baseline degree2 polynomial + RidgeCV",
        ),
        (
            f"knn_regression_k{knn_neighbors}",
            Pipeline([("scaler", StandardScaler()), ("knn", KNeighborsRegressor(n_neighbors=knn_neighbors, weights="distance"))]),
            "baseline KNN regression",
        ),
        (
            "knn_regression_k1_reference",
            Pipeline([("scaler", StandardScaler()), ("knn", KNeighborsRegressor(n_neighbors=1))]),
            "reference memory-like full KNN",
        ),
    ]


def fit_predict(model: Any, train_df: pd.DataFrame, test_df: pd.DataFrame) -> np.ndarray:
    X_train = train_df[INPUT_COLUMNS].to_numpy(dtype=float)
    y_train = train_df[TARGET_COLUMNS].to_numpy(dtype=float)
    X_test = test_df[INPUT_COLUMNS].to_numpy(dtype=float)
    model.fit(X_train, y_train)
    return np.asarray(model.predict(X_test), dtype=float)


def evaluate_model(model: Any, train_df: pd.DataFrame, test_df: pd.DataFrame) -> dict[str, float]:
    y_test = test_df[TARGET_COLUMNS].to_numpy(dtype=float)
    pred = fit_predict(model, train_df, test_df)
    return model_metrics(y_test, pred)


# %% [markdown]
# # 9. Decision Tree + degree2 regression

# %%
@dataclass
class ExpertRidgeModel:
    degree: int = 2
    alphas: Iterable[float] = tuple(RIDGE_ALPHAS.tolist())
    poly: PolynomialFeatures | None = None
    scaler: StandardScaler | None = None
    ridge: RidgeCV | Ridge | None = None

    def fit(self, X: np.ndarray, y: np.ndarray, sample_weight: np.ndarray | None = None) -> "ExpertRidgeModel":
        self.poly = PolynomialFeatures(degree=self.degree, include_bias=False)
        X_poly = self.poly.fit_transform(X)
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X_poly)
        if sample_weight is None:
            self.ridge = RidgeCV(alphas=np.array(list(self.alphas)))
            self.ridge.fit(X_scaled, y)
        else:
            best_alpha = float(list(self.alphas)[0])
            best_score = float("inf")
            for alpha in self.alphas:
                ridge = Ridge(alpha=float(alpha))
                ridge.fit(X_scaled, y, sample_weight=sample_weight)
                pred = ridge.predict(X_scaled)
                score = float(np.average(pose_error_magnitude(y, pred), weights=sample_weight))
                if score < best_score:
                    best_score = score
                    best_alpha = float(alpha)
            self.ridge = Ridge(alpha=best_alpha)
            self.ridge.fit(X_scaled, y, sample_weight=sample_weight)
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        if self.poly is None or self.scaler is None or self.ridge is None:
            raise RuntimeError("ExpertRidgeModel is not fitted.")
        return self.ridge.predict(self.scaler.transform(self.poly.transform(X)))

    def to_json(self) -> dict[str, Any]:
        if self.poly is None or self.scaler is None or self.ridge is None:
            raise RuntimeError("ExpertRidgeModel is not fitted.")
        return {
            "degree": self.degree,
            "featureNames": list(self.poly.get_feature_names_out(INPUT_COLUMNS)),
            "scaler": {
                "mean": self.scaler.mean_.tolist(),
                "scale": self.scaler.scale_.tolist(),
            },
            "ridge": {
                "alpha": float(getattr(self.ridge, "alpha_", getattr(self.ridge, "alpha", np.nan))),
                "coef": np.asarray(self.ridge.coef_).tolist(),
                "intercept": np.asarray(self.ridge.intercept_).tolist(),
            },
        }


class TreeQuadraticRegressor(BaseEstimator, RegressorMixin):
    def __init__(self, max_depth: int = 4, min_samples_leaf: int = 80, alphas: Iterable[float] = tuple(RIDGE_ALPHAS.tolist())):
        self.max_depth = max_depth
        self.min_samples_leaf = min_samples_leaf
        self.alphas = tuple(alphas)
        self.tree_: DecisionTreeRegressor | None = None
        self.experts_: dict[int, ExpertRidgeModel] = {}
        self.global_: ExpertRidgeModel | None = None

    def fit(self, X: np.ndarray, y: np.ndarray) -> "TreeQuadraticRegressor":
        self.tree_ = DecisionTreeRegressor(
            max_depth=self.max_depth,
            min_samples_leaf=self.min_samples_leaf,
            random_state=SEED,
        )
        self.tree_.fit(X, y)
        leaves = self.tree_.apply(X)
        self.global_ = ExpertRidgeModel(degree=2, alphas=self.alphas).fit(X, y)
        self.experts_ = {}
        for leaf in np.unique(leaves):
            mask = leaves == leaf
            if int(mask.sum()) < max(6, min(self.min_samples_leaf, 20)):
                continue
            self.experts_[int(leaf)] = ExpertRidgeModel(degree=2, alphas=self.alphas).fit(X[mask], y[mask])
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        if self.tree_ is None or self.global_ is None:
            raise RuntimeError("TreeQuadraticRegressor is not fitted.")
        leaves = self.tree_.apply(X)
        preds = []
        for index, leaf in enumerate(leaves):
            expert = self.experts_.get(int(leaf), self.global_)
            preds.append(expert.predict(X[index : index + 1])[0])
        return np.asarray(preds)

    def to_json(self) -> dict[str, Any]:
        if self.tree_ is None or self.global_ is None:
            raise RuntimeError("TreeQuadraticRegressor is not fitted.")
        tree = self.tree_.tree_
        return {
            "modelType": "decision_tree_gate_polynomial_degree2_ridge",
            "inputFeatures": INPUT_COLUMNS,
            "target": TARGET_COLUMNS,
            "maxDepth": self.max_depth,
            "minSamplesLeaf": self.min_samples_leaf,
            "tree": {
                "childrenLeft": tree.children_left.tolist(),
                "childrenRight": tree.children_right.tolist(),
                "feature": tree.feature.tolist(),
                "threshold": tree.threshold.tolist(),
            },
            "experts": {str(leaf): expert.to_json() for leaf, expert in self.experts_.items()},
            "fallbackModel": self.global_.to_json(),
        }


def tree_quadratic_candidates() -> list[tuple[str, TreeQuadraticRegressor, str]]:
    candidates = []
    for depth in TREE_MAX_DEPTH_CANDIDATES:
        for leaf in TREE_MIN_SAMPLES_LEAF_CANDIDATES:
            candidates.append((
                f"model_tree_depth{depth}_leaf{leaf}_polynomial_degree2",
                TreeQuadraticRegressor(max_depth=depth, min_samples_leaf=leaf),
                "decision tree assignment + per-leaf degree2 RidgeCV",
            ))
    return candidates


# %% [markdown]
# # 10. Higher degree polynomial regression

# %%
def polynomial_candidates() -> list[tuple[str, Any, str]]:
    return [
        (
            f"polynomial_degree{degree}_ridgecv",
            Pipeline([
                ("poly", PolynomialFeatures(degree=degree, include_bias=False)),
                ("scaler", StandardScaler()),
                ("ridge", RidgeCV(alphas=RIDGE_ALPHAS)),
            ]),
            f"degree {degree} polynomial + RidgeCV",
        )
        for degree in POLYNOMIAL_DEGREES
    ]


# %% [markdown]
# # 11. GMM soft gate + degree2 regression

# %%
class GmmGateQuadraticRegressor(BaseEstimator, RegressorMixin):
    def __init__(
        self,
        n_components: int = 6,
        covariance_type: str = "full",
        min_effective_samples: float = GMM_MIN_EFFECTIVE_COMPONENT_SAMPLES,
        alphas: Iterable[float] = tuple(RIDGE_ALPHAS.tolist()),
    ):
        self.n_components = n_components
        self.covariance_type = covariance_type
        self.min_effective_samples = min_effective_samples
        self.alphas = tuple(alphas)
        self.gmm_: GaussianMixture | None = None
        self.experts_: dict[int, ExpertRidgeModel] = {}
        self.fallback_: ExpertRidgeModel | None = None
        self.weight_summary_: dict[str, Any] = {}

    def fit(self, X: np.ndarray, y: np.ndarray) -> "GmmGateQuadraticRegressor":
        self.fallback_ = ExpertRidgeModel(degree=2, alphas=self.alphas).fit(X, y)
        self.gmm_ = GaussianMixture(
            n_components=self.n_components,
            covariance_type=self.covariance_type,
            random_state=SEED,
            reg_covar=1e-5,
            max_iter=300,
        )
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", ConvergenceWarning)
            self.gmm_.fit(X)
        resp = self.gmm_.predict_proba(X)
        effective = resp.sum(axis=0)
        self.experts_ = {}
        for component_index, effective_count in enumerate(effective):
            if effective_count < self.min_effective_samples:
                continue
            self.experts_[component_index] = ExpertRidgeModel(degree=2, alphas=self.alphas).fit(
                X,
                y,
                sample_weight=resp[:, component_index],
            )
        max_weights = resp.max(axis=1)
        self.weight_summary_ = {
            "componentEffectiveSamples": effective.tolist(),
            "activeComponentCount": len(self.experts_),
            "maxResponsibilityMean": float(max_weights.mean()),
            "maxResponsibilityP95": float(np.quantile(max_weights, 0.95)),
            "maxResponsibilityMin": float(max_weights.min()),
        }
        if not self.experts_:
            raise ValueError("No GMM components have enough effective samples.")
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        if self.gmm_ is None or self.fallback_ is None:
            raise RuntimeError("GmmGateQuadraticRegressor is not fitted.")
        resp = self.gmm_.predict_proba(X)
        fallback_pred = self.fallback_.predict(X)
        pred = np.zeros_like(fallback_pred)
        total_weight = np.zeros((len(X), 1), dtype=float)
        for component_index, expert in self.experts_.items():
            weight = resp[:, component_index : component_index + 1]
            pred += weight * expert.predict(X)
            total_weight += weight
        missing = total_weight[:, 0] <= 1e-9
        pred[~missing] = pred[~missing] / total_weight[~missing]
        pred[missing] = fallback_pred[missing]
        return pred

    def to_json(self) -> dict[str, Any]:
        if self.gmm_ is None or self.fallback_ is None:
            raise RuntimeError("GmmGateQuadraticRegressor is not fitted.")
        return {
            "modelType": "gmm_gate_polynomial_degree2_ridge",
            "inputFeatures": INPUT_COLUMNS,
            "target": TARGET_COLUMNS,
            "nComponents": self.n_components,
            "covarianceType": self.covariance_type,
            "gmm": {
                "weights": self.gmm_.weights_.tolist(),
                "means": self.gmm_.means_.tolist(),
                "covariances": self.gmm_.covariances_.tolist(),
                "precisionsCholesky": self.gmm_.precisions_cholesky_.tolist(),
            },
            "experts": {str(index): expert.to_json() for index, expert in self.experts_.items()},
            "fallbackModel": self.fallback_.to_json(),
            "weightSummary": self.weight_summary_,
        }


def gmm_gate_candidates() -> list[tuple[str, GmmGateQuadraticRegressor, str]]:
    candidates = []
    for n_components in GMM_COMPONENT_CANDIDATES:
        for covariance_type in GMM_COVARIANCE_TYPES:
            candidates.append((
                f"gmm_gate_components{n_components}_{covariance_type}_expert_polynomial_degree2",
                GmmGateQuadraticRegressor(n_components=n_components, covariance_type=covariance_type),
                "GMM soft gate + degree2 Ridge experts",
            ))
    return candidates


# %% [markdown]
# # 12. model comparison

# %%
def continuity_paths(df: pd.DataFrame, points_per_path: int = 80) -> dict[str, np.ndarray]:
    values = df[INPUT_COLUMNS].to_numpy(dtype=float)
    center = np.median(values, axis=0)
    lo = np.quantile(values, 0.02, axis=0)
    hi = np.quantile(values, 0.98, axis=0)
    paths: dict[str, np.ndarray] = {}
    for axis_index, axis in enumerate(POSE_COLUMNS):
        path = np.tile(center, (points_per_path, 1))
        path[:, axis_index] = np.linspace(lo[axis_index], hi[axis_index], points_per_path)
        paths[f"{axis}_sweep"] = path
    mixed = np.tile(center, (points_per_path, 1))
    mixed[:, 0] = np.linspace(lo[0], hi[0], points_per_path)
    mixed[:, 1] = np.linspace(lo[1], hi[1], points_per_path)
    paths["mixed_yaw_pitch_sweep"] = mixed
    return paths


def continuity_metrics(model: Any, reference_df: pd.DataFrame) -> dict[str, float]:
    jumps: list[float] = []
    for path in continuity_paths(reference_df).values():
        pred = np.asarray(model.predict(path), dtype=float)
        diffs = np.diff(pred, axis=0)
        jumps.extend(np.sqrt(np.sum(diffs**2, axis=1)).tolist())
    jumps_arr = np.asarray(jumps, dtype=float)
    if len(jumps_arr) == 0:
        return {"continuityJumpMean": np.nan, "continuityJumpP95": np.nan, "continuityJumpMax": np.nan}
    return {
        "continuityJumpMean": float(np.mean(jumps_arr)),
        "continuityJumpP95": float(np.quantile(jumps_arr, 0.95)),
        "continuityJumpMax": float(np.max(jumps_arr)),
    }


def all_model_candidates(train_count: int) -> list[tuple[str, Any, str]]:
    return (
        make_baseline_models(train_count)
        + tree_quadratic_candidates()
        + polynomial_candidates()
        + gmm_gate_candidates()
    )


def compare_models(datasets: dict[str, pd.DataFrame]) -> tuple[pd.DataFrame, dict[str, Any], dict[str, tuple[pd.DataFrame, pd.DataFrame]]]:
    rows: list[dict[str, Any]] = []
    fitted: dict[str, Any] = {}
    splits: dict[str, tuple[pd.DataFrame, pd.DataFrame]] = {}
    for dataset_kind, df in datasets.items():
        if len(df) < MIN_MODEL_SAMPLES:
            rows.append({
                "datasetKind": dataset_kind,
                "modelName": "skipped",
                "notes": f"Too few samples: {len(df)}",
            })
            continue
        train_df, test_df = split_dataset(df)
        splits[dataset_kind] = (train_df, test_df)
        for model_name, model, notes in all_model_candidates(len(train_df)):
            row = {"datasetKind": dataset_kind, "modelName": model_name, "notes": notes}
            try:
                model_instance = clone(model) if hasattr(model, "get_params") else model
                metrics = evaluate_model(model_instance, train_df, test_df)
                cont = continuity_metrics(model_instance, df)
                row.update(metrics)
                row.update(cont)
                if isinstance(model_instance, GmmGateQuadraticRegressor):
                    row["notes"] = f"{notes}; weightSummary={model_instance.weight_summary_}"
                fitted[f"{dataset_kind}::{model_name}"] = model_instance
            except Exception as exc:
                row["notes"] = f"{notes}; failed: {type(exc).__name__}: {exc}"
            rows.append(row)
    return pd.DataFrame(rows), fitted, splits


# %% [markdown]
# # 13. pose-wise evaluation

# %%
def error_summary_from_errors(errors: np.ndarray) -> dict[str, float]:
    if len(errors) == 0:
        return {"poseMAE": np.nan, "poseP95": np.nan, "poseMAX": np.nan}
    mag = np.sqrt(np.sum(errors**2, axis=1))
    return {
        "poseMAE": float(np.mean(np.abs(mag))),
        "poseP95": float(np.quantile(mag, 0.95)),
        "poseMAX": float(np.max(mag)),
    }


def posewise_evaluation(
    comparison_df: pd.DataFrame,
    fitted: dict[str, Any],
    splits: dict[str, tuple[pd.DataFrame, pd.DataFrame]],
    top_n_per_dataset: int = 5,
) -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    valid = comparison_df.dropna(subset=["poseP95", "poseMAX", "continuityJumpMax"], how="any")
    for dataset_kind, group in valid.groupby("datasetKind"):
        selected = group.sort_values(["poseP95", "poseMAX", "continuityJumpMax"]).head(top_n_per_dataset)
        if dataset_kind not in splits:
            continue
        _, test_df = splits[dataset_kind]
        bucketed = add_pose_buckets(test_df.reset_index(drop=True))
        X = bucketed[INPUT_COLUMNS].to_numpy(dtype=float)
        y = bucketed[TARGET_COLUMNS].to_numpy(dtype=float)
        for _, model_row in selected.iterrows():
            model_name = model_row["modelName"]
            model = fitted.get(f"{dataset_kind}::{model_name}")
            if model is None:
                continue
            pred = model.predict(X)
            errors = pred - y
            for axis in POSE_COLUMNS:
                bucket_col = f"{axis}Bucket"
                for bucket, bucket_df in bucketed.groupby(bucket_col, dropna=False):
                    indices = bucket_df.index.to_numpy()
                    summary = error_summary_from_errors(errors[indices])
                    rows.append({
                        "datasetKind": dataset_kind,
                        "modelName": model_name,
                        "bucketKind": bucket_col,
                        "bucket": str(bucket),
                        "sampleCount": len(indices),
                        **summary,
                    })
                edge_col = f"{axis}Edge"
                for bucket, bucket_df in bucketed.groupby(edge_col, dropna=False):
                    indices = bucket_df.index.to_numpy()
                    summary = error_summary_from_errors(errors[indices])
                    rows.append({
                        "datasetKind": dataset_kind,
                        "modelName": model_name,
                        "bucketKind": edge_col,
                        "bucket": str(bucket),
                        "sampleCount": len(indices),
                        **summary,
                    })
            for bucket, bucket_df in bucketed.groupby("mixedExtremePose", dropna=False):
                indices = bucket_df.index.to_numpy()
                summary = error_summary_from_errors(errors[indices])
                rows.append({
                    "datasetKind": dataset_kind,
                    "modelName": model_name,
                    "bucketKind": "mixedExtremePose",
                    "bucket": str(bucket),
                    "sampleCount": len(indices),
                    **summary,
                })
    return pd.DataFrame(rows)


# %% [markdown]
# # 14. continuity evaluation

# %%
def continuity_path_predictions(model: Any, df: pd.DataFrame) -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    for path_name, path in continuity_paths(df).items():
        pred = model.predict(path)
        for index, (input_pose, output_pose) in enumerate(zip(path, pred)):
            jump = np.nan
            if index > 0:
                jump = float(np.sqrt(np.sum((pred[index] - pred[index - 1]) ** 2)))
            rows.append({
                "path": path_name,
                "index": index,
                "P_yaw": input_pose[0],
                "P_pitch": input_pose[1],
                "P_roll": input_pose[2],
                "pred_p_yaw": output_pose[0],
                "pred_p_pitch": output_pose[1],
                "pred_p_roll": output_pose[2],
                "jump": jump,
            })
    return pd.DataFrame(rows)


# %% [markdown]
# # 15. exports and plots

# %%
def choose_best_model(comparison_df: pd.DataFrame) -> pd.Series:
    valid = comparison_df.dropna(subset=["poseP95", "poseMAX", "continuityJumpMax"]).copy()
    valid = valid[~valid["modelName"].eq("knn_regression_k1_reference")]
    preferred = valid[valid["modelName"].map(is_profile_candidate_model)].copy()
    if not preferred.empty:
        valid = preferred
    if valid.empty:
        raise RuntimeError("No valid model result.")
    type_priority = valid["modelName"].map(model_runtime_priority)
    valid["runtimePriority"] = type_priority
    return valid.sort_values(
        ["poseP95", "poseMAX", "continuityJumpMax", "runtimePriority", "poseMAE"],
        ascending=[True, True, True, True, True],
    ).iloc[0]


def model_runtime_priority(model_name: str) -> int:
    if model_name.startswith("model_tree_"):
        return 0
    if model_name.startswith("gmm_gate_"):
        return 1
    if model_name.startswith("polynomial_"):
        return 2
    if model_name.startswith("polynomial_degree2"):
        return 2
    return 3


def is_profile_candidate_model(model_name: str) -> bool:
    return (
        model_name.startswith("model_tree_")
        or model_name.startswith("gmm_gate_")
        or model_name.startswith("polynomial_")
    )


def serialize_model(model: Any) -> dict[str, Any]:
    if hasattr(model, "to_json"):
        return model.to_json()
    if isinstance(model, Pipeline):
        poly = model.named_steps.get("poly")
        scaler = model.named_steps.get("scaler")
        ridge = model.named_steps.get("ridge")
        linear = model.named_steps.get("linear")
        regressor = ridge or linear
        if scaler is not None and regressor is not None:
            if poly is not None:
                degree = int(poly.degree)
                feature_names = list(poly.get_feature_names_out(INPUT_COLUMNS))
            else:
                degree = 1
                feature_names = INPUT_COLUMNS
            return {
                "modelType": "polynomial_or_linear_pipeline",
                "inputFeatures": INPUT_COLUMNS,
                "target": TARGET_COLUMNS,
                "polynomial": {
                    "degree": degree,
                    "featureNames": feature_names,
                },
                "scaler": {
                    "mean": scaler.mean_.tolist(),
                    "scale": scaler.scale_.tolist(),
                },
                "regressor": {
                    "coef": np.asarray(regressor.coef_).tolist(),
                    "intercept": np.asarray(regressor.intercept_).tolist(),
                    "alpha": float(getattr(regressor, "alpha_", np.nan)),
                },
            }
    raise TypeError(f"Model is not serializable: {type(model).__name__}")


def markdown_table(df: pd.DataFrame) -> str:
    if len(df) == 0:
        return ""
    try:
        return df.to_markdown(index=False)
    except Exception:
        return df.to_csv(index=False)


def save_plots(
    output_dir: Path,
    raw_df: pd.DataFrame,
    filtered_df: pd.DataFrame,
    excluded_df: pd.DataFrame,
    comparison_df: pd.DataFrame,
    residual_summary: dict[str, Any],
) -> None:
    if plt is None:
        return
    plot_dir = output_dir / "plots"
    plot_dir.mkdir(parents=True, exist_ok=True)

    plt.figure(figsize=(8, 5))
    plt.scatter(raw_df["P_yaw"], raw_df["P_pitch"], s=8, alpha=0.35, label="raw")
    plt.scatter(filtered_df["P_yaw"], filtered_df["P_pitch"], s=8, alpha=0.6, label="filtered")
    plt.xlabel("P_yaw")
    plt.ylabel("P_pitch")
    plt.legend()
    plt.title("raw vs filtered P distribution")
    plt.tight_layout()
    plt.savefig(plot_dir / "raw_vs_filtered_pose_distribution.png", dpi=160)
    plt.close()

    if len(excluded_df) > 0:
        plt.figure(figsize=(8, 5))
        plt.scatter(excluded_df["P_yaw"], excluded_df["P_pitch"], s=16, alpha=0.8)
        plt.xlabel("P_yaw")
        plt.ylabel("P_pitch")
        plt.title("excluded samples P scatter")
        plt.tight_layout()
        plt.savefig(plot_dir / "excluded_samples_scatter.png", dpi=160)
        plt.close()

    if "residualMagnitude" in excluded_df or "residualMagnitude" in filtered_df:
        residual_values = pd.concat([
            excluded_df.get("residualMagnitude", pd.Series(dtype=float)),
            filtered_df.get("residualMagnitude", pd.Series(dtype=float)),
        ], ignore_index=True).dropna()
        if len(residual_values) > 0:
            plt.figure(figsize=(8, 5))
            plt.hist(residual_values, bins=60)
            if residual_summary.get("residualThreshold") is not None:
                plt.axvline(residual_summary["residualThreshold"], color="red", linestyle="--", label="threshold")
            plt.xlabel("residual magnitude")
            plt.ylabel("count")
            plt.title("residual histogram")
            plt.legend()
            plt.tight_layout()
            plt.savefig(plot_dir / "residual_histogram.png", dpi=160)
            plt.close()

    valid = comparison_df.dropna(subset=["poseP95"]).sort_values("poseP95").head(20)
    if len(valid) > 0:
        labels = valid["datasetKind"] + " / " + valid["modelName"]
        plt.figure(figsize=(10, 7))
        plt.barh(labels, valid["poseP95"])
        plt.xlabel("poseP95")
        plt.title("model comparison poseP95")
        plt.tight_layout()
        plt.savefig(plot_dir / "model_comparison_posep95.png", dpi=160)
        plt.close()


def write_summary_markdown(
    output_dir: Path,
    metadata: dict[str, Any],
    filter_summary: dict[str, Any],
    residual_summary: dict[str, Any],
    comparison_df: pd.DataFrame,
    best_row: pd.Series,
    excluded_bucket_df: pd.DataFrame,
) -> None:
    raw_rank = comparison_df[comparison_df["datasetKind"].eq("raw")].dropna(subset=["poseP95"]).sort_values(["poseP95", "poseMAX", "continuityJumpMax"]).head(10)
    filtered_rank = comparison_df[comparison_df["datasetKind"].eq("filtered")].dropna(subset=["poseP95"]).sort_values(["poseP95", "poseMAX", "continuityJumpMax"]).head(10)
    reason_lines = "\n".join(
        f"- {reason}: {count}"
        for reason, count in sorted(filter_summary["excludedReasonCounts"].items())
    ) or "- none"
    warning_text = filter_summary["warning"] or "none"
    text = f"""# OBJ pose mapping analysis summary

## dataset metadata

```json
{json.dumps(metadata, ensure_ascii=False, indent=2, default=str)}
```

## filter summary

- raw sample count: {filter_summary["rawSampleCount"]}
- hard filter excluded count: {filter_summary["hardFilterExcludedCount"]}
- residual outlier excluded count: {filter_summary["residualOutlierExcludedCount"]}
- final filtered sample count: {filter_summary["filteredSampleCount"]}
- excluded sample count: {filter_summary["excludedSampleCount"]}
- exclusion ratio: {filter_summary["excludedRatio"]:.4f}
- warning: {warning_text}

## excluded reason summary

{reason_lines}

## residual outlier summary

```json
{json.dumps(residual_summary, ensure_ascii=False, indent=2, default=str)}
```

## pose range before

```json
{json.dumps(filter_summary["poseRangeBefore"], ensure_ascii=False, indent=2, default=str)}
```

## pose range after

```json
{json.dumps(filter_summary["poseRangeAfter"], ensure_ascii=False, indent=2, default=str)}
```

## raw model ranking

{markdown_table(raw_rank) if len(raw_rank) else "No valid raw model results."}

## filtered model ranking

{markdown_table(filtered_rank) if len(filtered_rank) else "No valid filtered model results."}

## best model

- datasetKind: {best_row["datasetKind"]}
- modelName: {best_row["modelName"]}
- poseP95: {best_row.get("poseP95")}
- poseMAX: {best_row.get("poseMAX")}
- continuityJumpMax: {best_row.get("continuityJumpMax")}

## excluded ratio by pose bucket

{markdown_table(excluded_bucket_df) if len(excluded_bucket_df) else "No bucket summary."}

## notes

- Edge poses are not removed just because they are edge poses.
- Hard filters remove detect failures, invalid pose numbers, extreme returned pose values, and malformed landmark data when landmark data exists.
- Residual filters use a robust degree2 Ridge baseline and optional local consistency in P space.
- Best model selection prioritizes poseP95, poseMAX, continuityJumpMax, axis stability, edge stability, and TypeScript portability over poseMAE alone.
"""
    (output_dir / "obj_pose_mapping_analysis_summary.md").write_text(text, encoding="utf-8")


def export_outputs(
    output_dir: str | Path,
    dataset: dict[str, Any],
    raw_df: pd.DataFrame,
    filtered_df: pd.DataFrame,
    hard_excluded_df: pd.DataFrame,
    residual_excluded_df: pd.DataFrame,
    comparison_df: pd.DataFrame,
    posewise_df: pd.DataFrame,
    fitted: dict[str, Any],
    filter_summary: dict[str, Any],
    residual_summary: dict[str, Any],
) -> dict[str, Any]:
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    excluded_df = pd.concat([hard_excluded_df, residual_excluded_df], ignore_index=True)
    excluded_bucket_df = exclusion_by_bucket(raw_df, excluded_df)
    best_row = choose_best_model(comparison_df)
    best_key = f"{best_row['datasetKind']}::{best_row['modelName']}"
    best_model = fitted[best_key]
    metadata = dataset_metadata(dataset)

    comparison_df.to_csv(output_path / "obj_pose_mapping_model_comparison.csv", index=False, encoding="utf-8")
    posewise_df.to_csv(output_path / "obj_pose_mapping_posewise_evaluation.csv", index=False, encoding="utf-8")
    excluded_df.to_csv(output_path / "obj_pose_mapping_excluded_samples.csv", index=False, encoding="utf-8")
    filtered_df.to_csv(output_path / "obj_pose_mapping_filtered_samples.csv", index=False, encoding="utf-8")
    excluded_bucket_df.to_csv(output_path / "obj_pose_mapping_exclusion_by_pose_bucket.csv", index=False, encoding="utf-8")

    candidate = serialize_model(best_model)
    candidate.update({
        "schemaVersion": "pose_mapping_profile_candidate_v1",
        "datasetKind": best_row["datasetKind"],
        "modelName": best_row["modelName"],
        "errorSummary": best_row.to_dict(),
        "outlierFilterSummary": filter_summary,
        "residualOutlierSummary": residual_summary,
        "datasetMetadata": metadata,
    })
    (output_path / "pose_mapping_profile_candidate.json").write_text(
        json.dumps(candidate, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    save_plots(output_path, raw_df, filtered_df, excluded_df, comparison_df, residual_summary)
    write_summary_markdown(
        output_path,
        metadata,
        filter_summary,
        residual_summary,
        comparison_df,
        best_row,
        excluded_bucket_df,
    )
    return {
        "outputDir": str(output_path),
        "bestModel": best_row.to_dict(),
        "filterSummary": filter_summary,
        "residualSummary": residual_summary,
        "excludedReasonCounts": filter_summary["excludedReasonCounts"],
    }


# %% [markdown]
# # 16. run analysis

# %%
def run_analysis(dataset_path: str | Path | None = None, output_dir: str | Path = DEFAULT_OUTPUT_DIR) -> dict[str, Any]:
    np.random.seed(SEED)
    dataset = load_dataset_json(dataset_path)
    raw_df = flatten_dataset(dataset)
    hard_kept_df, hard_excluded_df = hard_filter(raw_df, dataset)
    filtered_df, residual_excluded_df, residual_summary = detect_residual_outliers(hard_kept_df)
    filter_summary = dataset_filter_summary(raw_df, hard_excluded_df, residual_excluded_df, filtered_df)
    model_datasets = make_model_dataset(raw_df, filtered_df)
    comparison_df, fitted, splits = compare_models(model_datasets)
    posewise_df = posewise_evaluation(comparison_df, fitted, splits)
    result = export_outputs(
        output_dir,
        dataset,
        raw_df,
        filtered_df,
        hard_excluded_df,
        residual_excluded_df,
        comparison_df,
        posewise_df,
        fitted,
        filter_summary,
        residual_summary,
    )
    print(json.dumps(result, ensure_ascii=False, indent=2, default=str))
    return result


def is_notebook_runtime() -> bool:
    return "ipykernel" in sys.modules or "google.colab" in sys.modules


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Analyze Ideal OBJ Render Warp Lab p,P dataset JSON.")
    parser.add_argument("--input", help="Path to obj_pose_mapping_dataset_v2 JSON.")
    parser.add_argument("--output-dir", default=DEFAULT_OUTPUT_DIR, help="Output directory.")
    args, _unknown = parser.parse_known_args(argv)
    if not args.input:
        if is_notebook_runtime():
            print(
                "Notebook runtime detected. Run one of these cells instead:\n"
                "  result = run_analysis('/content/obj-pose-mapping-dataset.json')\n"
                "  result = run_analysis()  # opens a Colab upload dialog"
            )
            return
        parser.error("the following arguments are required: --input")
    run_analysis(args.input, args.output_dir)


if __name__ == "__main__":
    main()
