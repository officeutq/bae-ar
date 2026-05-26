import {
  DEFAULT_LANDMARK_GROUPS_V1,
  NATURAL_IDEAL_FACE_PRESET,
  type FaceLandmark,
  type FacePose,
  type LandmarkGroup,
  type LandmarkGroups,
} from "@bae-ar/engine"
import {
  FaceLandmarker,
  FilesetResolver,
  type Matrix,
} from "@mediapipe/tasks-vision"

const idealFace = NATURAL_IDEAL_FACE_PRESET
const app = document.querySelector<HTMLDivElement>("#app")
const MAX_EXTRACTED_FRAME_COUNT = 20
const DETAILED_SCAN_INTERVAL_SEC = 0.1
const MAX_DETAILED_SCAN_FRAME_COUNT = 150
const THUMBNAIL_WIDTH = 180
const ANALYSIS_MAX_WIDTH = 640
const EMPTY_FACE_POSE: FacePose = {
  pitch: 0,
  yaw: 0,
  roll: 0,
}
const RAD_TO_DEG = 180 / Math.PI
const LEFT_EYE_OUTER_INDEX = 263
const RIGHT_EYE_OUTER_INDEX = 33
const NOSE_TIP_INDEX = 4
const MOUTH_CENTER_INDICES = [13, 14]
const REQUIRED_LANDMARK_COUNT = 478
const FRONT_POSE_LIMIT = {
  yaw: 12,
  pitch: 12,
  roll: 9,
}
const DIRECTIONAL_POSE_LIMIT = {
  yaw: 24,
  pitch: 24,
  roll: 14,
}
const YAW_CANDIDATE_MIN_ABS = 6
const PITCH_CANDIDATE_MIN_ABS = 5
const INFERENCE_DATASET_LANDMARK_PREVIEW_COUNT = 5
const IDEAL_LANDMARKS_3D_PREVIEW_COUNT = 5
const IDEAL_FACE_ASSET_SCHEMA_VERSION = "ideal_face_asset_v1"
const IDEAL_FACE_ASSET_NAME = "Custom IdealFace"
const IDEAL_FACE_ASSET_VERSION = "0.1.0"
const IDEAL_FACE_ASSET_TOOL = "ideal-face-authoring"
const IDEAL_FACE_ASSET_LANDMARK_TOPOLOGY =
  "mediapipe_face_landmarker_478"
const IDEAL_FACE_ASSET_COORDINATE_SPACE =
  "bae_ar_ideal_landmarks3d_v1"
const COORDINATE_NORMALIZATION_MODE = "video_aspect_same_unit_v1"
const POINT_CLOUD_PREVIEW_PADDING = 24
const POINT_CLOUD_DEPTH_DISPLAY_SCALE = 1.0
const POINT_CLOUD_MIN_ZOOM = 0.3
const POINT_CLOUD_MAX_ZOOM = 5
const POINT_CLOUD_ROTATION_SENSITIVITY = 0.01
const POINT_CLOUD_ZOOM_SENSITIVITY = 0.001
const POINT_CLOUD_MAX_PITCH = (Math.PI * 89) / 180
const LANDMARK_GROUP_EDITOR_GROUP_IDS = [
  "mouth",
  "left_eye",
  "right_eye",
  "face_boundary",
] as const
const LANDMARK_GROUP_EDITOR_FUTURE_GROUP_IDS = [
  "skin",
  "lip",
  "cheek",
  "eye_area",
] as const
const LANDMARK_GROUP_EDITOR_PREVIEW_INDICES_COUNT = 48
const LANDMARK_GROUP_EDITOR_CANVAS_PADDING = 28
const LANDMARK_GROUP_EDITOR_HIT_RADIUS_PX = 9
const LANDMARK_GROUP_EDITOR_MIN_DRAG_DISTANCE_PX = 4
const POSE_AWARE_MIN_OBSERVATION_FRAME_COUNT = 5
const POSE_AWARE_MIN_YAW_OR_PITCH_RANGE = 10
const POSE_AWARE_YAW_COVERAGE_OK_RANGE = 15
const POSE_AWARE_PITCH_COVERAGE_OK_RANGE = 10
const POSE_AWARE_WEIGHT_POSE_STRENGTH_NORMALIZER = 20
const POSE_AWARE_WEIGHT_ROLL_PENALTY_DEG = 20
const POSE_AWARE_MIN_SCORE_WEIGHT = 0.2
const POSE_AWARE_ROLL_WARNING_ABS_DEG = 15
const MIXED_POSE_MIN_ABS_DEG = 8
const POSE_AWARE_DATASET_FRAME_PREVIEW_COUNT = 3
const POSE_AWARE_Z_MIN_COMPONENT_DEG = 5
const POSE_AWARE_Z_HINT_CLAMP = 0.35
const POSE_AWARE_LOW_CONFIDENCE_THRESHOLD = 0.45
const EXPRESSION_FRAME_PREVIEW_COUNT = 8
const EXPRESSION_GROUP_IDS = [
  "mouthPucker",
  "jawOpen",
  "mouthSmile",
  "eyeBlinkLeft",
  "eyeBlinkRight",
  "eyeSquintLeft",
  "eyeSquintRight",
] as const
const FRAME_EXPRESSION_GROUP_IDS = [
  "none",
  ...EXPRESSION_GROUP_IDS,
  "mixedExpression",
] as const
const EXCLUDED_REASON_IDS = [
  "manual",
  "noFace",
  "invalidLandmarks",
] as const
const WARNING_REASON_IDS = [
  "missingBlendshapes",
  "poseOutOfRange",
  "mixedExpression",
  "pending",
] as const
const EXPRESSION_GROUPING_THRESHOLDS = {
  expression: {
    mouthPuckerMin: 0.5,
    jawOpenMin: 0.5,
    mouthSmileMin: 0.5,
    eyeBlinkMin: 0.5,
    eyeSquintMin: 0.5,
  },
  pose: {
    maxAbsYaw: 15,
    maxAbsPitch: 20,
    maxAbsRoll: 10,
  },
} as const
const EXPRESSION_GROUPING_MIXED_WARNING_RATIO = 0.3
const DEFAULT_POINT_CLOUD_CAMERA: PointCloudPreviewCamera = {
  yaw: 0,
  pitch: 0,
  zoom: 1,
  panX: 0,
  panY: 0,
}

type FrameAnalysisStatus =
  | "pending"
  | "analyzing"
  | "analyzed"
  | "no_face"
  | "error"

interface FrameAnalysisResult {
  detected: boolean
  landmarks: FaceLandmark[]
  blendshapes: BlendshapeScore[]
  pose: FacePose
  errorMessage: string | null
  analyzedAt: number
}

interface BlendshapeScore {
  categoryName: string
  displayName: string
  score: number
}

interface ExtractedVideoFrame {
  index: number
  timestamp: number
  status: FrameAnalysisStatus
  thumbnailUrl: string
  analysisImageUrl: string
  extractionTimeMs: number
  analysis?: FrameAnalysisResult
}

interface LandmarkPreviewPoint {
  index: number
  x: number
  y: number
  z: number
}

interface IdealLandmarks3DFrameSelection {
  frontReferenceFrameIds: string[]
  excludedFrameIds: string[]
}

type FrameExpressionGroup = (typeof FRAME_EXPRESSION_GROUP_IDS)[number]

type ExcludedReason = (typeof EXCLUDED_REASON_IDS)[number]

type WarningReason = (typeof WARNING_REASON_IDS)[number]

interface AuthoringFrameUsage {
  frameId: string
  frontReference: boolean
  useForInference: boolean
  expressionGroup: FrameExpressionGroup
  autoExpressionGroup: FrameExpressionGroup
  excluded: boolean
  excludedReason?: ExcludedReason
  warningReasons: WarningReason[]
}

type PoseAwareInferenceDatasetStatus =
  | "missing_front_reference"
  | "warning"
  | "ready"

type PoseAwareInferenceStatus = PoseAwareInferenceDatasetStatus

interface PoseAwareObservationFrame {
  frameId: string
  frameIndex: number
  timestamp: number
  landmarksCount: number
  pose: FacePose
  score: number | null
  thumbnailUrl: string
  role: "front_reference" | "observation"
  usage: AuthoringFrameUsage
}

type PoseAwareCoverageStatus = "insufficient" | "ok"

interface PoseAwarePoseCoverageAxis {
  min: number | null
  max: number | null
  range: number
  status: PoseAwareCoverageStatus
}

interface PoseAwarePoseCoverageRollAxis {
  min: number | null
  max: number | null
  range: number
}

interface PoseAwarePoseCoverage {
  yaw: PoseAwarePoseCoverageAxis
  pitch: PoseAwarePoseCoverageAxis
  roll: PoseAwarePoseCoverageRollAxis
  mixedPoseFrameCount: number
}

interface PoseAwareInferenceFrame {
  frameId: string
  timestamp: number
  role: "front_reference" | "observation"
  pose: {
    yaw: number
    pitch: number
    roll: number
  }
  poseStrength: number
  weight: number
  score?: number
  landmarkCount: number
  landmarkPreview: LandmarkPreviewPoint[]
  landmarks: FaceLandmark[]
}

interface PoseAwareInferenceDataset {
  status: PoseAwareInferenceDatasetStatus
  frontReferenceFrames: PoseAwareInferenceFrame[]
  observationFrames: PoseAwareInferenceFrame[]
  excludedFrameCount: number
  poseCoverage: PoseAwarePoseCoverage
  warnings: string[]
}

interface PoseAwareBasePoint {
  index: number
  x: number
  y: number
}

interface Point2D {
  x: number
  y: number
}

interface LandmarkBoundsSummary {
  pointCount: number
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  zMin?: number
  zMax?: number
  width: number
  height: number
  zRange?: number
  aspectRatio: number | null
}

interface VideoAspectSummary {
  width: number | null
  height: number | null
  aspectRatio: number | null
}

interface CoordinateNormalizationSummary {
  mode: typeof COORDINATE_NORMALIZATION_MODE
  xScale: number
  yScale: number
  videoAspectRatio: number | null
  fallbackUsed: boolean
  appliedBeforeRollCorrection: true
  appliedBeforeZInference: true
}

interface CoordinateAspectComparison {
  videoAspectRatio: number | null
  rawImageNormalizedFrontReferenceBaseAspectRatio: number | null
  rawRollCorrectedFrontReferenceBaseAspectRatio: number | null
  sameUnitFrontReferenceBaseAspectRatio: number | null
  sameUnitCandidateAspectRatio: number | null
  estimatedLegacyCandidateAspectRatioBeforeNormalization: number | null
}

interface PoseAwareCorrectedLandmark2D {
  index: number
  x: number
  y: number
}

interface PoseAwareZHint {
  value: number
  weight: number
  source: "yaw" | "pitch"
  frameId: string
}

interface PoseAwareMultiFrameSummary {
  status: PoseAwareInferenceStatus
  frontReferenceFrameCount: number
  selectedFrontReferenceFrameCount: number
  usableObservationFrameCount: number
  excludedFrameCount: number
  poseRange: {
    yaw: NumberRange | null
    pitch: NumberRange | null
    roll: NumberRange | null
  }
  warnings: string[]
  frontReferenceFrameIds: string[]
  excludedFrameIds: string[]
}

type IdealLandmarks3DCandidateStatus =
  | "not_ready"
  | "generated"
  | "insufficient_data"
  | "error"

type IdealLandmarks3DGenerationMethod = "pose_aware_weighted_z_v1"

type PointCloudPreviewPreset = "front" | "side" | "top" | "reset"

type PointCloudDragMode = "rotate" | "pan"

type PointCloudPreviewCamera = {
  yaw: number
  pitch: number
  zoom: number
  panX: number
  panY: number
}

interface PointCloudDragState {
  pointerId: number
  lastX: number
  lastY: number
  mode: PointCloudDragMode
}

interface PointCloudPreviewPoint {
  x: number
  y: number
  z: number
}

interface IdealLandmark3DCandidate {
  index: number
  x: number
  y: number
  z: number
  confidence: number
  source: "pose_aware_weighted_z_v1"
}

interface IdealLandmarks3DCandidateResult {
  status: IdealLandmarks3DCandidateStatus
  generationMethod: IdealLandmarks3DGenerationMethod | null
  landmarkCount: number
  landmarks: IdealLandmark3DCandidate[]
  landmarksPreview: IdealLandmark3DCandidate[]
  summary: {
    generatedCount: number
    averageConfidence: number
    minConfidence: number
    maxConfidence: number
    zMin: number
    zMax: number
    zAverage: number
    lowConfidenceLandmarkCount: number
    frontReferenceFrameCount: number
    observationFrameCount: number
    excludedFrameCount: number
  }
  message: string | null
}

interface IdealFaceAssetV1 {
  schemaVersion: typeof IDEAL_FACE_ASSET_SCHEMA_VERSION
  id: string
  name: typeof IDEAL_FACE_ASSET_NAME
  version: typeof IDEAL_FACE_ASSET_VERSION
  createdAt: string
  source: {
    tool: typeof IDEAL_FACE_ASSET_TOOL
    generationMethod: IdealLandmarks3DGenerationMethod
  }
  model: {
    landmarkTopology: typeof IDEAL_FACE_ASSET_LANDMARK_TOPOLOGY
    coordinateSpace: typeof IDEAL_FACE_ASSET_COORDINATE_SPACE
    idealLandmarks3D: Array<{
      index: number
      x: number
      y: number
      z: number
      confidence: number
    }>
  }
  landmarkGroups?: LandmarkGroups
  metadata: {
    frontReferenceFrameCount: number
    observationFrameCount: number
    excludedFrameCount: number
    z: {
      min: number
      max: number
      average: number
    }
    confidence: {
      average: number
      min: number
      max: number
      lowConfidenceLandmarkCount: number
    }
  }
}

type LandmarkGroupEditorGroupId =
  (typeof LANDMARK_GROUP_EDITOR_GROUP_IDS)[number]

type LandmarkGroupEditorSelectionMode = "click" | "rectangle"

interface LandmarkGroupEditorRangeSelection {
  startX: number
  startY: number
  endX: number
  endY: number
}

interface LandmarkGroupEditorState {
  selectedGroupId: LandmarkGroupEditorGroupId
  selectionMode: LandmarkGroupEditorSelectionMode
  rangeSelection: LandmarkGroupEditorRangeSelection | null
  highlightedIndexInput: string
  groups: LandmarkGroups
}

interface LandmarkGroupEditorCanvasPoint {
  index: number
  x: number
  y: number
}

interface LandmarkGroupEditorIndexSummary {
  indices: number[]
  count: number
  alreadyInSelectedGroupCount: number
  notInSelectedGroupCount: number
}

interface LandmarkGroupEditorHighlightSummary
  extends LandmarkGroupEditorIndexSummary {
  extractedCount: number
  invalidCount: number
  invalidIndicesPreview: number[]
}

interface LandmarkGroupEditorDragState {
  pointerId: number
  startX: number
  startY: number
  currentX: number
  currentY: number
}

interface IdealFaceAssetExportSummary {
  schemaVersion: typeof IDEAL_FACE_ASSET_SCHEMA_VERSION
  generationMethod: IdealLandmarks3DGenerationMethod
  landmarkCount: number
  canExport: boolean
  fileName: string
  includedLandmarkCount: number
  disabledReason: string | null
}

interface NumberRange {
  min: number
  max: number
}

interface PointCloudPreviewSummary {
  landmarkCount: number
  xRange: NumberRange | null
  yRange: NumberRange | null
  zRange: NumberRange | null
  width: number
  height: number
  aspectRatio: number | null
  averageConfidence: number
  minConfidence: number
  maxConfidence: number
}

interface DetailedScanSummary {
  scanIntervalSec: number
  maxScanFrames: number
  scannedFrameCount: number
  analyzedFrameCount: number
  detectedFrameCount: number
  candidateSourceFrameCount: number
}

type ExpressionGroupId = (typeof EXPRESSION_GROUP_IDS)[number]

type ExpressionGroupingStatus = "ready" | "not_available"

interface ExpressionFramePreview {
  frameId: string
  timestamp: number
}

interface ExpressionGroupFrameSummary {
  id: ExpressionGroupId
  frameCount: number
  frames: ExpressionFramePreview[]
}

interface ExpressionGroupingSummary {
  status: ExpressionGroupingStatus
  source: "detailed_scan_frames"
  sourceFrameCount: number
  noneExpressionFrameCount: number
  noneExpressionFrames: ExpressionFramePreview[]
  expressionGroups: ExpressionGroupFrameSummary[]
  mixedExpressionFrameCount: number
  mixedExpressionFrames: ExpressionFramePreview[]
  excludedFrameCount: number
  excludedFrames: ExpressionFramePreview[]
  excludedBreakdown: {
    noFaceFrameCount: number
    invalidLandmarkFrameCount: number
  }
  warningBreakdown: {
    missingBlendshapeFrameCount: number
    extremePoseFrameCount: number
    pendingFrameCount: number
    mixedExpressionFrameCount: number
  }
  step2IExcludedFrameCount: number
  warnings: string[]
}

interface FrameUsageSummary {
  sourceFrameCount: number
  frontReferenceCount: number
  useForInferenceCount: number
  expressionGroupCounts: Record<FrameExpressionGroup, number>
  excludedCount: number
  excludedReasonCounts: Record<ExcludedReason, number>
  warningReasonCounts: Record<WarningReason, number>
  framePreview: Array<{
    frameId: string
    frontReference: boolean
    useForInference: boolean
    expressionGroup: FrameExpressionGroup
    autoExpressionGroup: FrameExpressionGroup
    excluded: boolean
    excludedReason?: ExcludedReason
    warningReasons: WarningReason[]
  }>
}

interface VideoSourceState {
  fileName: string
  objectUrl: string
  duration: number | null
  videoWidth: number | null
  videoHeight: number | null
  extractedFrames: ExtractedVideoFrame[]
  isExtracting: boolean
  isAnalyzing: boolean
  analysisError: string | null
  error: string | null
  scanSummary: DetailedScanSummary
  detailedScanFrames: ExtractedVideoFrame[]
}

let videoSource: VideoSourceState | null = null
let faceLandmarker: FaceLandmarker | null = null
let faceLandmarkerInitialization: Promise<FaceLandmarker> | null = null
let authoringFrameUsages: Record<string, AuthoringFrameUsage> = {}
let frameReviewIndex = 0
let idealLandmarks3DCandidateResult: IdealLandmarks3DCandidateResult =
  createInitialIdealLandmarks3DCandidateResult()
let landmarkGroupEditorState: LandmarkGroupEditorState =
  createInitialLandmarkGroupEditorState()
let landmarkGroupEditorDragState: LandmarkGroupEditorDragState | null = null
let pointCloudPreviewCamera: PointCloudPreviewCamera = {
  ...DEFAULT_POINT_CLOUD_CAMERA,
}
let pointCloudDragState: PointCloudDragState | null = null
const extractionVideo = document.createElement("video")
const analysisCanvas = document.createElement("canvas")
const thumbnailCanvas = document.createElement("canvas")

if (!app) {
  throw new Error("IdealFace Authoring Tool app root was not found")
}

const appRoot = app

extractionVideo.muted = true
extractionVideo.playsInline = true
extractionVideo.preload = "metadata"

function formatNumber(value: number): string {
  return value.toFixed(3)
}

function formatOptionalNumber(value: number | null | undefined): string {
  return value === null || value === undefined ? "なし" : formatNumber(value)
}

function formatSeconds(value: number | null): string {
  return value === null ? "未読み込み" : `${value.toFixed(1)}s`
}

function formatPixels(
  width: number | null,
  height: number | null,
): string {
  return width === null || height === null ? "未読み込み" : `${width} x ${height}`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function formatFrameAnalysisStatus(status: FrameAnalysisStatus): string {
  const labels: Record<FrameAnalysisStatus, string> = {
    pending: "未解析",
    analyzing: "解析中",
    analyzed: "解析済み",
    no_face: "顔検出なし",
    error: "解析エラー",
  }

  return labels[status]
}

function formatScore(value: number): string {
  return value.toFixed(2)
}

function renderVideoMetadata(): string {
  const fileName = videoSource?.fileName ?? "未選択"
  const duration = videoSource?.duration ?? null
  const videoWidth = videoSource?.videoWidth ?? null
  const videoHeight = videoSource?.videoHeight ?? null
  const videoAspect = getVideoAspectSummary().aspectRatio

  return `
    <dl>
      <div>
        <dt>選択中の動画</dt>
        <dd>${escapeHtml(fileName)}</dd>
      </div>
      <div>
        <dt>動画の長さ</dt>
        <dd>${formatSeconds(duration)}</dd>
      </div>
      <div>
        <dt>動画サイズ</dt>
        <dd>${formatPixels(videoWidth, videoHeight)}</dd>
      </div>
      <div>
        <dt>video aspect ratio</dt>
        <dd>${formatOptionalNumber(videoAspect)}</dd>
      </div>
    </dl>
  `
}

function renderVideoPreview(): string {
  if (!videoSource?.objectUrl) {
    return `
      <div class="video-empty">
        <p>MP4 動画を選択すると、メタデータと抽出フレームがここに表示されます。</p>
      </div>
    `
  }

  return `
    <video class="video-preview" src="${escapeHtml(videoSource.objectUrl)}" controls muted playsinline></video>
  `
}

function renderExtractionStatus(): string {
  if (!videoSource) {
    return "動画は未選択です。"
  }

  if (videoSource.error) {
    return videoSource.error
  }

  if (videoSource.isExtracting) {
    return "フレーム抽出中です。"
  }

  if (videoSource.extractedFrames.length === 0) {
    return "metadata 読み込み後にフレームを抽出します。"
  }

  return "フレーム抽出が完了しました。"
}

interface AnalysisSummary {
  extractedFrameCount: number
  analyzedFrameCount: number
  detectedFrameCount: number
  noFaceFrameCount: number
  failedFrameCount: number
  pitchRange: { min: number; max: number } | null
  yawRange: { min: number; max: number } | null
  rollRange: { min: number; max: number } | null
}

function getAnalysisSummary(): AnalysisSummary {
  const frames = videoSource?.extractedFrames ?? []
  const analyzedFrames = frames.filter((frame) =>
    ["analyzed", "no_face", "error"].includes(frame.status),
  )
  const detectedFrames = frames.filter((frame) => frame.analysis?.detected)
  const noFaceFrames = frames.filter((frame) => frame.status === "no_face")
  const failedFrames = frames.filter((frame) => frame.status === "error")

  return {
    extractedFrameCount: frames.length,
    analyzedFrameCount: analyzedFrames.length,
    detectedFrameCount: detectedFrames.length,
    noFaceFrameCount: noFaceFrames.length,
    failedFrameCount: failedFrames.length,
    pitchRange: getPoseRange(detectedFrames, "pitch"),
    yawRange: getPoseRange(detectedFrames, "yaw"),
    rollRange: getPoseRange(detectedFrames, "roll"),
  }
}

function getPoseRange(
  frames: ExtractedVideoFrame[],
  key: keyof FacePose,
): { min: number; max: number } | null {
  const values = frames
    .map((frame) => frame.analysis?.pose[key])
    .filter((value): value is number => value !== undefined)

  if (values.length === 0) {
    return null
  }

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  }
}

function getDetailedScanSummary(): DetailedScanSummary {
  if (!videoSource) {
    return createEmptyDetailedScanSummary()
  }

  return videoSource.scanSummary
}

function getCandidateSourceFramesFromFrames(
  frames: ExtractedVideoFrame[],
): ExtractedVideoFrame[] {
  return frames.filter((frame) => {
    const analysis = frame.analysis

    return (
      frame.status === "analyzed" &&
      analysis?.detected === true &&
      analysis.landmarks.length === REQUIRED_LANDMARK_COUNT &&
      hasCompletePose(analysis.pose)
    )
  })
}

function createEmptyDetailedScanSummary(): DetailedScanSummary {
  return {
    scanIntervalSec: DETAILED_SCAN_INTERVAL_SEC,
    maxScanFrames: MAX_DETAILED_SCAN_FRAME_COUNT,
    scannedFrameCount: 0,
    analyzedFrameCount: 0,
    detectedFrameCount: 0,
    candidateSourceFrameCount: 0,
  }
}

function hasCompletePose(pose: FacePose | undefined): pose is FacePose {
  return (
    pose !== undefined &&
    Number.isFinite(pose.pitch) &&
    Number.isFinite(pose.yaw) &&
    Number.isFinite(pose.roll)
  )
}

function scoreFrontCandidate(pose: FacePose): number | null {
  const yawAbs = Math.abs(pose.yaw)
  const pitchAbs = Math.abs(pose.pitch)
  const rollAbs = Math.abs(pose.roll)

  if (
    yawAbs > FRONT_POSE_LIMIT.yaw ||
    pitchAbs > FRONT_POSE_LIMIT.pitch ||
    rollAbs > FRONT_POSE_LIMIT.roll
  ) {
    return null
  }

  return (
    1 -
    (yawAbs / FRONT_POSE_LIMIT.yaw +
      pitchAbs / FRONT_POSE_LIMIT.pitch +
      rollAbs / FRONT_POSE_LIMIT.roll) /
      3
  )
}

function scoreYawPositiveCandidate(pose: FacePose): number | null {
  if (
    pose.yaw < YAW_CANDIDATE_MIN_ABS ||
    Math.abs(pose.pitch) > DIRECTIONAL_POSE_LIMIT.pitch ||
    Math.abs(pose.roll) > DIRECTIONAL_POSE_LIMIT.roll
  ) {
    return null
  }

  return scoreDirectionalCandidate(
    Math.abs(pose.yaw),
    Math.abs(pose.pitch),
    Math.abs(pose.roll),
    YAW_CANDIDATE_MIN_ABS,
    DIRECTIONAL_POSE_LIMIT.pitch,
    DIRECTIONAL_POSE_LIMIT.roll,
  )
}

function scoreYawNegativeCandidate(pose: FacePose): number | null {
  if (
    pose.yaw > -YAW_CANDIDATE_MIN_ABS ||
    Math.abs(pose.pitch) > DIRECTIONAL_POSE_LIMIT.pitch ||
    Math.abs(pose.roll) > DIRECTIONAL_POSE_LIMIT.roll
  ) {
    return null
  }

  return scoreDirectionalCandidate(
    Math.abs(pose.yaw),
    Math.abs(pose.pitch),
    Math.abs(pose.roll),
    YAW_CANDIDATE_MIN_ABS,
    DIRECTIONAL_POSE_LIMIT.pitch,
    DIRECTIONAL_POSE_LIMIT.roll,
  )
}

function scorePitchPositiveCandidate(pose: FacePose): number | null {
  if (
    pose.pitch < PITCH_CANDIDATE_MIN_ABS ||
    Math.abs(pose.yaw) > DIRECTIONAL_POSE_LIMIT.yaw ||
    Math.abs(pose.roll) > DIRECTIONAL_POSE_LIMIT.roll
  ) {
    return null
  }

  return scoreDirectionalCandidate(
    Math.abs(pose.pitch),
    Math.abs(pose.yaw),
    Math.abs(pose.roll),
    PITCH_CANDIDATE_MIN_ABS,
    DIRECTIONAL_POSE_LIMIT.yaw,
    DIRECTIONAL_POSE_LIMIT.roll,
  )
}

function scorePitchNegativeCandidate(pose: FacePose): number | null {
  if (
    pose.pitch > -PITCH_CANDIDATE_MIN_ABS ||
    Math.abs(pose.yaw) > DIRECTIONAL_POSE_LIMIT.yaw ||
    Math.abs(pose.roll) > DIRECTIONAL_POSE_LIMIT.roll
  ) {
    return null
  }

  return scoreDirectionalCandidate(
    Math.abs(pose.pitch),
    Math.abs(pose.yaw),
    Math.abs(pose.roll),
    PITCH_CANDIDATE_MIN_ABS,
    DIRECTIONAL_POSE_LIMIT.yaw,
    DIRECTIONAL_POSE_LIMIT.roll,
  )
}

function scoreDirectionalCandidate(
  primaryAbs: number,
  secondaryAbs: number,
  rollAbs: number,
  primaryMinAbs: number,
  secondaryLimit: number,
  rollLimit: number,
): number {
  const primaryScore = clamp((primaryAbs - primaryMinAbs) / 30, 0, 1)
  const secondaryScore = 1 - clamp(secondaryAbs / secondaryLimit, 0, 1)
  const rollScore = 1 - clamp(rollAbs / rollLimit, 0, 1)

  return primaryScore * 0.7 + secondaryScore * 0.18 + rollScore * 0.12
}

function resetAuthoringFrameUsages(): void {
  authoringFrameUsages = {}
  frameReviewIndex = 0
}

function buildLandmarkPreview(
  landmarks: FaceLandmark[],
): LandmarkPreviewPoint[] {
  return landmarks
    .slice(0, INFERENCE_DATASET_LANDMARK_PREVIEW_COUNT)
    .map((landmark, index) => ({
      index,
      x: Number(landmark.x.toFixed(4)),
      y: Number(landmark.y.toFixed(4)),
      z: Number(landmark.z.toFixed(4)),
    }))
}

function createInitialIdealLandmarks3DCandidateResult(): IdealLandmarks3DCandidateResult {
  return {
    status: "not_ready",
    generationMethod: null,
    landmarkCount: 0,
    landmarks: [],
    landmarksPreview: [],
    summary: {
      generatedCount: 0,
      averageConfidence: 0,
      minConfidence: 0,
      maxConfidence: 0,
      zMin: 0,
      zMax: 0,
      zAverage: 0,
      lowConfidenceLandmarkCount: 0,
      frontReferenceFrameCount: 0,
      observationFrameCount: 0,
      excludedFrameCount: 0,
    },
    message: null,
  }
}

