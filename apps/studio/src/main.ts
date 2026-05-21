import { BeautyEngine } from "@bae-ar/engine"
import type { BeautyEngineState, FaceFrame } from "@bae-ar/engine"
import { MediaPipeFaceDetector } from "@bae-ar/engine"
import type { CameraServiceState } from "./services/CameraService"
import { CameraService } from "./services/CameraService"

interface DetectorDebugInfo {
  debugInstanceId: string
  initialized: boolean
  hasFaceLandmarker: boolean
  detectCount: number
  detectAttemptCount: number
  detectSuccessCount: number
  detectErrorCount: number
  lastDetectError: string | null
  videoWidth: number
  videoHeight: number
  lastDetectionTime: number | null
}

async function bootstrap(): Promise<void> {
  const engine = new BeautyEngine()
  const camera = new CameraService()
  const detector = new MediaPipeFaceDetector()
  const app = document.querySelector<HTMLDivElement>("#app")
  const stateLog: string[] = []
  let lastEngineState: BeautyEngineState | undefined
  let latestFaceFrame: FaceFrame | undefined

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

  function formatNumber(value: number): string {
    return value.toFixed(3)
  }

  function formatLandmarkPreview(frame: FaceFrame | undefined): string {
    if (!frame || frame.landmarks.length === 0) {
      return "なし"
    }

    return frame.landmarks
      .slice(0, 5)
      .map(
        (landmark, index) =>
          `Landmark[${index}]:\nx: ${formatNumber(landmark.x)}\ny: ${formatNumber(landmark.y)}\nz: ${formatNumber(landmark.z)}`,
      )
      .join("\n\n")
  }

  function formatBlendshapePreview(frame: FaceFrame | undefined): string {
    if (!frame?.blendshapes || frame.blendshapes.length === 0) {
      return "なし"
    }

    return [...frame.blendshapes]
      .sort((current, next) => next.score - current.score)
      .slice(0, 5)
      .map(
        (blendshape) =>
          `${blendshape.displayName || blendshape.categoryName}: ${formatNumber(blendshape.score)}`,
      )
      .join("\n")
  }

  function formatPosePreview(frame: FaceFrame | undefined): string {
    if (!frame) {
      return "なし"
    }

    return `Pitch: ${formatNumber(frame.pose.pitch)}
Yaw: ${formatNumber(frame.pose.yaw)}
Roll: ${formatNumber(frame.pose.roll)}
Pose推定: 未実装（暫定値）`
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
    const mediaPipeDebug =
      engine.getFaceDetectorDebugInfo() as DetectorDebugInfo | null
    const faceFrameLoopDebug = engine.getFaceFrameLoopDebugInfo()
    const videoDebug = faceFrameLoopDebug.video
    const frame = engine.getFaceFrame() ?? latestFaceFrame

    if (lastEngineState !== currentState) {
      stateLog.push(formatEngineState(currentState))
      lastEngineState = currentState
    }

    app.innerHTML = `
      <section>
        <h2>エンジン状態</h2>
        <p>${formatEngineState(currentState)}</p>
        <h2>状態ログ:</h2>
        <pre>${stateLog.join("\n")}</pre>
        <h2>カメラ状態</h2>
        <p>${formatCameraState(camera.getState())}</p>
        <h2>カメラエラー:</h2>
        <p>${camera.getError() ?? "なし"}</p>
        <h2>入力状態</h2>
        <p>${engine.getInput() ? "接続済み" : "未接続"}</p>
        <h2>顔検出:</h2>
        <p>${frame?.detected ? "検出中" : "未検出"}</p>
        <h2>ランドマーク数:</h2>
        <p>${frame?.landmarks.length ?? 0}</p>
        <h2>Frame timestamp:</h2>
        <p>${frame?.timestamp ?? "なし"}</p>
        <h2>Landmark preview</h2>
        <pre>${formatLandmarkPreview(frame)}</pre>
        <h2>Blendshape preview</h2>
        <pre>${formatBlendshapePreview(frame)}</pre>
        <h2>Pose preview</h2>
        <pre>${formatPosePreview(frame)}</pre>
        <h2>MediaPipe状態</h2>
        <p>${mediaPipeDebug ? (mediaPipeDebug.initialized ? "初期化済み" : "未初期化") : "不明"}</p>
        <h2>MediaPipe debugInstanceId:</h2>
        <p>${mediaPipeDebug?.debugInstanceId ?? "なし"}</p>
        <h2>検出回数:</h2>
        <p>${mediaPipeDebug?.detectCount ?? 0}</p>
        <h2>MediaPipe detect試行回数:</h2>
        <p>${mediaPipeDebug?.detectAttemptCount ?? 0}</p>
        <h2>MediaPipe detect成功回数:</h2>
        <p>${mediaPipeDebug?.detectSuccessCount ?? 0}</p>
        <h2>MediaPipe detectエラー回数:</h2>
        <p>${mediaPipeDebug?.detectErrorCount ?? 0}</p>
        <h2>MediaPipe detect最終エラー:</h2>
        <p>${mediaPipeDebug?.lastDetectError ?? "なし"}</p>
        <h2>MediaPipe initialized:</h2>
        <p>${String(mediaPipeDebug?.initialized ?? false)}</p>
        <h2>MediaPipe FaceLandmarker:</h2>
        <p>${mediaPipeDebug?.hasFaceLandmarker ? "あり" : "なし"}</p>
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
        <h2>Engine detect呼び出し回数:</h2>
        <p>${faceFrameLoopDebug.detectCallCount}</p>
        <h2>Engine detectスキップ回数:</h2>
        <p>${faceFrameLoopDebug.detectSkipCount}</p>
        <h2>Engine detect最終スキップ理由:</h2>
        <p>${faceFrameLoopDebug.lastDetectSkipReason ?? "なし"}</p>
        <h2>プレビュー:</h2>
        <div id="camera-preview">${camera.getVideo() ? "" : "利用できません"}</div>
      </section>
    `
  }

  engine.setFaceDetector(detector)
  window.setInterval(() => {
    render()
    appendCameraPreview()
  }, 1000)

  engine.onFaceFrame((frame) => {
    latestFaceFrame = frame

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
