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

## `packages/engine`

本番利用する Beauty Engine SDK を置く場所です。

現在含まれるもの:

- `BeautyEngine`
- Engine の型定義
- `FaceDetector` interface
- `MediaPipeFaceDetector`
- `FaceFrame`
- `FaceGeometry`

将来追加予定:

- IdealFace
- CorrectionPlan
- shape warp
- color processing
- Layer System
- renderer

Engine SDK は UI を持ちません。debug 用 UI や一時的な検証 UI はここに入れません。

## `apps/studio`

Engine SDK を開発・検証・調整するための Beauty Studio を置く場所です。

現在含まれるもの:

- `CameraService`
- `BeautyEngine` 接続
- `MediaPipeFaceDetector` 接続
- debug 表示
- overlay 表示
- Copy Debug

Studio は配布対象ではありません。Studio は Engine SDK の公開 API のみを使い、Engine 内部実装へ直接依存しません。

## `docs`

設計、仕様、ロードマップ、開発方針を残す場所です。

実装が変わった場合は、該当する docs / README / 仕様書 / ロードマップも更新します。

## 配布方針

配布対象は Engine SDK のみです。

配布物に含めないもの:

- `apps/studio`
- `docs`
- 開発用 debug UI
- サンプルや検証ツール

## 今後の構成変更

IdealFace / CorrectionPlan / Layer System は未実装です。追加する場合も、Engine SDK の責務として実装し、Studio からは公開 API 経由で確認できるようにします。
