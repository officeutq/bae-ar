# BAE AR

BAE AR は、リアルタイム顔加工・AR 表現を行う Beauty Engine Runtime と、その開発・検証・調整を行う Beauty Studio、将来の authoring tool 群を含むプロジェクトです。

目的は、単なるフィルターではなく、本番サービスに組み込める自然で破綻しにくい Beauty Engine を育てることです。

## 全体構成

BAE AR は 4 領域に分けます。

```text
Engine Runtime
  本番でリアルタイム加工する中核 SDK
  UI を持たない
  実行専用

Beauty Studio
  Engine を開発・検証・調整する開発ツール
  Engine の公開 API のみを使う
  Engine 内部実装へ直接依存しない

IdealFace Authoring Tool
  理想 3D 顔プリセットを作成する authoring tool
  Step 2-I-A まで実装済み
  リアルタイム Engine Runtime には含めない

Layer Mask Authoring Tool
  色加工用 LayerMaskSpec を作成する将来ツール
  リアルタイム Engine Runtime には含めない
```

現在のリポジトリでは、`packages/engine`、`apps/studio`、`tools/ideal-face-authoring` が実装済み領域です。

```text
packages/engine
  Engine Runtime として使う Beauty Engine SDK

apps/studio
  Engine Runtime を開発・検証・調整する Beauty Studio

docs
  設計・仕様・ロードマップ

tools/ideal-face-authoring
  IdealFace Authoring Tool。Step 2-I-A まで実装済み
```

## 現在の実装状況

実装済み:

- `BeautyEngine` の基本ライフサイクル: `initialize()` / `start()` / `stop()` / `dispose()`
- 入力保持: `setInput()` / `getInput()`
- `FaceDetector` 差し替え: `setFaceDetector()` / `getFaceDetector()`
- `HTMLVideoElement` 入力に対する FaceFrame loop
- `MediaPipeFaceDetector` による MediaPipe Face Landmarker 接続
- `FaceFrame` の更新: `detected` / `timestamp` / `landmarks` / `blendshapes` / `pose`
- `FaceGeometry` の補助解析
- Studio 側のカメラ入力、debug 表示、landmark / geometry overlay
- FacePose の実推定
- IdealFace v1 型定義
- Natural v1 最小プリセット
- IdealFace 公開 API
- IdealFace Projection v1 の controlPoints 投影
- Projection Difference Debug v1
- Studio overlay / debug / Copy Debug 関連
- IdealFace Authoring Tool Step 1: `natural_v1` metadata / controlPoints / 2D preview / JSON preview
- IdealFace Authoring Tool Step 2-A: MP4 動画入力、metadata 表示、フレーム抽出、サムネイル一覧表示
- IdealFace Authoring Tool Step 2-B: 抽出フレームの MediaPipe 解析、2D 478 landmarks / FacePose 取得、解析 summary 表示
- IdealFace Authoring Tool Step 2-C: yaw / pitch / roll による代表フレーム候補の自動抽出、各カテゴリ上位複数件の候補一覧表示、代表フレーム候補中心の UI 整理、JSON preview への候補概要表示
- IdealFace Authoring Tool Step 2-D: 代表フレーム候補から正面 / 左向き / 右向き / 上向き / 下向き / 除外を手動確定する UI、候補カテゴリのトグル表示、正面 / 左向き / 右向き / 上向き / 下向きだけを表示する確定済み代表フレーム一覧と3D推測準備状況、JSON preview への `selectedRepresentativeFrames` 表示
- IdealFace Authoring Tool Step 2-E: 確定済み代表フレームから front / left / right / up / down の 3D推測用データセットを作成し、readiness summary、dataset 一覧、JSON preview の `idealLandmarks3DInferenceDataset` で概要を確認する表示
- IdealFace Authoring Tool Step 2-F: 候補抽出用に動画全体を詳細スキャンし、代表フレーム候補中心の UI と `scanSummary` 表示、サムネイル全体表示を追加
- IdealFace Authoring Tool Step 2-G: 3D推測用データセットから `idealLandmarks3D` 478点候補を自動推測する v1 を追加。front の 2D landmarks を x / y の基準にし、left / right / up / down との差分から z を簡易推定し、不足ラベルは confidence に反映します。結果は候補 summary と先頭 5 点 preview、JSON preview の `idealLandmarks3DCandidate` 概要で確認します
- IdealFace Authoring Tool Step 2-H: 生成済みの `idealLandmarks3D` 478点候補を 1 つの interactive 3D point cloud preview として表示し、ドラッグによる視点回転、ホイール zoom、Shift + ドラッグ pan、正面 / 横 / 上の camera preset、x / y / z 範囲、confidence summary を確認できます。preview camera の操作のみで、候補データ自体は変更しません
- IdealFace Authoring Tool Step 2-I-A: pose-aware multi-frame inference の UI / state 基盤として、正面基準候補、推定に使うフレーム、除外フレームの 3 分類表示、`frontReferenceFrameIds` / `excludedFrameIds`、派生 `usableObservationFrames` summary、JSON preview の `poseAwareMultiFrameInference` 概要を追加。Step 2-I 用操作は Step 2-I カード内に閉じ、旧ポーズ別候補 UI には混ぜません。画面上の 3 分類は排他的に表示します

