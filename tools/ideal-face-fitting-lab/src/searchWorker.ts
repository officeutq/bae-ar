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

interface Point2 {
  x: number
  y: number
}

interface Point3 extends Point2 {
  z: number
}

interface Pose {
  yaw: number
  pitch: number
  roll: number
}

interface SemanticPoint2D extends Point2 {
  name: SemanticPointName
}

type SemanticPointSet2D = Record<SemanticPointName, SemanticPoint2D>
type SemanticPointSet3D = Record<SemanticPointName, Point3>

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

interface SearchFrame {
  captureId: string
  bucket: CaptureBucket
  rawBucket?: string | null
  pose: Pose
  semanticPoints: SemanticPointSet2D
  bounds: Bounds2D
  warnings: string[]
}

interface SearchSettings {
  semanticPointSetId: SemanticPointSetId
  searchMode: SearchMode
  objectiveMode: ObjectiveMode
  outlierFiltering?: OutlierFilteringSettings
  depthRelationFiltering?: DepthRelationFilteringSettings
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
type OutlierFilteringMode = "off" | "debugOnly" | "excludeFromInference"
type OutlierFilteringMethod = "medianMultiplier" | "medianAbsoluteDelta" | "topWorstPercent"
type LocalSearchParameter = "pivotZ" | "rotationCenter.y" | "rotationCenter.z" | `${SemanticPointName}.z`

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

interface CandidateResult extends CandidateDefinition {
  averageSemanticDistance: number
  weightedSemanticDistance: number
  perPointError: Record<SemanticPointName, number>
  bucketScores: PoseBucketScores
  scoreDebug: CandidateScoreDebug
  objectiveMode: ObjectiveMode
  objectiveScoreBeforeDepthFilter: number
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

interface RankingEntry {
  rank: number
  candidateId: string
  objectiveMode: ObjectiveMode
  objectiveScoreBeforeDepthFilter?: number
  objectiveScore: number
  totalScore: number
  bucketScores: PoseBucketScores
  scoreDebug: CandidateScoreDebug
  candidate: FittingCandidate8
  weightedSemanticDistance: number
  averageSemanticDistance: number
  sampleCount: number
  depthRelationDebug?: DepthRelationDebug
}

interface WorkerStartMessage {
  type: "start"
  basePoints: SemanticPointSet2D
  frames: SearchFrame[]
  settings: SearchSettings
  chunkSize?: number
}

interface WorkerCancelMessage {
  type: "cancel"
}

type WorkerInputMessage = WorkerStartMessage | WorkerCancelMessage

interface WorkerProgressMessage {
  type: "progress"
  processedCandidateCount: number
  estimatedCandidateCount: number
  topCandidates: RankingEntry[]
  rawRanking?: RankingEntry[]
  depthFilteredRanking?: RankingEntry[]
  bucketRanking: Record<CaptureBucket, RankingEntry[]>
  rejectedCandidateCount?: number
}

interface WorkerCompleteMessage extends WorkerProgressMessage {
  type: "complete"
  bestCandidate: CandidateResult | null
  localSearchSummary?: LocalSearchSummary
  depthRelationDebug: AnalysisDepthRelationDebug
  warnings: string[]
}

interface WorkerCancelledMessage {
  type: "cancelled"
  processedCandidateCount: number
  estimatedCandidateCount: number
}

interface WorkerErrorMessage {
  type: "error"
  error: string
}

type WorkerOutputMessage =
  | WorkerProgressMessage
  | WorkerCompleteMessage
  | WorkerCancelledMessage
  | WorkerErrorMessage

const SEMANTIC_POINT_NAMES: SemanticPointName[] = [
  "headTop",
  "chin",
  "leftCheek",
  "rightCheek",
  "leftEye",
  "rightEye",
  "nose",
  "mouth",
  "noseBridge",
  "leftJaw",
  "rightJaw",
  "upperFaceCenter",
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

const SCORE_WEIGHTS: Record<SemanticPointName, number> = {
  headTop: 0.75,
  chin: 1,
  leftCheek: 1,
  rightCheek: 1,
  leftEye: 1.45,
  rightEye: 1.45,
  nose: 1.7,
  mouth: 1.2,
  noseBridge: 1.35,
  leftJaw: 1.15,
  rightJaw: 1.15,
  upperFaceCenter: 1.15,
  leftNoseSide: 1.15,
  rightNoseSide: 1.15,
  leftEyeOuter: 1.15,
  rightEyeOuter: 1.15,
  leftEyeInner: 1.15,
  rightEyeInner: 1.15,
  leftTemple: 1.15,
  rightTemple: 1.15,
  leftMouthCorner: 0.65,
  rightMouthCorner: 0.65,
  lowerJawLeft: 1.15,
  lowerJawRight: 1.15,
}

const STRUCTURE_24_SCORE_WEIGHTS: Record<SemanticPointName, number> = {
  ...SCORE_WEIGHTS,
  headTop: 1.15,
  chin: 1.7,
  leftCheek: 1.7,
  rightCheek: 1.7,
  leftEye: 1.15,
  rightEye: 1.15,
  nose: 1.7,
  mouth: 0.65,
  noseBridge: 1.7,
  leftJaw: 1.15,
  rightJaw: 1.15,
  upperFaceCenter: 1.15,
  leftNoseSide: 1.15,
  rightNoseSide: 1.15,
  leftEyeOuter: 1.15,
  rightEyeOuter: 1.15,
  leftEyeInner: 1.15,
  rightEyeInner: 1.15,
  leftTemple: 1.15,
  rightTemple: 1.15,
  leftMouthCorner: 0.65,
  rightMouthCorner: 0.65,
  lowerJawLeft: 1.15,
  lowerJawRight: 1.15,
}

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

function getSemanticPointNames(pointSetId: SemanticPointSetId): SemanticPointName[] {
  if (pointSetId === "24pt_structure") {
    return STRUCTURE_24_SEMANTIC_POINT_NAMES
  }
  return pointSetId === "12pt_rotation_center"
    ? ROTATION_CENTER_12_SEMANTIC_POINT_NAMES
    : BASIC_8_SEMANTIC_POINT_NAMES
}

function getScoreWeights(pointSetId: SemanticPointSetId): Record<SemanticPointName, number> {
  return pointSetId === "24pt_structure" ? STRUCTURE_24_SCORE_WEIGHTS : SCORE_WEIGHTS
}

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

const BUCKETS: CaptureBucket[] = [
  "front",
  "yawPositive",
  "yawNegative",
  "pitchPositive",
  "pitchNegative",
  "mixedPose",
  "unknown",
]

const EPSILON = 1e-8
const DEFAULT_CHUNK_SIZE = 1000

let cancelRequested = false

self.onmessage = (event: MessageEvent<WorkerInputMessage>): void => {
  const message = event.data
  if (message.type === "cancel") {
    cancelRequested = true
    return
  }

  cancelRequested = false
  runSearch(message).catch((error: unknown) => {
    postMessageToMain({
      type: "error",
      error: error instanceof Error ? error.message : String(error),
    })
  })
}

async function runSearch(message: WorkerStartMessage): Promise<void> {
  const candidateSource = createCandidateSource(message.settings)
  const estimatedCandidateCount = candidateSource.estimatedCandidateCount
  const chunkSize = Math.max(1, Math.floor(message.chunkSize ?? DEFAULT_CHUNK_SIZE))
  let processedCandidateCount = 0
  let rejectedCandidateCount = 0
  const rawTopResults: CandidateResult[] = []
  const topResults: CandidateResult[] = []
  const bucketTopResults = emptyBucketResults()
  const rejectedCandidates: RejectedCandidateSummary[] = []
  let nearestRejectedCandidate: RejectedCandidateSummary | null = null
  const warnings = new Set<string>()

  const processChunk = (): void => {
    let processedInChunk = 0
    let sourceExhausted = false

    while (
      processedCandidateCount < estimatedCandidateCount &&
      processedInChunk < chunkSize &&
      !cancelRequested
    ) {
      const candidate = candidateSource.next()
      if (!candidate) {
        sourceExhausted = true
        break
      }
      const result = evaluateCandidate(
        candidate,
        message.basePoints,
        message.frames,
        message.settings,
      )
      for (const warning of result.warnings) {
        warnings.add(warning)
      }
      insertRawTopResult(rawTopResults, result, message.settings.topN)
      if (isDepthRelationRejected(result)) {
        rejectedCandidateCount += 1
        if (result.depthRelationDebug) {
          const rejectedCandidate = toRejectedCandidateSummary(result)
          if (rejectedCandidates.length < 20) {
            rejectedCandidates.push(rejectedCandidate)
          }
          if (isNearerRejectedCandidate(rejectedCandidate, nearestRejectedCandidate)) {
            nearestRejectedCandidate = rejectedCandidate
          }
        }
      } else {
        insertTopResult(topResults, result, message.settings.topN, message.settings.objectiveMode)
        insertBucketTopResults(bucketTopResults, result, message.settings.topN)
      }
      candidateSource.afterEvaluate(result)

      processedCandidateCount += 1
      processedInChunk += 1
    }

    if (cancelRequested) {
      postMessageToMain({
        type: "cancelled",
        processedCandidateCount,
        estimatedCandidateCount,
      })
      return
    }

    postMessageToMain({
      type: "progress",
      processedCandidateCount,
      estimatedCandidateCount,
      topCandidates: toRankingEntries(topResults),
      rawRanking: toRankingEntries(rawTopResults),
      depthFilteredRanking: toRankingEntries(topResults),
      bucketRanking: toBucketRanking(bucketTopResults),
      rejectedCandidateCount,
    })

    if (sourceExhausted || processedCandidateCount >= estimatedCandidateCount) {
      const rawRanking = toRankingEntries(rawTopResults)
      const rejectedWithRank = attachOriginalRanksToRejectedCandidates(rejectedCandidates, rawRanking)
      const nearestRejectedWithRank = nearestRejectedCandidate
        ? attachOriginalRanksToRejectedCandidates([nearestRejectedCandidate], rawRanking)[0]
        : undefined
      if (
        topResults.length === 0 &&
        rejectedCandidateCount > 0 &&
        normalizeDepthRelationFilteringSettings(message.settings.depthRelationFiltering).mode === "hardReject"
      ) {
        warnings.add("No candidate passed depth relation hardReject")
      }
      postMessageToMain({
        type: "complete",
        processedCandidateCount,
        estimatedCandidateCount,
        topCandidates: toRankingEntries(topResults),
        rawRanking,
        depthFilteredRanking: toRankingEntries(topResults),
        bucketRanking: toBucketRanking(bucketTopResults),
        bestCandidate: topResults[0] ?? null,
        localSearchSummary: candidateSource.localSearchSummary(),
        depthRelationDebug: {
          settings: normalizeDepthRelationFilteringSettings(message.settings.depthRelationFiltering),
          bestCandidateDepthRelation: topResults[0]?.depthRelationDebug,
          rejectedCandidates: rejectedWithRank,
          nearestRejectedCandidate: nearestRejectedWithRank,
          rejectedCandidateCount,
        },
        warnings: Array.from(warnings),
      })
      return
    }

    setTimeout(processChunk, 0)
  }

  processChunk()
}

interface CandidateSource {
  estimatedCandidateCount: number
  next: () => CandidateDefinition | null
  afterEvaluate: (result: CandidateResult) => void
  localSearchSummary: () => LocalSearchSummary | undefined
}

function createCandidateSource(settings: SearchSettings): CandidateSource {
  if (settings.searchMode === "localOneDimensional") {
    return createLocalOneDimensionalCandidateSource(settings)
  }
  if (settings.searchMode === "coordinateDescent") {
    return createCoordinateDescentCandidateSource(settings)
  }
  return createFullGridCandidateSource(settings)
}

function createFullGridCandidateSource(settings: SearchSettings): CandidateSource {
  const semanticPointNames = getSemanticPointNames(settings.semanticPointSetId)
  const zCandidates = createNumericCandidates(settings.zMin, settings.zMax, settings.zStep)
  const pivotZCandidates = createNumericCandidates(
    settings.pivotZMin,
    settings.pivotZMax,
    settings.pivotZStep,
  )
  const estimatedCandidateCount = estimateCandidateCountFromCandidates(
    zCandidates.length,
    pivotZCandidates.length,
    semanticPointNames.length,
  )
  const indices = semanticPointNames.map(() => 0)
  let pivotIndex = 0
  let nextIndex = 1

  return {
    estimatedCandidateCount,
    next: () => {
      if (nextIndex > estimatedCandidateCount) {
        return null
      }
      const candidate = createCandidateFromIndices(
        nextIndex,
        indices,
        pivotIndex,
        zCandidates,
        pivotZCandidates,
        semanticPointNames,
      )
      nextIndex += 1
      advanceCandidateCursor(indices, zCandidates.length, () => {
        pivotIndex += 1
        if (pivotIndex < pivotZCandidates.length) {
          return false
        }
        pivotIndex = 0
        return true
      })
      return candidate
    },
    afterEvaluate: () => undefined,
    localSearchSummary: () => undefined,
  }
}

function createLocalOneDimensionalCandidateSource(settings: SearchSettings): CandidateSource {
  const localSettings = settings.localSearchSettings
  const baseCandidate = cloneCandidate(localSettings.baseCandidate)
  const values = createNumericCandidates(
    localSettings.localMin,
    localSettings.localMax,
    localSettings.localStep,
  )
  const previousValue = getCandidateParameter(baseCandidate, localSettings.targetParameter)
  let valueIndex = 0
  let nextIndex = 1
  let bestResult: CandidateResult | null = null

  return {
    estimatedCandidateCount: values.length,
    next: () => {
      const value = values[valueIndex]
      if (typeof value !== "number") {
        return null
      }
      const candidate = setCandidateParameter(
        baseCandidate,
        localSettings.targetParameter,
        value,
      )
      valueIndex += 1
      return createCandidateDefinitionFromCandidate(nextIndex++, candidate)
    },
    afterEvaluate: (result) => {
      if (!isSelectableCandidate(result)) {
        return
      }
      if (!bestResult || isBetterObjectiveResult(result, bestResult, settings.objectiveMode)) {
        bestResult = result
      }
    },
    localSearchSummary: () => {
      const finalCandidate = bestResult ? toFittingCandidate(bestResult) : cloneCandidate(baseCandidate)
      return {
        initialCandidate: cloneCandidate(baseCandidate),
        finalCandidate,
        steps: [
          {
            iteration: 1,
            parameter: localSettings.targetParameter,
            previousValue: round(previousValue),
            bestValue: round(
              bestResult
                ? getCandidateParameter(bestResult, localSettings.targetParameter)
                : previousValue,
            ),
            bestScore: round(
              bestResult ? getObjectiveScore(bestResult, settings.objectiveMode) : Number.POSITIVE_INFINITY,
            ),
            candidateCount: values.length,
          },
        ],
      }
    },
  }
}

function createCoordinateDescentCandidateSource(settings: SearchSettings): CandidateSource {
  const localSettings = settings.localSearchSettings
  const iterations = Math.max(1, Math.floor(localSettings.coordinateDescentIterations))
  const activePointParameters = new Set(
    getSemanticPointNames(settings.semanticPointSetId).map((pointId) => `${pointId}.z`),
  )
  const parameterOrder = localSettings.coordinateDescentParameterOrder.filter(
    (parameter) => !parameter.endsWith(".z") || activePointParameters.has(parameter),
  )
  const valuesByParameter = Object.fromEntries(
    parameterOrder.map((parameter) => {
      const range = localSettings.coordinateDescentRanges[parameter]
      return [parameter, createNumericCandidates(range.min, range.max, range.step)]
    }),
  ) as Record<LocalSearchParameter, number[]>
  const estimatedCandidateCount =
    iterations *
    parameterOrder.reduce((total, parameter) => total + valuesByParameter[parameter].length, 0)

  let currentCandidate = cloneCandidate(localSettings.baseCandidate)
  let iterationIndex = 0
  let parameterIndex = 0
  let valueIndex = 0
  let nextIndex = 1
  let activeStep:
    | {
        iteration: number
        parameter: LocalSearchParameter
        previousValue: number
        candidateCount: number
        bestResult: CandidateResult | null
      }
    | null = null
  const steps: LocalSearchStepSummary[] = []

  const finishActiveStep = (): void => {
    if (!activeStep) {
      return
    }
    const bestCandidate = activeStep.bestResult
      ? toFittingCandidate(activeStep.bestResult)
      : cloneCandidate(currentCandidate)
    currentCandidate = bestCandidate
    steps.push({
      iteration: activeStep.iteration,
      parameter: activeStep.parameter,
      previousValue: round(activeStep.previousValue),
      bestValue: round(getCandidateParameter(bestCandidate, activeStep.parameter)),
      bestScore: round(
        activeStep.bestResult
          ? getObjectiveScore(activeStep.bestResult, settings.objectiveMode)
          : Number.POSITIVE_INFINITY,
      ),
      candidateCount: activeStep.candidateCount,
    })
    activeStep = null
    valueIndex = 0
    parameterIndex += 1
    if (parameterIndex >= parameterOrder.length) {
      parameterIndex = 0
      iterationIndex += 1
    }
  }

  const ensureActiveStep = (): boolean => {
    if (activeStep) {
      return true
    }
    if (iterationIndex >= iterations || parameterOrder.length === 0) {
      return false
    }
    const parameter = parameterOrder[parameterIndex]
    activeStep = {
      iteration: iterationIndex + 1,
      parameter,
      previousValue: getCandidateParameter(currentCandidate, parameter),
      candidateCount: valuesByParameter[parameter].length,
      bestResult: null,
    }
    return true
  }

  return {
    estimatedCandidateCount,
    next: () => {
      if (!ensureActiveStep() || !activeStep) {
        return null
      }
      const values = valuesByParameter[activeStep.parameter]
      const value = values[valueIndex]
      if (typeof value !== "number") {
        return null
      }
      const candidate = setCandidateParameter(currentCandidate, activeStep.parameter, value)
      return createCandidateDefinitionFromCandidate(nextIndex++, candidate)
    },
    afterEvaluate: (result) => {
      if (!activeStep) {
        return
      }
      if (
        isSelectableCandidate(result) &&
        (!activeStep.bestResult ||
        isBetterObjectiveResult(result, activeStep.bestResult, settings.objectiveMode)
      )) {
        activeStep.bestResult = result
      }
      valueIndex += 1
      if (valueIndex >= activeStep.candidateCount) {
        finishActiveStep()
      }
    },
    localSearchSummary: () => ({
      initialCandidate: cloneCandidate(localSettings.baseCandidate),
      finalCandidate: cloneCandidate(currentCandidate),
      steps,
    }),
  }
}

function createCandidateFromIndices(
  index: number,
  pointIndices: number[],
  pivotIndex: number,
  zCandidates: number[],
  pivotZCandidates: number[],
  semanticPointNames: SemanticPointName[],
): CandidateDefinition {
  const zByPointId = {} as Record<string, number>
  for (const [pointIndex, pointName] of semanticPointNames.entries()) {
    zByPointId[pointName] = zCandidates[pointIndices[pointIndex]]
  }
  const completedZByPointId = completeSemanticZ(zByPointId)
  const pivotZ = pivotZCandidates[pivotIndex]
  return {
    candidateId: createCandidateId(index, completedZByPointId, pivotZ),
    zByPointId: completedZByPointId,
    pivotZ,
  }
}

function createCandidateDefinitionFromCandidate(
  index: number,
  candidate: FittingCandidate8,
): CandidateDefinition {
  const definition: CandidateDefinition = {
    candidateId: createCandidateId(index, candidate.zByPointId, candidate.pivotZ),
    zByPointId: completeSemanticZ(candidate.zByPointId),
    pivotZ: candidate.pivotZ,
  }
  if (candidate.rotationCenter) {
    definition.rotationCenter = roundRotationCenter(candidate.rotationCenter)
    definition.pivotZ = definition.rotationCenter.z
  }
  return definition
}

function advanceCandidateCursor(
  pointIndices: number[],
  zCandidateCount: number,
  advancePivot: () => boolean,
): void {
  const shouldAdvancePoint = advancePivot()
  if (!shouldAdvancePoint) {
    return
  }

  for (let index = pointIndices.length - 1; index >= 0; index -= 1) {
    pointIndices[index] += 1
    if (pointIndices[index] < zCandidateCount) {
      return
    }
    pointIndices[index] = 0
  }
}

function insertTopResult(
  results: CandidateResult[],
  next: CandidateResult,
  limit: number,
  objectiveMode: ObjectiveMode,
): void {
  const nextKey = buildCandidateKey(next)
  const existingIndex = results.findIndex((result) => buildCandidateKey(result) === nextKey)
  if (existingIndex >= 0) {
    if (isBetterObjectiveResult(next, results[existingIndex], objectiveMode)) {
      results[existingIndex] = next
    }
    results.sort((a, b) => getObjectiveScore(a, objectiveMode) - getObjectiveScore(b, objectiveMode))
    return
  }

  results.push(next)
  results.sort((a, b) => getObjectiveScore(a, objectiveMode) - getObjectiveScore(b, objectiveMode))
  if (results.length > limit) {
    results.length = limit
  }
}

function insertRawTopResult(
  results: CandidateResult[],
  next: CandidateResult,
  limit: number,
): void {
  insertResultByScore(results, next, limit, (candidate) => candidate.objectiveScoreBeforeDepthFilter)
}

function insertResultByScore(
  results: CandidateResult[],
  next: CandidateResult,
  limit: number,
  score: (candidate: CandidateResult) => number,
): void {
  const nextKey = buildCandidateKey(next)
  const existingIndex = results.findIndex((result) => buildCandidateKey(result) === nextKey)
  if (existingIndex >= 0) {
    if (score(next) < score(results[existingIndex])) {
      results[existingIndex] = next
    }
    results.sort((a, b) => score(a) - score(b))
    return
  }

  results.push(next)
  results.sort((a, b) => score(a) - score(b))
  if (results.length > limit) {
    results.length = limit
  }
}

function isBetterObjectiveResult(
  next: CandidateResult,
  current: CandidateResult,
  objectiveMode: ObjectiveMode,
): boolean {
  const nextScore = getObjectiveScore(next, objectiveMode)
  const currentScore = getObjectiveScore(current, objectiveMode)
  return nextScore < currentScore
}

function isSelectableCandidate(candidate: CandidateResult): boolean {
  return !isDepthRelationRejected(candidate)
}

function isDepthRelationRejected(candidate: CandidateResult): boolean {
  return Boolean(candidate.depthRelationDebug?.isRejected)
}

function insertBucketTopResults(
  bucketResults: Record<CaptureBucket, CandidateResult[]>,
  next: CandidateResult,
  limit: number,
): void {
  for (const bucket of BUCKETS) {
    const bucketScore = scoreForBucket(next, bucket)
    if (bucketScore === null) {
      continue
    }
    const results = bucketResults[bucket]
    const nextKey = buildCandidateKey(next)
    const existingIndex = results.findIndex((result) => buildCandidateKey(result) === nextKey)
    if (existingIndex >= 0) {
      const existingScore = scoreForBucket(results[existingIndex], bucket) ?? Infinity
      if (bucketScore < existingScore) {
        results[existingIndex] = next
      }
      results.sort((a, b) => (scoreForBucket(a, bucket) ?? Infinity) - (scoreForBucket(b, bucket) ?? Infinity))
      continue
    }

    results.push(next)
    results.sort((a, b) => (scoreForBucket(a, bucket) ?? Infinity) - (scoreForBucket(b, bucket) ?? Infinity))
    if (results.length > limit) {
      results.length = limit
    }
  }
}

function scoreForBucket(candidate: CandidateResult, bucket: CaptureBucket): number | null {
  if (bucket === "unknown") {
    const unknownScores = candidate.perFrameResults
      .filter((result) => result.bucket === "unknown")
      .map((result) => result.totalScore)
    return roundNullable(average(unknownScores))
  }
  return candidate.bucketScores[bucket]
}

function toRankingEntries(results: CandidateResult[]): RankingEntry[] {
  return results.map((candidate, index) => toRankingEntry(candidate, index + 1))
}

function toBucketRanking(
  bucketResults: Record<CaptureBucket, CandidateResult[]>,
): Record<CaptureBucket, RankingEntry[]> {
  return Object.fromEntries(
    BUCKETS.map((bucket) => [
      bucket,
      bucketResults[bucket].map((candidate, index) =>
        toBucketRankingEntry(candidate, bucket, index + 1),
      ),
    ]),
  ) as Record<CaptureBucket, RankingEntry[]>
}

function evaluateCandidate(
  candidate: CandidateDefinition,
  basePoints: SemanticPointSet2D,
  frames: SearchFrame[],
  settings: SearchSettings,
): CandidateResult {
  const semanticPointNames = getSemanticPointNames(settings.semanticPointSetId)
  const ideal3D = buildIdeal3D(basePoints, candidate, semanticPointNames)
  const perFrameResults = frames.map((frame) =>
    evaluateCandidateOnFrame(candidate, ideal3D, frame, settings, semanticPointNames),
  )
  const perPointError = averagePerPointError(perFrameResults, semanticPointNames)
  const averageSemanticDistance =
    average(perFrameResults.map((result) => result.averageSemanticDistance)) ?? Number.POSITIVE_INFINITY
  const weightedSemanticDistance =
    average(perFrameResults.map((result) => result.weightedSemanticDistance)) ?? Number.POSITIVE_INFINITY
  const bucketScores = calculateBucketScores(perFrameResults)
  const scoreDebug = calculateScoreDebug(weightedSemanticDistance, bucketScores)
  const totalScore = weightedSemanticDistance
  const outlierDebug = buildCandidateOutlierDebug(perFrameResults, {
    totalScore,
    bucketScores,
    scoreDebug,
  }, settings.outlierFiltering)
  const scoreForObjective =
    shouldApplyFilteredObjective(outlierDebug?.settings) && outlierDebug?.filteredScores
      ? outlierDebug.filteredScores
      : { totalScore, bucketScores, scoreDebug }
  const objectiveMode = normalizeObjectiveMode(settings.objectiveMode)
  const objectiveScoreBeforeDepthFilter = getObjectiveScore(scoreForObjective, objectiveMode)
  const depthRelationDebug = buildCandidateDepthRelationDebug(candidate, settings.depthRelationFiltering)
  const objectiveScore =
    shouldApplyDepthRelationPenalty(depthRelationDebug)
      ? round(objectiveScoreBeforeDepthFilter + depthRelationDebug.penalty)
      : objectiveScoreBeforeDepthFilter

  return {
    ...candidate,
    averageSemanticDistance,
    weightedSemanticDistance,
    perPointError,
    bucketScores,
    scoreDebug,
    objectiveMode,
    objectiveScoreBeforeDepthFilter: round(objectiveScoreBeforeDepthFilter),
    objectiveScore,
    totalScore,
    sampleCount: perFrameResults.length,
    warnings: Array.from(new Set(perFrameResults.flatMap((result) => result.warnings))),
    perFrameResults,
    outlierDebug,
    depthRelationDebug,
  }
}

function evaluateCandidateOnFrame(
  candidate: CandidateDefinition,
  ideal3D: SemanticPointSet3D,
  frame: SearchFrame,
  settings: SearchSettings,
  semanticPointNames: SemanticPointName[],
): FrameEvaluation {
  const projected = projectIdealPoints(ideal3D, frame.pose, candidate, settings, undefined, semanticPointNames)
  const current = normalizeCurrentPointsForScoring(frame.semanticPoints, frame.bounds, semanticPointNames)
  const perPointError = calculatePerPointErrors(projected, current, semanticPointNames)
  const averageSemanticDistance =
    average(semanticPointNames.map((name) => perPointError[name])) ?? Number.POSITIVE_INFINITY
  const scoreWeights = getScoreWeights(settings.semanticPointSetId)
  const weightedSemanticDistance = weightedAverage(
    semanticPointNames.map((name) => ({
      value: perPointError[name],
      weight: scoreWeights[name],
    })),
  )

  return {
    captureId: frame.captureId,
    bucket: frame.bucket,
    rawBucket: frame.rawBucket ?? null,
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

function buildIdeal3D(
  basePoints: SemanticPointSet2D,
  candidate: CandidateDefinition,
  semanticPointNames = SEMANTIC_POINT_NAMES,
): SemanticPointSet3D {
  const points = {} as SemanticPointSet3D
  for (const name of semanticPointNames) {
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
  candidate: CandidateDefinition,
  settings: SearchSettings,
  options?: ProjectionOptions,
  semanticPointNames = SEMANTIC_POINT_NAMES,
): SemanticPointSet2D {
  const rotationCenter = getProjectionRotationCenter(candidate, options)
  const points = {} as SemanticPointSet2D
  for (const name of semanticPointNames) {
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
      x: projectedX * perspective,
      y: projectedY * perspective,
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

function normalizeCurrentPointsForScoring(
  points: SemanticPointSet2D,
  bounds: Bounds2D,
  semanticPointNames = SEMANTIC_POINT_NAMES,
): SemanticPointSet2D {
  const normalized = {} as SemanticPointSet2D
  for (const name of semanticPointNames) {
    normalized[name] = {
      name,
      x: points[name].x - bounds.centerX,
      y: points[name].y - bounds.centerY,
    }
  }
  return normalized
}

function calculatePerPointErrors(
  aligned: SemanticPointSet2D,
  current: SemanticPointSet2D,
  semanticPointNames = SEMANTIC_POINT_NAMES,
): Record<SemanticPointName, number> {
  const result = {} as Record<SemanticPointName, number>
  for (const name of semanticPointNames) {
    result[name] = distance2D(aligned[name], current[name])
  }
  return result
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

function buildCandidateOutlierDebug(
  perFrameResults: FrameEvaluation[],
  rawScores: CandidateScoreSnapshot,
  sourceSettings?: OutlierFilteringSettings,
): CandidateOutlierDebug | undefined {
  const settings = normalizeOutlierFilteringSettings(sourceSettings)
  if (!settings.enabled || settings.mode === "off") {
    return undefined
  }

  const bucketSummaries = BUCKETS.map((bucket) =>
    buildBucketFrameErrorSummary(perFrameResults, bucket, settings),
  )
  const outlierFrames = bucketSummaries.flatMap((summary) => summary.outlierFrames)
  const outlierIds = new Set(outlierFrames.map((frame) => `${frame.bucket}:${frame.captureId}`))
  const filteredResults = perFrameResults.filter(
    (result) => !outlierIds.has(`${result.bucket}:${result.captureId}`),
  )
  const filteredScores =
    outlierIds.size > 0
      ? buildCandidateScoreSnapshot(filteredResults)
      : {
          totalScore: rawScores.totalScore,
          bucketScores: rawScores.bucketScores,
          scoreDebug: rawScores.scoreDebug,
        }

  return {
    settings,
    bucketSummaries,
    outlierFrames,
    rawScores: roundScoreSnapshot(rawScores),
    filteredScores: roundScoreSnapshot(filteredScores),
  }
}

function buildBucketFrameErrorSummary(
  perFrameResults: FrameEvaluation[],
  bucket: CaptureBucket,
  settings: OutlierFilteringSettings,
): BucketFrameErrorSummary {
  const bucketResults = perFrameResults.filter((result) => result.bucket === bucket)
  const rawErrors = bucketResults.map((result) => result.frameError)
  const rawAverageError = roundNullable(average(rawErrors))
  const rawMedianError = roundNullable(median(rawErrors))
  const rawMaxError = roundNullable(max(rawErrors))
  const canDetectOutliers = bucketResults.length >= settings.minBucketSampleCount
  const outlierResults = canDetectOutliers
    ? selectOutlierFrameResults(bucketResults, rawMedianError, settings)
    : []
  const outlierIds = new Set(outlierResults.map((result) => result.captureId))
  const filteredErrors = bucketResults
    .filter((result) => !outlierIds.has(result.captureId))
    .map((result) => result.frameError)
  const worstResult = bucketResults.reduce<FrameEvaluation | null>(
    (worst, result) => (!worst || result.frameError > worst.frameError ? result : worst),
    null,
  )
  const outlierFrames = outlierResults.map((result) =>
    toOutlierFrameDebug(result, rawMedianError, rawAverageError, settings, buildOutlierReason(settings)),
  )

  return {
    bucket,
    sampleCount: bucketResults.length,
    rawAverageError,
    rawMedianError,
    rawMaxError,
    filteredAverageError: roundNullable(average(filteredErrors)),
    filteredMedianError: roundNullable(median(filteredErrors)),
    filteredMaxError: roundNullable(max(filteredErrors)),
    outlierFrameCount: outlierFrames.length,
    worstFrame: worstResult
      ? toOutlierFrameDebug(
          worstResult,
          rawMedianError,
          rawAverageError,
          settings,
          outlierIds.has(worstResult.captureId) ? buildOutlierReason(settings) : "worstFrameOnly",
        )
      : null,
    outlierFrames,
  }
}

function selectOutlierFrameResults(
  bucketResults: FrameEvaluation[],
  bucketMedianError: number | null,
  settings: OutlierFilteringSettings,
): FrameEvaluation[] {
  const maxOutliers = Math.max(0, Math.round(settings.perBucketMaxOutliers))
  if (maxOutliers === 0 || bucketResults.length === 0) {
    return []
  }
  const sortedWorstFirst = [...bucketResults].sort((a, b) => b.frameError - a.frameError)
  if (settings.method === "topWorstPercent") {
    const percentCount = Math.ceil(bucketResults.length * Math.max(0, settings.topWorstPercent) / 100)
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

function toOutlierFrameDebug(
  result: FrameEvaluation,
  bucketMedianError: number | null,
  bucketAverageError: number | null,
  settings: OutlierFilteringSettings,
  outlierReason: string,
): OutlierFrameDebug {
  return {
    captureId: result.captureId,
    bucket: result.bucket,
    rawBucket: result.rawBucket ?? null,
    pose: result.pose,
    frameError: round(result.frameError),
    bucketMedianError,
    bucketAverageError,
    ratioToMedian: safeRatio(result.frameError, bucketMedianError),
    deltaFromMedian: bucketMedianError === null ? null : round(result.frameError - bucketMedianError),
    perPointError: roundRecord(result.perPointError),
    worstPoint: findWorstPoint(result.perPointError),
    outlierReason,
    excludedFromInference: settings.mode === "excludeFromInference",
    retainedForValidation: true,
  }
}

function buildOutlierReason(settings: OutlierFilteringSettings): string {
  if (settings.method === "medianAbsoluteDelta") {
    return `frameError > bucketMedianError + ${settings.absoluteDeltaThreshold}`
  }
  if (settings.method === "topWorstPercent") {
    return `top ${settings.topWorstPercent}% worst frameError`
  }
  return `frameError > bucketMedianError * ${settings.medianMultiplier}`
}

function buildCandidateScoreSnapshot(results: FrameEvaluation[]): CandidateScoreSnapshot {
  const totalScore =
    average(results.map((result) => result.weightedSemanticDistance)) ?? Number.POSITIVE_INFINITY
  const bucketScores = calculateBucketScores(results)
  return {
    totalScore,
    bucketScores,
    scoreDebug: calculateScoreDebug(totalScore, bucketScores),
  }
}

function shouldApplyFilteredObjective(settings?: OutlierFilteringSettings): boolean {
  return Boolean(
    settings?.enabled &&
      settings.mode === "excludeFromInference" &&
      settings.applyToObjectiveScore,
  )
}

function buildCandidateDepthRelationDebug(
  candidate: FittingCandidate8,
  sourceSettings?: DepthRelationFilteringSettings,
): DepthRelationDebug | undefined {
  const settings = normalizeDepthRelationFilteringSettings(sourceSettings)
  if (!settings.enabled || settings.mode === "off") {
    return undefined
  }

  const groupValues = Object.fromEntries(
    settings.groups.map((group) => [group.id, buildDepthRelationGroupValue(group, candidate)]),
  ) as Record<string, DepthRelationGroupValue>
  const rawRuleResults = settings.rules.map((rule) =>
    evaluateDepthRelationRule(rule, groupValues, settings),
  )
  const rawPenalty = rawRuleResults.reduce((total, result) => total + result.penalty, 0)
  const penalty = round(Math.min(settings.maxPenalty, rawPenalty))
  const ruleResults = rawRuleResults.map((result) => ({
    ...result,
    penalty: round(result.penalty),
  }))
  const violationCount = ruleResults.filter((result) => result.severity === "violation").length
  const hardRejectViolationCount = ruleResults.filter(
    (result) => result.severity === "violation" && result.mode === "hardReject",
  ).length
  const isRejected = Boolean(
    settings.mode === "hardReject" &&
      ruleResults.some((result) => result.reject),
  )

  return {
    settings,
    groupValues,
    ruleResults,
    violationCount,
    hardRejectViolationCount,
    penalty,
    isRejected,
  }
}

function buildDepthRelationGroupValue(
  group: DepthRelationGroup,
  candidate: FittingCandidate8,
): DepthRelationGroupValue {
  const values = group.pointIds
    .map((pointId) => candidate.zByPointId[pointId])
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
  const z = group.aggregation === "median" ? median(values) : average(values)
  return {
    groupId: group.id,
    label: group.label,
    pointIds: [...group.pointIds],
    aggregation: group.aggregation,
    z: roundNullable(z),
  }
}

function evaluateDepthRelationRule(
  rule: DepthRelationRule,
  groupValues: Record<string, DepthRelationGroupValue>,
  settings: DepthRelationFilteringSettings,
): DepthRelationRuleResult {
  const subjectZ = groupValues[rule.subjectGroupId]?.z ?? null
  const referenceZ = groupValues[rule.referenceGroupId]?.z ?? null
  const delta = subjectZ === null || referenceZ === null ? null : round(subjectZ - referenceZ)
  const effectiveMode = getEffectiveDepthRelationRuleMode(settings.mode, rule.mode)
  const passed = delta === null ? false : isDepthRelationPassed(rule.relation, delta, rule.margin)
  const severity = delta === null
    ? "violation"
    : getDepthRelationSeverity(rule.relation, delta, rule.margin, rule.warningMargin, passed)
  const violationDistance = severity === "violation" && delta !== null
    ? calculateDepthRelationViolationDistance(rule.relation, delta, rule.margin)
    : 0
  const penalty =
    effectiveMode === "penalty" || effectiveMode === "hardReject"
      ? Math.max(0, violationDistance) * Math.max(0, rule.weight) * settings.penaltyScale
      : 0
  const reject =
    settings.mode === "hardReject" &&
    effectiveMode === "hardReject" &&
    severity === "violation"

  return {
    ruleId: rule.id,
    label: rule.label,
    subjectGroupId: rule.subjectGroupId,
    referenceGroupId: rule.referenceGroupId,
    relation: rule.relation,
    subjectZ,
    referenceZ,
    margin: round(rule.margin),
    delta,
    passed,
    severity,
    mode: effectiveMode,
    penalty,
    reject,
    explanation: buildDepthRelationExplanation(rule, subjectZ, referenceZ, delta, passed),
  }
}

function getEffectiveDepthRelationRuleMode(
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

function isDepthRelationPassed(
  relation: DepthRelationKind,
  delta: number,
  margin: number,
): boolean {
  if (relation === "inFrontOf") {
    return delta < -margin
  }
  if (relation === "behind") {
    return delta > margin
  }
  return Math.abs(delta) <= margin
}

function getDepthRelationSeverity(
  relation: DepthRelationKind,
  delta: number,
  margin: number,
  warningMargin: number,
  passed: boolean,
): DepthRelationSeverity {
  if (!passed) {
    return "violation"
  }
  if (warningMargin <= 0) {
    return "ok"
  }
  if (relation === "inFrontOf") {
    return delta >= -margin - warningMargin ? "warning" : "ok"
  }
  if (relation === "behind") {
    return delta <= margin + warningMargin ? "warning" : "ok"
  }
  return Math.abs(delta) >= Math.max(0, margin - warningMargin) ? "warning" : "ok"
}

function calculateDepthRelationViolationDistance(
  relation: DepthRelationKind,
  delta: number,
  margin: number,
): number {
  if (relation === "inFrontOf") {
    return delta + margin
  }
  if (relation === "behind") {
    return margin - delta
  }
  return Math.abs(delta) - margin
}

function buildDepthRelationExplanation(
  rule: DepthRelationRule,
  subjectZ: number | null,
  referenceZ: number | null,
  delta: number | null,
  passed: boolean,
): string {
  if (subjectZ === null || referenceZ === null || delta === null) {
    return `${rule.label}: group z を計算できませんでした。`
  }
  const status = passed ? "通過" : "違反"
  return `${rule.label}: subjectZ=${round(subjectZ)}, referenceZ=${round(referenceZ)}, delta=${round(delta)} (${status})`
}

function shouldApplyDepthRelationPenalty(debug?: DepthRelationDebug): boolean {
  return Boolean(
    debug?.settings.enabled &&
      debug.settings.mode === "penalty" &&
      debug.settings.applyToObjectiveScore &&
      debug.penalty > 0,
  )
}

function normalizeOutlierFilteringSettings(
  settings?: OutlierFilteringSettings,
): OutlierFilteringSettings {
  return {
    ...DEFAULT_OUTLIER_FILTERING_SETTINGS,
    ...(settings ?? {}),
    perBucketMaxOutliers: Math.max(
      0,
      Math.round(settings?.perBucketMaxOutliers ?? DEFAULT_OUTLIER_FILTERING_SETTINGS.perBucketMaxOutliers),
    ),
    minBucketSampleCount: Math.max(
      1,
      Math.round(settings?.minBucketSampleCount ?? DEFAULT_OUTLIER_FILTERING_SETTINGS.minBucketSampleCount),
    ),
    topWorstPercent: Math.max(
      0,
      Math.min(100, settings?.topWorstPercent ?? DEFAULT_OUTLIER_FILTERING_SETTINGS.topWorstPercent),
    ),
  }
}

function normalizeDepthRelationFilteringSettings(
  settings?: DepthRelationFilteringSettings,
): DepthRelationFilteringSettings {
  const groups = normalizeDepthRelationGroups(settings?.groups)
  return {
    ...DEFAULT_DEPTH_RELATION_FILTERING_SETTINGS,
    ...(settings ?? {}),
    mode: normalizeDepthRelationMode(settings?.mode),
    applyToObjectiveScore: Boolean(
      settings?.applyToObjectiveScore ?? DEFAULT_DEPTH_RELATION_FILTERING_SETTINGS.applyToObjectiveScore,
    ),
    groups,
    rules: normalizeDepthRelationRules(settings?.rules, groups),
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

function normalizeDepthRelationMode(value: string | undefined): DepthRelationMode {
  if (value === "reject") {
    return "hardReject"
  }
  return value === "off" || value === "penalty" || value === "hardReject" ? value : "debugOnly"
}

function normalizeDepthRelationGroups(groups?: DepthRelationGroup[]): DepthRelationGroup[] {
  const source = Array.isArray(groups) && groups.length > 0
    ? groups
    : DEFAULT_DEPTH_RELATION_GROUPS_8
  return source.map((group) => ({
    id: String(group.id),
    label: String(group.label),
    pointIds: group.pointIds.filter((pointId): pointId is SemanticPointId =>
      SEMANTIC_POINT_NAMES.includes(pointId),
    ),
    aggregation: group.aggregation === "mean" ? "mean" : "median",
  }))
}

function normalizeDepthRelationRules(
  rules: DepthRelationRule[] | undefined,
  groups: DepthRelationGroup[],
): DepthRelationRule[] {
  const groupIds = new Set(groups.map((group) => group.id))
  const source = Array.isArray(rules) && rules.length > 0
    ? rules
    : DEFAULT_DEPTH_RELATION_RULES_8
  return source
    .filter((rule) => groupIds.has(rule.subjectGroupId) && groupIds.has(rule.referenceGroupId))
    .map((rule) => ({
      id: String(rule.id),
      label: String(rule.label),
      subjectGroupId: String(rule.subjectGroupId),
      referenceGroupId: String(rule.referenceGroupId),
      relation: normalizeDepthRelationKind(rule.relation),
      margin: Math.max(0, Number.isFinite(rule.margin) ? rule.margin : 0),
      warningMargin: Math.max(0, Number.isFinite(rule.warningMargin) ? rule.warningMargin : 0),
      weight: Math.max(0, Number.isFinite(rule.weight) ? rule.weight : 1),
      mode: normalizeDepthRelationRuleMode(rule.mode),
    }))
}

function normalizeDepthRelationKind(value: string): DepthRelationKind {
  return value === "behind" || value === "near" ? value : "inFrontOf"
}

function normalizeDepthRelationRuleMode(value: string): Exclude<DepthRelationMode, "off"> {
  return value === "penalty" || value === "hardReject" ? value : "debugOnly"
}

function roundScoreSnapshot(snapshot: CandidateScoreSnapshot): CandidateScoreSnapshot {
  return {
    totalScore: round(snapshot.totalScore),
    bucketScores: roundRecord(snapshot.bucketScores),
    scoreDebug: roundScoreDebug(snapshot.scoreDebug),
  }
}

function findWorstPoint(perPointError: Record<SemanticPointName, number>): {
  pointId: SemanticPointName
  error: number
} | null {
  return SEMANTIC_POINT_NAMES.reduce<{
    pointId: SemanticPointName
    error: number
  } | null>((worst, pointId) => {
    const error = perPointError[pointId]
    if (!Number.isFinite(error)) {
      return worst
    }
    return !worst || error > worst.error ? { pointId, error: round(error) } : worst
  }, null)
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
  if (
    result.objectiveMode === normalizeObjectiveMode(objectiveMode) &&
    typeof result.objectiveScore === "number"
  ) {
    return result.objectiveScore
  }
  switch (normalizeObjectiveMode(objectiveMode)) {
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

function normalizeObjectiveMode(value: string | undefined): ObjectiveMode {
  return value === "balancedScore" ||
    value === "maxBucketScore" ||
    value === "pitchAverageScore" ||
    value === "yawAverageScore"
    ? value
    : "totalScore"
}

function averageBucketScore(results: FrameEvaluation[], bucket: CaptureBucket): number | null {
  return roundNullable(
    average(results.filter((result) => result.bucket === bucket).map((result) => result.totalScore)),
  )
}

function averagePerPointError(
  results: FrameEvaluation[],
  semanticPointNames = SEMANTIC_POINT_NAMES,
): Record<SemanticPointName, number> {
  const summary = {} as Record<SemanticPointName, number>
  for (const name of semanticPointNames) {
    summary[name] = average(results.map((result) => result.perPointError[name])) ?? 0
  }
  return summary
}

function toRankingEntry(candidate: CandidateResult, rank: number): RankingEntry {
  return {
    rank,
    candidateId: candidate.candidateId,
    objectiveMode: candidate.objectiveMode,
    objectiveScoreBeforeDepthFilter: round(candidate.objectiveScoreBeforeDepthFilter),
    objectiveScore: round(candidate.objectiveScore),
    totalScore: round(candidate.totalScore),
    bucketScores: roundRecord(candidate.bucketScores),
    scoreDebug: roundScoreDebug(candidate.scoreDebug),
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

function toRejectedCandidateSummary(candidate: CandidateResult): RejectedCandidateSummary {
  return {
    candidateId: candidate.candidateId,
    originalRank: null,
    candidate: toFittingCandidate(candidate),
    objectiveMode: candidate.objectiveMode,
    objectiveScoreBeforeDepthFilter: round(candidate.objectiveScoreBeforeDepthFilter),
    totalScore: round(candidate.totalScore),
    scoreDebug: roundScoreDebug(candidate.scoreDebug),
    depthRelationDebug: candidate.depthRelationDebug!,
    rejectReasons: candidate.depthRelationDebug?.ruleResults
      .filter((result) => result.reject)
      .map((result) => result.explanation) ?? [],
  }
}

function isNearerRejectedCandidate(
  next: RejectedCandidateSummary,
  current: RejectedCandidateSummary | null,
): boolean {
  if (!current) {
    return true
  }
  const nextDistance = getHardRejectViolationDistance(next)
  const currentDistance = getHardRejectViolationDistance(current)
  if (nextDistance !== currentDistance) {
    return nextDistance < currentDistance
  }
  return next.objectiveScoreBeforeDepthFilter < current.objectiveScoreBeforeDepthFilter
}

function getHardRejectViolationDistance(candidate: RejectedCandidateSummary): number {
  const distances = candidate.depthRelationDebug.ruleResults
    .filter((result) => result.reject && result.delta !== null)
    .map((result) =>
      calculateDepthRelationViolationDistance(result.relation, result.delta as number, result.margin),
    )
  if (distances.length === 0) {
    return Number.POSITIVE_INFINITY
  }
  return Math.min(...distances)
}

function attachOriginalRanksToRejectedCandidates(
  rejectedCandidates: RejectedCandidateSummary[],
  rawRanking: RankingEntry[],
): RejectedCandidateSummary[] {
  const ranks = new Map(rawRanking.map((entry) => [entry.candidateId, entry.rank]))
  return rejectedCandidates.map((candidate) => ({
    ...candidate,
    originalRank: ranks.get(candidate.candidateId) ?? null,
  }))
}

function toBucketRankingEntry(
  candidate: CandidateResult,
  bucket: CaptureBucket,
  rank: number,
): RankingEntry {
  const frameResults = candidate.perFrameResults.filter((result) => result.bucket === bucket)
  const bucketScore = scoreForBucket(candidate, bucket) ?? candidate.totalScore
  return {
    ...toRankingEntry(candidate, rank),
    totalScore: round(bucketScore),
    weightedSemanticDistance: round(
      average(frameResults.map((result) => result.weightedSemanticDistance)) ??
        candidate.weightedSemanticDistance,
    ),
    averageSemanticDistance: round(
      average(frameResults.map((result) => result.averageSemanticDistance)) ??
        candidate.averageSemanticDistance,
    ),
    sampleCount: frameResults.length,
  }
}

function emptyBucketResults(): Record<CaptureBucket, CandidateResult[]> {
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

function toFittingCandidate(candidate: FittingCandidate8): FittingCandidate8 {
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

function getCandidateParameter(
  candidate: FittingCandidate8,
  parameter: LocalSearchParameter,
): number {
  if (parameter === "pivotZ") {
    return candidate.pivotZ
  }
  if (parameter === "rotationCenter.y") {
    return getCandidateRotationCenter(candidate).y
  }
  if (parameter === "rotationCenter.z") {
    return getCandidateRotationCenter(candidate).z
  }
  return candidate.zByPointId[toPointNameParameter(parameter)]
}

function setCandidateParameter(
  candidate: FittingCandidate8,
  parameter: LocalSearchParameter,
  value: number,
): FittingCandidate8 {
  const next = cloneCandidate(candidate)
  if (parameter === "pivotZ") {
    next.pivotZ = round(value)
    next.rotationCenter = {
      ...getCandidateRotationCenter(next),
      z: round(value),
    }
    return next
  }
  if (parameter === "rotationCenter.y") {
    next.rotationCenter = {
      ...getCandidateRotationCenter(next),
      y: round(value),
    }
    return next
  }
  if (parameter === "rotationCenter.z") {
    next.rotationCenter = {
      ...getCandidateRotationCenter(next),
      z: round(value),
    }
    next.pivotZ = round(value)
    return next
  }
  next.zByPointId[toPointNameParameter(parameter)] = round(value)
  return next
}

function toPointNameParameter(parameter: LocalSearchParameter): SemanticPointName {
  return parameter.replace(".z", "") as SemanticPointName
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

function estimateCandidateCountFromCandidates(
  zCount: number,
  pivotZCount: number,
  semanticPointCount = SEMANTIC_POINT_NAMES.length,
): number {
  return zCount ** semanticPointCount * pivotZCount
}

function createCandidateId(
  index: number,
  zByPointId: Record<SemanticPointName, number>,
  pivotZ: number,
): string {
  const zLabel = SEMANTIC_POINT_NAMES.map(
    (name) => `${name}:${formatCompactNumber(zByPointId[name])}`,
  ).join(",")
  return `candidate_${String(index).padStart(5, "0")}__pivot:${formatCompactNumber(pivotZ)}__${zLabel}`
}

function buildCandidateKey(candidate: FittingCandidate8): string {
  const rotationCenter = getCandidateRotationCenter(candidate)
  return [
    `pivotZ:${formatCandidateNumber(candidate.pivotZ)}`,
    `rotationCenter.x:${formatCandidateNumber(rotationCenter.x)}`,
    `rotationCenter.y:${formatCandidateNumber(rotationCenter.y)}`,
    `rotationCenter.z:${formatCandidateNumber(rotationCenter.z)}`,
    ...SEMANTIC_POINT_NAMES.map(
      (name) => `${name}:${formatCandidateNumber(candidate.zByPointId[name])}`,
    ),
  ].join("|")
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

function weightedAverage(items: Array<{ value: number; weight: number }>): number {
  const weightTotal = items.reduce((total, item) => total + item.weight, 0)
  if (weightTotal <= EPSILON) {
    return 0
  }
  return items.reduce((total, item) => total + item.value * item.weight, 0) / weightTotal
}

function average(values: number[]): number | null {
  const finite = values.filter(Number.isFinite)
  return finite.length === 0
    ? null
    : finite.reduce((total, value) => total + value, 0) / finite.length
}

function averageNullable(values: Array<number | null>): number | null {
  return average(values.filter((value): value is number => typeof value === "number"))
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

function max(values: number[]): number | null {
  const finite = values.filter(Number.isFinite)
  return finite.length === 0 ? null : Math.max(...finite)
}

function maxNullable(values: Array<number | null>): number | null {
  const finite = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value))
  return finite.length === 0 ? null : Math.max(...finite)
}

function distance2D(current: Point2, next: Point2): number {
  return Math.hypot(current.x - next.x, current.y - next.y)
}

function round(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value
}

function roundNullable(value: number | null): number | null {
  return value === null ? null : round(value)
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

function formatCompactNumber(value: number): string {
  return round(value).toString().replaceAll(".", "p").replaceAll("-", "m")
}

function formatCandidateNumber(value: number): string {
  return round(value).toFixed(6)
}

function degreesToRadians(degrees: number): number {
  return (degrees / 180) * Math.PI
}

function safeRatio(value: number | null, base: number | null): number | null {
  if (value === null || base === null || Math.abs(base) <= EPSILON) {
    return null
  }
  return round(value / base)
}

function postMessageToMain(message: WorkerOutputMessage): void {
  self.postMessage(message)
}
