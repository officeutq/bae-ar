# BAE AR Beauty Engine 仕様書 / ロードマップ 2026-05

## 1. プロジェクト目的

BAE AR は、本番サービスに組み込めるリアルタイム Beauty Engine Runtime を開発するプロジェクトです。

目標は、顔を単純な 2D フィルターとして加工することではありません。現在の顔の landmarks、姿勢、表情を読み取り、理想顔との差分を自然に補正する Engine を育てます。

重要方針:

- Engine Runtime は UI を持たない。
- Beauty Studio は Engine を育てるための開発ツールである。
- Studio は Engine の公開 API のみを使う。
- Studio から Engine 内部状態へ直接アクセスしない。
- IdealFace Authoring Tool と Layer Mask Authoring Tool は Runtime から分離する。
- Shape processing は個別パーツ加工を増やす方向にしない。
- Color processing と shape processing を混同しない。
- Layer System は color processing 用であり、shape warp には使わない。
- `FaceGeometry` は補助情報であり、shape processing の中心ではない。

## 2. 全体構成

BAE AR は 4 領域に分けます。

### 2.1 Engine Runtime

本番でリアルタイム加工する中核 SDK です。

- UI を持たない
- 実行専用
- 定義済みの IdealFace / LayerMaskSpec を読み込んで使う
- 本番配布対象

### 2.2 Beauty Studio

Engine を開発・検証・調整する開発ツールです。

- Engine の公開 API のみを使う
- Engine 内部実装へ直接依存しない
- 開発確認用として overlay や簡易調整 UI を持ってよい
- 本番配布対象には含めない

### 2.3 IdealFace Authoring Tool

BAE AR 独自の IdealFace asset を作成・調整する将来ツールです。

- 手作業、調整ツール、2D 動画 / 複数画像からのオフライン生成を想定
- MediaPipe canonical face model そのものを作るツールではない
- 現在の `natural_v1` の controlPoints は、投影検証用の暫定データとして扱う想定
- リアルタイム Engine Runtime には含めない

### 2.4 Layer Mask Authoring Tool

色加工用 LayerMaskSpec を作成する将来ツールです。

- どの landmarks で囲うかを定義する
- 除外領域を定義する
- 膨張・収縮、ぼかしなどを定義する
- リアルタイム Engine Runtime には含めない

## 3. 現在の実装状況

### 3.1 実装済み

Engine Runtime:

- `BeautyEngine` class
- `BeautyEngineState`
- `BeautyEngineInput`
- `BeautyEngineOptions`
- `FaceDetector` interface
- `MediaPipeFaceDetector`
- `FaceFrame`
- `FaceLandmark`
- `FaceBlendshape`
- `FacePose` type
- `FaceDetectionResult`
- `FaceGeometry`
- `analyzeFaceGeometry()`
- FaceFrame loop debug 情報
- FaceDetector debug 情報の取得口

Beauty Studio:

- `CameraService`
- カメラ映像の `HTMLVideoElement` 化
- `BeautyEngine.setInput()` への接続
- `MediaPipeFaceDetector` の初期化と接続
- Engine / Camera / Detection / FPS / Loop / Detect の debug 表示
- FaceFrame debug
- FaceGeometry debug
- MediaPipe debug
- Loop / Timing debug
- landmarks overlay
- FaceGeometry point overlay
- Copy Debug
- FacePose の実推定
- IdealFace v1 型定義
- Natural v1 最小プリセット
- IdealFace 公開 API
- idealLandmarks3D 478点 Projection
- projected ideal `imageLandmarks` overlay
- current-vs-projected ideal 478点 difference debug v1
- top differences difference line overlay
- correctionProfile v1 の Engine 型 / validation / fallback foundation
- expressionAttenuation v1 foundation: jawOpen / eyeBlink / eyeSquint による group strengthScale、halfLifeMs smoothing、CorrectionVector の baseStrength / expressionStrengthScale / finalStrength
- CorrectionPlan v1 debug foundation
- 478点分の correction vectors 計算
- CorrectionPlan vector overlay
- Studio 向け Shape Warp v1 debug prototype
- CPU radial warp debug
- Shape Warp debug safety tuning
- Shape Warp debug preset 比較機能
- Shape Warp 使用ベクトル overlay
- Shape Warp production direction docs
- WebGL mesh warp 本番候補方針の整理
- Studio processed preview 限定 WebGL mesh warp v1 prototype
- beauty_filter_asset_v1 direction docs
- landmarkGroups v1 docs specification

### 3.2 未実装

- landmarkGroups v1 asset schema implementation
- Engine landmarkGroups asset loading foundation
- Authoring Tool landmark group editor
- shapeWarpSettings v1
- colorLayers v1
- beauty_filter_asset_v1
- Production Shape Warp
- Production WebGL mesh warp / Runtime renderer integration
- Production MediaPipe topology triangle mesh warp
- temporal smoothing
- mask / boundary handling
- glasses / hair handling
- performance / mobile optimization
- correctionProfile Authoring UI
- Color Processing
- Layer System
- LayerMaskSpec
- runtime quality control
- preset API
- IdealFace Authoring Tool の手動微調整、保存 / export
- Layer Mask Authoring Tool
- Butterflyve integration
- 本番向け package build / test / lint script

### 3.3 現在の制限

- FaceFrame loop は 1 秒間隔の `setInterval` です。
- `MediaPipeFaceDetector` は 1 face のみを対象にしています。
- `FacePose` は MediaPipe Face Landmarker の transformation matrix を優先して推定します。matrix が取得できない場合は landmarks から最小推定します。
- `IdealFace` は Runtime で読み込める最小構造と Natural v1 プリセットを持ちます。
- `IdealFace` は MediaPipe 478 landmarks そのものではありません。
- `IdealFace` は MediaPipe canonical face model そのものでもありません。
- IdealFace Projection v1 は `idealLandmarks3D` 478点を現在 `FacePose` へ投影します。
- current-vs-projected ideal 478点 difference debug v1 は current landmarks と projected ideal `imageLandmarks` の差分確認用です。
- `FaceGeometry` は landmarks から代表点やサイズを計算する補助解析です。
- Studio processed preview 限定の Shape Warp v1 debug prototype と WebGL mesh warp v1 prototype は実装済みです。Production Shape Warp / Production renderer / Runtime renderer integration、Color Processing はまだありません。
- IdealFace Authoring Tool は Step 2-I-A/B/C と Step 2-H まで実装済みです。

