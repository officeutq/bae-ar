import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision"
import type { Matrix, NormalizedLandmark } from "@mediapipe/tasks-vision"
import "./style.css"

type LoadStatus = "未読込" | "読込中" | "解析中" | "完了" | "エラー"
type DetectorStatus = "未初期化" | "初期化中" | "準備完了" | "エラー"

type Pose = {
  yaw: number
  pitch: number
  roll: number
}

type VideoMetadata = {
  fileName: string
  fileSize: number
  duration: number
  videoWidth: number
  videoHeight: number
}

type MediaPipeFrameSummary = {
  detected: boolean
  landmarkCount: number
  blendshapeCount: number
  hasFacialTransformationMatrix: boolean
  matrixPreview?: number[]
  error?: string
}

type LandmarkSummaryPoint = {
  id: string
  label: string
  x: number
  y: number
  z?: number
  sourceIndices: number[]
}

type SemanticPointDefinition = {
  id: string
  label: string
  primaryIndices: number[]
  fallbackIndices?: number[]
}

type AppState = {
  loadStatus: LoadStatus
  detectorStatus: DetectorStatus
  detectorError: string | null
  fileError: string | null
  metadata: VideoMetadata | null
  summary: MediaPipeFrameSummary | null
  pose: Pose | null
  landmarkSummary: LandmarkSummaryPoint[]
  showLandmarkSummaryOverlay: boolean
}

const RAD_TO_DEG = 180 / Math.PI
const MATRIX_PREVIEW_COUNT = 8
const FIRST_FRAME_SEEK_TIME = 0.001
const OVERLAY_POINT_RADIUS = 5

const ROTATION_CENTER_12_SEMANTIC_DEFINITIONS: SemanticPointDefinition[] = [
  { id: "headTop", label: "頭頂", primaryIndices: [10] },
  { id: "chin", label: "顎", primaryIndices: [152] },
  { id: "leftCheek", label: "左頬", primaryIndices: [234] },
  { id: "rightCheek", label: "右頬", primaryIndices: [454] },
  { id: "leftEye", label: "左目中心", primaryIndices: [474, 475, 476, 477], fallbackIndices: [263, 362] },
  { id: "rightEye", label: "右目中心", primaryIndices: [469, 470, 471, 472], fallbackIndices: [33, 133] },
  { id: "nose", label: "鼻", primaryIndices: [4] },
  { id: "mouth", label: "口中心", primaryIndices: [13, 14] },
  { id: "noseBridge", label: "鼻筋", primaryIndices: [6] },
  { id: "leftJaw", label: "左顎ライン", primaryIndices: [172] },
  { id: "rightJaw", label: "右顎ライン", primaryIndices: [397] },
  { id: "upperFaceCenter", label: "上顔面中心", primaryIndices: [168] },
]

const state: AppState = {
  loadStatus: "未読込",
  detectorStatus: "未初期化",
  detectorError: null,
  fileError: null,
  metadata: null,
  summary: null,
  pose: null,
  landmarkSummary: [],
  showLandmarkSummaryOverlay: true,
}

let faceLandmarker: FaceLandmarker | null = null
let objectUrl: string | null = null
let detectorReadyPromise: Promise<void> | null = null

const app = getElement("app")

app.innerHTML = `
  <main class="app-shell">
    <section class="left-panel panel">
      <div class="title-block">
        <h1>MediaPipe Render Consistency Lab</h1>
        <p>MediaPipe レンダー一貫性検証ラボ</p>
      </div>

      <label class="file-picker">
        <span>MP4 ファイル</span>
        <input id="mp4Input" type="file" accept="video/mp4,.mp4" />
      </label>

      <section>
        <h2>読み込み状態</h2>
        <div id="statusGrid" class="status-grid"></div>
      </section>

      <section>
        <h2>動画メタ情報</h2>
        <div id="metadataGrid" class="status-grid"></div>
      </section>
    </section>

    <section class="center-panel panel">
      <div class="panel-heading">
        <h2>1フレーム目サムネイル</h2>
        <button id="toggleLandmarkSummaryButton" type="button" class="toggle-button">
          12点サマリを非表示
        </button>
      </div>
      <div class="thumbnail-frame">
        <canvas id="thumbnailCanvas" width="1280" height="720"></canvas>
        <p id="thumbnailEmpty" class="empty-message">MP4 を読み込むとサムネイルを表示します。</p>
      </div>
      <video id="sourceVideo" muted playsinline preload="metadata"></video>
    </section>

    <section class="right-panel panel">
      <h2>MediaPipe metadata summary</h2>
      <div id="summaryGrid" class="status-grid"></div>

      <h2>pose</h2>
      <div id="poseGrid" class="status-grid"></div>

      <h2>12pt landmark summary</h2>
      <div id="landmarkSummaryGrid" class="landmark-summary-grid"></div>

      <h2>rawDebug</h2>
      <pre id="rawDebug" class="json-preview">{}</pre>
    </section>
  </main>
`

