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
│  └─ 理想 3D 顔プリセットを作成する将来ツール
│
└─ Layer Mask Authoring Tool
   └─ 色加工用 LayerMaskSpec を作成する将来ツール
```

現在の実装は `packages/engine` と `apps/studio` が中心です。Authoring Tool は将来予定です。

## 現在の到達点

現在の実装は、カメラ映像を `HTMLVideoElement` として取得し、`BeautyEngine.setInput()` に渡し、MediaPipe Face Landmarker を使って `FaceFrame` を更新する段階です。

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

## IdealFace Authoring Tool における idealLandmarks3D 作成方針

IdealFace Authoring Tool では、将来的に動画または複数画像を入力として受け取り、MediaPipe Face Landmarker で各フレームの 2D 478 landmarks と `FacePose` を取得します。初期実装では入力形式を広げすぎず、まずは MP4 動画入力のみを対象にします。複数画像入力は将来対応とし、初期段階では代表フレーム抽出とラベル確定の流れを安定して作ることを優先します。

初期実装の流れ:

```text
MP4 動画を入力
  -> 一定間隔でフレーム抽出
  -> MediaPipe Face Landmarker で各フレームの 2D 478 landmarks と FacePose を取得
  -> yaw / pitch / roll から代表フレーム候補を自動抽出
  -> ユーザーが正面 / 左向き / 右向き / 上向き / 下向き / 除外を手動確定
  -> 確定した代表フレーム群から 3D の idealLandmarks3D 478点候補を自動推測
  -> Authoring Tool 上で確認・微調整
  -> IdealFace asset として保存 / export
