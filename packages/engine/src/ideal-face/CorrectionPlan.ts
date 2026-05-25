import type {
  IdealFace,
  IdealFaceCorrectionProfileSource,
} from "./IdealFace"
import {
  getCorrectionProfileOrDefault,
  getCorrectionProfileSource,
} from "./IdealFace"
import type {
  IdealLandmarkDifferenceItem,
  IdealLandmarksDifferenceDebug,
} from "./Difference"

export type CorrectionPlanStatus =
  | "not_available"
  | "missing_difference"
  | "landmark_count_mismatch"
  | "computed"

export interface CorrectionVector {
  index: number
  current: {
    x: number
    y: number
    z?: number
  }
  projectedIdeal: {
    x: number
    y: number
    z?: number
  }
  rawDeltaX: number
  rawDeltaY: number
  rawDistance: number
  strength: number
  confidence: number
  correctionDeltaX: number
  correctionDeltaY: number
  correctionDistance: number
  target: {
    x: number
    y: number
  }
  clamped: boolean
}

export interface CorrectionPlanDebug {
  status: CorrectionPlanStatus
  reason?: string
  sourceCorrectionProfile: IdealFaceCorrectionProfileSource
  pointCount: number
  config: {
    defaultStrength: number
    minStrength: number
    maxStrength: number
    maxCorrectionDistance: number
    landmarkStrengthCount: number
    topVectorCount: number
  }
  summary: {
    averageRawDistance: number | null
    maxRawDistance: number | null
    maxRawDistanceLandmarkIndex: number | null
    averageCorrectionDistance: number | null
    maxCorrectionDistance: number | null
    maxCorrectionDistanceLandmarkIndex: number | null
    clampedCount: number
    averageStrength: number | null
  }
  vectors: CorrectionVector[]
  topVectors: CorrectionVector[]
}

const DEFAULT_TOP_CORRECTION_VECTOR_COUNT = 10
const CORRECTION_PLAN_EXPECTED_POINT_COUNT = 478

export function calculateCorrectionPlanDebug(
  difference: IdealLandmarksDifferenceDebug,
  idealFace: IdealFace,
  topVectorCount = DEFAULT_TOP_CORRECTION_VECTOR_COUNT,
): CorrectionPlanDebug {
  const correctionProfile = getCorrectionProfileOrDefault(idealFace)
  const sourceCorrectionProfile = getCorrectionProfileSource(idealFace)
  const baseConfig = {
    defaultStrength: correctionProfile.defaultStrength,
    minStrength: correctionProfile.minStrength,
    maxStrength: correctionProfile.maxStrength,
    maxCorrectionDistance: correctionProfile.maxCorrectionDistance,
    landmarkStrengthCount: correctionProfile.landmarkStrengths.length,
    topVectorCount,
  }

  if (difference.status === "not_available") {
    return emptyCorrectionPlan({
      status: "not_available",
      reason: difference.reason ?? "ideal landmark difference is not available",
      sourceCorrectionProfile,
      config: baseConfig,
    })
  }

  if (
    difference.status === "missing_current_landmarks" ||
    difference.status === "missing_projected_ideal_landmarks" ||
    difference.differences.length === 0
  ) {
    return emptyCorrectionPlan({
      status: "missing_difference",
      reason: difference.reason ?? "ideal landmark difference is missing",
      sourceCorrectionProfile,
      config: baseConfig,
    })
  }

  const strengthByIndex = new Map(
    correctionProfile.landmarkStrengths.map((item) => [
      item.index,
      item.strength,
    ]),
  )
  const vectors = difference.differences.map((item) =>
    calculateCorrectionVector(
      item,
      strengthByIndex.get(item.index) ?? correctionProfile.defaultStrength,
      correctionProfile.maxCorrectionDistance,
    ),
  )
  const totals = vectors.reduce(
    (summary, vector) => ({
      rawDistance: summary.rawDistance + vector.rawDistance,
      correctionDistance:
        summary.correctionDistance + vector.correctionDistance,
      strength: summary.strength + vector.strength,
      clampedCount: summary.clampedCount + (vector.clamped ? 1 : 0),
    }),
    {
      rawDistance: 0,
      correctionDistance: 0,
      strength: 0,
      clampedCount: 0,
    },
  )
  const maxRawDistanceVector = vectors.reduce((currentMax, vector) =>
    vector.rawDistance > currentMax.rawDistance ? vector : currentMax,
  )
  const maxCorrectionDistanceVector = vectors.reduce((currentMax, vector) =>
    vector.correctionDistance > currentMax.correctionDistance
      ? vector
      : currentMax,
  )
  const status =
    difference.status === "landmark_count_mismatch" ||
    vectors.length !== CORRECTION_PLAN_EXPECTED_POINT_COUNT
      ? "landmark_count_mismatch"
      : "computed"

  return {
    status,
    reason:
      status === "landmark_count_mismatch"
        ? difference.reason ??
          `expected 478 correction vectors; got ${vectors.length}`
        : undefined,
    sourceCorrectionProfile,
    pointCount: vectors.length,
    config: baseConfig,
    summary: {
      averageRawDistance: totals.rawDistance / vectors.length,
      maxRawDistance: maxRawDistanceVector.rawDistance,
      maxRawDistanceLandmarkIndex: maxRawDistanceVector.index,
      averageCorrectionDistance: totals.correctionDistance / vectors.length,
      maxCorrectionDistance: maxCorrectionDistanceVector.correctionDistance,
      maxCorrectionDistanceLandmarkIndex: maxCorrectionDistanceVector.index,
      clampedCount: totals.clampedCount,
      averageStrength: totals.strength / vectors.length,
    },
    vectors,
    topVectors: [...vectors]
      .sort(
        (current, next) =>
          next.correctionDistance - current.correctionDistance,
      )
      .slice(0, topVectorCount),
  }
}