const fileInput = getElement<HTMLInputElement>("mp4Input")
const video = getElement<HTMLVideoElement>("sourceVideo")
const canvas = getElement<HTMLCanvasElement>("thumbnailCanvas")
const thumbnailEmpty = getElement<HTMLParagraphElement>("thumbnailEmpty")
const statusGrid = getElement("statusGrid")
const metadataGrid = getElement("metadataGrid")
const summaryGrid = getElement("summaryGrid")
const poseGrid = getElement("poseGrid")
const landmarkSummaryGrid = getElement("landmarkSummaryGrid")
const rawDebug = getElement<HTMLPreElement>("rawDebug")
const toggleLandmarkSummaryButton = getElement<HTMLButtonElement>("toggleLandmarkSummaryButton")

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0] ?? null
  void handleFile(file)
})

toggleLandmarkSummaryButton.addEventListener("click", () => {
  state.showLandmarkSummaryOverlay = !state.showLandmarkSummaryOverlay
  renderThumbnailCanvas()
  render()
})

render()
detectorReadyPromise = initializeDetector()

async function initializeDetector(): Promise<void> {
  state.detectorStatus = "初期化中"
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

    state.detectorStatus = "準備完了"
  } catch (error) {
    state.detectorStatus = "エラー"
    state.detectorError = error instanceof Error ? error.message : String(error)
  }

  render()
}

async function handleFile(file: File | null): Promise<void> {
  resetFrameState()

  if (!file) {
    state.loadStatus = "未読込"
    render()
    return
  }

  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
  }

  state.loadStatus = "読込中"
  objectUrl = URL.createObjectURL(file)
  render()

  try {
    await loadVideoMetadata(objectUrl)

    state.metadata = {
      fileName: file.name,
      fileSize: file.size,
      duration: video.duration,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
    }

    await seekVideoToFirstFrame()
    prepareThumbnailCanvas()
    renderThumbnailCanvas()

    state.loadStatus = "解析中"
    render()

    if (detectorReadyPromise) {
      await detectorReadyPromise
    }

    state.summary = analyzeFirstFrame()
    renderThumbnailCanvas()
    state.loadStatus = "完了"
  } catch (error) {
    state.loadStatus = "エラー"
    state.fileError = error instanceof Error ? error.message : String(error)
    state.summary = {
      detected: false,
      landmarkCount: 0,
      blendshapeCount: 0,
      hasFacialTransformationMatrix: false,
      error: state.fileError,
    }
    state.landmarkSummary = []
    renderThumbnailCanvas()
  }

  render()
}

function resetFrameState(): void {
  state.fileError = null
  state.metadata = null
  state.summary = null
  state.pose = null
  state.landmarkSummary = []
  clearCanvas()
}

function loadVideoMetadata(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = (): void => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("error", handleError)
    }

    const handleLoadedMetadata = (): void => {
      cleanup()
      resolve()
    }

    const handleError = (): void => {
      cleanup()
      reject(new Error("動画メタ情報を読み込めませんでした。"))
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true })
    video.addEventListener("error", handleError, { once: true })
    video.src = url
    video.load()
  })
}

function seekVideoToFirstFrame(): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = (): void => {
      video.removeEventListener("seeked", handleSeeked)
      video.removeEventListener("error", handleError)
    }

    const handleSeeked = (): void => {
      cleanup()
      resolve()
    }

    const handleError = (): void => {
      cleanup()
      reject(new Error("1フレーム目へ seek できませんでした。"))
    }

    video.addEventListener("seeked", handleSeeked, { once: true })
    video.addEventListener("error", handleError, { once: true })
    video.currentTime = Math.min(FIRST_FRAME_SEEK_TIME, Math.max(video.duration - 0.001, 0))
  })
}

function prepareThumbnailCanvas(): void {
  if (video.videoWidth <= 0 || video.videoHeight <= 0) {
    throw new Error("動画サイズが取得できませんでした。")
  }

  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
}

