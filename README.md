# BAE AR

## 起動方法

各 tool / app は root から以下の npm script で起動します。

```bash
# Beauty Studio
npm run start

# IdealFace Authoring Tool
npm run start:ideal-face-authoring

# MediaPipe Canonical Lab
npm run start:mediapipe-canonical-lab

# IdealFace Fitting Lab
npm run start:ideal-face-fitting-lab
```

## IdealFace Fitting Lab

`tools/ideal-face-fitting-lab` は、8 semantic points を使って IdealFace478 の z、3D rotationOrigin / pivotZ、zScale、semantic alignment、bounds constraint の仕様判断材料を作る debug lab です。

- production 用 IdealFace asset を作る正式 authoring tool ではありません。
- `tools/ideal-face-authoring` の Step 2-I 生成フローとは分離します。
- `tools/mediapipe-canonical-lab` の MediaPipe 座標系調査とも目的を分けます。
- captured JSON を import し、頭頂 / 顎 / 左右頬 / 左右目 / 鼻 / 口の 8 semantic points で coarse grid search を行います。
- Summary JSON はレビューや ChatGPT 相談用の軽量形式として出力します。
- grid search の `bestCandidate` から `bestIdealFace8` を出力します。これは 8点だけの debug artifact であり、production 用 IdealFace asset ではありません。
- Summary JSON にも `zProfileDefinitions` と `bestIdealFace8` を含めます。z は `zRaw`（zProfile そのもの）と `zScaled`（`zRaw * zScale`）を分け、3DIdealFace8 の実値としては `zScaled` を見ます。
- selected frame ごとの current 2D 8 points debug を出力します。横向き時に現在顔8点が縦長になっていないか、`aspectRatio` / `cheekWidth` / `eyeDistance` / `noseX` を見て、`bestIdealFace8` の z を評価する前に比較対象の current 2D 側を確認できます。
- 478点への補間や `provisionalIdealFace478` 生成は次段であり、今回は未実装です。

起動:

```bash
npm run start:ideal-face-fitting-lab
```

## 概要

BAE AR は、リアルタイム顔加工・AR 表現を行う Beauty Engine Runtime と、その開発・検証・調整を行う Beauty Studio、将来の authoring tool 群を含むプロジェクトです。

目的は、単なるフィルターではなく、本番サービスに組み込める自然で破綻しにくい Beauty Engine を育てることです。

Shape Processing は、目だけ大きくする、鼻だけ細くする、顎だけ削るような個別パーツ加工ではありません。現在顔の MediaPipe 478 landmarks と、IdealFace 由来の projected ideal 478 landmarks を比較し、顔全体として自然に少し warp する方針です。

## 全体構成

```text
packages/engine
  Engine Runtime として使う Beauty Engine SDK
  UI を持たない実行専用 SDK

apps/studio
  Engine Runtime を開発・検証・調整する Beauty Studio
  Engine の公開 API のみを使う

tools/ideal-face-authoring
  IdealFace Authoring Tool
  Step 2-I-A/B/C と Step 2-H まで実装済み

tools/mediapipe-canonical-lab
  MediaPipe Face Landmarker の 478 landmarks / facialTransformationMatrix / pose / blendshapes を調査する debug lab

docs
  設計、仕様、ロードマップ、開発方針

tools/layer-mask-authoring
  将来予定の Layer Mask Authoring Tool
```

Engine Runtime に Studio / Authoring 用 UI や生成・編集処理は入れません。Authoring Tool は IdealFace や将来の `expressionFollow` 用データを作成し、Engine Runtime は完成済み asset を読み込んで実行します。

## 現在の実装状況

### 実装済み

