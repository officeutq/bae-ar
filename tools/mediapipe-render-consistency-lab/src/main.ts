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
  sourceMode?: EyePointMode
}

type ManualLandmarkAdjustment = {
  id: string
  dx: number
  dy: number
}

type EyePointMode = "irisCenter" | "eyeContourCenter" | "browEyeAnchor"

type FrameModeKey = `${number}:${EyePointMode}`

type ManualAdjustmentsByFrame = Record<FrameModeKey, ManualLandmarkAdjustment[]>

type Observed12ptFrameSnapshot = {
  key: FrameModeKey
  frameIndex: number
  timeSec: number
  eyePointMode: EyePointMode
  observed12pt: LandmarkSummaryPoint[]
  mediaPipeSummary: MediaPipeFrameSummary
  pose: Pose | null
}

type Observed12ptByFrame = Record<FrameModeKey, Observed12ptFrameSnapshot>

type Observed12ptSource = "none" | "newlyAnalyzed" | "cached"

type ExcludedFrame = {
  frameIndex: number
  timeSec: number
  reason: "manual"
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
  observed12pt: LandmarkSummaryPoint[]
  observed12ptByFrame: Observed12ptByFrame
  observed12ptSource: Observed12ptSource
  eyePointMode: EyePointMode
  manualAdjustmentsByFrame: ManualAdjustmentsByFrame
  selectedLandmarkSummaryPointId: string | null
  draggingLandmarkSummaryPointId: string | null
  showLandmarkSummaryOverlay: boolean
  currentFrameIndex: number
  excludedFrames: ExcludedFrame[]
}

const RAD_TO_DEG = 180 / Math.PI
const MATRIX_PREVIEW_COUNT = 8
const FRAME_STEP_SECONDS = 1 / 30
const EXCLUDED_FRAMES_PREVIEW_LIMIT = 20
const MANUAL_ADJUSTMENTS_BY_FRAME_PREVIEW_LIMIT = 20
const OBSERVED_12PT_BY_FRAME_PREVIEW_LIMIT = 20
const OVERLAY_POINT_RADIUS = 5
const OVERLAY_SELECTED_POINT_RADIUS = 8
const OVERLAY_HIT_RADIUS = 12
const DEFAULT_EYE_POINT_MODE: EyePointMode = "browEyeAnchor"
const EYE_POINT_MODE_LABELS: Record<EyePointMode, string> = {
  browEyeAnchor: "眉目間アンカー browEyeAnchor",
  eyeContourCenter: "目輪郭中心 eyeContourCenter",
  irisCenter: "虹彩中心 irisCenter",
}
const EYE_POINT_INDICES = {
  leftIris: [474, 475, 476, 477],
  rightIris: [469, 470, 471, 472],
  leftContour: [263, 362],
  rightContour: [33, 133],
  leftBrow: [276, 282, 283, 285, 295],
  rightBrow: [46, 52, 53, 55, 65],
} as const

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
  observed12pt: [],
  observed12ptByFrame: {},
  observed12ptSource: "none",
  eyePointMode: DEFAULT_EYE_POINT_MODE,
  manualAdjustmentsByFrame: {},
  selectedLandmarkSummaryPointId: null,
  draggingLandmarkSummaryPointId: null,
  showLandmarkSummaryOverlay: true,
  currentFrameIndex: 0,
  excludedFrames: [],
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
      <label class="eye-point-mode-control">
        <span>目点モード eyePointMode</span>
        <select id="eyePointModeSelect">
          <option value="browEyeAnchor">眉目間アンカー browEyeAnchor</option>
          <option value="eyeContourCenter">目輪郭中心 eyeContourCenter</option>
          <option value="irisCenter">虹彩中心 irisCenter</option>
        </select>
      </label>
      <div class="thumbnail-frame">
        <canvas id="thumbnailCanvas" width="1280" height="720"></canvas>
        <p id="thumbnailEmpty" class="empty-message">MP4 を読み込むとサムネイルを表示します。</p>
      </div>
      <div class="frame-controls">
        <button id="previousFrameButton" type="button" class="frame-button">前へ</button>
        <button id="excludeFrameButton" type="button" class="frame-button danger">削除</button>
        <button id="nextFrameButton" type="button" class="frame-button">次へ</button>
      </div>
      <p class="frame-help">削除 = このフレームを検証対象から除外</p>
      <div id="frameInfoGrid" class="status-grid frame-info-grid"></div>
      <video id="sourceVideo" muted playsinline preload="metadata"></video>
    </section>

    <section class="right-panel panel">
      <h2>MediaPipe メタ情報サマリ</h2>
      <div id="summaryGrid" class="status-grid"></div>

      <h2>姿勢</h2>
      <div id="poseGrid" class="status-grid"></div>

      <h2>12点ランドマークサマリ</h2>
      <div id="landmarkSummaryModeGrid" class="status-grid mode-status-grid"></div>
      <div class="summary-actions">
        <button id="resetSelectedLandmarkButton" type="button" class="secondary-button">
          選択点をリセット
        </button>
        <button id="resetAllLandmarksButton" type="button" class="secondary-button">
          現在フレームの全調整をリセット
        </button>
      </div>
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
const frameInfoGrid = getElement("frameInfoGrid")
const summaryGrid = getElement("summaryGrid")
const poseGrid = getElement("poseGrid")
const landmarkSummaryGrid = getElement("landmarkSummaryGrid")
const landmarkSummaryModeGrid = getElement("landmarkSummaryModeGrid")
const rawDebug = getElement<HTMLPreElement>("rawDebug")
const toggleLandmarkSummaryButton = getElement<HTMLButtonElement>("toggleLandmarkSummaryButton")
const eyePointModeSelect = getElement<HTMLSelectElement>("eyePointModeSelect")
const previousFrameButton = getElement<HTMLButtonElement>("previousFrameButton")
const excludeFrameButton = getElement<HTMLButtonElement>("excludeFrameButton")
const nextFrameButton = getElement<HTMLButtonElement>("nextFrameButton")
const resetSelectedLandmarkButton = getElement<HTMLButtonElement>("resetSelectedLandmarkButton")
const resetAllLandmarksButton = getElement<HTMLButtonElement>("resetAllLandmarksButton")

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0] ?? null
  void handleFile(file)
})

