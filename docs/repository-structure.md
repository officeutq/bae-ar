# リポジトリ構成

## 現在の構成

```text
bae-ar/
├─ packages/
│  └─ engine/
│     ├─ package.json
│     └─ src/
│        ├─ BeautyEngine.ts
│        ├─ types.ts
│        ├─ index.ts
│        └─ face/
│           ├─ FaceDetector.ts
│           ├─ FaceFrame.ts
│           ├─ FaceGeometry.ts
│           ├─ types.ts
│           └─ adapters/
│              └─ MediaPipeFaceDetector.ts
│
├─ apps/
│  └─ studio/
│     ├─ package.json
│     ├─ index.html
│     └─ src/
│        ├─ main.ts
│        ├─ services/
│        │  └─ CameraService.ts
│        └─ detectors/
│           └─ MockFaceDetector.ts
│
└─ docs/
   ├─ overview.md
   ├─ architecture.md
   ├─ development-flow.md
   ├─ repository-structure.md
   └─ bae_ar_beauty_engine_spec_and_roadmap_2026_05.md
```

## 将来予定の構成

```text
tools/
├─ ideal-face-authoring/
│  └─ IdealFace Authoring Tool
│
└─ layer-mask-authoring/
   └─ Layer Mask Authoring Tool
```

`tools/ideal-face-authoring` は Step 2-F まで実装済みです。`tools/layer-mask-authoring` は将来予定です。

## `packages/engine`

Engine Runtime として使う Beauty Engine SDK を置く場所です。

現在含まれるもの:

- `BeautyEngine`
- Engine の型定義
- `FaceDetector` interface
- `MediaPipeFaceDetector`
- `FaceFrame`
- `FaceGeometry`
- FacePose の実推定

将来追加予定:

- IdealFace の読み込み
- IdealFace Projection
- CorrectionPlan
- Shape Warp
- Color Processing
- Layer System
- LayerMaskSpec の読み込み
- renderer

Engine Runtime は UI を持ちません。debug 用 UI、一時的な検証 UI、Authoring Tool の編集処理はここに入れません。

## `apps/studio`

Engine Runtime を開発・検証・調整するための Beauty Studio を置く場所です。

現在含まれるもの:

- `CameraService`
- `BeautyEngine` 接続
- `MediaPipeFaceDetector` 接続
- debug 表示
- overlay 表示
- Copy Debug

Studio は配布対象ではありません。Studio は Engine Runtime の公開 API のみを使い、Engine 内部実装へ直接依存しません。

## `tools/ideal-face-authoring`

将来予定です。

IdealFace Authoring Tool を置く想定の場所です。

責務:

- BAE AR 独自の IdealFace canonical face / お面データの作成
- IdealFace プリセットの調整
- 手作業による調整
- 2D 動画 / 複数画像からのオフライン生成
- Runtime で読み込む IdealFace asset の出力

MediaPipe canonical face model そのものを作成・編集する場所ではありません。`natural_v1` の controlPoints は現段階の投影検証用データであり、IdealFace 本体ではありません。

IdealFace Authoring Tool では、将来的に動画または複数画像から各フレームの 2D 478 landmarks と `FacePose` を取得します。初期入力形式は MP4 動画のみとし、複数画像入力は将来対応とします。初期段階では入力形式を広げず、代表フレーム抽出とラベル確定の流れを優先します。

Step 2-A では、MP4 動画入力、metadata 表示、一定間隔でのフレーム抽出、サムネイル一覧表示、JSON preview への抽出フレーム情報表示までを実装済みです。Step 2-B では、抽出済みフレームの MediaPipe 解析、2D 478 landmarks と `FacePose` の取得、解析結果 summary と JSON preview への概要表示までを実装済みです。Step 2-C では、yaw / pitch / roll による代表フレーム候補の自動抽出、各カテゴリ上位複数件の候補一覧表示、JSON preview への候補概要表示までを実装済みです。Step 2-D では、候補カードから正面 / 左向き / 右向き / 上向き / 下向き / 除外を手動確定し、候補カテゴリを必要なものだけ開くトグル表示、確定済み代表フレーム一覧、3D推測準備状況、JSON preview の `selectedRepresentativeFrames` を確認できるようにしました。Step 2-E では、確定済み代表フレームから front / left / right / up / down の 3D推測用データセットを作成し、readiness summary、dataset 一覧、JSON preview の `idealLandmarks3DInferenceDataset` 概要を確認できるようにしました。Step 2-F では、候補抽出用の詳細スキャン、詳細スキャン summary、JSON preview の `scanSummary`、サムネイル全体表示を追加しました。確定済み代表フレーム一覧と3D推測用データセットには、正面 / 左向き / 右向き / 上向き / 下向きだけを表示します。

