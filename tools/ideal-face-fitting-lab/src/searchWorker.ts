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
  pose: Pose
  semanticPoints: SemanticPointSet2D
  bounds: Bounds2D
  warnings: string[]
}

interface SearchSettings {
  zMin: number
  zMax: number
  zStep: number
  pivotZMin: number
  pivotZMax: number
  pivotZStep: number
  topN: number
  focalLength: number
}

interface FittingCandidate8 {
  zByPointId: Record<SemanticPointName, number>
  pivotZ: number
}

interface CandidateDefinition extends FittingCandidate8 {
  candidateId: string
}

interface FrameEvaluation {
  captureId: string
  bucket: CaptureBucket
  averageSemanticDistance: number
  weightedSemanticDistance: number
  perPointError: Record<SemanticPointName, number>
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
  totalScore: number
  sampleCount: number
  warnings: string[]
  perFrameResults: FrameEvaluation[]
}

interface RankingEntry {
  rank: number
  candidateId: string
  totalScore: number
  bucketScores: PoseBucketScores
  candidate: FittingCandidate8
  weightedSemanticDistance: number
  averageSemanticDistance: number
  sampleCount: number
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
  bucketRanking: Record<CaptureBucket, RankingEntry[]>
}

interface WorkerCompleteMessage extends WorkerProgressMessage {
  type: "complete"
  bestCandidate: CandidateResult | null
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
  const zCandidates = createNumericCandidates(
    message.settings.zMin,
    message.settings.zMax,
    message.settings.zStep,
  )
  const pivotZCandidates = createNumericCandidates(
    message.settings.pivotZMin,
    message.settings.pivotZMax,
    message.settings.pivotZStep,
  )
  const estimatedCandidateCount = estimateCandidateCountFromCandidates(
    zCandidates.length,
    pivotZCandidates.length,
  )
  const chunkSize = Math.max(1, Math.floor(message.chunkSize ?? DEFAULT_CHUNK_SIZE))
  const indices = SEMANTIC_POINT_NAMES.map(() => 0)
  let pivotIndex = 0
  let processedCandidateCount = 0
  const topResults: CandidateResult[] = []
  const bucketTopResults = emptyBucketResults()
  const warnings = new Set<string>()

  const processChunk = (): void => {
    let processedInChunk = 0

    while (
      processedCandidateCount < estimatedCandidateCount &&
      processedInChunk < chunkSize &&
      !cancelRequested
    ) {
      const candidate = createCandidateFromIndices(
        processedCandidateCount + 1,
        indices,
        pivotIndex,
        zCandidates,
        pivotZCandidates,
      )
      const result = evaluateCandidate(
        candidate,
        message.basePoints,
        message.frames,
        message.settings,
      )
      for (const warning of result.warnings) {
        warnings.add(warning)
      }
      insertTopResult(topResults, result, message.settings.topN)
      insertBucketTopResults(bucketTopResults, result, message.settings.topN)

      processedCandidateCount += 1
      processedInChunk += 1
      advanceCandidateCursor(indices, zCandidates.length, () => {
        pivotIndex += 1
        if (pivotIndex < pivotZCandidates.length) {
          return false
        }
        pivotIndex = 0
        return true
      })
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
      bucketRanking: toBucketRanking(bucketTopResults),
    })

    if (processedCandidateCount >= estimatedCandidateCount) {
      postMessageToMain({
        type: "complete",
        processedCandidateCount,
        estimatedCandidateCount,
        topCandidates: toRankingEntries(topResults),
        bucketRanking: toBucketRanking(bucketTopResults),
        bestCandidate: topResults[0] ?? null,
        warnings: Array.from(warnings),
      })
      return
    }

    setTimeout(processChunk, 0)
  }

  processChunk()
}

