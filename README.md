# BAE AR

## IdealFace Authoring Tool cleanup status

Current active authoring flow is MP4 input -> detailed scan -> Step 2-I-A frame selection -> Step 2-I-B pose-aware inference dataset -> Step 2-I-C `pose_aware_weighted_z_v1` candidate generation -> Step 2-H `currentCandidate` point cloud preview -> IdealFace asset JSON export v1.

The old Step 2-C to 2-G v1 five-pose UI/state/JSON preview has been removed from the current tool surface. `selectedRepresentativeFrames`, `idealLandmarks3DInferenceDataset`, `representativeFrameCandidates`, and `legacy.step2Gv1` are no longer exposed in the UI or JSON preview. The JSON preview is organized around `activeSummary`, `poseAware`, `currentCandidate`, `reference`, and `debug`.

The old Step 2-G v1 generation helper path has been removed from the current code. 3D candidate generation is now centered on Step 2-I-C `pose_aware_weighted_z_v1`; the old five-pose path can be referenced from Git history when needed. IdealFace JSON export v1 downloads the generated `currentCandidate` as `ideal_face_asset_v1` with the full 478 `idealLandmarks3D` points while keeping the in-app JSON preview limited to summary and preview data. New features such as confidence debug, manual adjustment, save, and import should be added only to the Step 2-I active workflow, not to legacy/debug paths.

## IdealFace Authoring Tool coordinate normalization

`tools/ideal-face-authoring` now applies `video_aspect_same_unit_v1` coordinate normalization for Step 2-I-C `pose_aware_weighted_z_v1`. MediaPipe image-normalized x/y are converted to face-centered same-unit coordinates with `xScale = videoWidth / videoHeight` and `yScale = 1` before roll correction, front reference base generation, observation dx/dy comparison, and z hint inference.

Downloaded `ideal_face_asset_v1` JSON keeps `schemaVersion` and `coordinateSpace` unchanged, while `idealLandmarks3D` x/y/z values now come from the normalized coordinate space. The UI and in-app JSON preview still report video aspect ratio, raw image-normalized bounds, same-unit bounds, current candidate bounds, and aspect ratio debug. Runtime Projection keeps rotate + translate + uniform scale alignment only.

## Engine ideal_face_asset_v1 loading foundation

`packages/engine` now exposes TypeScript types, validation helpers, a JSON parse helper, and a conversion helper for Authoring Tool export JSON with `schemaVersion: "ideal_face_asset_v1"`.

This is only the Runtime loading foundation. Full 478-point projection, Studio file import UI, and Authoring Tool generation logic are not included in Engine Runtime.

## Studio ideal_face_asset_v1 import

`apps/studio` can select an `ideal_face_asset_v1` JSON file exported by the Authoring Tool, validate it through the Engine helper, convert it to an `IdealFace`, and apply it with `BeautyEngine.setIdealFace()`.

This only verifies asset import and Engine reflection. Full 478-point Projection, Studio overlay for projected ideal landmarks, and Authoring Tool generation logic are still not included.

## idealLandmarks3D Projection v1

`packages/engine` now exposes a Runtime Projection v1 helper for loaded IdealFace assets with 478 `idealLandmarks3D` points. It rotates the ideal 3D landmarks by the current `FacePose` and returns projected ideal 2D landmarks plus x / y / z range summary.

`apps/studio` can show the 478-point Projection status, landmark count, and x / y / z ranges in debug output, and draws the projected ideal landmarks as small overlay points when available. Current-vs-ideal difference, `CorrectionPlan`, and Shape Warp are still not implemented.

`idealLandmarks3D` Projection v1 also applies a face center / uniform scale alignment when current face geometry or landmarks are available. The aligned result includes alignment mode, scale, translation, current / projected centers, current / projected sizes, and aspect ratio debug values for Studio debug and Copy Debug. The v1 alignment keeps the IdealFace aspect ratio intact; it does not scale x / y separately or reshape the asset to match the current face.

Projection debug also reports bounds and aspect ratios for the source asset, rotated projection, aligned projection, current landmarks, and Studio overlay pixel positions. These values are investigation-only: runtime alignment remains rotate + translate + uniform scale, while any future shape adjustment belongs in IdealFace Authoring Tool manual adjustment rather than runtime non-uniform scaling.

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
  理想 3D 顔プリセットを作成する authoring tool
  Step 2-I-C まで実装済み
  リアルタイム Engine Runtime には含めない

Layer Mask Authoring Tool
  色加工用 LayerMaskSpec を作成する将来ツール
  リアルタイム Engine Runtime には含めない
```

現在のリポジトリでは、`packages/engine`、`apps/studio`、`tools/ideal-face-authoring` が実装済み領域です。

```text
packages/engine
  Engine Runtime として使う Beauty Engine SDK

apps/studio
  Engine Runtime を開発・検証・調整する Beauty Studio