MP4 動画から表示用フレームを一定間隔で抽出し、候補抽出用には動画全体を 0.1 秒間隔、最大スキャン数の上限付きで詳細スキャンします。詳細スキャン済みフレームのうち、顔検出あり、landmarks 数 478、pose pitch / yaw / roll 取得済みのフレームから正面候補、yaw 正方向候補、yaw 負方向候補、pitch 正方向候補、pitch 負方向候補を各カテゴリに複数件保持します。全スキャンフレーム一覧は UI に表示せず、代表フレーム候補を中心に表示します。Step 2-D では、候補カテゴリを必要なものだけ開いて比較し、ユーザーが正面 / 左向き / 右向き / 上向き / 下向き / 除外を手動確定します。Step 2-E では、確定済み代表フレームから 3D推測用データセットを作成します。除外は代表フレームではないため確定済み代表フレーム一覧には表示せず、3D推測用データセットにも含めません。dataset は 2D 478 landmarks と FacePose を持つ入力データであり、まだ `idealLandmarks3D` 478点そのものではありません。dataset から `idealLandmarks3D` 478点候補を自動推測する流れは将来対応です。候補に採用されたフレームは手動確定と dataset 作成に使えるよう保持し、候補以外の詳細スキャンフレームは一覧表示しません。サムネイルはトリムせず画像全体を表示します。

自動推測した 3D点群は候補データとして扱い、Authoring Tool 上で確認、必要箇所を手動微調整してから IdealFace asset として保存 / export します。

推奨する MP4 動画は、H.264 / AVC codec、5〜15秒程度、30fps程度、720p程度から開始できるものです。顔が大きく写り、正面、左向き、右向き、上向き、下向きをゆっくり含み、手ブレが少なく、明るい場所で撮影され、口は閉じ気味、表情はできるだけ neutral なものを想定します。長時間動画、高解像度すぎる動画、HEVC / H.265、MOV、WebM、複数画像入力は初期段階では非推奨または未対応です。

この処理はリアルタイム Engine Runtime に含めません。

## `tools/layer-mask-authoring`

将来予定です。

Layer Mask Authoring Tool を置く想定の場所です。

責務:

- 色加工用 LayerMaskSpec の作成
- landmarks で囲う範囲の定義
- 除外領域の定義
- 膨張・収縮の定義
- feather / blur の定義
- Runtime で読み込む LayerMaskSpec の出力

この処理はリアルタイム Engine Runtime に含めません。

## `docs`

設計、仕様、ロードマップ、開発方針を残す場所です。

実装が変わった場合は、該当する docs / README / 仕様書 / ロードマップも更新します。

## `tools/ideal-face-authoring` Step 2-F 改良

Step 2-F 改良として、`tools/ideal-face-authoring` の詳細スキャンは `0.1` 秒間隔で実行します。長い動画で無制限に解析しないよう、最大スキャン数の上限は維持します。

詳細スキャンで解析されたフレームは、条件に合えば `front` / `yawPositive` / `yawNegative` / `pitchPositive` / `pitchNegative` の候補カテゴリへ保持します。候補は上位5件だけに絞らず、カテゴリごとの保持上限の範囲で広く残します。UI では候補カテゴリトグル内に候補を表示し、候補カードには順位ではなく `score` を表示します。

候補条件は緩め、pitch / yaw の片方に多少のズレがあっても候補として拾います。除外した候補は UI 候補一覧から外しますが、`selectedRepresentativeFrames.excluded` として状態 / JSON preview に残せます。除外候補は確定済み代表フレーム一覧、3D推測準備状況、`idealLandmarks3DInferenceDataset` には含めません。

3D 478点候補の自動推測、3D点群 preview、手動微調整、保存 / export、複数画像入力はまだ未実装です。詳細スキャンや候補振り分け処理は IdealFace Authoring Tool 配下に置き、`packages/engine/src` や `apps/studio/src` へ入れません。

## 配布方針

配布対象は Engine Runtime のみです。

配布物に含めないもの:

- `apps/studio`
- `tools/ideal-face-authoring`
- `tools/layer-mask-authoring`
- `docs`
- 開発用 debug UI
- サンプルや検証ツール

## 今後の構成変更

