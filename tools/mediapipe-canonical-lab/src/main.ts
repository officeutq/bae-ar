import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision"
import type { Matrix, NormalizedLandmark } from "@mediapipe/tasks-vision"
import "./style.css"

type CaptureBucket =
  | "front"
  | "yawPositiveSmall"
  | "yawPositiveMid"
  | "yawPositiveStrong"
  | "yawNegativeSmall"
  | "yawNegativeMid"
  | "yawNegativeStrong"
  | "pitchPositive"
  | "pitchNegative"
  | "mixedPose"
  | "unknown"

type StabilityBucket =
  | "front"
  | "yawPositive"
  | "yawNegative"
  | "pitchPositive"
  | "pitchNegative"
  | "mixedPose"
  | "unknown"

type TransformName =
  | "normalized_xyz_direct"
  | "image_centered_same_unit"
  | "face_bounds_centered"
  | "no_inverse_canonicalized_baseline"

type MatrixConventionName =
  | "row_major_column_vector"
  | "row_major_row_vector"
  | "column_major_column_vector"
  | "column_major_row_vector"

type TranslationMode = "lastColumn" | "lastRow" | "none"

type Canonical468Status = "not_imported" | "loaded" | "invalid"

type Empirical478CandidateName =
  | "face_bounds_normalized_no_matrix"
  | "pose_rotation_inverse_engine_convention"
  | "inverse_matrix_engine_pose_convention"
  | "inverse_matrix_translation_last_row"
  | "rotation_only_then_normalize"
  | "per_bucket_pose_normalized"

type Empirical478InputSpace =
  | "normalized_xyz_direct"
  | "image_centered_same_unit"
  | "face_bounds_centered_width_unit"
  | "face_bounds_centered_height_unit"

type Empirical478Normalization =
  | "width_unit"
  | "height_unit"
  | "bbox_max_unit"
  | "xy_separate_debug_only"

type Empirical478WarningCode =
  | "insufficientCaptureCount"
  | "insufficientFrontFrames"
  | "insufficientYawPositiveFrames"
  | "insufficientYawNegativeFrames"
  | "insufficientPitchPositiveFrames"
  | "insufficientPitchNegativeFrames"
  | "bucketImbalance"
  | "matrixMissing"
  | "landmarkCountMismatch"
  | "expressionTooStrong"
  | "rollTooLarge"
  | "candidateUnstable"
  | "semanticPointUnstable"
  | "leftRightBucketMismatch"
  | "pitchBucketMismatch"
  | "xySeparateScaleDebugOnly"
  | "canonical468ReferenceOnly"
  | "empiricalCanonical478NotProductionReady"

type CanonicalProjectionCandidateName =
  | "raw_matrix_then_normalize_bounds"
  | "raw_matrix_then_fit_current_bounds_uniform"
  | "raw_matrix_then_fit_current_bounds_xy"
  | "rotation_only_then_fit_current_bounds_uniform"
  | "rotation_only_then_fit_current_bounds_xy"
  | "translation_included_then_fit_current_bounds_uniform"
  | "translation_included_then_fit_current_bounds_xy"

interface Point3 {
  x: number
  y: number
  z: number
}

interface LandmarkPoint extends Point3 {
  index: number
}

interface Pose {
  yaw: number
  pitch: number
  roll: number
}

interface BlendshapeCapture {
  categoryName: string
  score: number
}

interface MatrixCapture {
  rows: number
  columns: number
  values: number[]
  metadata: {
    source: "MediaPipe FaceLandmarker facialTransformationMatrixes[0].data"
    ordering: "row-major"
    indexFormula: "values[row * columns + column]"
    maps: "MediaPipe canonical face to detected face"
  }
}

interface FrameSnapshot {
  detected: boolean
  timestamp: number
  videoTime: number
  videoWidth: number
  videoHeight: number
  landmarks: NormalizedLandmark[]
  facialTransformationMatrix: Matrix | null
  blendshapes: BlendshapeCapture[]
  pose: Pose | null
}

interface CaptureRecord {
  captureId: string
  capturedAt: string
  videoTime: number
  videoWidth: number
  videoHeight: number
  pose: Pose | null
  landmarks: LandmarkPoint[]
  facialTransformationMatrix: MatrixCapture | null
  blendshapes: BlendshapeCapture[]
  bucket: CaptureBucket
  notes: string[]
  warnings: string[]
  previewDataUrl: string | null
}

interface CapturesPayload {
  schemaVersion: "mediapipe_canonical_lab_captures_v1"
  createdAt: string
  tool?: {
    name: string
    version: string
  }
  source?: {
    detector: string
    landmarkCount: number
  }
  summary?: {
    captureCount: number
    bucketCounts: Record<string, number>
  }
  captures: CaptureRecord[]
}

interface BoundsSummary {
  xMin: number
  xMax: number
  width: number
  yMin: number
  yMax: number
  height: number
  zMin: number
  zMax: number
  zRange: number
  aspectRatio: number | null
}

interface SemanticPoints {
  noseTip: Point3 | null
  eyeCenter: Point3 | null
  mouthCenter: Point3 | null
  chin: Point3 | null
  leftCheek: Point3 | null
  rightCheek: Point3 | null
  leftContour: Point3 | null
  rightContour: Point3 | null
}

interface SemanticSummary {
  points: SemanticPoints
  z: {
    noseTipZ: number | null
    eyeCenterZ: number | null
    mouthCenterZ: number | null
    chinZ: number | null
    cheekDepthDelta: number | null
    contourDepthDelta: number | null
  }
}

interface SemanticIndexDebug {
  noseTip: number[]
  eyeCenter: {
    leftEye: number[]
    rightEye: number[]
  }
  mouthCenter: number[]
  chin: number[]
  leftCheek: number[]
  rightCheek: number[]
  leftContour: number[]
  rightContour: number[]
}

interface Canonical468Summary {
  status: Canonical468Status
  source: string | null
  vertexCount: number
  bounds: BoundsSummary | null
  centroid: Point3 | null
  boundsCenter: Point3 | null
  zRange: number | null
  semanticSummary: SemanticSummary
  semanticIndexDebug: SemanticIndexDebug
  warnings: string[]
}

interface ImportedCanonical468 {
  status: Canonical468Status
  source: string
  vertices: LandmarkPoint[]
  summary: Canonical468Summary
}

interface CaptureRawAnalysis {
  captureId: string
  bucket: CaptureBucket
  landmarkCount: number
  bounds: BoundsSummary | null
  centroid: Point3 | null
  boundsCenter: Point3 | null
  semanticSummary: SemanticSummary
}

interface MatrixAnalysis {
  captureId: string
  available: boolean
  enginePoseConvention: MatrixConventionName
  labPoseConvention: MatrixConventionName
  assumption: {
    ordering: "row-major"
    indexFormula: "values[row * columns + column]"
    vectorConvention: "column-vector point, pDetected = M * pCanonical"
    maps: "MediaPipe canonical face to detected face"
  }
  rawValues: number[] | null
  rawTranslationCandidates: {
    lastRow: Point3 | null
    lastColumn: Point3 | null
  }
  translation: Point3 | null
  interpretedTranslationByConvention: Record<MatrixConventionName, Point3 | null>
  poseByConvention: Record<MatrixConventionName, MatrixConventionPoseSummary>
  conventionComparison: MatrixConventionCaptureSummary[]
  approximateScale: number | null
  rotationBasis: {
    xAxis: Point3
    yAxis: Point3
    zAxis: Point3
  } | null
  determinant: number | null
  extractedPose: Pose | null
  capturePose: Pose | null
  poseDelta: Pose | null
  inverseAvailable: boolean
  warnings: string[]
}

interface MatrixConventionDefinition {
  name: MatrixConventionName
  rawOrdering: "row-major" | "column-major"
  vectorConvention: "column-vector" | "row-vector"
  transformDescription: string
  translationMode: TranslationMode
}

interface MatrixConventionPoseSummary {
  extractedPose: Pose | null
  capturePose: Pose | null
  poseDelta: Pose | null
}

interface MatrixConventionCaptureSummary extends MatrixConventionPoseSummary {
  matrixConvention: MatrixConventionName
  translationMode: TranslationMode
  interpretedTranslation: Point3 | null
  approximateScale: number | null
  determinant: number | null
  inverseAvailable: boolean
  forwardProjectionApproximation: {
    averageError3D: number | null
    maxError3D: number | null
    sampleCount: number
    note: string
  }
  warnings: string[]
}

interface SourceCaptureSummary {
  captureCount: number
  bucketCounts: Record<CaptureBucket, number>
  landmarkCount: {
    expected: number
    min: number | null
    max: number | null
    allExpected: boolean
  }
  matrixAvailableCount: number
  videoSizeSummary: {
    uniqueSizes: string[]
    minWidth: number | null
    maxWidth: number | null
    minHeight: number | null
    maxHeight: number | null
  }
  poseRange: {
    yaw: RangeSummary
    pitch: RangeSummary
    roll: RangeSummary
  }
}

interface RangeSummary {
  min: number | null
  max: number | null
}

interface CandidateDefinition {
  transformName: TransformName
  description: string
  assumptions: string[]
  usesInverseMatrix: boolean
}

interface PerCaptureCandidateSummary {
  captureId: string
  bucket: CaptureBucket
  pointCount: number
  canonicalLikeBounds: BoundsSummary | null
  centroid: Point3 | null
  warnings: string[]
}

interface PerLandmarkStability {
  index: number
  mean: Point3
  stdDevX: number
  stdDevY: number
  stdDevZ: number
  stdDev3D: number
  sampleCount: number
}

interface PointStability {
  mean: Point3 | null
  stdDevX: number | null
  stdDevY: number | null
  stdDevZ: number | null
  stdDev3D: number | null
  sampleCount: number
}

interface CandidateStability {
  perLandmarkMean: PerLandmarkStability[]
  averageStdDevX: number | null
  averageStdDevY: number | null
  averageStdDevZ: number | null
  averageStdDev3D: number | null
  maxStdDevLandmark: PerLandmarkStability | null
  semanticPointStability: {
    noseTip: PointStability
    eyeCenter: PointStability
    mouthCenter: PointStability
    chin: PointStability
    cheek: PointStability
  }
  bucketStability: Record<StabilityBucket, BucketStability>
}

interface BucketStability {
  sampleCount: number
  averageStdDev3D: number | null
}

interface TransformCandidateAnalysis {
  transformName: TransformName
  matrixConvention: MatrixConventionName | null
  translationMode: TranslationMode
  description: string
  assumptions: string[]
  perCaptureCanonicalLikeBounds: PerCaptureCandidateSummary[]
  averagedCanonicalLikeBounds: BoundsSummary | null
  frameToFrameStability: CandidateStability
  abnormalBoundsCount: number
  hugeValueWarningCount: number
  score: number | null
  warnings: string[]
}

interface StabilityRankingEntry {
  transformName: TransformName
  matrixConvention: MatrixConventionName | null
  translationMode: TranslationMode
  averageStdDev3D: number | null
  averageStdDevX: number | null
  averageStdDevY: number | null
  averageStdDevZ: number | null
  semanticPointStability: TransformCandidateAnalysis["frameToFrameStability"]["semanticPointStability"]
  noseStdDev3D: number | null
  zRangeStability: number | null
  abnormalBoundsCount: number
  hugeValueWarningCount: number
  score: number | null
  sampleCount: number
}

interface CanonicalProjectionCandidateDefinition {
  candidateName: CanonicalProjectionCandidateName
  transformMode: "raw" | "rotation_only" | "translation_included"
  normalizationMode: "normalize_bounds" | "fit_current_bounds_uniform" | "fit_current_bounds_xy"
  usesTranslation: boolean
  description: string
}

interface SemanticPointErrorSummary {
  noseTip: number | null
  eyeCenter: number | null
  mouthCenter: number | null
  chin: number | null
  cheek: number | null
}

interface CanonicalProjectionMetrics {
  averageDistance2D: number | null
  medianDistance2D: number | null
  maxDistance2D: number | null
  averageDx: number | null
  averageDy: number | null
  semanticPointError: SemanticPointErrorSummary
  centerWeightedDistance: number | null
  outerContourDistance: number | null
  mouthEyeDistance: number | null
  all468Distance: number | null
  averageZDifference: number | null
  zRangeRatio: number | null
  noseZDifference: number | null
  cheekZDifference: number | null
}

interface CanonicalProjectionPerCaptureResult {
  captureId: string
  bucket: StabilityBucket
  candidateName: CanonicalProjectionCandidateName
  matrixConvention: MatrixConventionName
  translationMode: TranslationMode
  pointCount: number
  transformedBounds: BoundsSummary | null
  currentBounds: BoundsSummary | null
  metrics: CanonicalProjectionMetrics
  warnings: string[]
}

interface CanonicalProjectionRankingEntry {
  candidateName: CanonicalProjectionCandidateName
  matrixConvention: MatrixConventionName
  translationMode: TranslationMode
  averageDistance2D: number | null
  centerWeightedDistance: number | null
  semanticPointErrorSummary: number | null
  warningCount: number
  score: number | null
  sampleCount: number
}

interface CanonicalProjectionAnalysis {
  status: "not_available" | "computed"
  candidates: CanonicalProjectionCandidateDefinition[]
  matrixConventions: MatrixConventionDefinition[]
  perCaptureResults: CanonicalProjectionPerCaptureResult[]
  overallRanking: CanonicalProjectionRankingEntry[]
  bestMatrixConvention: CanonicalProjectionRankingEntry | null
  bestProjectionCandidate: CanonicalProjectionRankingEntry | null
  bucketRanking: Record<StabilityBucket, CanonicalProjectionRankingEntry[]>
  warnings: string[]
}

interface Empirical478CandidateDefinition {
  candidateName: Empirical478CandidateName
  description: string
  usesMatrix: boolean
  matrixConvention: MatrixConventionName | null
  runtimeCompatible: boolean
}

interface FrameWeightDetail {
  captureId: string
  bucket: StabilityBucket
  frameWeight: number
  poseMagnitude: number | null
  poseQuality: number
  rollQuality: number
  expressionNeutrality: number
  bucketBalance: number
  excluded: boolean
  warnings: Empirical478WarningCode[]
}

interface FrameWeightSummary {
  inputFrameCount: number
  usableFrameCount: number
  excludedFrameCount: number
  totalWeight: number
  averageWeight: number | null
  bucketCounts: Record<StabilityBucket, number>
  bucketWeightTotals: Record<StabilityBucket, number>
  details: FrameWeightDetail[]
  warnings: Empirical478WarningCode[]
}

interface Empirical478SemanticStability {
  noseTip: PointStability
  eyeCenter: PointStability
  mouthCenter: PointStability
  chin: PointStability
  leftCheek: PointStability
  rightCheek: PointStability
  leftContour: PointStability
  rightContour: PointStability
}

interface Empirical478GroupStability {
  faceBoundary: BucketStability
  eyes: BucketStability
  nose: BucketStability
  mouth: BucketStability
  cheeks: BucketStability
  jaw: BucketStability
}

interface Empirical478CandidateResult {
  candidateName: Empirical478CandidateName
  inputSpace: Empirical478InputSpace
  normalization: Empirical478Normalization
  matrixConvention: MatrixConventionName | null
  runtimeCompatible: boolean
  transformedFrameCount: number
  frameWeightTotal: number
  averageStdDev3D: number | null
  averageStdDevX: number | null
  averageStdDevY: number | null
  averageStdDevZ: number | null
  medianStdDev3D: number | null
  maxStdDev3D: number | null
  unstableLandmarkCount: number
  perLandmarkMean: LandmarkPoint[]
  perLandmarkStdDev: Array<{
    index: number
    stdDevX: number
    stdDevY: number
    stdDevZ: number
    stdDev3D: number
    sampleCount: number
  }>
  semanticPointStability: Empirical478SemanticStability
  groupStability: Empirical478GroupStability
  bucketStability: Record<StabilityBucket, BucketStability>
  warnings: Empirical478WarningCode[]
  warningCount: number
  score: number | null
}

interface Empirical478RankingEntry {
  candidateName: Empirical478CandidateName
  inputSpace: Empirical478InputSpace
  normalization: Empirical478Normalization
  matrixConvention: MatrixConventionName | null
  averageStdDev3D: number | null
  semanticAverageStdDev3D: number | null
  unstableLandmarkCount: number
  warningCount: number
  score: number | null
}

interface EmpiricalCanonicalLandmark extends LandmarkPoint {
  stdDevX: number
  stdDevY: number
  stdDevZ: number
  stdDev3D: number
  sampleCount: number
}

interface EmpiricalCanonical478 {
  debugArtifact: true
  sourceTransformCandidate: TransformName | Empirical478CandidateName
  sourceCandidate?: Empirical478RankingEntry
  landmarks: EmpiricalCanonicalLandmark[]
  summary: {
    bounds: BoundsSummary | null
    centroid: Point3 | null
    boundsCenter: Point3 | null
    zRange: number | null
    widthHeightRatio?: number | null
    widthDepthRatio?: number | null
    heightDepthRatio?: number | null
    semanticSummary: SemanticSummary
    frameCount?: number
    sourceCandidate?: Empirical478RankingEntry
    warningSummary?: Empirical478WarningCode[]
  }
}

interface Canonical468ReferenceComparison {
  status: "not_available" | "available"
  note: string
  bestOverall: EmpiricalCanonical478Comparison | null
  runtimeCompatible: EmpiricalCanonical478Comparison | null
}

interface EmpiricalCanonical478Comparison {
  sourceCandidate: Empirical478RankingEntry | null
  boundsRatio: {
    width: number | null
    height: number | null
    aspectRatio: number | null
  }
  zRangeRatio: number | null
  semanticPointDelta: Record<keyof SemanticPoints, number | null>
  averageDistanceAfterSimpleNormalization: number | null
}

interface Empirical478Analysis {
  status: "available" | "not_available"
  analysisVersion: "empirical_478_canonical_debug_v1"
  frameWeightSummary: FrameWeightSummary
  candidateResults: Empirical478CandidateResult[]
  overallStabilityRanking: Empirical478RankingEntry[]
  runtimeCompatibleRanking: Empirical478RankingEntry[]
  bucketRanking: Record<StabilityBucket, Empirical478RankingEntry[]>
  bestOverallCandidate: Empirical478RankingEntry | null
  bestRuntimeCompatibleCandidate: Empirical478RankingEntry | null
  empiricalCanonical478BestOverall: EmpiricalCanonical478 | null
  empiricalCanonical478RuntimeCompatible: EmpiricalCanonical478 | null
  canonical468ReferenceComparison: Canonical468ReferenceComparison
  warnings: Empirical478WarningCode[]
}

interface AnalysisResult {
  schemaVersion: "mediapipe_canonical_lab_analysis_v1"
  analysisVersion:
    | "matrix_convention_debug_v1"
    | "canonical_468_projection_debug_v1"
    | "empirical_478_canonical_debug_v1"
  generatedAt: string
  sourceCaptureSummary: SourceCaptureSummary
  rawCaptureSummaries: CaptureRawAnalysis[]
  matrixSummaries: MatrixAnalysis[]
  matrixConventionAnalysis: MatrixAnalysis[]
  translationCandidates: Array<{
    captureId: string
    lastRow: Point3 | null
    lastColumn: Point3 | null
  }>
  poseByConvention: Array<{
    captureId: string
    conventions: Record<MatrixConventionName, MatrixConventionPoseSummary>
  }>
  transformCandidates: TransformCandidateAnalysis[]
  transformConventionCandidates: TransformCandidateAnalysis[]
  stabilityRanking: StabilityRankingEntry[]
  stabilityRankingByConvention: StabilityRankingEntry[]
  bestStabilityTransformCandidate: TransformName | null
  selectedBestConventionCandidate: StabilityRankingEntry | null
  empiricalCanonical478: EmpiricalCanonical478 | null
  canonical468: Canonical468Summary
  canonicalProjectionAnalysis: CanonicalProjectionAnalysis
  selectedBestCanonicalProjectionCandidate: CanonicalProjectionRankingEntry | null
  empirical478Analysis: Empirical478Analysis
  warnings: string[]
}

interface AppState {
  cameraStatus: "idle" | "starting" | "running" | "error"
  detectorStatus: "idle" | "initializing" | "ready" | "error"
  detectorError: string | null
  cameraError: string | null
  detectCount: number
  lastSkippedReason: string | null
  clipboardMessage: string | null
  importMessage: string | null
  analysisMessage: string | null
  latestFrame: FrameSnapshot | null
  captures: CaptureRecord[]
  importedCaptures: CaptureRecord[]
  importedFileName: string | null
  canonical468: ImportedCanonical468 | null
  canonicalImportMessage: string | null
  analysis: AnalysisResult | null
  loopStartedAt: number | null
}

const EXPECTED_LANDMARK_COUNT = 478
const CANONICAL_468_LANDMARK_COUNT = 468
const RAD_TO_DEG = 180 / Math.PI
const EPSILON = 1e-9

const NOSE_TIP_INDEX = 4
const MOUTH_CENTER_INDICES = [13, 14]
const CHIN_INDEX = 152
const LEFT_CHEEK_INDEX = 234
const RIGHT_CHEEK_INDEX = 454
const LEFT_CONTOUR_INDEX = 127
const RIGHT_CONTOUR_INDEX = 356
const LEFT_IRIS_INDICES = [474, 475, 476, 477]
const RIGHT_IRIS_INDICES = [469, 470, 471, 472]
const LEFT_EYE_INDICES = [263, 362]
const RIGHT_EYE_INDICES = [33, 133]
const MOUTH_ERROR_INDICES = [
  0, 13, 14, 17, 37, 39, 40, 61, 78, 80, 81, 82, 84, 87, 88, 91, 95,
  146, 178, 181, 185, 191, 267, 269, 270, 291, 308, 310, 311, 312,
  314, 317, 318, 321, 324, 375, 402, 405, 409, 415,
]
const EYE_ERROR_INDICES = [
  7, 33, 133, 144, 145, 153, 154, 155, 157, 158, 159, 160, 161, 163,
  173, 246, 249, 263, 362, 373, 374, 380, 381, 382, 384, 385, 386, 387,
  388, 390, 398, 466,
]
const OUTER_CONTOUR_INDICES = [
  10, 21, 54, 58, 67, 93, 103, 109, 127, 132, 136, 148, 149, 150,
  152, 162, 172, 176, 234, 251, 284, 288, 297, 323, 332, 338, 356,
  361, 365, 377, 378, 379, 389, 397, 400, 454,
]
const NOSE_GROUP_INDICES = [
  1, 2, 4, 5, 6, 19, 45, 48, 64, 94, 97, 98, 115, 168, 195, 197, 220,
  275, 278, 294, 326, 327, 344, 440,
]
const CHEEK_GROUP_INDICES = [50, 101, 116, 117, 118, 119, 123, 147, 187, 205, 206, 207, 216, 280, 330, 345, 346, 347, 348, 352, 376, 411, 425, 426, 427, 436]
const JAW_GROUP_INDICES = [136, 148, 149, 150, 152, 172, 176, 377, 378, 379, 365, 397, 400]
const EMPIRICAL_478_INPUT_SPACES: Empirical478InputSpace[] = [
  "face_bounds_centered_width_unit",
  "image_centered_same_unit",
  "normalized_xyz_direct",
  "face_bounds_centered_height_unit",
]
const EMPIRICAL_478_NORMALIZATIONS: Empirical478Normalization[] = [
  "width_unit",
  "height_unit",
  "bbox_max_unit",
  "xy_separate_debug_only",
]
const EMPIRICAL_478_CANDIDATES: Empirical478CandidateDefinition[] = [
  {
    candidateName: "face_bounds_normalized_no_matrix",
    description: "Baseline: center current 478 by face bounds and normalize without matrix inverse.",
    usesMatrix: false,
    matrixConvention: null,
    runtimeCompatible: true,
  },
  {
    candidateName: "pose_rotation_inverse_engine_convention",
    description: "Apply inverse yaw/pitch/roll using the current Engine pose extraction convention.",
    usesMatrix: true,
    matrixConvention: "row_major_column_vector",
    runtimeCompatible: true,
  },
  {
    candidateName: "inverse_matrix_engine_pose_convention",
    description: "Apply inverse matrix with the Lab/Engine row-major column-vector convention.",
    usesMatrix: true,
    matrixConvention: "row_major_column_vector",
    runtimeCompatible: true,
  },
  {
    candidateName: "inverse_matrix_translation_last_row",
    description: "Apply inverse matrix with translation interpreted from values[12..14].",
    usesMatrix: true,
    matrixConvention: "row_major_row_vector",
    runtimeCompatible: false,
  },
  {
    candidateName: "rotation_only_then_normalize",
    description: "Apply inverse rotation/scale only, ignore translation, then normalize bounds.",
    usesMatrix: true,
    matrixConvention: "row_major_column_vector",
    runtimeCompatible: true,
  },
  {
    candidateName: "per_bucket_pose_normalized",
    description: "Pose inverse candidate kept separate so bucket rankings reveal pose-specific drift.",
    usesMatrix: true,
    matrixConvention: "row_major_column_vector",
    runtimeCompatible: true,
  },
]

