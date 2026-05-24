# 開発フロー

## 基本方針

BAE AR は、Engine Runtime、Beauty Studio、IdealFace Authoring Tool、Layer Mask Authoring Tool を分けて開発します。

- Engine Runtime は本番でリアルタイム加工する中核 SDK です。
- Beauty Studio は Engine Runtime を開発・検証・調整するための開発ツールです。
- Studio は Engine Runtime の公開 API のみを使います。
- Studio から Engine Runtime の内部実装へ直接依存しません。
- IdealFace Authoring Tool は Step 2-I-A まで実装済みです。
- Layer Mask Authoring Tool は将来予定です。
- Authoring Tool の処理を Runtime に混ぜません。
- 1 つの Issue では目的を絞って小さく実装します。

## 実装前に確認すること

症状や想像だけで原因を断定しません。修正前に必ず関連する実コードを確認します。

確認対象:

- 呼び出し元と呼び出し先の実装
- 型定義、インターフェース、公開 API
- 状態の所有者と更新箇所
- debug 値が、実行時に利用している同じインスタンスから来ているか
- `initialize` / `start` / `setInput` / `setFaceDetector` などのライフサイクル順序
- 既存の guard、early return、error handling

## 現在の開発サイクル

現在は基盤実装の段階です。

```text
1. Engine Runtime の公開 API を小さく追加する
2. Studio からその公開 API だけを使って確認する
3. Studio に debug / overlay / copyable debug を追加する
4. 実カメラまたは可能な範囲の構成確認を行う
5. ドキュメントへ実装済み / 未実装 / 将来予定を反映する
6. 次の小さな Issue へ進む
```

## 現在実装済みの確認経路

```text
CameraService.start()
  -> navigator.mediaDevices.getUserMedia()
  -> HTMLVideoElement
  -> BeautyEngine.setInput()
  -> BeautyEngine.setFaceDetector()
  -> MediaPipeFaceDetector.detect()
  -> FaceFrame 更新
  -> analyzeFaceGeometry()
  -> Studio debug / overlay
```

## Shape Processing の開発方針

個別パーツ加工を増やす方向にはしません。

shape processing は current 478 landmarks と IdealFace 由来の ideal 478 landmarks を比較し、顔全体として自然に少し warp する方針で進めます。

IdealFace は BAE AR 独自の canonical face / お面データです。MediaPipe canonical face model そのものではありません。MediaPipe の topology や landmark index は参考にする可能性がありますが、MediaPipe は検出側の基準、BAE AR IdealFace は補正・比較側の基準として分けて扱います。

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

## CorrectionPlan の開発方針

CorrectionPlan は姿勢補正を担当しません。姿勢への対応は IdealFace Projection の責務です。

CorrectionPlan は Projection 後の current 2D landmarks と ideal 2D landmarks の差分を受け取り、実際に warp へ渡す安全な補正量を決めます。

扱うもの:

- 補正強度
- 移動量上限
- 滑らかさ
- 過補正防止
- 信頼度

扱わないもの:

- FacePose の推定
- IdealFace の現在姿勢への投影
- 個別パーツ加工命令

## Color Processing / Layer System の開発方針

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

## LayerMaskSpec の開発方針

LayerMask は FaceLandmarks から生成する 2D mask です。

基本仕様:

- どの landmarks で囲われた範囲かを定義する
- landmarks を polygon 化する
- polygon から mask を生成する
- 必要に応じて除外領域を持つ
- 必要に応じて膨張・収縮する
- 境界は feather / blur して自然にする
- mask 値は 0.0〜1.0 の強度マップとする

LayerMaskSpec の作成や手作業編集は Layer Mask Authoring Tool の責務です。Engine Runtime は定義済み LayerMaskSpec を読み込んで使います。

## Runtime と Authoring の分離

Engine Runtime で行わないこと:

- IdealFace の作成
- MediaPipe canonical face model の生成・編集
- 2D 動画からの 3D 顔生成
- LayerMaskSpec の作成
- mask の手作業編集
- Studio / Authoring 用 UI

Beauty Studio では、開発確認用として overlay や簡易調整 UI を持ってよいです。ただし、本番配布対象には含めません。

