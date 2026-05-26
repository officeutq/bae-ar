# expression-aware correctionProfile

## 目的

このドキュメントは、現在 Engine foundation として実装済みの `expressionAttenuation` v1 と、今後の中心仕様である `expressionFollow v1` の関係を整理します。

今後の方針では、表情時に単純に group の補正強度を下げるのではなく、表情ごとに landmark が neutral な projected ideal へどれだけ追従するかを定義する `expressionFollow v1` を主役にします。詳細な新仕様は [expressionFollow v1](expression-follow-v1.md) に整理します。

## 現在の Engine foundation

現在実装済みの `expressionAttenuation` v1 foundation は、MediaPipe blendshape score に応じて `affectedLandmarkGroups` の `strengthScale` を下げる safety attenuation です。

```text
expressionAttenuation:
  blendshape score に応じて affectedLandmarkGroups の strengthScale を下げる
  group 内の landmark は一律に弱める
  halfLifeMs smoothing で急な切り替わりを抑える
```

実装済み:

- Engine fallback rules
- validation / fallback foundation
- `jawOpen` による `mouth` group strengthScale
- `eyeBlinkLeft` / `eyeBlinkRight` による `left_eye` / `right_eye` group strengthScale
- `eyeSquintLeft` / `eyeSquintRight` による `left_eye` / `right_eye` group strengthScale
- `halfLifeMs` smoothing
- CorrectionVector の `baseStrength` / `expressionStrengthScale` / `finalStrength`
- Studio debug / Copy Debug summary

この foundation は既存互換として残します。ただし、今後の仕様追加では `expressionFollow v1` を優先します。

## 新旧方針の違い

旧方針:

```text
expressionAttenuation:
  blendshape score に応じて affectedLandmarkGroups の strengthScale を下げる
  group 内の landmark は一律に弱める
  falloff で境界を滑らかにする
```

新方針:

```text
expressionFollow:
  blendshape score に応じて、表情時に各 landmark が ideal へどれだけ追従するかを決める

idealFollowStrength:
  0.0 = current / camera を優先する
  1.0 = projected ideal へ追従する
```

つまり、「表情時に補正を弱める」のではなく、「表情時に neutral ideal から自然に外れてよい landmark を定義する」方針です。

## expressionFollow の計算位置づけ

```ts
rawDelta = projectedIdeal - current

baseStrength =
  correctionProfile.defaultStrength
  または landmarkStrength override

expressionFollowStrength =
  landmarkFollowStrengths に index があればその idealFollowStrength
  なければ defaultIdealFollowStrengthRange から計算した値

finalStrength =
  baseStrength * expressionFollowStrength

correctionDelta =
  rawDelta * finalStrength

correctionDelta =
  clampLength(correctionDelta, maxCorrectionDistance)
```

`idealFollowStrength` が低い landmark は current / camera の表情状態を優先し、`idealFollowStrength` が高い landmark は neutral な projected ideal に追従します。

## landmarkGroups との関係

`landmarkGroups` は引き続き必要です。ただし、役割を以下のように整理します。

```text
landmarkGroups:
  expressionFollow rule を適用する対象範囲を定義する

expressionFollow:
  その group 内で、表情ごとにどの landmark がどれだけ ideal に追従するかを定義する
```

`affectedLandmarkGroups` は対象範囲、`landmarkFollowStrengths` は landmark ごとの追従率です。

## expressionAttenuation falloff との関係

`expressionAttenuation falloff v1` は、旧方針である group strengthScale の二値適用を滑らかにする改善案です。今後の中心仕様ではありません。

```text
expressionAttenuation falloff:
  旧方針の改善案
  group 境界の二値変化を滑らかにする案
  landmarkFollowStrengths が未指定のときの fallback または参考案
```

詳細は [expressionAttenuation falloff v1](expression-attenuation-falloff-v1.md) に整理します。

## 今後の authoring 方針

`expressionFollow.rules[].landmarkFollowStrengths` は手作業だけで作るのではなく、IdealFace Authoring Tool が MP4 の表情別 frame group から自動生成する方針です。

```text
neutral 3D 478:
  表情なし frame group から生成した 3D 478

expression 3D 478:
  mouthPucker / jawOpen / smile / blink / squint などの表情 frame group から生成した 3D 478

comparisonSpace:
  bae_ar_ideal_landmarks3d_v1
```

比較は 2D image-normalized や projected 2D landmarks ではなく、同じ coordinate space に正規化した 3D 478 landmarks 同士で行います。

## 今回やらないこと

- TypeScript 実装
- Engine 実装
- Studio 実装
- Authoring Tool UI
- JSON export 変更
- validator 変更
- expressionFollow v1 実装
- MP4 expression 3D analysis 実装
- landmarkFollowStrengths 自動生成実装
- Production Shape Warp
- Runtime renderer integration
- Color Processing
- Layer System
