import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision"
import type { Matrix, NormalizedLandmark } from "@mediapipe/tasks-vision"
import "./style.css"

type LoadStatus = "未読込" | "読込中" | "解析中" | "完了" | "エラー"
type DetectorStatus = "未初期化" | "初期化中" | "準備完了" | "エラー"

type Pose = {
  yaw: number
  pitch: number
  roll: number
}

type VideoMetadata = {
  fileName: string
  fileSize: number
  duration: number
  videoWidth: number
  videoHeight: number
}

type MediaPipeFrameSummary = {
  detected: boolean
  landmarkCount: number
  blendshapeCount: number
  hasFacialTransformationMatrix: boolean
  matrixPreview?: number[]
  error?: string
}

type LandmarkSummaryPoint = {
  id: string
  label: string
  x: number
  y: number
  z?: number
  sourceIndices: number[]
  sourceMode?: EyePointMode
}

type ManualLandmarkAdjustment = {
  id: string
  dx: number
  dy: number
}

type ExcludedReason = "manual"

type EyePointMode = "irisCenter" | "eyeContourCenter" | "browEyeAnchor"

type ManualAdjustmentsByFrame = Record<number, ManualLandmarkAdjustment[]>

type PoseAxisBin =
  | "negativeLarge"
  | "negativeSmall"
  | "center"
  | "positiveSmall"
  | "positiveLarge"

type PoseBucket125 = {
  id: string
  yawBin: PoseAxisBin
  pitchBin: PoseAxisBin
  rollBin: PoseAxisBin
}

type PoseBucket125Definition = PoseBucket125

type PoseReviewYawPitchBucketDefinition = {
  id: string
  yawBin: PoseAxisBin
  pitchBin: PoseAxisBin
}

type PoseBucket125SummaryItem = PoseBucket125Definition & {
  count: number
  percent: number
}

type PoseAxisName = "yaw" | "pitch" | "roll"

type PoseReviewCandidateRollGroup = "roll_negative" | "roll_center" | "roll_positive"

type PoseReviewSelectedBy =
  | "roll_center"
  | "roll_negative"
  | "roll_positive"
  | "roll_balance_supplement"

type PoseReviewCandidateSelectionMode = "balanced"

type PoseReviewCandidateBalancedStatus = "balanced" | "partial"

type PoseReviewCandidateShortageReason =
  | "not_enough_non_expression_frames"
  | "not_enough_pose_frames"
  | "unknown"

type PoseReviewCandidatePolicy = {
  selectionMode: PoseReviewCandidateSelectionMode
  primaryGrouping: "yaw_pitch_25"
  maxTargetPerBucket: number
  minBalancedTargetPerBucket: number
  actualTargetPerBucket: number
  rollSelection: "balanced_negative_center_positive"
  rollGroups: {
    roll_negative: readonly ["negativeLarge", "negativeSmall"]
    roll_center: readonly ["center"]
    roll_positive: readonly ["positiveSmall", "positiveLarge"]
  }
  expressionTooStrong: "exclude"
  sampling: "evenly_spaced_by_time"
}

type PoseReviewCandidateFrame = {
  sourceFrameIndex: number
  timeSec: number
  rollBin: PoseAxisBin
  rollGroup: PoseReviewCandidateRollGroup
  selectedBy: PoseReviewSelectedBy
}

type PoseReviewCandidateBucket = {
  id: string
  yawBin: PoseAxisBin
  pitchBin: PoseAxisBin
  targetCount: number
  selectedCount: number
  shortageCount: number
  selectedByRollNegativeCount: number
  selectedByRollCenterCount: number
  selectedByRollPositiveCount: number
  availableRollNegativeCount: number
  availableRollCenterCount: number
  availableRollPositiveCount: number
  shortageReason?: string
  selectedFrames: PoseReviewCandidateFrame[]
}

type PoseReviewCandidateShortageBucketSummary = {
  bucketId: string
  yawBin: PoseAxisBin
  pitchBin: PoseAxisBin
  targetCount: number
  selectedCount: number
  shortageCount: number
  acceptedFrameCount: number
  usableNonExpressionCount: number
  expressionTooStrongCount: number
  availableRollNegativeCount: number
  availableRollCenterCount: number
  availableRollPositiveCount: number
  selectedByRollNegativeCount: number
  selectedByRollCenterCount: number
  selectedByRollPositiveCount: number
  shortageReason: PoseReviewCandidateShortageReason
}

type PoseReviewCandidateSummary = {
  selectionMode: PoseReviewCandidateSelectionMode
  maxTargetPerBucket: number
  minBalancedTargetPerBucket: number
  actualTargetPerBucket: number
  rollSelection: "balanced_negative_center_positive"
  rollGroups: PoseReviewCandidatePolicy["rollGroups"]
  balancedStatus: PoseReviewCandidateBalancedStatus
  policy: PoseReviewCandidatePolicy
  targetTotal: number
  selectedTotal: number
  fullBucketCount: number
  shortageBucketCount: number
  excludedExpressionTooStrongCount: number
  shortageBuckets: PoseReviewCandidateShortageBucketSummary[]
  buckets: PoseReviewCandidateBucket[]
}

type FrameBadge = {
  id: string
  label: string
  description: string
}

type ExpressionScoreSummary = {
  maxScore: number
  maxCategoryName?: string
  jawOpen?: number
  mouthSmileLeft?: number
  mouthSmileRight?: number
  mouthPucker?: number
  mouthFunnel?: number
  mouthShrugUpper?: number
  mouthShrugLower?: number
  eyeBlinkLeft?: number
  eyeBlinkRight?: number
  eyeSquintLeft?: number
  eyeSquintRight?: number
  browDownLeft?: number
  browDownRight?: number
  browInnerUp?: number
  browOuterUpLeft?: number
  browOuterUpRight?: number
}

type AcceptedFrameSnapshot = {
  sourceFrameIndex: number
  timeSec: number
  thumbnailDataUrl: string
  mediaPipeSummary: MediaPipeFrameSummary
  pose: Pose | null
  observed12pt: LandmarkSummaryPoint[]
  excluded: boolean
  excludedReason?: ExcludedReason
  poseBucket125: PoseBucket125 | null
  badges: FrameBadge[]
  expressionSummary?: ExpressionScoreSummary
}

type ScanStatus = "idle" | "running" | "completed" | "cancelled" | "error"

type ScanState = {
  status: ScanStatus
  scanFrameStepSeconds: number
  maxScanDurationSec: number
  maxScanFrames: number
  scannedFrameCount: number
  acceptedFrameCount: number
  discardedNoFaceCount: number
  discardedInvalidLandmarkCount: number
  progress: number
  error?: string
}

type ConsoleTab =
  | "summary"
  | "currentFrame"
  | "landmarks12pt"
  | "adjustments"
  | "candidates"
  | "rotationFit"
  | "raw"
  | "scan"
  | "pose"

type SemanticPointDefinition = {
  id: string
  label: string
  primaryIndices: number[]
  fallbackIndices?: number[]
}

type Point2D = {
  x: number
  y: number
}

type Point3D = Point2D & {
  z: number
}

type RotationFitPointScore = {
  pointId: string
  averageError: number
  maxError: number
}

type RotationFitFrameScore = {
  sourceFrameIndex: number
  timeSec: number
  yaw: number
  pitch: number
  roll: number
  frameScore: number
  worstPoint: string
  worstPointError: number
  pointErrors: Record<string, number>
}

type RotationFitAxisBucketName = "negative" | "center" | "positive"

type RotationFitBucketScore = {
  bucket: string
  frameCount: number
  averageFrameScore: number
  maxFrameScore: number
}

type RotationFitBucketScores = {
  yaw: RotationFitBucketScore[]
  pitch: RotationFitBucketScore[]
  roll: RotationFitBucketScore[]
  yawPitch: RotationFitBucketScore[]
}

type RotationFitPointId =
  | "headTop"
  | "chin"
  | "leftCheek"
  | "rightCheek"
  | "leftEye"
  | "rightEye"
  | "nose"
  | "mouth"
  | "noseBridge"
  | "leftJaw"
  | "rightJaw"
  | "upperFaceCenter"

type RotationFitSymmetricZSearchParameter = "cheek.z" | "eye.z" | "jaw.z"

type RotationFitIndependentPointZSearchParameter =
  `${Exclude<RotationFitPointId, "leftCheek" | "rightCheek" | "leftEye" | "rightEye" | "leftJaw" | "rightJaw">}.z`

type RotationFitLocalSearchParameter =
  | "rotationCenter.y"
  | "rotationCenter.z"
  | RotationFitSymmetricZSearchParameter
  | RotationFitIndependentPointZSearchParameter

type RotationFitSearchRange = {
  min: number
  max: number
  step: number
}

type RotationFitCandidateResult = {
  rank: number
  rotationCenter: Point3D
  zByPointId: Record<string, number>
  totalScore: number
  maxFrameScore: number
  worstFrame: RotationFitFrameScore | null
  worstPoint: RotationFitPointScore | null
  frameScores: RotationFitFrameScore[]
  pointScores: RotationFitPointScore[]
  bucketScores: RotationFitBucketScores
}

type RotationFitCandidateSummary = {
  rank: number
  rotationCenter: Point3D
  zByPointId?: Record<string, number>
  totalScore: number
  maxFrameScore: number
  worstFrame: RotationFitFrameScore | null
  worstPoint: RotationFitPointScore | null
}

type RotationFitSearchBoundaryStatus = {
  bestYAtMin: boolean
  bestYAtMax: boolean
  bestZAtMin: boolean
  bestZAtMax: boolean
}

type RotationFitZGroupId = "centerAxis" | "cheek" | "jaw" | "eye"

type RotationFitZGroupDefinition = {
  id: RotationFitZGroupId
  label: string
  pointIds: string[]
}

type RotationFitGroupSearchCandidateSummary = {
  rank: number
  groupId: RotationFitZGroupId
  groupOffset: number
  groupOffsets: Record<RotationFitZGroupId, number>
  totalScore: number
  maxFrameScore: number
  worstFrame: RotationFitFrameScore | null
  worstPoint: RotationFitPointScore | null
}

type RotationFitGroupSearchLog = {
  iteration: number
  groupId: RotationFitZGroupId
  previousOffset: number
  selectedOffset: number
  previousTotalScore: number
  selectedTotalScore: number
  previousMaxFrameScore: number
  selectedMaxFrameScore: number
  improved: boolean
  candidateCount: number
  candidates: RotationFitGroupSearchCandidateSummary[]
}

type RotationFitStageAResult = {
  searchMode: "rotation_center_yz_coarse"
  searchRange: {
    y: RotationFitSearchRange
    z: RotationFitSearchRange
  }
  candidateCount: number
  bestCandidate: RotationFitCandidateResult | null
  topCandidates: RotationFitCandidateSummary[]
  boundaryStatus: RotationFitSearchBoundaryStatus
}

type RotationFitStageBResult = {
  searchMode: "group_z_search"
  groupDefinitions: RotationFitZGroupDefinition[]
  groupZOffsetRange: RotationFitSearchRange
  iterationCount: number
  initialCandidate: RotationFitCandidateResult | null
  bestCandidate: RotationFitCandidateResult | null
  groupOffsets: Record<RotationFitZGroupId, number>
  groupSearchLogs: RotationFitGroupSearchLog[]
  topCandidates: RotationFitGroupSearchCandidateSummary[]
}

type RotationFitImprovement = {
  totalScoreBefore: number
  totalScoreAfter: number
  totalScoreDelta: number
  maxFrameScoreBefore: number
  maxFrameScoreAfter: number
  maxFrameScoreDelta: number
}

type RotationFitParameterImprovement = {
  parameter: string
  iteration: number
  scoreBefore: number
  scoreAfter: number
  scoreDelta: number
  maxFrameScoreBefore: number
  maxFrameScoreAfter: number
  maxFrameScoreDelta: number
  valueBefore: number
  valueAfter: number
  improved: boolean
  bestCandidateRankInStep?: number
  candidateCountInStep?: number
}

type RotationFitParameterImprovementSummary = {
  totalImprovement: number
  bestImprovingParameter: string | null
  noImprovementParameters: string[]
  boundaryHitParameters: string[]
}

type RotationFitCoordinateDescentStepLog = {
  stage?: "coarse" | "fine"
  iteration: number
  parameter: RotationFitLocalSearchParameter
  previousValue: number
  bestValue: number
  previousTotalScore: number
  bestTotalScore: number
  previousMaxFrameScore: number
  bestMaxFrameScore: number
  candidateCount: number
  improved: boolean
  bestCandidateRankInStep?: number
}

type RotationFitCoordinateBoundaryStatus = Record<
  RotationFitLocalSearchParameter,
  {
    bestAtMin: boolean
    bestAtMax: boolean
  }
>

type RotationFitLeftRightZSymmetryDiagnostics = {
  cheekDelta: number
  eyeDelta: number
  jawDelta: number
}

type RotationFitFittingLab12ptSearchStage = {
  enabled?: boolean
  step: number
  radius?: number
  iterationCount: number
  bestCandidate: RotationFitCandidateResult | null
  coordinateDescentLog: RotationFitCoordinateDescentStepLog[]
  parameterImprovements: RotationFitParameterImprovement[]
  parameterImprovementSummary: RotationFitParameterImprovementSummary
}

type RotationFitFittingLab12ptSearch = {
  searchMode: "fitting_lab_12pt_rotation_center"
  sourceLab: "tools/ideal-face-fitting-lab"
  sourcePointSetId: "12pt_rotation_center"
  coordinateSystemSource: "render_adjusted12pt_aspect_corrected"
  rangeSource: "render_consistency_lab"
  zRangeSource: "render_consistency_lab_uniform_debug_range"
  fittingLabAlgorithmOnly: true
  baseCandidatePresetId: "renderUniformDebugInitial"
  candidateGeneration: "coordinateDescent"
  coordinateDescentIterations: number
  coordinateDescentParameterOrder: RotationFitLocalSearchParameter[]
  coordinateDescentRanges: Record<RotationFitLocalSearchParameter, RotationFitSearchRange>
  zSymmetryMode: "paired_left_right"
  symmetricZParameters: Record<RotationFitSymmetricZSearchParameter, string[]>
  fineSearchEnabled: boolean
  fineSearchStep: number
  fineSearchRadius: number
  fineSearchIterations: number
  coarseTotalScore: number | null
  fineTotalScore: number | null
  fineImprovement: number | null
  leftRightZSymmetryDiagnostics: RotationFitLeftRightZSymmetryDiagnostics | null
  searchStages: {
    coarse: RotationFitFittingLab12ptSearchStage
    fine: RotationFitFittingLab12ptSearchStage
  }
  coordinateBoundaryStatus: RotationFitCoordinateBoundaryStatus | null
  initialCandidate: RotationFitCandidateResult | null
  bestCandidate: RotationFitCandidateResult | null
  finalZByPointId: Record<string, number> | null
  coordinateDescentLog: RotationFitCoordinateDescentStepLog[]
  parameterImprovements: RotationFitParameterImprovement[]
  parameterImprovementSummary: RotationFitParameterImprovementSummary
}

type RotationFitEvaluation = {
  status: "completed" | "error"
  error?: string
  searchMode:
    | "rotation_center_yz_coarse"
    | "rotation_center_yz_coarse_then_group_z"
    | "fitting_lab_12pt_rotation_center"
  searchRange: {
    y: RotationFitSearchRange
    z: RotationFitSearchRange
  }
  candidateCount: number
  evaluationFrameCount: number
  baseFrameSource: {
    sourceFrameIndex: number
    timeSec: number
    reason: string
  } | null
  videoAspectRatio: number
  rotationCenter: Point3D
  bestRotationCenter: Point3D | null
  boundaryStatus: RotationFitSearchBoundaryStatus
  zPresetName: string
  fixedZPresetName: string
  focalLength: number
  totalScore: number
  maxFrameScore: number
  worstFrame: RotationFitFrameScore | null
  worstPoint: RotationFitPointScore | null
  frameScores: RotationFitFrameScore[]
  pointScores: RotationFitPointScore[]
  bucketScores: RotationFitBucketScores
  bestCandidate: RotationFitCandidateResult | null
  topCandidates: RotationFitCandidateSummary[]
  stageA?: RotationFitStageAResult
  stageB?: RotationFitStageBResult
  fittingLab12ptSearch?: RotationFitFittingLab12ptSearch
  coordinateDescentLog?: RotationFitCoordinateDescentStepLog[]
  coordinateBoundaryStatus?: RotationFitCoordinateBoundaryStatus | null
  improvement?: RotationFitImprovement
  debugPreset: {
    zByPointId: Record<string, number>
  }
  finalZByPointId?: Record<string, number>
}

type AppState = {
  loadStatus: LoadStatus
  detectorStatus: DetectorStatus
  detectorError: string | null
  fileError: string | null
  metadata: VideoMetadata | null
  summary: MediaPipeFrameSummary | null
  pose: Pose | null
  observed12pt: LandmarkSummaryPoint[]
  eyePointMode: EyePointMode
  acceptedFrames: AcceptedFrameSnapshot[]
  currentReviewIndex: number
  scanState: ScanState
  manualAdjustmentsByFrame: ManualAdjustmentsByFrame
  poseReviewCandidateSummary: PoseReviewCandidateSummary | null
  rotationFitEvaluation: RotationFitEvaluation | null
  selectedLandmarkSummaryPointId: string | null
  draggingLandmarkSummaryPointId: string | null
  showLandmarkSummaryOverlay: boolean
  consoleTab: ConsoleTab
  rawJsonCopyStatus: string | null
}

const RAD_TO_DEG = 180 / Math.PI
const MATRIX_PREVIEW_COUNT = 8
const SCAN_FRAME_STEP_SECONDS = 1 / 30
const MAX_SCAN_DURATION_SEC = 300
const MAX_SCAN_FRAMES = 9000
const ACCEPTED_FRAMES_PREVIEW_LIMIT = 20
const MANUAL_ADJUSTMENTS_BY_FRAME_PREVIEW_LIMIT = 20
const OVERLAY_POINT_RADIUS = 5
const OVERLAY_SELECTED_POINT_RADIUS = 8
const OVERLAY_HIT_RADIUS = 12
const DEFAULT_EYE_POINT_MODE: EyePointMode = "browEyeAnchor"
const POSE_AXIS_BIN_THRESHOLDS = {
  yaw: {
    centerAbsMax: 3,
    negativeSmallMax: 10,
    positiveSmallMax: 10,
  },
  pitch: {
    centerAbsMax: 3,
    negativeSmallMax: 10,
    positiveSmallMax: 6,
  },
  roll: {
    centerAbsMax: 3,
    negativeSmallMax: 10,
    positiveSmallMax: 10,
  },
} as const
const POSE_AXIS_BINS = [
  "negativeLarge",
  "negativeSmall",
  "center",
  "positiveSmall",
  "positiveLarge",
] as const satisfies readonly PoseAxisBin[]
const POSE_BUCKET_125_DEFINITIONS = buildPoseBucket125Definitions()
const POSE_BUCKET_125_TOTAL_COUNT = POSE_BUCKET_125_DEFINITIONS.length
const FRONT_CANDIDATE_POSE_BUCKET_125_ID =
  "yaw_center__pitch_center__roll_center"
const POSE_REVIEW_SELECTION_MODE = "balanced" as const satisfies PoseReviewCandidateSelectionMode
const POSE_REVIEW_MAX_TARGET_PER_BUCKET = 5
const POSE_REVIEW_MIN_BALANCED_TARGET_PER_BUCKET = 3
const POSE_REVIEW_YAW_PITCH_BUCKET_DEFINITIONS = buildPoseReviewYawPitchBucketDefinitions()
const POSE_REVIEW_YAW_PITCH_BUCKET_COUNT = POSE_REVIEW_YAW_PITCH_BUCKET_DEFINITIONS.length
const POSE_REVIEW_BALANCED_TARGET_CANDIDATES = [
  POSE_REVIEW_MAX_TARGET_PER_BUCKET,
  4,
  POSE_REVIEW_MIN_BALANCED_TARGET_PER_BUCKET,
] as const
const POSE_REVIEW_ROLL_SELECTION = "balanced_negative_center_positive" as const
const POSE_REVIEW_ROLL_GROUPS = {
  roll_negative: ["negativeLarge", "negativeSmall"],
  roll_center: ["center"],
  roll_positive: ["positiveSmall", "positiveLarge"],
} as const satisfies Record<PoseReviewCandidateRollGroup, readonly PoseAxisBin[]>
const POSE_REVIEW_ROLL_GROUP_ORDER = [
  "roll_center",
  "roll_negative",
  "roll_positive",
] as const satisfies readonly PoseReviewCandidateRollGroup[]
const POSE_REVIEW_ROLL_SUPPLEMENT_ORDER = [
  "roll_negative",
  "roll_positive",
  "roll_center",
] as const satisfies readonly PoseReviewCandidateRollGroup[]
const POSE_REVIEW_ROLL_BALANCE_INITIAL_TARGETS: Record<
  number,
  Record<PoseReviewCandidateRollGroup, number>
> = {
  5: {
    roll_center: 2,
    roll_negative: 1,
    roll_positive: 1,
  },
  4: {
    roll_center: 1,
    roll_negative: 1,
    roll_positive: 1,
  },
  3: {
    roll_center: 1,
    roll_negative: 1,
    roll_positive: 1,
  },
}
const POSE_REVIEW_ROLL_BALANCE_MAX_PER_GROUP: Record<
  number,
  Record<PoseReviewCandidateRollGroup, number>
> = {
  5: {
    roll_center: 2,
    roll_negative: 2,
    roll_positive: 2,
  },
  4: {
    roll_center: 2,
    roll_negative: 2,
    roll_positive: 2,
  },
  3: {
    roll_center: 3,
    roll_negative: 3,
    roll_positive: 3,
  },
}
const POSE_REVIEW_SHORTAGE_REASON =
  "not enough non-expressionTooStrong frames"
const EXPRESSION_TOO_STRONG_THRESHOLDS = {
  mouth: 0.35,
  eye: 0.35,
  brow: 0.35,
  maxAny: 0.45,
} as const
const EXPRESSION_MOUTH_CATEGORY_NAMES = [
  "jawOpen",
  "mouthSmileLeft",
  "mouthSmileRight",
  "mouthPucker",
  "mouthFunnel",
  "mouthShrugUpper",
  "mouthShrugLower",
] as const
const EXPRESSION_EYE_CATEGORY_NAMES = [
  "eyeBlinkLeft",
  "eyeBlinkRight",
  "eyeSquintLeft",
  "eyeSquintRight",
] as const
const EXPRESSION_BROW_CATEGORY_NAMES = [
  "browDownLeft",
  "browDownRight",
  "browInnerUp",
  "browOuterUpLeft",
  "browOuterUpRight",
] as const
const EXPRESSION_CATEGORY_NAMES = [
  ...EXPRESSION_MOUTH_CATEGORY_NAMES,
  ...EXPRESSION_EYE_CATEGORY_NAMES,
  ...EXPRESSION_BROW_CATEGORY_NAMES,
] as const
const ROTATION_FIT_DEBUG_PRESET_NAME = "rotationFitDebugPreset_provisional_v1"
const ROTATION_FIT_SEARCH_MODE = "rotation_center_yz_coarse"
const ROTATION_FIT_COMBINED_SEARCH_MODE = "rotation_center_yz_coarse_then_group_z"
const ROTATION_FIT_GROUP_Z_SEARCH_MODE = "group_z_search"
const ROTATION_FIT_FOCAL_LENGTH = 2.6
const ROTATION_FIT_ROTATION_CENTER_Y_RANGE: RotationFitSearchRange = {
  min: -0.24,
  max: 0.4,
  step: 0.02,
}
const ROTATION_FIT_ROTATION_CENTER_Z_RANGE: RotationFitSearchRange = {
  min: 0,
  max: 0.12,
  step: 0.01,
}
const ROTATION_FIT_TOP_CANDIDATE_LIMIT = 10
const ROTATION_FIT_BOUNDARY_EPSILON = 0.000001
const ROTATION_FIT_GROUP_Z_OFFSET_RANGE: RotationFitSearchRange = {
  min: -0.02,
  max: 0.02,
  step: 0.005,
}
const ROTATION_FIT_GROUP_Z_ITERATION_COUNT = 1
const ROTATION_FIT_GROUP_SEARCH_LOG_CANDIDATE_LIMIT = 10
const ROTATION_FIT_Z_GROUP_DEFINITIONS: RotationFitZGroupDefinition[] = [
  {
    id: "centerAxis",
    label: "centerAxis（中心軸）",
    pointIds: ["headTop", "upperFaceCenter", "noseBridge", "nose", "mouth", "chin"],
  },
  {
    id: "cheek",
    label: "cheek（頬）",
    pointIds: ["leftCheek", "rightCheek"],
  },
  {
    id: "jaw",
    label: "jaw（顎）",
    pointIds: ["leftJaw", "rightJaw"],
  },
  {
    id: "eye",
    label: "eye（目）",
    pointIds: ["leftEye", "rightEye"],
  },
]
const ROTATION_FIT_Z_GROUP_SEARCH_ORDER = ROTATION_FIT_Z_GROUP_DEFINITIONS.map(
  (definition) => definition.id,
)
const ROTATION_FIT_DEBUG_Z_BY_POINT_ID: Record<string, number> = {
  headTop: 0.017,
  chin: 0.016,
  leftCheek: 0.013,
  rightCheek: 0.013,
  leftEye: 0.011,
  rightEye: 0.011,
  nose: 0.005535,
  mouth: 0.01,
  noseBridge: 0.0075,
  leftJaw: 0.018,
  rightJaw: 0.018,
  upperFaceCenter: 0.012,
}
const ROTATION_FIT_FITTING_LAB_SEARCH_MODE = "fitting_lab_12pt_rotation_center"
const ROTATION_FIT_FITTING_LAB_ITERATION_COUNT = 2
const ROTATION_FIT_FINE_SEARCH_ENABLED = true
const ROTATION_FIT_FINE_SEARCH_STEP = 0.005
const ROTATION_FIT_FINE_SEARCH_RADIUS = 0.01
const ROTATION_FIT_FINE_SEARCH_ITERATION_COUNT = 1
const RENDER_ROTATION_FIT_INITIAL_CANDIDATE = {
  rotationCenter: {
    y: 0,
    z: 0.06,
  },
  zByPointId: {
    headTop: 0,
    chin: 0,
    leftCheek: 0,
    rightCheek: 0,
    leftEye: 0,
    rightEye: 0,
    nose: 0,
    mouth: 0,
    noseBridge: 0,
    leftJaw: 0,
    rightJaw: 0,
    upperFaceCenter: 0,
  },
} as const
const ROTATION_FIT_FITTING_LAB_PARAMETER_ORDER: RotationFitLocalSearchParameter[] = [
  "rotationCenter.y",
  "rotationCenter.z",
  "cheek.z",
  "nose.z",
  "mouth.z",
  "eye.z",
  "headTop.z",
  "chin.z",
  "noseBridge.z",
  "jaw.z",
  "upperFaceCenter.z",
]
const ROTATION_FIT_SYMMETRIC_Z_PARAMETERS = {
  "cheek.z": ["leftCheek.z", "rightCheek.z"],
  "eye.z": ["leftEye.z", "rightEye.z"],
  "jaw.z": ["leftJaw.z", "rightJaw.z"],
} as const
const ROTATION_FIT_SYMMETRIC_Z_POINT_IDS: Record<
  RotationFitSymmetricZSearchParameter,
  string[]
