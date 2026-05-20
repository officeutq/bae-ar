import type {
  BeautyEngineInput,
  BeautyEngineOptions,
  BeautyEngineState,
} from "./types"
import type { FaceDetector } from "./face/FaceDetector"

export class BeautyEngine {
  private state: BeautyEngineState = "idle"
  private input?: BeautyEngineInput
  private faceDetector?: FaceDetector

  constructor(options?: BeautyEngineOptions) {
    this.input = options?.input
  }

  async initialize(): Promise<void> {
    if (this.state === "idle") {
      this.state = "initialized"
    }
  }

  async start(): Promise<void> {
    if (this.state === "initialized") {
      this.state = "running"
    }
  }

  async stop(): Promise<void> {
    if (this.state === "running") {
      this.state = "stopped"
    }
  }

  dispose(): void {
    this.state = "disposed"
  }

  getState(): BeautyEngineState {
    return this.state
  }

  setInput(input: BeautyEngineInput): void {
    this.input = input
  }

  getInput(): BeautyEngineInput | undefined {
    return this.input
  }

  setFaceDetector(detector: FaceDetector): void {
    this.faceDetector = detector
  }

  getFaceDetector(): FaceDetector | undefined {
    return this.faceDetector
  }
}
