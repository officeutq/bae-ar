# Ideal Reference Mesh Warp Lab

## 目的

`tools/ideal-reference-mesh-warp-lab` は、理想モデル動画から作る実測 MediaPipe 478 reference library と、ライブ動画を current face 代わりにした matching / mesh prototype 検証のための debug / research lab です。

このラボは production 用 authoring tool ではありません。Engine Runtime、Beauty Studio、IdealFace Authoring Tool、Runtime renderer へ直接統合する前に、reference library、top1 matching、current / ideal mesh vertex 対応の成立性を確認する場所です。

## 現在の本線

現在の本線は以下です。

```text
model video
  -> MediaPipe scan
  -> rawIdealReferenceFrames
  -> accepted / excluded frame 管理
  -> accepted frame review
  -> 478点 overlay

live video
  -> current frame MediaPipe analysis
  -> current478 / pose / expression
  -> current478 overlay

current
  -> accepted raw ideal reference frames から top1 reference matching
  -> candidateAlignedIdealLandmarks 作成
  -> visible / safe current landmarks 選択
  -> current mesh source vertices 作成
  -> ideal mesh target vertices 作成
  -> mesh pair overlay / summary 確認
  -> source vertices 基準の triangle indices 作成
  -> triangle wireframe overlay / quality debug 確認
```

`candidateAlignedIdealLandmarks` は最終 target ではありません。top1 ideal reference を current face へ位置合わせした候補であり、source 側で採用された current landmark index に対応する ideal candidate としてだけ使います。

## Current Mesh Source

current mesh source は、`currentLiveFrameAnalysis.landmarks478` から見えている / 安全な landmark を選び、それに dynamic grid / anchors を加えて作ります。Ideal Reference Mesh Warp Lab の grid / anchors は、fixed grid / anchors から dynamic grid prototype に進みました。

```text
currentLiveFrameAnalysis.landmarks478
  -> invalid x/y を除外
  -> pose から hidden side らしい boundary / cheek / jaw 側を弱める
  -> face boundary を弱める
  -> mouth / eyes は表情時に弱める
  -> current -> candidateAlignedIdeal の距離が大きすぎる点を弱める
  -> usageWeight が低すぎる点は source から除外
  -> accepted current landmarks から faceMedianNearestDistance を計算
  -> faceMedianNearestDistance を基準に nearFaceGridSpacing / backgroundGridSpacing / screenEdgeAnchorSpacing を決める
  -> accepted current landmarks + dynamic near-face grid + dynamic background grid + screen edge anchors
```

初期実装の visibility / safety は簡易 rule based です。後で `visibilityWeight` / `warpSafetyWeight` に差し替えられるよう、`CurrentMeshLandmarkVertex` に `visibilityWeight`、`safetyWeight`、`usageWeight`、`reasons` を持たせます。

dynamic grid は、採用済み current face landmarks の nearest neighbor distance を aspect-corrected image coordinate でサンプル計算し、その中央値を `faceMedianNearestDistance` として使います。near-face grid は `faceMedianNearestDistance * 1.5` を基準に細かめ、background grid は `faceMedianNearestDistance * 4.0` を基準に粗め、screen edge anchors は background grid と同程度の間隔で作ります。極端に細かくなりすぎないよう、near-face / background spacing は clamp します。

near-face grid は current face bounds を 20% 程度 expand した顔周辺領域に置きます。顔内部に入りすぎる点は簡易 bounds 判定で除外し、顔に近い背景を支える点だけを `nearFaceGrid` として残します。background grid は画面全体に置きますが、near-face region と画面端を避けます。画面四隅と辺上は `screenEdgeAnchor` として固定し、source = target のまま扱います。

## Ideal Mesh Target

ideal mesh target は current mesh source vertices と同じ頂点数・同じ順番で作ります。

```text
sourceVertices[i] と targetVertices[i] は必ず対応する
```

target rule:

- `faceLandmark`: source 側で採用された landmark index と同じ index の `candidateAlignedIdealLandmarks` を使う
- `nearFaceGrid`: source と同じ位置
- `backgroundGrid`: source と同じ位置
- `screenEdgeAnchor`: source と同じ位置

`faceLandmark` は `target = lerp(current, candidateAlignedIdeal, usageWeight)` として、簡易 safety weight を反映します。478点すべてに target を作る流れには戻しません。

