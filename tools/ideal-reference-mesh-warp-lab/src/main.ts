import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision"
import type { Matrix, NormalizedLandmark } from "@mediapipe/tasks-vision"
import "./style.css"

type PreviewTab = "model" | "live"
type DebugTab =
  | "summary"
  | "modelScan"
  | "referenceLibrary"
  | "matching"
  | "warpMesh"
  | "raw"

type MediaPipeStatus =
  | "uninitialized"
  | "initializing"
  | "ready"
  | "scanning"
  | "disposed"
  | "error"
type ScanStatus = "idle" | "initializing" | "running" | "done" | "error"
type PlaybackStatus = "stopped" | "playing" | "paused"
type WebglPreviewStatus = "disabled" | "ready" | "drawing" | "fallback" | "error"
type TextureVMode = "imageNormalizedNoFlip"
type ExpressionGroup =
  | "neutral"
  | "mouthSmile"
  | "jawOpen"
  | "mouthPucker"
  | "eyeBlink"
  | "eyeSquint"
  | "mixedExpression"
  | "unknown"

type VideoPreviewState = {
  loaded: boolean
  fileName: string | null
  objectUrl: string | null
  durationSec: number | null
  width: number | null
  height: number | null
  currentTimeSec: number
}

type ReferenceLandmark = {
  index: number
  x: number
  y: number
  z: number
}

type ReferenceBlendshape = {
  categoryName: string
  score: number
}

type ReferencePose = {
  yaw: number | null
  pitch: number | null
  roll: number | null
}

type IdealReferenceFrame = {
  frameId: string
  frameIndex: number
  timeSec: number
  landmarks478: ReferenceLandmark[]
  pose: ReferencePose
  blendshapes: ReferenceBlendshape[]
  expressionGroup: ExpressionGroup
  qualityScore: number
  excluded: boolean
  excludedReason: string | null
}

type CurrentLiveFrameAnalysis = {
  analyzed: boolean
  timeSec: number | null
  landmarks478: ReferenceLandmark[]
  pose: ReferencePose
  blendshapes: ReferenceBlendshape[]
  expressionGroup: ExpressionGroup
  qualityScore: number
  error: string | null
}

type ReferenceMatchResult = {
  matched: boolean
  idealFrameId: string | null
  idealFrameIndex: number | null
  idealTimeSec: number | null
  matchScore: number | null
  poseDistance: number | null
  expressionDistance: number | null
  qualityPenalty: number | null
  currentExpressionGroup: ExpressionGroup | null
  idealExpressionGroup: ExpressionGroup | null
  error: string | null
}

type Rect = {
  x: number
  y: number
  width: number
  height: number
}

type Point2D = {
  x: number
  y: number
}

type BoundsDebugSummary = {
  minX: number
  maxX: number
  minY: number
  maxY: number
  width: number
  height: number
  aspect: number | null
}

type CoordinateBoundsDebug = {
  normalized: BoundsDebugSummary | null
  aspectCorrected: BoundsDebugSummary | null
}

type MeshAlignmentDebug = {
  videoAspectRatio: number
  idealVideoAspectRatio: number
  currentVideoAspectRatio: number
  idealBoundsAspectCorrected: BoundsDebugSummary | null
  currentBoundsAspectCorrected: BoundsDebugSummary | null
  scale: number
  idealCenterAspectCorrected: Point2D
  currentCenterAspectCorrected: Point2D
}

type MeshBoundsDebug = {
  currentLandmarks: CoordinateBoundsDebug
  top1RawIdealReferenceLandmarks: CoordinateBoundsDebug
  candidateAlignedIdealLandmarks: CoordinateBoundsDebug
  acceptedCurrentMeshSourceFaceLandmarks: CoordinateBoundsDebug
  idealMeshTargetFaceLandmarks: CoordinateBoundsDebug
}

type MeshAspectDebug = {
  videoAspectRatio: number
  modelVideoAspectRatio: number
  liveVideoAspectRatio: number
  alignment: MeshAlignmentDebug | null
  bounds: MeshBoundsDebug
}

type MeshVertexKind =
  | "faceLandmark"
  | "nearFaceGrid"
  | "backgroundGrid"
  | "screenEdgeAnchor"

type CurrentMeshLandmarkVertex = {
  id: string
  kind: "faceLandmark"
  index: number
  source: Point2D
  visibilityWeight: number
  safetyWeight: number
  usageWeight: number
  reasons: string[]
}

type MeshSourceVertex = {
  id: string
  kind: MeshVertexKind
  index?: number
  x: number
  y: number
  weight: number
  reasons: string[]
}

type MeshTargetVertex = {
  id: string
  kind: MeshVertexKind
  index?: number
  x: number
  y: number
  weight: number
  reasons: string[]
}

type MeshVertexPair = {
  id: string
  kind: MeshVertexKind
  index?: number
  source: Point2D
  target: Point2D
  distanceNormalized: number
  distanceAspectCorrected: number
  usageWeight: number
  reasons: string[]
}

type DynamicGridPointPreview = {
  id: string
  kind: MeshVertexKind
  x: number
  y: number
  reasons: string[]
}

type NearFaceGridMode = "filledRegionMinusFaceInterior"

type FaceInteriorTrianglePreview = {
  indices: [number, number, number]
  area: number
}

type FaceInteriorDebug = {
  faceOnlyTriangleCount: number
  faceInteriorTestTriangleCount: number
  preview: FaceInteriorTrianglePreview[]
}

type NearFaceGridDebug = {
  mode: NearFaceGridMode
  candidateGridCount: number
  removedInsideFaceCount: number
  removedTooCloseToFaceCount: number
  acceptedGridCount: number
  tooCloseToFaceThreshold: number | null
  gridPointPreview: DynamicGridPointPreview[]
}

type DynamicGridDebug = {
  mode: "dynamic"
  nearFaceGridMode: NearFaceGridMode
  acceptedFaceLandmarkCount: number
  faceMedianNearestDistance: number | null
  faceNearestDistanceSampleCount: number
  nearFaceGridSpacing: number | null
  backgroundGridSpacing: number | null
  screenEdgeAnchorSpacing: number | null
  nearFaceGridSpacingRatioToFaceMedian: number | null
  backgroundGridSpacingRatioToFaceMedian: number | null
  faceOnlyTriangleCount: number
  faceInteriorTestTriangleCount: number
  nearFaceCandidateGridCount: number
  nearFaceRemovedInsideFaceCount: number
  nearFaceRemovedTooCloseToFaceCount: number
  nearFaceAcceptedGridCount: number
  tooCloseToFaceThreshold: number | null
  nearFaceGridCount: number
  backgroundGridCount: number
  screenEdgeAnchorCount: number
  faceBounds: BoundsDebugSummary | null
  expandedNearFaceBounds: BoundsDebugSummary | null
  videoAspectRatio: number
  nearFaceGrid: NearFaceGridDebug
  faceInterior: FaceInteriorDebug
  gridPointPreview: DynamicGridPointPreview[]
}

type GridAnchorDisplayState = {
  showSourceGrid: boolean
  showTargetGrid: boolean
}

type TriangleKind =
  | "faceOnly"
  | "faceToNearGrid"
  | "nearGridOnly"
  | "nearToBackground"
  | "backgroundOnly"
  | "edgeAnchor"
  | "mixed"

type TriangleWarning =
  | "longThinTriangle"
  | "largeTriangle"
  | "degenerateTriangle"
  | "faceToFarBackgroundTriangle"

type TriangleMetricRange = {
  min: number | null
  median: number | null
  max: number | null
}

type MetricMinMaxRange = {
  min: number | null
  max: number | null
}

type TriangleKindCounts = Record<TriangleKind, number>
type TriangleWarningCounts = Record<TriangleWarning, number>

type TriangleMeshTriangle = {
  indices: [number, number, number]
  kind: TriangleKind
  area: number
  aspectRatio: number
  warnings: TriangleWarning[]
}

type TriangleMeshDebug = {
  mode: "prototype"
  vertexCount: number
  triangleCount: number
  validTriangleCount: number
  warningTriangleCount: number
  excludedTriangleCount: number
  triangleKindCounts: TriangleKindCounts
  triangleQuality: TriangleWarningCounts
  triangleArea: TriangleMetricRange
  triangleAspectRatio: TriangleMetricRange
  triangles: TriangleMeshTriangle[]
  trianglePreview: TriangleMeshTriangle[]
}

type WebglMeshWarpInputWarning =
  | "sourceTargetVertexCountMismatch"
  | "invalidIndex"
  | "sourceUvOutOfRange"
  | "targetPositionOutOfRange"
  | "targetClipPositionOutOfRange"
  | "emptyTriangleIndices"

type WebglMeshWarpInputPreviewItem = {
  vertexIndex: number
  source: Point2D
  target: Point2D | null
  uv: {
    u: number
    v: number
  }
  clip: Point2D | null
  kind: MeshVertexKind
}

type WebglMeshWarpInputDebug = {
  mode: "debugOnly"
  webglInputReady: boolean
  vertexCount: number
  sourceVertexCount: number
  targetVertexCount: number
  triangleCount: number
  indexCount: number
  sourceUvConvention: "imageNormalizedNoFlip"
  targetPositionConvention: "clipSpaceFromImageNormalized"
  sourceUvSummary: {
    uRange: MetricMinMaxRange
    vRange: MetricMinMaxRange
    outOfRangeUvCount: number
    sourceUvInRange: boolean
  }
  targetPositionSummary: {
    imageXRange: MetricMinMaxRange
    imageYRange: MetricMinMaxRange
    clipXRange: MetricMinMaxRange
    clipYRange: MetricMinMaxRange
    outOfRangeTargetCount: number
    outOfRangeClipCount: number
    targetImagePositionInRange: boolean
    targetClipPositionInRange: boolean
  }
  indexSummary: {
    maxIndex: number | null
    indexWithinVertexRange: boolean
    invalidIndexCount: number
  }
  coordinateSummary: {
    sourceTargetVertexCountMatch: boolean
    sourceUvInRange: boolean
    targetImagePositionInRange: boolean
    targetClipPositionInRange: boolean
    triangleCountPositive: boolean
  }
  preview: WebglMeshWarpInputPreviewItem[]
  indexPreview: Array<[number, number, number]>
  warnings: WebglMeshWarpInputWarning[]
  warningCount: number
}

type WebglPreviewRuntimeDebug = {
  webglPreviewEnabled: boolean
  webglPreviewStatus: WebglPreviewStatus
  webglPreviewError: string | null
  webglCanvasSize: {
    width: number
    height: number
  }
  videoTextureReady: boolean
  lastDrawTimestampMs: number | null
  drawCallCount: number
  lastDrawTriangleCount: number
  lastDrawIndexCount: number
  textureVMode: TextureVMode
  fallbackReason: string | null
}

type WebglMeshWarpPreviewDrawInput = {
  videoElement: HTMLVideoElement
  videoState: VideoPreviewState
  sourceVertices: MeshSourceVertex[]
  targetVertices: MeshTargetVertex[]
  triangles: TriangleMeshTriangle[]
}

type WebglMeshWarpPreviewDrawResult = {
  canvasWidth: number
  canvasHeight: number
  videoTextureReady: boolean
  triangleCount: number
  indexCount: number
}

type WebglMeshWarpPreviewRenderer = {
  draw: (input: WebglMeshWarpPreviewDrawInput) => WebglMeshWarpPreviewDrawResult
  dispose: () => void
}

type MeshPrototypeSummary = {
  gridMode: "dynamic"
  nearFaceGridMode: NearFaceGridMode
  triangleMode: "prototype"
  top1MatchedReferenceId: string | null
  currentLandmarkCount: number
  candidateAlignedIdealLandmarkCount: number
  acceptedFaceLandmarkCount: number
  faceMedianNearestDistance: number | null
  faceNearestDistanceSampleCount: number
  nearFaceGridSpacing: number | null
  backgroundGridSpacing: number | null
  screenEdgeAnchorSpacing: number | null
  nearFaceGridSpacingRatioToFaceMedian: number | null
  backgroundGridSpacingRatioToFaceMedian: number | null
  faceOnlyTriangleCount: number
  faceInteriorTestTriangleCount: number
  nearFaceCandidateGridCount: number
  nearFaceRemovedInsideFaceCount: number
  nearFaceRemovedTooCloseToFaceCount: number
  nearFaceAcceptedGridCount: number
  tooCloseToFaceThreshold: number | null
  faceBounds: BoundsDebugSummary | null
  expandedNearFaceBounds: BoundsDebugSummary | null
  videoAspectRatio: number
  visibleCurrentLandmarkCount: number
  excludedCurrentLandmarkCount: number
  faceSourceVertexCount: number
  nearFaceGridCount: number
  backgroundGridCount: number
  screenEdgeAnchorCount: number
  meshPairCount: number
  vertexCount: number
  triangleCount: number
  validTriangleCount: number
  warningTriangleCount: number
  excludedTriangleCount: number
  triangleKindCounts: TriangleKindCounts
  triangleQuality: TriangleWarningCounts
  triangleArea: TriangleMetricRange
  triangleAspectRatio: TriangleMetricRange
  webglInputReady: boolean
  webglInputWarningCount: number
  webglInputWarnings: WebglMeshWarpInputWarning[]
  usageWeightAverage: number | null
  usageWeightMin: number | null
  usageWeightMax: number | null
  boundarySuppressedCount: number
  mouthSuppressedCount: number
  eyeSuppressedCount: number
  largeDisplacementSuppressedCount: number
  invalidExcludedCount: number
}

type CurrentIdealMeshPrototypeState = {
  candidateAlignedIdealLandmarks: ReferenceLandmark[]
  acceptedCurrentLandmarks: CurrentMeshLandmarkVertex[]
  excludedCurrentLandmarks: CurrentMeshLandmarkVertex[]
  currentMeshSourceVertices: MeshSourceVertex[]
  idealMeshTargetVertices: MeshTargetVertex[]
  currentIdealMeshPairs: MeshVertexPair[]
  triangleMesh: TriangleMeshDebug
  webglMeshWarpInput: WebglMeshWarpInputDebug
  aspectDebug: MeshAspectDebug
  dynamicGrid: DynamicGridDebug
  summary: MeshPrototypeSummary
}

type ModelScanState = {
  mediaPipeStatus: MediaPipeStatus
  mediaPipeError: string | null
  modelTimestampMs: number
  scanStatus: ScanStatus
  scanProgress: number
  plannedScanFrames: number
  maxScanFrames: number
  scanFrameStepSec: number
  totalScannedFrames: number
  acceptedFrames: number
  excludedFrames: number
  excludedReasonCounts: Record<string, number>
  lastError: string | null
}

type LabState = {
  activePreviewTab: PreviewTab
  activeDebugTab: DebugTab
  applyWebglMeshWarp: boolean
  webglPreview: WebglPreviewRuntimeDebug
  overlay: {
    showLandmarks478: boolean
    showMeshSource: boolean
    showMeshTarget: boolean
    showMeshPairs: boolean
    showExcludedLandmarks: boolean
    showGridAnchors: boolean
    showTriangleMesh: boolean
  }
  modelVideo: VideoPreviewState & {
    currentReviewFrameIndex: number | null
    scanStatus: ScanStatus
  }
  liveVideo: VideoPreviewState & {
    playbackStatus: PlaybackStatus
  }
  liveMediaPipe: {
    status: MediaPipeStatus
    error: string | null
    liveTimestampMs: number
  }
  modelScan: ModelScanState
  rawIdealReferenceFrames: IdealReferenceFrame[]
  currentAcceptedReviewIndex: number | null
  currentLiveFrameAnalysis: CurrentLiveFrameAnalysis
  top1Match: ReferenceMatchResult
  currentIdealMeshPrototype: CurrentIdealMeshPrototypeState
  logs: string[]
}

type TabOption<TValue extends string> = {
  label: string
  value: TValue
}

const MAX_SCAN_FRAMES = 10000
const SCAN_FRAME_STEP_SEC = 1 / 30
const FRAME_STEP_SEC = 1 / 30
const REQUIRED_LANDMARK_COUNT = 478
const RAD_TO_DEG = 180 / Math.PI
const STRONG_EXPRESSION_THRESHOLD = 0.35
const MIXED_EXPRESSION_THRESHOLD = 0.28
const LANDMARK_PREVIEW_COUNT = 5
const SCAN_RENDER_INTERVAL = 8
const LIVE_AUTO_ANALYSIS_INTERVAL_SEC = 0.35
const MEDIAPIPE_TIMESTAMP_STEP_MS = SCAN_FRAME_STEP_SEC * 1000
const POSE_WEIGHT = 1
const EXPRESSION_WEIGHT = 1
const QUALITY_WEIGHT = 0.25
const POSE_MISSING_PENALTY = 1000
const HIDDEN_SIDE_YAW_THRESHOLD_DEG = 18
const FACE_BOUNDARY_USAGE_MULTIPLIER = 0.55
const HIDDEN_SIDE_USAGE_MULTIPLIER = 0.25
const EXPRESSION_REGION_USAGE_MULTIPLIER = 0.45
const LARGE_DISPLACEMENT_USAGE_MULTIPLIER = 0.4
const LARGE_DISPLACEMENT_THRESHOLD = 0.075
const EXCLUDE_USAGE_WEIGHT_THRESHOLD = 0.15
const DYNAMIC_GRID_NEAR_FACE_EXPAND_RATIO = 0.2
const DYNAMIC_GRID_NEAREST_SAMPLE_LIMIT = 160
const DYNAMIC_GRID_DEFAULT_FACE_MEDIAN_DISTANCE = 0.018
const NEAR_FACE_GRID_SPACING_RATIO = 1.5
const NEAR_FACE_TOO_CLOSE_TO_FACE_SPACING_RATIO = 0.4
const BACKGROUND_GRID_SPACING_RATIO = 4
const SCREEN_EDGE_ANCHOR_SPACING_RATIO = 1.25
const MIN_NEAR_FACE_GRID_SPACING = 0.012
const MAX_NEAR_FACE_GRID_SPACING = 0.04
const MIN_BACKGROUND_GRID_SPACING = 0.04
const MAX_BACKGROUND_GRID_SPACING = 0.12
const GRID_VERTEX_KEY_PRECISION = 10000
const TRIANGLE_PREVIEW_COUNT = 8
const WEBGL_INPUT_PREVIEW_COUNT = 8
const TRIANGLE_MIN_AREA = 0.0000008
const TRIANGLE_LARGE_AREA = 0.018
const TRIANGLE_LONG_THIN_ASPECT_RATIO = 12
const MESH_SOURCE_COLOR = "rgba(20, 170, 130, 0.9)"
const MESH_TARGET_COLOR = "rgba(244, 86, 120, 0.9)"
const GRID_SOURCE_COLOR = "rgba(20, 170, 130, 0.78)"
const GRID_TARGET_COLOR = "rgba(244, 86, 120, 0.78)"
const TRIANGLE_SOURCE_COLOR = "rgba(20, 170, 130, 0.34)"
const TRIANGLE_TARGET_COLOR = "rgba(244, 86, 120, 0.34)"
const WEBGL_PREVIEW_TEXTURE_V_MODE: TextureVMode = "imageNormalizedNoFlip"
const TRIANGLE_KINDS: TriangleKind[] = [
  "faceOnly",
  "faceToNearGrid",
  "nearGridOnly",
  "nearToBackground",
  "backgroundOnly",
  "edgeAnchor",
  "mixed",
]
const TRIANGLE_WARNINGS: TriangleWarning[] = [
  "longThinTriangle",
  "largeTriangle",
  "degenerateTriangle",
  "faceToFarBackgroundTriangle",
]
const MATCH_BLENDSHAPE_KEYS = [
  "jawOpen",
  "mouthSmileLeft",
  "mouthSmileRight",
  "mouthPucker",
  "eyeBlinkLeft",
  "eyeBlinkRight",
  "eyeSquintLeft",
  "eyeSquintRight",
] as const
const FACE_BOUNDARY_LANDMARK_INDICES = new Set([
  0, 10, 21, 54, 58, 67, 93, 103, 109, 127, 132, 136, 148, 149, 150, 152, 162,
  172, 176, 234, 251, 284, 288, 297, 323, 332, 338, 356, 361, 365, 377, 378,
  379, 389, 397, 400, 454,
])
const MOUTH_LANDMARK_INDICES = new Set([
  0, 13, 14, 17, 37, 39, 40, 61, 78, 80, 81, 82, 84, 87, 88, 91, 95, 146, 178,
  181, 185, 191, 267, 269, 270, 291, 308, 310, 311, 312, 314, 317, 318, 321,
  324, 375, 402, 405, 409, 415,
])
const EYE_LANDMARK_INDICES = new Set([
  7, 33, 46, 52, 53, 55, 63, 65, 66, 70, 105, 107, 133, 144, 145, 153, 154,
  155, 157, 158, 159, 160, 161, 163, 173, 246, 249, 263, 276, 282, 283, 285,
  293, 295, 296, 300, 334, 336, 362, 373, 374, 380, 381, 382, 384, 385, 386,
  387, 388, 390, 398, 466, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477,
])

const previewTabs: TabOption<PreviewTab>[] = [
  { label: "モデル動画", value: "model" },
  { label: "ライブ動画", value: "live" },
]

const debugTabs: TabOption<DebugTab>[] = [
  { label: "Summary", value: "summary" },
  { label: "Model Scan", value: "modelScan" },
  { label: "Reference Library", value: "referenceLibrary" },
  { label: "Matching", value: "matching" },
  { label: "Warp Mesh", value: "warpMesh" },
  { label: "Raw", value: "raw" },
]

const state: LabState = {
  activePreviewTab: "model",
  activeDebugTab: "summary",
  applyWebglMeshWarp: false,
  webglPreview: createEmptyWebglPreviewRuntimeDebug(),
  overlay: {
    showLandmarks478: false,
    showMeshSource: false,
    showMeshTarget: false,
    showMeshPairs: false,
    showExcludedLandmarks: false,
    showGridAnchors: false,
    showTriangleMesh: false,
  },
  modelVideo: {
    loaded: false,
    fileName: null,
    objectUrl: null,
    durationSec: null,
    width: null,
    height: null,
    currentTimeSec: 0,
    currentReviewFrameIndex: null,
    scanStatus: "idle",
  },
  liveVideo: {
    loaded: false,
    fileName: null,
    objectUrl: null,
    durationSec: null,
    width: null,
    height: null,
    currentTimeSec: 0,
    playbackStatus: "stopped",
  },
  liveMediaPipe: {
    status: "uninitialized",
    error: null,
    liveTimestampMs: 0,
  },
  modelScan: {
    mediaPipeStatus: "uninitialized",
    mediaPipeError: null,
    modelTimestampMs: 0,
    scanStatus: "idle",
    scanProgress: 0,
    plannedScanFrames: 0,
    maxScanFrames: MAX_SCAN_FRAMES,
    scanFrameStepSec: SCAN_FRAME_STEP_SEC,
    totalScannedFrames: 0,
    acceptedFrames: 0,
    excludedFrames: 0,
    excludedReasonCounts: {},
    lastError: null,
  },
  rawIdealReferenceFrames: [],
  currentAcceptedReviewIndex: null,
  currentLiveFrameAnalysis: createEmptyCurrentLiveFrameAnalysis(),
  top1Match: createEmptyTop1Match(),
  currentIdealMeshPrototype: createEmptyCurrentIdealMeshPrototype(),
  logs: ["ラボを初期化しました。"],
}

const app = document.querySelector<HTMLDivElement>("#app")

if (!app) {
  throw new Error("#app が見つかりません。")
}

// modelFaceLandmarker は authoring / library creation 用です。
// rawIdealReferenceFrames 作成後は破棄し、Runtime 相当の処理では liveFaceLandmarker と
// memory 上の reference library だけを使います。
let modelFaceLandmarker: FaceLandmarker | null = null
let modelFaceLandmarkerPromise: Promise<FaceLandmarker> | null = null
let liveFaceLandmarker: FaceLandmarker | null = null
let liveFaceLandmarkerPromise: Promise<FaceLandmarker> | null = null
let liveAnalysisInProgress = false
let lastAutoLiveAnalysisAtSec = Number.NEGATIVE_INFINITY
let liveAnalysisRequestId = 0
let webglMeshWarpPreviewRenderer: WebglMeshWarpPreviewRenderer | null = null
let webglPreviewAnimationFrameId: number | null = null
let lastWebglDebugRenderAtMs = 0

app.innerHTML = `
  <main class="lab-shell">
    <section class="panel left-panel" aria-label="操作系">
      <div class="title-block">
        <p class="eyebrow">Ideal Reference Mesh Warp Lab</p>
        <h1>理想参照メッシュワープ検証ラボ</h1>
      </div>
      <div class="control-group">
        <button class="primary-button" type="button" data-action="load-model">モデル動画読込</button>
        <button class="primary-button" type="button" data-action="analyze">解析</button>
        <button class="primary-button" type="button" data-action="load-live">ライブ動画読込</button>
        <button class="secondary-button" type="button" data-action="export-log">ログ出力</button>
      </div>
      <input class="visually-hidden" type="file" accept="video/*" data-input="model-video" />
      <input class="visually-hidden" type="file" accept="video/*" data-input="live-video" />
      <div class="status-note">
        モデル動画解析用 MediaPipe とライブ current 解析用 MediaPipe を分離し、各 stream の単調増加 timestamp で解析します。調整なしメッシュワープ試作は distortion 確認用です。topK、safety weight、hybrid mesh はまだ行いません。
      </div>
    </section>

    <section class="panel center-panel" aria-label="プレビュー系">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Preview</p>
          <h2>プレビュー</h2>
        </div>
        <div class="overlay-toggles">
          <label class="overlay-toggle">
            <input type="checkbox" data-action="toggle-landmarks" />
            <span>478点を表示</span>
          </label>
          <label class="overlay-toggle">
            <input type="checkbox" data-action="toggle-mesh-source" />
            <span>mesh sourceを表示</span>
          </label>
          <label class="overlay-toggle">
            <input type="checkbox" data-action="toggle-mesh-target" />
            <span>mesh targetを表示</span>
          </label>
          <label class="overlay-toggle">
            <input type="checkbox" data-action="toggle-mesh-pairs" />
            <span>対応線を表示</span>
          </label>
          <label class="overlay-toggle">
            <input type="checkbox" data-action="toggle-excluded-landmarks" />
            <span>除外landmarkを表示</span>
          </label>
          <label class="overlay-toggle">
            <input type="checkbox" data-action="toggle-grid-anchors" />
            <span>grid / anchorsを表示</span>
          </label>
          <label class="overlay-toggle">
            <input type="checkbox" data-action="toggle-triangle-mesh" />
            <span>triangle meshを表示</span>
          </label>
        </div>
      </div>
      ${renderTabs("preview", previewTabs, state.activePreviewTab)}
      <div class="preview-stack">
        ${renderModelPreview()}
        ${renderLivePreview()}
      </div>
    </section>

    <section class="panel right-panel" aria-label="ログ・デバッグ系">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Debug</p>
          <h2>ログ・デバッグ</h2>
        </div>
      </div>
      ${renderTabs("debug", debugTabs, state.activeDebugTab)}
      <div class="debug-content" data-debug-content></div>
    </section>
  </main>
`

const modelVideoElement = getElement<HTMLVideoElement>("[data-video='model']")
const liveVideoElement = getElement<HTMLVideoElement>("[data-video='live']")
const modelOverlayCanvas = getElement<HTMLCanvasElement>("[data-overlay='model']")
const liveOverlayCanvas = getElement<HTMLCanvasElement>("[data-overlay='live']")
const liveWebglCanvas = getElement<HTMLCanvasElement>("[data-webgl-preview='live']")
const modelFileInput = getElement<HTMLInputElement>("[data-input='model-video']")
const liveFileInput = getElement<HTMLInputElement>("[data-input='live-video']")

