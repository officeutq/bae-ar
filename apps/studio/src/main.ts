import {
  BeautyEngine,
  MediaPipeFaceDetector,
  idealFaceAssetV1ToIdealFace,
  parseIdealFaceAssetV1Json,
} from "@bae-ar/engine"
import type {
  BeautyEngineState,
  FaceFrame,
  FaceGeometry,
  FaceGeometryPoint,
  IdealFace,
  IdealLandmarks3DProjectionResult,
  IdealFaceProjectionResult,
  ProjectionDifference,
} from "@bae-ar/engine"
import type { CameraServiceState } from "./services/CameraService"
import { CameraService } from "./services/CameraService"

interface DetectorDebugInfo {
  debugInstanceId: string
  initialized: boolean
  hasFaceLandmarker: boolean
  detectCount: number
  detectAttemptCount: number
  detectSuccessCount: number
  detectErrorCount: number
  lastDetectError: string | null
  videoWidth: number
  videoHeight: number
  lastDetectionTime: number | null
}

type DebugSection =
  | "faceFrame"
  | "faceGeometry"
  | "idealFace"
  | "idealLandmarks3DProjection"
  | "idealFaceProjection"
  | "idealFaceProjectionDifference"
  | "mediaPipe"
  | "loopTiming"
  | "fullDebugText"

type IdealFaceAssetImportState =
  | {
      status: "idle"
    }
  | {
      status: "loading"
      fileName: string
    }
  | {
      status: "success"
      fileName: string
      assetId: string
      assetName: string
      version: string
      schemaVersion: string
      generationMethod: string
      landmarkTopology: string
      coordinateSpace: string
      landmarkCount: number
      createdAt: string
    }
  | {
      status: "error"
      fileName: string
      errors: string[]
    }

type OverlayProjectedIdealPixelBoundsSummary = {
  xMinPx: number
  xMaxPx: number
  yMinPx: number
  yMaxPx: number
  widthPx: number
  heightPx: number
  aspectRatioPx: number | null
  canvasWidthPx: number
  canvasHeightPx: number
  displayWidthPx: number
  displayHeightPx: number
  videoWidthPx: number | null
  videoHeightPx: number | null
}

