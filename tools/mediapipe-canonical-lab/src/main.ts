import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision"
import type { Matrix, NormalizedLandmark } from "@mediapipe/tasks-vision"
import "./style.css"

type CaptureBucket =
  | "front"
  | "yawPositiveSmall"
  | "yawPositiveMid"
  | "yawPositiveStrong"
  | "yawNegativeSmall"
  | "yawNegativeMid"
  | "yawNegativeStrong"
  | "pitchPositive"
  | "pitchNegative"
  | "mixedPose"
  | "unknown"

interface Pose {
  yaw: number
  pitch: number
  roll: number
}

interface BlendshapeCapture {
  categoryName: string
  score: number
}

interface MatrixCapture {
  rows: number
  columns: number
  values: number[]
  metadata: {
    source: "MediaPipe FaceLandmarker facialTransformationMatrixes[0].data"
    ordering: "row-major"
    indexFormula: "values[row * columns + column]"
    maps: "MediaPipe canonical face to detected face"
  }
}

interface FrameSnapshot {
  detected: boolean
  timestamp: number
  videoTime: number
  videoWidth: number
  videoHeight: number
  landmarks: NormalizedLandmark[]
  facialTransformationMatrix: Matrix | null
  blendshapes: BlendshapeCapture[]
  pose: Pose | null
}

interface CaptureRecord {
  captureId: string
  capturedAt: string
  videoTime: number
  videoWidth: number
  videoHeight: number
  pose: Pose | null
  landmarks: Array<{
    index: number
    x: number
    y: number
    z: number
  }>
  facialTransformationMatrix: MatrixCapture | null
  blendshapes: BlendshapeCapture[]
  bucket: CaptureBucket
  notes: string[]
  warnings: string[]
  previewDataUrl: string | null
}

interface AppState {
  cameraStatus: "idle" | "starting" | "running" | "error"
  detectorStatus: "idle" | "initializing" | "ready" | "error"
  detectorError: string | null
  cameraError: string | null
  detectCount: number
  lastSkippedReason: string | null
  latestFrame: FrameSnapshot | null
  captures: CaptureRecord[]
  loopStartedAt: number | null
}

const EXPECTED_LANDMARK_COUNT = 478
const RAD_TO_DEG = 180 / Math.PI
const BUCKETS: CaptureBucket[] = [
  "front",
  "yawPositiveSmall",
  "yawPositiveMid",
  "yawPositiveStrong",
  "yawNegativeSmall",
  "yawNegativeMid",
  "yawNegativeStrong",
  "pitchPositive",
  "pitchNegative",
  "mixedPose",
  "unknown",
]

const state: AppState = {
  cameraStatus: "idle",
  detectorStatus: "idle",
  detectorError: null,
  cameraError: null,
  detectCount: 0,
  lastSkippedReason: null,
  latestFrame: null,
  captures: [],
  loopStartedAt: null,
}

const app = document.querySelector<HTMLDivElement>("#app")

if (!app) {
  throw new Error("#app is missing")
}

app.innerHTML = `
  <main class="app">
    <header class="header">
      <div class="title-block">
        <h1>MediaPipe Canonical Lab</h1>
        <p>MediaPipe Face Landmarker の生出力を姿勢 bucket ごとに収集する調査用ツールです。</p>
      </div>
      <div class="status-pill" id="runStatus">initializing</div>
    </header>

    <section class="layout">
      <div class="panel">
        <h2>Camera / Detector status</h2>
        <div class="status-grid" id="statusGrid"></div>
      </div>

      <div class="panel">
        <h2>Live preview</h2>
        <div class="preview-wrap">
          <video id="video" playsinline muted autoplay></video>
          <canvas id="overlay"></canvas>
        </div>
        <div class="controls">
          <button id="captureButton" class="primary" type="button">Capture current frame</button>
          <button id="clearButton" type="button">Clear captures</button>
          <button id="exportButton" type="button">Export captured JSON</button>
        </div>
        <p class="note">Auto capture is not implemented yet.</p>
      </div>
    </section>

    <section class="summary">
      <div class="panel">
        <h2>Capture list / summary</h2>
        <div class="status-grid" id="captureSummary"></div>
        <h2>Bucket count</h2>
        <div class="bucket-grid" id="bucketCounts"></div>
      </div>

      <div class="panel">
        <h2>Latest capture summary</h2>
        <div class="latest-box" id="latestCapture">No captures yet.</div>
      </div>
    </section>

    <section class="panel">
      <h2>Captured frame preview list</h2>
      <div class="preview-list" id="previewList"></div>
    </section>
  </main>
`