toggleLandmarkSummaryButton.addEventListener("click", () => {
  state.showLandmarkSummaryOverlay = !state.showLandmarkSummaryOverlay
  renderThumbnailCanvas()
  render()
})

eyePointModeSelect.addEventListener("change", () => {
  state.eyePointMode = eyePointModeSelect.value as EyePointMode
  state.selectedLandmarkSummaryPointId = null
  state.draggingLandmarkSummaryPointId = null
  if (state.metadata) {
    void loadCurrentFrame()
    return
  }
  render()
})

resetSelectedLandmarkButton.addEventListener("click", () => {
  resetSelectedLandmarkAdjustment()
})

resetAllLandmarksButton.addEventListener("click", () => {
  resetCurrentFrameLandmarkAdjustments()
  renderThumbnailCanvas()
  render()
})

previousFrameButton.addEventListener("click", () => {
  void moveFrameBy(-1)
})

nextFrameButton.addEventListener("click", () => {
  void moveFrameBy(1)
})

excludeFrameButton.addEventListener("click", () => {
  void excludeCurrentFrame()
})

canvas.addEventListener("pointerdown", (event) => {
  handleCanvasPointerDown(event)
})

canvas.addEventListener("pointermove", (event) => {
  handleCanvasPointerMove(event)
})

canvas.addEventListener("pointerup", (event) => {
  handleCanvasPointerEnd(event)
})

canvas.addEventListener("pointercancel", (event) => {
  handleCanvasPointerEnd(event)
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

    state.currentFrameIndex = 0
    state.excludedFrames = []
    await loadCurrentFrame()
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
    state.observed12pt = []
    state.observed12ptSource = "none"
    state.selectedLandmarkSummaryPointId = null
    state.draggingLandmarkSummaryPointId = null
    renderThumbnailCanvas()
  }

  render()
}

