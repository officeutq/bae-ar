# BAE AR

## IdealFace Authoring Tool cleanup status

Current active authoring flow is MP4 input -> detailed scan -> Step 2-I-A frame selection -> Step 2-I-B pose-aware inference dataset -> Step 2-I-C `pose_aware_weighted_z_v1` candidate generation -> Step 2-H `currentCandidate` point cloud preview -> IdealFace asset JSON export v1.

The old Step 2-C to 2-G v1 five-pose UI/state/JSON preview has been removed from the current tool surface. `selectedRepresentativeFrames`, `idealLandmarks3DInferenceDataset`, `representativeFrameCandidates`, and `legacy.step2Gv1` are no longer exposed in the UI or JSON preview. The JSON preview is organized around `activeSummary`, `poseAware`, `currentCandidate`, `reference`, and `debug`.

The old Step 2-G v1 generation helper path has been removed from the current code. 3D candidate generation is now centered on Step 2-I-C `pose_aware_weighted_z_v1`; the old five-pose path can be referenced from Git history when needed. IdealFace JSON export v1 downloads the generated `currentCandidate` as `ideal_face_asset_v1` with the full 478 `idealLandmarks3D` points while keeping the in-app JSON preview limited to summary and preview data. New features such as confidence debug, manual adjustment, save, and import should be added only to the Step 2-I active workflow, not to legacy/debug paths.

## IdealFace Authoring Tool coordinate normalization

`tools/ideal-face-authoring` now applies `video_aspect_same_unit_v1` coordinate normalization for Step 2-I-C `pose_aware_weighted_z_v1`. MediaPipe image-normalized x/y are converted to face-centered same-unit coordinates with `xScale = videoWidth / videoHeight` and `yScale = 1` before roll correction, front reference base generation, observation dx/dy comparison, and z hint inference.

Downloaded `ideal_face_asset_v1` JSON keeps `schemaVersion` and `coordinateSpace` unchanged, while `idealLandmarks3D` x/y/z values now come from the normalized coordinate space. The UI and in-app JSON preview still report video aspect ratio, raw image-normalized bounds, same-unit bounds, current candidate bounds, and aspect ratio debug. Runtime Projection keeps rotate + translate + uniform scale alignment only.

## IdealFace Projection coordinate policy

- `idealLandmarks3D` is stored in same-unit coordinate space.
- Runtime Projection rotates and aligns IdealFace in same-unit space.
- Studio overlay and future Shape Warp use image-normalized / pixel coordinates.
- Projection result separates same-unit projected landmarks from image-normalized projected landmarks as `sameUnitLandmarks` and `imageLandmarks`.
- Studio overlay draws `imageLandmarks`; it does not draw same-unit landmarks directly with `canvasWidth` / `canvasHeight`.
- Runtime must not non-uniformly scale IdealFace to match the current face aspect ratio.
- Authoring Tool owns same-unit asset generation, video aspect correction, pose-aware generation, and future manual adjustment. Runtime owns loading finished IdealFace assets, projection, and conversion for overlay / difference / warp, but does not include authoring generation logic.
- Current-vs-projected ideal 478-point difference debug, `correctionProfile` foundation, `expressionAttenuation` foundation, CorrectionPlan v1 debug foundation, Shape Warp v1 debug prototype, and Studio processed preview-only WebGL mesh warp v1 prototype are implemented. Production Shape Warp and Runtime renderer integration remain unimplemented.

## Engine ideal_face_asset_v1 loading foundation

`packages/engine` now exposes TypeScript types, validation helpers, a JSON parse helper, and a conversion helper for Authoring Tool export JSON with `schemaVersion: "ideal_face_asset_v1"`.

This is only the Runtime loading foundation. Authoring Tool generation logic is not included in Engine Runtime.

## Studio ideal_face_asset_v1 import

`apps/studio` can select an `ideal_face_asset_v1` JSON file exported by the Authoring Tool, validate it through the Engine helper, convert it to an `IdealFace`, and apply it with `BeautyEngine.setIdealFace()`.