## IdealFace Authoring Tool の開発方針

IdealFace Authoring Tool は、BAE AR 独自の IdealFace asset を作成するための領域です。IdealFace の本体である `idealLandmarks3D` 478点は、Authoring Tool 側でオフラインに作成する方針です。現在は MP4 動画入力から Step 2-I-A まで実装済みで、複数画像入力は将来対応とします。

初期段階では入力形式を広げず、MP4 動画からのフレーム抽出、代表フレーム候補の自動抽出、ユーザーによるラベル確定の流れを優先して作ります。Step 2-A では、MP4 動画入力と一定間隔でのフレーム抽出、サムネイル一覧表示までを実装済みです。Step 2-B では、抽出済みフレームの MediaPipe 解析、2D 478 landmarks と FacePose の取得、解析結果 summary 表示までを実装済みです。Step 2-C では、yaw / pitch / roll による代表フレーム候補の自動抽出、各カテゴリ上位複数件の候補一覧表示、JSON preview への候補概要表示、代表フレーム候補中心の UI 整理までを実装済みです。Step 2-D では、候補カードから正面 / 左向き / 右向き / 上向き / 下向き / 除外を手動確定し、候補カテゴリを必要なものだけ開くトグル表示、確定済み代表フレーム一覧、3D推測準備状況、JSON preview の `selectedRepresentativeFrames` を確認できるようにしました。Step 2-E では、確定済み代表フレームから front / left / right / up / down の 3D推測用データセットを作成し、readiness summary、dataset 一覧、JSON preview の `idealLandmarks3DInferenceDataset` 概要を確認できるようにしました。Step 2-F では、候補抽出用に動画全体を詳細スキャンし、詳細スキャン summary、JSON preview の `scanSummary`、トリムしないサムネイル表示を追加しました。Step 2-G では、3D推測用データセットから `idealLandmarks3D` 478点候補を自動推測する v1 を追加しました。Step 2-H では、生成済み候補を 1 つの canvas で表示する interactive 3D点群 preview を追加しました。ドラッグによる視点回転、ホイール zoom、Shift + ドラッグ pan、正面 / 横 / 上の camera preset は preview camera の操作であり、`idealLandmarks3D` 候補データ自体や JSON preview の数値は変更しません。確定済み代表フレーム一覧と3D推測用データセットには、正面 / 左向き / 右向き / 上向き / 下向きだけを表示します。

Step 2-I-A では UI / state 基盤を実装済みです。Step 2-G は現在実装済みの v1 として残し、Step 2-I では 5ポーズ固定の代表フレーム方式から、正面基準候補、推定に使うフレーム、除外フレームに整理した pose-aware multi-frame inference dataset へ進む方針です。Step 2-I 用操作は Step 2-I カード内に閉じ、旧ポーズ別候補 UI には混ぜません。画面上の 3 分類は排他的に表示します。pose-aware 3D候補生成ロジックはまだ実装しません。

想定する流れ:

```text
MP4 動画を入力
  -> 表示用に一定間隔でフレーム抽出
  -> 候補抽出用に動画全体を詳細スキャン
  -> MediaPipe Face Landmarker で各スキャンフレームの 2D 478 landmarks と FacePose を取得
  -> yaw / pitch / roll から各カテゴリに条件に合う代表フレーム候補を自動抽出
  -> 候補を複数比較する
  -> 人間が正面 / 左向き / 右向き / 上向き / 下向き / 除外を確定
  -> 確定済み代表フレームから 3D 推測用データセットを作成
  -> Step 2-I-B: 正面基準候補、推定に使うフレーム、除外フレームから pose-aware multi-frame inference dataset を作成
  -> Step 2-I-C: yaw / pitch / roll / weight に基づく pose-aware weighted z inference v1 で idealLandmarks3D 478点候補を生成
  -> Authoring Tool 上で 3D点群 preview として確認
  -> 将来、手動微調整
  -> 将来、IdealFace asset として保存 / export
```

