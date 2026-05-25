# landmarkGroups v1

## 目的

`landmarkGroups` は、MediaPipe landmark index 群に意味を与える定義です。

```text
landmarkGroups:
  MediaPipe landmark index 群に意味を与える定義
  mouth / left_eye / right_eye / face_boundary / skin / lip / cheek など
  expressionAttenuation や colorLayers が参照する
  Authoring Tool で将来編集できるようにする
```

これは個別パーツ加工命令ではありません。

```text
NG:
  eye group で目だけ大きくする
  jaw group で顎だけ削る
  nose group で鼻だけ細くする

OK:
  mouth group を jawOpen 時に弱める
  eye group を blink / squint 時に弱める
  skin group を colorLayers の mask 対象にする
  lip group を lip tint の対象にする
```

現在は `expressionAttenuation` v1 foundation が Engine 側に実装済みで、`mouth` / `left_eye` / `right_eye` / `face_boundary` などの group id を参照します。ただし、`landmarkGroups v1` の asset schema implementation、Engine landmarkGroups asset loading foundation、Authoring Tool landmark group editor は未実装です。このドキュメントは実装前の仕様整理です。

## JSON 仕様案

以下は `landmarkGroups` の配置と値の意味を示す例です。

```json
{
  "landmarkGroups": {
    "schemaVersion": "landmark_groups_v1",
    "topology": "mediapipe_face_landmarker_478",
    "groups": [
      {
        "id": "mouth",
        "label": "Mouth",
        "purpose": "expression_safety",
        "indices": [0, 13, 14, 17]
      },
      {
        "id": "left_eye",
        "label": "Left Eye",
        "purpose": "expression_safety",
        "indices": []
      },
      {
        "id": "right_eye",
        "label": "Right Eye",
        "purpose": "expression_safety",
        "indices": []
      },
      {
        "id": "face_boundary",
        "label": "Face Boundary",
        "purpose": "shape_boundary_safety",
        "indices": []
      },
      {
        "id": "skin",
        "label": "Skin",
        "purpose": "color_mask",
        "indices": []
      },
      {
        "id": "lip",
        "label": "Lip",
        "purpose": "color_mask",
        "indices": []
      },
      {
        "id": "cheek",
        "label": "Cheek",
        "purpose": "color_mask",
        "indices": []
      }
    ]
  }
}
```

上記の `indices` は例です。v1 の実 index は、Authoring Tool / Engine foundation 実装時に MediaPipe topology、Studio overlay、debug summary、実映像で検証しながら調整します。

## field の意味

```text
schemaVersion:
  landmark_groups_v1

topology:
  対象 landmark topology
  v1 では mediapipe_face_landmarker_478

groups:
  landmark group 定義の配列

group.id:
  group を参照するための安定した ID
  expressionAttenuation.affectedLandmarkGroups や colorLayers.targetGroup から参照される

group.label:
  UI 表示用の名前

group.purpose:
  主用途
  expression_safety / shape_boundary_safety / color_mask / debug など

group.indices:
  MediaPipe landmark index の配列
```

`group.id` は asset 内で安定した参照 ID として扱います。UI 表示名の変更や index 調整があっても、`expressionAttenuation` / `colorLayers` から参照される ID は簡単に変えない方針です。

## v1 の group 候補

### shape / expression safety 用

```text
mouth:
  口を開けたとき、唇・口内・歯まわりの破綻を抑えるために使う

left_eye:
  左目のまばたき、目細め、黒目・白目・まぶた周辺の破綻を抑えるために使う

right_eye:
  右目のまばたき、目細め、黒目・白目・まぶた周辺の破綻を抑えるために使う

face_boundary:
  顔外周、背景、髪、眼鏡境界などの破綻を抑えるために使う
```

### color processing 用の将来候補

```text
skin:
  美白、肌補正、skin smoothing などの対象

lip:
  lip tint / lip color などの対象

cheek:
  cheek tint / blush などの対象

eye_area:
  目周辺の明るさ、くすみ補正などの対象
```

`skin` / `lip` / `cheek` / `eye_area` は、現時点では Color Processing / Layer System が未実装なので将来候補として扱います。

## expressionAttenuation との関係

`expressionAttenuation` は、`affectedLandmarkGroups` で `landmarkGroups.groups[].id` を参照します。

```json
{
  "id": "jaw_open_reduce_mouth",
  "blendshape": "jawOpen",
  "affectedLandmarkGroups": ["mouth"],
  "inputRange": [0.15, 0.6],
  "strengthScaleRange": [1.0, 0.2]
}
```

意味:

```text
jawOpen が高い
  -> mouth group の strengthScale を下げる
  -> mouth group に含まれる landmark の finalStrength を弱める
```

`expressionAttenuation` は group id を参照するだけです。group の index 定義自体は `landmarkGroups` が持ちます。

## colorLayers との関係

将来の `colorLayers` は、`targetGroup` や `mask.group` で `landmarkGroups.groups[].id` を参照します。

```json
{
  "id": "lip_tint",
  "type": "color_tint",
  "targetGroup": "lip",
  "opacity": 0.18,
  "blendMode": "normal",
  "order": 30,
  "mask": {
    "source": "landmark_group",
    "group": "lip",
    "feather": 0.12
  }
}
```