未実装 / 将来予定:

- IdealFace Authoring Tool Step 2-I の pose-aware 3D候補生成ロジック
- IdealFace Authoring Tool の手動微調整
- IdealFace asset の保存 / export
- 複数画像入力
- 本格 3D editor
- 厳密な 3D reconstruction、三角測量、bundle adjustment、カメラ内部パラメータ推定
- Runtime 側の idealLandmarks3D 478点読み込み / 投影の完全対応
- current 478 landmarks と projected ideal 478 landmarks の本比較
- CorrectionPlan
- Shape Warp
- Color Processing
- Layer System
- LayerMaskSpec
- Layer Mask Authoring Tool
- Butterflyve integration
- 本番向け package build / test / lint script

IdealFace Projection v1 は controlPoints 投影の部分実装です。`natural_v1` の 6点 controlPoints は投影検証用の暫定データであり、IdealFace 本体である `idealLandmarks3D` 478点ではありません。

## 現在の処理パイプライン

現在実装済みのパイプラインは以下です。

```text
Camera input
  -> HTMLVideoElement
  -> BeautyEngine.setInput()
  -> MediaPipeFaceDetector
  -> FaceFrame loop
  -> FaceFrame 更新
  -> Studio debug / overlay
```

`FaceFrame` は MediaPipe 由来の現在フレームの生データです。`FaceGeometry` は debug / overlay / 顔サイズ確認 / 代表点確認などの補助情報であり、shape processing の中心ではありません。

## IdealFace と MediaPipe canonical face model

MediaPipe canonical face model は、MediaPipe 側が landmark 検出や face geometry のために使う標準顔モデル・基準顔です。BAE AR はその考え方を参考にする可能性はありますが、MediaPipe canonical face model そのものを作成・編集対象にはしません。

BAE AR の IdealFace は、BAE AR 独自の理想顔 canonical face / お面データです。MediaPipe 478 landmarks そのものでも、MediaPipe canonical face model そのものでもありません。MediaPipe は検出側の基準、BAE AR IdealFace は補正・比較側の基準として分けて扱います。

## Shape Processing 方針

shape processing は個別パーツ加工ではありません。

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

## IdealFace Authoring Tool Step 2-F / 2-G / 2-H

`tools/ideal-face-authoring` では Step 2-F 改良として、代表フレーム候補抽出用の詳細スキャンを `scanIntervalSec: 0.1` にしました。長い動画で無制限に解析しないよう、最大スキャン数の上限は維持しています。

候補選定では、上位少数件だけに絞らず、条件に合うフレームを `front` / `yawPositive` / `yawNegative` / `pitchPositive` / `pitchNegative` ごとに保持します。UI では候補カテゴリトグル内に候補を表示し、順位ではなく `score` を表示します。候補に入れるハードルは緩めており、pitch / yaw の片方に多少のズレがあっても候補として拾います。

候補カードで除外したフレームは候補 UI 一覧から外します。除外情報は `selectedRepresentativeFrames.excluded` として状態 / JSON preview に残してよいものとし、確定済み代表フレーム一覧、3D推測準備状況、`idealLandmarks3DInferenceDataset` には含めません。