bindEvents()
renderAll()

function renderTabs<TValue extends string>(
  group: "preview" | "debug",
  tabs: TabOption<TValue>[],
  activeValue: TValue,
) {
  return `
    <div class="tab-list" role="tablist" aria-label="${group}">
      ${tabs
        .map(
          (tab) => `
            <button
              class="tab-button ${tab.value === activeValue ? "is-active" : ""}"
              type="button"
              data-tab-group="${group}"
              data-tab-value="${tab.value}"
              role="tab"
              aria-selected="${tab.value === activeValue}"
            >
              ${tab.label}
            </button>
          `,
        )
        .join("")}
    </div>
  `
}

function renderModelPreview() {
  return `
    <div class="preview-card" data-preview-panel="model">
      <div class="preview-stage" data-loaded="false">
        <video class="video-preview" data-video="model" preload="metadata" playsinline controls></video>
        <canvas class="landmark-overlay" data-overlay="model"></canvas>
        <div class="preview-placeholder" data-placeholder="model">
          <h3>モデル動画プレビュー</h3>
          <p>モデル動画読込からローカル動画を選択すると、ここに frame review 用 preview を表示します。</p>
        </div>
      </div>
      <div class="timeline-controls" aria-label="モデル動画操作">
        <button class="small-button" type="button" data-action="model-prev">戻る</button>
        <button class="small-button" type="button" data-action="model-next">進む</button>
        <label class="range-field">
          <span data-model-range-label>シーク</span>
          <input type="range" min="0" step="0.001" value="0" data-range="model" />
        </label>
        <p class="frame-status" data-status="model-time">current time: - / -</p>
      </div>
      <div class="review-card" data-model-review>
        <p>解析後は accepted frame review に切り替わります。</p>
      </div>
      <p class="control-help" data-model-control-help>戻る / 進むは PR2 の仮操作として 1/30 秒ずつ移動します。</p>
    </div>
  `
}

function renderLivePreview() {
  return `
    <div class="preview-card" data-preview-panel="live">
      <div class="preview-stage" data-loaded="false">
        <video class="video-preview" data-video="live" preload="metadata" playsinline controls></video>
        <canvas class="webgl-warp-preview" data-webgl-preview="live"></canvas>
        <canvas class="landmark-overlay" data-overlay="live"></canvas>
        <div class="preview-placeholder" data-placeholder="live">
          <h3>ライブ動画プレビュー</h3>
          <p>ライブ動画読込からローカル動画を選択すると、ここに current face 代わりの preview を表示します。</p>
        </div>
      </div>
      <div class="timeline-controls live-controls" aria-label="ライブ動画操作">
        <button class="small-button" type="button" data-action="live-play">再生</button>
        <button class="small-button" type="button" data-action="live-pause">一時停止</button>
        <button class="small-button" type="button" data-action="live-analyze-current">現在フレーム解析</button>
        <label class="preview-toggle">
          <input type="checkbox" data-action="toggle-webgl-mesh-warp" />
          <span>WebGL mesh warp を適用</span>
        </label>
        <label class="range-field">
          <span>シーク</span>
          <input type="range" min="0" step="0.001" value="0" data-range="live" />
        </label>
        <p class="frame-status" data-status="live-time">current time: - / -</p>
      </div>
      <div class="review-card" data-live-analysis>
        <p>ライブ動画の current frame 解析結果はまだありません。</p>
      </div>
    </div>
  `
}

function bindEvents() {
  getElement<HTMLButtonElement>('[data-action="load-model"]').addEventListener(
    "click",
    () => {
      modelFileInput.click()
    },
  )
  getElement<HTMLButtonElement>('[data-action="load-live"]').addEventListener(
    "click",
    () => {
      liveFileInput.click()
    },
  )
  getElement<HTMLButtonElement>('[data-action="analyze"]').addEventListener(
    "click",
    () => {
      void scanModelVideo()
    },
  )
  getElement<HTMLButtonElement>('[data-action="export-log"]').addEventListener(
    "click",
    handleExportLog,
  )
  getElement<HTMLInputElement>('[data-action="toggle-landmarks"]').addEventListener(
    "change",
    (event) => {
      handleToggleLandmarks478(event.currentTarget.checked)
    },
  )
  bindOverlayToggle("toggle-mesh-source", "showMeshSource")
  bindOverlayToggle("toggle-mesh-target", "showMeshTarget")
  bindOverlayToggle("toggle-mesh-pairs", "showMeshPairs")
  bindOverlayToggle("toggle-excluded-landmarks", "showExcludedLandmarks")
  bindOverlayToggle("toggle-grid-anchors", "showGridAnchors")
  bindOverlayToggle("toggle-triangle-mesh", "showTriangleMesh")
  modelFileInput.addEventListener("change", () => {
    handleVideoFileSelection("model", modelFileInput.files?.[0] ?? null)
  })
  liveFileInput.addEventListener("change", () => {
    handleVideoFileSelection("live", liveFileInput.files?.[0] ?? null)
  })
  getElement<HTMLButtonElement>('[data-action="model-prev"]').addEventListener(
    "click",
    () => moveModelReview(-1),
  )
  getElement<HTMLButtonElement>('[data-action="model-next"]').addEventListener(
    "click",
    () => moveModelReview(1),
  )
  getElement<HTMLInputElement>('[data-range="model"]').addEventListener(
    "input",
    (event) => {
      handleModelRangeInput(Number(event.currentTarget.value))
    },
  )
  getElement<HTMLButtonElement>('[data-action="live-play"]').addEventListener(
    "click",
    () => {
      if (!state.liveVideo.loaded) {
        addLog("ライブ動画が未読込のため再生できません。")
        renderAll()
        return
      }
      void liveVideoElement.play().catch(() => {
        addLog("ライブ動画の再生に失敗しました。")
        state.liveVideo.playbackStatus = "paused"
        renderAll()
      })
    },
  )
  getElement<HTMLButtonElement>('[data-action="live-pause"]').addEventListener(
    "click",
    () => {
      liveVideoElement.pause()
    },
  )
  getElement<HTMLButtonElement>('[data-action="live-analyze-current"]').addEventListener(
    "click",
    () => {
      void analyzeCurrentLiveFrame("manual")
    },
  )
  getElement<HTMLInputElement>('[data-action="toggle-webgl-mesh-warp"]').addEventListener(
    "change",
    (event) => {
      handleToggleWebglMeshWarpPreview(event.currentTarget.checked)
    },
  )
  getElement<HTMLInputElement>('[data-range="live"]').addEventListener(
    "input",
    (event) => {
      seekVideoTo("live", Number(event.currentTarget.value))
    },
  )

  modelVideoElement.addEventListener("loadedmetadata", () => {
    syncMetadata("model")
    addLog("モデル動画 metadata を取得しました。")
    renderAll()
  })
  modelVideoElement.addEventListener("timeupdate", () => {
    syncCurrentTime("model")
    drawModelOverlay()
    renderAll()
  })
  liveVideoElement.addEventListener("loadedmetadata", () => {
    syncMetadata("live")
    addLog("ライブ動画 metadata を取得しました。")
    renderAll()
  })
  liveVideoElement.addEventListener("timeupdate", () => {
    syncCurrentTime("live")
    drawLiveOverlay()
    maybeAnalyzeLiveFrame("timeupdate")
    renderAll()
  })
  liveVideoElement.addEventListener("seeked", () => {
    syncCurrentTime("live")
    void analyzeCurrentLiveFrame("seeked")
  })
  liveVideoElement.addEventListener("play", () => {
    state.liveVideo.playbackStatus = "playing"
    renderAll()
  })
  liveVideoElement.addEventListener("pause", () => {
    const durationSec = state.liveVideo.durationSec ?? Number.POSITIVE_INFINITY
    state.liveVideo.playbackStatus =
      state.liveVideo.currentTimeSec <= 0.001 ||
      state.liveVideo.currentTimeSec >= durationSec - 0.001
        ? "stopped"
        : "paused"
    if (state.liveVideo.loaded) {
      void analyzeCurrentLiveFrame("pause")
    }
    renderAll()
  })
  liveVideoElement.addEventListener("ended", () => {
    state.liveVideo.playbackStatus = "stopped"
    if (state.liveVideo.loaded) {
      void analyzeCurrentLiveFrame("ended")
    }
    renderAll()
  })

  app.querySelectorAll<HTMLButtonElement>("[data-tab-group]").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.dataset.tabGroup
      const value = button.dataset.tabValue

      if (group === "preview" && isPreviewTab(value)) {
        state.activePreviewTab = value
        addLog(`${getPreviewTabLabel(value)} タブに切り替えました。`)
        renderAll()
      }

      if (group === "debug" && isDebugTab(value)) {
        state.activeDebugTab = value
        renderAll()
      }
    })
  })

  window.addEventListener("resize", drawAllOverlays)
  window.addEventListener("beforeunload", cleanup)
}

function handleVideoFileSelection(kind: PreviewTab, file: File | null) {
  if (!file) {
    return
  }

  const videoState = kind === "model" ? state.modelVideo : state.liveVideo
  if (videoState.objectUrl) {
    URL.revokeObjectURL(videoState.objectUrl)
  }

  const objectUrl = URL.createObjectURL(file)
  videoState.loaded = true
  videoState.fileName = file.name
  videoState.objectUrl = objectUrl
  videoState.durationSec = null
  videoState.width = null
  videoState.height = null
  videoState.currentTimeSec = 0

  if (kind === "model") {
    state.modelVideo.currentReviewFrameIndex = 0
    state.modelVideo.scanStatus = "idle"
    resetModelScanResults()
    modelVideoElement.src = objectUrl
    modelVideoElement.load()
    state.activePreviewTab = "model"
    addLog(`モデル動画を読み込みました: ${file.name}`)
  } else {
    state.liveVideo.playbackStatus = "stopped"
    resetLiveAnalysisResults()
    liveVideoElement.src = objectUrl
    liveVideoElement.load()
    state.activePreviewTab = "live"
    addLog(`ライブ動画を読み込みました: ${file.name}`)
  }

  renderAll()
}

async function scanModelVideo() {
  if (!state.modelVideo.loaded) {
    addLog("モデル動画が未読込のため解析できません。")
    renderAll()
    return
  }

  if (state.modelScan.scanStatus === "initializing" || state.modelScan.scanStatus === "running") {
    return
  }

  state.activePreviewTab = "model"
  state.modelVideo.scanStatus = "initializing"
  state.modelScan.scanStatus = "initializing"
  state.modelScan.lastError = null
  state.rawIdealReferenceFrames = []
  state.currentAcceptedReviewIndex = null
  disposeModelFaceLandmarker("uninitialized")
  resetModelTimestamp()
  updateScanCounters()
  addLog("モデル動画解析を開始します。")
  renderAll()

  try {
    const detector = await getModelFaceLandmarker()
    const durationSec = state.modelVideo.durationSec ?? modelVideoElement.duration
    if (!Number.isFinite(durationSec) || durationSec <= 0) {
      throw new Error("モデル動画の duration を取得できません。")
    }

    const plannedFrames = Math.min(
      state.modelScan.maxScanFrames,
      Math.floor(durationSec / state.modelScan.scanFrameStepSec) + 1,
    )
    state.modelScan.plannedScanFrames = plannedFrames
    state.modelScan.scanStatus = "running"
    state.modelVideo.scanStatus = "running"
    state.modelScan.mediaPipeStatus = "scanning"
    renderAll()

    for (let frameIndex = 0; frameIndex < plannedFrames; frameIndex += 1) {
      const timeSec = Math.min(frameIndex * state.modelScan.scanFrameStepSec, durationSec)
      await seekVideoElement(modelVideoElement, timeSec)
      const result = detector.detectForVideo(modelVideoElement, nextModelTimestampMs())
      state.rawIdealReferenceFrames.push(buildReferenceFrame(result, frameIndex, timeSec))
      state.modelScan.scanProgress = frameIndex + 1

      if ((frameIndex + 1) % SCAN_RENDER_INTERVAL === 0 || frameIndex + 1 === plannedFrames) {
        updateScanCounters()
        renderAll()
        await nextFrame()
      }
    }

    updateScanCounters()
    state.modelScan.scanStatus = "done"
    state.modelVideo.scanStatus = "done"
    state.currentAcceptedReviewIndex = state.modelScan.acceptedFrames > 0 ? 0 : null
    updateTop1Match()
    disposeModelFaceLandmarker("disposed")
    addLog(
      `モデル動画解析が完了しました。accepted ${state.modelScan.acceptedFrames} / excluded ${state.modelScan.excludedFrames}`,
    )
    await seekToCurrentAcceptedFrame()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    state.modelScan.scanStatus = "error"
    state.modelVideo.scanStatus = "error"
    state.modelScan.mediaPipeStatus = "error"
    state.modelScan.lastError = message
    disposeModelFaceLandmarker("error")
    addLog(`モデル動画解析でエラーが発生しました: ${message}`)
  }

  updateScanCounters()
  renderAll()
}

async function getModelFaceLandmarker() {
  if (modelFaceLandmarker) {
    return modelFaceLandmarker
  }

  if (modelFaceLandmarkerPromise) {
    return modelFaceLandmarkerPromise
  }

  state.modelScan.mediaPipeStatus = "initializing"
  state.modelScan.mediaPipeError = null
  resetModelTimestamp()
  renderAll()

  modelFaceLandmarkerPromise = initializeFaceLandmarker()
  try {
    modelFaceLandmarker = await modelFaceLandmarkerPromise
    state.modelScan.mediaPipeStatus = "ready"
    return modelFaceLandmarker
  } catch (error) {
    state.modelScan.mediaPipeStatus = "error"
    state.modelScan.mediaPipeError = error instanceof Error ? error.message : String(error)
    throw error
  } finally {
    modelFaceLandmarkerPromise = null
    renderAll()
  }
}

async function getLiveFaceLandmarker() {
  if (liveFaceLandmarker) {
    return liveFaceLandmarker
  }

  if (liveFaceLandmarkerPromise) {
    return liveFaceLandmarkerPromise
  }

  state.liveMediaPipe.status = "initializing"
  state.liveMediaPipe.error = null
  resetLiveTimestamp()
  renderAll()

  liveFaceLandmarkerPromise = initializeFaceLandmarker()
  try {
    liveFaceLandmarker = await liveFaceLandmarkerPromise
    state.liveMediaPipe.status = "ready"
    return liveFaceLandmarker
  } catch (error) {
    state.liveMediaPipe.status = "error"
    state.liveMediaPipe.error = error instanceof Error ? error.message : String(error)
    throw error
  } finally {
    liveFaceLandmarkerPromise = null
    renderAll()
  }
}

async function initializeFaceLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
  )

  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
    },
    runningMode: "VIDEO",
    numFaces: 1,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
  })
}

function buildReferenceFrame(
  result: FaceLandmarkerResultLike,
  frameIndex: number,
  timeSec: number,
): IdealReferenceFrame {
  const landmarks = result.faceLandmarks[0] ?? []
  const blendshapes = (result.faceBlendshapes[0]?.categories ?? []).map((category) => ({
    categoryName: category.categoryName,
    score: category.score,
  }))
  const matrix = result.facialTransformationMatrixes[0]
  const hasFace = result.faceLandmarks.length > 0
  const validLandmarks = landmarks.length === REQUIRED_LANDMARK_COUNT
  const excludedReason = !hasFace ? "noFace" : validLandmarks ? null : "invalidLandmarks"
  const excluded = Boolean(excludedReason)
  const referenceLandmarks = validLandmarks ? mapLandmarks(landmarks) : []

  return {
    frameId: `model_frame_${String(frameIndex).padStart(6, "0")}`,
    frameIndex,
    timeSec,
    landmarks478: referenceLandmarks,
    pose: estimateNullablePose(matrix),
    blendshapes,
    expressionGroup: validLandmarks ? classifyExpressionGroup(blendshapes) : "unknown",
    qualityScore: validLandmarks ? 1 : 0,
    excluded,
    excludedReason,
  }
}

function buildCurrentLiveFrameAnalysis(
  result: FaceLandmarkerResultLike,
  timeSec: number,
): CurrentLiveFrameAnalysis {
  const landmarks = result.faceLandmarks[0] ?? []
  const blendshapes = (result.faceBlendshapes[0]?.categories ?? []).map((category) => ({
    categoryName: category.categoryName,
    score: category.score,
  }))
  const matrix = result.facialTransformationMatrixes[0]
  const hasFace = result.faceLandmarks.length > 0
  const validLandmarks = landmarks.length === REQUIRED_LANDMARK_COUNT
  const error = !hasFace ? "noFace" : validLandmarks ? null : "invalidLandmarks"

  return {
    analyzed: true,
    timeSec,
    landmarks478: validLandmarks ? mapLandmarks(landmarks) : [],
    pose: estimateNullablePose(matrix),
    blendshapes,
    expressionGroup: validLandmarks ? classifyExpressionGroup(blendshapes) : "unknown",
    qualityScore: validLandmarks ? 1 : 0,
    error,
  }
}

type FaceLandmarkerResultLike = ReturnType<FaceLandmarker["detectForVideo"]>

function mapLandmarks(landmarks: NormalizedLandmark[]): ReferenceLandmark[] {
  return landmarks.map((landmark, index) => ({
    index,
    x: landmark.x,
    y: landmark.y,
    z: landmark.z,
  }))
}

function estimateNullablePose(matrix: Matrix | undefined): ReferencePose {
  return estimateFacePoseFromMatrix(matrix) ?? {
    yaw: null,
    pitch: null,
    roll: null,
  }
}

function estimateFacePoseFromMatrix(matrix: Matrix | undefined): ReferencePose | null {
  if (
    !matrix ||
    matrix.rows < 3 ||
    matrix.columns < 3 ||
    matrix.data.length < matrix.columns * 3
  ) {
    return null
  }

  const columns = matrix.columns
  const m00 = matrix.data[0 * columns + 0]
  const m10 = matrix.data[1 * columns + 0]
  const m20 = matrix.data[2 * columns + 0]
  const m21 = matrix.data[2 * columns + 1]
  const m22 = matrix.data[2 * columns + 2]

  if ([m00, m10, m20, m21, m22].some((value) => !Number.isFinite(value))) {
    return null
  }

  const sy = Math.hypot(m00, m10)

  return {
    pitch: Math.atan2(m21, m22) * RAD_TO_DEG,
    yaw: Math.atan2(-m20, sy) * RAD_TO_DEG,
    roll: Math.atan2(m10, m00) * RAD_TO_DEG,
  }
}

function classifyExpressionGroup(blendshapes: ReferenceBlendshape[]): ExpressionGroup {
  if (blendshapes.length === 0) {
    return "unknown"
  }

  const scores = new Map(blendshapes.map((item) => [item.categoryName, item.score]))
  const expressionScores: Array<[ExpressionGroup, number]> = [
    ["jawOpen", scores.get("jawOpen") ?? 0],
    [
      "mouthSmile",
      Math.max(scores.get("mouthSmileLeft") ?? 0, scores.get("mouthSmileRight") ?? 0),
    ],
    ["mouthPucker", scores.get("mouthPucker") ?? 0],
    [
      "eyeBlink",
      Math.max(scores.get("eyeBlinkLeft") ?? 0, scores.get("eyeBlinkRight") ?? 0),
    ],
    [
      "eyeSquint",
      Math.max(scores.get("eyeSquintLeft") ?? 0, scores.get("eyeSquintRight") ?? 0),
    ],
  ]
  const strongGroups = expressionScores.filter(([, score]) => score >= MIXED_EXPRESSION_THRESHOLD)

  if (strongGroups.length > 1) {
    return "mixedExpression"
  }

  const strongest = expressionScores.reduce((best, current) =>
    current[1] > best[1] ? current : best,
  )

  return strongest[1] >= STRONG_EXPRESSION_THRESHOLD ? strongest[0] : "neutral"
}

function updateTop1Match() {
  const current = state.currentLiveFrameAnalysis
  if (!current.analyzed) {
    state.top1Match = {
      ...createEmptyTop1Match(),
      error: "currentNotAnalyzed",
    }
    updateCurrentIdealMeshPrototype()
    return
  }

  if (current.error || current.landmarks478.length !== REQUIRED_LANDMARK_COUNT) {
    state.top1Match = {
      ...createEmptyTop1Match(),
      currentExpressionGroup: current.expressionGroup,
      error: `current analysis failed / matching skipped: ${current.error ?? "invalidCurrentLandmarks"}`,
    }
    updateCurrentIdealMeshPrototype()
    return
  }

  const candidates = getAcceptedFrames().filter(
    (frame) => frame.landmarks478.length === REQUIRED_LANDMARK_COUNT,
  )
  if (candidates.length === 0) {
    state.top1Match = {
      ...createEmptyTop1Match(),
      currentExpressionGroup: current.expressionGroup,
      error: "noReferenceFrames",
    }
    updateCurrentIdealMeshPrototype()
    return
  }

  let best: {
    frame: IdealReferenceFrame
    poseDistance: number
    expressionDistance: number
    qualityPenalty: number
    matchScore: number
  } | null = null

  for (const frame of candidates) {
    const poseDistance = calculatePoseDistance(current.pose, frame.pose)
    const expressionDistance = calculateExpressionDistance(
      current.blendshapes,
      frame.blendshapes,
    )
    const qualityPenalty = Math.max(0, 1 - frame.qualityScore)
    const matchScore =
      poseDistance * POSE_WEIGHT +
      expressionDistance * EXPRESSION_WEIGHT +
      qualityPenalty * QUALITY_WEIGHT

    if (!best || matchScore < best.matchScore) {
      best = {
        frame,
        poseDistance,
        expressionDistance,
        qualityPenalty,
        matchScore,
      }
    }
  }

  if (!best) {
    state.top1Match = {
      ...createEmptyTop1Match(),
      currentExpressionGroup: current.expressionGroup,
      error: "noReferenceFrames",
    }
    updateCurrentIdealMeshPrototype()
    return
  }

  state.top1Match = {
    matched: true,
    idealFrameId: best.frame.frameId,
    idealFrameIndex: best.frame.frameIndex,
    idealTimeSec: best.frame.timeSec,
    matchScore: best.matchScore,
    poseDistance: best.poseDistance,
    expressionDistance: best.expressionDistance,
    qualityPenalty: best.qualityPenalty,
    currentExpressionGroup: current.expressionGroup,
    idealExpressionGroup: best.frame.expressionGroup,
    error: null,
  }
  updateCurrentIdealMeshPrototype()
}

function updateCurrentIdealMeshPrototype() {
  const current = state.currentLiveFrameAnalysis
  const idealFrame = getMatchedIdealFrame()
  const modelVideoAspectRatio = getVideoAspectRatio(state.modelVideo)
  const liveVideoAspectRatio = getVideoAspectRatio(state.liveVideo)

  if (
    current.error ||
    current.landmarks478.length !== REQUIRED_LANDMARK_COUNT ||
    !idealFrame ||
    idealFrame.landmarks478.length !== REQUIRED_LANDMARK_COUNT
  ) {
    state.currentIdealMeshPrototype = {
      ...createEmptyCurrentIdealMeshPrototype(modelVideoAspectRatio, liveVideoAspectRatio),
      summary: {
        ...createEmptyMeshPrototypeSummary(liveVideoAspectRatio),
        top1MatchedReferenceId: state.top1Match.idealFrameId,
        currentLandmarkCount: current.landmarks478.length,
      },
    }
    return
  }

  const alignmentResult = alignIdealLandmarksToCurrentFace(
    idealFrame.landmarks478,
    current.landmarks478,
    modelVideoAspectRatio,
    liveVideoAspectRatio,
  )
  const candidateAlignedIdealLandmarks = alignmentResult.landmarks
  const { acceptedCurrentLandmarks, excludedCurrentLandmarks } =
    selectCurrentMeshLandmarkVertices(
      current,
      candidateAlignedIdealLandmarks,
      liveVideoAspectRatio,
    )
  const currentMeshSource = buildCurrentMeshSourceVertices(
    acceptedCurrentLandmarks,
    current.landmarks478,
    liveVideoAspectRatio,
  )
  const { idealMeshTargetVertices, currentIdealMeshPairs } = buildIdealMeshTargetVertices(
    currentMeshSource.vertices,
    candidateAlignedIdealLandmarks,
    liveVideoAspectRatio,
  )
  const triangleMesh = buildTriangleMeshDebug(
    currentMeshSource.vertices,
    liveVideoAspectRatio,
  )
  const webglMeshWarpInput = buildWebglMeshWarpInputDebug(
    currentMeshSource.vertices,
    idealMeshTargetVertices,
    triangleMesh.triangles,
  )
  const aspectDebug = createMeshAspectDebug({
    currentLandmarks: current.landmarks478,
    top1RawIdealReferenceLandmarks: idealFrame.landmarks478,
    candidateAlignedIdealLandmarks,
    acceptedCurrentLandmarks,
    idealMeshTargetVertices,
    alignment: alignmentResult.debug,
    modelVideoAspectRatio,
    liveVideoAspectRatio,
  })
  const summary = summarizeCurrentIdealMeshPrototype({
    currentLandmarkCount: current.landmarks478.length,
    top1MatchedReferenceId: state.top1Match.idealFrameId,
    candidateAlignedIdealLandmarkCount: candidateAlignedIdealLandmarks.length,
    acceptedCurrentLandmarks,
    excludedCurrentLandmarks,
    currentMeshSourceVertices: currentMeshSource.vertices,
    currentIdealMeshPairs,
    dynamicGrid: currentMeshSource.dynamicGrid,
    triangleMesh,
    webglMeshWarpInput,
  })

  state.currentIdealMeshPrototype = {
    candidateAlignedIdealLandmarks,
    acceptedCurrentLandmarks,
    excludedCurrentLandmarks,
    currentMeshSourceVertices: currentMeshSource.vertices,
    idealMeshTargetVertices,
    currentIdealMeshPairs,
    triangleMesh,
    webglMeshWarpInput,
    aspectDebug,
    dynamicGrid: currentMeshSource.dynamicGrid,
    summary,
  }
}

function alignIdealLandmarksToCurrentFace(
  idealLandmarks: ReferenceLandmark[],
  currentLandmarks: ReferenceLandmark[],
  idealVideoAspectRatio: number,
  currentVideoAspectRatio: number,
): {
  landmarks: ReferenceLandmark[]
  debug: MeshAlignmentDebug
} {
  const idealAspectCorrectedLandmarks = idealLandmarks.map((landmark) =>
    toAspectCorrectedPoint(landmark, idealVideoAspectRatio),
  )
  const currentAspectCorrectedLandmarks = currentLandmarks.map((landmark) =>
    toAspectCorrectedPoint(landmark, currentVideoAspectRatio),
  )
  const idealBounds = getLandmarkBounds(idealAspectCorrectedLandmarks)
  const currentBounds = getLandmarkBounds(currentAspectCorrectedLandmarks)
  const idealCenter = getRectCenter(idealBounds)
  const currentCenter = getRectCenter(currentBounds)
  const widthScale = idealBounds.width > 0 ? currentBounds.width / idealBounds.width : 1
  const heightScale = idealBounds.height > 0 ? currentBounds.height / idealBounds.height : 1
  const uniformScale = Number.isFinite(widthScale + heightScale)
    ? Math.min(widthScale, heightScale)
    : 1

  const landmarks = idealLandmarks.map((landmark) => {
    const correctedPoint = toAspectCorrectedPoint(landmark, idealVideoAspectRatio)
    const alignedCorrectedPoint = {
      x: currentCenter.x + (correctedPoint.x - idealCenter.x) * uniformScale,
      y: currentCenter.y + (correctedPoint.y - idealCenter.y) * uniformScale,
    }
    const normalizedPoint = fromAspectCorrectedPoint(
      alignedCorrectedPoint,
      currentVideoAspectRatio,
    )

    return {
      index: landmark.index,
      x: normalizedPoint.x,
      y: normalizedPoint.y,
      z: landmark.z * uniformScale,
    }
  })

  return {
    landmarks,
    debug: {
      videoAspectRatio: currentVideoAspectRatio,
      idealVideoAspectRatio,
      currentVideoAspectRatio,
      idealBoundsAspectCorrected: createBoundsDebugSummary(idealBounds),
      currentBoundsAspectCorrected: createBoundsDebugSummary(currentBounds),
      scale: uniformScale,
      idealCenterAspectCorrected: idealCenter,
      currentCenterAspectCorrected: currentCenter,
    },
  }
}

