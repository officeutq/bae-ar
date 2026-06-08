# Ideal Reference Coordinate Lifecycle Investigation

## 調査目的

`tools/ideal-reference-mesh-warp-lab` について、モデル動画解析から raw warp 表示までに流れる各データが、どの座標系で生成、保存、変換、表示されているかを実コードから棚卸しする。

今回は修正実装は行わず、以下の経路を確認した。

- `tools/ideal-reference-mesh-warp-lab/src/main.ts`
- `tools/ideal-reference-mesh-warp-lab/src/style.css`
- `docs/overview.md`
- `docs/development-flow.md`
- `docs/repository-structure.md`
- `docs/ideal-reference-mesh-warp-lab.md`
- `docs/ideal-reference-raw-warp-coordinate-investigation.md`
- `docs/shape-warp-production-direction.md`
- `packages/engine/src/face/mediapipeFaceMeshTopology.ts`
- `apps/studio/src/main.ts`

`apps/studio/src/main.ts` は比較参考として確認した。今回の正は `Ideal Reference Mesh Warp Lab` の現コードと既存 docs の座標系方針とする。

## 既存 docs 上の座標系方針

既存 docs では、Projection / Shape Warp / WebGL mesh warp の座標系を主に以下へ分けている。

```text
same-unit coordinate:
  IdealFace / idealLandmarks3D の内部基準
  WebGL mesh warp へ直接渡さない

image-normalized coordinate:
  MediaPipe current landmarks
  projected ideal imageLandmarks
  current-vs-ideal difference
  WebGL mesh warp の source / target vertices の元データ
  x / y は 0..1

pixel coordinate:
  canvas / video frame 上の描画・画像変形用

clip space:
  WebGL position attribute 用
  x / y は -1..1
```

`Ideal Reference Mesh Warp Lab` は `IdealFace 3D478` を使わず、理想モデル動画の実測 MediaPipe 478 landmarks を reference library として使う。そのため、この lab では `same-unit coordinate` は実質登場しない。model reference と live current はどちらも MediaPipe returned landmarks 由来の `image-normalized coordinate` として扱われる。

## 全体フロー

```text
model video file
  -> handleVideoFileSelection("model")
  -> syncMetadata("model")
  -> scanModelVideo()
  -> FaceLandmarker.detectForVideo(modelVideoElement, model timestamp)
  -> buildReferenceFrame()
  -> rawIdealReferenceFrames[]
  -> accepted / excluded frame counters
  -> model accepted frame review overlay

live video file
  -> handleVideoFileSelection("live")
  -> syncMetadata("live")
  -> analyzeCurrentLiveFrame()
  -> FaceLandmarker.detectForVideo(liveVideoElement, live timestamp)
  -> buildCurrentLiveFrameAnalysis()
  -> currentLiveFrameAnalysis
  -> updateTop1Match()
  -> updateDisplacementDebug()
  -> drawLiveOverlay()
  -> drawRawWarpPreview()
  -> buildRawWarpFrame()
  -> drawRawWarpWebglFrame()
```

現コードでは、要求文の `handleModelVideoFile()` / `handleLiveVideoFile()` 相当は `handleVideoFileSelection("model" | "live", file)` に統合されている。`analyzeModelFrame` 相当は `scanModelVideo()` 内の `detectForVideo()` と `buildReferenceFrame()` で行われている。

## Step 1: モデル動画読み込み

- 入力: model video の `File`
- 出力: `objectUrl` と video metadata
- 保存先 state: `state.modelVideo`
- 入力座標系: なし。ファイルと HTMLVideoElement の metadata
- 出力座標系: なし。`width` / `height` は video intrinsic pixel size
- 変換式または変換 helper: `URL.createObjectURL(file)`, `syncMetadata("model")`
- その座標系で保存してよい理由: metadata は描画時の aspect ratio と scan 時刻管理に使うだけで、landmarks ではない
- 注意点: `state.modelVideo.width` / `height` は pixel size だが、landmarks 保存には使われない

確認した経路:

