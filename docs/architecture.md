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

現在 `tools/ideal-face-authoring` は Step 2-I-B まで実装済みです。`tools/layer-mask-authoring` は将来予定です。

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

IdealFace Authoring Tool は、将来的に動画または複数画像を入力として受け取り、MediaPipe Face Landmarker で各フレームの 2D 478 landmarks と `FacePose` を取得します。初期入力形式は MP4 動画のみとし、複数画像入力は将来対応とします。初期段階では入力形式を広げず、代表フレーム抽出とラベル確定の流れを優先します。

Step 2-A では、MP4 動画入力と一定間隔でのフレーム抽出、サムネイル一覧表示までを実装済みです。Step 2-B では、抽出済みフレームに MediaPipe Face Landmarker 解析を実行し、2D 478 landmarks と FacePose を取得できるようにしました。Step 2-C では、解析済みフレームの yaw / pitch / roll から代表フレーム候補を自動抽出し、各カテゴリ上位複数件の候補一覧と JSON preview に候補概要を表示できるようにしました。Step 2-D では、候補カードから正面 / 左向き / 右向き / 上向き / 下向き / 除外を手動確定し、候補カテゴリを必要なものだけ開くトグル表示、確定済み代表フレーム一覧、3D推測準備状況、JSON preview の `selectedRepresentativeFrames` を確認できるようにしました。Step 2-E では、確定済み代表フレームから front / left / right / up / down の 3D推測用データセットを作成し、readiness summary、dataset 一覧、JSON preview の `idealLandmarks3DInferenceDataset` 概要を確認できるようにしました。Step 2-F では、表示用抽出とは別に候補抽出用の詳細スキャンを追加し、詳細スキャン summary と JSON preview の `scanSummary` を確認できるようにしました。Step 2-G では、3D推測用データセットから `idealLandmarks3D` 478点候補を自動推測する v1 を追加し、生成結果 summary と先頭 5 点程度の preview、JSON preview の `idealLandmarks3DCandidate` 概要を確認できるようにしました。Step 2-H では、生成済みの 3D 478点候補を 1 つの canvas で確認する interactive 3D点群 preview と、正面 / 横 / 上の camera preset、x / y / z 範囲、confidence summary を追加しました。Step 2-I-B では、pose-aware multi-frame inference dataset の summary と JSON preview の `poseAwareInferenceDataset` 概要を追加しました。preview は確認用表示であり、視点回転、zoom、pan は preview camera の操作として扱い、候補データ自体は変更しません。確定済み代表フレーム一覧と3D推測用データセットには、正面 / 左向き / 右向き / 上向き / 下向きだけを表示します。

Step 2-I-A は実装済みの UI / state 基盤です。Step 2-G v1 は、front の 2D landmarks を x / y 基準にし、left / right / up / down との差分から z を簡易推定する現在実装済みの方式として残します。Step 2-I-B では、5ポーズ固定の代表フレーム方式から次へ進むため、正面基準候補、推定に使うフレーム、除外フレームから pose-aware multi-frame inference dataset を作成します。

Step 2-F 以降の代表フレーム候補抽出では、表示用の最大20件程度の抽出フレームだけではなく、動画全体を 0.1 秒間隔、最大スキャン数の上限付きで詳細スキャンします。顔検出あり、landmarks 数 478、pose pitch / yaw / roll 取得済みの詳細スキャンフレームだけを候補評価に使います。正面候補、yaw 正方向候補、yaw 負方向候補、pitch 正方向候補、pitch 負方向候補は上位少数件だけに絞らず、条件に合うものをカテゴリごとに保持・表示します。左右・上下の最終ラベルは手動確定 UI で扱います。全スキャンフレーム一覧は UI に表示せず、候補に採用されたフレームだけを手動確定と dataset 作成に使えるよう保持します。サムネイルはトリムせず、画像全体が見えるように表示します。

