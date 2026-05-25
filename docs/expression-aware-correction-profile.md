# expression-aware correctionProfile

## 目的

このドキュメントは、`correctionProfile` の optional extension として Engine foundation 実装済みの `expressionAttenuation` v1 の方針と、未実装の後段範囲を整理します。

現在の WebGL mesh warp debug prototype では、`normal` / `strong` のように補正を強めると、輪郭線や境界が目立つことがあります。また、口を開けたときに口内が塗りつぶされたように見えたり、目周りで黒目が瞼色になることがあります。

これは WebGL mesh warp 自体だけの問題ではなく、`CorrectionPlan` 側で表情、可動部位、保護領域を安全側に扱う必要があるという課題です。現在は表情別 IdealFace を作るのではなく、MediaPipe blendshape score に応じて landmark group ごとの補正強度を弱める `expressionAttenuation` v1 foundation を Engine 側に実装済みです。

## 今回の範囲

現在は Engine 側の `expressionAttenuation` v1 foundation、fallback rules、validation、CorrectionPlan への `finalStrength` 反映、Studio debug / Copy Debug 表示まで実装済みです。以下はまだ行いません。

- Authoring Tool 編集 UI
- correctionProfile / expressionAttenuation export 変更
- `beauty_filter_asset_v1` 実装
- WebGL mesh warp 修正
- Production Shape Warp
- Runtime renderer integration
- expression-specific IdealFace 実装
- expression target offset 実装
- Layer System
- Color Processing

## 位置づけ

```text
correctionProfile:
  - IdealFace asset に保存される補正設定
  - defaultStrength / landmarkStrengths / maxCorrectionDistance を持つ
  - 今後 expressionAttenuation を optional extension として持てる

expressionAttenuation:
  - MediaPipe blendshape score を入力にする
  - affectedLandmarkGroups ごとに strengthScale を変える
  - strengthScale は 0.0 から 1.0
  - 1.0 は通常どおり
  - 0.0 はその group の補正なし
  - 即時切替ではなく smoothing する

CorrectionPlan:
  - baseStrength を決める
  - expressionAttenuation の group strengthScale を掛ける
  - finalStrength を使って correction vector を計算する
```

`expressionAttenuation` は、目だけ大きくする、鼻だけ細くする、顎だけ削るための機能ではありません。これは、表情や可動部位によって破綻しやすい領域の補正を弱める safety attenuation です。

最終的な配布単位では、`expressionAttenuation` の `affectedLandmarkGroups` は `beauty_filter_asset_v1.landmarkGroups` の group id を参照する方向です。`landmarkGroups` は `correctionProfile` と `colorLayers` の両方から参照されるため、1つの filter asset 内で整合性を保ちます。`landmarkGroups v1` の JSON 仕様、Engine fallback、validation 方針は [landmarkGroups v1](landmark-groups-v1.md) に整理します。

## JSON 仕様案

`expressionAttenuation` は `correctionProfile` の optional extension として扱います。Engine 側の validator foundation は実装済みです。既存の `correction_profile_v1` の基本構造を壊さず、将来の Authoring Tool UI / converter / export 対応で段階的に扱えるようにします。

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
    "expressionAttenuation": {
      "schemaVersion": "expression_attenuation_v1",
      "smoothing": {
        "enabled": true,
        "halfLifeMs": 120
      },
      "rules": [
        {
          "id": "jaw_open_reduce_mouth",
          "blendshape": "jawOpen",
          "affectedLandmarkGroups": ["mouth"],
          "inputRange": [0.15, 0.60],
          "strengthScaleRange": [1.0, 0.2]
        },
        {
          "id": "left_eye_blink_reduce_left_eye",
          "blendshape": "eyeBlinkLeft",
          "affectedLandmarkGroups": ["left_eye"],
          "inputRange": [0.2, 0.8],
          "strengthScaleRange": [1.0, 0.2]
        },
        {
          "id": "right_eye_blink_reduce_right_eye",
          "blendshape": "eyeBlinkRight",
          "affectedLandmarkGroups": ["right_eye"],
          "inputRange": [0.2, 0.8],
          "strengthScaleRange": [1.0, 0.2]
        },
        {
          "id": "left_eye_squint_reduce_left_eye",
          "blendshape": "eyeSquintLeft",
          "affectedLandmarkGroups": ["left_eye"],
          "inputRange": [0.2, 0.7],
          "strengthScaleRange": [1.0, 0.3]
        },
        {
          "id": "right_eye_squint_reduce_right_eye",
          "blendshape": "eyeSquintRight",
          "affectedLandmarkGroups": ["right_eye"],
          "inputRange": [0.2, 0.7],
          "strengthScaleRange": [1.0, 0.3]
        }
      ]
    }
  }
}
```

## affectedLandmarkGroups

v1 の group 候補は、まず破綻が目立つ mouth / eyes / face boundary に絞ります。

```text
mouth:
  口を開けたとき、唇・口内・歯まわりの破綻を抑える

left_eye / right_eye:
  まばたき、目細め、黒目・白目・まぶた周辺の破綻を抑える

face_boundary:
  顔外周、背景、髪、眼鏡境界などの破綻を抑える
