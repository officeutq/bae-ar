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
  理想 3D 顔プリセットを作成する将来ツール
  リアルタイム Engine Runtime には含めない

Layer Mask Authoring Tool
  色加工用 LayerMaskSpec を作成する将来ツール
  リアルタイム Engine Runtime には含めない
```

現在のリポジトリでは、実装済み領域は主に `packages/engine` と `apps/studio` です。

```text
packages/engine
  Engine Runtime として使う Beauty Engine SDK

apps/studio
  Engine Runtime を開発・検証・調整する Beauty Studio

docs
  設計・仕様・ロードマップ
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

未実装 / 将来予定:

- FacePose の実推定
- IdealFace
- IdealFace Projection
- CorrectionPlan
- Shape Warp
- Color Processing
- Layer System
- LayerMaskSpec
- IdealFace Authoring Tool
- Layer Mask Authoring Tool
- Butterflyve integration

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

## ドキュメント

- [概要](docs/overview.md)
- [アーキテクチャ](docs/architecture.md)
- [開発フロー](docs/development-flow.md)
- [リポジトリ構成](docs/repository-structure.md)
- [仕様書とロードマップ](docs/bae_ar_beauty_engine_spec_and_roadmap_2026_05.md)

## IdealFace Authoring Tool Step 1

`tools/ideal-face-authoring` を、BAE AR 独自の IdealFace asset を作るための独立ツールとして追加しました。Studio にタブは追加せず、Runtime 検証用の `apps/studio` と asset 作成用の authoring tool を分離しています。

Step 1 では Engine Runtime の公開 API から `natural_v1` を読み込み、metadata、`coordinateSpace`、controlPoints 一覧、2D preview、JSON preview を表示します。

未実装:

- controlPoints のドラッグ編集
- 保存 / export
- ideal 478 landmarks 生成
- canonical face mesh editor
- 2D 動画 / 複数画像からの 3D 顔生成

IdealFace Authoring Tool は MediaPipe canonical face model そのものを作るツールではありません。BAE AR 独自の IdealFace asset を作る作業場として扱い、編集処理や UI を Engine Runtime に混ぜません。

## IdealFace Authoring Tool の idealLandmarks3D 作成方針

IdealFace の本体である `idealLandmarks3D` 478点は、IdealFace Authoring Tool 側で動画または複数画像から作成する方針です。

```text
動画 / 複数画像を入力
  -> MediaPipe Face Landmarker で各フレームの 2D 478 landmarks と FacePose を取得
  -> yaw / pitch / roll から代表フレーム候補を自動抽出
  -> 人間が正面 / 左向き / 右向き / 上向き / 下向き / 除外を確定
  -> 確定した代表フレーム群から 3D の idealLandmarks3D 478点候補を自動推測
  -> Authoring Tool 上で 3D点群を確認
  -> 必要な箇所を手動で微調整
  -> IdealFace asset として保存 / export
```

この処理は完全自動生成ではなく、自動推測 + 手動補正として扱います。Engine Runtime は `idealLandmarks3D` を作成せず、完成済みの IdealFace asset を読み込んで、現在 `FacePose` へ投影して使います。

現時点では、動画 / 複数画像の入力、フレーム抽出、MediaPipe によるフレームごとの 2D 478 landmarks 取得、代表フレーム候補の自動抽出、手動ラベル確定 UI、3D 478点候補の自動推測、3D点群 preview、手動微調整、保存 / export は未実装です。
