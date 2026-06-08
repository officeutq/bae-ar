# Ideal Reference Raw Warp Coordinate Investigation

## 調査目的

`tools/ideal-reference-mesh-warp-lab` の raw displacement mesh warp prototype について、実動画で見えるズレが単なる過大 displacement なのか、座標系・texture UV・描画レイヤーの不一致なのかを切り分ける。

今回は修正実装を行わず、次に入れるべき最小修正を決めるために以下を確認した。

- MediaPipe normalized coordinate と preview / canvas / WebGL clip space の対応
- WebGL texture source と UV の基準
- source / target vertex mapping
- raw warp canvas の DOM / CSS layer
- texture V flip と `UNPACK_FLIP_Y_WEBGL` の関係
- Studio processed preview 限定 WebGL mesh warp prototype との差分

## 現在の raw warp 実装経路

主要経路は以下。

```text
analyzeCurrentLiveFrame()
  -> updateTop1Match()
  -> updateDisplacementDebug()
  -> renderAll()
  -> drawAllOverlays()
  -> drawRawWarpPreview()
  -> buildRawWarpFrame()
  -> drawRawWarpWebglFrame()
  -> drawLiveOverlay()
```

確認した主なファイル:

- `tools/ideal-reference-mesh-warp-lab/src/main.ts`
- `tools/ideal-reference-mesh-warp-lab/src/style.css`
- `apps/studio/src/main.ts`
- `packages/engine/src/face/mediapipeFaceMeshTopology.ts`

`analyzeCurrentLiveFrame()` は live video element を MediaPipe に渡し、current 478 landmarks を作る。`updateTop1Match()` は accepted raw ideal reference frames から top1 を選ぶ。`updateDisplacementDebug()` は top1 ideal landmarks を current bounds に bounds center + uniform scale で alignment し、`alignedIdeal - current` の displacement を作る。

raw warp は `drawRawWarpPreview()` で live raw warp canvas の drawing buffer を更新し、`buildRawWarpFrame()` で WebGL attribute 用の `targetPositions` と `textureCoordinates` を作る。`drawRawWarpWebglFrame()` は video element を texture として upload し、MediaPipe face mesh topology の index buffer で triangles を描く。

## texture source の確認結果

現在の texture source は `HTMLVideoElement` そのもの。

```text
drawRawWarpWebglFrame(renderer, liveVideoElement, ...)
  -> gl.texImage2D(..., videoElement)
```

表示用 canvas、overlay canvas、offscreen canvas は texture source ではない。

そのため UV の基準は preview canvas pixel ではなく、video texture の normalized coordinate になる。つまり current landmark の MediaPipe normalized `x/y` を UV に使う方針自体は自然。

```text
video texture の現在実装:
  u = current.x
  v = textureVFlip ? 1 - current.y : current.y

preview canvas texture ではないため、以下は現在の実装では不要:
  u = sourcePixel.x / previewCanvas.width
  v = sourcePixel.y / previewCanvas.height
```

分類:

- D. 問題ではなさそう: texture source が video element であること自体
- B. 可能性が高い: `texture V flip` が UV 側だけの切替で、texture upload 側の flip と分離されていないこと

## position / UV mapping の確認結果

mesh warp の mapping は基本形どおり。

```text
position = target vertex
uv = source vertex
```

`buildRawWarpFrame()` では、target position に strength 適用後の target を使っている。

```text
target.x = current.x + dx * rawWarpStrength
target.y = current.y + dy * rawWarpStrength
targetPixel = normalizedLandmarkToPreviewPixel(target, displayedContentRect)
targetClip = previewPixelToClip(targetPixel, preview width / height)
```

UV には current landmark を使っている。

```text
u = current.x
v = textureVFlip ? 1 - current.y : current.y
```

つまり、少なくとも現時点の実コード上は `draw source triangles / sample target UVs` にはなっていない。

分類:

- D. 問題ではなさそう: source / target mapping の大枠
- C. 可能性はあるが未確認: topology の triangle list が MediaPipe tessellation から意図どおり triangle index へ変換されているか

補足: `packages/engine/src/face/mediapipeFaceMeshTopology.ts` は `FaceLandmarker.FACE_LANDMARKS_TESSELATION` の edge list を 3本ずつ見て、閉じた三角形だけを triangle index として採用している。現在の計算では 468 vertices / 852 triangles になる。Studio も同じ topology を使うため、lab だけの差分ではない。ただし、topology 由来の triangle coverage / winding / missing face area は別途検証余地がある。

