# 開発フロー

## Related docs

- [Ideal Reference Mesh Warp Lab](ideal-reference-mesh-warp-lab.md)
- [Ideal Reference Coordinate Lifecycle Investigation](ideal-reference-coordinate-lifecycle-investigation.md)
- [MediaPipe Render Consistency Lab next step after effective rotation center study](mediapipe-render-consistency-lab-next-after-effective-rotation-center.md)
- [MediaPipe Canonical Effective Rotation Center Lab](mediapipe-canonical-effective-rotation-center-lab.md)

## Ideal Reference Mesh Warp Lab の aspect-corrected alignment

`tools/ideal-reference-mesh-warp-lab` の current / ideal mesh prototype では、
MediaPipe returned landmarks の `x` / `y` を image-normalized coordinate として保存する。
ただし、bounds / center / uniform scale / distance / large displacement 判定など、
`x` と `y` を同じ距離単位として比較する処理では aspect-corrected image coordinate を使う。

```text
x' = x * videoAspectRatio
y' = y
```

`candidateAlignedIdealLandmarks` の alignment は aspect-corrected coordinate 上で行い、
結果を image-normalized coordinate に戻して overlay / mesh pair / ideal mesh target 候補に使う。
overlay 表示は従来どおり image-normalized coordinate から `displayedContentRect` pixel へ変換する。

## IdealFace Fitting Lab

`tools/ideal-face-fitting-lab` は 8点 / 12点 / 24点の semanticPointSet（意味点セット）を比較し、IdealFace478 の z、`rotationCenter`（回転中心） / `pivotZ`（投影基準奥行き）、canonicalDepthBased（標準顔奥行きベース方式）、perLandmarkZSearch（ランドマーク単位 z 探索）の候補を検証する debug lab（検証ラボ）です。production 用 IdealFace asset は作らず、`tools/ideal-face-authoring` と `tools/mediapipe-canonical-lab` から分離して扱います。

## 基本方針

BAE AR は、Engine Runtime、Beauty Studio、IdealFace Authoring Tool、Layer Mask Authoring Tool を分けて開発します。

- Engine Runtime は本番でリアルタイム加工する中核 SDK です。
- Beauty Studio は Engine Runtime を開発・検証・調整するための開発ツールです。
- Studio は Engine Runtime の公開 API のみを使います。
- Studio から Engine Runtime の内部実装へ直接依存しません。
- IdealFace Authoring Tool は Step 2-I-A/B/C と Step 2-H まで実装済みです。
- IdealFace Authoring Tool の Step 2-I-A では、`frontReference` / `useForInference` / `expressionGroup` を重複可能な用途タグとして扱い、`excluded` だけを排他的に扱います。
- MP4 detailed scan / Step 2-I-A frame selection では、`usage-aware frame sampling v1` として `frontReferenceCandidate` を提示し、`idealFaceInference` / expression groups は用途別 bucket の targetCount を見ながら frame を採用します。v1 prototype の adaptive sampling では required bucket の `idealFaceInference` が満たされたら early stop できます。expression groups は optional bucket として不足 warning を表示します。`frontReference` は自動 bucket ではなく、ユーザーが手動選択する正面基準で、early stop 条件には含めません。
- `tools/mediapipe-canonical-lab` は MediaPipe Face Landmarker の 478 landmarks / `facialTransformationMatrix` / pose / blendshapes を調査する debug lab です。IdealFace Authoring Tool とは目的が違い、`empiricalCanonical478` は debug artifact として扱います。最新の empirical 478 analysis では `face_bounds_normalized_no_matrix` が現時点の best candidate で、`facialTransformationMatrix` inverse は production の IdealFace 3D478 作成主導線にしません。詳細は [MediaPipe Canonical Lab](mediapipe-canonical-lab.md) を参照します。
- Step 2-I-A では、一覧カードに加えて Frame Review Carousel で1フレームを大きく確認しながら、`frontReference` / `expressionGroup` / `useForInference` / `excluded` を調整できます。
- `poseOutOfRange` は自動除外ではなく注意タグとして扱います。正面基準には不向きですが、pose-aware 3D 推定には使える可能性があるため、`useForInference` の対象に残せます。
- `noFace` / `invalidLandmarks` / `manual` は除外理由として扱い、`mixedExpression` / `pending` / `missingBlendshapes` は注意タグとして扱います。
- frame usage / usage-aware sampling の用語は [usage-aware frame sampling v1](usage-aware-frame-sampling-v1.md) を正とします。`useForInference` は UI state、`idealFaceInference` は sampling bucket、`observationFrame` は `useForInference=true` かつ `excluded=false` の実際の推定入力です。
- Layer Mask Authoring Tool は将来予定です。
- Authoring Tool の処理を Runtime に混ぜません。
- 1 つの Issue では目的を絞って小さく実装します。

