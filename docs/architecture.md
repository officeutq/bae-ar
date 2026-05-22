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
│  └─ 将来予定。IdealFace を作成する authoring tool
│
└─ tools/layer-mask-authoring
   └─ 将来予定。LayerMaskSpec を作成する authoring tool
```

現在 `tools/*` は未実装です。

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
- IdealFace Projection v1 の controlPoints 投影
- Projection Difference Debug v1

将来予定:

- ideal 478 landmarks 生成
- CorrectionPlan 生成
- Shape Warp
- Color Processing
- Layer System
- LayerMaskSpec の読み込み
- rendering / runtime quality control

Engine Runtime は定義済みの IdealFace / LayerMaskSpec を読み込んで使います。IdealFace の作成、2D 動画からの 3D 顔生成、LayerMaskSpec の作成、mask の手作業編集、Studio / Authoring 用 UI は Runtime に含めません。

## Beauty Studio の責務

Beauty Studio は Engine Runtime を開発・検証・調整するための開発ツールです。

現在実装済み:

- `CameraService` によるカメラ映像取得
- `HTMLVideoElement` を `BeautyEngine.setInput()` へ渡す接続
- `MediaPipeFaceDetector` の初期化と Engine への設定
- Engine 状態、カメラ状態、検出状態、FaceFrame、FaceGeometry、MediaPipe debug の表示
- landmarks / geometry point / projected IdealFace controlPoints / difference line overlay
- Copy Debug 用の debug text 生成

Studio は Engine Runtime の公開 API のみを利用します。Engine の private field や内部実装ファイルへ直接依存しません。

## IdealFace Authoring Tool の責務

IdealFace Authoring Tool は将来予定です。

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

IdealFace Authoring Tool は、将来的に動画または複数画像を入力として受け取り、MediaPipe Face Landmarker で各フレームの 2D 478 landmarks と `FacePose` を取得します。初期入力形式は MP4 動画のみとし、複数画像入力は将来対応とします。初期段階では入力形式を広げず、代表フレーム抽出とラベル確定の流れを優先します。

初期実装では、MP4 動画から一定間隔でフレームを抽出し、取得した yaw / pitch / roll を使って正面候補、左向き候補、右向き候補、上向き候補、下向き候補を自動抽出します。

自動抽出だけでは確定せず、ユーザーが Authoring Tool 上で正面 / 左向き / 右向き / 上向き / 下向き / 除外を手動確定します。確定した代表フレーム群から 3D の `idealLandmarks3D` 478点候補を自動推測し、Authoring Tool 上で確認、必要箇所を手動微調整したうえで IdealFace asset として保存 / export します。

推奨する MP4 動画は、H.264 / AVC codec、5〜15秒程度、30fps程度、720p程度から開始できるものです。顔が大きく写り、正面、左向き、右向き、上向き、下向きをゆっくり含み、手ブレが少なく、明るい場所で撮影されていることを推奨します。口は閉じ気味、表情はできるだけ neutral とします。

初期段階では、長時間動画、高解像度すぎる動画、HEVC / H.265、MOV、WebM、複数画像入力は非推奨または未対応です。これらは将来対応を検討します。

Engine Runtime は動画入力、フレーム抽出、`idealLandmarks3D` 作成を行いません。Runtime は完成済みの IdealFace asset を読み込み、`idealLandmarks3D` 478点を現在 `FacePose` へ投影して projected ideal 2D landmarks 478点を生成します。

この段階では、代表フレーム抽出や 3D点群推測の詳細アルゴリズムは定義しません。

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

ただし、Engine Runtime で current face と比較するため、IdealFace から MediaPipe 478 landmarks と対応する ideal 478 landmarks を生成できる必要があります。

v1 の制限事項:

- 3D model は Projection の土台確認用の最小 control point 群
- ideal 478 landmarks の生成は未実装
- IdealFace Authoring Tool は未実装
- IdealFace Projection v1 は controlPoints のみ部分実装
- Projection Difference Debug v1 は代表点ベースの差分確認のみ実装

IdealFace Projection v1 の責務:

- FacePose を受け取る
- IdealFace の 3D controlPoints を現在姿勢へ回転する
- Studio overlay 用の projected 2D points を生成する
- FaceGeometry 代表点と projected IdealFace controlPoints の差分を debug 用に計算する

Projection Difference Debug v1 は、`faceCenter` / `leftEyeCenter` / `rightEyeCenter` / `noseTip` / `mouthCenter` / `chin` と、対応する projected IdealFace controlPoints の `deltaX` / `deltaY` / `distance` を計算します。平均差分、最大差分点、overlay 上の difference line は debug 用であり、CorrectionPlan ではありません。

現在は Perspective camera、face surface、mesh、renderer、ideal 478 landmarks 生成、CorrectionPlan、Shape Warp は未実装です。将来の完全版では、Projection 後の ideal 2D landmarks はすでに現在姿勢を反映します。

## CorrectionPlan

CorrectionPlan は姿勢補正を担当しません。姿勢への対応は IdealFace Projection の責務です。

CorrectionPlan の責務:

- current 2D landmarks と ideal 2D landmarks の差分を受け取る
- 実際に warp へ渡す安全な補正量を決める
- 補正強度、移動量上限、滑らかさ、過補正防止、信頼度などを扱う

CorrectionPlan は個別パーツ加工命令セットにはしません。

## Shape Processing

```text
現在顔から MediaPipe 478 landmarks を取得
  -> FacePose を推定
  -> IdealFace 3D model を現在姿勢へ投影
  -> ideal 2D landmarks 478 点を生成
  -> current 478 landmarks と ideal 478 landmarks の差分を取る
  -> CorrectionPlan を生成
  -> 顔全体として自然に少し warp
```

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

## 配布方針

本番配布対象は Engine Runtime のみです。

配布物に含めないもの:

- Beauty Studio
- IdealFace Authoring Tool
- Layer Mask Authoring Tool
- docs
- 開発用 debug UI
- サンプルや検証ツール

## IdealFace Authoring Tool Step 1

`tools/ideal-face-authoring` は、BAE AR 独自の IdealFace asset を作るための独立した authoring tool です。Beauty Studio は Runtime 検証用、IdealFace Authoring Tool は asset 作成用として分離します。

Step 1 では Runtime の公開 API から `natural_v1` を読み込み、metadata、`coordinateSpace`、controlPoints 一覧、2D preview、JSON preview を表示するだけに留めています。Studio へのタブ追加、Engine Runtime への UI 追加、Runtime への編集処理追加は行いません。

未実装の範囲:

- controlPoints のドラッグ編集
- MP4 動画入力
- フレーム抽出
- MediaPipe によるフレームごとの 2D 478 landmarks 取得
- yaw / pitch / roll による代表フレーム候補の自動抽出
- 手動ラベル確定 UI
- 3D 478点候補の自動推測
- 3D点群 preview
- 手動微調整
- 保存 / export
- 複数画像入力

IdealFace Authoring Tool は MediaPipe canonical face model そのものを作るツールではありません。BAE AR 独自の IdealFace asset を作る作業場として扱います。

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