function createInitialLandmarkGroupEditorState(): LandmarkGroupEditorState {
  return {
    selectedGroupId: "mouth",
    selectionMode: "click",
    rangeSelection: null,
    highlightedIndexInput: "",
    groups: createInitialLandmarkGroups(),
  }
}

function createInitialLandmarkGroups(): LandmarkGroups {
  return {
    schemaVersion: "landmark_groups_v1",
    topology: "mediapipe_face_landmarker_478",
    groups: LANDMARK_GROUP_EDITOR_GROUP_IDS.map((groupId) => {
      const fallbackGroup = DEFAULT_LANDMARK_GROUPS_V1.groups.find(
        (group) => group.id === groupId,
      )

      if (!fallbackGroup) {
        throw new Error(`Fallback landmark group was not found: ${groupId}`)
      }

      return cloneLandmarkGroup(fallbackGroup)
    }),
  }
}

function cloneLandmarkGroup(group: LandmarkGroup): LandmarkGroup {
  return {
    ...group,
    indices: normalizeLandmarkGroupIndices(group.indices),
  }
}

function normalizeLandmarkGroupIndices(indices: number[]): number[] {
  return [...new Set(indices)]
    .filter(
      (index) =>
        Number.isInteger(index) &&
        index >= 0 &&
        index < REQUIRED_LANDMARK_COUNT,
    )
    .sort((a, b) => a - b)
}

function getSelectedLandmarkGroup(): LandmarkGroup {
  const selectedGroup = landmarkGroupEditorState.groups.groups.find(
    (group) => group.id === landmarkGroupEditorState.selectedGroupId,
  )

  if (!selectedGroup) {
    throw new Error(
      `Selected landmark group was not found: ${landmarkGroupEditorState.selectedGroupId}`,
    )
  }

  return selectedGroup
}

function setSelectedLandmarkGroupId(groupId: string | undefined): void {
  if (!isLandmarkGroupEditorGroupId(groupId)) {
    return
  }

  landmarkGroupEditorState = {
    ...landmarkGroupEditorState,
    selectedGroupId: groupId,
  }
}

function setLandmarkGroupEditorSelectionMode(
  selectionMode: string | undefined,
): void {
  if (selectionMode !== "click" && selectionMode !== "rectangle") {
    return
  }

  landmarkGroupEditorDragState = null
  landmarkGroupEditorState = {
    ...landmarkGroupEditorState,
    selectionMode,
  }
}

function setLandmarkGroupEditorRangeSelection(
  rangeSelection: LandmarkGroupEditorRangeSelection | null,
): void {
  landmarkGroupEditorState = {
    ...landmarkGroupEditorState,
    rangeSelection,
  }
}

function setLandmarkGroupEditorHighlightedIndexInput(value: string): void {
  landmarkGroupEditorState = {
    ...landmarkGroupEditorState,
    highlightedIndexInput: value,
  }
}

function isLandmarkGroupEditorGroupId(
  value: string | undefined,
): value is LandmarkGroupEditorGroupId {
  return (
    value !== undefined &&
    LANDMARK_GROUP_EDITOR_GROUP_IDS.includes(value as LandmarkGroupEditorGroupId)
  )
}

function updateLandmarkGroupIndices(
  groupId: LandmarkGroupEditorGroupId,
  indices: number[],
): void {
  landmarkGroupEditorState = {
    ...landmarkGroupEditorState,
    groups: {
      ...landmarkGroupEditorState.groups,
      groups: landmarkGroupEditorState.groups.groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              indices: normalizeLandmarkGroupIndices(indices),
            }
          : group,
      ),
    },
  }
}

function toggleSelectedLandmarkGroupIndex(index: number): void {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= REQUIRED_LANDMARK_COUNT
  ) {
    return
  }

  const selectedGroup = getSelectedLandmarkGroup()
  const selectedIndexSet = new Set(selectedGroup.indices)

  if (selectedIndexSet.has(index)) {
    selectedIndexSet.delete(index)
  } else {
    selectedIndexSet.add(index)
  }

  updateLandmarkGroupIndices(
    landmarkGroupEditorState.selectedGroupId,
    [...selectedIndexSet],
  )
}

function addIndicesToSelectedLandmarkGroup(indices: number[]): void {
  const selectedGroup = getSelectedLandmarkGroup()
  const selectedIndexSet = new Set(selectedGroup.indices)

  normalizeLandmarkGroupIndices(indices).forEach((index) => {
    selectedIndexSet.add(index)
  })

  updateLandmarkGroupIndices(
    landmarkGroupEditorState.selectedGroupId,
    [...selectedIndexSet],
  )
}

function removeIndicesFromSelectedLandmarkGroup(indices: number[]): void {
  const selectedGroup = getSelectedLandmarkGroup()
  const selectedIndexSet = new Set(selectedGroup.indices)

  normalizeLandmarkGroupIndices(indices).forEach((index) => {
    selectedIndexSet.delete(index)
  })

  updateLandmarkGroupIndices(
    landmarkGroupEditorState.selectedGroupId,
    [...selectedIndexSet],
  )
}

function addRangeSelectionToSelectedLandmarkGroup(): void {
  addIndicesToSelectedLandmarkGroup(getCurrentRangeSelectionSummary().indices)
}

function removeRangeSelectionFromSelectedLandmarkGroup(): void {
  removeIndicesFromSelectedLandmarkGroup(
    getCurrentRangeSelectionSummary().indices,
  )
}

function addHighlightedIndicesToSelectedLandmarkGroup(): void {
  addIndicesToSelectedLandmarkGroup(getHighlightedIndexSummary().indices)
}

function removeHighlightedIndicesFromSelectedLandmarkGroup(): void {
  removeIndicesFromSelectedLandmarkGroup(getHighlightedIndexSummary().indices)
}

function clearHighlightedIndices(): void {
  setLandmarkGroupEditorHighlightedIndexInput("")
}

function clearSelectedLandmarkGroup(): void {
  updateLandmarkGroupIndices(landmarkGroupEditorState.selectedGroupId, [])
}

function resetSelectedLandmarkGroup(): void {
  const fallbackGroup = DEFAULT_LANDMARK_GROUPS_V1.groups.find(
    (group) => group.id === landmarkGroupEditorState.selectedGroupId,
  )

  updateLandmarkGroupIndices(
    landmarkGroupEditorState.selectedGroupId,
    fallbackGroup?.indices ?? [],
  )
}

function resetAllLandmarkGroups(): void {
  landmarkGroupEditorState = {
    ...landmarkGroupEditorState,
    selectedGroupId: landmarkGroupEditorState.selectedGroupId,
    groups: createInitialLandmarkGroups(),
  }
}

function buildLandmarkGroupsForExport(): LandmarkGroups {
  return {
    ...landmarkGroupEditorState.groups,
    groups: landmarkGroupEditorState.groups.groups.map(cloneLandmarkGroup),
  }
}

function parseLandmarkGroupEditorIndexInput(value: string): number[] {
  return (value.match(/-?\d+/g) ?? []).map((match) => Number(match))
}

function getHighlightedIndexSummary(): LandmarkGroupEditorHighlightSummary {
  const extractedIndices = parseLandmarkGroupEditorIndexInput(
    landmarkGroupEditorState.highlightedIndexInput,
  )
  const invalidIndices = extractedIndices.filter(
    (index) =>
      !Number.isInteger(index) ||
      index < 0 ||
      index >= REQUIRED_LANDMARK_COUNT,
  )
  const validIndices = normalizeLandmarkGroupIndices(extractedIndices)
  const baseSummary = summarizeLandmarkGroupEditorIndices(validIndices)

  return {
    ...baseSummary,
    extractedCount: extractedIndices.length,
    invalidCount: invalidIndices.length,
    invalidIndicesPreview: invalidIndices.slice(
      0,
      LANDMARK_GROUP_EDITOR_PREVIEW_INDICES_COUNT,
    ),
  }
}

function getCurrentRangeSelectionSummary(): LandmarkGroupEditorIndexSummary {
  const result = idealLandmarks3DCandidateResult

  if (
    result.status !== "generated" ||
    result.landmarks.length !== REQUIRED_LANDMARK_COUNT ||
    !landmarkGroupEditorState.rangeSelection
  ) {
    return summarizeLandmarkGroupEditorIndices([])
  }

  const canvas = document.querySelector<HTMLCanvasElement>(
    "[data-landmark-group-editor-canvas]",
  )
  const width = canvas?.getBoundingClientRect().width ?? 1
  const height = canvas?.getBoundingClientRect().height ?? 1
  const points = getLandmarkGroupEditorCanvasPoints(
    result.landmarks,
    Math.max(1, width),
    Math.max(1, height),
  )

  return summarizeLandmarkGroupEditorIndices(
    getLandmarkGroupEditorIndicesInRange(
      points,
      landmarkGroupEditorState.rangeSelection,
    ),
  )
}

function summarizeLandmarkGroupEditorIndices(
  indices: number[],
): LandmarkGroupEditorIndexSummary {
  const normalizedIndices = normalizeLandmarkGroupIndices(indices)
  const selectedIndexSet = new Set(getSelectedLandmarkGroup().indices)
  const alreadyInSelectedGroupCount = normalizedIndices.filter((index) =>
    selectedIndexSet.has(index),
  ).length

  return {
    indices: normalizedIndices,
    count: normalizedIndices.length,
    alreadyInSelectedGroupCount,
    notInSelectedGroupCount:
      normalizedIndices.length - alreadyInSelectedGroupCount,
  }
}

function formatLandmarkGroupEditorIndicesPreview(indices: number[]): string {
  if (indices.length === 0) {
    return "なし"
  }

  const previewIndices = indices.slice(
    0,
    LANDMARK_GROUP_EDITOR_PREVIEW_INDICES_COUNT,
  )
  const omittedCount = Math.max(
    0,
    indices.length - LANDMARK_GROUP_EDITOR_PREVIEW_INDICES_COUNT,
  )

  return `${previewIndices.join(", ")}${
    omittedCount > 0 ? ` ... +${omittedCount}` : ""
  }`
}

function validateLandmarkGroupEditorGroups(groups: LandmarkGroups): string[] {
  const errors: string[] = []

  if (groups.schemaVersion !== "landmark_groups_v1") {
    errors.push('schemaVersion must be "landmark_groups_v1"')
  }

  if (groups.topology !== "mediapipe_face_landmarker_478") {
    errors.push('topology must be "mediapipe_face_landmarker_478"')
  }

  const seenGroupIds = new Set<string>()

  groups.groups.forEach((group) => {
    if (group.id.trim().length === 0) {
      errors.push("group id must not be empty")
      return
    }

    if (seenGroupIds.has(group.id)) {
      errors.push(`group id duplicates ${group.id}`)
    }

    seenGroupIds.add(group.id)

    const seenIndices = new Set<number>()

    group.indices.forEach((index) => {
      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= REQUIRED_LANDMARK_COUNT
      ) {
        errors.push(`${group.id} includes invalid index ${index}`)
        return
      }

      if (seenIndices.has(index)) {
        errors.push(`${group.id} duplicates index ${index}`)
      }

      seenIndices.add(index)
    })
  })

  return errors
}

function resetIdealLandmarks3DCandidateResult(): void {
  idealLandmarks3DCandidateResult =
    createInitialIdealLandmarks3DCandidateResult()
  pointCloudPreviewCamera = createPointCloudPreviewCamera()
}

function isFiniteLandmark(landmark: FaceLandmark | undefined): landmark is FaceLandmark {
  return (
    landmark !== undefined &&
    Number.isFinite(landmark.x) &&
    Number.isFinite(landmark.y) &&
    Number.isFinite(landmark.z)
  )
}

function averageNumbers(values: number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((sum, value) => sum + value, 0) / values.length
}

function roundDebugNumber(value: number): number {
  return Number(value.toFixed(4))
}