```ts
handleVideoFileSelection("model", file)
  -> state.modelVideo.objectUrl = URL.createObjectURL(file)
  -> modelVideoElement.src = objectUrl
  -> syncMetadata("model")
```

## Step 2: モデル動画 MediaPipe 解析

- 入力: `modelVideoElement` の現在フレーム
- 出力: `FaceLandmarker.detectForVideo()` の result
- 保存先 state: この段階では直接保存せず、`buildReferenceFrame()` に渡す
- 入力座標系: video frame pixel source
- 出力座標系: MediaPipe returned `NormalizedLandmark`
- 変換式または変換 helper: `detector.detectForVideo(modelVideoElement, nextModelTimestampMs())`
- その座標系で保存してよい理由: MediaPipe landmarks は video image に正規化された x/y として返るため、reference library と live current の比較前データとして扱いやすい
- 注意点: timestamp は `video.currentTime` ではなく model stream 用の単調増加 counter

コード上は `scanModelVideo()` の loop 内で、`seekVideoElement(modelVideoElement, timeSec)` 後に `detectForVideo()` を呼ぶ。

```ts
const result = detector.detectForVideo(modelVideoElement, nextModelTimestampMs())
state.rawIdealReferenceFrames.push(buildReferenceFrame(result, frameIndex, timeSec))
```

## Step 3: rawIdealReferenceFrames 保存

- 入力: MediaPipe result
- 出力: `IdealReferenceFrame`
- 保存先 state: `state.rawIdealReferenceFrames[]`
- 入力座標系: MediaPipe returned `NormalizedLandmark`
- 出力座標系: `landmarks478` は image-normalized のまま
- 変換式または変換 helper: `buildReferenceFrame()`, `mapLandmarks()`
- その座標系で保存してよい理由: model reference frame は pixel / displayedContentRect に変換せず、live current と同じ MediaPipe returned landmarks として保存される
- 注意点: `pose` は `facialTransformationMatrixes[0]` から推定した角度、`blendshapes` は MediaPipe score。どちらも座標ではない

重要な変換は値のコピーのみ。

```ts
function mapLandmarks(landmarks: NormalizedLandmark[]): ReferenceLandmark[] {
  return landmarks.map((landmark, index) => ({
    index,
    x: landmark.x,
    y: landmark.y,
    z: landmark.z,
  }))
}
```

`rawIdealReferenceFrames[].landmarks478` は model video の pixel coordinate や displayedContentRect pixel へ変換されていない。

## Step 4: モデル accepted frame review

- 入力: `getCurrentAcceptedFrame()?.landmarks478`
- 出力: model overlay canvas 上の 478 点
- 保存先 state: overlay 自体は保存しない。選択 index は `state.currentAcceptedReviewIndex`
- 入力座標系: image-normalized
- 出力座標系: overlay canvas CSS pixel
- 変換式または変換 helper: `drawModelOverlay()`, `drawLandmarkOverlay()`, `getDisplayedContentRect()`, `normalizedLandmarkToPreviewPixel()`
- その座標系で保存してよい理由: 保存対象は accepted frame index だけで、pixel 座標は描画時に都度計算される
- 注意点: 黒帯を考慮するため、`x * canvas.width` ではなく `displayedContentRect` を使う

```text
accepted frame landmarks image-normalized
  -> displayedContentRect pixel
  -> model overlay canvas
```

## Step 5: ライブ動画読み込み

- 入力: live video の `File`
- 出力: `objectUrl` と video metadata
- 保存先 state: `state.liveVideo`
- 入力座標系: なし
- 出力座標系: なし。`width` / `height` は video intrinsic pixel size
- 変換式または変換 helper: `handleVideoFileSelection("live", file)`, `syncMetadata("live")`
- その座標系で保存してよい理由: metadata は live overlay / raw warp の aspect ratio と seek 状態に使う
- 注意点: live video は current face の代替入力であり、camera stream ではない

`resetLiveAnalysisResults()` で `currentLiveFrameAnalysis`, `top1Match`, `displacementDebug`, raw warp summary を初期化する。

## Step 6: ライブ current frame 解析

