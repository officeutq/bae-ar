# Ideal OBJ Render Warp Lab Placement Function Analysis History

Ideal OBJ Render Warp Lab 配置関数解析の検証履歴

このドキュメントは、`tools/ideal-obj-render-warp-lab` で進めてきた Placement Function Analysis（配置関数解析）の検証履歴、判断理由、現時点の結論を後から読み返すためのメモです。実装仕様を固定するものではなく、今後の実装判断に使えるように候補名、式、評価指標、暫定判断を整理します。

現在の扱い: `direct_piecewise_ty3_linear_normalized_v1` は live runtime では deprecated / failed experiment として廃止済みです。正面 pose の matrix-based placement function としては過去検証に残しますが、yaw / pitch / roll を含む live alignment の主導線にはしません。live runtime は matrix-based placement を使わず、`semantic_5pt_center_scale_v1` で center / scale の配置補正だけを行います。

## 1. この検証で解こうとしている問題

Placement Function Analysis（配置関数解析）の目的は、理想 OBJ（理想 3D 顔形状ファイル）を MediaPipe（顔検出ライブラリ）に通して得た `facialTransformationMatrix`（顔変換行列）から、理想 OBJ 顔をカメラ画像上に置くための transform（変換）を推定することです。

推定したい値は以下です。

```text
scaleRatio
translateAfterScaleImageX
translateAfterScaleImageY
```

最終的に欲しいものは以下です。

```text
current478_image
  = カメラ画像上の現在顔478点

idealTarget478_image
  = カメラ画像上に配置済みの理想顔478点
```

`idealTarget478_image`（配置済み理想顔 478 点）を作るために、理想 OBJ を MediaPipe（顔検出ライブラリ）に通して得た `baseRenderedIdeal478`（基準レンダー理想顔 478 点）に対して以下を適用します。

```text
idealTarget478_image[i].x =
  baseRenderedIdeal478[i].x * scaleRatio + translateAfterScaleImageX

idealTarget478_image[i].y =
  baseRenderedIdeal478[i].y * scaleRatio + translateAfterScaleImageY
```

重要なのは、この検証が `anchorLandmark[0]`（基準ランドマーク 0）を合わせる検証ではないことです。目的は anchor（基準点）合わせではなく、MediaPipe（顔検出ライブラリ）が返す matrix（顔変換行列）を再現するための placement function（配置関数）を作ることです。

## 2. forward（順方向） / inverse（逆方向）の考え方

検証の流れは、先に既知の配置を決め、その結果として MediaPipe（顔検出ライブラリ）が返す matrixFeatures（行列特徴量）を観測し、逆向きに knownTransform（既知変換）を推定する関数を作る、というものです。

```text
knownTransform を先に決める
  scaleRatio
  translateAfterScaleImageX
  translateAfterScaleImageY

↓ 理想OBJをその配置でレンダー

MediaPipe に通す

↓ matrixFeatures が返る

matrixFeatures -> knownTransform を推定する関数を作る
```

言い換えると、以下の forward（順方向）と inverse（逆方向）の対応を作る検証です。

```text
forward:
  knownTransform -> matrixFeatures

inverse:
  matrixFeatures -> knownTransform
```

ここで作りたいのは inverse（逆方向）の placement function（配置関数）です。

## 3. sample（サンプル）と condition（条件）

初期 sweep（総当たり探索）の sample（サンプル）設計は、正面 pose（姿勢）に限定して、中心位置と scaleRatio（スケール比）を変えるものでした。

```text
centerImageX:
  0.42, 0.46, 0.50, 0.54, 0.58

centerImageY:
  0.40, 0.42, 0.44, 0.46, 0.48,
  0.50, 0.52, 0.54, 0.56, 0.58, 0.60

scaleRatio:
  1.10, 1.15, 1.20, 1.25, 1.30

pose:
  front

repeatCount:
  2
```

raw sample（生サンプル）の計算上の件数は以下です。

```text
5 x 11 x 5 x 2 = 550 raw samples
```

実際には `no_face`（顔未検出）が 2 件あり、usable sample（利用可能サンプル）は 548 件でした。ただし、repeat（繰り返し）を重複評価しないため、fitting（関数学習）や batch roundtrip comparison（条件単位まとめ再レンダー比較）では `conditionKey`（条件キー）単位にまとめます。