- `BeautyEngine` の基本ライフサイクル: `initialize()` / `start()` / `stop()` / `dispose()`
- 入力保持: `setInput()` / `getInput()`
- `FaceDetector` 差し替え: `setFaceDetector()` / `getFaceDetector()`
- `HTMLVideoElement` 入力に対する FaceFrame loop
- `MediaPipeFaceDetector` による MediaPipe Face Landmarker 接続
- `FaceFrame` 更新: `detected` / `timestamp` / `landmarks` / `blendshapes` / `pose`
- `FaceGeometry` の補助解析
- Studio 側のカメラ入力、debug 表示、landmark / geometry overlay、Copy Debug
- FacePose の実推定
- IdealFace v1 型定義、Natural v1 最小プリセット、IdealFace 公開 API
- `ideal_face_asset_v1` 読み込み foundation、validator、parse helper、converter
- `idealLandmarks3D` 478点 Projection
- current-vs-projected ideal 478点差分 debug
- `correctionProfile` v1 foundation、validation / fallback
- `expressionAttenuation` v1 foundation
- CorrectionPlan v1 debug foundation
- Studio 向け Shape Warp v1 debug prototype
- Studio processed preview 限定 WebGL mesh warp v1 prototype
- `landmarkGroups` v1 docs specification / Engine foundation
- Engine fallback groups / asset group source handling
- Studio debug / Copy Debug landmarkGroups summary
- IdealFace Authoring Tool Landmark Group Editor v1 prototype
- Landmark Group Editor rectangle selection / index highlight / bulk add / bulk remove
- `ideal_face_asset_v1` optional `landmarkGroups` export
- `expressionFollow v1` docs 方針
- MP4 expression 3D analysis plan docs 方針
- usage-aware frame sampling v1 docs 方針
- IdealFace Authoring Tool Expression frame grouping summary prototype
- IdealFace Authoring Tool frame usage card UI prototype
- IdealFace Authoring Tool usage-aware adaptive scan prototype
- MediaPipe Canonical Lab empirical 478 analysis / Summary JSON export docs 方針

### 未実装 / 後段

- `expressionFollow v1` Engine 実装
- MP4 expression 3D analysis の 3D生成 / 比較 / export 実装
- `landmarkFollowStrengths` 自動生成
- expressionFollow Authoring UI
- correctionProfile / expressionFollow export
- `beauty_filter_asset_v1` foundation / validator / parser / converter
- `shapeWarpSettings` v1
- `colorLayers` v1
- Production Shape Warp
- Runtime renderer integration
- Production WebGL mesh warp / renderer lifecycle / disposal / fallback
- Color Processing
- Layer System
- LayerMaskSpec
- confidence debug
- manual adjustment UI
- save / import
- multiple image input

## IdealFace Authoring Tool

現在の active workflow は Step 2-I 系です。

```text
MP4 input
  -> detailed scan
  -> Step 2-I-A frame selection
       1フレーム1カードと Frame Review Carousel で frontReference / useForInference / expressionGroup / excluded を設定
  -> Step 2-I-B pose-aware inference dataset
  -> Step 2-I-C pose_aware_mediapipe_mesh_pca_residual_yaw_v1 candidate generation
       MediaPipe landmark.z による frame-local 3D478
       FacePose inverse rotation
       x-z PCA residual yaw correction
       per-frame semantic center alignment
       direction balance 付き weighted average
       semantic origin centering
       idealLandmarks3D 478点候補生成
  -> Step 2-H currentCandidate 3D 点群 preview
  -> IdealFace asset JSON export v1
```

旧 Step 2-C〜2-G v1 の 5ポーズ方式は削除済みです。現在コードからは UI / state / JSON preview / generation helper を削除しており、必要な場合は Git 履歴を参照します。

今後の新機能は、旧方式ではなく Step 2-I active workflow 側に追加します。`currentCandidate` は Step 2-H preview に表示される現在の candidate で、推奨 `generationMethod` は `pose_aware_mediapipe_mesh_pca_residual_yaw_v1` です。`pose_aware_mediapipe_mesh_semantic_origin_v1` は PCA residual yaw correction なしの baseline、`pose_aware_weighted_z_v1` は historical comparison として扱います。`pose_aware_canonical_3d_v1` / `pose_aware_canonical_stable_z_v1` / `pose_aware_canonical_balanced_frame_z_v1` / `pose_aware_mediapipe_mesh_average_v1` は legacy / debug-only prototype です。`natural_v1` の 6 controlPoints は reference / projection debug 用であり、IdealFace 本体は `idealLandmarks3D` 478点です。

`pose_aware_mediapipe_mesh_pca_residual_yaw_v1` は、observation frame の MediaPipe x/y/z から frame-local 3D478 を作り、FacePose yaw / pitch / roll の inverse rotation で canonical へ戻した後、x-z PCA residual yaw angle を打ち消す同一 yaw 回転を全478点に適用します。その後、per-frame semantic center alignment、direction balance 付き weighted average、semantic origin centering を行います。PCA residual yaw correction は個別パーツ変形ではなく、landmark ごとの個別補正や x/y/z scale は行いません。semantic origin は asset rotation origin 用で、Runtime alignment は projected bounds center -> current bounds center のままです。