const SEMANTIC_INDEX_DEBUG: SemanticIndexDebug = {
  noseTip: [NOSE_TIP_INDEX],
  eyeCenter: {
    leftEye: LEFT_EYE_INDICES,
    rightEye: RIGHT_EYE_INDICES,
  },
  mouthCenter: MOUTH_CENTER_INDICES,
  chin: [CHIN_INDEX],
  leftCheek: [LEFT_CHEEK_INDEX],
  rightCheek: [RIGHT_CHEEK_INDEX],
  leftContour: [LEFT_CONTOUR_INDEX],
  rightContour: [RIGHT_CONTOUR_INDEX],
}

const BUCKETS: CaptureBucket[] = [
  "front",
  "yawPositiveSmall",
  "yawPositiveMid",
  "yawPositiveStrong",
  "yawNegativeSmall",
  "yawNegativeMid",
  "yawNegativeStrong",
  "pitchPositive",
  "pitchNegative",
  "mixedPose",
  "unknown",
]

const STABILITY_BUCKETS: StabilityBucket[] = [
  "front",
  "yawPositive",
  "yawNegative",
  "pitchPositive",
  "pitchNegative",
  "mixedPose",
  "unknown",
]

const CANDIDATE_DEFINITIONS: CandidateDefinition[] = [
  {
    transformName: "normalized_xyz_direct",
    description:
      "landmark.x / y / z をそのまま 3D 点として扱い、facialTransformationMatrix の逆行列を適用します。",
    assumptions: [
      "normalized landmark と matrix が同じ座標系に近い可能性を試す",
      "row-major の 4x4 matrix を canonical -> detected とみなす",
    ],
    usesInverseMatrix: true,
  },
  {
    transformName: "image_centered_same_unit",
    description:
      "x/y を画像中心基準にし、video aspect を x に反映した same-unit 風座標へ変換してから逆行列を適用します。",
    assumptions: [
      "xSame = (x - 0.5) * videoAspect",
      "ySame = y - 0.5",
      "z は landmark.z をそのまま使う",
    ],
    usesInverseMatrix: true,
  },
  {
    transformName: "face_bounds_centered",
    description:
      "顔 bounds center を原点にし、顔サイズで x/y/z を正規化してから逆行列を適用します。",
    assumptions: [
      "scale は max(face width, face height)",
      "z も bounds center z からの差分を同じ scale で正規化する",
    ],
    usesInverseMatrix: true,
  },
  {
    transformName: "no_inverse_canonicalized_baseline",
    description:
      "逆行列を使わず、顔 bounds center / scale で current landmarks を正規化する比較用 baseline です。",
    assumptions: [
      "matrix なしでも計算できる",
      "inverse transform candidate の安定性比較用",
    ],
    usesInverseMatrix: false,
  },
]

const CANONICAL_PROJECTION_CANDIDATES: CanonicalProjectionCandidateDefinition[] = [
  {
    candidateName: "raw_matrix_then_normalize_bounds",
    transformMode: "raw",
    normalizationMode: "normalize_bounds",
    usesTranslation: true,
    description:
      "Apply the matrix to canonical 468, then compare canonical/current x/y after separate bounds normalization.",
  },
  {
    candidateName: "raw_matrix_then_fit_current_bounds_uniform",
    transformMode: "raw",
    normalizationMode: "fit_current_bounds_uniform",
    usesTranslation: true,
    description:
      "Apply the raw matrix, then align transformed canonical to current bounds with one x/y scale.",
  },
  {
    candidateName: "raw_matrix_then_fit_current_bounds_xy",
    transformMode: "raw",
    normalizationMode: "fit_current_bounds_xy",
    usesTranslation: true,
    description:
      "Apply the raw matrix, then align transformed canonical to current bounds with separate x/y scales.",
  },
  {
    candidateName: "rotation_only_then_fit_current_bounds_uniform",
    transformMode: "rotation_only",
    normalizationMode: "fit_current_bounds_uniform",
    usesTranslation: false,
    description:
      "Apply only the 3x3 rotation/scale part, then align to current bounds with one x/y scale.",
  },
  {
    candidateName: "rotation_only_then_fit_current_bounds_xy",
    transformMode: "rotation_only",
    normalizationMode: "fit_current_bounds_xy",
    usesTranslation: false,
    description:
      "Apply only the 3x3 rotation/scale part, then align to current bounds with separate x/y scales.",
  },
  {
    candidateName: "translation_included_then_fit_current_bounds_uniform",
    transformMode: "translation_included",
    normalizationMode: "fit_current_bounds_uniform",
    usesTranslation: true,
    description:
      "Apply rotation plus interpreted translation, then align to current bounds with one x/y scale.",
  },
  {
    candidateName: "translation_included_then_fit_current_bounds_xy",
    transformMode: "translation_included",
    normalizationMode: "fit_current_bounds_xy",
    usesTranslation: true,
    description:
      "Apply rotation plus interpreted translation, then align to current bounds with separate x/y scales.",
  },
]

const MATRIX_CONVENTIONS: MatrixConventionDefinition[] = [
  {
    name: "row_major_column_vector",
    rawOrdering: "row-major",
    vectorConvention: "column-vector",
    transformDescription: "raw values を row-major 4x4 とし、pDetected = M * pCanonical として扱う",
    translationMode: "lastColumn",
  },
  {
    name: "row_major_row_vector",
    rawOrdering: "row-major",
    vectorConvention: "row-vector",
    transformDescription: "raw values を row-major 4x4 とし、pDetected = pCanonical * M として扱う",
    translationMode: "lastRow",
  },
  {
    name: "column_major_column_vector",
    rawOrdering: "column-major",
    vectorConvention: "column-vector",
    transformDescription: "raw values を column-major 4x4 とし、pDetected = M * pCanonical として扱う",
    translationMode: "lastColumn",
  },
  {
    name: "column_major_row_vector",
    rawOrdering: "column-major",
    vectorConvention: "row-vector",
    transformDescription: "raw values を column-major 4x4 とし、pDetected = pCanonical * M として扱う",
    translationMode: "lastRow",
  },
]

const ENGINE_POSE_CONVENTION: MatrixConventionName = "row_major_column_vector"
const LAB_CURRENT_CONVENTION: MatrixConventionName = "row_major_column_vector"
const HUGE_ABS_VALUE_THRESHOLD = 1000
const HUGE_BOUNDS_THRESHOLD = 100
const HUGE_STDDEV_THRESHOLD = 50

const state: AppState = {
  cameraStatus: "idle",
  detectorStatus: "idle",
  detectorError: null,
  cameraError: null,
  detectCount: 0,
  lastSkippedReason: null,
  clipboardMessage: null,
  importMessage: null,
  analysisMessage: null,
  latestFrame: null,
  captures: [],
  importedCaptures: [],
  importedFileName: null,
  canonical468: null,
  canonicalImportMessage: null,
  analysis: null,
  loopStartedAt: null,
}

const app = document.querySelector<HTMLDivElement>("#app")

if (!app) {
  throw new Error("#app is missing")
}

app.innerHTML = `
  <main class="app">
    <header class="header">
      <div class="title-block">
        <h1>MediaPipe Canonical Lab</h1>
        <p>Face Landmarker の capture JSON から canonical-like 478 と安定性を調査する debug tool です。</p>
      </div>
      <div class="status-pill" id="runStatus">初期化中</div>
    </header>

    <section class="layout">
      <div class="panel">
        <h2>カメラ / 検出器の状態</h2>
        <p class="panel-help">MediaPipe Face Landmarker の生データを保存し、解析用 JSON として export します。</p>
        <div class="status-grid" id="statusGrid"></div>
      </div>

      <div class="panel">
        <h2>ライブプレビュー</h2>
        <div class="preview-wrap">
          <video id="video" playsinline muted autoplay></video>
          <canvas id="overlay"></canvas>
        </div>
        <div class="controls">
          <button id="captureButton" class="primary" type="button">現在のフレームを保存</button>
          <button id="clearButton" type="button">保存データをクリア</button>
          <button id="copyButton" type="button">全データをコピー</button>
          <button id="exportButton" type="button">Capture JSON を書き出し</button>
        </div>
        <p class="copy-status" id="copyStatus"></p>
        <ul class="help-list">
          <li>正面・左右・上下を手動で保存し、bucket 別の capture を作ります。</li>
          <li>今回の canonical analysis は debug artifact であり、IdealFace / Runtime には反映しません。</li>
        </ul>
      </div>
    </section>

    <section class="panel">
      <h2>Captured JSON 解析</h2>
      <div class="controls">
        <input id="importFileInput" type="file" accept="application/json,.json" hidden />
        <input id="canonicalObjInput" type="file" accept=".obj,text/plain" hidden />
        <button id="importButton" class="primary" type="button">Import captured JSON</button>
        <button id="canonicalImportButton" type="button">Import canonical 468 OBJ</button>
        <button id="analyzeButton" type="button">Analyze captures</button>
        <button id="analyzeEmpirical478Button" class="primary" type="button">Analyze empirical 478</button>
        <button id="clearAnalysisButton" type="button">Clear analysis</button>
        <button id="clearEmpirical478Button" type="button">Clear empirical analysis</button>
        <button id="exportAnalysisButton" type="button">Export analysis JSON</button>
      </div>
      <p class="note">
        Debug note: canonical468 is reference only, not the 478 ground truth. This analysis unprojects current landmarks 478 with multiple candidates, checks frame-to-frame stability, and names the stable weighted average empiricalCanonical478. It is a debug artifact, not a production asset.
      </p>
      <p class="copy-status" id="importStatus"></p>
      <div class="analysis-grid">
        <section>
          <h3>imported capture summary</h3>
          <div class="status-grid" id="importedSummary"></div>
        </section>
        <section>
          <h3>pose range</h3>
          <div class="status-grid" id="poseSummary"></div>
        </section>
      </div>
    </section>

    <section class="analysis-results">
      <div class="panel">
        <h2>Canonical 468 status</h2>
        <div class="status-grid" id="canonicalSummary"></div>
      </div>

      <div class="panel">
        <h2>Canonical semantic summary</h2>
        <div class="latest-box" id="canonicalSemanticSummary">Canonical 468 OBJ is not imported.</div>
      </div>
    </section>

    <section class="analysis-results">
      <div class="panel">
        <h2>transform candidate list</h2>
        <div class="table-wrap" id="candidateList"></div>
      </div>

      <div class="panel">
        <h2>stability ranking</h2>
        <div class="table-wrap" id="stabilityRanking"></div>
      </div>
    </section>

    <section class="analysis-results">
      <div class="panel">
        <h2>best candidate / empirical canonical summary</h2>
        <div class="status-grid" id="bestCandidateSummary"></div>
      </div>

      <div class="panel">
        <h2>warnings</h2>
        <div class="latest-box" id="analysisWarnings">解析結果はまだありません。</div>
      </div>
    </section>

    <section class="analysis-results">
      <div class="panel">
        <h2>Empirical 478 frame weight summary</h2>
        <div class="status-grid" id="empiricalFrameWeightSummary"></div>
      </div>

      <div class="panel">
        <h2>Empirical 478 canonical summary</h2>
        <div class="status-grid" id="empiricalCanonical478Summary"></div>
      </div>
    </section>

    <section class="analysis-results">
      <div class="panel">
        <h2>Empirical 478 candidate ranking</h2>
        <div class="table-wrap" id="empiricalCandidateRanking"></div>
      </div>

      <div class="panel">
        <h2>Runtime compatible ranking</h2>
        <div class="table-wrap" id="empiricalRuntimeRanking"></div>
      </div>
    </section>

    <section class="analysis-results">
      <div class="panel">
        <h2>Empirical 478 bucket ranking</h2>
        <div class="table-wrap" id="empiricalBucketRanking"></div>
      </div>

      <div class="panel">
        <h2>Canonical 468 reference comparison</h2>
        <div class="latest-box" id="empiricalCanonical468Comparison">canonical468 is reference only.</div>
      </div>
    </section>

    <section class="panel">
      <h2>matrix summary preview</h2>
      <div class="table-wrap" id="matrixSummary"></div>
    </section>

    <section class="analysis-results">
      <div class="panel">
        <h2>Matrix convention comparison</h2>
        <div class="table-wrap" id="matrixConventionComparison"></div>
      </div>

      <div class="panel">
        <h2>Translation candidates / Pose extraction</h2>
        <div class="table-wrap" id="translationPoseComparison"></div>
      </div>
    </section>

    <section class="analysis-results">
      <div class="panel">
        <h2>Canonical projection ranking</h2>
        <div class="table-wrap" id="canonicalProjectionRanking"></div>
      </div>

      <div class="panel">
        <h2>Bucket ranking</h2>
        <div class="table-wrap" id="canonicalBucketRanking"></div>
      </div>
    </section>

    <section class="panel">
      <h2>Matrix convention x canonical projection comparison</h2>
      <div class="table-wrap" id="canonicalProjectionComparison"></div>
    </section>

    <section class="panel">
      <h2>raw JSON preview / copy debug</h2>
      <div class="controls">
        <button id="copyAnalysisButton" type="button">Analysis JSON をコピー</button>
      </div>
      <pre class="json-preview" id="analysisJsonPreview">解析結果はまだありません。</pre>
    </section>

    <section class="summary">
      <div class="panel">
        <h2>保存データの概要</h2>
        <div class="status-grid" id="captureSummary"></div>
        <h2>姿勢 bucket 別の件数</h2>
        <div class="bucket-grid" id="bucketCounts"></div>
      </div>

      <div class="panel">
        <h2>最新の保存データ</h2>
        <div class="latest-box" id="latestCapture">まだ保存されていません。</div>
      </div>
    </section>

    <section class="panel">
      <h2>保存したフレーム一覧</h2>
      <div class="preview-list" id="previewList"></div>
    </section>
  </main>
`

const video = getElement<HTMLVideoElement>("video")
const overlay = getElement<HTMLCanvasElement>("overlay")
const captureButton = getElement<HTMLButtonElement>("captureButton")
const clearButton = getElement<HTMLButtonElement>("clearButton")
const copyButton = getElement<HTMLButtonElement>("copyButton")
const exportButton = getElement<HTMLButtonElement>("exportButton")
const importButton = getElement<HTMLButtonElement>("importButton")
const importFileInput = getElement<HTMLInputElement>("importFileInput")
const canonicalImportButton = getElement<HTMLButtonElement>("canonicalImportButton")
const canonicalObjInput = getElement<HTMLInputElement>("canonicalObjInput")
const analyzeButton = getElement<HTMLButtonElement>("analyzeButton")
const analyzeEmpirical478Button = getElement<HTMLButtonElement>("analyzeEmpirical478Button")
const clearAnalysisButton = getElement<HTMLButtonElement>("clearAnalysisButton")
const clearEmpirical478Button = getElement<HTMLButtonElement>("clearEmpirical478Button")
const exportAnalysisButton = getElement<HTMLButtonElement>("exportAnalysisButton")
const copyAnalysisButton = getElement<HTMLButtonElement>("copyAnalysisButton")

let faceLandmarker: FaceLandmarker | null = null

captureButton.addEventListener("click", () => {
  captureCurrentFrame()
})

clearButton.addEventListener("click", () => {
  state.captures = []
  state.lastSkippedReason = null
  state.clipboardMessage = null
  render()
})

copyButton.addEventListener("click", () => {
  void copyCapturesToClipboard()
})

exportButton.addEventListener("click", () => {
  exportCaptures()
})

importButton.addEventListener("click", () => {
  importFileInput.click()
})

canonicalImportButton.addEventListener("click", () => {
  canonicalObjInput.click()
})

importFileInput.addEventListener("change", () => {
  const file = importFileInput.files?.[0]
  if (file) {
    void importCapturedJson(file)
  }
  importFileInput.value = ""
})

canonicalObjInput.addEventListener("change", () => {
  const file = canonicalObjInput.files?.[0]
  if (file) {
    void importCanonicalObj(file)
  }
  canonicalObjInput.value = ""
})

analyzeButton.addEventListener("click", () => {
  analyzeCaptures()
})

analyzeEmpirical478Button.addEventListener("click", () => {
  analyzeCaptures()
})

clearAnalysisButton.addEventListener("click", () => {
  state.importedCaptures = []
  state.importedFileName = null
  state.analysis = null
  state.importMessage = null
  state.analysisMessage = null
  state.canonicalImportMessage = null
  render()
})

clearEmpirical478Button.addEventListener("click", () => {
  state.analysis = null
  state.analysisMessage = null
  render()
})

exportAnalysisButton.addEventListener("click", () => {
  exportAnalysisJson()
})

copyAnalysisButton.addEventListener("click", () => {
  void copyAnalysisToClipboard()
})

void initialize()

async function initialize(): Promise<void> {
  render()
  await Promise.all([initializeCamera(), initializeDetector()])
  startDetectionLoop()
}

async function initializeCamera(): Promise<void> {
  state.cameraStatus = "starting"
  state.cameraError = null
  render()

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    })

    video.srcObject = stream
    await video.play()
    state.cameraStatus = "running"
  } catch (error) {
    state.cameraStatus = "error"
    state.cameraError = error instanceof Error ? error.message : String(error)
  }

  render()
}

async function initializeDetector(): Promise<void> {
  state.detectorStatus = "initializing"
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

    state.detectorStatus = "ready"
  } catch (error) {
    state.detectorStatus = "error"
    state.detectorError = error instanceof Error ? error.message : String(error)
  }

  render()
}

function startDetectionLoop(): void {
  if (state.loopStartedAt !== null) {
    return
  }

  state.loopStartedAt = performance.now()

  const detect = (): void => {
    if (
      faceLandmarker &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      video.videoWidth > 0 &&
      video.videoHeight > 0
    ) {
      try {
        const timestamp = performance.now()
        const result = faceLandmarker.detectForVideo(video, timestamp)
        const landmarks = result.faceLandmarks[0] ?? []
        const matrix = result.facialTransformationMatrixes[0] ?? null
        const blendshapes =
          result.faceBlendshapes[0]?.categories.map((category) => ({
            categoryName: category.categoryName,
            score: category.score,
          })) ?? []

        state.detectCount += 1
        state.latestFrame = {
          detected: result.faceLandmarks.length > 0,
          timestamp,
          videoTime: video.currentTime,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          landmarks,
          facialTransformationMatrix: matrix,
          blendshapes,
          pose: estimateFacePoseFromMatrixObject(matrix),
        }

        drawOverlay(landmarks)
      } catch (error) {
        state.detectorStatus = "error"
        state.detectorError = error instanceof Error ? error.message : String(error)
      }
    }

    render()
    window.requestAnimationFrame(detect)
  }

  window.requestAnimationFrame(detect)
}

function captureCurrentFrame(): void {
  const frame = state.latestFrame
  const warnings: string[] = []
  const notes: string[] = []

  if (!frame) {
    state.lastSkippedReason = "まだ検出フレームがありません。"
    render()
    return
  }

  if (!frame.detected) {
    warnings.push("最新フレームで顔が検出されていません。")
  }

  if (frame.landmarks.length !== EXPECTED_LANDMARK_COUNT) {
    warnings.push(
      `landmarks は ${EXPECTED_LANDMARK_COUNT} 点を期待していますが、${frame.landmarks.length} 点でした。`,
    )
  }

  if (!frame.facialTransformationMatrix) {
    warnings.push("facialTransformationMatrix がありません。")
  }

  if (!frame.pose) {
    warnings.push("matrix から yaw / pitch / roll を推定できませんでした。")
  }

  notes.push("MediaPipe FaceLandmarker の最新結果を手動で保存しました。")

  const capture: CaptureRecord = {
    captureId: createCaptureId(state.captures.length + 1),
    capturedAt: new Date().toISOString(),
    videoTime: frame.videoTime,
    videoWidth: frame.videoWidth,
    videoHeight: frame.videoHeight,
    pose: frame.pose,
    landmarks: frame.landmarks.map((landmark, index) => ({
      index,
      x: landmark.x,
      y: landmark.y,
      z: landmark.z,
    })),
    facialTransformationMatrix: frame.facialTransformationMatrix
      ? captureMatrix(frame.facialTransformationMatrix)
      : null,
    blendshapes: frame.blendshapes,
    bucket: classifyBucket(frame.pose),
    notes,
    warnings,
    previewDataUrl: createPreviewDataUrl(),
  }

  state.captures = [capture, ...state.captures]
  state.lastSkippedReason = null
  state.clipboardMessage = null
  render()
}

async function importCapturedJson(file: File): Promise<void> {
  try {
    const payload = JSON.parse(await file.text()) as unknown
    const capturesPayload = parseCapturesPayload(payload)
    state.importedCaptures = capturesPayload.captures
    state.importedFileName = file.name
    state.analysis = null
    state.importMessage = `${file.name} から ${capturesPayload.captures.length} 件を import しました。`
    state.analysisMessage = null
  } catch (error) {
    state.importMessage =
      error instanceof Error ? `import に失敗しました: ${error.message}` : "import に失敗しました。"
  }

  render()
}

async function importCanonicalObj(file: File): Promise<void> {
  try {
    const vertices = parseCanonicalObj(await file.text())
    const summary = createCanonical468Summary(vertices, file.name)
    state.canonical468 = {
      status: summary.status,
      source: file.name,
      vertices,
      summary,
    }
    state.canonicalImportMessage = `${file.name} loaded as canonical OBJ (${vertices.length} vertices).`
    state.analysis = null
    state.analysisMessage = null
  } catch (error) {
    state.canonical468 = null
    state.canonicalImportMessage =
      error instanceof Error
        ? `canonical OBJ import failed: ${error.message}`
        : "canonical OBJ import failed."
  }

  render()
}

function analyzeCaptures(): void {
  const captures = getAnalysisInputCaptures()

  if (captures.length === 0) {
    state.analysisMessage = "解析できる capture がありません。"
    render()
    return
  }

  state.analysis = createAnalysis(captures)
  state.analysisMessage = `${captures.length} 件の capture を解析しました。`
  render()
}

function exportCaptures(): void {
  const createdAt = new Date()
  const payload = createExportPayload(createdAt)
  downloadJson(payload, `mediapipe_canonical_lab_captures_${formatFileTimestamp(createdAt)}.json`)
}

function exportAnalysisJson(): void {
  if (!state.analysis) {
    return
  }

  const createdAt = new Date()
  downloadJson(
    state.analysis,
    `mediapipe_canonical_lab_analysis_${formatFileTimestamp(createdAt)}.json`,
  )
}

async function copyCapturesToClipboard(): Promise<void> {
  if (state.captures.length === 0) {
    state.clipboardMessage = "コピーできる保存データがありません。"
    render()
    return
  }

  try {
    const payload = createExportPayload(new Date())
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
    state.clipboardMessage = "全データをクリップボードにコピーしました。"
  } catch (error) {
    state.clipboardMessage =
      error instanceof Error
        ? `クリップボードへのコピーに失敗しました: ${error.message}`
        : "クリップボードへのコピーに失敗しました。"
  }

  render()
}

async function copyAnalysisToClipboard(): Promise<void> {
  if (!state.analysis) {
    state.analysisMessage = "コピーできる解析結果がありません。"
    render()
    return
  }

  try {
    await navigator.clipboard.writeText(JSON.stringify(state.analysis, null, 2))
    state.analysisMessage = "Analysis JSON をクリップボードにコピーしました。"
  } catch (error) {
    state.analysisMessage =
      error instanceof Error
        ? `Analysis JSON のコピーに失敗しました: ${error.message}`
        : "Analysis JSON のコピーに失敗しました。"
  }

  render()
}

function createExportPayload(createdAt: Date): CapturesPayload {
  return {
    schemaVersion: "mediapipe_canonical_lab_captures_v1",
    createdAt: createdAt.toISOString(),
    tool: {
      name: "mediapipe-canonical-lab",
      version: "0.1.0",
    },
    source: {
      detector:
        "@mediapipe/tasks-vision FaceLandmarker 0.10.35, VIDEO mode, outputFaceBlendshapes=true, outputFacialTransformationMatrixes=true",
      landmarkCount: EXPECTED_LANDMARK_COUNT,
    },
    summary: {
      captureCount: state.captures.length,
      bucketCounts: countBuckets(state.captures),
    },
    captures: state.captures.map(({ previewDataUrl, ...capture }) => ({
      ...capture,
      previewDataUrl: null,
    })),
  }
}

