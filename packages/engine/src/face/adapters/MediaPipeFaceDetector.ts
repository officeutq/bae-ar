import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision"
import type { Matrix } from "@mediapipe/tasks-vision"
import type { FaceDetector } from "../FaceDetector"
import type { FaceLandmark, FacePose } from "../FaceFrame"
import type { FaceDetectionResult } from "../types"

export interface MediaPipeFaceDetectorDebugInfo {
  debugInstanceId: string
  initialized: boolean
  hasFaceLandmarker: boolean
  detectCount: number
  detectAttemptCount: number
  detectSuccessCount: number
  detectErrorCount: number
  lastDetectError: string | null
  videoWidth: number
  videoHeight: number
  lastDetectionTime: number | null
}

let mediaPipeFaceDetectorInstanceCount = 0

const EMPTY_FACE_POSE: FacePose = {
  pitch: 0,
  yaw: 0,
  roll: 0,
}

const RAD_TO_DEG = 180 / Math.PI
const LEFT_EYE_OUTER_INDEX = 263
const RIGHT_EYE_OUTER_INDEX = 33
const NOSE_TIP_INDEX = 4
const MOUTH_CENTER_INDICES = [13, 14]

export class MediaPipeFaceDetector implements FaceDetector {
  private debugInstanceId: string
  private faceLandmarker?: FaceLandmarker
  private initialized = false
  private detectCount = 0
  private detectAttemptCount = 0
  private detectSuccessCount = 0
  private detectErrorCount = 0
  private lastDetectError: string | null = null
  private videoWidth = 0
  private videoHeight = 0
  private lastDetectionTime: number | null = null

  constructor() {
    mediaPipeFaceDetectorInstanceCount += 1
    this.debugInstanceId = `MediaPipeFaceDetector-${mediaPipeFaceDetectorInstanceCount}`
  }

  async initialize(): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
    )

    this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      },
      runningMode: "VIDEO",
      numFaces: 1,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
    })
    this.initialized = true
  }

  async detect(input: HTMLVideoElement): Promise<FaceDetectionResult> {
    const timestamp = Date.now()
    this.detectAttemptCount += 1
    this.detectCount += 1
    this.videoWidth = input.videoWidth
    this.videoHeight = input.videoHeight
    this.lastDetectionTime = timestamp

    try {
      if (!this.faceLandmarker) {
        throw new Error("MediaPipeFaceDetector is not initialized")
      }

      const result = this.faceLandmarker.detectForVideo(input, timestamp)
      const faceLandmarks = result.faceLandmarks[0] ?? []
      const faceBlendshapes = result.faceBlendshapes[0]?.categories ?? []
      const facialTransformationMatrix =
        result.facialTransformationMatrixes[0]
      const detected = result.faceLandmarks.length > 0

      this.detectSuccessCount += 1
      this.lastDetectError = null

      return {
        detected,
        timestamp,
        landmarks: faceLandmarks.map((point) => ({
          x: point.x,
          y: point.y,
          z: point.z,
        })),
        blendshapes: faceBlendshapes.map((category) => ({
          categoryName: category.categoryName,
          score: category.score,
          displayName: category.displayName,
        })),
        pose: detected
          ? estimateFacePose(faceLandmarks, facialTransformationMatrix)
          : { ...EMPTY_FACE_POSE },
      }
    } catch (error) {
      this.detectErrorCount += 1
      this.lastDetectError =
        error instanceof Error ? error.message : String(error)

      throw error
    }
  }

  async dispose(): Promise<void> {
    this.faceLandmarker?.close()
    this.faceLandmarker = undefined
    this.initialized = false
  }

  getDebugInfo(): MediaPipeFaceDetectorDebugInfo {
    return {
      debugInstanceId: this.debugInstanceId,
      initialized: this.initialized,
      hasFaceLandmarker: Boolean(this.faceLandmarker),
      detectCount: this.detectCount,
      detectAttemptCount: this.detectAttemptCount,
      detectSuccessCount: this.detectSuccessCount,
      detectErrorCount: this.detectErrorCount,
      lastDetectError: this.lastDetectError,
      videoWidth: this.videoWidth,
      videoHeight: this.videoHeight,
      lastDetectionTime: this.lastDetectionTime,
    }
  }
}

function estimateFacePose(
  landmarks: FaceLandmark[],
  facialTransformationMatrix: Matrix | undefined,
): FacePose {
  return (
    estimateFacePoseFromMatrix(facialTransformationMatrix) ??
    estimateFacePoseFromLandmarks(landmarks) ?? { ...EMPTY_FACE_POSE }
  )
}

function estimateFacePoseFromMatrix(
  matrix: Matrix | undefined,
): FacePose | null {
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

  // MediaPipe's facial transformation matrix maps the canonical face to the
  // detected face. v1 extracts Euler angles from the rotation component only.
  const sy = Math.hypot(m00, m10)
  const pitch = Math.atan2(m21, m22) * RAD_TO_DEG
  const yaw = Math.atan2(-m20, sy) * RAD_TO_DEG
  const roll = Math.atan2(m10, m00) * RAD_TO_DEG

  return {
    pitch,
    yaw,
    roll,
  }
}

function estimateFacePoseFromLandmarks(
  landmarks: FaceLandmark[],
): FacePose | null {
  const leftEye = landmarks[LEFT_EYE_OUTER_INDEX]
  const rightEye = landmarks[RIGHT_EYE_OUTER_INDEX]
  const noseTip = landmarks[NOSE_TIP_INDEX]
  const mouthCenter = averageLandmarks(landmarks, MOUTH_CENTER_INDICES)

  if (!leftEye || !rightEye || !noseTip || !mouthCenter) {
    return null
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
    return null
  }

  // Fallback for SDK/runtime cases where matrix output is unavailable. These
  // values are coarse normalized-landmark estimates meant for debug/projection
  // input, not high-precision head tracking.
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

function averageLandmarks(
  landmarks: FaceLandmark[],
  indices: number[],
): FaceLandmark | null {
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