MediaPipe z normalize は、Step 2-I 時点では `raw` を現時点の推奨 default とします。実データ確認では `raw` が最も自然に見え、`faceWidthScaled` は奥行きが平べったくなりやすかったためです。MediaPipe z scale は `1`、MediaPipe z invert は ON を基本値として扱います。PCA residual yaw correction で x-z の残留傾きを別途補正できるため、z normalize 側で過度にスケール調整しない方が自然でした。ただし `faceWidthScaled` / `centered` / `frontReferenceMatched` は比較 option として残し、動画・端末・MediaPipe z の出方によって将来 dataset 別に z normalize / z scale を調整可能にする可能性があります。今回の整理では TypeScript 実装、UI default、Engine validator / schema、Runtime integration、Projection、Shape Warp、export JSON 仕様は変更しません。

代表 debug では `pose_aware_mediapipe_mesh_semantic_origin_v1` の x-z 主軸角 約 5.904° / top view asymmetry 約 0.0163 に対し、`pose_aware_mediapipe_mesh_pca_residual_yaw_v1` は x-z 主軸角 約 -0.2135° / top view asymmetry 約 0.0024 まで改善しています。Step 2-H の asset_origin preview で rotation origin と top view を確認します。

Engine validator / schema、Runtime 読み込み、Projection debug、Studio comparison、Shape Warp / CorrectionPlan への接続は未対応です。export asset を Runtime に渡す前に、validator / projection debug / Studio comparison を追加します。

Step 2-I-A の frame usage では、`frontReference` / `useForInference` / `expressionGroup` は重複可能な用途タグで、`excluded` だけを排他的な除外タグとして扱います。`poseOutOfRange` は自動除外ではなく注意タグです。正面基準には不向きですが、pose-aware 3D 推定の observation frame として奥行き観測に使える可能性があるため、`useForInference` の対象に残せます。`noFace` / `invalidLandmarks` / `manual` は除外理由、`mixedExpression` / `pending` / `missingBlendshapes` は注意タグとして扱います。

MP4 detailed scan / Step 2-I-A frame selection では、`frontReferenceCandidate` の提示と用途別 bucket の充足状況を見ながら frame を採用する `usage-aware frame sampling v1` を導入する方針です。`frontReferenceCandidate` は自動で「正面基準に良さそう」と判定された候補で、`frontReference` はユーザーが手動選択する正面基準です。これは完全自動確定ではなく、自動初期値 + Frame Review Carousel での手動確認・修正として扱います。詳細は [usage-aware frame sampling v1](docs/usage-aware-frame-sampling-v1.md) を参照してください。

現在の IdealFace Authoring Tool には、`usage-aware frame sampling v1` の prototype として scan preset（quick / standard / detailed）、usage bucket summary、adaptive scan / early stop を追加しています。`frontReference` は usage bucket から分離し、手動選択数 / 自動候補数 / 推奨数の summary として表示します。adaptive sampling を ON にした場合、v1 の required bucket は `idealFaceInference` で、targetCount を満たすと早期終了できます。expression groups は optional bucket として不足 warning を表示し、`frontReference` は early stop 条件に含めません。

Step 2-I-A では、一覧カードに加えて Frame Review Carousel で1フレームを大きく確認しながら、`frontReference` / `expressionGroup` / `useForInference` / `excluded` を調整できます。Review 側と一覧カード側は同じ `frameUsage` state を更新し、JSON preview の `frameUsage` summary に反映します。

### frame usage / usage-aware sampling 用語メモ

