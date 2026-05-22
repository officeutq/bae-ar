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
- IdealFace Projection v1 最小実装
- projected IdealFace controlPoints overlay
- Projection Difference Debug v1
- representative point difference line overlay

### 3.2 未実装

- ideal 478 landmarks 生成
- CorrectionPlan
- Shape Warp
- Color Processing
- Layer System
- LayerMaskSpec
- renderer
- runtime quality control
- preset API
- IdealFace Authoring Tool の 3D 478点候補推測、3D点群 preview、手動微調整、保存 / export
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
- IdealFace Projection v1 は controlPoints のみの部分実装です。
- Projection Difference Debug v1 は FaceGeometry 代表点と projected IdealFace controlPoints の差分確認用です。
- `FaceGeometry` は landmarks から代表点やサイズを計算する補助解析です。
- 実際の shape warp、color processing、rendering はまだありません。
- IdealFace Authoring Tool は Step 2-F まで実装済みです。

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

### 7.2 IdealFace Authoring Tool における idealLandmarks3D 作成方針

IdealFace の本体である `idealLandmarks3D` 478点は、IdealFace Authoring Tool 側で作成します。将来的には動画または複数画像から作成する方針ですが、初期入力形式は MP4 動画のみとします。複数画像入力は将来対応とし、初期段階では入力形式を広げず、代表フレーム抽出とラベル確定の流れを優先します。Step 2-A では、MP4 動画入力、metadata 表示、一定間隔でのフレーム抽出、サムネイル一覧表示までを実装済みです。Step 2-B では、抽出済みフレームの MediaPipe 解析、2D 478 landmarks と FacePose の取得、解析結果 summary 表示までを実装済みです。Step 2-C では、yaw / pitch / roll による代表フレーム候補の自動抽出、各カテゴリ上位複数件の候補一覧表示、JSON preview への候補概要表示までを実装済みです。Step 2-D では、代表フレーム候補から正面 / 左向き / 右向き / 上向き / 下向き / 除外を手動確定し、候補カテゴリを必要なものだけ開くトグル表示、確定済み代表フレーム一覧、3D推測準備状況、JSON preview の `selectedRepresentativeFrames` を確認できるようにしました。Step 2-E では、確定済み代表フレームから front / left / right / up / down の 3D推測用データセットを作成し、readiness summary、dataset 一覧、JSON preview の `idealLandmarks3DInferenceDataset` 概要を確認できるようにしました。Step 2-F では、候補抽出用に動画全体を詳細スキャンし、詳細スキャン summary と JSON preview の `scanSummary` を表示できるようにしました。確定済み代表フレーム一覧と3D推測用データセットには、正面 / 左向き / 右向き / 上向き / 下向きだけを表示します。

Engine Runtime は `idealLandmarks3D` を作成せず、完成済みの IdealFace asset を読み込んで使います。

初期実装で想定する流れ:

```text
MP4 動画を入力
  -> 表示用に一定間隔でフレーム抽出
  -> 候補抽出用に動画全体を詳細スキャン
  -> MediaPipe Face Landmarker で各スキャンフレームの 2D 478 landmarks と FacePose を取得
  -> yaw / pitch / roll から各カテゴリ上位複数件の代表フレーム候補を自動抽出
  -> 候補を複数比較する
  -> ユーザーが正面 / 左向き / 右向き / 上向き / 下向き / 除外を手動確定
  -> 確定済み代表フレームから 3D 推測用データセットを作成
  -> 確定した代表フレーム群から 3D の idealLandmarks3D 478点候補を自動推測
  -> Authoring Tool 上で確認・微調整
  -> IdealFace asset として保存 / export
```

推奨する MP4 動画:

- 形式: MP4
- codec: H.264 / AVC 推奨
- 長さ: 5〜15秒程度
- fps: 30fps程度
- 解像度: 720p程度から開始
- 顔が大きく写っている
- 正面、左向き、右向き、上向き、下向きをゆっくり含む
- 手ブレが少ない
- 明るい場所で撮影する
- 口は閉じ気味
- 表情はできるだけ neutral