推奨する MP4 動画は、H.264 / AVC codec、5〜15秒程度、30fps程度、720p程度から開始できるものです。顔が大きく写り、正面、左向き、右向き、上向き、下向きをゆっくり含み、手ブレが少なく、明るい場所で撮影され、口は閉じ気味で表情はできるだけ neutral なものを想定します。

長時間動画、高解像度すぎる動画、HEVC / H.265、MOV、WebM、複数画像入力は、初期段階では非推奨または未対応です。これらは将来対応を検討します。

この処理は完全自動生成ではなく、自動推測 + 手動補正として扱います。動画入力、フレーム抽出、Authoring 用フレーム解析、代表フレーム抽出、手動ラベル確定、3D推測用 dataset 作成は IdealFace Authoring Tool の責務です。Engine Runtime は動画入力やフレーム抽出、Authoring 用フレーム解析、dataset 作成、`idealLandmarks3D` 作成を行わず、完成済みの IdealFace asset を読み込んで使います。

Step 2-F では候補 1 件だけで確定せず、正面候補、yaw 正方向候補、yaw 負方向候補、pitch 正方向候補、pitch 負方向候補を各カテゴリに複数件保持・表示し、手動ラベル確定 UI へ進む土台にします。主画面では代表フレーム候補を中心に見せ、表示用抽出フレーム一覧は debug / 折りたたみ表示として扱います。候補以外の詳細スキャンフレームは UI に大量表示せず、必要がなければ破棄してよいものとします。候補に採用されたフレームは、手動確定と dataset 作成に使えるよう 2D 478 landmarks と FacePose を保持します。代表フレーム抽出処理と Authoring 用 UI は IdealFace Authoring Tool の責務であり、Engine Runtime には入れません。

Step 2-I-A では、フレーム解析結果欄を「正面基準候補」「推定に使うフレーム」「除外フレーム」に整理します。正面基準候補は `frontReferenceFrames` として複数選択でき、`idealLandmarks3D` の x / y 基準を作ります。推定に使うフレームは `usableObservationFrames` として、解析成功、landmarks 478点、`FacePose` あり、`excludedFrameIds` に含まれないことから派生させます。除外フレームは pose に関係なく指定でき、ブレ、表情崩れ、口開き、顔切れ、検出崩れ、極端な roll などを 3D 推定から外します。

Step 2-I 以降は、`left / right / up / down` をユーザーが必ず手動指定する方式にはしません。除外されていない有効フレームを observation として使い、yaw / pitch / roll と score に応じて重み付けします。yaw も pitch も大きいフレームは、left か up のどちらかに分類するのではなく、mixed pose observation として yaw 成分と pitch 成分の両方を利用します。3D候補生成前には、正面基準候補数、推定に使うフレーム数、除外フレーム数、yaw / pitch / roll の範囲、状態、警告を summary として表示する方針です。

Step 2-I-B は未実装の次ステップで、pose-aware multi-frame inference dataset 作成に範囲を絞ります。`frontReferenceFrames` は複数の正面基準候補から base x / y を作るために使い、`observationFrames` は除外されていない解析成功フレームから作ります。observation は frameId、timestamp、2D landmarks、FacePose yaw / pitch / roll、score、weight を持ち、`left / right / up / down` 固定分類は持ちません。Step 2-I-B では `idealLandmarks3D` 新生成ロジック、Step 2-G v1 の置き換え、pose-aware weighted z inference はまだ実装しません。

Step 2-I-C はその次の未実装ステップで、Step 2-I-B の dataset を使って pose-aware weighted z inference v1 を追加します。複数の frontReferenceFrames から base x / y を作り、observationFrames の yaw / pitch / roll / score / weight から landmark ごとの z hint を weighted average します。confidence は観測数、pose coverage、weight、ばらつき、不足情報から決める方針です。厳密な 3D reconstruction、三角測量、bundle adjustment、カメラ内部パラメータ推定、本格 3D editor、手動微調整、保存 / export、Runtime への組み込みは行いません。

Step 2-C 時点では未実装で、現在は後続 Step で実装済みになったもの:

- 3D 478点候補の自動推測
- 3D点群 preview

Step 2-C 現在も未実装のもの:

- 手動微調整
- 保存 / export
- 複数画像入力