- `frontReference`: ユーザーが手動選択する正面基準 frame。正面姿勢・座標正規化・reference basis に使い、`useForInference=true` の場合だけ IdealFace 形状生成にも使います。
- `frontReferenceCandidate`: 自動で正面基準に良さそうと判定された候補。自動 bucket ではなく、最終的な `frontReference` はユーザーが選びます。
- `useForInference`: frame usage state / UI の boolean。UI 表示名は「IdealFace生成に使う」で、この frame を IdealFace 本体の 3D 478 形状生成に使うかを表します。
- `idealFaceInference`: usage-aware sampling の bucket id。採用された frame は `useForInference=true` の初期値になります。
- `observationFrame`: `useForInference=true` かつ `excluded=false` の frame。Step 2-I-B/C に渡る IdealFace 形状生成の observation input です。
- `expressionGroup` / `autoExpressionGroup`: `expressionGroup` は表情解析用の用途タグで、`autoExpressionGroup` は blendshape score 由来の初期値です。`useForInference` とは独立します。
- `excluded` / `excludedReason` / `warningReason`: `excluded` だけは排他的です。`excludedReason` は `noFace` / `invalidLandmarks` / `manual` など、`warningReason` は `poseOutOfRange` / `mixedExpression` / `pending` / `missingBlendshapes` などです。
- `expressionFollow` / `expressionAttenuation` / `landmarkFollowStrengths`: `expressionFollow` は今後の中心仕様、`expressionAttenuation` は既存 Engine foundation、`landmarkFollowStrengths` は expressionFollow rule 内の landmark ごとの target idealFollowStrength です。`expressionFollow` 実装と `landmarkFollowStrengths` 自動生成は未実装です。

詳しい定義は [usage-aware frame sampling v1](docs/usage-aware-frame-sampling-v1.md) と [MP4 expression 3D analysis plan](docs/mp4-expression-3d-analysis-plan.md) を参照してください。

## MediaPipe Canonical Lab

`tools/mediapipe-canonical-lab` は IdealFace を作るツールではなく、MediaPipe Face Landmarker の current landmarks 478、`facialTransformationMatrix`、yaw / pitch / roll、blendshapes、pose bucket 別 capture を調査する debug lab です。`empiricalCanonical478` は実測から作った標準顔 478 候補ですが、debug artifact であり、そのまま production asset にはしません。

最新の empirical 478 analysis では、41 captures、478 landmarks、matrix available 41、video size `1280x720` で検証し、`front` 6、`yawPositive` 5、`yawNegative` 5、`pitchPositive` 10、`pitchNegative` 5、`mixedPose` 10 の bucket balance まで改善しています。現時点の best candidate は `face_bounds_normalized_no_matrix` です。これは MediaPipe の行列を使わず、顔の外枠で中心合わせし、顔の大きさでスケールを揃える方式です。Runtime compatible ranking でも 1 位です。

`facialTransformationMatrix` は yaw / pitch / roll、pose bucket、frame weighting、debug comparison には使います。ただし、`inverseResultHugeBounds` や `poseConventionMatchesButPointTransformUnstable` が出ているため、IdealFace 3D478 作成の production 主導線として matrix inverse で current landmarks を標準顔座標へ戻す方式は採用しません。production の IdealFace 3D478 作成では、顔枠ベースの正規化・整列を主軸にし、matrix inverse は research / debug 扱いに留めます。

Analysis JSON export は、詳細検証・再解析用の `Export Full Analysis JSON` と、ChatGPT / 人間レビュー用の軽量版 `Export Summary JSON` に分けます。Summary JSON は `schemaVersion: mediapipe_canonical_lab_analysis_summary_v1` で、`sourceCaptureSummary`、`frameWeightSummary`、ranking top、best candidate summary、warnings を含み、478点 full landmarks 配列、`candidateResults` 全件、`perLandmarkMean`、`perLandmarkStdDev`、`previewDataUrl` は含めません。詳細は [MediaPipe Canonical Lab](docs/mediapipe-canonical-lab.md) を参照してください。

## IdealFace Projection / 座標系方針

- `idealLandmarks3D` は same-unit coordinate として保存します。
- Runtime Projection は same-unit 空間で rotate + translate + uniform scale alignment を行います。
- Studio overlay / current-vs-ideal difference / Shape Warp 入力には image-normalized / pixel coordinate を使います。
- Projection result は `sameUnitLandmarks` と `imageLandmarks` を分けて扱います。
- Studio overlay は `imageLandmarks` を描画します。
- same-unit landmarks を `canvasWidth` / `canvasHeight` に直接掛けて描画しません。
- Runtime は IdealFace の x/y を別々に scale せず、IdealFace の縦横比を現在顔に合わせて歪めません。
- video aspect 補正、pose-aware generation、将来の manual adjustment は Authoring Tool の責務です。

