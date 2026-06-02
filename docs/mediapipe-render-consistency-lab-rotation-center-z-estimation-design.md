# MediaPipe Render Consistency Lab rotationCenter / 12pt z simultaneous estimation design

## Purpose

このドキュメントは、`tools/mediapipe-render-consistency-lab` で rotationCenter（投影用回転中心）と 12pt z（12点奥行き）を同時に推定するための設計メモです。

目的は、正面顔の adjusted12pt（手動調整後12点）から `x` / `y` を固定し、12点それぞれの `z` と `rotationCenter.y` / `rotationCenter.z` を、複数姿勢フレームへの projection（投影）誤差で評価することです。

今回は実装しません。production export（本番書き出し）ではなく、Render Consistency Lab 内の debug design（検証設計）として扱います。

## Inputs

入力は Render Consistency Lab がすでに持つ review data（レビュー用データ）を使う。

- `acceptedFrames`: MP4 auto scan（自動スキャン）で採用されたフレーム群。
- `pose review candidates`: yaw / pitch / roll（左右向き / 上下向き / 傾き）の balance（均衡）を見て抽出した候補フレーム。
- `adjusted12pt`: `observed12pt + manualAdjustmentsByFrame` で作る手動調整後の12点。
- `facialTransformationMatrix`: MediaPipe Face Landmarker 由来の顔姿勢行列。ここから yaw / pitch / roll を使う。
- `videoAspectRatio`: 動画の `width / height`。

正面顔の base frame（基準フレーム）は、まず `frontCandidate` または yaw / pitch / roll が center bucket（中央分類）に近い frame から選ぶ。正面候補が不足する場合は、roll-balanced selected frames（roll 偏りを抑えた選択フレーム）の代表値へ fallback（代替）する。

## Coordinate System

`adjusted12pt` は MediaPipe landmarks（メディアパイプ通常ランドマーク）と同じ image-normalized coordinate（画像正規化座標）で保持する。

- `x` / `y` は画像左上基準の `0..1`。
- `z` は MediaPipe `NormalizedLandmark.z` ではなく、この設計で推定する candidate z（候補奥行き）として別に扱う。
- overlay（重ね描画）用の canvas pixel coordinate（canvas 内部ピクセル座標）は推定入力に使わない。

推定時の比較座標は aspect-corrected image coordinate（横縦比補正済み画像座標）とする。

```text
candidateX = adjusted12pt.x * videoAspectRatio
candidateY = adjusted12pt.y
rotationCenter.x = 0.5 * videoAspectRatio
```

今回の同時推定設計では、face bounds center（顔外枠中心）を引かない。顔幅で割る normalization（正規化）もしない。これは、正面顔の `adjusted12pt.x/y` と各フレームの `adjusted12pt.x/y` を同じ image coordinate（画像座標）上で比較し、scale（拡大縮小）や center shift（中心移動）を別問題として混ぜないためです。

## Fixed Values

固定する値は以下です。

- base 12pt の `x`: 正面顔の `adjusted12pt.x * videoAspectRatio`。
- base 12pt の `y`: 正面顔の `adjusted12pt.y`。
- `rotationCenter.x`: `0.5 * videoAspectRatio`。
- 各 selected frame の pose: その frame の yaw / pitch / roll。

`rotationCenter` は各 landmark（ランドマーク）の `z` に焼き込まない。projection 用の pivot（回転軸点）として保持する。

## Unknowns To Estimate

推定する未知数は合計14個です。

- 12点それぞれの `z`: 12個。
- `rotationCenter.y`: 1個。
- `rotationCenter.z`: 1個。

```text
unknowns =
  z[headTop]
  z[chin]
  z[leftCheek]
  z[rightCheek]
  z[leftEye]
  z[rightEye]
  z[nose]
  z[mouth]
  z[noseBridge]
  z[leftJaw]
  z[rightJaw]
  z[upperFaceCenter]
  rotationCenter.y
  rotationCenter.z
```

## Score

score（誤差スコア）は、各 candidate（候補）を selected frames の yaw / pitch / roll で投影し、projected12pt（投影後12点）と frame adjusted12pt（各フレームの手動調整後12点）を比較して計算する。

基本単位は 2D distance（2次元距離）です。

```text
pointError = distance(projected12pt[pointId], frameAdjusted12pt[pointId])
frameScore = weighted average(pointError for 12pt)
totalScore = average(frameScore for selected frames)
```