Step 2-D で実装済みのもの:

- 候補カードから正面 / 左向き / 右向き / 上向き / 下向き / 除外を選択する UI
- 正面候補、yaw 正方向候補、yaw 負方向候補、pitch 正方向候補、pitch 負方向候補をカテゴリごとに開閉する UI
- 開いた候補カテゴリだけ候補カードを表示し、候補件数を表示する UI
- 正面 / 左向き / 右向き / 上向き / 下向きだけを表示する確定済み代表フレーム一覧
- 除外フレームを状態や JSON preview / debug 情報として保持すること
- 確定済み代表フレームの解除と同一ラベルの上書き
- JSON preview の `selectedRepresentativeFrames`
- 正面 / 左向き / 右向き / 上向き / 下向きだけを表示する3D推測準備状況

Step 2-D 時点では未実装で、現在は後続 Step で実装済みになったもの:

- 3D 478点候補の自動推測
- 3D点群 preview

Step 2-D 現在も未実装のもの:

- 手動微調整
- 保存 / export
- 複数画像入力

Step 2-E で実装済みのもの:

- front / left / right / up / down の確定済み代表フレームを dataset 対象にする
- excluded を 3D推測用データセットに含めない
- 未選択を `missing`、対応する解析済みフレームがない状態を `invalid`、2D 478 landmarks と FacePose が揃う状態を `ready` として扱う
- 3D推測用データセットの readiness summary と ready 数
- dataset entry の label / frame index / timestamp / pose / landmarks 数 / status / landmark preview 表示
- JSON preview の `idealLandmarks3DInferenceDataset`

Step 2-E 時点では未実装で、現在は後続 Step で実装済みになったもの:

- 3D 478点候補の自動推測
- 3D点群 preview

Step 2-E 現在も未実装のもの:

- 手動微調整
- 保存 / export
- 複数画像入力

Step 2-F で実装済みのもの:

- 候補抽出用として MP4 動画全体を 0.1 秒間隔、最大スキャン数の上限付きで詳細スキャンする
- 詳細スキャン済みフレームから、顔検出あり、landmarks 数 478、FacePose 取得済みのフレームだけを候補評価に使う
- 全スキャンフレーム一覧を UI に表示せず、代表フレーム候補中心に表示する
- 詳細スキャン summary と JSON preview の `scanSummary` を表示する
- 候補に採用されたフレームを手動確定と 3D推測用 dataset 作成に使えるよう保持する
- 候補カード、確定済み代表フレーム、dataset entry のサムネイルをトリムせず全体表示する

Step 2-F 時点では未実装で、現在は後続 Step で実装済みになったもの:

- 3D 478点候補の自動推測
- 3D点群 preview

Step 2-F 現在も未実装のもの:

- 手動微調整
- 保存 / export
- 複数画像入力

## Studio UI 表示

Studio の UI 表示は原則として日本語にします。

例:

```text
エンジン状態
入力状態
カメラ状態
カメラエラー
プレビュー
```

API 名、型名、コード識別子は英語のままとします。

```ts
BeautyEngine
CameraService
getState()
```

## 確認コマンド

現時点で root の `package.json` には `start` と `start:ideal-face-authoring` が定義されています。

```bash
npm run start
npm run start:ideal-face-authoring
```

build / test / lint script は未定義です。追加後は、このドキュメントにも反映します。

## PR に書くこと

PR 本文には、変更内容と確認結果を記載します。

実カメラ確認が Codex 環境でできない場合は、手動確認事項として明記します。

```md
## Summary

- 変更内容

## Testing

- 実行した確認コマンド

## Manual Testing

- カメラ権限許可
- カメラ映像確認
- Input: connected 確認
```

## IdealFace Authoring Tool Step 1 / Step 2-A / Step 2-B / Step 2-C / Step 2-D / Step 2-E / Step 2-F / Step 2-G / Step 2-H の確認

IdealFace Authoring Tool を変更した場合は、Runtime と Authoring の責務が混ざっていないことを確認します。

確認観点:

- `tools/ideal-face-authoring` が独立ツールとして起動する
- `apps/studio` に Authoring 用タブを追加していない
- Engine Runtime に UI や編集処理を追加していない
- `natural_v1` の metadata / controlPoints / 2D preview / JSON preview を確認できる
- MP4 動画を選択できる
- 選択した MP4 の metadata を表示できる
- 一定間隔でフレームを抽出し、サムネイル一覧で確認できる
- 各フレームに frame index / timestamp / 未解析を表示できる
- JSON preview に動画情報と抽出フレーム情報を表示できる
- MediaPipe 解析を実行できる
- 解析済みフレームに landmarks 数と pose pitch / yaw / roll を表示できる
- 解析結果 summary を確認できる
- JSON preview に解析概要を表示できる
- 代表フレーム候補がカテゴリ別に複数件表示される
- 正面候補、yaw 正方向候補、yaw 負方向候補、pitch 正方向候補、pitch 負方向候補を確認できる
- 代表フレーム候補カテゴリをトグルで開閉できる
- 開いたカテゴリだけ候補カードが表示される
- 各カテゴリの候補件数が表示される
- 各候補に frame index / timestamp / yaw / pitch / roll / score / landmarks 数が表示される
- 解析 summary が代表フレーム候補の近くに表示される
- 抽出フレーム一覧が debug / 折りたたみ表示になっている
- JSON preview に `representativeFrameCandidates` のカテゴリごとの候補配列を表示できる
- 候補カードから正面 / 左向き / 右向き / 上向き / 下向き / 除外を選択できる
- 確定済み代表フレーム一覧を確認できる
- front / left / right / up / down の選択状態を確認できる
- 除外フレームが確定済み代表フレーム一覧に表示されないことを確認できる
- 確定済み代表フレームを解除または上書きできる
- JSON preview に `selectedRepresentativeFrames` を表示できる
- 3D推測準備状況に正面 / 左向き / 右向き / 上向き / 下向きだけが表示されることを確認できる
- 確定済み代表フレームから 3D推測用データセットが作られる
- 詳細スキャンが実行される
- 詳細スキャン summary が表示される
- 候補以外の詳細スキャンフレームが大量表示されていない
- JSON preview に `scanSummary` が表示される
- 候補サムネイル、確定済み代表フレームサムネイル、dataset entry サムネイルがトリムされず全体表示される
- front / left / right / up / down の readiness が表示される
- excluded が 3D推測用データセットに含まれない
- dataset entry に label / frame index / timestamp / pose / landmarks 数 / status / landmark preview が表示される
- JSON preview に `idealLandmarks3DInferenceDataset` の概要を表示できる
- 478 landmarks 全文を JSON preview に出していない
- サムネイル data URL 全文を JSON preview に出していない
- Step 2-G では front が ready の場合に `idealLandmarks3D` 478点候補を生成できる
- Step 2-G では front が missing / invalid の場合に 3D候補を生成できないことを表示できる
- Step 2-G の JSON preview は `idealLandmarks3DCandidate` の概要と先頭 5 点程度の preview に留め、478点全文やサムネイル data URL 全文を出さない
- Step 2-H では 3D候補未生成時に未生成メッセージが表示される
- Step 2-H では 3D候補生成後に 3D 478点候補を点群として preview 表示できる
- Step 2-H では正面 / 横 / 上 の preset button が同じ canvas の preview camera を変更する
- Step 2-H ではドラッグで視点回転、ホイールで zoom、Shift + ドラッグで pan、ダブルクリックまたは reset button で初期視点へ戻れる
- Step 2-H の preview camera 操作や表示補正で `idealLandmarks3D` 候補データ自体や JSON preview の値を変更しない
- Step 2-H では点群が preview 範囲内に収まる
- Step 2-H では landmark count、x / y / z の min / max、average / min / max confidence が表示される
- Step 2-H の JSON preview は `idealLandmarks3DCandidate` の概要と先頭 5 点程度の preview に留め、478点全文や canvas data URL を出さない
- 3D点群 preview は debug / 確認用であり、preview camera 操作、y 軸反転、z 表示倍率調整は表示専用として扱う。`idealLandmarks3D` 候補データ自体は変更せず、本格 3D editor、手動微調整、保存 / export、複数画像入力を Step 2-H に含めていない
- Engine Runtime に動画入力、フレーム抽出、Authoring 用フレーム解析、代表フレーム抽出、手動ラベル確定、dataset 作成処理を追加していない

