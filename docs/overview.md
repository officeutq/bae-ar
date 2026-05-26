# BAE AR 概要

## BAE AR とは

BAE AR は、Web 上でリアルタイム顔加工・AR 表現を行う Beauty Engine Runtime と、その開発・検証・調整を行う Beauty Studio、将来の authoring tool 群を含むプロジェクトです。

目標は、顔を単純な 2D 点群として動かすのではなく、現在の顔の構造・姿勢・表情を読み取り、自然で破綻しにくい補正を行う Engine Runtime を作ることです。

## 4 つの領域

```text
BAE AR

├─ Engine Runtime
│  └─ 本番でリアルタイム加工する UI なしの中核 SDK
│
├─ Beauty Studio
│  └─ Engine を開発・検証・調整する開発ツール
│
├─ IdealFace Authoring Tool
│  └─ 理想 3D 顔プリセットを作成する authoring tool。Step 2-I-A/B/C と Step 2-H まで実装済み
│
└─ Layer Mask Authoring Tool
   └─ 色加工用 LayerMaskSpec を作成する将来ツール
```

現在の実装は `packages/engine`、`apps/studio`、`tools/ideal-face-authoring` が中心です。`tools/ideal-face-authoring` は Step 2-I-A/B/C と Step 2-H まで実装済みで、`tools/layer-mask-authoring` は将来予定です。

## 現在の到達点

現在の Runtime / Studio 実装は、カメラ映像を `HTMLVideoElement` として取得し、`BeautyEngine.setInput()` に渡し、MediaPipe Face Landmarker を使って `FaceFrame` を更新する段階です。FacePose の実推定、IdealFace v1、Natural v1 最小プリセット、IdealFace 公開 API、`idealLandmarks3D` 478点 Projection、current-vs-projected ideal 478点 difference debug、Studio overlay / debug / Copy Debug 関連は実装済みです。

Studio では、Engine の公開 API から取得できる `FaceFrame` / `FaceGeometry` / debug 情報を表示し、landmarks と補助 geometry point を overlay で確認できます。

```text
Camera input
  -> HTMLVideoElement
  -> BeautyEngine.setInput()
  -> MediaPipeFaceDetector
  -> FaceFrame loop
  -> FaceFrame 更新
  -> Studio debug / overlay
```

## IdealFace の考え方

IdealFace は、BAE AR 独自の理想 3D 顔プリセットです。IdealFace の本体は、3D の `idealLandmarks3D` 478点です。MediaPipe 478 landmarks そのものではなく、正面固定の 2D landmarks でもありません。

MediaPipe canonical face model は、MediaPipe 側が landmark 検出や face geometry のために使う標準顔モデル、つまり MediaPipe 内部の標準顔お面です。BAE AR は MediaPipe の topology、landmark index、canonical model の考え方を参考にする可能性がありますが、MediaPipe canonical face model そのものを作成・編集対象にはしません。

BAE AR が作る IdealFace は、BAE AR 独自の理想顔空間です。「こう寄せたい」という理想顔を表す canonical face / お面データを IdealFace asset として管理します。MediaPipe 標準顔 = BAE AR 理想顔、とはしません。MediaPipe は検出側の基準、BAE AR IdealFace は補正・比較側の基準です。

Engine Runtime では、IdealFace の `idealLandmarks3D` 478点を現在顔の `FacePose` へ投影し、現在姿勢を反映した projected ideal 2D landmarks 478点を生成します。shape processing は、MediaPipe Face Landmarker がカメラ映像から取得した current 478 landmarks と、projected ideal 478 landmarks を比較して進みます。

2D 動画 / 複数画像から IdealFace を作る処理は、リアルタイム処理ではなく IdealFace Authoring Tool の責務です。IdealFace Authoring Tool は BAE AR 独自の IdealFace asset を作成・調整するツールであり、MediaPipe canonical face model そのものを作るツールではありません。`natural_v1` の controlPoints は現段階の投影検証用データであり、IdealFace 本体ではありません。