初期段階では、長時間動画、高解像度すぎる動画、HEVC / H.265、MOV、WebM、複数画像入力は非推奨または未対応です。これらは将来対応を検討する余地を残します。

代表フレーム候補は、yaw / pitch / roll を使って自動抽出します。Step 2-F では、表示用の最大20件程度の抽出フレームだけでなく、動画全体を 0.25 秒間隔、最大 120 フレーム程度まで詳細スキャンします。顔検出あり、landmarks 数 478、pose pitch / yaw / roll 取得済みの詳細スキャンフレームだけを評価し、正面候補、yaw 正方向候補、yaw 負方向候補、pitch 正方向候補、pitch 負方向候補を各カテゴリ上位複数件、候補一覧と JSON preview に表示します。全スキャンフレーム一覧は UI に表示せず、候補に採用されたフレームだけを手動確定と dataset 作成に使えるよう保持します。Step 2-D UI整理では候補カテゴリをトグル表示にし、必要なカテゴリだけを開いて候補カードを確認します。候補 1 件だけで確定せず、複数候補を比較して Step 2-D の手動確定 UI で最終ラベルを決めます。Step 2-E では確定済み代表フレームから 3D推測用データセットを作成します。

ただし、自動抽出だけでは確定しません。ユーザーが Authoring Tool 上で、正面 / 左向き / 右向き / 上向き / 下向き / 除外を手動確定します。除外は代表フレームではないため、確定済み代表フレーム一覧には表示しません。除外情報は状態や JSON preview / debug 情報として保持してよいものとします。

Step 2-E の dataset は front / left / right / up / down の代表フレームに対応する 2D 478 landmarks と FacePose を持つ入力データです。excluded は dataset に含めません。この dataset はまだ 3D の `idealLandmarks3D` 478点そのものではありません。将来的に、この dataset から 3D の `idealLandmarks3D` 478点候補を自動推測します。この時点の生成結果は完成データではなく候補データとして扱います。自動推測した候補は Authoring Tool 上で 3D点群として確認し、必要に応じて手動で微調整します。手動補正後の `idealLandmarks3D` 478点を IdealFace asset として保存 / export します。

この方針は完全自動生成ではなく、自動推測 + 手動補正です。動画入力、フレーム抽出、詳細スキャン、Authoring 用フレーム解析、代表フレーム抽出、手動ラベル確定 UI、3D推測用 dataset 作成は IdealFace Authoring Tool の責務であり、Engine Runtime には含めません。3D 478点推測、3D点群 preview、手動微調整、保存 / export は Step 2-F では未実装です。詳細な 3D 推測アルゴリズムはこの段階では定義しません。

v1 の制限事項:

- 現在のプリセットは `natural_v1` / `Natural` の 1 つのみ
- 3D control point は Projection の土台確認用の最小点群
- ideal 478 landmarks の生成は未実装
- IdealFace Projection v1 は controlPoints のみ部分実装
- CorrectionPlan / Shape Warp は未実装

## 8. IdealFace Projection

IdealFace Projection v1 は部分実装済みです。

現在は `IdealFace.model.controlPoints` を FacePose の yaw / pitch / roll に応じて回転し、Studio overlay 用の projected 2D points を生成します。これは Projection 検証用の最小実装であり、Perspective camera、face surface、mesh、renderer はまだ持ちません。

責務:

- FacePose を受け取る
- IdealFace の 3D controlPoints を現在姿勢へ回転する
- overlay 用の projected 2D points を生成する
- FaceGeometry 代表点と projected IdealFace controlPoints の差分を debug 用に計算する

Projection Difference Debug v1:

- `FaceGeometry.faceCenter` と `face_center`
- `FaceGeometry.leftEyeCenter` と `left_eye_outer`
- `FaceGeometry.rightEyeCenter` と `right_eye_outer`
- `FaceGeometry.noseTip` と `nose_tip`
- `FaceGeometry.mouthCenter` と `mouth_center`
- `FaceGeometry.chin` と `chin`

現在は上記の代表点対応のみを使い、`deltaX` / `deltaY` / `distance`、平均差分、最大差分点を debug 表示します。これは CorrectionPlan ではなく、warp へ渡す補正量も生成しません。

