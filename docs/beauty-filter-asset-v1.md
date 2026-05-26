# beauty_filter_asset_v1 direction

このドキュメントは、BAE AR の最終的なフィルター / プリセット配布単位として `beauty_filter_asset_v1` を導入する方向性を整理します。

今回は docs の方向性整理のみを行います。TypeScript 実装、Engine 実装、Studio 実装、Authoring Tool UI、JSON export 変更、validator 実装、Color Processing 実装、Layer System 実装、Production Shape Warp 実装、Runtime renderer integration はまだ行いません。

## 基本方針

最終的な配布単位は、1つの Beauty Filter JSON とします。

ただし、内部では意味ごとにセクションを分けます。

```text
beauty_filter_asset_v1
  ├─ idealFace
  ├─ landmarkGroups
  ├─ correctionProfile
  ├─ shapeWarpSettings
  └─ colorLayers
```

```text
配布単位:
  1つの Beauty Filter JSON

内部構造:
  IdealFace / landmarkGroups / correctionProfile / shapeWarpSettings / colorLayers を分離

理由:
  各セクションの責務が違うため、意味を混ぜない
```

`beauty_filter_asset_v1` は、最終的な filter / preset をサービスや Runtime が選択しやすくするための bundle です。`IdealFace` の形状、`correctionProfile` の補正強度、`shapeWarpSettings` の実行設定、`colorLayers` の色加工を1つの asset として渡せるようにします。

## 1つの JSON に束ねる理由

最終的なフィルターは、複数の独立 JSON ではなく、1つの `beauty_filter_asset_v1` として配布します。

理由:

- IdealFace と landmarkGroups の対応を保つため
- correctionProfile の `expressionFollow` / `expressionAttenuation` が参照する `affectedLandmarkGroups` の整合性を保つため
- colorLayers が参照する `skin` / `lip` / `cheek` などの group の整合性を保つため
- サービス側では 1つの filter asset を選択するだけでよくなるため
- Engine は 1つの asset を読み込んで shape / color の両方を実行できるため

## 内部を分離する理由

1つの JSON にしますが、内部は責務ごとに分離します。

```text
IdealFace:
  理想顔の形状

landmarkGroups:
  landmark index の意味領域

correctionProfile:
  shape correction の強度と expressionFollow による表情時の追従制御

shapeWarpSettings:
  warp renderer / smoothing / boundary の設定

colorLayers:
  色加工、mask、合成順、opacity
```

これにより、将来的に以下がしやすくなります。

- 同じ IdealFace で色だけ変える
- 同じ landmarkGroups を別フィルターに流用する
- shape は弱め、color は強めなどの preset を作る
- Authoring Tool で各セクションを別々に編集する

## セクションの責務

### idealFace

`idealFace` は、どんな理想顔に寄せるかを表す形状基準です。

```text
idealFace:
  どんな理想顔に寄せるかを表す形状基準
  idealLandmarks3D 478点を持つ
  same-unit coordinate の 3D landmarks
  Runtime で現在 FacePose へ Projection される
```

`idealFace` は MediaPipe 478 landmarks そのものではありません。BAE AR 独自の理想 3D 顔モデルを本体とし、Engine Runtime が現在顔の `FacePose` に合わせて projected ideal 478 landmarks を生成します。

### landmarkGroups

`landmarkGroups` は、MediaPipe landmark index 群に意味を与える定義です。

```text
landmarkGroups:
  MediaPipe landmark index 群に意味を与える定義
  mouth / left_eye / right_eye / face_boundary / skin / lip / cheek など
  expressionFollow / expressionAttenuation / colorLayers が参照する
  Authoring Tool で将来編集できるようにする
```

v1 では、まず以下を想定します。

```text
mouth
left_eye
right_eye
face_boundary
```

将来 color processing 向けに以下を追加する可能性があります。

```text
skin
lip
cheek
eye_area
```

