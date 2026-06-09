# リポジトリ構成

## Related docs

- [Ideal Reference Mesh Warp Lab](ideal-reference-mesh-warp-lab.md)
- [Ideal Reference Coordinate Lifecycle Investigation](ideal-reference-coordinate-lifecycle-investigation.md)
- [MediaPipe Render Consistency Lab next step after effective rotation center study](mediapipe-render-consistency-lab-next-after-effective-rotation-center.md)
- [MediaPipe Canonical Effective Rotation Center Lab](mediapipe-canonical-effective-rotation-center-lab.md)

## Ideal Reference Mesh Warp Lab の座標方針

`tools/ideal-reference-mesh-warp-lab` は、MediaPipe returned landmarks を
image-normalized coordinate として保持し、overlay では `displayedContentRect` pixel に
変換して描画します。mesh prototype の bounds / center / uniform scale / distance /
large displacement 判定では、横長動画で x 方向を過小評価しないように
aspect-corrected image coordinate を使います。

```text
x' = x * videoAspectRatio
y' = y
```

`candidateAlignedIdealLandmarks` は aspect-corrected coordinate 上で top1 reference を
current face に位置合わせした候補であり、最終 target として 478点全体を扱うものでは
ありません。source 側で採用された current landmark index に対応する ideal candidate として
mesh pair / ideal mesh target の確認に使います。

## `tools/ideal-face-fitting-lab`

IdealFace Fitting Lab は、production 用 IdealFace asset を直接作る正式ツールではありません。captured JSON の current landmarks 478 から semanticPointSet（意味点セット）を取り出し、8点 / 12点 / 24点を比較しながら、IdealFace478 の z、`rotationCenter`（回転中心） / `pivotZ`（投影基準奥行き）、canonicalDepthBased（標準顔奥行きベース方式）、perLandmarkZSearch（ランドマーク単位 z 探索）の候補を検証する debug lab（検証ラボ）です。

grid search は Web Worker で chunk 単位に実行し、ブラウザ main thread を同期的に占有しない方針です。全 candidate 配列は保持せず、overall ranking と `bucketRanking` はそれぞれ `topN` 件だけを保持します。UI では進捗率、処理済み candidate 数、推定総 candidate 数、cancel 状態を表示し、Full / Summary JSON export は探索完了後だけ有効にします。GPU / WebGPU search はまだ扱いません。

扱うもの:

- headTop / chin / leftCheek / rightCheek / leftEye / rightEye / nose / mouth
- `8pt_basic` / `12pt_rotation_center` / `24pt_structure`
- `zMin` / `zMax` / `zStep`
- `pivotZMin` / `pivotZMax` / `pivotZStep`
- capture frame の yaw / pitch / roll による Projection
- projectedIdeal2D と current 2D landmarks 8点の pointError / frameScore / totalScore
- `canonical-face-depth-template-v1.json` を基準にした 478点 z の debug candidate 生成
- `perLandmarkZSearch` による landmark 単位の 1次元 z 探索
- front / yawPositive / yawNegative / pitchPositive / pitchNegative / mixedPose の `bucketScores`
- Full Fitting JSON / Summary JSON export
- `bestCandidate` / `bestIdealFace8` / `depthRelation`
- `current8BucketSummary` / `current8PoseComparison` / `current8FrameSample`

扱わないもの:

- alignmentMode による 2D 再フィット
- `weighted_similarity_2d`
- `zProfile`
- `zScale`
- matrix inverse で current landmarks を標準顔座標へ戻す処理
- production 用 IdealFace asset 作成
- production 用 IdealFace asset schema 変更
- IdealFace Authoring Tool Step 2-I の変更
- MediaPipe Canonical Lab の実装変更
- Runtime / Studio Projection の変更
- production 用 478点 IdealFace export
- `beauty_filter_asset_v1` への反映

`bestIdealFace8` は `front` bucket 由来の `base8Points2D` と grid search の最良 `FittingCandidate8.zByPointId` を組み合わせた検証用成果物です。pivotZ は Projection 用の回転中心奥行きとして source に残し、各点の z には焼き込みません。478点 z は `canonicalDepthBased` と `perLandmarkZSearch` による debug candidate（デバッグ候補）として生成・評価しますが、production asset export（本番用アセット書き出し）ではありません。

