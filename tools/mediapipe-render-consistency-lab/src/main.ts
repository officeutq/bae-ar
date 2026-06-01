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

type ManualAdjustmentsByFrame = Record<number, ManualLandmarkAdjustment[]>

type PoseBucket =
  | "frontCandidate"
  | "yawCandidate"
  | "pitchCandidate"
  | "mixedPoseCandidate"
  | "other"

type FrameBadge = {
  id: string
  label: string
  description: string
}

type AcceptedFrameSnapshot = {
  sourceFrameIndex: number
  timeSec: number
  thumbnailDataUrl: string
  mediaPipeSummary: MediaPipeFrameSummary
  pose: Pose | null
  observed12pt: LandmarkSummaryPoint[]
  excluded: boolean
  excludedReason?: "manual"
  poseBucket: PoseBucket
  badges: FrameBadge[]
}

type ScanStatus = "idle" | "running" | "completed" | "cancelled" | "error"

type ScanState = {
  status: ScanStatus
  scanFrameStepSeconds: number
  maxScanDurationSec: number
  maxScanFrames: number
  scannedFrameCount: number
  acceptedFrameCount: number
  discardedNoFaceCount: number
  discardedInvalidLandmarkCount: number
  progress: number
  error?: string
}

type ConsoleTab = "summary" | "landmarks12pt" | "adjustments" | "raw" | "scan" | "pose"

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
  eyePointMode: EyePointMode
  acceptedFrames: AcceptedFrameSnapshot[]
  currentReviewIndex: number
  scanState: ScanState
  manualAdjustmentsByFrame: ManualAdjustmentsByFrame
  selectedLandmarkSummaryPointId: string | null
  draggingLandmarkSummaryPointId: string | null
  showLandmarkSummaryOverlay: boolean
  consoleTab: ConsoleTab
}

const RAD_TO_DEG = 180 / Math.PI
const MATRIX_PREVIEW_COUNT = 8
const SCAN_FRAME_STEP_SECONDS = 1 / 30
const MAX_SCAN_DURATION_SEC = 300
const MAX_SCAN_FRAMES = 9000
const ACCEPTED_FRAMES_PREVIEW_LIMIT = 20
const MANUAL_ADJUSTMENTS_BY_FRAME_PREVIEW_LIMIT = 20
const OVERLAY_POINT_RADIUS = 5
const OVERLAY_SELECTED_POINT_RADIUS = 8
const OVERLAY_HIT_RADIUS = 12
const DEFAULT_EYE_POINT_MODE: EyePointMode = "browEyeAnchor"
const FRONT_CANDIDATE_THRESHOLDS = {
  maxAbsYaw: 3,
  maxAbsPitch: 3,
  maxAbsRoll: 3,
} as const
const POSE_BUCKET_THRESHOLDS = {
  yawAbsMin: 8,
  pitchAbsMin: 8,
  rollAbsMax: 12,
} as const
const POSE_BUCKET_LABELS: Record<PoseBucket, string> = {
  frontCandidate: "正面候補 frontCandidate",
  yawCandidate: "左右向き候補 yawCandidate",
  pitchCandidate: "上下向き候補 pitchCandidate",
  mixedPoseCandidate: "混合姿勢候補 mixedPoseCandidate",
  other: "その他 other",
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

function createInitialScanState(status: ScanStatus = "idle"): ScanState {
  return {
    status,
    scanFrameStepSeconds: SCAN_FRAME_STEP_SECONDS,
    maxScanDurationSec: MAX_SCAN_DURATION_SEC,
    maxScanFrames: MAX_SCAN_FRAMES,
    scannedFrameCount: 0,
    acceptedFrameCount: 0,
    discardedNoFaceCount: 0,
    discardedInvalidLandmarkCount: 0,
    progress: 0,
  }
}

const state: AppState = {
  loadStatus: "未読込",
  detectorStatus: "未初期化",
  detectorError: null,
  fileError: null,
  metadata: null,
  summary: null,
  pose: null,
  observed12pt: [],
  eyePointMode: DEFAULT_EYE_POINT_MODE,
  acceptedFrames: [],
  currentReviewIndex: 0,
  scanState: createInitialScanState(),
  manualAdjustmentsByFrame: {},
  selectedLandmarkSummaryPointId: null,
  draggingLandmarkSummaryPointId: null,
  showLandmarkSummaryOverlay: true,
  consoleTab: "summary",
}

let faceLandmarker: FaceLandmarker | null = null
let objectUrl: string | null = null
let detectorReadyPromise: Promise<void> | null = null
let scanCancelRequested = false
let activeScanId = 0
let thumbnailRenderToken = 0

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

      <section>
        <h2>スキャン</h2>
        <button id="stopScanButton" type="button" class="secondary-button">
          自動スキャン停止
        </button>
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
      <div class="frame-controls">
        <button id="previousFrameButton" type="button" class="frame-button">前へ</button>
        <button id="excludeFrameButton" type="button" class="frame-button danger">削除</button>
        <button id="nextFrameButton" type="button" class="frame-button">次へ</button>
      </div>
      <p class="frame-help">削除 = このフレームを検証対象から除外</p>
      <div id="frameInfoGrid" class="status-grid frame-info-grid"></div>
      <video id="sourceVideo" muted playsinline preload="metadata"></video>
    </section>

    <section class="right-panel panel console-panel">
      <h2>Debug Console（デバッグコンソール）</h2>
      <div class="console-tabs" role="tablist" aria-label="Debug Console">
        <button type="button" class="console-tab-button" data-console-tab="summary">Summary</button>
        <button type="button" class="console-tab-button" data-console-tab="landmarks12pt">12pt</button>
        <button type="button" class="console-tab-button" data-console-tab="adjustments">Adjustments</button>
        <button type="button" class="console-tab-button" data-console-tab="scan">Scan</button>
        <button type="button" class="console-tab-button" data-console-tab="pose">Pose（姿勢）</button>
        <button type="button" class="console-tab-button" data-console-tab="raw">Raw</button>
      </div>
      <div id="consoleContent" class="console-content"></div>
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
const consoleContent = getElement("consoleContent")
const toggleLandmarkSummaryButton = getElement<HTMLButtonElement>("toggleLandmarkSummaryButton")
const previousFrameButton = getElement<HTMLButtonElement>("previousFrameButton")
const excludeFrameButton = getElement<HTMLButtonElement>("excludeFrameButton")
const nextFrameButton = getElement<HTMLButtonElement>("nextFrameButton")
const stopScanButton = getElement<HTMLButtonElement>("stopScanButton")
const consoleTabButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-console-tab]"),
)

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0] ?? null
  void handleFile(file)
})