PR 本文には IdealFace Authoring Tool の手動確認事項を記載します。

## IdealFace Authoring Tool Step 2-F 改良の確認

Step 2-F 改良では、詳細スキャン間隔を `0.1` 秒にし、最大スキャン数の上限を残します。候補は上位5件だけに限定せず、`front` / `yawPositive` / `yawNegative` / `pitchPositive` / `pitchNegative` ごとに条件に合うものを保持します。

確認観点:

- UI の `scanSummary` と JSON preview に `scanIntervalSec` / `candidateCounts` / `excludedCandidateCount` が表示される
- 候補カテゴリトグル内に複数候補が表示され、順位ではなく `score` が表示される
- pitch / yaw の片方に多少のズレがあっても候補として拾われる
- 除外した候補は候補 UI 一覧から外れ、`selectedRepresentativeFrames.excluded` には残る
- 除外候補は確定済み代表フレーム一覧、3D推測準備状況、`idealLandmarks3DInferenceDataset` に含まれない
- JSON preview の `representativeFrameCandidates` に `rank`、478 landmarks 全文、サムネイル data URL 全文が出ない
- 3D点群 preview は Step 2-H で確認用として扱い、視点回転、zoom、pan は preview camera の操作として実装します。y 軸反転や z 表示倍率調整も preview 表示専用であり、`idealLandmarks3D` 候補データ自体や JSON preview の値は変更しません。手動微調整、保存 / export、複数画像入力は Step 2-F / Step 2-G / Step 2-H に含めません。
- Engine Runtime と Beauty Studio に詳細スキャンや候補振り分け処理を追加しない

## IdealFace Authoring Tool Step 2-G の確認

Step 2-G では、`idealLandmarks3DInferenceDataset` から `idealLandmarks3D` 478点候補を生成します。v1 は厳密な 3D reconstruction ではなく、front の 2D 478 landmarks を x / y の基準にし、left / right / up / down との差分から z を簡易推定する仮の候補生成です。不足している代表フレームは confidence を下げる要素として扱います。

確認観点:

- front が ready の場合に 3D候補を生成できる
- front が missing / invalid の場合に生成不可として表示される
- 生成結果 summary に状態、landmark 数、ready labels、missing labels、average / min / max confidence が表示される
- landmark preview は先頭 5 点程度に留める
- JSON preview に `idealLandmarks3DCandidate` が表示される
- JSON preview に 478 landmarks 全文やサムネイル data URL 全文を出さない
- 生成結果は完成済み IdealFace asset ではなく候補データとして扱う
- 3D点群 preview は Step 2-H で追加済み。手動微調整、保存 / export はまだ実装しない
- Engine Runtime と Beauty Studio に 3D推測処理や Authoring 用 UI を追加しない

## IdealFace Authoring Tool Step 2-H の確認

Step 2-H では、生成済みの `idealLandmarks3D` 478点候補を Authoring Tool 上の debug / 確認用 preview として表示します。本格 3D editor ではなく、点群が顔らしい形になっているかを目視確認するための interactive 3D point cloud preview です。1 つの canvas 上で preview camera を操作し、生成済み 3D 候補データ自体や JSON preview の値は変更しません。

確認観点:

- 3D候補未生成時に「3D 478点候補がまだ生成されていません。」の案内が表示される
- 3D候補生成後に 478点候補が点群として表示される
- ドラッグで視点回転、ホイールで zoom、Shift + ドラッグで pan できる
- 正面 / 横 / 上の preset button が同じ canvas の preview camera を変更する
- 点群が preview 範囲内に収まる
- confidence が低い点が薄く表示される
- landmark count、視点、x / y / z の min / max、average / min / max confidence が表示される
- JSON preview に 478点全文や canvas data URL を出さない
- 手動微調整、保存 / export、複数画像入力はまだ実装しない
- Engine Runtime と Beauty Studio に 3D点群 preview や Authoring 用 UI を追加しない
