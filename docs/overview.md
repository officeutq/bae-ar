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
│  └─ 理想 3D 顔プリセットを作成する authoring tool。Step 2-H まで実装済み
│
└─ Layer Mask Authoring Tool
   └─ 色加工用 LayerMaskSpec を作成する将来ツール
```

現在の実装は `packages/engine`、`apps/studio`、`tools/ideal-face-authoring` が中心です。`tools/ideal-face-authoring` は Step 2-H まで実装済みで、`tools/layer-mask-authoring` は将来予定です。

## 現在の到達点

現在の Runtime / Studio 実装は、カメラ映像を `HTMLVideoElement` として取得し、`BeautyEngine.setInput()` に渡し、MediaPipe Face Landmarker を使って `FaceFrame` を更新する段階です。FacePose の実推定、IdealFace v1、Natural v1 最小プリセット、IdealFace 公開 API、IdealFace Projection v1 の controlPoints 投影、Projection Difference Debug v1、Studio overlay / debug / Copy Debug 関連は実装済みです。

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

IdealFace Authoring Tool では、MP4 動画を入力として受け取り、MediaPipe Face Landmarker で各フレームの 2D 478 landmarks と `FacePose` を取得できます。入力形式は広げすぎず、まずは MP4 動画入力のみを対象にします。複数画像入力は将来対応とし、代表フレーム抽出とラベル確定の流れを安定して作ることを優先します。

初期実装の流れ:

```text
MP4 動画を入力
  -> 一定間隔でフレーム抽出
  -> MediaPipe Face Landmarker で各フレームの 2D 478 landmarks と FacePose を取得
  -> yaw / pitch / roll から代表フレーム候補を自動抽出
  -> ユーザーが正面 / 左向き / 右向き / 上向き / 下向き / 除外を手動確定
  -> 確定済み代表フレームから 3D 推測用データセットを作成
  -> 確定した代表フレーム群から 3D の idealLandmarks3D 478点候補を自動推測
  -> 3D点群 preview で確認
  -> 将来: Authoring Tool 上で手動微調整
  -> 将来: IdealFace asset として保存 / export
