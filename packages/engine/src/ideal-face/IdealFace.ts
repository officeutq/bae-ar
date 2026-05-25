import {
  DEFAULT_EXPRESSION_ATTENUATION_V1,
  type ExpressionAttenuationProfile,
  type ExpressionAttenuationSource,
} from "./ExpressionAttenuation"

export interface IdealFaceMetadata {
  id: string
  name: string
  version: string
  description?: string
}

export interface IdealFacePoint3D {
  id: string
  x: number
  y: number
  z: number
  semantic?: string
}

export interface IdealFaceLandmark3D {
  index: number
  x: number
  y: number
  z: number
  confidence: number
}

export type IdealFaceCorrectionProfileSchemaVersion = "correction_profile_v1"

export type IdealFaceCorrectionProfileMode = "per_landmark_strength"

export interface IdealFaceLandmarkStrength {
  index: number
  strength: number
}

export interface IdealFaceCorrectionProfile {
  schemaVersion: IdealFaceCorrectionProfileSchemaVersion
  mode: IdealFaceCorrectionProfileMode
  defaultStrength: number
  minStrength: number
  maxStrength: number
  maxCorrectionDistance: number
  landmarkStrengths: IdealFaceLandmarkStrength[]
  expressionAttenuation?: ExpressionAttenuationProfile
}

export type IdealFaceCorrectionProfileSource = "asset" | "fallback"

export const DEFAULT_CORRECTION_PROFILE_V1: IdealFaceCorrectionProfile = {
  schemaVersion: "correction_profile_v1",
  mode: "per_landmark_strength",
  defaultStrength: 0.25,
  minStrength: 0.0,
  maxStrength: 1.0,
  maxCorrectionDistance: 0.015,
  landmarkStrengths: [],
}

export interface IdealFaceModel3D {
  coordinateSpace: "normalized_canonical_face_v1" | "bae_ar_ideal_landmarks3d_v1"
  controlPoints: IdealFacePoint3D[]
  idealLandmarks3D?: IdealFaceLandmark3D[]
  correctionProfile?: IdealFaceCorrectionProfile
}

export interface IdealFaceLandmarkTopology {
  mediapipeLandmarkCount: 478
  canGenerateIdealLandmarks: boolean
  projectionStatus: "not_implemented" | "control_points_projected"
}

// IdealFace owns an independent canonical 3D model. It is not a MediaPipe
// 478-landmark array; Projection will later derive matching ideal landmarks.
export interface IdealFace {
  metadata: IdealFaceMetadata
  model: IdealFaceModel3D
  landmarkTopology: IdealFaceLandmarkTopology
}

export type IdealFacePreset = IdealFace

export function getCorrectionProfileOrDefault(
  idealFace: IdealFace,
): IdealFaceCorrectionProfile {
  return idealFace.model.correctionProfile ?? DEFAULT_CORRECTION_PROFILE_V1
}

export function getCorrectionProfileSource(
  idealFace: IdealFace,
): IdealFaceCorrectionProfileSource {
  return idealFace.model.correctionProfile ? "asset" : "fallback"
}

export function getExpressionAttenuationProfileOrDefault(
  idealFace: IdealFace,
): {
  profile: ExpressionAttenuationProfile
  source: Exclude<ExpressionAttenuationSource, "none">
} {
  const expressionAttenuation =
    idealFace.model.correctionProfile?.expressionAttenuation

  if (expressionAttenuation) {
    return {
      profile: expressionAttenuation,
      source: "asset",
    }
  }

  return {
    profile: DEFAULT_EXPRESSION_ATTENUATION_V1,
    source: "fallback",
  }
}