`current8` debug は `bestIdealFace8` ではなく、MediaPipe が検出した current landmarks 478 から8つの semantic points だけを抜き出した比較対象です。front と yawPositive / yawNegative などの current 2D 8 points がどの程度変化するかを確認するために使います。
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
│  ├─ ideal-face-authoring/
│  │  ├─ package.json
│  │  └─ src/
│  │     └─ main.ts
│
│  └─ mediapipe-canonical-lab/
│     ├─ package.json
│     └─ src/
│        └─ main.ts
│
│  └─ mediapipe-render-consistency-lab/
│     ├─ package.json
│     └─ src/
│        └─ main.ts
│
└─ docs/
   ├─ overview.md
   ├─ architecture.md
   ├─ correction-profile-v1.md
   ├─ landmark-groups-v1.md
   ├─ development-flow.md
   ├─ repository-structure.md
   └─ bae_ar_beauty_engine_spec_and_roadmap_2026_05.md
```

## 将来予定の構成

```text
tools/
├─ ideal-reference-mesh-warp-lab/
│  └─ Ideal Reference Mesh Warp Lab
│     理想モデル動画の実測 MediaPipe 478 reference library と hybrid mesh warp を検証する debug / research lab
│
└─ layer-mask-authoring/
   └─ Layer Mask Authoring Tool
