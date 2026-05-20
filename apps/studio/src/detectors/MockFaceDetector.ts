import type { FaceDetectionResult, FaceDetector } from "@bae-ar/engine"

export class MockFaceDetector implements FaceDetector {
  async initialize(): Promise<void> {}

  async detect(): Promise<FaceDetectionResult> {
    return {
      detected: true,
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
