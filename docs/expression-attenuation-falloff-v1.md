# expressionAttenuation falloff v1

## 目的

このドキュメントは、`expressionAttenuation` が `landmarkGroups` に適用する `strengthScale` を、group membership の二値ではなく、group 内の中心から外側への距離に応じて滑らかに効かせる `expressionAttenuation falloff v1` の方針を固定します。

今回は方針整理のみです。TypeScript 実装、Engine 実装、Studio 実装、Authoring Tool UI、JSON export 変更、validator 変更は行いません。

## 背景

現在の `expressionAttenuation` は、`affectedLandmarkGroups` が参照する group に含まれる landmark に対して、group ごとの `strengthScale` を一律に適用します。

```text
group に含まれる:
  groupScale を適用する

group に含まれない:
  scale 1.0 のまま
```

`landmarkGroups` が asset 由来で読めるようになり、Authoring Tool で `mouth` / `left_eye` / `right_eye` の範囲を広げられるようになりました。一方で、group 内外が二値のままだと、境界付近で補正強度が急に変わる可能性があります。

例:

```text
mouth group 内:
  jawOpen / mouthPucker などにより expression scale を適用する

mouth group 外:
  expression scale は 1.0 のまま

境界:
  0.6 -> 1.0 のように急に変わる
```

本来は、口や目の中心に近い部分ほど `expressionAttenuation` を強く適用し、外側や境界に近づくほど通常補正へ滑らかに戻す方が自然です。

## 採用する方針

v1 では、`mouth_core` / `mouth_outer` のように group を細かく分けません。Authoring Tool は引き続き `mouth` / `left_eye` / `right_eye` / `face_boundary` などの index group を作ります。

```json
{
  "id": "mouth",
  "indices": [13, 14, 17]
}
```

Engine は group 内の中心と外側を推定し、各 landmark の `falloffWeight` を自動計算します。

```text
Authoring Tool:
  group に属する landmark index の範囲を指定する

Engine:
  group 内の中心と外側を推定する
  中心に近い landmark ほど expressionAttenuation を強く適用する
  外側に近い landmark ほど 1.0 に近づける
```

v1 では group 内の per-index weight は JSON に保存しません。`landmarkGroups v1` の JSON は当面維持し、falloff は Engine が自動計算します。

## 計算イメージ

現在:

```ts
finalStrength = baseStrength * groupScale
```

falloff 導入後の考え方:

```ts
blendedGroupScale = lerp(1.0, groupScale, falloffWeight)
finalStrength = baseStrength * blendedGroupScale
```

意味:

```text
falloffWeight = 1.0:
  groupScale をそのまま適用する
  中心に近い点
  強く attenuation する

falloffWeight = 0.5:
  groupScale と 1.0 の中間
  中間領域
  少し attenuation する

falloffWeight = 0.0:
  1.0
  境界付近
  通常補正に戻す
```

例:

```text
groupScale = 0.4

falloffWeight 1.0:
  blendedGroupScale = 0.4

falloffWeight 0.5:
  blendedGroupScale = 0.7

falloffWeight 0.0:
  blendedGroupScale = 1.0
```

## falloffWeight の自動計算案

v1 実装では、以下の案を候補として比較します。現時点では JSON schema や Authoring Tool UI を増やさず、Engine 側の自動計算で始めます。

### 案A: group center distance based falloff

```text
1. group に含まれる landmark の中心を計算する
2. 各 landmark と中心との距離を計算する
3. group 内の最大距離を outer radius とする
4. 中心に近いほど falloffWeight 1.0
5. 外側に近いほど falloffWeight 0.0 に近づける
```

計算イメージ:

```ts
distance = length(point - groupCenter)
normalizedDistance = clamp(distance / outerRadius, 0, 1)
falloffWeight = 1.0 - smoothstep(innerRadius, outerRadius, normalizedDistance)
```

実装時には、image-normalized coordinate / current landmarks の座標系で計算するか、asset / same-unit 側で計算するかを検討します。v1 では Runtime の表情・姿勢に追従するため、current image-normalized landmarks を使う方針を第一候補にします。

### 案B: bounding box based falloff

```text
1. group に含まれる landmarks の bbox を計算する
2. bbox 中心からの距離または x/y 正規化距離で falloff を計算する
```

これは実装が簡単ですが、口や目の形状に対して粗い可能性があります。v1 の fallback または debug 比較候補として扱います。

### 案C: future explicit weights

将来必要なら、asset 側に per-index weight を持たせる可能性があります。

