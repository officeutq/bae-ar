# MP4 expression 3D analysis plan

## 目的

このドキュメントは、`expressionFollow v1` の次段として、IdealFace Authoring Tool が MP4 を解析し、表情別 frame group から neutral 3D 478 / expression 3D 478 を生成し、3D 差分から `landmarkFollowStrengths` を自動生成する方針を整理します。

2026-05 時点では、最初の prototype として IdealFace Authoring Tool に Expression frame grouping summary、frame usage card UI、Frame Review Carousel を追加済みです。detailed scan frames の blendshape score から expression dropdown の自動初期値を作り、一覧カードと Frame Review Carousel で1フレームを大きく確認しながら `frontReference` / `useForInference` / `expressionGroup` / `excluded` を設定できます。

`frontReference` / `useForInference` / `expressionGroup` は用途タグであり、重複可能です。`excluded` だけは排他的で、除外済み frame は正面基準 / 推定 / 表情解析の処理対象から外れます。neutral 自動分類は主導線から外し、neutralFrames は将来 `frontReferenceFrames` の中から表情が少ないものを選ぶ方針です。

MP4 detailed scan / Step 2-I-A frame selection では、単純な均等抽出ではなく、`frontReferenceCandidate` の提示と用途別 bucket の充足状況を見ながら frame を採用する `usage-aware frame sampling v1` を導入する方針です。v1 prototype では adaptive sampling を ON にすると、required bucket の `idealFaceInference` が target 80 に達した時点で early stop できます。expression groups は optional bucket として不足 warning を表示します。`frontReferenceCandidate` は自動候補、`frontReference` はユーザーが手動選択する正面基準で、early stop 条件には含めません。詳細は [usage-aware frame sampling v1](usage-aware-frame-sampling-v1.md) に整理します。

neutral 3D 478 / expression 3D 478 の生成、3D 比較、`landmarkFollowStrengths` 自動生成、`expressionFollow` export、Engine 実装、Studio 実装、validator 変更はまだ行いません。

## 背景

`expressionFollow v1` は、表情時に各 landmark が neutral な projected ideal へどれだけ追従するかを定義します。

```text
idealFollowStrength:
  0.0 = current / camera を優先する
  1.0 = projected ideal へ追従する

landmarkFollowStrengths:
  表情 rule が最大に効いたときの target idealFollowStrength
  実行時は blendshape score から ruleAmount を計算し、1.0 から target へ補間する
```

`landmarkFollowStrengths` は手作業だけでなく、MP4 の表情別 frame group から自動生成する方針です。比較は 2D projected / image-normalized ではなく、同じ `comparisonSpace` に正規化した 3D 478 landmarks 同士で行います。

## frame usage / expression 用語

frame usage の詳細な用語表は [usage-aware frame sampling v1](usage-aware-frame-sampling-v1.md) を正とします。このドキュメントでは、MP4 expression 3D analysis との関係だけを補足します。

- `useForInference` は frame usage state / UI の boolean で、IdealFace 本体の 3D 478 形状生成に使うかを表します。
- `idealFaceInference` は usage-aware sampling の bucket id で、採用された frame は `useForInference=true` の初期値になります。
- `observationFrame` は `useForInference=true` かつ `excluded=false` の frame で、Step 2-I-B/C の IdealFace 形状生成入力です。
- `expressionGroup` は expressionFollow 用の表情解析 group で、`useForInference` とは独立した用途タグです。
- `autoExpressionGroup` は blendshape score から自動判定された `expressionGroup` の初期値です。ユーザーは dropdown で変更できます。
- `excluded=true` の frame は正面基準 / 推定 / 表情解析の処理対象から外れます。`excludedReason` は `noFace` / `invalidLandmarks` / `manual` などです。
- `warningReason` は除外ではない注意タグです。`poseOutOfRange` / `mixedExpression` / `pending` / `missingBlendshapes` があっても、landmarks / pose が有効なら `useForInference` や `expressionGroup` に使える場合があります。
- `expressionFollow` は今後の中心仕様で、表情時に各 landmark が neutral な projected ideal へどれだけ追従するかを定義します。Engine implementation / export は未実装です。
- `expressionAttenuation` は既存 Engine foundation で、blendshape score に応じて affectedLandmarkGroups の strengthScale を下げる safety attenuation です。今後は fallback / 既存互換として残します。
- `landmarkFollowStrengths` は expressionFollow rule 内の target idealFollowStrength で、将来 neutral 3D 478 / expression 3D 478 比較から自動生成する方針です。現時点では未実装です。