## correctionProfile v1 の位置づけ

`correctionProfile` v1 は、`ideal_face_asset_v1` の optional top-level field として Engine foundation 実装済みです。`idealLandmarks3D` は理想顔の形状データ、`correctionProfile` は各 landmark をどれくらい projected ideal へ寄せるかを表す設定として分けます。Authoring Tool 編集 UI、asset export 連携、`beauty_filter_asset_v1` foundation は未実装です。

`correctionProfile` は landmark ごとの `strength` と fallback / clamp 設定を持ちますが、dx / dy は保存しません。dx / dy は current landmarks、projected ideal `imageLandmarks`、顔姿勢、表情によって毎フレーム変わるため、Engine Runtime が毎フレーム計算します。

Engine 側では、MediaPipe blendshape score に応じて `affectedLandmarkGroups` ごとの `strengthScale` を弱める `expressionAttenuation` v1 foundation も実装済みです。ただし今後の中心仕様では、表情時に単純に group の補正強度を下げるのではなく、表情ごとに landmark が neutral な projected ideal へどれだけ追従するかを定義する `expressionFollow v1` を優先します。

`expressionFollow v1` では、`idealFollowStrength` を `0.0 = current / camera を優先`、`1.0 = projected ideal を優先` と定義します。`landmarkGroups` は rule の対象範囲、`landmarkFollowStrengths` は landmark ごとの追従率です。`landmarkFollowStrengths[].idealFollowStrength` は rule 最大時の target value であり、実行時は blendshape score と `inputRange` から `ruleAmount` を計算して、`1.0` から target へ補間した `effectiveIdealFollowStrength` を使います。`landmarkFollowStrengths` は MP4 の表情別 frame group から neutral 3D 478 / expression 3D 478 を同じ `comparisonSpace` で比較し、3D 差分から自動生成する方針です。詳細は [MP4 expression 3D analysis plan](mp4-expression-3d-analysis-plan.md) に整理します。

詳細仕様は [correctionProfile v1](correction-profile-v1.md)、[expressionFollow v1](expression-follow-v1.md)、[MP4 expression 3D analysis plan](mp4-expression-3d-analysis-plan.md)、[usage-aware frame sampling v1](usage-aware-frame-sampling-v1.md)、[expression-aware correctionProfile](expression-aware-correction-profile.md) を参照してください。Engine 側 foundation、validation / fallback、expressionAttenuation v1 foundation、Studio debug summary、CorrectionPlan v1 debug foundation、Studio 向け Shape Warp v1 debug prototype は実装済みです。`expressionFollow v1` 実装、MP4 expression 3D analysis、Authoring Tool 編集 UI、asset export 連携、Production Shape Warp は未実装です。

`landmarkGroups v1` は docs specification、Engine foundation、asset / fallback group source handling、Studio debug / Copy Debug summary、IdealFace Authoring Tool Landmark Group Editor v1 prototype、`ideal_face_asset_v1` optional `landmarkGroups` export まで実装済みです。`expressionAttenuation falloff v1` は新方針では主役ではなく、fallback / 参考案として扱います。

## IdealFace Projection の座標系方針

IdealFace Projection から Shape Warp へ進むため、座標系は以下の 3 種類に分けます。

```text
same-unit coordinate
  IdealFace asset / idealLandmarks3D の基準座標。
  x/y が同じ距離単位になるように Authoring Tool で正規化する。
  Projection 内部、FacePose rotation、uniform alignment に使う。

image-normalized coordinate
  MediaPipe current landmarks と同じ座標系。
  x は画像幅基準、y は画像高さ基準。
  Studio overlay、current-vs-ideal difference、CorrectionPlan 入力に使う。

pixel coordinate
  canvas / video frame 上の実 pixel 座標。
  最終的な描画や画像変形に使う。
```

`idealLandmarks3D` は same-unit coordinate として扱い、Runtime Projection は same-unit 空間で回転と face center / uniform scale alignment を行います。Runtime では x/y 別 scale を行わず、IdealFace の縦横比を現在顔に合わせて歪めません。same-unit の projected ideal landmarks を、そのまま `x * canvasWidth` / `y * canvasHeight` で描画してはいけません。

