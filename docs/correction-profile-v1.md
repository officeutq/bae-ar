# correctionProfile v1

## 目的

`correctionProfile` v1 は、`ideal_face_asset_v1` の optional top-level field として Engine foundation 実装済みです。最終的な配布単位では、`beauty_filter_asset_v1` の `correctionProfile` セクションとして `idealFace`、`landmarkGroups`、`shapeWarpSettings`、`colorLayers` と一緒に束ねる方向です。

`idealLandmarks3D` の各点に直接 `strength` を混ぜず、別セクションとして保持します。

理由:

- `idealLandmarks3D` は理想顔の形状データ
- `correctionProfile` は理想顔へどれくらい寄せるかの補正設定
- 形状データと補正設定は意味が違うため分ける
- 将来、profile だけ差し替える余地を残す

このドキュメントは correctionProfile v1 の仕様を定義します。現在は Engine 側 foundation、validation / fallback、expressionAttenuation v1 foundation、Studio debug summary、CorrectionPlan v1 debug foundation、Studio 向け Shape Warp v1 debug prototype、Studio processed preview 限定 WebGL mesh warp v1 prototype まで実装済みです。`expressionFollow v1` は今後の中心仕様として docs 方針のみ追加し、Authoring Tool 編集 UI、correctionProfile / expressionFollow export 変更、`beauty_filter_asset_v1`、Production Shape Warp はまだ実装しません。

## JSON 例

以下は `correctionProfile` の位置と値の意味を示す短縮例です。現在の Engine foundation では既存の `ideal_face_asset_v1` の `source` / `model` 構造に合わせ、`correctionProfile` を asset の top-level field として扱います。

```json
{
  "schemaVersion": "ideal_face_asset_v1",
  "id": "custom_ideal_face_2026_05_24_182653",
  "name": "Custom IdealFace",
  "version": "0.1.0",
  "generationMethod": "pose_aware_weighted_z_v1",
  "landmarkTopology": "mediapipe_face_landmarker_478",
  "coordinateSpace": "bae_ar_ideal_landmarks3d_v1",
  "idealLandmarks3D": [
    {
      "index": 0,
      "x": 0.001,
      "y": 0.123,
      "z": -0.02
    }
  ],
  "correctionProfile": {
    "schemaVersion": "correction_profile_v1",
    "mode": "per_landmark_strength",
    "defaultStrength": 0.25,
    "minStrength": 0.0,
    "maxStrength": 1.0,
    "maxCorrectionDistance": 0.015,
    "landmarkStrengths": [
      {
        "index": 0,
        "strength": 0.2
      },
      {
        "index": 291,
        "strength": 0.35
      }
    ]
  }
}
```

既存の実装形式に合わせた配置イメージ:

```json
{
  "schemaVersion": "ideal_face_asset_v1",
  "id": "custom_ideal_face_2026_05_24_182653",
  "name": "Custom IdealFace",
  "version": "0.1.0",
  "createdAt": "2026-05-24T18:26:53.000Z",
  "source": {
    "tool": "ideal-face-authoring",
    "generationMethod": "pose_aware_weighted_z_v1"
  },
  "model": {
    "landmarkTopology": "mediapipe_face_landmarker_478",
    "coordinateSpace": "bae_ar_ideal_landmarks3d_v1",
    "idealLandmarks3D": [
      {
        "index": 0,
        "x": 0.001,
        "y": 0.123,
        "z": -0.02,
        "confidence": 1
      }
    ]
  },
  "correctionProfile": {
    "schemaVersion": "correction_profile_v1",
    "mode": "per_landmark_strength",
    "defaultStrength": 0.25,
    "minStrength": 0.0,
    "maxStrength": 1.0,
    "maxCorrectionDistance": 0.015,
    "landmarkStrengths": [
      {
        "index": 0,
        "strength": 0.2
      }
    ]
  }
}
```

## field の意味

- `correctionProfile` は optional
- `schemaVersion` は `"correction_profile_v1"`
- `mode` は v1 では `"per_landmark_strength"` のみ
- `defaultStrength` は個別指定がない landmark に使う補正率
- `strength` は 0.0 から 1.0
- `0.0` は補正なし
- `1.0` は projected ideal に完全一致
- `0.25` は current から projected ideal への差分の 25% だけ寄せる
- `landmarkStrengths` は index ごとの override
- `landmarkStrengths` に存在しない index は `defaultStrength` を使う
- `maxCorrectionDistance` は Engine 側で correction vector を clamp する上限
- `maxCorrectionDistance` は image-normalized coordinate 基準
- `correctionProfile` には dx / dy を保存しない

