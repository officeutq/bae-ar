# IdealFace Fitting Lab Experiment Summary

## 目的

このドキュメントは、`tools/ideal-face-fitting-lab` で行った IdealFace 478 z / projection 関連の実験を棚卸しし、次に作る `tools/mediapipe-render-consistency-lab` の前提を整理するためのものです。

ここで整理する内容は debug lab の実験結果であり、Runtime / Studio / IdealFace Authoring Tool / `beauty_filter_asset_v1` の仕様確定や production asset export ではありません。

## 1. ideal-face-fitting-lab の位置づけ

`tools/ideal-face-fitting-lab` は、production 用 IdealFace asset を作る正式 authoring tool ではありません。

この lab の役割は、MediaPipe capture JSON を入力にして、IdealFace 478 点の z、3D 投影、`rotationCenter`、`pivotZ`、semanticPointSet の選び方を検証する debug lab です。実装済みの比較対象は以下です。

- `8pt_basic`
- `12pt_rotation_center`
- `24pt_structure`
- `canonical-face-depth-template-v1.json`
- `canonical-face-xyz-template-v1.json`
- `canonicalDepthBased`
- `perLandmarkZSearch`
- `canonicalToCandidateXYFit`
- `Depth Relation Debug`
- `poseProjectionEvaluation12pt`
- `poseWeightedProjectionEvaluation12pt`

`tools/ideal-face-authoring` の Step 2-I production 本線とは分離します。Step 2-I は MP4 detailed scan、frame selection、pose-aware inference dataset、`pose_aware_mediapipe_mesh_pca_residual_yaw_v1` による `idealLandmarks3D` 478 点候補生成、Step 2-H point cloud preview を扱う authoring workflow です。

`tools/mediapipe-canonical-lab` とも目的が違います。MediaPipe Canonical Lab は MediaPipe Face Landmarker が返す 478 landmarks、`facialTransformationMatrix`、pose、blendshapes、capture bucket、empirical canonical 478 を調査する debug lab です。一方、Fitting Lab は capture 済み landmarks を使って「候補 3D を現在姿勢へ投影したときに current landmarks と合うか」を調べる lab です。

## 2. MediaPipe landmark.z 問題

MediaPipe の `landmark.z` は、本物の物理奥行きそのものではありません。値の符号、スケール、顔向きや検出器内部の補正は、BAE AR の `idealLandmarks3D` にそのまま採用できる物理 3D 座標とは限りません。

そのため、capture landmarks からそのまま 3D478 を作ると、以下の問題が起きる可能性があります。

- 顔が平べったくなる
- 鼻 / jaw / mouth / noseBridge の前後関係が不自然になる
- 横向きへ投影したときに current landmarks とズレる
- canonical face との差分だけでは、実際の投影適合を判断できない

この問題を調べるため、Fitting Lab では z 推定と投影評価を分けて実験しました。重要なのは、canonical face と z が一致することではなく、現在姿勢へ投影したときに MediaPipe current landmarks と合うかです。

## 3. 実験した方式

### 8pt_basic

`8pt_basic` は、頭頂 / 顎 / 左右頬 / 左右目 / 鼻 / 口を使う基本の semanticPointSet です。

軽くて安定しやすいため、安全な比較基準として残します。一方で、`rotationCenter` や顔構造の推定には粗さが残ります。

### 12pt_rotation_center

`12pt_rotation_center` は、`8pt_basic` に `noseBridge`、`leftJaw`、`rightJaw`、`upperFaceCenter` を足した 12 点セットです。

`rotationCenter` / `pivotZ` / 主要 z の推定に効く点を増やしつつ、24 点ほど表情や検出ブレに引っ張られにくい構成です。Quick Run の現時点の主導線では、この point set を `QUICK_478_DEPTH_SEMANTIC_POINT_SET_ID` として使います。

### 24pt_structure

`24pt_structure` は、12 点に鼻横、目尻、目頭、こめかみ、口角、下顎などを追加した構造確認向け point set です。

顔構造の情報は増えますが、表情差、MediaPipe 検出ブレ、追加点の局所誤差も拾いやすくなります。比較用として残しますが、現時点の本命にはしません。

### canonical-face-depth-template-v1.json

`tools/ideal-face-fitting-lab/data/canonical-face-depth-template-v1.json` は、MediaPipe canonical face model OBJ から作った Fitting Lab 用の depth template です。

`sourceLandmarkCount` は 468、`targetLandmarkCount` は 478 です。`0..467` を canonical comparison 対象にし、`468..477` は MediaPipe Face Landmarker の追加 10 点として iris fallback で扱います。