> = {
  "cheek.z": ["leftCheek", "rightCheek"],
  "eye.z": ["leftEye", "rightEye"],
  "jaw.z": ["leftJaw", "rightJaw"],
}
// Render Consistency Lab 用の uniform-ish debug range（統一寄りの検証用範囲）。
// Fitting Lab の 12点 z range をコピーした値ではなく、production asset（本番用アセット）でもない。
const RENDER_ROTATION_FIT_12PT_Z_RANGES = {
  headTop: { min: -0.03, max: 0.06, step: 0.01 },
  chin: { min: -0.03, max: 0.06, step: 0.01 },
  leftCheek: { min: -0.03, max: 0.08, step: 0.01 },
  rightCheek: { min: -0.03, max: 0.08, step: 0.01 },
  leftEye: { min: -0.03, max: 0.06, step: 0.01 },
  rightEye: { min: -0.03, max: 0.06, step: 0.01 },
  nose: { min: -0.03, max: 0.08, step: 0.01 },
  mouth: { min: -0.03, max: 0.08, step: 0.01 },
  noseBridge: { min: -0.03, max: 0.08, step: 0.01 },
  leftJaw: { min: -0.03, max: 0.08, step: 0.01 },
  rightJaw: { min: -0.03, max: 0.08, step: 0.01 },
  upperFaceCenter: { min: -0.03, max: 0.06, step: 0.01 },
} as const

const RENDER_ROTATION_FIT_COORDINATE_DESCENT_RANGES: Record<
  RotationFitLocalSearchParameter,
  RotationFitSearchRange
> = {
  "rotationCenter.y": { min: -0.05, max: 0.5, step: 0.01 },
  "rotationCenter.z": { min: 0, max: 0.12, step: 0.01 },
  "cheek.z": RENDER_ROTATION_FIT_12PT_Z_RANGES.leftCheek,
  "eye.z": RENDER_ROTATION_FIT_12PT_Z_RANGES.leftEye,
  "jaw.z": RENDER_ROTATION_FIT_12PT_Z_RANGES.leftJaw,
  "headTop.z": RENDER_ROTATION_FIT_12PT_Z_RANGES.headTop,
  "chin.z": RENDER_ROTATION_FIT_12PT_Z_RANGES.chin,
  "nose.z": RENDER_ROTATION_FIT_12PT_Z_RANGES.nose,
  "mouth.z": RENDER_ROTATION_FIT_12PT_Z_RANGES.mouth,
  "noseBridge.z": RENDER_ROTATION_FIT_12PT_Z_RANGES.noseBridge,
  "upperFaceCenter.z": RENDER_ROTATION_FIT_12PT_Z_RANGES.upperFaceCenter,
}
const EYE_POINT_INDICES = {
  leftIris: [474, 475, 476, 477],
  rightIris: [469, 470, 471, 472],
  leftContour: [263, 362],
  rightContour: [33, 133],
  leftBrow: [276, 282, 283, 285, 295],
  rightBrow: [46, 52, 53, 55, 65],
} as const

const ROTATION_CENTER_12_SEMANTIC_DEFINITIONS: SemanticPointDefinition[] = [
  { id: "headTop", label: "頭頂", primaryIndices: [10] },
  { id: "chin", label: "顎", primaryIndices: [152] },
  { id: "leftCheek", label: "左頬", primaryIndices: [234] },
  { id: "rightCheek", label: "右頬", primaryIndices: [454] },
  { id: "leftEye", label: "左目中心", primaryIndices: [474, 475, 476, 477], fallbackIndices: [263, 362] },
  { id: "rightEye", label: "右目中心", primaryIndices: [469, 470, 471, 472], fallbackIndices: [33, 133] },
  { id: "nose", label: "鼻", primaryIndices: [4] },
  { id: "mouth", label: "口中心", primaryIndices: [13, 14] },
  { id: "noseBridge", label: "鼻筋", primaryIndices: [6] },
  { id: "leftJaw", label: "左顎ライン", primaryIndices: [172] },
  { id: "rightJaw", label: "右顎ライン", primaryIndices: [397] },
  { id: "upperFaceCenter", label: "上顔面中心", primaryIndices: [168] },
]

function createInitialScanState(status: ScanStatus = "idle"): ScanState {
  return {
    status,
    scanFrameStepSeconds: SCAN_FRAME_STEP_SECONDS,
    maxScanDurationSec: MAX_SCAN_DURATION_SEC,
    maxScanFrames: MAX_SCAN_FRAMES,
    scannedFrameCount: 0,
    acceptedFrameCount: 0,
    discardedNoFaceCount: 0,
    discardedInvalidLandmarkCount: 0,
    progress: 0,
  }
}

const state: AppState = {
  loadStatus: "未読込",
  detectorStatus: "未初期化",
  detectorError: null,
  fileError: null,
  metadata: null,
  summary: null,
  pose: null,
  observed12pt: [],
  eyePointMode: DEFAULT_EYE_POINT_MODE,
  acceptedFrames: [],
  currentReviewIndex: 0,
  scanState: createInitialScanState(),
  manualAdjustmentsByFrame: {},
  poseReviewCandidateSummary: null,
  rotationFitEvaluation: null,
  selectedLandmarkSummaryPointId: null,
  draggingLandmarkSummaryPointId: null,
  showLandmarkSummaryOverlay: true,
  consoleTab: "summary",
  rawJsonCopyStatus: null,
}

let faceLandmarker: FaceLandmarker | null = null
let objectUrl: string | null = null
let detectorReadyPromise: Promise<void> | null = null
let scanCancelRequested = false
let activeScanId = 0
let thumbnailRenderToken = 0

const app = getElement("app")

app.innerHTML = `
  <main class="app-shell">
    <section class="left-panel panel">
      <div class="title-block">
        <h1>MediaPipe Render Consistency Lab</h1>
        <p>MediaPipe レンダー一貫性検証ラボ</p>
      </div>

      <section class="controls-section">
        <h2>Input / Controls（入力・操作）</h2>
        <label class="file-picker">
          <span>MP4 ファイル</span>
          <input id="mp4Input" type="file" accept="video/mp4,.mp4" />
        </label>
      </section>

      <section class="controls-section">
        <h2>Scan（スキャン）</h2>
        <p id="controlStatus" class="control-status">状態: 未読込</p>
        <button id="stopScanButton" type="button" class="secondary-button">
          自動スキャン停止
        </button>
      </section>

      <section class="controls-section">
        <h2>姿勢レビュー候補</h2>
        <button id="extractPoseReviewCandidatesButton" type="button" class="secondary-button">
          125候補フレーム抽出
        </button>
        <p class="control-help">yaw×pitch 25分類 × 最大5件。expressionTooStrong は除外。</p>
        <div id="poseReviewCandidateSummary" class="status-grid compact-status-grid"></div>
      </section>

      <section class="controls-section">
        <h2>Rotation Fit（回転中心評価）</h2>
        <button id="rotationFitEvaluationButton" type="button" class="secondary-button">
          回転中心評価・粗探索
        </button>
        <p class="control-help">
          Fitting Lab から踏襲するのは coordinate descent（座標降下探索）の手順のみです。<br />
          rotationCenter range（回転中心探索範囲）と 12点 z range（12点奥行き探索範囲）は Render Consistency Lab 用に再定義しています。
        </p>
      </section>

      <section class="controls-section">
        <h2>Overlay（表示）</h2>
        <button id="toggleLandmarkSummaryButton" type="button" class="toggle-button">
          12点サマリを非表示
        </button>
      </section>
    </section>

    <section class="center-panel panel">
      <div class="panel-heading">
        <h2>1フレーム目サムネイル</h2>
      </div>
      <div class="thumbnail-frame">
        <canvas id="thumbnailCanvas" width="1280" height="720"></canvas>
        <p id="thumbnailEmpty" class="empty-message">MP4 を読み込むとサムネイルを表示します。</p>
      </div>
      <div class="frame-controls">
        <button id="previousFrameButton" type="button" class="frame-button">前へ</button>
        <button id="excludeFrameButton" type="button" class="frame-button danger">削除</button>
        <button id="nextFrameButton" type="button" class="frame-button">次へ</button>
      </div>
      <p class="frame-help">削除 = このフレームを検証対象から除外</p>
      <div id="frameInfoGrid" class="status-grid frame-info-grid"></div>
      <video id="sourceVideo" muted playsinline preload="metadata"></video>
    </section>

    <section class="right-panel panel console-panel">
      <h2>Debug Console（デバッグコンソール）</h2>
      <div class="console-tabs" role="tablist" aria-label="Debug Console">
        <button type="button" class="console-tab-button" data-console-tab="summary">Summary</button>
        <button type="button" class="console-tab-button" data-console-tab="currentFrame">Current</button>
        <button type="button" class="console-tab-button" data-console-tab="landmarks12pt">12pt</button>
        <button type="button" class="console-tab-button" data-console-tab="adjustments">Adjustments</button>
        <button type="button" class="console-tab-button" data-console-tab="scan">Scan</button>
        <button type="button" class="console-tab-button" data-console-tab="pose">Pose（姿勢）</button>
        <button type="button" class="console-tab-button" data-console-tab="candidates">Candidates</button>
        <button type="button" class="console-tab-button" data-console-tab="rotationFit">Rotation Fit（回転中心評価）</button>
        <button type="button" class="console-tab-button" data-console-tab="raw">Raw</button>
      </div>
      <div id="consoleContent" class="console-content"></div>
    </section>
  </main>
`

const fileInput = getElement<HTMLInputElement>("mp4Input")
const video = getElement<HTMLVideoElement>("sourceVideo")
const canvas = getElement<HTMLCanvasElement>("thumbnailCanvas")
const thumbnailEmpty = getElement<HTMLParagraphElement>("thumbnailEmpty")
const controlStatus = getElement("controlStatus")
const frameInfoGrid = getElement("frameInfoGrid")
const consoleContent = getElement("consoleContent")
const toggleLandmarkSummaryButton = getElement<HTMLButtonElement>("toggleLandmarkSummaryButton")
const extractPoseReviewCandidatesButton = getElement<HTMLButtonElement>(
  "extractPoseReviewCandidatesButton",
)
const rotationFitEvaluationButton = getElement<HTMLButtonElement>("rotationFitEvaluationButton")
const poseReviewCandidateSummary = getElement("poseReviewCandidateSummary")
const previousFrameButton = getElement<HTMLButtonElement>("previousFrameButton")
const excludeFrameButton = getElement<HTMLButtonElement>("excludeFrameButton")
const nextFrameButton = getElement<HTMLButtonElement>("nextFrameButton")
const stopScanButton = getElement<HTMLButtonElement>("stopScanButton")
const consoleTabButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-console-tab]"),
)

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0] ?? null
  void handleFile(file)
})

toggleLandmarkSummaryButton.addEventListener("click", () => {
  state.showLandmarkSummaryOverlay = !state.showLandmarkSummaryOverlay
  renderThumbnailCanvas()
  render()
})

extractPoseReviewCandidatesButton.addEventListener("click", () => {
  extractPoseReviewCandidates()
})

rotationFitEvaluationButton.addEventListener("click", () => {
  runRotationFitEvaluation()
})

previousFrameButton.addEventListener("click", () => {
  void moveFrameBy(-1)
})

nextFrameButton.addEventListener("click", () => {
  void moveFrameBy(1)
})

excludeFrameButton.addEventListener("click", () => {
  void excludeCurrentFrame()
})

stopScanButton.addEventListener("click", () => {
  scanCancelRequested = true
})

canvas.addEventListener("pointerdown", (event) => {
  handleCanvasPointerDown(event)
})

canvas.addEventListener("pointermove", (event) => {
  handleCanvasPointerMove(event)
})

canvas.addEventListener("pointerup", (event) => {
  handleCanvasPointerEnd(event)
})

canvas.addEventListener("pointercancel", (event) => {
  handleCanvasPointerEnd(event)
})

for (const button of consoleTabButtons) {
  button.addEventListener("click", () => {
    state.consoleTab = button.dataset.consoleTab as ConsoleTab
    render()
  })
}

consoleContent.addEventListener("click", (event) => {
  const action = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-console-action]")
  if (!action) {
    return
  }

  if (action.dataset.consoleAction === "reset-selected") {
    resetSelectedLandmarkAdjustment()
    return
  }

  if (action.dataset.consoleAction === "reset-current-frame") {
    resetCurrentFrameLandmarkAdjustments()
    renderThumbnailCanvas()
    render()
  }

  if (action.dataset.consoleAction === "copy-raw-json") {
    void copyRawJsonToClipboard(action.dataset.rawJsonSource)
  }
})

render()
detectorReadyPromise = initializeDetector()

async function initializeDetector(): Promise<void> {
  state.detectorStatus = "初期化中"
  state.detectorError = null
  render()

  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
    )

    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      },
      runningMode: "VIDEO",
      numFaces: 1,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
    })

    state.detectorStatus = "準備完了"
  } catch (error) {
    state.detectorStatus = "エラー"
    state.detectorError = error instanceof Error ? error.message : String(error)
  }

  render()
}

async function handleFile(file: File | null): Promise<void> {
  activeScanId += 1
  scanCancelRequested = true
  resetFrameState()

  if (!file) {
    state.loadStatus = "未読込"
    render()
    return
  }

  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
  }

  state.loadStatus = "読込中"
  objectUrl = URL.createObjectURL(file)
  render()

  try {
    await loadVideoMetadata(objectUrl)

    state.metadata = {
      fileName: file.name,
      fileSize: file.size,
      duration: video.duration,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
    }

    await startAutoScan()
  } catch (error) {
    state.loadStatus = "エラー"
    state.fileError = error instanceof Error ? error.message : String(error)
    state.scanState = {
      ...state.scanState,
      status: "error",
      error: state.fileError,
    }
    state.summary = {
      detected: false,
      landmarkCount: 0,
      blendshapeCount: 0,
      hasFacialTransformationMatrix: false,
      error: state.fileError,
    }
    state.observed12pt = []
    state.selectedLandmarkSummaryPointId = null
    state.draggingLandmarkSummaryPointId = null
    clearCanvas()
  }

  render()
}

function resetFrameState(): void {
  state.fileError = null
  state.metadata = null
  state.summary = null
  state.pose = null
  state.observed12pt = []
  state.acceptedFrames = []
  state.currentReviewIndex = 0
  state.scanState = createInitialScanState()
  state.manualAdjustmentsByFrame = {}
  state.poseReviewCandidateSummary = null
  state.rotationFitEvaluation = null
  state.selectedLandmarkSummaryPointId = null
  state.draggingLandmarkSummaryPointId = null
  clearCanvas()
}

function loadVideoMetadata(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = (): void => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("error", handleError)
    }

    const handleLoadedMetadata = (): void => {
      cleanup()
      resolve()
    }

    const handleError = (): void => {
      cleanup()
      reject(new Error("動画メタ情報を読み込めませんでした。"))
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true })
    video.addEventListener("error", handleError, { once: true })
    video.src = url
    video.load()
  })
}

async function startAutoScan(): Promise<void> {
  const scanId = activeScanId
  scanCancelRequested = false
  state.acceptedFrames = []
  state.currentReviewIndex = 0
  state.summary = null
  state.pose = null
  state.observed12pt = []
  state.selectedLandmarkSummaryPointId = null
  state.draggingLandmarkSummaryPointId = null
  state.poseReviewCandidateSummary = null
  state.loadStatus = "解析中"
  state.scanState = createInitialScanState("running")
  clearCanvas()
  render()

  if (detectorReadyPromise) {
    await detectorReadyPromise
  }

  if (!faceLandmarker) {
    throw new Error("MediaPipe Face Landmarker が初期化されていません。")
  }

  prepareThumbnailCanvas()
  const scanDurationSec = Math.min(video.duration, MAX_SCAN_DURATION_SEC)
  const scanFrameLimit = Math.min(
    MAX_SCAN_FRAMES,
    Math.max(0, Math.ceil(scanDurationSec / SCAN_FRAME_STEP_SECONDS)),
  )

  for (let sourceFrameIndex = 0; sourceFrameIndex < scanFrameLimit; sourceFrameIndex += 1) {
    if (scanId !== activeScanId) {
      return
    }

    if (scanCancelRequested) {
      state.scanState = {
        ...state.scanState,
        status: "cancelled",
      }
      break
    }

    const timeSec = sourceFrameIndex * SCAN_FRAME_STEP_SECONDS
    if (timeSec >= scanDurationSec) {
      break
    }

    await seekVideoToTime(timeSec)
    if (scanId !== activeScanId) {
      return
    }
    if (scanCancelRequested) {
      state.scanState = {
        ...state.scanState,
        status: "cancelled",
      }
      break
    }

    drawVideoFrameToCanvas()

    const acceptedFrame = analyzeCanvasForAcceptedFrame(
      sourceFrameIndex,
      roundDebugNumber(timeSec),
    )

    state.scanState = {
      ...state.scanState,
      scannedFrameCount: state.scanState.scannedFrameCount + 1,
      progress: scanFrameLimit > 0
        ? roundDebugNumber((sourceFrameIndex + 1) / scanFrameLimit)
        : 1,
    }

    if (acceptedFrame) {
      state.acceptedFrames = [...state.acceptedFrames, acceptedFrame]
      state.scanState = {
        ...state.scanState,
        acceptedFrameCount: state.acceptedFrames.length,
      }
    }

    if (sourceFrameIndex % 10 === 0 || acceptedFrame) {
      render()
      await new Promise((resolve) => requestAnimationFrame(resolve))
    }
  }

  if (state.scanState.status === "running") {
    state.scanState = {
      ...state.scanState,
      status: "completed",
      progress: 1,
    }
  }

  state.currentReviewIndex = 0
  applyCurrentAcceptedFrame()
  state.loadStatus = "完了"
  renderThumbnailCanvas()
  render()
}

function seekVideoToTime(timeSec: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = (): void => {
      video.removeEventListener("seeked", handleSeeked)
      video.removeEventListener("error", handleError)
    }

    const handleSeeked = (): void => {
      cleanup()
      resolve()
    }

    const handleError = (): void => {
      cleanup()
      reject(new Error("対象フレームへ seek できませんでした。"))
    }

    video.addEventListener("seeked", handleSeeked, { once: true })
    video.addEventListener("error", handleError, { once: true })

    const targetTime = clamp(timeSec, 0, Math.max(video.duration, 0))
    if (Math.abs(video.currentTime - targetTime) < 0.0001) {
      cleanup()
      requestAnimationFrame(() => resolve())
      return
    }

    video.currentTime = targetTime
  })
}

async function moveFrameBy(delta: number): Promise<void> {
  if (!state.metadata || state.scanState.status === "running") {
    return
  }

  goToReviewIndex(state.currentReviewIndex + delta)
}

function goToReviewIndex(reviewIndex: number): void {
  if (!state.metadata || state.acceptedFrames.length === 0) {
    return
  }

  state.currentReviewIndex = Math.trunc(
    clamp(reviewIndex, 0, state.acceptedFrames.length - 1),
  )
  state.selectedLandmarkSummaryPointId = null
  state.draggingLandmarkSummaryPointId = null
  applyCurrentAcceptedFrame()
  renderThumbnailCanvas()
  render()
}

async function excludeCurrentFrame(): Promise<void> {
  if (!state.metadata || state.scanState.status === "running") {
    return
  }

  const currentFrame = getCurrentAcceptedFrame()
  if (!currentFrame) {
    return
  }

  state.acceptedFrames = state.acceptedFrames.map((frame, index) =>
    index === state.currentReviewIndex
      ? { ...frame, excluded: true, excludedReason: "manual" }
      : frame,
  )

  const nextReviewIndex = findNextUnexcludedReviewIndex(state.currentReviewIndex + 1)
  if (nextReviewIndex !== null) {
    goToReviewIndex(nextReviewIndex)
    return
  }

  applyCurrentAcceptedFrame()
  renderThumbnailCanvas()
  render()
}

function extractPoseReviewCandidates(): void {
  if (state.acceptedFrames.length === 0 || state.scanState.status === "running") {
    return
  }

  state.poseReviewCandidateSummary = buildPoseReviewCandidateSummary()
  state.rotationFitEvaluation = null
  state.consoleTab = "candidates"
  render()
}

function buildPoseReviewCandidateSummary(): PoseReviewCandidateSummary {
  const trialSummaries = POSE_REVIEW_BALANCED_TARGET_CANDIDATES.map((targetPerBucket) =>
    buildPoseReviewCandidateSummaryForTarget(targetPerBucket),
  )
  return (
    trialSummaries.find((summary) => summary.shortageBucketCount === 0) ??
    trialSummaries[trialSummaries.length - 1]
  )
}

function buildPoseReviewCandidateSummaryForTarget(
  targetPerBucket: number,
): PoseReviewCandidateSummary {
  const excludedExpressionTooStrongCount = getExpressionTooStrongCount()
  const usableFrames = state.acceptedFrames.filter(
    (frame) => !hasFrameBadge(frame, "expressionTooStrong") && frame.poseBucket125,
  )

  const buckets = POSE_REVIEW_YAW_PITCH_BUCKET_DEFINITIONS.map((definition) => {
    const framesInBucket = usableFrames.filter((frame) => {
      const poseBucket = frame.poseBucket125
      if (!poseBucket) {
        return false
      }

      return poseBucket.yawBin === definition.yawBin && poseBucket.pitchBin === definition.pitchBin
    })
    const rollFramesByGroup = groupPoseReviewFramesByRollGroup(framesInBucket)
    const selectedFrames = selectRollBalancedCandidateFrames(rollFramesByGroup, targetPerBucket)
    const selectedCount = selectedFrames.length

    return {
      ...definition,
      targetCount: targetPerBucket,
      selectedCount,
      shortageCount: Math.max(0, targetPerBucket - selectedCount),
      selectedByRollNegativeCount: selectedFrames.filter(
        (frame) => frame.rollGroup === "roll_negative",
      ).length,
      selectedByRollCenterCount: selectedFrames.filter(
        (frame) => frame.rollGroup === "roll_center",
      ).length,
      selectedByRollPositiveCount: selectedFrames.filter(
        (frame) => frame.rollGroup === "roll_positive",
      ).length,
      availableRollNegativeCount: rollFramesByGroup.roll_negative.length,
      availableRollCenterCount: rollFramesByGroup.roll_center.length,
      availableRollPositiveCount: rollFramesByGroup.roll_positive.length,
      shortageReason:
        selectedCount < targetPerBucket ? POSE_REVIEW_SHORTAGE_REASON : undefined,
      selectedFrames,
    }
  })
  const selectedTotal = buckets.reduce((sum, bucket) => sum + bucket.selectedCount, 0)
  const shortageBucketCount = buckets.filter((bucket) => bucket.shortageCount > 0).length
  const balancedStatus: PoseReviewCandidateBalancedStatus =
    shortageBucketCount === 0 ? "balanced" : "partial"
  const shortageBuckets = buildPoseReviewShortageBucketSummaries(buckets)

  return {
    selectionMode: POSE_REVIEW_SELECTION_MODE,
    maxTargetPerBucket: POSE_REVIEW_MAX_TARGET_PER_BUCKET,
    minBalancedTargetPerBucket: POSE_REVIEW_MIN_BALANCED_TARGET_PER_BUCKET,
    actualTargetPerBucket: targetPerBucket,
    rollSelection: POSE_REVIEW_ROLL_SELECTION,
    rollGroups: POSE_REVIEW_ROLL_GROUPS,
    balancedStatus,
    policy: {
      selectionMode: POSE_REVIEW_SELECTION_MODE,
      primaryGrouping: "yaw_pitch_25",
      maxTargetPerBucket: POSE_REVIEW_MAX_TARGET_PER_BUCKET,
      minBalancedTargetPerBucket: POSE_REVIEW_MIN_BALANCED_TARGET_PER_BUCKET,
      actualTargetPerBucket: targetPerBucket,
      rollSelection: POSE_REVIEW_ROLL_SELECTION,
      rollGroups: POSE_REVIEW_ROLL_GROUPS,
      expressionTooStrong: "exclude",
      sampling: "evenly_spaced_by_time",
    },
    targetTotal: POSE_REVIEW_YAW_PITCH_BUCKET_COUNT * targetPerBucket,
    selectedTotal,
    fullBucketCount: buckets.filter((bucket) => bucket.shortageCount === 0).length,
    shortageBucketCount,
    excludedExpressionTooStrongCount,
    shortageBuckets,
    buckets,
  }
}