function selectCurrentMeshLandmarkVertices(
  current: CurrentLiveFrameAnalysis,
  candidateAlignedIdealLandmarks: ReferenceLandmark[],
  videoAspectRatio: number,
) {
  const bounds = getLandmarkBounds(current.landmarks478)
  const center = getRectCenter(bounds)
  const acceptedCurrentLandmarks: CurrentMeshLandmarkVertex[] = []
  const excludedCurrentLandmarks: CurrentMeshLandmarkVertex[] = []
  const blendshapeScores = getBlendshapeScoreMap(current.blendshapes)
  const mouthActivity = Math.max(
    getScore(blendshapeScores, "jawOpen"),
    getScore(blendshapeScores, "mouthPucker"),
    averageScores(blendshapeScores, "mouthSmileLeft", "mouthSmileRight"),
  )
  const eyeActivity = Math.max(
    averageScores(blendshapeScores, "eyeBlinkLeft", "eyeBlinkRight"),
    averageScores(blendshapeScores, "eyeSquintLeft", "eyeSquintRight"),
  )

  for (const landmark of current.landmarks478) {
    const reasons: string[] = []
    let visibilityWeight = 1
    let safetyWeight = 1

    if (!isValidNormalizedPoint(landmark)) {
      excludedCurrentLandmarks.push({
        id: `face:${landmark.index}`,
        kind: "faceLandmark",
        index: landmark.index,
        source: { x: landmark.x, y: landmark.y },
        visibilityWeight: 0,
        safetyWeight: 0,
        usageWeight: 0,
        reasons: ["invalidExcluded"],
      })
      continue
    }

    if (FACE_BOUNDARY_LANDMARK_INDICES.has(landmark.index)) {
      safetyWeight *= FACE_BOUNDARY_USAGE_MULTIPLIER
      reasons.push("boundarySuppressed")
    }

    if (isPoseHiddenSideLandmark(landmark, center, current.pose)) {
      visibilityWeight *= HIDDEN_SIDE_USAGE_MULTIPLIER
      reasons.push("boundarySuppressed")
    }

    if (mouthActivity >= MIXED_EXPRESSION_THRESHOLD && MOUTH_LANDMARK_INDICES.has(landmark.index)) {
      safetyWeight *= EXPRESSION_REGION_USAGE_MULTIPLIER
      reasons.push("mouthSuppressed")
    }

    if (eyeActivity >= MIXED_EXPRESSION_THRESHOLD && EYE_LANDMARK_INDICES.has(landmark.index)) {
      safetyWeight *= EXPRESSION_REGION_USAGE_MULTIPLIER
      reasons.push("eyeSuppressed")
    }

    const candidate = candidateAlignedIdealLandmarks[landmark.index]
    if (candidate && isValidPoint(candidate)) {
      const distance = calculateAspectCorrectedDistance(
        landmark,
        candidate,
        videoAspectRatio,
      )
      if (distance > LARGE_DISPLACEMENT_THRESHOLD) {
        safetyWeight *= LARGE_DISPLACEMENT_USAGE_MULTIPLIER
        reasons.push("largeDisplacementSuppressed")
      }
    }

    const usageWeight = clamp(visibilityWeight * safetyWeight, 0, 1)
    const vertex: CurrentMeshLandmarkVertex = {
      id: `face:${landmark.index}`,
      kind: "faceLandmark",
      index: landmark.index,
      source: { x: landmark.x, y: landmark.y },
      visibilityWeight,
      safetyWeight,
      usageWeight: usageWeight <= EXCLUDE_USAGE_WEIGHT_THRESHOLD ? 0 : usageWeight,
      reasons: reasons.length > 0 ? uniqueStrings(reasons) : ["visibleSafe"],
    }

    if (usageWeight <= EXCLUDE_USAGE_WEIGHT_THRESHOLD) {
      excludedCurrentLandmarks.push({
        ...vertex,
        usageWeight: 0,
        reasons: uniqueStrings([...vertex.reasons, "usageWeightExcluded"]),
      })
    } else {
      acceptedCurrentLandmarks.push(vertex)
    }
  }

  return { acceptedCurrentLandmarks, excludedCurrentLandmarks }
}

function buildCurrentMeshSourceVertices(
  acceptedCurrentLandmarks: CurrentMeshLandmarkVertex[],
  currentLandmarks: ReferenceLandmark[],
  videoAspectRatio: number,
): {
  vertices: MeshSourceVertex[]
  dynamicGrid: DynamicGridDebug
} {
  const faceVertices: MeshSourceVertex[] = acceptedCurrentLandmarks.map((landmark) => ({
    id: landmark.id,
    kind: "faceLandmark",
    index: landmark.index,
    x: landmark.source.x,
    y: landmark.source.y,
    weight: landmark.usageWeight,
    reasons: landmark.reasons,
  }))
  const dynamicGrid = buildDynamicGridVertices(
    acceptedCurrentLandmarks,
    currentLandmarks,
    videoAspectRatio,
  )

  return {
    vertices: [...faceVertices, ...dynamicGrid.vertices],
    dynamicGrid: dynamicGrid.debug,
  }
}

function buildIdealMeshTargetVertices(
  currentMeshSourceVertices: MeshSourceVertex[],
  candidateAlignedIdealLandmarks: ReferenceLandmark[],
  videoAspectRatio: number,
) {
  const idealMeshTargetVertices: MeshTargetVertex[] = []
  const currentIdealMeshPairs: MeshVertexPair[] = []

  for (const sourceVertex of currentMeshSourceVertices) {
    let target = { x: sourceVertex.x, y: sourceVertex.y }
    let usageWeight = 0

    if (sourceVertex.kind === "faceLandmark" && sourceVertex.index !== undefined) {
      const candidate = candidateAlignedIdealLandmarks[sourceVertex.index]
      usageWeight = sourceVertex.weight
      if (candidate && isValidPoint(candidate)) {
        target = lerpPoint({ x: sourceVertex.x, y: sourceVertex.y }, candidate, usageWeight)
      }
    }

    idealMeshTargetVertices.push({
      id: sourceVertex.id,
      kind: sourceVertex.kind,
      index: sourceVertex.index,
      x: target.x,
      y: target.y,
      weight: usageWeight,
      reasons: sourceVertex.reasons,
    })
    currentIdealMeshPairs.push({
      id: sourceVertex.id,
      kind: sourceVertex.kind,
      index: sourceVertex.index,
      source: { x: sourceVertex.x, y: sourceVertex.y },
      target,
      distanceNormalized: calculateNormalizedDistance(
        { x: sourceVertex.x, y: sourceVertex.y },
        target,
      ),
      distanceAspectCorrected: calculateAspectCorrectedDistance(
        { x: sourceVertex.x, y: sourceVertex.y },
        target,
        videoAspectRatio,
      ),
      usageWeight,
      reasons: sourceVertex.reasons,
    })
  }

  return { idealMeshTargetVertices, currentIdealMeshPairs }
}

function buildTriangleMeshDebug(
  sourceVertices: MeshSourceVertex[],
  videoAspectRatio: number,
): TriangleMeshDebug {
  const rawTriangles = buildDelaunayTriangleIndices(sourceVertices, videoAspectRatio)
  const triangleKindCounts = createEmptyTriangleKindCounts()
  const triangleQuality = createEmptyTriangleWarningCounts()
  const includedTriangles: TriangleMeshTriangle[] = []
  let excludedTriangleCount = 0

  for (const indices of rawTriangles) {
    const triangle = evaluateTriangle(sourceVertices, indices, videoAspectRatio)
    for (const warning of triangle.warnings) {
      triangleQuality[warning] += 1
    }

    if (shouldExcludeTriangle(triangle)) {
      excludedTriangleCount += 1
      continue
    }

    triangleKindCounts[triangle.kind] += 1
    includedTriangles.push(triangle)
  }

  const triangleAreas = includedTriangles.map((triangle) => triangle.area)
  const triangleAspectRatios = includedTriangles
    .map((triangle) => triangle.aspectRatio)
    .filter(Number.isFinite)
  const warningTriangleCount = includedTriangles.filter(
    (triangle) => triangle.warnings.length > 0,
  ).length

  return {
    mode: "prototype",
    vertexCount: sourceVertices.length,
    triangleCount: includedTriangles.length,
    validTriangleCount: includedTriangles.length - warningTriangleCount,
    warningTriangleCount,
    excludedTriangleCount,
    triangleKindCounts,
    triangleQuality,
    triangleArea: createMetricRange(triangleAreas),
    triangleAspectRatio: createMetricRange(triangleAspectRatios),
    triangles: includedTriangles,
    trianglePreview: includedTriangles.slice(0, TRIANGLE_PREVIEW_COUNT),
  }
}

function buildWebglMeshWarpInputDebug(
  sourceVertices: MeshSourceVertex[],
  targetVertices: MeshTargetVertex[],
  triangles: TriangleMeshTriangle[],
): WebglMeshWarpInputDebug {
  const sourceUvs = sourceVertices.map((vertex) => ({
    u: vertex.x,
    v: vertex.y,
  }))
  const targetPositions = targetVertices.map((vertex) => ({
    image: {
      x: vertex.x,
      y: vertex.y,
    },
    clip: imageNormalizedToClipSpace(vertex),
  }))
  const indicesBuffer = triangles.flatMap((triangle) => triangle.indices)
  const invalidIndexCount = indicesBuffer.filter(
    (index) =>
      !Number.isInteger(index) ||
      index < 0 ||
      index >= sourceVertices.length,
  ).length
  const outOfRangeUvCount = sourceUvs.filter((uv) => !isUvInRange(uv)).length
  const outOfRangeTargetCount = targetPositions.filter(
    (position) => !isValidNormalizedPoint(position.image),
  ).length
  const outOfRangeClipCount = targetPositions.filter(
    (position) => !isClipPointInRange(position.clip),
  ).length
  const warnings: WebglMeshWarpInputWarning[] = []
  const sourceTargetVertexCountMatch = sourceVertices.length === targetVertices.length
  const triangleCountPositive = triangles.length > 0
  const indexWithinVertexRange = invalidIndexCount === 0
  const sourceUvInRange = outOfRangeUvCount === 0
  const targetImagePositionInRange = outOfRangeTargetCount === 0
  const targetClipPositionInRange = outOfRangeClipCount === 0

  if (!sourceTargetVertexCountMatch) {
    warnings.push("sourceTargetVertexCountMismatch")
  }
  if (!triangleCountPositive || indicesBuffer.length === 0) {
    warnings.push("emptyTriangleIndices")
  }
  if (!indexWithinVertexRange) {
    warnings.push("invalidIndex")
  }
  if (!sourceUvInRange) {
    warnings.push("sourceUvOutOfRange")
  }
  if (!targetImagePositionInRange) {
    warnings.push("targetPositionOutOfRange")
  }
  if (!targetClipPositionInRange) {
    warnings.push("targetClipPositionOutOfRange")
  }

  return {
    mode: "debugOnly",
    webglInputReady: warnings.length === 0,
    vertexCount: sourceVertices.length,
    sourceVertexCount: sourceVertices.length,
    targetVertexCount: targetVertices.length,
    triangleCount: triangles.length,
    indexCount: indicesBuffer.length,
    sourceUvConvention: "imageNormalizedNoFlip",
    targetPositionConvention: "clipSpaceFromImageNormalized",
    sourceUvSummary: {
      uRange: createMinMaxRange(sourceUvs.map((uv) => uv.u)),
      vRange: createMinMaxRange(sourceUvs.map((uv) => uv.v)),
      outOfRangeUvCount,
      sourceUvInRange,
    },
    targetPositionSummary: {
      imageXRange: createMinMaxRange(targetPositions.map((position) => position.image.x)),
      imageYRange: createMinMaxRange(targetPositions.map((position) => position.image.y)),
      clipXRange: createMinMaxRange(targetPositions.map((position) => position.clip.x)),
      clipYRange: createMinMaxRange(targetPositions.map((position) => position.clip.y)),
      outOfRangeTargetCount,
      outOfRangeClipCount,
      targetImagePositionInRange,
      targetClipPositionInRange,
    },
    indexSummary: {
      maxIndex: indicesBuffer.length > 0 ? Math.max(...indicesBuffer) : null,
      indexWithinVertexRange,
      invalidIndexCount,
    },
    coordinateSummary: {
      sourceTargetVertexCountMatch,
      sourceUvInRange,
      targetImagePositionInRange,
      targetClipPositionInRange,
      triangleCountPositive,
    },
    preview: sourceVertices.slice(0, WEBGL_INPUT_PREVIEW_COUNT).map((sourceVertex, vertexIndex) => {
      const targetVertex = targetVertices[vertexIndex]
      const targetPosition = targetPositions[vertexIndex]
      return {
        vertexIndex,
        source: {
          x: sourceVertex.x,
          y: sourceVertex.y,
        },
        target: targetVertex
          ? {
              x: targetVertex.x,
              y: targetVertex.y,
            }
          : null,
        uv: sourceUvs[vertexIndex],
        clip: targetPosition?.clip ?? null,
        kind: sourceVertex.kind,
      }
    }),
    indexPreview: triangles
      .slice(0, WEBGL_INPUT_PREVIEW_COUNT)
      .map((triangle) => triangle.indices),
    warnings,
    warningCount: warnings.length,
  }
}

function buildDelaunayTriangleIndices(
  sourceVertices: MeshSourceVertex[],
  videoAspectRatio: number,
): Array<[number, number, number]> {
  const points = sourceVertices
    .map((vertex, vertexIndex) => ({
      x: vertex.x * videoAspectRatio,
      y: vertex.y,
      vertexIndex,
    }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))

  if (points.length < 3) {
    return []
  }

  const bounds = getLandmarkBounds(points)
  const center = getRectCenter(bounds)
  const span = Math.max(bounds.width, bounds.height, 0.001) * 24
  const superPointStart = points.length
  const workingPoints = [
    ...points,
    { x: center.x - span, y: center.y - span, vertexIndex: -1 },
    { x: center.x, y: center.y + span, vertexIndex: -1 },
    { x: center.x + span, y: center.y - span, vertexIndex: -1 },
  ]
  let triangles: Array<[number, number, number]> = [
    [superPointStart, superPointStart + 1, superPointStart + 2],
  ]

  for (let pointIndex = 0; pointIndex < points.length; pointIndex += 1) {
    const point = workingPoints[pointIndex]
    const badTriangles = triangles.filter((triangle) =>
      isPointInCircumcircle(point, triangle, workingPoints),
    )
    const boundaryEdges = getBoundaryEdges(badTriangles)
    triangles = triangles.filter((triangle) => !badTriangles.includes(triangle))
    triangles.push(...boundaryEdges.map((edge) => [edge[0], edge[1], pointIndex] as [number, number, number]))
  }

  return triangles
    .filter((triangle) => triangle.every((index) => index < superPointStart))
    .map((triangle) => {
      const indices = triangle.map((index) => workingPoints[index].vertexIndex)
      return normalizeTriangleWinding(
        indices as [number, number, number],
        sourceVertices,
        videoAspectRatio,
      )
    })
    .filter((triangle) => new Set(triangle).size === 3)
}

function getBoundaryEdges(triangles: Array<[number, number, number]>) {
  const edgeCounts = new Map<string, { edge: [number, number]; count: number }>()

  for (const triangle of triangles) {
    const edges: Array<[number, number]> = [
      [triangle[0], triangle[1]],
      [triangle[1], triangle[2]],
      [triangle[2], triangle[0]],
    ]

    for (const edge of edges) {
      const key = [...edge].sort((a, b) => a - b).join(":")
      const current = edgeCounts.get(key)
      if (current) {
        current.count += 1
      } else {
        edgeCounts.set(key, { edge, count: 1 })
      }
    }
  }

  return Array.from(edgeCounts.values())
    .filter((entry) => entry.count === 1)
    .map((entry) => entry.edge)
}

function isPointInCircumcircle(
  point: Point2D,
  triangle: [number, number, number],
  points: Point2D[],
) {
  const a = points[triangle[0]]
  const b = points[triangle[1]]
  const c = points[triangle[2]]
  const ax = a.x - point.x
  const ay = a.y - point.y
  const bx = b.x - point.x
  const by = b.y - point.y
  const cx = c.x - point.x
  const cy = c.y - point.y
  const determinant =
    (ax * ax + ay * ay) * (bx * cy - cx * by) -
    (bx * bx + by * by) * (ax * cy - cx * ay) +
    (cx * cx + cy * cy) * (ax * by - bx * ay)
  const orientation = signedTriangleArea(a, b, c)

  return orientation > 0 ? determinant > 0 : determinant < 0
}

function normalizeTriangleWinding(
  indices: [number, number, number],
  sourceVertices: MeshSourceVertex[],
  videoAspectRatio: number,
): [number, number, number] {
  const points = indices.map((index) =>
    toAspectCorrectedPoint(sourceVertices[index], videoAspectRatio),
  ) as [Point2D, Point2D, Point2D]

  return signedTriangleArea(points[0], points[1], points[2]) >= 0
    ? indices
    : [indices[0], indices[2], indices[1]]
}

function evaluateTriangle(
  sourceVertices: MeshSourceVertex[],
  indices: [number, number, number],
  videoAspectRatio: number,
): TriangleMeshTriangle {
  const vertices = indices.map((index) => sourceVertices[index])
  const points = vertices.map((vertex) =>
    toAspectCorrectedPoint(vertex, videoAspectRatio),
  ) as [Point2D, Point2D, Point2D]
  const edgeLengths = [
    calculateNormalizedDistance(points[0], points[1]),
    calculateNormalizedDistance(points[1], points[2]),
    calculateNormalizedDistance(points[2], points[0]),
  ]
  const area = Math.abs(signedTriangleArea(points[0], points[1], points[2]))
  const longestEdge = Math.max(...edgeLengths)
  const aspectRatio = area > 0 ? (longestEdge * longestEdge) / (2 * area) : Number.POSITIVE_INFINITY
  const kind = classifyTriangleKind(vertices.map((vertex) => vertex.kind))
  const warnings: TriangleWarning[] = []

  if (area <= TRIANGLE_MIN_AREA) {
    warnings.push("degenerateTriangle")
  }
  if (area >= TRIANGLE_LARGE_AREA) {
    warnings.push("largeTriangle")
  }
  if (aspectRatio >= TRIANGLE_LONG_THIN_ASPECT_RATIO) {
    warnings.push("longThinTriangle")
  }
  if (isFaceToFarBackgroundTriangle(vertices.map((vertex) => vertex.kind))) {
    warnings.push("faceToFarBackgroundTriangle")
  }

  return {
    indices,
    kind,
    area,
    aspectRatio,
    warnings,
  }
}

function classifyTriangleKind(kinds: MeshVertexKind[]): TriangleKind {
  if (kinds.includes("screenEdgeAnchor")) {
    return "edgeAnchor"
  }
  if (kinds.every((kind) => kind === "faceLandmark")) {
    return "faceOnly"
  }
  if (kinds.includes("faceLandmark") && kinds.includes("nearFaceGrid")) {
    return "faceToNearGrid"
  }
  if (kinds.every((kind) => kind === "nearFaceGrid")) {
    return "nearGridOnly"
  }
  if (kinds.includes("nearFaceGrid") && kinds.includes("backgroundGrid")) {
    return "nearToBackground"
  }
  if (kinds.every((kind) => kind === "backgroundGrid")) {
    return "backgroundOnly"
  }
  return "mixed"
}

function isFaceToFarBackgroundTriangle(kinds: MeshVertexKind[]) {
  return (
    kinds.includes("faceLandmark") &&
    (kinds.includes("backgroundGrid") || kinds.includes("screenEdgeAnchor"))
  )
}

function shouldExcludeTriangle(triangle: TriangleMeshTriangle) {
  return (
    triangle.warnings.includes("degenerateTriangle") ||
    triangle.warnings.includes("faceToFarBackgroundTriangle")
  )
}

function buildDynamicGridVertices(
  acceptedCurrentLandmarks: CurrentMeshLandmarkVertex[],
  currentLandmarks: ReferenceLandmark[],
  videoAspectRatio: number,
): {
  vertices: MeshSourceVertex[]
  debug: DynamicGridDebug
} {
  const acceptedPoints = acceptedCurrentLandmarks
    .map((landmark) => landmark.source)
    .filter(isValidNormalizedPoint)
  const faceBoundsSourcePoints =
    acceptedPoints.length > 0 ? acceptedPoints : currentLandmarks.filter(isValidNormalizedPoint)
  const faceBounds = getLandmarkBoundsOrNull(
    faceBoundsSourcePoints.map((point) => toAspectCorrectedPoint(point, videoAspectRatio)),
  )
  const expandedNearFaceBounds = faceBounds
    ? expandAspectCorrectedRect(
        faceBounds,
        DYNAMIC_GRID_NEAR_FACE_EXPAND_RATIO,
        videoAspectRatio,
      )
    : null
  const faceInteriorVertices = acceptedCurrentLandmarks.map((landmark) => ({
    id: landmark.id,
    kind: "faceLandmark" as const,
    index: landmark.index,
    x: landmark.source.x,
    y: landmark.source.y,
    weight: landmark.usageWeight,
    reasons: landmark.reasons,
  }))
  const faceOnlyTriangleIndices = buildDelaunayTriangleIndices(
    faceInteriorVertices,
    videoAspectRatio,
  )
  const faceInteriorTestTriangleIndices = faceOnlyTriangleIndices.filter((indices) =>
    isTriangleUsableForFaceInterior(faceInteriorVertices, indices, videoAspectRatio),
  )
  const faceInteriorDebug = createFaceInteriorDebug(
    faceInteriorVertices,
    faceOnlyTriangleIndices,
    faceInteriorTestTriangleIndices,
    videoAspectRatio,
  )
  const density = estimateFaceLandmarkDensity(acceptedPoints, videoAspectRatio)
  const faceMedianNearestDistance =
    density.faceMedianNearestDistance ?? DYNAMIC_GRID_DEFAULT_FACE_MEDIAN_DISTANCE
  const nearFaceGridSpacing = clamp(
    faceMedianNearestDistance * NEAR_FACE_GRID_SPACING_RATIO,
    MIN_NEAR_FACE_GRID_SPACING,
    MAX_NEAR_FACE_GRID_SPACING,
  )
  const tooCloseToFaceThreshold =
    nearFaceGridSpacing * NEAR_FACE_TOO_CLOSE_TO_FACE_SPACING_RATIO
  const backgroundGridSpacing = clamp(
    faceMedianNearestDistance * BACKGROUND_GRID_SPACING_RATIO,
    MIN_BACKGROUND_GRID_SPACING,
    MAX_BACKGROUND_GRID_SPACING,
  )
  const screenEdgeAnchorSpacing = backgroundGridSpacing * SCREEN_EDGE_ANCHOR_SPACING_RATIO
  const vertices: MeshSourceVertex[] = []
  const occupiedKeys = new Set<string>()
  let nearFaceCandidateGridCount = 0
  let nearFaceRemovedInsideFaceCount = 0
  let nearFaceRemovedTooCloseToFaceCount = 0

  const addVertex = (
    kind: MeshVertexKind,
    point: Point2D,
    idPrefix: string,
    reasons: string[],
  ): MeshSourceVertex | null => {
    const normalized = fromAspectCorrectedPoint(point, videoAspectRatio)
    const vertexPoint = {
      x: clamp(normalized.x, 0, 1),
      y: clamp(normalized.y, 0, 1),
    }
    const key = createGridVertexKey(vertexPoint)
    if (occupiedKeys.has(key)) {
      return null
    }
    occupiedKeys.add(key)
    const vertex = {
      id: `${idPrefix}:${countVerticesByKind(vertices, kind)}`,
      kind,
      x: vertexPoint.x,
      y: vertexPoint.y,
      weight: 0,
      reasons,
    }
    vertices.push(vertex)
    return vertex
  }

  if (expandedNearFaceBounds) {
    forEachAspectCorrectedGridPoint(
      expandedNearFaceBounds,
      nearFaceGridSpacing,
      (point) => {
        nearFaceCandidateGridCount += 1
        const normalizedPoint = fromAspectCorrectedPoint(point, videoAspectRatio)
        if (
          isPointInsideFaceInterior(
            normalizedPoint,
            faceInteriorVertices,
            faceInteriorTestTriangleIndices,
            videoAspectRatio,
          )
        ) {
          nearFaceRemovedInsideFaceCount += 1
          return
        }
        if (
          isPointTooCloseToFaceLandmark(
            point,
            acceptedPoints,
            tooCloseToFaceThreshold,
            videoAspectRatio,
          )
        ) {
          nearFaceRemovedTooCloseToFaceCount += 1
          return
        }
        addVertex("nearFaceGrid", point, "grid:near", ["filledNearFaceGrid"])
      },
    )
  }

  forEachAspectCorrectedGridPoint(
    { x: 0, y: 0, width: videoAspectRatio, height: 1 },
    backgroundGridSpacing,
    (point) => {
      if (expandedNearFaceBounds && isPointInsideRect(point, expandedNearFaceBounds)) {
        return
      }
      if (isPointOnAspectCorrectedScreenEdge(point, videoAspectRatio)) {
        return
      }
      addVertex("backgroundGrid", point, "grid:background", ["dynamicBackgroundGrid"])
    },
  )

  for (const point of buildScreenEdgeAnchorPoints(videoAspectRatio, screenEdgeAnchorSpacing)) {
    addVertex("screenEdgeAnchor", point, "anchor:screen", ["dynamicScreenEdgeAnchor"])
  }

  const debug: DynamicGridDebug = {
    mode: "dynamic",
    nearFaceGridMode: "filledRegionMinusFaceInterior",
    acceptedFaceLandmarkCount: acceptedPoints.length,
    faceMedianNearestDistance,
    faceNearestDistanceSampleCount: density.faceNearestDistanceSampleCount,
    nearFaceGridSpacing,
    backgroundGridSpacing,
    screenEdgeAnchorSpacing,
    nearFaceGridSpacingRatioToFaceMedian: calculateSpacingRatio(
      nearFaceGridSpacing,
      faceMedianNearestDistance,
    ),
    backgroundGridSpacingRatioToFaceMedian: calculateSpacingRatio(
      backgroundGridSpacing,
      faceMedianNearestDistance,
    ),
    faceOnlyTriangleCount: faceInteriorDebug.faceOnlyTriangleCount,
    faceInteriorTestTriangleCount: faceInteriorDebug.faceInteriorTestTriangleCount,
    nearFaceCandidateGridCount,
    nearFaceRemovedInsideFaceCount,
    nearFaceRemovedTooCloseToFaceCount,
    nearFaceAcceptedGridCount: countVerticesByKind(vertices, "nearFaceGrid"),
    tooCloseToFaceThreshold,
    nearFaceGridCount: countVerticesByKind(vertices, "nearFaceGrid"),
    backgroundGridCount: countVerticesByKind(vertices, "backgroundGrid"),
    screenEdgeAnchorCount: countVerticesByKind(vertices, "screenEdgeAnchor"),
    faceBounds: faceBounds ? createBoundsDebugSummary(faceBounds) : null,
    expandedNearFaceBounds: expandedNearFaceBounds
      ? createBoundsDebugSummary(expandedNearFaceBounds)
      : null,
    videoAspectRatio,
    nearFaceGrid: {
      mode: "filledRegionMinusFaceInterior",
      candidateGridCount: nearFaceCandidateGridCount,
      removedInsideFaceCount: nearFaceRemovedInsideFaceCount,
      removedTooCloseToFaceCount: nearFaceRemovedTooCloseToFaceCount,
      acceptedGridCount: countVerticesByKind(vertices, "nearFaceGrid"),
      tooCloseToFaceThreshold,
      gridPointPreview: vertices
        .filter((vertex) => vertex.kind === "nearFaceGrid")
        .slice(0, LANDMARK_PREVIEW_COUNT)
        .map((vertex) => ({
          id: vertex.id,
          kind: vertex.kind,
          x: vertex.x,
          y: vertex.y,
          reasons: vertex.reasons,
        })),
    },
    faceInterior: faceInteriorDebug,
    gridPointPreview: vertices.slice(0, LANDMARK_PREVIEW_COUNT).map((vertex) => ({
      id: vertex.id,
      kind: vertex.kind,
      x: vertex.x,
      y: vertex.y,
      reasons: vertex.reasons,
    })),
  }

  return { vertices, debug }
}