未実装:

- ideal 478 landmarks の生成
- current 478 landmarks と ideal 478 landmarks の比較
- Shape Warp / CorrectionPlan

将来の完全版では、Projection 後の ideal 2D landmarks はすでに現在姿勢を反映します。したがって、CorrectionPlan は姿勢補正を担当しません。

## 9. Shape Processing

Shape Processing は未実装です。

Shape processing は個別パーツ加工ではありません。

処理方針:

```text
現在顔から MediaPipe 478 landmarks を取得
  -> FacePose を推定
  -> IdealFace 3D model を現在姿勢へ投影
  -> ideal 2D landmarks 478 点を生成
  -> current 478 landmarks と ideal 478 landmarks の差分を取る
  -> CorrectionPlan を生成
  -> 顔全体として自然に少し warp
```

やらないこと:

- 目だけ大きくする
- 鼻だけ細くする
- 顎だけ削る
- 個別パーツ加工を主機能として増やす

## 10. CorrectionPlan

CorrectionPlan は未実装です。

CorrectionPlan は、姿勢補正を担当しません。

理由:

- 顔姿勢への対応は、IdealFace 3D model を現在 FacePose に投影する IdealFace Projection の責務
- Projection 後の ideal 2D landmarks はすでに現在姿勢を反映している

CorrectionPlan の責務:

- current 2D landmarks と ideal 2D landmarks の差分を受け取る
- 実際に warp へ渡す安全な補正量を決める
- 補正強度、移動量上限、滑らかさ、過補正防止、信頼度などを扱う
- 個別パーツ加工命令セットにはしない

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

状態: 部分実装済み（4-A / 4-B / 4-C）

目的:

- IdealFace controlPoints を現在 FacePose へ投影し、overlay で現在顔と比較できるようにする。

完了条件:

- BeautyEngine の公開 API から projected IdealFace points を取得できる。
- Studio overlay で projected IdealFace controlPoints を確認できる。
- yaw / pitch / roll に応じて projected points が変化する。
- FaceGeometry 代表点と projected IdealFace controlPoints の差分を確認できる。
- Studio overlay で difference line を確認できる。
- 平均差分と最大差分点を確認できる。

未実装:

- ideal 478 landmarks の生成
- current 478 landmarks と ideal 478 landmarks の比較
- Shape Warp / CorrectionPlan

### Milestone 5: CorrectionPlan v1

状態: 未実装

目的:

- current 2D landmarks と ideal 2D landmarks の差分から、warp へ渡す安全な補正量を生成する。

完了条件:

- 補正強度、移動量上限、滑らかさ、過補正防止、信頼度を扱える。
- 姿勢補正を担当していない。
- 個別パーツ加工命令セットになっていない。

### Milestone 6: Shape Warp v1

状態: 未実装

目的:

- CorrectionPlan に基づき、顔全体として自然に少し warp する。

完了条件:

- Studio で加工前後を比較できる。
- 過補正や破綻を debug できる。
- 目だけ、鼻だけ、顎だけの個別パーツ加工になっていない。

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

状態: 一部実装済み / Step 2-F まで完了

目的:

- BAE AR 独自の IdealFace canonical face / お面データとプリセットを作成・調整する。
- MediaPipe canonical face model そのものを作成・編集するツールにはしない。

完了条件:

