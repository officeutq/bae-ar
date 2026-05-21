import type { FaceGeometry } from "../face/FaceGeometry"
import type { FacePose } from "../face/FaceFrame"
import type { IdealFace, IdealFacePoint3D } from "./IdealFace"

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

const DEG_TO_RAD = Math.PI / 180

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

function rotatePoint(point: IdealFacePoint3D, pose: FacePose): IdealFacePoint3D {
  const pitch = pose.pitch * DEG_TO_RAD
  const yaw = pose.yaw * DEG_TO_RAD
  const roll = pose.roll * DEG_TO_RAD

  const yawed = rotateAroundY(point, yaw)
  const pitched = rotateAroundX(yawed, pitch)

  return rotateAroundZ(pitched, roll)
}

function rotateAroundX(
  point: IdealFacePoint3D,
  angle: number,
): IdealFacePoint3D {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  return {
    ...point,
    y: point.y * cos - point.z * sin,
    z: point.y * sin + point.z * cos,
  }
}

function rotateAroundY(
  point: IdealFacePoint3D,
  angle: number,
): IdealFacePoint3D {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  return {
    ...point,
    x: point.x * cos + point.z * sin,
    z: -point.x * sin + point.z * cos,
  }
}

function rotateAroundZ(
  point: IdealFacePoint3D,
  angle: number,
): IdealFacePoint3D {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  return {
    ...point,
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  }
}