async function bootstrap(): Promise<void> {
  const engine = new BeautyEngine()
  const camera = new CameraService()
  const detector = new MediaPipeFaceDetector()
  const app = document.querySelector<HTMLDivElement>("#app")
  const overlayCanvas = document.createElement("canvas")
  const stateLog: string[] = []
  let lastEngineState: BeautyEngineState | undefined
  let latestFaceFrame: FaceFrame | undefined
  let previousFrameTimestamp: number | undefined
  let faceFrameFps: number | undefined
  let copyStatus = ""
  let idealFaceAssetImportState: IdealFaceAssetImportState = {
    status: "idle",
  }
  const openDebugSections: Record<DebugSection, boolean> = {
    faceFrame: false,
    faceGeometry: false,
    idealFace: false,
    idealLandmarks3DProjection: false,
    idealFaceProjection: false,
    idealFaceProjectionDifference: false,
    mediaPipe: false,
    loopTiming: false,
    fullDebugText: false,
  }

  overlayCanvas.className = "overlay"

  if (!app) {
    throw new Error("Studio app root was not found")
  }

  const appRoot = app

  function formatEngineState(state: BeautyEngineState): string {
    const labels: Record<BeautyEngineState, string> = {
      idle: "待機中",
      initialized: "初期化済み",
      running: "実行中",
      stopped: "停止中",
      disposed: "破棄済み",
    }

    return labels[state]
  }

  function formatCameraState(state: CameraServiceState): string {
    const labels: Record<CameraServiceState, string> = {
      idle: "待機中",
      starting: "起動中",
      running: "実行中",
      stopped: "停止中",
      error: "エラー",
    }

    return labels[state]
  }

  function formatDetection(frame: FaceFrame | undefined): string {
    return frame?.detected ? "検出中" : "未検出"
  }

  function formatNumber(value: number): string {
    return value.toFixed(3)
  }

  function formatNullableNumber(value: number | null | undefined): string {
    return value === null || value === undefined ? "なし" : formatNumber(value)
  }

  function formatGeometryPoint(
    point: FaceGeometryPoint | null | undefined,
  ): string {
    if (!point) {
      return "なし"
    }

    return `x=${formatNumber(point.x)} y=${formatNumber(point.y)} z=${formatNumber(point.z)}`
  }

  function formatFps(value: number | undefined): string {
    return value === undefined ? "計測中" : value.toFixed(1)
  }

  function escapeHtml(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;")
  }

  function formatLandmarkPreview(frame: FaceFrame | undefined): string {
    if (!frame || frame.landmarks.length === 0) {
      return "なし"
    }

    return frame.landmarks
      .slice(0, 5)
      .map(
        (landmark, index) =>
          `Landmark[${index}]:
x: ${formatNumber(landmark.x)}
y: ${formatNumber(landmark.y)}
z: ${formatNumber(landmark.z)}`,
      )
      .join("\n\n")
  }

  function formatBlendshapePreview(frame: FaceFrame | undefined): string {
    if (!frame?.blendshapes || frame.blendshapes.length === 0) {
      return "なし"
    }

    return [...frame.blendshapes]
      .sort((current, next) => next.score - current.score)
      .slice(0, 5)
      .map(
        (blendshape) =>
          `${blendshape.displayName || blendshape.categoryName}: ${formatNumber(blendshape.score)}`,
      )
      .join("\n")
  }

  function formatPosePreview(frame: FaceFrame | undefined): string {
    if (!frame) {
      return "なし"
    }

    return `pitch: ${formatNumber(frame.pose.pitch)}
yaw: ${formatNumber(frame.pose.yaw)}
roll: ${formatNumber(frame.pose.roll)}`
  }

  function formatFaceGeometryPreview(
    geometry: FaceGeometry | undefined,
  ): string {
    return `FaceGeometry:
leftEyeCenter: ${formatGeometryPoint(geometry?.leftEyeCenter)}
rightEyeCenter: ${formatGeometryPoint(geometry?.rightEyeCenter)}
mouthCenter: ${formatGeometryPoint(geometry?.mouthCenter)}
noseTip: ${formatGeometryPoint(geometry?.noseTip)}
chin: ${formatGeometryPoint(geometry?.chin)}
faceCenter: ${formatGeometryPoint(geometry?.faceCenter)}
faceWidth: ${formatNullableNumber(geometry?.faceWidth)}
faceHeight: ${formatNullableNumber(geometry?.faceHeight)}
eyeDistance: ${formatNullableNumber(geometry?.eyeDistance)}`
  }

  function formatIdealFacePreview(idealFace: IdealFace): string {
    return `IdealFace:
名前: ${idealFace.metadata.name}
preset id: ${idealFace.metadata.id}
version: ${idealFace.metadata.version}
point数: ${idealFace.model.controlPoints.length}
idealLandmarks3D: ${idealFace.model.idealLandmarks3D?.length ?? 0}
座標系: ${idealFace.model.coordinateSpace}
MediaPipe landmarks: ${idealFace.landmarkTopology.mediapipeLandmarkCount}
ideal 478 landmarks生成: ${idealFace.landmarkTopology.canGenerateIdealLandmarks ? "可能" : "未実装"}
Projection: ${idealFace.landmarkTopology.projectionStatus}`
  }

  function formatIdealFaceAssetImportState(
    state: IdealFaceAssetImportState,
  ): string {
    if (state.status === "idle") {
      return `読み込み状態: 未選択
idealLandmarks3D 478点の Projection 完全対応は次ステップです。
現在は asset の読み込みと Engine への反映のみ確認します。`
    }

    if (state.status === "loading") {
      return `読み込み状態: 読み込み中
ファイル名: ${state.fileName}`
    }

    if (state.status === "error") {
      return `読み込み状態: 失敗
ファイル名: ${state.fileName}
エラー:
${state.errors.map((error) => `- ${error}`).join("\n")}

idealLandmarks3D 478点の Projection 完全対応は次ステップです。
現在は asset の読み込みと Engine への反映のみ確認します。`
    }

    return `読み込み状態: success
ファイル名: ${state.fileName}
id: ${state.assetId}
name: ${state.assetName}
version: ${state.version}
schemaVersion: ${state.schemaVersion}
generationMethod: ${state.generationMethod}
landmarkTopology: ${state.landmarkTopology}
coordinateSpace: ${state.coordinateSpace}
idealLandmarks3D count: ${state.landmarkCount}
createdAt: ${state.createdAt}

idealLandmarks3D 478点の Projection 完全対応は次ステップです。
現在は asset の読み込みと Engine への反映のみ確認します。`
  }

  function translateIdealFaceAssetError(error: string): string {
    if (error.includes("json parse error")) {
      return `JSON の解析に失敗しました: ${error}`
    }

    if (error.includes("schemaVersion")) {
      return "schemaVersion が ideal_face_asset_v1 ではありません"
    }

    if (error.includes("model.idealLandmarks3D must contain")) {
      return "idealLandmarks3D は 478 点必要です"
    }

    if (error.includes("duplicates index")) {
      return `landmark index が重複しています: ${error}`
    }

    if (error.includes("missing index")) {
      return `landmark index が欠落しています: ${error}`
    }

    if (error.includes(".confidence")) {
      return `confidence が 0〜1 の範囲外です: ${error}`
    }

    if (error.includes("finite number")) {
      return `x / y / z / index / confidence は有限の number である必要があります: ${error}`
    }

    return `検証エラー: ${error}`
  }

  function formatProjectionSummary(
    summary: IdealLandmarks3DProjectionResult["summary"],
  ): string {
    if (!summary) {
      return `x min / max: なし
y min / max: なし
z min / max: なし`
    }

    return `x min / max: ${formatNumber(summary.xMin)} / ${formatNumber(summary.xMax)}
y min / max: ${formatNumber(summary.yMin)} / ${formatNumber(summary.yMax)}
z min / max: ${formatNumber(summary.zMin)} / ${formatNumber(summary.zMax)}`
  }

  function formatProjectionBoundsDebug(
    projection: IdealLandmarks3DProjectionResult,
    overlayPixelBounds: OverlayProjectedIdealPixelBoundsSummary | undefined,
  ): string {
    const debug = projection.debug

    return `Bounds / Aspect Ratio:
asset: ${formatLandmarkBounds(debug?.assetBounds)}
rotated: ${formatLandmarkBounds(debug?.rotatedBounds)}
aligned: ${formatLandmarkBounds(debug?.alignedBounds)}
current: ${formatLandmarkBounds(debug?.currentBounds)}
overlay px: ${formatOverlayPixelBounds(overlayPixelBounds)}
aspect asset / rotated / aligned / current / currentMinusAligned: ${formatNullableNumber(debug?.aspectRatio.asset)} / ${formatNullableNumber(debug?.aspectRatio.rotated)} / ${formatNullableNumber(debug?.aspectRatio.aligned)} / ${formatNullableNumber(debug?.aspectRatio.current)} / ${formatNullableNumber(debug?.aspectRatio.currentMinusAligned)}`
  }

  function formatLandmarkBounds(
    bounds:
      | NonNullable<
          IdealLandmarks3DProjectionResult["debug"]
        >["assetBounds"]
      | NonNullable<
          IdealLandmarks3DProjectionResult["debug"]
        >["currentBounds"]
      | undefined,
  ): string {
    if (!bounds) {
      return "なし"
    }

    const zText =
      "zMin" in bounds
        ? ` / z ${formatNumber(bounds.zMin)}..${formatNumber(bounds.zMax)} / zRange ${formatNumber(bounds.zRange)}`
        : ""

    return `width ${formatNumber(bounds.width)} / height ${formatNumber(bounds.height)} / aspect ${formatNullableNumber(bounds.aspectRatio)} / x ${formatNumber(bounds.xMin)}..${formatNumber(bounds.xMax)} / y ${formatNumber(bounds.yMin)}..${formatNumber(bounds.yMax)}${zText}`
  }

  function formatOverlayPixelBounds(
    bounds: OverlayProjectedIdealPixelBoundsSummary | undefined,
  ): string {
    if (!bounds) {
      return "なし"
    }

    return `width ${formatNumber(bounds.widthPx)} / height ${formatNumber(bounds.heightPx)} / aspect ${formatNullableNumber(bounds.aspectRatioPx)} / x ${formatNumber(bounds.xMinPx)}..${formatNumber(bounds.xMaxPx)} / y ${formatNumber(bounds.yMinPx)}..${formatNumber(bounds.yMaxPx)} / canvas ${formatNumber(bounds.canvasWidthPx)}x${formatNumber(bounds.canvasHeightPx)} / display ${formatNumber(bounds.displayWidthPx)}x${formatNumber(bounds.displayHeightPx)} / video ${formatNullableNumber(bounds.videoWidthPx)}x${formatNullableNumber(bounds.videoHeightPx)}`
  }

  function formatProjectionAlignment(
    alignment: IdealLandmarks3DProjectionResult["alignment"],
  ): string {
    if (!alignment) {
      return `alignment: none
理由: alignment 情報がありません`
    }

    return `alignment: ${alignment.mode}
scale basis: ${alignment.scaleBasis?.mode ?? "none"}
scale: ${formatNullableNumber(alignment.scale)}
chosenScale: ${formatNullableNumber(alignment.scaleBasis?.chosenScale)}
limiting axis: ${alignment.scaleBasis?.limitingAxis ?? "none"}
translateX: ${formatNumber(alignment.translateX)}
translateY: ${formatNumber(alignment.translateY)}
currentCenter: ${formatProjectionPoint(alignment.currentCenter)}
projectedCenter: ${formatProjectionPoint(alignment.projectedCenter)}
currentSize: ${formatNullableNumber(alignment.currentSize)}
projectedSize: ${formatNullableNumber(alignment.projectedSize)}
current width / height: ${formatNullableNumber(alignment.scaleBasis?.currentWidth)} / ${formatNullableNumber(alignment.scaleBasis?.currentHeight)}
projected width / height: ${formatNullableNumber(alignment.scaleBasis?.projectedWidth)} / ${formatNullableNumber(alignment.scaleBasis?.projectedHeight)}
width ratio: ${formatNullableNumber(alignment.scaleBasis?.widthRatio)}
height ratio: ${formatNullableNumber(alignment.scaleBasis?.heightRatio)}
currentAspectRatio: ${formatNullableNumber(alignment.currentAspectRatio)}
projectedAspectRatio: ${formatNullableNumber(alignment.projectedAspectRatio)}
aspectRatioDifference: ${formatNullableNumber(alignment.aspectRatioDifference)}${
      alignment.mode === "none"
        ? `
理由: ${alignment.reason ?? "current face center / size が取得できません"}`
        : ""
    }`
  }

  function formatProjectionPoint(
    point:
      | {
          x: number
          y: number
        }
      | undefined,
  ): string {
    if (!point) {
      return "なし"
    }

    return `${formatNumber(point.x)} / ${formatNumber(point.y)}`
  }

  function formatIdealLandmarks3DProjectionPreview(
    projection: IdealLandmarks3DProjectionResult,
    frame: FaceFrame | undefined,
    overlayPixelBounds: OverlayProjectedIdealPixelBoundsSummary | undefined,
  ): string {
    if (projection.status !== "projected") {
      return `IdealFace 478 Projection
status: ${projection.status}
landmarks: ${projection.landmarkCount}
idealFace: ${projection.sourceIdealFaceName ?? "なし"} (${projection.sourceIdealFaceId ?? "なし"})
pose: ${frame ? `yaw ${formatNumber(frame.pose.yaw)} / pitch ${formatNumber(frame.pose.pitch)} / roll ${formatNumber(frame.pose.roll)}` : "なし"}
${formatProjectionAlignment(projection.alignment)}
${formatProjectionSummary(projection.summary)}
${formatProjectionBoundsDebug(projection, overlayPixelBounds)}

idealLandmarks3D 478点 Projection は未実行です。
IdealFace asset JSON を読み込み、顔検出後に確認できます。`
    }

    return `IdealFace 478 Projection
status: ${projection.status}
landmarks: ${projection.landmarkCount}
idealFace: ${projection.sourceIdealFaceName ?? "なし"} (${projection.sourceIdealFaceId ?? "なし"})
pose: ${frame ? `yaw ${formatNumber(frame.pose.yaw)} / pitch ${formatNumber(frame.pose.pitch)} / roll ${formatNumber(frame.pose.roll)}` : "なし"}
${formatProjectionAlignment(projection.alignment)}
${formatProjectionSummary(projection.summary)}
${formatProjectionBoundsDebug(projection, overlayPixelBounds)}`
  }

  function formatIdealFaceProjectionPreview(
    projection: IdealFaceProjectionResult,
  ): string {
    const pointPreview =
      projection.points.length === 0
        ? "なし"
        : projection.points
            .slice(0, 5)
            .map(
              (point) =>
                `${point.id}: x=${formatNumber(point.x)} y=${formatNumber(point.y)} z=${formatNumber(point.z)}`,
            )
            .join("\n")

    return `IdealFace Projection:
投影状態: ${projection.status}
source idealFace id: ${projection.idealFaceId}
version: ${projection.idealFaceVersion}
projected point count: ${projection.points.length}

projected point preview:
${pointPreview}`
  }

  function formatProjectionDifferencePreview(
    difference: ProjectionDifference,
  ): string {
    const pointPreview =
      difference.points.length === 0
        ? "なし"
        : difference.points
            .map(
              (point) =>
                `${point.id}:
dx: ${formatNumber(point.deltaX)}
dy: ${formatNumber(point.deltaY)}
distance: ${formatNumber(point.distance)}`,
            )
            .join("\n\n")
    const maxPoint = difference.maxDistancePoint

    return `差分確認:
status: ${difference.status}
source idealFace id: ${difference.idealFaceId}
point count: ${difference.points.length}
平均差分: ${formatNullableNumber(difference.averageDistance)}
最大差分: ${formatNullableNumber(difference.maxDistance)}
最大差分点: ${maxPoint ? maxPoint.id : "なし"}

${pointPreview}`
  }

  function buildDebugText(
    frame: FaceFrame | undefined,
    geometry: FaceGeometry | undefined,
    idealFace: IdealFace,
    idealLandmarks3DProjection: IdealLandmarks3DProjectionResult,
    idealFaceProjection: IdealFaceProjectionResult,
    projectionDifference: ProjectionDifference,
    availableIdealFaces: IdealFace[],
    mediaPipeDebug: DetectorDebugInfo | null,
    faceFrameLoopDebug: ReturnType<BeautyEngine["getFaceFrameLoopDebugInfo"]>,
    importState: IdealFaceAssetImportState,
    overlayPixelBounds: OverlayProjectedIdealPixelBoundsSummary | undefined,
  ): string {
    const videoDebug = faceFrameLoopDebug.video

    return `Engine: ${engine.getState()}
Camera: ${camera.getState()}
Detection: ${frame?.detected ? "detected" : "not detected"}
Landmarks: ${frame?.landmarks.length ?? 0}
FPS: ${formatFps(faceFrameFps)}
Loop: ${faceFrameLoopDebug.running ? "running" : "stopped"}
Detect: ${faceFrameLoopDebug.detectCallCount}/${mediaPipeDebug?.detectSuccessCount ?? 0}

MediaPipe:
- debugInstanceId: ${mediaPipeDebug?.debugInstanceId ?? "none"}
- initialized: ${String(mediaPipeDebug?.initialized ?? false)}
- faceLandmarker: ${mediaPipeDebug?.hasFaceLandmarker ? "available" : "none"}
- detectCount: ${mediaPipeDebug?.detectCount ?? 0}
- detectAttempts: ${mediaPipeDebug?.detectAttemptCount ?? 0}
- detectSuccess: ${mediaPipeDebug?.detectSuccessCount ?? 0}
- detectErrors: ${mediaPipeDebug?.detectErrorCount ?? 0}
- lastDetectError: ${mediaPipeDebug?.lastDetectError ?? "none"}
- video: ${mediaPipeDebug?.videoWidth ?? 0}x${mediaPipeDebug?.videoHeight ?? 0}
- lastDetectionTime: ${mediaPipeDebug?.lastDetectionTime ?? "none"}

FaceFrame:
- detected: ${String(frame?.detected ?? false)}
- timestamp: ${frame?.timestamp ?? "none"}
- landmarks: ${frame?.landmarks.length ?? 0}
- blendshapes: ${frame?.blendshapes?.length ?? 0}
- pose.pitch: ${frame ? formatNumber(frame.pose.pitch) : "none"}
- pose.yaw: ${frame ? formatNumber(frame.pose.yaw) : "none"}
- pose.roll: ${frame ? formatNumber(frame.pose.roll) : "none"}

Landmark preview:
${formatLandmarkPreview(frame)}

Blendshape preview:
${formatBlendshapePreview(frame)}

Pose:
${formatPosePreview(frame)}

${formatIdealFacePreview(idealFace)}

IdealFace JSON import:
${formatIdealFaceAssetImportState(importState)}

${formatIdealLandmarks3DProjectionPreview(idealLandmarks3DProjection, frame, overlayPixelBounds)}

${formatIdealFaceProjectionPreview(idealFaceProjection)}

${formatProjectionDifferencePreview(projectionDifference)}
availableIdealFaces: ${availableIdealFaces
  .map((availableIdealFace) => availableIdealFace.metadata.id)
  .join(", ")}

${formatFaceGeometryPreview(geometry)}

Timing:
- faceFrameFps: ${formatFps(faceFrameFps)}
- videoCurrentTime: ${videoDebug?.currentTime ?? 0}
- lastDetectionTime: ${mediaPipeDebug?.lastDetectionTime ?? "none"}

Loop debug:
- running: ${String(faceFrameLoopDebug.running)}
- ticks: ${faceFrameLoopDebug.tickCount}
- detectCalls: ${faceFrameLoopDebug.detectCallCount}
- detectSkips: ${faceFrameLoopDebug.detectSkipCount}
- lastDetectSkipReason: ${faceFrameLoopDebug.lastDetectSkipReason ?? "none"}
- inputType: ${faceFrameLoopDebug.inputType}
- detectorType: ${faceFrameLoopDebug.detectorType}
- hasInput: ${String(faceFrameLoopDebug.hasInput)}
- hasDetector: ${String(faceFrameLoopDebug.hasDetector)}

Video:
- size: ${videoDebug?.videoWidth ?? 0}x${videoDebug?.videoHeight ?? 0}
- readyState: ${videoDebug?.readyState ?? 0}
- paused: ${videoDebug ? String(videoDebug.paused) : "true"}
- ended: ${videoDebug ? String(videoDebug.ended) : "false"}
- srcObject: ${videoDebug?.hasSrcObject ? "available" : "none"}

State log:
${stateLog.join("\n") || "なし"}

Camera:
- error: ${camera.getError() ?? "none"}`
  }

  function appendCameraPreview(): void {
    const input = engine.getInput()

    if (input instanceof HTMLVideoElement) {
      document
        .querySelector("#camera-preview")
        ?.append(input, overlayCanvas)
      drawLandmarkOverlay(
        latestFaceFrame,
        engine.getFaceGeometry(),
        engine.getIdealLandmarks3DProjection(),
        engine.getIdealFaceProjection(),
        engine.getIdealFaceProjectionDifference(),
      )
    }
  }

  function resizeOverlayCanvas(video: HTMLVideoElement): boolean {
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return false
    }

    if (
      overlayCanvas.width !== video.videoWidth ||
      overlayCanvas.height !== video.videoHeight
    ) {
      overlayCanvas.width = video.videoWidth
      overlayCanvas.height = video.videoHeight
    }

    return true
  }

  function calculateOverlayProjectedIdealPixelBounds(
    projection: IdealLandmarks3DProjectionResult,
  ): OverlayProjectedIdealPixelBoundsSummary | undefined {
    if (
      projection.status !== "projected" ||
      projection.landmarks.length === 0 ||
      overlayCanvas.width === 0 ||
      overlayCanvas.height === 0
    ) {
      return undefined
    }

    const first = projection.landmarks[0]
    const initialBounds = {
      xMinPx: first.x * overlayCanvas.width,
      xMaxPx: first.x * overlayCanvas.width,
      yMinPx: first.y * overlayCanvas.height,
      yMaxPx: first.y * overlayCanvas.height,
    }
    const bounds = projection.landmarks.reduce((currentBounds, landmark) => {
      const x = landmark.x * overlayCanvas.width
      const y = landmark.y * overlayCanvas.height

      return {
        xMinPx: Math.min(currentBounds.xMinPx, x),
        xMaxPx: Math.max(currentBounds.xMaxPx, x),
        yMinPx: Math.min(currentBounds.yMinPx, y),
        yMaxPx: Math.max(currentBounds.yMaxPx, y),
      }
    }, initialBounds)
    const widthPx = bounds.xMaxPx - bounds.xMinPx
    const heightPx = bounds.yMaxPx - bounds.yMinPx
    const input = engine.getInput()
    const overlayRect = overlayCanvas.getBoundingClientRect()

    return {
      ...bounds,
      widthPx,
      heightPx,
      aspectRatioPx:
        widthPx > 0 && heightPx > 0 ? widthPx / heightPx : null,
      canvasWidthPx: overlayCanvas.width,
      canvasHeightPx: overlayCanvas.height,
      displayWidthPx: overlayRect.width,
      displayHeightPx: overlayRect.height,
      videoWidthPx: input instanceof HTMLVideoElement ? input.videoWidth : null,
      videoHeightPx: input instanceof HTMLVideoElement ? input.videoHeight : null,
    }
  }

  function clearLandmarkOverlay(): void {
    const context = overlayCanvas.getContext("2d")

    context?.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)
  }

  function drawLandmarkOverlay(
    frame: FaceFrame | undefined,
    geometry: FaceGeometry | undefined,
    idealLandmarks3DProjection: IdealLandmarks3DProjectionResult,
    idealFaceProjection: IdealFaceProjectionResult,
    projectionDifference: ProjectionDifference,
  ): void {
    const input = engine.getInput()

    if (!(input instanceof HTMLVideoElement) || !resizeOverlayCanvas(input)) {
      clearLandmarkOverlay()
      return
    }

    const context = overlayCanvas.getContext("2d")

    if (!context) {
      return
    }

    context.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)

    if (!frame?.detected || frame.landmarks.length === 0) {
      return
    }

    context.fillStyle = "#42f57b"

    frame.landmarks.forEach((landmark) => {
      const x = landmark.x * overlayCanvas.width
      const y = landmark.y * overlayCanvas.height

      context.beginPath()
      context.arc(x, y, 1.5, 0, Math.PI * 2)
      context.fill()
    })

    if (idealLandmarks3DProjection.status === "projected") {
      context.fillStyle = "#c084fc"

      idealLandmarks3DProjection.landmarks.forEach((landmark) => {
        const x = landmark.x * overlayCanvas.width
        const y = landmark.y * overlayCanvas.height

        context.beginPath()
        context.arc(x, y, 1.2, 0, Math.PI * 2)
        context.fill()
      })
    }

    context.fillStyle = "#ff3f81"

    const geometryPoints = [
      geometry?.leftEyeCenter,
      geometry?.rightEyeCenter,
      geometry?.mouthCenter,
      geometry?.noseTip,
      geometry?.chin,
      geometry?.faceCenter,
    ]

    geometryPoints.forEach((point) => {
      if (!point) {
        return
      }

      const x = point.x * overlayCanvas.width
      const y = point.y * overlayCanvas.height

      context.beginPath()
      context.arc(x, y, 4, 0, Math.PI * 2)
      context.fill()
    })

    if (projectionDifference.status === "calculated") {
      context.strokeStyle = "#ffd166"
      context.lineWidth = 2

      projectionDifference.points.forEach((point) => {
        context.beginPath()
        context.moveTo(
          point.current.x * overlayCanvas.width,
          point.current.y * overlayCanvas.height,
        )
        context.lineTo(
          point.projected.x * overlayCanvas.width,
          point.projected.y * overlayCanvas.height,
        )
        context.stroke()
      })
    }

    if (idealFaceProjection.status !== "projected") {
      return
    }

    context.fillStyle = "#00c2ff"
    context.strokeStyle = "#004f66"
    context.lineWidth = 1
    context.font = "12px sans-serif"

    idealFaceProjection.points.forEach((point) => {
      const x = point.x * overlayCanvas.width
      const y = point.y * overlayCanvas.height

      context.beginPath()
      context.arc(x, y, 5, 0, Math.PI * 2)
      context.fill()
      context.stroke()
      context.fillText(point.id, x + 7, y - 7)
    })
  }

  async function copyDebugText(debugText: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(debugText)
      return
    } catch {
      const textarea = document.createElement("textarea")

      textarea.value = debugText
      textarea.readOnly = true
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.append(textarea)
      textarea.select()

      const copied = document.execCommand("copy")

      textarea.remove()

      if (!copied) {
        throw new Error("Copy Debug failed")
      }
    }
  }

  function attachCopyDebugHandler(debugText: string): void {
    document
      .querySelector<HTMLButtonElement>("#copy-debug")
      ?.addEventListener("click", async () => {
        try {
          await copyDebugText(debugText)
          copyStatus = "コピーしました"
        } catch {
          copyStatus = "コピーに失敗しました"
        }

        render()
        appendCameraPreview()
      })
  }

  async function importIdealFaceAssetFile(file: File): Promise<void> {
    idealFaceAssetImportState = {
      status: "loading",
      fileName: file.name,
    }
    render()
    appendCameraPreview()

    try {
      const jsonText = await file.text()
      const result = parseIdealFaceAssetV1Json(jsonText)

      if (!result.ok) {
        idealFaceAssetImportState = {
          status: "error",
          fileName: file.name,
          errors: result.errors.map(translateIdealFaceAssetError),
        }
        render()
        appendCameraPreview()
        return
      }

      const idealFace = idealFaceAssetV1ToIdealFace(result.asset)

      engine.setIdealFace(idealFace)
      idealFaceAssetImportState = {
        status: "success",
        fileName: file.name,
        assetId: result.asset.id,
        assetName: result.asset.name,
        version: result.asset.version,
        schemaVersion: result.asset.schemaVersion,
        generationMethod: result.asset.source.generationMethod,
        landmarkTopology: result.asset.model.landmarkTopology,
        coordinateSpace: result.asset.model.coordinateSpace,
        landmarkCount: result.asset.model.idealLandmarks3D.length,
        createdAt: result.asset.createdAt,
      }
    } catch (error) {
      idealFaceAssetImportState = {
        status: "error",
        fileName: file.name,
        errors: [
          `ファイルの読み込みに失敗しました: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ],
      }
    }

    render()
    appendCameraPreview()
  }

  function attachIdealFaceAssetImportHandler(): void {
    const input = document.querySelector<HTMLInputElement>(
      "#ideal-face-asset-json-input",
    )

    input?.addEventListener("change", () => {
      const file = input.files?.[0]

      if (!file) {
        idealFaceAssetImportState = {
          status: "idle",
        }
        render()
        appendCameraPreview()
        return
      }

      void importIdealFaceAssetFile(file)
    })
  }

  function detailsOpenAttribute(section: DebugSection): string {
    return openDebugSections[section] ? " open" : ""
  }

  function attachDebugDetailsHandlers(): void {
    document
      .querySelectorAll<HTMLDetailsElement>("details[data-debug-section]")
      .forEach((details) => {
        const section = details.dataset.debugSection as DebugSection | undefined

        if (!section) {
          return
        }

        details.addEventListener("toggle", () => {
          openDebugSections[section] = details.open
        })
      })
  }

  function render(): void {
    const currentState = engine.getState()
    const mediaPipeDebug =
      engine.getFaceDetectorDebugInfo() as DetectorDebugInfo | null
    const faceFrameLoopDebug = engine.getFaceFrameLoopDebugInfo()
    const frame = engine.getFaceFrame() ?? latestFaceFrame
    const geometry = engine.getFaceGeometry()
    const idealFace = engine.getIdealFace()
    const idealLandmarks3DProjection = engine.getIdealLandmarks3DProjection()
    const idealFaceProjection = engine.getIdealFaceProjection()
    const projectionDifference = engine.getIdealFaceProjectionDifference()
    const availableIdealFaces = engine.getAvailableIdealFaces()
    const overlayProjectedIdealPixelBounds =
      calculateOverlayProjectedIdealPixelBounds(idealLandmarks3DProjection)
    const debugText = buildDebugText(
      frame,
      geometry,
      idealFace,
      idealLandmarks3DProjection,
      idealFaceProjection,
      projectionDifference,
      availableIdealFaces,
      mediaPipeDebug,
      faceFrameLoopDebug,
      idealFaceAssetImportState,
      overlayProjectedIdealPixelBounds,
    )

    if (lastEngineState !== currentState) {
      stateLog.push(formatEngineState(currentState))
      lastEngineState = currentState
    }

    appRoot.innerHTML = `
      <section>
        <header>
          <h2>Debug summary</h2>
          <button id="copy-debug" type="button">Copy Debug</button>
          <span aria-live="polite">${copyStatus}</span>
        </header>
        <style>
          .preview-container {
            position: relative;
            display: inline-block;
            max-width: 100%;
          }

          .preview-container video {
            display: block;
            max-width: 100%;
            height: auto;
          }

          .preview-container .overlay {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
          }
        </style>
        <pre>Engine: ${formatEngineState(currentState)}
Camera: ${formatCameraState(camera.getState())}
Detection: ${formatDetection(frame)}
Landmarks: ${frame?.landmarks.length ?? 0}
顔姿勢: yaw ${frame ? formatNumber(frame.pose.yaw) : "なし"} / pitch ${frame ? formatNumber(frame.pose.pitch) : "なし"} / roll ${frame ? formatNumber(frame.pose.roll) : "なし"}
IdealFace: ${idealFace.metadata.name} (${idealFace.metadata.id}) / ${idealFace.metadata.version} / controlPoints ${idealFace.model.controlPoints.length} 点 / idealLandmarks3D ${idealFace.model.idealLandmarks3D?.length ?? 0} 点
IdealFace 478 Projection: ${idealLandmarks3DProjection.status} / ${idealLandmarks3DProjection.landmarkCount} 点
Alignment: ${idealLandmarks3DProjection.alignment?.mode ?? "none"} / scale basis ${idealLandmarks3DProjection.alignment?.scaleBasis?.mode ?? "none"} / scale ${formatNullableNumber(idealLandmarks3DProjection.alignment?.scale)} / limiting axis ${idealLandmarks3DProjection.alignment?.scaleBasis?.limitingAxis ?? "none"} / aspectDiff ${formatNullableNumber(idealLandmarks3DProjection.alignment?.aspectRatioDifference)}
Aspect debug: asset ${formatNullableNumber(idealLandmarks3DProjection.debug?.aspectRatio.asset)} / rotated ${formatNullableNumber(idealLandmarks3DProjection.debug?.aspectRatio.rotated)} / aligned ${formatNullableNumber(idealLandmarks3DProjection.debug?.aspectRatio.aligned)} / current ${formatNullableNumber(idealLandmarks3DProjection.debug?.aspectRatio.current)} / overlay ${formatNullableNumber(overlayProjectedIdealPixelBounds?.aspectRatioPx)}
Projection: ${idealFaceProjection.status} / ${idealFaceProjection.points.length} 点
差分: ${projectionDifference.status} / 平均 ${formatNullableNumber(projectionDifference.averageDistance)} / 最大 ${formatNullableNumber(projectionDifference.maxDistance)}
利用可能IdealFace: ${availableIdealFaces.length}
FPS: ${formatFps(faceFrameFps)}
Loop: ${faceFrameLoopDebug.running ? "実行中" : "停止中"}
Detect: ${faceFrameLoopDebug.detectCallCount}/${mediaPipeDebug?.detectSuccessCount ?? 0}</pre>
        <h2>プレビュー</h2>
        <div id="camera-preview" class="preview-container">${camera.getVideo() ? "" : "利用できません"}</div>
        <section>
          <h2>IdealFace JSON 読み込み</h2>
          <label>
            ファイルを選択
            <input id="ideal-face-asset-json-input" type="file" accept="application/json,.json" />
          </label>
          <p>Authoring Tool で export した ideal_face_asset_v1 JSON を読み込みます。</p>
          <p>idealLandmarks3D 478点の Projection 完全対応は次ステップです。現在は asset の読み込みと Engine への反映のみ確認します。</p>
          <pre>${escapeHtml(formatIdealFaceAssetImportState(idealFaceAssetImportState))}</pre>
        </section>
        <details data-debug-section="faceFrame"${detailsOpenAttribute("faceFrame")}>
          <summary>FaceFrame Debug</summary>
          <pre>${escapeHtml(`Frame timestamp: ${frame?.timestamp ?? "なし"}
顔検出: ${formatDetection(frame)}
ランドマーク数: ${frame?.landmarks.length ?? 0}
blendshape数: ${frame?.blendshapes?.length ?? 0}

Landmark preview:
${formatLandmarkPreview(frame)}

Blendshape preview:
${formatBlendshapePreview(frame)}

FacePose:
${formatPosePreview(frame)}`)}</pre>
        </details>
        <details data-debug-section="faceGeometry"${detailsOpenAttribute("faceGeometry")}>
          <summary>FaceGeometry Debug</summary>
          <pre>${escapeHtml(formatFaceGeometryPreview(geometry))}</pre>
        </details>
        <details data-debug-section="idealFace"${detailsOpenAttribute("idealFace")}>
          <summary>IdealFace 確認</summary>
          <pre>${escapeHtml(formatIdealFacePreview(idealFace))}</pre>
        </details>
        <details data-debug-section="idealLandmarks3DProjection"${detailsOpenAttribute("idealLandmarks3DProjection")}>
          <summary>IdealFace 478 Projection 確認</summary>
          <pre>${escapeHtml(formatIdealLandmarks3DProjectionPreview(idealLandmarks3DProjection, frame, overlayProjectedIdealPixelBounds))}</pre>
        </details>
        <details data-debug-section="idealFaceProjection"${detailsOpenAttribute("idealFaceProjection")}>
          <summary>IdealFace Projection 確認</summary>
          <pre>${escapeHtml(formatIdealFaceProjectionPreview(idealFaceProjection))}</pre>
        </details>
        <details data-debug-section="idealFaceProjectionDifference"${detailsOpenAttribute("idealFaceProjectionDifference")}>
          <summary>Projection 差分確認</summary>
          <pre>${escapeHtml(formatProjectionDifferencePreview(projectionDifference))}</pre>
        </details>
        <details data-debug-section="mediaPipe"${detailsOpenAttribute("mediaPipe")}>
          <summary>MediaPipe Debug</summary>
          <pre>${escapeHtml(`initialized: ${String(mediaPipeDebug?.initialized ?? false)}
FaceLandmarker: ${mediaPipeDebug?.hasFaceLandmarker ? "あり" : "なし"}
debugInstanceId: ${mediaPipeDebug?.debugInstanceId ?? "なし"}
detectCount: ${mediaPipeDebug?.detectCount ?? 0}
detectAttemptCount: ${mediaPipeDebug?.detectAttemptCount ?? 0}
detectSuccessCount: ${mediaPipeDebug?.detectSuccessCount ?? 0}
detectErrorCount: ${mediaPipeDebug?.detectErrorCount ?? 0}
lastDetectError: ${mediaPipeDebug?.lastDetectError ?? "なし"}
video: ${mediaPipeDebug?.videoWidth ?? 0}x${mediaPipeDebug?.videoHeight ?? 0}
lastDetectionTime: ${mediaPipeDebug?.lastDetectionTime ?? "なし"}`)}</pre>
        </details>
        <details data-debug-section="loopTiming"${detailsOpenAttribute("loopTiming")}>
          <summary>Loop / Timing Debug</summary>
          <pre>${escapeHtml(`FaceFrameループ: ${faceFrameLoopDebug.running ? "実行中" : "停止中"}
ループ回数: ${faceFrameLoopDebug.tickCount}
Engine detect呼び出し回数: ${faceFrameLoopDebug.detectCallCount}
Engine detectスキップ回数: ${faceFrameLoopDebug.detectSkipCount}
Engine detect最終スキップ理由: ${faceFrameLoopDebug.lastDetectSkipReason ?? "なし"}
入力型: ${faceFrameLoopDebug.inputType}
Detector: ${faceFrameLoopDebug.detectorType}
hasInput: ${String(faceFrameLoopDebug.hasInput)}
hasDetector: ${String(faceFrameLoopDebug.hasDetector)}
FPS: ${formatFps(faceFrameFps)}
Video currentTime: ${faceFrameLoopDebug.video?.currentTime ?? 0}
Video readyState: ${faceFrameLoopDebug.video?.readyState ?? 0}
Video paused: ${faceFrameLoopDebug.video ? String(faceFrameLoopDebug.video.paused) : "true"}
Video srcObject: ${faceFrameLoopDebug.video?.hasSrcObject ? "あり" : "なし"}`)}</pre>
        </details>
        <details data-debug-section="fullDebugText"${detailsOpenAttribute("fullDebugText")}>
          <summary>Full Debug Text</summary>
          <textarea readonly rows="18">${escapeHtml(debugText)}</textarea>
        </details>
      </section>
    `

    attachCopyDebugHandler(debugText)
    attachIdealFaceAssetImportHandler()
    attachDebugDetailsHandlers()
  }

  engine.setFaceDetector(detector)
  window.setInterval(() => {
    render()
    appendCameraPreview()
  }, 1000)

  engine.onFaceFrame((frame) => {
    if (previousFrameTimestamp !== undefined) {
      const elapsedMs = frame.timestamp - previousFrameTimestamp
      faceFrameFps = elapsedMs > 0 ? 1000 / elapsedMs : undefined
    }

    previousFrameTimestamp = frame.timestamp
    latestFaceFrame = frame

    render()
    appendCameraPreview()
  })

  await detector.initialize()

  render()

  await engine.initialize()

  render()

  await engine.start()

  render()

  const cameraStart = camera.start()

  render()

  try {
    await cameraStart
  } catch {
    render()
    return
  }

  const video = camera.getVideo()

  if (video) {
    engine.setInput(video)
    video.width = 640

    render()
    appendCameraPreview()
  }
}

bootstrap()