- 入力: `liveVideoElement` の現在フレーム
- 出力: `CurrentLiveFrameAnalysis`
- 保存先 state: `state.currentLiveFrameAnalysis`
- 入力座標系: video frame pixel source
- 出力座標系: `landmarks478` は image-normalized
- 変換式または変換 helper: `analyzeCurrentLiveFrame()`, `buildCurrentLiveFrameAnalysis()`, `mapLandmarks()`
- その座標系で保存してよい理由: current landmarks は MediaPipe returned landmarks として、reference landmarks と同じ分類で後続処理できる
- 注意点: timestamp は live stream 用の単調増加 counter。model stream timestamp とは分離されている

```ts
const result = detector.detectForVideo(liveVideoElement, nextLiveTimestampMs())
state.currentLiveFrameAnalysis = buildCurrentLiveFrameAnalysis(result, timeSec)
```

`currentLiveFrameAnalysis.landmarks478` も pixel coordinate へ変換されず、image-normalized のまま保存される。

## Step 7: top1 reference matching

- 入力: `currentLiveFrameAnalysis.pose`, `currentLiveFrameAnalysis.blendshapes`, accepted `rawIdealReferenceFrames`
- 出力: `ReferenceMatchResult`
- 保存先 state: `state.top1Match`
- 入力座標系: landmarks は候補 validation に使うのみ。matching の主入力は pose / expression / quality
- 出力座標系: なし。match metadata
- 変換式または変換 helper: `updateTop1Match()`, `calculatePoseDistance()`, `calculateExpressionDistance()`
- その座標系で保存してよい理由: matching は reference frame id と score を保存する処理で、pixel 座標を持たない
- 注意点: 現コードでは landmarks の直接距離を match score に使っていない

match score:

```ts
matchScore =
  poseDistance * POSE_WEIGHT +
  expressionDistance * EXPRESSION_WEIGHT +
  qualityPenalty * QUALITY_WEIGHT
```

`poseDistance` は yaw / pitch / roll の二乗差、`expressionDistance` は jaw / smile / pucker / blink / squint 系 blendshape score の二乗差である。model / live の画角差や顔位置差を landmarks 直接距離として match score に混ぜていない点は、現時点では方針と一致している。

## Step 8: ideal reference alignment

- 入力: matched ideal `landmarks478`, current `landmarks478`
- 出力: `alignedIdeal` landmarks
- 保存先 state: `alignedIdeal` そのものは単独 state ではなく、`state.displacementDebug.displacements[].alignedIdeal` に保存
- 入力座標系: ideal / current とも image-normalized
- 出力座標系: image-normalized
- 変換式または変換 helper: `alignIdealLandmarksToCurrentBounds()`, `calculateLandmarkBounds()`
- その座標系で保存してよい理由: bounds center + uniform scale は 0..1 image-normalized 平面上の簡易 alignment で、後続の dx / dy 差分も同じ単位で扱える
- 注意点: x/y のみ bounds alignment され、z は `landmark.z` のままコピーされる

```ts
const scale = currentSize / idealSize
return idealLandmarks.map((landmark) => ({
  index: landmark.index,
  x: currentBounds.centerX + (landmark.x - idealBounds.centerX) * scale,
  y: currentBounds.centerY + (landmark.y - idealBounds.centerY) * scale,
  z: landmark.z,
}))
```

current bounds は current image-normalized landmarks から、ideal bounds は ideal image-normalized landmarks から計算される。出力の aligned ideal も image-normalized として扱われる。

## Step 9: displacement 計算

- 入力: current landmarks, aligned ideal landmarks
- 出力: `LandmarkDisplacement[]` と summary
- 保存先 state: `state.displacementDebug.displacements`, `state.displacementDebug.summary`
- 入力座標系: image-normalized
- 出力座標系: `dx` / `dy` は image-normalized 差分、`dz` は MediaPipe z 差分
- 変換式または変換 helper: `updateDisplacementDebug()`, `createDisplacementSummary()`
- その座標系で保存してよい理由: `dx` / `dy` は raw warp position や overlay の前段データであり、表示時に pixel へ変換できる
- 注意点: `dz` は x/y と同じ alignment を受けていない。現 raw warp position には使われていないが、summary / debug 解釈では注意が必要