- Step 2-A として MP4 動画入力、metadata 表示、フレーム抽出、サムネイル一覧表示ができる。
- Step 2-B として抽出済みフレームの MediaPipe 解析、2D 478 landmarks と FacePose の取得、解析 summary 表示ができる。
- Step 2-C として yaw / pitch / roll による代表フレーム候補の自動抽出、各カテゴリ上位複数件の候補一覧表示、JSON preview への候補概要表示ができる。
- Step 2-D として代表フレーム候補から正面 / 左向き / 右向き / 上向き / 下向き / 除外を手動確定し、候補カテゴリを必要なものだけ開くトグル表示、正面 / 左向き / 右向き / 上向き / 下向きだけを表示する確定済み代表フレーム一覧と3D推測準備状況、JSON preview の `selectedRepresentativeFrames` を確認できる。
- Step 2-E として確定済み代表フレームから front / left / right / up / down の 3D推測用データセットを作成し、readiness summary、dataset 一覧、JSON preview の `idealLandmarks3DInferenceDataset` 概要を確認できる。
- Step 2-F として候補抽出用の詳細スキャン、詳細スキャン summary、JSON preview の `scanSummary`、トリムしないサムネイル表示を確認できる。
- 現段階の `natural_v1` の controlPoints は投影検証用の暫定データであり、IdealFace 本体ではない。
- IdealFace 本体は `idealLandmarks3D` 478 点を中核に持つ asset として扱う。
- 2D 動画 / 複数画像からのオフライン生成を Runtime と分離して扱える。
- Runtime で読み込む IdealFace asset を出力できる。

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

## 18. IdealFace Authoring Tool Step 1

状態: 実装済み

`tools/ideal-face-authoring` を、BAE AR 独自の IdealFace asset を作るための独立ツールとして追加しました。`apps/studio` は Runtime 検証用、`tools/ideal-face-authoring` は IdealFace asset 作成用として分離します。

Step 1 の実装範囲:

- Engine Runtime の公開 export から `natural_v1` を読み込む
- preset id / name / version / coordinateSpace / control point count を表示する
- controlPoints の id / label / x / y / z を一覧表示する
- x / y を使って controlPoints を 2D preview に点として表示する
- 読み込んだ IdealFace asset を JSON preview として表示する

未実装:

- controlPoints のドラッグ編集
- 手動ラベル確定 UI
- 3D 478点候補の自動推測
- 3D点群 preview
- 手動微調整
- 保存 / export
- 複数画像入力

IdealFace Authoring Tool は MediaPipe canonical face model そのものを作るツールではありません。BAE AR 独自の IdealFace asset を作る作業場です。Authoring Tool の編集処理や UI は Engine Runtime に混ぜません。

## 18-A. IdealFace Authoring Tool Step 2-A

状態: 実装済み

Step 2-A の実装範囲:

- MP4 動画ファイルの選択
- 選択した MP4 の `<video>` / Object URL 読み込み
- `duration` / `videoWidth` / `videoHeight` の表示
- 1秒ごと、または最大 20 フレーム程度に抑えた canvas へのフレーム抽出
- サムネイル一覧での frame index / timestamp / 状態「未解析」の表示
- JSON preview での file name / duration / videoWidth / videoHeight / extracted frame count / frames の表示

Step 2-A 時点の制限:

- 初期対応は MP4 動画のみ
- 複数画像入力は未実装 / 将来対応
- MediaPipe によるフレームごとの 2D 478 landmarks 取得は未実装
- FacePose 取得は未実装
- 代表フレーム候補抽出は未実装
- 手動ラベル確定 UI は未実装
- 3D 478点候補の自動推測は未実装
- 3D点群 preview、手動微調整、保存 / export は未実装

動画入力とフレーム抽出は IdealFace Authoring Tool の責務です。Engine Runtime には動画入力処理やフレーム抽出処理を入れません。

## 18-B. IdealFace Authoring Tool Step 2-B

状態: 実装済み

Step 2-B の実装範囲:

- 抽出済みフレームへの MediaPipe Face Landmarker 解析
- 2D 478 landmarks と FacePose の取得
- フレームごとの解析状態、landmarks 数、pose pitch / yaw / roll 表示
- 解析結果 summary での解析済み数、顔検出あり / なし、解析エラー数、yaw / pitch / roll 範囲表示
- JSON preview での解析概要、pose preview、先頭 5 点までの `landmarkPreview` 表示

Step 2-B の制限:

- 手動ラベル確定 UI は未実装
- 3D 478点候補の自動推測は未実装
- 3D点群 preview、手動微調整、保存 / export は未実装
- 複数画像入力は未実装 / 将来対応
- JSON preview には 478 landmarks 全文を出さない

動画入力、フレーム抽出、Authoring 用フレーム解析は IdealFace Authoring Tool の責務です。Engine Runtime にはこれらの処理や Authoring UI を入れません。