これは IdealFace そのものではなく、478 点 z の debug candidate を作るための参照基準です。

### canonical-face-xyz-template-v1.json

`tools/ideal-face-fitting-lab/data/canonical-face-xyz-template-v1.json` は、`canonical_face_model.obj` の raw x/y/z を保持する診断用テンプレートです。

Fitting Lab 側では、canonical face を 12 点 candidate の x/y 座標系へ fit し、z の自然さや順序関係を診断するために使います。正規化済み z を使う `canonical-face-depth-template-v1.json` とは役割が違います。

### canonicalDepthBased

`canonicalDepthBased` は、478 Depth Prototype 用の debug candidate 生成方式です。

処理は、canonical depth の `0..467` を source candidate の semantic points に least squares で fit し、`canonicalZ * scale + offset` で 478 点の仮 z を作ります。`468..477` は canonical model に存在しないため、左右目の z から iris fallback します。

既存の `inverseDistanceWeighting` は比較用として残しますが、現在の主導線は `canonicalDepthBased` です。

### perLandmarkZSearch

`perLandmarkZSearch` は、`canonicalDepthBased` が作った `baseZ` を起点に、各 landmark を 1 点ずつ 1 次元探索する debug refinement です。

これは 478 点を同時に探索する処理ではありません。対象 landmark の `candidateZ` だけを `baseZ ± range` で動かし、selected frames へ投影したときの `projectionError` と `canonicalDeviationPenalty` を比較します。

### canonicalToCandidateXYFit

`canonicalToCandidateXYFit` は、`canonical-face-xyz-template-v1.json` の canonical raw x/y を 12 点 candidate の front reference x/y へ fit し、その x/y scale から z の符号や順序関係を診断する debug です。

この診断は、canonical face と candidate の z が自然に見えるかを確認するためのもので、candidate 選定そのものを確定する production rule ではありません。

### Depth Relation Debug

`Depth Relation Debug` は、2D projection score だけでは良く見えるが 3D 構造として不自然な候補を検出するための debug / filtering です。

Fitting Lab では `z が小さい = 手前`、`z が大きい = 奥` と扱います。代表的には、`noseTipGroup` が `cheekGroup` より手前か、`faceCenterGroup` が `faceBoundaryGroup` より手前かを見ます。

478 点側では、微小な margin 未達だけで即 production 不採用にするのではなく、`passed` / `warning` / `rejected` の 3 段階で扱います。

### poseProjectionEvaluation12pt

`poseProjectionEvaluation12pt` は、12 点 candidate を selected frames の pose へ回転・投影し、同じ座標空間へ正規化した observed current 12 点と比較する debug evaluation です。

対象 candidate は主に以下です。

- `current12ptFinalCandidate`
- `structureAware12ptWouldSelectCandidate`
- `8ptStructureAwareBest`

評価対象 bucket は `front`、`yawPositive`、`yawNegative`、`pitchPositive`、`pitchNegative` です。`mixedPose` はこの 12 点投影評価では外します。

### poseWeightedProjectionEvaluation12pt

`poseWeightedProjectionEvaluation12pt` は、`poseProjectionEvaluation12pt` の residual に姿勢重みを付ける debug evaluation です。

実装上は、`max_abs_yaw_pitch` による angle magnitude weight と、bucket weight を持ちます。外れフレーム除外後の frames を使い、通常評価で見えた傾向が姿勢重み付きでも変わるかを確認します。

## 4. 現時点の代表的な試作方針

現時点の代表的な 478 z debug candidate 生成方針は以下です。

```text
canonical-face-depth-template-v1.json
  +
12pt_rotation_center
  +
canonicalDepthBased
  +
perLandmarkZSearch
```

この流れでは、`12pt_rotation_center` で `rotationCenter` / `pivotZ` / 主要 z を推定し、`canonicalDepthBased` で 478 点の仮 z を作り、`perLandmarkZSearch` で各 landmark の z を 1 点ずつ微調整します。

ただし、これは production asset export ではありません。あくまで Fitting Lab の debug candidate であり、Runtime、Studio、IdealFace Authoring Tool、asset schema には反映しません。

## 5. 分かったこと