```ts
dx = alignedIdealLandmark.x - currentLandmark.x
dy = alignedIdealLandmark.y - currentLandmark.y
dz = alignedIdealLandmark.z - currentLandmark.z
distance2D = Math.hypot(dx, dy)
```

`dx` / `dy` を pixel 表示する場合は `displayedContentRect.width` / `height` を反映する必要がある。現コードでは overlay / raw warp とも、点を pixel 化するときに `displayedContentRect` を使っている。

## Step 10: 478点 overlay 表示

- 入力: model accepted frame または live current landmarks
- 出力: overlay canvas 上の点
- 保存先 state: なし
- 入力座標系: image-normalized
- 出力座標系: canvas CSS pixel
- 変換式または変換 helper: `drawLandmarkOverlay()`, `drawLiveOverlay()`, `drawLandmarkPoints()`, `getDisplayedContentRect()`, `normalizedLandmarkToPreviewPixel()`
- その座標系で保存してよい理由: overlay は表示専用で、pixel 座標は保存せず描画時だけ作る
- 注意点: 2D canvas は `context.setTransform(dpr, 0, 0, dpr, 0, 0)` により CSS pixel で描画する

```ts
point.x = displayedContentRect.x + landmark.x * displayedContentRect.width
point.y = displayedContentRect.y + landmark.y * displayedContentRect.height
```

## Step 11: displacement overlay 表示

- 入力: `state.displacementDebug.displacements`
- 出力: current point と aligned ideal point の線分
- 保存先 state: なし
- 入力座標系: image-normalized displacement
- 出力座標系: canvas CSS pixel
- 変換式または変換 helper: `drawDisplacementOverlay()`, `normalizedLandmarkToPreviewPixel()`
- その座標系で保存してよい理由: `current` と `alignedIdeal` は image-normalized のまま保持し、表示時だけ pixel 化する
- 注意点: `distance2D` は image-normalized distance であり、pixel distance ではない

```text
current image-normalized
  -> displayedContentRect pixel
alignedIdeal image-normalized
  -> displayedContentRect pixel
```

## Step 12: raw warp frame 作成

- 入力: `displayedContentRect`, raw warp canvas CSS size, `state.displacementDebug.displacements`
- 出力: WebGL attribute arrays
- 保存先 state: なし。`targetPositions` / `textureCoordinates` は frame local
- 入力座標系: current / displacement は image-normalized
- 出力座標系: `targetPositions` は clip space、`textureCoordinates` は normalized UV
- 変換式または変換 helper: `drawRawWarpPreview()`, `buildRawWarpFrame()`, `normalizedLandmarkToPreviewPixel()`, `previewPixelToClip()`, `getTextureVCoordinate()`
- その座標系で保存してよい理由: WebGL へ渡す直前の attribute なので、clip / UV に変換されてよい
- 注意点: topology は `MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT = 468` のため、478 landmarks のうち face mesh topology 側で使うのは 468 vertices

```ts
targetX = displacement.current.x + displacement.dx * rawWarpStrength
targetY = displacement.current.y + displacement.dy * rawWarpStrength
targetPixel = normalizedLandmarkToPreviewPixel(target, displayedContentRect)
targetClip = previewPixelToClip(targetPixel, containerWidth, containerHeight)
u = displacement.current.x
v = getTextureVCoordinate(displacement.current.y)
```

source vertex は current image-normalized、target vertex は `current + displacement * strength` の image-normalized である。`position = target`, `uv = source` という mapping になっている。

## Step 13: WebGL texture / UV / clip space