## correctionProfile / CorrectionPlan

`correctionProfile` v1 は、`ideal_face_asset_v1` の optional top-level field として Engine foundation 実装済みです。

要点:

- `idealLandmarks3D` と `correctionProfile` は分けます。
- `correctionProfile` は landmark ごとの `strength`、fallback、`maxCorrectionDistance` を扱います。
- dx / dy は JSON に保存しません。
- dx / dy は current landmarks と projected ideal `imageLandmarks` から Engine が毎フレーム計算します。
- CorrectionPlan v1 debug foundation は `correctionProfile` を使い、478点分の correction vectors を生成します。
- CorrectionPlan は姿勢補正を担当しません。姿勢への対応は IdealFace Projection の責務です。

詳細は [correctionProfile v1](docs/correction-profile-v1.md) を参照してください。

## expressionFollow v1

今後の表情制御は、単純に group の補正強度を下げる `expressionAttenuation` ではなく、`expressionFollow v1` を中心に整理します。

要点:

- `expressionFollow` は、表情時に各 landmark が neutral な projected ideal へどれだけ追従するかを定義します。
- `idealFollowStrength` は `0.0 = current / camera を優先`、`1.0 = projected ideal を優先` です。
- `landmarkGroups` は rule の対象範囲です。
- `landmarkFollowStrengths` は landmark ごとの追従率です。
- `landmarkFollowStrengths[].idealFollowStrength` は rule 最大時の target value です。
- 実行時は blendshape score と `inputRange` から `ruleAmount` を計算し、`1.0` から target へ補間した `effectiveIdealFollowStrength` を使います。

`expressionAttenuation` は既存 Engine foundation として残りますが、今後の中心仕様ではありません。`expressionAttenuation falloff v1` は fallback / 参考案として扱います。今後の expression work は `expressionFollow v1` を優先します。

詳細は [expressionFollow v1](docs/expression-follow-v1.md)、[expression-aware correctionProfile](docs/expression-aware-correction-profile.md)、[expressionAttenuation falloff v1](docs/expression-attenuation-falloff-v1.md) を参照してください。

## MP4 expression 3D analysis plan

2026-05 update:

- IdealFace Authoring Tool に Expression frame grouping summary prototype と frame usage card UI prototype を追加済みです。
- detailed scan frames の blendshape score から expression dropdown の自動初期値を作ります。
- `frontReference` / `useForInference` / `expressionGroup` は用途タグであり、重複可能です。
- `excluded` だけは排他的で、除外済み frame は正面基準 / 推定 / 表情解析の処理対象から外れます。
- `poseOutOfRange` / `mixedExpression` / `pending` / `missingBlendshapes` は注意タグとして扱い、自動除外にはしません。
- `usage-aware frame sampling v1` では、`frontReferenceCandidate` を自動候補として提示し、`frontReference` はユーザーが手動選択する正面基準として扱います。`idealFaceInference` / expression groups は用途 bucket として扱い、targetCount までバランスよく採用します。adaptive sampling ON の場合、v1 required bucket の `idealFaceInference` が満たされたら early stop し、expression groups は optional bucket として不足 warning を表示します。
- JSON preview に `expressionAnalysis` summary を表示します。
- JSON preview に `frameUsage` summary を表示します。
- neutral 3D 478 / expression 3D 478 の生成、3D 比較、`landmarkFollowStrengths` 自動生成、`expressionFollow` export はまだ未実装です。

`landmarkFollowStrengths` は手作業だけでなく、IdealFace Authoring Tool が MP4 の表情別 frame group から自動生成する方針です。

要点:

- neutralFrames は将来、frontReferenceFrames の中から表情が少ないものを選びます。
- mouthPucker / jawOpen / mouthSmile / eyeBlink / eyeSquint などの expression frame group から expression 3D 478 を生成します。
- 比較は projected 2D / image-normalized ではなく、same-unit 3D 478 同士で行います。
- `comparisonSpace` は `bae_ar_ideal_landmarks3d_v1` を推奨します。
- `distance3D` から `idealFollowStrength` を生成します。
- `affectedLandmarkGroups` は対象範囲、`landmarkFollowStrengths` は対象範囲内の landmark ごとの追従率です。
- JSON preview / export は段階的に進めます。