const video = getElement<HTMLVideoElement>("video")
const overlay = getElement<HTMLCanvasElement>("overlay")
const captureButton = getElement<HTMLButtonElement>("captureButton")
const clearButton = getElement<HTMLButtonElement>("clearButton")
const exportButton = getElement<HTMLButtonElement>("exportButton")

let faceLandmarker: FaceLandmarker | null = null

captureButton.addEventListener("click", () => {
  captureCurrentFrame()
})

clearButton.addEventListener("click", () => {
  state.captures = []
  state.lastSkippedReason = null
  render()
})

exportButton.addEventListener("click", () => {
  exportCaptures()
})

void initialize()

async function initialize(): Promise<void> {
  render()
  await Promise.all([initializeCamera(), initializeDetector()])
  startDetectionLoop()
}

async function initializeCamera(): Promise<void> {
  state.cameraStatus = "starting"
  state.cameraError = null
  render()

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    })

    video.srcObject = stream
    await video.play()
    state.cameraStatus = "running"
  } catch (error) {
    state.cameraStatus = "error"
    state.cameraError = error instanceof Error ? error.message : String(error)
  }

  render()
}

async function initializeDetector(): Promise<void> {
  state.detectorStatus = "initializing"
  state.detectorError = null
  render()

  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
    )

    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      },
      runningMode: "VIDEO",
      numFaces: 1,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
    })

    state.detectorStatus = "ready"
  } catch (error) {
    state.detectorStatus = "error"
    state.detectorError = error instanceof Error ? error.message : String(error)
  }

  render()
}

function startDetectionLoop(): void {
  if (state.loopStartedAt !== null) {
    return
  }

  state.loopStartedAt = performance.now()

  const detect = (): void => {
    if (
      faceLandmarker &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      video.videoWidth > 0 &&
      video.videoHeight > 0
    ) {
      try {
        const timestamp = performance.now()
        const result = faceLandmarker.detectForVideo(video, timestamp)
        const landmarks = result.faceLandmarks[0] ?? []
        const matrix = result.facialTransformationMatrixes[0] ?? null
        const blendshapes =
          result.faceBlendshapes[0]?.categories.map((category) => ({
            categoryName: category.categoryName,
            score: category.score,
          })) ?? []

        state.detectCount += 1
        state.latestFrame = {
          detected: result.faceLandmarks.length > 0,
          timestamp,
          videoTime: video.currentTime,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          landmarks,
          facialTransformationMatrix: matrix,
          blendshapes,
          pose: estimateFacePoseFromMatrix(matrix),
        }

        drawOverlay(landmarks)
      } catch (error) {
        state.detectorStatus = "error"
        state.detectorError = error instanceof Error ? error.message : String(error)
      }
    }

    render()
    window.requestAnimationFrame(detect)
  }

  window.requestAnimationFrame(detect)
}

function captureCurrentFrame(): void {
  const frame = state.latestFrame
  const warnings: string[] = []
  const notes: string[] = []

  if (!frame) {
    state.lastSkippedReason = "No detection frame is available yet."
    render()
    return
  }

  if (!frame.detected) {
    warnings.push("No face was detected in the latest frame.")
  }

  if (frame.landmarks.length !== EXPECTED_LANDMARK_COUNT) {
    warnings.push(
      `Expected ${EXPECTED_LANDMARK_COUNT} landmarks, got ${frame.landmarks.length}.`,
    )
  }

  if (!frame.facialTransformationMatrix) {
    warnings.push("facialTransformationMatrix is missing.")
  }

  if (!frame.pose) {
    warnings.push("yaw / pitch / roll could not be estimated from matrix.")
  }

  notes.push("Captured manually from latest MediaPipe FaceLandmarker result.")

  const capture: CaptureRecord = {
    captureId: createCaptureId(state.captures.length + 1),
    capturedAt: new Date().toISOString(),
    videoTime: frame.videoTime,
    videoWidth: frame.videoWidth,
    videoHeight: frame.videoHeight,
    pose: frame.pose,
    landmarks: frame.landmarks.map((landmark, index) => ({
      index,
      x: landmark.x,
      y: landmark.y,
      z: landmark.z,
    })),
    facialTransformationMatrix: frame.facialTransformationMatrix
      ? captureMatrix(frame.facialTransformationMatrix)
      : null,
    blendshapes: frame.blendshapes,
    bucket: classifyBucket(frame.pose),
    notes,
    warnings,
    previewDataUrl: createPreviewDataUrl(),
  }

  state.captures = [capture, ...state.captures]
  state.lastSkippedReason = null
  render()
}