```

推奨する MP4 動画は、H.264 / AVC codec、5〜15秒程度、30fps程度、720p程度から開始できるものです。顔が大きく写り、正面、左向き、右向き、上向き、下向きをゆっくり含み、手ブレが少なく、明るい場所で撮影された動画を想定します。口は閉じ気味、表情はできるだけ neutral にします。

初期段階では、長時間動画、高解像度すぎる動画、HEVC / H.265、MOV、WebM、複数画像入力は非推奨または未対応です。これらは将来対応を検討する余地を残します。

確定した代表フレーム群から、3D の `idealLandmarks3D` 478点候補を自動推測します。この結果は完成データではなく候補データとして扱い、Authoring Tool 上で 3D点群を確認し、必要な箇所を手動で微調整します。手動補正後の `idealLandmarks3D` 478点を IdealFace asset として保存 / export します。

この方針は完全自動生成ではなく、自動推測 + 手動補正です。Engine Runtime は動画 / 複数画像から `idealLandmarks3D` を作成せず、Authoring Tool で作成済みの IdealFace asset を読み込んで使うだけです。

現時点では、MP4 動画入力とフレーム抽出は IdealFace Authoring Tool Step 2-A、抽出フレームの MediaPipe 解析は Step 2-B、yaw / pitch / roll による代表フレーム候補の自動抽出、各カテゴリ上位複数件の候補一覧 / JSON preview への概要表示は Step 2-C として実装済みです。手動ラベル確定 UI、3D 478点候補の自動推測、3D点群 preview、手動微調整、保存 / export、複数画像入力は未実装です。

## Shape Processing の考え方

shape processing は、個別パーツを独立して大きく変える方向にはしません。

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

## IdealFace Authoring Tool Step 1

`tools/ideal-face-authoring` は BAE AR 独自の IdealFace asset を作るための独立ツールです。Step 1 では `natural_v1` の metadata、controlPoints 一覧、2D preview、JSON preview を表示します。

ドラッグ編集、保存、ideal 478 landmarks 生成、canonical face mesh editor、手動ラベル確定、3D 478点推測、手動微調整、複数画像入力は未実装です。このツールは MediaPipe canonical face model そのものを作るツールではなく、Authoring Tool の編集処理を Engine Runtime に混ぜません。

## IdealFace Authoring Tool Step 2-A

`tools/ideal-face-authoring` では、Step 2-A として MP4 動画入力とフレーム抽出を実装済みです。

実装済み:

- MP4 動画ファイルの選択
- `<video>` と Object URL によるブラウザ上での動画読み込み
- `duration` / `videoWidth` / `videoHeight` の表示
- 1秒ごと、または最大 20 フレーム程度に抑えた canvas へのフレーム抽出
- サムネイル一覧での frame index / timestamp / 状態「未解析」の表示
- JSON preview での動画情報と抽出フレーム情報の表示

初期対応は MP4 動画のみです。複数画像入力は未実装 / 将来対応です。Step 2-A 時点では MediaPipe による 2D 478 landmarks 取得と FacePose 取得は未実装でしたが、Step 2-B で抽出済みフレームの解析まで追加済みです。Step 2-C で代表フレーム候補抽出まで追加済みです。手動ラベル確定、3D 478点推測、3D点群 preview、手動微調整、保存 / export はまだ未実装です。

動画入力やフレーム抽出処理は IdealFace Authoring Tool の責務です。Runtime には動画入力やフレーム抽出処理を入れません。

## IdealFace Authoring Tool Step 2-B

`tools/ideal-face-authoring` では、Step 2-B として抽出済みフレームの MediaPipe Face Landmarker 解析を実装済みです。

実装済み:

- 抽出済みフレームに対する MediaPipe 解析実行
- フレームごとの 2D 478 landmarks と FacePose の取得
- フレームカードでの解析状態、landmarks 数、pose pitch / yaw / roll 表示
- 解析結果 summary での解析済み数、顔検出あり / なし、解析エラー数、yaw / pitch / roll 範囲表示
- JSON preview での解析概要と `landmarkPreview` 表示

JSON preview には 478 landmarks 全文は出しません。代表フレーム候補抽出は Step 2-C で追加済みです。手動ラベル確定、3D 478点推測、3D点群 preview、手動微調整、保存 / export はまだ未実装です。

MediaPipe 解析は Authoring Tool の抽出フレームに対する処理です。Runtime には動画入力、フレーム抽出、Authoring 用フレーム解析処理を入れません。

## IdealFace Authoring Tool Step 2-C

`tools/ideal-face-authoring` では、Step 2-C として解析済みフレームから代表フレーム候補を自動抽出し、各カテゴリの上位複数件を比較できる実装を追加済みです。Step 2-C UI 整理では、ユーザーが見る主画面を抽出フレーム一覧ではなく代表フレーム候補中心にしました。

実装済み:

- 顔検出あり、landmarks 数 478 の解析済みフレームだけを候補評価に使う
- yaw / pitch / roll を使って正面候補、yaw 正方向候補、yaw 負方向候補、pitch 正方向候補、pitch 負方向候補を各カテゴリ上位複数件抽出する
- 候補一覧にサムネイル、順位、frame index、timestamp、yaw / pitch / roll、score、landmarks 数を表示する
- 候補がない場合は「候補なし」と表示する
- 解析 summary を代表フレーム候補の近くに表示する
- 抽出フレーム一覧は debug / 折りたたみ表示として扱う
- JSON preview に `representativeFrameCandidates` としてカテゴリごとの候補配列を表示する
- JSON preview には 478 landmarks 全文やサムネイル data URL 全文を出さない

将来的に解析対象フレームが増えても、ユーザーには代表フレーム候補を中心に見せ、抽出フレーム一覧は debug / 確認用として折りたたみます。

候補 1 件だけで確定せず、候補を複数比較して次の手動ラベル確定 UI へ進む方針です。手動ラベル確定 UI、3D 478点候補の自動推測、3D点群 preview、手動微調整、保存 / export、複数画像入力はまだ未実装です。代表フレーム抽出処理と Authoring 用 UI は IdealFace Authoring Tool の責務であり、Runtime には入れません。

## IdealFace / Projection / Shape Processing 中核仕様

BAE AR の shape processing では、IdealFace は 3D の `idealLandmarks3D` 478 点を本体とします。理想 3D 顔プリセットとしての IdealFace は、`idealLandmarks3D` 478 点を中核に持つ asset です。IdealFace が持つ基準は、正面固定の 2D landmarks ではありません。

Runtime は IdealFace の 3D landmarks を現在顔の `FacePose` へ投影し、現在姿勢を反映した 2D の projected ideal 478 landmarks を生成します。正面 2D の 478 点だけでは、yaw / pitch / roll などの顔の角度変化に追随できないため、角度変化への対応は Projection の責務として扱います。

Shape Processing は、MediaPipe Face Landmarker がカメラ映像から取得した current 478 landmarks と、IdealFace 由来の projected ideal 478 landmarks の差分を見ます。この差分が、将来の `CorrectionPlan` / Shape Warp へ渡される後段処理の入力になります。

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
