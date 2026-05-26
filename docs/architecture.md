# アーキテクチャ

## 基本構成

BAE AR は、Engine Runtime、Beauty Studio、IdealFace Authoring Tool、Layer Mask Authoring Tool の 4 領域に分けます。

```text
BAE AR

├─ packages/engine
│  └─ Engine Runtime
│     - 本番でリアルタイム加工する中核 SDK
│     - UI を持たない
│     - 実行専用
│
├─ apps/studio
│  └─ Beauty Studio
│     - Engine を開発・検証・調整する開発ツール
│     - Engine の公開 API のみを使う
│     - Engine 内部実装へ直接依存しない
│
├─ tools/ideal-face-authoring
│  └─ IdealFace を作成する authoring tool
│
└─ tools/layer-mask-authoring
   └─ 将来予定。LayerMaskSpec を作成する authoring tool
```

現在 `tools/ideal-face-authoring` は Step 2-I-A/B/C と Step 2-H まで実装済みです。`tools/layer-mask-authoring` は将来予定です。

## Engine Runtime の責務

Engine Runtime は UI を持たない中核 SDK です。

現在実装済み:

- `BeautyEngine` の状態管理
- 入力の保持
- `FaceDetector` インターフェース
- `MediaPipeFaceDetector`
- FaceFrame loop
- `FaceFrame` の保持と購読
- `FaceGeometry` の補助解析
- debug 情報の公開
- IdealFace v1 の読み込み
- IdealFace 公開 API
- idealLandmarks3D 478点 Projection
- current-vs-projected ideal 478点 difference debug
- ideal_face_asset_v1 の型 / validator / parse helper / converter
- correctionProfile v1 の読み込み / validation / fallback
- expressionAttenuation v1 foundation / fallback rules
- landmarkGroups v1 asset schema implementation
- Engine landmarkGroups asset loading foundation
- Engine fallback group / asset group source handling
- Studio debug / Copy Debug landmarkGroups summary
- CorrectionPlan v1 debug foundation

将来予定:

- expressionFollow v1 Engine implementation
- MP4 expression 3D analysis 由来の landmarkFollowStrengths 読み込み
- expressionAttenuation falloff v1 fallback / reference handling
- shapeWarpSettings v1
- colorLayers v1
- beauty_filter_asset_v1 foundation / validator / parser / converter
- Production Shape Warp
- Production WebGL mesh warp / Runtime renderer integration
- Color Processing
- Layer System
- LayerMaskSpec の読み込み
- renderer production lifecycle / disposal / fallback
- runtime quality control

Engine Runtime は定義済みの IdealFace / LayerMaskSpec を読み込んで使います。IdealFace の作成、2D 動画からの 3D 顔生成、LayerMaskSpec の作成、mask の手作業編集、Studio / Authoring 用 UI は Runtime に含めません。

## Beauty Studio の責務

Beauty Studio は Engine Runtime を開発・検証・調整するための開発ツールです。

現在実装済み:

- `CameraService` によるカメラ映像取得
- `HTMLVideoElement` を `BeautyEngine.setInput()` へ渡す接続
- `MediaPipeFaceDetector` の初期化と Engine への設定
- Engine 状態、カメラ状態、検出状態、FaceFrame、FaceGeometry、MediaPipe debug の表示
- landmarks / geometry point / projected ideal 478 landmarks / difference line overlay
- Copy Debug 用の debug text 生成

Studio は Engine Runtime の公開 API のみを利用します。Engine の private field や内部実装ファイルへ直接依存しません。

## IdealFace Authoring Tool の責務

IdealFace Authoring Tool は、BAE AR 独自の IdealFace asset を作成するための独立ツールです。

責務:

- BAE AR 独自の IdealFace asset の作成
- IdealFace canonical face / お面データの作成
- IdealFace プリセットの調整
- 手作業による調整
- 2D 動画 / 複数画像からのオフライン生成
- Runtime で読み込む IdealFace asset の出力