## displayedContentRect / canvas / clip space の確認結果

PR6b 後の lab は、overlay と raw warp target position で同じ `displayedContentRect` helper を使っている。

```text
MediaPipe normalized
  -> normalizedLandmarkToPreviewPixel(..., displayedContentRect)
  -> previewPixelToClip(..., previewElementRect width / height)
```

current478 overlay:

```text
drawLiveOverlay()
  -> getDisplayedContentRect(liveVideo)
  -> drawLandmarkPoints()
  -> normalizedLandmarkToPreviewPixel(current, displayedContentRect)
```

displacement overlay:

```text
drawDisplacementOverlay()
  -> normalizedLandmarkToPreviewPixel(current, displayedContentRect)
  -> normalizedLandmarkToPreviewPixel(alignedIdeal, displayedContentRect)
```

raw warp target position:

```text
drawRawWarpPreview()
  -> getDisplayedContentRect(liveVideo)
  -> buildRawWarpFrame(displayedContentRect, rect.width, rect.height)
  -> normalizedLandmarkToPreviewPixel(target, displayedContentRect)
  -> previewPixelToClip(targetPixel, rect.width, rect.height)
```

このため、current478 overlay と raw warp source / target debug overlay の pixel 変換は揃っている。

一方、raw warp の UV は displayedContentRect を使わない。これは texture source が `HTMLVideoElement` なので原理的には正しい。ただし、raw warp canvas が video element と完全に同じ CSS rect になっていることが前提になる。

分類:

- D. 問題ではなさそう: overlay と raw warp target debug が同じ displayed content rect を使う点
- B. 可能性が高い: raw warp canvas の CSS rect を直接測らず、video element の rect を raw warp canvas の clip space 基準として使っている点
- C. 可能性はあるが未確認: native video controls やブラウザ固有描画で、video content と overlay canvas の見え方が一致しないケース

## WebGL canvas display layer の確認結果

live preview DOM は以下。

```text
preview-stage
  video.video-preview[data-video="live"]
  canvas.raw-warp-canvas[data-raw-warp="live"]
  canvas.landmark-overlay[data-overlay="live"]
```

CSS は以下。

```text
.video-preview:
  grid-area: 1 / 1
  object-fit: contain

.raw-warp-canvas:
  grid-area: 1 / 1
  pointer-events: none
  position: relative
  z-index: 1

.landmark-overlay:
  grid-area: 1 / 1
  pointer-events: none
  position: relative
  z-index: 2
```

`preview-stage[data-loaded="true"]` では video / raw warp canvas / overlay canvas がすべて `display: block` になる。`showRawWarp=false` は CSS display を切り替えず、WebGL canvas を透明 clear する方式。

この構造では raw warp canvas は video element より前面、landmark overlay より背面になる可能性が高い。`z-index` は grid item に効くため、raw warp canvas が video の下にある可能性は低い。

ただし、Studio とは描画方式が違う。Studio は hidden / detached な `webglMeshCanvas` に WebGL 結果を描き、その結果を processed canvas に `drawImage()` する。lab は raw warp canvas を DOM 上で video に直接重ねる。したがって、lab では元 video と warped face mesh が同時に重なって見える。

分類:

- D. 問題ではなさそう: raw warp canvas が DOM に存在し、z-index 上は video より前面にある点
- B. 可能性が高い: raw warp は full processed image ではなく、face mesh 部分だけを video 上に overlay しているため、元 video との重なりでズレや二重像に見えやすい点
- C. 可能性はあるが未確認: browser native video controls が canvas overlay と視覚的に干渉する点

## texture V flip の確認結果

現在の lab は `textureVFlip` option を持つが、切り替えているのは UV の `v` だけ。

```text
v = textureVFlip ? 1 - current.y : current.y
```

一方、WebGL texture upload では常に以下を実行している。

```text
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
gl.texImage2D(..., videoElement)
```

shader 側では `v_texCoord` をそのまま `texture2D()` に渡しており、shader 内での追加 flip はない。

つまり現在は以下の2状態しか比較できない。

```text
upload flip: always on
uv formula:
  on  -> v = 1 - y
  off -> v = y
```

以下の比較はまだできない。

```text
upload flip off + v = y
upload flip off + v = 1 - y
upload flip on  + v = y
upload flip on  + v = 1 - y
```

