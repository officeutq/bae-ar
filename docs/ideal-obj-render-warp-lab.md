# Ideal OBJ Render Warp Lab

## 目的

`tools/ideal-obj-render-warp-lab` は、FaceBuilder + Blender sculpt で作成した `テスト.obj` のような OBJ 3D 形状ファイルを、BAE AR の neutral ideal head（無表情基準の理想頭部）候補として使えるか検証する debug / research lab です。

日本語名は「理想OBJレンダー・ワープ検証ラボ」とします。より目的を明確にする別名として `tools/ideal-clay-head-render-warp-lab` / 「理想粘土頭部レンダー・ワープ検証ラボ」も候補ですが、この docs では `tools/ideal-obj-render-warp-lab` を仮称として扱います。

このラボは production 用 authoring tool ではありません。Engine Runtime、Beauty Studio、IdealFace Authoring Tool、Runtime renderer、production asset export へ直接接続しません。まずは、OBJ を current pose で render した画像から MediaPipe returned 478 landmarks を取得できるか、その 478点を既存の mesh warp 検証ラインへ接続できるかを確認する場です。

## 背景

`tools/ideal-reference-mesh-warp-lab` では、理想モデル動画を MediaPipe に通して `rawIdealReferenceFrames` を作り、live current frame に近い top1 reference を選び、`candidateAlignedIdealLandmarks` を作っていました。

しかし、同じ動画を model video と live video の両方に使っても、top1 reference matching は完全に同じ時刻のフレームを選ばず、pose が数度ズレることが分かりました。そのため、reference frame matching で選んだ 2D landmarks をそのまま target にする方式は、自然美顔の本線として危険です。

一方で、`ideal-reference-mesh-warp-lab` の以下の成果は有用です。

- live video / current frame MediaPipe analysis
- `current478` / pose / expression
- visible / safe current landmarks
- dynamic nearFaceGrid
- backgroundGrid
- screenEdgeAnchors
- current source vertices
- ideal target vertices
- triangle indices
- WebGL mesh warp preview
- mesh pair preview
- image-normalized coordinate
- aspect-corrected image coordinate
- `displayedContentRect` を使った overlay 変換

`tools/ideal-obj-render-warp-lab` では、これらの座標系・メッシュ生成・WebGL mesh warp を踏襲し、理想側 landmarks の供給元だけを差し替えます。

## MediaPipe mode comparison

このラボには、同じ MP4 フレームを MediaPipe FaceLandmarker の `detect()` と
`detectForVideo()` の両方に通し、pose / 478 landmarks / 実行時間の差を比較する
`モード比較` 実験を追加します。

実運用では current face（現在顔）は動画またはカメラ入力から取得するため
`detectForVideo()` になりやすく、rendered ideal face（レンダー理想顔）は OBJ を
canvas にレンダーした静止画像として扱うため `detect()` になりやすいです。
そのため、両モードの pose / 478 landmarks に系統差があるかを確認します。

比較では、以前の 0.41秒ズレ問題を避けるため、MP4 の現在フレームを一度だけ
固定 canvas に `drawImage()` し、その同じ canvas frame を `detect(canvas)` と
`detectForVideo(canvas, timestampMs)` の両方へ渡します。`detectForVideo(video, timestampMs)`
のように video element を直接渡す比較は行いません。

実験条件:

- `imageLandmarker`: `runningMode: "IMAGE"` / `detect(canvas)` / `delegate: "GPU"`
- `videoLandmarker`: `runningMode: "VIDEO"` / `detectForVideo(canvas, timestampMs)` / `delegate: "GPU"`
- IMAGE mode と VIDEO mode は別インスタンスにし、runningMode の切り替えは行わない
- frame driver は `requestVideoFrameCallback（動画フレーム単位コールバック）`
- timestamp は `metadata.mediaTime * 1000`
- timestamp が同一または巻き戻った frame は skip する
- `requestVideoFrameCallback()` が使えないブラウザでは実験不可として表示し、fallback しない
- 最大 10000 frames まで比較する
- 現時点の `モード比較` では、`frameIndex % 3`、`sampleStep`、`frameStride`、
  `targetFps`、`minFrameIntervalMs`、`presentedFramesDelta` による意図的な間引きは行わない
- 次回 `requestVideoFrameCallback()` 登録は、`drawImage()`、`detect()`、
  `detectForVideo()`、frame result 作成、debug counter 更新、必要な UI 反映の後に行う。
  そのため、callback 内処理が重い場合は結果的に動画フレームを取り逃がす可能性がある

出力:

- UI summary: 右ペイン Debug（デバッグ）の `モード比較` タブに表示する。
  左ペインは `MP4読込`、短い説明、`モード比較`、`停止 / cancel` の操作中心にする。
- `モード比較` タブ: source、run status、run options、detection summary、timing summary、
  pose diff（姿勢差分）、landmark diff（ランドマーク差分）、frame consistency、
  debug counters、debug options、JSON / CSV download を表示する。
