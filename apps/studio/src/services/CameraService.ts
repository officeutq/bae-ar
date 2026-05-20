export class CameraService {
  private video?: HTMLVideoElement

  async start(): Promise<void> {
    this.video = document.createElement("video")
  }

  stop(): void {
    this.video = undefined
  }

  getVideo(): HTMLVideoElement | undefined {
    return this.video
  }
}
