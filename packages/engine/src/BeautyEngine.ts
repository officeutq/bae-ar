import type { BeautyEngineState } from "./types"

export class BeautyEngine {
  private state: BeautyEngineState = "idle"

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
}