`landmarkGroups` は個別パーツ加工の命令ではありません。`expressionFollow` が表情時の追従制御を適用する対象範囲を参照したり、既存 `expressionAttenuation` が補正を弱める領域を参照したり、`colorLayers` が mask 対象の意味領域を参照したりするための index group 定義です。

詳細仕様、JSON 例、Engine fallback、validation、Landmark Group Editor 方針は [landmarkGroups v1](landmark-groups-v1.md) に整理します。`expressionFollow v1` では `affectedLandmarkGroups` が対象範囲、`landmarkFollowStrengths` が landmark ごとの追従率です。詳細は [expressionFollow v1](expression-follow-v1.md) に、MP4 からの自動生成方針は [MP4 expression 3D analysis plan](mp4-expression-3d-analysis-plan.md) に整理します。`expressionAttenuation falloff v1` は fallback / 参考案です。Engine landmarkGroups asset loading foundation、Authoring Tool Landmark Group Editor、`ideal_face_asset_v1` optional `landmarkGroups` export は実装済みですが、`expressionFollow v1` 実装、`beauty_filter_asset_v1` foundation、Color Processing、Layer System は未実装です。

### correctionProfile

`correctionProfile` は、理想顔へどれくらい寄せるかを表す shape correction 設定です。

```text
correctionProfile:
  理想顔へどれくらい寄せるかを表す shape correction 設定
  defaultStrength
  landmarkStrengths
  maxCorrectionDistance
  expressionFollow
  expressionAttenuation
```

`expressionFollow` は、`landmarkGroups` の group id を対象範囲として参照し、表情ごとに landmark が ideal へどれだけ追従するかを定義します。

例:

```text
mouthPucker が高い
  -> affectedLandmarkGroups: ["mouth"]
  -> mouth group 内の landmarkFollowStrengths で idealFollowStrength を下げる
  -> neutral ideal に戻しすぎず current / camera の表情を優先する
```

`correctionProfile` は個別パーツ加工命令セットではありません。current 478 landmarks と projected ideal 478 landmarks の差分に対して、どれくらい安全に寄せるかを決める設定です。

`expressionAttenuation` は既存 Engine foundation として残りますが、今後の中心仕様ではありません。`expressionAttenuation falloff v1` は、旧方針の group 境界の二値変化を滑らかにする fallback / 参考案として扱います。

### shapeWarpSettings

`shapeWarpSettings` は、Shape Warp の実行設定です。

```text
shapeWarpSettings:
  Shape Warp の実行設定
  本番候補は WebGL mesh warp
  meshWarpStrength
  temporalSmoothing
  boundary / mask / feather の設定候補
```

Production Shape Warp / Runtime renderer integration はまだ未実装です。現在の Studio Shape Warp v1 debug prototype と WebGL mesh warp v1 prototype は、Production Runtime renderer ではありません。

`shapeWarpSettings` はフィルターごとの公開設定であり、WebGL shader、renderer lifecycle、GPU resource 管理、fallback 実装などの Engine 内部実装は含めません。Engine 側は `shapeWarpSettings` を読み取り、実際の renderer / smoothing / boundary 処理を実行します。

### colorLayers

`colorLayers` は、色加工の layer 群です。

```text
colorLayers:
  美白
  skin smoothing
  brightness
  tone
  lip color
  cheek color
  shadow / highlight
  layer order
  opacity
  blend mode
  mask / feather / gradient
```

Layer System は shape warp 用ではなく、color processing 用です。`jaw_layer` で顎を削る、`eye_layer` で目を大きくする、`nose_layer` で鼻を細くする、のような使い方はしません。

## JSON イメージ

以下は将来像です。今回、実装・validator・export は行いません。