```

`tools/ideal-face-authoring` は Step 2-I-A/B/C と Step 2-H まで実装済みです。`tools/mediapipe-canonical-lab` は MediaPipe Face Landmarker の 478 landmarks / `facialTransformationMatrix` / pose / blendshapes を調査する debug lab です。`tools/mediapipe-render-consistency-lab` は MP4 import、auto scan（自動スキャン）、`acceptedFrames`、`thumbnailDataUrl`、MediaPipe metadata summary（MediaPipe メタデータ要約）、12pt overlay（12点重ね表示）、manual adjustments（手動調整）、Debug Console（デバッグコンソール）、`poseBucket125` を確認する debug lab です。production 用 IdealFace asset を作る正式 authoring tool（作成ツール）ではありません。`tools/ideal-reference-mesh-warp-lab` は、理想モデル動画から作る実測 MediaPipe 478 reference library と、ライブ動画を current face 代わりにした matching 検証のための debug lab です。現在は、モデル動画の MediaPipe 解析、raw ideal reference frames 作成、accepted / excluded frame 管理、モデル動画 accepted frame review、モデル動画 478点 overlay、ライブ動画 current frame の MediaPipe 解析、current478 overlay、raw ideal reference frames からの top1 reference matching までを本線として残します。モデル動画解析用 MediaPipe とライブ動画 current 解析用 MediaPipe は分離し、timestamp は各解析 stream ごとの単調増加 counter を使います。PR5以降で試した alignedIdeal 478点全体 displacement / raw displacement mesh warp / rawWarpOnly / sideBySide / texture flip 実験は本線から外しました。現在は current mesh source / ideal mesh target の mesh pair prototype、dynamic grid prototype、source vertices 基準の triangle indices prototype まで実装済みです。topK weighted blend、visibilityWeight / warpSafetyWeight の本格化、hybrid mesh、temporal smoothing、production mesh warp は未実装です。`tools/layer-mask-authoring` は将来予定です。

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
- ideal_face_asset_v1 の型 / validator / parse helper / converter
- ideal_face_asset_v1 optional `landmarkGroups` 型 / validation / converter
- correctionProfile v1 の型 / validator / fallback
- expressionAttenuation v1 foundation / fallback rules
- landmarkGroups v1 Engine foundation
- Engine fallback group helper
- asset / fallback group source handling
- asset / fallback group source debug summary
- CorrectionPlan v1 debug foundation
- Studio processed preview 向け Shape Warp v1 debug prototype の入力となる correction vectors
- Studio processed preview 限定 WebGL mesh warp v1 prototype 向けの MediaPipe face mesh topology

将来追加予定:

- expressionFollow v1 Engine implementation
- MP4 expression 3D analysis 由来の landmarkFollowStrengths 読み込み
- expressionAttenuation falloff v1 fallback / reference handling
- shapeWarpSettings v1
- colorLayers v1
- beauty_filter_asset_v1 foundation / validator / parser / converter
- Production Shape Warp
- Production WebGL mesh warp / Runtime renderer integration
- renderer production lifecycle / disposal / fallback
- Color Processing
- Layer System
- LayerMaskSpec の読み込み

Engine Runtime は UI を持ちません。debug 用 UI、一時的な検証 UI、Authoring Tool の編集処理はここに入れません。

Projection / Shape Warp へ向けた座標系方針として、Engine Runtime は完成済み IdealFace asset の `idealLandmarks3D` を same-unit coordinate として読み込み、`FacePose` に合わせて same-unit 空間で回転と face center / uniform scale alignment を行います。Runtime Projection alignment では x/y 別 scale を行わず、IdealFace の縦横比を現在顔に合わせて歪めません。Projection result は `sameUnitLandmarks` と `imageLandmarks` を分けて持ち、Studio overlay / current-vs-ideal difference / Shape Warp 入力へ渡す座標は image-normalized coordinate に変換します。Studio overlay は `imageLandmarks` を使います。最終的な描画や画像変形では pixel coordinate を使います。

`correctionProfile` v1 は `ideal_face_asset_v1` の optional top-level field として実装済みです。形状データである `idealLandmarks3D` とは分け、landmark ごとの `strength`、fallback、validation 方針を [correctionProfile v1](correction-profile-v1.md) に記載します。dx / dy は JSON に保存せず、Engine Runtime が毎フレーム計算します。`expressionAttenuation` v1 foundation も Engine 側で fallback rules、jawOpen / eyeBlink / eyeSquint の group strengthScale、halfLifeMs smoothing、CorrectionVector の `baseStrength` / `expressionStrengthScale` / `finalStrength` 反映まで実装済みです。今後の中心仕様は `expressionFollow v1` で、表情ごとの landmark 追従率を `idealFollowStrength` として扱います。

`landmarkGroups` v1 は、Engine asset loading foundation、fallback groups、asset / fallback group source handling、Studio debug / Copy Debug summary まで実装済みです。asset に `landmarkGroups` がある場合は asset group を使い、ない場合は Engine fallback group を使います。`expressionFollow v1` は docs direction のみで、Engine implementation、MP4 expression 3D analysis、landmarkFollowStrengths 自動生成は未実装です。`expressionAttenuation falloff v1` は fallback / 参考案です。

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
       正面基準の手動選択 / 推定に使うフレーム / 除外フレーム
  -> Step 2-I-B pose-aware inference dataset
  -> Step 2-I-C pose_aware_mediapipe_mesh_pca_residual_yaw_v1 candidate generation
       MediaPipe landmark.z による frame-local 3D478
       FacePose inverse rotation
       x-z PCA residual yaw correction
       per-frame semantic center alignment
       direction balance 付き weighted average
       semantic origin centering
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

`currentCandidate` は Step 2-H preview に表示される現在の candidate です。推奨 `generationMethod` は `pose_aware_mediapipe_mesh_pca_residual_yaw_v1` で、478 landmarks 全文は出さず、summary と先頭数点 preview に留めます。`pose_aware_mediapipe_mesh_semantic_origin_v1` は PCA residual yaw correction なしの baseline、`pose_aware_weighted_z_v1` は historical comparison です。`pose_aware_canonical_3d_v1` / `pose_aware_canonical_stable_z_v1` / `pose_aware_canonical_balanced_frame_z_v1` / `pose_aware_mediapipe_mesh_average_v1` は legacy / debug-only です。`natural_v1` の 6 controlPoints は reference / projection debug 用であり、IdealFace 本体は `idealLandmarks3D` 478点です。

Authoring Tool の生成・編集処理は Engine Runtime / Beauty Studio に混ぜません。

`tools/ideal-face-authoring` は `video_aspect_same_unit_v1` による video aspect 補正、pose-aware generation、将来の manual adjustment UI を担当し、`idealLandmarks3D` を same-unit coordinate として生成します。Runtime / Beauty Studio は Authoring generation logic を持ちません。

Landmark Group Editor v1 prototype も実装済みです。`mouth` / `left_eye` / `right_eye` / `face_boundary` を選択し、478点 overlay 上で selected group を確認できます。click toggle、矩形範囲選択、index highlight、highlighted indices の一括追加 / 削除、group count / indices / reset selected / reset all、JSON preview summary、`ideal_face_asset_v1` optional `landmarkGroups` export に対応しています。

## `tools/mediapipe-canonical-lab`

MediaPipe Canonical Lab は、IdealFace を作る tool ではなく、MediaPipe Face Landmarker の生データと座標系を調査する debug lab です。

現在含まれるもの:

- current landmarks 478 capture
- `facialTransformationMatrix` capture
- yaw / pitch / roll capture
- blendshapes capture
- pose bucket 別 capture
- captured JSON import / analysis
- `Export Full Analysis JSON`
- `Export Summary JSON`

`empiricalCanonical478` は実測から作った標準顔 478 候補ですが、debug artifact であり、そのまま production asset にしません。最新の empirical 478 analysis では、41 captures、478 landmarks、matrix available 41、video size `1280x720` で検証し、Runtime compatible ranking も含めて `face_bounds_normalized_no_matrix` が現時点の best candidate です。これは `facialTransformationMatrix` を使わず、顔の外枠で中心合わせし、顔の大きさでスケールを揃える方式です。

`facialTransformationMatrix` は yaw / pitch / roll、pose bucket、frame weighting、debug comparison には使います。ただし、matrix inverse で current landmarks を production の IdealFace 3D478 作成主導線へ戻す方式は採用しません。詳細は [MediaPipe Canonical Lab](mediapipe-canonical-lab.md) を参照してください。

## `tools/mediapipe-render-consistency-lab`

MediaPipe Render Consistency Lab は、mesh / render / MediaPipe re-detection 前提で `projectionFitZ` と `meshReadyZ` の違いを検証するための debug lab です。

現在含まれるもの:

- MP4 import
- auto scan（自動スキャン）
- `acceptedFrames`
- accepted frame ごとの `thumbnailDataUrl`
- MediaPipe Face Landmarker metadata summary（メタデータ要約）表示
- `acceptedFrames[].observed12pt`
- 12pt overlay（12点重ね表示）と show / hide toggle
- pose / `expressionSummary`
- `manualAdjustmentsByFrame`
- `currentReviewIndex` による accepted frame review
- Debug Console（デバッグコンソール）
- Current Frame（現在フレーム）タブ
- `poseBucket125`
- `frontCandidate` / `expressionTooStrong` badge（補助ラベル）

まだ含まないもの:

- MediaPipe face mesh topology（顔メッシュ接続情報）での478点 mesh 化
- yaw / pitch / roll 指定 render（姿勢指定レンダリング）
- rendered image（レンダリング画像）の MediaPipe Face Landmarker 再入力
- returned landmarks（返却ランドマーク）と geometric projected landmarks（幾何投影ランドマーク）の比較
- alignment / residual evaluation（位置合わせ・残差評価）
- mesh diagnostics（メッシュ診断）
- `meshReadyZ` candidate 比較
- 保存 / export / localStorage / JSON download
- 478点 full landmarks の保持・表示・ドラッグ

Runtime / Studio / IdealFace Authoring Tool / Fitting Lab の実装には依存せず、lab 内で必要な最小の MediaPipe Face Landmarker 初期化だけを行います。詳細は [MediaPipe Render Consistency Lab](mediapipe-render-consistency-lab.md) を参照してください。

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

- `correction-profile-v1.md`: `ideal_face_asset_v1` の optional `correctionProfile` 仕様、fallback、validation、`expressionFollow` / `expressionAttenuation`、CorrectionPlan との関係
- `expression-follow-v1.md`: 表情ごとの `idealFollowStrength` / `landmarkFollowStrengths` と MP4 由来 3D 478 比較による自動生成方針
- `mp4-expression-3d-analysis-plan.md`: IdealFace Authoring Tool が MP4 から neutral / expression 3D 478 を生成し、`landmarkFollowStrengths` を自動生成する計画
- `usage-aware-frame-sampling-v1.md`: MP4 detailed scan / Step 2-I-A frame selection で `frontReferenceCandidate` を提示し、用途別 bucket の targetCount を見ながら frame を採用する方針
- `landmark-groups-v1.md`: `ideal_face_asset_v1` / `beauty_filter_asset_v1` で使う optional `landmarkGroups` 仕様、Engine fallback、validation、Landmark Group Editor 方針
- `shape-warp-production-direction.md`: Shape Warp v1 debug prototype と production candidate の違い、WebGL mesh warp 方針、段階分け
- `ideal-reference-mesh-warp-lab.md`: 理想顔 3D478 生成ではなく、理想モデル動画の実測 MediaPipe 478 reference library、visibility / safety weight、hybrid mesh / adaptive grid、raw / runtime library 分離、storage / compression 方針を扱う新検証ラボ
- `beauty-filter-asset-v1.md`: 最終フィルター / プリセットを `idealFace` / `landmarkGroups` / `correctionProfile` / `shapeWarpSettings` / `colorLayers` に分けつつ、1つの `beauty_filter_asset_v1` JSON として配布する方向性
- `mediapipe-canonical-lab.md`: MediaPipe Canonical Lab の位置づけ、empirical 478 analysis 暫定結論、`facialTransformationMatrix` inverse の扱い、Full / Summary Analysis JSON export 方針
- `mediapipe-render-consistency-lab.md`: Render Consistency Lab の位置づけ、Fitting Lab との違い、`projectionFitZ` / `meshReadyZ`、現状の auto scan / acceptedFrames / 12pt overlay / Debug Console / poseBucket125、mesh / render / MediaPipe re-detection 前提の評価方針

## `tools/ideal-face-authoring` detailed scan

詳細スキャンは Step 2-I-A の frame selection に渡す observation source です。表示用抽出フレームは debug / metadata 確認用であり、active workflow の中心ではありません。

`usage-aware frame sampling v1` では、`frontReferenceCandidate` を自動候補として提示し、`frontReference` はユーザーが手動選択する正面基準として扱います。`idealFaceInference` / expression groups は用途 bucket として扱い、targetCount までバランスよく採用します。ある bucket が targetCount に達した場合、その用途では以後採用しませんが、他用途には引き続き使える方針です。詳細は [usage-aware frame sampling v1](usage-aware-frame-sampling-v1.md) を参照してください。

Current active workflow:

```text
MP4 input
  -> detailed scan
  -> Step 2-I-A frame selection
       正面基準の手動選択 / 推定に使うフレーム / 除外フレーム
  -> Step 2-I-B pose-aware inference dataset
  -> Step 2-I-C pose_aware_mediapipe_mesh_pca_residual_yaw_v1 candidate generation
       MediaPipe landmark.z による frame-local 3D478
       FacePose inverse rotation
       x-z PCA residual yaw correction
       per-frame semantic center alignment
       direction balance 付き weighted average
       semantic origin centering
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