function buildLandmarkBoundsSummary(
  points: Array<{ x: number; y: number; z?: number }>,
): LandmarkBoundsSummary | null {
  const finitePoints = points.filter(
    (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
  )

  if (finitePoints.length === 0) {
    return null
  }

  const xValues = finitePoints.map((point) => point.x)
  const yValues = finitePoints.map((point) => point.y)
  const zValues = finitePoints
    .map((point) => point.z)
    .filter((value): value is number => Number.isFinite(value))
  const xMin = Math.min(...xValues)
  const xMax = Math.max(...xValues)
  const yMin = Math.min(...yValues)
  const yMax = Math.max(...yValues)
  const width = xMax - xMin
  const height = yMax - yMin
  const summary: LandmarkBoundsSummary = {
    pointCount: finitePoints.length,
    xMin: roundDebugNumber(xMin),
    xMax: roundDebugNumber(xMax),
    yMin: roundDebugNumber(yMin),
    yMax: roundDebugNumber(yMax),
    width: roundDebugNumber(width),
    height: roundDebugNumber(height),
    aspectRatio:
      height > 0 ? roundDebugNumber(width / height) : null,
  }

  if (zValues.length > 0) {
    const zMin = Math.min(...zValues)
    const zMax = Math.max(...zValues)

    summary.zMin = roundDebugNumber(zMin)
    summary.zMax = roundDebugNumber(zMax)
    summary.zRange = roundDebugNumber(zMax - zMin)
  }

  return summary
}

function getVideoAspectSummary(): VideoAspectSummary {
  const width = videoSource?.videoWidth ?? null
  const height = videoSource?.videoHeight ?? null

  return {
    width,
    height,
    aspectRatio:
      width !== null && height !== null && height > 0
        ? roundDebugNumber(width / height)
        : null,
  }
}

function getVideoAspectRatioForNormalization(): number {
  const width = videoSource?.videoWidth ?? null
  const height = videoSource?.videoHeight ?? null

  return width !== null && height !== null && height > 0 ? width / height : 1
}

function getCoordinateNormalizationSummary(): CoordinateNormalizationSummary {
  const videoAspect = getVideoAspectSummary().aspectRatio
  const xScale = getVideoAspectRatioForNormalization()

  return {
    mode: COORDINATE_NORMALIZATION_MODE,
    xScale: roundDebugNumber(xScale),
    yScale: 1,
    videoAspectRatio: videoAspect,
    fallbackUsed: videoAspect === null,
    appliedBeforeRollCorrection: true,
    appliedBeforeZInference: true,
  }
}

function buildCoordinateAspectComparison(
  rawImageNormalizedFrontReferenceBaseBounds: LandmarkBoundsSummary | null,
  rawRollCorrectedFrontReferenceBaseBounds: LandmarkBoundsSummary | null,
  sameUnitFrontReferenceBaseBounds: LandmarkBoundsSummary | null,
  candidateBounds: LandmarkBoundsSummary | null,
): CoordinateAspectComparison {
  const videoAspect = getVideoAspectSummary().aspectRatio

  return {
    videoAspectRatio: videoAspect,
    rawImageNormalizedFrontReferenceBaseAspectRatio:
      rawImageNormalizedFrontReferenceBaseBounds?.aspectRatio ?? null,
    rawRollCorrectedFrontReferenceBaseAspectRatio:
      rawRollCorrectedFrontReferenceBaseBounds?.aspectRatio ?? null,
    sameUnitFrontReferenceBaseAspectRatio:
      sameUnitFrontReferenceBaseBounds?.aspectRatio ?? null,
    sameUnitCandidateAspectRatio: candidateBounds?.aspectRatio ?? null,
    estimatedLegacyCandidateAspectRatioBeforeNormalization:
      rawRollCorrectedFrontReferenceBaseBounds?.aspectRatio ??
      rawImageNormalizedFrontReferenceBaseBounds?.aspectRatio ??
      null,
  }
}

function buildIdealLandmarks3DCandidateSummary(
  landmarks: IdealLandmark3DCandidate[],
  counts: {
    frontReferenceFrameCount: number
    observationFrameCount: number
    excludedFrameCount: number
  },
): IdealLandmarks3DCandidateResult["summary"] {
  const confidenceValues = landmarks.map((landmark) => landmark.confidence)
  const zValues = landmarks.map((landmark) => landmark.z)

  return {
    generatedCount: landmarks.length,
    averageConfidence: Number(averageNumbers(confidenceValues).toFixed(4)),
    minConfidence:
      confidenceValues.length === 0
        ? 0
        : Number(Math.min(...confidenceValues).toFixed(4)),
    maxConfidence:
      confidenceValues.length === 0
        ? 0
        : Number(Math.max(...confidenceValues).toFixed(4)),
    zMin:
      zValues.length === 0 ? 0 : Number(Math.min(...zValues).toFixed(4)),
    zMax:
      zValues.length === 0 ? 0 : Number(Math.max(...zValues).toFixed(4)),
    zAverage: Number(averageNumbers(zValues).toFixed(4)),
    lowConfidenceLandmarkCount: confidenceValues.filter(
      (confidence) => confidence < POSE_AWARE_LOW_CONFIDENCE_THRESHOLD,
    ).length,
    frontReferenceFrameCount: counts.frontReferenceFrameCount,
    observationFrameCount: counts.observationFrameCount,
    excludedFrameCount: counts.excludedFrameCount,
  }
}

function toCurrentCandidatePreview(
  result: IdealLandmarks3DCandidateResult,
): unknown {
  const exportSummary = buildIdealFaceAssetExportSummary(result, new Date())

  return {
    status: result.status,
    generationMethod: result.generationMethod,
    landmarkCount: result.landmarkCount,
    frontReferenceFrameCount: result.summary.frontReferenceFrameCount,
    observationFrameCount: result.summary.observationFrameCount,
    excludedFrameCount: result.summary.excludedFrameCount,
    z: {
      min: result.summary.zMin,
      max: result.summary.zMax,
      average: result.summary.zAverage,
    },
    confidence: {
      average: result.summary.averageConfidence,
      min: result.summary.minConfidence,
      max: result.summary.maxConfidence,
      lowConfidenceLandmarkCount:
        result.summary.lowConfidenceLandmarkCount,
    },
    export: exportSummary,
    preview: result.landmarksPreview,
  }
}

function toLandmarkGroupsPreview(): unknown {
  const groups = buildLandmarkGroupsForExport()
  const validationErrors = validateLandmarkGroupEditorGroups(groups)
  const rangeSummary = getCurrentRangeSelectionSummary()
  const highlightSummary = getHighlightedIndexSummary()

  return {
    schemaVersion: groups.schemaVersion,
    topology: groups.topology,
    selectedGroupId: landmarkGroupEditorState.selectedGroupId,
    selectionMode: landmarkGroupEditorState.selectionMode,
    groupCount: groups.groups.length,
    exportIncludesFullIndices: true,
    validation: {
      ok: validationErrors.length === 0,
      errors: validationErrors,
    },
    rangeSelection: {
      count: rangeSummary.count,
      alreadyInSelectedGroupCount: rangeSummary.alreadyInSelectedGroupCount,
      notInSelectedGroupCount: rangeSummary.notInSelectedGroupCount,
      indicesPreview: rangeSummary.indices.slice(
        0,
        LANDMARK_GROUP_EDITOR_PREVIEW_INDICES_COUNT,
      ),
      omittedIndexCount: Math.max(
        0,
        rangeSummary.indices.length - LANDMARK_GROUP_EDITOR_PREVIEW_INDICES_COUNT,
      ),
    },
    highlightedIndices: {
      extractedCount: highlightSummary.extractedCount,
      validCount: highlightSummary.count,
      invalidCount: highlightSummary.invalidCount,
      alreadyInSelectedGroupCount:
        highlightSummary.alreadyInSelectedGroupCount,
      notInSelectedGroupCount: highlightSummary.notInSelectedGroupCount,
      indicesPreview: highlightSummary.indices.slice(
        0,
        LANDMARK_GROUP_EDITOR_PREVIEW_INDICES_COUNT,
      ),
      omittedIndexCount: Math.max(
        0,
        highlightSummary.indices.length -
          LANDMARK_GROUP_EDITOR_PREVIEW_INDICES_COUNT,
      ),
    },
    groups: groups.groups.map((group) => ({
      id: group.id,
      label: group.label,
      purpose: group.purpose,
      count: group.indices.length,
      indicesPreview: group.indices.slice(
        0,
        LANDMARK_GROUP_EDITOR_PREVIEW_INDICES_COUNT,
      ),
      omittedIndexCount: Math.max(
        0,
        group.indices.length - LANDMARK_GROUP_EDITOR_PREVIEW_INDICES_COUNT,
      ),
    })),
    futureCandidates: LANDMARK_GROUP_EDITOR_FUTURE_GROUP_IDS,
  }
}

function buildFrontReferenceCoordinateDebug(
  frontReferenceFrames: PoseAwareInferenceFrame[],
): {
  rawImageNormalizedBaseBounds: LandmarkBoundsSummary | null
  rawRollCorrectedImageNormalizedBaseBounds: LandmarkBoundsSummary | null
  sameUnitBaseBounds: LandmarkBoundsSummary | null
} {
  const rawImageNormalizedBasePoints = buildRawImageNormalizedBasePoints(
    frontReferenceFrames,
  )
  const rawRollCorrectedImageNormalizedBasePoints =
    buildRawRollCorrectedImageNormalizedBasePoints(frontReferenceFrames)
  const sameUnitBasePoints = buildPoseAwareBasePoints(frontReferenceFrames)

  return {
    rawImageNormalizedBaseBounds: buildLandmarkBoundsSummary(
      rawImageNormalizedBasePoints ?? [],
    ),
    rawRollCorrectedImageNormalizedBaseBounds: buildLandmarkBoundsSummary(
      rawRollCorrectedImageNormalizedBasePoints ?? [],
    ),
    sameUnitBaseBounds: buildLandmarkBoundsSummary(sameUnitBasePoints ?? []),
  }
}

function toCoordinateDebugPreview(
  poseAwareDataset: PoseAwareInferenceDataset,
  currentCandidate: IdealLandmarks3DCandidateResult,
): unknown {
  const frontReferenceDebug = buildFrontReferenceCoordinateDebug(
    poseAwareDataset.frontReferenceFrames,
  )
  const candidateBounds = buildLandmarkBoundsSummary(currentCandidate.landmarks)
  const aspectComparison = buildCoordinateAspectComparison(
    frontReferenceDebug.rawImageNormalizedBaseBounds,
    frontReferenceDebug.rawRollCorrectedImageNormalizedBaseBounds,
    frontReferenceDebug.sameUnitBaseBounds,
    candidateBounds,
  )

  return {
    video: getVideoAspectSummary(),
    normalization: getCoordinateNormalizationSummary(),
    frontReferenceBase: {
      frameCount: poseAwareDataset.frontReferenceFrames.length,
      rawImageNormalizedBounds:
        frontReferenceDebug.rawImageNormalizedBaseBounds,
      rawRollCorrectedImageNormalizedBounds:
        frontReferenceDebug.rawRollCorrectedImageNormalizedBaseBounds,
      sameUnitBounds: frontReferenceDebug.sameUnitBaseBounds,
    },
    currentCandidate: {
      status: currentCandidate.status,
      generationMethod: currentCandidate.generationMethod,
      landmarkCount: currentCandidate.landmarkCount,
      bounds: candidateBounds,
    },
    aspectComparison,
    previewDisplay: {
      centeredBeforeRotation: true,
      yAxisInvertedForCanvas: true,
      zDisplayScale: POINT_CLOUD_DEPTH_DISPLAY_SCALE,
      autoFitToCanvas: true,
      note:
        "Point cloud preview display transforms do not mutate candidate data.",
    },
    export: {
      schemaVersion: IDEAL_FACE_ASSET_SCHEMA_VERSION,
      coordinateSpace: IDEAL_FACE_ASSET_COORDINATE_SPACE,
      downloadJsonIncludesCoordinateDebug: false,
      idealLandmarks3DValuesUseSameUnitNormalization: true,
    },
    notes: [
      "MediaPipe image-normalized x/y are converted to video-aspect same-unit coordinates before roll correction.",
      "frontReference base x/y, observation dx/dy, and yaw/pitch z hints use the same normalized coordinate space.",
      "Export keeps schemaVersion and coordinateSpace unchanged while idealLandmarks3D values use same-unit normalization.",
    ],
  }
}

function isExportableIdealFaceCandidate(
  result: IdealLandmarks3DCandidateResult,
): result is IdealLandmarks3DCandidateResult & {
  generationMethod: IdealLandmarks3DGenerationMethod
} {
  return (
    result.status === "generated" &&
    result.generationMethod === "pose_aware_weighted_z_v1" &&
    result.landmarkCount === REQUIRED_LANDMARK_COUNT &&
    result.landmarks.length === REQUIRED_LANDMARK_COUNT
  )
}

function getIdealFaceAssetExportDisabledReason(
  result: IdealLandmarks3DCandidateResult,
): string | null {
  if (isExportableIdealFaceCandidate(result)) {
    return null
  }

  if (
    result.status !== "generated" ||
    result.generationMethod !== "pose_aware_weighted_z_v1"
  ) {
    return "先に pose-aware 3D候補を生成してください。"
  }

  return `IdealFace JSON export には ${REQUIRED_LANDMARK_COUNT} landmarks が必要です。`
}

function formatIdealFaceAssetDatePart(value: number): string {
  return value.toString().padStart(2, "0")
}

function buildIdealFaceAssetId(date: Date): string {
  return [
    "custom_ideal_face",
    date.getFullYear(),
    formatIdealFaceAssetDatePart(date.getMonth() + 1),
    formatIdealFaceAssetDatePart(date.getDate()),
    [
      formatIdealFaceAssetDatePart(date.getHours()),
      formatIdealFaceAssetDatePart(date.getMinutes()),
      formatIdealFaceAssetDatePart(date.getSeconds()),
    ].join(""),
  ].join("_")
}

function buildIdealFaceAssetFileName(date: Date): string {
  return `${buildIdealFaceAssetId(date)}.json`
}

function roundIdealFaceAssetNumber(value: number): number {
  return Number(value.toFixed(6))
}

function buildIdealFaceAssetExportSummary(
  result: IdealLandmarks3DCandidateResult,
  date: Date,
): IdealFaceAssetExportSummary {
  return {
    schemaVersion: IDEAL_FACE_ASSET_SCHEMA_VERSION,
    generationMethod: "pose_aware_weighted_z_v1",
    landmarkCount: result.landmarkCount,
    canExport: isExportableIdealFaceCandidate(result),
    fileName: buildIdealFaceAssetFileName(date),
    includedLandmarkCount: isExportableIdealFaceCandidate(result)
      ? result.landmarks.length
      : 0,
    disabledReason: getIdealFaceAssetExportDisabledReason(result),
  }
}

function buildIdealFaceAssetV1(
  result: IdealLandmarks3DCandidateResult,
  createdAtDate: Date,
): IdealFaceAssetV1 {
  if (!isExportableIdealFaceCandidate(result)) {
    throw new Error("Exportable IdealFace candidate was not found")
  }

  return {
    schemaVersion: IDEAL_FACE_ASSET_SCHEMA_VERSION,
    id: buildIdealFaceAssetId(createdAtDate),
    name: IDEAL_FACE_ASSET_NAME,
    version: IDEAL_FACE_ASSET_VERSION,
    createdAt: createdAtDate.toISOString(),
    source: {
      tool: IDEAL_FACE_ASSET_TOOL,
      generationMethod: result.generationMethod,
    },
    model: {
      landmarkTopology: IDEAL_FACE_ASSET_LANDMARK_TOPOLOGY,
      coordinateSpace: IDEAL_FACE_ASSET_COORDINATE_SPACE,
      idealLandmarks3D: result.landmarks.map((landmark) => ({
        index: landmark.index,
        x: roundIdealFaceAssetNumber(landmark.x),
        y: roundIdealFaceAssetNumber(landmark.y),
        z: roundIdealFaceAssetNumber(landmark.z),
        confidence: roundIdealFaceAssetNumber(landmark.confidence),
      })),
    },
    landmarkGroups: buildLandmarkGroupsForExport(),
    metadata: {
      frontReferenceFrameCount: result.summary.frontReferenceFrameCount,
      observationFrameCount: result.summary.observationFrameCount,
      excludedFrameCount: result.summary.excludedFrameCount,
      z: {
        min: result.summary.zMin,
        max: result.summary.zMax,
        average: result.summary.zAverage,
      },
      confidence: {
        average: result.summary.averageConfidence,
        min: result.summary.minConfidence,
        max: result.summary.maxConfidence,
        lowConfidenceLandmarkCount:
          result.summary.lowConfidenceLandmarkCount,
      },
    },
  }
}

function downloadIdealFaceAssetJson(): void {
  const result = idealLandmarks3DCandidateResult

  if (!isExportableIdealFaceCandidate(result)) {
    return
  }

  const createdAtDate = new Date()
  const asset = buildIdealFaceAssetV1(result, createdAtDate)
  const fileName = buildIdealFaceAssetFileName(createdAtDate)
  const blob = new Blob([JSON.stringify(asset, null, 2)], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function getNumberRange(values: number[]): NumberRange | null {
  if (values.length === 0) {
    return null
  }

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  }
}

function formatNumberRange(range: NumberRange | null): string {
  return range
    ? `${formatNumber(range.min)} / ${formatNumber(range.max)}`
    : "なし"
}

function formatNullableDebugNumber(value: number | null | undefined): string {
  return value === null || value === undefined ? "none" : formatNumber(value)
}

function renderBoundsSummaryRows(
  bounds: LandmarkBoundsSummary | null,
): string {
  return `
    <div>
      <dt>point count</dt>
      <dd>${bounds?.pointCount ?? 0}</dd>
    </div>
    <div>
      <dt>x min / max</dt>
      <dd>${formatNullableDebugNumber(bounds?.xMin)} / ${formatNullableDebugNumber(bounds?.xMax)}</dd>
    </div>
    <div>
      <dt>y min / max</dt>
      <dd>${formatNullableDebugNumber(bounds?.yMin)} / ${formatNullableDebugNumber(bounds?.yMax)}</dd>
    </div>
    <div>
      <dt>z min / max</dt>
      <dd>${formatNullableDebugNumber(bounds?.zMin)} / ${formatNullableDebugNumber(bounds?.zMax)}</dd>
    </div>
    <div>
      <dt>width / height</dt>
      <dd>${formatNullableDebugNumber(bounds?.width)} / ${formatNullableDebugNumber(bounds?.height)}</dd>
    </div>
    <div>
      <dt>z range</dt>
      <dd>${formatNullableDebugNumber(bounds?.zRange)}</dd>
    </div>
    <div>
      <dt>aspect ratio</dt>
      <dd>${formatNullableDebugNumber(bounds?.aspectRatio)}</dd>
    </div>
  `
}

function renderCoordinateAspectComparisonRows(
  comparison: CoordinateAspectComparison,
): string {
  return `
    <div>
      <dt>video aspect ratio</dt>
      <dd>${formatNullableDebugNumber(comparison.videoAspectRatio)}</dd>
    </div>
    <div>
      <dt>raw image-normalized base aspect</dt>
      <dd>${formatNullableDebugNumber(comparison.rawImageNormalizedFrontReferenceBaseAspectRatio)}</dd>
    </div>
    <div>
      <dt>raw roll-corrected base aspect</dt>
      <dd>${formatNullableDebugNumber(comparison.rawRollCorrectedFrontReferenceBaseAspectRatio)}</dd>
    </div>
    <div>
      <dt>same-unit base aspect</dt>
      <dd>${formatNullableDebugNumber(comparison.sameUnitFrontReferenceBaseAspectRatio)}</dd>
    </div>
    <div>
      <dt>same-unit candidate aspect</dt>
      <dd>${formatNullableDebugNumber(comparison.sameUnitCandidateAspectRatio)}</dd>
    </div>
    <div>
      <dt>estimated legacy candidate aspect</dt>
      <dd>${formatNullableDebugNumber(comparison.estimatedLegacyCandidateAspectRatioBeforeNormalization)}</dd>
    </div>
  `
}

function renderCoordinateNormalizationSummaryRows(
  normalization: CoordinateNormalizationSummary,
): string {
  return `
    <div>
      <dt>mode</dt>
      <dd>${normalization.mode}</dd>
    </div>
    <div>
      <dt>video aspect</dt>
      <dd>${formatNullableDebugNumber(normalization.videoAspectRatio)}</dd>
    </div>
    <div>
      <dt>x scale / y scale</dt>
      <dd>${formatNumber(normalization.xScale)} / ${formatNumber(normalization.yScale)}</dd>
    </div>
    <div>
      <dt>fallback used</dt>
      <dd>${normalization.fallbackUsed ? "yes" : "no"}</dd>
    </div>
    <div>
      <dt>applied before roll correction</dt>
      <dd>${normalization.appliedBeforeRollCorrection ? "yes" : "no"}</dd>
    </div>
    <div>
      <dt>applied before z inference</dt>
      <dd>${normalization.appliedBeforeZInference ? "yes" : "no"}</dd>
    </div>
  `
}

function getPointCloudPreviewSummary(
  landmarks: IdealLandmark3DCandidate[],
): PointCloudPreviewSummary {
  const confidenceValues = landmarks.map((landmark) => landmark.confidence)
  const bounds = buildLandmarkBoundsSummary(landmarks)

  return {
    landmarkCount: landmarks.length,
    xRange: getNumberRange(landmarks.map((landmark) => landmark.x)),
    yRange: getNumberRange(landmarks.map((landmark) => landmark.y)),
    zRange: getNumberRange(landmarks.map((landmark) => landmark.z)),
    width: bounds?.width ?? 0,
    height: bounds?.height ?? 0,
    aspectRatio: bounds?.aspectRatio ?? null,
    averageConfidence: Number(averageNumbers(confidenceValues).toFixed(4)),
    minConfidence:
      confidenceValues.length === 0
        ? 0
        : Number(Math.min(...confidenceValues).toFixed(4)),
    maxConfidence:
      confidenceValues.length === 0
        ? 0
        : Number(Math.max(...confidenceValues).toFixed(4)),
  }
}

function createPointCloudPreviewCamera(
  overrides: Partial<PointCloudPreviewCamera> = {},
): PointCloudPreviewCamera {
  return {
    ...DEFAULT_POINT_CLOUD_CAMERA,
    ...overrides,
  }
}

function getPointCloudPreviewPresetCamera(
  preset: PointCloudPreviewPreset,
): PointCloudPreviewCamera {
  if (preset === "side") {
    return createPointCloudPreviewCamera({
      yaw: Math.PI / 2,
    })
  }

  if (preset === "top") {
    return createPointCloudPreviewCamera({
      pitch: -POINT_CLOUD_MAX_PITCH,
    })
  }

  return createPointCloudPreviewCamera()
}

function formatPointCloudPreviewPreset(preset: PointCloudPreviewPreset): string {
  const labels: Record<PointCloudPreviewPreset, string> = {
    front: "正面に戻す",
    side: "横から見る",
    top: "上から見る",
    reset: "リセット",
  }

  return labels[preset]
}

function formatPointCloudCamera(camera: PointCloudPreviewCamera): string {
  return `yaw ${formatNumber(camera.yaw * RAD_TO_DEG)}° / pitch ${formatNumber(
    camera.pitch * RAD_TO_DEG,
  )}° / zoom ${formatNumber(camera.zoom)}x`
}

function getPointCloudPreviewDataCenter(
  landmarks: IdealLandmark3DCandidate[],
): PointCloudPreviewPoint {
  if (landmarks.length === 0) {
    return {
      x: 0,
      y: 0,
      z: 0,
    }
  }

  return {
    x: averageNumbers(landmarks.map((landmark) => landmark.x)),
    y: averageNumbers(landmarks.map((landmark) => landmark.y)),
    z: averageNumbers(landmarks.map((landmark) => landmark.z)),
  }
}

function toPointCloudPreviewLocalPoint(
  point: IdealLandmark3DCandidate,
  center: PointCloudPreviewPoint,
): PointCloudPreviewPoint {
  return {
    x: point.x - center.x,
    y: -(point.y - center.y),
    z: (point.z - center.z) * POINT_CLOUD_DEPTH_DISPLAY_SCALE,
  }
}

function rotatePointForPointCloudPreview(
  point: PointCloudPreviewPoint,
  camera: PointCloudPreviewCamera,
): PointCloudPreviewPoint {
  const sourceX = point.x
  const sourceY = point.y
  const sourceZ = point.z
  const cosYaw = Math.cos(camera.yaw)
  const sinYaw = Math.sin(camera.yaw)
  const yawX = sourceX * cosYaw + sourceZ * sinYaw
  const yawZ = -sourceX * sinYaw + sourceZ * cosYaw
  const cosPitch = Math.cos(camera.pitch)
  const sinPitch = Math.sin(camera.pitch)

  return {
    x: yawX,
    y: sourceY * cosPitch - yawZ * sinPitch,
    z: sourceY * sinPitch + yawZ * cosPitch,
  }
}

function getRotatedPointCloudBounds(
  rotatedPoints: PointCloudPreviewPoint[],
): {
  centerX: number
  centerY: number
  scale: number
} {
  const xRange = getNumberRange(rotatedPoints.map((point) => point.x))
  const yRange = getNumberRange(rotatedPoints.map((point) => point.y))

  if (!xRange || !yRange) {
    return {
      centerX: 0,
      centerY: 0,
      scale: 1,
    }
  }

  const horizontalSpan = Math.max(xRange.max - xRange.min, 0.001)
  const verticalSpan = Math.max(yRange.max - yRange.min, 0.001)

  return {
    centerX: (xRange.min + xRange.max) / 2,
    centerY: (yRange.min + yRange.max) / 2,
    scale: 1 / Math.max(horizontalSpan, verticalSpan),
  }
}

function getConfidenceOpacity(confidence: number): string {
  return (0.22 + clamp(confidence, 0, 1) * 0.68).toFixed(3)
}

function getFrameId(frameIndex: number): string {
  return String(frameIndex)
}

function getFrameIdFromFrame(frame: ExtractedVideoFrame): string {
  return getFrameId(frame.index)
}

function getDetailedScanFrames(): ExtractedVideoFrame[] {
  return videoSource?.detailedScanFrames ?? []
}

function buildExpressionFramePreview(
  frame: ExtractedVideoFrame,
): ExpressionFramePreview {
  return {
    frameId: getFrameIdFromFrame(frame),
    timestamp: Number(frame.timestamp.toFixed(3)),
  }
}

function getBlendshapeScore(
  blendshapes: BlendshapeScore[],
  categoryName: string,
): number {
  return (
    blendshapes.find((blendshape) => blendshape.categoryName === categoryName)
      ?.score ?? 0
  )
}

function isExpressionGroupingPoseInRange(pose: FacePose): boolean {
  const { pose: thresholds } = EXPRESSION_GROUPING_THRESHOLDS

  return (
    Math.abs(pose.yaw) <= thresholds.maxAbsYaw &&
    Math.abs(pose.pitch) <= thresholds.maxAbsPitch &&
    Math.abs(pose.roll) <= thresholds.maxAbsRoll
  )
}

function getActiveExpressionGroupIds(
  blendshapes: BlendshapeScore[],
): ExpressionGroupId[] {
  const { expression } = EXPRESSION_GROUPING_THRESHOLDS
  const activeGroupIds: ExpressionGroupId[] = []
  const mouthSmileScore = Math.max(
    getBlendshapeScore(blendshapes, "mouthSmileLeft"),
    getBlendshapeScore(blendshapes, "mouthSmileRight"),
  )

  if (
    getBlendshapeScore(blendshapes, "mouthPucker") >=
    expression.mouthPuckerMin
  ) {
    activeGroupIds.push("mouthPucker")
  }

  if (getBlendshapeScore(blendshapes, "jawOpen") >= expression.jawOpenMin) {
    activeGroupIds.push("jawOpen")
  }

  if (mouthSmileScore >= expression.mouthSmileMin) {
    activeGroupIds.push("mouthSmile")
  }

  if (
    getBlendshapeScore(blendshapes, "eyeBlinkLeft") >=
    expression.eyeBlinkMin
  ) {
    activeGroupIds.push("eyeBlinkLeft")
  }

  if (
    getBlendshapeScore(blendshapes, "eyeBlinkRight") >=
    expression.eyeBlinkMin
  ) {
    activeGroupIds.push("eyeBlinkRight")
  }

  if (
    getBlendshapeScore(blendshapes, "eyeSquintLeft") >=
    expression.eyeSquintMin
  ) {
    activeGroupIds.push("eyeSquintLeft")
  }

  if (
    getBlendshapeScore(blendshapes, "eyeSquintRight") >=
    expression.eyeSquintMin
  ) {
    activeGroupIds.push("eyeSquintRight")
  }

  return activeGroupIds
}

function getAutoExpressionGroup(
  frame: ExtractedVideoFrame,
): FrameExpressionGroup {
  const blendshapes = frame.analysis?.blendshapes ?? []

  if (blendshapes.length === 0) {
    return "none"
  }

  const activeGroupIds = getActiveExpressionGroupIds(blendshapes)

  if (activeGroupIds.length === 1) {
    return activeGroupIds[0]
  }

  if (activeGroupIds.length >= 2) {
    return "mixedExpression"
  }

  return "none"
}

function isPoseInAuthoringUsageRange(pose: FacePose): boolean {
  return (
    Math.abs(pose.yaw) <= DIRECTIONAL_POSE_LIMIT.yaw &&
    Math.abs(pose.pitch) <= DIRECTIONAL_POSE_LIMIT.pitch &&
    Math.abs(pose.roll) <= DIRECTIONAL_POSE_LIMIT.roll
  )
}

function getAutoExcludedReason(
  frame: ExtractedVideoFrame,
): ExcludedReason | null {
  const analysis = frame.analysis

  if (frame.status === "pending" || frame.status === "analyzing") {
    return null
  }

  if (frame.status !== "analyzed" || analysis?.detected !== true) {
    return "noFace"
  }

  if (analysis.landmarks.length !== REQUIRED_LANDMARK_COUNT) {
    return "invalidLandmarks"
  }

  return null
}

function getFrameWarningReasons(frame: ExtractedVideoFrame): WarningReason[] {
  const analysis = frame.analysis
  const warningReasons: WarningReason[] = []

  if (frame.status === "pending" || frame.status === "analyzing") {
    warningReasons.push("pending")
  }

  if (
    analysis?.detected === true &&
    analysis.landmarks.length === REQUIRED_LANDMARK_COUNT &&
    analysis.blendshapes.length === 0
  ) {
    warningReasons.push("missingBlendshapes")
  }

  if (
    analysis?.detected === true &&
    analysis.landmarks.length === REQUIRED_LANDMARK_COUNT &&
    (!hasCompletePose(analysis.pose) ||
      !isPoseInAuthoringUsageRange(analysis.pose))
  ) {
    warningReasons.push("poseOutOfRange")
  }

  if (getAutoExpressionGroup(frame) === "mixedExpression") {
    warningReasons.push("mixedExpression")
  }

  return warningReasons
}

function createDefaultAuthoringFrameUsage(
  frame: ExtractedVideoFrame,
): AuthoringFrameUsage {
  const excludedReason = getAutoExcludedReason(frame) ?? undefined
  const excluded = excludedReason !== undefined
  const autoExpressionGroup = getAutoExpressionGroup(frame)
  const warningReasons = getFrameWarningReasons(frame)

  return {
    frameId: getFrameIdFromFrame(frame),
    frontReference: false,
    useForInference: !excluded,
    expressionGroup: excluded ? "none" : autoExpressionGroup,
    autoExpressionGroup,
    excluded,
    excludedReason,
    warningReasons,
  }
}

function getAuthoringFrameUsage(
  frame: ExtractedVideoFrame,
): AuthoringFrameUsage {
  const frameId = getFrameIdFromFrame(frame)
  const existingUsage = authoringFrameUsages[frameId]

  if (existingUsage) {
    return existingUsage
  }

  const usage = createDefaultAuthoringFrameUsage(frame)
  authoringFrameUsages = {
    ...authoringFrameUsages,
    [frameId]: usage,
  }

  return usage
}

function getAuthoringFrameUsageById(
  frameId: string,
): AuthoringFrameUsage | null {
  const frame = findPoseAwareFrameById(frameId)

  return frame ? getAuthoringFrameUsage(frame) : null
}

function setAuthoringFrameUsage(
  frameId: string,
  patch: Partial<AuthoringFrameUsage>,
): void {
  const usage = getAuthoringFrameUsageById(frameId)

  if (!usage) {
    return
  }

  authoringFrameUsages = {
    ...authoringFrameUsages,
    [frameId]: {
      ...usage,
      ...patch,
      frameId,
    },
  }
}

function setAuthoringFrameFrontReference(
  frameId: string,
  frontReference: boolean,
): void {
  const usage = getAuthoringFrameUsageById(frameId)

  if (!usage || usage.excluded) {
    return
  }

  setAuthoringFrameUsage(frameId, { frontReference })
}

function setAuthoringFrameUseForInference(
  frameId: string,
  useForInference: boolean,
): void {
  const usage = getAuthoringFrameUsageById(frameId)

  if (!usage || usage.excluded) {
    return
  }

  setAuthoringFrameUsage(frameId, { useForInference })
}

function isFrameExpressionGroup(
  value: string | undefined,
): value is FrameExpressionGroup {
  return FRAME_EXPRESSION_GROUP_IDS.includes(value as FrameExpressionGroup)
}

function setAuthoringFrameExpressionGroup(
  frameId: string,
  expressionGroup: string | undefined,
): void {
  const usage = getAuthoringFrameUsageById(frameId)

  if (!usage || usage.excluded || !isFrameExpressionGroup(expressionGroup)) {
    return
  }

  setAuthoringFrameUsage(frameId, { expressionGroup })
}

function excludeAuthoringFrame(frameId: string): void {
  setAuthoringFrameUsage(frameId, {
    frontReference: false,
    useForInference: false,
    expressionGroup: "none",
    excluded: true,
    excludedReason: "manual",
  })
}

function restoreAuthoringFrame(frameId: string): void {
  const usage = getAuthoringFrameUsageById(frameId)

  if (!usage) {
    return
  }

  setAuthoringFrameUsage(frameId, {
    frontReference: false,
    useForInference: true,
    expressionGroup: usage.autoExpressionGroup,
    excluded: false,
    excludedReason: undefined,
    warningReasons: usage.warningReasons,
  })
}

function isFrameExcludedForPoseAware(frameIndex: number): boolean {
  const usage = getAuthoringFrameUsageById(getFrameId(frameIndex))

  return usage?.excluded ?? false
}

function isFrameFrontReferenceForPoseAware(frameIndex: number): boolean {
  const usage = getAuthoringFrameUsageById(getFrameId(frameIndex))

  return usage?.frontReference === true && usage.excluded === false
}

function isFrameUsedForPoseAwareInference(frameIndex: number): boolean {
  const usage = getAuthoringFrameUsageById(getFrameId(frameIndex))

  return usage?.useForInference === true && usage.excluded === false
}

function getIdealLandmarks3DFrameSelection(): IdealLandmarks3DFrameSelection {
  const frames = getDetailedScanFrames()

  return {
    frontReferenceFrameIds: frames
      .filter((frame) => getAuthoringFrameUsage(frame).frontReference)
      .filter((frame) => !getAuthoringFrameUsage(frame).excluded)
      .map(getFrameIdFromFrame),
    excludedFrameIds: frames
      .filter((frame) => getAuthoringFrameUsage(frame).excluded)
      .map(getFrameIdFromFrame),
  }
}

function createFrameExpressionGroupCountRecord(): Record<
  FrameExpressionGroup,
  number
> {
  return FRAME_EXPRESSION_GROUP_IDS.reduce(
    (record, groupId) => ({
      ...record,
      [groupId]: 0,
    }),
    {} as Record<FrameExpressionGroup, number>,
  )
}

function createExcludedReasonCountRecord(): Record<ExcludedReason, number> {
  return EXCLUDED_REASON_IDS.reduce(
    (record, reason) => ({
      ...record,
      [reason]: 0,
    }),
    {} as Record<ExcludedReason, number>,
  )
}

function createWarningReasonCountRecord(): Record<WarningReason, number> {
  return WARNING_REASON_IDS.reduce(
    (record, reason) => ({
      ...record,
      [reason]: 0,
    }),
    {} as Record<WarningReason, number>,
  )
}

function getFrameUsageSummary(): FrameUsageSummary {
  const frames = getDetailedScanFrames()
  const expressionGroupCounts = createFrameExpressionGroupCountRecord()
  const excludedReasonCounts = createExcludedReasonCountRecord()
  const warningReasonCounts = createWarningReasonCountRecord()
  let frontReferenceCount = 0
  let useForInferenceCount = 0
  let excludedCount = 0

  frames.forEach((frame) => {
    const usage = getAuthoringFrameUsage(frame)

    usage.warningReasons.forEach((reason) => {
      warningReasonCounts[reason] += 1
    })

    if (usage.excluded) {
      excludedCount += 1
      excludedReasonCounts[usage.excludedReason ?? "manual"] += 1
      return
    }

    if (usage.frontReference) {
      frontReferenceCount += 1
    }

    if (usage.useForInference) {
      useForInferenceCount += 1
    }

    expressionGroupCounts[usage.expressionGroup] += 1
  })

  return {
    sourceFrameCount: frames.length,
    frontReferenceCount,
    useForInferenceCount,
    expressionGroupCounts,
    excludedCount,
    excludedReasonCounts,
    warningReasonCounts,
    framePreview: frames.slice(0, EXPRESSION_FRAME_PREVIEW_COUNT).map((frame) => {
      const usage = getAuthoringFrameUsage(frame)

      return {
        frameId: usage.frameId,
        frontReference: usage.frontReference,
        useForInference: usage.useForInference,
        expressionGroup: usage.expressionGroup,
        autoExpressionGroup: usage.autoExpressionGroup,
        excluded: usage.excluded,
        excludedReason: usage.excludedReason,
        warningReasons: usage.warningReasons,
      }
    }),
  }
}

function createEmptyExpressionGroupFrameSummary(
  id: ExpressionGroupId,
): ExpressionGroupFrameSummary {
  return {
    id,
    frameCount: 0,
    frames: [],
  }
}

function getExpressionGroupFrameSummary(
  groups: ExpressionGroupFrameSummary[],
  id: ExpressionGroupId,
): ExpressionGroupFrameSummary {
  const group = groups.find((candidate) => candidate.id === id)

  if (!group) {
    throw new Error(`Expression group was not found: ${id}`)
  }

  return group
}

function buildExpressionGroupingWarnings(
  summary: Omit<ExpressionGroupingSummary, "warnings">,
): string[] {
  const warnings: string[] = []

  if (summary.status !== "ready") {
    return warnings
  }

  summary.expressionGroups.forEach((group) => {
    if (group.frameCount === 0) {
      warnings.push(`${group.id} frame group がありません。`)
    }
  })

  if (
    summary.sourceFrameCount > 0 &&
    summary.mixedExpressionFrameCount / summary.sourceFrameCount >=
      EXPRESSION_GROUPING_MIXED_WARNING_RATIO
  ) {
    warnings.push("mixedExpression が source frames の 30%以上です。")
  }

  if (summary.warningBreakdown.extremePoseFrameCount > 0) {
    warnings.push(
      `pose が極端な frame が ${summary.warningBreakdown.extremePoseFrameCount}件あります。`,
    )
  }

  if (summary.warningBreakdown.missingBlendshapeFrameCount > 0) {
    warnings.push(
      `blendshapes がない frame が ${summary.warningBreakdown.missingBlendshapeFrameCount}件あります。`,
    )
  }

  return warnings
}

function getExpressionGroupingSummary(): ExpressionGroupingSummary {
  const frames = getDetailedScanFrames()
  const expressionGroups = EXPRESSION_GROUP_IDS.map(
    createEmptyExpressionGroupFrameSummary,
  )
  const summaryWithoutWarnings: Omit<ExpressionGroupingSummary, "warnings"> = {
    status: frames.length > 0 ? "ready" : "not_available",
    source: "detailed_scan_frames",
    sourceFrameCount: frames.length,
    noneExpressionFrameCount: 0,
    noneExpressionFrames: [],
    expressionGroups,
    mixedExpressionFrameCount: 0,
    mixedExpressionFrames: [],
    excludedFrameCount: 0,
    excludedFrames: [],
    excludedBreakdown: {
      noFaceFrameCount: 0,
      invalidLandmarkFrameCount: 0,
    },
    warningBreakdown: {
      missingBlendshapeFrameCount: 0,
      extremePoseFrameCount: 0,
      pendingFrameCount: 0,
      mixedExpressionFrameCount: 0,
    },
    step2IExcludedFrameCount:
      getIdealLandmarks3DFrameSelection().excludedFrameIds.length,
  }

  frames.forEach((frame) => {
    const analysis = frame.analysis
    const framePreview = buildExpressionFramePreview(frame)

    const addExcludedFrame = (): void => {
      summaryWithoutWarnings.excludedFrameCount += 1
      summaryWithoutWarnings.excludedFrames.push(framePreview)
    }

    if (frame.status === "pending" || frame.status === "analyzing") {
      summaryWithoutWarnings.warningBreakdown.pendingFrameCount += 1
      summaryWithoutWarnings.noneExpressionFrameCount += 1
      summaryWithoutWarnings.noneExpressionFrames.push(framePreview)
      return
    }

    if (frame.status !== "analyzed" || analysis?.detected !== true) {
      summaryWithoutWarnings.excludedBreakdown.noFaceFrameCount += 1
      addExcludedFrame()
      return
    }

    if (analysis.landmarks.length !== REQUIRED_LANDMARK_COUNT) {
      summaryWithoutWarnings.excludedBreakdown.invalidLandmarkFrameCount += 1
      addExcludedFrame()
      return
    }

    if (analysis.blendshapes.length === 0) {
      summaryWithoutWarnings.warningBreakdown.missingBlendshapeFrameCount += 1
    }

    if (
      !hasCompletePose(analysis.pose) ||
      !isExpressionGroupingPoseInRange(analysis.pose)
    ) {
      summaryWithoutWarnings.warningBreakdown.extremePoseFrameCount += 1
    }

    const autoExpressionGroup = getAutoExpressionGroup(frame)

    if (autoExpressionGroup === "none") {
      summaryWithoutWarnings.noneExpressionFrameCount += 1
      summaryWithoutWarnings.noneExpressionFrames.push(framePreview)
      return
    }

    if (autoExpressionGroup === "mixedExpression") {
      summaryWithoutWarnings.mixedExpressionFrameCount += 1
      summaryWithoutWarnings.mixedExpressionFrames.push(framePreview)
      summaryWithoutWarnings.warningBreakdown.mixedExpressionFrameCount += 1
      return
    }

    if (EXPRESSION_GROUP_IDS.includes(autoExpressionGroup)) {
      const group = getExpressionGroupFrameSummary(
        expressionGroups,
        autoExpressionGroup,
      )
      group.frameCount += 1
      group.frames.push(framePreview)
    }
  })

  return {
    ...summaryWithoutWarnings,
    warnings: buildExpressionGroupingWarnings(summaryWithoutWarnings),
  }
}

function findPoseAwareFrameById(frameId: string): ExtractedVideoFrame | null {
  const frameIndex = Number(frameId)

  if (!Number.isFinite(frameIndex)) {
    return null
  }

  return (
    getDetailedScanFrames().find((frame) => frame.index === frameIndex) ??
    videoSource?.extractedFrames.find((frame) => frame.index === frameIndex) ??
    null
  )
}

function isUsableObservationSourceFrame(frame: ExtractedVideoFrame): boolean {
  const analysis = frame.analysis

  return (
    frame.status === "analyzed" &&
    analysis?.detected === true &&
    analysis.landmarks.length === REQUIRED_LANDMARK_COUNT &&
    hasCompletePose(analysis.pose)
  )
}

function getPoseAwareCandidateScore(frameIndex: number): number | null {
  const frame = getDetailedScanFrames().find(
    (scanFrame) => scanFrame.index === frameIndex,
  )
  const pose = frame?.analysis?.pose

  if (!pose || !hasCompletePose(pose)) {
    return null
  }

  const scores = [
    scoreFrontCandidate(pose),
    scoreYawPositiveCandidate(pose),
    scoreYawNegativeCandidate(pose),
    scorePitchPositiveCandidate(pose),
    scorePitchNegativeCandidate(pose),
  ].filter((score): score is number => score !== null)

  if (scores.length === 0) {
    return null
  }

  return Number(Math.max(...scores).toFixed(4))
}

function buildPoseAwareObservationFrame(
  frame: ExtractedVideoFrame,
  role: PoseAwareObservationFrame["role"],
): PoseAwareObservationFrame | null {
  const analysis = frame.analysis

  if (!analysis || !hasCompletePose(analysis.pose)) {
    return null
  }

  return {
    frameId: getFrameIdFromFrame(frame),
    frameIndex: frame.index,
    timestamp: frame.timestamp,
    landmarksCount: analysis.landmarks.length,
    pose: analysis.pose,
    score: getPoseAwareCandidateScore(frame.index),
    thumbnailUrl: frame.thumbnailUrl,
    role,
    usage: getAuthoringFrameUsage(frame),
  }
}

function getPoseAwareFrontReferenceFrames(): PoseAwareObservationFrame[] {
  return getDetailedScanFrames()
    .filter(
      (frame) =>
        isUsableObservationSourceFrame(frame) &&
        isFrameFrontReferenceForPoseAware(frame.index),
    )
    .map((frame) => buildPoseAwareObservationFrame(frame, "front_reference"))
    .filter(
      (frame): frame is PoseAwareObservationFrame =>
        frame !== null &&
        frame.landmarksCount === REQUIRED_LANDMARK_COUNT &&
        hasCompletePose(frame.pose),
    )
    .sort((a, b) => a.frameIndex - b.frameIndex)
}

function getActivePoseAwareFrontReferenceFrames(): PoseAwareObservationFrame[] {
  return getPoseAwareFrontReferenceFrames()
}

function getUsableObservationFrames(): PoseAwareObservationFrame[] {
  return getDetailedScanFrames()
    .filter(
      (frame) =>
        isUsableObservationSourceFrame(frame) &&
        isFrameUsedForPoseAwareInference(frame.index),
    )
    .map((frame) => buildPoseAwareObservationFrame(frame, "observation"))
    .filter(
      (frame): frame is PoseAwareObservationFrame => frame !== null,
    )
}

function getVisibleUsableObservationFrames(): PoseAwareObservationFrame[] {
  return getUsableObservationFrames()
}

function getPoseAwareExcludedFrames(): PoseAwareObservationFrame[] {
  return getDetailedScanFrames()
    .filter((frame) => getAuthoringFrameUsage(frame).excluded)
    .map((frame) => buildPoseAwareObservationFrame(frame, "observation"))
    .filter(
      (frame): frame is PoseAwareObservationFrame => frame !== null,
    )
    .sort((a, b) => a.frameIndex - b.frameIndex)
}

function getPoseRangeFromPoseAwareFrames(
  frames: PoseAwareObservationFrame[],
  key: keyof FacePose,
): NumberRange | null {
  return getNumberRange(frames.map((frame) => frame.pose[key]))
}

function calculatePoseAwarePoseStrength(pose: FacePose): number {
  return Number(
    Math.sqrt(pose.yaw * pose.yaw + pose.pitch * pose.pitch).toFixed(4),
  )
}

function calculatePoseAwareFrameWeight(
  pose: FacePose,
  score: number | null,
): number {
  const poseStrength = calculatePoseAwarePoseStrength(pose)
  const poseWeight = clamp(
    poseStrength / POSE_AWARE_WEIGHT_POSE_STRENGTH_NORMALIZER,
    0,
    1,
  )
  const rollPenalty = clamp(
    1 - Math.abs(pose.roll) / POSE_AWARE_WEIGHT_ROLL_PENALTY_DEG,
    0.2,
    1,
  )
  const scoreWeight =
    score !== null ? clamp(score, POSE_AWARE_MIN_SCORE_WEIGHT, 1) : 1

  return Number((poseWeight * rollPenalty * scoreWeight).toFixed(4))
}

function buildPoseAwareInferenceFrame(
  frame: ExtractedVideoFrame,
  role: PoseAwareInferenceFrame["role"],
): PoseAwareInferenceFrame | null {
  const analysis = frame.analysis

  if (!isUsableObservationSourceFrame(frame) || !analysis) {
    return null
  }

  const score = getPoseAwareCandidateScore(frame.index)

  return {
    frameId: getFrameIdFromFrame(frame),
    timestamp: frame.timestamp,
    role,
    pose: {
      yaw: analysis.pose.yaw,
      pitch: analysis.pose.pitch,
      roll: analysis.pose.roll,
    },
    poseStrength: calculatePoseAwarePoseStrength(analysis.pose),
    weight: calculatePoseAwareFrameWeight(analysis.pose, score),
    score: score ?? undefined,
    landmarkCount: analysis.landmarks.length,
    landmarkPreview: buildLandmarkPreview(analysis.landmarks),
    landmarks: analysis.landmarks,
  }
}

function getPoseAwareDatasetFrontReferenceFrames(): PoseAwareInferenceFrame[] {
  return getDetailedScanFrames()
    .filter(
      (frame) =>
        isUsableObservationSourceFrame(frame) &&
        isFrameFrontReferenceForPoseAware(frame.index),
    )
    .map((frame) => buildPoseAwareInferenceFrame(frame, "front_reference"))
    .filter(
      (frame): frame is PoseAwareInferenceFrame =>
        frame !== null && frame.landmarkCount === REQUIRED_LANDMARK_COUNT,
    )
    .sort((a, b) => Number(a.frameId) - Number(b.frameId))
}

function getPoseAwareDatasetObservationFrames(): PoseAwareInferenceFrame[] {
  return getDetailedScanFrames()
    .filter(
      (frame) =>
        isUsableObservationSourceFrame(frame) &&
        isFrameUsedForPoseAwareInference(frame.index),
    )
    .map((frame) => buildPoseAwareInferenceFrame(frame, "observation"))
    .filter(
      (frame): frame is PoseAwareInferenceFrame =>
        frame !== null && frame.landmarkCount === REQUIRED_LANDMARK_COUNT,
    )
}

function buildPoseAwareCoverageAxis(
  values: number[],
  okRange: number,
): PoseAwarePoseCoverageAxis {
  const range = getNumberRange(values)
  const width = range ? Number((range.max - range.min).toFixed(4)) : 0

  return {
    min: range ? Number(range.min.toFixed(4)) : null,
    max: range ? Number(range.max.toFixed(4)) : null,
    range: width,
    status: width >= okRange ? "ok" : "insufficient",
  }
}

function buildPoseAwareRollCoverageAxis(
  values: number[],
): PoseAwarePoseCoverageRollAxis {
  const range = getNumberRange(values)

  return {
    min: range ? Number(range.min.toFixed(4)) : null,
    max: range ? Number(range.max.toFixed(4)) : null,
    range: range ? Number((range.max - range.min).toFixed(4)) : 0,
  }
}

function buildPoseAwarePoseCoverage(
  observationFrames: PoseAwareInferenceFrame[],
): PoseAwarePoseCoverage {
  return {
    yaw: buildPoseAwareCoverageAxis(
      observationFrames.map((frame) => frame.pose.yaw),
      POSE_AWARE_YAW_COVERAGE_OK_RANGE,
    ),
    pitch: buildPoseAwareCoverageAxis(
      observationFrames.map((frame) => frame.pose.pitch),
      POSE_AWARE_PITCH_COVERAGE_OK_RANGE,
    ),
    roll: buildPoseAwareRollCoverageAxis(
      observationFrames.map((frame) => frame.pose.roll),
    ),
    mixedPoseFrameCount: observationFrames.filter(
      (frame) =>
        Math.abs(frame.pose.yaw) >= MIXED_POSE_MIN_ABS_DEG &&
        Math.abs(frame.pose.pitch) >= MIXED_POSE_MIN_ABS_DEG,
    ).length,
  }
}

function getPoseAwareInferenceDataset(): PoseAwareInferenceDataset {
  const frontReferenceFrames = getPoseAwareDatasetFrontReferenceFrames()
  const observationFrames = getPoseAwareDatasetObservationFrames()
  const poseCoverage = buildPoseAwarePoseCoverage(observationFrames)
  const warnings: string[] = []

  if (frontReferenceFrames.length === 0) {
    warnings.push("正面基準候補を1件以上選んでください。")
  }

  if (observationFrames.length < POSE_AWARE_MIN_OBSERVATION_FRAME_COUNT) {
    warnings.push(
      "推定に使うフレームが少ないため、3D候補が不安定になる可能性があります。",
    )
  }

  if (
    poseCoverage.yaw.status === "insufficient" &&
    poseCoverage.pitch.status === "insufficient"
  ) {
    warnings.push(
      "yaw / pitch の角度幅が不足しているため、奥行き推定の confidence が低くなる可能性があります。",
    )
  }

  if (
    observationFrames.some(
      (frame) => Math.abs(frame.pose.roll) >= POSE_AWARE_ROLL_WARNING_ABS_DEG,
    )
  ) {
    warnings.push(
      "roll が大きいフレームが含まれています。必要に応じて除外してください。",
    )
  }

  const status: PoseAwareInferenceDatasetStatus =
    frontReferenceFrames.length === 0
      ? "missing_front_reference"
      : observationFrames.length >= POSE_AWARE_MIN_OBSERVATION_FRAME_COUNT &&
          (poseCoverage.yaw.status === "ok" ||
            poseCoverage.pitch.status === "ok")
        ? "ready"
        : "warning"

  return {
    status,
    frontReferenceFrames,
    observationFrames,
    excludedFrameCount:
      getIdealLandmarks3DFrameSelection().excludedFrameIds.length,
    poseCoverage,
    warnings,
  }
}

function getPoseAwareMultiFrameSummary(): PoseAwareMultiFrameSummary {
  const frontReferenceFrames = getActivePoseAwareFrontReferenceFrames()
  const selectedFrontReferenceFrames = getPoseAwareFrontReferenceFrames()
  const visibleUsableObservationFrames = getVisibleUsableObservationFrames()
  const yawRange = getPoseRangeFromPoseAwareFrames(
    visibleUsableObservationFrames,
    "yaw",
  )
  const pitchRange = getPoseRangeFromPoseAwareFrames(
    visibleUsableObservationFrames,
    "pitch",
  )
  const rollRange = getPoseRangeFromPoseAwareFrames(
    visibleUsableObservationFrames,
    "roll",
  )
  const warnings: string[] = []

  if (frontReferenceFrames.length === 0) {
    warnings.push("正面基準候補を1件以上選んでください。")
  }

  if (
    visibleUsableObservationFrames.length < POSE_AWARE_MIN_OBSERVATION_FRAME_COUNT
  ) {
    warnings.push(
      "推定に使うフレームが少ないため、3D候補が不安定になる可能性があります。",
    )
  }

  const yawWidth = yawRange ? yawRange.max - yawRange.min : 0
  const pitchWidth = pitchRange ? pitchRange.max - pitchRange.min : 0

  if (
    yawWidth < POSE_AWARE_MIN_YAW_OR_PITCH_RANGE &&
    pitchWidth < POSE_AWARE_MIN_YAW_OR_PITCH_RANGE
  ) {
    warnings.push(
      "yaw / pitch の角度幅が不足しているため、奥行き推定の confidence が低くなる可能性があります。",
    )
  }

  const status: PoseAwareInferenceStatus =
    frontReferenceFrames.length === 0
      ? "missing_front_reference"
      : warnings.length > 0
        ? "warning"
        : "ready"

  return {
    status,
    frontReferenceFrameCount: frontReferenceFrames.length,
    selectedFrontReferenceFrameCount: selectedFrontReferenceFrames.length,
    usableObservationFrameCount: visibleUsableObservationFrames.length,
    excludedFrameCount:
      getIdealLandmarks3DFrameSelection().excludedFrameIds.length,
    poseRange: {
      yaw: yawRange,
      pitch: pitchRange,
      roll: rollRange,
    },
    warnings,
    frontReferenceFrameIds: [
      ...getIdealLandmarks3DFrameSelection().frontReferenceFrameIds,
    ],
    excludedFrameIds: [...getIdealLandmarks3DFrameSelection().excludedFrameIds],
  }
}

function toPoseAwareMultiFrameInferencePreview(): unknown {
  const summary = getPoseAwareMultiFrameSummary()

  return {
    status: summary.status,
    frontReferenceFrameCount: summary.frontReferenceFrameCount,
    usableObservationFrameCount: summary.usableObservationFrameCount,
    excludedFrameCount: summary.excludedFrameCount,
    poseRange: {
      yaw: summary.poseRange.yaw,
      pitch: summary.poseRange.pitch,
      roll: summary.poseRange.roll,
    },
    frontReferenceFrameIds: summary.frontReferenceFrameIds,
    excludedFrameIds: summary.excludedFrameIds,
    displayMode: "exclusiveGroups",
    warnings: summary.warnings,
  }
}

function toPoseAwareInferenceFramePreview(
  frame: PoseAwareInferenceFrame,
): unknown {
  return {
    frameId: frame.frameId,
    timestamp: Number(frame.timestamp.toFixed(3)),
    role: frame.role,
    pose: frame.pose,
    poseStrength: frame.poseStrength,
    weight: frame.weight,
    score: frame.score ?? null,
    landmarkCount: frame.landmarkCount,
    landmarkPreview: frame.landmarkPreview,
  }
}

function getPoseAwareDatasetWeightSummary(
  frames: PoseAwareInferenceFrame[],
): { average: number; min: number; max: number } {
  const weights = frames.map((frame) => frame.weight)

  if (weights.length === 0) {
    return {
      average: 0,
      min: 0,
      max: 0,
    }
  }

  return {
    average: Number(averageNumbers(weights).toFixed(4)),
    min: Number(Math.min(...weights).toFixed(4)),
    max: Number(Math.max(...weights).toFixed(4)),
  }
}

function toPoseAwareInferenceDatasetPreview(): unknown {
  const dataset = getPoseAwareInferenceDataset()

  return {
    status: dataset.status,
    frontReferenceFrameCount: dataset.frontReferenceFrames.length,
    observationFrameCount: dataset.observationFrames.length,
    excludedFrameCount: dataset.excludedFrameCount,
    poseCoverage: dataset.poseCoverage,
    weight: getPoseAwareDatasetWeightSummary(dataset.observationFrames),
    frontReferenceFramePreview: dataset.frontReferenceFrames
      .slice(0, POSE_AWARE_DATASET_FRAME_PREVIEW_COUNT)
      .map(toPoseAwareInferenceFramePreview),
    observationFramePreview: dataset.observationFrames
      .slice(0, POSE_AWARE_DATASET_FRAME_PREVIEW_COUNT)
      .map(toPoseAwareInferenceFramePreview),
    warnings: dataset.warnings,
  }
}

function degreesToRadians(degrees: number): number {
  return degrees / RAD_TO_DEG
}

function rotatePoint2D(
  point: { x: number; y: number },
  center: { x: number; y: number },
  angleRad: number,
): { x: number; y: number } {
  const dx = point.x - center.x
  const dy = point.y - center.y
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)

  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  }
}

