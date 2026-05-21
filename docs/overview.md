# BAE AR 概要

## BAE AR とは

BAE AR は、Web 上でリアルタイム顔加工・AR 表現を行う Beauty Engine SDK と、その開発・検証を行う Beauty Studio を含むプロジェクトです。

目標は、顔を単純な 2D 点群として動かすのではなく、現在の顔の構造・姿勢・表情を読み取り、自然で破綻しにくい補正を行う Engine SDK を作ることです。

## 役割

```text
BAE AR

├─ Engine SDK
│  └─ 本番サービスから利用する UI なしの Beauty Engine
│
└─ Beauty Studio
   └─ Engine SDK を開発・検証・調整するための開発ツール
```

Engine SDK は本番利用される中核ライブラリです。Studio は Engine を育てるための環境であり、配布対象には含めません。

## 現在の到達点

現在の実装は、カメラ映像を `HTMLVideoElement` として取得し、`BeautyEngine.setInput()` に渡し、MediaPipe Face Landmarker を使って `FaceFrame` を更新する段階です。

Studio では、Engine の公開 API から取得できる `FaceFrame` / `FaceGeometry` / debug 情報を表示し、landmarks と補助 geometry point を overlay で確認できます。

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

この流れは現在の実コードで確認済みです。

## 変形加工の方針

shape processing は、個別パーツを独立して大きく変える方向にはしません。

基本方針:

- 現在 landmarks を入力として扱う。
- IdealFace は複数プリセットを持つ理想 3D 顔として設計する。
- 理想 3D 顔を現在姿勢へ投影し、理想 2D landmarks を得る。
- 現在 landmarks を理想 2D landmarks へ、顔全体として少し寄せる。
- 顎だけ、目だけ、鼻だけなどの個別パーツ加工を増やさない。

`FaceGeometry` は顔サイズ正規化・安定化・debug などの補助情報です。変形加工の主役は、現在 landmarks と、現在姿勢に投影された IdealFace 側の理想 2D landmarks です。

## ドキュメントの読み方

- 現在の実装状況とロードマップは [仕様書とロードマップ](bae_ar_beauty_engine_spec_and_roadmap_2026_05.md) を参照してください。
- Engine / Studio の責務分離は [アーキテクチャ](architecture.md) を参照してください。
- 実装時の進め方は [開発フロー](development-flow.md) を参照してください。
