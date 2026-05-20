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
    stateLog.push(engine.getState())

    app.innerHTML = `
      <section>
        <h2>Engine State:</h2>
        <p>${engine.getState()}</p>
        <h2>State Log:</h2>
        <pre>${stateLog.join("\n")}</pre>
      </section>
    `
  }

  render()

  await camera.start()

  console.log(camera.getVideo()?.constructor.name)

  await engine.initialize()

  render()

  await engine.start()

  render()
}

bootstrap()