候補 1 件だけでは確定せず、カテゴリ内の複数候補を比較して手動確定します。Step 2-D ではユーザーが Authoring Tool 上で正面 / 左向き / 右向き / 上向き / 下向き / 除外を手動確定します。Step 2-E では、除外を dataset に含めず、front / left / right / up / down の各ラベルについて未選択を `missing`、対応する解析済みフレームがない状態を `invalid`、2D 478 landmarks と FacePose が揃う状態を `ready` として扱います。この dataset は 3D の `idealLandmarks3D` 478点候補を推測するための入力であり、まだ `idealLandmarks3D` 478点そのものではありません。Step 2-G v1 では、front が ready であることを最重要条件とし、front の 2D 478 landmarks を x / y の基準にします。z は left / right / up / down の代表フレームとの差分から簡易推定します。左右 / 上下の代表フレームが不足している場合でも front があれば候補を生成しますが、不足ラベルは confidence に反映します。この生成結果は完成済み IdealFace asset ではなく候補データです。Step 2-H では、この候補を debug / 確認用の interactive 3D点群 preview として表示します。1 つの canvas 上で preview camera を操作し、ドラッグで視点回転、ホイールで zoom、Shift + ドラッグで pan できます。正面 / 横 / 上は camera preset です。これは表示専用であり、`idealLandmarks3D` 候補データや JSON preview の数値は変更しません。手動微調整、保存 / export はまだ未実装です。

Step 2-I-A のフレーム解析結果欄は、「正面基準候補」「推定に使うフレーム」「除外フレーム」の 3 分類にします。正面基準候補は `frontReferenceFrames` として、`idealLandmarks3D` の x / y 基準を作るために複数選択できる front reference frames です。推定に使うフレームは `usableObservationFrames` として、除外されておらず、解析成功し、landmarks 478点と `FacePose` があるフレームから派生します。除外フレームは `excludedFrames` として、ブレ、表情崩れ、口開き、顔切れ、検出崩れ、極端な roll などにより 3D 推定に使わないフレームです。Step 2-I 用操作は Step 2-I カード内に閉じ、旧ポーズ別候補 UI には混ぜません。推定に使うフレームは summary だけで終わらせず、全件に対して正面基準追加や除外を操作できるようにします。画面上の分類は排他的にし、正面基準候補に追加したフレームは推定に使うフレーム一覧から外します。

Step 2-I 以降では、`left / right / up / down` をユーザーが必ず手動指定する方式にはしません。yaw が大きいフレームは左右方向の奥行き推定に、pitch が大きいフレームは上下方向の奥行き推定に寄与しやすいものとして、`FacePose` の yaw / pitch / roll と score に応じて observation の重みを決める方針です。roll が大きすぎるフレームや score が低いフレームは重みを下げます。最初の Step 2-I v1 では、厳密な 3D reconstruction、三角測量、bundle adjustment、カメラ内部パラメータ推定、本格 3D editor、手動微調整、保存 / export、Runtime への組み込みは行いません。

Step 2-I-B は実装済みです。`frontReferenceFrames` は正面基準候補から作り、`observationFrames` は除外されていない解析成功フレームから作ります。各 frame は 2D landmarks、FacePose yaw / pitch / roll、score、poseStrength、weight を持つ observation として扱い、`left / right / up / down` は dataset の主構造にしません。現時点では dataset 作成と確認用 summary / JSON preview までで、`idealLandmarks3D` 新生成ロジックには接続しません。

Step 2-I-C は Step 2-I-B の dataset を使う pose-aware weighted z inference v1 として予定します。yaw / pitch は連続値として扱い、yaw も pitch も大きいフレームは単一カテゴリに押し込まず mixed pose observation として利用します。yaw 成分は左右方向の奥行き推定に、pitch 成分は上下方向の奥行き推定に寄与し、roll が大きすぎる、score が低い、表情崩れやブレがある observation は weight を下げる、または除外対象とします。

推奨する MP4 動画は、H.264 / AVC codec、5〜15秒程度、30fps程度、720p程度から開始できるものです。顔が大きく写り、正面、左向き、右向き、上向き、下向きをゆっくり含み、手ブレが少なく、明るい場所で撮影されていることを推奨します。口は閉じ気味、表情はできるだけ neutral とします。