toggleLandmarkSummaryButton.addEventListener("click", () => {
  state.showLandmarkSummaryOverlay = !state.showLandmarkSummaryOverlay
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

stopScanButton.addEventListener("click", () => {
  scanCancelRequested = true
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

for (const button of consoleTabButtons) {
  button.addEventListener("click", () => {
    state.consoleTab = button.dataset.consoleTab as ConsoleTab
    render()
  })
}

consoleContent.addEventListener("click", (event) => {
  const action = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-console-action]")
  if (!action) {
    return
  }

  if (action.dataset.consoleAction === "reset-selected") {
    resetSelectedLandmarkAdjustment()
    return
  }

  if (action.dataset.consoleAction === "reset-current-frame") {
    resetCurrentFrameLandmarkAdjustments()
    renderThumbnailCanvas()
    render()
  }
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
  activeScanId += 1
  scanCancelRequested = true
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

    await startAutoScan()
  } catch (error) {
    state.loadStatus = "エラー"
    state.fileError = error instanceof Error ? error.message : String(error)
    state.scanState = {
      ...state.scanState,
      status: "error",
      error: state.fileError,
    }
    state.summary = {
      detected: false,
      landmarkCount: 0,
      blendshapeCount: 0,
      hasFacialTransformationMatrix: false,
      error: state.fileError,
    }
    state.observed12pt = []
    state.selectedLandmarkSummaryPointId = null
    state.draggingLandmarkSummaryPointId = null
    clearCanvas()
  }

  render()
}

function resetFrameState(): void {
  state.fileError = null
  state.metadata = null
  state.summary = null
  state.pose = null
  state.observed12pt = []
  state.acceptedFrames = []
  state.currentReviewIndex = 0
  state.scanState = createInitialScanState()
  state.manualAdjustmentsByFrame = {}
  state.selectedLandmarkSummaryPointId = null
  state.draggingLandmarkSummaryPointId = null
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

async function startAutoScan(): Promise<void> {
  const scanId = activeScanId
  scanCancelRequested = false
  state.acceptedFrames = []
  state.currentReviewIndex = 0
  state.summary = null
  state.pose = null
  state.observed12pt = []
  state.selectedLandmarkSummaryPointId = null
  state.draggingLandmarkSummaryPointId = null
  state.loadStatus = "解析中"
  state.scanState = createInitialScanState("running")
  clearCanvas()
  render()

  if (detectorReadyPromise) {
    await detectorReadyPromise
  }

  if (!faceLandmarker) {
    throw new Error("MediaPipe Face Landmarker が初期化されていません。")
  }

  prepareThumbnailCanvas()
  const scanDurationSec = Math.min(video.duration, MAX_SCAN_DURATION_SEC)
  const scanFrameLimit = Math.min(
    MAX_SCAN_FRAMES,
    Math.max(0, Math.ceil(scanDurationSec / SCAN_FRAME_STEP_SECONDS)),
  )

  for (let sourceFrameIndex = 0; sourceFrameIndex < scanFrameLimit; sourceFrameIndex += 1) {
    if (scanId !== activeScanId) {
      return
    }

    if (scanCancelRequested) {
      state.scanState = {
        ...state.scanState,
        status: "cancelled",
      }
      break
    }

    const timeSec = sourceFrameIndex * SCAN_FRAME_STEP_SECONDS
    if (timeSec >= scanDurationSec) {
      break
    }

    await seekVideoToTime(timeSec)
    if (scanId !== activeScanId) {
      return
    }
    if (scanCancelRequested) {
      state.scanState = {
        ...state.scanState,
        status: "cancelled",
      }
      break
    }

    drawVideoFrameToCanvas()

    const acceptedFrame = analyzeCanvasForAcceptedFrame(
      sourceFrameIndex,
      roundDebugNumber(timeSec),
    )

    state.scanState = {
      ...state.scanState,
      scannedFrameCount: state.scanState.scannedFrameCount + 1,
      progress: scanFrameLimit > 0
        ? roundDebugNumber((sourceFrameIndex + 1) / scanFrameLimit)
        : 1,
    }

    if (acceptedFrame) {
      state.acceptedFrames = [...state.acceptedFrames, acceptedFrame]
      state.scanState = {
        ...state.scanState,
        acceptedFrameCount: state.acceptedFrames.length,
      }
    }

    if (sourceFrameIndex % 10 === 0 || acceptedFrame) {
      render()
      await new Promise((resolve) => requestAnimationFrame(resolve))
    }
  }

  if (state.scanState.status === "running") {
    state.scanState = {
      ...state.scanState,
      status: "completed",
      progress: 1,
    }
  }

  state.currentReviewIndex = 0
  applyCurrentAcceptedFrame()
  state.loadStatus = "完了"
  renderThumbnailCanvas()
  render()
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
  if (!state.metadata || state.scanState.status === "running") {
    return
  }

  goToReviewIndex(state.currentReviewIndex + delta)
}

function goToReviewIndex(reviewIndex: number): void {
  if (!state.metadata || state.acceptedFrames.length === 0) {
    return
  }

  state.currentReviewIndex = Math.trunc(
    clamp(reviewIndex, 0, state.acceptedFrames.length - 1),
  )
  state.selectedLandmarkSummaryPointId = null
  state.draggingLandmarkSummaryPointId = null
  applyCurrentAcceptedFrame()
  renderThumbnailCanvas()
  render()
}

async function excludeCurrentFrame(): Promise<void> {
  if (!state.metadata || state.scanState.status === "running") {
    return
  }

  const currentFrame = getCurrentAcceptedFrame()
  if (!currentFrame) {
    return
  }

  state.acceptedFrames = state.acceptedFrames.map((frame, index) =>
    index === state.currentReviewIndex
      ? { ...frame, excluded: true, excludedReason: "manual" }
      : frame,
  )

  const nextReviewIndex = findNextUnexcludedReviewIndex(state.currentReviewIndex + 1)
  if (nextReviewIndex !== null) {
    goToReviewIndex(nextReviewIndex)
    return
  }

  applyCurrentAcceptedFrame()
  renderThumbnailCanvas()
  render()
}

function findNextUnexcludedReviewIndex(startReviewIndex: number): number | null {
  for (
    let index = Math.max(0, startReviewIndex);
    index < state.acceptedFrames.length;
    index += 1
  ) {
    if (!state.acceptedFrames[index].excluded) {
      return index
    }
  }
  return null
}

function getCurrentFrameTimeSec(): number {
  return getCurrentAcceptedFrame()?.timeSec ?? 0
}

function getEstimatedFrameCount(): number {
  if (!state.metadata) {
    return 0
  }
  return Math.max(
    1,
    Math.floor(Math.min(state.metadata.duration, MAX_SCAN_DURATION_SEC) / SCAN_FRAME_STEP_SECONDS),
  )
}

function isCurrentFrameExcluded(): boolean {
  return getCurrentAcceptedFrame()?.excluded ?? false
}

function getCurrentAcceptedFrame(): AcceptedFrameSnapshot | null {
  return state.acceptedFrames[state.currentReviewIndex] ?? null
}

function prepareThumbnailCanvas(): void {
  if (video.videoWidth <= 0 || video.videoHeight <= 0) {
    throw new Error("動画サイズが取得できませんでした。")
  }

  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
}

function renderThumbnailCanvas(): void {
  const currentFrame = getCurrentAcceptedFrame()
  if (!currentFrame) {
    clearCanvas()
    return
  }

  const renderToken = ++thumbnailRenderToken
  const image = new Image()
  image.addEventListener("load", () => {
    if (renderToken !== thumbnailRenderToken) {
      return
    }

    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext("2d")
    if (!context) {
      throw new Error("canvas context を取得できませんでした。")
    }

    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const adjusted12pt = getAdjusted12pt()
    if (state.showLandmarkSummaryOverlay && adjusted12pt.length > 0) {
      drawLandmarkSummaryOverlay(context, adjusted12pt)
    }

    thumbnailEmpty.hidden = true
  })
  image.src = currentFrame.thumbnailDataUrl
}

function drawVideoFrameToCanvas(): void {
  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("canvas context を取得できませんでした。")
  }

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  thumbnailEmpty.hidden = true
}

function analyzeCanvasForAcceptedFrame(
  sourceFrameIndex: number,
  timeSec: number,
): AcceptedFrameSnapshot | null {
  if (!faceLandmarker) {
    state.scanState = {
      ...state.scanState,
      discardedInvalidLandmarkCount: state.scanState.discardedInvalidLandmarkCount + 1,
    }
    return null
  }

  try {
    const result = faceLandmarker.detectForVideo(canvas, performance.now())
    const landmarks = result.faceLandmarks[0] ?? []
    const blendshapes = result.faceBlendshapes[0]?.categories ?? []
    const matrix = result.facialTransformationMatrixes[0]
    const matrixValues = matrix ? Array.from(matrix.data) : []
    const detected = result.faceLandmarks.length > 0

    if (!detected) {
      state.scanState = {
        ...state.scanState,
        discardedNoFaceCount: state.scanState.discardedNoFaceCount + 1,
      }
      return null
    }

    if (landmarks.length !== 478) {
      state.scanState = {
        ...state.scanState,
        discardedInvalidLandmarkCount: state.scanState.discardedInvalidLandmarkCount + 1,
      }
      return null
    }

    const pose = estimateFacePoseFromMatrix(matrix)
    const observed12pt = detected ? buildLandmarkSummary(landmarks) : []
    const poseClassification = classifyPoseBucket(pose)
    const mediaPipeSummary = {
      detected,
      landmarkCount: landmarks.length,
      blendshapeCount: blendshapes.length,
      hasFacialTransformationMatrix: Boolean(matrix),
      matrixPreview:
        matrixValues.length > 0
          ? matrixValues.slice(0, MATRIX_PREVIEW_COUNT).map(roundDebugNumber)
          : undefined,
    }

    return {
      sourceFrameIndex,
      timeSec,
      thumbnailDataUrl: canvas.toDataURL("image/jpeg", 0.82),
      mediaPipeSummary,
      pose,
      observed12pt,
      excluded: false,
      poseBucket: poseClassification.poseBucket,
      badges: poseClassification.badges,
    }
  } catch (error) {
    state.scanState = {
      ...state.scanState,
      discardedInvalidLandmarkCount: state.scanState.discardedInvalidLandmarkCount + 1,
      error: error instanceof Error ? error.message : String(error),
    }
    return null
  }
}

function applyCurrentAcceptedFrame(): void {
  const currentFrame = getCurrentAcceptedFrame()
  if (!currentFrame) {
    state.summary = createInvalidMediaPipeSummary()
    state.pose = null
    state.observed12pt = []
    state.selectedLandmarkSummaryPointId = null
    state.draggingLandmarkSummaryPointId = null
    return
  }

  state.summary = currentFrame.mediaPipeSummary
  state.pose = currentFrame.pose
  state.observed12pt = currentFrame.observed12pt
}

function createInvalidMediaPipeSummary(error?: string): MediaPipeFrameSummary {
  return {
    detected: false,
    landmarkCount: 0,
    blendshapeCount: 0,
    hasFacialTransformationMatrix: false,
    error,
  }
}

function classifyPoseBucket(pose: Pose | null): {
  poseBucket: PoseBucket
  badges: FrameBadge[]
} {
  if (!pose) {
    return {
      poseBucket: "other",
      badges: [],
    }
  }

  const absYaw = Math.abs(pose.yaw)
  const absPitch = Math.abs(pose.pitch)
  const absRoll = Math.abs(pose.roll)
  const frontCandidate =
    absYaw <= FRONT_CANDIDATE_THRESHOLDS.maxAbsYaw &&
    absPitch <= FRONT_CANDIDATE_THRESHOLDS.maxAbsPitch &&
    absRoll <= FRONT_CANDIDATE_THRESHOLDS.maxAbsRoll

  if (frontCandidate) {
    return {
      poseBucket: "frontCandidate",
      badges: [
        {
          id: "frontCandidate",
          label: "正面候補 frontCandidate",
          description: "|yaw| <= 3, |pitch| <= 3, |roll| <= 3 の自動判定候補",
        },
      ],
    }
  }

  if (absRoll > POSE_BUCKET_THRESHOLDS.rollAbsMax) {
    return {
      poseBucket: "other",
      badges: [],
    }
  }

  if (
    absYaw >= POSE_BUCKET_THRESHOLDS.yawAbsMin &&
    absPitch >= POSE_BUCKET_THRESHOLDS.pitchAbsMin
  ) {
    return {
      poseBucket: "mixedPoseCandidate",
      badges: [],
    }
  }

  if (absYaw >= POSE_BUCKET_THRESHOLDS.yawAbsMin) {
    return {
      poseBucket: "yawCandidate",
      badges: [],
    }
  }

  if (absPitch >= POSE_BUCKET_THRESHOLDS.pitchAbsMin) {
    return {
      poseBucket: "pitchCandidate",
      badges: [],
    }
  }

  return {
    poseBucket: "other",
    badges: [],
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
  const currentFrame = getCurrentAcceptedFrame()
  return currentFrame
    ? state.manualAdjustmentsByFrame[currentFrame.sourceFrameIndex] ?? []
    : []
}

function setCurrentManualAdjustments(adjustments: ManualLandmarkAdjustment[]): void {
  const currentFrame = getCurrentAcceptedFrame()
  if (!currentFrame) {
    return
  }

  const key = currentFrame.sourceFrameIndex
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
  thumbnailRenderToken += 1
  const context = canvas.getContext("2d")
  context?.clearRect(0, 0, canvas.width, canvas.height)
  thumbnailEmpty.hidden = false
}

function render(): void {
  const adjusted12pt = getAdjusted12pt()
  const currentManualAdjustments = getCurrentManualAdjustments()
  const frameState = getFrameStateDebug()
  const currentFrame = getCurrentAcceptedFrame()
  const frameBusy =
    state.loadStatus === "読込中" || state.scanState.status === "running"
  const rawDebugPayload = createRawDebugPayload(
    adjusted12pt,
    currentManualAdjustments,
    frameState,
  )

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
    [
      "review index",
      currentFrame ? `${state.currentReviewIndex + 1} / accepted ${state.acceptedFrames.length}` : "-",
    ],
    ["source frame index", currentFrame ? String(currentFrame.sourceFrameIndex) : "-"],
    ["time", currentFrame ? `${formatNumber(currentFrame.timeSec)} sec` : "-"],
    ["excluded", currentFrame ? formatJapaneseBoolean(currentFrame.excluded) : "-"],
    ["badge", currentFrame ? formatFrameBadges(currentFrame.badges) : "-"],
  ])

  renderConsoleTabs()
  consoleContent.innerHTML = renderConsoleTabContent(
    adjusted12pt,
    currentManualAdjustments,
    rawDebugPayload,
  )

  toggleLandmarkSummaryButton.textContent = state.showLandmarkSummaryOverlay
    ? "12点サマリを非表示"
    : "12点サマリを表示"
  previousFrameButton.disabled = !state.metadata || state.currentReviewIndex <= 0 || frameBusy
  nextFrameButton.disabled =
    !state.metadata || state.currentReviewIndex >= state.acceptedFrames.length - 1 || frameBusy
  excludeFrameButton.disabled = !state.metadata || !currentFrame || frameBusy
  stopScanButton.disabled = state.scanState.status !== "running"
}

function createRawDebugPayload(
  adjusted12pt: LandmarkSummaryPoint[],
  currentManualAdjustments: ManualLandmarkAdjustment[],
  frameState: ReturnType<typeof getFrameStateDebug>,
): Record<string, unknown> {
  return {
    metadata: state.metadata,
    frameState,
    scanState: getScanStateDebug(),
    poseBucketSummary: getPoseBucketSummary(),
    acceptedFramesPreview: getAcceptedFramesPreview(),
    mediaPipeFrameSummary: state.summary,
    landmarkSummaryPointCount: adjusted12pt.length,
    observed12pt: state.observed12pt,
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
  }
}

function renderConsoleTabs(): void {
  for (const button of consoleTabButtons) {
    const tab = button.dataset.consoleTab as ConsoleTab
    const isActive = tab === state.consoleTab
    button.classList.toggle("is-active", isActive)
    button.setAttribute("aria-selected", String(isActive))
  }
}

function renderConsoleTabContent(
  adjusted12pt: LandmarkSummaryPoint[],
  currentManualAdjustments: ManualLandmarkAdjustment[],
  rawDebugPayload: Record<string, unknown>,
): string {
  switch (state.consoleTab) {
    case "landmarks12pt":
      return renderLandmarks12ptConsole(adjusted12pt)
    case "adjustments":
      return renderAdjustmentsConsole(currentManualAdjustments)
    case "scan":
      return renderScanConsole()
    case "pose":
      return renderPoseConsole()
    case "raw":
      return renderRawConsole(rawDebugPayload)
    case "summary":
    default:
      return renderSummaryConsole(adjusted12pt, currentManualAdjustments)
  }
}

function renderSummaryConsole(
  adjusted12pt: LandmarkSummaryPoint[],
  currentManualAdjustments: ManualLandmarkAdjustment[],
): string {
  const currentFrame = getCurrentAcceptedFrame()
  return [
    renderConsoleSection(
      "Current frame",
      renderStatusItems([
        [
          "review index",
          currentFrame ? `${state.currentReviewIndex + 1} / ${state.acceptedFrames.length}` : "-",
        ],
        ["source frame index", currentFrame ? String(currentFrame.sourceFrameIndex) : "-"],
        ["timeSec", currentFrame ? formatNumber(currentFrame.timeSec) : "-"],
        ["除外状態", currentFrame ? (currentFrame.excluded ? "除外済み" : "対象") : "-"],
        ["推定フレーム数", state.metadata ? String(getEstimatedFrameCount()) : "-"],
        ["除外フレーム数", String(getExcludedAcceptedFrameCount())],
      ]),
    ),
    renderConsoleSection(
      "MediaPipe",
      renderStatusItems([
        ["顔検出", state.summary ? formatJapaneseBoolean(state.summary.detected) : "-"],
        ["ランドマーク数", state.summary ? String(state.summary.landmarkCount) : "-"],
        ["ブレンドシェイプ数", state.summary ? String(state.summary.blendshapeCount) : "-"],
        [
          "顔変換行列",
          state.summary ? formatJapaneseBoolean(state.summary.hasFacialTransformationMatrix) : "-",
        ],
        ["左右向き", state.pose ? formatNumber(state.pose.yaw) : "-"],
        ["上下向き", state.pose ? formatNumber(state.pose.pitch) : "-"],
        ["傾き", state.pose ? formatNumber(state.pose.roll) : "-"],
        ["エラー", state.summary?.error ?? "-"],
      ]),
    ),
    renderConsoleSection(
      "12pt",
      renderStatusItems([
        ["12点サマリ数", String(adjusted12pt.length)],
        ["現在フレームの手動調整数", String(currentManualAdjustments.length)],
      ]),
    ),
    renderConsoleSection(
      "Pose",
      renderStatusItems([
        ["Pose bucket", currentFrame ? POSE_BUCKET_LABELS[currentFrame.poseBucket] : "-"],
        ["Frame badges", currentFrame ? formatFrameBadges(currentFrame.badges) : "-"],
      ]),
    ),
    renderConsoleSection(
      "Cache",
      renderStatusItems([
        ["acceptedFrames", String(state.acceptedFrames.length)],
        ["手動調整済みフレーム数", String(getManualAdjustmentFrameCount())],
      ]),
    ),
  ].join("")
}

function renderLandmarks12ptConsole(adjusted12pt: LandmarkSummaryPoint[]): string {
  const content =
    adjusted12pt.length > 0
      ? adjusted12pt
          .map(
            (point) => `
              <div class="landmark-summary-item ${point.id === state.selectedLandmarkSummaryPointId ? "selected" : ""}">
                <code>${escapeHtml(point.label)}</code>
                <span>${escapeHtml(formatConsoleLandmarkSummaryPoint(point))}</span>
              </div>
            `,
          )
          .join("")
      : `<div class="landmark-summary-item empty">12点サマリはありません。</div>`

  return renderConsoleSection("12pt landmark summary", `<div class="landmark-summary-grid">${content}</div>`)
}

function renderAdjustmentsConsole(
  currentManualAdjustments: ManualLandmarkAdjustment[],
): string {
  const selectedHasAdjustment =
    Boolean(state.selectedLandmarkSummaryPointId) &&
    currentManualAdjustments.some(
      (adjustment) => adjustment.id === state.selectedLandmarkSummaryPointId,
    )

  return [
    renderConsoleSection(
      "操作",
      `
        <div class="summary-actions">
          <button
            data-console-action="reset-selected"
            type="button"
            class="secondary-button"
            ${selectedHasAdjustment ? "" : "disabled"}
          >
            選択点をリセット
          </button>
          <button
            data-console-action="reset-current-frame"
            type="button"
            class="secondary-button"
            ${currentManualAdjustments.length > 0 ? "" : "disabled"}
          >
            現在フレームの全調整をリセット
          </button>
        </div>
      `,
    ),
    renderConsoleSection(
      "手動調整の状態",
      renderStatusItems([
        ["現在フレームの手動調整数", String(currentManualAdjustments.length)],
        ["手動調整済みフレーム数", String(getManualAdjustmentFrameCount())],
      ]),
    ),
    renderConsoleSection("現在フレーム", renderManualAdjustmentsList(currentManualAdjustments)),
    renderConsoleSection(
      "manualAdjustmentsByFramePreview",
      `<pre class="console-json">${escapeHtml(
        JSON.stringify(getManualAdjustmentsByFramePreview(), null, 2),
      )}</pre>`,
    ),
  ].join("")
}

function renderScanConsole(): string {
  return [
    renderConsoleSection(
      "Scan",
      renderStatusItems([
        ["scan status", state.scanState.status],
        ["progress", `${Math.round(state.scanState.progress * 100)}%`],
        ["scannedFrameCount", String(state.scanState.scannedFrameCount)],
        ["acceptedFrameCount", String(state.scanState.acceptedFrameCount)],
        ["discardedNoFaceCount", String(state.scanState.discardedNoFaceCount)],
        [
          "discardedInvalidLandmarkCount",
          String(state.scanState.discardedInvalidLandmarkCount),
        ],
        ["maxScanDurationSec", String(state.scanState.maxScanDurationSec)],
        ["maxScanFrames", String(state.scanState.maxScanFrames)],
        ["error", state.scanState.error ?? "-"],
      ]),
    ),
    renderConsoleSection(
      "acceptedFramesPreview",
      `<pre class="console-json">${escapeHtml(
        JSON.stringify(getAcceptedFramesPreview(), null, 2),
      )}</pre>`,
    ),
  ].join("")
}

function renderPoseConsole(): string {
  const summary = getPoseBucketSummary()
  return [
    renderConsoleSection(
      "Pose（姿勢）",
      renderStatusItems([
        ["accepted frame count", String(summary.acceptedFrameCount)],
        ["frontCandidate", formatPoseBucketCount(summary.frontCandidateCount, summary.acceptedFrameCount)],
        ["yawCandidate", formatPoseBucketCount(summary.yawCandidateCount, summary.acceptedFrameCount)],
        ["pitchCandidate", formatPoseBucketCount(summary.pitchCandidateCount, summary.acceptedFrameCount)],
        [
          "mixedPoseCandidate",
          formatPoseBucketCount(summary.mixedPoseCandidateCount, summary.acceptedFrameCount),
        ],
        ["other", formatPoseBucketCount(summary.otherCount, summary.acceptedFrameCount)],
        ["excluded count", String(summary.excludedCount)],
      ]),
    ),
    renderConsoleSection(
      "frontCandidate thresholds",
      renderStatusItems([
        ["|yaw|", `<= ${FRONT_CANDIDATE_THRESHOLDS.maxAbsYaw}`],
        ["|pitch|", `<= ${FRONT_CANDIDATE_THRESHOLDS.maxAbsPitch}`],
        ["|roll|", `<= ${FRONT_CANDIDATE_THRESHOLDS.maxAbsRoll}`],
      ]),
    ),
    renderConsoleSection(
      "pose bucket thresholds",
      renderStatusItems([
        ["|yaw|", `>= ${POSE_BUCKET_THRESHOLDS.yawAbsMin}`],
        ["|pitch|", `>= ${POSE_BUCKET_THRESHOLDS.pitchAbsMin}`],
        ["|roll|", `other if > ${POSE_BUCKET_THRESHOLDS.rollAbsMax}`],
      ]),
    ),
  ].join("")
}

function renderRawConsole(rawDebugPayload: Record<string, unknown>): string {
  return renderConsoleSection(
    "rawDebug",
    `<pre class="console-json">${escapeHtml(JSON.stringify(rawDebugPayload, null, 2))}</pre>`,
  )
}

function renderConsoleSection(title: string, body: string): string {
  return `
    <section class="console-section">
      <h3>${escapeHtml(title)}</h3>
      ${body}
    </section>
  `
}

function renderManualAdjustmentsList(
  adjustments: ManualLandmarkAdjustment[],
): string {
  if (adjustments.length === 0) {
    return `<div class="landmark-summary-item empty">現在フレームの手動調整はありません。</div>`
  }

  return `
    <div class="landmark-summary-grid">
      ${adjustments
        .map(
          (adjustment) => `
            <div class="landmark-summary-item">
              <code>${escapeHtml(adjustment.id)}</code>
              <span>dx ${formatNumber(adjustment.dx)} / dy ${formatNumber(adjustment.dy)}</span>
            </div>
          `,
        )
        .join("")}
    </div>
  `
}

function getFrameStateDebug(): {
  currentReviewIndex: number
  currentSourceFrameIndex?: number
  currentTimeSec: number
  scanFrameStepSeconds: number
  estimatedFrameCount: number
  currentFrameExcluded: boolean
  excludedFrameCount: number
} {
  const currentFrame = getCurrentAcceptedFrame()
  return {
    currentReviewIndex: state.currentReviewIndex,
    currentSourceFrameIndex: currentFrame?.sourceFrameIndex,
    currentTimeSec: roundDebugNumber(currentFrame?.timeSec ?? 0),
    scanFrameStepSeconds: roundDebugNumber(SCAN_FRAME_STEP_SECONDS),
    estimatedFrameCount: getEstimatedFrameCount(),
    currentFrameExcluded: isCurrentFrameExcluded(),
    excludedFrameCount: getExcludedAcceptedFrameCount(),
  }
}

function getScanStateDebug(): ScanState & {
  currentReviewIndex: number
  currentSourceFrameIndex?: number
  currentTimeSec?: number
} {
  const currentFrame = getCurrentAcceptedFrame()
  return {
    ...state.scanState,
    currentReviewIndex: state.currentReviewIndex,
    currentSourceFrameIndex: currentFrame?.sourceFrameIndex,
    currentTimeSec: currentFrame?.timeSec,
  }
}

function getExcludedAcceptedFrameCount(): number {
  return state.acceptedFrames.filter((frame) => frame.excluded).length
}

function getPoseBucketSummary(): {
  acceptedFrameCount: number
  frontCandidateCount: number
  yawCandidateCount: number
  pitchCandidateCount: number
  mixedPoseCandidateCount: number
  otherCount: number
  excludedCount: number
  thresholds: {
    frontCandidate: typeof FRONT_CANDIDATE_THRESHOLDS
    poseBucket: typeof POSE_BUCKET_THRESHOLDS
  }
} {
  return {
    acceptedFrameCount: state.acceptedFrames.length,
    frontCandidateCount: countPoseBucket("frontCandidate"),
    yawCandidateCount: countPoseBucket("yawCandidate"),
    pitchCandidateCount: countPoseBucket("pitchCandidate"),
    mixedPoseCandidateCount: countPoseBucket("mixedPoseCandidate"),
    otherCount: countPoseBucket("other"),
    excludedCount: getExcludedAcceptedFrameCount(),
    thresholds: {
      frontCandidate: FRONT_CANDIDATE_THRESHOLDS,
      poseBucket: POSE_BUCKET_THRESHOLDS,
    },
  }
}

function countPoseBucket(poseBucket: PoseBucket): number {
  return state.acceptedFrames.filter((frame) => frame.poseBucket === poseBucket).length
}

function formatPoseBucketCount(count: number, total: number): string {
  const rate = total > 0 ? (count / total) * 100 : 0
  return `${count} / ${total} (${rate.toFixed(2)}%)`
}

function formatFrameBadges(badges: FrameBadge[]): string {
  return badges.length > 0 ? badges.map((badge) => badge.label).join(", ") : "なし"
}

function getManualAdjustmentFrameCount(): number {
  return Object.values(state.manualAdjustmentsByFrame).filter(
    (adjustments) => adjustments.length > 0,
  ).length
}

function getManualAdjustmentsByFramePreview(): Array<{
  sourceFrameIndex: number
  adjustmentCount: number
  adjustments: ManualLandmarkAdjustment[]
}> {
  return Object.entries(state.manualAdjustmentsByFrame)
    .map(([sourceFrameIndex, adjustments]) => ({
      sourceFrameIndex: Number(sourceFrameIndex),
      adjustmentCount: adjustments.length,
      adjustments,
    }))
    .filter((entry) => entry.adjustmentCount > 0)
    .sort((left, right) => left.sourceFrameIndex - right.sourceFrameIndex)
    .slice(0, MANUAL_ADJUSTMENTS_BY_FRAME_PREVIEW_LIMIT)
}

function getAcceptedFramesPreview(): Array<{
  sourceFrameIndex: number
  timeSec: number
  detected: boolean
  observedPointCount: number
  yaw?: number
  pitch?: number
  roll?: number
  poseBucket: PoseBucket
  badges: string[]
  excluded: boolean
}> {
  return state.acceptedFrames
    .map((frame) => ({
      sourceFrameIndex: frame.sourceFrameIndex,
      timeSec: frame.timeSec,
      detected: frame.mediaPipeSummary.detected,
      observedPointCount: frame.observed12pt.length,
      yaw: frame.pose?.yaw,
      pitch: frame.pose?.pitch,
      roll: frame.pose?.roll,
      poseBucket: frame.poseBucket,
      badges: frame.badges.map((badge) => badge.id),
      excluded: frame.excluded,
    }))
    .slice(0, ACCEPTED_FRAMES_PREVIEW_LIMIT)
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

function formatConsoleLandmarkSummaryPoint(point: LandmarkSummaryPoint): string {
  const observed = state.observed12pt.find((item) => item.id === point.id)
  const adjustment = getManualAdjustment(point.id)
  const adjustedSummary = `adjusted x ${formatNumber(point.x)} / y ${formatNumber(point.y)}`
  const observedSummary = observed
    ? `observed x ${formatNumber(observed.x)} / y ${formatNumber(observed.y)}`
    : "observed -"
  const manualSummary = adjustment
    ? ` / 手動調整あり dx ${formatNumber(adjustment.dx)} / dy ${formatNumber(adjustment.dy)}`
    : " / 手動調整なし"

  return `識別子 ${point.id} / ${adjustedSummary} / ${observedSummary} / 奥行き ${
    point.z === undefined ? "-" : formatNumber(point.z)
  } / 参照番号 ${point.sourceIndices.join(", ")}${manualSummary}`
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