function classifyBucket(pose: Pose | null): CaptureBucket {
  if (!pose) {
    return "unknown"
  }

  const yawAbs = Math.abs(pose.yaw)
  const pitchAbs = Math.abs(pose.pitch)

  if (yawAbs >= 15 && pitchAbs >= 10) {
    return "mixedPose"
  }

  if (pitchAbs >= 10 && yawAbs < 15) {
    return pose.pitch >= 0 ? "pitchPositive" : "pitchNegative"
  }

  if (yawAbs < 8 && pitchAbs < 8) {
    return "front"
  }

  if (pose.yaw >= 0) {
    if (yawAbs < 15) {
      return "yawPositiveSmall"
    }
    if (yawAbs < 30) {
      return "yawPositiveMid"
    }
    return "yawPositiveStrong"
  }

  if (yawAbs < 15) {
    return "yawNegativeSmall"
  }
  if (yawAbs < 30) {
    return "yawNegativeMid"
  }
  return "yawNegativeStrong"
}

function exportCaptures(): void {
  const createdAt = new Date()
  const payload = {
    schemaVersion: "mediapipe_canonical_lab_captures_v1",
    createdAt: createdAt.toISOString(),
    tool: {
      name: "mediapipe-canonical-lab",
      version: "0.1.0",
    },
    source: {
      detector:
        "@mediapipe/tasks-vision FaceLandmarker 0.10.35, VIDEO mode, outputFaceBlendshapes=true, outputFacialTransformationMatrixes=true",
      landmarkCount: EXPECTED_LANDMARK_COUNT,
    },
    summary: {
      captureCount: state.captures.length,
      bucketCounts: countBuckets(state.captures),
    },
    captures: state.captures.map(({ previewDataUrl, ...capture }) => capture),
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = `mediapipe_canonical_lab_captures_${formatFileTimestamp(
    createdAt,
  )}.json`
  link.click()
  URL.revokeObjectURL(link.href)
}

function render(): void {
  const frame = state.latestFrame
  const matrixAvailable = Boolean(frame?.facialTransformationMatrix)
  const fps =
    state.loopStartedAt === null
      ? 0
      : state.detectCount / Math.max((performance.now() - state.loopStartedAt) / 1000, 1)

  getElement("runStatus").textContent =
    state.cameraStatus === "running" && state.detectorStatus === "ready"
      ? "ready"
      : `${state.cameraStatus} / ${state.detectorStatus}`

  getElement("statusGrid").innerHTML = renderStatusItems([
    ["Camera status", state.cameraStatus],
    ["Detector status", state.detectorStatus],
    ["detected / no face", frame?.detected ? "detected" : "no face"],
    ["landmarks count", String(frame?.landmarks.length ?? 0)],
    ["matrix available / missing", matrixAvailable ? "available" : "missing"],
    ["blendshapes count", String(frame?.blendshapes.length ?? 0)],
    ["current yaw / pitch / roll", formatPose(frame?.pose ?? null)],
    ["video width / height", `${frame?.videoWidth ?? 0} / ${frame?.videoHeight ?? 0}`],
    ["FPS / detect count", `${fps.toFixed(1)} / ${state.detectCount}`],
    ["Detector error", state.detectorError ?? "-"],
    ["Camera error", state.cameraError ?? "-"],
  ])

  getElement("captureSummary").innerHTML = renderStatusItems([
    ["total captured count", String(state.captures.length)],
    ["latest bucket", state.captures[0]?.bucket ?? "-"],
    ["last skipped reason", state.lastSkippedReason ?? "-"],
  ])

  getElement("bucketCounts").innerHTML = BUCKETS.map((bucket) => {
    const count = state.captures.filter((capture) => capture.bucket === bucket).length
    return `<div class="bucket-item"><span>${bucket}</span><strong>${count}</strong></div>`
  }).join("")

  const latest = state.captures[0]
  getElement("latestCapture").textContent = latest
    ? JSON.stringify(
        {
          captureId: latest.captureId,
          capturedAt: latest.capturedAt,
          bucket: latest.bucket,
          pose: latest.pose,
          landmarks: latest.landmarks.length,
          matrixAvailable: Boolean(latest.facialTransformationMatrix),
          blendshapes: latest.blendshapes.length,
          warnings: latest.warnings,
        },
        null,
        2,
      )
    : "No captures yet."

  getElement("previewList").innerHTML =
    state.captures.length === 0
      ? `<p class="note">No captured frames yet.</p>`
      : state.captures
          .map(
            (capture) => `
              <article class="capture-card">
                ${
                  capture.previewDataUrl
                    ? `<img src="${capture.previewDataUrl}" alt="${escapeHtml(capture.captureId)}" />`
                    : ""
                }
                <dl>
                  <dt>ID</dt><dd>${escapeHtml(capture.captureId)}</dd>
                  <dt>bucket</dt><dd>${capture.bucket}</dd>
                  <dt>pose</dt><dd>${escapeHtml(formatPose(capture.pose))}</dd>
                  <dt>points</dt><dd>${capture.landmarks.length}</dd>
                </dl>
              </article>
            `,
          )
          .join("")

  captureButton.disabled = !state.latestFrame
  exportButton.disabled = state.captures.length === 0
  clearButton.disabled = state.captures.length === 0
}

function drawOverlay(landmarks: NormalizedLandmark[]): void {
  const rect = overlay.getBoundingClientRect()
  const width = Math.max(1, Math.floor(rect.width))
  const height = Math.max(1, Math.floor(rect.height))

  if (overlay.width !== width || overlay.height !== height) {
    overlay.width = width
    overlay.height = height
  }

  const ctx = overlay.getContext("2d")
  if (!ctx) {
    return
  }

  ctx.clearRect(0, 0, width, height)
  if (landmarks.length === 0 || video.videoWidth === 0 || video.videoHeight === 0) {
    return
  }

  const videoAspect = video.videoWidth / video.videoHeight
  const canvasAspect = width / height
  const drawWidth = canvasAspect > videoAspect ? height * videoAspect : width
  const drawHeight = canvasAspect > videoAspect ? height : width / videoAspect
  const offsetX = (width - drawWidth) / 2
  const offsetY = (height - drawHeight) / 2

  ctx.fillStyle = "rgba(82, 218, 173, 0.9)"
  for (const point of landmarks) {
    ctx.beginPath()
    ctx.arc(offsetX + point.x * drawWidth, offsetY + point.y * drawHeight, 1.2, 0, Math.PI * 2)
    ctx.fill()
  }
}

function createPreviewDataUrl(): string | null {
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    return null
  }

  const canvas = document.createElement("canvas")
  const targetWidth = 320
  const targetHeight = Math.round((targetWidth / video.videoWidth) * video.videoHeight)
  canvas.width = targetWidth
  canvas.height = targetHeight

  const ctx = canvas.getContext("2d")
  if (!ctx) {
    return null
  }

  ctx.drawImage(video, 0, 0, targetWidth, targetHeight)
  return canvas.toDataURL("image/jpeg", 0.72)
}