## 4. 現在の処理パイプライン

現在実装済みの流れ:

```text
Camera input
  -> HTMLVideoElement
  -> BeautyEngine.setInput()
  -> MediaPipeFaceDetector
  -> FaceFrame loop
  -> FaceFrame 更新
  -> Studio debug / overlay
```

実コード上の主な経路:

```text
apps/studio/src/main.ts
  -> CameraService.start()
  -> CameraService.getVideo()
  -> BeautyEngine.setInput(video)
  -> MediaPipeFaceDetector.initialize()
  -> BeautyEngine.setFaceDetector(detector)
  -> BeautyEngine.start()
  -> FaceDetector.detect(input)
  -> BeautyEngine.currentFaceFrame 更新
  -> analyzeFaceGeometry(frame)
  -> BeautyEngine.currentFaceGeometry 更新
  -> BeautyEngine.onFaceFrame(...) listener 通知
```

`BeautyEngine` は `running` 状態、`HTMLVideoElement` 入力、`FaceDetector` 設定済み、video ready、video size 有効を確認してから検出します。

## 5. Public API 一覧

### 5.1 `BeautyEngine`

```ts
new BeautyEngine(options?: BeautyEngineOptions)

initialize(): Promise<void>
start(): Promise<void>
stop(): Promise<void>
dispose(): void

getState(): BeautyEngineState

setInput(input: BeautyEngineInput): void
getInput(): BeautyEngineInput | undefined

setFaceDetector(detector: FaceDetector): void
getFaceDetector(): FaceDetector | undefined
getFaceDetectorDebugInfo(): unknown | null

setIdealFace(idealFace: IdealFace): void
getIdealFace(): IdealFace
getAvailableIdealFaces(): IdealFacePreset[]
selectIdealFace(id: string): IdealFace | undefined
getIdealFaceProjection(): IdealFaceProjectionResult
projectIdealFace(): IdealFaceProjectionResult
getIdealFaceProjectionDifference(): ProjectionDifference

getFaceFrame(): FaceFrame | undefined
getFaceGeometry(): FaceGeometry | undefined
onFaceFrame(callback: (frame: FaceFrame) => void): void

getFaceFrameLoopDebugInfo(): FaceFrameLoopDebugInfo
```

### 5.2 `FaceDetector`

```ts
interface FaceDetector {
  initialize(): Promise<void>
  detect(input: HTMLVideoElement): Promise<FaceDetectionResult>
  dispose(): Promise<void>
  getDebugInfo?(): unknown
}
```

### 5.3 Export 済み module

`packages/engine/src/index.ts` から以下を export しています。

```text
BeautyEngine
types
FaceDetector
FaceGeometry
FaceFrame
MediaPipeFaceDetector
face/types
```

## 6. データモデル

### 6.1 FaceFrame

`FaceFrame` は MediaPipe 由来の現在フレームの生データです。

```ts
interface FaceFrame {
  detected: boolean
  timestamp: number
  landmarks: FaceLandmark[]
  blendshapes?: FaceBlendshape[]
  pose: FacePose
}
```

含まれる情報:

- detect state
- timestamp
- landmarks
- blendshapes
- pose

現在、pose は placeholder ではなく、検出顔の yaw / pitch / roll 推定値です。MediaPipe Face Landmarker の `facialTransformationMatrixes` を優先し、取得できない場合は eyes / nose / mouth landmarks から最小推定します。v1 は IdealFace Projection の入力用であり、高精度な head tracking は今後の改善対象です。

### 6.2 FaceGeometry

`FaceGeometry` は landmarks から導出する補助情報です。

```ts
type FaceGeometry = {
  leftEyeCenter: FaceGeometryPoint | null
  rightEyeCenter: FaceGeometryPoint | null
  mouthCenter: FaceGeometryPoint | null
  noseTip: FaceGeometryPoint | null
  chin: FaceGeometryPoint | null
  faceCenter: FaceGeometryPoint | null
  faceWidth: number | null
  faceHeight: number | null
  eyeDistance: number | null
}
```

用途:

- debug
- overlay
- 顔サイズ確認
- 代表点確認
- 将来の安定化・正規化補助

重要: `FaceGeometry` は shape processing の中心ではありません。shape processing の中心は current 478 landmarks と IdealFace 由来の ideal 478 landmarks です。

### 6.3 beauty_filter_asset_v1

最終的なフィルター / プリセットは、1つの `beauty_filter_asset_v1` JSON として配布する方針です。

```text
beauty_filter_asset_v1
  ├─ idealFace
  ├─ landmarkGroups
  ├─ correctionProfile
  ├─ shapeWarpSettings
  └─ colorLayers
```

1つの JSON に束ねる理由:

- IdealFace と landmarkGroups の対応を保つため
- correctionProfile が参照する `affectedLandmarkGroups` の整合性を保つため
- colorLayers が参照する `skin` / `lip` / `cheek` などの group の整合性を保つため
- サービス側では 1つの filter asset を選択するだけでよくなるため
- Engine は 1つの asset を読み込んで shape / color の両方を実行できるため

ただし内部は責務ごとに分離します。`idealFace` は理想顔の形状、`landmarkGroups` は landmark index の意味領域、`correctionProfile` は shape correction の強度と safety attenuation、`shapeWarpSettings` は warp renderer / smoothing / boundary の設定、`colorLayers` は色加工、mask、合成順、opacity を扱います。

