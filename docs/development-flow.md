# 開発フロー

## 基本方針

BAE AR は、Engine Runtime、Beauty Studio、IdealFace Authoring Tool、Layer Mask Authoring Tool を分けて開発します。

- Engine Runtime は本番でリアルタイム加工する中核 SDK です。
- Beauty Studio は Engine Runtime を開発・検証・調整するための開発ツールです。
- Studio は Engine Runtime の公開 API のみを使います。
- Studio から Engine Runtime の内部実装へ直接依存しません。
- IdealFace Authoring Tool と Layer Mask Authoring Tool は将来予定です。
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

IdealFace Authoring Tool は、BAE AR 独自の IdealFace asset を作成するための領域です。IdealFace の本体である `idealLandmarks3D` 478点は、Authoring Tool 側で将来的に動画または複数画像から作成する方針です。初期入力形式は MP4 動画のみとし、複数画像入力は将来対応とします。

初期段階では入力形式を広げず、MP4 動画からのフレーム抽出、代表フレーム候補の自動抽出、ユーザーによるラベル確定の流れを優先して作ります。Step 2-A では、MP4 動画入力と一定間隔でのフレーム抽出、サムネイル一覧表示までを実装済みです。Step 2-B では、抽出済みフレームの MediaPipe 解析、2D 478 landmarks と FacePose の取得、解析結果 summary 表示までを実装済みです。Step 2-C では、yaw / pitch / roll による代表フレーム候補の自動抽出、各カテゴリ上位複数件の候補一覧表示、JSON preview への候補概要表示、代表フレーム候補中心の UI 整理までを実装済みです。Step 2-D では、候補カードから正面 / 左向き / 右向き / 上向き / 下向き / 除外を手動確定し、候補カテゴリを必要なものだけ開くトグル表示、確定済み代表フレーム一覧、3D推測準備状況、JSON preview の `selectedRepresentativeFrames` を確認できるようにしました。確定済み代表フレーム一覧と3D推測準備状況には、正面 / 左向き / 右向き / 上向き / 下向きだけを表示します。

想定する流れ:

```text
MP4 動画を入力
  -> 一定間隔でフレーム抽出
  -> MediaPipe Face Landmarker で各フレームの 2D 478 landmarks と FacePose を取得
  -> yaw / pitch / roll から各カテゴリ上位複数件の代表フレーム候補を自動抽出
  -> 候補を複数比較する
  -> 人間が正面 / 左向き / 右向き / 上向き / 下向き / 除外を確定
  -> 確定した代表フレーム群から 3D の idealLandmarks3D 478点候補を自動推測
  -> Authoring Tool 上で確認・微調整
  -> IdealFace asset として保存 / export
```

推奨する MP4 動画は、H.264 / AVC codec、5〜15秒程度、30fps程度、720p程度から開始できるものです。顔が大きく写り、正面、左向き、右向き、上向き、下向きをゆっくり含み、手ブレが少なく、明るい場所で撮影され、口は閉じ気味で表情はできるだけ neutral なものを想定します。

長時間動画、高解像度すぎる動画、HEVC / H.265、MOV、WebM、複数画像入力は、初期段階では非推奨または未対応です。これらは将来対応を検討します。

この処理は完全自動生成ではなく、自動推測 + 手動補正として扱います。動画入力、フレーム抽出、Authoring 用フレーム解析は IdealFace Authoring Tool の責務です。Engine Runtime は動画入力やフレーム抽出、Authoring 用フレーム解析、`idealLandmarks3D` 作成を行わず、完成済みの IdealFace asset を読み込んで使います。

Step 2-C では候補 1 件だけで確定せず、正面候補、yaw 正方向候補、yaw 負方向候補、pitch 正方向候補、pitch 負方向候補を各カテゴリ上位複数件表示し、次の手動ラベル確定 UI へ進む土台にします。主画面では代表フレーム候補を中心に見せ、抽出フレーム一覧は debug / 折りたたみ表示として扱います。代表フレーム抽出処理と Authoring 用 UI は IdealFace Authoring Tool の責務であり、Engine Runtime には入れません。

Step 2-C で未実装のもの:

- 3D 478点候補の自動推測
- 3D点群 preview
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

Step 2-D でまだ未実装のもの:

- 3D 478点候補の自動推測
- 3D点群 preview
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

## IdealFace Authoring Tool Step 1 / Step 2-A / Step 2-B / Step 2-C / Step 2-D の確認

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
- 各候補に順位 / frame index / timestamp / yaw / pitch / roll / score / landmarks 数が表示される
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
- 478 landmarks 全文を JSON preview に出していない
- サムネイル data URL 全文を JSON preview に出していない
- 3D 478点候補の自動推測、3D点群 preview、手動微調整、保存 / export、複数画像入力を Step 2-D に含めていない
- Engine Runtime に動画入力、フレーム抽出、Authoring 用フレーム解析処理を追加していない

PR 本文には IdealFace Authoring Tool の手動確認事項を記載します。
