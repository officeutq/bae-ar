import type { FaceBlendshape } from "../face/FaceFrame"
import {
  DEFAULT_LANDMARK_GROUPS_V1,
  DEFAULT_LANDMARK_GROUP_IDS,
  getLandmarkGroupsForIndex,
  type LandmarkGroups,
} from "./LandmarkGroups"

export type ExpressionAttenuationSchemaVersion = "expression_attenuation_v1"

export type ExpressionLandmarkGroupId = string

export interface ExpressionAttenuationRule {
  id: string
  blendshape: string
  affectedLandmarkGroups: ExpressionLandmarkGroupId[]
  inputRange: [number, number]
  strengthScaleRange: [number, number]
}

export interface ExpressionAttenuationSmoothing {
  enabled: boolean
  halfLifeMs: number
}

export interface ExpressionAttenuationProfile {
  schemaVersion: ExpressionAttenuationSchemaVersion
  smoothing: ExpressionAttenuationSmoothing
  rules: ExpressionAttenuationRule[]
}

export type ExpressionAttenuationSource = "asset" | "fallback" | "none"

export type ExpressionAttenuationStatus =
  | "computed"
  | "not_available"
  | "disabled"

export interface ExpressionAttenuationGroupScaleDebug {
  group: ExpressionLandmarkGroupId
  targetScale: number
  smoothedScale: number
}

export interface ExpressionAttenuationActiveRuleDebug {
  id: string
  blendshape: string
  score: number | null
  targetScale: number
  affectedLandmarkGroups: ExpressionLandmarkGroupId[]
}

export interface ExpressionAttenuationDebug {
  status: ExpressionAttenuationStatus
  reason?: string
  source: ExpressionAttenuationSource
  smoothing: {
    enabled: boolean
    halfLifeMs: number | null
  }
  groupScales: Record<ExpressionLandmarkGroupId, ExpressionAttenuationGroupScaleDebug>
  activeRules: ExpressionAttenuationActiveRuleDebug[]
  minExpressionScale: number | null
}

export interface ExpressionAttenuationState {
  previousTimestamp: number | null
  groupScales: Record<ExpressionLandmarkGroupId, number>
}

export const EXPRESSION_LANDMARK_GROUP_IDS =
  DEFAULT_LANDMARK_GROUP_IDS as readonly ExpressionLandmarkGroupId[]

// Initial v1 groups are safety/debug groups, not complete semantic segmentation.
export const EXPRESSION_LANDMARK_GROUPS: Record<
  ExpressionLandmarkGroupId,
  readonly number[]
> = Object.fromEntries(
  DEFAULT_LANDMARK_GROUPS_V1.groups.map((group) => [group.id, group.indices]),
)

export const DEFAULT_EXPRESSION_ATTENUATION_V1: ExpressionAttenuationProfile = {
  schemaVersion: "expression_attenuation_v1",
  smoothing: {
    enabled: true,
    halfLifeMs: 120,
  },
  rules: [
    {
      id: "jaw_open_reduce_mouth",
      blendshape: "jawOpen",
      affectedLandmarkGroups: ["mouth"],
      inputRange: [0.15, 0.6],
      strengthScaleRange: [1.0, 0.2],
    },
    {
      id: "left_eye_blink_reduce_left_eye",
      blendshape: "eyeBlinkLeft",
      affectedLandmarkGroups: ["left_eye"],
      inputRange: [0.2, 0.8],
      strengthScaleRange: [1.0, 0.2],
    },
    {
      id: "right_eye_blink_reduce_right_eye",
      blendshape: "eyeBlinkRight",
      affectedLandmarkGroups: ["right_eye"],
      inputRange: [0.2, 0.8],
      strengthScaleRange: [1.0, 0.2],
    },
    {
      id: "left_eye_squint_reduce_left_eye",
      blendshape: "eyeSquintLeft",
      affectedLandmarkGroups: ["left_eye"],
      inputRange: [0.2, 0.7],
      strengthScaleRange: [1.0, 0.3],
    },
    {
      id: "right_eye_squint_reduce_right_eye",
      blendshape: "eyeSquintRight",
      affectedLandmarkGroups: ["right_eye"],
      inputRange: [0.2, 0.7],
      strengthScaleRange: [1.0, 0.3],
    },
  ],
}

export function createExpressionAttenuationState(): ExpressionAttenuationState {
  return {
    previousTimestamp: null,
    groupScales: {},
  }
}

export function resetExpressionAttenuationState(
  state: ExpressionAttenuationState,
): void {
  state.previousTimestamp = null
  state.groupScales = {}
}