`landmarkGroups` v1 では、まず `mouth` / `left_eye` / `right_eye` / `face_boundary` を expression safety 用 group として想定します。将来 color processing 向けに `skin` / `lip` / `cheek` / `eye_area` などを追加する可能性があります。Layer System は shape warp 用ではなく、color processing 用です。詳細は [landmarkGroups v1](landmark-groups-v1.md) に整理します。

詳細は [beauty_filter_asset_v1 direction](beauty-filter-asset-v1.md) に整理します。`landmarkGroups v1` は docs 仕様化のみで、Engine asset loading、Authoring Tool editor、JSON export、validator は未実装です。`beauty_filter_asset_v1`、`shapeWarpSettings` v1、`colorLayers` v1、Production Shape Warp、Color Processing、Runtime renderer integration はまだ未実装です。

## 7. IdealFace

IdealFace v1 は実装済みです。

IdealFace は独自の理想 3D 顔モデルを本体とします。

### 7.1 MediaPipe canonical face model との関係

MediaPipe canonical face model は、MediaPipe 側が landmark 検出や face geometry のために使う標準顔モデル・基準顔です。日本語では、MediaPipe 内部の標準顔お面と考えると分かりやすいです。

BAE AR が作るものは、MediaPipe canonical face model そのものではありません。BAE AR が作るのは、BAE AR 独自の IdealFace 用 canonical face / お面データです。IdealFace は「こう寄せたい」という理想顔を表す補正・比較側の基準であり、MediaPipe 478 landmarks そのものでも、MediaPipe canonical face model そのものでもありません。

MediaPipe の topology、landmark index、canonical model の考え方は参考にする可能性があります。ただし、最終的な理想顔定義は BAE AR 独自の IdealFace asset として管理します。MediaPipe 標準顔 = BAE AR 理想顔、とはしません。MediaPipe は検出側の基準、BAE AR IdealFace は補正・比較側の基準です。

重要:

- IdealFace は MediaPipe 478 landmarks そのものではない
- IdealFace は MediaPipe canonical face model そのものではない
- IdealFace は BAE AR 独自の理想顔空間であり、IdealFace asset として管理する
- Engine Runtime で current face と比較するため、IdealFace は `idealLandmarks3D` 478 点を本体として持つ
- current 478 landmarks と ideal 478 landmarks を比較して shape processing へ進む
- 2D 動画 / 複数画像から IdealFace を作る処理は、リアルタイム処理ではなく IdealFace Authoring Tool の責務

IdealFace Authoring Tool は BAE AR 独自の IdealFace asset を作成・調整するツールです。MediaPipe canonical face model そのものを作るツールではありません。`natural_v1` の controlPoints は現段階の投影検証用データであり、IdealFace 本体ではありません。

### 7.3 correctionProfile v1

`correctionProfile` v1 は、`ideal_face_asset_v1` の optional top-level field として扱う補正設定です。`idealLandmarks3D` は理想顔の形状データ、`correctionProfile` は各 landmark をどれくらい projected ideal へ寄せるかを表す補正設定として分けます。

`correctionProfile` は v1 では `"per_landmark_strength"` mode のみを持ち、`defaultStrength`、`landmarkStrengths`、`maxCorrectionDistance` を定義します。`strength` は 0.0 から 1.0 で、0.0 は補正なし、1.0 は projected ideal に完全一致、0.25 は current から projected ideal への差分の 25% だけ寄せることを意味します。

`correctionProfile` には dx / dy を保存しません。dx / dy は current landmarks、projected ideal `imageLandmarks`、顔姿勢、表情、projection 結果によって毎フレーム変わるため、Engine Runtime が毎フレーム計算します。

Engine 側では、`expressionAttenuation` v1 foundation も実装済みです。これは MediaPipe blendshape score に応じて `mouth` / `left_eye` / `right_eye` / `face_boundary` などの `affectedLandmarkGroups` ごとの `strengthScale` を弱める safety attenuation です。`affectedLandmarkGroups` は将来 `beauty_filter_asset_v1.landmarkGroups` の group id を参照します。`jawOpen` が高いときは `mouth` group、`eyeBlinkLeft` / `eyeSquintLeft` が高いときは `left_eye` group、`eyeBlinkRight` / `eyeSquintRight` が高いときは `right_eye` group の補正を弱めます。`strengthScale` は即時切替ではなく smoothing します。

詳細な JSON 例、fallback、validation 方針、Runtime / Authoring / Studio の責務分離は [correctionProfile v1](correction-profile-v1.md) に定義します。expression-aware attenuation の設計方針は [expression-aware correctionProfile](expression-aware-correction-profile.md) に、参照先 group の仕様は [landmarkGroups v1](landmark-groups-v1.md) に整理します。Engine 側 foundation、validation / fallback、expressionAttenuation v1 foundation、CorrectionPlan v1 debug foundation は実装済みです。Authoring Tool 編集 UI、asset export 連携、expression-specific IdealFace、expression target offset、Production Shape Warp は未実装です。

### 7.2 IdealFace Authoring Tool における idealLandmarks3D 作成方針

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

Current JSON preview:

```text
activeSummary
poseAware
currentCandidate
reference
debug
```

`currentCandidate` は Step 2-H preview に表示される現在の candidate です。`generationMethod` は `pose_aware_weighted_z_v1` で、478 landmarks 全文は出さず、summary と先頭数点 preview に留めます。`natural_v1` の 6 controlPoints は reference / projection debug 用であり、IdealFace 本体は `idealLandmarks3D` 478点です。

この処理は完全自動生成ではなく、自動推定 + 将来の手動補正として扱います。動画入力、詳細スキャン、pose-aware dataset 作成、candidate generation、3D point cloud preview は IdealFace Authoring Tool の責務であり、Engine Runtime には含めません。

Authoring Tool は `idealLandmarks3D` を same-unit coordinate として生成します。`video_aspect_same_unit_v1` による video aspect 補正、pose-aware generation、将来の manual adjustment UI は Authoring Tool 側の責務です。Runtime は完成済み IdealFace asset を読み込み、same-unit の `idealLandmarks3D` を `FacePose` に投影し、overlay / difference / warp 用に image-normalized / pixel 座標へ変換します。Runtime は Authoring generation logic を持ちません。