function runRotationFitEvaluation(): void {
  state.rotationFitEvaluation = evaluateRotationFit()
  state.consoleTab = "rotationFit"
  render()
}

function evaluateRotationFit(): RotationFitEvaluation {
  const videoAspectRatio = getVideoAspectRatio()
  const fixedRotationCenterX = roundDebugNumber(0.5 * videoAspectRatio)
  const baseEvaluation = createEmptyRotationFitEvaluation(
    videoAspectRatio,
    {
      x: fixedRotationCenterX,
      y: RENDER_ROTATION_FIT_INITIAL_CANDIDATE.rotationCenter.y,
      z: RENDER_ROTATION_FIT_INITIAL_CANDIDATE.rotationCenter.z,
    },
    0,
  )

  const evaluationFrames = getRotationFitEvaluationFrames()
  if (state.acceptedFrames.length === 0) {
    return {
      ...baseEvaluation,
      status: "error",
      error: "acceptedFrames がありません。先に MP4 auto scan（自動スキャン）を実行してください。",
    }
  }
  if (!state.poseReviewCandidateSummary) {
    return {
      ...baseEvaluation,
      status: "error",
      error: "pose review candidates（姿勢レビュー候補）が未作成です。先に125候補フレーム抽出を実行してください。",
    }
  }
  if (evaluationFrames.length === 0) {
    return {
      ...baseEvaluation,
      status: "error",
      error: "評価できる selected frames（選択済みフレーム）がありません。",
    }
  }

  const baseFrame = selectRotationFitBaseFrame(evaluationFrames)
  if (!baseFrame) {
    return {
      ...baseEvaluation,
      status: "error",
      error: "base12pt（基準12点）を作れる正面候補フレームがありません。",
    }
  }

  const baseAdjusted12pt = getAdjusted12ptForFrame(baseFrame.frame)
  const base12pt = createRotationFitBase12pt(baseAdjusted12pt, videoAspectRatio)
  const missingBasePointIds = ROTATION_CENTER_12_SEMANTIC_DEFINITIONS.map(
    (definition) => definition.id,
  ).filter((pointId) => !base12pt[pointId])
  if (missingBasePointIds.length > 0) {
    return {
      ...baseEvaluation,
      status: "error",
      error: `base12pt（基準12点）に不足があります: ${missingBasePointIds.join(", ")}`,
      baseFrameSource: {
        sourceFrameIndex: baseFrame.frame.sourceFrameIndex,
        timeSec: roundDebugNumber(baseFrame.frame.timeSec),
        reason: baseFrame.reason,
      },
    }
  }

  const fittingLabSearch = evaluateRotationFitFittingLab12ptSearch({
    evaluationFrames,
    baseAdjusted12pt,
    videoAspectRatio,
    fixedRotationCenterX,
  })
  const bestCandidate = fittingLabSearch.bestCandidate
  const initialCandidate = fittingLabSearch.initialCandidate

  if (!bestCandidate || bestCandidate.frameScores.length === 0 || !initialCandidate) {
    return {
      ...baseEvaluation,
      status: "error",
      error: "評価対象フレームに pose（姿勢）または adjusted12pt（手動調整後12点）がありません。",
      baseFrameSource: {
        sourceFrameIndex: baseFrame.frame.sourceFrameIndex,
        timeSec: roundDebugNumber(baseFrame.frame.timeSec),
        reason: baseFrame.reason,
      },
    }
  }

  const improvement = createRotationFitImprovement(initialCandidate, bestCandidate)
  const coordinateBoundaryStatus = fittingLabSearch.coordinateBoundaryStatus

  return {
    ...baseEvaluation,
    status: "completed",
    searchMode: ROTATION_FIT_FITTING_LAB_SEARCH_MODE,
    candidateCount: fittingLabSearch.coordinateDescentLog.reduce(
      (sum, step) => sum + step.candidateCount,
      0,
    ),
    evaluationFrameCount: bestCandidate.frameScores.length,
    baseFrameSource: {
      sourceFrameIndex: baseFrame.frame.sourceFrameIndex,
      timeSec: roundDebugNumber(baseFrame.frame.timeSec),
      reason: baseFrame.reason,
    },
    rotationCenter: bestCandidate.rotationCenter,
    bestRotationCenter: bestCandidate.rotationCenter,
    boundaryStatus: calculateRotationFitSearchBoundaryStatus(bestCandidate.rotationCenter),
    totalScore: bestCandidate.totalScore,
    maxFrameScore: bestCandidate.maxFrameScore,
    worstFrame: bestCandidate.worstFrame,
    worstPoint: bestCandidate.worstPoint,
    frameScores: bestCandidate.frameScores,
    pointScores: bestCandidate.pointScores,
    bucketScores: bestCandidate.bucketScores,
    bestCandidate,
    topCandidates: [createRotationFitCandidateSummary(bestCandidate)],
    fittingLab12ptSearch: fittingLabSearch,
    coordinateDescentLog: fittingLabSearch.coordinateDescentLog,
    coordinateBoundaryStatus,
    improvement,
    finalZByPointId: bestCandidate.zByPointId,
  }
}

function createEmptyRotationFitEvaluation(
  videoAspectRatio: number,
  rotationCenter: Point3D,
  candidateCount: number,
): RotationFitEvaluation {
  return {
    status: "completed",
    searchMode: ROTATION_FIT_FITTING_LAB_SEARCH_MODE,
    searchRange: {
      y: RENDER_ROTATION_FIT_COORDINATE_DESCENT_RANGES["rotationCenter.y"],
      z: RENDER_ROTATION_FIT_COORDINATE_DESCENT_RANGES["rotationCenter.z"],
    },
    candidateCount,
    evaluationFrameCount: 0,
    baseFrameSource: null,
    videoAspectRatio,
    rotationCenter,
    bestRotationCenter: null,
    boundaryStatus: {
      bestYAtMin: false,
      bestYAtMax: false,
      bestZAtMin: false,
      bestZAtMax: false,
    },
    zPresetName: "renderUniformDebugInitial",
    fixedZPresetName: "renderUniformDebugInitial",
    focalLength: ROTATION_FIT_FOCAL_LENGTH,
    totalScore: 0,
    maxFrameScore: 0,
    worstFrame: null,
    worstPoint: null,
    frameScores: [],
    pointScores: [],
    bucketScores: {
      yaw: [],
      pitch: [],
      roll: [],
      yawPitch: [],
    },
    bestCandidate: null,
    topCandidates: [],
    debugPreset: {
      zByPointId: RENDER_ROTATION_FIT_INITIAL_CANDIDATE.zByPointId,
    },
  }
}

function createRotationFitCandidateRotationCenters(fixedRotationCenterX: number): Point3D[] {
  const yCandidates = createRotationFitRangeCandidates(ROTATION_FIT_ROTATION_CENTER_Y_RANGE)
  const zCandidates = createRotationFitRangeCandidates(ROTATION_FIT_ROTATION_CENTER_Z_RANGE)
  return yCandidates.flatMap((y) =>
    zCandidates.map((z) => ({
      x: fixedRotationCenterX,
      y,
      z,
    })),
  )
}

function createRotationFitRangeCandidates(range: RotationFitSearchRange): number[] {
  const candidateCount = Math.floor((range.max - range.min) / range.step + 0.5) + 1
  return Array.from({ length: candidateCount }, (_, index) =>
    roundDebugNumber(range.min + range.step * index),
  ).filter((value) => value <= range.max + range.step * 0.001)
}

function createRotationFitFineRangeCandidates(
  centerValue: number,
  baseRange: RotationFitSearchRange,
): number[] {
  const candidateCount =
    Math.floor((ROTATION_FIT_FINE_SEARCH_RADIUS * 2) / ROTATION_FIT_FINE_SEARCH_STEP + 0.5) + 1
  const values = Array.from({ length: candidateCount }, (_, index) => {
    const rawValue =
      centerValue - ROTATION_FIT_FINE_SEARCH_RADIUS + ROTATION_FIT_FINE_SEARCH_STEP * index
    return roundDebugNumber(clamp(rawValue, baseRange.min, baseRange.max))
  })
  return Array.from(new Set(values)).sort((left, right) => left - right)
}

function evaluateRotationFitFittingLab12ptSearch(options: {
  evaluationFrames: Array<{ frame: AcceptedFrameSnapshot; candidate: PoseReviewCandidateFrame }>
  baseAdjusted12pt: LandmarkSummaryPoint[]
  videoAspectRatio: number
  fixedRotationCenterX: number
}): RotationFitFittingLab12ptSearch {
  const initialState = createRotationFitFittingLabInitialCandidateState(options.fixedRotationCenterX)
  const initialCandidate = evaluateRotationFitCandidateFromState(options, initialState)
  const coarseResult = runRotationFitCoordinateDescentStage(options, {
    stage: "coarse",
    baseState: initialState,
    baseCandidate: initialCandidate,
    iterationCount: ROTATION_FIT_FITTING_LAB_ITERATION_COUNT,
    createParameterValues: (parameter) =>
      createRotationFitRangeCandidates(RENDER_ROTATION_FIT_COORDINATE_DESCENT_RANGES[parameter]),
  })
  const fineResult = ROTATION_FIT_FINE_SEARCH_ENABLED
    ? runRotationFitCoordinateDescentStage(options, {
        stage: "fine",
        baseState: coarseResult.currentState,
        baseCandidate: coarseResult.currentCandidate,
        iterationCount: ROTATION_FIT_FINE_SEARCH_ITERATION_COUNT,
        createParameterValues: (parameter, stateCandidate) =>
          createRotationFitFineRangeCandidates(
            getRotationFitCandidateStateParameter(stateCandidate, parameter),
            RENDER_ROTATION_FIT_COORDINATE_DESCENT_RANGES[parameter],
          ),
      })
    : {
        currentState: coarseResult.currentState,
        currentCandidate: coarseResult.currentCandidate,
        coordinateDescentLog: [] as RotationFitCoordinateDescentStepLog[],
      }

  const coordinateDescentLog = [
    ...coarseResult.coordinateDescentLog,
    ...fineResult.coordinateDescentLog,
  ]
  const coordinateBoundaryStatus = calculateRotationFitCoordinateBoundaryStatus(
    fineResult.currentCandidate,
  )
  const coarseParameterImprovements =
    createRotationFitParameterImprovementsFromCoordinateDescentLog(
      coarseResult.coordinateDescentLog,
    )
  const fineParameterImprovements =
    createRotationFitParameterImprovementsFromCoordinateDescentLog(fineResult.coordinateDescentLog)
  const parameterImprovements = fineParameterImprovements

  return {
    searchMode: ROTATION_FIT_FITTING_LAB_SEARCH_MODE,
    sourceLab: "tools/ideal-face-fitting-lab",
    sourcePointSetId: "12pt_rotation_center",
    coordinateSystemSource: "render_adjusted12pt_aspect_corrected",
    rangeSource: "render_consistency_lab",
    zRangeSource: "render_consistency_lab_uniform_debug_range",
    fittingLabAlgorithmOnly: true,
    baseCandidatePresetId: "renderUniformDebugInitial",
    candidateGeneration: "coordinateDescent",
    coordinateDescentIterations: ROTATION_FIT_FITTING_LAB_ITERATION_COUNT,
    coordinateDescentParameterOrder: ROTATION_FIT_FITTING_LAB_PARAMETER_ORDER,
    coordinateDescentRanges: RENDER_ROTATION_FIT_COORDINATE_DESCENT_RANGES,
    zSymmetryMode: "paired_left_right",
    symmetricZParameters: {
      "cheek.z": [...ROTATION_FIT_SYMMETRIC_Z_PARAMETERS["cheek.z"]],
      "eye.z": [...ROTATION_FIT_SYMMETRIC_Z_PARAMETERS["eye.z"]],
      "jaw.z": [...ROTATION_FIT_SYMMETRIC_Z_PARAMETERS["jaw.z"]],
    },
    fineSearchEnabled: ROTATION_FIT_FINE_SEARCH_ENABLED,
    fineSearchStep: ROTATION_FIT_FINE_SEARCH_STEP,
    fineSearchRadius: ROTATION_FIT_FINE_SEARCH_RADIUS,
    fineSearchIterations: ROTATION_FIT_FINE_SEARCH_ITERATION_COUNT,
    coarseTotalScore: coarseResult.currentCandidate.totalScore,
    fineTotalScore: fineResult.currentCandidate.totalScore,
    fineImprovement: roundDebugNumber(
      coarseResult.currentCandidate.totalScore - fineResult.currentCandidate.totalScore,
    ),
    leftRightZSymmetryDiagnostics: calculateRotationFitLeftRightZSymmetryDiagnostics(
      fineResult.currentCandidate.zByPointId,
    ),
    searchStages: {
      coarse: {
        step: RENDER_ROTATION_FIT_COORDINATE_DESCENT_RANGES["rotationCenter.y"].step,
        iterationCount: ROTATION_FIT_FITTING_LAB_ITERATION_COUNT,
        bestCandidate: coarseResult.currentCandidate,
        coordinateDescentLog: coarseResult.coordinateDescentLog,
        parameterImprovements: coarseParameterImprovements,
        parameterImprovementSummary: createRotationFitParameterImprovementSummary({
          initialCandidate,
          bestCandidate: coarseResult.currentCandidate,
          parameterImprovements: coarseParameterImprovements,
          coordinateBoundaryStatus: calculateRotationFitCoordinateBoundaryStatus(
            coarseResult.currentCandidate,
          ),
        }),
      },
      fine: {
        enabled: ROTATION_FIT_FINE_SEARCH_ENABLED,
        step: ROTATION_FIT_FINE_SEARCH_STEP,
        radius: ROTATION_FIT_FINE_SEARCH_RADIUS,
        iterationCount: ROTATION_FIT_FINE_SEARCH_ITERATION_COUNT,
        bestCandidate: fineResult.currentCandidate,
        coordinateDescentLog: fineResult.coordinateDescentLog,
        parameterImprovements: fineParameterImprovements,
        parameterImprovementSummary: createRotationFitParameterImprovementSummary({
          initialCandidate: coarseResult.currentCandidate,
          bestCandidate: fineResult.currentCandidate,
          parameterImprovements: fineParameterImprovements,
          coordinateBoundaryStatus,
        }),
      },
    },
    coordinateBoundaryStatus,
    initialCandidate,
    bestCandidate: fineResult.currentCandidate,
    finalZByPointId: fineResult.currentCandidate.zByPointId,
    coordinateDescentLog,
    parameterImprovements,
    parameterImprovementSummary: createRotationFitParameterImprovementSummary({
      initialCandidate: coarseResult.currentCandidate,
      bestCandidate: fineResult.currentCandidate,
      parameterImprovements,
      coordinateBoundaryStatus,
    }),
  }
}

function runRotationFitCoordinateDescentStage(
  options: {
    evaluationFrames: Array<{ frame: AcceptedFrameSnapshot; candidate: PoseReviewCandidateFrame }>
    baseAdjusted12pt: LandmarkSummaryPoint[]
    videoAspectRatio: number
  },
  stageOptions: {
    stage: "coarse" | "fine"
    baseState: { rotationCenter: Point3D; zByPointId: Record<string, number> }
    baseCandidate: RotationFitCandidateResult
    iterationCount: number
    createParameterValues: (
      parameter: RotationFitLocalSearchParameter,
      stateCandidate: { rotationCenter: Point3D; zByPointId: Record<string, number> },
    ) => number[]
  },
): {
  currentState: { rotationCenter: Point3D; zByPointId: Record<string, number> }
  currentCandidate: RotationFitCandidateResult
  coordinateDescentLog: RotationFitCoordinateDescentStepLog[]
} {
  let currentState = cloneRotationFitCandidateState(stageOptions.baseState)
  let currentCandidate = stageOptions.baseCandidate
  const coordinateDescentLog: RotationFitCoordinateDescentStepLog[] = []

  for (let iterationIndex = 0; iterationIndex < stageOptions.iterationCount; iterationIndex += 1) {
    for (const parameter of ROTATION_FIT_FITTING_LAB_PARAMETER_ORDER) {
      const values = stageOptions.createParameterValues(parameter, currentState)
      const previousState = cloneRotationFitCandidateState(currentState)
      const previousCandidate = currentCandidate
      const rankedCandidates = values
        .map((value) => {
          const candidateState = setRotationFitCandidateStateParameter(
            currentState,
            parameter,
            value,
          )
          return evaluateRotationFitCandidateFromState(options, candidateState)
        })
        .sort(compareRotationFitCandidates)
        .map((candidate, index) => ({
          ...candidate,
          rank: index + 1,
        }))
      const bestStepCandidate = rankedCandidates[0] ?? previousCandidate
      const improved = compareRotationFitCandidates(bestStepCandidate, previousCandidate) < 0

      if (improved) {
        currentState = {
          rotationCenter: bestStepCandidate.rotationCenter,
          zByPointId: bestStepCandidate.zByPointId,
        }
        currentCandidate = bestStepCandidate
      } else {
        currentState = previousState
        currentCandidate = previousCandidate
      }

      const selectedValue = getRotationFitCandidateStateParameter(currentState, parameter)
      const selectedRankInStep = rankedCandidates.find(
        (candidate) =>
          isSameRotationFitSearchValue(
            getRotationFitCandidateStateParameter(candidate, parameter),
            selectedValue,
          ) &&
          isSameRotationFitSearchValue(candidate.totalScore, currentCandidate.totalScore) &&
          isSameRotationFitSearchValue(candidate.maxFrameScore, currentCandidate.maxFrameScore),
      )?.rank

      coordinateDescentLog.push({
        stage: stageOptions.stage,
        iteration: iterationIndex + 1,
        parameter,
        previousValue: getRotationFitCandidateStateParameter(previousState, parameter),
        bestValue: selectedValue,
        previousTotalScore: previousCandidate.totalScore,
        bestTotalScore: currentCandidate.totalScore,
        previousMaxFrameScore: previousCandidate.maxFrameScore,
        bestMaxFrameScore: currentCandidate.maxFrameScore,
        candidateCount: values.length,
        improved,
        bestCandidateRankInStep: selectedRankInStep,
      })
    }
  }

  return {
    currentState,
    currentCandidate,
    coordinateDescentLog,
  }
}

function evaluateRotationFitCandidateFromState(
  options: {
    evaluationFrames: Array<{ frame: AcceptedFrameSnapshot; candidate: PoseReviewCandidateFrame }>
    baseAdjusted12pt: LandmarkSummaryPoint[]
    videoAspectRatio: number
  },
  stateCandidate: { rotationCenter: Point3D; zByPointId: Record<string, number> },
): RotationFitCandidateResult {
  const base12pt = createRotationFitBase12pt(
    options.baseAdjusted12pt,
    options.videoAspectRatio,
    stateCandidate.zByPointId,
  )
  return evaluateRotationFitCandidate(
    options.evaluationFrames,
    base12pt,
    options.videoAspectRatio,
    stateCandidate.rotationCenter,
    stateCandidate.zByPointId,
  )
}

function createRotationFitFittingLabInitialCandidateState(fixedRotationCenterX: number): {
  rotationCenter: Point3D
  zByPointId: Record<string, number>
} {
  return {
    rotationCenter: {
      x: fixedRotationCenterX,
      y: RENDER_ROTATION_FIT_INITIAL_CANDIDATE.rotationCenter.y,
      z: RENDER_ROTATION_FIT_INITIAL_CANDIDATE.rotationCenter.z,
    },
    zByPointId: roundRecordNumbers(RENDER_ROTATION_FIT_INITIAL_CANDIDATE.zByPointId),
  }
}

function cloneRotationFitCandidateState(stateCandidate: {
  rotationCenter: Point3D
  zByPointId: Record<string, number>
}): { rotationCenter: Point3D; zByPointId: Record<string, number> } {
  return {
    rotationCenter: { ...stateCandidate.rotationCenter },
    zByPointId: { ...stateCandidate.zByPointId },
  }
}

function setRotationFitCandidateStateParameter(
  stateCandidate: { rotationCenter: Point3D; zByPointId: Record<string, number> },
  parameter: RotationFitLocalSearchParameter,
  value: number,
): { rotationCenter: Point3D; zByPointId: Record<string, number> } {
  const next = cloneRotationFitCandidateState(stateCandidate)
  if (parameter === "rotationCenter.y") {
    next.rotationCenter.y = roundDebugNumber(value)
    return next
  }
  if (parameter === "rotationCenter.z") {
    next.rotationCenter.z = roundDebugNumber(value)
    return next
  }
  if (parameter === "cheek.z" || parameter === "eye.z" || parameter === "jaw.z") {
    for (const pointId of ROTATION_FIT_SYMMETRIC_Z_POINT_IDS[parameter]) {
      next.zByPointId[pointId] = roundDebugNumber(value)
    }
    return next
  }
  const pointId = parameter.replace(/\.z$/, "")
  next.zByPointId[pointId] = roundDebugNumber(value)
  return next
}

function getRotationFitCandidateStateParameter(
  stateCandidate: { rotationCenter: Point3D; zByPointId: Record<string, number> },
  parameter: RotationFitLocalSearchParameter,
): number {
  if (parameter === "rotationCenter.y") {
    return stateCandidate.rotationCenter.y
  }
  if (parameter === "rotationCenter.z") {
    return stateCandidate.rotationCenter.z
  }
  if (parameter === "cheek.z" || parameter === "eye.z" || parameter === "jaw.z") {
    const pointIds = ROTATION_FIT_SYMMETRIC_Z_POINT_IDS[parameter]
    return roundDebugNumber(average(pointIds.map((pointId) => stateCandidate.zByPointId[pointId] ?? 0)))
  }
  const pointId = parameter.replace(/\.z$/, "")
  return stateCandidate.zByPointId[pointId] ?? 0
}

function evaluateRotationFitGroupZSearch(options: {
  evaluationFrames: Array<{ frame: AcceptedFrameSnapshot; candidate: PoseReviewCandidateFrame }>
  baseAdjusted12pt: LandmarkSummaryPoint[]
  videoAspectRatio: number
  rotationCenter: Point3D
  initialCandidate: RotationFitCandidateResult
}): RotationFitStageBResult {
  let groupOffsets = createEmptyRotationFitGroupOffsets()
  let bestCandidate = options.initialCandidate
  const groupSearchLogs: RotationFitGroupSearchLog[] = []
  const allCandidateSummaries: RotationFitGroupSearchCandidateSummary[] = []

  for (let iterationIndex = 0; iterationIndex < ROTATION_FIT_GROUP_Z_ITERATION_COUNT; iterationIndex += 1) {
    for (const groupId of ROTATION_FIT_Z_GROUP_SEARCH_ORDER) {
      const previousOffsets = { ...groupOffsets }
      const previousCandidate = bestCandidate
      const offsetCandidates = createRotationFitRangeCandidates(ROTATION_FIT_GROUP_Z_OFFSET_RANGE)
      const rankedGroupCandidates = offsetCandidates
        .map((groupOffset) => {
          const candidateGroupOffsets = {
            ...groupOffsets,
            [groupId]: groupOffset,
          }
          const zByPointId = createRotationFitZByPointIdFromGroupOffsets(candidateGroupOffsets)
          const candidateBase12pt = createRotationFitBase12pt(
            options.baseAdjusted12pt,
            options.videoAspectRatio,
            zByPointId,
          )
          return {
            groupId,
            groupOffset,
            groupOffsets: candidateGroupOffsets,
            candidate: evaluateRotationFitCandidate(
              options.evaluationFrames,
              candidateBase12pt,
              options.videoAspectRatio,
              options.rotationCenter,
            ),
          }
        })
        .sort((left, right) => compareRotationFitCandidates(left.candidate, right.candidate))
        .map((entry, index) => ({
          ...entry,
          candidate: {
            ...entry.candidate,
            rank: index + 1,
          },
        }))

      const selectedEntry = rankedGroupCandidates[0]
      const improved =
        selectedEntry !== undefined &&
        compareRotationFitCandidates(selectedEntry.candidate, previousCandidate) < 0
      if (improved) {
        groupOffsets = selectedEntry.groupOffsets
        bestCandidate = selectedEntry.candidate
      }

      const candidateSummaries = rankedGroupCandidates.map((entry) =>
        createRotationFitGroupSearchCandidateSummary(
          entry.candidate,
          entry.groupId,
          entry.groupOffset,
          entry.groupOffsets,
        ),
      )
      allCandidateSummaries.push(...candidateSummaries)
      groupSearchLogs.push({
        iteration: iterationIndex + 1,
        groupId,
        previousOffset: previousOffsets[groupId],
        selectedOffset: groupOffsets[groupId],
        previousTotalScore: previousCandidate.totalScore,
        selectedTotalScore: bestCandidate.totalScore,
        previousMaxFrameScore: previousCandidate.maxFrameScore,
        selectedMaxFrameScore: bestCandidate.maxFrameScore,
        improved,
        candidateCount: rankedGroupCandidates.length,
        candidates: candidateSummaries.slice(0, ROTATION_FIT_GROUP_SEARCH_LOG_CANDIDATE_LIMIT),
      })
    }
  }

  return {
    searchMode: ROTATION_FIT_GROUP_Z_SEARCH_MODE,
    groupDefinitions: ROTATION_FIT_Z_GROUP_DEFINITIONS,
    groupZOffsetRange: ROTATION_FIT_GROUP_Z_OFFSET_RANGE,
    iterationCount: ROTATION_FIT_GROUP_Z_ITERATION_COUNT,
    initialCandidate: options.initialCandidate,
    bestCandidate,
    groupOffsets,
    groupSearchLogs,
    topCandidates: allCandidateSummaries
      .sort((left, right) => {
        const totalScoreDiff = left.totalScore - right.totalScore
        if (Math.abs(totalScoreDiff) > 0.000001) {
          return totalScoreDiff
        }
        return left.maxFrameScore - right.maxFrameScore
      })
      .slice(0, ROTATION_FIT_TOP_CANDIDATE_LIMIT)
      .map((candidate, index) => ({
        ...candidate,
        rank: index + 1,
      })),
  }
}