```

推奨する MP4 動画は、H.264 / AVC codec、5〜15秒程度、30fps程度、720p程度から開始できるものです。顔が大きく写り、正面、左向き、右向き、上向き、下向きをゆっくり含み、手ブレが少なく、明るい場所で撮影された動画を想定します。口は閉じ気味、表情はできるだけ neutral にします。

初期段階では、長時間動画、高解像度すぎる動画、HEVC / H.265、MOV、WebM、複数画像入力は非推奨または未対応です。これらは将来対応を検討する余地を残します。

確定した代表フレーム群から、まず 3D 推測用データセットを作成します。この dataset は front / left / right / up / down の代表フレームに対応する 2D 478 landmarks と FacePose を持つ入力データであり、excluded は含めません。dataset はまだ 3D の `idealLandmarks3D` 478点そのものではありません。Step 2-G v1 では、この dataset から `idealLandmarks3D` 478点候補を自動推測します。この結果は完成データではなく候補データとして扱います。Step 2-H では Authoring Tool 上で 3D点群を確認できます。手動微調整、IdealFace asset としての保存 / export はまだ未実装です。

次に実装予定の Step 2-I では、Step 2-G v1 の 5ポーズ固定の代表フレーム方式から、pose-aware multi-frame inference dataset へ進めます。フレーム解析結果欄は「正面基準候補」「推定に使うフレーム」「除外フレーム」の 3 分類に整理します。正面基準候補は `idealLandmarks3D` の x / y 基準を作るために複数選択できる front reference frames です。推定に使うフレームは、除外されておらず、解析成功し、landmarks 478点と `FacePose` がある observation frames を基本とし、yaw / pitch / roll に応じて 3D 推定への寄与を重み付けします。除外フレームは、ブレ、表情崩れ、口開き、顔切れ、検出崩れ、極端な roll などにより推定に使わないフレームです。

Step 2-I の操作フローは、正面基準候補を複数選び、使いたくないフレームを除外し、除外されていない解析成功フレームを pose 角度に応じて observation として利用する流れです。`left / right / up / down` をユーザーが必ず手動指定する方式にはせず、将来的には `FacePose` の yaw / pitch から推定寄与を自動判断します。内部説明では `frontReferenceFrames`、`usableObservationFrames`、`excludedFrames` を使ってよいものとします。Step 2-I は未実装であり、厳密な 3D reconstruction、三角測量、bundle adjustment、カメラ内部パラメータ推定、手動微調整、保存 / export、Runtime 組み込みは行いません。

この方針は完全自動生成ではなく、自動推測 + 手動補正です。Engine Runtime は動画 / 複数画像から `idealLandmarks3D` を作成せず、Authoring Tool で作成済みの IdealFace asset を読み込んで使うだけです。

現時点では、MP4 動画入力とフレーム抽出は IdealFace Authoring Tool Step 2-A、抽出フレームの MediaPipe 解析は Step 2-B、yaw / pitch / roll による代表フレーム候補の自動抽出、各カテゴリ上位複数件の候補一覧 / JSON preview への概要表示は Step 2-C、代表フレーム候補から正面 / 左向き / 右向き / 上向き / 下向き / 除外を手動確定する UI と、候補カテゴリを必要なものだけ開く Step 2-D UI整理、確定済み代表フレームから 3D推測用データセットを作成して readiness summary、dataset 一覧、JSON preview の `idealLandmarks3DInferenceDataset` 概要を確認する Step 2-E、候補抽出用に動画全体を詳細スキャンして `scanSummary` を表示する Step 2-F、3D推測用データセットから `idealLandmarks3D` 478点候補を自動推測する Step 2-G v1、生成済み候補を 1 つの canvas で確認する interactive 3D点群 preview の Step 2-H は実装済みです。Step 2-H preview は確認用表示であり、ドラッグによる視点回転、ホイール zoom、Shift + ドラッグ pan、正面 / 横 / 上の camera preset は preview camera の操作として扱います。`idealLandmarks3D` 候補データ自体は変更しません。確定済み代表フレーム一覧と3D推測用データセットには正面 / 左向き / 右向き / 上向き / 下向きだけを表示し、excluded は dataset に含めません。候補以外の詳細スキャンフレームは UI に大量表示せず、候補サムネイルはトリムせず全体表示します。手動微調整、保存 / export、複数画像入力は未実装です。

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

## IdealFace Authoring Tool Step 2-F 改良

Step 2-F 改良では、代表フレーム候補抽出用の詳細スキャン間隔を `0.1` 秒にしました。長い動画を無制限に解析しないよう、最大スキャン数の上限は残します。

詳細スキャンで検出できた各フレームは、条件に合えば `front` / `yawPositive` / `yawNegative` / `pitchPositive` / `pitchNegative` の候補カテゴリへ保持します。上位5件だけに限定せず、カテゴリごとの保持上限の範囲で広く候補を残し、UI ではカテゴリトグル内に候補を表示します。候補カードでは順位を表示せず、`score` を表示します。

候補条件は緩めており、yaw 候補では pitch が多少ずれていても、pitch 候補では yaw が多少ずれていても候補として拾います。除外した候補は候補 UI から外し、`selectedRepresentativeFrames.excluded` として状態 / JSON preview には残せますが、3D推測用 dataset には含めません。

3D 478点候補の自動推測 v1 は Step 2-G で追加済みです。Step 2-H では 3D点群 preview を追加済みです。手動微調整、保存 / export、複数画像入力は引き続き未実装です。詳細スキャンや候補振り分け、3D候補生成処理、3D点群 preview は IdealFace Authoring Tool の責務であり、Runtime には入れません。

Step 2-G v1 は、front / left / right / up / down の代表フレームに依存する現在実装済みの簡易推定として残します。Step 2-I 以降は、正面基準候補、推定に使うフレーム、除外フレームに整理し、除外されていない解析成功フレームを yaw / pitch / roll の角度に応じて連続的に使う pose-aware multi-frame inference へ移行する方針です。

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

Step 2-H 現在では、MP4 動画入力、MediaPipe 解析、代表フレーム候補抽出、手動ラベル確定、3D推測用 dataset 作成、`idealLandmarks3D` 478点候補生成、3D点群 preview まで実装済みです。本格 3D editor、手動微調整、保存 / export、複数画像入力は未実装です。このツールは MediaPipe canonical face model そのものを作るツールではなく、Authoring Tool の編集処理を Engine Runtime に混ぜません。

## IdealFace Authoring Tool Step 2-A

`tools/ideal-face-authoring` では、Step 2-A として MP4 動画入力とフレーム抽出を実装済みです。

実装済み:

- MP4 動画ファイルの選択
- `<video>` と Object URL によるブラウザ上での動画読み込み
- `duration` / `videoWidth` / `videoHeight` の表示
- 1秒ごと、または最大 20 フレーム程度に抑えた canvas へのフレーム抽出
- サムネイル一覧での frame index / timestamp / 状態「未解析」の表示
- JSON preview での動画情報と抽出フレーム情報の表示

初期対応は MP4 動画のみです。複数画像入力は未実装 / 将来対応です。Step 2-B で MediaPipe による 2D 478 landmarks 取得と FacePose 取得、Step 2-C で代表フレーム候補抽出、Step 2-D で手動ラベル確定 UI、Step 2-E で3D推測用データセット作成、Step 2-F で候補抽出用の詳細スキャン、Step 2-G で3D 478点候補の自動推測 v1、Step 2-H で3D点群 preview まで追加済みです。手動微調整、保存 / export はまだ未実装です。

動画入力やフレーム抽出処理は IdealFace Authoring Tool の責務です。Runtime には動画入力やフレーム抽出処理を入れません。

## IdealFace Authoring Tool Step 2-B

`tools/ideal-face-authoring` では、Step 2-B として抽出済みフレームの MediaPipe Face Landmarker 解析を実装済みです。

実装済み:

- 抽出済みフレームに対する MediaPipe 解析実行
- フレームごとの 2D 478 landmarks と FacePose の取得
- フレームカードでの解析状態、landmarks 数、pose pitch / yaw / roll 表示
- 解析結果 summary での解析済み数、顔検出あり / なし、解析エラー数、yaw / pitch / roll 範囲表示
- JSON preview での解析概要と `landmarkPreview` 表示

JSON preview には 478 landmarks 全文は出しません。代表フレーム候補抽出は Step 2-C、手動ラベル確定 UI は Step 2-D、3D推測用データセット概要表示は Step 2-E、候補抽出用の詳細スキャンと `scanSummary` 表示は Step 2-F、3D候補生成 summary と `idealLandmarks3DCandidate` 概要表示は Step 2-G、3D点群 preview は Step 2-H で追加済みです。手動微調整、保存 / export はまだ未実装です。

MediaPipe 解析は Authoring Tool の抽出フレームに対する処理です。Runtime には動画入力、フレーム抽出、Authoring 用フレーム解析処理を入れません。

## IdealFace Authoring Tool Step 2-C

`tools/ideal-face-authoring` では、Step 2-C として解析済みフレームから代表フレーム候補を自動抽出し、各カテゴリの上位複数件を比較できる実装を追加済みです。Step 2-C UI 整理では、ユーザーが見る主画面を抽出フレーム一覧ではなく代表フレーム候補中心にしました。

実装済み:

- 顔検出あり、landmarks 数 478 の解析済みフレームだけを候補評価に使う
- yaw / pitch / roll を使って正面候補、yaw 正方向候補、yaw 負方向候補、pitch 正方向候補、pitch 負方向候補を各カテゴリ上位複数件抽出する
- 候補一覧にサムネイル、frame index、timestamp、yaw / pitch / roll、score、landmarks 数を表示する
- 候補がない場合は「候補なし」と表示する
- 解析 summary を代表フレーム候補の近くに表示する
- 抽出フレーム一覧は debug / 折りたたみ表示として扱う
- JSON preview に `representativeFrameCandidates` としてカテゴリごとの候補配列を表示する
- JSON preview には 478 landmarks 全文やサムネイル data URL 全文を出さない

将来的に解析対象フレームが増えても、ユーザーには代表フレーム候補を中心に見せ、抽出フレーム一覧は debug / 確認用として折りたたみます。

候補 1 件だけで確定せず、候補を複数比較して手動ラベル確定 UI へ進む方針です。Step 2-D で手動ラベル確定 UI、Step 2-E で確定済み代表フレームからの3D推測用データセット作成、Step 2-F で候補抽出用の詳細スキャン、Step 2-G で3D 478点候補の自動推測 v1、Step 2-H で3D点群 preview まで追加済みです。手動微調整、保存 / export、複数画像入力はまだ未実装です。代表フレーム抽出処理と Authoring 用 UI、dataset 作成処理、3D候補生成処理、3D点群 preview は IdealFace Authoring Tool の責務であり、Runtime には入れません。

## IdealFace Authoring Tool Step 2-D

`tools/ideal-face-authoring` では、Step 2-D として代表フレーム候補から最終ラベルを手動確定する UI を追加済みです。Step 2-D UI整理では、代表フレーム候補カテゴリをトグル表示にし、ユーザーが必要な候補カテゴリだけを開いて確認できるようにしました。

実装済み:

- 候補カードから正面 / 左向き / 右向き / 上向き / 下向き / 除外を選択する
- 正面候補、yaw 正方向候補、yaw 負方向候補、pitch 正方向候補、pitch 負方向候補をカテゴリごとに開閉する
- 開いた候補カテゴリだけ候補カードを表示し、各カテゴリの候補件数を表示する
- 正面 / 左向き / 右向き / 上向き / 下向きは各 1 件を確定し、同じラベルに別候補を選ぶと上書きする
- 除外フレームは複数件確定し、状態や JSON preview / debug 情報として保持する
- 確定済み代表フレーム一覧では正面 / 左向き / 右向き / 上向き / 下向きだけを確認する
- 除外は代表フレームではないため、確定済み代表フレーム一覧には表示しない
- 確定済み代表フレームを解除する
- 3D推測準備状況として正面 / 左向き / 右向き / 上向き / 下向きの選択状態だけを確認する
- JSON preview に `selectedRepresentativeFrames` を表示する
- `representativeFrameCandidates` は引き続き JSON preview に表示する
- JSON preview には 478 landmarks 全文やサムネイル data URL 全文を出さない

Step 2-D では、3D 478点候補の自動推測、3D点群 preview、手動微調整、保存 / export、複数画像入力はまだ実装しません。手動ラベル確定 UI は IdealFace Authoring Tool の責務であり、Runtime や Beauty Studio には入れません。

## IdealFace Authoring Tool Step 2-E

`tools/ideal-face-authoring` では、Step 2-E として確定済み代表フレームから 3D推測用データセットを作成する最小実装を追加済みです。

実装済み:

- front / left / right / up / down の確定済み代表フレームを dataset 対象にする
- excluded は 3D推測用データセットに含めない
- 未選択ラベルは `missing`、対応する解析済みフレームがない場合は `invalid`、2D 478 landmarks と FacePose が揃う場合は `ready` として扱う
- readiness summary と ready 数を表示する
- dataset entry に label / frame index / timestamp / pose / landmarks 数 / status / 先頭数点の landmark preview を表示する
- JSON preview に `idealLandmarks3DInferenceDataset` の概要を表示する
- JSON preview には 478 landmarks 全文やサムネイル data URL 全文を出さない

Step 2-E の dataset は、3D の `idealLandmarks3D` 478点候補を推測するための入力データセットです。まだ `idealLandmarks3D` 478点そのものではありません。

Step 2-E では、3D 478点候補の自動推測、3D点群 preview、手動微調整、保存 / export、複数画像入力はまだ実装しません。dataset 作成処理は IdealFace Authoring Tool の責務であり、Runtime や Beauty Studio には入れません。Step 2-F でも 3D推測以降は実装せず、候補抽出用の詳細スキャンに範囲を絞っています。Step 2-G で dataset からの 3D 478点候補生成 v1、Step 2-H で3D点群 preview を追加済みですが、手動微調整、保存 / export はまだ実装していません。

## IdealFace Authoring Tool Step 2-F

`tools/ideal-face-authoring` では、Step 2-F として代表フレーム候補抽出用の詳細スキャンを追加済みです。表示用抽出は最大20件程度に抑えたまま、候補抽出では動画全体を 0.1 秒間隔、最大スキャン数の上限付きで解析します。

実装済み:

- 詳細スキャン済みフレームから、顔検出あり、landmarks 数 478、FacePose 取得済みのフレームだけを候補評価に使う
- yaw / pitch / roll から正面候補、yaw 正方向候補、yaw 負方向候補、pitch 正方向候補、pitch 負方向候補を各カテゴリに複数件保持・表示する
- 全スキャンフレーム一覧は UI に表示せず、代表フレーム候補を中心に表示する
- 候補に採用されたフレームは、手動確定と 3D推測用 dataset 作成に使えるようサムネイル、frame index、timestamp、pose、2D 478 landmarks、landmark preview を保持する
- 詳細スキャン summary と JSON preview の `scanSummary` を表示する
- 候補カード、確定済み代表フレーム、dataset entry のサムネイルを `contain` 相当で表示し、画像全体が見えるようにする

Step 2-G では、front が ready の場合に 3D 478点候補を生成します。v1 は厳密な 3D reconstruction ではなく、front の 2D 478 landmarks を x / y の基準にし、left / right / up / down との差分から z を簡易推定する仮の候補生成です。不足している代表フレームは confidence を下げる要素として扱います。生成結果は完成済み IdealFace asset ではなく候補データであり、JSON preview には `idealLandmarks3DCandidate` の概要と先頭 5 点程度の preview だけを表示します。

## IdealFace Authoring Tool Step 2-H

Step 2-H では、生成された `idealLandmarks3D` 478点候補を Authoring Tool 上で interactive 3D点群 preview として表示します。preview は debug / 確認用であり、本格 3D editor ではありません。1 つの canvas 上で preview camera を操作し、ドラッグで視点回転、ホイールで zoom、Shift + ドラッグで pan、ダブルクリックまたは reset button で初期視点へ戻せます。正面 / 横 / 上は固定ビューではなく、同じ viewport の camera preset です。表示上は y を反転して顔の上方向が画面上側に見えるようにし、z 表示倍率調整は preview 専用の view transform として扱います。これらは preview camera の操作であり、`idealLandmarks3D` 候補データ自体や JSON preview の値は変更しません。点群は表示範囲内に収まるよう center / scale を調整し、低 confidence の点は薄く表示します。

preview の近くには landmark count、視点、x / y / z の min / max、average confidence、min / max confidence を表示します。JSON preview は引き続き `idealLandmarks3DCandidate` の概要と先頭 5 点程度の preview に留め、478点全文や canvas data URL は出しません。手動微調整、保存 / export、複数画像入力はまだ実装しません。3D点群 preview は IdealFace Authoring Tool の責務であり、Runtime や Beauty Studio には入れません。

## IdealFace Authoring Tool Step 2-I

Step 2-I は次に実装予定の未実装仕様です。Step 2-G v1 の `front / left / right / up / down` 代表フレーム方式を置き換えるのではなく、現行 v1 を残したうえで、pose-aware multi-frame inference dataset へ進む方針を定義します。

Step 2-I の UI 表示名:

```text
正面基準候補
推定に使うフレーム
除外フレーム
```

dataset の将来形では、選択状態として `frontReferenceFrameIds` と `excludedFrameIds` を持つ方針です。`usableObservationFrames` は state として直接持たず、解析成功していること、landmarks が 478 点あること、`FacePose` があること、`excludedFrameIds` に含まれていないことから派生します。3D候補生成前には、正面基準候補数、推定に使うフレーム数、除外フレーム数、yaw / pitch / roll の範囲、状態、警告を summary として表示する方針です。

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