これは docs 方針のみで、MP4 expression 3D analysis 実装と `landmarkFollowStrengths` 自動生成は未実装です。

詳細は [MP4 expression 3D analysis plan](docs/mp4-expression-3d-analysis-plan.md) を参照してください。

用途別 frame 採用の方針は [usage-aware frame sampling v1](docs/usage-aware-frame-sampling-v1.md) を参照してください。

## landmarkGroups v1

`landmarkGroups` は、MediaPipe landmark index 群に意味を与える定義です。

要点:

- `mouth` / `left_eye` / `right_eye` / `face_boundary` などの index group を定義します。
- `expressionFollow` / `expressionAttenuation` / 将来の `colorLayers` が参照します。
- 個別パーツ加工命令ではありません。
- `mouth` group で目だけ大きくする、`jaw` group で顎だけ削る、のような使い方はしません。
- Engine asset loading / fallback groups / Studio debug / Copy Debug summary は実装済みです。
- Authoring Tool Landmark Group Editor / rectangle selection / index highlight / bulk add / bulk remove / optional export は実装済みです。

詳細は [landmarkGroups v1](docs/landmark-groups-v1.md) を参照してください。

## Shape Warp

現在の Shape Warp は debug / prototype 段階です。

要点:

- Studio の Shape Warp v1 debug prototype は実装済みです。
- Studio processed preview 限定 WebGL mesh warp v1 prototype は実装済みです。
- 本番候補は WebGL mesh warp です。
- Production Shape Warp / Runtime renderer integration は未実装です。
- Runtime renderer lifecycle、shader hardening、MediaPipe topology の本番整理は後段です。

詳細は [Shape Warp production 方針](docs/shape-warp-production-direction.md) を参照してください。

## beauty_filter_asset_v1

最終的なフィルター / プリセットは、`beauty_filter_asset_v1` として 1つの JSON に束ねる方針です。

```text
beauty_filter_asset_v1
  ├─ idealFace
  ├─ landmarkGroups
  ├─ correctionProfile
  ├─ shapeWarpSettings
  └─ colorLayers
```

内部では、`idealFace`、`landmarkGroups`、`correctionProfile`、`shapeWarpSettings`、`colorLayers` を責務ごとに分離します。`landmarkGroups` は `expressionFollow` / `expressionAttenuation` と将来の `colorLayers` が参照する group id の整合性を保つための定義です。

現在は docs 方針のみで、`beauty_filter_asset_v1` foundation は未実装です。Color Processing と Layer System も未実装です。

詳細は [beauty_filter_asset_v1 方針](docs/beauty-filter-asset-v1.md) を参照してください。

## 起動コマンド

root の `package.json` には以下の script があります。

```bash
npm run start
npm run start:ideal-face-authoring
```

`npm run start` は `apps/studio` を起動します。`npm run start:ideal-face-authoring` は `tools/ideal-face-authoring` を起動します。

## 関連ドキュメント

- [概要](docs/overview.md)
- [アーキテクチャ](docs/architecture.md)
- [開発フロー](docs/development-flow.md)
- [リポジトリ構成](docs/repository-structure.md)
- [correctionProfile v1](docs/correction-profile-v1.md)
- [expressionFollow v1](docs/expression-follow-v1.md)
- [MP4 expression 3D analysis plan](docs/mp4-expression-3d-analysis-plan.md)
- [usage-aware frame sampling v1](docs/usage-aware-frame-sampling-v1.md)
- [expression-aware correctionProfile](docs/expression-aware-correction-profile.md)
- [expressionAttenuation falloff v1](docs/expression-attenuation-falloff-v1.md)
- [landmarkGroups v1](docs/landmark-groups-v1.md)
- [Shape Warp production 方針](docs/shape-warp-production-direction.md)
- [beauty_filter_asset_v1 方針](docs/beauty-filter-asset-v1.md)
- [仕様書とロードマップ](docs/bae_ar_beauty_engine_spec_and_roadmap_2026_05.md)

## 今回 README で扱わないこと

- TypeScript 実装
- Engine 実装
- Studio 実装
- Authoring Tool UI 実装
- JSON export 変更
- validator 変更
- `expressionFollow v1` 実装
- MP4 expression 3D analysis 実装
- `landmarkFollowStrengths` 自動生成
- Production Shape Warp
- Runtime renderer integration
- Color Processing
- Layer System