function estimateFaceLandmarkDensity(
  points: Point2D[],
  videoAspectRatio: number,
): {
  faceMedianNearestDistance: number | null
  faceNearestDistanceSampleCount: number
} {
  const validPoints = points.filter(isValidNormalizedPoint)
  if (validPoints.length < 2) {
    return {
      faceMedianNearestDistance: null,
      faceNearestDistanceSampleCount: validPoints.length,
    }
  }

  const step = Math.max(1, Math.ceil(validPoints.length / DYNAMIC_GRID_NEAREST_SAMPLE_LIMIT))
  const sampledPoints = validPoints.filter((_, index) => index % step === 0)
  const nearestDistances: number[] = []

  for (const point of sampledPoints) {
    let nearest = Number.POSITIVE_INFINITY
    for (const other of validPoints) {
      if (point === other) {
        continue
      }
      nearest = Math.min(nearest, calculateAspectCorrectedDistance(point, other, videoAspectRatio))
    }
    if (Number.isFinite(nearest)) {
      nearestDistances.push(nearest)
    }
  }

  return {
    faceMedianNearestDistance: medianNumber(nearestDistances),
    faceNearestDistanceSampleCount: nearestDistances.length,
  }
}

function isTriangleUsableForFaceInterior(
  faceVertices: MeshSourceVertex[],
  indices: [number, number, number],
  videoAspectRatio: number,
) {
  const points = indices.map((index) =>
    toAspectCorrectedPoint(faceVertices[index], videoAspectRatio),
  ) as [Point2D, Point2D, Point2D]

  return Math.abs(signedTriangleArea(points[0], points[1], points[2])) > TRIANGLE_MIN_AREA
}

function createFaceInteriorDebug(
  faceVertices: MeshSourceVertex[],
  faceOnlyTriangleIndices: Array<[number, number, number]>,
  faceInteriorTestTriangleIndices: Array<[number, number, number]>,
  videoAspectRatio: number,
): FaceInteriorDebug {
  return {
    faceOnlyTriangleCount: faceOnlyTriangleIndices.length,
    faceInteriorTestTriangleCount: faceInteriorTestTriangleIndices.length,
    preview: faceInteriorTestTriangleIndices
      .slice(0, TRIANGLE_PREVIEW_COUNT)
      .map((indices) => ({
        indices,
        area: calculateTriangleArea(faceVertices, indices, videoAspectRatio),
      })),
  }
}

function calculateTriangleArea(
  vertices: MeshSourceVertex[],
  indices: [number, number, number],
  videoAspectRatio: number,
) {
  const points = indices.map((index) =>
    toAspectCorrectedPoint(vertices[index], videoAspectRatio),
  ) as [Point2D, Point2D, Point2D]

  return Math.abs(signedTriangleArea(points[0], points[1], points[2]))
}

function isPointInsideFaceInterior(
  point: Point2D,
  faceVertices: MeshSourceVertex[],
  faceOnlyTriangleIndices: Array<[number, number, number]>,
  videoAspectRatio: number,
): boolean {
  if (faceOnlyTriangleIndices.length === 0) {
    return false
  }

  const correctedPoint = toAspectCorrectedPoint(point, videoAspectRatio)
  return faceOnlyTriangleIndices.some((indices) => {
    const triangle = indices.map((index) =>
      toAspectCorrectedPoint(faceVertices[index], videoAspectRatio),
    ) as [Point2D, Point2D, Point2D]
    return isPointInTriangle(correctedPoint, triangle)
  })
}

function isPointInTriangle(
  point: Point2D,
  triangle: [Point2D, Point2D, Point2D],
) {
  const [a, b, c] = triangle
  const area = signedTriangleArea(a, b, c)
  if (Math.abs(area) <= TRIANGLE_MIN_AREA) {
    return false
  }

  const ab = signedTriangleArea(a, b, point)
  const bc = signedTriangleArea(b, c, point)
  const ca = signedTriangleArea(c, a, point)
  const epsilon = TRIANGLE_MIN_AREA

  return area > 0
    ? ab >= -epsilon && bc >= -epsilon && ca >= -epsilon
    : ab <= epsilon && bc <= epsilon && ca <= epsilon
}

function isPointTooCloseToFaceLandmark(
  aspectCorrectedPoint: Point2D,
  facePoints: Point2D[],
  threshold: number,
  videoAspectRatio: number,
) {
  return facePoints.some((facePoint) => {
    const correctedFacePoint = toAspectCorrectedPoint(facePoint, videoAspectRatio)
    return calculateNormalizedDistance(aspectCorrectedPoint, correctedFacePoint) < threshold
  })
}

function expandAspectCorrectedRect(
  rect: Rect,
  ratio: number,
  videoAspectRatio: number,
): Rect {
  const marginX = rect.width * ratio
  const marginY = rect.height * ratio
  const minX = clamp(rect.x - marginX, 0, videoAspectRatio)
  const minY = clamp(rect.y - marginY, 0, 1)
  const maxX = clamp(rect.x + rect.width + marginX, 0, videoAspectRatio)
  const maxY = clamp(rect.y + rect.height + marginY, 0, 1)

  return {
    x: minX,
    y: minY,
    width: Math.max(0.001, maxX - minX),
    height: Math.max(0.001, maxY - minY),
  }
}

function forEachAspectCorrectedGridPoint(
  bounds: Rect,
  spacing: number,
  callback: (point: Point2D) => void,
) {
  const minX = bounds.x
  const maxX = bounds.x + bounds.width
  const minY = bounds.y
  const maxY = bounds.y + bounds.height

  for (let y = minY; y <= maxY + spacing * 0.5; y += spacing) {
    for (let x = minX; x <= maxX + spacing * 0.5; x += spacing) {
      callback({
        x: clamp(x, minX, maxX),
        y: clamp(y, minY, maxY),
      })
    }
  }
}

function buildScreenEdgeAnchorPoints(
  videoAspectRatio: number,
  spacing: number,
): Point2D[] {
  const points: Point2D[] = []
  const add = (point: Point2D) => {
    const key = `${Math.round(point.x * GRID_VERTEX_KEY_PRECISION)}:${Math.round(
      point.y * GRID_VERTEX_KEY_PRECISION,
    )}`
    if (
      points.some(
        (existing) =>
          `${Math.round(existing.x * GRID_VERTEX_KEY_PRECISION)}:${Math.round(
            existing.y * GRID_VERTEX_KEY_PRECISION,
          )}` === key,
      )
    ) {
      return
    }
    points.push(point)
  }

  const horizontalSegments = Math.max(1, Math.ceil(videoAspectRatio / spacing))
  const verticalSegments = Math.max(1, Math.ceil(1 / spacing))

  for (let index = 0; index <= horizontalSegments; index += 1) {
    const x = (videoAspectRatio * index) / horizontalSegments
    add({ x, y: 0 })
    add({ x, y: 1 })
  }

  for (let index = 0; index <= verticalSegments; index += 1) {
    const y = index / verticalSegments
    add({ x: 0, y })
    add({ x: videoAspectRatio, y })
  }

  return points
}

function createGridVertexKey(point: Point2D) {
  return `${Math.round(point.x * GRID_VERTEX_KEY_PRECISION)}:${Math.round(
    point.y * GRID_VERTEX_KEY_PRECISION,
  )}`
}

function isPointOnAspectCorrectedScreenEdge(point: Point2D, videoAspectRatio: number) {
  return (
    point.x <= 0 ||
    point.y <= 0 ||
    point.x >= videoAspectRatio ||
    point.y >= 1
  )
}

function calculateSpacingRatio(spacing: number | null, faceMedian: number | null) {
  if (!spacing || !faceMedian || faceMedian <= 0) {
    return null
  }
  return spacing / faceMedian
}

function createMeshAspectDebug({
  currentLandmarks,
  top1RawIdealReferenceLandmarks,
  candidateAlignedIdealLandmarks,
  acceptedCurrentLandmarks,
  idealMeshTargetVertices,
  alignment,
  modelVideoAspectRatio,
  liveVideoAspectRatio,
}: {
  currentLandmarks: ReferenceLandmark[]
  top1RawIdealReferenceLandmarks: ReferenceLandmark[]
  candidateAlignedIdealLandmarks: ReferenceLandmark[]
  acceptedCurrentLandmarks: CurrentMeshLandmarkVertex[]
  idealMeshTargetVertices: MeshTargetVertex[]
  alignment: MeshAlignmentDebug | null
  modelVideoAspectRatio: number
  liveVideoAspectRatio: number
}): MeshAspectDebug {
  return {
    videoAspectRatio: liveVideoAspectRatio,
    modelVideoAspectRatio,
    liveVideoAspectRatio,
    alignment,
    bounds: {
      currentLandmarks: createBoundsDebug(currentLandmarks, liveVideoAspectRatio),
      top1RawIdealReferenceLandmarks: createBoundsDebug(
        top1RawIdealReferenceLandmarks,
        modelVideoAspectRatio,
      ),
      candidateAlignedIdealLandmarks: createBoundsDebug(
        candidateAlignedIdealLandmarks,
        liveVideoAspectRatio,
      ),
      acceptedCurrentMeshSourceFaceLandmarks: createBoundsDebug(
        acceptedCurrentLandmarks.map((landmark) => landmark.source),
        liveVideoAspectRatio,
      ),
      idealMeshTargetFaceLandmarks: createBoundsDebug(
        idealMeshTargetVertices
          .filter((vertex) => vertex.kind === "faceLandmark")
          .map((vertex) => ({ x: vertex.x, y: vertex.y })),
        liveVideoAspectRatio,
      ),
    },
  }
}

function summarizeCurrentIdealMeshPrototype({
  currentLandmarkCount,
  top1MatchedReferenceId,
  candidateAlignedIdealLandmarkCount,
  acceptedCurrentLandmarks,
  excludedCurrentLandmarks,
  currentMeshSourceVertices,
  currentIdealMeshPairs,
  dynamicGrid,
  triangleMesh,
  webglMeshWarpInput,
}: {
  currentLandmarkCount: number
  top1MatchedReferenceId: string | null
  candidateAlignedIdealLandmarkCount: number
  acceptedCurrentLandmarks: CurrentMeshLandmarkVertex[]
  excludedCurrentLandmarks: CurrentMeshLandmarkVertex[]
  currentMeshSourceVertices: MeshSourceVertex[]
  currentIdealMeshPairs: MeshVertexPair[]
  dynamicGrid: DynamicGridDebug
  triangleMesh: TriangleMeshDebug
  webglMeshWarpInput: WebglMeshWarpInputDebug
}): MeshPrototypeSummary {
  const usageWeights = currentIdealMeshPairs.map((pair) => pair.usageWeight)
  const allLandmarkVertices = [...acceptedCurrentLandmarks, ...excludedCurrentLandmarks]

  return {
    gridMode: dynamicGrid.mode,
    nearFaceGridMode: dynamicGrid.nearFaceGridMode,
    triangleMode: triangleMesh.mode,
    top1MatchedReferenceId,
    currentLandmarkCount,
    candidateAlignedIdealLandmarkCount,
    acceptedFaceLandmarkCount: dynamicGrid.acceptedFaceLandmarkCount,
    faceMedianNearestDistance: dynamicGrid.faceMedianNearestDistance,
    faceNearestDistanceSampleCount: dynamicGrid.faceNearestDistanceSampleCount,
    nearFaceGridSpacing: dynamicGrid.nearFaceGridSpacing,
    backgroundGridSpacing: dynamicGrid.backgroundGridSpacing,
    screenEdgeAnchorSpacing: dynamicGrid.screenEdgeAnchorSpacing,
    nearFaceGridSpacingRatioToFaceMedian:
      dynamicGrid.nearFaceGridSpacingRatioToFaceMedian,
    backgroundGridSpacingRatioToFaceMedian:
      dynamicGrid.backgroundGridSpacingRatioToFaceMedian,
    faceOnlyTriangleCount: dynamicGrid.faceOnlyTriangleCount,
    faceInteriorTestTriangleCount: dynamicGrid.faceInteriorTestTriangleCount,
    nearFaceCandidateGridCount: dynamicGrid.nearFaceCandidateGridCount,
    nearFaceRemovedInsideFaceCount: dynamicGrid.nearFaceRemovedInsideFaceCount,
    nearFaceRemovedTooCloseToFaceCount: dynamicGrid.nearFaceRemovedTooCloseToFaceCount,
    nearFaceAcceptedGridCount: dynamicGrid.nearFaceAcceptedGridCount,
    tooCloseToFaceThreshold: dynamicGrid.tooCloseToFaceThreshold,
    faceBounds: dynamicGrid.faceBounds,
    expandedNearFaceBounds: dynamicGrid.expandedNearFaceBounds,
    videoAspectRatio: dynamicGrid.videoAspectRatio,
    visibleCurrentLandmarkCount: acceptedCurrentLandmarks.length,
    excludedCurrentLandmarkCount: excludedCurrentLandmarks.length,
    faceSourceVertexCount: countVerticesByKind(currentMeshSourceVertices, "faceLandmark"),
    nearFaceGridCount: countVerticesByKind(currentMeshSourceVertices, "nearFaceGrid"),
    backgroundGridCount: countVerticesByKind(currentMeshSourceVertices, "backgroundGrid"),
    screenEdgeAnchorCount: countVerticesByKind(currentMeshSourceVertices, "screenEdgeAnchor"),
    meshPairCount: currentIdealMeshPairs.length,
    vertexCount: triangleMesh.vertexCount,
    triangleCount: triangleMesh.triangleCount,
    validTriangleCount: triangleMesh.validTriangleCount,
    warningTriangleCount: triangleMesh.warningTriangleCount,
    excludedTriangleCount: triangleMesh.excludedTriangleCount,
    triangleKindCounts: triangleMesh.triangleKindCounts,
    triangleQuality: triangleMesh.triangleQuality,
    triangleArea: triangleMesh.triangleArea,
    triangleAspectRatio: triangleMesh.triangleAspectRatio,
    webglInputReady: webglMeshWarpInput.webglInputReady,
    webglInputWarningCount: webglMeshWarpInput.warningCount,
    webglInputWarnings: webglMeshWarpInput.warnings,
    usageWeightAverage: usageWeights.length > 0 ? averageNumbers(usageWeights) : null,
    usageWeightMin: usageWeights.length > 0 ? Math.min(...usageWeights) : null,
    usageWeightMax: usageWeights.length > 0 ? Math.max(...usageWeights) : null,
    boundarySuppressedCount: countVerticesWithReason(allLandmarkVertices, "boundarySuppressed"),
    mouthSuppressedCount: countVerticesWithReason(allLandmarkVertices, "mouthSuppressed"),
    eyeSuppressedCount: countVerticesWithReason(allLandmarkVertices, "eyeSuppressed"),
    largeDisplacementSuppressedCount: countVerticesWithReason(
      allLandmarkVertices,
      "largeDisplacementSuppressed",
    ),
    invalidExcludedCount: countVerticesWithReason(excludedCurrentLandmarks, "invalidExcluded"),
  }
}

function calculatePoseDistance(current: ReferencePose, ideal: ReferencePose) {
  if (
    current.yaw === null ||
    current.pitch === null ||
    current.roll === null ||
    ideal.yaw === null ||
    ideal.pitch === null ||
    ideal.roll === null
  ) {
    return POSE_MISSING_PENALTY
  }

  const yawDiff = current.yaw - ideal.yaw
  const pitchDiff = current.pitch - ideal.pitch
  const rollDiff = current.roll - ideal.roll
  return yawDiff * yawDiff + pitchDiff * pitchDiff + rollDiff * rollDiff
}

function calculateExpressionDistance(
  currentBlendshapes: ReferenceBlendshape[],
  idealBlendshapes: ReferenceBlendshape[],
) {
  const currentScores = getBlendshapeScoreMap(currentBlendshapes)
  const idealScores = getBlendshapeScoreMap(idealBlendshapes)
  const currentSmile = averageScores(currentScores, "mouthSmileLeft", "mouthSmileRight")
  const idealSmile = averageScores(idealScores, "mouthSmileLeft", "mouthSmileRight")
  const currentBlink = averageScores(currentScores, "eyeBlinkLeft", "eyeBlinkRight")
  const idealBlink = averageScores(idealScores, "eyeBlinkLeft", "eyeBlinkRight")
  const currentSquint = averageScores(currentScores, "eyeSquintLeft", "eyeSquintRight")
  const idealSquint = averageScores(idealScores, "eyeSquintLeft", "eyeSquintRight")
  const diffs = [
    getScore(currentScores, "jawOpen") - getScore(idealScores, "jawOpen"),
    currentSmile - idealSmile,
    getScore(currentScores, "mouthPucker") - getScore(idealScores, "mouthPucker"),
    currentBlink - idealBlink,
    currentSquint - idealSquint,
  ]

  return diffs.reduce((sum, diff) => sum + diff * diff, 0)
}

function getBlendshapeScoreMap(blendshapes: ReferenceBlendshape[]) {
  return new Map(blendshapes.map((item) => [item.categoryName, item.score]))
}

function getScore(scores: Map<string, number>, key: string) {
  return scores.get(key) ?? 0
}

function averageScores(scores: Map<string, number>, leftKey: string, rightKey: string) {
  return (getScore(scores, leftKey) + getScore(scores, rightKey)) / 2
}

function getLandmarkBounds(landmarks: Array<{ x: number; y: number }>): Rect {
  const validPoints = landmarks.filter(isValidPoint)
  if (validPoints.length === 0) {
    return {
      x: 0.35,
      y: 0.25,
      width: 0.3,
      height: 0.5,
    }
  }

  const xs = validPoints.map((point) => point.x)
  const ys = validPoints.map((point) => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  return {
    x: minX,
    y: minY,
    width: Math.max(0.001, maxX - minX),
    height: Math.max(0.001, maxY - minY),
  }
}

function getLandmarkBoundsOrNull(landmarks: Array<{ x: number; y: number }>): Rect | null {
  const validPoints = landmarks.filter(isValidPoint)
  if (validPoints.length === 0) {
    return null
  }

  const xs = validPoints.map((point) => point.x)
  const ys = validPoints.map((point) => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  return {
    x: minX,
    y: minY,
    width: Math.max(0.001, maxX - minX),
    height: Math.max(0.001, maxY - minY),
  }
}

function toAspectCorrectedPoint(point: Point2D, videoAspectRatio: number): Point2D {
  return {
    x: point.x * videoAspectRatio,
    y: point.y,
  }
}

function fromAspectCorrectedPoint(point: Point2D, videoAspectRatio: number): Point2D {
  return {
    x: point.x / videoAspectRatio,
    y: point.y,
  }
}

function imageNormalizedToClipSpace(point: Point2D): Point2D {
  return {
    x: point.x * 2 - 1,
    y: 1 - point.y * 2,
  }
}

function imageNormalizedToDisplayedClipSpace(
  point: Point2D,
  displayedContentRect: Rect,
  containerWidth: number,
  containerHeight: number,
): Point2D {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return imageNormalizedToClipSpace(point)
  }

  const pixelX = displayedContentRect.x + point.x * displayedContentRect.width
  const pixelY = displayedContentRect.y + point.y * displayedContentRect.height
  return {
    x: (pixelX / containerWidth) * 2 - 1,
    y: 1 - (pixelY / containerHeight) * 2,
  }
}

function calculateNormalizedDistance(source: Point2D, target: Point2D) {
  return Math.hypot(target.x - source.x, target.y - source.y)
}

function signedTriangleArea(a: Point2D, b: Point2D, c: Point2D) {
  return ((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)) / 2
}

function calculateAspectCorrectedDistance(
  source: Point2D,
  target: Point2D,
  videoAspectRatio: number,
) {
  const dx = (target.x - source.x) * videoAspectRatio
  const dy = target.y - source.y
  return Math.hypot(dx, dy)
}

function getVideoAspectRatio(videoState: VideoPreviewState) {
  if (videoState.width && videoState.height && videoState.height > 0) {
    return videoState.width / videoState.height
  }
  return 1
}

function createBoundsDebug(
  points: Array<{ x: number; y: number }>,
  videoAspectRatio: number,
): CoordinateBoundsDebug {
  const normalizedBounds = getLandmarkBoundsOrNull(points)
  const aspectCorrectedBounds = getLandmarkBoundsOrNull(
    points.map((point) => toAspectCorrectedPoint(point, videoAspectRatio)),
  )

  return {
    normalized: normalizedBounds ? createBoundsDebugSummary(normalizedBounds) : null,
    aspectCorrected: aspectCorrectedBounds ? createBoundsDebugSummary(aspectCorrectedBounds) : null,
  }
}

function createBoundsDebugSummary(rect: Rect): BoundsDebugSummary {
  return {
    minX: rect.x,
    maxX: rect.x + rect.width,
    minY: rect.y,
    maxY: rect.y + rect.height,
    width: rect.width,
    height: rect.height,
    aspect: rect.height > 0 ? rect.width / rect.height : null,
  }
}

function getRectCenter(rect: Rect): Point2D {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  }
}

function expandRect(rect: Rect, margin: number): Rect {
  return {
    x: clamp(rect.x - margin, 0, 1),
    y: clamp(rect.y - margin, 0, 1),
    width: clamp(rect.width + margin * 2, 0, 1),
    height: clamp(rect.height + margin * 2, 0, 1),
  }
}

function isPointInsideRect(point: Point2D, rect: Rect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}

function isValidPoint(point: { x: number; y: number }) {
  return Number.isFinite(point.x) && Number.isFinite(point.y)
}

function isValidNormalizedPoint(point: { x: number; y: number }) {
  return isValidPoint(point) && point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1
}

function isUvInRange(uv: { u: number; v: number }) {
  return (
    Number.isFinite(uv.u) &&
    Number.isFinite(uv.v) &&
    uv.u >= 0 &&
    uv.u <= 1 &&
    uv.v >= 0 &&
    uv.v <= 1
  )
}

function isClipPointInRange(point: Point2D) {
  return (
    isValidPoint(point) &&
    point.x >= -1 &&
    point.x <= 1 &&
    point.y >= -1 &&
    point.y <= 1
  )
}

function isPoseHiddenSideLandmark(
  landmark: ReferenceLandmark,
  center: Point2D,
  pose: ReferencePose,
) {
  if (pose.yaw === null || Math.abs(pose.yaw) < HIDDEN_SIDE_YAW_THRESHOLD_DEG) {
    return false
  }

  const leftSide = landmark.x < center.x - 0.08
  const rightSide = landmark.x > center.x + 0.08
  return pose.yaw > 0 ? leftSide : rightSide
}

function lerpPoint(source: Point2D, target: Point2D, amount: number): Point2D {
  return {
    x: interpolate(source.x, target.x, amount),
    y: interpolate(source.y, target.y, amount),
  }
}

function interpolate(start: number, end: number, amount: number) {
  return start + (end - start) * amount
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values))
}

function countVerticesByKind(vertices: MeshSourceVertex[], kind: MeshVertexKind) {
  return vertices.filter((vertex) => vertex.kind === kind).length
}

function countVerticesWithReason(
  vertices: Array<{ reasons: string[] }>,
  reason: string,
) {
  return vertices.filter((vertex) => vertex.reasons.includes(reason)).length
}

function createEmptyTriangleKindCounts(): TriangleKindCounts {
  return TRIANGLE_KINDS.reduce((counts, kind) => {
    counts[kind] = 0
    return counts
  }, {} as TriangleKindCounts)
}

function createEmptyTriangleWarningCounts(): TriangleWarningCounts {
  return TRIANGLE_WARNINGS.reduce((counts, warning) => {
    counts[warning] = 0
    return counts
  }, {} as TriangleWarningCounts)
}

function createMetricRange(values: number[]): TriangleMetricRange {
  const validValues = values.filter(Number.isFinite)
  return {
    min: validValues.length > 0 ? Math.min(...validValues) : null,
    median: medianNumber(validValues),
    max: validValues.length > 0 ? Math.max(...validValues) : null,
  }
}

function createMinMaxRange(values: number[]): MetricMinMaxRange {
  const validValues = values.filter(Number.isFinite)
  return {
    min: validValues.length > 0 ? Math.min(...validValues) : null,
    max: validValues.length > 0 ? Math.max(...validValues) : null,
  }
}

function averageNumbers(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function medianNumber(values: number[]) {
  if (values.length === 0) {
    return null
  }

  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }

  return sorted[middle]
}

function getMissingBlendshapeKeys(blendshapes: ReferenceBlendshape[]) {
  const scores = getBlendshapeScoreMap(blendshapes)
  return MATCH_BLENDSHAPE_KEYS.filter((key) => !scores.has(key))
}

function handleExportLog() {
  addLog("現在の state summary を console に出力しました。")
  console.info("Ideal Reference Mesh Warp Lab state", getRawState())
  renderAll()
}