IdealFace Authoring Tool は、MediaPipe canonical face model そのものを作るツールではありません。`natural_v1` の controlPoints は現段階の投影検証用データであり、IdealFace 本体ではありません。

IdealFace Authoring Tool の処理はリアルタイム Engine Runtime には含めません。

### idealLandmarks3D 478点の作成方針

IdealFace の本体である `idealLandmarks3D` 478点は、IdealFace Authoring Tool 側で作成します。現在の active workflow は Step 2-I-A/B/C と Step 2-H です。

Current active workflow:

```text
MP4 input
  -> detailed scan
  -> Step 2-I-A frame selection
       正面基準候補 / 推定に使うフレーム / 除外フレーム
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

Engine Runtime は動画入力、詳細スキャン、pose-aware dataset 作成、candidate generation、手動調整 UI、保存 / export を持ちません。Runtime は完成済み IdealFace asset を読み込み、`idealLandmarks3D` 478点を現在 `FacePose` へ投影して使います。

Authoring Tool は `idealLandmarks3D` を same-unit coordinate として生成します。`video_aspect_same_unit_v1` による video aspect 補正、pose-aware generation、将来の manual adjustment UI は Authoring Tool の責務です。Runtime は完成済み IdealFace asset を読み込み、same-unit の `idealLandmarks3D` を `FacePose` へ投影し、overlay / difference / warp 用に image-normalized / pixel 座標へ変換します。Authoring generation logic は Runtime に含めません。

legacy / debug と分類した UI や helper には、今後の新機能を追加しません。confidence debug、手動微調整 UI、保存 / export は Step 2-I active workflow 側に追加します。

## Layer Mask Authoring Tool の責務

Layer Mask Authoring Tool は将来予定です。

責務:

- 色加工用 LayerMaskSpec の作成
- どの landmarks で囲うかの定義
- 除外領域の定義
- 膨張・収縮の定義
- feather / blur の定義
- Runtime で読み込む LayerMaskSpec の出力

Layer Mask Authoring Tool の編集 UI や手作業編集処理は Engine Runtime には含めません。

## 現在の呼び出し経路

```text
apps/studio/src/main.ts
  -> new BeautyEngine()
  -> new CameraService()
  -> new MediaPipeFaceDetector()
  -> engine.setFaceDetector(detector)
  -> detector.initialize()
  -> engine.initialize()
  -> engine.start()
  -> camera.start()
  -> engine.setInput(camera.getVideo())
  -> engine.onFaceFrame(...)
  -> engine.getFaceFrame()
  -> engine.getFaceGeometry()
  -> engine.getIdealFace()
  -> engine.getIdealFaceProjection()
  -> engine.getIdealFaceProjectionDifference()
  -> engine.getAvailableIdealFaces()
  -> engine.getFaceFrameLoopDebugInfo()
  -> engine.getFaceDetectorDebugInfo()
```

Engine 側では、`BeautyEngine.startFaceFrameLoopIfReady()` が `running` 状態、`HTMLVideoElement` 入力、`FaceDetector` の存在を確認してから 1 秒間隔の検出 loop を開始します。

## データモデル

`FaceFrame` は MediaPipe 由来の現在フレームの生データを表します。

```text
FaceFrame
  detected: boolean
  timestamp: number
  landmarks: FaceLandmark[]
  blendshapes?: FaceBlendshape[]
  pose: FacePose
```

現在、`pose` は MediaPipe Face Landmarker の `facialTransformationMatrixes` から推定します。matrix が取得できない場合は landmarks から yaw / pitch / roll を最小推定します。これは IdealFace Projection の入力に使うための v1 実装であり、高精度な head tracking ではありません。

`FaceGeometry` は landmarks から導出する補助情報です。

```text
FaceGeometry
  leftEyeCenter
  rightEyeCenter
  mouthCenter
  noseTip
  chin
  faceCenter
  faceWidth
  faceHeight
  eyeDistance