Still planned:

- confidence debug
- manual adjustment UI
- save / import
- correctionProfile / landmarkGroups / beauty_filter_asset_v1 export
- multiple image input

## 8. IdealFace Projection

IdealFace Projection v1 は実装済みです。

現在は `IdealFace.model.idealLandmarks3D` 478点を FacePose の yaw / pitch / roll に応じて回転し、face center + uniform scale alignment を行い、Projection / alignment debug 用の `sameUnitLandmarks` と、Studio overlay / current-vs-ideal difference / Shape Warp 入力用の `imageLandmarks` を分けて生成します。Perspective camera、face surface、mesh、renderer はまだ持ちません。

責務:

- FacePose を受け取る
- IdealFace の `idealLandmarks3D` 478点を現在姿勢へ回転する
- same-unit 空間で face center + uniform scale alignment を行う
- overlay / difference / Shape Warp 入力用の projected ideal `imageLandmarks` を生成する

current-vs-projected ideal 478点 difference debug v1:

- current 478 landmarks は MediaPipe 由来の image-normalized 座標
- projected ideal 478 landmarks は Projection 後の `imageLandmarks`
- `deltaX = projectedIdeal.x - current.x`
- `deltaY = projectedIdeal.y - current.y`
- `distance = sqrt(deltaX * deltaX + deltaY * deltaY)`

現在は `deltaX` / `deltaY` / `distance`、平均差分、最大差分 landmark index、top differences を debug 表示します。これは CorrectionPlan ではありません。warp へ渡す補正量は、後段の CorrectionPlan v1 debug foundation が `correctionProfile` と `expressionAttenuation` を使って生成します。

Production 未実装:

- Production Shape Warp
- Production WebGL mesh warp / Runtime renderer integration
- Production renderer lifecycle / disposal / fallback

将来の完全版では、Projection 後の ideal 2D landmarks はすでに現在姿勢を反映します。したがって、CorrectionPlan は姿勢補正を担当しません。

### 8.1 IdealFace Projection / Shape Warp 座標系方針

Projection / Shape Processing では座標系を以下の 3 種類に分けます。

```text
same-unit coordinate:
  - IdealFace asset / idealLandmarks3D の基準座標
  - x/y が同じ距離単位になるように Authoring Tool で正規化する
  - 3D projection / FacePose rotation / uniform alignment の内部計算で使う
  - そのまま canvasWidth / canvasHeight を掛けて描画してはいけない

image-normalized coordinate:
  - MediaPipe current landmarks と同じ座標系
  - x は画像幅基準、y は画像高さ基準
  - Studio overlay、current-vs-ideal difference、CorrectionPlan 入力で使う
  - projected ideal landmarks は、Shape Warp 前にこの座標系へ変換する

pixel coordinate:
  - 実際の canvas / video frame 上の pixel 座標
  - 最終的な描画や画像変形で使う
```

IdealFace の本体である `idealLandmarks3D` は same-unit coordinate として扱います。Runtime Projection は `idealLandmarks3D` を `FacePose` に合わせて回転し、same-unit 空間上で face center / uniform scale alignment します。Runtime では IdealFace の縦横比を現在顔に合わせて x/y 別 scale しません。

Studio overlay に描画する projected ideal 478 landmarks は image-normalized coordinate として扱います。same-unit の projected ideal landmarks を、そのまま `x * canvasWidth` / `y * canvasHeight` で描画しません。overlay / current-vs-ideal difference / `CorrectionPlan` へ渡す前に、same-unit から image-normalized へ変換します。

Projection result は、Projection / alignment / debug 用の same-unit projected landmarks と、Studio overlay / current landmarks 比較 / Shape Warp 入力用の image-normalized projected landmarks を分けて持ちます。`sameUnitLandmarks` は same-unit coordinate、`imageLandmarks` は MediaPipe current landmarks と同じ image-normalized coordinate です。既存互換用の `landmarks` が残る場合も、Studio overlay では `imageLandmarks` を使います。

```ts
type IdealLandmarks3DProjectionResult = {
  status: "not_available" | "missing_face_pose" | "projected"

  // Projection / alignment / debug 用
  sameUnitLandmarks: ProjectedIdealLandmarkSameUnit[]

  // Studio overlay / current landmarks 比較 / Shape Warp 入力用
  imageLandmarks: ProjectedIdealLandmarkImageNormalized[]

  landmarkCount: number
  alignment: unknown
  summary: unknown
}
```

Runtime Projection alignment では x/y 別 scale を行いません。IdealFace の縦横比を現在顔に合わせて歪めません。縦横比や形状そのものの調整は、将来の IdealFace Authoring Tool manual adjustment UI で扱います。

Studio overlay は `imageLandmarks` を `x * canvasWidth` / `y * canvasHeight` で描画します。same-unit landmarks をそのまま canvas pixel に変換しません。current 478 landmarks との差分比較 debug、CorrectionPlan v1 debug foundation、Studio 向け Shape Warp v1 debug prototype、Studio processed preview 限定 WebGL mesh warp v1 prototype は実装済みです。Production Shape Warp / Runtime renderer integration は未実装です。

## 9. Shape Processing

Shape Processing は debug foundation まで実装済みです。Production Shape Warp は未実装です。

Shape processing は個別パーツ加工ではありません。

処理方針:

```text
現在顔から MediaPipe 478 landmarks を取得
  -> FacePose を推定
  -> IdealFace 3D model を same-unit coordinate で現在姿勢へ投影
  -> projected ideal 478 landmarks を image-normalized coordinate へ変換
  -> current image-normalized landmarks と projected ideal image-normalized landmarks の差分を取る
  -> CorrectionPlan を生成
  -> 顔全体として自然に少し warp
```

current-vs-ideal difference は image-normalized coordinate で行います。

