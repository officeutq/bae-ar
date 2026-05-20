import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision"
import type { FaceDetector } from "../FaceDetector"
import type { FaceDetectionResult } from "../types"

export class MediaPipeFaceDetector implements FaceDetector {
  private faceLandmarker?: FaceLandmarker

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
  }

  async detect(input: HTMLVideoElement): Promise<FaceDetectionResult> {
    if (!this.faceLandmarker) {
      throw new Error("MediaPipeFaceDetector is not initialized")
    }

    const timestamp = Date.now()
    const result = this.faceLandmarker.detectForVideo(input, timestamp)

    return {
      detected: result.faceLandmarks.length > 0,
      timestamp,
      landmarks: [],
      pose: {
        pitch: 0,
        yaw: 0,
        roll: 0,
      },
    }
  }

  async dispose(): Promise<void> {
    this.faceLandmarker?.close()
    this.faceLandmarker = undefined
  }
}