## Overlay / Summary

live preview overlay では以下を確認できます。

- 採用された current landmark
- 除外された current landmark
- 採用された current landmark に対応する ideal target
- current -> ideal target の対応線
- near-face grid
- background grid
- screen edge anchors

grid / anchors overlay は source / target で色分けします。`grid / anchorsを表示` は親スイッチであり、`mesh sourceを表示` が OFF の場合は source grid / anchors を表示せず、`mesh targetを表示` が OFF の場合は target grid / anchors を表示しません。

Summary / Warp Mesh debug では以下を確認します。

- `gridMode`
- `acceptedFaceLandmarkCount`
- `faceMedianNearestDistance`
- `faceNearestDistanceSampleCount`
- `nearFaceGridSpacing`
- `backgroundGridSpacing`
- `screenEdgeAnchorSpacing`
- `nearFaceGridSpacingRatioToFaceMedian`
- `backgroundGridSpacingRatioToFaceMedian`
- `top1MatchedReferenceId`
- `currentLandmarkCount`
- `visibleCurrentLandmarkCount`
- `excludedCurrentLandmarkCount`
- `faceSourceVertexCount`
- `nearFaceGridCount`
- `backgroundGridCount`
- `screenEdgeAnchorCount`
- `meshPairCount`
- `usageWeight` average / min / max
- `boundarySuppressedCount`
- `mouthSuppressedCount`
- `eyeSuppressedCount`
- `largeDisplacementSuppressedCount`
- `invalidExcludedCount`
- `faceBounds`
- `expandedNearFaceBounds`
- `videoAspectRatio`
- `gridAnchorDisplay.showSourceGrid`
- `gridAnchorDisplay.showTargetGrid`

Raw debug は巨大配列を出さず、`dynamicGrid.gridPointPreview`、`candidateAlignedIdealLandmarkPreview`、`acceptedCurrentLandmarkPreview`、`excludedCurrentLandmarkPreview`、`meshPairPreview`、`trianglePreview` の sample だけを出します。

## Triangle Indices Prototype

Ideal Reference Mesh Warp Lab は dynamic grid prototype の次に、vertices から triangle indices を作る prototype に進みました。

triangle indices は current mesh source vertices の位置を基準に作ります。texture を読む座標は source 側で決まるためです。source mesh と target mesh は同じ頂点数・同じ順番で作られている前提なので、同じ triangle indices を共通に使います。

```text
triangle index [a, b, c]

source triangle:
  sourceVertices[a], sourceVertices[b], sourceVertices[c]

target triangle:
  targetVertices[a], targetVertices[b], targetVertices[c]
```

初期 prototype では、外部ライブラリを追加せず、Lab 内の簡易 Delaunay triangulation で triangle indices を作ります。triangle quality は aspect-corrected image coordinate で評価します。

```text
x' = x * videoAspectRatio
y' = y
```

評価する値:

- triangleArea
- edgeLength
- aspectRatio
- isLongThin
- isLarge
- isDegenerate
- faceToFarBackgroundTriangle

triangle kind は、含まれる vertex kind から `faceOnly`、`faceToNearGrid`、`nearGridOnly`、`nearToBackground`、`backgroundOnly`、`edgeAnchor`、`mixed` に分類します。

危険な triangle は warning として数えます。特に `faceLandmark` と `backgroundGrid` / `screenEdgeAnchor` が直接つながる triangle と、面積が小さすぎる degenerate triangle は triangle indices から除外します。理想の接続は、`faceLandmark -> nearFaceGrid -> backgroundGrid -> screenEdgeAnchor` の段階的な接続です。

live overlay では `triangle meshを表示` toggle を追加し、`mesh sourceを表示` と組み合わせて source triangle wireframe、`mesh targetを表示` と組み合わせて target triangle wireframe を表示します。

Summary / Warp Mesh debug では `triangleMode`、`vertexCount`、`triangleCount`、`validTriangleCount`、`warningTriangleCount`、`excludedTriangleCount`、`triangleKindCounts`、`triangleQuality`、`triangleArea`、`triangleAspectRatio` を確認します。Raw debug は巨大配列を出さず、`trianglePreview` sample のみに留めます。

現時点では triangle wireframe overlay と Summary / Warp Mesh / Raw debug による確認までで、WebGL mesh warp はまだ行いません。

## 本線から外したもの