## 18-C. IdealFace Authoring Tool Step 2-C

状態: 実装済み

Step 2-C の実装範囲:

- 顔検出あり、landmarks 数 478、pose pitch / yaw / roll 取得済みの解析済みフレームだけを候補評価に使う
- yaw / pitch / roll から正面候補、yaw 正方向候補、yaw 負方向候補、pitch 正方向候補、pitch 負方向候補を各カテゴリ上位複数件抽出する
- 候補一覧にサムネイル、順位、frame index、timestamp、yaw / pitch / roll、score、landmarks 数を表示する
- 候補がない場合に「候補なし」と表示する
- 解析 summary を代表フレーム候補の近くに表示する
- 代表フレーム候補を主表示にし、抽出フレーム一覧を debug / 折りたたみ表示として扱う
- JSON preview に `representativeFrameCandidates` としてカテゴリごとの候補配列を表示する
- JSON preview には 478 landmarks 全文やサムネイル data URL 全文を出さない

Step 2-C の制限:

- 3D 478点候補の自動推測は未実装
- 3D点群 preview、手動微調整、保存 / export は未実装
- 複数画像入力は未実装 / 将来対応

将来的に解析対象フレームが増えても、ユーザーには抽出フレーム一覧ではなく代表フレーム候補を中心に見せます。代表フレーム抽出処理と Authoring 用 UI は IdealFace Authoring Tool の責務です。Engine Runtime には動画入力、フレーム抽出、Authoring 用フレーム解析、代表フレーム抽出処理、抽出フレーム一覧 UI、代表フレーム表示 UI を入れません。

## 18-D. IdealFace Authoring Tool Step 2-D

状態: 実装済み

Step 2-D の実装範囲:

- 候補カードから正面 / 左向き / 右向き / 上向き / 下向き / 除外を選択できる
- 正面候補、yaw 正方向候補、yaw 負方向候補、pitch 正方向候補、pitch 負方向候補をカテゴリごとに開閉できる
- 開いたカテゴリだけ候補カードを表示し、候補件数を表示する
- 正面 / 左向き / 右向き / 上向き / 下向きは各 1 件を確定し、同じラベルに別候補を選ぶと上書きできる
- 除外フレームは複数件確定でき、状態や JSON preview / debug 情報として保持できる
- 確定済み代表フレーム一覧では正面 / 左向き / 右向き / 上向き / 下向きだけを表示する
- 除外は代表フレームではないため、確定済み代表フレーム一覧には表示しない
- 確定済み代表フレームを解除できる
- 3D推測準備状況として正面 / 左向き / 右向き / 上向き / 下向きの選択状態だけを表示する
- JSON preview に `selectedRepresentativeFrames` を表示する
- `representativeFrameCandidates` は引き続き JSON preview に表示する
- JSON preview に 478 landmarks 全文やサムネイル data URL 全文を出さない

Step 2-D の制限:

- 3D 478点候補の自動推測は未実装
- 3D点群 preview、手動微調整、保存 / export は未実装
- 複数画像入力は未実装 / 将来対応

手動ラベル確定 UI は IdealFace Authoring Tool の責務です。Engine Runtime には動画入力、フレーム抽出、Authoring 用フレーム解析、代表フレーム抽出、手動ラベル確定 UI を入れません。Beauty Studio にも Authoring 用タブは追加しません。

## 18-E. IdealFace Authoring Tool Step 2-E

状態: 実装済み

Step 2-E の実装範囲:

- 確定済み代表フレームから 3D推測用データセットを作成できる
- front / left / right / up / down を dataset 対象にする
- excluded は 3D推測用データセットに含めない
- 未選択ラベルは `missing`、対応する解析済みフレームがない場合は `invalid`、2D 478 landmarks と FacePose が揃う場合は `ready` として扱う
- 3D推測用データセットの readiness summary と ready 数を表示する
- dataset entry に label / frame index / timestamp / pose / landmarks 数 / status / 先頭数点の landmark preview を表示する
- JSON preview に `idealLandmarks3DInferenceDataset` の概要を表示する
- JSON preview に 478 landmarks 全文やサムネイル data URL 全文を出さない

