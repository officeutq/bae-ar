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

export interface IdealFaceModel3D {
  coordinateSpace: "normalized_canonical_face_v1"
  controlPoints: IdealFacePoint3D[]
}

export interface IdealFaceLandmarkTopology {
  mediapipeLandmarkCount: 478
  canGenerateIdealLandmarks: boolean
  projectionStatus: "not_implemented"
}

// IdealFace owns an independent canonical 3D model. It is not a MediaPipe
// 478-landmark array; Projection will later derive matching ideal landmarks.
export interface IdealFace {
  metadata: IdealFaceMetadata
  model: IdealFaceModel3D
  landmarkTopology: IdealFaceLandmarkTopology
}

export type IdealFacePreset = IdealFace