## 実装前に確認すること

症状や想像だけで原因を断定しません。修正前に必ず関連する実コードを確認します。

確認対象:

- 呼び出し元と呼び出し先の実装
- 型定義、インターフェース、公開 API
- 状態の所有者と更新箇所
- debug 値が、実行時に利用している同じインスタンスから来ているか
- `initialize` / `start` / `setInput` / `setFaceDetector` などのライフサイクル順序
- 既存の guard、early return、error handling

## 現在の開発サイクル

現在は基盤実装の段階です。

```text
1. Engine Runtime の公開 API を小さく追加する
2. Studio からその公開 API だけを使って確認する
3. Studio に debug / overlay / copyable debug を追加する
4. 実カメラまたは可能な範囲の構成確認を行う
5. ドキュメントへ実装済み / 未実装 / 将来予定を反映する
6. 次の小さな Issue へ進む
```

## 現在実装済みの確認経路

```text
CameraService.start()
  -> navigator.mediaDevices.getUserMedia()
  -> HTMLVideoElement
  -> BeautyEngine.setInput()
  -> BeautyEngine.setFaceDetector()
  -> MediaPipeFaceDetector.detect()
  -> FaceFrame 更新
  -> analyzeFaceGeometry()
  -> Studio debug / overlay
```

## Shape Processing の開発方針

個別パーツ加工を増やす方向にはしません。

shape processing は current 478 landmarks と IdealFace 由来の ideal 478 landmarks を比較し、顔全体として自然に少し warp する方針で進めます。

IdealFace は BAE AR 独自の canonical face / お面データです。MediaPipe canonical face model そのものではありません。MediaPipe の topology や landmark index は参考にする可能性がありますが、MediaPipe は検出側の基準、BAE AR IdealFace は補正・比較側の基準として分けて扱います。

Projection / Shape Processing の実装では座標系を 3 種類に分けます。IdealFace asset / `idealLandmarks3D` は same-unit coordinate として扱い、Projection 内部、`FacePose` rotation、uniform alignment に使います。MediaPipe current landmarks、Studio overlay、current-vs-ideal difference、`CorrectionPlan` 入力は image-normalized coordinate として扱います。最終的な描画や画像変形は pixel coordinate で行います。

same-unit の projected ideal landmarks を、そのまま `x * canvasWidth` / `y * canvasHeight` で描画しません。Projection result は、Projection / alignment / debug 用の `sameUnitLandmarks` と、overlay / difference / Shape Warp 入力用の `imageLandmarks` を分けて持ちます。Studio overlay は `imageLandmarks` を使います。

```text
現在顔から MediaPipe 478 landmarks を取得
  -> FacePose を推定
  -> IdealFace 3D model を same-unit coordinate で現在姿勢へ投影
  -> projected ideal 478 landmarks を image-normalized coordinate へ変換
  -> current image-normalized landmarks と projected ideal image-normalized landmarks の差分を取る
  -> CorrectionPlan を生成
  -> 顔全体として自然に少し warp
```

current 478 landmarks は MediaPipe 由来の image-normalized 座標です。projected ideal 478 landmarks は、IdealFace same-unit landmarks を `FacePose` へ投影し、alignment 後に image-normalized 座標へ変換したものです。差分は `deltaX = projectedIdealImageX - currentX`、`deltaY = projectedIdealImageY - currentY` として計算します。

現時点では、478点の current-vs-ideal difference debug、`correctionProfile` v1 foundation、`expressionAttenuation` v1 foundation、CorrectionPlan v1 debug foundation、Studio 向け Shape Warp v1 debug prototype、Studio processed preview 限定 WebGL mesh warp v1 prototype は実装済みです。Production Shape Warp / Runtime renderer integration は未実装です。