初期段階では、長時間動画、高解像度すぎる動画、HEVC / H.265、MOV、WebM、複数画像入力は非推奨または未対応です。これらは将来対応を検討します。

Engine Runtime は動画入力、フレーム抽出、代表フレーム抽出、手動ラベル確定、3D推測用 dataset 作成、`idealLandmarks3D` 候補生成、`idealLandmarks3D` 作成を行いません。Runtime は完成済みの IdealFace asset を読み込み、`idealLandmarks3D` 478点を現在 `FacePose` へ投影して projected ideal 2D landmarks 478点を生成します。

Step 2-I-A では、`frontReferenceFrameIds` / `excludedFrameIds` と派生 `usableObservationFrames` summary、JSON preview の `poseAwareMultiFrameInference` 概要までを追加済みです。Step 2-I-B では、`poseAwareInferenceDataset` 概要を追加済みです。Step 2-I 用操作は Step 2-I カード内に閉じ、旧ポーズ別候補 UI には混ぜません。画面上の 3 分類は排他的に表示します。pose-aware 3D候補生成ロジックはまだ実装せず、Step 2-G v1 の候補生成と Step 2-H preview は従来どおりです。

旧 Step 2-F / Step 2-G v1 用の候補 UI は、代表フレーム候補中心に表示します。一方、Step 2-I 用 UI は除外判断のため、推定に使うフレームを全件操作可能にします。いずれも IdealFace Authoring Tool の責務であり、`packages/engine/src` や `apps/studio/src` には authoring 用処理や UI を入れません。

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
- IdealFace Authoring Tool は Step 2-I-B まで実装済み
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

## IdealFace Authoring Tool Step 2-F 改良

`tools/ideal-face-authoring` の Step 2-F は、代表フレーム候補抽出用の詳細スキャンを `0.1` 秒間隔で行います。最大スキャン数の上限を残し、長い動画で無制限に解析しない構成にします。

候補抽出は、解析できたフレームを `front` / `yawPositive` / `yawNegative` / `pitchPositive` / `pitchNegative` のカテゴリへ振り分ける方式です。候補は上位少数件だけに絞らず、カテゴリごとの保持上限の範囲で残します。UI は候補カテゴリトグル内に候補を表示し、候補カードでは順位ではなく `score` を表示します。

候補に入れる条件は緩め、pitch / yaw の片方に多少のズレがあっても候補として拾います。除外された候補は UI 候補一覧から外し、状態 / JSON preview には `selectedRepresentativeFrames.excluded` として残せます。ただし、除外候補は確定済み代表フレーム一覧、3D推測準備状況、`idealLandmarks3DInferenceDataset` には含めません。

3D点群 preview は Step 2-H で追加済みです。手動微調整、保存 / export、複数画像入力はまだ実装しません。詳細スキャン、候補振り分け、手動ラベル確定、dataset 作成、3D候補生成、3D点群 preview は IdealFace Authoring Tool の責務であり、Engine Runtime や Beauty Studio へ Authoring 用処理を入れません。

## IdealFace Authoring Tool Step 1

`tools/ideal-face-authoring` は、BAE AR 独自の IdealFace asset を作るための独立した authoring tool です。Beauty Studio は Runtime 検証用、IdealFace Authoring Tool は asset 作成用として分離します。

Step 1 では Runtime の公開 API から `natural_v1` を読み込み、metadata、`coordinateSpace`、controlPoints 一覧、2D preview、JSON preview を表示するだけに留めています。Studio へのタブ追加、Engine Runtime への UI 追加、Runtime への編集処理追加は行いません。

Step 1 時点では未実装で、現在は後続 Step で実装済みになった範囲:

- MediaPipe によるフレームごとの 2D 478 landmarks 取得
- FacePose 取得
- yaw / pitch / roll による代表フレーム候補の自動抽出
- 手動ラベル確定 UI
- 3D 478点候補の自動推測
- 3D点群 preview

現在も未実装の範囲:

- 本格 3D editor / 手動微調整
- 保存 / export
- 複数画像入力