export function getExpressionLandmarkGroupsForIndex(
  index: number,
  landmarkGroups: LandmarkGroups = DEFAULT_LANDMARK_GROUPS_V1,
): ExpressionLandmarkGroupId[] {
  return getLandmarkGroupsForIndex(index, landmarkGroups)
}

export function calculateExpressionAttenuationDebug(input: {
  profile: ExpressionAttenuationProfile | undefined
  source: ExpressionAttenuationSource
  landmarkGroups: LandmarkGroups
  blendshapes: FaceBlendshape[] | undefined
  timestamp: number | undefined
  state: ExpressionAttenuationState | undefined
}): ExpressionAttenuationDebug {
  if (!input.profile || input.source === "none") {
    resetStateIfAvailable(input.state)

    return createExpressionAttenuationDebug({
      status: "disabled",
      reason: "expressionAttenuation is not configured",
      source: "none",
      smoothing: {
        enabled: false,
        halfLifeMs: null,
      },
      targetScales: createDefaultGroupScaleRecord(1, input.landmarkGroups),
      smoothedScales: createDefaultGroupScaleRecord(1, input.landmarkGroups),
      activeRules: [],
    })
  }

  if (!input.blendshapes || input.blendshapes.length === 0) {
    resetStateIfAvailable(input.state)

    return createExpressionAttenuationDebug({
      status: "not_available",
      reason: "blendshapes are not available",
      source: input.source,
      smoothing: {
        enabled: input.profile.smoothing.enabled,
        halfLifeMs: input.profile.smoothing.halfLifeMs,
      },
      targetScales: createDefaultGroupScaleRecord(
        1,
        input.landmarkGroups,
        input.profile,
      ),
      smoothedScales: createDefaultGroupScaleRecord(
        1,
        input.landmarkGroups,
        input.profile,
      ),
      activeRules: [],
    })
  }

  const blendshapeScores = createBlendshapeScoreMap(input.blendshapes)
  const targetScales = createDefaultGroupScaleRecord(
    1,
    input.landmarkGroups,
    input.profile,
  )
  const activeRules: ExpressionAttenuationActiveRuleDebug[] = []

  input.profile.rules.forEach((rule) => {
    const score = blendshapeScores.get(rule.blendshape) ?? null
    const targetScale =
      score === null ? 1 : calculateRuleTargetScale(rule, score)

    activeRules.push({
      id: rule.id,
      blendshape: rule.blendshape,
      score,
      targetScale,
      affectedLandmarkGroups: [...rule.affectedLandmarkGroups],
    })

    rule.affectedLandmarkGroups.forEach((groupId) => {
      targetScales[groupId] = Math.min(targetScales[groupId] ?? 1, targetScale)
    })
  })

  const smoothedScales = smoothGroupScales({
    targetScales,
    smoothing: input.profile.smoothing,
    timestamp: input.timestamp,
    state: input.state,
  })

  return createExpressionAttenuationDebug({
    status: "computed",
    source: input.source,
    smoothing: {
      enabled: input.profile.smoothing.enabled,
      halfLifeMs: input.profile.smoothing.halfLifeMs,
    },
    targetScales,
    smoothedScales,
    activeRules,
  })
}

export function createUnavailableExpressionAttenuationDebug(input: {
  profile: ExpressionAttenuationProfile | undefined
  source: ExpressionAttenuationSource
  landmarkGroups: LandmarkGroups
  reason: string
  state: ExpressionAttenuationState | undefined
}): ExpressionAttenuationDebug {
  resetStateIfAvailable(input.state)

  return createExpressionAttenuationDebug({
    status: input.profile ? "not_available" : "disabled",
    reason: input.profile ? input.reason : "expressionAttenuation is not configured",
    source: input.profile ? input.source : "none",
    smoothing: {
      enabled: input.profile?.smoothing.enabled ?? false,
      halfLifeMs: input.profile?.smoothing.halfLifeMs ?? null,
    },
    targetScales: createDefaultGroupScaleRecord(
      1,
      input.landmarkGroups,
      input.profile,
    ),
    smoothedScales: createDefaultGroupScaleRecord(
      1,
      input.landmarkGroups,
      input.profile,
    ),
    activeRules: [],
  })
}

export function getExpressionStrengthScaleForGroups(
  groups: ExpressionLandmarkGroupId[],
  expressionAttenuation: ExpressionAttenuationDebug,
): number {
  if (groups.length === 0 || expressionAttenuation.status !== "computed") {
    return 1
  }

  return Math.min(
    ...groups.map(
      (groupId) =>
        expressionAttenuation.groupScales[groupId]?.smoothedScale ?? 1,
    ),
  )
}

