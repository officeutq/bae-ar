import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision"
import type { FaceDetector } from "../FaceDetector"
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

      this.detectSuccessCount += 1
      this.lastDetectError = null

      return {
        detected: result.faceLandmarks.length > 0,
        timestamp,
        landmarks: faceLandmarks.map((point) => ({
          x: point.x,
          y: point.y,
          z: point.z,
        })),
        pose: {
          pitch: 0,
          yaw: 0,
          roll: 0,
        },
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
