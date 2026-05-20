import type { FaceDetector } from "../FaceDetector"
import type { FaceDetectionResult } from "../types"

export class MediaPipeFaceDetector implements FaceDetector {
  async initialize(): Promise<void> {
    // TODO:
    //
    // MediaPipe Tasks Vision
    // 実装予定
  }

  async detect(): Promise<FaceDetectionResult> {
    return {
      detected: false,
      timestamp: Date.now(),
      landmarks: [],
      pose: {
        pitch: 0,
        yaw: 0,
        roll: 0,
      },
    }
  }

  async dispose(): Promise<void> {}
}