async function analyzeCurrentLiveFrame(reason: "manual" | "timeupdate" | "seeked" | "pause" | "ended") {
  if (!state.liveVideo.loaded || liveAnalysisInProgress) {
    return
  }

  const requestId = liveAnalysisRequestId + 1
  liveAnalysisRequestId = requestId
  liveAnalysisInProgress = true
  renderAll()

  try {
    const detector = await getLiveFaceLandmarker()
    if (requestId !== liveAnalysisRequestId) {
      return
    }

    const timeSec = liveVideoElement.currentTime || state.liveVideo.currentTimeSec
    const result = detector.detectForVideo(liveVideoElement, nextLiveTimestampMs())
    state.currentLiveFrameAnalysis = buildCurrentLiveFrameAnalysis(result, timeSec)
    lastAutoLiveAnalysisAtSec = timeSec
    updateTop1Match()

    if (reason === "manual") {
      addLog(
        state.currentLiveFrameAnalysis.error
          ? `ライブ動画 current frame 解析で ${state.currentLiveFrameAnalysis.error} を検出しました。`
          : "ライブ動画 current frame を解析しました。",
      )
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    state.currentLiveFrameAnalysis = {
      ...createEmptyCurrentLiveFrameAnalysis(),
      analyzed: true,
      timeSec: state.liveVideo.currentTimeSec,
      error: `MediaPipe error: ${message}`,
    }
    state.liveMediaPipe.status = "error"
    state.liveMediaPipe.error = message
    disposeLiveFaceLandmarker("error")
    state.top1Match = {
      ...createEmptyTop1Match(),
      error: `current analysis failed / matching skipped: ${state.currentLiveFrameAnalysis.error}`,
    }
    updateCurrentIdealMeshPrototype()
    addLog(`ライブ動画 current frame 解析でエラーが発生しました: ${message}`)
  } finally {
    liveAnalysisInProgress = false
    renderAll()
  }
}

function maybeAnalyzeLiveFrame(reason: "timeupdate") {
  if (
    !state.liveVideo.loaded ||
    state.liveVideo.playbackStatus !== "playing" ||
    liveAnalysisInProgress
  ) {
    return
  }

  const currentTimeSec = liveVideoElement.currentTime || state.liveVideo.currentTimeSec
  if (currentTimeSec - lastAutoLiveAnalysisAtSec < LIVE_AUTO_ANALYSIS_INTERVAL_SEC) {
    return
  }

  void analyzeCurrentLiveFrame(reason)
}

function handleToggleLandmarks478(checked: boolean) {
  state.overlay.showLandmarks478 = checked
  addLog(`478点 overlay 表示を ${checked ? "ON" : "OFF"} にしました。`)
  drawAllOverlays()
  renderAll()
}

function handleToggleWebglMeshWarpPreview(checked: boolean) {
  state.applyWebglMeshWarp = checked
  if (!checked) {
    state.webglPreview = {
      ...createEmptyWebglPreviewRuntimeDebug(),
      webglPreviewStatus: "disabled",
    }
    stopWebglPreviewLoop()
  } else {
    state.webglPreview = {
      ...state.webglPreview,
      webglPreviewEnabled: true,
      webglPreviewStatus: "ready",
      webglPreviewError: null,
      fallbackReason: null,
    }
    updateWebglMeshWarpPreview()
    ensureWebglPreviewLoop()
  }
  addLog(`WebGL mesh warp preview を ${checked ? "ON" : "OFF"} にしました。`)
  renderAll()
}

function bindOverlayToggle(
  action: string,
  key: Exclude<keyof LabState["overlay"], "showLandmarks478">,
) {
  getElement<HTMLInputElement>(`[data-action="${action}"]`).addEventListener(
    "change",
    (event) => {
      state.overlay[key] = event.currentTarget.checked
      drawAllOverlays()
      renderAll()
    },
  )
}

function handleModelRangeInput(value: number) {
  if (hasAcceptedFrames()) {
    const acceptedFrames = getAcceptedFrames()
    state.currentAcceptedReviewIndex = clamp(Math.round(value), 0, acceptedFrames.length - 1)
    void seekToCurrentAcceptedFrame()
    renderAll()
    return
  }

  seekVideoTo("model", value)
}

function moveModelReview(delta: number) {
  if (hasAcceptedFrames()) {
    const acceptedFrames = getAcceptedFrames()
    state.currentAcceptedReviewIndex = clamp(
      (state.currentAcceptedReviewIndex ?? 0) + delta,
      0,
      acceptedFrames.length - 1,
    )
    void seekToCurrentAcceptedFrame()
    renderAll()
    return
  }

  seekVideoTo("model", modelVideoElement.currentTime + delta * FRAME_STEP_SEC)
}

async function seekToCurrentAcceptedFrame() {
  const frame = getCurrentAcceptedFrame()
  if (!frame) {
    clearModelOverlay()
    return
  }

  state.modelVideo.currentTimeSec = frame.timeSec
  state.modelVideo.currentReviewFrameIndex = frame.frameIndex
  await seekVideoElement(modelVideoElement, frame.timeSec)
  drawModelOverlay()
}

function seekVideoTo(kind: PreviewTab, targetSec: number) {
  const videoElement = kind === "model" ? modelVideoElement : liveVideoElement
  const videoState = kind === "model" ? state.modelVideo : state.liveVideo

  if (!videoState.loaded || !Number.isFinite(targetSec)) {
    return
  }

  const duration = videoState.durationSec ?? videoElement.duration
  const nextTime = clamp(targetSec, 0, Number.isFinite(duration) ? duration : targetSec)
  videoElement.currentTime = nextTime
  videoState.currentTimeSec = nextTime

  if (kind === "model") {
    state.modelVideo.currentReviewFrameIndex = getFrameIndex(nextTime)
    drawModelOverlay()
  }

  renderAll()
}

function syncMetadata(kind: PreviewTab) {
  const videoElement = kind === "model" ? modelVideoElement : liveVideoElement
  const videoState = kind === "model" ? state.modelVideo : state.liveVideo

  videoState.durationSec = Number.isFinite(videoElement.duration)
    ? videoElement.duration
    : null
  videoState.width = videoElement.videoWidth || null
  videoState.height = videoElement.videoHeight || null
  videoState.currentTimeSec = videoElement.currentTime || 0

  if (kind === "model") {
    state.modelVideo.currentReviewFrameIndex = getFrameIndex(videoState.currentTimeSec)
  }
}

function syncCurrentTime(kind: PreviewTab) {
  const videoElement = kind === "model" ? modelVideoElement : liveVideoElement
  const videoState = kind === "model" ? state.modelVideo : state.liveVideo

  videoState.currentTimeSec = videoElement.currentTime || 0

  if (kind === "model" && !hasAcceptedFrames()) {
    state.modelVideo.currentReviewFrameIndex = getFrameIndex(videoState.currentTimeSec)
  }
}

function resetModelScanResults() {
  disposeModelFaceLandmarker("uninitialized")
  resetModelTimestamp()
  state.rawIdealReferenceFrames = []
  state.currentAcceptedReviewIndex = null
  state.top1Match = createEmptyTop1Match()
  state.currentIdealMeshPrototype = createEmptyCurrentIdealMeshPrototype()
  state.modelScan.scanStatus = "idle"
  state.modelScan.scanProgress = 0
  state.modelScan.plannedScanFrames = 0
  state.modelScan.totalScannedFrames = 0
  state.modelScan.acceptedFrames = 0
  state.modelScan.excludedFrames = 0
  state.modelScan.excludedReasonCounts = {}
  state.modelScan.lastError = null
  clearModelOverlay()
}

function resetLiveAnalysisResults() {
  disposeLiveFaceLandmarker("uninitialized")
  resetLiveTimestamp()
  state.currentLiveFrameAnalysis = createEmptyCurrentLiveFrameAnalysis()
  state.top1Match = createEmptyTop1Match()
  state.currentIdealMeshPrototype = createEmptyCurrentIdealMeshPrototype()
  liveAnalysisRequestId += 1
  liveAnalysisInProgress = false
  lastAutoLiveAnalysisAtSec = Number.NEGATIVE_INFINITY
  clearLiveOverlay()
}

function disposeModelFaceLandmarker(nextStatus: MediaPipeStatus = "disposed") {
  modelFaceLandmarker?.close()
  modelFaceLandmarker = null
  modelFaceLandmarkerPromise = null
  state.modelScan.mediaPipeStatus = nextStatus
}

function disposeLiveFaceLandmarker(nextStatus: MediaPipeStatus = "disposed") {
  liveFaceLandmarker?.close()
  liveFaceLandmarker = null
  liveFaceLandmarkerPromise = null
  state.liveMediaPipe.status = nextStatus
}

function resetModelTimestamp() {
  state.modelScan.modelTimestampMs = 0
}

function resetLiveTimestamp() {
  state.liveMediaPipe.liveTimestampMs = 0
}

function nextModelTimestampMs() {
  state.modelScan.modelTimestampMs += MEDIAPIPE_TIMESTAMP_STEP_MS
  return state.modelScan.modelTimestampMs
}

function nextLiveTimestampMs() {
  state.liveMediaPipe.liveTimestampMs += MEDIAPIPE_TIMESTAMP_STEP_MS
  return state.liveMediaPipe.liveTimestampMs
}

function createEmptyCurrentLiveFrameAnalysis(): CurrentLiveFrameAnalysis {
  return {
    analyzed: false,
    timeSec: null,
    landmarks478: [],
    pose: {
      yaw: null,
      pitch: null,
      roll: null,
    },
    blendshapes: [],
    expressionGroup: "unknown",
    qualityScore: 0,
    error: null,
  }
}

function createEmptyTop1Match(): ReferenceMatchResult {
  return {
    matched: false,
    idealFrameId: null,
    idealFrameIndex: null,
    idealTimeSec: null,
    matchScore: null,
    poseDistance: null,
    expressionDistance: null,
    qualityPenalty: null,
    currentExpressionGroup: null,
    idealExpressionGroup: null,
    error: null,
  }
}

function createEmptyMeshPrototypeSummary(videoAspectRatio = 1): MeshPrototypeSummary {
  const dynamicGrid = createEmptyDynamicGridDebug(videoAspectRatio)
  const triangleMesh = createEmptyTriangleMeshDebug()
  const webglMeshWarpInput = createEmptyWebglMeshWarpInputDebug()
  return {
    gridMode: dynamicGrid.mode,
    nearFaceGridMode: dynamicGrid.nearFaceGridMode,
    triangleMode: triangleMesh.mode,
    top1MatchedReferenceId: null,
    currentLandmarkCount: 0,
    candidateAlignedIdealLandmarkCount: 0,
    acceptedFaceLandmarkCount: dynamicGrid.acceptedFaceLandmarkCount,
    faceMedianNearestDistance: dynamicGrid.faceMedianNearestDistance,
    faceNearestDistanceSampleCount: dynamicGrid.faceNearestDistanceSampleCount,
    nearFaceGridSpacing: dynamicGrid.nearFaceGridSpacing,
    backgroundGridSpacing: dynamicGrid.backgroundGridSpacing,
    screenEdgeAnchorSpacing: dynamicGrid.screenEdgeAnchorSpacing,
    nearFaceGridSpacingRatioToFaceMedian:
      dynamicGrid.nearFaceGridSpacingRatioToFaceMedian,
    backgroundGridSpacingRatioToFaceMedian:
      dynamicGrid.backgroundGridSpacingRatioToFaceMedian,
    faceOnlyTriangleCount: dynamicGrid.faceOnlyTriangleCount,
    faceInteriorTestTriangleCount: dynamicGrid.faceInteriorTestTriangleCount,
    nearFaceCandidateGridCount: dynamicGrid.nearFaceCandidateGridCount,
    nearFaceRemovedInsideFaceCount: dynamicGrid.nearFaceRemovedInsideFaceCount,
    nearFaceRemovedTooCloseToFaceCount: dynamicGrid.nearFaceRemovedTooCloseToFaceCount,
    nearFaceAcceptedGridCount: dynamicGrid.nearFaceAcceptedGridCount,
    tooCloseToFaceThreshold: dynamicGrid.tooCloseToFaceThreshold,
    faceBounds: dynamicGrid.faceBounds,
    expandedNearFaceBounds: dynamicGrid.expandedNearFaceBounds,
    videoAspectRatio: dynamicGrid.videoAspectRatio,
    visibleCurrentLandmarkCount: 0,
    excludedCurrentLandmarkCount: 0,
    faceSourceVertexCount: 0,
    nearFaceGridCount: 0,
    backgroundGridCount: 0,
    screenEdgeAnchorCount: 0,
    meshPairCount: 0,
    vertexCount: triangleMesh.vertexCount,
    triangleCount: triangleMesh.triangleCount,
    validTriangleCount: triangleMesh.validTriangleCount,
    warningTriangleCount: triangleMesh.warningTriangleCount,
    excludedTriangleCount: triangleMesh.excludedTriangleCount,
    triangleKindCounts: triangleMesh.triangleKindCounts,
    triangleQuality: triangleMesh.triangleQuality,
    triangleArea: triangleMesh.triangleArea,
    triangleAspectRatio: triangleMesh.triangleAspectRatio,
    webglInputReady: webglMeshWarpInput.webglInputReady,
    webglInputWarningCount: webglMeshWarpInput.warningCount,
    webglInputWarnings: webglMeshWarpInput.warnings,
    usageWeightAverage: null,
    usageWeightMin: null,
    usageWeightMax: null,
    boundarySuppressedCount: 0,
    mouthSuppressedCount: 0,
    eyeSuppressedCount: 0,
    largeDisplacementSuppressedCount: 0,
    invalidExcludedCount: 0,
  }
}

function createEmptyDynamicGridDebug(videoAspectRatio = 1): DynamicGridDebug {
  const faceInterior: FaceInteriorDebug = {
    faceOnlyTriangleCount: 0,
    faceInteriorTestTriangleCount: 0,
    preview: [],
  }
  const nearFaceGrid: NearFaceGridDebug = {
    mode: "filledRegionMinusFaceInterior",
    candidateGridCount: 0,
    removedInsideFaceCount: 0,
    removedTooCloseToFaceCount: 0,
    acceptedGridCount: 0,
    tooCloseToFaceThreshold: null,
    gridPointPreview: [],
  }

  return {
    mode: "dynamic",
    nearFaceGridMode: "filledRegionMinusFaceInterior",
    acceptedFaceLandmarkCount: 0,
    faceMedianNearestDistance: null,
    faceNearestDistanceSampleCount: 0,
    nearFaceGridSpacing: null,
    backgroundGridSpacing: null,
    screenEdgeAnchorSpacing: null,
    nearFaceGridSpacingRatioToFaceMedian: null,
    backgroundGridSpacingRatioToFaceMedian: null,
    faceOnlyTriangleCount: 0,
    faceInteriorTestTriangleCount: 0,
    nearFaceCandidateGridCount: 0,
    nearFaceRemovedInsideFaceCount: 0,
    nearFaceRemovedTooCloseToFaceCount: 0,
    nearFaceAcceptedGridCount: 0,
    tooCloseToFaceThreshold: null,
    nearFaceGridCount: 0,
    backgroundGridCount: 0,
    screenEdgeAnchorCount: 0,
    faceBounds: null,
    expandedNearFaceBounds: null,
    videoAspectRatio,
    nearFaceGrid,
    faceInterior,
    gridPointPreview: [],
  }
}

function createEmptyTriangleMeshDebug(): TriangleMeshDebug {
  return {
    mode: "prototype",
    vertexCount: 0,
    triangleCount: 0,
    validTriangleCount: 0,
    warningTriangleCount: 0,
    excludedTriangleCount: 0,
    triangleKindCounts: createEmptyTriangleKindCounts(),
    triangleQuality: createEmptyTriangleWarningCounts(),
    triangleArea: createMetricRange([]),
    triangleAspectRatio: createMetricRange([]),
    triangles: [],
    trianglePreview: [],
  }
}

function createEmptyWebglMeshWarpInputDebug(): WebglMeshWarpInputDebug {
  const emptyRange = createMinMaxRange([])
  return {
    mode: "debugOnly",
    webglInputReady: false,
    vertexCount: 0,
    sourceVertexCount: 0,
    targetVertexCount: 0,
    triangleCount: 0,
    indexCount: 0,
    sourceUvConvention: "imageNormalizedNoFlip",
    targetPositionConvention: "clipSpaceFromImageNormalized",
    sourceUvSummary: {
      uRange: emptyRange,
      vRange: emptyRange,
      outOfRangeUvCount: 0,
      sourceUvInRange: true,
    },
    targetPositionSummary: {
      imageXRange: emptyRange,
      imageYRange: emptyRange,
      clipXRange: emptyRange,
      clipYRange: emptyRange,
      outOfRangeTargetCount: 0,
      outOfRangeClipCount: 0,
      targetImagePositionInRange: true,
      targetClipPositionInRange: true,
    },
    indexSummary: {
      maxIndex: null,
      indexWithinVertexRange: true,
      invalidIndexCount: 0,
    },
    coordinateSummary: {
      sourceTargetVertexCountMatch: true,
      sourceUvInRange: true,
      targetImagePositionInRange: true,
      targetClipPositionInRange: true,
      triangleCountPositive: false,
    },
    preview: [],
    indexPreview: [],
    warnings: ["emptyTriangleIndices"],
    warningCount: 1,
  }
}

function createEmptyWebglPreviewRuntimeDebug(): WebglPreviewRuntimeDebug {
  return {
    webglPreviewEnabled: false,
    webglPreviewStatus: "disabled",
    webglPreviewError: null,
    webglCanvasSize: {
      width: 0,
      height: 0,
    },
    videoTextureReady: false,
    lastDrawTimestampMs: null,
    drawCallCount: 0,
    lastDrawTriangleCount: 0,
    lastDrawIndexCount: 0,
    textureVMode: WEBGL_PREVIEW_TEXTURE_V_MODE,
    fallbackReason: null,
  }
}

function createEmptyMeshAspectDebug(
  modelVideoAspectRatio = 1,
  liveVideoAspectRatio = 1,
): MeshAspectDebug {
  const emptyBounds = createBoundsDebug([], liveVideoAspectRatio)
  return {
    videoAspectRatio: liveVideoAspectRatio,
    modelVideoAspectRatio,
    liveVideoAspectRatio,
    alignment: null,
    bounds: {
      currentLandmarks: emptyBounds,
      top1RawIdealReferenceLandmarks: createBoundsDebug([], modelVideoAspectRatio),
      candidateAlignedIdealLandmarks: emptyBounds,
      acceptedCurrentMeshSourceFaceLandmarks: emptyBounds,
      idealMeshTargetFaceLandmarks: emptyBounds,
    },
  }
}

function createEmptyCurrentIdealMeshPrototype(
  modelVideoAspectRatio = 1,
  liveVideoAspectRatio = 1,
): CurrentIdealMeshPrototypeState {
  return {
    candidateAlignedIdealLandmarks: [],
    acceptedCurrentLandmarks: [],
    excludedCurrentLandmarks: [],
    currentMeshSourceVertices: [],
    idealMeshTargetVertices: [],
    currentIdealMeshPairs: [],
    triangleMesh: createEmptyTriangleMeshDebug(),
    webglMeshWarpInput: createEmptyWebglMeshWarpInputDebug(),
    aspectDebug: createEmptyMeshAspectDebug(modelVideoAspectRatio, liveVideoAspectRatio),
    dynamicGrid: createEmptyDynamicGridDebug(liveVideoAspectRatio),
    summary: createEmptyMeshPrototypeSummary(liveVideoAspectRatio),
  }
}

function updateScanCounters() {
  const acceptedFrames = getAcceptedFrames()
  const excludedFrames = state.rawIdealReferenceFrames.filter((frame) => frame.excluded)
  state.modelScan.totalScannedFrames = state.rawIdealReferenceFrames.length
  state.modelScan.acceptedFrames = acceptedFrames.length
  state.modelScan.excludedFrames = excludedFrames.length
  state.modelScan.excludedReasonCounts = countBy(
    excludedFrames.map((frame) => frame.excludedReason ?? "unknown"),
  )
}

function addLog(message: string) {
  const timestamp = new Date().toLocaleTimeString("ja-JP", {
    hour12: false,
  })
  state.logs = [`${timestamp} ${message}`, ...state.logs].slice(0, 20)
}

function renderAll() {
  renderPreviewTabs()
  renderPreviewPanels()
  renderControls()
  renderDebugTabs()
  updateWebglMeshWarpPreview()
  drawAllOverlays()
  renderDebugContent()
}

function renderPreviewTabs() {
  app.querySelectorAll<HTMLButtonElement>("[data-tab-group='preview']").forEach((button) => {
    const isActive = button.dataset.tabValue === state.activePreviewTab
    button.classList.toggle("is-active", isActive)
    button.setAttribute("aria-selected", String(isActive))
  })
}

function renderPreviewPanels() {
  app.querySelectorAll<HTMLElement>("[data-preview-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.previewPanel !== state.activePreviewTab
  })

  const modelStage = getElement<HTMLElement>("[data-preview-panel='model'] .preview-stage")
  const liveStage = getElement<HTMLElement>("[data-preview-panel='live'] .preview-stage")

  modelStage.dataset.loaded = String(state.modelVideo.loaded)
  liveStage.dataset.loaded = String(state.liveVideo.loaded)
  updateWebglPreviewStageVisibility()
}

function renderControls() {
  const modelLoaded = state.modelVideo.loaded
  const liveLoaded = state.liveVideo.loaded
  const scanBusy =
    state.modelScan.scanStatus === "initializing" || state.modelScan.scanStatus === "running"

  setDisabled('[data-action="analyze"]', !modelLoaded || scanBusy)
  setDisabled('[data-action="model-prev"]', !modelLoaded || scanBusy || !canMoveModel(-1))
  setDisabled('[data-action="model-next"]', !modelLoaded || scanBusy || !canMoveModel(1))
  setDisabled('[data-range="model"]', !modelLoaded || scanBusy)
  setDisabled('[data-action="live-play"]', !liveLoaded || state.liveVideo.playbackStatus === "playing")
  setDisabled('[data-action="live-pause"]', !liveLoaded || state.liveVideo.playbackStatus !== "playing")
  setDisabled('[data-action="live-analyze-current"]', !liveLoaded || liveAnalysisInProgress)
  setDisabled('[data-action="toggle-webgl-mesh-warp"]', !liveLoaded)
  setDisabled('[data-range="live"]', !liveLoaded)

  updateModelRange()
  updateRange("live")
  setText("[data-status='model-time']", formatModelTimeStatus())
  setText("[data-status='live-time']", formatTimeStatus(state.liveVideo))
  setText("[data-model-range-label]", hasAcceptedFrames() ? "accepted frame" : "シーク")
  setText(
    "[data-model-control-help]",
    hasAcceptedFrames()
      ? "解析後は accepted frame の index でレビューします。除外フレームは表示しません。"
      : "戻る / 進むは 1/30 秒ずつ移動します。",
  )
  getElement<HTMLInputElement>('[data-action="toggle-landmarks"]').checked =
    state.overlay.showLandmarks478
  getElement<HTMLInputElement>('[data-action="toggle-mesh-source"]').checked =
    state.overlay.showMeshSource
  getElement<HTMLInputElement>('[data-action="toggle-mesh-target"]').checked =
    state.overlay.showMeshTarget
  getElement<HTMLInputElement>('[data-action="toggle-mesh-pairs"]').checked =
    state.overlay.showMeshPairs
  getElement<HTMLInputElement>('[data-action="toggle-excluded-landmarks"]').checked =
    state.overlay.showExcludedLandmarks
  getElement<HTMLInputElement>('[data-action="toggle-grid-anchors"]').checked =
    state.overlay.showGridAnchors
  getElement<HTMLInputElement>('[data-action="toggle-triangle-mesh"]').checked =
    state.overlay.showTriangleMesh
  getElement<HTMLInputElement>('[data-action="toggle-webgl-mesh-warp"]').checked =
    state.applyWebglMeshWarp
  renderModelReviewCard()
  renderLiveAnalysisCard()
}

function renderModelReviewCard() {
  const reviewCard = getElement<HTMLElement>("[data-model-review]")
  const frame = getCurrentAcceptedFrame()

  if (!hasAcceptedFrames()) {
    if (state.modelScan.scanStatus === "done" && state.modelScan.acceptedFrames === 0) {
      reviewCard.innerHTML = `<p>accepted frame がありません。noFace / invalidLandmarks の内訳を Model Scan で確認してください。</p>`
      return
    }
    reviewCard.innerHTML = `<p>解析後は accepted frame review に切り替わります。</p>`
    return
  }

  if (!frame) {
    reviewCard.innerHTML = `<p>accepted frame を選択できません。</p>`
    return
  }

  reviewCard.innerHTML = `
    <dl class="review-grid">
      <div><dt>frameId</dt><dd>${escapeHtml(frame.frameId)}</dd></div>
      <div><dt>timeSec</dt><dd>${formatSeconds(frame.timeSec)} sec</dd></div>
      <div><dt>pose</dt><dd>${escapeHtml(formatPose(frame.pose))}</dd></div>
      <div><dt>expressionGroup</dt><dd>${frame.expressionGroup}</dd></div>
      <div><dt>qualityScore</dt><dd>${formatSeconds(frame.qualityScore)}</dd></div>
    </dl>
  `
}

function renderLiveAnalysisCard() {
  const card = getElement<HTMLElement>("[data-live-analysis]")
  const analysis = state.currentLiveFrameAnalysis
  const match = state.top1Match

  if (!analysis.analyzed) {
    card.innerHTML = `<p>ライブ動画の current frame 解析結果はまだありません。</p>`
    return
  }

  card.innerHTML = `
    <dl class="review-grid">
      <div><dt>timeSec</dt><dd>${formatSeconds(analysis.timeSec)} sec</dd></div>
      <div><dt>landmarks</dt><dd>${analysis.landmarks478.length}</dd></div>
      <div><dt>pose</dt><dd>${escapeHtml(formatPose(analysis.pose))}</dd></div>
      <div><dt>expressionGroup</dt><dd>${analysis.expressionGroup}</dd></div>
      <div><dt>qualityScore</dt><dd>${formatSeconds(analysis.qualityScore)}</dd></div>
      <div><dt>error</dt><dd>${escapeHtml(analysis.error ?? "-")}</dd></div>
      <div><dt>top1</dt><dd>${escapeHtml(match.idealFrameId ?? "-")}</dd></div>
      <div><dt>matchScore</dt><dd>${formatSeconds(match.matchScore)}</dd></div>
    </dl>
  `
}