function toSameUnitPoint(
  point: Point2D,
  center: Point2D,
  videoAspectRatio: number,
): Point2D {
  return {
    x: (point.x - center.x) * videoAspectRatio,
    y: point.y - center.y,
  }
}

function getFaceCenter2D(
  landmarks: FaceLandmark[],
): { x: number; y: number } | null {
  const finiteLandmarks = landmarks.filter(isFiniteLandmark)

  if (finiteLandmarks.length === 0) {
    return null
  }

  return {
    x: averageNumbers(finiteLandmarks.map((landmark) => landmark.x)),
    y: averageNumbers(finiteLandmarks.map((landmark) => landmark.y)),
  }
}

function getImageNormalizedLandmarks2D(
  frame: PoseAwareInferenceFrame,
): PoseAwareCorrectedLandmark2D[] | null {
  if (frame.landmarks.length !== REQUIRED_LANDMARK_COUNT) {
    return null
  }

  return frame.landmarks.map((landmark, index) => ({
    index,
    x: landmark.x,
    y: landmark.y,
  }))
}

function getImageNormalizedRollCorrectedLandmarks2D(
  frame: PoseAwareInferenceFrame,
): PoseAwareCorrectedLandmark2D[] | null {
  const center = getFaceCenter2D(frame.landmarks)

  if (!center || frame.landmarks.length !== REQUIRED_LANDMARK_COUNT) {
    return null
  }

  const rollCorrectionRad = degreesToRadians(-frame.pose.roll)

  return frame.landmarks.map((landmark, index) => {
    const rotated = rotatePoint2D(landmark, center, rollCorrectionRad)

    return {
      index,
      x: rotated.x,
      y: rotated.y,
    }
  })
}

function getRollCorrectedLandmarks2D(
  frame: PoseAwareInferenceFrame,
): PoseAwareCorrectedLandmark2D[] | null {
  const center = getFaceCenter2D(frame.landmarks)

  if (!center || frame.landmarks.length !== REQUIRED_LANDMARK_COUNT) {
    return null
  }

  const videoAspectRatio = getVideoAspectRatioForNormalization()
  const rollCorrectionRad = degreesToRadians(-frame.pose.roll)

  return frame.landmarks.map((landmark, index) => {
    const sameUnitPoint = toSameUnitPoint(
      landmark,
      center,
      videoAspectRatio,
    )
    const rotated = rotatePoint2D(
      sameUnitPoint,
      { x: 0, y: 0 },
      rollCorrectionRad,
    )

    return {
      index,
      x: rotated.x,
      y: rotated.y,
    }
  })
}

function buildPoseAwareBasePointsFromFrames(
  frontReferenceFrames: PoseAwareInferenceFrame[],
  getLandmarks: (
    frame: PoseAwareInferenceFrame,
  ) => PoseAwareCorrectedLandmark2D[] | null,
): PoseAwareBasePoint[] | null {
  const correctedFrames = frontReferenceFrames
    .map(getLandmarks)
    .filter(
      (landmarks): landmarks is PoseAwareCorrectedLandmark2D[] =>
        landmarks !== null && landmarks.length === REQUIRED_LANDMARK_COUNT,
    )

  if (correctedFrames.length === 0) {
    return null
  }

  return Array.from({ length: REQUIRED_LANDMARK_COUNT }, (_, index) => {
    const points = correctedFrames
      .map((landmarks) => landmarks[index])
      .filter((point): point is PoseAwareCorrectedLandmark2D =>
        Boolean(point) &&
        Number.isFinite(point.x) &&
        Number.isFinite(point.y),
      )

    return {
      index,
      x: Number(averageNumbers(points.map((point) => point.x)).toFixed(4)),
      y: Number(averageNumbers(points.map((point) => point.y)).toFixed(4)),
    }
  })
}

function buildRawImageNormalizedBasePoints(
  frontReferenceFrames: PoseAwareInferenceFrame[],
): PoseAwareBasePoint[] | null {
  return buildPoseAwareBasePointsFromFrames(
    frontReferenceFrames,
    getImageNormalizedLandmarks2D,
  )
}

function buildRawRollCorrectedImageNormalizedBasePoints(
  frontReferenceFrames: PoseAwareInferenceFrame[],
): PoseAwareBasePoint[] | null {
  return buildPoseAwareBasePointsFromFrames(
    frontReferenceFrames,
    getImageNormalizedRollCorrectedLandmarks2D,
  )
}

function buildPoseAwareBasePoints(
  frontReferenceFrames: PoseAwareInferenceFrame[],
): PoseAwareBasePoint[] | null {
  return buildPoseAwareBasePointsFromFrames(
    frontReferenceFrames,
    getRollCorrectedLandmarks2D,
  )
}

function createPoseAwareZHint(
  value: number,
  weight: number,
  source: PoseAwareZHint["source"],
  frameId: string,
): PoseAwareZHint | null {
  if (!Number.isFinite(value) || !Number.isFinite(weight) || weight <= 0) {
    return null
  }

  return {
    value: clamp(value, -POSE_AWARE_Z_HINT_CLAMP, POSE_AWARE_Z_HINT_CLAMP),
    weight,
    source,
    frameId,
  }
}

function collectPoseAwareZHintsForFrame(
  frame: PoseAwareInferenceFrame,
  basePoints: PoseAwareBasePoint[],
): PoseAwareZHint[][] {
  const hintsByLandmark = Array.from(
    { length: REQUIRED_LANDMARK_COUNT },
    () => [] as PoseAwareZHint[],
  )
  const correctedLandmarks = getRollCorrectedLandmarks2D(frame)

  if (!correctedLandmarks) {
    return hintsByLandmark
  }

  const yawRad = degreesToRadians(frame.pose.yaw)
  const pitchRad = degreesToRadians(frame.pose.pitch)
  const yawSin = Math.sin(yawRad)
  const pitchSin = Math.sin(pitchRad)
  const useYaw = Math.abs(frame.pose.yaw) >= POSE_AWARE_Z_MIN_COMPONENT_DEG
  const usePitch =
    Math.abs(frame.pose.pitch) >= POSE_AWARE_Z_MIN_COMPONENT_DEG
  const yawWeight = frame.weight * Math.abs(yawSin)
  const pitchWeight = frame.weight * Math.abs(pitchSin)

  correctedLandmarks.forEach((landmark, index) => {
    const basePoint = basePoints[index]

    if (!basePoint) {
      return
    }

    const dx = landmark.x - basePoint.x
    const dy = landmark.y - basePoint.y

    if (useYaw && Math.abs(yawSin) > 0.0001) {
      const hint = createPoseAwareZHint(
        dx / yawSin,
        yawWeight,
        "yaw",
        frame.frameId,
      )

      if (hint) {
        hintsByLandmark[index].push(hint)
      }
    }

    if (usePitch && Math.abs(pitchSin) > 0.0001) {
      const hint = createPoseAwareZHint(
        -dy / pitchSin,
        pitchWeight,
        "pitch",
        frame.frameId,
      )

      if (hint) {
        hintsByLandmark[index].push(hint)
      }
    }
  })

  return hintsByLandmark
}

function mergePoseAwareZHints(
  observationFrames: PoseAwareInferenceFrame[],
  basePoints: PoseAwareBasePoint[],
): PoseAwareZHint[][] {
  const mergedHints = Array.from(
    { length: REQUIRED_LANDMARK_COUNT },
    () => [] as PoseAwareZHint[],
  )

  observationFrames.forEach((frame) => {
    const frameHints = collectPoseAwareZHintsForFrame(frame, basePoints)

    frameHints.forEach((hints, index) => {
      mergedHints[index].push(...hints)
    })
  })

  return mergedHints
}

function getWeightedAverageZ(hints: PoseAwareZHint[]): number {
  const weightTotal = hints.reduce((sum, hint) => sum + hint.weight, 0)

  if (weightTotal <= 0) {
    return 0
  }

  return (
    hints.reduce((sum, hint) => sum + hint.value * hint.weight, 0) /
    weightTotal
  )
}

function getWeightedZVariance(hints: PoseAwareZHint[], average: number): number {
  const weightTotal = hints.reduce((sum, hint) => sum + hint.weight, 0)

  if (weightTotal <= 0) {
    return 0
  }

  return (
    hints.reduce(
      (sum, hint) => sum + (hint.value - average) ** 2 * hint.weight,
      0,
    ) / weightTotal
  )
}

function inferPoseAwareLandmarkConfidence(
  hints: PoseAwareZHint[],
  dataset: PoseAwareInferenceDataset,
  inferredZ: number,
): number {
  if (hints.length === 0) {
    return 0.18
  }

  const totalWeight = hints.reduce((sum, hint) => sum + hint.weight, 0)
  const variance = getWeightedZVariance(hints, inferredZ)
  const supportScore = clamp(hints.length / 12, 0, 1)
  const weightScore = clamp(totalWeight / 1.2, 0, 1)
  const coverageScore =
    (dataset.poseCoverage.yaw.status === "ok" ? 0.5 : 0) +
    (dataset.poseCoverage.pitch.status === "ok" ? 0.5 : 0)
  const varianceScore = 1 - clamp(Math.sqrt(variance) / 0.12, 0, 1)
  const frontReferenceScore = clamp(
    dataset.frontReferenceFrames.length / 3,
    0,
    1,
  )
  const observationScore = clamp(dataset.observationFrames.length / 20, 0, 1)

  return Number(
    clamp(
      supportScore * 0.24 +
        weightScore * 0.22 +
        coverageScore * 0.18 +
        varianceScore * 0.2 +
        frontReferenceScore * 0.08 +
        observationScore * 0.08,
      0,
      1,
    ).toFixed(4),
  )
}

function centerPoseAwareZValues(
  landmarks: IdealLandmark3DCandidate[],
): IdealLandmark3DCandidate[] {
  const zAverage = averageNumbers(landmarks.map((landmark) => landmark.z))

  return landmarks.map((landmark) => ({
    ...landmark,
    z: Number(
      clamp(
        landmark.z - zAverage,
        -POSE_AWARE_Z_HINT_CLAMP,
        POSE_AWARE_Z_HINT_CLAMP,
      ).toFixed(4),
    ),
  }))
}

function buildPoseAwareIdealLandmarks3DCandidateResult(
  dataset: PoseAwareInferenceDataset,
): IdealLandmarks3DCandidateResult {
  if (dataset.status === "missing_front_reference") {
    return {
      ...createInitialIdealLandmarks3DCandidateResult(),
      status: "insufficient_data",
      generationMethod: "pose_aware_weighted_z_v1",
      message:
        "正面基準候補がないため、pose-aware 3D候補を生成できません。",
    }
  }

  const basePoints = buildPoseAwareBasePoints(dataset.frontReferenceFrames)

  if (!basePoints || basePoints.length !== REQUIRED_LANDMARK_COUNT) {
    return {
      ...createInitialIdealLandmarks3DCandidateResult(),
      status: "insufficient_data",
      generationMethod: "pose_aware_weighted_z_v1",
      message:
        "正面基準候補の 478 landmarks を参照できないため、pose-aware 3D候補を生成できません。",
    }
  }

  const hintsByLandmark = mergePoseAwareZHints(
    dataset.observationFrames,
    basePoints,
  )
  const uncenteredLandmarks = basePoints.map((basePoint, index) => {
    const hints = hintsByLandmark[index] ?? []
    const z = getWeightedAverageZ(hints)
    const confidence = inferPoseAwareLandmarkConfidence(hints, dataset, z)

    return {
      index,
      x: basePoint.x,
      y: basePoint.y,
      z: Number(z.toFixed(4)),
      confidence,
      source: "pose_aware_weighted_z_v1" as const,
    }
  })
  const landmarks = centerPoseAwareZValues(uncenteredLandmarks)

  return {
    status: "generated",
    generationMethod: "pose_aware_weighted_z_v1",
    landmarkCount: landmarks.length,
    landmarks,
    landmarksPreview: landmarks.slice(0, IDEAL_LANDMARKS_3D_PREVIEW_COUNT),
    summary: buildIdealLandmarks3DCandidateSummary(landmarks, {
      frontReferenceFrameCount: dataset.frontReferenceFrames.length,
      observationFrameCount: dataset.observationFrames.length,
      excludedFrameCount: dataset.excludedFrameCount,
    }),
    message:
      "Step 2-I-B dataset から、roll 補正済み observation の yaw / pitch z hint を weighted average して生成した pose-aware 3D候補です。",
  }
}

function toPoseAwareCandidatePreview(): unknown {
  const result = idealLandmarks3DCandidateResult
  const isCurrentPoseAwareCandidate =
    result.generationMethod === "pose_aware_weighted_z_v1"

  if (!isCurrentPoseAwareCandidate) {
    return {
      status: "not_generated",
      generationMethod: "pose_aware_weighted_z_v1",
      sameAsCurrentCandidate: false,
    }
  }

  return {
    status: result.status,
    generationMethod: result.generationMethod,
    landmarkCount: result.landmarkCount,
    frontReferenceFrameCount: result.summary.frontReferenceFrameCount,
    observationFrameCount: result.summary.observationFrameCount,
    excludedFrameCount: result.summary.excludedFrameCount,
    sameAsCurrentCandidate: true,
  }
}

function formatPoseAwareStatus(status: PoseAwareInferenceStatus): string {
  const labels: Record<PoseAwareInferenceStatus, string> = {
    missing_front_reference: "missing_front_reference",
    warning: "warning",
    ready: "ready",
  }

  return labels[status]
}

function formatPoseAwareScore(score: number | null): string {
  return score === null ? "なし" : formatScore(score)
}

function renderPoseAwareMultiFramePanel(): string {
  const summary = getPoseAwareMultiFrameSummary()
  const dataset = getPoseAwareInferenceDataset()
  const activeFrames = getDetailedScanFrames().filter(
    (frame) => !getAuthoringFrameUsage(frame).excluded,
  )
  const excludedFrames = getDetailedScanFrames().filter(
    (frame) => getAuthoringFrameUsage(frame).excluded,
  )

  return `
    <div class="pose-aware-panel" aria-label="Step 2-I pose-aware multi-frame inference 準備">
      <div class="pose-aware-heading">
        <div>
          <h3>Step 2-I: pose-aware multi-frame inference 準備</h3>
          <p>フレームごとに正面基準 / 表情 / 推定に使う用途を設定できます。正面基準、表情、推定用途は重複できますが、除外だけは排他的です。Step 2-I-C では、この用途タグから pose-aware 3D候補を生成できます。</p>
        </div>
      </div>
      ${renderPoseAwareSummary(summary)}
      ${renderFrameUsageSummaryPanel()}
      ${renderPoseAwareInferenceDatasetSummary(dataset)}
      ${renderPoseAwareIdealLandmarks3DCandidatePanel(dataset)}
      ${renderAuthoringFrameUsagePanel(activeFrames, excludedFrames)}
    </div>
  `
}

function formatPoseAwareCoverageStatus(status: PoseAwareCoverageStatus): string {
  return status
}

function formatNullableDegree(value: number | null): string {
  return value === null ? "なし" : `${formatNumber(value)}°`
}

function renderPoseAwareCoverageAxis(
  label: string,
  axis: PoseAwarePoseCoverageAxis,
): string {
  return `
    <li>
      ${label} range: ${formatNullableDegree(axis.min)} 〜 ${formatNullableDegree(axis.max)} / range ${formatNumber(axis.range)}° / ${formatPoseAwareCoverageStatus(axis.status)}
    </li>
  `
}

function renderPoseAwareRollCoverageAxis(
  axis: PoseAwarePoseCoverageRollAxis,
): string {
  return `
    <li>
      roll range: ${formatNullableDegree(axis.min)} 〜 ${formatNullableDegree(axis.max)} / range ${formatNumber(axis.range)}°
    </li>
  `
}

function renderPoseAwareInferenceDatasetSummary(
  dataset: PoseAwareInferenceDataset,
): string {
  return `
    <div class="pose-aware-dataset-summary">
      <h4>Step 2-I-B: pose-aware dataset</h4>
      <dl class="pose-aware-summary-list">
        <div>
          <dt>状態</dt>
          <dd>${formatPoseAwareStatus(dataset.status)}</dd>
        </div>
        <div>
          <dt>正面基準 frames</dt>
          <dd>${dataset.frontReferenceFrames.length}件</dd>
        </div>
        <div>
          <dt>observation frames</dt>
          <dd>${dataset.observationFrames.length}件</dd>
        </div>
        <div>
          <dt>除外 frames</dt>
          <dd>${dataset.excludedFrameCount}件</dd>
        </div>
      </dl>
      <div class="pose-aware-coverage">
        <strong>pose coverage</strong>
        <ul>
          ${renderPoseAwareCoverageAxis("yaw", dataset.poseCoverage.yaw)}
          ${renderPoseAwareCoverageAxis("pitch", dataset.poseCoverage.pitch)}
          ${renderPoseAwareRollCoverageAxis(dataset.poseCoverage.roll)}
          <li>mixed pose frames: ${dataset.poseCoverage.mixedPoseFrameCount}件</li>
        </ul>
      </div>
      <div class="pose-aware-coverage">
        <strong>warnings</strong>
        ${
          dataset.warnings.length === 0
            ? `<p class="pose-aware-ready-text">なし</p>`
            : `<ul class="pose-aware-warning-list">
                ${dataset.warnings
                  .map((warning) => `<li>${escapeHtml(warning)}</li>`)
                  .join("")}
              </ul>`
        }
      </div>
      <p class="pose-aware-dataset-note">この dataset は Step 2-I-C の入力です。Step 2-G v1 の旧簡易推定は別方式として残しています。</p>
    </div>
  `
}