必要に応じて、以下を score に含める。

- point weight（点ごとの重み）: nose / noseBridge / jaw など、回転中心や奥行きに効く点を少し強める。
- symmetry penalty（左右対称ペナルティ）: left / right pair の z が極端に離れすぎる候補を抑える。
- smoothness penalty（滑らかさペナルティ）: 隣接 group の z が不自然に飛ぶ候補を抑える。
- depth relation penalty（奥行き関係ペナルティ）: nose が cheek より十分手前に来る、などの Fitting Lab 由来の関係を soft constraint（柔らかい制約）として扱う。
- bucket penalty（姿勢分類ペナルティ）: worst bucket（最悪姿勢分類）の error が大きい候補を抑える。

初期実装では、hard reject（強制除外）を増やしすぎず、まずは score breakdown（スコア内訳）を表示して挙動を観察する。

## Why Not 14-Dimensional Full Grid Search

14個の未知数を単純な grid search（格子探索）で同時総当たりしてはいけない。

例えば、各パラメータを 11 通りだけ試す場合でも、候補数は `11^14` になります。これは実験用 UI で逐次評価できる規模ではなく、組み合わせ爆発を起こします。

Fitting Lab の `perLandmarkZSearch`（ランドマーク単位 z 探索）も、478点 z を同時総当たりしていません。`canonicalDepthBased`（標準顔奥行きベース方式）の baseZ（基準奥行き）を起点に、1点ずつ 1D search（1次元探索）で微調整することで候補数を抑えていました。

Render Consistency Lab でも同じ考え方を使い、coarse-to-fine（粗から細へ）と coordinate descent（座標降下法）で段階的に探索する。

## Search Strategy

### Stage A: rotationCenter.y/z coarse search

最初に `z` を単純な preset（初期奥行き）へ固定し、`rotationCenter.y` / `rotationCenter.z` だけを coarse search（粗探索）する。

狙いは、回転中心が明らかに不自然な領域を早めに捨てることです。

`tools/mediapipe-render-consistency-lab` の `回転中心評価・粗探索` ボタンは、この Stage A（段階A）だけを実行する。固定 12pt z preset（12点奥行きプリセット）は `rotationFitDebugPreset_provisional_v1` を使い、`rotationCenter.x = 0.5 * videoAspectRatio` を固定する。12点 z 探索、14未知数の同時探索、mesh / render / MediaPipe re-detection（再検出）、production export（本番書き出し）はまだ行わない。

初期結果で `bestRotationCenter.y`（最良の回転中心y）が探索範囲上限に張り付き、`-0.24 .. 0.16` でも上限に張り付いたため、Stage A の再確認用に `rotationCenter.y`（回転中心の縦方向）の探索範囲を `-0.24 .. 0.40` へ広げる。`rotationCenter.z`（回転中心の奥行き方向）は現状維持とする。Summary（要約）と Raw JSON（生デバッグ JSON）には `boundaryStatus`（範囲端ヒット状態）を表示し、探索範囲不足を確認できるようにする。

それでも `bestYAtMax`（最良yが探索範囲上限にある状態）が続く場合は、探索範囲をさらに広げるより、固定 12pt z preset（12点奥行きプリセット）の不一致を疑い、次の group z search（グループ単位奥行き探索）へ進む判断材料にする。この Stage A ではまだ 12pt z search（12点奥行き探索）は行わない。

探索範囲:

```text
rotationCenter.y = -0.24 .. 0.40 / step 0.02
rotationCenter.z = 0.00 .. 0.12 / step 0.01
```

```text
base12pt.x/y fixed from front adjusted12pt
base12pt.z = initial group preset
for rotationCenter.y candidates
  for rotationCenter.z candidates
    project to selected frames
    evaluate 12pt score and bucket score
```

候補範囲は Fitting Lab の代表値を参考にできるが、Render Consistency Lab の座標系では `rotationCenter.x = 0.5 * videoAspectRatio` とするため、最終範囲は実測 score を見て再定義する。

### Stage B: group z search

Stage A（段階A）で `rotationCenter.y`（回転中心の縦方向）の探索範囲を `-0.24 .. 0.40 / step 0.02` まで広げても、`bestRotationCenter.y`（最良の回転中心y）が上限 `0.40` に張り付いた。ここからは `rotationCenter.y`（回転中心の縦方向）をさらに広げるのではなく、固定 `12pt z preset`（12点奥行きプリセット）が合っていない可能性を確認するため、Stage B（段階B）の `group z search`（グループ単位奥行き探索）へ進む。

