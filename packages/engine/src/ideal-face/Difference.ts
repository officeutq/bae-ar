import type {
  FaceLandmark,
} from "../face/FaceFrame"
import type {
  FaceGeometry,
  FaceGeometryPoint,
} from "../face/FaceGeometry"
import type {
  IdealLandmarks3DProjectionResult,
  IdealFaceProjectionResult,
  ProjectedIdealLandmarkImageNormalized,
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

export type IdealLandmarksDifferenceDebugStatus =
  | "not_available"
  | "missing_current_landmarks"
  | "missing_projected_ideal_landmarks"
  | "landmark_count_mismatch"
  | "computed"

export interface IdealLandmarkDifferenceItem {
  index: number
  current: {
    x: number
    y: number
    z?: number
  }
  projectedIdeal: {
    x: number
    y: number
    z?: number
  }
  deltaX: number
  deltaY: number
  distance: number
}

export interface IdealLandmarksDifferenceDebug {
  status: IdealLandmarksDifferenceDebugStatus
  reason?: string
  currentLandmarkCount: number
  projectedIdealLandmarkCount: number
  matchedLandmarkCount: number
  averageDistance: number | null
  maxDistance: number | null
  maxDistanceLandmarkIndex: number | null
  averageDeltaX: number | null
  averageDeltaY: number | null
  topDifferences: IdealLandmarkDifferenceItem[]
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

const IDEAL_LANDMARK_DIFFERENCE_EXPECTED_COUNT = 478
const DEFAULT_TOP_DIFFERENCE_COUNT = 10

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

export function calculateIdealLandmarksDifference(
  currentLandmarks: FaceLandmark[] | undefined,
  projectedIdealLandmarks: IdealLandmarks3DProjectionResult,
  topDifferenceCount = DEFAULT_TOP_DIFFERENCE_COUNT,
): IdealLandmarksDifferenceDebug {
  const currentLandmarkCount = currentLandmarks?.length ?? 0
  const projectedIdealLandmarkCount =
    projectedIdealLandmarks.imageLandmarks.length

  if (projectedIdealLandmarks.status === "not_available") {
    return emptyIdealLandmarksDifference({
      status: "not_available",
      reason:
        projectedIdealLandmarks.alignment?.reason ??
        "projected ideal imageLandmarks are not available",
      currentLandmarkCount,
      projectedIdealLandmarkCount,
    })
  }

  if (!currentLandmarks || currentLandmarks.length === 0) {
    return emptyIdealLandmarksDifference({
      status: "missing_current_landmarks",
      reason: "current image-normalized landmarks are missing",
      currentLandmarkCount,
      projectedIdealLandmarkCount,
    })
  }

  if (
    projectedIdealLandmarks.status !== "projected" ||
    projectedIdealLandmarks.imageLandmarks.length === 0
  ) {
    return emptyIdealLandmarksDifference({
      status: "missing_projected_ideal_landmarks",
      reason:
        projectedIdealLandmarks.alignment?.reason ??
        `projected ideal imageLandmarks are missing; projection status is ${projectedIdealLandmarks.status}`,
      currentLandmarkCount,
      projectedIdealLandmarkCount,
    })
  }

  const differences = calculateIdealLandmarkDifferenceItems(
    currentLandmarks,
    projectedIdealLandmarks.imageLandmarks,
  )
  const status =
    currentLandmarks.length === IDEAL_LANDMARK_DIFFERENCE_EXPECTED_COUNT &&
    projectedIdealLandmarks.imageLandmarks.length ===
      IDEAL_LANDMARK_DIFFERENCE_EXPECTED_COUNT &&
    differences.length === IDEAL_LANDMARK_DIFFERENCE_EXPECTED_COUNT
      ? "computed"
      : "landmark_count_mismatch"

  if (differences.length === 0) {
    return emptyIdealLandmarksDifference({
      status: "landmark_count_mismatch",
      reason: createLandmarkCountMismatchReason(
        currentLandmarks.length,
        projectedIdealLandmarks.imageLandmarks.length,
        differences.length,
      ),
      currentLandmarkCount,
      projectedIdealLandmarkCount,
    })
  }

  const total = differences.reduce(
    (summary, item) => ({
      distance: summary.distance + item.distance,
      deltaX: summary.deltaX + item.deltaX,
      deltaY: summary.deltaY + item.deltaY,
    }),
    {
      distance: 0,
      deltaX: 0,
      deltaY: 0,
    },
  )
  const maxDifference = differences.reduce((currentMax, item) =>
    item.distance > currentMax.distance ? item : currentMax,
  )

  return {
    status,
    reason:
      status === "landmark_count_mismatch"
        ? createLandmarkCountMismatchReason(
            currentLandmarks.length,
            projectedIdealLandmarks.imageLandmarks.length,
            differences.length,
          )
        : undefined,
    currentLandmarkCount,
    projectedIdealLandmarkCount,
    matchedLandmarkCount: differences.length,
    averageDistance: total.distance / differences.length,
    maxDistance: maxDifference.distance,
    maxDistanceLandmarkIndex: maxDifference.index,
    averageDeltaX: total.deltaX / differences.length,
    averageDeltaY: total.deltaY / differences.length,
    topDifferences: [...differences]
      .sort((current, next) => next.distance - current.distance)
      .slice(0, topDifferenceCount),
  }
}

function calculateIdealLandmarkDifferenceItems(
  currentLandmarks: FaceLandmark[],
  projectedIdealLandmarks: ProjectedIdealLandmarkImageNormalized[],
): IdealLandmarkDifferenceItem[] {
  return projectedIdealLandmarks.flatMap((projectedIdeal) => {
    const current = currentLandmarks[projectedIdeal.index]

    if (!current) {
      return []
    }

    const deltaX = projectedIdeal.x - current.x
    const deltaY = projectedIdeal.y - current.y

    return [
      {
        index: projectedIdeal.index,
        current: {
          x: current.x,
          y: current.y,
          z: current.z,
        },
        projectedIdeal: {
          x: projectedIdeal.x,
          y: projectedIdeal.y,
          z: projectedIdeal.z,
        },
        deltaX,
        deltaY,
        distance: Math.sqrt(deltaX * deltaX + deltaY * deltaY),
      },
    ]
  })
}

function createLandmarkCountMismatchReason(
  currentLandmarkCount: number,
  projectedIdealLandmarkCount: number,
  matchedLandmarkCount: number,
): string {
  return `expected 478 current and projected ideal image-normalized landmarks; got current ${currentLandmarkCount}, projected ${projectedIdealLandmarkCount}, matched ${matchedLandmarkCount}`
}

function emptyIdealLandmarksDifference(input: {
  status: Exclude<IdealLandmarksDifferenceDebugStatus, "computed">
  reason: string
  currentLandmarkCount: number
  projectedIdealLandmarkCount: number
}): IdealLandmarksDifferenceDebug {
  return {
    status: input.status,
    reason: input.reason,
    currentLandmarkCount: input.currentLandmarkCount,
    projectedIdealLandmarkCount: input.projectedIdealLandmarkCount,
    matchedLandmarkCount: 0,
    averageDistance: null,
    maxDistance: null,
    maxDistanceLandmarkIndex: null,
    averageDeltaX: null,
    averageDeltaY: null,
    topDifferences: [],
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
