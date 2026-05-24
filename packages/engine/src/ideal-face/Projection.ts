import type { FaceGeometry } from "../face/FaceGeometry"
import type { FacePose } from "../face/FaceFrame"
import type {
  IdealFace,
  IdealFaceLandmark3D,
  IdealFacePoint3D,
} from "./IdealFace"

export type IdealFaceProjectionStatus =
  | "projected"
  | "no_face_frame"
  | "face_not_detected"
  | "no_face_geometry"

export interface ProjectedIdealPoint {
  id: string
  x: number
  y: number
  z: number
  source: IdealFacePoint3D
}

export interface IdealFaceProjectionResult {
  status: IdealFaceProjectionStatus
  idealFaceId: string
  idealFaceVersion: string
  points: ProjectedIdealPoint[]
}

export interface ProjectedIdealLandmark2D {
  index: number
  x: number
  y: number
  z: number
  confidence: number
}

export type IdealLandmarks3DProjectionStatus =
  | "not_available"
  | "missing_face_pose"
  | "projected"

export interface IdealLandmarks3DProjectionSummary {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  zMin: number
  zMax: number
}

export interface IdealLandmarks3DProjectionResult {
  status: IdealLandmarks3DProjectionStatus
  landmarks: ProjectedIdealLandmark2D[]
  landmarkCount: number
  sourceIdealFaceId?: string
  sourceIdealFaceName?: string
  summary?: IdealLandmarks3DProjectionSummary
}

const DEG_TO_RAD = Math.PI / 180
const IDEAL_LANDMARKS_3D_COUNT = 478
const IDEAL_LANDMARKS_3D_CENTER = {
  x: 0.5,
  y: 0.5,
  z: 0,
}

interface RotatablePoint3D {
  x: number
  y: number
  z: number
}

export function projectIdealFaceControlPoints(
  idealFace: IdealFace,
  pose: FacePose | undefined,
  geometry: FaceGeometry | undefined,
  detected: boolean,
): IdealFaceProjectionResult {
  const baseResult: Omit<IdealFaceProjectionResult, "status"> = {
    idealFaceId: idealFace.metadata.id,
    idealFaceVersion: idealFace.metadata.version,
    points: [],
  }

  if (!pose) {
    return {
      ...baseResult,
      status: "no_face_frame",
    }
  }

  if (!detected) {
    return {
      ...baseResult,
      status: "face_not_detected",
    }
  }

  if (!geometry?.faceCenter || !geometry.faceWidth || !geometry.faceHeight) {
    return {
      ...baseResult,
      status: "no_face_geometry",
    }
  }

  const scaleX = geometry.faceWidth * 1.3
  const scaleY = geometry.faceHeight

  return {
    ...baseResult,
    status: "projected",
    points: idealFace.model.controlPoints.map((point) => {
      const rotated = rotatePoint(point, pose)

      return {
        id: point.id,
        x: geometry.faceCenter!.x + rotated.x * scaleX,
        y: geometry.faceCenter!.y - rotated.y * scaleY,
        z: geometry.faceCenter!.z + rotated.z * Math.max(scaleX, scaleY),
        source: point,
      }
    }),
  }
}

export function projectIdealLandmarks3D(
  idealFace: IdealFace,
  facePose: FacePose | null | undefined,
  detected = true,
): IdealLandmarks3DProjectionResult {
  const baseResult = {
    sourceIdealFaceId: idealFace.metadata.id,
    sourceIdealFaceName: idealFace.metadata.name,
  }
  const idealLandmarks3D = idealFace.model.idealLandmarks3D

  if (!idealLandmarks3D || idealLandmarks3D.length !== IDEAL_LANDMARKS_3D_COUNT) {
    return {
      ...baseResult,
      status: "not_available",
      landmarks: [],
      landmarkCount: idealLandmarks3D?.length ?? 0,
    }
  }

  if (!facePose || !detected) {
    return {
      ...baseResult,
      status: "missing_face_pose",
      landmarks: [],
      landmarkCount: idealLandmarks3D.length,
    }
  }

  const landmarks = idealLandmarks3D.map((landmark) =>
    projectIdealLandmark3D(landmark, facePose),
  )

  return {
    ...baseResult,
    status: "projected",
    landmarks,
    landmarkCount: landmarks.length,
    summary: summarizeProjectedIdealLandmarks(landmarks),
  }
}

function projectIdealLandmark3D(
  landmark: IdealFaceLandmark3D,
  pose: FacePose,
): ProjectedIdealLandmark2D {
  const centered = {
    x: landmark.x - IDEAL_LANDMARKS_3D_CENTER.x,
    y: landmark.y - IDEAL_LANDMARKS_3D_CENTER.y,
    z: landmark.z - IDEAL_LANDMARKS_3D_CENTER.z,
  }
  const rotated = rotatePoint(centered, pose)

  return {
    index: landmark.index,
    x: rotated.x + IDEAL_LANDMARKS_3D_CENTER.x,
    y: rotated.y + IDEAL_LANDMARKS_3D_CENTER.y,
    z: rotated.z + IDEAL_LANDMARKS_3D_CENTER.z,
    confidence: landmark.confidence,
  }
}

function summarizeProjectedIdealLandmarks(
  landmarks: ProjectedIdealLandmark2D[],
): IdealLandmarks3DProjectionSummary {
  return landmarks.reduce<IdealLandmarks3DProjectionSummary>(
    (summary, landmark) => ({
      xMin: Math.min(summary.xMin, landmark.x),
      xMax: Math.max(summary.xMax, landmark.x),
      yMin: Math.min(summary.yMin, landmark.y),
      yMax: Math.max(summary.yMax, landmark.y),
      zMin: Math.min(summary.zMin, landmark.z),
      zMax: Math.max(summary.zMax, landmark.z),
    }),
    {
      xMin: Number.POSITIVE_INFINITY,
      xMax: Number.NEGATIVE_INFINITY,
      yMin: Number.POSITIVE_INFINITY,
      yMax: Number.NEGATIVE_INFINITY,
      zMin: Number.POSITIVE_INFINITY,
      zMax: Number.NEGATIVE_INFINITY,
    },
  )
}

function rotatePoint<T extends RotatablePoint3D>(point: T, pose: FacePose): T {
  const pitch = pose.pitch * DEG_TO_RAD
  const yaw = pose.yaw * DEG_TO_RAD
  const roll = pose.roll * DEG_TO_RAD

  const yawed = rotateAroundY(point, yaw)
  const pitched = rotateAroundX(yawed, pitch)

  return rotateAroundZ(pitched, roll)
}

function rotateAroundX<T extends RotatablePoint3D>(point: T, angle: number): T {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  return {
    ...point,
    y: point.y * cos - point.z * sin,
    z: point.y * sin + point.z * cos,
  }
}

function rotateAroundY<T extends RotatablePoint3D>(point: T, angle: number): T {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  return {
    ...point,
    x: point.x * cos + point.z * sin,
    z: -point.x * sin + point.z * cos,
  }
}

function rotateAroundZ<T extends RotatablePoint3D>(point: T, angle: number): T {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  return {
    ...point,
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  }
}
