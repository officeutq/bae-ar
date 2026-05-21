# BAE AR

BAE AR は、リアルタイム顔加工・AR 表現を行うための Beauty Engine SDK と、その開発・検証を行う Beauty Studio を含むプロジェクトです。

目的は、単なるフィルターではなく、本番サービスに組み込める自然で破綻しにくい Beauty Engine を育てることです。

## 構成

```text
packages/engine
  本番利用する Beauty Engine SDK

apps/studio
  Engine SDK を開発・検証・調整するための Beauty Studio

docs
  設計・仕様・ロードマップ
```

現在は npm workspaces で `packages/engine` と `apps/studio` を同一リポジトリ内で管理しています。

## 基本方針

- Engine SDK は UI を持たない中核ライブラリです。
- Studio は Engine SDK を育てるための開発ツールです。
- Studio は Engine SDK の公開 API のみを利用します。
- Studio から Engine SDK の private/internal 実装へ直接依存しません。
- 配布対象は Engine SDK のみです。

## 現在の実装状況

実装済み:

- `BeautyEngine` の基本ライフサイクル: `initialize()` / `start()` / `stop()` / `dispose()`
- 入力保持: `setInput()` / `getInput()`
- `FaceDetector` 差し替え: `setFaceDetector()` / `getFaceDetector()`
- `HTMLVideoElement` 入力に対する FaceFrame ループ
- `MediaPipeFaceDetector` による MediaPipe Face Landmarker 接続
- `FaceFrame` の更新: `detected` / `timestamp` / `landmarks` / `blendshapes` / `pose`
- `FaceGeometry` の補助解析: 目・口・鼻・顎・顔中心・顔サイズなど
- Studio 側のカメラ入力、debug 表示、landmark / geometry overlay

未実装:

- IdealFace
- CorrectionPlan
- Layer System
- 実際の shape warp / color processing / rendering
- FacePose の実推定
- プリセット管理

詳しくは [仕様書とロードマップ](docs/bae_ar_beauty_engine_spec_and_roadmap_2026_05.md) を参照してください。

## 現在の処理パイプライン

```text
Camera input
  -> HTMLVideoElement
  -> BeautyEngine.setInput()
  -> MediaPipeFaceDetector
  -> FaceFrame loop
  -> FaceFrame 更新
  -> Studio debug / overlay
```

`FaceFrame` は MediaPipe 由来の生データを扱う現在の検出結果です。`FaceGeometry` は補助情報であり、変形加工の中心には置きません。

## ドキュメント

- [概要](docs/overview.md)
- [アーキテクチャ](docs/architecture.md)
- [仕様書とロードマップ](docs/bae_ar_beauty_engine_spec_and_roadmap_2026_05.md)
- [開発フロー](docs/development-flow.md)
- [リポジトリ構成](docs/repository-structure.md)