function renderPoseAwareIdealLandmarks3DCandidatePanel(
  dataset: PoseAwareInferenceDataset,
): string {
  const result = idealLandmarks3DCandidateResult
  const isPoseAwareCandidate =
    result.generationMethod === "pose_aware_weighted_z_v1"
  const disabled = dataset.status === "missing_front_reference"
  const disabledMessage =
    "正面基準候補がないため、pose-aware 3D候補を生成できません。"

  return `
    <div class="pose-aware-candidate-summary">
      <div class="pose-aware-candidate-heading">
        <div>
          <h4>Step 2-I-C: pose-aware 3D候補</h4>
          <p>Step 2-I-B dataset を使い、roll 補正後の yaw / pitch z hint から 478点候補を生成します。</p>
        </div>
        <button
          class="candidate-generate-button"
          type="button"
          data-generate-pose-aware-ideal-landmarks-3d-candidate="true"
          ${disabled ? "disabled" : ""}
        >
          pose-aware 3D候補を生成
        </button>
      </div>
      ${
        disabled
          ? `<p class="pose-aware-warning-text">${disabledMessage}</p>`
          : ""
      }
      ${
        isPoseAwareCandidate
          ? renderGeneratedPoseAwareCandidateSummary(result)
          : `<p class="pose-aware-dataset-note">pose-aware 3D候補はまだ生成されていません。<br />先に Step 2-I-B dataset を ready にし、生成を実行してください。</p>`
      }
      ${renderIdealFaceAssetExportPanel(result)}
    </div>
  `
}

function renderGeneratedPoseAwareCandidateSummary(
  result: IdealLandmarks3DCandidateResult,
): string {
  const dataset = getPoseAwareInferenceDataset()
  const frontReferenceDebug = buildFrontReferenceCoordinateDebug(
    dataset.frontReferenceFrames,
  )
  const candidateBounds = buildLandmarkBoundsSummary(result.landmarks)
  const aspectComparison = buildCoordinateAspectComparison(
    frontReferenceDebug.rawImageNormalizedBaseBounds,
    frontReferenceDebug.rawRollCorrectedImageNormalizedBaseBounds,
    frontReferenceDebug.sameUnitBaseBounds,
    candidateBounds,
  )
  const normalization = getCoordinateNormalizationSummary()

  return `
    <dl class="pose-aware-summary-list">
      <div>
        <dt>状態</dt>
        <dd>${result.status}</dd>
      </div>
      <div>
        <dt>生成方式</dt>
          <dd>${result.generationMethod ?? "none"}</dd>
      </div>
      <div>
        <dt>landmarks</dt>
        <dd>${result.landmarkCount}</dd>
      </div>
      <div>
        <dt>front reference frames</dt>
        <dd>${result.summary.frontReferenceFrameCount}</dd>
      </div>
      <div>
        <dt>observation frames</dt>
        <dd>${result.summary.observationFrameCount}</dd>
      </div>
      <div>
        <dt>excluded frames</dt>
        <dd>${result.summary.excludedFrameCount}</dd>
      </div>
      <div>
        <dt>z range</dt>
        <dd>${formatNumber(result.summary.zMin)} 〜 ${formatNumber(result.summary.zMax)}</dd>
      </div>
      <div>
        <dt>average confidence</dt>
        <dd>${formatNumber(result.summary.averageConfidence)}</dd>
      </div>
      <div>
        <dt>min / max confidence</dt>
        <dd>${formatNumber(result.summary.minConfidence)} / ${formatNumber(result.summary.maxConfidence)}</dd>
      </div>
      <div>
        <dt>low confidence landmarks</dt>
        <dd>${result.summary.lowConfidenceLandmarkCount}</dd>
      </div>
    </dl>
    <div class="coordinate-debug-block">
      <h5>coordinate normalization</h5>
      <dl class="pose-aware-summary-list">
        ${renderCoordinateNormalizationSummaryRows(normalization)}
      </dl>
      <h5>front reference raw image-normalized bounds</h5>
      <dl class="pose-aware-summary-list">
        <div>
          <dt>frame count</dt>
          <dd>${dataset.frontReferenceFrames.length}</dd>
        </div>
        ${renderBoundsSummaryRows(frontReferenceDebug.rawImageNormalizedBaseBounds)}
      </dl>
      <h5>front reference raw roll-corrected bounds</h5>
      <dl class="pose-aware-summary-list">
        <div>
          <dt>frame count</dt>
          <dd>${dataset.frontReferenceFrames.length}</dd>
        </div>
        ${renderBoundsSummaryRows(frontReferenceDebug.rawRollCorrectedImageNormalizedBaseBounds)}
      </dl>
      <h5>front reference same-unit base bounds</h5>
      <dl class="pose-aware-summary-list">
        <div>
          <dt>frame count</dt>
          <dd>${dataset.frontReferenceFrames.length}</dd>
        </div>
        ${renderBoundsSummaryRows(frontReferenceDebug.sameUnitBaseBounds)}
      </dl>
      <h5>candidate bounds</h5>
      <dl class="pose-aware-summary-list">
        ${renderBoundsSummaryRows(candidateBounds)}
      </dl>
      <h5>coordinate aspect debug</h5>
      <dl class="pose-aware-summary-list">
        ${renderCoordinateAspectComparisonRows(aspectComparison)}
      </dl>
    </div>
    <p class="candidate-result-note">${escapeHtml(result.message ?? "")}</p>
    ${renderIdealLandmarks3DCandidatePreview(result.landmarksPreview)}
  `
}

function renderIdealFaceAssetExportPanel(
  result: IdealLandmarks3DCandidateResult,
): string {
  const exportSummary = buildIdealFaceAssetExportSummary(result, new Date())
  const candidateBounds = buildLandmarkBoundsSummary(result.landmarks)
  const disabled = !exportSummary.canExport

  return `
    <div class="ideal-face-export-panel">
      <div class="ideal-face-export-heading">
        <div>
          <h5>IdealFace JSON export</h5>
          <p>download JSON には idealLandmarks3D ${REQUIRED_LANDMARK_COUNT}点全文を含め、JSON preview には export summary のみを表示します。</p>
        </div>
        <button
          class="ideal-face-export-button"
          type="button"
          data-download-ideal-face-asset-json="true"
          ${disabled ? "disabled" : ""}
        >
          IdealFace JSON をダウンロード
        </button>
      </div>
      ${
        exportSummary.disabledReason
          ? `<p class="pose-aware-warning-text">${escapeHtml(exportSummary.disabledReason)}</p>`
          : ""
      }
      <dl class="pose-aware-summary-list ideal-face-export-summary-list">
        <div>
          <dt>schemaVersion</dt>
          <dd>${exportSummary.schemaVersion}</dd>
        </div>
        <div>
          <dt>generationMethod</dt>
          <dd>${exportSummary.generationMethod}</dd>
        </div>
        <div>
          <dt>landmarkCount</dt>
          <dd>${exportSummary.landmarkCount}</dd>
        </div>
        <div>
          <dt>coordinateSpace</dt>
          <dd>${IDEAL_FACE_ASSET_COORDINATE_SPACE}</dd>
        </div>
        <div>
          <dt>export candidate width / height</dt>
          <dd>${formatNullableDebugNumber(candidateBounds?.width)} / ${formatNullableDebugNumber(candidateBounds?.height)}</dd>
        </div>
        <div>
          <dt>export candidate aspect ratio</dt>
          <dd>${formatNullableDebugNumber(candidateBounds?.aspectRatio)}</dd>
        </div>
        <div>
          <dt>fileName</dt>
          <dd>${escapeHtml(exportSummary.fileName)}</dd>
        </div>
        <div>
          <dt>landmarkGroups</dt>
          <dd>included (${landmarkGroupEditorState.groups.groups.length} groups)</dd>
        </div>
      </dl>
    </div>
  `
}

function renderLandmarkGroupEditorPanel(): string {
  const result = idealLandmarks3DCandidateResult
  const selectedGroup = getSelectedLandmarkGroup()
  const validationErrors = validateLandmarkGroupEditorGroups(
    landmarkGroupEditorState.groups,
  )
  const selectedIndicesText =
    selectedGroup.indices.length === 0
      ? "なし"
      : selectedGroup.indices.join(", ")
  const rangeSummary = getCurrentRangeSelectionSummary()
  const highlightSummary = getHighlightedIndexSummary()
  const canShowOverlay =
    result.status === "generated" &&
    result.landmarks.length === REQUIRED_LANDMARK_COUNT

  return `
    <section class="landmark-group-editor-panel" aria-label="ランドマークグループ編集">
      <div class="panel-heading">
        <div>
          <h2>ランドマークグループ編集</h2>
          <p>MediaPipe 478点のうち、どの点を mouth / left_eye / right_eye / face_boundary として扱うかを編集します。</p>
          <p>landmarkGroups は expressionAttenuation や将来の colorLayers が参照します。これは目だけ大きくする、鼻だけ細くする、顎だけ削るための設定ではありません。</p>
          <p>Studio の Copy Debug に出た Landmark[index] を Index highlight に貼り付けると、その点を overlay 上で確認できます。矩形範囲選択では、ドラッグした範囲内の landmark をまとめて追加 / 削除できます。</p>
        </div>
      </div>
      <div class="landmark-group-editor-layout">
        <div class="landmark-group-editor-preview">
          ${
            canShowOverlay
              ? renderLandmarkGroupEditorCanvas()
              : `<div class="landmark-group-editor-empty">
                  <p>pose-aware 3D候補を生成すると、x/y を表示用に正規化した 478点 overlay で group を編集できます。</p>
                </div>`
          }
        </div>
        <div class="landmark-group-editor-controls">
          <label class="landmark-group-select-label" for="landmark-group-select">
            Group select
          </label>
          <select id="landmark-group-select" data-landmark-group-select="true">
            ${LANDMARK_GROUP_EDITOR_GROUP_IDS.map((groupId) => {
              const group = landmarkGroupEditorState.groups.groups.find(
                (item) => item.id === groupId,
              )
              const label = group?.label ?? groupId

              return `
                <option value="${groupId}" ${
                  groupId === landmarkGroupEditorState.selectedGroupId
                    ? "selected"
                    : ""
                }>
                  ${escapeHtml(label)} (${groupId})
                </option>
              `
            }).join("")}
          </select>
          <div class="landmark-group-selection-mode" aria-label="選択モード">
            <span>選択モード</span>
            <label>
              <input
                type="radio"
                name="landmark-group-selection-mode"
                value="click"
                data-landmark-group-selection-mode="click"
                ${
                  landmarkGroupEditorState.selectionMode === "click"
                    ? "checked"
                    : ""
                }
              />
              クリック
            </label>
            <label>
              <input
                type="radio"
                name="landmark-group-selection-mode"
                value="rectangle"
                data-landmark-group-selection-mode="rectangle"
                ${
                  landmarkGroupEditorState.selectionMode === "rectangle"
                    ? "checked"
                    : ""
                }
              />
              矩形範囲
            </label>
          </div>
          <div class="landmark-group-legend" aria-label="overlay legend">
            <span><i class="legend-dot legend-dot-normal"></i>通常点</span>
            <span><i class="legend-dot legend-dot-selected"></i>selected group</span>
            <span><i class="legend-dot legend-dot-range"></i>range candidate</span>
            <span><i class="legend-dot legend-dot-highlight"></i>highlighted index</span>
          </div>
          <dl class="pose-aware-summary-list landmark-group-summary-list">
            <div>
              <dt>selected group</dt>
              <dd>${escapeHtml(selectedGroup.id)}</dd>
            </div>
            <div>
              <dt>purpose</dt>
              <dd>${escapeHtml(selectedGroup.purpose ?? "none")}</dd>
            </div>
            <div>
              <dt>count</dt>
              <dd>${selectedGroup.indices.length}</dd>
            </div>
            <div>
              <dt>topology</dt>
              <dd>${landmarkGroupEditorState.groups.topology}</dd>
            </div>
          </dl>
          <div class="landmark-group-editor-actions">
            <button class="landmark-group-action-button" type="button" data-landmark-group-action="clear-selected">
              選択中 group をクリア
            </button>
            <button class="landmark-group-action-button" type="button" data-landmark-group-action="reset-selected">
              選択中 group を初期値に戻す
            </button>
            <button class="landmark-group-action-button" type="button" data-landmark-group-action="reset-all">
              すべて初期値に戻す
            </button>
          </div>
          <div class="landmark-group-bulk-panel">
            <h3>範囲選択</h3>
            <dl class="pose-aware-summary-list landmark-group-summary-list">
              <div>
                <dt>candidate count</dt>
                <dd>${rangeSummary.count}</dd>
              </div>
              <div>
                <dt>already in group</dt>
                <dd>${rangeSummary.alreadyInSelectedGroupCount}</dd>
              </div>
              <div>
                <dt>not in group</dt>
                <dd>${rangeSummary.notInSelectedGroupCount}</dd>
              </div>
            </dl>
            <p>${escapeHtml(formatLandmarkGroupEditorIndicesPreview(rangeSummary.indices))}</p>
            <div class="landmark-group-editor-actions">
              <button class="landmark-group-action-button" type="button" data-landmark-group-action="add-range">
                範囲内の点を選択中 group に追加
              </button>
              <button class="landmark-group-action-button" type="button" data-landmark-group-action="remove-range">
                範囲内の点を選択中 group から削除
              </button>
            </div>
          </div>
          <div class="landmark-group-bulk-panel">
            <label class="landmark-group-select-label" for="landmark-group-highlight-input">
              Index highlight
            </label>
            <textarea
              id="landmark-group-highlight-input"
              class="landmark-group-highlight-input"
              rows="4"
              placeholder="1,4,5,44 または Landmark[1], Landmark[4]"
              data-landmark-group-highlight-input="true"
            >${escapeHtml(landmarkGroupEditorState.highlightedIndexInput)}</textarea>
            <dl class="pose-aware-summary-list landmark-group-summary-list">
              <div>
                <dt>extracted</dt>
                <dd>${highlightSummary.extractedCount}</dd>
              </div>
              <div>
                <dt>valid</dt>
                <dd>${highlightSummary.count}</dd>
              </div>
              <div>
                <dt>invalid</dt>
                <dd>${highlightSummary.invalidCount}</dd>
              </div>
              <div>
                <dt>already in group</dt>
                <dd>${highlightSummary.alreadyInSelectedGroupCount}</dd>
              </div>
              <div>
                <dt>not in group</dt>
                <dd>${highlightSummary.notInSelectedGroupCount}</dd>
              </div>
            </dl>
            <p>${escapeHtml(formatLandmarkGroupEditorIndicesPreview(highlightSummary.indices))}</p>
            ${
              highlightSummary.invalidCount > 0
                ? `<p class="landmark-group-validation-errors-inline">invalid: ${escapeHtml(formatLandmarkGroupEditorIndicesPreview(highlightSummary.invalidIndicesPreview))}</p>`
                : ""
            }
            <div class="landmark-group-editor-actions">
              <button class="landmark-group-action-button" type="button" data-landmark-group-action="add-highlighted">
                ハイライト中の点を選択中 group に追加
              </button>
              <button class="landmark-group-action-button" type="button" data-landmark-group-action="remove-highlighted">
                ハイライト中の点を選択中 group から削除
              </button>
              <button class="landmark-group-action-button" type="button" data-landmark-group-action="clear-highlighted">
                ハイライトをクリア
              </button>
            </div>
          </div>
          ${
            validationErrors.length === 0
              ? `<p class="landmark-group-validation-ok">landmarkGroups guard: OK</p>`
              : `<ul class="landmark-group-validation-errors">
                  ${validationErrors
                    .map((error) => `<li>${escapeHtml(error)}</li>`)
                    .join("")}
                </ul>`
          }
          <div class="landmark-group-indices-panel">
            <h3>Indices</h3>
            <p>${escapeHtml(selectedIndicesText)}</p>
          </div>
          <div class="landmark-group-future-panel">
            <h3>将来候補</h3>
            <p>${LANDMARK_GROUP_EDITOR_FUTURE_GROUP_IDS.join(", ")}</p>
          </div>
        </div>
      </div>
    </section>
  `
}

function renderLandmarkGroupEditorCanvas(): string {
  return `
    <canvas
      class="landmark-group-editor-canvas"
      data-landmark-group-editor-canvas="true"
      aria-label="Landmark Group Editor 478点 overlay"
    ></canvas>
  `
}

function renderPoseAwareSummary(
  summary: PoseAwareMultiFrameSummary,
): string {
  return `
    <div class="pose-aware-summary">
      <dl class="pose-aware-summary-list">
        <div>
          <dt>正面基準候補</dt>
          <dd>${summary.frontReferenceFrameCount}件</dd>
        </div>
        <div>
          <dt>推定に使うフレーム</dt>
          <dd>${summary.usableObservationFrameCount}件</dd>
        </div>
        <div>
          <dt>除外フレーム</dt>
          <dd>${summary.excludedFrameCount}件</dd>
        </div>
        <div>
          <dt>yaw range</dt>
          <dd>${formatNumberRange(summary.poseRange.yaw)}</dd>
        </div>
        <div>
          <dt>pitch range</dt>
          <dd>${formatNumberRange(summary.poseRange.pitch)}</dd>
        </div>
        <div>
          <dt>roll range</dt>
          <dd>${formatNumberRange(summary.poseRange.roll)}</dd>
        </div>
        <div>
          <dt>状態</dt>
          <dd>${formatPoseAwareStatus(summary.status)}</dd>
        </div>
      </dl>
      ${
        summary.warnings.length > 0
          ? `<ul class="pose-aware-warning-list">
              ${summary.warnings
                .map((warning) => `<li>${escapeHtml(warning)}</li>`)
                .join("")}
            </ul>`
          : `<p class="pose-aware-ready-text">Step 2-I の UI / state 基盤は ready です。</p>`
      }
    </div>
  `
}

function renderAuthoringFrameUsagePanel(
  activeFrames: ExtractedVideoFrame[],
  excludedFrames: ExtractedVideoFrame[],
): string {
  return `
    <div class="frame-usage-panel">
      ${renderFrameReviewCarousel(activeFrames)}
      <section class="frame-usage-section" aria-label="フレーム一覧">
        <h4>フレーム一覧（${activeFrames.length}件）</h4>
        <p>1フレーム1カードで、正面基準 / 表情 / 推定に使う用途を設定します。</p>
        ${
          activeFrames.length === 0
            ? `<p class="pose-aware-empty">detailed scan 済みの有効フレームはまだありません。</p>`
            : `<div class="frame-usage-grid">
                ${activeFrames.map(renderAuthoringFrameCard).join("")}
              </div>`
        }
      </section>
      <section class="frame-usage-section" aria-label="除外フレーム">
        <h4>除外フレーム（${excludedFrames.length}件）</h4>
        <p>除外済み frame は正面基準 / 推定 / 表情解析の処理対象から外れます。</p>
        ${
          excludedFrames.length === 0
            ? `<p class="pose-aware-empty">除外フレームはありません。</p>`
            : `<div class="frame-usage-grid">
                ${excludedFrames.map(renderExcludedAuthoringFrameCard).join("")}
              </div>`
        }
      </section>
    </div>
  `
}

function getClampedFrameReviewIndex(frameCount: number): number {
  return frameCount === 0 ? 0 : clamp(frameReviewIndex, 0, frameCount - 1)
}

function setFrameReviewIndex(nextIndex: number): void {
  const activeFrameCount = getDetailedScanFrames().filter(
    (frame) => !getAuthoringFrameUsage(frame).excluded,
  ).length

  frameReviewIndex = getClampedFrameReviewIndexForCount(
    nextIndex,
    activeFrameCount,
  )
}

function getClampedFrameReviewIndexForCount(
  nextIndex: number,
  frameCount: number,
): number {
  return frameCount === 0 ? 0 : clamp(nextIndex, 0, frameCount - 1)
}

function renderFrameReviewCarousel(activeFrames: ExtractedVideoFrame[]): string {
  frameReviewIndex = getClampedFrameReviewIndex(activeFrames.length)

  if (activeFrames.length === 0) {
    return `
      <section class="frame-usage-section frame-review-carousel" aria-label="フレームレビュー">
        <h4>フレームレビュー</h4>
        <p>detailed scan 済みの有効フレームを大きく確認できます。</p>
        <p class="pose-aware-empty">レビュー対象のフレームはまだありません。</p>
      </section>
    `
  }

  const frame = activeFrames[frameReviewIndex]
  const usage = getAuthoringFrameUsage(frame)
  const analysis = frame.analysis
  const pose = analysis?.pose ?? EMPTY_FACE_POSE
  const landmarksCount = analysis?.landmarks.length ?? 0
  const frameId = getFrameIdFromFrame(frame)
  const warningText =
    usage.warningReasons.length > 0 ? usage.warningReasons.join(", ") : "なし"
  const excludedReasonText = usage.excludedReason ?? "なし"
  const frontReferenceWarning =
    usage.frontReference && usage.warningReasons.includes("poseOutOfRange")
      ? "正面基準には不向きな pose です。"
      : null

  return `
    <section class="frame-usage-section frame-review-carousel" aria-label="フレームレビュー">
      <div class="frame-review-heading">
        <div>
          <h4>フレームレビュー</h4>
          <p>1フレームを大きく確認しながら、正面基準 / 表情 / 推定に使う / 除外を調整します。</p>
        </div>
        <strong>${frameReviewIndex + 1} / ${activeFrames.length}</strong>
      </div>
      <div class="frame-review-card">
        <figure class="frame-review-preview">
          <img src="${escapeHtml(frame.analysisImageUrl || frame.thumbnailUrl)}" alt="Frame ${String(frame.index).padStart(3, "0")} / ${frame.timestamp.toFixed(3)}s" />
          <figcaption>Frame ${escapeHtml(frameId)} / ${frame.timestamp.toFixed(3)}s</figcaption>
        </figure>
        <div class="frame-review-details">
          <div class="frame-review-nav" aria-label="フレームレビュー移動">
            <button
              class="candidate-label-button pose-aware-inline-action"
              type="button"
              data-frame-review-step="-1"
              ${frameReviewIndex === 0 ? "disabled" : ""}
            >
              前へ
            </button>
            <button
              class="candidate-label-button pose-aware-inline-action"
              type="button"
              data-frame-review-step="1"
              ${frameReviewIndex === activeFrames.length - 1 ? "disabled" : ""}
            >
              次へ
            </button>
          </div>
          <div class="frame-usage-controls frame-review-controls">
            <label>
              <input
                type="checkbox"
                data-frame-usage-front-reference="${escapeHtml(frameId)}"
                ${usage.frontReference ? "checked" : ""}
              />
              正面基準
            </label>
            <label class="frame-usage-expression-control">
              <span>表情</span>
              <select data-frame-usage-expression="${escapeHtml(frameId)}">
                ${FRAME_EXPRESSION_GROUP_IDS.map(
                  (groupId) => `
                    <option value="${groupId}" ${
                      usage.expressionGroup === groupId ? "selected" : ""
                    }>
                      ${groupId}
                    </option>
                  `,
                ).join("")}
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                data-frame-usage-inference="${escapeHtml(frameId)}"
                ${usage.useForInference ? "checked" : ""}
              />
              推定に使う
            </label>
          </div>
          <button
            class="candidate-label-button pose-aware-inline-action"
            type="button"
            data-frame-usage-exclude="${escapeHtml(frameId)}"
          >
            除外する
          </button>
          <dl class="frame-review-debug">
            <div>
              <dt>自動判定</dt>
              <dd>${escapeHtml(usage.autoExpressionGroup)}</dd>
            </div>
            <div>
              <dt>warning</dt>
              <dd class="${usage.warningReasons.length > 0 ? "frame-usage-warning" : ""}">${escapeHtml(warningText)}</dd>
            </div>
            <div>
              <dt>除外理由</dt>
              <dd>${escapeHtml(excludedReasonText)}</dd>
            </div>
            <div>
              <dt>pose</dt>
              <dd>yaw ${formatNumber(pose.yaw)} / pitch ${formatNumber(pose.pitch)} / roll ${formatNumber(pose.roll)}</dd>
            </div>
            <div>
              <dt>landmarks</dt>
              <dd>${landmarksCount}</dd>
            </div>
            <div>
              <dt>score</dt>
              <dd>${formatPoseAwareScore(getPoseAwareCandidateScore(frame.index))}</dd>
            </div>
          </dl>
          ${
            frontReferenceWarning
              ? `<p class="frame-usage-warning">${escapeHtml(frontReferenceWarning)}</p>`
              : ""
          }
        </div>
      </div>
    </section>
  `
}

function renderAuthoringFrameCard(frame: ExtractedVideoFrame): string {
  const usage = getAuthoringFrameUsage(frame)
  const analysis = frame.analysis
  const pose = analysis?.pose ?? EMPTY_FACE_POSE
  const landmarksCount = analysis?.landmarks.length ?? 0
  const frameId = getFrameIdFromFrame(frame)
  const warningText = usage.warningReasons.join(", ")
  const frontReferenceWarning =
    usage.frontReference && usage.warningReasons.includes("poseOutOfRange")
      ? "正面基準には不向きな pose です。"
      : null

  return `
    <article class="frame-usage-card">
      <img src="${escapeHtml(frame.thumbnailUrl)}" alt="Frame ${String(frame.index).padStart(3, "0")} / ${frame.timestamp.toFixed(3)}s" />
      <div class="frame-usage-card-body">
        <h4>Frame ${escapeHtml(frameId)} / ${frame.timestamp.toFixed(3)}s</h4>
        <div class="frame-usage-controls">
          <label>
            <input
              type="checkbox"
              data-frame-usage-front-reference="${escapeHtml(frameId)}"
              ${usage.frontReference ? "checked" : ""}
            />
            正面基準
          </label>
          <label class="frame-usage-expression-control">
            <span>表情</span>
            <select data-frame-usage-expression="${escapeHtml(frameId)}">
              ${FRAME_EXPRESSION_GROUP_IDS.map(
                (groupId) => `
                  <option value="${groupId}" ${
                    usage.expressionGroup === groupId ? "selected" : ""
                  }>
                    ${groupId}
                  </option>
                `,
              ).join("")}
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              data-frame-usage-inference="${escapeHtml(frameId)}"
              ${usage.useForInference ? "checked" : ""}
            />
            推定に使う
          </label>
        </div>
        <button
          class="candidate-label-button pose-aware-inline-action"
          type="button"
          data-frame-usage-exclude="${escapeHtml(frameId)}"
        >
          除外する
        </button>
        <div class="frame-usage-meta">
          ${
            warningText
              ? `<span class="frame-usage-warning">warning: ${escapeHtml(warningText)}</span>`
              : ""
          }
          ${
            frontReferenceWarning
              ? `<span class="frame-usage-warning">${escapeHtml(frontReferenceWarning)}</span>`
              : ""
          }
          <span>自動判定: ${escapeHtml(usage.autoExpressionGroup)}</span>
          <span>pose: yaw ${formatNumber(pose.yaw)} / pitch ${formatNumber(pose.pitch)} / roll ${formatNumber(pose.roll)}</span>
          <span>landmarks 数: ${landmarksCount}</span>
          <span>score: ${formatPoseAwareScore(getPoseAwareCandidateScore(frame.index))}</span>
        </div>
      </div>
    </article>
  `
}

function renderExcludedAuthoringFrameCard(frame: ExtractedVideoFrame): string {
  const usage = getAuthoringFrameUsage(frame)
  const frameId = getFrameIdFromFrame(frame)

  return `
    <article class="frame-usage-card frame-usage-card-excluded">
      <img src="${escapeHtml(frame.thumbnailUrl)}" alt="Frame ${String(frame.index).padStart(3, "0")} / ${frame.timestamp.toFixed(3)}s" />
      <div class="frame-usage-card-body">
        <h4>Frame ${escapeHtml(frameId)} / ${frame.timestamp.toFixed(3)}s</h4>
        <div class="frame-usage-meta">
          <span>除外理由: ${escapeHtml(usage.excludedReason ?? "manual")}</span>
          ${
            usage.warningReasons.length > 0
              ? `<span class="frame-usage-warning">warning: ${escapeHtml(usage.warningReasons.join(", "))}</span>`
              : ""
          }
          <span>自動判定: ${escapeHtml(usage.autoExpressionGroup)}</span>
        </div>
        <button
          class="candidate-label-button pose-aware-inline-action"
          type="button"
          data-frame-usage-restore="${escapeHtml(frameId)}"
        >
          復元する
        </button>
      </div>
    </article>
  `
}

function renderFrameUsageSummaryPanel(): string {
  const summary = getFrameUsageSummary()

  return `
    <div class="pose-aware-coverage">
      <strong>frame usage summary</strong>
      <ul>
        <li>source frames: ${summary.sourceFrameCount}件</li>
        <li>frontReference: ${summary.frontReferenceCount}件</li>
        <li>useForInference: ${summary.useForInferenceCount}件</li>
        <li>excluded: ${summary.excludedCount}件</li>
      </ul>
      <strong>expressionGroup counts</strong>
      <ul>
        ${FRAME_EXPRESSION_GROUP_IDS.map(
          (groupId) =>
            `<li>${groupId}: ${summary.expressionGroupCounts[groupId]}件</li>`,
        ).join("")}
      </ul>
      <strong>除外理由</strong>
      <ul>
        ${EXCLUDED_REASON_IDS.map(
          (reason) =>
            `<li>${reason}: ${summary.excludedReasonCounts[reason]}件</li>`,
        ).join("")}
      </ul>
      <strong>注意タグ</strong>
      <ul>
        ${WARNING_REASON_IDS.map(
          (reason) =>
            `<li>${reason}: ${summary.warningReasonCounts[reason]}件</li>`,
        ).join("")}
      </ul>
    </div>
  `
}