- JSON download: raw per-frame result と summary を含める。summary には
  `worstYawDiffFrame`、`worstPitchDiffFrame`、`worstRollDiffFrame`、
  `worstPoseMagnitudeDiffFrame`、`worstMean2dDistanceFrame`、
  `worstMax2dDistanceFrame`、`firstMismatchFrame`、`latestFrame` を含める。
- CSV download: 主要列のみの per-frame summary。`callbackWallDeltaMs`、
  `mediaTimeDeltaMs`、`processingMeasuredMs`、`unmeasuredOverheadEstimateMs` も含める。
- preview export（プレビュー書き出し）: 全 frames の画像は保持しない。`detect()` と
  `detectForVideo()` に渡した同一 canvas frame から、latest frame、worst pose diff frame、
  worst landmark diff frame、first mismatch frame の preview snapshot だけを保持して
  PNG download できるようにする。保持上限は最大20枚、現時点の実装では最大4枚。
  `latest` は完了時に作成し、実行中の every-frame `toDataURL()` は行わない。

計測範囲:

- `totalFrameProcessingMs` / `processingMeasuredMs` は、canvas context 取得、
  `drawImage()`、`detect()`、`detectForVideo()` を含む。
- `totalFrameProcessingMs` / `processingMeasuredMs` は、frame result 構築、
  raw frames 配列への追加、debug counter 集計、UI state 更新、summary 再描画、
  preview snapshot の `toDataURL()` を含まない。
- `unmeasuredOverheadEstimateMs` は `callbackWallDeltaMs - processingMeasuredMs` として、
  callback 間隔に対して計測外処理や待ち時間がどれくらい見えているかを切り分ける参考値とする。

デバッグカウンタ:

- `rvfcCallbackCount`: `requestVideoFrameCallback()` callback が呼ばれた回数
- `processedFrameCount`: 実際に比較処理した frame 数
- `intentionalSkipCount`: 意図的な間引き skip 数。現時点では意図的間引きがないため 0 の想定
- `timestampSkipCount`: timestamp が同一または巻き戻ったため skip した数
- `busySkipCount`: 処理中だったため skip した数
- `missingMediaTimeSkipCount`: `metadata.mediaTime` が取得できず skip した数
- `presentedFramesDeltaSummary`: `presentedFramesDelta` の分布
- `callbackWallDeltaMs`: 前回 callback から今回 callback までの wall-clock 時間分布
- `mediaTimeDeltaMs`: 前回 `metadata.mediaTime` から今回までの動画時間差分布
- `processingMeasuredMs`: 現在計測している処理時間分布
- `unmeasuredOverheadEstimateMs`: 計測外 overhead の推定分布
- `nextCallbackRegistrationTiming`: 次回 callback 登録タイミング。現時点では `afterProcessing`

デバッグオプション:

- preview snapshot（プレビュー画像保存）を無効化できる
- UI 反映を N frames に1回へ間引ける
- summary 再描画を N frames に1回へ間引ける
- download 用 raw per-frame result は維持し、UI 反映だけを間引く

TODO:

- preview overlay（重ね表示プレビュー）は未実装。現時点では raw frame preview（元フレーム画像）
  のみを保存する。将来、IMAGE mode / VIDEO mode の landmarks、pose diff、frameIndex /
  mediaTimeSec を重ねる。

## 基本方針

最重要方針は、座標系を新設しないことです。

`ideal-reference-mesh-warp-lab` と同じ coordinate lifecycle を使います。

current478:

```text
live video
  -> MediaPipe
  -> current478
  -> image-normalized coordinate
```

renderedIdeal478:

```text
OBJ
  -> current yaw / pitch / roll で render
  -> rendered ideal image
  -> MediaPipe
  -> renderedIdeal478
  -> image-normalized coordinate
```

## p,P dataset と renderAppearanceProfile

現在のラボの主な役割は、OBJ を複数の `renderPose p` でレンダーし、その画像を
MediaPipe に通して `P = MediaPipe returnedPose` を取得し、p,P dataset JSON として
ダウンロードすることです。統計要約、関数推定、model tree / regression / KNN 比較、
`poseMappingProfile` 候補作成は Google Colab / Python 側で行います。

MediaPipe が見ているのは OBJ の 3D 形状そのものではなく、レンダリングされた 2D 画像です。
そのため、p,P mapping は光、影、背景色、顔色、FOV、scale / crop、canvas 解像度に依存します。
ラボでは `renderAppearanceProfile` を選択し、同じ pose sampling に対して見た目条件だけを
変えた dataset を取り直せるようにします。

dataset JSON には、選択した profile id だけでなく、実際に適用した
`backgroundColor`、`skinColor`、`material`、`lighting`、`camera`、`renderResolution` を
`renderAppearance.applied` として保存します。Canvas2D renderer でまだ物理的に実装していない
specular、cast shadow、perspective projection、FOV は `implementation` notes に未実装として
記録し、解析側で適用済み条件と誤解しないようにします。