- 入力: `liveVideoElement`, `targetPositions`, `textureCoordinates`
- 出力: raw warp canvas への WebGL draw
- 保存先 state: render result は summary に `webglStatus` / `renderTimeMs` として保存
- 入力座標系: position は clip space、UV は normalized texture coordinate
- 出力座標系: WebGL framebuffer pixel
- 変換式または変換 helper: `drawRawWarpWebglFrame()`
- その座標系で保存してよい理由: texture source が `HTMLVideoElement` なので、UV は video texture normalized coordinate として使う
- 注意点: `textureUploadFlip` と `textureVFormula` は別設定。default は `UNPACK_FLIP_Y_WEBGL = true` かつ `v = 1 - sourceY`

```ts
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, state.rawWarpDebug.textureUploadFlip === "on")
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoElement)
gl.drawElements(gl.TRIANGLES, MEDIAPIPE_FACE_MESH_TRIANGLES.length, gl.UNSIGNED_SHORT, 0)
```

`apps/studio/src/main.ts` の比較実装でも、WebGL mesh warp は `HTMLVideoElement` を texture にし、`UNPACK_FLIP_Y_WEBGL = true`, `textureCoordinates.v = 1 - sourceY` を使っている。ただし Studio は hidden WebGL canvas の結果を processed canvas へ `drawImage()` するため、Lab の DOM 上の raw warp canvas 表示と同じ表示ライフサイクルではない。

## Step 14: rawWarpOnly / sideBySide 表示

- 入力: raw warp canvas, live video element, overlay canvas
- 出力: live preview stage の表示モード
- 保存先 state: `state.livePreviewMode`
- 入力座標系: 表示 layout。座標値そのものではない
- 出力座標系: DOM / CSS layout
- 変換式または変換 helper: `renderPreviewPanels()`, `drawRawWarpPreview()`, CSS `[data-live-preview-mode]`
- その座標系で保存してよい理由: preview mode は表示構成の state であり、landmarks の保存座標系を変えない
- 注意点: `rawWarpOnly` では video element は CSS 上 `display: none` だが、texture source としては `liveVideoElement` を使う。`sideBySide` では video / overlay が左 pane、raw warp canvas が右 pane になる

CSS:

```css
.preview-stage[data-live-preview-mode="rawWarpOnly"] .video-preview {
  display: none;
}

.preview-stage[data-live-preview-mode="sideBySide"] {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.preview-stage[data-live-preview-mode="sideBySide"] .raw-warp-canvas {
  grid-area: 1 / 2;
}
```

`drawRawWarpPreview()` は raw warp canvas 自身の `getBoundingClientRect()` を使って drawing buffer と `displayedContentRect` を作る。PR7 前の懸念だった「raw warp canvas ではなく video element rect を clip space 基準にしている」状態は、現コードでは主要 raw warp 描画経路には当たらない。

## 座標系一覧表