## 現在実装済み / 未実装

実装済み:

- IdealFace Authoring Tool Step 2-I-A/B/C
- detailed scan
- pose-aware inference dataset
- `pose_aware_mediapipe_mesh_pca_residual_yaw_v1` candidate generation
- `idealLandmarks3D` 478点 candidate generation
- Step 2-H currentCandidate 3D point cloud preview
- landmarkGroups v1 docs specification
- Engine landmarkGroups v1 foundation
- IdealFace Authoring Tool Landmark Group Editor v1 prototype
- Landmark Group Editor rectangle selection / index highlight / bulk add / bulk remove
- `ideal_face_asset_v1` optional `landmarkGroups` export
- expressionFollow v1 docs direction
- Expression frame grouping summary prototype
- Frame usage card UI prototype
- usage-aware adaptive scan / early stop prototype

未実装:

- expressionFollow v1 Engine implementation
- MP4 expression 3D analysis 3D generation / comparison / export implementation
- landmarkFollowStrengths auto generation implementation
- expressionFollow Authoring UI
- correctionProfile / expressionFollow export
- beauty_filter_asset_v1 foundation
- Production Shape Warp
- Runtime renderer integration
- Color Processing
- Layer System

## 全体フロー

```text
1. MP4 を detailed scan する
2. 各 frame の landmarks / pose / blendshape score / confidence を取得する
3. frame ごとに frontReference / useForInference / expressionGroup / excluded を設定する
4. blendshape score から expressionGroup dropdown の自動初期値を作る
5. neutral 3D 478 を生成する
6. expression group ごとに expression 3D 478 を生成する
7. neutral 3D 478 と expression 3D 478 を同じ comparisonSpace で比較する
8. affectedLandmarkGroups 内で一定以上 distance3D がある landmark を抽出する
9. distance3D から idealFollowStrength を計算する
10. expressionFollow.rules[].landmarkFollowStrengths を生成する
11. Authoring Tool で確認・微調整できるようにする
12. ideal_face_asset_v1 の optional correctionProfile.expressionFollow、または将来 beauty_filter_asset_v1 に export する
```

## frame usage tags

Step 2-I-A では、frame を単一カテゴリへ分類せず、用途タグとして扱います。

```text
frontReference:
  ユーザーが手動選択した正面基準 frame
  正面姿勢・座標正規化・default face の土台に使う

frontReferenceCandidate:
  自動で「正面基準に良さそう」と判定された候補 frame

useForInference:
  pose-aware 3D 推定の observation frame として使う
  frameUsage state / UI の boolean であり、sampling bucket 名ではない

idealFaceInference:
  usage-aware sampling の bucket id
  採用された frame は useForInference=true の初期値になる

observationFrame:
  useForInference=true かつ excluded=false の frame
  Step 2-I-B/C の IdealFace 形状生成入力

expressionGroup:
  expressionFollow 用の表情解析に使う group
  useForInference とは独立した用途タグ

autoExpressionGroup:
  blendshape score から自動判定された expressionGroup の初期値

excluded:
  今回の処理には使わない frame

excludedReason:
  excluded=true になった理由

warningReason:
  除外ではないが注意が必要な理由
```

`frontReference` / `useForInference` / `expressionGroup` は重複可能です。`excluded` だけは排他的で、`excluded = true` の frame は他用途の処理対象に含めません。

自動で `excluded = true` にする理由は、`noFace` / `invalidLandmarks` / `manual` を基本とします。`poseOutOfRange` は自動除外ではなく注意タグとして扱います。正面基準には不向きですが、pose-aware 3D 推定の奥行き観測には使える可能性があるため、`useForInference` の対象に残せます。

Expression grouping は、`mouthPucker` / `jawOpen` / `mouthSmile` / `eyeBlink` / `eyeSquint` / `mixedExpression` などの自動判定を行い、`expressionGroup` dropdown の初期値として使います。`mixedExpression` / `pending` / `missingBlendshapes` は expressionFollow の単一表情 rule 生成には不向きですが、landmarks / pose が有効な frame は pose-aware 3D 推定に使える可能性があるため、自動除外にはしません。

`usage-aware frame sampling v1` では、`frontReference` を自動採用 bucket とは扱いません。`frontReferenceCandidate` を自動候補として提示し、ユーザーが Frame Review Carousel / frame card で `frontReference` を手動選択します。`idealFaceInference` / expression groups は targetCount を持つ bucket として扱い、ある bucket が targetCount に達した場合、その用途では以後採用しませんが、同じ frame が他の不足用途に使える場合は採用できます。