function resetFrameState(): void {
  state.fileError = null
  state.metadata = null
  state.summary = null
  state.pose = null
  state.observed12pt = []
  state.observed12ptByFrame = {}
  state.observed12ptSource = "none"
  state.manualAdjustmentsByFrame = {}
  state.selectedLandmarkSummaryPointId = null
  state.draggingLandmarkSummaryPointId = null
  state.currentFrameIndex = 0
  state.excludedFrames = []
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

async function loadCurrentFrame(): Promise<void> {
  resetPerFrameState()

  await seekVideoToCurrentFrame()
  prepareThumbnailCanvas()
  renderThumbnailCanvas()
  const cachedSnapshot = state.observed12ptByFrame[getCurrentFrameModeKey()]
  if (cachedSnapshot) {
    applyObserved12ptFrameSnapshot(cachedSnapshot, "cached")
    state.loadStatus = "完了"
    renderThumbnailCanvas()
    render()
    return
  }

  state.loadStatus = "解析中"
  render()

  if (detectorReadyPromise) {
    await detectorReadyPromise
  }

  const snapshot = analyzeCurrentFrameSnapshot()
  state.observed12ptByFrame = {
    ...state.observed12ptByFrame,
    [snapshot.key]: snapshot,
  }
  applyObserved12ptFrameSnapshot(snapshot, "newlyAnalyzed")
  renderThumbnailCanvas()
  state.loadStatus = "完了"
  render()
}

function resetPerFrameState(): void {
  state.summary = null
  state.pose = null
  state.observed12pt = []
  state.observed12ptSource = "none"
  state.selectedLandmarkSummaryPointId = null
  state.draggingLandmarkSummaryPointId = null
}

function seekVideoToCurrentFrame(): Promise<void> {
  return seekVideoToTime(getCurrentFrameTimeSec())
}

function seekVideoToTime(timeSec: number): Promise<void> {
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
      reject(new Error("対象フレームへ seek できませんでした。"))
    }

    video.addEventListener("seeked", handleSeeked, { once: true })
    video.addEventListener("error", handleError, { once: true })

    const targetTime = clamp(timeSec, 0, Math.max(video.duration, 0))
    if (Math.abs(video.currentTime - targetTime) < 0.0001) {
      cleanup()
      requestAnimationFrame(() => resolve())
      return
    }

    video.currentTime = targetTime
  })
}

async function moveFrameBy(delta: number): Promise<void> {
  if (!state.metadata) {
    return
  }

  await goToFrame(state.currentFrameIndex + delta)
}

async function goToFrame(frameIndex: number): Promise<void> {
  if (!state.metadata) {
    return
  }

  state.currentFrameIndex = clampFrameIndex(frameIndex)

  try {
    await loadCurrentFrame()
  } catch (error) {
    state.loadStatus = "エラー"
    state.fileError = error instanceof Error ? error.message : String(error)
    resetPerFrameState()
    state.summary = {
      detected: false,
      landmarkCount: 0,
      blendshapeCount: 0,
      hasFacialTransformationMatrix: false,
      error: state.fileError,
    }
    renderThumbnailCanvas()
    render()
  }
}

async function excludeCurrentFrame(): Promise<void> {
  if (!state.metadata) {
    return
  }

  if (!isCurrentFrameExcluded()) {
    state.excludedFrames = [
      ...state.excludedFrames,
      {
        frameIndex: state.currentFrameIndex,
        timeSec: roundDebugNumber(getCurrentFrameTimeSec()),
        reason: "manual",
      },
    ].sort((left, right) => left.frameIndex - right.frameIndex)
  }

  const nextFrameIndex = findNextUnexcludedFrameIndex(state.currentFrameIndex + 1)
  if (nextFrameIndex !== null) {
    await goToFrame(nextFrameIndex)
    return
  }

  render()
}

function findNextUnexcludedFrameIndex(startFrameIndex: number): number | null {
  const maxFrameIndex = getMaxFrameIndex()
  for (let index = clampFrameIndex(startFrameIndex); index <= maxFrameIndex; index += 1) {
    if (!isFrameExcluded(index)) {
      return index
    }
  }
  return null
}

function getCurrentFrameTimeSec(): number {
  if (!state.metadata) {
    return 0
  }
  return clamp(
    state.currentFrameIndex * FRAME_STEP_SECONDS,
    0,
    Math.max(state.metadata.duration, 0),
  )
}

function getEstimatedFrameCount(): number {
  if (!state.metadata) {
    return 0
  }
  return Math.max(1, Math.floor(state.metadata.duration / FRAME_STEP_SECONDS))
}

function getMaxFrameIndex(): number {
  if (!state.metadata) {
    return 0
  }
  return Math.max(0, Math.floor(state.metadata.duration / FRAME_STEP_SECONDS))
}

function clampFrameIndex(frameIndex: number): number {
  return Math.trunc(clamp(frameIndex, 0, getMaxFrameIndex()))
}

function isCurrentFrameExcluded(): boolean {
  return isFrameExcluded(state.currentFrameIndex)
}

function isFrameExcluded(frameIndex: number): boolean {
  return state.excludedFrames.some((frame) => frame.frameIndex === frameIndex)
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

  const adjusted12pt = getAdjusted12pt()
  if (state.showLandmarkSummaryOverlay && adjusted12pt.length > 0) {
    drawLandmarkSummaryOverlay(context, adjusted12pt)
  }

  thumbnailEmpty.hidden = true
}