p,P dataset 解析用 Python は
`tools/ideal-obj-render-warp-lab/analysis/obj_pose_mapping_colab_analysis.py` に置きます。
Colab では `# %%` 区切りをセルとして実行できます。入力は `obj_pose_mapping_dataset_v3`
WebGL JSON を想定します。旧 v1 / v2 JSON は読み取り対象には残しますが、WebGL runtime 用
`pose_mapping_profile_candidate` は出力しません。

解析では raw dataset を `raw_df` として保持し、hard filter と residual outlier detection
後の dataset を `filtered_df`、除外サンプルを `excluded_df` として理由付きで出力します。
hard filter は MediaPipe 検出失敗、p / P の NaN / Infinity、returnedPose の極端な範囲外、
landmarks が含まれる場合の 478 点欠損、landmark bounds / x/y/z 分布異常を除外対象にします。
端姿勢は実運用上の学習対象なので、yaw端 / pitch端 / roll端という理由だけでは除外しません。

モデル比較は raw / filtered の両方で実行し、Linear Regression、Polynomial degree 2 + Ridge、
KNN、Decision Tree + per-leaf Polynomial degree 2 + Ridge、高次 Polynomial degree 3-5 + RidgeCV、
GMM soft gate + Polynomial degree 2 expert を比較します。採用 candidate は pose p95、pose MAX、
continuityJumpMax、軸別破綻、端姿勢、TypeScript 移植性を見て選び、単純な MAE だけでは選びません。
出力は `obj_pose_mapping_analysis_summary.md`、`obj_pose_mapping_model_comparison.csv`、
`obj_pose_mapping_posewise_evaluation.csv`、`obj_pose_mapping_excluded_samples.csv`、
`obj_pose_mapping_filtered_samples.csv`、`pose_mapping_profile_candidate.json` です。

## poseMappingProfile runtime 検証

ラボでは Colab / Python 側で作成した `pose_mapping_profile_candidate.json` を
`poseMappingProfile（姿勢対応プロファイル）` として JSON 読み込みできます。
現在対応する `schemaVersion` は `pose_mapping_profile_candidate_v1` / `pose_mapping_profile_candidate_v2`、`modelType` は
`decision_tree_gate_polynomial_degree2_ridge` のみです。未対応 `modelType` は UI 上の error として
表示し、アプリ全体は落としません。

検証フローは以下です。

```text
P_camera（現在顔の姿勢）
  -> poseMappingProfile.evaluate()
  -> p（OBJ に与える描画姿勢）
  -> OBJ render
  -> MediaPipe detect() / IMAGE mode（静止画モード）
  -> P_confirm / renderedIdeal478
```

### current face missing 時の runtime state

current face / current478 / `P_camera` が取得できないフレームでは、pose mapping runtime は
`poseMappingProfile.evaluate()`、WebGL OBJ render、rendered ideal の `detect()` を実行しません。
この場合は `poseMappingStatus` を `skipped_no_current_face` または `skipped_invalid_pose` にし、
`poseMappingSkippedReason` に `no_current_face` / `invalid_pose` を記録します。
`fallbackPoseUsed` は常に `false` とし、`yaw: 0, pitch: 0, roll: 0` の fallback pose で
frontal face をレンダーしません。

skip 中は、最後に成功した `p` / `P_confirm` / `renderedIdeal478` / preview を `lastGood` として保持します。
新しい `p`、`P_confirm`、`renderedIdeal478` へ更新せず、UI では stale / no current face として表示します。
current face が復帰したフレームでは最新の `P_camera` から通常の
`P_camera -> p -> OBJ render -> detect -> P_confirm` 経路を再開し、
`poseMappingStatus` を `completed` に戻します。

debug JSON には以下を含めます。

- `currentFaceStatus`: `detected` / `missing` / `invalid`
- `poseMappingStatus`: `ready` / `skipped_no_current_face` / `skipped_invalid_pose` / `running` / `completed` / `error`
- `poseMappingSkippedReason`: `none` / `no_current_face` / `invalid_pose` / `profile_mismatch`
- `fallbackPoseUsed`
- `lastGood`: `hasLastGood`、`updatedAtMs`、`mediaTimeSec`、`ageMs`、`frameIndex`
- `loop`: `running`、`busy`、`lastFrameIndex`、`lastMediaTimeSec`
- `noFaceCounters`: `currentFaceMissingCount`、`poseMappingSkippedNoCurrentFaceCount`、`recoveredFromNoCurrentFaceCount`

runtime 検証では、MediaPipe `detect()` に渡す canvas と UI preview canvas を分離します。
`detect()` 用 canvas は画面表示サイズに追従させず、profile / dataset metadata のレンダー条件で固定します。
renderResolution の優先順は以下です。

1. `poseMappingProfile.datasetMetadata.renderAppearance.applied.renderResolution.width / height`
2. `poseMappingProfile.datasetMetadata.renderSettings.canvasWidth / canvasHeight`
3. fallback default `1179 x 1179`

