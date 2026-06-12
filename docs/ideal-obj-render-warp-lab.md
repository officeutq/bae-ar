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
Colab では `# %%` 区切りをセルとして実行できます。入力は `obj_pose_mapping_dataset_v2`
JSON を想定し、v1 も読み取り可能です。

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
現在対応する `schemaVersion` は `pose_mapping_profile_candidate_v1`、`modelType` は
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

runtime 検証では、MediaPipe `detect()` に渡す canvas と UI preview canvas を分離します。
`detect()` 用 canvas は画面表示サイズに追従させず、profile / dataset metadata のレンダー条件で固定します。
renderResolution の優先順は以下です。

1. `poseMappingProfile.datasetMetadata.renderAppearance.applied.renderResolution.width / height`
2. `poseMappingProfile.datasetMetadata.renderSettings.canvasWidth / canvasHeight`
3. fallback default `1179 x 1179`

`P_confirm` は、この detect 用 offscreen canvas に `p` で理想 OBJ をレンダーし、その画像を
MediaPipe `detect()` / IMAGE mode に渡して取得します。UI の `現姿勢理想478プレビュー` は
offscreen canvas の画像を fit 表示し、`renderedIdeal478` は detect canvas 基準の normalized landmark
として保持したまま、preview canvas 座標へ変換して overlay 表示します。preview canvas に変換済みの
座標だけを debug JSON に保存しません。

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
- Download: `pose_mapping_runtime_debug_v1` JSON download

`Pose Mapping（姿勢対応）` タブには専用の
`Download Pose Mapping Debug（姿勢対応デバッグをダウンロード）` を置きます。この export は既存の
`モード比較` タブの JSON / CSV download とは別の `pose_mapping_runtime_debug_v1` JSON です。
`renderSettings` には detectCanvasWidth / detectCanvasHeight、previewCanvasWidth / previewCanvasHeight、
renderResolutionSource、detectCanvasMatchesProfile、profileCanvasWidth / profileCanvasHeight を含めます。
`renderAppearanceApplied` には runtime 側で適用したレンダー見た目条件と
notAppliedRenderAppearanceFields を含めます。最新フレームの `current478` と `renderedIdeal478` は
必要最小限の確認用として含めてよいですが、`renderedIdeal478` は detect canvas 基準の normalized
landmark として保存し、preview canvas に変換済みの座標だけを保存しません。毎フレーム履歴として
大量に保存しません。

Live タブの旧 `現姿勢OBJ` 欄は使わず、`現姿勢理想478プレビュー` に置き換えます。このプレビューは
`poseMappingProfile` で得た `p` により理想OBJをレンダーし、そのレンダー画像から得た
`renderedIdeal478` を同じレンダー画像上に overlay 表示します。preview 表示は Live タブに一本化し、
右ペイン `Pose Mapping（姿勢対応）` タブには画像 preview を置きません。Pose Mapping タブには
詳細 debug と download を残し、preview の代わりに Live タブへ移動済みである短い案内だけを表示します。

Live タブの preview は detect 用 offscreen canvas の画像を aspect-fit で表示します。source image の縦横比を
維持して preview 領域に収め、余白が出る場合は中央寄せにします。`renderedIdeal478` overlay は
detect canvas 基準の normalized landmark を preview の displayed content rect へ変換して描画します。
preview canvas 全体へ単純に `x * previewWidth` / `y * previewHeight` で描画して縦横比を崩す実装にはしません。
ライブ現在顔への重ね表示と warp（変形加工）は次段階の TODO とし、この段階では実装しません。
preview PNG download は未実装 TODO です。

初期 profile:

- `current`: 既存レンダー条件の baseline
- `soft_light_no_shadow`: 影なし・柔らかい光
- `camera_soft_light`: カメラ正面固定ライト
- `high_contrast_background`: 背景コントラスト確認
- `yaw_edge_friendly`: 横向き輪郭補助
- `stable_crop_fov`: 安定した顔サイズ・視野角

alignment では、aspect-corrected image coordinate を使います。

```text
x' = x * videoAspectRatio
y' = y
```

bounds、center、uniform scale、distance、large displacement は aspect-corrected image coordinate で計算します。alignment 後の `candidateAlignedIdealLandmarks` は image-normalized coordinate として mesh pair / overlay / WebGL mesh warp 入力へ戻します。

overlay は以下の変換で行います。

```text
image-normalized coordinate
  -> displayedContentRect pixel
```

pixel coordinate、OBJ vertex coordinate、WebGL clip space は、MediaPipe returned landmarks 取得後の alignment / mesh pair 処理には混ぜません。render image の pixel coordinate は MediaPipe 入力用に閉じ込めます。MediaPipe から戻ってきた `renderedIdeal478` は image-normalized coordinate として扱います。

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
  -> candidateAlignedIdealLandmarks
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
   -> candidateAlignedIdealLandmarks

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
  if expressionSensitive:
    target = current
  else:
    target = lerp(current, candidateAlignedIdealLandmarks[index], usageWeight)

nearFaceGrid:
  target = source
  または後続検証で弱く face boundary に追従

backgroundGrid:
  target = source

screenEdgeAnchor:
  target = source
```

初期版では nearFaceGrid / backgroundGrid / screenEdgeAnchor は source = target を基本にします。

## 最初の成功判定

最初に確認することは、OBJ を current yaw / pitch / roll で render した画像を MediaPipe が顔として検出できるかです。

確認項目:

- `renderDetectionSuccess`
- `returnedLandmarkCount`
- renderedIdeal478 overlay
- renderedIdeal pose
- current pose と renderedIdeal pose の差
- `candidateAlignedIdealLandmarks` の bounds / center / scale
- meshPairPreview で current と target が破綻していないか
- expressionSensitive landmarks が current 固定になっているか
- 口・目が無表情 OBJ 側へ引っ張られていないか
- WebGL mesh warp preview で顔全体が自然に少しだけ寄るか

## 実装単位案

今回は docs のみで、実装コードは変更しません。後続の実装単位案は以下です。

PR1:

```text
tools/ideal-obj-render-warp-lab を追加
ideal-reference-mesh-warp-lab をベースにする
model video scan / reference library / top1 matching を削る
OBJ input / OBJ render / renderedIdeal MediaPipe analysis を追加
renderedIdeal478 overlay まで確認
```

PR2:

```text
renderedIdeal478 を current478 へ alignment
candidateAlignedIdealLandmarks として扱う
mesh pair preview を表示
```

PR3:

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

## 関連ドキュメント

- [Ideal Reference Mesh Warp Lab](ideal-reference-mesh-warp-lab.md)
- [Ideal Reference Coordinate Lifecycle Investigation](ideal-reference-coordinate-lifecycle-investigation.md)
- [Shape Warp production direction](shape-warp-production-direction.md)
- [アーキテクチャ](architecture.md)
- [リポジトリ構成](repository-structure.md)