function createEmptyRotationFitGroupOffsets(): Record<RotationFitZGroupId, number> {
  return {
    centerAxis: 0,
    cheek: 0,
    jaw: 0,
    eye: 0,
  }
}

function createRotationFitZByPointIdFromGroupOffsets(
  groupOffsets: Record<RotationFitZGroupId, number>,
): Record<string, number> {
  const zByPointId = { ...ROTATION_FIT_DEBUG_Z_BY_POINT_ID }
  for (const groupDefinition of ROTATION_FIT_Z_GROUP_DEFINITIONS) {
    const groupOffset = groupOffsets[groupDefinition.id]
    for (const pointId of groupDefinition.pointIds) {
      zByPointId[pointId] = roundDebugNumber(
        (ROTATION_FIT_DEBUG_Z_BY_POINT_ID[pointId] ?? 0) + groupOffset,
      )
    }
  }
  return zByPointId
}

function createRotationFitZByPointIdFromBase12pt(
  base12pt: Record<string, Point3D>,
): Record<string, number> {
  return roundRecordNumbers(
    Object.fromEntries(Object.entries(base12pt).map(([pointId, point]) => [pointId, point.z])),
  )
}

function createRotationFitGroupSearchCandidateSummary(
  candidate: RotationFitCandidateResult,
  groupId: RotationFitZGroupId,
  groupOffset: number,
  groupOffsets: Record<RotationFitZGroupId, number>,
): RotationFitGroupSearchCandidateSummary {
  return {
    rank: candidate.rank,
    groupId,
    groupOffset,
    groupOffsets,
    totalScore: candidate.totalScore,
    maxFrameScore: candidate.maxFrameScore,
    worstFrame: candidate.worstFrame,
    worstPoint: candidate.worstPoint,
  }
}

function createRotationFitImprovement(
  beforeCandidate: RotationFitCandidateResult,
  afterCandidate: RotationFitCandidateResult,
): RotationFitImprovement {
  return {
    totalScoreBefore: beforeCandidate.totalScore,
    totalScoreAfter: afterCandidate.totalScore,
    totalScoreDelta: roundDebugNumber(beforeCandidate.totalScore - afterCandidate.totalScore),
    maxFrameScoreBefore: beforeCandidate.maxFrameScore,
    maxFrameScoreAfter: afterCandidate.maxFrameScore,
    maxFrameScoreDelta: roundDebugNumber(beforeCandidate.maxFrameScore - afterCandidate.maxFrameScore),
  }
}

function createRotationFitParameterImprovementsFromCoordinateDescentLog(
  logs: RotationFitCoordinateDescentStepLog[],
): RotationFitParameterImprovement[] {
  return logs.map((log) => ({
    parameter: log.parameter,
    iteration: log.iteration,
    scoreBefore: log.previousTotalScore,
    scoreAfter: log.bestTotalScore,
    scoreDelta: roundDebugNumber(log.bestTotalScore - log.previousTotalScore),
    maxFrameScoreBefore: log.previousMaxFrameScore,
    maxFrameScoreAfter: log.bestMaxFrameScore,
    maxFrameScoreDelta: roundDebugNumber(log.bestMaxFrameScore - log.previousMaxFrameScore),
    valueBefore: log.previousValue,
    valueAfter: log.bestValue,
    improved: log.improved,
    bestCandidateRankInStep: log.bestCandidateRankInStep,
    candidateCountInStep: log.candidateCount,
  }))
}

function createRotationFitParameterImprovementSummary(options: {
  initialCandidate: RotationFitCandidateResult | null
  bestCandidate: RotationFitCandidateResult | null
  parameterImprovements: RotationFitParameterImprovement[]
  coordinateBoundaryStatus: RotationFitCoordinateBoundaryStatus | null
}): RotationFitParameterImprovementSummary {
  const improvementByParameter = new Map<string, number>()
  for (const item of options.parameterImprovements) {
    const improvement = roundDebugNumber(item.scoreBefore - item.scoreAfter)
    if (improvement <= 0) {
      continue
    }
    improvementByParameter.set(
      item.parameter,
      roundDebugNumber((improvementByParameter.get(item.parameter) ?? 0) + improvement),
    )
  }
  const bestImprovingParameter =
    Array.from(improvementByParameter.entries()).sort(
      (left, right) => right[1] - left[1],
    )[0]?.[0] ?? null
  const boundaryHitParameters = options.coordinateBoundaryStatus
    ? ROTATION_FIT_FITTING_LAB_PARAMETER_ORDER.filter((parameter) => {
        const status = options.coordinateBoundaryStatus?.[parameter]
        return Boolean(status?.bestAtMin || status?.bestAtMax)
      })
    : []

  return {
    totalImprovement:
      options.initialCandidate && options.bestCandidate
        ? roundDebugNumber(options.initialCandidate.totalScore - options.bestCandidate.totalScore)
        : 0,
    bestImprovingParameter,
    noImprovementParameters: ROTATION_FIT_FITTING_LAB_PARAMETER_ORDER.filter(
      (parameter) => !improvementByParameter.has(parameter),
    ),
    boundaryHitParameters,
  }
}

function calculateRotationFitCoordinateBoundaryStatus(
  candidate: RotationFitCandidateResult,
): RotationFitCoordinateBoundaryStatus {
  return Object.fromEntries(
    ROTATION_FIT_FITTING_LAB_PARAMETER_ORDER.map((parameter) => {
      const range = RENDER_ROTATION_FIT_COORDINATE_DESCENT_RANGES[parameter]
      const value = getRotationFitCandidateStateParameter(candidate, parameter)
      return [
        parameter,
        {
          bestAtMin: isRotationFitBoundaryValue(value, range.min),
          bestAtMax: isRotationFitBoundaryValue(value, range.max),
        },
      ]
    }),
  ) as RotationFitCoordinateBoundaryStatus
}

function calculateRotationFitLeftRightZSymmetryDiagnostics(
  zByPointId: Record<string, number>,
): RotationFitLeftRightZSymmetryDiagnostics {
  return {
    cheekDelta: roundDebugNumber((zByPointId.leftCheek ?? 0) - (zByPointId.rightCheek ?? 0)),
    eyeDelta: roundDebugNumber((zByPointId.leftEye ?? 0) - (zByPointId.rightEye ?? 0)),
    jawDelta: roundDebugNumber((zByPointId.leftJaw ?? 0) - (zByPointId.rightJaw ?? 0)),
  }
}

function calculateRotationFitSearchBoundaryStatus(
  bestRotationCenter: Point3D,
): RotationFitSearchBoundaryStatus {
  const yRange = RENDER_ROTATION_FIT_COORDINATE_DESCENT_RANGES["rotationCenter.y"]
  const zRange = RENDER_ROTATION_FIT_COORDINATE_DESCENT_RANGES["rotationCenter.z"]
  return {
    bestYAtMin: isRotationFitBoundaryValue(
      bestRotationCenter.y,
      yRange.min,
    ),
    bestYAtMax: isRotationFitBoundaryValue(
      bestRotationCenter.y,
      yRange.max,
    ),
    bestZAtMin: isRotationFitBoundaryValue(
      bestRotationCenter.z,
      zRange.min,
    ),
    bestZAtMax: isRotationFitBoundaryValue(
      bestRotationCenter.z,
      zRange.max,
    ),
  }
}

function isRotationFitBoundaryValue(value: number, boundary: number): boolean {
  return Math.abs(value - boundary) <= ROTATION_FIT_BOUNDARY_EPSILON
}

function isSameRotationFitSearchValue(left: number, right: number): boolean {
  return Math.abs(left - right) <= 0.000001
}

function evaluateRotationFitCandidate(
  evaluationFrames: Array<{ frame: AcceptedFrameSnapshot; candidate: PoseReviewCandidateFrame }>,
  base12pt: Record<string, Point3D>,
  videoAspectRatio: number,
  rotationCenter: Point3D,
  zByPointId: Record<string, number> = createRotationFitZByPointIdFromBase12pt(base12pt),
): RotationFitCandidateResult {
  const frameScores = evaluationFrames.flatMap((entry) => {
    if (!entry.frame.pose) {
      return []
    }
    const adjusted12pt = createRotationFitFrameAdjusted12pt(
      getAdjusted12ptForFrame(entry.frame),
      videoAspectRatio,
    )
    const projected12pt = projectRotationFit12pt(base12pt, entry.frame.pose, rotationCenter)
    const pointErrors = calculateRotationFitPointErrors(projected12pt, adjusted12pt)
    const pointErrorEntries = Object.entries(pointErrors)
    if (pointErrorEntries.length === 0) {
      return []
    }

    const worstPointEntry = pointErrorEntries.reduce((worst, current) =>
      current[1] > worst[1] ? current : worst,
    )

    return [
      {
        sourceFrameIndex: entry.frame.sourceFrameIndex,
        timeSec: roundDebugNumber(entry.frame.timeSec),
        yaw: roundDebugNumber(entry.frame.pose.yaw),
        pitch: roundDebugNumber(entry.frame.pose.pitch),
        roll: roundDebugNumber(entry.frame.pose.roll),
        frameScore: roundDebugNumber(average(pointErrorEntries.map(([, error]) => error))),
        worstPoint: worstPointEntry[0],
        worstPointError: roundDebugNumber(worstPointEntry[1]),
        pointErrors: roundRotationFitPointErrors(pointErrors),
      },
    ]
  })

  const pointScores = calculateRotationFitPointScores(frameScores)
  const worstFrame =
    frameScores.length > 0
      ? frameScores.reduce((worst, current) =>
          current.frameScore > worst.frameScore ? current : worst,
        )
      : null
  const worstPoint =
    pointScores.length > 0
      ? pointScores.reduce((worst, current) =>
          current.averageError > worst.averageError ? current : worst,
        )
      : null

  return {
    rank: 0,
    rotationCenter,
    zByPointId: roundRecordNumbers(zByPointId),
    totalScore:
      frameScores.length > 0
        ? roundDebugNumber(average(frameScores.map((frame) => frame.frameScore)))
        : Number.POSITIVE_INFINITY,
    maxFrameScore: worstFrame ? roundDebugNumber(worstFrame.frameScore) : Number.POSITIVE_INFINITY,
    worstFrame,
    worstPoint,
    frameScores,
    pointScores,
    bucketScores: calculateRotationFitBucketScores(frameScores),
  }
}

function compareRotationFitCandidates(
  left: RotationFitCandidateResult,
  right: RotationFitCandidateResult,
): number {
  const totalScoreDiff = left.totalScore - right.totalScore
  if (Math.abs(totalScoreDiff) > 0.000001) {
    return totalScoreDiff
  }
  return left.maxFrameScore - right.maxFrameScore
}

function createRotationFitCandidateSummary(
  candidate: RotationFitCandidateResult,
): RotationFitCandidateSummary {
  return {
    rank: candidate.rank,
    rotationCenter: candidate.rotationCenter,
    zByPointId: candidate.zByPointId,
    totalScore: candidate.totalScore,
    maxFrameScore: candidate.maxFrameScore,
    worstFrame: candidate.worstFrame,
    worstPoint: candidate.worstPoint,
  }
}

function getRotationFitEvaluationFrames(): Array<{
  frame: AcceptedFrameSnapshot
  candidate: PoseReviewCandidateFrame
}> {
  const summary = state.poseReviewCandidateSummary
  if (!summary) {
    return []
  }

  const acceptedFrameBySourceIndex = new Map(
    state.acceptedFrames.map((frame) => [frame.sourceFrameIndex, frame]),
  )
  const seenSourceFrameIndexes = new Set<number>()
  return summary.buckets.flatMap((bucket) =>
    bucket.selectedFrames.flatMap((candidate) => {
      if (seenSourceFrameIndexes.has(candidate.sourceFrameIndex)) {
        return []
      }
      const frame = acceptedFrameBySourceIndex.get(candidate.sourceFrameIndex)
      if (!frame) {
        return []
      }
      seenSourceFrameIndexes.add(candidate.sourceFrameIndex)
      return [{ frame, candidate }]
    }),
  )
}

function selectRotationFitBaseFrame(
  evaluationFrames: Array<{ frame: AcceptedFrameSnapshot; candidate: PoseReviewCandidateFrame }>,
): { frame: AcceptedFrameSnapshot; reason: string } | null {
  const frontFrame = evaluationFrames.find(({ frame }) => hasFrameBadge(frame, "frontCandidate"))
  if (frontFrame) {
    return {
      frame: frontFrame.frame,
      reason: "frontCandidate（正面候補）",
    }
  }

  const centerBucketFrame = evaluationFrames.find(
    ({ frame }) => frame.poseBucket125?.id === FRONT_CANDIDATE_POSE_BUCKET_125_ID,
  )
  if (centerBucketFrame) {
    return {
      frame: centerBucketFrame.frame,
      reason: "poseBucket125 center（姿勢中央 bucket）",
    }
  }

  const closestPoseFrame = evaluationFrames
    .filter(({ frame }) => frame.pose)
    .sort((left, right) => getPoseMagnitude(left.frame.pose) - getPoseMagnitude(right.frame.pose))[0]

  return closestPoseFrame
    ? {
        frame: closestPoseFrame.frame,
        reason: "closest pose fallback（姿勢最小 fallback）",
      }
    : null
}

function createRotationFitBase12pt(
  adjusted12pt: LandmarkSummaryPoint[],
  videoAspectRatio: number,
  zByPointId: Record<string, number> = ROTATION_FIT_DEBUG_Z_BY_POINT_ID,
): Record<string, Point3D> {
  return Object.fromEntries(
    adjusted12pt.flatMap((point) => {
      const z = zByPointId[point.id]
      if (z === undefined) {
        return []
      }
      return [
        [
          point.id,
          {
            x: point.x * videoAspectRatio,
            y: point.y,
            z,
          },
        ],
      ]
    }),
  )
}

function createRotationFitFrameAdjusted12pt(
  adjusted12pt: LandmarkSummaryPoint[],
  videoAspectRatio: number,
): Record<string, Point2D> {
  return Object.fromEntries(
    adjusted12pt.map((point) => [
      point.id,
      {
        x: point.x * videoAspectRatio,
        y: point.y,
      },
    ]),
  )
}

function projectRotationFit12pt(
  base12pt: Record<string, Point3D>,
  pose: Pose,
  rotationCenter: Point3D,
): Record<string, Point2D> {
  return Object.fromEntries(
    ROTATION_CENTER_12_SEMANTIC_DEFINITIONS.flatMap((definition) => {
      const point = base12pt[definition.id]
      if (!point) {
        return []
      }
      const rotated = rotateRotationFitPoint3D(
        {
          x: point.x - rotationCenter.x,
          y: point.y - rotationCenter.y,
          z: point.z - rotationCenter.z,
        },
        pose,
      )
      const projectedX = rotated.x + rotationCenter.x
      const projectedY = rotated.y + rotationCenter.y
      const z = rotated.z + rotationCenter.z
      const perspective = ROTATION_FIT_FOCAL_LENGTH / Math.max(ROTATION_FIT_FOCAL_LENGTH + z, 0.2)
      return [
        [
          definition.id,
          {
            x: projectedX * perspective,
            y: projectedY * perspective,
          },
        ],
      ]
    }),
  )
}

function rotateRotationFitPoint3D(point: Point3D, pose: Pose): Point3D {
  const yaw = degreesToRadians(pose.yaw)
  const pitch = degreesToRadians(pose.pitch)
  const roll = degreesToRadians(pose.roll)

  const cosY = Math.cos(yaw)
  const sinY = Math.sin(yaw)
  const yawed = {
    x: point.x * cosY + point.z * sinY,
    y: point.y,
    z: -point.x * sinY + point.z * cosY,
  }

  const cosP = Math.cos(pitch)
  const sinP = Math.sin(pitch)
  const pitched = {
    x: yawed.x,
    y: yawed.y * cosP - yawed.z * sinP,
    z: yawed.y * sinP + yawed.z * cosP,
  }

  const cosR = Math.cos(roll)
  const sinR = Math.sin(roll)
  return {
    x: pitched.x * cosR - pitched.y * sinR,
    y: pitched.x * sinR + pitched.y * cosR,
    z: pitched.z,
  }
}

function calculateRotationFitPointErrors(
  projected12pt: Record<string, Point2D>,
  adjusted12pt: Record<string, Point2D>,
): Record<string, number> {
  return Object.fromEntries(
    ROTATION_CENTER_12_SEMANTIC_DEFINITIONS.flatMap((definition) => {
      const projected = projected12pt[definition.id]
      const adjusted = adjusted12pt[definition.id]
      if (!projected || !adjusted) {
        return []
      }
      return [[definition.id, distance2D(projected, adjusted)]]
    }),
  )
}

function roundRotationFitPointErrors(pointErrors: Record<string, number>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(pointErrors).map(([pointId, error]) => [pointId, roundDebugNumber(error)]),
  )
}

function calculateRotationFitPointScores(
  frameScores: RotationFitFrameScore[],
): RotationFitPointScore[] {
  return ROTATION_CENTER_12_SEMANTIC_DEFINITIONS.flatMap((definition) => {
    const errors = frameScores
      .map((frame) => frame.pointErrors[definition.id])
      .filter((error): error is number => Number.isFinite(error))
    if (errors.length === 0) {
      return []
    }
    return [
      {
        pointId: definition.id,
        averageError: roundDebugNumber(average(errors)),
        maxError: roundDebugNumber(Math.max(...errors)),
      },
    ]
  })
}

function calculateRotationFitBucketScores(frameScores: RotationFitFrameScore[]): {
  yaw: RotationFitBucketScore[]
  pitch: RotationFitBucketScore[]
  roll: RotationFitBucketScore[]
  yawPitch: RotationFitBucketScore[]
} {
  return {
    yaw: createRotationFitAxisBucketScores(frameScores, "yaw"),
    pitch: createRotationFitAxisBucketScores(frameScores, "pitch"),
    roll: createRotationFitAxisBucketScores(frameScores, "roll"),
    yawPitch: createRotationFitYawPitchBucketScores(frameScores),
  }
}

function createRotationFitAxisBucketScores(
  frameScores: RotationFitFrameScore[],
  axis: PoseAxisName,
): RotationFitBucketScore[] {
  return (["negative", "center", "positive"] as const).map((bucket) =>
    summarizeRotationFitBucket(
      bucket,
      frameScores.filter((frame) => getRotationFitAxisBucket(frame[axis], axis) === bucket),
    ),
  )
}

function createRotationFitYawPitchBucketScores(
  frameScores: RotationFitFrameScore[],
): RotationFitBucketScore[] {
  const buckets = new Map<string, RotationFitFrameScore[]>()
  for (const frame of frameScores) {
    const bucket = `${getRotationFitAxisBucket(frame.yaw, "yaw")} x ${getRotationFitAxisBucket(
      frame.pitch,
      "pitch",
    )}`
    buckets.set(bucket, [...(buckets.get(bucket) ?? []), frame])
  }

  return Array.from(buckets.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([bucket, frames]) => summarizeRotationFitBucket(bucket, frames))
}

function summarizeRotationFitBucket(
  bucket: string,
  frames: RotationFitFrameScore[],
): RotationFitBucketScore {
  const frameScores = frames.map((frame) => frame.frameScore)
  return {
    bucket,
    frameCount: frames.length,
    averageFrameScore: frameScores.length > 0 ? roundDebugNumber(average(frameScores)) : 0,
    maxFrameScore: frameScores.length > 0 ? roundDebugNumber(Math.max(...frameScores)) : 0,
  }
}

function getRotationFitAxisBucket(
  value: number,
  axis: PoseAxisName,
): RotationFitAxisBucketName {
  const centerAbsMax = POSE_AXIS_BIN_THRESHOLDS[axis].centerAbsMax
  if (value < -centerAbsMax) {
    return "negative"
  }
  if (value > centerAbsMax) {
    return "positive"
  }
  return "center"
}

function getPoseMagnitude(pose: Pose | null): number {
  if (!pose) {
    return Number.POSITIVE_INFINITY
  }
  return Math.abs(pose.yaw) + Math.abs(pose.pitch) + Math.abs(pose.roll)
}

function buildPoseReviewShortageBucketSummaries(
  buckets: PoseReviewCandidateBucket[],
): PoseReviewCandidateShortageBucketSummary[] {
  return buckets
    .filter((bucket) => bucket.shortageCount > 0)
    .map((bucket) => {
      const acceptedFramesInBucket = state.acceptedFrames.filter((frame) => {
        const poseBucket = frame.poseBucket125
        return (
          poseBucket !== null &&
          poseBucket !== undefined &&
          poseBucket.yawBin === bucket.yawBin &&
          poseBucket.pitchBin === bucket.pitchBin
        )
      })
      const acceptedFrameCount = acceptedFramesInBucket.length
      const usableNonExpressionCount = acceptedFramesInBucket.filter(
        (frame) => !hasFrameBadge(frame, "expressionTooStrong"),
      ).length
      const expressionTooStrongCount = acceptedFrameCount - usableNonExpressionCount

      return {
        bucketId: bucket.id,
        yawBin: bucket.yawBin,
        pitchBin: bucket.pitchBin,
        targetCount: bucket.targetCount,
        selectedCount: bucket.selectedCount,
        shortageCount: bucket.shortageCount,
        acceptedFrameCount,
        usableNonExpressionCount,
        expressionTooStrongCount,
        availableRollNegativeCount: bucket.availableRollNegativeCount,
        availableRollCenterCount: bucket.availableRollCenterCount,
        availableRollPositiveCount: bucket.availableRollPositiveCount,
        selectedByRollNegativeCount: bucket.selectedByRollNegativeCount,
        selectedByRollCenterCount: bucket.selectedByRollCenterCount,
        selectedByRollPositiveCount: bucket.selectedByRollPositiveCount,
        shortageReason: classifyPoseReviewShortageReason(
          acceptedFrameCount,
          usableNonExpressionCount,
          bucket.targetCount,
        ),
      }
    })
}

function classifyPoseReviewShortageReason(
  acceptedFrameCount: number,
  usableNonExpressionCount: number,
  targetCount: number,
): PoseReviewCandidateShortageReason {
  if (acceptedFrameCount === 0) {
    return "not_enough_pose_frames"
  }
  if (usableNonExpressionCount < targetCount) {
    return "not_enough_non_expression_frames"
  }
  return "unknown"
}

function groupPoseReviewFramesByRollGroup(
  frames: AcceptedFrameSnapshot[],
): Record<PoseReviewCandidateRollGroup, AcceptedFrameSnapshot[]> {
  return {
    roll_negative: frames.filter((frame) => getPoseReviewRollGroup(frame) === "roll_negative"),
    roll_center: frames.filter((frame) => getPoseReviewRollGroup(frame) === "roll_center"),
    roll_positive: frames.filter((frame) => getPoseReviewRollGroup(frame) === "roll_positive"),
  }
}

