# Ideal OBJ Render Warp Lab Placement Function Analysis History

## 2026-06 Live Alignment Unification

MP4 再生中の Pose Mapping runtime の live alignment は、`direct_piecewise_ty3_linear_normalized_v1` 固定に一本化した。

現在の runtime は `currentMatrix` から `buildPlacementFunctionMatrixFeatures()` で `matrixFeatures` を作り、placement function candidate から以下を推定する。

- `scaleRatio`
- `translateAfterScaleImageX`
- `translateAfterScaleImageY`

推定値は `renderedIdeal478` に image-normalized coordinate のまま適用する。

```text
aligned.x = renderedIdeal.x * scaleRatio + translateAfterScaleImageX
aligned.y = renderedIdeal.y * scaleRatio + translateAfterScaleImageY
aligned.z = renderedIdeal.z
```

以下の legacy alignment は removed legacy として廃止した。fallback / 比較用としても live runtime には残さない。

- `bounds_center_scale_v1`
- `mediapipe_placement_center_scale`

placement function を評価できない場合は旧 mode に戻さず、`alignmentStatus = skipped_invalid_placement_function` と `placementFunctionStatus` で可視化する。

```text
applied
skipped_missing_matrix
skipped_invalid_matrix_features
skipped_invalid_candidate
skipped_invalid_transform
skipped_invalid_aligned_landmarks
```

今回の到達点は `alignedRenderedIdeal478` / `meshTargetVertices` の生成までであり、WebGL mesh warp の画像変形本線化は別作業とする。