function calculateCorrectionVector(
  difference: IdealLandmarkDifferenceItem,
  strength: number,
  maxCorrectionDistance: number,
): CorrectionVector {
  const scaledDeltaX = difference.deltaX * strength
  const scaledDeltaY = difference.deltaY * strength
  const scaledDistance = Math.sqrt(
    scaledDeltaX * scaledDeltaX + scaledDeltaY * scaledDeltaY,
  )
  const shouldClamp =
    scaledDistance > maxCorrectionDistance && scaledDistance > 0
  const clampScale = shouldClamp
    ? maxCorrectionDistance / scaledDistance
    : 1
  const correctionDeltaX = scaledDeltaX * clampScale
  const correctionDeltaY = scaledDeltaY * clampScale
  const correctionDistance = shouldClamp
    ? maxCorrectionDistance
    : scaledDistance

  return {
    index: difference.index,
    current: difference.current,
    projectedIdeal: difference.projectedIdeal,
    rawDeltaX: difference.deltaX,
    rawDeltaY: difference.deltaY,
    rawDistance: difference.distance,
    strength,
    confidence: 1,
    correctionDeltaX,
    correctionDeltaY,
    correctionDistance,
    target: {
      x: difference.current.x + correctionDeltaX,
      y: difference.current.y + correctionDeltaY,
    },
    clamped: shouldClamp,
  }
}

function emptyCorrectionPlan(input: {
  status: Exclude<CorrectionPlanStatus, "computed" | "landmark_count_mismatch">
  reason: string
  sourceCorrectionProfile: IdealFaceCorrectionProfileSource
  config: CorrectionPlanDebug["config"]
}): CorrectionPlanDebug {
  return {
    status: input.status,
    reason: input.reason,
    sourceCorrectionProfile: input.sourceCorrectionProfile,
    pointCount: 0,
    config: input.config,
    summary: {
      averageRawDistance: null,
      maxRawDistance: null,
      maxRawDistanceLandmarkIndex: null,
      averageCorrectionDistance: null,
      maxCorrectionDistance: null,
      maxCorrectionDistanceLandmarkIndex: null,
      clampedCount: 0,
      averageStrength: null,
    },
    vectors: [],
    topVectors: [],
  }
}