PR5 以降で試した以下は本線から外しています。

- `alignedIdeal` 478点を最終 target として扱う処理
- current -> aligned ideal の 478点全体 displacement debug
- raw displacement mesh warp
- `rawWarpOnly` / `sideBySide` preview
- texture upload flip / texture V formula UI
- raw warp coordinate debug
- sample vertex debug
- WebGL raw warp renderer helper

## 今回まだ行わないこと

- WebGL warp
- production mesh warp
- topK weighted blend
- temporal smoothing
- IndexedDB / localStorage 保存
- JSON export / import
- Runtime / Engine 変更
- Beauty Studio 変更
- IdealFace Authoring Tool 変更

## 関連ドキュメント

- [概要](overview.md)
- [開発フロー](development-flow.md)
- [Repository structure](repository-structure.md)
- [Shape Warp production direction](shape-warp-production-direction.md)

## aspect-corrected image coordinate

Ideal Reference Mesh Warp Lab では、MediaPipe returned landmarks の `x` / `y` は
image-normalized coordinate として保存する。`x` は画像幅、`y` は画像高さを
0..1 に正規化した値であり、保存値や overlay / mesh pair 表示用の座標はこの
image-normalized coordinate のまま扱う。

一方で、bounds / center / uniform scale / distance / large displacement 判定のように
`x` と `y` を同じ距離単位として比較する処理では、aspect-corrected image coordinate
を使う。

```text
aspect-corrected image coordinate
  x' = x * videoAspectRatio
  y' = y
```

`candidateAlignedIdealLandmarks` の alignment は aspect-corrected coordinate 上で行う。
top1 raw ideal reference landmarks と current landmarks の bounds / center を横縦比補正後
の座標で計算し、x/y 別々の scale ではなく uniform scale を使う。alignment 結果は
image-normalized coordinate に戻してから、overlay / mesh pair / ideal mesh target
候補として使う。

large displacement 判定も aspect-corrected distance を使う。横長動画で x 方向の移動量を
過小評価しないため、`dx = (target.x - source.x) * videoAspectRatio`、`dy = target.y - source.y`
として距離を計算する。Raw debug / Warp Mesh debug には normalized bounds と
aspect-corrected bounds の両方を出し、mesh target が縦長に見える場合にどの段階の
bounds aspect が崩れているかを確認できるようにする。

overlay 表示は aspect-corrected coordinate を直接描画しない。従来どおり
image-normalized coordinate を `displayedContentRect` の pixel coordinate に変換して描画する。
これは過去の Render Consistency Lab / Rotation Fit 系で使っていた横縦比補正の方針を、
Ideal Reference Mesh Warp Lab の current / ideal mesh prototype に反映するもの。

## nearFaceGrid 顔内部除外方式

Ideal Reference Mesh Warp Lab の `nearFaceGrid` は、`expandedNearFaceBounds` の内部全体を `nearFaceGridSpacing` の grid で一度埋めた後、顔内部に入る grid point を除外する方式に変更した。

顔内部判定には、採用済みの visible / safe current landmarks だけから作る `face-only triangle indices` を使う。これは `nearFaceGrid` 生成時に grid point が顔内部へ入っているかを判定するための補助データであり、最終描画用の triangle mesh ではない。

判定は aspect-corrected image coordinate で行う。

```text
x' = x * videoAspectRatio
y' = y
```

`nearFaceGrid` の生成順序は以下とする。

```text
accepted current face landmarks
  -> face-only triangle indices を作る
  -> expandedNearFaceBounds 内を grid で埋める
  -> face-only triangle indices による face interior 判定で顔内部 grid point を除外
  -> 顔ランドマークに近すぎる grid point を弱めの threshold で除外
  -> 残った点を nearFaceGrid として採用
```

visible / safe current landmarks の選択方針は既存の本線を維持する。invalid x/y、hidden side、face boundary、mouth / eyes、large displacement、usageWeight による抑制と除外を行った後、その採用済み current face landmarks を `nearFaceGrid` の顔内部判定にも使う。

final triangle indices は、`faceLandmark` / `nearFaceGrid` / `backgroundGrid` / `screenEdgeAnchor` を含む source vertices から別途作る。source mesh と target mesh では、この final triangle indices を共通に使う。

この段階では WebGL mesh warp、texture upload、shader、production mesh warp はまだ行わない。