`P_confirm` は、この detect 用 offscreen canvas に `p` で理想 OBJ をレンダーし、その画像を
MediaPipe `detect()` / IMAGE mode に渡して取得します。独立した `現姿勢理想478プレビュー` UI は
廃止し、`renderedIdeal478` は `current478` へ alignment して `alignedRenderedIdeal478` として
ライブ映像上の overlay に統合します。`renderedIdeal478` は detect canvas 基準の normalized landmark
として保持し、alignment 後の `alignedRenderedIdeal478` は live video image-normalized coordinate
として扱います。preview canvas に変換済みの座標だけを debug JSON に保存しません。

runtime 側で適用する renderAppearance は、profile metadata に存在する範囲で
`backgroundColor`、`skinColor`、`material.mode`、`material.diffuse`、`material.ambient`、
`lighting.mode`、`lighting.ambientIntensity`、`lighting.keyLightIntensity`、
`lighting.keyLightDirection`、`camera.scale`、`camera.verticalOffset`、`renderResolution` です。
Canvas2D renderer がまだ物理的に実装していない `material.specular`、`lighting.castShadow`、
`camera.projection`、`camera.fovDeg` は `notAppliedRenderAppearanceFields` に記録します。

現在顔の解析は `detectForVideo()` / VIDEO mode（動画モード）を使います。レンダー理想顔の再検出は、
OBJ を canvas にレンダーした静止画に対して `detect()` / IMAGE mode（静止画モード）を使います。
この使い分けは、現在顔入力とレンダー画像入力の実行条件を混同しないための固定ルールです。

左ペインは操作中心です。置くものは `OBJ読込`、`poseMappingProfile読込（関数読込）`、`MP4読込`、
必要な実行 / 停止 / cancel 操作、既存の `モード比較` 操作です。`poseMappingProfile` の詳細、
`P_camera / p / P_confirm`、`pose diff`、`renderedIdeal478` 詳細、専用 debug download は左ペインに置きません。

右ペイン Debug には `Pose Mapping（姿勢対応）` タブを置き、以下を集約します。

- Profile info: loaded、filename、schemaVersion、modelType、modelName、datasetKind、inputFeatures、target、errorSummary、outlierFilterSummary、poseRangeAfter
- Runtime input: `P_camera`、範囲制限後の `P_camera`、clampApplied、quality gate
- Profile output: `p`、selectedLeaf、used expert、usedFallback、evaluator warnings
- Render confirm: detectCanvasWidth / detectCanvasHeight、previewCanvasWidth / previewCanvasHeight、renderResolutionSource、detectCanvasMatchesProfile、profileCanvasWidth / profileCanvasHeight、適用 renderAppearance、notAppliedRenderAppearanceFields、`P_confirm`、`P_confirm - P_camera` の pose diff、renderedIdeal478 status、profileEvaluateMs、renderMs、detectMs、totalMs
- Alignment: status、mode、rotationApplied、anchorCount、currentCenter、idealCenter、scale、videoAspectRatio、renderAspectRatio、座標系別 bounds、displayedContentRect、excludedReasonCounts、displacementSummary、alignedRenderedIdeal478 count、mesh source / target count
- Download: `pose_mapping_runtime_debug_v1` JSON download

`Pose Mapping（姿勢対応）` タブには専用の
`Download Pose Mapping Debug（姿勢対応デバッグをダウンロード）` を置きます。この export は既存の
`モード比較` タブの JSON / CSV download とは別の `pose_mapping_runtime_debug_v1` JSON です。
`renderSettings` には detectCanvasWidth / detectCanvasHeight、previewCanvasWidth / previewCanvasHeight、
renderResolutionSource、detectCanvasMatchesProfile、profileCanvasWidth / profileCanvasHeight を含めます。
`renderAppearanceApplied` には runtime 側で適用したレンダー見た目条件と
notAppliedRenderAppearanceFields を含めます。最新フレームの `current478`、`renderedIdeal478`、
`alignedRenderedIdeal478` は必要最小限の確認用として含めてよいですが、毎フレーム履歴として大量に
保存しません。

Live タブの旧 `現姿勢OBJ` 欄と独立した `現姿勢理想478プレビュー` は使いません。
`poseMappingProfile` で得た `p` により理想OBJをレンダーし、そのレンダー画像から得た
`renderedIdeal478` を `current478` に alignment したうえで、ライブ映像上に以下を overlay 表示します。

- `current478`
- `alignedRenderedIdeal478`
- `current478 -> alignedRenderedIdeal478` の対応線
- 除外 / 固定 landmark
- mesh source / mesh target
- alignment anchors

Live overlay の描画は必ず `displayedContentRect` を使い、動画の letterbox / pillarbox でズレないようにします。
未位置合わせの `renderedIdeal478` をライブ映像上に直接表示しません。`renderedIdeal478` が missing / invalid
の場合は `alignedRenderedIdeal478`、対応線、mesh target を描画せず、fallback 正面顔も表示しません。
この段階ではまだ WebGL mesh warp（変形加工）は行いません。