function selectRollBalancedCandidateFrames(
  framesByGroup: Record<PoseReviewCandidateRollGroup, AcceptedFrameSnapshot[]>,
  targetPerBucket: number,
): PoseReviewCandidateFrame[] {
  const selectedFrames: PoseReviewCandidateFrame[] = []
  const selectedSourceFrameIndexes = new Set<number>()
  const selectedCountByGroup = createEmptyPoseReviewRollGroupCount()
  const initialTargets = POSE_REVIEW_ROLL_BALANCE_INITIAL_TARGETS[targetPerBucket]
  const softMaxByGroup = POSE_REVIEW_ROLL_BALANCE_MAX_PER_GROUP[targetPerBucket]

  const addFrames = (
    rollGroup: PoseReviewCandidateRollGroup,
    frames: AcceptedFrameSnapshot[],
    selectedBy: PoseReviewSelectedBy,
  ): void => {
    for (const frame of frames) {
      if (selectedFrames.length >= targetPerBucket) {
        return
      }
      if (selectedSourceFrameIndexes.has(frame.sourceFrameIndex)) {
        continue
      }

      selectedFrames.push(buildPoseReviewCandidateFrame(frame, rollGroup, selectedBy))
      selectedSourceFrameIndexes.add(frame.sourceFrameIndex)
      selectedCountByGroup[rollGroup] += 1
    }
  }

  for (const rollGroup of POSE_REVIEW_ROLL_GROUP_ORDER) {
    const targetCount = Math.min(initialTargets[rollGroup] ?? 0, targetPerBucket)
    const pickedFrames = pickEvenlySpaced(
      framesByGroup[rollGroup],
      targetCount,
      (frame) => frame.timeSec,
    )
    addFrames(rollGroup, pickedFrames, getPoseReviewSelectedByForRollGroup(rollGroup))
  }

  supplementRollBalancedCandidateFrames({
    addFrames,
    framesByGroup,
    selectedCountByGroup,
    selectedSourceFrameIndexes,
    selectedFrames,
    targetPerBucket,
    softMaxByGroup,
    useSoftMax: true,
  })

  supplementRollBalancedCandidateFrames({
    addFrames,
    framesByGroup,
    selectedCountByGroup,
    selectedSourceFrameIndexes,
    selectedFrames,
    targetPerBucket,
    softMaxByGroup,
    useSoftMax: false,
  })

  return selectedFrames.sort((left, right) => left.timeSec - right.timeSec)
}

function supplementRollBalancedCandidateFrames(options: {
  addFrames: (
    rollGroup: PoseReviewCandidateRollGroup,
    frames: AcceptedFrameSnapshot[],
    selectedBy: PoseReviewSelectedBy,
  ) => void
  framesByGroup: Record<PoseReviewCandidateRollGroup, AcceptedFrameSnapshot[]>
  selectedCountByGroup: Record<PoseReviewCandidateRollGroup, number>
  selectedSourceFrameIndexes: Set<number>
  selectedFrames: PoseReviewCandidateFrame[]
  targetPerBucket: number
  softMaxByGroup: Record<PoseReviewCandidateRollGroup, number>
  useSoftMax: boolean
}): void {
  while (options.selectedFrames.length < options.targetPerBucket) {
    const nextRollGroup = choosePoseReviewSupplementRollGroup(options)
    if (!nextRollGroup) {
      return
    }

    const remainingFrames = getRemainingPoseReviewFrames(
      options.framesByGroup[nextRollGroup],
      options.selectedSourceFrameIndexes,
    )
    options.addFrames(
      nextRollGroup,
      pickEvenlySpaced(remainingFrames, 1, (frame) => frame.timeSec),
      "roll_balance_supplement",
    )
  }
}

function choosePoseReviewSupplementRollGroup(options: {
  framesByGroup: Record<PoseReviewCandidateRollGroup, AcceptedFrameSnapshot[]>
  selectedCountByGroup: Record<PoseReviewCandidateRollGroup, number>
  selectedSourceFrameIndexes: Set<number>
  softMaxByGroup: Record<PoseReviewCandidateRollGroup, number>
  useSoftMax: boolean
}): PoseReviewCandidateRollGroup | null {
  const candidates = POSE_REVIEW_ROLL_SUPPLEMENT_ORDER.filter((rollGroup) => {
    if (
      options.useSoftMax &&
      options.selectedCountByGroup[rollGroup] >= options.softMaxByGroup[rollGroup]
    ) {
      return false
    }

    return getRemainingPoseReviewFrames(
      options.framesByGroup[rollGroup],
      options.selectedSourceFrameIndexes,
    ).length > 0
  })

  if (candidates.length === 0) {
    return null
  }

  return candidates.sort((left, right) => {
    const selectedCountDiff =
      options.selectedCountByGroup[left] - options.selectedCountByGroup[right]
    if (selectedCountDiff !== 0) {
      return selectedCountDiff
    }

    const remainingCountDiff =
      getRemainingPoseReviewFrames(options.framesByGroup[right], options.selectedSourceFrameIndexes)
        .length -
      getRemainingPoseReviewFrames(options.framesByGroup[left], options.selectedSourceFrameIndexes)
        .length
    if (remainingCountDiff !== 0) {
      return remainingCountDiff
    }

    return (
      POSE_REVIEW_ROLL_SUPPLEMENT_ORDER.indexOf(left) -
      POSE_REVIEW_ROLL_SUPPLEMENT_ORDER.indexOf(right)
    )
  })[0]
}

function getRemainingPoseReviewFrames(
  frames: AcceptedFrameSnapshot[],
  selectedSourceFrameIndexes: Set<number>,
): AcceptedFrameSnapshot[] {
  return frames.filter((frame) => !selectedSourceFrameIndexes.has(frame.sourceFrameIndex))
}

function getPoseReviewRollGroup(
  frame: AcceptedFrameSnapshot,
): PoseReviewCandidateRollGroup | null {
  const rollBin = frame.poseBucket125?.rollBin
  if (rollBin === "negativeLarge" || rollBin === "negativeSmall") {
    return "roll_negative"
  }
  if (rollBin === "center") {
    return "roll_center"
  }
  if (rollBin === "positiveSmall" || rollBin === "positiveLarge") {
    return "roll_positive"
  }
  return null
}

function getPoseReviewSelectedByForRollGroup(
  rollGroup: PoseReviewCandidateRollGroup,
): PoseReviewSelectedBy {
  if (rollGroup === "roll_center") {
    return "roll_center"
  }
  return rollGroup
}

function createEmptyPoseReviewRollGroupCount(): Record<PoseReviewCandidateRollGroup, number> {
  return {
    roll_negative: 0,
    roll_center: 0,
    roll_positive: 0,
  }
}

function buildPoseReviewCandidateFrame(
  frame: AcceptedFrameSnapshot,
  rollGroup: PoseReviewCandidateRollGroup,
  selectedBy: PoseReviewSelectedBy,
): PoseReviewCandidateFrame {
  return {
    sourceFrameIndex: frame.sourceFrameIndex,
    timeSec: frame.timeSec,
    rollBin: frame.poseBucket125?.rollBin ?? "center",
    rollGroup,
    selectedBy,
  }
}

function pickEvenlySpaced<T>(
  items: T[],
  targetCount: number,
  getTimeSec: (item: T) => number,
): T[] {
  if (targetCount <= 0 || items.length === 0) {
    return []
  }

  const sortedItems = [...items].sort((left, right) => getTimeSec(left) - getTimeSec(right))
  if (sortedItems.length <= targetCount) {
    return sortedItems
  }

  if (targetCount === 1) {
    return [sortedItems[Math.round((sortedItems.length - 1) / 2)]]
  }

  const selectedIndexes = new Set<number>()
  for (let index = 0; index < targetCount; index += 1) {
    selectedIndexes.add(Math.round((index * (sortedItems.length - 1)) / (targetCount - 1)))
  }

  for (let index = 0; selectedIndexes.size < targetCount && index < sortedItems.length; index += 1) {
    selectedIndexes.add(index)
  }

  return [...selectedIndexes]
    .sort((left, right) => left - right)
    .map((index) => sortedItems[index])
}

function findNextUnexcludedReviewIndex(startReviewIndex: number): number | null {
  for (
    let index = Math.max(0, startReviewIndex);
    index < state.acceptedFrames.length;
    index += 1
  ) {
    if (!state.acceptedFrames[index].excluded) {
      return index
    }
  }
  return null
}

function getCurrentFrameTimeSec(): number {
  return getCurrentAcceptedFrame()?.timeSec ?? 0
}

function getEstimatedFrameCount(): number {
  if (!state.metadata) {
    return 0
  }
  return Math.max(
    1,
    Math.floor(Math.min(state.metadata.duration, MAX_SCAN_DURATION_SEC) / SCAN_FRAME_STEP_SECONDS),
  )
}

function isCurrentFrameExcluded(): boolean {
  return getCurrentAcceptedFrame()?.excluded ?? false
}

function getCurrentAcceptedFrame(): AcceptedFrameSnapshot | null {
  return state.acceptedFrames[state.currentReviewIndex] ?? null
}

function prepareThumbnailCanvas(): void {
  if (video.videoWidth <= 0 || video.videoHeight <= 0) {
    throw new Error("動画サイズが取得できませんでした。")
  }

  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
}

function renderThumbnailCanvas(): void {
  const currentFrame = getCurrentAcceptedFrame()
  if (!currentFrame) {
    clearCanvas()
    return
  }

  const renderToken = ++thumbnailRenderToken
  const image = new Image()
  image.addEventListener("load", () => {
    if (renderToken !== thumbnailRenderToken) {
      return
    }

    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext("2d")
    if (!context) {
      throw new Error("canvas context を取得できませんでした。")
    }

    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const adjusted12pt = getAdjusted12pt()
    if (state.showLandmarkSummaryOverlay && adjusted12pt.length > 0) {
      drawLandmarkSummaryOverlay(context, adjusted12pt)
    }

    thumbnailEmpty.hidden = true
  })
  image.src = currentFrame.thumbnailDataUrl
}

function drawVideoFrameToCanvas(): void {
  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("canvas context を取得できませんでした。")
  }

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  thumbnailEmpty.hidden = true
}

function analyzeCanvasForAcceptedFrame(
  sourceFrameIndex: number,
  timeSec: number,
): AcceptedFrameSnapshot | null {
  if (!faceLandmarker) {
    state.scanState = {
      ...state.scanState,
      discardedInvalidLandmarkCount: state.scanState.discardedInvalidLandmarkCount + 1,
    }
    return null
  }

  try {
    const result = faceLandmarker.detectForVideo(canvas, performance.now())
    const landmarks = result.faceLandmarks[0] ?? []
    const blendshapes = result.faceBlendshapes[0]?.categories ?? []
    const matrix = result.facialTransformationMatrixes[0]
    const matrixValues = matrix ? Array.from(matrix.data) : []
    const detected = result.faceLandmarks.length > 0

    if (!detected) {
      state.scanState = {
        ...state.scanState,
        discardedNoFaceCount: state.scanState.discardedNoFaceCount + 1,
      }
      return null
    }

    if (landmarks.length !== 478) {
      state.scanState = {
        ...state.scanState,
        discardedInvalidLandmarkCount: state.scanState.discardedInvalidLandmarkCount + 1,
      }
      return null
    }

    const pose = estimateFacePoseFromMatrix(matrix)
    const observed12pt = detected ? buildLandmarkSummary(landmarks) : []
    const poseBucket125 = buildPoseBucket125(pose)
    const expressionSummary = buildExpressionScoreSummary(blendshapes)
    const badges = buildFrameBadges(buildPoseBucket125Badges(poseBucket125), expressionSummary)
    const mediaPipeSummary = {
      detected,
      landmarkCount: landmarks.length,
      blendshapeCount: blendshapes.length,
      hasFacialTransformationMatrix: Boolean(matrix),
      matrixPreview:
        matrixValues.length > 0
          ? matrixValues.slice(0, MATRIX_PREVIEW_COUNT).map(roundDebugNumber)
          : undefined,
    }

    return {
      sourceFrameIndex,
      timeSec,
      thumbnailDataUrl: canvas.toDataURL("image/jpeg", 0.82),
      mediaPipeSummary,
      pose,
      observed12pt,
      excluded: false,
      poseBucket125,
      badges,
      expressionSummary,
    }
  } catch (error) {
    state.scanState = {
      ...state.scanState,
      discardedInvalidLandmarkCount: state.scanState.discardedInvalidLandmarkCount + 1,
      error: error instanceof Error ? error.message : String(error),
    }
    return null
  }
}

function applyCurrentAcceptedFrame(): void {
  const currentFrame = getCurrentAcceptedFrame()
  if (!currentFrame) {
    state.summary = createInvalidMediaPipeSummary()
    state.pose = null
    state.observed12pt = []
    state.selectedLandmarkSummaryPointId = null
    state.draggingLandmarkSummaryPointId = null
    return
  }

  state.summary = currentFrame.mediaPipeSummary
  state.pose = currentFrame.pose
  state.observed12pt = currentFrame.observed12pt
}

function createInvalidMediaPipeSummary(error?: string): MediaPipeFrameSummary {
  return {
    detected: false,
    landmarkCount: 0,
    blendshapeCount: 0,
    hasFacialTransformationMatrix: false,
    error,
  }
}

function buildPoseBucket125(pose: Pose | null): PoseBucket125 | null {
  if (!pose) {
    return null
  }

  const yawBin = classifyPoseAxisBin("yaw", pose.yaw)
  const pitchBin = classifyPoseAxisBin("pitch", pose.pitch)
  const rollBin = classifyPoseAxisBin("roll", pose.roll)
  return {
    id: formatPoseBucket125Id(yawBin, pitchBin, rollBin),
    yawBin,
    pitchBin,
    rollBin,
  }
}

function classifyPoseAxisBin(axisName: PoseAxisName, angle: number): PoseAxisBin {
  const thresholds = POSE_AXIS_BIN_THRESHOLDS[axisName]
  if (angle < -thresholds.negativeSmallMax) {
    return "negativeLarge"
  }
  if (angle < -thresholds.centerAbsMax) {
    return "negativeSmall"
  }
  if (angle <= thresholds.centerAbsMax) {
    return "center"
  }
  if (angle <= thresholds.positiveSmallMax) {
    return "positiveSmall"
  }
  return "positiveLarge"
}

function formatPoseBucket125Id(
  yawBin: PoseAxisBin,
  pitchBin: PoseAxisBin,
  rollBin: PoseAxisBin,
): string {
  return `yaw_${yawBin}__pitch_${pitchBin}__roll_${rollBin}`
}

function formatPoseReviewYawPitchBucketId(
  yawBin: PoseAxisBin,
  pitchBin: PoseAxisBin,
): string {
  return `yaw_${yawBin}__pitch_${pitchBin}`
}

function buildPoseBucket125Definitions(): PoseBucket125Definition[] {
  return POSE_AXIS_BINS.flatMap((yawBin) =>
    POSE_AXIS_BINS.flatMap((pitchBin) =>
      POSE_AXIS_BINS.map((rollBin) => ({
        id: formatPoseBucket125Id(yawBin, pitchBin, rollBin),
        yawBin,
        pitchBin,
        rollBin,
      })),
    ),
  )
}

function buildPoseReviewYawPitchBucketDefinitions(): PoseReviewYawPitchBucketDefinition[] {
  return POSE_AXIS_BINS.flatMap((yawBin) =>
    POSE_AXIS_BINS.map((pitchBin) => ({
      id: formatPoseReviewYawPitchBucketId(yawBin, pitchBin),
      yawBin,
      pitchBin,
    })),
  )
}

function buildPoseBucket125Badges(poseBucket125: PoseBucket125 | null): FrameBadge[] {
  if (poseBucket125?.id !== FRONT_CANDIDATE_POSE_BUCKET_125_ID) {
    return []
  }

  return [
    {
      id: "frontCandidate",
      label: "正面候補",
      description: "yaw / pitch / roll が center の正面候補",
    },
  ]
}

function buildExpressionScoreSummary(
  categories: Array<{ categoryName?: string; score?: number }>,
): ExpressionScoreSummary {
  const scoreByCategory = new Map<string, number>()
  for (const category of categories) {
    if (!category.categoryName || !Number.isFinite(category.score)) {
      continue
    }
    scoreByCategory.set(category.categoryName, category.score ?? 0)
  }

  const summary: ExpressionScoreSummary = {
    maxScore: 0,
  }

  for (const categoryName of EXPRESSION_CATEGORY_NAMES) {
    const score = scoreByCategory.get(categoryName)
    if (score === undefined) {
      continue
    }
    summary[categoryName] = roundDebugNumber(score)
    if (score > summary.maxScore) {
      summary.maxScore = score
      summary.maxCategoryName = categoryName
    }
  }

  summary.maxScore = roundDebugNumber(summary.maxScore)
  return summary
}

function buildFrameBadges(
  poseBadges: FrameBadge[],
  expressionSummary: ExpressionScoreSummary,
): FrameBadge[] {
  if (!isExpressionTooStrong(expressionSummary)) {
    return poseBadges
  }

  return [
    ...poseBadges,
    {
      id: "expressionTooStrong",
      label: "表情大 expressionTooStrong",
      description: "表情が大きい可能性があるフレーム",
    },
  ]
}

function isExpressionTooStrong(summary?: ExpressionScoreSummary): boolean {
  if (!summary) {
    return false
  }

  return (
    EXPRESSION_MOUTH_CATEGORY_NAMES.some(
      (categoryName) => (summary[categoryName] ?? 0) >= EXPRESSION_TOO_STRONG_THRESHOLDS.mouth,
    ) ||
    EXPRESSION_EYE_CATEGORY_NAMES.some(
      (categoryName) => (summary[categoryName] ?? 0) >= EXPRESSION_TOO_STRONG_THRESHOLDS.eye,
    ) ||
    EXPRESSION_BROW_CATEGORY_NAMES.some(
      (categoryName) => (summary[categoryName] ?? 0) >= EXPRESSION_TOO_STRONG_THRESHOLDS.brow,
    ) ||
    summary.maxScore >= EXPRESSION_TOO_STRONG_THRESHOLDS.maxAny
  )
}

function getAdjusted12pt(): LandmarkSummaryPoint[] {
  const currentFrame = getCurrentAcceptedFrame()
  return currentFrame ? getAdjusted12ptForFrame(currentFrame) : state.observed12pt
}

function getAdjusted12ptForFrame(frame: AcceptedFrameSnapshot): LandmarkSummaryPoint[] {
  const adjustments = state.manualAdjustmentsByFrame[frame.sourceFrameIndex] ?? []

  return frame.observed12pt.map((point) => {
    const adjustment = adjustments.find((item) => item.id === point.id)
    if (!adjustment) {
      return point
    }

    return {
      ...point,
      x: roundDebugNumber(clamp(point.x + adjustment.dx, 0, 1)),
      y: roundDebugNumber(clamp(point.y + adjustment.dy, 0, 1)),
    }
  })
}

function getManualAdjustment(pointId: string): ManualLandmarkAdjustment | null {
  return getCurrentManualAdjustments().find((adjustment) => adjustment.id === pointId) ?? null
}

function getCurrentManualAdjustments(): ManualLandmarkAdjustment[] {
  const currentFrame = getCurrentAcceptedFrame()
  return currentFrame
    ? state.manualAdjustmentsByFrame[currentFrame.sourceFrameIndex] ?? []
    : []
}

function setCurrentManualAdjustments(adjustments: ManualLandmarkAdjustment[]): void {
  const currentFrame = getCurrentAcceptedFrame()
  if (!currentFrame) {
    return
  }

  const key = currentFrame.sourceFrameIndex
  if (adjustments.length === 0) {
    const remaining = { ...state.manualAdjustmentsByFrame }
    delete remaining[key]
    state.manualAdjustmentsByFrame = remaining
    return
  }

  state.manualAdjustmentsByFrame = {
    ...state.manualAdjustmentsByFrame,
    [key]: adjustments,
  }
}

function setManualAdjustment(pointId: string, dx: number, dy: number): void {
  const currentManualAdjustments = getCurrentManualAdjustments()
  const nextAdjustment = {
    id: pointId,
    dx: roundDebugNumber(dx),
    dy: roundDebugNumber(dy),
  }

  const existingIndex = currentManualAdjustments.findIndex(
    (adjustment) => adjustment.id === pointId,
  )

  if (existingIndex >= 0) {
    setCurrentManualAdjustments(
      currentManualAdjustments.map((adjustment, index) =>
        index === existingIndex ? nextAdjustment : adjustment,
      ),
    )
    return
  }

  setCurrentManualAdjustments([...currentManualAdjustments, nextAdjustment])
}

function resetSelectedLandmarkAdjustment(): void {
  const selectedId = state.selectedLandmarkSummaryPointId
  if (!selectedId) {
    return
  }

  setCurrentManualAdjustments(
    getCurrentManualAdjustments().filter((adjustment) => adjustment.id !== selectedId),
  )
  renderThumbnailCanvas()
  render()
}

function resetCurrentFrameLandmarkAdjustments(): void {
  setCurrentManualAdjustments([])
}

function buildLandmarkSummary(landmarks: NormalizedLandmark[]): LandmarkSummaryPoint[] {
  return ROTATION_CENTER_12_SEMANTIC_DEFINITIONS.map((definition) => {
    if (definition.id === "leftEye" || definition.id === "rightEye") {
      return buildEyeSummaryPoint(landmarks, definition)
    }

    const primaryPoint = averageLandmarks(landmarks, definition.primaryIndices)
    const fallbackPoint = definition.fallbackIndices
      ? averageLandmarks(landmarks, definition.fallbackIndices)
      : null
    const point = primaryPoint ?? fallbackPoint
    const sourceIndices = primaryPoint
      ? definition.primaryIndices
      : fallbackPoint
        ? definition.fallbackIndices ?? []
        : []

    if (!point) {
      return null
    }

    return {
      id: definition.id,
      label: definition.label,
      x: roundDebugNumber(point.x),
      y: roundDebugNumber(point.y),
      z: roundDebugNumber(point.z),
      sourceIndices,
    }
  }).filter((point): point is LandmarkSummaryPoint => Boolean(point))
}

function buildEyeSummaryPoint(
  landmarks: NormalizedLandmark[],
  definition: SemanticPointDefinition,
): LandmarkSummaryPoint | null {
  const side = definition.id === "leftEye" ? "left" : "right"
  const irisIndices =
    side === "left" ? EYE_POINT_INDICES.leftIris : EYE_POINT_INDICES.rightIris
  const contourIndices =
    side === "left" ? EYE_POINT_INDICES.leftContour : EYE_POINT_INDICES.rightContour
  const browIndices =
    side === "left" ? EYE_POINT_INDICES.leftBrow : EYE_POINT_INDICES.rightBrow

  if (state.eyePointMode === "irisCenter") {
    const irisPoint = averageLandmarks(landmarks, [...irisIndices])
    const contourFallback = averageLandmarks(landmarks, [...contourIndices])
    return createLandmarkSummaryPoint(
      definition,
      irisPoint ?? contourFallback,
      irisPoint ? [...irisIndices] : [...contourIndices],
      state.eyePointMode,
    )
  }

  const contourPoint = averageLandmarks(landmarks, [...contourIndices])
  if (state.eyePointMode === "eyeContourCenter") {
    return createLandmarkSummaryPoint(
      definition,
      contourPoint,
      [...contourIndices],
      state.eyePointMode,
    )
  }

  const browPoint = averageLandmarks(landmarks, [...browIndices])
  if (!contourPoint || !browPoint) {
    return createLandmarkSummaryPoint(
      definition,
      contourPoint,
      contourPoint ? [...contourIndices] : [],
      state.eyePointMode,
    )
  }

  // 暫定 brow-eye anchor: 目輪郭中心から眉代表点へ寄せ、眼球ではなく顔側に固定される点として扱う。
  return createLandmarkSummaryPoint(
    definition,
    interpolateLandmark(contourPoint, browPoint, 0.45),
    [...contourIndices, ...browIndices],
    state.eyePointMode,
  )
}

function createLandmarkSummaryPoint(
  definition: SemanticPointDefinition,
  point: NormalizedLandmark | null,
  sourceIndices: number[],
  sourceMode?: EyePointMode,
): LandmarkSummaryPoint | null {
  if (!point) {
    return null
  }

  return {
    id: definition.id,
    label: definition.label,
    x: roundDebugNumber(point.x),
    y: roundDebugNumber(point.y),
    z: roundDebugNumber(point.z),
    sourceIndices,
    sourceMode,
  }
}

function interpolateLandmark(
  from: NormalizedLandmark,
  to: NormalizedLandmark,
  ratio: number,
): NormalizedLandmark {
  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio,
    z: from.z + (to.z - from.z) * ratio,
    visibility: from.visibility === undefined || to.visibility === undefined
      ? undefined
      : from.visibility + (to.visibility - from.visibility) * ratio,
  }
}

function averageLandmarks(
  landmarks: NormalizedLandmark[],
  indices: number[],
): NormalizedLandmark | null {
  const points = indices
    .map((index) => landmarks[index])
    .filter((point): point is NormalizedLandmark => Boolean(point))

  if (points.length !== indices.length) {
    return null
  }

  return {
    x: average(points.map((point) => point.x)),
    y: average(points.map((point) => point.y)),
    z: average(points.map((point) => point.z)),
    visibility: average(points.map((point) => point.visibility ?? 0)),
  }
}

