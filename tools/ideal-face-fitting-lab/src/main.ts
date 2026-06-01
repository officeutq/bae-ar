import "./style.css"
import canonicalFaceDepthTemplate from "../data/canonical-face-depth-template-v1.json"
import canonicalFaceModelObj from "../data/canonical_face_model.obj?raw"

type CaptureBucket =
  | "front"
  | "yawPositive"
  | "yawNegative"
  | "pitchPositive"
  | "pitchNegative"
  | "mixedPose"
  | "unknown"

type SemanticPointName =
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
  | "leftNoseSide"
  | "rightNoseSide"
  | "leftEyeOuter"
  | "rightEyeOuter"
  | "leftEyeInner"
  | "rightEyeInner"
  | "leftTemple"
  | "rightTemple"
  | "leftMouthCorner"
  | "rightMouthCorner"
  | "lowerJawLeft"
  | "lowerJawRight"

type SemanticPointId = SemanticPointName
type SemanticPointSetId = "8pt_basic" | "12pt_rotation_center" | "24pt_structure"
type DepthRelationAggregation = "mean" | "median"
type DepthRelationMode = "off" | "debugOnly" | "penalty" | "hardReject"
type DepthRelationKind = "inFrontOf" | "behind" | "near"
type DepthRelationSeverity = "ok" | "warning" | "violation"
type PoseBucket = CaptureBucket
type Depth478CandidateSource = "autoSequenceFinalCandidate" | "bestCandidate"
type Depth478GenerationMethod = "inverseDistanceWeighting" | "canonicalDepthBased"
type PerLandmarkZSearchTargetIndices = "all478" | "canonical468Only"
type CanonicalDepthFitReferencePointSetId =
  | "8pt_compatible"
  | "12pt_rotation_center"
  | "24pt_structure"

interface Point2 {
  x: number
  y: number
}

interface Point3 extends Point2 {
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
  rows?: number
  columns?: number
  values?: number[]
  data?: number[]
}

interface CaptureRecord {
  captureId: string
  videoWidth: number
  videoHeight: number
  landmarks: LandmarkPoint[]
  pose: Pose | null
  bucket: string
  blendshapes?: BlendshapeCapture[]
  facialTransformationMatrix?: MatrixCapture | null
  warnings?: string[]
}

interface CapturesPayload {
  schemaVersion?: string
  createdAt?: string
  captures?: CaptureRecord[]
}

interface Bounds2D {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  width: number
  height: number
  centerX: number
  centerY: number
}

interface Bounds2DWithAspectRatio extends Bounds2D {
  aspectRatio: number
}

interface SemanticDefinition {
  name: SemanticPointName
  label: string
  primaryIndices: number[]
  fallbackIndices?: number[]
  weight: number
}

interface SemanticPoint2D extends Point2 {
  name: SemanticPointName
}

type SemanticPointSet2D = Record<SemanticPointName, SemanticPoint2D>
type SemanticPointSet3D = Record<SemanticPointName, Point3>

interface NormalizedFrame {
  captureId: string
  bucket: CaptureBucket
  rawBucket: string
  videoWidth: number
  videoHeight: number
  aspectRatio: number
  landmarks: LandmarkPoint[]
  pose: Pose
  blendshapes: BlendshapeCapture[]
  semanticPoints: SemanticPointSet2D | null
  bounds: Bounds2D | null
  warnings: string[]
}

interface SearchSettings {
  semanticPointSetId: SemanticPointSetId
  searchMode: SearchMode
  objectiveMode: ObjectiveMode
  outlierFiltering: OutlierFilteringSettings
  depthRelationFiltering: DepthRelationFilteringSettings
  maxFrames: number
  targets: Record<CaptureBucket, number>
  includeMixedPose: boolean
  rollWarningDeg: number
  blendshapeWarningScore: number
  zMin: number
  zMax: number
  zStep: number
  pivotZMin: number
  pivotZMax: number
  pivotZStep: number
  topN: number
  focalLength: number
  localSearchSettings: LocalSearchSettings
}

interface SourceSummary {
  schemaVersion: string | null
  captureCount: number
  bucketCounts: Record<CaptureBucket, number>
  landmarkCount: {
    expected: number
    min: number | null
    max: number | null
    allExpected: boolean
  }
  matrixAvailableCount: number
  videoSizes: string[]
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

interface SelectedFrameSummary {
  selectedFrameCount: number
  bucketCounts: Record<CaptureBucket, number>
  selectedCaptureIds: string[]
  warnings: string[]
}

interface Base8Points2DSummary {
  sourceFrameCount: number
  bounds: Bounds2D | null
  points: SemanticPointSet2D | null
  semanticIndexDebug: Record<SemanticPointName, number[]>
}

interface SemanticPointSetSummary {
  id: SemanticPointSetId
  pointCount: number
  pointIds: SemanticPointName[]
  indexMapping: Record<SemanticPointName, number[]>
}

interface Current8CoordinateSpace {
  rawImageNormalizedPoints: string
  sameUnitPoints: string
  points: string
}

interface Current8Metrics {
  aspectRatio: number
  eyeDistance: number
  cheekWidth: number
  noseToEyeCenterX: number
  noseToMouthY: number
  noseX: number
  mouthX: number
  leftCheekX: number
  rightCheekX: number
  leftEyeX: number
  rightEyeX: number
}

interface Current8PointsFrame {
  captureId: string
  bucket: CaptureBucket
  rawBucket: string
  pose: Pose
  videoWidth: number
  videoHeight: number
  coordinateSpace: Current8CoordinateSpace
  points: SemanticPointSet2D
  sameUnitPoints: SemanticPointSet2D
  rawImageNormalizedPoints: SemanticPointSet2D
}

interface Current8BoundsFrame {
  captureId: string
  bucket: CaptureBucket
  pose: Pose
  bounds: Bounds2DWithAspectRatio
}

interface Current8MetricsFrame {
  captureId: string
  bucket: CaptureBucket
  pose: Pose
  metrics: Current8Metrics
  warnings: string[]
}

interface Current8FrameDebug extends Current8PointsFrame {
  bounds: Bounds2DWithAspectRatio
  metrics: Current8Metrics
  warnings: string[]
}

interface Current8BucketSummaryEntry {
  sampleCount: number
  averageBounds: Bounds2DWithAspectRatio | null
  averageAspectRatio: number | null
  minAspectRatio: number | null
  maxAspectRatio: number | null
  averageEyeDistance: number | null
  averageCheekWidth: number | null
  averageNoseX: number | null
  averagePointPositions: Record<SemanticPointName, Point2 | null>
}

interface Current8PoseComparison {
  frontAspectRatio: number | null
  yawPositiveAspectRatio: number | null
  yawNegativeAspectRatio: number | null
  yawPositiveAspectRatioRatioToFront: number | null
  yawNegativeAspectRatioRatioToFront: number | null
  frontCheekWidth: number | null
  yawPositiveCheekWidth: number | null
  yawNegativeCheekWidth: number | null
  frontEyeDistance: number | null
  yawPositiveEyeDistance: number | null
  yawNegativeEyeDistance: number | null
  interpretation: {
    yawPositiveLooksNarrowerThanFront: boolean | null
    yawNegativeLooksNarrowerThanFront: boolean | null
  }
}

interface Current8DebugSummary {
  selectedFrameCount: number
  coordinateSpace: Current8CoordinateSpace
  current8PointsByFrame: Current8PointsFrame[]
  current8BoundsByFrame: Current8BoundsFrame[]
  current8MetricsByFrame: Current8MetricsFrame[]
  current8BucketSummary: Record<CaptureBucket, Current8BucketSummaryEntry>
  current8PoseComparison: Current8PoseComparison
  current8Warnings: string[]
}

interface DepthConvention {
  smallerZ: string
  largerZ: string
  note: string
}

interface FittingCandidate8 {
  zByPointId: Record<SemanticPointName, number>
  pivotZ: number
  rotationCenter?: RotationCenter
}

interface RotationCenter {
  x: number
  y: number
  z: number
}

interface ProjectionOptions {
  pivotZ: number
  rotationCenter?: RotationCenter
}

type SearchMode = "fullGrid" | "localOneDimensional" | "coordinateDescent"
type ObjectiveMode =
  | "totalScore"
  | "balancedScore"
  | "maxBucketScore"
  | "pitchAverageScore"
  | "yawAverageScore"
type LastRunType = "autoSequence" | "singleSearch" | "stabilityCheck"
type OutlierFilteringMode = "off" | "debugOnly" | "excludeFromInference"
type OutlierFilteringMethod = "medianMultiplier" | "medianAbsoluteDelta" | "topWorstPercent"
type LocalSearchParameter = "pivotZ" | "rotationCenter.y" | "rotationCenter.z" | `${SemanticPointName}.z`
type SearchPresetId =
  | "coordinateDescentFine"
  | "rotationCenterFine"
  | "rotationCenterFineBalanced"
  | "rotationCenterFineMaxBucket"
  | "rotationCenter8PointFine"
  | "rotationCenter8PointFineBalanced"
  | "rotationCenter8PointFineMaxBucket"
  | "pivotZFine"
  | "noseZFine"
  | "leftCheekZFine"
  | "rightCheekZFine"
  | "mouthZFine"
  | "yawFocusFine"
  | "pitchFocusFine"
type BaseCandidatePresetId =
  | "baselineCheekDepth"
  | "currentFineBest"
  | "rotationCenterDebugBest"
  | "naturalNoseWithRotationCenter"
  | "currentBestCandidate"
type AutoSequencePresetId =
  | "fineSequence"
  | "currentBestFineSequence"
  | "yawFocusSequence"
  | "pitchFocusSequence"
  | "rotationCenterFineSequence"
  | "naturalNoseRotationCenterSequence"
  | "rotationCenterBalancedSequence"
  | "rotationCenterMaxBucketSequence"
  | "naturalNoseBalancedSequence"
  | "naturalNoseMaxBucketSequence"
type AutoSequenceStatus = "idle" | "running" | "completed" | "cancelled" | "error"
type BucketTargetPresetId = "balanced5Each" | "balanced8Each" | "balanced10Each"
type StabilityTargetPresetId = "5each" | "8each" | "10each"
type RequestedBucketTarget = Exclude<CaptureBucket, "unknown">
type StabilitySequencePresetId =
  | "rotationCenterBalancedSequence"
  | "rotationCenterMaxBucketSequence"
  | "naturalNoseBalancedSequence"
  | "naturalNoseMaxBucketSequence"

interface OutlierFilteringSettings {
  enabled: boolean
  mode: OutlierFilteringMode
  perBucketMaxOutliers: number
  minBucketSampleCount: number
  method: OutlierFilteringMethod
  medianMultiplier: number
  absoluteDeltaThreshold: number
  topWorstPercent: number
  applyToObjectiveScore: boolean
}

interface DepthRelationGroup {
  id: string
  label: string
  pointIds: SemanticPointId[]
  aggregation: DepthRelationAggregation
}

interface DepthRelationRule {
  id: string
  label: string
  subjectGroupId: string
  referenceGroupId: string
  relation: DepthRelationKind
  margin: number
  warningMargin: number
  weight: number
  mode: Exclude<DepthRelationMode, "off">
}

interface DepthRelationFilteringSettings {
  enabled: boolean
  mode: DepthRelationMode
  applyToObjectiveScore: boolean
  groups: DepthRelationGroup[]
  rules: DepthRelationRule[]
  penaltyScale: number
  maxPenalty: number
}

interface LocalSearchRange {
  min: number
  max: number
  step: number
}

type LocalSearchRanges = Record<LocalSearchParameter, LocalSearchRange>

interface LocalSearchSettings {
  baseCandidate: FittingCandidate8
  targetParameter: LocalSearchParameter
  localMin: number
  localMax: number
  localStep: number
  coordinateDescentIterations: number
  coordinateDescentParameterOrder: LocalSearchParameter[]
  coordinateDescentRanges: LocalSearchRanges
}

interface SearchPresetDefinition {
  id: SearchPresetId
  label: string
  searchMode: SearchMode
  objectiveMode?: ObjectiveMode
  targetParameter: LocalSearchParameter
  localMin: number
  localMax: number
  localStep: number
  coordinateDescentIterations: number
  coordinateDescentParameterOrder?: LocalSearchParameter[]
  coordinateDescentRanges: LocalSearchRanges
  baseCandidatePresetId?: BaseCandidatePresetId
  description: string
}

interface AutoSequenceDefinition {
  id: AutoSequencePresetId
  label: string
  baseCandidatePresetId: BaseCandidatePresetId
  steps: SearchPresetId[]
  depthRelationFilteringOverride?: Partial<
    Pick<DepthRelationFilteringSettings, "enabled" | "mode" | "applyToObjectiveScore">
  >
  description: string
}

interface AutoSequenceStepSummary {
  stepIndex: number
  presetName: string
  presetId: SearchPresetId
  semanticPointSetId: SemanticPointSetId
  semanticPointCount: number
  searchSettings: AutoSequenceStepSearchSettings
  objectiveMode: ObjectiveMode
  objectiveScore: number | null
  baseCandidate: FittingCandidate8
  bestCandidate: FittingCandidate8 | null
  totalScore: number | null
  scoreDebug?: {
    yawAverageScore?: number | null
    pitchAverageScore?: number | null
    maxBucketScore?: number | null
    balancedScore?: number | null
  }
  depthRelationSummary?: DepthRelationSummary
  depthRelationFiltering?: DepthRelationFilteringSummary
  outlierFilteringDebug?: StepOutlierFilteringDebug
  processedCandidateCount: number
  estimatedCandidateCount: number
  bestCandidateId?: string | null
}

interface AutoSequenceStepSearchSettings {
  semanticPointSetId: SemanticPointSetId
  semanticPointCount: number
  searchMode: SearchMode
  objectiveMode: ObjectiveMode
  targetParameter?: LocalSearchParameter
  localRange?: {
    min: number
    max: number
    step: number
  }
  coordinateDescentIterations?: number
  coordinateDescentParameterOrder?: LocalSearchParameter[]
  coordinateDescentRanges?: LocalSearchRanges
}

interface AutoSequenceSummary {
  sequenceId: AutoSequencePresetId | null
  sequenceName: string
  baseCandidatePresetId: BaseCandidatePresetId | null
  stepPresetIds: SearchPresetId[]
  startedAt: string
  completedAt?: string
  status: "completed" | "cancelled" | "error"
  steps: AutoSequenceStepSummary[]
  finalCandidate: FittingCandidate8WithDepthRelation | null
  finalObjectiveMode: ObjectiveMode | null
  finalObjectiveScore: number | null
  structureAwareReranking?: StructureAwareRerankingSummary
}

interface AutoSequenceState {
  status: AutoSequenceStatus
  definition: AutoSequenceDefinition | null
  bucketTargetPreset: BucketTargetPresetDefinition | null
  currentStepIndex: number
  startedAt: string | null
  completedAt: string | null
  steps: AutoSequenceStepSummary[]
  finalCandidate: FittingCandidate8WithDepthRelation | null
  currentBestScore: number | null
  message: string | null
}

interface BucketTargetPresetDefinition {
  id: BucketTargetPresetId
  label: string
  targets: Record<CaptureBucket, number>
  includeMixedPose: boolean
}

interface BucketTargetShortage {
  bucket: CaptureBucket
  required: number
  available: number
  selected: number
}

interface ActualSelectedFrameSummary {
  selectedFrameCount: number
  bucketCounts: Record<CaptureBucket, number>
  shortage?: BucketTargetShortage[]
}

interface StabilityHistoryEntry {
  id: string
  generatedAt: string
  bucketTargetPresetName: string
  requestedBucketTargets: Record<RequestedBucketTarget, number>
  actualSelectedFrameSummary: ActualSelectedFrameSummary
  sequenceName: string
  objectiveMode: ObjectiveMode
  finalCandidate: FittingCandidate8 | null
  scores: {
    objectiveScore: number | null
    totalScore: number | null
    balancedScore: number | null
    maxBucketScore: number | null
    pitchAverageScore: number | null
    yawAverageScore: number | null
  }
  worstBucket?: {
    bucket: CaptureBucket
    score: number
  } | null
  outlierSummary?: StabilityOutlierSummary
  depthRelationSummary?: DepthRelationSummary
}

interface StabilityOutlierSummary {
  enabled: boolean
  mode: string
  totalOutlierFrameCount: number
  outlierFrameCountsByBucket: Record<CaptureBucket, number>
  outlierFrames: OutlierFrameDebug[]
  rawScores: CandidateScoreSnapshot
  filteredScores: CandidateScoreSnapshot | null
}

interface StabilitySummary {
  sequenceName: string
  entries: StabilityHistoryEntry[]
  candidateDrift?: {
    rotationCenterYRange: number | null
    rotationCenterZRange: number | null
    noseZRange: number | null
    leftCheekZRange: number | null
    rightCheekZRange: number | null
  }
  scoreDrift?: {
    totalScoreRange: number | null
    balancedScoreRange: number | null
    maxBucketScoreRange: number | null
    pitchAverageScoreRange: number | null
    yawAverageScoreRange: number | null
  }
  interpretation?: {
    isStableCandidate: boolean
    notes: string[]
  }
}

interface CandidateStabilityDebug {
  history: StabilityHistoryEntry[]
  summaries: StabilitySummary[]
}

interface StabilityCheckState {
  status: "idle" | "running"
  targetPresetIds: StabilityTargetPresetId[]
  sequenceId: StabilitySequencePresetId | null
  currentIndex: number
}

interface LocalSearchStepSummary {
  iteration: number
  parameter: LocalSearchParameter
  previousValue: number
  bestValue: number
  bestScore: number
  candidateCount: number
}

interface LocalSearchSummary {
  initialCandidate: FittingCandidate8
  finalCandidate: FittingCandidate8
  steps: LocalSearchStepSummary[]
}

interface CandidateDefinition extends FittingCandidate8 {
  candidateId: string
}

interface FittingCandidate8WithDepthRelation extends FittingCandidate8 {
  depthRelationDebug?: DepthRelationDebug
}

interface FrameEvaluation {
  captureId: string
  bucket: CaptureBucket
  rawBucket?: string | null
  pose: {
    yaw: number | null
    pitch: number | null
    roll: number | null
  }
  frameError: number
  averageSemanticDistance: number
  weightedSemanticDistance: number
  perPointError: Record<SemanticPointName, number>
  projectedPoints: Record<SemanticPointName, Point2>
  currentPoints: Record<SemanticPointName, Point2>
  totalScore: number
  warnings: string[]
}

type PoseBucketScores = Record<
  "front" | "yawPositive" | "yawNegative" | "pitchPositive" | "pitchNegative" | "mixedPose",
  number | null
>

interface FittingCandidate8Score {
  rank: number
  objectiveMode: ObjectiveMode
  objectiveScore: number
  totalScore: number
  bucketScores: PoseBucketScores
  candidate: FittingCandidate8
}

interface CandidateResult extends CandidateDefinition {
  averageSemanticDistance: number
  weightedSemanticDistance: number
  perPointError: Record<SemanticPointName, number>
  bucketScores: PoseBucketScores
  scoreDebug: CandidateScoreDebug
  objectiveMode: ObjectiveMode
  objectiveScoreBeforeDepthFilter?: number
  objectiveScore: number
  totalScore: number
  sampleCount: number
  warnings: string[]
  perFrameResults: FrameEvaluation[]
  outlierDebug?: CandidateOutlierDebug
  depthRelationDebug?: DepthRelationDebug
}

interface CandidateScoreDebug {
  yawAverageScore: number | null
  pitchAverageScore: number | null
  maxBucketScore: number | null
  balancedScore: number
}

interface CandidateScoreSnapshot {
  totalScore: number
  bucketScores: PoseBucketScores
  scoreDebug: CandidateScoreDebug
}

interface OutlierFrameDebug {
  captureId: string
  bucket: CaptureBucket
  rawBucket?: string | null
  pose: {
    yaw: number | null
    pitch: number | null
    roll: number | null
  }
  frameError: number
  bucketMedianError: number | null
  bucketAverageError: number | null
  ratioToMedian: number | null
  deltaFromMedian: number | null
  perPointError: Record<SemanticPointName, number>
  worstPoint: {
    pointId: SemanticPointName
    error: number
  } | null
  outlierReason: string
  excludedFromInference: boolean
  retainedForValidation: boolean
}

interface BucketFrameErrorSummary {
  bucket: CaptureBucket
  sampleCount: number
  rawAverageError: number | null
  rawMedianError: number | null
  rawMaxError: number | null
  filteredAverageError: number | null
  filteredMedianError: number | null
  filteredMaxError: number | null
  outlierFrameCount: number
  worstFrame: OutlierFrameDebug | null
  outlierFrames: OutlierFrameDebug[]
}

interface CandidateOutlierDebug {
  settings: OutlierFilteringSettings
  bucketSummaries: BucketFrameErrorSummary[]
  outlierFrames: OutlierFrameDebug[]
  rawScores: CandidateScoreSnapshot
  filteredScores: CandidateScoreSnapshot | null
}

type OutlierObjectiveScoreSource = "rawScores" | "filteredScores"

interface StepOutlierFilteringBucketDebug {
  bucketId: CaptureBucket
  beforeCount: number
  afterCount: number
  excludedFrameIds: string[]
  medianError: number | null
  threshold: number | null
}

interface StepOutlierFilteringDebug {
  debugTarget: "stepBestCandidate"
  candidateId: string | null
  enabled: boolean
  mode: OutlierFilteringMode
  applyToObjectiveScore: boolean
  usedOutlierFilteredObjectiveScore: boolean
  objectiveScoreSource: OutlierObjectiveScoreSource
  scoringFrameCountBeforeOutlierFilter: number
  scoringFrameCountAfterOutlierFilter: number
  excludedFrameIds: string[]
  excludedFrameCount: number
  perBucket: StepOutlierFilteringBucketDebug[]
}

interface DepthRelationGroupValue {
  groupId: string
  label: string
  pointIds: SemanticPointId[]
  aggregation: DepthRelationAggregation
  z: number | null
}

interface DepthRelationRuleResult {
  ruleId: string
  label: string
  subjectGroupId: string
  referenceGroupId: string
  relation: DepthRelationKind
  subjectZ: number | null
  referenceZ: number | null
  margin: number
  delta: number | null
  passed: boolean
  severity: DepthRelationSeverity
  mode: Exclude<DepthRelationMode, "off">
  penalty: number
  reject: boolean
  explanation: string
}

interface DepthRelationDebug {
  settings: DepthRelationFilteringSettings
  groupValues: Record<string, DepthRelationGroupValue>
  ruleResults: DepthRelationRuleResult[]
  violationCount: number
  hardRejectViolationCount: number
  penalty: number
  isRejected: boolean
}

interface RejectedCandidateSummary {
  candidateId: string
  originalRank?: number | null
  candidate: FittingCandidate8
  objectiveMode: ObjectiveMode
  objectiveScoreBeforeDepthFilter: number
  totalScore: number
  scoreDebug: CandidateScoreDebug
  depthRelationDebug: DepthRelationDebug
  rejectReasons: string[]
}

interface AnalysisDepthRelationDebug {
  settings: DepthRelationFilteringSettings
  bestCandidateDepthRelation?: DepthRelationDebug
  rejectedCandidates: RejectedCandidateSummary[]
  nearestRejectedCandidate?: RejectedCandidateSummary
  rejectedCandidateCount: number
}

interface DepthRelationSummary {
  enabled: boolean
  mode: string
  violationCount: number
  hardRejectViolationCount: number
  rejectedCandidateCount: number
  finalCandidatePassed: boolean
  finalCandidatePenalty: number
}

interface DepthRelationFilteringSummary {
  enabled: boolean
  mode: DepthRelationMode
  applyToObjectiveScore: boolean
  ruleCount: number
}

interface RankingEntry extends FittingCandidate8Score {
  candidateId: string
  weightedSemanticDistance: number
  averageSemanticDistance: number
  scoreDebug: CandidateScoreDebug
  sampleCount: number
  idealFace8Summary?: IdealFace8CandidateSummary
  objectiveScoreBeforeDepthFilter?: number
  depthRelationDebug?: DepthRelationDebug
}

interface IdealFace8Source {
  type: "best_candidate"
  pivotZ: number
  rotationCenter: RotationCenter
  zApplication: string
}

interface IdealFace8Point extends Point2 {
  name: SemanticPointName
  z: number
}

interface DepthRelation {
  noseZ: number
  leftCheekZ: number
  rightCheekZ: number
  averageCheekZ: number
  noseIsInFrontOfCheeks: boolean
  leftRightCheekZDelta: number
  leftRightEyeZDelta: number
}

interface IdealFace8CandidateSummary {
  pointCount: number
  zRange: number
  noseZ: number
  leftCheekZ: number
  rightCheekZ: number
  noseIsInFrontOfCheeks: boolean
}

interface IdealFace8Summary extends IdealFace8CandidateSummary {
  bounds: Bounds2D | null
  zMin: number | null
  zMax: number | null
  averageCheekZ: number
  depthRelation: DepthRelation
}

interface BestIdealFace8 {
  schemaVersion: "ideal_face_fitting_lab_ideal_face_8_v1"
  coordinateSpace: "bae_ar_fitting_lab_8point_same_unit_v1"
  depthConvention: DepthConvention
  source: IdealFace8Source
  metadata: {
    intendedNextStep: "interpolate_8point_depth_to_478_debug_candidate"
    semanticPointNames: SemanticPointName[]
    sourceBase2D: "front_bucket_average_same_unit"
    zSource: "candidate_8point_z_grid_search_best_candidate"
  }
  points: IdealFace8Point[]
  summary: IdealFace8Summary
}

interface DepthAnchor8 {
  id: SemanticPointId
  label: string
  x: number
  y: number
  z: number
}

interface DepthInterpolationSettings {
  enabled: boolean
  method: Depth478GenerationMethod
  epsilon: number
  power: number
  clampZ: boolean
  zMin: number
  zMax: number
}

interface CanonicalDepthTemplatePoint {
  index: number
  rawZ: number
  z: number
}

interface CanonicalFaceDepthTemplateV1 {
  schemaVersion: "canonical_face_depth_template_v1"
  sourceLandmarkCount: number
  targetLandmarkCount: number
  canonicalDepth: CanonicalDepthTemplatePoint[]
  comparisonLandmarkIndices: number[]
  excludedLandmarkIndices: number[]
}

interface CanonicalDepthFitReferencePoint {
  pointId: SemanticPointName
  landmarkIndex: number | number[]
  canonicalZ: number
  targetZ: number
  fittedZ: number
  error: number
}

type CanonicalDepthZSign = "raw" | "inverted"

interface CanonicalDepthFitComparisonGroup {
  id: "nose" | "cheek" | "chin" | "mouth" | "jaw" | "faceBoundary"
  label: string
  landmarkIndices: number[]
  targetZ: number | null
  canonicalZ: number | null
  fittedZ: number | null
  error: number | null
}

interface CanonicalDepthFitComparisonVariant {
  id:
    | "canonicalZ_raw"
    | "canonicalZ_inverted"
    | "canonicalZ_raw_12pt"
    | "canonicalZ_inverted_12pt"
  zSign: CanonicalDepthZSign
  fitReferencePointSet: CanonicalDepthFitReferencePointSetId
  fit: {
    method: "leastSquares" | "rangeMatching"
    scale: number
    offset: number
    referencePoints: CanonicalDepthFitReferencePoint[]
  }
  averageReferenceAbsError: number
  maxReferenceAbsError: number
  groupFit: Record<CanonicalDepthFitComparisonGroup["id"], CanonicalDepthFitComparisonGroup>
  noseError: number | null
  cheekError: number | null
  chinError: number | null
  mouthError: number | null
  jawError: number | null
  faceBoundaryError: number | null
  averageProjectionError: number | null
  totalProjectionError: number | null
  maxBucketScore: number | null
  depthRelationStatus: SemanticPointSetComparisonDepthRelationStatus
  depthRelationViolationCount: number | null
  depthRelationHardRejectViolationCount: number | null
  depthRelationIsRejected: boolean | null
  perLandmarkBoundHitCount: number | null
  perLandmarkUpperBoundHitCount: number | null
  perLandmarkLowerBoundHitCount: number | null
  jawGroupLowerBoundHitCount: number | null
  faceBoundaryGroupLowerBoundHitCount: number | null
}

interface CanonicalDepthFitComparisonDebug {
  description: string
  depthConvention: DepthConvention
  variants: CanonicalDepthFitComparisonVariant[]
}

interface CanonicalDepthBasedDebug {
  templateFile: "canonical-face-depth-template-v1.json"
  templateSchemaVersion: "canonical_face_depth_template_v1"
  fitReferencePointSet: CanonicalDepthFitReferencePointSetId
  comparisonLandmarkCount: number
  excludedLandmarkIndices: number[]
  fit: {
    method: "leastSquares" | "rangeMatching"
    scale: number
    offset: number
    referencePoints: CanonicalDepthFitReferencePoint[]
  }
  irisDepthFallback: {
    enabled: boolean
    excludedFromCanonicalComparison: boolean
    indices: number[]
  }
  canonicalDeviation: {
    averageAbsError: number
    maxAbsError: number
  }
}

interface PerLandmarkZSearchSettings {
  enabled: boolean
  targetIndices: PerLandmarkZSearchTargetIndices
  zRange: number
  zStep: number
  anchorZRange: number
  anchorZStep: number
  groupRangeOverrides?: PerLandmarkZSearchGroupRangeOverride[]
  canonicalDeviationPenaltyWeight: number
  maxFrames?: number
}

interface PerLandmarkZSearchGroupRangeOverride {
  groupId: string
  lowerZRange: number
  upperZRange: number
}

interface PerLandmarkZSearchRangeSummary {
  rangeMode: "asymmetric" | "symmetric"
  defaultRange: {
    lower: number
    upper: number
  }
  anchorDefaultRange: {
    lower: number
    upper: number
  }
  groupOverrides: PerLandmarkZSearchGroupRangeOverride[]
}

interface RangeExpansionSummary {
  semanticPointRangeOverrides: Array<{
    pointId: SemanticPointName
    oldMin: number
    newMin: number
  }>
  perLandmarkRangeOverrides: PerLandmarkZSearchGroupRangeOverride[]
}

type ZSearchBoundHit = "lower" | "upper" | "none"
type ZSearchNearBound = "lower" | "upper" | "none"

interface SemanticPointZSearchBoundHit {
  pointId: SemanticPointName
  z: number
  min: number
  max: number
  hit: Exclude<ZSearchBoundHit, "none">
}

interface SemanticPointZSearchBoundSummary {
  pointCount: number
  boundHitCount: number
  lowerBoundHitCount: number
  upperBoundHitCount: number
  hits: SemanticPointZSearchBoundHit[]
}

interface PerLandmarkZSearchDebugRow {
  index: number
  baseZ: number
  bestZ: number
  minZ: number
  maxZ: number
  deltaFromBaseZ: number
  deltaZ: number
  hit: ZSearchBoundHit
  score: number
  projectionError: number
  canonicalDeviationPenalty: number
  errorBefore: number
  errorAfter: number
  bestScore: number
  candidateCount: number
}

interface PerLandmarkZSearchNearBoundRow extends PerLandmarkZSearchDebugRow {
  nearBound: Exclude<ZSearchNearBound, "none">
}

interface PerLandmarkZSearchNearBoundThreshold {
  mode: "step"
  value: number
  step: number
}

interface PerLandmarkZSearchGroupBoundHitSummary {
  groupId: string
  label: string
  landmarkCount: number
  upperBoundHitCount: number
  lowerBoundHitCount: number
  nearUpperBoundCount: number
  nearLowerBoundCount: number
}

interface PerLandmarkZSearchBoundSummary {
  searchedLandmarkCount: number
  excludedLandmarkCount: number
  upperBoundHitCount: number
  lowerBoundHitCount: number
  nearUpperBoundCount: number
  nearLowerBoundCount: number
  upperBoundHitRatio: number
  lowerBoundHitRatio: number
  nearUpperBoundRatio: number
  nearLowerBoundRatio: number
  maxPositiveDeltaFromBaseZ: number
  maxNegativeDeltaFromBaseZ: number
  averageAbsDeltaFromBaseZ: number
  nearBoundThreshold: PerLandmarkZSearchNearBoundThreshold
  boundHitLandmarks: PerLandmarkZSearchDebugRow[]
  nearBoundLandmarks: PerLandmarkZSearchNearBoundRow[]
  groupBoundHitSummary: PerLandmarkZSearchGroupBoundHitSummary[]
}

interface PerLandmarkZSearchDebug {
  enabled: boolean
  targetIndices: PerLandmarkZSearchTargetIndices
  usedOutlierFilteredFrames: boolean
  settings: {
    zRange: number
    zStep: number
    anchorZRange: number
    anchorZStep: number
    rangeSummary: PerLandmarkZSearchRangeSummary
    canonicalDeviationPenaltyWeight: number
    maxFrames?: number
  }
  summary: PerLandmarkZSearchBoundSummary & {
    optimizedLandmarkCount: number
    totalEvaluatedCandidates: number
    averageBestDeltaZ: number
    maxBestDeltaZ: number
    averageErrorBefore: number
    averageErrorAfter: number
  }
  worstImprovedLandmarks: PerLandmarkZSearchDebugRow[]
  largestDeltaLandmarks: PerLandmarkZSearchDebugRow[]
  sampleRows: PerLandmarkZSearchDebugRow[]
  fullPerLandmarkRows?: PerLandmarkZSearchDebugRow[]
}

interface DepthGroupCorrection {
  groupId: string
  label: string
  pointIndices: number[]
  offset: number
  strength: number
  falloff?: number
}

interface Generated478DepthCandidate {
  id: string
  source8CandidateId?: string | null
  sourceSemanticPointSetId?: SemanticPointSetId
  generationSettings: {
    interpolation: DepthInterpolationSettings
    groupCorrections: DepthGroupCorrection[]
  }
  rotationCenter: RotationCenter
  landmarks: Array<{
    index: number
    x: number
    y: number
    z: number
    sourceDebug?: {
      nearestAnchorId?: string
      anchorWeights?: Record<string, number>
      groupCorrectionOffset?: number
      canonicalZ?: number
      fittedCanonicalZ?: number
      irisDepthFallbackFrom?: "leftEye" | "rightEye"
    }
  }>
  summary: {
    landmarkCount: number
    zMin: number
    zMax: number
    zRange: number
    averageZ: number
  }
  canonicalDepthBasedDebug?: CanonicalDepthBasedDebug
  perLandmarkZSearchDebug?: PerLandmarkZSearchDebug
}

interface ProjectionEvaluation478 {
  totalProjectionError: number
  averageProjectionError: number
  bucketScores: Record<PoseBucket, number | null>
  perGroupError: Record<
    string,
    {
      groupId: string
      label: string
      averageError: number | null
      maxError: number | null
      sampleCount: number
    }
  >
  worstFrame: {
    captureId: string
    bucket: PoseBucket
    error: number
  } | null
  worstGroup: {
    groupId: string
    label: string
    averageError: number
  } | null
}

interface Depth478GroupValue {
  groupId: string
  label: string
  pointIndices: number[]
  aggregation: DepthRelationAggregation
  z: number | null
}

interface Depth478RelationDebug {
  settings: DepthRelationFilteringSummary
  groupValues: Record<string, Depth478GroupValue>
  ruleResults: DepthRelationRuleResult[]
  violationCount: number
  hardRejectViolationCount: number
  isRejected: boolean
}

interface SmoothnessDebug478 {
  averageNeighborDeltaZ: number | null
  maxNeighborDeltaZ: number | null
  highDeltaEdgeCount: number
  highDeltaEdges: Array<{
    from: number
    to: number
    deltaZ: number
  }>
  threshold: number
}

interface Depth478CandidateComparisonEntry {
  candidateId: string
  source8CandidateId?: string | null
  depth478GenerationMethod: Depth478GenerationMethod
  perLandmarkZSearchEnabled: boolean
  averageProjectionErrorBeforePerLandmark: number | null
  averageProjectionErrorAfterPerLandmark: number | null
  totalProjectionError: number | null
  maxBucketScore: number | null
  depthRelationViolationCount: number | null
  depthRelationHardRejectViolationCount: number | null
  depthRelationIsRejected: boolean | null
  hardRejectViolationCount: number | null
  isRejected: boolean | null
  smoothnessMaxDeltaZ: number | null
  smoothnessHighDeltaEdgeCount: number | null
}

interface Depth478PrototypeResult {
  settings: {
    interpolation: DepthInterpolationSettings
    groupCorrections: DepthGroupCorrection[]
    smoothnessThreshold: number
    perLandmarkZSearch: PerLandmarkZSearchSettings
  }
  generatedCandidate?: Generated478DepthCandidate
  projectionEvaluation?: ProjectionEvaluation478
  depthRelationDebug?: Depth478RelationDebug
  smoothnessDebug?: SmoothnessDebug478
  candidateComparison?: Depth478CandidateComparisonEntry[]
  canonicalDepthFitComparison?: CanonicalDepthFitComparisonDebug
}

type SemanticPointSetComparisonDepthRelationStatus = "passed" | "warning" | "rejected"

interface SemanticPointSetComparisonRun {
  semanticPointSetId: SemanticPointSetId
  pointCount: number
  quickRunStatus: Exclude<Quick478DepthDebugStatus, "idle" | "running">
  averageProjectionError: number | null
  maxBucketScore: number | null
  rotationCenter: {
    y: number | null
    z: number | null
  }
  pivotZ: number | null
  noseZ: number | null
  leftCheekZ: number | null
  rightCheekZ: number | null
  mouthZ: number | null
  noseTipGroupZ: number | null
  cheekGroupZ: number | null
  noseCheekDelta: number | null
  depthRelationStatus: SemanticPointSetComparisonDepthRelationStatus
  depthRelationViolationCount: number | null
  hardRejectViolationCount: number | null
  perLandmarkAverageErrorBefore: number | null
  perLandmarkAverageErrorAfter: number | null
  perLandmarkAverageBestDeltaZ: number | null
  semanticPointZSearchBoundSummary?: SemanticPointZSearchBoundSummary
  perLandmarkZSearchSummary?: PerLandmarkZSearchBoundSummary
  sourceCandidateId: string | null
  activeSemanticPointIds: SemanticPointName[]
  activeSemanticPointCount: number
  zByPointIdKeys: SemanticPointName[]
  unexpectedPointIds: SemanticPointName[]
  fitReferencePointSet: CanonicalDepthFitReferencePointSetId | null
  usesOnlyActiveSemanticPointsForScore: boolean
  usesOnlyActiveSemanticPointsForCandidateId: boolean
}

interface SemanticPointSetComparisonSummary {
  enabled: boolean
  runs: SemanticPointSetComparisonRun[]
  recommendedSemanticPointSetId: SemanticPointSetId | null
  recommendationReason: string
}

type CanonicalCompatible8PointId =
  | "headTop"
  | "chin"
  | "leftCheek"
  | "rightCheek"
  | "leftEye"
  | "rightEye"
  | "nose"
  | "mouth"

type BruteForce8ptDepthRelationStatus = "passed" | "warning" | "rejected"

interface BruteForce8ptCanonicalComparisonPoint {
  pointId: SemanticPointName
  landmarkIndex: number[]
  candidateZ: number
  canonicalZ: number
  delta: number
}

interface BruteForce8ptCanonicalComparison {
  averageAbsDelta: number
  maxAbsDelta: number
  points: BruteForce8ptCanonicalComparisonPoint[]
}

interface StructureAwarePenaltyViolation {
  ruleId: string
  label: string
  penalty: number
  details: Record<string, number | string | boolean | null>
}

interface DepthRelationPenaltyDebug {
  value: number
  violations: StructureAwarePenaltyViolation[]
}

interface CanonicalPairOrderViolation {
  pairId: string
  label: string
  candidateDelta: number | null
  canonicalDelta: number | null
  penalty: number
}

interface CanonicalPairOrderPenaltyDebug {
  value: number
  violations: CanonicalPairOrderViolation[]
}

interface CanonicalDeltaPenaltyDebug {
  averageAbsDelta: number
  maxAbsDelta: number
  penalty: number
}

interface CanonicalStructurePenaltyDebug {
  value: number
  canonicalCorrelation: number | null
  correlationPenalty: number
  isInvertedLike: boolean
  canonicalPairOrderPenalty: CanonicalPairOrderPenaltyDebug
  canonicalDeltaPenalty: CanonicalDeltaPenaltyDebug
}

interface BoundHitPenaltyDebug {
  value: number
  boundHitCount: number
  hits: Array<{
    pointId: SemanticPointName | string
    z: number
    min?: number
    max?: number
    hit: "lower" | "upper"
    penalty: number
  }>
}

interface StructureAwareScoreBreakdown {
  projectionScore: number
  depthRelationPenalty: DepthRelationPenaltyDebug
  canonicalStructurePenalty: CanonicalStructurePenaltyDebug
  boundHitPenalty: BoundHitPenaltyDebug
  structureAwareScore: number
  hardRejected: boolean
  hardRejectReasons: string[]
}

interface StructureAwareRanking<TCandidate> {
  description: string
  settings: {
    enabled: boolean
    useDepthRelationPenalty: boolean
    useCanonicalStructurePenalty: boolean
    useBoundHitPenalty: boolean
  }
  topCandidates: TCandidate[]
}

interface BruteForce8ptDepthRelationCheck {
  passed: boolean
  status: BruteForce8ptDepthRelationStatus
  subjectZ: number | null
  referenceZ: number | null
  delta: number | null
  margin: number
  explanation: string
}

interface BruteForce8ptDepthStructureDebug {
  noseVsCheek: BruteForce8ptDepthRelationCheck
  centerVsBoundary: BruteForce8ptDepthRelationCheck
  chinTooFront: BruteForce8ptDepthRelationCheck
  jawVsCheek: BruteForce8ptDepthRelationCheck
  score: {
    status: BruteForce8ptDepthRelationStatus
    violationCount: number
    warningCount: number
  }
}

interface BruteForce8ptTopCandidate {
  candidateId: string
  rank: number
  rawProjectionRank?: number | null
  structureAwareRank?: number | null
  totalScore: number
  objectiveScore: number
  objectiveScoreBeforeDepthFilter: number
  rawProjectionScore: number
  structureAwareScore: number
  scoreBreakdown: StructureAwareScoreBreakdown
  averageProjectionError: number
  bucketScores: PoseBucketScores
  scoreDebug: CandidateScoreDebug
  zByPointId: Record<CanonicalCompatible8PointId, number>
  canonicalComparison: BruteForce8ptCanonicalComparison
  depthStructureDebug8pt: BruteForce8ptDepthStructureDebug
}

interface BruteForce8ptCanonicalBaseline {
  enabled: boolean
  pointSetId: "8pt_canonical_compatible"
  candidateCount: number
  evaluatedCandidateCount: number
  rejectedCandidateCount: number
  topCandidates: BruteForce8ptTopCandidate[]
  rawProjectionRanking: {
    description: string
    topCandidates: BruteForce8ptTopCandidate[]
  }
  structureAwareRanking: StructureAwareRanking<BruteForce8ptTopCandidate>
  finalCandidateSelection: {
    selectedFrom: "structureAwareRanking"
    selectedCandidateId: string | null
    rawProjectionRank: number | null
    structureAwareRank: number | null
    reason: string
  }
  summary: {
    bestCandidateId: string | null
    bestScore: number | null
    bestCanonicalAverageAbsDelta: number | null
    bestCanonicalMaxAbsDelta: number | null
    bestDepthRelationStatus: BruteForce8ptDepthRelationStatus | null
    topNCount: number
  }
  settings: {
    pointLandmarkIndices: Record<CanonicalCompatible8PointId, number[]>
    zRanges: Record<CanonicalCompatible8PointId, number[]>
    fixedRotationCenterSource: "naturalNoseWithRotationCenter"
    fixedPivotZ: number
    fixedRotationCenter: RotationCenter
    objectiveMode: ObjectiveMode
    outlierFilteringEnabled: boolean
    depthRelationMode: DepthRelationMode
  }
}

interface BruteForce8ptFrame {
  captureId: string
  bucket: CaptureBucket
  rawBucket: string
  pose: Pose
  semanticPoints: Record<CanonicalCompatible8PointId, SemanticPoint2D>
  bounds: Bounds2D
  warnings: string[]
}

interface BruteForce8ptFrameEvaluation {
  captureId: string
  bucket: CaptureBucket
  rawBucket: string
  frameError: number
  averageSemanticDistance: number
  weightedSemanticDistance: number
  perPointError: Record<CanonicalCompatible8PointId, number>
}

interface BruteForce8ptCandidateResult {
  candidateId: string
  candidate: FittingCandidate8
  totalScore: number
  averageProjectionError: number
  bucketScores: PoseBucketScores
  scoreDebug: CandidateScoreDebug
  objectiveScoreBeforeDepthFilter: number
  objectiveScore: number
  depthStructureDebug8pt: BruteForce8ptDepthStructureDebug
  canonicalComparison: BruteForce8ptCanonicalComparison
  rawProjectionRank?: number
  structureAwareRank?: number
  scoreBreakdown: StructureAwareScoreBreakdown
}

interface CandidateComparison8ptVs12pt {
  best8ptBruteforce?: {
    candidateId: string | null
    averageProjectionError: number | null
    canonicalAverageAbsDelta: number | null
    depthRelationStatus: BruteForce8ptDepthRelationStatus | null
  }
  final12ptSequence?: {
    candidateId: string | null
    averageProjectionError: number | null
    canonicalAverageAbsDelta: number | null
    depthRelationStatus: SemanticPointSetComparisonDepthRelationStatus | null
  }
  best8ptRawProjection: CandidateComparisonEntry
  best8ptStructureAware: CandidateComparisonEntry
  final12ptCurrent: CandidateComparisonEntry
  best12ptStructureAware: CandidateComparisonEntry
  notes: string[]
}

interface CandidateComparisonEntry {
  candidateId: string | null
  averageProjectionError: number | null
  canonicalAverageAbsDelta: number | null
  canonicalCorrelation: number | null
  depthRelationStatus: BruteForce8ptDepthRelationStatus | SemanticPointSetComparisonDepthRelationStatus | null
  structureAwareScore: number | null
  rawProjectionScore: number | null
  boundHitCount: number | null
}

interface StructureAwareRerankingCandidate {
  candidateId: string
  rawProjectionRank: number | null
  structureAwareRank: number
  rawProjectionScore: number
  structureAwareScore: number
  averageProjectionError: number
  canonicalComparison: BruteForce8ptCanonicalComparison | null
  depthRelationStatus: BruteForce8ptDepthRelationStatus
  boundHitCount: number
  scoreBreakdown: StructureAwareScoreBreakdown
  candidate: FittingCandidate8
}

interface StructureAwareRerankingSummary {
  enabled: boolean
  description: string
  topCandidates: StructureAwareRerankingCandidate[]
  wouldSelectCandidateId: string | null
  currentFinalCandidateId: string | null
  wouldChangeFinalCandidate: boolean
}

interface Candidate12ptCanonicalFitPoint {
  pointId: SemanticPointName
  landmarkIndex: number[]
  canonical: Point3
  candidate: Point3
}

interface Candidate12ptZOnlyFit {
  status: "ok" | "skipped"
  reason?: string
  scaleZ?: number
  offsetZ?: number
  averageAbsZError?: number
  maxAbsZError?: number
  canonicalCorrelationZ?: number | null
  scaleSign?: "positive" | "negative" | "zero"
}

interface Candidate12ptXyzUniformFit {
  status: "ok" | "skipped"
  reason?: string
  scale?: number
  offset?: Point3
  average3DError?: number
  averageAbsZErrorAfterFit?: number
  maxAbsZErrorAfterFit?: number
  canonicalCorrelationZAfterFit?: number | null
  scaleSign?: "positive" | "negative" | "zero"
}

interface Candidate12ptXyzNonUniformFit {
  status: "ok" | "skipped"
  reason?: string
  scale?: Point3
  offset?: Point3
  average3DError?: number
  averageAbsZErrorAfterFit?: number
  maxAbsZErrorAfterFit?: number
  canonicalCorrelationZAfterFit?: number | null
  scaleZSign?: "positive" | "negative" | "zero"
}

interface Candidate12ptCanonicalFitComparisonEntry {
  label: string
  targetCandidateId: string | null
  pointSetId: SemanticPointSetId
  canonicalPointSetId: "12pt_canonical_compatible"
  candidateXySource: string
  coordinateConvention: {
    z: string
  }
  points: Candidate12ptCanonicalFitPoint[]
  zOnlyFit: Candidate12ptZOnlyFit
  xyzUniformFit: Candidate12ptXyzUniformFit
  xyzNonUniformFit: Candidate12ptXyzNonUniformFit
  interpretation: {
    zOnlySuggestsInversion: boolean
    xyzFitReducesZError: boolean
    coordinateSystemMismatchLikely: boolean
    candidateStructureMismatchLikely: boolean
    notes: string[]
  }
}

interface Candidate12ptCanonicalFitComparison {
  enabled: boolean
  targetCandidateId: string | null
  pointSetId: SemanticPointSetId
  canonicalPointSetId: "12pt_canonical_compatible"
  coordinateConvention: {
    z: string
  }
  points: Candidate12ptCanonicalFitPoint[]
  zOnlyFit: Candidate12ptZOnlyFit
  xyzUniformFit: Candidate12ptXyzUniformFit
  xyzNonUniformFit: Candidate12ptXyzNonUniformFit
  interpretation: Candidate12ptCanonicalFitComparisonEntry["interpretation"]
  comparisons: Candidate12ptCanonicalFitComparisonEntry[]
}

type Quick478DepthDebugStatus =
  | "idle"
  | "running"
  | "passed"
  | "warning"
  | "rejected"
  | "noCandidate"
  | "error"

interface Quick478DepthDebugSummary {
  schemaVersion: "ideal_face_fitting_depth478_quick_debug_v1"
  status: Exclude<Quick478DepthDebugStatus, "idle" | "running">
  reason?: string
  failedStep?: string
  stack?: string
  startedAt: string
  completedAt: string
  settings: {
    semanticPointSetId: SemanticPointSetId
    bucketPreset: "balanced_10_each"
    autoSearchSequence: "rotation_center_balanced"
    depthRelationMode: DepthRelationMode
    outlierFilteringEnabled: boolean
    perLandmarkZSearchEnabled: boolean
    depth478GenerationMethod: Depth478GenerationMethod
    interpolationMethod: DepthInterpolationSettings["method"]
  }
  actualExecution: Quick478ActualExecution
  summary: {
    noseTipGroupZ: number | null
    cheekGroupZ: number | null
    margin: number | null
    violationCount: number | null
    hardRejectViolationCount: number | null
    isRejected: boolean | null
    smoothnessHighDeltaEdgeCount: number | null
    averageProjectionError: number | null
    semanticPointBoundHitCount: number | null
    perLandmarkUpperBoundHitCount: number | null
    perLandmarkLowerBoundHitCount: number | null
    jawGroupLowerBoundHitCount: number | null
    faceBoundaryGroupLowerBoundHitCount: number | null
    faceCenterGroupZ: number | null
    faceBoundaryGroupZ: number | null
    bruteforce8ptCandidateCount?: number
    best8ptScore?: number | null
    best8ptCanonicalAverageAbsDelta?: number | null
    best12ptScore?: number | null
    best12ptCanonicalAverageAbsDelta?: number | null
    rawBestScore?: number | null
    structureAwareBestScore?: number | null
    rawBestDepthStatus?: BruteForce8ptDepthRelationStatus | null
    structureAwareBestDepthStatus?: BruteForce8ptDepthRelationStatus | null
    wouldChangeFinalCandidate?: boolean | null
  }
  isRejected?: boolean
  fallbackUsed?: boolean
  bestRejectedCandidateByScore?: Quick478RejectedCandidateDebug
  nearestDepthRelationCandidate?: Quick478RejectedCandidateDebug
  nearestRejectedCandidate?: Quick478RejectedCandidateDebug
}

interface Quick478ActualExecution {
  baseCandidatePresetId: BaseCandidatePresetId | null
  sequenceId: AutoSequencePresetId | null
  stepCount: number
  stepIds: SearchPresetId[]
  parameterOrders: LocalSearchParameter[][]
  usedSamePathAsManualAutoSequence: boolean
  steps: Quick478ActualExecutionStep[]
}

interface Quick478ActualExecutionStep {
  stepId: SearchPresetId
  semanticPointSetId: SemanticPointSetId
  semanticPointCount: number
  parameterOrder: LocalSearchParameter[]
  candidateCount: number
  rejectedCandidateCount: number
  passedCandidateCount: number
  bestCandidateId: string | null
  stopReason: string | null
  outlierFilteringDebug?: StepOutlierFilteringDebug
}

interface Quick478RejectedCandidateDebug {
  candidateId: string
  noseZ: number | null
  cheekZ: number | null
  margin: number | null
  delta: number | null
  reason: string
}

interface Quick478DepthDebugPayload extends Depth478PrototypeResult {
  quickRun: Quick478DepthDebugSummary
  rangeExpansionSummary: RangeExpansionSummary
  semanticPointZSearchBoundSummary?: SemanticPointZSearchBoundSummary
  perLandmarkZSearchSummary?: PerLandmarkZSearchBoundSummary
  semanticPointSetComparison?: SemanticPointSetComparisonSummary
  bruteforce8ptCanonicalBaseline?: BruteForce8ptCanonicalBaseline
  candidateComparison8ptVs12pt?: CandidateComparison8ptVs12pt
  candidate12ptCanonicalFitComparison?: Candidate12ptCanonicalFitComparison
  analysisSummary?: SummaryAnalysisResult
}

interface Quick478DepthDebugState {
  status: Quick478DepthDebugStatus
  message: string | null
  startedAt: string | null
  completedAt: string | null
  quickRun: Quick478DepthDebugSummary | null
}

interface QuickSemanticPointSetComparisonState {
  enabled: boolean
  pointSetIds: SemanticPointSetId[]
  activeIndex: number
  primaryPointSetId: SemanticPointSetId
  runs: SemanticPointSetComparisonRun[]
  primaryAnalysis: AnalysisResult | null
  primaryPrototype: Depth478PrototypeResult | null
  primaryRun: SemanticPointSetComparisonRun | null
}

type ProjectionSignDebugBucket = Exclude<CaptureBucket, "mixedPose" | "unknown">
type ProjectionSignDirection = "positive" | "negative" | "flat"
type ProjectionSignPointName = "nose" | "leftCheek" | "rightCheek" | "mouth"

interface ProjectionSignPointDelta {
  dx: number
  dy: number
  distance: number
}

interface ProjectionSignMovement {
  dx: number
  dy: number
}

type ProjectionSignPointSet = Record<ProjectionSignPointName, Point2>
type ProjectionSignDeltaSet = Record<ProjectionSignPointName, ProjectionSignPointDelta>
type RotationCenterDebugBaseCandidateId =
  | "currentBestCandidate"
  | "currentBaseCandidate"
  | "pitchFocusRawBest"
  | "naturalNoseCandidate"

interface ProjectionSignDebugRow {
  captureId: string
  bucket: ProjectionSignDebugBucket
  pose: Pose
  candidate: {
    pivotZ: number
    noseZ: number
    leftCheekZ: number
    rightCheekZ: number
    mouthZ: number
  }
  projected: ProjectionSignPointSet
  current: ProjectionSignPointSet
  deltaToCurrent: ProjectionSignDeltaSet
  noseMovementFromBase?: ProjectionSignMovement
}

interface ProjectionSignBucketSummary {
  captureId: string
  pose: Pose
  noseZIncreasingEffect: {
    projectedNoseXDirection: ProjectionSignDirection
    projectedNoseYDirection: ProjectionSignDirection
  }
  bestNoseZByNoseDistance: number
  bestNoseZByFrameScore: number
  note?: string
}

interface ProjectionSignDebugSummary {
  byBucket: Record<ProjectionSignDebugBucket, ProjectionSignBucketSummary>
}

interface ProjectionSignDebug {
  baseCandidate: FittingCandidate8
  noseZCandidates: number[]
  rows: ProjectionSignDebugRow[]
  summary: ProjectionSignDebugSummary
}

interface RotationCenterDebugResult {
  baseCandidate: FittingCandidate8
  pivotX: number
  pivotY: number
  pivotZ: number
  totalScore: number
  bucketScores: PoseBucketScores
  scoreDebug: {
    yawAverageScore: number | null
    pitchAverageScore: number | null
    maxBucketScore: number | null
    balancedScore: number | null
  }
  perPointErrorSummary?: Record<SemanticPointName, number>
}

interface RotationCenterDebugSummary {
  candidateName: string
  bestByTotalScore: RotationCenterDebugResult
  bestByBalancedScore: RotationCenterDebugResult
  bestByPitchAverageScore: RotationCenterDebugResult
  bestByMaxBucketScore: RotationCenterDebugResult
  baselineRotationCenter: {
    pivotX: 0
    pivotY: 0
    pivotZ: number
  }
  baselineResult: RotationCenterDebugResult
  improvementFromBaseline: {
    totalScoreDelta: number
    balancedScoreDelta: number
    pitchAverageScoreDelta: number
    maxBucketScoreDelta: number
  }
}

interface RotationCenterDebug {
  baseCandidate: FittingCandidate8
  baseCandidateName: string
  pivotXCandidates: number[]
  pivotYCandidates: number[]
  pivotZCandidates: number[]
  results: RotationCenterDebugResult[]
  summary: RotationCenterDebugSummary
}

interface AnalysisResult {
  schemaVersion: "ideal_face_fitting_lab_analysis_v1"
  analysisVersion: "eight_point_grid_search_v1"
  generatedAt: string
  lastRunType: LastRunType
  sourceSummary: SourceSummary
  selectedFrameSummary: SelectedFrameSummary
  semanticPointSet: SemanticPointSetSummary
  base8Points2DSummary: Base8Points2DSummary
  baseSemanticPoints2DSummary: Base8Points2DSummary
  current8Debug: Current8DebugSummary
  current8PointsByFrame: Current8PointsFrame[]
  current8BoundsByFrame: Current8BoundsFrame[]
  current8MetricsByFrame: Current8MetricsFrame[]
  current8BucketSummary: Record<CaptureBucket, Current8BucketSummaryEntry>
  current8PoseComparison: Current8PoseComparison
  depthConvention: DepthConvention
  searchMode: SearchMode
  searchSettings: SearchSettings
  depthRelationFiltering: DepthRelationFilteringSummary
  localSearchSettings?: LocalSearchSettings
  localSearchSummary?: LocalSearchSummary
  scoreDebugSummary: CandidateScoreDebug | null
  candidateCount: number
  processedCandidateCount: number
  estimatedCandidateCount: number
  rawRanking: RankingEntry[]
  depthFilteredRanking: RankingEntry[]
  topCandidates: RankingEntry[]
  bestCandidate: CandidateResult | null
  bestIdealFace8: BestIdealFace8 | null
  depthRelation: DepthRelation | null
  depthRelationDebug?: AnalysisDepthRelationDebug
  bucketRanking: Record<CaptureBucket, RankingEntry[]>
  perPointErrorSummary: Record<SemanticPointName, number | null>
  projectionSignDebug?: ProjectionSignDebug
  rotationCenterDebug?: RotationCenterDebug
  outlierFrameDebug?: AnalysisOutlierFrameDebug
  autoSequenceSummary?: AutoSequenceSummary
  candidateStabilityDebug?: CandidateStabilityDebug
  depth478Prototype?: Depth478PrototypeResult
  warnings: string[]
}

interface SummaryAnalysisResult {
  schemaVersion: "ideal_face_fitting_lab_analysis_summary_v1"
  analysisVersion: "eight_point_grid_search_v1"
  generatedAt: string
  lastRunType: LastRunType
  sourceSummary: SourceSummary
  selectedFrameSummary: SelectedFrameSummary
  semanticPointSet: SemanticPointSetSummary
  base8Points2DSummary: Base8Points2DSummary
  baseSemanticPoints2DSummary: Base8Points2DSummary
  current8BucketSummary: Record<CaptureBucket, Current8BucketSummaryEntry>
  current8PoseComparison: Current8PoseComparison
  current8FrameSample: Current8FrameDebug[]
  depthConvention: DepthConvention
  searchMode: SearchMode
  searchSettings: SearchSettings
  depthRelationFiltering: DepthRelationFilteringSummary
  localSearchSettings?: LocalSearchSettings
  localSearchSummary?: LocalSearchSummary
  scoreDebugSummary: CandidateScoreDebug | null
  processedCandidateCount: number
  estimatedCandidateCount: number
  rawRanking: RankingEntry[]
  depthFilteredRanking: RankingEntry[]
  topCandidates: RankingEntry[]
  bestCandidate: RankingEntry | null
  bestIdealFace8: BestIdealFace8 | null
  depthRelation: DepthRelation | null
  depthRelationDebug?: AnalysisDepthRelationDebug
  bucketRanking: Record<CaptureBucket, RankingEntry[]>
  perPointErrorSummary: Record<SemanticPointName, number | null>
  projectionSignDebug?: ProjectionSignDebug
  rotationCenterDebug?: RotationCenterDebug
  outlierFrameDebug?: AnalysisOutlierFrameDebug
  autoSequenceSummary?: AutoSequenceSummary
  autoSequenceSummaryFinalCandidate?: FittingCandidate8 | null
  autoSequenceStepCount: number
  candidateStabilityDebug?: CandidateStabilityDebug
  depth478Prototype?: Depth478PrototypeResult
  warnings: string[]
}

interface AnalysisOutlierFrameDebug {
  settings: OutlierFilteringSettings
  bestCandidateOutliers?: {
    bucketSummaries: BucketFrameErrorSummary[]
    outlierFrames: OutlierFrameDebug[]
    rawScores: CandidateScoreSnapshot
    filteredScores: CandidateScoreSnapshot | null
  }
}

type SearchProgressStatus = "idle" | "running" | "completed" | "cancelled" | "error"

interface SearchProgressState {
  status: SearchProgressStatus
  processedCandidateCount: number
  estimatedCandidateCount: number
  progressRate: number
  startedAt: string | null
  updatedAt: string | null
  message: string | null
}

interface AppState {
  fileName: string | null
  payload: CapturesPayload | null
  frames: NormalizedFrame[]
  analysis: AnalysisResult | null
  searchWorker: Worker | null
  searchProgress: SearchProgressState
  coordinateDescentParameterOrder: LocalSearchParameter[]
  coordinateDescentRanges: LocalSearchRanges
  autoSequence: AutoSequenceState
  autoSequenceLastAnalysis: AnalysisResult | null
  stabilityHistory: StabilityHistoryEntry[]
  stabilityCheck: StabilityCheckState
  quick478DepthDebug: Quick478DepthDebugState
  quickSemanticPointSetComparison: QuickSemanticPointSetComparisonState | null
  presetMessage: string | null
  importMessage: string | null
  copyMessage: string | null
}

const SEMANTIC_DEFINITIONS: SemanticDefinition[] = [
  {
    name: "headTop",
    label: "頭頂",
    primaryIndices: [10],
    weight: 0.75,
  },
  {
    name: "chin",
    label: "顎",
    primaryIndices: [152],
    weight: 1.0,
  },
  {
    name: "leftCheek",
    label: "左頬",
    primaryIndices: [234],
    weight: 1.0,
  },
  {
    name: "rightCheek",
    label: "右頬",
    primaryIndices: [454],
    weight: 1.0,
  },
  {
    name: "leftEye",
    label: "左目中心",
    primaryIndices: [474, 475, 476, 477],
    fallbackIndices: [263, 362],
    weight: 1.45,
  },
  {
    name: "rightEye",
    label: "右目中心",
    primaryIndices: [469, 470, 471, 472],
    fallbackIndices: [33, 133],
    weight: 1.45,
  },
  {
    name: "nose",
    label: "鼻",
    primaryIndices: [4],
    weight: 1.7,
  },
  {
    name: "mouth",
    label: "口中心",
    primaryIndices: [13, 14],
    weight: 1.2,
  },
  {
    name: "noseBridge",
    label: "鼻筋",
    primaryIndices: [6],
    weight: 1.35,
  },
  {
    name: "leftJaw",
    label: "左顎ライン",
    primaryIndices: [172],
    weight: 1.15,
  },
  {
    name: "rightJaw",
    label: "右顎ライン",
    primaryIndices: [397],
    weight: 1.15,
  },
  {
    name: "upperFaceCenter",
    label: "上顔面中心",
    primaryIndices: [168],
    weight: 1.15,
  },
  {
    name: "leftNoseSide",
    label: "左小鼻",
    primaryIndices: [98],
    weight: 1.15,
  },
  {
    name: "rightNoseSide",
    label: "右小鼻",
    primaryIndices: [327],
    weight: 1.15,
  },
  {
    name: "leftEyeOuter",
    label: "左目尻",
    primaryIndices: [263],
    weight: 1.15,
  },
  {
    name: "rightEyeOuter",
    label: "右目尻",
    primaryIndices: [33],
    weight: 1.15,
  },
  {
    name: "leftEyeInner",
    label: "左目頭",
    primaryIndices: [362],
    weight: 1.15,
  },
  {
    name: "rightEyeInner",
    label: "右目頭",
    primaryIndices: [133],
    weight: 1.15,
  },
  {
    name: "leftTemple",
    label: "左こめかみ",
    primaryIndices: [356],
    weight: 1.15,
  },
  {
    name: "rightTemple",
    label: "右こめかみ",
    primaryIndices: [127],
    weight: 1.15,
  },
  {
    name: "leftMouthCorner",
    label: "左口角",
    primaryIndices: [291],
    weight: 0.65,
  },
  {
    name: "rightMouthCorner",
    label: "右口角",
    primaryIndices: [61],
    weight: 0.65,
  },
  {
    name: "lowerJawLeft",
    label: "左下顎",
    primaryIndices: [365],
    weight: 1.15,
  },
  {
    name: "lowerJawRight",
    label: "右下顎",
    primaryIndices: [136],
    weight: 1.15,
  },
]

const SEMANTIC_POINT_NAMES = SEMANTIC_DEFINITIONS.map(
  (definition) => definition.name,
) as SemanticPointName[]

const BASIC_8_SEMANTIC_POINT_NAMES: SemanticPointName[] = [
  "headTop",
  "chin",
  "leftCheek",
  "rightCheek",
  "leftEye",
  "rightEye",
  "nose",
  "mouth",
]

const ROTATION_CENTER_12_SEMANTIC_POINT_NAMES: SemanticPointName[] = [
  ...BASIC_8_SEMANTIC_POINT_NAMES,
  "noseBridge",
  "leftJaw",
  "rightJaw",
  "upperFaceCenter",
]

const STRUCTURE_24_SEMANTIC_POINT_NAMES: SemanticPointName[] = [
  ...ROTATION_CENTER_12_SEMANTIC_POINT_NAMES,
  "leftNoseSide",
  "rightNoseSide",
  "leftEyeOuter",
  "rightEyeOuter",
  "leftEyeInner",
  "rightEyeInner",
  "leftTemple",
  "rightTemple",
  "leftMouthCorner",
  "rightMouthCorner",
  "lowerJawLeft",
  "lowerJawRight",
]

const SEMANTIC_POINT_SET_DEFINITIONS: Record<
  SemanticPointSetId,
  {
    id: SemanticPointSetId
    pointIds: SemanticPointName[]
  }
> = {
  "8pt_basic": {
    id: "8pt_basic",
    pointIds: BASIC_8_SEMANTIC_POINT_NAMES,
  },
  "12pt_rotation_center": {
    id: "12pt_rotation_center",
    pointIds: ROTATION_CENTER_12_SEMANTIC_POINT_NAMES,
  },
  "24pt_structure": {
    id: "24pt_structure",
    pointIds: STRUCTURE_24_SEMANTIC_POINT_NAMES,
  },
}

const DEFAULT_SEMANTIC_POINT_SET_ID: SemanticPointSetId = "8pt_basic"
const QUICK_478_DEPTH_SEMANTIC_POINT_SET_ID: SemanticPointSetId = "12pt_rotation_center"
const QUICK_SEMANTIC_POINT_SET_COMPARISON_IDS: SemanticPointSetId[] = [
  "8pt_basic",
  "12pt_rotation_center",
  "24pt_structure",
]

function completeSemanticZ(
  zByPointId: Record<string, number>,
): Record<SemanticPointName, number> {
  const leftEye = zByPointId.leftEye ?? 0
  const rightEye = zByPointId.rightEye ?? leftEye
  const nose = zByPointId.nose ?? 0
  const noseBridge = zByPointId.noseBridge ?? (nose + (leftEye + rightEye) / 2) / 2
  const leftCheek = zByPointId.leftCheek ?? 0
  const rightCheek = zByPointId.rightCheek ?? leftCheek
  const chin = zByPointId.chin ?? 0
  const headTop = zByPointId.headTop ?? 0
  return {
    headTop: round(headTop),
    chin: round(chin),
    leftCheek: round(leftCheek),
    rightCheek: round(rightCheek),
    leftEye: round(leftEye),
    rightEye: round(rightEye),
    nose: round(nose),
    mouth: round(zByPointId.mouth ?? 0),
    noseBridge: round(noseBridge),
    leftJaw: round(zByPointId.leftJaw ?? (chin + leftCheek) / 2),
    rightJaw: round(zByPointId.rightJaw ?? (chin + rightCheek) / 2),
    upperFaceCenter: round(zByPointId.upperFaceCenter ?? (headTop + noseBridge) / 2),
    leftNoseSide: round(zByPointId.leftNoseSide ?? (nose + leftCheek) / 2),
    rightNoseSide: round(zByPointId.rightNoseSide ?? (nose + rightCheek) / 2),
    leftEyeOuter: round(zByPointId.leftEyeOuter ?? leftEye),
    rightEyeOuter: round(zByPointId.rightEyeOuter ?? rightEye),
    leftEyeInner: round(zByPointId.leftEyeInner ?? leftEye),
    rightEyeInner: round(zByPointId.rightEyeInner ?? rightEye),
    leftTemple: round(zByPointId.leftTemple ?? (headTop + leftCheek) / 2),
    rightTemple: round(zByPointId.rightTemple ?? (headTop + rightCheek) / 2),
    leftMouthCorner: round(zByPointId.leftMouthCorner ?? zByPointId.mouth ?? 0),
    rightMouthCorner: round(zByPointId.rightMouthCorner ?? zByPointId.mouth ?? 0),
    lowerJawLeft: round(zByPointId.lowerJawLeft ?? (chin + leftCheek) / 2),
    lowerJawRight: round(zByPointId.lowerJawRight ?? (chin + rightCheek) / 2),
  }
}

function getSemanticPointSet(pointSetId: SemanticPointSetId): {
  id: SemanticPointSetId
  pointIds: SemanticPointName[]
} {
  return SEMANTIC_POINT_SET_DEFINITIONS[pointSetId] ?? SEMANTIC_POINT_SET_DEFINITIONS["8pt_basic"]
}

function buildSemanticPointSetSummary(pointSetId: SemanticPointSetId): SemanticPointSetSummary {
  const pointSet = getSemanticPointSet(pointSetId)
  return {
    id: pointSet.id,
    pointCount: pointSet.pointIds.length,
    pointIds: [...pointSet.pointIds],
    indexMapping: Object.fromEntries(
      pointSet.pointIds.map((pointId) => [
        pointId,
        SEMANTIC_DEFINITIONS.find((definition) => definition.name === pointId)?.primaryIndices ?? [],
      ]),
    ) as Record<SemanticPointName, number[]>,
  }
}

function expandParameterOrderForSemanticPointSet(
  parameters: LocalSearchParameter[],
  pointSetId: SemanticPointSetId,
): LocalSearchParameter[] {
  const activeZParameters = getSemanticPointSet(pointSetId).pointIds.map(
    (pointId) => `${pointId}.z` as LocalSearchParameter,
  )
  const next = parameters.filter(
    (parameter) => !parameter.endsWith(".z") || activeZParameters.includes(parameter),
  )
  for (const parameter of activeZParameters) {
    if (!next.includes(parameter)) {
      next.push(parameter)
    }
  }
  return next
}

const LOCAL_SEARCH_PARAMETERS: LocalSearchParameter[] = [
  "pivotZ",
  "rotationCenter.y",
  "rotationCenter.z",
  "headTop.z",
  "chin.z",
  "leftCheek.z",
  "rightCheek.z",
  "leftEye.z",
  "rightEye.z",
  "nose.z",
  "mouth.z",
  "noseBridge.z",
  "leftJaw.z",
  "rightJaw.z",
  "upperFaceCenter.z",
  "leftNoseSide.z",
  "rightNoseSide.z",
  "leftEyeOuter.z",
  "rightEyeOuter.z",
  "leftEyeInner.z",
  "rightEyeInner.z",
  "leftTemple.z",
  "rightTemple.z",
  "leftMouthCorner.z",
  "rightMouthCorner.z",
  "lowerJawLeft.z",
  "lowerJawRight.z",
]

const OBJECTIVE_MODES: ObjectiveMode[] = [
  "totalScore",
  "balancedScore",
  "maxBucketScore",
  "pitchAverageScore",
  "yawAverageScore",
]

const DEFAULT_COORDINATE_DESCENT_PARAMETER_ORDER: LocalSearchParameter[] = [
  "rotationCenter.y",
  "rotationCenter.z",
  "leftCheek.z",
  "rightCheek.z",
  "nose.z",
  "mouth.z",
  "leftEye.z",
  "rightEye.z",
  "headTop.z",
  "chin.z",
  "noseBridge.z",
  "leftJaw.z",
  "rightJaw.z",
  "upperFaceCenter.z",
  "leftNoseSide.z",
  "rightNoseSide.z",
  "leftEyeOuter.z",
  "rightEyeOuter.z",
  "leftEyeInner.z",
  "rightEyeInner.z",
  "leftTemple.z",
  "rightTemple.z",
  "leftMouthCorner.z",
  "rightMouthCorner.z",
  "lowerJawLeft.z",
  "lowerJawRight.z",
]

const ROTATION_CENTER_ONLY_PARAMETER_ORDER: LocalSearchParameter[] = [
  "rotationCenter.y",
  "rotationCenter.z",
]

const BASELINE_CHEEK_DEPTH_CANDIDATE: FittingCandidate8 = {
  pivotZ: 0.12,
  zByPointId: completeSemanticZ({
    headTop: 0,
    chin: 0,
    leftCheek: 0.12,
    rightCheek: 0.12,
    leftEye: 0,
    rightEye: 0,
    nose: 0,
    mouth: 0,
  }),
}

const CURRENT_FINE_BEST_CANDIDATE: FittingCandidate8 = {
  pivotZ: 0.09,
  zByPointId: completeSemanticZ({
    headTop: 0.01,
    chin: 0.01,
    leftCheek: 0.06,
    rightCheek: 0.06,
    leftEye: 0.03,
    rightEye: 0.03,
    nose: 0.06,
    mouth: 0.06,
  }),
}

const PITCH_FOCUS_RAW_BEST: FittingCandidate8 = {
  pivotZ: 0.075,
  zByPointId: completeSemanticZ({
    headTop: 0,
    chin: 0,
    leftCheek: 0.03,
    rightCheek: 0.03,
    leftEye: 0.05,
    rightEye: 0.03,
    nose: 0.08,
    mouth: 0.05,
  }),
}

const NATURAL_NOSE_CANDIDATE: FittingCandidate8 = {
  pivotZ: 0.075,
  zByPointId: completeSemanticZ({
    headTop: 0,
    chin: 0,
    leftCheek: 0.03,
    rightCheek: 0.03,
    leftEye: 0.05,
    rightEye: 0.03,
    nose: 0.02,
    mouth: 0.05,
  }),
}

const ROTATION_CENTER_DEBUG_BEST: FittingCandidate8 = {
  pivotZ: 0.04,
  rotationCenter: {
    x: 0,
    y: -0.08,
    z: 0.04,
  },
  zByPointId: completeSemanticZ({
    headTop: 0,
    chin: 0,
    leftCheek: 0.03,
    rightCheek: 0.03,
    leftEye: 0.05,
    rightEye: 0.03,
    nose: 0.08,
    mouth: 0.05,
  }),
}

const NATURAL_NOSE_WITH_ROTATION_CENTER: FittingCandidate8 = {
  pivotZ: 0.04,
  rotationCenter: {
    x: 0,
    y: -0.08,
    z: 0.04,
  },
  zByPointId: completeSemanticZ({
    headTop: 0,
    chin: 0,
    leftCheek: 0.03,
    rightCheek: 0.03,
    leftEye: 0.05,
    rightEye: 0.03,
    nose: 0.02,
    mouth: 0.05,
  }),
}

const DEFAULT_LOCAL_SEARCH_BASE_CANDIDATE = BASELINE_CHEEK_DEPTH_CANDIDATE
const JAW_BOUNDARY_SEMANTIC_Z_RANGE_OVERRIDES = [
  { pointId: "chin", oldMin: -0.03, newMin: -0.05 },
  { pointId: "leftJaw", oldMin: 0, newMin: -0.03 },
  { pointId: "rightJaw", oldMin: 0, newMin: -0.03 },
] satisfies RangeExpansionSummary["semanticPointRangeOverrides"]

const EXPANDED_CHIN_Z_SEARCH_RANGE: LocalSearchRange = { min: -0.05, max: 0.03, step: 0.01 }
const EXPANDED_JAW_SIDE_Z_SEARCH_RANGE: LocalSearchRange = { min: -0.03, max: 0.08, step: 0.01 }

const DEFAULT_COORDINATE_DESCENT_RANGES: LocalSearchRanges = {
  pivotZ: { min: 0.06, max: 0.18, step: 0.01 },
  "rotationCenter.y": { min: -0.24, max: 0, step: 0.01 },
  "rotationCenter.z": { min: 0.02, max: 0.12, step: 0.01 },
  "headTop.z": { min: -0.02, max: 0.03, step: 0.01 },
  "chin.z": EXPANDED_CHIN_Z_SEARCH_RANGE,
  "leftCheek.z": { min: 0.02, max: 0.08, step: 0.01 },
  "rightCheek.z": { min: 0.02, max: 0.08, step: 0.01 },
  "leftEye.z": { min: 0, max: 0.06, step: 0.01 },
  "rightEye.z": { min: 0, max: 0.06, step: 0.01 },
  "nose.z": { min: -0.02, max: 0.08, step: 0.01 },
  "mouth.z": { min: 0, max: 0.08, step: 0.01 },
  "noseBridge.z": { min: 0, max: 0.08, step: 0.01 },
  "leftJaw.z": EXPANDED_JAW_SIDE_Z_SEARCH_RANGE,
  "rightJaw.z": EXPANDED_JAW_SIDE_Z_SEARCH_RANGE,
  "upperFaceCenter.z": { min: -0.01, max: 0.06, step: 0.01 },
  "leftNoseSide.z": { min: 0, max: 0.08, step: 0.01 },
  "rightNoseSide.z": { min: 0, max: 0.08, step: 0.01 },
  "leftEyeOuter.z": { min: 0, max: 0.06, step: 0.01 },
  "rightEyeOuter.z": { min: 0, max: 0.06, step: 0.01 },
  "leftEyeInner.z": { min: 0, max: 0.06, step: 0.01 },
  "rightEyeInner.z": { min: 0, max: 0.06, step: 0.01 },
  "leftTemple.z": { min: -0.01, max: 0.06, step: 0.01 },
  "rightTemple.z": { min: -0.01, max: 0.06, step: 0.01 },
  "leftMouthCorner.z": { min: 0, max: 0.08, step: 0.01 },
  "rightMouthCorner.z": { min: 0, max: 0.08, step: 0.01 },
  "lowerJawLeft.z": { min: 0, max: 0.08, step: 0.01 },
  "lowerJawRight.z": { min: 0, max: 0.08, step: 0.01 },
}

const YAW_FOCUS_COORDINATE_DESCENT_RANGES: LocalSearchRanges = {
  pivotZ: { min: 0.1, max: 0.18, step: 0.01 },
  "rotationCenter.y": { min: -0.24, max: 0, step: 0.01 },
  "rotationCenter.z": { min: 0.02, max: 0.12, step: 0.01 },
  "headTop.z": { min: -0.02, max: 0.03, step: 0.01 },
  "chin.z": { min: -0.02, max: 0.03, step: 0.01 },
  "leftCheek.z": { min: 0.08, max: 0.18, step: 0.01 },
  "rightCheek.z": { min: 0.08, max: 0.18, step: 0.01 },
  "leftEye.z": { min: -0.02, max: 0.03, step: 0.01 },
  "rightEye.z": { min: -0.02, max: 0.03, step: 0.01 },
  "nose.z": { min: -0.06, max: 0.03, step: 0.01 },
  "mouth.z": { min: -0.02, max: 0.04, step: 0.01 },
  "noseBridge.z": { min: -0.03, max: 0.04, step: 0.01 },
  "leftJaw.z": { min: 0.03, max: 0.12, step: 0.01 },
  "rightJaw.z": { min: 0.03, max: 0.12, step: 0.01 },
  "upperFaceCenter.z": { min: -0.02, max: 0.04, step: 0.01 },
  "leftNoseSide.z": { min: -0.02, max: 0.06, step: 0.01 },
  "rightNoseSide.z": { min: -0.02, max: 0.06, step: 0.01 },
  "leftEyeOuter.z": { min: -0.02, max: 0.04, step: 0.01 },
  "rightEyeOuter.z": { min: -0.02, max: 0.04, step: 0.01 },
  "leftEyeInner.z": { min: -0.02, max: 0.04, step: 0.01 },
  "rightEyeInner.z": { min: -0.02, max: 0.04, step: 0.01 },
  "leftTemple.z": { min: -0.02, max: 0.05, step: 0.01 },
  "rightTemple.z": { min: -0.02, max: 0.05, step: 0.01 },
  "leftMouthCorner.z": { min: -0.02, max: 0.04, step: 0.01 },
  "rightMouthCorner.z": { min: -0.02, max: 0.04, step: 0.01 },
  "lowerJawLeft.z": { min: 0.03, max: 0.12, step: 0.01 },
  "lowerJawRight.z": { min: 0.03, max: 0.12, step: 0.01 },
}

const PITCH_FOCUS_COORDINATE_DESCENT_RANGES: LocalSearchRanges = {
  pivotZ: { min: 0.04, max: 0.12, step: 0.01 },
  "rotationCenter.y": { min: -0.24, max: 0, step: 0.01 },
  "rotationCenter.z": { min: 0.02, max: 0.12, step: 0.01 },
  "headTop.z": { min: 0, max: 0.04, step: 0.01 },
  "chin.z": { min: 0, max: 0.04, step: 0.01 },
  "leftCheek.z": { min: 0.03, max: 0.08, step: 0.01 },
  "rightCheek.z": { min: 0.03, max: 0.08, step: 0.01 },
  "leftEye.z": { min: 0.01, max: 0.05, step: 0.01 },
  "rightEye.z": { min: 0.01, max: 0.05, step: 0.01 },
  "nose.z": { min: 0.03, max: 0.09, step: 0.01 },
  "mouth.z": { min: 0.03, max: 0.09, step: 0.01 },
  "noseBridge.z": { min: 0.02, max: 0.08, step: 0.01 },
  "leftJaw.z": { min: 0.02, max: 0.08, step: 0.01 },
  "rightJaw.z": { min: 0.02, max: 0.08, step: 0.01 },
  "upperFaceCenter.z": { min: 0, max: 0.05, step: 0.01 },
  "leftNoseSide.z": { min: 0.02, max: 0.08, step: 0.01 },
  "rightNoseSide.z": { min: 0.02, max: 0.08, step: 0.01 },
  "leftEyeOuter.z": { min: 0.01, max: 0.05, step: 0.01 },
  "rightEyeOuter.z": { min: 0.01, max: 0.05, step: 0.01 },
  "leftEyeInner.z": { min: 0.01, max: 0.05, step: 0.01 },
  "rightEyeInner.z": { min: 0.01, max: 0.05, step: 0.01 },
  "leftTemple.z": { min: 0, max: 0.05, step: 0.01 },
  "rightTemple.z": { min: 0, max: 0.05, step: 0.01 },
  "leftMouthCorner.z": { min: 0.03, max: 0.09, step: 0.01 },
  "rightMouthCorner.z": { min: 0.03, max: 0.09, step: 0.01 },
  "lowerJawLeft.z": { min: 0.02, max: 0.08, step: 0.01 },
  "lowerJawRight.z": { min: 0.02, max: 0.08, step: 0.01 },
}

const ROTATION_CENTER_FINE_RANGES: LocalSearchRanges = {
  ...DEFAULT_COORDINATE_DESCENT_RANGES,
  "rotationCenter.y": { min: -0.24, max: 0, step: 0.005 },
  "rotationCenter.z": { min: 0.02, max: 0.12, step: 0.005 },
}

const SEARCH_PRESETS: SearchPresetDefinition[] = [
  {
    id: "coordinateDescentFine",
    label: "Coordinate Descent Fine",
    searchMode: "coordinateDescent",
    objectiveMode: "totalScore",
    targetParameter: "pivotZ",
    localMin: -0.06,
    localMax: 0.18,
    localStep: 0.01,
    coordinateDescentIterations: 2,
    coordinateDescentRanges: DEFAULT_COORDINATE_DESCENT_RANGES,
    description:
      "現在の baseCandidate を起点に、pivotZ と 8 semantic points の z を軽く再最適化します。",
  },
  {
    id: "rotationCenterFine",
    label: "Rotation Center Fine",
    searchMode: "coordinateDescent",
    objectiveMode: "totalScore",
    targetParameter: "rotationCenter.y",
    localMin: -0.24,
    localMax: 0,
    localStep: 0.005,
    coordinateDescentIterations: 2,
    coordinateDescentParameterOrder: ROTATION_CENTER_ONLY_PARAMETER_ORDER,
    coordinateDescentRanges: ROTATION_CENTER_FINE_RANGES,
    baseCandidatePresetId: "rotationCenterDebugBest",
    description:
      "rotationCenter.y / rotationCenter.z だけを coordinateDescent で細かく調整します。",
  },
  {
    id: "rotationCenter8PointFine",
    label: "Rotation Center + 8Point Fine",
    searchMode: "coordinateDescent",
    objectiveMode: "totalScore",
    targetParameter: "rotationCenter.y",
    localMin: -0.24,
    localMax: 0,
    localStep: 0.01,
    coordinateDescentIterations: 2,
    coordinateDescentParameterOrder: DEFAULT_COORDINATE_DESCENT_PARAMETER_ORDER,
    coordinateDescentRanges: DEFAULT_COORDINATE_DESCENT_RANGES,
    baseCandidatePresetId: "rotationCenterDebugBest",
    description:
      "rotationCenter.y / rotationCenter.z を先に調整し、その後 8 semantic points の z を再探索します。",
  },
  {
    id: "rotationCenterFineBalanced",
    label: "Rotation Center Fine - Balanced",
    searchMode: "coordinateDescent",
    objectiveMode: "balancedScore",
    targetParameter: "rotationCenter.y",
    localMin: -0.24,
    localMax: 0,
    localStep: 0.005,
    coordinateDescentIterations: 2,
    coordinateDescentParameterOrder: ROTATION_CENTER_ONLY_PARAMETER_ORDER,
    coordinateDescentRanges: ROTATION_CENTER_FINE_RANGES,
    baseCandidatePresetId: "rotationCenterDebugBest",
    description:
      "rotationCenter.y / rotationCenter.z を balancedScore 最小化で細かく調整します。",
  },
  {
    id: "rotationCenterFineMaxBucket",
    label: "Rotation Center Fine - MaxBucket",
    searchMode: "coordinateDescent",
    objectiveMode: "maxBucketScore",
    targetParameter: "rotationCenter.y",
    localMin: -0.24,
    localMax: 0,
    localStep: 0.005,
    coordinateDescentIterations: 2,
    coordinateDescentParameterOrder: ROTATION_CENTER_ONLY_PARAMETER_ORDER,
    coordinateDescentRanges: ROTATION_CENTER_FINE_RANGES,
    baseCandidatePresetId: "rotationCenterDebugBest",
    description:
      "rotationCenter.y / rotationCenter.z を maxBucketScore 最小化で細かく調整します。",
  },
  {
    id: "rotationCenter8PointFineBalanced",
    label: "Rotation Center + 8Point Fine - Balanced",
    searchMode: "coordinateDescent",
    objectiveMode: "balancedScore",
    targetParameter: "rotationCenter.y",
    localMin: -0.24,
    localMax: 0,
    localStep: 0.01,
    coordinateDescentIterations: 2,
    coordinateDescentParameterOrder: DEFAULT_COORDINATE_DESCENT_PARAMETER_ORDER,
    coordinateDescentRanges: DEFAULT_COORDINATE_DESCENT_RANGES,
    baseCandidatePresetId: "rotationCenterDebugBest",
    description:
      "rotationCenter.y / rotationCenter.z を先に調整し、その後 8 semantic points の z を balancedScore 最小化で再探索します。",
  },
  {
    id: "rotationCenter8PointFineMaxBucket",
    label: "Rotation Center + 8Point Fine - MaxBucket",
    searchMode: "coordinateDescent",
    objectiveMode: "maxBucketScore",
    targetParameter: "rotationCenter.y",
    localMin: -0.24,
    localMax: 0,
    localStep: 0.01,
    coordinateDescentIterations: 2,
    coordinateDescentParameterOrder: DEFAULT_COORDINATE_DESCENT_PARAMETER_ORDER,
    coordinateDescentRanges: DEFAULT_COORDINATE_DESCENT_RANGES,
    baseCandidatePresetId: "rotationCenterDebugBest",
    description:
      "rotationCenter.y / rotationCenter.z を先に調整し、その後 8 semantic points の z を maxBucketScore 最小化で再探索します。",
  },
  {
    id: "pivotZFine",
    label: "PivotZ Fine",
    searchMode: "localOneDimensional",
    objectiveMode: "totalScore",
    targetParameter: "pivotZ",
    localMin: 0.04,
    localMax: 0.14,
    localStep: 0.005,
    coordinateDescentIterations: 2,
    coordinateDescentRanges: DEFAULT_COORDINATE_DESCENT_RANGES,
    description:
      "現在の baseCandidate を固定し、pivotZ だけを 0.04〜0.14 / 0.005 刻みで探索します。",
  },
  {
    id: "noseZFine",
    label: "NoseZ Fine",
    searchMode: "localOneDimensional",
    objectiveMode: "totalScore",
    targetParameter: "nose.z",
    localMin: -0.04,
    localMax: 0.08,
    localStep: 0.005,
    coordinateDescentIterations: 2,
    coordinateDescentRanges: DEFAULT_COORDINATE_DESCENT_RANGES,
    description:
      "現在の baseCandidate を固定し、nose.z だけを -0.04〜0.08 / 0.005 刻みで探索します。",
  },
  {
    id: "leftCheekZFine",
    label: "LeftCheekZ Fine",
    searchMode: "localOneDimensional",
    objectiveMode: "totalScore",
    targetParameter: "leftCheek.z",
    localMin: 0.03,
    localMax: 0.12,
    localStep: 0.005,
    coordinateDescentIterations: 2,
    coordinateDescentRanges: DEFAULT_COORDINATE_DESCENT_RANGES,
    description:
      "現在の baseCandidate を固定し、leftCheek.z だけを 0.03〜0.12 / 0.005 刻みで探索します。",
  },
  {
    id: "rightCheekZFine",
    label: "RightCheekZ Fine",
    searchMode: "localOneDimensional",
    objectiveMode: "totalScore",
    targetParameter: "rightCheek.z",
    localMin: 0.03,
    localMax: 0.12,
    localStep: 0.005,
    coordinateDescentIterations: 2,
    coordinateDescentRanges: DEFAULT_COORDINATE_DESCENT_RANGES,
    description:
      "現在の baseCandidate を固定し、rightCheek.z だけを 0.03〜0.12 / 0.005 刻みで探索します。",
  },
  {
    id: "mouthZFine",
    label: "MouthZ Fine",
    searchMode: "localOneDimensional",
    objectiveMode: "totalScore",
    targetParameter: "mouth.z",
    localMin: 0,
    localMax: 0.08,
    localStep: 0.005,
    coordinateDescentIterations: 2,
    coordinateDescentRanges: DEFAULT_COORDINATE_DESCENT_RANGES,
    description:
      "現在の baseCandidate を固定し、mouth.z だけを 0〜0.08 / 0.005 刻みで探索します。",
  },
  {
    id: "yawFocusFine",
    label: "Yaw Focus Fine",
    searchMode: "coordinateDescent",
    objectiveMode: "totalScore",
    targetParameter: "pivotZ",
    localMin: -0.06,
    localMax: 0.18,
    localStep: 0.01,
    coordinateDescentIterations: 2,
    coordinateDescentRanges: YAW_FOCUS_COORDINATE_DESCENT_RANGES,
    baseCandidatePresetId: "baselineCheekDepth",
    description:
      "baselineCheekDepth を起点に、yawPositive / yawNegative 向けの coordinateDescent 範囲で確認します。",
  },
  {
    id: "pitchFocusFine",
    label: "Pitch Focus Fine",
    searchMode: "coordinateDescent",
    objectiveMode: "totalScore",
    targetParameter: "pivotZ",
    localMin: -0.06,
    localMax: 0.18,
    localStep: 0.01,
    coordinateDescentIterations: 2,
    coordinateDescentRanges: PITCH_FOCUS_COORDINATE_DESCENT_RANGES,
    baseCandidatePresetId: "currentFineBest",
    description:
      "currentFineBest を起点に、pitchPositive / pitchNegative 向けの coordinateDescent 範囲で確認します。",
  },
]

const AUTO_SEQUENCE_PRESETS: AutoSequenceDefinition[] = [
  {
    id: "fineSequence",
    label: "Fine Sequence",
    baseCandidatePresetId: "baselineCheekDepth",
    steps: [
      "coordinateDescentFine",
      "pivotZFine",
      "noseZFine",
      "leftCheekZFine",
      "rightCheekZFine",
      "mouthZFine",
    ],
    description:
      "Baseline Cheek Depth を起点に、基本の精密探索 preset を順番に実行します。",
  },
  {
    id: "currentBestFineSequence",
    label: "Current Best Fine Sequence",
    baseCandidatePresetId: "currentBestCandidate",
    steps: [
      "pivotZFine",
      "noseZFine",
      "leftCheekZFine",
      "rightCheekZFine",
      "mouthZFine",
    ],
    description:
      "現在の bestCandidate を起点に、1パラメータ確認 preset を続けて実行します。",
  },
  {
    id: "yawFocusSequence",
    label: "Yaw Focus Sequence",
    baseCandidatePresetId: "baselineCheekDepth",
    steps: ["yawFocusFine", "pivotZFine", "noseZFine"],
    description:
      "Baseline Cheek Depth を起点に、左右向き重視の確認 preset を実行します。",
  },
  {
    id: "pitchFocusSequence",
    label: "Pitch Focus Sequence",
    baseCandidatePresetId: "currentFineBest",
    steps: ["pitchFocusFine", "pivotZFine", "mouthZFine", "noseZFine"],
    description:
      "Current Fine Best を起点に、上下向き重視の確認 preset を実行します。",
  },
  {
    id: "rotationCenterFineSequence",
    label: "Rotation Center Fine Sequence",
    baseCandidatePresetId: "rotationCenterDebugBest",
    steps: ["rotationCenterFine", "rotationCenter8PointFine", "noseZFine", "mouthZFine"],
    description:
      "Rotation Center Debug Best を起点に、rotationCenter を先に調整してから 8点 z を再探索します。",
  },
  {
    id: "rotationCenterBalancedSequence",
    label: "Rotation Center Balanced Sequence",
    baseCandidatePresetId: "naturalNoseWithRotationCenter",
    steps: [
      "rotationCenterFineBalanced",
      "rotationCenter8PointFineBalanced",
      "noseZFine",
      "mouthZFine",
    ],
    description:
      "Rotation Center Debug Best を起点に、balancedScore 重視で rotationCenter と 8点 z を順番に探索します。",
  },
  {
    id: "rotationCenterMaxBucketSequence",
    label: "Rotation Center MaxBucket Sequence",
    baseCandidatePresetId: "rotationCenterDebugBest",
    steps: [
      "rotationCenterFineMaxBucket",
      "rotationCenter8PointFineMaxBucket",
      "noseZFine",
      "mouthZFine",
    ],
    description:
      "Rotation Center Debug Best を起点に、maxBucketScore 重視で一部姿勢だけ悪化する候補を確認します。",
  },
  {
    id: "naturalNoseRotationCenterSequence",
    label: "Natural Nose Rotation Center Sequence",
    baseCandidatePresetId: "naturalNoseWithRotationCenter",
    steps: ["rotationCenterFine", "rotationCenter8PointFine", "noseZFine", "mouthZFine"],
    description:
      "Natural Nose With Rotation Center を起点に、nose.z が自然寄りでも score が出るか確認します。",
  },
  {
    id: "naturalNoseBalancedSequence",
    label: "Natural Nose Balanced Sequence",
    baseCandidatePresetId: "naturalNoseWithRotationCenter",
    steps: [
      "rotationCenterFineBalanced",
      "rotationCenter8PointFineBalanced",
      "noseZFine",
      "mouthZFine",
    ],
    depthRelationFilteringOverride: {
      enabled: true,
      mode: "hardReject",
      applyToObjectiveScore: false,
    },
    description:
      "Natural Nose With Rotation Center を起点に、balancedScore 重視でどこに収束するか確認します。",
  },
  {
    id: "naturalNoseMaxBucketSequence",
    label: "Natural Nose MaxBucket Sequence",
    baseCandidatePresetId: "naturalNoseWithRotationCenter",
    steps: [
      "rotationCenterFineMaxBucket",
      "rotationCenter8PointFineMaxBucket",
      "noseZFine",
      "mouthZFine",
    ],
    depthRelationFilteringOverride: {
      enabled: true,
      mode: "hardReject",
      applyToObjectiveScore: false,
    },
    description:
      "Natural Nose With Rotation Center を起点に、maxBucketScore 重視でどこに収束するか確認します。",
  },
]

const BUCKETS: CaptureBucket[] = [
  "front",
  "yawPositive",
  "yawNegative",
  "pitchPositive",
  "pitchNegative",
  "mixedPose",
  "unknown",
]

const REQUIRED_BUCKETS: CaptureBucket[] = [
  "front",
  "yawPositive",
  "yawNegative",
  "pitchPositive",
  "pitchNegative",
]

const REQUESTED_BUCKET_TARGETS: RequestedBucketTarget[] = [
  "front",
  "yawPositive",
  "yawNegative",
  "pitchPositive",
  "pitchNegative",
  "mixedPose",
]

const PROJECTION_SIGN_DEBUG_BUCKETS: ProjectionSignDebugBucket[] = [
  "front",
  "yawPositive",
  "yawNegative",
  "pitchPositive",
  "pitchNegative",
]

const PROJECTION_SIGN_POINT_NAMES: ProjectionSignPointName[] = [
  "nose",
  "leftCheek",
  "rightCheek",
  "mouth",
]

const DEFAULT_PROJECTION_SIGN_NOSE_Z_CANDIDATES = [
  -0.04,
  -0.02,
  0,
  0.02,
  0.04,
  0.06,
  0.08,
]

const BUCKET_TARGET_PRESETS: BucketTargetPresetDefinition[] = [
  {
    id: "balanced5Each",
    label: "Balanced 5 each",
    targets: {
      front: 5,
      yawPositive: 5,
      yawNegative: 5,
      pitchPositive: 5,
      pitchNegative: 5,
      mixedPose: 0,
      unknown: 0,
    },
    includeMixedPose: false,
  },
  {
    id: "balanced8Each",
    label: "Balanced 8 each",
    targets: {
      front: 8,
      yawPositive: 8,
      yawNegative: 8,
      pitchPositive: 8,
      pitchNegative: 8,
      mixedPose: 0,
      unknown: 0,
    },
    includeMixedPose: false,
  },
  {
    id: "balanced10Each",
    label: "Balanced 10 each",
    targets: {
      front: 10,
      yawPositive: 10,
      yawNegative: 10,
      pitchPositive: 10,
      pitchNegative: 10,
      mixedPose: 0,
      unknown: 0,
    },
    includeMixedPose: false,
  },
]

const STABILITY_TARGET_PRESET_TO_BUCKET_PRESET: Record<
  StabilityTargetPresetId,
  BucketTargetPresetId
> = {
  "5each": "balanced5Each",
  "8each": "balanced8Each",
  "10each": "balanced10Each",
}

const STABILITY_SEQUENCE_IDS: StabilitySequencePresetId[] = [
  "rotationCenterBalancedSequence",
  "rotationCenterMaxBucketSequence",
  "naturalNoseBalancedSequence",
  "naturalNoseMaxBucketSequence",
]

const ROTATION_CENTER_DEBUG_BASE_LABELS: Record<RotationCenterDebugBaseCandidateId, string> = {
  currentBestCandidate: "Current bestCandidate",
  currentBaseCandidate: "Current baseCandidate",
  pitchFocusRawBest: "Pitch Focus raw best",
  naturalNoseCandidate: "Natural nose candidate",
}

const ROTATION_CENTER_PIVOT_X_CANDIDATES = [0]
const ROTATION_CENTER_PIVOT_Y_CANDIDATES = [-0.12, -0.08, -0.04, 0, 0.04, 0.08, 0.12]
const ROTATION_CENTER_PIVOT_Z_CANDIDATES = [0.04, 0.06, 0.08, 0.1, 0.12, 0.14, 0.16]

const DEFAULT_OUTLIER_FILTERING_SETTINGS: OutlierFilteringSettings = {
  enabled: false,
  mode: "debugOnly",
  perBucketMaxOutliers: 1,
  minBucketSampleCount: 8,
  method: "medianMultiplier",
  medianMultiplier: 1.75,
  absoluteDeltaThreshold: 0.015,
  topWorstPercent: 10,
  applyToObjectiveScore: false,
}

const DEFAULT_DEPTH_RELATION_GROUPS_8: DepthRelationGroup[] = [
  {
    id: "noseTip",
    label: "鼻先",
    pointIds: ["nose"],
    aggregation: "median",
  },
  {
    id: "cheeks",
    label: "左右頬",
    pointIds: ["leftCheek", "rightCheek"],
    aggregation: "mean",
  },
  {
    id: "faceCenter",
    label: "顔中心",
    pointIds: ["nose", "mouth", "leftEye", "rightEye"],
    aggregation: "median",
  },
  {
    id: "faceBoundary",
    label: "顔境界",
    pointIds: ["leftCheek", "rightCheek", "chin", "headTop"],
    aggregation: "median",
  },
]

const DEFAULT_DEPTH_RELATION_RULES_8: DepthRelationRule[] = [
  {
    id: "nose_tip_in_front_of_cheeks",
    label: "鼻先は左右頬より手前",
    subjectGroupId: "noseTip",
    referenceGroupId: "cheeks",
    relation: "inFrontOf",
    margin: 0.005,
    warningMargin: 0,
    weight: 1,
    mode: "hardReject",
  },
  {
    id: "face_center_in_front_of_boundary",
    label: "顔中心は顔境界より手前",
    subjectGroupId: "faceCenter",
    referenceGroupId: "faceBoundary",
    relation: "inFrontOf",
    margin: 0,
    warningMargin: 0,
    weight: 0.5,
    mode: "debugOnly",
  },
]

const DEFAULT_DEPTH_RELATION_FILTERING_SETTINGS: DepthRelationFilteringSettings = {
  enabled: true,
  mode: "debugOnly",
  applyToObjectiveScore: false,
  groups: DEFAULT_DEPTH_RELATION_GROUPS_8,
  rules: DEFAULT_DEPTH_RELATION_RULES_8,
  penaltyScale: 1,
  maxPenalty: 0.05,
}

const DEFAULT_SETTINGS: SearchSettings = {
  semanticPointSetId: DEFAULT_SEMANTIC_POINT_SET_ID,
  searchMode: "fullGrid",
  objectiveMode: "totalScore",
  outlierFiltering: DEFAULT_OUTLIER_FILTERING_SETTINGS,
  depthRelationFiltering: DEFAULT_DEPTH_RELATION_FILTERING_SETTINGS,
  maxFrames: 30,
  targets: {
    front: 5,
    yawPositive: 5,
    yawNegative: 5,
    pitchPositive: 5,
    pitchNegative: 5,
    mixedPose: 3,
    unknown: 0,
  },
  includeMixedPose: true,
  rollWarningDeg: 12,
  blendshapeWarningScore: 0.35,
  zMin: -0.24,
  zMax: 0.24,
  zStep: 0.24,
  pivotZMin: -0.48,
  pivotZMax: 0.48,
  pivotZStep: 0.24,
  topN: 20,
  focalLength: 2.6,
  localSearchSettings: {
    baseCandidate: DEFAULT_LOCAL_SEARCH_BASE_CANDIDATE,
    targetParameter: "leftCheek.z",
    localMin: 0.06,
    localMax: 0.18,
    localStep: 0.01,
    coordinateDescentIterations: 2,
    coordinateDescentParameterOrder: DEFAULT_COORDINATE_DESCENT_PARAMETER_ORDER,
    coordinateDescentRanges: DEFAULT_COORDINATE_DESCENT_RANGES,
  },
}

const DEFAULT_DEPTH_478_INTERPOLATION_SETTINGS: DepthInterpolationSettings = {
  enabled: true,
  method: "inverseDistanceWeighting",
  epsilon: 0.0001,
  power: 2,
  clampZ: true,
  zMin: -0.24,
  zMax: 0.24,
}

const JAW_BOUNDARY_PER_LANDMARK_RANGE_OVERRIDES: PerLandmarkZSearchGroupRangeOverride[] = [
  {
    groupId: "jawGroup",
    lowerZRange: 0.02,
    upperZRange: 0.01,
  },
  {
    groupId: "faceBoundaryGroup",
    lowerZRange: 0.02,
    upperZRange: 0.01,
  },
]

const DEFAULT_PER_LANDMARK_Z_SEARCH_SETTINGS: PerLandmarkZSearchSettings = {
  enabled: true,
  targetIndices: "all478",
  zRange: 0.01,
  zStep: 0.0005,
  anchorZRange: 0.005,
  anchorZStep: 0.0005,
  groupRangeOverrides: JAW_BOUNDARY_PER_LANDMARK_RANGE_OVERRIDES,
  canonicalDeviationPenaltyWeight: 0.1,
}

const RANGE_EXPANSION_SUMMARY: RangeExpansionSummary = {
  semanticPointRangeOverrides: JAW_BOUNDARY_SEMANTIC_Z_RANGE_OVERRIDES.map((override) => ({
    ...override,
  })),
  perLandmarkRangeOverrides: JAW_BOUNDARY_PER_LANDMARK_RANGE_OVERRIDES.map((override) => ({
    ...override,
  })),
}

const CANONICAL_FACE_DEPTH_TEMPLATE =
  canonicalFaceDepthTemplate as unknown as CanonicalFaceDepthTemplateV1
const CANONICAL_FACE_DEPTH_TEMPLATE_FILE = "canonical-face-depth-template-v1.json" as const
const CANONICAL_COMPARISON_LANDMARK_COUNT = 468
const IRIS_DEPTH_FALLBACK_INDICES = [468, 469, 470, 471, 472, 473, 474, 475, 476, 477]
const PER_LANDMARK_Z_SEARCH_SAMPLE_INDICES = [
  4, 10, 13, 14, 33, 61, 98, 127, 133, 136, 152, 234, 263, 291, 327, 356, 362,
  365, 454,
]

const DEFAULT_DEPTH_478_SMOOTHNESS_THRESHOLD = 0.03
const DEPTH_478_NEIGHBOR_COUNT = 4
const DEPTH_478_MAX_HIGH_DELTA_EDGES = 50
const QUICK_DEPTH_478_NOSE_CHEEK_MARGIN = 0.005
const QUICK_478_DEPTH_DEBUG_WORKER_CHUNK_SIZE = 50

const QUICK_478_DEPTH_DEBUG_SETTINGS = {
  semanticPointSetId: QUICK_478_DEPTH_SEMANTIC_POINT_SET_ID,
  bucketPreset: "balanced10Each" as BucketTargetPresetId,
  autoSearchSequence: "rotationCenterBalancedSequence" as AutoSequencePresetId,
  depthRelationFiltering: {
    enabled: true,
    mode: "hardReject" as DepthRelationMode,
    applyToObjectiveScore: false,
  },
  outlierFiltering: {
    enabled: true,
    mode: "excludeFromInference" as OutlierFilteringMode,
    applyToObjectiveScore: true,
  },
  interpolation: {
    enabled: true,
    method: "canonicalDepthBased",
    epsilon: 0.0001,
    power: 2,
    clampZ: true,
    zMin: -0.24,
    zMax: 0.24,
  } satisfies DepthInterpolationSettings,
  perLandmarkZSearch: {
    ...DEFAULT_PER_LANDMARK_Z_SEARCH_SETTINGS,
    targetIndices: "canonical468Only" as const,
  },
  smoothnessThreshold: 0.03,
}

const QUICK_478_DEPTH_DEBUG_SETTINGS_SUMMARY = {
  semanticPointSetId: "12pt_rotation_center" as const,
  bucketPreset: "balanced_10_each" as const,
  autoSearchSequence: "rotation_center_balanced" as const,
  depthRelationMode: "hardReject" as const,
  depth478GenerationMethod: "canonicalDepthBased" as const,
  perLandmarkZSearchEnabled: true,
  interpolationMethod: "canonicalDepthBased" as const,
}

const CANONICAL_COMPATIBLE_8PT = {
  headTop: [10],
  chin: [152],
  leftCheek: [234],
  rightCheek: [454],
  leftEye: [263, 362],
  rightEye: [33, 133],
  nose: [4],
  mouth: [13, 14],
} satisfies Record<CanonicalCompatible8PointId, number[]>

const CANONICAL_COMPATIBLE_8PT_POINT_IDS = Object.keys(
  CANONICAL_COMPATIBLE_8PT,
) as CanonicalCompatible8PointId[]

const CANONICAL_COMPATIBLE_12PT = {
  headTop: [10],
  chin: [152],
  leftCheek: [234],
  rightCheek: [454],
  leftEye: [263, 362],
  rightEye: [33, 133],
  nose: [4],
  mouth: [13, 14],
  noseBridge: [6, 168, 197, 195],
  leftJaw: [172],
  rightJaw: [397],
  upperFaceCenter: [168],
} satisfies Record<(typeof ROTATION_CENTER_12_SEMANTIC_POINT_NAMES)[number], number[]>

const BRUTEFORCE_8PT_CANONICAL_RANGES = {
  headTop: [-0.02, 0, 0.02],
  chin: [-0.05, -0.03, -0.01, 0.01],
  leftCheek: [0.02, 0.04, 0.06],
  rightCheek: [0.02, 0.04, 0.06],
  leftEye: [0, 0.02, 0.04],
  rightEye: [0, 0.02, 0.04],
  nose: [-0.02, 0, 0.02, 0.04],
  mouth: [0, 0.02, 0.04, 0.06],
} satisfies Record<CanonicalCompatible8PointId, number[]>

const BRUTEFORCE_8PT_CANONICAL_TOP_N = 20
const BRUTEFORCE_8PT_CHIN_TOO_FRONT_MARGIN = 0.03
const BRUTEFORCE_8PT_JAW_CHEEK_MARGIN = 0.03
const STRUCTURE_AWARE_CORRELATION_WARNING_THRESHOLD = 0.25
const STRUCTURE_AWARE_CORRELATION_NEGATIVE_PENALTY = 0.05
const STRUCTURE_AWARE_CANONICAL_AVERAGE_DELTA_FREE = 0.03
const STRUCTURE_AWARE_CANONICAL_MAX_DELTA_FREE = 0.08
const STRUCTURE_AWARE_BOUND_HIT_PENALTY = 0.002
const STRUCTURE_AWARE_IMPORTANT_BOUND_HIT_PENALTY = 0.006
const STRUCTURE_AWARE_TOP_N = 20

const DEPTH_478_GROUP_DEFINITIONS: Array<{
  groupId: string
  label: string
  pointIndices: number[]
  aggregation: DepthRelationAggregation
}> = [
  { groupId: "noseTipGroup", label: "鼻先グループ", pointIndices: [1, 2, 4, 5, 98, 327], aggregation: "median" },
  { groupId: "noseBridgeGroup", label: "鼻筋グループ", pointIndices: [6, 168, 197, 195], aggregation: "median" },
  {
    groupId: "leftCheekGroup",
    label: "左頬グループ",
    pointIndices: [50, 100, 101, 117, 118, 119, 123, 132, 147, 187, 203, 205, 234],
    aggregation: "median",
  },
  {
    groupId: "rightCheekGroup",
    label: "右頬グループ",
    pointIndices: [329, 330, 346, 347, 348, 352, 361, 376, 411, 423, 425, 454],
    aggregation: "median",
  },
  {
    groupId: "mouthGroup",
    label: "口グループ",
    pointIndices: [
      0, 13, 14, 17, 37, 39, 40, 61, 78, 80, 81, 82, 87, 88, 91, 95, 146, 178, 181, 185,
      191, 267, 269, 270, 291, 308, 310, 311, 312, 317, 318, 321, 324, 375, 402, 405,
      409, 415,
    ],
    aggregation: "median",
  },
  { groupId: "leftEyeGroup", label: "左目グループ", pointIndices: [249, 263, 362, 373, 374, 380, 381, 382, 384, 385, 386, 387, 388, 390, 398, 466, 469, 470, 471, 472], aggregation: "median" },
  { groupId: "rightEyeGroup", label: "右目グループ", pointIndices: [7, 33, 133, 144, 145, 153, 154, 155, 157, 158, 159, 160, 161, 163, 173, 246, 474, 475, 476, 477], aggregation: "median" },
  { groupId: "jawGroup", label: "顎グループ", pointIndices: [58, 132, 136, 148, 149, 150, 152, 172, 176, 288, 361, 365, 377, 378, 379, 397, 400], aggregation: "median" },
  {
    groupId: "faceBoundaryGroup",
    label: "顔境界グループ",
    pointIndices: [
      10, 21, 54, 58, 67, 93, 103, 109, 127, 132, 136, 148, 149, 150, 152, 162, 172,
      176, 234, 251, 284, 288, 297, 323, 332, 338, 356, 361, 365, 377, 378, 379, 389,
      397, 400, 454,
    ],
    aggregation: "median",
  },
]

const DEFAULT_DEPTH_478_GROUP_CORRECTIONS: DepthGroupCorrection[] =
  DEPTH_478_GROUP_DEFINITIONS.map((group) => ({
    groupId: group.groupId,
    label: group.label,
    pointIndices: group.pointIndices,
    offset: 0,
    strength: 0,
  }))

const EPSILON = 1e-8
const DEPTH_CONVENTION: DepthConvention = {
  smallerZ: "front / 手前",
  largerZ: "back / 奥",
  note: "このラボでは z が小さいほど手前、z が大きいほど奥として扱います。",
}
const CURRENT8_COORDINATE_SPACE: Current8CoordinateSpace = {
  rawImageNormalizedPoints: "mediapipe_image_normalized_xy_v1",
  sameUnitPoints: "bae_ar_fitting_lab_same_unit_xy_v1",
  points: "sameUnitPoints / fitting input space",
}

function createIdleSearchProgress(): SearchProgressState {
  return {
    status: "idle",
    processedCandidateCount: 0,
    estimatedCandidateCount: 0,
    progressRate: 0,
    startedAt: null,
    updatedAt: null,
    message: null,
  }
}

function createIdleAutoSequence(): AutoSequenceState {
  return {
    status: "idle",
    definition: null,
    bucketTargetPreset: null,
    currentStepIndex: 0,
    startedAt: null,
    completedAt: null,
    steps: [],
    finalCandidate: null,
    currentBestScore: null,
    message: null,
  }
}

function createIdleStabilityCheck(): StabilityCheckState {
  return {
    status: "idle",
    targetPresetIds: [],
    sequenceId: null,
    currentIndex: 0,
  }
}

function createIdleQuick478DepthDebug(): Quick478DepthDebugState {
  return {
    status: "idle",
    message: null,
    startedAt: null,
    completedAt: null,
    quickRun: null,
  }
}

const state: AppState = {
  fileName: null,
  payload: null,
  frames: [],
  analysis: null,
  searchWorker: null,
  searchProgress: createIdleSearchProgress(),
  coordinateDescentParameterOrder: DEFAULT_COORDINATE_DESCENT_PARAMETER_ORDER,
  coordinateDescentRanges: DEFAULT_COORDINATE_DESCENT_RANGES,
  autoSequence: createIdleAutoSequence(),
  autoSequenceLastAnalysis: null,
  stabilityHistory: [],
  stabilityCheck: createIdleStabilityCheck(),
  quick478DepthDebug: createIdleQuick478DepthDebug(),
  quickSemanticPointSetComparison: null,
  presetMessage: null,
  importMessage: null,
  copyMessage: null,
}

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <main class="app">
    <header class="header">
      <div class="title-block">
        <h1>理想顔フィッティング検証ラボ</h1>
        <p>正面基準 x / y を固定し、8 semantic points それぞれの z と pivotZ だけを探索して、capture frame の current 2D landmarks 8点との誤差でランキングする検証ラボです。</p>
      </div>
      <div class="status-pill">debug lab / production asset ではありません</div>
    </header>

    <section class="notice">
      この tool は正式な IdealFace asset 作成ツールではありません。alignmentMode / weighted_similarity_2d / zProfile / zScale は今回の主導線から外し、8点の z と pivotZ の候補を pose へ回転・投影して評価します。
      <ul>
        <li>対象は 8 semantic points: 頭頂、顎、左右頬、左右目、鼻、口です。</li>
        <li>Runtime Projection / Studio Projection / IdealFace Authoring Tool Step 2-I は変更しません。</li>
        <li>current 2D landmarks は各 frame の顔 bounds center を原点にした same-unit 座標で比較します。</li>
      </ul>
    </section>

    <section class="panel">
      <h2>478 Depth Hard Reject Debug</h2>
      <p class="panel-help">capture JSON を読み込み、Rotation Center Balanced Sequence / Balanced 10 each / Depth Relation hardReject / Outlier Filtering enabled 固定で 478点奥行き debug JSON を自動ダウンロードします。production asset export ではありません。</p>
      <input id="capture-file-input" type="file" accept="application/json,.json" />
      <div class="controls-wide">
        <button id="run-quick-depth-478-button" class="primary" type="button">Run 478 Depth Hard Reject Debug（478点奥行き hardReject デバッグを実行）</button>
      </div>
      <p id="import-message" class="copy-status"></p>
      <div id="quick-depth-478-status" class="auto-sequence-status">capture JSON を読み込んでから実行してください。</div>
      <div id="quick-depth-478-summary" class="summary-grid"></div>
    </section>

    <details id="advanced-debug-ui" class="advanced-debug-ui">
      <summary>Advanced Settings / Debug UI</summary>
    <div class="layout">
      <div class="stack">
        <section class="panel">
          <h2>入力</h2>
          <p class="panel-help">capture JSON は上の主入力から読み込みます。ここには従来の手動解析ボタンだけを残しています。</p>
          <div class="controls-wide">
            <button id="run-analysis-button" class="primary" type="button" disabled>解析実行</button>
            <button id="cancel-analysis-button" type="button" disabled>キャンセル</button>
            <button id="copy-debug-button" type="button" disabled>デバッグ情報をコピー</button>
          </div>
          <p id="copy-message" class="copy-status"></p>
        </section>

        <section class="panel">
          <h2>探索設定</h2>
          <div class="preset-box">
            <div class="controls">
              <label>Search Preset
                <select id="search-preset-select">
                  ${SEARCH_PRESETS.map(
                    (preset) => `<option value="${preset.id}">${preset.label}</option>`,
                  ).join("")}
                </select>
              </label>
              <label>Base Candidate Preset
                <select id="base-candidate-preset-select">
                  <option value="baselineCheekDepth">Baseline Cheek Depth</option>
                  <option value="currentFineBest">Current Fine Best</option>
                  <option value="rotationCenterDebugBest">Rotation Center Debug Best</option>
                  <option value="naturalNoseWithRotationCenter">Natural Nose With Rotation Center</option>
                  <option value="currentBestCandidate">Current bestCandidate</option>
                </select>
              </label>
            </div>
            <div class="controls-wide">
              <button id="apply-search-preset-button" type="button">Apply Preset</button>
              <button id="apply-base-candidate-preset-button" type="button">Base Candidate を適用</button>
            </div>
            <div class="controls">
              <label>Auto Search Sequence
                <select id="auto-sequence-select">
                  ${AUTO_SEQUENCE_PRESETS.map(
                    (sequence) => `<option value="${sequence.id}">${sequence.label}</option>`,
                  ).join("")}
                </select>
              </label>
            </div>
            <div class="controls-wide">
              <button id="run-auto-sequence-button" class="primary" type="button" disabled>Run Auto Sequence</button>
              <button id="cancel-auto-sequence-button" type="button" disabled>Cancel Auto Sequence</button>
            </div>
            <div id="auto-sequence-status" class="auto-sequence-status"></div>
            <div class="controls">
              <label>Bucket Target Preset（姿勢分類ごとの評価フレーム数プリセット）
                <select id="bucket-target-preset-select">
                  ${BUCKET_TARGET_PRESETS.map(
                    (preset) => `<option value="${preset.id}">${preset.label}</option>`,
                  ).join("")}
                </select>
              </label>
            </div>
            <div class="controls-wide">
              <button id="apply-bucket-target-preset-button" type="button">Bucket Target Preset を適用</button>
            </div>
            <div id="bucket-target-warning" class="warning-list"></div>
            <div id="preset-message" class="preset-message">
              Search Preset を選び、Apply Preset で local search 設定をフォームへ反映します。
            </div>
            <div class="preset-steps">
              <strong>おすすめ手順:</strong>
              <ol>
                <li>Base Candidate Preset を選ぶ</li>
                <li>Search Preset を選ぶ</li>
                <li>Apply Preset</li>
                <li>Run Search</li>
                <li>結果が良ければ bestCandidate を base に反映</li>
                <li>次の preset を試す</li>
              </ol>
            </div>
          </div>
          <div class="controls">
            <label>maxFrames
              <input id="max-frames-input" type="number" min="1" max="120" value="${DEFAULT_SETTINGS.maxFrames}" />
            </label>
            <label>front target
              <input id="target-front-input" type="number" min="0" max="30" value="${DEFAULT_SETTINGS.targets.front}" />
            </label>
            <label>yawPositive target
              <input id="target-yaw-positive-input" type="number" min="0" max="30" value="${DEFAULT_SETTINGS.targets.yawPositive}" />
            </label>
            <label>yawNegative target
              <input id="target-yaw-negative-input" type="number" min="0" max="30" value="${DEFAULT_SETTINGS.targets.yawNegative}" />
            </label>
            <label>pitchPositive target
              <input id="target-pitch-positive-input" type="number" min="0" max="30" value="${DEFAULT_SETTINGS.targets.pitchPositive}" />
            </label>
            <label>pitchNegative target
              <input id="target-pitch-negative-input" type="number" min="0" max="30" value="${DEFAULT_SETTINGS.targets.pitchNegative}" />
            </label>
            <label>mixedPose target
              <input id="target-mixed-input" type="number" min="0" max="30" value="${DEFAULT_SETTINGS.targets.mixedPose}" />
            </label>
            <label>mixedPose
              <select id="include-mixed-select">
                <option value="true" selected>採用する</option>
                <option value="false">採用しない</option>
              </select>
            </label>
            <label>roll warning deg
              <input id="roll-warning-input" type="number" min="0" max="90" step="1" value="${DEFAULT_SETTINGS.rollWarningDeg}" />
            </label>
            <label>blendshape warning
              <input id="blendshape-warning-input" type="number" min="0" max="1" step="0.05" value="${DEFAULT_SETTINGS.blendshapeWarningScore}" />
            </label>
            <label>zMin
              <input id="z-min-input" type="number" min="-3" max="3" step="0.01" value="${DEFAULT_SETTINGS.zMin}" />
            </label>
            <label>zMax
              <input id="z-max-input" type="number" min="-3" max="3" step="0.01" value="${DEFAULT_SETTINGS.zMax}" />
            </label>
            <label>zStep
              <input id="z-step-input" type="number" min="0.001" max="3" step="0.01" value="${DEFAULT_SETTINGS.zStep}" />
            </label>
            <label>pivotZMin
              <input id="pivot-z-min-input" type="number" min="-3" max="3" step="0.01" value="${DEFAULT_SETTINGS.pivotZMin}" />
            </label>
            <label>pivotZMax
              <input id="pivot-z-max-input" type="number" min="-3" max="3" step="0.01" value="${DEFAULT_SETTINGS.pivotZMax}" />
            </label>
            <label>pivotZStep
              <input id="pivot-z-step-input" type="number" min="0.001" max="3" step="0.01" value="${DEFAULT_SETTINGS.pivotZStep}" />
            </label>
            <label>topN
              <input id="top-n-input" type="number" min="1" max="200" step="1" value="${DEFAULT_SETTINGS.topN}" />
            </label>
            <label>focalLength
              <input id="focal-length-input" type="number" min="0.5" max="10" step="0.1" value="${DEFAULT_SETTINGS.focalLength}" />
            </label>
            <label>searchMode
              <select id="search-mode-select">
                <option value="fullGrid" selected>fullGrid</option>
                <option value="localOneDimensional">localOneDimensional</option>
                <option value="coordinateDescent">coordinateDescent</option>
              </select>
            </label>
            <label>Objective Mode
              <select id="objective-mode-select">
                ${OBJECTIVE_MODES.map(
                  (mode) =>
                    `<option value="${mode}"${mode === DEFAULT_SETTINGS.objectiveMode ? " selected" : ""}>${mode}</option>`,
                ).join("")}
              </select>
            </label>
            <label>Outlier Filtering enabled
              <select id="outlier-enabled-select">
                <option value="false" selected>false</option>
                <option value="true">true</option>
              </select>
            </label>
            <label>Outlier mode
              <select id="outlier-mode-select">
                <option value="off">off</option>
                <option value="debugOnly" selected>debugOnly</option>
                <option value="excludeFromInference">excludeFromInference</option>
              </select>
            </label>
            <label>Outlier method
              <select id="outlier-method-select">
                <option value="medianMultiplier" selected>medianMultiplier</option>
                <option value="medianAbsoluteDelta">medianAbsoluteDelta</option>
                <option value="topWorstPercent">topWorstPercent</option>
              </select>
            </label>
            <label>perBucketMaxOutliers
              <input id="outlier-per-bucket-max-input" type="number" min="0" max="5" step="1" value="${DEFAULT_OUTLIER_FILTERING_SETTINGS.perBucketMaxOutliers}" />
            </label>
            <label>minBucketSampleCount
              <input id="outlier-min-bucket-sample-count-input" type="number" min="1" max="30" step="1" value="${DEFAULT_OUTLIER_FILTERING_SETTINGS.minBucketSampleCount}" />
            </label>
            <label>medianMultiplier
              <input id="outlier-median-multiplier-input" type="number" min="1" max="10" step="0.05" value="${DEFAULT_OUTLIER_FILTERING_SETTINGS.medianMultiplier}" />
            </label>
            <label>absoluteDeltaThreshold
              <input id="outlier-absolute-delta-threshold-input" type="number" min="0" max="1" step="0.001" value="${DEFAULT_OUTLIER_FILTERING_SETTINGS.absoluteDeltaThreshold}" />
            </label>
            <label>topWorstPercent
              <input id="outlier-top-worst-percent-input" type="number" min="0" max="100" step="1" value="${DEFAULT_OUTLIER_FILTERING_SETTINGS.topWorstPercent}" />
            </label>
            <label>applyToObjectiveScore
              <select id="outlier-apply-to-objective-select">
                <option value="false" selected>false</option>
                <option value="true">true</option>
              </select>
            </label>
            <label>Depth Relation Filtering enabled（奥行き関係フィルタリング有効）
              <select id="depth-relation-enabled-select">
                <option value="true" selected>true</option>
                <option value="false">false</option>
              </select>
            </label>
            <label>Depth Relation mode（奥行き関係モード）
              <select id="depth-relation-mode-select">
                <option value="off">off</option>
                <option value="debugOnly" selected>debugOnly</option>
                <option value="penalty">penalty</option>
                <option value="hardReject">hardReject</option>
              </select>
            </label>
            <label>Depth Relation applyToObjectiveScore（ペナルティを最適化スコアへ反映）
              <select id="depth-relation-apply-to-objective-select">
                <option value="false" selected>false</option>
                <option value="true">true</option>
              </select>
            </label>
            <label>Depth Relation penaltyScale（奥行き違反ペナルティ倍率）
              <input id="depth-relation-penalty-scale-input" type="number" min="0" max="10" step="0.1" value="${DEFAULT_DEPTH_RELATION_FILTERING_SETTINGS.penaltyScale}" />
            </label>
            <label>Depth Relation maxPenalty（奥行き違反ペナルティ上限）
              <input id="depth-relation-max-penalty-input" type="number" min="0" max="1" step="0.001" value="${DEFAULT_DEPTH_RELATION_FILTERING_SETTINGS.maxPenalty}" />
            </label>
            <label>localTargetParameter
              <select id="local-target-parameter-select">
                ${LOCAL_SEARCH_PARAMETERS.map(
                  (parameter) =>
                    `<option value="${parameter}"${parameter === DEFAULT_SETTINGS.localSearchSettings.targetParameter ? " selected" : ""}>${parameter}</option>`,
                ).join("")}
              </select>
            </label>
            <label>localMin
              <input id="local-min-input" type="number" min="-3" max="3" step="0.005" value="${DEFAULT_SETTINGS.localSearchSettings.localMin}" />
            </label>
            <label>localMax
              <input id="local-max-input" type="number" min="-3" max="3" step="0.005" value="${DEFAULT_SETTINGS.localSearchSettings.localMax}" />
            </label>
            <label>localStep
              <input id="local-step-input" type="number" min="0.001" max="3" step="0.005" value="${DEFAULT_SETTINGS.localSearchSettings.localStep}" />
            </label>
            <label>coordinateDescentIterations
              <input id="coordinate-descent-iterations-input" type="number" min="1" max="20" step="1" value="${DEFAULT_SETTINGS.localSearchSettings.coordinateDescentIterations}" />
            </label>
          </div>
          <p class="panel-help">Objective Mode は、探索中にどのスコアを最小化するかを選ぶ設定です。totalScore は従来挙動、maxBucketScore は一部姿勢だけ悪化する候補を避けるための確認用です。</p>
          <p class="panel-help">Outlier Frame Debug は、maxBucketScore を極端に悪化させているフレームを検出するための debug 機能です。score を良く見せるためではなく、MediaPipe の検出ズレ・強い表情・ブレなど、推定用に使うべきでない観測値を見つける目的で使います。</p>
          <h3>baseCandidate</h3>
          <div class="controls">
            <label>base legacy pivotZ / rotationCenter.z
              <input id="base-pivot-z-input" type="number" min="-3" max="3" step="0.005" value="${DEFAULT_LOCAL_SEARCH_BASE_CANDIDATE.pivotZ}" />
            </label>
            <label>base rotationCenter.x
              <input id="base-rotation-center-x-input" type="number" min="-3" max="3" step="0.005" value="0" />
            </label>
            <label>base rotationCenter.y
              <input id="base-rotation-center-y-input" type="number" min="-3" max="3" step="0.005" value="0" />
            </label>
            <label>base rotationCenter.z
              <input id="base-rotation-center-z-input" type="number" min="-3" max="3" step="0.005" value="${DEFAULT_LOCAL_SEARCH_BASE_CANDIDATE.pivotZ}" />
            </label>
            ${SEMANTIC_POINT_NAMES.map(
              (name) => `
                <label>base ${name}.z
                  <input id="base-${name}-z-input" type="number" min="-3" max="3" step="0.005" value="${DEFAULT_LOCAL_SEARCH_BASE_CANDIDATE.zByPointId[name]}" />
                </label>
              `,
            ).join("")}
          </div>
          <div class="controls-wide">
            <button id="use-best-candidate-button" type="button" disabled>bestCandidate を base に反映</button>
          </div>
        </section>

        <section class="panel">
          <h2>semantic point mapping</h2>
          <div id="semantic-index-table" class="table-wrap"></div>
        </section>
      </div>

      <div class="stack">
        <section class="panel">
          <h2>入力概要</h2>
          <div id="source-summary" class="summary-grid"></div>
        </section>

        <section class="panel">
          <h2>Result Summary</h2>
          <div id="result-summary" class="summary-grid"></div>
        </section>

        <section class="panel">
          <h2>探索進捗</h2>
          <div id="search-progress" class="summary-grid"></div>
        </section>

        <section class="panel">
          <h2>local search summary</h2>
          <div id="local-search-summary" class="summary-grid"></div>
        </section>

        <section class="panel">
          <h2>base8Points2D summary</h2>
          <div id="base-summary" class="summary-grid"></div>
        </section>

        <section class="panel">
          <h2>Current 8 Points Debug</h2>
          <p class="panel-help">current 8 points は MediaPipe が検出した現在顔478点から8つの意味点だけを取り出したものです。bestIdealFace8 ではありません。横向き時に現在顔8点が縦長になっているかを確認する debug です。</p>
          <div id="current8-overview" class="summary-grid"></div>
          <h3>front vs yaw comparison</h3>
          <div id="current8-pose-comparison" class="summary-grid"></div>
          <h3>bucket別 current8 summary</h3>
          <div id="current8-bucket-summary" class="table-wrap"></div>
          <h3>per-frame table</h3>
          <div id="current8-frame-table" class="table-wrap"></div>
        </section>

        <section class="panel">
          <h2>candidate ranking</h2>
          <div id="ranking-table" class="table-wrap"></div>
        </section>

        <section class="panel">
          <h2>Auto Sequence result</h2>
          <div id="auto-sequence-result" class="summary-grid"></div>
        </section>

        <section class="panel">
          <h2>Last single search result</h2>
          <div id="best-candidate" class="summary-grid"></div>
        </section>

        <section class="panel">
          <h2>Outlier Frame Debug</h2>
          <p class="panel-help">Outlier Frame Debug は、maxBucketScore を極端に悪化させているフレームを検出するための debug 機能です。score を良く見せるためではなく、MediaPipe の検出ズレ・強い表情・ブレなど、推定用に使うべきでない観測値を見つける目的で使います。</p>
          <h3>Outlier Filtering</h3>
          <div id="outlier-settings-summary" class="summary-grid"></div>
          <h3>Best Candidate Outlier Summary</h3>
          <div id="outlier-best-summary" class="summary-grid"></div>
          <h3>外れフレーム一覧</h3>
          <div id="outlier-frame-table" class="table-wrap"></div>
        </section>

        <section class="panel">
          <h2>Depth Relation Debug（奥行き関係デバッグ）</h2>
          <p class="panel-help">z が小さいほど手前、z が大きいほど奥として、中心側グループが境界側グループより手前にあるかを候補ごとに確認します。</p>
          <h3>Depth Relation Filtering（奥行き関係フィルタリング）</h3>
          <div id="depth-relation-settings-summary" class="summary-grid"></div>
          <h3>Best Candidate（最良候補）</h3>
          <div id="depth-relation-best-summary" class="summary-grid"></div>
          <div id="depth-relation-warning" class="warning-list"></div>
          <h3>Rules（ルール一覧）</h3>
          <div id="depth-relation-rule-table" class="table-wrap"></div>
          <h3>Rejected Candidates（除外候補）</h3>
          <div id="depth-relation-rejected-table" class="table-wrap"></div>
        </section>

        <section class="panel">
          <h2>478 Depth Prototype（478点奥行き試作）</h2>
          <p class="panel-help">8点候補を depth anchors として使い、478 landmarks の z を補間して評価する debug prototype です。最終 asset export ではありません。</p>
          <div class="controls">
            <label>candidate source（478点生成に使う8点候補）
              <select id="depth-478-source-select">
                <option value="autoSequenceFinalCandidate" selected>Use Auto Sequence Final Candidate（自動探索の最終候補を使う）</option>
                <option value="bestCandidate">Use Best Candidate（最良候補を使う）</option>
              </select>
            </label>
            <label>Interpolation method（8点から478点への奥行き補間方法）
              <select id="depth-478-method-select">
                <option value="inverseDistanceWeighting" selected>inverseDistanceWeighting</option>
                <option value="canonicalDepthBased">canonicalDepthBased（標準顔奥行きベース方式）</option>
              </select>
            </label>
            <label>epsilon（距離ゼロ除算を避ける微小値）
              <input id="depth-478-epsilon-input" type="number" min="0.000001" max="1" step="0.0001" value="${DEFAULT_DEPTH_478_INTERPOLATION_SETTINGS.epsilon}" />
            </label>
            <label>power（近い anchor をどれだけ強く効かせるか）
              <input id="depth-478-power-input" type="number" min="0.1" max="8" step="0.1" value="${DEFAULT_DEPTH_478_INTERPOLATION_SETTINGS.power}" />
            </label>
            <label>clampZ（補間後 z を zMin / zMax に制限）
              <select id="depth-478-clamp-z-select">
                <option value="true" selected>true</option>
                <option value="false">false</option>
              </select>
            </label>
            <label>zMin（z最小値）
              <input id="depth-478-z-min-input" type="number" min="-3" max="3" step="0.005" value="${DEFAULT_DEPTH_478_INTERPOLATION_SETTINGS.zMin}" />
            </label>
            <label>zMax（z最大値）
              <input id="depth-478-z-max-input" type="number" min="-3" max="3" step="0.005" value="${DEFAULT_DEPTH_478_INTERPOLATION_SETTINGS.zMax}" />
            </label>
            <label>smoothnessThreshold（近傍 z 差の警告しきい値）
              <input id="depth-478-smoothness-threshold-input" type="number" min="0" max="1" step="0.001" value="${DEFAULT_DEPTH_478_SMOOTHNESS_THRESHOLD}" />
            </label>
          </div>
          <div class="controls-wide">
            <button id="generate-depth-478-button" class="primary" type="button" disabled>Generate 478 Debug Candidate（478点デバッグ候補を生成）</button>
            <button id="export-depth-478-button" type="button" disabled>Export 478 Debug JSON（478点デバッグJSONを書き出し）</button>
          </div>
          <h3>Generated 478 Summary（生成478点概要）</h3>
          <div id="depth-478-summary" class="summary-grid"></div>
          <h3>478 Projection Evaluation（478点投影評価）</h3>
          <div id="depth-478-projection-evaluation" class="summary-grid"></div>
          <div id="depth-478-group-error-table" class="table-wrap"></div>
          <h3>478 Depth Relation Debug（478点奥行き関係デバッグ）</h3>
          <div id="depth-478-relation-debug" class="summary-grid"></div>
          <div id="depth-478-relation-rule-table" class="table-wrap"></div>
          <h3>478 Smoothness Debug（478点滑らかさデバッグ）</h3>
          <div id="depth-478-smoothness-debug" class="summary-grid"></div>
          <div id="depth-478-smoothness-edge-table" class="table-wrap"></div>
          <h3>canonicalDepthFitComparison</h3>
          <div id="canonical-depth-fit-comparison" class="table-wrap"></div>
          <h3>478 Candidate Comparison（478点候補比較）</h3>
          <div id="depth-478-candidate-comparison" class="table-wrap"></div>
        </section>

        <section class="panel">
          <h2>Projection Sign Debug</h2>
          <p class="panel-help">selected frame の各 bucket 先頭フレームを使い、baseCandidate の nose.z だけを変えて projection の符号と yaw / pitch 応答を確認します。score 式と bestCandidate 選定は変更しません。</p>
          <h3>selected frame by bucket</h3>
          <div id="projection-sign-selected-frames" class="table-wrap"></div>
          <h3>baseCandidate / nose.z candidates</h3>
          <div id="projection-sign-base" class="summary-grid"></div>
          <h3>summary by bucket</h3>
          <div id="projection-sign-summary" class="table-wrap"></div>
          <h3>table of projected nose / current nose / error</h3>
          <div id="projection-sign-table" class="table-wrap"></div>
          <h3>leftCheek / rightCheek / mouth JSON preview</h3>
          <pre id="projection-sign-json" class="json-preview"></pre>
        </section>

        <section class="panel">
          <h2>Rotation Center Debug</h2>
          <p class="panel-help">baseCandidate を固定し、debug 用の rotationCenter だけを pivotX / pivotY / pivotZ で差し替えて selected frames の score を比較します。score 式と bestCandidate 選定ロジックは変更しません。</p>
          <div class="controls">
            <label>Rotation Center Debug Base
              <select id="rotation-center-base-select">
                ${Object.entries(ROTATION_CENTER_DEBUG_BASE_LABELS).map(
                  ([id, label]) => `<option value="${id}">${label}</option>`,
                ).join("")}
              </select>
            </label>
          </div>
          <h3>base / candidates</h3>
          <div id="rotation-center-config" class="summary-grid"></div>
          <h3>best summary</h3>
          <div id="rotation-center-summary" class="summary-grid"></div>
          <h3>results table</h3>
          <div id="rotation-center-table" class="table-wrap"></div>
        </section>

        <section class="panel">
          <h2>Candidate Stability Debug（候補安定性デバッグ）</h2>
          <p class="panel-help">同じ Auto Sequence を 5件 / 8件 / 10件の bucket target で比較し、rotationCenter と z、score が評価フレーム数に対して安定するか確認します。</p>
          <div class="controls">
            <label>Stability Sequences
              <select id="stability-sequence-select">
                ${STABILITY_SEQUENCE_IDS.map((id) => {
                  const sequence = findAutoSequence(id)
                  return `<option value="${id}">${sequence.label}</option>`
                }).join("")}
              </select>
            </label>
          </div>
          <div class="checkbox-grid">
            <label><input id="stability-target-5-input" type="checkbox" checked /> 5 each</label>
            <label><input id="stability-target-8-input" type="checkbox" checked /> 8 each</label>
            <label><input id="stability-target-10-input" type="checkbox" checked /> 10 each</label>
          </div>
          <div class="controls-wide">
            <button id="run-stability-check-button" class="primary" type="button" disabled>Run Stability Check</button>
            <button id="add-stability-history-button" type="button" disabled>現在の結果を Stability History に追加</button>
            <button id="clear-stability-history-button" type="button">Stability History をクリア</button>
          </div>
          <div id="stability-check-status" class="auto-sequence-status"></div>
          <h3>Stability History Table（候補安定性履歴テーブル）</h3>
          <div id="stability-history-table" class="table-wrap"></div>
          <h3>Stability Summary</h3>
          <div id="stability-summary" class="table-wrap"></div>
        </section>

        <section class="panel">
          <h2>bestIdealFace8</h2>
          <p class="panel-help">正面基準 x / y と bestCandidate の z から作る 8点の IdealFace3D debug artifact です。</p>
          <div id="best-ideal-face8-summary" class="summary-grid"></div>
          <div id="best-ideal-face8-table" class="table-wrap"></div>
        </section>

        <section class="panel">
          <h2>depthRelation</h2>
          <div id="depth-relation" class="summary-grid"></div>
        </section>

        <section class="panel">
          <h2>bucket ranking</h2>
          <div id="bucket-ranking" class="table-wrap"></div>
        </section>

        <section class="panel">
          <h2>error summary</h2>
          <div id="error-summary" class="mini-grid"></div>
        </section>

        <section class="panel">
          <h2>warnings</h2>
          <div id="warnings" class="warning-list"></div>
        </section>

        <section class="panel">
          <h2>JSON preview</h2>
          <div class="controls-wide">
            <button id="export-full-button" type="button" disabled>Export Full Fitting JSON</button>
            <button id="export-summary-button" type="button" disabled>Export Summary JSON</button>
          </div>
          <pre id="json-preview" class="json-preview"></pre>
        </section>
      </div>
    </div>
    </details>
  </main>
`

renderSemanticMapping()
renderEmptyState()
renderSearchProgress()
renderAutoSequenceStatus()
renderBucketTargetWarning()
renderCandidateStabilityDebug()
renderQuick478DepthDebug()
bindEvents()

function bindEvents(): void {
  getElement<HTMLInputElement>("capture-file-input").addEventListener("change", handleFileImport)
  getElement<HTMLButtonElement>("run-quick-depth-478-button").addEventListener(
    "click",
    runQuick478DepthHardRejectDebug,
  )
  getElement<HTMLButtonElement>("run-analysis-button").addEventListener("click", runAnalysis)
  getElement<HTMLButtonElement>("cancel-analysis-button").addEventListener("click", cancelAnalysis)
  getElement<HTMLButtonElement>("copy-debug-button").addEventListener("click", copySummaryJson)
  getElement<HTMLButtonElement>("apply-search-preset-button").addEventListener(
    "click",
    applySearchPreset,
  )
  getElement<HTMLButtonElement>("apply-base-candidate-preset-button").addEventListener(
    "click",
    applySelectedBaseCandidatePreset,
  )
  getElement<HTMLButtonElement>("apply-bucket-target-preset-button").addEventListener(
    "click",
    applySelectedBucketTargetPreset,
  )
  getElement<HTMLButtonElement>("run-auto-sequence-button").addEventListener(
    "click",
    runAutoSequence,
  )
  getElement<HTMLButtonElement>("cancel-auto-sequence-button").addEventListener(
    "click",
    cancelAutoSequence,
  )
  getElement<HTMLButtonElement>("use-best-candidate-button").addEventListener(
    "click",
    useBestCandidateAsBase,
  )
  getElement<HTMLSelectElement>("rotation-center-base-select").addEventListener(
    "change",
    updateRotationCenterDebugFromSelection,
  )
  getElement<HTMLButtonElement>("generate-depth-478-button").addEventListener(
    "click",
    generateDepth478DebugCandidate,
  )
  getElement<HTMLButtonElement>("export-depth-478-button").addEventListener(
    "click",
    exportDepth478DebugJson,
  )
  getElement<HTMLButtonElement>("run-stability-check-button").addEventListener(
    "click",
    runStabilityCheck,
  )
  getElement<HTMLButtonElement>("add-stability-history-button").addEventListener(
    "click",
    addCurrentAnalysisToStabilityHistory,
  )
  getElement<HTMLButtonElement>("clear-stability-history-button").addEventListener(
    "click",
    clearStabilityHistory,
  )
  getElement<HTMLButtonElement>("export-full-button").addEventListener("click", () => {
    if (state.analysis) {
      downloadJson(state.analysis, createFileName("ideal-face-fitting-full"))
    }
  })
  getElement<HTMLButtonElement>("export-summary-button").addEventListener("click", () => {
    if (state.analysis) {
      downloadJson(createSummaryAnalysis(state.analysis), createFileName("ideal-face-fitting-summary"))
    }
  })
}

async function handleFileImport(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }

  terminateSearchWorker()
  state.searchProgress = createIdleSearchProgress()
  state.autoSequence = createIdleAutoSequence()
  state.autoSequenceLastAnalysis = null
  state.stabilityCheck = createIdleStabilityCheck()
  state.stabilityHistory = []
  state.quick478DepthDebug = createIdleQuick478DepthDebug()
  state.quickSemanticPointSetComparison = null

  try {
    const payload = JSON.parse(await file.text()) as unknown
    const captures = extractCaptures(payload)
    const settings = readSettings()
    const frames = captures.map((capture) => normalizeFrame(capture, settings))

    state.fileName = file.name
    state.payload = isRecord(payload) ? (payload as CapturesPayload) : { captures }
    state.frames = frames
    state.analysis = null
    state.searchProgress = createIdleSearchProgress()
    state.importMessage = `${file.name} を読み込みました: ${captures.length} captures`
    state.copyMessage = null
    setButtons()
    renderSourceOnly()
    renderSearchProgress()
    renderAutoSequenceStatus()
    renderBucketTargetWarning()
    renderCandidateStabilityDebug()
    renderQuick478DepthDebug()
  } catch (error) {
    state.importMessage = `読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`
    state.payload = null
    state.frames = []
    state.analysis = null
    state.searchProgress = createIdleSearchProgress()
    state.autoSequence = createIdleAutoSequence()
    state.autoSequenceLastAnalysis = null
    state.stabilityCheck = createIdleStabilityCheck()
    state.stabilityHistory = []
    state.quick478DepthDebug = createIdleQuick478DepthDebug()
    state.quickSemanticPointSetComparison = null
    setButtons()
    renderEmptyState()
    renderSearchProgress()
    renderAutoSequenceStatus()
    renderBucketTargetWarning()
    renderCandidateStabilityDebug()
    renderQuick478DepthDebug()
  }
}

function runAnalysis(settingsOverride?: SearchSettings): void {
  if (state.frames.length === 0 || state.searchProgress.status === "running") {
    return
  }

  const settings = settingsOverride ?? readSettings()
  const sourceSummary = summarizeSource(state.payload, state.frames)
  const selected = selectFrames(state.frames, settings)
  const base8Points2DSummary = buildBase8Points2D(selected.frames)
  const semanticPointSet = buildSemanticPointSetSummary(settings.semanticPointSetId)
  const current8Debug = buildCurrent8Debug(selected.frames, settings)
  const warnings = [
    ...selected.summary.warnings,
    ...state.frames.flatMap((frame) => frame.warnings),
    ...current8Debug.current8Warnings,
  ]

  if (!base8Points2DSummary.points) {
    state.analysis = {
      schemaVersion: "ideal_face_fitting_lab_analysis_v1",
      analysisVersion: "eight_point_grid_search_v1",
      generatedAt: new Date().toISOString(),
      lastRunType: state.stabilityCheck.status === "running" ? "stabilityCheck" : "singleSearch",
      sourceSummary,
      selectedFrameSummary: selected.summary,
      semanticPointSet,
      base8Points2DSummary,
      baseSemanticPoints2DSummary: base8Points2DSummary,
      current8Debug,
      current8PointsByFrame: current8Debug.current8PointsByFrame,
      current8BoundsByFrame: current8Debug.current8BoundsByFrame,
      current8MetricsByFrame: current8Debug.current8MetricsByFrame,
      current8BucketSummary: current8Debug.current8BucketSummary,
      current8PoseComparison: current8Debug.current8PoseComparison,
      depthConvention: DEPTH_CONVENTION,
      searchMode: settings.searchMode,
      searchSettings: settings,
      depthRelationFiltering: summarizeDepthRelationFilteringSettings(settings.depthRelationFiltering),
      localSearchSettings: settings.searchMode === "fullGrid" ? undefined : settings.localSearchSettings,
      localSearchSummary: undefined,
      scoreDebugSummary: null,
      candidateCount: 0,
      processedCandidateCount: 0,
      estimatedCandidateCount: 0,
      rawRanking: [],
      depthFilteredRanking: [],
      topCandidates: [],
      bestCandidate: null,
      bestIdealFace8: null,
      depthRelation: null,
      depthRelationDebug: buildAnalysisDepthRelationDebug(settings, null, null),
      bucketRanking: emptyBucketRanking(),
      perPointErrorSummary: emptyPointSummary(),
      outlierFrameDebug: buildAnalysisOutlierFrameDebug(settings, null),
      candidateStabilityDebug: buildCandidateStabilityDebug(),
      warnings: [...warnings, "front bucket の usable frame が不足しているため base8Points2D を作れません。"],
    }
    state.searchProgress = createIdleSearchProgress()
    if (state.autoSequence.status === "running") {
      finishAutoSequence("error", "Auto Sequence が停止しました: base8Points2D を作成できませんでした。", state.analysis)
      return
    }
    renderAnalysis()
    renderSearchProgress()
    renderAutoSequenceStatus()
    return
  }

  const estimatedCandidateCount = estimateCandidateCount(settings)
  state.analysis = null
  state.searchProgress = {
    status: "running",
    processedCandidateCount: 0,
    estimatedCandidateCount,
    progressRate: 0,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    message: "Worker で探索中です。",
  }
  state.importMessage = `${estimatedCandidateCount} candidates を Worker で探索中です。`

  startSearchWorker({
    settings,
    selected,
    sourceSummary,
    base8Points2DSummary,
    semanticPointSet,
    current8Debug,
    warnings,
  })
  setButtons()
  renderSourceOnly()
  renderSearchProgress()
  renderAutoSequenceStatus()
  if (state.quick478DepthDebug.status === "running") {
    state.quick478DepthDebug = {
      ...state.quick478DepthDebug,
      message: buildQuick478DepthDebugProgressMessage(),
    }
    renderQuick478DepthDebug()
  }
}
interface SearchWorkerContext {
  settings: SearchSettings
  selected: { frames: NormalizedFrame[]; summary: SelectedFrameSummary }
  sourceSummary: SourceSummary
  base8Points2DSummary: Base8Points2DSummary
  semanticPointSet: SemanticPointSetSummary
  current8Debug: Current8DebugSummary
  warnings: string[]
}

function startSearchWorker(context: SearchWorkerContext): void {
  terminateSearchWorker()

  const worker = new Worker(new URL("./searchWorker.ts", import.meta.url), {
    type: "module",
  })
  state.searchWorker = worker

  worker.onmessage = (event: MessageEvent): void => {
    const message = event.data
    if (!isRecord(message) || typeof message.type !== "string") {
      return
    }

    if (message.type === "progress") {
      updateSearchProgressFromWorker(message)
      return
    }

    if (message.type === "cancelled") {
      updateSearchProgressFromWorker(message)
      state.searchProgress.status = "cancelled"
      state.searchProgress.message = "探索をキャンセルしました。"
      terminateSearchWorker()
      if (state.autoSequence.status === "running") {
        finishAutoSequence("cancelled", "Auto Sequence をキャンセルしました。")
        return
      }
      setButtons()
      renderSearchProgress()
      renderAutoSequenceStatus()
      return
    }

    if (message.type === "error") {
      state.searchProgress = {
        ...state.searchProgress,
        status: "error",
        updatedAt: new Date().toISOString(),
        message: String(message.error ?? "Worker search failed"),
      }
      terminateSearchWorker()
      if (state.autoSequence.status === "running") {
        finishAutoSequence("error", `Auto Sequence が停止しました: ${state.searchProgress.message}`)
        return
      }
      setButtons()
      renderSearchProgress()
      renderAutoSequenceStatus()
      return
    }

    if (message.type === "complete") {
      completeSearchFromWorker(context, message)
    }
  }

  worker.onerror = (error): void => {
    state.searchProgress = {
      ...state.searchProgress,
      status: "error",
      updatedAt: new Date().toISOString(),
      message: error.message,
    }
    terminateSearchWorker()
    if (state.autoSequence.status === "running") {
      finishAutoSequence("error", `Auto Sequence が停止しました: ${error.message}`)
      return
    }
    setButtons()
    renderSearchProgress()
    renderAutoSequenceStatus()
  }

  worker.postMessage({
    type: "start",
    basePoints: context.base8Points2DSummary.points,
    frames: createWorkerFrames(context.selected.frames),
    settings: context.settings,
    chunkSize:
      state.quick478DepthDebug.status === "running"
        ? QUICK_478_DEPTH_DEBUG_WORKER_CHUNK_SIZE
        : undefined,
  })
}

function completeSearchFromWorker(context: SearchWorkerContext, message: Record<string, unknown>): void {
  const topCandidates = normalizeRankingEntries(message.topCandidates)
  const rawRanking = normalizeRankingEntries(message.rawRanking)
  const depthFilteredRanking = normalizeRankingEntries(message.depthFilteredRanking)
  const bucketRanking = normalizeBucketRanking(message.bucketRanking)
  const bestCandidate = isRecord(message.bestCandidate)
    ? normalizeCandidateResult(message.bestCandidate as unknown as CandidateResult)
    : null
  const depthRelationDebug = buildAnalysisDepthRelationDebug(
    context.settings,
    bestCandidate,
    message.depthRelationDebug,
  )
  const bestIdealFace8 =
    bestCandidate && context.base8Points2DSummary.points
      ? buildBestIdealFace8(context.base8Points2DSummary.points, bestCandidate)
      : null
  const processedCandidateCount = toNumber(message.processedCandidateCount, 0)
  const estimatedCandidateCount = toNumber(message.estimatedCandidateCount, processedCandidateCount)
  const localSearchSummary = isRecord(message.localSearchSummary)
    ? (message.localSearchSummary as unknown as LocalSearchSummary)
    : undefined
  const projectionSignDebugBaseCandidate = bestCandidate
    ? cloneCandidate(bestCandidate)
    : cloneCandidate(context.settings.localSearchSettings.baseCandidate)
  const projectionSignDebug = context.base8Points2DSummary.points
    ? buildProjectionSignDebug(
        context.base8Points2DSummary.points,
        context.selected.frames,
        context.settings,
        projectionSignDebugBaseCandidate,
      )
    : undefined
  const rotationCenterDebug = context.base8Points2DSummary.points
    ? buildRotationCenterDebug(
        context.base8Points2DSummary.points,
        context.selected.frames,
        context.settings,
        bestCandidate,
        context.settings.localSearchSettings.baseCandidate,
        readRotationCenterDebugBaseCandidateId(),
      )
    : undefined
  const outlierFrameDebug = buildAnalysisOutlierFrameDebug(context.settings, bestCandidate)

  state.analysis = {
    schemaVersion: "ideal_face_fitting_lab_analysis_v1",
    analysisVersion: "eight_point_grid_search_v1",
    generatedAt: new Date().toISOString(),
    lastRunType: "singleSearch",
    sourceSummary: context.sourceSummary,
    selectedFrameSummary: context.selected.summary,
    semanticPointSet: context.semanticPointSet,
    base8Points2DSummary: context.base8Points2DSummary,
    baseSemanticPoints2DSummary: context.base8Points2DSummary,
    current8Debug: context.current8Debug,
    current8PointsByFrame: context.current8Debug.current8PointsByFrame,
    current8BoundsByFrame: context.current8Debug.current8BoundsByFrame,
    current8MetricsByFrame: context.current8Debug.current8MetricsByFrame,
    current8BucketSummary: context.current8Debug.current8BucketSummary,
    current8PoseComparison: context.current8Debug.current8PoseComparison,
    depthConvention: DEPTH_CONVENTION,
    searchMode: context.settings.searchMode,
    searchSettings: context.settings,
    depthRelationFiltering: summarizeDepthRelationFilteringSettings(
      context.settings.depthRelationFiltering,
    ),
    localSearchSettings:
      context.settings.searchMode === "fullGrid" ? undefined : context.settings.localSearchSettings,
    localSearchSummary,
    scoreDebugSummary: bestCandidate?.scoreDebug ?? null,
    candidateCount: estimatedCandidateCount,
    processedCandidateCount,
    estimatedCandidateCount,
    rawRanking: rawRanking.map((candidate) =>
      attachIdealFace8Summary(candidate, context.base8Points2DSummary.points),
    ),
    depthFilteredRanking: (depthFilteredRanking.length > 0 ? depthFilteredRanking : topCandidates).map(
      (candidate) => attachIdealFace8Summary(candidate, context.base8Points2DSummary.points),
    ),
    topCandidates: topCandidates.map((candidate) =>
      attachIdealFace8Summary(candidate, context.base8Points2DSummary.points),
    ),
    bestCandidate,
    bestIdealFace8,
    depthRelation: bestIdealFace8?.summary.depthRelation ?? null,
    depthRelationDebug,
    bucketRanking: Object.fromEntries(
      BUCKETS.map((bucket) => [
        bucket,
        bucketRanking[bucket].map((candidate) =>
          attachIdealFace8Summary(candidate, context.base8Points2DSummary.points),
        ),
      ]),
    ) as Record<CaptureBucket, RankingEntry[]>,
    perPointErrorSummary: bestCandidate ? bestCandidate.perPointError : emptyPointSummary(),
    projectionSignDebug,
    rotationCenterDebug,
    outlierFrameDebug,
    candidateStabilityDebug: buildCandidateStabilityDebug(),
    warnings: [
      ...new Set([
        ...context.warnings,
        ...normalizeStringArray(message.warnings),
        "8点の z / pivotZ は debug 探索候補です。production IdealFace478 の確定値ではありません。",
      ]),
    ],
  }

  state.searchProgress = {
    status: "completed",
    processedCandidateCount,
    estimatedCandidateCount,
    progressRate: calculateProgressRate(processedCandidateCount, estimatedCandidateCount),
    startedAt: state.searchProgress.startedAt,
    updatedAt: new Date().toISOString(),
    message: "探索が完了しました。",
  }
  state.importMessage = `${processedCandidateCount} candidates を評価しました。`
  terminateSearchWorker()
  if (state.autoSequence.status === "running") {
    handleAutoSequenceStepComplete(state.analysis)
    return
  }
  setButtons()
  renderAnalysis()
  renderSearchProgress()
  renderAutoSequenceStatus()
}

function cancelAnalysis(): void {
  if (state.searchProgress.status !== "running" || !state.searchWorker) {
    return
  }
  state.searchWorker.postMessage({ type: "cancel" })
  state.searchProgress = {
    ...state.searchProgress,
    updatedAt: new Date().toISOString(),
    message: "キャンセル中です。",
  }
  setButtons()
  renderSearchProgress()
  renderAutoSequenceStatus()
}

function useBestCandidateAsBase(): void {
  const bestCandidate = state.analysis?.bestCandidate
  if (!bestCandidate) {
    return
  }
  writeCandidateToBaseInputs(bestCandidate)
  writeSelectValue("base-candidate-preset-select", "currentBestCandidate")
  state.presetMessage = "Current bestCandidate を baseCandidate に反映しました。"
  renderPresetMessage()
}

function terminateSearchWorker(): void {
  if (state.searchWorker) {
    state.searchWorker.terminate()
    state.searchWorker = null
  }
}

function updateSearchProgressFromWorker(message: Record<string, unknown>): void {
  const processedCandidateCount = toNumber(message.processedCandidateCount, 0)
  const estimatedCandidateCount = toNumber(message.estimatedCandidateCount, 0)
  const currentBest = normalizeRankingEntries(message.topCandidates)[0] ?? null
  state.searchProgress = {
    ...state.searchProgress,
    status: "running",
    processedCandidateCount,
    estimatedCandidateCount,
    progressRate: calculateProgressRate(processedCandidateCount, estimatedCandidateCount),
    updatedAt: new Date().toISOString(),
    message: "Worker で探索中です。",
  }
  if (state.autoSequence.status === "running") {
    state.autoSequence.currentBestScore = currentBest?.totalScore ?? null
  }
  renderSearchProgress()
  renderAutoSequenceStatus()
  if (state.quick478DepthDebug.status === "running") {
    state.quick478DepthDebug = {
      ...state.quick478DepthDebug,
      message: buildQuick478DepthDebugProgressMessage(),
    }
    renderQuick478DepthDebug()
  }
}

function createWorkerFrames(frames: NormalizedFrame[]): Array<{
  captureId: string
  bucket: CaptureBucket
  rawBucket: string
  pose: Pose
  semanticPoints: SemanticPointSet2D
  bounds: Bounds2D
  warnings: string[]
}> {
  return frames
    .filter((frame) => frame.semanticPoints && frame.bounds)
    .map((frame) => ({
      captureId: frame.captureId,
      bucket: frame.bucket,
      rawBucket: frame.rawBucket,
      pose: frame.pose,
      semanticPoints: frame.semanticPoints!,
      bounds: frame.bounds!,
      warnings: frame.warnings,
    }))
}

function normalizeRankingEntries(value: unknown): RankingEntry[] {
  return Array.isArray(value)
    ? (value as RankingEntry[]).map((entry) => ({
        ...entry,
        objectiveMode: isObjectiveMode(entry.objectiveMode)
          ? entry.objectiveMode
          : DEFAULT_SETTINGS.objectiveMode,
        objectiveScore:
          typeof entry.objectiveScore === "number"
            ? entry.objectiveScore
            : getObjectiveScore(
                {
                  totalScore: entry.totalScore,
                  scoreDebug: entry.scoreDebug ?? calculateScoreDebug(entry.totalScore, entry.bucketScores),
                },
                isObjectiveMode(entry.objectiveMode)
                  ? entry.objectiveMode
                  : DEFAULT_SETTINGS.objectiveMode,
              ),
        objectiveScoreBeforeDepthFilter:
          typeof entry.objectiveScoreBeforeDepthFilter === "number"
            ? entry.objectiveScoreBeforeDepthFilter
            : undefined,
        depthRelationDebug: entry.depthRelationDebug,
        candidate: cloneCandidate({
          pivotZ: entry.candidate.pivotZ,
          rotationCenter: getCandidateRotationCenter(entry.candidate),
          zByPointId: entry.candidate.zByPointId,
        }),
      }))
    : []
}

function normalizeCandidateResult(candidate: CandidateResult): CandidateResult {
  const normalized = cloneCandidate(candidate)
  const objectiveMode = isObjectiveMode(candidate.objectiveMode)
    ? candidate.objectiveMode
    : DEFAULT_SETTINGS.objectiveMode
  const scoreDebug = candidate.scoreDebug ?? calculateScoreDebug(candidate.totalScore, candidate.bucketScores)
  return {
    ...candidate,
    pivotZ: normalized.pivotZ,
    rotationCenter: normalized.rotationCenter ?? getCandidateRotationCenter(normalized),
    zByPointId: normalized.zByPointId,
    scoreDebug,
    objectiveMode,
    objectiveScoreBeforeDepthFilter:
      typeof candidate.objectiveScoreBeforeDepthFilter === "number"
        ? candidate.objectiveScoreBeforeDepthFilter
        : undefined,
    objectiveScore:
      typeof candidate.objectiveScore === "number"
        ? candidate.objectiveScore
        : getObjectiveScore({ totalScore: candidate.totalScore, scoreDebug }, objectiveMode),
    depthRelationDebug: candidate.depthRelationDebug,
  }
}

function normalizeBucketRanking(value: unknown): Record<CaptureBucket, RankingEntry[]> {
  const source = isRecord(value) ? value : {}
  return Object.fromEntries(
    BUCKETS.map((bucket) => [bucket, normalizeRankingEntries(source[bucket])]),
  ) as Record<CaptureBucket, RankingEntry[]>
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : []
}

function estimateCandidateCount(settings: SearchSettings): number {
  if (settings.searchMode === "localOneDimensional") {
    return createNumericCandidates(
      settings.localSearchSettings.localMin,
      settings.localSearchSettings.localMax,
      settings.localSearchSettings.localStep,
    ).length
  }

  if (settings.searchMode === "coordinateDescent") {
    const activePointParameters = new Set(
      getSemanticPointSet(settings.semanticPointSetId).pointIds.map(
        (pointId) => `${pointId}.z` as LocalSearchParameter,
      ),
    )
    const activeParameterOrder = settings.localSearchSettings.coordinateDescentParameterOrder.filter(
      (parameter) => !parameter.endsWith(".z") || activePointParameters.has(parameter),
    )
    return (
      settings.localSearchSettings.coordinateDescentIterations *
      activeParameterOrder.reduce((total, parameter) => {
        const range = settings.localSearchSettings.coordinateDescentRanges[parameter]
        return total + createNumericCandidates(range.min, range.max, range.step).length
      }, 0)
    )
  }

  const zCount = createNumericCandidates(settings.zMin, settings.zMax, settings.zStep).length
  const pivotZCount = createNumericCandidates(
    settings.pivotZMin,
    settings.pivotZMax,
    settings.pivotZStep,
  ).length
  return zCount ** getSemanticPointSet(settings.semanticPointSetId).pointIds.length * pivotZCount
}

function calculateProgressRate(processed: number, total: number): number {
  if (total <= 0) {
    return 0
  }
  return round(Math.min(1, processed / total))
}

function buildRotationCenterDebug(
  basePoints: SemanticPointSet2D,
  frames: NormalizedFrame[],
  settings: SearchSettings,
  bestCandidate: FittingCandidate8 | null,
  currentBaseCandidate: FittingCandidate8,
  baseCandidateId: RotationCenterDebugBaseCandidateId,
): RotationCenterDebug | undefined {
  const baseCandidate = getRotationCenterDebugBaseCandidate(
    baseCandidateId,
    bestCandidate,
    currentBaseCandidate,
  )
  if (!baseCandidate) {
    return undefined
  }

  const baseCandidateName = ROTATION_CENTER_DEBUG_BASE_LABELS[baseCandidateId]
  const candidate = createRotationCenterCandidateDefinition(baseCandidate, baseCandidateName)
  const usableFrames = frames.filter(
    (frame) => frame.semanticPoints && frame.bounds,
  )
  const results = ROTATION_CENTER_PIVOT_X_CANDIDATES.flatMap((pivotX) =>
    ROTATION_CENTER_PIVOT_Y_CANDIDATES.flatMap((pivotY) =>
      ROTATION_CENTER_PIVOT_Z_CANDIDATES.map((pivotZ) =>
        evaluateCandidateForDebug(candidate, basePoints, usableFrames, settings, {
          pivotZ,
          rotationCenter: { x: pivotX, y: pivotY, z: pivotZ },
        }),
      ),
    ),
  )

  const baselinePivotZ = round(baseCandidate.pivotZ)
  const baselineResult = evaluateCandidateForDebug(candidate, basePoints, usableFrames, settings, {
    pivotZ: baselinePivotZ,
    rotationCenter: { x: 0, y: 0, z: baselinePivotZ },
  })
  const summary = buildRotationCenterDebugSummary(
    baseCandidateName,
    results,
    baselineResult,
    baselinePivotZ,
  )

  return {
    baseCandidate: cloneCandidate(baseCandidate),
    baseCandidateName,
    pivotXCandidates: [...ROTATION_CENTER_PIVOT_X_CANDIDATES],
    pivotYCandidates: [...ROTATION_CENTER_PIVOT_Y_CANDIDATES],
    pivotZCandidates: [...ROTATION_CENTER_PIVOT_Z_CANDIDATES],
    results,
    summary,
  }
}

function getRotationCenterDebugBaseCandidate(
  baseCandidateId: RotationCenterDebugBaseCandidateId,
  bestCandidate: FittingCandidate8 | null,
  currentBaseCandidate: FittingCandidate8,
): FittingCandidate8 | null {
  if (baseCandidateId === "currentBestCandidate") {
    return bestCandidate ? cloneCandidate(bestCandidate) : null
  }
  if (baseCandidateId === "currentBaseCandidate") {
    return cloneCandidate(currentBaseCandidate)
  }
  if (baseCandidateId === "pitchFocusRawBest") {
    return cloneCandidate(PITCH_FOCUS_RAW_BEST)
  }
  return cloneCandidate(NATURAL_NOSE_CANDIDATE)
}

function createRotationCenterCandidateDefinition(
  candidate: FittingCandidate8,
  candidateName: string,
): CandidateDefinition {
  return {
    candidateId: `rotation_center_debug__${candidateName.toLowerCase().replaceAll(" ", "_")}`,
    pivotZ: round(candidate.pivotZ),
    rotationCenter: getCandidateRotationCenter(candidate),
    zByPointId: roundRecord(candidate.zByPointId),
  }
}

function evaluateCandidateForDebug(
  candidate: CandidateDefinition,
  basePoints: SemanticPointSet2D,
  frames: NormalizedFrame[],
  settings: SearchSettings,
  projectionOptions: ProjectionOptions,
): RotationCenterDebugResult {
  const ideal3D = buildIdeal3D(basePoints, candidate)
  const perFrameResults = frames
    .filter((frame) => frame.semanticPoints && frame.bounds)
    .map((frame) =>
      evaluateCandidateOnFrameForDebug(candidate, ideal3D, frame, settings, projectionOptions),
    )
  const bucketScores = calculateBucketScores(perFrameResults)
  const totalScore =
    average(perFrameResults.map((result) => result.weightedSemanticDistance)) ??
    Number.POSITIVE_INFINITY
  const scoreDebug = calculateScoreDebug(totalScore, bucketScores)

  return {
    baseCandidate: cloneCandidate(candidate),
    pivotX: round(projectionOptions.rotationCenter?.x ?? 0),
    pivotY: round(projectionOptions.rotationCenter?.y ?? 0),
    pivotZ: round(projectionOptions.rotationCenter?.z ?? projectionOptions.pivotZ),
    totalScore: round(totalScore),
    bucketScores: roundRecord(bucketScores),
    scoreDebug: roundScoreDebug(scoreDebug),
    perPointErrorSummary: averagePerPointError(perFrameResults),
  }
}

function evaluateCandidateOnFrameForDebug(
  candidate: CandidateDefinition,
  ideal3D: SemanticPointSet3D,
  frame: NormalizedFrame,
  settings: SearchSettings,
  projectionOptions: ProjectionOptions,
): FrameEvaluation {
  const projected = projectIdealPoints(ideal3D, frame.pose, candidate, settings, projectionOptions)
  const current = normalizeCurrentPointsForScoring(frame.semanticPoints!, frame.bounds!)
  const perPointError = calculatePerPointErrors(projected, current)
  const averageSemanticDistance =
    average(SEMANTIC_POINT_NAMES.map((name) => perPointError[name])) ?? Number.POSITIVE_INFINITY
  const weightedSemanticDistance = weightedAverage(
    SEMANTIC_DEFINITIONS.map((definition) => ({
      value: perPointError[definition.name],
      weight: definition.weight,
    })),
  )

  return {
    captureId: frame.captureId,
    bucket: frame.bucket,
    rawBucket: frame.rawBucket,
    pose: {
      yaw: round(frame.pose.yaw),
      pitch: round(frame.pose.pitch),
      roll: round(frame.pose.roll),
    },
    frameError: weightedSemanticDistance,
    averageSemanticDistance,
    weightedSemanticDistance,
    perPointError,
    projectedPoints: roundPointRecord(projected),
    currentPoints: roundPointRecord(current),
    totalScore: weightedSemanticDistance,
    warnings: frame.warnings,
  }
}

function calculatePerPointErrors(
  projected: SemanticPointSet2D,
  current: SemanticPointSet2D,
): Record<SemanticPointName, number> {
  return Object.fromEntries(
    SEMANTIC_POINT_NAMES.map((name) => [name, round(distance2D(projected[name], current[name]))]),
  ) as Record<SemanticPointName, number>
}

function calculateBucketScores(results: FrameEvaluation[]): PoseBucketScores {
  return {
    front: averageBucketScore(results, "front"),
    yawPositive: averageBucketScore(results, "yawPositive"),
    yawNegative: averageBucketScore(results, "yawNegative"),
    pitchPositive: averageBucketScore(results, "pitchPositive"),
    pitchNegative: averageBucketScore(results, "pitchNegative"),
    mixedPose: averageBucketScore(results, "mixedPose"),
  }
}

function averageBucketScore(results: FrameEvaluation[], bucket: CaptureBucket): number | null {
  return roundNullable(
    average(results.filter((result) => result.bucket === bucket).map((result) => result.totalScore)),
  )
}

function averagePerPointError(results: FrameEvaluation[]): Record<SemanticPointName, number> {
  return Object.fromEntries(
    SEMANTIC_POINT_NAMES.map((name) => [
      name,
      round(average(results.map((result) => result.perPointError[name])) ?? 0),
    ]),
  ) as Record<SemanticPointName, number>
}

function buildRotationCenterDebugSummary(
  candidateName: string,
  results: RotationCenterDebugResult[],
  baselineResult: RotationCenterDebugResult,
  baselinePivotZ: number,
): RotationCenterDebugSummary {
  const bestByTotalScore = findBestRotationCenterResult(results, (result) => result.totalScore)
  const bestByBalancedScore = findBestRotationCenterResult(
    results,
    (result) => result.scoreDebug.balancedScore,
  )
  const bestByPitchAverageScore = findBestRotationCenterResult(
    results,
    (result) => result.scoreDebug.pitchAverageScore,
  )
  const bestByMaxBucketScore = findBestRotationCenterResult(
    results,
    (result) => result.scoreDebug.maxBucketScore,
  )

  return {
    candidateName,
    bestByTotalScore,
    bestByBalancedScore,
    bestByPitchAverageScore,
    bestByMaxBucketScore,
    baselineRotationCenter: {
      pivotX: 0,
      pivotY: 0,
      pivotZ: baselinePivotZ,
    },
    baselineResult,
    improvementFromBaseline: {
      totalScoreDelta: round(baselineResult.totalScore - bestByTotalScore.totalScore),
      balancedScoreDelta: round(
        nullableScore(baselineResult.scoreDebug.balancedScore) -
          nullableScore(bestByBalancedScore.scoreDebug.balancedScore),
      ),
      pitchAverageScoreDelta: round(
        nullableScore(baselineResult.scoreDebug.pitchAverageScore) -
          nullableScore(bestByPitchAverageScore.scoreDebug.pitchAverageScore),
      ),
      maxBucketScoreDelta: round(
        nullableScore(baselineResult.scoreDebug.maxBucketScore) -
          nullableScore(bestByMaxBucketScore.scoreDebug.maxBucketScore),
      ),
    },
  }
}

function findBestRotationCenterResult(
  results: RotationCenterDebugResult[],
  getScore: (result: RotationCenterDebugResult) => number | null,
): RotationCenterDebugResult {
  return results.reduce((best, result) =>
    nullableScore(getScore(result)) < nullableScore(getScore(best)) ? result : best,
  )
}

function nullableScore(score: number | null): number {
  return typeof score === "number" && Number.isFinite(score) ? score : Number.POSITIVE_INFINITY
}

function buildProjectionSignDebug(
  basePoints: SemanticPointSet2D,
  frames: NormalizedFrame[],
  settings: SearchSettings,
  baseCandidate: FittingCandidate8,
): ProjectionSignDebug {
  const base = cloneCandidate(baseCandidate)
  const noseZCandidates = [...DEFAULT_PROJECTION_SIGN_NOSE_Z_CANDIDATES]
  const selectedFrames = PROJECTION_SIGN_DEBUG_BUCKETS.map((bucket) =>
    frames.find((frame) => frame.bucket === bucket && frame.semanticPoints && frame.bounds),
  ).filter((frame): frame is NormalizedFrame => Boolean(frame))
  const rows = selectedFrames.flatMap((frame) =>
    buildProjectionSignDebugRowsForFrame(basePoints, frame, settings, base, noseZCandidates),
  )

  return {
    baseCandidate: base,
    noseZCandidates,
    rows,
    summary: buildProjectionSignDebugSummary(rows, basePoints, selectedFrames, settings, base),
  }
}

function buildProjectionSignDebugRowsForFrame(
  basePoints: SemanticPointSet2D,
  frame: NormalizedFrame,
  settings: SearchSettings,
  baseCandidate: FittingCandidate8,
  noseZCandidates: number[],
): ProjectionSignDebugRow[] {
  if (!frame.semanticPoints || !frame.bounds || !isProjectionSignDebugBucket(frame.bucket)) {
    return []
  }

  const current = normalizeCurrentPointsForScoring(frame.semanticPoints, frame.bounds)
  const baseProjected = projectIdealPoints(
    buildIdeal3D(basePoints, baseCandidate),
    frame.pose,
    baseCandidate,
    settings,
  )

  return noseZCandidates.map((noseZ) => {
    const candidate = setCandidateNoseZ(baseCandidate, noseZ)
    const projected = projectIdealPoints(
      buildIdeal3D(basePoints, candidate),
      frame.pose,
      candidate,
      settings,
    )
    const deltaToCurrent = buildProjectionSignDeltaSet(projected, current)

    return {
      captureId: frame.captureId,
      bucket: frame.bucket,
      pose: roundPose(frame.pose),
      candidate: {
        pivotZ: round(candidate.pivotZ),
        noseZ: round(candidate.zByPointId.nose),
        leftCheekZ: round(candidate.zByPointId.leftCheek),
        rightCheekZ: round(candidate.zByPointId.rightCheek),
        mouthZ: round(candidate.zByPointId.mouth),
      },
      projected: pickProjectionSignPoints(projected),
      current: pickProjectionSignPoints(current),
      deltaToCurrent,
      noseMovementFromBase: {
        dx: round(projected.nose.x - baseProjected.nose.x),
        dy: round(projected.nose.y - baseProjected.nose.y),
      },
    }
  })
}

function buildProjectionSignDebugSummary(
  rows: ProjectionSignDebugRow[],
  basePoints: SemanticPointSet2D,
  frames: NormalizedFrame[],
  settings: SearchSettings,
  baseCandidate: FittingCandidate8,
): ProjectionSignDebugSummary {
  const byBucket = {} as Record<ProjectionSignDebugBucket, ProjectionSignBucketSummary>

  for (const bucket of PROJECTION_SIGN_DEBUG_BUCKETS) {
    const bucketRows = rows
      .filter((row) => row.bucket === bucket)
      .sort((a, b) => a.candidate.noseZ - b.candidate.noseZ)
    const frame = frames.find((item) => item.bucket === bucket)
    if (!frame || bucketRows.length === 0) {
      byBucket[bucket] = {
        captureId: "-",
        pose: { yaw: 0, pitch: 0, roll: 0 },
        noseZIncreasingEffect: {
          projectedNoseXDirection: "flat",
          projectedNoseYDirection: "flat",
        },
        bestNoseZByNoseDistance: round(baseCandidate.zByPointId.nose),
        bestNoseZByFrameScore: round(baseCandidate.zByPointId.nose),
        note: "selected frame がありません。",
      }
      continue
    }
    const first = bucketRows[0]
    const last = bucketRows[bucketRows.length - 1]
    const bestByFrameScore = findBestProjectionSignNoseZByFrameScore(
      basePoints,
      frame,
      settings,
      baseCandidate,
      bucketRows.map((row) => row.candidate.noseZ),
    )

    byBucket[bucket] = {
      captureId: frame.captureId,
      pose: roundPose(frame.pose),
      noseZIncreasingEffect: {
        projectedNoseXDirection: toProjectionSignDirection(
          last.projected.nose.x - first.projected.nose.x,
        ),
        projectedNoseYDirection: toProjectionSignDirection(
          last.projected.nose.y - first.projected.nose.y,
        ),
      },
      bestNoseZByNoseDistance: findBestProjectionSignRowByNoseDistance(bucketRows).candidate.noseZ,
      bestNoseZByFrameScore: bestByFrameScore,
      note:
        bucket === "front"
          ? "front は yaw / pitch response より perspective scale の基準確認用です。"
          : undefined,
    }
  }

  return { byBucket }
}

function findBestProjectionSignNoseZByFrameScore(
  basePoints: SemanticPointSet2D,
  frame: NormalizedFrame,
  settings: SearchSettings,
  baseCandidate: FittingCandidate8,
  noseZCandidates: number[],
): number {
  if (!frame.semanticPoints || !frame.bounds) {
    return noseZCandidates[0] ?? baseCandidate.zByPointId.nose
  }
  const current = normalizeCurrentPointsForScoring(frame.semanticPoints, frame.bounds)
  let bestNoseZ = noseZCandidates[0] ?? baseCandidate.zByPointId.nose
  let bestScore = Number.POSITIVE_INFINITY
  for (const noseZ of noseZCandidates) {
    const candidate = setCandidateNoseZ(baseCandidate, noseZ)
    const projected = projectIdealPoints(
      buildIdeal3D(basePoints, candidate),
      frame.pose,
      candidate,
      settings,
    )
    const score = calculateProjectionSignFrameScore(projected, current)
    if (score < bestScore) {
      bestScore = score
      bestNoseZ = noseZ
    }
  }
  return round(bestNoseZ)
}

function findBestProjectionSignRowByNoseDistance(
  rows: ProjectionSignDebugRow[],
): ProjectionSignDebugRow {
  return rows.reduce((best, row) =>
    row.deltaToCurrent.nose.distance < best.deltaToCurrent.nose.distance ? row : best,
  )
}

function calculateProjectionSignFrameScore(
  projected: SemanticPointSet2D,
  current: SemanticPointSet2D,
): number {
  const weightedTotal = SEMANTIC_DEFINITIONS.reduce(
    (total, definition) =>
      total + distance2D(projected[definition.name], current[definition.name]) * definition.weight,
    0,
  )
  const weightTotal = SEMANTIC_DEFINITIONS.reduce((total, definition) => total + definition.weight, 0)
  return weightTotal <= EPSILON ? 0 : weightedTotal / weightTotal
}

function buildIdeal3D(
  basePoints: SemanticPointSet2D,
  candidate: FittingCandidate8,
): SemanticPointSet3D {
  const points = {} as SemanticPointSet3D
  for (const name of SEMANTIC_POINT_NAMES) {
    points[name] = {
      x: basePoints[name].x,
      y: basePoints[name].y,
      z: candidate.zByPointId[name],
    }
  }
  return points
}

function projectIdealPoints(
  ideal3D: SemanticPointSet3D,
  pose: Pose,
  candidate: FittingCandidate8,
  settings: SearchSettings,
  options?: ProjectionOptions,
): SemanticPointSet2D {
  const rotationCenter = getProjectionRotationCenter(candidate, options)
  const points = {} as SemanticPointSet2D
  for (const name of SEMANTIC_POINT_NAMES) {
    const rotated = rotatePoint3D(
      {
        x: ideal3D[name].x - rotationCenter.x,
        y: ideal3D[name].y - rotationCenter.y,
        z: ideal3D[name].z - rotationCenter.z,
      },
      pose,
    )
    const projectedX = rotated.x + rotationCenter.x
    const projectedY = rotated.y + rotationCenter.y
    const z = rotated.z + rotationCenter.z
    const perspective = settings.focalLength / Math.max(settings.focalLength + z, 0.2)
    points[name] = {
      name,
      x: round(projectedX * perspective),
      y: round(projectedY * perspective),
    }
  }
  return points
}

function getProjectionRotationCenter(
  candidate: FittingCandidate8,
  options?: ProjectionOptions,
): RotationCenter {
  if (options?.rotationCenter) {
    return roundRotationCenter(options.rotationCenter)
  }
  if (candidate.rotationCenter) {
    return roundRotationCenter(candidate.rotationCenter)
  }
  return { x: 0, y: 0, z: round(options?.pivotZ ?? candidate.pivotZ) }
}

function rotatePoint3D(point: Point3, pose: Pose): Point3 {
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

function normalizeCurrentPointsForScoring(
  points: SemanticPointSet2D,
  bounds: Bounds2D,
): SemanticPointSet2D {
  const normalized = {} as SemanticPointSet2D
  for (const name of SEMANTIC_POINT_NAMES) {
    normalized[name] = {
      name,
      x: round(points[name].x - bounds.centerX),
      y: round(points[name].y - bounds.centerY),
    }
  }
  return normalized
}

function setCandidateNoseZ(
  candidate: FittingCandidate8,
  noseZ: number,
): FittingCandidate8 {
  const next = cloneCandidate(candidate)
  next.zByPointId.nose = round(noseZ)
  return next
}

function pickProjectionSignPoints(points: SemanticPointSet2D): ProjectionSignPointSet {
  return Object.fromEntries(
    PROJECTION_SIGN_POINT_NAMES.map((name) => [
      name,
      {
        x: round(points[name].x),
        y: round(points[name].y),
      },
    ]),
  ) as ProjectionSignPointSet
}

function buildProjectionSignDeltaSet(
  projected: SemanticPointSet2D,
  current: SemanticPointSet2D,
): ProjectionSignDeltaSet {
  return Object.fromEntries(
    PROJECTION_SIGN_POINT_NAMES.map((name) => {
      const dx = projected[name].x - current[name].x
      const dy = projected[name].y - current[name].y
      return [
        name,
        {
          dx: round(dx),
          dy: round(dy),
          distance: round(Math.hypot(dx, dy)),
        },
      ]
    }),
  ) as ProjectionSignDeltaSet
}

function toProjectionSignDirection(value: number): ProjectionSignDirection {
  if (Math.abs(value) <= 0.00001) {
    return "flat"
  }
  return value > 0 ? "positive" : "negative"
}

function isProjectionSignDebugBucket(bucket: CaptureBucket): bucket is ProjectionSignDebugBucket {
  return PROJECTION_SIGN_DEBUG_BUCKETS.includes(bucket as ProjectionSignDebugBucket)
}

function readRotationCenterDebugBaseCandidateId(): RotationCenterDebugBaseCandidateId {
  const value = getElement<HTMLSelectElement>("rotation-center-base-select").value
  return isRotationCenterDebugBaseCandidateId(value) ? value : "currentBestCandidate"
}

function isRotationCenterDebugBaseCandidateId(
  value: string,
): value is RotationCenterDebugBaseCandidateId {
  return Object.prototype.hasOwnProperty.call(ROTATION_CENTER_DEBUG_BASE_LABELS, value)
}

function updateRotationCenterDebugFromSelection(): void {
  const analysis = state.analysis
  if (!analysis?.base8Points2DSummary.points) {
    renderRotationCenterDebug(null)
    return
  }

  const selectedFrames = getAnalysisSelectedFrames(analysis)
  analysis.rotationCenterDebug = buildRotationCenterDebug(
    analysis.base8Points2DSummary.points,
    selectedFrames,
    analysis.searchSettings,
    analysis.bestCandidate,
    analysis.searchSettings.localSearchSettings.baseCandidate,
    readRotationCenterDebugBaseCandidateId(),
  )
  renderRotationCenterDebug(analysis.rotationCenterDebug ?? null)
  getElement("json-preview").textContent = JSON.stringify(createSummaryAnalysis(analysis), null, 2)
}

function getAnalysisSelectedFrames(analysis: AnalysisResult): NormalizedFrame[] {
  const selectedIds = new Set(analysis.selectedFrameSummary.selectedCaptureIds)
  return state.frames.filter((frame) => selectedIds.has(frame.captureId))
}

function getDepth478EvaluationFrameInput(analysis: AnalysisResult): {
  frames: NormalizedFrame[]
  usedOutlierFilteredFrames: boolean
} {
  const selectedFrames = getAnalysisSelectedFrames(analysis)
  const outlierDebug = analysis.outlierFrameDebug?.bestCandidateOutliers
  if (
    analysis.searchSettings.outlierFiltering.enabled &&
    analysis.searchSettings.outlierFiltering.mode === "excludeFromInference" &&
    outlierDebug?.outlierFrames.length
  ) {
    const excludedIds = new Set(
      outlierDebug.outlierFrames
        .filter((frame) => frame.excludedFromInference)
        .map((frame) => frame.captureId),
    )
    const filteredFrames = selectedFrames.filter((frame) => !excludedIds.has(frame.captureId))
    if (filteredFrames.length > 0 && filteredFrames.length < selectedFrames.length) {
      return {
        frames: filteredFrames,
        usedOutlierFilteredFrames: true,
      }
    }
  }
  return {
    frames: selectedFrames,
    usedOutlierFilteredFrames: false,
  }
}

function generateDepth478DebugCandidate(): void {
  const analysis = state.analysis
  if (!analysis?.base8Points2DSummary.points) {
    return
  }

  const source = resolveDepth478SourceCandidate(analysis, readDepth478CandidateSource())
  const prototypeSettings = readDepth478PrototypeSettings()
  analysis.depth478Prototype = buildDepth478PrototypeFromSource(
    analysis,
    source,
    prototypeSettings,
    analysis.depth478Prototype?.candidateComparison ?? [],
  )
  renderDepth478Prototype(analysis.depth478Prototype)
  getElement("json-preview").textContent = JSON.stringify(createSummaryAnalysis(analysis), null, 2)
  setButtons()
}

function buildDepth478PrototypeFromSource(
  analysis: AnalysisResult,
  source: { candidate: FittingCandidate8; source8CandidateId: string | null } | null,
  prototypeSettings: Depth478PrototypeResult["settings"],
  previousComparison: Depth478CandidateComparisonEntry[] = [],
): Depth478PrototypeResult {
  const frameInput = getDepth478EvaluationFrameInput(analysis)
  const selectedFrames = frameInput.frames
  const base478 = buildBase478Landmarks2D(selectedFrames)
  if (!analysis.base8Points2DSummary.points || !base478 || !source) {
    return {
      settings: prototypeSettings,
      candidateComparison: previousComparison,
    }
  }

  const generatedCandidateBase = buildGenerated478DepthCandidate(
    base478,
    analysis.base8Points2DSummary.points,
    source.candidate,
    source.source8CandidateId,
    analysis.searchSettings.semanticPointSetId,
    prototypeSettings.interpolation,
    prototypeSettings.groupCorrections,
  )
  const generatedCandidate =
    prototypeSettings.perLandmarkZSearch.enabled &&
    prototypeSettings.interpolation.method === "canonicalDepthBased"
      ? applyPerLandmarkZSearch(
          generatedCandidateBase,
          selectedFrames,
          analysis.searchSettings,
          prototypeSettings.perLandmarkZSearch,
          frameInput.usedOutlierFilteredFrames,
        )
      : generatedCandidateBase
  const projectionEvaluation = evaluateProjection478(
    generatedCandidate,
    selectedFrames,
    analysis.searchSettings,
  )
  const depthRelationDebug = buildDepth478RelationDebug(
    generatedCandidate,
    analysis.searchSettings.depthRelationFiltering,
  )
  const smoothnessDebug = buildSmoothnessDebug478(
    generatedCandidate,
    prototypeSettings.smoothnessThreshold,
  )
  const comparisonEntry = buildDepth478CandidateComparisonEntry(
    generatedCandidate,
    projectionEvaluation,
    depthRelationDebug,
    smoothnessDebug,
  )
  const canonicalDepthFitComparison =
    prototypeSettings.interpolation.method === "canonicalDepthBased"
      ? buildCanonicalDepthFitComparisonDebug(
          base478,
          source.candidate,
          source.source8CandidateId,
          selectedFrames,
          analysis.searchSettings,
          prototypeSettings,
          frameInput.usedOutlierFilteredFrames,
        )
      : undefined

  return {
    settings: prototypeSettings,
    generatedCandidate,
    projectionEvaluation,
    depthRelationDebug,
    smoothnessDebug,
    candidateComparison: [...previousComparison, comparisonEntry].slice(-20),
    canonicalDepthFitComparison,
  }
}

function exportDepth478DebugJson(): void {
  const prototype = state.analysis?.depth478Prototype
  if (!prototype) {
    return
  }
  downloadJson(prototype, createFileName("ideal-face-fitting-depth478-debug"))
}

function runQuick478DepthHardRejectDebug(): void {
  if (state.searchProgress.status === "running" || state.autoSequence.status === "running") {
    return
  }
  if (state.frames.length === 0) {
    state.quick478DepthDebug = {
      ...createIdleQuick478DepthDebug(),
      status: "idle",
      message: "capture JSON を読み込んでから実行してください。",
    }
    state.quickSemanticPointSetComparison = null
    renderQuick478DepthDebug()
    return
  }

  const startedAt = new Date().toISOString()
  state.quick478DepthDebug = {
    status: "running",
    message: "8pt / 12pt / 24pt comparison running...",
    startedAt,
    completedAt: null,
    quickRun: null,
  }
  state.quickSemanticPointSetComparison = {
    enabled: true,
    pointSetIds: [...QUICK_SEMANTIC_POINT_SET_COMPARISON_IDS],
    activeIndex: 0,
    primaryPointSetId: QUICK_478_DEPTH_SEMANTIC_POINT_SET_ID,
    runs: [],
    primaryAnalysis: null,
    primaryPrototype: null,
    primaryRun: null,
  }
  state.importMessage = null
  renderQuick478DepthDebug()
  setButtons()
  try {
    startQuickSemanticPointSetComparisonRun()
  } catch (error) {
    completeQuick478DepthDebug(
      "error",
      error instanceof Error ? error.message : String(error),
      {
        failedStep: getQuick478DepthDebugCurrentStepLabel(),
        stack: error instanceof Error ? error.stack : undefined,
      },
    )
  }
}

function startQuickSemanticPointSetComparisonRun(): void {
  const comparison = state.quickSemanticPointSetComparison
  if (!comparison) {
    return
  }
  const pointSetId = comparison.pointSetIds[comparison.activeIndex]
  if (!pointSetId) {
    return
  }
  state.quick478DepthDebug = {
    ...state.quick478DepthDebug,
    status: "running",
    message: `8pt / 12pt / 24pt comparison running... ${pointSetId}`,
  }
  applyQuick478DepthDebugSettingsToControls()
  writeSelectValue("auto-sequence-select", QUICK_478_DEPTH_DEBUG_SETTINGS.autoSearchSequence)
  writeSelectValue("bucket-target-preset-select", QUICK_478_DEPTH_DEBUG_SETTINGS.bucketPreset)
  renderQuick478DepthDebug()
  try {
    startAutoSequence(
      findAutoSequence(QUICK_478_DEPTH_DEBUG_SETTINGS.autoSearchSequence),
      findBucketTargetPreset(QUICK_478_DEPTH_DEBUG_SETTINGS.bucketPreset),
    )
    renderQuick478DepthDebug()
  } catch (error) {
    completeQuick478DepthDebug(
      "error",
      error instanceof Error ? error.message : String(error),
      {
        failedStep: getQuick478DepthDebugCurrentStepLabel(),
        stack: error instanceof Error ? error.stack : undefined,
      },
    )
  }
}

function getQuick478ActiveSemanticPointSetId(): SemanticPointSetId {
  return (
    state.quickSemanticPointSetComparison?.pointSetIds[
      state.quickSemanticPointSetComparison.activeIndex
    ] ?? QUICK_478_DEPTH_DEBUG_SETTINGS.semanticPointSetId
  )
}

function applyQuick478DepthDebugSettingsToControls(): void {
  writeSelectValue("outlier-enabled-select", String(QUICK_478_DEPTH_DEBUG_SETTINGS.outlierFiltering.enabled))
  writeSelectValue("outlier-mode-select", QUICK_478_DEPTH_DEBUG_SETTINGS.outlierFiltering.mode)
  writeSelectValue(
    "outlier-apply-to-objective-select",
    String(QUICK_478_DEPTH_DEBUG_SETTINGS.outlierFiltering.applyToObjectiveScore),
  )
  writeSelectValue(
    "depth-relation-enabled-select",
    String(QUICK_478_DEPTH_DEBUG_SETTINGS.depthRelationFiltering.enabled),
  )
  writeSelectValue("depth-relation-mode-select", QUICK_478_DEPTH_DEBUG_SETTINGS.depthRelationFiltering.mode)
  writeSelectValue(
    "depth-relation-apply-to-objective-select",
    String(QUICK_478_DEPTH_DEBUG_SETTINGS.depthRelationFiltering.applyToObjectiveScore),
  )
  writeSelectValue("depth-478-method-select", QUICK_478_DEPTH_DEBUG_SETTINGS.interpolation.method)
}

function createQuick478DepthPrototypeSettings(): Depth478PrototypeResult["settings"] {
  return {
    interpolation: { ...QUICK_478_DEPTH_DEBUG_SETTINGS.interpolation },
    groupCorrections: cloneDepthGroupCorrections(DEFAULT_DEPTH_478_GROUP_CORRECTIONS),
    smoothnessThreshold: QUICK_478_DEPTH_DEBUG_SETTINGS.smoothnessThreshold,
    perLandmarkZSearch: { ...QUICK_478_DEPTH_DEBUG_SETTINGS.perLandmarkZSearch },
  }
}

function completeQuick478DepthDebug(
  autoStatus: "completed" | "cancelled" | "error",
  message: string,
  errorDetails?: { failedStep?: string; stack?: string },
): void {
  if (state.quickSemanticPointSetComparison?.enabled) {
    completeQuickSemanticPointSetComparisonRun(autoStatus, message, errorDetails)
    return
  }

  const startedAt = state.quick478DepthDebug.startedAt ?? new Date().toISOString()
  const completedAt = new Date().toISOString()
  const analysis = state.analysis
  const failedStep = errorDetails?.failedStep ?? getQuick478DepthDebugCurrentStepLabel()

  if (!analysis || autoStatus === "cancelled") {
    finishQuick478DepthDebug(
      buildQuick478DepthDebugPayload(null, {
        status: "error",
        reason: autoStatus === "cancelled" ? "cancelled" : message,
        failedStep,
        stack: errorDetails?.stack,
        startedAt,
        completedAt,
      }),
    )
    return
  }

  if (autoStatus !== "completed") {
    const noCandidate = message.includes("bestCandidate")
    finishQuick478DepthDebug(
      buildQuick478DepthDebugPayload(null, {
        status: noCandidate ? "noCandidate" : "error",
        reason: noCandidate ? "No candidate passed depth relation hardReject" : message,
        failedStep: noCandidate ? undefined : failedStep,
        stack: errorDetails?.stack,
        startedAt,
        completedAt,
        fallbackUsed: noCandidate ? false : undefined,
        analysis,
      }),
    )
    return
  }

  const finalCandidate = analysis.autoSequenceSummary?.finalCandidate ?? null
  if (!finalCandidate) {
    finishQuick478DepthDebug(
      buildQuick478DepthDebugPayload(null, {
        status: "noCandidate",
        reason: "No candidate passed depth relation hardReject",
        startedAt,
        completedAt,
        fallbackUsed: false,
        analysis,
      }),
    )
    return
  }

  const prototype = buildDepth478PrototypeFromSource(
    analysis,
    {
      candidate: cloneCandidate(finalCandidate),
      source8CandidateId: "autoSequenceSummary.finalCandidate",
    },
    createQuick478DepthPrototypeSettings(),
  )
  analysis.depth478Prototype = prototype

  const status = diagnoseQuick478DepthDebugStatus(prototype.depthRelationDebug)
  const isRejected = prototype.depthRelationDebug?.isRejected ?? false
  finishQuick478DepthDebug(
    buildQuick478DepthDebugPayload(prototype, {
      status,
      reason:
        status === "rejected"
          ? "depthRelationHardReject"
          : status === "warning"
            ? "depthRelationMarginWarning"
            : undefined,
      startedAt,
      completedAt,
      isRejected,
      analysis,
    }),
  )
}

function completeQuickSemanticPointSetComparisonRun(
  autoStatus: "completed" | "cancelled" | "error",
  message: string,
  errorDetails?: { failedStep?: string; stack?: string },
): void {
  const comparison = state.quickSemanticPointSetComparison
  if (!comparison) {
    return
  }

  const pointSetId = comparison.pointSetIds[comparison.activeIndex]
  const analysis = state.analysis
  const failedStep = errorDetails?.failedStep ?? getQuick478DepthDebugCurrentStepLabel()
  const runResult = buildQuickSemanticPointSetComparisonRunResult(
    pointSetId,
    autoStatus,
    message,
    analysis,
  )

  comparison.runs = [...comparison.runs, runResult.run]
  if (pointSetId === comparison.primaryPointSetId) {
    comparison.primaryAnalysis = runResult.analysis
    comparison.primaryPrototype = runResult.prototype
    comparison.primaryRun = runResult.run
    if (runResult.analysis && runResult.prototype) {
      runResult.analysis.depth478Prototype = runResult.prototype
    }
  }

  if (autoStatus === "cancelled") {
    const comparisonSummary = buildSemanticPointSetComparisonSummary(comparison.runs)
    const payload = buildQuick478DepthDebugPayload(null, {
      status: "error",
      reason: "cancelled",
      failedStep,
      stack: errorDetails?.stack,
      startedAt: state.quick478DepthDebug.startedAt ?? new Date().toISOString(),
      completedAt: new Date().toISOString(),
      semanticPointSetComparison: comparisonSummary,
    })
    state.quickSemanticPointSetComparison = null
    finishQuick478DepthDebug(payload)
    return
  }

  comparison.activeIndex += 1
  if (comparison.activeIndex < comparison.pointSetIds.length) {
    startQuickSemanticPointSetComparisonRun()
    return
  }

  const comparisonSummary = buildSemanticPointSetComparisonSummary(comparison.runs)
  const primaryAnalysis = comparison.primaryAnalysis
  const primaryPrototype = comparison.primaryPrototype
  const primaryRun = comparison.primaryRun
  if (primaryAnalysis) {
    if (primaryPrototype) {
      primaryAnalysis.depth478Prototype = primaryPrototype
    }
    state.analysis = primaryAnalysis
  }

  const completedAt = new Date().toISOString()
  const payload = buildQuick478DepthDebugPayload(primaryPrototype, {
    status: primaryRun?.quickRunStatus ?? "error",
    reason: buildQuick478CompletionReason(primaryRun),
    failedStep: primaryRun?.quickRunStatus === "error" ? failedStep : undefined,
    stack: errorDetails?.stack,
    startedAt: state.quick478DepthDebug.startedAt ?? completedAt,
    completedAt,
    isRejected: primaryPrototype?.depthRelationDebug?.isRejected,
    fallbackUsed: primaryRun?.quickRunStatus === "noCandidate" ? false : undefined,
    analysis: primaryAnalysis ?? undefined,
    semanticPointSetComparison: comparisonSummary,
  })
  state.quickSemanticPointSetComparison = null
  finishQuick478DepthDebug(payload)
}

function buildQuickSemanticPointSetComparisonRunResult(
  pointSetId: SemanticPointSetId,
  autoStatus: "completed" | "cancelled" | "error",
  message: string,
  analysis: AnalysisResult | null,
): {
  run: SemanticPointSetComparisonRun
  analysis: AnalysisResult | null
  prototype: Depth478PrototypeResult | null
} {
  if (!analysis || autoStatus === "cancelled") {
    return {
      run: buildSemanticPointSetComparisonRun(pointSetId, "error", null, null),
      analysis,
      prototype: null,
    }
  }

  if (autoStatus !== "completed") {
    const status = message.includes("bestCandidate") ? "noCandidate" : "error"
    return {
      run: buildSemanticPointSetComparisonRun(pointSetId, status, analysis, null),
      analysis,
      prototype: null,
    }
  }

  const finalCandidate = analysis.autoSequenceSummary?.finalCandidate ?? null
  if (!finalCandidate) {
    return {
      run: buildSemanticPointSetComparisonRun(pointSetId, "noCandidate", analysis, null),
      analysis,
      prototype: null,
    }
  }

  const prototype = buildDepth478PrototypeFromSource(
    analysis,
    {
      candidate: cloneCandidate(finalCandidate),
      source8CandidateId: "autoSequenceSummary.finalCandidate",
    },
    createQuick478DepthPrototypeSettings(),
  )
  analysis.depth478Prototype = prototype
  return {
    run: buildSemanticPointSetComparisonRun(
      pointSetId,
      diagnoseQuick478DepthDebugStatus(prototype.depthRelationDebug),
      analysis,
      prototype,
    ),
    analysis,
    prototype,
  }
}

function buildQuick478CompletionReason(
  primaryRun: SemanticPointSetComparisonRun | null,
): string | undefined {
  if (!primaryRun) {
    return "primarySemanticPointSetMissing"
  }
  if (primaryRun.quickRunStatus === "rejected") {
    return "depthRelationHardReject"
  }
  if (primaryRun.quickRunStatus === "warning") {
    return "depthRelationMarginWarning"
  }
  if (primaryRun.quickRunStatus === "noCandidate") {
    return "No candidate passed depth relation hardReject"
  }
  if (primaryRun.quickRunStatus === "error") {
    return "semanticPointSetComparisonError"
  }
  return undefined
}

function buildSemanticPointSetComparisonRun(
  pointSetId: SemanticPointSetId,
  status: Exclude<Quick478DepthDebugStatus, "idle" | "running">,
  analysis: AnalysisResult | null,
  prototype: Depth478PrototypeResult | null,
): SemanticPointSetComparisonRun {
  const finalCandidate = analysis?.autoSequenceSummary?.finalCandidate ?? analysis?.bestCandidate ?? null
  const rotationCenter = finalCandidate ? getCandidateRotationCenter(finalCandidate) : null
  const relation = prototype?.depthRelationDebug
  const perLandmark = prototype?.generatedCandidate?.perLandmarkZSearchDebug?.summary
  const semanticPointZSearchBoundSummary = buildSemanticPointZSearchBoundSummary(analysis)
  const noseTipGroupZ = relation?.groupValues.noseTipGroup?.z ?? null
  const cheekGroupZ = relation?.groupValues.cheekGroup?.z ?? null
  const activeSemanticPointIds = getSemanticPointSet(pointSetId).pointIds
  const candidateIdPointIds = parseCandidateIdSemanticPointIds(finalCandidate?.candidateId)
  const unexpectedPointIds = candidateIdPointIds.filter(
    (pointId) => !activeSemanticPointIds.includes(pointId),
  )
  return {
    semanticPointSetId: pointSetId,
    pointCount: getSemanticPointSet(pointSetId).pointIds.length,
    quickRunStatus: status,
    averageProjectionError: prototype?.projectionEvaluation?.averageProjectionError ?? null,
    maxBucketScore: maxNullable(Object.values(prototype?.projectionEvaluation?.bucketScores ?? {})),
    rotationCenter: {
      y: rotationCenter?.y ?? null,
      z: rotationCenter?.z ?? null,
    },
    pivotZ: finalCandidate?.pivotZ ?? null,
    noseZ: finalCandidate?.zByPointId.nose ?? null,
    leftCheekZ: finalCandidate?.zByPointId.leftCheek ?? null,
    rightCheekZ: finalCandidate?.zByPointId.rightCheek ?? null,
    mouthZ: finalCandidate?.zByPointId.mouth ?? null,
    noseTipGroupZ,
    cheekGroupZ,
    noseCheekDelta:
      noseTipGroupZ === null || cheekGroupZ === null ? null : round(noseTipGroupZ - cheekGroupZ),
    depthRelationStatus: getSemanticPointSetComparisonDepthRelationStatus(relation),
    depthRelationViolationCount: relation?.violationCount ?? null,
    hardRejectViolationCount: relation?.hardRejectViolationCount ?? null,
    perLandmarkAverageErrorBefore: perLandmark?.averageErrorBefore ?? null,
    perLandmarkAverageErrorAfter: perLandmark?.averageErrorAfter ?? null,
    perLandmarkAverageBestDeltaZ: perLandmark?.averageBestDeltaZ ?? null,
    semanticPointZSearchBoundSummary,
    perLandmarkZSearchSummary: perLandmark,
    sourceCandidateId: prototype?.generatedCandidate?.source8CandidateId ?? null,
    activeSemanticPointIds: [...activeSemanticPointIds],
    activeSemanticPointCount: activeSemanticPointIds.length,
    zByPointIdKeys: [...activeSemanticPointIds],
    unexpectedPointIds,
    fitReferencePointSet:
      prototype?.generatedCandidate?.canonicalDepthBasedDebug?.fitReferencePointSet ?? null,
    usesOnlyActiveSemanticPointsForScore: true,
    usesOnlyActiveSemanticPointsForCandidateId: unexpectedPointIds.length === 0,
  }
}

function buildSemanticPointZSearchBoundSummary(
  analysis: AnalysisResult | null | undefined,
): SemanticPointZSearchBoundSummary | undefined {
  if (!analysis) {
    return undefined
  }
  const finalCandidate = analysis.autoSequenceSummary?.finalCandidate ?? analysis.bestCandidate
  if (!finalCandidate) {
    return undefined
  }
  const ranges = collectSemanticPointZSearchRanges(analysis)
  const hits = getSemanticPointSet(analysis.searchSettings.semanticPointSetId).pointIds.flatMap(
    (pointId) => {
      const range = ranges.get(`${pointId}.z`)
      if (!range) {
        return []
      }
      const z = finalCandidate.zByPointId[pointId]
      const hit = getZSearchBoundHit(z, range.min, range.max)
      return hit === "none"
        ? []
        : [
            {
              pointId,
              z: round(z),
              min: round(range.min),
              max: round(range.max),
              hit,
            },
          ]
    },
  )
  return {
    pointCount: getSemanticPointSet(analysis.searchSettings.semanticPointSetId).pointIds.length,
    boundHitCount: hits.length,
    lowerBoundHitCount: hits.filter((hit) => hit.hit === "lower").length,
    upperBoundHitCount: hits.filter((hit) => hit.hit === "upper").length,
    hits,
  }
}

function collectSemanticPointZSearchRanges(
  analysis: AnalysisResult,
): Map<LocalSearchParameter, LocalSearchRange> {
  const ranges = new Map<LocalSearchParameter, LocalSearchRange>()
  const sequenceSteps = analysis.autoSequenceSummary?.steps ?? []
  for (const step of sequenceSteps) {
    const stepRanges = step.searchSettings.coordinateDescentRanges
    if (!stepRanges) {
      continue
    }
    for (const [parameter, range] of Object.entries(stepRanges) as Array<
      [LocalSearchParameter, LocalSearchRange]
    >) {
      if (parameter.endsWith(".z")) {
        ranges.set(parameter, range)
      }
    }
  }
  const localRanges = analysis.searchSettings.localSearchSettings?.coordinateDescentRanges
  if (ranges.size === 0 && localRanges) {
    for (const [parameter, range] of Object.entries(localRanges) as Array<
      [LocalSearchParameter, LocalSearchRange]
    >) {
      if (parameter.endsWith(".z")) {
        ranges.set(parameter, range)
      }
    }
  }
  return ranges
}

function parseCandidateIdSemanticPointIds(candidateId: string | null | undefined): SemanticPointName[] {
  if (!candidateId) {
    return []
  }
  return SEMANTIC_POINT_NAMES.filter((pointId) => candidateId.includes(`${pointId}:`))
}

function getSemanticPointSetComparisonDepthRelationStatus(
  relation: Depth478RelationDebug | undefined,
): SemanticPointSetComparisonDepthRelationStatus {
  if (!relation || relation.isRejected) {
    return "rejected"
  }
  return relation.ruleResults.some((rule) => rule.severity === "warning") ? "warning" : "passed"
}

function buildSemanticPointSetComparisonSummary(
  runs: SemanticPointSetComparisonRun[],
): SemanticPointSetComparisonSummary {
  const recommendation = recommendSemanticPointSet(runs)
  return {
    enabled: true,
    runs,
    recommendedSemanticPointSetId: recommendation.semanticPointSetId,
    recommendationReason: recommendation.reason,
  }
}

function buildBruteforce8ptCanonicalBaseline(
  analysis: AnalysisResult | undefined,
): BruteForce8ptCanonicalBaseline {
  const topN = BRUTEFORCE_8PT_CANONICAL_TOP_N
  const fixedBase = cloneCandidate(NATURAL_NOSE_WITH_ROTATION_CENTER)
  const fixedRotationCenter = getCandidateRotationCenter(fixedBase)
  const settings = analysis
    ? {
        ...analysis.searchSettings,
        semanticPointSetId: "8pt_basic" as const,
        objectiveMode: analysis.searchSettings.objectiveMode,
        outlierFiltering: buildOutlierFilteringSettings({
          ...DEFAULT_OUTLIER_FILTERING_SETTINGS,
          ...QUICK_478_DEPTH_DEBUG_SETTINGS.outlierFiltering,
        }),
        depthRelationFiltering: normalizeDepthRelationFilteringSettings({
          ...DEFAULT_DEPTH_RELATION_FILTERING_SETTINGS,
          enabled: QUICK_478_DEPTH_DEBUG_SETTINGS.depthRelationFiltering.enabled,
          mode: QUICK_478_DEPTH_DEBUG_SETTINGS.depthRelationFiltering.mode,
          applyToObjectiveScore:
            QUICK_478_DEPTH_DEBUG_SETTINGS.depthRelationFiltering.applyToObjectiveScore,
        }),
      }
    : createQuick478DepthDebugSearchSettings(fixedBase, findSearchPreset("rotationCenter8PointFineBalanced"))
  const selected = selectFrames(state.frames, settings).frames
  const frames = buildBruteforce8ptFrames(selected)
  const basePoints = buildBruteforce8ptBasePoints(frames)
  const candidateCount = getBruteforce8ptCanonicalCandidateCount()
  const rawTopResults: BruteForce8ptCandidateResult[] = []
  const structureAwareTopResults: BruteForce8ptCandidateResult[] = []
  let evaluatedCandidateCount = 0
  let rejectedCandidateCount = 0
  let candidateIndex = 0

  if (!basePoints) {
    return createEmptyBruteforce8ptCanonicalBaseline(candidateCount, fixedBase, settings, topN)
  }

  for (const headTop of BRUTEFORCE_8PT_CANONICAL_RANGES.headTop) {
    for (const chin of BRUTEFORCE_8PT_CANONICAL_RANGES.chin) {
      for (const leftCheek of BRUTEFORCE_8PT_CANONICAL_RANGES.leftCheek) {
        for (const rightCheek of BRUTEFORCE_8PT_CANONICAL_RANGES.rightCheek) {
          for (const leftEye of BRUTEFORCE_8PT_CANONICAL_RANGES.leftEye) {
            for (const rightEye of BRUTEFORCE_8PT_CANONICAL_RANGES.rightEye) {
              for (const nose of BRUTEFORCE_8PT_CANONICAL_RANGES.nose) {
                for (const mouth of BRUTEFORCE_8PT_CANONICAL_RANGES.mouth) {
                  candidateIndex += 1
                  evaluatedCandidateCount += 1
                  const candidate = {
                    pivotZ: fixedBase.pivotZ,
                    rotationCenter: fixedRotationCenter,
                    zByPointId: completeSemanticZ({
                      headTop,
                      chin,
                      leftCheek,
                      rightCheek,
                      leftEye,
                      rightEye,
                      nose,
                      mouth,
                    }),
                  }
                  const result = evaluateBruteforce8ptCandidate(
                    candidate,
                    `8pt_bruteforce_${String(candidateIndex).padStart(6, "0")}`,
                    basePoints,
                    frames,
                    settings,
                  )
                  insertBruteforce8ptRawTopResult(rawTopResults, result, topN)
                  if (result.depthStructureDebug8pt.noseVsCheek.status === "rejected") {
                    rejectedCandidateCount += 1
                    continue
                  }
                  insertBruteforce8ptStructureAwareTopResult(structureAwareTopResults, result, topN)
                }
              }
            }
          }
        }
      }
    }
  }

  const rawSorted = rawTopResults.sort(
    (a, b) => a.objectiveScoreBeforeDepthFilter - b.objectiveScoreBeforeDepthFilter,
  )
  rawSorted.forEach((result, index) => {
    result.rawProjectionRank = index + 1
  })
  const structureSorted = structureAwareTopResults.sort(
    (a, b) => a.scoreBreakdown.structureAwareScore - b.scoreBreakdown.structureAwareScore,
  )
  structureSorted.forEach((result, index) => {
    result.structureAwareRank = index + 1
    const rawMatch = rawSorted.find((raw) => raw.candidateId === result.candidateId)
    if (rawMatch?.rawProjectionRank) {
      result.rawProjectionRank = rawMatch.rawProjectionRank
    }
  })
  const rawProjectionTopCandidates = rawSorted.map((result, index) =>
    toBruteforce8ptTopCandidate(result, index + 1, "rawProjection"),
  )
  const structureAwareTopCandidates = structureSorted.map((result, index) =>
    toBruteforce8ptTopCandidate(result, index + 1, "structureAware"),
  )
  const best = structureAwareTopCandidates[0] ?? null
  const rawBest = rawProjectionTopCandidates[0] ?? null
  const finalCandidateSelection = buildBruteforce8ptFinalCandidateSelection(rawBest, best)

  return {
    enabled: true,
    pointSetId: "8pt_canonical_compatible",
    candidateCount,
    evaluatedCandidateCount,
    rejectedCandidateCount,
    topCandidates: structureAwareTopCandidates,
    rawProjectionRanking: {
      description: "投影誤差中心のデバッグ用ランキング。finalCandidate選定には使わない。",
      topCandidates: rawProjectionTopCandidates,
    },
    structureAwareRanking: {
      description: "構造考慮ランキング。finalCandidate選定に使う。",
      settings: buildStructureAwareRankingSettings(),
      topCandidates: structureAwareTopCandidates,
    },
    finalCandidateSelection,
    summary: {
      bestCandidateId: best?.candidateId ?? null,
      bestScore: best?.structureAwareScore ?? null,
      bestCanonicalAverageAbsDelta: best?.canonicalComparison.averageAbsDelta ?? null,
      bestCanonicalMaxAbsDelta: best?.canonicalComparison.maxAbsDelta ?? null,
      bestDepthRelationStatus: best?.depthStructureDebug8pt.score.status ?? null,
      topNCount: topN,
    },
    settings: {
      pointLandmarkIndices: cloneCanonicalCompatible8ptMapping(),
      zRanges: cloneBruteforce8ptRanges(),
      fixedRotationCenterSource: "naturalNoseWithRotationCenter",
      fixedPivotZ: round(fixedBase.pivotZ),
      fixedRotationCenter,
      objectiveMode: settings.objectiveMode,
      outlierFilteringEnabled: settings.outlierFiltering.enabled,
      depthRelationMode: settings.depthRelationFiltering.mode,
    },
  }
}

function createEmptyBruteforce8ptCanonicalBaseline(
  candidateCount: number,
  fixedBase: FittingCandidate8,
  settings: SearchSettings,
  topN: number,
): BruteForce8ptCanonicalBaseline {
  return {
    enabled: true,
    pointSetId: "8pt_canonical_compatible",
    candidateCount,
    evaluatedCandidateCount: 0,
    rejectedCandidateCount: 0,
    topCandidates: [],
    rawProjectionRanking: {
      description: "投影誤差中心のデバッグ用ランキング。finalCandidate選定には使わない。",
      topCandidates: [],
    },
    structureAwareRanking: {
      description: "構造考慮ランキング。finalCandidate選定に使う。",
      settings: buildStructureAwareRankingSettings(),
      topCandidates: [],
    },
    finalCandidateSelection: {
      selectedFrom: "structureAwareRanking",
      selectedCandidateId: null,
      rawProjectionRank: null,
      structureAwareRank: null,
      reason: "8pt canonical compatible base points could not be built.",
    },
    summary: {
      bestCandidateId: null,
      bestScore: null,
      bestCanonicalAverageAbsDelta: null,
      bestCanonicalMaxAbsDelta: null,
      bestDepthRelationStatus: null,
      topNCount: topN,
    },
    settings: {
      pointLandmarkIndices: cloneCanonicalCompatible8ptMapping(),
      zRanges: cloneBruteforce8ptRanges(),
      fixedRotationCenterSource: "naturalNoseWithRotationCenter",
      fixedPivotZ: round(fixedBase.pivotZ),
      fixedRotationCenter: getCandidateRotationCenter(fixedBase),
      objectiveMode: settings.objectiveMode,
      outlierFilteringEnabled: settings.outlierFiltering.enabled,
      depthRelationMode: settings.depthRelationFiltering.mode,
    },
  }
}

function buildBruteforce8ptFrames(frames: NormalizedFrame[]): BruteForce8ptFrame[] {
  return frames.flatMap((frame) => {
    if (!frame.bounds || frame.landmarks.length < CANONICAL_COMPARISON_LANDMARK_COUNT) {
      return []
    }
    const semanticPoints = extractCanonicalCompatible8ptPoints2D(frame.landmarks, frame.aspectRatio)
    if (!semanticPoints) {
      return []
    }
    return [
      {
        captureId: frame.captureId,
        bucket: frame.bucket,
        rawBucket: frame.rawBucket,
        pose: frame.pose,
        semanticPoints,
        bounds: frame.bounds,
        warnings: frame.warnings,
      },
    ]
  })
}

function extractCanonicalCompatible8ptPoints2D(
  landmarks: LandmarkPoint[],
  aspectRatio: number,
): Record<CanonicalCompatible8PointId, SemanticPoint2D> | null {
  const points = {} as Record<CanonicalCompatible8PointId, SemanticPoint2D>
  for (const pointId of CANONICAL_COMPATIBLE_8PT_POINT_IDS) {
    const point = averageByIndices(landmarks, CANONICAL_COMPATIBLE_8PT[pointId])
    if (!point) {
      return null
    }
    points[pointId] = {
      name: pointId,
      x: toSameUnitX(point.x, aspectRatio),
      y: point.y - 0.5,
    }
  }
  return points
}

function buildBruteforce8ptBasePoints(
  frames: BruteForce8ptFrame[],
): Record<CanonicalCompatible8PointId, SemanticPoint2D> | null {
  const frontFrames = frames.filter((frame) => frame.bucket === "front")
  if (frontFrames.length === 0) {
    return null
  }
  const boundsCenter = averagePoint2D(
    frontFrames.map((frame) => ({
      x: frame.bounds.centerX,
      y: frame.bounds.centerY,
    })),
  )
  return Object.fromEntries(
    CANONICAL_COMPATIBLE_8PT_POINT_IDS.map((pointId) => {
      const averagePoint = averagePoint2D(
        frontFrames.map((frame) => frame.semanticPoints[pointId]),
      )
      return [
        pointId,
        {
          name: pointId,
          x: round(averagePoint.x - boundsCenter.x),
          y: round(averagePoint.y - boundsCenter.y),
        },
      ]
    }),
  ) as Record<CanonicalCompatible8PointId, SemanticPoint2D>
}

function evaluateBruteforce8ptCandidate(
  candidate: FittingCandidate8,
  candidateId: string,
  basePoints: Record<CanonicalCompatible8PointId, SemanticPoint2D>,
  frames: BruteForce8ptFrame[],
  settings: SearchSettings,
): BruteForce8ptCandidateResult {
  const ideal3D = Object.fromEntries(
    CANONICAL_COMPATIBLE_8PT_POINT_IDS.map((pointId) => [
      pointId,
      {
        x: basePoints[pointId].x,
        y: basePoints[pointId].y,
        z: candidate.zByPointId[pointId],
      },
    ]),
  ) as Record<CanonicalCompatible8PointId, Point3>
  const perFrameResults = frames.map((frame) =>
    evaluateBruteforce8ptCandidateOnFrame(candidate, ideal3D, frame, settings),
  )
  const rawTotalScore =
    average(perFrameResults.map((result) => result.weightedSemanticDistance)) ??
    Number.POSITIVE_INFINITY
  const rawBucketScores = calculateBruteforce8ptBucketScores(perFrameResults)
  const rawScoreDebug = calculateScoreDebug(rawTotalScore, rawBucketScores)
  const filteredScoreSnapshot = buildBruteforce8ptFilteredScoreSnapshot(
    perFrameResults,
    {
      totalScore: rawTotalScore,
      bucketScores: rawBucketScores,
      scoreDebug: rawScoreDebug,
    },
    settings.outlierFiltering,
  )
  const scoreForObjective = filteredScoreSnapshot ?? {
    totalScore: rawTotalScore,
    bucketScores: rawBucketScores,
    scoreDebug: rawScoreDebug,
  }
  const objectiveScoreBeforeDepthFilter = getObjectiveScore(scoreForObjective, settings.objectiveMode)
  const depthStructureDebug8pt = buildDepthStructureDebug8pt(candidate)
  const canonicalComparison = buildCanonicalComparisonForCandidate(
    candidate,
    CANONICAL_COMPATIBLE_8PT,
    CANONICAL_COMPATIBLE_8PT_POINT_IDS,
  )
  const scoreBreakdown = buildStructureAwareScoreBreakdown({
    candidate,
    pointIds: CANONICAL_COMPATIBLE_8PT_POINT_IDS,
    canonicalComparison,
    projectionScore: objectiveScoreBeforeDepthFilter,
    depthStructureDebug: depthStructureDebug8pt,
    boundRanges: BRUTEFORCE_8PT_CANONICAL_RANGES,
    hardRejectRuleIds: ["nose_vs_cheek"],
  })
  const objectiveScore = scoreBreakdown.hardRejected
    ? Number.POSITIVE_INFINITY
    : objectiveScoreBeforeDepthFilter

  return {
    candidateId,
    candidate,
    totalScore: round(scoreForObjective.totalScore),
    averageProjectionError: round(
      average(perFrameResults.map((result) => result.averageSemanticDistance)) ??
        Number.POSITIVE_INFINITY,
    ),
    bucketScores: roundRecord(scoreForObjective.bucketScores),
    scoreDebug: roundScoreDebug(scoreForObjective.scoreDebug),
    objectiveScoreBeforeDepthFilter: round(objectiveScoreBeforeDepthFilter),
    objectiveScore: round(objectiveScore),
    depthStructureDebug8pt,
    canonicalComparison,
    scoreBreakdown,
  }
}

function evaluateBruteforce8ptCandidateOnFrame(
  candidate: FittingCandidate8,
  ideal3D: Record<CanonicalCompatible8PointId, Point3>,
  frame: BruteForce8ptFrame,
  settings: SearchSettings,
): BruteForce8ptFrameEvaluation {
  const rotationCenter = getCandidateRotationCenter(candidate)
  const projected = Object.fromEntries(
    CANONICAL_COMPATIBLE_8PT_POINT_IDS.map((pointId) => {
      const point = ideal3D[pointId]
      const rotated = rotatePoint3D(
        {
          x: point.x - rotationCenter.x,
          y: point.y - rotationCenter.y,
          z: point.z - rotationCenter.z,
        },
        frame.pose,
      )
      const projectedX = rotated.x + rotationCenter.x
      const projectedY = rotated.y + rotationCenter.y
      const z = rotated.z + rotationCenter.z
      const perspective = settings.focalLength / Math.max(settings.focalLength + z, 0.2)
      return [
        pointId,
        {
          name: pointId,
          x: round(projectedX * perspective),
          y: round(projectedY * perspective),
        },
      ]
    }),
  ) as Record<CanonicalCompatible8PointId, SemanticPoint2D>
  const current = Object.fromEntries(
    CANONICAL_COMPATIBLE_8PT_POINT_IDS.map((pointId) => [
      pointId,
      {
        name: pointId,
        x: round(frame.semanticPoints[pointId].x - frame.bounds.centerX),
        y: round(frame.semanticPoints[pointId].y - frame.bounds.centerY),
      },
    ]),
  ) as Record<CanonicalCompatible8PointId, SemanticPoint2D>
  const perPointError = Object.fromEntries(
    CANONICAL_COMPATIBLE_8PT_POINT_IDS.map((pointId) => [
      pointId,
      round(distance2D(projected[pointId], current[pointId])),
    ]),
  ) as Record<CanonicalCompatible8PointId, number>
  const averageSemanticDistance =
    average(CANONICAL_COMPATIBLE_8PT_POINT_IDS.map((pointId) => perPointError[pointId])) ??
    Number.POSITIVE_INFINITY
  const weightedSemanticDistance = weightedAverage(
    CANONICAL_COMPATIBLE_8PT_POINT_IDS.map((pointId) => ({
      value: perPointError[pointId],
      weight: getSemanticPointWeight(pointId),
    })),
  )

  return {
    captureId: frame.captureId,
    bucket: frame.bucket,
    rawBucket: frame.rawBucket,
    frameError: weightedSemanticDistance,
    averageSemanticDistance,
    weightedSemanticDistance,
    perPointError,
  }
}

function calculateBruteforce8ptBucketScores(
  results: BruteForce8ptFrameEvaluation[],
): PoseBucketScores {
  return {
    front: averageBruteforce8ptBucketScore(results, "front"),
    yawPositive: averageBruteforce8ptBucketScore(results, "yawPositive"),
    yawNegative: averageBruteforce8ptBucketScore(results, "yawNegative"),
    pitchPositive: averageBruteforce8ptBucketScore(results, "pitchPositive"),
    pitchNegative: averageBruteforce8ptBucketScore(results, "pitchNegative"),
    mixedPose: averageBruteforce8ptBucketScore(results, "mixedPose"),
  }
}

function averageBruteforce8ptBucketScore(
  results: BruteForce8ptFrameEvaluation[],
  bucket: CaptureBucket,
): number | null {
  return roundNullable(
    average(results.filter((result) => result.bucket === bucket).map((result) => result.frameError)),
  )
}

function buildBruteforce8ptFilteredScoreSnapshot(
  perFrameResults: BruteForce8ptFrameEvaluation[],
  rawScores: CandidateScoreSnapshot,
  settings: OutlierFilteringSettings,
): CandidateScoreSnapshot | null {
  if (
    !settings.enabled ||
    settings.mode !== "excludeFromInference" ||
    !settings.applyToObjectiveScore
  ) {
    return null
  }
  const outlierIds = new Set<string>()
  for (const bucket of BUCKETS) {
    const bucketResults = perFrameResults.filter((result) => result.bucket === bucket)
    if (bucketResults.length < settings.minBucketSampleCount) {
      continue
    }
    const sortedWorstFirst = [...bucketResults].sort((a, b) => b.frameError - a.frameError)
    const bucketMedianError = median(bucketResults.map((result) => result.frameError))
    const outliers = selectBruteforce8ptOutliers(
      sortedWorstFirst,
      bucketMedianError,
      settings,
    )
    for (const outlier of outliers) {
      outlierIds.add(`${outlier.bucket}:${outlier.captureId}`)
    }
  }
  if (outlierIds.size === 0) {
    return roundScoreSnapshot(rawScores)
  }
  const filteredResults = perFrameResults.filter(
    (result) => !outlierIds.has(`${result.bucket}:${result.captureId}`),
  )
  const totalScore =
    average(filteredResults.map((result) => result.weightedSemanticDistance)) ??
    Number.POSITIVE_INFINITY
  const bucketScores = calculateBruteforce8ptBucketScores(filteredResults)
  return roundScoreSnapshot({
    totalScore,
    bucketScores,
    scoreDebug: calculateScoreDebug(totalScore, bucketScores),
  })
}

function selectBruteforce8ptOutliers(
  sortedWorstFirst: BruteForce8ptFrameEvaluation[],
  bucketMedianError: number | null,
  settings: OutlierFilteringSettings,
): BruteForce8ptFrameEvaluation[] {
  const maxOutliers = Math.max(0, Math.round(settings.perBucketMaxOutliers))
  if (maxOutliers === 0 || sortedWorstFirst.length === 0) {
    return []
  }
  if (settings.method === "topWorstPercent") {
    const percentCount = Math.ceil(sortedWorstFirst.length * Math.max(0, settings.topWorstPercent) / 100)
    return sortedWorstFirst.slice(0, Math.min(maxOutliers, percentCount))
  }
  if (bucketMedianError === null) {
    return []
  }
  if (settings.method === "medianAbsoluteDelta") {
    const threshold = bucketMedianError + settings.absoluteDeltaThreshold
    return sortedWorstFirst
      .filter((result) => result.frameError > threshold)
      .slice(0, maxOutliers)
  }
  const threshold = bucketMedianError * settings.medianMultiplier
  return sortedWorstFirst
    .filter((result) => result.frameError > threshold)
    .slice(0, maxOutliers)
}

function roundScoreSnapshot(snapshot: CandidateScoreSnapshot): CandidateScoreSnapshot {
  return {
    totalScore: round(snapshot.totalScore),
    bucketScores: roundRecord(snapshot.bucketScores),
    scoreDebug: roundScoreDebug(snapshot.scoreDebug),
  }
}

function buildDepthStructureDebug8pt(candidate: FittingCandidate8): BruteForce8ptDepthStructureDebug {
  const z = candidate.zByPointId
  const cheekZ = average([z.leftCheek, z.rightCheek]) ?? null
  const centerZ = average([z.nose, z.mouth, z.leftEye, z.rightEye]) ?? null
  const boundaryZ = average([z.headTop, z.chin, z.leftCheek, z.rightCheek]) ?? null
  const checks = {
    noseVsCheek: buildBruteforce8ptRelationCheck(
      "nose",
      z.nose,
      "cheeks",
      cheekZ,
      QUICK_DEPTH_478_NOSE_CHEEK_MARGIN,
      "inFrontOf",
    ),
    centerVsBoundary: buildBruteforce8ptRelationCheck(
      "faceCenter",
      centerZ,
      "faceBoundary",
      boundaryZ,
      0,
      "inFrontOf",
    ),
    chinTooFront: buildBruteforce8ptRelationCheck(
      "chin",
      z.chin,
      "nose",
      z.nose,
      BRUTEFORCE_8PT_CHIN_TOO_FRONT_MARGIN,
      "notTooFarInFrontOf",
    ),
    jawVsCheek: buildBruteforce8ptRelationCheck(
      "chinAsJaw",
      z.chin,
      "cheeks",
      cheekZ,
      BRUTEFORCE_8PT_JAW_CHEEK_MARGIN,
      "notTooFarInFrontOf",
    ),
  }
  const values = Object.values(checks)
  const violationCount = values.filter((check) => check.status === "rejected").length
  const warningCount = values.filter((check) => check.status === "warning").length
  return {
    ...checks,
    score: {
      status: violationCount > 0 ? "rejected" : warningCount > 0 ? "warning" : "passed",
      violationCount,
      warningCount,
    },
  }
}

function buildBruteforce8ptRelationCheck(
  subjectId: string,
  subjectZ: number | null,
  referenceId: string,
  referenceZ: number | null,
  margin: number,
  relation: "inFrontOf" | "notTooFarInFrontOf",
): BruteForce8ptDepthRelationCheck {
  const delta = subjectZ === null || referenceZ === null ? null : round(subjectZ - referenceZ)
  const passed =
    delta !== null &&
    (relation === "inFrontOf" ? delta < -margin : delta >= -margin)
  const directionOk =
    delta !== null &&
    (relation === "inFrontOf" ? delta < 0 : delta >= -margin * 1.5)
  const status: BruteForce8ptDepthRelationStatus = passed
    ? "passed"
    : directionOk
      ? "warning"
      : "rejected"
  return {
    passed,
    status,
    subjectZ: roundNullable(subjectZ),
    referenceZ: roundNullable(referenceZ),
    delta,
    margin: round(margin),
    explanation:
      delta === null
        ? `${subjectId}.z or ${referenceId}.z is missing`
        : `${subjectId}.z=${formatNumber(subjectZ)} / ${referenceId}.z=${formatNumber(referenceZ)} / delta=${formatNumber(delta)}`,
  }
}

function buildCanonicalComparisonForCandidate(
  candidate: FittingCandidate8,
  indexMapping: Record<string, number[]>,
  pointIds: SemanticPointName[],
): BruteForce8ptCanonicalComparison {
  validateCanonicalDepthTemplate(CANONICAL_FACE_DEPTH_TEMPLATE)
  const canonicalByIndex = buildCanonicalDepthByIndex("raw")
  const points = pointIds.flatMap((pointId) => {
    const landmarkIndex = indexMapping[pointId] ?? []
    const canonicalValues = landmarkIndex
      .map((index) => canonicalByIndex.get(index)?.z)
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
    if (canonicalValues.length === 0) {
      return []
    }
    const canonicalZ = average(canonicalValues) ?? 0
    const candidateZ = candidate.zByPointId[pointId]
    return [
      {
        pointId,
        landmarkIndex: [...landmarkIndex],
        candidateZ: round(candidateZ),
        canonicalZ: round(canonicalZ),
        delta: round(candidateZ - canonicalZ),
      },
    ]
  })
  const absDeltas = points.map((point) => Math.abs(point.delta))
  return {
    averageAbsDelta: round(average(absDeltas) ?? 0),
    maxAbsDelta: round(max(absDeltas) ?? 0),
    points,
  }
}

function buildCanonicalComparisonForSemanticPointSetCandidate(
  candidate: FittingCandidate8 | null | undefined,
  pointSetId: SemanticPointSetId,
): BruteForce8ptCanonicalComparison | null {
  if (!candidate) {
    return null
  }
  const pointIds = getSemanticPointSet(pointSetId).pointIds
  return buildCanonicalComparisonForSemanticPointIds(candidate, pointIds)
}

function insertBruteforce8ptRawTopResult(
  results: BruteForce8ptCandidateResult[],
  next: BruteForce8ptCandidateResult,
  topN: number,
): void {
  results.push(next)
  results.sort((a, b) => a.objectiveScoreBeforeDepthFilter - b.objectiveScoreBeforeDepthFilter)
  if (results.length > topN) {
    results.length = topN
  }
}

function insertBruteforce8ptStructureAwareTopResult(
  results: BruteForce8ptCandidateResult[],
  next: BruteForce8ptCandidateResult,
  topN: number,
): void {
  results.push(next)
  results.sort((a, b) => a.scoreBreakdown.structureAwareScore - b.scoreBreakdown.structureAwareScore)
  if (results.length > topN) {
    results.length = topN
  }
}

function toBruteforce8ptTopCandidate(
  result: BruteForce8ptCandidateResult,
  rank: number,
  rankingType: "rawProjection" | "structureAware",
): BruteForce8ptTopCandidate {
  return {
    candidateId: result.candidateId,
    rank,
    rawProjectionRank: result.rawProjectionRank ?? (rankingType === "rawProjection" ? rank : null),
    structureAwareRank:
      result.structureAwareRank ?? (rankingType === "structureAware" ? rank : null),
    totalScore: round(result.totalScore),
    objectiveScore: round(result.objectiveScore),
    objectiveScoreBeforeDepthFilter: round(result.objectiveScoreBeforeDepthFilter),
    rawProjectionScore: round(result.objectiveScoreBeforeDepthFilter),
    structureAwareScore: round(result.scoreBreakdown.structureAwareScore),
    scoreBreakdown: result.scoreBreakdown,
    averageProjectionError: round(result.averageProjectionError),
    bucketScores: roundRecord(result.bucketScores),
    scoreDebug: roundScoreDebug(result.scoreDebug),
    zByPointId: pickCanonicalCompatible8ptZ(result.candidate),
    canonicalComparison: result.canonicalComparison,
    depthStructureDebug8pt: result.depthStructureDebug8pt,
  }
}

function pickCanonicalCompatible8ptZ(
  candidate: FittingCandidate8,
): Record<CanonicalCompatible8PointId, number> {
  return Object.fromEntries(
    CANONICAL_COMPATIBLE_8PT_POINT_IDS.map((pointId) => [
      pointId,
      round(candidate.zByPointId[pointId]),
    ]),
  ) as Record<CanonicalCompatible8PointId, number>
}

function getBruteforce8ptCanonicalCandidateCount(): number {
  return CANONICAL_COMPATIBLE_8PT_POINT_IDS.reduce(
    (total, pointId) => total * BRUTEFORCE_8PT_CANONICAL_RANGES[pointId].length,
    1,
  )
}

function cloneCanonicalCompatible8ptMapping(): Record<CanonicalCompatible8PointId, number[]> {
  return Object.fromEntries(
    CANONICAL_COMPATIBLE_8PT_POINT_IDS.map((pointId) => [
      pointId,
      [...CANONICAL_COMPATIBLE_8PT[pointId]],
    ]),
  ) as Record<CanonicalCompatible8PointId, number[]>
}

function cloneBruteforce8ptRanges(): Record<CanonicalCompatible8PointId, number[]> {
  return Object.fromEntries(
    CANONICAL_COMPATIBLE_8PT_POINT_IDS.map((pointId) => [
      pointId,
      [...BRUTEFORCE_8PT_CANONICAL_RANGES[pointId]],
    ]),
  ) as Record<CanonicalCompatible8PointId, number[]>
}

function getSemanticPointWeight(pointId: SemanticPointName): number {
  return SEMANTIC_DEFINITIONS.find((definition) => definition.name === pointId)?.weight ?? 1
}

function buildStructureAwareRankingSettings(): StructureAwareRanking<unknown>["settings"] {
  return {
    enabled: true,
    useDepthRelationPenalty: true,
    useCanonicalStructurePenalty: true,
    useBoundHitPenalty: true,
  }
}

function buildStructureAwareScoreBreakdown(options: {
  candidate: FittingCandidate8
  pointIds: SemanticPointName[]
  canonicalComparison: BruteForce8ptCanonicalComparison | null
  projectionScore: number
  depthStructureDebug?: BruteForce8ptDepthStructureDebug
  boundRanges?: Partial<Record<SemanticPointName, number[]>>
  semanticBoundRanges?: Map<LocalSearchParameter, LocalSearchRange>
  hardRejectRuleIds?: string[]
}): StructureAwareScoreBreakdown {
  const depthRelationPenalty = buildDepthRelationPenaltyDebug(
    options.depthStructureDebug ?? buildDepthStructureDebugForPointSet(options.candidate, options.pointIds),
  )
  const canonicalStructurePenalty = buildCanonicalStructurePenaltyDebug(
    options.candidate,
    options.pointIds,
    options.canonicalComparison,
  )
  const boundHitPenalty = buildBoundHitPenaltyDebug(
    options.candidate,
    options.pointIds,
    options.boundRanges,
    options.semanticBoundRanges,
  )
  const hardRejectReasons = depthRelationPenalty.violations
    .filter((violation) => options.hardRejectRuleIds?.includes(violation.ruleId))
    .map((violation) => violation.label)
  const structureAwareScore = round(
    options.projectionScore +
      depthRelationPenalty.value +
      canonicalStructurePenalty.value +
      boundHitPenalty.value,
  )
  return {
    projectionScore: round(options.projectionScore),
    depthRelationPenalty,
    canonicalStructurePenalty,
    boundHitPenalty,
    structureAwareScore,
    hardRejected: hardRejectReasons.length > 0,
    hardRejectReasons,
  }
}

function buildDepthRelationPenaltyDebug(
  debug: BruteForce8ptDepthStructureDebug,
): DepthRelationPenaltyDebug {
  const checks: Array<{
    ruleId: string
    label: string
    check: BruteForce8ptDepthRelationCheck
  }> = [
    { ruleId: "nose_vs_cheek", label: "鼻が頬より手前ではない", check: debug.noseVsCheek },
    {
      ruleId: "center_vs_boundary",
      label: "顔中心が顔境界より手前ではない",
      check: debug.centerVsBoundary,
    },
    { ruleId: "chin_too_front", label: "顎が手前に出すぎ", check: debug.chinTooFront },
    {
      ruleId: "jaw_vs_cheek",
      label: "顎・顔境界が頬より手前に出すぎ",
      check: debug.jawVsCheek,
    },
  ]
  const violations = checks.flatMap(({ ruleId, label, check }) => {
    if (check.status === "passed") {
      return []
    }
    const distance = calculateStructureRelationViolationDistance(ruleId, check)
    const multiplier = check.status === "rejected" ? 0.7 : 0.25
    const penalty = round(Math.max(0.002, distance * multiplier))
    return [
      {
        ruleId,
        label,
        penalty,
        details: {
          status: check.status,
          subjectZ: check.subjectZ,
          referenceZ: check.referenceZ,
          delta: check.delta,
          margin: check.margin,
        },
      },
    ]
  })
  return {
    value: round(violations.reduce((total, violation) => total + violation.penalty, 0)),
    violations,
  }
}

function calculateStructureRelationViolationDistance(
  ruleId: string,
  check: BruteForce8ptDepthRelationCheck,
): number {
  if (check.delta === null) {
    return 0.01
  }
  if (ruleId === "nose_vs_cheek" || ruleId === "center_vs_boundary") {
    return Math.max(0, check.delta + check.margin)
  }
  return Math.max(0, -check.margin - check.delta)
}

function buildCanonicalStructurePenaltyDebug(
  candidate: FittingCandidate8,
  pointIds: SemanticPointName[],
  canonicalComparison: BruteForce8ptCanonicalComparison | null,
): CanonicalStructurePenaltyDebug {
  const comparison =
    canonicalComparison ??
    buildCanonicalComparisonForSemanticPointIds(candidate, pointIds)
  const canonicalCorrelation = calculateCanonicalCorrelation(comparison)
  const correlationPenalty =
    canonicalCorrelation === null
      ? 0.02
      : canonicalCorrelation < 0
        ? Math.min(0.09, Math.abs(canonicalCorrelation) * STRUCTURE_AWARE_CORRELATION_NEGATIVE_PENALTY + 0.02)
        : canonicalCorrelation < STRUCTURE_AWARE_CORRELATION_WARNING_THRESHOLD
          ? round((STRUCTURE_AWARE_CORRELATION_WARNING_THRESHOLD - canonicalCorrelation) * 0.04)
          : 0
  const canonicalPairOrderPenalty = buildCanonicalPairOrderPenalty(candidate, comparison, pointIds)
  const canonicalDeltaPenalty = buildCanonicalDeltaPenalty(comparison)
  return {
    value: round(correlationPenalty + canonicalPairOrderPenalty.value + canonicalDeltaPenalty.penalty),
    canonicalCorrelation,
    correlationPenalty: round(correlationPenalty),
    isInvertedLike: canonicalCorrelation !== null && canonicalCorrelation < 0,
    canonicalPairOrderPenalty,
    canonicalDeltaPenalty,
  }
}

function buildCanonicalComparisonForSemanticPointIds(
  candidate: FittingCandidate8,
  pointIds: SemanticPointName[],
): BruteForce8ptCanonicalComparison {
  const indexMapping = Object.fromEntries(
    pointIds.map((pointId) => {
      if (pointId === "leftEye") {
        return [pointId, CANONICAL_COMPATIBLE_8PT.leftEye]
      }
      if (pointId === "rightEye") {
        return [pointId, CANONICAL_COMPATIBLE_8PT.rightEye]
      }
      const definition = SEMANTIC_DEFINITIONS.find((item) => item.name === pointId)
      return [pointId, definition ? getCanonicalFitReferenceIndices(definition) : []]
    }),
  ) as Record<string, number[]>
  return buildCanonicalComparisonForCandidate(candidate, indexMapping, pointIds)
}

function calculateCanonicalCorrelation(
  comparison: BruteForce8ptCanonicalComparison | null,
): number | null {
  const points = comparison?.points ?? []
  if (points.length < 2) {
    return null
  }
  const candidateValues = points.map((point) => point.candidateZ)
  const canonicalValues = points.map((point) => point.canonicalZ)
  const candidateMean = average(candidateValues) ?? 0
  const canonicalMean = average(canonicalValues) ?? 0
  const covariance = points.reduce(
    (total, point) =>
      total + (point.candidateZ - candidateMean) * (point.canonicalZ - canonicalMean),
    0,
  )
  const candidateVariance = candidateValues.reduce(
    (total, value) => total + Math.pow(value - candidateMean, 2),
    0,
  )
  const canonicalVariance = canonicalValues.reduce(
    (total, value) => total + Math.pow(value - canonicalMean, 2),
    0,
  )
  if (candidateVariance <= EPSILON || canonicalVariance <= EPSILON) {
    return null
  }
  return round(covariance / Math.sqrt(candidateVariance * canonicalVariance))
}

function buildCanonicalPairOrderPenalty(
  candidate: FittingCandidate8,
  comparison: BruteForce8ptCanonicalComparison,
  pointIds: SemanticPointName[],
): CanonicalPairOrderPenaltyDebug {
  const canonicalByPointId = new Map(
    comparison.points.map((point) => [point.pointId, point.canonicalZ]),
  )
  const has = (pointId: SemanticPointName): boolean => pointIds.includes(pointId)
  const cheekCandidate = average([candidate.zByPointId.leftCheek, candidate.zByPointId.rightCheek])
  const cheekCanonical = average([
    canonicalByPointId.get("leftCheek") ?? Number.NaN,
    canonicalByPointId.get("rightCheek") ?? Number.NaN,
  ].filter(Number.isFinite))
  const hasJawPoints = has("leftJaw") && has("rightJaw")
  const jawCandidate = hasJawPoints
    ? average([candidate.zByPointId.leftJaw, candidate.zByPointId.rightJaw]) ?? candidate.zByPointId.chin
    : candidate.zByPointId.chin
  const jawCanonical = hasJawPoints
    ? average(
        [canonicalByPointId.get("leftJaw"), canonicalByPointId.get("rightJaw")]
          .filter((value): value is number => typeof value === "number" && Number.isFinite(value)),
      )
    : canonicalByPointId.get("chin") ?? null
  const pairChecks: Array<{
    pairId: string
    label: string
    candidateDelta: number | null
    canonicalDelta: number | null
    allowed: (candidateDelta: number, canonicalDelta: number | null) => boolean
    penaltyDistance: (candidateDelta: number, canonicalDelta: number | null) => number
  }> = [
    {
      pairId: "nose_vs_cheek",
      label: "鼻は頬より手前",
      candidateDelta: cheekCandidate === null ? null : candidate.zByPointId.nose - cheekCandidate,
      canonicalDelta:
        cheekCanonical === null || canonicalByPointId.get("nose") === undefined
          ? null
          : canonicalByPointId.get("nose")! - cheekCanonical,
      allowed: (delta) => delta < 0,
      penaltyDistance: (delta) => Math.max(0, delta),
    },
    ...(has("noseBridge")
      ? [
          {
            pairId: "nose_bridge_vs_cheek",
            label: "鼻筋は頬より手前",
            candidateDelta:
              cheekCandidate === null ? null : candidate.zByPointId.noseBridge - cheekCandidate,
            canonicalDelta:
              cheekCanonical === null || canonicalByPointId.get("noseBridge") === undefined
                ? null
                : canonicalByPointId.get("noseBridge")! - cheekCanonical,
            allowed: (delta: number) => delta < 0.01,
            penaltyDistance: (delta: number) => Math.max(0, delta - 0.01),
          },
        ]
      : []),
    {
      pairId: "chin_vs_nose",
      label: "顎が鼻より手前に出すぎ",
      candidateDelta: candidate.zByPointId.chin - candidate.zByPointId.nose,
      canonicalDelta:
        canonicalByPointId.get("chin") === undefined || canonicalByPointId.get("nose") === undefined
          ? null
          : canonicalByPointId.get("chin")! - canonicalByPointId.get("nose")!,
      allowed: (delta) => delta >= -BRUTEFORCE_8PT_CHIN_TOO_FRONT_MARGIN,
      penaltyDistance: (delta) => Math.max(0, -BRUTEFORCE_8PT_CHIN_TOO_FRONT_MARGIN - delta),
    },
    {
      pairId: "jaw_vs_cheek",
      label: "顎・顎横が頬より手前に出すぎ",
      candidateDelta: cheekCandidate === null ? null : jawCandidate - cheekCandidate,
      canonicalDelta: cheekCanonical === null || jawCanonical === null ? null : jawCanonical - cheekCanonical,
      allowed: (delta) => delta >= -BRUTEFORCE_8PT_JAW_CHEEK_MARGIN,
      penaltyDistance: (delta) => Math.max(0, -BRUTEFORCE_8PT_JAW_CHEEK_MARGIN - delta),
    },
    ...(has("noseBridge")
      ? [
          {
            pairId: "mouth_vs_nose_bridge",
            label: "口が鼻筋より奥に行きすぎ",
            candidateDelta: candidate.zByPointId.mouth - candidate.zByPointId.noseBridge,
            canonicalDelta:
              canonicalByPointId.get("mouth") === undefined ||
              canonicalByPointId.get("noseBridge") === undefined
                ? null
                : canonicalByPointId.get("mouth")! - canonicalByPointId.get("noseBridge")!,
            allowed: (delta: number, canonicalDelta: number | null) =>
              delta <= Math.max(0.06, (canonicalDelta ?? 0) + 0.04),
            penaltyDistance: (delta: number, canonicalDelta: number | null) =>
              Math.max(0, delta - Math.max(0.06, (canonicalDelta ?? 0) + 0.04)),
          },
        ]
      : []),
  ]
  const violations = pairChecks.flatMap((check) => {
    if (check.candidateDelta === null || check.allowed(check.candidateDelta, check.canonicalDelta)) {
      return []
    }
    const penalty = round(Math.max(0.002, check.penaltyDistance(check.candidateDelta, check.canonicalDelta) * 0.6))
    return [
      {
        pairId: check.pairId,
        label: check.label,
        candidateDelta: roundNullable(check.candidateDelta),
        canonicalDelta: roundNullable(check.canonicalDelta),
        penalty,
      },
    ]
  })
  return {
    value: round(violations.reduce((total, violation) => total + violation.penalty, 0)),
    violations,
  }
}

function buildCanonicalDeltaPenalty(
  comparison: BruteForce8ptCanonicalComparison,
): CanonicalDeltaPenaltyDebug {
  const averagePenalty = Math.max(
    0,
    comparison.averageAbsDelta - STRUCTURE_AWARE_CANONICAL_AVERAGE_DELTA_FREE,
  ) * 0.15
  const maxPenalty = Math.max(
    0,
    comparison.maxAbsDelta - STRUCTURE_AWARE_CANONICAL_MAX_DELTA_FREE,
  ) * 0.05
  return {
    averageAbsDelta: comparison.averageAbsDelta,
    maxAbsDelta: comparison.maxAbsDelta,
    penalty: round(averagePenalty + maxPenalty),
  }
}

function buildBoundHitPenaltyDebug(
  candidate: FittingCandidate8,
  pointIds: SemanticPointName[],
  boundRanges?: Partial<Record<SemanticPointName, number[]>>,
  semanticBoundRanges?: Map<LocalSearchParameter, LocalSearchRange>,
): BoundHitPenaltyDebug {
  const hits = pointIds.flatMap((pointId) => {
    const z = candidate.zByPointId[pointId]
    const explicitRange = boundRanges?.[pointId]
    const minValue = explicitRange ? min(explicitRange) : semanticBoundRanges?.get(`${pointId}.z`)?.min
    const maxValue = explicitRange ? max(explicitRange) : semanticBoundRanges?.get(`${pointId}.z`)?.max
    if (minValue === null || minValue === undefined || maxValue === null || maxValue === undefined) {
      return []
    }
    const hit = Math.abs(z - minValue) <= EPSILON
      ? "lower"
      : Math.abs(z - maxValue) <= EPSILON
        ? "upper"
        : null
    if (!hit) {
      return []
    }
    const important =
      hit === "lower" &&
      ["chin", "leftJaw", "rightJaw", "lowerJawLeft", "lowerJawRight"].includes(pointId)
    const penalty = important
      ? STRUCTURE_AWARE_IMPORTANT_BOUND_HIT_PENALTY
      : STRUCTURE_AWARE_BOUND_HIT_PENALTY
    return [
      {
        pointId,
        z: round(z),
        min: round(minValue),
        max: round(maxValue),
        hit,
        penalty,
      },
    ]
  })
  return {
    value: round(hits.reduce((total, hit) => total + hit.penalty, 0)),
    boundHitCount: hits.length,
    hits,
  }
}

function buildDepthStructureDebugForPointSet(
  candidate: FittingCandidate8,
  pointIds: SemanticPointName[],
): BruteForce8ptDepthStructureDebug {
  const z = candidate.zByPointId
  const cheekZ = average([z.leftCheek, z.rightCheek]) ?? null
  const centerPointIds = pointIds.filter((pointId) =>
    ["nose", "mouth", "leftEye", "rightEye", "noseBridge", "upperFaceCenter"].includes(pointId),
  )
  const boundaryPointIds = pointIds.filter((pointId) =>
    ["headTop", "chin", "leftCheek", "rightCheek", "leftJaw", "rightJaw"].includes(pointId),
  )
  const centerZ = average(centerPointIds.map((pointId) => z[pointId])) ?? null
  const boundaryZ = average(boundaryPointIds.map((pointId) => z[pointId])) ?? null
  const jawZ =
    pointIds.includes("leftJaw") && pointIds.includes("rightJaw")
      ? average([z.leftJaw, z.rightJaw]) ?? z.chin
      : z.chin
  const checks = {
    noseVsCheek: buildBruteforce8ptRelationCheck(
      "nose",
      z.nose,
      "cheeks",
      cheekZ,
      QUICK_DEPTH_478_NOSE_CHEEK_MARGIN,
      "inFrontOf",
    ),
    centerVsBoundary: buildBruteforce8ptRelationCheck(
      "faceCenter",
      centerZ,
      "faceBoundary",
      boundaryZ,
      0,
      "inFrontOf",
    ),
    chinTooFront: buildBruteforce8ptRelationCheck(
      "chin",
      z.chin,
      "nose",
      z.nose,
      BRUTEFORCE_8PT_CHIN_TOO_FRONT_MARGIN,
      "notTooFarInFrontOf",
    ),
    jawVsCheek: buildBruteforce8ptRelationCheck(
      "jaw",
      jawZ,
      "cheeks",
      cheekZ,
      BRUTEFORCE_8PT_JAW_CHEEK_MARGIN,
      "notTooFarInFrontOf",
    ),
  }
  const values = Object.values(checks)
  const violationCount = values.filter((check) => check.status === "rejected").length
  const warningCount = values.filter((check) => check.status === "warning").length
  return {
    ...checks,
    score: {
      status: violationCount > 0 ? "rejected" : warningCount > 0 ? "warning" : "passed",
      violationCount,
      warningCount,
    },
  }
}

function buildBruteforce8ptFinalCandidateSelection(
  rawBest: BruteForce8ptTopCandidate | null,
  structureBest: BruteForce8ptTopCandidate | null,
): BruteForce8ptCanonicalBaseline["finalCandidateSelection"] {
  if (!structureBest) {
    return {
      selectedFrom: "structureAwareRanking",
      selectedCandidateId: null,
      rawProjectionRank: rawBest?.rank ?? null,
      structureAwareRank: null,
      reason: "structureAwareRanking に hardReject 通過候補がありません。",
    }
  }
  if (!rawBest || rawBest.candidateId === structureBest.candidateId) {
    return {
      selectedFrom: "structureAwareRanking",
      selectedCandidateId: structureBest.candidateId,
      rawProjectionRank: structureBest.rawProjectionRank ?? null,
      structureAwareRank: structureBest.structureAwareRank ?? structureBest.rank,
      reason: "rawProjectionRanking と structureAwareRanking の最上位が一致しました。",
    }
  }
  const topPenalty = rawBest.scoreBreakdown.depthRelationPenalty.violations[0]
    ?? rawBest.scoreBreakdown.canonicalStructurePenalty.canonicalPairOrderPenalty.violations[0]
  const topPenaltyId = topPenalty
    ? "ruleId" in topPenalty
      ? topPenalty.ruleId
      : topPenalty.pairId
    : "structurePenalty"
  return {
    selectedFrom: "structureAwareRanking",
    selectedCandidateId: structureBest.candidateId,
    rawProjectionRank: structureBest.rawProjectionRank ?? null,
    structureAwareRank: structureBest.structureAwareRank ?? structureBest.rank,
    reason: `raw rank 1 は ${topPenaltyId} の構造ペナルティが大きいため不採用`,
  }
}

function buildStructureAwareReranking(
  analysis: AnalysisResult,
): StructureAwareRerankingSummary | undefined {
  const auto = analysis.autoSequenceSummary
  if (!auto || analysis.rawRanking.length === 0) {
    return undefined
  }
  const pointIds = getSemanticPointSet(analysis.searchSettings.semanticPointSetId).pointIds
  const semanticBoundRanges = collectSemanticPointZSearchRanges(analysis)
  const rawRanks = new Map(analysis.rawRanking.map((entry) => [entry.candidateId, entry.rank]))
  const candidates = analysis.rawRanking.flatMap((entry) => {
    const breakdown = buildStructureAwareScoreBreakdownForRankingEntry(
      entry,
      pointIds,
      analysis,
      semanticBoundRanges,
    )
    if (breakdown.hardRejected) {
      return []
    }
    const canonicalComparison = buildCanonicalComparisonForSemanticPointIds(
      entry.candidate,
      pointIds,
    )
    const depthDebug = buildDepthStructureDebugForPointSet(entry.candidate, pointIds)
    return [
      {
        candidateId: entry.candidateId,
        rawProjectionRank: rawRanks.get(entry.candidateId) ?? null,
        structureAwareRank: 0,
        rawProjectionScore: breakdown.projectionScore,
        structureAwareScore: breakdown.structureAwareScore,
        averageProjectionError: entry.averageSemanticDistance,
        canonicalComparison,
        depthRelationStatus: depthDebug.score.status,
        boundHitCount: breakdown.boundHitPenalty.boundHitCount,
        scoreBreakdown: breakdown,
        candidate: cloneCandidate(entry.candidate),
      },
    ]
  })
  const topCandidates = candidates
    .sort((a, b) => a.structureAwareScore - b.structureAwareScore)
    .slice(0, STRUCTURE_AWARE_TOP_N)
    .map((candidate, index) => ({
      ...candidate,
      structureAwareRank: index + 1,
    }))
  const wouldSelectCandidateId = topCandidates[0]?.candidateId ?? null
  const currentFinalCandidateId =
    auto.steps.at(-1)?.bestCandidateId ?? null
  return {
    enabled: true,
    description: "構造考慮ランキング。現時点では既存 finalCandidate は維持し、wouldSelectCandidateId として比較します。",
    topCandidates,
    wouldSelectCandidateId,
    currentFinalCandidateId,
    wouldChangeFinalCandidate:
      Boolean(wouldSelectCandidateId && currentFinalCandidateId) &&
      wouldSelectCandidateId !== currentFinalCandidateId,
  }
}

function buildStructureAwareScoreBreakdownForRankingEntry(
  entry: RankingEntry,
  pointIds: SemanticPointName[],
  analysis: AnalysisResult,
  semanticBoundRanges: Map<LocalSearchParameter, LocalSearchRange>,
): StructureAwareScoreBreakdown {
  return buildStructureAwareScoreBreakdown({
    candidate: entry.candidate,
    pointIds,
    canonicalComparison: buildCanonicalComparisonForSemanticPointIds(entry.candidate, pointIds),
    projectionScore: entry.objectiveScoreBeforeDepthFilter ?? entry.objectiveScore,
    depthStructureDebug: buildDepthStructureDebugForPointSet(entry.candidate, pointIds),
    semanticBoundRanges,
    hardRejectRuleIds: ["nose_vs_cheek"],
  })
}

function buildStructureAwareScoreBreakdownForRankingCandidate(
  candidateId: string,
  candidate: FittingCandidate8,
  analysis: AnalysisResult | undefined,
): StructureAwareScoreBreakdown | null {
  if (!analysis) {
    return null
  }
  const pointIds = getSemanticPointSet(analysis.searchSettings.semanticPointSetId).pointIds
  const matchingEntry =
    analysis.rawRanking.find((entry) => entry.candidateId === candidateId) ??
    analysis.topCandidates.find((entry) => entry.candidateId === candidateId)
  const projectionScore =
    matchingEntry?.objectiveScoreBeforeDepthFilter ??
    matchingEntry?.objectiveScore ??
    analysis.autoSequenceSummary?.finalObjectiveScore ??
    0
  return buildStructureAwareScoreBreakdown({
    candidate,
    pointIds,
    canonicalComparison: buildCanonicalComparisonForSemanticPointIds(candidate, pointIds),
    projectionScore,
    depthStructureDebug: buildDepthStructureDebugForPointSet(candidate, pointIds),
    semanticBoundRanges: collectSemanticPointZSearchRanges(analysis),
    hardRejectRuleIds: ["nose_vs_cheek"],
  })
}

function buildCandidateComparison8ptVs12pt(
  baseline: BruteForce8ptCanonicalBaseline,
  analysis: AnalysisResult | undefined,
  prototype: Depth478PrototypeResult | null,
  primaryRun: SemanticPointSetComparisonRun | null | undefined,
): CandidateComparison8ptVs12pt {
  const best8ptRaw = baseline.rawProjectionRanking.topCandidates[0] ?? null
  const best8ptStructure = baseline.structureAwareRanking.topCandidates[0] ?? null
  const best8pt = best8ptStructure
  const final12ptCandidate = analysis?.autoSequenceSummary?.finalCandidate ?? null
  const final12ptCanonical = buildCanonicalComparisonForSemanticPointSetCandidate(
    final12ptCandidate,
    "12pt_rotation_center",
  )
  const final12ptBreakdown = final12ptCandidate
    ? buildStructureAwareScoreBreakdownForRankingCandidate(
        final12ptCandidateIdFromAnalysis(analysis, prototype),
        final12ptCandidate,
        analysis,
      )
    : null
  const best12ptStructure = analysis?.autoSequenceSummary?.structureAwareReranking?.topCandidates[0] ?? null
  const final12ptCandidateId =
    analysis?.autoSequenceSummary?.steps.at(-1)?.bestCandidateId ??
    prototype?.generatedCandidate?.source8CandidateId ??
    null
  const notes: string[] = []
  if (!best8pt) {
    notes.push("8pt structureAwareRanking produced no candidate after hardReject filtering.")
  }
  if (!final12ptCandidate) {
    notes.push("12pt finalCandidate is missing.")
  }
  notes.push("rawProjectionRankingは投影誤差デバッグ用")
  notes.push("finalCandidateはstructureAwareRankingから選ぶべき")
  if (best8pt && final12ptCanonical) {
    if (best8pt.depthStructureDebug8pt.score.status === "rejected") {
      notes.push("Best 8pt candidate is rejected by 8pt depth structure debug.")
    }
    if (
      final12ptCanonical.averageAbsDelta >
      best8pt.canonicalComparison.averageAbsDelta + 0.02
    ) {
      notes.push("12pt finalCandidate is farther from canonicalZ than the best 8pt brute force candidate.")
    }
  }

  return {
    best8ptBruteforce: {
      candidateId: best8pt?.candidateId ?? null,
      averageProjectionError: best8pt?.averageProjectionError ?? null,
      canonicalAverageAbsDelta: best8pt?.canonicalComparison.averageAbsDelta ?? null,
      depthRelationStatus: best8pt?.depthStructureDebug8pt.score.status ?? null,
    },
    final12ptSequence: {
      candidateId: final12ptCandidateId,
      averageProjectionError:
        prototype?.projectionEvaluation?.averageProjectionError ??
        primaryRun?.averageProjectionError ??
        null,
      canonicalAverageAbsDelta: final12ptCanonical?.averageAbsDelta ?? null,
      depthRelationStatus: prototype?.depthRelationDebug
        ? getSemanticPointSetComparisonDepthRelationStatus(prototype.depthRelationDebug)
        : primaryRun?.depthRelationStatus ?? null,
    },
    best8ptRawProjection: buildComparisonEntryFrom8ptCandidate(best8ptRaw),
    best8ptStructureAware: buildComparisonEntryFrom8ptCandidate(best8ptStructure),
    final12ptCurrent: {
      candidateId: final12ptCandidateId,
      averageProjectionError:
        prototype?.projectionEvaluation?.averageProjectionError ??
        primaryRun?.averageProjectionError ??
        null,
      canonicalAverageAbsDelta: final12ptCanonical?.averageAbsDelta ?? null,
      canonicalCorrelation: calculateCanonicalCorrelation(final12ptCanonical),
      depthRelationStatus: prototype?.depthRelationDebug
        ? getSemanticPointSetComparisonDepthRelationStatus(prototype.depthRelationDebug)
        : primaryRun?.depthRelationStatus ?? null,
      structureAwareScore: final12ptBreakdown?.structureAwareScore ?? null,
      rawProjectionScore:
        analysis?.autoSequenceSummary?.finalObjectiveScore ??
        primaryRun?.averageProjectionError ??
        null,
      boundHitCount: final12ptBreakdown?.boundHitPenalty.boundHitCount ?? null,
    },
    best12ptStructureAware: best12ptStructure
      ? {
          candidateId: best12ptStructure.candidateId,
          averageProjectionError: best12ptStructure.averageProjectionError,
          canonicalAverageAbsDelta:
            best12ptStructure.canonicalComparison?.averageAbsDelta ?? null,
          canonicalCorrelation:
            best12ptStructure.scoreBreakdown.canonicalStructurePenalty.canonicalCorrelation,
          depthRelationStatus: best12ptStructure.depthRelationStatus,
          structureAwareScore: best12ptStructure.structureAwareScore,
          rawProjectionScore: best12ptStructure.rawProjectionScore,
          boundHitCount: best12ptStructure.boundHitCount,
        }
      : emptyCandidateComparisonEntry(),
    notes,
  }
}

function buildCandidate12ptCanonicalFitComparison(
  analysis: AnalysisResult | undefined,
  baseline: BruteForce8ptCanonicalBaseline | undefined,
): Candidate12ptCanonicalFitComparison | undefined {
  if (!analysis?.base8Points2DSummary.points) {
    return undefined
  }
  const finalCandidate = analysis.autoSequenceSummary?.finalCandidate ?? null
  const finalCandidateId = analysis.autoSequenceSummary?.steps.at(-1)?.bestCandidateId ?? null
  const candidates = [
    finalCandidate
      ? {
          label: "12pt current finalCandidate",
          candidateId: finalCandidateId,
          candidate: cloneCandidate(finalCandidate),
        }
      : null,
    buildStructureAware12ptFitTarget(analysis),
    buildBruteforce8ptFitTarget(baseline),
  ].filter((item): item is {
    label: string
    candidateId: string | null
    candidate: FittingCandidate8
  } => Boolean(item))
  const comparisons = candidates.map((target) =>
    buildCandidate12ptCanonicalFitComparisonEntry(
      target.label,
      target.candidateId,
      target.candidate,
      analysis.base8Points2DSummary.points!,
    ),
  )
  const primary = comparisons[0]
  if (!primary) {
    return undefined
  }
  return {
    enabled: true,
    targetCandidateId: primary.targetCandidateId,
    pointSetId: primary.pointSetId,
    canonicalPointSetId: primary.canonicalPointSetId,
    coordinateConvention: primary.coordinateConvention,
    points: primary.points,
    zOnlyFit: primary.zOnlyFit,
    xyzUniformFit: primary.xyzUniformFit,
    xyzNonUniformFit: primary.xyzNonUniformFit,
    interpretation: primary.interpretation,
    comparisons,
  }
}

function buildStructureAware12ptFitTarget(
  analysis: AnalysisResult,
): { label: string; candidateId: string | null; candidate: FittingCandidate8 } | null {
  const candidate = analysis.autoSequenceSummary?.structureAwareReranking?.topCandidates[0] ?? null
  return candidate
    ? {
        label: "12pt structureAware wouldSelectCandidate",
        candidateId: candidate.candidateId,
        candidate: cloneCandidate(candidate.candidate),
      }
    : null
}

function buildBruteforce8ptFitTarget(
  baseline: BruteForce8ptCanonicalBaseline | undefined,
): { label: string; candidateId: string | null; candidate: FittingCandidate8 } | null {
  const candidate = baseline?.structureAwareRanking.topCandidates[0] ?? null
  return candidate
    ? {
        label: "8pt bruteforce structureAware best",
        candidateId: candidate.candidateId,
        candidate: {
          pivotZ: baseline.settings.fixedPivotZ,
          rotationCenter: baseline.settings.fixedRotationCenter,
          zByPointId: completeSemanticZ(candidate.zByPointId),
        },
      }
    : null
}

function buildCandidate12ptCanonicalFitComparisonEntry(
  label: string,
  targetCandidateId: string | null,
  candidate: FittingCandidate8,
  candidateXy: SemanticPointSet2D,
): Candidate12ptCanonicalFitComparisonEntry {
  const points = buildCandidate12ptCanonicalFitPoints(candidate, candidateXy)
  const zOnlyFit = buildCandidate12ptZOnlyFit(points)
  const xyzUniformFit = buildCandidate12ptXyzUniformFit(points)
  const xyzNonUniformFit = buildCandidate12ptXyzNonUniformFit(points)
  const interpretation = buildCandidate12ptCanonicalFitInterpretation(
    zOnlyFit,
    xyzUniformFit,
    xyzNonUniformFit,
    candidate,
  )
  return {
    label,
    targetCandidateId,
    pointSetId: "12pt_rotation_center",
    canonicalPointSetId: "12pt_canonical_compatible",
    candidateXySource: "analysis.base8Points2DSummary.points",
    coordinateConvention: {
      z: "smaller = front / 手前",
    },
    points,
    zOnlyFit,
    xyzUniformFit,
    xyzNonUniformFit,
    interpretation,
  }
}

function buildCandidate12ptCanonicalFitPoints(
  candidate: FittingCandidate8,
  candidateXy: SemanticPointSet2D,
): Candidate12ptCanonicalFitPoint[] {
  const canonicalByIndex = buildCanonical12ptPointByIndex()
  return ROTATION_CENTER_12_SEMANTIC_POINT_NAMES.flatMap((pointId) => {
    const landmarkIndex = CANONICAL_COMPATIBLE_12PT[pointId].filter(
      (index) => index < CANONICAL_COMPARISON_LANDMARK_COUNT,
    )
    const canonicalPoints = landmarkIndex
      .map((index) => canonicalByIndex.get(index))
      .filter((point): point is Point3 => Boolean(point))
    const candidatePoint = candidateXy[pointId]
    const candidateZ = candidate.zByPointId[pointId]
    if (
      canonicalPoints.length === 0 ||
      !candidatePoint ||
      typeof candidateZ !== "number" ||
      !Number.isFinite(candidateZ)
    ) {
      return []
    }
    return [
      {
        pointId,
        landmarkIndex,
        canonical: roundPoint3D({
          x: average(canonicalPoints.map((point) => point.x)) ?? 0,
          y: average(canonicalPoints.map((point) => point.y)) ?? 0,
          z: average(canonicalPoints.map((point) => point.z)) ?? 0,
        }),
        candidate: roundPoint3D({
          x: candidatePoint.x,
          y: candidatePoint.y,
          z: candidateZ,
        }),
      },
    ]
  })
}

function buildCanonical12ptPointByIndex(): Map<number, Point3> {
  const canonicalDepthByIndex = buildCanonicalDepthByIndex("raw")
  return new Map(
    parseCanonicalFaceModelVertices().flatMap((vertex, index) => {
      const depth = canonicalDepthByIndex.get(index)
      if (!depth || index >= CANONICAL_COMPARISON_LANDMARK_COUNT) {
        return []
      }
      return [[index, { x: vertex.x, y: vertex.y, z: depth.z }]]
    }),
  )
}

function parseCanonicalFaceModelVertices(): Point3[] {
  return canonicalFaceModelObj
    .split(/\r?\n/)
    .flatMap((line) => {
      if (!line.startsWith("v ")) {
        return []
      }
      const [, x, y, z] = line.trim().split(/\s+/)
      return [
        {
          x: Number(x),
          y: Number(y),
          z: Number(z),
        },
      ]
    })
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z))
}

function buildCandidate12ptZOnlyFit(
  points: Candidate12ptCanonicalFitPoint[],
): Candidate12ptZOnlyFit {
  if (points.length < 2) {
    return { status: "skipped", reason: "not enough comparable points" }
  }
  const fit = fitLinearScaleOffset(
    points.map((point) => point.canonical.z),
    points.map((point) => point.candidate.z),
  )
  const errors = points.map((point) => fit.scale * point.canonical.z + fit.offset - point.candidate.z)
  return {
    status: "ok",
    scaleZ: round(fit.scale),
    offsetZ: round(fit.offset),
    averageAbsZError: round(average(errors.map((error) => Math.abs(error))) ?? 0),
    maxAbsZError: round(max(errors.map((error) => Math.abs(error))) ?? 0),
    canonicalCorrelationZ: calculatePointCorrelation(
      points.map((point) => point.canonical.z),
      points.map((point) => point.candidate.z),
    ),
    scaleSign: getScaleSign(fit.scale),
  }
}

function buildCandidate12ptXyzUniformFit(
  points: Candidate12ptCanonicalFitPoint[],
): Candidate12ptXyzUniformFit {
  if (points.length < 2) {
    return { status: "skipped", reason: "not enough comparable points" }
  }
  const fit = fitUniformScaleOffset3D(points)
  const fitted = points.map((point) => ({
    x: fit.scale * point.canonical.x + fit.offset.x,
    y: fit.scale * point.canonical.y + fit.offset.y,
    z: fit.scale * point.canonical.z + fit.offset.z,
  }))
  const errors3D = fitted.map((point, index) => distance3D(point, points[index].candidate))
  const zErrors = fitted.map((point, index) => point.z - points[index].candidate.z)
  return {
    status: "ok",
    scale: round(fit.scale),
    offset: roundPoint3D(fit.offset),
    average3DError: round(average(errors3D) ?? 0),
    averageAbsZErrorAfterFit: round(average(zErrors.map((error) => Math.abs(error))) ?? 0),
    maxAbsZErrorAfterFit: round(max(zErrors.map((error) => Math.abs(error))) ?? 0),
    canonicalCorrelationZAfterFit: calculatePointCorrelation(
      fitted.map((point) => point.z),
      points.map((point) => point.candidate.z),
    ),
    scaleSign: getScaleSign(fit.scale),
  }
}

function buildCandidate12ptXyzNonUniformFit(
  points: Candidate12ptCanonicalFitPoint[],
): Candidate12ptXyzNonUniformFit {
  if (points.length < 2) {
    return { status: "skipped", reason: "not enough comparable points" }
  }
  const fit = {
    x: fitLinearScaleOffset(
      points.map((point) => point.canonical.x),
      points.map((point) => point.candidate.x),
    ),
    y: fitLinearScaleOffset(
      points.map((point) => point.canonical.y),
      points.map((point) => point.candidate.y),
    ),
    z: fitLinearScaleOffset(
      points.map((point) => point.canonical.z),
      points.map((point) => point.candidate.z),
    ),
  }
  const fitted = points.map((point) => ({
    x: fit.x.scale * point.canonical.x + fit.x.offset,
    y: fit.y.scale * point.canonical.y + fit.y.offset,
    z: fit.z.scale * point.canonical.z + fit.z.offset,
  }))
  const errors3D = fitted.map((point, index) => distance3D(point, points[index].candidate))
  const zErrors = fitted.map((point, index) => point.z - points[index].candidate.z)
  return {
    status: "ok",
    scale: roundPoint3D({ x: fit.x.scale, y: fit.y.scale, z: fit.z.scale }),
    offset: roundPoint3D({ x: fit.x.offset, y: fit.y.offset, z: fit.z.offset }),
    average3DError: round(average(errors3D) ?? 0),
    averageAbsZErrorAfterFit: round(average(zErrors.map((error) => Math.abs(error))) ?? 0),
    maxAbsZErrorAfterFit: round(max(zErrors.map((error) => Math.abs(error))) ?? 0),
    canonicalCorrelationZAfterFit: calculatePointCorrelation(
      fitted.map((point) => point.z),
      points.map((point) => point.candidate.z),
    ),
    scaleZSign: getScaleSign(fit.z.scale),
  }
}

function buildCandidate12ptCanonicalFitInterpretation(
  zOnlyFit: Candidate12ptZOnlyFit,
  xyzUniformFit: Candidate12ptXyzUniformFit,
  xyzNonUniformFit: Candidate12ptXyzNonUniformFit,
  candidate: FittingCandidate8,
): Candidate12ptCanonicalFitComparisonEntry["interpretation"] {
  const zOnlySuggestsInversion = Boolean(
    zOnlyFit.status === "ok" &&
      ((zOnlyFit.scaleZ ?? 0) < 0 ||
        (zOnlyFit.canonicalCorrelationZ ?? 0) < 0),
  )
  const zOnlyError = zOnlyFit.averageAbsZError ?? Number.POSITIVE_INFINITY
  const xyzErrors = [
    xyzUniformFit.averageAbsZErrorAfterFit,
    xyzNonUniformFit.averageAbsZErrorAfterFit,
  ].filter((value): value is number => typeof value === "number" && Number.isFinite(value))
  const bestXyzError = min(xyzErrors) ?? Number.POSITIVE_INFINITY
  const xyzFitReducesZError = Number.isFinite(zOnlyError) && bestXyzError < zOnlyError * 0.8
  const structure = buildDepthStructureDebugForPointSet(
    candidate,
    ROTATION_CENTER_12_SEMANTIC_POINT_NAMES,
  )
  const afterFitCorrelation =
    xyzNonUniformFit.canonicalCorrelationZAfterFit ??
    xyzUniformFit.canonicalCorrelationZAfterFit ??
    null
  const candidateStructureMismatchLikely = Boolean(
    (afterFitCorrelation !== null && afterFitCorrelation < 0) ||
      structure.score.violationCount >= 2,
  )
  const notes: string[] = []
  if (zOnlySuggestsInversion) {
    notes.push("zOnlyFit shows negative scale or correlation.")
  }
  if (xyzFitReducesZError) {
    notes.push("xyz fit reduces z error compared with zOnlyFit.")
  }
  if (candidateStructureMismatchLikely) {
    notes.push("Depth pair order still looks inconsistent after xyz fit.")
  }
  return {
    zOnlySuggestsInversion,
    xyzFitReducesZError,
    coordinateSystemMismatchLikely: xyzFitReducesZError,
    candidateStructureMismatchLikely,
    notes,
  }
}

function fitLinearScaleOffset(source: number[], target: number[]): { scale: number; offset: number } {
  const sourceMean = average(source) ?? 0
  const targetMean = average(target) ?? 0
  const variance = source.reduce((total, value) => total + Math.pow(value - sourceMean, 2), 0)
  const covariance = source.reduce(
    (total, value, index) => total + (value - sourceMean) * (target[index] - targetMean),
    0,
  )
  const scale = Math.abs(variance) < EPSILON ? 1 : covariance / variance
  return {
    scale,
    offset: targetMean - sourceMean * scale,
  }
}

function fitUniformScaleOffset3D(
  points: Candidate12ptCanonicalFitPoint[],
): { scale: number; offset: Point3 } {
  const canonicalMean = averagePoint3D(points.map((point) => point.canonical))
  const candidateMean = averagePoint3D(points.map((point) => point.candidate))
  const axes: Array<keyof Point3> = ["x", "y", "z"]
  const variance = points.reduce(
    (total, point) =>
      total + axes.reduce((sum, axis) => sum + Math.pow(point.canonical[axis] - canonicalMean[axis], 2), 0),
    0,
  )
  const covariance = points.reduce(
    (total, point) =>
      total +
      axes.reduce(
        (sum, axis) =>
          sum +
          (point.canonical[axis] - canonicalMean[axis]) *
            (point.candidate[axis] - candidateMean[axis]),
        0,
      ),
    0,
  )
  const scale = Math.abs(variance) < EPSILON ? 1 : covariance / variance
  return {
    scale,
    offset: {
      x: candidateMean.x - canonicalMean.x * scale,
      y: candidateMean.y - canonicalMean.y * scale,
      z: candidateMean.z - canonicalMean.z * scale,
    },
  }
}

function calculatePointCorrelation(source: number[], target: number[]): number | null {
  if (source.length < 2 || source.length !== target.length) {
    return null
  }
  const sourceMean = average(source) ?? 0
  const targetMean = average(target) ?? 0
  const covariance = source.reduce(
    (total, value, index) => total + (value - sourceMean) * (target[index] - targetMean),
    0,
  )
  const sourceVariance = source.reduce((total, value) => total + Math.pow(value - sourceMean, 2), 0)
  const targetVariance = target.reduce((total, value) => total + Math.pow(value - targetMean, 2), 0)
  if (sourceVariance <= EPSILON || targetVariance <= EPSILON) {
    return null
  }
  return round(covariance / Math.sqrt(sourceVariance * targetVariance))
}

function getScaleSign(scale: number): "positive" | "negative" | "zero" {
  if (Math.abs(scale) <= EPSILON) {
    return "zero"
  }
  return scale > 0 ? "positive" : "negative"
}

function distance3D(a: Point3, b: Point3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}

function averagePoint3D(points: Point3[]): Point3 {
  return {
    x: average(points.map((point) => point.x)) ?? 0,
    y: average(points.map((point) => point.y)) ?? 0,
    z: average(points.map((point) => point.z)) ?? 0,
  }
}

function roundPoint3D(point: Point3): Point3 {
  return {
    x: round(point.x),
    y: round(point.y),
    z: round(point.z),
  }
}

function buildComparisonEntryFrom8ptCandidate(
  candidate: BruteForce8ptTopCandidate | null,
): CandidateComparisonEntry {
  if (!candidate) {
    return emptyCandidateComparisonEntry()
  }
  return {
    candidateId: candidate.candidateId,
    averageProjectionError: candidate.averageProjectionError,
    canonicalAverageAbsDelta: candidate.canonicalComparison.averageAbsDelta,
    canonicalCorrelation: candidate.scoreBreakdown.canonicalStructurePenalty.canonicalCorrelation,
    depthRelationStatus: candidate.depthStructureDebug8pt.score.status,
    structureAwareScore: candidate.structureAwareScore,
    rawProjectionScore: candidate.rawProjectionScore,
    boundHitCount: candidate.scoreBreakdown.boundHitPenalty.boundHitCount,
  }
}

function emptyCandidateComparisonEntry(): CandidateComparisonEntry {
  return {
    candidateId: null,
    averageProjectionError: null,
    canonicalAverageAbsDelta: null,
    canonicalCorrelation: null,
    depthRelationStatus: null,
    structureAwareScore: null,
    rawProjectionScore: null,
    boundHitCount: null,
  }
}

function final12ptCandidateIdFromAnalysis(
  analysis: AnalysisResult | undefined,
  prototype: Depth478PrototypeResult | null,
): string {
  return (
    analysis?.autoSequenceSummary?.steps.at(-1)?.bestCandidateId ??
    prototype?.generatedCandidate?.source8CandidateId ??
    "autoSequenceSummary.finalCandidate"
  )
}

function recommendSemanticPointSet(runs: SemanticPointSetComparisonRun[]): {
  semanticPointSetId: SemanticPointSetId | null
  reason: string
} {
  const successfulRuns = runs.filter(
    (run) => run.quickRunStatus === "passed" || run.quickRunStatus === "warning",
  )
  if (successfulRuns.length === 0) {
    return {
      semanticPointSetId: null,
      reason: "No semantic point set produced a selectable quick run candidate.",
    }
  }

  const passedRuns = successfulRuns.filter((run) => run.depthRelationStatus === "passed")
  const candidates = passedRuns.length > 0 ? passedRuns : successfulRuns
  const bestError = minNullable(candidates.map((run) => run.averageProjectionError))
  const bestMaxBucket = minNullable(candidates.map((run) => run.maxBucketScore))
  const errorTolerance = Math.max(0.0025, (bestError ?? 0) * 0.1)
  const maxBucketTolerance = Math.max(0.0025, (bestMaxBucket ?? 0) * 0.1)
  const stableCandidates = candidates.filter((run) => {
    const errorOk =
      bestError === null ||
      run.averageProjectionError === null ||
      run.averageProjectionError <= bestError + errorTolerance
    const bucketOk =
      bestMaxBucket === null ||
      run.maxBucketScore === null ||
      run.maxBucketScore <= bestMaxBucket + maxBucketTolerance
    return errorOk && bucketOk
  })
  const candidatePool = stableCandidates.length > 0 ? stableCandidates : candidates
  const run12 = candidatePool.find((run) => run.semanticPointSetId === "12pt_rotation_center")
  const run24 = candidatePool.find((run) => run.semanticPointSetId === "24pt_structure")
  const run8 = candidatePool.find((run) => run.semanticPointSetId === "8pt_basic")

  if (run24 && run12 && improvesProjectionError(run24, run12)) {
    return {
      semanticPointSetId: "24pt_structure",
      reason:
        "24pt_structure passed depth relation and improved projection error enough to justify the extra structure points.",
    }
  }
  if (run12) {
    return {
      semanticPointSetId: "12pt_rotation_center",
      reason:
        "12pt_rotation_center passed depth relation and stayed within projection/max-bucket tolerance; it is preferred when close to 24pt because it has fewer expression-sensitive points.",
    }
  }
  if (run24) {
    return {
      semanticPointSetId: "24pt_structure",
      reason: "24pt_structure is the best selectable run after depth relation and projection checks.",
    }
  }
  return {
    semanticPointSetId: run8?.semanticPointSetId ?? candidatePool[0]?.semanticPointSetId ?? null,
    reason: "Only 8pt_basic remained selectable under the comparison rule.",
  }
}

function improvesProjectionError(
  next: SemanticPointSetComparisonRun,
  baseline: SemanticPointSetComparisonRun,
): boolean {
  if (next.averageProjectionError === null || baseline.averageProjectionError === null) {
    return false
  }
  return next.averageProjectionError < baseline.averageProjectionError - Math.max(0.001, baseline.averageProjectionError * 0.05)
}

function diagnoseQuick478DepthDebugStatus(
  relation: Depth478RelationDebug | undefined,
): Quick478DepthDebugSummary["status"] {
  if (!relation) {
    return "error"
  }
  if (relation.isRejected) {
    return "rejected"
  }
  return relation.ruleResults.some((rule) => rule.severity === "warning") ? "warning" : "passed"
}

function getQuick478DepthDebugCurrentStepLabel(): string | undefined {
  const sequence = state.autoSequence.definition
  if (!sequence) {
    return "startAutoSequence"
  }
  const stepIndex = state.autoSequence.currentStepIndex
  const stepPresetId = sequence.steps[stepIndex]
  const step = stepPresetId ? findSearchPreset(stepPresetId) : null
  return step ? `${sequence.label} step ${stepIndex + 1}: ${step.label}` : sequence.label
}

function finishQuick478DepthDebug(payload: Quick478DepthDebugPayload): void {
  state.quick478DepthDebug = {
    status: payload.quickRun.status,
    message: formatQuick478DepthDebugMessage(payload.quickRun),
    startedAt: payload.quickRun.startedAt,
    completedAt: payload.quickRun.completedAt,
    quickRun: payload.quickRun,
  }
  downloadJson(payload, createFileName("ideal-face-fitting-depth478-hardreject-debug"))
  if (state.analysis) {
    getElement("json-preview").textContent = JSON.stringify(createSummaryAnalysis(state.analysis), null, 2)
  }
  renderQuick478DepthDebug()
  renderAnalysis()
  setButtons()
}

function buildQuick478DepthDebugPayload(
  prototype: Depth478PrototypeResult | null,
  options: {
    status: Quick478DepthDebugSummary["status"]
    reason?: string
    failedStep?: string
    stack?: string
    startedAt: string
    completedAt: string
    isRejected?: boolean
    fallbackUsed?: boolean
    analysis?: AnalysisResult
    semanticPointSetComparison?: SemanticPointSetComparisonSummary
  },
): Quick478DepthDebugPayload {
  const relation = prototype?.depthRelationDebug
  const semanticPointZSearchBoundSummary = buildSemanticPointZSearchBoundSummary(options.analysis)
  const perLandmarkZSearchSummary =
    prototype?.generatedCandidate?.perLandmarkZSearchDebug?.summary
  const bruteforce8ptCanonicalBaseline = options.analysis
    ? buildBruteforce8ptCanonicalBaseline(options.analysis)
    : undefined
  const candidateComparison8ptVs12pt = bruteforce8ptCanonicalBaseline
    ? buildCandidateComparison8ptVs12pt(
        bruteforce8ptCanonicalBaseline,
        options.analysis,
        prototype,
        options.semanticPointSetComparison?.runs.find(
          (run) => run.semanticPointSetId === "12pt_rotation_center",
        ),
      )
    : undefined
  const candidate12ptCanonicalFitComparison = buildCandidate12ptCanonicalFitComparison(
    options.analysis,
    bruteforce8ptCanonicalBaseline,
  )
  const noseRule = relation?.ruleResults.find(
    (rule) => rule.ruleId === "nose_tip_group_in_front_of_cheek_group",
  )
  const quickRun: Quick478DepthDebugSummary = {
    schemaVersion: "ideal_face_fitting_depth478_quick_debug_v1",
    status: options.status,
    reason: options.reason,
    failedStep: options.failedStep,
    stack: options.stack,
    startedAt: options.startedAt,
    completedAt: options.completedAt,
    settings: {
      ...QUICK_478_DEPTH_DEBUG_SETTINGS_SUMMARY,
      depthRelationMode: QUICK_478_DEPTH_DEBUG_SETTINGS.depthRelationFiltering.mode,
      outlierFilteringEnabled: QUICK_478_DEPTH_DEBUG_SETTINGS.outlierFiltering.enabled,
      perLandmarkZSearchEnabled: QUICK_478_DEPTH_DEBUG_SETTINGS.perLandmarkZSearch.enabled,
      interpolationMethod: QUICK_478_DEPTH_DEBUG_SETTINGS.interpolation.method,
    },
    actualExecution: buildQuick478ActualExecution(options.analysis),
    summary: {
      noseTipGroupZ: relation?.groupValues.noseTipGroup?.z ?? null,
      cheekGroupZ: relation?.groupValues.cheekGroup?.z ?? null,
      margin: noseRule?.margin ?? QUICK_DEPTH_478_NOSE_CHEEK_MARGIN,
      violationCount: relation?.violationCount ?? null,
      hardRejectViolationCount: relation?.hardRejectViolationCount ?? null,
      isRejected: relation?.isRejected ?? options.isRejected ?? null,
      smoothnessHighDeltaEdgeCount: prototype?.smoothnessDebug?.highDeltaEdgeCount ?? null,
      averageProjectionError: prototype?.projectionEvaluation?.averageProjectionError ?? null,
      semanticPointBoundHitCount: semanticPointZSearchBoundSummary?.boundHitCount ?? null,
      perLandmarkUpperBoundHitCount: perLandmarkZSearchSummary?.upperBoundHitCount ?? null,
      perLandmarkLowerBoundHitCount: perLandmarkZSearchSummary?.lowerBoundHitCount ?? null,
      jawGroupLowerBoundHitCount: getPerLandmarkGroupLowerBoundHitCount(
        perLandmarkZSearchSummary,
        "jawGroup",
      ),
      faceBoundaryGroupLowerBoundHitCount: getPerLandmarkGroupLowerBoundHitCount(
        perLandmarkZSearchSummary,
        "faceBoundaryGroup",
      ),
      faceCenterGroupZ: relation?.groupValues.faceCenterGroup?.z ?? null,
      faceBoundaryGroupZ: relation?.groupValues.faceBoundaryGroup?.z ?? null,
      bruteforce8ptCandidateCount: bruteforce8ptCanonicalBaseline?.candidateCount,
      best8ptScore: bruteforce8ptCanonicalBaseline?.summary.bestScore,
      best8ptCanonicalAverageAbsDelta:
        bruteforce8ptCanonicalBaseline?.summary.bestCanonicalAverageAbsDelta,
      best12ptScore:
        options.semanticPointSetComparison?.runs.find(
          (run) => run.semanticPointSetId === "12pt_rotation_center",
        )?.averageProjectionError ?? prototype?.projectionEvaluation?.averageProjectionError ?? null,
      best12ptCanonicalAverageAbsDelta:
        candidateComparison8ptVs12pt?.final12ptSequence?.canonicalAverageAbsDelta ?? null,
      rawBestScore:
        bruteforce8ptCanonicalBaseline?.rawProjectionRanking.topCandidates[0]?.rawProjectionScore ??
        null,
      structureAwareBestScore:
        bruteforce8ptCanonicalBaseline?.structureAwareRanking.topCandidates[0]?.structureAwareScore ??
        null,
      rawBestDepthStatus:
        bruteforce8ptCanonicalBaseline?.rawProjectionRanking.topCandidates[0]?.depthStructureDebug8pt
          .score.status ?? null,
      structureAwareBestDepthStatus:
        bruteforce8ptCanonicalBaseline?.structureAwareRanking.topCandidates[0]?.depthStructureDebug8pt
          .score.status ?? null,
      wouldChangeFinalCandidate:
        options.analysis?.autoSequenceSummary?.structureAwareReranking?.wouldChangeFinalCandidate ??
        null,
    },
  }
  if (options.isRejected !== undefined) {
    quickRun.isRejected = options.isRejected
  }
  if (options.fallbackUsed !== undefined) {
    quickRun.fallbackUsed = options.fallbackUsed
  }
  if (options.status === "noCandidate" && options.analysis) {
    const bestRejectedCandidateByScore = buildQuick478BestRejectedCandidateByScore(options.analysis)
    if (bestRejectedCandidateByScore) {
      quickRun.bestRejectedCandidateByScore = bestRejectedCandidateByScore
    }
    const nearestDepthRelationCandidate = buildQuick478RejectedCandidateDebug(
      options.analysis.depthRelationDebug?.nearestRejectedCandidate,
      "奥行き関係は惜しいがmargin未達",
    )
    if (nearestDepthRelationCandidate) {
      quickRun.nearestDepthRelationCandidate = nearestDepthRelationCandidate
      quickRun.nearestRejectedCandidate = nearestDepthRelationCandidate
    }
  }

  return {
    quickRun,
    ...(prototype ?? { settings: createQuick478DepthPrototypeSettings() }),
    rangeExpansionSummary: cloneRangeExpansionSummary(RANGE_EXPANSION_SUMMARY),
    semanticPointZSearchBoundSummary,
    perLandmarkZSearchSummary,
    semanticPointSetComparison: options.semanticPointSetComparison,
    bruteforce8ptCanonicalBaseline,
    candidateComparison8ptVs12pt,
    candidate12ptCanonicalFitComparison,
    analysisSummary: options.analysis ? createSummaryAnalysis(options.analysis) : undefined,
  }
}

function getPerLandmarkGroupLowerBoundHitCount(
  summary: PerLandmarkZSearchBoundSummary | undefined,
  groupId: string,
): number | null {
  const group = summary?.groupBoundHitSummary.find((item) => item.groupId === groupId)
  return group?.lowerBoundHitCount ?? null
}

function cloneRangeExpansionSummary(summary: RangeExpansionSummary): RangeExpansionSummary {
  return {
    semanticPointRangeOverrides: summary.semanticPointRangeOverrides.map((override) => ({
      ...override,
    })),
    perLandmarkRangeOverrides: summary.perLandmarkRangeOverrides.map((override) => ({
      ...override,
    })),
  }
}

function buildQuick478ActualExecution(analysis: AnalysisResult | undefined): Quick478ActualExecution {
  const auto = analysis?.autoSequenceSummary
  const steps = auto?.steps ?? []
  return {
    baseCandidatePresetId: auto?.baseCandidatePresetId ?? null,
    sequenceId: auto?.sequenceId ?? null,
    stepCount: steps.length,
    stepIds: steps.map((step) => step.presetId),
    parameterOrders: steps.map((step) => buildQuick478StepParameterOrder(step)),
    usedSamePathAsManualAutoSequence: true,
    steps: steps.map((step) => {
      const rejectedCandidateCount = step.depthRelationSummary?.rejectedCandidateCount ?? 0
      return {
        stepId: step.presetId,
        semanticPointSetId: step.semanticPointSetId,
        semanticPointCount: step.semanticPointCount,
        parameterOrder: buildQuick478StepParameterOrder(step),
        candidateCount: step.estimatedCandidateCount,
        rejectedCandidateCount,
        passedCandidateCount: Math.max(0, step.processedCandidateCount - rejectedCandidateCount),
        bestCandidateId: step.bestCandidateId ?? null,
        stopReason: step.bestCandidate ? null : "noCandidate",
        outlierFilteringDebug: step.outlierFilteringDebug,
      }
    }),
  }
}

function buildQuick478StepParameterOrder(step: AutoSequenceStepSummary): LocalSearchParameter[] {
  if (step.searchSettings.searchMode === "localOneDimensional" && step.searchSettings.targetParameter) {
    return [step.searchSettings.targetParameter]
  }
  return step.searchSettings.coordinateDescentParameterOrder
    ? [...step.searchSettings.coordinateDescentParameterOrder]
    : []
}

function buildQuick478BestRejectedCandidateByScore(
  analysis: AnalysisResult,
): Quick478RejectedCandidateDebug | undefined {
  const rankingCandidate = analysis.rawRanking.find(
    (candidate) => candidate.depthRelationDebug?.isRejected,
  )
  if (rankingCandidate) {
    return buildQuick478RejectedCandidateDebug(
      {
        candidateId: rankingCandidate.candidateId,
        candidate: cloneCandidate(rankingCandidate.candidate),
        objectiveMode: rankingCandidate.objectiveMode,
        objectiveScoreBeforeDepthFilter:
          rankingCandidate.objectiveScoreBeforeDepthFilter ?? rankingCandidate.objectiveScore,
        totalScore: rankingCandidate.totalScore,
        scoreDebug: rankingCandidate.scoreDebug,
        depthRelationDebug: rankingCandidate.depthRelationDebug!,
        rejectReasons: rankingCandidate.depthRelationDebug!.ruleResults
          .filter((result) => result.reject)
          .map((result) => result.explanation),
      },
      "score上は良いが奥行き関係違反",
    )
  }
  return buildQuick478RejectedCandidateDebug(
    analysis.depthRelationDebug?.rejectedCandidates[0],
    "score上は良いが奥行き関係違反",
  )
}

function buildQuick478RejectedCandidateDebug(
  rejected: RejectedCandidateSummary | undefined,
  fallbackReason: string,
): Quick478RejectedCandidateDebug | undefined {
  if (!rejected) {
    return undefined
  }
  const noseRule =
    rejected.depthRelationDebug.ruleResults.find(
      (rule) => rule.ruleId === "nose_tip_in_front_of_cheek_group",
    ) ??
    rejected.depthRelationDebug.ruleResults.find(
      (rule) => rule.ruleId === "nose_tip_in_front_of_cheeks",
    ) ??
    rejected.depthRelationDebug.ruleResults.find((rule) => rule.reject)
  const noseZ =
    rejected.depthRelationDebug.groupValues.noseTipGroup?.z ??
    rejected.depthRelationDebug.groupValues.noseTip?.z ??
    rejected.candidate.zByPointId.nose ??
    null
  const cheekZ =
    rejected.depthRelationDebug.groupValues.cheekGroup?.z ??
    rejected.depthRelationDebug.groupValues.cheeks?.z ??
    null
  return {
    candidateId: rejected.candidateId,
    noseZ,
    cheekZ,
    margin: noseRule?.margin ?? null,
    delta: noseRule?.delta ?? null,
    reason: noseRule
      ? `${fallbackReason}: ${noseRule.explanation}`
      : rejected.rejectReasons[0] ?? fallbackReason,
  }
}

function formatQuick478DepthDebugMessage(quickRun: Quick478DepthDebugSummary): string {
  if (quickRun.status === "passed") {
    return "Debug JSON をダウンロードしました。"
  }
  if (quickRun.status === "warning") {
    return "Debug JSON をダウンロードしました。478点奥行き関係は方向OKですが margin 未達です。"
  }
  if (quickRun.status === "rejected") {
    return "結果: rejected（奥行き関係 hardReject）"
  }
  if (quickRun.status === "noCandidate") {
    return "条件を満たす候補が見つかりませんでした。"
  }
  return `エラー: ${quickRun.reason ?? "quick debug failed"}`
}

function readDepth478CandidateSource(): Depth478CandidateSource {
  const value = getElement<HTMLSelectElement>("depth-478-source-select").value
  return value === "bestCandidate" ? "bestCandidate" : "autoSequenceFinalCandidate"
}

function readDepth478PrototypeSettings(): Depth478PrototypeResult["settings"] {
  return {
    interpolation: {
      enabled: true,
      method: readDepth478GenerationMethod(),
      epsilon: Math.max(
        0.000001,
        readNumber("depth-478-epsilon-input", DEFAULT_DEPTH_478_INTERPOLATION_SETTINGS.epsilon),
      ),
      power: Math.max(
        0.1,
        readNumber("depth-478-power-input", DEFAULT_DEPTH_478_INTERPOLATION_SETTINGS.power),
      ),
      clampZ: getElement<HTMLSelectElement>("depth-478-clamp-z-select").value === "true",
      zMin: readNumber("depth-478-z-min-input", DEFAULT_DEPTH_478_INTERPOLATION_SETTINGS.zMin),
      zMax: readNumber("depth-478-z-max-input", DEFAULT_DEPTH_478_INTERPOLATION_SETTINGS.zMax),
    },
    groupCorrections: cloneDepthGroupCorrections(DEFAULT_DEPTH_478_GROUP_CORRECTIONS),
    smoothnessThreshold: Math.max(
      0,
      readNumber("depth-478-smoothness-threshold-input", DEFAULT_DEPTH_478_SMOOTHNESS_THRESHOLD),
    ),
    perLandmarkZSearch: { ...DEFAULT_PER_LANDMARK_Z_SEARCH_SETTINGS },
  }
}

function readDepth478GenerationMethod(): Depth478GenerationMethod {
  const value = getElement<HTMLSelectElement>("depth-478-method-select").value
  return value === "canonicalDepthBased" ? "canonicalDepthBased" : "inverseDistanceWeighting"
}

function resolveDepth478SourceCandidate(
  analysis: AnalysisResult,
  source: Depth478CandidateSource,
): { candidate: FittingCandidate8; source8CandidateId: string | null } | null {
  if (source === "bestCandidate") {
    if (analysis.bestCandidate) {
      return {
        candidate: cloneCandidate(analysis.bestCandidate),
        source8CandidateId: analysis.bestCandidate.candidateId,
      }
    }
    if (analysis.autoSequenceSummary?.finalCandidate) {
      return {
        candidate: cloneCandidate(analysis.autoSequenceSummary.finalCandidate),
        source8CandidateId: "autoSequenceSummary.finalCandidate",
      }
    }
    return null
  }

  if (analysis.autoSequenceSummary?.finalCandidate) {
    return {
      candidate: cloneCandidate(analysis.autoSequenceSummary.finalCandidate),
      source8CandidateId: "autoSequenceSummary.finalCandidate",
    }
  }
  if (analysis.bestCandidate) {
    return {
      candidate: cloneCandidate(analysis.bestCandidate),
      source8CandidateId: analysis.bestCandidate.candidateId,
    }
  }
  return null
}

function buildBase478Landmarks2D(frames: NormalizedFrame[]): LandmarkPoint[] | null {
  const frontFrames = frames.filter(
    (frame) => frame.bucket === "front" && frame.bounds && frame.landmarks.length === 478,
  )
  const sourceFrames =
    frontFrames.length > 0
      ? frontFrames
      : frames.filter((frame) => frame.bounds && frame.landmarks.length === 478)
  if (sourceFrames.length === 0) {
    return null
  }

  const boundsCenter = averagePoint2D(
    sourceFrames.map((frame) => ({
      x: frame.bounds!.centerX,
      y: frame.bounds!.centerY,
    })),
  )
  const landmarks: LandmarkPoint[] = []
  for (let index = 0; index < 478; index += 1) {
    const samples = sourceFrames
      .map((frame) => frame.landmarks.find((landmark) => landmark.index === index))
      .filter((landmark): landmark is LandmarkPoint => Boolean(landmark))
    if (samples.length !== sourceFrames.length) {
      return null
    }
    const normalizedSamples = sourceFrames.map((frame) => {
      const landmark = frame.landmarks.find((point) => point.index === index)!
      return {
        x: toSameUnitX(landmark.x, frame.aspectRatio) - boundsCenter.x,
        y: landmark.y - 0.5 - boundsCenter.y,
      }
    })
    landmarks.push({
      index,
      x: round(average(normalizedSamples.map((point) => point.x)) ?? 0),
      y: round(average(normalizedSamples.map((point) => point.y)) ?? 0),
      z: 0,
    })
  }
  return landmarks
}

function buildDepthAnchors8(
  basePoints: SemanticPointSet2D,
  candidate: FittingCandidate8,
  semanticPointSetId: SemanticPointSetId,
): DepthAnchor8[] {
  const activePointIds = new Set(getSemanticPointSet(semanticPointSetId).pointIds)
  return SEMANTIC_DEFINITIONS.filter((definition) => activePointIds.has(definition.name)).map((definition) => ({
    id: definition.name,
    label: definition.label,
    x: basePoints[definition.name].x,
    y: basePoints[definition.name].y,
    z: candidate.zByPointId[definition.name],
  }))
}

function buildGenerated478DepthCandidate(
  base478: LandmarkPoint[],
  base8Points: SemanticPointSet2D,
  sourceCandidate: FittingCandidate8,
  source8CandidateId: string | null,
  semanticPointSetId: SemanticPointSetId,
  interpolation: DepthInterpolationSettings,
  groupCorrections: DepthGroupCorrection[],
): Generated478DepthCandidate {
  const anchors = buildDepthAnchors8(base8Points, sourceCandidate, semanticPointSetId)
  const generated =
    interpolation.method === "canonicalDepthBased"
      ? buildCanonicalDepthBased478Landmarks(base478, sourceCandidate, semanticPointSetId, interpolation)
      : {
          landmarks: base478.map((landmark) =>
            interpolateDepth478Landmark(landmark, anchors, interpolation),
          ),
          canonicalDepthBasedDebug: undefined,
        }
  const interpolated = generated.landmarks
  const corrected = applyDepthGroupCorrections(interpolated, groupCorrections)
  const canonicalDepthBasedDebug = generated.canonicalDepthBasedDebug
    ? {
        ...generated.canonicalDepthBasedDebug,
        canonicalDeviation: buildCanonicalDeviationDebug(corrected, generated.landmarks),
      }
    : undefined
  return {
    id: `depth478-${Date.now()}`,
    source8CandidateId,
    sourceSemanticPointSetId: semanticPointSetId,
    generationSettings: {
      interpolation: { ...interpolation },
      groupCorrections: cloneDepthGroupCorrections(groupCorrections),
    },
    rotationCenter: getCandidateRotationCenter(sourceCandidate),
    landmarks: corrected,
    summary: summarizeGenerated478DepthCandidate(corrected),
    canonicalDepthBasedDebug,
  }
}

function buildCanonicalDepthBased478Landmarks(
  base478: LandmarkPoint[],
  sourceCandidate: FittingCandidate8,
  semanticPointSetId: SemanticPointSetId,
  settings: DepthInterpolationSettings,
  options: {
    zSign?: CanonicalDepthZSign
    fitReferencePointSet?: CanonicalDepthFitReferencePointSetId
  } = {},
): {
  landmarks: Generated478DepthCandidate["landmarks"]
  canonicalDepthBasedDebug: CanonicalDepthBasedDebug
} {
  validateCanonicalDepthTemplate(CANONICAL_FACE_DEPTH_TEMPLATE)
  const zSign = options.zSign ?? "raw"
  const canonicalByIndex = buildCanonicalDepthByIndex(zSign)
  const fitReferencePointSet =
    options.fitReferencePointSet ?? resolveCanonicalDepthFitReferencePointSet(semanticPointSetId)
  const fit = buildCanonicalDepthFit(sourceCandidate, canonicalByIndex, fitReferencePointSet)
  const landmarks = base478.map((landmark) => {
    const canonical = canonicalByIndex.get(landmark.index)
    if (canonical) {
      const fittedZ = canonical.z * fit.scale + fit.offset
      const z = settings.clampZ
        ? clamp(fittedZ, Math.min(settings.zMin, settings.zMax), Math.max(settings.zMin, settings.zMax))
        : fittedZ
      return {
        index: landmark.index,
        x: round(landmark.x),
        y: round(landmark.y),
        z: round(z),
        sourceDebug: {
          canonicalZ: round(canonical.z),
          fittedCanonicalZ: round(z),
          groupCorrectionOffset: 0,
        },
      }
    }

    const fallbackFrom = landmark.index <= 472 ? "rightEye" : "leftEye"
    const fallbackZ = sourceCandidate.zByPointId[fallbackFrom]
    const z = settings.clampZ
      ? clamp(fallbackZ, Math.min(settings.zMin, settings.zMax), Math.max(settings.zMin, settings.zMax))
      : fallbackZ
    return {
      index: landmark.index,
      x: round(landmark.x),
      y: round(landmark.y),
      z: round(z),
      sourceDebug: {
        irisDepthFallbackFrom: fallbackFrom,
        groupCorrectionOffset: 0,
      },
    }
  })

  return {
    landmarks,
    canonicalDepthBasedDebug: {
      templateFile: CANONICAL_FACE_DEPTH_TEMPLATE_FILE,
      templateSchemaVersion: CANONICAL_FACE_DEPTH_TEMPLATE.schemaVersion,
      fitReferencePointSet,
      comparisonLandmarkCount: CANONICAL_FACE_DEPTH_TEMPLATE.comparisonLandmarkIndices.length,
      excludedLandmarkIndices: [...CANONICAL_FACE_DEPTH_TEMPLATE.excludedLandmarkIndices],
      fit: {
        method: "leastSquares",
        scale: round(fit.scale),
        offset: round(fit.offset),
        referencePoints: fit.referencePoints,
      },
      irisDepthFallback: {
        enabled: true,
        excludedFromCanonicalComparison: true,
        indices: [...IRIS_DEPTH_FALLBACK_INDICES],
      },
      canonicalDeviation: buildCanonicalDeviationDebug(landmarks, landmarks),
    },
  }
}

function buildCanonicalDepthByIndex(
  zSign: CanonicalDepthZSign,
): Map<number, CanonicalDepthTemplatePoint> {
  return new Map(
    CANONICAL_FACE_DEPTH_TEMPLATE.canonicalDepth.map((point) => [
      point.index,
      {
        ...point,
        z: zSign === "inverted" ? -point.z : point.z,
      },
    ]),
  )
}

function buildCanonicalDepthFitComparisonDebug(
  base478: LandmarkPoint[],
  sourceCandidate: FittingCandidate8,
  source8CandidateId: string | null,
  selectedFrames: NormalizedFrame[],
  searchSettings: SearchSettings,
  prototypeSettings: Depth478PrototypeResult["settings"],
  usedOutlierFilteredFrames: boolean,
): CanonicalDepthFitComparisonDebug {
  validateCanonicalDepthTemplate(CANONICAL_FACE_DEPTH_TEMPLATE)
  const variants: Array<{
    id: CanonicalDepthFitComparisonVariant["id"]
    zSign: CanonicalDepthZSign
    fitReferencePointSet: CanonicalDepthFitReferencePointSetId
  }> = [
    { id: "canonicalZ_raw", zSign: "raw", fitReferencePointSet: "8pt_compatible" },
    { id: "canonicalZ_inverted", zSign: "inverted", fitReferencePointSet: "8pt_compatible" },
    { id: "canonicalZ_raw_12pt", zSign: "raw", fitReferencePointSet: "12pt_rotation_center" },
    {
      id: "canonicalZ_inverted_12pt",
      zSign: "inverted",
      fitReferencePointSet: "12pt_rotation_center",
    },
  ]

  return {
    description:
      "canonicalZ の符号と fitReferencePointSet を変え、同じ source candidate / projection / depthRelation / perLandmarkZSearch 条件で比較します。",
    depthConvention: DEPTH_CONVENTION,
    variants: variants.map((variant) =>
      buildCanonicalDepthFitComparisonVariant(
        variant,
        base478,
        sourceCandidate,
        source8CandidateId,
        selectedFrames,
        searchSettings,
        prototypeSettings,
        usedOutlierFilteredFrames,
      ),
    ),
  }
}

function buildCanonicalDepthFitComparisonVariant(
  variant: {
    id: CanonicalDepthFitComparisonVariant["id"]
    zSign: CanonicalDepthZSign
    fitReferencePointSet: CanonicalDepthFitReferencePointSetId
  },
  base478: LandmarkPoint[],
  sourceCandidate: FittingCandidate8,
  source8CandidateId: string | null,
  selectedFrames: NormalizedFrame[],
  searchSettings: SearchSettings,
  prototypeSettings: Depth478PrototypeResult["settings"],
  usedOutlierFilteredFrames: boolean,
): CanonicalDepthFitComparisonVariant {
  const generated = buildCanonicalDepthBased478Landmarks(
    base478,
    sourceCandidate,
    searchSettings.semanticPointSetId,
    prototypeSettings.interpolation,
    {
      zSign: variant.zSign,
      fitReferencePointSet: variant.fitReferencePointSet,
    },
  )
  const corrected = applyDepthGroupCorrections(generated.landmarks, prototypeSettings.groupCorrections)
  const candidateBase: Generated478DepthCandidate = {
    id: variant.id,
    source8CandidateId,
    sourceSemanticPointSetId: searchSettings.semanticPointSetId,
    generationSettings: {
      interpolation: { ...prototypeSettings.interpolation },
      groupCorrections: cloneDepthGroupCorrections(prototypeSettings.groupCorrections),
    },
    rotationCenter: getCandidateRotationCenter(sourceCandidate),
    landmarks: corrected,
    summary: summarizeGenerated478DepthCandidate(corrected),
    canonicalDepthBasedDebug: {
      ...generated.canonicalDepthBasedDebug,
      canonicalDeviation: buildCanonicalDeviationDebug(corrected, generated.landmarks),
    },
  }
  const candidate =
    prototypeSettings.perLandmarkZSearch.enabled
      ? applyPerLandmarkZSearch(
          candidateBase,
          selectedFrames,
          searchSettings,
          prototypeSettings.perLandmarkZSearch,
          usedOutlierFilteredFrames,
        )
      : candidateBase
  const projectionEvaluation = evaluateProjection478(candidate, selectedFrames, searchSettings)
  const depthRelationDebug = buildDepth478RelationDebug(
    candidate,
    searchSettings.depthRelationFiltering,
  )
  const perLandmarkSummary = candidate.perLandmarkZSearchDebug?.summary
  const referenceAbsErrors = generated.canonicalDepthBasedDebug.fit.referencePoints.map((point) =>
    Math.abs(point.error),
  )
  const groupFit = buildCanonicalDepthFitComparisonGroups(
    sourceCandidate,
    buildCanonicalDepthByIndex(variant.zSign),
    generated.canonicalDepthBasedDebug.fit.scale,
    generated.canonicalDepthBasedDebug.fit.offset,
  )

  return {
    id: variant.id,
    zSign: variant.zSign,
    fitReferencePointSet: variant.fitReferencePointSet,
    fit: generated.canonicalDepthBasedDebug.fit,
    averageReferenceAbsError: round(average(referenceAbsErrors) ?? 0),
    maxReferenceAbsError: round(max(referenceAbsErrors) ?? 0),
    groupFit,
    noseError: groupFit.nose.error,
    cheekError: groupFit.cheek.error,
    chinError: groupFit.chin.error,
    mouthError: groupFit.mouth.error,
    jawError: groupFit.jaw.error,
    faceBoundaryError: groupFit.faceBoundary.error,
    averageProjectionError: projectionEvaluation.averageProjectionError,
    totalProjectionError: projectionEvaluation.totalProjectionError,
    maxBucketScore: maxNullable(Object.values(projectionEvaluation.bucketScores)),
    depthRelationStatus: getSemanticPointSetComparisonDepthRelationStatus(depthRelationDebug),
    depthRelationViolationCount: depthRelationDebug.violationCount,
    depthRelationHardRejectViolationCount: depthRelationDebug.hardRejectViolationCount,
    depthRelationIsRejected: depthRelationDebug.isRejected,
    perLandmarkBoundHitCount:
      perLandmarkSummary === undefined
        ? null
        : perLandmarkSummary.upperBoundHitCount + perLandmarkSummary.lowerBoundHitCount,
    perLandmarkUpperBoundHitCount: perLandmarkSummary?.upperBoundHitCount ?? null,
    perLandmarkLowerBoundHitCount: perLandmarkSummary?.lowerBoundHitCount ?? null,
    jawGroupLowerBoundHitCount: getPerLandmarkGroupLowerBoundHitCount(
      perLandmarkSummary,
      "jawGroup",
    ),
    faceBoundaryGroupLowerBoundHitCount: getPerLandmarkGroupLowerBoundHitCount(
      perLandmarkSummary,
      "faceBoundaryGroup",
    ),
  }
}

function buildCanonicalDepthFitComparisonGroups(
  sourceCandidate: FittingCandidate8,
  canonicalByIndex: Map<number, CanonicalDepthTemplatePoint>,
  scale: number,
  offset: number,
): CanonicalDepthFitComparisonVariant["groupFit"] {
  const groupDefinitions: Array<{
    id: CanonicalDepthFitComparisonGroup["id"]
    label: string
    landmarkIndices: number[]
    targetPointIds: SemanticPointName[]
    aggregation: DepthRelationAggregation
  }> = [
    {
      id: "nose",
      label: "nose",
      landmarkIndices: [4],
      targetPointIds: ["nose"],
      aggregation: "median",
    },
    {
      id: "cheek",
      label: "cheek",
      landmarkIndices: [234, 454],
      targetPointIds: ["leftCheek", "rightCheek"],
      aggregation: "mean",
    },
    {
      id: "chin",
      label: "chin",
      landmarkIndices: [152],
      targetPointIds: ["chin"],
      aggregation: "median",
    },
    {
      id: "mouth",
      label: "mouth",
      landmarkIndices: [13, 14],
      targetPointIds: ["mouth"],
      aggregation: "median",
    },
    {
      id: "jaw",
      label: "jaw",
      landmarkIndices: getDepth478GroupDefinition("jawGroup").pointIndices,
      targetPointIds: ["chin", "leftJaw", "rightJaw", "lowerJawLeft", "lowerJawRight"],
      aggregation: "median",
    },
    {
      id: "faceBoundary",
      label: "faceBoundary",
      landmarkIndices: getDepth478GroupDefinition("faceBoundaryGroup").pointIndices,
      targetPointIds: [
        "headTop",
        "chin",
        "leftCheek",
        "rightCheek",
        "leftJaw",
        "rightJaw",
        "leftTemple",
        "rightTemple",
        "lowerJawLeft",
        "lowerJawRight",
      ],
      aggregation: "median",
    },
  ]

  return Object.fromEntries(
    groupDefinitions.map((group) => {
      const canonicalValues = group.landmarkIndices
        .map((index) => canonicalByIndex.get(index)?.z)
        .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
      const targetValues = group.targetPointIds
        .map((pointId) => sourceCandidate.zByPointId[pointId])
        .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
      const canonicalZ = aggregateDepthValues(canonicalValues, group.aggregation)
      const targetZ = aggregateDepthValues(targetValues, group.aggregation)
      const fittedZ = canonicalZ === null ? null : round(canonicalZ * scale + offset)
      const error = fittedZ === null || targetZ === null ? null : round(fittedZ - targetZ)
      return [
        group.id,
        {
          id: group.id,
          label: group.label,
          landmarkIndices: [...group.landmarkIndices],
          targetZ,
          canonicalZ,
          fittedZ,
          error,
        },
      ]
    }),
  ) as CanonicalDepthFitComparisonVariant["groupFit"]
}

function validateCanonicalDepthTemplate(template: CanonicalFaceDepthTemplateV1): void {
  if (
    template.schemaVersion !== "canonical_face_depth_template_v1" ||
    template.sourceLandmarkCount !== CANONICAL_COMPARISON_LANDMARK_COUNT ||
    template.targetLandmarkCount !== 478 ||
    template.canonicalDepth.length !== CANONICAL_COMPARISON_LANDMARK_COUNT
  ) {
    throw new Error(`${CANONICAL_FACE_DEPTH_TEMPLATE_FILE} の形式が想定と異なります。`)
  }
}

function buildCanonicalDepthFit(
  sourceCandidate: FittingCandidate8,
  canonicalByIndex: Map<number, CanonicalDepthTemplatePoint>,
  fitReferencePointSet: CanonicalDepthFitReferencePointSetId,
): {
  scale: number
  offset: number
  referencePoints: CanonicalDepthFitReferencePoint[]
} {
  const references = getCanonicalDepthFitReferencePointIds(fitReferencePointSet).flatMap((pointId) => {
    const definition = SEMANTIC_DEFINITIONS.find((item) => item.name === pointId)
    if (!definition) {
      throw new Error(`semantic point definition not found: ${pointId}`)
    }
    const landmarkIndices = getCanonicalFitReferenceIndices(definition)
    return landmarkIndices.length === 0
      ? []
      : [
          buildCanonicalFitReference(
            pointId,
            landmarkIndices,
            sourceCandidate.zByPointId[pointId],
            canonicalByIndex,
          ),
        ]
  })
  const canonicalMean = average(references.map((point) => point.canonicalZ)) ?? 0
  const targetMean = average(references.map((point) => point.targetZ)) ?? 0
  const variance = references.reduce(
    (total, point) => total + Math.pow(point.canonicalZ - canonicalMean, 2),
    0,
  )
  const covariance = references.reduce(
    (total, point) => total + (point.canonicalZ - canonicalMean) * (point.targetZ - targetMean),
    0,
  )
  const scale = Math.abs(variance) < EPSILON ? 1 : covariance / variance
  const offset = targetMean - canonicalMean * scale

  return {
    scale,
    offset,
    referencePoints: references.map((point) => {
      const fittedZ = point.canonicalZ * scale + offset
      return {
        ...point,
        canonicalZ: round(point.canonicalZ),
        targetZ: round(point.targetZ),
        fittedZ: round(fittedZ),
        error: round(fittedZ - point.targetZ),
      }
    }),
  }
}

function buildCanonicalFitReference(
  pointId: CanonicalDepthFitReferencePoint["pointId"],
  landmarkIndex: number | number[],
  targetZ: number,
  canonicalByIndex: Map<number, CanonicalDepthTemplatePoint>,
): Omit<CanonicalDepthFitReferencePoint, "fittedZ" | "error"> {
  const indices = Array.isArray(landmarkIndex) ? landmarkIndex : [landmarkIndex]
  const canonicalValues = indices.map((index) => {
    const point = canonicalByIndex.get(index)
    if (!point) {
      throw new Error(`${CANONICAL_FACE_DEPTH_TEMPLATE_FILE} に landmark ${index} がありません。`)
    }
    return point.z
  })
  return {
    pointId,
    landmarkIndex,
    canonicalZ: average(canonicalValues) ?? 0,
    targetZ,
  }
}

function resolveCanonicalDepthFitReferencePointSet(
  semanticPointSetId: SemanticPointSetId,
): CanonicalDepthFitReferencePointSetId {
  return semanticPointSetId === "24pt_structure" ? "24pt_structure" : "8pt_compatible"
}

function getCanonicalDepthFitReferencePointIds(
  fitReferencePointSet: CanonicalDepthFitReferencePointSetId,
): SemanticPointName[] {
  if (fitReferencePointSet === "24pt_structure") {
    return STRUCTURE_24_SEMANTIC_POINT_NAMES
  }
  if (fitReferencePointSet === "12pt_rotation_center") {
    return ROTATION_CENTER_12_SEMANTIC_POINT_NAMES
  }
  return BASIC_8_SEMANTIC_POINT_NAMES
}

function getCanonicalFitReferenceIndices(definition: SemanticDefinition): number[] {
  const primary = definition.primaryIndices.filter(
    (index) => index < CANONICAL_COMPARISON_LANDMARK_COUNT,
  )
  if (primary.length > 0) {
    return primary
  }
  return (definition.fallbackIndices ?? []).filter(
    (index) => index < CANONICAL_COMPARISON_LANDMARK_COUNT,
  )
}

function buildCanonicalDeviationDebug(
  generated: Generated478DepthCandidate["landmarks"],
  fittedCanonical: Generated478DepthCandidate["landmarks"],
): CanonicalDepthBasedDebug["canonicalDeviation"] {
  const fittedByIndex = new Map(fittedCanonical.map((landmark) => [landmark.index, landmark.z]))
  const errors = generated
    .filter((landmark) => landmark.index < CANONICAL_COMPARISON_LANDMARK_COUNT)
    .map((landmark) => Math.abs(landmark.z - (fittedByIndex.get(landmark.index) ?? landmark.z)))
  return {
    averageAbsError: round(average(errors) ?? 0),
    maxAbsError: round(max(errors) ?? 0),
  }
}

function interpolateDepth478Landmark(
  landmark: LandmarkPoint,
  anchors: DepthAnchor8[],
  settings: DepthInterpolationSettings,
): Generated478DepthCandidate["landmarks"][number] {
  const weights = anchors.map((anchor) => {
    const distance = distance2D(landmark, anchor)
    return {
      anchor,
      rawWeight: 1 / Math.pow(distance + settings.epsilon, settings.power),
      distance,
    }
  })
  const weightTotal = weights.reduce((total, item) => total + item.rawWeight, 0)
  const anchorWeights = Object.fromEntries(
    weights.map((item) => [item.anchor.id, round(item.rawWeight / weightTotal)]),
  )
  const nearest = weights.reduce((best, item) => (item.distance < best.distance ? item : best))
  const rawZ = weights.reduce(
    (total, item) => total + item.anchor.z * (item.rawWeight / weightTotal),
    0,
  )
  const z = settings.clampZ
    ? clamp(rawZ, Math.min(settings.zMin, settings.zMax), Math.max(settings.zMin, settings.zMax))
    : rawZ

  return {
    index: landmark.index,
    x: round(landmark.x),
    y: round(landmark.y),
    z: round(z),
    sourceDebug: {
      nearestAnchorId: nearest.anchor.id,
      anchorWeights,
      groupCorrectionOffset: 0,
    },
  }
}

function applyDepthGroupCorrections(
  landmarks: Generated478DepthCandidate["landmarks"],
  corrections: DepthGroupCorrection[],
): Generated478DepthCandidate["landmarks"] {
  return landmarks.map((landmark) => {
    const correctionOffset = corrections.reduce((total, correction) => {
      const directHit = correction.pointIndices.includes(landmark.index)
      if (!directHit && (!correction.falloff || correction.falloff <= 0)) {
        return total
      }
      const directWeight = directHit ? 1 : calculateDepthGroupFalloffWeight(landmark, landmarks, correction)
      return total + correction.offset * correction.strength * directWeight
    }, 0)
    return {
      ...landmark,
      z: round(landmark.z + correctionOffset),
      sourceDebug: {
        ...landmark.sourceDebug,
        groupCorrectionOffset: round(correctionOffset),
      },
    }
  })
}

function calculateDepthGroupFalloffWeight(
  landmark: Point2,
  landmarks: Generated478DepthCandidate["landmarks"],
  correction: DepthGroupCorrection,
): number {
  if (!correction.falloff || correction.falloff <= 0) {
    return 0
  }
  const groupPoints = correction.pointIndices
    .map((index) => landmarks.find((point) => point.index === index))
    .filter((point): point is Generated478DepthCandidate["landmarks"][number] => Boolean(point))
  if (groupPoints.length === 0) {
    return 0
  }
  const minDistance = Math.min(...groupPoints.map((point) => distance2D(landmark, point)))
  return clamp(1 - minDistance / correction.falloff, 0, 1)
}

function summarizeGenerated478DepthCandidate(
  landmarks: Generated478DepthCandidate["landmarks"],
): Generated478DepthCandidate["summary"] {
  const zValues = landmarks.map((landmark) => landmark.z)
  const zMin = min(zValues) ?? 0
  const zMax = max(zValues) ?? 0
  return {
    landmarkCount: landmarks.length,
    zMin: round(zMin),
    zMax: round(zMax),
    zRange: round(zMax - zMin),
    averageZ: round(average(zValues) ?? 0),
  }
}

function evaluateProjection478(
  candidate: Generated478DepthCandidate,
  frames: NormalizedFrame[],
  settings: SearchSettings,
): ProjectionEvaluation478 {
  const frameResults = frames.flatMap((frame) => {
    const current = normalizeCurrent478LandmarksForScoring(frame)
    if (!current) {
      return []
    }
    const projected = projectGenerated478Candidate(candidate, frame.pose, settings)
    const currentByIndex = new Map(current.map((landmark) => [landmark.index, landmark]))
    const distances = projected.flatMap((point) => {
      const currentPoint = currentByIndex.get(point.index)
      return currentPoint ? [distance2D(point, currentPoint)] : []
    })
    const error = round(average(distances) ?? 0)
    return [
      {
        captureId: frame.captureId,
        bucket: frame.bucket,
        error,
        projected,
        current,
      },
    ]
  })

  const totalProjectionError = round(
    frameResults.reduce((total, result) => total + result.error, 0),
  )
  const averageProjectionError = round(average(frameResults.map((result) => result.error)) ?? 0)
  const bucketScores = Object.fromEntries(
    BUCKETS.map((bucket) => [
      bucket,
      roundNullable(
        average(frameResults.filter((result) => result.bucket === bucket).map((result) => result.error)),
      ),
    ]),
  ) as Record<PoseBucket, number | null>
  const perGroupError = buildProjection478GroupErrors(frameResults)
  const worstFrame =
    frameResults.length === 0
      ? null
      : frameResults.reduce((worst, result) => (result.error > worst.error ? result : worst))
  const worstGroup = Object.values(perGroupError)
    .filter(
      (group): group is ProjectionEvaluation478["perGroupError"][string] & { averageError: number } =>
        typeof group.averageError === "number",
    )
    .reduce<ProjectionEvaluation478["worstGroup"]>(
      (worst, group) =>
        !worst || group.averageError > worst.averageError
          ? { groupId: group.groupId, label: group.label, averageError: group.averageError }
          : worst,
      null,
    )

  return {
    totalProjectionError,
    averageProjectionError,
    bucketScores,
    perGroupError,
    worstFrame: worstFrame
      ? {
          captureId: worstFrame.captureId,
          bucket: worstFrame.bucket,
          error: worstFrame.error,
        }
      : null,
    worstGroup,
  }
}

function normalizeCurrent478LandmarksForScoring(frame: NormalizedFrame): LandmarkPoint[] | null {
  if (!frame.bounds || frame.landmarks.length !== 478) {
    return null
  }
  return frame.landmarks.map((landmark) => ({
    index: landmark.index,
    x: round(toSameUnitX(landmark.x, frame.aspectRatio) - frame.bounds!.centerX),
    y: round(landmark.y - 0.5 - frame.bounds!.centerY),
    z: round(landmark.z),
  }))
}

function projectGenerated478Candidate(
  candidate: Generated478DepthCandidate,
  pose: Pose,
  settings: SearchSettings,
): LandmarkPoint[] {
  const rotationCenter = candidate.rotationCenter
  return candidate.landmarks.map((landmark) => {
    const rotated = rotatePoint3D(
      {
        x: landmark.x - rotationCenter.x,
        y: landmark.y - rotationCenter.y,
        z: landmark.z - rotationCenter.z,
      },
      pose,
    )
    const projectedX = rotated.x + rotationCenter.x
    const projectedY = rotated.y + rotationCenter.y
    const z = rotated.z + rotationCenter.z
    const perspective = settings.focalLength / Math.max(settings.focalLength + z, 0.2)
    return {
      index: landmark.index,
      x: round(projectedX * perspective),
      y: round(projectedY * perspective),
      z: round(z),
    }
  })
}

function applyPerLandmarkZSearch(
  candidate: Generated478DepthCandidate,
  frames: NormalizedFrame[],
  searchSettings: SearchSettings,
  settings: PerLandmarkZSearchSettings,
  usedOutlierFilteredFrames: boolean,
): Generated478DepthCandidate {
  const frameLimit = settings.maxFrames ? Math.max(1, settings.maxFrames) : frames.length
  const scoringFrames = frames.slice(0, frameLimit).flatMap((frame) => {
    const current = normalizeCurrent478LandmarksForScoring(frame)
    if (!current) {
      return []
    }
    return [
      {
        pose: frame.pose,
        currentByIndex: new Map(current.map((landmark) => [landmark.index, landmark])),
      },
    ]
  })
  const targetIndices = buildPerLandmarkZSearchTargetIndices(candidate.landmarks, settings)
  const semanticAnchorLandmarkIndices = buildSemanticAnchorLandmarkIndices(
    searchSettings.semanticPointSetId,
  )
  const optimizedByIndex = new Map<number, number>()
  const rows: PerLandmarkZSearchDebugRow[] = []

  for (const index of targetIndices) {
    const landmark = candidate.landmarks.find((point) => point.index === index)
    if (!landmark) {
      continue
    }
    const isAnchor = semanticAnchorLandmarkIndices.has(index)
    const range = resolvePerLandmarkZSearchRange(index, isAnchor, settings)
    const step = isAnchor ? settings.anchorZStep : settings.zStep
    const baseZ = landmark.z
    const rawCandidates = createNumericCandidates(baseZ - range.lower, baseZ + range.upper, step)
    const zCandidates = candidate.generationSettings.interpolation.clampZ
      ? rawCandidates.map((z) =>
          round(
            clamp(
              z,
              Math.min(
                candidate.generationSettings.interpolation.zMin,
                candidate.generationSettings.interpolation.zMax,
              ),
              Math.max(
                candidate.generationSettings.interpolation.zMin,
                candidate.generationSettings.interpolation.zMax,
              ),
            ),
          ),
        )
      : rawCandidates
    const uniqueCandidates = Array.from(new Set(zCandidates)).sort((a, b) => a - b)
    const minZ = min(uniqueCandidates) ?? baseZ
    const maxZ = max(uniqueCandidates) ?? baseZ
    const errorBefore = evaluateProjectionErrorForSingleLandmarkZ(
      landmark,
      baseZ,
      candidate.rotationCenter,
      scoringFrames,
      searchSettings,
    )
    let bestZ = baseZ
    let bestError = errorBefore
    let bestScore = Number.POSITIVE_INFINITY
    let bestProjectionError = errorBefore
    let bestCanonicalDeviationPenalty = 0

    for (const candidateZ of uniqueCandidates) {
      const projectionError = evaluateProjectionErrorForSingleLandmarkZ(
        landmark,
        candidateZ,
        candidate.rotationCenter,
        scoringFrames,
        searchSettings,
      )
      const canonicalDeviationPenalty =
        Math.abs(candidateZ - baseZ) * settings.canonicalDeviationPenaltyWeight
      const score = projectionError + canonicalDeviationPenalty
      if (
        score < bestScore ||
        (Math.abs(score - bestScore) <= EPSILON && Math.abs(candidateZ - baseZ) < Math.abs(bestZ - baseZ))
      ) {
        bestZ = candidateZ
        bestError = projectionError
        bestScore = score
        bestProjectionError = projectionError
        bestCanonicalDeviationPenalty = canonicalDeviationPenalty
      }
    }

    optimizedByIndex.set(index, round(bestZ))
    rows.push({
      index,
      baseZ: round(baseZ),
      bestZ: round(bestZ),
      minZ: round(minZ),
      maxZ: round(maxZ),
      deltaFromBaseZ: round(bestZ - baseZ),
      deltaZ: round(bestZ - baseZ),
      hit: getZSearchBoundHit(bestZ, minZ, maxZ),
      score: round(bestScore),
      projectionError: round(bestProjectionError),
      canonicalDeviationPenalty: round(bestCanonicalDeviationPenalty),
      errorBefore: round(errorBefore),
      errorAfter: round(bestError),
      bestScore: round(bestScore),
      candidateCount: uniqueCandidates.length,
    })
  }

  const optimizedLandmarks = candidate.landmarks.map((landmark) =>
    optimizedByIndex.has(landmark.index)
      ? {
          ...landmark,
          z: optimizedByIndex.get(landmark.index)!,
        }
      : landmark,
  )

  return {
    ...candidate,
    landmarks: optimizedLandmarks,
    summary: summarizeGenerated478DepthCandidate(optimizedLandmarks),
    perLandmarkZSearchDebug: buildPerLandmarkZSearchDebug(
      settings,
      rows,
      usedOutlierFilteredFrames,
      candidate.landmarks.length,
    ),
  }
}

function buildPerLandmarkZSearchTargetIndices(
  landmarks: Generated478DepthCandidate["landmarks"],
  settings: PerLandmarkZSearchSettings,
): number[] {
  return landmarks
    .map((landmark) => landmark.index)
    .filter((index) => settings.targetIndices === "all478" || index < CANONICAL_COMPARISON_LANDMARK_COUNT)
    .sort((a, b) => a - b)
}

function resolvePerLandmarkZSearchRange(
  index: number,
  isAnchor: boolean,
  settings: PerLandmarkZSearchSettings,
): { lower: number; upper: number } {
  const defaultRange = isAnchor
    ? { lower: settings.anchorZRange, upper: settings.anchorZRange }
    : { lower: settings.zRange, upper: settings.zRange }
  const overrides = findPerLandmarkZSearchRangeOverrides(index, settings)
  if (overrides.length === 0) {
    return defaultRange
  }
  return overrides.reduce(
    (range, override) => ({
      lower: Math.max(range.lower, override.lowerZRange),
      upper: Math.max(range.upper, override.upperZRange),
    }),
    defaultRange,
  )
}

function findPerLandmarkZSearchRangeOverrides(
  index: number,
  settings: PerLandmarkZSearchSettings,
): PerLandmarkZSearchGroupRangeOverride[] {
  const overrides = settings.groupRangeOverrides ?? []
  if (overrides.length === 0) {
    return []
  }
  return overrides.filter((override) =>
    getDepth478GroupDefinition(override.groupId).pointIndices.includes(index),
  )
}

function buildPerLandmarkZSearchRangeSummary(
  settings: PerLandmarkZSearchSettings,
): PerLandmarkZSearchRangeSummary {
  const groupOverrides = (settings.groupRangeOverrides ?? []).map((override) => ({
    groupId: override.groupId,
    lowerZRange: round(override.lowerZRange),
    upperZRange: round(override.upperZRange),
  }))
  return {
    rangeMode: groupOverrides.some((override) => override.lowerZRange !== override.upperZRange)
      ? "asymmetric"
      : "symmetric",
    defaultRange: {
      lower: round(settings.zRange),
      upper: round(settings.zRange),
    },
    anchorDefaultRange: {
      lower: round(settings.anchorZRange),
      upper: round(settings.anchorZRange),
    },
    groupOverrides,
  }
}

function buildSemanticAnchorLandmarkIndices(pointSetId: SemanticPointSetId): Set<number> {
  const activePointIds = new Set(getSemanticPointSet(pointSetId).pointIds)
  return new Set(
    SEMANTIC_DEFINITIONS.filter((definition) => activePointIds.has(definition.name)).flatMap(
      (definition) => [...definition.primaryIndices, ...(definition.fallbackIndices ?? [])],
    ),
  )
}

function evaluateProjectionErrorForSingleLandmarkZ(
  landmark: Generated478DepthCandidate["landmarks"][number],
  candidateZ: number,
  rotationCenter: RotationCenter,
  frames: Array<{
    pose: Pose
    currentByIndex: Map<number, LandmarkPoint>
  }>,
  settings: SearchSettings,
): number {
  const errors = frames.flatMap((frame) => {
    const current = frame.currentByIndex.get(landmark.index)
    if (!current) {
      return []
    }
    const projected = projectSingleGenerated478Landmark(
      landmark,
      candidateZ,
      rotationCenter,
      frame.pose,
      settings,
    )
    return [distance2D(projected, current)]
  })
  return round(average(errors) ?? 0)
}

function projectSingleGenerated478Landmark(
  landmark: Generated478DepthCandidate["landmarks"][number],
  candidateZ: number,
  rotationCenter: RotationCenter,
  pose: Pose,
  settings: SearchSettings,
): LandmarkPoint {
  const rotated = rotatePoint3D(
    {
      x: landmark.x - rotationCenter.x,
      y: landmark.y - rotationCenter.y,
      z: candidateZ - rotationCenter.z,
    },
    pose,
  )
  const projectedX = rotated.x + rotationCenter.x
  const projectedY = rotated.y + rotationCenter.y
  const z = rotated.z + rotationCenter.z
  const perspective = settings.focalLength / Math.max(settings.focalLength + z, 0.2)
  return {
    index: landmark.index,
    x: round(projectedX * perspective),
    y: round(projectedY * perspective),
    z: round(z),
  }
}

function buildPerLandmarkZSearchDebug(
  settings: PerLandmarkZSearchSettings,
  rows: PerLandmarkZSearchDebugRow[],
  usedOutlierFilteredFrames: boolean,
  totalLandmarkCount: number,
): PerLandmarkZSearchDebug {
  const sortedByImprovement = [...rows]
    .sort((a, b) => b.errorBefore - b.errorAfter - (a.errorBefore - a.errorAfter))
    .slice(0, 10)
  const sortedByDelta = [...rows]
    .sort((a, b) => Math.abs(b.deltaZ) - Math.abs(a.deltaZ))
    .slice(0, 10)
  const sampleRows = PER_LANDMARK_Z_SEARCH_SAMPLE_INDICES.flatMap((index) => {
    const row = rows.find((item) => item.index === index)
    return row ? [row] : []
  })
  const fallbackSamples = sampleRows.length > 0 ? sampleRows : rows.slice(0, 10)
  const boundSummary = buildPerLandmarkZSearchBoundSummary(
    rows,
    Math.max(0, totalLandmarkCount - rows.length),
    settings.zStep,
  )

  return {
    enabled: settings.enabled,
    targetIndices: settings.targetIndices,
    usedOutlierFilteredFrames,
    settings: {
      zRange: round(settings.zRange),
      zStep: round(settings.zStep),
      anchorZRange: round(settings.anchorZRange),
      anchorZStep: round(settings.anchorZStep),
      rangeSummary: buildPerLandmarkZSearchRangeSummary(settings),
      canonicalDeviationPenaltyWeight: round(settings.canonicalDeviationPenaltyWeight),
      ...(settings.maxFrames ? { maxFrames: settings.maxFrames } : {}),
    },
    summary: {
      ...boundSummary,
      optimizedLandmarkCount: rows.length,
      totalEvaluatedCandidates: rows.reduce((total, row) => total + row.candidateCount, 0),
      averageBestDeltaZ: round(average(rows.map((row) => Math.abs(row.deltaZ))) ?? 0),
      maxBestDeltaZ: round(max(rows.map((row) => Math.abs(row.deltaZ))) ?? 0),
      averageErrorBefore: round(average(rows.map((row) => row.errorBefore)) ?? 0),
      averageErrorAfter: round(average(rows.map((row) => row.errorAfter)) ?? 0),
    },
    worstImprovedLandmarks: sortedByImprovement,
    largestDeltaLandmarks: sortedByDelta,
    sampleRows: fallbackSamples,
  }
}

function buildPerLandmarkZSearchBoundSummary(
  rows: PerLandmarkZSearchDebugRow[],
  excludedLandmarkCount: number,
  zStep: number,
): PerLandmarkZSearchBoundSummary {
  const searchedLandmarkCount = rows.length
  const thresholdStep = Math.max(EPSILON, Math.abs(zStep))
  const boundHitLandmarks = rows.filter((row) => row.hit !== "none")
  const nearBoundLandmarks = rows.flatMap((row) => {
    const nearBound = getZSearchNearBound(row, thresholdStep)
    return nearBound === "none" ? [] : [{ ...row, nearBound }]
  })
  const upperBoundHitCount = boundHitLandmarks.filter((row) => row.hit === "upper").length
  const lowerBoundHitCount = boundHitLandmarks.filter((row) => row.hit === "lower").length
  const nearUpperBoundCount = nearBoundLandmarks.filter((row) => row.nearBound === "upper").length
  const nearLowerBoundCount = nearBoundLandmarks.filter((row) => row.nearBound === "lower").length
  const deltas = rows.map((row) => row.deltaFromBaseZ)
  const divisor = searchedLandmarkCount || 1
  return {
    searchedLandmarkCount,
    excludedLandmarkCount,
    upperBoundHitCount,
    lowerBoundHitCount,
    nearUpperBoundCount,
    nearLowerBoundCount,
    upperBoundHitRatio: round(upperBoundHitCount / divisor),
    lowerBoundHitRatio: round(lowerBoundHitCount / divisor),
    nearUpperBoundRatio: round(nearUpperBoundCount / divisor),
    nearLowerBoundRatio: round(nearLowerBoundCount / divisor),
    maxPositiveDeltaFromBaseZ: round(max(deltas.filter((delta) => delta > 0)) ?? 0),
    maxNegativeDeltaFromBaseZ: round(min(deltas.filter((delta) => delta < 0)) ?? 0),
    averageAbsDeltaFromBaseZ: round(average(deltas.map((delta) => Math.abs(delta))) ?? 0),
    nearBoundThreshold: {
      mode: "step",
      value: 1,
      step: round(thresholdStep),
    },
    boundHitLandmarks,
    nearBoundLandmarks,
    groupBoundHitSummary: buildPerLandmarkZSearchGroupBoundHitSummary(
      rows,
      nearBoundLandmarks,
    ),
  }
}

function buildPerLandmarkZSearchGroupBoundHitSummary(
  rows: PerLandmarkZSearchDebugRow[],
  nearBoundLandmarks: PerLandmarkZSearchNearBoundRow[],
): PerLandmarkZSearchGroupBoundHitSummary[] {
  const rowByIndex = new Map(rows.map((row) => [row.index, row]))
  const nearByIndex = new Map(nearBoundLandmarks.map((row) => [row.index, row]))
  return DEPTH_478_GROUP_DEFINITIONS.map((group) => {
    const groupRows = group.pointIndices.flatMap((index) => {
      const row = rowByIndex.get(index)
      return row ? [row] : []
    })
    const groupNearRows = group.pointIndices.flatMap((index) => {
      const row = nearByIndex.get(index)
      return row ? [row] : []
    })
    return {
      groupId: group.groupId,
      label: group.label,
      landmarkCount: group.pointIndices.length,
      upperBoundHitCount: groupRows.filter((row) => row.hit === "upper").length,
      lowerBoundHitCount: groupRows.filter((row) => row.hit === "lower").length,
      nearUpperBoundCount: groupNearRows.filter((row) => row.nearBound === "upper").length,
      nearLowerBoundCount: groupNearRows.filter((row) => row.nearBound === "lower").length,
    }
  })
}

function getZSearchBoundHit(bestZ: number, minZ: number, maxZ: number): ZSearchBoundHit {
  if (Math.abs(bestZ - minZ) <= EPSILON) {
    return "lower"
  }
  if (Math.abs(bestZ - maxZ) <= EPSILON) {
    return "upper"
  }
  return "none"
}

function getZSearchNearBound(
  row: PerLandmarkZSearchDebugRow,
  thresholdStep: number,
): ZSearchNearBound {
  if (row.hit !== "none") {
    return "none"
  }
  if (Math.abs(row.bestZ - row.minZ) <= thresholdStep + EPSILON) {
    return "lower"
  }
  if (Math.abs(row.maxZ - row.bestZ) <= thresholdStep + EPSILON) {
    return "upper"
  }
  return "none"
}

function buildProjection478GroupErrors(
  frameResults: Array<{
    projected: LandmarkPoint[]
    current: LandmarkPoint[]
  }>,
): ProjectionEvaluation478["perGroupError"] {
  return Object.fromEntries(
    DEPTH_478_GROUP_DEFINITIONS.map((group) => {
      const errors = frameResults.flatMap((result) => {
        const projectedByIndex = new Map(result.projected.map((point) => [point.index, point]))
        const currentByIndex = new Map(result.current.map((point) => [point.index, point]))
        return group.pointIndices.flatMap((index) => {
          const projected = projectedByIndex.get(index)
          const current = currentByIndex.get(index)
          return projected && current ? [distance2D(projected, current)] : []
        })
      })
      return [
        group.groupId,
        {
          groupId: group.groupId,
          label: group.label,
          averageError: roundNullable(average(errors)),
          maxError: roundNullable(max(errors)),
          sampleCount: errors.length,
        },
      ]
    }),
  )
}

function buildDepth478RelationDebug(
  candidate: Generated478DepthCandidate,
  sourceSettings: DepthRelationFilteringSettings,
): Depth478RelationDebug {
  const settings = normalizeDepthRelationFilteringSettings(sourceSettings)
  const groups = [
    ...DEPTH_478_GROUP_DEFINITIONS,
    {
      groupId: "cheekGroup",
      label: "頬グループ",
      pointIndices: [
        ...getDepth478GroupDefinition("leftCheekGroup").pointIndices,
        ...getDepth478GroupDefinition("rightCheekGroup").pointIndices,
      ],
      aggregation: "median" as DepthRelationAggregation,
    },
    {
      groupId: "faceCenterGroup",
      label: "顔中心グループ",
      pointIndices: [
        ...getDepth478GroupDefinition("noseTipGroup").pointIndices,
        ...getDepth478GroupDefinition("noseBridgeGroup").pointIndices,
        ...getDepth478GroupDefinition("mouthGroup").pointIndices,
        ...getDepth478GroupDefinition("leftEyeGroup").pointIndices,
        ...getDepth478GroupDefinition("rightEyeGroup").pointIndices,
      ],
      aggregation: "median" as DepthRelationAggregation,
    },
  ]
  const groupValues = Object.fromEntries(
    groups.map((group) => [group.groupId, buildDepth478GroupValue(candidate, group)]),
  )
  const ruleResults = [
    buildDepth478RelationRuleResult(
      "nose_tip_group_in_front_of_cheek_group",
      "noseTipGroup は cheekGroup より手前",
      "noseTipGroup",
      "cheekGroup",
      "inFrontOf",
      0.005,
      groupValues,
      settings,
      "hardReject",
    ),
    buildDepth478RelationRuleResult(
      "face_center_group_in_front_of_boundary_group",
      "faceCenterGroup は faceBoundaryGroup より手前",
      "faceCenterGroup",
      "faceBoundaryGroup",
      "inFrontOf",
      0,
      groupValues,
      settings,
      "debugOnly",
    ),
  ]
  const hardRejectViolationCount = ruleResults.filter(
    (result) => result.severity === "violation" && result.mode === "hardReject",
  ).length
  return {
    settings: summarizeDepthRelationFilteringSettings(settings),
    groupValues,
    ruleResults,
    violationCount: ruleResults.filter((result) => !result.passed).length,
    hardRejectViolationCount,
    isRejected: settings.mode === "hardReject" && ruleResults.some((result) => result.reject),
  }
}

function getDepth478GroupDefinition(
  groupId: string,
): (typeof DEPTH_478_GROUP_DEFINITIONS)[number] {
  return (
    DEPTH_478_GROUP_DEFINITIONS.find((group) => group.groupId === groupId) ??
    DEPTH_478_GROUP_DEFINITIONS[0]
  )
}

function buildDepth478GroupValue(
  candidate: Generated478DepthCandidate,
  group: (typeof DEPTH_478_GROUP_DEFINITIONS)[number],
): Depth478GroupValue {
  const byIndex = new Map(candidate.landmarks.map((landmark) => [landmark.index, landmark]))
  const values = group.pointIndices
    .map((index) => byIndex.get(index)?.z)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
  return {
    groupId: group.groupId,
    label: group.label,
    pointIndices: group.pointIndices,
    aggregation: group.aggregation,
    z: aggregateDepthValues(values, group.aggregation),
  }
}

function buildDepth478RelationRuleResult(
  ruleId: string,
  label: string,
  subjectGroupId: string,
  referenceGroupId: string,
  relation: DepthRelationKind,
  margin: number,
  groupValues: Record<string, Depth478GroupValue>,
  settings: DepthRelationFilteringSettings,
  ruleMode: Exclude<DepthRelationMode, "off">,
): DepthRelationRuleResult {
  const subjectZ = groupValues[subjectGroupId]?.z ?? null
  const referenceZ = groupValues[referenceGroupId]?.z ?? null
  const delta = subjectZ === null || referenceZ === null ? null : round(subjectZ - referenceZ)
  const effectiveMode = getDepth478EffectiveRuleMode(settings.mode, ruleMode)
  const passed =
    subjectZ !== null &&
    referenceZ !== null &&
    evaluateDepthRelation(subjectZ, referenceZ, relation, margin)
  const directionPassed =
    subjectZ !== null &&
    referenceZ !== null &&
    evaluateDepthRelationDirection(subjectZ, referenceZ, relation)
  const severity: DepthRelationSeverity = passed ? "ok" : directionPassed ? "warning" : "violation"
  return {
    ruleId,
    label,
    subjectGroupId,
    referenceGroupId,
    relation,
    subjectZ,
    referenceZ,
    margin,
    delta,
    passed,
    severity,
    mode: effectiveMode,
    penalty: 0,
    reject: settings.mode === "hardReject" && effectiveMode === "hardReject" && severity === "violation",
    explanation:
      subjectZ === null || referenceZ === null
        ? "group z が不足しています。"
        : `${subjectGroupId}.z=${formatNumber(subjectZ)} / ${referenceGroupId}.z=${formatNumber(referenceZ)} / delta=${formatNumber(delta)}`,
  }
}

function evaluateDepthRelationDirection(
  subjectZ: number,
  referenceZ: number,
  relation: DepthRelationKind,
): boolean {
  if (relation === "inFrontOf") {
    return subjectZ < referenceZ
  }
  if (relation === "behind") {
    return subjectZ > referenceZ
  }
  return false
}

function getDepth478EffectiveRuleMode(
  globalMode: DepthRelationMode,
  ruleMode: Exclude<DepthRelationMode, "off">,
): Exclude<DepthRelationMode, "off"> {
  if (globalMode === "off" || globalMode === "debugOnly" || ruleMode === "debugOnly") {
    return "debugOnly"
  }
  if (globalMode === "penalty") {
    return "penalty"
  }
  return ruleMode
}

function evaluateDepthRelation(
  subjectZ: number,
  referenceZ: number,
  relation: DepthRelationKind,
  margin: number,
): boolean {
  if (relation === "inFrontOf") {
    return subjectZ < referenceZ - margin
  }
  if (relation === "behind") {
    return subjectZ > referenceZ + margin
  }
  return Math.abs(subjectZ - referenceZ) <= margin
}

function buildSmoothnessDebug478(
  candidate: Generated478DepthCandidate,
  threshold: number,
): SmoothnessDebug478 {
  const edges = buildDepth478NeighborEdges(candidate.landmarks)
  const deltas = edges.map((edge) => ({
    ...edge,
    deltaZ: round(
      Math.abs(candidate.landmarks[edge.from].z - candidate.landmarks[edge.to].z),
    ),
  }))
  const highDeltaEdges = deltas
    .filter((edge) => edge.deltaZ > threshold)
    .sort((a, b) => b.deltaZ - a.deltaZ)
    .slice(0, DEPTH_478_MAX_HIGH_DELTA_EDGES)

  return {
    averageNeighborDeltaZ: roundNullable(average(deltas.map((edge) => edge.deltaZ))),
    maxNeighborDeltaZ: roundNullable(max(deltas.map((edge) => edge.deltaZ))),
    highDeltaEdgeCount: deltas.filter((edge) => edge.deltaZ > threshold).length,
    highDeltaEdges,
    threshold: round(threshold),
  }
}

function buildDepth478NeighborEdges(
  landmarks: Generated478DepthCandidate["landmarks"],
): Array<{ from: number; to: number }> {
  const edges = new Map<string, { from: number; to: number }>()
  landmarks.forEach((landmark, position) => {
    const nearest = landmarks
      .map((other, otherPosition) => ({
        otherPosition,
        distance: position === otherPosition ? Number.POSITIVE_INFINITY : distance2D(landmark, other),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, DEPTH_478_NEIGHBOR_COUNT)
    for (const item of nearest) {
      const from = Math.min(position, item.otherPosition)
      const to = Math.max(position, item.otherPosition)
      edges.set(`${from}:${to}`, { from, to })
    }
  })
  return Array.from(edges.values())
}

function buildDepth478CandidateComparisonEntry(
  candidate: Generated478DepthCandidate,
  projectionEvaluation: ProjectionEvaluation478,
  depthRelationDebug: Depth478RelationDebug,
  smoothnessDebug: SmoothnessDebug478,
): Depth478CandidateComparisonEntry {
  return {
    candidateId: candidate.id,
    source8CandidateId: candidate.source8CandidateId ?? null,
    depth478GenerationMethod: candidate.generationSettings.interpolation.method,
    perLandmarkZSearchEnabled: candidate.perLandmarkZSearchDebug?.enabled ?? false,
    averageProjectionErrorBeforePerLandmark:
      candidate.perLandmarkZSearchDebug?.summary.averageErrorBefore ?? null,
    averageProjectionErrorAfterPerLandmark:
      candidate.perLandmarkZSearchDebug?.summary.averageErrorAfter ?? null,
    totalProjectionError: projectionEvaluation.totalProjectionError,
    maxBucketScore: maxNullable(Object.values(projectionEvaluation.bucketScores)),
    depthRelationViolationCount: depthRelationDebug.violationCount,
    depthRelationHardRejectViolationCount: depthRelationDebug.hardRejectViolationCount,
    depthRelationIsRejected: depthRelationDebug.isRejected,
    hardRejectViolationCount: depthRelationDebug.hardRejectViolationCount,
    isRejected: depthRelationDebug.isRejected,
    smoothnessMaxDeltaZ: smoothnessDebug.maxNeighborDeltaZ,
    smoothnessHighDeltaEdgeCount: smoothnessDebug.highDeltaEdgeCount,
  }
}

function cloneDepthGroupCorrections(corrections: DepthGroupCorrection[]): DepthGroupCorrection[] {
  return corrections.map((correction) => ({
    ...correction,
    pointIndices: [...correction.pointIndices],
  }))
}

function aggregateDepthValues(
  values: number[],
  aggregation: DepthRelationAggregation,
): number | null {
  if (values.length === 0) {
    return null
  }
  return aggregation === "median" ? round(median(values) ?? 0) : round(average(values) ?? 0)
}

function buildAnalysisOutlierFrameDebug(
  settings: SearchSettings,
  bestCandidate: CandidateResult | null,
): AnalysisOutlierFrameDebug {
  const outlierDebug = bestCandidate?.outlierDebug
  return {
    settings: outlierDebug?.settings ?? settings.outlierFiltering,
    bestCandidateOutliers: outlierDebug
      ? {
          bucketSummaries: outlierDebug.bucketSummaries,
          outlierFrames: outlierDebug.outlierFrames,
          rawScores: outlierDebug.rawScores,
          filteredScores: outlierDebug.filteredScores,
        }
      : undefined,
  }
}

function buildStepOutlierFilteringDebug(
  settings: SearchSettings,
  bestCandidate: CandidateResult | null,
): StepOutlierFilteringDebug {
  const outlierDebug = bestCandidate?.outlierDebug
  const outlierSettings = outlierDebug?.settings ?? settings.outlierFiltering
  const usedOutlierFilteredObjectiveScore = Boolean(
    outlierSettings.enabled &&
      outlierSettings.mode === "excludeFromInference" &&
      outlierSettings.applyToObjectiveScore &&
      outlierDebug?.filteredScores,
  )
  const bucketSummaries = outlierDebug?.bucketSummaries ?? []
  const perBucket = BUCKETS.map((bucket) => {
    const summary = bucketSummaries.find((item) => item.bucket === bucket)
    const excludedFrameIds = summary?.outlierFrames
      .filter((frame) => frame.excludedFromInference)
      .map((frame) => frame.captureId) ?? []
    const beforeCount = summary?.sampleCount ?? 0
    return {
      bucketId: bucket,
      beforeCount,
      afterCount: Math.max(0, beforeCount - excludedFrameIds.length),
      excludedFrameIds,
      medianError: summary?.rawMedianError ?? null,
      threshold: calculateOutlierThreshold(summary?.rawMedianError ?? null, outlierSettings),
    }
  })
  const excludedFrameIds = Array.from(
    new Set(perBucket.flatMap((bucket) => bucket.excludedFrameIds)),
  )
  const scoringFrameCountBeforeOutlierFilter =
    bucketSummaries.length > 0
      ? bucketSummaries.reduce((total, summary) => total + summary.sampleCount, 0)
      : bestCandidate?.sampleCount ?? 0

  return {
    debugTarget: "stepBestCandidate",
    candidateId: bestCandidate?.candidateId ?? null,
    enabled: outlierSettings.enabled,
    mode: outlierSettings.mode,
    applyToObjectiveScore: outlierSettings.applyToObjectiveScore,
    usedOutlierFilteredObjectiveScore,
    objectiveScoreSource: usedOutlierFilteredObjectiveScore ? "filteredScores" : "rawScores",
    scoringFrameCountBeforeOutlierFilter,
    scoringFrameCountAfterOutlierFilter: Math.max(
      0,
      scoringFrameCountBeforeOutlierFilter - excludedFrameIds.length,
    ),
    excludedFrameIds,
    excludedFrameCount: excludedFrameIds.length,
    perBucket,
  }
}

function calculateOutlierThreshold(
  bucketMedianError: number | null,
  settings: OutlierFilteringSettings,
): number | null {
  if (settings.method === "topWorstPercent" || bucketMedianError === null) {
    return null
  }
  if (settings.method === "medianAbsoluteDelta") {
    return round(bucketMedianError + settings.absoluteDeltaThreshold)
  }
  return round(bucketMedianError * settings.medianMultiplier)
}

function buildAnalysisDepthRelationDebug(
  settings: SearchSettings,
  bestCandidate: CandidateResult | null,
  sourceDebug: unknown,
): AnalysisDepthRelationDebug {
  if (isRecord(sourceDebug)) {
    return {
      settings: normalizeDepthRelationFilteringSettings(
        sourceDebug.settings as DepthRelationFilteringSettings | undefined,
      ),
      bestCandidateDepthRelation:
        (sourceDebug.bestCandidateDepthRelation as DepthRelationDebug | undefined) ??
        bestCandidate?.depthRelationDebug,
      rejectedCandidates: Array.isArray(sourceDebug.rejectedCandidates)
        ? (sourceDebug.rejectedCandidates as RejectedCandidateSummary[])
        : [],
      nearestRejectedCandidate: isRecord(sourceDebug.nearestRejectedCandidate)
        ? (sourceDebug.nearestRejectedCandidate as unknown as RejectedCandidateSummary)
        : undefined,
      rejectedCandidateCount: toNumber(sourceDebug.rejectedCandidateCount, 0),
    }
  }
  return {
    settings: normalizeDepthRelationFilteringSettings(settings.depthRelationFiltering),
    bestCandidateDepthRelation: bestCandidate?.depthRelationDebug,
    rejectedCandidates: [],
    nearestRejectedCandidate: undefined,
    rejectedCandidateCount: 0,
  }
}

function degreesToRadians(degrees: number): number {
  return (degrees / 180) * Math.PI
}

function readSettings(): SearchSettings {
  const searchMode = readSearchMode()
  return {
    ...DEFAULT_SETTINGS,
    semanticPointSetId: DEFAULT_SEMANTIC_POINT_SET_ID,
    searchMode,
    objectiveMode: readObjectiveMode(),
    outlierFiltering: readOutlierFilteringSettings(),
    depthRelationFiltering: readDepthRelationFilteringSettings(),
    maxFrames: readNumber("max-frames-input", DEFAULT_SETTINGS.maxFrames),
    targets: {
      front: readNumber("target-front-input", DEFAULT_SETTINGS.targets.front),
      yawPositive: readNumber("target-yaw-positive-input", DEFAULT_SETTINGS.targets.yawPositive),
      yawNegative: readNumber("target-yaw-negative-input", DEFAULT_SETTINGS.targets.yawNegative),
      pitchPositive: readNumber(
        "target-pitch-positive-input",
        DEFAULT_SETTINGS.targets.pitchPositive,
      ),
      pitchNegative: readNumber(
        "target-pitch-negative-input",
        DEFAULT_SETTINGS.targets.pitchNegative,
      ),
      mixedPose: readNumber("target-mixed-input", DEFAULT_SETTINGS.targets.mixedPose),
      unknown: 0,
    },
    includeMixedPose: getElement<HTMLSelectElement>("include-mixed-select").value === "true",
    rollWarningDeg: readNumber("roll-warning-input", DEFAULT_SETTINGS.rollWarningDeg),
    blendshapeWarningScore: readNumber(
      "blendshape-warning-input",
      DEFAULT_SETTINGS.blendshapeWarningScore,
    ),
    zMin: readNumber("z-min-input", DEFAULT_SETTINGS.zMin),
    zMax: readNumber("z-max-input", DEFAULT_SETTINGS.zMax),
    zStep: readNumber("z-step-input", DEFAULT_SETTINGS.zStep),
    pivotZMin: readNumber("pivot-z-min-input", DEFAULT_SETTINGS.pivotZMin),
    pivotZMax: readNumber("pivot-z-max-input", DEFAULT_SETTINGS.pivotZMax),
    pivotZStep: readNumber("pivot-z-step-input", DEFAULT_SETTINGS.pivotZStep),
    topN: Math.max(1, Math.round(readNumber("top-n-input", DEFAULT_SETTINGS.topN))),
    focalLength: readNumber("focal-length-input", DEFAULT_SETTINGS.focalLength),
    localSearchSettings: readLocalSearchSettings(),
  }
}

function readOutlierFilteringSettings(): OutlierFilteringSettings {
  return buildOutlierFilteringSettings({
    enabled: getElement<HTMLSelectElement>("outlier-enabled-select").value === "true",
    mode: readOutlierFilteringMode(getElement<HTMLSelectElement>("outlier-mode-select").value),
    perBucketMaxOutliers: readNumber(
      "outlier-per-bucket-max-input",
      DEFAULT_OUTLIER_FILTERING_SETTINGS.perBucketMaxOutliers,
    ),
    minBucketSampleCount: readNumber(
      "outlier-min-bucket-sample-count-input",
      DEFAULT_OUTLIER_FILTERING_SETTINGS.minBucketSampleCount,
    ),
    method: readOutlierFilteringMethod(getElement<HTMLSelectElement>("outlier-method-select").value),
    medianMultiplier: readNumber(
      "outlier-median-multiplier-input",
      DEFAULT_OUTLIER_FILTERING_SETTINGS.medianMultiplier,
    ),
    absoluteDeltaThreshold: readNumber(
      "outlier-absolute-delta-threshold-input",
      DEFAULT_OUTLIER_FILTERING_SETTINGS.absoluteDeltaThreshold,
    ),
    topWorstPercent: Math.max(
      0,
      Math.min(
        100,
        readNumber(
          "outlier-top-worst-percent-input",
          DEFAULT_OUTLIER_FILTERING_SETTINGS.topWorstPercent,
        ),
      ),
    ),
    applyToObjectiveScore:
      getElement<HTMLSelectElement>("outlier-apply-to-objective-select").value === "true",
  })
}

function buildOutlierFilteringSettings(
  source?: Partial<OutlierFilteringSettings>,
): OutlierFilteringSettings {
  const merged = {
    ...DEFAULT_OUTLIER_FILTERING_SETTINGS,
    ...(source ?? {}),
  }
  return {
    ...merged,
    enabled: Boolean(merged.enabled),
    mode: readOutlierFilteringMode(merged.mode),
    perBucketMaxOutliers: Math.max(0, Math.round(merged.perBucketMaxOutliers)),
    minBucketSampleCount: Math.max(1, Math.round(merged.minBucketSampleCount)),
    method: readOutlierFilteringMethod(merged.method),
    topWorstPercent: Math.max(0, Math.min(100, merged.topWorstPercent)),
    applyToObjectiveScore: Boolean(merged.applyToObjectiveScore),
  }
}

function readOutlierFilteringMode(value: string): OutlierFilteringMode {
  return value === "off" || value === "excludeFromInference" ? value : "debugOnly"
}

function readOutlierFilteringMethod(value: string): OutlierFilteringMethod {
  return value === "medianAbsoluteDelta" || value === "topWorstPercent"
    ? value
    : "medianMultiplier"
}

function readDepthRelationFilteringSettings(): DepthRelationFilteringSettings {
  return normalizeDepthRelationFilteringSettings({
    ...DEFAULT_DEPTH_RELATION_FILTERING_SETTINGS,
    enabled: getElement<HTMLSelectElement>("depth-relation-enabled-select").value === "true",
    mode: readDepthRelationMode(getElement<HTMLSelectElement>("depth-relation-mode-select").value),
    applyToObjectiveScore:
      getElement<HTMLSelectElement>("depth-relation-apply-to-objective-select").value === "true",
    penaltyScale: readNumber(
      "depth-relation-penalty-scale-input",
      DEFAULT_DEPTH_RELATION_FILTERING_SETTINGS.penaltyScale,
    ),
    maxPenalty: readNumber(
      "depth-relation-max-penalty-input",
      DEFAULT_DEPTH_RELATION_FILTERING_SETTINGS.maxPenalty,
    ),
  })
}

function readDepthRelationMode(value: string): DepthRelationMode {
  if (value === "reject") {
    return "hardReject"
  }
  return value === "off" || value === "penalty" || value === "hardReject" ? value : "debugOnly"
}

function normalizeDepthRelationFilteringSettings(
  settings?: DepthRelationFilteringSettings,
): DepthRelationFilteringSettings {
  const groups = Array.isArray(settings?.groups) && settings.groups.length > 0
    ? settings.groups
    : DEFAULT_DEPTH_RELATION_GROUPS_8
  const groupIds = new Set(groups.map((group) => group.id))
  const rules = Array.isArray(settings?.rules) && settings.rules.length > 0
    ? settings.rules
    : DEFAULT_DEPTH_RELATION_RULES_8
  return {
    ...DEFAULT_DEPTH_RELATION_FILTERING_SETTINGS,
    ...(settings ?? {}),
    mode: readDepthRelationMode(settings?.mode ?? DEFAULT_DEPTH_RELATION_FILTERING_SETTINGS.mode),
    groups: groups.map((group) => ({
      id: group.id,
      label: group.label,
      pointIds: group.pointIds.filter((pointId): pointId is SemanticPointId =>
        SEMANTIC_POINT_NAMES.includes(pointId),
      ),
      aggregation: group.aggregation === "mean" ? "mean" : "median",
    })),
    rules: rules
      .filter((rule) => groupIds.has(rule.subjectGroupId) && groupIds.has(rule.referenceGroupId))
      .map((rule) => ({
        ...rule,
        relation: rule.relation === "behind" || rule.relation === "near" ? rule.relation : "inFrontOf",
        margin: Math.max(0, rule.margin),
        warningMargin: Math.max(0, rule.warningMargin),
        weight: Math.max(0, rule.weight),
        mode: rule.mode === "penalty" || rule.mode === "hardReject" ? rule.mode : "debugOnly",
      })),
    penaltyScale: Math.max(
      0,
      settings?.penaltyScale ?? DEFAULT_DEPTH_RELATION_FILTERING_SETTINGS.penaltyScale,
    ),
    maxPenalty: Math.max(
      0,
      settings?.maxPenalty ?? DEFAULT_DEPTH_RELATION_FILTERING_SETTINGS.maxPenalty,
    ),
  }
}

function readSearchMode(): SearchMode {
  const value = getElement<HTMLSelectElement>("search-mode-select").value
  return value === "localOneDimensional" || value === "coordinateDescent"
    ? value
    : "fullGrid"
}

function readObjectiveMode(): ObjectiveMode {
  const value = getElement<HTMLSelectElement>("objective-mode-select").value
  return isObjectiveMode(value) ? value : DEFAULT_SETTINGS.objectiveMode
}

function readLocalSearchSettings(): LocalSearchSettings {
  return {
    baseCandidate: readBaseCandidate(),
    targetParameter: readLocalSearchParameter(
      getElement<HTMLSelectElement>("local-target-parameter-select").value,
      DEFAULT_SETTINGS.localSearchSettings.targetParameter,
    ),
    localMin: readNumber("local-min-input", DEFAULT_SETTINGS.localSearchSettings.localMin),
    localMax: readNumber("local-max-input", DEFAULT_SETTINGS.localSearchSettings.localMax),
    localStep: readNumber("local-step-input", DEFAULT_SETTINGS.localSearchSettings.localStep),
    coordinateDescentIterations: Math.max(
      1,
      Math.round(
        readNumber(
          "coordinate-descent-iterations-input",
          DEFAULT_SETTINGS.localSearchSettings.coordinateDescentIterations,
        ),
      ),
    ),
    coordinateDescentParameterOrder: DEFAULT_COORDINATE_DESCENT_PARAMETER_ORDER,
    coordinateDescentRanges: cloneLocalSearchRanges(state.coordinateDescentRanges),
  }
}

function readBaseCandidate(): FittingCandidate8 {
  const zByPointId = {} as Record<SemanticPointName, number>
  for (const name of SEMANTIC_POINT_NAMES) {
    zByPointId[name] = readNumber(
      `base-${name}-z-input`,
      DEFAULT_LOCAL_SEARCH_BASE_CANDIDATE.zByPointId[name],
    )
  }
  const legacyPivotZ = readNumber("base-pivot-z-input", DEFAULT_LOCAL_SEARCH_BASE_CANDIDATE.pivotZ)
  const rotationCenterZ = readNumber("base-rotation-center-z-input", legacyPivotZ)
  return {
    pivotZ: rotationCenterZ,
    rotationCenter: {
      x: readNumber("base-rotation-center-x-input", 0),
      y: readNumber("base-rotation-center-y-input", 0),
      z: rotationCenterZ,
    },
    zByPointId,
  }
}

function writeCandidateToBaseInputs(candidate: FittingCandidate8): void {
  const rotationCenter = getCandidateRotationCenter(candidate)
  getElement<HTMLInputElement>("base-pivot-z-input").value = String(round(candidate.pivotZ))
  getElement<HTMLInputElement>("base-rotation-center-x-input").value = String(round(rotationCenter.x))
  getElement<HTMLInputElement>("base-rotation-center-y-input").value = String(round(rotationCenter.y))
  getElement<HTMLInputElement>("base-rotation-center-z-input").value = String(round(rotationCenter.z))
  for (const name of SEMANTIC_POINT_NAMES) {
    getElement<HTMLInputElement>(`base-${name}-z-input`).value = String(
      round(candidate.zByPointId[name]),
    )
  }
}

function applySearchPreset(): void {
  const preset = findSearchPreset(getElement<HTMLSelectElement>("search-preset-select").value)
  applySearchPresetDefinition(preset, true)

  state.presetMessage = [
    `Preset: ${preset.label}`,
    preset.description,
    "探索後、必要に応じて bestCandidate を base に反映してください。",
  ].join("\n")
  renderPresetMessage()
}

function applySearchPresetDefinition(
  preset: SearchPresetDefinition,
  applyRecommendedBaseCandidate: boolean,
): void {
  applyCommonPresetSettings()
  writeSelectValue("search-mode-select", preset.searchMode)
  writeSelectValue("objective-mode-select", preset.objectiveMode ?? DEFAULT_SETTINGS.objectiveMode)
  writeSelectValue("local-target-parameter-select", preset.targetParameter)
  writeNumberInput("local-min-input", preset.localMin)
  writeNumberInput("local-max-input", preset.localMax)
  writeNumberInput("local-step-input", preset.localStep)
  writeNumberInput("coordinate-descent-iterations-input", preset.coordinateDescentIterations)
  state.coordinateDescentParameterOrder = [
    ...(preset.coordinateDescentParameterOrder ?? DEFAULT_COORDINATE_DESCENT_PARAMETER_ORDER),
  ]
  state.coordinateDescentRanges = cloneLocalSearchRanges(preset.coordinateDescentRanges)

  if (applyRecommendedBaseCandidate && preset.baseCandidatePresetId) {
    applyBaseCandidatePreset(preset.baseCandidatePresetId)
    writeSelectValue("base-candidate-preset-select", preset.baseCandidatePresetId)
  }
}

function applySelectedBaseCandidatePreset(): void {
  const presetId = readBaseCandidatePresetId(
    getElement<HTMLSelectElement>("base-candidate-preset-select").value,
  )
  if (!applyBaseCandidatePreset(presetId)) {
    state.presetMessage =
      "Current bestCandidate はまだありません。Run Search 後に選ぶか、既存の bestCandidate を base に反映ボタンを使ってください。"
    renderPresetMessage()
    return
  }
  state.presetMessage = `Base Candidate Preset: ${formatBaseCandidatePresetLabel(presetId)} を baseCandidate に反映しました。`
  renderPresetMessage()
}

function applyBaseCandidatePreset(presetId: BaseCandidatePresetId): boolean {
  const candidate = getBaseCandidatePreset(presetId)
  if (!candidate) {
    return false
  }
  writeCandidateToBaseInputs(candidate)
  return true
}

function runAutoSequence(): void {
  if (state.frames.length === 0 || state.searchProgress.status === "running") {
    return
  }

  const sequence = findAutoSequence(
    getElement<HTMLSelectElement>("auto-sequence-select").value,
  )
  const bucketTargetPreset = findBucketTargetPreset(
    getElement<HTMLSelectElement>("bucket-target-preset-select").value,
  )
  startAutoSequence(sequence, bucketTargetPreset)
}

function startAutoSequence(
  sequence: AutoSequenceDefinition,
  bucketTargetPreset: BucketTargetPresetDefinition | null = null,
): void {
  const initialCandidate = getBaseCandidatePreset(sequence.baseCandidatePresetId)
  if (!initialCandidate) {
    state.autoSequence = {
      ...createIdleAutoSequence(),
      status: "error",
      definition: sequence,
      message:
        "Current bestCandidate がまだありません。先に単発 search を実行するか、別の sequence を選んでください。",
    }
    renderAutoSequenceStatus()
    setButtons()
    if (state.quick478DepthDebug.status === "running") {
      completeQuick478DepthDebug("error", state.autoSequence.message ?? "Auto Sequence failed")
    }
    return
  }

  state.autoSequence = {
    status: "running",
    definition: sequence,
    bucketTargetPreset,
    currentStepIndex: 0,
    startedAt: new Date().toISOString(),
    completedAt: null,
    steps: [],
    finalCandidate: null,
    currentBestScore: null,
    message: `Auto Sequence running: ${sequence.label}`,
  }
  state.autoSequenceLastAnalysis = null
  beginAutoSequenceStep(initialCandidate)
}

function cancelAutoSequence(): void {
  if (state.autoSequence.status !== "running") {
    return
  }
  if (state.searchProgress.status === "running" && state.searchWorker) {
    cancelAnalysis()
    return
  }
  finishAutoSequence("cancelled", "Auto Sequence をキャンセルしました。")
}

function beginAutoSequenceStep(baseCandidate: FittingCandidate8): void {
  const sequence = state.autoSequence.definition
  if (!sequence || state.autoSequence.status !== "running") {
    return
  }

  const stepPresetId = sequence.steps[state.autoSequence.currentStepIndex]
  const preset = findSearchPreset(stepPresetId)
  writeSelectValue("auto-sequence-select", sequence.id)
  writeSelectValue("search-preset-select", preset.id)
  applySearchPresetDefinition(preset, false)
  if (state.autoSequence.bucketTargetPreset) {
    applyBucketTargetPreset(state.autoSequence.bucketTargetPreset)
  }
  writeCandidateToBaseInputs(baseCandidate)
  state.autoSequence.currentBestScore = null
  state.autoSequence.message = `Auto Sequence running: ${preset.label}`
  state.presetMessage = [
    `Auto Sequence: ${sequence.label}`,
    `Current preset: ${preset.label}`,
    "この step の bestCandidate は次 step の baseCandidate へ自動反映されます。",
  ].join("\n")
  renderPresetMessage()
  renderAutoSequenceStatus()
  setButtons()
  runAnalysis(resolveAutoSequenceStepSettings(baseCandidate, preset))
}

function resolveAutoSequenceStepSettings(
  baseCandidate?: FittingCandidate8,
  preset?: SearchPresetDefinition,
): SearchSettings {
  if (state.quick478DepthDebug.status === "running" && baseCandidate && preset) {
    return applyAutoSequenceDepthRelationOverride(
      createQuick478DepthDebugSearchSettings(baseCandidate, preset),
      state.autoSequence.definition,
    )
  }
  const settings = readSettings()
  const withBucketPreset = state.autoSequence.bucketTargetPreset
    ? applyBucketTargetPresetToSettings(settings, state.autoSequence.bucketTargetPreset)
    : settings
  return applyAutoSequenceDepthRelationOverride(withBucketPreset, state.autoSequence.definition)
}

function createQuick478DepthDebugSearchSettings(
  baseCandidate: FittingCandidate8,
  preset: SearchPresetDefinition,
): SearchSettings {
  const bucketPreset = findBucketTargetPreset(QUICK_478_DEPTH_DEBUG_SETTINGS.bucketPreset)
  const semanticPointSetId = getQuick478ActiveSemanticPointSetId()
  return applyBucketTargetPresetToSettings(
    {
      ...DEFAULT_SETTINGS,
      semanticPointSetId,
      searchMode: preset.searchMode,
      objectiveMode: preset.objectiveMode ?? DEFAULT_SETTINGS.objectiveMode,
      outlierFiltering: buildOutlierFilteringSettings({
        ...DEFAULT_OUTLIER_FILTERING_SETTINGS,
        ...QUICK_478_DEPTH_DEBUG_SETTINGS.outlierFiltering,
      }),
      depthRelationFiltering: normalizeDepthRelationFilteringSettings({
        ...DEFAULT_DEPTH_RELATION_FILTERING_SETTINGS,
        enabled: QUICK_478_DEPTH_DEBUG_SETTINGS.depthRelationFiltering.enabled,
        mode: QUICK_478_DEPTH_DEBUG_SETTINGS.depthRelationFiltering.mode,
        applyToObjectiveScore:
          QUICK_478_DEPTH_DEBUG_SETTINGS.depthRelationFiltering.applyToObjectiveScore,
      }),
      localSearchSettings: {
        ...DEFAULT_SETTINGS.localSearchSettings,
        baseCandidate: cloneCandidate(baseCandidate),
        targetParameter: preset.targetParameter,
        localMin: preset.localMin,
        localMax: preset.localMax,
        localStep: preset.localStep,
        coordinateDescentIterations: preset.coordinateDescentIterations,
        coordinateDescentParameterOrder: expandParameterOrderForSemanticPointSet(
          preset.coordinateDescentParameterOrder ?? DEFAULT_COORDINATE_DESCENT_PARAMETER_ORDER,
          semanticPointSetId,
        ),
        coordinateDescentRanges: cloneLocalSearchRanges(preset.coordinateDescentRanges),
      },
    },
    bucketPreset,
  )
}

function applyAutoSequenceDepthRelationOverride(
  settings: SearchSettings,
  sequence: AutoSequenceDefinition | null,
): SearchSettings {
  if (!sequence?.depthRelationFilteringOverride) {
    return settings
  }
  return {
    ...settings,
    depthRelationFiltering: normalizeDepthRelationFilteringSettings({
      ...settings.depthRelationFiltering,
      ...sequence.depthRelationFilteringOverride,
    }),
  }
}

function handleAutoSequenceStepComplete(analysis: AnalysisResult | null): void {
  const sequence = state.autoSequence.definition
  if (!sequence || !analysis) {
    finishAutoSequence("error", "Auto Sequence の step 結果を保存できませんでした。")
    return
  }

  const preset = findSearchPreset(sequence.steps[state.autoSequence.currentStepIndex])
  const bestCandidate = analysis.bestCandidate
    ? attachDepthRelationToCandidate(
        cloneCandidate(analysis.bestCandidate),
        analysis.bestCandidate.depthRelationDebug,
      )
    : null
  const stepSummary: AutoSequenceStepSummary = {
    stepIndex: state.autoSequence.currentStepIndex + 1,
    presetName: preset.label,
    presetId: preset.id,
    semanticPointSetId: analysis.searchSettings.semanticPointSetId,
    semanticPointCount: getSemanticPointSet(analysis.searchSettings.semanticPointSetId).pointIds.length,
    searchSettings: buildAutoSequenceStepSearchSettings(analysis.searchSettings),
    objectiveMode: analysis.bestCandidate?.objectiveMode ?? analysis.searchSettings.objectiveMode,
    objectiveScore: analysis.bestCandidate?.objectiveScore ?? null,
    baseCandidate: cloneCandidate(analysis.searchSettings.localSearchSettings.baseCandidate),
    bestCandidate,
    totalScore: analysis.bestCandidate?.totalScore ?? null,
    scoreDebug: analysis.bestCandidate?.scoreDebug
      ? roundScoreDebug(analysis.bestCandidate.scoreDebug)
      : undefined,
    depthRelationSummary: buildDepthRelationSummary(
      analysis.depthRelationDebug,
      analysis.bestCandidate?.depthRelationDebug,
    ),
    depthRelationFiltering: summarizeDepthRelationFilteringSettings(
      analysis.searchSettings.depthRelationFiltering,
    ),
    outlierFilteringDebug: buildStepOutlierFilteringDebug(
      analysis.searchSettings,
      analysis.bestCandidate,
    ),
    processedCandidateCount: analysis.processedCandidateCount,
    estimatedCandidateCount: analysis.estimatedCandidateCount,
    bestCandidateId: analysis.bestCandidate?.candidateId ?? null,
  }

  state.autoSequence.steps = [...state.autoSequence.steps, stepSummary]
  state.autoSequence.currentBestScore = stepSummary.objectiveScore
  state.autoSequenceLastAnalysis = analysis

  if (!bestCandidate) {
    if (state.quick478DepthDebug.status === "running") {
      state.autoSequence.finalCandidate = null
    }
    finishAutoSequence("error", `Step ${stepSummary.stepIndex}: ${preset.label} で bestCandidate が得られませんでした。`)
    return
  }

  writeCandidateToBaseInputs(bestCandidate)
  state.autoSequence.finalCandidate = bestCandidate

  if (state.autoSequence.currentStepIndex >= sequence.steps.length - 1) {
    finishAutoSequence("completed", "Auto Sequence completed", analysis)
    return
  }

  state.autoSequence.currentStepIndex += 1
  beginAutoSequenceStep(bestCandidate)
}

function finishAutoSequence(
  status: "completed" | "cancelled" | "error",
  message: string,
  analysis: AnalysisResult | null = null,
): void {
  const isStabilityCheckRun = state.stabilityCheck.status === "running"
  state.autoSequence = {
    ...state.autoSequence,
    status,
    completedAt: new Date().toISOString(),
    message,
  }
  const summary = buildAutoSequenceSummary(status)
  const summaryAnalysis = analysis ?? state.autoSequenceLastAnalysis ?? state.analysis
  if (summaryAnalysis) {
    summaryAnalysis.lastRunType =
      isStabilityCheckRun && status === "completed" ? "stabilityCheck" : "autoSequence"
    summaryAnalysis.autoSequenceSummary = summary
    if (status === "completed") {
      summaryAnalysis.autoSequenceSummary.structureAwareReranking =
        buildStructureAwareReranking(summaryAnalysis)
    }
    if (status === "completed") {
      appendStabilityHistoryFromAnalysis(summaryAnalysis)
    } else {
      summaryAnalysis.candidateStabilityDebug = buildCandidateStabilityDebug()
    }
    state.analysis = summaryAnalysis
  }
  terminateSearchWorker()
  if (status !== "completed" && state.stabilityCheck.status === "running") {
    state.stabilityCheck = createIdleStabilityCheck()
  }
  if (status === "completed" && continueStabilityCheckAfterSequence()) {
    return
  }
  if (state.quick478DepthDebug.status === "running") {
    completeQuick478DepthDebug(status, message)
    return
  }
  setButtons()
  if (state.analysis) {
    renderAnalysis()
  }
  renderSearchProgress()
  renderAutoSequenceStatus()
  renderCandidateStabilityDebug()
}

function buildAutoSequenceSummary(
  status: "completed" | "cancelled" | "error",
): AutoSequenceSummary {
  const finalStep = state.autoSequence.steps.at(-1)
  const sequence = state.autoSequence.definition
  return {
    sequenceId: sequence?.id ?? null,
    sequenceName: sequence?.label ?? "-",
    baseCandidatePresetId: sequence?.baseCandidatePresetId ?? null,
    stepPresetIds: sequence ? [...sequence.steps] : [],
    startedAt: state.autoSequence.startedAt ?? new Date().toISOString(),
    completedAt: state.autoSequence.completedAt ?? new Date().toISOString(),
    status,
    steps: state.autoSequence.steps,
    finalCandidate: state.autoSequence.finalCandidate,
    finalObjectiveMode: finalStep?.objectiveMode ?? null,
    finalObjectiveScore: finalStep?.objectiveScore ?? null,
  }
}

function buildAutoSequenceStepSearchSettings(settings: SearchSettings): AutoSequenceStepSearchSettings {
  const local = settings.searchMode === "fullGrid" ? undefined : settings.localSearchSettings
  const semanticPointSet = getSemanticPointSet(settings.semanticPointSetId)
  return {
    semanticPointSetId: settings.semanticPointSetId,
    semanticPointCount: semanticPointSet.pointIds.length,
    searchMode: settings.searchMode,
    objectiveMode: settings.objectiveMode,
    targetParameter: local?.targetParameter,
    localRange: local
      ? {
          min: local.localMin,
          max: local.localMax,
          step: local.localStep,
        }
      : undefined,
    coordinateDescentIterations: local?.coordinateDescentIterations,
    coordinateDescentParameterOrder: local
      ? [...local.coordinateDescentParameterOrder]
      : undefined,
    coordinateDescentRanges: local
      ? cloneLocalSearchRanges(local.coordinateDescentRanges)
      : undefined,
  }
}

function applySelectedBucketTargetPreset(): void {
  const preset = findBucketTargetPreset(
    getElement<HTMLSelectElement>("bucket-target-preset-select").value,
  )
  applyBucketTargetPreset(preset)
  state.presetMessage = `${preset.label} を適用しました。mixedPose は採用しません。`
  renderPresetMessage()
  renderBucketTargetWarning()
}

function applyBucketTargetPreset(preset: BucketTargetPresetDefinition): void {
  const requiredFrameCount = REQUIRED_BUCKETS.reduce(
    (total, bucket) => total + preset.targets[bucket],
    preset.includeMixedPose ? preset.targets.mixedPose : 0,
  )
  writeSelectValue("bucket-target-preset-select", preset.id)
  writeNumberInput("max-frames-input", requiredFrameCount)
  writeNumberInput("target-front-input", preset.targets.front)
  writeNumberInput("target-yaw-positive-input", preset.targets.yawPositive)
  writeNumberInput("target-yaw-negative-input", preset.targets.yawNegative)
  writeNumberInput("target-pitch-positive-input", preset.targets.pitchPositive)
  writeNumberInput("target-pitch-negative-input", preset.targets.pitchNegative)
  writeNumberInput("target-mixed-input", preset.targets.mixedPose)
  writeSelectValue("include-mixed-select", preset.includeMixedPose ? "true" : "false")
}

function applyBucketTargetPresetToSettings(
  settings: SearchSettings,
  preset: BucketTargetPresetDefinition,
): SearchSettings {
  const requiredFrameCount = REQUIRED_BUCKETS.reduce(
    (total, bucket) => total + preset.targets[bucket],
    preset.includeMixedPose ? preset.targets.mixedPose : 0,
  )
  return {
    ...settings,
    maxFrames: requiredFrameCount,
    targets: { ...preset.targets },
    includeMixedPose: preset.includeMixedPose,
  }
}

function findBucketTargetPreset(value: string): BucketTargetPresetDefinition {
  return BUCKET_TARGET_PRESETS.find((preset) => preset.id === value) ?? BUCKET_TARGET_PRESETS[0]
}

function getCurrentBucketTargetPresetName(settings: SearchSettings): string {
  const matched = BUCKET_TARGET_PRESETS.find(
    (preset) =>
      preset.includeMixedPose === settings.includeMixedPose &&
      BUCKETS.every((bucket) => preset.targets[bucket] === settings.targets[bucket]),
  )
  return matched?.label ?? "Custom"
}

function runStabilityCheck(): void {
  if (state.frames.length === 0 || state.searchProgress.status === "running") {
    return
  }
  const sequenceId = readStabilitySequenceId()
  const targetPresetIds = readSelectedStabilityTargetPresetIds()
  if (targetPresetIds.length === 0) {
    state.stabilityCheck = createIdleStabilityCheck()
    renderCandidateStabilityDebug()
    return
  }
  state.stabilityCheck = {
    status: "running",
    sequenceId,
    targetPresetIds,
    currentIndex: 0,
  }
  runCurrentStabilityCheckStep()
}

function runCurrentStabilityCheckStep(): void {
  const stability = state.stabilityCheck
  if (stability.status !== "running" || !stability.sequenceId) {
    return
  }
  const targetPresetId = stability.targetPresetIds[stability.currentIndex]
  const bucketPreset = findBucketTargetPreset(STABILITY_TARGET_PRESET_TO_BUCKET_PRESET[targetPresetId])
  applyBucketTargetPreset(bucketPreset)
  renderBucketTargetWarning()
  writeSelectValue("auto-sequence-select", stability.sequenceId)
  state.presetMessage = `Stability Check: ${findAutoSequence(stability.sequenceId).label} / ${bucketPreset.label}`
  renderPresetMessage()
  renderCandidateStabilityDebug()
  startAutoSequence(findAutoSequence(stability.sequenceId), bucketPreset)
}

function continueStabilityCheckAfterSequence(): boolean {
  if (state.stabilityCheck.status !== "running") {
    return false
  }
  const nextIndex = state.stabilityCheck.currentIndex + 1
  if (nextIndex >= state.stabilityCheck.targetPresetIds.length) {
    state.stabilityCheck = createIdleStabilityCheck()
    return false
  }
  state.stabilityCheck = {
    ...state.stabilityCheck,
    currentIndex: nextIndex,
  }
  runCurrentStabilityCheckStep()
  return true
}

function readStabilitySequenceId(): StabilitySequencePresetId {
  const value = getElement<HTMLSelectElement>("stability-sequence-select").value
  return STABILITY_SEQUENCE_IDS.includes(value as StabilitySequencePresetId)
    ? (value as StabilitySequencePresetId)
    : STABILITY_SEQUENCE_IDS[0]
}

function readSelectedStabilityTargetPresetIds(): StabilityTargetPresetId[] {
  const values: StabilityTargetPresetId[] = []
  if (getElement<HTMLInputElement>("stability-target-5-input").checked) {
    values.push("5each")
  }
  if (getElement<HTMLInputElement>("stability-target-8-input").checked) {
    values.push("8each")
  }
  if (getElement<HTMLInputElement>("stability-target-10-input").checked) {
    values.push("10each")
  }
  return values
}

function addCurrentAnalysisToStabilityHistory(): void {
  if (!state.analysis) {
    return
  }
  appendStabilityHistoryFromAnalysis(state.analysis)
  renderCandidateStabilityDebug()
  state.analysis.candidateStabilityDebug = buildCandidateStabilityDebug()
  getElement("json-preview").textContent = JSON.stringify(createSummaryAnalysis(state.analysis), null, 2)
}

function clearStabilityHistory(): void {
  state.stabilityHistory = []
  if (state.analysis) {
    state.analysis.candidateStabilityDebug = buildCandidateStabilityDebug()
    getElement("json-preview").textContent = JSON.stringify(createSummaryAnalysis(state.analysis), null, 2)
  }
  renderCandidateStabilityDebug()
}

function appendStabilityHistoryFromAnalysis(analysis: AnalysisResult): void {
  const summary = analysis.autoSequenceSummary
  if (!summary) {
    return
  }
  const finalStep = summary.steps.at(-1)
  const bestCandidate = analysis.bestCandidate
  const entry: StabilityHistoryEntry = {
    id: `${Date.now()}-${state.stabilityHistory.length + 1}`,
    generatedAt: new Date().toISOString(),
    bucketTargetPresetName: getCurrentBucketTargetPresetName(analysis.searchSettings),
    requestedBucketTargets: pickRequestedBucketTargets(analysis.searchSettings.targets),
    actualSelectedFrameSummary: {
      selectedFrameCount: analysis.selectedFrameSummary.selectedFrameCount,
      bucketCounts: { ...analysis.selectedFrameSummary.bucketCounts },
      shortage: buildBucketTargetShortage(
        analysis.searchSettings.targets,
        analysis.sourceSummary.bucketCounts,
        analysis.selectedFrameSummary.bucketCounts,
      ),
    },
    sequenceName: summary.sequenceName,
    objectiveMode: summary.finalObjectiveMode ?? analysis.searchSettings.objectiveMode,
    finalCandidate: summary.finalCandidate ? cloneCandidate(summary.finalCandidate) : null,
    scores: {
      objectiveScore: summary.finalObjectiveScore ?? null,
      totalScore: finalStep?.totalScore ?? bestCandidate?.totalScore ?? null,
      balancedScore:
        finalStep?.scoreDebug?.balancedScore ?? bestCandidate?.scoreDebug?.balancedScore ?? null,
      maxBucketScore:
        finalStep?.scoreDebug?.maxBucketScore ?? bestCandidate?.scoreDebug?.maxBucketScore ?? null,
      pitchAverageScore:
        finalStep?.scoreDebug?.pitchAverageScore ?? bestCandidate?.scoreDebug?.pitchAverageScore ?? null,
      yawAverageScore:
        finalStep?.scoreDebug?.yawAverageScore ?? bestCandidate?.scoreDebug?.yawAverageScore ?? null,
    },
    worstBucket: bestCandidate ? getWorstBucket(bestCandidate.bucketScores) : null,
    outlierSummary: buildStabilityOutlierSummary(bestCandidate?.outlierDebug ?? null),
    depthRelationSummary: buildDepthRelationSummary(
      analysis.depthRelationDebug,
      bestCandidate?.depthRelationDebug,
    ),
  }

  state.stabilityHistory = [...state.stabilityHistory, entry]
  analysis.candidateStabilityDebug = buildCandidateStabilityDebug()
}

function buildStabilityOutlierSummary(
  outlierDebug: CandidateOutlierDebug | null | undefined,
): StabilityOutlierSummary | undefined {
  if (!outlierDebug) {
    return undefined
  }
  return {
    enabled: outlierDebug.settings.enabled,
    mode: outlierDebug.settings.mode,
    totalOutlierFrameCount: outlierDebug.outlierFrames.length,
    outlierFrameCountsByBucket: countOutlierFramesByBucket(outlierDebug.outlierFrames),
    outlierFrames: outlierDebug.outlierFrames,
    rawScores: outlierDebug.rawScores,
    filteredScores: outlierDebug.filteredScores,
  }
}

function buildDepthRelationSummary(
  analysisDebug: AnalysisDepthRelationDebug | null | undefined,
  candidateDebug: DepthRelationDebug | null | undefined,
): DepthRelationSummary | undefined {
  const settings = analysisDebug?.settings ?? candidateDebug?.settings
  if (!settings) {
    return undefined
  }
  return {
    enabled: settings.enabled,
    mode: settings.mode,
    violationCount: candidateDebug?.violationCount ?? 0,
    hardRejectViolationCount: candidateDebug?.hardRejectViolationCount ?? 0,
    rejectedCandidateCount: analysisDebug?.rejectedCandidateCount ?? 0,
    finalCandidatePassed: candidateDebug ? candidateDebug.hardRejectViolationCount === 0 : false,
    finalCandidatePenalty: candidateDebug?.penalty ?? 0,
  }
}

function summarizeDepthRelationFilteringSettings(
  settings: DepthRelationFilteringSettings,
): DepthRelationFilteringSummary {
  const normalized = normalizeDepthRelationFilteringSettings(settings)
  return {
    enabled: normalized.enabled,
    mode: normalized.mode,
    applyToObjectiveScore: normalized.applyToObjectiveScore,
    ruleCount: normalized.rules.length,
  }
}

function attachDepthRelationToCandidate(
  candidate: FittingCandidate8,
  depthRelationDebug: DepthRelationDebug | undefined,
): FittingCandidate8WithDepthRelation {
  return depthRelationDebug ? { ...candidate, depthRelationDebug } : candidate
}

function buildCandidateStabilityDebug(): CandidateStabilityDebug {
  return {
    history: state.stabilityHistory,
    summaries: buildStabilitySummaries(state.stabilityHistory),
  }
}

function pickRequestedBucketTargets(
  targets: Record<CaptureBucket, number>,
): Record<RequestedBucketTarget, number> {
  return Object.fromEntries(
    REQUESTED_BUCKET_TARGETS.map((bucket) => [bucket, targets[bucket] ?? 0]),
  ) as Record<RequestedBucketTarget, number>
}

function buildBucketTargetShortage(
  requestedTargets: Record<CaptureBucket, number>,
  availableCounts: Record<CaptureBucket, number>,
  selectedCounts: Record<CaptureBucket, number>,
): BucketTargetShortage[] | undefined {
  const shortage = BUCKETS.flatMap((bucket) => {
    const required = requestedTargets[bucket] ?? 0
    if (required <= 0) {
      return []
    }
    const available = availableCounts[bucket] ?? 0
    const selected = selectedCounts[bucket] ?? 0
    return available < required || selected < required
      ? [{ bucket, required, available, selected }]
      : []
  })
  return shortage.length > 0 ? shortage : undefined
}

function getWorstBucket(bucketScores: PoseBucketScores): { bucket: CaptureBucket; score: number } | null {
  const entries = Object.entries(bucketScores).filter(
    (entry): entry is [CaptureBucket, number] =>
      typeof entry[1] === "number" && Number.isFinite(entry[1]),
  )
  if (entries.length === 0) {
    return null
  }
  const [bucket, score] = entries.reduce((worst, current) =>
    current[1] > worst[1] ? current : worst,
  )
  return { bucket, score: round(score) }
}

function buildStabilitySummaries(history: StabilityHistoryEntry[]): StabilitySummary[] {
  const sequenceNames = [...new Set(history.map((entry) => entry.sequenceName))]
  return sequenceNames.map((sequenceName) => {
    const entries = history.filter((entry) => entry.sequenceName === sequenceName)
    const candidateDrift = {
      rotationCenterYRange: valueRange(entries.map((entry) => getHistoryRotationCenter(entry)?.y ?? null)),
      rotationCenterZRange: valueRange(entries.map((entry) => getHistoryRotationCenter(entry)?.z ?? null)),
      noseZRange: valueRange(entries.map((entry) => entry.finalCandidate?.zByPointId.nose ?? null)),
      leftCheekZRange: valueRange(entries.map((entry) => entry.finalCandidate?.zByPointId.leftCheek ?? null)),
      rightCheekZRange: valueRange(entries.map((entry) => entry.finalCandidate?.zByPointId.rightCheek ?? null)),
    }
    const scoreDrift = {
      totalScoreRange: valueRange(entries.map((entry) => entry.scores.totalScore)),
      balancedScoreRange: valueRange(entries.map((entry) => entry.scores.balancedScore)),
      maxBucketScoreRange: valueRange(entries.map((entry) => entry.scores.maxBucketScore)),
      pitchAverageScoreRange: valueRange(entries.map((entry) => entry.scores.pitchAverageScore)),
      yawAverageScoreRange: valueRange(entries.map((entry) => entry.scores.yawAverageScore)),
    }
    return {
      sequenceName,
      entries,
      candidateDrift,
      scoreDrift,
      interpretation: buildStabilityInterpretation(candidateDrift, scoreDrift, entries),
    }
  })
}

function buildStabilityInterpretation(
  candidateDrift: StabilitySummary["candidateDrift"],
  scoreDrift: StabilitySummary["scoreDrift"],
  entries: StabilityHistoryEntry[],
): { isStableCandidate: boolean; notes: string[] } {
  const notes: string[] = []
  const isStableCandidate =
    (candidateDrift?.rotationCenterYRange ?? Number.POSITIVE_INFINITY) <= 0.04 &&
    (candidateDrift?.rotationCenterZRange ?? Number.POSITIVE_INFINITY) <= 0.03 &&
    (candidateDrift?.noseZRange ?? Number.POSITIVE_INFINITY) <= 0.03 &&
    (scoreDrift?.maxBucketScoreRange ?? Number.POSITIVE_INFINITY) <= 0.01

  notes.push(
    isStableCandidate
      ? "debug基準では候補は安定しています。"
      : "debug基準では候補の揺れが大きい可能性があります。",
  )
  if (entries.some((entry) => (entry.actualSelectedFrameSummary.shortage?.length ?? 0) > 0)) {
    notes.push("bucket target に対して不足している bucket があります。")
  }
  notes.push("production採用判定ではなく、候補安定性確認用の簡易判定です。")
  return { isStableCandidate, notes }
}

function getHistoryRotationCenter(entry: StabilityHistoryEntry): RotationCenter | null {
  return entry.finalCandidate ? getCandidateRotationCenter(entry.finalCandidate) : null
}

function valueRange(values: Array<number | null | undefined>): number | null {
  const finite = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value))
  if (finite.length < 2) {
    return null
  }
  return round(Math.max(...finite) - Math.min(...finite))
}

function applyCommonPresetSettings(): void {
  state.coordinateDescentParameterOrder = [...DEFAULT_COORDINATE_DESCENT_PARAMETER_ORDER]
}

function renderPresetMessage(): void {
  getElement("preset-message").textContent =
    state.presetMessage ??
    "Search Preset を選び、Apply Preset で local search 設定をフォームへ反映します。"
}

function findSearchPreset(value: string): SearchPresetDefinition {
  return (
    SEARCH_PRESETS.find((preset) => preset.id === value) ??
    SEARCH_PRESETS[0]
  )
}

function findAutoSequence(value: string): AutoSequenceDefinition {
  return (
    AUTO_SEQUENCE_PRESETS.find((sequence) => sequence.id === value) ??
    AUTO_SEQUENCE_PRESETS[0]
  )
}

function isObjectiveMode(value: string): value is ObjectiveMode {
  return OBJECTIVE_MODES.includes(value as ObjectiveMode)
}

function readBaseCandidatePresetId(value: string): BaseCandidatePresetId {
  return value === "currentFineBest" ||
    value === "currentBestCandidate" ||
    value === "rotationCenterDebugBest" ||
    value === "naturalNoseWithRotationCenter"
    ? value
    : "baselineCheekDepth"
}

function getBaseCandidatePreset(
  presetId: BaseCandidatePresetId,
): FittingCandidate8 | null {
  if (presetId === "currentFineBest") {
    return cloneCandidate(CURRENT_FINE_BEST_CANDIDATE)
  }
  if (presetId === "currentBestCandidate") {
    return state.analysis?.bestCandidate
      ? cloneCandidate(state.analysis.bestCandidate)
      : null
  }
  if (presetId === "rotationCenterDebugBest") {
    return cloneCandidate(ROTATION_CENTER_DEBUG_BEST)
  }
  if (presetId === "naturalNoseWithRotationCenter") {
    return cloneCandidate(NATURAL_NOSE_WITH_ROTATION_CENTER)
  }
  return cloneCandidate(BASELINE_CHEEK_DEPTH_CANDIDATE)
}

function formatBaseCandidatePresetLabel(presetId: BaseCandidatePresetId): string {
  if (presetId === "currentFineBest") {
    return "Current Fine Best"
  }
  if (presetId === "currentBestCandidate") {
    return "Current bestCandidate"
  }
  if (presetId === "rotationCenterDebugBest") {
    return "Rotation Center Debug Best"
  }
  if (presetId === "naturalNoseWithRotationCenter") {
    return "Natural Nose With Rotation Center"
  }
  return "Baseline Cheek Depth"
}

function cloneLocalSearchRanges(ranges: LocalSearchRanges): LocalSearchRanges {
  return Object.fromEntries(
    LOCAL_SEARCH_PARAMETERS.map((parameter) => [
      parameter,
      { ...ranges[parameter] },
    ]),
  ) as LocalSearchRanges
}

function cloneCandidate(candidate: FittingCandidate8): FittingCandidate8 {
  const next: FittingCandidate8 = {
    pivotZ: round(candidate.pivotZ),
    zByPointId: roundRecord(candidate.zByPointId),
  }
  if (candidate.rotationCenter) {
    next.rotationCenter = roundRotationCenter(candidate.rotationCenter)
    next.pivotZ = next.rotationCenter.z
  }
  return next
}

function getCandidateRotationCenter(candidate: FittingCandidate8): RotationCenter {
  return candidate.rotationCenter
    ? roundRotationCenter(candidate.rotationCenter)
    : { x: 0, y: 0, z: round(candidate.pivotZ) }
}

function roundRotationCenter(rotationCenter: RotationCenter): RotationCenter {
  return {
    x: round(rotationCenter.x),
    y: round(rotationCenter.y),
    z: round(rotationCenter.z),
  }
}

function writeNumberInput(id: string, value: number): void {
  getElement<HTMLInputElement>(id).value = String(value)
}

function writeSelectValue(id: string, value: string): void {
  getElement<HTMLSelectElement>(id).value = value
}

function readLocalSearchParameter(
  value: string,
  fallback: LocalSearchParameter,
): LocalSearchParameter {
  return LOCAL_SEARCH_PARAMETERS.includes(value as LocalSearchParameter)
    ? (value as LocalSearchParameter)
    : fallback
}

function extractCaptures(payload: unknown): CaptureRecord[] {
  if (Array.isArray(payload)) {
    return payload.map(normalizeCaptureShape)
  }

  if (isRecord(payload) && Array.isArray(payload.captures)) {
    return payload.captures.map(normalizeCaptureShape)
  }

  throw new Error("captures 配列が見つかりません。")
}

function normalizeCaptureShape(value: unknown): CaptureRecord {
  if (!isRecord(value)) {
    throw new Error("capture record が object ではありません。")
  }

  const landmarks = Array.isArray(value.landmarks)
    ? value.landmarks.map((landmark, index) => normalizeLandmark(landmark, index))
    : []

  return {
    captureId: String(value.captureId ?? value.id ?? `capture_${Math.random().toString(16).slice(2)}`),
    videoWidth: toNumber(value.videoWidth, 0),
    videoHeight: toNumber(value.videoHeight, 0),
    landmarks,
    pose: normalizePose(value.pose),
    bucket: String(value.bucket ?? "unknown"),
    blendshapes: Array.isArray(value.blendshapes)
      ? value.blendshapes.map(normalizeBlendshape)
      : [],
    facialTransformationMatrix: isRecord(value.facialTransformationMatrix)
      ? (value.facialTransformationMatrix as MatrixCapture)
      : null,
    warnings: Array.isArray(value.warnings) ? value.warnings.map(String) : [],
  }
}

function normalizeFrame(capture: CaptureRecord, settings: SearchSettings): NormalizedFrame {
  const bucket = normalizeBucket(capture.bucket)
  const videoWidth = capture.videoWidth > 0 ? capture.videoWidth : 1
  const videoHeight = capture.videoHeight > 0 ? capture.videoHeight : 1
  const aspectRatio = videoWidth / videoHeight
  const pose = capture.pose ?? { yaw: 0, pitch: 0, roll: 0 }
  const bounds = calculateLandmarkBounds(capture.landmarks, aspectRatio)
  const semanticPoints = extractSemanticPoints2D(capture.landmarks, aspectRatio)
  const warnings = [...(capture.warnings ?? [])]

  if (capture.landmarks.length !== 478) {
    warnings.push(`${capture.captureId}: landmarks が 478 点ではありません (${capture.landmarks.length})。`)
  }
  if (!capture.pose) {
    warnings.push(`${capture.captureId}: pose がないため yaw/pitch/roll を 0 として扱います。`)
  }
  if (!semanticPoints) {
    warnings.push(`${capture.captureId}: 8 semantic points をすべて取得できません。`)
  }
  if (Math.abs(pose.roll) > settings.rollWarningDeg) {
    warnings.push(`${capture.captureId}: roll が大きいため alignment 評価に注意が必要です (${formatNumber(pose.roll)} deg)。`)
  }
  const maxBlendshape = Math.max(0, ...capture.blendshapes!.map((item) => item.score))
  if (maxBlendshape > settings.blendshapeWarningScore) {
    warnings.push(`${capture.captureId}: blendshape score が高めです (${formatNumber(maxBlendshape)})。`)
  }

  return {
    captureId: capture.captureId,
    bucket,
    rawBucket: capture.bucket,
    videoWidth,
    videoHeight,
    aspectRatio,
    landmarks: capture.landmarks,
    pose,
    blendshapes: capture.blendshapes ?? [],
    semanticPoints,
    bounds,
    warnings,
  }
}

function selectFrames(
  frames: NormalizedFrame[],
  settings: SearchSettings,
): { frames: NormalizedFrame[]; summary: SelectedFrameSummary } {
  const usableFrames = frames.filter((frame) => frame.semanticPoints && frame.bounds)
  const selected: NormalizedFrame[] = []
  const includeMixedPose = settings.includeMixedPose && settings.targets.mixedPose > 0
  const bucketOrder = includeMixedPose
    ? [...REQUIRED_BUCKETS, "mixedPose" as CaptureBucket]
    : REQUIRED_BUCKETS

  for (const bucket of bucketOrder) {
    const target = settings.targets[bucket] ?? 0
    const bucketFrames = usableFrames.filter((frame) => frame.bucket === bucket).slice(0, target)
    selected.push(...bucketFrames)
  }

  const capped = selected.slice(0, settings.maxFrames)
  const bucketCounts = countFrameBuckets(capped)
  const warnings: string[] = []

  for (const bucket of REQUIRED_BUCKETS) {
    if (bucketCounts[bucket] < Math.min(settings.targets[bucket], 1)) {
      warnings.push(`${bucket} bucket の selected frame が不足しています。`)
    }
    if (bucketCounts[bucket] < settings.targets[bucket]) {
      warnings.push(
        `${bucket} bucket target が不足しています: required ${settings.targets[bucket]}, selected ${bucketCounts[bucket]}`,
      )
    }
  }

  return {
    frames: capped,
    summary: {
      selectedFrameCount: capped.length,
      bucketCounts,
      selectedCaptureIds: capped.map((frame) => frame.captureId),
      warnings,
    },
  }
}

function buildBase8Points2D(frames: NormalizedFrame[]): Base8Points2DSummary {
  const frontFrames = frames.filter((frame) => frame.bucket === "front" && frame.semanticPoints && frame.bounds)

  if (frontFrames.length === 0) {
    return {
      sourceFrameCount: 0,
      bounds: null,
      points: null,
      semanticIndexDebug: buildSemanticIndexDebug(),
    }
  }

  const boundsCenter = averagePoint2D(
    frontFrames.map((frame) => ({
      x: frame.bounds!.centerX,
      y: frame.bounds!.centerY,
    })),
  )
  const points = {} as SemanticPointSet2D

  for (const name of SEMANTIC_POINT_NAMES) {
    const average = averagePoint2D(frontFrames.map((frame) => frame.semanticPoints![name]))
    points[name] = {
      name,
      x: average.x - boundsCenter.x,
      y: average.y - boundsCenter.y,
    }
  }

  return {
    sourceFrameCount: frontFrames.length,
    bounds: calculateBounds2D(Object.values(points)),
    points,
    semanticIndexDebug: buildSemanticIndexDebug(),
  }
}

function buildCurrent8Debug(
  frames: NormalizedFrame[],
  settings: SearchSettings,
): Current8DebugSummary {
  const frameDebug = frames
    .map((frame) => buildCurrent8FrameDebug(frame, settings))
    .filter((item): item is Current8FrameDebug => Boolean(item))
  const current8BucketSummary = buildCurrent8BucketSummary(frameDebug)
  const current8PoseComparison = buildCurrent8PoseComparison(current8BucketSummary)
  const current8Warnings = buildCurrent8Warnings(
    frameDebug,
    current8BucketSummary,
    current8PoseComparison,
    settings,
  )

  return {
    selectedFrameCount: frames.length,
    coordinateSpace: CURRENT8_COORDINATE_SPACE,
    current8PointsByFrame: frameDebug.map(
      ({
        captureId,
        bucket,
        rawBucket,
        pose,
        videoWidth,
        videoHeight,
        coordinateSpace,
        points,
        sameUnitPoints,
        rawImageNormalizedPoints,
      }) => ({
        captureId,
        bucket,
        rawBucket,
        pose,
        videoWidth,
        videoHeight,
        coordinateSpace,
        points,
        sameUnitPoints,
        rawImageNormalizedPoints,
      }),
    ),
    current8BoundsByFrame: frameDebug.map(({ captureId, bucket, pose, bounds }) => ({
      captureId,
      bucket,
      pose,
      bounds,
    })),
    current8MetricsByFrame: frameDebug.map(({ captureId, bucket, pose, metrics, warnings }) => ({
      captureId,
      bucket,
      pose,
      metrics,
      warnings,
    })),
    current8BucketSummary,
    current8PoseComparison,
    current8Warnings,
  }
}

function buildCurrent8FrameDebug(
  frame: NormalizedFrame,
  settings: SearchSettings,
): Current8FrameDebug | null {
  const sameUnitPoints = frame.semanticPoints
  const rawImageNormalizedPoints = extractRawSemanticPoints2D(frame.landmarks)
  if (!sameUnitPoints || !rawImageNormalizedPoints) {
    return null
  }
  const bounds = calculateBounds2DWithAspectRatio(Object.values(sameUnitPoints))
  const metrics = calculateCurrent8Metrics(sameUnitPoints, bounds)
  const warnings: string[] = []
  if (Math.abs(frame.pose.roll) > settings.rollWarningDeg) {
    warnings.push(
      `current8LargeRollFrame: ${frame.captureId} roll=${formatNumber(frame.pose.roll)}`,
    )
  }
  const maxBlendshape = Math.max(0, ...frame.blendshapes.map((item) => item.score))
  if (maxBlendshape > settings.blendshapeWarningScore) {
    warnings.push(
      `current8HighBlendshapeFrame: ${frame.captureId} maxBlendshape=${formatNumber(maxBlendshape)}`,
    )
  }

  return {
    captureId: frame.captureId,
    bucket: frame.bucket,
    rawBucket: frame.rawBucket,
    pose: roundPose(frame.pose),
    videoWidth: frame.videoWidth,
    videoHeight: frame.videoHeight,
    coordinateSpace: CURRENT8_COORDINATE_SPACE,
    points: roundSemanticPointSet(sameUnitPoints),
    sameUnitPoints: roundSemanticPointSet(sameUnitPoints),
    rawImageNormalizedPoints: roundSemanticPointSet(rawImageNormalizedPoints),
    bounds: roundBounds2DWithAspectRatio(bounds),
    metrics: roundCurrent8Metrics(metrics),
    warnings,
  }
}

function extractRawSemanticPoints2D(landmarks: LandmarkPoint[]): SemanticPointSet2D | null {
  const points = {} as SemanticPointSet2D
  for (const definition of SEMANTIC_DEFINITIONS) {
    const point =
      averageByIndices(landmarks, definition.primaryIndices) ??
      (definition.fallbackIndices ? averageByIndices(landmarks, definition.fallbackIndices) : null)
    if (!point) {
      return null
    }
    points[definition.name] = {
      name: definition.name,
      x: point.x,
      y: point.y,
    }
  }
  return points
}

function calculateBounds2DWithAspectRatio(points: Point2[]): Bounds2DWithAspectRatio {
  const bounds = calculateBounds2D(points)
  return {
    ...bounds,
    aspectRatio: bounds.height > EPSILON ? bounds.width / bounds.height : 0,
  }
}

function calculateCurrent8Metrics(
  points: SemanticPointSet2D,
  bounds: Bounds2DWithAspectRatio,
): Current8Metrics {
  const eyeCenterX = (points.leftEye.x + points.rightEye.x) / 2
  return {
    aspectRatio: bounds.aspectRatio,
    eyeDistance: distance2D(points.leftEye, points.rightEye),
    cheekWidth: Math.abs(points.rightCheek.x - points.leftCheek.x),
    noseToEyeCenterX: points.nose.x - eyeCenterX,
    noseToMouthY: points.mouth.y - points.nose.y,
    noseX: points.nose.x,
    mouthX: points.mouth.x,
    leftCheekX: points.leftCheek.x,
    rightCheekX: points.rightCheek.x,
    leftEyeX: points.leftEye.x,
    rightEyeX: points.rightEye.x,
  }
}

function buildCurrent8BucketSummary(
  frames: Current8FrameDebug[],
): Record<CaptureBucket, Current8BucketSummaryEntry> {
  return Object.fromEntries(
    BUCKETS.map((bucket) => {
      const bucketFrames = frames.filter((frame) => frame.bucket === bucket)
      return [bucket, summarizeCurrent8Bucket(bucketFrames)]
    }),
  ) as Record<CaptureBucket, Current8BucketSummaryEntry>
}

function summarizeCurrent8Bucket(frames: Current8FrameDebug[]): Current8BucketSummaryEntry {
  const aspectRatios = frames.map((frame) => frame.metrics.aspectRatio)
  return {
    sampleCount: frames.length,
    averageBounds: averageCurrent8Bounds(frames),
    averageAspectRatio: roundNullable(average(aspectRatios)),
    minAspectRatio: roundNullable(min(aspectRatios)),
    maxAspectRatio: roundNullable(max(aspectRatios)),
    averageEyeDistance: roundNullable(average(frames.map((frame) => frame.metrics.eyeDistance))),
    averageCheekWidth: roundNullable(average(frames.map((frame) => frame.metrics.cheekWidth))),
    averageNoseX: roundNullable(average(frames.map((frame) => frame.metrics.noseX))),
    averagePointPositions: averageCurrent8PointPositions(frames),
  }
}

function averageCurrent8Bounds(frames: Current8FrameDebug[]): Bounds2DWithAspectRatio | null {
  if (frames.length === 0) {
    return null
  }
  return roundBounds2DWithAspectRatio({
    xMin: average(frames.map((frame) => frame.bounds.xMin)) ?? 0,
    xMax: average(frames.map((frame) => frame.bounds.xMax)) ?? 0,
    yMin: average(frames.map((frame) => frame.bounds.yMin)) ?? 0,
    yMax: average(frames.map((frame) => frame.bounds.yMax)) ?? 0,
    width: average(frames.map((frame) => frame.bounds.width)) ?? 0,
    height: average(frames.map((frame) => frame.bounds.height)) ?? 0,
    centerX: average(frames.map((frame) => frame.bounds.centerX)) ?? 0,
    centerY: average(frames.map((frame) => frame.bounds.centerY)) ?? 0,
    aspectRatio: average(frames.map((frame) => frame.bounds.aspectRatio)) ?? 0,
  })
}

function averageCurrent8PointPositions(
  frames: Current8FrameDebug[],
): Record<SemanticPointName, Point2 | null> {
  return Object.fromEntries(
    SEMANTIC_POINT_NAMES.map((name) => {
      if (frames.length === 0) {
        return [name, null]
      }
      return [
        name,
        {
          x: round(average(frames.map((frame) => frame.points[name].x)) ?? 0),
          y: round(average(frames.map((frame) => frame.points[name].y)) ?? 0),
        },
      ]
    }),
  ) as Record<SemanticPointName, Point2 | null>
}

function buildCurrent8PoseComparison(
  summary: Record<CaptureBucket, Current8BucketSummaryEntry>,
): Current8PoseComparison {
  const frontAspectRatio = summary.front.averageAspectRatio
  const yawPositiveAspectRatio = summary.yawPositive.averageAspectRatio
  const yawNegativeAspectRatio = summary.yawNegative.averageAspectRatio
  const yawPositiveRatio = safeRatio(yawPositiveAspectRatio, frontAspectRatio)
  const yawNegativeRatio = safeRatio(yawNegativeAspectRatio, frontAspectRatio)

  return {
    frontAspectRatio,
    yawPositiveAspectRatio,
    yawNegativeAspectRatio,
    yawPositiveAspectRatioRatioToFront: yawPositiveRatio,
    yawNegativeAspectRatioRatioToFront: yawNegativeRatio,
    frontCheekWidth: summary.front.averageCheekWidth,
    yawPositiveCheekWidth: summary.yawPositive.averageCheekWidth,
    yawNegativeCheekWidth: summary.yawNegative.averageCheekWidth,
    frontEyeDistance: summary.front.averageEyeDistance,
    yawPositiveEyeDistance: summary.yawPositive.averageEyeDistance,
    yawNegativeEyeDistance: summary.yawNegative.averageEyeDistance,
    interpretation: {
      yawPositiveLooksNarrowerThanFront:
        yawPositiveRatio === null ? null : yawPositiveRatio < 1,
      yawNegativeLooksNarrowerThanFront:
        yawNegativeRatio === null ? null : yawNegativeRatio < 1,
    },
  }
}

function buildCurrent8Warnings(
  frames: Current8FrameDebug[],
  summary: Record<CaptureBucket, Current8BucketSummaryEntry>,
  poseComparison: Current8PoseComparison,
  settings: SearchSettings,
): string[] {
  const warnings: string[] = []
  if (
    poseComparison.yawPositiveAspectRatioRatioToFront === null ||
    poseComparison.yawNegativeAspectRatioRatioToFront === null
  ) {
    warnings.push("current8YawAspectRatioMissing: front / yawPositive / yawNegative の比較に必要な selected frame が不足しています。")
  }
  if (
    poseComparison.interpretation.yawPositiveLooksNarrowerThanFront ||
    poseComparison.interpretation.yawNegativeLooksNarrowerThanFront
  ) {
    warnings.push("current8YawNarrowerThanFront: 横向き bucket の current 8 points が front より細く見えます。")
  }
  for (const bucket of BUCKETS) {
    if (summary[bucket].sampleCount === 0) {
      warnings.push(`current8BucketInsufficientFrames: ${bucket} bucket の current 8 debug sample がありません。`)
    }
  }
  for (const frame of frames) {
    if (Math.abs(frame.pose.roll) > settings.rollWarningDeg) {
      warnings.push(`current8LargeRollFrame: ${frame.captureId}`)
    }
    if (frame.warnings.some((warning) => warning.startsWith("current8HighBlendshapeFrame"))) {
      warnings.push(`current8HighBlendshapeFrame: ${frame.captureId}`)
    }
  }
  return Array.from(new Set(warnings))
}

function createCurrent8FrameSample(
  frames: Current8FrameDebug[],
  maxPerBucket = 2,
): Current8FrameDebug[] {
  return BUCKETS.flatMap((bucket) =>
    frames.filter((frame) => frame.bucket === bucket).slice(0, maxPerBucket),
  )
}

function createNumericCandidates(minValue: number, maxValue: number, stepValue: number): number[] {
  const minCandidate = Math.min(minValue, maxValue)
  const maxCandidate = Math.max(minValue, maxValue)
  const step = Math.max(Math.abs(stepValue), EPSILON)
  const candidates: number[] = []

  for (
    let value = minCandidate, guard = 0;
    value <= maxCandidate + step * 0.5 && guard < 10000;
    value += step, guard += 1
  ) {
    candidates.push(round(value))
  }

  if (candidates.length === 0) {
    return [round(minCandidate)]
  }
  return Array.from(new Set(candidates))
}
function buildBestIdealFace8(
  basePoints: SemanticPointSet2D,
  candidate: CandidateDefinition,
): BestIdealFace8 {
  const points = SEMANTIC_POINT_NAMES.map((name) => {
    const z = candidate.zByPointId[name]
    return {
      name,
      x: round(basePoints[name].x),
      y: round(basePoints[name].y),
      z: round(z),
    }
  })

  return {
    schemaVersion: "ideal_face_fitting_lab_ideal_face_8_v1",
    coordinateSpace: "bae_ar_fitting_lab_8point_same_unit_v1",
    depthConvention: DEPTH_CONVENTION,
    source: {
      type: "best_candidate",
      pivotZ: round(candidate.pivotZ),
      rotationCenter: getCandidateRotationCenter(candidate),
      zApplication:
        "points[].z は candidate.zByPointId の値です。rotationCenter は projection 用の回転中心として source に記録し、点の z には焼き込みません。",
    },
    metadata: {
      intendedNextStep: "interpolate_8point_depth_to_478_debug_candidate",
      semanticPointNames: [...SEMANTIC_POINT_NAMES],
      sourceBase2D: "front_bucket_average_same_unit",
      zSource: "candidate_8point_z_grid_search_best_candidate",
    },
    points,
    summary: summarizeIdealFace8(points),
  }
}

function summarizeIdealFace8(points: IdealFace8Point[]): IdealFace8Summary {
  const zValues = points.map((point) => point.z)
  const zMin = min(zValues)
  const zMax = max(zValues)
  const depthRelation = calculateDepthRelation(points)

  return {
    pointCount: points.length,
    bounds: points.length > 0 ? calculateBounds2D(points) : null,
    zMin,
    zMax,
    zRange: zMin === null || zMax === null ? 0 : round(zMax - zMin),
    noseZ: depthRelation.noseZ,
    leftCheekZ: depthRelation.leftCheekZ,
    rightCheekZ: depthRelation.rightCheekZ,
    averageCheekZ: depthRelation.averageCheekZ,
    noseIsInFrontOfCheeks: depthRelation.noseIsInFrontOfCheeks,
    depthRelation,
  }
}

function summarizeIdealFace8ForCandidate(points: IdealFace8Point[]): IdealFace8CandidateSummary {
  const summary = summarizeIdealFace8(points)
  return {
    pointCount: summary.pointCount,
    zRange: summary.zRange,
    noseZ: summary.noseZ,
    leftCheekZ: summary.leftCheekZ,
    rightCheekZ: summary.rightCheekZ,
    noseIsInFrontOfCheeks: summary.noseIsInFrontOfCheeks,
  }
}

function calculateDepthRelation(points: IdealFace8Point[]): DepthRelation {
  const byName = Object.fromEntries(points.map((point) => [point.name, point])) as Record<
    SemanticPointName,
    IdealFace8Point
  >
  const noseZ = byName.nose.z
  const leftCheekZ = byName.leftCheek.z
  const rightCheekZ = byName.rightCheek.z
  const averageCheekZ = (leftCheekZ + rightCheekZ) / 2

  return {
    noseZ: round(noseZ),
    leftCheekZ: round(leftCheekZ),
    rightCheekZ: round(rightCheekZ),
    averageCheekZ: round(averageCheekZ),
    noseIsInFrontOfCheeks: noseZ < leftCheekZ && noseZ < rightCheekZ,
    leftRightCheekZDelta: round(Math.abs(leftCheekZ - rightCheekZ)),
    leftRightEyeZDelta: round(Math.abs(byName.leftEye.z - byName.rightEye.z)),
  }
}

function attachIdealFace8Summary(
  entry: RankingEntry,
  basePoints: SemanticPointSet2D | null,
): RankingEntry {
  if (!basePoints) {
    return entry
  }
  const candidate: CandidateDefinition = {
    candidateId: entry.candidateId,
    zByPointId: entry.candidate.zByPointId,
    pivotZ: entry.candidate.pivotZ,
    rotationCenter: entry.candidate.rotationCenter,
  }
  const idealFace8 = buildBestIdealFace8(basePoints, candidate)
  return {
    ...entry,
    idealFace8Summary: summarizeIdealFace8ForCandidate(idealFace8.points),
  }
}

function createSummaryAnalysis(analysis: AnalysisResult): SummaryAnalysisResult {
  return {
    schemaVersion: "ideal_face_fitting_lab_analysis_summary_v1",
    analysisVersion: analysis.analysisVersion,
    generatedAt: analysis.generatedAt,
    lastRunType: analysis.lastRunType,
    sourceSummary: analysis.sourceSummary,
    selectedFrameSummary: analysis.selectedFrameSummary,
    semanticPointSet: analysis.semanticPointSet,
    base8Points2DSummary: analysis.base8Points2DSummary,
    baseSemanticPoints2DSummary: analysis.baseSemanticPoints2DSummary,
    current8BucketSummary: analysis.current8BucketSummary,
    current8PoseComparison: analysis.current8PoseComparison,
    current8FrameSample: createCurrent8FrameSample(
      analysis.current8Debug.current8PointsByFrame.map((pointsFrame) => {
        const boundsFrame = analysis.current8BoundsByFrame.find(
          (item) => item.captureId === pointsFrame.captureId,
        )
        const metricsFrame = analysis.current8MetricsByFrame.find(
          (item) => item.captureId === pointsFrame.captureId,
        )
        return {
          ...pointsFrame,
          bounds: boundsFrame?.bounds ?? calculateBounds2DWithAspectRatio(Object.values(pointsFrame.points)),
          metrics:
            metricsFrame?.metrics ??
            calculateCurrent8Metrics(
              pointsFrame.points,
              calculateBounds2DWithAspectRatio(Object.values(pointsFrame.points)),
            ),
          warnings: metricsFrame?.warnings ?? [],
        }
      }),
    ),
    depthConvention: analysis.depthConvention,
    searchMode: analysis.searchMode,
    searchSettings: analysis.searchSettings,
    depthRelationFiltering: analysis.depthRelationFiltering,
    localSearchSettings: analysis.localSearchSettings,
    localSearchSummary: analysis.localSearchSummary,
    scoreDebugSummary: analysis.scoreDebugSummary,
    processedCandidateCount: analysis.processedCandidateCount,
    estimatedCandidateCount: analysis.estimatedCandidateCount,
    rawRanking: analysis.rawRanking.slice(0, 20),
    depthFilteredRanking: analysis.depthFilteredRanking.slice(0, 20),
    topCandidates: analysis.topCandidates.slice(0, 20),
    bestCandidate: analysis.bestCandidate
      ? attachIdealFace8Summary(toRankingEntry(analysis.bestCandidate, 1), analysis.base8Points2DSummary.points)
      : null,
    bestIdealFace8: analysis.bestIdealFace8,
    depthRelation: analysis.depthRelation,
    depthRelationDebug: analysis.depthRelationDebug
      ? {
          ...analysis.depthRelationDebug,
          rejectedCandidates: analysis.depthRelationDebug.rejectedCandidates.slice(0, 20),
        }
      : undefined,
    bucketRanking: Object.fromEntries(
      BUCKETS.map((bucket) => [bucket, analysis.bucketRanking[bucket].slice(0, 5)]),
    ) as Record<CaptureBucket, RankingEntry[]>,
    perPointErrorSummary: analysis.perPointErrorSummary,
    projectionSignDebug: analysis.projectionSignDebug,
    rotationCenterDebug: analysis.rotationCenterDebug,
    outlierFrameDebug: analysis.outlierFrameDebug,
    autoSequenceSummary: analysis.autoSequenceSummary,
    autoSequenceSummaryFinalCandidate: analysis.autoSequenceSummary?.finalCandidate ?? null,
    autoSequenceStepCount: analysis.autoSequenceSummary?.steps.length ?? 0,
    candidateStabilityDebug: analysis.candidateStabilityDebug,
    depth478Prototype: analysis.depth478Prototype,
    warnings: analysis.warnings,
  }
}

async function copySummaryJson(): Promise<void> {
  if (!state.analysis) {
    return
  }
  await navigator.clipboard.writeText(JSON.stringify(createSummaryAnalysis(state.analysis), null, 2))
  state.copyMessage = "Summary JSON をコピーしました。"
  getElement("copy-message").textContent = state.copyMessage
}

function summarizeSource(payload: CapturesPayload | null, frames: NormalizedFrame[]): SourceSummary {
  const landmarkCounts = frames.map((frame) => frame.landmarks.length)
  return {
    schemaVersion: payload?.schemaVersion ?? null,
    captureCount: frames.length,
    bucketCounts: countFrameBuckets(frames),
    landmarkCount: {
      expected: 478,
      min: min(landmarkCounts),
      max: max(landmarkCounts),
      allExpected: landmarkCounts.every((count) => count === 478),
    },
    matrixAvailableCount: frames.filter((frame) => {
      const source = state.payload?.captures?.find((capture) => capture.captureId === frame.captureId)
      return Boolean(source?.facialTransformationMatrix)
    }).length,
    videoSizes: Array.from(new Set(frames.map((frame) => `${frame.videoWidth}x${frame.videoHeight}`))),
    poseRange: {
      yaw: range(frames.map((frame) => frame.pose.yaw)),
      pitch: range(frames.map((frame) => frame.pose.pitch)),
      roll: range(frames.map((frame) => frame.pose.roll)),
    },
  }
}

function renderSourceOnly(): void {
  const sourceSummary = summarizeSource(state.payload, state.frames)
  getElement("import-message").textContent = state.importMessage ?? ""
  getElement("copy-message").textContent = ""
  getElement("source-summary").innerHTML = renderStatusItems([
    ["file", state.fileName ?? "-"],
    ["schemaVersion", sourceSummary.schemaVersion ?? "-"],
    ["frame count", String(sourceSummary.captureCount)],
    ["bucket counts", formatBucketCounts(sourceSummary.bucketCounts)],
    [
      "landmarks",
      `${sourceSummary.landmarkCount.min ?? "-"} - ${sourceSummary.landmarkCount.max ?? "-"}`,
    ],
    ["video sizes", sourceSummary.videoSizes.join(", ") || "-"],
  ])
  getElement("base-summary").innerHTML = `<p class="empty">解析実行後に表示します。</p>`
  getElement("local-search-summary").innerHTML = `<p class="empty">解析実行後に表示します。</p>`
  getElement("current8-overview").innerHTML = `<p class="empty">解析実行後に表示します。</p>`
  getElement("current8-pose-comparison").innerHTML = `<p class="empty">解析実行後に表示します。</p>`
  getElement("current8-bucket-summary").innerHTML = `<p class="empty">解析実行後に表示します。</p>`
  getElement("current8-frame-table").innerHTML = `<p class="empty">解析実行後に表示します。</p>`
  getElement("ranking-table").innerHTML = `<p class="empty">解析実行後に表示します。</p>`
  getElement("result-summary").innerHTML = `<p class="empty">解析実行後に表示します。</p>`
  getElement("auto-sequence-result").innerHTML = `<p class="empty">Auto Sequence 実行後に表示します。</p>`
  getElement("best-candidate").innerHTML = `<p class="empty">解析実行後に表示します。</p>`
  renderOutlierFrameDebug(null, readSettings().outlierFiltering)
  renderDepthRelationDebug(null, readSettings().depthRelationFiltering)
  renderDepth478Prototype(null)
  renderProjectionSignDebug(null)
  renderRotationCenterDebug(null)
  renderBucketTargetWarning()
  renderCandidateStabilityDebug()
  getElement("best-ideal-face8-summary").innerHTML = `<p class="empty">解析実行後に表示します。</p>`
  getElement("best-ideal-face8-table").innerHTML = `<p class="empty">解析実行後に表示します。</p>`
  getElement("depth-relation").innerHTML = renderDepthConvention(DEPTH_CONVENTION)
  getElement("bucket-ranking").innerHTML = `<p class="empty">解析実行後に表示します。</p>`
  getElement("error-summary").innerHTML = `<p class="empty">解析実行後に表示します。</p>`
  getElement("warnings").textContent = state.frames.flatMap((frame) => frame.warnings).join("\n")
  getElement("json-preview").textContent = JSON.stringify(
    {
      importedFile: state.fileName,
      sourceSummary,
      depthConvention: DEPTH_CONVENTION,
      semanticIndexDebug: buildSemanticIndexDebug(),
    },
    null,
    2,
  )
  renderAutoSequenceStatus()
  renderQuick478DepthDebug()
}

function renderAnalysis(): void {
  if (!state.analysis) {
    renderEmptyState()
    return
  }

  const analysis = state.analysis
  getElement("import-message").textContent = state.importMessage ?? ""
  getElement("copy-message").textContent = state.copyMessage ?? ""
  getElement("source-summary").innerHTML = renderStatusItems([
    ["schemaVersion", analysis.sourceSummary.schemaVersion ?? "-"],
    ["frame count", String(analysis.sourceSummary.captureCount)],
    ["selected", String(analysis.selectedFrameSummary.selectedFrameCount)],
    ["bucket counts", formatBucketCounts(analysis.sourceSummary.bucketCounts)],
    ["selected buckets", formatBucketCounts(analysis.selectedFrameSummary.bucketCounts)],
    ["searchMode", analysis.searchMode],
    ["candidate count", String(analysis.candidateCount)],
    ["processed candidates", String(analysis.processedCandidateCount)],
    ["estimated candidates", String(analysis.estimatedCandidateCount)],
  ])
  getElement("result-summary").innerHTML = renderResultSummary(analysis)
  getElement("local-search-summary").innerHTML = renderLocalSearchSummary(analysis)
  getElement("base-summary").innerHTML = renderStatusItems([
    ["source frame count", String(analysis.base8Points2DSummary.sourceFrameCount)],
    ["bounds", formatBounds(analysis.base8Points2DSummary.bounds)],
    [
      "points",
      analysis.base8Points2DSummary.points
        ? SEMANTIC_POINT_NAMES.map(
            (name) => `${name}: ${formatNumber(analysis.base8Points2DSummary.points![name].x)}, ${formatNumber(analysis.base8Points2DSummary.points![name].y)}`,
          ).join(" / ")
        : "-",
    ],
    ["index", JSON.stringify(analysis.base8Points2DSummary.semanticIndexDebug)],
  ])
  getElement("current8-overview").innerHTML = renderCurrent8Overview(analysis.current8Debug)
  getElement("current8-pose-comparison").innerHTML = renderCurrent8PoseComparison(
    analysis.current8PoseComparison,
  )
  getElement("current8-bucket-summary").innerHTML = renderCurrent8BucketSummaryTable(
    analysis.current8BucketSummary,
  )
  getElement("current8-frame-table").innerHTML = renderCurrent8FrameTable(
    analysis.current8MetricsByFrame,
  )
  getElement("ranking-table").innerHTML = renderRankingTable(analysis.topCandidates.slice(0, 20))
  getElement("auto-sequence-result").innerHTML = renderAutoSequenceResult(analysis)
  getElement("best-candidate").innerHTML = analysis.bestCandidate
    ? renderStatusItems([
        ["candidateId", analysis.bestCandidate.candidateId],
        ["objectiveMode", analysis.bestCandidate.objectiveMode],
        ["objectiveScoreBeforeDepthFilter", formatNumber(analysis.bestCandidate.objectiveScoreBeforeDepthFilter)],
        ["objectiveScore", formatNumber(analysis.bestCandidate.objectiveScore)],
        ["totalScore", formatNumber(analysis.bestCandidate.totalScore)],
        ["weightedSemanticDistance", formatNumber(analysis.bestCandidate.weightedSemanticDistance)],
        ["frontScore", formatNumber(analysis.bestCandidate.bucketScores.front)],
        ["yawPositiveScore", formatNumber(analysis.bestCandidate.bucketScores.yawPositive)],
        ["yawNegativeScore", formatNumber(analysis.bestCandidate.bucketScores.yawNegative)],
        ["pitchPositiveScore", formatNumber(analysis.bestCandidate.bucketScores.pitchPositive)],
        ["pitchNegativeScore", formatNumber(analysis.bestCandidate.bucketScores.pitchNegative)],
        ["mixedPoseScore", formatNumber(analysis.bestCandidate.bucketScores.mixedPose)],
        ["yawAverageScore", formatNumber(analysis.bestCandidate.scoreDebug?.yawAverageScore)],
        ["pitchAverageScore", formatNumber(analysis.bestCandidate.scoreDebug?.pitchAverageScore)],
        ["maxBucketScore", formatNumber(analysis.bestCandidate.scoreDebug?.maxBucketScore)],
        ["balancedScore", formatNumber(analysis.bestCandidate.scoreDebug?.balancedScore)],
        ["depth violationCount", String(analysis.bestCandidate.depthRelationDebug?.violationCount ?? 0)],
        ["depth penalty", formatNumber(analysis.bestCandidate.depthRelationDebug?.penalty)],
        ["depth isRejected", String(analysis.bestCandidate.depthRelationDebug?.isRejected ?? false)],
        ["raw totalScore", formatNumber(analysis.bestCandidate.outlierDebug?.rawScores.totalScore)],
        ["filtered totalScore", formatNumber(analysis.bestCandidate.outlierDebug?.filteredScores?.totalScore)],
        ["raw maxBucketScore", formatNumber(analysis.bestCandidate.outlierDebug?.rawScores.scoreDebug.maxBucketScore)],
        ["filtered maxBucketScore", formatNumber(analysis.bestCandidate.outlierDebug?.filteredScores?.scoreDebug.maxBucketScore)],
        ["zByPointId", JSON.stringify(roundRecord(analysis.bestCandidate.zByPointId))],
        ["legacy pivotZ / rotationCenter.z", formatNumber(analysis.bestCandidate.pivotZ)],
        ["rotationCenter.x", formatNumber(getCandidateRotationCenter(analysis.bestCandidate).x)],
        ["rotationCenter.y", formatNumber(getCandidateRotationCenter(analysis.bestCandidate).y)],
        ["rotationCenter.z", formatNumber(getCandidateRotationCenter(analysis.bestCandidate).z)],
      ])
    : `<p class="empty">候補がありません。</p>`
  renderOutlierFrameDebug(analysis.outlierFrameDebug ?? null, analysis.searchSettings.outlierFiltering)
  renderDepthRelationDebug(analysis.depthRelationDebug ?? null, analysis.searchSettings.depthRelationFiltering)
  renderDepth478Prototype(analysis.depth478Prototype ?? null)
  renderProjectionSignDebug(analysis.projectionSignDebug ?? null)
  renderRotationCenterDebug(analysis.rotationCenterDebug ?? null)
  renderBucketTargetWarning()
  renderCandidateStabilityDebug()
  getElement("best-ideal-face8-summary").innerHTML = analysis.bestIdealFace8
    ? renderIdealFace8Summary(analysis.bestIdealFace8)
    : `<p class="empty">bestIdealFace8 はありません。</p>`
  getElement("best-ideal-face8-table").innerHTML = analysis.bestIdealFace8
    ? renderIdealFace8Table(analysis.bestIdealFace8.points)
    : `<p class="empty">bestIdealFace8 はありません。</p>`
  getElement("depth-relation").innerHTML = analysis.depthRelation
    ? renderDepthRelation(analysis.depthRelation, analysis.depthConvention)
    : renderDepthConvention(analysis.depthConvention)
  getElement("bucket-ranking").innerHTML = renderBucketRanking(analysis.bucketRanking)
  getElement("error-summary").innerHTML = renderStatusItems([
    ["perPointError", JSON.stringify(roundRecord(analysis.perPointErrorSummary))],
    [
      "bucketScores",
      analysis.bestCandidate ? JSON.stringify(roundRecord(analysis.bestCandidate.bucketScores)) : "-",
    ],
    [
      "scoreDebug",
      analysis.scoreDebugSummary ? JSON.stringify(roundScoreDebug(analysis.scoreDebugSummary)) : "-",
    ],
    [
      "outlierDebug",
      analysis.outlierFrameDebug?.bestCandidateOutliers
        ? JSON.stringify({
            totalOutlierFrames: analysis.outlierFrameDebug.bestCandidateOutliers.outlierFrames.length,
            rawTotalScore: analysis.outlierFrameDebug.bestCandidateOutliers.rawScores.totalScore,
            filteredTotalScore: analysis.outlierFrameDebug.bestCandidateOutliers.filteredScores?.totalScore ?? null,
            rawMaxBucketScore:
              analysis.outlierFrameDebug.bestCandidateOutliers.rawScores.scoreDebug.maxBucketScore,
            filteredMaxBucketScore:
              analysis.outlierFrameDebug.bestCandidateOutliers.filteredScores?.scoreDebug.maxBucketScore ?? null,
          })
        : "-",
    ],
    [
      "depthRelationDebug",
      analysis.depthRelationDebug
        ? JSON.stringify({
            rejectedCandidateCount: analysis.depthRelationDebug.rejectedCandidateCount,
            violationCount: analysis.bestCandidate?.depthRelationDebug?.violationCount ?? null,
            hardRejectViolationCount:
              analysis.bestCandidate?.depthRelationDebug?.hardRejectViolationCount ?? null,
            penalty: analysis.bestCandidate?.depthRelationDebug?.penalty ?? null,
          })
        : "-",
    ],
  ])
  getElement("warnings").textContent = analysis.warnings.length === 0 ? "警告はありません。" : analysis.warnings.join("\n")
  getElement("json-preview").textContent = JSON.stringify(createSummaryAnalysis(analysis), null, 2)
  renderAutoSequenceStatus()
  renderQuick478DepthDebug()
  setButtons()
}

function renderResultSummary(analysis: AnalysisResult): string {
  const autoSummary = analysis.autoSequenceSummary
  const autoFinalCandidate = autoSummary?.finalCandidate ?? null
  const isAutoResult =
    analysis.lastRunType === "autoSequence" || analysis.lastRunType === "stabilityCheck"
  return renderStatusItems([
    ["lastRunType", analysis.lastRunType],
    [
      "primary result",
      isAutoResult
        ? "autoSequenceSummary.finalCandidate"
        : "bestCandidate / last single search",
    ],
    ["autoSequenceStepCount", String(autoSummary?.steps.length ?? 0)],
    ["autoSequenceName", autoSummary?.sequenceName ?? "-"],
    ["autoSequenceStatus", autoSummary?.status ?? "-"],
    ["autoSequenceFinalObjectiveScore", formatNumber(autoSummary?.finalObjectiveScore)],
    ["depthRelationMode（奥行き関係モード）", analysis.depthRelationFiltering.mode],
    ["depthRelationEnabled（奥行き関係フィルタ有効）", String(analysis.depthRelationFiltering.enabled)],
    [
      "depthRelationApplyToObjectiveScore（ペナルティをスコアへ反映）",
      String(analysis.depthRelationFiltering.applyToObjectiveScore),
    ],
    ["depthRelationRuleCount（奥行き関係ルール数）", String(analysis.depthRelationFiltering.ruleCount)],
    ["depth rejectedCandidates（奥行き違反で除外された候補数）", String(analysis.depthRelationDebug?.rejectedCandidateCount ?? 0)],
    [
      "depth final passed（最終候補が奥行き関係を通過）",
      String((analysis.bestCandidate?.depthRelationDebug?.hardRejectViolationCount ?? 0) === 0),
    ],
    [
      "autoSequenceSummary.finalCandidate",
      autoFinalCandidate ? formatCandidateCompact(autoFinalCandidate) : "-",
    ],
    [
      "last single search bestCandidate",
      analysis.bestCandidate ? formatCandidateCompact(analysis.bestCandidate) : "-",
    ],
    [
      "note",
      isAutoResult
        ? "Auto Sequence 実行結果は autoSequenceSummary を確認してください。top-level の searchMode / localSearchSummary は最後に実行された単発 step の状態です。"
        : "単発検索結果です。",
    ],
  ])
}

function renderAutoSequenceResult(analysis: AnalysisResult): string {
  const summary = analysis.autoSequenceSummary
  if (!summary) {
    return `<p class="empty">Auto Sequence result はまだありません。</p>`
  }
  const finalStep = summary.steps.at(-1)
  return renderStatusItems([
    ["sequenceName", summary.sequenceName],
    ["status", summary.status],
    ["stepCount", String(summary.steps.length)],
    ["finalObjectiveMode（最終最適化モード）", summary.finalObjectiveMode ?? "-"],
    ["finalObjectiveScore（最終最適化スコア）", formatNumber(summary.finalObjectiveScore)],
    ["finalCandidate（最終8点候補）", summary.finalCandidate ? formatCandidateCompact(summary.finalCandidate) : "-"],
    ["final step preset（最終ステップのプリセット）", finalStep?.presetName ?? "-"],
    ["final step totalScore（最終ステップ全体スコア）", formatNumber(finalStep?.totalScore)],
    ["final step maxBucketScore（最終ステップ最悪姿勢スコア）", formatNumber(finalStep?.scoreDebug?.maxBucketScore)],
    ["final depth mode（最終ステップ奥行き関係モード）", finalStep?.depthRelationFiltering?.mode ?? "-"],
    [
      "final depth applyToObjectiveScore（最終ステップのペナルティ反映）",
      finalStep?.depthRelationFiltering
        ? String(finalStep.depthRelationFiltering.applyToObjectiveScore)
        : "-",
    ],
    ["final depth passed（最終候補が奥行き関係を通過）", String(finalStep?.depthRelationSummary?.finalCandidatePassed ?? false)],
    ["final depth rejected（奥行き違反で除外された候補数）", formatNumber(finalStep?.depthRelationSummary?.rejectedCandidateCount)],
    ["final depth penalty（奥行き関係ペナルティ）", formatNumber(finalStep?.depthRelationSummary?.finalCandidatePenalty)],
  ])
}

function renderSearchProgress(): void {
  const progress = state.searchProgress
  getElement("search-progress").innerHTML = renderStatusItems([
    ["status", progress.status],
    ["progress", `${formatPercent(progress.progressRate)}%`],
    ["processed candidates", String(progress.processedCandidateCount)],
    ["estimated candidates", String(progress.estimatedCandidateCount)],
    ["startedAt", progress.startedAt ?? "-"],
    ["updatedAt", progress.updatedAt ?? "-"],
    ["message", progress.message ?? "-"],
  ])
}

function renderAutoSequenceStatus(): void {
  const auto = state.autoSequence
  const sequence = auto.definition
  const currentPresetId = sequence?.steps[auto.currentStepIndex] ?? null
  const currentPreset = currentPresetId ? findSearchPreset(currentPresetId) : null
  const stepCount = sequence?.steps.length ?? 0
  const finalCandidate = auto.finalCandidate

  if (auto.status === "idle") {
    getElement("auto-sequence-status").innerHTML = renderStatusItems([
      ["status", "idle"],
      ["sequence", "-"],
      ["message", "Auto Search Sequence を選び、Run Auto Sequence で順番に実行します。"],
    ])
    return
  }

  const items: Array<[string, string]> = [
    ["status", auto.status === "running" ? "Auto Sequence running" : `Auto Sequence ${auto.status}`],
    ["sequence", sequence?.label ?? "-"],
    ["current step", stepCount > 0 ? `${Math.min(auto.currentStepIndex + 1, stepCount)} / ${stepCount}` : "-"],
    ["current preset", currentPreset?.label ?? "-"],
    [
      "processed candidates",
      `${state.searchProgress.processedCandidateCount} / ${state.searchProgress.estimatedCandidateCount}`,
    ],
    ["current best score", formatNumber(auto.currentBestScore)],
    ["message", auto.message ?? "-"],
  ]

  if (auto.status !== "running") {
    items.push(["startedAt", auto.startedAt ?? "-"])
    items.push(["completedAt", auto.completedAt ?? "-"])
  }

  if (finalCandidate) {
    items.push(["final pivotZ", formatNumber(finalCandidate.pivotZ)])
    items.push(["final rotationCenter", formatRotationCenter(getCandidateRotationCenter(finalCandidate))])
    for (const name of SEMANTIC_POINT_NAMES) {
      items.push([`final ${name}.z`, formatNumber(finalCandidate.zByPointId[name])])
    }
  }

  const finalScore = auto.steps.at(-1)
  if (finalScore) {
    items.push(["final objectiveMode（最終最適化モード）", finalScore.objectiveMode])
    items.push(["final objectiveScore（最終最適化スコア）", formatNumber(finalScore.objectiveScore)])
    items.push(["final totalScore（最終全体スコア）", formatNumber(finalScore.totalScore)])
    items.push(["final yawAverageScore（左右向き平均スコア）", formatNumber(finalScore.scoreDebug?.yawAverageScore)])
    items.push(["final pitchAverageScore（上下向き平均スコア）", formatNumber(finalScore.scoreDebug?.pitchAverageScore)])
    items.push(["final maxBucketScore（最悪姿勢スコア）", formatNumber(finalScore.scoreDebug?.maxBucketScore)])
    items.push(["final balancedScore（全体と最悪姿勢のバランススコア）", formatNumber(finalScore.scoreDebug?.balancedScore)])
    items.push(["final depth mode（最終奥行き関係モード）", finalScore.depthRelationFiltering?.mode ?? "-"])
    items.push([
      "final depth applyToObjectiveScore（奥行きペナルティをスコアへ反映）",
      finalScore.depthRelationFiltering
        ? String(finalScore.depthRelationFiltering.applyToObjectiveScore)
        : "-",
    ])
  }

  getElement("auto-sequence-status").innerHTML = `
    <div class="summary-grid">${renderStatusItems(items)}</div>
    ${renderAutoSequenceStepTable(auto.steps)}
  `
}

function renderAutoSequenceStepTable(steps: AutoSequenceStepSummary[]): string {
  if (steps.length === 0) {
    return `<p class="empty">Auto Sequence step result はまだありません。</p>`
  }

  return `
    <div class="table-wrap auto-sequence-table">
      <table>
        <thead>
          <tr>
            <th>step</th>
            <th>preset</th>
            <th>objective</th>
            <th>objectiveScore（最適化スコア）</th>
            <th>totalScore（全体スコア）</th>
            <th>balanced（バランススコア）</th>
            <th>maxBucket（最悪姿勢スコア）</th>
            <th>depth mode（奥行き関係モード）</th>
            <th>depth apply（ペナルティ反映）</th>
            <th>depth passed（奥行き関係通過）</th>
            <th>depth rejected（奥行き除外数）</th>
            <th>depth penalty（奥行きペナルティ）</th>
            <th>bestCandidate（最良候補）</th>
          </tr>
        </thead>
        <tbody>
          ${steps.map(
            (step) => `
              <tr>
                <td>${step.stepIndex}</td>
                <td>${escapeHtml(step.presetName)}</td>
                <td><code>${step.objectiveMode}</code></td>
                <td>${formatNumber(step.objectiveScore)}</td>
                <td>${formatNumber(step.totalScore)}</td>
                <td>${formatNumber(step.scoreDebug?.balancedScore)}</td>
                <td>${formatNumber(step.scoreDebug?.maxBucketScore)}</td>
                <td><code>${step.depthRelationFiltering?.mode ?? "-"}</code></td>
                <td>${String(step.depthRelationFiltering?.applyToObjectiveScore ?? false)}</td>
                <td>${String(step.depthRelationSummary?.finalCandidatePassed ?? false)}</td>
                <td>${formatNumber(step.depthRelationSummary?.rejectedCandidateCount)}</td>
                <td>${formatNumber(step.depthRelationSummary?.finalCandidatePenalty)}</td>
                <td><code>${escapeHtml(step.bestCandidate ? formatCandidateCompact(step.bestCandidate) : "-")}</code></td>
              </tr>
            `,
          ).join("")}
        </tbody>
      </table>
    </div>
  `
}

function renderBucketTargetWarning(): void {
  const element = getElement("bucket-target-warning")
  if (state.frames.length === 0) {
    element.textContent = "capture JSON 読み込み後に不足 bucket を確認します。"
    return
  }
  const settings = readSettings()
  const sourceSummary = summarizeSource(state.payload, state.frames)
  const shortage = buildBucketTargetShortage(
    settings.targets,
    sourceSummary.bucketCounts,
    sourceSummary.bucketCounts,
  )
  if (!shortage || shortage.length === 0) {
    element.textContent = "bucket target に対する不足はありません。"
    return
  }
  const presetName = getCurrentBucketTargetPresetName(settings)
  element.textContent = [
    `Warning: ${presetName} を指定していますが、以下の bucket が不足しています。`,
    ...shortage.map(
      (item) =>
        `${item.bucket}:\n  required: ${item.required}\n  available: ${item.available}`,
    ),
  ].join("\n\n")
}

function renderCandidateStabilityDebug(): void {
  const debug = buildCandidateStabilityDebug()
  if (state.analysis) {
    state.analysis.candidateStabilityDebug = debug
  }
  renderStabilityCheckStatus()
  getElement("stability-history-table").innerHTML = renderStabilityHistoryTable(debug.history)
  getElement("stability-summary").innerHTML = renderStabilitySummaryTable(debug.summaries)
}

function renderStabilityCheckStatus(): void {
  const stability = state.stabilityCheck
  const sequence = stability.sequenceId ? findAutoSequence(stability.sequenceId) : null
  const currentPresetId =
    stability.status === "running" ? stability.targetPresetIds[stability.currentIndex] : null
  const currentBucketPreset = currentPresetId
    ? findBucketTargetPreset(STABILITY_TARGET_PRESET_TO_BUCKET_PRESET[currentPresetId])
    : null
  getElement("stability-check-status").innerHTML = renderStatusItems([
    ["status", stability.status],
    ["sequence", sequence?.label ?? "-"],
    [
      "current preset",
      currentBucketPreset
        ? `${stability.currentIndex + 1} / ${stability.targetPresetIds.length}: ${currentBucketPreset.label}`
        : "-",
    ],
    ["history count", String(state.stabilityHistory.length)],
  ])
}

function renderStabilityHistoryTable(entries: StabilityHistoryEntry[]): string {
  if (entries.length === 0) {
    return `<p class="empty">Stability History はまだありません。</p>`
  }
  return `
    <table>
      <thead>
        <tr>
          <th>bucketTargetPreset</th>
          <th>actual selected count</th>
          <th>shortage warning</th>
          <th>sequenceName</th>
          <th>objectiveMode</th>
          <th>rotationCenter.y</th>
          <th>rotationCenter.z</th>
          <th>nose.z</th>
          <th>leftCheek.z</th>
          <th>rightCheek.z</th>
          <th>totalScore</th>
          <th>balancedScore</th>
          <th>maxBucketScore</th>
          <th>pitchAverageScore</th>
          <th>yawAverageScore</th>
          <th>outlier count</th>
          <th>outlier buckets</th>
          <th>depth passed</th>
          <th>depth violations</th>
          <th>depth rejected</th>
          <th>depth penalty</th>
          <th>raw totalScore</th>
          <th>filtered totalScore</th>
          <th>raw maxBucketScore</th>
          <th>filtered maxBucketScore</th>
          <th>worstBucket</th>
        </tr>
      </thead>
      <tbody>
        ${entries.map((entry) => {
          const rotationCenter = getHistoryRotationCenter(entry)
          return `
            <tr>
              <td>${escapeHtml(entry.bucketTargetPresetName)}</td>
              <td>${entry.actualSelectedFrameSummary.selectedFrameCount}</td>
              <td>${formatShortage(entry.actualSelectedFrameSummary.shortage)}</td>
              <td>${escapeHtml(entry.sequenceName)}</td>
              <td><code>${entry.objectiveMode}</code></td>
              <td>${formatNumber(rotationCenter?.y)}</td>
              <td>${formatNumber(rotationCenter?.z)}</td>
              <td>${formatNumber(entry.finalCandidate?.zByPointId.nose)}</td>
              <td>${formatNumber(entry.finalCandidate?.zByPointId.leftCheek)}</td>
              <td>${formatNumber(entry.finalCandidate?.zByPointId.rightCheek)}</td>
              <td>${formatNumber(entry.scores.totalScore)}</td>
              <td>${formatNumber(entry.scores.balancedScore)}</td>
              <td>${formatNumber(entry.scores.maxBucketScore)}</td>
              <td>${formatNumber(entry.scores.pitchAverageScore)}</td>
              <td>${formatNumber(entry.scores.yawAverageScore)}</td>
              <td>${formatNumber(entry.outlierSummary?.totalOutlierFrameCount)}</td>
              <td>${entry.outlierSummary ? formatOutlierBuckets(entry.outlierSummary.outlierFrameCountsByBucket) : "-"}</td>
              <td>${String(entry.depthRelationSummary?.finalCandidatePassed ?? false)}</td>
              <td>${formatNumber(entry.depthRelationSummary?.violationCount)}</td>
              <td>${formatNumber(entry.depthRelationSummary?.rejectedCandidateCount)}</td>
              <td>${formatNumber(entry.depthRelationSummary?.finalCandidatePenalty)}</td>
              <td>${formatNumber(entry.outlierSummary?.rawScores.totalScore)}</td>
              <td>${formatNumber(entry.outlierSummary?.filteredScores?.totalScore)}</td>
              <td>${formatNumber(entry.outlierSummary?.rawScores.scoreDebug.maxBucketScore)}</td>
              <td>${formatNumber(entry.outlierSummary?.filteredScores?.scoreDebug.maxBucketScore)}</td>
              <td>${entry.worstBucket ? `${entry.worstBucket.bucket}: ${formatNumber(entry.worstBucket.score)}` : "-"}</td>
            </tr>
          `
        }).join("")}
      </tbody>
    </table>
  `
}

function renderStabilitySummaryTable(summaries: StabilitySummary[]): string {
  if (summaries.length === 0) {
    return `<p class="empty">Stability Summary はまだありません。</p>`
  }
  return summaries
    .map(
      (summary) => `
        <h3>${escapeHtml(summary.sequenceName)}</h3>
        <div class="summary-grid">
          ${renderStatusItems([
            ["rotationCenter.y range", formatNumber(summary.candidateDrift?.rotationCenterYRange)],
            ["rotationCenter.z range", formatNumber(summary.candidateDrift?.rotationCenterZRange)],
            ["nose.z range", formatNumber(summary.candidateDrift?.noseZRange)],
            ["leftCheek.z range", formatNumber(summary.candidateDrift?.leftCheekZRange)],
            ["rightCheek.z range", formatNumber(summary.candidateDrift?.rightCheekZRange)],
            ["maxBucketScore range", formatNumber(summary.scoreDrift?.maxBucketScoreRange)],
            ["isStableCandidate", String(summary.interpretation?.isStableCandidate ?? false)],
            ["notes", summary.interpretation?.notes.join(" / ") ?? "-"],
          ])}
        </div>
        ${renderStabilitySummaryEntries(summary.entries)}
      `,
    )
    .join("")
}

function renderStabilitySummaryEntries(entries: StabilityHistoryEntry[]): string {
  return `
    <div class="table-wrap auto-sequence-table">
      <table>
        <thead>
          <tr>
            <th>preset</th>
            <th>rotationCenter.y</th>
            <th>rotationCenter.z</th>
            <th>nose.z</th>
            <th>maxBucketScore</th>
            <th>outlier count</th>
            <th>depth passed</th>
            <th>depth rejected</th>
            <th>raw maxBucketScore</th>
            <th>filtered maxBucketScore</th>
          </tr>
        </thead>
        <tbody>
          ${entries.map((entry) => {
            const rotationCenter = getHistoryRotationCenter(entry)
            return `
              <tr>
                <td>${escapeHtml(entry.bucketTargetPresetName)}</td>
                <td>${formatNumber(rotationCenter?.y)}</td>
                <td>${formatNumber(rotationCenter?.z)}</td>
                <td>${formatNumber(entry.finalCandidate?.zByPointId.nose)}</td>
                <td>${formatNumber(entry.scores.maxBucketScore)}</td>
                <td>${formatNumber(entry.outlierSummary?.totalOutlierFrameCount)}</td>
                <td>${String(entry.depthRelationSummary?.finalCandidatePassed ?? false)}</td>
                <td>${formatNumber(entry.depthRelationSummary?.rejectedCandidateCount)}</td>
                <td>${formatNumber(entry.outlierSummary?.rawScores.scoreDebug.maxBucketScore)}</td>
                <td>${formatNumber(entry.outlierSummary?.filteredScores?.scoreDebug.maxBucketScore)}</td>
              </tr>
            `
          }).join("")}
        </tbody>
      </table>
    </div>
  `
}

function formatShortage(shortage: BucketTargetShortage[] | undefined): string {
  if (!shortage || shortage.length === 0) {
    return "-"
  }
  return shortage
    .map(
      (item) =>
        `${item.bucket}: required ${item.required}, available ${item.available}, selected ${item.selected}`,
    )
    .join("<br />")
}

function renderOutlierFrameDebug(
  debug: AnalysisOutlierFrameDebug | null,
  fallbackSettings: OutlierFilteringSettings,
): void {
  const settings = debug?.settings ?? fallbackSettings
  const bestCandidateOutliers = debug?.bestCandidateOutliers
  const outlierFrames = bestCandidateOutliers?.outlierFrames ?? []
  const countsByBucket = countOutlierFramesByBucket(outlierFrames)
  const rawScores = bestCandidateOutliers?.rawScores ?? null
  const filteredScores = bestCandidateOutliers?.filteredScores ?? null

  getElement("outlier-settings-summary").innerHTML = renderStatusItems([
    ["enabled", String(settings.enabled)],
    ["mode", settings.mode],
    ["method", settings.method],
    ["perBucketMaxOutliers", String(settings.perBucketMaxOutliers)],
    ["minBucketSampleCount", String(settings.minBucketSampleCount)],
    ["medianMultiplier", formatNumber(settings.medianMultiplier)],
    ["absoluteDeltaThreshold", formatNumber(settings.absoluteDeltaThreshold)],
    ["topWorstPercent", formatNumber(settings.topWorstPercent)],
    ["applyToObjectiveScore", String(settings.applyToObjectiveScore)],
  ])

  getElement("outlier-best-summary").innerHTML = bestCandidateOutliers
    ? renderStatusItems([
        ["total outlier frames", String(outlierFrames.length)],
        ["outlier count by bucket", formatBucketCounts(countsByBucket)],
        ["outlier buckets", formatOutlierBuckets(countsByBucket)],
        ["raw totalScore", formatNumber(rawScores?.totalScore)],
        ["filtered totalScore", formatNumber(filteredScores?.totalScore)],
        ["raw maxBucketScore", formatNumber(rawScores?.scoreDebug.maxBucketScore)],
        ["filtered maxBucketScore", formatNumber(filteredScores?.scoreDebug.maxBucketScore)],
        ["raw balancedScore", formatNumber(rawScores?.scoreDebug.balancedScore)],
        ["filtered balancedScore", formatNumber(filteredScores?.scoreDebug.balancedScore)],
        ["warning", outlierFrames.length > 3 ? "outlier count が多いため候補の利用には注意してください。" : "-"],
      ])
    : `<p class="empty">Outlier Filtering が disabled / off、または bestCandidate がないため outlier summary はありません。</p>`

  getElement("outlier-frame-table").innerHTML = renderOutlierFrameTable(outlierFrames)
}

function renderOutlierFrameTable(frames: OutlierFrameDebug[]): string {
  if (frames.length === 0) {
    return `<p class="empty">外れフレーム候補はありません。</p>`
  }
  return `
    <table>
      <thead>
        <tr>
          <th>captureId</th>
          <th>bucket</th>
          <th>pose yaw/pitch/roll</th>
          <th>frameError</th>
          <th>bucketMedianError</th>
          <th>ratioToMedian</th>
          <th>deltaFromMedian</th>
          <th>worstPoint</th>
          <th>worstPointError</th>
          <th>outlierReason</th>
          <th>excludedFromInference</th>
        </tr>
      </thead>
      <tbody>
        ${frames.map((frame) => `
          <tr>
            <td><code>${escapeHtml(frame.captureId)}</code></td>
            <td><code>${frame.bucket}</code></td>
            <td>${formatNumber(frame.pose.yaw)} / ${formatNumber(frame.pose.pitch)} / ${formatNumber(frame.pose.roll)}</td>
            <td>${formatNumber(frame.frameError)}</td>
            <td>${formatNumber(frame.bucketMedianError)}</td>
            <td>${formatNumber(frame.ratioToMedian)}</td>
            <td>${formatNumber(frame.deltaFromMedian)}</td>
            <td><code>${frame.worstPoint?.pointId ?? "-"}</code></td>
            <td>${formatNumber(frame.worstPoint?.error)}</td>
            <td>${escapeHtml(frame.outlierReason)}</td>
            <td>${String(frame.excludedFromInference)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `
}

function renderDepthRelationDebug(
  debug: AnalysisDepthRelationDebug | null,
  fallbackSettings: DepthRelationFilteringSettings,
): void {
  const settings = debug?.settings ?? fallbackSettings
  const best = debug?.bestCandidateDepthRelation
  const noseRule = best?.ruleResults.find((result) => result.ruleId === "nose_tip_in_front_of_cheeks")
  const nose = best?.groupValues.noseTip?.z ?? null
  const cheeks = best?.groupValues.cheeks?.z ?? null
  const delta = nose === null || cheeks === null ? null : round(nose - cheeks)

  getElement("depth-relation-settings-summary").innerHTML = renderStatusItems([
    ["enabled", String(settings.enabled)],
    ["mode", settings.mode],
    ["applyToObjectiveScore", String(settings.applyToObjectiveScore)],
    ["penaltyScale", formatNumber(settings.penaltyScale)],
    ["maxPenalty", formatNumber(settings.maxPenalty)],
    ["rule count", String(settings.rules.length)],
  ])

  getElement("depth-relation-best-summary").innerHTML = best
    ? renderStatusItems([
        ["nose.z（鼻の奥行き）", formatNumber(nose)],
        ["cheeks.z（左右頬の奥行き）", formatNumber(cheeks)],
        ["noseMinusCheeks（鼻と頬の奥行き差）", formatNumber(delta)],
        ["passed（通過）", String(noseRule?.passed ?? false)],
        ["isRejected（除外対象）", String(best.isRejected)],
        ["violationCount", String(best.violationCount)],
        ["hardRejectViolationCount", String(best.hardRejectViolationCount)],
        ["penalty", formatNumber(best.penalty)],
      ])
    : `<p class="empty">bestCandidate がないため Depth Relation Debug はありません。</p>`

  getElement("depth-relation-warning").textContent =
    noseRule && noseRule.severity === "violation"
      ? [
          "Warning:",
          `nose.z（鼻の奥行き） = ${formatNumber(nose)}`,
          `cheeks.z（左右頬の平均奥行き） = ${formatNumber(cheeks)}`,
          "鼻が左右頬より奥にあります。",
        ].join("\n")
      : "Depth Relation Rule の警告はありません。"

  getElement("depth-relation-rule-table").innerHTML = renderDepthRelationRuleTable(best?.ruleResults ?? [])
  getElement("depth-relation-rejected-table").innerHTML = renderRejectedCandidateTable(
    debug?.rejectedCandidates ?? [],
    debug?.rejectedCandidateCount ?? 0,
  )
}

function renderDepthRelationRuleTable(results: DepthRelationRuleResult[]): string {
  if (results.length === 0) {
    return `<p class="empty">Depth Relation Rule の結果はありません。</p>`
  }
  return `
    <table>
      <thead>
        <tr>
          <th>ruleId</th>
          <th>label</th>
          <th>subjectGroup</th>
          <th>referenceGroup</th>
          <th>relation</th>
          <th>margin</th>
          <th>mode</th>
          <th>passed</th>
          <th>delta</th>
          <th>severity</th>
          <th>penalty</th>
        </tr>
      </thead>
      <tbody>
        ${results.map((result) => `
          <tr>
            <td><code>${escapeHtml(result.ruleId)}</code></td>
            <td>${escapeHtml(result.label)}</td>
            <td><code>${escapeHtml(result.subjectGroupId)}</code></td>
            <td><code>${escapeHtml(result.referenceGroupId)}</code></td>
            <td><code>${result.relation}</code></td>
            <td>${formatNumber(result.margin)}</td>
            <td><code>${result.mode}</code></td>
            <td>${String(result.passed)}</td>
            <td>${formatNumber(result.delta)}</td>
            <td>${result.severity}</td>
            <td>${formatNumber(result.penalty)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `
}

function renderDepth478Prototype(prototype: Depth478PrototypeResult | null): void {
  const empty = `<p class="empty">478点デバッグ候補はまだ生成されていません。</p>`
  if (!prototype?.generatedCandidate) {
    getElement("depth-478-summary").innerHTML = empty
    getElement("depth-478-projection-evaluation").innerHTML = empty
    getElement("depth-478-group-error-table").innerHTML = ""
    getElement("depth-478-relation-debug").innerHTML = empty
    getElement("depth-478-relation-rule-table").innerHTML = ""
    getElement("depth-478-smoothness-debug").innerHTML = empty
    getElement("depth-478-smoothness-edge-table").innerHTML = ""
    getElement("canonical-depth-fit-comparison").innerHTML = empty
    getElement("depth-478-candidate-comparison").innerHTML =
      renderDepth478CandidateComparisonTable(prototype?.candidateComparison ?? [])
    return
  }

  const candidate = prototype.generatedCandidate
  const projection = prototype.projectionEvaluation
  const relation = prototype.depthRelationDebug
  const smoothness = prototype.smoothnessDebug
  getElement("depth-478-summary").innerHTML = renderStatusItems([
    ["candidateId（478点候補ID）", candidate.id],
    ["source8CandidateId（元8点候補ID）", candidate.source8CandidateId ?? "-"],
    ["landmarkCount（生成したランドマーク数）", String(candidate.summary.landmarkCount)],
    ["zMin（最小奥行き）", formatNumber(candidate.summary.zMin)],
    ["zMax（最大奥行き）", formatNumber(candidate.summary.zMax)],
    ["zRange（奥行き範囲）", formatNumber(candidate.summary.zRange)],
    ["averageZ（平均奥行き）", formatNumber(candidate.summary.averageZ)],
    ["rotationCenter（投影用回転中心）", formatRotationCenter(candidate.rotationCenter)],
    ["depth478GenerationMethod（478点生成方式）", prototype.settings.interpolation.method],
    [
      "canonicalFit（標準顔奥行き fit）",
      candidate.canonicalDepthBasedDebug
        ? `leastSquares / scale ${formatNumber(candidate.canonicalDepthBasedDebug.fit.scale)} / offset ${formatNumber(candidate.canonicalDepthBasedDebug.fit.offset)}`
        : "-",
    ],
    ["epsilon（距離ゼロ除算回避値）", formatNumber(prototype.settings.interpolation.epsilon)],
    ["power（距離減衰の強さ）", formatNumber(prototype.settings.interpolation.power)],
    ["clampZ（z範囲制限）", String(prototype.settings.interpolation.clampZ)],
  ])
  getElement("depth-478-projection-evaluation").innerHTML = projection
    ? renderStatusItems([
        ["totalProjectionError（投影誤差合計）", formatNumber(projection.totalProjectionError)],
        ["averageProjectionError（平均投影誤差）", formatNumber(projection.averageProjectionError)],
        ["front", formatNumber(projection.bucketScores.front)],
        ["yawPositive", formatNumber(projection.bucketScores.yawPositive)],
        ["yawNegative", formatNumber(projection.bucketScores.yawNegative)],
        ["pitchPositive", formatNumber(projection.bucketScores.pitchPositive)],
        ["pitchNegative", formatNumber(projection.bucketScores.pitchNegative)],
        ["mixedPose", formatNumber(projection.bucketScores.mixedPose)],
        [
          "worstFrame（最も誤差が大きいフレーム）",
          projection.worstFrame
            ? `${projection.worstFrame.captureId} / ${projection.worstFrame.bucket} / ${formatNumber(projection.worstFrame.error)}`
            : "-",
        ],
        [
          "worstGroup（最も誤差が大きいグループ）",
          projection.worstGroup
            ? `${projection.worstGroup.label} / ${formatNumber(projection.worstGroup.averageError)}`
            : "-",
        ],
      ])
    : empty
  getElement("depth-478-group-error-table").innerHTML = projection
    ? renderDepth478GroupErrorTable(projection.perGroupError)
    : ""
  getElement("depth-478-relation-debug").innerHTML = relation
    ? renderStatusItems([
        ["enabled（奥行き関係フィルタ有効）", String(relation.settings.enabled)],
        ["mode（奥行き関係モード）", relation.settings.mode],
        ["applyToObjectiveScore（ペナルティをスコアへ反映）", String(relation.settings.applyToObjectiveScore)],
        ["ruleCount（奥行き関係ルール数）", String(relation.settings.ruleCount)],
        ["violationCount（違反数）", String(relation.violationCount)],
        ["hardRejectViolationCount（完全除外対象の違反数）", String(relation.hardRejectViolationCount)],
        ["isRejected（478 debug 候補が除外対象か）", String(relation.isRejected)],
        ["noseTipGroup.z（鼻先グループ奥行き）", formatNumber(relation.groupValues.noseTipGroup?.z ?? null)],
        ["cheekGroup.z（頬グループ奥行き）", formatNumber(relation.groupValues.cheekGroup?.z ?? null)],
        ["faceCenterGroup.z（顔中心グループ奥行き）", formatNumber(relation.groupValues.faceCenterGroup?.z ?? null)],
        ["faceBoundaryGroup.z（顔境界グループ奥行き）", formatNumber(relation.groupValues.faceBoundaryGroup?.z ?? null)],
      ])
    : empty
  getElement("depth-478-relation-rule-table").innerHTML = relation
    ? renderDepthRelationRuleTable(relation.ruleResults)
    : ""
  getElement("depth-478-smoothness-debug").innerHTML = smoothness
    ? renderStatusItems([
        ["averageNeighborDeltaZ（平均隣接奥行き差）", formatNumber(smoothness.averageNeighborDeltaZ)],
        ["maxNeighborDeltaZ（最大隣接奥行き差）", formatNumber(smoothness.maxNeighborDeltaZ)],
        ["highDeltaEdgeCount（しきい値超過エッジ数）", String(smoothness.highDeltaEdgeCount)],
        ["threshold（滑らかさしきい値）", formatNumber(smoothness.threshold)],
      ])
    : empty
  getElement("depth-478-smoothness-edge-table").innerHTML = smoothness
    ? renderDepth478SmoothnessEdgeTable(smoothness.highDeltaEdges)
    : ""
  getElement("canonical-depth-fit-comparison").innerHTML =
    renderCanonicalDepthFitComparison(prototype.canonicalDepthFitComparison)
  getElement("depth-478-candidate-comparison").innerHTML = renderDepth478CandidateComparisonTable(
    prototype.candidateComparison ?? [],
  )
}

function renderCanonicalDepthFitComparison(
  debug: CanonicalDepthFitComparisonDebug | undefined,
): string {
  if (!debug || debug.variants.length === 0) {
    return `<p class="empty">canonicalDepthFitComparison はまだありません。</p>`
  }
  return `
    <table>
      <thead>
        <tr>
          <th>id</th>
          <th>zSign</th>
          <th>fitReferencePointSet</th>
          <th>averageReferenceAbsError</th>
          <th>nose target/fitted/error</th>
          <th>cheek target/fitted/error</th>
          <th>chin target/fitted/error</th>
          <th>mouth target/fitted/error</th>
          <th>jaw target/fitted/error</th>
          <th>faceBoundary target/fitted/error</th>
          <th>averageProjectionError</th>
          <th>depthRelationStatus</th>
          <th>depthRelationViolationCount</th>
          <th>boundHitCount</th>
          <th>jawGroup lower hits</th>
          <th>faceBoundaryGroup lower hits</th>
        </tr>
      </thead>
      <tbody>
        ${debug.variants.map((variant) => `
          <tr>
            <td><code>${variant.id}</code></td>
            <td><code>${variant.zSign}</code></td>
            <td><code>${variant.fitReferencePointSet}</code></td>
            <td>${formatNumber(variant.averageReferenceAbsError)}</td>
            <td>${formatCanonicalDepthFitComparisonGroup(variant.groupFit.nose)}</td>
            <td>${formatCanonicalDepthFitComparisonGroup(variant.groupFit.cheek)}</td>
            <td>${formatCanonicalDepthFitComparisonGroup(variant.groupFit.chin)}</td>
            <td>${formatCanonicalDepthFitComparisonGroup(variant.groupFit.mouth)}</td>
            <td>${formatCanonicalDepthFitComparisonGroup(variant.groupFit.jaw)}</td>
            <td>${formatCanonicalDepthFitComparisonGroup(variant.groupFit.faceBoundary)}</td>
            <td>${formatNumber(variant.averageProjectionError)}</td>
            <td><code>${variant.depthRelationStatus}</code></td>
            <td>${formatNumber(variant.depthRelationViolationCount)}</td>
            <td>${formatNumber(variant.perLandmarkBoundHitCount)}</td>
            <td>${formatNumber(variant.jawGroupLowerBoundHitCount)}</td>
            <td>${formatNumber(variant.faceBoundaryGroupLowerBoundHitCount)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `
}

function formatCanonicalDepthFitComparisonGroup(
  group: CanonicalDepthFitComparisonGroup,
): string {
  return [
    formatNumber(group.targetZ),
    formatNumber(group.fittedZ),
    formatNumber(group.error),
  ].join(" / ")
}

function renderDepth478GroupErrorTable(
  perGroupError: ProjectionEvaluation478["perGroupError"],
): string {
  const groups = Object.values(perGroupError)
  if (groups.length === 0) {
    return `<p class="empty">478 group error はありません。</p>`
  }
  return `
    <table>
      <thead>
        <tr>
          <th>groupId（グループID）</th>
          <th>label（表示名）</th>
          <th>averageError（平均誤差）</th>
          <th>maxError（最大誤差）</th>
          <th>sampleCount（評価サンプル数）</th>
        </tr>
      </thead>
      <tbody>
        ${groups.map((group) => `
          <tr>
            <td><code>${escapeHtml(group.groupId)}</code></td>
            <td>${escapeHtml(group.label)}</td>
            <td>${formatNumber(group.averageError)}</td>
            <td>${formatNumber(group.maxError)}</td>
            <td>${group.sampleCount}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `
}

function renderDepth478SmoothnessEdgeTable(
  edges: SmoothnessDebug478["highDeltaEdges"],
): string {
  if (edges.length === 0) {
    return `<p class="empty">しきい値を超える近傍 z 差はありません。</p>`
  }
  return `
    <table>
      <thead>
        <tr>
          <th>from（起点ランドマーク）</th>
          <th>to（隣接ランドマーク）</th>
          <th>deltaZ（奥行き差）</th>
        </tr>
      </thead>
      <tbody>
        ${edges.map((edge) => `
          <tr>
            <td><code>${edge.from}</code></td>
            <td><code>${edge.to}</code></td>
            <td>${formatNumber(edge.deltaZ)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `
}

function renderDepth478CandidateComparisonTable(
  entries: Depth478CandidateComparisonEntry[],
): string {
  if (entries.length === 0) {
    return `<p class="empty">478点候補比較はまだありません。</p>`
  }
  return `
    <table>
      <thead>
        <tr>
          <th>candidateId（478点候補ID）</th>
          <th>source8Candidate（元8点候補）</th>
          <th>depth478GenerationMethod（478点生成方式）</th>
          <th>totalProjectionError（投影誤差合計）</th>
          <th>worstBucketScore（最悪姿勢スコア）</th>
          <th>depthRelationViolationCount（奥行き関係違反数）</th>
          <th>depthRelationHardRejectViolationCount（完全除外対象の違反数）</th>
          <th>depthRelationIsRejected（奥行き関係で除外対象）</th>
          <th>hardRejectViolationCount</th>
          <th>isRejected</th>
          <th>smoothnessMaxDeltaZ（最大隣接奥行き差）</th>
          <th>smoothnessHighDeltaEdgeCount（滑らかさ違反数）</th>
        </tr>
      </thead>
      <tbody>
        ${entries.map((entry) => `
          <tr>
            <td><code>${escapeHtml(entry.candidateId)}</code></td>
            <td><code>${escapeHtml(entry.source8CandidateId ?? "-")}</code></td>
            <td><code>${entry.depth478GenerationMethod}</code></td>
            <td>${formatNumber(entry.totalProjectionError)}</td>
            <td>${formatNumber(entry.maxBucketScore)}</td>
            <td>${formatNumber(entry.depthRelationViolationCount)}</td>
            <td>${formatNumber(entry.depthRelationHardRejectViolationCount)}</td>
            <td>${entry.depthRelationIsRejected === null ? "-" : String(entry.depthRelationIsRejected)}</td>
            <td>${formatNumber(entry.hardRejectViolationCount)}</td>
            <td>${entry.isRejected === null ? "-" : String(entry.isRejected)}</td>
            <td>${formatNumber(entry.smoothnessMaxDeltaZ)}</td>
            <td>${formatNumber(entry.smoothnessHighDeltaEdgeCount)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `
}

function renderRejectedCandidateTable(
  candidates: RejectedCandidateSummary[],
  rejectedCandidateCount: number,
): string {
  if (rejectedCandidateCount === 0) {
    return `<p class="empty">Depth Relation Filtering による除外候補はありません。</p>`
  }
  return `
    <p class="empty">表示は最大20件です。total rejected: ${rejectedCandidateCount}</p>
    <table>
      <thead>
        <tr>
          <th>originalRank</th>
          <th>candidateId</th>
          <th>objectiveBefore</th>
          <th>totalScore</th>
          <th>nose.z</th>
          <th>cheeks.z</th>
          <th>delta</th>
          <th>reason</th>
        </tr>
      </thead>
      <tbody>
        ${candidates.map((candidate) => {
          const debug = candidate.depthRelationDebug
          const nose = debug.groupValues.noseTip?.z ?? null
          const cheeks = debug.groupValues.cheeks?.z ?? null
          const delta = nose === null || cheeks === null ? null : round(nose - cheeks)
          return `
            <tr>
              <td>${formatNumber(candidate.originalRank ?? null)}</td>
              <td><code>${escapeHtml(candidate.candidateId)}</code></td>
              <td>${formatNumber(candidate.objectiveScoreBeforeDepthFilter)}</td>
              <td>${formatNumber(candidate.totalScore)}</td>
              <td>${formatNumber(nose)}</td>
              <td>${formatNumber(cheeks)}</td>
              <td>${formatNumber(delta)}</td>
              <td>${escapeHtml(candidate.rejectReasons.join(" / ") || "-")}</td>
            </tr>
          `
        }).join("")}
      </tbody>
    </table>
  `
}

function countOutlierFramesByBucket(frames: OutlierFrameDebug[]): Record<CaptureBucket, number> {
  return BUCKETS.reduce(
    (counts, bucket) => {
      counts[bucket] = frames.filter((frame) => frame.bucket === bucket).length
      return counts
    },
    {} as Record<CaptureBucket, number>,
  )
}

function formatOutlierBuckets(counts: Record<CaptureBucket, number>): string {
  const buckets = BUCKETS.filter((bucket) => counts[bucket] > 0)
  return buckets.length === 0
    ? "-"
    : buckets.map((bucket) => `${bucket}: ${counts[bucket]}`).join(" / ")
}

function renderProjectionSignDebug(debug: ProjectionSignDebug | null): void {
  if (!debug) {
    const empty = `<p class="empty">解析実行後に表示します。</p>`
    getElement("projection-sign-selected-frames").innerHTML = empty
    getElement("projection-sign-base").innerHTML = empty
    getElement("projection-sign-summary").innerHTML = empty
    getElement("projection-sign-table").innerHTML = empty
    getElement("projection-sign-json").textContent = ""
    return
  }

  getElement("projection-sign-selected-frames").innerHTML =
    renderProjectionSignSelectedFrames(debug)
  getElement("projection-sign-base").innerHTML = renderStatusItems([
    ["baseCandidate", formatCandidateCompact(debug.baseCandidate)],
    ["nose.z candidates", debug.noseZCandidates.map(formatNumber).join(" / ")],
    ["depthConvention", `${DEPTH_CONVENTION.smallerZ} / ${DEPTH_CONVENTION.largerZ}`],
  ])
  getElement("projection-sign-summary").innerHTML =
    renderProjectionSignSummaryTable(debug.summary)
  getElement("projection-sign-table").innerHTML = renderProjectionSignRowsTable(debug.rows)
  getElement("projection-sign-json").textContent = JSON.stringify(
    {
      rows: debug.rows.map((row) => ({
        captureId: row.captureId,
        bucket: row.bucket,
        noseZ: row.candidate.noseZ,
        projected: {
          leftCheek: row.projected.leftCheek,
          rightCheek: row.projected.rightCheek,
          mouth: row.projected.mouth,
        },
        current: {
          leftCheek: row.current.leftCheek,
          rightCheek: row.current.rightCheek,
          mouth: row.current.mouth,
        },
        deltaToCurrent: {
          leftCheek: row.deltaToCurrent.leftCheek,
          rightCheek: row.deltaToCurrent.rightCheek,
          mouth: row.deltaToCurrent.mouth,
        },
      })),
      summary: debug.summary,
    },
    null,
    2,
  )
}

function renderProjectionSignSelectedFrames(debug: ProjectionSignDebug): string {
  const rows = PROJECTION_SIGN_DEBUG_BUCKETS.map((bucket) => {
    const summary = debug.summary.byBucket[bucket]
    return {
      bucket,
      captureId: summary?.captureId ?? "-",
      pose: summary?.pose ?? null,
    }
  })

  return `
    <table>
      <thead>
        <tr>
          <th>bucket</th>
          <th>captureId</th>
          <th>yaw</th>
          <th>pitch</th>
          <th>roll</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(
          (row) => `
            <tr>
              <td><code>${row.bucket}</code></td>
              <td><code>${escapeHtml(row.captureId)}</code></td>
              <td>${formatNumber(row.pose?.yaw)}</td>
              <td>${formatNumber(row.pose?.pitch)}</td>
              <td>${formatNumber(row.pose?.roll)}</td>
            </tr>
          `,
        ).join("")}
      </tbody>
    </table>
  `
}

function renderProjectionSignSummaryTable(summary: ProjectionSignDebugSummary): string {
  return `
    <table>
      <thead>
        <tr>
          <th>bucket</th>
          <th>captureId</th>
          <th>yaw</th>
          <th>pitch</th>
          <th>roll</th>
          <th>nose.z増加時 x</th>
          <th>nose.z増加時 y</th>
          <th>best nose.z / nose distance</th>
          <th>best nose.z / frame score</th>
          <th>note</th>
        </tr>
      </thead>
      <tbody>
        ${PROJECTION_SIGN_DEBUG_BUCKETS.map((bucket) => {
          const entry = summary.byBucket[bucket]
          return `
            <tr>
              <td><code>${bucket}</code></td>
              <td><code>${escapeHtml(entry?.captureId ?? "-")}</code></td>
              <td>${formatNumber(entry?.pose.yaw)}</td>
              <td>${formatNumber(entry?.pose.pitch)}</td>
              <td>${formatNumber(entry?.pose.roll)}</td>
              <td>${entry?.noseZIncreasingEffect.projectedNoseXDirection ?? "-"}</td>
              <td>${entry?.noseZIncreasingEffect.projectedNoseYDirection ?? "-"}</td>
              <td>${formatNumber(entry?.bestNoseZByNoseDistance)}</td>
              <td>${formatNumber(entry?.bestNoseZByFrameScore)}</td>
              <td>${escapeHtml(entry?.note ?? "")}</td>
            </tr>
          `
        }).join("")}
      </tbody>
    </table>
  `
}

function renderProjectionSignRowsTable(rows: ProjectionSignDebugRow[]): string {
  if (rows.length === 0) {
    return `<p class="empty">Projection Sign Debug の対象フレームがありません。</p>`
  }

  return `
    <table>
      <thead>
        <tr>
          <th>bucket</th>
          <th>captureId</th>
          <th>yaw</th>
          <th>pitch</th>
          <th>roll</th>
          <th>nose.z</th>
          <th>projected nose.x</th>
          <th>projected nose.y</th>
          <th>current nose.x</th>
          <th>current nose.y</th>
          <th>nose dx</th>
          <th>nose dy</th>
          <th>nose distance</th>
          <th>movement from base dx</th>
          <th>movement from base dy</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(
          (row) => `
            <tr>
              <td><code>${row.bucket}</code></td>
              <td><code>${escapeHtml(row.captureId)}</code></td>
              <td>${formatNumber(row.pose.yaw)}</td>
              <td>${formatNumber(row.pose.pitch)}</td>
              <td>${formatNumber(row.pose.roll)}</td>
              <td>${formatNumber(row.candidate.noseZ)}</td>
              <td>${formatNumber(row.projected.nose.x)}</td>
              <td>${formatNumber(row.projected.nose.y)}</td>
              <td>${formatNumber(row.current.nose.x)}</td>
              <td>${formatNumber(row.current.nose.y)}</td>
              <td>${formatNumber(row.deltaToCurrent.nose.dx)}</td>
              <td>${formatNumber(row.deltaToCurrent.nose.dy)}</td>
              <td>${formatNumber(row.deltaToCurrent.nose.distance)}</td>
              <td>${formatNumber(row.noseMovementFromBase?.dx)}</td>
              <td>${formatNumber(row.noseMovementFromBase?.dy)}</td>
            </tr>
          `,
        ).join("")}
      </tbody>
    </table>
  `
}

function renderRotationCenterDebug(debug: RotationCenterDebug | null): void {
  if (!debug) {
    const empty = `<p class="empty">解析実行後に表示します。</p>`
    getElement("rotation-center-config").innerHTML = empty
    getElement("rotation-center-summary").innerHTML = empty
    getElement("rotation-center-table").innerHTML = empty
    return
  }

  getElement("rotation-center-config").innerHTML = renderStatusItems([
    ["baseCandidate", debug.baseCandidateName],
    ["baseCandidate values", formatCandidateCompact(debug.baseCandidate)],
    ["pivotX candidates", debug.pivotXCandidates.map(formatNumber).join(" / ")],
    ["pivotY candidates", debug.pivotYCandidates.map(formatNumber).join(" / ")],
    ["pivotZ candidates", debug.pivotZCandidates.map(formatNumber).join(" / ")],
    [
      "baseline rotationCenter",
      `x ${formatNumber(debug.summary.baselineRotationCenter.pivotX)} / y ${formatNumber(debug.summary.baselineRotationCenter.pivotY)} / z ${formatNumber(debug.summary.baselineRotationCenter.pivotZ)}`,
    ],
  ])
  getElement("rotation-center-summary").innerHTML = renderStatusItems([
    ["Best by totalScore", formatRotationCenterResultCompact(debug.summary.bestByTotalScore)],
    ["Best by balancedScore", formatRotationCenterResultCompact(debug.summary.bestByBalancedScore)],
    [
      "Best by pitchAverageScore",
      formatRotationCenterResultCompact(debug.summary.bestByPitchAverageScore),
    ],
    ["Best by maxBucketScore", formatRotationCenterResultCompact(debug.summary.bestByMaxBucketScore)],
    ["baseline totalScore", formatNumber(debug.summary.baselineResult.totalScore)],
    [
      "baseline pitchAverageScore",
      formatNumber(debug.summary.baselineResult.scoreDebug.pitchAverageScore),
    ],
    ["totalScore improvement", formatNumber(debug.summary.improvementFromBaseline.totalScoreDelta)],
    [
      "balancedScore improvement",
      formatNumber(debug.summary.improvementFromBaseline.balancedScoreDelta),
    ],
    [
      "pitchAverageScore improvement",
      formatNumber(debug.summary.improvementFromBaseline.pitchAverageScoreDelta),
    ],
    [
      "maxBucketScore improvement",
      formatNumber(debug.summary.improvementFromBaseline.maxBucketScoreDelta),
    ],
  ])
  getElement("rotation-center-table").innerHTML = renderRotationCenterResultsTable(debug.results)
}

function renderRotationCenterResultsTable(results: RotationCenterDebugResult[]): string {
  if (results.length === 0) {
    return `<p class="empty">Rotation Center Debug の結果がありません。</p>`
  }

  const rows = [...results].sort(
    (a, b) => nullableScore(a.scoreDebug.balancedScore) - nullableScore(b.scoreDebug.balancedScore),
  )
  return `
    <table>
      <thead>
        <tr>
          <th>pivotX</th>
          <th>pivotY</th>
          <th>pivotZ</th>
          <th>totalScore</th>
          <th>yawAverageScore</th>
          <th>pitchAverageScore</th>
          <th>maxBucketScore</th>
          <th>balancedScore</th>
          <th>front</th>
          <th>yawPositive</th>
          <th>yawNegative</th>
          <th>pitchPositive</th>
          <th>pitchNegative</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(
          (result) => `
            <tr>
              <td>${formatNumber(result.pivotX)}</td>
              <td>${formatNumber(result.pivotY)}</td>
              <td>${formatNumber(result.pivotZ)}</td>
              <td>${formatNumber(result.totalScore)}</td>
              <td>${formatNumber(result.scoreDebug.yawAverageScore)}</td>
              <td>${formatNumber(result.scoreDebug.pitchAverageScore)}</td>
              <td>${formatNumber(result.scoreDebug.maxBucketScore)}</td>
              <td>${formatNumber(result.scoreDebug.balancedScore)}</td>
              <td>${formatNumber(result.bucketScores.front)}</td>
              <td>${formatNumber(result.bucketScores.yawPositive)}</td>
              <td>${formatNumber(result.bucketScores.yawNegative)}</td>
              <td>${formatNumber(result.bucketScores.pitchPositive)}</td>
              <td>${formatNumber(result.bucketScores.pitchNegative)}</td>
            </tr>
          `,
        ).join("")}
      </tbody>
    </table>
  `
}

function formatRotationCenterResultCompact(result: RotationCenterDebugResult): string {
  return [
    `x ${formatNumber(result.pivotX)}`,
    `y ${formatNumber(result.pivotY)}`,
    `z ${formatNumber(result.pivotZ)}`,
    `total ${formatNumber(result.totalScore)}`,
    `pitch ${formatNumber(result.scoreDebug.pitchAverageScore)}`,
    `max ${formatNumber(result.scoreDebug.maxBucketScore)}`,
    `balanced ${formatNumber(result.scoreDebug.balancedScore)}`,
  ].join(" / ")
}

function renderQuick478DepthDebug(): void {
  const quick = state.quick478DepthDebug
  const statusElement = getElement("quick-depth-478-status")
  const summaryElement = getElement("quick-depth-478-summary")

  if (quick.status === "running") {
    statusElement.textContent =
      quick.message ?? buildQuick478DepthDebugProgressMessage()
    summaryElement.innerHTML = renderQuick478DepthDebugProgress()
    return
  }

  if (!quick.quickRun) {
    statusElement.textContent =
      quick.message ?? "capture JSON を読み込んでから実行してください。"
    summaryElement.innerHTML = ""
    return
  }

  statusElement.textContent = quick.message ?? formatQuick478DepthDebugMessage(quick.quickRun)
  summaryElement.innerHTML = renderStatusItems([
    ["status", quick.quickRun.status],
    ["semanticPointSetId", quick.quickRun.settings.semanticPointSetId],
    ["depth478GenerationMethod", quick.quickRun.settings.depth478GenerationMethod],
    ["perLandmarkZSearchEnabled", String(quick.quickRun.settings.perLandmarkZSearchEnabled)],
    ["noseTipGroup.z", formatNumber(quick.quickRun.summary.noseTipGroupZ)],
    ["cheekGroup.z", formatNumber(quick.quickRun.summary.cheekGroupZ)],
    ["margin", formatNumber(quick.quickRun.summary.margin)],
    ["violationCount", formatNumber(quick.quickRun.summary.violationCount)],
    [
      "smoothnessHighDeltaEdgeCount",
      formatNumber(quick.quickRun.summary.smoothnessHighDeltaEdgeCount),
    ],
    ["averageProjectionError", formatNumber(quick.quickRun.summary.averageProjectionError)],
    [
      "semantic point bound hits",
      formatNumber(quick.quickRun.summary.semanticPointBoundHitCount),
    ],
    [
      "perLandmark bound hits",
      `${formatNumber(quick.quickRun.summary.perLandmarkLowerBoundHitCount)} lower / ${formatNumber(quick.quickRun.summary.perLandmarkUpperBoundHitCount)} upper`,
    ],
    [
      "jawGroup lower hits",
      formatNumber(quick.quickRun.summary.jawGroupLowerBoundHitCount),
    ],
    [
      "faceBoundaryGroup lower hits",
      formatNumber(quick.quickRun.summary.faceBoundaryGroupLowerBoundHitCount),
    ],
    [
      "8pt brute force candidate count",
      formatNumber(quick.quickRun.summary.bruteforce8ptCandidateCount),
    ],
    ["best8pt score", formatNumber(quick.quickRun.summary.best8ptScore)],
    [
      "best8pt canonical delta",
      formatNumber(quick.quickRun.summary.best8ptCanonicalAverageAbsDelta),
    ],
    ["best12pt score", formatNumber(quick.quickRun.summary.best12ptScore)],
    [
      "best12pt canonical delta",
      formatNumber(quick.quickRun.summary.best12ptCanonicalAverageAbsDelta),
    ],
    ["raw best score", formatNumber(quick.quickRun.summary.rawBestScore)],
    ["structure-aware best score", formatNumber(quick.quickRun.summary.structureAwareBestScore)],
    ["raw best depth status", quick.quickRun.summary.rawBestDepthStatus ?? "-"],
    [
      "structure-aware best depth status",
      quick.quickRun.summary.structureAwareBestDepthStatus ?? "-",
    ],
    [
      "wouldChangeFinalCandidate",
      quick.quickRun.summary.wouldChangeFinalCandidate === null ||
      quick.quickRun.summary.wouldChangeFinalCandidate === undefined
        ? "-"
        : String(quick.quickRun.summary.wouldChangeFinalCandidate),
    ],
  ])
}

function buildQuick478DepthDebugProgressMessage(): string {
  const auto = state.autoSequence
  const comparison = state.quickSemanticPointSetComparison
  const sequence = auto.definition
  const stepCount = sequence?.steps.length ?? 0
  const currentStep = stepCount > 0 ? Math.min(auto.currentStepIndex + 1, stepCount) : 0
  const presetId = sequence?.steps[auto.currentStepIndex] ?? null
  const preset = presetId ? findSearchPreset(presetId) : null
  const progress = state.searchProgress
  const percent = formatPercent(progress.progressRate)
  const label = comparison
    ? `8pt / 12pt / 24pt comparison running... ${comparison.pointSetIds[comparison.activeIndex] ?? "-"}`
    : "478 Depth hardReject debug をバックグラウンドで実行中..."
  if (auto.status === "running" && preset) {
    return `${label} step ${currentStep}/${stepCount}: ${preset.label} / ${percent}%`
  }
  return `${label} ${percent}%`
}

function renderQuick478DepthDebugProgress(): string {
  const auto = state.autoSequence
  const sequence = auto.definition
  const progress = state.searchProgress
  const stepCount = sequence?.steps.length ?? 0
  const currentStep = stepCount > 0 ? Math.min(auto.currentStepIndex + 1, stepCount) : 0
  const presetId = sequence?.steps[auto.currentStepIndex] ?? null
  const preset = presetId ? findSearchPreset(presetId) : null
  const progressPercent = formatPercent(progress.progressRate)

  return `
    <div class="quick-progress" aria-label="Quick Run progress">
      <div class="quick-progress-bar">
        <div class="quick-progress-fill" style="width: ${progressPercent}%"></div>
      </div>
    </div>
    ${renderStatusItems([
      ["sequence", sequence?.label ?? "Rotation Center Balanced Sequence"],
      ["step", stepCount > 0 ? `${currentStep} / ${stepCount}` : "-"],
      ["preset", preset?.label ?? "-"],
      ["progress", `${progressPercent}%`],
      [
        "processed candidates",
        `${progress.processedCandidateCount} / ${progress.estimatedCandidateCount}`,
      ],
      ["current best score", formatNumber(auto.currentBestScore)],
      ["updatedAt", progress.updatedAt ?? "-"],
    ])}
  `
}

function renderEmptyState(): void {
  getElement("source-summary").innerHTML = `<p class="empty">captured JSON を読み込んでください。</p>`
  getElement("base-summary").innerHTML = `<p class="empty">未解析です。</p>`
  getElement("local-search-summary").innerHTML = `<p class="empty">未解析です。</p>`
  getElement("current8-overview").innerHTML = `<p class="empty">未解析です。</p>`
  getElement("current8-pose-comparison").innerHTML = `<p class="empty">未解析です。</p>`
  getElement("current8-bucket-summary").innerHTML = `<p class="empty">未解析です。</p>`
  getElement("current8-frame-table").innerHTML = `<p class="empty">未解析です。</p>`
  getElement("ranking-table").innerHTML = `<p class="empty">未解析です。</p>`
  getElement("result-summary").innerHTML = `<p class="empty">未解析です。</p>`
  getElement("auto-sequence-result").innerHTML = `<p class="empty">未解析です。</p>`
  getElement("best-candidate").innerHTML = `<p class="empty">未解析です。</p>`
  renderOutlierFrameDebug(null, DEFAULT_OUTLIER_FILTERING_SETTINGS)
  renderDepthRelationDebug(null, DEFAULT_DEPTH_RELATION_FILTERING_SETTINGS)
  renderDepth478Prototype(null)
  renderProjectionSignDebug(null)
  renderRotationCenterDebug(null)
  renderBucketTargetWarning()
  renderCandidateStabilityDebug()
  getElement("best-ideal-face8-summary").innerHTML = `<p class="empty">未解析です。</p>`
  getElement("best-ideal-face8-table").innerHTML = `<p class="empty">未解析です。</p>`
  getElement("depth-relation").innerHTML = renderDepthConvention(DEPTH_CONVENTION)
  getElement("bucket-ranking").innerHTML = `<p class="empty">未解析です。</p>`
  getElement("error-summary").innerHTML = `<p class="empty">未解析です。</p>`
  getElement("warnings").textContent = ""
  getElement("json-preview").textContent = JSON.stringify(
    {
      schemaVersion: "ideal_face_fitting_lab_analysis_summary_v1",
      depthConvention: DEPTH_CONVENTION,
      semanticIndexDebug: buildSemanticIndexDebug(),
      note: "captured JSON import 後に summary を表示します。",
    },
    null,
    2,
  )
  renderAutoSequenceStatus()
  renderQuick478DepthDebug()
}

function renderSemanticMapping(): void {
  getElement("semantic-index-table").innerHTML = `
    <table>
      <thead>
        <tr>
          <th>semantic point</th>
          <th>表示名</th>
          <th>primary index</th>
          <th>fallback index</th>
          <th>weight</th>
        </tr>
      </thead>
      <tbody>
        ${SEMANTIC_DEFINITIONS.map(
          (definition) => `
            <tr>
              <td><code>${definition.name}</code></td>
              <td>${definition.label}</td>
              <td><code>${definition.primaryIndices.join(", ")}</code></td>
              <td><code>${definition.fallbackIndices?.join(", ") ?? "-"}</code></td>
              <td>${definition.weight}</td>
            </tr>
          `,
        ).join("")}
      </tbody>
    </table>
  `
}

function renderCurrent8Overview(debug: Current8DebugSummary): string {
  return renderStatusItems([
    ["selected frame count", String(debug.selectedFrameCount)],
    ["current8 frame count", String(debug.current8PointsByFrame.length)],
    ["points coordinate", debug.coordinateSpace.points],
    ["rawImageNormalizedPoints", debug.coordinateSpace.rawImageNormalizedPoints],
    ["sameUnitPoints", debug.coordinateSpace.sameUnitPoints],
    ["warnings", debug.current8Warnings.length === 0 ? "-" : debug.current8Warnings.join(" / ")],
  ])
}

function renderCurrent8PoseComparison(comparison: Current8PoseComparison): string {
  return renderStatusItems([
    ["front aspectRatio", formatNumber(comparison.frontAspectRatio)],
    ["yawPositive aspectRatio", formatNumber(comparison.yawPositiveAspectRatio)],
    ["yawNegative aspectRatio", formatNumber(comparison.yawNegativeAspectRatio)],
    [
      "yawPositive / front",
      formatNumber(comparison.yawPositiveAspectRatioRatioToFront),
    ],
    [
      "yawNegative / front",
      formatNumber(comparison.yawNegativeAspectRatioRatioToFront),
    ],
    ["front cheekWidth", formatNumber(comparison.frontCheekWidth)],
    ["yawPositive cheekWidth", formatNumber(comparison.yawPositiveCheekWidth)],
    ["yawNegative cheekWidth", formatNumber(comparison.yawNegativeCheekWidth)],
    ["front eyeDistance", formatNumber(comparison.frontEyeDistance)],
    ["yawPositive eyeDistance", formatNumber(comparison.yawPositiveEyeDistance)],
    ["yawNegative eyeDistance", formatNumber(comparison.yawNegativeEyeDistance)],
    [
      "yawPositive narrower",
      formatBooleanOrNull(comparison.interpretation.yawPositiveLooksNarrowerThanFront),
    ],
    [
      "yawNegative narrower",
      formatBooleanOrNull(comparison.interpretation.yawNegativeLooksNarrowerThanFront),
    ],
  ])
}

function renderCurrent8BucketSummaryTable(
  summary: Record<CaptureBucket, Current8BucketSummaryEntry>,
): string {
  return `
    <table>
      <thead>
        <tr>
          <th>bucket</th>
          <th>sampleCount</th>
          <th>aspectRatio avg</th>
          <th>aspectRatio min</th>
          <th>aspectRatio max</th>
          <th>cheekWidth</th>
          <th>eyeDistance</th>
          <th>noseX</th>
        </tr>
      </thead>
      <tbody>
        ${BUCKETS.map((bucket) => {
          const item = summary[bucket]
          return `
            <tr>
              <td><code>${bucket}</code></td>
              <td>${item.sampleCount}</td>
              <td>${formatNumber(item.averageAspectRatio)}</td>
              <td>${formatNumber(item.minAspectRatio)}</td>
              <td>${formatNumber(item.maxAspectRatio)}</td>
              <td>${formatNumber(item.averageCheekWidth)}</td>
              <td>${formatNumber(item.averageEyeDistance)}</td>
              <td>${formatNumber(item.averageNoseX)}</td>
            </tr>
          `
        }).join("")}
      </tbody>
    </table>
  `
}

function renderCurrent8FrameTable(entries: Current8MetricsFrame[]): string {
  if (entries.length === 0) {
    return `<p class="empty">current 8 frame はありません。</p>`
  }
  return `
    <table>
      <thead>
        <tr>
          <th>captureId</th>
          <th>bucket</th>
          <th>yaw</th>
          <th>pitch</th>
          <th>roll</th>
          <th>aspectRatio</th>
          <th>cheekWidth</th>
          <th>eyeDistance</th>
          <th>noseX</th>
        </tr>
      </thead>
      <tbody>
        ${entries.map(
          (entry) => `
            <tr>
              <td><code>${entry.captureId}</code></td>
              <td><code>${entry.bucket}</code></td>
              <td>${formatNumber(entry.pose.yaw)}</td>
              <td>${formatNumber(entry.pose.pitch)}</td>
              <td>${formatNumber(entry.pose.roll)}</td>
              <td>${formatNumber(entry.metrics.aspectRatio)}</td>
              <td>${formatNumber(entry.metrics.cheekWidth)}</td>
              <td>${formatNumber(entry.metrics.eyeDistance)}</td>
              <td>${formatNumber(entry.metrics.noseX)}</td>
            </tr>
          `,
        ).join("")}
      </tbody>
    </table>
  `
}

function renderIdealFace8Summary(idealFace8: BestIdealFace8): string {
  return renderStatusItems([
    ["schemaVersion", idealFace8.schemaVersion],
    ["coordinateSpace", idealFace8.coordinateSpace],
    ["zApplication", idealFace8.source.zApplication],
    ["pivotZ", formatNumber(idealFace8.source.pivotZ)],
    ["rotationCenter", formatRotationCenter(idealFace8.source.rotationCenter)],
    ["pointCount", String(idealFace8.summary.pointCount)],
    ["bounds", formatBounds(idealFace8.summary.bounds)],
    ["zRange", formatNumber(idealFace8.summary.zRange)],
    ["nextStep", idealFace8.metadata.intendedNextStep],
  ])
}

function renderIdealFace8Table(points: IdealFace8Point[]): string {
  if (points.length === 0) {
    return `<p class="empty">points はありません。</p>`
  }
  return `
    <table>
      <thead>
        <tr>
          <th>name</th>
          <th>x</th>
          <th>y</th>
          <th>z</th>
        </tr>
      </thead>
      <tbody>
        ${points.map(
          (point) => `
            <tr>
              <td><code>${point.name}</code></td>
              <td>${formatNumber(point.x)}</td>
              <td>${formatNumber(point.y)}</td>
              <td>${formatNumber(point.z)}</td>
            </tr>
          `,
        ).join("")}
      </tbody>
    </table>
  `
}

function renderDepthRelation(
  depthRelation: DepthRelation,
  depthConvention: DepthConvention,
): string {
  return renderStatusItems([
    ["depthConvention", `${depthConvention.smallerZ} / ${depthConvention.largerZ}`],
    ["note", depthConvention.note],
    ["noseZ", formatNumber(depthRelation.noseZ)],
    ["leftCheekZ", formatNumber(depthRelation.leftCheekZ)],
    ["rightCheekZ", formatNumber(depthRelation.rightCheekZ)],
    ["averageCheekZ", formatNumber(depthRelation.averageCheekZ)],
    ["noseIsInFrontOfCheeks", String(depthRelation.noseIsInFrontOfCheeks)],
    ["leftRightCheekZDelta", formatNumber(depthRelation.leftRightCheekZDelta)],
    ["leftRightEyeZDelta", formatNumber(depthRelation.leftRightEyeZDelta)],
  ])
}

function renderDepthConvention(depthConvention: DepthConvention): string {
  return renderStatusItems([
    ["smallerZ", depthConvention.smallerZ],
    ["largerZ", depthConvention.largerZ],
    ["note", depthConvention.note],
  ])
}

function renderLocalSearchSummary(analysis: AnalysisResult): string {
  if (analysis.searchMode === "fullGrid") {
    return renderStatusItems([
      ["searchMode", "fullGrid"],
      ["note", "full grid search を実行しました。"],
    ])
  }

  const summary = analysis.localSearchSummary
  const settings = analysis.localSearchSettings
  const latestStep = summary?.steps.at(-1) ?? null
  return renderStatusItems([
    ["searchMode", analysis.searchMode],
    ["objectiveMode", analysis.searchSettings.objectiveMode],
    ["targetParameter", settings?.targetParameter ?? "-"],
    ["localRange", settings ? `${formatNumber(settings.localMin)} - ${formatNumber(settings.localMax)} / step ${formatNumber(settings.localStep)}` : "-"],
    ["coordinateDescentIterations", settings ? String(settings.coordinateDescentIterations) : "-"],
    ["coordinateDescentOrder", settings?.coordinateDescentParameterOrder.join(" -> ") ?? "-"],
    ["initialCandidate", summary ? JSON.stringify(summary.initialCandidate) : "-"],
    ["finalCandidate", summary ? JSON.stringify(summary.finalCandidate) : "-"],
    ["stepCount", summary ? String(summary.steps.length) : "0"],
    [
      "latestStep",
      latestStep
        ? `${latestStep.iteration}: ${latestStep.parameter} ${formatNumber(latestStep.previousValue)} -> ${formatNumber(latestStep.bestValue)} / score ${formatNumber(latestStep.bestScore)} / candidates ${latestStep.candidateCount}`
        : "-",
    ],
  ])
}

function renderRankingTable(entries: RankingEntry[]): string {
  if (entries.length === 0) {
    return `<p class="empty">ranking はありません。</p>`
  }
  return `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>candidateId</th>
          <th>objective</th>
          <th>objectiveBeforeDepth</th>
          <th>objectiveScore</th>
          <th>totalScore</th>
          <th>front</th>
          <th>yaw+</th>
          <th>yaw-</th>
          <th>pitch+</th>
          <th>pitch-</th>
          <th>mixed</th>
          <th>balanced</th>
          <th>depth passed</th>
          <th>depth penalty</th>
          <th>legacy pivotZ</th>
          <th>rotationCenter.y</th>
          <th>rotationCenter.z</th>
          ${SEMANTIC_POINT_NAMES.map((name) => `<th>${name}.z</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${entries.map(
          (entry, index) => `
            <tr>
              <td>${entry.rank || index + 1}</td>
              <td><code>${entry.candidateId}</code></td>
              <td><code>${entry.objectiveMode}</code></td>
              <td>${formatNumber(entry.objectiveScoreBeforeDepthFilter)}</td>
              <td>${formatNumber(entry.objectiveScore)}</td>
              <td>${formatNumber(entry.totalScore)}</td>
              <td>${formatNumber(entry.bucketScores.front)}</td>
              <td>${formatNumber(entry.bucketScores.yawPositive)}</td>
              <td>${formatNumber(entry.bucketScores.yawNegative)}</td>
              <td>${formatNumber(entry.bucketScores.pitchPositive)}</td>
              <td>${formatNumber(entry.bucketScores.pitchNegative)}</td>
              <td>${formatNumber(entry.bucketScores.mixedPose)}</td>
              <td>${formatNumber(entry.scoreDebug?.balancedScore)}</td>
              <td>${String(entry.depthRelationDebug ? entry.depthRelationDebug.hardRejectViolationCount === 0 : false)}</td>
              <td>${formatNumber(entry.depthRelationDebug?.penalty)}</td>
              <td>${formatNumber(entry.candidate.pivotZ)}</td>
              <td>${formatNumber(getCandidateRotationCenter(entry.candidate).y)}</td>
              <td>${formatNumber(getCandidateRotationCenter(entry.candidate).z)}</td>
              ${SEMANTIC_POINT_NAMES.map(
                (name) => `<td>${formatNumber(entry.candidate.zByPointId[name])}</td>`,
              ).join("")}
            </tr>
          `,
        ).join("")}
      </tbody>
    </table>
  `
}

function renderBucketRanking(bucketRanking: Record<CaptureBucket, RankingEntry[]>): string {
  return `
    <table>
      <thead>
        <tr>
          <th>bucket</th>
          <th>top candidates</th>
        </tr>
      </thead>
      <tbody>
        ${BUCKETS.map(
          (bucket) => `
            <tr>
              <td><code>${bucket}</code></td>
              <td>${bucketRanking[bucket]
                .map(
                  (entry, index) =>
                    `${index + 1}. ${entry.candidateId} / score ${formatNumber(entry.totalScore)}`,
                )
                .join("<br />") || "-"}</td>
            </tr>
          `,
        ).join("")}
      </tbody>
    </table>
  `
}

function setButtons(): void {
  const isRunning = state.searchProgress.status === "running"
  const isAutoRunning = state.autoSequence.status === "running"
  const isQuickRunning = state.quick478DepthDebug.status === "running"
  getElement<HTMLButtonElement>("run-quick-depth-478-button").disabled = isRunning || isAutoRunning || isQuickRunning
  getElement<HTMLButtonElement>("run-analysis-button").disabled = state.frames.length === 0 || isRunning || isAutoRunning
  getElement<HTMLButtonElement>("cancel-analysis-button").disabled = !isRunning
  getElement<HTMLButtonElement>("copy-debug-button").disabled = !state.analysis || isRunning || isAutoRunning
  getElement<HTMLButtonElement>("apply-search-preset-button").disabled = isRunning || isAutoRunning
  getElement<HTMLButtonElement>("apply-base-candidate-preset-button").disabled = isRunning || isAutoRunning
  getElement<HTMLButtonElement>("apply-bucket-target-preset-button").disabled = isRunning || isAutoRunning
  getElement<HTMLButtonElement>("run-auto-sequence-button").disabled = state.frames.length === 0 || isRunning || isAutoRunning
  getElement<HTMLButtonElement>("cancel-auto-sequence-button").disabled = !isAutoRunning
  getElement<HTMLButtonElement>("use-best-candidate-button").disabled = !state.analysis?.bestCandidate || isRunning || isAutoRunning
  getElement<HTMLButtonElement>("generate-depth-478-button").disabled =
    !state.analysis || isRunning || isAutoRunning
  getElement<HTMLButtonElement>("export-depth-478-button").disabled =
    !state.analysis?.depth478Prototype?.generatedCandidate || isRunning || isAutoRunning
  getElement<HTMLButtonElement>("export-full-button").disabled = !state.analysis || isRunning || isAutoRunning
  getElement<HTMLButtonElement>("export-summary-button").disabled = !state.analysis || isRunning || isAutoRunning
  getElement<HTMLButtonElement>("run-stability-check-button").disabled =
    state.frames.length === 0 || isRunning || isAutoRunning
  getElement<HTMLButtonElement>("add-stability-history-button").disabled =
    !state.analysis?.autoSequenceSummary || isRunning || isAutoRunning
  getElement<HTMLButtonElement>("clear-stability-history-button").disabled =
    isRunning || isAutoRunning || state.stabilityHistory.length === 0
}

function extractSemanticPoints2D(
  landmarks: LandmarkPoint[],
  aspectRatio: number,
): SemanticPointSet2D | null {
  const points = {} as SemanticPointSet2D
  for (const definition of SEMANTIC_DEFINITIONS) {
    const point =
      averageByIndices(landmarks, definition.primaryIndices) ??
      (definition.fallbackIndices ? averageByIndices(landmarks, definition.fallbackIndices) : null)
    if (!point) {
      return null
    }
    points[definition.name] = {
      name: definition.name,
      x: toSameUnitX(point.x, aspectRatio),
      y: point.y - 0.5,
    }
  }
  return points
}

function calculateLandmarkBounds(landmarks: LandmarkPoint[], aspectRatio: number): Bounds2D | null {
  if (landmarks.length === 0) {
    return null
  }
  return calculateBounds2D(
    landmarks.map((landmark) => ({
      x: toSameUnitX(landmark.x, aspectRatio),
      y: landmark.y - 0.5,
    })),
  )
}

function normalizeBucket(bucket: string): CaptureBucket {
  if (bucket.startsWith("yawPositive")) {
    return "yawPositive"
  }
  if (bucket.startsWith("yawNegative")) {
    return "yawNegative"
  }
  if (
    bucket === "front" ||
    bucket === "pitchPositive" ||
    bucket === "pitchNegative" ||
    bucket === "mixedPose"
  ) {
    return bucket
  }
  return "unknown"
}

function normalizeLandmark(value: unknown, fallbackIndex: number): LandmarkPoint {
  if (!isRecord(value)) {
    return { index: fallbackIndex, x: 0, y: 0, z: 0 }
  }
  return {
    index: toNumber(value.index, fallbackIndex),
    x: toNumber(value.x, 0),
    y: toNumber(value.y, 0),
    z: toNumber(value.z, 0),
  }
}

function normalizePose(value: unknown): Pose | null {
  if (!isRecord(value)) {
    return null
  }
  return {
    yaw: toNumber(value.yaw, 0),
    pitch: toNumber(value.pitch, 0),
    roll: toNumber(value.roll, 0),
  }
}

function normalizeBlendshape(value: unknown): BlendshapeCapture {
  if (!isRecord(value)) {
    return { categoryName: "unknown", score: 0 }
  }
  return {
    categoryName: String(value.categoryName ?? value.name ?? "unknown"),
    score: toNumber(value.score, 0),
  }
}

function toRankingEntry(candidate: CandidateResult, rank: number): RankingEntry {
  const scoreDebug = candidate.scoreDebug ?? calculateScoreDebug(candidate.totalScore, candidate.bucketScores)
  const objectiveMode = isObjectiveMode(candidate.objectiveMode)
    ? candidate.objectiveMode
    : DEFAULT_SETTINGS.objectiveMode
  return {
    rank,
    candidateId: candidate.candidateId,
    objectiveMode,
    objectiveScoreBeforeDepthFilter:
      typeof candidate.objectiveScoreBeforeDepthFilter === "number"
        ? round(candidate.objectiveScoreBeforeDepthFilter)
        : undefined,
    objectiveScore: round(
      typeof candidate.objectiveScore === "number"
        ? candidate.objectiveScore
        : getObjectiveScore({ totalScore: candidate.totalScore, scoreDebug }, objectiveMode),
    ),
    totalScore: round(candidate.totalScore),
    bucketScores: roundRecord(candidate.bucketScores),
    scoreDebug: roundScoreDebug(scoreDebug),
    candidate: {
      pivotZ: round(candidate.pivotZ),
      rotationCenter: getCandidateRotationCenter(candidate),
      zByPointId: roundRecord(candidate.zByPointId),
    },
    weightedSemanticDistance: round(candidate.weightedSemanticDistance),
    averageSemanticDistance: round(candidate.averageSemanticDistance),
    sampleCount: candidate.sampleCount,
    depthRelationDebug: candidate.depthRelationDebug,
  }
}

function emptyBucketRanking(): Record<CaptureBucket, RankingEntry[]> {
  return {
    front: [],
    yawPositive: [],
    yawNegative: [],
    pitchPositive: [],
    pitchNegative: [],
    mixedPose: [],
    unknown: [],
  }
}

function emptyPointSummary(): Record<SemanticPointName, null> {
  return {
    headTop: null,
    chin: null,
    leftCheek: null,
    rightCheek: null,
    leftEye: null,
    rightEye: null,
    nose: null,
    mouth: null,
    noseBridge: null,
    leftJaw: null,
    rightJaw: null,
    upperFaceCenter: null,
  }
}

function buildSemanticIndexDebug(): Record<SemanticPointName, number[]> {
  return Object.fromEntries(
    SEMANTIC_DEFINITIONS.map((definition) => [definition.name, definition.primaryIndices]),
  ) as Record<SemanticPointName, number[]>
}

function averageByIndices(points: LandmarkPoint[], indices: number[]): Point3 | null {
  const indexedPoints = indices
    .map((index) => points.find((point) => point.index === index))
    .filter((point): point is LandmarkPoint => Boolean(point))

  if (indexedPoints.length !== indices.length) {
    return null
  }

  return {
    x: average(indexedPoints.map((point) => point.x)) ?? 0,
    y: average(indexedPoints.map((point) => point.y)) ?? 0,
    z: average(indexedPoints.map((point) => point.z)) ?? 0,
  }
}

function averagePoint2D(points: Point2[]): Point2 {
  return {
    x: average(points.map((point) => point.x)) ?? 0,
    y: average(points.map((point) => point.y)) ?? 0,
  }
}

function calculateBounds2D(points: Point2[]): Bounds2D {
  const xValues = points.map((point) => point.x)
  const yValues = points.map((point) => point.y)
  const xMin = min(xValues) ?? 0
  const xMax = max(xValues) ?? 0
  const yMin = min(yValues) ?? 0
  const yMax = max(yValues) ?? 0
  return {
    xMin,
    xMax,
    yMin,
    yMax,
    width: xMax - xMin,
    height: yMax - yMin,
    centerX: (xMin + xMax) / 2,
    centerY: (yMin + yMax) / 2,
  }
}

function countFrameBuckets(frames: NormalizedFrame[]): Record<CaptureBucket, number> {
  return BUCKETS.reduce(
    (counts, bucket) => {
      counts[bucket] = frames.filter((frame) => frame.bucket === bucket).length
      return counts
    },
    {} as Record<CaptureBucket, number>,
  )
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

function formatBucketCounts(counts: Record<CaptureBucket, number>): string {
  return BUCKETS.map((bucket) => `${bucket}: ${counts[bucket] ?? 0}`).join(" / ")
}

function formatBounds(bounds: Bounds2D | null): string {
  if (!bounds) {
    return "-"
  }
  return `center ${formatNumber(bounds.centerX)}, ${formatNumber(bounds.centerY)} / size ${formatNumber(bounds.width)} x ${formatNumber(bounds.height)}`
}

function toSameUnitX(x: number, aspectRatio: number): number {
  return (x - 0.5) * aspectRatio
}

function safeRatio(value: number | null, base: number | null): number | null {
  if (value === null || base === null || Math.abs(base) <= EPSILON) {
    return null
  }
  return round(value / base)
}

function calculateScoreDebug(
  totalScore: number,
  bucketScores: PoseBucketScores,
): CandidateScoreDebug {
  const yawAverageScore = averageNullable([
    bucketScores.yawPositive,
    bucketScores.yawNegative,
  ])
  const pitchAverageScore = averageNullable([
    bucketScores.pitchPositive,
    bucketScores.pitchNegative,
  ])
  const maxBucketScore = maxNullable([
    bucketScores.front,
    bucketScores.yawPositive,
    bucketScores.yawNegative,
    bucketScores.pitchPositive,
    bucketScores.pitchNegative,
    bucketScores.mixedPose,
  ])

  return {
    yawAverageScore: roundNullable(yawAverageScore),
    pitchAverageScore: roundNullable(pitchAverageScore),
    maxBucketScore: roundNullable(maxBucketScore),
    balancedScore: round(totalScore + (maxBucketScore ?? 0) * 0.25),
  }
}

function getObjectiveScore(
  result: {
    totalScore: number
    scoreDebug: CandidateScoreDebug
    objectiveMode?: ObjectiveMode
    objectiveScore?: number
  },
  objectiveMode: ObjectiveMode,
): number {
  if (result.objectiveMode === objectiveMode && typeof result.objectiveScore === "number") {
    return result.objectiveScore
  }
  switch (objectiveMode) {
    case "totalScore":
      return result.totalScore
    case "balancedScore":
      return result.scoreDebug.balancedScore ?? Number.POSITIVE_INFINITY
    case "maxBucketScore":
      return result.scoreDebug.maxBucketScore ?? Number.POSITIVE_INFINITY
    case "pitchAverageScore":
      return result.scoreDebug.pitchAverageScore ?? Number.POSITIVE_INFINITY
    case "yawAverageScore":
      return result.scoreDebug.yawAverageScore ?? Number.POSITIVE_INFINITY
  }
}

function distance2D(current: Point2, next: Point2): number {
  return Math.hypot(current.x - next.x, current.y - next.y)
}

function weightedAverage(items: Array<{ value: number; weight: number }>): number {
  const weightTotal = items.reduce((total, item) => total + item.weight, 0)
  if (weightTotal <= EPSILON) {
    return 0
  }
  return items.reduce((total, item) => total + item.value * item.weight, 0) / weightTotal
}

function range(values: number[]): RangeSummary {
  return {
    min: min(values),
    max: max(values),
  }
}

function min(values: number[]): number | null {
  const finite = values.filter(Number.isFinite)
  return finite.length === 0 ? null : Math.min(...finite)
}

function max(values: number[]): number | null {
  const finite = values.filter(Number.isFinite)
  return finite.length === 0 ? null : Math.max(...finite)
}

function average(values: number[]): number | null {
  const finite = values.filter(Number.isFinite)
  return finite.length === 0
    ? null
    : finite.reduce((total, value) => total + value, 0) / finite.length
}

function median(values: number[]): number | null {
  const finite = values.filter(Number.isFinite).sort((a, b) => a - b)
  if (finite.length === 0) {
    return null
  }
  const middle = Math.floor(finite.length / 2)
  return finite.length % 2 === 0
    ? (finite[middle - 1] + finite[middle]) / 2
    : finite[middle]
}

function averageNullable(values: Array<number | null>): number | null {
  return average(values.filter((value): value is number => typeof value === "number"))
}

function minNullable(values: Array<number | null>): number | null {
  const finite = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value))
  return finite.length === 0 ? null : Math.min(...finite)
}

function maxNullable(values: Array<number | null>): number | null {
  const finite = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value))
  return finite.length === 0 ? null : Math.max(...finite)
}

function readNumber(id: string, fallback: number): number {
  const value = Number(getElement<HTMLInputElement>(id).value)
  return Number.isFinite(value) ? value : fallback
}

function toNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : Number(value) || fallback
}

function clamp(value: number, minValue: number, maxValue: number): number {
  return Math.min(Math.max(value, minValue), maxValue)
}

function round(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value
}

function roundNullable(value: number | null): number | null {
  return value === null ? null : round(value)
}

function roundPose(pose: Pose): Pose {
  return {
    yaw: round(pose.yaw),
    pitch: round(pose.pitch),
    roll: round(pose.roll),
  }
}

function roundSemanticPointSet(points: SemanticPointSet2D): SemanticPointSet2D {
  const result = {} as SemanticPointSet2D
  for (const name of SEMANTIC_POINT_NAMES) {
    result[name] = {
      name,
      x: round(points[name].x),
      y: round(points[name].y),
    }
  }
  return result
}

function roundBounds2DWithAspectRatio(bounds: Bounds2DWithAspectRatio): Bounds2DWithAspectRatio {
  return {
    xMin: round(bounds.xMin),
    xMax: round(bounds.xMax),
    yMin: round(bounds.yMin),
    yMax: round(bounds.yMax),
    width: round(bounds.width),
    height: round(bounds.height),
    centerX: round(bounds.centerX),
    centerY: round(bounds.centerY),
    aspectRatio: round(bounds.aspectRatio),
  }
}

function roundCurrent8Metrics(metrics: Current8Metrics): Current8Metrics {
  return {
    aspectRatio: round(metrics.aspectRatio),
    eyeDistance: round(metrics.eyeDistance),
    cheekWidth: round(metrics.cheekWidth),
    noseToEyeCenterX: round(metrics.noseToEyeCenterX),
    noseToMouthY: round(metrics.noseToMouthY),
    noseX: round(metrics.noseX),
    mouthX: round(metrics.mouthX),
    leftCheekX: round(metrics.leftCheekX),
    rightCheekX: round(metrics.rightCheekX),
    leftEyeX: round(metrics.leftEyeX),
    rightEyeX: round(metrics.rightEyeX),
  }
}

function roundRecord<T extends Record<string, number | null>>(record: T): T {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      typeof value === "number" ? round(value) : value,
    ]),
  ) as T
}

function roundPointRecord<T extends Record<string, Point2>>(record: T): T {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      {
        x: round(value.x),
        y: round(value.y),
      },
    ]),
  ) as T
}

function roundScoreDebug(scoreDebug: CandidateScoreDebug): CandidateScoreDebug {
  return {
    yawAverageScore: roundNullable(scoreDebug.yawAverageScore),
    pitchAverageScore: roundNullable(scoreDebug.pitchAverageScore),
    maxBucketScore: roundNullable(scoreDebug.maxBucketScore),
    balancedScore: round(scoreDebug.balancedScore),
  }
}

function formatNumber(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(6) : "-"
}

function formatCandidateCompact(candidate: FittingCandidate8): string {
  const rotationCenter = getCandidateRotationCenter(candidate)
  return [
    `pivotZ=${formatNumber(candidate.pivotZ)}`,
    `rotationCenter=(${formatNumber(rotationCenter.x)}, ${formatNumber(rotationCenter.y)}, ${formatNumber(rotationCenter.z)})`,
    ...SEMANTIC_POINT_NAMES.map(
      (name) => `${name}.z=${formatNumber(candidate.zByPointId[name])}`,
    ),
  ].join(" / ")
}

function formatRotationCenter(rotationCenter: RotationCenter): string {
  return `x=${formatNumber(rotationCenter.x)} / y=${formatNumber(rotationCenter.y)} / z=${formatNumber(rotationCenter.z)}`
}

function formatPercent(value: number): string {
  return Number.isFinite(value) ? (value * 100).toFixed(2) : "0.00"
}

function formatBooleanOrNull(value: boolean | null): string {
  return value === null ? "-" : String(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
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

function createFileName(prefix: string): string {
  const date = new Date()
  const pad = (value: number): string => String(value).padStart(2, "0")
  return `${prefix}_${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}.json`
}

function getElement<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id)
  if (!element) {
    throw new Error(`#${id} is missing`)
  }
  return element as T
}