```

`FaceGeometry` は debug、overlay、顔サイズ確認、代表点確認、将来の安定化・正規化補助に使います。shape processing の中心として扱いません。

## IdealFace と Projection

IdealFace v1 は実装済みです。Runtime は `natural_v1` / `Natural` の最小プリセットを読み込み、公開 API から選択中の IdealFace と利用可能な IdealFace を取得できます。

IdealFace は独自の理想 3D 顔モデルを本体とします。MediaPipe 478 landmarks そのものではありません。また、MediaPipe canonical face model そのものでもありません。

MediaPipe canonical face model は、MediaPipe 側が landmark 検出や face geometry のために使う標準顔モデル、つまり MediaPipe 内部の標準顔お面です。BAE AR はその topology、landmark index、canonical model の考え方を参考にする可能性がありますが、最終的な理想顔定義は BAE AR 独自の IdealFace asset として管理します。

MediaPipe は検出側の基準です。BAE AR IdealFace は、「こう寄せたい」という理想顔を表す補正・比較側の基準です。MediaPipe 標準顔 = BAE AR 理想顔、とはしません。

Engine Runtime で current face と比較するため、IdealFace は `idealLandmarks3D` 478点を本体として持ち、現在の `FacePose` へ投影して projected ideal 478 landmarks を生成します。

現在の制限事項:

- IdealFace Authoring Tool は Step 2-I-C / Step 2-H まで実装済み
- `idealLandmarks3D` 478点 Projection と current-vs-projected ideal difference debug は実装済み
- `correctionProfile` v1 foundation、validation / fallback、`expressionAttenuation` v1 foundation、CorrectionPlan v1 debug foundation は実装済み
- Shape Warp v1 debug prototype と Studio processed preview 限定 WebGL mesh warp v1 prototype は実装済み
- Production Shape Warp / Runtime renderer integration は未実装

IdealFace Projection v1 の責務:

- FacePose を受け取る
- IdealFace の `idealLandmarks3D` 478点を現在姿勢へ回転する
- same-unit 空間で face center + uniform scale alignment を行う
- Studio overlay / current-vs-ideal difference / Shape Warp 入力用に `imageLandmarks` を生成する

current-vs-projected ideal 478点 difference debug v1 は、MediaPipe current image-normalized landmarks と projected ideal `imageLandmarks` の `deltaX` / `deltaY` / `distance` を計算します。平均差分、最大差分 index、top differences、overlay 上の difference line は debug 用であり、CorrectionPlan ではありません。

現在は Perspective camera、face surface、production mesh renderer、Production Shape Warp / Runtime renderer integration は未実装です。CorrectionPlan v1 debug foundation、Studio 向け Shape Warp v1 debug prototype、Studio processed preview 限定 WebGL mesh warp v1 prototype は実装済みですが、本番 renderer ではありません。将来の完全版でも、Projection 後の ideal 2D landmarks はすでに現在姿勢を反映します。

## correctionProfile v1

`correctionProfile` v1 は、`ideal_face_asset_v1` の optional top-level field として Engine foundation 実装済みです。`idealLandmarks3D` は理想顔の形状データ、`correctionProfile` は各 landmark をどれくらい projected ideal へ寄せるかの補正設定として分けます。Authoring Tool 編集 UI、asset export 連携、`beauty_filter_asset_v1` foundation は未実装です。

`correctionProfile` は per-landmark `strength`、`defaultStrength`、`maxCorrectionDistance` を持ちます。dx / dy は現在顔の姿勢、位置、表情、projection 結果によって毎フレーム変わるため JSON には保存せず、Engine Runtime が current landmarks と projected ideal `imageLandmarks` から計算します。

Engine 側では、`expressionAttenuation` を optional field として扱う v1 foundation も実装済みです。これは MediaPipe blendshape score から `mouth` / `left_eye` / `right_eye` / `face_boundary` などの group ごとの `strengthScale` を計算し、CorrectionPlan の `baseStrength` に掛けて `finalStrength` を決める既存の safety attenuation です。

今後の中心仕様では、表情時に単純に group の補正強度を下げるのではなく、表情ごとに landmark が neutral な projected ideal へどれだけ追従するかを定義する `expressionFollow v1` を優先します。`idealFollowStrength` は `0.0 = current / camera を優先`、`1.0 = projected ideal を優先` です。`landmarkFollowStrengths` は MP4 の neutral 3D 478 / expression 3D 478 を同じ `comparisonSpace` で比較し、3D 差分から自動生成する方針です。frame group 分類と自動生成の詳細は [MP4 expression 3D analysis plan](mp4-expression-3d-analysis-plan.md) に整理します。

詳細仕様、fallback、validation 方針、Runtime / Authoring / Studio の責務分離は [correctionProfile v1](correction-profile-v1.md) に定義します。新方針は [expressionFollow v1](expression-follow-v1.md) に、MP4 からの自動生成方針は [MP4 expression 3D analysis plan](mp4-expression-3d-analysis-plan.md) に、既存 foundation との関係は [expression-aware correctionProfile](expression-aware-correction-profile.md) に、旧方針の fallback / 参考案は [expressionAttenuation falloff v1](expression-attenuation-falloff-v1.md) に整理します。Authoring Tool 編集 UI、asset export 連携、expressionFollow v1 実装、MP4 expression 3D analysis、Production Shape Warp は未実装です。

### IdealFace Projection の座標系方針

Projection / Shape Processing では座標系を以下の 3 種類に分けます。

```text
same-unit coordinate
  - IdealFace asset / idealLandmarks3D の基準座標
  - x/y が同じ距離単位になるように Authoring Tool で正規化する
  - 3D projection / FacePose rotation / uniform alignment の内部計算で使う
  - そのまま canvasWidth / canvasHeight を掛けて描画してはいけない