overlay controls は `Live Overlay（ライブ重ね表示）` と `Mesh Debug（メッシュデバッグ）` に再分類します。
実体がまだない no-op checkbox は残さず、未対応のものは disabled または非表示にします。現時点では
triangle mesh は未生成なので disabled とし、grid / anchors は alignment anchors の表示に使います。

初期 profile:

- `current`: 既存レンダー条件の baseline
- `soft_light_no_shadow`: 影なし・柔らかい光
- `camera_soft_light`: カメラ正面固定ライト
- `high_contrast_background`: 背景コントラスト確認
- `yaw_edge_friendly`: 横向き輪郭補助
- `stable_crop_fov`: 安定した顔サイズ・視野角

alignment は landmark correspondence ではなく、MediaPipe placement ベースにします。理想顔の向きは
`P_camera -> poseMappingProfile -> p -> WebGL render -> MediaPipe detect -> P_confirm` で合わせるため、
alignment では回転を使いません。合わせるのは位置と大きさだけです。

placement にはまず `facialTransformationMatrix` を debug-only で検証します。matrix translation が
live video image-normalized coordinate の center として安全に扱えない場合は、alignment を
`skipped_invalid_placement` として skip し、理想点 overlay を出しません。旧 `current478` /
`renderedIdeal478` の対応点群から center / scale を推定する方式へ無言 fallback しません。

alignment work の座標確認では、aspect-corrected image coordinate を使います。

```text
x' = x * videoAspectRatio
y' = y
```

`current478` と `renderedIdeal478` は元の画像が異なるため、alignment 計算用の aspect-corrected coordinate
を別々に作ります。

```text
current478:
  live video image-normalized coordinate
  -> videoAspectRatio で aspect work coordinate へ変換

renderedIdeal478:
  render/detect canvas image-normalized coordinate
  -> renderAspectRatio で aspect work coordinate へ変換

alignedIdealWork:
  currentWork の座標系へ center + uniform scale で alignment した一時座標

alignedRenderedIdeal478:
  alignedIdealWork を videoAspectRatio で割り戻した live video image-normalized coordinate
```

bounds、center、uniform scale、distance、large displacement は aspect-corrected image coordinate で計算します。
ただし、alignment 計算用の aspect-corrected coordinate を overlay に直接使いません。
alignment 後の `alignedRenderedIdeal478` は必ず live video image-normalized coordinate として保持し、
live overlay / mesh target 入力へ戻します。

overlay は以下の変換で行います。

```text
image-normalized coordinate
  -> displayedContentRect pixel
```

pixel coordinate、OBJ vertex coordinate、WebGL clip space は、MediaPipe returned landmarks 取得後の alignment / mesh pair 処理には混ぜません。render image の pixel coordinate は MediaPipe 入力用に閉じ込めます。MediaPipe から戻ってきた `renderedIdeal478` は image-normalized coordinate として扱い、ライブ映像上には alignment 後の `alignedRenderedIdeal478` を表示します。

## 既存ラボから踏襲するもの

`ideal-reference-mesh-warp-lab` から以下を踏襲します。

- live video input
- current frame MediaPipe analysis
- current478 overlay
- pose / expression / quality debug
- visible / safe current landmarks
- iris landmarks 468..477 の除外または current 固定
- `faceMedianNearestDistance`
- dynamic nearFaceGrid
- backgroundGrid
- screenEdgeAnchors
- current source vertices
- ideal target vertices
- triangle indices
- mesh pair preview
- WebGL mesh warp preview
- summary / raw debug
- `displayedContentRect` を使った overlay 変換

## 差し替える核

旧方式:

```text
model video
  -> MediaPipe scan
  -> rawIdealReferenceFrames
  -> accepted / excluded frame 管理
  -> top1 reference matching
  -> candidateAlignedIdealLandmarks
```

新方式:

```text
OBJ
  -> current yaw / pitch / roll で render
  -> rendered ideal image
  -> MediaPipe analysis
  -> renderedIdeal478
  -> alignedRenderedIdeal478
```

top1 reference matching は使いません。current pose で render した OBJ を理想側の 1 フレームとして扱い、MediaPipe が返した `renderedIdeal478` を `rawIdealReferenceFrame` 相当の入力にします。

## 処理フロー

想定フローは以下です。

```text
1. live video / camera
   -> MediaPipe
   -> current478
   -> yaw / pitch / roll
   -> expression
   -> quality

2. current478 から visible / safe landmarks を選ぶ

3. visible / safe landmarks + dynamic nearFaceGrid + backgroundGrid + screenEdgeAnchors で
   current source mesh を作る

4. OBJ file を読み込む

5. OBJ を current yaw / pitch / roll で render する

6. rendered ideal image を MediaPipe に通す
   -> renderedIdeal478

7. renderedIdeal478 を current478 へ alignment する
   -> alignedRenderedIdeal478

8. current source mesh と同じ頂点構成で ideal target mesh を作る

9. triangle indices を作る

10. WebGL mesh warp で加工する

11. warped preview を表示する
```

## 表情部分の初期ルール

