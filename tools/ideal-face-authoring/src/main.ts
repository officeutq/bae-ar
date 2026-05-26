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
const SCAN_PRESET_MAX_SCAN_FRAMES = {
  quick: 150,
  standard: 300,
  detailed: 500,
} as const
const ADAPTIVE_MAX_SCAN_FRAMES = 1500
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
const CHIN_INDEX = 152
const LEFT_CHEEK_INDEX = 234
const RIGHT_CHEEK_INDEX = 454
const LEFT_CONTOUR_INDEX = 127
const RIGHT_CONTOUR_INDEX = 356
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
const POSE_AWARE_CANONICAL_NEAR_FRONT_YAW_DEG = 5
const POSE_AWARE_CANONICAL_YAW_IMBALANCE_WARNING_RATIO = 0.4
const POSE_AWARE_CANONICAL_CENTER_OFFSET_WARNING = 0.03
const POSE_AWARE_CANONICAL_MIN_NEAR_FRONT_COUNT = 3
const POSE_AWARE_CANONICAL_Z_RANGE_WARNING_MIN = 0.02
const POSE_AWARE_CANONICAL_Z_RANGE_WARNING_MAX = 1
const POSE_AWARE_STABLE_Z_MIN_USEFUL_ANGLE_DEG = 5
const POSE_AWARE_STABLE_Z_IDEAL_ANGLE_DEG = 16
const POSE_AWARE_STABLE_Z_MAX_USEFUL_ANGLE_DEG = 32
const POSE_AWARE_STABLE_Z_LOW_SIGNAL = 0.12
const POSE_AWARE_STABLE_Z_DIRECTION_BALANCE_MIN = 0.25
const POSE_AWARE_STABLE_Z_DIRECTION_BALANCE_MAX = 3
const POSE_AWARE_STABLE_Z_PERCENTILE_LOW = 0.1
const POSE_AWARE_STABLE_Z_PERCENTILE_HIGH = 0.9
const POSE_AWARE_STABLE_Z_FRAME_DEBUG_COUNT = 5
const POSE_AWARE_STABLE_Z_SIGNAL_IMBALANCE_WARNING_RATIO = 3
const POSE_AWARE_STABLE_Z_FALLBACK_WARNING_RATIO = 0.15
const POSE_AWARE_STABLE_Z_CLAMPED_FRAME_WARNING_RATIO = 0.25
const POSE_AWARE_TOP_VIEW_ASYMMETRY_WARNING_SCORE = 0.08
const POSE_AWARE_LOW_CONFIDENCE_THRESHOLD = 0.45
const POSE_AWARE_SHAPE_FRAME_POSE_PENALTY_DEG = 45
const POSE_AWARE_MIN_SHAPE_FRAME_WEIGHT = 0.25
const MEDIA_PIPE_Z_SOURCE = "mediapipe_landmark_z"
const MEDIA_PIPE_Z_DEFAULT_NORMALIZE_MODE = "faceWidthScaled"
const MEDIA_PIPE_Z_DEFAULT_SCALE = 1
const MEDIA_PIPE_Z_DEFAULT_INVERT_SIGN = true
const MEDIA_PIPE_Z_FRONT_REFERENCE_MATCH_RANGE_RATIO = 0.35
const MEDIA_PIPE_Z_EXTREME_RANGE_WARNING_MAX = 1
const MEDIA_PIPE_Z_THIN_RANGE_WARNING_RATIO = 0.03
const MEDIA_PIPE_Z_THICK_RANGE_WARNING_RATIO = 1.2
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
const FRONT_REFERENCE_RECOMMENDED_COUNT = {
  min: 5,
  max: 10,
} as const
const FRONT_REFERENCE_CANDIDATE_POSE_LIMIT = {
  yaw: 15,
  pitch: 20,
  roll: 10,
} as const
const FRONT_REFERENCE_CANDIDATE_PREVIEW_COUNT = 8
const USAGE_BUCKET_TARGETS = {
  idealFaceInference: 80,
  mouthPucker: 20,
  jawOpen: 20,
  mouthSmile: 20,
  eyeBlinkLeft: 10,
  eyeBlinkRight: 10,
  eyeSquintLeft: 10,
  eyeSquintRight: 10,
} as const
const REQUIRED_USAGE_BUCKET_IDS = ["idealFaceInference"] as const
const OPTIONAL_USAGE_BUCKET_IDS = [...EXPRESSION_GROUP_IDS] as const
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
  facialTransformationMatrix: FaceTransformationMatrixSummary | null
  errorMessage: string | null
  analyzedAt: number
}

interface BlendshapeScore {
  categoryName: string
  displayName: string
  score: number
}