function updateWebglMeshWarpPreview() {
  if (!state.applyWebglMeshWarp) {
    state.webglPreview = {
      ...state.webglPreview,
      webglPreviewEnabled: false,
      webglPreviewStatus: "disabled",
      webglPreviewError: null,
      videoTextureReady: false,
      fallbackReason: null,
      textureVMode: WEBGL_PREVIEW_TEXTURE_V_MODE,
    }
    updateWebglPreviewStageVisibility()
    return
  }

  state.webglPreview.webglPreviewEnabled = true
  state.webglPreview.textureVMode = WEBGL_PREVIEW_TEXTURE_V_MODE

  const mesh = state.currentIdealMeshPrototype
  const fallbackReason = getWebglMeshWarpPreviewFallbackReason(mesh)
  if (fallbackReason) {
    setWebglPreviewFallback(fallbackReason)
    return
  }

  if (state.activePreviewTab !== "live") {
    state.webglPreview = {
      ...state.webglPreview,
      webglPreviewStatus: "ready",
      webglPreviewError: null,
      fallbackReason: null,
      videoTextureReady: liveVideoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA,
    }
    updateWebglPreviewStageVisibility()
    ensureWebglPreviewLoop()
    return
  }

  try {
    if (!webglMeshWarpPreviewRenderer) {
      webglMeshWarpPreviewRenderer =
        createWebglMeshWarpPreviewRenderer(liveWebglCanvas)
    }

    const result = webglMeshWarpPreviewRenderer.draw({
      videoElement: liveVideoElement,
      videoState: state.liveVideo,
      sourceVertices: mesh.currentMeshSourceVertices,
      targetVertices: mesh.idealMeshTargetVertices,
      triangles: mesh.triangleMesh.triangles,
    })

    state.webglPreview = {
      ...state.webglPreview,
      webglPreviewStatus: "drawing",
      webglPreviewError: null,
      webglCanvasSize: {
        width: result.canvasWidth,
        height: result.canvasHeight,
      },
      videoTextureReady: result.videoTextureReady,
      lastDrawTimestampMs: performance.now(),
      drawCallCount: state.webglPreview.drawCallCount + 1,
      lastDrawTriangleCount: result.triangleCount,
      lastDrawIndexCount: result.indexCount,
      fallbackReason: null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    disposeWebglMeshWarpPreviewRenderer()
    state.webglPreview = {
      ...state.webglPreview,
      webglPreviewStatus: "error",
      webglPreviewError: message,
      videoTextureReady: false,
      fallbackReason: "webglPreviewError",
    }
  }

  updateWebglPreviewStageVisibility()
  ensureWebglPreviewLoop()
}

function getWebglMeshWarpPreviewFallbackReason(
  mesh: CurrentIdealMeshPrototypeState,
) {
  if (!state.liveVideo.loaded) {
    return "liveVideoNotLoaded"
  }

  if (
    liveVideoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
    !liveVideoElement.videoWidth ||
    !liveVideoElement.videoHeight
  ) {
    return "videoTextureNotReady"
  }

  if (!mesh.webglMeshWarpInput.webglInputReady) {
    return "webglInputReadyFalse"
  }

  if (mesh.currentMeshSourceVertices.length !== mesh.idealMeshTargetVertices.length) {
    return "sourceTargetVertexCountMismatch"
  }

  if (mesh.currentMeshSourceVertices.length > 65535) {
    return "vertexCountExceedsUint16IndexLimit"
  }

  if (mesh.triangleMesh.triangles.length === 0) {
    return "emptyTriangleIndices"
  }

  return null
}

function setWebglPreviewFallback(fallbackReason: string) {
  state.webglPreview = {
    ...state.webglPreview,
    webglPreviewStatus: "fallback",
    webglPreviewError: null,
    videoTextureReady:
      state.liveVideo.loaded &&
      liveVideoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA,
    fallbackReason,
  }
  updateWebglPreviewStageVisibility()
}

function updateWebglPreviewStageVisibility() {
  const liveStage = app.querySelector<HTMLElement>(
    "[data-preview-panel='live'] .preview-stage",
  )
  if (!liveStage) {
    return
  }

  const showWebglCanvas =
    state.applyWebglMeshWarp &&
    state.liveVideo.loaded &&
    (state.webglPreview.webglPreviewStatus === "ready" ||
      state.webglPreview.webglPreviewStatus === "drawing")

  liveStage.dataset.webglWarp = String(showWebglCanvas)
}

function ensureWebglPreviewLoop() {
  const status = state.webglPreview.webglPreviewStatus
  if (
    webglPreviewAnimationFrameId !== null ||
    !state.applyWebglMeshWarp ||
    state.activePreviewTab !== "live" ||
    (status !== "ready" && status !== "drawing") ||
    state.liveVideo.playbackStatus !== "playing"
  ) {
    return
  }

  webglPreviewAnimationFrameId = window.requestAnimationFrame(() => {
    webglPreviewAnimationFrameId = null
    updateWebglMeshWarpPreview()
    maybeRenderWebglPreviewDebug()
    ensureWebglPreviewLoop()
  })
}

function stopWebglPreviewLoop() {
  if (webglPreviewAnimationFrameId === null) {
    return
  }

  window.cancelAnimationFrame(webglPreviewAnimationFrameId)
  webglPreviewAnimationFrameId = null
}

function maybeRenderWebglPreviewDebug() {
  if (
    state.activeDebugTab !== "summary" &&
    state.activeDebugTab !== "warpMesh" &&
    state.activeDebugTab !== "raw"
  ) {
    return
  }

  const now = performance.now()
  if (now - lastWebglDebugRenderAtMs < 250) {
    return
  }

  lastWebglDebugRenderAtMs = now
  renderDebugContent()
}

function createWebglMeshWarpPreviewRenderer(
  canvas: HTMLCanvasElement,
): WebglMeshWarpPreviewRenderer {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    premultipliedAlpha: false,
  })

  if (!gl) {
    throw new Error("WebGL context を作成できませんでした。")
  }

  const vertexShader = compileWebglShader(
    gl,
    gl.VERTEX_SHADER,
    `
      attribute vec2 a_position;
      attribute vec2 a_uv;
      varying vec2 v_uv;

      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_uv = a_uv;
      }
    `,
  )
  const fragmentShader = compileWebglShader(
    gl,
    gl.FRAGMENT_SHADER,
    `
      precision mediump float;
      uniform sampler2D u_texture;
      varying vec2 v_uv;

      void main() {
        gl_FragColor = texture2D(u_texture, v_uv);
      }
    `,
  )
  const program = linkWebglProgram(gl, vertexShader, fragmentShader)
  const positionBuffer = gl.createBuffer()
  const uvBuffer = gl.createBuffer()
  const indexBuffer = gl.createBuffer()
  const texture = gl.createTexture()
  const positionLocation = gl.getAttribLocation(program, "a_position")
  const uvLocation = gl.getAttribLocation(program, "a_uv")
  const textureLocation = gl.getUniformLocation(program, "u_texture")

  if (
    !positionBuffer ||
    !uvBuffer ||
    !indexBuffer ||
    !texture ||
    positionLocation < 0 ||
    uvLocation < 0 ||
    textureLocation === null
  ) {
    throw new Error("WebGL mesh warp preview の buffer / attribute 初期化に失敗しました。")
  }

  gl.useProgram(program)
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.uniform1i(textureLocation, 0)

  return {
    draw(input) {
      const vertexCount = input.sourceVertices.length
      if (vertexCount !== input.targetVertices.length) {
        throw new Error("source vertices と target vertices の件数が一致しません。")
      }
      if (vertexCount > 65535) {
        throw new Error("WebGL1 Uint16 index の上限を超えています。")
      }

      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const canvasWidth = Math.max(1, Math.round(rect.width * dpr))
      const canvasHeight = Math.max(1, Math.round(rect.height * dpr))
      if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
        canvas.width = canvasWidth
        canvas.height = canvasHeight
      }
      const displayedContentRect = getDisplayedContentRect(
        input.videoState,
        input.videoElement,
        rect.width,
        rect.height,
      )

      const positions = new Float32Array(vertexCount * 2)
      const uvs = new Float32Array(vertexCount * 2)
      for (let index = 0; index < vertexCount; index += 1) {
        const source = input.sourceVertices[index]
        const target = input.targetVertices[index]
        const clip = imageNormalizedToDisplayedClipSpace(
          target,
          displayedContentRect,
          rect.width,
          rect.height,
        )
        positions[index * 2] = clip.x
        positions[index * 2 + 1] = clip.y
        uvs[index * 2] = source.x
        uvs[index * 2 + 1] = source.y
      }

      const indices = new Uint16Array(
        input.triangles.flatMap((triangle) => triangle.indices),
      )

      gl.viewport(0, 0, canvasWidth, canvasHeight)
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(program)

      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        input.videoElement,
      )

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW)
      gl.enableVertexAttribArray(positionLocation)
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.DYNAMIC_DRAW)
      gl.enableVertexAttribArray(uvLocation)
      gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0)

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.DYNAMIC_DRAW)
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0)

      return {
        canvasWidth,
        canvasHeight,
        videoTextureReady: true,
        triangleCount: input.triangles.length,
        indexCount: indices.length,
      }
    },
    dispose() {
      gl.deleteTexture(texture)
      gl.deleteBuffer(positionBuffer)
      gl.deleteBuffer(uvBuffer)
      gl.deleteBuffer(indexBuffer)
      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
    },
  }
}

function compileWebglShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type)
  if (!shader) {
    throw new Error("WebGL shader を作成できませんでした。")
  }

  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) ?? "unknown shader compile error"
    gl.deleteShader(shader)
    throw new Error(info)
  }

  return shader
}

function linkWebglProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
) {
  const program = gl.createProgram()
  if (!program) {
    throw new Error("WebGL program を作成できませんでした。")
  }

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) ?? "unknown program link error"
    gl.deleteProgram(program)
    throw new Error(info)
  }

  return program
}

function disposeWebglMeshWarpPreviewRenderer() {
  webglMeshWarpPreviewRenderer?.dispose()
  webglMeshWarpPreviewRenderer = null
}

function renderDebugTabs() {
  app.querySelectorAll<HTMLButtonElement>("[data-tab-group='debug']").forEach((button) => {
    const isActive = button.dataset.tabValue === state.activeDebugTab
    button.classList.toggle("is-active", isActive)
    button.setAttribute("aria-selected", String(isActive))
  })
}

function renderDebugContent() {
  const content = getElement<HTMLElement>("[data-debug-content]")
  content.innerHTML = ""

  if (state.activeDebugTab === "summary") {
    content.appendChild(createSummaryContent())
    return
  }

  if (state.activeDebugTab === "modelScan") {
    content.appendChild(createModelScanContent())
    return
  }

  if (state.activeDebugTab === "referenceLibrary") {
    content.appendChild(createReferenceLibraryContent())
    return
  }

  if (state.activeDebugTab === "matching") {
    content.appendChild(createMatchingContent())
    return
  }

  if (state.activeDebugTab === "warpMesh") {
    content.appendChild(createMeshPrototypeContent())
    return
  }

  if (state.activeDebugTab === "raw") {
    const pre = document.createElement("pre")
    pre.className = "raw-state"
    pre.textContent = JSON.stringify(getRawState(), null, 2)
    content.appendChild(pre)
    return
  }

  const paragraph = document.createElement("p")
  paragraph.className = "placeholder-text"
  paragraph.textContent = getDebugPlaceholder(state.activeDebugTab)
  content.appendChild(paragraph)
}

function createSummaryContent() {
  const fragment = document.createDocumentFragment()
  const summaryList = document.createElement("dl")
  summaryList.className = "summary-list"
  const currentFrame = getCurrentAcceptedFrame()
  const meshSummary = state.currentIdealMeshPrototype.summary
  const aspectDebug = state.currentIdealMeshPrototype.aspectDebug
  const alignmentDebug = aspectDebug.alignment
  const gridAnchorDisplay = getGridAnchorDisplayState()

  const items: Array<[string, string]> = [
    ["Model MediaPipe", state.modelScan.mediaPipeStatus],
    ["Live MediaPipe", state.liveMediaPipe.status],
    ["modelTimestampMs", formatSeconds(state.modelScan.modelTimestampMs)],
    ["liveTimestampMs", formatSeconds(state.liveMediaPipe.liveTimestampMs)],
    ["Model video", state.modelVideo.loaded ? "loaded" : "not loaded"],
    ["Model file", state.modelVideo.fileName ?? "-"],
    ["Model duration", formatDuration(state.modelVideo.durationSec)],
    ["Model size", formatSize(state.modelVideo.width, state.modelVideo.height)],
    ["Model scan", state.modelScan.scanStatus],
    ["Scan progress", `${state.modelScan.scanProgress} / ${state.modelScan.plannedScanFrames || state.modelScan.maxScanFrames}`],
    ["Raw reference frames", String(state.rawIdealReferenceFrames.length)],
    ["Accepted frames", String(state.modelScan.acceptedFrames)],
    ["Excluded frames", String(state.modelScan.excludedFrames)],
    ["Current accepted review", formatAcceptedReviewPosition()],
    ["Current model frame time", currentFrame ? `${formatSeconds(currentFrame.timeSec)} sec` : "-"],
    ["Current expression group", currentFrame?.expressionGroup ?? "-"],
    ["Live video", state.liveVideo.loaded ? "loaded" : "not loaded"],
    ["Live file", state.liveVideo.fileName ?? "-"],
    ["Live duration", formatDuration(state.liveVideo.durationSec)],
    ["Live size", formatSize(state.liveVideo.width, state.liveVideo.height)],
    ["Live current time", `${formatSeconds(state.liveVideo.currentTimeSec)} sec`],
    ["Live playback", state.liveVideo.playbackStatus],
    ["Live current analysis", formatLiveAnalysisStatus()],
    ["Live current expression", state.currentLiveFrameAnalysis.analyzed ? state.currentLiveFrameAnalysis.expressionGroup : "-"],
    ["Top1 reference", state.top1Match.idealFrameId ?? "none"],
    ["Match score", formatSeconds(state.top1Match.matchScore)],
    ["Pose distance", formatSeconds(state.top1Match.poseDistance)],
    ["Expression distance", formatSeconds(state.top1Match.expressionDistance)],
    ["top1MatchedReferenceId", meshSummary.top1MatchedReferenceId ?? "-"],
    ["gridMode", meshSummary.gridMode],
    ["nearFaceGridMode", meshSummary.nearFaceGridMode],
    ["triangleMode", meshSummary.triangleMode],
    ["currentLandmarkCount", String(meshSummary.currentLandmarkCount)],
    ["visibleCurrentLandmarkCount", String(meshSummary.visibleCurrentLandmarkCount)],
    ["excludedCurrentLandmarkCount", String(meshSummary.excludedCurrentLandmarkCount)],
    ["acceptedFaceLandmarkCount", String(meshSummary.acceptedFaceLandmarkCount)],
    [
      "faceMedianNearestDistance",
      formatMetric(meshSummary.faceMedianNearestDistance),
    ],
    [
      "faceNearestDistanceSampleCount",
      String(meshSummary.faceNearestDistanceSampleCount),
    ],
    ["nearFaceGridSpacing", formatMetric(meshSummary.nearFaceGridSpacing)],
    ["backgroundGridSpacing", formatMetric(meshSummary.backgroundGridSpacing)],
    ["screenEdgeAnchorSpacing", formatMetric(meshSummary.screenEdgeAnchorSpacing)],
    [
      "nearFaceGridSpacingRatioToFaceMedian",
      formatMetric(meshSummary.nearFaceGridSpacingRatioToFaceMedian),
    ],
    [
      "backgroundGridSpacingRatioToFaceMedian",
      formatMetric(meshSummary.backgroundGridSpacingRatioToFaceMedian),
    ],
    ["faceOnlyTriangleCount", String(meshSummary.faceOnlyTriangleCount)],
    [
      "faceInteriorTestTriangleCount",
      String(meshSummary.faceInteriorTestTriangleCount),
    ],
    ["nearFaceCandidateGridCount", String(meshSummary.nearFaceCandidateGridCount)],
    [
      "nearFaceRemovedInsideFaceCount",
      String(meshSummary.nearFaceRemovedInsideFaceCount),
    ],
    [
      "nearFaceRemovedTooCloseToFaceCount",
      String(meshSummary.nearFaceRemovedTooCloseToFaceCount),
    ],
    ["nearFaceAcceptedGridCount", String(meshSummary.nearFaceAcceptedGridCount)],
    ["tooCloseToFaceThreshold", formatMetric(meshSummary.tooCloseToFaceThreshold)],
    ["faceSourceVertexCount", String(meshSummary.faceSourceVertexCount)],
    ["nearFaceGridCount", String(meshSummary.nearFaceGridCount)],
    ["backgroundGridCount", String(meshSummary.backgroundGridCount)],
    ["screenEdgeAnchorCount", String(meshSummary.screenEdgeAnchorCount)],
    ["meshPairCount", String(meshSummary.meshPairCount)],
    ["vertexCount", String(meshSummary.vertexCount)],
    ["triangleCount", String(meshSummary.triangleCount)],
    ["validTriangleCount", String(meshSummary.validTriangleCount)],
    ["warningTriangleCount", String(meshSummary.warningTriangleCount)],
    ["excludedTriangleCount", String(meshSummary.excludedTriangleCount)],
    ["triangleKindCounts", formatCounts(meshSummary.triangleKindCounts)],
    ["triangleQuality", formatCounts(meshSummary.triangleQuality)],
    ["triangleArea min / median / max", formatMetricRange(meshSummary.triangleArea)],
    [
      "triangleAspectRatio min / median / max",
      formatMetricRange(meshSummary.triangleAspectRatio),
    ],
    ["webglInputReady", meshSummary.webglInputReady ? "true" : "false"],
    ["webglInputWarningCount", String(meshSummary.webglInputWarningCount)],
    ["webglInputWarnings", formatWarnings(meshSummary.webglInputWarnings)],
    ["webglPreviewEnabled", String(state.webglPreview.webglPreviewEnabled)],
    ["webglPreviewStatus", state.webglPreview.webglPreviewStatus],
    ["webglPreviewError", state.webglPreview.webglPreviewError ?? "-"],
    ["webglCanvasSize", formatWebglCanvasSize(state.webglPreview.webglCanvasSize)],
    ["videoTextureReady", String(state.webglPreview.videoTextureReady)],
    [
      "lastDrawTimestampMs",
      formatMetric(state.webglPreview.lastDrawTimestampMs),
    ],
    ["drawCallCount", String(state.webglPreview.drawCallCount)],
    ["lastDrawTriangleCount", String(state.webglPreview.lastDrawTriangleCount)],
    ["lastDrawIndexCount", String(state.webglPreview.lastDrawIndexCount)],
    ["textureVMode", state.webglPreview.textureVMode],
    ["fallbackReason", state.webglPreview.fallbackReason ?? "-"],
    [
      "usageWeight average / min / max",
      `${formatMetric(meshSummary.usageWeightAverage)} / ${formatMetric(meshSummary.usageWeightMin)} / ${formatMetric(meshSummary.usageWeightMax)}`,
    ],
    ["boundarySuppressedCount", String(meshSummary.boundarySuppressedCount)],
    ["mouthSuppressedCount", String(meshSummary.mouthSuppressedCount)],
    ["eyeSuppressedCount", String(meshSummary.eyeSuppressedCount)],
    [
      "largeDisplacementSuppressedCount",
      String(meshSummary.largeDisplacementSuppressedCount),
    ],
    ["invalidExcludedCount", String(meshSummary.invalidExcludedCount)],
    ["gridAnchorDisplay", formatGridAnchorDisplay(gridAnchorDisplay)],
    ["videoAspectRatio", formatMetric(aspectDebug.videoAspectRatio)],
    ["dynamicGrid videoAspectRatio", formatMetric(meshSummary.videoAspectRatio)],
    ["faceBounds", formatBoundsSummary(meshSummary.faceBounds)],
    ["expandedNearFaceBounds", formatBoundsSummary(meshSummary.expandedNearFaceBounds)],
    ["modelVideoAspectRatio", formatMetric(aspectDebug.modelVideoAspectRatio)],
    ["liveVideoAspectRatio", formatMetric(aspectDebug.liveVideoAspectRatio)],
    ["alignment scale", formatMetric(alignmentDebug?.scale ?? null)],
    [
      "idealBoundsAspectCorrected",
      formatBoundsSummary(alignmentDebug?.idealBoundsAspectCorrected ?? null),
    ],
    [
      "currentBoundsAspectCorrected",
      formatBoundsSummary(alignmentDebug?.currentBoundsAspectCorrected ?? null),
    ],
    ["Overlay 478 landmarks", state.overlay.showLandmarks478 ? "on" : "off"],
    ["Overlay triangle mesh", state.overlay.showTriangleMesh ? "on" : "off"],
  ]

  appendDefinitionItems(summaryList, items)

  const logSection = document.createElement("section")
  logSection.className = "log-section"
  logSection.setAttribute("aria-label", "ログ")
  const heading = document.createElement("h3")
  heading.textContent = "ログ"
  const list = document.createElement("ul")
  state.logs.forEach((log) => {
    const item = document.createElement("li")
    item.textContent = log
    list.appendChild(item)
  })
  logSection.append(heading, list)
  fragment.append(summaryList, logSection)

  return fragment
}

function createModelScanContent() {
  const list = document.createElement("dl")
  list.className = "summary-list"
  appendDefinitionItems(list, [
    ["scanStatus", state.modelScan.scanStatus],
    ["mediaPipeStatus", state.modelScan.mediaPipeStatus],
    ["mediaPipeError", state.modelScan.mediaPipeError ?? "-"],
    ["modelTimestampMs", formatSeconds(state.modelScan.modelTimestampMs)],
    ["scanProgress", `${state.modelScan.scanProgress} / ${state.modelScan.plannedScanFrames}`],
    ["maxScanFrames", String(state.modelScan.maxScanFrames)],
    ["scanFrameStepSec", String(state.modelScan.scanFrameStepSec)],
    ["totalScannedFrames", String(state.modelScan.totalScannedFrames)],
    ["acceptedFrames", String(state.modelScan.acceptedFrames)],
    ["excludedFrames", String(state.modelScan.excludedFrames)],
    ["excludedReason counts", formatCounts(state.modelScan.excludedReasonCounts)],
    ["durationSec", formatSeconds(state.modelVideo.durationSec)],
    ["lastError", state.modelScan.lastError ?? "-"],
  ])
  return list
}

function createReferenceLibraryContent() {
  const stats = getReferenceLibraryStats()
  const list = document.createElement("dl")
  list.className = "summary-list"
  appendDefinitionItems(list, [
    ["rawIdealReferenceFrames count", String(state.rawIdealReferenceFrames.length)],
    ["accepted count", String(state.modelScan.acceptedFrames)],
    ["excluded count", String(state.modelScan.excludedFrames)],
    ["pose available count", String(stats.poseAvailableCount)],
    ["blendshapes available count", String(stats.blendshapesAvailableCount)],
    ["expression distribution", formatCounts(stats.expressionDistribution)],
    ["landmark count summary", formatCounts(stats.landmarkCountSummary)],
  ])
  return list
}

function createMatchingContent() {
  const fragment = document.createDocumentFragment()
  const acceptedFrames = getAcceptedFrames().filter(
    (frame) => frame.landmarks478.length === REQUIRED_LANDMARK_COUNT,
  )
  const current = state.currentLiveFrameAnalysis
  const match = state.top1Match
  const idealFrame = getMatchedIdealFrame()

  if (acceptedFrames.length === 0) {
    const message = document.createElement("p")
    message.className = "placeholder-text"
    message.textContent = "モデル動画を解析して raw ideal reference frames を作成してください。"
    fragment.appendChild(message)
  }

  if (!current.analyzed) {
    const message = document.createElement("p")
    message.className = "placeholder-text"
    message.textContent = "ライブ動画の current frame はまだ解析されていません。"
    fragment.appendChild(message)
  }

  const currentHeading = document.createElement("h3")
  currentHeading.textContent = "Current live frame"
  const currentList = document.createElement("dl")
  currentList.className = "summary-list"
  appendDefinitionItems(currentList, [
    ["Live MediaPipe status", state.liveMediaPipe.status],
    ["liveTimestampMs", formatSeconds(state.liveMediaPipe.liveTimestampMs)],
    ["analyzed", current.analyzed ? "yes" : "no"],
    ["timeSec", current.timeSec === null ? "-" : `${formatSeconds(current.timeSec)} sec`],
    ["pose yaw / pitch / roll", formatPose(current.pose)],
    ["expressionGroup", current.analyzed ? current.expressionGroup : "-"],
    ["qualityScore", formatSeconds(current.qualityScore)],
    ["landmarkCount", String(current.landmarks478.length)],
    ["missingBlendshapes", formatMissingBlendshapes(current.blendshapes)],
    ["error", current.error ?? "-"],
    ["matching", match.error?.includes("matching skipped") ? "skipped" : match.matched ? "matched" : "not matched"],
  ])

  const idealHeading = document.createElement("h3")
  idealHeading.textContent = "Top1 ideal reference"
  const idealList = document.createElement("dl")
  idealList.className = "summary-list"
  appendDefinitionItems(idealList, [
    ["matched", match.matched ? "yes" : "no"],
    ["frameId", match.idealFrameId ?? "-"],
    ["frameIndex", match.idealFrameIndex === null ? "-" : String(match.idealFrameIndex)],
    ["timeSec", match.idealTimeSec === null ? "-" : `${formatSeconds(match.idealTimeSec)} sec`],
    ["pose yaw / pitch / roll", idealFrame ? formatPose(idealFrame.pose) : "-"],
    ["expressionGroup", idealFrame?.expressionGroup ?? "-"],
    ["qualityScore", idealFrame ? formatSeconds(idealFrame.qualityScore) : "-"],
    ["missingBlendshapes", idealFrame ? formatMissingBlendshapes(idealFrame.blendshapes) : "-"],
    ["error", match.error ?? "-"],
  ])

  const scoreHeading = document.createElement("h3")
  scoreHeading.textContent = "Scores"
  const scoreList = document.createElement("dl")
  scoreList.className = "summary-list"
  appendDefinitionItems(scoreList, [
    ["matchScore", formatSeconds(match.matchScore)],
    ["poseDistance", formatSeconds(match.poseDistance)],
    ["expressionDistance", formatSeconds(match.expressionDistance)],
    ["qualityPenalty", formatSeconds(match.qualityPenalty)],
    ["pose unit", "degree squared"],
    ["weights", `pose ${POSE_WEIGHT} / expression ${EXPRESSION_WEIGHT} / quality ${QUALITY_WEIGHT}`],
  ])

  fragment.append(
    currentHeading,
    currentList,
    idealHeading,
    idealList,
    scoreHeading,
    scoreList,
  )
  return fragment
}