```text
current 478 landmarks:
  MediaPipe 由来の image-normalized 座標

projected ideal 478 landmarks:
  IdealFace same-unit landmarks を FacePose へ投影し、
  alignment 後に image-normalized 座標へ変換したもの

difference:
  current image-normalized landmarks と projected ideal image-normalized landmarks の差分として計算する
```

差分例:

```text
deltaX = projectedIdealImageX - currentX
deltaY = projectedIdealImageY - currentY
```

この差分を `CorrectionPlan` に渡します。

CorrectionPlan v1 debug foundation では、`correctionProfile` の `strength` を差分に掛け、`maxCorrectionDistance` で correction vector を clamp します。`expressionAttenuation` v1 foundation がある場合は、blendshape score から group ごとの `strengthScale` を計算し、`finalStrength = baseStrength * groupStrengthScale` として可動部位の補正を弱めます。`correctionProfile` は個別パーツ加工命令ではなく、current から projected ideal へ全体として自然に少し寄せるための補正率です。

やらないこと:

- 目だけ大きくする
- 鼻だけ細くする
- 顎だけ削る
- 個別パーツ加工を主機能として増やす

## 10. CorrectionPlan

CorrectionPlan v1 debug foundation は実装済みです。current-vs-projected ideal difference と `correctionProfile` を使い、478点分の correction vectors を計算して Studio debug / Copy Debug / overlay で確認できます。

Production Shape Warp へ渡す renderer 統合、temporal smoothing、品質調整は後段です。

CorrectionPlan は、姿勢補正を担当しません。

理由:

- 顔姿勢への対応は、IdealFace 3D model を現在 FacePose に投影する IdealFace Projection の責務
- Projection 後の ideal 2D landmarks はすでに現在姿勢を反映している

CorrectionPlan の責務:

- current image-normalized landmarks と projected ideal image-normalized landmarks の差分を受け取る
- `correctionProfile` の strength を掛ける
- `maxCorrectionDistance` で correction vector を clamp する
- 実際に warp へ渡す安全な補正量を決める
- 補正強度、移動量上限、滑らかさ、過補正防止、信頼度などを扱う
- 個別パーツ加工命令セットにはしない

CorrectionPlan は same-unit projection 後、image-normalized に変換された current-vs-ideal 差分を受け取ります。CorrectionPlan は `FacePose` の推定や IdealFace projection を担当しません。

`correctionProfile` と CorrectionPlan の関係:

```text
correctionProfile:
  IdealFace asset に保存される補正設定
  各 landmark をどれくらい ideal に寄せるかを表す
  dx / dy は持たない

CorrectionPlan:
  Engine が毎フレーム生成する実行計画
  current landmarks と projected ideal imageLandmarks の dx / dy を計算する
  correctionProfile の baseStrength を決める
  expressionAttenuation がある場合は group strengthScale を掛ける
  maxCorrectionDistance で clamp する
  Shape Warp へ渡す correction vectors を持つ
```

`expressionAttenuation` は、目だけ大きくする、鼻だけ細くする、顎だけ削るための機能ではありません。表情や可動部位によって破綻しやすい領域の補正を弱める safety attenuation です。表情別 IdealFace や expression target offset は後段であり、まずは Step 1 として blendshape score による group strengthScale 制御を扱います。

## 11. Color Processing / Layer System

Color Processing、Layer System、LayerMaskSpec は未実装です。

Layer System は shape warp ではなく、color processing 用に使います。

対象:

- skin smoothing
- whitening
- brightness
- tone
- blood color
- shadow / highlight
- cheek / lip / eye area などの色補正

重要:

- Layer System は変形加工には使わない
- `jaw_layer` で顎を削る、`eye_layer` で目を大きくする、`nose_layer` で鼻を細くする、のような使い方はしない
- Layer は色加工範囲、効果、強度、合成順を整理する仕組み

将来の `beauty_filter_asset_v1` では、色加工の設定を `colorLayers` セクションとして持ちます。`colorLayers` は whitening、skin smoothing、brightness、tone、lip color、cheek color、shadow / highlight、layer order、opacity、blend mode、mask / feather / gradient を扱う候補です。`colorLayers` は `landmarkGroups` の `skin` / `lip` / `cheek` / `eye_area` などを参照する可能性があります。

## 12. LayerMask / LayerMaskSpec

LayerMask は FaceLandmarks から生成する 2D mask です。LayerMaskSpec はその生成方法を定義する仕様です。

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

LayerMaskSpec の作成や手作業編集は Layer Mask Authoring Tool の責務です。Engine Runtime は定義済み LayerMaskSpec を読み込んで使います。

## 13. Runtime と Authoring の分離

Engine Runtime は定義済みの IdealFace / LayerMaskSpec を読み込んで使うだけです。

Engine Runtime で行わないこと:

- IdealFace の作成
- MediaPipe canonical face model の生成・編集
- 2D 動画からの 3D 顔生成
- LayerMaskSpec の作成
- mask の手作業編集
- Studio / Authoring 用 UI

Beauty Studio では、開発確認用として overlay や簡易調整 UI を持ってよいです。ただし、本番配布対象には含めません。

## 14. Engine / Studio の責務分離

### 14.1 Engine Runtime

Engine Runtime の責務:

- 入力を受け取る
- 顔検出を実行する
- `FaceFrame` を更新する
- 補助情報を計算する
- 定義済み IdealFace / LayerMaskSpec を読み込む
- 将来の shape processing、color processing、描画、品質制御を提供する
- UI を持たない

### 14.2 Beauty Studio

Beauty Studio の責務:

- カメラ入力を用意する
- Engine の公開 API を呼び出す
- Engine の状態を確認する
- debug / overlay / tuning UI を提供する
- 実装検証を助ける

Studio は Engine の private field、内部状態、内部実装へ直接アクセスしません。

## 15. ロードマップ

### Milestone 0: 現在完了済みの基盤

状態: 実装済み

- monorepo / npm workspace
- `packages/engine`
- `apps/studio`
- `BeautyEngine` lifecycle
- `FaceDetector` interface
- `MediaPipeFaceDetector`
- `FaceFrame`
- `FaceGeometry`
- Studio camera preview
- Studio debug / overlay