新しい検証ラインとして [Ideal Reference Mesh Warp Lab](ideal-reference-mesh-warp-lab.md) を追加します。このラボでは、理想モデル動画から作る実測 MediaPipe 478 reference library と、ライブ動画を current face 代わりにした matching 検証を扱います。`tools/ideal-reference-mesh-warp-lab` はモデル動画の MediaPipe 解析と raw ideal reference frames 作成、accepted / excluded frame 管理、ライブ動画 current frame の MediaPipe 解析、current478 overlay、raw ideal reference frames からの top1 reference matching までを本線として残します。モデル動画解析用 MediaPipe とライブ動画 current 解析用 MediaPipe は分離し、MediaPipe に渡す timestamp は stream ごとの単調増加 counter を使います。PR5以降で試した alignedIdeal 478点全体 displacement / raw displacement mesh warp / rawWarpOnly / sideBySide / texture flip 実験は本線から外しました。現在は current mesh source / ideal mesh target の mesh pair prototype と dynamic grid prototype の次に、source vertices 基準で triangle indices を作る prototype まで進んでいます。topK weighted blend、visibilityWeight / warpSafetyWeight の本格化、hybrid mesh、temporal smoothing、production mesh warp は未実装です。Engine 実装、Studio 実装、Authoring Tool UI、JSON export、validator、Runtime renderer integration も行いません。

`correctionProfile` v1 は、`ideal_face_asset_v1` の optional top-level field として扱う補正設定です。landmark ごとの `strength` を持ちますが、dx / dy は JSON に保存しません。dx / dy は current landmarks と projected ideal `imageLandmarks` から Engine が毎フレーム計算します。今後の表情制御では、単純に group の補正強度を下げる `expressionAttenuation` ではなく、表情ごとに landmark が neutral な projected ideal へどれだけ追従するかを定義する `expressionFollow v1` を中心にします。MP4 からの `landmarkFollowStrengths` 自動生成は IdealFace Authoring Tool の責務として扱います。詳細は [correctionProfile v1](correction-profile-v1.md)、[expressionFollow v1](expression-follow-v1.md)、[MP4 expression 3D analysis plan](mp4-expression-3d-analysis-plan.md)、[usage-aware frame sampling v1](usage-aware-frame-sampling-v1.md)、[expression-aware correctionProfile](expression-aware-correction-profile.md)、[expressionAttenuation falloff v1](expression-attenuation-falloff-v1.md) を参照してください。

やらないこと:

- 目だけ大きくする
- 鼻だけ細くする
- 顎だけ削る
- 個別パーツ加工を主機能として増やす

## CorrectionPlan の開発方針

CorrectionPlan は姿勢補正を担当しません。姿勢への対応は IdealFace Projection の責務です。

CorrectionPlan は Projection 後の current image-normalized landmarks と projected ideal image-normalized landmarks の差分を受け取り、`correctionProfile` の `strength` を掛け、`maxCorrectionDistance` で clamp して、実際に warp へ渡す安全な補正量を決めます。今後の `expressionFollow v1` では、blendshape score に応じた `idealFollowStrength` を landmark ごとに決め、`finalStrength = baseStrength * idealFollowStrength` として表情による自然なズレを許容します。既存 `expressionAttenuation` foundation は safety attenuation として残りますが、中心仕様ではなく fallback / 参考扱いです。

扱うもの:

- 補正強度
- 移動量上限
- `correctionProfile` fallback
- expressionFollow
- expression-aware attenuation foundation
- 滑らかさ
- 過補正防止
- 信頼度

扱わないもの:

- FacePose の推定
- IdealFace の現在姿勢への投影
- 個別パーツ加工命令

`expressionFollow` は、目だけ大きくする、鼻だけ細くする、顎だけ削るための機能ではありません。`mouthPucker` / `jawOpen` / `mouthSmile` / `eyeBlink` / `eyeSquint` などの表情時に、neutral ideal から自然に外れてよい landmark の追従率を定義する safety control として扱います。

CorrectionPlan は same-unit projection 後、image-normalized に変換された current-vs-ideal 差分を受け取ります。CorrectionPlan は `FacePose` の推定や IdealFace projection を担当しません。

## Color Processing / Layer System の開発方針

Layer System は shape warp ではなく color processing 用に使います。

対象:

- skin smoothing
- whitening
- brightness
- tone
- blood color
- shadow / highlight
- cheek / lip / eye area などの色補正

Layer は色加工範囲、効果、強度、合成順を整理する仕組みです。変形加工には使いません。

## LayerMaskSpec の開発方針

LayerMask は FaceLandmarks から生成する 2D mask です。

基本仕様:

- どの landmarks で囲われた範囲かを定義する
- landmarks を polygon 化する
- polygon から mask を生成する
- 必要に応じて除外領域を持つ
- 必要に応じて膨張・収縮する
- 境界は feather / blur して自然にする
- mask 値は 0.0〜1.0 の強度マップとする

LayerMaskSpec の作成や手作業編集は Layer Mask Authoring Tool の責務です。Engine Runtime は定義済み LayerMaskSpec を読み込んで使います。

## Runtime と Authoring の分離

Engine Runtime で行わないこと:

- IdealFace の作成
- MediaPipe canonical face model の生成・編集
- 2D 動画からの 3D 顔生成
- LayerMaskSpec の作成
- mask の手作業編集
- Studio / Authoring 用 UI

Runtime Projection alignment では x/y 別 scale を行いません。IdealFace の縦横比を現在顔に合わせて歪めず、縦横比や形状そのものの調整は将来の IdealFace Authoring Tool manual adjustment UI で扱います。Authoring Tool は `video_aspect_same_unit_v1` による video aspect 補正、pose-aware generation、manual adjustment、same-unit `idealLandmarks3D` 生成を担当します。Runtime は完成済み IdealFace asset の読み込み、same-unit projection、overlay / difference / warp 用の image-normalized / pixel 座標変換を担当し、Authoring generation logic は持ちません。

Beauty Studio では、開発確認用として overlay や簡易調整 UI を持ってよいです。ただし、本番配布対象には含めません。

`correctionProfile` v1 の責務分離:

```text
IdealFace Authoring Tool
  - correctionProfile を作成・編集する
  - landmark index ごとの strength を設定する
  - dx / dy は持たない

Engine Runtime
  - correctionProfile を読み込む
  - correctionProfile がない場合は fallback default を使う
  - dx / dy を毎フレーム計算する
  - expressionFollow がある場合は landmark ごとの idealFollowStrength を計算する
  - expressionAttenuation がある場合は blendshape score から group strengthScale を計算する
  - strength と maxCorrectionDistance から CorrectionPlan を生成する

Beauty Studio
  - Engine の公開 API から correctionProfile / CorrectionPlan を確認する
  - Engine 内部実装や private field に直接依存しない
```

## IdealFace Authoring Tool の開発方針

今後の IdealFace Authoring Tool の開発は Step 2-I active workflow を中心に進めます。

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

次段では、同じ detailed scan / pose-aware workflow を使い、neutral frame group と expression frame group から neutral 3D 478 / expression 3D 478 を生成して比較し、`expressionFollow.rules[].landmarkFollowStrengths` を自動生成する方針です。frame selection は単純な均等抽出ではなく、[usage-aware frame sampling v1](usage-aware-frame-sampling-v1.md) に沿って `frontReferenceCandidate` を提示し、`idealFaceInference` / expression groups の不足状況を見ながら初期 `frameUsage` を作ります。v1 prototype では adaptive sampling を ON にした場合、required bucket の `idealFaceInference` が target 80 に達すると early stop し、optional expression bucket の不足は warning として扱います。`frontReference` はユーザーが手動確認・選択します。詳細は [MP4 expression 3D analysis plan](mp4-expression-3d-analysis-plan.md) に整理します。

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

MediaPipe z normalize は現時点の docs 方針では `raw` を推奨 default とします。MediaPipe z scale は `1`、MediaPipe z invert は ON を基本値とし、`faceWidthScaled` / `centered` / `frontReferenceMatched` は比較 option として残します。今回の整理では TypeScript 実装、UI default、Engine validator / schema、Runtime integration、Projection、Shape Warp、export JSON 仕様は変更しません。

legacy / debug と分類した UI や helper には、今後の新機能を追加しません。confidence debug、手動微調整 UI、保存 / export は Step 2-I active workflow 側に追加します。

次の feature work は confidence debug、手動微調整 UI、保存 / export、複数画像入力を Step 2-I active workflow 側に追加する方向で進めます。

## Studio UI 表示

Studio の UI 表示は原則として日本語にします。

例:

```text
エンジン状態
入力状態
カメラ状態
カメラエラー
プレビュー
```

API 名、型名、コード識別子は英語のままとします。

```ts
BeautyEngine
CameraService
getState()
```

## 確認コマンド

root の `package.json` には Studio と各 tool / lab の起動 script があります。