IdealFace v1、Runtime 側の idealLandmarks3D 478点読み込み / 投影、current 478 landmarks と projected ideal 478 landmarks の difference debug、`correctionProfile` v1 foundation、`expressionAttenuation` v1 foundation、CorrectionPlan v1 debug foundation、Studio 向け Shape Warp v1 debug prototype、WebGL mesh warp v1 prototype は実装済みです。`landmarkGroups` v1 は docs specification、Engine foundation、asset / fallback group source handling、Studio debug / Copy Debug summary、Authoring Tool Landmark Group Editor v1 prototype、`ideal_face_asset_v1` optional `landmarkGroups` export まで実装済みです。`expressionFollow v1` と [MP4 expression 3D analysis plan](mp4-expression-3d-analysis-plan.md) は docs direction のみで、Engine implementation、MP4 expression 3D analysis、landmarkFollowStrengths 自動生成は未実装です。[Ideal Reference Mesh Warp Lab](ideal-reference-mesh-warp-lab.md) はモデル動画の MediaPipe 解析、raw ideal reference frames 作成、accepted / excluded frame 管理、モデル動画 accepted frame review、モデル動画 478点 overlay、ライブ動画 current frame の MediaPipe 解析、current478 overlay、raw ideal reference frames からの top1 reference matching、current mesh source / ideal mesh target mesh pair prototype、dynamic grid prototype、source vertices 基準の triangle indices prototype までを本線として残します。モデル動画解析用 MediaPipe は raw ideal reference frames 作成後に破棄し、ライブ動画解析用 MediaPipe は Runtime 相当の current face 解析に使います。timestamp は `video.currentTime` ではなく stream ごとの単調増加 counter です。PR5以降で試した alignedIdeal 478点全体 displacement / raw displacement mesh warp / rawWarpOnly / sideBySide / texture flip 実験は本線から外しました。topK weighted blend、visibilityWeight / warpSafetyWeight の本格化、hybrid mesh、temporal smoothing、production mesh warp、JSON export、IndexedDB、compression、validator、Runtime renderer integration は未実装です。`expressionAttenuation falloff v1` は fallback / 参考案です。`shapeWarpSettings` v1、`colorLayers` v1、`beauty_filter_asset_v1`、Production Shape Warp、Layer System、LayerMaskSpec、Color Processing、Runtime renderer integration も未実装です。追加する場合も、Engine Runtime の責務と Authoring Tool / Lab の責務を分け、Studio からは公開 API 経由で確認できるようにします。

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