### Milestone 1: ドキュメントと現状整理

状態: 実装中

- 現在実装済み API の明文化
- 実装済み / 未実装 / 将来予定の整理
- 4 領域構成の明文化
- Runtime と Authoring の分離の明文化
- shape processing と color processing の分離の明文化
- Engine / Studio 責務分離の明文化

### Milestone 2: FacePose v1

状態: 実装済み

目的:

- 現在顔の pitch / yaw / roll を推定する。
- IdealFace Projection の入力にする。

完了条件:

- `FaceFrame.pose` が placeholder ではなく実推定値になる。
- Studio で pose の値を確認できる。

### Milestone 3: IdealFace v1

状態: 実装済み

目的:

- 独自の理想 3D 顔モデルとして IdealFace の構造を定義する。
- Runtime で読み込める最小プリセットを 1 つ以上持つ。
- IdealFace から MediaPipe 478 landmarks と対応する ideal 478 landmarks を生成できる設計にする。

完了条件:

- IdealFace が MediaPipe 478 landmarks そのものではないことが型と実装で表現される。
- Engine Runtime の公開 API として扱える。
- Studio から公開 API 経由で選択・確認できる。

### Milestone 4: IdealFace Projection v1

状態: 実装済み（Projection / overlay / difference debug）

目的:

- IdealFace `idealLandmarks3D` 478点を現在 FacePose へ投影し、overlay と current-vs-ideal difference debug で現在顔と比較できるようにする。

完了条件:

- BeautyEngine の公開 API から projected ideal `sameUnitLandmarks` / `imageLandmarks` を取得できる。
- Studio overlay で projected ideal 478 landmarks を確認できる。
- yaw / pitch / roll に応じて projected ideal landmarks が変化する。
- current landmarks と projected ideal `imageLandmarks` の差分を確認できる。
- Studio overlay で top differences の difference line を確認できる。
- 平均差分と最大差分 landmark index を確認できる。

実装済み:

- idealLandmarks3D 478点 Projection
- Projection result の `sameUnitLandmarks` / `imageLandmarks` 分離
- Studio overlay
- current-vs-projected ideal 478点 difference debug
- difference line overlay
- bounds / aspect / coordinate conversion debug
- face center + uniform scale alignment
- contain scale basis debug

Milestone 4 に含めないもの:

- CorrectionPlan production integration
- Production Shape Warp
- Production WebGL mesh warp / Runtime renderer integration

### Milestone 5: CorrectionPlan v1

状態: debug foundation 実装済み / production integration 未実装

目的:

- current 2D landmarks と ideal 2D landmarks の差分から、warp へ渡す安全な補正量を生成する。

完了条件:

- optional `correctionProfile` がない asset では fallback default を使える。
- `correctionProfile` の per-landmark strength を correction vector に適用できる。
- `expressionAttenuation` v1 foundation により、blendshape score に応じて group strengthScale を適用できる。
- `maxCorrectionDistance` で correction vector を clamp できる。
- 補正強度、移動量上限、滑らかさ、過補正防止、信頼度を扱える。
- 姿勢補正を担当していない。
- 個別パーツ加工命令セットになっていない。

実装済み:

- correctionProfile fallback default
- per-landmark strength 適用
- maxCorrectionDistance clamp
- expressionAttenuation v1 foundation
- jawOpen / eyeBlink / eyeSquint による group strengthScale
- halfLifeMs smoothing
- CorrectionVector の baseStrength / expressionStrengthScale / finalStrength
- 478点分の correction vectors 計算
- Studio debug / Copy Debug
- CorrectionPlan vector overlay
- current-vs-projected ideal difference からの raw delta 利用
- image-normalized coordinate 基準の target 計算

未実装 / 後段:

- Production Shape Warp への renderer 統合
- landmarkGroups asset schema 連携
- Authoring Tool UI / export 連携
- expression target offset
- expression-specific IdealFace
- quality tuning
- correctionProfile Authoring UI との連携
- 本番 SDK API としての整理
- mobile / performance 対応

### Milestone 6: Shape Warp v1

状態: Studio debug prototype 実装済み / Production Shape Warp 未実装

目的:

- CorrectionPlan に基づき、顔全体として自然に少し warp する。

完了条件:

- Studio で加工前後を比較できる。
- 過補正や破綻を debug できる。
- 目だけ、鼻だけ、顎だけの個別パーツ加工になっていない。

実装済み:

- Studio processed preview 限定 Shape Warp v1 debug prototype
- CPU radial warp debug
- Source preview / Processed preview 分離
- Shape Warp Debug ON/OFF
- radius / strength / maxVectors / minCorrectionDistance
- nearest / bilinear sampling
- preset 比較機能
- Shape Warp 使用ベクトル overlay
- Studio processed preview 限定 WebGL mesh warp v1 prototype
- WebGL mesh debug mode
- meshWarpStrength / texture filtering / wireframe debug
- MediaPipe face mesh topology による triangle count / mesh vertex summary
- Studio debug / Copy Debug summary

未実装 / 後段:

- Production Shape Warp
- Production WebGL mesh warp / Runtime renderer integration
- Production MediaPipe topology triangle mesh warp
- temporal smoothing
- mask / boundary handling
- glasses / hair handling
- performance / mobile optimization

### Milestone 6.5: beauty_filter_asset_v1 foundation

状態: docs direction 追加 / foundation 未実装

目的:

- IdealFace + landmarkGroups + correctionProfile + shapeWarpSettings + colorLayers を束ねる最終 filter asset を定義する。
- 配布単位は 1つの `beauty_filter_asset_v1` JSON にする。
- 内部は責務ごとに分離し、意味を混ぜない。

段階的な目安:

```text
Step 1: landmarkGroups v1 docs specification
Step 2: Engine landmarkGroups foundation
Step 3: Authoring Tool landmark group editor
Step 4: shapeWarpSettings v1 docs / foundation
Step 5: colorLayers v1 docs / foundation
Step 6: beauty_filter_asset_v1 foundation
```