Studio overlay、current-vs-ideal difference、CorrectionPlan へ渡す projected ideal landmarks は image-normalized coordinate として扱います。Projection result は、Projection / alignment / debug 用の `sameUnitLandmarks` と、overlay / difference / Shape Warp 入力用の `imageLandmarks` を分けて持ちます。Studio overlay は `imageLandmarks` を使い、same-unit landmarks をそのまま canvas pixel に変換しません。Image warp では、必要に応じて image-normalized coordinate から pixel coordinate へ変換します。

## IdealFace Authoring Tool における idealLandmarks3D 作成方針

IdealFace の本体である `idealLandmarks3D` 478点は IdealFace Authoring Tool 側で作成します。現在の active workflow は Step 2-I-A/B/C と Step 2-H です。

Current active workflow:

```text
MP4 input
  -> detailed scan
  -> Step 2-I-A frame selection
       frontReference / useForInference / expressionGroup / excluded を 1フレーム1カードで設定
  -> Step 2-I-B pose-aware inference dataset
  -> Step 2-I-C pose_aware_weighted_z_v1 candidate generation
       roll 補正
       yaw / pitch / weight による z hint
       idealLandmarks3D 478点候補生成
  -> Step 2-H currentCandidate point cloud preview
```

Removed legacy workflow:

旧 Step 2-C〜2-G v1 の 5ポーズ方式は過去の実装です。現在コードからは UI / state / JSON preview / generation helper を削除済みで、必要な場合は Git 履歴を参照します。現在の docs では、旧方式を現行の authoring 主導線として扱いません。

削除済みの代表例:

- old five-pose candidate UI
- `selectedRepresentativeFrames`
- `idealLandmarks3DInferenceDataset`
- `representativeFrameCandidates` / representative candidate UI and JSON preview
- `legacy.step2Gv1` JSON preview
- `buildIdealLandmarks3DCandidateResult()`
- `inferCandidateZ()`
- `inferCandidateConfidence()`
- `generationMethod: "step_2_g_v1"`

この処理は完全自動生成ではなく、自動推定 + 将来の手動補正として扱います。Step 2-I-A の frame usage では、`frontReference` / `useForInference` / `expressionGroup` は重複可能な用途タグ、`excluded` は排他的な除外タグとして扱います。`frontReference` は自動 bucket ではなく、ユーザーが手動選択する正面基準です。`poseOutOfRange` / `mixedExpression` / `pending` / `missingBlendshapes` は自動除外ではなく注意タグとして扱い、landmarks / pose が有効な frame は pose-aware 3D 推定に残せます。Expression grouping は expression dropdown の自動初期値を作るために使い、neutralFrames は将来 `frontReferenceFrames` の中から表情が少ないものを選ぶ方針です。`usage-aware frame sampling v1` では、`frontReferenceCandidate` を自動候補として提示し、`idealFaceInference` / expression groups を用途 bucket として targetCount までバランスよく採用します。動画入力、詳細スキャン、pose-aware dataset 作成、candidate generation、3D point cloud preview は IdealFace Authoring Tool の責務であり、Engine Runtime には含めません。

Authoring Tool は `idealLandmarks3D` を same-unit coordinate として生成します。`video_aspect_same_unit_v1` による video aspect 補正、pose-aware generation、将来の manual adjustment UI は Authoring Tool 側の責務です。Runtime は完成済み IdealFace asset を読み込み、same-unit の `idealLandmarks3D` を `FacePose` に投影し、overlay / difference / warp 用に image-normalized / pixel 座標へ変換します。Runtime は Authoring generation logic を持ちません。

## IdealFace Authoring Tool active workflow

Current active workflow:

```text
MP4 input
  -> detailed scan
  -> Step 2-I-A frame selection
       frontReference / useForInference / expressionGroup / excluded を 1フレーム1カードで設定
  -> Step 2-I-B pose-aware inference dataset
  -> Step 2-I-C pose_aware_weighted_z_v1 candidate generation
       roll 補正
       yaw / pitch / weight による z hint
       idealLandmarks3D 478点候補生成
  -> Step 2-H currentCandidate point cloud preview
```

Removed legacy workflow:

旧 Step 2-C〜2-G v1 の 5ポーズ方式は過去の実装です。現在コードからは UI / state / JSON preview / generation helper を削除済みで、必要な場合は Git 履歴を参照します。現在の docs では、旧方式を現行の authoring 主導線として扱いません。

削除済みの代表例:

- old five-pose candidate UI
- `selectedRepresentativeFrames`
- `idealLandmarks3DInferenceDataset`
- `representativeFrameCandidates` / representative candidate UI and JSON preview
- `legacy.step2Gv1` JSON preview
- `buildIdealLandmarks3DCandidateResult()`
- `inferCandidateZ()`
- `inferCandidateConfidence()`
- `generationMethod: "step_2_g_v1"`

Current JSON preview:

```text
activeSummary
poseAware
currentCandidate
reference
debug
```

`currentCandidate` は Step 2-H preview に表示される現在の candidate です。`generationMethod` は `pose_aware_weighted_z_v1` で、478 landmarks 全文は出さず、summary と先頭数点 preview に留めます。`natural_v1` の 6 controlPoints は reference / projection debug 用であり、IdealFace 本体は `idealLandmarks3D` 478点です。

legacy / debug と分類した helper には、今後の新機能を追加しません。現行 UI には Step 2-G v1 を旧方式として示す注記が残っていますが、active workflow は Step 2-I です。confidence debug、手動微調整 UI、保存 / import、correctionProfile / beauty_filter_asset_v1 export は Step 2-I active workflow 側で扱います。

Still planned:

- confidence debug
- manual adjustment UI
- save / import
- correctionProfile / beauty_filter_asset_v1 export
- multiple image input

## Shape Processing の考え方

shape processing は、個別パーツを独立して大きく変える方向にはしません。

```text
現在顔から MediaPipe 478 landmarks を取得
  -> FacePose を推定
  -> IdealFace 3D model を same-unit coordinate で現在姿勢へ投影
  -> projected ideal 478 landmarks を image-normalized coordinate へ変換
  -> current image-normalized landmarks と projected ideal image-normalized landmarks の差分を取る
  -> CorrectionPlan を生成
  -> 顔全体として自然に少し warp
```

Shape Processing の差分は image-normalized coordinate で計算します。current 478 landmarks は MediaPipe 由来の image-normalized 座標です。projected ideal 478 landmarks は、IdealFace same-unit landmarks を `FacePose` へ投影し、alignment 後に image-normalized 座標へ変換したものです。差分は `deltaX = projectedIdealImageX - currentX`、`deltaY = projectedIdealImageY - currentY` として `CorrectionPlan` に渡します。

CorrectionPlan v1 debug foundation は、`correctionProfile` の `strength` をこの差分に掛け、`maxCorrectionDistance` で clamp した correction vector を生成します。今後の `expressionFollow v1` では、blendshape score に応じて各 landmark の `effectiveIdealFollowStrength` を決め、`finalStrength = baseStrength * effectiveIdealFollowStrength` として表情による自然なズレを許容します。既存 `expressionAttenuation` foundation は safety attenuation として残りますが、中心仕様は `expressionFollow v1` です。`correctionProfile` は個別パーツ加工命令ではなく、current から projected ideal へ全体として自然に少し寄せるための補正率です。

やらないこと:

- 目だけ大きくする
- 鼻だけ細くする
- 顎だけ削る
- 個別パーツ加工を主機能として増やす

## FaceGeometry の位置づけ

`FaceGeometry` は補助情報です。

用途:

- debug
- overlay
- 顔サイズ確認
- 代表点確認
- 将来の安定化・正規化補助

