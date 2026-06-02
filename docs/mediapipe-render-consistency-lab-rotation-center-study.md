# MediaPipe Render Consistency Lab rotationCenter study

## Purpose

このドキュメントは、`tools/mediapipe-render-consistency-lab` で次に `rotationCenter(0, y, z)`（投影用回転中心）の `y,z` 推定を設計するための事前調査です。

調査対象は、過去に `tools/ideal-face-fitting-lab` で行った `rotationCenter` / `pivotZ`（投影基準奥行き） / `12pt_rotation_center`（回転中心推定向け12点） / 478点 z 推定の実験経緯です。ここで整理する内容は debug lab（検証ラボ）の設計準備であり、production asset export（本番用アセット書き出し）ではありません。

## Background from IdealFace Fitting Lab

`tools/ideal-face-fitting-lab` は、MediaPipe capture JSON を入力にして、候補 3D を selected frames（選択フレーム）の pose（姿勢）へ投影し、observed current landmarks（観測された現在顔ランドマーク）と合うかを評価する debug lab でした。

既存 docs では、代表的な 478点 z debug candidate（デバッグ候補）生成方針は以下として整理されています。

```text
canonical-face-depth-template-v1.json
  +
12pt_rotation_center
  +
canonicalDepthBased
  +
perLandmarkZSearch
```

これは、MediaPipe canonical face model（MediaPipe標準顔モデル）をそのまま BAE AR IdealFace（理想顔）にする方針ではありません。`canonical-face-depth-template-v1.json`（標準顔奥行きテンプレート）を参照基準にし、投影評価で selected frames に合うかを見た debug prototype（試作）です。

実コードでは、`tools/ideal-face-fitting-lab/src/main.ts` と `tools/ideal-face-fitting-lab/src/searchWorker.ts` の両方に `SemanticPointSetId = "8pt_basic" | "12pt_rotation_center" | "24pt_structure"` があり、Quick Run（簡易実行）の主導線は `QUICK_478_DEPTH_SEMANTIC_POINT_SET_ID = "12pt_rotation_center"` です。

## What rotationCenter meant in Fitting Lab

Fitting Lab における `rotationCenter`（回転中心）は、candidate 3D を yaw / pitch / roll（左右向き / 上下向き / 傾き）で回転して 2D 投影するための pivot（軸点）です。点ごとの z に焼き込む値ではありません。

実コードでは `FittingCandidate8` が `pivotZ` と optional な `rotationCenter` を持ちます。`searchWorker.ts` の `projectIdealPoints()` は、各 point を `rotationCenter` だけ引いてから `rotatePoint3D()` し、回転後に `rotationCenter` を足し戻して perspective（透視投影）をかけます。

```text
ideal3D point
  -> subtract rotationCenter
  -> rotate by selected frame pose
  -> add rotationCenter
  -> perspective projection
```

`rotationCenter.y` / `rotationCenter.z` は local search（局所探索）や coordinate descent（座標降下探索）の探索パラメータです。`rotationCenter.x` は基本的に `0` として扱われ、今回の Render Consistency Lab でも `rotationCenter(0, y, z)` の前提にできます。

`pivotZ` との関係は互換用です。古い候補は `rotationCenter` を持たず、`getProjectionRotationCenter()` / `getCandidateRotationCenter()` が `{ x: 0, y: 0, z: pivotZ }` を返します。一方、`rotationCenter.z` を更新する候補では `pivotZ` も同じ値に揃えています。つまり、`pivotZ` は legacy（旧来）な投影基準奥行きとして残り、`rotationCenter.z` が入る候補では同値の互換フィールドとして扱われます。

`buildBestIdealFace8()` の `zApplication` には、`points[].z` は candidate の `zByPointId` であり、`rotationCenter` は projection 用の回転中心として source に記録し、点の z には焼き込まない、と明記されています。この方針は Render Consistency Lab にも引き継ぐべきです。

## Why 12pt_rotation_center was used

`8pt_basic`（基本8点）は、`headTop`、`chin`、`leftCheek`、`rightCheek`、`leftEye`、`rightEye`、`nose`、`mouth` です。軽くて安定しやすい一方、`rotationCenter` や顔構造の推定には粗さが残りました。

`12pt_rotation_center` は、8点に以下を追加した 12 点です。

- `noseBridge`（鼻筋）
- `leftJaw`（左顎）
- `rightJaw`（右顎）
- `upperFaceCenter`（上顔面中心）