docs
  設計・仕様・ロードマップ

tools/ideal-face-authoring
  IdealFace Authoring Tool。Step 2-I-C まで実装済み
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
- FacePose の実推定
- IdealFace v1 型定義
- Natural v1 最小プリセット
- IdealFace 公開 API
- IdealFace Projection v1 の controlPoints 投影
- Projection Difference Debug v1
- Studio overlay / debug / Copy Debug 関連
- IdealFace Authoring Tool Step 1: `natural_v1` metadata / controlPoints / 2D preview / JSON preview
- IdealFace Authoring Tool Step 2-A: MP4 動画入力、metadata 表示、フレーム抽出、サムネイル一覧表示
- IdealFace Authoring Tool Step 2-B: 抽出フレームの MediaPipe 解析、2D 478 landmarks / FacePose 取得、解析 summary 表示
- IdealFace Authoring Tool Step 2-I-A/B/C: detailed scan の結果から frame selection、pose-aware inference dataset、`pose_aware_weighted_z_v1` candidate generation へ進む active workflow
- IdealFace Authoring Tool Step 2-H: Step 2-I-C で生成した `currentCandidate` を interactive 3D point cloud preview として確認

## IdealFace Authoring Tool active workflow and removed legacy path

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

legacy / debug と分類した UI や helper には、今後の新機能を追加しません。confidence debug、手動微調整 UI、保存 / export は Step 2-I active workflow 側に追加します。

Still planned:

- confidence debug
- manual adjustment UI
- save / export
- multiple image input
- Runtime idealLandmarks3D loading / projection completion

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

## IdealFace Authoring Tool Step 2-I active workflow

詳細スキャンは Step 2-I-A の frame selection に渡す observation source です。表示用の粗いフレーム抽出や Step 1 の 6 controlPoints は reference / debug として扱い、active authoring の中心には置きません。

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

Step 2-H は、Step 2-I-C で生成された `currentCandidate` を確認する interactive 3D point cloud preview です。preview camera、y 軸反転、z 表示倍率は表示専用であり、candidate data 自体は変更しません。

Current JSON preview:

```text
activeSummary
poseAware
currentCandidate
reference
debug
```

`currentCandidate` は Step 2-H preview に表示される現在の candidate です。`generationMethod` は `pose_aware_weighted_z_v1` で、478 landmarks 全文は出さず、summary と先頭数点 preview に留めます。`natural_v1` の 6 controlPoints は reference / projection debug 用であり、IdealFace 本体は `idealLandmarks3D` 478点です。

## ドキュメント

- [概要](docs/overview.md)
- [アーキテクチャ](docs/architecture.md)
- [開発フロー](docs/development-flow.md)
- [リポジトリ構成](docs/repository-structure.md)
- [仕様書とロードマップ](docs/bae_ar_beauty_engine_spec_and_roadmap_2026_05.md)

## IdealFace Authoring Tool Step 1 / Step 2-A / Step 2-B

Step 1 の `natural_v1` metadata と 6 controlPoints は reference / projection debug 用です。IdealFace 本体は `idealLandmarks3D` 478点です。

Step 2-A は MP4 動画入力、metadata 確認、表示用の粗いフレーム抽出を扱います。表示用抽出フレームは debug / metadata 確認用であり、Step 2-I の observation source ではありません。

Step 2-B は MediaPipe による 2D 478 landmarks と FacePose の取得を扱います。その後続は旧 Step 2-C〜2-G ではなく、detailed scan から Step 2-I-A/B/C の pose-aware workflow へ進みます。

## IdealFace Authoring Tool removed Step 2-C to 2-G v1 history

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

Step 2-A / 2-B の動画入力、metadata 確認、MediaPipe 解析は残します。ただし、その後続は旧 Step 2-C〜2-G ではなく、detailed scan から Step 2-I-A/B/C の pose-aware workflow へ進みます。

legacy / debug と分類した UI や helper には、今後の新機能を追加しません。confidence debug、手動微調整 UI、保存 / export は Step 2-I active workflow 側に追加します。

## IdealFace Authoring Tool の idealLandmarks3D 作成方針

IdealFace の本体である `idealLandmarks3D` 478点は、IdealFace Authoring Tool 側で作成します。現在の入力は MP4 動画で、複数画像入力は将来対応です。

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

この処理は完全自動生成ではなく、自動推定 + 将来の手動補正として扱います。動画入力、詳細スキャン、pose-aware dataset 作成、candidate generation、3D point cloud preview は IdealFace Authoring Tool の責務であり、Engine Runtime には含めません。Engine Runtime は完成済み IdealFace asset を読み込み、現在の `FacePose` へ投影して使います。

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

Still planned:

- confidence debug
- manual adjustment UI
- save / export
- multiple image input
- Runtime idealLandmarks3D loading / projection completion