```json
{
  "schemaVersion": "beauty_filter_asset_v1",
  "id": "natural_beauty_soft_v1",
  "name": "Natural Beauty Soft",
  "version": "0.1.0",

  "idealFace": {
    "schemaVersion": "ideal_face_asset_v1",
    "id": "ideal_face_natural_v1",
    "name": "Natural IdealFace",
    "model": {
      "landmarkTopology": "mediapipe_face_landmarker_478",
      "coordinateSpace": "bae_ar_ideal_landmarks3d_v1",
      "idealLandmarks3D": []
    }
  },

  "landmarkGroups": {
    "schemaVersion": "landmark_groups_v1",
    "topology": "mediapipe_face_landmarker_478",
    "groups": [
      {
        "id": "mouth",
        "label": "Mouth",
        "indices": []
      },
      {
        "id": "left_eye",
        "label": "Left Eye",
        "indices": []
      },
      {
        "id": "right_eye",
        "label": "Right Eye",
        "indices": []
      },
      {
        "id": "face_boundary",
        "label": "Face Boundary",
        "indices": []
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
  },

  "shapeWarpSettings": {
    "schemaVersion": "shape_warp_settings_v1",
    "mode": "webgl_mesh",
    "meshWarpStrength": 1.0,
    "temporalSmoothing": {
      "enabled": true,
      "halfLifeMs": 80
    },
    "boundary": {
      "feather": 0.15
    }
  },

  "colorLayers": {
    "schemaVersion": "color_layers_v1",
    "layers": [
      {
        "id": "skin_whitening",
        "type": "whitening",
        "targetGroup": "skin",
        "opacity": 0.25,
        "blendMode": "soft_light",
        "order": 10,
        "mask": {
          "source": "landmark_group",
          "group": "skin",
          "feather": 0.2
        }
      },
      {
        "id": "lip_tint",
        "type": "color_tint",
        "targetGroup": "lip",
        "color": "#d86a78",
        "opacity": 0.18,
        "blendMode": "normal",
        "order": 30,
        "mask": {
          "source": "landmark_group",
          "group": "lip",
          "feather": 0.12
        }
      }
    ]
  }
}
```

## Engine / Authoring / Studio の責務

### Engine Runtime

```text
Engine Runtime:
  beauty_filter_asset_v1 を読み込む
  MediaPipe landmarks / blendshapes / pose を取得する
  IdealFace を現在姿勢へ Projection する
  current-vs-ideal difference を計算する
  expressionFollow を評価する
  既存 expressionAttenuation fallback を評価する
  smoothing された scale を計算する
  CorrectionPlan を生成する
  WebGL mesh warp を適用する
  LayerMask を生成する
  colorLayers を order 順に合成する
  temporal smoothing / stability control を行う
```

Engine Runtime は UI を持ちません。IdealFace 作成、landmarkGroups 編集、LayerMaskSpec 作成、Studio / Authoring 用 UI は Runtime に含めません。

### Beauty Studio

```text
Beauty Studio:
  Engine の公開 API 経由で filter asset の読み込み・状態確認を行う
  debug / overlay / Copy Debug / tuning UI を提供する
  Engine 内部実装へ直接依存しない
```

Studio は開発・検証・調整用です。本番配布対象には含めません。

### IdealFace Authoring Tool

```text
IdealFace Authoring Tool:
  idealFace を作成する
  landmarkGroups を作成・編集する
  correctionProfile を作成・編集する
  MP4 の neutral 3D 478 / expression 3D 478 比較から landmarkFollowStrengths を生成する
  shapeWarpSettings の一部を確認・調整する可能性がある
  beauty_filter_asset_v1 の shape 部分を export する可能性がある
```

2D 動画 / 複数画像から IdealFace を作る処理は、リアルタイム処理ではなく IdealFace Authoring Tool の責務です。
MP4 から expressionFollow 用の `landmarkFollowStrengths` を生成する処理も Authoring Tool の責務です。詳細は [MP4 expression 3D analysis plan](mp4-expression-3d-analysis-plan.md) に整理します。

### Layer Mask / Color Authoring Tool

```text
Layer Mask / Color Authoring Tool:
  skin / lip / cheek などの color layer target group を作る
  mask / feather / gradient / opacity / blendMode / layer order を編集する
  colorLayers を作成・編集する
```

