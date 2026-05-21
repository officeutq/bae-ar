import type { FaceFrame, FaceLandmark } from "./FaceFrame"

export type FaceGeometryPoint = {
  x: number
  y: number
  z: number
}

export type FaceGeometry = {
  leftEyeCenter: FaceGeometryPoint | null
  rightEyeCenter: FaceGeometryPoint | null
  mouthCenter: FaceGeometryPoint | null
  noseTip: FaceGeometryPoint | null
  chin: FaceGeometryPoint | null
  faceCenter: FaceGeometryPoint | null
  faceWidth: number | null
  faceHeight: number | null
  eyeDistance: number | null
}

// MediaPipe Face Mesh connection groups define these as iris, eye, lip, nose,
// and face oval landmarks. v1 uses representative points from those groups.
const LEFT_IRIS_INDICES = [474, 475, 476, 477]
const RIGHT_IRIS_INDICES = [469, 470, 471, 472]
const LEFT_EYE_INDICES = [263, 362]
const RIGHT_EYE_INDICES = [33, 133]
const MOUTH_CENTER_INDICES = [13, 14]
const NOSE_TIP_INDEX = 4
const CHIN_INDEX = 152

const EMPTY_FACE_GEOMETRY: FaceGeometry = {
  leftEyeCenter: null,
  rightEyeCenter: null,
  mouthCenter: null,
  noseTip: null,
  chin: null,
  faceCenter: null,
  faceWidth: null,
  faceHeight: null,
  eyeDistance: null,
}

export function analyzeFaceGeometry(faceFrame: FaceFrame): FaceGeometry {
  if (!faceFrame.detected || faceFrame.landmarks.length === 0) {
    return { ...EMPTY_FACE_GEOMETRY }
  }

  const leftEyeCenter =
    averageLandmarks(faceFrame.landmarks, LEFT_IRIS_INDICES) ??
    averageLandmarks(faceFrame.landmarks, LEFT_EYE_INDICES)
  const rightEyeCenter =
    averageLandmarks(faceFrame.landmarks, RIGHT_IRIS_INDICES) ??
    averageLandmarks(faceFrame.landmarks, RIGHT_EYE_INDICES)
  const mouthCenter = averageLandmarks(
    faceFrame.landmarks,
    MOUTH_CENTER_INDICES,
  )
  const noseTip = landmarkToPoint(faceFrame.landmarks[NOSE_TIP_INDEX])
  const chin = landmarkToPoint(faceFrame.landmarks[CHIN_INDEX])
  const bounds = calculateBounds(faceFrame.landmarks)

  return {
    leftEyeCenter,
    rightEyeCenter,
    mouthCenter,
    noseTip,
    chin,
    faceCenter: bounds
      ? {
          x: (bounds.minX + bounds.maxX) / 2,
          y: (bounds.minY + bounds.maxY) / 2,
          z: (bounds.minZ + bounds.maxZ) / 2,
        }
      : null,
    faceWidth: bounds ? bounds.maxX - bounds.minX : null,
    faceHeight: bounds ? bounds.maxY - bounds.minY : null,
    eyeDistance:
      leftEyeCenter && rightEyeCenter
        ? calculateDistance(leftEyeCenter, rightEyeCenter)
        : null,
  }
}

function averageLandmarks(
  landmarks: FaceLandmark[],
  indices: number[],
): FaceGeometryPoint | null {
  const points = indices
    .map((index) => landmarks[index])
    .filter((landmark): landmark is FaceLandmark => Boolean(landmark))

  if (points.length !== indices.length) {
    return null
  }

  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
    z: points.reduce((sum, point) => sum + point.z, 0) / points.length,
  }
}

function landmarkToPoint(
  landmark: FaceLandmark | undefined,
): FaceGeometryPoint | null {
  if (!landmark) {
    return null
  }

  return {
    x: landmark.x,
    y: landmark.y,
    z: landmark.z,
  }
}

function calculateBounds(landmarks: FaceLandmark[]):
  | {
      minX: number
      maxX: number
      minY: number
      maxY: number
      minZ: number
      maxZ: number
    }
  | null {
  const first = landmarks[0]

  if (!first) {
    return null
  }

  return landmarks.reduce(
    (bounds, landmark) => ({
      minX: Math.min(bounds.minX, landmark.x),
      maxX: Math.max(bounds.maxX, landmark.x),
      minY: Math.min(bounds.minY, landmark.y),
      maxY: Math.max(bounds.maxY, landmark.y),
      minZ: Math.min(bounds.minZ, landmark.z),
      maxZ: Math.max(bounds.maxZ, landmark.z),
    }),
    {
      minX: first.x,
      maxX: first.x,
      minY: first.y,
      maxY: first.y,
      minZ: first.z,
      maxZ: first.z,
    },
  )
}

function calculateDistance(
  current: FaceGeometryPoint,
  next: FaceGeometryPoint,
): number {
  return Math.hypot(current.x - next.x, current.y - next.y, current.z - next.z)
}
