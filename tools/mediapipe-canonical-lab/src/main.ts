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
        <h1>MediaPipe 標準顔座標系 調査ラボ</h1>
        <p>MediaPipe Face Landmarker の生データを、顔の向きごとに保存するための調査用ツールです。</p>
      </div>
      <div class="status-pill" id="runStatus">初期化中</div>
    </header>

    <section class="layout">
      <div class="panel">
        <h2>カメラ / 検出器の状態</h2>
        <p class="panel-help">カメラが起動し、検出器が準備完了になると、顔検出結果と姿勢角がここに表示されます。</p>
        <div class="status-grid" id="statusGrid"></div>
      </div>

      <div class="panel">
        <h2>ライブプレビュー</h2>
        <div class="preview-wrap">
          <video id="video" playsinline muted autoplay></video>
          <canvas id="overlay"></canvas>
        </div>
        <div class="controls">
          <button id="captureButton" class="primary" type="button">現在のフレームを保存</button>
          <button id="clearButton" type="button">保存データをクリア</button>
          <button id="exportButton" type="button">JSON を書き出し</button>
        </div>
        <ul class="help-list">
          <li>顔を正面・左右・上下に向けてから「現在のフレームを保存」を押してください。</li>
          <li>保存したデータは bucket ごとに集計され、「JSON を書き出し」でダウンロードできます。</li>
          <li>自動キャプチャはまだ未実装です。</li>
        </ul>
      </div>
    </section>

    <section class="summary">
      <div class="panel">
        <h2>保存データの概要</h2>
        <div class="status-grid" id="captureSummary"></div>
        <h2>姿勢 bucket 別の件数</h2>
        <div class="bucket-grid" id="bucketCounts"></div>
      </div>

      <div class="panel">
        <h2>最新の保存データ</h2>
        <div class="latest-box" id="latestCapture">まだ保存されていません。</div>
      </div>
    </section>

    <section class="panel">
      <h2>保存したフレーム一覧</h2>
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
    state.lastSkippedReason = "まだ検出フレームがありません。"
    render()
    return
  }

  if (!frame.detected) {
    warnings.push("最新フレームで顔が検出されていません。")
  }

  if (frame.landmarks.length !== EXPECTED_LANDMARK_COUNT) {
    warnings.push(
      `landmarks は ${EXPECTED_LANDMARK_COUNT} 点を期待していますが、${frame.landmarks.length} 点でした。`,
    )
  }

  if (!frame.facialTransformationMatrix) {
    warnings.push("facialTransformationMatrix がありません。")
  }

  if (!frame.pose) {
    warnings.push("matrix から yaw / pitch / roll を推定できませんでした。")
  }

  notes.push("最新の MediaPipe FaceLandmarker 結果を手動で保存しました。")

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
      ? "準備完了"
      : `カメラ: ${formatLifecycleStatus(
          state.cameraStatus,
        )} / 検出器: ${formatLifecycleStatus(state.detectorStatus)}`

  getElement("statusGrid").innerHTML = renderStatusItems([
    ["カメラ状態", formatLifecycleStatus(state.cameraStatus)],
    ["検出器状態", formatLifecycleStatus(state.detectorStatus)],
    ["顔検出", frame?.detected ? "検出あり" : "未検出"],
    ["landmarks 数", `${frame?.landmarks.length ?? 0} 点`],
    ["facialTransformationMatrix", matrixAvailable ? "取得あり" : "未取得"],
    ["blendshapes 数", `${frame?.blendshapes.length ?? 0} 件`],
    ["現在の yaw / pitch / roll", formatPose(frame?.pose ?? null)],
    ["映像サイズ", `${frame?.videoWidth ?? 0} / ${frame?.videoHeight ?? 0}`],
    ["FPS / 検出回数", `${fps.toFixed(1)} / ${state.detectCount}`],
    ["検出器エラー", state.detectorError ?? "-"],
    ["カメラエラー", state.cameraError ?? "-"],
  ])

  getElement("captureSummary").innerHTML = renderStatusItems([
    ["保存件数", `${state.captures.length} 件`],
    ["最新 bucket", state.captures[0] ? formatBucket(state.captures[0].bucket) : "-"],
    ["最後に保存できなかった理由", state.lastSkippedReason ?? "-"],
  ])

  getElement("bucketCounts").innerHTML = BUCKETS.map((bucket) => {
    const count = state.captures.filter((capture) => capture.bucket === bucket).length
    return `<div class="bucket-item"><span>${formatBucket(bucket)}</span><strong>${count}</strong></div>`
  }).join("")

  const latest = state.captures[0]
  getElement("latestCapture").textContent = latest
    ? JSON.stringify(
        {
          "保存ID": latest.captureId,
          "保存日時": latest.capturedAt,
          "bucket": formatBucket(latest.bucket),
          "姿勢": latest.pose,
          "landmarks数": latest.landmarks.length,
          "matrix取得": Boolean(latest.facialTransformationMatrix),
          "blendshapes数": latest.blendshapes.length,
          "注意": latest.warnings,
        },
        null,
        2,
      )
    : "まだ保存されていません。"

  getElement("previewList").innerHTML =
    state.captures.length === 0
      ? `<p class="note">保存したフレームはまだありません。</p>`
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
                  <dt>bucket</dt><dd>${formatBucket(capture.bucket)}</dd>
                  <dt>姿勢</dt><dd>${escapeHtml(formatPose(capture.pose))}</dd>
                  <dt>点数</dt><dd>${capture.landmarks.length}</dd>
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

  return `yaw ${pose.yaw.toFixed(2)} / pitch ${pose.pitch.toFixed(2)} / roll ${pose.roll.toFixed(2)}`
}

function formatLifecycleStatus(status: AppState["cameraStatus"] | AppState["detectorStatus"]): string {
  switch (status) {
    case "idle":
      return "待機中"
    case "starting":
      return "起動中"
    case "running":
      return "起動済み"
    case "initializing":
      return "初期化中"
    case "ready":
      return "準備完了"
    case "error":
      return "エラー"
  }
}

function formatBucket(bucket: CaptureBucket): string {
  switch (bucket) {
    case "front":
      return "front（正面）"
    case "yawPositiveSmall":
      return "yawPositiveSmall（右/左向き 小）"
    case "yawPositiveMid":
      return "yawPositiveMid（右/左向き 中）"
    case "yawPositiveStrong":
      return "yawPositiveStrong（右/左向き 大）"
    case "yawNegativeSmall":
      return "yawNegativeSmall（反対向き 小）"
    case "yawNegativeMid":
      return "yawNegativeMid（反対向き 中）"
    case "yawNegativeStrong":
      return "yawNegativeStrong（反対向き 大）"
    case "pitchPositive":
      return "pitchPositive（上/下向き）"
    case "pitchNegative":
      return "pitchNegative（反対の上下向き）"
    case "mixedPose":
      return "mixedPose（横向き + 上下向き）"
    case "unknown":
      return "unknown（判定不可）"
  }
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
