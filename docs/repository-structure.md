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

`tools/*` は現在未実装です。

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

IdealFace Authoring Tool では、動画または複数画像から各フレームの 2D 478 landmarks と `FacePose` を取得し、yaw / pitch / roll から代表フレーム候補を自動抽出します。ユーザーが正面 / 左向き / 右向き / 上向き / 下向き / 除外を手動確定し、確定した代表フレーム群から `idealLandmarks3D` 478点候補を自動推測します。

自動推測した 3D点群は候補データとして扱い、Authoring Tool 上で確認、必要箇所を手動微調整してから IdealFace asset として保存 / export します。

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
- 動画 / 複数画像の入力
- フレーム抽出
- MediaPipe によるフレームごとの 2D 478 landmarks 取得
- 代表フレーム候補の自動抽出
- 手動ラベル確定 UI
- 3D 478点候補の自動推測
- 3D点群 preview
- 手動微調整
- 保存 / export

このツールは MediaPipe canonical face model そのものを作るツールではありません。Authoring Tool の編集処理や UI は Engine Runtime に混ぜません。