## optional extension: expressionFollow

今後の中心仕様では、`correctionProfile` の optional extension として `expressionFollow` を扱います。`expressionFollow` は、表情時に各 landmark が neutral な projected ideal へどれだけ追従するかを定義します。

```text
idealFollowStrength:
  0.0 = current / camera を優先
  1.0 = projected ideal を優先
```

`expressionFollow` は、表情時に単純に group の補正強度を下げるための仕組みではありません。`mouthPucker` や `jawOpen`、`mouthSmile`、`eyeBlink`、`eyeSquint` などで neutral ideal から自然に外れてよい landmark を定義し、戻しすぎを避けるための追従率です。

```ts
rawDelta = projectedIdeal - current
baseStrength = correctionProfile.defaultStrength または landmarkStrength override
expressionFollowStrength = landmarkFollowStrengths の idealFollowStrength または defaultIdealFollowStrengthRange 由来の値
finalStrength = baseStrength * expressionFollowStrength
correctionDelta = clampLength(rawDelta * finalStrength, maxCorrectionDistance)
```

`landmarkFollowStrengths` は、表情ごとの landmark 追従率を個別に指定します。指定がある landmark はその `idealFollowStrength` を優先し、指定がない landmark は `defaultIdealFollowStrengthRange` から計算した fallback 値を使います。

詳細な JSON 仕様案、MP4 の表情別 3D 478 比較による自動生成方針、座標系方針は [expressionFollow v1](expression-follow-v1.md) に整理します。

## expressionAttenuation との関係

`expressionAttenuation` v1 foundation は Engine 側に実装済みです。これは MediaPipe blendshape score に応じて `mouth` / `left_eye` / `right_eye` / `face_boundary` などの `affectedLandmarkGroups` ごとに `strengthScale` を下げる safety attenuation です。

既存 foundation:

- `jawOpen` による `mouth` group strengthScale
- `eyeBlinkLeft` / `eyeBlinkRight` による `left_eye` / `right_eye` group strengthScale
- `eyeSquintLeft` / `eyeSquintRight` による `left_eye` / `right_eye` group strengthScale
- `halfLifeMs` smoothing
- CorrectionVector の `baseStrength` / `expressionStrengthScale` / `finalStrength`

この foundation は残します。ただし、今後の仕様方針としては `expressionFollow v1` を優先します。`expressionAttenuation falloff v1` は、旧方針の group 境界の二値変化を滑らかにする案であり、`landmarkFollowStrengths` が未指定のときの fallback または参考案として扱います。

`affectedLandmarkGroups` は、将来 `beauty_filter_asset_v1.landmarkGroups` の group id を参照します。`landmarkGroups v1` の詳細は [landmarkGroups v1](landmark-groups-v1.md) に整理します。

最終的な filter asset の束ね方は [beauty_filter_asset_v1 direction](beauty-filter-asset-v1.md) に整理します。`correctionProfile` は shape correction の強度と表情時の追従制御を担当し、`idealLandmarks3D` の形状データや `colorLayers` の色加工設定とは混ぜません。

## dx / dy を保存しない理由

`dx / dy` は、現在の顔の姿勢、位置、表情、projection 結果によって毎フレーム変わるため、IdealFace asset の JSON には保存しません。

Authoring Tool が保存するもの:

```text
landmark ごとの strength
```

Engine が毎フレーム計算するもの:

```text
rawDeltaX = projectedIdeal.x - current.x
rawDeltaY = projectedIdeal.y - current.y

correctionDeltaX = rawDeltaX * strength
correctionDeltaY = rawDeltaY * strength
```

最終 target:

```text
targetX = current.x + correctionDeltaX
targetY = current.y + correctionDeltaY
```

## Runtime / Authoring / Studio の責務分離

```text
IdealFace Authoring Tool
  - correctionProfile を作成・編集する
  - landmark index ごとの strength を設定する
  - dx / dy は持たない
  - 編集 UI は後で実装する

Engine Runtime
  - ideal_face_asset_v1 から correctionProfile を読み込む
  - correctionProfile がない場合は fallback default を使う
  - current landmarks と projected ideal imageLandmarks から dx / dy を毎フレーム計算する
  - strength を掛けて correction vector を作る
  - maxCorrectionDistance で clamp する
  - CorrectionPlan を生成する

Beauty Studio
  - Engine の公開 API から correctionProfile / CorrectionPlan を確認する
  - debug / Copy Debug / overlay で表示する
  - Engine 内部実装や private field に直接依存しない
```