function renderIdealLandmarks3DCandidatePreview(
  landmarksPreview: IdealLandmark3DCandidate[],
): string {
  if (landmarksPreview.length === 0) {
    return `<p class="landmark-preview-empty">3D landmark preview: なし</p>`
  }

  return `
    <div class="ideal-3d-preview">
      <span>先頭 ${landmarksPreview.length} 点 preview</span>
      <ol>
        ${landmarksPreview
          .map(
            (landmark) => `
              <li>#${landmark.index}: x ${landmark.x} / y ${landmark.y} / z ${landmark.z} / confidence ${landmark.confidence}</li>
            `,
          )
          .join("")}
      </ol>
    </div>
  `
}

function renderPointCloudPresetButton(
  preset: PointCloudPreviewPreset,
): string {
  const isActive = isPointCloudPresetActive(preset)

  return `
    <button
      class="point-cloud-preset-button${isActive ? " point-cloud-preset-button-active" : ""}"
      type="button"
      data-point-cloud-preset="${preset}"
      aria-pressed="${isActive ? "true" : "false"}"
    >
      ${formatPointCloudPreviewPreset(preset)}
    </button>
  `
}

function isPointCloudPresetActive(preset: PointCloudPreviewPreset): boolean {
  if (preset === "reset") {
    return false
  }

  const presetCamera = getPointCloudPreviewPresetCamera(preset)

  return (
    Math.abs(pointCloudPreviewCamera.yaw - presetCamera.yaw) < 0.0001 &&
    Math.abs(pointCloudPreviewCamera.pitch - presetCamera.pitch) < 0.0001 &&
    pointCloudPreviewCamera.zoom === 1 &&
    pointCloudPreviewCamera.panX === 0 &&
    pointCloudPreviewCamera.panY === 0
  )
}

function renderIdealLandmarks3DPointCloudPreviewPanel(): string {
  const result = idealLandmarks3DCandidateResult
  const hasGeneratedLandmarks =
    result.status === "generated" && result.landmarks.length > 0
  const summary = getPointCloudPreviewSummary(
    hasGeneratedLandmarks ? result.landmarks : [],
  )
  const normalization = getCoordinateNormalizationSummary()

  return `
    <section class="point-cloud-preview-panel" aria-label="3D点群 preview">
      <div class="panel-heading">
        <div>
          <h2>3D点群 preview</h2>
          <p>生成された idealLandmarks3D 候補を 1 つの viewport で確認します。</p>
        </div>
      </div>
      <div class="point-cloud-controls" aria-label="preview camera">
        <span>視点 preset:</span>
        ${renderPointCloudPresetButton("front")}
        ${renderPointCloudPresetButton("side")}
        ${renderPointCloudPresetButton("top")}
        ${renderPointCloudPresetButton("reset")}
      </div>
      <p class="point-cloud-preview-note">この preview は確認用表示です。マウス操作で視点を変更できますが、生成済み 3D 候補データ自体は変更していません。</p>
      ${
        hasGeneratedLandmarks
          ? renderIdealLandmarks3DPointCloudCanvas()
          : `<div class="point-cloud-empty">
              <p>3D 478点候補がまだ生成されていません。<br />先に「3D候補を生成」を実行してください。</p>
            </div>`
      }
      <dl class="point-cloud-summary-list">
        <div>
          <dt>landmark count</dt>
          <dd>${summary.landmarkCount}</dd>
        </div>
        <div>
          <dt>generation method</dt>
          <dd>${result.generationMethod ?? "none"}</dd>
        </div>
        <div>
          <dt>normalization mode</dt>
          <dd>${normalization.mode}</dd>
        </div>
        <div>
          <dt>normalization x / y scale</dt>
          <dd>${formatNumber(normalization.xScale)} / ${formatNumber(normalization.yScale)}</dd>
        </div>
        <div>
          <dt>視点</dt>
          <dd data-point-cloud-camera-label>${formatPointCloudCamera(pointCloudPreviewCamera)}</dd>
        </div>
        <div>
          <dt>x min / max</dt>
          <dd>${formatNumberRange(summary.xRange)}</dd>
        </div>
        <div>
          <dt>y min / max</dt>
          <dd>${formatNumberRange(summary.yRange)}</dd>
        </div>
        <div>
          <dt>z min / max</dt>
          <dd>${formatNumberRange(summary.zRange)}</dd>
        </div>
        <div>
          <dt>width / height</dt>
          <dd>${formatNumber(summary.width)} / ${formatNumber(summary.height)}</dd>
        </div>
        <div>
          <dt>aspect ratio</dt>
          <dd>${formatNullableDebugNumber(summary.aspectRatio)}</dd>
        </div>
        <div>
          <dt>average confidence</dt>
          <dd>${formatNumber(summary.averageConfidence)}</dd>
        </div>
        <div>
          <dt>min / max confidence</dt>
          <dd>${formatNumber(summary.minConfidence)} / ${formatNumber(summary.maxConfidence)}</dd>
        </div>
      </dl>
    </section>
  `
}

function renderIdealLandmarks3DPointCloudCanvas(): string {
  return `
    <canvas
      class="point-cloud-preview"
      data-point-cloud-canvas="true"
      aria-label="3D 478点候補 interactive preview"
    ></canvas>
  `
}

function updatePointCloudCameraLabel(): void {
  const label = document.querySelector<HTMLElement>(
    "[data-point-cloud-camera-label]",
  )

  if (label) {
    label.textContent = formatPointCloudCamera(pointCloudPreviewCamera)
  }

  document
    .querySelectorAll<HTMLButtonElement>("[data-point-cloud-preset]")
    .forEach((button) => {
      const preset = button.dataset.pointCloudPreset
      const isActive =
        isPointCloudPreviewPreset(preset) && isPointCloudPresetActive(preset)

      button.classList.toggle("point-cloud-preset-button-active", isActive)
      button.setAttribute("aria-pressed", isActive ? "true" : "false")
    })
}

function drawPointCloudPreviewCanvas(): void {
  const canvas = document.querySelector<HTMLCanvasElement>(
    "[data-point-cloud-canvas]",
  )
  const result = idealLandmarks3DCandidateResult

  if (
    !canvas ||
    result.status !== "generated" ||
    result.landmarks.length === 0
  ) {
    return
  }

  const context = canvas.getContext("2d")

  if (!context) {
    return
  }

  const rect = canvas.getBoundingClientRect()
  const width = Math.max(1, rect.width)
  const height = Math.max(1, rect.height)
  const devicePixelRatio = window.devicePixelRatio || 1

  canvas.width = Math.round(width * devicePixelRatio)
  canvas.height = Math.round(height * devicePixelRatio)
  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
  context.clearRect(0, 0, width, height)
  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, width, height)
  drawPointCloudPreviewGuide(context, width, height)

  const previewCenter = getPointCloudPreviewDataCenter(result.landmarks)
  const rotatedPoints = result.landmarks.map((landmark) =>
    rotatePointForPointCloudPreview(
      toPointCloudPreviewLocalPoint(landmark, previewCenter),
      pointCloudPreviewCamera,
    ),
  )
  const bounds = getRotatedPointCloudBounds(rotatedPoints)
  const drawableSize =
    Math.min(width, height) - POINT_CLOUD_PREVIEW_PADDING * 2
  const scale = drawableSize * bounds.scale * pointCloudPreviewCamera.zoom
  const centerX = width / 2 + pointCloudPreviewCamera.panX
  const centerY = height / 2 + pointCloudPreviewCamera.panY
  const pointsToDraw = result.landmarks
    .map((landmark, index) => {
      const rotated = rotatedPoints[index]

      return {
        landmark,
        depth: rotated.z,
        x: centerX + (rotated.x - bounds.centerX) * scale,
        y: centerY - (rotated.y - bounds.centerY) * scale,
      }
    })
    .sort((a, b) => a.depth - b.depth)

  for (const point of pointsToDraw) {
    context.beginPath()
    context.arc(point.x, point.y, 2.3, 0, Math.PI * 2)
    context.fillStyle = `rgba(217, 79, 69, ${getConfidenceOpacity(
      point.landmark.confidence,
    )})`
    context.fill()
  }

  updatePointCloudCameraLabel()
}

function drawLandmarkGroupEditorCanvas(): void {
  const canvas = document.querySelector<HTMLCanvasElement>(
    "[data-landmark-group-editor-canvas]",
  )
  const result = idealLandmarks3DCandidateResult

  if (
    !canvas ||
    result.status !== "generated" ||
    result.landmarks.length !== REQUIRED_LANDMARK_COUNT
  ) {
    return
  }

  const context = canvas.getContext("2d")

  if (!context) {
    return
  }

  const rect = canvas.getBoundingClientRect()
  const width = Math.max(1, rect.width)
  const height = Math.max(1, rect.height)
  const devicePixelRatio = window.devicePixelRatio || 1
  const points = getLandmarkGroupEditorCanvasPoints(
    result.landmarks,
    width,
    height,
  )
  const selectedIndexSet = new Set(getSelectedLandmarkGroup().indices)
  const activeRangeSelection = getActiveLandmarkGroupEditorRangeSelection()
  const rangeIndexSet = new Set(
    activeRangeSelection
      ? getLandmarkGroupEditorIndicesInRange(points, activeRangeSelection)
      : [],
  )
  const highlightedIndexSet = new Set(getHighlightedIndexSummary().indices)

  canvas.width = Math.round(width * devicePixelRatio)
  canvas.height = Math.round(height * devicePixelRatio)
  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
  context.clearRect(0, 0, width, height)
  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, width, height)

  context.strokeStyle = "#d9e4df"
  context.lineWidth = 1
  context.strokeRect(
    LANDMARK_GROUP_EDITOR_CANVAS_PADDING,
    LANDMARK_GROUP_EDITOR_CANVAS_PADDING,
    width - LANDMARK_GROUP_EDITOR_CANVAS_PADDING * 2,
    height - LANDMARK_GROUP_EDITOR_CANVAS_PADDING * 2,
  )

  for (const point of points) {
    const selected = selectedIndexSet.has(point.index)
    const rangeCandidate = rangeIndexSet.has(point.index)
    const highlighted = highlightedIndexSet.has(point.index)
    const radius = selected ? 4.4 : rangeCandidate || highlighted ? 3.8 : 2.2
    const fillStyle = selected
      ? "#d94f45"
      : rangeCandidate
        ? "#2f78c4"
        : highlighted
          ? "#c98518"
          : "#9fb4ad"

    context.beginPath()
    context.arc(point.x, point.y, radius, 0, Math.PI * 2)
    context.fillStyle = fillStyle
    context.fill()

    if (highlighted || rangeCandidate || selected) {
      context.strokeStyle = selected
        ? "#7d2a28"
        : rangeCandidate
          ? "#184f8b"
          : "#7a510c"
      context.lineWidth = selected ? 1.4 : 1.2
      context.stroke()
    }
  }

  if (activeRangeSelection) {
    const normalizedRange = normalizeLandmarkGroupEditorRange(
      activeRangeSelection,
    )

    context.fillStyle = "rgba(47, 120, 196, 0.12)"
    context.strokeStyle = "#2f78c4"
    context.lineWidth = 1.5
    context.fillRect(
      normalizedRange.xMin,
      normalizedRange.yMin,
      normalizedRange.width,
      normalizedRange.height,
    )
    context.strokeRect(
      normalizedRange.xMin,
      normalizedRange.yMin,
      normalizedRange.width,
      normalizedRange.height,
    )
  }

  context.fillStyle = "#25342e"
  context.font = "700 12px system-ui, sans-serif"
  context.fillText(
    `${getSelectedLandmarkGroup().id}: ${selectedIndexSet.size} / ${REQUIRED_LANDMARK_COUNT}`,
    12,
    20,
  )
}

function getActiveLandmarkGroupEditorRangeSelection(): LandmarkGroupEditorRangeSelection | null {
  if (landmarkGroupEditorDragState) {
    return {
      startX: landmarkGroupEditorDragState.startX,
      startY: landmarkGroupEditorDragState.startY,
      endX: landmarkGroupEditorDragState.currentX,
      endY: landmarkGroupEditorDragState.currentY,
    }
  }

  return landmarkGroupEditorState.rangeSelection
}

function getLandmarkGroupEditorCanvasPoints(
  landmarks: IdealLandmark3DCandidate[],
  width: number,
  height: number,
): LandmarkGroupEditorCanvasPoint[] {
  const bounds = buildLandmarkBoundsSummary(landmarks)

  if (!bounds || bounds.width === 0 || bounds.height === 0) {
    return landmarks.map((landmark) => ({
      index: landmark.index,
      x: width / 2,
      y: height / 2,
    }))
  }

  const drawableWidth = Math.max(
    1,
    width - LANDMARK_GROUP_EDITOR_CANVAS_PADDING * 2,
  )
  const drawableHeight = Math.max(
    1,
    height - LANDMARK_GROUP_EDITOR_CANVAS_PADDING * 2,
  )
  const scale = Math.min(
    drawableWidth / bounds.width,
    drawableHeight / bounds.height,
  )
  const fittedWidth = bounds.width * scale
  const fittedHeight = bounds.height * scale
  const offsetX = (width - fittedWidth) / 2
  const offsetY = (height - fittedHeight) / 2

  return landmarks.map((landmark) => ({
    index: landmark.index,
    x: offsetX + (landmark.x - bounds.xMin) * scale,
    y: offsetY + (landmark.y - bounds.yMin) * scale,
  }))
}

function findNearestLandmarkGroupEditorPoint(
  points: LandmarkGroupEditorCanvasPoint[],
  x: number,
  y: number,
): LandmarkGroupEditorCanvasPoint | null {
  let nearestPoint: LandmarkGroupEditorCanvasPoint | null = null
  let nearestDistance = Number.POSITIVE_INFINITY

  for (const point of points) {
    const distance = Math.hypot(point.x - x, point.y - y)

    if (distance < nearestDistance) {
      nearestPoint = point
      nearestDistance = distance
    }
  }

  return nearestPoint &&
    nearestDistance <= LANDMARK_GROUP_EDITOR_HIT_RADIUS_PX
    ? nearestPoint
    : null
}

function getLandmarkGroupEditorIndicesInRange(
  points: LandmarkGroupEditorCanvasPoint[],
  rangeSelection: LandmarkGroupEditorRangeSelection,
): number[] {
  const range = normalizeLandmarkGroupEditorRange(rangeSelection)

  return points
    .filter(
      (point) =>
        point.x >= range.xMin &&
        point.x <= range.xMax &&
        point.y >= range.yMin &&
        point.y <= range.yMax,
    )
    .map((point) => point.index)
}

function normalizeLandmarkGroupEditorRange(
  rangeSelection: LandmarkGroupEditorRangeSelection,
): {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  width: number
  height: number
} {
  const xMin = Math.min(rangeSelection.startX, rangeSelection.endX)
  const xMax = Math.max(rangeSelection.startX, rangeSelection.endX)
  const yMin = Math.min(rangeSelection.startY, rangeSelection.endY)
  const yMax = Math.max(rangeSelection.startY, rangeSelection.endY)

  return {
    xMin,
    xMax,
    yMin,
    yMax,
    width: xMax - xMin,
    height: yMax - yMin,
  }
}

function drawPointCloudPreviewGuide(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const centerX = width / 2 + pointCloudPreviewCamera.panX
  const centerY = height / 2 + pointCloudPreviewCamera.panY

  context.strokeStyle = "#d9e4df"
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(POINT_CLOUD_PREVIEW_PADDING, centerY)
  context.lineTo(width - POINT_CLOUD_PREVIEW_PADDING, centerY)
  context.moveTo(centerX, POINT_CLOUD_PREVIEW_PADDING)
  context.lineTo(centerX, height - POINT_CLOUD_PREVIEW_PADDING)
  context.stroke()

  context.fillStyle = "#5d675f"
  context.font = "700 12px system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
  context.fillText(
    `z preview x${POINT_CLOUD_DEPTH_DISPLAY_SCALE.toFixed(1)}`,
    POINT_CLOUD_PREVIEW_PADDING,
    height - POINT_CLOUD_PREVIEW_PADDING,
  )
}

function renderAnalysisPanel(): string {
  const summary = getDetailedScanSummary()
  const hasVideo = Boolean(videoSource?.objectUrl && !videoSource.error)
  const isAnalyzing = videoSource?.isAnalyzing ?? false
  const isExtracting = videoSource?.isExtracting ?? false
  const disabled = !hasVideo || isAnalyzing || isExtracting
  const statusText = videoSource?.analysisError
    ? videoSource.analysisError
    : isAnalyzing
      ? "動画全体を詳細スキャン中です。"
      : isExtracting
        ? "表示用フレーム抽出後に詳細スキャンできます。"
      : hasVideo
        ? "動画全体を細かくスキャンし、代表フレーム候補を抽出できます。"
        : "MP4 動画の選択後に詳細スキャンできます。"

  return `
    <section class="analysis-panel" aria-label="フレーム解析">
      <div class="panel-heading">
        <div>
          <h2>詳細スキャン</h2>
          <p>表示用抽出とは別に、候補抽出用として動画全体を細かく解析します。</p>
        </div>
        <button id="analyze-frames-button" class="analysis-button" type="button" ${disabled ? "disabled" : ""}>
          詳細スキャンを実行
        </button>
      </div>
      <p class="status-text">${escapeHtml(statusText)}</p>
      <dl class="analysis-summary">
        <div>
          <dt>スキャン間隔</dt>
          <dd>${summary.scanIntervalSec.toFixed(3)}s</dd>
        </div>
        <div>
          <dt>最大スキャン数</dt>
          <dd>${summary.maxScanFrames}</dd>
        </div>
        <div>
          <dt>解析対象フレーム数</dt>
          <dd>${summary.scannedFrameCount}</dd>
        </div>
        <div>
          <dt>解析済みフレーム数</dt>
          <dd>${summary.analyzedFrameCount}</dd>
        </div>
        <div>
          <dt>顔検出あり</dt>
          <dd>${summary.detectedFrameCount}</dd>
        </div>
        <div>
          <dt>候補抽出対象</dt>
          <dd>${summary.candidateSourceFrameCount}</dd>
        </div>
      </dl>
      <p class="candidate-note">詳細スキャン済みの有効フレームは Step 2-I の正面基準候補 / 推定に使うフレーム / 除外フレームとして扱います。</p>
    </section>
  `
}

function formatExpressionGroupingStatus(
  status: ExpressionGroupingStatus,
): string {
  return status
}

function renderExpressionFramePreviewList(
  frames: ExpressionFramePreview[],
): string {
  const previewFrames = frames.slice(0, EXPRESSION_FRAME_PREVIEW_COUNT)
  const omittedCount = Math.max(
    0,
    frames.length - EXPRESSION_FRAME_PREVIEW_COUNT,
  )

  if (previewFrames.length === 0) {
    return `<span class="expression-frame-preview-empty">なし</span>`
  }

  return `
    <span class="expression-frame-preview">
      ${previewFrames.map((frame) => escapeHtml(frame.frameId)).join(", ")}
      ${omittedCount > 0 ? ` / 他 ${omittedCount}件` : ""}
    </span>
  `
}

function renderExpressionGroupingPanel(): string {
  const summary = getExpressionGroupingSummary()

  return `
    <section class="expression-grouping-panel" aria-label="表情フレーム分類">
      <div class="panel-heading">
        <div>
          <h2>自動表情判定</h2>
          <p>detailed scan 済み frames の blendshape score から、表情 dropdown の初期値を作ります。3D生成や landmarkFollowStrengths 生成はまだ行いません。</p>
        </div>
      </div>
      <dl class="pose-aware-summary-list expression-grouping-summary-list">
        <div>
          <dt>状態</dt>
          <dd>${formatExpressionGroupingStatus(summary.status)}</dd>
        </div>
        <div>
          <dt>source frames</dt>
          <dd>${summary.sourceFrameCount}件</dd>
        </div>
        <div>
          <dt>none</dt>
          <dd>${summary.noneExpressionFrameCount}件</dd>
        </div>
        <div>
          <dt>mixedExpression</dt>
          <dd>${summary.mixedExpressionFrameCount}件</dd>
        </div>
        <div>
          <dt>表情分類除外</dt>
          <dd>${summary.excludedFrameCount}件</dd>
        </div>
        <div>
          <dt>Step 2-I 除外</dt>
          <dd>${summary.step2IExcludedFrameCount}件</dd>
        </div>
      </dl>
      <div class="expression-grouping-grid">
        ${summary.expressionGroups
          .map(
            (group) => `
              <article class="expression-group-card">
                <h3>${escapeHtml(group.id)}</h3>
                <strong>${group.frameCount}件</strong>
                <p>frame ids: ${renderExpressionFramePreviewList(group.frames)}</p>
              </article>
            `,
          )
          .join("")}
        <article class="expression-group-card">
          <h3>mixedExpression</h3>
          <strong>${summary.mixedExpressionFrameCount}件</strong>
          <p>frame ids: ${renderExpressionFramePreviewList(summary.mixedExpressionFrames)}</p>
        </article>
        <article class="expression-group-card expression-group-card-excluded">
          <h3>excluded</h3>
          <strong>${summary.excludedFrameCount}件</strong>
          <p>frame ids: ${renderExpressionFramePreviewList(summary.excludedFrames)}</p>
        </article>
      </div>
      <div class="pose-aware-coverage">
        <strong>除外理由</strong>
        <ul>
          <li>顔検出なし: ${summary.excludedBreakdown.noFaceFrameCount}件</li>
          <li>landmarks 不正: ${summary.excludedBreakdown.invalidLandmarkFrameCount}件</li>
        </ul>
        <strong>注意タグ</strong>
        <ul>
          <li>poseOutOfRange: ${summary.warningBreakdown.extremePoseFrameCount}件</li>
          <li>mixedExpression: ${summary.warningBreakdown.mixedExpressionFrameCount}件</li>
          <li>pending: ${summary.warningBreakdown.pendingFrameCount}件</li>
          <li>missingBlendshapes: ${summary.warningBreakdown.missingBlendshapeFrameCount}件</li>
        </ul>
      </div>
      <div class="pose-aware-coverage">
        <strong>警告</strong>
        ${
          summary.warnings.length === 0
            ? `<p class="pose-aware-ready-text">なし</p>`
            : `<ul class="pose-aware-warning-list">
                ${summary.warnings
                  .map((warning) => `<li>${escapeHtml(warning)}</li>`)
                  .join("")}
              </ul>`
        }
      </div>
    </section>
  `
}

function toScanSummaryPreview(scanSummary: DetailedScanSummary): unknown {
  return {
    scanIntervalSec: scanSummary.scanIntervalSec,
    maxScanFrames: scanSummary.maxScanFrames,
    scannedFrameCount: scanSummary.scannedFrameCount,
    analyzedFrameCount: scanSummary.analyzedFrameCount,
    detectedFrameCount: scanSummary.detectedFrameCount,
    candidateSourceFrameCount: scanSummary.candidateSourceFrameCount,
  }
}

function toExpressionFrameIdPreview(
  frames: ExpressionFramePreview[],
): string[] {
  return frames
    .slice(0, EXPRESSION_FRAME_PREVIEW_COUNT)
    .map((frame) => frame.frameId)
}

function toExpressionFrameTimestampPreview(
  frames: ExpressionFramePreview[],
): number[] {
  return frames
    .slice(0, EXPRESSION_FRAME_PREVIEW_COUNT)
    .map((frame) => frame.timestamp)
}

function toExpressionGroupPreview(
  group: ExpressionGroupFrameSummary,
): unknown {
  return {
    id: group.id,
    frameCount: group.frameCount,
    frameIdPreview: toExpressionFrameIdPreview(group.frames),
    timestampPreview: toExpressionFrameTimestampPreview(group.frames),
    omittedFrameCount: Math.max(
      0,
      group.frames.length - EXPRESSION_FRAME_PREVIEW_COUNT,
    ),
  }
}

function toExpressionAnalysisPreview(): unknown {
  const summary = getExpressionGroupingSummary()

  return {
    status: summary.status,
    source: summary.source,
    thresholds: {
      expression: EXPRESSION_GROUPING_THRESHOLDS.expression,
      pose: EXPRESSION_GROUPING_THRESHOLDS.pose,
    },
    summary: {
      sourceFrameCount: summary.sourceFrameCount,
      noneExpressionFrameCount: summary.noneExpressionFrameCount,
      noneExpressionFrameIdPreview: toExpressionFrameIdPreview(
        summary.noneExpressionFrames,
      ),
      expressionGroups: summary.expressionGroups.map(toExpressionGroupPreview),
      mixedExpressionFrameCount: summary.mixedExpressionFrameCount,
      mixedExpressionFrameIdPreview: toExpressionFrameIdPreview(
        summary.mixedExpressionFrames,
      ),
      excludedFrameCount: summary.excludedFrameCount,
      excludedFrameIdPreview: toExpressionFrameIdPreview(
        summary.excludedFrames,
      ),
      excludedBreakdown: summary.excludedBreakdown,
      warningBreakdown: summary.warningBreakdown,
      step2IExcludedFrameCount: summary.step2IExcludedFrameCount,
    },
    warnings: summary.warnings,
    notes: [
      "JSON preview omits thumbnail data URLs and frame images.",
      "neutral 3D 478 generation, expression 3D 478 generation, 3D comparison, landmarkFollowStrengths auto generation, and expressionFollow export are not implemented in this prototype.",
    ],
  }
}

function toActiveSummaryPreview(
  poseAwareFrameSelection: PoseAwareMultiFrameSummary,
  poseAwareDataset: PoseAwareInferenceDataset,
  currentCandidate: IdealLandmarks3DCandidateResult,
): unknown {
  return {
    activeWorkflow: "step_2_i_pose_aware",
    currentCandidateGenerationMethod: currentCandidate.generationMethod,
    hasDetailedScanFrames: getDetailedScanFrames().length > 0,
    hasPoseAwareDataset:
      poseAwareDataset.frontReferenceFrames.length > 0 ||
      poseAwareDataset.observationFrames.length > 0,
    hasGeneratedCandidate: currentCandidate.status === "generated",
    currentCandidateLandmarkCount: currentCandidate.landmarkCount,
    poseAwareStatus: poseAwareDataset.status,
    frontReferenceFrameCount:
      poseAwareFrameSelection.frontReferenceFrameCount,
    usableObservationFrameCount:
      poseAwareFrameSelection.usableObservationFrameCount,
    excludedFrameCount: poseAwareFrameSelection.excludedFrameCount,
  }
}

function toNaturalV1ReferencePreview(): unknown {
  return {
    metadata: {
      id: idealFace.metadata.id,
      name: idealFace.metadata.name,
      version: idealFace.metadata.version,
    },
    model: {
      coordinateSpace: idealFace.model.coordinateSpace,
      controlPointCount: idealFace.model.controlPoints.length,
      role: "reference_projection_debug",
      note:
        "6 controlPoints are reference data. The IdealFace body is idealLandmarks3D 478 points.",
      controlPoints: idealFace.model.controlPoints.map((point) => ({
        id: point.id,
        semantic: point.semantic ?? null,
        x: point.x,
        y: point.y,
        z: point.z,
      })),
    },
  }
}

function toVideoSourceDebugPreview(
  analysisSummary: AnalysisSummary,
): unknown {
  if (!videoSource) {
    return null
  }

  return {
    fileName: videoSource.fileName,
    duration: videoSource.duration,
    videoWidth: videoSource.videoWidth,
    videoHeight: videoSource.videoHeight,
    extractedFrameCount: videoSource.extractedFrames.length,
    analyzedFrameCount: analysisSummary.analyzedFrameCount,
    detectedFrameCount: analysisSummary.detectedFrameCount,
    failedFrameCount: analysisSummary.failedFrameCount,
    noFaceFrameCount: analysisSummary.noFaceFrameCount,
    poseRange: {
      pitch: analysisSummary.pitchRange,
      yaw: analysisSummary.yawRange,
      roll: analysisSummary.rollRange,
    },
    frames: videoSource.extractedFrames.map((frame) => ({
      frameIndex: frame.index,
      timestamp: frame.timestamp,
      status: frame.status,
      detected: frame.analysis?.detected ?? false,
      landmarksCount: frame.analysis?.landmarks.length ?? 0,
      blendshapeCount: frame.analysis?.blendshapes.length ?? 0,
      blendshapePreview:
        frame.analysis?.blendshapes.slice(0, 5).map((blendshape) => ({
          categoryName: blendshape.categoryName,
          score: Number(blendshape.score.toFixed(4)),
        })) ?? [],
      posePreview: frame.analysis
        ? {
            pitch: frame.analysis.pose.pitch,
            yaw: frame.analysis.pose.yaw,
            roll: frame.analysis.pose.roll,
          }
        : null,
      landmarkPreview:
        frame.analysis?.landmarks.slice(0, 5).map((landmark) => ({
          x: Number(landmark.x.toFixed(4)),
          y: Number(landmark.y.toFixed(4)),
          z: Number(landmark.z.toFixed(4)),
        })) ?? [],
      errorMessage: frame.analysis?.errorMessage ?? null,
      extractionTimeMs: Number(frame.extractionTimeMs.toFixed(1)),
      thumbnail: "omitted",
      analysisImage: "omitted",
    })),
  }
}

function buildAuthoringDebugPreview(): unknown {
  const analysisSummary = getAnalysisSummary()
  const scanSummary = getDetailedScanSummary()
  const poseAwareFrameSelection = getPoseAwareMultiFrameSummary()
  const poseAwareDataset = getPoseAwareInferenceDataset()
  const currentCandidate = idealLandmarks3DCandidateResult

  return {
    activeSummary: toActiveSummaryPreview(
      poseAwareFrameSelection,
      poseAwareDataset,
      currentCandidate,
    ),
    poseAware: {
      frameSelection: toPoseAwareMultiFrameInferencePreview(),
      inferenceDataset: toPoseAwareInferenceDatasetPreview(),
      candidate: toPoseAwareCandidatePreview(),
    },
    expressionAnalysis: toExpressionAnalysisPreview(),
    frameUsage: getFrameUsageSummary(),
    currentCandidate: toCurrentCandidatePreview(currentCandidate),
    landmarkGroups: toLandmarkGroupsPreview(),
    coordinateDebug: toCoordinateDebugPreview(
      poseAwareDataset,
      currentCandidate,
    ),
    reference: {
      naturalV1: toNaturalV1ReferencePreview(),
    },
    debug: {
      videoSource: toVideoSourceDebugPreview(analysisSummary),
      scanSummary: toScanSummaryPreview(scanSummary),
    },
  }
}