```text
usableSampleCount:
  548

condition_mean:
  274 fitting conditions
```

`condition_mean`（条件平均）を使うことで、同一条件を `repeatCount=2` で実行したことによる重みの偏りを避け、条件ごとに 1 つの代表値として評価できます。

## 4. center-derived candidate（中心導出候補）

最初に試したのは center-derived candidate（中心導出候補）です。これは、matrixFeatures（行列特徴量）から targetCenter（目標中心）と scaleRatio（スケール比）を推定し、その結果から translateAfterScaleImageX/Y（スケール後平行移動量）を導出する方式です。

```text
matrixFeatures
  -> targetCenterImageX
  -> targetCenterImageY
  -> scaleRatio
  -> translateAfterScaleImageX/Y を導出
```

式は以下です。

```text
estimatedTargetCenterImageX =
  a0 + a1 * txOverNegTz

estimatedTargetCenterImageY =
  b0 + b1 * tyOverNegTz

estimatedScaleRatio =
  c0 + c1 * invNegTz

estimatedTranslateAfterScaleImageX =
  estimatedTargetCenterImageX
  - basePlacement.centerImageX * estimatedScaleRatio

estimatedTranslateAfterScaleImageY =
  estimatedTargetCenterImageY
  - basePlacement.centerImageY * estimatedScaleRatio
```

候補名は以下です。

```text
center_derived_linear_v1
```

この方式は構造が分かりやすく、targetCenter（目標中心）という中間値も解釈しやすいため、比較基準として残しています。

## 5. direct candidate（直接推定候補）

次に direct candidate（直接推定候補）を追加しました。direct candidate（直接推定候補）は、targetCenter（目標中心）を経由せずに、matrixFeatures（行列特徴量）から直接 knownTransform（既知変換）を出す方式です。

```text
matrixFeatures
  -> scaleRatio
  -> translateAfterScaleImageX
  -> translateAfterScaleImageY
```

最初に比較した direct candidates（直接推定候補）は以下です。

```text
direct_linear_normalized_v1
direct_linear_raw_matrix_v1
direct_linear_split_v1
direct_quadratic_normalized_v1
```

この段階では、transform error（既知変換との差分）上は `direct_linear_normalized_v1` が有力でした。normalized（正規化）特徴量である `txOverNegTz` / `tyOverNegTz` / `invNegTz` を使う一次モデルが、knownTransform（既知変換）の数値に対して比較的安定していました。

ただし、transform error（既知変換との差分）だけでは不十分です。理由は以下です。

```text
knownTransform の数値誤差が小さい候補が、
再レンダー後に MediaPipe の matrix を一番再現するとは限らない。
```

この時点で、評価軸を「既知変換にどれだけ近いか」から、「再レンダー後に元の matrixFeatures（行列特徴量）をどれだけ再現できるか」へ広げる必要が出ました。

## 6. roundtrip validation（再レンダー検証）

roundtrip validation（再レンダー検証）の目的は、candidate（候補）が出した placement（配置）で本当に同じ matrix（顔変換行列）が返ってくるかを確認することです。

```text
original sample matrixFeatures
  -> candidate.evaluate(matrixFeatures)
  -> estimatedTransform
  -> estimatedTransform で理想OBJを再レンダー
  -> MediaPipe detect(renderCanvas)
  -> predictedMatrixFeatures
  -> original matrixFeatures と比較
```

確認したい問いは以下です。

```text
candidate が出した配置で本当に同じ matrix が返ってくるか？
```

比較指標は以下です。

```text
matrix error:
  tx / ty / tz

normalized matrix error:
  txOverNegTz / tyOverNegTz / invNegTz

pose error:
  yaw / pitch / roll

landmark diff:
  returned 478 の 2D distance
```

roundtrip validation（再レンダー検証）では、以下の score（スコア）を使いました。

```text
matrixNormalizedScore =
  absTxOverNegTzError
  + absTyOverNegTzError
  + absInvNegTzError * 100

matrixRawTranslationScore =
  absTxError
  + absTyError
  + absTzError

poseScore =
  poseDiffMagnitude

landmarkScore =
  mean2dDistance

roundtripScore =
  matrixNormalizedScore
  + poseScore * 0.01
  + landmarkScore
```