function analyzeCurrentFrameSnapshot(): Observed12ptFrameSnapshot {
  if (!faceLandmarker) {
    return createObserved12ptFrameSnapshot({
      detected: false,
      landmarkCount: 0,
      blendshapeCount: 0,
      hasFacialTransformationMatrix: false,
      error: "MediaPipe Face Landmarker が初期化されていません。",
    }, [], null)
  }

  try {
    const result = faceLandmarker.detectForVideo(video, performance.now())
    const landmarks = result.faceLandmarks[0] ?? []
    const blendshapes = result.faceBlendshapes[0]?.categories ?? []
    const matrix = result.facialTransformationMatrixes[0]
    const matrixValues = matrix ? Array.from(matrix.data) : []
    const detected = result.faceLandmarks.length > 0
    const pose = estimateFacePoseFromMatrix(matrix)
    const observed12pt = detected ? buildLandmarkSummary(landmarks) : []

    return createObserved12ptFrameSnapshot({
      detected,
      landmarkCount: landmarks.length,
      blendshapeCount: blendshapes.length,
      hasFacialTransformationMatrix: Boolean(matrix),
      matrixPreview:
        matrixValues.length > 0
          ? matrixValues.slice(0, MATRIX_PREVIEW_COUNT).map(roundDebugNumber)
          : undefined,
    }, observed12pt, pose)
  } catch (error) {
    return createObserved12ptFrameSnapshot({
      detected: false,
      landmarkCount: 0,
      blendshapeCount: 0,
      hasFacialTransformationMatrix: false,
      error: error instanceof Error ? error.message : String(error),
    }, [], null)
  }
}

function createObserved12ptFrameSnapshot(
  mediaPipeSummary: MediaPipeFrameSummary,
  observed12pt: LandmarkSummaryPoint[],
  pose: Pose | null,
): Observed12ptFrameSnapshot {
  return {
    key: getCurrentFrameModeKey(),
    frameIndex: state.currentFrameIndex,
    timeSec: roundDebugNumber(getCurrentFrameTimeSec()),
    eyePointMode: state.eyePointMode,
    observed12pt,
    mediaPipeSummary,
    pose,
  }
}

function applyObserved12ptFrameSnapshot(
  snapshot: Observed12ptFrameSnapshot,
  source: Observed12ptSource,
): void {
  state.summary = snapshot.mediaPipeSummary
  state.pose = snapshot.pose
  state.observed12pt = snapshot.observed12pt
  state.observed12ptSource = source

  if (!snapshot.mediaPipeSummary.detected) {
    state.selectedLandmarkSummaryPointId = null
    state.draggingLandmarkSummaryPointId = null
  }
}

function getAdjusted12pt(): LandmarkSummaryPoint[] {
  return state.observed12pt.map((point) => {
    const adjustment = getManualAdjustment(point.id)
    if (!adjustment) {
      return point
    }

    return {
      ...point,
      x: roundDebugNumber(clamp(point.x + adjustment.dx, 0, 1)),
      y: roundDebugNumber(clamp(point.y + adjustment.dy, 0, 1)),
    }
  })
}

function getManualAdjustment(pointId: string): ManualLandmarkAdjustment | null {
  return getCurrentManualAdjustments().find((adjustment) => adjustment.id === pointId) ?? null
}

function getCurrentManualAdjustments(): ManualLandmarkAdjustment[] {
  return state.manualAdjustmentsByFrame[getCurrentFrameModeKey()] ?? []
}

function setCurrentManualAdjustments(adjustments: ManualLandmarkAdjustment[]): void {
  const key = getCurrentFrameModeKey()
  if (adjustments.length === 0) {
    const remaining = { ...state.manualAdjustmentsByFrame }
    delete remaining[key]
    state.manualAdjustmentsByFrame = remaining
    return
  }

  state.manualAdjustmentsByFrame = {
    ...state.manualAdjustmentsByFrame,
    [key]: adjustments,
  }
}

function getCurrentFrameModeKey(): FrameModeKey {
  return getFrameModeKey(state.currentFrameIndex, state.eyePointMode)
}

function getFrameModeKey(frameIndex: number, eyePointMode: EyePointMode): FrameModeKey {
  return `${frameIndex}:${eyePointMode}`
}