```

v1 では landmark group の index 定義はまだ完全確定しません。将来は `beauty_filter_asset_v1.landmarkGroups` に group 定義を持ち、asset に存在しない場合は Engine fallback group を使う方向です。現在は docs 仕様化のみで、Engine landmarkGroups asset loading foundation は未実装です。

```ts
type LandmarkGroupId =
  | "mouth"
  | "left_eye"
  | "right_eye"
  | "face_boundary"
```

将来 color processing 向けには、`skin` / `lip` / `cheek` / `eye_area` などの group を追加する可能性があります。これらは `colorLayers` の mask 対象として使う候補であり、shape warp 用の個別パーツ変形命令ではありません。

## 最初に使う blendshapes

最初から多くの blendshape を使わず、破綻が目立つ mouth / eyes から始めます。

優先して使う候補:

```text
jawOpen
eyeBlinkLeft
eyeBlinkRight
eyeSquintLeft
eyeSquintRight
```

後で追加する候補:

```text
mouthPucker
mouthFunnel
mouthSmileLeft
mouthSmileRight
mouthStretchLeft
mouthStretchRight
eyeWideLeft
eyeWideRight
```

## jawOpen の例

```text
jawOpen が低い:
  口はあまり開いていない
  mouth group の strengthScale は 1.0 に近い
  通常どおり補正してよい

jawOpen が高い:
  口が大きく開いている
  mouth group の strengthScale を 0.2 などへ下げる
  口周りの補正を弱める
```

計算例:

```ts
const t = clamp((jawOpen - 0.15) / (0.60 - 0.15), 0, 1)
const targetStrengthScale = lerp(1.0, 0.2, t)
```

最終的な補正強度:

```ts
finalStrength = baseStrength * smoothedStrengthScale
```

現在の fallback default では `baseStrength = 0.25` なので、jawOpen が大きい場合:

```text
finalStrength = 0.25 * 0.2 = 0.05
```

つまり、口が大きく開いているときは `mouth` group の補正をかなり弱めます。

## eyeBlink / eyeSquint の例

`eyeBlinkLeft` または `eyeSquintLeft` が高い場合は `left_eye` group の `strengthScale` を下げます。`eyeBlinkRight` または `eyeSquintRight` が高い場合は `right_eye` group の `strengthScale` を下げます。

目的は、まばたきや目細めの最中に、黒目、白目、まぶた周辺の texture が不自然に引っ張られることを抑えることです。これは目を大きくするための制御ではなく、目周りが破綻しやすい表情のときに補正を弱める safety attenuation です。

## smoothing 方針

`strengthScale` は blendshape score に応じて毎フレーム変化します。ただし、blendshape が閾値を超えた瞬間に `strengthScale` を急に変えると、加工がカクつきます。

そのため、v1 では target scale と smoothed scale を分けます。

```text
targetScale:
  現在の blendshape score から計算した目標値

smoothedScale:
  実際に CorrectionPlan へ使う値
  前フレームの値から targetScale へ滑らかに近づける
```

式の例:

```ts
smoothedScale = previousScale + (targetScale - previousScale) * alpha
```

または half-life ベース:

```ts
alpha = 1 - Math.exp(-deltaTimeMs / halfLifeMs)
```

Engine v1 foundation では、`halfLifeMs` を使った smoothing を実装済みです。JSON 例の `halfLifeMs: 120` は、表情変化への追従と急な切り替わり抑制のバランスを確認するための初期値です。

## CorrectionPlan での計算順

```text
1. baseStrength を決める
   - landmarkStrength override があれば使う
   - なければ defaultStrength

2. landmark が属する group を調べる

3. blendshape score から group ごとの target strengthScale を計算する

4. smoothing された group strengthScale を取得する

5. finalStrength = baseStrength * groupStrengthScale

6. correctionDelta = rawDelta * finalStrength

7. maxCorrectionDistance で clamp する
```

複数 group / 複数 rule が当たった場合は、より安全側として min scale を使います。

```ts
groupScale = Math.min(...matchedScales)
```

例えば、`mouth` に対して `jawOpen` と将来の `mouthFunnel` の両方が適用される場合、補正を強める方向ではなく、より小さい `strengthScale` を採用して破綻を避けます。

## expression-specific IdealFace との関係

`expressionAttenuation` は、表情別 IdealFace や expression target offset より前の段階です。

```text
Step 1:
  expression-aware correctionProfile
  blendshape score による group strengthScale 制御

Step 2:
  expression target offset
  neutral IdealFace に表情ごとの offset を足す方式を検討

Step 3:
  expression-specific IdealFace
  neutral / mouthOpen / smile / blink などの IdealFace を持つ方式を検討
```

現在採用しているのは Step 1 です。Engine 側 foundation は実装済みですが、Authoring Tool UI / export 連携、expression target offset、expression-specific IdealFace はまだ扱いません。IdealFace 自体はまだ表情別に分けません。

## 現在の破綻との関係

WebGL mesh warp debug prototype で見えている口内の塗りつぶし、目周りで黒目が瞼色になるような破綻、顔外周の境界の目立ちやすさは、まず `CorrectionPlan` 側で動かしすぎを避ける問題として整理します。

`expressionAttenuation` は、可動部位や保護領域の補正を安全側に倒すための第一段階です。Production Shape Warp、Runtime renderer integration、mask / boundary handling、glasses / hair handling は後段で扱います。