この score（スコア）は、matrixFeatures（行列特徴量）の再現性を主に見つつ、pose（姿勢）と landmark（ランドマーク）の差分も補助的に足すためのものです。

## 7. selected sample comparison（選択サンプル比較）から batch comparison（まとめ比較）へ

最初は selected sample comparison（選択サンプル比較）として、選択中 sample（サンプル）1 件だけで候補比較を行いました。しかし、1 件だけでは条件依存の崩れや端条件の弱さを判断できません。

そのため、conditionKey（条件キー）単位の batch roundtrip comparison（条件単位まとめ再レンダー比較）へ進みました。batch（まとめ処理）では以下を行います。

```text
274 conditions x candidate count
```

core candidate set（基本候補セット）では、以下の render / detect（レンダーと検出）を実行します。

```text
274 conditions x 5 candidates = 1370 render / detect
```

この比較では raw sample（生サンプル）548 件をそのまま使わず、condition_mean（条件平均）274 件を使います。repeat（繰り返し）を重複評価しないためです。

## 8. core batch comparison（基本候補まとめ比較）の結果

core candidate set（基本候補セット、既存 5 候補）の batch roundtrip comparison（条件単位まとめ再レンダー比較）では、全体として `direct_linear_normalized_v1` が有力でした。

この段階の判断は以下です。

```text
mean は良い
p95 / max / worst conditions はまだ確認が必要
```

mean（平均）が良い候補であっても、p95（95 パーセンタイル）、max（最大値）、worst conditions（最悪条件）が悪い場合、実際の配置関数としては端条件で崩れる可能性があります。そのため、`direct_linear_normalized_v1` は現時点の強い候補でありつつ、まだ本番確定ではないという扱いにしました。

## 9. Quadratic Candidate Expansion（二次式候補拡張）

1 本の linear（一次）関数だけでは特定条件で崩れる可能性があるため、Quadratic Candidate Expansion（二次式候補拡張）を行いました。

既存の `direct_quadratic_normalized_v1` だけでは、quadratic candidate（二次式候補）全般を検討したとは言えません。そのため、以下のような候補を追加しました。

```text
direct_quadratic_normalized_no_inv2_v1
direct_quadratic_normalized_interaction_only_v1
direct_quadratic_normalized_squares_only_v1
direct_quadratic_standardized_full_v1
direct_quadratic_standardized_no_inv2_v1
direct_quadratic_ridge_standardized_full_v1
center_derived_quadratic_standardized_v1
center_derived_quadratic_ridge_standardized_v1
```

この検証の狙いは以下です。

```text
- invNegTz^2 が係数暴れを起こしていないか
- 交差項だけで改善するか
- 標準化で安定するか
- ridge 正則化で p95 / max が改善するか
- center-derived 構造を二次式にすると復活するか
```

結果の整理は以下です。

```text
direct_quadratic_normalized_no_inv2_v1:
  mean roundtripScore では有力

direct_quadratic_ridge_standardized_full_v1:
  max roundtripScore では安全寄り

ただし二次式全体として、p95 / max を決定的に改善しきったとは言えなかった。
```

このため、quadratic candidate（二次式候補）は比較候補として残しつつ、次は piecewise linear（分割一次関数）へ進む判断になりました。

## 10. Piecewise Linear Candidate Expansion（分割一次候補拡張）

quadratic candidate（二次式候補）でも端条件の崩れを解消しきれなかったため、Piecewise Linear Candidate Expansion（分割一次候補拡張）を試しました。

重要な制約は以下です。

```text
known scaleRatio は runtime gate に使わない
knownPlacement.centerImageX/Y は runtime gate に使わない
conditionKey は runtime gate に使わない
```

runtime gate（実行時の分割条件）に使うのは、MediaPipe（顔検出ライブラリ）matrix（顔変換行列）由来の特徴量のみです。

```text
invNegTz
tyOverNegTz
```

追加候補は以下です。

```text
direct_piecewise_inv3_linear_normalized_v1
direct_piecewise_inv5_linear_normalized_v1
direct_piecewise_ty3_linear_normalized_v1
direct_piecewise_inv3_ty3_linear_normalized_v1
center_derived_piecewise_inv3_linear_normalized_v1
center_derived_piecewise_inv3_ty3_linear_normalized_v1
```

