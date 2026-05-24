import type {
  BeautyEngineInput,
  BeautyEngineOptions,
  BeautyEngineState,
} from "./types"
import type { FaceDetector } from "./face/FaceDetector"
import {
  analyzeFaceGeometry,
  type FaceGeometry,
} from "./face/FaceGeometry"
import type { FaceFrame } from "./face/FaceFrame"
import type {
  IdealFace,
  IdealLandmarks3DProjectionResult,
  IdealFacePreset,
  IdealFaceProjectionResult,
  ProjectionDifference,
} from "./ideal-face"
import {
  calculateProjectionDifference,
  DEFAULT_IDEAL_FACE_PRESETS,
  projectIdealFaceControlPoints,
  projectIdealLandmarks3D,
} from "./ideal-face"

type FaceFrameListener = (frame: FaceFrame) => void

export interface FaceFrameLoopVideoDebugInfo {
  videoWidth: number
  videoHeight: number
  readyState: number
  paused: boolean
  ended: boolean
  currentTime: number
  hasSrcObject: boolean
}

export interface FaceFrameLoopDebugInfo {
  running: boolean
  tickCount: number
  detectCallCount: number
  detectSkipCount: number
  lastDetectSkipReason: string | null
  inputType: string
  detectorType: string
  hasInput: boolean
  hasDetector: boolean
  video: FaceFrameLoopVideoDebugInfo | null
}

export class BeautyEngine {
  private state: BeautyEngineState = "idle"
  private input?: BeautyEngineInput
  private availableIdealFaces: IdealFacePreset[] = DEFAULT_IDEAL_FACE_PRESETS
  private idealFace: IdealFace = DEFAULT_IDEAL_FACE_PRESETS[0]
  private faceDetector?: FaceDetector
  private currentFaceFrame?: FaceFrame
  private currentFaceGeometry?: FaceGeometry
  private faceFrameListeners: FaceFrameListener[] = []
  private faceFrameLoopId?: ReturnType<typeof setInterval>
  private faceFrameLoopTickCount = 0
  private faceFrameLoopDetectCallCount = 0
  private faceFrameLoopDetectSkipCount = 0
  private faceFrameLoopLastDetectSkipReason: string | null = null

  constructor(options?: BeautyEngineOptions) {
    this.input = options?.input
    this.idealFace = options?.idealFace ?? this.idealFace
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

  getFaceDetectorDebugInfo(): unknown | null {
    return this.faceDetector?.getDebugInfo?.() ?? null
  }

  setIdealFace(idealFace: IdealFace): void {
    this.idealFace = idealFace
  }

  getIdealFace(): IdealFace {
    return this.idealFace
  }

  getAvailableIdealFaces(): IdealFacePreset[] {
    return [...this.availableIdealFaces]
  }

  selectIdealFace(id: string): IdealFace | undefined {
    const selectedIdealFace = this.availableIdealFaces.find(
      (idealFace) => idealFace.metadata.id === id,
    )

    if (!selectedIdealFace) {
      return undefined
    }

    this.idealFace = selectedIdealFace

    return selectedIdealFace
  }

  getIdealFaceProjection(): IdealFaceProjectionResult {
    return this.projectIdealFace()
  }

  projectIdealFace(): IdealFaceProjectionResult {
    return projectIdealFaceControlPoints(
      this.idealFace,
      this.currentFaceFrame?.pose,
      this.currentFaceGeometry,
      this.currentFaceFrame?.detected ?? false,
    )
  }

  getIdealFaceProjectionDifference(): ProjectionDifference {
    return calculateProjectionDifference(
      this.currentFaceGeometry,
      this.getIdealFaceProjection(),
    )
  }

  getIdealLandmarks3DProjection(): IdealLandmarks3DProjectionResult {
    return this.projectIdealLandmarks3D()
  }

  projectIdealLandmarks3D(): IdealLandmarks3DProjectionResult {
    return projectIdealLandmarks3D(
      this.idealFace,
      this.currentFaceFrame?.pose,
      this.currentFaceFrame?.detected ?? false,
    )
  }

  getFaceFrame(): FaceFrame | undefined {
    return this.currentFaceFrame
  }

  getFaceGeometry(): FaceGeometry | undefined {
    return this.currentFaceGeometry
  }

  onFaceFrame(callback: FaceFrameListener): void {
    this.faceFrameListeners.push(callback)
  }

  getFaceFrameLoopDebugInfo(): FaceFrameLoopDebugInfo {
    return {
      running: Boolean(this.faceFrameLoopId),
      tickCount: this.faceFrameLoopTickCount,
      detectCallCount: this.faceFrameLoopDetectCallCount,
      detectSkipCount: this.faceFrameLoopDetectSkipCount,
      lastDetectSkipReason: this.faceFrameLoopLastDetectSkipReason,
      inputType: this.getInputType(),
      detectorType: this.faceDetector?.constructor.name ?? "none",
      hasInput: Boolean(this.input),
      hasDetector: Boolean(this.faceDetector),
      video: this.getVideoDebugInfo(),
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

      if (this.state !== "running") {
        this.recordDetectSkip("engine_not_running")
        return
      }

      if (!currentInput) {
        this.recordDetectSkip("no_input")
        return
      }

      if (!currentDetector) {
        this.recordDetectSkip("no_detector")
        return
      }

      if (!(currentInput instanceof HTMLVideoElement)) {
        this.recordDetectSkip("input_not_video")
        return
      }

      if (currentInput.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        this.recordDetectSkip("video_not_ready")
        return
      }

      if (currentInput.videoWidth === 0 || currentInput.videoHeight === 0) {
        this.recordDetectSkip("video_size_zero")
        return
      }

      this.faceFrameLoopDetectCallCount += 1

      try {
        const frame = await currentDetector.detect(currentInput)

        this.currentFaceFrame = frame
        this.currentFaceGeometry = analyzeFaceGeometry(frame)

        this.faceFrameListeners.forEach((callback) => callback(frame))
      } catch {
        return
      }
    }, 1000)
  }

  private recordDetectSkip(reason: string): void {
    this.faceFrameLoopDetectSkipCount += 1
    this.faceFrameLoopLastDetectSkipReason = reason
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

  private getVideoDebugInfo(): FaceFrameLoopVideoDebugInfo | null {
    if (!(this.input instanceof HTMLVideoElement)) {
      return null
    }

    return {
      videoWidth: this.input.videoWidth,
      videoHeight: this.input.videoHeight,
      readyState: this.input.readyState,
      paused: this.input.paused,
      ended: this.input.ended,
      currentTime: this.input.currentTime,
      hasSrcObject: Boolean(this.input.srcObject),
    }
  }

  private stopFaceFrameLoop(): void {
    if (!this.faceFrameLoopId) {
      return
    }

    clearInterval(this.faceFrameLoopId)
    this.faceFrameLoopId = undefined
  }
}