`currentCandidate` は Step 2-H preview に表示される現在の candidate です。推奨 `generationMethod` は `pose_aware_mediapipe_mesh_pca_residual_yaw_v1` で、478 landmarks 全文は出さず、summary と先頭数点 preview に留めます。`pose_aware_mediapipe_mesh_semantic_origin_v1` は PCA residual yaw correction なしの baseline、`pose_aware_weighted_z_v1` は historical comparison です。`pose_aware_canonical_3d_v1` / `pose_aware_canonical_stable_z_v1` / `pose_aware_canonical_balanced_frame_z_v1` / `pose_aware_mediapipe_mesh_average_v1` は legacy / debug-only です。`natural_v1` の 6 controlPoints は reference / projection debug 用であり、IdealFace 本体は `idealLandmarks3D` 478点です。

## IdealFace Authoring Tool Current Generation Path

`tools/ideal-face-authoring` now keeps recommended 3D candidate generation on Step 2-I-C `pose_aware_mediapipe_mesh_pca_residual_yaw_v1`. The old Step 2-G v1 five-pose generation helper path has been removed from current code and remains available only through Git history.

MediaPipe z normalize は Step 2-I 時点では `raw` を現時点の推奨 default とします。MediaPipe z scale は `1`、MediaPipe z invert は ON を基本値として扱います。`faceWidthScaled` / `centered` / `frontReferenceMatched` は比較 option として残します。TypeScript 実装、UI default、Engine validator / schema、Runtime integration、Projection、Shape Warp、export JSON 仕様は今回変更しません。
# Ideal Reference Mesh Warp Lab の構成更新

