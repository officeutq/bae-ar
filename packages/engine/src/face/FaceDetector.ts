import type { FaceDetectionResult } from "./types"

export interface FaceDetector {
  initialize(): Promise<void>

  detect(input: HTMLVideoElement): Promise<FaceDetectionResult>

  dispose(): Promise<void>
}
