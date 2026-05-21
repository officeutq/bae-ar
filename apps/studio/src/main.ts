import { BeautyEngine } from "@bae-ar/engine"
import type { BeautyEngineState } from "@bae-ar/engine"
import type { FacePose } from "@bae-ar/engine"
import { MediaPipeFaceDetector } from "@bae-ar/engine"
import type { CameraServiceState } from "./services/CameraService"
import { CameraService } from "./services/CameraService"

interface DetectorDebugInfo {
  initialized: boolean
  detectCount: number
  videoWidth: number
  videoHeight: number
  lastDetectionTime: number | null
}

function getDetectorDebugInfo(detector: unknown): DetectorDebugInfo | undefined {
  if (
    detector &&
    typeof detector === "object" &&
    "getDebugInfo" in detector &&
    typeof detector.getDebugInfo === "function"
  ) {
    return detector.getDebugInfo() as DetectorDebugInfo
  }

  return undefined
}

async function bootstrap(): Promise<void> {
  const engine = new BeautyEngine()
  const camera = new CameraService()
  const detector = new MediaPipeFaceDetector()
  const app = document.querySelector<HTMLDivElement>("#app")
  const stateLog: string[] = []
  let lastEngineState: BeautyEngineState | undefined
  let faceDetected = false
  let facePose: FacePose = {
    pitch: 0,
    yaw: 0,
    roll: 0,
  }
  let landmarkCount = 0

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

  function appendCameraPreview(): void {
    const input = engine.getInput()

    if (input instanceof HTMLVideoElement) {
      document
        .querySelector("#camera-preview")
        ?.append(input)
    }
  }

  function render(): void {
    const currentState = engine.getState()
    const mediaPipeDebug = getDetectorDebugInfo(detector)
    const faceFrameLoopDebug = engine.getFaceFrameLoopDebugInfo()
    const videoDebug = faceFrameLoopDebug.video

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
        <h2>ランドマーク数:</h2>
        <p>${landmarkCount}</p>
        <h2>MediaPipe状態:</h2>
        <p>${mediaPipeDebug ? (mediaPipeDebug.initialized ? "初期化済み" : "未初期化") : "不明"}</p>
        <h2>検出回数:</h2>
        <p>${mediaPipeDebug?.detectCount ?? 0}</p>
        <h2>MediaPipe Video:</h2>
        <p>${mediaPipeDebug?.videoWidth ?? 0}x${mediaPipeDebug?.videoHeight ?? 0}</p>
        <h2>FaceFrame Video:</h2>
        <p>${videoDebug?.videoWidth ?? 0}x${videoDebug?.videoHeight ?? 0}</p>
        <h2>Video readyState:</h2>
        <p>${videoDebug?.readyState ?? 0}</p>
        <h2>Video paused:</h2>
        <p>${videoDebug ? String(videoDebug.paused) : "true"}</p>
        <h2>Video currentTime:</h2>
        <p>${videoDebug?.currentTime ?? 0}</p>
        <h2>Video srcObject:</h2>
        <p>${videoDebug?.hasSrcObject ? "あり" : "なし"}</p>
        <h2>FaceFrameループ:</h2>
        <p>${faceFrameLoopDebug.running ? "実行中" : "停止中"}</p>
        <h2>ループ回数:</h2>
        <p>${faceFrameLoopDebug.tickCount}</p>
        <h2>入力型:</h2>
        <p>${faceFrameLoopDebug.inputType}</p>
        <h2>Detector:</h2>
        <p>${faceFrameLoopDebug.detectorType}</p>
        <h2>顔姿勢:</h2>
        <pre>Pitch:${facePose.pitch}
Yaw:${facePose.yaw}
Roll:${facePose.roll}</pre>
        <h2>プレビュー:</h2>
        <div id="camera-preview">${camera.getVideo() ? "" : "利用できません"}</div>
      </section>
    `
  }

  engine.setFaceDetector(detector)
  engine.onFaceFrame((frame) => {
    faceDetected = frame.detected
    facePose = frame.pose
    landmarkCount = frame.landmarks.length

    render()
    appendCameraPreview()
  })

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
    appendCameraPreview()
  }
}

bootstrap()