function createCandidateFromIndices(
  index: number,
  pointIndices: number[],
  pivotIndex: number,
  zCandidates: number[],
  pivotZCandidates: number[],
): CandidateDefinition {
  const zByPointId = {} as Record<SemanticPointName, number>
  for (const [pointIndex, pointName] of SEMANTIC_POINT_NAMES.entries()) {
    zByPointId[pointName] = zCandidates[pointIndices[pointIndex]]
  }
  const pivotZ = pivotZCandidates[pivotIndex]
  return {
    candidateId: createCandidateId(index, zByPointId, pivotZ),
    zByPointId,
    pivotZ,
  }
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

function insertTopResult(results: CandidateResult[], next: CandidateResult, limit: number): void {
  results.push(next)
  results.sort((a, b) => a.totalScore - b.totalScore)
  if (results.length > limit) {
    results.length = limit
  }
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
  const ideal3D = buildIdeal3D(basePoints, candidate)
  const perFrameResults = frames.map((frame) =>
    evaluateCandidateOnFrame(candidate, ideal3D, frame, settings),
  )
  const perPointError = averagePerPointError(perFrameResults)
  const averageSemanticDistance =
    average(perFrameResults.map((result) => result.averageSemanticDistance)) ?? Number.POSITIVE_INFINITY
  const weightedSemanticDistance =
    average(perFrameResults.map((result) => result.weightedSemanticDistance)) ?? Number.POSITIVE_INFINITY
  const bucketScores = calculateBucketScores(perFrameResults)
  const totalScore = weightedSemanticDistance

  return {
    ...candidate,
    averageSemanticDistance,
    weightedSemanticDistance,
    perPointError,
    bucketScores,
    totalScore,
    sampleCount: perFrameResults.length,
    warnings: Array.from(new Set(perFrameResults.flatMap((result) => result.warnings))),
    perFrameResults,
  }
}

function evaluateCandidateOnFrame(
  candidate: CandidateDefinition,
  ideal3D: SemanticPointSet3D,
  frame: SearchFrame,
  settings: SearchSettings,
): FrameEvaluation {
  const projected = projectIdealPoints(ideal3D, frame.pose, candidate, settings)
  const current = normalizeCurrentPointsForScoring(frame.semanticPoints, frame.bounds)
  const perPointError = calculatePerPointErrors(projected, current)
  const averageSemanticDistance =
    average(SEMANTIC_POINT_NAMES.map((name) => perPointError[name])) ?? Number.POSITIVE_INFINITY
  const weightedSemanticDistance = weightedAverage(
    SEMANTIC_POINT_NAMES.map((name) => ({
      value: perPointError[name],
      weight: SCORE_WEIGHTS[name],
    })),
  )

  return {
    captureId: frame.captureId,
    bucket: frame.bucket,
    averageSemanticDistance,
    weightedSemanticDistance,
    perPointError,
    totalScore: weightedSemanticDistance,
    warnings: frame.warnings,
  }
}

function buildIdeal3D(
  basePoints: SemanticPointSet2D,
  candidate: CandidateDefinition,
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
  candidate: CandidateDefinition,
  settings: SearchSettings,
): SemanticPointSet2D {
  const points = {} as SemanticPointSet2D
  for (const name of SEMANTIC_POINT_NAMES) {
    const rotated = rotatePoint3D(
      {
        x: ideal3D[name].x,
        y: ideal3D[name].y,
        z: ideal3D[name].z - candidate.pivotZ,
      },
      pose,
    )
    const z = rotated.z + candidate.pivotZ
    const perspective = settings.focalLength / Math.max(settings.focalLength + z, 0.2)
    points[name] = {
      name,
      x: rotated.x * perspective,
      y: rotated.y * perspective,
    }
  }
  return points
}

function normalizeCurrentPointsForScoring(
  points: SemanticPointSet2D,
  bounds: Bounds2D,
): SemanticPointSet2D {
  const normalized = {} as SemanticPointSet2D
  for (const name of SEMANTIC_POINT_NAMES) {
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
): Record<SemanticPointName, number> {
  const result = {} as Record<SemanticPointName, number>
  for (const name of SEMANTIC_POINT_NAMES) {
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

function averageBucketScore(results: FrameEvaluation[], bucket: CaptureBucket): number | null {
  return roundNullable(
    average(results.filter((result) => result.bucket === bucket).map((result) => result.totalScore)),
  )
}

function averagePerPointError(results: FrameEvaluation[]): Record<SemanticPointName, number> {
  const summary = {} as Record<SemanticPointName, number>
  for (const name of SEMANTIC_POINT_NAMES) {
    summary[name] = average(results.map((result) => result.perPointError[name])) ?? 0
  }
  return summary
}

function toRankingEntry(candidate: CandidateResult, rank: number): RankingEntry {
  return {
    rank,
    candidateId: candidate.candidateId,
    totalScore: round(candidate.totalScore),
    bucketScores: roundRecord(candidate.bucketScores),
    candidate: {
      pivotZ: round(candidate.pivotZ),
      zByPointId: roundRecord(candidate.zByPointId),
    },
    weightedSemanticDistance: round(candidate.weightedSemanticDistance),
    averageSemanticDistance: round(candidate.averageSemanticDistance),
    sampleCount: candidate.sampleCount,
  }
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

function estimateCandidateCountFromCandidates(zCount: number, pivotZCount: number): number {
  return zCount ** SEMANTIC_POINT_NAMES.length * pivotZCount
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

function formatCompactNumber(value: number): string {
  return round(value).toString().replaceAll(".", "p").replaceAll("-", "m")
}

function degreesToRadians(degrees: number): number {
  return (degrees / 180) * Math.PI
}

function postMessageToMain(message: WorkerOutputMessage): void {
  self.postMessage(message)
}