function createAnalysis(captures: CaptureRecord[]): AnalysisResult {
  const warnings: string[] = []
  const canonical468 = state.canonical468?.summary ?? createEmptyCanonical468Summary()
  const sourceCaptureSummary = summarizeCaptures(captures)
  const rawCaptureSummaries = captures.map(analyzeRawCapture)
  const matrixSummaries = captures.map(analyzeMatrix)
  const transformCandidates = createTransformConventionDefinitions().map((candidate) =>
    analyzeTransformCandidate(candidate.definition, captures, candidate.matrixConvention),
  )
  const stabilityRanking = rankCandidates(transformCandidates)
  const selectedBestConventionCandidate = stabilityRanking[0] ?? null
  const bestStabilityTransformCandidate = selectedBestConventionCandidate?.transformName ?? null
  const bestCandidate = transformCandidates.find(
    (candidate) =>
      candidate.transformName === selectedBestConventionCandidate?.transformName &&
      candidate.matrixConvention === selectedBestConventionCandidate?.matrixConvention,
  )
  const empiricalCanonical478 =
    bestCandidate && bestStabilityTransformCandidate
      ? createEmpiricalCanonical478(bestCandidate, bestStabilityTransformCandidate)
      : null
  const canonicalProjectionAnalysis = analyzeCanonicalProjection(captures, state.canonical468)
  const empirical478Analysis = analyzeEmpirical478(captures, state.canonical468)

  if (captures.length < 2) {
    warnings.push("フレーム間安定性を見るには capture が 2 件以上必要です。")
  }

  if (sourceCaptureSummary.matrixAvailableCount === 0) {
    warnings.push("facialTransformationMatrix がある capture がないため、inverse matrix candidate は評価できません。")
  }

  for (const candidate of transformCandidates) {
    warnings.push(...candidate.warnings.map((warning) => `${candidate.transformName}: ${warning}`))
  }

  warnings.push(...canonical468.warnings)
  warnings.push(...canonicalProjectionAnalysis.warnings)
  warnings.push(...empirical478Analysis.warnings.map((warning) => `empirical478: ${warning}`))

  return {
    schemaVersion: "mediapipe_canonical_lab_analysis_v1",
    analysisVersion: "empirical_478_canonical_debug_v1",
    generatedAt: new Date().toISOString(),
    sourceCaptureSummary,
    rawCaptureSummaries,
    matrixSummaries,
    matrixConventionAnalysis: matrixSummaries,
    translationCandidates: matrixSummaries.map((matrix) => ({
      captureId: matrix.captureId,
      lastRow: matrix.rawTranslationCandidates.lastRow,
      lastColumn: matrix.rawTranslationCandidates.lastColumn,
    })),
    poseByConvention: matrixSummaries.map((matrix) => ({
      captureId: matrix.captureId,
      conventions: matrix.poseByConvention,
    })),
    transformCandidates,
    transformConventionCandidates: transformCandidates,
    stabilityRanking,
    stabilityRankingByConvention: stabilityRanking,
    bestStabilityTransformCandidate,
    selectedBestConventionCandidate,
    empiricalCanonical478,
    canonical468,
    canonicalProjectionAnalysis,
    selectedBestCanonicalProjectionCandidate:
      canonicalProjectionAnalysis.overallRanking[0] ?? null,
    empirical478Analysis,
    warnings,
  }
}

function parseCanonicalObj(text: string): LandmarkPoint[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("v "))
    .map((line, index) => {
      const parts = line.split(/\s+/)
      const x = Number(parts[1])
      const y = Number(parts[2])
      const z = Number(parts[3])
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        throw new Error(`invalid vertex at OBJ vertex index ${index}`)
      }
      return { index, x, y, z }
    })
}

function createCanonical468Summary(
  vertices: LandmarkPoint[],
  source: string | null,
): Canonical468Summary {
  const warnings: string[] = []
  const bounds = calculateBounds(vertices)
  const semanticPoints = getSemanticPoints(vertices)

  if (vertices.length !== CANONICAL_468_LANDMARK_COUNT) {
    warnings.push(
      `canonicalVertexCountMismatch: expected 468 vertices, got ${vertices.length}.`,
    )
  }

  return {
    status: vertices.length === CANONICAL_468_LANDMARK_COUNT ? "loaded" : "invalid",
    source,
    vertexCount: vertices.length,
    bounds,
    centroid: calculateCentroid(vertices),
    boundsCenter: bounds ? calculateBoundsCenter(bounds) : null,
    zRange: bounds?.zRange ?? null,
    semanticSummary: {
      points: semanticPoints,
      z: getZSemanticSummary(semanticPoints),
    },
    semanticIndexDebug: SEMANTIC_INDEX_DEBUG,
    warnings,
  }
}

function createEmptyCanonical468Summary(): Canonical468Summary {
  const semanticPoints = getSemanticPoints([])
  return {
    status: "not_imported",
    source: null,
    vertexCount: 0,
    bounds: null,
    centroid: null,
    boundsCenter: null,
    zRange: null,
    semanticSummary: {
      points: semanticPoints,
      z: getZSemanticSummary(semanticPoints),
    },
    semanticIndexDebug: SEMANTIC_INDEX_DEBUG,
    warnings: [],
  }
}

function analyzeCanonicalProjection(
  captures: CaptureRecord[],
  canonical: ImportedCanonical468 | null,
): CanonicalProjectionAnalysis {
  const warnings: string[] = []

  if (!canonical || canonical.vertices.length === 0) {
    return {
      status: "not_available",
      candidates: CANONICAL_PROJECTION_CANDIDATES,
      matrixConventions: MATRIX_CONVENTIONS,
      perCaptureResults: [],
      overallRanking: [],
      bestMatrixConvention: null,
      bestProjectionCandidate: null,
      bucketRanking: createEmptyBucketRanking(),
      warnings: ["canonical468NotImported: import canonical 468 OBJ before projection analysis."],
    }
  }

  if (canonical.vertices.length !== CANONICAL_468_LANDMARK_COUNT) {
    warnings.push(
      `canonicalVertexCountMismatch: expected 468 vertices, got ${canonical.vertices.length}.`,
    )
  }

  const perCaptureResults = captures.flatMap((capture) =>
    analyzeCanonicalProjectionForCapture(capture, canonical.vertices),
  )
  const overallRanking = rankCanonicalProjectionResults(perCaptureResults)
  const bestMatrixConvention = rankCanonicalProjectionGroups(
    perCaptureResults,
    (result) => result.matrixConvention,
  )[0] ?? null
  const bestProjectionCandidate = rankCanonicalProjectionGroups(
    perCaptureResults,
    (result) => result.candidateName,
  )[0] ?? null
  const bucketRanking = rankCanonicalProjectionByBucket(perCaptureResults)

  warnings.push(...createCanonicalProjectionComparisonWarnings(perCaptureResults, captures))

  return {
    status: "computed",
    candidates: CANONICAL_PROJECTION_CANDIDATES,
    matrixConventions: MATRIX_CONVENTIONS,
    perCaptureResults,
    overallRanking,
    bestMatrixConvention,
    bestProjectionCandidate,
    bucketRanking,
    warnings,
  }
}

function analyzeCanonicalProjectionForCapture(
  capture: CaptureRecord,
  canonicalVertices: LandmarkPoint[],
): CanonicalProjectionPerCaptureResult[] {
  const current468 = capture.landmarks
    .filter((landmark) => landmark.index < CANONICAL_468_LANDMARK_COUNT)
    .slice(0, CANONICAL_468_LANDMARK_COUNT)
  const rawMatrix = getMatrixValues4x4(capture.facialTransformationMatrix)
  const baseWarnings: string[] = []

  if (capture.landmarks.length !== EXPECTED_LANDMARK_COUNT) {
    baseWarnings.push(
      `capturedLandmarksCountMismatch: expected 478 landmarks, got ${capture.landmarks.length}.`,
    )
  }

  if (!rawMatrix) {
    baseWarnings.push("missingFacialTransformationMatrix: capture has no 4x4 matrix.")
    return []
  }

  if (current468.length !== CANONICAL_468_LANDMARK_COUNT) {
    baseWarnings.push(
      `current468Unavailable: expected current landmarks 0-467, got ${current468.length}.`,
    )
  }

  return MATRIX_CONVENTIONS.flatMap((convention) =>
    CANONICAL_PROJECTION_CANDIDATES.map((candidate) => {
      const matrix = createProjectionMatrixForCandidate(rawMatrix, convention, candidate)
      const transformed = canonicalVertices.map((point) => ({
        index: point.index,
        ...applyMatrixByConvention(matrix, point, convention),
      }))
      const comparable = normalizeCanonicalProjectionPoints(
        transformed,
        current468,
        candidate.normalizationMode,
      )
      const transformedBounds = calculateBounds(transformed)
      const currentBounds = calculateBounds(current468)
      const warnings = [...baseWarnings]

      if (hasAbnormalBounds(transformedBounds)) {
        warnings.push("transformedCanonicalBoundsExtreme: transformed canonical bounds are huge.")
      }

      if (comparable.points.length !== CANONICAL_468_LANDMARK_COUNT) {
        warnings.push(
          `projectionPointCountMismatch: compared ${comparable.points.length} points instead of 468.`,
        )
      }

      if (comparable.warning) {
        warnings.push(comparable.warning)
      }

      const metrics = calculateCanonicalProjectionMetrics(
        comparable.points,
        comparable.currentPoints,
      )

      const poseSummary = analyzeMatrixConvention(capture, rawMatrix, convention)
      const poseDelta = poseSummary.poseDelta
      if (
        poseDelta &&
        Math.abs(poseDelta.yaw) < 5 &&
        Math.abs(poseDelta.pitch) < 5 &&
        Math.abs(poseDelta.roll) < 5 &&
        (metrics.averageDistance2D ?? 0) > 0.08
      ) {
        warnings.push(
          "poseConventionMatchesButPointErrorHigh: pose delta is small but point fit error is high.",
        )
      }

      return {
        captureId: capture.captureId,
        bucket: toStabilityBucket(capture.bucket),
        candidateName: candidate.candidateName,
        matrixConvention: convention.name,
        translationMode: convention.translationMode,
        pointCount: comparable.points.length,
        transformedBounds,
        currentBounds,
        metrics,
        warnings,
      }
    }),
  )
}

function createProjectionMatrixForCandidate(
  rawValues: number[],
  convention: MatrixConventionDefinition,
  candidate: CanonicalProjectionCandidateDefinition,
): number[] {
  const matrix = getConventionMatrix(rawValues, convention)

  if (candidate.transformMode === "raw") {
    return matrix
  }

  const next = matrix.slice()
  next[3] = 0
  next[7] = 0
  next[11] = 0
  next[12] = 0
  next[13] = 0
  next[14] = 0
  next[15] = 1

  if (candidate.transformMode === "translation_included") {
    const translation = getInterpretedTranslation(matrix, convention)
    if (translation) {
      if (convention.translationMode === "lastColumn") {
        next[3] = translation.x
        next[7] = translation.y
        next[11] = translation.z
      } else if (convention.translationMode === "lastRow") {
        next[12] = translation.x
        next[13] = translation.y
        next[14] = translation.z
      }
    }
  }

  return next
}

function normalizeCanonicalProjectionPoints(
  transformed: LandmarkPoint[],
  current: LandmarkPoint[],
  mode: CanonicalProjectionCandidateDefinition["normalizationMode"],
): { points: LandmarkPoint[]; currentPoints: LandmarkPoint[]; warning: string | null } {
  const transformed468 = transformed.slice(0, CANONICAL_468_LANDMARK_COUNT)
  const current468 = current.slice(0, CANONICAL_468_LANDMARK_COUNT)
  const transformedBounds = calculateBounds(transformed468)
  const currentBounds = calculateBounds(current468)

  if (!transformedBounds || !currentBounds) {
    return {
      points: [],
      currentPoints: [],
      warning: "projectionBoundsUnavailable: transformed/current bounds were unavailable.",
    }
  }

  if (mode === "normalize_bounds") {
    return {
      points: normalizePointsByOwnBounds(transformed468, transformedBounds),
      currentPoints: normalizePointsByOwnBounds(current468, currentBounds),
      warning: null,
    }
  }

  const transformedCenter = calculateBoundsCenter(transformedBounds)
  const currentCenter = calculateBoundsCenter(currentBounds)
  const uniformScale = Math.min(
    safeDivide(currentBounds.width, transformedBounds.width),
    safeDivide(currentBounds.height, transformedBounds.height),
  )
  const scaleX =
    mode === "fit_current_bounds_xy"
      ? safeDivide(currentBounds.width, transformedBounds.width)
      : uniformScale
  const scaleY =
    mode === "fit_current_bounds_xy"
      ? safeDivide(currentBounds.height, transformedBounds.height)
      : uniformScale
  const zScale = Number.isFinite(uniformScale) && uniformScale > EPSILON ? uniformScale : 1

  if (
    !Number.isFinite(scaleX) ||
    !Number.isFinite(scaleY) ||
    Math.abs(scaleX) <= EPSILON ||
    Math.abs(scaleY) <= EPSILON
  ) {
    return {
      points: [],
      currentPoints: [],
      warning: "projectionBoundsFitUnavailable: transformed/current bounds could not be fit.",
    }
  }

  return {
    points: transformed468.map((point) => ({
      index: point.index,
      x: (point.x - transformedCenter.x) * scaleX + currentCenter.x,
      y: (point.y - transformedCenter.y) * scaleY + currentCenter.y,
      z: (point.z - transformedCenter.z) * zScale + currentCenter.z,
    })),
    currentPoints: current468,
    warning:
      mode === "fit_current_bounds_uniform" &&
      (Math.abs(
        safeDivide(transformedBounds.width * uniformScale, currentBounds.width) - 1,
      ) > 0.25 ||
        Math.abs(
          safeDivide(transformedBounds.height * uniformScale, currentBounds.height) - 1,
        ) > 0.25)
        ? "transformedCanonicalDoesNotFitCurrentBounds: uniform fit leaves a large width/height mismatch."
        : null,
  }
}

function normalizePointsByOwnBounds(
  points: LandmarkPoint[],
  bounds: BoundsSummary,
): LandmarkPoint[] {
  return points.map((point) => ({
    index: point.index,
    x: safeDivide(point.x - bounds.xMin, bounds.width),
    y: safeDivide(point.y - bounds.yMin, bounds.height),
    z: safeDivide(point.z - bounds.zMin, bounds.zRange),
  }))
}

function calculateCanonicalProjectionMetrics(
  projected: LandmarkPoint[],
  current: LandmarkPoint[],
): CanonicalProjectionMetrics {
  const pairs = projected
    .map((point) => {
      const currentPoint = current.find((item) => item.index === point.index)
      return currentPoint ? { projected: point, current: currentPoint } : null
    })
    .filter((item): item is { projected: LandmarkPoint; current: LandmarkPoint } => Boolean(item))

  const distances = pairs.map(({ projected, current: currentPoint }) =>
    calculateDistance2D(projected, currentPoint),
  )
  const dxValues = pairs.map(({ projected, current: currentPoint }) => projected.x - currentPoint.x)
  const dyValues = pairs.map(({ projected, current: currentPoint }) => projected.y - currentPoint.y)
  const zDiffs = pairs.map(({ projected, current: currentPoint }) => projected.z - currentPoint.z)
  const projectedBounds = calculateBounds(projected)
  const currentBounds = calculateBounds(current)

  return {
    averageDistance2D: averageNumber(distances),
    medianDistance2D: medianNumber(distances),
    maxDistance2D: maxOrNull(distances),
    averageDx: averageNumber(dxValues),
    averageDy: averageNumber(dyValues),
    semanticPointError: calculateSemanticPointError(projected, current),
    centerWeightedDistance: calculateCenterWeightedDistance(projected, current),
    outerContourDistance: calculateIndexedAverageDistance(projected, current, OUTER_CONTOUR_INDICES),
    mouthEyeDistance: calculateIndexedAverageDistance(projected, current, [
      ...MOUTH_ERROR_INDICES,
      ...EYE_ERROR_INDICES,
    ]),
    all468Distance: averageNumber(distances),
    averageZDifference: averageNumber(zDiffs),
    zRangeRatio:
      projectedBounds && currentBounds
        ? safeDivide(projectedBounds.zRange, currentBounds.zRange)
        : null,
    noseZDifference: calculateZDifferenceByPoint(projected, current, NOSE_TIP_INDEX),
    cheekZDifference: calculateCheekZDifference(projected, current),
  }
}

function calculateSemanticPointError(
  projected: LandmarkPoint[],
  current: LandmarkPoint[],
): SemanticPointErrorSummary {
  const projectedSemantic = getSemanticPoints(projected)
  const currentSemantic = getSemanticPoints(current)
  const projectedCheek =
    projectedSemantic.leftCheek && projectedSemantic.rightCheek
      ? averagePoints([projectedSemantic.leftCheek, projectedSemantic.rightCheek])
      : null
  const currentCheek =
    currentSemantic.leftCheek && currentSemantic.rightCheek
      ? averagePoints([currentSemantic.leftCheek, currentSemantic.rightCheek])
      : null

  return {
    noseTip: calculateOptionalDistance2D(projectedSemantic.noseTip, currentSemantic.noseTip),
    eyeCenter: calculateOptionalDistance2D(projectedSemantic.eyeCenter, currentSemantic.eyeCenter),
    mouthCenter: calculateOptionalDistance2D(
      projectedSemantic.mouthCenter,
      currentSemantic.mouthCenter,
    ),
    chin: calculateOptionalDistance2D(projectedSemantic.chin, currentSemantic.chin),
    cheek: calculateOptionalDistance2D(projectedCheek, currentCheek),
  }
}

function calculateCenterWeightedDistance(
  projected: LandmarkPoint[],
  current: LandmarkPoint[],
): number | null {
  const bounds = calculateBounds(current)
  if (!bounds) {
    return null
  }

  const center = calculateBoundsCenter(bounds)
  const radius = Math.max(bounds.width, bounds.height) / 2
  if (radius <= EPSILON) {
    return null
  }

  let weightedDistance = 0
  let totalWeight = 0

  for (const currentPoint of current) {
    const projectedPoint = projected.find((point) => point.index === currentPoint.index)
    if (!projectedPoint) {
      continue
    }
    const radial = Math.min(calculateDistance2D(currentPoint, center) / radius, 1)
    const weight = 1 + (1 - radial)
    weightedDistance += calculateDistance2D(projectedPoint, currentPoint) * weight
    totalWeight += weight
  }

  return totalWeight <= EPSILON ? null : weightedDistance / totalWeight
}

function calculateIndexedAverageDistance(
  projected: LandmarkPoint[],
  current: LandmarkPoint[],
  indices: number[],
): number | null {
  const distances = indices
    .filter((index) => index < CANONICAL_468_LANDMARK_COUNT)
    .map((index) => {
      const projectedPoint = getPointByIndex(projected, index)
      const currentPoint = getPointByIndex(current, index)
      return projectedPoint && currentPoint
        ? calculateDistance2D(projectedPoint, currentPoint)
        : null
    })
    .filter((value): value is number => value !== null)

  return averageNumber(distances)
}

function rankCanonicalProjectionResults(
  results: CanonicalProjectionPerCaptureResult[],
): CanonicalProjectionRankingEntry[] {
  return rankCanonicalProjectionGroups(
    results,
    (result) => `${result.candidateName}::${result.matrixConvention}`,
  )
}

function rankCanonicalProjectionGroups(
  results: CanonicalProjectionPerCaptureResult[],
  getKey: (result: CanonicalProjectionPerCaptureResult) => string,
): CanonicalProjectionRankingEntry[] {
  const groups = new Map<string, CanonicalProjectionPerCaptureResult[]>()
  for (const result of results) {
    const key = getKey(result)
    groups.set(key, [...(groups.get(key) ?? []), result])
  }

  return [...groups.values()]
    .map(createCanonicalProjectionRankingEntry)
    .sort((a, b) => {
      if (a.score === null && b.score === null) {
        return 0
      }
      if (a.score === null) {
        return 1
      }
      if (b.score === null) {
        return -1
      }
      return a.score - b.score
    })
}

function createCanonicalProjectionRankingEntry(
  results: CanonicalProjectionPerCaptureResult[],
): CanonicalProjectionRankingEntry {
  const first = results[0]
  const semanticErrors = results
    .map((result) => averageSemanticError(result.metrics.semanticPointError))
    .filter((value): value is number => value !== null)
  const warningCount = results.reduce((count, result) => count + result.warnings.length, 0)
  const averageDistance2D = averageNumber(
    results
      .map((result) => result.metrics.averageDistance2D)
      .filter((value): value is number => value !== null),
  )
  const centerWeightedDistance = averageNumber(
    results
      .map((result) => result.metrics.centerWeightedDistance)
      .filter((value): value is number => value !== null),
  )
  const semanticPointErrorSummary = averageNumber(semanticErrors)
  const score =
    averageDistance2D === null
      ? null
      : averageDistance2D +
        (centerWeightedDistance ?? averageDistance2D) * 0.35 +
        (semanticPointErrorSummary ?? averageDistance2D) * 0.25 +
        warningCount * 0.01

  return {
    candidateName: first?.candidateName ?? "raw_matrix_then_normalize_bounds",
    matrixConvention: first?.matrixConvention ?? MATRIX_CONVENTIONS[0].name,
    translationMode: first?.translationMode ?? "none",
    averageDistance2D,
    centerWeightedDistance,
    semanticPointErrorSummary,
    warningCount,
    score,
    sampleCount: results.length,
  }
}

function rankCanonicalProjectionByBucket(
  results: CanonicalProjectionPerCaptureResult[],
): Record<StabilityBucket, CanonicalProjectionRankingEntry[]> {
  return STABILITY_BUCKETS.reduce((summary, bucket) => {
    summary[bucket] = rankCanonicalProjectionResults(
      results.filter((result) => result.bucket === bucket),
    )
    return summary
  }, createEmptyBucketRanking())
}

function createEmptyBucketRanking(): Record<StabilityBucket, CanonicalProjectionRankingEntry[]> {
  return STABILITY_BUCKETS.reduce(
    (summary, bucket) => {
      summary[bucket] = []
      return summary
    },
    {} as Record<StabilityBucket, CanonicalProjectionRankingEntry[]>,
  )
}

function createEmptyStabilityBucketNumberRecord(): Record<StabilityBucket, number> {
  return STABILITY_BUCKETS.reduce(
    (summary, bucket) => {
      summary[bucket] = 0
      return summary
    },
    {} as Record<StabilityBucket, number>,
  )
}

function roundStabilityBucketRecord(
  record: Record<StabilityBucket, number>,
): Record<StabilityBucket, number> {
  return STABILITY_BUCKETS.reduce(
    (summary, bucket) => {
      summary[bucket] = roundDebugNumber(record[bucket] ?? 0)
      return summary
    },
    {} as Record<StabilityBucket, number>,
  )
}

function uniqueWarningCodes(
  warnings: Empirical478WarningCode[],
): Empirical478WarningCode[] {
  return [...new Set(warnings)]
}