```bash
npm run start
npm run start:ideal-face-authoring
npm run start:mediapipe-canonical-lab
npm run start:ideal-face-fitting-lab
npm run start:mediapipe-render-consistency-lab
npm run start:ideal-reference-mesh-warp-lab
npm run build:ideal-reference-mesh-warp-lab
```

全体 build / test / lint script は未定義です。tool ごとの build script を追加した場合は、このドキュメントにも反映します。

## PR に書くこと

PR 本文には、変更内容と確認結果を記載します。

実カメラ確認が Codex 環境でできない場合は、手動確認事項として明記します。

```md
## Summary

- 変更内容

## Testing

- 実行した確認コマンド

## Manual Testing

- カメラ権限許可
- カメラ映像確認
- Input: connected 確認
```

## IdealFace Authoring Tool active workflow の確認

確認対象は現在の active workflow に絞ります。

- MP4 を選択できる
- 動画 preview と metadata を確認できる
- 詳細スキャンを実行できる
- Step 2-I-A で正面基準の手動選択 / 推定に使うフレーム / 除外フレームを操作できる
- Step 2-I-B の pose-aware inference dataset summary が更新される
- Step 2-I-C で `pose_aware_mediapipe_mesh_pca_residual_yaw_v1` candidate を生成できる
- Step 2-H で `currentCandidate` point cloud preview を確認できる
- JSON preview の top-level が `activeSummary` / `poseAware` / `currentCandidate` / `reference` / `debug` である
- JSON preview に 478 landmarks 全文、thumbnail data URL 全文、canvas data URL 全文を出さない
- Engine Runtime / Beauty Studio に authoring generation logic を追加していない

旧 Step 2-C〜2-G v1 の 5ポーズ方式は current code から削除済みのため、通常確認項目に含めません。

## IdealFace Authoring Tool の整理状況

旧 Step 2-G v1 の 5ポーズ生成 helper 経路は削除済みです。
今後の IdealFace Authoring Tool の新機能は、Step 2-I-A/B/C、つまり frame selection、pose-aware inference dataset、`pose_aware_mediapipe_mesh_pca_residual_yaw_v1` candidate generation を対象にします。
legacy / debug 経路には新機能を追加しません。

## Shape Warp 本番方針の流れ

Shape Warp v1 debug prototype は、CorrectionPlan の補正ベクトルを画像へ接続するための Studio processed preview 限定 prototype として扱います。本番候補は WebGL mesh warp です。

今後の開発は次の段階で進めます。

```text
Step A: docs / direction
  CPU radial warp debug の位置づけと WebGL mesh warp 本命候補を整理する

Step B: Studio WebGL mesh warp prototype
  Studio processed preview 限定で current landmarks / CorrectionPlan target / texture / topology を接続する

Step C: Runtime renderer integration
  Engine Runtime renderer として lifecycle / disposal / fallback / performance を整理する

Step D: Quality improvements
  temporal smoothing / mask / boundary / glasses / hair / seam / stability を扱う

Step R: Ideal Reference Mesh Warp Lab
  ideal reference library、visibilityWeight / warpSafetyWeight、hybrid mesh / adaptive grid、raw / runtime library 分離を docs で整理する
  現在はモデル動画の MediaPipe 解析、raw ideal reference frames 作成、accepted / excluded frame 管理、ライブ current 解析、current478 overlay、top1 matching までを本線として残す
  alignedIdeal 478点全体 displacement / raw displacement mesh warp / rawWarpOnly / sideBySide / texture flip 実験は本線から外す
  次の本線は current mesh source / ideal mesh target の mesh pair prototype
  model MediaPipe は authoring / library creation 用、live MediaPipe は Runtime current face analysis 用として分離する
  MediaPipe timestamp は video.currentTime ではなく stream ごとの単調増加 counter を使う
  topK weighted blend、visibilityWeight / warpSafetyWeight、hybrid mesh、temporal smoothing、production mesh warp は後段で扱う
```

詳細は [Shape Warp production direction](shape-warp-production-direction.md) を参照してください。Studio WebGL mesh warp v1 prototype は processed preview 限定で実装済みです。Production renderer 実装、shader hardening、MediaPipe topology の本番整理はこの docs step では行いません。

## beauty_filter_asset_v1 staged direction

最終的なフィルター / プリセットは、`idealFace`、`landmarkGroups`、`correctionProfile`、`shapeWarpSettings`、`colorLayers` を束ねた 1つの `beauty_filter_asset_v1` JSON として配布する方針です。