Step 2-G では、`idealLandmarks3DInferenceDataset` の ready entry を使い、front / left / right / up / down の代表フレームから `idealLandmarks3D` 478点候補を生成する v1 を追加しました。これは厳密な 3D reconstruction ではなく、front の 2D 478 landmarks を x / y の基準にし、左右 / 上下フレームとの差分から z を仮推定する候補生成です。left / right / up / down が不足している場合も front が ready であれば生成しますが、不足ラベルは confidence に反映します。生成結果は完成済み IdealFace asset ではなく候補データです。

Step 2-H では、生成された `idealLandmarks3D` 478点候補を Authoring Tool 上の interactive 3D point cloud preview として表示します。preview は debug / 確認用であり、本格 3D editor ではありません。1 つの canvas 上で preview camera を操作し、ドラッグで視点回転、ホイールで zoom、Shift + ドラッグで pan できます。正面 / 横 / 上は固定ビューではなく同じ viewport の camera preset として扱います。表示上は y を反転して顔の上方向が画面上側に見えるようにし、奥行き確認のための z 表示倍率調整は preview 専用の変換として扱います。これらは preview camera / view transform の操作であり、生成済みの `idealLandmarks3D` 候補データや JSON preview の数値は変更しません。近くに landmark count、視点、x / y / z の min / max、average / min / max confidence を表示します。低 confidence の点は薄く表示します。JSON preview は引き続き `idealLandmarks3DCandidate` の概要と先頭 5 点程度の preview に留め、478点全文や canvas data URL は出しません。手動微調整、保存 / export、複数画像入力はまだ実装しません。詳細スキャン、候補振り分け、手動ラベル確定、dataset 作成、3D候補生成、3D点群 preview は IdealFace Authoring Tool の責務であり、Engine Runtime には入れません。

Step 2-I-A では、5ポーズ固定の代表フレーム方式から pose-aware multi-frame inference へ進むための UI / state 基盤を追加しました。Step 2-G v1 は実装済みの簡易推定として残し、Step 2-I の pose-aware 3D候補生成ロジックは未実装のままです。

Step 2-I のフレーム解析結果欄は、以下の 3 分類に整理します。

```text
正面基準候補
  idealLandmarks3D の x / y 基準を作るための front reference frames。
  ユーザーが複数選択できる。

推定に使うフレーム
  3D 推定に使う observation frames。
  除外されておらず、解析成功し、landmarks 478点と FacePose があるフレームを基本的に含める。
  yaw / pitch / roll などの pose 角度に応じて、3D 推定への寄与を重み付けする。

除外フレーム
  ブレ、表情崩れ、口開き、顔切れ、検出崩れ、極端な roll などにより、3D 推定に使わないフレーム。
```

内部説明では `frontReferenceFrames`、`usableObservationFrames`、`excludedFrames` という名前を使ってよいものとします。操作フローは、正面基準候補を複数選び、使いたくないフレームを除外し、除外されていない解析成功フレームを pose 角度に応じて observation として利用する流れです。`left / right / up / down` をユーザーが必ず手動指定する方式にはせず、将来的には FacePose の yaw / pitch から自動的に推定寄与を判断します。

## ドキュメント

- [概要](docs/overview.md)
- [アーキテクチャ](docs/architecture.md)
- [開発フロー](docs/development-flow.md)
- [リポジトリ構成](docs/repository-structure.md)
- [仕様書とロードマップ](docs/bae_ar_beauty_engine_spec_and_roadmap_2026_05.md)

## IdealFace Authoring Tool Step 1

`tools/ideal-face-authoring` を、BAE AR 独自の IdealFace asset を作るための独立ツールとして追加しました。Studio にタブは追加せず、Runtime 検証用の `apps/studio` と asset 作成用の authoring tool を分離しています。

Step 1 では Engine Runtime の公開 API から `natural_v1` を読み込み、metadata、`coordinateSpace`、controlPoints 一覧、2D preview、JSON preview を表示します。

Step 1 時点では未実装で、現在は後続 Step で実装済みになった範囲:

- 手動ラベル確定 UI
- 3D 478点候補の自動推測
- 3D点群 preview

現在も未実装の範囲:

- 本格 3D editor / 手動微調整
- 保存 / export
- 複数画像入力

IdealFace Authoring Tool は MediaPipe canonical face model そのものを作るツールではありません。BAE AR 独自の IdealFace asset を作る作業場として扱い、編集処理や UI を Engine Runtime に混ぜません。

## IdealFace Authoring Tool Step 2-A

