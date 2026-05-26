# expressionFollow v1

## 目的

`expressionFollow` v1 は、表情時に各 landmark が neutral な projected ideal へどれだけ追従するかを定義する `correctionProfile` の optional extension です。

従来の `expressionAttenuation` は、blendshape score に応じて group ごとの補正強度を下げる safety attenuation として整理していました。今後の中心仕様は、単純に group の補正を弱めるのではなく、表情によって neutral ideal から自然に外れてよい landmark を許容する `expressionFollow` とします。

```text
expressionFollow:
  blendshape score に応じて、表情時に各 landmark が ideal へどれだけ追従するかを決める

idealFollowStrength:
  0.0 = current / camera を優先する
  1.0 = projected ideal へ追従する
```

例えば `mouthPucker` が高いとき、neutral IdealFace と現在の口すぼめ顔は当然ズレます。このズレは必ずしも補正すべき歪みではなく、表情として自然なズレです。そのため、口周辺の一部 landmark は neutral ideal に強く戻さず、現在の表情を優先します。

## JSON 仕様イメージ

`expressionFollow` は `correctionProfile` の optional extension として扱います。今回は docs 方針整理のみであり、TypeScript 実装、Engine 実装、Studio 実装、Authoring Tool UI、JSON export、validator はまだ変更しません。

```json
{
  "correctionProfile": {
    "schemaVersion": "correction_profile_v1",
    "mode": "per_landmark_strength",
    "defaultStrength": 0.25,
    "minStrength": 0.0,
    "maxStrength": 1.0,
    "maxCorrectionDistance": 0.015,
    "landmarkStrengths": [],
    "expressionFollow": {
      "schemaVersion": "expression_follow_v1",
      "smoothing": {
        "enabled": true,
        "halfLifeMs": 120
      },
      "rules": [
        {
          "id": "mouth_pucker_follow",
          "blendshape": "mouthPucker",
          "affectedLandmarkGroups": ["mouth"],
          "inputRange": [0.2, 0.8],
          "defaultIdealFollowStrengthRange": [1.0, 0.35],
          "landmarkFollowStrengths": [
            {
              "index": 13,
              "idealFollowStrength": 0.1
            },
            {
              "index": 14,
              "idealFollowStrength": 0.1
            },
            {
              "index": 61,
              "idealFollowStrength": 0.3
            }
          ],
          "source": {
            "type": "authoring_mp4_expression_3d_analysis",
            "neutralFrameGroup": "neutral",
            "expressionFrameGroup": "mouthPucker",
            "comparisonSpace": "bae_ar_ideal_landmarks3d_v1"
          }
        }
      ]
    }
  }
}
```

## field の意味

```text
expressionFollow:
  表情時に、landmark が ideal へどれだけ追従するかを制御する optional extension

idealFollowStrength:
  0.0 = current / camera を優先
  1.0 = projected ideal を優先

defaultIdealFollowStrengthRange:
  blendshape score に応じて group 全体の fallback idealFollowStrength を決める

landmarkFollowStrengths:
  表情時に特定 landmark が ideal へどれだけ追従するかを個別指定する
```

`idealFollowStrength` は既存の `correctionProfile.strength` と同じ 0.0 から 1.0 の直感に揃えます。指定がある landmark は `landmarkFollowStrengths` の値を優先し、指定がない landmark は `defaultIdealFollowStrengthRange` から計算した値を使います。

## 計算イメージ

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

```text
idealFollowStrength が低い:
  表情による current の状態を優先する

idealFollowStrength が高い:
  neutral ideal へ追従する
```

## landmarkGroups との関係

`landmarkGroups` は引き続き必要です。ただし、役割を次のように整理します。

```text
landmarkGroups:
  expressionFollow rule を適用する対象範囲を定義する

expressionFollow:
  その group 内で、表情ごとにどの landmark がどれだけ ideal に追従するかを定義する
```