## neutral frame group

neutral frame group は、表情なし / 基準顔として扱う frame 群です。現在の主導線では neutral 自動分類は行わず、将来 `frontReferenceFrames` の中から表情が少ないものを neutralFrames 候補として選びます。

条件候補:

```text
mouthPucker が低い
jawOpen が低い
mouthSmileLeft / mouthSmileRight が低い
mouthFrownLeft / mouthFrownRight が低い
mouthStretchLeft / mouthStretchRight が低い
eyeBlinkLeft / eyeBlinkRight が低い
eyeSquintLeft / eyeSquintRight が低い
eyeWideLeft / eyeWideRight が極端でない
pose が極端でない
confidence が低すぎない
```

初期 threshold 候補:

```text
mouthPucker < 0.2
jawOpen < 0.15
mouthSmileLeft / Right < 0.25
eyeBlinkLeft / Right < 0.2
eyeSquintLeft / Right < 0.25
```

これらは v1 の出発点であり、動画ごとの表情の出方、Face Landmarker の score 分布、confidence、pose coverage を見ながら調整します。

## expression frame group

v1 では、単一 expression が比較的明確な frame を優先して使います。複数 expression が同時に強い frame は、mixed expression として扱います。mixed expression は単一表情 rule 生成には使いにくいため注意タグを出しますが、自動除外はしません。

優先対象:

```text
mouthPucker
jawOpen
mouthSmile
eyeBlinkLeft
eyeBlinkRight
eyeSquintLeft
eyeSquintRight
```

各 group の候補条件:

```text
mouthPucker:
  mouthPucker が高い
  jawOpen は低〜中程度
  smile 系が高すぎない

jawOpen:
  jawOpen が高い

mouthSmile:
  mouthSmileLeft / mouthSmileRight が高い

eyeBlinkLeft:
  eyeBlinkLeft が高い

eyeBlinkRight:
  eyeBlinkRight が高い

eyeSquintLeft:
  eyeSquintLeft が高い

eyeSquintRight:
  eyeSquintRight が高い
```

mixed expression の例:

```text
mouthPucker と mouthSmile が同時に高い
jawOpen と mouthPucker が同時に高い
blink と squint が同時に高い
```

mixed expression が多い動画では warning を出し、v1 の自動生成では単一 expression として扱わない方針です。

## expression 3D 478 生成

既存の `pose_aware_mediapipe_mesh_pca_residual_yaw_v1` candidate generation と同じく、MediaPipe landmark.z、FacePose inverse rotation、direction-balanced aggregation を使い、各 expression frame group から expression 3D 478 を生成する候補とします。expression 側で PCA residual yaw correction / semantic origin centering を使うかは別途 debug 比較して決めます。

```text
neutral frame group:
  neutral 3D 478 を生成する

mouthPucker frame group:
  mouthPucker expression 3D 478 を生成する

jawOpen frame group:
  jawOpen expression 3D 478 を生成する

eyeBlinkLeft frame group:
  eyeBlinkLeft expression 3D 478 を生成する
```

最初の実装では、full candidate generation を再利用できるか、より軽量な group average でよいかを検討します。どちらの場合も、比較対象は必ず同じ coordinate space に正規化します。

```text
comparisonSpace:
  bae_ar_ideal_landmarks3d_v1
```

## 3D 比較方針

2D image-normalized / projected landmarks では比較しません。

```text
NG:
  projected 2D landmarks で比較する
  image-normalized current landmarks で比較する
  camera frame 上の位置 / スケール / 姿勢差を混ぜる

OK:
  same-unit coordinate に正規化した neutral 3D 478 と expression 3D 478 を比較する
```

比較式:

```ts
dx = expression3D.x - neutral3D.x
dy = expression3D.y - neutral3D.y
dz = expression3D.z - neutral3D.z

distance3D = Math.sqrt(dx * dx + dy * dy + dz * dz)
```

`distance3D` が大きい landmark は、その表情では neutral ideal から自然に大きく外れる landmark とみなします。

## affectedLandmarkGroups

`affectedLandmarkGroups` は対象範囲です。`landmarkFollowStrengths` は、その対象範囲内で表情により自然にズレる landmark ごとの追従率です。

blendshape 名から初期候補を決めます。

