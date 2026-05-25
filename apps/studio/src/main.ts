import {
  BeautyEngine,
  MediaPipeFaceDetector,
  getCorrectionProfileOrDefault,
  getCorrectionProfileSource,
  idealFaceAssetV1ToIdealFace,
  parseIdealFaceAssetV1Json,
} from "@bae-ar/engine"
import type {
  BeautyEngineState,
  CorrectionPlanDebug,
  CorrectionVector,
  FaceFrame,
  FaceGeometry,
  FaceGeometryPoint,
  IdealFace,
  IdealLandmarksDifferenceDebug,
  IdealLandmarks3DProjectionResult,
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
  | "idealLandmarksDifference"
  | "correctionPlan"
  | "shapeWarpDebug"
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

type ShapeWarpDebugStatus =
  | "disabled"
  | "not_available"
  | "passthrough"
  | "computed"

type ShapeWarpSamplingMode = "nearest" | "bilinear"

type ShapeWarpDebugSummary = {
  status: ShapeWarpDebugStatus
  enabled: boolean
  mode: "cpu_radial_debug"
  source: "CorrectionPlan"
  correctionPlanStatus: CorrectionPlanDebug["status"]
  candidateVectorCount: number
  usedVectorCount: number
  skippedByDistanceCount: number
  radiusPx: number
  globalWarpStrength: number
  maxVectors: number
  minCorrectionDistance: number
  renderTimeMs: number | null
  canvasWidth: number
  canvasHeight: number
  sampling: ShapeWarpSamplingMode
  reason?: string
}

type ShapeWarpDebugSettings = {
  enabled: boolean
  radiusPx: number
  globalWarpStrength: number
  maxVectors: number
  minCorrectionDistance: number
  sampling: ShapeWarpSamplingMode
}

type ShapeWarpVectorSelection = {
  vectors: CorrectionVector[]
  candidateVectorCount: number
  skippedByDistanceCount: number
}

async function bootstrap(): Promise<void> {
  const engine = new BeautyEngine()
  const camera = new CameraService()
  const detector = new MediaPipeFaceDetector()
  const app = document.querySelector<HTMLDivElement>("#app")
  const overlayCanvas = document.createElement("canvas")
  const processedCanvas = document.createElement("canvas")
  const shapeWarpDebugSettings: ShapeWarpDebugSettings = {
    enabled: false,
    radiusPx: 20,
    globalWarpStrength: 0.35,
    maxVectors: 15,
    minCorrectionDistance: 0.003,
    sampling: "bilinear",
  }
  const stateLog: string[] = []
  let lastEngineState: BeautyEngineState | undefined
  let latestFaceFrame: FaceFrame | undefined
  let previousFrameTimestamp: number | undefined
  let faceFrameFps: number | undefined
  let copyStatus = ""
  let showIdealLandmarkDifferenceLines = false
  let showCorrectionPlanLines = false
  let latestShapeWarpDebugSummary: ShapeWarpDebugSummary =
    createShapeWarpDebugSummary({
      status: "disabled",
      correctionPlanStatus: "not_available",
      reason: "Shape Warp debug is disabled",
    })
  let idealFaceAssetImportState: IdealFaceAssetImportState = {
    status: "idle",
  }
  const openDebugSections: Record<DebugSection, boolean> = {
    faceFrame: false,
    faceGeometry: false,
    idealFace: false,
    idealLandmarks3DProjection: false,
    idealLandmarksDifference: false,
    correctionPlan: false,
    shapeWarpDebug: false,
    mediaPipe: false,
    loopTiming: false,
    fullDebugText: false,
  }

  overlayCanvas.className = "overlay"
  processedCanvas.className = "processed-canvas"

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

  function createShapeWarpDebugSummary(input: {
    status: ShapeWarpDebugStatus
    correctionPlanStatus: CorrectionPlanDebug["status"]
    candidateVectorCount?: number
    usedVectorCount?: number
    skippedByDistanceCount?: number
    renderTimeMs?: number | null
    canvasWidth?: number
    canvasHeight?: number
    reason?: string
  }): ShapeWarpDebugSummary {
    return {
      status: input.status,
      enabled: shapeWarpDebugSettings.enabled,
      mode: "cpu_radial_debug",
      source: "CorrectionPlan",
      correctionPlanStatus: input.correctionPlanStatus,
      candidateVectorCount: input.candidateVectorCount ?? 0,
      usedVectorCount: input.usedVectorCount ?? 0,
      skippedByDistanceCount: input.skippedByDistanceCount ?? 0,
      radiusPx: shapeWarpDebugSettings.radiusPx,
      globalWarpStrength: shapeWarpDebugSettings.globalWarpStrength,
      maxVectors: shapeWarpDebugSettings.maxVectors,
      minCorrectionDistance: shapeWarpDebugSettings.minCorrectionDistance,
      renderTimeMs: input.renderTimeMs ?? null,
      canvasWidth: input.canvasWidth ?? processedCanvas.width,
      canvasHeight: input.canvasHeight ?? processedCanvas.height,
      sampling: shapeWarpDebugSettings.sampling,
      reason: input.reason,
    }
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

  function formatIdealFacePreview(
    idealFace: IdealFace,
    projection: IdealLandmarks3DProjectionResult,
    difference: IdealLandmarksDifferenceDebug,
    correctionPlan: CorrectionPlanDebug,
    shapeWarpDebugSummary: ShapeWarpDebugSummary,
  ): string {
    const correctionProfile = getCorrectionProfileOrDefault(idealFace)
    const correctionProfileSource = getCorrectionProfileSource(idealFace)

    return `IdealFace:
名前: ${idealFace.metadata.name}
preset id: ${idealFace.metadata.id}
version: ${idealFace.metadata.version}
point数: ${idealFace.model.controlPoints.length}
idealLandmarks3D: ${idealFace.model.idealLandmarks3D?.length ?? 0}
座標系: ${idealFace.model.coordinateSpace}
MediaPipe landmarks: ${idealFace.landmarkTopology.mediapipeLandmarkCount}
ideal 478 landmarks生成: ${idealFace.landmarkTopology.canGenerateIdealLandmarks ? "可能" : "未実装"}
478 Projection: ${projection.status}
sameUnitLandmarks: ${projection.sameUnitLandmarks.length}
imageLandmarks: ${projection.imageLandmarks.length}
current-vs-ideal difference: ${difference.status}
correctionProfile:
  source: ${correctionProfileSource}
  schemaVersion: ${correctionProfile.schemaVersion}
  mode: ${correctionProfile.mode}
  defaultStrength: ${formatNumber(correctionProfile.defaultStrength)}
  maxCorrectionDistance: ${formatNumber(correctionProfile.maxCorrectionDistance)}
  landmarkStrength count: ${correctionProfile.landmarkStrengths.length}
CorrectionPlan: ${correctionPlan.status}
Shape Warp v1 debug: ${shapeWarpDebugSummary.status}
Production Shape Warp: not_implemented`
  }

  function formatIdealFaceAssetImportState(
    state: IdealFaceAssetImportState,
  ): string {
    if (state.status === "idle") {
      return `読み込み状態: 未選択
ideal_face_asset_v1 JSON を読み込むと、顔検出後に IdealFace 478 Projection を確認できます。`
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

ideal_face_asset_v1 JSON を読み込むと、顔検出後に IdealFace 478 Projection を確認できます。`
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

same-unit / image-normalized 座標の Projection debug は、顔検出後に確認できます。`
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
    const coordinate = debug?.coordinate

    return `Bounds / Aspect Ratio:
asset: ${formatLandmarkBounds(debug?.assetBounds)}
rotated: ${formatLandmarkBounds(debug?.rotatedBounds)}
aligned same-unit: ${formatLandmarkBounds(debug?.alignedBounds)}
image-normalized: ${formatLandmarkBounds(debug?.imageBounds)}
current: ${formatLandmarkBounds(debug?.currentBounds)}
overlay px: ${formatOverlayPixelBounds(overlayPixelBounds)}
aspect asset / rotated / aligned / image / current / currentMinusAligned / currentMinusImage: ${formatNullableNumber(debug?.aspectRatio.asset)} / ${formatNullableNumber(debug?.aspectRatio.rotated)} / ${formatNullableNumber(debug?.aspectRatio.aligned)} / ${formatNullableNumber(debug?.aspectRatio.image)} / ${formatNullableNumber(debug?.aspectRatio.current)} / ${formatNullableNumber(debug?.aspectRatio.currentMinusAligned)} / ${formatNullableNumber(debug?.aspectRatio.currentMinusImage)}

Coordinate spaces:
same-unit: ${formatLandmarkBounds(coordinate?.sameUnitBounds)}
image-normalized: ${formatLandmarkBounds(coordinate?.imageBounds)}
current: ${formatLandmarkBounds(coordinate?.currentBounds)}
video aspect: ${formatNullableNumber(coordinate?.videoAspectRatio)}
conversion: ${coordinate?.conversionMode ?? "なし"}
fallback: ${coordinate ? String(coordinate.fallbackUsed) : "なし"}${coordinate?.reason ? `
reason: ${coordinate.reason}` : ""}`
  }

  function formatLandmarkBounds(
    bounds: {
      xMin: number
      xMax: number
      yMin: number
      yMax: number
      width: number
      height: number
      aspectRatio: number | null
      zMin?: number
      zMax?: number
      zRange?: number
    } | undefined,
  ): string {
    if (!bounds) {
      return "なし"
    }

    const zText =
      bounds.zMin !== undefined &&
      bounds.zMax !== undefined &&
      bounds.zRange !== undefined
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
sameUnitLandmarks: ${projection.sameUnitLandmarks.length}
imageLandmarks: ${projection.imageLandmarks.length}
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
sameUnitLandmarks: ${projection.sameUnitLandmarks.length}
imageLandmarks: ${projection.imageLandmarks.length}
idealFace: ${projection.sourceIdealFaceName ?? "なし"} (${projection.sourceIdealFaceId ?? "なし"})
pose: ${frame ? `yaw ${formatNumber(frame.pose.yaw)} / pitch ${formatNumber(frame.pose.pitch)} / roll ${formatNumber(frame.pose.roll)}` : "なし"}
${formatProjectionAlignment(projection.alignment)}
${formatProjectionSummary(projection.summary)}
${formatProjectionBoundsDebug(projection, overlayPixelBounds)}`
  }

  function formatIdealLandmarksDifferencePreview(
    difference: IdealLandmarksDifferenceDebug,
  ): string {
    const topDifferencePreview =
      difference.topDifferences.length === 0
        ? "なし"
        : difference.topDifferences
            .map(
              (item) =>
                `Landmark[${item.index}]:
current: x=${formatNumber(item.current.x)} y=${formatNumber(item.current.y)} z=${formatNullableNumber(item.current.z)}
projectedIdeal: x=${formatNumber(item.projectedIdeal.x)} y=${formatNumber(item.projectedIdeal.y)} z=${formatNullableNumber(item.projectedIdeal.z)}
dx: ${formatNumber(item.deltaX)}
dy: ${formatNumber(item.deltaY)}
distance: ${formatNumber(item.distance)}`,
            )
            .join("\n\n")

    return `current-vs-projected ideal 478点差分:
status: ${difference.status}
reason: ${difference.reason ?? "なし"}
current landmark count: ${difference.currentLandmarkCount}
projected ideal landmark count: ${difference.projectedIdealLandmarkCount}
matched landmark count: ${difference.matchedLandmarkCount}
average distance: ${formatNullableNumber(difference.averageDistance)}
max distance: ${formatNullableNumber(difference.maxDistance)}
max distance landmark index: ${difference.maxDistanceLandmarkIndex ?? "なし"}
average dx: ${formatNullableNumber(difference.averageDeltaX)}
average dy: ${formatNullableNumber(difference.averageDeltaY)}

top differences:
${topDifferencePreview}`
  }

  function formatCorrectionPlanPreview(
    correctionPlan: CorrectionPlanDebug,
  ): string {
    const topVectorPreview =
      correctionPlan.topVectors.length === 0
        ? "なし"
        : correctionPlan.topVectors
            .map(
              (vector) =>
                `Landmark[${vector.index}]:
current: x=${formatNumber(vector.current.x)} y=${formatNumber(vector.current.y)} z=${formatNullableNumber(vector.current.z)}
projectedIdeal: x=${formatNumber(vector.projectedIdeal.x)} y=${formatNumber(vector.projectedIdeal.y)} z=${formatNullableNumber(vector.projectedIdeal.z)}
raw dx: ${formatNumber(vector.rawDeltaX)}
raw dy: ${formatNumber(vector.rawDeltaY)}
raw distance: ${formatNumber(vector.rawDistance)}
strength: ${formatNumber(vector.strength)}
confidence: ${formatNumber(vector.confidence)}
correction dx: ${formatNumber(vector.correctionDeltaX)}
correction dy: ${formatNumber(vector.correctionDeltaY)}
correction distance: ${formatNumber(vector.correctionDistance)}
target: x=${formatNumber(vector.target.x)} y=${formatNumber(vector.target.y)}
clamped: ${String(vector.clamped)}`,
            )
            .join("\n\n")

    return `CorrectionPlan v1 debug
status: ${correctionPlan.status}
reason: ${correctionPlan.reason ?? "なし"}
source correctionProfile: ${correctionPlan.sourceCorrectionProfile}
point count: ${correctionPlan.pointCount}
default strength: ${formatNumber(correctionPlan.config.defaultStrength)}
max correction distance: ${formatNumber(correctionPlan.config.maxCorrectionDistance)}
landmarkStrength count: ${correctionPlan.config.landmarkStrengthCount}
top vector count: ${correctionPlan.config.topVectorCount}
average raw distance: ${formatNullableNumber(correctionPlan.summary.averageRawDistance)}
max raw distance: ${formatNullableNumber(correctionPlan.summary.maxRawDistance)}
max raw distance landmark index: ${correctionPlan.summary.maxRawDistanceLandmarkIndex ?? "なし"}
average correction distance: ${formatNullableNumber(correctionPlan.summary.averageCorrectionDistance)}
max correction distance: ${formatNullableNumber(correctionPlan.summary.maxCorrectionDistance)}
max correction distance landmark index: ${correctionPlan.summary.maxCorrectionDistanceLandmarkIndex ?? "なし"}
clamped count: ${correctionPlan.summary.clampedCount}
average strength: ${formatNullableNumber(correctionPlan.summary.averageStrength)}

top correction vectors:
${topVectorPreview}`
  }

  function formatShapeWarpDebugPreview(
    summary: ShapeWarpDebugSummary,
  ): string {
    return `Shape Warp v1 debug:
status: ${summary.status}
enabled: ${String(summary.enabled)}
mode: ${summary.mode}
source: ${summary.source}
correctionPlan status: ${summary.correctionPlanStatus}
radiusPx: ${formatNumber(summary.radiusPx)}
globalWarpStrength: ${formatNumber(summary.globalWarpStrength)}
maxVectors: ${summary.maxVectors}
minCorrectionDistance: ${formatNumber(summary.minCorrectionDistance)}
candidateVectorCount: ${summary.candidateVectorCount}
usedVectorCount: ${summary.usedVectorCount}
skippedByDistanceCount: ${summary.skippedByDistanceCount}
sampling: ${summary.sampling}
render time ms: ${formatNullableNumber(summary.renderTimeMs)}
canvas size: ${summary.canvasWidth}x${summary.canvasHeight}
debug prototype: true
production shape warp: not_implemented
reason: ${summary.reason ?? "なし"}

これは Studio processed preview 用の debug prototype です。
本番品質 warp / WebGL / mesh warp / パフォーマンス最適化は未実装です。`
  }

  function buildDebugText(
    frame: FaceFrame | undefined,
    geometry: FaceGeometry | undefined,
    idealFace: IdealFace,
    idealLandmarks3DProjection: IdealLandmarks3DProjectionResult,
    idealLandmarksDifference: IdealLandmarksDifferenceDebug,
    correctionPlan: CorrectionPlanDebug,
    shapeWarpDebugSummary: ShapeWarpDebugSummary,
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

${formatIdealFacePreview(idealFace, idealLandmarks3DProjection, idealLandmarksDifference, correctionPlan, shapeWarpDebugSummary)}

IdealFace JSON import:
${formatIdealFaceAssetImportState(importState)}

${formatIdealLandmarks3DProjectionPreview(idealLandmarks3DProjection, frame, overlayPixelBounds)}

${formatIdealLandmarksDifferencePreview(idealLandmarksDifference)}

${formatCorrectionPlanPreview(correctionPlan)}

${formatShapeWarpDebugPreview(shapeWarpDebugSummary)}

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
        .querySelector("#source-preview")
        ?.append(input, overlayCanvas)
      document.querySelector("#processed-preview")?.append(processedCanvas)
      drawLandmarkOverlay(
        latestFaceFrame,
        engine.getFaceGeometry(),
        engine.getIdealLandmarks3DProjection(),
        engine.getIdealLandmarksDifference(),
        engine.getCorrectionPlan(),
      )
      drawProcessedPreview(input, latestFaceFrame, engine.getCorrectionPlan())
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

  function resizeProcessedCanvas(video: HTMLVideoElement): boolean {
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return false
    }

    if (
      processedCanvas.width !== video.videoWidth ||
      processedCanvas.height !== video.videoHeight
    ) {
      processedCanvas.width = video.videoWidth
      processedCanvas.height = video.videoHeight
    }

    return true
  }

  function drawProcessedPreview(
    video: HTMLVideoElement,
    frame: FaceFrame | undefined,
    correctionPlan: CorrectionPlanDebug,
  ): void {
    if (!resizeProcessedCanvas(video)) {
      clearProcessedPreview()
      latestShapeWarpDebugSummary = createShapeWarpDebugSummary({
        status: "not_available",
        correctionPlanStatus: correctionPlan.status,
        reason: "processed canvas size is not available",
      })
      return
    }

    const context = processedCanvas.getContext("2d", {
      willReadFrequently: true,
    })

    if (!context) {
      latestShapeWarpDebugSummary = createShapeWarpDebugSummary({
        status: "not_available",
        correctionPlanStatus: correctionPlan.status,
        reason: "processed canvas context is not available",
      })
      return
    }

    context.drawImage(video, 0, 0, processedCanvas.width, processedCanvas.height)

    if (!shapeWarpDebugSettings.enabled) {
      latestShapeWarpDebugSummary = createShapeWarpDebugSummary({
        status: "disabled",
        correctionPlanStatus: correctionPlan.status,
        canvasWidth: processedCanvas.width,
        canvasHeight: processedCanvas.height,
        reason: "Shape Warp debug is disabled",
      })
      return
    }

    if (!frame?.detected || frame.landmarks.length === 0) {
      latestShapeWarpDebugSummary = createShapeWarpDebugSummary({
        status: "passthrough",
        correctionPlanStatus: correctionPlan.status,
        canvasWidth: processedCanvas.width,
        canvasHeight: processedCanvas.height,
        reason: "FaceFrame is not detected; original video is drawn",
      })
      return
    }

    if (correctionPlan.status !== "computed") {
      latestShapeWarpDebugSummary = createShapeWarpDebugSummary({
        status: "not_available",
        correctionPlanStatus: correctionPlan.status,
        canvasWidth: processedCanvas.width,
        canvasHeight: processedCanvas.height,
        reason:
          correctionPlan.reason ??
          "CorrectionPlan is not computed; original video is drawn",
      })
      return
    }

    const vectorSelection = selectShapeWarpVectors(correctionPlan)

    if (vectorSelection.vectors.length === 0) {
      latestShapeWarpDebugSummary = createShapeWarpDebugSummary({
        status: "passthrough",
        correctionPlanStatus: correctionPlan.status,
        candidateVectorCount: vectorSelection.candidateVectorCount,
        skippedByDistanceCount: vectorSelection.skippedByDistanceCount,
        canvasWidth: processedCanvas.width,
        canvasHeight: processedCanvas.height,
        reason: "No correction vectors are available for Shape Warp debug",
      })
      return
    }

    const startedAt = performance.now()
    applyCpuRadialShapeWarp(context, vectorSelection.vectors)
    latestShapeWarpDebugSummary = createShapeWarpDebugSummary({
      status: "computed",
      correctionPlanStatus: correctionPlan.status,
      candidateVectorCount: vectorSelection.candidateVectorCount,
      usedVectorCount: vectorSelection.vectors.length,
      skippedByDistanceCount: vectorSelection.skippedByDistanceCount,
      renderTimeMs: performance.now() - startedAt,
      canvasWidth: processedCanvas.width,
      canvasHeight: processedCanvas.height,
    })
  }

  function clearProcessedPreview(): void {
    const context = processedCanvas.getContext("2d")

    context?.clearRect(0, 0, processedCanvas.width, processedCanvas.height)
  }

  function selectShapeWarpVectors(
    correctionPlan: CorrectionPlanDebug,
  ): ShapeWarpVectorSelection {
    const candidateVectors = correctionPlan.vectors.filter(
      (vector) =>
        vector.correctionDistance >=
        shapeWarpDebugSettings.minCorrectionDistance,
    )

    return {
      vectors: [...candidateVectors]
        .sort(
          (current, next) =>
            next.correctionDistance - current.correctionDistance,
        )
        .slice(0, shapeWarpDebugSettings.maxVectors),
      candidateVectorCount: candidateVectors.length,
      skippedByDistanceCount:
        correctionPlan.vectors.length - candidateVectors.length,
    }
  }

  function applyCpuRadialShapeWarp(
    context: CanvasRenderingContext2D,
    vectors: CorrectionVector[],
  ): void {
    const width = processedCanvas.width
    const height = processedCanvas.height
    const radiusPx = shapeWarpDebugSettings.radiusPx
    const radiusPxSquared = radiusPx * radiusPx
    const globalWarpStrength = shapeWarpDebugSettings.globalWarpStrength
    const sourceImageData = context.getImageData(0, 0, width, height)
    const outputImageData = context.createImageData(width, height)
    const vectorInputs = vectors.map((vector) => ({
      currentPxX: vector.current.x * width,
      currentPxY: vector.current.y * height,
      correctionPxX: vector.correctionDeltaX * width,
      correctionPxY: vector.correctionDeltaY * height,
    }))

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let accumulatedWarpX = 0
        let accumulatedWarpY = 0

        vectorInputs.forEach((vector) => {
          const dx = x - vector.currentPxX
          const dy = y - vector.currentPxY
          const distanceSquared = dx * dx + dy * dy

          if (distanceSquared >= radiusPxSquared) {
            return
          }

          const distance = Math.sqrt(distanceSquared)
          const falloff = 1 - distance / radiusPx
          const weight = falloff * falloff

          accumulatedWarpX += vector.correctionPxX * weight
          accumulatedWarpY += vector.correctionPxY * weight
        })

        const sourceX = clampPixelCoordinate(
          x - accumulatedWarpX * globalWarpStrength,
          width,
        )
        const sourceY = clampPixelCoordinate(
          y - accumulatedWarpY * globalWarpStrength,
          height,
        )
        const outputIndex = (y * width + x) * 4

        if (shapeWarpDebugSettings.sampling === "bilinear") {
          writeBilinearSample(
            sourceImageData.data,
            outputImageData.data,
            width,
            height,
            sourceX,
            sourceY,
            outputIndex,
          )
        } else {
          writeNearestSample(
            sourceImageData.data,
            outputImageData.data,
            width,
            sourceX,
            sourceY,
            outputIndex,
          )
        }
      }
    }

    context.putImageData(outputImageData, 0, 0)
  }

  function writeNearestSample(
    sourceData: Uint8ClampedArray,
    outputData: Uint8ClampedArray,
    width: number,
    sourceX: number,
    sourceY: number,
    outputIndex: number,
  ): void {
    const sourceIndex =
      (Math.round(sourceY) * width + Math.round(sourceX)) * 4

    outputData[outputIndex] = sourceData[sourceIndex]
    outputData[outputIndex + 1] = sourceData[sourceIndex + 1]
    outputData[outputIndex + 2] = sourceData[sourceIndex + 2]
    outputData[outputIndex + 3] = sourceData[sourceIndex + 3]
  }

  function writeBilinearSample(
    sourceData: Uint8ClampedArray,
    outputData: Uint8ClampedArray,
    width: number,
    height: number,
    sourceX: number,
    sourceY: number,
    outputIndex: number,
  ): void {
    const x0 = Math.floor(sourceX)
    const y0 = Math.floor(sourceY)
    const x1 = Math.min(width - 1, x0 + 1)
    const y1 = Math.min(height - 1, y0 + 1)
    const xWeight = sourceX - x0
    const yWeight = sourceY - y0
    const topLeftIndex = (y0 * width + x0) * 4
    const topRightIndex = (y0 * width + x1) * 4
    const bottomLeftIndex = (y1 * width + x0) * 4
    const bottomRightIndex = (y1 * width + x1) * 4

    for (let channel = 0; channel < 4; channel += 1) {
      const top =
        sourceData[topLeftIndex + channel] * (1 - xWeight) +
        sourceData[topRightIndex + channel] * xWeight
      const bottom =
        sourceData[bottomLeftIndex + channel] * (1 - xWeight) +
        sourceData[bottomRightIndex + channel] * xWeight

      outputData[outputIndex + channel] =
        top * (1 - yWeight) + bottom * yWeight
    }
  }

  function clampPixelCoordinate(value: number, size: number): number {
    return Math.max(0, Math.min(size - 1, value))
  }

  function calculateOverlayProjectedIdealPixelBounds(
    projection: IdealLandmarks3DProjectionResult,
  ): OverlayProjectedIdealPixelBoundsSummary | undefined {
    if (
      projection.status !== "projected" ||
      projection.imageLandmarks.length === 0 ||
      overlayCanvas.width === 0 ||
      overlayCanvas.height === 0
    ) {
      return undefined
    }

    const first = projection.imageLandmarks[0]
    const initialBounds = {
      xMinPx: first.x * overlayCanvas.width,
      xMaxPx: first.x * overlayCanvas.width,
      yMinPx: first.y * overlayCanvas.height,
      yMaxPx: first.y * overlayCanvas.height,
    }
    const bounds = projection.imageLandmarks.reduce((currentBounds, landmark) => {
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
    idealLandmarksDifference: IdealLandmarksDifferenceDebug,
    correctionPlan: CorrectionPlanDebug,
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

      idealLandmarks3DProjection.imageLandmarks.forEach((landmark) => {
        const x = landmark.x * overlayCanvas.width
        const y = landmark.y * overlayCanvas.height

        context.beginPath()
        context.arc(x, y, 1.2, 0, Math.PI * 2)
        context.fill()
      })
    }

    if (showIdealLandmarkDifferenceLines) {
      context.strokeStyle = "#f97316"
      context.lineWidth = 1.5

      idealLandmarksDifference.topDifferences.forEach((item) => {
        context.beginPath()
        context.moveTo(
          item.current.x * overlayCanvas.width,
          item.current.y * overlayCanvas.height,
        )
        context.lineTo(
          item.projectedIdeal.x * overlayCanvas.width,
          item.projectedIdeal.y * overlayCanvas.height,
        )
        context.stroke()
      })
    }

    if (showCorrectionPlanLines) {
      context.strokeStyle = "#38bdf8"
      context.lineWidth = 1.5

      correctionPlan.topVectors.forEach((vector) => {
        context.beginPath()
        context.moveTo(
          vector.current.x * overlayCanvas.width,
          vector.current.y * overlayCanvas.height,
        )
        context.lineTo(
          vector.target.x * overlayCanvas.width,
          vector.target.y * overlayCanvas.height,
        )
        context.stroke()
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

  function attachIdealLandmarkDifferenceOverlayHandler(): void {
    document
      .querySelector<HTMLInputElement>("#ideal-landmark-difference-lines")
      ?.addEventListener("change", (event) => {
        showIdealLandmarkDifferenceLines =
          event.currentTarget instanceof HTMLInputElement &&
          event.currentTarget.checked
        render()
        appendCameraPreview()
      })
  }

  function attachCorrectionPlanOverlayHandler(): void {
    document
      .querySelector<HTMLInputElement>("#correction-plan-lines")
      ?.addEventListener("change", (event) => {
        showCorrectionPlanLines =
          event.currentTarget instanceof HTMLInputElement &&
          event.currentTarget.checked
        render()
        appendCameraPreview()
      })
  }

  function attachShapeWarpDebugHandlers(): void {
    document
      .querySelector<HTMLInputElement>("#shape-warp-debug-enabled")
      ?.addEventListener("change", (event) => {
        shapeWarpDebugSettings.enabled =
          event.currentTarget instanceof HTMLInputElement &&
          event.currentTarget.checked
        render()
        appendCameraPreview()
      })

    document
      .querySelector<HTMLInputElement>("#shape-warp-radius-px")
      ?.addEventListener("change", (event) => {
        shapeWarpDebugSettings.radiusPx = parseDebugNumberInput(
          event.currentTarget,
          shapeWarpDebugSettings.radiusPx,
          1,
          128,
        )
        render()
        appendCameraPreview()
      })

    document
      .querySelector<HTMLInputElement>("#shape-warp-global-strength")
      ?.addEventListener("change", (event) => {
        shapeWarpDebugSettings.globalWarpStrength = parseDebugNumberInput(
          event.currentTarget,
          shapeWarpDebugSettings.globalWarpStrength,
          0,
          2,
        )
        render()
        appendCameraPreview()
      })

    document
      .querySelector<HTMLInputElement>("#shape-warp-max-vectors")
      ?.addEventListener("change", (event) => {
        shapeWarpDebugSettings.maxVectors = Math.round(
          parseDebugNumberInput(
            event.currentTarget,
            shapeWarpDebugSettings.maxVectors,
            1,
            478,
          ),
        )
        render()
        appendCameraPreview()
      })

    document
      .querySelector<HTMLInputElement>("#shape-warp-min-correction-distance")
      ?.addEventListener("change", (event) => {
        shapeWarpDebugSettings.minCorrectionDistance = parseDebugNumberInput(
          event.currentTarget,
          shapeWarpDebugSettings.minCorrectionDistance,
          0,
          0.05,
        )
        render()
        appendCameraPreview()
      })

    document
      .querySelector<HTMLSelectElement>("#shape-warp-sampling")
      ?.addEventListener("change", (event) => {
        if (!(event.currentTarget instanceof HTMLSelectElement)) {
          return
        }

        shapeWarpDebugSettings.sampling =
          event.currentTarget.value === "nearest" ? "nearest" : "bilinear"
        render()
        appendCameraPreview()
      })
  }

  function parseDebugNumberInput(
    input: EventTarget | null,
    fallback: number,
    min: number,
    max: number,
  ): number {
    if (!(input instanceof HTMLInputElement)) {
      return fallback
    }

    const parsedValue = Number(input.value)

    if (!Number.isFinite(parsedValue)) {
      return fallback
    }

    return Math.max(min, Math.min(max, parsedValue))
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
    const idealLandmarksDifference = engine.getIdealLandmarksDifference()
    const correctionPlan = engine.getCorrectionPlan()
    const correctionProfile = getCorrectionProfileOrDefault(idealFace)
    const correctionProfileSource = getCorrectionProfileSource(idealFace)
    const availableIdealFaces = engine.getAvailableIdealFaces()
    const overlayProjectedIdealPixelBounds =
      calculateOverlayProjectedIdealPixelBounds(idealLandmarks3DProjection)
    const debugText = buildDebugText(
      frame,
      geometry,
      idealFace,
      idealLandmarks3DProjection,
      idealLandmarksDifference,
      correctionPlan,
      latestShapeWarpDebugSummary,
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
          .preview-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 16px;
          }

          .preview-container {
            position: relative;
            display: inline-block;
            max-width: 100%;
          }

          .preview-container video,
          .preview-container canvas.processed-canvas {
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
Aspect debug: asset ${formatNullableNumber(idealLandmarks3DProjection.debug?.aspectRatio.asset)} / rotated ${formatNullableNumber(idealLandmarks3DProjection.debug?.aspectRatio.rotated)} / aligned ${formatNullableNumber(idealLandmarks3DProjection.debug?.aspectRatio.aligned)} / image ${formatNullableNumber(idealLandmarks3DProjection.debug?.aspectRatio.image)} / current ${formatNullableNumber(idealLandmarks3DProjection.debug?.aspectRatio.current)} / overlay ${formatNullableNumber(overlayProjectedIdealPixelBounds?.aspectRatioPx)}
Coordinate conversion: ${idealLandmarks3DProjection.debug?.coordinate?.conversionMode ?? "なし"} / videoAspect ${formatNullableNumber(idealLandmarks3DProjection.debug?.coordinate?.videoAspectRatio)} / fallback ${idealLandmarks3DProjection.debug?.coordinate ? String(idealLandmarks3DProjection.debug.coordinate.fallbackUsed) : "なし"}
478点差分: ${idealLandmarksDifference.status} / matched ${idealLandmarksDifference.matchedLandmarkCount} / 平均 ${formatNullableNumber(idealLandmarksDifference.averageDistance)} / 最大 ${formatNullableNumber(idealLandmarksDifference.maxDistance)} / 最大index ${idealLandmarksDifference.maxDistanceLandmarkIndex ?? "なし"}
correctionProfile: ${correctionProfileSource} / ${correctionProfile.schemaVersion} / ${correctionProfile.mode} / default ${formatNumber(correctionProfile.defaultStrength)} / maxDistance ${formatNumber(correctionProfile.maxCorrectionDistance)} / landmarkStrengths ${correctionProfile.landmarkStrengths.length}
CorrectionPlan: ${correctionPlan.status} / points ${correctionPlan.pointCount} / avgCorrection ${formatNullableNumber(correctionPlan.summary.averageCorrectionDistance)} / maxCorrection ${formatNullableNumber(correctionPlan.summary.maxCorrectionDistance)} / clamped ${correctionPlan.summary.clampedCount}
Shape Warp v1 debug: ${latestShapeWarpDebugSummary.status} / enabled ${String(latestShapeWarpDebugSummary.enabled)} / candidates ${latestShapeWarpDebugSummary.candidateVectorCount} / used ${latestShapeWarpDebugSummary.usedVectorCount} / skipped ${latestShapeWarpDebugSummary.skippedByDistanceCount} / radius ${formatNumber(latestShapeWarpDebugSummary.radiusPx)} / strength ${formatNumber(latestShapeWarpDebugSummary.globalWarpStrength)} / minDistance ${formatNumber(latestShapeWarpDebugSummary.minCorrectionDistance)} / sampling ${latestShapeWarpDebugSummary.sampling} / render ${formatNullableNumber(latestShapeWarpDebugSummary.renderTimeMs)} ms
Production Shape Warp: not_implemented
利用可能IdealFace: ${availableIdealFaces.length}
FPS: ${formatFps(faceFrameFps)}
Loop: ${faceFrameLoopDebug.running ? "実行中" : "停止中"}
Detect: ${faceFrameLoopDebug.detectCallCount}/${mediaPipeDebug?.detectSuccessCount ?? 0}</pre>
        <h2>プレビュー</h2>
        <label>
          <input id="ideal-landmark-difference-lines" type="checkbox" ${showIdealLandmarkDifferenceLines ? "checked" : ""} />
          478点差分線を表示
        </label>
        <label>
          <input id="correction-plan-lines" type="checkbox" ${showCorrectionPlanLines ? "checked" : ""} />
          CorrectionPlan補正線を表示
        </label>
        <fieldset>
          <legend>Shape Warp Debug</legend>
          <p>Shape Warp Debug は CorrectionPlan の補正ベクトルを画像に仮反映する検証用です。本番品質の warp 方式ではありません。</p>
          <label>
            <input id="shape-warp-debug-enabled" type="checkbox" ${shapeWarpDebugSettings.enabled ? "checked" : ""} />
            Processed previewでShape Warp debugを有効化
          </label>
          <label>
            radiusPx
            <input id="shape-warp-radius-px" type="number" min="1" max="128" step="1" value="${shapeWarpDebugSettings.radiusPx}" />
          </label>
          <label>
            globalWarpStrength
            <input id="shape-warp-global-strength" type="number" min="0" max="2" step="0.1" value="${shapeWarpDebugSettings.globalWarpStrength}" />
          </label>
          <label>
            maxVectors
            <input id="shape-warp-max-vectors" type="number" min="1" max="478" step="1" value="${shapeWarpDebugSettings.maxVectors}" />
          </label>
          <label>
            minCorrectionDistance
            <input id="shape-warp-min-correction-distance" type="number" min="0" max="0.05" step="0.001" value="${shapeWarpDebugSettings.minCorrectionDistance}" />
          </label>
          <label>
            sampling
            <select id="shape-warp-sampling">
              <option value="bilinear" ${shapeWarpDebugSettings.sampling === "bilinear" ? "selected" : ""}>bilinear</option>
              <option value="nearest" ${shapeWarpDebugSettings.sampling === "nearest" ? "selected" : ""}>nearest</option>
            </select>
          </label>
        </fieldset>
        <div class="preview-grid">
          <section>
            <h3>Source preview</h3>
            <div id="source-preview" class="preview-container">${camera.getVideo() ? "" : "利用できません"}</div>
          </section>
          <section>
            <h3>Processed preview</h3>
            <div id="processed-preview" class="preview-container">${camera.getVideo() ? "" : "利用できません"}</div>
          </section>
        </div>
        <section>
          <h2>IdealFace JSON 読み込み</h2>
          <label>
            ファイルを選択
            <input id="ideal-face-asset-json-input" type="file" accept="application/json,.json" />
          </label>
          <p>Authoring Tool で export した ideal_face_asset_v1 JSON を読み込みます。</p>
          <p>顔検出後に IdealFace 478 Projection と same-unit / image-normalized 座標 debug を確認できます。</p>
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
          <pre>${escapeHtml(formatIdealFacePreview(idealFace, idealLandmarks3DProjection, idealLandmarksDifference, correctionPlan, latestShapeWarpDebugSummary))}</pre>
        </details>
        <details data-debug-section="idealLandmarks3DProjection"${detailsOpenAttribute("idealLandmarks3DProjection")}>
          <summary>IdealFace 478 Projection 確認</summary>
          <pre>${escapeHtml(formatIdealLandmarks3DProjectionPreview(idealLandmarks3DProjection, frame, overlayProjectedIdealPixelBounds))}</pre>
        </details>
        <details data-debug-section="idealLandmarksDifference"${detailsOpenAttribute("idealLandmarksDifference")}>
          <summary>current-vs-projected ideal 478点差分確認</summary>
          <pre>${escapeHtml(formatIdealLandmarksDifferencePreview(idealLandmarksDifference))}</pre>
        </details>
        <details data-debug-section="correctionPlan"${detailsOpenAttribute("correctionPlan")}>
          <summary>CorrectionPlan v1 Debug</summary>
          <pre>${escapeHtml(formatCorrectionPlanPreview(correctionPlan))}</pre>
        </details>
        <details data-debug-section="shapeWarpDebug"${detailsOpenAttribute("shapeWarpDebug")}>
          <summary>Shape Warp v1 Debug</summary>
          <pre>${escapeHtml(formatShapeWarpDebugPreview(latestShapeWarpDebugSummary))}</pre>
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
    attachIdealLandmarkDifferenceOverlayHandler()
    attachCorrectionPlanOverlayHandler()
    attachShapeWarpDebugHandlers()
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