`tools/ideal-face-authoring` に、MP4 動画入力とフレーム抽出の最小実装を追加しました。

Step 2-A でできること:

- MP4 動画ファイルを選択する
- 選択した MP4 をブラウザ上の `<video>` として読み込む
- `duration` / `videoWidth` / `videoHeight` を表示する
- 1秒ごと、または最大 20 フレーム程度に抑えてフレームを抽出する
- 抽出フレームをサムネイル一覧で確認する
- 各フレームに frame index / timestamp / 状態「未解析」を表示する
- JSON preview に動画情報と抽出フレーム情報を表示する

初期対応は MP4 動画のみです。複数画像入力は未実装で、将来対応とします。Step 2-B で MediaPipe による 2D 478 landmarks 取得と FacePose 取得、Step 2-C で代表フレーム候補抽出、Step 2-D で手動ラベル確定 UI、Step 2-E で3D推測用データセット作成、Step 2-F で候補抽出用の詳細スキャン、Step 2-G で3D 478点候補の自動推測 v1、Step 2-H で3D点群 preview まで追加済みです。手動微調整、保存 / export はまだ未実装です。

動画入力とフレーム抽出は IdealFace Authoring Tool の責務です。Engine Runtime には動画入力処理やフレーム抽出処理を入れません。

## IdealFace Authoring Tool Step 2-B

`tools/ideal-face-authoring` に、抽出済みフレームへ MediaPipe Face Landmarker 解析をかける最小実装を追加しました。

Step 2-B でできること:

- 抽出済みフレームに対して MediaPipe 解析を実行する
- 各フレームから 2D 478 landmarks と FacePose を取得する
- 各フレームに解析状態、landmarks 数、pose pitch / yaw / roll を表示する
- 解析結果 summary として解析済み数、顔検出あり / なし、解析エラー数、yaw / pitch / roll 範囲を表示する
- JSON preview に解析概要と先頭数点の `landmarkPreview` を表示する

JSON preview には 478 landmarks 全文は出しません。代表フレーム候補抽出は Step 2-C、手動ラベル確定 UI は Step 2-D、3D推測用データセット概要表示は Step 2-E、候補抽出用の詳細スキャンと `scanSummary` 表示は Step 2-F、3D候補生成 summary と `idealLandmarks3DCandidate` 概要表示は Step 2-G、3D点群 preview は Step 2-H で追加済みです。手動微調整、保存 / export はまだ未実装です。

MediaPipe による Authoring 用フレーム解析は IdealFace Authoring Tool の責務です。Engine Runtime には動画入力、フレーム抽出、Authoring 用フレーム解析処理を入れません。

## IdealFace Authoring Tool Step 2-C

`tools/ideal-face-authoring` に、解析済みフレームから代表フレーム候補を自動抽出し、各カテゴリの上位複数件を比較できる表示を追加しました。

Step 2-C でできること:

- 顔検出あり、landmarks 数 478 の解析済みフレームだけを候補評価に使う
- yaw / pitch / roll から正面候補、yaw 正方向候補、yaw 負方向候補、pitch 正方向候補、pitch 負方向候補を各カテゴリ上位複数件抽出する
- 候補一覧にサムネイル、frame index、timestamp、yaw / pitch / roll、score、landmarks 数を表示する
- 候補がない場合は「候補なし」と表示する
- 解析 summary を代表フレーム候補の近くに表示する
- 代表フレーム候補を主表示とし、抽出フレーム一覧は debug / 折りたたみ表示として扱う
- JSON preview に `representativeFrameCandidates` としてカテゴリごとの候補配列を表示する
- JSON preview には 478 landmarks 全文やサムネイル data URL 全文を出さない

将来的に解析対象フレームが増えても、ユーザーには全抽出フレーム一覧ではなく代表フレーム候補を中心に見せます。抽出フレーム一覧は debug / 確認用として折りたたみ表示に残します。

候補 1 件だけで確定せず、上位複数件を比較して手動ラベル確定 UI へ進む方針です。Step 2-D で手動ラベル確定 UI、Step 2-E で確定済み代表フレームからの3D推測用データセット作成、Step 2-F で候補抽出用の詳細スキャン、Step 2-G で3D 478点候補の自動推測 v1、Step 2-H で3D点群 preview まで追加済みです。手動微調整、保存 / export、複数画像入力はまだ未実装です。代表フレーム抽出処理と候補表示 UI、抽出フレーム一覧 UI、手動ラベル確定 UI、dataset 作成処理、3D候補生成処理、3D点群 preview は IdealFace Authoring Tool の責務であり、Engine Runtime には入れません。

