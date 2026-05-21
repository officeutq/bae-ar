import { BeautyEngine } from "@bae-ar/engine"
import type {
  BeautyEngineState,
  FaceFrame,
  FaceGeometry,
  FaceGeometryPoint,
} from "@bae-ar/engine"
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

type DebugSection =
  | "faceFrame"
  | "faceGeometry"
  | "mediaPipe"
  | "loopTiming"
  | "fullDebugText"

async function bootstrap(): Promise<void> {
  const engine = new BeautyEngine()
  const camera = new CameraService()
  const detector = new MediaPipeFaceDetector()
  const app = document.querySelector<HTMLDivElement>("#app")
  const overlayCanvas = document.createElement("canvas")
  const stateLog: string[] = []
  let lastEngineState: BeautyEngineState | undefined
  let latestFaceFrame: FaceFrame | undefined
  let previousFrameTimestamp: number | undefined
  let faceFrameFps: number | undefined
  let copyStatus = ""
  const openDebugSections: Record<DebugSection, boolean> = {
    faceFrame: false,
    faceGeometry: false,
    mediaPipe: false,
    loopTiming: false,
    fullDebugText: false,
  }

  overlayCanvas.className = "overlay"

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

  function formatDetection(frame: FaceFrame | undefined): string {
    return frame?.detected ? "検出中" : "未検出"
  }

  function formatNumber(value: number): string {
    return value.toFixed(3)
  }

  function formatNullableNumber(value: number | null | undefined): string {
    return value === null || value === undefined ? "なし" : formatNumber(value)
  }

  function formatGeometryPoint(
    point: FaceGeometryPoint | null | undefined,
  ): string {
    if (!point) {
      return "なし"
    }

    return `x=${formatNumber(point.x)} y=${formatNumber(point.y)} z=${formatNumber(point.z)}`
  }

  function formatFps(value: number | undefined): string {
    return value === undefined ? "計測中" : value.toFixed(1)
  }

  function escapeHtml(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;")
  }

  function formatLandmarkPreview(frame: FaceFrame | undefined): string {
    if (!frame || frame.landmarks.length === 0) {
      return "なし"
    }

    return frame.landmarks
      .slice(0, 5)
      .map(
        (landmark, index) =>
          `Landmark[${index}]:
x: ${formatNumber(landmark.x)}
y: ${formatNumber(landmark.y)}
z: ${formatNumber(landmark.z)}`,
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

    return `pitch: ${formatNumber(frame.pose.pitch)}
yaw: ${formatNumber(frame.pose.yaw)}
roll: ${formatNumber(frame.pose.roll)}`
  }

  function formatFaceGeometryPreview(
    geometry: FaceGeometry | undefined,
  ): string {
    return `FaceGeometry:
leftEyeCenter: ${formatGeometryPoint(geometry?.leftEyeCenter)}
rightEyeCenter: ${formatGeometryPoint(geometry?.rightEyeCenter)}
mouthCenter: ${formatGeometryPoint(geometry?.mouthCenter)}
noseTip: ${formatGeometryPoint(geometry?.noseTip)}
chin: ${formatGeometryPoint(geometry?.chin)}
faceCenter: ${formatGeometryPoint(geometry?.faceCenter)}
faceWidth: ${formatNullableNumber(geometry?.faceWidth)}
faceHeight: ${formatNullableNumber(geometry?.faceHeight)}
eyeDistance: ${formatNullableNumber(geometry?.eyeDistance)}`
  }

  function buildDebugText(
    frame: FaceFrame | undefined,
    geometry: FaceGeometry | undefined,
    mediaPipeDebug: DetectorDebugInfo | null,
    faceFrameLoopDebug: ReturnType<BeautyEngine["getFaceFrameLoopDebugInfo"]>,
  ): string {
    const videoDebug = faceFrameLoopDebug.video

    return `Engine: ${engine.getState()}
Camera: ${camera.getState()}
Detection: ${frame?.detected ? "detected" : "not detected"}
Landmarks: ${frame?.landmarks.length ?? 0}
FPS: ${formatFps(faceFrameFps)}
Loop: ${faceFrameLoopDebug.running ? "running" : "stopped"}
Detect: ${faceFrameLoopDebug.detectCallCount}/${mediaPipeDebug?.detectSuccessCount ?? 0}

MediaPipe:
- debugInstanceId: ${mediaPipeDebug?.debugInstanceId ?? "none"}
- initialized: ${String(mediaPipeDebug?.initialized ?? false)}
- faceLandmarker: ${mediaPipeDebug?.hasFaceLandmarker ? "available" : "none"}
- detectCount: ${mediaPipeDebug?.detectCount ?? 0}
- detectAttempts: ${mediaPipeDebug?.detectAttemptCount ?? 0}
- detectSuccess: ${mediaPipeDebug?.detectSuccessCount ?? 0}
- detectErrors: ${mediaPipeDebug?.detectErrorCount ?? 0}
- lastDetectError: ${mediaPipeDebug?.lastDetectError ?? "none"}
- video: ${mediaPipeDebug?.videoWidth ?? 0}x${mediaPipeDebug?.videoHeight ?? 0}
- lastDetectionTime: ${mediaPipeDebug?.lastDetectionTime ?? "none"}

FaceFrame:
- detected: ${String(frame?.detected ?? false)}
- timestamp: ${frame?.timestamp ?? "none"}
- landmarks: ${frame?.landmarks.length ?? 0}
- blendshapes: ${frame?.blendshapes?.length ?? 0}
- pose.pitch: ${frame ? formatNumber(frame.pose.pitch) : "none"}
- pose.yaw: ${frame ? formatNumber(frame.pose.yaw) : "none"}
- pose.roll: ${frame ? formatNumber(frame.pose.roll) : "none"}

Landmark preview:
${formatLandmarkPreview(frame)}

Blendshape preview:
${formatBlendshapePreview(frame)}

Pose:
${formatPosePreview(frame)}

${formatFaceGeometryPreview(geometry)}

Timing:
- faceFrameFps: ${formatFps(faceFrameFps)}
- videoCurrentTime: ${videoDebug?.currentTime ?? 0}
- lastDetectionTime: ${mediaPipeDebug?.lastDetectionTime ?? "none"}

Loop debug:
- running: ${String(faceFrameLoopDebug.running)}
- ticks: ${faceFrameLoopDebug.tickCount}
- detectCalls: ${faceFrameLoopDebug.detectCallCount}
- detectSkips: ${faceFrameLoopDebug.detectSkipCount}
- lastDetectSkipReason: ${faceFrameLoopDebug.lastDetectSkipReason ?? "none"}
- inputType: ${faceFrameLoopDebug.inputType}
- detectorType: ${faceFrameLoopDebug.detectorType}
- hasInput: ${String(faceFrameLoopDebug.hasInput)}
- hasDetector: ${String(faceFrameLoopDebug.hasDetector)}

Video:
- size: ${videoDebug?.videoWidth ?? 0}x${videoDebug?.videoHeight ?? 0}
- readyState: ${videoDebug?.readyState ?? 0}
- paused: ${videoDebug ? String(videoDebug.paused) : "true"}
- ended: ${videoDebug ? String(videoDebug.ended) : "false"}
- srcObject: ${videoDebug?.hasSrcObject ? "available" : "none"}

State log:
${stateLog.join("\n") || "なし"}

Camera:
- error: ${camera.getError() ?? "none"}`
  }

  function appendCameraPreview(): void {
    const input = engine.getInput()

    if (input instanceof HTMLVideoElement) {
      document
        .querySelector("#camera-preview")
        ?.append(input, overlayCanvas)
      drawLandmarkOverlay(latestFaceFrame, engine.getFaceGeometry())
    }
  }

  function resizeOverlayCanvas(video: HTMLVideoElement): boolean {
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return false
    }

    if (
      overlayCanvas.width !== video.videoWidth ||
      overlayCanvas.height !== video.videoHeight
    ) {
      overlayCanvas.width = video.videoWidth
      overlayCanvas.height = video.videoHeight
    }

    return true
  }

  function clearLandmarkOverlay(): void {
    const context = overlayCanvas.getContext("2d")

    context?.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)
  }

  function drawLandmarkOverlay(
    frame: FaceFrame | undefined,
    geometry: FaceGeometry | undefined,
  ): void {
    const input = engine.getInput()

    if (!(input instanceof HTMLVideoElement) || !resizeOverlayCanvas(input)) {
      clearLandmarkOverlay()
      return
    }

    const context = overlayCanvas.getContext("2d")

    if (!context) {
      return
    }

    context.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)

    if (!frame?.detected || frame.landmarks.length === 0) {
      return
    }

    context.fillStyle = "#42f57b"

    frame.landmarks.forEach((landmark) => {
      const x = landmark.x * overlayCanvas.width
      const y = landmark.y * overlayCanvas.height

      context.beginPath()
      context.arc(x, y, 1.5, 0, Math.PI * 2)
      context.fill()
    })

    context.fillStyle = "#ff3f81"

    const geometryPoints = [
      geometry?.leftEyeCenter,
      geometry?.rightEyeCenter,
      geometry?.mouthCenter,
      geometry?.noseTip,
      geometry?.chin,
      geometry?.faceCenter,
    ]

    geometryPoints.forEach((point) => {
      if (!point) {
        return
      }

      const x = point.x * overlayCanvas.width
      const y = point.y * overlayCanvas.height

      context.beginPath()
      context.arc(x, y, 4, 0, Math.PI * 2)
      context.fill()
    })
  }

  async function copyDebugText(debugText: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(debugText)
      return
    } catch {
      const textarea = document.createElement("textarea")

      textarea.value = debugText
      textarea.readOnly = true
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.append(textarea)
      textarea.select()

      const copied = document.execCommand("copy")

      textarea.remove()

      if (!copied) {
        throw new Error("Copy Debug failed")
      }
    }
  }

  function attachCopyDebugHandler(debugText: string): void {
    document
      .querySelector<HTMLButtonElement>("#copy-debug")
      ?.addEventListener("click", async () => {
        try {
          await copyDebugText(debugText)
          copyStatus = "コピーしました"
        } catch {
          copyStatus = "コピーに失敗しました"
        }

        render()
        appendCameraPreview()
      })
  }

  function detailsOpenAttribute(section: DebugSection): string {
    return openDebugSections[section] ? " open" : ""
  }

  function attachDebugDetailsHandlers(): void {
    document
      .querySelectorAll<HTMLDetailsElement>("details[data-debug-section]")
      .forEach((details) => {
        const section = details.dataset.debugSection as DebugSection | undefined

        if (!section) {
          return
        }

        details.addEventListener("toggle", () => {
          openDebugSections[section] = details.open
        })
      })
  }

  function render(): void {
    const currentState = engine.getState()
    const mediaPipeDebug =
      engine.getFaceDetectorDebugInfo() as DetectorDebugInfo | null
    const faceFrameLoopDebug = engine.getFaceFrameLoopDebugInfo()
    const frame = engine.getFaceFrame() ?? latestFaceFrame
    const geometry = engine.getFaceGeometry()
    const debugText = buildDebugText(
      frame,
      geometry,
      mediaPipeDebug,
      faceFrameLoopDebug,
    )

    if (lastEngineState !== currentState) {
      stateLog.push(formatEngineState(currentState))
      lastEngineState = currentState
    }

    app.innerHTML = `
      <section>
        <header>
          <h2>Debug summary</h2>
          <button id="copy-debug" type="button">Copy Debug</button>
          <span aria-live="polite">${copyStatus}</span>
        </header>
        <style>
          .preview-container {
            position: relative;
            display: inline-block;
            max-width: 100%;
          }

          .preview-container video {
            display: block;
            max-width: 100%;
            height: auto;
          }

          .preview-container .overlay {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
          }
        </style>
        <pre>Engine: ${formatEngineState(currentState)}
Camera: ${formatCameraState(camera.getState())}
Detection: ${formatDetection(frame)}
Landmarks: ${frame?.landmarks.length ?? 0}
顔姿勢: yaw ${frame ? formatNumber(frame.pose.yaw) : "なし"} / pitch ${frame ? formatNumber(frame.pose.pitch) : "なし"} / roll ${frame ? formatNumber(frame.pose.roll) : "なし"}
FPS: ${formatFps(faceFrameFps)}
Loop: ${faceFrameLoopDebug.running ? "実行中" : "停止中"}
Detect: ${faceFrameLoopDebug.detectCallCount}/${mediaPipeDebug?.detectSuccessCount ?? 0}</pre>
        <h2>プレビュー</h2>
        <div id="camera-preview" class="preview-container">${camera.getVideo() ? "" : "利用できません"}</div>
        <details data-debug-section="faceFrame"${detailsOpenAttribute("faceFrame")}>
          <summary>FaceFrame Debug</summary>
          <pre>${escapeHtml(`Frame timestamp: ${frame?.timestamp ?? "なし"}
顔検出: ${formatDetection(frame)}
ランドマーク数: ${frame?.landmarks.length ?? 0}
blendshape数: ${frame?.blendshapes?.length ?? 0}

Landmark preview:
${formatLandmarkPreview(frame)}

Blendshape preview:
${formatBlendshapePreview(frame)}

FacePose:
${formatPosePreview(frame)}`)}</pre>
        </details>
        <details data-debug-section="faceGeometry"${detailsOpenAttribute("faceGeometry")}>
          <summary>FaceGeometry Debug</summary>
          <pre>${escapeHtml(formatFaceGeometryPreview(geometry))}</pre>
        </details>
        <details data-debug-section="mediaPipe"${detailsOpenAttribute("mediaPipe")}>
          <summary>MediaPipe Debug</summary>
          <pre>${escapeHtml(`initialized: ${String(mediaPipeDebug?.initialized ?? false)}
FaceLandmarker: ${mediaPipeDebug?.hasFaceLandmarker ? "あり" : "なし"}
debugInstanceId: ${mediaPipeDebug?.debugInstanceId ?? "なし"}
detectCount: ${mediaPipeDebug?.detectCount ?? 0}
detectAttemptCount: ${mediaPipeDebug?.detectAttemptCount ?? 0}
detectSuccessCount: ${mediaPipeDebug?.detectSuccessCount ?? 0}
detectErrorCount: ${mediaPipeDebug?.detectErrorCount ?? 0}
lastDetectError: ${mediaPipeDebug?.lastDetectError ?? "なし"}
video: ${mediaPipeDebug?.videoWidth ?? 0}x${mediaPipeDebug?.videoHeight ?? 0}
lastDetectionTime: ${mediaPipeDebug?.lastDetectionTime ?? "なし"}`)}</pre>
        </details>
        <details data-debug-section="loopTiming"${detailsOpenAttribute("loopTiming")}>
          <summary>Loop / Timing Debug</summary>
          <pre>${escapeHtml(`FaceFrameループ: ${faceFrameLoopDebug.running ? "実行中" : "停止中"}
ループ回数: ${faceFrameLoopDebug.tickCount}
Engine detect呼び出し回数: ${faceFrameLoopDebug.detectCallCount}
Engine detectスキップ回数: ${faceFrameLoopDebug.detectSkipCount}
Engine detect最終スキップ理由: ${faceFrameLoopDebug.lastDetectSkipReason ?? "なし"}
入力型: ${faceFrameLoopDebug.inputType}
Detector: ${faceFrameLoopDebug.detectorType}
hasInput: ${String(faceFrameLoopDebug.hasInput)}
hasDetector: ${String(faceFrameLoopDebug.hasDetector)}
FPS: ${formatFps(faceFrameFps)}
Video currentTime: ${faceFrameLoopDebug.video?.currentTime ?? 0}
Video readyState: ${faceFrameLoopDebug.video?.readyState ?? 0}
Video paused: ${faceFrameLoopDebug.video ? String(faceFrameLoopDebug.video.paused) : "true"}
Video srcObject: ${faceFrameLoopDebug.video?.hasSrcObject ? "あり" : "なし"}`)}</pre>
        </details>
        <details data-debug-section="fullDebugText"${detailsOpenAttribute("fullDebugText")}>
          <summary>Full Debug Text</summary>
          <textarea readonly rows="18">${escapeHtml(debugText)}</textarea>
        </details>
      </section>
    `

    attachCopyDebugHandler(debugText)
    attachDebugDetailsHandlers()
  }

  engine.setFaceDetector(detector)
  window.setInterval(() => {
    render()
    appendCameraPreview()
  }, 1000)

  engine.onFaceFrame((frame) => {
    if (previousFrameTimestamp !== undefined) {
      const elapsedMs = frame.timestamp - previousFrameTimestamp
      faceFrameFps = elapsedMs > 0 ? 1000 / elapsedMs : undefined
    }

    previousFrameTimestamp = frame.timestamp
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
