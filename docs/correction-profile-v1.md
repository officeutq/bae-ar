# correctionProfile v1

## 目的

`correctionProfile` は、`ideal_face_asset_v1` に optional な top-level field として追加する将来仕様です。

`idealLandmarks3D` の各点に直接 `strength` を混ぜず、別セクションとして保持します。

理由:

- `idealLandmarks3D` は理想顔の形状データ
- `correctionProfile` は理想顔へどれくらい寄せるかの補正設定
- 形状データと補正設定は意味が違うため分ける
- 将来、profile だけ差し替える余地を残す

今回は仕様ドキュメントのみです。TypeScript 型、validator、converter、Studio debug、CorrectionPlan、Shape Warp、Authoring Tool 編集 UI、export 処理はまだ実装しません。

## JSON 例

以下は `correctionProfile` の位置と値の意味を示す短縮例です。実装時は既存の `ideal_face_asset_v1` の `source` / `model` 構造に合わせ、`correctionProfile` を asset の top-level field として追加します。

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

`correctionProfile` が存在しない既存 asset でも壊れないように、将来の Engine 実装では以下を fallback default として扱います。

```text
correctionProfile が存在しない場合:
  defaultStrength: 0.25
  minStrength: 0.0
  maxStrength: 1.0
  maxCorrectionDistance: 0.015
  landmarkStrengths: []
```

## validation 方針

将来の validator 実装では、以下を検証します。

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
  correctionProfile の strength を掛ける
  maxCorrectionDistance で clamp する
  Shape Warp へ渡す correction vectors を持つ
```

CorrectionPlan は姿勢補正を担当しません。姿勢への対応は IdealFace Projection の責務です。Projection 後の projected ideal imageLandmarks は、すでに現在姿勢を反映しているものとして扱います。

## Shape Processing 方針との関係

- 個別パーツ加工はしない
- `correctionProfile` は「目だけ大きくする」「鼻だけ細くする」「顎だけ削る」ための命令セットではない
- 478 点それぞれに `strength` を持つことは許容する
- ただし意味としては、current から projected ideal へ全体として自然に少し寄せるための補正率である
- shape warp では最終的に pixel coordinate を使う
- `correctionProfile` と CorrectionPlan v1 の入力は image-normalized coordinate 基準

## 未実装範囲

この仕様は次の実装に進むためのドキュメントです。以下は未実装のままです。

- TypeScript 型
- validator
- converter
- Studio debug
- CorrectionPlan
- Shape Warp
- 画像変形
- Authoring Tool 編集 UI
- `ideal_face_asset_v1` export 処理変更
- Layer System
- LayerMaskSpec
- Color Processing