```text
mouthPucker:
  affectedLandmarkGroups: ["mouth"]

jawOpen:
  affectedLandmarkGroups: ["mouth"]

mouthSmile:
  affectedLandmarkGroups: ["mouth"]

eyeBlinkLeft:
  affectedLandmarkGroups: ["left_eye"]

eyeBlinkRight:
  affectedLandmarkGroups: ["right_eye"]

eyeSquintLeft:
  affectedLandmarkGroups: ["left_eye"]

eyeSquintRight:
  affectedLandmarkGroups: ["right_eye"]
```

## distance3D から idealFollowStrength への変換

初期式:

```ts
t = clamp(
  (distance3D - minExpressionDelta3D) /
    (maxExpressionDelta3D - minExpressionDelta3D),
  0,
  1
)

idealFollowStrength = lerp(1.0, minIdealFollowStrength, t)
```

初期値候補:

```text
minExpressionDelta3D = 0.005
maxExpressionDelta3D = 0.04
minIdealFollowStrength = 0.15
```

意味:

```text
distance3D が小さい:
  idealFollowStrength = 1.0 に近い
  neutral ideal に追従してよい

distance3D が大きい:
  idealFollowStrength = 0.15 に近い
  表情として自然にズレるため、ideal に戻しすぎない
```

## landmarkFollowStrengths 抽出方針

`landmarkFollowStrengths` は、基本的に `affectedLandmarkGroups` 内の landmarks から生成します。

```text
mouthPucker:
  mouth group 内だけを見る

eyeBlinkLeft:
  left_eye group 内だけを見る
```

理由:

```text
表情と関係ない点が偶然動いた場合に、余計な landmarkFollowStrengths が作られにくくするため
```

将来は expression group ごとに追加 group を持てる可能性があります。例えば `jawOpen` では、`mouth` だけでなく chin / lower face 系の group が必要になる可能性があります。ただし v1 では `mouth` を中心に始めます。

## source metadata

生成された rule には、後から生成条件を確認できるように source metadata を持たせる方針です。

```json
{
  "source": {
    "type": "authoring_mp4_expression_3d_analysis",
    "neutralFrameGroup": "neutral",
    "expressionFrameGroup": "mouthPucker",
    "comparisonSpace": "bae_ar_ideal_landmarks3d_v1",
    "frameCount": 12,
    "minExpressionDelta3D": 0.005,
    "maxExpressionDelta3D": 0.04,
    "minIdealFollowStrength": 0.15
  }
}
```

## JSON preview / export 方針

初期実装時は、Authoring Tool の JSON preview に analysis summary を追加する方針です。

```text
expressionAnalysis:
  neutral frame count
  expression groups
  generated rules
  affectedLandmarkGroups
  landmarkFollowStrength count
  min / max / average distance3D
  min / max / average idealFollowStrength
```

export は段階を分けます。

```text
Step 1:
  analysis summary / JSON preview のみ

Step 2:
  manual review / tuning UI

Step 3:
  optional export to ideal_face_asset_v1.correctionProfile.expressionFollow

Step 4:
  beauty_filter_asset_v1 foundation 後に filter asset として export
```

## 失敗時 / 不足時の扱い

```text
neutral frame group が不足:
  expression analysis は not_available
  fallback として expressionFollow rules は生成しない

expression frame group が不足:
  その expression rule は生成しない

confidence が低い:
  frame を除外する、または weight を下げる

mixed expression が多い:
  warning を出し、自動除外はしない

pose coverage が不足:
  warning を出す
```

## 責務分離

### Authoring Tool

```text
Authoring Tool:
  MP4 detailed scan
  frame grouping
  neutral 3D 478 generation
  expression 3D 478 generation
  neutral vs expression 3D comparison
  landmarkFollowStrengths generation
  JSON preview / future export
```

### Engine

```text
Engine:
  finished asset の expressionFollow を読む
  実行時の blendshape score から ruleAmount を計算する
  effectiveIdealFollowStrength を計算する
  CorrectionPlan finalStrength に反映する
```

### Studio

```text
Studio:
  Engine API 経由で expressionFollow / CorrectionPlan debug を確認する
  Authoring generation logic は持たない
```

## 今回やらないこと

- TypeScript 実装
- Engine 実装
- Studio 実装
- Authoring Tool UI 実装
- JSON export 変更
- validator 変更
- expressionFollow v1 実装
- MP4 expression 3D analysis 実装
- landmarkFollowStrengths 自動生成実装
- Production Shape Warp
- Runtime renderer integration
- Color Processing
- Layer System