function attachVideoInputHandler(): void {
  document
    .querySelector<HTMLInputElement>("#video-file-input")
    ?.addEventListener("change", async (event) => {
      const input = event.currentTarget as HTMLInputElement
      const file = input.files?.[0]

      if (!file) {
        return
      }

      await handleVideoFileSelection(file)
    })
}

function attachAnalysisHandler(): void {
  document
    .querySelector<HTMLButtonElement>("#analyze-frames-button")
    ?.addEventListener("click", async () => {
      await analyzeExtractedFrames()
    })
}

function attachPoseAwareFrameSelectionHandler(): void {
  document
    .querySelectorAll<HTMLButtonElement>("[data-frame-review-step]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const step = Number(button.dataset.frameReviewStep ?? "0")

        if (!Number.isFinite(step)) {
          return
        }

        setFrameReviewIndex(frameReviewIndex + step)
        render()
      })
    })

  document
    .querySelectorAll<HTMLInputElement>("[data-frame-usage-front-reference]")
    .forEach((input) => {
      input.addEventListener("change", () => {
        setAuthoringFrameFrontReference(
          input.dataset.frameUsageFrontReference ?? "",
          input.checked,
        )
        render()
      })
    })

  document
    .querySelectorAll<HTMLInputElement>("[data-frame-usage-inference]")
    .forEach((input) => {
      input.addEventListener("change", () => {
        setAuthoringFrameUseForInference(
          input.dataset.frameUsageInference ?? "",
          input.checked,
        )
        render()
      })
    })

  document
    .querySelectorAll<HTMLSelectElement>("[data-frame-usage-expression]")
    .forEach((select) => {
      select.addEventListener("change", () => {
        setAuthoringFrameExpressionGroup(
          select.dataset.frameUsageExpression ?? "",
          select.value,
        )
        render()
      })
    })

  document
    .querySelectorAll<HTMLButtonElement>("[data-frame-usage-exclude]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        excludeAuthoringFrame(button.dataset.frameUsageExclude ?? "")
        render()
      })
    })

  document
    .querySelectorAll<HTMLButtonElement>("[data-frame-usage-restore]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        restoreAuthoringFrame(button.dataset.frameUsageRestore ?? "")
        render()
      })
    })
}

function attachIdealLandmarks3DCandidateHandler(): void {
  document
    .querySelector<HTMLButtonElement>(
      "[data-generate-pose-aware-ideal-landmarks-3d-candidate]",
    )
    ?.addEventListener("click", () => {
      const dataset = getPoseAwareInferenceDataset()

      idealLandmarks3DCandidateResult =
        buildPoseAwareIdealLandmarks3DCandidateResult(dataset)
      pointCloudPreviewCamera = createPointCloudPreviewCamera()
      render()
    })

  document
    .querySelector<HTMLButtonElement>(
      "[data-download-ideal-face-asset-json]",
    )
    ?.addEventListener("click", () => {
      downloadIdealFaceAssetJson()
    })

  document
    .querySelectorAll<HTMLButtonElement>("[data-point-cloud-preset]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const preset = button.dataset.pointCloudPreset

        if (!isPointCloudPreviewPreset(preset)) {
          return
        }

        pointCloudPreviewCamera = getPointCloudPreviewPresetCamera(preset)
        render()
      })
    })

  attachPointCloudCanvasInteractionHandler()
  drawPointCloudPreviewCanvas()
}

function attachLandmarkGroupEditorHandler(): void {
  document
    .querySelector<HTMLSelectElement>("[data-landmark-group-select]")
    ?.addEventListener("change", (event) => {
      const select = event.currentTarget as HTMLSelectElement

      setSelectedLandmarkGroupId(select.value)
      render()
    })

  document
    .querySelectorAll<HTMLInputElement>("[data-landmark-group-selection-mode]")
    .forEach((input) => {
      input.addEventListener("change", () => {
        if (!input.checked) {
          return
        }

        setLandmarkGroupEditorSelectionMode(input.value)
        render()
      })
    })

  document
    .querySelector<HTMLTextAreaElement>("[data-landmark-group-highlight-input]")
    ?.addEventListener("input", (event) => {
      const textarea = event.currentTarget as HTMLTextAreaElement
      const selectionStart = textarea.selectionStart
      const selectionEnd = textarea.selectionEnd

      setLandmarkGroupEditorHighlightedIndexInput(textarea.value)
      render()
      requestAnimationFrame(() => {
        const nextTextarea = document.querySelector<HTMLTextAreaElement>(
          "[data-landmark-group-highlight-input]",
        )

        nextTextarea?.focus()
        nextTextarea?.setSelectionRange(selectionStart, selectionEnd)
      })
    })

  document
    .querySelectorAll<HTMLButtonElement>("[data-landmark-group-action]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.landmarkGroupAction

        if (action === "clear-selected") {
          clearSelectedLandmarkGroup()
          render()
          return
        }

        if (action === "reset-selected") {
          resetSelectedLandmarkGroup()
          render()
          return
        }

        if (action === "reset-all") {
          resetAllLandmarkGroups()
          render()
          return
        }

        if (action === "add-range") {
          addRangeSelectionToSelectedLandmarkGroup()
          render()
          return
        }

        if (action === "remove-range") {
          removeRangeSelectionFromSelectedLandmarkGroup()
          render()
          return
        }

        if (action === "add-highlighted") {
          addHighlightedIndicesToSelectedLandmarkGroup()
          render()
          return
        }

        if (action === "remove-highlighted") {
          removeHighlightedIndicesFromSelectedLandmarkGroup()
          render()
          return
        }

        if (action === "clear-highlighted") {
          clearHighlightedIndices()
          render()
        }
      })
    })

  const canvas = document.querySelector<HTMLCanvasElement>(
    "[data-landmark-group-editor-canvas]",
  )

  if (canvas) {
    canvas.addEventListener("click", (event) => {
      if (landmarkGroupEditorState.selectionMode !== "click") {
        return
      }

      const result = idealLandmarks3DCandidateResult

      if (
        result.status !== "generated" ||
        result.landmarks.length !== REQUIRED_LANDMARK_COUNT
      ) {
        return
      }

      const rect = canvas.getBoundingClientRect()
      const points = getLandmarkGroupEditorCanvasPoints(
        result.landmarks,
        rect.width,
        rect.height,
      )
      const nearestPoint = findNearestLandmarkGroupEditorPoint(
        points,
        event.clientX - rect.left,
        event.clientY - rect.top,
      )

      if (!nearestPoint) {
        return
      }

      toggleSelectedLandmarkGroupIndex(nearestPoint.index)
      render()
    })

    canvas.addEventListener("pointerdown", (event) => {
      if (landmarkGroupEditorState.selectionMode !== "rectangle") {
        return
      }

      const point = getLandmarkGroupEditorCanvasEventPoint(canvas, event)

      landmarkGroupEditorDragState = {
        pointerId: event.pointerId,
        startX: point.x,
        startY: point.y,
        currentX: point.x,
        currentY: point.y,
      }
      canvas.setPointerCapture(event.pointerId)
      drawLandmarkGroupEditorCanvas()
    })

    canvas.addEventListener("pointermove", (event) => {
      if (
        landmarkGroupEditorState.selectionMode !== "rectangle" ||
        !landmarkGroupEditorDragState ||
        landmarkGroupEditorDragState.pointerId !== event.pointerId
      ) {
        return
      }

      const point = getLandmarkGroupEditorCanvasEventPoint(canvas, event)

      landmarkGroupEditorDragState = {
        ...landmarkGroupEditorDragState,
        currentX: point.x,
        currentY: point.y,
      }
      drawLandmarkGroupEditorCanvas()
    })

    canvas.addEventListener("pointerup", (event) => {
      if (
        landmarkGroupEditorState.selectionMode !== "rectangle" ||
        !landmarkGroupEditorDragState ||
        landmarkGroupEditorDragState.pointerId !== event.pointerId
      ) {
        return
      }

      const point = getLandmarkGroupEditorCanvasEventPoint(canvas, event)
      const rangeSelection = {
        startX: landmarkGroupEditorDragState.startX,
        startY: landmarkGroupEditorDragState.startY,
        endX: point.x,
        endY: point.y,
      }
      const distance = Math.hypot(
        rangeSelection.endX - rangeSelection.startX,
        rangeSelection.endY - rangeSelection.startY,
      )

      landmarkGroupEditorDragState = null
      canvas.releasePointerCapture(event.pointerId)
      setLandmarkGroupEditorRangeSelection(
        distance >= LANDMARK_GROUP_EDITOR_MIN_DRAG_DISTANCE_PX
          ? rangeSelection
          : null,
      )
      render()
    })

    canvas.addEventListener("pointercancel", () => {
      landmarkGroupEditorDragState = null
      drawLandmarkGroupEditorCanvas()
    })
  }

  drawLandmarkGroupEditorCanvas()
}

function getLandmarkGroupEditorCanvasEventPoint(
  canvas: HTMLCanvasElement,
  event: PointerEvent | MouseEvent,
): Point2D {
  const rect = canvas.getBoundingClientRect()

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

function attachPointCloudCanvasInteractionHandler(): void {
  const canvas = document.querySelector<HTMLCanvasElement>(
    "[data-point-cloud-canvas]",
  )

  if (!canvas) {
    return
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return
    }

    pointCloudDragState = {
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
      mode: event.shiftKey ? "pan" : "rotate",
    }
    canvas.setPointerCapture(event.pointerId)
  })

  canvas.addEventListener("pointermove", (event) => {
    if (!pointCloudDragState || pointCloudDragState.pointerId !== event.pointerId) {
      return
    }

    const dx = event.clientX - pointCloudDragState.lastX
    const dy = event.clientY - pointCloudDragState.lastY

    pointCloudDragState = {
      ...pointCloudDragState,
      lastX: event.clientX,
      lastY: event.clientY,
    }

    if (pointCloudDragState.mode === "pan") {
      pointCloudPreviewCamera = {
        ...pointCloudPreviewCamera,
        panX: pointCloudPreviewCamera.panX + dx,
        panY: pointCloudPreviewCamera.panY + dy,
      }
    } else {
      pointCloudPreviewCamera = {
        ...pointCloudPreviewCamera,
        yaw: pointCloudPreviewCamera.yaw + dx * POINT_CLOUD_ROTATION_SENSITIVITY,
        pitch: clamp(
          pointCloudPreviewCamera.pitch + dy * POINT_CLOUD_ROTATION_SENSITIVITY,
          -POINT_CLOUD_MAX_PITCH,
          POINT_CLOUD_MAX_PITCH,
        ),
      }
    }

    drawPointCloudPreviewCanvas()
  })

  canvas.addEventListener("pointerup", (event) => {
    if (pointCloudDragState?.pointerId === event.pointerId) {
      pointCloudDragState = null
      canvas.releasePointerCapture(event.pointerId)
    }
  })

  canvas.addEventListener("pointercancel", () => {
    pointCloudDragState = null
  })

  canvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault()
      pointCloudPreviewCamera = {
        ...pointCloudPreviewCamera,
        zoom: clamp(
          pointCloudPreviewCamera.zoom *
            Math.exp(-event.deltaY * POINT_CLOUD_ZOOM_SENSITIVITY),
          POINT_CLOUD_MIN_ZOOM,
          POINT_CLOUD_MAX_ZOOM,
        ),
      }
      drawPointCloudPreviewCanvas()
    },
    { passive: false },
  )

  canvas.addEventListener("dblclick", () => {
    pointCloudPreviewCamera = createPointCloudPreviewCamera()
    drawPointCloudPreviewCanvas()
  })
}

function isPointCloudPreviewPreset(
  value: string | undefined,
): value is PointCloudPreviewPreset {
  return (
    value === "front" ||
    value === "side" ||
    value === "top" ||
    value === "reset"
  )
}

async function analyzeExtractedFrames(): Promise<void> {
  if (!videoSource || !videoSource.objectUrl) {
    return
  }

  resetAuthoringFrameUsages()
  resetIdealLandmarks3DCandidateResult()
  updateVideoSource({
    isAnalyzing: true,
    analysisError: null,
    scanSummary: createEmptyDetailedScanSummary(),
    detailedScanFrames: [],
  })
  render()

  try {
    const landmarker = await getFaceLandmarker()
    const scanResult = await scanVideoForPoseAwareFrames(
      extractionVideo,
      landmarker,
    )

    updateVideoSource({
      scanSummary: scanResult.scanSummary,
      detailedScanFrames: scanResult.detailedScanFrames,
    })
  } catch (error) {
    updateVideoSource({
      analysisError:
        error instanceof Error
          ? error.message
          : "MediaPipe 解析の初期化に失敗しました。",
    })
  }

  updateVideoSource({
    isAnalyzing: false,
  })
  render()
}

interface DetailedScanResult {
  scanSummary: DetailedScanSummary
  detailedScanFrames: ExtractedVideoFrame[]
}

async function scanVideoForPoseAwareFrames(
  video: HTMLVideoElement,
  landmarker: FaceLandmarker,
): Promise<DetailedScanResult> {
  const scanPlan = getDetailedScanPlan(video.duration)
  const analysisContext = analysisCanvas.getContext("2d")
  const thumbnailContext = thumbnailCanvas.getContext("2d")

  if (
    !analysisContext ||
    !thumbnailContext ||
    video.videoWidth === 0 ||
    video.videoHeight === 0
  ) {
    throw new Error("詳細スキャン用フレームを canvas に描画できませんでした。")
  }

  const analysisWidth = Math.min(video.videoWidth, ANALYSIS_MAX_WIDTH)
  const analysisHeight = Math.round(
    (analysisWidth * video.videoHeight) / video.videoWidth,
  )
  const thumbnailHeight = Math.round(
    (THUMBNAIL_WIDTH * video.videoHeight) / video.videoWidth,
  )
  analysisCanvas.width = analysisWidth
  analysisCanvas.height = analysisHeight
  thumbnailCanvas.width = THUMBNAIL_WIDTH
  thumbnailCanvas.height = thumbnailHeight

  const scannedFrames: ExtractedVideoFrame[] = []
  let detectedFrameCount = 0

  for (const [index, timestamp] of scanPlan.timestamps.entries()) {
    const startedAt = performance.now()

    if (Math.abs(video.currentTime - timestamp) > 0.001) {
      video.currentTime = timestamp
      await waitForVideoEvent("seeked")
    } else if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      await waitForVideoEvent("loadeddata")
    }

    analysisContext.drawImage(video, 0, 0, analysisWidth, analysisHeight)
    thumbnailContext.drawImage(
      analysisCanvas,
      0,
      0,
      THUMBNAIL_WIDTH,
      thumbnailHeight,
    )

    const frame = analyzeScannedCanvasFrame(
      landmarker,
      index + 1,
      timestamp,
      startedAt,
    )
    scannedFrames.push(frame)

    if (frame.analysis?.detected) {
      detectedFrameCount += 1
    }

    updateVideoSource({
      detailedScanFrames: [...scannedFrames],
      scanSummary: {
        scanIntervalSec: scanPlan.intervalSec,
        maxScanFrames: MAX_DETAILED_SCAN_FRAME_COUNT,
        scannedFrameCount: scanPlan.timestamps.length,
        analyzedFrameCount: scannedFrames.length,
        detectedFrameCount,
        candidateSourceFrameCount: getCandidateSourceFramesFromFrames(
          scannedFrames,
        ).length,
      },
    })
    render()
  }

  const candidateSourceFrames =
    getCandidateSourceFramesFromFrames(scannedFrames)
  const scanSummary: DetailedScanSummary = {
    scanIntervalSec: scanPlan.intervalSec,
    maxScanFrames: MAX_DETAILED_SCAN_FRAME_COUNT,
    scannedFrameCount: scanPlan.timestamps.length,
    analyzedFrameCount: scannedFrames.length,
    detectedFrameCount,
    candidateSourceFrameCount: candidateSourceFrames.length,
  }

  return {
    scanSummary,
    detailedScanFrames: scannedFrames,
  }
}

function analyzeScannedCanvasFrame(
  landmarker: FaceLandmarker,
  frameIndex: number,
  timestamp: number,
  startedAt: number,
): ExtractedVideoFrame {
  try {
    const result = landmarker.detect(analysisCanvas)
    const landmarks = (result.faceLandmarks[0] ?? []).map((landmark) => ({
      x: landmark.x,
      y: landmark.y,
      z: landmark.z,
    }))
    const blendshapes = (result.faceBlendshapes[0]?.categories ?? []).map(
      (category) => ({
        categoryName: category.categoryName,
        displayName: category.displayName,
        score: category.score,
      }),
    )
    const detected = result.faceLandmarks.length > 0

    return {
      index: frameIndex,
      timestamp,
      status: detected ? "analyzed" : "no_face",
      thumbnailUrl: thumbnailCanvas.toDataURL("image/jpeg", 0.82),
      analysisImageUrl: analysisCanvas.toDataURL("image/jpeg", 0.9),
      extractionTimeMs: performance.now() - startedAt,
      analysis: {
        detected,
        landmarks,
        blendshapes,
        pose: detected
          ? estimateFacePose(landmarks, result.facialTransformationMatrixes[0])
          : { ...EMPTY_FACE_POSE },
        errorMessage: null,
        analyzedAt: Date.now(),
      },
    }
  } catch (error) {
    return {
      index: frameIndex,
      timestamp,
      status: "error",
      thumbnailUrl: thumbnailCanvas.toDataURL("image/jpeg", 0.82),
      analysisImageUrl: analysisCanvas.toDataURL("image/jpeg", 0.9),
      extractionTimeMs: performance.now() - startedAt,
      analysis: {
        detected: false,
        landmarks: [],
        blendshapes: [],
        pose: { ...EMPTY_FACE_POSE },
        errorMessage: error instanceof Error ? error.message : String(error),
        analyzedAt: Date.now(),
      },
    }
  }
}

async function getFaceLandmarker(): Promise<FaceLandmarker> {
  if (faceLandmarker) {
    return faceLandmarker
  }

  if (!faceLandmarkerInitialization) {
    faceLandmarkerInitialization = initializeFaceLandmarker()
  }

  faceLandmarker = await faceLandmarkerInitialization

  return faceLandmarker
}

async function initializeFaceLandmarker(): Promise<FaceLandmarker> {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
  )

  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
    },
    runningMode: "IMAGE",
    numFaces: 1,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
  })
}

async function loadFrameImage(src: string): Promise<HTMLImageElement> {
  const image = new Image()

  image.src = src

  if (image.decode) {
    await image.decode()
    return image
  }

  await new Promise<void>((resolve, reject) => {
    image.addEventListener("load", () => resolve(), { once: true })
    image.addEventListener(
      "error",
      () => reject(new Error("解析用フレーム画像を読み込めませんでした。")),
      { once: true },
    )
  })

  return image
}

function estimateFacePose(
  landmarks: FaceLandmark[],
  facialTransformationMatrix: Matrix | undefined,
): FacePose {
  return (
    estimateFacePoseFromMatrix(facialTransformationMatrix) ??
    estimateFacePoseFromLandmarks(landmarks) ?? { ...EMPTY_FACE_POSE }
  )
}

