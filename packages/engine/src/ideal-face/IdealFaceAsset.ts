import type { IdealFace, IdealFaceLandmark3D } from "./IdealFace"

export type IdealFaceAssetSchemaVersion = "ideal_face_asset_v1"

export type IdealFaceAssetGenerationMethod = "pose_aware_weighted_z_v1"

export type IdealFaceAssetLandmarkTopology = "mediapipe_face_landmarker_478"

export type IdealFaceAssetCoordinateSpace = "bae_ar_ideal_landmarks3d_v1"

export type IdealFaceAssetLandmark3D = IdealFaceLandmark3D

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
    },
    landmarkTopology: {
      mediapipeLandmarkCount: IDEAL_FACE_ASSET_LANDMARK_COUNT,
      canGenerateIdealLandmarks: true,
      projectionStatus: "not_implemented",
    },
  }
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

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input)
}
