import type {
  IdealFace,
  IdealFaceCorrectionProfile,
  IdealFaceLandmark3D,
} from "./IdealFace"
import {
  EXPRESSION_LANDMARK_GROUP_IDS,
  type ExpressionAttenuationProfile,
} from "./ExpressionAttenuation"

export type IdealFaceAssetSchemaVersion = "ideal_face_asset_v1"

export type IdealFaceAssetGenerationMethod = "pose_aware_weighted_z_v1"

export type IdealFaceAssetLandmarkTopology = "mediapipe_face_landmarker_478"

export type IdealFaceAssetCoordinateSpace = "bae_ar_ideal_landmarks3d_v1"

export type IdealFaceAssetLandmark3D = IdealFaceLandmark3D

export type IdealFaceAssetCorrectionProfile = IdealFaceCorrectionProfile

export interface IdealFaceAssetV1 {
  schemaVersion: IdealFaceAssetSchemaVersion
  id: string
  name: string
  version: string
  createdAt: string
  source: {
    tool: "ideal-face-authoring"
    generationMethod: IdealFaceAssetGenerationMethod
  }
  model: {
    landmarkTopology: IdealFaceAssetLandmarkTopology
    coordinateSpace: IdealFaceAssetCoordinateSpace
    idealLandmarks3D: IdealFaceAssetLandmark3D[]
  }
  correctionProfile?: IdealFaceAssetCorrectionProfile
  metadata?: Record<string, unknown>
}

export type IdealFaceAssetValidationResult =
  | {
      ok: true
      asset: IdealFaceAssetV1
    }
  | {
      ok: false
      errors: string[]
    }

const IDEAL_FACE_ASSET_LANDMARK_COUNT = 478

export function validateIdealFaceAssetV1(
  input: unknown,
): IdealFaceAssetValidationResult {
  const errors: string[] = []

  if (!isRecord(input)) {
    return {
      ok: false,
      errors: ["asset must be an object"],
    }
  }

  validateStringLiteral(
    input.schemaVersion,
    "schemaVersion",
    "ideal_face_asset_v1",
    errors,
  )
  validateString(input.id, "id", errors)
  validateString(input.name, "name", errors)
  validateString(input.version, "version", errors)
  validateString(input.createdAt, "createdAt", errors)

  if (!isRecord(input.source)) {
    errors.push("source must be an object")
  } else {
    validateStringLiteral(
      input.source.tool,
      "source.tool",
      "ideal-face-authoring",
      errors,
    )
    validateStringLiteral(
      input.source.generationMethod,
      "source.generationMethod",
      "pose_aware_weighted_z_v1",
      errors,
    )
  }

  if (!isRecord(input.model)) {
    errors.push("model must be an object")
  } else {
    validateStringLiteral(
      input.model.landmarkTopology,
      "model.landmarkTopology",
      "mediapipe_face_landmarker_478",
      errors,
    )
    validateStringLiteral(
      input.model.coordinateSpace,
      "model.coordinateSpace",
      "bae_ar_ideal_landmarks3d_v1",
      errors,
    )
    validateIdealLandmarks3D(input.model.idealLandmarks3D, errors)
  }

  if (
    input.metadata !== undefined &&
    (!isRecord(input.metadata) || Array.isArray(input.metadata))
  ) {
    errors.push("metadata must be an object when provided")
  }

  validateCorrectionProfile(input.correctionProfile, errors)

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
    }
  }

  return {
    ok: true,
    asset: input as unknown as IdealFaceAssetV1,
  }
}

export function isIdealFaceAssetV1(input: unknown): input is IdealFaceAssetV1 {
  return validateIdealFaceAssetV1(input).ok
}