shape processing の中心は `FaceGeometry` ではなく、current 478 landmarks と IdealFace 由来の ideal 478 landmarks です。

## Layer System の考え方

Layer System は shape warp ではなく、color processing 用に使います。

対象:

- skin smoothing
- whitening
- brightness
- tone
- blood color
- shadow / highlight
- cheek / lip / eye area などの色補正

Layer は色加工範囲、効果、強度、合成順を整理する仕組みです。`jaw_layer` で顎を削る、`eye_layer` で目を大きくする、`nose_layer` で鼻を細くする、のような使い方はしません。

## beauty_filter_asset_v1 の方向性

最終的なフィルター / プリセットは、複数の独立 JSON ではなく、1つの `beauty_filter_asset_v1` JSON として配布する方針です。

内部構造は責務ごとに分離します。

```text
beauty_filter_asset_v1
  ├─ idealFace
  ├─ landmarkGroups
  ├─ correctionProfile
  ├─ shapeWarpSettings
  └─ colorLayers
```

`idealFace` は理想顔の形状、`landmarkGroups` は MediaPipe landmark index の意味領域、`correctionProfile` は shape correction の強度と `expressionFollow` による表情時の追従制御、`shapeWarpSettings` は warp renderer / smoothing / boundary の設定、`colorLayers` は色加工、mask、合成順、opacity を扱います。

`landmarkGroups` は、`expressionFollow` / `expressionAttenuation` の `affectedLandmarkGroups` と、将来の `colorLayers` が参照する `skin` / `lip` / `cheek` などの group の整合性を保つために使います。Layer System は shape warp 用ではなく、color processing 用です。`landmarkGroups v1` の JSON 仕様、Engine fallback、validation、Landmark Group Editor 方針は [landmarkGroups v1](landmark-groups-v1.md) に整理します。現在は Engine foundation、Authoring Tool Landmark Group Editor v1 prototype、`ideal_face_asset_v1` optional export まで実装済みです。

詳細は [beauty_filter_asset_v1 direction](beauty-filter-asset-v1.md) を参照してください。`beauty_filter_asset_v1` foundation、shapeWarpSettings、colorLayers、Production Shape Warp、Color Processing はまだ実装しません。

## IdealFace Authoring Tool detailed scan

詳細スキャンは Step 2-I-A の frame selection に渡す observation source です。表示用の粗いフレーム抽出は debug / metadata 確認用であり、pose-aware inference の中心データではありません。

現在は detailed scan の結果を Step 2-I-A の frame selection へ渡し、Step 2-I-B の pose-aware dataset、Step 2-I-C の pose-aware weighted z inference v1 へ進みます。

`usage-aware frame sampling v1` では、単純な `maxScanFrames` だけでなく bucket の充足状況を見ながら scan を続けます。ただし `frontReference` は bucket target ではなく手動選択される正面基準として扱い、`frontReferenceCandidate` を自動候補として提示します。無制限にはせず、`maxScanFrames` または `maxScanSeconds` は残します。詳細は [usage-aware frame sampling v1](usage-aware-frame-sampling-v1.md) を参照してください。

## Runtime と Authoring の分離

Engine Runtime は、定義済みの IdealFace / LayerMaskSpec を読み込んで使うだけです。

Engine Runtime で行わないこと:

- IdealFace の作成
- MediaPipe canonical face model の生成・編集
- 2D 動画からの 3D 顔生成
- LayerMaskSpec の作成
- mask の手作業編集
- Studio / Authoring 用 UI

Beauty Studio では、開発確認用として overlay や簡易調整 UI を持ってよいです。ただし、本番配布対象には含めません。

`correctionProfile` v1 の責務分離では、IdealFace Authoring Tool が profile の作成・編集を担い、Engine Runtime が profile の読み込みと fallback、毎フレームの dx / dy 計算、strength 適用、clamp、CorrectionPlan 生成を担います。Beauty Studio は Engine の公開 API から correctionProfile / CorrectionPlan を確認し、debug / Copy Debug / overlay に表示します。