function createCanonicalProjectionComparisonWarnings(
  results: CanonicalProjectionPerCaptureResult[],
  captures: CaptureRecord[],
): string[] {
  const warnings: string[] = []
  const overallRanking = rankCanonicalProjectionResults(results)

  if (captures.some((capture) => !capture.facialTransformationMatrix)) {
    warnings.push("missingFacialTransformationMatrix: one or more captures have no matrix.")
  }

  if (
    overallRanking[0]?.score !== null &&
    overallRanking[1]?.score !== null &&
    overallRanking[0] &&
    overallRanking[1] &&
    Math.abs(overallRanking[1].score - overallRanking[0].score) < 0.002
  ) {
    warnings.push(
      "pointTransformConventionUnclear: top canonical projection scores are very close.",
    )
  }

  const rotationResults = results.filter((result) =>
    result.candidateName.startsWith("rotation_only_then_fit_current_bounds"),
  )
  const translationResults = results.filter((result) =>
    result.candidateName.startsWith("translation_included_then_fit_current_bounds"),
  )
  const rotationAverage = averageNumber(
    rotationResults
      .map((result) => result.metrics.averageDistance2D)
      .filter((value): value is number => value !== null),
  )
  const translationAverage = averageNumber(
    translationResults
      .map((result) => result.metrics.averageDistance2D)
      .filter((value): value is number => value !== null),
  )

  if (
    rotationAverage !== null &&
    translationAverage !== null &&
    Math.abs(rotationAverage - translationAverage) > 0.005
  ) {
    warnings.push(
      translationAverage < rotationAverage
        ? "translationImprovesPointFit: translation-included candidates beat rotation-only candidates on average."
        : "translationWorsensPointFit: translation-included candidates are worse than rotation-only candidates on average.",
    )
  }

  const bestByBucket = STABILITY_BUCKETS.map((bucket) => {
    const ranking = rankCanonicalProjectionResults(results.filter((result) => result.bucket === bucket))
    return { bucket, best: ranking[0] ?? null }
  }).filter((item) => item.best)

  const bestKeys = new Set(
    bestByBucket.map((item) => `${item.best?.candidateName}/${item.best?.matrixConvention}`),
  )
  if (bestKeys.size > 1) {
    warnings.push(
      "bucketSpecificConventionDifference: best candidate/convention differs across pose buckets.",
    )
  }

  const frontBest = bestByBucket.find((item) => item.bucket === "front")?.best
  const yawBestScores = bestByBucket
    .filter((item) => item.bucket === "yawPositive" || item.bucket === "yawNegative")
    .map((item) => item.best?.score ?? null)
    .filter((score): score is number => score !== null)
  const yawAverageScore = averageNumber(yawBestScores)
  if (
    frontBest?.score !== null &&
    frontBest?.score !== undefined &&
    yawAverageScore !== null &&
    yawAverageScore > frontBest.score * 1.8
  ) {
    warnings.push("frontGoodYawBad: front bucket fits much better than yaw buckets.")
  }

  const yawPositiveBest = bestByBucket.find((item) => item.bucket === "yawPositive")?.best
  const yawNegativeBest = bestByBucket.find((item) => item.bucket === "yawNegative")?.best
  if (
    yawPositiveBest &&
    yawNegativeBest &&
    `${yawPositiveBest.candidateName}/${yawPositiveBest.matrixConvention}` !==
      `${yawNegativeBest.candidateName}/${yawNegativeBest.matrixConvention}`
  ) {
    warnings.push(
      "yawPositiveNegativeTrendDifference: yawPositive and yawNegative prefer different projection conventions.",
    )
  }

  return warnings
}

function analyzeEmpirical478(
  captures: CaptureRecord[],
  canonical: ImportedCanonical468 | null,
): Empirical478Analysis {
  const frameWeightSummary = calculateFrameWeightSummary(captures)
  const usableDetails = frameWeightSummary.details.filter((detail) => !detail.excluded)
  const detailById = new Map(usableDetails.map((detail) => [detail.captureId, detail]))
  const usableCaptures = captures.filter((capture) => detailById.has(capture.captureId))
  const candidateResults = EMPIRICAL_478_CANDIDATES.flatMap((candidate) =>
    EMPIRICAL_478_INPUT_SPACES.flatMap((inputSpace) =>
      EMPIRICAL_478_NORMALIZATIONS.map((normalization) =>
        analyzeEmpirical478Candidate(
          candidate,
          inputSpace,
          normalization,
          usableCaptures,
          detailById,
        ),
      ),
    ),
  )
  const overallStabilityRanking = rankEmpirical478CandidateResults(candidateResults)
  const runtimeCompatibleRanking = rankEmpirical478CandidateResults(
    candidateResults.filter(
      (result) =>
        result.runtimeCompatible &&
        result.normalization !== "xy_separate_debug_only" &&
        !result.warnings.includes("xySeparateScaleDebugOnly") &&
        result.warningCount <= Math.max(2, Math.ceil(result.transformedFrameCount * 0.5)),
    ),
  )
  const bucketRanking = rankEmpirical478ByBucket(candidateResults)
  const bestOverallCandidate = overallStabilityRanking[0] ?? null
  const bestRuntimeCompatibleCandidate = runtimeCompatibleRanking[0] ?? null
  const empiricalCanonical478BestOverall = createEmpiricalCanonical478FromResult(
    findEmpiricalResult(candidateResults, bestOverallCandidate),
    bestOverallCandidate,
  )
  const empiricalCanonical478RuntimeCompatible = createEmpiricalCanonical478FromResult(
    findEmpiricalResult(candidateResults, bestRuntimeCompatibleCandidate),
    bestRuntimeCompatibleCandidate,
  )
  const warnings = uniqueWarningCodes([
    ...frameWeightSummary.warnings,
    ...candidateResults.flatMap((result) => result.warnings),
    "canonical468ReferenceOnly",
    "empiricalCanonical478NotProductionReady",
  ])

  return {
    status: usableCaptures.length > 0 ? "available" : "not_available",
    analysisVersion: "empirical_478_canonical_debug_v1",
    frameWeightSummary,
    candidateResults,
    overallStabilityRanking,
    runtimeCompatibleRanking,
    bucketRanking,
    bestOverallCandidate,
    bestRuntimeCompatibleCandidate,
    empiricalCanonical478BestOverall,
    empiricalCanonical478RuntimeCompatible,
    canonical468ReferenceComparison: compareEmpiricalCanonical478WithCanonical468(
      canonical,
      empiricalCanonical478BestOverall,
      bestOverallCandidate,
      empiricalCanonical478RuntimeCompatible,
      bestRuntimeCompatibleCandidate,
    ),
    warnings,
  }
}

function calculateFrameWeightSummary(captures: CaptureRecord[]): FrameWeightSummary {
  const initialDetails = captures.map(createInitialFrameWeightDetail)
  const usableInitial = initialDetails.filter((detail) => !detail.excluded)
  const bucketCounts = createEmptyStabilityBucketNumberRecord()
  for (const detail of usableInitial) {
    bucketCounts[detail.bucket] += 1
  }
  const nonEmptyCounts = STABILITY_BUCKETS.filter((bucket) => bucket !== "unknown")
    .map((bucket) => bucketCounts[bucket])
    .filter((count) => count > 0)
  const averageBucketCount = averageNumber(nonEmptyCounts) ?? 0

  const details = initialDetails.map((detail) => {
    const bucketBalance =
      detail.excluded || averageBucketCount <= 0 || bucketCounts[detail.bucket] <= 0
        ? detail.bucketBalance
        : clamp(Math.sqrt(averageBucketCount / bucketCounts[detail.bucket]), 0.45, 1.35)
    const frameWeight = detail.excluded
      ? 0
      : roundDebugNumber(
          clamp(
            detail.poseQuality *
              detail.rollQuality *
              detail.expressionNeutrality *
              bucketBalance,
            0,
            1.35,
          ),
        )
    return {
      ...detail,
      frameWeight,
      bucketBalance: roundDebugNumber(bucketBalance),
    }
  })
  const usableDetails = details.filter((detail) => !detail.excluded)
  const bucketWeightTotals = createEmptyStabilityBucketNumberRecord()
  for (const detail of usableDetails) {
    bucketWeightTotals[detail.bucket] += detail.frameWeight
  }
  const totalWeight = sum(usableDetails.map((detail) => detail.frameWeight))
  const warnings = createFrameWeightWarnings(captures, usableDetails, bucketCounts)

  return {
    inputFrameCount: captures.length,
    usableFrameCount: usableDetails.length,
    excludedFrameCount: captures.length - usableDetails.length,
    totalWeight: roundDebugNumber(totalWeight),
    averageWeight:
      usableDetails.length === 0
        ? null
        : roundDebugNumber(totalWeight / usableDetails.length),
    bucketCounts,
    bucketWeightTotals: roundStabilityBucketRecord(bucketWeightTotals),
    details,
    warnings,
  }
}

function createInitialFrameWeightDetail(capture: CaptureRecord): FrameWeightDetail {
  const warnings: Empirical478WarningCode[] = []
  const bucket = toStabilityBucket(capture.bucket)
  const pose = capture.pose
  const poseMagnitude = pose ? Math.hypot(pose.yaw, pose.pitch) : null
  const poseQuality = poseMagnitude === null ? 0.75 : calculatePoseQuality(poseMagnitude)
  const rollAbs = Math.abs(pose?.roll ?? 0)
  const rollQuality = clamp(1 - rollAbs / 35, 0.2, 1)
  const expressionNeutrality = calculateExpressionNeutrality(capture.blendshapes)

  if (capture.landmarks.length !== EXPECTED_LANDMARK_COUNT) {
    warnings.push("landmarkCountMismatch")
  }
  if (!getMatrixValues4x4(capture.facialTransformationMatrix)) {
    warnings.push("matrixMissing")
  }
  if (rollAbs > 20) {
    warnings.push("rollTooLarge")
  }
  if (expressionNeutrality < 0.72) {
    warnings.push("expressionTooStrong")
  }

  const excluded =
    warnings.includes("landmarkCountMismatch") || warnings.includes("matrixMissing")

  return {
    captureId: capture.captureId,
    bucket,
    frameWeight: 0,
    poseMagnitude,
    poseQuality: roundDebugNumber(poseQuality),
    rollQuality: roundDebugNumber(rollQuality),
    expressionNeutrality: roundDebugNumber(expressionNeutrality),
    bucketBalance: 1,
    excluded,
    warnings,
  }
}

function createFrameWeightWarnings(
  captures: CaptureRecord[],
  usableDetails: FrameWeightDetail[],
  bucketCounts: Record<StabilityBucket, number>,
): Empirical478WarningCode[] {
  const warnings: Empirical478WarningCode[] = []
  if (usableDetails.length < 6) {
    warnings.push("insufficientCaptureCount")
  }
  if (bucketCounts.front < 2) {
    warnings.push("insufficientFrontFrames")
  }
  if (bucketCounts.yawPositive < 1) {
    warnings.push("insufficientYawPositiveFrames")
  }
  if (bucketCounts.yawNegative < 1) {
    warnings.push("insufficientYawNegativeFrames")
  }
  if (bucketCounts.pitchPositive < 1) {
    warnings.push("insufficientPitchPositiveFrames")
  }
  if (bucketCounts.pitchNegative < 1) {
    warnings.push("insufficientPitchNegativeFrames")
  }
  if (captures.some((capture) => capture.landmarks.length !== EXPECTED_LANDMARK_COUNT)) {
    warnings.push("landmarkCountMismatch")
  }
  if (captures.some((capture) => !getMatrixValues4x4(capture.facialTransformationMatrix))) {
    warnings.push("matrixMissing")
  }
  if (usableDetails.some((detail) => detail.warnings.includes("expressionTooStrong"))) {
    warnings.push("expressionTooStrong")
  }
  if (usableDetails.some((detail) => detail.warnings.includes("rollTooLarge"))) {
    warnings.push("rollTooLarge")
  }
  const counts = Object.entries(bucketCounts)
    .filter(([bucket]) => bucket !== "unknown")
    .map(([, count]) => count)
    .filter((count) => count > 0)
  if (counts.length > 0 && Math.max(...counts) > Math.max(2, Math.min(...counts) * 3)) {
    warnings.push("bucketImbalance")
  }
  return uniqueWarningCodes(warnings)
}

function calculatePoseQuality(poseMagnitude: number): number {
  if (poseMagnitude < 3) {
    return 0.85
  }
  if (poseMagnitude <= 28) {
    return 1
  }
  if (poseMagnitude <= 45) {
    return 0.75
  }
  return 0.4
}

function calculateExpressionNeutrality(blendshapes: BlendshapeCapture[]): number {
  const expressionNames = [
    "jawOpen",
    "eyeBlinkLeft",
    "eyeBlinkRight",
    "eyeSquintLeft",
    "eyeSquintRight",
    "mouthSmileLeft",
    "mouthSmileRight",
  ]
  const maxExpression = maxOrNull(
    blendshapes
      .filter((blendshape) => expressionNames.includes(blendshape.categoryName))
      .map((blendshape) => blendshape.score),
  )
  return roundDebugNumber(clamp(1 - (maxExpression ?? 0) * 0.8, 0.25, 1))
}

function analyzeEmpirical478Candidate(
  definition: Empirical478CandidateDefinition,
  inputSpace: Empirical478InputSpace,
  normalization: Empirical478Normalization,
  captures: CaptureRecord[],
  detailById: Map<string, FrameWeightDetail>,
): Empirical478CandidateResult {
  const warnings: Empirical478WarningCode[] =
    normalization === "xy_separate_debug_only" ? ["xySeparateScaleDebugOnly"] : []
  const transformedFrames: Array<{
    capture: CaptureRecord
    points: LandmarkPoint[]
    weight: number
  }> = []

  for (const capture of captures) {
    const detail = detailById.get(capture.captureId)
    if (!detail || detail.frameWeight <= 0) {
      continue
    }
    const points = transformEmpirical478Capture(
      capture,
      definition,
      inputSpace,
      normalization,
    )
    if (points.length === EXPECTED_LANDMARK_COUNT && points.every(isFinitePoint)) {
      transformedFrames.push({
        capture,
        points,
        weight: detail.frameWeight,
      })
    }
  }

  const stability = calculateWeightedEmpirical478Stability(transformedFrames)
  const semanticAverageStdDev3D = averageEmpiricalSemanticStdDev(
    stability.semanticPointStability,
  )
  if (
    stability.averageStdDev3D !== null &&
    stability.averageStdDev3D > 0.16
  ) {
    warnings.push("candidateUnstable")
  }
  if (semanticAverageStdDev3D !== null && semanticAverageStdDev3D > 0.14) {
    warnings.push("semanticPointUnstable")
  }
  const yawPositive = stability.bucketStability.yawPositive.averageStdDev3D
  const yawNegative = stability.bucketStability.yawNegative.averageStdDev3D
  if (
    yawPositive !== null &&
    yawNegative !== null &&
    Math.abs(yawPositive - yawNegative) > Math.max(0.04, Math.min(yawPositive, yawNegative) * 0.75)
  ) {
    warnings.push("leftRightBucketMismatch")
  }
  const pitchPositive = stability.bucketStability.pitchPositive.averageStdDev3D
  const pitchNegative = stability.bucketStability.pitchNegative.averageStdDev3D
  if (
    pitchPositive !== null &&
    pitchNegative !== null &&
    Math.abs(pitchPositive - pitchNegative) > Math.max(0.04, Math.min(pitchPositive, pitchNegative) * 0.75)
  ) {
    warnings.push("pitchBucketMismatch")
  }

  const warningCount = warnings.length
  const score =
    stability.averageStdDev3D === null
      ? null
      : stability.averageStdDev3D +
        (semanticAverageStdDev3D ?? stability.averageStdDev3D) * 0.35 +
        stability.unstableLandmarkCount * 0.0005 +
        warningCount * 0.015

  return {
    candidateName: definition.candidateName,
    inputSpace,
    normalization,
    matrixConvention: definition.matrixConvention,
    runtimeCompatible:
      definition.runtimeCompatible && normalization !== "xy_separate_debug_only",
    transformedFrameCount: transformedFrames.length,
    frameWeightTotal: roundDebugNumber(sum(transformedFrames.map((frame) => frame.weight))),
    averageStdDev3D: stability.averageStdDev3D,
    averageStdDevX: stability.averageStdDevX,
    averageStdDevY: stability.averageStdDevY,
    averageStdDevZ: stability.averageStdDevZ,
    medianStdDev3D: stability.medianStdDev3D,
    maxStdDev3D: stability.maxStdDev3D,
    unstableLandmarkCount: stability.unstableLandmarkCount,
    perLandmarkMean: stability.perLandmarkMean,
    perLandmarkStdDev: stability.perLandmarkStdDev,
    semanticPointStability: stability.semanticPointStability,
    groupStability: stability.groupStability,
    bucketStability: stability.bucketStability,
    warnings: uniqueWarningCodes(warnings),
    warningCount,
    score: score === null ? null : roundDebugNumber(score),
  }
}

function transformEmpirical478Capture(
  capture: CaptureRecord,
  definition: Empirical478CandidateDefinition,
  inputSpace: Empirical478InputSpace,
  normalization: Empirical478Normalization,
): LandmarkPoint[] {
  const sourcePoints = capture.landmarks.map((landmark) => ({
    index: landmark.index,
    ...toEmpiricalInputPoint(capture, landmark, inputSpace),
  }))
  let transformed = sourcePoints

  if (
    definition.candidateName === "pose_rotation_inverse_engine_convention" ||
    definition.candidateName === "per_bucket_pose_normalized"
  ) {
    transformed = sourcePoints.map((point) => ({
      index: point.index,
      ...applyInversePoseRotation(point, capture.pose),
    }))
  } else if (definition.candidateName === "inverse_matrix_engine_pose_convention") {
    transformed = applyInverseMatrixToEmpiricalPoints(
      sourcePoints,
      capture,
      "row_major_column_vector",
      false,
    )
  } else if (definition.candidateName === "inverse_matrix_translation_last_row") {
    transformed = applyInverseMatrixToEmpiricalPoints(
      sourcePoints,
      capture,
      "row_major_row_vector",
      false,
    )
  } else if (definition.candidateName === "rotation_only_then_normalize") {
    transformed = applyInverseMatrixToEmpiricalPoints(
      sourcePoints,
      capture,
      "row_major_column_vector",
      true,
    )
  }

  return normalizeEmpiricalPoints(transformed, normalization)
}

function toEmpiricalInputPoint(
  capture: CaptureRecord,
  landmark: LandmarkPoint,
  inputSpace: Empirical478InputSpace,
): Point3 {
  const bounds = calculateBounds(capture.landmarks)
  const center = bounds ? calculateBoundsCenter(bounds) : { x: 0, y: 0, z: 0 }
  const videoAspect =
    capture.videoWidth > 0 && capture.videoHeight > 0
      ? capture.videoWidth / capture.videoHeight
      : 1

  switch (inputSpace) {
    case "normalized_xyz_direct":
      return { x: landmark.x, y: landmark.y, z: landmark.z }
    case "image_centered_same_unit":
      return {
        x: (landmark.x - 0.5) * videoAspect,
        y: landmark.y - 0.5,
        z: landmark.z,
      }
    case "face_bounds_centered_height_unit":
      return {
        x: safeDivide(landmark.x - center.x, bounds?.height ?? 0),
        y: safeDivide(landmark.y - center.y, bounds?.height ?? 0),
        z: safeDivide(landmark.z, bounds?.height ?? 0),
      }
    case "face_bounds_centered_width_unit":
      return {
        x: safeDivide(landmark.x - center.x, bounds?.width ?? 0),
        y: safeDivide(landmark.y - center.y, bounds?.width ?? 0),
        z: safeDivide(landmark.z, bounds?.width ?? 0),
      }
  }
}

function applyInversePoseRotation(point: Point3, pose: Pose | null): Point3 {
  if (!pose) {
    return point
  }

  const yaw = (-pose.yaw / RAD_TO_DEG)
  const pitch = (-pose.pitch / RAD_TO_DEG)
  const roll = (-pose.roll / RAD_TO_DEG)
  return rotateZ(rotateY(rotateX(point, pitch), yaw), roll)
}

function rotateX(point: Point3, angle: number): Point3 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return {
    x: point.x,
    y: point.y * c - point.z * s,
    z: point.y * s + point.z * c,
  }
}

function rotateY(point: Point3, angle: number): Point3 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return {
    x: point.x * c + point.z * s,
    y: point.y,
    z: -point.x * s + point.z * c,
  }
}

function rotateZ(point: Point3, angle: number): Point3 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return {
    x: point.x * c - point.y * s,
    y: point.x * s + point.y * c,
    z: point.z,
  }
}

function applyInverseMatrixToEmpiricalPoints(
  points: LandmarkPoint[],
  capture: CaptureRecord,
  conventionName: MatrixConventionName,
  rotationOnly: boolean,
): LandmarkPoint[] {
  const rawMatrix = getMatrixValues4x4(capture.facialTransformationMatrix)
  if (!rawMatrix) {
    return []
  }
  const convention = getMatrixConvention(conventionName)
  const matrix = getConventionMatrix(rawMatrix, convention)
  const candidateMatrix = rotationOnly ? removeMatrixTranslation(matrix) : matrix
  const inverseMatrix = invertMatrix(candidateMatrix, 4)
  if (!inverseMatrix) {
    return []
  }
  return points.map((point) => ({
    index: point.index,
    ...applyMatrixByConvention(inverseMatrix, point, convention),
  }))
}

function removeMatrixTranslation(matrix: number[]): number[] {
  const next = matrix.slice()
  next[3] = 0
  next[7] = 0
  next[11] = 0
  next[12] = 0
  next[13] = 0
  next[14] = 0
  next[15] = 1
  return next
}

function normalizeEmpiricalPoints(
  points: LandmarkPoint[],
  normalization: Empirical478Normalization,
): LandmarkPoint[] {
  const bounds = calculateBounds(points)
  if (!bounds) {
    return []
  }
  const center = calculateBoundsCenter(bounds)
  const scale =
    normalization === "height_unit"
      ? bounds.height
      : normalization === "bbox_max_unit"
        ? Math.max(bounds.width, bounds.height)
        : bounds.width
  const scaleX =
    normalization === "xy_separate_debug_only" ? bounds.width : scale
  const scaleY =
    normalization === "xy_separate_debug_only" ? bounds.height : scale
  const scaleZ = scale

  if (
    Math.abs(scaleX) <= EPSILON ||
    Math.abs(scaleY) <= EPSILON ||
    Math.abs(scaleZ) <= EPSILON
  ) {
    return []
  }

  return points.map((point) => ({
    index: point.index,
    x: (point.x - center.x) / scaleX,
    y: (point.y - center.y) / scaleY,
    z: (point.z - center.z) / scaleZ,
  }))
}

function calculateWeightedEmpirical478Stability(
  frames: Array<{ capture: CaptureRecord; points: LandmarkPoint[]; weight: number }>,
): {
  perLandmarkMean: LandmarkPoint[]
  perLandmarkStdDev: Empirical478CandidateResult["perLandmarkStdDev"]
  averageStdDevX: number | null
  averageStdDevY: number | null
  averageStdDevZ: number | null
  averageStdDev3D: number | null
  medianStdDev3D: number | null
  maxStdDev3D: number | null
  unstableLandmarkCount: number
  semanticPointStability: Empirical478SemanticStability
  groupStability: Empirical478GroupStability
  bucketStability: Record<StabilityBucket, BucketStability>
} {
  const weightedPointSets = frames.map((frame) => ({
    points: frame.points,
    weight: frame.weight,
  }))
  const perLandmarkStats = calculateWeightedPerLandmarkStability(weightedPointSets)
  const stdDevValues = perLandmarkStats.map((item) => item.stdDev3D)
  const unstableThreshold = Math.max((medianNumber(stdDevValues) ?? 0) * 2.5, 0.08)
  const semanticSamples = frames.map((frame) => ({
    weight: frame.weight,
    points: getSemanticPoints(frame.points),
  }))

  return {
    perLandmarkMean: perLandmarkStats.map((item) => ({
      index: item.index,
      x: item.mean.x,
      y: item.mean.y,
      z: item.mean.z,
    })),
    perLandmarkStdDev: perLandmarkStats.map((item) => ({
      index: item.index,
      stdDevX: item.stdDevX,
      stdDevY: item.stdDevY,
      stdDevZ: item.stdDevZ,
      stdDev3D: item.stdDev3D,
      sampleCount: item.sampleCount,
    })),
    averageStdDevX: roundNullable(averageNumber(perLandmarkStats.map((item) => item.stdDevX))),
    averageStdDevY: roundNullable(averageNumber(perLandmarkStats.map((item) => item.stdDevY))),
    averageStdDevZ: roundNullable(averageNumber(perLandmarkStats.map((item) => item.stdDevZ))),
    averageStdDev3D: roundNullable(averageNumber(stdDevValues)),
    medianStdDev3D: roundNullable(medianNumber(stdDevValues)),
    maxStdDev3D: roundNullable(maxOrNull(stdDevValues)),
    unstableLandmarkCount: perLandmarkStats.filter(
      (item) => item.stdDev3D > unstableThreshold,
    ).length,
    semanticPointStability: {
      noseTip: calculateWeightedPointStability(
        semanticSamples.map((sample) => ({
          point: sample.points.noseTip,
          weight: sample.weight,
        })),
      ),
      eyeCenter: calculateWeightedPointStability(
        semanticSamples.map((sample) => ({
          point: sample.points.eyeCenter,
          weight: sample.weight,
        })),
      ),
      mouthCenter: calculateWeightedPointStability(
        semanticSamples.map((sample) => ({
          point: sample.points.mouthCenter,
          weight: sample.weight,
        })),
      ),
      chin: calculateWeightedPointStability(
        semanticSamples.map((sample) => ({ point: sample.points.chin, weight: sample.weight })),
      ),
      leftCheek: calculateWeightedPointStability(
        semanticSamples.map((sample) => ({
          point: sample.points.leftCheek,
          weight: sample.weight,
        })),
      ),
      rightCheek: calculateWeightedPointStability(
        semanticSamples.map((sample) => ({
          point: sample.points.rightCheek,
          weight: sample.weight,
        })),
      ),
      leftContour: calculateWeightedPointStability(
        semanticSamples.map((sample) => ({
          point: sample.points.leftContour,
          weight: sample.weight,
        })),
      ),
      rightContour: calculateWeightedPointStability(
        semanticSamples.map((sample) => ({
          point: sample.points.rightContour,
          weight: sample.weight,
        })),
      ),
    },
    groupStability: {
      faceBoundary: calculateWeightedGroupStability(frames, OUTER_CONTOUR_INDICES),
      eyes: calculateWeightedGroupStability(frames, EYE_ERROR_INDICES),
      nose: calculateWeightedGroupStability(frames, NOSE_GROUP_INDICES),
      mouth: calculateWeightedGroupStability(frames, MOUTH_ERROR_INDICES),
      cheeks: calculateWeightedGroupStability(frames, CHEEK_GROUP_INDICES),
      jaw: calculateWeightedGroupStability(frames, JAW_GROUP_INDICES),
    },
    bucketStability: calculateWeightedBucketStability(frames),
  }
}

