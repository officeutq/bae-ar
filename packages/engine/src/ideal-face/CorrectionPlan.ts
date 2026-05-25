import type {
  IdealFace,
  IdealFaceCorrectionProfileSource,
} from "./IdealFace"
import {
  getExpressionAttenuationProfileOrDefault,
  getCorrectionProfileOrDefault,
  getCorrectionProfileSource,
} from "./IdealFace"
import {
  createLandmarkGroupsDebugSummary,
  getLandmarkGroupsOrDefault,
  type LandmarkGroups,
  type LandmarkGroupsDebugSummary,
} from "./LandmarkGroups"
import type {
  IdealLandmarkDifferenceItem,
  IdealLandmarksDifferenceDebug,
} from "./Difference"
import type { FaceBlendshape } from "../face/FaceFrame"
import {
  calculateExpressionAttenuationDebug,
  createUnavailableExpressionAttenuationDebug,
  getExpressionLandmarkGroupsForIndex,
  getExpressionStrengthScaleForGroups,
  type ExpressionAttenuationDebug,
  type ExpressionAttenuationState,
  type ExpressionLandmarkGroupId,
} from "./ExpressionAttenuation"

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
  baseStrength: number
  expressionStrengthScale: number
  finalStrength: number
  affectedGroups: ExpressionLandmarkGroupId[]
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
  landmarkGroups: LandmarkGroupsDebugSummary
  pointCount: number
  config: {
    defaultStrength: number
    minStrength: number
    maxStrength: number
    maxCorrectionDistance: number
    landmarkStrengthCount: number
    topVectorCount: number
  }
  expressionAttenuation: ExpressionAttenuationDebug
  summary: {
    averageRawDistance: number | null
    maxRawDistance: number | null
    maxRawDistanceLandmarkIndex: number | null
    averageCorrectionDistance: number | null
    maxCorrectionDistance: number | null
    maxCorrectionDistanceLandmarkIndex: number | null
    clampedCount: number
    averageStrength: number | null
    averageBaseStrength: number | null
    averageFinalStrength: number | null
    minExpressionScale: number | null
  }
  vectors: CorrectionVector[]
  topVectors: CorrectionVector[]
}

const DEFAULT_TOP_CORRECTION_VECTOR_COUNT = 10
const CORRECTION_PLAN_EXPECTED_POINT_COUNT = 478

export interface CorrectionPlanCalculationOptions {
  topVectorCount?: number
  blendshapes?: FaceBlendshape[]
  timestamp?: number
  expressionAttenuationState?: ExpressionAttenuationState
}