つまり、`affectedLandmarkGroups` は対象範囲、`landmarkFollowStrengths` は landmark ごとの追従率です。`landmarkGroups` は個別パーツ変形命令ではなく、`expressionFollow` rule の適用対象を限定するための index group 定義です。

## MP4 からの自動生成方針

`landmarkFollowStrengths` は手作業だけで作るのではなく、IdealFace Authoring Tool が MP4 読み込み時に自動生成する方針です。

比較は 2D projected / image-normalized ではなく、同じ coordinate space に正規化した 3D 478 landmarks 同士で行います。

```text
neutral 3D 478:
  表情なし frame group から生成した 3D 478

expression 3D 478:
  mouthPucker / jawOpen / smile / blink / squint などの表情 frame group から生成した 3D 478
```

比較式:

```ts
dx = expression3D.x - neutral3D.x
dy = expression3D.y - neutral3D.y
dz = expression3D.z - neutral3D.z

distance3D = sqrt(dx * dx + dy * dy + dz * dz)
```

```text
distance3D が小さい:
  idealFollowStrength = 1.0 に近い

distance3D が大きい:
  idealFollowStrength = 0.1〜0.3 に近い
```

3D 差分が大きい landmark は、その表情では neutral ideal から自然に大きく外れる landmark とみなします。

## 生成フロー案

```text
1. MP4 を detailed scan する

2. 各 frame の landmarks / pose / blendshape score を取得する

3. neutral frame group を抽出する
   - mouthPucker が低い
   - jawOpen が低い
   - eyeBlink / eyeSquint が低い
   - smile 系が低い
   - pose が極端でない

4. neutral frame group から neutral 3D 478 を生成する

5. expression frame group を分類する
   - mouthPucker
   - jawOpen
   - mouthSmile
   - eyeBlinkLeft / Right
   - eyeSquintLeft / Right

6. expression frame group ごとに expression 3D 478 を生成する

7. neutral 3D 478 と expression 3D 478 を同じ comparisonSpace で比較する

8. affectedLandmarkGroups 内で、一定以上 distance3D がある landmark を抽出する

9. distance3D から idealFollowStrength を計算する

10. expressionFollow.rules[].landmarkFollowStrengths を生成する

11. Authoring Tool で確認・微調整できるようにする

12. ideal_face_asset_v1 の optional correctionProfile.expressionFollow、または将来 beauty_filter_asset_v1 に export する
```

## 自動生成式の初期候補

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

```text
3D 差分が小さい landmark:
  neutral ideal に追従してよい

3D 差分が大きい landmark:
  表情として自然にズレるため、ideal に戻しすぎない
```

## affectedLandmarkGroups の生成方針

`affectedLandmarkGroups` は、blendshape 名から初期候補を決めます。

```text
mouthPucker:
  affectedLandmarkGroups: ["mouth"]

jawOpen:
  affectedLandmarkGroups: ["mouth"]

mouthSmileLeft / mouthSmileRight:
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

そのうえで、`landmarkFollowStrengths` はその group 内の landmarks から 3D 差分が大きいものを抽出して生成します。

## 座標系方針

比較は必ず同じ coordinate space で行います。推奨する `comparisonSpace` は次です。

```text
bae_ar_ideal_landmarks3d_v1
```

やらないこと:

```text
2D image-normalized で比較しない
projected 2D landmarks で比較しない
camera frame 上の位置・スケール・姿勢差を混ぜない
```

Authoring Tool 側で、video aspect 補正、roll 補正、pose-aware generation を通し、same-unit coordinate / ideal landmarks 3D 空間に正規化したうえで比較します。

## expressionAttenuation / falloff との関係

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

既存の `expressionAttenuation` Engine foundation は残します。ただし今後の仕様方針としては、`expressionFollow v1` を優先します。`expressionAttenuation falloff v1` は、`landmarkFollowStrengths` が未指定のときの fallback または参考案として扱い、主役からは外します。

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