IdealFace Authoring Tool は MediaPipe canonical face model そのものを作るツールではありません。BAE AR 独自の IdealFace asset を作る作業場として扱います。

## IdealFace Authoring Tool Step 2-A

Step 2-A では、`tools/ideal-face-authoring` に MP4 動画入力とフレーム抽出の最小実装を追加しました。

実装済みの範囲:

- MP4 動画ファイルの選択
- 選択した MP4 の `<video>` / Object URL 読み込み
- `duration` / `videoWidth` / `videoHeight` の metadata 表示
- 1秒ごと、または最大 20 フレーム程度に抑えた canvas 抽出
- サムネイル一覧での frame index / timestamp / 状態「未解析」の表示
- JSON preview での動画情報と抽出フレーム情報の表示

Step 2-A 時点では未実装で、現在は後続 Step で実装済みになった範囲:

- MediaPipe によるフレームごとの 2D 478 landmarks 取得
- FacePose 取得
- 代表フレーム候補の自動抽出
- 手動ラベル確定 UI
- 3D 478点候補の自動推測
- 3D点群 preview

現在も未実装の範囲:

- 手動微調整
- 保存 / export
- 複数画像入力
- 手動微調整
- 保存 / export

動画入力やフレーム抽出処理は Authoring Tool の責務です。Engine Runtime には動画入力やフレーム抽出処理を追加しません。

## IdealFace Authoring Tool Step 2-B

Step 2-B では、`tools/ideal-face-authoring` に抽出済みフレームの MediaPipe Face Landmarker 解析を追加しました。

実装済みの範囲:

- 抽出済みフレームへの MediaPipe 解析実行
- 2D 478 landmarks と FacePose の取得
- フレームごとの解析状態、landmarks 数、pose pitch / yaw / roll 表示
- 解析結果 summary での解析済み数、顔検出あり / なし、解析エラー数、yaw / pitch / roll 範囲表示
- JSON preview での解析概要と先頭 5 点までの `landmarkPreview` 表示

Step 2-B 時点では未実装で、現在は後続 Step で実装済みになった範囲:

- 手動ラベル確定 UI
- 3D 478点候補の自動推測
- 3D点群 preview

現在も未実装の範囲:

- 手動微調整
- 保存 / export
- 複数画像入力

Authoring 用フレーム解析は IdealFace Authoring Tool の責務です。Engine Runtime には動画入力、フレーム抽出、Authoring 用フレーム解析処理を追加しません。

## IdealFace Authoring Tool Step 2-C

Step 2-C では、`tools/ideal-face-authoring` に解析済みフレームから代表フレーム候補を自動抽出し、各カテゴリ上位複数件を比較できる実装を追加しました。Step 2-C UI 整理では、代表フレーム候補を主表示にし、抽出フレーム一覧は debug / 折りたたみ表示にしました。

実装済みの範囲:

- 顔検出あり、landmarks 数 478、pose pitch / yaw / roll 取得済みの解析済みフレームだけを候補評価に使う
- yaw / pitch / roll から正面候補、yaw 正方向候補、yaw 負方向候補、pitch 正方向候補、pitch 負方向候補を各カテゴリ上位複数件抽出する
- 候補一覧にサムネイル、frame index、timestamp、yaw / pitch / roll、score、landmarks 数を表示する
- 候補が見つからない枠には「候補なし」と表示する
- 解析 summary を代表フレーム候補の近くに表示する
- 抽出フレーム一覧を初期状態では閉じ、debug / 確認用として開けるようにする
- JSON preview に `representativeFrameCandidates` としてカテゴリごとの候補配列を表示する
- JSON preview には 478 landmarks 全文やサムネイル data URL 全文を出さない

Step 2-C 時点では未実装で、現在は後続 Step で実装済みになった範囲:

- 手動ラベル確定 UI
- 3D 478点候補の自動推測
- 3D点群 preview

現在も未実装の範囲:

- 手動微調整
- 保存 / export
- 複数画像入力