export function parseIdealFaceAssetV1Json(
  jsonText: string,
): IdealFaceAssetValidationResult {
  try {
    return validateIdealFaceAssetV1(JSON.parse(jsonText))
  } catch (error) {
    return {
      ok: false,
      errors: [
        `json parse error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
    }
  }
}

export function idealFaceAssetV1ToIdealFace(
  asset: IdealFaceAssetV1,
): IdealFace {
  return {
    metadata: {
      id: asset.id,
      name: asset.name,
      version: asset.version,
    },
    model: {
      coordinateSpace: asset.model.coordinateSpace,
      controlPoints: [],
      idealLandmarks3D: asset.model.idealLandmarks3D.map((landmark) => ({
        ...landmark,
      })),
      correctionProfile: cloneCorrectionProfile(asset.correctionProfile),
    },
    landmarkTopology: {
      mediapipeLandmarkCount: IDEAL_FACE_ASSET_LANDMARK_COUNT,
      canGenerateIdealLandmarks: true,
      projectionStatus: "not_implemented",
    },
  }
}

function cloneCorrectionProfile(
  correctionProfile: IdealFaceCorrectionProfile | undefined,
): IdealFaceCorrectionProfile | undefined {
  if (!correctionProfile) {
    return undefined
  }

  return {
    ...correctionProfile,
    landmarkStrengths: correctionProfile.landmarkStrengths.map(
      (landmarkStrength) => ({
        ...landmarkStrength,
      }),
    ),
    expressionAttenuation: cloneExpressionAttenuationProfile(
      correctionProfile.expressionAttenuation,
    ),
  }
}

function cloneExpressionAttenuationProfile(
  expressionAttenuation: ExpressionAttenuationProfile | undefined,
): ExpressionAttenuationProfile | undefined {
  if (!expressionAttenuation) {
    return undefined
  }

  return {
    ...expressionAttenuation,
    smoothing: {
      ...expressionAttenuation.smoothing,
    },
    rules: expressionAttenuation.rules.map((rule) => ({
      ...rule,
      affectedLandmarkGroups: [...rule.affectedLandmarkGroups],
      inputRange: [...rule.inputRange] as [number, number],
      strengthScaleRange: [...rule.strengthScaleRange] as [number, number],
    })),
  }
}

function validateCorrectionProfile(input: unknown, errors: string[]): void {
  if (input === undefined) {
    return
  }

  const path = "correctionProfile"

  if (!isRecord(input) || Array.isArray(input)) {
    errors.push(`${path} must be an object when provided`)
    return
  }

  validateStringLiteral(
    input.schemaVersion,
    `${path}.schemaVersion`,
    "correction_profile_v1",
    errors,
  )
  validateStringLiteral(
    input.mode,
    `${path}.mode`,
    "per_landmark_strength",
    errors,
  )
  validateFiniteNumber(input.defaultStrength, `${path}.defaultStrength`, errors)
  validateNumberRange(input.defaultStrength, `${path}.defaultStrength`, 0, 1, errors)
  validateExactNumber(input.minStrength, `${path}.minStrength`, 0, errors)
  validateExactNumber(input.maxStrength, `${path}.maxStrength`, 1, errors)
  validateFiniteNumber(
    input.maxCorrectionDistance,
    `${path}.maxCorrectionDistance`,
    errors,
  )

  if (
    typeof input.maxCorrectionDistance === "number" &&
    Number.isFinite(input.maxCorrectionDistance) &&
    input.maxCorrectionDistance <= 0
  ) {
    errors.push(`${path}.maxCorrectionDistance must be greater than 0`)
  }

  validateLandmarkStrengths(input.landmarkStrengths, errors)
  validateExpressionAttenuation(input.expressionAttenuation, errors)
}

function validateExpressionAttenuation(
  input: unknown,
  errors: string[],
): void {
  if (input === undefined) {
    return
  }

  const path = "correctionProfile.expressionAttenuation"

  if (!isRecord(input) || Array.isArray(input)) {
    errors.push(`${path} must be an object when provided`)
    return
  }

  validateStringLiteral(
    input.schemaVersion,
    `${path}.schemaVersion`,
    "expression_attenuation_v1",
    errors,
  )

  if (!isRecord(input.smoothing) || Array.isArray(input.smoothing)) {
    errors.push(`${path}.smoothing must be an object`)
  } else {
    if (typeof input.smoothing.enabled !== "boolean") {
      errors.push(`${path}.smoothing.enabled must be a boolean`)
    }

    validateFiniteNumber(
      input.smoothing.halfLifeMs,
      `${path}.smoothing.halfLifeMs`,
      errors,
    )

    if (
      typeof input.smoothing.halfLifeMs === "number" &&
      Number.isFinite(input.smoothing.halfLifeMs) &&
      input.smoothing.halfLifeMs <= 0
    ) {
      errors.push(`${path}.smoothing.halfLifeMs must be greater than 0`)
    }
  }

  if (!Array.isArray(input.rules)) {
    errors.push(`${path}.rules must be an array`)
    return
  }

  input.rules.forEach((rule, ruleIndex) => {
    const rulePath = `${path}.rules[${ruleIndex}]`

    if (!isRecord(rule)) {
      errors.push(`${rulePath} must be an object`)
      return
    }

    validateNonEmptyString(rule.id, `${rulePath}.id`, errors)
    validateNonEmptyString(rule.blendshape, `${rulePath}.blendshape`, errors)
    validateAffectedLandmarkGroups(
      rule.affectedLandmarkGroups,
      `${rulePath}.affectedLandmarkGroups`,
      errors,
    )
    validateNumberTupleRange(rule.inputRange, `${rulePath}.inputRange`, errors, {
      requireAscending: true,
    })
    validateNumberTupleRange(
      rule.strengthScaleRange,
      `${rulePath}.strengthScaleRange`,
      errors,
      {
        requireAscending: false,
        min: 0,
        max: 1,
      },
    )
  })
}

function validateAffectedLandmarkGroups(
  input: unknown,
  path: string,
  errors: string[],
): void {
  if (!Array.isArray(input)) {
    errors.push(`${path} must be an array`)
    return
  }

  input.forEach((groupId, groupIndex) => {
    if (
      !(EXPRESSION_LANDMARK_GROUP_IDS as readonly unknown[]).includes(groupId)
    ) {
      errors.push(
        `${path}[${groupIndex}] must be one of ${EXPRESSION_LANDMARK_GROUP_IDS.join(
          ", ",
        )}`,
      )
    }
  })
}

function validateNumberTupleRange(
  input: unknown,
  path: string,
  errors: string[],
  options?: {
    requireAscending: boolean
    min?: number
    max?: number
  },
): void {
  if (!Array.isArray(input) || input.length !== 2) {
    errors.push(`${path} must be [number, number]`)
    return
  }

  validateFiniteNumber(input[0], `${path}[0]`, errors)
  validateFiniteNumber(input[1], `${path}[1]`, errors)

  if (
    options?.requireAscending &&
    typeof input[0] === "number" &&
    Number.isFinite(input[0]) &&
    typeof input[1] === "number" &&
    Number.isFinite(input[1]) &&
    input[0] >= input[1]
  ) {
    errors.push(`${path}[0] must be less than ${path}[1]`)
  }

  if (options?.min !== undefined && options?.max !== undefined) {
    const min = options.min
    const max = options.max

    input.forEach((value, valueIndex) => {
      validateNumberRange(
        value,
        `${path}[${valueIndex}]`,
        min,
        max,
        errors,
      )
    })
  }
}

function validateLandmarkStrengths(input: unknown, errors: string[]): void {
  const path = "correctionProfile.landmarkStrengths"

  if (!Array.isArray(input)) {
    errors.push(`${path} must be an array`)
    return
  }

  const seenIndexes = new Set<number>()

  input.forEach((landmarkStrength, arrayIndex) => {
    const itemPath = `${path}[${arrayIndex}]`

    if (!isRecord(landmarkStrength)) {
      errors.push(`${itemPath} must be an object`)
      return
    }

    validateFiniteNumber(landmarkStrength.index, `${itemPath}.index`, errors)
    validateFiniteNumber(
      landmarkStrength.strength,
      `${itemPath}.strength`,
      errors,
    )
    validateNumberRange(
      landmarkStrength.strength,
      `${itemPath}.strength`,
      0,
      1,
      errors,
    )

    if (
      typeof landmarkStrength.index === "number" &&
      Number.isFinite(landmarkStrength.index)
    ) {
      if (!Number.isInteger(landmarkStrength.index)) {
        errors.push(`${itemPath}.index must be an integer`)
      }

      if (
        Number.isInteger(landmarkStrength.index) &&
        (landmarkStrength.index < 0 ||
          landmarkStrength.index >= IDEAL_FACE_ASSET_LANDMARK_COUNT)
      ) {
        errors.push(
          `${itemPath}.index must be between 0 and ${
            IDEAL_FACE_ASSET_LANDMARK_COUNT - 1
          }, got ${landmarkStrength.index}`,
        )
      } else if (
        Number.isInteger(landmarkStrength.index) &&
        seenIndexes.has(landmarkStrength.index)
      ) {
        errors.push(`${itemPath}.index duplicates index ${landmarkStrength.index}`)
      } else if (Number.isInteger(landmarkStrength.index)) {
        seenIndexes.add(landmarkStrength.index)
      }
    }
  })
}

function validateIdealLandmarks3D(input: unknown, errors: string[]): void {
  if (!Array.isArray(input)) {
    errors.push("model.idealLandmarks3D must be an array")
    return
  }

  if (input.length !== IDEAL_FACE_ASSET_LANDMARK_COUNT) {
    errors.push(
      `model.idealLandmarks3D must contain ${IDEAL_FACE_ASSET_LANDMARK_COUNT} points, got ${input.length}`,
    )
  }

  const seenIndexes = new Set<number>()

  input.forEach((landmark, arrayIndex) => {
    const path = `model.idealLandmarks3D[${arrayIndex}]`

    if (!isRecord(landmark)) {
      errors.push(`${path} must be an object`)
      return
    }

    validateFiniteNumber(landmark.index, `${path}.index`, errors)
    validateFiniteNumber(landmark.x, `${path}.x`, errors)
    validateFiniteNumber(landmark.y, `${path}.y`, errors)
    validateFiniteNumber(landmark.z, `${path}.z`, errors)
    validateFiniteNumber(landmark.confidence, `${path}.confidence`, errors)

    if (typeof landmark.index === "number" && Number.isFinite(landmark.index)) {
      if (!Number.isInteger(landmark.index)) {
        errors.push(`${path}.index must be an integer`)
      }

      if (
        Number.isInteger(landmark.index) &&
        (landmark.index < 0 ||
          landmark.index >= IDEAL_FACE_ASSET_LANDMARK_COUNT)
      ) {
        errors.push(
          `${path}.index must be between 0 and ${
            IDEAL_FACE_ASSET_LANDMARK_COUNT - 1
          }, got ${landmark.index}`,
        )
      } else if (
        Number.isInteger(landmark.index) &&
        seenIndexes.has(landmark.index)
      ) {
        errors.push(`${path}.index duplicates index ${landmark.index}`)
      } else if (Number.isInteger(landmark.index)) {
        seenIndexes.add(landmark.index)
      }
    }

    if (
      typeof landmark.confidence === "number" &&
      Number.isFinite(landmark.confidence) &&
      (landmark.confidence < 0 || landmark.confidence > 1)
    ) {
      errors.push(
        `${path}.confidence must be between 0 and 1, got ${landmark.confidence}`,
      )
    }
  })

  for (let index = 0; index < IDEAL_FACE_ASSET_LANDMARK_COUNT; index += 1) {
    if (!seenIndexes.has(index)) {
      errors.push(`model.idealLandmarks3D is missing index ${index}`)
    }
  }
}

function validateString(
  input: unknown,
  path: string,
  errors: string[],
): void {
  if (typeof input !== "string") {
    errors.push(`${path} must be a string`)
  }
}

function validateNonEmptyString(
  input: unknown,
  path: string,
  errors: string[],
): void {
  validateString(input, path, errors)

  if (typeof input === "string" && input.trim().length === 0) {
    errors.push(`${path} must not be empty`)
  }
}

function validateStringLiteral<T extends string>(
  input: unknown,
  path: string,
  expected: T,
  errors: string[],
): void {
  if (input !== expected) {
    errors.push(`${path} must be "${expected}"`)
  }
}

function validateNumber(
  input: unknown,
  path: string,
  errors: string[],
): void {
  if (typeof input !== "number") {
    errors.push(`${path} must be a number`)
  }
}

function validateFiniteNumber(
  input: unknown,
  path: string,
  errors: string[],
): void {
  validateNumber(input, path, errors)

  if (typeof input === "number" && !Number.isFinite(input)) {
    errors.push(`${path} must be a finite number`)
  }
}

function validateNumberRange(
  input: unknown,
  path: string,
  min: number,
  max: number,
  errors: string[],
): void {
  if (
    typeof input === "number" &&
    Number.isFinite(input) &&
    (input < min || input > max)
  ) {
    errors.push(`${path} must be between ${min} and ${max}, got ${input}`)
  }
}

function validateExactNumber(
  input: unknown,
  path: string,
  expected: number,
  errors: string[],
): void {
  validateFiniteNumber(input, path, errors)

  if (
    typeof input === "number" &&
    Number.isFinite(input) &&
    input !== expected
  ) {
    errors.push(`${path} must be ${expected}, got ${input}`)
  }
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input)
}