Stage B（段階B）は `rotationFitDebugPreset_provisional_v1`（検証用の暫定奥行きプリセット）に group offset（グループ単位の奥行き加算量）を足して、固定 z preset（固定奥行きプリセット）の不一致を確認・補正する debug search（検証用探索）である。`rotationCenter.y/z`（回転中心の縦方向・奥行き方向）は Stage A（段階A）の best candidate（最良候補）を固定して使う。

この段階ではまだ `per-point z search`（点単位奥行き探索）、本格的な `coordinate descent`（座標降下法）、`14 unknowns optimization`（14個の未知数の同時最適化）、mesh（メッシュ化） / render（レンダリング） / MediaPipe re-detection（MediaPipe再検出）、production export（本番書き出し）には進まない。

次に 12点を group（グループ）へ分け、group z（グループ単位奥行き）を探索する。

初期 group 案:

- center axis（中心軸）: `headTop`, `upperFaceCenter`, `noseBridge`, `nose`, `mouth`, `chin`
- cheek group（頬）: `leftCheek`, `rightCheek`
- jaw group（顎）: `leftJaw`, `rightJaw`
- eye group（目）: `leftEye`, `rightEye`

group z search では、各 group の offset（オフセット）を 1つずつ動かし、左右 pair（左右対）には同じ offset を入れる。これにより、12点をいきなり個別に動かすよりも、顔構造として破綻しにくい candidate を作れる。

### Stage C: per-point z fine tuning

group z が落ち着いた後、per-point z（点単位奥行き）を 1点ずつ fine tuning（微調整）する。

```text
for pointId in searchOrder
  keep other z values fixed
  try z candidates around current point z
  keep the best z for that point
```

searchOrder（探索順）は、回転中心と投影差に効きやすい点から始める。

```text
nose
noseBridge
mouth
chin
leftCheek
rightCheek
leftJaw
rightJaw
upperFaceCenter
leftEye
rightEye
headTop
```

この stage は Fitting Lab の `perLandmarkZSearch` と同じく、全点同時探索ではなく、1点だけを動かす debug refinement（検証用微調整）として扱う。

### Stage D: coordinate descent refinement

最後に `rotationCenter.y` / `rotationCenter.z` と 12点 z を同じ candidate state（候補状態）の中で coordinate descent（座標降下法）する。

```text
parameters =
  rotationCenter.y
  rotationCenter.z
  group z offsets
  per-point z values

repeat for a small iteration count
  for parameter in ordered parameters
    run local 1D search around current value
    update candidate if score improves
  reduce step size
```

iteration count（反復回数）は最初は小さくする。score が改善しても、bucket score や left/right symmetry（左右対称性）が悪化する場合は、best candidate として採用しない。

## Bucket Score

bucket score（姿勢分類ごとの誤差）は、候補が一部姿勢だけに過適合していないかを見るために使う。

最低限、以下を分けて表示する。

- yaw negative / center / positive
- pitch negative / center / positive
- roll negative / center / positive
- combined yaw x pitch bucket

候補の ranking（順位付け）は `totalScore` だけで決めない。

```text
balancedScore = totalScore + maxBucketScore * bucketPenaltyWeight
```

`maxBucketScore`（最悪分類スコア）を併用すると、平均は良いが横向きや roll 付きの frame で崩れる candidate を避けやすくなる。

## Relationship With Roll Balance

roll balance（roll の均衡）は、`rotationCenter.y` 推定に特に重要です。

roll が片側に偏った selected frames だけで評価すると、画像上の傾き由来のズレを `rotationCenter.y` や point z が吸収してしまう可能性があります。pose review candidates（姿勢レビュー候補）では、yaw x pitch の coverage（網羅性）を維持しつつ、`roll_negative` / `roll_center` / `roll_positive` をできるだけ均衡させる。

評価時も、roll bucket ごとの score を出し、特定 roll group（roll 分類）だけで改善する candidate を警戒する。

## Things Not To Do

この設計では以下を行わない。