IdealFace / CorrectionPlan / Layer System / LayerMaskSpec は未実装です。追加する場合も、Engine Runtime の責務と Authoring Tool の責務を分け、Studio からは公開 API 経由で確認できるようにします。

## `tools/ideal-face-authoring` Step 1

`tools/ideal-face-authoring` は IdealFace Authoring Tool の最小雛形として実装済みです。BAE AR 独自の IdealFace asset を作るための独立ツールであり、`apps/studio` には Authoring 用タブを追加しません。

Step 1 の範囲:

- Engine Runtime の公開 export から `natural_v1` を読み込む
- preset id / name / version / coordinateSpace / control point count を表示する
- controlPoints の id / label / x / y / z を一覧表示する
- x / y を使った 2D preview を表示する
- 読み込んだ IdealFace asset の JSON preview を表示する

未実装:

- ドラッグ編集
- 手動ラベル確定 UI
- 3D 478点候補の自動推測
- 3D点群 preview
- 手動微調整
- 保存 / export
- 複数画像入力

このツールは MediaPipe canonical face model そのものを作るツールではありません。Authoring Tool の編集処理や UI は Engine Runtime に混ぜません。

## `tools/ideal-face-authoring` Step 2-A

Step 2-A の範囲:

- MP4 動画ファイルを選択する
- 選択した MP4 を `<video>` と Object URL で読み込む
- `duration` / `videoWidth` / `videoHeight` を表示する
- 1秒ごと、または最大 20 フレーム程度に抑えて canvas へ抽出する
- 抽出したフレームをサムネイル一覧で表示する
- 各フレームに frame index / timestamp / 状態「未解析」を表示する
- JSON preview に file name / duration / videoWidth / videoHeight / extracted frame count / frames を表示する

初期対応は MP4 動画のみです。複数画像入力は未実装 / 将来対応です。Step 2-A 時点では MediaPipe による 2D 478 landmarks 取得と FacePose 取得は未実装でしたが、Step 2-B で抽出済みフレームの解析まで追加済みです。Step 2-C で代表フレーム候補抽出、Step 2-D で手動ラベル確定 UI、Step 2-E で3D推測用データセット作成、Step 2-F で候補抽出用の詳細スキャンまで追加済みです。3D 478点推測、3D点群 preview、手動微調整、保存 / export はまだ未実装です。

動画入力とフレーム抽出は IdealFace Authoring Tool の責務であり、Engine Runtime には追加しません。

## `tools/ideal-face-authoring` Step 2-B

Step 2-B の範囲:

- 抽出済みフレームに MediaPipe Face Landmarker 解析を実行する
- 各フレームから 2D 478 landmarks と `FacePose` を取得する
- 各フレームに解析状態、landmarks 数、pose pitch / yaw / roll を表示する
- 解析結果 summary に解析済み数、顔検出あり / なし、解析エラー数、yaw / pitch / roll 範囲を表示する
- JSON preview に video file name、extracted frame count、analyzed frame count、detected frame count、failed frame count、frame ごとの解析概要を表示する
- JSON preview には 478 landmarks 全文を出さず、先頭 5 点までの `landmarkPreview` に留める

未実装:

- 手動ラベル確定 UI
- 3D 478点候補の自動推測
- 3D点群 preview
- 手動微調整
- 保存 / export
- 複数画像入力

動画入力、フレーム抽出、Authoring 用フレーム解析は IdealFace Authoring Tool の責務であり、Engine Runtime には追加しません。

## `tools/ideal-face-authoring` Step 2-C

Step 2-C の範囲:

- 顔検出あり、landmarks 数 478、pose pitch / yaw / roll 取得済みの解析済みフレームだけを候補評価に使う
- yaw / pitch / roll から正面候補、yaw 正方向候補、yaw 負方向候補、pitch 正方向候補、pitch 負方向候補を各カテゴリ上位複数件抽出する
- 候補一覧にサムネイル、frame index、timestamp、yaw / pitch / roll、score、landmarks 数を表示する
- 候補がない場合に「候補なし」を表示する
- 解析 summary を代表フレーム候補の近くに表示する
- 代表フレーム候補を主表示にし、抽出フレーム一覧を debug / 折りたたみ表示として扱う
- JSON preview に `representativeFrameCandidates` としてカテゴリごとの候補配列を表示する
- JSON preview には 478 landmarks 全文やサムネイル data URL 全文を出さない

未実装:

- 3D 478点候補の自動推測
- 3D点群 preview
- 手動微調整
- 保存 / export
- 複数画像入力