## IdealFace Authoring Tool Step 1 / Step 2-A / Step 2-B

Step 1 の `natural_v1` metadata と 6 controlPoints は reference / projection debug 用です。IdealFace 本体は `idealLandmarks3D` 478点です。

Step 2-A は MP4 動画入力、metadata 確認、表示用の粗いフレーム抽出を扱います。表示用抽出フレームは debug / metadata 確認用であり、Step 2-I の observation source ではありません。

Step 2-B は MediaPipe による 2D 478 landmarks と FacePose の取得を扱います。その後続は旧 Step 2-C〜2-G ではなく、detailed scan から Step 2-I-A/B/C の pose-aware workflow へ進みます。

## IdealFace Authoring Tool removed Step 2-C to 2-G v1 history

Removed legacy workflow:

旧 Step 2-C〜2-G v1 の 5ポーズ方式は過去の実装です。現在コードからは UI / state / JSON preview / generation helper を削除済みで、必要な場合は Git 履歴を参照します。現在の docs では、旧方式を現行の authoring 主導線として扱いません。

削除済みの代表例:

- old five-pose candidate UI
- `selectedRepresentativeFrames`
- `idealLandmarks3DInferenceDataset`
- `representativeFrameCandidates` / representative candidate UI and JSON preview
- `legacy.step2Gv1` JSON preview
- `buildIdealLandmarks3DCandidateResult()`
- `inferCandidateZ()`
- `inferCandidateConfidence()`
- `generationMethod: "step_2_g_v1"`

## IdealFace Authoring Tool Step 2-H

Step 2-H は、Step 2-I-C で生成された `currentCandidate` を 3D point cloud preview として確認する表示です。preview camera、y 軸反転、z 表示倍率は表示専用であり、candidate data 自体は変更しません。

Current JSON preview:

```text
activeSummary
poseAware
currentCandidate
reference
debug
```

`currentCandidate` は Step 2-H preview に表示される現在の candidate です。`generationMethod` は `pose_aware_weighted_z_v1` で、478 landmarks 全文は出さず、summary と先頭数点 preview に留めます。`natural_v1` の 6 controlPoints は reference / projection debug 用であり、IdealFace 本体は `idealLandmarks3D` 478点です。

## IdealFace Authoring Tool Step 2-I

Step 2-I is the current active workflow for IdealFace Authoring Tool.

Current active workflow:

```text
MP4 input
  -> detailed scan
  -> Step 2-I-A frame selection
       正面基準の手動選択 / 推定に使うフレーム / 除外フレーム
  -> Step 2-I-B pose-aware inference dataset
  -> Step 2-I-C pose_aware_weighted_z_v1 candidate generation
       roll 補正
       yaw / pitch / weight による z hint
       idealLandmarks3D 478点候補生成
  -> Step 2-H currentCandidate point cloud preview
```

Step 2-I-A keeps frame usage as tags. `frontReference`, `useForInference`, and `expressionGroup` can overlap; `excluded` is the only exclusive tag. Usable observation frames are derived from detailed scan frames that have a detected face, 478 landmarks, `FacePose`, `useForInference = true`, and `excluded = false`.

`poseOutOfRange` is treated as a warning tag, not an automatic exclusion reason. It is not suitable for `frontReference`, but it can still be useful for pose-aware 3D estimation as a z hint / depth observation. `noFace`, `invalidLandmarks`, and `manual` remain exclusion reasons. `mixedExpression`, `pending`, and `missingBlendshapes` are warning tags because they are weak inputs for single-expression rule generation but may still be usable for pose-aware 3D estimation when landmarks and pose are valid.

Step 2-I-B builds `poseAwareInferenceDataset` from front reference frames and observation frames. It does not use fixed five-pose labels.

Step 2-I-C generates the current 3D candidate with `pose_aware_weighted_z_v1`. It roll-corrects observation landmarks, uses yaw / pitch / weight as z hints, and outputs an `idealLandmarks3D` 478-point candidate.

Step 2-H displays that candidate as `currentCandidate` in the point cloud preview.