`テスト.obj` は neutral であり、カメラ映像と同じ表情を持ちません。そのため、初期ラボでは expression-sensitive landmarks は current をそのまま使います。

基本ルール:

```text
if landmark is expressionSensitive:
  target = current
else:
  target = lerp(current, alignedRenderedIdeal, usageWeight)
```

意味:

```text
口・目・虹彩など、表情で大きく動く点はカメラ映像を優先する。
顔の土台・輪郭・頬・鼻・額など、表情影響が比較的小さい点だけ理想OBJ方向へ寄せる。
```

初期の current 固定候補:

- mouth
- lips
- inner mouth
- left_eye
- right_eye
- eyelids
- iris 468..477
- jawOpen で大きく動く下口周辺

chin や jaw side は判断が難しいため、初期は弱く寄せるか、current 固定寄りで安全側に倒します。

これは `expressionFollow v1` の正式実装ではなく、Lab 内の debug rule として扱います。`expressionFollow v1` の schema、Engine 実装、Authoring Tool export へは入れません。

## Target vertices 生成ルール

ideal target vertices は、`ideal-reference-mesh-warp-lab` と同じく、source vertices と同じ頂点数・同じ順番で作ります。

```text
sourceVertices[i] と targetVertices[i] は必ず対応する
```

target rule:

```text
faceLandmark:
  if excluded or expressionSensitive or iris:
    target = current
  else:
    target = alignedRenderedIdeal478[index]

nearFaceGrid:
  target = source
  または後続検証で弱く face boundary に追従

backgroundGrid:
  target = source

screenEdgeAnchor:
  target = source
```

初期版では nearFaceGrid / backgroundGrid / screenEdgeAnchor は source = target を基本にします。現時点の
Live overlay では landmark ベースの mesh source / target debug を先に表示し、triangle mesh と実 warp は
まだ接続しません。

## 最初の成功判定

最初に確認することは、OBJ を current yaw / pitch / roll で render した画像を MediaPipe が顔として検出できるかです。

確認項目:

- `renderDetectionSuccess`
- `returnedLandmarkCount`
- `alignedRenderedIdeal478` live overlay
- renderedIdeal pose
- current pose と renderedIdeal pose の差
- `alignedRenderedIdeal478` の bounds / center / scale
- live overlay で current と target が破綻していないか
- expressionSensitive landmarks が current 固定になっているか
- 口・目が無表情 OBJ 側へ引っ張られていないか
- WebGL mesh warp preview で顔全体が自然に少しだけ寄るか

## 後続の実装単位案

次段階の実装単位案は以下です。

PR:

```text
expressionSensitive current固定 rule を入れる
finalSourceVertices / finalTargetVertices を作る
triangle indices を作る
WebGL mesh warp preview へ接続
```

## Non-goals

このラボでは以下を行いません。

- Engine Runtime への OBJ render 実装
- Engine Runtime への MediaPipe re-detection 実装
- Beauty Studio への接続
- IdealFace Authoring Tool への接続
- Layer Mask Authoring Tool への接続
- production asset export
- `expressionFollow v1` の正式実装
- OBJ vertex coordinate と MediaPipe image-normalized coordinate の混在
- render image pixel coordinate を alignment / mesh pair 処理へ持ち込むこと
- Runtime / Studio / Authoring Tool 本線への接続

## Pose Mapping detect performance debug

`Pose Mapping（姿勢対応）` runtime 検証に `Detect Performance（検出速度）` セクションを追加しました。

目的は、`MediaPipe mode comparison（モード比較）` では軽く見えていた `detect()` が、`Pose Mapping（姿勢対応）` 経路では重く見える理由を切り分けることです。方式を変える検証ではなく、計測範囲を分離して原因候補を確認します。

計測ケース:

- `detect only / rendered ideal`: 現在の profile 条件で render した detect canvas に対して、MediaPipe `detect()` 呼び出しだけを測る
- `render only`: 現在の `p` で detect 用 offscreen canvas に OBJ render する時間だけを測る
- `render + detect`: OBJ render と `detect()` を連続実行し、`renderMs` / `detectMs` / `totalMs` を分けて測る
- `preview generation / overlay`: detect 用 canvas から debug snapshot を生成し、`renderedIdeal478` overlay、`toDataURL()` を測る
- `resolution sweep`: `1179 / 1024 / 768 / 640 / 512` の縮小 canvas に対する `detect()` を比較する
- `control MP4 canvas detect`: 可能な場合、MP4 current frame を canvas に描画し、同じ IMAGE mode landmarker で `detect()` だけを測る

計測範囲:

- `detect only` には debug snapshot 生成、overlay、`toDataURL()`、DOM update、state update を混ぜない
- `render only` には `detect()`、debug snapshot 生成、overlay、`toDataURL()`、DOM update、state update を混ぜない
- `render + detect` は OBJ render と `detect()` を測るが、debug snapshot 生成と UI update は含めない
- `preview generation / overlay` は、detect 用 canvas から debug snapshot 用画像を作る処理、overlay、`toDataURL()` を detectMs とは別に測る
- UI state update は原則として計測外とし、benchmark 完了後にまとめて state へ反映する

