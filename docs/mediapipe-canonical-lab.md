# MediaPipe Canonical Lab

## Related docs

- [MediaPipe Canonical Effective Rotation Center Lab](mediapipe-canonical-effective-rotation-center-lab.md)
- [MediaPipe Render Consistency Lab next step after effective rotation center study](mediapipe-render-consistency-lab-next-after-effective-rotation-center.md)

`tools/mediapipe-canonical-lab` は、MediaPipe Face Landmarker の生データと座標系を調査するための debug lab です。IdealFace を作る authoring tool ではなく、production asset を直接作るツールでもありません。

主な目的:

- current landmarks 478 を取得する
- `facialTransformationMatrix` を取得する
- yaw / pitch / roll を取得する
- blendshapes を取得する
- 正面、左右、上下、混合姿勢ごとに capture する
- captured JSON を analysis する
- Face Landmarker 478 の実測標準顔候補を debug する

`empiricalCanonical478` は、capture した current landmarks 478 から debug 用に作る実測標準顔 478 候補です。これは debug artifact であり、そのまま production asset や `ideal_face_asset_v1` の `idealLandmarks3D` に昇格しません。BAE AR の IdealFace は、IdealFace Authoring Tool が作成・調整する BAE AR 独自の理想 3D 顔 asset です。

## IdealFace Authoring Tool との違い

`tools/ideal-face-authoring` は、BAE AR の IdealFace asset を作成・調整する authoring tool です。Step 2-I-A/B/C と Step 2-H の active workflow では、MP4 detailed scan、frame selection、pose-aware dataset、`pose_aware_mediapipe_mesh_pca_residual_yaw_v1` candidate generation、point cloud preview を扱います。

一方、`tools/mediapipe-canonical-lab` は、MediaPipe Face Landmarker が返す 478 landmarks、`facialTransformationMatrix`、pose、blendshapes の性質を調べる検証用 lab です。ここで得た `empiricalCanonical478` や candidate ranking は、IdealFace Authoring Tool の production 生成結果ではなく、座標系と安定性を判断するための research / debug 情報として扱います。

## 用語メモ

- `front`: 正面に近い capture bucket。
- `yawPositive` / `yawNegative`: yaw 符号が片側 / 逆側の横向き bucket。現時点では数値上の符号として扱い、右向き / 左向きは断定しません。
- `pitchPositive` / `pitchNegative`: pitch 符号が片側 / 逆側の上下向き bucket。現時点では数値上の符号として扱い、上向き / 下向きは断定しません。
- `mixedPose`: yaw と pitch が混ざった姿勢の bucket。
- `face_bounds_normalized_no_matrix`: `facialTransformationMatrix` を使わず、顔の外枠で中心合わせとスケール正規化を行う candidate。
- `facialTransformationMatrix`: MediaPipe が出す、標準顔を現在顔へ合わせるための変換行列。
- `empiricalCanonical478`: 実測 capture から作った標準顔 478 候補。ただし debug artifact であり、production asset ではありません。

## 最新 analysis summary

最新の empirical 478 analysis summary では、以下の capture で検証しました。

- `captureCount`: 41
- `landmarkCount`: 478
- `matrixAvailableCount`: 41
- video size: `1280x720`
- bucket counts:
  - `front`: 6
  - `yawPositive`: 5
  - `yawNegative`: 5
  - `pitchPositive`: 10
  - `pitchNegative`: 5
  - `mixedPose`: 10

姿勢バランスは初期検証より改善済みです。ただし、`expressionTooStrong`、`rollTooLarge` は一部残っており、capture 品質の warning として引き続き扱います。

## 暫定結論

現時点の best candidate は `face_bounds_normalized_no_matrix` です。

```text
candidateName: face_bounds_normalized_no_matrix
inputSpace: face_bounds_centered_width_unit
normalization: height_unit
matrixConvention: null
averageStdDev3D: 0.098326
semanticAverageStdDev3D: 0.114973
warningCount: 0
score: 0.138567
```

Runtime compatible ranking でも同じ candidate が 1 位です。

日本語での意味:

- MediaPipe の行列は使わない
- 顔の外枠を基準に中心合わせする
- 顔の大きさでスケールを揃える
- 現時点の多姿勢 capture では、その方が最も安定している

この結論は、IdealFace asset schema や Runtime Projection を変更する決定ではありません。現時点では、production の IdealFace 3D478 作成では顔枠ベースの正規化・整列を主軸にし、matrix inverse は research / debug 扱いに留めます。

## facialTransformationMatrix inverse の扱い

これまでの検証では、`facialTransformationMatrix` の逆変換系 candidate に以下の問題が出ています。

- `inverseResultHugeBounds`: 逆変換結果の bounds が巨大化し、安定した canonical-like 空間にならない。
- `poseConventionMatchesButPointTransformUnstable`: pose extraction の convention が合って見えても、点群 transform が安定しない。
- pose extraction と point transform の convention が一致するとは限らない。
- yaw / pitch / roll は取れていても、current landmarks 478 を安定して canonical-like 空間へ戻せるとは限らない。

そのため、現時点では以下の方針にします。

- `facialTransformationMatrix` は yaw / pitch / roll、pose bucket、frame weighting、debug comparison に使う。
- IdealFace 3D478 作成の production 主導線として、matrix inverse で current landmarks を標準顔座標へ戻す方式は採用しない。
- production の IdealFace 3D478 作成では、顔枠ベースの正規化・整列を主軸にする。
- matrix inverse は research / debug 扱いに留める。

この方針は、Runtime Projection、Studio Projection / Shape Warp、IdealFace Authoring Tool の生成ロジック、candidate score、`bestPivotZ`、aspect score、IdealFace asset schema を変更しません。

## Analysis JSON export

Analysis JSON は full export だと巨大になるため、用途別に 2 系統へ分けます。

### Export Full Analysis JSON

詳細検証・再解析用の export です。

含める主な内容:

- `candidateResults`
- `empiricalCanonical478` landmarks
- per-capture / per-landmark の詳細データ
- candidate ごとの詳細な安定性指標

full landmarks 配列や詳細 candidate data を含むため、サイズは大きくなります。

### Export Summary JSON

ChatGPT / 人間レビュー用の軽量版です。

schema:

```text
schemaVersion: mediapipe_canonical_lab_analysis_summary_v1
```

含める主な内容:

- `sourceCaptureSummary`
- `frameWeightSummary`
- `overallStabilityRankingTop`
- `runtimeCompatibleRankingTop`
- `bucketRankingTop`
- `bestOverallCandidate`
- `bestRuntimeCompatibleCandidate`
- `empiricalCanonical478BestOverallSummary`
- `empiricalCanonical478RuntimeCompatibleSummary`
- `canonical468ReferenceComparisonSummary`
- `warnings`

除外する主な内容:

- `captures`
- `rawCaptureSummaries`
- `candidateResults` 全件
- `perCaptureResults`
- `perLandmarkMean`
- `perLandmarkStdDev`
- `empiricalCanonical478BestOverall.landmarks`
- `empiricalCanonical478RuntimeCompatible.landmarks`
- 478点 full landmarks 配列
- `previewDataUrl`

Summary JSON は、巨大な landmarks 配列や preview data を含めず、capture 条件、frame weighting、ranking、best candidate、主要 warning を軽くレビューするための export として扱います。