Removed legacy workflow:

旧 Step 2-C〜2-G v1 の 5ポーズ方式は過去の実装です。現在コードからは UI / state / JSON preview / generation helper を削除済みで、必要な場合は Git 履歴を参照します。現在の docs では、旧方式を現行の authoring 主導線として扱いません。

削除済みの代表例:

- old five-pose candidate UI
- `selectedRepresentativeFrames`
- `idealLandmarks3DInferenceDataset`
- `representativeFrameCandidates` / representative candidate UI and JSON preview
- `legacy.step2Gv1` JSON preview
- `buildIdealLandmarks3DCandidateResult()`
- `inferCandidateZ()`
- `inferCandidateConfidence()`
- `generationMethod: "step_2_g_v1"`

legacy / debug と分類した UI や helper には、今後の新機能を追加しません。confidence debug、手動微調整 UI、保存 / export は Step 2-I active workflow 側に追加します。

## IdealFace / Projection / Shape Processing 中核仕様

BAE AR の shape processing では、IdealFace は 3D の `idealLandmarks3D` 478 点を本体とします。理想 3D 顔プリセットとしての IdealFace は、`idealLandmarks3D` 478 点を中核に持つ asset です。IdealFace が持つ基準は、正面固定の 2D landmarks ではありません。

Runtime は IdealFace の 3D landmarks を現在顔の `FacePose` へ投影し、現在姿勢を反映した 2D の projected ideal 478 landmarks を生成します。正面 2D の 478 点だけでは、yaw / pitch / roll などの顔の角度変化に追随できないため、角度変化への対応は Projection の責務として扱います。

Shape Processing は、MediaPipe Face Landmarker がカメラ映像から取得した current 478 landmarks と、IdealFace 由来の projected ideal 478 landmarks の差分を見ます。この差分が、CorrectionPlan v1 debug foundation / Shape Warp v1 debug prototype へ渡される後段処理の入力になります。

現在の `natural_v1` の 6 点 controlPoints は、現段階の投影検証用データです。これは IdealFace 本体ではなく、IdealFace の本体は `idealLandmarks3D` 478 点です。

```text
IdealFace
  -> idealLandmarks3D: 478点
Runtime Projection
  -> idealLandmarks3D を現在 FacePose へ投影
  -> projected idealLandmarks2D: 478点
Shape Processing
  -> current 478 landmarks と projected ideal 478 landmarks の差分を見る
  -> CorrectionPlan / Shape Warp へ進む
```

`CorrectionPlan` は姿勢補正を担当しません。Projection 後の ideal 2D landmarks は、すでに現在姿勢を反映しているものとして扱います。


## IdealFace Authoring Tool Current Generation Path

Step 2-G v1 five-pose candidate generation has been removed from the current code. The active 3D candidate generation path is Step 2-I-C `pose_aware_weighted_z_v1`, followed by Step 2-H `currentCandidate` point cloud preview. The old five-pose path is available from Git history when needed. Future confidence debug, manual adjustment, save, and export work should be added to the Step 2-I active workflow.

## Shape Warp production direction

現在の Shape Warp v1 debug prototype は、CorrectionPlan の補正ベクトルを Studio の Processed preview に接続して観察するための debug prototype です。CPU radial warp debug と Studio processed preview 限定 WebGL mesh warp v1 prototype は実装済みですが、本番品質の Shape Warp / Runtime renderer ではありません。

本番候補は WebGL mesh warp として整理します。current image-normalized landmarks を source vertices、CorrectionPlan `target` を target vertices、source video frame / source canvas を texture として扱い、MediaPipe face mesh topology の triangle mesh warp を検討します。

詳細な段階分け、座標系方針、未決定事項は [Shape Warp production direction](shape-warp-production-direction.md) を参照してください。最初の WebGL mesh warp prototype は Studio processed preview 限定とし、Engine Runtime への本格統合、temporal smoothing、mask / boundary、glasses / hair、performance 対応は後段で扱います。
