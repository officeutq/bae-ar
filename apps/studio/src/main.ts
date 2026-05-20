import { BeautyEngine } from "@bae-ar/engine"
import type { BeautyEngineState } from "@bae-ar/engine"
import type { CameraServiceState } from "./services/CameraService"
import { MockFaceDetector } from "./detectors/MockFaceDetector"
import { CameraService } from "./services/CameraService"

async function bootstrap(): Promise<void> {
  const engine = new BeautyEngine()
  const camera = new CameraService()
  const detector = new MockFaceDetector()
  const app = document.querySelector<HTMLDivElement>("#app")
  const stateLog: string[] = []
  let lastEngineState: BeautyEngineState | undefined
  let faceDetected = false

  if (!app) {
    throw new Error("Studio app root was not found")
  }

  function formatEngineState(state: BeautyEngineState): string {
    const labels: Record<BeautyEngineState, string> = {
      idle: "待機中",
      initialized: "初期化済み",
      running: "実行中",
      stopped: "停止中",
      disposed: "破棄済み",
    }

    return labels[state]
  }

  function formatCameraState(state: CameraServiceState): string {
    const labels: Record<CameraServiceState, string> = {
      idle: "待機中",
      starting: "起動中",
      running: "実行中",
      stopped: "停止中",
      error: "エラー",
    }

    return labels[state]
  }

  function render(): void {
    const currentState = engine.getState()

    if (lastEngineState !== currentState) {
      stateLog.push(formatEngineState(currentState))
      lastEngineState = currentState
    }

    app.innerHTML = `
      <section>
        <h2>エンジン状態:</h2>
        <p>${formatEngineState(currentState)}</p>
        <h2>状態ログ:</h2>
        <pre>${stateLog.join("\n")}</pre>
        <h2>カメラ状態:</h2>
        <p>${formatCameraState(camera.getState())}</p>
        <h2>カメラエラー:</h2>
        <p>${camera.getError() ?? "なし"}</p>
        <h2>入力状態:</h2>
        <p>${engine.getInput() ? "接続済み" : "未接続"}</p>
        <h2>顔検出:</h2>
        <p>${faceDetected ? "検出中" : "未検出"}</p>
        <h2>プレビュー:</h2>
        <div id="camera-preview">${camera.getVideo() ? "" : "利用できません"}</div>
      </section>
    `
  }

  engine.setFaceDetector(detector)

  await detector.initialize()

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

    async function updateFaceDetection(): Promise<void> {
      const input = engine.getInput()

      if (input instanceof HTMLVideoElement) {
        const result = await detector.detect(input)
        faceDetected = result.detected

        render()

        document
          .querySelector("#camera-preview")
          ?.append(input)
      }
    }

    await updateFaceDetection()

    setInterval(updateFaceDetection, 1000)
  }
}

bootstrap()
