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
├─ tools/
│  └─ ideal-face-authoring/
│     ├─ package.json
│     └─ src/
│        └─ main.ts
│
└─ docs/
   ├─ overview.md
   ├─ architecture.md
   ├─ correction-profile-v1.md
   ├─ development-flow.md
   ├─ repository-structure.md
   └─ bae_ar_beauty_engine_spec_and_roadmap_2026_05.md
```

## 将来予定の構成

```text
tools/
└─ layer-mask-authoring/
   └─ Layer Mask Authoring Tool
```

`tools/ideal-face-authoring` は Step 2-I-A/B/C と Step 2-H まで実装済みです。`tools/layer-mask-authoring` は将来予定です。

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
- IdealFace v1 型定義
- Natural v1 最小プリセット
- IdealFace 公開 API
- idealLandmarks3D 478点 Projection
- current-vs-projected ideal 478点 difference debug

将来追加予定:

- correctionProfile v1 の型 / validator / fallback
- CorrectionPlan
- Shape Warp
- Color Processing
- Layer System
- LayerMaskSpec の読み込み
- renderer

Engine Runtime は UI を持ちません。debug 用 UI、一時的な検証 UI、Authoring Tool の編集処理はここに入れません。

Projection / Shape Warp へ向けた座標系方針として、Engine Runtime は完成済み IdealFace asset の `idealLandmarks3D` を same-unit coordinate として読み込み、`FacePose` に合わせて same-unit 空間で回転と face center / uniform scale alignment を行います。Runtime Projection alignment では x/y 別 scale を行わず、IdealFace の縦横比を現在顔に合わせて歪めません。Projection result は `sameUnitLandmarks` と `imageLandmarks` を分けて持ち、Studio overlay / current-vs-ideal difference / Shape Warp 入力へ渡す座標は image-normalized coordinate に変換します。Studio overlay は `imageLandmarks` を使います。最終的な描画や画像変形では pixel coordinate を使います。

`correctionProfile` v1 は `ideal_face_asset_v1` の optional top-level field として仕様化します。形状データである `idealLandmarks3D` とは分け、landmark ごとの `strength`、fallback、validation 方針を [correctionProfile v1](correction-profile-v1.md) に記載します。dx / dy は JSON に保存せず、Engine Runtime が毎フレーム計算します。

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

IdealFace Authoring Tool は、理想 3D 顔プリセットを作成する authoring tool です。現在の active workflow は Step 2-I-A/B/C と Step 2-H です。

Current active workflow:

```text
MP4 input
  -> detailed scan
  -> Step 2-I-A frame selection
       正面基準候補 / 推定に使うフレーム / 除外フレーム
  -> Step 2-I-B pose-aware inference dataset
  -> Step 2-I-C pose_aware_weighted_z_v1 candidate generation
       roll 補正
       yaw / pitch / weight による z hint
       idealLandmarks3D 478点候補生成
  -> Step 2-H currentCandidate point cloud preview
```

Removed legacy workflow:

旧 Step 2-C〜2-G v1 の 5ポーズ方式は過去の実装です。現在コードからは UI / state / JSON preview / generation helper を削除済みで、必要な場合は Git 履歴を参照します。現在の docs では、旧方式を現行の authoring 主導線として扱いません。

削除済みの代表例:

- old five-pose candidate UI
- `selectedRepresentativeFrames`
- `idealLandmarks3DInferenceDataset`
- `representativeFrameCandidates` / representative candidate UI and JSON preview
- `legacy.step2Gv1` JSON preview
- `buildIdealLandmarks3DCandidateResult()`
- `inferCandidateZ()`
- `inferCandidateConfidence()`
- `generationMethod: "step_2_g_v1"`

Current JSON preview:

```text
activeSummary
poseAware
currentCandidate
reference
debug
```

`currentCandidate` は Step 2-H preview に表示される現在の candidate です。`generationMethod` は `pose_aware_weighted_z_v1` で、478 landmarks 全文は出さず、summary と先頭数点 preview に留めます。`natural_v1` の 6 controlPoints は reference / projection debug 用であり、IdealFace 本体は `idealLandmarks3D` 478点です。

Authoring Tool の生成・編集処理は Engine Runtime / Beauty Studio に混ぜません。

`tools/ideal-face-authoring` は `video_aspect_same_unit_v1` による video aspect 補正、pose-aware generation、将来の manual adjustment UI を担当し、`idealLandmarks3D` を same-unit coordinate として生成します。Runtime / Beauty Studio は Authoring generation logic を持ちません。

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

- `correction-profile-v1.md`: `ideal_face_asset_v1` に追加予定の optional `correctionProfile` 仕様、fallback、validation、CorrectionPlan との関係
- `shape-warp-production-direction.md`: Shape Warp v1 debug prototype と production candidate の違い、WebGL mesh warp 方針、段階分け

## `tools/ideal-face-authoring` detailed scan

詳細スキャンは Step 2-I-A の frame selection に渡す observation source です。表示用抽出フレームは debug / metadata 確認用であり、active workflow の中心ではありません。

Current active workflow:

```text
MP4 input
  -> detailed scan
  -> Step 2-I-A frame selection
       正面基準候補 / 推定に使うフレーム / 除外フレーム
  -> Step 2-I-B pose-aware inference dataset
  -> Step 2-I-C pose_aware_weighted_z_v1 candidate generation
       roll 補正
       yaw / pitch / weight による z hint
       idealLandmarks3D 478点候補生成
  -> Step 2-H currentCandidate point cloud preview
