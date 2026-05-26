# BAE AR

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
- IdealFace Authoring Tool Expression frame grouping summary prototype
- IdealFace Authoring Tool frame usage card UI prototype

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
       1フレーム1カードで frontReference / useForInference / expressionGroup / excluded を設定
  -> Step 2-I-B pose-aware inference dataset
  -> Step 2-I-C pose_aware_weighted_z_v1 candidate generation
       roll 補正
       yaw / pitch / weight による z hint
       idealLandmarks3D 478点候補生成
  -> Step 2-H currentCandidate 3D 点群 preview
  -> IdealFace asset JSON export v1
```

旧 Step 2-C〜2-G v1 の 5ポーズ方式は削除済みです。現在コードからは UI / state / JSON preview / generation helper を削除しており、必要な場合は Git 履歴を参照します。

今後の新機能は、旧方式ではなく Step 2-I active workflow 側に追加します。`currentCandidate` は Step 2-H preview に表示される現在の candidate で、`generationMethod` は `pose_aware_weighted_z_v1` です。`natural_v1` の 6 controlPoints は reference / projection debug 用であり、IdealFace 本体は `idealLandmarks3D` 478点です。

Step 2-I-A の frame usage では、`frontReference` / `useForInference` / `expressionGroup` は重複可能な用途タグで、`excluded` だけを排他的な除外タグとして扱います。`poseOutOfRange` は自動除外ではなく注意タグです。正面基準には不向きですが、pose-aware 3D 推定の observation frame として z hint / 奥行き推定に使える可能性があるため、`useForInference` の対象に残せます。`noFace` / `invalidLandmarks` / `manual` は除外理由、`mixedExpression` / `pending` / `missingBlendshapes` は注意タグとして扱います。

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