Studio の WebGL mesh warp も `UNPACK_FLIP_Y_WEBGL=true` と `v=1-current.y` を使っている。ただし Studio は processed canvas へ描き戻すため、lab の DOM overlay と同じ見え方とは限らない。

分類:

- A. ほぼ確実に問題: `texture V flip` debug option が upload flip と UV formula を分離しておらず、真の flip 切り分けになっていない点
- D. 問題ではなさそう: shader 側で二重に `v` を反転していない点

## viewport / canvas size / devicePixelRatio の確認結果

lab は overlay canvas と raw warp canvas の内部解像度を、それぞれ video element の CSS rect と `devicePixelRatio` から設定する。

```text
canvas.width  = rect.width  * devicePixelRatio
canvas.height = rect.height * devicePixelRatio
```

2D overlay は `context.setTransform(dpr, 0, 0, dpr, 0, 0)` を使い、CSS pixel 座標で描画する。

WebGL raw warp は drawing buffer size を `rect * dpr` にしたうえで、clip space は CSS pixel 座標から作っている。

```text
clipX = (pixelX / rect.width) * 2 - 1
clipY = 1 - (pixelY / rect.height) * 2
gl.viewport(0, 0, rawWarpCanvas.width, rawWarpCanvas.height)
```

clip space は viewport の actual pixel sizeに依存しないため、DPR 対応としては大きく破綻していない。overlay canvas と raw warp canvas は同じ video rect / DPR を基準にしている。

ただし、raw warp canvas 自身の `getBoundingClientRect()` ではなく video element の rect を使っている。CSS が同じため通常は一致するはずだが、今の debug summary は raw warp canvas の drawing buffer size しか出しておらず、raw warp canvas の CSS rect と video rect の一致を直接確認できない。

分類:

- D. 問題ではなさそう: `gl.viewport` が drawing buffer size に合っている点
- D. 問題ではなさそう: clip space に CSS pixel を使っている点
- B. 可能性が高い: raw warp canvas CSS rect と video element rect の一致を Raw / Warp Mesh で直接確認できない点

## Studio WebGL mesh warp prototype との差分

共通点:

- texture source は `HTMLVideoElement`
- mapping は `position = target`, `uv = current/source`
- topology は `MEDIAPIPE_FACE_MESH_TRIANGLES`
- upload は `UNPACK_FLIP_Y_WEBGL=true`
- UV は `v = 1 - source.y`
- shader は `texture2D(u_texture, v_texCoord)` で追加 flip なし

主な差分:

```text
Studio:
  processedCanvas.width / height = video.videoWidth / video.videoHeight
  targetPositions = normalized target -> clip directly
  WebGL result is drawn into hidden webglMeshCanvas
  outputContext.drawImage(webglCanvas, 0, 0, processedCanvas.width, processedCanvas.height)
  user sees processed canvas, not video element overlay

Ideal Reference Mesh Warp Lab:
  rawWarpCanvas.width / height = displayed video CSS rect * devicePixelRatio
  targetPositions = normalized target -> displayedContentRect pixel -> clip
  WebGL result is displayed as DOM canvas over live video element
  original video remains visible below warped face mesh
  texture V flip is user-selectable for UV formula only
```

この差分から、lab 固有の問題候補は「texture/UV の数式」よりも、DOM overlay と source/warped 比較方法に寄っている可能性がある。

## 原因候補

### A. ほぼ確実に問題

1. `texture V flip` debug option が upload flip と UV formula を分離していない。

現在の option は `v = y` / `v = 1 - y` だけを切り替える。`UNPACK_FLIP_Y_WEBGL` は常に `true` のため、texture upload 側の flip/no-flip を検証できない。実動画のズレが V flip 系かどうかを切り分ける debug としては不完全。

### B. 可能性が高い

1. raw warp preview が full processed image ではなく、video element 上の face mesh overlay になっている。

raw warp canvas は透明背景で face mesh triangles だけを描く。元 video が下に残るため、source と target が少しでもズレると二重像や「texture が合っていない」見た目になりやすい。Studio processed preview とは見え方が異なる。

2. raw warp canvas の CSS rect を直接測っていない。

`buildRawWarpFrame()` の clip space は `liveVideoElement.getBoundingClientRect()` を基準にする。CSS 上は raw warp canvas と video が同じ grid cell なので一致する見込みだが、raw warp canvas 自身の CSS rect が Raw / Warp Mesh に出ていないため、実動画環境での不一致を断定できない。