image-normalized coordinate
  - MediaPipe current landmarks と同じ座標系
  - x は画像幅基準、y は画像高さ基準
  - Studio overlay、current-vs-ideal difference、CorrectionPlan 入力で使う
  - projected ideal landmarks は、Shape Warp 前にこの座標系へ変換する

pixel coordinate
  - 実際の canvas / video frame 上の pixel 座標
  - 最終的な描画や画像変形で使う
```

Projection 内部は same-unit coordinate を使います。Studio overlay / current-vs-ideal difference は image-normalized coordinate を使い、Image warp は pixel coordinate を使います。same-unit の projected ideal landmarks を、そのまま `x * canvasWidth` / `y * canvasHeight` で描画しません。

IdealFace の本体である `idealLandmarks3D` は same-unit coordinate として扱います。Runtime Projection は `idealLandmarks3D` を `FacePose` に合わせて回転し、same-unit 空間上で face center / uniform scale alignment します。Runtime Projection alignment では x/y 別 scale を行わず、IdealFace の縦横比を現在顔に合わせて歪めません。縦横比や形状そのものの調整は、将来の IdealFace Authoring Tool manual adjustment UI で扱います。

Projection result は、Projection / alignment / debug 用の same-unit projected landmarks と、Studio overlay / current landmarks 比較 / Shape Warp 入力用の image-normalized projected landmarks を分けて持ちます。`sameUnitLandmarks` は same-unit coordinate、`imageLandmarks` は MediaPipe current landmarks と同じ image-normalized coordinate です。既存互換用の `landmarks` が残る場合も、Studio overlay では `imageLandmarks` を使います。

```ts
type IdealLandmarks3DProjectionResult = {
  status: "not_available" | "missing_face_pose" | "projected"

  sameUnitLandmarks: ProjectedIdealLandmarkSameUnit[]
  imageLandmarks: ProjectedIdealLandmarkImageNormalized[]

  landmarkCount: number
  alignment: unknown
  summary: unknown
}
```

Studio overlay は `imageLandmarks` を `x * canvasWidth` / `y * canvasHeight` で描画します。same-unit landmarks をそのまま canvas pixel に変換しません。current 478 landmarks との差分比較 debug、CorrectionPlan v1 debug foundation、Studio 向け Shape Warp v1 debug prototype、Studio processed preview 限定の WebGL mesh warp v1 prototype は実装済みです。Production Shape Warp / Runtime renderer integration は後段です。

## CorrectionPlan

CorrectionPlan は姿勢補正を担当しません。姿勢への対応は IdealFace Projection の責務です。

CorrectionPlan の責務:

- current image-normalized landmarks と projected ideal image-normalized landmarks の差分を受け取る
- `correctionProfile` の baseStrength を決める
- expressionFollow がある場合は idealFollowStrength を掛ける
- 既存 expression-aware attenuation がある場合は group strengthScale を掛ける
- `maxCorrectionDistance` で correction vector を clamp する
- 実際に warp へ渡す安全な補正量を決める
- 補正強度、移動量上限、滑らかさ、過補正防止、信頼度などを扱う

CorrectionPlan は same-unit projection 後、image-normalized に変換された current-vs-ideal 差分を受け取ります。CorrectionPlan は `FacePose` の推定や IdealFace projection を担当しません。

CorrectionPlan は個別パーツ加工命令セットにはしません。`expressionFollow` は、目だけ大きくする、鼻だけ細くする、顎だけ削るための機能ではなく、表情として自然に neutral ideal から外れてよい landmark の追従率を定義する safety control です。`expressionAttenuation` は既存 foundation として残りますが、今後の中心仕様ではありません。

## Shape Processing

```text
現在顔から MediaPipe 478 landmarks を取得
  -> FacePose を推定
  -> IdealFace 3D model を same-unit coordinate で現在姿勢へ投影
  -> projected ideal 478 landmarks を image-normalized coordinate へ変換
  -> current image-normalized landmarks と projected ideal image-normalized landmarks の差分を取る
  -> CorrectionPlan を生成
  -> 顔全体として自然に少し warp