function estimateFacePoseFromMatrix(
  matrix: Matrix | undefined,
): FacePose | null {
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

function estimateFacePoseFromLandmarks(
  landmarks: FaceLandmark[],
): FacePose | null {
  const leftEye = landmarks[LEFT_EYE_OUTER_INDEX]
  const rightEye = landmarks[RIGHT_EYE_OUTER_INDEX]
  const noseTip = landmarks[NOSE_TIP_INDEX]
  const mouthCenter = averageLandmarks(landmarks, MOUTH_CENTER_INDICES)

  if (!leftEye || !rightEye || !noseTip || !mouthCenter) {
    return null
  }

  const eyeCenter = {
    x: (leftEye.x + rightEye.x) / 2,
    y: (leftEye.y + rightEye.y) / 2,
    z: (leftEye.z + rightEye.z) / 2,
  }
  const eyeDistance = Math.hypot(leftEye.x - rightEye.x, leftEye.y - rightEye.y)
  const eyeToMouthDistance = Math.hypot(
    mouthCenter.x - eyeCenter.x,
    mouthCenter.y - eyeCenter.y,
  )

  if (eyeDistance === 0 || eyeToMouthDistance === 0) {
    return null
  }

  return {
    pitch: clamp(
      ((noseTip.y - eyeCenter.y) / eyeToMouthDistance - 0.6) * 60,
      -45,
      45,
    ),
    yaw: clamp(((noseTip.x - eyeCenter.x) / eyeDistance) * 70, -45, 45),
    roll:
      Math.atan2(leftEye.y - rightEye.y, leftEye.x - rightEye.x) * RAD_TO_DEG,
  }
}

function averageLandmarks(
  landmarks: FaceLandmark[],
  indices: number[],
): FaceLandmark | null {
  const points = indices
    .map((index) => landmarks[index])
    .filter((landmark): landmark is FaceLandmark => Boolean(landmark))

  if (points.length !== indices.length) {
    return null
  }

  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
    z: points.reduce((sum, point) => sum + point.z, 0) / points.length,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

async function handleVideoFileSelection(file: File): Promise<void> {
  resetAuthoringFrameUsages()
  resetIdealLandmarks3DCandidateResult()

  if (file.type !== "video/mp4" && !file.name.toLowerCase().endsWith(".mp4")) {
    replaceVideoSource({
      fileName: file.name,
      objectUrl: "",
      duration: null,
      videoWidth: null,
      videoHeight: null,
      extractedFrames: [],
      isExtracting: false,
      isAnalyzing: false,
      analysisError: null,
      error: "初期対応は MP4 動画のみです。",
      scanSummary: createEmptyDetailedScanSummary(),
      detailedScanFrames: [],
    })
    render()
    return
  }

  const objectUrl = URL.createObjectURL(file)

  replaceVideoSource({
    fileName: file.name,
    objectUrl,
    duration: null,
    videoWidth: null,
    videoHeight: null,
    extractedFrames: [],
    isExtracting: true,
    isAnalyzing: false,
    analysisError: null,
    error: null,
    scanSummary: createEmptyDetailedScanSummary(),
    detailedScanFrames: [],
  })
  render()

  try {
    extractionVideo.src = objectUrl
    extractionVideo.load()
    await waitForVideoEvent("loadedmetadata")

    if (!Number.isFinite(extractionVideo.duration)) {
      throw new Error("動画の長さを取得できませんでした。")
    }

    updateVideoSource({
      duration: extractionVideo.duration,
      videoWidth: extractionVideo.videoWidth,
      videoHeight: extractionVideo.videoHeight,
    })
    render()

    const frames = await extractFramesFromVideo(extractionVideo)

    updateVideoSource({
      extractedFrames: frames,
      isExtracting: false,
    })
  } catch (error) {
    updateVideoSource({
      isExtracting: false,
      error:
        error instanceof Error
          ? error.message
          : "動画の読み込みまたはフレーム抽出に失敗しました。",
    })
  }

  render()
}

function replaceVideoSource(nextSource: VideoSourceState): void {
  if (videoSource?.objectUrl) {
    URL.revokeObjectURL(videoSource.objectUrl)
  }

  videoSource = nextSource
}

function updateVideoSource(nextState: Partial<VideoSourceState>): void {
  if (!videoSource) {
    return
  }

  videoSource = {
    ...videoSource,
    ...nextState,
  }
}

function waitForVideoEvent(
  eventName: "loadedmetadata" | "loadeddata" | "seeked",
): Promise<void> {
  return new Promise((resolve, reject) => {
    const handleEvent = (): void => {
      cleanup()
      resolve()
    }
    const handleError = (): void => {
      cleanup()
      reject(new Error("動画を読み込めませんでした。"))
    }
    const cleanup = (): void => {
      extractionVideo.removeEventListener(eventName, handleEvent)
      extractionVideo.removeEventListener("error", handleError)
    }

    extractionVideo.addEventListener(eventName, handleEvent, { once: true })
    extractionVideo.addEventListener("error", handleError, { once: true })
  })
}

function getExtractionTimestamps(duration: number): number[] {
  const safeDuration = Math.max(0, duration)
  const maxTimestamp = Math.max(0, safeDuration - 0.05)
  const interval =
    safeDuration <= MAX_EXTRACTED_FRAME_COUNT - 1
      ? 1
      : safeDuration / (MAX_EXTRACTED_FRAME_COUNT - 1)
  const frameCount = Math.min(
    MAX_EXTRACTED_FRAME_COUNT,
    Math.max(1, Math.floor(safeDuration / interval) + 1),
  )

  return Array.from({ length: frameCount }, (_, index) =>
    Math.min(maxTimestamp, Number((index * interval).toFixed(3))),
  )
}

function getDetailedScanPlan(duration: number): {
  intervalSec: number
  timestamps: number[]
} {
  const safeDuration = Math.max(0, duration)
  const maxTimestamp = Math.max(0, safeDuration - 0.05)
  const estimatedFrameCount =
    Math.floor(maxTimestamp / DETAILED_SCAN_INTERVAL_SEC) + 1
  const frameCount = Math.min(
    MAX_DETAILED_SCAN_FRAME_COUNT,
    Math.max(1, estimatedFrameCount),
  )
  const intervalSec =
    frameCount <= 1
      ? DETAILED_SCAN_INTERVAL_SEC
      : Math.max(
          DETAILED_SCAN_INTERVAL_SEC,
          maxTimestamp / Math.max(1, frameCount - 1),
        )

  return {
    intervalSec: Number(intervalSec.toFixed(3)),
    timestamps: Array.from({ length: frameCount }, (_, index) =>
      Math.min(maxTimestamp, Number((index * intervalSec).toFixed(3))),
    ),
  }
}

async function extractFramesFromVideo(
  video: HTMLVideoElement,
): Promise<ExtractedVideoFrame[]> {
  const duration = video.duration
  const timestamps = getExtractionTimestamps(duration)
  const analysisContext = analysisCanvas.getContext("2d")
  const thumbnailContext = thumbnailCanvas.getContext("2d")

  if (
    !analysisContext ||
    !thumbnailContext ||
    video.videoWidth === 0 ||
    video.videoHeight === 0
  ) {
    throw new Error("動画フレームを canvas に描画できませんでした。")
  }

  const analysisWidth = Math.min(video.videoWidth, ANALYSIS_MAX_WIDTH)
  const analysisHeight = Math.round(
    (analysisWidth * video.videoHeight) / video.videoWidth,
  )
  const thumbnailHeight = Math.round(
    (THUMBNAIL_WIDTH * video.videoHeight) / video.videoWidth,
  )
  analysisCanvas.width = analysisWidth
  analysisCanvas.height = analysisHeight
  thumbnailCanvas.width = THUMBNAIL_WIDTH
  thumbnailCanvas.height = thumbnailHeight

  const frames: ExtractedVideoFrame[] = []

  for (const [index, timestamp] of timestamps.entries()) {
    const startedAt = performance.now()

    if (Math.abs(video.currentTime - timestamp) > 0.001) {
      video.currentTime = timestamp
      await waitForVideoEvent("seeked")
    } else if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      await waitForVideoEvent("loadeddata")
    }

    analysisContext.drawImage(video, 0, 0, analysisWidth, analysisHeight)
    thumbnailContext.drawImage(
      analysisCanvas,
      0,
      0,
      THUMBNAIL_WIDTH,
      thumbnailHeight,
    )

    frames.push({
      index: index + 1,
      timestamp,
      status: "pending",
      thumbnailUrl: thumbnailCanvas.toDataURL("image/jpeg", 0.82),
      analysisImageUrl: analysisCanvas.toDataURL("image/jpeg", 0.9),
      extractionTimeMs: performance.now() - startedAt,
    })

    updateVideoSource({
      extractedFrames: [...frames],
    })
    render()
  }

  return frames
}

function render(): void {
  appRoot.innerHTML = `
    <main>
      <header class="app-header">
        <div>
          <p class="eyebrow">BAE AR</p>
          <h1>IdealFace Authoring Tool</h1>
        </div>
        <span>Step 2-I-C</span>
      </header>

      <section class="summary" aria-label="IdealFace metadata">
        <dl>
          <div>
            <dt>preset id</dt>
            <dd>${escapeHtml(idealFace.metadata.id)}</dd>
          </div>
          <div>
            <dt>name</dt>
            <dd>${escapeHtml(idealFace.metadata.name)}</dd>
          </div>
          <div>
            <dt>version</dt>
            <dd>${escapeHtml(idealFace.metadata.version)}</dd>
          </div>
          <div>
            <dt>coordinateSpace</dt>
            <dd>${escapeHtml(idealFace.model.coordinateSpace)}</dd>
          </div>
        </dl>
      </section>

      <section class="video-panel" aria-label="動画素材">
        <div class="panel-heading">
          <div>
            <h2>動画素材</h2>
            <p>推奨: MP4 / H.264 / 5〜15秒 / 720p程度</p>
          </div>
          <label class="file-button" for="video-file-input">MP4 動画を選択</label>
          <input id="video-file-input" type="file" accept="video/mp4,.mp4" />
        </div>
        ${renderVideoMetadata()}
        <div class="video-workspace">
          ${renderVideoPreview()}
          <div>
            <h3>抽出状態</h3>
            <p class="status-text">${escapeHtml(renderExtractionStatus())}</p>
          </div>
        </div>
      </section>

      ${renderAnalysisPanel()}

      ${renderExpressionGroupingPanel()}

      ${renderPoseAwareMultiFramePanel()}

      ${renderIdealLandmarks3DPointCloudPreviewPanel()}

      ${renderLandmarkGroupEditorPanel()}

      <section class="json-panel">
        <h2>JSON preview</h2>
        <pre>${escapeHtml(JSON.stringify(buildAuthoringDebugPreview(), null, 2))}</pre>
      </section>
    </main>
  `

  attachVideoInputHandler()
  attachAnalysisHandler()
  attachPoseAwareFrameSelectionHandler()
  attachIdealLandmarks3DCandidateHandler()
  attachLandmarkGroupEditorHandler()
}

const style = document.createElement("style")

style.textContent = `
  :root {
    color: #17201b;
    background: #f4f7f6;
    font-family:
      Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
      "Segoe UI", sans-serif;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
  }

  main {
    width: min(1180px, calc(100% - 32px));
    margin: 0 auto;
    padding: 24px 0 32px;
  }

  .app-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
    border-bottom: 1px solid #ccd8d3;
    padding-bottom: 16px;
  }

  .app-header h1 {
    margin: 0;
    font-size: 28px;
    line-height: 1.15;
    letter-spacing: 0;
  }

  .app-header span {
    color: #f4f7f6;
    background: #27594c;
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
  }

  .eyebrow {
    margin: 0 0 5px;
    color: #6d756c;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .summary {
    margin-bottom: 22px;
  }

  dl {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 1px;
    margin: 0;
    overflow: hidden;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ccd8d3;
  }

  dl div {
    min-width: 0;
    background: #ffffff;
    padding: 14px;
  }

  dt {
    color: #6d756c;
    font-size: 12px;
    font-weight: 700;
  }

  dd {
    margin: 5px 0 0;
    overflow-wrap: anywhere;
    font-size: 15px;
    font-weight: 700;
  }

  .video-panel,
  .analysis-panel,
  .expression-grouping-panel,
  .representative-panel,
  .frames-panel {
    margin-bottom: 24px;
  }

  .panel-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
  }

  .panel-heading p {
    margin: 5px 0 0;
    color: #5d675f;
    font-size: 13px;
  }

  #video-file-input {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  .file-button,
  .analysis-button,
  .debug-toggle-button,
  .candidate-category-toggle-button,
  .candidate-label-button,
  .selected-clear-button,
  .candidate-generate-button,
  .ideal-face-export-button,
  .landmark-group-action-button,
  .point-cloud-preset-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 40px;
    border: 0;
    border-radius: 6px;
    background: #27594c;
    color: #ffffff;
    padding: 9px 13px;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
    white-space: nowrap;
  }

  .analysis-button,
  .debug-toggle-button,
  .candidate-category-toggle-button,
  .candidate-label-button,
  .selected-clear-button,
  .candidate-generate-button,
  .ideal-face-export-button,
  .landmark-group-action-button {
    font-family: inherit;
  }

  .point-cloud-preset-button {
    font-family: inherit;
  }

  .analysis-button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .candidate-generate-button:disabled,
  .ideal-face-export-button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .file-button:focus-visible,
  .analysis-button:focus-visible,
  .debug-toggle-button:focus-visible,
  .candidate-category-toggle-button:focus-visible,
  .candidate-label-button:focus-visible,
  .selected-clear-button:focus-visible,
  .candidate-generate-button:focus-visible,
  .ideal-face-export-button:focus-visible,
  .landmark-group-action-button:focus-visible,
  .point-cloud-preset-button:focus-visible {
    outline: 3px solid #9fc8bd;
    outline-offset: 2px;
  }

  .video-workspace {
    display: grid;
    grid-template-columns: minmax(320px, 0.9fr) minmax(260px, 1.1fr);
    gap: 18px;
    align-items: stretch;
    margin-top: 14px;
  }

  .video-preview,
  .video-empty,
  .frame-empty {
    width: 100%;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
  }

  .video-preview {
    display: block;
    aspect-ratio: 16 / 9;
    object-fit: contain;
  }

  .video-empty,
  .frame-empty {
    display: grid;
    min-height: 160px;
    place-items: center;
    padding: 18px;
    color: #5d675f;
    text-align: center;
  }

  .video-empty p,
  .frame-empty p,
  .status-text {
    margin: 0;
  }

  h3 {
    margin: 0 0 8px;
    font-size: 15px;
    line-height: 1.25;
    letter-spacing: 0;
  }

  .status-text {
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
    padding: 14px;
    color: #25342e;
    font-size: 14px;
    font-weight: 700;
  }

  .candidate-note {
    margin: 0 0 12px;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
    padding: 12px 14px;
    color: #5d675f;
    font-size: 13px;
    font-weight: 700;
  }

  .selected-representative-panel,
  .expression-grouping-panel,
  .pose-aware-panel,
  .readiness-panel,
  .inference-dataset-panel {
    margin-bottom: 14px;
  }

  .expression-grouping-panel,
  .pose-aware-panel {
    display: grid;
    gap: 12px;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
    padding: 14px;
  }

  .expression-grouping-panel .panel-heading {
    margin-bottom: 0;
  }

  .expression-grouping-summary-list {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  .expression-grouping-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 10px;
  }

  .expression-group-card {
    display: grid;
    min-width: 0;
    gap: 6px;
    border: 1px solid #dde6e2;
    border-radius: 8px;
    background: #fbfdfc;
    padding: 11px;
  }

  .expression-group-card-excluded {
    border-color: #d69a94;
    background: #fff7f6;
  }

  .expression-group-card h3,
  .expression-group-card strong,
  .expression-group-card p,
  .expression-frame-preview,
  .expression-frame-preview-empty {
    min-width: 0;
    margin: 0;
    overflow-wrap: anywhere;
    line-height: 1.35;
  }

  .expression-group-card h3 {
    color: #17201b;
    font-size: 13px;
  }

  .expression-group-card strong {
    color: #25342e;
    font-size: 16px;
  }

  .expression-group-card p,
  .expression-frame-preview,
  .expression-frame-preview-empty {
    color: #5d675f;
    font-size: 12px;
    font-weight: 700;
  }

  .pose-aware-heading p,
  .pose-aware-frame-group p,
  .pose-aware-dataset-note,
  .pose-aware-ready-text,
  .pose-aware-empty {
    margin: 4px 0 0;
    color: #5d675f;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.45;
  }

  .pose-aware-summary {
    display: grid;
    gap: 8px;
  }

  .pose-aware-summary-list {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .pose-aware-dataset-summary {
    display: grid;
    gap: 10px;
    border: 1px solid #dce6e1;
    border-radius: 8px;
    background: #fbfdfc;
    padding: 12px;
  }

  .pose-aware-dataset-summary h4,
  .pose-aware-coverage strong {
    margin: 0;
    color: #17201b;
    font-size: 14px;
    line-height: 1.25;
  }

  .pose-aware-coverage {
    display: grid;
    gap: 6px;
  }

  .pose-aware-coverage ul {
    display: grid;
    gap: 4px;
    margin: 0;
    padding-left: 18px;
    color: #5d675f;
    font-size: 13px;
    font-weight: 800;
    line-height: 1.45;
  }

  .pose-aware-warning-list {
    display: grid;
    gap: 4px;
    margin: 0;
    border: 1px solid #d8b46d;
    border-radius: 8px;
    background: #fff8e8;
    padding: 10px 12px 10px 28px;
    color: #654c14;
    font-size: 13px;
    font-weight: 800;
  }

  .pose-aware-ready-text {
    border: 1px solid #9fc8bd;
    border-radius: 8px;
    background: #edf8f4;
    padding: 10px 12px;
    color: #27594c;
  }

  .pose-aware-columns {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .frame-usage-panel {
    display: grid;
    gap: 12px;
  }

  .frame-usage-section {
    display: grid;
    gap: 10px;
    min-width: 0;
    border: 1px solid #dde6e2;
    border-radius: 8px;
    background: #fbfdfc;
    padding: 12px;
  }

  .frame-usage-section h4,
  .frame-usage-section p {
    margin: 0;
  }

  .frame-usage-section p {
    color: #5d675f;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.45;
  }

  .frame-usage-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 10px;
  }

  .frame-review-carousel {
    background: #f7fbf9;
  }

  .frame-review-heading {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 12px;
  }

  .frame-review-heading strong {
    border: 1px solid #bdd0c9;
    border-radius: 8px;
    background: #ffffff;
    padding: 5px 10px;
    color: #25342e;
    font-size: 13px;
    line-height: 1;
    white-space: nowrap;
  }

  .frame-review-card {
    display: grid;
    grid-template-columns: minmax(280px, 1.35fr) minmax(240px, 0.65fr);
    gap: 14px;
    min-width: 0;
  }

  .frame-review-preview {
    display: grid;
    gap: 7px;
    margin: 0;
    min-width: 0;
  }

  .frame-review-preview img {
    display: block;
    width: 100%;
    max-height: 420px;
    aspect-ratio: 16 / 9;
    border: 1px solid #25342e;
    border-radius: 8px;
    object-fit: contain;
    background: #1f2824;
  }

  .frame-review-preview figcaption {
    color: #25342e;
    font-size: 13px;
    font-weight: 900;
    line-height: 1.35;
  }

  .frame-review-details {
    display: grid;
    gap: 10px;
    align-content: start;
    min-width: 0;
  }

  .frame-review-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .frame-review-nav button:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  .frame-review-controls {
    border: 1px solid #dde6e2;
    border-radius: 8px;
    background: #ffffff;
    padding: 10px;
  }

  .frame-review-debug {
    display: grid;
    gap: 7px;
    margin: 0;
    border: 1px solid #dde6e2;
    border-radius: 8px;
    background: #ffffff;
    padding: 10px;
  }

  .frame-review-debug div {
    display: grid;
    grid-template-columns: 86px minmax(0, 1fr);
    gap: 8px;
    min-width: 0;
  }

  .frame-review-debug dt,
  .frame-review-debug dd {
    min-width: 0;
    margin: 0;
    overflow-wrap: anywhere;
    font-size: 12px;
    font-weight: 800;
    line-height: 1.35;
  }

  .frame-review-debug dt {
    color: #5d675f;
  }

  .frame-review-debug dd {
    color: #25342e;
  }

  .frame-usage-card {
    display: grid;
    grid-template-columns: 104px minmax(0, 1fr);
    gap: 10px;
    min-width: 0;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
    padding: 10px;
  }

  .frame-usage-card-excluded {
    border-color: #d69a94;
    background: #fff7f6;
  }

  .frame-usage-card img {
    display: block;
    width: 104px;
    aspect-ratio: 16 / 9;
    border-radius: 6px;
    object-fit: contain;
    background: #1f2824;
  }

  .frame-usage-card-body,
  .frame-usage-controls,
  .frame-usage-meta {
    display: grid;
    min-width: 0;
  }

  .frame-usage-card-body {
    gap: 8px;
    align-content: start;
  }

  .frame-usage-controls {
    gap: 7px;
  }

  .frame-usage-controls label,
  .frame-usage-meta span {
    min-width: 0;
    overflow-wrap: anywhere;
    color: #5d675f;
    font-size: 12px;
    font-weight: 800;
    line-height: 1.35;
  }

  .frame-usage-controls label {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    color: #25342e;
  }

  .frame-usage-expression-control select {
    min-height: 30px;
    max-width: 100%;
    border: 1px solid #b7c7c2;
    border-radius: 6px;
    background: #ffffff;
    color: #25342e;
    padding: 4px 8px;
    font: inherit;
    font-size: 12px;
    font-weight: 800;
  }

  .frame-usage-meta {
    gap: 3px;
  }

  .frame-usage-warning {
    color: #8a5a11;
  }

  .frame-usage-card h4 {
    min-width: 0;
    margin: 0;
    overflow-wrap: anywhere;
    color: #17201b;
    font-size: 13px;
    line-height: 1.35;
  }

  .pose-aware-frame-group {
    min-width: 0;
    border: 1px solid #dde6e2;
    border-radius: 8px;
    background: #fbfdfc;
    padding: 12px;
  }

  .pose-aware-frame-group h4 {
    margin: 0;
    color: #17201b;
    font-size: 14px;
    line-height: 1.25;
  }

  .pose-aware-frame-list {
    display: grid;
    gap: 8px;
    margin-top: 10px;
  }

  .pose-aware-frame-item {
    display: grid;
    grid-template-columns: 84px minmax(0, 1fr);
    gap: 8px;
    border: 1px solid #dde6e2;
    border-radius: 7px;
    background: #ffffff;
    padding: 8px;
  }

  .pose-aware-frame-item-excluded {
    border-color: #d69a94;
    background: #fff7f6;
  }

  .pose-aware-frame-item img {
    display: block;
    width: 84px;
    aspect-ratio: 16 / 9;
    border-radius: 5px;
    object-fit: contain;
    background: #1f2824;
  }

  .pose-aware-frame-item div {
    display: grid;
    min-width: 0;
    gap: 3px;
    align-content: start;
  }

  .pose-aware-frame-item strong,
  .pose-aware-frame-item span {
    min-width: 0;
    overflow-wrap: anywhere;
    line-height: 1.35;
  }

  .pose-aware-frame-item strong {
    color: #25342e;
    font-size: 12px;
  }

  .pose-aware-frame-item span {
    color: #5d675f;
    font-size: 11px;
    font-weight: 700;
  }

  @media (max-width: 760px) {
    .frame-review-heading,
    .frame-review-card {
      display: grid;
      grid-template-columns: 1fr;
    }

    .frame-review-debug div {
      grid-template-columns: 1fr;
      gap: 2px;
    }
  }

  .pose-aware-frame-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 4px;
  }

  .pose-aware-inline-action {
    min-height: 28px;
    justify-self: start;
    margin-top: 3px;
    padding: 4px 8px;
    font-size: 11px;
  }

  .selected-frame-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 10px;
  }

  .selected-frame-card {
    min-width: 0;
    overflow: hidden;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
  }

  .selected-frame-empty {
    display: grid;
    min-height: 126px;
    align-content: start;
    gap: 8px;
    padding: 12px;
  }

  .selected-frame-detail {
    display: grid;
    grid-template-columns: 96px minmax(0, 1fr);
    gap: 10px;
    padding: 10px;
  }

  .selected-frame-detail img {
    display: block;
    width: 96px;
    aspect-ratio: 16 / 9;
    border-radius: 6px;
    object-fit: contain;
    background: #1f2824;
  }

  .selected-frame-detail div {
    display: grid;
    min-width: 0;
    gap: 4px;
    align-content: start;
  }

  .selected-frame-card h4,
  .selected-frame-card strong,
  .selected-frame-card span,
  .selected-frame-card p {
    min-width: 0;
    margin: 0;
    overflow-wrap: anywhere;
    line-height: 1.35;
  }

  .selected-frame-card h4 {
    color: #17201b;
    font-size: 13px;
  }

  .selected-frame-card strong,
  .selected-frame-card span,
  .selected-frame-card p {
    color: #5d675f;
    font-size: 12px;
    font-weight: 700;
  }

  .selected-clear-button {
    min-height: 30px;
    justify-self: start;
    margin-top: 3px;
    background: #5f6c66;
    padding: 5px 9px;
    font-size: 12px;
  }

  .readiness-list {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .dataset-ready-count,
  .dataset-note {
    margin: 8px 0 0;
    color: #25342e;
    font-size: 13px;
    font-weight: 800;
  }

  .dataset-note {
    color: #5d675f;
  }

  .dataset-entry-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 10px;
  }

  .ideal-3d-candidate-panel {
    display: grid;
    gap: 10px;
    margin-bottom: 16px;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
    padding: 14px;
  }

  .ideal-3d-candidate-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .ideal-3d-candidate-heading p,
  .candidate-result-note {
    margin: 5px 0 0;
    color: #5d675f;
    font-size: 13px;
    font-weight: 700;
  }

  .ideal-face-export-panel {
    display: grid;
    gap: 10px;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #edf4f1;
    padding: 12px;
  }

  .ideal-face-export-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .ideal-face-export-heading h5 {
    margin: 0;
    color: #25342e;
    font-size: 14px;
  }

  .ideal-face-export-heading p {
    margin: 5px 0 0;
    color: #5d675f;
    font-size: 13px;
    font-weight: 700;
  }

  .candidate-summary-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .ideal-face-export-summary-list {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .ideal-3d-preview {
    display: grid;
    gap: 4px;
    color: #5d675f;
    font-size: 12px;
    font-weight: 700;
  }

  .ideal-3d-preview ol {
    display: grid;
    gap: 3px;
    margin: 0;
    padding-left: 18px;
  }

  .point-cloud-preview-panel {
    display: grid;
    gap: 12px;
    margin-bottom: 16px;
  }

  .point-cloud-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    color: #25342e;
    font-size: 13px;
    font-weight: 800;
  }

  .point-cloud-preview-note {
    margin: 0;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #edf4f1;
    padding: 10px 12px;
    color: #5d675f;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.5;
  }

  .point-cloud-preset-button {
    min-height: 34px;
    border: 1px solid #b7c7c2;
    background: #edf4f1;
    color: #25342e;
    padding: 6px 11px;
    font-size: 13px;
  }

  .point-cloud-preset-button-active {
    border-color: #27594c;
    background: #27594c;
    color: #ffffff;
  }

  .point-cloud-preview,
  .point-cloud-empty {
    width: 100%;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
  }

  .point-cloud-preview {
    display: block;
    height: min(56vw, 520px);
    min-height: 280px;
    cursor: grab;
    touch-action: none;
  }

  .point-cloud-empty {
    display: grid;
    min-height: 220px;
    place-items: center;
    padding: 18px;
    color: #5d675f;
    text-align: center;
    font-size: 14px;
    font-weight: 700;
  }

  .point-cloud-empty p {
    margin: 0;
    line-height: 1.6;
  }

  .point-cloud-summary-list {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }

  .landmark-group-editor-panel {
    display: grid;
    gap: 12px;
    margin-bottom: 24px;
  }

  .landmark-group-editor-layout {
    display: grid;
    grid-template-columns: minmax(320px, 1fr) minmax(280px, 0.7fr);
    gap: 14px;
    align-items: start;
  }

  .landmark-group-editor-preview,
  .landmark-group-editor-controls {
    min-width: 0;
  }

  .landmark-group-editor-canvas,
  .landmark-group-editor-empty {
    width: 100%;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
  }

  .landmark-group-editor-canvas {
    display: block;
    height: min(56vw, 560px);
    min-height: 320px;
    cursor: pointer;
    touch-action: manipulation;
  }

  .landmark-group-editor-empty {
    display: grid;
    min-height: 260px;
    place-items: center;
    padding: 18px;
    color: #5d675f;
    text-align: center;
    font-size: 14px;
    font-weight: 700;
  }

  .landmark-group-editor-empty p {
    margin: 0;
    line-height: 1.6;
  }

  .landmark-group-editor-controls {
    display: grid;
    gap: 10px;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
    padding: 14px;
  }

  .landmark-group-select-label {
    color: #5d675f;
    font-size: 12px;
    font-weight: 800;
  }

  .landmark-group-selection-mode,
  .landmark-group-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    align-items: center;
    color: #25342e;
    font-size: 12px;
    font-weight: 800;
  }

  .landmark-group-selection-mode span {
    flex-basis: 100%;
    color: #5d675f;
  }

  .landmark-group-selection-mode label {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .landmark-group-legend {
    border: 1px solid #dce6e1;
    border-radius: 8px;
    background: #fbfdfc;
    padding: 8px 10px;
  }

  .landmark-group-legend span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    border: 1px solid currentColor;
  }

  .legend-dot-normal {
    background: #9fb4ad;
    color: #7c918a;
  }

  .legend-dot-selected {
    background: #d94f45;
    color: #7d2a28;
  }

  .legend-dot-range {
    background: #2f78c4;
    color: #184f8b;
  }

  .legend-dot-highlight {
    background: #c98518;
    color: #7a510c;
  }

  #landmark-group-select {
    width: 100%;
    min-height: 40px;
    border: 1px solid #b7c7c2;
    border-radius: 6px;
    background: #ffffff;
    color: #25342e;
    padding: 8px 10px;
    font: inherit;
    font-weight: 800;
  }

  .landmark-group-summary-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .landmark-group-editor-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .landmark-group-action-button {
    min-height: 34px;
    background: #edf4f1;
    color: #25342e;
    border: 1px solid #b7c7c2;
    padding: 6px 10px;
    font-size: 12px;
  }

  .landmark-group-validation-ok,
  .landmark-group-validation-errors,
  .landmark-group-validation-errors-inline,
  .landmark-group-bulk-panel,
  .landmark-group-indices-panel,
  .landmark-group-future-panel {
    margin: 0;
    border: 1px solid #dce6e1;
    border-radius: 8px;
    background: #fbfdfc;
    padding: 10px 12px;
    color: #5d675f;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.5;
  }

  .landmark-group-validation-ok {
    border-color: #9fc8bd;
    background: #edf8f4;
    color: #27594c;
  }

  .landmark-group-validation-errors {
    display: grid;
    gap: 4px;
    padding-left: 28px;
    border-color: #d69a94;
    background: #fff7f6;
    color: #7d2a28;
  }

  .landmark-group-validation-errors-inline {
    border-color: #d69a94;
    background: #fff7f6;
    color: #7d2a28;
  }

  .landmark-group-bulk-panel {
    display: grid;
    gap: 8px;
  }

  .landmark-group-bulk-panel h3 {
    margin: 0;
    color: #25342e;
    font-size: 13px;
  }

  .landmark-group-bulk-panel p {
    margin: 0;
    overflow-wrap: anywhere;
    font-size: 12px;
  }

  .landmark-group-highlight-input {
    width: 100%;
    min-height: 88px;
    resize: vertical;
    border: 1px solid #b7c7c2;
    border-radius: 6px;
    background: #ffffff;
    color: #25342e;
    padding: 9px 10px;
    font: inherit;
    font-size: 13px;
    line-height: 1.45;
  }

  .landmark-group-indices-panel h3,
  .landmark-group-future-panel h3 {
    margin: 0 0 6px;
    color: #25342e;
    font-size: 13px;
  }

  .landmark-group-indices-panel p,
  .landmark-group-future-panel p {
    margin: 0;
    overflow-wrap: anywhere;
    font-size: 12px;
  }

  .dataset-entry-card {
    display: grid;
    grid-template-columns: 104px minmax(0, 1fr);
    gap: 10px;
    min-width: 0;
    overflow: hidden;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
    padding: 10px;
  }

  .dataset-entry-card img,
  .dataset-thumbnail-empty {
    display: block;
    width: 104px;
    aspect-ratio: 16 / 9;
    border-radius: 6px;
    object-fit: contain;
    background: #1f2824;
  }

  .dataset-thumbnail-empty {
    display: grid;
    place-items: center;
    color: #f2f7f4;
    font-size: 12px;
    font-weight: 800;
  }

  .dataset-entry-body {
    display: grid;
    min-width: 0;
    gap: 4px;
    align-content: start;
  }

  .dataset-entry-card h4,
  .dataset-entry-card strong,
  .dataset-entry-card span,
  .dataset-entry-card p,
  .dataset-entry-card li {
    min-width: 0;
    margin: 0;
    overflow-wrap: anywhere;
    line-height: 1.35;
  }

  .dataset-entry-card h4 {
    color: #17201b;
    font-size: 13px;
  }

  .dataset-entry-card strong,
  .dataset-entry-card span,
  .dataset-entry-card p,
  .dataset-entry-card li {
    color: #5d675f;
    font-size: 12px;
    font-weight: 700;
  }

  .dataset-entry-ready {
    border-color: #9fc8bd;
  }

  .dataset-entry-invalid {
    border-color: #d69a94;
  }

  .landmark-preview {
    display: grid;
    gap: 3px;
    padding-top: 2px;
  }

  .landmark-preview ol {
    display: grid;
    gap: 2px;
    margin: 0;
    padding-left: 18px;
  }

  .analysis-summary {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin-top: 12px;
  }

  .candidate-category-stack {
    display: grid;
    gap: 12px;
  }

  .candidate-card {
    min-width: 0;
    overflow: hidden;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
  }

  .candidate-category-toggle-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    padding: 12px;
  }

  .candidate-card h3,
  .candidate-card strong,
  .candidate-card span,
  .candidate-card p {
    min-width: 0;
    margin: 0;
    overflow-wrap: anywhere;
    line-height: 1.35;
  }

  .candidate-card h3 {
    color: #17201b;
    font-size: 14px;
  }

  .candidate-category-toggle-button {
    min-height: 32px;
    padding: 6px 11px;
    font-size: 12px;
  }

  .candidate-collapsed-text {
    margin: 0;
    border-top: 1px solid #dde6e2;
    padding: 12px;
  }

  .candidate-list {
    display: grid;
    gap: 1px;
    background: #dde6e2;
  }

  .candidate-item {
    display: grid;
    grid-template-columns: 116px minmax(0, 1fr);
    gap: 10px;
    background: #ffffff;
    padding: 10px 12px;
  }

  .candidate-item img {
    display: block;
    width: 116px;
    aspect-ratio: 16 / 9;
    border-radius: 6px;
    object-fit: contain;
    background: #1f2824;
  }

  .candidate-item-body {
    display: grid;
    min-width: 0;
    gap: 4px;
    align-content: start;
  }

  .candidate-card strong {
    color: #25342e;
    font-size: 13px;
  }

  .candidate-card span,
  .candidate-card p {
    color: #5d675f;
    font-size: 12px;
    font-weight: 700;
  }

  .candidate-card-empty {
    min-height: 180px;
    align-content: start;
  }

  .candidate-action-group {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding-top: 6px;
  }

  .candidate-action-group > span {
    flex-basis: 100%;
  }

  .candidate-label-button {
    min-height: 30px;
    background: #edf4f1;
    color: #25342e;
    border: 1px solid #b7c7c2;
    padding: 5px 8px;
    font-size: 12px;
  }

  .frames-panel-debug {
    border-top: 1px solid #ccd8d3;
    padding-top: 16px;
  }

  .debug-panel-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
  }

  .debug-panel-heading p,
  .debug-collapsed-text {
    margin: 5px 0 0;
    color: #5d675f;
    font-size: 13px;
    font-weight: 700;
  }

  .debug-collapsed-text {
    margin: 0;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
    padding: 14px;
  }

  @media (max-width: 520px) {
    .candidate-item,
    .dataset-entry-card,
    .frame-usage-card,
    .pose-aware-frame-item {
      grid-template-columns: 1fr;
    }

    .candidate-item img,
    .dataset-entry-card img,
    .frame-usage-card img,
    .pose-aware-frame-item img,
    .dataset-thumbnail-empty {
      width: 100%;
    }
  }

  .frame-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
  }

  .frame-card {
    min-width: 0;
    overflow: hidden;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
  }

  .frame-card img {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: contain;
    background: #1f2824;
  }

  .frame-card div {
    display: grid;
    gap: 5px;
    padding: 10px;
  }

  .frame-card strong,
  .frame-card span {
    min-width: 0;
    overflow-wrap: anywhere;
    line-height: 1.35;
  }

  .frame-card strong {
    color: #17201b;
    font-size: 13px;
  }

  .frame-card span {
    color: #5d675f;
    font-size: 12px;
    font-weight: 700;
  }

  .workspace {
    display: grid;
    grid-template-columns: minmax(300px, 0.85fr) minmax(420px, 1.15fr);
    gap: 20px;
    align-items: start;
  }

  .preview-panel,
  .table-panel,
  .json-panel {
    min-width: 0;
  }

  h2 {
    margin: 0 0 10px;
    font-size: 17px;
    line-height: 1.25;
    letter-spacing: 0;
  }

  .preview {
    display: block;
    width: 100%;
    aspect-ratio: 1;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
  }

  .axis {
    stroke: #b7c7c2;
    stroke-width: 0.35;
  }

  .preview-point circle {
    fill: #d94f45;
    stroke: #7d2a28;
    stroke-width: 0.45;
  }

  .preview-point text {
    fill: #25342e;
    font-size: 3.4px;
    font-weight: 700;
  }

  .table-scroll {
    overflow-x: auto;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
  }

  table {
    width: 100%;
    min-width: 560px;
    border-collapse: collapse;
  }

  th,
  td {
    border-bottom: 1px solid #dde6e2;
    padding: 11px 12px;
    text-align: left;
    font-size: 13px;
  }

  th {
    color: #5d675f;
    background: #edf4f1;
    font-weight: 800;
  }

  td:nth-child(3),
  td:nth-child(4),
  td:nth-child(5) {
    font-variant-numeric: tabular-nums;
  }

  tr:last-child td {
    border-bottom: 0;
  }

  .json-panel {
    margin-top: 24px;
  }

  pre {
    margin: 0;
    max-height: 480px;
    overflow: auto;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #1f2824;
    color: #f2f7f4;
    padding: 14px;
    font-size: 12px;
    line-height: 1.5;
  }

  @media (max-width: 840px) {
    main {
      width: min(100% - 24px, 680px);
      padding-top: 18px;
    }

    .app-header {
      align-items: flex-start;
      flex-direction: column;
    }

    dl,
    .video-workspace,
    .workspace,
    .landmark-group-editor-layout {
      grid-template-columns: 1fr;
    }

    .panel-heading,
    .debug-panel-heading,
    .ideal-3d-candidate-heading,
    .ideal-face-export-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .candidate-summary-list {
      grid-template-columns: 1fr;
    }

    .pose-aware-columns {
      grid-template-columns: 1fr;
    }
  }
`

document.head.append(style)
window.addEventListener("beforeunload", () => {
  faceLandmarker?.close()
})
render()
