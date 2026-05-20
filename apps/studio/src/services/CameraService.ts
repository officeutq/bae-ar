export class CameraService {
  private video?: HTMLVideoElement

  async start(): Promise<void> {
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
  }

  stop(): void {
    const stream = this.video?.srcObject as MediaStream | null

    stream
      ?.getTracks()
      .forEach((track) => track.stop())

    this.video = undefined
  }

  getVideo(): HTMLVideoElement | undefined {
    return this.video
  }
}