```

current 478 landmarks は MediaPipe 由来の image-normalized 座標です。projected ideal 478 landmarks は、IdealFace same-unit landmarks を `FacePose` へ投影し、alignment 後に image-normalized 座標へ変換したものです。差分は `deltaX = projectedIdealImageX - currentX`、`deltaY = projectedIdealImageY - currentY` として計算し、この差分を `CorrectionPlan` に渡します。

顎だけ、目だけ、鼻だけなどの個別パーツ加工を独立機能として増やす方向にはしません。

## Layer System / LayerMask

Layer System は shape warp ではなく color processing 用に使います。

対象:

- skin smoothing
- whitening
- brightness
- tone
- blood color
- shadow / highlight
- cheek / lip / eye area などの色補正

Layer は色加工範囲、効果、強度、合成順を整理する仕組みです。変形加工には使いません。

LayerMask は FaceLandmarks から生成する 2D mask です。

基本仕様:

- どの landmarks で囲われた範囲かを定義する
- landmarks を polygon 化する
- polygon から mask を生成する
- 必要に応じて除外領域を持つ
- 必要に応じて膨張・収縮する
- 境界は feather / blur して自然にする
- mask 値は 0.0〜1.0 の強度マップとする

例:

- `skin_layer`: 顔輪郭の内側から目・眉・唇などを除外した肌領域
- `lip_layer`: 唇 landmarks で囲った範囲
- `cheek_layer`: 頬周辺の landmarks を基準にした soft mask
- `eye_area_layer`: 目周辺 landmarks を少し広げた範囲

`jaw_layer` で顎を削る、`eye_layer` で目を大きくする、`nose_layer` で鼻を細くする、のような使い方はしません。

## beauty_filter_asset_v1

最終的なフィルター / プリセットは、1つの `beauty_filter_asset_v1` JSON として配布する方針です。

```text
beauty_filter_asset_v1
  ├─ idealFace
  ├─ landmarkGroups
  ├─ correctionProfile
  ├─ shapeWarpSettings
  └─ colorLayers
