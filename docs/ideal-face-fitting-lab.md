# IdealFace Fitting Lab

`tools/ideal-face-fitting-lab` は、production 用 IdealFace asset を直接作る正式ツールではありません。

まずは 8 semantic points について、正面基準 x / y を固定し、8点それぞれの z と pivotZ だけを未知数として探索する検証ラボです。正面2Dだけでは z は決められないため、複数姿勢の capture frame へ candidate を回転・投影し、current 2D landmarks 8点との誤差でランキングします。

今回の主導線から、`alignmentMode`、`weighted_similarity_2d`、`zProfile`、`zScale` は外します。MediaPipe の `facialTransformationMatrix` は capture frame の yaw / pitch / roll 取得に使ってよいですが、matrix inverse で current landmarks を IdealFace3D へ戻す処理は行いません。

## 入力

MediaPipe Canonical Lab が export した captured JSON を import します。

主に使う情報:

- `landmarks`: current landmarks 478
- `pose`: yaw / pitch / roll
- `bucket`: front / yawPositive / yawNegative / pitchPositive / pitchNegative / mixedPose
- `videoWidth` / `videoHeight`
- `blendshapes`
- `facialTransformationMatrix`: pose 取得元の debug 情報として保持される場合があります

## 8 Semantic Points

| point | index |
| --- | --- |
| headTop | 10 |
| chin | 152 |
| leftCheek | 234 |
| rightCheek | 454 |
| leftEye | 474, 475, 476, 477 |
| rightEye | 469, 470, 471, 472 |
| nose | 4 |
| mouth | 13, 14 |

leftEye / rightEye は iris が取得できない場合、eye corner fallback を使います。

## 処理

1. captured JSON を読み込む
2. bucket ごとの target 数に従って capture frame を選ぶ
3. front bucket の selected frames から `base8Points2D` を作る
4. `zMin` / `zMax` / `zStep` から 8点それぞれの z 候補を作る
5. `pivotZMin` / `pivotZMax` / `pivotZStep` から pivotZ 候補を作る
6. 8点 z + pivotZ の組み合わせを `FittingCandidate8` として作る
7. candidate ごとに正面基準 x / y と z から IdealFace3D 8点を作る
8. capture frame の yaw / pitch / roll で 3D 点を回転し、2Dへ投影する
9. frame の current 2D landmarks 8点と比較する
10. frameScore と bucketScores を集計し、totalScore で ranking を作る
11. bestCandidate から `bestIdealFace8` を出力する

current 2D landmarks は各 frame の顔 bounds center を原点にした same-unit 座標へ揃えて比較します。これは candidate に合わせる 2D 再フィットではなく、front 基準 x / y と frame-local current 2D を比較可能にするための座標正規化です。

## Candidate

```ts
type FittingCandidate8 = {
  zByPointId: {
    headTop: number
    chin: number
    leftCheek: number
    rightCheek: number
    leftEye: number
    rightEye: number
    nose: number
    mouth: number
  }
  pivotZ: number
  rotationCenter?: {
    x: number
    y: number
    z: number
  }
}
```

探索範囲は UI から調整できます。

- `zMin`
- `zMax`
- `zStep`
- `pivotZMin`
- `pivotZMax`
- `pivotZStep`
- `topN`

## Search Mode

`eight_point_grid_search_v1` は、8 semantic points（8つの意味点）の z（奥行き値）と pivotZ（回転中心の奥行き）を探索する検証ラボです。

`fullGrid`（全組み合わせ格子探索）は粗探索用です。8点すべての z と pivotZ を全組み合わせで確認するため、`zStep`（奥行き刻み幅）を細かくしすぎると候補数が爆発します。

細かい調整では、`bestCandidate`（最良候補）を `baseCandidate`（基準候補）にして、`localOneDimensional`（1変数局所探索）または `coordinateDescent`（座標降下法）を使います。

現時点の安定した `baseCandidate`（基準候補）は、`pivotZ=0.12`、`leftCheek.z/rightCheek.z=0.12`、その他 z=0 です。ただし、これは debug（検証）候補であり production（本番）確定値ではありません。