piecewise linear（分割一次関数）は、全条件を 1 本の関数で吸収しようとせず、gate feature（分割条件に使う特徴量）で segment（分割区間）を切り替え、各 segment（分割区間）ごとに一次関数を fitting（学習）します。

## 11. direct_piecewise_ty3_linear_normalized_v1 の意味

現時点の最有力候補である `direct_piecewise_ty3_linear_normalized_v1` の日本語名は以下です。

```text
上下方向3分割・直接推定・一次関数モデル
```

これは、MediaPipe（顔検出ライブラリ）matrix（顔変換行列）の上下方向成分で 3 分類して、分類ごとに別々の一次関数で、理想 OBJ 顔の置き場所と大きさを直接出す方式です。

分解すると以下です。

```text
direct:
  targetCenter を経由せず、
  scaleRatio / translateAfterScaleImageX/Y を直接出す

piecewise:
  全範囲を1本の関数で扱わず、
  条件によって使う関数を切り替える

ty3:
  tyOverNegTz を3分割する

linear:
  各区間では一次関数を使う

normalized:
  txOverNegTz / tyOverNegTz / invNegTz を使う
```

この候補は、vertical position（上下位置）に関係する `tyOverNegTz` を gate feature（分割条件に使う特徴量）として使う点が特徴です。

## 12. all_expanded comparison（全拡張候補比較）の結果

`all_expanded` candidate set（全拡張候補セット）では、以下をまとめて比較しました。

```text
core
quadratic expanded
piecewise linear candidates
```

このとき、以下を実行しました。

```text
274 conditions x 19 candidates = 5206 render / detect
```

現時点の結果は以下です。

```text
bestByRoundtripScoreCandidateId:
  direct_piecewise_ty3_linear_normalized_v1

bestByMatrixNormalizedScoreCandidateId:
  direct_piecewise_ty3_linear_normalized_v1
```

主な比較は以下です。

```text
direct_linear_normalized_v1:
  mean roundtripScore: 0.027978
  p95 roundtripScore: 0.059649
  max roundtripScore: 0.123290

direct_piecewise_ty3_linear_normalized_v1:
  mean roundtripScore: 0.026317
  p95 roundtripScore: 0.051235
  max roundtripScore: 0.125043
```

判断は以下です。

```text
mean:
  direct_piecewise_ty3 が改善

p95:
  direct_piecewise_ty3 が大きく改善

max:
  direct_piecewise_ty3 は direct_linear より少し悪化
```

max（最大値）だけを見る場合は、以下も比較候補として残します。

```text
direct_piecewise_inv3_linear_normalized_v1:
  max roundtripScore: 0.111254
```

そのため、`direct_piecewise_ty3_linear_normalized_v1` は mean（平均）と p95（95 パーセンタイル）で現時点の本命ですが、max（最大値）まで完全に最良ではない、という位置づけです。

## 13. 現時点の結論

当時の Placement Function Analysis 内での recommended placement function（推奨配置関数）は以下です。

```text
recommended placement function:
  direct_piecewise_ty3_linear_normalized_v1
```

日本語では以下です。

```text
現時点の推奨配置関数:
  上下方向3分割・直接推定・一次関数モデル
```

採用の意味は以下です。

```text
- Placement Function Analysis の recommended candidate にする
- roundtrip validation の初期選択 candidate にする
- 次の alignment 実験で最初に使う candidate にする（現在は live runtime から廃止済み）
- ただし他候補は削除しない
- max / worst conditions の監視は続ける
```

比較候補として残すものは以下です。

```text
direct_piecewise_inv3_linear_normalized_v1
direct_quadratic_normalized_no_inv2_v1
direct_quadratic_ridge_standardized_full_v1
direct_linear_normalized_v1
center_derived_linear_v1
```

これは本番確定ではなく、Placement Function Analysis（配置関数解析）内での recommended candidate（推奨候補）としての暫定採用でした。live runtime では姿勢変化時の scale / translate がズレるため、現在は deprecated / failed experiment として扱います。

## 14. まだ残っている注意点

`direct_piecewise_ty3_linear_normalized_v1` は正面 pose の analysis では mean（平均）と p95（95 パーセンタイル）で強い一方、max roundtripScore（最大再レンダースコア）は最良ではありませんでした。さらに live runtime の yaw / pitch / roll を含む姿勢では scale / translate が大きくズレたため、live alignment には使いません。