export function calculateCorrectionPlanDebug(
  difference: IdealLandmarksDifferenceDebug,
  idealFace: IdealFace,
  optionsOrTopVectorCount: CorrectionPlanCalculationOptions | number = {},
): CorrectionPlanDebug {
  const options =
    typeof optionsOrTopVectorCount === "number"
      ? { topVectorCount: optionsOrTopVectorCount }
      : optionsOrTopVectorCount
  const topVectorCount =
    options.topVectorCount ?? DEFAULT_TOP_CORRECTION_VECTOR_COUNT
  const correctionProfile = getCorrectionProfileOrDefault(idealFace)
  const sourceCorrectionProfile = getCorrectionProfileSource(idealFace)
  const expressionAttenuationProfile =
    getExpressionAttenuationProfileOrDefault(idealFace)
  const landmarkGroupsResolution = getLandmarkGroupsOrDefault(idealFace)
  const landmarkGroupsDebugSummary = createLandmarkGroupsDebugSummary(
    landmarkGroupsResolution,
  )
  const baseConfig = {
    defaultStrength: correctionProfile.defaultStrength,
    minStrength: correctionProfile.minStrength,
    maxStrength: correctionProfile.maxStrength,
    maxCorrectionDistance: correctionProfile.maxCorrectionDistance,
    landmarkStrengthCount: correctionProfile.landmarkStrengths.length,
    topVectorCount,
  }

  if (difference.status === "not_available") {
    const expressionAttenuation = createUnavailableExpressionAttenuationDebug({
      profile: expressionAttenuationProfile.profile,
      source: expressionAttenuationProfile.source,
      landmarkGroups: landmarkGroupsResolution.groups,
      reason: difference.reason ?? "ideal landmark difference is not available",
      state: options.expressionAttenuationState,
    })

    return emptyCorrectionPlan({
      status: "not_available",
      reason: difference.reason ?? "ideal landmark difference is not available",
      sourceCorrectionProfile,
      landmarkGroups: landmarkGroupsDebugSummary,
      config: baseConfig,
      expressionAttenuation,
    })
  }

  if (
    difference.status === "missing_current_landmarks" ||
    difference.status === "missing_projected_ideal_landmarks" ||
    difference.differences.length === 0
  ) {
    const expressionAttenuation = createUnavailableExpressionAttenuationDebug({
      profile: expressionAttenuationProfile.profile,
      source: expressionAttenuationProfile.source,
      landmarkGroups: landmarkGroupsResolution.groups,
      reason: difference.reason ?? "ideal landmark difference is missing",
      state: options.expressionAttenuationState,
    })

    return emptyCorrectionPlan({
      status: "missing_difference",
      reason: difference.reason ?? "ideal landmark difference is missing",
      sourceCorrectionProfile,
      landmarkGroups: landmarkGroupsDebugSummary,
      config: baseConfig,
      expressionAttenuation,
    })
  }

  const expressionAttenuation = calculateExpressionAttenuationDebug({
    profile: expressionAttenuationProfile.profile,
    source: expressionAttenuationProfile.source,
    landmarkGroups: landmarkGroupsResolution.groups,
    blendshapes: options.blendshapes,
    timestamp: options.timestamp,
    state: options.expressionAttenuationState,
  })
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
      expressionAttenuation,
      landmarkGroupsResolution.groups,
    ),
  )
  const totals = vectors.reduce(
    (summary, vector) => ({
      rawDistance: summary.rawDistance + vector.rawDistance,
      correctionDistance:
        summary.correctionDistance + vector.correctionDistance,
      baseStrength: summary.baseStrength + vector.baseStrength,
      finalStrength: summary.finalStrength + vector.finalStrength,
      clampedCount: summary.clampedCount + (vector.clamped ? 1 : 0),
    }),
    {
      rawDistance: 0,
      correctionDistance: 0,
      baseStrength: 0,
      finalStrength: 0,
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
    landmarkGroups: landmarkGroupsDebugSummary,
    pointCount: vectors.length,
    config: baseConfig,
    expressionAttenuation,
    summary: {
      averageRawDistance: totals.rawDistance / vectors.length,
      maxRawDistance: maxRawDistanceVector.rawDistance,
      maxRawDistanceLandmarkIndex: maxRawDistanceVector.index,
      averageCorrectionDistance: totals.correctionDistance / vectors.length,
      maxCorrectionDistance: maxCorrectionDistanceVector.correctionDistance,
      maxCorrectionDistanceLandmarkIndex: maxCorrectionDistanceVector.index,
      clampedCount: totals.clampedCount,
      averageStrength: totals.finalStrength / vectors.length,
      averageBaseStrength: totals.baseStrength / vectors.length,
      averageFinalStrength: totals.finalStrength / vectors.length,
      minExpressionScale: expressionAttenuation.minExpressionScale,
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
  baseStrength: number,
  maxCorrectionDistance: number,
  expressionAttenuation: ExpressionAttenuationDebug,
  landmarkGroups: LandmarkGroups,
): CorrectionVector {
  const affectedGroups = getExpressionLandmarkGroupsForIndex(
    difference.index,
    landmarkGroups,
  )
  const expressionStrengthScale = getExpressionStrengthScaleForGroups(
    affectedGroups,
    expressionAttenuation,
  )
  const finalStrength = baseStrength * expressionStrengthScale
  const scaledDeltaX = difference.deltaX * finalStrength
  const scaledDeltaY = difference.deltaY * finalStrength
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
    baseStrength,
    expressionStrengthScale,
    finalStrength,
    affectedGroups,
    strength: finalStrength,
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
  landmarkGroups: LandmarkGroupsDebugSummary
  config: CorrectionPlanDebug["config"]
  expressionAttenuation: ExpressionAttenuationDebug
}): CorrectionPlanDebug {
  return {
    status: input.status,
    reason: input.reason,
    sourceCorrectionProfile: input.sourceCorrectionProfile,
    landmarkGroups: input.landmarkGroups,
    pointCount: 0,
    config: input.config,
    expressionAttenuation: input.expressionAttenuation,
    summary: {
      averageRawDistance: null,
      maxRawDistance: null,
      maxRawDistanceLandmarkIndex: null,
      averageCorrectionDistance: null,
      maxCorrectionDistance: null,
      maxCorrectionDistanceLandmarkIndex: null,
      clampedCount: 0,
      averageStrength: null,
      averageBaseStrength: null,
      averageFinalStrength: null,
      minExpressionScale: null,
    },
    vectors: [],
    topVectors: [],
  }
}