interface FaceTransformationMatrixSummary {
  rows: number
  columns: number
  finiteValueCount: number
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

type ScanPreset = keyof typeof SCAN_PRESET_MAX_SCAN_FRAMES

type UsageBucketId = keyof typeof USAGE_BUCKET_TARGETS

type UsageBucketStatus = "ok" | "insufficient"

type EarlyStopReason = "required_buckets_satisfied"

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
  adaptiveBucketAdoptions: UsageBucketId[]
  adaptiveSkippedBuckets: UsageBucketId[]
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
  hasFacialTransformationMatrix: boolean
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

interface Point3D extends Point2D {
  z: number
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

interface LandmarkSpatialSummary {
  bounds: LandmarkBoundsSummary | null
  centroid: Point3D | null
  boundsCenter: Point3D | null
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

interface FrameStableZWeightDebug {
  frameId: string
  yaw: number
  pitch: number
  yawPositiveSignal: number
  yawNegativeSignal: number
  pitchPositiveSignal: number
  pitchNegativeSignal: number
  qualityWeight: number
  poseUsefulnessWeight: number
  zHintDirectionBalanceWeight: number
  directionBalanceWeight: number
  actualYawZHintWeight: number
  actualPitchZHintWeight: number
  debugFinalZHintWeight: number
  finalZHintWeight: number
  directionBalanceClamped: boolean
  canonicalAverageDirectionBalanceWeight: number
  finalCanonicalAverageWeight: number
  canonicalAverageDirectionBalanceClamped: boolean
}

interface StableZLandmarkValue {
  index: number
  z: number
  confidence: number
  totalWeight: number
  candidateCount: number
  fallbackUsed: boolean
}

interface StableZSummary {
  generationMethod:
    | "pose_aware_canonical_stable_z_v1"
    | "pose_aware_canonical_balanced_frame_z_v1"
  zMin: number
  zMax: number
  zAverage: number
  zRange: number
  confidenceAverage: number
  confidenceMin: number
  confidenceMax: number
  totalWeightAverage: number
  totalWeightMin: number
  totalWeightMax: number
  fallbackCount: number
  zHintCandidateCountMin: number
  zHintCandidateCountMax: number
  zHintCandidateCountAverage: number
}

interface DirectionBalanceSummary {
  totalYawPositiveSignal: number
  totalYawNegativeSignal: number
  totalPitchPositiveSignal: number
  totalPitchNegativeSignal: number
  yawPositiveNegativeSignalRatio: number | null
  pitchPositiveNegativeSignalRatio: number | null
  averageDirectionBalanceWeight: number
  minDirectionBalanceWeight: number
  maxDirectionBalanceWeight: number
  clampedDirectionBalanceWeightCount: number
}

interface ZHintSourceWeightSummary {
  count: number
  weightTotal: number
  zAverage: number | null
  zRange: number | null
}

interface StableZWeightDebugSummary {
  yawPositiveZHintWeightTotal: number
  yawNegativeZHintWeightTotal: number
  pitchPositiveZHintWeightTotal: number
  pitchNegativeZHintWeightTotal: number
  yawDerived: ZHintSourceWeightSummary
  pitchDerived: ZHintSourceWeightSummary
}

interface CanonicalAverageWeightDebugSummary {
  yawPositiveCanonicalAverageWeightTotal: number
  yawNegativeCanonicalAverageWeightTotal: number
  pitchPositiveCanonicalAverageWeightTotal: number
  pitchNegativeCanonicalAverageWeightTotal: number
  yawPositiveCanonicalAverageFrameCount: number
  yawNegativeCanonicalAverageFrameCount: number
  averageCanonicalAverageDirectionBalanceWeight: number
  minCanonicalAverageDirectionBalanceWeight: number
  maxCanonicalAverageDirectionBalanceWeight: number
  clampedCanonicalAverageDirectionBalanceWeightCount: number
}

interface FrameStableZWeightDebugSummary {
  topWeightedFrames: FrameStableZWeightDebug[]
  lowestWeightedFrames: FrameStableZWeightDebug[]
  yawPositiveFramesAverageWeight: number
  yawNegativeFramesAverageWeight: number
  pitchPositiveFramesAverageWeight: number
  pitchNegativeFramesAverageWeight: number
}

interface TopViewZAsymmetrySummary {
  basis: "x_center_split"
  leftSidePointCount: number
  rightSidePointCount: number
  leftSideZAverage: number | null
  rightSideZAverage: number | null
  leftRightZAverageDelta: number | null
  leftSideZRange: number | null
  rightSideZRange: number | null
  leftRightZRangeDelta: number | null
  topViewAsymmetryScore: number | null
  warning: string
}

interface NearFrontObservationDebugSummary {
  nearFrontObservationFrameCount: number
  frontReferenceFrameCount: number
  useForInferenceFrontReferenceFrameCount: number
  warning: string | null
}

interface FrameZHintSummary {
  generationMethod: "pose_aware_canonical_balanced_frame_z_v1"
  zMin: number
  zMax: number
  zAverage: number
  zRange: number
  fallbackCount: number
  clampCount: number
  stableZFallbackUsed: boolean
  combined: ZHintSourceWeightSummary
  yawDerived: ZHintSourceWeightSummary
  pitchDerived: ZHintSourceWeightSummary
}

interface CandidateDebugComparisonItem {
  generationMethod: IdealLandmarks3DGenerationMethod
  zMin: number
  zMax: number
  zRange: number
  boundsCenterX: number | null
  boundsCenterZ: number | null
  noseTipX: number | null
  noseTipZ: number | null
  mouthCenterX: number | null
  mouthCenterZ: number | null
  chinX: number | null
  chinZ: number | null
  leftCheekZ: number | null
  rightCheekZ: number | null
  leftContourZ: number | null
  rightContourZ: number | null
  leftRightZAverageDelta: number | null
  leftRightZRangeDelta: number | null
  topViewAsymmetryScore: number | null
}

interface BalancedFrameZCandidateComparisonDebug {
  canonical3D: CandidateDebugComparisonItem | null
  canonicalStableZ: CandidateDebugComparisonItem | null
  balancedFrameZ: CandidateDebugComparisonItem
}

interface PoseAwareYawBinSummary {
  id: string
  yawMin: number | null
  yawMax: number | null
  count: number
  weightTotal: number
}

interface PoseAwareObservationFrameDebugSummary {
  totalObservationFrameCount: number
  negativeYawCount: number
  positiveYawCount: number
  nearFrontCount: number
  yawBins: PoseAwareYawBinSummary[]
}

interface PoseAwareRepresentativePointSummary {
  noseTipX: number | null
  noseTipZ: number | null
  mouthCenterX: number | null
  mouthCenterZ: number | null
  chinX: number | null
  chinZ: number | null
  leftCheekZ: number | null
  rightCheekZ: number | null
  leftContourZ: number | null
  rightContourZ: number | null
  noseOffsetFromBoundsCenterX: number | null
}

interface PoseAwarePartialCandidateSummary {
  frameCount: number
  weightTotal: number
  spatial: LandmarkSpatialSummary
  representative: PoseAwareRepresentativePointSummary
}

interface PoseAwareCandidateComparisonDebug {
  oldGenerationMethod: IdealLandmarks3DGenerationMethod
  newGenerationMethod: IdealLandmarks3DGenerationMethod
  oldCandidate: {
    spatial: LandmarkSpatialSummary
    representative: PoseAwareRepresentativePointSummary
    topView: TopViewZAsymmetrySummary
  }
  newCandidate: {
    spatial: LandmarkSpatialSummary
    representative: PoseAwareRepresentativePointSummary
    topView: TopViewZAsymmetrySummary
  }
  noseOffsetDelta: number | null
  boundsCenterOffset: Point3D | null
  zRangeDelta: number | null
  topViewAsymmetryDelta: number | null
}

interface PoseAwareCanonical3DDebug {
  generationMethod: "pose_aware_canonical_3d_v1"
  observationFrames: PoseAwareObservationFrameDebugSummary
  canonicalization: {
    frameLocal3DBounds: LandmarkBoundsSummary | null
    inversePoseCanonical3DBounds: LandmarkBoundsSummary | null
    canonicalAverage: LandmarkSpatialSummary
  }
  comparison?: PoseAwareCandidateComparisonDebug
  partialCandidates: {
    rightYawOnly: PoseAwarePartialCandidateSummary
    leftYawOnly: PoseAwarePartialCandidateSummary
    nearFrontOnly: PoseAwarePartialCandidateSummary
  }
  warnings: string[]
}

interface PoseAwareCanonicalStableZDebug {
  generationMethod: "pose_aware_canonical_stable_z_v1"
  observationFrames: PoseAwareObservationFrameDebugSummary
  stableZ: StableZSummary
  directionBalance: DirectionBalanceSummary
  stableZWeights: StableZWeightDebugSummary
  canonicalAverageWeights: CanonicalAverageWeightDebugSummary
  frameWeights: FrameStableZWeightDebugSummary
  nearFrontObservation: NearFrontObservationDebugSummary
  canonicalization: {
    frameLocal3DBounds: LandmarkBoundsSummary | null
    inversePoseCanonical3DBounds: LandmarkBoundsSummary | null
    canonicalAverage: LandmarkSpatialSummary
  }
  comparison?: PoseAwareCandidateComparisonDebug
  topView: TopViewZAsymmetrySummary
  warnings: string[]
}

interface PoseAwareCanonicalBalancedFrameZDebug {
  generationMethod: "pose_aware_canonical_balanced_frame_z_v1"
  generationSummary: {
    observationFrameCount: number
    frontReferenceFrameCount: number
    nearFrontObservationFrameCount: number
    useForInferenceFrontReferenceFrameCount: number
  }
  observationFrames: PoseAwareObservationFrameDebugSummary
  directionBalance: DirectionBalanceSummary
  frameZHint: FrameZHintSummary
  canonicalAverageWeights: CanonicalAverageWeightDebugSummary
  frameWeights: FrameStableZWeightDebugSummary
  nearFrontObservation: NearFrontObservationDebugSummary
  canonicalization: {
    frameLocal3DBounds: LandmarkBoundsSummary | null
    inversePoseCanonical3DBounds: LandmarkBoundsSummary | null
    canonicalAverage: LandmarkSpatialSummary
  }
  comparison?: PoseAwareCandidateComparisonDebug
  multiCandidateComparison: BalancedFrameZCandidateComparisonDebug
  topView: TopViewZAsymmetrySummary
  warnings: string[]
}

type MediaPipeZNormalizeMode =
  | "raw"
  | "centered"
  | "faceWidthScaled"
  | "frontReferenceMatched"

interface MediaPipeMeshAverageSettingsDebug {
  mediaPipeZSource: typeof MEDIA_PIPE_Z_SOURCE
  mediaPipeZScale: number
  mediaPipeZCenteringMode: "none" | "frame_mean"
  mediaPipeZInvertSign: boolean
  mediaPipeZNormalizeMode: MediaPipeZNormalizeMode
  frontReferenceMatchRangeRatio: number
}

interface MediaPipeZAvailabilityDebug {
  hasLandmarkZ: boolean
  landmarkZFiniteCount: number
  landmarkZMissingCount: number
  frameCountWithZ: number
  frameCountWithoutZ: number
  hasTransformMatrix: boolean
  transformMatrixAvailableCount: number
}

interface MediaPipeZRangeDebug {
  rawMediaPipeZMin: number | null
  rawMediaPipeZMax: number | null
  rawMediaPipeZAverage: number | null
  rawMediaPipeZRange: number | null
  normalizedMediaPipeZMin: number | null
  normalizedMediaPipeZMax: number | null
  normalizedMediaPipeZAverage: number | null
  normalizedMediaPipeZRange: number | null
  mediaPipeZRangeBeforeScale: number | null
  mediaPipeZRangeAfterScale: number | null
  finalCandidateZMin: number | null
  finalCandidateZMax: number | null
  finalCandidateZRange: number | null
}

interface MediaPipeMeshAverageCandidateComparisonDebug {
  canonical3D: CandidateDebugComparisonItem | null
  canonicalStableZ: CandidateDebugComparisonItem | null
  balancedFrameZ: CandidateDebugComparisonItem | null
  mediaPipeMeshAverage: CandidateDebugComparisonItem
}

interface PoseAwareMediaPipeMeshAverageDebug {
  generationMethod: "pose_aware_mediapipe_mesh_average_v1"
  settings: MediaPipeMeshAverageSettingsDebug
  generationSummary: {
    observationFrameCount: number
    frontReferenceFrameCount: number
    nearFrontObservationFrameCount: number
    useForInferenceFrontReferenceFrameCount: number
  }
  observationFrames: PoseAwareObservationFrameDebugSummary
  mediaPipeZAvailability: MediaPipeZAvailabilityDebug
  mediaPipeZRange: MediaPipeZRangeDebug
  directionBalance: DirectionBalanceSummary
  canonicalAverageWeights: CanonicalAverageWeightDebugSummary
  frameWeights: FrameStableZWeightDebugSummary
  nearFrontObservation: NearFrontObservationDebugSummary
  canonicalization: {
    frameLocal3DBounds: LandmarkBoundsSummary | null
    inversePoseCanonical3DBounds: LandmarkBoundsSummary | null
    canonicalAverage: LandmarkSpatialSummary
  }
  comparison?: PoseAwareCandidateComparisonDebug
  multiCandidateComparison: MediaPipeMeshAverageCandidateComparisonDebug
  topView: TopViewZAsymmetrySummary
  warnings: string[]
}

type IdealLandmarks3DCandidateDebug =
  | PoseAwareCanonical3DDebug
  | PoseAwareCanonicalStableZDebug
  | PoseAwareCanonicalBalancedFrameZDebug
  | PoseAwareMediaPipeMeshAverageDebug

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

type IdealLandmarks3DGenerationMethod =
  | "pose_aware_weighted_z_v1"
  | "pose_aware_canonical_3d_v1"
  | "pose_aware_canonical_stable_z_v1"
  | "pose_aware_canonical_balanced_frame_z_v1"
  | "pose_aware_mediapipe_mesh_average_v1"

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
  source: IdealLandmarks3DGenerationMethod
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
  debug?: IdealLandmarks3DCandidateDebug
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
  scanPreset: ScanPreset
  scanIntervalSec: number
  maxScanFrames: number
  presetMaxScanFrames: number
  adaptiveMaxScanFrames: number
  effectiveMaxScanFrames: number
  scannedFrameCount: number
  analyzedFrameCount: number
  detectedFrameCount: number
  candidateSourceFrameCount: number
  adaptiveSamplingEnabled: boolean
  earlyStopped: boolean
  earlyStopReason: EarlyStopReason | null
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
  autoExpressionGroupCounts: Record<FrameExpressionGroup, number>
  adaptiveBucketAdoptionCounts: Record<UsageBucketId, number>
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
    adaptiveBucketAdoptions: UsageBucketId[]
    adaptiveSkippedBuckets: UsageBucketId[]
  }>
}

interface FrontReferenceSummary {
  selectedCount: number
  candidateCount: number
  recommendedMin: number
  recommendedMax: number
  status: UsageBucketStatus
  candidateFrameIdPreview: string[]
}

interface UsageBucketSummary {
  id: UsageBucketId
  targetCount: number
  selectedCount: number
  autoDetectedCount: number
  status: UsageBucketStatus
  priority: "required" | "optional"
  skippedAfterTargetCount: number
}

interface AdaptiveScanMetrics {
  enabled: boolean
  selectedCounts: Record<UsageBucketId, number>
  skippedAfterTargetCount: Record<UsageBucketId, number>
  earlyStopped: boolean
  earlyStopReason: EarlyStopReason | null
  scannedFrameCount: number
  maxScanFrames: number
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
let scanPreset: ScanPreset = "standard"
let adaptiveSamplingEnabled = false
let lastAdaptiveScanMetrics: AdaptiveScanMetrics | null = null
let frameReviewIndex = 0
let idealLandmarks3DCandidateResult: IdealLandmarks3DCandidateResult =
  createInitialIdealLandmarks3DCandidateResult()
let idealLandmarks3DCandidateResults: Partial<
  Record<IdealLandmarks3DGenerationMethod, IdealLandmarks3DCandidateResult>
> = {}
let selectedIdealLandmarks3DGenerationMethod: IdealLandmarks3DGenerationMethod =
  "pose_aware_weighted_z_v1"
let mediaPipeZNormalizeMode: MediaPipeZNormalizeMode =
  MEDIA_PIPE_Z_DEFAULT_NORMALIZE_MODE
let mediaPipeZScale = MEDIA_PIPE_Z_DEFAULT_SCALE
let mediaPipeZInvertSign = MEDIA_PIPE_Z_DEFAULT_INVERT_SIGN
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

function getScanSettings(preset: ScanPreset = scanPreset): {
  preset: ScanPreset
  maxScanFrames: number
} {
  return {
    preset,
    maxScanFrames: SCAN_PRESET_MAX_SCAN_FRAMES[preset],
  }
}

function createUsageBucketCountRecord(): Record<UsageBucketId, number> {
  return (Object.keys(USAGE_BUCKET_TARGETS) as UsageBucketId[]).reduce(
    (record, id) => ({
      ...record,
      [id]: 0,
    }),
    {} as Record<UsageBucketId, number>,
  )
}

function createAdaptiveScanMetrics(
  enabled: boolean,
  maxScanFrames: number,
): AdaptiveScanMetrics {
  return {
    enabled,
    selectedCounts: createUsageBucketCountRecord(),
    skippedAfterTargetCount: createUsageBucketCountRecord(),
    earlyStopped: false,
    earlyStopReason: null,
    scannedFrameCount: 0,
    maxScanFrames,
  }
}

function getEffectiveMaxScanFrames(
  presetMaxScanFrames: number,
  enabled: boolean = adaptiveSamplingEnabled,
): number {
  return enabled ? ADAPTIVE_MAX_SCAN_FRAMES : presetMaxScanFrames
}

function getSkippedAfterTargetCount(id: UsageBucketId): number {
  return lastAdaptiveScanMetrics?.skippedAfterTargetCount[id] ?? 0
}

function formatEarlyStopReason(reason: EarlyStopReason | null): string {
  return reason === "required_buckets_satisfied"
    ? "required buckets satisfied"
    : "なし"
}

function isScanPreset(value: string | undefined): value is ScanPreset {
  return (
    value === "quick" || value === "standard" || value === "detailed"
  )
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
  const scanSettings = getScanSettings()
  const effectiveMaxScanFrames = getEffectiveMaxScanFrames(
    scanSettings.maxScanFrames,
  )

  return {
    scanPreset: scanSettings.preset,
    scanIntervalSec: DETAILED_SCAN_INTERVAL_SEC,
    maxScanFrames: effectiveMaxScanFrames,
    presetMaxScanFrames: scanSettings.maxScanFrames,
    adaptiveMaxScanFrames: ADAPTIVE_MAX_SCAN_FRAMES,
    effectiveMaxScanFrames,
    scannedFrameCount: 0,
    analyzedFrameCount: 0,
    detectedFrameCount: 0,
    candidateSourceFrameCount: 0,
    adaptiveSamplingEnabled,
    earlyStopped: false,
    earlyStopReason: null,
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
  lastAdaptiveScanMetrics = null
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

function summarizeFacialTransformationMatrix(
  matrix: Matrix | undefined,
): FaceTransformationMatrixSummary | null {
  if (!matrix) {
    return null
  }

  return {
    rows: matrix.rows,
    columns: matrix.columns,
    finiteValueCount: matrix.data.filter((value) => Number.isFinite(value))
      .length,
  }
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

function isIdealLandmarks3DGenerationMethod(
  value: string | undefined,
): value is IdealLandmarks3DGenerationMethod {
  return (
    value === "pose_aware_weighted_z_v1" ||
    value === "pose_aware_canonical_3d_v1" ||
    value === "pose_aware_canonical_stable_z_v1" ||
    value === "pose_aware_canonical_balanced_frame_z_v1" ||
    value === "pose_aware_mediapipe_mesh_average_v1"
  )
}

function isMediaPipeZNormalizeMode(
  value: string | undefined,
): value is MediaPipeZNormalizeMode {
  return (
    value === "raw" ||
    value === "centered" ||
    value === "faceWidthScaled" ||
    value === "frontReferenceMatched"
  )
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
  idealLandmarks3DCandidateResults = {}
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

function buildLandmarkSpatialSummary(
  points: Array<{ x: number; y: number; z?: number }>,
): LandmarkSpatialSummary {
  const finitePoints = points.filter(
    (point) =>
      Number.isFinite(point.x) &&
      Number.isFinite(point.y) &&
      Number.isFinite(point.z ?? 0),
  )
  const bounds = buildLandmarkBoundsSummary(finitePoints)
  const zValues = finitePoints
    .map((point) => point.z)
    .filter((value): value is number => Number.isFinite(value))

  return {
    bounds,
    centroid:
      finitePoints.length === 0
        ? null
        : {
            x: roundDebugNumber(
              averageNumbers(finitePoints.map((point) => point.x)),
            ),
            y: roundDebugNumber(
              averageNumbers(finitePoints.map((point) => point.y)),
            ),
            z: roundDebugNumber(averageNumbers(zValues)),
          },
    boundsCenter:
      bounds === null
        ? null
        : {
            x: roundDebugNumber((bounds.xMin + bounds.xMax) / 2),
            y: roundDebugNumber((bounds.yMin + bounds.yMax) / 2),
            z:
              bounds.zMin === undefined || bounds.zMax === undefined
                ? 0
                : roundDebugNumber((bounds.zMin + bounds.zMax) / 2),
          },
  }
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
    debug: result.debug ?? null,
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
      "frontReference base x/y provides the reference basis; only useForInference observation frames contribute to IdealFace shape x/y and z hints.",
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
    result.generationMethod !== null &&
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
    result.generationMethod === null
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
    generationMethod: result.generationMethod ?? "pose_aware_weighted_z_v1",
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

function formatPoint3D(point: Point3D | null | undefined): string {
  return point
    ? `x ${formatNumber(point.x)} / y ${formatNumber(point.y)} / z ${formatNumber(point.z)}`
    : "none"
}

function renderSpatialSummaryRows(spatial: LandmarkSpatialSummary): string {
  return `
    <div>
      <dt>centroid</dt>
      <dd>${formatPoint3D(spatial.centroid)}</dd>
    </div>
    <div>
      <dt>bounds center</dt>
      <dd>${formatPoint3D(spatial.boundsCenter)}</dd>
    </div>
    ${renderBoundsSummaryRows(spatial.bounds)}
  `
}

function renderRepresentativeSummaryRows(
  representative: PoseAwareRepresentativePointSummary,
): string {
  return `
    <div>
      <dt>nose tip x</dt>
      <dd>${formatNullableDebugNumber(representative.noseTipX)}</dd>
    </div>
    <div>
      <dt>nose tip z</dt>
      <dd>${formatNullableDebugNumber(representative.noseTipZ)}</dd>
    </div>
    <div>
      <dt>mouth center x</dt>
      <dd>${formatNullableDebugNumber(representative.mouthCenterX)}</dd>
    </div>
    <div>
      <dt>mouth center z</dt>
      <dd>${formatNullableDebugNumber(representative.mouthCenterZ)}</dd>
    </div>
    <div>
      <dt>chin x</dt>
      <dd>${formatNullableDebugNumber(representative.chinX)}</dd>
    </div>
    <div>
      <dt>chin z</dt>
      <dd>${formatNullableDebugNumber(representative.chinZ)}</dd>
    </div>
    <div>
      <dt>left / right cheek z</dt>
      <dd>${formatNullableDebugNumber(representative.leftCheekZ)} / ${formatNullableDebugNumber(representative.rightCheekZ)}</dd>
    </div>
    <div>
      <dt>left / right contour z</dt>
      <dd>${formatNullableDebugNumber(representative.leftContourZ)} / ${formatNullableDebugNumber(representative.rightContourZ)}</dd>
    </div>
    <div>
      <dt>nose offset from bounds center x</dt>
      <dd>${formatNullableDebugNumber(representative.noseOffsetFromBoundsCenterX)}</dd>
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
    adaptiveBucketAdoptions: [],
    adaptiveSkippedBuckets: [],
  }
}

function isUsageBucketSatisfied(
  metrics: AdaptiveScanMetrics,
  id: UsageBucketId,
): boolean {
  return metrics.selectedCounts[id] >= USAGE_BUCKET_TARGETS[id]
}

function adoptUsageBucketForAdaptiveScan(
  usage: AuthoringFrameUsage,
  metrics: AdaptiveScanMetrics,
  id: UsageBucketId,
): void {
  if (isUsageBucketSatisfied(metrics, id)) {
    metrics.skippedAfterTargetCount[id] += 1
    usage.adaptiveSkippedBuckets = addUsageBucketId(
      usage.adaptiveSkippedBuckets,
      id,
    )
    return
  }

  metrics.selectedCounts[id] += 1
  usage.adaptiveBucketAdoptions = addUsageBucketId(
    usage.adaptiveBucketAdoptions,
    id,
  )

  if (id === "idealFaceInference") {
    usage.useForInference = true
  }
}

function applyAdaptiveSamplingToFrame(
  frame: ExtractedVideoFrame,
  metrics: AdaptiveScanMetrics,
): void {
  const usage = createDefaultAuthoringFrameUsage(frame)

  if (usage.excluded) {
    authoringFrameUsages = {
      ...authoringFrameUsages,
      [usage.frameId]: usage,
    }
    return
  }

  usage.useForInference = false
  adoptUsageBucketForAdaptiveScan(usage, metrics, "idealFaceInference")

  const expressionUsageBucketId = toExpressionUsageBucketId(
    usage.autoExpressionGroup,
  )

  if (expressionUsageBucketId) {
    adoptUsageBucketForAdaptiveScan(
      usage,
      metrics,
      expressionUsageBucketId,
    )
  }

  authoringFrameUsages = {
    ...authoringFrameUsages,
    [usage.frameId]: usage,
  }
}

function areRequiredUsageBucketsSatisfied(
  metrics: AdaptiveScanMetrics,
): boolean {
  return REQUIRED_USAGE_BUCKET_IDS.every((id) =>
    isUsageBucketSatisfied(metrics, id),
  )
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

function addUsageBucketId(
  bucketIds: UsageBucketId[],
  bucketId: UsageBucketId,
): UsageBucketId[] {
  return bucketIds.includes(bucketId) ? bucketIds : [...bucketIds, bucketId]
}

function removeUsageBucketId(
  bucketIds: UsageBucketId[],
  bucketId: UsageBucketId,
): UsageBucketId[] {
  return bucketIds.filter((id) => id !== bucketId)
}

function removeExpressionUsageBucketIds(
  bucketIds: UsageBucketId[],
): UsageBucketId[] {
  return bucketIds.filter((id) => id === "idealFaceInference")
}

function toExpressionUsageBucketId(
  expressionGroup: FrameExpressionGroup,
): UsageBucketId | null {
  return EXPRESSION_GROUP_IDS.includes(expressionGroup as ExpressionGroupId)
    ? (expressionGroup as ExpressionGroupId)
    : null
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

  setAuthoringFrameUsage(frameId, {
    useForInference,
    adaptiveBucketAdoptions: useForInference
      ? addUsageBucketId(
          usage.adaptiveBucketAdoptions,
          "idealFaceInference",
        )
      : removeUsageBucketId(
          usage.adaptiveBucketAdoptions,
          "idealFaceInference",
        ),
  })
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

  const expressionUsageBucketId = toExpressionUsageBucketId(expressionGroup)
  const adaptiveBucketAdoptions = expressionUsageBucketId
    ? addUsageBucketId(
        removeExpressionUsageBucketIds(usage.adaptiveBucketAdoptions),
        expressionUsageBucketId,
      )
    : removeExpressionUsageBucketIds(usage.adaptiveBucketAdoptions)

  setAuthoringFrameUsage(frameId, {
    expressionGroup,
    adaptiveBucketAdoptions,
  })
}

function excludeAuthoringFrame(frameId: string): void {
  setAuthoringFrameUsage(frameId, {
    frontReference: false,
    useForInference: false,
    expressionGroup: "none",
    excluded: true,
    excludedReason: "manual",
    adaptiveBucketAdoptions: [],
    adaptiveSkippedBuckets: [],
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
    adaptiveBucketAdoptions: [
      "idealFaceInference",
      ...([toExpressionUsageBucketId(usage.autoExpressionGroup)].filter(
        (id): id is ExpressionGroupId => id !== null,
      )),
    ],
    adaptiveSkippedBuckets: [],
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
  const autoExpressionGroupCounts = createFrameExpressionGroupCountRecord()
  const adaptiveBucketAdoptionCounts = createUsageBucketCountRecord()
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
    autoExpressionGroupCounts[usage.autoExpressionGroup] += 1
    usage.adaptiveBucketAdoptions.forEach((id) => {
      adaptiveBucketAdoptionCounts[id] += 1
    })
  })

  return {
    sourceFrameCount: frames.length,
    frontReferenceCount,
    useForInferenceCount,
    expressionGroupCounts,
    autoExpressionGroupCounts,
    adaptiveBucketAdoptionCounts,
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
        adaptiveBucketAdoptions: usage.adaptiveBucketAdoptions,
        adaptiveSkippedBuckets: usage.adaptiveSkippedBuckets,
      }
    }),
  }
}

function isFrontReferenceCandidatePose(pose: FacePose): boolean {
  return (
    Math.abs(pose.yaw) <= FRONT_REFERENCE_CANDIDATE_POSE_LIMIT.yaw &&
    Math.abs(pose.pitch) <= FRONT_REFERENCE_CANDIDATE_POSE_LIMIT.pitch &&
    Math.abs(pose.roll) <= FRONT_REFERENCE_CANDIDATE_POSE_LIMIT.roll
  )
}

function hasNoStrongExpressionForFrontReference(
  frame: ExtractedVideoFrame,
): boolean {
  const blendshapes = frame.analysis?.blendshapes ?? []

  if (blendshapes.length === 0) {
    return true
  }

  return getActiveExpressionGroupIds(blendshapes).length === 0
}

function isFrontReferenceCandidate(frame: ExtractedVideoFrame): boolean {
  const analysis = frame.analysis
  const usage = getAuthoringFrameUsage(frame)

  return (
    !usage.excluded &&
    frame.status === "analyzed" &&
    analysis?.detected === true &&
    analysis.landmarks.length === REQUIRED_LANDMARK_COUNT &&
    hasCompletePose(analysis.pose) &&
    isFrontReferenceCandidatePose(analysis.pose) &&
    hasNoStrongExpressionForFrontReference(frame)
  )
}

function getFrontReferenceSummary(): FrontReferenceSummary {
  const frames = getDetailedScanFrames()
  const selectedCount = frames.filter((frame) => {
    const usage = getAuthoringFrameUsage(frame)

    return usage.frontReference && !usage.excluded
  }).length
  const candidateFrameIds = frames
    .filter(isFrontReferenceCandidate)
    .map(getFrameIdFromFrame)

  return {
    selectedCount,
    candidateCount: candidateFrameIds.length,
    recommendedMin: FRONT_REFERENCE_RECOMMENDED_COUNT.min,
    recommendedMax: FRONT_REFERENCE_RECOMMENDED_COUNT.max,
    status:
      selectedCount >= FRONT_REFERENCE_RECOMMENDED_COUNT.min
        ? "ok"
        : "insufficient",
    candidateFrameIdPreview: candidateFrameIds.slice(
      0,
      FRONT_REFERENCE_CANDIDATE_PREVIEW_COUNT,
    ),
  }
}

function getUsageBucketSelectedCount(
  id: UsageBucketId,
  frameUsageSummary: FrameUsageSummary,
): number {
  if (lastAdaptiveScanMetrics?.enabled) {
    return frameUsageSummary.adaptiveBucketAdoptionCounts[id]
  }

  if (id === "idealFaceInference") {
    return frameUsageSummary.useForInferenceCount
  }

  return frameUsageSummary.expressionGroupCounts[id as ExpressionGroupId]
}

function getUsageBucketSummary(): UsageBucketSummary[] {
  const frameUsageSummary = getFrameUsageSummary()

  return (Object.keys(USAGE_BUCKET_TARGETS) as UsageBucketId[]).map((id) => {
    const targetCount = USAGE_BUCKET_TARGETS[id]
    const selectedCount = getUsageBucketSelectedCount(id, frameUsageSummary)
    const autoDetectedCount =
      id === "idealFaceInference"
        ? frameUsageSummary.useForInferenceCount
        : frameUsageSummary.autoExpressionGroupCounts[id as ExpressionGroupId]

    return {
      id,
      targetCount,
      selectedCount,
      autoDetectedCount,
      status: selectedCount >= targetCount ? "ok" : "insufficient",
      priority: id === "idealFaceInference" ? "required" : "optional",
      skippedAfterTargetCount: getSkippedAfterTargetCount(id),
    }
  })
}

function buildFrontReferenceWarnings(
  summary: FrontReferenceSummary,
): string[] {
  const warnings: string[] = []
  const recommendedLabel = `${summary.recommendedMin}〜${summary.recommendedMax}`

  if (summary.selectedCount < summary.recommendedMin) {
    warnings.push(
      `正面基準が少なめです。Frame Review で正面に近い frame を追加してください（${summary.selectedCount} / 推奨 ${recommendedLabel}）。`,
    )
  }

  if (summary.candidateCount === 0) {
    warnings.push(
      "正面基準候補が見つかりません。動画内に正面に近い frame が少ない可能性があります。",
    )
  } else if (summary.candidateCount < summary.recommendedMin) {
    warnings.push(
      `frontReferenceCandidate が少なめです（候補 ${summary.candidateCount} / 推奨 ${recommendedLabel}）。frontReference は手動選択のまま維持してください。`,
    )
  }

  return warnings
}

function buildUsageBucketWarnings(
  buckets: UsageBucketSummary[],
): string[] {
  return buckets
    .filter((bucket) => bucket.status === "insufficient")
    .map((bucket) => {
      const prefix = bucket.priority === "required" ? "重要: " : ""

      return `${prefix}${bucket.id} が不足しています（${bucket.selectedCount} / ${bucket.targetCount}）`
    })
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
    hasFacialTransformationMatrix: analysis.facialTransformationMatrix != null,
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
    warnings.push("正面基準を1件以上手動選択してください。")
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
    warnings.push("正面基準を1件以上手動選択してください。")
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
    notes: [
      "正面基準フレームは基準合わせに使います。IdealFace 形状生成には「IdealFace生成に使う」が ON のフレームのみを使います。",
    ],
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

function rotatePoint3DAroundX(point: Point3D, angleRad: number): Point3D {
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)

  return {
    x: point.x,
    y: point.y * cos - point.z * sin,
    z: point.y * sin + point.z * cos,
  }
}

function rotatePoint3DAroundY(point: Point3D, angleRad: number): Point3D {
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)

  return {
    x: point.x * cos + point.z * sin,
    y: point.y,
    z: -point.x * sin + point.z * cos,
  }
}

function rotatePoint3DAroundZ(point: Point3D, angleRad: number): Point3D {
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)

  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
    z: point.z,
  }
}

function inverseRotatePoseAwarePoint3D(point: Point3D, pose: FacePose): Point3D {
  const roll = degreesToRadians(-pose.roll)
  const pitch = degreesToRadians(-pose.pitch)
  const yaw = degreesToRadians(-pose.yaw)
  const unrolled = rotatePoint3DAroundZ(point, roll)
  const unpitched = rotatePoint3DAroundX(unrolled, pitch)

  return rotatePoint3DAroundY(unpitched, yaw)
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

function getSameUnitLandmarks2D(
  frame: PoseAwareInferenceFrame,
): PoseAwareCorrectedLandmark2D[] | null {
  const center = getFaceCenter2D(frame.landmarks)

  if (!center || frame.landmarks.length !== REQUIRED_LANDMARK_COUNT) {
    return null
  }

  const videoAspectRatio = getVideoAspectRatioForNormalization()

  return frame.landmarks.map((landmark, index) => {
    const sameUnitPoint = toSameUnitPoint(
      landmark,
      center,
      videoAspectRatio,
    )

    return {
      index,
      x: sameUnitPoint.x,
      y: sameUnitPoint.y,
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

function calculatePoseAwareShapeFrameWeight(
  frame: PoseAwareInferenceFrame,
): number {
  const posePenalty = clamp(
    1 -
      frame.poseStrength / POSE_AWARE_SHAPE_FRAME_POSE_PENALTY_DEG,
    POSE_AWARE_MIN_SHAPE_FRAME_WEIGHT,
    1,
  )
  const rollPenalty = clamp(
    1 - Math.abs(frame.pose.roll) / POSE_AWARE_WEIGHT_ROLL_PENALTY_DEG,
    POSE_AWARE_MIN_SHAPE_FRAME_WEIGHT,
    1,
  )
  const scoreWeight =
    frame.score !== undefined
      ? clamp(frame.score, POSE_AWARE_MIN_SCORE_WEIGHT, 1)
      : 1

  return Number((posePenalty * rollPenalty * scoreWeight).toFixed(4))
}

function buildPoseAwareShapePoints(
  observationFrames: PoseAwareInferenceFrame[],
): PoseAwareBasePoint[] | null {
  const correctedObservationFrames = observationFrames
    .map((frame) => ({
      landmarks: getRollCorrectedLandmarks2D(frame),
      weight: calculatePoseAwareShapeFrameWeight(frame),
    }))
    .filter(
      (
        frame,
      ): frame is {
        landmarks: PoseAwareCorrectedLandmark2D[]
        weight: number
      } =>
        frame.landmarks !== null &&
        frame.landmarks.length === REQUIRED_LANDMARK_COUNT &&
        Number.isFinite(frame.weight) &&
        frame.weight > 0,
    )

  if (correctedObservationFrames.length === 0) {
    return null
  }

  return Array.from({ length: REQUIRED_LANDMARK_COUNT }, (_, index) => {
    const points = correctedObservationFrames
      .map((frame) => ({
        point: frame.landmarks[index],
        weight: frame.weight,
      }))
      .filter(
        (
          item,
        ): item is {
          point: PoseAwareCorrectedLandmark2D
          weight: number
        } =>
          Boolean(item.point) &&
          Number.isFinite(item.point.x) &&
          Number.isFinite(item.point.y) &&
          Number.isFinite(item.weight) &&
          item.weight > 0,
      )
    const weightTotal = points.reduce((sum, item) => sum + item.weight, 0)

    if (weightTotal <= 0) {
      return {
        index,
        x: 0,
        y: 0,
      }
    }

    return {
      index,
      x: Number(
        (
          points.reduce(
            (sum, item) => sum + item.point.x * item.weight,
            0,
          ) / weightTotal
        ).toFixed(4),
      ),
      y: Number(
        (
          points.reduce(
            (sum, item) => sum + item.point.y * item.weight,
            0,
          ) / weightTotal
        ).toFixed(4),
      ),
    }
  })
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

function calculateStableZPoseSignal(angleDeg: number): number {
  const absAngle = Math.abs(angleDeg)

  if (absAngle <= 0) {
    return 0
  }

  if (absAngle < POSE_AWARE_STABLE_Z_MIN_USEFUL_ANGLE_DEG) {
    return roundDebugNumber(
      (absAngle / POSE_AWARE_STABLE_Z_MIN_USEFUL_ANGLE_DEG) *
        POSE_AWARE_STABLE_Z_LOW_SIGNAL,
    )
  }

  if (absAngle <= POSE_AWARE_STABLE_Z_IDEAL_ANGLE_DEG) {
    const progress =
      (absAngle - POSE_AWARE_STABLE_Z_MIN_USEFUL_ANGLE_DEG) /
      (POSE_AWARE_STABLE_Z_IDEAL_ANGLE_DEG -
        POSE_AWARE_STABLE_Z_MIN_USEFUL_ANGLE_DEG)

    return roundDebugNumber(
      POSE_AWARE_STABLE_Z_LOW_SIGNAL +
        progress * (1 - POSE_AWARE_STABLE_Z_LOW_SIGNAL),
    )
  }

  if (absAngle <= POSE_AWARE_STABLE_Z_MAX_USEFUL_ANGLE_DEG) {
    const progress =
      (absAngle - POSE_AWARE_STABLE_Z_IDEAL_ANGLE_DEG) /
      (POSE_AWARE_STABLE_Z_MAX_USEFUL_ANGLE_DEG -
        POSE_AWARE_STABLE_Z_IDEAL_ANGLE_DEG)

    return roundDebugNumber(1 - progress * (1 - POSE_AWARE_STABLE_Z_LOW_SIGNAL))
  }

  return POSE_AWARE_STABLE_Z_LOW_SIGNAL
}

function buildStableZFrameSignalBase(frame: PoseAwareInferenceFrame): Omit<
  FrameStableZWeightDebug,
  | "zHintDirectionBalanceWeight"
  | "directionBalanceWeight"
  | "actualYawZHintWeight"
  | "actualPitchZHintWeight"
  | "debugFinalZHintWeight"
  | "finalZHintWeight"
  | "directionBalanceClamped"
  | "canonicalAverageDirectionBalanceWeight"
  | "finalCanonicalAverageWeight"
  | "canonicalAverageDirectionBalanceClamped"
> {
  const yawSignal = calculateStableZPoseSignal(frame.pose.yaw)
  const pitchSignal = calculateStableZPoseSignal(frame.pose.pitch)
  const yawPositiveSignal = frame.pose.yaw > 0 ? yawSignal : 0
  const yawNegativeSignal = frame.pose.yaw < 0 ? yawSignal : 0
  const pitchPositiveSignal = frame.pose.pitch > 0 ? pitchSignal : 0
  const pitchNegativeSignal = frame.pose.pitch < 0 ? pitchSignal : 0
  const qualityWeight = calculatePoseAwareShapeFrameWeight(frame)
  const poseUsefulnessWeight = Math.max(
    yawPositiveSignal,
    yawNegativeSignal,
    pitchPositiveSignal,
    pitchNegativeSignal,
  )

  return {
    frameId: frame.frameId,
    yaw: roundDebugNumber(frame.pose.yaw),
    pitch: roundDebugNumber(frame.pose.pitch),
    yawPositiveSignal,
    yawNegativeSignal,
    pitchPositiveSignal,
    pitchNegativeSignal,
    qualityWeight,
    poseUsefulnessWeight,
  }
}

function getSignalRatio(positive: number, negative: number): number | null {
  if (positive <= 0 || negative <= 0) {
    return null
  }

  return roundDebugNumber(positive / negative)
}

function calculateDirectionBalanceFactor(
  directionSignal: number,
  targetSignal: number,
): { value: number; clamped: boolean } {
  if (directionSignal <= 0 || targetSignal <= 0) {
    return { value: 1, clamped: false }
  }

  const raw = targetSignal / directionSignal
  const value = clamp(
    raw,
    POSE_AWARE_STABLE_Z_DIRECTION_BALANCE_MIN,
    POSE_AWARE_STABLE_Z_DIRECTION_BALANCE_MAX,
  )

  return {
    value,
    clamped: Math.abs(raw - value) > 0.0001,
  }
}

function buildFrameStableZWeightDebug(
  observationFrames: PoseAwareInferenceFrame[],
): {
  frameWeights: FrameStableZWeightDebug[]
  directionBalance: DirectionBalanceSummary
} {
  const baseWeights = observationFrames.map(buildStableZFrameSignalBase)
  const totalYawPositiveSignal = baseWeights.reduce(
    (sum, frame) => sum + frame.yawPositiveSignal,
    0,
  )
  const totalYawNegativeSignal = baseWeights.reduce(
    (sum, frame) => sum + frame.yawNegativeSignal,
    0,
  )
  const totalPitchPositiveSignal = baseWeights.reduce(
    (sum, frame) => sum + frame.pitchPositiveSignal,
    0,
  )
  const totalPitchNegativeSignal = baseWeights.reduce(
    (sum, frame) => sum + frame.pitchNegativeSignal,
    0,
  )
  const nonZeroDirectionSignals = [
    totalYawPositiveSignal,
    totalYawNegativeSignal,
    totalPitchPositiveSignal,
    totalPitchNegativeSignal,
  ].filter((value) => value > 0)
  const targetDirectionSignal = averageNumbers(nonZeroDirectionSignals)
  const yawPositiveFactor = calculateDirectionBalanceFactor(
    totalYawPositiveSignal,
    targetDirectionSignal,
  )
  const yawNegativeFactor = calculateDirectionBalanceFactor(
    totalYawNegativeSignal,
    targetDirectionSignal,
  )
  const pitchPositiveFactor = calculateDirectionBalanceFactor(
    totalPitchPositiveSignal,
    targetDirectionSignal,
  )
  const pitchNegativeFactor = calculateDirectionBalanceFactor(
    totalPitchNegativeSignal,
    targetDirectionSignal,
  )

  const frameWeights = baseWeights.map((frame) => {
    const weightedFactors = [
      {
        signal: frame.yawPositiveSignal,
        factor: yawPositiveFactor,
      },
      {
        signal: frame.yawNegativeSignal,
        factor: yawNegativeFactor,
      },
      {
        signal: frame.pitchPositiveSignal,
        factor: pitchPositiveFactor,
      },
      {
        signal: frame.pitchNegativeSignal,
        factor: pitchNegativeFactor,
      },
    ].filter((item) => item.signal > 0)
    const signalTotal = weightedFactors.reduce(
      (sum, item) => sum + item.signal,
      0,
    )
    const zHintDirectionBalanceWeight =
      signalTotal <= 0
        ? 1
        : weightedFactors.reduce(
            (sum, item) => sum + item.signal * item.factor.value,
            0,
          ) / signalTotal
    const directionBalanceClamped = weightedFactors.some(
      (item) => item.factor.clamped,
    )
    const canonicalAverageDirectionBalanceWeight = zHintDirectionBalanceWeight
    const canonicalAverageDirectionBalanceClamped = directionBalanceClamped
    const actualYawZHintWeight =
      frame.qualityWeight *
      zHintDirectionBalanceWeight *
      (frame.yawPositiveSignal + frame.yawNegativeSignal)
    const actualPitchZHintWeight =
      frame.qualityWeight *
      zHintDirectionBalanceWeight *
      (frame.pitchPositiveSignal + frame.pitchNegativeSignal)
    const debugFinalZHintWeight =
      frame.qualityWeight *
      frame.poseUsefulnessWeight *
      zHintDirectionBalanceWeight
    const finalCanonicalAverageWeight =
      frame.qualityWeight * canonicalAverageDirectionBalanceWeight

    return {
      ...frame,
      zHintDirectionBalanceWeight: roundDebugNumber(
        zHintDirectionBalanceWeight,
      ),
      directionBalanceWeight: roundDebugNumber(zHintDirectionBalanceWeight),
      actualYawZHintWeight: roundDebugNumber(actualYawZHintWeight),
      actualPitchZHintWeight: roundDebugNumber(actualPitchZHintWeight),
      debugFinalZHintWeight: roundDebugNumber(debugFinalZHintWeight),
      finalZHintWeight: roundDebugNumber(debugFinalZHintWeight),
      directionBalanceClamped,
      canonicalAverageDirectionBalanceWeight: roundDebugNumber(
        canonicalAverageDirectionBalanceWeight,
      ),
      finalCanonicalAverageWeight: roundDebugNumber(
        finalCanonicalAverageWeight,
      ),
      canonicalAverageDirectionBalanceClamped,
    }
  })
  const directionBalanceWeights = frameWeights.map(
    (frame) => frame.directionBalanceWeight,
  )

  return {
    frameWeights,
    directionBalance: {
      totalYawPositiveSignal: roundDebugNumber(totalYawPositiveSignal),
      totalYawNegativeSignal: roundDebugNumber(totalYawNegativeSignal),
      totalPitchPositiveSignal: roundDebugNumber(totalPitchPositiveSignal),
      totalPitchNegativeSignal: roundDebugNumber(totalPitchNegativeSignal),
      yawPositiveNegativeSignalRatio: getSignalRatio(
        totalYawPositiveSignal,
        totalYawNegativeSignal,
      ),
      pitchPositiveNegativeSignalRatio: getSignalRatio(
        totalPitchPositiveSignal,
        totalPitchNegativeSignal,
      ),
      averageDirectionBalanceWeight: roundDebugNumber(
        averageNumbers(directionBalanceWeights),
      ),
      minDirectionBalanceWeight:
        directionBalanceWeights.length === 0
          ? 0
          : roundDebugNumber(Math.min(...directionBalanceWeights)),
      maxDirectionBalanceWeight:
        directionBalanceWeights.length === 0
          ? 0
          : roundDebugNumber(Math.max(...directionBalanceWeights)),
      clampedDirectionBalanceWeightCount: frameWeights.filter(
        (frame) => frame.directionBalanceClamped,
      ).length,
    },
  }
}

function getWeightedPercentileZ(
  hints: PoseAwareZHint[],
  percentile: number,
): number {
  const sortedHints = [...hints]
    .filter((hint) => Number.isFinite(hint.value) && hint.weight > 0)
    .sort((a, b) => a.value - b.value)
  const weightTotal = sortedHints.reduce((sum, hint) => sum + hint.weight, 0)

  if (sortedHints.length === 0 || weightTotal <= 0) {
    return 0
  }

  const threshold = weightTotal * clamp(percentile, 0, 1)
  let accumulatedWeight = 0

  for (const hint of sortedHints) {
    accumulatedWeight += hint.weight

    if (accumulatedWeight >= threshold) {
      return hint.value
    }
  }

  return sortedHints[sortedHints.length - 1].value
}

function getRobustWeightedAverageZ(hints: PoseAwareZHint[]): number {
  const validHints = hints.filter(
    (hint) =>
      Number.isFinite(hint.value) &&
      Number.isFinite(hint.weight) &&
      hint.weight > 0,
  )

  if (validHints.length === 0) {
    return 0
  }

  if (validHints.length < 4) {
    return getWeightedAverageZ(validHints)
  }

  const low = getWeightedPercentileZ(
    validHints,
    POSE_AWARE_STABLE_Z_PERCENTILE_LOW,
  )
  const high = getWeightedPercentileZ(
    validHints,
    POSE_AWARE_STABLE_Z_PERCENTILE_HIGH,
  )
  const clampedHints = validHints.map((hint) => ({
    ...hint,
    value: clamp(hint.value, low, high),
  }))

  return getWeightedAverageZ(clampedHints)
}

function collectPoseAwareStableZHintsForFrame(
  frame: PoseAwareInferenceFrame,
  basePoints: PoseAwareBasePoint[],
  frameWeight: FrameStableZWeightDebug,
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
  const yawWeight = frameWeight.actualYawZHintWeight
  const pitchWeight = frameWeight.actualPitchZHintWeight

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

function mergePoseAwareStableZHints(
  observationFrames: PoseAwareInferenceFrame[],
  basePoints: PoseAwareBasePoint[],
  frameWeights: FrameStableZWeightDebug[],
): PoseAwareZHint[][] {
  const mergedHints = Array.from(
    { length: REQUIRED_LANDMARK_COUNT },
    () => [] as PoseAwareZHint[],
  )
  const frameWeightById = new Map(
    frameWeights.map((frameWeight) => [frameWeight.frameId, frameWeight]),
  )

  observationFrames.forEach((frame) => {
    const frameWeight = frameWeightById.get(frame.frameId)

    if (!frameWeight) {
      return
    }

    const frameHints = collectPoseAwareStableZHintsForFrame(
      frame,
      basePoints,
      frameWeight,
    )

    frameHints.forEach((hints, index) => {
      mergedHints[index].push(...hints)
    })
  })

  return mergedHints
}

function buildStableZValues(
  dataset: PoseAwareInferenceDataset,
  stableZHintsByLandmark: PoseAwareZHint[][],
): StableZLandmarkValue[] {
  return Array.from({ length: REQUIRED_LANDMARK_COUNT }, (_, index) => {
    const hints = stableZHintsByLandmark[index] ?? []
    const totalWeight = hints.reduce((sum, hint) => sum + hint.weight, 0)
    const fallbackUsed = hints.length === 0 || totalWeight <= 0
    const z = fallbackUsed ? 0 : getRobustWeightedAverageZ(hints)
    const confidence = fallbackUsed
      ? 0.12
      : inferPoseAwareLandmarkConfidence(hints, dataset, z)

    return {
      index,
      z: Number(z.toFixed(4)),
      confidence,
      totalWeight: roundDebugNumber(totalWeight),
      candidateCount: hints.length,
      fallbackUsed,
    }
  })
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

function centerPoseAwareCanonicalLandmarks(
  landmarks: IdealLandmark3DCandidate[],
): IdealLandmark3DCandidate[] {
  const xAverage = averageNumbers(landmarks.map((landmark) => landmark.x))
  const yAverage = averageNumbers(landmarks.map((landmark) => landmark.y))
  const zAverage = averageNumbers(landmarks.map((landmark) => landmark.z))

  return landmarks.map((landmark) => ({
    ...landmark,
    x: Number((landmark.x - xAverage).toFixed(4)),
    y: Number((landmark.y - yAverage).toFixed(4)),
    z: Number((landmark.z - zAverage).toFixed(4)),
  }))
}

function buildPoseAwareObservationFrameDebugSummary(
  observationFrames: PoseAwareInferenceFrame[],
): PoseAwareObservationFrameDebugSummary {
  const yawBins: Array<{
    id: string
    yawMin: number | null
    yawMax: number | null
  }> = [
    { id: "leftStrong", yawMin: null, yawMax: -15 },
    { id: "leftMid", yawMin: -15, yawMax: -5 },
    { id: "nearFront", yawMin: -5, yawMax: 5 },
    { id: "rightMid", yawMin: 5, yawMax: 15 },
    { id: "rightStrong", yawMin: 15, yawMax: null },
  ]

  return {
    totalObservationFrameCount: observationFrames.length,
    negativeYawCount: observationFrames.filter((frame) => frame.pose.yaw < 0)
      .length,
    positiveYawCount: observationFrames.filter((frame) => frame.pose.yaw > 0)
      .length,
    nearFrontCount: observationFrames.filter(
      (frame) =>
        Math.abs(frame.pose.yaw) <= POSE_AWARE_CANONICAL_NEAR_FRONT_YAW_DEG,
    ).length,
    yawBins: yawBins.map((bin) => {
      const framesInBin = observationFrames.filter((frame) => {
        const aboveMin = bin.yawMin === null || frame.pose.yaw >= bin.yawMin
        const belowMax = bin.yawMax === null || frame.pose.yaw < bin.yawMax

        return aboveMin && belowMax
      })
      const weightTotal = framesInBin.reduce(
        (sum, frame) => sum + calculatePoseAwareShapeFrameWeight(frame),
        0,
      )

      return {
        ...bin,
        count: framesInBin.length,
        weightTotal: roundDebugNumber(weightTotal),
      }
    }),
  }
}

function getPoseAwareRepresentativePointSummary(
  landmarks: Array<{ index: number; x: number; y: number; z?: number }>,
): PoseAwareRepresentativePointSummary {
  const noseTip = landmarks.find((landmark) => landmark.index === NOSE_TIP_INDEX)
  const chin = landmarks.find((landmark) => landmark.index === CHIN_INDEX)
  const leftCheek = landmarks.find(
    (landmark) => landmark.index === LEFT_CHEEK_INDEX,
  )
  const rightCheek = landmarks.find(
    (landmark) => landmark.index === RIGHT_CHEEK_INDEX,
  )
  const leftContour = landmarks.find(
    (landmark) => landmark.index === LEFT_CONTOUR_INDEX,
  )
  const rightContour = landmarks.find(
    (landmark) => landmark.index === RIGHT_CONTOUR_INDEX,
  )
  const mouthPoints = MOUTH_CENTER_INDICES.map((index) =>
    landmarks.find((landmark) => landmark.index === index),
  ).filter(
    (landmark): landmark is { index: number; x: number; y: number; z?: number } =>
      landmark !== undefined && Number.isFinite(landmark.x),
  )
  const spatial = buildLandmarkSpatialSummary(landmarks)
  const mouthCenterX =
    mouthPoints.length === 0
      ? null
      : roundDebugNumber(averageNumbers(mouthPoints.map((point) => point.x)))
  const mouthCenterZ =
    mouthPoints.length === 0
      ? null
      : roundDebugNumber(
          averageNumbers(mouthPoints.map((point) => point.z ?? 0)),
        )
  const noseTipX = noseTip ? roundDebugNumber(noseTip.x) : null

  return {
    noseTipX,
    noseTipZ:
      noseTip && Number.isFinite(noseTip.z)
        ? roundDebugNumber(noseTip.z ?? 0)
        : null,
    mouthCenterX,
    mouthCenterZ,
    chinX: chin ? roundDebugNumber(chin.x) : null,
    chinZ:
      chin && Number.isFinite(chin.z) ? roundDebugNumber(chin.z ?? 0) : null,
    leftCheekZ:
      leftCheek && Number.isFinite(leftCheek.z)
        ? roundDebugNumber(leftCheek.z ?? 0)
        : null,
    rightCheekZ:
      rightCheek && Number.isFinite(rightCheek.z)
        ? roundDebugNumber(rightCheek.z ?? 0)
        : null,
    leftContourZ:
      leftContour && Number.isFinite(leftContour.z)
        ? roundDebugNumber(leftContour.z ?? 0)
        : null,
    rightContourZ:
      rightContour && Number.isFinite(rightContour.z)
        ? roundDebugNumber(rightContour.z ?? 0)
        : null,
    noseOffsetFromBoundsCenterX:
      noseTipX === null || spatial.boundsCenter === null
        ? null
        : roundDebugNumber(noseTipX - spatial.boundsCenter.x),
  }
}

function getZRange(values: number[]): number | null {
  if (values.length === 0) {
    return null
  }

  return roundDebugNumber(Math.max(...values) - Math.min(...values))
}

function buildTopViewZAsymmetrySummary(
  landmarks: Array<{ x: number; y: number; z?: number }>,
): TopViewZAsymmetrySummary {
  const finiteLandmarks = landmarks.filter(
    (landmark) =>
      Number.isFinite(landmark.x) && Number.isFinite(landmark.z ?? 0),
  )
  const centerX = averageNumbers(finiteLandmarks.map((landmark) => landmark.x))
  const leftZValues = finiteLandmarks
    .filter((landmark) => landmark.x < centerX)
    .map((landmark) => landmark.z ?? 0)
  const rightZValues = finiteLandmarks
    .filter((landmark) => landmark.x >= centerX)
    .map((landmark) => landmark.z ?? 0)
  const leftSideZAverage =
    leftZValues.length === 0
      ? null
      : roundDebugNumber(averageNumbers(leftZValues))
  const rightSideZAverage =
    rightZValues.length === 0
      ? null
      : roundDebugNumber(averageNumbers(rightZValues))
  const leftSideZRange = getZRange(leftZValues)
  const rightSideZRange = getZRange(rightZValues)
  const leftRightZAverageDelta =
    leftSideZAverage === null || rightSideZAverage === null
      ? null
      : roundDebugNumber(leftSideZAverage - rightSideZAverage)
  const leftRightZRangeDelta =
    leftSideZRange === null || rightSideZRange === null
      ? null
      : roundDebugNumber(leftSideZRange - rightSideZRange)

  return {
    basis: "x_center_split",
    leftSidePointCount: leftZValues.length,
    rightSidePointCount: rightZValues.length,
    leftSideZAverage,
    rightSideZAverage,
    leftRightZAverageDelta,
    leftSideZRange,
    rightSideZRange,
    leftRightZRangeDelta,
    topViewAsymmetryScore:
      leftRightZAverageDelta === null || leftRightZRangeDelta === null
        ? null
        : roundDebugNumber(
            Math.abs(leftRightZAverageDelta) +
              Math.abs(leftRightZRangeDelta) * 0.5,
          ),
    warning:
      "topViewAsymmetry uses x-center split and may differ from semantic left/right.",
  }
}

function buildStableZSummary(
  stableZValues: StableZLandmarkValue[],
  generationMethod: StableZSummary["generationMethod"] =
    "pose_aware_canonical_stable_z_v1",
): StableZSummary {
  const zValues = stableZValues.map((item) => item.z)
  const confidenceValues = stableZValues.map((item) => item.confidence)
  const totalWeights = stableZValues.map((item) => item.totalWeight)
  const candidateCounts = stableZValues.map((item) => item.candidateCount)

  return {
    generationMethod,
    zMin: zValues.length === 0 ? 0 : roundDebugNumber(Math.min(...zValues)),
    zMax: zValues.length === 0 ? 0 : roundDebugNumber(Math.max(...zValues)),
    zAverage: roundDebugNumber(averageNumbers(zValues)),
    zRange: getZRange(zValues) ?? 0,
    confidenceAverage: roundDebugNumber(averageNumbers(confidenceValues)),
    confidenceMin:
      confidenceValues.length === 0
        ? 0
        : roundDebugNumber(Math.min(...confidenceValues)),
    confidenceMax:
      confidenceValues.length === 0
        ? 0
        : roundDebugNumber(Math.max(...confidenceValues)),
    totalWeightAverage: roundDebugNumber(averageNumbers(totalWeights)),
    totalWeightMin:
      totalWeights.length === 0 ? 0 : roundDebugNumber(Math.min(...totalWeights)),
    totalWeightMax:
      totalWeights.length === 0 ? 0 : roundDebugNumber(Math.max(...totalWeights)),
    fallbackCount: stableZValues.filter((item) => item.fallbackUsed).length,
    zHintCandidateCountMin:
      candidateCounts.length === 0
        ? 0
        : Math.min(...candidateCounts),
    zHintCandidateCountMax:
      candidateCounts.length === 0
        ? 0
        : Math.max(...candidateCounts),
    zHintCandidateCountAverage: roundDebugNumber(
      averageNumbers(candidateCounts),
    ),
  }
}

function buildZHintSourceWeightSummary(
  hints: PoseAwareZHint[],
): ZHintSourceWeightSummary {
  const weightTotal = hints.reduce((sum, hint) => sum + hint.weight, 0)
  const zValues = hints.map((hint) => hint.value)

  return {
    count: hints.length,
    weightTotal: roundDebugNumber(weightTotal),
    zAverage:
      hints.length === 0 || weightTotal <= 0
        ? null
        : roundDebugNumber(getWeightedAverageZ(hints)),
    zRange: getZRange(zValues),
  }
}

function buildZValueSummary(values: number[]): ZHintSourceWeightSummary {
  const finiteValues = values.filter((value) => Number.isFinite(value))

  return {
    count: finiteValues.length,
    weightTotal: roundDebugNumber(finiteValues.length),
    zAverage:
      finiteValues.length === 0
        ? null
        : roundDebugNumber(averageNumbers(finiteValues)),
    zRange: getZRange(finiteValues),
  }
}

function buildStableZWeightDebugSummary(
  stableZHintsByLandmark: PoseAwareZHint[][],
  frameWeights: FrameStableZWeightDebug[],
): StableZWeightDebugSummary {
  const frameWeightById = new Map(
    frameWeights.map((frameWeight) => [frameWeight.frameId, frameWeight]),
  )
  const allHints = stableZHintsByLandmark.flat()
  const yawHints = allHints.filter((hint) => hint.source === "yaw")
  const pitchHints = allHints.filter((hint) => hint.source === "pitch")
  const sumHintWeights = (
    source: PoseAwareZHint["source"],
    direction: "positive" | "negative",
  ): number => {
    const total = allHints
      .filter((hint) => {
        if (hint.source !== source) {
          return false
        }

        const frameWeight = frameWeightById.get(hint.frameId)

        if (!frameWeight) {
          return false
        }

        if (source === "yaw") {
          return direction === "positive"
            ? frameWeight.yawPositiveSignal > 0
            : frameWeight.yawNegativeSignal > 0
        }

        return direction === "positive"
          ? frameWeight.pitchPositiveSignal > 0
          : frameWeight.pitchNegativeSignal > 0
      })
      .reduce((sum, hint) => sum + hint.weight, 0)

    return roundDebugNumber(total)
  }

  return {
    yawPositiveZHintWeightTotal: sumHintWeights("yaw", "positive"),
    yawNegativeZHintWeightTotal: sumHintWeights("yaw", "negative"),
    pitchPositiveZHintWeightTotal: sumHintWeights("pitch", "positive"),
    pitchNegativeZHintWeightTotal: sumHintWeights("pitch", "negative"),
    yawDerived: buildZHintSourceWeightSummary(yawHints),
    pitchDerived: buildZHintSourceWeightSummary(pitchHints),
  }
}

function buildCanonicalAverageWeightDebugSummary(
  frameWeights: FrameStableZWeightDebug[],
): CanonicalAverageWeightDebugSummary {
  const canonicalAverageDirectionBalanceWeights = frameWeights.map(
    (frame) => frame.canonicalAverageDirectionBalanceWeight,
  )
  const sumFrameWeights = (
    predicate: (frame: FrameStableZWeightDebug) => boolean,
  ): number =>
    roundDebugNumber(
      frameWeights
        .filter(predicate)
        .reduce((sum, frame) => sum + frame.finalCanonicalAverageWeight, 0),
    )

  return {
    yawPositiveCanonicalAverageWeightTotal: sumFrameWeights(
      (frame) => frame.yawPositiveSignal > 0,
    ),
    yawNegativeCanonicalAverageWeightTotal: sumFrameWeights(
      (frame) => frame.yawNegativeSignal > 0,
    ),
    pitchPositiveCanonicalAverageWeightTotal: sumFrameWeights(
      (frame) => frame.pitchPositiveSignal > 0,
    ),
    pitchNegativeCanonicalAverageWeightTotal: sumFrameWeights(
      (frame) => frame.pitchNegativeSignal > 0,
    ),
    yawPositiveCanonicalAverageFrameCount: frameWeights.filter(
      (frame) => frame.yawPositiveSignal > 0,
    ).length,
    yawNegativeCanonicalAverageFrameCount: frameWeights.filter(
      (frame) => frame.yawNegativeSignal > 0,
    ).length,
    averageCanonicalAverageDirectionBalanceWeight: roundDebugNumber(
      averageNumbers(canonicalAverageDirectionBalanceWeights),
    ),
    minCanonicalAverageDirectionBalanceWeight:
      canonicalAverageDirectionBalanceWeights.length === 0
        ? 0
        : roundDebugNumber(
            Math.min(...canonicalAverageDirectionBalanceWeights),
          ),
    maxCanonicalAverageDirectionBalanceWeight:
      canonicalAverageDirectionBalanceWeights.length === 0
        ? 0
        : roundDebugNumber(
            Math.max(...canonicalAverageDirectionBalanceWeights),
          ),
    clampedCanonicalAverageDirectionBalanceWeightCount: frameWeights.filter(
      (frame) => frame.canonicalAverageDirectionBalanceClamped,
    ).length,
  }
}

function buildNearFrontObservationDebugSummary(
  dataset: PoseAwareInferenceDataset,
): NearFrontObservationDebugSummary {
  const frontReferenceFrameIds = new Set(
    dataset.frontReferenceFrames.map((frame) => frame.frameId),
  )
  const nearFrontObservationFrameCount = dataset.observationFrames.filter(
    (frame) =>
      Math.abs(frame.pose.yaw) <= POSE_AWARE_CANONICAL_NEAR_FRONT_YAW_DEG,
  ).length
  const useForInferenceFrontReferenceFrameCount =
    dataset.observationFrames.filter((frame) =>
      frontReferenceFrameIds.has(frame.frameId),
    ).length
  const warning =
    nearFrontObservationFrameCount < POSE_AWARE_CANONICAL_MIN_NEAR_FRONT_COUNT
      ? "nearFront observation is low; pass2 canonical average may be dominated by side-pose frames."
      : null

  return {
    nearFrontObservationFrameCount,
    frontReferenceFrameCount: dataset.frontReferenceFrames.length,
    useForInferenceFrontReferenceFrameCount,
    warning,
  }
}

function buildCandidateDebugComparisonItem(
  result: IdealLandmarks3DCandidateResult,
): CandidateDebugComparisonItem | null {
  if (result.status !== "generated" || result.generationMethod === null) {
    return null
  }

  return buildCandidateDebugComparisonItemFromLandmarks(
    result.generationMethod,
    result.landmarks,
  )
}

function buildCandidateDebugComparisonItemFromLandmarks(
  generationMethod: IdealLandmarks3DGenerationMethod,
  landmarks: IdealLandmark3DCandidate[],
): CandidateDebugComparisonItem {
  const spatial = buildLandmarkSpatialSummary(landmarks)
  const representative = getPoseAwareRepresentativePointSummary(landmarks)
  const topView = buildTopViewZAsymmetrySummary(landmarks)
  const zValues = landmarks.map((landmark) => landmark.z)
  const zMin = zValues.length === 0 ? 0 : roundDebugNumber(Math.min(...zValues))
  const zMax = zValues.length === 0 ? 0 : roundDebugNumber(Math.max(...zValues))

  return {
    generationMethod,
    zMin,
    zMax,
    zRange: roundDebugNumber(zMax - zMin),
    boundsCenterX: spatial.boundsCenter?.x ?? null,
    boundsCenterZ: spatial.boundsCenter?.z ?? null,
    noseTipX: representative.noseTipX,
    noseTipZ: representative.noseTipZ,
    mouthCenterX: representative.mouthCenterX,
    mouthCenterZ: representative.mouthCenterZ,
    chinX: representative.chinX,
    chinZ: representative.chinZ,
    leftCheekZ: representative.leftCheekZ,
    rightCheekZ: representative.rightCheekZ,
    leftContourZ: representative.leftContourZ,
    rightContourZ: representative.rightContourZ,
    leftRightZAverageDelta: topView.leftRightZAverageDelta,
    leftRightZRangeDelta: topView.leftRightZRangeDelta,
    topViewAsymmetryScore: topView.topViewAsymmetryScore,
  }
}

function buildFrameZHintSummary(
  hintsByLandmark: PoseAwareZHint[][],
  frameZValues: number[],
  fallbackCount: number,
  clampCount: number,
): FrameZHintSummary {
  const allHints = hintsByLandmark.flat()
  const yawHints = allHints.filter((hint) => hint.source === "yaw")
  const pitchHints = allHints.filter((hint) => hint.source === "pitch")

  return {
    generationMethod: "pose_aware_canonical_balanced_frame_z_v1",
    zMin:
      frameZValues.length === 0
        ? 0
        : roundDebugNumber(Math.min(...frameZValues)),
    zMax:
      frameZValues.length === 0
        ? 0
        : roundDebugNumber(Math.max(...frameZValues)),
    zAverage: roundDebugNumber(averageNumbers(frameZValues)),
    zRange: getZRange(frameZValues) ?? 0,
    fallbackCount,
    clampCount,
    stableZFallbackUsed: fallbackCount > 0,
    combined: buildZValueSummary(frameZValues),
    yawDerived: buildZHintSourceWeightSummary(yawHints),
    pitchDerived: buildZHintSourceWeightSummary(pitchHints),
  }
}

function buildFrameStableZWeightDebugSummary(
  frameWeights: FrameStableZWeightDebug[],
): FrameStableZWeightDebugSummary {
  const byFinalWeightDesc = [...frameWeights].sort(
    (a, b) => b.finalZHintWeight - a.finalZHintWeight,
  )
  const averageFinalWeight = (
    frames: FrameStableZWeightDebug[],
  ): number =>
    roundDebugNumber(
      averageNumbers(frames.map((frame) => frame.finalZHintWeight)),
    )

  return {
    topWeightedFrames: byFinalWeightDesc.slice(
      0,
      POSE_AWARE_STABLE_Z_FRAME_DEBUG_COUNT,
    ),
    lowestWeightedFrames: [...byFinalWeightDesc]
      .reverse()
      .slice(0, POSE_AWARE_STABLE_Z_FRAME_DEBUG_COUNT),
    yawPositiveFramesAverageWeight: averageFinalWeight(
      frameWeights.filter((frame) => frame.yawPositiveSignal > 0),
    ),
    yawNegativeFramesAverageWeight: averageFinalWeight(
      frameWeights.filter((frame) => frame.yawNegativeSignal > 0),
    ),
    pitchPositiveFramesAverageWeight: averageFinalWeight(
      frameWeights.filter((frame) => frame.pitchPositiveSignal > 0),
    ),
    pitchNegativeFramesAverageWeight: averageFinalWeight(
      frameWeights.filter((frame) => frame.pitchNegativeSignal > 0),
    ),
  }
}

function buildEmptyPoseAwarePartialCandidateSummary(): PoseAwarePartialCandidateSummary {
  return {
    frameCount: 0,
    weightTotal: 0,
    spatial: buildLandmarkSpatialSummary([]),
    representative: getPoseAwareRepresentativePointSummary([]),
  }
}

function buildPoseAwareFrameLocalAndCanonicalPoints(
  frame: PoseAwareInferenceFrame,
  basePoints: PoseAwareBasePoint[],
): {
  localPoints: Array<Point3D & { index: number }>
  canonicalPoints: Array<Point3D & { index: number }>
  weight: number
} | null {
  const sameUnitLandmarks = getSameUnitLandmarks2D(frame)
  const hintsByLandmark = collectPoseAwareZHintsForFrame(frame, basePoints)
  const weight = calculatePoseAwareShapeFrameWeight(frame)

  if (
    !sameUnitLandmarks ||
    sameUnitLandmarks.length !== REQUIRED_LANDMARK_COUNT ||
    !Number.isFinite(weight) ||
    weight <= 0
  ) {
    return null
  }

  const localPoints = sameUnitLandmarks.map((landmark, index) => {
    const hints = hintsByLandmark[index] ?? []

    return {
      index,
      x: landmark.x,
      y: landmark.y,
      z: getWeightedAverageZ(hints),
    }
  })
  const canonicalPoints = localPoints.map((point) => ({
    index: point.index,
    ...inverseRotatePoseAwarePoint3D(point, frame.pose),
  }))

  return {
    localPoints,
    canonicalPoints,
    weight,
  }
}

function buildPoseAwareCanonicalLandmarksFromFrames(
  observationFrames: PoseAwareInferenceFrame[],
  basePoints: PoseAwareBasePoint[],
  dataset: PoseAwareInferenceDataset,
): {
  landmarks: IdealLandmark3DCandidate[]
  localPoints: Array<Point3D & { index: number }>
  canonicalFramePoints: Array<Point3D & { index: number }>
  weightTotal: number
} | null {
  const canonicalFrames = observationFrames
    .map((frame) => buildPoseAwareFrameLocalAndCanonicalPoints(frame, basePoints))
    .filter(
      (
        frame,
      ): frame is {
        localPoints: Array<Point3D & { index: number }>
        canonicalPoints: Array<Point3D & { index: number }>
        weight: number
      } => frame !== null,
    )

  if (canonicalFrames.length === 0) {
    return null
  }

  const hintsByLandmark = mergePoseAwareZHints(observationFrames, basePoints)
  const uncenteredLandmarks = Array.from(
    { length: REQUIRED_LANDMARK_COUNT },
    (_, index) => {
      const points = canonicalFrames
        .map((frame) => ({
          point: frame.canonicalPoints[index],
          weight: frame.weight,
        }))
        .filter(
          (
            item,
          ): item is {
            point: Point3D & { index: number }
            weight: number
          } =>
            Boolean(item.point) &&
            Number.isFinite(item.point.x) &&
            Number.isFinite(item.point.y) &&
            Number.isFinite(item.point.z) &&
            Number.isFinite(item.weight) &&
            item.weight > 0,
        )
      const weightTotal = points.reduce((sum, item) => sum + item.weight, 0)
      const hints = hintsByLandmark[index] ?? []
      const confidence = inferPoseAwareLandmarkConfidence(
        hints,
        dataset,
        getWeightedAverageZ(hints),
      )

      if (weightTotal <= 0) {
        return {
          index,
          x: 0,
          y: 0,
          z: 0,
          confidence,
          source: "pose_aware_canonical_3d_v1" as const,
        }
      }

      return {
        index,
        x: Number(
          (
            points.reduce((sum, item) => sum + item.point.x * item.weight, 0) /
            weightTotal
          ).toFixed(4),
        ),
        y: Number(
          (
            points.reduce((sum, item) => sum + item.point.y * item.weight, 0) /
            weightTotal
          ).toFixed(4),
        ),
        z: Number(
          (
            points.reduce((sum, item) => sum + item.point.z * item.weight, 0) /
            weightTotal
          ).toFixed(4),
        ),
        confidence,
        source: "pose_aware_canonical_3d_v1" as const,
      }
    },
  )

  return {
    landmarks: centerPoseAwareCanonicalLandmarks(uncenteredLandmarks),
    localPoints: canonicalFrames.flatMap((frame) => frame.localPoints),
    canonicalFramePoints: canonicalFrames.flatMap(
      (frame) => frame.canonicalPoints,
    ),
    weightTotal: roundDebugNumber(
      canonicalFrames.reduce((sum, frame) => sum + frame.weight, 0),
    ),
  }
}

function buildPoseAwareStableZFrameLocalAndCanonicalPoints(
  frame: PoseAwareInferenceFrame,
  stableZValues: StableZLandmarkValue[],
  frameWeight: FrameStableZWeightDebug,
): {
  localPoints: Array<Point3D & { index: number }>
  canonicalPoints: Array<Point3D & { index: number }>
  weight: number
} | null {
  const sameUnitLandmarks = getSameUnitLandmarks2D(frame)
  const weight = frameWeight.finalCanonicalAverageWeight

  if (
    !sameUnitLandmarks ||
    sameUnitLandmarks.length !== REQUIRED_LANDMARK_COUNT ||
    !Number.isFinite(weight) ||
    weight <= 0
  ) {
    return null
  }

  const localPoints = sameUnitLandmarks.map((landmark, index) => ({
    index,
    x: landmark.x,
    y: landmark.y,
    z: stableZValues[index]?.z ?? 0,
  }))
  const canonicalPoints = localPoints.map((point) => ({
    index: point.index,
    ...inverseRotatePoseAwarePoint3D(point, frame.pose),
  }))

  return {
    localPoints,
    canonicalPoints,
    weight,
  }
}

function buildPoseAwareCanonicalStableZLandmarksFromFrames(
  observationFrames: PoseAwareInferenceFrame[],
  stableZValues: StableZLandmarkValue[],
  frameWeights: FrameStableZWeightDebug[],
): {
  landmarks: IdealLandmark3DCandidate[]
  localPoints: Array<Point3D & { index: number }>
  canonicalFramePoints: Array<Point3D & { index: number }>
  weightTotal: number
} | null {
  const frameWeightById = new Map(
    frameWeights.map((frameWeight) => [frameWeight.frameId, frameWeight]),
  )
  const canonicalFrames = observationFrames
    .map((frame) => {
      const frameWeight = frameWeightById.get(frame.frameId)

      if (!frameWeight) {
        return null
      }

      return buildPoseAwareStableZFrameLocalAndCanonicalPoints(
        frame,
        stableZValues,
        frameWeight,
      )
    })
    .filter(
      (
        frame,
      ): frame is {
        localPoints: Array<Point3D & { index: number }>
        canonicalPoints: Array<Point3D & { index: number }>
        weight: number
      } => frame !== null,
    )

  if (canonicalFrames.length === 0) {
    return null
  }

  const uncenteredLandmarks = Array.from(
    { length: REQUIRED_LANDMARK_COUNT },
    (_, index) => {
      const points = canonicalFrames
        .map((frame) => ({
          point: frame.canonicalPoints[index],
          weight: frame.weight,
        }))
        .filter(
          (
            item,
          ): item is {
            point: Point3D & { index: number }
            weight: number
          } =>
            Boolean(item.point) &&
            Number.isFinite(item.point.x) &&
            Number.isFinite(item.point.y) &&
            Number.isFinite(item.point.z) &&
            Number.isFinite(item.weight) &&
            item.weight > 0,
        )
      const weightTotal = points.reduce((sum, item) => sum + item.weight, 0)
      const stableZ = stableZValues[index]

      if (weightTotal <= 0) {
        return {
          index,
          x: 0,
          y: 0,
          z: 0,
          confidence: stableZ?.confidence ?? 0.12,
          source: "pose_aware_canonical_stable_z_v1" as const,
        }
      }

      return {
        index,
        x: Number(
          (
            points.reduce((sum, item) => sum + item.point.x * item.weight, 0) /
            weightTotal
          ).toFixed(4),
        ),
        y: Number(
          (
            points.reduce((sum, item) => sum + item.point.y * item.weight, 0) /
            weightTotal
          ).toFixed(4),
        ),
        z: Number(
          (
            points.reduce((sum, item) => sum + item.point.z * item.weight, 0) /
            weightTotal
          ).toFixed(4),
        ),
        confidence: stableZ?.confidence ?? 0.12,
        source: "pose_aware_canonical_stable_z_v1" as const,
      }
    },
  )

  return {
    landmarks: centerPoseAwareCanonicalLandmarks(uncenteredLandmarks),
    localPoints: canonicalFrames.flatMap((frame) => frame.localPoints),
    canonicalFramePoints: canonicalFrames.flatMap(
      (frame) => frame.canonicalPoints,
    ),
    weightTotal: roundDebugNumber(
      canonicalFrames.reduce((sum, frame) => sum + frame.weight, 0),
    ),
  }
}

function buildPoseAwareBalancedFrameZFrameLocalAndCanonicalPoints(
  frame: PoseAwareInferenceFrame,
  basePoints: PoseAwareBasePoint[],
  stableZValues: StableZLandmarkValue[],
  frameWeight: FrameStableZWeightDebug,
): {
  localPoints: Array<Point3D & { index: number }>
  canonicalPoints: Array<Point3D & { index: number }>
  weight: number
  hintsByLandmark: PoseAwareZHint[][]
  frameZValues: number[]
  fallbackCount: number
  clampCount: number
} | null {
  const sameUnitLandmarks = getSameUnitLandmarks2D(frame)
  const hintsByLandmark = collectPoseAwareStableZHintsForFrame(
    frame,
    basePoints,
    frameWeight,
  )
  const weight = frameWeight.finalCanonicalAverageWeight

  if (
    !sameUnitLandmarks ||
    sameUnitLandmarks.length !== REQUIRED_LANDMARK_COUNT ||
    !Number.isFinite(weight) ||
    weight <= 0
  ) {
    return null
  }

  let fallbackCount = 0
  const clampCount = 0
  const frameZValues: number[] = []
  const localPoints = sameUnitLandmarks.map((landmark, index) => {
    const hints = hintsByLandmark[index] ?? []
    const weightTotal = hints.reduce((sum, hint) => sum + hint.weight, 0)
    const fallbackUsed = hints.length === 0 || weightTotal <= 0
    const z = fallbackUsed
      ? stableZValues[index]?.z ?? 0
      : getWeightedAverageZ(hints)

    if (fallbackUsed) {
      fallbackCount += 1
    }

    frameZValues.push(z)

    return {
      index,
      x: landmark.x,
      y: landmark.y,
      z: Number(z.toFixed(4)),
    }
  })
  const canonicalPoints = localPoints.map((point) => ({
    index: point.index,
    ...inverseRotatePoseAwarePoint3D(point, frame.pose),
  }))

  return {
    localPoints,
    canonicalPoints,
    weight,
    hintsByLandmark,
    frameZValues,
    fallbackCount,
    clampCount,
  }
}

function buildPoseAwareCanonicalBalancedFrameZLandmarksFromFrames(
  observationFrames: PoseAwareInferenceFrame[],
  basePoints: PoseAwareBasePoint[],
  stableZValues: StableZLandmarkValue[],
  frameWeights: FrameStableZWeightDebug[],
  dataset: PoseAwareInferenceDataset,
): {
  landmarks: IdealLandmark3DCandidate[]
  localPoints: Array<Point3D & { index: number }>
  canonicalFramePoints: Array<Point3D & { index: number }>
  hintsByLandmark: PoseAwareZHint[][]
  frameZValues: number[]
  fallbackCount: number
  clampCount: number
  weightTotal: number
} | null {
  const frameWeightById = new Map(
    frameWeights.map((frameWeight) => [frameWeight.frameId, frameWeight]),
  )
  const canonicalFrames = observationFrames
    .map((frame) => {
      const frameWeight = frameWeightById.get(frame.frameId)

      if (!frameWeight) {
        return null
      }

      return buildPoseAwareBalancedFrameZFrameLocalAndCanonicalPoints(
        frame,
        basePoints,
        stableZValues,
        frameWeight,
      )
    })
    .filter(
      (
        frame,
      ): frame is {
        localPoints: Array<Point3D & { index: number }>
        canonicalPoints: Array<Point3D & { index: number }>
        weight: number
        hintsByLandmark: PoseAwareZHint[][]
        frameZValues: number[]
        fallbackCount: number
        clampCount: number
      } => frame !== null,
    )

  if (canonicalFrames.length === 0) {
    return null
  }

  const hintsByLandmark = Array.from(
    { length: REQUIRED_LANDMARK_COUNT },
    () => [] as PoseAwareZHint[],
  )

  canonicalFrames.forEach((frame) => {
    frame.hintsByLandmark.forEach((hints, index) => {
      hintsByLandmark[index].push(...hints)
    })
  })

  const uncenteredLandmarks = Array.from(
    { length: REQUIRED_LANDMARK_COUNT },
    (_, index) => {
      const points = canonicalFrames
        .map((frame) => ({
          point: frame.canonicalPoints[index],
          weight: frame.weight,
        }))
        .filter(
          (
            item,
          ): item is {
            point: Point3D & { index: number }
            weight: number
          } =>
            Boolean(item.point) &&
            Number.isFinite(item.point.x) &&
            Number.isFinite(item.point.y) &&
            Number.isFinite(item.point.z) &&
            Number.isFinite(item.weight) &&
            item.weight > 0,
        )
      const weightTotal = points.reduce((sum, item) => sum + item.weight, 0)
      const stableZ = stableZValues[index]
      const hints = hintsByLandmark[index] ?? []
      const confidence =
        hints.length === 0
          ? stableZ?.confidence ?? 0.12
          : inferPoseAwareLandmarkConfidence(
              hints,
              dataset,
              getWeightedAverageZ(hints),
            )

      if (weightTotal <= 0) {
        return {
          index,
          x: 0,
          y: 0,
          z: 0,
          confidence,
          source: "pose_aware_canonical_balanced_frame_z_v1" as const,
        }
      }

      return {
        index,
        x: Number(
          (
            points.reduce((sum, item) => sum + item.point.x * item.weight, 0) /
            weightTotal
          ).toFixed(4),
        ),
        y: Number(
          (
            points.reduce((sum, item) => sum + item.point.y * item.weight, 0) /
            weightTotal
          ).toFixed(4),
        ),
        z: Number(
          (
            points.reduce((sum, item) => sum + item.point.z * item.weight, 0) /
            weightTotal
          ).toFixed(4),
        ),
        confidence,
        source: "pose_aware_canonical_balanced_frame_z_v1" as const,
      }
    },
  )

  return {
    landmarks: centerPoseAwareCanonicalLandmarks(uncenteredLandmarks),
    localPoints: canonicalFrames.flatMap((frame) => frame.localPoints),
    canonicalFramePoints: canonicalFrames.flatMap(
      (frame) => frame.canonicalPoints,
    ),
    hintsByLandmark,
    frameZValues: canonicalFrames.flatMap((frame) => frame.frameZValues),
    fallbackCount: canonicalFrames.reduce(
      (sum, frame) => sum + frame.fallbackCount,
      0,
    ),
    clampCount: canonicalFrames.reduce((sum, frame) => sum + frame.clampCount, 0),
    weightTotal: roundDebugNumber(
      canonicalFrames.reduce((sum, frame) => sum + frame.weight, 0),
    ),
  }
}

function getMediaPipeZSettingsDebug(): MediaPipeMeshAverageSettingsDebug {
  return {
    mediaPipeZSource: MEDIA_PIPE_Z_SOURCE,
    mediaPipeZScale: roundDebugNumber(mediaPipeZScale),
    mediaPipeZCenteringMode:
      mediaPipeZNormalizeMode === "raw" ? "none" : "frame_mean",
    mediaPipeZInvertSign,
    mediaPipeZNormalizeMode,
    frontReferenceMatchRangeRatio:
      MEDIA_PIPE_Z_FRONT_REFERENCE_MATCH_RANGE_RATIO,
  }
}

function buildMediaPipeZAvailabilityDebug(
  observationFrames: PoseAwareInferenceFrame[],
): MediaPipeZAvailabilityDebug {
  const zValues = observationFrames.flatMap((frame) =>
    frame.landmarks.map((landmark) => landmark.z),
  )
  const finiteCount = zValues.filter((value) => Number.isFinite(value)).length
  const frameCountWithZ = observationFrames.filter(
    (frame) =>
      frame.landmarks.length === REQUIRED_LANDMARK_COUNT &&
      frame.landmarks.every((landmark) => Number.isFinite(landmark.z)),
  ).length
  const transformMatrixAvailableCount = observationFrames.filter(
    (frame) => frame.hasFacialTransformationMatrix,
  ).length

  return {
    hasLandmarkZ: finiteCount > 0,
    landmarkZFiniteCount: finiteCount,
    landmarkZMissingCount: zValues.length - finiteCount,
    frameCountWithZ,
    frameCountWithoutZ: observationFrames.length - frameCountWithZ,
    hasTransformMatrix: transformMatrixAvailableCount > 0,
    transformMatrixAvailableCount,
  }
}

function summarizeMediaPipeZRange(
  rawValues: number[],
  normalizedValues: number[],
  scaledValues: number[],
  landmarks: IdealLandmark3DCandidate[],
): MediaPipeZRangeDebug {
  const summarize = (
    values: number[],
  ): {
    min: number | null
    max: number | null
    average: number | null
    range: number | null
  } => {
    const finiteValues = values.filter((value) => Number.isFinite(value))

    if (finiteValues.length === 0) {
      return { min: null, max: null, average: null, range: null }
    }

    const min = Math.min(...finiteValues)
    const max = Math.max(...finiteValues)

    return {
      min: roundDebugNumber(min),
      max: roundDebugNumber(max),
      average: roundDebugNumber(averageNumbers(finiteValues)),
      range: roundDebugNumber(max - min),
    }
  }
  const raw = summarize(rawValues)
  const normalized = summarize(normalizedValues)
  const scaled = summarize(scaledValues)
  const final = summarize(landmarks.map((landmark) => landmark.z))

  return {
    rawMediaPipeZMin: raw.min,
    rawMediaPipeZMax: raw.max,
    rawMediaPipeZAverage: raw.average,
    rawMediaPipeZRange: raw.range,
    normalizedMediaPipeZMin: normalized.min,
    normalizedMediaPipeZMax: normalized.max,
    normalizedMediaPipeZAverage: normalized.average,
    normalizedMediaPipeZRange: normalized.range,
    mediaPipeZRangeBeforeScale: normalized.range,
    mediaPipeZRangeAfterScale: scaled.range,
    finalCandidateZMin: final.min,
    finalCandidateZMax: final.max,
    finalCandidateZRange: final.range,
  }
}

function normalizeMediaPipeFrameZValues(
  frame: PoseAwareInferenceFrame,
  sameUnitLandmarks: PoseAwareCorrectedLandmark2D[],
  frontReferenceBaseBounds: LandmarkBoundsSummary | null,
): {
  normalizedByIndex: number[]
  scaledByIndex: number[]
  rawValues: number[]
  normalizedValues: number[]
  scaledValues: number[]
} {
  const rawValues = frame.landmarks.map((landmark) => landmark.z)
  const finiteRawValues = rawValues.filter((value) => Number.isFinite(value))
  const rawAverage = averageNumbers(finiteRawValues)
  const rawRange = getZRange(finiteRawValues) ?? 0
  const sameUnitBounds = buildLandmarkBoundsSummary(sameUnitLandmarks)
  const sameUnitFaceWidth = sameUnitBounds?.width ?? 1
  const frontReferenceWidth = frontReferenceBaseBounds?.width ?? sameUnitFaceWidth
  const targetFrontReferenceRange =
    frontReferenceWidth * MEDIA_PIPE_Z_FRONT_REFERENCE_MATCH_RANGE_RATIO

  const normalizeValue = (rawZ: number): number => {
    if (!Number.isFinite(rawZ)) {
      return 0
    }

    const centered = rawZ - rawAverage

    if (mediaPipeZNormalizeMode === "raw") {
      return rawZ
    }

    if (mediaPipeZNormalizeMode === "centered") {
      return centered
    }

    if (mediaPipeZNormalizeMode === "faceWidthScaled") {
      return centered * sameUnitFaceWidth
    }

    if (rawRange <= 0 || !Number.isFinite(targetFrontReferenceRange)) {
      return 0
    }

    return (centered / rawRange) * targetFrontReferenceRange
  }

  const normalizedByIndex = rawValues.map(normalizeValue)
  const scaledByIndex = normalizedByIndex.map((value) =>
    (mediaPipeZInvertSign ? -value : value) * mediaPipeZScale,
  )

  return {
    normalizedByIndex,
    scaledByIndex,
    rawValues: finiteRawValues,
    normalizedValues: normalizedByIndex.filter((value) =>
      Number.isFinite(value),
    ),
    scaledValues: scaledByIndex.filter((value) => Number.isFinite(value)),
  }
}

function buildPoseAwareMediaPipeMeshFrameLocalAndCanonicalPoints(
  frame: PoseAwareInferenceFrame,
  frameWeight: FrameStableZWeightDebug,
  frontReferenceBaseBounds: LandmarkBoundsSummary | null,
): {
  localPoints: Array<Point3D & { index: number }>
  canonicalPoints: Array<Point3D & { index: number }>
  weight: number
  rawValues: number[]
  normalizedValues: number[]
  scaledValues: number[]
} | null {
  const sameUnitLandmarks = getSameUnitLandmarks2D(frame)
  const weight = frameWeight.finalCanonicalAverageWeight

  if (
    !sameUnitLandmarks ||
    sameUnitLandmarks.length !== REQUIRED_LANDMARK_COUNT ||
    !Number.isFinite(weight) ||
    weight <= 0
  ) {
    return null
  }

  const zValues = normalizeMediaPipeFrameZValues(
    frame,
    sameUnitLandmarks,
    frontReferenceBaseBounds,
  )
  const localPoints = sameUnitLandmarks.map((landmark, index) => ({
    index,
    x: landmark.x,
    y: landmark.y,
    z: Number((zValues.scaledByIndex[index] ?? 0).toFixed(4)),
  }))
  const canonicalPoints = localPoints.map((point) => ({
    index: point.index,
    ...inverseRotatePoseAwarePoint3D(point, frame.pose),
  }))

  return {
    localPoints,
    canonicalPoints,
    weight,
    rawValues: zValues.rawValues,
    normalizedValues: zValues.normalizedValues,
    scaledValues: zValues.scaledValues,
  }
}

function inferMediaPipeMeshAverageLandmarkConfidence(
  pointCount: number,
  frameCount: number,
  weightTotal: number,
): number {
  const supportScore = frameCount <= 0 ? 0 : clamp(pointCount / frameCount, 0, 1)
  const weightScore = clamp(weightTotal / Math.max(frameCount * 0.5, 1), 0, 1)

  return Number((supportScore * 0.65 + weightScore * 0.35).toFixed(4))
}

function buildPoseAwareMediaPipeMeshAverageLandmarksFromFrames(
  observationFrames: PoseAwareInferenceFrame[],
  frameWeights: FrameStableZWeightDebug[],
  frontReferenceBaseBounds: LandmarkBoundsSummary | null,
): {
  landmarks: IdealLandmark3DCandidate[]
  localPoints: Array<Point3D & { index: number }>
  canonicalFramePoints: Array<Point3D & { index: number }>
  rawZValues: number[]
  normalizedZValues: number[]
  scaledZValues: number[]
  weightTotal: number
} | null {
  const frameWeightById = new Map(
    frameWeights.map((frameWeight) => [frameWeight.frameId, frameWeight]),
  )
  const canonicalFrames = observationFrames
    .map((frame) => {
      const frameWeight = frameWeightById.get(frame.frameId)

      if (!frameWeight) {
        return null
      }

      return buildPoseAwareMediaPipeMeshFrameLocalAndCanonicalPoints(
        frame,
        frameWeight,
        frontReferenceBaseBounds,
      )
    })
    .filter(
      (
        frame,
      ): frame is {
        localPoints: Array<Point3D & { index: number }>
        canonicalPoints: Array<Point3D & { index: number }>
        weight: number
        rawValues: number[]
        normalizedValues: number[]
        scaledValues: number[]
      } => frame !== null,
    )

  if (canonicalFrames.length === 0) {
    return null
  }

  const uncenteredLandmarks = Array.from(
    { length: REQUIRED_LANDMARK_COUNT },
    (_, index) => {
      const points = canonicalFrames
        .map((frame) => ({
          point: frame.canonicalPoints[index],
          weight: frame.weight,
        }))
        .filter(
          (
            item,
          ): item is {
            point: Point3D & { index: number }
            weight: number
          } =>
            Boolean(item.point) &&
            Number.isFinite(item.point.x) &&
            Number.isFinite(item.point.y) &&
            Number.isFinite(item.point.z) &&
            Number.isFinite(item.weight) &&
            item.weight > 0,
        )
      const weightTotal = points.reduce((sum, item) => sum + item.weight, 0)
      const confidence = inferMediaPipeMeshAverageLandmarkConfidence(
        points.length,
        observationFrames.length,
        weightTotal,
      )

      if (weightTotal <= 0) {
        return {
          index,
          x: 0,
          y: 0,
          z: 0,
          confidence,
          source: "pose_aware_mediapipe_mesh_average_v1" as const,
        }
      }

      return {
        index,
        x: Number(
          (
            points.reduce((sum, item) => sum + item.point.x * item.weight, 0) /
            weightTotal
          ).toFixed(4),
        ),
        y: Number(
          (
            points.reduce((sum, item) => sum + item.point.y * item.weight, 0) /
            weightTotal
          ).toFixed(4),
        ),
        z: Number(
          (
            points.reduce((sum, item) => sum + item.point.z * item.weight, 0) /
            weightTotal
          ).toFixed(4),
        ),
        confidence,
        source: "pose_aware_mediapipe_mesh_average_v1" as const,
      }
    },
  )

  return {
    landmarks: centerPoseAwareCanonicalLandmarks(uncenteredLandmarks),
    localPoints: canonicalFrames.flatMap((frame) => frame.localPoints),
    canonicalFramePoints: canonicalFrames.flatMap(
      (frame) => frame.canonicalPoints,
    ),
    rawZValues: canonicalFrames.flatMap((frame) => frame.rawValues),
    normalizedZValues: canonicalFrames.flatMap(
      (frame) => frame.normalizedValues,
    ),
    scaledZValues: canonicalFrames.flatMap((frame) => frame.scaledValues),
    weightTotal: roundDebugNumber(
      canonicalFrames.reduce((sum, frame) => sum + frame.weight, 0),
    ),
  }
}

function buildPoseAwarePartialCanonicalCandidateSummary(
  observationFrames: PoseAwareInferenceFrame[],
  basePoints: PoseAwareBasePoint[],
  dataset: PoseAwareInferenceDataset,
): PoseAwarePartialCandidateSummary {
  const partial = buildPoseAwareCanonicalLandmarksFromFrames(
    observationFrames,
    basePoints,
    dataset,
  )

  if (!partial) {
    return buildEmptyPoseAwarePartialCandidateSummary()
  }

  return {
    frameCount: observationFrames.length,
    weightTotal: partial.weightTotal,
    spatial: buildLandmarkSpatialSummary(partial.landmarks),
    representative: getPoseAwareRepresentativePointSummary(partial.landmarks),
  }
}

function buildPoseAwareCandidateComparisonDebug(
  oldResult: IdealLandmarks3DCandidateResult | null,
  newLandmarks: IdealLandmark3DCandidate[],
  newGenerationMethod: IdealLandmarks3DGenerationMethod,
): PoseAwareCandidateComparisonDebug | undefined {
  if (
    !oldResult ||
    oldResult.status !== "generated" ||
    oldResult.generationMethod === null
  ) {
    return undefined
  }

  const oldSpatial = buildLandmarkSpatialSummary(oldResult.landmarks)
  const newSpatial = buildLandmarkSpatialSummary(newLandmarks)
  const oldRepresentative = getPoseAwareRepresentativePointSummary(
    oldResult.landmarks,
  )
  const newRepresentative = getPoseAwareRepresentativePointSummary(newLandmarks)
  const oldTopView = buildTopViewZAsymmetrySummary(oldResult.landmarks)
  const newTopView = buildTopViewZAsymmetrySummary(newLandmarks)

  return {
    oldGenerationMethod: oldResult.generationMethod,
    newGenerationMethod,
    oldCandidate: {
      spatial: oldSpatial,
      representative: oldRepresentative,
      topView: oldTopView,
    },
    newCandidate: {
      spatial: newSpatial,
      representative: newRepresentative,
      topView: newTopView,
    },
    noseOffsetDelta:
      oldRepresentative.noseOffsetFromBoundsCenterX === null ||
      newRepresentative.noseOffsetFromBoundsCenterX === null
        ? null
        : roundDebugNumber(
            newRepresentative.noseOffsetFromBoundsCenterX -
              oldRepresentative.noseOffsetFromBoundsCenterX,
          ),
    boundsCenterOffset:
      oldSpatial.boundsCenter === null || newSpatial.boundsCenter === null
        ? null
        : {
            x: roundDebugNumber(
              newSpatial.boundsCenter.x - oldSpatial.boundsCenter.x,
            ),
            y: roundDebugNumber(
              newSpatial.boundsCenter.y - oldSpatial.boundsCenter.y,
            ),
            z: roundDebugNumber(
              newSpatial.boundsCenter.z - oldSpatial.boundsCenter.z,
            ),
          },
    zRangeDelta:
      oldSpatial.bounds?.zRange === undefined ||
      newSpatial.bounds?.zRange === undefined
        ? null
        : roundDebugNumber(newSpatial.bounds.zRange - oldSpatial.bounds.zRange),
    topViewAsymmetryDelta:
      oldTopView.topViewAsymmetryScore === null ||
      newTopView.topViewAsymmetryScore === null
        ? null
        : roundDebugNumber(
            (newTopView.topViewAsymmetryScore ?? 0) -
              (oldTopView.topViewAsymmetryScore ?? 0),
          ),
  }
}

function buildPoseAwareCanonicalWarnings(
  observationSummary: PoseAwareObservationFrameDebugSummary,
  canonicalAverage: LandmarkSpatialSummary,
  comparison: PoseAwareCandidateComparisonDebug | undefined,
): string[] {
  const warnings: string[] = []
  const total = observationSummary.totalObservationFrameCount
  const yawImbalance =
    total === 0
      ? 0
      : Math.abs(
          observationSummary.positiveYawCount -
            observationSummary.negativeYawCount,
        ) / total

  if (yawImbalance >= POSE_AWARE_CANONICAL_YAW_IMBALANCE_WARNING_RATIO) {
    warnings.push("yaw distribution is one-sided; compare old/new centers.")
  }

  if (
    observationSummary.nearFrontCount < POSE_AWARE_CANONICAL_MIN_NEAR_FRONT_COUNT
  ) {
    warnings.push("near-front observation frames are low.")
  }

  const zRange = canonicalAverage.bounds?.zRange

  if (
    zRange !== undefined &&
    (zRange < POSE_AWARE_CANONICAL_Z_RANGE_WARNING_MIN ||
      zRange > POSE_AWARE_CANONICAL_Z_RANGE_WARNING_MAX)
  ) {
    warnings.push("canonical z range is outside the prototype debug range.")
  }

  if (
    comparison?.boundsCenterOffset &&
    Math.abs(comparison.boundsCenterOffset.x) >=
      POSE_AWARE_CANONICAL_CENTER_OFFSET_WARNING
  ) {
    warnings.push("old/new candidate bounds center x differs noticeably.")
  }

  return warnings
}

function buildPoseAwareCanonical3DCandidateDebug(
  dataset: PoseAwareInferenceDataset,
  basePoints: PoseAwareBasePoint[],
  canonicalResult: {
    landmarks: IdealLandmark3DCandidate[]
    localPoints: Array<Point3D & { index: number }>
    canonicalFramePoints: Array<Point3D & { index: number }>
  },
  oldResult: IdealLandmarks3DCandidateResult | null,
): PoseAwareCanonical3DDebug {
  const observationFrames = dataset.observationFrames
  const observationSummary =
    buildPoseAwareObservationFrameDebugSummary(observationFrames)
  const canonicalAverage = buildLandmarkSpatialSummary(canonicalResult.landmarks)
  const comparison = buildPoseAwareCandidateComparisonDebug(
    oldResult,
    canonicalResult.landmarks,
    "pose_aware_canonical_3d_v1",
  )
  const debugWithoutWarnings = {
    generationMethod: "pose_aware_canonical_3d_v1" as const,
    observationFrames: observationSummary,
    canonicalization: {
      frameLocal3DBounds: buildLandmarkBoundsSummary(
        canonicalResult.localPoints,
      ),
      inversePoseCanonical3DBounds: buildLandmarkBoundsSummary(
        canonicalResult.canonicalFramePoints,
      ),
      canonicalAverage,
    },
    comparison,
    partialCandidates: {
      rightYawOnly: buildPoseAwarePartialCanonicalCandidateSummary(
        observationFrames.filter((frame) => frame.pose.yaw > 0),
        basePoints,
        dataset,
      ),
      leftYawOnly: buildPoseAwarePartialCanonicalCandidateSummary(
        observationFrames.filter((frame) => frame.pose.yaw < 0),
        basePoints,
        dataset,
      ),
      nearFrontOnly: buildPoseAwarePartialCanonicalCandidateSummary(
        observationFrames.filter(
          (frame) =>
            Math.abs(frame.pose.yaw) <=
            POSE_AWARE_CANONICAL_NEAR_FRONT_YAW_DEG,
        ),
        basePoints,
        dataset,
      ),
    },
  }

  return {
    ...debugWithoutWarnings,
    warnings: buildPoseAwareCanonicalWarnings(
      observationSummary,
      canonicalAverage,
      comparison,
    ),
  }
}

function isSignalRatioImbalanced(ratio: number | null): boolean {
  if (ratio === null) {
    return false
  }

  return (
    ratio >= POSE_AWARE_STABLE_Z_SIGNAL_IMBALANCE_WARNING_RATIO ||
    ratio <= 1 / POSE_AWARE_STABLE_Z_SIGNAL_IMBALANCE_WARNING_RATIO
  )
}

function isDirectionSignalOneSidedOrImbalanced(
  positiveSignal: number,
  negativeSignal: number,
  ratio: number | null,
): boolean {
  if (
    (positiveSignal > 0 && negativeSignal <= 0) ||
    (negativeSignal > 0 && positiveSignal <= 0)
  ) {
    return true
  }

  return isSignalRatioImbalanced(ratio)
}

function buildPoseAwareCanonicalStableZWarnings(
  stableZ: StableZSummary,
  directionBalance: DirectionBalanceSummary,
  frameCount: number,
  comparison: PoseAwareCandidateComparisonDebug | undefined,
  topView: TopViewZAsymmetrySummary,
  nearFrontObservation: NearFrontObservationDebugSummary,
): string[] {
  const warnings: string[] = []

  if (
    isDirectionSignalOneSidedOrImbalanced(
      directionBalance.totalYawPositiveSignal,
      directionBalance.totalYawNegativeSignal,
      directionBalance.yawPositiveNegativeSignalRatio,
    )
  ) {
    warnings.push("yaw direction signal is strongly imbalanced.")
  }

  if (
    isDirectionSignalOneSidedOrImbalanced(
      directionBalance.totalPitchPositiveSignal,
      directionBalance.totalPitchNegativeSignal,
      directionBalance.pitchPositiveNegativeSignalRatio,
    )
  ) {
    warnings.push("pitch direction signal is strongly imbalanced.")
  }

  if (
    stableZ.fallbackCount / REQUIRED_LANDMARK_COUNT >=
    POSE_AWARE_STABLE_Z_FALLBACK_WARNING_RATIO
  ) {
    warnings.push("stableZ fallback count is high.")
  }

  if (
    frameCount > 0 &&
    directionBalance.clampedDirectionBalanceWeightCount / frameCount >=
      POSE_AWARE_STABLE_Z_CLAMPED_FRAME_WARNING_RATIO
  ) {
    warnings.push("directionBalanceWeight is clamped for many frames.")
  }

  if (
    stableZ.zRange < POSE_AWARE_CANONICAL_Z_RANGE_WARNING_MIN ||
    stableZ.zRange > POSE_AWARE_CANONICAL_Z_RANGE_WARNING_MAX
  ) {
    warnings.push("stableZ range is outside the prototype debug range.")
  }

  if (
    comparison?.zRangeDelta !== null &&
    comparison?.zRangeDelta !== undefined &&
    Math.abs(comparison.zRangeDelta) >= 0.15
  ) {
    warnings.push("old/new z range differs noticeably.")
  }

  if (
    topView.topViewAsymmetryScore !== null &&
    topView.topViewAsymmetryScore >= POSE_AWARE_TOP_VIEW_ASYMMETRY_WARNING_SCORE
  ) {
    warnings.push("top view asymmetry is still large.")
  }

  warnings.push(topView.warning)

  if (nearFrontObservation.warning) {
    warnings.push(nearFrontObservation.warning)
  }

  return warnings
}

function buildPoseAwareCanonicalStableZCandidateDebug(
  dataset: PoseAwareInferenceDataset,
  canonicalResult: {
    landmarks: IdealLandmark3DCandidate[]
    localPoints: Array<Point3D & { index: number }>
    canonicalFramePoints: Array<Point3D & { index: number }>
  },
  stableZValues: StableZLandmarkValue[],
  stableZHintsByLandmark: PoseAwareZHint[][],
  directionBalance: DirectionBalanceSummary,
  frameWeights: FrameStableZWeightDebug[],
  oldResult: IdealLandmarks3DCandidateResult | null,
): PoseAwareCanonicalStableZDebug {
  const observationFrames = dataset.observationFrames
  const observationSummary =
    buildPoseAwareObservationFrameDebugSummary(observationFrames)
  const stableZ = buildStableZSummary(stableZValues)
  const comparison = buildPoseAwareCandidateComparisonDebug(
    oldResult,
    canonicalResult.landmarks,
    "pose_aware_canonical_stable_z_v1",
  )
  const topView = buildTopViewZAsymmetrySummary(canonicalResult.landmarks)
  const nearFrontObservation = buildNearFrontObservationDebugSummary(dataset)
  const debugWithoutWarnings = {
    generationMethod: "pose_aware_canonical_stable_z_v1" as const,
    observationFrames: observationSummary,
    stableZ,
    directionBalance,
    stableZWeights: buildStableZWeightDebugSummary(
      stableZHintsByLandmark,
      frameWeights,
    ),
    canonicalAverageWeights:
      buildCanonicalAverageWeightDebugSummary(frameWeights),
    frameWeights: buildFrameStableZWeightDebugSummary(frameWeights),
    nearFrontObservation,
    canonicalization: {
      frameLocal3DBounds: buildLandmarkBoundsSummary(
        canonicalResult.localPoints,
      ),
      inversePoseCanonical3DBounds: buildLandmarkBoundsSummary(
        canonicalResult.canonicalFramePoints,
      ),
      canonicalAverage: buildLandmarkSpatialSummary(canonicalResult.landmarks),
    },
    comparison,
    topView,
  }

  return {
    ...debugWithoutWarnings,
    warnings: buildPoseAwareCanonicalStableZWarnings(
      stableZ,
      directionBalance,
      observationFrames.length,
      comparison,
      topView,
      nearFrontObservation,
    ),
  }
}

function buildPoseAwareCanonicalBalancedFrameZWarnings(
  directionBalance: DirectionBalanceSummary,
  frameZHint: FrameZHintSummary,
  frameCount: number,
  nearFrontObservation: NearFrontObservationDebugSummary,
  topView: TopViewZAsymmetrySummary,
  comparison: BalancedFrameZCandidateComparisonDebug,
): string[] {
  const warnings: string[] = []

  if (
    isDirectionSignalOneSidedOrImbalanced(
      directionBalance.totalYawPositiveSignal,
      directionBalance.totalYawNegativeSignal,
      directionBalance.yawPositiveNegativeSignalRatio,
    )
  ) {
    warnings.push("yaw direction signal is strongly imbalanced.")
  }

  if (nearFrontObservation.warning) {
    warnings.push(nearFrontObservation.warning)
  }

  if (nearFrontObservation.useForInferenceFrontReferenceFrameCount === 0) {
    warnings.push("useForInference frontReference count is 0.")
  }

  warnings.push(topView.warning)

  if (
    frameZHint.fallbackCount / Math.max(frameCount * REQUIRED_LANDMARK_COUNT, 1) >=
    POSE_AWARE_STABLE_Z_FALLBACK_WARNING_RATIO
  ) {
    warnings.push("frameZHint fallback is high.")
  }

  if (
    frameZHint.clampCount / Math.max(frameCount * REQUIRED_LANDMARK_COUNT, 1) >=
    POSE_AWARE_STABLE_Z_CLAMPED_FRAME_WARNING_RATIO
  ) {
    warnings.push("frameZHint clamp is high.")
  }

  const stableZComparison = comparison.canonicalStableZ

  if (
    stableZComparison &&
    comparison.balancedFrameZ.zRange > stableZComparison.zRange
  ) {
    warnings.push("balanced_frame_z result has larger zRange than canonical_stable_z.")
  }

  if (
    stableZComparison?.topViewAsymmetryScore !== null &&
    stableZComparison?.topViewAsymmetryScore !== undefined &&
    comparison.balancedFrameZ.topViewAsymmetryScore !== null &&
    comparison.balancedFrameZ.topViewAsymmetryScore >
      stableZComparison.topViewAsymmetryScore
  ) {
    warnings.push(
      "balanced_frame_z result has worse topViewAsymmetry than canonical_stable_z.",
    )
  }

  return warnings
}

function buildPoseAwareCanonicalBalancedFrameZCandidateDebug(
  dataset: PoseAwareInferenceDataset,
  canonicalResult: {
    landmarks: IdealLandmark3DCandidate[]
    localPoints: Array<Point3D & { index: number }>
    canonicalFramePoints: Array<Point3D & { index: number }>
    hintsByLandmark: PoseAwareZHint[][]
    frameZValues: number[]
    fallbackCount: number
    clampCount: number
  },
  directionBalance: DirectionBalanceSummary,
  frameWeights: FrameStableZWeightDebug[],
  canonical3DResult: IdealLandmarks3DCandidateResult | null,
  stableZResult: IdealLandmarks3DCandidateResult | null,
): PoseAwareCanonicalBalancedFrameZDebug {
  const observationFrames = dataset.observationFrames
  const observationSummary =
    buildPoseAwareObservationFrameDebugSummary(observationFrames)
  const frameZHint = buildFrameZHintSummary(
    canonicalResult.hintsByLandmark,
    canonicalResult.frameZValues,
    canonicalResult.fallbackCount,
    canonicalResult.clampCount,
  )
  const comparison = buildPoseAwareCandidateComparisonDebug(
    stableZResult,
    canonicalResult.landmarks,
    "pose_aware_canonical_balanced_frame_z_v1",
  )
  const topView = buildTopViewZAsymmetrySummary(canonicalResult.landmarks)
  const nearFrontObservation = buildNearFrontObservationDebugSummary(dataset)
  const multiCandidateComparison: BalancedFrameZCandidateComparisonDebug = {
    canonical3D: canonical3DResult
      ? buildCandidateDebugComparisonItem(canonical3DResult)
      : null,
    canonicalStableZ: stableZResult
      ? buildCandidateDebugComparisonItem(stableZResult)
      : null,
    balancedFrameZ: buildCandidateDebugComparisonItemFromLandmarks(
      "pose_aware_canonical_balanced_frame_z_v1",
      canonicalResult.landmarks,
    ),
  }
  const debugWithoutWarnings = {
    generationMethod: "pose_aware_canonical_balanced_frame_z_v1" as const,
    generationSummary: {
      observationFrameCount: dataset.observationFrames.length,
      frontReferenceFrameCount: dataset.frontReferenceFrames.length,
      nearFrontObservationFrameCount:
        nearFrontObservation.nearFrontObservationFrameCount,
      useForInferenceFrontReferenceFrameCount:
        nearFrontObservation.useForInferenceFrontReferenceFrameCount,
    },
    observationFrames: observationSummary,
    directionBalance,
    frameZHint,
    canonicalAverageWeights:
      buildCanonicalAverageWeightDebugSummary(frameWeights),
    frameWeights: buildFrameStableZWeightDebugSummary(frameWeights),
    nearFrontObservation,
    canonicalization: {
      frameLocal3DBounds: buildLandmarkBoundsSummary(
        canonicalResult.localPoints,
      ),
      inversePoseCanonical3DBounds: buildLandmarkBoundsSummary(
        canonicalResult.canonicalFramePoints,
      ),
      canonicalAverage: buildLandmarkSpatialSummary(canonicalResult.landmarks),
    },
    comparison,
    multiCandidateComparison,
    topView,
  }

  return {
    ...debugWithoutWarnings,
    warnings: buildPoseAwareCanonicalBalancedFrameZWarnings(
      directionBalance,
      frameZHint,
      observationFrames.length,
      nearFrontObservation,
      topView,
      multiCandidateComparison,
    ),
  }
}

function buildPoseAwareMediaPipeMeshAverageWarnings(
  zAvailability: MediaPipeZAvailabilityDebug,
  zRange: MediaPipeZRangeDebug,
  nearFrontObservation: NearFrontObservationDebugSummary,
  topView: TopViewZAsymmetrySummary,
  comparison: MediaPipeMeshAverageCandidateComparisonDebug,
  canonicalAverage: LandmarkSpatialSummary,
): string[] {
  const warnings: string[] = []

  if (zAvailability.frameCountWithoutZ > 0) {
    warnings.push("MediaPipe landmark.z is unavailable for some frames.")
  }

  if (
    zRange.rawMediaPipeZRange !== null &&
    zRange.rawMediaPipeZRange > MEDIA_PIPE_Z_EXTREME_RANGE_WARNING_MAX
  ) {
    warnings.push("MediaPipe raw z range is extreme.")
  }

  const candidateBounds = canonicalAverage.bounds
  const finalZRange = zRange.finalCandidateZRange
  const xySize =
    candidateBounds === null
      ? null
      : Math.max(candidateBounds.width, candidateBounds.height)

  if (finalZRange !== null && xySize !== null && xySize > 0) {
    const zToXyRatio = finalZRange / xySize

    if (
      zToXyRatio < MEDIA_PIPE_Z_THIN_RANGE_WARNING_RATIO ||
      zToXyRatio > MEDIA_PIPE_Z_THICK_RANGE_WARNING_RATIO
    ) {
      warnings.push(
        "MediaPipe z scale may not match x/y same-unit scale.",
      )
    }
  }

  if (nearFrontObservation.warning) {
    warnings.push(nearFrontObservation.warning)
  }

  if (nearFrontObservation.useForInferenceFrontReferenceFrameCount === 0) {
    warnings.push("useForInference frontReference count is 0.")
  }

  warnings.push(topView.warning)

  const balancedFrameZ = comparison.balancedFrameZ

  if (
    balancedFrameZ &&
    comparison.mediaPipeMeshAverage.zRange > balancedFrameZ.zRange
  ) {
    warnings.push("new method worsens zRange versus balanced_frame_z.")
  }

  if (
    balancedFrameZ?.topViewAsymmetryScore !== null &&
    balancedFrameZ?.topViewAsymmetryScore !== undefined &&
    comparison.mediaPipeMeshAverage.topViewAsymmetryScore !== null &&
    comparison.mediaPipeMeshAverage.topViewAsymmetryScore >
      balancedFrameZ.topViewAsymmetryScore
  ) {
    warnings.push(
      "new method worsens topViewAsymmetry versus balanced_frame_z.",
    )
  }

  return warnings
}

function buildPoseAwareMediaPipeMeshAverageCandidateDebug(
  dataset: PoseAwareInferenceDataset,
  canonicalResult: {
    landmarks: IdealLandmark3DCandidate[]
    localPoints: Array<Point3D & { index: number }>
    canonicalFramePoints: Array<Point3D & { index: number }>
    rawZValues: number[]
    normalizedZValues: number[]
    scaledZValues: number[]
  },
  directionBalance: DirectionBalanceSummary,
  frameWeights: FrameStableZWeightDebug[],
  canonical3DResult: IdealLandmarks3DCandidateResult | null,
  stableZResult: IdealLandmarks3DCandidateResult | null,
  balancedFrameZResult: IdealLandmarks3DCandidateResult | null,
): PoseAwareMediaPipeMeshAverageDebug {
  const observationFrames = dataset.observationFrames
  const observationSummary =
    buildPoseAwareObservationFrameDebugSummary(observationFrames)
  const topView = buildTopViewZAsymmetrySummary(canonicalResult.landmarks)
  const nearFrontObservation = buildNearFrontObservationDebugSummary(dataset)
  const canonicalAverage = buildLandmarkSpatialSummary(canonicalResult.landmarks)
  const mediaPipeZAvailability =
    buildMediaPipeZAvailabilityDebug(observationFrames)
  const mediaPipeZRange = summarizeMediaPipeZRange(
    canonicalResult.rawZValues,
    canonicalResult.normalizedZValues,
    canonicalResult.scaledZValues,
    canonicalResult.landmarks,
  )
  const comparison = buildPoseAwareCandidateComparisonDebug(
    balancedFrameZResult,
    canonicalResult.landmarks,
    "pose_aware_mediapipe_mesh_average_v1",
  )
  const multiCandidateComparison: MediaPipeMeshAverageCandidateComparisonDebug = {
    canonical3D: canonical3DResult
      ? buildCandidateDebugComparisonItem(canonical3DResult)
      : null,
    canonicalStableZ: stableZResult
      ? buildCandidateDebugComparisonItem(stableZResult)
      : null,
    balancedFrameZ: balancedFrameZResult
      ? buildCandidateDebugComparisonItem(balancedFrameZResult)
      : null,
    mediaPipeMeshAverage: buildCandidateDebugComparisonItemFromLandmarks(
      "pose_aware_mediapipe_mesh_average_v1",
      canonicalResult.landmarks,
    ),
  }
  const debugWithoutWarnings = {
    generationMethod: "pose_aware_mediapipe_mesh_average_v1" as const,
    settings: getMediaPipeZSettingsDebug(),
    generationSummary: {
      observationFrameCount: dataset.observationFrames.length,
      frontReferenceFrameCount: dataset.frontReferenceFrames.length,
      nearFrontObservationFrameCount:
        nearFrontObservation.nearFrontObservationFrameCount,
      useForInferenceFrontReferenceFrameCount:
        nearFrontObservation.useForInferenceFrontReferenceFrameCount,
    },
    observationFrames: observationSummary,
    mediaPipeZAvailability,
    mediaPipeZRange,
    directionBalance,
    canonicalAverageWeights:
      buildCanonicalAverageWeightDebugSummary(frameWeights),
    frameWeights: buildFrameStableZWeightDebugSummary(frameWeights),
    nearFrontObservation,
    canonicalization: {
      frameLocal3DBounds: buildLandmarkBoundsSummary(
        canonicalResult.localPoints,
      ),
      inversePoseCanonical3DBounds: buildLandmarkBoundsSummary(
        canonicalResult.canonicalFramePoints,
      ),
      canonicalAverage,
    },
    comparison,
    multiCandidateComparison,
    topView,
  }

  return {
    ...debugWithoutWarnings,
    warnings: buildPoseAwareMediaPipeMeshAverageWarnings(
      mediaPipeZAvailability,
      mediaPipeZRange,
      nearFrontObservation,
      topView,
      multiCandidateComparison,
      canonicalAverage,
    ),
  }
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
        "手動選択された正面基準がないため、pose-aware 3D候補を生成できません。",
    }
  }

  if (dataset.observationFrames.length === 0) {
    return {
      ...createInitialIdealLandmarks3DCandidateResult(),
      status: "insufficient_data",
      generationMethod: "pose_aware_weighted_z_v1",
      message:
        "IdealFace 形状生成に使う observation frame がないため、pose-aware 3D候補を生成できません。「IdealFace生成に使う」を ON にしてください。",
    }
  }

  const basePoints = buildPoseAwareBasePoints(dataset.frontReferenceFrames)

  if (!basePoints || basePoints.length !== REQUIRED_LANDMARK_COUNT) {
    return {
      ...createInitialIdealLandmarks3DCandidateResult(),
      status: "insufficient_data",
      generationMethod: "pose_aware_weighted_z_v1",
      message:
        "手動選択された正面基準の 478 landmarks を参照できないため、pose-aware 3D候補を生成できません。",
    }
  }

  const shapePoints = buildPoseAwareShapePoints(dataset.observationFrames)

  if (!shapePoints || shapePoints.length !== REQUIRED_LANDMARK_COUNT) {
    return {
      ...createInitialIdealLandmarks3DCandidateResult(),
      status: "insufficient_data",
      generationMethod: "pose_aware_weighted_z_v1",
      message:
        "IdealFace 形状生成に使う observation frame の 478 landmarks を参照できないため、pose-aware 3D候補を生成できません。",
    }
  }

  const hintsByLandmark = mergePoseAwareZHints(
    dataset.observationFrames,
    basePoints,
  )
  const uncenteredLandmarks = shapePoints.map((shapePoint, index) => {
    const hints = hintsByLandmark[index] ?? []
    const z = getWeightedAverageZ(hints)
    const confidence = inferPoseAwareLandmarkConfidence(hints, dataset, z)

    return {
      index,
      x: shapePoint.x,
      y: shapePoint.y,
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
      "Step 2-I-B dataset から、useForInference の observation だけで x/y 形状平均と yaw / pitch z hint を集計して生成した pose-aware 3D候補です。正面基準 frame は基準合わせにのみ使います。",
  }
}

function buildPoseAwareCanonical3DIdealLandmarks3DCandidateResult(
  dataset: PoseAwareInferenceDataset,
  oldResult: IdealLandmarks3DCandidateResult | null,
): IdealLandmarks3DCandidateResult {
  if (dataset.status === "missing_front_reference") {
    return {
      ...createInitialIdealLandmarks3DCandidateResult(),
      status: "insufficient_data",
      generationMethod: "pose_aware_canonical_3d_v1",
      message:
        "手動選択された正面基準がないため、pose-aware canonical 3D候補を生成できません。",
    }
  }

  if (dataset.observationFrames.length === 0) {
    return {
      ...createInitialIdealLandmarks3DCandidateResult(),
      status: "insufficient_data",
      generationMethod: "pose_aware_canonical_3d_v1",
      message:
        "IdealFace形状生成に使う observation frame がないため、pose-aware canonical 3D候補を生成できません。",
    }
  }

  const basePoints = buildPoseAwareBasePoints(dataset.frontReferenceFrames)

  if (!basePoints || basePoints.length !== REQUIRED_LANDMARK_COUNT) {
    return {
      ...createInitialIdealLandmarks3DCandidateResult(),
      status: "insufficient_data",
      generationMethod: "pose_aware_canonical_3d_v1",
      message:
        "手動選択された正面基準の 478 landmarks を参照できないため、pose-aware canonical 3D候補を生成できません。",
    }
  }

  const canonicalResult = buildPoseAwareCanonicalLandmarksFromFrames(
    dataset.observationFrames,
    basePoints,
    dataset,
  )

  if (!canonicalResult || canonicalResult.landmarks.length !== REQUIRED_LANDMARK_COUNT) {
    return {
      ...createInitialIdealLandmarks3DCandidateResult(),
      status: "insufficient_data",
      generationMethod: "pose_aware_canonical_3d_v1",
      message:
        "observation frame から canonical 3D landmarks を生成できませんでした。",
    }
  }

  const landmarks = canonicalResult.landmarks
  const debug = buildPoseAwareCanonical3DCandidateDebug(
    dataset,
    basePoints,
    canonicalResult,
    oldResult,
  )

  return {
    status: "generated",
    generationMethod: "pose_aware_canonical_3d_v1",
    landmarkCount: landmarks.length,
    landmarks,
    landmarksPreview: landmarks.slice(0, IDEAL_LANDMARKS_3D_PREVIEW_COUNT),
    summary: buildIdealLandmarks3DCandidateSummary(landmarks, {
      frontReferenceFrameCount: dataset.frontReferenceFrames.length,
      observationFrameCount: dataset.observationFrames.length,
      excludedFrameCount: dataset.excludedFrameCount,
    }),
    message:
      "Step 2-I-B dataset から、observation frame ごとに仮 3D 化し、pose 逆回転で正面 canonical 3D 空間へ戻してから weighted average した prototype 候補です。",
    debug,
  }
}

function buildPoseAwareCanonicalStableZIdealLandmarks3DCandidateResult(
  dataset: PoseAwareInferenceDataset,
  oldResult: IdealLandmarks3DCandidateResult | null,
): IdealLandmarks3DCandidateResult {
  if (dataset.status === "missing_front_reference") {
    return {
      ...createInitialIdealLandmarks3DCandidateResult(),
      status: "insufficient_data",
      generationMethod: "pose_aware_canonical_stable_z_v1",
      message:
        "frontReference frame is missing, so pose-aware canonical stableZ 3D candidate generation cannot run.",
    }
  }

  if (dataset.observationFrames.length === 0) {
    return {
      ...createInitialIdealLandmarks3DCandidateResult(),
      status: "insufficient_data",
      generationMethod: "pose_aware_canonical_stable_z_v1",
      message:
        "useForInference observation frames are missing, so pose-aware canonical stableZ 3D candidate generation cannot run.",
    }
  }

  const basePoints = buildPoseAwareBasePoints(dataset.frontReferenceFrames)

  if (!basePoints || basePoints.length !== REQUIRED_LANDMARK_COUNT) {
    return {
      ...createInitialIdealLandmarks3DCandidateResult(),
      status: "insufficient_data",
      generationMethod: "pose_aware_canonical_stable_z_v1",
      message:
        "frontReference base 478 landmarks are unavailable, so pose-aware canonical stableZ 3D candidate generation cannot run.",
    }
  }

  const { frameWeights, directionBalance } = buildFrameStableZWeightDebug(
    dataset.observationFrames,
  )
  const stableZHintsByLandmark = mergePoseAwareStableZHints(
    dataset.observationFrames,
    basePoints,
    frameWeights,
  )
  const stableZValues = buildStableZValues(dataset, stableZHintsByLandmark)
  const canonicalResult = buildPoseAwareCanonicalStableZLandmarksFromFrames(
    dataset.observationFrames,
    stableZValues,
    frameWeights,
  )

  if (!canonicalResult || canonicalResult.landmarks.length !== REQUIRED_LANDMARK_COUNT) {
    return {
      ...createInitialIdealLandmarks3DCandidateResult(),
      status: "insufficient_data",
      generationMethod: "pose_aware_canonical_stable_z_v1",
      message:
        "observation frames could not be inverse-rotated into canonical stableZ 3D landmarks.",
    }
  }

  const landmarks = canonicalResult.landmarks
  const debug = buildPoseAwareCanonicalStableZCandidateDebug(
    dataset,
    canonicalResult,
    stableZValues,
    stableZHintsByLandmark,
    directionBalance,
    frameWeights,
    oldResult,
  )

  return {
    status: "generated",
    generationMethod: "pose_aware_canonical_stable_z_v1",
    landmarkCount: landmarks.length,
    landmarks,
    landmarksPreview: landmarks.slice(0, IDEAL_LANDMARKS_3D_PREVIEW_COUNT),
    summary: buildIdealLandmarks3DCandidateSummary(landmarks, {
      frontReferenceFrameCount: dataset.frontReferenceFrames.length,
      observationFrameCount: dataset.observationFrames.length,
      excludedFrameCount: dataset.excludedFrameCount,
    }),
    message:
      "Step 2-I-B dataset observations were first converted into direction-balanced stableZ, then each frame used stableZ for provisional 3D before inverse pose rotation and canonical weighted average.",
    debug,
  }
}

function buildPoseAwareCanonicalBalancedFrameZIdealLandmarks3DCandidateResult(
  dataset: PoseAwareInferenceDataset,
  canonical3DResult: IdealLandmarks3DCandidateResult | null,
  stableZResult: IdealLandmarks3DCandidateResult | null,
): IdealLandmarks3DCandidateResult {
  if (dataset.status === "missing_front_reference") {
    return {
      ...createInitialIdealLandmarks3DCandidateResult(),
      status: "insufficient_data",
      generationMethod: "pose_aware_canonical_balanced_frame_z_v1",
      message:
        "frontReference frame is missing, so pose-aware canonical balanced frame-z 3D candidate generation cannot run.",
    }
  }

  if (dataset.observationFrames.length === 0) {
    return {
      ...createInitialIdealLandmarks3DCandidateResult(),
      status: "insufficient_data",
      generationMethod: "pose_aware_canonical_balanced_frame_z_v1",
      message:
        "useForInference observation frames are missing, so pose-aware canonical balanced frame-z 3D candidate generation cannot run.",
    }
  }

  const basePoints = buildPoseAwareBasePoints(dataset.frontReferenceFrames)

  if (!basePoints || basePoints.length !== REQUIRED_LANDMARK_COUNT) {
    return {
      ...createInitialIdealLandmarks3DCandidateResult(),
      status: "insufficient_data",
      generationMethod: "pose_aware_canonical_balanced_frame_z_v1",
      message:
        "frontReference base 478 landmarks are unavailable, so pose-aware canonical balanced frame-z 3D candidate generation cannot run.",
    }
  }

  const { frameWeights, directionBalance } = buildFrameStableZWeightDebug(
    dataset.observationFrames,
  )
  const stableZHintsByLandmark = mergePoseAwareStableZHints(
    dataset.observationFrames,
    basePoints,
    frameWeights,
  )
  const stableZValues = buildStableZValues(dataset, stableZHintsByLandmark)
  const canonicalResult = buildPoseAwareCanonicalBalancedFrameZLandmarksFromFrames(
    dataset.observationFrames,
    basePoints,
    stableZValues,
    frameWeights,
    dataset,
  )

  if (!canonicalResult || canonicalResult.landmarks.length !== REQUIRED_LANDMARK_COUNT) {
    return {
      ...createInitialIdealLandmarks3DCandidateResult(),
      status: "insufficient_data",
      generationMethod: "pose_aware_canonical_balanced_frame_z_v1",
      message:
        "observation frames could not be inverse-rotated into canonical balanced frame-z 3D landmarks.",
    }
  }

  const landmarks = canonicalResult.landmarks
  const debug = buildPoseAwareCanonicalBalancedFrameZCandidateDebug(
    dataset,
    canonicalResult,
    directionBalance,
    frameWeights,
    canonical3DResult,
    stableZResult,
  )

  return {
    status: "generated",
    generationMethod: "pose_aware_canonical_balanced_frame_z_v1",
    landmarkCount: landmarks.length,
    landmarks,
    landmarksPreview: landmarks.slice(0, IDEAL_LANDMARKS_3D_PREVIEW_COUNT),
    summary: buildIdealLandmarks3DCandidateSummary(landmarks, {
      frontReferenceFrameCount: dataset.frontReferenceFrames.length,
      observationFrameCount: dataset.observationFrames.length,
      excludedFrameCount: dataset.excludedFrameCount,
    }),
    message:
      "Step 2-I-B dataset observations were converted to frame-local 3D using each frame's own yaw / pitch zHint, then inverse-rotated and direction-balanced in canonical average.",
    debug,
  }
}

function buildPoseAwareMediaPipeMeshAverageIdealLandmarks3DCandidateResult(
  dataset: PoseAwareInferenceDataset,
  canonical3DResult: IdealLandmarks3DCandidateResult | null,
  stableZResult: IdealLandmarks3DCandidateResult | null,
  balancedFrameZResult: IdealLandmarks3DCandidateResult | null,
): IdealLandmarks3DCandidateResult {
  if (dataset.status === "missing_front_reference") {
    return {
      ...createInitialIdealLandmarks3DCandidateResult(),
      status: "insufficient_data",
      generationMethod: "pose_aware_mediapipe_mesh_average_v1",
      message:
        "frontReference frame is missing, so pose-aware MediaPipe mesh average candidate generation cannot run.",
    }
  }

  if (dataset.observationFrames.length === 0) {
    return {
      ...createInitialIdealLandmarks3DCandidateResult(),
      status: "insufficient_data",
      generationMethod: "pose_aware_mediapipe_mesh_average_v1",
      message:
        "useForInference observation frames are missing, so pose-aware MediaPipe mesh average candidate generation cannot run.",
    }
  }

  const basePoints = buildPoseAwareBasePoints(dataset.frontReferenceFrames)

  if (!basePoints || basePoints.length !== REQUIRED_LANDMARK_COUNT) {
    return {
      ...createInitialIdealLandmarks3DCandidateResult(),
      status: "insufficient_data",
      generationMethod: "pose_aware_mediapipe_mesh_average_v1",
      message:
        "frontReference base 478 landmarks are unavailable, so pose-aware MediaPipe mesh average candidate generation cannot run.",
    }
  }

  const zAvailability = buildMediaPipeZAvailabilityDebug(
    dataset.observationFrames,
  )

  if (!zAvailability.hasLandmarkZ || zAvailability.frameCountWithZ === 0) {
    return {
      ...createInitialIdealLandmarks3DCandidateResult(),
      status: "insufficient_data",
      generationMethod: "pose_aware_mediapipe_mesh_average_v1",
      message:
        "MediaPipe landmark.z is unavailable in detailed scan observation frames, so MediaPipe mesh average candidate generation cannot run.",
      debug: {
        generationMethod: "pose_aware_mediapipe_mesh_average_v1",
        settings: getMediaPipeZSettingsDebug(),
        generationSummary: {
          observationFrameCount: dataset.observationFrames.length,
          frontReferenceFrameCount: dataset.frontReferenceFrames.length,
          nearFrontObservationFrameCount: 0,
          useForInferenceFrontReferenceFrameCount: 0,
        },
        observationFrames: buildPoseAwareObservationFrameDebugSummary(
          dataset.observationFrames,
        ),
        mediaPipeZAvailability: zAvailability,
        mediaPipeZRange: summarizeMediaPipeZRange([], [], [], []),
        directionBalance: buildFrameStableZWeightDebug(dataset.observationFrames)
          .directionBalance,
        canonicalAverageWeights: buildCanonicalAverageWeightDebugSummary([]),
        frameWeights: buildFrameStableZWeightDebugSummary([]),
        nearFrontObservation: buildNearFrontObservationDebugSummary(dataset),
        canonicalization: {
          frameLocal3DBounds: null,
          inversePoseCanonical3DBounds: null,
          canonicalAverage: buildLandmarkSpatialSummary([]),
        },
        comparison: undefined,
        multiCandidateComparison: {
          canonical3D: canonical3DResult
            ? buildCandidateDebugComparisonItem(canonical3DResult)
            : null,
          canonicalStableZ: stableZResult
            ? buildCandidateDebugComparisonItem(stableZResult)
            : null,
          balancedFrameZ: balancedFrameZResult
            ? buildCandidateDebugComparisonItem(balancedFrameZResult)
            : null,
          mediaPipeMeshAverage:
            buildCandidateDebugComparisonItemFromLandmarks(
              "pose_aware_mediapipe_mesh_average_v1",
              [],
            ),
        },
        topView: buildTopViewZAsymmetrySummary([]),
        warnings: ["MediaPipe landmark.z is unavailable."],
      },
    }
  }

  const { frameWeights, directionBalance } = buildFrameStableZWeightDebug(
    dataset.observationFrames,
  )
  const canonicalResult = buildPoseAwareMediaPipeMeshAverageLandmarksFromFrames(
    dataset.observationFrames,
    frameWeights,
    buildLandmarkBoundsSummary(basePoints),
  )

  if (!canonicalResult || canonicalResult.landmarks.length !== REQUIRED_LANDMARK_COUNT) {
    return {
      ...createInitialIdealLandmarks3DCandidateResult(),
      status: "insufficient_data",
      generationMethod: "pose_aware_mediapipe_mesh_average_v1",
      message:
        "observation frames could not be inverse-rotated into MediaPipe mesh average canonical 3D landmarks.",
    }
  }

  const landmarks = canonicalResult.landmarks
  const debug = buildPoseAwareMediaPipeMeshAverageCandidateDebug(
    dataset,
    canonicalResult,
    directionBalance,
    frameWeights,
    canonical3DResult,
    stableZResult,
    balancedFrameZResult,
  )

  return {
    status: "generated",
    generationMethod: "pose_aware_mediapipe_mesh_average_v1",
    landmarkCount: landmarks.length,
    landmarks,
    landmarksPreview: landmarks.slice(0, IDEAL_LANDMARKS_3D_PREVIEW_COUNT),
    summary: buildIdealLandmarks3DCandidateSummary(landmarks, {
      frontReferenceFrameCount: dataset.frontReferenceFrames.length,
      observationFrameCount: dataset.observationFrames.length,
      excludedFrameCount: dataset.excludedFrameCount,
    }),
    message:
      "Step 2-I-B dataset observations used MediaPipe landmark.z for frame-local 3D, then inverse pose rotation and direction-balanced canonical weighted average. dx / sin(yaw) zHint is not used.",
    debug,
  }
}

function buildPoseAwareCandidateResult(
  dataset: PoseAwareInferenceDataset,
  generationMethod: IdealLandmarks3DGenerationMethod,
  oldResult: IdealLandmarks3DCandidateResult | null,
  comparisonResult: IdealLandmarks3DCandidateResult | null = null,
): IdealLandmarks3DCandidateResult {
  if (generationMethod === "pose_aware_mediapipe_mesh_average_v1") {
    return buildPoseAwareMediaPipeMeshAverageIdealLandmarks3DCandidateResult(
      dataset,
      comparisonResult,
      null,
      oldResult,
    )
  }

  if (generationMethod === "pose_aware_canonical_balanced_frame_z_v1") {
    return buildPoseAwareCanonicalBalancedFrameZIdealLandmarks3DCandidateResult(
      dataset,
      comparisonResult,
      oldResult,
    )
  }

  if (generationMethod === "pose_aware_canonical_stable_z_v1") {
    return buildPoseAwareCanonicalStableZIdealLandmarks3DCandidateResult(
      dataset,
      oldResult,
    )
  }

  if (generationMethod === "pose_aware_canonical_3d_v1") {
    return buildPoseAwareCanonical3DIdealLandmarks3DCandidateResult(
      dataset,
      oldResult,
    )
  }

  return buildPoseAwareIdealLandmarks3DCandidateResult(dataset)
}

function toPoseAwareCandidatePreview(): unknown {
  const result = idealLandmarks3DCandidateResult
  const cachedCandidates = Object.fromEntries(
    (
      [
        "pose_aware_weighted_z_v1",
        "pose_aware_canonical_3d_v1",
        "pose_aware_canonical_stable_z_v1",
        "pose_aware_canonical_balanced_frame_z_v1",
        "pose_aware_mediapipe_mesh_average_v1",
      ] as IdealLandmarks3DGenerationMethod[]
    ).map((generationMethod) => {
      const cachedResult = idealLandmarks3DCandidateResults[generationMethod]

      return [
        generationMethod,
        cachedResult
          ? {
              status: cachedResult.status,
              landmarkCount: cachedResult.landmarkCount,
              summary: cachedResult.summary,
              debug: cachedResult.debug ?? null,
            }
          : {
              status: "not_generated",
              landmarkCount: 0,
            },
      ]
    }),
  )

  return {
    status: result.status,
    generationMethod: result.generationMethod,
    selectedGenerationMethod: selectedIdealLandmarks3DGenerationMethod,
    landmarkCount: result.landmarkCount,
    frontReferenceFrameCount: result.summary.frontReferenceFrameCount,
    observationFrameCount: result.summary.observationFrameCount,
    excludedFrameCount: result.summary.excludedFrameCount,
    cachedCandidates,
    debug: result.debug ?? null,
    sameAsCurrentCandidate: true,
    notes: [
      "frontReference frames are used as reference basis. Only useForInference frames contribute to IdealFace shape inference.",
      "pose_aware_canonical_3d_v1 inverse-rotates provisional frame-local 3D points into canonical space before averaging.",
      "pose_aware_canonical_stable_z_v1 builds direction-balanced stableZ before frame-local 3D and canonical averaging.",
      "pose_aware_canonical_balanced_frame_z_v1 uses each frame's own zHint for frame-local 3D, then direction-balances canonical averaging.",
      "pose_aware_mediapipe_mesh_average_v1 uses MediaPipe landmark.z for frame-local 3D and does not use dx / sin(yaw) zHint.",
    ],
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
      <p class="pose-aware-dataset-note">正面基準フレームは基準合わせに使います。IdealFace 形状生成には「IdealFace生成に使う」が ON の observation frame のみを使います。</p>
      <p class="pose-aware-dataset-note">この dataset は Step 2-I-C の入力です。旧 Step 2-C〜2-G v1 の5ポーズ方式は削除済みで、現在は pose_aware_weighted_z_v1 を使用します。</p>
    </div>
  `
}

function renderGenerationMethodOption(
  generationMethod: IdealLandmarks3DGenerationMethod,
): string {
  return `
    <option
      value="${generationMethod}"
      ${selectedIdealLandmarks3DGenerationMethod === generationMethod ? "selected" : ""}
    >
      ${generationMethod}
    </option>
  `
}

function renderPoseAwareCandidateMethodControls(): string {
  return `
    <div class="pose-aware-method-controls">
      <label>
        generationMethod
        <select data-pose-aware-generation-method-select="true">
          ${renderGenerationMethodOption("pose_aware_weighted_z_v1")}
          ${renderGenerationMethodOption("pose_aware_canonical_3d_v1")}
          ${renderGenerationMethodOption("pose_aware_canonical_stable_z_v1")}
          ${renderGenerationMethodOption("pose_aware_canonical_balanced_frame_z_v1")}
          ${renderGenerationMethodOption("pose_aware_mediapipe_mesh_average_v1")}
        </select>
      </label>
      <label>
        MediaPipe z normalize
        <select data-mediapipe-z-normalize-mode-select="true">
          ${renderMediaPipeZNormalizeModeOption("raw")}
          ${renderMediaPipeZNormalizeModeOption("centered")}
          ${renderMediaPipeZNormalizeModeOption("faceWidthScaled")}
          ${renderMediaPipeZNormalizeModeOption("frontReferenceMatched")}
        </select>
      </label>
      <label>
        MediaPipe z scale
        <input
          type="number"
          min="0"
          step="0.05"
          value="${mediaPipeZScale}"
          data-mediapipe-z-scale-input="true"
        />
      </label>
      <label>
        <input
          type="checkbox"
          data-mediapipe-z-invert-sign-checkbox="true"
          ${mediaPipeZInvertSign ? "checked" : ""}
        />
        MediaPipe z invert
      </label>
    </div>
  `
}

function renderMediaPipeZNormalizeModeOption(
  mode: MediaPipeZNormalizeMode,
): string {
  return `
    <option
      value="${mode}"
      ${mediaPipeZNormalizeMode === mode ? "selected" : ""}
    >
      ${mode}
    </option>
  `
}

function renderPoseAwareCachedCandidateSwitches(): string {
  const methods: IdealLandmarks3DGenerationMethod[] = [
    "pose_aware_weighted_z_v1",
    "pose_aware_canonical_3d_v1",
    "pose_aware_canonical_stable_z_v1",
    "pose_aware_canonical_balanced_frame_z_v1",
    "pose_aware_mediapipe_mesh_average_v1",
  ]

  return `
    <div class="pose-aware-method-switches">
      ${methods
        .map((method) => {
          const result = idealLandmarks3DCandidateResults[method]
          const active = idealLandmarks3DCandidateResult.generationMethod === method

          return `
            <button
              class="candidate-label-button${active ? " candidate-label-button-active" : ""}"
              type="button"
              data-use-pose-aware-candidate-method="${method}"
              ${result?.status === "generated" ? "" : "disabled"}
            >
              ${method}
            </button>
          `
        })
        .join("")}
    </div>
  `
}

function renderPoseAwareIdealLandmarks3DCandidatePanel(
  dataset: PoseAwareInferenceDataset,
): string {
  const result = idealLandmarks3DCandidateResult
  const isPoseAwareCandidate = result.generationMethod !== null
  const disabled =
    dataset.status === "missing_front_reference" ||
    dataset.observationFrames.length === 0
  const disabledMessage =
    dataset.status === "missing_front_reference"
      ? "手動選択された正面基準がないため、pose-aware 3D候補を生成できません。"
      : "IdealFace 形状生成に使う observation frame がないため、pose-aware 3D候補を生成できません。「IdealFace生成に使う」を ON にしてください。"

  return `
    <div class="pose-aware-candidate-summary">
      <div class="pose-aware-candidate-heading">
        <div>
          <h4>Step 2-I-C: pose-aware 3D候補</h4>
          <p>Step 2-I-B dataset を使い、「IdealFace生成に使う」が ON の observation だけから 478点候補を生成します。正面基準 frame は基準合わせに使います。</p>
        </div>
        ${renderPoseAwareCandidateMethodControls()}
        <button
          class="candidate-generate-button"
          type="button"
          data-generate-pose-aware-ideal-landmarks-3d-candidate="true"
          ${disabled ? "disabled" : ""}
        >
          pose-aware 3D候補を生成
        </button>
      </div>
      ${renderPoseAwareCachedCandidateSwitches()}
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
      ${renderPoseAwareCanonicalDebugBlock(result.debug)}
    </div>
    <p class="candidate-result-note">${escapeHtml(result.message ?? "")}</p>
    ${renderIdealLandmarks3DCandidatePreview(result.landmarksPreview)}
  `
}

function renderPoseAwareCanonicalDebugBlock(
  debug: IdealLandmarks3DCandidateDebug | undefined,
): string {
  if (!debug) {
    return ""
  }

  return `
    <h5>canonical 3D prototype debug</h5>
    <dl class="pose-aware-summary-list">
      <div>
        <dt>generation method</dt>
        <dd>${debug.generationMethod}</dd>
      </div>
      <div>
        <dt>observation frames</dt>
        <dd>${debug.observationFrames.totalObservationFrameCount}</dd>
      </div>
      <div>
        <dt>yaw negative / positive / near front</dt>
        <dd>${debug.observationFrames.negativeYawCount} / ${debug.observationFrames.positiveYawCount} / ${debug.observationFrames.nearFrontCount}</dd>
      </div>
    </dl>
    ${renderPoseAwareStableZDebugBlock(debug)}
    ${renderPoseAwareBalancedFrameZDebugBlock(debug)}
    ${renderPoseAwareMediaPipeMeshAverageDebugBlock(debug)}
    <div class="pose-aware-coverage">
      <strong>yaw bins</strong>
      <ul>
        ${debug.observationFrames.yawBins
          .map(
            (bin) =>
              `<li>${bin.id}: count ${bin.count} / weight ${formatNumber(bin.weightTotal)}</li>`,
          )
          .join("")}
      </ul>
    </div>
    <h5>frame local 3D bounds</h5>
    <dl class="pose-aware-summary-list">
      ${renderBoundsSummaryRows(debug.canonicalization.frameLocal3DBounds)}
    </dl>
    <h5>inverse-pose canonical 3D bounds</h5>
    <dl class="pose-aware-summary-list">
      ${renderBoundsSummaryRows(debug.canonicalization.inversePoseCanonical3DBounds)}
    </dl>
    <h5>canonical average summary</h5>
    <dl class="pose-aware-summary-list">
      ${renderSpatialSummaryRows(debug.canonicalization.canonicalAverage)}
    </dl>
    ${renderPoseAwareCandidateComparisonDebug(debug.comparison)}
    ${
      debug.generationMethod === "pose_aware_canonical_3d_v1"
        ? `
          <h5>partial candidates</h5>
          ${renderPoseAwarePartialCandidateDebug(
            "rightYawOnly",
            debug.partialCandidates.rightYawOnly,
          )}
          ${renderPoseAwarePartialCandidateDebug(
            "leftYawOnly",
            debug.partialCandidates.leftYawOnly,
          )}
          ${renderPoseAwarePartialCandidateDebug(
            "nearFrontOnly",
            debug.partialCandidates.nearFrontOnly,
          )}
        `
        : ""
    }
    <div class="pose-aware-coverage">
      <strong>canonical warnings</strong>
      ${
        debug.warnings.length === 0
          ? `<p class="pose-aware-ready-text">none</p>`
          : `<ul class="pose-aware-warning-list">
              ${debug.warnings
                .map((warning) => `<li>${escapeHtml(warning)}</li>`)
                .join("")}
            </ul>`
      }
    </div>
  `
}

function renderPoseAwareMediaPipeMeshAverageDebugBlock(
  debug: IdealLandmarks3DCandidateDebug,
): string {
  if (debug.generationMethod !== "pose_aware_mediapipe_mesh_average_v1") {
    return ""
  }

  return `
    <h5>MediaPipe mesh average summary</h5>
    <dl class="pose-aware-summary-list">
      <div>
        <dt>observation / frontReference</dt>
        <dd>${debug.generationSummary.observationFrameCount} / ${debug.generationSummary.frontReferenceFrameCount}</dd>
      </div>
      <div>
        <dt>nearFront observation</dt>
        <dd>${debug.generationSummary.nearFrontObservationFrameCount}</dd>
      </div>
      <div>
        <dt>useForInference frontReference</dt>
        <dd>${debug.generationSummary.useForInferenceFrontReferenceFrameCount}</dd>
      </div>
      <div>
        <dt>z source / mode</dt>
        <dd>${debug.settings.mediaPipeZSource} / ${debug.settings.mediaPipeZNormalizeMode}</dd>
      </div>
      <div>
        <dt>z scale / invert / centering</dt>
        <dd>${formatNumber(debug.settings.mediaPipeZScale)} / ${debug.settings.mediaPipeZInvertSign ? "true" : "false"} / ${debug.settings.mediaPipeZCenteringMode}</dd>
      </div>
    </dl>
    <h5>MediaPipe z availability</h5>
    <dl class="pose-aware-summary-list">
      <div>
        <dt>has landmark z</dt>
        <dd>${debug.mediaPipeZAvailability.hasLandmarkZ ? "true" : "false"}</dd>
      </div>
      <div>
        <dt>z finite / missing</dt>
        <dd>${debug.mediaPipeZAvailability.landmarkZFiniteCount} / ${debug.mediaPipeZAvailability.landmarkZMissingCount}</dd>
      </div>
      <div>
        <dt>frames with / without z</dt>
        <dd>${debug.mediaPipeZAvailability.frameCountWithZ} / ${debug.mediaPipeZAvailability.frameCountWithoutZ}</dd>
      </div>
      <div>
        <dt>has transform matrix / count</dt>
        <dd>${debug.mediaPipeZAvailability.hasTransformMatrix ? "true" : "false"} / ${debug.mediaPipeZAvailability.transformMatrixAvailableCount}</dd>
      </div>
    </dl>
    <h5>MediaPipe z range</h5>
    <dl class="pose-aware-summary-list">
      <div>
        <dt>raw z min / max / avg / range</dt>
        <dd>${formatNullableDebugNumber(debug.mediaPipeZRange.rawMediaPipeZMin)} / ${formatNullableDebugNumber(debug.mediaPipeZRange.rawMediaPipeZMax)} / ${formatNullableDebugNumber(debug.mediaPipeZRange.rawMediaPipeZAverage)} / ${formatNullableDebugNumber(debug.mediaPipeZRange.rawMediaPipeZRange)}</dd>
      </div>
      <div>
        <dt>normalized z min / max / avg / range</dt>
        <dd>${formatNullableDebugNumber(debug.mediaPipeZRange.normalizedMediaPipeZMin)} / ${formatNullableDebugNumber(debug.mediaPipeZRange.normalizedMediaPipeZMax)} / ${formatNullableDebugNumber(debug.mediaPipeZRange.normalizedMediaPipeZAverage)} / ${formatNullableDebugNumber(debug.mediaPipeZRange.normalizedMediaPipeZRange)}</dd>
      </div>
      <div>
        <dt>z range before / after scale</dt>
        <dd>${formatNullableDebugNumber(debug.mediaPipeZRange.mediaPipeZRangeBeforeScale)} / ${formatNullableDebugNumber(debug.mediaPipeZRange.mediaPipeZRangeAfterScale)}</dd>
      </div>
      <div>
        <dt>final candidate z min / max / range</dt>
        <dd>${formatNullableDebugNumber(debug.mediaPipeZRange.finalCandidateZMin)} / ${formatNullableDebugNumber(debug.mediaPipeZRange.finalCandidateZMax)} / ${formatNullableDebugNumber(debug.mediaPipeZRange.finalCandidateZRange)}</dd>
      </div>
    </dl>
    <h5>canonical average weights</h5>
    <dl class="pose-aware-summary-list">
      <div>
        <dt>yaw canonical weight + / -</dt>
        <dd>${formatNumber(debug.canonicalAverageWeights.yawPositiveCanonicalAverageWeightTotal)} / ${formatNumber(debug.canonicalAverageWeights.yawNegativeCanonicalAverageWeightTotal)}</dd>
      </div>
      <div>
        <dt>pitch canonical weight + / -</dt>
        <dd>${formatNumber(debug.canonicalAverageWeights.pitchPositiveCanonicalAverageWeightTotal)} / ${formatNumber(debug.canonicalAverageWeights.pitchNegativeCanonicalAverageWeightTotal)}</dd>
      </div>
      <div>
        <dt>yaw canonical frame count + / -</dt>
        <dd>${debug.canonicalAverageWeights.yawPositiveCanonicalAverageFrameCount} / ${debug.canonicalAverageWeights.yawNegativeCanonicalAverageFrameCount}</dd>
      </div>
      <div>
        <dt>canonical balance avg / min / max</dt>
        <dd>${formatNumber(debug.canonicalAverageWeights.averageCanonicalAverageDirectionBalanceWeight)} / ${formatNumber(debug.canonicalAverageWeights.minCanonicalAverageDirectionBalanceWeight)} / ${formatNumber(debug.canonicalAverageWeights.maxCanonicalAverageDirectionBalanceWeight)}</dd>
      </div>
    </dl>
    <h5>four-method comparison</h5>
    ${renderBalancedFrameZCandidateComparisonItem(
      "pose_aware_canonical_3d_v1",
      debug.multiCandidateComparison.canonical3D,
    )}
    ${renderBalancedFrameZCandidateComparisonItem(
      "pose_aware_canonical_stable_z_v1",
      debug.multiCandidateComparison.canonicalStableZ,
    )}
    ${renderBalancedFrameZCandidateComparisonItem(
      "pose_aware_canonical_balanced_frame_z_v1",
      debug.multiCandidateComparison.balancedFrameZ,
    )}
    ${renderBalancedFrameZCandidateComparisonItem(
      "pose_aware_mediapipe_mesh_average_v1",
      debug.multiCandidateComparison.mediaPipeMeshAverage,
    )}
    <h5>frame weight debug</h5>
    ${renderFrameStableZWeightList("top weighted frames", debug.frameWeights.topWeightedFrames)}
    ${renderFrameStableZWeightList("lowest weighted frames", debug.frameWeights.lowestWeightedFrames)}
    <h5>top view debug</h5>
    <dl class="pose-aware-summary-list">
      ${renderTopViewZAsymmetryRows(debug.topView)}
    </dl>
  `
}

function renderPoseAwareStableZDebugBlock(
  debug: IdealLandmarks3DCandidateDebug,
): string {
  if (debug.generationMethod !== "pose_aware_canonical_stable_z_v1") {
    return ""
  }

  return `
    <h5>stableZ summary</h5>
    <dl class="pose-aware-summary-list">
      <div>
        <dt>stableZ min / max / average</dt>
        <dd>${formatNumber(debug.stableZ.zMin)} / ${formatNumber(debug.stableZ.zMax)} / ${formatNumber(debug.stableZ.zAverage)}</dd>
      </div>
      <div>
        <dt>stableZ range</dt>
        <dd>${formatNumber(debug.stableZ.zRange)}</dd>
      </div>
      <div>
        <dt>confidence average / min / max</dt>
        <dd>${formatNumber(debug.stableZ.confidenceAverage)} / ${formatNumber(debug.stableZ.confidenceMin)} / ${formatNumber(debug.stableZ.confidenceMax)}</dd>
      </div>
      <div>
        <dt>total weight average / min / max</dt>
        <dd>${formatNumber(debug.stableZ.totalWeightAverage)} / ${formatNumber(debug.stableZ.totalWeightMin)} / ${formatNumber(debug.stableZ.totalWeightMax)}</dd>
      </div>
      <div>
        <dt>fallback count</dt>
        <dd>${debug.stableZ.fallbackCount}</dd>
      </div>
      <div>
        <dt>zHint candidate count min / max / avg</dt>
        <dd>${debug.stableZ.zHintCandidateCountMin} / ${debug.stableZ.zHintCandidateCountMax} / ${formatNumber(debug.stableZ.zHintCandidateCountAverage)}</dd>
      </div>
    </dl>
    <h5>direction balance summary</h5>
    <dl class="pose-aware-summary-list">
      <div>
        <dt>yaw signal + / - / ratio</dt>
        <dd>${formatNumber(debug.directionBalance.totalYawPositiveSignal)} / ${formatNumber(debug.directionBalance.totalYawNegativeSignal)} / ${formatNullableDebugNumber(debug.directionBalance.yawPositiveNegativeSignalRatio)}</dd>
      </div>
      <div>
        <dt>pitch signal + / - / ratio</dt>
        <dd>${formatNumber(debug.directionBalance.totalPitchPositiveSignal)} / ${formatNumber(debug.directionBalance.totalPitchNegativeSignal)} / ${formatNullableDebugNumber(debug.directionBalance.pitchPositiveNegativeSignalRatio)}</dd>
      </div>
      <div>
        <dt>directionBalanceWeight avg / min / max</dt>
        <dd>${formatNumber(debug.directionBalance.averageDirectionBalanceWeight)} / ${formatNumber(debug.directionBalance.minDirectionBalanceWeight)} / ${formatNumber(debug.directionBalance.maxDirectionBalanceWeight)}</dd>
      </div>
      <div>
        <dt>clamped frames</dt>
        <dd>${debug.directionBalance.clampedDirectionBalanceWeightCount}</dd>
      </div>
    </dl>
    <h5>stableZ actual zHint weights</h5>
    <dl class="pose-aware-summary-list">
      <div>
        <dt>yaw zHint weight + / -</dt>
        <dd>${formatNumber(debug.stableZWeights.yawPositiveZHintWeightTotal)} / ${formatNumber(debug.stableZWeights.yawNegativeZHintWeightTotal)}</dd>
      </div>
      <div>
        <dt>pitch zHint weight + / -</dt>
        <dd>${formatNumber(debug.stableZWeights.pitchPositiveZHintWeightTotal)} / ${formatNumber(debug.stableZWeights.pitchNegativeZHintWeightTotal)}</dd>
      </div>
      ${renderZHintSourceWeightSummaryRows("yaw-derived zHint", debug.stableZWeights.yawDerived)}
      ${renderZHintSourceWeightSummaryRows("pitch-derived zHint", debug.stableZWeights.pitchDerived)}
    </dl>
    <h5>canonical average weights</h5>
    <dl class="pose-aware-summary-list">
      <div>
        <dt>yaw canonical weight + / -</dt>
        <dd>${formatNumber(debug.canonicalAverageWeights.yawPositiveCanonicalAverageWeightTotal)} / ${formatNumber(debug.canonicalAverageWeights.yawNegativeCanonicalAverageWeightTotal)}</dd>
      </div>
      <div>
        <dt>pitch canonical weight + / -</dt>
        <dd>${formatNumber(debug.canonicalAverageWeights.pitchPositiveCanonicalAverageWeightTotal)} / ${formatNumber(debug.canonicalAverageWeights.pitchNegativeCanonicalAverageWeightTotal)}</dd>
      </div>
      <div>
        <dt>yaw canonical frame count + / -</dt>
        <dd>${debug.canonicalAverageWeights.yawPositiveCanonicalAverageFrameCount} / ${debug.canonicalAverageWeights.yawNegativeCanonicalAverageFrameCount}</dd>
      </div>
      <div>
        <dt>canonical balance avg / min / max</dt>
        <dd>${formatNumber(debug.canonicalAverageWeights.averageCanonicalAverageDirectionBalanceWeight)} / ${formatNumber(debug.canonicalAverageWeights.minCanonicalAverageDirectionBalanceWeight)} / ${formatNumber(debug.canonicalAverageWeights.maxCanonicalAverageDirectionBalanceWeight)}</dd>
      </div>
      <div>
        <dt>canonical balance clamped frames</dt>
        <dd>${debug.canonicalAverageWeights.clampedCanonicalAverageDirectionBalanceWeightCount}</dd>
      </div>
    </dl>
    <h5>near-front observation</h5>
    <dl class="pose-aware-summary-list">
      <div>
        <dt>nearFront observation frames</dt>
        <dd>${debug.nearFrontObservation.nearFrontObservationFrameCount}</dd>
      </div>
      <div>
        <dt>frontReference frames</dt>
        <dd>${debug.nearFrontObservation.frontReferenceFrameCount}</dd>
      </div>
      <div>
        <dt>useForInference frontReference frames</dt>
        <dd>${debug.nearFrontObservation.useForInferenceFrontReferenceFrameCount}</dd>
      </div>
    </dl>
    <h5>frame weight debug</h5>
    <dl class="pose-aware-summary-list">
      <div>
        <dt>yaw + / yaw - avg weight</dt>
        <dd>${formatNumber(debug.frameWeights.yawPositiveFramesAverageWeight)} / ${formatNumber(debug.frameWeights.yawNegativeFramesAverageWeight)}</dd>
      </div>
      <div>
        <dt>pitch + / pitch - avg weight</dt>
        <dd>${formatNumber(debug.frameWeights.pitchPositiveFramesAverageWeight)} / ${formatNumber(debug.frameWeights.pitchNegativeFramesAverageWeight)}</dd>
      </div>
    </dl>
    ${renderFrameStableZWeightList("top weighted frames", debug.frameWeights.topWeightedFrames)}
    ${renderFrameStableZWeightList("lowest weighted frames", debug.frameWeights.lowestWeightedFrames)}
    <h5>top view debug</h5>
    <dl class="pose-aware-summary-list">
      ${renderTopViewZAsymmetryRows(debug.topView)}
    </dl>
  `
}

function renderPoseAwareBalancedFrameZDebugBlock(
  debug: IdealLandmarks3DCandidateDebug,
): string {
  if (debug.generationMethod !== "pose_aware_canonical_balanced_frame_z_v1") {
    return ""
  }

  return `
    <h5>balanced frame-z generation summary</h5>
    <dl class="pose-aware-summary-list">
      <div>
        <dt>observation / frontReference</dt>
        <dd>${debug.generationSummary.observationFrameCount} / ${debug.generationSummary.frontReferenceFrameCount}</dd>
      </div>
      <div>
        <dt>nearFront observation</dt>
        <dd>${debug.generationSummary.nearFrontObservationFrameCount}</dd>
      </div>
      <div>
        <dt>useForInference frontReference</dt>
        <dd>${debug.generationSummary.useForInferenceFrontReferenceFrameCount}</dd>
      </div>
    </dl>
    <h5>frameZHint summary</h5>
    <dl class="pose-aware-summary-list">
      <div>
        <dt>frameZHint min / max / average</dt>
        <dd>${formatNumber(debug.frameZHint.zMin)} / ${formatNumber(debug.frameZHint.zMax)} / ${formatNumber(debug.frameZHint.zAverage)}</dd>
      </div>
      <div>
        <dt>frameZHint range</dt>
        <dd>${formatNumber(debug.frameZHint.zRange)}</dd>
      </div>
      <div>
        <dt>fallback / clamp</dt>
        <dd>${debug.frameZHint.fallbackCount} / ${debug.frameZHint.clampCount}</dd>
      </div>
      <div>
        <dt>stableZ fallback used</dt>
        <dd>${debug.frameZHint.stableZFallbackUsed ? "true" : "false"}</dd>
      </div>
      ${renderZHintSourceWeightSummaryRows("combined frameZHint", debug.frameZHint.combined)}
      ${renderZHintSourceWeightSummaryRows("yaw-derived zHint", debug.frameZHint.yawDerived)}
      ${renderZHintSourceWeightSummaryRows("pitch-derived zHint", debug.frameZHint.pitchDerived)}
    </dl>
    <h5>canonical average weights</h5>
    <dl class="pose-aware-summary-list">
      <div>
        <dt>yaw canonical weight + / -</dt>
        <dd>${formatNumber(debug.canonicalAverageWeights.yawPositiveCanonicalAverageWeightTotal)} / ${formatNumber(debug.canonicalAverageWeights.yawNegativeCanonicalAverageWeightTotal)}</dd>
      </div>
      <div>
        <dt>pitch canonical weight + / -</dt>
        <dd>${formatNumber(debug.canonicalAverageWeights.pitchPositiveCanonicalAverageWeightTotal)} / ${formatNumber(debug.canonicalAverageWeights.pitchNegativeCanonicalAverageWeightTotal)}</dd>
      </div>
      <div>
        <dt>yaw canonical frame count + / -</dt>
        <dd>${debug.canonicalAverageWeights.yawPositiveCanonicalAverageFrameCount} / ${debug.canonicalAverageWeights.yawNegativeCanonicalAverageFrameCount}</dd>
      </div>
      <div>
        <dt>canonical balance avg / min / max</dt>
        <dd>${formatNumber(debug.canonicalAverageWeights.averageCanonicalAverageDirectionBalanceWeight)} / ${formatNumber(debug.canonicalAverageWeights.minCanonicalAverageDirectionBalanceWeight)} / ${formatNumber(debug.canonicalAverageWeights.maxCanonicalAverageDirectionBalanceWeight)}</dd>
      </div>
      <div>
        <dt>canonical balance clamped frames</dt>
        <dd>${debug.canonicalAverageWeights.clampedCanonicalAverageDirectionBalanceWeightCount}</dd>
      </div>
    </dl>
    <h5>near-front observation</h5>
    <dl class="pose-aware-summary-list">
      <div>
        <dt>nearFront / frontReference</dt>
        <dd>${debug.nearFrontObservation.nearFrontObservationFrameCount} / ${debug.nearFrontObservation.frontReferenceFrameCount}</dd>
      </div>
      <div>
        <dt>useForInference frontReference</dt>
        <dd>${debug.nearFrontObservation.useForInferenceFrontReferenceFrameCount}</dd>
      </div>
    </dl>
    <h5>three-method comparison</h5>
    ${renderBalancedFrameZCandidateComparisonItem(
      "pose_aware_canonical_3d_v1",
      debug.multiCandidateComparison.canonical3D,
    )}
    ${renderBalancedFrameZCandidateComparisonItem(
      "pose_aware_canonical_stable_z_v1",
      debug.multiCandidateComparison.canonicalStableZ,
    )}
    ${renderBalancedFrameZCandidateComparisonItem(
      "pose_aware_canonical_balanced_frame_z_v1",
      debug.multiCandidateComparison.balancedFrameZ,
    )}
    <h5>frame weight debug</h5>
    <dl class="pose-aware-summary-list">
      <div>
        <dt>yaw + / yaw - avg weight</dt>
        <dd>${formatNumber(debug.frameWeights.yawPositiveFramesAverageWeight)} / ${formatNumber(debug.frameWeights.yawNegativeFramesAverageWeight)}</dd>
      </div>
      <div>
        <dt>pitch + / pitch - avg weight</dt>
        <dd>${formatNumber(debug.frameWeights.pitchPositiveFramesAverageWeight)} / ${formatNumber(debug.frameWeights.pitchNegativeFramesAverageWeight)}</dd>
      </div>
    </dl>
    ${renderFrameStableZWeightList("top weighted frames", debug.frameWeights.topWeightedFrames)}
    ${renderFrameStableZWeightList("lowest weighted frames", debug.frameWeights.lowestWeightedFrames)}
    <h5>top view debug</h5>
    <dl class="pose-aware-summary-list">
      ${renderTopViewZAsymmetryRows(debug.topView)}
    </dl>
  `
}

function renderBalancedFrameZCandidateComparisonItem(
  label: string,
  item: CandidateDebugComparisonItem | null,
): string {
  if (!item) {
    return `
      <h6>${label}</h6>
      <p class="pose-aware-ready-text">not generated</p>
    `
  }

  return `
    <h6>${label}</h6>
    <dl class="pose-aware-summary-list">
      <div>
        <dt>z min / max / range</dt>
        <dd>${formatNumber(item.zMin)} / ${formatNumber(item.zMax)} / ${formatNumber(item.zRange)}</dd>
      </div>
      <div>
        <dt>bounds center x / z</dt>
        <dd>${formatNullableDebugNumber(item.boundsCenterX)} / ${formatNullableDebugNumber(item.boundsCenterZ)}</dd>
      </div>
      <div>
        <dt>nose x / z</dt>
        <dd>${formatNullableDebugNumber(item.noseTipX)} / ${formatNullableDebugNumber(item.noseTipZ)}</dd>
      </div>
      <div>
        <dt>mouth center x / z</dt>
        <dd>${formatNullableDebugNumber(item.mouthCenterX)} / ${formatNullableDebugNumber(item.mouthCenterZ)}</dd>
      </div>
      <div>
        <dt>chin x / z</dt>
        <dd>${formatNullableDebugNumber(item.chinX)} / ${formatNullableDebugNumber(item.chinZ)}</dd>
      </div>
      <div>
        <dt>left / right cheek z</dt>
        <dd>${formatNullableDebugNumber(item.leftCheekZ)} / ${formatNullableDebugNumber(item.rightCheekZ)}</dd>
      </div>
      <div>
        <dt>left / right contour z</dt>
        <dd>${formatNullableDebugNumber(item.leftContourZ)} / ${formatNullableDebugNumber(item.rightContourZ)}</dd>
      </div>
      <div>
        <dt>left-right avg / range delta</dt>
        <dd>${formatNullableDebugNumber(item.leftRightZAverageDelta)} / ${formatNullableDebugNumber(item.leftRightZRangeDelta)}</dd>
      </div>
      <div>
        <dt>top view asymmetry</dt>
        <dd>${formatNullableDebugNumber(item.topViewAsymmetryScore)}</dd>
      </div>
    </dl>
  `
}

function renderZHintSourceWeightSummaryRows(
  label: string,
  summary: ZHintSourceWeightSummary,
): string {
  return `
    <div>
      <dt>${label} count / weight</dt>
      <dd>${summary.count} / ${formatNumber(summary.weightTotal)}</dd>
    </div>
    <div>
      <dt>${label} z avg / range</dt>
      <dd>${formatNullableDebugNumber(summary.zAverage)} / ${formatNullableDebugNumber(summary.zRange)}</dd>
    </div>
  `
}

function renderFrameStableZWeightList(
  label: string,
  frames: FrameStableZWeightDebug[],
): string {
  return `
    <div class="pose-aware-coverage">
      <strong>${label}</strong>
      ${
        frames.length === 0
          ? `<p class="pose-aware-ready-text">none</p>`
          : `<ul>
              ${frames
                .map(
                  (frame) =>
                    `<li>${escapeHtml(frame.frameId)}: z debug ${formatNumber(frame.debugFinalZHintWeight)} / yaw z ${formatNumber(frame.actualYawZHintWeight)} / pitch z ${formatNumber(frame.actualPitchZHintWeight)} / canonical ${formatNumber(frame.finalCanonicalAverageWeight)} / balance ${formatNumber(frame.canonicalAverageDirectionBalanceWeight)} / yaw ${formatNumber(frame.yaw)} / pitch ${formatNumber(frame.pitch)}</li>`,
                )
                .join("")}
            </ul>`
      }
    </div>
  `
}

function renderTopViewZAsymmetryRows(
  summary: TopViewZAsymmetrySummary,
): string {
  return `
    <div>
      <dt>basis</dt>
      <dd>${summary.basis}</dd>
    </div>
    <div>
      <dt>left / right point count</dt>
      <dd>${summary.leftSidePointCount} / ${summary.rightSidePointCount}</dd>
    </div>
    <div>
      <dt>left / right z average</dt>
      <dd>${formatNullableDebugNumber(summary.leftSideZAverage)} / ${formatNullableDebugNumber(summary.rightSideZAverage)}</dd>
    </div>
    <div>
      <dt>left-right z average delta</dt>
      <dd>${formatNullableDebugNumber(summary.leftRightZAverageDelta)}</dd>
    </div>
    <div>
      <dt>left / right z range</dt>
      <dd>${formatNullableDebugNumber(summary.leftSideZRange)} / ${formatNullableDebugNumber(summary.rightSideZRange)}</dd>
    </div>
    <div>
      <dt>left-right z range delta</dt>
      <dd>${formatNullableDebugNumber(summary.leftRightZRangeDelta)}</dd>
    </div>
    <div>
      <dt>top view asymmetry score</dt>
      <dd>${formatNullableDebugNumber(summary.topViewAsymmetryScore)}</dd>
    </div>
    <div>
      <dt>basis warning</dt>
      <dd>${escapeHtml(summary.warning)}</dd>
    </div>
  `
}

function renderPoseAwareCandidateComparisonDebug(
  comparison: PoseAwareCandidateComparisonDebug | undefined,
): string {
  if (!comparison) {
    return ""
  }

  return `
    <h5>old vs new comparison</h5>
    <dl class="pose-aware-summary-list">
      <div>
        <dt>old / new method</dt>
        <dd>${comparison.oldGenerationMethod} / ${comparison.newGenerationMethod}</dd>
      </div>
      <div>
        <dt>bounds center offset</dt>
        <dd>${formatPoint3D(comparison.boundsCenterOffset)}</dd>
      </div>
      <div>
        <dt>nose offset delta</dt>
        <dd>${formatNullableDebugNumber(comparison.noseOffsetDelta)}</dd>
      </div>
      <div>
        <dt>z range delta</dt>
        <dd>${formatNullableDebugNumber(comparison.zRangeDelta)}</dd>
      </div>
      <div>
        <dt>top view asymmetry delta</dt>
        <dd>${formatNullableDebugNumber(comparison.topViewAsymmetryDelta)}</dd>
      </div>
    </dl>
    <h5>old candidate bounds</h5>
    <dl class="pose-aware-summary-list">
      ${renderSpatialSummaryRows(comparison.oldCandidate.spatial)}
    </dl>
    <h5>new candidate bounds</h5>
    <dl class="pose-aware-summary-list">
      ${renderSpatialSummaryRows(comparison.newCandidate.spatial)}
    </dl>
    <h5>old representative</h5>
    <dl class="pose-aware-summary-list">
      ${renderRepresentativeSummaryRows(comparison.oldCandidate.representative)}
    </dl>
    <h5>new representative</h5>
    <dl class="pose-aware-summary-list">
      ${renderRepresentativeSummaryRows(comparison.newCandidate.representative)}
    </dl>
    <h5>old top view debug</h5>
    <dl class="pose-aware-summary-list">
      ${renderTopViewZAsymmetryRows(comparison.oldCandidate.topView)}
    </dl>
    <h5>new top view debug</h5>
    <dl class="pose-aware-summary-list">
      ${renderTopViewZAsymmetryRows(comparison.newCandidate.topView)}
    </dl>
  `
}

function renderPoseAwarePartialCandidateDebug(
  label: string,
  summary: PoseAwarePartialCandidateSummary,
): string {
  return `
    <h6>${label}</h6>
    <dl class="pose-aware-summary-list">
      <div>
        <dt>frames / weight</dt>
        <dd>${summary.frameCount} / ${formatNumber(summary.weightTotal)}</dd>
      </div>
      ${renderRepresentativeSummaryRows(summary.representative)}
      ${renderSpatialSummaryRows(summary.spatial)}
    </dl>
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
          <dt>手動選択された正面基準</dt>
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
  const adoptedText = usage.adaptiveBucketAdoptions.join(", ") || "なし"
  const skippedText = usage.adaptiveSkippedBuckets.join(", ") || "なし"
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
              <dt>adaptive adopted</dt>
              <dd>${escapeHtml(adoptedText)}</dd>
            </div>
            <div>
              <dt>adaptive skipped</dt>
              <dd>${escapeHtml(skippedText)}</dd>
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
  const adoptedText = usage.adaptiveBucketAdoptions.join(", ") || "なし"
  const skippedText = usage.adaptiveSkippedBuckets.join(", ") || "なし"
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
            IdealFace生成に使う
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
          <span>adaptive adopted: ${escapeHtml(adoptedText)}</span>
          <span>adaptive skipped: ${escapeHtml(skippedText)}</span>
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

function renderUsageBucketSummaryPanel(): string {
  const frontReference = getFrontReferenceSummary()
  const buckets = getUsageBucketSummary()
  const scanSummary = getDetailedScanSummary()
  const warnings = [
    ...buildFrontReferenceWarnings(frontReference),
    ...buildUsageBucketWarnings(buckets),
  ]
  const recommendedLabel = `${frontReference.recommendedMin}〜${frontReference.recommendedMax}`
  const modeLabel = scanSummary.adaptiveSamplingEnabled ? "adaptive" : "preset"

  return `
    <div class="usage-bucket-summary">
      <strong>usage-aware sampling summary</strong>
      <dl class="usage-bucket-status-list">
        <div>
          <dt>mode</dt>
          <dd>${modeLabel}</dd>
        </div>
        <div>
          <dt>scanned</dt>
          <dd>${scanSummary.scannedFrameCount} / ${scanSummary.effectiveMaxScanFrames}</dd>
        </div>
        <div>
          <dt>adaptive sampling</dt>
          <dd>${scanSummary.adaptiveSamplingEnabled ? "enabled" : "disabled"}</dd>
        </div>
        <div>
          <dt>preset max</dt>
          <dd>${scanSummary.presetMaxScanFrames}</dd>
        </div>
        <div>
          <dt>adaptive max</dt>
          <dd>${scanSummary.adaptiveMaxScanFrames}</dd>
        </div>
        <div>
          <dt>effective max</dt>
          <dd>${scanSummary.effectiveMaxScanFrames}</dd>
        </div>
        <div>
          <dt>early stopped</dt>
          <dd>${scanSummary.earlyStopped ? "yes" : "no"}</dd>
        </div>
        <div>
          <dt>reason</dt>
          <dd>${formatEarlyStopReason(scanSummary.earlyStopReason)}</dd>
        </div>
      </dl>
      <div class="usage-bucket-grid">
        <div class="usage-bucket-item usage-bucket-item-${frontReference.status} usage-bucket-item-required">
          <span>正面基準</span>
          <strong>選択 ${frontReference.selectedCount} / 候補 ${frontReference.candidateCount}</strong>
          <em>推奨 ${recommendedLabel} / ${frontReference.status}</em>
        </div>
      </div>
      <strong>自動 bucket</strong>
      <div class="usage-bucket-grid">
        ${buckets
          .map(
            (bucket) => `
              <div class="usage-bucket-item usage-bucket-item-${bucket.status} usage-bucket-item-${bucket.priority}">
                <span>${bucket.id}</span>
                <strong>selected ${bucket.selectedCount} / ${bucket.targetCount}</strong>
                <em>${bucket.status} / auto detected ${bucket.autoDetectedCount} / skipped after target ${bucket.skippedAfterTargetCount}</em>
              </div>
            `,
          )
          .join("")}
      </div>
      ${
        warnings.length === 0
          ? `<p class="pose-aware-ready-text">usage buckets: OK</p>`
          : `<ul class="pose-aware-warning-list usage-bucket-warning-list">
              ${warnings
                .map((warning) => `<li>${escapeHtml(warning)}</li>`)
                .join("")}
            </ul>`
      }
      <p class="usage-bucket-note">adaptive sampling / early stop は prototype 実装済みです。3D comparison / landmarkFollowStrengths auto generation は未実装です。</p>
    </div>
  `
}

function renderFrameUsageSummaryPanel(): string {
  const summary = getFrameUsageSummary()

  return `
    <div class="pose-aware-coverage">
      ${renderUsageBucketSummaryPanel()}
      <strong>frame usage summary</strong>
      <ul>
        <li>source frames: ${summary.sourceFrameCount}件</li>
        <li>frontReference: ${summary.frontReferenceCount}件</li>
        <li>useForInference: ${summary.useForInferenceCount}件</li>
        <li>excluded: ${summary.excludedCount}件</li>
      </ul>
      <p class="usage-bucket-note">「IdealFace生成に使う」が ON のフレームだけが IdealFace 本体の 3D 478 生成に使われます。正面基準だけ ON のフレームは、基準合わせには使いますが、形状生成には混ぜません。</p>
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

function renderScanPresetControl(disabled: boolean): string {
  const scanSettings = getScanSettings()
  const modeLabel = adaptiveSamplingEnabled ? "adaptive" : "preset"
  const effectiveMaxScanFrames = getEffectiveMaxScanFrames(
    scanSettings.maxScanFrames,
  )

  return `
    <div class="scan-controls">
      <div class="scan-preset-control" role="radiogroup" aria-label="スキャン精度">
        <span>スキャン精度</span>
        ${(Object.keys(SCAN_PRESET_MAX_SCAN_FRAMES) as ScanPreset[])
          .map(
            (preset) => `
              <label>
                <input
                  type="radio"
                  name="scan-preset"
                  value="${preset}"
                  data-scan-preset="${preset}"
                  ${scanPreset === preset ? "checked" : ""}
                  ${disabled ? "disabled" : ""}
                />
                ${preset}
              </label>
            `,
          )
          .join("")}
        <strong>preset max: ${scanSettings.maxScanFrames}</strong>
      </div>
      <label class="adaptive-sampling-toggle">
        <input
          type="checkbox"
          data-adaptive-sampling-enabled
          ${adaptiveSamplingEnabled ? "checked" : ""}
          ${disabled ? "disabled" : ""}
        />
        用途がそろったら早期終了する
        <strong>mode: ${modeLabel}</strong>
        <strong>adaptive max: ${ADAPTIVE_MAX_SCAN_FRAMES}</strong>
        <strong>effective max: ${effectiveMaxScanFrames}</strong>
      </label>
    </div>
  `
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
      ${renderScanPresetControl(isAnalyzing || isExtracting)}
      <p class="status-text">${escapeHtml(statusText)}</p>
      <dl class="analysis-summary">
        <div>
          <dt>scan preset</dt>
          <dd>${summary.scanPreset}</dd>
        </div>
        <div>
          <dt>スキャン間隔</dt>
          <dd>${summary.scanIntervalSec.toFixed(3)}s</dd>
        </div>
        <div>
          <dt>preset max</dt>
          <dd>${summary.presetMaxScanFrames}</dd>
        </div>
        <div>
          <dt>adaptive max</dt>
          <dd>${summary.adaptiveMaxScanFrames}</dd>
        </div>
        <div>
          <dt>effective max</dt>
          <dd>${summary.effectiveMaxScanFrames}</dd>
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
        <div>
          <dt>adaptive sampling</dt>
          <dd>${summary.adaptiveSamplingEnabled ? "enabled" : "disabled"}</dd>
        </div>
        <div>
          <dt>early stopped</dt>
          <dd>${summary.earlyStopped ? "yes" : "no"}</dd>
        </div>
        <div>
          <dt>early stop reason</dt>
          <dd>${formatEarlyStopReason(summary.earlyStopReason)}</dd>
        </div>
      </dl>
      <p class="candidate-note">詳細スキャン済みの有効フレームは Step 2-I の正面基準の手動選択 / 推定に使うフレーム / 除外フレームとして扱います。</p>
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
    preset: scanSummary.scanPreset,
    scanIntervalSec: scanSummary.scanIntervalSec,
    maxScanFrames: scanSummary.maxScanFrames,
    presetMaxScanFrames: scanSummary.presetMaxScanFrames,
    adaptiveMaxScanFrames: scanSummary.adaptiveMaxScanFrames,
    effectiveMaxScanFrames: scanSummary.effectiveMaxScanFrames,
    scannedFrameCount: scanSummary.scannedFrameCount,
    analyzedFrameCount: scanSummary.analyzedFrameCount,
    detectedFrameCount: scanSummary.detectedFrameCount,
    candidateSourceFrameCount: scanSummary.candidateSourceFrameCount,
    adaptiveSamplingEnabled: scanSummary.adaptiveSamplingEnabled,
    earlyStopped: scanSummary.earlyStopped,
    earlyStopReason: scanSummary.earlyStopReason,
  }
}

function toUsageAwareSamplingPreview(): unknown {
  const scanSummary = getDetailedScanSummary()
  const frontReference = getFrontReferenceSummary()

  return {
    status: "prototype",
    preset: scanSummary.scanPreset,
    mode: scanSummary.adaptiveSamplingEnabled ? "adaptive" : "preset",
    maxScanFrames: scanSummary.maxScanFrames,
    presetMaxScanFrames: scanSummary.presetMaxScanFrames,
    adaptiveMaxScanFrames: scanSummary.adaptiveMaxScanFrames,
    effectiveMaxScanFrames: scanSummary.effectiveMaxScanFrames,
    scannedFrameCount: scanSummary.scannedFrameCount,
    detectedFrameCount: scanSummary.detectedFrameCount,
    adaptiveSamplingImplemented: true,
    adaptiveSamplingEnabled: scanSummary.adaptiveSamplingEnabled,
    earlyStopped: scanSummary.earlyStopped,
    earlyStopReason: scanSummary.earlyStopReason,
    frontReference: {
      selectedCount: frontReference.selectedCount,
      candidateCount: frontReference.candidateCount,
      recommendedMin: frontReference.recommendedMin,
      recommendedMax: frontReference.recommendedMax,
      status: frontReference.status,
      candidateFrameIdPreview: frontReference.candidateFrameIdPreview,
    },
    buckets: getUsageBucketSummary().map((bucket) => ({
      id: bucket.id,
      targetCount: bucket.targetCount,
      selectedCount: bucket.selectedCount,
      autoDetectedCount: bucket.autoDetectedCount,
      skippedAfterTargetCount: bucket.skippedAfterTargetCount,
      status: bucket.status,
      priority: bucket.priority,
    })),
    requiredBuckets: [...REQUIRED_USAGE_BUCKET_IDS],
    optionalBuckets: [...OPTIONAL_USAGE_BUCKET_IDS],
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
    usageAwareSampling: toUsageAwareSamplingPreview(),
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
      scanSettings: {
        preset: scanSummary.scanPreset,
        maxScanFrames: scanSummary.maxScanFrames,
        presetMaxScanFrames: scanSummary.presetMaxScanFrames,
        adaptiveMaxScanFrames: scanSummary.adaptiveMaxScanFrames,
        effectiveMaxScanFrames: scanSummary.effectiveMaxScanFrames,
        adaptiveSamplingEnabled: scanSummary.adaptiveSamplingEnabled,
      },
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

function attachScanPresetHandler(): void {
  document
    .querySelectorAll<HTMLInputElement>("[data-scan-preset]")
    .forEach((input) => {
      input.addEventListener("change", () => {
        if (!input.checked || !isScanPreset(input.value)) {
          return
        }

        scanPreset = input.value
        if (
          videoSource &&
          videoSource.scanSummary.scannedFrameCount === 0 &&
          videoSource.scanSummary.analyzedFrameCount === 0
        ) {
          updateVideoSource({
            scanSummary: createEmptyDetailedScanSummary(),
          })
        }
        render()
      })
    })
}

function attachAdaptiveSamplingHandler(): void {
  document
    .querySelector<HTMLInputElement>("[data-adaptive-sampling-enabled]")
    ?.addEventListener("change", (event) => {
      const input = event.currentTarget as HTMLInputElement
      adaptiveSamplingEnabled = input.checked

      if (
        videoSource &&
        videoSource.scanSummary.scannedFrameCount === 0 &&
        videoSource.scanSummary.analyzedFrameCount === 0
      ) {
        updateVideoSource({
          scanSummary: createEmptyDetailedScanSummary(),
        })
      }

      render()
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
    .querySelector<HTMLSelectElement>(
      "[data-pose-aware-generation-method-select]",
    )
    ?.addEventListener("change", (event) => {
      const value = (event.currentTarget as HTMLSelectElement).value

      if (!isIdealLandmarks3DGenerationMethod(value)) {
        return
      }

      selectedIdealLandmarks3DGenerationMethod = value

      const cachedResult = idealLandmarks3DCandidateResults[value]

      if (cachedResult) {
        idealLandmarks3DCandidateResult = cachedResult
        pointCloudPreviewCamera = createPointCloudPreviewCamera()
      }

      render()
    })

  document
    .querySelector<HTMLSelectElement>(
      "[data-mediapipe-z-normalize-mode-select]",
    )
    ?.addEventListener("change", (event) => {
      const value = (event.currentTarget as HTMLSelectElement).value

      if (!isMediaPipeZNormalizeMode(value)) {
        return
      }

      mediaPipeZNormalizeMode = value
      resetIdealLandmarks3DCandidateResult()
      render()
    })

  document
    .querySelector<HTMLInputElement>("[data-mediapipe-z-scale-input]")
    ?.addEventListener("change", (event) => {
      const value = Number((event.currentTarget as HTMLInputElement).value)

      mediaPipeZScale = Number.isFinite(value) && value >= 0 ? value : 1
      resetIdealLandmarks3DCandidateResult()
      render()
    })

  document
    .querySelector<HTMLInputElement>(
      "[data-mediapipe-z-invert-sign-checkbox]",
    )
    ?.addEventListener("change", (event) => {
      mediaPipeZInvertSign = (event.currentTarget as HTMLInputElement).checked
      resetIdealLandmarks3DCandidateResult()
      render()
    })

  document
    .querySelector<HTMLButtonElement>(
      "[data-generate-pose-aware-ideal-landmarks-3d-candidate]",
    )
    ?.addEventListener("click", () => {
      const dataset = getPoseAwareInferenceDataset()
      const weightedResult = buildPoseAwareCandidateResult(
        dataset,
        "pose_aware_weighted_z_v1",
        null,
      )
      const canonicalResult = buildPoseAwareCandidateResult(
        dataset,
        "pose_aware_canonical_3d_v1",
        weightedResult,
      )
      const stableZResult = buildPoseAwareCandidateResult(
        dataset,
        "pose_aware_canonical_stable_z_v1",
        canonicalResult,
      )
      const balancedFrameZResult = buildPoseAwareCandidateResult(
        dataset,
        "pose_aware_canonical_balanced_frame_z_v1",
        stableZResult,
        canonicalResult,
      )
      const mediaPipeMeshAverageResult =
        buildPoseAwareMediaPipeMeshAverageIdealLandmarks3DCandidateResult(
          dataset,
          canonicalResult,
          stableZResult,
          balancedFrameZResult,
        )

      idealLandmarks3DCandidateResults = {
        pose_aware_weighted_z_v1: weightedResult,
        pose_aware_canonical_3d_v1: canonicalResult,
        pose_aware_canonical_stable_z_v1: stableZResult,
        pose_aware_canonical_balanced_frame_z_v1: balancedFrameZResult,
        pose_aware_mediapipe_mesh_average_v1: mediaPipeMeshAverageResult,
      }
      idealLandmarks3DCandidateResult =
        idealLandmarks3DCandidateResults[
          selectedIdealLandmarks3DGenerationMethod
        ] ?? balancedFrameZResult
      pointCloudPreviewCamera = createPointCloudPreviewCamera()
      render()
    })

  document
    .querySelectorAll<HTMLButtonElement>("[data-use-pose-aware-candidate-method]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const method = button.dataset.usePoseAwareCandidateMethod

        if (!isIdealLandmarks3DGenerationMethod(method)) {
          return
        }

        const result = idealLandmarks3DCandidateResults[method]

        if (!result) {
          return
        }

        selectedIdealLandmarks3DGenerationMethod = method
        idealLandmarks3DCandidateResult = result
        pointCloudPreviewCamera = createPointCloudPreviewCamera()
        render()
      })
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

function buildDetailedScanSummary(
  scanSettings: ReturnType<typeof getScanSettings>,
  intervalSec: number,
  scannedFrames: ExtractedVideoFrame[],
  detectedFrameCount: number,
  metrics: AdaptiveScanMetrics,
): DetailedScanSummary {
  const effectiveMaxScanFrames = metrics.maxScanFrames

  return {
    scanPreset: scanSettings.preset,
    scanIntervalSec: intervalSec,
    maxScanFrames: effectiveMaxScanFrames,
    presetMaxScanFrames: scanSettings.maxScanFrames,
    adaptiveMaxScanFrames: ADAPTIVE_MAX_SCAN_FRAMES,
    effectiveMaxScanFrames,
    scannedFrameCount: scannedFrames.length,
    analyzedFrameCount: scannedFrames.length,
    detectedFrameCount,
    candidateSourceFrameCount:
      getCandidateSourceFramesFromFrames(scannedFrames).length,
    adaptiveSamplingEnabled: metrics.enabled,
    earlyStopped: metrics.earlyStopped,
    earlyStopReason: metrics.earlyStopReason,
  }
}

async function scanVideoForPoseAwareFrames(
  video: HTMLVideoElement,
  landmarker: FaceLandmarker,
): Promise<DetailedScanResult> {
  const scanSettings = getScanSettings()
  const effectiveMaxScanFrames = getEffectiveMaxScanFrames(
    scanSettings.maxScanFrames,
  )
  const adaptiveMetrics = createAdaptiveScanMetrics(
    adaptiveSamplingEnabled,
    effectiveMaxScanFrames,
  )
  lastAdaptiveScanMetrics = adaptiveMetrics
  const scanPlan = getDetailedScanPlan(
    video.duration,
    effectiveMaxScanFrames,
  )
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
    adaptiveMetrics.scannedFrameCount = scannedFrames.length

    if (frame.analysis?.detected) {
      detectedFrameCount += 1
    }

    if (adaptiveMetrics.enabled) {
      applyAdaptiveSamplingToFrame(frame, adaptiveMetrics)
      if (areRequiredUsageBucketsSatisfied(adaptiveMetrics)) {
        adaptiveMetrics.earlyStopped = true
        adaptiveMetrics.earlyStopReason = "required_buckets_satisfied"
      }
    }

    updateVideoSource({
      detailedScanFrames: [...scannedFrames],
      scanSummary: buildDetailedScanSummary(
        scanSettings,
        scanPlan.intervalSec,
        scannedFrames,
        detectedFrameCount,
        adaptiveMetrics,
      ),
    })
    render()

    if (adaptiveMetrics.earlyStopped) {
      break
    }
  }

  const scanSummary = buildDetailedScanSummary(
    scanSettings,
    scanPlan.intervalSec,
    scannedFrames,
    detectedFrameCount,
    adaptiveMetrics,
  )

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
    const facialTransformationMatrix = result.facialTransformationMatrixes[0]
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
          ? estimateFacePose(landmarks, facialTransformationMatrix)
          : { ...EMPTY_FACE_POSE },
        facialTransformationMatrix: summarizeFacialTransformationMatrix(
          facialTransformationMatrix,
        ),
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
        facialTransformationMatrix: null,
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

function getDetailedScanPlan(duration: number, maxScanFrames: number): {
  intervalSec: number
  timestamps: number[]
} {
  const safeDuration = Math.max(0, duration)
  const maxTimestamp = Math.max(0, safeDuration - 0.05)
  const estimatedFrameCount =
    Math.floor(maxTimestamp / DETAILED_SCAN_INTERVAL_SEC) + 1
  const frameCount = Math.min(
    maxScanFrames,
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
  attachScanPresetHandler()
  attachAdaptiveSamplingHandler()
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

  .scan-controls {
    display: grid;
    gap: 8px;
    margin: 0 0 12px;
  }

  .scan-preset-control,
  .adaptive-sampling-toggle {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 0;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
    padding: 10px 12px;
    color: #25342e;
    font-size: 13px;
    font-weight: 800;
  }

  .scan-preset-control label,
  .adaptive-sampling-toggle {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-height: 30px;
    border: 1px solid #bdd0c9;
    border-radius: 6px;
    padding: 4px 8px;
    background: #fbfdfc;
  }

  .scan-preset-control strong {
    margin-left: auto;
    color: #27594c;
  }

  .adaptive-sampling-toggle strong {
    margin-left: auto;
    color: #27594c;
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

  .usage-bucket-summary {
    display: grid;
    gap: 8px;
  }

  .usage-bucket-status-list {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }

  .usage-bucket-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 8px;
  }

  .usage-bucket-item {
    display: grid;
    gap: 4px;
    min-width: 0;
    border: 1px solid #dde6e2;
    border-radius: 8px;
    background: #fbfdfc;
    padding: 10px;
  }

  .usage-bucket-item-insufficient {
    border-color: #d8b46d;
    background: #fff8e8;
  }

  .usage-bucket-item-required.usage-bucket-item-insufficient {
    border-color: #d69a94;
    background: #fff7f6;
  }

  .usage-bucket-item span,
  .usage-bucket-item strong,
  .usage-bucket-item em,
  .usage-bucket-note {
    min-width: 0;
    margin: 0;
    overflow-wrap: anywhere;
    line-height: 1.35;
  }

  .usage-bucket-item span {
    color: #17201b;
    font-size: 13px;
    font-weight: 900;
  }

  .usage-bucket-item strong {
    color: #25342e;
    font-size: 16px;
  }

  .usage-bucket-item em,
  .usage-bucket-note {
    color: #5d675f;
    font-size: 12px;
    font-style: normal;
    font-weight: 800;
  }

  .usage-bucket-warning-list {
    margin-top: 0;
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