意味:

```text
lip group に含まれる landmark から mask を作り、
その領域に lip tint を適用する
```

Layer System は shape warp 用ではなく color processing 用です。`landmarkGroups` は color mask の対象領域を表すためにも使いますが、変形加工の個別パーツ命令としては使いません。

## beauty_filter_asset_v1 との関係

最終的には、`landmarkGroups` は `beauty_filter_asset_v1` の top-level section として持つ方針です。

```text
beauty_filter_asset_v1
  ├─ idealFace
  ├─ landmarkGroups
  ├─ correctionProfile
  ├─ shapeWarpSettings
  └─ colorLayers
```

理由:

```text
- correctionProfile.expressionAttenuation が参照する group の整合性を保つため
- colorLayers が参照する group の整合性を保つため
- IdealFace と group 定義の対応を保つため
- 1つの filter asset 内で shape / color の参照を完結させるため
```

ただし、`beauty_filter_asset_v1` foundation はまだ未実装です。

## ideal_face_asset_v1 との関係

移行段階では、`ideal_face_asset_v1` に optional top-level `landmarkGroups` を持たせる可能性があります。

理由:

```text
- 現在の Authoring Tool は ideal_face_asset_v1 を export している
- beauty_filter_asset_v1 foundation はまだ未実装
- 先に IdealFace Authoring Tool 側で group editor を作る場合、ideal_face_asset_v1 に group を含める方が段階的に進めやすい
```

将来:

```text
- beauty_filter_asset_v1 が導入されたら、landmarkGroups は beauty_filter_asset_v1 の section として扱う
- ideal_face_asset_v1 内の landmarkGroups は移行用 / shape 部分 export 用として扱う可能性がある
```

## Engine fallback 方針

将来の Engine landmarkGroups foundation では、asset に `landmarkGroups` がある場合は asset group を優先します。asset に `landmarkGroups` がない場合は、Engine fallback group を使います。

```text
group source:
  asset | fallback
```

debug / Copy Debug では、どちらの group source を使っているか分かるようにします。

```text
landmarkGroups:
  source: asset
  schemaVersion: landmark_groups_v1
  topology: mediapipe_face_landmarker_478
  group count: 4
```

または:

```text
landmarkGroups:
  source: fallback
  reason: asset has no landmarkGroups
```

現在の `expressionAttenuation` v1 foundation は Engine fallback group を前提に動きます。asset 由来の `landmarkGroups` 読み込みは未実装です。

## validation 方針

将来の validator 実装では、以下を検証します。

- `landmarkGroups` は optional
- 存在する場合、`schemaVersion` は `"landmark_groups_v1"`
- `topology` は `"mediapipe_face_landmarker_478"`
- `groups` は配列
- `group.id` は空でない string
- `group.id` は重複しない
- `group.label` は string
- `group.purpose` は許可値または string
- `group.indices` は配列
- `indices` の各値は 0〜477 の整数
- `indices` は group 内で重複しない
- `expressionAttenuation.affectedLandmarkGroups` が参照する group id は存在すること
- 将来の `colorLayers.targetGroup` / `colorLayers.mask.group` が参照する group id は存在すること

`colorLayers` はまだ未実装なので、`colorLayers` 側の参照 validation は将来方針です。

## Authoring Tool との関係

将来、IdealFace Authoring Tool または Beauty Filter Authoring Tool に Landmark Group Editor を追加します。

```text
Landmark Group Editor:
  - 478点 overlay を表示する
  - group を選ぶ
  - 点をクリックして group に追加 / 削除する
  - 選択中 group の点を色付き表示する
  - group count / indices を確認する
  - JSON preview に landmarkGroups を出す
```

最初に対象とする group:

```text
mouth
left_eye
right_eye
face_boundary
```

将来 Color Layers Editor と連携する group:

```text
skin
lip
cheek
eye_area
```

`Landmark Group Editor` は、個別パーツ加工を作る画面ではありません。expression safety / color mask のための index group を作る画面です。

## UI / tool 名の整理

最終的な Authoring Tool は、1つの Beauty Filter Authoring Tool の中に複数モジュールを持つ方向です。

```text
Beauty Filter Authoring Tool
  ├─ IdealFace Editor
  ├─ Landmark Group Editor
  ├─ Correction Profile Editor
  ├─ Shape Warp Settings Editor
  ├─ Color Layers Editor
  └─ Export / Validate
```

ただし、現時点では `tools/ideal-face-authoring` をすぐにリネームしません。

段階的に:

```text
1. tools/ideal-face-authoring に landmarkGroups docs / export 方針を追加する
2. 必要に応じて Landmark Group Editor を追加する
3. beauty_filter_asset_v1 foundation が見えてきたら Beauty Filter Authoring Tool への統合 / 改名を検討する
```

## 今回やらないこと

- TypeScript 実装
- Engine 実装
- Studio 実装
- Authoring Tool UI
- JSON export 変更
- validator 実装
- `beauty_filter_asset_v1` foundation
- Color Processing 実装
- Layer System 実装
- Production Shape Warp 実装
- Runtime renderer integration