function renderThumbnailCanvas(): void {
  if (video.videoWidth <= 0 || video.videoHeight <= 0) {
    clearCanvas()
    return
  }

  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("canvas context を取得できませんでした。")
  }

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.drawImage(video, 0, 0, canvas.width, canvas.height)

  if (state.showLandmarkSummaryOverlay && state.landmarkSummary.length > 0) {
    drawLandmarkSummaryOverlay(context, state.landmarkSummary)
  }

  thumbnailEmpty.hidden = true
}

function analyzeFirstFrame(): MediaPipeFrameSummary {
  if (!faceLandmarker) {
    return {
      detected: false,
      landmarkCount: 0,
      blendshapeCount: 0,
      hasFacialTransformationMatrix: false,
      error: "MediaPipe Face Landmarker が初期化されていません。",
    }
  }

  try {
    const result = faceLandmarker.detectForVideo(video, performance.now())
    const landmarks = result.faceLandmarks[0] ?? []
    const blendshapes = result.faceBlendshapes[0]?.categories ?? []
    const matrix = result.facialTransformationMatrixes[0]
    const matrixValues = matrix ? Array.from(matrix.data) : []
    const detected = result.faceLandmarks.length > 0

    state.pose = estimateFacePoseFromMatrix(matrix)
    state.landmarkSummary = detected ? buildLandmarkSummary(landmarks) : []

    return {
      detected,
      landmarkCount: landmarks.length,
      blendshapeCount: blendshapes.length,
      hasFacialTransformationMatrix: Boolean(matrix),
      matrixPreview:
        matrixValues.length > 0
          ? matrixValues.slice(0, MATRIX_PREVIEW_COUNT).map(roundDebugNumber)
          : undefined,
    }
  } catch (error) {
    state.pose = null
    state.landmarkSummary = []
    return {
      detected: false,
      landmarkCount: 0,
      blendshapeCount: 0,
      hasFacialTransformationMatrix: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function buildLandmarkSummary(landmarks: NormalizedLandmark[]): LandmarkSummaryPoint[] {
  return ROTATION_CENTER_12_SEMANTIC_DEFINITIONS.map((definition) => {
    const primaryPoint = averageLandmarks(landmarks, definition.primaryIndices)
    const fallbackPoint = definition.fallbackIndices
      ? averageLandmarks(landmarks, definition.fallbackIndices)
      : null
    const point = primaryPoint ?? fallbackPoint
    const sourceIndices = primaryPoint
      ? definition.primaryIndices
      : fallbackPoint
        ? definition.fallbackIndices ?? []
        : []

    if (!point) {
      return null
    }

    return {
      id: definition.id,
      label: definition.label,
      x: roundDebugNumber(point.x),
      y: roundDebugNumber(point.y),
      z: roundDebugNumber(point.z),
      sourceIndices,
    }
  }).filter((point): point is LandmarkSummaryPoint => Boolean(point))
}

function averageLandmarks(
  landmarks: NormalizedLandmark[],
  indices: number[],
): NormalizedLandmark | null {
  const points = indices
    .map((index) => landmarks[index])
    .filter((point): point is NormalizedLandmark => Boolean(point))

  if (points.length !== indices.length) {
    return null
  }

  return {
    x: average(points.map((point) => point.x)),
    y: average(points.map((point) => point.y)),
    z: average(points.map((point) => point.z)),
    visibility: average(points.map((point) => point.visibility ?? 0)),
  }
}

function drawLandmarkSummaryOverlay(
  context: CanvasRenderingContext2D,
  points: LandmarkSummaryPoint[],
): void {
  context.save()
  context.font = "13px sans-serif"
  context.lineWidth = 3
  context.textBaseline = "middle"

  for (const point of points) {
    const x = point.x * canvas.width
    const y = point.y * canvas.height
    const label = point.id

    context.beginPath()
    context.arc(x, y, OVERLAY_POINT_RADIUS, 0, Math.PI * 2)
    context.fillStyle = "#e83f6f"
    context.fill()
    context.strokeStyle = "#ffffff"
    context.stroke()

    const textX = Math.min(x + 8, canvas.width - 120)
    const textY = Math.max(12, Math.min(y, canvas.height - 12))
    const metrics = context.measureText(label)
    context.fillStyle = "rgba(255, 255, 255, 0.86)"
    context.fillRect(textX - 3, textY - 9, metrics.width + 6, 18)
    context.fillStyle = "#15202b"
    context.fillText(label, textX, textY)
  }

  context.restore()
}

function estimateFacePoseFromMatrix(matrix: Matrix | undefined): Pose | null {
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

function clearCanvas(): void {
  const context = canvas.getContext("2d")
  context?.clearRect(0, 0, canvas.width, canvas.height)
  thumbnailEmpty.hidden = false
}

function render(): void {
  statusGrid.innerHTML = renderStatusItems([
    ["読み込み状態", state.loadStatus],
    ["MediaPipe 状態", state.detectorStatus],
    ["MediaPipe エラー", state.detectorError ?? "-"],
    ["ファイルエラー", state.fileError ?? "-"],
  ])

  metadataGrid.innerHTML = renderStatusItems([
    ["fileName", state.metadata?.fileName ?? "-"],
    ["fileSize", state.metadata ? formatFileSize(state.metadata.fileSize) : "-"],
    ["duration", state.metadata ? `${state.metadata.duration.toFixed(3)} 秒` : "-"],
    ["videoWidth", state.metadata ? String(state.metadata.videoWidth) : "-"],
    ["videoHeight", state.metadata ? String(state.metadata.videoHeight) : "-"],
  ])

  summaryGrid.innerHTML = renderStatusItems([
    ["detected", state.summary ? formatBoolean(state.summary.detected) : "-"],
    ["landmarkCount", state.summary ? String(state.summary.landmarkCount) : "-"],
    ["blendshapeCount", state.summary ? String(state.summary.blendshapeCount) : "-"],
    ["landmarkSummaryPointCount", String(state.landmarkSummary.length)],
    [
      "hasFacialTransformationMatrix",
      state.summary ? formatBoolean(state.summary.hasFacialTransformationMatrix) : "-",
    ],
    ["matrixPreview", state.summary?.matrixPreview?.join(", ") ?? "-"],
    ["error", state.summary?.error ?? "-"],
  ])

  poseGrid.innerHTML = renderStatusItems([
    ["yaw", state.pose ? formatNumber(state.pose.yaw) : "-"],
    ["pitch", state.pose ? formatNumber(state.pose.pitch) : "-"],
    ["roll", state.pose ? formatNumber(state.pose.roll) : "-"],
    ["matrixAvailable", state.summary ? formatBoolean(state.summary.hasFacialTransformationMatrix) : "-"],
  ])

  landmarkSummaryGrid.innerHTML =
    state.landmarkSummary.length > 0
      ? state.landmarkSummary
          .map(
            (point) => `
              <div class="landmark-summary-item">
                <code>${escapeHtml(point.id)}</code>
                <span>${escapeHtml(formatLandmarkSummaryPoint(point))}</span>
              </div>
            `,
          )
          .join("")
      : `<div class="landmark-summary-item empty">12点 summary はありません。</div>`

  toggleLandmarkSummaryButton.textContent = state.showLandmarkSummaryOverlay
    ? "12点サマリを非表示"
    : "12点サマリを表示"

  rawDebug.textContent = JSON.stringify(
    {
      metadata: state.metadata,
      mediaPipeFrameSummary: state.summary,
      landmarkSummaryPointCount: state.landmarkSummary.length,
      landmarkSummary: state.landmarkSummary,
      pose: state.pose
        ? {
            yaw: roundDebugNumber(state.pose.yaw),
            pitch: roundDebugNumber(state.pose.pitch),
            roll: roundDebugNumber(state.pose.roll),
          }
        : null,
    },
    null,
    2,
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

function formatBoolean(value: boolean): string {
  return value ? "true" : "false"
}

function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toFixed(3) : "-"
}

function formatFileSize(size: number): string {
  if (!Number.isFinite(size)) {
    return "-"
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }
  return `${(size / 1024 / 1024).toFixed(2)} MB`
}

function formatLandmarkSummaryPoint(point: LandmarkSummaryPoint): string {
  return `x ${formatNumber(point.x)} / y ${formatNumber(point.y)} / z ${
    point.z === undefined ? "-" : formatNumber(point.z)
  } / indices ${point.sourceIndices.join(", ")}`
}

function average(values: number[]): number {
  const validValues = values.filter((value) => Number.isFinite(value))
  return validValues.length === 0
    ? 0
    : validValues.reduce((sum, value) => sum + value, 0) / validValues.length
}

function roundDebugNumber(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function getElement<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id)
  if (!element) {
    throw new Error(`#${id} is missing`)
  }
  return element as T
}