## fallback 仕様

`correctionProfile` が存在しない既存 asset でも壊れないように、現在の Engine foundation では以下を fallback default として扱います。

```text
correctionProfile が存在しない場合:
  defaultStrength: 0.25
  minStrength: 0.0
  maxStrength: 1.0
  maxCorrectionDistance: 0.015
  landmarkStrengths: []
```

## validation 方針

現在の Engine validator foundation では、以下を検証します。

- `correctionProfile` は optional
- 存在する場合、`schemaVersion` は `"correction_profile_v1"`
- `mode` は `"per_landmark_strength"`
- `defaultStrength` は 0.0 から 1.0
- `minStrength` は 0.0
- `maxStrength` は 1.0
- `maxCorrectionDistance` は 0 より大きい number
- `landmarkStrengths` は配列
- `index` は 0 から 477 の整数
- `strength` は 0.0 から 1.0
- 同じ `index` の重複はエラー

重複 index は後勝ちにせず、validator error にします。

## CorrectionPlan との関係

```text
correctionProfile:
  IdealFace asset に保存される補正設定
  各 landmark をどれくらい ideal に寄せるかを表す
  dx / dy は持たない

CorrectionPlan:
  Engine が毎フレーム生成する実行計画
  current landmarks と projected ideal imageLandmarks の dx / dy を計算する
  correctionProfile の baseStrength を決める
  expressionFollow がある場合は idealFollowStrength を掛ける
  既存 expressionAttenuation foundation がある場合は group strengthScale を掛ける
  maxCorrectionDistance で clamp する
  Shape Warp へ渡す correction vectors を持つ
```

CorrectionPlan は姿勢補正を担当しません。姿勢への対応は IdealFace Projection の責務です。Projection 後の projected ideal imageLandmarks は、すでに現在姿勢を反映しているものとして扱います。

## Shape Processing 方針との関係

- 個別パーツ加工はしない
- `correctionProfile` は「目だけ大きくする」「鼻だけ細くする」「顎だけ削る」ための命令セットではない
- `expressionFollow` は表情ごとに landmark が ideal へどれだけ追従するかを定義する安全制御であり、個別パーツ加工命令ではない
- `expressionAttenuation` は既存 foundation として残るが、今後の中心仕様ではなく fallback / 参考扱いである
- 478 点それぞれに `strength` を持つことは許容する
- ただし意味としては、current から projected ideal へ全体として自然に少し寄せるための補正率である
- shape warp では最終的に pixel coordinate を使う
- `correctionProfile` と CorrectionPlan v1 の入力は image-normalized coordinate 基準

## 現在の実装状態と残り範囲

`correctionProfile` v1 の Engine 型 / validator / converter foundation、fallback default、`expressionAttenuation` v1 foundation、Studio debug summary、CorrectionPlan v1 debug foundation、Studio 向け Shape Warp v1 debug prototype、Studio processed preview 限定 WebGL mesh warp v1 prototype は実装済みです。

実装済みの `expressionAttenuation` v1 foundation:

- default fallback rules
- `jawOpen` による `mouth` group strengthScale
- `eyeBlinkLeft` / `eyeBlinkRight` による `left_eye` / `right_eye` group strengthScale
- `eyeSquintLeft` / `eyeSquintRight` による `left_eye` / `right_eye` group strengthScale
- `halfLifeMs` smoothing
- CorrectionVector の `baseStrength` / `expressionStrengthScale` / `finalStrength`

以下はまだ未実装です。

- Production Shape Warp
- production renderer integration
- 画像変形の本番実装
- landmarkGroups v1 asset schema implementation
- shapeWarpSettings v1
- colorLayers v1
- beauty_filter_asset_v1
- Authoring Tool 編集 UI
- `ideal_face_asset_v1` export 処理変更
- correctionProfile / expressionAttenuation Authoring Tool UI
- correctionProfile / expressionAttenuation asset export 変更
- expressionFollow v1 実装
- MP4 expression 3D analysis 実装
- landmarkFollowStrengths 自動生成実装
- correctionProfile / expressionFollow Authoring Tool UI
- correctionProfile / expressionFollow asset export 変更
- expression-specific IdealFace
- expression target offset
- Layer System
- LayerMaskSpec
- Color Processing