- 478 点 z の同時総当たり探索は、組み合わせ爆発するため採用しません。
- `perLandmarkZSearch` は 478 点同時探索ではなく、`canonicalDepthBased` の `baseZ` を起点に各 landmark を 1 点ずつ 1 次元探索する方式です。
- `8pt_basic` は安全な比較基準として残します。
- `12pt_rotation_center` は `rotationCenter` / `pivotZ` / 主要 z 推定に有効で、現時点の本命です。
- `24pt_structure` は構造点が増えますが、表情・検出ブレ・追加点の影響を拾いやすく、現時点の本命にはしません。
- canonical face と z が違うこと自体は不採用理由ではありません。
- 本当に重要なのは、候補 3D を現在姿勢へ投影したときに MediaPipe current landmarks と合うかです。

## 6. 12点投影評価で分かったこと

12 点投影評価では、canonical face との z 比較だけでは違和感がある candidate でも、capture landmarks への投影評価ではそこそこ合うことが分かりました。

現時点の代表 debug 結果として、以下の整理にします。

- `current12ptFinalCandidate` と `structureAware12ptWouldSelectCandidate` は、投影評価上ほぼ同等です。
- `8ptStructureAwareBest` より、12 点 finalCandidate の方が少し良い傾向です。
- 通常評価でも `poseWeightedProjectionEvaluation12pt` でも、大きな結論は変わりません。
- worstBucket は `yawPositive` です。
- worstPoint は `nose` です。
- 問題の中心は jaw ではなく、横向き時の `nose` / `noseBridge` の投影残差に見えます。

この結果は「12 点 finalCandidate を production asset として採用する」という意味ではありません。Fitting Lab の debug evaluation として、次に検証すべきズレの中心が jaw より `nose` / `noseBridge` / 横向き投影にある、という引き継ぎです。

## 7. 残った仮説

残った仮説は、MediaPipe の capture landmarks が、物理的な 3D 顔を単純に yaw / pitch / roll で回転投影した点とは限らない、というものです。

特に横向き時、`nose` / `noseBridge` などは、幾何的な 3D メッシュ投影位置ではなく、MediaPipe の検出器がその画像をどう解釈したかに寄った位置へ出る可能性があります。

その場合、BAE AR の IdealFace Projection に必要なのは、単に幾何的に正しい理想顔ではありません。MediaPipe がその理想顔画像をどう認識するか、つまり MediaPipe が返す ideal landmarks を採用する必要があります。

したがって、理想顔メッシュを yaw / pitch / roll でレンダリングし、その画像を MediaPipe に通して返ってきた landmarks を検証する必要があります。

## 8. 次のラボへの引き継ぎ

次に作る `tools/mediapipe-render-consistency-lab` の目的は、3D 顔メッシュを機械的に yaw / pitch / roll で回転・投影した 2D landmarks と、そのレンダリング画像を MediaPipe に通して返ってきた 2D landmarks が一致するのかを検証することです。

設計方針、`projectionFitZ` と `meshReadyZ` の違い、mesh / render / MediaPipe re-detection 前提の評価方針は [MediaPipe Render Consistency Lab](mediapipe-render-consistency-lab.md) に整理します。

最初の段階では、MediaPipe 再解析までは入れません。まず以下を実装します。

1. 3D メッシュを camera へ投影する
2. canvas に表示する
3. 幾何投影 landmarks を overlay する
4. yaw / pitch / roll の pose sweep を行えるようにする

その後、以下へ進みます。

1. レンダリング画像を MediaPipe で再解析する
2. 幾何投影 landmarks と MediaPipe returned landmarks を alignment する
3. residual evaluation を行う
4. yaw / pitch / roll の pose sweep 全体で residual を比較する

この lab で確認したい問いは、以下です。

- 3D メッシュの幾何投影と MediaPipe returned landmarks は同じ位置に出るのか
- 横向き時の `nose` / `noseBridge` residual は、Fitting Lab の候補 z 問題なのか、MediaPipe の認識特性なのか
- BAE AR の ideal landmarks は、理想 3D メッシュの機械投影を採用すべきか、それとも理想顔 render を MediaPipe がどう認識するかを採用すべきか

## 確認した主な実装 / docs

- `README.md`
- `docs/ideal-face-fitting-lab.md`
- `docs/mediapipe-canonical-lab.md`
- `docs/development-flow.md`
- `docs/architecture.md`
- `docs/ideal-face-authoring-cleanup-inventory.md`
- `tools/ideal-face-fitting-lab/src/main.ts`
- `tools/ideal-face-fitting-lab/data/canonical-face-depth-template-v1.json`
- `tools/ideal-face-fitting-lab/data/canonical-face-xyz-template-v1.json`
- `tools/ideal-face-fitting-lab/package.json`
- `tools/ideal-face-authoring/package.json`
