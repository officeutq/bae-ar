import type {
  BeautyEngineInput,
  BeautyEngineOptions,
  BeautyEngineState,
} from "./types"

export class BeautyEngine {
  private state: BeautyEngineState = "idle"
  private input?: BeautyEngineInput

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
}
