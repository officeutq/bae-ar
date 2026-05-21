import type { IdealFacePreset } from "./IdealFace"

export const NATURAL_IDEAL_FACE_PRESET: IdealFacePreset = {
  metadata: {
    id: "natural_v1",
    name: "Natural",
    version: "1.0.0",
    description: "Minimal canonical 3D control point preset for runtime checks.",
  },
  model: {
    coordinateSpace: "normalized_canonical_face_v1",
    controlPoints: [
      { id: "face_center", x: 0, y: 0, z: 0, semantic: "face center" },
      {
        id: "left_eye_outer",
        x: -0.32,
        y: 0.18,
        z: 0.02,
        semantic: "left eye",
      },
      {
        id: "right_eye_outer",
        x: 0.32,
        y: 0.18,
        z: 0.02,
        semantic: "right eye",
      },
      { id: "nose_tip", x: 0, y: 0, z: 0.18, semantic: "nose tip" },
      { id: "mouth_center", x: 0, y: -0.34, z: 0.04, semantic: "mouth" },
      { id: "chin", x: 0, y: -0.62, z: -0.02, semantic: "chin" },
    ],
  },
  landmarkTopology: {
    mediapipeLandmarkCount: 478,
    canGenerateIdealLandmarks: false,
    projectionStatus: "not_implemented",
  },
}

export const DEFAULT_IDEAL_FACE_PRESETS: IdealFacePreset[] = [
  NATURAL_IDEAL_FACE_PRESET,
]