狙いは、8点の安定性を大きく崩さず、`rotationCenter` / `pivotZ` / 主要 z 推定に効く中心軸と顎まわりの情報を増やすことでした。既存 docs では、Quick Run で `passed` になり、Depth Relation Debug（奥行き関係デバッグ）と projection error（投影誤差）の両方が許容範囲に入ったため、現時点の推奨とされています。

`24pt_structure`（構造確認向け24点）は、12点に `leftNoseSide`、`rightNoseSide`、`leftEyeOuter`、`rightEyeOuter`、`leftEyeInner`、`rightEyeInner`、`leftTemple`、`rightTemple`、`leftMouthCorner`、`rightMouthCorner`、`lowerJawLeft`、`lowerJawRight` を追加します。構造情報は増えますが、表情差、MediaPipe 検出ブレ、追加点の局所誤差も拾いやすいため、本命ではなく比較用として残されました。

## Evaluation flow in Fitting Lab

Fitting Lab の基本評価は、候補 3D を selected frames の pose へ投影し、observed current landmarks と同じ coordinate space（座標空間）へ正規化して比較する流れでした。

```text
selected frames
  -> facialTransformationMatrix から yaw / pitch / roll を取得
  -> front bucket average から基準 x/y を作る
  -> candidate z と rotationCenter で 3D candidate を作る
  -> selected frame の pose へ回転・投影
  -> current landmarks を same-unit centered coordinate へ正規化
  -> projected 2D と observed 2D の distance を計算
```

`searchWorker.ts` では、`evaluateCandidate()` が frame ごとの `evaluateCandidateOnFrame()` を集約します。`evaluateCandidateOnFrame()` は `projectIdealPoints()` で projected points（投影点）を作り、`normalizeCurrentPointsForScoring()` で current points（現在点）を同じ座標系へ変換し、`calculatePerPointErrors()` で各 semantic point（意味点）の 2D distance（距離）を出します。

主要な評価値の意味は以下です。

- `pointError` / `perPointError`: 各 point の projected 2D と observed 2D の距離。
- `frameScore` / `weightedSemanticDistance`: 1 frame 内の point error を score weight（重み）付き平均した値。
- `totalScore`: selected frames 全体の `weightedSemanticDistance` 平均。
- `bucketScores`: `front`、`yawPositive`、`yawNegative`、`pitchPositive`、`pitchNegative`、`mixedPose` ごとの平均 score。
- `averageProjectionError`: 478点候補では、frame ごとの projected 478 と current 478 の平均距離をさらに全 frame で平均した値。
- `maxBucketScore`: bucket score の最大値。全体平均だけ良いが一部姿勢で破綻する候補を見つけるために使われます。
- `balancedScore`: `totalScore + maxBucketScore * 0.25`。平均だけでなく worst bucket（最悪姿勢分類）も軽く抑える debug objective（評価目的）です。

12点投影評価の `poseProjectionEvaluation12pt` は、`12pt_rotation_center` だけを対象に、`front`、`yawPositive`、`yawNegative`、`pitchPositive`、`pitchNegative` を評価します。`mixedPose` はこの 12点評価では外されています。比較対象は主に `current12ptFinalCandidate`、`structureAware12ptWouldSelectCandidate`、`8ptStructureAwareBest` です。

`poseWeightedProjectionEvaluation12pt` は、その residual（残差）に姿勢重みを付ける debug evaluation です。実装上は `max_abs_yaw_pitch` による angle magnitude weight（姿勢角の大きさ重み）と bucket weight（姿勢分類重み）を持ち、通常評価で見えた傾向が重み付きでも変わらないかを確認します。

## Known representative result

既存 docs に残っている代表値は以下です。

```text
quickRun.status = passed
semanticPointSetId = 12pt_rotation_center
sourceSemanticPointSetId = 12pt_rotation_center

noseTipGroupZ = 0.005535
cheekGroupZ   = 0.013005
delta          = -0.00747
margin         = 0.005

averageProjectionError = 0.031754
rotationCenter.y = -0.14
rotationCenter.z = 0.04
```

Fitting Lab では `z が小さい = 手前`、`z が大きい = 奥` と扱います。そのため `noseTipGroupZ < cheekGroupZ` なら鼻先が頬より手前です。代表値では `delta = noseTipGroupZ - cheekGroupZ = -0.00747` で、`-margin = -0.005` より小さいため、鼻先が頬より十分手前という Depth Relation Debug を満たしています。