```json
{
  "id": "mouth",
  "indices": [13, 14, 17],
  "weights": [
    { "index": 13, "weight": 1.0 },
    { "index": 14, "weight": 1.0 },
    { "index": 202, "weight": 0.4 }
  ]
}
```

ただし、v1 では explicit weights は採用しません。`landmarkGroups` は index group のまま維持し、Engine の自動 falloff を先に検証します。

## group ごとの初期方針

### mouth

```text
mouth:
  中心に近い唇・口内・口角付近は強く attenuation
  外側の口周辺肌は弱めに attenuation
  group 境界に近い点は 1.0 に戻す
```

目的:

```text
口を開ける / すぼめる / 笑う時に、口まわりの破綻を抑えつつ、顔下半分全体が弱くなりすぎないようにする
```

### left_eye / right_eye

```text
left_eye / right_eye:
  目の中心・まぶた・虹彩周辺は強く attenuation
  目の外側周辺は弱めに attenuation
  頬や眉に近い境界では 1.0 に戻す
```

目的:

```text
まばたき / 目細め時に、黒目・白目・まぶた周辺の破綻を抑えつつ、頬や眉まで弱くなりすぎないようにする
```

### face_boundary

`face_boundary` は中心型 falloff より、boundary / feather / mask と合わせた別ロジックが必要になる可能性があります。

v1 では、falloff 対象を `mouth` / `left_eye` / `right_eye` に限定する方針を推奨します。`face_boundary` はすぐには center falloff 対象にせず、Production boundary / feather / mask と合わせて後段で検討します。

## correctionProfile / expressionAttenuation との関係

`expressionAttenuation` の `groupScale` は、blendshape score から計算される group 全体の target scale です。

`falloffWeight` は、group 内の landmark ごとの効き具合です。

最終的な per-landmark scale は以下のように考えます。

```ts
perLandmarkExpressionScale = lerp(1.0, groupScale, falloffWeight)
finalStrength = baseStrength * perLandmarkExpressionScale
```

複数 group に所属する landmark の場合は、既存方針どおり安全側を優先します。

```ts
finalExpressionScale = Math.min(...candidatePerLandmarkScales)
```

実装時には、既存の smoothing、fallback rule、複数 rule の min scale 方針と整合させます。

## landmarkGroups との関係

`landmarkGroups v1` の JSON は当面維持します。

```json
{
  "id": "mouth",
  "indices": [13, 14, 17]
}
```

責務:

```text
landmarkGroups:
  どの landmark が group に属するかを定義する

expressionAttenuation falloff:
  group 内で、どの landmark にどれくらい attenuation を効かせるかを Engine が自動計算する
```

Authoring Tool は引き続き group 範囲を作るだけです。falloff は Engine 側が自動計算します。

## Authoring Tool との関係

Authoring Tool は、v1 では falloff weight を直接編集しません。

今後必要なら以下を追加候補とします。

```text
- falloff preview
- group center 表示
- falloff heatmap
- explicit per-index weight editor
```

ただし、これらは後段候補です。v1 では group index の編集と、Engine の自動 falloff foundation を分けて進めます。

## Studio debug / Copy Debug の将来方針

将来の Engine 実装時には、Studio debug / Copy Debug に以下を出す方針です。

```text
Expression attenuation falloff:
status: computed
mode: auto_center_distance_v1
groups:
  mouth:
    center: x / y
    innerRadius:
    outerRadius:
    minWeight:
    maxWeight:
    averageWeight:
  left_eye:
    ...
  right_eye:
    ...
```

CorrectionVector debug には、将来以下を出せるようにします。

```text
affected groups: mouth
group scale: 0.654
falloff weight: 0.732
per-landmark expression scale: 0.747
final strength: 0.xxx
```

## 今回やらないこと

- TypeScript 実装
- Engine 実装
- Studio 実装
- Authoring Tool UI
- JSON schema 変更
- validator 変更
- landmarkGroups に explicit weights を追加
- mouth_core / mouth_outer の group 分割
- Production Shape Warp
- Runtime renderer integration
- Color Processing
- Layer System

## 次の実装候補

次の実装では、Engine 側に auto falloff foundation を追加します。

最初の候補:

```text
mode:
  auto_center_distance_v1

対象 group:
  mouth
  left_eye
  right_eye

座標:
  current image-normalized landmarks を第一候補

出力:
  per-landmark falloffWeight
  per-landmark expression scale
  Studio debug / Copy Debug summary
```
