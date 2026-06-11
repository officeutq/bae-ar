# Ideal OBJ Render Warp Lab

## 目的

`tools/ideal-obj-render-warp-lab` は、FaceBuilder + Blender sculpt で作成した `テスト.obj` のような OBJ 3D 形状ファイルを、BAE AR の neutral ideal head（無表情基準の理想頭部）候補として使えるか検証する debug / research lab です。

日本語名は「理想OBJレンダー・ワープ検証ラボ」とします。より目的を明確にする別名として `tools/ideal-clay-head-render-warp-lab` / 「理想粘土頭部レンダー・ワープ検証ラボ」も候補ですが、この docs では `tools/ideal-obj-render-warp-lab` を仮称として扱います。

このラボは production 用 authoring tool ではありません。Engine Runtime、Beauty Studio、IdealFace Authoring Tool、Runtime renderer、production asset export へ直接接続しません。まずは、OBJ を current pose で render した画像から MediaPipe returned 478 landmarks を取得できるか、その 478点を既存の mesh warp 検証ラインへ接続できるかを確認する場です。

## 背景

`tools/ideal-reference-mesh-warp-lab` では、理想モデル動画を MediaPipe に通して `rawIdealReferenceFrames` を作り、live current frame に近い top1 reference を選び、`candidateAlignedIdealLandmarks` を作っていました。

しかし、同じ動画を model video と live video の両方に使っても、top1 reference matching は完全に同じ時刻のフレームを選ばず、pose が数度ズレることが分かりました。そのため、reference frame matching で選んだ 2D landmarks をそのまま target にする方式は、自然美顔の本線として危険です。

一方で、`ideal-reference-mesh-warp-lab` の以下の成果は有用です。

- live video / current frame MediaPipe analysis
- `current478` / pose / expression
- visible / safe current landmarks
- dynamic nearFaceGrid
- backgroundGrid
- screenEdgeAnchors
- current source vertices
- ideal target vertices
- triangle indices
- WebGL mesh warp preview
- mesh pair preview
- image-normalized coordinate
- aspect-corrected image coordinate
- `displayedContentRect` を使った overlay 変換

`tools/ideal-obj-render-warp-lab` では、これらの座標系・メッシュ生成・WebGL mesh warp を踏襲し、理想側 landmarks の供給元だけを差し替えます。

## 基本方針

最重要方針は、座標系を新設しないことです。

`ideal-reference-mesh-warp-lab` と同じ coordinate lifecycle を使います。

current478:

```text
live video
  -> MediaPipe
  -> current478
  -> image-normalized coordinate
```

renderedIdeal478:

```text
OBJ
  -> current yaw / pitch / roll で render
  -> rendered ideal image
  -> MediaPipe
  -> renderedIdeal478
  -> image-normalized coordinate
```

## p,P dataset と renderAppearanceProfile

現在のラボの主な役割は、OBJ を複数の `renderPose p` でレンダーし、その画像を
MediaPipe に通して `P = MediaPipe returnedPose` を取得し、p,P dataset JSON として
ダウンロードすることです。統計要約、関数推定、model tree / regression / KNN 比較、
`poseMappingProfile` 候補作成は Google Colab / Python 側で行います。

MediaPipe が見ているのは OBJ の 3D 形状そのものではなく、レンダリングされた 2D 画像です。
そのため、p,P mapping は光、影、背景色、顔色、FOV、scale / crop、canvas 解像度に依存します。
ラボでは `renderAppearanceProfile` を選択し、同じ pose sampling に対して見た目条件だけを
変えた dataset を取り直せるようにします。

dataset JSON には、選択した profile id だけでなく、実際に適用した
`backgroundColor`、`skinColor`、`material`、`lighting`、`camera`、`renderResolution` を
`renderAppearance.applied` として保存します。Canvas2D renderer でまだ物理的に実装していない
specular、cast shadow、perspective projection、FOV は `implementation` notes に未実装として
記録し、解析側で適用済み条件と誤解しないようにします。

初期 profile:

- `current`: 既存レンダー条件の baseline
- `soft_light_no_shadow`: 影なし・柔らかい光
- `camera_soft_light`: カメラ正面固定ライト
- `high_contrast_background`: 背景コントラスト確認
- `yaw_edge_friendly`: 横向き輪郭補助
- `stable_crop_fov`: 安定した顔サイズ・視野角

alignment では、aspect-corrected image coordinate を使います。

```text
x' = x * videoAspectRatio
y' = y
```

bounds、center、uniform scale、distance、large displacement は aspect-corrected image coordinate で計算します。alignment 後の `candidateAlignedIdealLandmarks` は image-normalized coordinate として mesh pair / overlay / WebGL mesh warp 入力へ戻します。

overlay は以下の変換で行います。

```text
image-normalized coordinate
  -> displayedContentRect pixel
```

pixel coordinate、OBJ vertex coordinate、WebGL clip space は、MediaPipe returned landmarks 取得後の alignment / mesh pair 処理には混ぜません。render image の pixel coordinate は MediaPipe 入力用に閉じ込めます。MediaPipe から戻ってきた `renderedIdeal478` は image-normalized coordinate として扱います。

## 既存ラボから踏襲するもの

`ideal-reference-mesh-warp-lab` から以下を踏襲します。

- live video input
- current frame MediaPipe analysis
- current478 overlay
- pose / expression / quality debug
- visible / safe current landmarks
- iris landmarks 468..477 の除外または current 固定
- `faceMedianNearestDistance`
- dynamic nearFaceGrid
- backgroundGrid
- screenEdgeAnchors
- current source vertices
- ideal target vertices
- triangle indices
- mesh pair preview
- WebGL mesh warp preview
- summary / raw debug
- `displayedContentRect` を使った overlay 変換

