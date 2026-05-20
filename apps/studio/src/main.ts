import { BeautyEngine } from "@bae-ar/engine"
import { CameraService } from "./services/CameraService"

async function bootstrap(): Promise<void> {
  const engine = new BeautyEngine()
  const camera = new CameraService()
  const app = document.querySelector<HTMLDivElement>("#app")
  const stateLog: string[] = []

  if (!app) {
    throw new Error("Studio app root was not found")
  }

  function render(): void {
    const currentState = engine.getState()

    if (stateLog.at(-1) !== currentState) {
      stateLog.push(currentState)
    }

    app.innerHTML = `
      <section>
        <h2>Engine State:</h2>
        <p>${currentState}</p>
        <h2>State Log:</h2>
        <pre>${stateLog.join("\n")}</pre>
        <h2>Camera Status:</h2>
        <p>${camera.getState()}</p>
        <h2>Camera Error:</h2>
        <p>${camera.getError() ?? "none"}</p>
        <h2>Input:</h2>
        <p>${engine.getInput() ? "connected" : "none"}</p>
        <h2>Camera Preview:</h2>
        <div id="camera-preview">${camera.getVideo() ? "" : "not available"}</div>
      </section>
    `
  }

  render()

  await engine.initialize()

  render()

  await engine.start()

  render()

  const cameraStart = camera.start()

  render()

  try {
    await cameraStart
  } catch {
    render()
    return
  }

  const video = camera.getVideo()

  if (video) {
    engine.setInput(video)
    video.width = 640

    render()

    document
      .querySelector("#camera-preview")
      ?.append(video)
  }
}

bootstrap()