```ts
type SearchMode =
  | "fullGrid"
  | "localOneDimensional"
  | "coordinateDescent"
```

`localOneDimensional` は `baseCandidate` を固定し、`pivotZ` / `headTop.z` / `chin.z` / `leftCheek.z` / `rightCheek.z` / `leftEye.z` / `rightEye.z` / `nose.z` / `mouth.z` のうち指定した 1 parameter だけを `localMin` 〜 `localMax`、`localStep` で動かします。

`coordinateDescent` は `baseCandidate` から開始し、デフォルトでは `pivotZ -> leftCheek.z -> rightCheek.z -> nose.z -> mouth.z -> leftEye.z -> rightEye.z -> headTop.z -> chin.z` の順番で 1変数局所探索を行い、各 parameter の best value で baseCandidate を更新します。初期の `coordinateDescentIterations` は `2` です。

`coordinateDescent` は `fullGrid` と異なり、`baseCandidate` を起点に parameter ごとに局所探索するため、候補数は少なく短時間で完了します。

`includeMixedPose=false` または `mixedPose target=0` の場合、`mixedPose` frame は selected frames / evaluation input に含めません。

`topCandidates` / `bucketRanking` は candidate 値で dedupe し、同一 candidate を複数表示しません。

## Local Search Preset

local search preset は、8 semantic points の z と pivotZ を手動入力なしで試すための UI 補助である。

fullGrid は粗探索用。
coordinateDescent は baseCandidate 周辺の自動微調整用。
localOneDimensional は pivotZ / nose.z / cheek.z など、1パラメータの感度確認用。

推奨手順は、Coordinate Descent Fine で大まかに微調整し、その後 PivotZ Fine / NoseZ Fine / CheekZ Fine などで個別確認すること。

Search Preset には Coordinate Descent Fine / PivotZ Fine / NoseZ Fine / LeftCheekZ Fine / RightCheekZ Fine / MouthZ Fine / Yaw Focus Fine / Pitch Focus Fine を用意する。
Base Candidate Preset には Baseline Cheek Depth / Current Fine Best / Current bestCandidate を用意する。

プリセット適用時は maxFrames=30、front / yawPositive / yawNegative / pitchPositive / pitchNegative target=5、mixedPose target=0、mixedPose 不採用、roll warning deg=12、blendshape warning=0.35、topN=100、focalLength=2.6 を基本値としてフォームへ反映する。

## Auto Search Sequence

Auto Search Sequence は、複数の local search preset を順番に実行し、各 step の bestCandidate を次 step の baseCandidate に自動反映する UI 補助である。

Fine Sequence は、Baseline Cheek Depth を起点に Coordinate Descent Fine → PivotZ Fine → NoseZ Fine → LeftCheekZ Fine → RightCheekZ Fine → MouthZ Fine の順で実行する。

Current Best Fine Sequence は、現在の bestCandidate を起点に PivotZ Fine → NoseZ Fine → LeftCheekZ Fine → RightCheekZ Fine → MouthZ Fine を実行する。

Yaw Focus Sequence は、Baseline Cheek Depth を起点に Yaw Focus Fine → PivotZ Fine → NoseZ Fine を実行する。

Pitch Focus Sequence は、Current Fine Best を起点に Pitch Focus Fine → PivotZ Fine → MouthZ Fine → NoseZ Fine を実行する。

Auto Sequence は production 用 IdealFace を確定するものではなく、8 semantic points の z / pivotZ を効率よく検証するための debug workflow である。

## Score

まずはシンプルに、投影後2D点と current 2D landmarks 8点の距離を使います。

- `pointError`: projectedIdeal2D と current2D の距離
- `frameScore`: 8点の weighted average
- `totalScore`: usable capture frames の frameScore 平均
- `bucketScores`: front / yawPositive / yawNegative / pitchPositive / pitchNegative / mixedPose ごとの frameScore 平均

派生 debug 指標として `yawAverageScore`、`pitchAverageScore`、`maxBucketScore`、`balancedScore = totalScore + maxBucketScore * 0.25` も summary に出します。これは候補比較用の検証指標であり、現時点の最終評価指標ではありません。