```

1つの JSON に束ねる理由は、`idealFace` と `landmarkGroups` の対応、`correctionProfile.expressionFollow.affectedLandmarkGroups` / `correctionProfile.expressionAttenuation.affectedLandmarkGroups` の参照、`colorLayers` が参照する `skin` / `lip` / `cheek` などの group の整合性を保つためです。サービス側では 1つの filter asset を選択するだけでよくなり、Engine Runtime は 1つの asset から shape / color の両方を実行できます。

ただし、内部では責務を混ぜません。`idealFace` は理想顔の形状、`landmarkGroups` は landmark index の意味領域、`correctionProfile` は shape correction の強度と `expressionFollow` による表情時の追従制御、`shapeWarpSettings` は warp renderer / smoothing / boundary の設定、`colorLayers` は色加工、mask、合成順、opacity を扱います。`landmarkGroups v1` の仕様は [landmarkGroups v1](landmark-groups-v1.md) に整理します。

Engine Runtime は UI を持たず、将来 `beauty_filter_asset_v1` を読み込んで Projection、current-vs-ideal difference、`expressionFollow`、既存 `expressionAttenuation` fallback、`CorrectionPlan`、WebGL mesh warp、LayerMask 生成、`colorLayers` 合成、temporal smoothing / stability control を実行します。Beauty Studio は公開 API 経由で読み込み・状態確認・debug / overlay / Copy Debug / tuning UI を提供します。Authoring Tool 群は各セクションの作成・編集を担当します。

詳細は [beauty_filter_asset_v1 direction](beauty-filter-asset-v1.md) に整理します。`landmarkGroups v1` は docs specification、Engine foundation、asset / fallback group source handling、Studio debug / Copy Debug summary、Authoring Tool Landmark Group Editor v1 prototype、`ideal_face_asset_v1` optional export まで実装済みです。`expressionFollow v1` と [MP4 expression 3D analysis plan](mp4-expression-3d-analysis-plan.md) は docs direction のみで未実装です。`expressionAttenuation falloff v1` は fallback / 参考案です。`beauty_filter_asset_v1`、`shapeWarpSettings`、`colorLayers`、Production Shape Warp、Color Processing、Runtime renderer integration はまだ未実装です。

## 配布方針

本番配布対象は Engine Runtime のみです。

配布物に含めないもの:

- Beauty Studio
- IdealFace Authoring Tool
- Layer Mask Authoring Tool
- docs
- 開発用 debug UI
- サンプルや検証ツール

## IdealFace Authoring Tool detailed scan

詳細スキャンは Step 2-I-A の frame selection に渡す observation source です。表示用の粗いフレーム抽出は debug / metadata 確認用に限定し、active authoring の中心には置きません。

Current active workflow:

```text
MP4 input
  -> detailed scan
  -> Step 2-I-A frame selection
       正面基準候補 / 推定に使うフレーム / 除外フレーム
  -> Step 2-I-B pose-aware inference dataset
  -> Step 2-I-C pose_aware_weighted_z_v1 candidate generation
       roll 補正
       yaw / pitch / weight による z hint
       idealLandmarks3D 478点候補生成
  -> Step 2-H currentCandidate point cloud preview