完了条件:

- `landmarkGroups` を `expressionAttenuation` と `colorLayers` が参照できる。
- `shapeWarpSettings` が WebGL mesh warp / smoothing / boundary の設定を表す。
- `colorLayers` が色加工、mask、合成順、opacity を表す。
- Engine Runtime は 1つの asset から shape / color の両方を実行できる。
- Studio は Engine の公開 API 経由で読み込み・状態確認を行う。
- Authoring Tool 群は各セクションの作成・編集を担当し、Runtime に UI を持ち込まない。

今回追加した docs:

- [beauty_filter_asset_v1 direction](beauty-filter-asset-v1.md)
- [landmarkGroups v1](landmark-groups-v1.md)

### Milestone 7: Color Processing v1

状態: 未実装

目的:

- skin smoothing、whitening、brightness、tone、blood color、shadow / highlight などの color processing を検討する。

完了条件:

- Engine Runtime 側で処理される。
- Studio は公開 API 経由で確認・調整する。
- shape warp と混同していない。

### Milestone 8: Layer System v1

状態: 未実装

目的:

- color processing の色加工範囲、効果、強度、合成順を整理する。

完了条件:

- shape warp 用ではない。
- 個別パーツ変形用ではない。
- Engine の内部表現として整理され、必要な公開 API のみが外へ出る。

### Milestone 9: LayerMaskSpec v1

状態: 未実装

目的:

- LayerMask を FaceLandmarks から生成するための LayerMaskSpec を定義する。

完了条件:

- polygon 化、除外領域、膨張・収縮、feather / blur、0.0〜1.0 の強度マップを扱える。
- Runtime は定義済み LayerMaskSpec を読み込んで使える。
- LayerMaskSpec の作成 UI は Runtime に含まれていない。

### Milestone 10: IdealFace Authoring Tool

現在の active workflow:

- MP4 input
- detailed scan
- Step 2-I-A frame selection
- Step 2-I-B pose-aware inference dataset
- Step 2-I-C `pose_aware_weighted_z_v1` candidate generation
- Step 2-H `currentCandidate` point cloud preview

旧 Step 2-C〜2-G v1 の 5ポーズ方式は current code から削除済みです。必要な場合は Git 履歴を参照します。

未実装 / 今後:

- confidence debug
- manual adjustment UI
- save / import
- correctionProfile / landmarkGroups / beauty_filter_asset_v1 export
- multiple image input

### Milestone 11: Layer Mask Authoring Tool

状態: 未実装 / 将来予定

目的:

- 色加工用 LayerMaskSpec を作成・調整する。

完了条件:

- landmarks 範囲、除外領域、膨張・収縮、feather / blur を authoring できる。
- Runtime で読み込む LayerMaskSpec を出力できる。
- Runtime に手作業編集 UI を持ち込んでいない。

### Milestone 12: Butterflyve integration

状態: 未実装 / 将来予定

目的:

- Butterflyve から Engine Runtime を利用する。

完了条件:

- Engine Runtime の公開 API で統合できる。
- Studio / docs / authoring tools が本番配布物に含まれない。
- 実カメラ確認と手動確認事項が PR に記載される。

### Milestone 13: 本番 SDK 化

状態: 未実装

目的:

- Engine Runtime を本番サービスへ組み込める形に整える。

完了条件:

- build / test / lint script が定義される。
- Studio / docs / debug 専用コード / authoring tools が配布物に含まれない。
- 手動確認項目が PR に記載される。

## 16. 開発方針

実装前に必ず関連する実コードを確認します。

確認対象:

- 呼び出し元と呼び出し先
- 型定義、インターフェース、公開 API
- 状態の所有者と更新箇所
- debug 値が実行時に利用している同じインスタンスから来ているか
- `initialize` / `start` / `setInput` / `setFaceDetector` のライフサイクル順序
- guard / early return / error handling

Studio UI 表示は原則として日本語にします。API 名、型名、コード識別子は英語のままとします。

## 17. 手動確認方針

Codex 環境ではブラウザのカメラ許可や実映像確認ができない場合があります。

その場合、PR には次のような手動確認事項を残します。

```md
## Manual Testing

- カメラ権限許可
- カメラ映像確認
- Input: connected 確認
```

## 18. IdealFace Authoring Tool Step 1 / Step 2-A / Step 2-B

Step 1 の `natural_v1` metadata と 6 controlPoints は reference / projection debug 用です。IdealFace 本体は `idealLandmarks3D` 478点です。

Step 2-A は MP4 動画入力、metadata 確認、表示用の粗いフレーム抽出を扱います。粗い抽出は debug / metadata 確認用で、Step 2-I の observation source ではありません。

Step 2-B は MediaPipe による 2D 478 landmarks と FacePose の取得を扱います。その後続は旧 Step 2-C〜2-G ではなく、detailed scan から Step 2-I-A/B/C の pose-aware workflow へ進みます。

## 18-C to 18-G. Removed Step 2-C to 2-G v1 history

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

## 18-H. IdealFace Authoring Tool Step 2-H

Step 2-H は、Step 2-I-C で生成された `currentCandidate` を interactive 3D point cloud preview として確認する表示です。preview camera、y 軸反転、z 表示倍率は表示専用であり、candidate data 自体は変更しません。

Current JSON preview:

```text
activeSummary
poseAware
currentCandidate
reference
debug
```

`currentCandidate` は Step 2-H preview に表示される現在の candidate です。`generationMethod` は `pose_aware_weighted_z_v1` で、478 landmarks 全文は出さず、summary と先頭数点 preview に留めます。`natural_v1` の 6 controlPoints は reference / projection debug 用であり、IdealFace 本体は `idealLandmarks3D` 478点です。

## 18-I. IdealFace Authoring Tool Step 2-I

Step 2-I is the current active workflow for IdealFace Authoring Tool.

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

