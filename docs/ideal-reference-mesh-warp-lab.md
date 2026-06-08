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
```

`candidateAlignedIdealLandmarks` は最終 target ではありません。top1 ideal reference を current face へ位置合わせした候補であり、source 側で採用された current landmark index に対応する ideal candidate としてだけ使います。

## Current Mesh Source

current mesh source は、`currentLiveFrameAnalysis.landmarks478` から見えている / 安全な landmark を選び、それに fixed grid / anchors を加えて作ります。

```text
currentLiveFrameAnalysis.landmarks478
  -> invalid x/y を除外
  -> pose から hidden side らしい boundary / cheek / jaw 側を弱める
  -> face boundary を弱める
  -> mouth / eyes は表情時に弱める
  -> current -> candidateAlignedIdeal の距離が大きすぎる点を弱める
  -> usageWeight が低すぎる点は source から除外
  -> accepted current landmarks + near-face grid + background grid + screen edge anchors
```

初期実装の visibility / safety は簡易 rule based です。後で `visibilityWeight` / `warpSafetyWeight` に差し替えられるよう、`CurrentMeshLandmarkVertex` に `visibilityWeight`、`safetyWeight`、`usageWeight`、`reasons` を持たせます。

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
- `gridAnchorDisplay.showSourceGrid`
- `gridAnchorDisplay.showTargetGrid`

Raw debug は巨大配列を出さず、`candidateAlignedIdealLandmarkPreview`、`acceptedCurrentLandmarkPreview`、`excludedCurrentLandmarkPreview`、`meshPairPreview` の sample だけを出します。

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