```

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

Step 2-A / 2-B の動画入力、metadata 確認、MediaPipe 解析は残します。ただし、その後続は旧 Step 2-C〜2-G ではなく、detailed scan から Step 2-I-A/B/C の pose-aware workflow へ進みます。

legacy / debug と分類した UI や helper には、今後の新機能を追加しません。confidence debug、手動微調整 UI、保存 / export は Step 2-I active workflow 側に追加します。

## IdealFace Authoring Tool Step 2-H

Step 2-H では、`tools/ideal-face-authoring` に 3D 478点候補の interactive 3D point cloud preview を追加しました。

Step 2-H の実装範囲:

- `idealLandmarks3DCandidate` が generated の場合に、478点候補を 1 つの canvas に小さな点として表示する
- preview camera state として yaw / pitch / zoom / panX / panY を持つ
- ドラッグで視点回転、ホイールで zoom、Shift + ドラッグで pan、ダブルクリックまたは reset button で初期視点へ戻す
- 正面 / 横 / 上は固定ビューではなく、同じ viewport の camera preset として扱う
- 点群が preview 範囲内に収まるよう center / scale を調整する
- preview 表示上は y を反転し、z 表示倍率調整は view transform 専用として扱う
- confidence が低い点を薄く表示する
- landmark count、視点、x / y / z の min / max、average / min / max confidence を表示する
- 3D候補が未生成の場合は、先に 3D候補生成を実行する案内を表示する

Step 2-H の制限:

- preview は debug / 確認用であり、本格 3D editor ではない
- preview camera 操作、y 軸反転、z 表示倍率調整は preview 表示専用であり、`idealLandmarks3D` 候補データ自体は変更しない
- 手動微調整、保存 / export、複数画像入力はまだ実装しない
- JSON preview には 478点全文や canvas data URL を出さず、`idealLandmarks3DCandidate` の概要と先頭 5 点程度の preview に留める

3D点群 preview は IdealFace Authoring Tool の責務です。Engine Runtime に 3D点群 preview や Authoring UI を追加しません。Beauty Studio にも Authoring 用タブは追加しません。

## IdealFace / Projection / Shape Processing 中核仕様

IdealFace は、BAE AR 独自の理想 3D 顔プリセットとして、3D の `idealLandmarks3D` 478 点を本体とする asset です。これは正面固定の 2D landmarks ではなく、現在顔の姿勢へ投影できる 3D landmarks です。

Runtime の Projection は、IdealFace の 3D landmarks を現在顔の `FacePose` に合わせて投影し、2D の projected ideal 478 landmarks を生成します。正面 2D landmarks だけを基準にすると、顔の角度変化へ追随できないため、yaw / pitch / roll への対応は Projection で行います。

Shape Processing の入力は、カメラ映像から MediaPipe Face Landmarker が取得した current 478 landmarks と、Projection 後の projected ideal 478 landmarks です。Shape Processing はこの 2 つの差分を見て、後段の `CorrectionPlan` / Shape Warp へ進みます。

現在の `natural_v1` の 6 点 controlPoints は、現段階の投影検証用データです。Projection の流れを検証するための暫定データであり、IdealFace 本体ではありません。

```text
current 478 landmarks
projected ideal 478 landmarks
  -> difference
  -> CorrectionPlan
  -> Shape Warp
```

`CorrectionPlan` は姿勢補正を担当しません。Projection 後の ideal 2D landmarks は、すでに現在姿勢を反映している前提で補正量の決定へ渡されます。


## IdealFace Authoring Tool Current Generation Path

Step 2-G v1 five-pose candidate generation has been removed from the current code. The active 3D candidate generation path is Step 2-I-C `pose_aware_weighted_z_v1`, and the JSON preview remains centered on `activeSummary`, `poseAware`, `currentCandidate`, `reference`, and `debug`. Runtime and Beauty Studio do not include authoring generation logic.

## Shape Warp production direction

Shape Warp v1 debug prototype は、CorrectionPlan の補正ベクトルを Studio processed preview に仮反映する検証用です。CPU radial warp debug と Studio processed preview 限定 WebGL mesh warp v1 prototype があり、どちらも補正ベクトルと画像変形の接続を観察するための prototype であり、本番品質の Runtime renderer ではありません。

本番候補は WebGL mesh warp とします。MediaPipe face mesh topology の triangle mesh を使い、current image-normalized landmarks を source vertices、CorrectionPlan `target` を target vertices、source video frame / source canvas を texture として扱う方向で検討します。

```text
source vertices:
  current image-normalized landmarks

target vertices:
  CorrectionPlan target
  current + correctionDelta

texture:
  source video frame / source canvas

triangles:
  MediaPipe face mesh topology
```

same-unit coordinate は IdealFace Projection 内部の rotation / uniform alignment 用です。WebGL mesh warp に same-unit landmarks を直接渡しません。WebGL へ渡す前に、image-normalized の source / target vertices を canvas / texture / viewport に合わせて pixel coordinate または clip coordinate へ変換します。

詳細は [Shape Warp production direction](shape-warp-production-direction.md) に整理します。Studio WebGL mesh warp v1 prototype は processed preview 限定で実装済みです。Runtime renderer integration、temporal smoothing、mask / boundary、glasses / hair、performance 対応は後段で扱います。