Step 2-I-A keeps the frame selection state in `frontReferenceFrameIds` and `excludedFrameIds`. Usable observation frames are derived from detailed scan frames that have a detected face, 478 landmarks, and `FacePose`, and are not excluded.

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

## 19. IdealFace / Projection / Shape Processing 中核仕様

BAE AR の shape processing では、IdealFace は 3D の `idealLandmarks3D` 478 点を本体とします。理想 3D 顔プリセットとしての IdealFace は、`idealLandmarks3D` 478 点を中核に持つ asset です。IdealFace は正面固定の 2D landmarks だけを持つものではありません。`idealLandmarks3D` は same-unit coordinate として扱います。

Runtime は、その 3D ideal landmarks を現在顔の `FacePose` へ投影し、2D の projected ideal 478 landmarks を生成します。Projection 内部では same-unit coordinate で回転と uniform alignment を行い、Studio overlay / difference / Shape Warp 入力へ渡す前に image-normalized coordinate へ変換します。正面 2D の 478 点だけでは顔の角度変化に追随できないため、顔の角度変化への対応は IdealFace の 3D landmarks を `FacePose` へ投影することで行います。

Shape Processing は、MediaPipe Face Landmarker がカメラ映像から取得した current image-normalized 478 landmarks と、IdealFace 由来の projected ideal image-normalized 478 landmarks の差分を見ます。この差分をもとに CorrectionPlan v1 debug foundation が correction vectors を生成し、Studio 向け Shape Warp v1 debug prototype と Studio processed preview 限定の WebGL mesh warp v1 prototype へ進みます。Production Shape Warp / Runtime renderer integration は後段です。最終的な image warp では pixel coordinate を使います。

現在の `natural_v1` の 6 点 controlPoints は、現段階の投影検証用データです。Projection の流れを確認するための暫定データであり、IdealFace 本体ではありません。

```text
IdealFace
  = idealLandmarks3D: same-unit coordinate の 478点を持つ

Runtime
  = idealLandmarks3D を same-unit coordinate で現在 FacePose へ投影する
  = same-unit projected landmarks と image-normalized projected landmarks を分けて扱う

Shape Processing
  = current image-normalized 478 landmarks と projected ideal image-normalized 478 landmarks の差分を見る
  = 差分をもとに CorrectionPlan v1 debug foundation / Shape Warp v1 debug prototype へ進む
  = Production Shape Warp / Runtime renderer integration は後段
```

`CorrectionPlan` は姿勢補正を担当しません。Projection 後に image-normalized coordinate へ変換された current-vs-ideal 差分を受け取り、`FacePose` の推定や IdealFace projection は担当しません。


## IdealFace Authoring Tool Current Generation Path

Step 2-G v1 five-pose candidate generation has been removed from the current code. The active path is Step 2-I-C `pose_aware_weighted_z_v1`, with Step 2-H `currentCandidate` point cloud preview. Future confidence debug, manual adjustment, save, and export work should be added to the Step 2-I active workflow.

## 20. Shape Warp production direction

Shape Warp v1 debug prototype は、CorrectionPlan の補正ベクトルを Studio の Processed preview に接続するための debug prototype です。CPU radial warp debug と Studio processed preview 限定 WebGL mesh warp v1 prototype は実装済みですが、本番品質の Shape Warp / Runtime renderer ではありません。今後も検証・比較用として残します。

Production Shape Warp の本命候補は WebGL mesh warp とします。MediaPipe face mesh topology を使った triangle mesh warp を検討し、current image-normalized landmarks を source vertices、CorrectionPlan `target` を target vertices、source video frame / source canvas を texture として扱います。

```text
Camera / video frame
  -> MediaPipe current 478 landmarks
  -> IdealFace 478 Projection
  -> projected ideal imageLandmarks
  -> current-vs-ideal difference
  -> correctionProfile strength / clamp
  -> CorrectionPlan target 478 points
  -> WebGL mesh warp
       source vertices: current landmarks
       target vertices: CorrectionPlan target points
       texture: source video frame
       triangles: MediaPipe face mesh topology
  -> Processed preview / Runtime output
```

座標系方針:

```text
same-unit coordinate:
  idealLandmarks3D / Projection 内部で使う
  WebGL mesh warp へ直接渡さない

image-normalized coordinate:
  MediaPipe current landmarks
  projected ideal imageLandmarks
  current-vs-ideal difference
  CorrectionPlan input / output
  WebGL mesh warp の source / target vertices の元データ

pixel / clip coordinate:
  WebGL へ渡す前に canvas / texture / viewport に合わせて変換する
```

今後の段階:

```text
Step A: docs / direction
  CPU radial warp debug の位置づけを明確にし、本番候補を WebGL mesh warp として整理する。
  今回のステップであり、実装は行わない。

Step B: Studio WebGL mesh warp prototype
  Studio processed preview 限定で、current landmarks と CorrectionPlan target を使った mesh warp を試す。v1 prototype は実装済み。
  Source preview は元映像のまま残し、CPU radial debug と切り替え比較できるようにする。

Step C: Runtime renderer integration
  Engine Runtime 側の renderer として lifecycle / resource disposal / fallback / performance / mobile 対応を整理する。

Step D: Quality improvements
  temporal smoothing、face boundary、mask / feather、hair / glasses、seam、expression / pose stability、correctionProfile authoring 連携を扱う。
```

未決定 / 後段:

- MediaPipe topology をどの形で保持するか
- triangle indices の source をどこに置くか
- 顔外の背景をどう扱うか
- 髪・眼鏡・手など顔メッシュ外のものをどう扱うか
- mesh の境界をどう自然にするか
- WebGL1 / WebGL2 の対象
- fallback renderer
- mobile performance
- temporal smoothing の方式
- correctionProfile authoring UI

詳細は [Shape Warp production direction](shape-warp-production-direction.md) を参照します。Studio WebGL mesh warp v1 prototype は processed preview 限定で実装済みです。Production shader 実装、Production triangle mesh warp 実装、Runtime renderer 実装、MediaPipe face mesh topology の本番整理はまだ行いません。
