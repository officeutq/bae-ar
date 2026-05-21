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

将来追加予定:

- FacePose の実推定
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

- IdealFace 3D model の作成
- IdealFace プリセットの調整
- 手作業による調整
- 2D 動画 / 複数画像からのオフライン生成
- Runtime で読み込む IdealFace asset の出力

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