Step 2-E の dataset は、3D の `idealLandmarks3D` 478点候補を推測するための入力データセットです。代表フレームに対応する 2D 478 landmarks と FacePose を持ちますが、まだ `idealLandmarks3D` 478点そのものではありません。

Step 2-E の制限:

- 3D 478点候補の自動推測は未実装
- 3D点群 preview、手動微調整、保存 / export は未実装
- 複数画像入力は未実装 / 将来対応

dataset 作成処理は IdealFace Authoring Tool の責務です。Engine Runtime には動画入力、フレーム抽出、Authoring 用フレーム解析、代表フレーム抽出、手動ラベル確定 UI、dataset 作成処理を入れません。Beauty Studio にも Authoring 用タブは追加しません。

## 18-F. IdealFace Authoring Tool Step 2-F

状態: 実装済み

Step 2-F の実装範囲:

- 表示用抽出フレームとは別に、候補抽出用として MP4 動画全体を 0.25 秒間隔、最大 120 フレーム程度まで詳細スキャンする
- 詳細スキャン済みフレームのうち、顔検出あり、landmarks 数 478、FacePose 取得済みのフレームだけを候補評価に使う
- yaw / pitch / roll から正面候補、yaw 正方向候補、yaw 負方向候補、pitch 正方向候補、pitch 負方向候補を各カテゴリ上位複数件表示する
- 全スキャンフレーム一覧は UI に表示せず、代表フレーム候補中心に表示する
- 候補に採用されたフレームは、サムネイル、frame index、timestamp、pose、2D 478 landmarks、landmark preview を保持し、手動確定と 3D推測用 dataset 作成に使う
- 詳細スキャン summary と JSON preview の `scanSummary` を表示する
- JSON preview には詳細スキャン全フレームの 478 landmarks 全文やサムネイル data URL 全文を出さない
- 候補カード、確定済み代表フレーム、dataset entry のサムネイルをトリムせず全体表示する

Step 2-F の制限:

- 3D 478点候補の自動推測は未実装
- 3D点群 preview、手動微調整、保存 / export は未実装
- 複数画像入力は未実装 / 将来対応

詳細スキャン処理は IdealFace Authoring Tool の責務です。Engine Runtime には動画入力、フレーム抽出、詳細スキャン、Authoring 用フレーム解析、代表フレーム抽出、手動ラベル確定 UI、dataset 作成処理を入れません。Beauty Studio にも Authoring 用タブは追加しません。

## 19. IdealFace / Projection / Shape Processing 中核仕様

BAE AR の shape processing では、IdealFace は 3D の `idealLandmarks3D` 478 点を本体とします。理想 3D 顔プリセットとしての IdealFace は、`idealLandmarks3D` 478 点を中核に持つ asset です。IdealFace は正面固定の 2D landmarks だけを持つものではありません。

Runtime は、その 3D ideal landmarks を現在顔の `FacePose` へ投影し、2D の projected ideal 478 landmarks を生成します。正面 2D の 478 点だけでは顔の角度変化に追随できないため、顔の角度変化への対応は IdealFace の 3D landmarks を `FacePose` へ投影することで行います。

Shape Processing は、MediaPipe Face Landmarker がカメラ映像から取得した current 478 landmarks と、IdealFace 由来の projected ideal 478 landmarks の差分を見ます。この差分をもとに、将来 `CorrectionPlan` / Shape Warp へ進みます。

現在の `natural_v1` の 6 点 controlPoints は、現段階の投影検証用データです。Projection の流れを確認するための暫定データであり、IdealFace 本体ではありません。

```text
IdealFace
  = idealLandmarks3D: 478点を持つ

Runtime
  = idealLandmarks3D を現在 FacePose へ投影する
  = projected idealLandmarks2D: 478点を生成する

Shape Processing
  = current 478 landmarks と projected ideal 478 landmarks の差分を見る
  = 差分をもとに CorrectionPlan / Shape Warp へ進む
```

`CorrectionPlan` は姿勢補正を担当しません。Projection 後の ideal 2D landmarks は、すでに現在姿勢を反映しているものとして扱います。