## IdealFace Authoring Tool Step 2-D

`tools/ideal-face-authoring` に、代表フレーム候補から最終ラベルを手動確定する UI を追加しました。Step 2-D UI整理では、代表フレーム候補カテゴリをトグル表示にし、必要なカテゴリだけを開いて候補カードを確認する方針にしました。

Step 2-D でできること:

- 候補カードから正面 / 左向き / 右向き / 上向き / 下向き / 除外を選択する
- 正面候補、yaw 正方向候補、yaw 負方向候補、pitch 正方向候補、pitch 負方向候補をカテゴリごとに開閉する
- 開いた候補カテゴリだけ候補カードを表示し、各カテゴリの候補件数を表示する
- 正面 / 左向き / 右向き / 上向き / 下向きは各 1 件を確定し、同じラベルに別候補を選んだ場合は上書きする
- 除外フレームは複数件確定し、状態や JSON preview / debug 情報として保持する
- 確定済み代表フレーム一覧では、正面 / 左向き / 右向き / 上向き / 下向きだけのサムネイル、frame index、timestamp、yaw / pitch / roll、score、landmarks 数を確認する
- 除外は代表フレームではないため、確定済み代表フレーム一覧には表示しない
- 確定済み代表フレームを解除する
- 3D推測準備状況として正面 / 左向き / 右向き / 上向き / 下向きの選択状態だけを確認する
- JSON preview に `selectedRepresentativeFrames` を表示する
- `representativeFrameCandidates` は引き続き JSON preview に表示する
- JSON preview には 478 landmarks 全文やサムネイル data URL 全文を出さない

Step 2-G / Step 2-H では、3D 478点候補の自動推測と 3D点群 preview まで実装済みです。手動微調整、保存 / export、複数画像入力はまだ実装しません。手動ラベル確定 UI は IdealFace Authoring Tool の責務であり、Engine Runtime や Beauty Studio には追加しません。

## IdealFace Authoring Tool Step 2-E

`tools/ideal-face-authoring` に、確定済み代表フレームから 3D推測用データセットを組み立てる最小実装を追加しました。

Step 2-E でできること:

- front / left / right / up / down の確定済み代表フレームを dataset 対象にする
- excluded は 3D推測用データセットに含めない
- 未選択ラベルは `missing`、対応する解析済みフレームがない場合は `invalid`、2D 478 landmarks と FacePose が揃う場合は `ready` として扱う
- 3D推測用データセットの readiness summary と ready 数を表示する
- dataset entry ごとに label、frame index、timestamp、pose、landmarks 数、status、先頭数点の landmark preview を表示する
- JSON preview に `idealLandmarks3DInferenceDataset` の概要を表示する
- JSON preview には 478 landmarks 全文やサムネイル data URL 全文を出さない

Step 2-E の dataset は、3D の `idealLandmarks3D` 478点候補を推測するための入力データセットです。各 entry は代表フレームに対応する 2D 478 landmarks と FacePose を内部状態として参照しますが、まだ `idealLandmarks3D` 478点そのものではありません。

Step 2-G / Step 2-H では、3D 478点候補の自動推測と 3D点群 preview まで実装済みです。手動微調整、保存 / export、複数画像入力はまだ実装しません。dataset 作成処理は IdealFace Authoring Tool の責務であり、Engine Runtime や Beauty Studio には追加しません。

## IdealFace Authoring Tool Step 2-F

`tools/ideal-face-authoring` に、代表フレーム候補抽出用の詳細スキャンを追加しました。表示用抽出フレームは最大20件程度の確認用として残し、候補抽出では動画全体を 0.1 秒間隔、最大スキャン数の上限付きで細かく解析します。

Step 2-F でできること:

- MP4 動画全体を候補抽出用に詳細スキャンする
- 詳細スキャン済みフレームから、顔検出あり、landmarks 数 478、FacePose 取得済みのフレームだけを候補評価に使う
- yaw / pitch / roll から正面候補、yaw 正方向候補、yaw 負方向候補、pitch 正方向候補、pitch 負方向候補を各カテゴリに複数件保持・表示する
- 候補以外の詳細スキャンフレームは UI に大量表示せず、候補中心に表示する
- 候補に採用されたフレームは、サムネイル、frame index、timestamp、pose、2D 478 landmarks、landmark preview を保持し、手動確定と 3D推測用 dataset 作成に使う
- 詳細スキャン summary と JSON preview の `scanSummary` を表示する
- 候補カード、確定済み代表フレーム、dataset entry のサムネイルはトリムせず、画像全体が見えるように表示する

Step 2-G / Step 2-H では、3D 478点候補の自動推測と 3D点群 preview まで実装済みです。手動微調整、保存 / export、複数画像入力はまだ実装しません。詳細スキャン、代表フレーム候補抽出、手動ラベル確定、dataset 作成は IdealFace Authoring Tool の責務であり、Engine Runtime や Beauty Studio には追加しません。

## IdealFace Authoring Tool の idealLandmarks3D 作成方針

IdealFace の本体である `idealLandmarks3D` 478点は、IdealFace Authoring Tool 側で将来的に動画または複数画像から作成する方針です。初期入力形式は MP4 動画のみとし、複数画像入力は将来対応とします。

初期段階では入力形式を広げず、MP4 動画からの代表フレーム抽出とラベル確定の流れを安定して作ることを優先します。

```text
MP4 動画を入力
  -> 表示用に一定間隔でフレーム抽出
  -> 候補抽出用に動画全体を詳細スキャン
  -> MediaPipe Face Landmarker で各スキャンフレームの 2D 478 landmarks と FacePose を取得
  -> yaw / pitch / roll から代表フレーム候補を自動抽出
  -> 人間が正面 / 左向き / 右向き / 上向き / 下向き / 除外を確定
  -> 確定済み代表フレームから 3D推測用データセットを作成
  -> 将来 Step 2-I: 正面基準候補、推定に使うフレーム、除外フレームから pose-aware multi-frame inference dataset を作成
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

初期段階では、長時間動画、高解像度すぎる動画、HEVC / H.265、MOV、WebM、複数画像入力は非推奨または未対応です。これらは将来対応を検討します。

この処理は完全自動生成ではなく、自動推測 + 手動補正として扱います。動画入力やフレーム抽出は IdealFace Authoring Tool の責務です。Engine Runtime は `idealLandmarks3D` を作成せず、完成済みの IdealFace asset を読み込んで、現在 `FacePose` へ投影して使います。

現時点では、MP4 動画入力とフレーム抽出は Step 2-A、抽出フレームの MediaPipe 解析は Step 2-B、yaw / pitch / roll による代表フレーム候補の自動抽出、各カテゴリ上位複数件の候補一覧 / JSON preview への概要表示、代表フレーム候補を主表示にした Step 2-C UI 整理、代表フレーム候補から正面 / 左向き / 右向き / 上向き / 下向き / 除外を手動確定する Step 2-D UI、候補カテゴリを必要なものだけ開くトグル表示、確定済み代表フレーム一覧、Step 2-E として確定済み代表フレームから front / left / right / up / down の3D推測用データセットを作成し、readiness summary、dataset 一覧、JSON preview の概要で確認する表示、Step 2-F として候補抽出用の詳細スキャン、詳細スキャン summary、JSON preview の `scanSummary`、トリムしないサムネイル表示、Step 2-G として `idealLandmarks3D` 478点候補の自動推測 v1、summary、先頭 5 点 preview、JSON preview の `idealLandmarks3DCandidate` 概要表示、Step 2-H として interactive 3D点群 preview、正面 / 横 / 上の camera preset、x / y / z 範囲、confidence summary、Step 2-I-A として `frontReferenceFrameIds` / `excludedFrameIds`、派生 `usableObservationFrames` summary、JSON preview の `poseAwareMultiFrameInference` 概要は実装済みです。dataset は 2D 478 landmarks と FacePose を持つ代表フレーム群であり、生成結果は完成済み IdealFace asset ではなく候補データです。Step 2-I の pose-aware 3D候補生成ロジック、手動微調整、保存 / export、複数画像入力、厳密な 3D reconstruction、三角測量、bundle adjustment、カメラ内部パラメータ推定、Runtime 組み込みは未実装です。
