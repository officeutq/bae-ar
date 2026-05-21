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

IdealFace は独自の理想 3D 顔モデルを本体とします。MediaPipe 478 landmarks そのものではありません。

MediaPipe canonical face model は、MediaPipe 側が landmark 検出や face geometry のために使う標準顔モデル、つまり MediaPipe 内部の標準顔お面です。BAE AR は MediaPipe の topology、landmark index、canonical model の考え方を参考にする可能性がありますが、MediaPipe canonical face model そのものを作成・編集対象にはしません。

BAE AR が作る IdealFace は、BAE AR 独自の理想顔空間です。「こう寄せたい」という理想顔を表す canonical face / お面データを IdealFace asset として管理します。MediaPipe 標準顔 = BAE AR 理想顔、とはしません。MediaPipe は検出側の基準、BAE AR IdealFace は補正・比較側の基準です。

ただし、Engine Runtime で current face と比較するため、IdealFace から MediaPipe 478 landmarks と対応する ideal 478 landmarks を生成できる必要があります。shape processing は current 478 landmarks と ideal 478 landmarks を比較して進みます。

2D 動画 / 複数画像から IdealFace を作る処理は、リアルタイム処理ではなく IdealFace Authoring Tool の責務です。IdealFace Authoring Tool は BAE AR 独自の IdealFace asset を作成・調整するツールであり、MediaPipe canonical face model そのものを作るツールではありません。最初は `natural_v1` の controlPoints を編集・保存・出力する最小ツールとして始め、将来的に canonical face mesh、ideal landmark mapping、ideal 478 landmarks 生成へ進む可能性があります。

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

ドラッグ編集、保存、ideal 478 landmarks 生成、canonical face mesh editor、2D 動画 / 複数画像からの 3D 顔生成は未実装です。このツールは MediaPipe canonical face model そのものを作るツールではなく、Authoring Tool の編集処理を Engine Runtime に混ぜません。