3. debug option が texture source mode を持たない。

現在は video texture 固定。preview canvas texture に切り替えた場合は UV 基準が `displayedContentRect / canvas` へ変わる。現状の UI では「video texture と displayedContentRect の混在が正しいか」を A/B で検証できない。

### C. 可能性はあるが未確認

1. topology の triangle coverage が期待と違う。

MediaPipe tessellation edge list から 468 vertices / 852 triangles を作っている。Studio も同じだが、raw warp の見た目が大きく崩れる場合、triangle list 自体の coverage や隣接関係を別途可視化する価値はある。

2. native video controls と overlay canvas が干渉している。

live video element は `controls` を持つ。canvas は `pointer-events: none` で前面に重なる。通常は問題になりにくいが、controls 表示中の compositor / layout 差分は未確認。

3. texture upload timing と video frame readiness。

`texImage2D(..., videoElement)` は current video frame を使う。current frame analysis と render の間に再生が進むと、landmarks は解析時点、texture は描画時点になる可能性がある。pause / manual analyze では小さいが、playing auto analysis ではズレ要因になりうる。

### D. 問題ではなさそう

1. position / UV mapping の大枠。

実コードは target triangles を描き、source UV を sample している。

2. displayedContentRect helper の overlay / target debug 共通利用。

current478 overlay、displacement overlay、raw warp coordinate debug overlay は同じ normalized -> displayed content pixel helper を使っている。

3. WebGL viewport。

`gl.viewport(0, 0, canvas.width, canvas.height)` は drawing buffer size と一致している。

4. shader 内の V 二重反転。

shader は `v_texCoord` をそのまま使い、shader 内で反転していない。

## 次に実装すべき最小修正案

### Option 1: raw warp preview を source / warped の2画面比較に分ける

目的:

- video element 直上 overlay による二重像を避ける
- Studio processed preview と同じく「warped canvas 単体で何が描けているか」を確認する

最小実装:

- live tab に source video と raw warped canvas を並べる、または preview mode を `source` / `rawWarpOnly` に分ける
- raw warp canvas 背景を透明ではなく黒または元 video copy にする debug mode を追加する
- raw warp canvas が本当に表示されているかを視覚的に確認しやすくする

### Option 2: texture flip debug を upload flip と UV formula に分離する

目的:

- `UNPACK_FLIP_Y_WEBGL` と `v = y / 1 - y` の組み合わせを全パターンで確認する

最小実装:

```text
textureUploadFlip:
  on / off

textureVFormula:
  y / 1 - y
```

Raw / Warp Mesh には以下を出す。

```text
texture source: HTMLVideoElement
UNPACK_FLIP_Y_WEBGL: on/off
uv formula: current.y / 1 - current.y
```

### Option 3: sample vertex debug を Raw に少数だけ出す

目的:

- current478 overlay と raw warp source / target / uv / clip の一致を数字で確認する
- 実動画 file picker 環境でズレを報告しやすくする

最小実装:

Raw に 3〜5 点だけ preview を出す。

```json
{
  "warpCoordinateSamplePreview": [
    {
      "index": 1,
      "currentNormalized": { "x": 0.5, "y": 0.4 },
      "targetNormalized": { "x": 0.51, "y": 0.41 },
      "sourcePixel": { "x": 512, "y": 220 },
      "targetPixel": { "x": 520, "y": 226 },
      "targetClip": { "x": 0.01, "y": 0.22 },
      "uv": { "u": 0.5, "v": 0.6 }
    }
  ]
}
```

全文配列は出さず、固定 index または step sampling の preview のみにする。

## 結論

現時点の実コードだけを見る限り、`position = target`, `uv = source` の基本 mapping は逆ではない。`displayedContentRect` を position 側だけに使い、UV 側に使わないことも、texture source が `HTMLVideoElement` である限りは正しい。

最も優先して切り分けるべきは、以下の3点。

1. `UNPACK_FLIP_Y_WEBGL` と UV formula を分離して V flip を検証できるようにする
2. raw warp overlay ではなく warped-only / side-by-side 表示で、video 下地との二重像を除外する
3. raw warp canvas CSS rect と sample vertex の normalized / pixel / clip / uv preview を Raw に少数出す

これらは品質改善や safety weight ではなく、座標系切り分けのための最小 debug 修正として扱う。