## 差し替える核

旧方式:

```text
model video
  -> MediaPipe scan
  -> rawIdealReferenceFrames
  -> accepted / excluded frame 管理
  -> top1 reference matching
  -> candidateAlignedIdealLandmarks
```

新方式:

```text
OBJ
  -> current yaw / pitch / roll で render
  -> rendered ideal image
  -> MediaPipe analysis
  -> renderedIdeal478
  -> candidateAlignedIdealLandmarks
```

top1 reference matching は使いません。current pose で render した OBJ を理想側の 1 フレームとして扱い、MediaPipe が返した `renderedIdeal478` を `rawIdealReferenceFrame` 相当の入力にします。

## 処理フロー

想定フローは以下です。

```text
1. live video / camera
   -> MediaPipe
   -> current478
   -> yaw / pitch / roll
   -> expression
   -> quality

2. current478 から visible / safe landmarks を選ぶ

3. visible / safe landmarks + dynamic nearFaceGrid + backgroundGrid + screenEdgeAnchors で
   current source mesh を作る

4. OBJ file を読み込む

5. OBJ を current yaw / pitch / roll で render する

6. rendered ideal image を MediaPipe に通す
   -> renderedIdeal478

7. renderedIdeal478 を current478 へ alignment する
   -> candidateAlignedIdealLandmarks

8. current source mesh と同じ頂点構成で ideal target mesh を作る

9. triangle indices を作る

10. WebGL mesh warp で加工する

11. warped preview を表示する
```

## 表情部分の初期ルール

`テスト.obj` は neutral であり、カメラ映像と同じ表情を持ちません。そのため、初期ラボでは expression-sensitive landmarks は current をそのまま使います。

基本ルール:

```text
if landmark is expressionSensitive:
  target = current
else:
  target = lerp(current, alignedRenderedIdeal, usageWeight)
```

意味:

```text
口・目・虹彩など、表情で大きく動く点はカメラ映像を優先する。
顔の土台・輪郭・頬・鼻・額など、表情影響が比較的小さい点だけ理想OBJ方向へ寄せる。
```

初期の current 固定候補:

- mouth
- lips
- inner mouth
- left_eye
- right_eye
- eyelids
- iris 468..477
- jawOpen で大きく動く下口周辺

chin や jaw side は判断が難しいため、初期は弱く寄せるか、current 固定寄りで安全側に倒します。

これは `expressionFollow v1` の正式実装ではなく、Lab 内の debug rule として扱います。`expressionFollow v1` の schema、Engine 実装、Authoring Tool export へは入れません。

## Target vertices 生成ルール

ideal target vertices は、`ideal-reference-mesh-warp-lab` と同じく、source vertices と同じ頂点数・同じ順番で作ります。

```text
sourceVertices[i] と targetVertices[i] は必ず対応する
```

target rule:

```text
faceLandmark:
  if expressionSensitive:
    target = current
  else:
    target = lerp(current, candidateAlignedIdealLandmarks[index], usageWeight)

nearFaceGrid:
  target = source
  または後続検証で弱く face boundary に追従

backgroundGrid:
  target = source

screenEdgeAnchor:
  target = source
```

初期版では nearFaceGrid / backgroundGrid / screenEdgeAnchor は source = target を基本にします。

## 最初の成功判定

最初に確認することは、OBJ を current yaw / pitch / roll で render した画像を MediaPipe が顔として検出できるかです。

確認項目:

- `renderDetectionSuccess`
- `returnedLandmarkCount`
- renderedIdeal478 overlay
- renderedIdeal pose
- current pose と renderedIdeal pose の差
- `candidateAlignedIdealLandmarks` の bounds / center / scale
- meshPairPreview で current と target が破綻していないか
- expressionSensitive landmarks が current 固定になっているか
- 口・目が無表情 OBJ 側へ引っ張られていないか
- WebGL mesh warp preview で顔全体が自然に少しだけ寄るか

## 実装単位案

今回は docs のみで、実装コードは変更しません。後続の実装単位案は以下です。

PR1:

```text
tools/ideal-obj-render-warp-lab を追加
ideal-reference-mesh-warp-lab をベースにする
model video scan / reference library / top1 matching を削る
OBJ input / OBJ render / renderedIdeal MediaPipe analysis を追加
renderedIdeal478 overlay まで確認
```

PR2:

```text
renderedIdeal478 を current478 へ alignment
candidateAlignedIdealLandmarks として扱う
mesh pair preview を表示
```

PR3:

```text
expressionSensitive current固定 rule を入れる
finalSourceVertices / finalTargetVertices を作る
triangle indices を作る
WebGL mesh warp preview へ接続
```

## Non-goals

このラボでは以下を行いません。

- Engine Runtime への OBJ render 実装
- Engine Runtime への MediaPipe re-detection 実装
- Beauty Studio への接続
- IdealFace Authoring Tool への接続
- Layer Mask Authoring Tool への接続
- production asset export
- `expressionFollow v1` の正式実装
- OBJ vertex coordinate と MediaPipe image-normalized coordinate の混在
- render image pixel coordinate を alignment / mesh pair 処理へ持ち込むこと
- Runtime / Studio / Authoring Tool 本線への接続

## 関連ドキュメント

- [Ideal Reference Mesh Warp Lab](ideal-reference-mesh-warp-lab.md)
- [Ideal Reference Coordinate Lifecycle Investigation](ideal-reference-coordinate-lifecycle-investigation.md)
- [Shape Warp production direction](shape-warp-production-direction.md)
- [アーキテクチャ](architecture.md)
- [リポジトリ構成](repository-structure.md)