function drawLandmarkSummaryOverlay(
  context: CanvasRenderingContext2D,
  points: LandmarkSummaryPoint[],
): void {
  context.save()
  context.font = "13px sans-serif"
  context.lineWidth = 3
  context.textBaseline = "middle"

  for (const point of points) {
    const x = point.x * canvas.width
    const y = point.y * canvas.height
    const label = point.label
    const observed = state.observed12pt.find((item) => item.id === point.id)
    const adjustment = getManualAdjustment(point.id)
    const isAdjusted = Boolean(adjustment)
    const isSelected = point.id === state.selectedLandmarkSummaryPointId

    if (observed && isAdjusted) {
      context.beginPath()
      context.moveTo(observed.x * canvas.width, observed.y * canvas.height)
      context.lineTo(x, y)
      context.strokeStyle = "rgba(35, 93, 159, 0.45)"
      context.lineWidth = 2
      context.stroke()
      context.lineWidth = 3
    }

    context.beginPath()
    context.arc(
      x,
      y,
      isSelected ? OVERLAY_SELECTED_POINT_RADIUS : OVERLAY_POINT_RADIUS,
      0,
      Math.PI * 2,
    )
    context.fillStyle = isAdjusted ? "#235d9f" : "#e83f6f"
    context.fill()
    context.strokeStyle = isSelected ? "#ffd166" : "#ffffff"
    context.stroke()

    const textX = Math.min(x + 8, canvas.width - 120)
    const textY = Math.max(12, Math.min(y, canvas.height - 12))
    const metrics = context.measureText(label)
    context.fillStyle = "rgba(255, 255, 255, 0.86)"
    context.fillRect(textX - 3, textY - 9, metrics.width + 6, 18)
    context.fillStyle = "#15202b"
    context.font = isSelected ? "700 13px sans-serif" : "13px sans-serif"
    context.fillText(label, textX, textY)
  }

  context.restore()
}

function handleCanvasPointerDown(event: PointerEvent): void {
  if (!state.showLandmarkSummaryOverlay || getAdjusted12pt().length === 0) {
    return
  }

  const pointer = getCanvasPixelPoint(event)
  const point = findNearestSummaryPoint(pointer.x, pointer.y)
  if (!point) {
    state.selectedLandmarkSummaryPointId = null
    state.draggingLandmarkSummaryPointId = null
    renderThumbnailCanvas()
    render()
    return
  }

  state.selectedLandmarkSummaryPointId = point.id
  state.draggingLandmarkSummaryPointId = point.id
  canvas.setPointerCapture(event.pointerId)
  event.preventDefault()
  renderThumbnailCanvas()
  render()
}

function handleCanvasPointerMove(event: PointerEvent): void {
  const draggingId = state.draggingLandmarkSummaryPointId
  if (!draggingId) {
    return
  }

  const observed = state.observed12pt.find((point) => point.id === draggingId)
  if (!observed) {
    return
  }

  const normalized = getCanvasNormalizedPoint(event)
  setManualAdjustment(
    draggingId,
    normalized.x - observed.x,
    normalized.y - observed.y,
  )
  event.preventDefault()
  renderThumbnailCanvas()
  render()
}

function handleCanvasPointerEnd(event: PointerEvent): void {
  if (state.draggingLandmarkSummaryPointId) {
    state.draggingLandmarkSummaryPointId = null
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId)
    }
    renderThumbnailCanvas()
    render()
  }
}

function getCanvasPixelPoint(event: PointerEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  }
}

function getCanvasNormalizedPoint(event: PointerEvent): { x: number; y: number } {
  const pixel = getCanvasPixelPoint(event)
  return {
    x: clamp(pixel.x / canvas.width, 0, 1),
    y: clamp(pixel.y / canvas.height, 0, 1),
  }
}

function findNearestSummaryPoint(x: number, y: number): LandmarkSummaryPoint | null {
  let nearestPoint: LandmarkSummaryPoint | null = null
  let nearestDistance = Number.POSITIVE_INFINITY

  for (const point of getAdjusted12pt()) {
    const pointX = point.x * canvas.width
    const pointY = point.y * canvas.height
    const distance = Math.hypot(pointX - x, pointY - y)
    if (distance <= OVERLAY_HIT_RADIUS && distance < nearestDistance) {
      nearestPoint = point
      nearestDistance = distance
    }
  }

  return nearestPoint
}