- production export（本番書き出し）。
- Engine Runtime（実行時エンジン）変更。
- Beauty Studio（開発スタジオ）変更。
- mesh / render / MediaPipe re-detection（メッシュ化 / レンダリング / MediaPipe 再検出）。
- 478点 z の最終決定。
- MediaPipe canonical face model（MediaPipe 標準顔モデル）を BAE AR IdealFace として採用すること。
- overlay 用 pixel coordinate を推定入力に使うこと。
- `rotationCenter` を各 point の z に焼き込むこと。

## Next Minimal Implementation Step

次の最小実装は、探索全体を一度に作らず、score evaluator（スコア評価器）から始める。

1. `acceptedFrames` / pose review candidates / `adjusted12pt` から evaluation frames（評価フレーム）を作る。
2. 正面候補から base 12pt `x/y` を作り、`x` だけ `videoAspectRatio` を掛ける。
3. fixed `z` preset と fixed `rotationCenter` を受け取り、各 frame へ projected12pt を作る純粋関数を用意する。
4. projected12pt と frame adjusted12pt の point error / frameScore / bucketScores を計算する。
5. Debug Console（デバッグコンソール）へ score breakdown を表示する。
6. その後、Stage A の `rotationCenter.y/z` coarse search だけを追加する。

この順序なら、探索ロジックを増やす前に、座標系、pose projection（姿勢投影）、score 表示が正しくつながっているかを確認できる。

## Implemented debug connection check

- Render Consistency Lab に `Rotation Fit（回転中心評価）` タブを追加し、一時的な debug UI（検証用 UI）として score evaluator（スコア評価器）の接続確認を行う。
- 今回は本格探索ではなく、`rotationCenter.x = 0.5 * videoAspectRatio`、`rotationCenter.y = -0.14`、`rotationCenter.z = 0.04` と固定 12pt z preset（12点奥行きプリセット）を使う。
- `base12pt` は正面候補または姿勢中央に近い selected frame の adjusted12pt（手動調整後12点）から作り、`x = adjusted12pt.x * videoAspectRatio`、`y = adjusted12pt.y`、`z = rotationFitDebugPreset_provisional_v1` とする。
- 各 evaluation frame（評価フレーム）では projected12pt（投影後12点）と frame adjusted12pt（各フレームの手動調整後12点）を 2D distance（二次元距離）で比較し、frameScore / totalScore / worstFrame / worstPoint / bucketScores を表示する。
- rotationCenter.y/z 探索、12pt z 探索、14未知数最適化、mesh / render / MediaPipe re-detection は後段で扱う。

## Adopted Search: Fitting Lab 12pt Rotation Center

現行実装では、旧 Stage A（rotationCenter.y/z coarse search: 回転中心y/z粗探索）と Stage B（group z search: グループ単位奥行き探索）を主導線にせず、IdealFace Fitting Lab の `12pt_rotation_center`（回転中心推定向け12点）方式を採用する。

Fitting Lab で確認した 12pt 段階の候補生成は以下である。

```text
baseCandidate = naturalNoseWithRotationCenter
searchMode = coordinateDescent
iterationCount = 2

for iteration in 1..2
  for parameter in parameterOrder
    create candidates by replacing only that parameter
    evaluate all candidates
    keep the best candidate as the next current candidate
```

`parameterOrder`（探索順）は以下とする。

```text
rotationCenter.y
rotationCenter.z
leftCheek.z
rightCheek.z
nose.z
mouth.z
leftEye.z
rightEye.z
headTop.z
chin.z
noseBridge.z
leftJaw.z
rightJaw.z
upperFaceCenter.z
```

`coordinateDescentRanges`（座標降下探索範囲）は Fitting Lab の `DEFAULT_COORDINATE_DESCENT_RANGES` のうち、`12pt_rotation_center` に含まれる parameter（探索対象）だけを使う。

Render Consistency Lab への移植では、Fitting Lab の x/y 座標系は使わない。12点の x/y は `adjusted12pt`（手動調整後12点）から作り、評価時は `x = adjusted12pt.x * videoAspectRatio`、`y = adjusted12pt.y` とする。pixel coordinate（ピクセル座標）、face bounds center（顔外枠中心）、顔幅 normalization（正規化）は使わない。`rotationCenter.x`（回転中心x）は `0.5 * videoAspectRatio` 固定とする。

この探索は 478点へ拡張する前の 12点段階だけを扱う。`perLandmarkZSearch`（ランドマーク単位z探索）、478点 z 推定、mesh（メッシュ化） / render（レンダリング） / MediaPipe re-detection（MediaPipe再検出）、production export（本番書き出し）は対象外とする。