function setManualAdjustment(pointId: string, dx: number, dy: number): void {
  const currentManualAdjustments = getCurrentManualAdjustments()
  const nextAdjustment = {
    id: pointId,
    dx: roundDebugNumber(dx),
    dy: roundDebugNumber(dy),
  }

  const existingIndex = currentManualAdjustments.findIndex(
    (adjustment) => adjustment.id === pointId,
  )

  if (existingIndex >= 0) {
    setCurrentManualAdjustments(
      currentManualAdjustments.map((adjustment, index) =>
        index === existingIndex ? nextAdjustment : adjustment,
      ),
    )
    return
  }

  setCurrentManualAdjustments([...currentManualAdjustments, nextAdjustment])
}

function resetSelectedLandmarkAdjustment(): void {
  const selectedId = state.selectedLandmarkSummaryPointId
  if (!selectedId) {
    return
  }

  setCurrentManualAdjustments(
    getCurrentManualAdjustments().filter((adjustment) => adjustment.id !== selectedId),
  )
  renderThumbnailCanvas()
  render()
}

function resetCurrentFrameLandmarkAdjustments(): void {
  setCurrentManualAdjustments([])
}

function buildLandmarkSummary(landmarks: NormalizedLandmark[]): LandmarkSummaryPoint[] {
  return ROTATION_CENTER_12_SEMANTIC_DEFINITIONS.map((definition) => {
    if (definition.id === "leftEye" || definition.id === "rightEye") {
      return buildEyeSummaryPoint(landmarks, definition)
    }

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

function buildEyeSummaryPoint(
  landmarks: NormalizedLandmark[],
  definition: SemanticPointDefinition,
): LandmarkSummaryPoint | null {
  const side = definition.id === "leftEye" ? "left" : "right"
  const irisIndices =
    side === "left" ? EYE_POINT_INDICES.leftIris : EYE_POINT_INDICES.rightIris
  const contourIndices =
    side === "left" ? EYE_POINT_INDICES.leftContour : EYE_POINT_INDICES.rightContour
  const browIndices =
    side === "left" ? EYE_POINT_INDICES.leftBrow : EYE_POINT_INDICES.rightBrow

  if (state.eyePointMode === "irisCenter") {
    const irisPoint = averageLandmarks(landmarks, [...irisIndices])
    const contourFallback = averageLandmarks(landmarks, [...contourIndices])
    return createLandmarkSummaryPoint(
      definition,
      irisPoint ?? contourFallback,
      irisPoint ? [...irisIndices] : [...contourIndices],
      state.eyePointMode,
    )
  }

  const contourPoint = averageLandmarks(landmarks, [...contourIndices])
  if (state.eyePointMode === "eyeContourCenter") {
    return createLandmarkSummaryPoint(
      definition,
      contourPoint,
      [...contourIndices],
      state.eyePointMode,
    )
  }

  const browPoint = averageLandmarks(landmarks, [...browIndices])
  if (!contourPoint || !browPoint) {
    return createLandmarkSummaryPoint(
      definition,
      contourPoint,
      contourPoint ? [...contourIndices] : [],
      state.eyePointMode,
    )
  }

  // 暫定 brow-eye anchor: 目輪郭中心から眉代表点へ寄せ、眼球ではなく顔側に固定される点として扱う。
  return createLandmarkSummaryPoint(
    definition,
    interpolateLandmark(contourPoint, browPoint, 0.45),
    [...contourIndices, ...browIndices],
    state.eyePointMode,
  )
}

function createLandmarkSummaryPoint(
  definition: SemanticPointDefinition,
  point: NormalizedLandmark | null,
  sourceIndices: number[],
  sourceMode?: EyePointMode,
): LandmarkSummaryPoint | null {
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
    sourceMode,
  }
}

function interpolateLandmark(
  from: NormalizedLandmark,
  to: NormalizedLandmark,
  ratio: number,
): NormalizedLandmark {
  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio,
    z: from.z + (to.z - from.z) * ratio,
    visibility: from.visibility === undefined || to.visibility === undefined
      ? undefined
      : from.visibility + (to.visibility - from.visibility) * ratio,
  }
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
    const label = point.label
    const observed = state.observed12pt.find((item) => item.id === point.id)
    const adjustment = getManualAdjustment(point.id)
    const isAdjusted = Boolean(adjustment)
    const isSelected = point.id === state.selectedLandmarkSummaryPointId

    if (observed && isAdjusted) {
      context.beginPath()
      context.moveTo(observed.x * canvas.width, observed.y * canvas.height)
      context.lineTo(x, y)
      context.strokeStyle = "rgba(35, 93, 159, 0.45)"
      context.lineWidth = 2
      context.stroke()
      context.lineWidth = 3
    }

    context.beginPath()
    context.arc(
      x,
      y,
      isSelected ? OVERLAY_SELECTED_POINT_RADIUS : OVERLAY_POINT_RADIUS,
      0,
      Math.PI * 2,
    )
    context.fillStyle = isAdjusted ? "#235d9f" : "#e83f6f"
    context.fill()
    context.strokeStyle = isSelected ? "#ffd166" : "#ffffff"
    context.stroke()

    const textX = Math.min(x + 8, canvas.width - 120)
    const textY = Math.max(12, Math.min(y, canvas.height - 12))
    const metrics = context.measureText(label)
    context.fillStyle = "rgba(255, 255, 255, 0.86)"
    context.fillRect(textX - 3, textY - 9, metrics.width + 6, 18)
    context.fillStyle = "#15202b"
    context.font = isSelected ? "700 13px sans-serif" : "13px sans-serif"
    context.fillText(label, textX, textY)
  }

  context.restore()
}