FaceLandmarker は benchmark 中に毎回作り直さず、既存の IMAGE mode（静止画モード）用 `renderedIdealFaceLandmarker` を再利用します。debug summary / JSON には `runningMode`、requested delegate、instance reused、create count を出します。

`resolution sweep（解像度比較）` は速度確認用です。通常の `P_confirm` 検証は profile 条件の detect canvas、たとえば `1179 x 1179` を維持し、runtime 本線の detect canvas を低解像度へ変更しません。

`Download Detect Performance JSON（検出速度JSONダウンロード）` は `pose_mapping_detect_performance_debug_v1` として、source、profile、runtime pose、landmarker、render settings、benchmark options、case summaries、per-run timing samples を出力します。各 sample には時間と検出結果だけを保存し、478点配列は保存しません。

`Download Detect Performance CSV（検出速度CSVダウンロード）` は 1 行 1 sample で、`caseId`、`label`、`sourceKind`、canvas size、`runIndex`、`phase`、`renderMs`、`detectMs`、`previewMs`、`overlayMs`、`toDataUrlMs`、`totalMs`、`detected`、`landmarkCount`、`errorMessage` を出力します。

## Render -> Detect Handoff debug

`Detect Performance（検出速度）` の結果、`detect only / rendered ideal` は軽い一方、`render + detect` では render 直後の `detectMs` が大きくなる可能性が見えました。

そのため、`Pose Mapping（姿勢対応）` Debug タブの `Detect Performance（検出速度）` セクション内に、`Render -> Detect Handoff（レンダーから検出への受け渡し）` benchmark を追加しました。

目的は、Canvas2D OBJ render 直後に MediaPipe `detect()` を呼ぶことで、描画確定、GPU同期、ピクセル転送、readback 系の待ち時間がどこに乗っているかを切り分けることです。通常の poseMapping runtime は profile 条件の detect canvas を維持し、`render -> detect` 経路を勝手に非同期化しません。

比較する handoff strategy:

- `immediate`: OBJ render 後、同じ tick で即 `detect()`
- `requestAnimationFrame_1`: OBJ render 後、`requestAnimationFrame` を1回待ってから `detect()`
- `requestAnimationFrame_2`: OBJ render 後、`requestAnimationFrame` を2回待ってから `detect()`
- `setTimeout_0`: OBJ render 後、`setTimeout(0)` を待ってから `detect()`
- `createImageBitmap`: OBJ render 後、`createImageBitmap(detectCanvas)` を作成し、可能なら `detect(imageBitmap)`
- `copy_to_second_canvas`: OBJ render 後、別 canvas へ `drawImage()` でコピーしてから `detect(secondCanvas)`
- `double_buffer_previous_frame`: 2つの offscreen canvas を交互に使い、前回 render 済み canvas を `detect()` しながら次 buffer に render
- `explicit_readback`: OBJ render 後、`getImageData(0, 0, 1, 1)` で小範囲 readback を測ってから `detect()`

計測範囲:

- 各 case は `renderMs`、`waitMs`、`bitmapCreateMs`、`copyMs`、`readbackMs`、`detectMs`、`totalMs` を分けて保存する
- preview 生成、overlay、`toDataURL()`、毎 run ごとの DOM update は含めない
- FaceLandmarker は既存の IMAGE mode 用 `renderedIdealFaceLandmarker` を再利用し、benchmark 中に毎回作り直さない
- GPU delegate 指定は既存の `delegate: "GPU"` を維持する
- raw 478 landmarks は sample ごとに保存せず、timing、detected、landmarkCount、errorMessage を保存する

`Download Handoff JSON（受け渡しJSONダウンロード）` は `pose_mapping_render_detect_handoff_debug_v1` として、source、profile、runtime pose、landmarker、render settings、benchmark options、case summaries、per-run timing samples、簡易 conclusion hints を出力します。

`Download Handoff CSV（受け渡しCSVダウンロード）` は 1 行 1 sample で、`caseId`、`label`、`handoffStrategy`、canvas size、`runIndex`、`phase`、`renderMs`、`waitMs`、`bitmapCreateMs`、`copyMs`、`readbackMs`、`detectMs`、`totalMs`、`detected`、`landmarkCount`、`errorMessage` を出力します。

この検証は速度確認用であり、poseMappingProfile evaluator、p,P dataset 生成、mode comparison には影響させません。実運用への適用判断は handoff benchmark の結果を見てから行います。

## WebGL OBJ Render Benchmark

## WebGL OBJ renderer 本線化

通常 runtime の `P_camera -> p -> OBJ render -> MediaPipe detect() -> P_confirm / renderedIdeal478` 経路は、
Canvas2D OBJ renderer ではなく WebGL OBJ renderer を使います。MediaPipe `detect()` には WebGL canvas を
そのまま渡し、`renderedIdeal478` は従来通り detect canvas 基準の normalized landmark として保持します。
preview 表示時だけ `displayedContentRect` に合わせて overlay 座標へ変換します。

