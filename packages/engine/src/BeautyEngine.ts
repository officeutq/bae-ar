import type {
  BeautyEngineInput,
  BeautyEngineOptions,
  BeautyEngineState,
} from "./types"
import type { FaceDetector } from "./face/FaceDetector"
import type { FaceFrame } from "./face/FaceFrame"

type FaceFrameListener = (frame: FaceFrame) => void

export interface FaceFrameLoopDebugInfo {
  running: boolean
  tickCount: number
  inputType: string
  detectorType: string
  hasInput: boolean
  hasDetector: boolean
}

export class BeautyEngine {
  private state: BeautyEngineState = "idle"
  private input?: BeautyEngineInput
  private faceDetector?: FaceDetector
  private currentFaceFrame?: FaceFrame
  private faceFrameListeners: FaceFrameListener[] = []
  private faceFrameLoopId?: ReturnType<typeof setInterval>
  private faceFrameLoopTickCount = 0

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
      this.startFaceFrameLoopIfReady()
    }
  }

  async stop(): Promise<void> {
    if (this.state === "running") {
      this.stopFaceFrameLoop()
      this.state = "stopped"
    }
  }

  dispose(): void {
    this.stopFaceFrameLoop()
    this.state = "disposed"
  }

  getState(): BeautyEngineState {
    return this.state
  }

  setInput(input: BeautyEngineInput): void {
    this.input = input
    this.startFaceFrameLoopIfReady()
  }

  getInput(): BeautyEngineInput | undefined {
    return this.input
  }

  setFaceDetector(detector: FaceDetector): void {
    this.faceDetector = detector
    this.startFaceFrameLoopIfReady()
  }

  getFaceDetector(): FaceDetector | undefined {
    return this.faceDetector
  }

  getFaceFrame(): FaceFrame | undefined {
    return this.currentFaceFrame
  }

  onFaceFrame(callback: FaceFrameListener): void {
    this.faceFrameListeners.push(callback)
  }

  getFaceFrameLoopDebugInfo(): FaceFrameLoopDebugInfo {
    return {
      running: Boolean(this.faceFrameLoopId),
      tickCount: this.faceFrameLoopTickCount,
      inputType: this.getInputType(),
      detectorType: this.faceDetector?.constructor.name ?? "none",
      hasInput: Boolean(this.input),
      hasDetector: Boolean(this.faceDetector),
    }
  }

  private startFaceFrameLoopIfReady(): void {
    if (this.faceFrameLoopId) {
      return
    }

    const input = this.getInput()
    const detector = this.getFaceDetector()

    if (
      this.state !== "running" ||
      !(input instanceof HTMLVideoElement) ||
      !detector
    ) {
      return
    }

    this.faceFrameLoopId = setInterval(async () => {
      this.faceFrameLoopTickCount += 1

      const currentInput = this.getInput()
      const currentDetector = this.getFaceDetector()

      if (currentDetector && currentInput instanceof HTMLVideoElement) {
        const frame = await currentDetector.detect(currentInput)

        this.currentFaceFrame = frame

        this.faceFrameListeners.forEach((callback) => callback(frame))
      }
    }, 1000)
  }

  private getInputType(): string {
    if (!this.input) {
      return "none"
    }

    if (this.input instanceof HTMLVideoElement) {
      return "HTMLVideoElement"
    }

    if (this.input instanceof HTMLCanvasElement) {
      return "HTMLCanvasElement"
    }

    if (this.input instanceof HTMLImageElement) {
      return "HTMLImageElement"
    }

    return "unknown"
  }

  private stopFaceFrameLoop(): void {
    if (!this.faceFrameLoopId) {
      return
    }

    clearInterval(this.faceFrameLoopId)
    this.faceFrameLoopId = undefined
  }
}
