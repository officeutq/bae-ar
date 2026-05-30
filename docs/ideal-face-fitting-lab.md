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

## Score

まずはシンプルに、投影後2D点と current 2D landmarks 8点の距離を使います。

- `pointError`: projectedIdeal2D と current2D の距離
- `frameScore`: 8点の weighted average
- `totalScore`: usable capture frames の frameScore 平均
- `bucketScores`: front / yawPositive / yawNegative / pitchPositive / pitchNegative / mixedPose ごとの frameScore 平均

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

## 起動

```bash
npm run start:ideal-face-fitting-lab
```