function calculateRuleTargetScale(
  rule: ExpressionAttenuationRule,
  score: number,
): number {
  const [inputMin, inputMax] = rule.inputRange
  const [scaleStart, scaleEnd] = rule.strengthScaleRange
  const t = clamp((score - inputMin) / (inputMax - inputMin), 0, 1)

  return lerp(scaleStart, scaleEnd, t)
}

function smoothGroupScales(input: {
  targetScales: Record<ExpressionLandmarkGroupId, number>
  smoothing: ExpressionAttenuationSmoothing
  timestamp: number | undefined
  state: ExpressionAttenuationState | undefined
}): Record<ExpressionLandmarkGroupId, number> {
  if (!input.smoothing.enabled || !input.state) {
    return { ...input.targetScales }
  }

  const timestamp = input.timestamp

  if (timestamp === undefined || !Number.isFinite(timestamp)) {
    input.state.groupScales = { ...input.targetScales }
    input.state.previousTimestamp = null

    return { ...input.state.groupScales }
  }

  if (input.state.previousTimestamp === null) {
    input.state.groupScales = { ...input.targetScales }
    input.state.previousTimestamp = timestamp

    return { ...input.state.groupScales }
  }

  const deltaTimeMs = Math.max(0, timestamp - input.state.previousTimestamp)
  const alpha =
    deltaTimeMs === 0
      ? 0
      : 1 - Math.exp(-deltaTimeMs / input.smoothing.halfLifeMs)

  Object.keys(input.targetScales).forEach((groupId) => {
    const previousScale = input.state?.groupScales[groupId] ?? 1
    const targetScale = input.targetScales[groupId]

    if (input.state) {
      input.state.groupScales[groupId] =
        previousScale + (targetScale - previousScale) * alpha
    }
  })
  input.state.previousTimestamp = timestamp

  return { ...input.state.groupScales }
}

function createExpressionAttenuationDebug(input: {
  status: ExpressionAttenuationStatus
  reason?: string
  source: ExpressionAttenuationSource
  smoothing: {
    enabled: boolean
    halfLifeMs: number | null
  }
  targetScales: Record<ExpressionLandmarkGroupId, number>
  smoothedScales: Record<ExpressionLandmarkGroupId, number>
  activeRules: ExpressionAttenuationActiveRuleDebug[]
}): ExpressionAttenuationDebug {
  const groupScales = Object.fromEntries(
    Object.keys(input.smoothedScales).map((groupId) => [
      groupId,
      createGroupScaleDebug(groupId, input.targetScales, input.smoothedScales),
    ]),
  )
  const smoothedScaleValues = Object.values(input.smoothedScales)

  return {
    status: input.status,
    reason: input.reason,
    source: input.source,
    smoothing: input.smoothing,
    groupScales,
    activeRules: input.activeRules,
    minExpressionScale:
      input.status === "computed" && smoothedScaleValues.length > 0
        ? Math.min(...smoothedScaleValues)
        : null,
  }
}

function createGroupScaleDebug(
  group: ExpressionLandmarkGroupId,
  targetScales: Record<ExpressionLandmarkGroupId, number>,
  smoothedScales: Record<ExpressionLandmarkGroupId, number>,
): ExpressionAttenuationGroupScaleDebug {
  return {
    group,
    targetScale: targetScales[group] ?? 1,
    smoothedScale: smoothedScales[group] ?? 1,
  }
}

function createBlendshapeScoreMap(
  blendshapes: FaceBlendshape[],
): Map<string, number> {
  const scores = new Map<string, number>()

  blendshapes.forEach((blendshape) => {
    scores.set(blendshape.categoryName, blendshape.score)

    if (blendshape.displayName) {
      scores.set(blendshape.displayName, blendshape.score)
    }
  })

  return scores
}

function createDefaultGroupScaleRecord(
  value: number,
  landmarkGroups: LandmarkGroups,
  profile?: ExpressionAttenuationProfile,
): Record<ExpressionLandmarkGroupId, number> {
  const groupIds = new Set(landmarkGroups.groups.map((group) => group.id))

  profile?.rules.forEach((rule) => {
    rule.affectedLandmarkGroups.forEach((groupId) => {
      groupIds.add(groupId)
    })
  })

  return Object.fromEntries(
    [...groupIds].map((groupId) => [groupId, value]),
  )
}

function resetStateIfAvailable(
  state: ExpressionAttenuationState | undefined,
): void {
  if (state) {
    resetExpressionAttenuationState(state)
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}