function handleCanvasPointerDown(event: PointerEvent): void {
  if (!state.showLandmarkSummaryOverlay || getAdjusted12pt().length === 0) {
    return
  }

  const pointer = getCanvasPixelPoint(event)
  const point = findNearestSummaryPoint(pointer.x, pointer.y)
  if (!point) {
    state.selectedLandmarkSummaryPointId = null
    state.draggingLandmarkSummaryPointId = null
    renderThumbnailCanvas()
    render()
    return
  }

  state.selectedLandmarkSummaryPointId = point.id
  state.draggingLandmarkSummaryPointId = point.id
  canvas.setPointerCapture(event.pointerId)
  event.preventDefault()
  renderThumbnailCanvas()
  render()
}

function handleCanvasPointerMove(event: PointerEvent): void {
  const draggingId = state.draggingLandmarkSummaryPointId
  if (!draggingId) {
    return
  }

  const observed = state.observed12pt.find((point) => point.id === draggingId)
  if (!observed) {
    return
  }

  const normalized = getCanvasNormalizedPoint(event)
  setManualAdjustment(
    draggingId,
    normalized.x - observed.x,
    normalized.y - observed.y,
  )
  event.preventDefault()
  renderThumbnailCanvas()
  render()
}

function handleCanvasPointerEnd(event: PointerEvent): void {
  if (state.draggingLandmarkSummaryPointId) {
    state.draggingLandmarkSummaryPointId = null
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId)
    }
    renderThumbnailCanvas()
    render()
  }
}

function getCanvasPixelPoint(event: PointerEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  }
}

function getCanvasNormalizedPoint(event: PointerEvent): { x: number; y: number } {
  const pixel = getCanvasPixelPoint(event)
  return {
    x: clamp(pixel.x / canvas.width, 0, 1),
    y: clamp(pixel.y / canvas.height, 0, 1),
  }
}