| データ名 | 生成箇所 | 保存先 state | 座標系 | 値の範囲 | 表示時の変換 | 備考 |
|---|---|---|---|---|---|---|
| modelVideo metadata | `handleVideoFileSelection("model")`, `syncMetadata("model")` | `state.modelVideo` | metadata / intrinsic pixel size | `width` / `height` は video pixel | `getDisplayedContentRect()` の aspect ratio 入力 | landmarks 保存には使わない |
| `rawIdealReferenceFrames[].landmarks478` | `buildReferenceFrame()`, `mapLandmarks()` | `state.rawIdealReferenceFrames[]` | image-normalized | x/y は MediaPipe returned 0..1、z は MediaPipe normalized z | model review では `displayedContentRect` pixel | pixel 化せず保存 |
| `rawIdealReferenceFrames[].pose` | `estimateNullablePose()` | `state.rawIdealReferenceFrames[]` | pose angle metadata | yaw/pitch/roll degree または null | debug text | `facialTransformationMatrixes[0]` 由来 |
| `rawIdealReferenceFrames[].blendshapes` | `buildReferenceFrame()` | `state.rawIdealReferenceFrames[]` | score metadata | category score | debug text / matching | expression matching 用 |
| `acceptedFrames` | `updateScanCounters()`, `getAcceptedFrames()` | `state.modelScan.acceptedFrames`, derived list | frame count / filtered references | count | model range / review display | `excluded=false` の frame 数 |
| `currentLiveFrameAnalysis.landmarks478` | `buildCurrentLiveFrameAnalysis()`, `mapLandmarks()` | `state.currentLiveFrameAnalysis.landmarks478` | image-normalized | x/y は MediaPipe returned 0..1、z は MediaPipe normalized z | live overlay では `displayedContentRect` pixel | pixel 化せず保存 |
| `currentLiveFrameAnalysis.pose` | `estimateNullablePose()` | `state.currentLiveFrameAnalysis.pose` | pose angle metadata | yaw/pitch/roll degree または null | debug text / matching | landmarks 距離ではなく poseDistance に使用 |
| `currentLiveFrameAnalysis.blendshapes` | `buildCurrentLiveFrameAnalysis()` | `state.currentLiveFrameAnalysis.blendshapes` | score metadata | category score | debug text / matching | expressionDistance に使用 |
| `top1Match` | `updateTop1Match()` | `state.top1Match` | match metadata | score / ids / expression group | debug text | landmarks の直接距離は使わない |
| alignedIdeal landmarks | `alignIdealLandmarksToCurrentBounds()` | `state.displacementDebug.displacements[].alignedIdeal` | image-normalized | x/y は current bounds へ alignment 後、z は ideal z のまま | overlay / raw warp target の前段 | standalone state ではない |
| displacements | `updateDisplacementDebug()` | `state.displacementDebug.displacements` | image-normalized difference | dx/dy は alignedIdeal-current、dz は MediaPipe z 差分 | current / target 点を pixel 化 | raw warp source/target の元データ |
| displacement summary | `createDisplacementSummary()` | `state.displacementDebug.summary` | image-normalized metrics | distance2D, average, median, p90 | debug text | pixel distance ではない |
| displayedContentRect | `getDisplayedContentRect()` | `state.rawWarpDebug.summary.coordinateDebug.displayedContentRect` など | CSS pixel rect | x/y/width/height CSS pixel | normalized -> pixel 変換に使用 | object-fit contain の黒帯考慮 |
| overlay canvas coordinate | `drawLandmarkOverlay()`, `drawLiveOverlay()` | 保存なし | CSS pixel drawing coordinate | canvas CSS rect 内 | 2D canvas draw | drawing buffer は DPR 倍、描画は CSS pixel |
| rawWarp source vertices | `buildRawWarpFrame()` | frame local | image-normalized | current.x/current.y | UV へ直接使用 | `textureCoordinates` の source |
| rawWarp target vertices | `buildRawWarpFrame()` | frame local | image-normalized | current + dx/dy * strength | `displayedContentRect` pixel -> clip | aligned ideal 相当 |
| rawWarp target clip positions | `previewPixelToClip()` | `targetPositions` Float32Array | clip space | -1..1 | WebGL `a_position` | raw warp canvas CSS size を基準に計算 |
| rawWarp texture UV | `buildRawWarpFrame()`, `getTextureVCoordinate()` | `textureCoordinates` Float32Array | normalized texture coordinate | u 0..1、v は y または 1-y | WebGL `a_texCoord` | texture source が video element 前提 |
| rawWarp texture source | `drawRawWarpWebglFrame()` | WebGL texture | video texture | `HTMLVideoElement` current frame | fragment shader sampling | preview / processed canvas ではない |
| rawWarp canvas rect | `drawRawWarpPreview()`, `getLiveVideoCoordinateDebug()` | summary debug | CSS pixel rect / drawing buffer pixel | CSS rect と DPR 後 canvas size | clip space container size | `rawWarpOnly` / `sideBySide` で rect が変わる |

## 座標系が混ざっている可能性がある箇所

A. ほぼ確実に問題

- なし。実コード上、即座に「異なる座標系を同じ値として保存している」と断定できる箇所は確認できなかった。

B. 可能性が高い