function calculateWeightedPerLandmarkStability(
  pointSets: Array<{ points: LandmarkPoint[]; weight: number }>,
): Array<PerLandmarkStability & { weightedSampleCount: number }> {
  const result: Array<PerLandmarkStability & { weightedSampleCount: number }> = []

  for (let index = 0; index < EXPECTED_LANDMARK_COUNT; index += 1) {
    const samples = pointSets
      .map((set) => ({
        point: set.points.find((point) => point.index === index) ?? null,
        weight: set.weight,
      }))
      .filter((sample): sample is { point: LandmarkPoint; weight: number } =>
        Boolean(sample.point),
      )
    const stability = calculateWeightedPointStability(samples)
    if (!stability.mean) {
      continue
    }
    result.push({
      index,
      mean: stability.mean,
      stdDevX: stability.stdDevX ?? 0,
      stdDevY: stability.stdDevY ?? 0,
      stdDevZ: stability.stdDevZ ?? 0,
      stdDev3D: stability.stdDev3D ?? 0,
      sampleCount: stability.sampleCount,
      weightedSampleCount: sum(samples.map((sample) => sample.weight)),
    })
  }

  return result
}

function calculateWeightedPointStability(
  samples: Array<{ point: Point3 | null; weight: number }>,
): PointStability {
  const validSamples = samples.filter(
    (sample): sample is { point: Point3; weight: number } =>
      Boolean(sample.point) && sample.weight > 0,
  )
  const totalWeight = sum(validSamples.map((sample) => sample.weight))
  if (validSamples.length === 0 || totalWeight <= EPSILON) {
    return {
      mean: null,
      stdDevX: null,
      stdDevY: null,
      stdDevZ: null,
      stdDev3D: null,
      sampleCount: 0,
    }
  }
  const mean = {
    x: sum(validSamples.map((sample) => sample.point.x * sample.weight)) / totalWeight,
    y: sum(validSamples.map((sample) => sample.point.y * sample.weight)) / totalWeight,
    z: sum(validSamples.map((sample) => sample.point.z * sample.weight)) / totalWeight,
  }
  const stdDevX = Math.sqrt(
    sum(validSamples.map((sample) => ((sample.point.x - mean.x) ** 2) * sample.weight)) /
      totalWeight,
  )
  const stdDevY = Math.sqrt(
    sum(validSamples.map((sample) => ((sample.point.y - mean.y) ** 2) * sample.weight)) /
      totalWeight,
  )
  const stdDevZ = Math.sqrt(
    sum(validSamples.map((sample) => ((sample.point.z - mean.z) ** 2) * sample.weight)) /
      totalWeight,
  )

  return {
    mean: roundPoint(mean),
    stdDevX: roundDebugNumber(stdDevX),
    stdDevY: roundDebugNumber(stdDevY),
    stdDevZ: roundDebugNumber(stdDevZ),
    stdDev3D: roundDebugNumber(Math.hypot(stdDevX, stdDevY, stdDevZ)),
    sampleCount: validSamples.length,
  }
}

function calculateWeightedGroupStability(
  frames: Array<{ points: LandmarkPoint[]; weight: number }>,
  indices: number[],
): BucketStability {
  const perLandmark = calculateWeightedPerLandmarkStability(
    frames.map((frame) => ({
      points: frame.points.filter((point) => indices.includes(point.index)),
      weight: frame.weight,
    })),
  )
  return {
    sampleCount: frames.length,
    averageStdDev3D: roundNullable(averageNumber(perLandmark.map((item) => item.stdDev3D))),
  }
}

function calculateWeightedBucketStability(
  frames: Array<{ capture: CaptureRecord; points: LandmarkPoint[]; weight: number }>,
): Record<StabilityBucket, BucketStability> {
  return STABILITY_BUCKETS.reduce(
    (summary, bucket) => {
      const bucketFrames = frames.filter(
        (frame) => toStabilityBucket(frame.capture.bucket) === bucket,
      )
      const perLandmark = calculateWeightedPerLandmarkStability(
        bucketFrames.map((frame) => ({ points: frame.points, weight: frame.weight })),
      )
      summary[bucket] = {
        sampleCount: bucketFrames.length,
        averageStdDev3D: roundNullable(averageNumber(perLandmark.map((item) => item.stdDev3D))),
      }
      return summary
    },
    {} as Record<StabilityBucket, BucketStability>,
  )
}

function rankEmpirical478CandidateResults(
  results: Empirical478CandidateResult[],
): Empirical478RankingEntry[] {
  return results
    .map(createEmpirical478RankingEntry)
    .sort((a, b) => {
      if (a.score === null && b.score === null) {
        return 0
      }
      if (a.score === null) {
        return 1
      }
      if (b.score === null) {
        return -1
      }
      return a.score - b.score
    })
}

function createEmpirical478RankingEntry(
  result: Empirical478CandidateResult,
): Empirical478RankingEntry {
  return {
    candidateName: result.candidateName,
    inputSpace: result.inputSpace,
    normalization: result.normalization,
    matrixConvention: result.matrixConvention,
    averageStdDev3D: result.averageStdDev3D,
    semanticAverageStdDev3D: averageEmpiricalSemanticStdDev(result.semanticPointStability),
    unstableLandmarkCount: result.unstableLandmarkCount,
    warningCount: result.warningCount,
    score: result.score,
  }
}

function averageEmpiricalSemanticStdDev(
  stability: Empirical478SemanticStability,
): number | null {
  return roundNullable(
    averageNumber(
      [
        stability.noseTip.stdDev3D,
        stability.eyeCenter.stdDev3D,
        stability.mouthCenter.stdDev3D,
        stability.chin.stdDev3D,
        stability.leftCheek.stdDev3D,
        stability.rightCheek.stdDev3D,
        stability.leftContour.stdDev3D,
        stability.rightContour.stdDev3D,
      ].filter((value): value is number => value !== null),
    ),
  )
}

function rankEmpirical478ByBucket(
  results: Empirical478CandidateResult[],
): Record<StabilityBucket, Empirical478RankingEntry[]> {
  return STABILITY_BUCKETS.reduce(
    (summary, bucket) => {
      summary[bucket] = results
        .map((result) => ({
          ...createEmpirical478RankingEntry(result),
          averageStdDev3D: result.bucketStability[bucket].averageStdDev3D,
          score:
            result.bucketStability[bucket].averageStdDev3D === null
              ? null
              : roundDebugNumber(
                  result.bucketStability[bucket].averageStdDev3D +
                    result.warningCount * 0.015,
                ),
        }))
        .filter((entry) => entry.averageStdDev3D !== null)
        .sort((a, b) => (a.score ?? Number.POSITIVE_INFINITY) - (b.score ?? Number.POSITIVE_INFINITY))
      return summary
    },
    {} as Record<StabilityBucket, Empirical478RankingEntry[]>,
  )
}

function findEmpiricalResult(
  results: Empirical478CandidateResult[],
  entry: Empirical478RankingEntry | null,
): Empirical478CandidateResult | null {
  if (!entry) {
    return null
  }
  return (
    results.find(
      (result) =>
        result.candidateName === entry.candidateName &&
        result.inputSpace === entry.inputSpace &&
        result.normalization === entry.normalization &&
        result.matrixConvention === entry.matrixConvention,
    ) ?? null
  )
}

function createEmpiricalCanonical478FromResult(
  result: Empirical478CandidateResult | null,
  sourceCandidate: Empirical478RankingEntry | null,
): EmpiricalCanonical478 | null {
  if (!result || result.perLandmarkMean.length === 0 || !sourceCandidate) {
    return null
  }
  const stdDevByIndex = new Map(result.perLandmarkStdDev.map((item) => [item.index, item]))
  const landmarks = result.perLandmarkMean.map((point) => {
    const stdDev = stdDevByIndex.get(point.index)
    return {
      ...point,
      stdDevX: stdDev?.stdDevX ?? 0,
      stdDevY: stdDev?.stdDevY ?? 0,
      stdDevZ: stdDev?.stdDevZ ?? 0,
      stdDev3D: stdDev?.stdDev3D ?? 0,
      sampleCount: stdDev?.sampleCount ?? 0,
    }
  })
  const bounds = calculateBounds(landmarks)
  const depth = bounds?.zRange ?? null
  const semanticPoints = getSemanticPoints(landmarks)

  return {
    debugArtifact: true,
    sourceTransformCandidate: result.candidateName,
    sourceCandidate,
    landmarks,
    summary: {
      bounds,
      centroid: calculateCentroid(landmarks),
      boundsCenter: bounds ? calculateBoundsCenter(bounds) : null,
      zRange: depth,
      widthHeightRatio: bounds ? safeFiniteDivide(bounds.width, bounds.height) : null,
      widthDepthRatio: bounds && depth !== null ? safeFiniteDivide(bounds.width, depth) : null,
      heightDepthRatio: bounds && depth !== null ? safeFiniteDivide(bounds.height, depth) : null,
      semanticSummary: {
        points: semanticPoints,
        z: getZSemanticSummary(semanticPoints),
      },
      frameCount: result.transformedFrameCount,
      sourceCandidate,
      warningSummary: result.warnings,
    },
  }
}

function compareEmpiricalCanonical478WithCanonical468(
  canonical: ImportedCanonical468 | null,
  bestOverall: EmpiricalCanonical478 | null,
  bestOverallCandidate: Empirical478RankingEntry | null,
  runtimeCompatible: EmpiricalCanonical478 | null,
  runtimeCompatibleCandidate: Empirical478RankingEntry | null,
): Canonical468ReferenceComparison {
  if (!canonical || canonical.vertices.length < CANONICAL_468_LANDMARK_COUNT) {
    return {
      status: "not_available",
      note: "canonical468 is reference only and was not imported.",
      bestOverall: null,
      runtimeCompatible: null,
    }
  }

  return {
    status: "available",
    note: "canonical468 is reference only; ranking is based on multi-pose frame stability, not similarity to canonical468.",
    bestOverall: bestOverall
      ? compareOneEmpiricalCanonicalWithCanonical468(
          bestOverall,
          canonical.vertices,
          bestOverallCandidate,
        )
      : null,
    runtimeCompatible: runtimeCompatible
      ? compareOneEmpiricalCanonicalWithCanonical468(
          runtimeCompatible,
          canonical.vertices,
          runtimeCompatibleCandidate,
        )
      : null,
  }
}

function compareOneEmpiricalCanonicalWithCanonical468(
  empirical: EmpiricalCanonical478,
  canonicalVertices: LandmarkPoint[],
  sourceCandidate: Empirical478RankingEntry | null,
): EmpiricalCanonical478Comparison {
  const empirical468 = empirical.landmarks.slice(0, CANONICAL_468_LANDMARK_COUNT)
  const canonical468 = canonicalVertices.slice(0, CANONICAL_468_LANDMARK_COUNT)
  const empiricalBounds = calculateBounds(empirical468)
  const canonicalBounds = calculateBounds(canonical468)
  const empiricalNormalized = empiricalBounds
    ? normalizeEmpiricalPoints(empirical468, "bbox_max_unit")
    : []
  const canonicalNormalized = canonicalBounds
    ? normalizeEmpiricalPoints(canonical468, "bbox_max_unit")
    : []
  const distances = empiricalNormalized
    .map((point) => {
      const canonicalPoint = canonicalNormalized.find((item) => item.index === point.index)
      return canonicalPoint ? calculateDistance(point, canonicalPoint) : null
    })
    .filter((value): value is number => value !== null)
  const empiricalSemantic = getSemanticPoints(empirical468)
  const canonicalSemantic = getSemanticPoints(canonical468)

  return {
    sourceCandidate,
    boundsRatio: {
      width:
        empiricalBounds && canonicalBounds
          ? safeFiniteDivide(empiricalBounds.width, canonicalBounds.width)
          : null,
      height:
        empiricalBounds && canonicalBounds
          ? safeFiniteDivide(empiricalBounds.height, canonicalBounds.height)
          : null,
      aspectRatio:
        empiricalBounds?.aspectRatio && canonicalBounds?.aspectRatio
          ? safeFiniteDivide(empiricalBounds.aspectRatio, canonicalBounds.aspectRatio)
          : null,
    },
    zRangeRatio:
      empiricalBounds && canonicalBounds
        ? safeFiniteDivide(empiricalBounds.zRange, canonicalBounds.zRange)
        : null,
    semanticPointDelta: {
      noseTip: calculateOptionalDistance3D(empiricalSemantic.noseTip, canonicalSemantic.noseTip),
      eyeCenter: calculateOptionalDistance3D(
        empiricalSemantic.eyeCenter,
        canonicalSemantic.eyeCenter,
      ),
      mouthCenter: calculateOptionalDistance3D(
        empiricalSemantic.mouthCenter,
        canonicalSemantic.mouthCenter,
      ),
      chin: calculateOptionalDistance3D(empiricalSemantic.chin, canonicalSemantic.chin),
      leftCheek: calculateOptionalDistance3D(
        empiricalSemantic.leftCheek,
        canonicalSemantic.leftCheek,
      ),
      rightCheek: calculateOptionalDistance3D(
        empiricalSemantic.rightCheek,
        canonicalSemantic.rightCheek,
      ),
      leftContour: calculateOptionalDistance3D(
        empiricalSemantic.leftContour,
        canonicalSemantic.leftContour,
      ),
      rightContour: calculateOptionalDistance3D(
        empiricalSemantic.rightContour,
        canonicalSemantic.rightContour,
      ),
    },
    averageDistanceAfterSimpleNormalization: roundNullable(averageNumber(distances)),
  }
}

function analyzeTransformCandidate(
  definition: CandidateDefinition,
  captures: CaptureRecord[],
  matrixConvention: MatrixConventionName | null,
): TransformCandidateAnalysis {
  const warnings: string[] = []
  const transformedCaptures: Array<{
    capture: CaptureRecord
    points: LandmarkPoint[]
    summary: PerCaptureCandidateSummary
  }> = []

  for (const capture of captures) {
    const result = transformCaptureLandmarks(definition, capture, matrixConvention)
    if (result.warnings.length > 0) {
      warnings.push(...result.warnings.map((warning) => `${capture.captureId}: ${warning}`))
    }

    if (result.points.length > 0) {
      transformedCaptures.push({
        capture,
        points: result.points,
        summary: {
          captureId: capture.captureId,
          bucket: capture.bucket,
          pointCount: result.points.length,
          canonicalLikeBounds: calculateBounds(result.points),
          centroid: calculateCentroid(result.points),
          warnings: result.warnings,
        },
      })
    }
  }

  if (transformedCaptures.length === 0) {
    warnings.push("有効な transformed capture がありません。")
  }

  const frameToFrameStability = calculateCandidateStability(transformedCaptures)
  const abnormalBoundsCount = transformedCaptures.filter((item) =>
    hasAbnormalBounds(item.summary.canonicalLikeBounds),
  ).length
  const hugeValueWarningCount = transformedCaptures.reduce(
    (count, item) => count + item.summary.warnings.filter(isHugeValueWarning).length,
    0,
  )
  const score = calculateCandidateScore(
    frameToFrameStability.averageStdDev3D,
    abnormalBoundsCount,
    hugeValueWarningCount,
  )

  if (
    frameToFrameStability.averageStdDev3D !== null &&
    frameToFrameStability.averageStdDev3D > HUGE_STDDEV_THRESHOLD
  ) {
    warnings.push("unstableCanonicalLikeResult: averageStdDev3D is extremely large.")
  }

  if (
    matrixConvention &&
    frameToFrameStability.averageStdDev3D !== null &&
    frameToFrameStability.averageStdDev3D > 1
  ) {
    warnings.push(
      "poseConventionMatchesButPointTransformUnstable: pose matching alone does not prove the point transform convention.",
    )
  }

  return {
    transformName: definition.transformName,
    matrixConvention,
    translationMode: matrixConvention ? getMatrixConvention(matrixConvention).translationMode : "none",
    description: definition.description,
    assumptions: definition.assumptions,
    perCaptureCanonicalLikeBounds: transformedCaptures.map((item) => item.summary),
    averagedCanonicalLikeBounds: averageBounds(
      transformedCaptures
        .map((item) => item.summary.canonicalLikeBounds)
        .filter((bounds): bounds is BoundsSummary => Boolean(bounds)),
    ),
    frameToFrameStability,
    abnormalBoundsCount,
    hugeValueWarningCount,
    score,
    warnings,
  }
}

function transformCaptureLandmarks(
  definition: CandidateDefinition,
  capture: CaptureRecord,
  matrixConvention: MatrixConventionName | null,
): { points: LandmarkPoint[]; warnings: string[] } {
  const warnings: string[] = []

  if (capture.landmarks.length === 0) {
    return { points: [], warnings: ["landmarks が空です。"] }
  }

  const bounds = calculateBounds(capture.landmarks)
  const boundsCenter = bounds ? calculateBoundsCenter(bounds) : null
  const faceScale = bounds ? Math.max(bounds.width, bounds.height) : 0
  const videoAspect =
    capture.videoWidth > 0 && capture.videoHeight > 0
      ? capture.videoWidth / capture.videoHeight
      : 1

  let inverseMatrix: number[] | null = null
  if (definition.usesInverseMatrix) {
    const matrix = getMatrixValues4x4(capture.facialTransformationMatrix)
    const convention = matrixConvention ? getMatrixConvention(matrixConvention) : null
    const conventionMatrix = matrix && convention ? getConventionMatrix(matrix, convention) : null
    inverseMatrix = conventionMatrix ? invertMatrix(conventionMatrix, 4) : null

    if (!inverseMatrix) {
      return {
        points: [],
        warnings: ["4x4 facialTransformationMatrix の逆行列を作れませんでした。"],
      }
    }
  }

  if (
    (definition.transformName === "face_bounds_centered" ||
      definition.transformName === "no_inverse_canonicalized_baseline") &&
    (!boundsCenter || faceScale <= EPSILON)
  ) {
    return { points: [], warnings: ["face bounds の center / scale を計算できませんでした。"] }
  }

  const points = capture.landmarks.map((landmark) => {
    const sourcePoint = toCandidateSourcePoint(
      definition.transformName,
      landmark,
      boundsCenter,
      faceScale,
      videoAspect,
    )
    const transformed =
      inverseMatrix && matrixConvention
        ? applyMatrixByConvention(inverseMatrix, sourcePoint, getMatrixConvention(matrixConvention))
        : sourcePoint

    return {
      index: landmark.index,
      x: transformed.x,
      y: transformed.y,
      z: transformed.z,
    }
  })

  const resultBounds = calculateBounds(points)
  const resultCentroid = calculateCentroid(points)
  if (points.some((point) => !isFinitePoint(point))) {
    warnings.push("matrixConventionLikelyWrong: inverse result has NaN or Infinity.")
  }
  if (
    points.some(
      (point) =>
        Math.abs(point.x) > HUGE_ABS_VALUE_THRESHOLD ||
        Math.abs(point.y) > HUGE_ABS_VALUE_THRESHOLD ||
        Math.abs(point.z) > HUGE_ABS_VALUE_THRESHOLD,
    )
  ) {
    warnings.push("inverseResultHugeBounds: canonical-like points contain extremely large values.")
  }
  if (hasAbnormalBounds(resultBounds)) {
    warnings.push("inverseResultHugeBounds: canonical-like bounds are extremely large.")
  }
  if (resultCentroid && vectorLength(resultCentroid) > HUGE_BOUNDS_THRESHOLD) {
    warnings.push("inverseResultHugeBounds: canonical-like centroid is extremely far from origin.")
  }

  return { points, warnings }
}

function toCandidateSourcePoint(
  transformName: TransformName,
  landmark: LandmarkPoint,
  boundsCenter: Point3 | null,
  faceScale: number,
  videoAspect: number,
): Point3 {
  switch (transformName) {
    case "normalized_xyz_direct":
      return {
        x: landmark.x,
        y: landmark.y,
        z: landmark.z,
      }
    case "image_centered_same_unit":
      return {
        x: (landmark.x - 0.5) * videoAspect,
        y: landmark.y - 0.5,
        z: landmark.z,
      }
    case "face_bounds_centered":
    case "no_inverse_canonicalized_baseline":
      return {
        x: (landmark.x - (boundsCenter?.x ?? 0)) / faceScale,
        y: (landmark.y - (boundsCenter?.y ?? 0)) / faceScale,
        z: (landmark.z - (boundsCenter?.z ?? 0)) / faceScale,
      }
  }
}

function calculateCandidateStability(
  transformedCaptures: Array<{ capture: CaptureRecord; points: LandmarkPoint[] }>,
): CandidateStability {
  const perLandmarkMean = calculatePerLandmarkStability(
    transformedCaptures.map((item) => item.points),
  )
  const stdDevItems = perLandmarkMean.filter((item) => item.sampleCount > 0)
  const averageStdDevX = averageNumber(stdDevItems.map((item) => item.stdDevX))
  const averageStdDevY = averageNumber(stdDevItems.map((item) => item.stdDevY))
  const averageStdDevZ = averageNumber(stdDevItems.map((item) => item.stdDevZ))
  const averageStdDev3D = averageNumber(stdDevItems.map((item) => item.stdDev3D))
  const maxStdDevLandmark =
    stdDevItems.length === 0
      ? null
      : [...stdDevItems].sort((a, b) => b.stdDev3D - a.stdDev3D)[0]

  const semanticSamples = transformedCaptures.map((item) => ({
    capture: item.capture,
    points: getSemanticPoints(item.points),
  }))

  return {
    perLandmarkMean,
    averageStdDevX,
    averageStdDevY,
    averageStdDevZ,
    averageStdDev3D,
    maxStdDevLandmark,
    semanticPointStability: {
      noseTip: calculatePointStability(
        semanticSamples.map((item) => item.points.noseTip),
      ),
      eyeCenter: calculatePointStability(
        semanticSamples.map((item) => item.points.eyeCenter),
      ),
      mouthCenter: calculatePointStability(
        semanticSamples.map((item) => item.points.mouthCenter),
      ),
      chin: calculatePointStability(semanticSamples.map((item) => item.points.chin)),
      cheek: calculatePointStability(
        semanticSamples
          .map((item) =>
            item.points.leftCheek && item.points.rightCheek
              ? averagePoints([item.points.leftCheek, item.points.rightCheek])
              : null,
          )
          .filter((point): point is Point3 => Boolean(point)),
      ),
    },
    bucketStability: calculateBucketStability(transformedCaptures),
  }
}

function calculatePerLandmarkStability(
  pointSets: LandmarkPoint[][],
): PerLandmarkStability[] {
  const result: PerLandmarkStability[] = []

  for (let index = 0; index < EXPECTED_LANDMARK_COUNT; index += 1) {
    const points = pointSets
      .map((set) => set.find((point) => point.index === index) ?? null)
      .filter((point): point is LandmarkPoint => Boolean(point))

    if (points.length === 0) {
      continue
    }

    const stability = calculatePointStability(points)
    if (!stability.mean) {
      continue
    }

    result.push({
      index,
      mean: stability.mean,
      stdDevX: stability.stdDevX ?? 0,
      stdDevY: stability.stdDevY ?? 0,
      stdDevZ: stability.stdDevZ ?? 0,
      stdDev3D: stability.stdDev3D ?? 0,
      sampleCount: stability.sampleCount,
    })
  }

  return result
}

