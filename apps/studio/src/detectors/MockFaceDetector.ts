import type { FaceDetectionResult, FaceDetector } from "@bae-ar/engine"

export class MockFaceDetector implements FaceDetector {
  async initialize(): Promise<void> {}

  async detect(): Promise<FaceDetectionResult> {
    return {
      detected: true,
    }
  }

  async dispose(): Promise<void> {}
}
