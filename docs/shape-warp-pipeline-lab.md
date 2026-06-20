# Shape Warp Pipeline Lab

## 目的

`tools/shape-warp-pipeline-lab` は、shape warp の入力になる中間データを段階的に確認するための検証ラボです。

対象は次の流れに限定します。

```text
current face
  -> rendered ideal face
  -> aligned ideal face
  -> background grid
  -> combined vertices
  -> triangleIndices
```

初期版では WebGL mesh warp は実装しません。

## 切り分け理由

既存の `tools/ideal-obj-render-warp-lab` には、OBJ render、poseMappingProfile、Placement Function Analysis、benchmark、background grid、combined mesh などが同居しています。

その結果、`main.ts` が肥大化し、current face missing からの recovery lifecycle が機能追加のたびに壊れやすくなっていました。

Shape Warp Pipeline Lab は、OBJ render 由来の `renderedIdeal478` から mesh warp 入力直前までを小さい責務に分け、復帰ライフサイクルを単純に保つために分離します。

## 新ラボでできること

- OBJ を読み込み、理想顔モデルとして保持する
- `poseMappingProfile` を読み込み、`P_camera` から `pForWebglRender` を評価する
- MP4 を読み込み、MediaPipe から `current478` と `P_camera` を取得する
- MP4 の再生 / 停止を行う
- preview tab ごとに、点・線・格子・メッシュの表示を右ペインで切り替える
- debug JSON を download する
- combined mesh summary CSV を download する

## 新ラボに入れないもの

- Placement Function Analysis
- p,P dataset generation
- candidate fitting
- roundtrip validation
- MediaPipe mode comparison
- Detect Performance benchmark
- Render -> Detect Handoff benchmark
- WebGL OBJ Render Benchmark
- legacy alignment
- WebGL mesh warp live preview
- WebGL mesh warp one-shot preview
- production engine 接続
- Beauty Studio 接続

## 画面構成

左ペインは操作のみです。

- OBJ読込
- poseMappingProfile読込
- MP4読込
- 再生
- 停止
- リセット

中央ペインは preview tab のみです。状態、理由、件数、bounds、pose、matrix、timing、JSON、CSV は表示しません。

- Current Face Preview
- Rendered Ideal Preview
- Alignment Overlay Preview
- Background Grid Preview
- Combined Mesh Preview

右ペインは active preview tab に対応する debug と download のみです。

- 表示切替 checkbox
- debug summary
- Download Debug JSON
- Copy Debug Summary
- 必要な tab の CSV download

## preview tab ごとの debug / download

### Current Face Preview

中央 preview:

- MP4 video frame
- `current478`
- actual visible current landmarks
- hidden current landmarks

右ペイン debug:

- `currentFaceStatus`
- `frameId`
- `mediaTimeSec`
- `landmarkCount`
- `P_camera`
- `qualityScore`
- `actualVisibilityDebug`
- `excludedReasonCounts`

download:

- `schemaVersion: current_face_preview_debug_v1`

### Rendered Ideal Preview

中央 preview:

- OBJ render result
- `renderedIdeal478`

右ペイン debug:

- `objLoaded`
- `poseMappingProfileLoaded`
- `P_camera`
- `pForWebglRender`
- `renderBackend`
- `renderResolution`
- `renderedIdealStatus`
- `renderedIdealLandmarkCount`
- `P_confirm`
- `poseDiff`
- `renderMs`
- `detectMs`

download:

- `schemaVersion: rendered_ideal_preview_debug_v1`

### Alignment Overlay Preview

中央 preview:

- MP4 video frame
- actual visible current landmarks
- actual visible aligned ideal landmarks
- current -> aligned ideal correspondence lines

右ペイン debug:

- `currentFaceStatus`
- `renderedIdealStatus`
- `alignmentStatus`
- `alignmentSkippedReason`
- `alignmentMethod`
- `currentCenter`
- `idealCenter`
- `scaleRatio`
- `actualVisibleIndexCount`
- `currentOverlayPointCount`
- `alignedIdealOverlayPointCount`
- `overlayLifecycle`

download:

- `schemaVersion: alignment_overlay_preview_debug_v1`

### Background Grid Preview

中央 preview:

- MP4 video frame
- `backgroundGridInterior`
- `backgroundGridBoundary`
- `faceInteriorTriangle` outline

右ペイン debug:

- `backgroundGridStatus`
- `gridStepPx`
- `generatedGridPointCount`
- `backgroundGridBoundaryPointCount`
- `backgroundGridInteriorPointCount`
- `excludedInsideFaceTrianglePointCount`
- `keptBackgroundGridPointCount`
- `faceInteriorTriangleCount`

download:

- `schemaVersion: background_grid_preview_debug_v1`

### Combined Mesh Preview

中央 preview:

- `combinedSourceVerticesPx`
- `combinedTargetVerticesPx`
- source triangle mesh
- target triangle mesh
- sample correspondence lines

右ペイン debug:

- `combinedMeshStatus`
- `combinedSourceVertexCount`
- `combinedTargetVertexCount`
- `sourceTargetCountMatches`
- `indexCorrespondenceValid`
- `faceLandmarkVertexCount`
- `backgroundGridInteriorVertexCount`
- `backgroundGridBoundaryVertexCount`
- `triangleCount`
- `potentialTargetInversionTriangleCount`
- `sourceDegenerateTriangleCount`
- `longTriangleCount`
- `sourceTriangleAreaSummaryPx2`
- `targetTriangleAreaSummaryPx2`
- `edgeLengthSummaryPx`
- `webglWarpStatus: not_implemented`

download:

- `schemaVersion: combined_mesh_preview_debug_v1`
- Combined Mesh Summary CSV

JSON は summary と sample 中心にし、巨大配列を UI に無条件表示しません。

## recovery lifecycle invariant

新ラボでは次の invariant を守ります。

- current face missing は frame-local state として扱う
- current face が復帰したら、必ず `P_camera -> p -> OBJ render -> detect -> alignment` を再要求する
- `skippedReason` は次フレームの処理開始条件に使わない
- 古い `alignedRenderedIdeal478` は overlay に使わない
- 復帰後は新しい `renderedIdeal478` / `alignedRenderedIdeal478` を生成し直す
- busy 中に新しい frame が来た場合は latest frame pending として扱い、busy 解除後に最新 frame で再実行する

## WebGL mesh warp は初期版に入れない

初期版では WebGL mesh warp renderer、warp canvas、rAF loop、warp 用 CSS 表示制御は作りません。

将来の別 PR で one-shot static warp を追加する前段として、今回は `webglWarpStatus: not_implemented` の debug placeholder だけを許可します。