This verifies asset import, Engine reflection, and the 478-point Projection debug path. Authoring Tool generation logic is still not included.

## idealLandmarks3D Projection v1

`packages/engine` now exposes a Runtime Projection v1 helper for loaded IdealFace assets with 478 `idealLandmarks3D` points. It rotates the ideal 3D landmarks by the current `FacePose` and returns projected ideal 2D landmarks plus x / y / z range summary.

`apps/studio` can show the 478-point Projection status, landmark count, x / y / z ranges, current-vs-projected ideal 478-point difference debug output, CorrectionPlan debug summary, and Shape Warp v1 debug prototype summary. It draws projected ideal landmarks and debug overlays when available. Production Shape Warp is still not implemented.

`idealLandmarks3D` Projection v1 also applies a face center / uniform scale alignment when current landmarks are available. The alignment scale basis is `contain`: it compares current landmarks bbox width / height with the rotated projected ideal bbox width / height, calculates `widthRatio = currentWidth / projectedWidth` and `heightRatio = currentHeight / projectedHeight`, and uses the smaller ratio as the uniform scale. The v1 alignment keeps the IdealFace aspect ratio intact; it does not scale x / y separately or reshape the asset to match the current face.

Projection debug also reports bounds and aspect ratios for the source asset, rotated projection, aligned projection, current landmarks, Studio overlay pixel positions, and the contain scale basis values including width ratio, height ratio, limiting axis, and chosen scale. These values are investigation-only: runtime alignment remains rotate + translate + uniform scale, while production Shape Warp and any future production renderer integration are still not implemented.

## correctionProfile v1 specification

`correctionProfile` v1 is implemented as an optional top-level field for `ideal_face_asset_v1` assets. It keeps per-landmark correction `strength` separate from the shape data in `idealLandmarks3D`, does not store per-frame dx / dy, and defines fallback / validation policy used by the CorrectionPlan v1 debug foundation.

See [correctionProfile v1](docs/correction-profile-v1.md). Authoring Tool editing UI, correctionProfile export authoring, production Shape Warp, and production renderer integration remain outside this step.

## expression-aware correctionProfile direction

`correctionProfile` supports optional `expressionAttenuation` rules in the Engine foundation. These rules use MediaPipe blendshape scores such as `jawOpen`, `eyeBlinkLeft`, `eyeBlinkRight`, `eyeSquintLeft`, and `eyeSquintRight` to reduce `strengthScale` for affected landmark groups such as `mouth`, `left_eye`, `right_eye`, and `face_boundary`.

This is safety attenuation, not individual part editing. The Engine foundation includes fallback rules, validation, `halfLifeMs` smoothing, and CorrectionPlan `finalStrength` integration. Studio debug / Copy Debug can show expression attenuation summary. Authoring Tool UI, correctionProfile / expressionAttenuation export changes, expression target offsets, expression-specific IdealFace assets, and production renderer integration remain later work.

See [expression-aware correctionProfile](docs/expression-aware-correction-profile.md). Engine foundation and Studio debug / Copy Debug display are implemented. Authoring Tool UI, correctionProfile / expressionAttenuation export changes, WebGL changes, expression target offsets, expression-specific IdealFace assets, and production renderer integration remain later work.

## expressionAttenuation falloff v1 direction

`expressionAttenuation` currently applies group `strengthScale` by binary group membership. As `mouth` / `left_eye` / `right_eye` groups become wider, this can create abrupt strength changes near group boundaries.

See [expressionAttenuation falloff v1](docs/expression-attenuation-falloff-v1.md). The direction is for Engine to compute per-landmark falloff weights automatically inside each group, strongest near the group center and smoothly returning to 1.0 near the outer boundary. `landmarkGroups` JSON remains an index group definition; explicit per-index weights are only a future option. This is documentation only; Engine / Studio / Authoring Tool / validator implementation is not included in this step.

