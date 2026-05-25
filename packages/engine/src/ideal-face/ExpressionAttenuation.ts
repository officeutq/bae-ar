import type { FaceBlendshape } from "../face/FaceFrame"

export type ExpressionAttenuationSchemaVersion = "expression_attenuation_v1"

export type ExpressionLandmarkGroupId =
  | "mouth"
  | "left_eye"
  | "right_eye"
  | "face_boundary"

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

export const EXPRESSION_LANDMARK_GROUP_IDS = [
  "mouth",
  "left_eye",
  "right_eye",
  "face_boundary",
] as const satisfies readonly ExpressionLandmarkGroupId[]

// Initial v1 groups are safety/debug groups, not complete semantic segmentation.
export const EXPRESSION_LANDMARK_GROUPS: Record<
  ExpressionLandmarkGroupId,
  readonly number[]
> = {
  mouth: [
    0, 13, 14, 17, 37, 39, 40, 61, 78, 80, 81, 82, 84, 87, 88, 91, 95, 146,
    178, 181, 185, 191, 267, 269, 270, 291, 308, 310, 311, 312, 314, 317, 318,
    321, 324, 375, 402, 405, 409, 415,
  ],
  left_eye: [
    7, 33, 133, 144, 145, 153, 154, 155, 157, 158, 159, 160, 161, 163, 173,
    246,
  ],
  right_eye: [
    249, 263, 362, 373, 374, 380, 381, 382, 384, 385, 386, 387, 388, 390,
    398, 466,
  ],
  face_boundary: [
    10, 21, 54, 58, 67, 93, 103, 109, 127, 132, 136, 148, 149, 150, 152, 162,
    172, 176, 234, 251, 284, 288, 297, 323, 332, 338, 356, 361, 365, 377, 378,
    379, 389, 397, 400, 454,
  ],
}

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
    groupScales: createDefaultGroupScaleRecord(1),
  }
}

export function resetExpressionAttenuationState(
  state: ExpressionAttenuationState,
): void {
  state.previousTimestamp = null
  state.groupScales = createDefaultGroupScaleRecord(1)
}

export function getExpressionLandmarkGroupsForIndex(
  index: number,
): ExpressionLandmarkGroupId[] {
  return EXPRESSION_LANDMARK_GROUP_IDS.filter((groupId) =>
    EXPRESSION_LANDMARK_GROUPS[groupId].includes(index),
  )
}

export function calculateExpressionAttenuationDebug(input: {
  profile: ExpressionAttenuationProfile | undefined
  source: ExpressionAttenuationSource
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
      targetScales: createDefaultGroupScaleRecord(1),
      smoothedScales: createDefaultGroupScaleRecord(1),
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
      targetScales: createDefaultGroupScaleRecord(1),
      smoothedScales: createDefaultGroupScaleRecord(1),
      activeRules: [],
    })
  }

  const blendshapeScores = createBlendshapeScoreMap(input.blendshapes)
  const targetScales = createDefaultGroupScaleRecord(1)
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
      targetScales[groupId] = Math.min(targetScales[groupId], targetScale)
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
    targetScales: createDefaultGroupScaleRecord(1),
    smoothedScales: createDefaultGroupScaleRecord(1),
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
      (groupId) => expressionAttenuation.groupScales[groupId].smoothedScale,
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

  EXPRESSION_LANDMARK_GROUP_IDS.forEach((groupId) => {
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
  return {
    status: input.status,
    reason: input.reason,
    source: input.source,
    smoothing: input.smoothing,
    groupScales: {
      mouth: createGroupScaleDebug("mouth", input.targetScales, input.smoothedScales),
      left_eye: createGroupScaleDebug(
        "left_eye",
        input.targetScales,
        input.smoothedScales,
      ),
      right_eye: createGroupScaleDebug(
        "right_eye",
        input.targetScales,
        input.smoothedScales,
      ),
      face_boundary: createGroupScaleDebug(
        "face_boundary",
        input.targetScales,
        input.smoothedScales,
      ),
    },
    activeRules: input.activeRules,
    minExpressionScale:
      input.status === "computed"
        ? Math.min(
            ...EXPRESSION_LANDMARK_GROUP_IDS.map(
              (groupId) => input.smoothedScales[groupId],
            ),
          )
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
    targetScale: targetScales[group],
    smoothedScale: smoothedScales[group],
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
): Record<ExpressionLandmarkGroupId, number> {
  return {
    mouth: value,
    left_eye: value,
    right_eye: value,
    face_boundary: value,
  }
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