p,P dataset 生成も WebGL renderer に固定します。出力 dataset は `obj_pose_mapping_dataset_v3` とし、
最低限 `renderBackend: "webgl"`、`renderer.version`、`renderer.rendererSignature`、
`renderer.projectionMode`、`renderer.renderResolution`、`renderAppearance.applied.renderResolution` を保存します。Canvas2D renderer は
legacy baseline / debug 比較としてのみ残し、新しい p,P dataset 生成には使いません。

Colab / Python 解析は WebGL dataset だけから `pose_mapping_profile_candidate_v2` を出力します。
candidate には `requiredRenderBackend: "webgl"`、`requiredRenderer.rendererSignature`、
`requiredRenderer.kind`、`requiredRenderer.version`、`requiredRenderer.projectionMode`、
`requiredRenderer.renderResolution`、`datasetSchemaVersion` を含めます。runtime は profile 読み込み後、
現在の WebGL renderer 条件と一致しない場合に warning ではなく error として停止します。

Canvas2D render -> detect では、render 直後の canvas 同期、描画確定、readback コストが `detectMs` 側に乗る可能性があります。OBJ render 頻度を落とす案は `renderedIdeal478` の追従品質が下がりやすいため、通常 runtime と p,P dataset 生成の OBJ render 本線を WebGL OBJ Renderer に切り替えます。

Canvas2D renderer は legacy baseline / debug 比較として維持します。WebGL renderer は、同じ `p` を WebGL で描画した場合に、OBJ render が速くなるか、render -> detect の同期コストが下がるか、MediaPipe が顔として検出できるか、`P_confirm` が `P_camera` に近いかを確認しつつ、通常 runtime と p,P dataset 生成で使う renderer です。

比較する case:

- `WebGL render only`: WebGL で OBJ を描画するだけ
- `WebGL render -> detect`: WebGL canvas をそのまま MediaPipe `detect()` に渡す
- `WebGL render -> gl.finish() -> detect`: WebGL 描画完了を明示してから `detect()`
- `WebGL render -> readPixels(1x1) -> detect`: WebGL 側で小範囲 readback を前倒ししてから `detect()`
- `WebGL render -> createImageBitmap -> detect`: WebGL canvas から ImageBitmap を作成し、可能なら `detect(imageBitmap)`
- `WebGL render -> copy to 2D canvas -> detect`: WebGL canvas を 2D canvas にコピーしてから `detect(2dCanvas)`
- `Canvas2D baseline reference`: Canvas2D immediate render -> detect と explicit readback -> detect の簡易比較

WebGL renderer は既存 OBJ parser / OBJ mesh data を再利用します。見た目を Canvas2D renderer に近づけるため、orthographic 相当の投影、profile renderAppearance の `backgroundColor`、`skinColor`、material diffuse / ambient、ambient + key light の簡易 Lambert、camera scale / verticalOffset / renderResolution を使います。`material.specular`、`lighting.castShadow`、`camera.fovDeg`、`camera.projection` は未対応の比較 metadata として記録します。

WebGL context、shader、buffer は benchmark 用 renderer インスタンスで再利用し、毎 run ごとには作り直しません。FaceLandmarker も既存 IMAGE mode 用 `renderedIdealFaceLandmarker` を再利用し、GPU delegate 指定を維持します。各 sample には timing、detected、landmarkCount、`P_confirm`、poseDiff summary を保存し、478点配列は保存しません。

WebGL renderer は通常 runtime と p,P dataset 生成の本線です。MediaPipe は OBJ 形状そのものではなくレンダリングされた 2D 画像を見ているため、WebGL renderer の見た目条件が変わった場合は WebGL 条件で p,P dataset と poseMappingProfile を作り直します。mode comparison と既存 benchmark は比較 / debug 用として維持します。

`Download WebGL Benchmark JSON（WebGLベンチマークJSONダウンロード）` は `pose_mapping_webgl_obj_render_benchmark_v1` として、source、profile、runtime pose、landmarker、render settings、WebGL support、benchmark options、case summaries、per-run timing samples、conclusion hints を出力します。

`Download WebGL Benchmark CSV（WebGLベンチマークCSVダウンロード）` は 1 行 1 sample で、`caseId`、`label`、`rendererKind`、`handoffStrategy`、canvas size、`runIndex`、`phase`、`webglRenderMs`、`finishMs`、`readPixelsMs`、`bitmapCreateMs`、`copyTo2dMs`、`detectMs`、`totalMs`、`detected`、`landmarkCount`、`P_confirm`、poseDiff、`errorMessage` を出力します。

## 関連ドキュメント

- [Ideal Reference Mesh Warp Lab](ideal-reference-mesh-warp-lab.md)
- [Ideal Reference Coordinate Lifecycle Investigation](ideal-reference-coordinate-lifecycle-investigation.md)
- [Shape Warp production direction](shape-warp-production-direction.md)
- [アーキテクチャ](architecture.md)
- [リポジトリ構成](repository-structure.md)