Layer Mask / Color Authoring Tool は、shape warp 用の個別パーツ変形を作るツールではありません。色加工用の mask、layer、合成順を作るツールです。

## 段階的な進め方

以下の順番は厳密固定ではなく、段階的な目安です。

```text
Step 1: landmarkGroups v1 docs specification
  ideal_face_asset_v1 / beauty_filter_asset_v1 で使う group 定義を整理する
  -> 実装済み

Step 2: Engine landmarkGroups foundation
  asset の landmarkGroups を読み込み、expressionFollow / expressionAttenuation が参照できるようにする
  asset にない場合は Engine fallback group を使う
  -> 実装済み

Step 3: Authoring Tool landmark group editor
  IdealFace Authoring Tool で mouth / left_eye / right_eye / face_boundary を作成・編集できるようにする
  rectangle selection / index highlight / bulk add / bulk remove を含む
  -> prototype 実装済み

Step 4: expressionFollow v1 docs direction
  表情ごとの idealFollowStrength / landmarkFollowStrengths 方針を整理する
  MP4 の neutral 3D 478 / expression 3D 478 比較による自動生成方針を整理する
  -> 実装済み

Step 5: MP4 expression 3D analysis docs direction
  IdealFace Authoring Tool 側の frame grouping、3D 478 比較、landmarkFollowStrengths 自動生成方針を整理する
  -> 実装済み

Step 6: MP4 expression 3D analysis foundation
  Authoring Tool 側で analysis summary / JSON preview を生成する

Step 7: expressionFollow v1 foundation
  Engine 側で expressionFollow を読み込み、landmark ごとの idealFollowStrength を CorrectionPlan に反映する

Step 8: shapeWarpSettings v1 docs / foundation
  WebGL mesh warp / smoothing / boundary / debug 設定を整理する

Step 9: colorLayers v1 docs / foundation
  whitening / skin smoothing / lip tint / cheek tint / layer order / opacity / mask / gradient を整理する

Step 10: beauty_filter_asset_v1 foundation
  IdealFace + landmarkGroups + correctionProfile + shapeWarpSettings + colorLayers を束ねる asset を定義する
```

## 現在の実装との関係

現在実装済み:

- IdealFace / `idealLandmarks3D` 478点 Projection
- correctionProfile v1 foundation
- expressionAttenuation v1 foundation
- CorrectionPlan v1 debug foundation
- Studio Shape Warp debug prototype
- WebGL mesh warp v1 prototype
- landmarkGroups v1 asset schema implementation
- Engine landmarkGroups asset loading foundation
- Engine fallback group / asset group source handling
- Studio debug / Copy Debug landmarkGroups summary
- Authoring Tool Landmark Group Editor v1 prototype
- rectangle selection / index highlight / bulk add / bulk remove
- ideal_face_asset_v1 optional landmarkGroups export
- expressionAttenuation falloff v1 docs direction
- expressionFollow v1 docs direction
- MP4 expression 3D analysis plan docs direction

まだ未実装:

- expressionFollow v1 Engine implementation
- MP4 expression 3D analysis implementation
- landmarkFollowStrengths auto generation implementation
- expressionAttenuation falloff v1 fallback / reference handling
- shapeWarpSettings v1
- colorLayers v1
- beauty_filter_asset_v1
- beauty_filter_asset_v1 validator / parser / converter
- Production Shape Warp
- Production WebGL mesh warp / Runtime renderer integration
- Runtime renderer lifecycle / disposal / fallback
- mask / boundary / feather 本格対応
- glasses / hair handling
- temporal smoothing for production renderer
- Color Processing
- Layer System
- LayerMaskSpec

## 今回やらないこと

- TypeScript 実装
- Engine 実装
- Studio 実装
- Authoring Tool UI
- JSON export 変更
- validator 実装
- Color Processing 実装
- Layer System 実装
- Production Shape Warp 実装
- Runtime renderer integration
- WebGL mesh warp 修正
- mask / boundary / feather 実装
- expression-specific IdealFace
- expression target offset