将来的に解析対象フレームが増えても、ユーザーには代表フレーム候補を中心に見せます。代表フレーム抽出処理と Authoring 用 UI は IdealFace Authoring Tool の責務です。Engine Runtime には動画入力、フレーム抽出、Authoring 用フレーム解析、代表フレーム抽出処理、抽出フレーム一覧 UI、代表フレーム表示 UI を追加しません。

## IdealFace Authoring Tool Step 2-D

Step 2-D では、`tools/ideal-face-authoring` に代表フレーム候補から最終ラベルを手動確定する UI を追加しました。Step 2-D UI整理では、代表フレーム候補カテゴリをトグル表示にし、必要なカテゴリだけを開いて確認する構成にしました。

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

Step 2-D 時点では未実装で、現在は後続 Step で実装済みになった範囲:

- 3D 478点候補の自動推測
- 3D点群 preview

現在も未実装の範囲:

- 手動微調整
- 保存 / export
- 複数画像入力

## IdealFace Authoring Tool Step 2-E

Step 2-E では、`tools/ideal-face-authoring` に確定済み代表フレームから 3D推測用データセットを作成する最小実装を追加しました。

Step 2-E の実装範囲:

- front / left / right / up / down の確定済み代表フレームを dataset 対象にする
- excluded は 3D推測用データセットに含めない
- 未選択ラベルを `missing`、対応する解析済みフレームがない状態を `invalid`、2D 478 landmarks と FacePose が揃う状態を `ready` として扱う
- 3D推測用データセットの readiness summary と ready 数を表示する
- dataset entry に label / frame index / timestamp / pose / landmarks 数 / status / 先頭数点の landmark preview を表示する
- JSON preview に `idealLandmarks3DInferenceDataset` の概要を表示する
- JSON preview に 478 landmarks 全文やサムネイル data URL 全文を出さない

Step 2-E の dataset は 3D の `idealLandmarks3D` 478点候補を推測するための入力データセットです。まだ `idealLandmarks3D` 478点そのものではありません。

Step 2-E 時点では未実装で、現在は後続 Step で実装済みになった範囲:

- 3D 478点候補の自動推測
- 3D点群 preview

現在も未実装の範囲:

- 手動微調整
- 保存 / export
- 複数画像入力

## IdealFace Authoring Tool Step 2-F

Step 2-F では、`tools/ideal-face-authoring` に代表フレーム候補抽出用の詳細スキャンを追加しました。

Step 2-F の実装範囲:

- 表示用抽出フレームとは別に、候補抽出用として動画全体を 0.1 秒間隔、最大スキャン数の上限付きで詳細スキャンする
- 詳細スキャン済みフレームのうち、顔検出あり、landmarks 数 478、FacePose 取得済みのフレームを候補評価に使う
- yaw / pitch / roll から正面候補、yaw 正方向候補、yaw 負方向候補、pitch 正方向候補、pitch 負方向候補を各カテゴリに複数件保持・表示する
- 全スキャンフレーム一覧は UI に表示せず、代表フレーム候補中心に表示する
- 候補に採用されたフレームは、サムネイル、frame index、timestamp、pose、2D 478 landmarks、landmark preview を保持し、手動確定と 3D推測用 dataset 作成に使う
- 詳細スキャン summary と JSON preview の `scanSummary` を表示する
- 候補カード、確定済み代表フレーム、dataset entry のサムネイルをトリムせず全体表示する

Step 2-F 時点では未実装で、現在は後続 Step で実装済みになった範囲:

- 3D 478点候補の自動推測
- 3D点群 preview

現在も未実装の範囲:

- 手動微調整
- 保存 / export
- 複数画像入力

詳細スキャン処理は IdealFace Authoring Tool の責務です。Engine Runtime には動画入力、フレーム抽出、詳細スキャン、Authoring 用フレーム解析、代表フレーム抽出、手動ラベル確定、dataset 作成処理を入れません。Beauty Studio にも Authoring 用タブは追加しません。

手動ラベル確定 UI は IdealFace Authoring Tool の責務です。Engine Runtime には動画入力、フレーム抽出、Authoring 用フレーム解析、代表フレーム抽出、手動ラベル確定 UI を追加しません。Beauty Studio にも Authoring 用タブは追加しません。

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