function createMeshPrototypeContent() {
  const fragment = document.createDocumentFragment()
  const mesh = state.currentIdealMeshPrototype
  const summary = mesh.summary
  const gridAnchorDisplay = getGridAnchorDisplayState()

  const heading = document.createElement("h3")
  heading.textContent = "Warp Mesh"

  const status = document.createElement("p")
  status.className = "placeholder-text"
  status.textContent =
    "visible current landmarks + grid / anchors の mesh pair prototype を確認します。WebGL warp と raw displacement warp はまだ行いません。"

  const sourceHeading = document.createElement("h3")
  sourceHeading.textContent = "Current Mesh Source"
  const sourceList = document.createElement("dl")
  sourceList.className = "summary-list"
  appendDefinitionItems(sourceList, [
    ["currentLiveFrameAnalysis", state.currentLiveFrameAnalysis.analyzed ? "available" : "not analyzed"],
    ["top1 reference matching", state.top1Match.matched ? "matched" : "not matched"],
    ["top1MatchedReferenceId", summary.top1MatchedReferenceId ?? "-"],
    ["candidateAlignedIdealLandmarkCount", String(summary.candidateAlignedIdealLandmarkCount)],
    ["gridMode", summary.gridMode],
    ["nearFaceGridMode", summary.nearFaceGridMode],
    ["acceptedFaceLandmarkCount", String(summary.acceptedFaceLandmarkCount)],
    ["faceMedianNearestDistance", formatMetric(summary.faceMedianNearestDistance)],
    [
      "faceNearestDistanceSampleCount",
      String(summary.faceNearestDistanceSampleCount),
    ],
    ["nearFaceGridSpacing", formatMetric(summary.nearFaceGridSpacing)],
    ["backgroundGridSpacing", formatMetric(summary.backgroundGridSpacing)],
    ["screenEdgeAnchorSpacing", formatMetric(summary.screenEdgeAnchorSpacing)],
    [
      "nearFaceGridSpacingRatioToFaceMedian",
      formatMetric(summary.nearFaceGridSpacingRatioToFaceMedian),
    ],
    [
      "backgroundGridSpacingRatioToFaceMedian",
      formatMetric(summary.backgroundGridSpacingRatioToFaceMedian),
    ],
    ["faceOnlyTriangleCount", String(summary.faceOnlyTriangleCount)],
    [
      "faceInteriorTestTriangleCount",
      String(summary.faceInteriorTestTriangleCount),
    ],
    ["nearFaceCandidateGridCount", String(summary.nearFaceCandidateGridCount)],
    [
      "nearFaceRemovedInsideFaceCount",
      String(summary.nearFaceRemovedInsideFaceCount),
    ],
    [
      "nearFaceRemovedTooCloseToFaceCount",
      String(summary.nearFaceRemovedTooCloseToFaceCount),
    ],
    ["nearFaceAcceptedGridCount", String(summary.nearFaceAcceptedGridCount)],
    ["tooCloseToFaceThreshold", formatMetric(summary.tooCloseToFaceThreshold)],
    ["currentLandmarkCount", String(summary.currentLandmarkCount)],
    ["visibleCurrentLandmarkCount", String(summary.visibleCurrentLandmarkCount)],
    ["excludedCurrentLandmarkCount", String(summary.excludedCurrentLandmarkCount)],
    ["faceSourceVertexCount", String(summary.faceSourceVertexCount)],
    ["nearFaceGridCount", String(summary.nearFaceGridCount)],
    ["backgroundGridCount", String(summary.backgroundGridCount)],
    ["screenEdgeAnchorCount", String(summary.screenEdgeAnchorCount)],
    ["gridAnchorDisplay", formatGridAnchorDisplay(gridAnchorDisplay)],
  ])

  const targetHeading = document.createElement("h3")
  targetHeading.textContent = "Ideal Mesh Target"
  const targetList = document.createElement("dl")
  targetList.className = "summary-list"
  appendDefinitionItems(targetList, [
    ["meshPairCount", String(summary.meshPairCount)],
    ["triangleMode", summary.triangleMode],
    ["vertexCount", String(summary.vertexCount)],
    ["triangleCount", String(summary.triangleCount)],
    ["validTriangleCount", String(summary.validTriangleCount)],
    ["warningTriangleCount", String(summary.warningTriangleCount)],
    ["excludedTriangleCount", String(summary.excludedTriangleCount)],
    [
      "usageWeight average / min / max",
      `${formatMetric(summary.usageWeightAverage)} / ${formatMetric(summary.usageWeightMin)} / ${formatMetric(summary.usageWeightMax)}`,
    ],
    ["alignedIdeal rule", "candidate only; not final target for all 478 landmarks"],
    ["faceLandmark target", "selected current landmark index -> same candidate aligned ideal index"],
    ["grid / anchors target", "fixed source position"],
  ])

  const triangleHeading = document.createElement("h3")
  triangleHeading.textContent = "Triangle Mesh"
  const triangleList = document.createElement("dl")
  triangleList.className = "summary-list"
  appendDefinitionItems(triangleList, [
    ["mode", mesh.triangleMesh.mode],
    ["source coordinate", "source vertices; aspect-corrected quality evaluation"],
    ["shared indices", "source mesh と target mesh で同じ triangle indices を使用"],
    ["triangleCount", String(mesh.triangleMesh.triangleCount)],
    ["validTriangleCount", String(mesh.triangleMesh.validTriangleCount)],
    ["warningTriangleCount", String(mesh.triangleMesh.warningTriangleCount)],
    ["excludedTriangleCount", String(mesh.triangleMesh.excludedTriangleCount)],
    ["triangleKindCounts", formatCounts(mesh.triangleMesh.triangleKindCounts)],
    ["triangleQuality", formatCounts(mesh.triangleMesh.triangleQuality)],
    ["triangleArea min / median / max", formatMetricRange(mesh.triangleMesh.triangleArea)],
    [
      "triangleAspectRatio min / median / max",
      formatMetricRange(mesh.triangleMesh.triangleAspectRatio),
    ],
    ["trianglePreview", formatTrianglePreview(mesh.triangleMesh.trianglePreview)],
  ])

  const webglHeading = document.createElement("h3")
  webglHeading.textContent = "WebGL mesh warp input"
  const webglList = document.createElement("dl")
  webglList.className = "summary-list"
  appendDefinitionItems(webglList, [
    ["mode", mesh.webglMeshWarpInput.mode],
    ["webglInputReady", mesh.webglMeshWarpInput.webglInputReady ? "true" : "false"],
    ["vertexCount", String(mesh.webglMeshWarpInput.vertexCount)],
    ["sourceVertexCount", String(mesh.webglMeshWarpInput.sourceVertexCount)],
    ["targetVertexCount", String(mesh.webglMeshWarpInput.targetVertexCount)],
    ["triangleCount", String(mesh.webglMeshWarpInput.triangleCount)],
    ["indexCount", String(mesh.webglMeshWarpInput.indexCount)],
    ["sourceUvConvention", mesh.webglMeshWarpInput.sourceUvConvention],
    ["targetPositionConvention", mesh.webglMeshWarpInput.targetPositionConvention],
    ["sourceUvRange", formatUvRange(mesh.webglMeshWarpInput.sourceUvSummary)],
    [
      "targetClipRange",
      formatClipRange(mesh.webglMeshWarpInput.targetPositionSummary),
    ],
    [
      "sourceTargetVertexCountMatch",
      mesh.webglMeshWarpInput.coordinateSummary.sourceTargetVertexCountMatch
        ? "true"
        : "false",
    ],
    [
      "indexWithinVertexRange",
      mesh.webglMeshWarpInput.indexSummary.indexWithinVertexRange ? "true" : "false",
    ],
    [
      "maxIndex",
      mesh.webglMeshWarpInput.indexSummary.maxIndex === null
        ? "-"
        : String(mesh.webglMeshWarpInput.indexSummary.maxIndex),
    ],
    [
      "invalidIndexCount",
      String(mesh.webglMeshWarpInput.indexSummary.invalidIndexCount),
    ],
    [
      "outOfRangeUvCount",
      String(mesh.webglMeshWarpInput.sourceUvSummary.outOfRangeUvCount),
    ],
    [
      "outOfRangeTargetCount",
      String(mesh.webglMeshWarpInput.targetPositionSummary.outOfRangeTargetCount),
    ],
    [
      "outOfRangeClipCount",
      String(mesh.webglMeshWarpInput.targetPositionSummary.outOfRangeClipCount),
    ],
    ["warnings", formatWarnings(mesh.webglMeshWarpInput.warnings)],
  ])

  const webglPreviewHeading = document.createElement("h3")
  webglPreviewHeading.textContent = "WebGL mesh warp preview runtime"
  const webglPreviewList = document.createElement("dl")
  webglPreviewList.className = "summary-list"
  appendDefinitionItems(webglPreviewList, [
    ["webglPreviewEnabled", String(state.webglPreview.webglPreviewEnabled)],
    ["webglPreviewStatus", state.webglPreview.webglPreviewStatus],
    ["webglPreviewError", state.webglPreview.webglPreviewError ?? "-"],
    ["webglCanvasSize", formatWebglCanvasSize(state.webglPreview.webglCanvasSize)],
    ["videoTextureReady", String(state.webglPreview.videoTextureReady)],
    [
      "lastDrawTimestampMs",
      formatMetric(state.webglPreview.lastDrawTimestampMs),
    ],
    ["drawCallCount", String(state.webglPreview.drawCallCount)],
    ["lastDrawTriangleCount", String(state.webglPreview.lastDrawTriangleCount)],
    ["lastDrawIndexCount", String(state.webglPreview.lastDrawIndexCount)],
    ["textureVMode", state.webglPreview.textureVMode],
    ["fallbackReason", state.webglPreview.fallbackReason ?? "-"],
  ])

  const dynamicGridHeading = document.createElement("h3")
  dynamicGridHeading.textContent = "Dynamic Grid"
  const dynamicGridList = document.createElement("dl")
  dynamicGridList.className = "summary-list"
  appendDefinitionItems(dynamicGridList, [
    ["mode", mesh.dynamicGrid.mode],
    ["nearFaceGridMode", mesh.dynamicGrid.nearFaceGridMode],
    ["faceBounds", formatBoundsSummary(mesh.dynamicGrid.faceBounds)],
    [
      "expandedNearFaceBounds",
      formatBoundsSummary(mesh.dynamicGrid.expandedNearFaceBounds),
    ],
    ["videoAspectRatio", formatMetric(mesh.dynamicGrid.videoAspectRatio)],
    ["faceOnlyTriangleCount", String(mesh.dynamicGrid.faceOnlyTriangleCount)],
    [
      "faceInteriorTestTriangleCount",
      String(mesh.dynamicGrid.faceInteriorTestTriangleCount),
    ],
    [
      "faceInteriorPreview",
      formatFaceInteriorTrianglePreview(mesh.dynamicGrid.faceInterior.preview),
    ],
    [
      "nearFaceCandidateGridCount",
      String(mesh.dynamicGrid.nearFaceCandidateGridCount),
    ],
    [
      "nearFaceRemovedInsideFaceCount",
      String(mesh.dynamicGrid.nearFaceRemovedInsideFaceCount),
    ],
    [
      "nearFaceRemovedTooCloseToFaceCount",
      String(mesh.dynamicGrid.nearFaceRemovedTooCloseToFaceCount),
    ],
    [
      "tooCloseToFaceThreshold",
      formatMetric(mesh.dynamicGrid.tooCloseToFaceThreshold),
    ],
    ["nearFaceGridCount", String(mesh.dynamicGrid.nearFaceGridCount)],
    ["backgroundGridCount", String(mesh.dynamicGrid.backgroundGridCount)],
    ["screenEdgeAnchorCount", String(mesh.dynamicGrid.screenEdgeAnchorCount)],
    [
      "gridPointPreview",
      formatDynamicGridPointPreview(mesh.dynamicGrid.gridPointPreview),
    ],
  ])

  const alignmentHeading = document.createElement("h3")
  alignmentHeading.textContent = "Aspect Corrected Alignment"
  const alignmentList = document.createElement("dl")
  alignmentList.className = "summary-list"
  appendDefinitionItems(alignmentList, [
    ["videoAspectRatio", formatMetric(mesh.aspectDebug.videoAspectRatio)],
    ["modelVideoAspectRatio", formatMetric(mesh.aspectDebug.modelVideoAspectRatio)],
    ["liveVideoAspectRatio", formatMetric(mesh.aspectDebug.liveVideoAspectRatio)],
    ["scale", formatMetric(mesh.aspectDebug.alignment?.scale ?? null)],
    [
      "idealCenterAspectCorrected",
      formatPoint(mesh.aspectDebug.alignment?.idealCenterAspectCorrected ?? null),
    ],
    [
      "currentCenterAspectCorrected",
      formatPoint(mesh.aspectDebug.alignment?.currentCenterAspectCorrected ?? null),
    ],
    [
      "idealBoundsAspectCorrected",
      formatBoundsSummary(mesh.aspectDebug.alignment?.idealBoundsAspectCorrected ?? null),
    ],
    [
      "currentBoundsAspectCorrected",
      formatBoundsSummary(mesh.aspectDebug.alignment?.currentBoundsAspectCorrected ?? null),
    ],
  ])

  const boundsHeading = document.createElement("h3")
  boundsHeading.textContent = "Bounds / Aspect Debug"
  const boundsList = document.createElement("dl")
  boundsList.className = "summary-list"
  appendDefinitionItems(boundsList, [
    [
      "current landmarks",
      formatCoordinateBoundsDebug(mesh.aspectDebug.bounds.currentLandmarks),
    ],
    [
      "top1 raw ideal reference landmarks",
      formatCoordinateBoundsDebug(mesh.aspectDebug.bounds.top1RawIdealReferenceLandmarks),
    ],
    [
      "candidateAlignedIdealLandmarks",
      formatCoordinateBoundsDebug(mesh.aspectDebug.bounds.candidateAlignedIdealLandmarks),
    ],
    [
      "accepted current mesh source face landmarks",
      formatCoordinateBoundsDebug(
        mesh.aspectDebug.bounds.acceptedCurrentMeshSourceFaceLandmarks,
      ),
    ],
    [
      "ideal mesh target face landmarks",
      formatCoordinateBoundsDebug(mesh.aspectDebug.bounds.idealMeshTargetFaceLandmarks),
    ],
  ])

  const reasonHeading = document.createElement("h3")
  reasonHeading.textContent = "Suppression / Exclusion"
  const reasonList = document.createElement("dl")
  reasonList.className = "summary-list"
  appendDefinitionItems(reasonList, [
    ["boundarySuppressedCount", String(summary.boundarySuppressedCount)],
    ["mouthSuppressedCount", String(summary.mouthSuppressedCount)],
    ["eyeSuppressedCount", String(summary.eyeSuppressedCount)],
    ["largeDisplacementSuppressedCount", String(summary.largeDisplacementSuppressedCount)],
    ["invalidExcludedCount", String(summary.invalidExcludedCount)],
    ["accepted landmark preview", formatMeshLandmarkPreview(mesh.acceptedCurrentLandmarks)],
    ["excluded landmark preview", formatMeshLandmarkPreview(mesh.excludedCurrentLandmarks)],
  ])

  fragment.append(
    heading,
    status,
    sourceHeading,
    sourceList,
    targetHeading,
    targetList,
    triangleHeading,
    triangleList,
    webglHeading,
    webglList,
    webglPreviewHeading,
    webglPreviewList,
    dynamicGridHeading,
    dynamicGridList,
    alignmentHeading,
    alignmentList,
    boundsHeading,
    boundsList,
    reasonHeading,
    reasonList,
  )
  return fragment
}

function createWarpMeshContent() {
  const fragment = document.createDocumentFragment()
  const warpHeading = document.createElement("h3")
  warpHeading.textContent = "Warp Mesh"

  const status = document.createElement("p")
  status.className = "placeholder-text"
  status.textContent =
    "本線は未実装です。PR5以降の alignedIdeal 478点全体 displacement / raw displacement mesh warp は本線から外しました。"

  const currentHeading = document.createElement("h3")
  currentHeading.textContent = "現時点で残っているもの"
  const currentList = document.createElement("dl")
  currentList.className = "summary-list"
  appendDefinitionItems(currentList, [
    ["currentLiveFrameAnalysis", state.currentLiveFrameAnalysis.analyzed ? "available" : "not analyzed"],
    ["top1 reference matching", state.top1Match.matched ? "matched" : "not matched"],
  ])

  const nextHeading = document.createElement("h3")
  nextHeading.textContent = "次の本線"
  const nextList = document.createElement("dl")
  nextList.className = "summary-list"
  appendDefinitionItems(nextList, [
    ["prototype", "current mesh source / ideal mesh target pairs"],
    ["candidateAlignedIdealLandmarks", "top1 reference を current face へ位置合わせした ideal candidate"],
    ["selectedFaceTargets", "source 側で採用された landmark index だけに対応する target 候補"],
    ["mesh pairs", "selected face landmarks と grid / anchors を同順対応で確認する debug 入力"],
  ])

  const missingHeading = document.createElement("h3")
  missingHeading.textContent = "未実装"
  const missingList = document.createElement("dl")
  missingList.className = "summary-list"
  appendDefinitionItems(missingList, [
    ["precise visibilityWeight", "not implemented"],
    ["production warpSafetyWeight", "not implemented"],
    ["face boundary anchors", "not implemented"],
    ["WebGL warp", "not implemented"],
    ["hybrid mesh", "not implemented"],
    ["production mesh warp", "not implemented"],
  ])

  fragment.append(warpHeading, status, currentHeading, currentList, nextHeading, nextList, missingHeading, missingList)
  return fragment
}

function appendDefinitionItems(list: HTMLDListElement, items: Array<[string, string]>) {
  items.forEach(([label, value]) => {
    const row = document.createElement("div")
    const dt = document.createElement("dt")
    const dd = document.createElement("dd")
    dt.textContent = label
    dd.textContent = value
    row.append(dt, dd)
    list.appendChild(row)
  })
}

function getRawState() {
  const currentFrame = getCurrentAcceptedFrame()
  return {
    activePreviewTab: state.activePreviewTab,
    activeDebugTab: state.activeDebugTab,
    applyWebglMeshWarp: state.applyWebglMeshWarp,
    webglPreview: roundWebglPreviewRuntimeDebug(state.webglPreview),
    overlay: state.overlay,
    gridAnchorDisplay: getGridAnchorDisplayState(),
    modelVideo: {
      loaded: state.modelVideo.loaded,
      fileName: state.modelVideo.fileName,
      durationSec: roundForState(state.modelVideo.durationSec),
      width: state.modelVideo.width,
      height: state.modelVideo.height,
      currentTimeSec: roundForState(state.modelVideo.currentTimeSec),
      currentReviewFrameIndex: state.modelVideo.currentReviewFrameIndex,
      scanStatus: state.modelVideo.scanStatus,
    },
    modelScan: {
      mediaPipeStatus: state.modelScan.mediaPipeStatus,
      mediaPipeError: state.modelScan.mediaPipeError,
      modelTimestampMs: roundForState(state.modelScan.modelTimestampMs),
      maxScanFrames: state.modelScan.maxScanFrames,
      scanFrameStepSec: state.modelScan.scanFrameStepSec,
      scanProgress: state.modelScan.scanProgress,
      plannedScanFrames: state.modelScan.plannedScanFrames,
      totalScannedFrames: state.modelScan.totalScannedFrames,
      acceptedFrames: state.modelScan.acceptedFrames,
      excludedFrames: state.modelScan.excludedFrames,
      excludedReasonCounts: state.modelScan.excludedReasonCounts,
      lastError: state.modelScan.lastError,
    },
    referenceLibrary: {
      rawIdealReferenceFrames: state.rawIdealReferenceFrames.length,
      acceptedFrames: state.modelScan.acceptedFrames,
      currentAcceptedFrame: currentFrame
        ? {
            frameId: currentFrame.frameId,
            frameIndex: currentFrame.frameIndex,
            timeSec: roundForState(currentFrame.timeSec),
            landmarkCount: currentFrame.landmarks478.length,
            pose: roundPose(currentFrame.pose),
            blendshapeCount: currentFrame.blendshapes.length,
            expressionGroup: currentFrame.expressionGroup,
            qualityScore: currentFrame.qualityScore,
            landmarksPreview: currentFrame.landmarks478
              .slice(0, LANDMARK_PREVIEW_COUNT)
              .map(roundLandmark),
          }
        : null,
    },
    liveVideo: {
      loaded: state.liveVideo.loaded,
      fileName: state.liveVideo.fileName,
      durationSec: roundForState(state.liveVideo.durationSec),
      width: state.liveVideo.width,
      height: state.liveVideo.height,
      currentTimeSec: roundForState(state.liveVideo.currentTimeSec),
      playbackStatus: state.liveVideo.playbackStatus,
    },
    liveMediaPipe: {
      status: state.liveMediaPipe.status,
      error: state.liveMediaPipe.error,
      liveTimestampMs: roundForState(state.liveMediaPipe.liveTimestampMs),
    },
    currentLiveFrameAnalysis: getCurrentLiveFrameRawState(),
    top1Match: {
      matched: state.top1Match.matched,
      idealFrameId: state.top1Match.idealFrameId,
      idealFrameIndex: state.top1Match.idealFrameIndex,
      idealTimeSec: roundForState(state.top1Match.idealTimeSec),
      matchScore: roundForState(state.top1Match.matchScore),
      poseDistance: roundForState(state.top1Match.poseDistance),
      expressionDistance: roundForState(state.top1Match.expressionDistance),
      qualityPenalty: roundForState(state.top1Match.qualityPenalty),
      currentExpressionGroup: state.top1Match.currentExpressionGroup,
      idealExpressionGroup: state.top1Match.idealExpressionGroup,
      error: state.top1Match.error,
    },
    currentIdealMeshPrototype: getCurrentIdealMeshPrototypeRawState(),
    logs: state.logs,
  }
}

function getCurrentIdealMeshPrototypeRawState() {
  const mesh = state.currentIdealMeshPrototype
  return {
    summary: {
      ...mesh.summary,
      faceMedianNearestDistance: roundMetricForState(
        mesh.summary.faceMedianNearestDistance,
      ),
      nearFaceGridSpacing: roundMetricForState(mesh.summary.nearFaceGridSpacing),
      backgroundGridSpacing: roundMetricForState(mesh.summary.backgroundGridSpacing),
      screenEdgeAnchorSpacing: roundMetricForState(
        mesh.summary.screenEdgeAnchorSpacing,
      ),
      nearFaceGridSpacingRatioToFaceMedian: roundMetricForState(
        mesh.summary.nearFaceGridSpacingRatioToFaceMedian,
      ),
      backgroundGridSpacingRatioToFaceMedian: roundMetricForState(
        mesh.summary.backgroundGridSpacingRatioToFaceMedian,
      ),
      tooCloseToFaceThreshold: roundMetricForState(
        mesh.summary.tooCloseToFaceThreshold,
      ),
      faceBounds: roundBoundsDebugSummary(mesh.summary.faceBounds),
      expandedNearFaceBounds: roundBoundsDebugSummary(
        mesh.summary.expandedNearFaceBounds,
      ),
      videoAspectRatio: roundMetricForState(mesh.summary.videoAspectRatio),
      triangleArea: roundMetricRange(mesh.summary.triangleArea),
      triangleAspectRatio: roundMetricRange(mesh.summary.triangleAspectRatio),
      usageWeightAverage: roundMetricForState(mesh.summary.usageWeightAverage),
      usageWeightMin: roundMetricForState(mesh.summary.usageWeightMin),
      usageWeightMax: roundMetricForState(mesh.summary.usageWeightMax),
    },
    dynamicGrid: roundDynamicGridDebug(mesh.dynamicGrid),
    triangleMesh: roundTriangleMeshDebug(mesh.triangleMesh),
    webglMeshWarpInput: roundWebglMeshWarpInputDebug(mesh.webglMeshWarpInput),
    aspectDebug: roundMeshAspectDebug(mesh.aspectDebug),
    candidateAlignedIdealLandmarkPreview: mesh.candidateAlignedIdealLandmarks
      .slice(0, LANDMARK_PREVIEW_COUNT)
      .map(roundLandmark),
    acceptedCurrentLandmarkPreview: mesh.acceptedCurrentLandmarks
      .slice(0, LANDMARK_PREVIEW_COUNT)
      .map(roundCurrentMeshLandmarkVertex),
    excludedCurrentLandmarkPreview: mesh.excludedCurrentLandmarks
      .slice(0, LANDMARK_PREVIEW_COUNT)
      .map(roundCurrentMeshLandmarkVertex),
    meshPairPreview: mesh.currentIdealMeshPairs
      .slice(0, LANDMARK_PREVIEW_COUNT)
      .map(roundMeshVertexPair),
  }
}

function getCurrentLiveFrameRawState() {
  const current = state.currentLiveFrameAnalysis
  return {
    analyzed: current.analyzed,
    timeSec: roundForState(current.timeSec),
    landmarkCount: current.landmarks478.length,
    pose: roundPose(current.pose),
    blendshapeCount: current.blendshapes.length,
    expressionGroup: current.expressionGroup,
    qualityScore: current.qualityScore,
    error: current.error,
    landmarksPreview: current.landmarks478.slice(0, LANDMARK_PREVIEW_COUNT).map(roundLandmark),
  }
}

function getDebugPlaceholder(tab: DebugTab) {
  switch (tab) {
    case "matching":
      return "live current frame と ideal reference frame の matching はまだ実行されていません。"
    case "warpMesh":
      return "調整なし mesh warp prototype の状態は Warp Mesh タブに表示します。"
    case "modelScan":
    case "referenceLibrary":
    case "raw":
    case "summary":
      return ""
  }
}

function updateModelRange() {
  const range = getElement<HTMLInputElement>('[data-range="model"]')

  if (hasAcceptedFrames()) {
    const acceptedFrames = getAcceptedFrames()
    range.max = String(Math.max(acceptedFrames.length - 1, 0))
    range.step = "1"
    range.value = String(state.currentAcceptedReviewIndex ?? 0)
    return
  }

  const duration = state.modelVideo.durationSec ?? 0
  range.max = String(duration)
  range.step = "0.001"
  range.value = String(clamp(state.modelVideo.currentTimeSec, 0, duration))
}

function updateRange(kind: "live") {
  const videoState = state.liveVideo
  const range = getElement<HTMLInputElement>(`[data-range="${kind}"]`)
  const duration = videoState.durationSec ?? 0

  range.max = String(duration)
  range.value = String(clamp(videoState.currentTimeSec, 0, duration))
}

function drawModelOverlay() {
  const frame = getCurrentAcceptedFrame()
  drawLandmarkOverlay({
    canvas: modelOverlayCanvas,
    videoElement: modelVideoElement,
    videoState: state.modelVideo,
    landmarks: frame?.landmarks478 ?? [],
    shouldDraw:
      state.overlay.showLandmarks478 &&
      state.activePreviewTab === "model" &&
      Boolean(frame) &&
      (frame?.landmarks478.length ?? 0) === REQUIRED_LANDMARK_COUNT,
    color: "rgba(32, 186, 165, 0.85)",
  })
}

function drawLiveOverlay() {
  const context = liveOverlayCanvas.getContext("2d")
  if (!context) {
    return
  }

  const rect = liveOverlayCanvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  liveOverlayCanvas.width = Math.max(1, Math.round(rect.width * dpr))
  liveOverlayCanvas.height = Math.max(1, Math.round(rect.height * dpr))
  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  context.clearRect(0, 0, rect.width, rect.height)

  if (
    state.activePreviewTab !== "live" ||
    rect.width <= 0 ||
    rect.height <= 0 ||
    state.currentLiveFrameAnalysis.landmarks478.length !== REQUIRED_LANDMARK_COUNT
  ) {
    return
  }

  const displayedContentRect = getDisplayedContentRect(
    state.liveVideo,
    liveVideoElement,
    rect.width,
    rect.height,
  )

  if (state.overlay.showLandmarks478) {
    drawLandmarkPoints(
      context,
      displayedContentRect,
      state.currentLiveFrameAnalysis.landmarks478,
      "rgba(79, 128, 255, 0.85)",
      1.45,
    )
  }

  drawMeshPrototypeOverlay(context, displayedContentRect)
}

function drawAllOverlays() {
  drawModelOverlay()
  drawLiveOverlay()
}

function drawLandmarkOverlay({
  canvas,
  videoElement,
  videoState,
  landmarks,
  shouldDraw,
  color,
}: {
  canvas: HTMLCanvasElement
  videoElement: HTMLVideoElement
  videoState: VideoPreviewState
  landmarks: ReferenceLandmark[]
  shouldDraw: boolean
  color: string
}) {
  const context = canvas.getContext("2d")
  if (!context) {
    return
  }

  const rect = videoElement.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.max(1, Math.round(rect.width * dpr))
  canvas.height = Math.max(1, Math.round(rect.height * dpr))
  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  context.clearRect(0, 0, rect.width, rect.height)

  if (
    !shouldDraw ||
    landmarks.length !== REQUIRED_LANDMARK_COUNT ||
    rect.width <= 0 ||
    rect.height <= 0
  ) {
    return
  }

  const displayedContentRect = getDisplayedContentRect(
    videoState,
    videoElement,
    rect.width,
    rect.height,
  )
  drawLandmarkPoints(context, displayedContentRect, landmarks, color, 1.45)
}

function drawLandmarkPoints(
  context: CanvasRenderingContext2D,
  displayedContentRect: Rect,
  landmarks: ReferenceLandmark[],
  color: string,
  radius: number,
) {
  context.fillStyle = color
  for (const landmark of landmarks) {
    const point = normalizedLandmarkToPreviewPixel(landmark, displayedContentRect)
    context.beginPath()
    context.arc(point.x, point.y, radius, 0, Math.PI * 2)
    context.fill()
  }
}