function captureMatrix(matrix: Matrix): MatrixCapture {
  return {
    rows: matrix.rows,
    columns: matrix.columns,
    values: Array.from(matrix.data),
    metadata: {
      source: "MediaPipe FaceLandmarker facialTransformationMatrixes[0].data",
      ordering: "row-major",
      indexFormula: "values[row * columns + column]",
      maps: "MediaPipe canonical face to detected face",
    },
  }
}

function estimateFacePoseFromMatrix(matrix: Matrix | null): Pose | null {
  if (
    !matrix ||
    matrix.rows < 3 ||
    matrix.columns < 3 ||
    matrix.data.length < matrix.columns * 3
  ) {
    return null
  }

  const columns = matrix.columns
  const m00 = matrix.data[0 * columns + 0]
  const m10 = matrix.data[1 * columns + 0]
  const m20 = matrix.data[2 * columns + 0]
  const m21 = matrix.data[2 * columns + 1]
  const m22 = matrix.data[2 * columns + 2]

  if ([m00, m10, m20, m21, m22].some((value) => !Number.isFinite(value))) {
    return null
  }

  const sy = Math.hypot(m00, m10)
  return {
    pitch: Math.atan2(m21, m22) * RAD_TO_DEG,
    yaw: Math.atan2(-m20, sy) * RAD_TO_DEG,
    roll: Math.atan2(m10, m00) * RAD_TO_DEG,
  }
}

function countBuckets(captures: CaptureRecord[]): Record<CaptureBucket, number> {
  return BUCKETS.reduce(
    (counts, bucket) => {
      counts[bucket] = captures.filter((capture) => capture.bucket === bucket).length
      return counts
    },
    {} as Record<CaptureBucket, number>,
  )
}

function renderStatusItems(items: Array<[string, string]>): string {
  return items
    .map(
      ([label, value]) => `
        <div class="status-item">
          <span class="status-label">${escapeHtml(label)}</span>
          <span class="status-value">${escapeHtml(value)}</span>
        </div>
      `,
    )
    .join("")
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function formatPose(pose: Pose | null): string {
  if (!pose) {
    return "-"
  }

  return `yaw ${pose.yaw.toFixed(2)}, pitch ${pose.pitch.toFixed(2)}, roll ${pose.roll.toFixed(2)}`
}

function formatFileTimestamp(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, "0")
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("_") + `_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}

function createCaptureId(index: number): string {
  return `capture_${String(index).padStart(4, "0")}_${Date.now()}`
}

function getElement<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id)
  if (!element) {
    throw new Error(`#${id} is missing`)
  }
  return element as T
}