function estimateFacePoseFromMatrix(matrix: Matrix | undefined): Pose | null {
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

function clearCanvas(): void {
  thumbnailRenderToken += 1
  const context = canvas.getContext("2d")
  context?.clearRect(0, 0, canvas.width, canvas.height)
  thumbnailEmpty.hidden = false
}

function render(): void {
  const adjusted12pt = getAdjusted12pt()
  const currentManualAdjustments = getCurrentManualAdjustments()
  const frameState = getFrameStateDebug()
  const currentFrame = getCurrentAcceptedFrame()
  const frameBusy =
    state.loadStatus === "読込中" || state.scanState.status === "running"
  const rawDebugPayload = createRawDebugPayload(
    adjusted12pt,
    currentManualAdjustments,
    frameState,
  )

  controlStatus.textContent = `状態: ${formatControlStatus()}`
  poseReviewCandidateSummary.innerHTML = renderPoseReviewCandidateSummaryBrief()

  frameInfoGrid.innerHTML = renderStatusItems([
    [
      "review index",
      currentFrame ? `${state.currentReviewIndex + 1} / accepted ${state.acceptedFrames.length}` : "-",
    ],
    ["source frame index", currentFrame ? String(currentFrame.sourceFrameIndex) : "-"],
    ["time", currentFrame ? `${formatNumber(currentFrame.timeSec)} sec` : "-"],
    ["excluded", currentFrame ? formatJapaneseBoolean(currentFrame.excluded) : "-"],
    ["excluded reason", currentFrame ? formatExcludedReason(currentFrame.excludedReason) : "-"],
    ["badge", currentFrame ? formatFrameBadges(currentFrame.badges) : "-"],
  ])

  renderConsoleTabs()
  consoleContent.innerHTML = renderConsoleTabContent(
    adjusted12pt,
    currentManualAdjustments,
    rawDebugPayload,
  )

  toggleLandmarkSummaryButton.textContent = state.showLandmarkSummaryOverlay
    ? "12点サマリを非表示"
    : "12点サマリを表示"
  previousFrameButton.disabled = !state.metadata || state.currentReviewIndex <= 0 || frameBusy
  nextFrameButton.disabled =
    !state.metadata || state.currentReviewIndex >= state.acceptedFrames.length - 1 || frameBusy
  excludeFrameButton.disabled = !state.metadata || !currentFrame || frameBusy
  extractPoseReviewCandidatesButton.disabled = state.acceptedFrames.length === 0 || frameBusy
  rotationFitEvaluationButton.disabled =
    state.acceptedFrames.length === 0 || !state.poseReviewCandidateSummary || frameBusy
  stopScanButton.disabled = state.scanState.status !== "running"
}

function createRawDebugPayload(
  adjusted12pt: LandmarkSummaryPoint[],
  currentManualAdjustments: ManualLandmarkAdjustment[],
  frameState: ReturnType<typeof getFrameStateDebug>,
): Record<string, unknown> {
  return {
    status: {
      loadStatus: state.loadStatus,
      mediaPipeStatus: state.detectorStatus,
      mediaPipeError: state.detectorError,
      fileError: state.fileError,
    },
    metadata: state.metadata,
    frameState,
    scanState: getScanStateDebug(),
    expressionTooStrongThresholds: EXPRESSION_TOO_STRONG_THRESHOLDS,
    expressionTooStrongCount: getExpressionTooStrongCount(),
    poseBucket125Summary: getPoseBucket125Summary(),
    candidateSelectionSummary: state.poseReviewCandidateSummary,
    rotationFitEvaluation: state.rotationFitEvaluation,
    fittingLab12ptSearch: state.rotationFitEvaluation?.fittingLab12ptSearch ?? null,
    acceptedFramesPreview: getAcceptedFramesPreview(),
    mediaPipeFrameSummary: state.summary,
    landmarkSummaryPointCount: adjusted12pt.length,
    observed12pt: state.observed12pt,
    manualAdjustmentCount: currentManualAdjustments.length,
    manualAdjustments: currentManualAdjustments,
    manualAdjustmentFrameCount: getManualAdjustmentFrameCount(),
    manualAdjustmentsByFramePreview: getManualAdjustmentsByFramePreview(),
    adjustedLandmarkSummary: adjusted12pt,
    pose: state.pose
      ? {
          yaw: roundDebugNumber(state.pose.yaw),
          pitch: roundDebugNumber(state.pose.pitch),
          roll: roundDebugNumber(state.pose.roll),
        }
      : null,
  }
}

function createCurrentRawDebugPayload(): Record<string, unknown> {
  return createRawDebugPayload(getAdjusted12pt(), getCurrentManualAdjustments(), getFrameStateDebug())
}

function renderConsoleTabs(): void {
  for (const button of consoleTabButtons) {
    const tab = button.dataset.consoleTab as ConsoleTab
    const isActive = tab === state.consoleTab
    button.classList.toggle("is-active", isActive)
    button.setAttribute("aria-selected", String(isActive))
  }
}

function renderConsoleTabContent(
  adjusted12pt: LandmarkSummaryPoint[],
  currentManualAdjustments: ManualLandmarkAdjustment[],
  rawDebugPayload: Record<string, unknown>,
): string {
  switch (state.consoleTab) {
    case "landmarks12pt":
      return renderLandmarks12ptConsole(adjusted12pt)
    case "currentFrame":
      return renderCurrentFrameConsole(currentManualAdjustments)
    case "adjustments":
      return renderAdjustmentsConsole(currentManualAdjustments)
    case "scan":
      return renderScanConsole()
    case "pose":
      return renderPoseConsole()
    case "candidates":
      return renderCandidatesConsole()
    case "rotationFit":
      return renderRotationFitConsole()
    case "raw":
      return renderRawConsole(rawDebugPayload)
    case "summary":
    default:
      return renderSummaryConsole()
  }
}

function renderSummaryConsole(): string {
  const currentFrame = getCurrentAcceptedFrame()
  const poseBucket125Summary = getPoseBucket125Summary()
  return [
    renderConsoleSection(
      "File / Video",
      renderStatusItems([
        ["fileName", state.metadata?.fileName ?? "-"],
        ["fileSize", state.metadata ? formatFileSize(state.metadata.fileSize) : "-"],
        ["duration", state.metadata ? `${state.metadata.duration.toFixed(3)} 秒` : "-"],
        ["videoWidth", state.metadata ? String(state.metadata.videoWidth) : "-"],
        ["videoHeight", state.metadata ? String(state.metadata.videoHeight) : "-"],
      ]),
    ),
    renderConsoleSection(
      "Status",
      renderStatusItems([
        ["loadStatus", state.loadStatus],
        ["mediaPipeStatus", state.detectorStatus],
        ["mediaPipeError", state.detectorError ?? "-"],
        ["fileError", state.fileError ?? "-"],
      ]),
    ),
    renderConsoleSection(
      "Scan status brief",
      renderStatusItems([
        ["scan status", state.scanState.status],
        ["progress", `${Math.round(state.scanState.progress * 100)}%`],
        ["scannedFrameCount", String(state.scanState.scannedFrameCount)],
        ["acceptedFrameCount", String(state.scanState.acceptedFrameCount)],
        ["discardedNoFaceCount", String(state.scanState.discardedNoFaceCount)],
        [
          "discardedInvalidLandmarkCount",
          String(state.scanState.discardedInvalidLandmarkCount),
        ],
        ["expressionTooStrongCount", String(getExpressionTooStrongCount())],
      ]),
    ),
    renderConsoleSection(
      "Accepted frames",
      renderStatusItems([
        ["acceptedFrames", String(state.acceptedFrames.length)],
        ["excluded accepted frames", String(getExcludedAcceptedFrameCount())],
        ["手動調整済みフレーム数", String(getManualAdjustmentFrameCount())],
      ]),
    ),
    renderConsoleSection(
      "Pose bucket summary brief",
      renderStatusItems([
        [
          "poseBucket125 non-empty",
          `${poseBucket125Summary.nonEmptyBucketCount} / ${poseBucket125Summary.totalBucketCount}`,
        ],
        [
          "frontCandidate",
          formatPoseBucketCount(
            poseBucket125Summary.frontCandidateCount,
            poseBucket125Summary.acceptedFrameCount,
          ),
        ],
        [
          "expressionTooStrong",
          formatPoseBucketCount(
            poseBucket125Summary.expressionTooStrongCount,
            poseBucket125Summary.acceptedFrameCount,
          ),
        ],
        [
          "current poseBucket125",
          currentFrame?.poseBucket125?.id ?? "-",
        ],
      ]),
    ),
    renderConsoleSection(
      "Current frame brief",
      renderStatusItems([
        [
          "review index",
          currentFrame ? `${state.currentReviewIndex + 1} / ${state.acceptedFrames.length}` : "-",
        ],
        ["badges count", currentFrame ? String(currentFrame.badges.length) : "-"],
      ]),
    ),
  ].join("")
}

function renderCurrentFrameConsole(currentManualAdjustments: ManualLandmarkAdjustment[]): string {
  const currentFrame = getCurrentAcceptedFrame()
  const mediaPipeSummary = currentFrame?.mediaPipeSummary
  const pose = currentFrame?.pose
  return [
    renderConsoleSection(
      "Current Frame（現在フレーム）",
      renderStatusItems([
        [
          "Review",
          currentFrame ? `${state.currentReviewIndex + 1} / ${state.acceptedFrames.length}` : "-",
        ],
        ["reviewIndex", currentFrame ? String(state.currentReviewIndex + 1) : "-"],
        ["reviewCount", String(state.acceptedFrames.length)],
        ["sourceFrameIndex", currentFrame ? String(currentFrame.sourceFrameIndex) : "-"],
        ["time", currentFrame ? `${formatNumber(currentFrame.timeSec)} sec` : "-"],
        ["excluded", currentFrame ? formatBoolean(currentFrame.excluded) : "-"],
        ["excludedReason", currentFrame ? formatExcludedReason(currentFrame.excludedReason) : "-"],
      ]),
    ),
    renderConsoleSection("Badges", currentFrame ? renderFrameBadgesList(currentFrame.badges) : "なし"),
    renderConsoleSection(
      "Pose（姿勢）",
      renderStatusItems([
        ["Pose bucket 125", currentFrame?.poseBucket125?.id ?? "-"],
        ["yawBin", currentFrame?.poseBucket125?.yawBin ?? "-"],
        ["pitchBin", currentFrame?.poseBucket125?.pitchBin ?? "-"],
        ["rollBin", currentFrame?.poseBucket125?.rollBin ?? "-"],
        ["左右向き yaw", pose ? formatNumber(pose.yaw) : "-"],
        ["上下向き pitch", pose ? formatNumber(pose.pitch) : "-"],
        ["傾き roll", pose ? formatNumber(pose.roll) : "-"],
      ]),
    ),
    renderConsoleSection(
      "MediaPipe",
      renderStatusItems([
        ["detected", mediaPipeSummary ? formatBoolean(mediaPipeSummary.detected) : "-"],
        ["landmarkCount", mediaPipeSummary ? String(mediaPipeSummary.landmarkCount) : "-"],
        ["blendshapeCount", mediaPipeSummary ? String(mediaPipeSummary.blendshapeCount) : "-"],
        [
          "hasFacialTransformationMatrix",
          mediaPipeSummary ? formatBoolean(mediaPipeSummary.hasFacialTransformationMatrix) : "-",
        ],
        ["error", mediaPipeSummary?.error ?? "-"],
      ]),
    ),
    renderConsoleSection(
      "Expression（表情）",
      renderExpressionSummary(currentFrame?.expressionSummary, currentFrame),
    ),
    renderConsoleSection(
      "12pt",
      renderStatusItems([
        ["pointCount", currentFrame ? String(currentFrame.observed12pt.length) : "-"],
        ["adjustedPointCount", String(currentManualAdjustments.length)],
      ]),
    ),
    renderConsoleSection(
      "Manual adjustments（手動調整）",
      renderStatusItems([
        ["currentFrameAdjustmentCount", String(currentManualAdjustments.length)],
        ["adjusted point ids", formatAdjustedPointIds(currentManualAdjustments)],
      ]),
    ),
  ].join("")
}

function renderLandmarks12ptConsole(adjusted12pt: LandmarkSummaryPoint[]): string {
  const content =
    adjusted12pt.length > 0
      ? adjusted12pt
          .map(
            (point) => `
              <div class="landmark-summary-item ${point.id === state.selectedLandmarkSummaryPointId ? "selected" : ""}">
                <code>${escapeHtml(point.label)}</code>
                <span>${escapeHtml(formatConsoleLandmarkSummaryPoint(point))}</span>
              </div>
            `,
          )
          .join("")
      : `<div class="landmark-summary-item empty">12点サマリはありません。</div>`

  return renderConsoleSection("12pt landmark summary", `<div class="landmark-summary-grid">${content}</div>`)
}

function renderAdjustmentsConsole(
  currentManualAdjustments: ManualLandmarkAdjustment[],
): string {
  const selectedHasAdjustment =
    Boolean(state.selectedLandmarkSummaryPointId) &&
    currentManualAdjustments.some(
      (adjustment) => adjustment.id === state.selectedLandmarkSummaryPointId,
    )

  return [
    renderConsoleSection(
      "操作",
      `
        <div class="summary-actions">
          <button
            data-console-action="reset-selected"
            type="button"
            class="secondary-button"
            ${selectedHasAdjustment ? "" : "disabled"}
          >
            選択点をリセット
          </button>
          <button
            data-console-action="reset-current-frame"
            type="button"
            class="secondary-button"
            ${currentManualAdjustments.length > 0 ? "" : "disabled"}
          >
            現在フレームの全調整をリセット
          </button>
        </div>
      `,
    ),
    renderConsoleSection(
      "手動調整の状態",
      renderStatusItems([
        ["現在フレームの手動調整数", String(currentManualAdjustments.length)],
        ["手動調整済みフレーム数", String(getManualAdjustmentFrameCount())],
      ]),
    ),
    renderConsoleSection("現在フレーム", renderManualAdjustmentsList(currentManualAdjustments)),
    renderConsoleSection(
      "manualAdjustmentsByFramePreview",
      `<pre class="console-json">${escapeHtml(
        JSON.stringify(getManualAdjustmentsByFramePreview(), null, 2),
      )}</pre>`,
    ),
  ].join("")
}

function renderScanConsole(): string {
  return [
    renderConsoleSection(
      "Scan",
      renderStatusItems([
        ["scan status", state.scanState.status],
        ["progress", `${Math.round(state.scanState.progress * 100)}%`],
        ["scannedFrameCount", String(state.scanState.scannedFrameCount)],
        ["acceptedFrameCount", String(state.scanState.acceptedFrameCount)],
        ["expressionTooStrongCount", String(getExpressionTooStrongCount())],
        ["discardedNoFaceCount", String(state.scanState.discardedNoFaceCount)],
        [
          "discardedInvalidLandmarkCount",
          String(state.scanState.discardedInvalidLandmarkCount),
        ],
        ["maxScanDurationSec", String(state.scanState.maxScanDurationSec)],
        ["maxScanFrames", String(state.scanState.maxScanFrames)],
        ["error", state.scanState.error ?? "-"],
      ]),
    ),
    renderConsoleSection(
      "acceptedFramesPreview",
      `<pre class="console-json">${escapeHtml(
        JSON.stringify(getAcceptedFramesPreview(), null, 2),
      )}</pre>`,
    ),
  ].join("")
}

function renderPoseConsole(): string {
  const summary = getPoseBucket125Summary()
  return [
    renderConsoleSection(
      "Pose（姿勢）",
      renderStatusItems([
        ["accepted frame count", String(summary.acceptedFrameCount)],
        ["poseBucket125 non-empty count", String(summary.nonEmptyBucketCount)],
        ["poseBucket125 total count", String(summary.totalBucketCount)],
        ["frontCandidate", formatPoseBucketCount(summary.frontCandidateCount, summary.acceptedFrameCount)],
        [
          "expressionTooStrong",
          formatPoseBucketCount(summary.expressionTooStrongCount, summary.acceptedFrameCount),
        ],
        [
          "frontCandidate + expressionTooStrong",
          formatPoseBucketCount(
            summary.frontCandidateExpressionTooStrongCount,
            summary.acceptedFrameCount,
          ),
        ],
        [
          "frontCandidate + 表情大ではない",
          formatPoseBucketCount(
            summary.frontCandidateNotExpressionTooStrongCount,
            summary.acceptedFrameCount,
          ),
        ],
        ["excluded count", String(summary.excludedCount)],
      ]),
    ),
    renderConsoleSection(
      "Pose axis thresholds",
      renderPoseAxisThresholds(summary.thresholds),
    ),
    renderConsoleSection(
      "Pose bucket 125",
      renderPoseBucket125List(summary.buckets, summary.acceptedFrameCount),
    ),
  ].join("")
}

function renderCandidatesConsole(): string {
  const summary = state.poseReviewCandidateSummary
  if (!summary) {
    return renderConsoleSection(
      "Candidates（候補）",
      `<div class="landmark-summary-item empty">まだ抽出していません。左ペインの「125候補フレーム抽出」を押してください。</div>`,
    )
  }

  return [
    renderConsoleSection(
      "Summary（要約）",
      renderStatusItems([
        ["selectionMode（選択モード）", summary.selectionMode],
        ["primaryGrouping（主分類）", summary.policy.primaryGrouping],
        ["maxTargetPerBucket（bucketごとの最大目標数）", String(summary.maxTargetPerBucket)],
        [
          "minBalancedTargetPerBucket（均等候補の最小目標数）",
          String(summary.minBalancedTargetPerBucket),
        ],
        [
          "actualTargetPerBucket（採用したbucketごとの目標数）",
          String(summary.actualTargetPerBucket),
        ],
        ["balancedStatus（均等状態）", summary.balancedStatus],
        ["rollSelection（roll選択）", summary.rollSelection],
        [
          "roll_negative group（roll負方向）",
          summary.rollGroups.roll_negative.join(" / "),
        ],
        ["roll_center group（roll中心）", summary.rollGroups.roll_center.join(" / ")],
        [
          "roll_positive group（roll正方向）",
          summary.rollGroups.roll_positive.join(" / "),
        ],
        ["expressionTooStrong（強い表情）", summary.policy.expressionTooStrong],
        ["sampling（抽出方法）", summary.policy.sampling],
        ["targetTotal（目標合計）", String(summary.targetTotal)],
        ["selectedTotal（選択合計）", String(summary.selectedTotal)],
        ["fullBucketCount（充足bucket数）", String(summary.fullBucketCount)],
        ["shortageBucketCount（不足bucket数）", String(summary.shortageBucketCount)],
        [
          "excludedExpressionTooStrongCount（強い表情の除外数）",
          String(summary.excludedExpressionTooStrongCount),
        ],
      ]),
    ),
    renderConsoleSection(
      "Shortage buckets（不足bucket）",
      renderPoseReviewShortageBuckets(summary.shortageBuckets),
    ),
    renderConsoleSection(
      "Bucket list（bucket一覧）",
      renderPoseReviewCandidateBucketList(summary.buckets),
    ),
  ].join("")
}

function renderPoseReviewCandidateSummaryBrief(): string {
  const summary = state.poseReviewCandidateSummary
  if (!summary) {
    return ""
  }

  return renderStatusItems([
    ["selectionMode", summary.selectionMode],
    ["primaryGrouping", summary.policy.primaryGrouping],
    ["maxTargetPerBucket", String(summary.maxTargetPerBucket)],
    ["minBalancedTargetPerBucket", String(summary.minBalancedTargetPerBucket)],
    ["actualTargetPerBucket", String(summary.actualTargetPerBucket)],
    ["balancedStatus", summary.balancedStatus],
    ["rollSelection", summary.rollSelection],
    ["roll_negative group", summary.rollGroups.roll_negative.join(" / ")],
    ["roll_center group", summary.rollGroups.roll_center.join(" / ")],
    ["roll_positive group", summary.rollGroups.roll_positive.join(" / ")],
    ["expressionTooStrong", summary.policy.expressionTooStrong],
    ["sampling", summary.policy.sampling],
    ["targetTotal", String(summary.targetTotal)],
    ["selectedTotal", String(summary.selectedTotal)],
    ["selectedTotal / targetTotal", `${summary.selectedTotal} / ${summary.targetTotal}`],
    [
      "fullBucketCount / 25",
      `${summary.fullBucketCount} / ${POSE_REVIEW_YAW_PITCH_BUCKET_COUNT}`,
    ],
    [
      "shortageBucketCount / 25",
      `${summary.shortageBucketCount} / ${POSE_REVIEW_YAW_PITCH_BUCKET_COUNT}`,
    ],
    [
      "excludedExpressionTooStrongCount",
      String(summary.excludedExpressionTooStrongCount),
    ],
  ])
}

function renderPoseReviewShortageBuckets(
  shortageBuckets: PoseReviewCandidateShortageBucketSummary[],
): string {
  if (shortageBuckets.length === 0) {
    return `<div class="landmark-summary-item empty">No shortage buckets（不足bucketなし）</div>`
  }

  return `
    <div class="landmark-summary-grid pose-shortage-bucket-list">
      ${shortageBuckets.map(renderPoseReviewShortageBucket).join("")}
    </div>
  `
}

function renderPoseReviewShortageBucket(
  shortageBucket: PoseReviewCandidateShortageBucketSummary,
): string {
  return `
    <div class="landmark-summary-item pose-candidate-bucket">
      <code>${escapeHtml(shortageBucket.bucketId)}</code>
      <span>selected（選択） ${shortageBucket.selectedCount} / target（目標） ${shortageBucket.targetCount}</span>
      <span>shortage（不足） ${shortageBucket.shortageCount}</span>
      <span>accepted frames（acceptedFrames件数） ${shortageBucket.acceptedFrameCount}</span>
      <span>usable non-expression（表情が強くないusable件数） ${shortageBucket.usableNonExpressionCount}</span>
      <span>expressionTooStrong（強い表情） ${shortageBucket.expressionTooStrongCount}</span>
      <span>available roll_negative（利用可能なroll負方向） ${shortageBucket.availableRollNegativeCount}</span>
      <span>available roll_center（利用可能なroll中心） ${shortageBucket.availableRollCenterCount}</span>
      <span>available roll_positive（利用可能なroll正方向） ${shortageBucket.availableRollPositiveCount}</span>
      <span>selectedBy roll_negative（roll負方向で選択） ${shortageBucket.selectedByRollNegativeCount}</span>
      <span>selectedBy roll_center（roll中心で選択） ${shortageBucket.selectedByRollCenterCount}</span>
      <span>selectedBy roll_positive（roll正方向で選択） ${shortageBucket.selectedByRollPositiveCount}</span>
      <span>reason（理由） ${escapeHtml(formatPoseReviewShortageReason(shortageBucket.shortageReason))}</span>
    </div>
  `
}

function formatPoseReviewShortageReason(
  shortageReason: PoseReviewCandidateShortageReason,
): string {
  if (shortageReason === "not_enough_non_expression_frames") {
    return "not_enough_non_expression_frames（表情が強くないフレーム不足）"
  }
  if (shortageReason === "not_enough_pose_frames") {
    return "not_enough_pose_frames（その姿勢のフレーム不足）"
  }
  return "unknown（原因未分類）"
}

function renderPoseReviewCandidateBucketList(buckets: PoseReviewCandidateBucket[]): string {
  return `
    <div class="landmark-summary-grid pose-candidate-bucket-list">
      ${buckets.map(renderPoseReviewCandidateBucket).join("")}
    </div>
  `
}

function renderPoseReviewCandidateBucket(bucket: PoseReviewCandidateBucket): string {
  return `
    <div class="landmark-summary-item pose-candidate-bucket">
      <code>${escapeHtml(bucket.id)}</code>
      <span>selected（選択） ${bucket.selectedCount} / target（目標） ${bucket.targetCount}</span>
      <span>shortage（不足） ${bucket.shortageCount}</span>
      <span>available roll_negative（利用可能なroll負方向） ${bucket.availableRollNegativeCount}</span>
      <span>available roll_center（利用可能なroll中心） ${bucket.availableRollCenterCount}</span>
      <span>available roll_positive（利用可能なroll正方向） ${bucket.availableRollPositiveCount}</span>
      <span>selectedBy roll_negative（roll負方向で選択） ${bucket.selectedByRollNegativeCount}</span>
      <span>selectedBy roll_center（roll中心で選択） ${bucket.selectedByRollCenterCount}</span>
      <span>selectedBy roll_positive（roll正方向で選択） ${bucket.selectedByRollPositiveCount}</span>
      ${bucket.shortageReason ? `<span>reason（理由） ${escapeHtml(bucket.shortageReason)}</span>` : ""}
      ${renderPoseReviewCandidateFrames(bucket.selectedFrames)}
    </div>
  `
}

function renderPoseReviewCandidateFrames(frames: PoseReviewCandidateFrame[]): string {
  if (frames.length === 0) {
    return `<div class="candidate-frame-list empty">selected frames: -</div>`
  }

  return `
    <div class="candidate-frame-list">
      ${frames
        .map(
          (frame) => `
            <div class="candidate-frame-item">
              <span>sourceFrameIndex（元フレーム番号） ${frame.sourceFrameIndex}</span>
              <span>timeSec（秒） ${formatNumber(frame.timeSec)}</span>
              <span>rollBin（roll分類） ${escapeHtml(frame.rollBin)}</span>
              <span>rollGroup（rollグループ） ${escapeHtml(frame.rollGroup)}</span>
              <span>selectedBy（選択理由） ${escapeHtml(frame.selectedBy)}</span>
            </div>
          `,
        )
        .join("")}
    </div>
  `
}

function renderRotationFitConsole(): string {
  const evaluation = state.rotationFitEvaluation
  if (!evaluation) {
    return renderConsoleSection(
      "Rotation Fit（回転中心評価）",
      `<div class="landmark-summary-item empty">左ペインの「回転中心評価・粗探索」ボタンを押してください。Fitting Lab から踏襲するのは coordinate descent（座標降下探索）の手順のみで、rotationCenter.y/z（回転中心 y/z）と 12点 z（奥行き）は Render Consistency Lab 用 range（探索範囲）で探索します。</div>`,
    )
  }

  return [
    renderConsoleSection("Summary（要約）", renderRotationFitSummary(evaluation)),
    renderConsoleSection(
      "Coordinate descent（座標降下探索）",
      renderRotationFitCoordinateDescent(evaluation),
    ),
    renderConsoleSection("Top candidates（上位候補）", renderRotationFitTopCandidates(evaluation)),
    renderConsoleSection("Frame scores（フレーム別スコア）", renderRotationFitFrameScores(evaluation)),
    renderConsoleSection("Point scores（点別スコア）", renderRotationFitPointScores(evaluation)),
    renderConsoleSection("Bucket scores（姿勢分類別スコア）", renderRotationFitBucketScores(evaluation)),
    renderConsoleSection(
      "Raw JSON（生デバッグ JSON）",
      renderRawJsonBlock(evaluation, "rotation-fit"),
    ),
  ].join("")
}

function renderRotationFitSummary(evaluation: RotationFitEvaluation): string {
  return renderStatusItems([
    ["status", evaluation.status],
    ["error", evaluation.error ?? "-"],
    ["searchMode", evaluation.searchMode],
    ["evaluationFrameCount", String(evaluation.evaluationFrameCount)],
    [
      "baseFrameSource",
      evaluation.baseFrameSource
        ? `${evaluation.baseFrameSource.sourceFrameIndex} / ${formatNumber(
            evaluation.baseFrameSource.timeSec,
          )} sec / ${evaluation.baseFrameSource.reason}`
        : "-",
    ],
    ["videoAspectRatio", formatNumber(evaluation.videoAspectRatio)],
    ["fixedZPresetName", evaluation.fixedZPresetName],
    ["candidateCount", String(evaluation.candidateCount)],
    [
      "source method（元方式）",
      "tools/ideal-face-fitting-lab / 12pt_rotation_center",
    ],
    [
      "coordinate system note（座標系メモ）",
      "Fitting Lab の座標系ではなく Render adjusted12pt の aspect-corrected coordinate（横縦比補正済み座標）を使う",
    ],
    [
      "policy（方針）",
      "Fitting Lab から踏襲しているのは coordinate descent（座標降下探索）の手順のみです。x/y 座標系、rotationCenter range、12pt z range は Render Consistency Lab 用に再定義しています。",
    ],
    [
      "coordinateSystemSource（座標系の出所）",
      evaluation.fittingLab12ptSearch?.coordinateSystemSource ?? "-",
    ],
    [
      "rangeSource（探索範囲の出所）",
      evaluation.fittingLab12ptSearch?.rangeSource ?? "-",
    ],
    [
      "zRangeSource（12点奥行き探索範囲の出所）",
      evaluation.fittingLab12ptSearch?.zRangeSource ?? "-",
    ],
    [
      "fittingLabAlgorithmOnly（Fitting Lab は手順のみ）",
      evaluation.fittingLab12ptSearch
        ? String(evaluation.fittingLab12ptSearch.fittingLabAlgorithmOnly)
        : "-",
    ],
    [
      "zSymmetryMode（奥行き左右対称モード）",
      evaluation.fittingLab12ptSearch
        ? `${evaluation.fittingLab12ptSearch.zSymmetryMode}（左右ペアを同じ奥行きとして探索）`
        : "-",
    ],
    [
      "左右 z 差",
      evaluation.fittingLab12ptSearch?.leftRightZSymmetryDiagnostics
        ? formatRotationFitLeftRightZSymmetryDiagnostics(
            evaluation.fittingLab12ptSearch.leftRightZSymmetryDiagnostics,
          )
        : "-",
    ],
    [
      "coarseTotalScore（粗探索後の全体平均誤差）",
      evaluation.fittingLab12ptSearch?.coarseTotalScore !== undefined &&
      evaluation.fittingLab12ptSearch.coarseTotalScore !== null
        ? formatNumber(evaluation.fittingLab12ptSearch.coarseTotalScore)
        : "-",
    ],
    [
      "fineTotalScore（細かい追加探索後の全体平均誤差）",
      evaluation.fittingLab12ptSearch?.fineTotalScore !== undefined &&
      evaluation.fittingLab12ptSearch.fineTotalScore !== null
        ? formatNumber(evaluation.fittingLab12ptSearch.fineTotalScore)
        : "-",
    ],
    [
      "fineImprovement（細かい追加探索による改善量）",
      evaluation.fittingLab12ptSearch?.fineImprovement !== undefined &&
      evaluation.fittingLab12ptSearch.fineImprovement !== null
        ? formatNumber(evaluation.fittingLab12ptSearch.fineImprovement)
        : "-",
    ],
    [
      "rotationCenter.y range（回転中心y探索範囲）",
      formatRotationFitRange(
        RENDER_ROTATION_FIT_COORDINATE_DESCENT_RANGES["rotationCenter.y"],
      ),
    ],
    [
      "rotationCenter.z range（回転中心z探索範囲）",
      formatRotationFitRange(
        RENDER_ROTATION_FIT_COORDINATE_DESCENT_RANGES["rotationCenter.z"],
      ),
    ],
    [
      "candidateGeneration（候補生成）",
      evaluation.fittingLab12ptSearch?.candidateGeneration ?? "-",
    ],
    [
      "iterationCount（反復回数）",
      evaluation.fittingLab12ptSearch
        ? String(evaluation.fittingLab12ptSearch.coordinateDescentIterations)
        : "-",
    ],
    [
      "coordinateDescentOrder（座標降下探索順）",
      evaluation.fittingLab12ptSearch?.coordinateDescentParameterOrder.join(" -> ") ?? "-",
    ],
    [
      "best zByPointId（最良の点ごとの奥行き）",
      evaluation.bestCandidate ? formatRotationFitZByPointId(evaluation.bestCandidate.zByPointId) : "-",
    ],
    [
      "coordinateBoundaryStatus（探索範囲端ヒット状態）",
      evaluation.coordinateBoundaryStatus
        ? formatRotationFitCoordinateBoundaryStatusSummary(evaluation.coordinateBoundaryStatus)
        : "-",
    ],
    [
      "Boundary hits（範囲端ヒット）",
      evaluation.coordinateBoundaryStatus
        ? formatRotationFitCoordinateBoundaryHitSummary(evaluation.coordinateBoundaryStatus)
        : "-",
    ],
    [
      "improvement totalScore（改善量: 全体平均誤差）",
      evaluation.improvement
        ? `${formatNumber(evaluation.improvement.totalScoreBefore)} -> ${formatNumber(
            evaluation.improvement.totalScoreAfter,
          )} / delta ${formatNumber(evaluation.improvement.totalScoreDelta)}`
        : "-",
    ],
    [
      "improvement maxFrameScore（改善量: 最大フレーム誤差）",
      evaluation.improvement
        ? `${formatNumber(evaluation.improvement.maxFrameScoreBefore)} -> ${formatNumber(
            evaluation.improvement.maxFrameScoreAfter,
          )} / delta ${formatNumber(evaluation.improvement.maxFrameScoreDelta)}`
        : "-",
    ],
    [
      "bestRotationCenter.x",
      evaluation.bestRotationCenter ? formatNumber(evaluation.bestRotationCenter.x) : "-",
    ],
    [
      "bestRotationCenter.y",
      evaluation.bestRotationCenter ? formatNumber(evaluation.bestRotationCenter.y) : "-",
    ],
    [
      "bestRotationCenter.z",
      evaluation.bestRotationCenter ? formatNumber(evaluation.bestRotationCenter.z) : "-",
    ],
    [
      "boundaryStatus（範囲端ヒット状態）",
      `bestYAtMin: ${String(evaluation.boundaryStatus.bestYAtMin)} / bestYAtMax: ${String(
        evaluation.boundaryStatus.bestYAtMax,
      )} / bestZAtMin: ${String(evaluation.boundaryStatus.bestZAtMin)} / bestZAtMax: ${String(
        evaluation.boundaryStatus.bestZAtMax,
      )}`,
    ],
    [
      "warning（注意）",
      formatRotationFitBoundaryWarning(evaluation.boundaryStatus),
    ],
    ["focalLength", formatNumber(evaluation.focalLength)],
    ["best totalScore", formatNumber(evaluation.totalScore)],
    ["best maxFrameScore", formatNumber(evaluation.maxFrameScore)],
    [
      "worstFrame",
      evaluation.worstFrame
        ? `${evaluation.worstFrame.sourceFrameIndex} / score ${formatNumber(
            evaluation.worstFrame.frameScore,
          )}`
        : "-",
    ],
    [
      "worstPoint",
      evaluation.worstPoint
        ? `${evaluation.worstPoint.pointId} / avg ${formatNumber(
            evaluation.worstPoint.averageError,
          )} / max ${formatNumber(evaluation.worstPoint.maxError)}`
        : "-",
    ],
    [
      "bucketScores summary",
      `yaw ${evaluation.bucketScores.yaw.length} / pitch ${evaluation.bucketScores.pitch.length} / roll ${evaluation.bucketScores.roll.length} / yaw×pitch ${evaluation.bucketScores.yawPitch.length}`,
    ],
  ])
}

function renderRotationFitGroupZSearch(evaluation: RotationFitEvaluation): string {
  const stageB = evaluation.stageB
  if (!stageB) {
    return `<div class="landmark-summary-item empty">Stage B（段階B）の group z search（グループ単位奥行き探索）はまだ実行されていません。</div>`
  }

  return [
    renderStatusItems([
      ["searchMode（探索モード）", stageB.searchMode],
      [
        "groupZOffsetRange（グループ奥行き加算量の範囲）",
        `${formatNumber(stageB.groupZOffsetRange.min)} .. ${formatNumber(
          stageB.groupZOffsetRange.max,
        )} / step ${formatNumber(stageB.groupZOffsetRange.step)}`,
      ],
      ["iterationCount（反復回数）", String(stageB.iterationCount)],
      ["groupOffsets（グループ奥行き加算量）", formatRotationFitGroupOffsets(stageB.groupOffsets)],
      ["initialCandidate（初期候補）", formatRotationFitCandidateScoreSummary(stageB.initialCandidate)],
      ["bestCandidate（最良候補）", formatRotationFitCandidateScoreSummary(stageB.bestCandidate)],
    ]),
    renderRotationFitGroupDefinitions(stageB.groupDefinitions),
    renderRotationFitGroupSearchLogs(stageB.groupSearchLogs),
  ].join("")
}

function renderRotationFitGroupDefinitions(
  groupDefinitions: RotationFitZGroupDefinition[],
): string {
  return `
    <div class="landmark-summary-grid">
      ${groupDefinitions
        .map(
          (definition) => `
            <div class="landmark-summary-item">
              <code>${escapeHtml(definition.label)}</code>
              <span>${escapeHtml(definition.pointIds.join(", "))}</span>
            </div>
          `,
        )
        .join("")}
    </div>
  `
}

function renderRotationFitGroupSearchLogs(logs: RotationFitGroupSearchLog[]): string {
  if (logs.length === 0) {
    return `<div class="landmark-summary-item empty">groupSearchLogs（グループ探索ログ）はありません。</div>`
  }

  return `
    <div class="landmark-summary-grid pose-candidate-bucket-list">
      ${logs
        .map(
          (log) => `
            <div class="landmark-summary-item pose-candidate-bucket">
              <code>iteration ${log.iteration} / ${escapeHtml(log.groupId)}</code>
              <span>previousOffset（前回加算量） ${formatNumber(log.previousOffset)}</span>
              <span>selectedOffset（採用加算量） ${formatNumber(log.selectedOffset)}</span>
              <span>previousTotalScore（前回スコア） ${formatNumber(log.previousTotalScore)}</span>
              <span>selectedTotalScore（採用スコア） ${formatNumber(log.selectedTotalScore)}</span>
              <span>previousMaxFrameScore（前回最大フレーム誤差） ${formatNumber(log.previousMaxFrameScore)}</span>
              <span>selectedMaxFrameScore（採用最大フレーム誤差） ${formatNumber(log.selectedMaxFrameScore)}</span>
              <span>improved（改善） ${String(log.improved)}</span>
              <span>candidateCount（候補数） ${log.candidateCount}</span>
            </div>
          `,
        )
        .join("")}
    </div>
  `
}

function renderRotationFitCoordinateDescent(evaluation: RotationFitEvaluation): string {
  const search = evaluation.fittingLab12ptSearch
  if (!search) {
    return `<div class="landmark-summary-item empty">coordinateDescent（座標降下探索）はまだ実行されていません。</div>`
  }

  return [
    renderStatusItems([
      ["searchMode（探索モード）", search.searchMode],
      ["sourceLab（元実装）", search.sourceLab],
      ["sourcePointSetId（元点セット）", search.sourcePointSetId],
      ["coordinateSystemSource（座標系の出所）", search.coordinateSystemSource],
      ["rangeSource（探索範囲の出所）", search.rangeSource],
      ["zRangeSource（12点奥行き探索範囲の出所）", search.zRangeSource],
      ["fittingLabAlgorithmOnly（Fitting Lab は手順のみ踏襲）", String(search.fittingLabAlgorithmOnly)],
      [
        "zSymmetryMode（奥行き左右対称モード）",
        `${search.zSymmetryMode}（左右ペアを同じ奥行きとして探索）`,
      ],
      [
        "左右 z 差",
        search.leftRightZSymmetryDiagnostics
          ? formatRotationFitLeftRightZSymmetryDiagnostics(search.leftRightZSymmetryDiagnostics)
          : "-",
      ],
      [
        "coarseTotalScore（粗探索後の全体平均誤差）",
        search.coarseTotalScore !== null ? formatNumber(search.coarseTotalScore) : "-",
      ],
      [
        "fineTotalScore（細かい追加探索後の全体平均誤差）",
        search.fineTotalScore !== null ? formatNumber(search.fineTotalScore) : "-",
      ],
      [
        "fineImprovement（細かい追加探索による改善量）",
        search.fineImprovement !== null ? formatNumber(search.fineImprovement) : "-",
      ],
      [
        "policy（方針）",
        "Fitting Lab から踏襲しているのは coordinate descent（座標降下探索）の手順のみです。x/y 座標系、rotationCenter range、12pt z range は Render Consistency Lab 用に再定義しています。",
      ],
      ["baseCandidatePresetId（基準候補）", search.baseCandidatePresetId],
      ["candidateGeneration（候補生成）", search.candidateGeneration],
      ["coordinateDescentIterations（反復回数）", String(search.coordinateDescentIterations)],
      [
        "initialCandidate（初期候補）",
        formatRotationFitCandidateScoreSummary(search.initialCandidate),
      ],
      ["bestCandidate（最良候補）", formatRotationFitCandidateScoreSummary(search.bestCandidate)],
      [
        "bestRotationCenter（最良回転中心）",
        formatRotationFitCandidateRotationCenterSummary(search.bestCandidate),
      ],
      [
        "best zByPointId（最良の点ごとの奥行き）",
        search.bestCandidate ? formatRotationFitZByPointId(search.bestCandidate.zByPointId) : "-",
      ],
      [
        "totalScore（全体スコア）",
        search.bestCandidate ? formatNumber(search.bestCandidate.totalScore) : "-",
      ],
      [
        "maxFrameScore（最大フレームスコア）",
        search.bestCandidate ? formatNumber(search.bestCandidate.maxFrameScore) : "-",
      ],
      [
        "coordinateBoundaryStatus（探索範囲端ヒット状態）",
        search.coordinateBoundaryStatus
          ? formatRotationFitCoordinateBoundaryStatusSummary(search.coordinateBoundaryStatus)
          : "-",
      ],
      [
        "Boundary hits（範囲端ヒット）",
        search.coordinateBoundaryStatus
          ? formatRotationFitCoordinateBoundaryHitSummary(search.coordinateBoundaryStatus)
          : "-",
      ],
      [
        "parameterImprovementSummary（探索対象ごとの改善量要約）",
        formatRotationFitParameterImprovementSummary(search.parameterImprovementSummary),
      ],
    ]),
    renderRotationFitCoordinateDescentRanges(search.coordinateDescentRanges),
    renderRotationFitStageParameterImprovements(search),
    renderRotationFitCoordinateDescentLog(search.coordinateDescentLog),
  ].join("")
}

function renderRotationFitStageParameterImprovements(
  search: RotationFitFittingLab12ptSearch,
): string {
  return `
    <section class="parameter-improvement-section">
      <h4>Improvement by parameter（探索対象ごとの改善量）</h4>
      <h5>Coarse search（粗探索）</h5>
      ${renderRotationFitParameterImprovements(search.searchStages.coarse.parameterImprovements, false)}
      <h5>Fine search（細かい追加探索）</h5>
      ${renderRotationFitParameterImprovements(search.searchStages.fine.parameterImprovements, false)}
    </section>
  `
}

function renderRotationFitParameterImprovements(
  parameterImprovements: RotationFitParameterImprovement[],
  showHeading = true,
): string {
  if (parameterImprovements.length === 0) {
    return `<div class="landmark-summary-item empty">Improvement by parameter（探索対象ごとの改善量）はありません。</div>`
  }

  return `
    <section class="parameter-improvement-section">
      ${showHeading ? "<h4>Improvement by parameter（探索対象ごとの改善量）</h4>" : ""}
      <div class="parameter-improvement-table-wrap">
        <table class="parameter-improvement-table">
          <thead>
            <tr>
              <th>parameter（探索対象）</th>
              <th>iteration（反復）</th>
              <th>valueBefore</th>
              <th>valueAfter</th>
              <th>scoreBefore</th>
              <th>scoreAfter</th>
              <th>improvement（改善量）</th>
              <th>maxFrameScoreBefore</th>
              <th>maxFrameScoreAfter</th>
              <th>maxFrameScoreImprovement（最大フレーム改善量）</th>
              <th>status（状態）</th>
            </tr>
          </thead>
          <tbody>
            ${parameterImprovements
              .map((item) => {
                const improvement = roundDebugNumber(item.scoreBefore - item.scoreAfter)
                const maxFrameImprovement = roundDebugNumber(
                  item.maxFrameScoreBefore - item.maxFrameScoreAfter,
                )
                const isStrongImprovement = item.improved && improvement > 0
                return `
                  <tr class="${isStrongImprovement ? "is-improved" : ""}">
                    <td><code>${escapeHtml(item.parameter)}</code></td>
                    <td>${item.iteration}</td>
                    <td>${formatNumber(item.valueBefore)}</td>
                    <td>${formatNumber(item.valueAfter)}</td>
                    <td>${formatNumber(item.scoreBefore)}</td>
                    <td>${formatNumber(item.scoreAfter)}</td>
                    <td>${formatNumber(improvement)}</td>
                    <td>${formatNumber(item.maxFrameScoreBefore)}</td>
                    <td>${formatNumber(item.maxFrameScoreAfter)}</td>
                    <td>${formatNumber(maxFrameImprovement)}</td>
                    <td>${item.improved ? "improved（改善）" : "no change（変化なし）"}</td>
                  </tr>
                `
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </section>
  `
}

function renderRotationFitCoordinateDescentRanges(
  ranges: Record<RotationFitLocalSearchParameter, RotationFitSearchRange>,
): string {
  return `
    <div class="landmark-summary-grid">
      ${ROTATION_FIT_FITTING_LAB_PARAMETER_ORDER.map((parameter) => {
        const range = ranges[parameter]
        return `
          <div class="landmark-summary-item">
            <code>${escapeHtml(parameter)}</code>
            <span>${formatNumber(range.min)} .. ${formatNumber(range.max)} / step ${formatNumber(range.step)}</span>
          </div>
        `
      }).join("")}
    </div>
  `
}

function renderRotationFitCoordinateDescentLog(
  logs: RotationFitCoordinateDescentStepLog[],
): string {
  if (logs.length === 0) {
    return `<div class="landmark-summary-item empty">coordinateDescentLog（座標降下探索ログ）はありません。</div>`
  }

  return `
    <div class="landmark-summary-grid pose-candidate-bucket-list">
      ${logs
        .map(
          (log) => `
            <div class="landmark-summary-item pose-candidate-bucket">
              <code>${log.stage ? `${escapeHtml(log.stage)} / ` : ""}iteration ${log.iteration} / ${escapeHtml(log.parameter)}</code>
              <span>previousValue（前回値） ${formatNumber(log.previousValue)}</span>
              <span>bestValue（最良値） ${formatNumber(log.bestValue)}</span>
              <span>previousTotalScore（前回スコア） ${formatNumber(log.previousTotalScore)}</span>
              <span>bestTotalScore（最良スコア） ${formatNumber(log.bestTotalScore)}</span>
              <span>previousMaxFrameScore（前回最大フレーム誤差） ${formatNumber(log.previousMaxFrameScore)}</span>
              <span>bestMaxFrameScore（最良最大フレーム誤差） ${formatNumber(log.bestMaxFrameScore)}</span>
              <span>candidateCount（候補数） ${log.candidateCount}</span>
              <span>improved（改善） ${String(log.improved)}</span>
            </div>
          `,
        )
        .join("")}
    </div>
  `
}

function formatRotationFitCandidateRotationCenterSummary(
  candidate: RotationFitCandidateResult | null,
): string {
  if (!candidate) {
    return "-"
  }
  return `x ${formatNumber(candidate.rotationCenter.x)} / y ${formatNumber(
    candidate.rotationCenter.y,
  )} / z ${formatNumber(candidate.rotationCenter.z)}`
}

function formatRotationFitCandidateScoreSummary(
  candidate: RotationFitCandidateResult | null,
): string {
  if (!candidate) {
    return "-"
  }
  return `totalScore ${formatNumber(candidate.totalScore)} / maxFrameScore ${formatNumber(
    candidate.maxFrameScore,
  )}`
}

function formatRotationFitBoundaryStatus(
  boundaryStatus: RotationFitSearchBoundaryStatus,
): string {
  return `bestYAtMin: ${String(boundaryStatus.bestYAtMin)} / bestYAtMax: ${String(
    boundaryStatus.bestYAtMax,
  )} / bestZAtMin: ${String(boundaryStatus.bestZAtMin)} / bestZAtMax: ${String(
    boundaryStatus.bestZAtMax,
  )}`
}

function formatRotationFitCoordinateBoundaryStatusSummary(
  boundaryStatus: RotationFitCoordinateBoundaryStatus,
): string {
  return ROTATION_FIT_FITTING_LAB_PARAMETER_ORDER.map((parameter) => {
    const status = boundaryStatus[parameter]
    return `${parameter}: min ${String(status.bestAtMin)} / max ${String(status.bestAtMax)}`
  }).join(" / ")
}

function formatRotationFitCoordinateBoundaryHitSummary(
  boundaryStatus: RotationFitCoordinateBoundaryStatus,
): string {
  const hits = ROTATION_FIT_FITTING_LAB_PARAMETER_ORDER.flatMap((parameter) => {
    const status = boundaryStatus[parameter]
    return [
      ...(status.bestAtMin ? [`${parameter}: min`] : []),
      ...(status.bestAtMax ? [`${parameter}: max`] : []),
    ]
  })
  return hits.length > 0 ? hits.join(" / ") : "No coordinate boundary hits（範囲端ヒットなし）"
}

function formatRotationFitParameterImprovementSummary(
  summary: RotationFitParameterImprovementSummary,
): string {
  return [
    `totalImprovement ${formatNumber(summary.totalImprovement)}`,
    `bestImprovingParameter ${summary.bestImprovingParameter ?? "-"}`,
    `noImprovementParameters ${summary.noImprovementParameters.length}`,
    `boundaryHitParameters ${summary.boundaryHitParameters.length}`,
  ].join(" / ")
}

function formatRotationFitLeftRightZSymmetryDiagnostics(
  diagnostics: RotationFitLeftRightZSymmetryDiagnostics,
): string {
  return [
    `cheek: ${formatNumber(diagnostics.cheekDelta)}`,
    `eye: ${formatNumber(diagnostics.eyeDelta)}`,
    `jaw: ${formatNumber(diagnostics.jawDelta)}`,
  ].join(" / ")
}

function formatRotationFitRange(range: RotationFitSearchRange): string {
  return `${formatNumber(range.min)} .. ${formatNumber(range.max)} / step ${formatNumber(range.step)}`
}

function formatRotationFitGroupOffsets(
  groupOffsets: Record<RotationFitZGroupId, number>,
): string {
  return ROTATION_FIT_Z_GROUP_SEARCH_ORDER.map(
    (groupId) => `${groupId}: ${formatNumber(groupOffsets[groupId])}`,
  ).join(" / ")
}

function formatRotationFitZByPointId(zByPointId: Record<string, number>): string {
  return ROTATION_CENTER_12_SEMANTIC_DEFINITIONS.map((definition) => definition.id)
    .map((pointId) => `${pointId}: ${formatNumber(zByPointId[pointId] ?? 0)}`)
    .join(" / ")
}

function formatRotationFitBoundaryWarning(
  boundaryStatus: RotationFitSearchBoundaryStatus,
): string {
  if (boundaryStatus.bestYAtMax) {
    return "best rotationCenter.y is at search max（最良の回転中心yが探索範囲の上限にあります）"
  }
  if (boundaryStatus.bestYAtMin) {
    return "best rotationCenter.y is at search min（最良の回転中心yが探索範囲の下限にあります）"
  }
  if (boundaryStatus.bestZAtMax) {
    return "best rotationCenter.z is at search max（最良の回転中心zが探索範囲の上限にあります）"
  }
  if (boundaryStatus.bestZAtMin) {
    return "best rotationCenter.z is at search min（最良の回転中心zが探索範囲の下限にあります）"
  }
  return "-"
}

function renderRotationFitTopCandidates(evaluation: RotationFitEvaluation): string {
  if (evaluation.topCandidates.length === 0) {
    return `<div class="landmark-summary-item empty">top candidates（上位候補）はありません。</div>`
  }

  return `
    <div class="landmark-summary-grid pose-candidate-bucket-list">
      ${evaluation.topCandidates
        .map(
          (candidate) => `
            <div class="landmark-summary-item pose-candidate-bucket">
              <code>rank ${candidate.rank}</code>
              <span>rotationCenter.y（回転中心y） ${formatNumber(candidate.rotationCenter.y)}</span>
              <span>rotationCenter.z（回転中心z） ${formatNumber(candidate.rotationCenter.z)}</span>
              <span>totalScore（総合スコア） ${formatNumber(candidate.totalScore)}</span>
              <span>maxFrameScore（最大フレームスコア） ${formatNumber(candidate.maxFrameScore)}</span>
              <span>worstPoint（最大誤差点） ${candidate.worstPoint ? escapeHtml(candidate.worstPoint.pointId) : "-"}</span>
              <span>worstFrame sourceFrameIndex ${candidate.worstFrame ? candidate.worstFrame.sourceFrameIndex : "-"}</span>
            </div>
          `,
        )
        .join("")}
    </div>
  `
}

function renderRotationFitFrameScores(evaluation: RotationFitEvaluation): string {
  if (evaluation.frameScores.length === 0) {
    return `<div class="landmark-summary-item empty">frame scores（フレーム別スコア）はありません。</div>`
  }

  return `
    <div class="landmark-summary-grid pose-candidate-bucket-list">
      ${evaluation.frameScores.map(renderRotationFitFrameScore).join("")}
    </div>
  `
}

function renderRotationFitFrameScore(frameScore: RotationFitFrameScore): string {
  return `
    <div class="landmark-summary-item pose-candidate-bucket">
      <code>sourceFrameIndex ${frameScore.sourceFrameIndex}</code>
      <span>timeSec（秒） ${formatNumber(frameScore.timeSec)}</span>
      <span>yaw / pitch / roll ${formatNumber(frameScore.yaw)} / ${formatNumber(frameScore.pitch)} / ${formatNumber(frameScore.roll)}</span>
      <span>frameScore（フレーム平均誤差） ${formatNumber(frameScore.frameScore)}</span>
      <span>worstPoint（最大誤差点） ${escapeHtml(frameScore.worstPoint)}</span>
      <span>worstPointError（最大点誤差） ${formatNumber(frameScore.worstPointError)}</span>
    </div>
  `
}

function renderRotationFitPointScores(evaluation: RotationFitEvaluation): string {
  if (evaluation.pointScores.length === 0) {
    return `<div class="landmark-summary-item empty">point scores（点別スコア）はありません。</div>`
  }

  return `
    <div class="landmark-summary-grid">
      ${evaluation.pointScores
        .map(
          (pointScore) => `
            <div class="landmark-summary-item">
              <code>${escapeHtml(pointScore.pointId)}</code>
              <span>averageError（平均誤差） ${formatNumber(pointScore.averageError)}</span>
              <span>maxError（最大誤差） ${formatNumber(pointScore.maxError)}</span>
            </div>
          `,
        )
        .join("")}
    </div>
  `
}

function renderRotationFitBucketScores(evaluation: RotationFitEvaluation): string {
  return [
    renderRotationFitBucketScoreGroup("yaw negative / center / positive", evaluation.bucketScores.yaw),
    renderRotationFitBucketScoreGroup(
      "pitch negative / center / positive",
      evaluation.bucketScores.pitch,
    ),
    renderRotationFitBucketScoreGroup("roll negative / center / positive", evaluation.bucketScores.roll),
    renderRotationFitBucketScoreGroup("yaw × pitch bucket", evaluation.bucketScores.yawPitch),
  ].join("")
}

function renderRotationFitBucketScoreGroup(
  title: string,
  bucketScores: RotationFitBucketScore[],
): string {
  if (bucketScores.length === 0) {
    return `<div class="landmark-summary-item empty">${escapeHtml(title)}: -</div>`
  }

  return `
    <div class="landmark-summary-grid">
      <div class="landmark-summary-item">
        <code>${escapeHtml(title)}</code>
        ${bucketScores
          .map(
            (bucketScore) =>
              `<span>${escapeHtml(bucketScore.bucket)} / frames ${bucketScore.frameCount} / avg ${formatNumber(
                bucketScore.averageFrameScore,
              )} / max ${formatNumber(bucketScore.maxFrameScore)}</span>`,
          )
          .join("")}
      </div>
    </div>
  `
}

function renderRawConsole(rawDebugPayload: Record<string, unknown>): string {
  return renderConsoleSection(
    "rawDebug",
    renderRawJsonBlock(rawDebugPayload, "debug"),
  )
}

function renderRawJsonBlock(payload: unknown, source: "debug" | "rotation-fit"): string {
  return `
    <div class="raw-json-actions">
      <button type="button" class="secondary-button" data-console-action="copy-raw-json" data-raw-json-source="${source}">
        Raw JSONをコピー
      </button>
      ${
        state.rawJsonCopyStatus
          ? `<span class="raw-json-copy-status">${escapeHtml(state.rawJsonCopyStatus)}</span>`
          : ""
      }
    </div>
    <pre class="console-json">${escapeHtml(JSON.stringify(payload, null, 2))}</pre>
  `
}

async function copyRawJsonToClipboard(source: string | undefined): Promise<void> {
  const payload = source === "rotation-fit" ? state.rotationFitEvaluation : createCurrentRawDebugPayload()
  const text = JSON.stringify(payload, null, 2)

  try {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text)
      } catch {
        if (!copyTextWithFallback(text)) {
          throw new Error("Clipboard API failed")
        }
      }
    } else if (!copyTextWithFallback(text)) {
      throw new Error("Clipboard API is unavailable")
    }
    state.rawJsonCopyStatus = "Raw JSONをコピーしました"
  } catch {
    state.rawJsonCopyStatus = "Raw JSONのコピーに失敗しました"
  }

  render()
}