12点投影評価では、`current12ptFinalCandidate` と `structureAware12ptWouldSelectCandidate` は投影評価上ほぼ同等、通常評価でも姿勢重み付き評価でも大きな結論は変わらない、と整理されています。worstBucket（最悪姿勢分類）は `yawPositive`、worstPoint（最悪点）は `nose` で、問題の中心は jaw（顎）より横向き時の `nose` / `noseBridge`（鼻筋）投影残差に見える、という引き継ぎがあります。

## Relationship with canonicalDepthBased and perLandmarkZSearch

`rotationCenter(0, y, z)` 推定と 478点 z 推定はつながっていますが、同じ問題ではありません。

Fitting Lab では、まず `12pt_rotation_center` で `rotationCenter` / `pivotZ` / 主要 z を推定し、その candidate を source（元候補）として 478点の debug candidate を生成しました。`rotationCenter` は 478点候補にも保持され、478点投影評価や `perLandmarkZSearch` の single landmark projection（単一ランドマーク投影）でも同じ回転中心として使われます。

`canonical-face-depth-template-v1.json` は、MediaPipe canonical face model OBJ から作った Fitting Lab 用の奥行き参照です。`sourceLandmarkCount` は 468、`targetLandmarkCount` は 478 で、`0..467` を canonical comparison 対象、`468..477` を iris fallback（虹彩補完）対象として扱います。これは IdealFace そのものではなく、478点 z の仮値を作るための参照基準です。

`canonicalDepthBased` は、canonical depth の z を source candidate の semantic points へ least squares（最小二乗）で fit し、`canonicalZ * scale + offset` で 478点の仮 z を作る方式です。`468..477` は canonical model に存在しないため、左右目の z から fallback します。

`perLandmarkZSearch` は、`canonicalDepthBased` が作った `baseZ` を起点に、各 landmark の z だけを 1 点ずつ 1次元探索する debug refinement（デバッグ用微調整）です。score は `projectionError + canonicalDeviationPenalty` です。478点を同時に総当たり探索すると組み合わせ爆発が起きるため、各点を独立に扱い、しかも評価時は対象 1 点だけを投影する設計にしていました。

今回の `rotationCenter(0, y, z)` 推定は、478点 z の最終決定ではありません。Render Consistency Lab では、まず selected frames と adjusted12pt（手動調整反映後12点）で回転中心だけを評価し、その後必要なら 478点 z や mesh-ready refinement（メッシュ前提の微調整）へ接続するのが安全です。

## What should be reused in Render Consistency Lab

Render Consistency Lab で再利用すべき考え方は以下です。

- `rotationCenter` は点の z に焼き込まず、projection 用の回転中心として保持する。
- `rotationCenter.x` はまず `0` 固定にし、`rotationCenter.y` / `rotationCenter.z` の grid search（格子探索）から始める。
- `12pt_rotation_center` の point set を初期評価対象にする。
- `front` 相当の frame から基準 x/y を作り、selected frame の yaw / pitch / roll へ投影して observed 12pt と比較する。
- `front`、yaw 正負、pitch 正負、roll 正負/中心の bucket 別 score を持ち、平均だけでなく worst bucket を見る。
- Depth Relation Debug の `z が小さい = 手前` という convention（規約）を明示する。
- `averageProjectionError` だけでなく、point 別、bucket 別、worstPoint / worstBucket を見る。

Render Consistency Lab 側の既存実装では、`acceptedFrames`、`observed12pt`、manual adjustments（手動調整）、`adjusted12pt`、`poseBucket125`、pose review candidates（姿勢レビュー候補）がすでにあります。`tools/mediapipe-render-consistency-lab/src/main.ts` では、`poseBucket125` が yaw / pitch / roll 各5分類で、pose review candidate 抽出は yaw × pitch の25 bucket を主分類にし、roll は `roll_negative` / `roll_center` / `roll_positive` でバランスを取ります。

これは `rotationCenter.y` 推定に特に有用です。roll が偏った selected frames だけで評価すると、顔の縦方向 pivot（`rotationCenter.y`）の誤差と画像上の傾き由来の誤差が混ざる可能性があります。候補抽出で roll balance（roll の均衡）を維持し、bucket 別に score を見ることで、`rotationCenter.y` が roll 偏りを吸収してしまう候補を避けやすくなります。