点ごとの weight は既存の semantic point weight を使います。

## Output

Full / Summary JSON と UI で以下を確認できます。

- candidate count
- capture frame count
- ranking top N
- bestCandidate
- bestIdealFace8
- bucketScores
- pivotZ
- headTop.z / chin.z / leftCheek.z / rightCheek.z / leftEye.z / rightEye.z / nose.z / mouth.z
- current8BucketSummary
- current8PoseComparison
- current8FrameSample

## Projection Sign Debug

Projection Sign Debug は、8点 z / pivotZ 探索で得られた候補について、z の符号や yaw / pitch 回転方向が期待通りに projection へ反映されているかを確認するための debug 機能です。

この debug は selected frames のうち `front` / `yawPositive` / `yawNegative` / `pitchPositive` / `pitchNegative` の各 bucket 先頭フレームを使います。`mixedPose` は使いません。現在の `bestCandidate` を baseCandidate とし、`nose.z` だけを `-0.04` / `-0.02` / `0` / `0.02` / `0.04` / `0.06` / `0.08` に差し替えて、projected nose / current nose / error と、leftCheek / rightCheek / mouth の詳細を出力します。

2D 誤差最小候補で `nose.z` が `cheek.z` より大きくなる場合、それが自然な顔形状を意味するとは限りません。まず projection sign / pose sign / pitch-yaw response を確認する必要があります。

この debug は score 式、bestCandidate 選定ロジック、depth prior を変更しません。候補選定前の原因切り分けに使います。

Full JSON / Summary JSON には以下が追加されます。

```ts
projectionSignDebug?: {
  baseCandidate: FittingCandidate8
  noseZCandidates: number[]
  rows: ProjectionSignDebugRow[]
  summary: ProjectionSignDebugSummary
}
```

## Rotation Center Debug

Rotation Center Debug は、8点 z / pivotZ 探索で得られた候補について、回転中心を `(0, 0, pivotZ)` 固定と仮定することが pitch / yaw の投影誤差にどのような影響を与えるかを確認するための debug 機能である。

実際の頭部回転中心は顔表面中心ではなく、頭部内部・眼窩奥・耳の間・首寄りに存在する可能性がある。

回転中心が誤っている場合、探索された z は顔形状の奥行きではなく、回転中心誤差を吸収した値になる可能性がある。

この debug は score や探索ロジックを変更せず、pivotY / pivotZ の影響を切り分けるために使う。`pivotX` はまず `0` 固定とし、`pivotY` と `pivotZ` の候補を組み合わせて selected frames に対する score を比較する。

Full JSON / Summary JSON には以下が追加される。

```ts
rotationCenterDebug?: {
  baseCandidate: FittingCandidate8
  baseCandidateName: string
  pivotXCandidates: number[]
  pivotYCandidates: number[]
  pivotZCandidates: number[]
  results: RotationCenterDebugResult[]
  summary: RotationCenterDebugSummary
}
```

## Rotation Center Search

Rotation Center Search は、Rotation Center Debug で有望になった `rotationCenter.y` / `rotationCenter.z` を、local search / coordinateDescent / Auto Sequence の探索対象に昇格したものです。

従来は回転中心を `(0, 0, pivotZ)` と仮定していましたが、この仮定では pitch 誤差を `nose.z` / `mouth.z` などが吸収する可能性があります。

Rotation Center Search では、`rotationCenter.y` / `rotationCenter.z` を先に調整し、その後 8 semantic points の z を再探索します。

`rotationCenter` は projection 用の回転中心であり、IdealFace8 `points[].z` に焼き込む値ではありません。既存互換のため `pivotZ` は残しますが、`rotationCenter.z` を探索する candidate では `pivotZ` も同じ値に揃えます。

local search / coordinateDescent の parameter には以下を追加します。

```text
rotationCenter.y
rotationCenter.z
```

Rotation Center Search 用の preset は以下です。