- `dz` は x/y と同じ bounds alignment を受けていない。`dx` / `dy` は image-normalized 差分として明確だが、`dz = ideal.z - current.z` は model video と live video の MediaPipe z を直接引いた値なので、x/y displacement と同じ意味では読めない。
- `textureUploadFlip` と `textureVFormula` の組み合わせは見た目を大きく変える。default は Studio 比較実装と同じ `UNPACK_FLIP_Y_WEBGL=true` / `v=1-y` だが、設定を変えたときの正解判定は実動画確認が必要。
- `sideBySide` では live overlay / raw warp coordinate debug overlay は左 pane、raw warp canvas は右 pane になる。数値 debug は raw warp canvas rect を使う一方、overlay の視覚 debug は source pane 上に描かれるため、同一 pane 上の重ね合わせとして見ると誤解しやすい。

C. 可能性はあるが未確認

- MediaPipe tessellation 由来の WebGL topology は 468 landmarks / 852 triangles で、478 landmarks の iris 系 10 点は raw warp mesh には入らない。これは座標系混在ではないが、coverage 差として見た目に影響する可能性はある。
- `rawWarpOnly` では video element が CSS 上非表示でも、texture source として `liveVideoElement` を使う。ブラウザが hidden video の current frame texture upload を常に期待通り扱うかは実動画環境で確認が必要。
- `displayedContentRect` は video metadata aspect ratio と container rect から計算する。CSS layout が想定外に canvas / video の aspect を変えるケースでは debug summary の `videoCssRect` / `rawWarpCanvasCssRect` を併せて確認する必要がある。

D. 問題ではなさそう

- `rawIdealReferenceFrames[].landmarks478` は MediaPipe returned landmarks を `mapLandmarks()` でそのまま保存しており、pixel 座標へ変換していない。
- `currentLiveFrameAnalysis.landmarks478` も MediaPipe returned landmarks をそのまま保存している。
- `top1Match` は landmarks の直接距離を使わず、pose / expression / quality で比較している。
- x/y alignment は ideal / current の image-normalized bounds から center + uniform scale で行っている。
- overlay と raw warp target position は、どちらも `displayedContentRect` を通して image-normalized から CSS pixel へ変換している。
- raw warp の texture source は `HTMLVideoElement` であり、UV に source image-normalized を使う方針自体は自然。
- DPR 対応は、2D overlay が CSS pixel 描画、WebGL が clip space 描画なので、大きな座標系破綻には見えない。

## 現時点で正しそうな箇所

- model reference と live current の landmarks は、どちらも image-normalized のまま state に保存されている。
- matching は landmarks の位置差を使っておらず、画角差や顔位置差を直接 score に混ぜていない。
- alignment 後の `alignedIdeal.x/y` と displacement `dx/dy` は image-normalized として一貫している。
- overlay は黒帯を考慮する `displayedContentRect` を使って pixel へ変換している。
- raw warp は `position = target`, `uv = source` の標準的な mesh warp mapping になっている。
- `drawRawWarpPreview()` は raw warp canvas 自身の rect を使って clip space 変換を行っている。

## 現時点で怪しい箇所

- `dz` の意味が x/y displacement と揃っていない。現 raw warp には使っていないが、debug summary としては誤読されやすい。
- `textureUploadFlip` / `textureVFormula` の組み合わせはコード上分離されているが、実動画上の正解は file picker での確認が必要。
- `sideBySide` で overlay debug と raw warp canvas が別 pane になるため、視覚 debug と raw warp 実描画を同じ座標平面として見ない注意が必要。
- raw warp topology が 468 点であるため、478点 overlay と raw warp mesh coverage は完全一致しない。

## 次に実装すべき最小修正案

Option 1:

`dz` を displacement summary の主要判定から分離し、`zNotAligned` などの注記を Raw / Warp Mesh debug に出す。x/y displacement と同じ座標系ではないことを明示する。

Option 2:

`sideBySide` 時の sample vertex debug に、source pane rect と raw warp canvas rect の両方を並べて表示する。overlay visual debug と raw warp clip conversion の基準が別 pane であることを見えるようにする。

Option 3:

raw warp mesh の topology coverage を debug 表示に追加する。`478 landmarks available / 468 mesh vertices used / iris landmarks omitted` のように、478点 overlay と WebGL mesh の点数差を明示する。