function calculateBucketStability(
  transformedCaptures: Array<{ capture: CaptureRecord; points: LandmarkPoint[] }>,
): Record<StabilityBucket, BucketStability> {
  return STABILITY_BUCKETS.reduce(
    (summary, bucket) => {
      const pointSets = transformedCaptures
        .filter((item) => toStabilityBucket(item.capture.bucket) === bucket)
        .map((item) => item.points)
      const perLandmark = calculatePerLandmarkStability(pointSets)
      summary[bucket] = {
        sampleCount: pointSets.length,
        averageStdDev3D: averageNumber(perLandmark.map((item) => item.stdDev3D)),
      }
      return summary
    },
    {} as Record<StabilityBucket, BucketStability>,
  )
}

function rankCandidates(
  candidates: TransformCandidateAnalysis[],
): StabilityRankingEntry[] {
  return candidates
    .map((candidate) => {
      const zRanges = candidate.perCaptureCanonicalLikeBounds
        .map((item) => item.canonicalLikeBounds?.zRange ?? null)
        .filter((value): value is number => value !== null)
      return {
        transformName: candidate.transformName,
        matrixConvention: candidate.matrixConvention,
        translationMode: candidate.translationMode,
        averageStdDev3D: candidate.frameToFrameStability.averageStdDev3D,
        averageStdDevX: candidate.frameToFrameStability.averageStdDevX,
        averageStdDevY: candidate.frameToFrameStability.averageStdDevY,
        averageStdDevZ: candidate.frameToFrameStability.averageStdDevZ,
        semanticPointStability: candidate.frameToFrameStability.semanticPointStability,
        noseStdDev3D:
          candidate.frameToFrameStability.semanticPointStability.noseTip.stdDev3D,
        zRangeStability: standardDeviation(zRanges),
        abnormalBoundsCount: candidate.abnormalBoundsCount,
        hugeValueWarningCount: candidate.hugeValueWarningCount,
        score: candidate.score,
        sampleCount: candidate.perCaptureCanonicalLikeBounds.length,
      }
    })
    .sort((a, b) => {
      if (a.score === null && b.score === null) {
        return 0
      }
      if (a.score === null) {
        return 1
      }
      if (b.score === null) {
        return -1
      }
      return a.score - b.score
    })
}

function createEmpiricalCanonical478(
  candidate: TransformCandidateAnalysis,
  transformName: TransformName,
): EmpiricalCanonical478 | null {
  const landmarks = candidate.frameToFrameStability.perLandmarkMean
    .filter((item) => item.sampleCount > 0)
    .map((item) => ({
      index: item.index,
      x: item.mean.x,
      y: item.mean.y,
      z: item.mean.z,
      stdDevX: item.stdDevX,
      stdDevY: item.stdDevY,
      stdDevZ: item.stdDevZ,
      stdDev3D: item.stdDev3D,
      sampleCount: item.sampleCount,
    }))

  if (landmarks.length === 0) {
    return null
  }

  const bounds = calculateBounds(landmarks)

  return {
    debugArtifact: true,
    sourceTransformCandidate: transformName,
    landmarks,
    summary: {
      bounds,
      centroid: calculateCentroid(landmarks),
      boundsCenter: bounds ? calculateBoundsCenter(bounds) : null,
      zRange: bounds?.zRange ?? null,
      semanticSummary: {
        points: getSemanticPoints(landmarks),
        z: getZSemanticSummary(getSemanticPoints(landmarks)),
      },
    },
  }
}

function summarizeCaptures(captures: CaptureRecord[]): SourceCaptureSummary {
  const landmarkCounts = captures.map((capture) => capture.landmarks.length)
  const widths = captures.map((capture) => capture.videoWidth).filter(isFiniteNumber)
  const heights = captures.map((capture) => capture.videoHeight).filter(isFiniteNumber)
  const poses = captures.map((capture) => capture.pose).filter((pose): pose is Pose => Boolean(pose))

  return {
    captureCount: captures.length,
    bucketCounts: countBuckets(captures),
    landmarkCount: {
      expected: EXPECTED_LANDMARK_COUNT,
      min: minOrNull(landmarkCounts),
      max: maxOrNull(landmarkCounts),
      allExpected: landmarkCounts.every((count) => count === EXPECTED_LANDMARK_COUNT),
    },
    matrixAvailableCount: captures.filter((capture) => Boolean(capture.facialTransformationMatrix))
      .length,
    videoSizeSummary: {
      uniqueSizes: [...new Set(captures.map((capture) => `${capture.videoWidth}x${capture.videoHeight}`))],
      minWidth: minOrNull(widths),
      maxWidth: maxOrNull(widths),
      minHeight: minOrNull(heights),
      maxHeight: maxOrNull(heights),
    },
    poseRange: {
      yaw: {
        min: minOrNull(poses.map((pose) => pose.yaw)),
        max: maxOrNull(poses.map((pose) => pose.yaw)),
      },
      pitch: {
        min: minOrNull(poses.map((pose) => pose.pitch)),
        max: maxOrNull(poses.map((pose) => pose.pitch)),
      },
      roll: {
        min: minOrNull(poses.map((pose) => pose.roll)),
        max: maxOrNull(poses.map((pose) => pose.roll)),
      },
    },
  }
}

function analyzeRawCapture(capture: CaptureRecord): CaptureRawAnalysis {
  const bounds = calculateBounds(capture.landmarks)
  const semanticPoints = getSemanticPoints(capture.landmarks)

  return {
    captureId: capture.captureId,
    bucket: capture.bucket,
    landmarkCount: capture.landmarks.length,
    bounds,
    centroid: calculateCentroid(capture.landmarks),
    boundsCenter: bounds ? calculateBoundsCenter(bounds) : null,
    semanticSummary: {
      points: semanticPoints,
      z: getZSemanticSummary(semanticPoints),
    },
  }
}

function analyzeMatrix(capture: CaptureRecord): MatrixAnalysis {
  const matrix = getMatrixValues4x4(capture.facialTransformationMatrix)
  const warnings: string[] = []
  const rawTranslationCandidates = getRawTranslationCandidates(matrix)

  if (!matrix) {
    warnings.push("4x4 matrix がありません。")
    return {
      captureId: capture.captureId,
      available: false,
      enginePoseConvention: ENGINE_POSE_CONVENTION,
      labPoseConvention: LAB_CURRENT_CONVENTION,
      assumption: createMatrixAssumption(),
      rawValues: capture.facialTransformationMatrix?.values ?? null,
      rawTranslationCandidates,
      translation: null,
      interpretedTranslationByConvention: createEmptyTranslationByConvention(),
      poseByConvention: createEmptyPoseByConvention(capture.pose),
      conventionComparison: [],
      approximateScale: null,
      rotationBasis: null,
      determinant: null,
      extractedPose: null,
      capturePose: capture.pose,
      poseDelta: null,
      inverseAvailable: false,
      warnings,
    }
  }

  const conventionComparison = MATRIX_CONVENTIONS.map((convention) =>
    analyzeMatrixConvention(capture, matrix, convention),
  )
  const currentConventionAnalysis = conventionComparison.find(
    (item) => item.matrixConvention === LAB_CURRENT_CONVENTION,
  )
  const xAxis = { x: matrix[0], y: matrix[4], z: matrix[8] }
  const yAxis = { x: matrix[1], y: matrix[5], z: matrix[9] }
  const zAxis = { x: matrix[2], y: matrix[6], z: matrix[10] }
  const approximateScale = averageNumber([
    vectorLength(xAxis),
    vectorLength(yAxis),
    vectorLength(zAxis),
  ])
  const determinant = determinant3x3(matrix)
  const extractedPose = estimateFacePoseFromMatrixValues(matrix, 4)
  const inverseAvailable = Boolean(invertMatrix(matrix, 4))

  if (!inverseAvailable) {
    warnings.push("逆行列を作れませんでした。")
  }

  return {
    captureId: capture.captureId,
    available: true,
    enginePoseConvention: ENGINE_POSE_CONVENTION,
    labPoseConvention: LAB_CURRENT_CONVENTION,
    assumption: createMatrixAssumption(),
    rawValues: matrix,
    rawTranslationCandidates,
    translation: currentConventionAnalysis?.interpretedTranslation ?? null,
    interpretedTranslationByConvention: conventionComparison.reduce(
      (summary, item) => {
        summary[item.matrixConvention] = item.interpretedTranslation
        return summary
      },
      {} as Record<MatrixConventionName, Point3 | null>,
    ),
    poseByConvention: conventionComparison.reduce(
      (summary, item) => {
        summary[item.matrixConvention] = {
          extractedPose: item.extractedPose,
          capturePose: item.capturePose,
          poseDelta: item.poseDelta,
        }
        return summary
      },
      {} as Record<MatrixConventionName, MatrixConventionPoseSummary>,
    ),
    conventionComparison,
    approximateScale,
    rotationBasis: {
      xAxis,
      yAxis,
      zAxis,
    },
    determinant,
    extractedPose,
    capturePose: capture.pose,
    poseDelta:
      extractedPose && capture.pose
        ? {
            yaw: extractedPose.yaw - capture.pose.yaw,
            pitch: extractedPose.pitch - capture.pose.pitch,
            roll: extractedPose.roll - capture.pose.roll,
          }
        : null,
    inverseAvailable,
    warnings,
  }
}

function createMatrixAssumption(): MatrixAnalysis["assumption"] {
  return {
    ordering: "row-major",
    indexFormula: "values[row * columns + column]",
    vectorConvention: "column-vector point, pDetected = M * pCanonical",
    maps: "MediaPipe canonical face to detected face",
  }
}

function analyzeMatrixConvention(
  capture: CaptureRecord,
  rawValues: number[],
  convention: MatrixConventionDefinition,
): MatrixConventionCaptureSummary {
  const matrix = getConventionMatrix(rawValues, convention)
  const columnEquivalent = getColumnVectorEquivalentMatrix(matrix, convention)
  const interpretedTranslation = getInterpretedTranslation(matrix, convention)
  const pose = estimateFacePoseFromMatrixValues(columnEquivalent, 4)
  const inverseAvailable = Boolean(invertMatrix(matrix, 4))
  const axes = getRotationAxesForColumnEquivalent(columnEquivalent)
  const approximateScale = averageNumber([
    vectorLength(axes.xAxis),
    vectorLength(axes.yAxis),
    vectorLength(axes.zAxis),
  ])
  const determinant = determinant3x3(columnEquivalent)
  const warnings: string[] = []

  if (!inverseAvailable) {
    warnings.push("matrixConventionLikelyWrong: inverse matrix is unavailable.")
  }

  if (
    interpretedTranslation &&
    vectorLength(interpretedTranslation) > HUGE_BOUNDS_THRESHOLD
  ) {
    warnings.push("translationInterpretationSuspicious: interpreted translation is very large.")
  }

  return {
    matrixConvention: convention.name,
    translationMode: convention.translationMode,
    interpretedTranslation,
    approximateScale,
    determinant,
    extractedPose: pose,
    capturePose: capture.pose,
    poseDelta:
      pose && capture.pose
        ? {
            yaw: pose.yaw - capture.pose.yaw,
            pitch: pose.pitch - capture.pose.pitch,
            roll: pose.roll - capture.pose.roll,
          }
        : null,
    inverseAvailable,
    forwardProjectionApproximation: calculateForwardProjectionApproximation(
      capture,
      matrix,
      convention,
    ),
    warnings,
  }
}

function createTransformConventionDefinitions(): Array<{
  definition: CandidateDefinition
  matrixConvention: MatrixConventionName | null
}> {
  return CANDIDATE_DEFINITIONS.flatMap(
    (
      definition,
    ): Array<{
      definition: CandidateDefinition
      matrixConvention: MatrixConventionName | null
    }> => {
    if (!definition.usesInverseMatrix) {
      return [{ definition, matrixConvention: null }]
    }

    return MATRIX_CONVENTIONS.map((convention) => ({
      definition,
      matrixConvention: convention.name,
    }))
  })
}

function calculateForwardProjectionApproximation(
  capture: CaptureRecord,
  matrix: number[],
  convention: MatrixConventionDefinition,
): MatrixConventionCaptureSummary["forwardProjectionApproximation"] {
  const bounds = calculateBounds(capture.landmarks)
  const boundsCenter = bounds ? calculateBoundsCenter(bounds) : null
  const faceScale = bounds ? Math.max(bounds.width, bounds.height) : 0

  if (!boundsCenter || faceScale <= EPSILON) {
    return {
      averageError3D: null,
      maxError3D: null,
      sampleCount: 0,
      note: "approximate only: face bounds normalization was unavailable.",
    }
  }

  const projected = capture.landmarks.map((landmark) => {
    const canonicalLike = toCandidateSourcePoint(
      "face_bounds_centered",
      landmark,
      boundsCenter,
      faceScale,
      capture.videoHeight === 0 ? 1 : capture.videoWidth / capture.videoHeight,
    )
    return applyMatrixByConvention(matrix, canonicalLike, convention)
  })
  const projectedBounds = calculateBounds(projected)
  const projectedCenter = projectedBounds ? calculateBoundsCenter(projectedBounds) : null
  const projectedScale = projectedBounds ? Math.max(projectedBounds.width, projectedBounds.height) : 0

  if (!projectedCenter || projectedScale <= EPSILON) {
    return {
      averageError3D: null,
      maxError3D: null,
      sampleCount: 0,
      note: "approximate only: projected bounds normalization was unavailable.",
    }
  }

  const errors = projected.map((point, index) => {
    const normalizedDetected = {
      x: (point.x - projectedCenter.x) / projectedScale,
      y: (point.y - projectedCenter.y) / projectedScale,
      z: (point.z - projectedCenter.z) / projectedScale,
    }
    const current = toCandidateSourcePoint(
      "face_bounds_centered",
      capture.landmarks[index],
      boundsCenter,
      faceScale,
      1,
    )
    return calculateDistance(normalizedDetected, current)
  })

  return {
    averageError3D: averageNumber(errors),
    maxError3D: maxOrNull(errors),
    sampleCount: errors.length,
    note: "approximate only: current landmarks were bounds-normalized as a temporary canonical-like source, then normalized again before error measurement.",
  }
}

function createEmptyPoseByConvention(
  capturePose: Pose | null,
): Record<MatrixConventionName, MatrixConventionPoseSummary> {
  return MATRIX_CONVENTIONS.reduce(
    (summary, convention) => {
      summary[convention.name] = {
        extractedPose: null,
        capturePose,
        poseDelta: null,
      }
      return summary
    },
    {} as Record<MatrixConventionName, MatrixConventionPoseSummary>,
  )
}

function createEmptyTranslationByConvention(): Record<MatrixConventionName, Point3 | null> {
  return MATRIX_CONVENTIONS.reduce(
    (summary, convention) => {
      summary[convention.name] = null
      return summary
    },
    {} as Record<MatrixConventionName, Point3 | null>,
  )
}

function render(): void {
  const frame = state.latestFrame
  const matrixAvailable = Boolean(frame?.facialTransformationMatrix)
  const fps =
    state.loopStartedAt === null
      ? 0
      : state.detectCount / Math.max((performance.now() - state.loopStartedAt) / 1000, 1)
  const inputCaptures = getAnalysisInputCaptures()
  const importedSummary = summarizeCaptures(inputCaptures)
  const analysis = state.analysis

  getElement("runStatus").textContent =
    state.cameraStatus === "running" && state.detectorStatus === "ready"
      ? "準備完了"
      : `カメラ: ${formatLifecycleStatus(state.cameraStatus)} / 検出器: ${formatLifecycleStatus(
          state.detectorStatus,
        )}`

  getElement("statusGrid").innerHTML = renderStatusItems([
    ["カメラ状態", formatLifecycleStatus(state.cameraStatus)],
    ["検出器状態", formatLifecycleStatus(state.detectorStatus)],
    ["顔検出", frame?.detected ? "検出あり" : "未検出"],
    ["landmarks 数", `${frame?.landmarks.length ?? 0} 点`],
    ["facialTransformationMatrix", matrixAvailable ? "取得あり" : "未取得"],
    ["blendshapes 数", `${frame?.blendshapes.length ?? 0} 件`],
    ["現在の yaw / pitch / roll", formatPose(frame?.pose ?? null)],
    ["映像サイズ", `${frame?.videoWidth ?? 0} x ${frame?.videoHeight ?? 0}`],
    ["FPS / 検出回数", `${fps.toFixed(1)} / ${state.detectCount}`],
    ["検出器エラー", state.detectorError ?? "-"],
    ["カメラエラー", state.cameraError ?? "-"],
  ])

  getElement("captureSummary").innerHTML = renderStatusItems([
    ["保存件数", `${state.captures.length} 件`],
    ["最新 bucket", state.captures[0] ? formatBucket(state.captures[0].bucket) : "-"],
    ["最後に保存できなかった理由", state.lastSkippedReason ?? "-"],
  ])

  getElement("bucketCounts").innerHTML = BUCKETS.map((bucket) => {
    const count = state.captures.filter((capture) => capture.bucket === bucket).length
    return `<div class="bucket-item"><span>${formatBucket(bucket)}</span><strong>${count}</strong></div>`
  }).join("")

  getElement("importStatus").textContent =
    [state.importMessage, state.canonicalImportMessage, state.analysisMessage]
      .filter(Boolean)
      .join(" / ") || ""

  getElement("importedSummary").innerHTML = renderStatusItems([
    ["入力ソース", state.importedCaptures.length > 0 ? state.importedFileName ?? "imported JSON" : "保存済み captures"],
    ["capture count", `${importedSummary.captureCount}`],
    ["bucket counts", formatBucketCounts(importedSummary.bucketCounts)],
    [
      "landmark count",
      `${importedSummary.landmarkCount.min ?? "-"} - ${
        importedSummary.landmarkCount.max ?? "-"
      } / expected ${EXPECTED_LANDMARK_COUNT}`,
    ],
    ["matrix available count", `${importedSummary.matrixAvailableCount}`],
    ["video size summary", importedSummary.videoSizeSummary.uniqueSizes.join(", ") || "-"],
  ])

  getElement("poseSummary").innerHTML = renderStatusItems([
    ["yaw min / max", formatRange(importedSummary.poseRange.yaw)],
    ["pitch min / max", formatRange(importedSummary.poseRange.pitch)],
    ["roll min / max", formatRange(importedSummary.poseRange.roll)],
  ])

  getElement("canonicalSummary").innerHTML = renderCanonicalSummary(
    state.analysis?.canonical468 ?? state.canonical468?.summary ?? createEmptyCanonical468Summary(),
  )
  getElement("canonicalSemanticSummary").textContent = renderCanonicalSemanticSummary(
    state.analysis?.canonical468 ?? state.canonical468?.summary ?? createEmptyCanonical468Summary(),
  )

  getElement("candidateList").innerHTML = renderCandidateList(analysis)
  getElement("stabilityRanking").innerHTML = renderStabilityRanking(analysis)
  getElement("bestCandidateSummary").innerHTML = renderBestCandidateSummary(analysis)
  getElement("analysisWarnings").textContent =
    analysis?.warnings.length ? analysis.warnings.join("\n") : "解析 warning はありません。"
  getElement("empiricalFrameWeightSummary").innerHTML =
    renderEmpiricalFrameWeightSummary(analysis)
  getElement("empiricalCanonical478Summary").innerHTML =
    renderEmpiricalCanonical478Summary(analysis)
  getElement("empiricalCandidateRanking").innerHTML = renderEmpirical478Ranking(
    analysis?.empirical478Analysis.overallStabilityRanking ?? [],
  )
  getElement("empiricalRuntimeRanking").innerHTML = renderEmpirical478Ranking(
    analysis?.empirical478Analysis.runtimeCompatibleRanking ?? [],
  )
  getElement("empiricalBucketRanking").innerHTML = renderEmpirical478BucketRanking(analysis)
  getElement("empiricalCanonical468Comparison").textContent =
    renderEmpiricalCanonical468Comparison(analysis)
  getElement("matrixSummary").innerHTML = renderMatrixSummary(analysis)
  getElement("matrixConventionComparison").innerHTML =
    renderMatrixConventionComparison(analysis)
  getElement("translationPoseComparison").innerHTML =
    renderTranslationPoseComparison(analysis)
  getElement("canonicalProjectionRanking").innerHTML =
    renderCanonicalProjectionRanking(analysis)
  getElement("canonicalBucketRanking").innerHTML =
    renderCanonicalBucketRanking(analysis)
  getElement("canonicalProjectionComparison").innerHTML =
    renderCanonicalProjectionComparison(analysis)
  getElement("analysisJsonPreview").textContent = analysis
    ? JSON.stringify(
        {
          schemaVersion: analysis.schemaVersion,
          analysisVersion: analysis.analysisVersion,
          generatedAt: analysis.generatedAt,
          sourceCaptureSummary: analysis.sourceCaptureSummary,
          translationCandidates: analysis.translationCandidates.slice(0, 3),
          poseByConvention: analysis.poseByConvention.slice(0, 3),
          stabilityRankingByConvention: analysis.stabilityRankingByConvention,
          bestStabilityTransformCandidate: analysis.bestStabilityTransformCandidate,
          selectedBestConventionCandidate: analysis.selectedBestConventionCandidate,
          canonical468: analysis.canonical468,
          selectedBestCanonicalProjectionCandidate:
            analysis.selectedBestCanonicalProjectionCandidate,
          canonicalProjectionRanking:
            analysis.canonicalProjectionAnalysis.overallRanking.slice(0, 10),
          canonicalBucketRanking: analysis.canonicalProjectionAnalysis.bucketRanking,
          empirical478Analysis: {
            status: analysis.empirical478Analysis.status,
            analysisVersion: analysis.empirical478Analysis.analysisVersion,
            frameWeightSummary: analysis.empirical478Analysis.frameWeightSummary,
            overallStabilityRanking:
              analysis.empirical478Analysis.overallStabilityRanking.slice(0, 10),
            runtimeCompatibleRanking:
              analysis.empirical478Analysis.runtimeCompatibleRanking.slice(0, 10),
            bucketRanking: analysis.empirical478Analysis.bucketRanking,
            bestOverallCandidate: analysis.empirical478Analysis.bestOverallCandidate,
            bestRuntimeCompatibleCandidate:
              analysis.empirical478Analysis.bestRuntimeCompatibleCandidate,
            empiricalCanonical478BestOverall:
              summarizeEmpiricalCanonicalForPreview(
                analysis.empirical478Analysis.empiricalCanonical478BestOverall,
              ),
            empiricalCanonical478RuntimeCompatible:
              summarizeEmpiricalCanonicalForPreview(
                analysis.empirical478Analysis.empiricalCanonical478RuntimeCompatible,
              ),
            canonical468ReferenceComparison:
              analysis.empirical478Analysis.canonical468ReferenceComparison,
            warnings: analysis.empirical478Analysis.warnings,
          },
          empiricalCanonical478: analysis.empiricalCanonical478
            ? {
                sourceTransformCandidate:
                  analysis.empiricalCanonical478.sourceTransformCandidate,
                landmarkCount: analysis.empiricalCanonical478.landmarks.length,
                summary: analysis.empiricalCanonical478.summary,
              }
            : null,
          warnings: analysis.warnings,
        },
        null,
        2,
      )
    : "解析結果はまだありません。"

  const latest = state.captures[0]
  getElement("latestCapture").textContent = latest
    ? JSON.stringify(
        {
          保存ID: latest.captureId,
          保存日時: latest.capturedAt,
          bucket: formatBucket(latest.bucket),
          姿勢: latest.pose,
          landmarks数: latest.landmarks.length,
          matrix取得: Boolean(latest.facialTransformationMatrix),
          blendshapes数: latest.blendshapes.length,
          warnings: latest.warnings,
        },
        null,
        2,
      )
    : "まだ保存されていません。"

  getElement("previewList").innerHTML =
    state.captures.length === 0
      ? `<p class="note">保存したフレームはまだありません。</p>`
      : state.captures
          .map(
            (capture) => `
              <article class="capture-card">
                ${
                  capture.previewDataUrl
                    ? `<img src="${capture.previewDataUrl}" alt="${escapeHtml(capture.captureId)}" />`
                    : ""
                }
                <dl>
                  <dt>ID</dt><dd>${escapeHtml(capture.captureId)}</dd>
                  <dt>bucket</dt><dd>${formatBucket(capture.bucket)}</dd>
                  <dt>姿勢</dt><dd>${escapeHtml(formatPose(capture.pose))}</dd>
                  <dt>点数</dt><dd>${capture.landmarks.length}</dd>
                </dl>
              </article>
            `,
          )
          .join("")

  getElement("copyStatus").textContent = state.clipboardMessage ?? ""
  captureButton.disabled = !state.latestFrame
  copyButton.disabled = state.captures.length === 0
  exportButton.disabled = state.captures.length === 0
  clearButton.disabled = state.captures.length === 0
  analyzeButton.disabled = inputCaptures.length === 0
  analyzeEmpirical478Button.disabled = inputCaptures.length === 0
  clearAnalysisButton.disabled =
    state.importedCaptures.length === 0 &&
    state.analysis === null &&
    !state.importMessage &&
    !state.canonicalImportMessage
  clearEmpirical478Button.disabled = !state.analysis
  exportAnalysisButton.disabled = !state.analysis
  copyAnalysisButton.disabled = !state.analysis
}