- `Rotation Center Fine`: `rotationCenter.y` / `rotationCenter.z` だけを coordinateDescent で調整する。
- `Rotation Center + 8Point Fine`: `rotationCenter.y` / `rotationCenter.z` を先に調整し、その後 8 semantic points の z を調整する。

Auto Sequence には以下を追加します。

- `Rotation Center Fine Sequence`: `Rotation Center Debug Best` を起点に、Rotation Center Fine → Rotation Center + 8Point Fine → NoseZ Fine → MouthZ Fine を実行する。
- `Natural Nose Rotation Center Sequence`: `Natural Nose With Rotation Center` を起点に、同じ手順で nose.z が自然寄りでも score が出るか確認する。

## Objective Mode

Objective Mode は、探索中にどの評価指標を最小化するかを切り替えるための設定である。

`totalScore` は従来挙動で、全体の 2D 誤差を最小化する。

`balancedScore` は `totalScore` と `maxBucketScore` を組み合わせた既存 debug 指標を最小化する。

`maxBucketScore` は `front` / `yawPositive` / `yawNegative` / `pitchPositive` / `pitchNegative` のうち、最も悪い bucket score を最小化する。これにより、総合平均は良いが一部姿勢だけ破綻する候補を見つけやすくする。

`pitchAverageScore` は `pitchPositive` / `pitchNegative` の平均を、`yawAverageScore` は `yawPositive` / `yawNegative` の平均を最小化する確認用の objective である。

`bestCandidate` と `topCandidates` の ranking は選択中の `objectiveMode` で比較する。JSON には比較に使った `objectiveMode` / `objectiveScore` を出しつつ、従来どおり `totalScore` / `bucketScores` / `scoreDebug` も保持する。

Rotation Center Search の初期確認で `rotationCenter.y` が探索範囲下限に張り付いたため、default range は `rotationCenter.y = -0.24 .. 0.00 / step 0.01`、`rotationCenter.z = 0.02 .. 0.12 / step 0.01` に拡張する。`Rotation Center Fine` 系 preset では `rotationCenter.y = -0.24 .. 0.00 / step 0.005`、`rotationCenter.z = 0.02 .. 0.12 / step 0.005` を使う。

Objective Mode 付き preset として、以下を追加する。

- `Rotation Center Fine - Balanced`
- `Rotation Center Fine - MaxBucket`
- `Rotation Center + 8Point Fine - Balanced`
- `Rotation Center + 8Point Fine - MaxBucket`

Auto Sequence には、以下を追加する。

- `Rotation Center Balanced Sequence`
- `Rotation Center MaxBucket Sequence`
- `Natural Nose Balanced Sequence`
- `Natural Nose MaxBucket Sequence`

## Worker Grid Search

grid search はブラウザ main thread ではなく Web Worker で実行します。
UI thread は import、設定入力、進捗表示、cancel 操作、完了後の結果表示だけを担当します。

- candidate は chunk 単位で処理し、全 candidate の配列は作りません。
- Worker は z 候補 index と pivotZ 候補 index の cursor を進めながら `FittingCandidate8` を逐次生成します。
- main thread へは進捗率、処理済み candidate 数、推定総 candidate 数を返します。
- cancel は Worker へ cancel message を送り、chunk 境界で処理を止めます。
- overall ranking は `topN` 件だけ保持します。
- `bucketRanking` も bucket ごとに `topN` 件だけ保持します。
- Full / Summary JSON export は search completed 後だけ有効にします。
- 処理中の JSON preview は source summary / semantic mapping など軽い情報に留め、巨大な候補配列は生成しません。

GPU / WebGPU による探索はまだ実装しません。現時点では CPU Worker の chunked search を前提にします。

## 今回行わないこと

- alignmentMode による 2D 再フィット
- `weighted_similarity_2d`
- `zProfile`
- `zScale`
- matrix inverse で current landmarks を標準顔座標へ戻す処理
- 478点への拡張
- Runtime への組み込み
- production 用 asset 出力
- Engine schema 変更
- Beauty Studio 変更
- GPU / WebGPU search

## 起動

```bash
npm run start:ideal-face-fitting-lab
```
