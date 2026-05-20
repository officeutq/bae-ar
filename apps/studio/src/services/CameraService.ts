export type CameraServiceState =
  | "idle"
  | "starting"
  | "running"
  | "stopped"
  | "error"

export class CameraService {
  private video?: HTMLVideoElement
  private state: CameraServiceState = "idle"
  private errorMessage?: string

  async start(): Promise<void> {
    this.state = "starting"
    this.errorMessage = undefined

    try {
      this.video = document.createElement("video")
      this.video.autoplay = true
      this.video.muted = true
      this.video.playsInline = true

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      })

      this.video.srcObject = stream

      await this.video.play()

      this.state = "running"
    } catch (error) {
      this.state = "error"
      this.errorMessage = error instanceof Error
        ? error.message
        : String(error)
      this.video = undefined

      throw error
    }
  }

  stop(): void {
    const stream = this.video?.srcObject as MediaStream | null

    stream
      ?.getTracks()
      .forEach((track) => track.stop())

    this.video = undefined
    this.state = "stopped"
  }

  getVideo(): HTMLVideoElement | undefined {
    return this.video
  }

  getState(): CameraServiceState {
    return this.state
  }

  getError(): string | undefined {
    return this.errorMessage
  }
}