`tyOverNegTz` の一部 segment（分割区間）では、まだ worst condition（最悪条件）が残ります。そのため、本番確定ではなく、現時点の recommended / default candidate（推奨・既定候補）として扱います。

今後も以下を監視します。

```text
- max roundtripScore
- worst conditions
- segment breakdown
- tyOverNegTz_s1 など特定 segment の偏り
```

## 15. 次にやること

次のステップは以下です。

```text
1. direct_piecewise_ty3_linear_normalized_v1 は過去検証 candidate として UI / export に残す

2. selected sample roundtrip validation の default candidate を recommended candidate に寄せる

3. live alignment は matrix-based placement を廃止し、
   semantic landmark based placement へ移行する

4. worst conditions の segment を確認し、
   必要なら tyOverNegTz_s1 など特定 segment の改善を行う

5. Production Shape Warp にはまだ接続しない
```

特に 5 は重要です。Placement Function Analysis（配置関数解析）は debug / research lab（検証ラボ）内の候補選定であり、Production Shape Warp（本番向け形状ワープ）への接続はまだ行いません。

## 16. 用語集

Placement Function Analysis（配置関数解析）:
MediaPipe（顔検出ライブラリ）の matrix（顔変換行列）から、理想 OBJ 顔を画像上へ置くための scaleRatio（スケール比）と translateAfterScaleImageX/Y（スケール後平行移動量）を推定する検証。

knownTransform（既知変換）:
検証時に先に決めておく正解の変換。`scaleRatio`、`translateAfterScaleImageX`、`translateAfterScaleImageY` を含む。

matrixFeatures（行列特徴量）:
`facialTransformationMatrix`（顔変換行列）から取り出した評価・学習用特徴量。主に `txOverNegTz`、`tyOverNegTz`、`invNegTz` など。

center-derived candidate（中心導出候補）:
targetCenter（目標中心）と scaleRatio（スケール比）を先に推定し、そこから translateAfterScaleImageX/Y（スケール後平行移動量）を導出する候補。

direct candidate（直接推定候補）:
targetCenter（目標中心）を経由せず、matrixFeatures（行列特徴量）から `scaleRatio` と `translateAfterScaleImageX/Y` を直接推定する候補。

roundtrip validation（再レンダー検証）:
candidate（候補）が推定した transform（変換）で理想 OBJ 顔を再レンダーし、MediaPipe（顔検出ライブラリ）に再入力して、元の matrixFeatures（行列特徴量）を再現できるか確認する検証。

conditionKey（条件キー）:
同一 `centerImageX` / `centerImageY` / `scaleRatio` / pose（姿勢）をまとめるためのキー。

condition_mean（条件平均）:
同一 conditionKey（条件キー）の repeat（繰り返し）を平均し、1 条件 1 件として fitting（学習）や batch comparison（まとめ比較）に使う代表値。

quadratic candidate（二次式候補）:
一次項に加えて二次項や交差項を使う候補。

ridge regularization（リッジ正則化）:
係数が大きく暴れすぎないようにする正則化手法。

piecewise linear（分割一次関数）:
全範囲を 1 本の一次関数で扱わず、条件によって segment（分割区間）を切り替え、各 segment（分割区間）で一次関数を使う方式。

gate feature（分割条件に使う特徴量）:
piecewise linear（分割一次関数）で segment（分割区間）を選ぶために使う特徴量。今回の候補では `invNegTz` や `tyOverNegTz` を使う。

segment（分割区間）:
gate feature（分割条件に使う特徴量）によって分けられた区間。各 segment（分割区間）ごとに別の一次関数を持つ。

recommended candidate（推奨候補）:
Placement Function Analysis 内で最初に使う候補。当時の結論では `direct_piecewise_ty3_linear_normalized_v1` を指していました。ただし、本番確定ではなく、現在の live runtime では deprecated / failed experiment として扱います。

## 17. 2026-06 Live Alignment Cleanup

MP4 再生中の Pose Mapping runtime から、`direct_piecewise_ty3_linear_normalized_v1` 固定の live alignment を削除しました。

削除した live runtime 経路:

- `currentMatrix -> matrixFeatures -> placement function -> scaleRatio / translateAfterScaleImageX/Y`
- `direct_piecewise_ty3_linear_normalized_v1`
- `direct_linear_normalized_v1` fallback
- `DEFAULT_LIVE_PLACEMENT_FUNCTION_CANDIDATE`
- `DEFAULT_LIVE_PLACEMENT_FUNCTION_DIRECT_FALLBACK_CANDIDATE`

現在の runtime は旧 mode に fallback しません。

- `bounds_center_scale_v1` に戻さない
- `mediapipe_placement_center_scale` に戻さない
- `direct_linear_normalized_v1` fallback に戻さない
- `state.placementAnalysis.candidate` を live runtime に接続しない

この cleanup 直後は、semantic placement 実装まで live alignment を以下で skip していました。

```text
alignmentStatus = skipped_no_live_alignment_method
alignmentSkippedReason = no_live_alignment_method
alignmentMethod = none
liveAlignmentStatus = skipped_no_live_alignment_method
alignedRenderedIdeal478 = null
meshTargetVertices = null
```

次の live alignment 方針は、`current478` と `renderedIdeal478` の同じ固定ランドマークから center / scale line を作る `semantic_5pt_center_scale_v1` でした。WebGL mesh warp の画像変形本線化は別作業とします。

## 18. 2026-06 Semantic 5pt Center Scale Live Alignment

MP4 再生中の Pose Mapping runtime に、`semantic_5pt_center_scale_v1`（意味点5点中心スケール方式 v1）を追加しました。

この方式は matrix-based placement ではありません。`currentMatrix` / `facialTransformationMatrix`、`state.placementAnalysis.candidate`、`direct_piecewise_ty3_linear_normalized_v1`、`direct_linear_normalized_v1` fallback、`bounds_center_scale_v1`、`mediapipe_placement_center_scale` は live runtime の scale / translate 推定に使いません。

役割分担:

```text
poseMappingProfile:
  yaw / pitch / roll など、顔の向きを合わせる

semantic_5pt_center_scale_v1:
  center と scale だけを合わせる
```

固定5点:

```text
topCenter = 10
chinCenter = 152
rightSideCenter = 454
leftSideCenter = 234
eyeMid = 6（角度差 debug 用。scale line には使わない）
```

`topCenter -> chinCenter` と `leftSideCenter -> rightSideCenter` の交点を semantic center とします。center の作り方は従来通りです。

scale line は `semanticCenter -> eyeMid` ではありません。また、現行の live alignment では `topCenter: 10 -> chinCenter: 152` と `leftSideCenter: 234 -> rightSideCenter: 454` の長い方選択も scale basis として使いません。current 側の face boundary / scale candidate landmarks から x が最小の landmark index と x が最大の landmark index を選び、その 2 点を `current_x_span` の scale line とします。ideal 側では x 最小 / 最大を選び直さず、current 側で選ばれた同一 landmark index の 2 点を使います。固定 `10 -> 152` / `234 -> 454` の長さと scale ratio は比較用 debug として残します。

```text
scaleBasisMode = current_x_span_same_indices
scaleBasisUsed = current_x_span

minXIndex = current scale candidate landmarks のうち x が最小の index
maxXIndex = current scale candidate landmarks のうち x が最大の index

scaleRatio = currentScaleLength / idealScaleLength
```

その後は従来通り、`renderedIdeal478` 全体へ scale then translate を適用して `alignedRenderedIdeal478` を生成します。

2D rotation は適用しません。matrix-based placement も復活させません。`center -> eyeMid` の角度差は `angleDiffDeg` として debug に出すだけです。WebGL mesh warp はまだ未接続で、`meshTargetVertices` も生成しません。

成功時:

```text
alignmentStatus = completed
alignmentSkippedReason = none
alignmentMethod = semantic_5pt_center_scale_v1
liveAlignmentStatus = completed
alignedRenderedIdeal478 = transformed landmarks
meshTargetVertices = null
```

guard 失敗時:

```text
alignmentStatus = skipped_invalid_semantic_5pt_center_scale
alignmentSkippedReason = <specific reason>
alignmentMethod = semantic_5pt_center_scale_v1
liveAlignmentStatus = skipped_invalid_semantic_5pt_center_scale
alignedRenderedIdeal478 = null
meshTargetVertices = null
```

guard 失敗時は古い `alignedRenderedIdeal478` を表示しません。WebGL mesh warp はまだ未接続で、`meshTargetVertices` も生成しません。