## Proposed next design direction

次回はまだ production asset export へ進まず、Render Consistency Lab 内の debug design（検証設計）として、以下の流れを設計するのがよいです。

```text
acceptedFrames
  -> expressionTooStrong を除いた pose review candidates
  -> roll balanced selected frames
  -> adjusted12pt
  -> front / center frame から base 12pt x/y を作る
  -> candidate rotationCenter.y/z grid search
  -> projected 12pt comparison
  -> yaw / pitch / roll bucket score
  -> worstPoint / worstBucket / balancedScore
  -> best rotationCenter.y/z candidate
```

初期設計では、Fitting Lab の全機能を移植しない方がよいです。再利用するのは、projection formula（投影式）、`rotationCenter` の扱い、12点 residual（残差）評価、bucket 別評価です。一方、Fitting Lab の `canonicalDepthBased`、`perLandmarkZSearch`、478点 depth generation（奥行き生成）は今回の `rotationCenter` 推定からは切り離します。

Render Consistency Lab 用に変えるべき点は以下です。

- 入力は capture JSON ではなく、MP4 auto scan から作られた `acceptedFrames` と `adjusted12pt` を使う。
- Fitting Lab の粗い `front` / `yawPositive` / `yawNegative` / `pitchPositive` / `pitchNegative` だけでなく、`poseBucket125` と pose review candidates の roll balance を使う。
- `expressionTooStrong` は production 除外ではなく debug 用 badge として扱いつつ、候補フレーム抽出では除外する。
- 12点の手動調整は、保存や export ではなく、その場の推定入力として扱う。
- 478点 full landmarks、mesh render、MediaPipe re-detection は、今回の `rotationCenter` 推定設計の後段として分ける。

座標系の詳細は [MediaPipe Render Consistency Lab](mediapipe-render-consistency-lab.md) の `Coordinate policy for 12pt and rotationCenter estimation` を参照する。`adjusted12pt` は image-normalized coordinate（画像正規化座標）のまま保存し、推定直前に same-unit centered coordinate（同一単位・中心化座標）へ変換して使う。

## Things not to change

今回の設計準備で変更してはいけないことは以下です。

- production asset export と混同しない。
- IdealFace Authoring Tool Step 2-I の production 生成ロジックと混同しない。
- Runtime / Studio の Projection 仕様を勝手に変更しない。
- MediaPipe canonical face model を BAE AR IdealFace として扱わない。
- 478点 z の最終決定と今回の `rotationCenter` 推定を混同しない。
- Fitting Lab の既存実装を Render Consistency Lab の都合で直接変更しない。
- `rotationCenter` を各 landmark の z に焼き込まない。

## Open questions

- Render Consistency Lab の `adjusted12pt` は、どの frame を base x/y 生成に使うべきか。まずは frontCandidate（正面候補）または yaw / pitch / roll center bucket を優先し、不足時だけ roll-balanced selected frames の平均へ fallback する案が自然です。
- `rotationCenter.y` の探索範囲は、Fitting Lab と同じ `-0.24 .. 0.00` から始めるか、Render Consistency Lab の `adjusted12pt` 座標スケールに合わせて再定義する必要があるか。
- `rotationCenter.z` の探索範囲は、Fitting Lab の `0.02 .. 0.12` を初期値にできるが、Render Consistency Lab の base 12pt z をまだ持たない段階では、どの candidate z と組み合わせるかを明示する必要がある。
- roll bucket を score にどう入れるか。yaw × pitch を主分類にしつつ roll group 別 residual summary（残差要約）を併記するのが初期実装として安全です。
- 12点の candidate z は、Fitting Lab の代表候補を一時入力にするのか、Render Consistency Lab 内で別途 z preset（奥行きプリセット）として持つのか。

## Checked files

- `README.md`
- `docs/ideal-face-fitting-lab.md`
- `docs/ideal-face-fitting-lab-experiment-summary.md`
- `docs/mediapipe-render-consistency-lab.md`
- `docs/repository-structure.md`
- `tools/ideal-face-fitting-lab/src/main.ts`
- `tools/ideal-face-fitting-lab/src/searchWorker.ts`
- `tools/ideal-face-fitting-lab/data/canonical-face-depth-template-v1.json`
- `tools/ideal-face-fitting-lab/data/canonical-face-xyz-template-v1.json`
- `tools/mediapipe-render-consistency-lab/src/main.ts`