ただし、内部では責務を分離します。`idealFace` は理想顔の形状、`landmarkGroups` は MediaPipe landmark index の意味領域、`correctionProfile` は shape correction の強度と `expressionFollow` による表情時の追従制御、`shapeWarpSettings` は warp renderer / smoothing / boundary の設定、`colorLayers` は色加工、mask、合成順、opacity を扱います。Layer System は shape warp 用ではなく color processing 用です。

今後の開発は次の段階を目安に進めます。この順番は厳密固定ではありません。

```text
Step 1: landmarkGroups v1 docs specification
  ideal_face_asset_v1 / beauty_filter_asset_v1 で使う group 定義を整理する
  詳細は landmarkGroups v1 docs に整理する
  -> 実装済み

Step 2: Engine landmarkGroups foundation
  asset の landmarkGroups を読み込み、expressionFollow / expressionAttenuation が参照できるようにする
  asset にない場合は Engine fallback group を使う
  -> 実装済み

Step 3: Authoring Tool landmark group editor
  IdealFace Authoring Tool で mouth / left_eye / right_eye / face_boundary を作成・編集できるようにする
  rectangle selection / index highlight / bulk add / bulk remove を含む
  -> prototype 実装済み

Step 4: expressionFollow v1 docs direction
  表情ごとの idealFollowStrength / landmarkFollowStrengths 方針を整理する
  MP4 の neutral 3D 478 / expression 3D 478 比較による自動生成方針を整理する
  -> 実装済み

Step 5: MP4 expression 3D analysis docs / foundation
  IdealFace Authoring Tool で frame grouping、3D 478 比較、landmarkFollowStrengths 自動生成を整理する

Step 5.5: usage-aware frame sampling v1 docs / foundation
  MP4 detailed scan で用途別 bucket の targetCount を見ながら frameUsage 初期値を作る
  adaptive sampling ON の場合、required bucket の idealFaceInference が満たされたら early stop する
  expression groups は optional bucket として不足 warning を表示する

Step 6: expressionFollow v1 foundation
  Engine 側で expressionFollow を読み込み、landmark ごとの idealFollowStrength を CorrectionPlan に反映する

Step 7: shapeWarpSettings v1 docs / foundation
  WebGL mesh warp / smoothing / boundary / debug 設定を整理する

Step 8: colorLayers v1 docs / foundation
  whitening / skin smoothing / lip tint / cheek tint / layer order / opacity / mask / gradient を整理する

Step 9: beauty_filter_asset_v1 foundation
  IdealFace + landmarkGroups + correctionProfile + shapeWarpSettings + colorLayers を束ねる asset を定義する
```

詳細は [beauty_filter_asset_v1 direction](beauty-filter-asset-v1.md) と [landmarkGroups v1](landmark-groups-v1.md) を参照してください。今回のステップでは docs の方向性整理のみを行い、TypeScript 実装、Engine 実装、Studio 実装、Authoring Tool UI、JSON export 変更、validator 実装、Color Processing、Layer System、Production Shape Warp、Runtime renderer integration は行いません。
# Ideal Reference Mesh Warp Lab の開発フロー更新

`tools/ideal-reference-mesh-warp-lab` は、PR5以降の raw displacement warp 実験線を本線から外し、top1 reference matching 後に current mesh source / ideal mesh target の対応を確認する prototype に進みます。

現在の flow は、`currentLiveFrameAnalysis.landmarks478` から見えている / 安全な current landmarks を選び、dynamic near-face grid / background grid / screen edge anchors を加えて current mesh source を作ります。grid / anchors は fixed grid / anchors から dynamic grid prototype に進み、採用済み current face landmarks の aspect-corrected nearest neighbor distance 中央値である `faceMedianNearestDistance` を基準に `nearFaceGridSpacing` / `backgroundGridSpacing` / `screenEdgeAnchorSpacing` を決めます。

near-face grid は顔内部 landmark density に近づけ、background grid は少し粗くし、screen edge anchors は四隅と辺上に固定します。次に、source 側で採用された landmark index と同じ index の `candidateAlignedIdealLandmarks` と、source と同じ grid / anchors を使って ideal mesh target を作ります。

grid / anchors overlay は source / target で色分けします。`grid / anchorsを表示` が ON でも、`mesh sourceを表示` が OFF の場合は source grid / anchors を表示せず、`mesh targetを表示` が OFF の場合は target grid / anchors を表示しません。

