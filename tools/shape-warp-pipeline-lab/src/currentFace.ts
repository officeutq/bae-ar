import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision"
import type { Matrix, NormalizedLandmark } from "@mediapipe/tasks-vision"
import type {
  CurrentFaceFrame,
  FacePose,
  Landmark,
  MatrixDebug,
  PoseMappingPose,
} from "./types"
import { REQUIRED_LANDMARK_COUNT } from "./types"

const MEDIAPIPE_WASM_PATH =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
const MEDIAPIPE_FACE_LANDMARKER_MODEL_ASSET_PATH =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
const RAD_TO_DEG = 180 / Math.PI
const LEFT_EYE_OUTER_INDEX = 263
const RIGHT_EYE_OUTER_INDEX = 33
const NOSE_TIP_INDEX = 4
const MOUTH_CENTER_INDICES = [13, 14]

export type FaceLandmarkerResultLike = ReturnType<FaceLandmarker["detectForVideo"]>

export async function createFaceLandmarker(
  runningMode: "VIDEO" | "IMAGE",
): Promise<FaceLandmarker> {
  const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH)
  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MEDIAPIPE_FACE_LANDMARKER_MODEL_ASSET_PATH,
    },
    runningMode,
    numFaces: 1,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
  })
}

export function buildCurrentFaceFrame(
  result: FaceLandmarkerResultLike,
  frameId: number,
  mediaTimeSec: number | null,
): CurrentFaceFrame {
  const landmarks = result.faceLandmarks[0] ?? []
  const matrix = summarizeFaceMatrix(result.facialTransformationMatrixes[0])
  const P_camera = matrix?.rotationDeg ?? estimatePoseFromLandmarks(landmarks)
  const hasFace = result.faceLandmarks.length > 0
  const validLandmarks = landmarks.length === REQUIRED_LANDMARK_COUNT

  if (!hasFace) {
    return {
      currentFaceStatus: "missing",
      frameId,
      mediaTimeSec,
      landmarkCount: 0,
      current478: null,
      P_camera,
      qualityScore: 0,
      matrix,
      errorMessage: "no_face",
    }
  }

  if (!validLandmarks) {
    return {
      currentFaceStatus: "invalid",
      frameId,
      mediaTimeSec,
      landmarkCount: landmarks.length,
      current478: null,
      P_camera,
      qualityScore: 0,
      matrix,
      errorMessage: `invalid_landmarks: ${landmarks.length}`,
    }
  }

  return {
    currentFaceStatus: "detected",
    frameId,
    mediaTimeSec,
    landmarkCount: landmarks.length,
    current478: mapLandmarks(landmarks),
    P_camera,
    qualityScore: hasFullPose(P_camera) ? 1 : 0.7,
    matrix,
    errorMessage: null,
  }
}

export function createCurrentFaceErrorFrame(
  frameId: number,
  mediaTimeSec: number | null,
  error: unknown,
): CurrentFaceFrame {
  const message = error instanceof Error ? error.message : String(error)
  return {
    currentFaceStatus: "error",
    frameId,
    mediaTimeSec,
    landmarkCount: 0,
    current478: null,
    P_camera: createEmptyPose(),
    qualityScore: 0,
    matrix: null,
    errorMessage: message,
  }
}

export function mapLandmarks(landmarks: readonly NormalizedLandmark[]): Landmark[] {
  return landmarks.map((point, index) => ({
    index,
    x: point.x,
    y: point.y,
    z: point.z,
  }))
}

export function summarizeFaceMatrix(matrix: Matrix | undefined): MatrixDebug | null {
  if (!matrix) {
    return null
  }
  return {
    rows: matrix.rows,
    columns: matrix.columns,
    dataPreview: Array.from(matrix.data).slice(0, 16),
    rotationDeg: estimatePoseFromMatrix(matrix),
  }
}

export function estimatePoseFromMatrix(matrix: Matrix | undefined): FacePose | null {
  if (
    !matrix ||
    matrix.rows < 3 ||
    matrix.columns < 3 ||
    matrix.data.length < matrix.columns * 3
  ) {
    return null
  }

  const columns = matrix.columns
  const m00 = matrix.data[0 * columns + 0]
  const m10 = matrix.data[1 * columns + 0]
  const m20 = matrix.data[2 * columns + 0]
  const m21 = matrix.data[2 * columns + 1]
  const m22 = matrix.data[2 * columns + 2]

  if ([m00, m10, m20, m21, m22].some((value) => !Number.isFinite(value))) {
    return null
  }

  const sy = Math.hypot(m00, m10)
  return {
    pitch: Math.atan2(m21, m22) * RAD_TO_DEG,
    yaw: Math.atan2(-m20, sy) * RAD_TO_DEG,
    roll: Math.atan2(m10, m00) * RAD_TO_DEG,
  }
}

export function estimatePoseFromLandmarks(
  landmarks: readonly NormalizedLandmark[],
): FacePose {
  const leftEye = landmarks[LEFT_EYE_OUTER_INDEX]
  const rightEye = landmarks[RIGHT_EYE_OUTER_INDEX]
  const noseTip = landmarks[NOSE_TIP_INDEX]
  const mouthCenter = averageLandmarks(landmarks, MOUTH_CENTER_INDICES)

  if (!leftEye || !rightEye || !noseTip || !mouthCenter) {
    return createEmptyPose()
  }

  const eyeCenter = {
    x: (leftEye.x + rightEye.x) / 2,
    y: (leftEye.y + rightEye.y) / 2,
    z: (leftEye.z + rightEye.z) / 2,
  }
  const eyeDistance = Math.hypot(leftEye.x - rightEye.x, leftEye.y - rightEye.y)
  const eyeToMouthDistance = Math.hypot(
    mouthCenter.x - eyeCenter.x,
    mouthCenter.y - eyeCenter.y,
  )

  if (eyeDistance === 0 || eyeToMouthDistance === 0) {
    return createEmptyPose()
  }

  return {
    pitch: clamp(
      ((noseTip.y - eyeCenter.y) / eyeToMouthDistance - 0.6) * 60,
      -45,
      45,
    ),
    yaw: clamp(((noseTip.x - eyeCenter.x) / eyeDistance) * 70, -45, 45),
    roll:
      Math.atan2(leftEye.y - rightEye.y, leftEye.x - rightEye.x) * RAD_TO_DEG,
  }
}

export function hasFullPose(pose: FacePose): pose is PoseMappingPose {
  return pose.yaw !== null && pose.pitch !== null && pose.roll !== null
}

export function createEmptyPose(): FacePose {
  return {
    yaw: null,
    pitch: null,
    roll: null,
  }
}

function averageLandmarks(
  landmarks: readonly NormalizedLandmark[],
  indices: readonly number[],
): NormalizedLandmark | null {
  const points = indices
    .map((index) => landmarks[index])
    .filter((landmark): landmark is NormalizedLandmark => Boolean(landmark))

  if (points.length !== indices.length) {
    return null
  }

  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
    z: points.reduce((sum, point) => sum + point.z, 0) / points.length,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