function renderCandidateList(analysis: AnalysisResult | null): string {
  const candidates = analysis?.transformCandidates ?? CANDIDATE_DEFINITIONS

  return `
    <table>
      <thead>
        <tr>
          <th>candidate</th>
          <th>inverse</th>
          <th>description</th>
          <th>samples</th>
        </tr>
      </thead>
      <tbody>
        ${candidates
          .map((candidate) => {
            const definition = CANDIDATE_DEFINITIONS.find(
              (item) => item.transformName === candidate.transformName,
            )
            const sampleCount =
              "perCaptureCanonicalLikeBounds" in candidate
                ? candidate.perCaptureCanonicalLikeBounds.length
                : "-"
            return `
              <tr>
                <td><code>${candidate.transformName}</code></td>
                <td>${definition?.usesInverseMatrix ? "yes" : "no"}</td>
                <td>${escapeHtml(candidate.description)}</td>
                <td>${sampleCount}</td>
              </tr>
            `
          })
          .join("")}
      </tbody>
    </table>
  `
}

function renderStabilityRanking(analysis: AnalysisResult | null): string {
  const ranking = analysis?.stabilityRanking ?? []

  if (ranking.length === 0) {
    return `<p class="note">Analyze captures を実行すると ranking が表示されます。</p>`
  }

  return `
    <table>
      <thead>
        <tr>
          <th>candidate</th>
          <th>matrixConvention</th>
          <th>translationMode</th>
          <th>avgStdDev3D</th>
          <th>avgStdDevX</th>
          <th>avgStdDevY</th>
          <th>avgStdDevZ</th>
          <th>noseStdDev</th>
          <th>zRangeStability</th>
          <th>abnormalBounds</th>
          <th>hugeWarnings</th>
          <th>score</th>
        </tr>
      </thead>
      <tbody>
        ${ranking
          .map(
            (entry) => `
              <tr>
                <td><code>${entry.transformName}</code></td>
                <td><code>${entry.matrixConvention ?? "none"}</code></td>
                <td>${entry.translationMode}</td>
                <td>${formatNullableNumber(entry.averageStdDev3D)}</td>
                <td>${formatNullableNumber(entry.averageStdDevX)}</td>
                <td>${formatNullableNumber(entry.averageStdDevY)}</td>
                <td>${formatNullableNumber(entry.averageStdDevZ)}</td>
                <td>${formatNullableNumber(entry.noseStdDev3D)}</td>
                <td>${formatNullableNumber(entry.zRangeStability)}</td>
                <td>${entry.abnormalBoundsCount}</td>
                <td>${entry.hugeValueWarningCount}</td>
                <td>${formatNullableNumber(entry.score)}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `
}

function renderBestCandidateSummary(analysis: AnalysisResult | null): string {
  if (!analysis) {
    return renderStatusItems([
      ["best candidate", "-"],
      ["empiricalCanonical478", "-"],
    ])
  }

  const empirical = analysis.empiricalCanonical478

  return renderStatusItems([
    ["best candidate", analysis.bestStabilityTransformCandidate ?? "-"],
    [
      "best convention candidate",
      analysis.selectedBestConventionCandidate
        ? `${analysis.selectedBestConventionCandidate.transformName} + ${
            analysis.selectedBestConventionCandidate.matrixConvention ?? "none"
          }`
        : "-",
    ],
    [
      "best score",
      formatNullableNumber(analysis.selectedBestConventionCandidate?.score ?? null),
    ],
    ["empiricalCanonical478 landmarks", `${empirical?.landmarks.length ?? 0}`],
    ["bounds width / height", formatBoundsSize(empirical?.summary.bounds ?? null)],
    ["zRange", formatNullableNumber(empirical?.summary.zRange ?? null)],
    [
      "semantic nose / mouth / chin z",
      [
        empirical?.summary.semanticSummary.z.noseTipZ,
        empirical?.summary.semanticSummary.z.mouthCenterZ,
        empirical?.summary.semanticSummary.z.chinZ,
      ]
        .map(formatNullableNumber)
        .join(" / "),
    ],
    ["debug artifact", empirical?.debugArtifact ? "true" : "-"],
  ])
}

function renderCanonicalSummary(summary: Canonical468Summary): string {
  return renderStatusItems([
    ["status", summary.status],
    ["source", summary.source ?? "-"],
    ["vertex count", `${summary.vertexCount} / expected ${CANONICAL_468_LANDMARK_COUNT}`],
    ["width / height / zRange", `${formatBoundsSize(summary.bounds)} / ${formatNullableNumber(summary.zRange)}`],
    ["xMin / xMax", `${formatNullableNumber(summary.bounds?.xMin)} / ${formatNullableNumber(summary.bounds?.xMax)}`],
    ["yMin / yMax", `${formatNullableNumber(summary.bounds?.yMin)} / ${formatNullableNumber(summary.bounds?.yMax)}`],
    ["zMin / zMax", `${formatNullableNumber(summary.bounds?.zMin)} / ${formatNullableNumber(summary.bounds?.zMax)}`],
    ["centroid", formatPoint(summary.centroid)],
    ["boundsCenter", formatPoint(summary.boundsCenter)],
    ["warnings", summary.warnings.join(" / ") || "-"],
  ])
}

function renderCanonicalSemanticSummary(summary: Canonical468Summary): string {
  return JSON.stringify(
    {
      semanticPoints: summary.semanticSummary.points,
      semanticZ: summary.semanticSummary.z,
      semanticIndexDebug: summary.semanticIndexDebug,
    },
    null,
    2,
  )
}

function renderCanonicalProjectionRanking(analysis: AnalysisResult | null): string {
  const ranking = analysis?.canonicalProjectionAnalysis.overallRanking ?? []

  if (ranking.length === 0) {
    return `<p class="note">Import captured JSON and canonical 468 OBJ, then run Analyze captures.</p>`
  }

  return renderCanonicalProjectionRankingTable(ranking.slice(0, 20))
}

function renderCanonicalProjectionRankingTable(
  ranking: CanonicalProjectionRankingEntry[],
): string {
  return `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>candidate</th>
          <th>matrixConvention</th>
          <th>translationMode</th>
          <th>avg 2D</th>
          <th>center weighted</th>
          <th>semantic</th>
          <th>warnings</th>
          <th>score</th>
        </tr>
      </thead>
      <tbody>
        ${ranking
          .map(
            (entry, index) => `
              <tr>
                <td>${index + 1}</td>
                <td><code>${entry.candidateName}</code></td>
                <td><code>${entry.matrixConvention}</code></td>
                <td>${entry.translationMode}</td>
                <td>${formatNullableNumber(entry.averageDistance2D)}</td>
                <td>${formatNullableNumber(entry.centerWeightedDistance)}</td>
                <td>${formatNullableNumber(entry.semanticPointErrorSummary)}</td>
                <td>${entry.warningCount}</td>
                <td>${formatNullableNumber(entry.score)}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `
}

function renderCanonicalBucketRanking(analysis: AnalysisResult | null): string {
  const bucketRanking = analysis?.canonicalProjectionAnalysis.bucketRanking

  if (!bucketRanking) {
    return `<p class="note">Bucket ranking is not available yet.</p>`
  }

  return `
    <table>
      <thead>
        <tr>
          <th>bucket</th>
          <th>best candidate</th>
          <th>matrixConvention</th>
          <th>avg 2D</th>
          <th>center weighted</th>
          <th>score</th>
          <th>samples</th>
        </tr>
      </thead>
      <tbody>
        ${STABILITY_BUCKETS.map((bucket) => {
          const best = bucketRanking[bucket]?.[0] ?? null
          return `
            <tr>
              <td><code>${bucket}</code></td>
              <td><code>${best?.candidateName ?? "-"}</code></td>
              <td><code>${best?.matrixConvention ?? "-"}</code></td>
              <td>${formatNullableNumber(best?.averageDistance2D)}</td>
              <td>${formatNullableNumber(best?.centerWeightedDistance)}</td>
              <td>${formatNullableNumber(best?.score)}</td>
              <td>${best?.sampleCount ?? 0}</td>
            </tr>
          `
        }).join("")}
      </tbody>
    </table>
  `
}

function renderCanonicalProjectionComparison(analysis: AnalysisResult | null): string {
  const results = analysis?.canonicalProjectionAnalysis.perCaptureResults ?? []

  if (results.length === 0) {
    return `<p class="note">Canonical projection comparison is not available yet.</p>`
  }

  return `
    <table>
      <thead>
        <tr>
          <th>capture</th>
          <th>bucket</th>
          <th>candidate</th>
          <th>convention</th>
          <th>translationMode</th>
          <th>avg / median / max 2D</th>
          <th>dx / dy</th>
          <th>center weighted</th>
          <th>outer / mouth+eye</th>
          <th>z avg / ratio</th>
          <th>warnings</th>
        </tr>
      </thead>
      <tbody>
        ${results
          .slice(0, 96)
          .map(
            (result) => `
              <tr>
                <td><code>${escapeHtml(result.captureId)}</code></td>
                <td><code>${result.bucket}</code></td>
                <td><code>${result.candidateName}</code></td>
                <td><code>${result.matrixConvention}</code></td>
                <td>${result.translationMode}</td>
                <td>${[
                  result.metrics.averageDistance2D,
                  result.metrics.medianDistance2D,
                  result.metrics.maxDistance2D,
                ].map(formatNullableNumber).join(" / ")}</td>
                <td>${[
                  result.metrics.averageDx,
                  result.metrics.averageDy,
                ].map(formatNullableNumber).join(" / ")}</td>
                <td>${formatNullableNumber(result.metrics.centerWeightedDistance)}</td>
                <td>${[
                  result.metrics.outerContourDistance,
                  result.metrics.mouthEyeDistance,
                ].map(formatNullableNumber).join(" / ")}</td>
                <td>${[
                  result.metrics.averageZDifference,
                  result.metrics.zRangeRatio,
                ].map(formatNullableNumber).join(" / ")}</td>
                <td>${escapeHtml(result.warnings.join(" / ") || "-")}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `
}

function renderEmpiricalFrameWeightSummary(analysis: AnalysisResult | null): string {
  const summary = analysis?.empirical478Analysis.frameWeightSummary
  if (!summary) {
    return renderStatusItems([
      ["status", "not analyzed"],
      ["note", "Run Analyze empirical 478."],
    ])
  }

  return renderStatusItems([
    ["input / usable / excluded", `${summary.inputFrameCount} / ${summary.usableFrameCount} / ${summary.excludedFrameCount}`],
    ["total weight", formatNullableNumber(summary.totalWeight)],
    ["average weight", formatNullableNumber(summary.averageWeight)],
    ["bucket counts", formatStabilityBucketCounts(summary.bucketCounts)],
    ["bucket weights", formatStabilityBucketCounts(summary.bucketWeightTotals)],
    ["warnings", summary.warnings.join(" / ") || "-"],
  ])
}

function renderEmpiricalCanonical478Summary(analysis: AnalysisResult | null): string {
  const empirical = analysis?.empirical478Analysis
  if (!empirical) {
    return renderStatusItems([
      ["best overall", "-"],
      ["best runtime-compatible", "-"],
    ])
  }
  const bestOverall = empirical.empiricalCanonical478BestOverall
  const bestRuntime = empirical.empiricalCanonical478RuntimeCompatible

  return renderStatusItems([
    ["best overall", formatEmpiricalRankingEntry(empirical.bestOverallCandidate)],
    ["best runtime-compatible", formatEmpiricalRankingEntry(empirical.bestRuntimeCompatibleCandidate)],
    ["overall landmarks", `${bestOverall?.landmarks.length ?? 0}`],
    ["runtime landmarks", `${bestRuntime?.landmarks.length ?? 0}`],
    ["overall bounds", formatBoundsSize(bestOverall?.summary.bounds ?? null)],
    ["runtime bounds", formatBoundsSize(bestRuntime?.summary.bounds ?? null)],
    ["overall zRange", formatNullableNumber(bestOverall?.summary.zRange ?? null)],
    ["runtime zRange", formatNullableNumber(bestRuntime?.summary.zRange ?? null)],
    ["debug artifact", "true; not production-ready"],
  ])
}

function renderEmpirical478Ranking(ranking: Empirical478RankingEntry[]): string {
  if (ranking.length === 0) {
    return `<p class="note">Run Analyze empirical 478 to compute stability ranking.</p>`
  }

  return `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>candidate</th>
          <th>inputSpace</th>
          <th>normalization</th>
          <th>matrixConvention</th>
          <th>avgStdDev3D</th>
          <th>semantic</th>
          <th>unstable</th>
          <th>warnings</th>
          <th>score</th>
        </tr>
      </thead>
      <tbody>
        ${ranking
          .slice(0, 20)
          .map(
            (entry, index) => `
              <tr>
                <td>${index + 1}</td>
                <td><code>${entry.candidateName}</code></td>
                <td><code>${entry.inputSpace}</code></td>
                <td><code>${entry.normalization}</code></td>
                <td><code>${entry.matrixConvention ?? "none"}</code></td>
                <td>${formatNullableNumber(entry.averageStdDev3D)}</td>
                <td>${formatNullableNumber(entry.semanticAverageStdDev3D)}</td>
                <td>${entry.unstableLandmarkCount}</td>
                <td>${entry.warningCount}</td>
                <td>${formatNullableNumber(entry.score)}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `
}

function renderEmpirical478BucketRanking(analysis: AnalysisResult | null): string {
  const bucketRanking = analysis?.empirical478Analysis.bucketRanking
  if (!bucketRanking) {
    return `<p class="note">Bucket ranking is not available yet.</p>`
  }

  return `
    <table>
      <thead>
        <tr>
          <th>bucket</th>
          <th>best candidate</th>
          <th>inputSpace</th>
          <th>normalization</th>
          <th>avgStdDev3D</th>
          <th>score</th>
        </tr>
      </thead>
      <tbody>
        ${STABILITY_BUCKETS.map((bucket) => {
          const best = bucketRanking[bucket]?.[0] ?? null
          return `
            <tr>
              <td><code>${bucket}</code></td>
              <td><code>${best?.candidateName ?? "-"}</code></td>
              <td><code>${best?.inputSpace ?? "-"}</code></td>
              <td><code>${best?.normalization ?? "-"}</code></td>
              <td>${formatNullableNumber(best?.averageStdDev3D ?? null)}</td>
              <td>${formatNullableNumber(best?.score ?? null)}</td>
            </tr>
          `
        }).join("")}
      </tbody>
    </table>
  `
}

function renderEmpiricalCanonical468Comparison(analysis: AnalysisResult | null): string {
  const comparison = analysis?.empirical478Analysis.canonical468ReferenceComparison
  if (!comparison) {
    return "canonical468 is reference only. Import canonical 468 OBJ to show optional comparison."
  }
  return JSON.stringify(comparison, null, 2)
}

function summarizeEmpiricalCanonicalForPreview(
  empirical: EmpiricalCanonical478 | null,
): unknown {
  if (!empirical) {
    return null
  }
  return {
    sourceCandidate: empirical.sourceCandidate,
    landmarkCount: empirical.landmarks.length,
    firstLandmarks: empirical.landmarks.slice(0, 5),
    summary: empirical.summary,
  }
}

function renderMatrixSummary(analysis: AnalysisResult | null): string {
  const matrixSummaries = analysis?.matrixSummaries.slice(0, 8) ?? []

  if (matrixSummaries.length === 0) {
    return `<p class="note">Analyze captures を実行すると matrix summary が表示されます。</p>`
  }

  return `
    <table>
      <thead>
        <tr>
          <th>capture</th>
          <th>ordering</th>
          <th>translation</th>
          <th>raw lastRow</th>
          <th>raw lastColumn</th>
          <th>scale</th>
          <th>determinant</th>
          <th>matrix yaw / pitch / roll</th>
          <th>pose delta</th>
        </tr>
      </thead>
      <tbody>
        ${matrixSummaries
          .map(
            (matrix) => `
              <tr>
                <td><code>${escapeHtml(matrix.captureId)}</code></td>
                <td>${matrix.assumption.ordering}<br /><small>${matrix.assumption.indexFormula}</small></td>
                <td>${formatPoint(matrix.translation)}</td>
                <td>${formatPoint(matrix.rawTranslationCandidates.lastRow)}</td>
                <td>${formatPoint(matrix.rawTranslationCandidates.lastColumn)}</td>
                <td>${formatNullableNumber(matrix.approximateScale)}</td>
                <td>${formatNullableNumber(matrix.determinant)}</td>
                <td>${escapeHtml(formatPose(matrix.extractedPose))}</td>
                <td>${escapeHtml(formatPose(matrix.poseDelta))}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `
}

function renderMatrixConventionComparison(analysis: AnalysisResult | null): string {
  const rows =
    analysis?.matrixConventionAnalysis.flatMap((matrix) =>
      matrix.conventionComparison.map((convention) => ({
        captureId: matrix.captureId,
        ...convention,
      })),
    ) ?? []

  if (rows.length === 0) {
    return `<p class="note">Analyze captures を実行すると matrix convention comparison が表示されます。</p>`
  }

  return `
    <table>
      <thead>
        <tr>
          <th>capture</th>
          <th>convention</th>
          <th>translationMode</th>
          <th>interpretedTranslation</th>
          <th>scale</th>
          <th>determinant</th>
          <th>forward error</th>
          <th>warnings</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .slice(0, 32)
          .map(
            (row) => `
              <tr>
                <td><code>${escapeHtml(row.captureId)}</code></td>
                <td><code>${row.matrixConvention}</code></td>
                <td>${row.translationMode}</td>
                <td>${formatPoint(row.interpretedTranslation)}</td>
                <td>${formatNullableNumber(row.approximateScale)}</td>
                <td>${formatNullableNumber(row.determinant)}</td>
                <td>${formatNullableNumber(row.forwardProjectionApproximation.averageError3D)}</td>
                <td>${escapeHtml(row.warnings.join(" / ") || "-")}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `
}

function renderTranslationPoseComparison(analysis: AnalysisResult | null): string {
  const rows =
    analysis?.matrixConventionAnalysis.flatMap((matrix) =>
      MATRIX_CONVENTIONS.map((convention) => ({
        captureId: matrix.captureId,
        convention: convention.name,
        lastRow: matrix.rawTranslationCandidates.lastRow,
        lastColumn: matrix.rawTranslationCandidates.lastColumn,
        interpretedTranslation: matrix.interpretedTranslationByConvention[convention.name],
        pose: matrix.poseByConvention[convention.name],
        enginePoseConvention: matrix.enginePoseConvention,
        labPoseConvention: matrix.labPoseConvention,
      })),
    ) ?? []

  if (rows.length === 0) {
    return `<p class="note">Analyze captures を実行すると translation / pose comparison が表示されます。</p>`
  }

  return `
    <table>
      <thead>
        <tr>
          <th>capture</th>
          <th>convention</th>
          <th>raw lastRow [12..14]</th>
          <th>raw lastColumn [3,7,11]</th>
          <th>interpretedTranslation</th>
          <th>pose delta</th>
          <th>engine / lab pose convention</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .slice(0, 32)
          .map(
            (row) => `
              <tr>
                <td><code>${escapeHtml(row.captureId)}</code></td>
                <td><code>${row.convention}</code></td>
                <td>${formatPoint(row.lastRow)}</td>
                <td>${formatPoint(row.lastColumn)}</td>
                <td>${formatPoint(row.interpretedTranslation)}</td>
                <td>${escapeHtml(formatPose(row.pose?.poseDelta ?? null))}</td>
                <td><code>${row.enginePoseConvention}</code> / <code>${row.labPoseConvention}</code></td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
    <p class="note">Note: pose が一致しても point transform convention が正しいとは限りません。forward projection は approximate only です。</p>
  `
}

function drawOverlay(landmarks: NormalizedLandmark[]): void {
  const rect = overlay.getBoundingClientRect()
  const width = Math.max(1, Math.floor(rect.width))
  const height = Math.max(1, Math.floor(rect.height))

  if (overlay.width !== width || overlay.height !== height) {
    overlay.width = width
    overlay.height = height
  }

  const ctx = overlay.getContext("2d")
  if (!ctx) {
    return
  }

  ctx.clearRect(0, 0, width, height)
  if (landmarks.length === 0 || video.videoWidth === 0 || video.videoHeight === 0) {
    return
  }

  const videoAspect = video.videoWidth / video.videoHeight
  const canvasAspect = width / height
  const drawWidth = canvasAspect > videoAspect ? height * videoAspect : width
  const drawHeight = canvasAspect > videoAspect ? height : width / videoAspect
  const offsetX = (width - drawWidth) / 2
  const offsetY = (height - drawHeight) / 2

  ctx.fillStyle = "rgba(82, 218, 173, 0.9)"
  for (const point of landmarks) {
    ctx.beginPath()
    ctx.arc(offsetX + point.x * drawWidth, offsetY + point.y * drawHeight, 1.2, 0, Math.PI * 2)
    ctx.fill()
  }
}

function createPreviewDataUrl(): string | null {
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    return null
  }

  const canvas = document.createElement("canvas")
  const targetWidth = 320
  const targetHeight = Math.round((targetWidth / video.videoWidth) * video.videoHeight)
  canvas.width = targetWidth
  canvas.height = targetHeight

  const ctx = canvas.getContext("2d")
  if (!ctx) {
    return null
  }

  ctx.drawImage(video, 0, 0, targetWidth, targetHeight)
  return canvas.toDataURL("image/jpeg", 0.72)
}

function captureMatrix(matrix: Matrix): MatrixCapture {
  return {
    rows: matrix.rows,
    columns: matrix.columns,
    values: Array.from(matrix.data),
    metadata: {
      source: "MediaPipe FaceLandmarker facialTransformationMatrixes[0].data",
      ordering: "row-major",
      indexFormula: "values[row * columns + column]",
      maps: "MediaPipe canonical face to detected face",
    },
  }
}

function estimateFacePoseFromMatrixObject(matrix: Matrix | null): Pose | null {
  if (
    !matrix ||
    matrix.rows < 3 ||
    matrix.columns < 3 ||
    matrix.data.length < matrix.columns * 3
  ) {
    return null
  }

  return estimateFacePoseFromMatrixValues(Array.from(matrix.data), matrix.columns)
}

function estimateFacePoseFromMatrixValues(values: number[], columns: number): Pose | null {
  if (values.length < columns * 3) {
    return null
  }

  const m00 = values[0 * columns + 0]
  const m10 = values[1 * columns + 0]
  const m20 = values[2 * columns + 0]
  const m21 = values[2 * columns + 1]
  const m22 = values[2 * columns + 2]

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

function classifyBucket(pose: Pose | null): CaptureBucket {
  if (!pose) {
    return "unknown"
  }

  const yawAbs = Math.abs(pose.yaw)
  const pitchAbs = Math.abs(pose.pitch)

  if (yawAbs >= 15 && pitchAbs >= 10) {
    return "mixedPose"
  }

  if (pitchAbs >= 10 && yawAbs < 15) {
    return pose.pitch >= 0 ? "pitchPositive" : "pitchNegative"
  }

  if (yawAbs < 8 && pitchAbs < 8) {
    return "front"
  }

  if (pose.yaw >= 0) {
    if (yawAbs < 15) {
      return "yawPositiveSmall"
    }
    if (yawAbs < 30) {
      return "yawPositiveMid"
    }
    return "yawPositiveStrong"
  }

  if (yawAbs < 15) {
    return "yawNegativeSmall"
  }
  if (yawAbs < 30) {
    return "yawNegativeMid"
  }
  return "yawNegativeStrong"
}

function parseCapturesPayload(payload: unknown): CapturesPayload {
  if (!isRecord(payload)) {
    throw new Error("JSON root が object ではありません。")
  }

  if (payload.schemaVersion !== "mediapipe_canonical_lab_captures_v1") {
    throw new Error("schemaVersion が mediapipe_canonical_lab_captures_v1 ではありません。")
  }

  if (!Array.isArray(payload.captures)) {
    throw new Error("captures が配列ではありません。")
  }

  return {
    schemaVersion: "mediapipe_canonical_lab_captures_v1",
    createdAt: typeof payload.createdAt === "string" ? payload.createdAt : "",
    tool: isRecord(payload.tool)
      ? {
          name: String(payload.tool.name ?? ""),
          version: String(payload.tool.version ?? ""),
        }
      : undefined,
    source: isRecord(payload.source)
      ? {
          detector: String(payload.source.detector ?? ""),
          landmarkCount: Number(payload.source.landmarkCount ?? EXPECTED_LANDMARK_COUNT),
        }
      : undefined,
    summary: undefined,
    captures: payload.captures.map(parseCaptureRecord),
  }
}

function parseCaptureRecord(value: unknown, fallbackIndex: number): CaptureRecord {
  if (!isRecord(value)) {
    throw new Error(`captures[${fallbackIndex}] が object ではありません。`)
  }

  const landmarksValue = value.landmarks
  if (!Array.isArray(landmarksValue)) {
    throw new Error(`captures[${fallbackIndex}].landmarks が配列ではありません。`)
  }

  return {
    captureId: typeof value.captureId === "string" ? value.captureId : `imported_${fallbackIndex}`,
    capturedAt: typeof value.capturedAt === "string" ? value.capturedAt : "",
    videoTime: toNumber(value.videoTime),
    videoWidth: toNumber(value.videoWidth),
    videoHeight: toNumber(value.videoHeight),
    pose: parsePose(value.pose),
    landmarks: landmarksValue.map(parseLandmarkPoint).filter(Boolean),
    facialTransformationMatrix: parseMatrixCapture(value.facialTransformationMatrix),
    blendshapes: Array.isArray(value.blendshapes)
      ? value.blendshapes.map(parseBlendshape).filter(Boolean)
      : [],
    bucket: parseBucket(value.bucket),
    notes: Array.isArray(value.notes) ? value.notes.map(String) : [],
    warnings: Array.isArray(value.warnings) ? value.warnings.map(String) : [],
    previewDataUrl: typeof value.previewDataUrl === "string" ? value.previewDataUrl : null,
  }
}

function parseLandmarkPoint(value: unknown, fallbackIndex: number): LandmarkPoint {
  if (!isRecord(value)) {
    return { index: fallbackIndex, x: 0, y: 0, z: 0 }
  }

  return {
    index: Number.isInteger(value.index) ? Number(value.index) : fallbackIndex,
    x: toNumber(value.x),
    y: toNumber(value.y),
    z: toNumber(value.z),
  }
}

function parsePose(value: unknown): Pose | null {
  if (!isRecord(value)) {
    return null
  }

  return {
    yaw: toNumber(value.yaw),
    pitch: toNumber(value.pitch),
    roll: toNumber(value.roll),
  }
}

function parseBlendshape(value: unknown): BlendshapeCapture {
  if (!isRecord(value)) {
    return { categoryName: "", score: 0 }
  }

  return {
    categoryName: String(value.categoryName ?? ""),
    score: toNumber(value.score),
  }
}

function parseMatrixCapture(value: unknown): MatrixCapture | null {
  if (!isRecord(value) || !Array.isArray(value.values)) {
    return null
  }

  return {
    rows: toNumber(value.rows),
    columns: toNumber(value.columns),
    values: value.values.map(toNumber),
    metadata: {
      source: "MediaPipe FaceLandmarker facialTransformationMatrixes[0].data",
      ordering: "row-major",
      indexFormula: "values[row * columns + column]",
      maps: "MediaPipe canonical face to detected face",
    },
  }
}

function parseBucket(value: unknown): CaptureBucket {
  return BUCKETS.includes(value as CaptureBucket) ? (value as CaptureBucket) : "unknown"
}

function getAnalysisInputCaptures(): CaptureRecord[] {
  return state.importedCaptures.length > 0 ? state.importedCaptures : state.captures
}

function getMatrixValues4x4(matrix: MatrixCapture | null): number[] | null {
  if (!matrix || matrix.rows !== 4 || matrix.columns !== 4 || matrix.values.length < 16) {
    return null
  }

  return matrix.values.slice(0, 16)
}

function getMatrixConvention(name: MatrixConventionName): MatrixConventionDefinition {
  return MATRIX_CONVENTIONS.find((convention) => convention.name === name) ?? MATRIX_CONVENTIONS[0]
}

function getConventionMatrix(
  rawValues: number[],
  convention: MatrixConventionDefinition,
): number[] {
  const values = rawValues.slice(0, 16)
  if (convention.rawOrdering === "row-major") {
    return values
  }

  return transposeMatrix4(values)
}

function getColumnVectorEquivalentMatrix(
  matrix: number[],
  convention: MatrixConventionDefinition,
): number[] {
  return convention.vectorConvention === "column-vector" ? matrix : transposeMatrix4(matrix)
}

function transposeMatrix4(matrix: number[]): number[] {
  return Array.from({ length: 16 }, (_, index) => {
    const row = Math.floor(index / 4)
    const column = index % 4
    return matrix[column * 4 + row]
  })
}

function getRawTranslationCandidates(rawValues: number[] | null): {
  lastRow: Point3 | null
  lastColumn: Point3 | null
} {
  if (!rawValues || rawValues.length < 15) {
    return {
      lastRow: null,
      lastColumn: null,
    }
  }

  return {
    lastRow: {
      x: rawValues[12],
      y: rawValues[13],
      z: rawValues[14],
    },
    lastColumn: {
      x: rawValues[3],
      y: rawValues[7],
      z: rawValues[11],
    },
  }
}

function getInterpretedTranslation(
  matrix: number[],
  convention: MatrixConventionDefinition,
): Point3 | null {
  if (matrix.length < 15) {
    return null
  }

  if (convention.translationMode === "lastRow") {
    return {
      x: matrix[12],
      y: matrix[13],
      z: matrix[14],
    }
  }

  if (convention.translationMode === "lastColumn") {
    return {
      x: matrix[3],
      y: matrix[7],
      z: matrix[11],
    }
  }

  return null
}

function getRotationAxesForColumnEquivalent(matrix: number[]): {
  xAxis: Point3
  yAxis: Point3
  zAxis: Point3
} {
  return {
    xAxis: { x: matrix[0], y: matrix[4], z: matrix[8] },
    yAxis: { x: matrix[1], y: matrix[5], z: matrix[9] },
    zAxis: { x: matrix[2], y: matrix[6], z: matrix[10] },
  }
}

function applyMatrixByConvention(
  matrix: number[],
  point: Point3,
  convention: MatrixConventionDefinition,
): Point3 {
  return convention.vectorConvention === "column-vector"
    ? applyMatrix4ColumnVector(matrix, point)
    : applyMatrix4RowVector(matrix, point)
}

function applyMatrix4ColumnVector(matrix: number[], point: Point3): Point3 {
  const x = matrix[0] * point.x + matrix[1] * point.y + matrix[2] * point.z + matrix[3]
  const y = matrix[4] * point.x + matrix[5] * point.y + matrix[6] * point.z + matrix[7]
  const z = matrix[8] * point.x + matrix[9] * point.y + matrix[10] * point.z + matrix[11]
  const w = matrix[12] * point.x + matrix[13] * point.y + matrix[14] * point.z + matrix[15]

  if (Number.isFinite(w) && Math.abs(w) > EPSILON && Math.abs(w - 1) > EPSILON) {
    return {
      x: x / w,
      y: y / w,
      z: z / w,
    }
  }

  return { x, y, z }
}

function applyMatrix4RowVector(matrix: number[], point: Point3): Point3 {
  const x = point.x * matrix[0] + point.y * matrix[4] + point.z * matrix[8] + matrix[12]
  const y = point.x * matrix[1] + point.y * matrix[5] + point.z * matrix[9] + matrix[13]
  const z = point.x * matrix[2] + point.y * matrix[6] + point.z * matrix[10] + matrix[14]
  const w = point.x * matrix[3] + point.y * matrix[7] + point.z * matrix[11] + matrix[15]

  if (Number.isFinite(w) && Math.abs(w) > EPSILON && Math.abs(w - 1) > EPSILON) {
    return {
      x: x / w,
      y: y / w,
      z: z / w,
    }
  }

  return { x, y, z }
}

function invertMatrix(matrix: number[], size: number): number[] | null {
  const augmented = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size * 2 }, (_, column) => {
      if (column < size) {
        return matrix[row * size + column]
      }
      return column - size === row ? 1 : 0
    }),
  )

  for (let pivot = 0; pivot < size; pivot += 1) {
    let pivotRow = pivot
    for (let row = pivot + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][pivot]) > Math.abs(augmented[pivotRow][pivot])) {
        pivotRow = row
      }
    }

    if (Math.abs(augmented[pivotRow][pivot]) < EPSILON) {
      return null
    }

    if (pivotRow !== pivot) {
      const current = augmented[pivot]
      augmented[pivot] = augmented[pivotRow]
      augmented[pivotRow] = current
    }

    const pivotValue = augmented[pivot][pivot]
    for (let column = 0; column < size * 2; column += 1) {
      augmented[pivot][column] /= pivotValue
    }

    for (let row = 0; row < size; row += 1) {
      if (row === pivot) {
        continue
      }
      const factor = augmented[row][pivot]
      for (let column = 0; column < size * 2; column += 1) {
        augmented[row][column] -= factor * augmented[pivot][column]
      }
    }
  }

  return augmented.flatMap((row) => row.slice(size))
}

function determinant3x3(matrix: number[]): number {
  const a = matrix[0]
  const b = matrix[1]
  const c = matrix[2]
  const d = matrix[4]
  const e = matrix[5]
  const f = matrix[6]
  const g = matrix[8]
  const h = matrix[9]
  const i = matrix[10]

  return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g)
}

function calculateBounds(points: Point3[]): BoundsSummary | null {
  const first = points[0]
  if (!first) {
    return null
  }

  const raw = points.reduce(
    (bounds, point) => ({
      xMin: Math.min(bounds.xMin, point.x),
      xMax: Math.max(bounds.xMax, point.x),
      yMin: Math.min(bounds.yMin, point.y),
      yMax: Math.max(bounds.yMax, point.y),
      zMin: Math.min(bounds.zMin, point.z),
      zMax: Math.max(bounds.zMax, point.z),
    }),
    {
      xMin: first.x,
      xMax: first.x,
      yMin: first.y,
      yMax: first.y,
      zMin: first.z,
      zMax: first.z,
    },
  )

  const width = raw.xMax - raw.xMin
  const height = raw.yMax - raw.yMin

  return {
    ...raw,
    width,
    height,
    zRange: raw.zMax - raw.zMin,
    aspectRatio: height === 0 ? null : width / height,
  }
}

function calculateBoundsCenter(bounds: BoundsSummary): Point3 {
  return {
    x: (bounds.xMin + bounds.xMax) / 2,
    y: (bounds.yMin + bounds.yMax) / 2,
    z: (bounds.zMin + bounds.zMax) / 2,
  }
}

function calculateCentroid(points: Point3[]): Point3 | null {
  return averagePoints(points)
}

function averageBounds(boundsItems: BoundsSummary[]): BoundsSummary | null {
  if (boundsItems.length === 0) {
    return null
  }

  return {
    xMin: averageNumber(boundsItems.map((bounds) => bounds.xMin)) ?? 0,
    xMax: averageNumber(boundsItems.map((bounds) => bounds.xMax)) ?? 0,
    width: averageNumber(boundsItems.map((bounds) => bounds.width)) ?? 0,
    yMin: averageNumber(boundsItems.map((bounds) => bounds.yMin)) ?? 0,
    yMax: averageNumber(boundsItems.map((bounds) => bounds.yMax)) ?? 0,
    height: averageNumber(boundsItems.map((bounds) => bounds.height)) ?? 0,
    zMin: averageNumber(boundsItems.map((bounds) => bounds.zMin)) ?? 0,
    zMax: averageNumber(boundsItems.map((bounds) => bounds.zMax)) ?? 0,
    zRange: averageNumber(boundsItems.map((bounds) => bounds.zRange)) ?? 0,
    aspectRatio: averageNumber(
      boundsItems
        .map((bounds) => bounds.aspectRatio)
        .filter((value): value is number => value !== null),
    ),
  }
}

function getSemanticPoints(points: Point3[]): SemanticPoints {
  const leftEyeCenter =
    averageByIndices(points, LEFT_IRIS_INDICES) ?? averageByIndices(points, LEFT_EYE_INDICES)
  const rightEyeCenter =
    averageByIndices(points, RIGHT_IRIS_INDICES) ?? averageByIndices(points, RIGHT_EYE_INDICES)

  return {
    noseTip: getPointByIndex(points, NOSE_TIP_INDEX),
    eyeCenter:
      leftEyeCenter && rightEyeCenter ? averagePoints([leftEyeCenter, rightEyeCenter]) : null,
    mouthCenter: averageByIndices(points, MOUTH_CENTER_INDICES),
    chin: getPointByIndex(points, CHIN_INDEX),
    leftCheek: getPointByIndex(points, LEFT_CHEEK_INDEX),
    rightCheek: getPointByIndex(points, RIGHT_CHEEK_INDEX),
    leftContour: getPointByIndex(points, LEFT_CONTOUR_INDEX),
    rightContour: getPointByIndex(points, RIGHT_CONTOUR_INDEX),
  }
}

function getZSemanticSummary(points: SemanticPoints): SemanticSummary["z"] {
  return {
    noseTipZ: points.noseTip?.z ?? null,
    eyeCenterZ: points.eyeCenter?.z ?? null,
    mouthCenterZ: points.mouthCenter?.z ?? null,
    chinZ: points.chin?.z ?? null,
    cheekDepthDelta:
      points.leftCheek && points.rightCheek ? points.leftCheek.z - points.rightCheek.z : null,
    contourDepthDelta:
      points.leftContour && points.rightContour
        ? points.leftContour.z - points.rightContour.z
        : null,
  }
}

function averageByIndices(points: Point3[], indices: number[]): Point3 | null {
  const indexedPoints = indices
    .map((index) => getPointByIndex(points, index))
    .filter((point): point is Point3 => Boolean(point))

  if (indexedPoints.length !== indices.length) {
    return null
  }

  return averagePoints(indexedPoints)
}

function getPointByIndex(points: Point3[], index: number): Point3 | null {
  const point = (points as LandmarkPoint[]).find((item) => item.index === index)
  return point ? { x: point.x, y: point.y, z: point.z } : null
}

function averagePoints(points: Point3[]): Point3 | null {
  if (points.length === 0) {
    return null
  }

  return {
    x: sum(points.map((point) => point.x)) / points.length,
    y: sum(points.map((point) => point.y)) / points.length,
    z: sum(points.map((point) => point.z)) / points.length,
  }
}

function calculatePointStability(points: Array<Point3 | null>): PointStability {
  const validPoints = points.filter((point): point is Point3 => Boolean(point))
  const mean = averagePoints(validPoints)

  if (!mean) {
    return {
      mean: null,
      stdDevX: null,
      stdDevY: null,
      stdDevZ: null,
      stdDev3D: null,
      sampleCount: 0,
    }
  }

  const stdDevX = standardDeviation(validPoints.map((point) => point.x)) ?? 0
  const stdDevY = standardDeviation(validPoints.map((point) => point.y)) ?? 0
  const stdDevZ = standardDeviation(validPoints.map((point) => point.z)) ?? 0

  return {
    mean,
    stdDevX,
    stdDevY,
    stdDevZ,
    stdDev3D: Math.hypot(stdDevX, stdDevY, stdDevZ),
    sampleCount: validPoints.length,
  }
}

function countBuckets(captures: CaptureRecord[]): Record<CaptureBucket, number> {
  return BUCKETS.reduce(
    (counts, bucket) => {
      counts[bucket] = captures.filter((capture) => capture.bucket === bucket).length
      return counts
    },
    {} as Record<CaptureBucket, number>,
  )
}

function toStabilityBucket(bucket: CaptureBucket): StabilityBucket {
  if (bucket.startsWith("yawPositive")) {
    return "yawPositive"
  }
  if (bucket.startsWith("yawNegative")) {
    return "yawNegative"
  }
  if (bucket === "front" || bucket === "pitchPositive" || bucket === "pitchNegative" || bucket === "mixedPose") {
    return bucket
  }
  return "unknown"
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

function downloadJson(payload: unknown, fileName: string): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  link.click()
  URL.revokeObjectURL(link.href)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : Number(value) || 0
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

function averageNumber(values: number[]): number | null {
  const validValues = values.filter((value) => Number.isFinite(value))
  return validValues.length === 0 ? null : sum(validValues) / validValues.length
}

function roundDebugNumber(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value
}

function roundNullable(value: number | null): number | null {
  return value === null ? null : roundDebugNumber(value)
}

function roundPoint(point: Point3): Point3 {
  return {
    x: roundDebugNumber(point.x),
    y: roundDebugNumber(point.y),
    z: roundDebugNumber(point.z),
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function standardDeviation(values: number[]): number | null {
  const mean = averageNumber(values)
  if (mean === null) {
    return null
  }

  return Math.sqrt(
    sum(values.map((value) => (value - mean) ** 2)) / Math.max(values.length, 1),
  )
}

function minOrNull(values: number[]): number | null {
  const validValues = values.filter((value) => Number.isFinite(value))
  return validValues.length === 0 ? null : Math.min(...validValues)
}

function maxOrNull(values: number[]): number | null {
  const validValues = values.filter((value) => Number.isFinite(value))
  return validValues.length === 0 ? null : Math.max(...validValues)
}

function medianNumber(values: number[]): number | null {
  const validValues = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b)
  if (validValues.length === 0) {
    return null
  }

  const mid = Math.floor(validValues.length / 2)
  return validValues.length % 2 === 0
    ? (validValues[mid - 1] + validValues[mid]) / 2
    : validValues[mid]
}

function safeDivide(numerator: number, denominator: number): number {
  return Math.abs(denominator) <= EPSILON ? Number.NaN : numerator / denominator
}

function safeFiniteDivide(numerator: number, denominator: number): number | null {
  if (Math.abs(denominator) <= EPSILON) {
    return null
  }
  const value = numerator / denominator
  return Number.isFinite(value) ? roundDebugNumber(value) : null
}

function vectorLength(point: Point3): number {
  return Math.hypot(point.x, point.y, point.z)
}

function calculateDistance(current: Point3, next: Point3): number {
  return Math.hypot(current.x - next.x, current.y - next.y, current.z - next.z)
}

function calculateDistance2D(current: Point3, next: Point3): number {
  return Math.hypot(current.x - next.x, current.y - next.y)
}

function calculateOptionalDistance2D(current: Point3 | null, next: Point3 | null): number | null {
  return current && next ? calculateDistance2D(current, next) : null
}

function calculateOptionalDistance3D(current: Point3 | null, next: Point3 | null): number | null {
  return current && next ? roundDebugNumber(calculateDistance(current, next)) : null
}

function calculateZDifferenceByPoint(
  projected: LandmarkPoint[],
  current: LandmarkPoint[],
  index: number,
): number | null {
  const projectedPoint = getPointByIndex(projected, index)
  const currentPoint = getPointByIndex(current, index)
  return projectedPoint && currentPoint ? projectedPoint.z - currentPoint.z : null
}

function calculateCheekZDifference(
  projected: LandmarkPoint[],
  current: LandmarkPoint[],
): number | null {
  const left = calculateZDifferenceByPoint(projected, current, LEFT_CHEEK_INDEX)
  const right = calculateZDifferenceByPoint(projected, current, RIGHT_CHEEK_INDEX)
  return averageNumber([left, right].filter((value): value is number => value !== null))
}

function averageSemanticError(summary: SemanticPointErrorSummary): number | null {
  return averageNumber(
    [
      summary.noseTip,
      summary.eyeCenter,
      summary.mouthCenter,
      summary.chin,
      summary.cheek,
    ].filter((value): value is number => value !== null),
  )
}

function isFinitePoint(point: Point3): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z)
}

function hasAbnormalBounds(bounds: BoundsSummary | null): boolean {
  if (!bounds) {
    return false
  }

  return (
    !Number.isFinite(bounds.width) ||
    !Number.isFinite(bounds.height) ||
    !Number.isFinite(bounds.zRange) ||
    bounds.width > HUGE_BOUNDS_THRESHOLD ||
    bounds.height > HUGE_BOUNDS_THRESHOLD ||
    bounds.zRange > HUGE_BOUNDS_THRESHOLD
  )
}

function isHugeValueWarning(warning: string): boolean {
  return (
    warning.includes("inverseResultHugeBounds") ||
    warning.includes("matrixConventionLikelyWrong") ||
    warning.includes("translationInterpretationSuspicious")
  )
}

function calculateCandidateScore(
  averageStdDev3D: number | null,
  abnormalBoundsCount: number,
  hugeValueWarningCount: number,
): number | null {
  if (averageStdDev3D === null || !Number.isFinite(averageStdDev3D)) {
    return null
  }

  return averageStdDev3D + abnormalBoundsCount * 100 + hugeValueWarningCount * 10
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function formatPose(pose: Pose | null): string {
  if (!pose) {
    return "-"
  }

  return `yaw ${pose.yaw.toFixed(2)} / pitch ${pose.pitch.toFixed(2)} / roll ${pose.roll.toFixed(2)}`
}

function formatLifecycleStatus(status: AppState["cameraStatus"] | AppState["detectorStatus"]): string {
  switch (status) {
    case "idle":
      return "待機中"
    case "starting":
      return "起動中"
    case "running":
      return "起動済み"
    case "initializing":
      return "初期化中"
    case "ready":
      return "準備完了"
    case "error":
      return "エラー"
  }
}

function formatBucket(bucket: CaptureBucket): string {
  switch (bucket) {
    case "front":
      return "front（正面）"
    case "yawPositiveSmall":
      return "yawPositiveSmall（横向き 小）"
    case "yawPositiveMid":
      return "yawPositiveMid（横向き 中）"
    case "yawPositiveStrong":
      return "yawPositiveStrong（横向き 大）"
    case "yawNegativeSmall":
      return "yawNegativeSmall（反対向き 小）"
    case "yawNegativeMid":
      return "yawNegativeMid（反対向き 中）"
    case "yawNegativeStrong":
      return "yawNegativeStrong（反対向き 大）"
    case "pitchPositive":
      return "pitchPositive（上下向き +）"
    case "pitchNegative":
      return "pitchNegative（上下向き -）"
    case "mixedPose":
      return "mixedPose（横向き + 上下向き）"
    case "unknown":
      return "unknown（判定不可）"
  }
}

function formatBucketCounts(counts: Record<CaptureBucket, number>): string {
  return BUCKETS.map((bucket) => `${bucket}: ${counts[bucket] ?? 0}`).join(" / ")
}

function formatStabilityBucketCounts(counts: Record<StabilityBucket, number>): string {
  return STABILITY_BUCKETS.map((bucket) => `${bucket}: ${formatNullableNumber(counts[bucket])}`)
    .join(" / ")
}

function formatEmpiricalRankingEntry(entry: Empirical478RankingEntry | null): string {
  if (!entry) {
    return "-"
  }
  return `${entry.candidateName} / ${entry.inputSpace} / ${entry.normalization} / score ${formatNullableNumber(entry.score)}`
}

function formatRange(range: RangeSummary): string {
  return `${formatNullableNumber(range.min)} / ${formatNullableNumber(range.max)}`
}

function formatNullableNumber(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(6) : "-"
}

function formatPoint(point: Point3 | null): string {
  if (!point) {
    return "-"
  }

  return `${formatNullableNumber(point.x)}, ${formatNullableNumber(point.y)}, ${formatNullableNumber(point.z)}`
}

function formatBoundsSize(bounds: BoundsSummary | null): string {
  if (!bounds) {
    return "-"
  }

  return `${formatNullableNumber(bounds.width)} / ${formatNullableNumber(bounds.height)}`
}

function formatFileTimestamp(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, "0")
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("_") + `_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}

function createCaptureId(index: number): string {
  return `capture_${String(index).padStart(4, "0")}_${Date.now()}`
}

function getElement<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id)
  if (!element) {
    throw new Error(`#${id} is missing`)
  }
  return element as T
}