`candidateAlignedIdealLandmarks` は最終 target ではありません。採用済み current landmark に対応する ideal candidate であり、WebGL warp、478点全体 displacement、raw displacement mesh warp、topK weighted blend、temporal smoothing、Engine / Studio / Authoring Tool 変更はこの段階では行いません。

## Ideal Reference Mesh Warp Lab triangle indices prototype

Ideal Reference Mesh Warp Lab は dynamic grid prototype の次に、vertices から triangle indices を作る prototype に進みます。

## Ideal Reference Mesh Warp Lab WebGL input debug

Ideal Reference Mesh Warp Lab は、source mesh / target mesh / triangle indices が成立した次の段階として、WebGL mesh warp に渡す直前の input debug を追加します。

この flow では、source vertices から `source UVs` を作り、image-normalized coordinate をそのまま `u = x` / `v = y` として扱います。debug には `sourceUvConvention = imageNormalizedNoFlip` と `uRange` / `vRange` を出します。texture V flip の UI や実験機能は復活させません。

target vertices からは `target positions` を作り、debug 用に clip space 相当へ変換します。

```text
clipX = x * 2 - 1
clipY = 1 - y * 2
```

triangle indices からは indices buffer 相当の flat array を作り、`maxIndex`、`indexWithinVertexRange`、`invalidIndexCount` を確認します。`sourceVertexCount == targetVertexCount`、triangle index 範囲、source UV range、target image-normalized range、target clip range、`triangleCount > 0` を検証し、Summary / Warp Mesh / Raw debug に `webglInputReady` と warnings を出します。

この段階では WebGL context 初期化、texture upload、shader、`gl.drawElements`、WebGL warp 実描画、production mesh warp は行いません。

triangle indices は source mesh と target mesh で共通に使います。sourceVertices[i] と targetVertices[i] は対応しているため、triangle index `[a, b, c]` は source triangle と target triangle の両方へ同じ意味で適用します。

triangle indices は source vertices の位置を基準に作ります。texture を読む座標は source 側で決まるためです。初期 prototype では外部依存を増やさず、Lab 内の簡易 Delaunay triangulation で source vertices から triangle indices を作ります。

triangle quality は aspect-corrected image coordinate で評価します。

```text
x' = x * videoAspectRatio
y' = y
```

Summary / Warp Mesh / Raw debug では、triangle count、valid / warning / excluded count、triangle kind counts、longThin / large / degenerate / faceToFarBackground warning、triangle area、triangle aspect ratio を確認します。Raw debug では巨大配列を出さず、triangle preview sample のみに留めます。

live overlay には `triangle meshを表示` toggle を追加します。`mesh sourceを表示` と組み合わせて source triangle wireframe、`mesh targetを表示` と組み合わせて target triangle wireframe を表示します。

現時点では triangle wireframe overlay と Summary / Warp Mesh / Raw debug による確認までで、WebGL mesh warp、texture upload、shader、production mesh warp はまだ行いません。

## Ideal Reference Mesh Warp Lab nearFaceGrid 更新

`tools/ideal-reference-mesh-warp-lab` の current mesh source prototype では、visible / safe current landmarks の選択は既存方針を維持する。`currentLiveFrameAnalysis.landmarks478` から invalid x/y、hidden side、face boundary、mouth / eyes、large displacement、usageWeight による抑制と除外を行い、採用済み current face landmarks を source の顔ランドマークとして扱う。

`nearFaceGrid` は、採用済み current face landmarks だけから作る `face-only triangle indices` を使って顔内部判定を行う。`face-only triangle indices` は `nearFaceGrid` 生成時の face interior 判定専用であり、最終描画用 triangle mesh ではない。

現在の `nearFaceGrid` 生成は以下の流れとする。

```text
accepted current face landmarks
  -> face-only triangle indices
  -> expandedNearFaceBounds 内を nearFaceGridSpacing で埋める
  -> face interior に入る grid point を除外
  -> 顔ランドマークに近すぎる grid point を弱めの threshold で除外
  -> nearFaceGrid として採用
```

final triangle indices は、`faceLandmark` / `nearFaceGrid` / `backgroundGrid` / `screenEdgeAnchor` を含む source vertices から別途作り、source mesh と target mesh で共通に使う。この段階では WebGL mesh warp、texture upload、shader、production mesh warp は行わない。