function findNearestSummaryPoint(x: number, y: number): LandmarkSummaryPoint | null {
  let nearestPoint: LandmarkSummaryPoint | null = null
  let nearestDistance = Number.POSITIVE_INFINITY

  for (const point of getAdjusted12pt()) {
    const pointX = point.x * canvas.width
    const pointY = point.y * canvas.height
    const distance = Math.hypot(pointX - x, pointY - y)
    if (distance <= OVERLAY_HIT_RADIUS && distance < nearestDistance) {
      nearestPoint = point
      nearestDistance = distance
    }
  }

  return nearestPoint
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
  const adjusted12pt = getAdjusted12pt()
  const currentManualAdjustments = getCurrentManualAdjustments()
  const frameState = getFrameStateDebug()
  const observed12ptFrameCount = getObserved12ptFrameCount()
  const frameBusy = state.loadStatus === "読込中" || state.loadStatus === "解析中"

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

  frameInfoGrid.innerHTML = renderStatusItems([
    ["現在フレーム", state.metadata ? String(state.currentFrameIndex) : "-"],
    ["時刻", state.metadata ? `${formatNumber(getCurrentFrameTimeSec())} 秒` : "-"],
    ["除外状態", state.metadata ? (isCurrentFrameExcluded() ? "除外済み" : "対象") : "-"],
    ["推定フレーム数", state.metadata ? String(getEstimatedFrameCount()) : "-"],
    ["除外フレーム数", String(state.excludedFrames.length)],
    ["現在フレームの手動調整数", String(currentManualAdjustments.length)],
    ["手動調整済みフレーム数", String(getManualAdjustmentFrameCount())],
    ["解析済みフレーム数", String(observed12ptFrameCount)],
    ["12点解析状態", formatObserved12ptSource()],
  ])

  summaryGrid.innerHTML = renderStatusItems([
    ["顔検出", state.summary ? formatJapaneseBoolean(state.summary.detected) : "-"],
    ["ランドマーク数", state.summary ? String(state.summary.landmarkCount) : "-"],
    ["ブレンドシェイプ数", state.summary ? String(state.summary.blendshapeCount) : "-"],
    ["12点サマリ数", String(adjusted12pt.length)],
    [
      "顔変換行列",
      state.summary ? formatJapaneseBoolean(state.summary.hasFacialTransformationMatrix) : "-",
    ],
    ["行列プレビュー", state.summary?.matrixPreview?.join(", ") ?? "-"],
    ["エラー", state.summary?.error ?? "-"],
  ])

  poseGrid.innerHTML = renderStatusItems([
    ["左右向き", state.pose ? formatNumber(state.pose.yaw) : "-"],
    ["上下向き", state.pose ? formatNumber(state.pose.pitch) : "-"],
    ["傾き", state.pose ? formatNumber(state.pose.roll) : "-"],
    [
      "顔変換行列",
      state.summary ? formatJapaneseBoolean(state.summary.hasFacialTransformationMatrix) : "-",
    ],
  ])

  landmarkSummaryModeGrid.innerHTML = renderStatusItems([
    ["eyePointMode", state.eyePointMode],
    ["目点モード", EYE_POINT_MODE_LABELS[state.eyePointMode]],
  ])

  landmarkSummaryGrid.innerHTML =
    adjusted12pt.length > 0
      ? adjusted12pt
          .map(
            (point) => `
              <div class="landmark-summary-item ${point.id === state.selectedLandmarkSummaryPointId ? "selected" : ""}">
                <code>${escapeHtml(point.label)}</code>
                <span>${escapeHtml(formatLandmarkSummaryPoint(point))}</span>
              </div>
            `,
          )
          .join("")
      : `<div class="landmark-summary-item empty">12点サマリはありません。</div>`

  toggleLandmarkSummaryButton.textContent = state.showLandmarkSummaryOverlay
    ? "12点サマリを非表示"
    : "12点サマリを表示"
  eyePointModeSelect.value = state.eyePointMode
  resetSelectedLandmarkButton.disabled =
    !state.selectedLandmarkSummaryPointId ||
    !currentManualAdjustments.some(
      (adjustment) => adjustment.id === state.selectedLandmarkSummaryPointId,
    )
  resetAllLandmarksButton.disabled = currentManualAdjustments.length === 0
  previousFrameButton.disabled = !state.metadata || state.currentFrameIndex <= 0 || frameBusy
  nextFrameButton.disabled = !state.metadata || state.currentFrameIndex >= getMaxFrameIndex() || frameBusy
  excludeFrameButton.disabled = !state.metadata || frameBusy

  rawDebug.textContent = JSON.stringify(
    {
      metadata: state.metadata,
      frameState,
      eyePointMode: state.eyePointMode,
      mediaPipeFrameSummary: state.summary,
      landmarkSummaryPointCount: adjusted12pt.length,
      observed12pt: state.observed12pt,
      observed12ptFrameCount,
      observed12ptByFramePreview: getObserved12ptByFramePreview(),
      manualAdjustmentCount: currentManualAdjustments.length,
      manualAdjustments: currentManualAdjustments,
      manualAdjustmentFrameCount: getManualAdjustmentFrameCount(),
      manualAdjustmentsByFramePreview: getManualAdjustmentsByFramePreview(),
      adjustedLandmarkSummary: adjusted12pt,
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

function getFrameStateDebug(): {
  currentFrameIndex: number
  currentTimeSec: number
  frameStepSeconds: number
  estimatedFrameCount: number
  currentFrameExcluded: boolean
  excludedFrameCount: number
  excludedFramesPreview: ExcludedFrame[]
} {
  return {
    currentFrameIndex: state.currentFrameIndex,
    currentTimeSec: roundDebugNumber(getCurrentFrameTimeSec()),
    frameStepSeconds: roundDebugNumber(FRAME_STEP_SECONDS),
    estimatedFrameCount: getEstimatedFrameCount(),
    currentFrameExcluded: isCurrentFrameExcluded(),
    excludedFrameCount: state.excludedFrames.length,
    excludedFramesPreview: state.excludedFrames.slice(0, EXCLUDED_FRAMES_PREVIEW_LIMIT),
  }
}

function getManualAdjustmentFrameCount(): number {
  return Object.values(state.manualAdjustmentsByFrame).filter(
    (adjustments) => adjustments.length > 0,
  ).length
}

function getManualAdjustmentsByFramePreview(): Array<{
  key: FrameModeKey
  frameIndex: number
  eyePointMode: EyePointMode
  adjustmentCount: number
  adjustments: ManualLandmarkAdjustment[]
}> {
  return Object.entries(state.manualAdjustmentsByFrame)
    .map(([key, adjustments]) => ({
      key: key as FrameModeKey,
      frameIndex: parseFrameModeKey(key as FrameModeKey).frameIndex,
      eyePointMode: parseFrameModeKey(key as FrameModeKey).eyePointMode,
      adjustmentCount: adjustments.length,
      adjustments,
    }))
    .filter((entry) => entry.adjustmentCount > 0)
    .sort(compareFrameModeEntries)
    .slice(0, MANUAL_ADJUSTMENTS_BY_FRAME_PREVIEW_LIMIT)
}

function getObserved12ptFrameCount(): number {
  return Object.keys(state.observed12ptByFrame).length
}

function formatObserved12ptSource(): string {
  if (!state.metadata || state.observed12ptSource === "none") {
    return "-"
  }

  return state.observed12ptSource === "cached"
    ? "解析済みキャッシュ使用"
    : "初回解析"
}

function getObserved12ptByFramePreview(): Array<{
  key: FrameModeKey
  frameIndex: number
  timeSec: number
  eyePointMode: EyePointMode
  detected: boolean
  observedPointCount: number
  landmarkCount: number
  hasFacialTransformationMatrix: boolean
}> {
  return Object.entries(state.observed12ptByFrame)
    .map(([key, snapshot]) => ({
      key: key as FrameModeKey,
      frameIndex: snapshot.frameIndex,
      timeSec: snapshot.timeSec,
      eyePointMode: snapshot.eyePointMode,
      detected: snapshot.mediaPipeSummary.detected,
      observedPointCount: snapshot.observed12pt.length,
      landmarkCount: snapshot.mediaPipeSummary.landmarkCount,
      hasFacialTransformationMatrix:
        snapshot.mediaPipeSummary.hasFacialTransformationMatrix,
    }))
    .sort(compareFrameModeEntries)
    .slice(0, OBSERVED_12PT_BY_FRAME_PREVIEW_LIMIT)
}

function parseFrameModeKey(key: FrameModeKey): {
  frameIndex: number
  eyePointMode: EyePointMode
} {
  const [frameIndex, eyePointMode] = key.split(":") as [string, EyePointMode]
  return {
    frameIndex: Number(frameIndex),
    eyePointMode,
  }
}

function compareFrameModeEntries(
  left: { frameIndex: number; eyePointMode: EyePointMode },
  right: { frameIndex: number; eyePointMode: EyePointMode },
): number {
  return left.frameIndex - right.frameIndex ||
    left.eyePointMode.localeCompare(right.eyePointMode)
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

function formatJapaneseBoolean(value: boolean): string {
  return value ? "はい" : "いいえ"
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
  const observed = state.observed12pt.find((item) => item.id === point.id)
  const adjustment = getManualAdjustment(point.id)
  const coordinateSummary =
    observed && adjustment
      ? `横 ${formatNumber(observed.x)} → ${formatNumber(point.x)} / 縦 ${formatNumber(
          observed.y,
        )} → ${formatNumber(point.y)}`
      : `横 ${formatNumber(point.x)} / 縦 ${formatNumber(point.y)}`
  const manualSummary = adjustment
    ? ` / 手動調整あり dx ${formatNumber(adjustment.dx)} / dy ${formatNumber(adjustment.dy)}`
    : " / 手動調整なし"
  const sourceModeSummary = point.sourceMode ? ` / 目点モード ${point.sourceMode}` : ""

  return `識別子 ${point.id} / ${coordinateSummary} / 奥行き ${
    point.z === undefined ? "-" : formatNumber(point.z)
  } / 参照番号 ${point.sourceIndices.join(", ")}${sourceModeSummary}${manualSummary}`
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
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