```

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

IdealFace v1、Runtime 側の idealLandmarks3D 478点読み込み / 投影、current 478 landmarks と projected ideal 478 landmarks の difference debug、`correctionProfile` v1 foundation、CorrectionPlan v1 debug foundation、Studio 向け Shape Warp v1 debug prototype は実装済みです。Production Shape Warp、Layer System、LayerMaskSpec は未実装です。追加する場合も、Engine Runtime の責務と Authoring Tool の責務を分け、Studio からは公開 API 経由で確認できるようにします。

## `tools/ideal-face-authoring` Step 1 / Step 2-A / Step 2-B

Step 1 の `natural_v1` metadata と 6 controlPoints は reference / projection debug 用です。IdealFace 本体は `idealLandmarks3D` 478点です。

Step 2-A は MP4 動画入力、metadata 確認、表示用の粗いフレーム抽出を扱います。粗い抽出は debug / metadata 確認用で、Step 2-I の observation source ではありません。

Step 2-B は MediaPipe による 2D 478 landmarks と FacePose の取得を扱います。その後続は旧 Step 2-C〜2-G ではなく、detailed scan から Step 2-I-A/B/C へ進みます。

## `tools/ideal-face-authoring` removed Step 2-C to 2-G v1 history

Removed legacy workflow:

旧 Step 2-C〜2-G v1 の 5ポーズ方式は過去の実装です。現在コードからは UI / state / JSON preview / generation helper を削除済みで、必要な場合は Git 履歴を参照します。現在の docs では、旧方式を現行の authoring 主導線として扱いません。

削除済みの代表例:

- old five-pose candidate UI
- `selectedRepresentativeFrames`
- `idealLandmarks3DInferenceDataset`
- `representativeFrameCandidates` / representative candidate UI and JSON preview
- `legacy.step2Gv1` JSON preview
- `buildIdealLandmarks3DCandidateResult()`
- `inferCandidateZ()`
- `inferCandidateConfidence()`
- `generationMethod: "step_2_g_v1"`

legacy / debug と分類した UI や helper には、今後の新機能を追加しません。confidence debug、手動微調整 UI、保存 / export は Step 2-I active workflow 側に追加します。

## `tools/ideal-face-authoring` Step 2-H

Step 2-H は、Step 2-I-C で生成した `currentCandidate` を interactive 3D point cloud preview として確認する表示です。candidate data 自体は変更しません。

Current JSON preview:

```text
activeSummary
poseAware
currentCandidate
reference
debug
```

`currentCandidate` は Step 2-H preview に表示される現在の candidate です。`generationMethod` は `pose_aware_weighted_z_v1` で、478 landmarks 全文は出さず、summary と先頭数点 preview に留めます。`natural_v1` の 6 controlPoints は reference / projection debug 用であり、IdealFace 本体は `idealLandmarks3D` 478点です。

## IdealFace Authoring Tool Current Generation Path

`tools/ideal-face-authoring` now keeps 3D candidate generation on Step 2-I-C `pose_aware_weighted_z_v1`. The old Step 2-G v1 five-pose generation helper path has been removed from current code and remains available only through Git history.
