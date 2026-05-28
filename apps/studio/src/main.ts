import {
  BeautyEngine,
  MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT,
  MEDIAPIPE_FACE_MESH_TRIANGLE_COUNT,
  MEDIAPIPE_FACE_MESH_TRIANGLES,
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
  LandmarkGroupsDebugSummary,
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

type ShapeWarpDebugPreset = "off" | "weak" | "normal" | "strong" | "custom"

type ShapeWarpDebugMode = "cpu_radial_debug" | "webgl_mesh_debug"

type ShapeWarpWebglStatus = "available" | "unavailable"

type ShapeWarpTextureFiltering = "linear" | "nearest"

type ShapeWarpDebugSummary = {
  status: ShapeWarpDebugStatus
  preset: ShapeWarpDebugPreset
  enabled: boolean
  mode: ShapeWarpDebugMode
  source: "CorrectionPlan"
  correctionPlanStatus: CorrectionPlanDebug["status"]
  candidateVectorCount: number
  usedVectorCount: number
  skippedByDistanceCount: number
  radiusPx: number
  globalWarpStrength: number
  maxVectors: number
  minCorrectionDistance: number
  meshWarpStrength: number
  textureFiltering: ShapeWarpTextureFiltering
  showWireframe: boolean
  renderTimeMs: number | null
  averageRenderTimeMs: number | null
  canvasWidth: number
  canvasHeight: number
  sampling: ShapeWarpSamplingMode
  usedVectors: CorrectionVector[]
  topology: "mediapipe_face_mesh" | null
  topologyLandmarkCount: number | null
  triangleCount: number | null
  usedMeshVertexCount: number | null
  correctionPlanPointCount: number | null
  textureSource: "video" | "source_canvas" | null
  webgl: ShapeWarpWebglStatus | null
  webglError: string | null
  reason?: string
}

type ShapeWarpDebugSettings = {
  preset: ShapeWarpDebugPreset
  enabled: boolean
  mode: ShapeWarpDebugMode
  radiusPx: number
  globalWarpStrength: number
  maxVectors: number
  minCorrectionDistance: number
  sampling: ShapeWarpSamplingMode
  meshWarpStrength: number
  textureFiltering: ShapeWarpTextureFiltering
}

type ShapeWarpVectorSelection = {
  vectors: CorrectionVector[]
  candidateVectorCount: number
  skippedByDistanceCount: number
}

type WebglMeshWarpRenderResult =
  | {
      status: "computed"
      renderTimeMs: number
      usedVectors: CorrectionVector[]
      usedMeshVertexCount: number
      webglStatus: "available"
      webglError: null
    }
  | {
      status: "not_available" | "passthrough"
      reason: string
      usedVectors: CorrectionVector[]
      usedMeshVertexCount: number
      webglStatus: ShapeWarpWebglStatus
      webglError: string | null
    }

type WebglMeshWarpRenderer = {
  canvas: HTMLCanvasElement
  gl: WebGLRenderingContext
  program: WebGLProgram
  positionBuffer: WebGLBuffer
  texCoordBuffer: WebGLBuffer
  indexBuffer: WebGLBuffer
  texture: WebGLTexture
  positionLocation: number
  texCoordLocation: number
  textureLocation: WebGLUniformLocation
}

type ShapeWarpPresetConfig = Omit<
  ShapeWarpDebugSettings,
  "preset" | "mode"
>

const SHAPE_WARP_NORMAL_SETTINGS: ShapeWarpPresetConfig = {
  enabled: true,
  radiusPx: 20,
  globalWarpStrength: 0.35,
  maxVectors: 15,
  minCorrectionDistance: 0.003,
  sampling: "bilinear",
  meshWarpStrength: 1,
  textureFiltering: "linear",
}

const SHAPE_WARP_DEBUG_PRESETS: Record<
  Exclude<ShapeWarpDebugPreset, "custom">,
  Partial<ShapeWarpPresetConfig>
> = {
  off: {
    enabled: false,
  },
  weak: {
    enabled: true,
    radiusPx: 16,
    globalWarpStrength: 0.2,
    maxVectors: 10,
    minCorrectionDistance: 0.004,
    sampling: "bilinear",
    meshWarpStrength: 0.5,
    textureFiltering: "linear",
  },
  normal: SHAPE_WARP_NORMAL_SETTINGS,
  strong: {
    enabled: true,
    radiusPx: 28,
    globalWarpStrength: 0.65,
    maxVectors: 25,
    minCorrectionDistance: 0.002,
    sampling: "bilinear",
    meshWarpStrength: 1.75,
    textureFiltering: "linear",
  },
}

async function bootstrap(): Promise<void> {
  const engine = new BeautyEngine()
  const camera = new CameraService()
  const detector = new MediaPipeFaceDetector()
  const app = document.querySelector<HTMLDivElement>("#app")
  const overlayCanvas = document.createElement("canvas")
  const processedCanvas = document.createElement("canvas")
  const webglMeshCanvas = document.createElement("canvas")
  const shapeWarpDebugSettings: ShapeWarpDebugSettings = {
    preset: "off",
    enabled: false,
    mode: "cpu_radial_debug",
    radiusPx: SHAPE_WARP_NORMAL_SETTINGS.radiusPx,
    globalWarpStrength: SHAPE_WARP_NORMAL_SETTINGS.globalWarpStrength,
    maxVectors: SHAPE_WARP_NORMAL_SETTINGS.maxVectors,
    minCorrectionDistance: SHAPE_WARP_NORMAL_SETTINGS.minCorrectionDistance,
    sampling: SHAPE_WARP_NORMAL_SETTINGS.sampling,
    meshWarpStrength: SHAPE_WARP_NORMAL_SETTINGS.meshWarpStrength,
    textureFiltering: SHAPE_WARP_NORMAL_SETTINGS.textureFiltering,
  }
  const stateLog: string[] = []
  let lastEngineState: BeautyEngineState | undefined
  let latestFaceFrame: FaceFrame | undefined
  let previousFrameTimestamp: number | undefined
  let faceFrameFps: number | undefined
  let copyStatus = ""
  let showIdealLandmarkDifferenceLines = false
  let showCorrectionPlanLines = false
  let showShapeWarpUsedVectors = false
  let showWebglMeshWireframe = false
  let shapeWarpRenderTimeAverageMs: number | null = null
  let webglMeshWarpRenderer: WebglMeshWarpRenderer | null = null
  let webglMeshWarpRendererError: string | null = null
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
    mode?: ShapeWarpDebugMode
    candidateVectorCount?: number
    usedVectorCount?: number
    skippedByDistanceCount?: number
    renderTimeMs?: number | null
    usedVectors?: CorrectionVector[]
    canvasWidth?: number
    canvasHeight?: number
    topology?: "mediapipe_face_mesh" | null
    topologyLandmarkCount?: number | null
    triangleCount?: number | null
    usedMeshVertexCount?: number | null
    correctionPlanPointCount?: number | null
    textureSource?: "video" | "source_canvas" | null
    webgl?: ShapeWarpWebglStatus | null
    webglError?: string | null
    reason?: string
  }): ShapeWarpDebugSummary {
    return {
      status: input.status,
      preset: shapeWarpDebugSettings.preset,
      enabled: shapeWarpDebugSettings.enabled,
      mode: input.mode ?? shapeWarpDebugSettings.mode,
      source: "CorrectionPlan",
      correctionPlanStatus: input.correctionPlanStatus,
      candidateVectorCount: input.candidateVectorCount ?? 0,
      usedVectorCount: input.usedVectorCount ?? 0,
      skippedByDistanceCount: input.skippedByDistanceCount ?? 0,
      radiusPx: shapeWarpDebugSettings.radiusPx,
      globalWarpStrength: shapeWarpDebugSettings.globalWarpStrength,
      maxVectors: shapeWarpDebugSettings.maxVectors,
      minCorrectionDistance: shapeWarpDebugSettings.minCorrectionDistance,
      meshWarpStrength: shapeWarpDebugSettings.meshWarpStrength,
      textureFiltering: shapeWarpDebugSettings.textureFiltering,
      showWireframe: showWebglMeshWireframe,
      renderTimeMs: input.renderTimeMs ?? null,
      averageRenderTimeMs: shapeWarpRenderTimeAverageMs,
      canvasWidth: input.canvasWidth ?? processedCanvas.width,
      canvasHeight: input.canvasHeight ?? processedCanvas.height,
      sampling: shapeWarpDebugSettings.sampling,
      usedVectors: input.usedVectors ?? [],
      topology: input.topology ?? null,
      topologyLandmarkCount: input.topologyLandmarkCount ?? null,
      triangleCount: input.triangleCount ?? null,
      usedMeshVertexCount: input.usedMeshVertexCount ?? null,
      correctionPlanPointCount: input.correctionPlanPointCount ?? null,
      textureSource: input.textureSource ?? null,
      webgl: input.webgl ?? null,
      webglError: input.webglError ?? null,
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

  function formatLandmarkGroupsSummary(
    summary: LandmarkGroupsDebugSummary,
  ): string {
    const groups =
      summary.groups.length === 0
        ? "  なし"
        : summary.groups
            .map(
              (group) =>
                `  ${group.id}: count ${group.indexCount} / purpose ${group.purpose ?? "なし"}`,
            )
            .join("\n")

    return `landmarkGroups:
  status: ${summary.status}
  source: ${summary.source ?? "none"}
  schemaVersion: ${summary.schemaVersion ?? "none"}
  topology: ${summary.topology ?? "none"}
  group count: ${summary.groupCount}
groups:
${groups}`
  }

  function formatExpressionGroupScale(
    correctionPlan: CorrectionPlanDebug,
    groupId: string,
  ): string {
    const groupScale = correctionPlan.expressionAttenuation.groupScales[groupId]

    return groupScale ? formatNumber(groupScale.smoothedScale) : "なし"
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
${formatLandmarkGroupsSummary(correctionPlan.landmarkGroups)}
expressionAttenuation: ${correctionPlan.expressionAttenuation.status} / ${correctionPlan.expressionAttenuation.source}
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
    const expressionGroupScales = Object.values(
      correctionPlan.expressionAttenuation.groupScales,
    )
      .map(
        (groupScale) =>
          `${groupScale.group}: target ${formatNumber(groupScale.targetScale)} / smoothed ${formatNumber(groupScale.smoothedScale)}`,
      )
      .join("\n")
    const expressionActiveRules =
      correctionPlan.expressionAttenuation.activeRules.length === 0
        ? "なし"
        : correctionPlan.expressionAttenuation.activeRules
            .map(
              (rule) =>
                `${rule.id}: score ${formatNullableNumber(rule.score)} -> scale ${formatNumber(rule.targetScale)} (${rule.affectedLandmarkGroups.join(", ")})`,
            )
            .join("\n")
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
base strength: ${formatNumber(vector.baseStrength)}
expression scale: ${formatNumber(vector.expressionStrengthScale)}
final strength: ${formatNumber(vector.finalStrength)}
strength: ${formatNumber(vector.strength)}
affected groups: ${vector.affectedGroups.length > 0 ? vector.affectedGroups.join(", ") : "なし"}
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
${formatLandmarkGroupsSummary(correctionPlan.landmarkGroups)}
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
average base strength: ${formatNullableNumber(correctionPlan.summary.averageBaseStrength)}
average final strength: ${formatNullableNumber(correctionPlan.summary.averageFinalStrength)}
min expression scale: ${formatNullableNumber(correctionPlan.summary.minExpressionScale)}

Expression attenuation:
status: ${correctionPlan.expressionAttenuation.status}
reason: ${correctionPlan.expressionAttenuation.reason ?? "なし"}
source: ${correctionPlan.expressionAttenuation.source}
smoothing: ${correctionPlan.expressionAttenuation.smoothing.enabled ? "enabled" : "disabled"}
halfLifeMs: ${correctionPlan.expressionAttenuation.smoothing.halfLifeMs ?? "なし"}
group scales:
${expressionGroupScales}
active rules:
${expressionActiveRules}

top correction vectors:
${topVectorPreview}`
  }

  function formatShapeWarpDebugPreview(
    summary: ShapeWarpDebugSummary,
  ): string {
    const usedVectorPreview =
      summary.usedVectors.length === 0
        ? "なし"
        : summary.usedVectors
            .slice(0, 10)
            .map(
              (vector) =>
                `Landmark[${vector.index}]:
correction distance: ${formatNumber(vector.correctionDistance)}
correction dx: ${formatNumber(vector.correctionDeltaX)}
correction dy: ${formatNumber(vector.correctionDeltaY)}
target: x=${formatNumber(vector.target.x)} y=${formatNumber(vector.target.y)}
current: x=${formatNumber(vector.current.x)} y=${formatNumber(vector.current.y)}
strength: ${formatNumber(vector.strength)}
clamped: ${String(vector.clamped)}`,
            )
            .join("\n\n")

    const cpuRadialSettings = `CPU radial debug settings:
radiusPx: ${formatNumber(summary.radiusPx)}
globalWarpStrength: ${formatNumber(summary.globalWarpStrength)}
maxVectors: ${summary.maxVectors}
minCorrectionDistance: ${formatNumber(summary.minCorrectionDistance)}
sampling: ${summary.sampling}`
    const webglMeshSettings = `WebGL mesh debug settings:
meshWarpStrength: ${formatNumber(summary.meshWarpStrength)}
texture filtering: ${summary.textureFiltering}
showWireframe: ${String(summary.showWireframe)}
topology: ${summary.topology ?? "なし"}
topologyLandmarkCount: ${summary.topologyLandmarkCount ?? "なし"}
triangleCount: ${summary.triangleCount ?? "なし"}
usedMeshVertexCount: ${summary.usedMeshVertexCount ?? "なし"}
correctionPlanPointCount: ${summary.correctionPlanPointCount ?? "なし"}
texture source: ${summary.textureSource ?? "なし"}
webgl: ${summary.webgl ?? "なし"}
webgl error: ${summary.webglError ?? "none"}`

    return `Shape Warp v1 debug:
status: ${summary.status}
preset: ${summary.preset}
enabled: ${String(summary.enabled)}
mode: ${summary.mode}
source: ${summary.source}
correctionPlan status: ${summary.correctionPlanStatus}
candidateVectorCount: ${summary.candidateVectorCount}
usedVectorCount: ${summary.usedVectorCount}
skippedByDistanceCount: ${summary.skippedByDistanceCount}
${summary.mode === "webgl_mesh_debug" ? webglMeshSettings : cpuRadialSettings}
render time ms: ${formatNullableNumber(summary.renderTimeMs)}
average render time ms: ${formatNullableNumber(summary.averageRenderTimeMs)}
canvas size: ${summary.canvasWidth}x${summary.canvasHeight}
debug prototype: true
production shape warp: not_implemented
reason: ${summary.reason ?? "なし"}

used warp vectors:
${usedVectorPreview}

これは Studio processed preview 用の debug prototype です。
本番品質 warp / Runtime renderer integration / パフォーマンス最適化は未実装です。`
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
      drawProcessedPreview(input, latestFaceFrame, engine.getCorrectionPlan())
      drawLandmarkOverlay(
        latestFaceFrame,
        engine.getFaceGeometry(),
        engine.getIdealLandmarks3DProjection(),
        engine.getIdealLandmarksDifference(),
        engine.getCorrectionPlan(),
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

    if (shapeWarpDebugSettings.mode === "webgl_mesh_debug") {
      const renderResult = renderWebglMeshWarp(video, context, correctionPlan)

      if (renderResult.status === "computed") {
        recordShapeWarpRenderTime(renderResult.renderTimeMs)
      }

      latestShapeWarpDebugSummary = createShapeWarpDebugSummary({
        status: renderResult.status,
        correctionPlanStatus: correctionPlan.status,
        mode: "webgl_mesh_debug",
        candidateVectorCount: correctionPlan.vectors.length,
        usedVectorCount: renderResult.usedVectors.length,
        skippedByDistanceCount: 0,
        renderTimeMs:
          renderResult.status === "computed" ? renderResult.renderTimeMs : null,
        usedVectors: renderResult.usedVectors,
        canvasWidth: processedCanvas.width,
        canvasHeight: processedCanvas.height,
        topology: "mediapipe_face_mesh",
        topologyLandmarkCount: MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT,
        triangleCount: MEDIAPIPE_FACE_MESH_TRIANGLE_COUNT,
        usedMeshVertexCount: renderResult.usedMeshVertexCount,
        correctionPlanPointCount: correctionPlan.pointCount,
        textureSource: "video",
        webgl: renderResult.webglStatus,
        webglError: renderResult.webglError,
        reason:
          renderResult.status === "computed" ? undefined : renderResult.reason,
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
    const renderTimeMs = performance.now() - startedAt

    recordShapeWarpRenderTime(renderTimeMs)
    latestShapeWarpDebugSummary = createShapeWarpDebugSummary({
      status: "computed",
      correctionPlanStatus: correctionPlan.status,
      candidateVectorCount: vectorSelection.candidateVectorCount,
      usedVectorCount: vectorSelection.vectors.length,
      skippedByDistanceCount: vectorSelection.skippedByDistanceCount,
      renderTimeMs,
      usedVectors: vectorSelection.vectors,
      canvasWidth: processedCanvas.width,
      canvasHeight: processedCanvas.height,
    })
  }

  function recordShapeWarpRenderTime(renderTimeMs: number): void {
    shapeWarpRenderTimeAverageMs =
      shapeWarpRenderTimeAverageMs === null
        ? renderTimeMs
        : shapeWarpRenderTimeAverageMs * 0.8 + renderTimeMs * 0.2
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

  function renderWebglMeshWarp(
    video: HTMLVideoElement,
    outputContext: CanvasRenderingContext2D,
    correctionPlan: CorrectionPlanDebug,
  ): WebglMeshWarpRenderResult {
    const indexedVectors = new Map<number, CorrectionVector>()

    correctionPlan.vectors.forEach((vector) => {
      indexedVectors.set(vector.index, vector)
    })

    const meshVectors: CorrectionVector[] = []
    const targetPositions = new Float32Array(
      MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT * 2,
    )
    const textureCoordinates = new Float32Array(
      MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT * 2,
    )

    for (
      let index = 0;
      index < MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT;
      index += 1
    ) {
      const vector = indexedVectors.get(index)

      if (!vector) {
        return {
          status: "not_available",
          reason: `CorrectionVector[${index}] is missing for WebGL mesh topology`,
          usedVectors: meshVectors,
          usedMeshVertexCount: meshVectors.length,
          webglStatus: "unavailable",
          webglError: `CorrectionVector[${index}] is missing`,
        }
      }

      meshVectors.push(vector)

      const positionOffset = index * 2
      const targetX =
        vector.current.x +
        (vector.target.x - vector.current.x) *
          shapeWarpDebugSettings.meshWarpStrength
      const targetY =
        vector.current.y +
        (vector.target.y - vector.current.y) *
          shapeWarpDebugSettings.meshWarpStrength

      targetPositions[positionOffset] = targetX * 2 - 1
      targetPositions[positionOffset + 1] = 1 - targetY * 2
      textureCoordinates[positionOffset] = vector.current.x
      textureCoordinates[positionOffset + 1] = 1 - vector.current.y
    }

    const renderer = getWebglMeshWarpRenderer()

    if (!renderer) {
      return {
        status: "not_available",
        reason:
          webglMeshWarpRendererError ??
          "WebGL mesh warp renderer is not available",
        usedVectors: meshVectors,
        usedMeshVertexCount: meshVectors.length,
        webglStatus: "unavailable",
        webglError: webglMeshWarpRendererError,
      }
    }

    resizeWebglMeshCanvas(renderer.canvas)

    const startedAt = performance.now()
    const renderError = drawWebglMeshWarpFrame(
      renderer,
      video,
      targetPositions,
      textureCoordinates,
    )

    if (renderError) {
      return {
        status: "not_available",
        reason: renderError,
        usedVectors: meshVectors,
        usedMeshVertexCount: meshVectors.length,
        webglStatus: "unavailable",
        webglError: renderError,
      }
    }

    outputContext.drawImage(
      renderer.canvas,
      0,
      0,
      processedCanvas.width,
      processedCanvas.height,
    )

    if (showWebglMeshWireframe) {
      drawWebglMeshWireframeOverlay(outputContext, meshVectors)
    }

    return {
      status: "computed",
      renderTimeMs: performance.now() - startedAt,
      usedVectors: meshVectors,
      usedMeshVertexCount: meshVectors.length,
      webglStatus: "available",
      webglError: null,
    }
  }

  function drawWebglMeshWireframeOverlay(
    context: CanvasRenderingContext2D,
    vectors: CorrectionVector[],
  ): void {
    context.save()
    context.strokeStyle = "rgba(250, 204, 21, 0.55)"
    context.lineWidth = 0.6

    for (
      let index = 0;
      index < MEDIAPIPE_FACE_MESH_TRIANGLES.length;
      index += 3
    ) {
      const first = vectors[MEDIAPIPE_FACE_MESH_TRIANGLES[index]]
      const second = vectors[MEDIAPIPE_FACE_MESH_TRIANGLES[index + 1]]
      const third = vectors[MEDIAPIPE_FACE_MESH_TRIANGLES[index + 2]]

      if (!first || !second || !third) {
        continue
      }

      context.beginPath()
      moveToWarpedTarget(context, first)
      lineToWarpedTarget(context, second)
      lineToWarpedTarget(context, third)
      context.closePath()
      context.stroke()
    }

    context.restore()
  }

  function moveToWarpedTarget(
    context: CanvasRenderingContext2D,
    vector: CorrectionVector,
  ): void {
    const point = getWebglMeshWarpTargetPoint(vector)

    context.moveTo(
      point.x * processedCanvas.width,
      point.y * processedCanvas.height,
    )
  }

  function lineToWarpedTarget(
    context: CanvasRenderingContext2D,
    vector: CorrectionVector,
  ): void {
    const point = getWebglMeshWarpTargetPoint(vector)

    context.lineTo(
      point.x * processedCanvas.width,
      point.y * processedCanvas.height,
    )
  }

  function getWebglMeshWarpTargetPoint(vector: CorrectionVector): {
    x: number
    y: number
  } {
    return {
      x:
        vector.current.x +
        (vector.target.x - vector.current.x) *
          shapeWarpDebugSettings.meshWarpStrength,
      y:
        vector.current.y +
        (vector.target.y - vector.current.y) *
          shapeWarpDebugSettings.meshWarpStrength,
    }
  }

  function getWebglMeshWarpRenderer(): WebglMeshWarpRenderer | null {
    if (webglMeshWarpRenderer) {
      return webglMeshWarpRenderer
    }

    if (webglMeshWarpRendererError) {
      return null
    }

    const gl = webglMeshCanvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
    })

    if (!gl) {
      webglMeshWarpRendererError = "WebGL context is unavailable"
      return null
    }

    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;

      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `
    const fragmentShaderSource = `
      precision mediump float;

      uniform sampler2D u_texture;
      varying vec2 v_texCoord;

      void main() {
        gl_FragColor = texture2D(u_texture, v_texCoord);
      }
    `
    const vertexShader = compileWebglShader(
      gl,
      gl.VERTEX_SHADER,
      vertexShaderSource,
    )
    const fragmentShader = compileWebglShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource,
    )

    if (!vertexShader || !fragmentShader) {
      webglMeshWarpRendererError =
        webglMeshWarpRendererError ?? "WebGL shader compile failed"
      return null
    }

    const program = gl.createProgram()

    if (!program) {
      webglMeshWarpRendererError = "WebGL program creation failed"
      return null
    }

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      webglMeshWarpRendererError =
        gl.getProgramInfoLog(program) ?? "WebGL program link failed"
      return null
    }

    const positionBuffer = gl.createBuffer()
    const texCoordBuffer = gl.createBuffer()
    const indexBuffer = gl.createBuffer()
    const texture = gl.createTexture()
    const textureLocation = gl.getUniformLocation(program, "u_texture")

    if (
      !positionBuffer ||
      !texCoordBuffer ||
      !indexBuffer ||
      !texture ||
      !textureLocation
    ) {
      webglMeshWarpRendererError =
        "WebGL buffer, texture, or uniform creation failed"
      return null
    }

    const positionLocation = gl.getAttribLocation(program, "a_position")
    const texCoordLocation = gl.getAttribLocation(program, "a_texCoord")

    if (positionLocation < 0 || texCoordLocation < 0) {
      webglMeshWarpRendererError = "WebGL attribute location is unavailable"
      return null
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(MEDIAPIPE_FACE_MESH_TRIANGLES),
      gl.STATIC_DRAW,
    )

    webglMeshWarpRenderer = {
      canvas: webglMeshCanvas,
      gl,
      program,
      positionBuffer,
      texCoordBuffer,
      indexBuffer,
      texture,
      positionLocation,
      texCoordLocation,
      textureLocation,
    }

    return webglMeshWarpRenderer
  }

  function compileWebglShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string,
  ): WebGLShader | null {
    const shader = gl.createShader(type)

    if (!shader) {
      webglMeshWarpRendererError = "WebGL shader creation failed"
      return null
    }

    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      webglMeshWarpRendererError =
        gl.getShaderInfoLog(shader) ?? "WebGL shader compile failed"
      gl.deleteShader(shader)
      return null
    }

    return shader
  }

  function resizeWebglMeshCanvas(canvas: HTMLCanvasElement): void {
    if (
      canvas.width !== processedCanvas.width ||
      canvas.height !== processedCanvas.height
    ) {
      canvas.width = processedCanvas.width
      canvas.height = processedCanvas.height
    }
  }

  function drawWebglMeshWarpFrame(
    renderer: WebglMeshWarpRenderer,
    video: HTMLVideoElement,
    targetPositions: Float32Array,
    textureCoordinates: Float32Array,
  ): string | null {
    const { gl } = renderer

    try {
      gl.viewport(0, 0, renderer.canvas.width, renderer.canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(renderer.program)
      gl.disable(gl.BLEND)

      gl.bindBuffer(gl.ARRAY_BUFFER, renderer.positionBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, targetPositions, gl.DYNAMIC_DRAW)
      gl.enableVertexAttribArray(renderer.positionLocation)
      gl.vertexAttribPointer(
        renderer.positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0,
      )

      gl.bindBuffer(gl.ARRAY_BUFFER, renderer.texCoordBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, textureCoordinates, gl.DYNAMIC_DRAW)
      gl.enableVertexAttribArray(renderer.texCoordLocation)
      gl.vertexAttribPointer(
        renderer.texCoordLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0,
      )

      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, renderer.texture)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      const textureFilter =
        shapeWarpDebugSettings.textureFiltering === "nearest"
          ? gl.NEAREST
          : gl.LINEAR

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, textureFilter)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, textureFilter)
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        video,
      )
      gl.uniform1i(renderer.textureLocation, 0)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, renderer.indexBuffer)
      gl.drawElements(
        gl.TRIANGLES,
        MEDIAPIPE_FACE_MESH_TRIANGLES.length,
        gl.UNSIGNED_SHORT,
        0,
      )
    } catch (error) {
      return error instanceof Error ? error.message : String(error)
    }

    const webglError = gl.getError()

    if (webglError !== gl.NO_ERROR) {
      return `WebGL error ${webglError}`
    }

    return null
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

    if (showShapeWarpUsedVectors) {
      context.strokeStyle = "#facc15"
      context.fillStyle = "#facc15"
      context.lineWidth = 2
      context.font = "10px sans-serif"

      const shouldDrawVectorIndex =
        latestShapeWarpDebugSummary.usedVectors.length <= 80

      latestShapeWarpDebugSummary.usedVectors.forEach((vector) => {
        const currentX = vector.current.x * overlayCanvas.width
        const currentY = vector.current.y * overlayCanvas.height
        const targetX = vector.target.x * overlayCanvas.width
        const targetY = vector.target.y * overlayCanvas.height

        context.beginPath()
        context.arc(currentX, currentY, 2.5, 0, Math.PI * 2)
        context.fill()
        context.beginPath()
        context.moveTo(currentX, currentY)
        context.lineTo(targetX, targetY)
        context.stroke()

        if (shouldDrawVectorIndex) {
          context.fillText(String(vector.index), currentX + 4, currentY - 4)
        }
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
      textarea.style.left = "-9999px"
      textarea.style.opacity = "0"
      document.body.append(textarea)
      textarea.focus()
      textarea.select()
      textarea.setSelectionRange(0, textarea.value.length)

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

  function attachShapeWarpUsedVectorsOverlayHandler(): void {
    document
      .querySelector<HTMLInputElement>("#shape-warp-used-vectors")
      ?.addEventListener("change", (event) => {
        showShapeWarpUsedVectors =
          event.currentTarget instanceof HTMLInputElement &&
          event.currentTarget.checked
        render()
        appendCameraPreview()
      })
  }

  function attachShapeWarpDebugHandlers(): void {
    document
      .querySelectorAll<HTMLInputElement>('input[name="shape-warp-mode"]')
      .forEach((input) => {
        input.addEventListener("change", (event) => {
          if (
            !(event.currentTarget instanceof HTMLInputElement) ||
            !event.currentTarget.checked
          ) {
            return
          }

          shapeWarpDebugSettings.mode = parseShapeWarpDebugMode(
            event.currentTarget.value,
          )
          render()
          appendCameraPreview()
        })
      })

    document
      .querySelectorAll<HTMLInputElement>('input[name="shape-warp-preset"]')
      .forEach((input) => {
        input.addEventListener("change", (event) => {
          if (
            !(event.currentTarget instanceof HTMLInputElement) ||
            !event.currentTarget.checked
          ) {
            return
          }

          applyShapeWarpDebugPreset(
            parseShapeWarpDebugPreset(event.currentTarget.value),
          )
          render()
          appendCameraPreview()
        })
      })

    document
      .querySelector<HTMLInputElement>("#shape-warp-debug-enabled")
      ?.addEventListener("change", (event) => {
        markShapeWarpDebugCustom()
        shapeWarpDebugSettings.enabled =
          event.currentTarget instanceof HTMLInputElement &&
          event.currentTarget.checked
        render()
        appendCameraPreview()
      })

    document
      .querySelector<HTMLInputElement>("#shape-warp-radius-px")
      ?.addEventListener("change", (event) => {
        markShapeWarpDebugCustom()
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
        markShapeWarpDebugCustom()
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
        markShapeWarpDebugCustom()
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
        markShapeWarpDebugCustom()
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
      .querySelectorAll<HTMLInputElement>('input[name="shape-warp-sampling"]')
      .forEach((input) => {
        input.addEventListener("change", (event) => {
          if (
            !(event.currentTarget instanceof HTMLInputElement) ||
            !event.currentTarget.checked
          ) {
            return
          }

          markShapeWarpDebugCustom()
          shapeWarpDebugSettings.sampling =
            event.currentTarget.value === "nearest" ? "nearest" : "bilinear"
          render()
          appendCameraPreview()
        })
      })

    document
      .querySelector<HTMLInputElement>("#shape-warp-mesh-strength")
      ?.addEventListener("change", (event) => {
        markShapeWarpDebugCustom()
        shapeWarpDebugSettings.meshWarpStrength = parseDebugNumberInput(
          event.currentTarget,
          shapeWarpDebugSettings.meshWarpStrength,
          0,
          3,
        )
        render()
        appendCameraPreview()
      })

    document
      .querySelectorAll<HTMLInputElement>(
        'input[name="shape-warp-texture-filtering"]',
      )
      .forEach((input) => {
        input.addEventListener("change", (event) => {
          if (
            !(event.currentTarget instanceof HTMLInputElement) ||
            !event.currentTarget.checked
          ) {
            return
          }

          markShapeWarpDebugCustom()
          shapeWarpDebugSettings.textureFiltering =
            event.currentTarget.value === "nearest" ? "nearest" : "linear"
          render()
          appendCameraPreview()
        })
      })

    document
      .querySelector<HTMLInputElement>("#shape-warp-webgl-wireframe")
      ?.addEventListener("change", (event) => {
        showWebglMeshWireframe =
          event.currentTarget instanceof HTMLInputElement &&
          event.currentTarget.checked
        render()
        appendCameraPreview()
      })
  }

  function applyShapeWarpDebugPreset(preset: ShapeWarpDebugPreset): void {
    shapeWarpDebugSettings.preset = preset

    if (preset === "custom") {
      return
    }

    const presetConfig = SHAPE_WARP_DEBUG_PRESETS[preset]

    shapeWarpDebugSettings.enabled =
      presetConfig.enabled ?? shapeWarpDebugSettings.enabled
    shapeWarpDebugSettings.radiusPx =
      presetConfig.radiusPx ?? shapeWarpDebugSettings.radiusPx
    shapeWarpDebugSettings.globalWarpStrength =
      presetConfig.globalWarpStrength ??
      shapeWarpDebugSettings.globalWarpStrength
    shapeWarpDebugSettings.maxVectors =
      presetConfig.maxVectors ?? shapeWarpDebugSettings.maxVectors
    shapeWarpDebugSettings.minCorrectionDistance =
      presetConfig.minCorrectionDistance ??
      shapeWarpDebugSettings.minCorrectionDistance
    shapeWarpDebugSettings.sampling =
      presetConfig.sampling ?? shapeWarpDebugSettings.sampling
    shapeWarpDebugSettings.meshWarpStrength =
      presetConfig.meshWarpStrength ?? shapeWarpDebugSettings.meshWarpStrength
    shapeWarpDebugSettings.textureFiltering =
      presetConfig.textureFiltering ?? shapeWarpDebugSettings.textureFiltering
  }

  function markShapeWarpDebugCustom(): void {
    shapeWarpDebugSettings.preset = "custom"
  }

  function parseShapeWarpDebugPreset(value: string): ShapeWarpDebugPreset {
    if (
      value === "off" ||
      value === "weak" ||
      value === "normal" ||
      value === "strong" ||
      value === "custom"
    ) {
      return value
    }

    return "custom"
  }

  function parseShapeWarpDebugMode(value: string): ShapeWarpDebugMode {
    return value === "webgl_mesh_debug"
      ? "webgl_mesh_debug"
      : "cpu_radial_debug"
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

  function formatProcessedPreviewLabel(): string {
    if (!shapeWarpDebugSettings.enabled) {
      return "original（元映像）"
    }

    return shapeWarpDebugSettings.mode === "webgl_mesh_debug"
      ? `WebGL mesh debug（WebGLメッシュデバッグ） / ${formatShapeWarpPresetLabel(shapeWarpDebugSettings.preset)}`
      : `CPU radial debug（CPU放射状デバッグ） / ${formatShapeWarpPresetLabel(shapeWarpDebugSettings.preset)}`
  }

  function formatShapeWarpPresetLabel(
    preset: ShapeWarpDebugPreset,
  ): string {
    const labels: Record<ShapeWarpDebugPreset, string> = {
      off: "off（無効）",
      weak: "weak（弱）",
      normal: "normal（標準）",
      strong: "strong（強）",
      custom: "custom（手動設定）",
    }

    return labels[preset]
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

  function isShapeWarpDebugControlActive(): boolean {
    const activeElement = document.activeElement

    return (
      activeElement instanceof HTMLElement &&
      Boolean(activeElement.closest("[data-shape-warp-debug-controls]"))
    )
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

    const statusSummary = `Engine（エンジン）: ${formatEngineState(currentState)}
Camera（カメラ）: ${formatCameraState(camera.getState())}
Detection（検出）: ${formatDetection(frame)}
Landmarks（ランドマーク）: ${frame?.landmarks.length ?? 0}
顔姿勢: yaw ${frame ? formatNumber(frame.pose.yaw) : "なし"} / pitch ${frame ? formatNumber(frame.pose.pitch) : "なし"} / roll ${frame ? formatNumber(frame.pose.roll) : "なし"}
IdealFace: ${idealFace.metadata.name} (${idealFace.metadata.id}) / ${idealFace.metadata.version} / controlPoints ${idealFace.model.controlPoints.length} 点 / idealLandmarks3D ${idealFace.model.idealLandmarks3D?.length ?? 0} 点
IdealFace 478 Projection（理想顔の投影）: ${idealLandmarks3DProjection.status} / ${idealLandmarks3DProjection.landmarkCount} 点
Alignment（位置合わせ）: ${idealLandmarks3DProjection.alignment?.mode ?? "none"} / scale basis ${idealLandmarks3DProjection.alignment?.scaleBasis?.mode ?? "none"} / scale ${formatNullableNumber(idealLandmarks3DProjection.alignment?.scale)} / limiting axis ${idealLandmarks3DProjection.alignment?.scaleBasis?.limitingAxis ?? "none"} / aspectDiff ${formatNullableNumber(idealLandmarks3DProjection.alignment?.aspectRatioDifference)}
Aspect debug（縦横比デバッグ）: asset ${formatNullableNumber(idealLandmarks3DProjection.debug?.aspectRatio.asset)} / rotated ${formatNullableNumber(idealLandmarks3DProjection.debug?.aspectRatio.rotated)} / aligned ${formatNullableNumber(idealLandmarks3DProjection.debug?.aspectRatio.aligned)} / image ${formatNullableNumber(idealLandmarks3DProjection.debug?.aspectRatio.image)} / current ${formatNullableNumber(idealLandmarks3DProjection.debug?.aspectRatio.current)} / overlay ${formatNullableNumber(overlayProjectedIdealPixelBounds?.aspectRatioPx)}
Coordinate conversion（座標変換）: ${idealLandmarks3DProjection.debug?.coordinate?.conversionMode ?? "なし"} / videoAspect ${formatNullableNumber(idealLandmarks3DProjection.debug?.coordinate?.videoAspectRatio)} / fallback ${idealLandmarks3DProjection.debug?.coordinate ? String(idealLandmarks3DProjection.debug.coordinate.fallbackUsed) : "なし"}
478点差分: ${idealLandmarksDifference.status} / matched ${idealLandmarksDifference.matchedLandmarkCount} / 平均 ${formatNullableNumber(idealLandmarksDifference.averageDistance)} / 最大 ${formatNullableNumber(idealLandmarksDifference.maxDistance)} / 最大index ${idealLandmarksDifference.maxDistanceLandmarkIndex ?? "なし"}
correctionProfile: ${correctionProfileSource} / ${correctionProfile.schemaVersion} / ${correctionProfile.mode} / default ${formatNumber(correctionProfile.defaultStrength)} / maxDistance ${formatNumber(correctionProfile.maxCorrectionDistance)} / landmarkStrengths ${correctionProfile.landmarkStrengths.length}
landmarkGroups: ${correctionPlan.landmarkGroups.status} / ${correctionPlan.landmarkGroups.source ?? "none"} / groups ${correctionPlan.landmarkGroups.groupCount}
Expression attenuation（表情時の補正抑制）: ${correctionPlan.expressionAttenuation.status} / ${correctionPlan.expressionAttenuation.source} / mouth ${formatExpressionGroupScale(correctionPlan, "mouth")} / left_eye ${formatExpressionGroupScale(correctionPlan, "left_eye")} / right_eye ${formatExpressionGroupScale(correctionPlan, "right_eye")} / face_boundary ${formatExpressionGroupScale(correctionPlan, "face_boundary")}
CorrectionPlan（補正計画）: ${correctionPlan.status} / points ${correctionPlan.pointCount} / avgCorrection ${formatNullableNumber(correctionPlan.summary.averageCorrectionDistance)} / maxCorrection ${formatNullableNumber(correctionPlan.summary.maxCorrectionDistance)} / clamped ${correctionPlan.summary.clampedCount} / avgBaseStrength ${formatNullableNumber(correctionPlan.summary.averageBaseStrength)} / avgFinalStrength ${formatNullableNumber(correctionPlan.summary.averageFinalStrength)} / minExpressionScale ${formatNullableNumber(correctionPlan.summary.minExpressionScale)}
Shape Warp v1 debug（変形デバッグ）: ${latestShapeWarpDebugSummary.status} / mode ${latestShapeWarpDebugSummary.mode} / preset ${latestShapeWarpDebugSummary.preset} / enabled ${String(latestShapeWarpDebugSummary.enabled)} / candidates ${latestShapeWarpDebugSummary.candidateVectorCount} / used ${latestShapeWarpDebugSummary.usedVectorCount} / skipped ${latestShapeWarpDebugSummary.skippedByDistanceCount} / meshStrength ${formatNumber(latestShapeWarpDebugSummary.meshWarpStrength)} / textureFiltering ${latestShapeWarpDebugSummary.textureFiltering} / wireframe ${String(latestShapeWarpDebugSummary.showWireframe)} / meshVertices ${latestShapeWarpDebugSummary.usedMeshVertexCount ?? "なし"} / triangles ${latestShapeWarpDebugSummary.triangleCount ?? "なし"} / webgl ${latestShapeWarpDebugSummary.webgl ?? "なし"} / radius ${formatNumber(latestShapeWarpDebugSummary.radiusPx)} / strength ${formatNumber(latestShapeWarpDebugSummary.globalWarpStrength)} / minDistance ${formatNumber(latestShapeWarpDebugSummary.minCorrectionDistance)} / sampling ${latestShapeWarpDebugSummary.sampling} / render ${formatNullableNumber(latestShapeWarpDebugSummary.renderTimeMs)} ms / avg ${formatNullableNumber(latestShapeWarpDebugSummary.averageRenderTimeMs)} ms
Production Shape Warp（本番用変形処理）: not_implemented
利用可能IdealFace: ${availableIdealFaces.length}
FPS: ${formatFps(faceFrameFps)}
Loop（ループ）: ${faceFrameLoopDebug.running ? "実行中" : "停止中"}
Detect（検出回数）: ${faceFrameLoopDebug.detectCallCount}/${mediaPipeDebug?.detectSuccessCount ?? 0}`

    appRoot.innerHTML = `
      <section class="studio-layout">
        <header>
          <h2>操作</h2>
          <button id="copy-debug" type="button">Copy Debug（デバッグをコピー）</button>
          <span aria-live="polite">${copyStatus}</span>
        </header>
        <style>
          .studio-layout {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .studio-layout > header {
            order: 3;
          }

          .studio-layout > .studio-top-grid {
            order: 0;
          }

          .studio-layout > section {
            order: 3;
          }

          .studio-layout > .debug-heading,
          .studio-layout > pre {
            order: 4;
          }

          .studio-layout > details {
            order: 5;
          }

          .studio-layout h2,
          .studio-layout h3 {
            margin-bottom: 0;
          }

          .studio-top-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(280px, 0.9fr);
            gap: 12px;
            align-items: start;
          }

          .preview-grid {
            display: grid;
            grid-column: 1 / span 2;
            grid-row: 1;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            align-items: start;
          }

          .preview-grid > section,
          .realtime-panel {
            min-width: 0;
            box-sizing: border-box;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 12px;
            background: #ffffff;
          }

          .realtime-panel {
            grid-column: 3;
            grid-row: 1;
            max-height: calc(100vh - 112px);
            overflow: auto;
          }

          .realtime-panel > label {
            display: block;
            margin: 8px 0;
          }

          .realtime-panel fieldset {
            min-width: 0;
            margin: 8px 0;
          }

          .realtime-panel input[type="number"] {
            max-width: 100%;
          }

          .preview-container {
            position: relative;
            display: block;
            max-width: 100%;
            min-width: 0;
            overflow: hidden;
            background: #111827;
          }

          .preview-container video,
          .preview-container canvas.processed-canvas {
            display: block;
            width: 100%;
            max-width: none;
            height: auto;
          }

          .preview-container .overlay {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
          }

          .studio-layout > header,
          .studio-layout > fieldset,
          .studio-layout > section,
          .studio-layout > details,
          .studio-top-grid {
            min-width: 0;
          }

          .studio-layout > header {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            align-items: center;
          }

          .studio-layout > pre,
          .studio-layout textarea,
          .studio-layout section pre {
            max-width: 100%;
            overflow: auto;
          }

          @media (max-width: 960px) {
            .studio-top-grid {
              grid-template-columns: 1fr;
            }

            .preview-grid,
            .realtime-panel {
              grid-column: 1;
            }
          }

          @media (max-width: 760px) {
            .preview-grid {
              grid-template-columns: 1fr;
            }
          }
        </style>
        <h2 class="debug-heading">Debug values（デバッグ値）</h2>
        <pre>${escapeHtml(statusSummary)}</pre>
        <div class="studio-top-grid">
          <section class="realtime-panel">
            <h2 class="realtime-heading">リアルタイム調整</h2>
        <label>
          <input id="ideal-landmark-difference-lines" type="checkbox" ${showIdealLandmarkDifferenceLines ? "checked" : ""} />
          478点差分線を表示
        </label>
        <label>
          <input id="correction-plan-lines" type="checkbox" ${showCorrectionPlanLines ? "checked" : ""} />
          CorrectionPlan補正線を表示
        </label>
        <label>
          <input id="shape-warp-used-vectors" type="checkbox" ${showShapeWarpUsedVectors ? "checked" : ""} />
          Shape Warp使用ベクトルを表示
        </label>
        <fieldset data-shape-warp-debug-controls="true">
          <legend>Shape Warp Debug（変形デバッグ）</legend>
          <p>Shape Warp Debug は CorrectionPlan の補正ベクトルを画像に仮反映する検証用です。本番品質の warp 方式ではありません。</p>
          <fieldset>
            <legend>Shape Warp mode（変形方式）</legend>
            <label><input type="radio" name="shape-warp-mode" value="cpu_radial_debug" ${shapeWarpDebugSettings.mode === "cpu_radial_debug" ? "checked" : ""} /> CPU radial debug（CPU放射状デバッグ）</label>
            <label><input type="radio" name="shape-warp-mode" value="webgl_mesh_debug" ${shapeWarpDebugSettings.mode === "webgl_mesh_debug" ? "checked" : ""} /> WebGL mesh debug（WebGLメッシュデバッグ）</label>
          </fieldset>
          <fieldset>
            <legend>preset（プリセット）</legend>
            <label><input type="radio" name="shape-warp-preset" value="off" ${shapeWarpDebugSettings.preset === "off" ? "checked" : ""} /> off（無効）</label>
            <label><input type="radio" name="shape-warp-preset" value="weak" ${shapeWarpDebugSettings.preset === "weak" ? "checked" : ""} /> weak（弱）</label>
            <label><input type="radio" name="shape-warp-preset" value="normal" ${shapeWarpDebugSettings.preset === "normal" ? "checked" : ""} /> normal（標準）</label>
            <label><input type="radio" name="shape-warp-preset" value="strong" ${shapeWarpDebugSettings.preset === "strong" ? "checked" : ""} /> strong（強）</label>
            <label><input type="radio" name="shape-warp-preset" value="custom" ${shapeWarpDebugSettings.preset === "custom" ? "checked" : ""} /> custom（手動設定）</label>
          </fieldset>
          <label>
            <input id="shape-warp-debug-enabled" type="checkbox" ${shapeWarpDebugSettings.enabled ? "checked" : ""} />
            Processed Preview（加工結果）でShape Warp Debug（変形デバッグ）を有効化
          </label>
          <fieldset>
            <legend>CPU radial debug settings（CPU放射状デバッグ設定）</legend>
            <label>
              radiusPx（影響半径px）
              <input id="shape-warp-radius-px" type="number" min="1" max="128" step="1" value="${shapeWarpDebugSettings.radiusPx}" />
            </label>
            <label>
              globalWarpStrength（全体の変形強度）
              <input id="shape-warp-global-strength" type="number" min="0" max="2" step="0.1" value="${shapeWarpDebugSettings.globalWarpStrength}" />
            </label>
            <label>
              maxVectors（使用する補正ベクトル上限）
              <input id="shape-warp-max-vectors" type="number" min="1" max="478" step="1" value="${shapeWarpDebugSettings.maxVectors}" />
            </label>
            <label>
              minCorrectionDistance（使う最小補正距離）
              <input id="shape-warp-min-correction-distance" type="number" min="0" max="0.05" step="0.001" value="${shapeWarpDebugSettings.minCorrectionDistance}" />
            </label>
            <fieldset>
              <legend>sampling（サンプリング方式）</legend>
              <label><input type="radio" name="shape-warp-sampling" value="bilinear" ${shapeWarpDebugSettings.sampling === "bilinear" ? "checked" : ""} /> bilinear（なめらか）</label>
              <label><input type="radio" name="shape-warp-sampling" value="nearest" ${shapeWarpDebugSettings.sampling === "nearest" ? "checked" : ""} /> nearest（最近傍）</label>
            </fieldset>
          </fieldset>
          <fieldset>
            <legend>WebGL mesh debug settings（WebGLメッシュデバッグ設定）</legend>
            <label>
              meshWarpStrength（メッシュ変形強度）
              <input id="shape-warp-mesh-strength" type="number" min="0" max="3" step="0.05" value="${shapeWarpDebugSettings.meshWarpStrength}" />
            </label>
            <fieldset>
              <legend>texture filtering（テクスチャ補間）</legend>
              <label><input type="radio" name="shape-warp-texture-filtering" value="linear" ${shapeWarpDebugSettings.textureFiltering === "linear" ? "checked" : ""} /> linear（なめらか）</label>
              <label><input type="radio" name="shape-warp-texture-filtering" value="nearest" ${shapeWarpDebugSettings.textureFiltering === "nearest" ? "checked" : ""} /> nearest（最近傍）</label>
            </fieldset>
            <label>
              <input id="shape-warp-webgl-wireframe" type="checkbox" ${showWebglMeshWireframe ? "checked" : ""} />
              WebGL mesh wireframe（メッシュ線）を表示
            </label>
            <p>topologyLandmarkCount: ${MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT} / triangleCount: ${MEDIAPIPE_FACE_MESH_TRIANGLE_COUNT}</p>
          </fieldset>
        </fieldset>
          </section>
        <div class="preview-grid">
          <section>
            <h3>Source Preview（元映像）</h3>
            <div id="source-preview" class="preview-container">${camera.getVideo() ? "" : "利用できません"}</div>
          </section>
          <section>
            <h3>Processed Preview（加工結果）: ${formatProcessedPreviewLabel()}</h3>
            <div id="processed-preview" class="preview-container">${camera.getVideo() ? "" : "利用できません"}</div>
          </section>
        </div>
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
          <summary>FaceFrame Debug（顔フレーム）</summary>
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
          <summary>FaceGeometry Debug（顔の代表点・サイズ）</summary>
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
          <summary>CorrectionPlan v1 Debug（補正計画）</summary>
          <pre>${escapeHtml(formatCorrectionPlanPreview(correctionPlan))}</pre>
        </details>
        <details data-debug-section="shapeWarpDebug"${detailsOpenAttribute("shapeWarpDebug")}>
          <summary>Shape Warp v1 Debug（変形デバッグ）</summary>
          <pre>${escapeHtml(formatShapeWarpDebugPreview(latestShapeWarpDebugSummary))}</pre>
        </details>
        <details data-debug-section="mediaPipe"${detailsOpenAttribute("mediaPipe")}>
          <summary>MediaPipe Debug（顔検出器）</summary>
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
          <summary>Loop / Timing Debug（ループ・処理時間）</summary>
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
          <summary>Full Debug Text（全文デバッグ）</summary>
          <textarea readonly rows="18">${escapeHtml(debugText)}</textarea>
        </details>
      </section>
    `

    attachCopyDebugHandler(debugText)
    attachIdealLandmarkDifferenceOverlayHandler()
    attachCorrectionPlanOverlayHandler()
    attachShapeWarpUsedVectorsOverlayHandler()
    attachShapeWarpDebugHandlers()
    attachIdealFaceAssetImportHandler()
    attachDebugDetailsHandlers()
  }

  engine.setFaceDetector(detector)
  window.setInterval(() => {
    if (!isShapeWarpDebugControlActive()) {
      render()
    }
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
