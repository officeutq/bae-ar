# expressionAttenuation falloff v1

## 位置づけ

`expressionAttenuation falloff v1` は、旧方針である `expressionAttenuation` の group strengthScale 適用を滑らかにする参考案です。

今後の表情制御の中心仕様は、表情ごとに landmark が neutral な projected ideal へどれだけ追従するかを定義する [expressionFollow v1](expression-follow-v1.md) です。このドキュメントの falloff は、`landmarkFollowStrengths` が未指定のときの fallback または参考案として扱います。

```text
expressionAttenuation:
  旧方針 / 現在の Engine foundation
  group の補正強度を下げる safety attenuation

expressionAttenuation falloff:
  旧方針の改善案
  group 境界の二値変化を滑らかにする案

expressionFollow:
  新方針
  表情ごとに landmark が ideal へどれだけ追従するかを定義する
  landmarkFollowStrengths を主役にする
```

今回は docs の位置づけ整理のみです。TypeScript 実装、Engine 実装、Studio 実装、Authoring Tool UI、JSON export 変更、validator 変更は行いません。

## 背景

現在の `expressionAttenuation` foundation は、`affectedLandmarkGroups` が参照する group に含まれる landmark へ group ごとの `strengthScale` を適用します。

```text
group に含まれる:
  groupScale を適用する

group に含まれない:
  scale 1.0 のまま
```

`landmarkGroups` を広めに取ると、group 内外の境界で補正強度が急に変わる可能性があります。falloff は、この二値変化を滑らかにするための旧方針内の改善案でした。

## falloff の考え方

```ts
perLandmarkExpressionScale = lerp(1.0, groupScale, falloffWeight)
finalStrength = baseStrength * perLandmarkExpressionScale
```

```text
falloffWeight = 1.0:
  groupScale をそのまま適用する
  group 中心に近い点
  強い attenuation

falloffWeight = 0.5:
  groupScale と 1.0 の中間
  中間領域

falloffWeight = 0.0:
  1.0
  group 境界付近
  通常補正へ戻す
```

この方針は、`expressionAttenuation` が主役だった場合の境界対策です。`expressionFollow v1` では、表情ごとの `landmarkFollowStrengths` を優先します。

## fallback として使う場合

`expressionFollow` rule に `landmarkFollowStrengths` がない場合、または authoring で 3D 478 比較がまだ利用できない場合、fallback として group 内の距離ベース falloff を使う可能性があります。

```text
primary:
  expressionFollow.rules[].landmarkFollowStrengths
  MP4 の neutral 3D 478 / expression 3D 478 比較から生成する

fallback / reference:
  expressionAttenuation falloff
  group center distance などから Engine が自動計算する
```

fallback として使う場合も、`landmarkGroups` は範囲指定、falloff weight は一時的な自動補間として扱います。`landmarkGroups` JSON に explicit per-index weight を追加する方針ではありません。

## 自動 falloff 候補

### group center distance based falloff

```text
1. group に含まれる landmark の中心を計算する
2. 各 landmark と中心との距離を計算する
3. group 内の最大距離を outer radius とする
4. 中心に近いほど falloffWeight 1.0
5. 外側に近いほど falloffWeight 0.0 に近づける
```

```ts
distance = length(point - groupCenter)
normalizedDistance = clamp(distance / outerRadius, 0, 1)
falloffWeight = 1.0 - smoothstep(innerRadius, outerRadius, normalizedDistance)
```

### bounding box based falloff

```text
1. group に含まれる landmarks の bbox を計算する
2. bbox 中心からの距離または x/y 正規化距離で falloff を計算する
```

これは実装が簡単ですが、口や目の形状に対して粗い可能性があるため、fallback または debug 比較候補として扱います。

## landmarkGroups との関係

```text
landmarkGroups:
  expressionFollow rule または expressionAttenuation rule を適用する対象範囲を定義する

expressionFollow:
  group 内で、表情ごとにどの landmark がどれだけ ideal に追従するかを定義する

expressionAttenuation falloff:
  旧方針の fallback として、group 内の補正弱化を滑らかに補間する
```

`expressionFollow v1` では `affectedLandmarkGroups` が対象範囲、`landmarkFollowStrengths` が landmark ごとの追従率です。falloff は主役ではありません。

## 今回やらないこと

- TypeScript 実装
- Engine 実装
- Studio 実装
- Authoring Tool UI
- JSON schema 変更
- validator 変更
- expressionFollow v1 実装
- MP4 expression 3D analysis 実装
- landmarkFollowStrengths 自動生成実装
- landmarkGroups に explicit weights を追加
- Production Shape Warp
- Runtime renderer integration
- Color Processing
- Layer System