`tools/ideal-reference-mesh-warp-lab` は、理想モデル動画の MediaPipe scan、`rawIdealReferenceFrames`、accepted / excluded frame 管理、accepted frame review、model / current 478点 overlay、live current analysis、top1 reference matching を維持したうえで、visible / safe current landmarks + grid / anchors による current mesh source prototype を追加しています。

current mesh source は採用された current landmark、dynamic near-face grid、dynamic background grid、screen edge anchors で構成します。grid / anchors は fixed grid / anchors から dynamic grid prototype に進み、採用済み current face landmarks の `faceMedianNearestDistance` を基準に `nearFaceGridSpacing` / `backgroundGridSpacing` / `screenEdgeAnchorSpacing` を決めます。near-face grid は顔内部 landmark density に近づけ、background grid は少し粗くし、screen edge anchors は四隅と辺上に固定します。

ideal mesh target は source と同じ頂点数・同じ順番で、face landmark だけ source 側の index に対応する `candidateAlignedIdealLandmarks` を使い、grid / anchors は source と同じ位置にします。

grid / anchors overlay は source / target で色分けします。`grid / anchorsを表示` が ON でも、`mesh sourceを表示` が OFF の場合は source grid / anchors を表示せず、`mesh targetを表示` が OFF の場合は target grid / anchors を表示しません。

この tool では現時点で mesh pair と triangle wireframe の overlay / summary / preview raw debug までを扱います。triangle indices は source vertices の位置を基準に作り、source mesh と target mesh で共通に使います。triangle quality は aspect-corrected image coordinate で評価します。WebGL warp、texture upload、shader、production mesh warp、raw displacement mesh warp、Runtime / Engine 変更、Beauty Studio 変更、IdealFace Authoring Tool 変更、JSON export / import、保存機能は含めません。