## landmarkGroups v1 direction

`landmarkGroups` defines meaningful MediaPipe landmark index groups such as `mouth`, `left_eye`, `right_eye`, and `face_boundary` for expression safety, and future `skin`, `lip`, `cheek`, and `eye_area` groups for color masks. It is referenced by `expressionAttenuation` and future `colorLayers`, but it is not an individual part editing command set.

See [landmarkGroups v1](docs/landmark-groups-v1.md). Engine landmarkGroups asset loading, fallback groups, Studio debug / Copy Debug summary, Authoring Tool Landmark Group Editor v1 prototype, rectangle selection, index highlight, bulk add / remove, and `ideal_face_asset_v1` optional `landmarkGroups` export are implemented. Color Processing, Layer System, and `beauty_filter_asset_v1` foundation remain unimplemented.

## Shape Warp production direction

Shape Warp v1 debug prototype is Studio processed preview-only. CPU radial warp debug and WebGL mesh warp v1 prototype connect CorrectionPlan correction vectors to the image so the movement can be observed, but neither is the production-quality Runtime renderer.

The production Shape Warp candidate is WebGL mesh warp. The candidate direction is to use MediaPipe face mesh topology, treat current image-normalized landmarks as source vertices, treat CorrectionPlan `target` points as target vertices, use the source video frame / source canvas as the texture, and remap texture triangles from current to target positions.

See [Shape Warp production direction](docs/shape-warp-production-direction.md). Studio WebGL mesh warp v1 prototype is implemented for processed preview verification, while Production Shape Warp, Runtime renderer integration, renderer lifecycle, shader hardening, and MediaPipe topology production handling remain outside this documentation step.

## beauty_filter_asset_v1 direction

最終的なフィルター / プリセットの配布単位は、`IdealFace + landmarkGroups + correctionProfile + shapeWarpSettings + colorLayers` を束ねた 1つの `beauty_filter_asset_v1` JSON として整理します。

ただし、内部では `idealFace`、`landmarkGroups`、`correctionProfile`、`shapeWarpSettings`、`colorLayers` を責務ごとに分離します。`landmarkGroups` は `expressionAttenuation` と将来の `colorLayers` が参照する group id の整合性を保つための定義です。Layer System は shape warp 用ではなく color processing 用です。

See [beauty_filter_asset_v1 direction](docs/beauty-filter-asset-v1.md). This is a documentation direction only. TypeScript implementation, Engine implementation, Studio implementation, Authoring Tool UI, JSON export changes, validator implementation, Color Processing, Layer System, Production Shape Warp, and Runtime renderer integration are not included in this step.

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
  Step 2-I-A/B/C と Step 2-H まで実装済み
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
  IdealFace Authoring Tool。Step 2-I-A/B/C と Step 2-H まで実装済み
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
- idealLandmarks3D 478点 Projection
- current-vs-projected ideal 478点 difference debug
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

legacy / debug と分類した helper には、今後の新機能を追加しません。現行 UI には Step 2-G v1 を旧方式として示す注記が残っていますが、active workflow は Step 2-I です。confidence debug、手動微調整 UI、保存 / import、correctionProfile / beauty_filter_asset_v1 export は Step 2-I active workflow 側で扱います。

Still planned:

- confidence debug
- manual adjustment UI
- save / import
- correctionProfile / beauty_filter_asset_v1 export
- multiple image input

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
- [correctionProfile v1](docs/correction-profile-v1.md)
- [expression-aware correctionProfile](docs/expression-aware-correction-profile.md)
- [expressionAttenuation falloff v1](docs/expression-attenuation-falloff-v1.md)
- [landmarkGroups v1](docs/landmark-groups-v1.md)
- [Shape Warp production direction](docs/shape-warp-production-direction.md)
- [beauty_filter_asset_v1 direction](docs/beauty-filter-asset-v1.md)
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
- save / import
- correctionProfile / beauty_filter_asset_v1 export
- multiple image input