function drawMeshPrototypeOverlay(
  context: CanvasRenderingContext2D,
  displayedContentRect: Rect,
) {
  const mesh = state.currentIdealMeshPrototype
  const gridAnchorDisplay = getGridAnchorDisplayState()
  const showAnyMeshOverlay =
    state.overlay.showMeshSource ||
    state.overlay.showMeshTarget ||
    state.overlay.showMeshPairs ||
    state.overlay.showExcludedLandmarks ||
    state.overlay.showTriangleMesh ||
    gridAnchorDisplay.showSourceGrid ||
    gridAnchorDisplay.showTargetGrid

  if (!showAnyMeshOverlay || mesh.currentIdealMeshPairs.length === 0) {
    return
  }

  if (state.overlay.showTriangleMesh && state.overlay.showMeshSource) {
    drawTriangleWireframe(
      context,
      displayedContentRect,
      mesh.triangleMesh,
      mesh.currentMeshSourceVertices,
      TRIANGLE_SOURCE_COLOR,
    )
  }

  if (state.overlay.showTriangleMesh && state.overlay.showMeshTarget) {
    drawTriangleWireframe(
      context,
      displayedContentRect,
      mesh.triangleMesh,
      mesh.idealMeshTargetVertices,
      TRIANGLE_TARGET_COLOR,
    )
  }

  if (state.overlay.showMeshPairs) {
    context.strokeStyle = "rgba(241, 126, 39, 0.55)"
    context.lineWidth = 1
    for (const pair of mesh.currentIdealMeshPairs) {
      if (pair.kind !== "faceLandmark") {
        continue
      }
      const source = normalizedLandmarkToPreviewPixel(pair.source, displayedContentRect)
      const target = normalizedLandmarkToPreviewPixel(pair.target, displayedContentRect)
      context.beginPath()
      context.moveTo(source.x, source.y)
      context.lineTo(target.x, target.y)
      context.stroke()
    }
  }

  const gridAnchorPairs = mesh.currentIdealMeshPairs.filter(
    (pair) => pair.kind !== "faceLandmark",
  )

  if (gridAnchorDisplay.showSourceGrid) {
    drawMeshVertexPoints(
      context,
      displayedContentRect,
      gridAnchorPairs,
      "source",
      GRID_SOURCE_COLOR,
      2.2,
      "square",
    )
  }

  if (gridAnchorDisplay.showTargetGrid) {
    drawMeshVertexPoints(
      context,
      displayedContentRect,
      gridAnchorPairs,
      "target",
      GRID_TARGET_COLOR,
      2.35,
      "circle",
    )
  }

  if (state.overlay.showMeshSource) {
    drawMeshVertexPoints(
      context,
      displayedContentRect,
      mesh.currentIdealMeshPairs.filter((pair) => pair.kind === "faceLandmark"),
      "source",
      MESH_SOURCE_COLOR,
      2,
      "circle",
    )
  }

  if (state.overlay.showMeshTarget) {
    drawMeshVertexPoints(
      context,
      displayedContentRect,
      mesh.currentIdealMeshPairs.filter((pair) => pair.kind === "faceLandmark"),
      "target",
      MESH_TARGET_COLOR,
      2,
      "circle",
    )
  }

  if (state.overlay.showExcludedLandmarks) {
    drawCurrentMeshLandmarkPoints(
      context,
      displayedContentRect,
      mesh.excludedCurrentLandmarks,
      "rgba(32, 38, 45, 0.55)",
      2.1,
    )
  }
}

function drawTriangleWireframe(
  context: CanvasRenderingContext2D,
  displayedContentRect: Rect,
  triangleMesh: TriangleMeshDebug,
  vertices: Array<{ x: number; y: number }>,
  color: string,
) {
  context.strokeStyle = color
  context.lineWidth = 0.8
  for (const triangle of triangleMesh.triangles) {
    const [a, b, c] = triangle.indices.map((index) =>
      normalizedLandmarkToPreviewPixel(vertices[index], displayedContentRect),
    )
    context.beginPath()
    context.moveTo(a.x, a.y)
    context.lineTo(b.x, b.y)
    context.lineTo(c.x, c.y)
    context.closePath()
    context.stroke()
  }
}

function getGridAnchorDisplayState(): GridAnchorDisplayState {
  return {
    showSourceGrid: state.overlay.showGridAnchors && state.overlay.showMeshSource,
    showTargetGrid: state.overlay.showGridAnchors && state.overlay.showMeshTarget,
  }
}

function formatGridAnchorDisplay(display: GridAnchorDisplayState) {
  return `showSourceGrid: ${String(display.showSourceGrid)} / showTargetGrid: ${String(display.showTargetGrid)}`
}

function drawMeshVertexPoints(
  context: CanvasRenderingContext2D,
  displayedContentRect: Rect,
  pairs: MeshVertexPair[],
  side: "source" | "target",
  color: string,
  radius: number,
  shape: "circle" | "square",
) {
  context.fillStyle = color
  for (const pair of pairs) {
    const point = normalizedLandmarkToPreviewPixel(pair[side], displayedContentRect)
    if (shape === "square") {
      context.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2)
      continue
    }
    context.beginPath()
    context.arc(point.x, point.y, radius, 0, Math.PI * 2)
    context.fill()
  }
}

function drawCurrentMeshLandmarkPoints(
  context: CanvasRenderingContext2D,
  displayedContentRect: Rect,
  vertices: CurrentMeshLandmarkVertex[],
  color: string,
  radius: number,
) {
  context.strokeStyle = color
  context.lineWidth = 1.5
  for (const vertex of vertices) {
    const point = normalizedLandmarkToPreviewPixel(vertex.source, displayedContentRect)
    context.beginPath()
    context.moveTo(point.x - radius, point.y - radius)
    context.lineTo(point.x + radius, point.y + radius)
    context.moveTo(point.x + radius, point.y - radius)
    context.lineTo(point.x - radius, point.y + radius)
    context.stroke()
  }
}

function clearModelOverlay() {
  clearOverlay(modelOverlayCanvas)
}

function clearLiveOverlay() {
  clearOverlay(liveOverlayCanvas)
}

function clearOverlay(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d")
  if (!context) {
    return
  }
  context.clearRect(0, 0, canvas.width, canvas.height)
}

function getDisplayedContentRect(
  videoState: VideoPreviewState,
  videoElement: HTMLVideoElement,
  containerWidth: number,
  containerHeight: number,
): Rect {
  const videoWidth = videoState.width ?? videoElement.videoWidth
  const videoHeight = videoState.height ?? videoElement.videoHeight
  if (!videoWidth || !videoHeight) {
    return {
      x: 0,
      y: 0,
      width: containerWidth,
      height: containerHeight,
    }
  }

  const videoAspect = videoWidth / videoHeight
  const containerAspect = containerWidth / containerHeight

  if (containerAspect > videoAspect) {
    const width = containerHeight * videoAspect
    return {
      x: (containerWidth - width) / 2,
      y: 0,
      width,
      height: containerHeight,
    }
  }

  const height = containerWidth / videoAspect
  return {
    x: 0,
    y: (containerHeight - height) / 2,
    width: containerWidth,
    height,
  }
}

function normalizedLandmarkToPreviewPixel(
  landmark: { x: number; y: number },
  displayedContentRect: Rect,
) {
  return {
    x: displayedContentRect.x + landmark.x * displayedContentRect.width,
    y: displayedContentRect.y + landmark.y * displayedContentRect.height,
  }
}

function formatModelTimeStatus() {
  if (!state.modelVideo.loaded) {
    return "current time: - / -"
  }

  if (hasAcceptedFrames()) {
    const frame = getCurrentAcceptedFrame()
    return frame
      ? `accepted frame: ${formatAcceptedReviewPosition()} / ${formatSeconds(frame.timeSec)} sec`
      : "accepted frame: -"
  }

  return formatTimeStatus(state.modelVideo)
}

function formatTimeStatus(videoState: VideoPreviewState) {
  if (!videoState.loaded) {
    return "current time: - / -"
  }

  return `current time: ${formatSeconds(videoState.currentTimeSec)} / ${formatSeconds(videoState.durationSec)} sec`
}

function formatDuration(value: number | null) {
  return value === null ? "-" : `${formatSeconds(value)} sec`
}

function formatSeconds(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "-"
  }

  return value.toFixed(2)
}

function formatMetric(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "-"
  }

  return value.toFixed(4)
}

function formatPoint(point: Point2D | null) {
  if (!point) {
    return "-"
  }

  return `x ${formatMetric(point.x)} / y ${formatMetric(point.y)}`
}

function formatBoundsSummary(bounds: BoundsDebugSummary | null) {
  if (!bounds) {
    return "-"
  }

  return [
    `minX ${formatMetric(bounds.minX)}`,
    `maxX ${formatMetric(bounds.maxX)}`,
    `minY ${formatMetric(bounds.minY)}`,
    `maxY ${formatMetric(bounds.maxY)}`,
    `width ${formatMetric(bounds.width)}`,
    `height ${formatMetric(bounds.height)}`,
    `aspect ${formatMetric(bounds.aspect)}`,
  ].join(" / ")
}

function formatCoordinateBoundsDebug(debug: CoordinateBoundsDebug) {
  return `normalized: ${formatBoundsSummary(debug.normalized)} | aspect-corrected: ${formatBoundsSummary(debug.aspectCorrected)}`
}

function formatSize(width: number | null, height: number | null) {
  return width === null || height === null ? "-" : `${width} x ${height}`
}

function formatWebglCanvasSize(size: WebglPreviewRuntimeDebug["webglCanvasSize"]) {
  return `${size.width} x ${size.height}`
}

function formatCounts(counts: Record<string, number>) {
  const entries = Object.entries(counts)
  return entries.length === 0
    ? "-"
    : entries.map(([key, value]) => `${key}: ${value}`).join(" / ")
}

function formatMetricRange(range: TriangleMetricRange) {
  return `${formatMetric(range.min)} / ${formatMetric(range.median)} / ${formatMetric(range.max)}`
}

function formatMinMaxRange(range: MetricMinMaxRange) {
  return `min ${formatMetric(range.min)} / max ${formatMetric(range.max)}`
}

function formatUvRange(summary: WebglMeshWarpInputDebug["sourceUvSummary"]) {
  return `u ${formatMinMaxRange(summary.uRange)} / v ${formatMinMaxRange(summary.vRange)}`
}

function formatClipRange(
  summary: WebglMeshWarpInputDebug["targetPositionSummary"],
) {
  return `clipX ${formatMinMaxRange(summary.clipXRange)} / clipY ${formatMinMaxRange(summary.clipYRange)}`
}

function formatWarnings(warnings: string[]) {
  return warnings.length === 0 ? "-" : warnings.join(" / ")
}

function formatMeshLandmarkPreview(vertices: CurrentMeshLandmarkVertex[]) {
  if (vertices.length === 0) {
    return "-"
  }

  return vertices
    .slice(0, LANDMARK_PREVIEW_COUNT)
    .map((vertex) => `${vertex.index}:${formatMetric(vertex.usageWeight)}:${vertex.reasons.join("|")}`)
    .join(" / ")
}

function formatDynamicGridPointPreview(points: DynamicGridPointPreview[]) {
  if (points.length === 0) {
    return "-"
  }

  return points
    .map(
      (point) =>
        `${point.id} ${point.kind} (${formatMetric(point.x)}, ${formatMetric(point.y)}) ${point.reasons.join("|")}`,
    )
    .join(" / ")
}

function formatFaceInteriorTrianglePreview(triangles: FaceInteriorTrianglePreview[]) {
  if (triangles.length === 0) {
    return "-"
  }

  return triangles
    .map((triangle) => `${triangle.indices.join(",")} area:${formatMetric(triangle.area)}`)
    .join(" / ")
}

function formatTrianglePreview(triangles: TriangleMeshTriangle[]) {
  if (triangles.length === 0) {
    return "-"
  }

  return triangles
    .map(
      (triangle) =>
        `${triangle.indices.join(",")} ${triangle.kind} area:${formatMetric(triangle.area)} aspect:${formatMetric(triangle.aspectRatio)} warnings:${triangle.warnings.join("|") || "-"}`,
    )
    .join(" / ")
}

function formatAcceptedReviewPosition() {
  if (!hasAcceptedFrames()) {
    return "-"
  }

  return `${(state.currentAcceptedReviewIndex ?? 0) + 1} / ${state.modelScan.acceptedFrames}`
}

function formatPose(pose: ReferencePose) {
  return `yaw ${formatSeconds(pose.yaw)} / pitch ${formatSeconds(pose.pitch)} / roll ${formatSeconds(pose.roll)}`
}

function formatLiveAnalysisStatus() {
  if (!state.currentLiveFrameAnalysis.analyzed) {
    return "not analyzed"
  }

  return state.currentLiveFrameAnalysis.error ? "error" : "analyzed"
}

function formatMissingBlendshapes(blendshapes: ReferenceBlendshape[]) {
  if (blendshapes.length === 0) {
    return "all"
  }

  const missing = getMissingBlendshapeKeys(blendshapes)
  return missing.length === 0 ? "-" : missing.join(" / ")
}

function roundForState(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return value
  }

  return Math.round(value * 1000) / 1000
}

function roundMetricForState(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return value
  }

  return Math.round(value * 10000) / 10000
}

function roundPose(pose: ReferencePose) {
  return {
    yaw: roundForState(pose.yaw),
    pitch: roundForState(pose.pitch),
    roll: roundForState(pose.roll),
  }
}

function roundLandmark(landmark: ReferenceLandmark) {
  return {
    index: landmark.index,
    x: roundForState(landmark.x),
    y: roundForState(landmark.y),
    z: roundForState(landmark.z),
  }
}

function roundCurrentMeshLandmarkVertex(vertex: CurrentMeshLandmarkVertex) {
  return {
    id: vertex.id,
    kind: vertex.kind,
    index: vertex.index,
    source: roundPoint(vertex.source),
    visibilityWeight: roundMetricForState(vertex.visibilityWeight),
    safetyWeight: roundMetricForState(vertex.safetyWeight),
    usageWeight: roundMetricForState(vertex.usageWeight),
    reasons: vertex.reasons,
  }
}

function roundMeshVertexPair(pair: MeshVertexPair) {
  return {
    id: pair.id,
    kind: pair.kind,
    index: pair.index,
    source: roundPoint(pair.source),
    target: roundPoint(pair.target),
    distanceNormalized: roundMetricForState(pair.distanceNormalized),
    distanceAspectCorrected: roundMetricForState(pair.distanceAspectCorrected),
    usageWeight: roundMetricForState(pair.usageWeight),
    reasons: pair.reasons,
  }
}

function roundDynamicGridDebug(debug: DynamicGridDebug) {
  return {
    mode: debug.mode,
    nearFaceGridMode: debug.nearFaceGridMode,
    acceptedFaceLandmarkCount: debug.acceptedFaceLandmarkCount,
    faceMedianNearestDistance: roundMetricForState(debug.faceMedianNearestDistance),
    faceNearestDistanceSampleCount: debug.faceNearestDistanceSampleCount,
    nearFaceGridSpacing: roundMetricForState(debug.nearFaceGridSpacing),
    backgroundGridSpacing: roundMetricForState(debug.backgroundGridSpacing),
    screenEdgeAnchorSpacing: roundMetricForState(debug.screenEdgeAnchorSpacing),
    nearFaceGridSpacingRatioToFaceMedian: roundMetricForState(
      debug.nearFaceGridSpacingRatioToFaceMedian,
    ),
    backgroundGridSpacingRatioToFaceMedian: roundMetricForState(
      debug.backgroundGridSpacingRatioToFaceMedian,
    ),
    faceOnlyTriangleCount: debug.faceOnlyTriangleCount,
    faceInteriorTestTriangleCount: debug.faceInteriorTestTriangleCount,
    nearFaceCandidateGridCount: debug.nearFaceCandidateGridCount,
    nearFaceRemovedInsideFaceCount: debug.nearFaceRemovedInsideFaceCount,
    nearFaceRemovedTooCloseToFaceCount: debug.nearFaceRemovedTooCloseToFaceCount,
    nearFaceAcceptedGridCount: debug.nearFaceAcceptedGridCount,
    tooCloseToFaceThreshold: roundMetricForState(debug.tooCloseToFaceThreshold),
    nearFaceGridCount: debug.nearFaceGridCount,
    backgroundGridCount: debug.backgroundGridCount,
    screenEdgeAnchorCount: debug.screenEdgeAnchorCount,
    faceBounds: roundBoundsDebugSummary(debug.faceBounds),
    expandedNearFaceBounds: roundBoundsDebugSummary(debug.expandedNearFaceBounds),
    videoAspectRatio: roundMetricForState(debug.videoAspectRatio),
    nearFaceGrid: {
      mode: debug.nearFaceGrid.mode,
      candidateGridCount: debug.nearFaceGrid.candidateGridCount,
      removedInsideFaceCount: debug.nearFaceGrid.removedInsideFaceCount,
      removedTooCloseToFaceCount: debug.nearFaceGrid.removedTooCloseToFaceCount,
      acceptedGridCount: debug.nearFaceGrid.acceptedGridCount,
      tooCloseToFaceThreshold: roundMetricForState(
        debug.nearFaceGrid.tooCloseToFaceThreshold,
      ),
      gridPointPreview: debug.nearFaceGrid.gridPointPreview.map(roundDynamicGridPointPreview),
    },
    faceInterior: {
      faceOnlyTriangleCount: debug.faceInterior.faceOnlyTriangleCount,
      faceInteriorTestTriangleCount: debug.faceInterior.faceInteriorTestTriangleCount,
      preview: debug.faceInterior.preview.map((triangle) => ({
        indices: triangle.indices,
        area: roundMetricForState(triangle.area),
      })),
    },
    gridPointPreview: debug.gridPointPreview.map((point) => ({
      ...roundDynamicGridPointPreview(point),
    })),
  }
}

function roundDynamicGridPointPreview(point: DynamicGridPointPreview) {
  return {
    id: point.id,
    kind: point.kind,
    x: roundForState(point.x),
    y: roundForState(point.y),
    reasons: point.reasons,
  }
}

function roundTriangleMeshDebug(debug: TriangleMeshDebug) {
  return {
    mode: debug.mode,
    vertexCount: debug.vertexCount,
    triangleCount: debug.triangleCount,
    validTriangleCount: debug.validTriangleCount,
    warningTriangleCount: debug.warningTriangleCount,
    excludedTriangleCount: debug.excludedTriangleCount,
    triangleKindCounts: debug.triangleKindCounts,
    triangleQuality: debug.triangleQuality,
    triangleArea: roundMetricRange(debug.triangleArea),
    triangleAspectRatio: roundMetricRange(debug.triangleAspectRatio),
    trianglePreview: debug.trianglePreview.map(roundTriangleMeshTriangle),
  }
}

function roundTriangleMeshTriangle(triangle: TriangleMeshTriangle) {
  return {
    indices: triangle.indices,
    kind: triangle.kind,
    area: roundMetricForState(triangle.area),
    aspectRatio: roundMetricForState(triangle.aspectRatio),
    warnings: triangle.warnings,
  }
}

function roundWebglMeshWarpInputDebug(debug: WebglMeshWarpInputDebug) {
  return {
    mode: debug.mode,
    webglInputReady: debug.webglInputReady,
    vertexCount: debug.vertexCount,
    sourceVertexCount: debug.sourceVertexCount,
    targetVertexCount: debug.targetVertexCount,
    triangleCount: debug.triangleCount,
    indexCount: debug.indexCount,
    sourceUvConvention: debug.sourceUvConvention,
    targetPositionConvention: debug.targetPositionConvention,
    sourceUvSummary: {
      uRange: roundMinMaxRange(debug.sourceUvSummary.uRange),
      vRange: roundMinMaxRange(debug.sourceUvSummary.vRange),
      outOfRangeUvCount: debug.sourceUvSummary.outOfRangeUvCount,
      sourceUvInRange: debug.sourceUvSummary.sourceUvInRange,
    },
    targetPositionSummary: {
      imageXRange: roundMinMaxRange(debug.targetPositionSummary.imageXRange),
      imageYRange: roundMinMaxRange(debug.targetPositionSummary.imageYRange),
      clipXRange: roundMinMaxRange(debug.targetPositionSummary.clipXRange),
      clipYRange: roundMinMaxRange(debug.targetPositionSummary.clipYRange),
      outOfRangeTargetCount: debug.targetPositionSummary.outOfRangeTargetCount,
      outOfRangeClipCount: debug.targetPositionSummary.outOfRangeClipCount,
      targetImagePositionInRange:
        debug.targetPositionSummary.targetImagePositionInRange,
      targetClipPositionInRange: debug.targetPositionSummary.targetClipPositionInRange,
    },
    indexSummary: debug.indexSummary,
    coordinateSummary: debug.coordinateSummary,
    preview: debug.preview.map(roundWebglMeshWarpInputPreviewItem),
    indexPreview: debug.indexPreview,
    warnings: debug.warnings,
    warningCount: debug.warningCount,
  }
}

function roundWebglPreviewRuntimeDebug(debug: WebglPreviewRuntimeDebug) {
  return {
    webglPreviewEnabled: debug.webglPreviewEnabled,
    webglPreviewStatus: debug.webglPreviewStatus,
    webglPreviewError: debug.webglPreviewError,
    webglCanvasSize: debug.webglCanvasSize,
    videoTextureReady: debug.videoTextureReady,
    lastDrawTimestampMs: roundMetricForState(debug.lastDrawTimestampMs),
    drawCallCount: debug.drawCallCount,
    lastDrawTriangleCount: debug.lastDrawTriangleCount,
    lastDrawIndexCount: debug.lastDrawIndexCount,
    textureVMode: debug.textureVMode,
    fallbackReason: debug.fallbackReason,
  }
}

function roundWebglMeshWarpInputPreviewItem(item: WebglMeshWarpInputPreviewItem) {
  return {
    vertexIndex: item.vertexIndex,
    source: roundPoint(item.source),
    target: item.target ? roundPoint(item.target) : null,
    uv: {
      u: roundForState(item.uv.u),
      v: roundForState(item.uv.v),
    },
    clip: item.clip ? roundPoint(item.clip) : null,
    kind: item.kind,
  }
}

function roundPoint(point: Point2D) {
  return {
    x: roundForState(point.x),
    y: roundForState(point.y),
  }
}

function roundMetricRange(range: TriangleMetricRange) {
  return {
    min: roundMetricForState(range.min),
    median: roundMetricForState(range.median),
    max: roundMetricForState(range.max),
  }
}

function roundMinMaxRange(range: MetricMinMaxRange) {
  return {
    min: roundMetricForState(range.min),
    max: roundMetricForState(range.max),
  }
}

function roundBoundsDebugSummary(bounds: BoundsDebugSummary | null) {
  if (!bounds) {
    return null
  }

  return {
    minX: roundForState(bounds.minX),
    maxX: roundForState(bounds.maxX),
    minY: roundForState(bounds.minY),
    maxY: roundForState(bounds.maxY),
    width: roundForState(bounds.width),
    height: roundForState(bounds.height),
    aspect: roundMetricForState(bounds.aspect),
  }
}

function roundCoordinateBoundsDebug(debug: CoordinateBoundsDebug) {
  return {
    normalized: roundBoundsDebugSummary(debug.normalized),
    aspectCorrected: roundBoundsDebugSummary(debug.aspectCorrected),
  }
}

function roundMeshAlignmentDebug(debug: MeshAlignmentDebug | null) {
  if (!debug) {
    return null
  }

  return {
    videoAspectRatio: roundMetricForState(debug.videoAspectRatio),
    idealVideoAspectRatio: roundMetricForState(debug.idealVideoAspectRatio),
    currentVideoAspectRatio: roundMetricForState(debug.currentVideoAspectRatio),
    idealBoundsAspectCorrected: roundBoundsDebugSummary(debug.idealBoundsAspectCorrected),
    currentBoundsAspectCorrected: roundBoundsDebugSummary(debug.currentBoundsAspectCorrected),
    scale: roundMetricForState(debug.scale),
    idealCenterAspectCorrected: roundPoint(debug.idealCenterAspectCorrected),
    currentCenterAspectCorrected: roundPoint(debug.currentCenterAspectCorrected),
  }
}

function roundMeshAspectDebug(debug: MeshAspectDebug) {
  return {
    videoAspectRatio: roundMetricForState(debug.videoAspectRatio),
    modelVideoAspectRatio: roundMetricForState(debug.modelVideoAspectRatio),
    liveVideoAspectRatio: roundMetricForState(debug.liveVideoAspectRatio),
    alignment: roundMeshAlignmentDebug(debug.alignment),
    bounds: {
      currentLandmarks: roundCoordinateBoundsDebug(debug.bounds.currentLandmarks),
      top1RawIdealReferenceLandmarks: roundCoordinateBoundsDebug(
        debug.bounds.top1RawIdealReferenceLandmarks,
      ),
      candidateAlignedIdealLandmarks: roundCoordinateBoundsDebug(
        debug.bounds.candidateAlignedIdealLandmarks,
      ),
      acceptedCurrentMeshSourceFaceLandmarks: roundCoordinateBoundsDebug(
        debug.bounds.acceptedCurrentMeshSourceFaceLandmarks,
      ),
      idealMeshTargetFaceLandmarks: roundCoordinateBoundsDebug(
        debug.bounds.idealMeshTargetFaceLandmarks,
      ),
    },
  }
}

function getFrameIndex(currentTimeSec: number) {
  return Math.max(0, Math.round(currentTimeSec / FRAME_STEP_SEC))
}

function getAcceptedFrames() {
  return state.rawIdealReferenceFrames.filter((frame) => !frame.excluded)
}

function hasAcceptedFrames() {
  return state.modelScan.acceptedFrames > 0
}

function getCurrentAcceptedFrame() {
  const acceptedFrames = getAcceptedFrames()
  const index = state.currentAcceptedReviewIndex
  return index === null ? null : acceptedFrames[index] ?? null
}

function getMatchedIdealFrame() {
  const frameId = state.top1Match.idealFrameId
  return frameId === null
    ? null
    : state.rawIdealReferenceFrames.find((frame) => frame.frameId === frameId) ?? null
}

function canMoveModel(delta: number) {
  if (!state.modelVideo.loaded) {
    return false
  }

  if (!hasAcceptedFrames()) {
    return true
  }

  const nextIndex = (state.currentAcceptedReviewIndex ?? 0) + delta
  return nextIndex >= 0 && nextIndex < state.modelScan.acceptedFrames
}

function getReferenceLibraryStats() {
  const acceptedFrames = getAcceptedFrames()
  return {
    poseAvailableCount: acceptedFrames.filter(
      (frame) => frame.pose.yaw !== null && frame.pose.pitch !== null && frame.pose.roll !== null,
    ).length,
    blendshapesAvailableCount: acceptedFrames.filter((frame) => frame.blendshapes.length > 0).length,
    expressionDistribution: countBy(acceptedFrames.map((frame) => frame.expressionGroup)),
    landmarkCountSummary: countBy(
      state.rawIdealReferenceFrames.map((frame) => String(frame.landmarks478.length)),
    ),
  }
}

function getPreviewTabLabel(tab: PreviewTab) {
  return previewTabs.find((option) => option.value === tab)?.label ?? tab
}

function setDisabled(selector: string, disabled: boolean) {
  getElement<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>(selector).disabled =
    disabled
}

function setText(selector: string, text: string) {
  getElement<HTMLElement>(selector).textContent = text
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1
    return counts
  }, {})
}

function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

function seekVideoElement(videoElement: HTMLVideoElement, timeSec: number) {
  return new Promise<void>((resolve) => {
    if (Math.abs(videoElement.currentTime - timeSec) < 0.0005) {
      resolve()
      return
    }

    let timeoutId: number | null = null
    const onSeeked = () => {
      videoElement.removeEventListener("seeked", onSeeked)
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
      resolve()
    }
    videoElement.addEventListener("seeked", onSeeked)
    timeoutId = window.setTimeout(onSeeked, 1200)
    videoElement.currentTime = timeSec
  })
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function cleanup() {
  stopWebglPreviewLoop()
  disposeWebglMeshWarpPreviewRenderer()
  revokeObjectUrls()
  disposeModelFaceLandmarker("disposed")
  disposeLiveFaceLandmarker("disposed")
}

function revokeObjectUrls() {
  if (state.modelVideo.objectUrl) {
    URL.revokeObjectURL(state.modelVideo.objectUrl)
    state.modelVideo.objectUrl = null
  }

  if (state.liveVideo.objectUrl) {
    URL.revokeObjectURL(state.liveVideo.objectUrl)
    state.liveVideo.objectUrl = null
  }
}

function getElement<TElement extends Element>(selector: string) {
  const element = app.querySelector<TElement>(selector)

  if (!element) {
    throw new Error(`${selector} が見つかりません。`)
  }

  return element
}

function isPreviewTab(value: string | undefined): value is PreviewTab {
  return value === "model" || value === "live"
}

function isDebugTab(value: string | undefined): value is DebugTab {
  return debugTabs.some((tab) => tab.value === value)
}