将来的に解析対象フレームが増えても、ユーザーには代表フレーム候補を中心に見せます。代表フレーム抽出処理と Authoring 用 UI は IdealFace Authoring Tool の責務であり、Engine Runtime には動画入力、フレーム抽出、代表フレーム抽出、Authoring UI を追加しません。

## `tools/ideal-face-authoring` Step 2-D

Step 2-D の範囲:

- 候補カードから正面 / 左向き / 右向き / 上向き / 下向き / 除外を選択する
- 正面候補、yaw 正方向候補、yaw 負方向候補、pitch 正方向候補、pitch 負方向候補をカテゴリごとに開閉する
- 開いたカテゴリだけ候補カードを表示し、候補件数を表示する
- 正面 / 左向き / 右向き / 上向き / 下向きは各 1 件を確定し、同じラベルに別候補を選ぶと上書きする
- 除外フレームは複数件確定し、状態や JSON preview / debug 情報として保持する
- 確定済み代表フレーム一覧では正面 / 左向き / 右向き / 上向き / 下向きだけを表示する
- 除外は代表フレームではないため、確定済み代表フレーム一覧には表示しない
- 確定済み代表フレームを解除できる
- 3D推測準備状況として正面 / 左向き / 右向き / 上向き / 下向きの選択状態だけを表示する
- JSON preview に `selectedRepresentativeFrames` を表示する
- `representativeFrameCandidates` は引き続き JSON preview に表示する
- JSON preview には 478 landmarks 全文やサムネイル data URL 全文を出さない

未実装:

- 3D 478点候補の自動推測
- 3D点群 preview
- 手動微調整
- 保存 / export
- 複数画像入力

手動ラベル確定 UI は IdealFace Authoring Tool の責務であり、Engine Runtime や Beauty Studio には追加しません。

## `tools/ideal-face-authoring` Step 2-E

Step 2-E の範囲:

- 確定済み代表フレームから 3D推測用データセットを作成する
- front / left / right / up / down を dataset 対象にする
- excluded は 3D推測用データセットに含めない
- 未選択ラベルを `missing`、対応する解析済みフレームがない状態を `invalid`、2D 478 landmarks と FacePose が揃う状態を `ready` として扱う
- readiness summary と ready 数を表示する
- dataset entry に label / frame index / timestamp / pose / landmarks 数 / status / 先頭数点の landmark preview を表示する
- JSON preview に `idealLandmarks3DInferenceDataset` の概要を表示する
- JSON preview には 478 landmarks 全文やサムネイル data URL 全文を出さない

Step 2-E の dataset は、3D の `idealLandmarks3D` 478点候補を推測するための入力データセットです。まだ `idealLandmarks3D` 478点そのものではありません。

未実装:

- 3D 478点候補の自動推測
- 3D点群 preview
- 手動微調整
- 保存 / export
- 複数画像入力

dataset 作成処理は IdealFace Authoring Tool の責務であり、Engine Runtime や Beauty Studio には追加しません。

## `tools/ideal-face-authoring` Step 2-F

Step 2-F の範囲:

- 表示用抽出フレームとは別に、候補抽出用として MP4 動画全体を 0.1 秒間隔、最大スキャン数の上限付きで詳細スキャンする
- 詳細スキャン済みフレームのうち、顔検出あり、landmarks 数 478、FacePose 取得済みのフレームを候補評価に使う
- yaw / pitch / roll から正面候補、yaw 正方向候補、yaw 負方向候補、pitch 正方向候補、pitch 負方向候補を各カテゴリに複数件保持する
- 全スキャンフレーム一覧は UI に表示せず、代表フレーム候補中心に表示する
- 候補に採用されたフレームは、サムネイル、frame index、timestamp、pose、2D 478 landmarks、landmark preview を保持し、手動確定と 3D推測用 dataset 作成に使う
- 詳細スキャン summary と JSON preview の `scanSummary` を表示する
- 候補カード、確定済み代表フレーム、dataset entry のサムネイルをトリムせず全体表示する

未実装:

- 3D 478点候補の自動推測
- 3D点群 preview
- 手動微調整
- 保存 / export
- 複数画像入力

詳細スキャン処理は IdealFace Authoring Tool の責務です。Engine Runtime には動画入力、フレーム抽出、詳細スキャン、Authoring 用フレーム解析、代表フレーム抽出、手動ラベル確定、dataset 作成処理を入れません。Beauty Studio にも Authoring 用タブは追加しません。