function copyTextWithFallback(text: string): boolean {
  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "true")
  textarea.style.position = "fixed"
  textarea.style.left = "-9999px"
  textarea.style.top = "0"
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  textarea.setSelectionRange(0, textarea.value.length)

  try {
    return document.execCommand("copy")
  } finally {
    document.body.removeChild(textarea)
  }
}

function renderPoseBucket125List(
  buckets: PoseBucket125SummaryItem[],
  acceptedFrameCount: number,
): string {
  return `
    <div class="landmark-summary-grid pose-bucket-list">
      ${buckets
        .map(
          (bucket) => `
            <div class="landmark-summary-item">
              <code>${escapeHtml(bucket.id)}</code>
              <span>${escapeHtml(formatPoseBucketSummaryValue(bucket, acceptedFrameCount))}</span>
            </div>
          `,
        )
        .join("")}
    </div>
  `
}

function renderPoseAxisThresholds(
  thresholds: typeof POSE_AXIS_BIN_THRESHOLDS,
): string {
  const axisItems: PoseAxisName[] = ["yaw", "pitch", "roll"]
  return `
    <div class="landmark-summary-grid">
      ${axisItems
        .map((axisName) => {
          const threshold = thresholds[axisName]
          return `
            <div class="landmark-summary-item">
              <code>${axisName}</code>
              <span>center: ±${threshold.centerAbsMax}</span>
              <span>negativeSmall: -${threshold.negativeSmallMax} 〜 -${threshold.centerAbsMax}</span>
              <span>positiveSmall: ${threshold.centerAbsMax} 〜 ${threshold.positiveSmallMax}</span>
            </div>
          `
        })
        .join("")}
    </div>
  `
}

function renderFrameBadgesList(badges: FrameBadge[]): string {
  if (badges.length === 0) {
    return `<div class="landmark-summary-item empty">なし</div>`
  }

  return `
    <div class="landmark-summary-grid">
      ${badges
        .map(
          (badge) => `
            <div class="landmark-summary-item">
              <code>${escapeHtml(formatBadgeDisplayLabel(badge))}</code>
              <span>${escapeHtml(badge.description)}</span>
            </div>
          `,
        )
        .join("")}
    </div>
  `
}

function renderExpressionSummary(
  expressionSummary: ExpressionScoreSummary | undefined,
  currentFrame: AcceptedFrameSnapshot | null,
): string {
  if (!expressionSummary) {
    return `<div class="landmark-summary-item empty">なし</div>`
  }

  const expressionScoreItems = EXPRESSION_CATEGORY_NAMES.flatMap((categoryName) => {
    const score = expressionSummary[categoryName]
    return score === undefined ? [] : [[categoryName, formatNumber(score)] as [string, string]]
  })

  return renderStatusItems([
    ["maxScore", formatNumber(expressionSummary.maxScore)],
    ["maxCategoryName", expressionSummary.maxCategoryName ?? "-"],
    [
      "expressionTooStrong",
      currentFrame ? formatBoolean(hasFrameBadge(currentFrame, "expressionTooStrong")) : "-",
    ],
    ...expressionScoreItems,
  ])
}

function formatAdjustedPointIds(adjustments: ManualLandmarkAdjustment[]): string {
  return adjustments.length > 0 ? adjustments.map((adjustment) => adjustment.id).join(", ") : "なし"
}

function renderConsoleSection(title: string, body: string): string {
  return `
    <section class="console-section">
      <h3>${escapeHtml(title)}</h3>
      ${body}
    </section>
  `
}

function renderManualAdjustmentsList(
  adjustments: ManualLandmarkAdjustment[],
): string {
  if (adjustments.length === 0) {
    return `<div class="landmark-summary-item empty">現在フレームの手動調整はありません。</div>`
  }

  return `
    <div class="landmark-summary-grid">
      ${adjustments
        .map(
          (adjustment) => `
            <div class="landmark-summary-item">
              <code>${escapeHtml(adjustment.id)}</code>
              <span>dx ${formatNumber(adjustment.dx)} / dy ${formatNumber(adjustment.dy)}</span>
            </div>
          `,
        )
        .join("")}
    </div>
  `
}

function getFrameStateDebug(): {
  currentReviewIndex: number
  currentSourceFrameIndex?: number
  currentTimeSec: number
  scanFrameStepSeconds: number
  estimatedFrameCount: number
  currentFrameExcluded: boolean
  excludedFrameCount: number
} {
  const currentFrame = getCurrentAcceptedFrame()
  return {
    currentReviewIndex: state.currentReviewIndex,
    currentSourceFrameIndex: currentFrame?.sourceFrameIndex,
    currentTimeSec: roundDebugNumber(currentFrame?.timeSec ?? 0),
    scanFrameStepSeconds: roundDebugNumber(SCAN_FRAME_STEP_SECONDS),
    estimatedFrameCount: getEstimatedFrameCount(),
    currentFrameExcluded: isCurrentFrameExcluded(),
    excludedFrameCount: getExcludedAcceptedFrameCount(),
  }
}

function getScanStateDebug(): ScanState & {
  currentReviewIndex: number
  currentSourceFrameIndex?: number
  currentTimeSec?: number
} {
  const currentFrame = getCurrentAcceptedFrame()
  return {
    ...state.scanState,
    currentReviewIndex: state.currentReviewIndex,
    currentSourceFrameIndex: currentFrame?.sourceFrameIndex,
    currentTimeSec: currentFrame?.timeSec,
  }
}

function getExcludedAcceptedFrameCount(): number {
  return state.acceptedFrames.filter((frame) => frame.excluded).length
}

function getPoseBucket125Summary(): {
  acceptedFrameCount: number
  totalBucketCount: number
  nonEmptyBucketCount: number
  frontCandidateCount: number
  expressionTooStrongCount: number
  frontCandidateExpressionTooStrongCount: number
  frontCandidateNotExpressionTooStrongCount: number
  excludedCount: number
  thresholds: typeof POSE_AXIS_BIN_THRESHOLDS
  buckets: PoseBucket125SummaryItem[]
} {
  const bucketCountById = new Map<string, number>()
  for (const frame of state.acceptedFrames) {
    if (!frame.poseBucket125) {
      continue
    }

    bucketCountById.set(
      frame.poseBucket125.id,
      (bucketCountById.get(frame.poseBucket125.id) ?? 0) + 1,
    )
  }

  const acceptedFrameCount = state.acceptedFrames.length
  const buckets = POSE_BUCKET_125_DEFINITIONS.map((definition) => {
    const count = bucketCountById.get(definition.id) ?? 0
    return {
      ...definition,
      count,
      percent: acceptedFrameCount > 0 ? (count / acceptedFrameCount) * 100 : 0,
    }
  })

  return {
    acceptedFrameCount,
    totalBucketCount: POSE_BUCKET_125_TOTAL_COUNT,
    nonEmptyBucketCount: buckets.filter((bucket) => bucket.count > 0).length,
    frontCandidateCount: getFrontCandidateCount(),
    expressionTooStrongCount: getExpressionTooStrongCount(),
    frontCandidateExpressionTooStrongCount: getFrontCandidateExpressionTooStrongCount(),
    frontCandidateNotExpressionTooStrongCount: getFrontCandidateWithoutExpressionTooStrongCount(),
    excludedCount: getExcludedAcceptedFrameCount(),
    thresholds: POSE_AXIS_BIN_THRESHOLDS,
    buckets,
  }
}

function getFrontCandidateCount(): number {
  return state.acceptedFrames.filter((frame) => hasFrameBadge(frame, "frontCandidate")).length
}

function getExpressionTooStrongCount(): number {
  return state.acceptedFrames.filter((frame) => hasFrameBadge(frame, "expressionTooStrong")).length
}

function getFrontCandidateExpressionTooStrongCount(): number {
  return state.acceptedFrames.filter(
    (frame) => hasFrameBadge(frame, "frontCandidate") && hasFrameBadge(frame, "expressionTooStrong"),
  ).length
}

function getFrontCandidateWithoutExpressionTooStrongCount(): number {
  return state.acceptedFrames.filter(
    (frame) =>
      hasFrameBadge(frame, "frontCandidate") && !hasFrameBadge(frame, "expressionTooStrong"),
  ).length
}

function hasFrameBadge(frame: AcceptedFrameSnapshot, badgeId: string): boolean {
  return frame.badges.some((badge) => badge.id === badgeId)
}

function formatPoseBucketCount(count: number, total: number): string {
  const rate = total > 0 ? (count / total) * 100 : 0
  return `${count} / ${total} (${rate.toFixed(2)}%)`
}

function formatPoseBucketSummaryValue(
  bucket: PoseBucket125SummaryItem,
  acceptedFrameCount: number,
): string {
  return `${bucket.count} / ${acceptedFrameCount} (${bucket.percent.toFixed(2)}%)`
}

function formatFrameBadges(badges: FrameBadge[]): string {
  return badges.length > 0 ? badges.map(formatBadgeDisplayLabel).join(", ") : "なし"
}

function formatBadgeDisplayLabel(badge: FrameBadge): string {
  return badge.label.includes(badge.id) ? badge.label : `${badge.label} ${badge.id}`
}

function formatExcludedReason(reason?: ExcludedReason): string {
  if (reason === "manual") {
    return "手動 manual"
  }
  return "-"
}

function getManualAdjustmentFrameCount(): number {
  return Object.values(state.manualAdjustmentsByFrame).filter(
    (adjustments) => adjustments.length > 0,
  ).length
}

function getManualAdjustmentsByFramePreview(): Array<{
  sourceFrameIndex: number
  adjustmentCount: number
  adjustments: ManualLandmarkAdjustment[]
}> {
  return Object.entries(state.manualAdjustmentsByFrame)
    .map(([sourceFrameIndex, adjustments]) => ({
      sourceFrameIndex: Number(sourceFrameIndex),
      adjustmentCount: adjustments.length,
      adjustments,
    }))
    .filter((entry) => entry.adjustmentCount > 0)
    .sort((left, right) => left.sourceFrameIndex - right.sourceFrameIndex)
    .slice(0, MANUAL_ADJUSTMENTS_BY_FRAME_PREVIEW_LIMIT)
}

function getAcceptedFramesPreview(): Array<{
  sourceFrameIndex: number
  timeSec: number
  detected: boolean
  observedPointCount: number
  yaw?: number
  pitch?: number
  roll?: number
  poseBucket125?: string
  badges: string[]
  excluded: boolean
  excludedReason?: ExcludedReason
  expressionMaxScore?: number
  expressionMaxCategoryName?: string
}> {
  return state.acceptedFrames
    .map((frame) => ({
      sourceFrameIndex: frame.sourceFrameIndex,
      timeSec: frame.timeSec,
      detected: frame.mediaPipeSummary.detected,
      observedPointCount: frame.observed12pt.length,
      yaw: frame.pose?.yaw,
      pitch: frame.pose?.pitch,
      roll: frame.pose?.roll,
      poseBucket125: frame.poseBucket125?.id,
      badges: frame.badges.map((badge) => badge.id),
      excluded: frame.excluded,
      excludedReason: frame.excludedReason,
      expressionMaxScore: frame.expressionSummary?.maxScore,
      expressionMaxCategoryName: frame.expressionSummary?.maxCategoryName,
    }))
    .slice(0, ACCEPTED_FRAMES_PREVIEW_LIMIT)
}

function renderStatusItems(items: Array<[string, string]>): string {
  return items
    .map(
      ([label, value]) => `
        <div class="status-item">
          <span class="status-label">${escapeHtml(label)}</span>
          <span class="status-value">${escapeHtml(value)}</span>
        </div>
      `,
    )
    .join("")
}

function formatControlStatus(): string {
  if (state.fileError) {
    return "エラー"
  }
  if (state.scanState.status === "running") {
    return "スキャン中"
  }
  if (state.scanState.status === "completed") {
    return "完了"
  }
  if (state.scanState.status === "cancelled") {
    return "停止済み"
  }
  if (state.scanState.status === "error") {
    return "エラー"
  }
  return state.loadStatus
}

function formatBoolean(value: boolean): string {
  return value ? "true" : "false"
}

function formatJapaneseBoolean(value: boolean): string {
  return value ? "はい" : "いいえ"
}

function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toFixed(3) : "-"
}

function getVideoAspectRatio(): number {
  if (!state.metadata || state.metadata.videoHeight <= 0) {
    return 1
  }
  return state.metadata.videoWidth / state.metadata.videoHeight
}

function formatFileSize(size: number): string {
  if (!Number.isFinite(size)) {
    return "-"
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }
  return `${(size / 1024 / 1024).toFixed(2)} MB`
}

function formatConsoleLandmarkSummaryPoint(point: LandmarkSummaryPoint): string {
  const observed = state.observed12pt.find((item) => item.id === point.id)
  const adjustment = getManualAdjustment(point.id)
  const adjustedSummary = `adjusted x ${formatNumber(point.x)} / y ${formatNumber(point.y)}`
  const observedSummary = observed
    ? `observed x ${formatNumber(observed.x)} / y ${formatNumber(observed.y)}`
    : "observed -"
  const manualSummary = adjustment
    ? ` / 手動調整あり dx ${formatNumber(adjustment.dx)} / dy ${formatNumber(adjustment.dy)}`
    : " / 手動調整なし"

  return `識別子 ${point.id} / ${adjustedSummary} / ${observedSummary} / 奥行き ${
    point.z === undefined ? "-" : formatNumber(point.z)
  } / 参照番号 ${point.sourceIndices.join(", ")}${manualSummary}`
}

function average(values: number[]): number {
  const validValues = values.filter((value) => Number.isFinite(value))
  return validValues.length === 0
    ? 0
    : validValues.reduce((sum, value) => sum + value, 0) / validValues.length
}

function distance2D(left: Point2D, right: Point2D): number {
  return Math.hypot(left.x - right.x, left.y - right.y)
}

function degreesToRadians(value: number): number {
  return (value / 180) * Math.PI
}

function roundDebugNumber(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value
}

function roundRecordNumbers(values: Record<string, number>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, roundDebugNumber(value)]),
  )
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function getElement<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id)
  if (!element) {
    throw new Error(`#${id} is missing`)
  }
  return element as T
}
