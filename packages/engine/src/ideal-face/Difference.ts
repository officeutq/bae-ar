import type {
  FaceGeometry,
  FaceGeometryPoint,
} from "../face/FaceGeometry"
import type {
  IdealFaceProjectionResult,
  ProjectedIdealPoint,
} from "./Projection"

export type ProjectionDifferenceStatus =
  | "calculated"
  | "projection_not_projected"
  | "no_face_geometry"

export interface IdealFaceDifferencePoint {
  id: string
  current: FaceGeometryPoint
  projected: ProjectedIdealPoint
  deltaX: number
  deltaY: number
  distance: number
}

export interface ProjectionDifference {
  status: ProjectionDifferenceStatus
  idealFaceId: string
  idealFaceVersion: string
  points: IdealFaceDifferencePoint[]
  averageDistance: number | null
  maxDistance: number | null
  maxDistancePoint: IdealFaceDifferencePoint | null
}

const GEOMETRY_POINT_BY_ID: Record<
  string,
  keyof Pick<
    FaceGeometry,
    | "faceCenter"
    | "leftEyeCenter"
    | "rightEyeCenter"
    | "noseTip"
    | "mouthCenter"
    | "chin"
  >
> = {
  face_center: "faceCenter",
  left_eye_outer: "leftEyeCenter",
  right_eye_outer: "rightEyeCenter",
  nose_tip: "noseTip",
  mouth_center: "mouthCenter",
  chin: "chin",
}

export function calculateProjectionDifference(
  geometry: FaceGeometry | undefined,
  projection: IdealFaceProjectionResult,
): ProjectionDifference {
  const baseResult: Omit<
    ProjectionDifference,
    "status" | "points" | "averageDistance" | "maxDistance" | "maxDistancePoint"
  > = {
    idealFaceId: projection.idealFaceId,
    idealFaceVersion: projection.idealFaceVersion,
  }

  if (projection.status !== "projected") {
    return emptyDifference(baseResult, "projection_not_projected")
  }

  if (!geometry) {
    return emptyDifference(baseResult, "no_face_geometry")
  }

  const points = projection.points.flatMap((projectedPoint) => {
    const geometryKey = GEOMETRY_POINT_BY_ID[projectedPoint.id]
    const currentPoint = geometryKey ? geometry[geometryKey] : null

    if (!currentPoint) {
      return []
    }

    const deltaX = projectedPoint.x - currentPoint.x
    const deltaY = projectedPoint.y - currentPoint.y

    return [
      {
        id: projectedPoint.id,
        current: currentPoint,
        projected: projectedPoint,
        deltaX,
        deltaY,
        distance: Math.hypot(deltaX, deltaY),
      },
    ]
  })

  const maxDistancePoint =
    points.length === 0
      ? null
      : points.reduce((currentMax, point) =>
          point.distance > currentMax.distance ? point : currentMax,
        )
  const totalDistance = points.reduce((sum, point) => sum + point.distance, 0)

  return {
    ...baseResult,
    status: "calculated",
    points,
    averageDistance: points.length > 0 ? totalDistance / points.length : null,
    maxDistance: maxDistancePoint?.distance ?? null,
    maxDistancePoint,
  }
}

function emptyDifference(
  baseResult: Omit<
    ProjectionDifference,
    "status" | "points" | "averageDistance" | "maxDistance" | "maxDistancePoint"
  >,
  status: Exclude<ProjectionDifferenceStatus, "calculated">,
): ProjectionDifference {
  return {
    ...baseResult,
    status,
    points: [],
    averageDistance: null,
    maxDistance: null,
    maxDistancePoint: null,
  }
}
