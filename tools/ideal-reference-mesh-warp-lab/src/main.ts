import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision"
import type { Matrix, NormalizedLandmark } from "@mediapipe/tasks-vision"
import "./style.css"

type PreviewTab = "model" | "live"
type DebugTab =
  | "summary"
  | "modelScan"
  | "referenceLibrary"
  | "matching"
  | "warpMesh"
  | "raw"

type MediaPipeStatus = "uninitialized" | "initializing" | "ready" | "error"
type ScanStatus = "idle" | "initializing" | "running" | "done" | "error"
type PlaybackStatus = "stopped" | "playing" | "paused"
type ExpressionGroup =
  | "neutral"
  | "mouthSmile"
  | "jawOpen"
  | "mouthPucker"
  | "eyeBlink"
  | "eyeSquint"
  | "mixedExpression"
  | "unknown"

type VideoPreviewState = {
  loaded: boolean
  fileName: string | null
  objectUrl: string | null
  durationSec: number | null
  width: number | null
  height: number | null
  currentTimeSec: number
}

type ReferenceLandmark = {
  index: number
  x: number
  y: number
  z: number
}

type ReferenceBlendshape = {
  categoryName: string
  score: number
}

type ReferencePose = {
  yaw: number | null
  pitch: number | null
  roll: number | null
}

type IdealReferenceFrame = {
  frameId: string
  frameIndex: number
  timeSec: number
  landmarks478: ReferenceLandmark[]
  pose: ReferencePose
  blendshapes: ReferenceBlendshape[]
  expressionGroup: ExpressionGroup
  qualityScore: number
  excluded: boolean
  excludedReason: string | null
}

type ModelScanState = {
  mediaPipeStatus: MediaPipeStatus
  mediaPipeError: string | null
  scanStatus: ScanStatus
  scanProgress: number
  plannedScanFrames: number
  maxScanFrames: number
  scanFrameStepSec: number
  totalScannedFrames: number
  acceptedFrames: number
  excludedFrames: number
  excludedReasonCounts: Record<string, number>
  lastError: string | null
}

type LabState = {
  activePreviewTab: PreviewTab
  activeDebugTab: DebugTab
  overlay: {
    showLandmarks478: boolean
  }
  modelVideo: VideoPreviewState & {
    currentReviewFrameIndex: number | null
    scanStatus: ScanStatus
  }
  liveVideo: VideoPreviewState & {
    playbackStatus: PlaybackStatus
  }
  modelScan: ModelScanState
  rawIdealReferenceFrames: IdealReferenceFrame[]
  currentAcceptedReviewIndex: number | null
  logs: string[]
}

type TabOption<TValue extends string> = {
  label: string
  value: TValue
}

const MAX_SCAN_FRAMES = 10000
const SCAN_FRAME_STEP_SEC = 1 / 30
const FRAME_STEP_SEC = 1 / 30
const REQUIRED_LANDMARK_COUNT = 478
const RAD_TO_DEG = 180 / Math.PI
const STRONG_EXPRESSION_THRESHOLD = 0.35
const MIXED_EXPRESSION_THRESHOLD = 0.28
const LANDMARK_PREVIEW_COUNT = 5
const SCAN_RENDER_INTERVAL = 8

const previewTabs: TabOption<PreviewTab>[] = [
  { label: "モデル動画", value: "model" },
  { label: "ライブ動画", value: "live" },
]

const debugTabs: TabOption<DebugTab>[] = [
  { label: "Summary", value: "summary" },
  { label: "Model Scan", value: "modelScan" },
  { label: "Reference Library", value: "referenceLibrary" },
  { label: "Matching", value: "matching" },
  { label: "Warp Mesh", value: "warpMesh" },
  { label: "Raw", value: "raw" },
]

const state: LabState = {
  activePreviewTab: "model",
  activeDebugTab: "summary",
  overlay: {
    showLandmarks478: false,
  },
  modelVideo: {
    loaded: false,
    fileName: null,
    objectUrl: null,
    durationSec: null,
    width: null,
    height: null,
    currentTimeSec: 0,
    currentReviewFrameIndex: null,
    scanStatus: "idle",
  },
  liveVideo: {
    loaded: false,
    fileName: null,
    objectUrl: null,
    durationSec: null,
    width: null,
    height: null,
    currentTimeSec: 0,
    playbackStatus: "stopped",
  },
  modelScan: {
    mediaPipeStatus: "uninitialized",
    mediaPipeError: null,
    scanStatus: "idle",
    scanProgress: 0,
    plannedScanFrames: 0,
    maxScanFrames: MAX_SCAN_FRAMES,
    scanFrameStepSec: SCAN_FRAME_STEP_SEC,
    totalScannedFrames: 0,
    acceptedFrames: 0,
    excludedFrames: 0,
    excludedReasonCounts: {},
    lastError: null,
  },
  rawIdealReferenceFrames: [],
  currentAcceptedReviewIndex: null,
  logs: ["ラボを初期化しました。"],
}

const app = document.querySelector<HTMLDivElement>("#app")

if (!app) {
  throw new Error("#app が見つかりません。")
}

let faceLandmarker: FaceLandmarker | null = null
let faceLandmarkerPromise: Promise<FaceLandmarker> | null = null

app.innerHTML = `
  <main class="lab-shell">
    <section class="panel left-panel" aria-label="操作系">
      <div class="title-block">
        <p class="eyebrow">Ideal Reference Mesh Warp Lab</p>
        <h1>理想参照メッシュワープ検証ラボ</h1>
      </div>
      <div class="control-group">
        <button class="primary-button" type="button" data-action="load-model">モデル動画読込</button>
        <button class="primary-button" type="button" data-action="analyze">解析</button>
        <button class="primary-button" type="button" data-action="load-live">ライブ動画読込</button>
        <button class="secondary-button" type="button" data-action="export-log">ログ出力</button>
      </div>
      <input class="visually-hidden" type="file" accept="video/*" data-input="model-video" />
      <input class="visually-hidden" type="file" accept="video/*" data-input="live-video" />
      <div class="status-note">
        PR3 ではモデル動画だけを MediaPipe 解析し、raw ideal reference frames を作成します。ライブ動画解析、matching、mesh warp はまだ行いません。
      </div>
    </section>

    <section class="panel center-panel" aria-label="プレビュー系">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Preview</p>
          <h2>プレビュー</h2>
        </div>
        <label class="overlay-toggle">
          <input type="checkbox" data-action="toggle-landmarks" />
          <span>478点を表示</span>
        </label>
      </div>
      ${renderTabs("preview", previewTabs, state.activePreviewTab)}
      <div class="preview-stack">
        ${renderModelPreview()}
        ${renderLivePreview()}
      </div>
    </section>

    <section class="panel right-panel" aria-label="ログ・デバッグ系">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Debug</p>
          <h2>ログ・デバッグ</h2>
        </div>
      </div>
      ${renderTabs("debug", debugTabs, state.activeDebugTab)}
      <div class="debug-content" data-debug-content></div>
    </section>
  </main>
`

const modelVideoElement = getElement<HTMLVideoElement>("[data-video='model']")
const liveVideoElement = getElement<HTMLVideoElement>("[data-video='live']")
const modelOverlayCanvas = getElement<HTMLCanvasElement>("[data-overlay='model']")
const modelFileInput = getElement<HTMLInputElement>("[data-input='model-video']")
const liveFileInput = getElement<HTMLInputElement>("[data-input='live-video']")

bindEvents()
renderAll()

function renderTabs<TValue extends string>(
  group: "preview" | "debug",
  tabs: TabOption<TValue>[],
  activeValue: TValue,
) {
  return `
    <div class="tab-list" role="tablist" aria-label="${group}">
      ${tabs
        .map(
          (tab) => `
            <button
              class="tab-button ${tab.value === activeValue ? "is-active" : ""}"
              type="button"
              data-tab-group="${group}"
              data-tab-value="${tab.value}"
              role="tab"
              aria-selected="${tab.value === activeValue}"
            >
              ${tab.label}
            </button>
          `,
        )
        .join("")}
    </div>
  `
}

function renderModelPreview() {
  return `
    <div class="preview-card" data-preview-panel="model">
      <div class="preview-stage" data-loaded="false">
        <video class="video-preview" data-video="model" preload="metadata" playsinline controls></video>
        <canvas class="landmark-overlay" data-overlay="model"></canvas>
        <div class="preview-placeholder" data-placeholder="model">
          <h3>モデル動画プレビュー</h3>
          <p>モデル動画読込からローカル動画を選択すると、ここに frame review 用 preview を表示します。</p>
        </div>
      </div>
      <div class="timeline-controls" aria-label="モデル動画操作">
        <button class="small-button" type="button" data-action="model-prev">戻る</button>
        <button class="small-button" type="button" data-action="model-next">進む</button>
        <label class="range-field">
          <span data-model-range-label>シーク</span>
          <input type="range" min="0" step="0.001" value="0" data-range="model" />
        </label>
        <p class="frame-status" data-status="model-time">current time: - / -</p>
      </div>
      <div class="review-card" data-model-review>
        <p>解析後は accepted frame review に切り替わります。</p>
      </div>
      <p class="control-help" data-model-control-help>戻る / 進むは PR2 の仮操作として 1/30 秒ずつ移動します。</p>
    </div>
  `
}

function renderLivePreview() {
  return `
    <div class="preview-card" data-preview-panel="live">
      <div class="preview-stage" data-loaded="false">
        <video class="video-preview" data-video="live" preload="metadata" playsinline controls></video>
        <div class="preview-placeholder" data-placeholder="live">
          <h3>ライブ動画プレビュー</h3>
          <p>ライブ動画読込からローカル動画を選択すると、ここに current face 代わりの preview を表示します。</p>
        </div>
      </div>
      <div class="timeline-controls" aria-label="ライブ動画操作">
        <button class="small-button" type="button" data-action="live-play">再生</button>
        <button class="small-button" type="button" data-action="live-pause">一時停止</button>
        <label class="range-field">
          <span>シーク</span>
          <input type="range" min="0" step="0.001" value="0" data-range="live" />
        </label>
        <p class="frame-status" data-status="live-time">current time: - / -</p>
      </div>
    </div>
  `
}

function bindEvents() {
  getElement<HTMLButtonElement>('[data-action="load-model"]').addEventListener(
    "click",
    () => {
      modelFileInput.click()
    },
  )
  getElement<HTMLButtonElement>('[data-action="load-live"]').addEventListener(
    "click",
    () => {
      liveFileInput.click()
    },
  )
  getElement<HTMLButtonElement>('[data-action="analyze"]').addEventListener(
    "click",
    () => {
      void scanModelVideo()
    },
  )
  getElement<HTMLButtonElement>('[data-action="export-log"]').addEventListener(
    "click",
    handleExportLog,
  )
  getElement<HTMLInputElement>('[data-action="toggle-landmarks"]').addEventListener(
    "change",
    (event) => {
      handleToggleLandmarks478(event.currentTarget.checked)
    },
  )
  modelFileInput.addEventListener("change", () => {
    handleVideoFileSelection("model", modelFileInput.files?.[0] ?? null)
  })
  liveFileInput.addEventListener("change", () => {
    handleVideoFileSelection("live", liveFileInput.files?.[0] ?? null)
  })
  getElement<HTMLButtonElement>('[data-action="model-prev"]').addEventListener(
    "click",
    () => moveModelReview(-1),
  )
  getElement<HTMLButtonElement>('[data-action="model-next"]').addEventListener(
    "click",
    () => moveModelReview(1),
  )
  getElement<HTMLInputElement>('[data-range="model"]').addEventListener(
    "input",
    (event) => {
      handleModelRangeInput(Number(event.currentTarget.value))
    },
  )
  getElement<HTMLButtonElement>('[data-action="live-play"]').addEventListener(
    "click",
    () => {
      if (!state.liveVideo.loaded) {
        addLog("ライブ動画が未読込のため再生できません。")
        renderAll()
        return
      }
      void liveVideoElement.play().catch(() => {
        addLog("ライブ動画の再生に失敗しました。")
        state.liveVideo.playbackStatus = "paused"
        renderAll()
      })
    },
  )
  getElement<HTMLButtonElement>('[data-action="live-pause"]').addEventListener(
    "click",
    () => {
      liveVideoElement.pause()
    },
  )
  getElement<HTMLInputElement>('[data-range="live"]').addEventListener(
    "input",
    (event) => {
      seekVideoTo("live", Number(event.currentTarget.value))
    },
  )

  modelVideoElement.addEventListener("loadedmetadata", () => {
    syncMetadata("model")
    addLog("モデル動画 metadata を取得しました。")
    renderAll()
  })
  modelVideoElement.addEventListener("timeupdate", () => {
    syncCurrentTime("model")
    drawModelOverlay()
    renderAll()
  })
  liveVideoElement.addEventListener("loadedmetadata", () => {
    syncMetadata("live")
    addLog("ライブ動画 metadata を取得しました。")
    renderAll()
  })
  liveVideoElement.addEventListener("timeupdate", () => {
    syncCurrentTime("live")
    renderAll()
  })
  liveVideoElement.addEventListener("play", () => {
    state.liveVideo.playbackStatus = "playing"
    renderAll()
  })
  liveVideoElement.addEventListener("pause", () => {
    const durationSec = state.liveVideo.durationSec ?? Number.POSITIVE_INFINITY
    state.liveVideo.playbackStatus =
      state.liveVideo.currentTimeSec <= 0.001 ||
      state.liveVideo.currentTimeSec >= durationSec - 0.001
        ? "stopped"
        : "paused"
    renderAll()
  })
  liveVideoElement.addEventListener("ended", () => {
    state.liveVideo.playbackStatus = "stopped"
    renderAll()
  })

  app.querySelectorAll<HTMLButtonElement>("[data-tab-group]").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.dataset.tabGroup
      const value = button.dataset.tabValue

      if (group === "preview" && isPreviewTab(value)) {
        state.activePreviewTab = value
        addLog(`${getPreviewTabLabel(value)} タブに切り替えました。`)
        renderAll()
      }

      if (group === "debug" && isDebugTab(value)) {
        state.activeDebugTab = value
        renderAll()
      }
    })
  })

  window.addEventListener("resize", drawModelOverlay)
  window.addEventListener("beforeunload", cleanup)
}

function handleVideoFileSelection(kind: PreviewTab, file: File | null) {
  if (!file) {
    return
  }

  const videoState = kind === "model" ? state.modelVideo : state.liveVideo
  if (videoState.objectUrl) {
    URL.revokeObjectURL(videoState.objectUrl)
  }

  const objectUrl = URL.createObjectURL(file)
  videoState.loaded = true
  videoState.fileName = file.name
  videoState.objectUrl = objectUrl
  videoState.durationSec = null
  videoState.width = null
  videoState.height = null
  videoState.currentTimeSec = 0

  if (kind === "model") {
    state.modelVideo.currentReviewFrameIndex = 0
    state.modelVideo.scanStatus = "idle"
    resetModelScanResults()
    modelVideoElement.src = objectUrl
    modelVideoElement.load()
    state.activePreviewTab = "model"
    addLog(`モデル動画を読み込みました: ${file.name}`)
  } else {
    state.liveVideo.playbackStatus = "stopped"
    liveVideoElement.src = objectUrl
    liveVideoElement.load()
    state.activePreviewTab = "live"
    addLog(`ライブ動画を読み込みました: ${file.name}`)
  }

  renderAll()
}

async function scanModelVideo() {
  if (!state.modelVideo.loaded) {
    addLog("モデル動画が未読込のため解析できません。")
    renderAll()
    return
  }

  if (state.modelScan.scanStatus === "initializing" || state.modelScan.scanStatus === "running") {
    return
  }

  state.activePreviewTab = "model"
  state.modelVideo.scanStatus = "initializing"
  state.modelScan.scanStatus = "initializing"
  state.modelScan.lastError = null
  state.rawIdealReferenceFrames = []
  state.currentAcceptedReviewIndex = null
  updateScanCounters()
  addLog("モデル動画解析を開始します。")
  renderAll()

  try {
    const detector = await getFaceLandmarker()
    const durationSec = state.modelVideo.durationSec ?? modelVideoElement.duration
    if (!Number.isFinite(durationSec) || durationSec <= 0) {
      throw new Error("モデル動画の duration を取得できません。")
    }

    const plannedFrames = Math.min(
      state.modelScan.maxScanFrames,
      Math.floor(durationSec / state.modelScan.scanFrameStepSec) + 1,
    )
    state.modelScan.plannedScanFrames = plannedFrames
    state.modelScan.scanStatus = "running"
    state.modelVideo.scanStatus = "running"
    renderAll()

    for (let frameIndex = 0; frameIndex < plannedFrames; frameIndex += 1) {
      const timeSec = Math.min(frameIndex * state.modelScan.scanFrameStepSec, durationSec)
      await seekVideoElement(modelVideoElement, timeSec)
      const result = detector.detectForVideo(modelVideoElement, Math.round(timeSec * 1000))
      state.rawIdealReferenceFrames.push(buildReferenceFrame(result, frameIndex, timeSec))
      state.modelScan.scanProgress = frameIndex + 1

      if ((frameIndex + 1) % SCAN_RENDER_INTERVAL === 0 || frameIndex + 1 === plannedFrames) {
        updateScanCounters()
        renderAll()
        await nextFrame()
      }
    }

    updateScanCounters()
    state.modelScan.scanStatus = "done"
    state.modelVideo.scanStatus = "done"
    state.currentAcceptedReviewIndex = state.modelScan.acceptedFrames > 0 ? 0 : null
    addLog(
      `モデル動画解析が完了しました。accepted ${state.modelScan.acceptedFrames} / excluded ${state.modelScan.excludedFrames}`,
    )
    await seekToCurrentAcceptedFrame()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    state.modelScan.scanStatus = "error"
    state.modelVideo.scanStatus = "error"
    state.modelScan.lastError = message
    addLog(`モデル動画解析でエラーが発生しました: ${message}`)
  }

  updateScanCounters()
  renderAll()
}

async function getFaceLandmarker() {
  if (faceLandmarker) {
    return faceLandmarker
  }

  if (faceLandmarkerPromise) {
    return faceLandmarkerPromise
  }

  state.modelScan.mediaPipeStatus = "initializing"
  state.modelScan.mediaPipeError = null
  renderAll()

  faceLandmarkerPromise = initializeFaceLandmarker()
  try {
    faceLandmarker = await faceLandmarkerPromise
    state.modelScan.mediaPipeStatus = "ready"
    return faceLandmarker
  } catch (error) {
    state.modelScan.mediaPipeStatus = "error"
    state.modelScan.mediaPipeError = error instanceof Error ? error.message : String(error)
    throw error
  } finally {
    faceLandmarkerPromise = null
    renderAll()
  }
}

async function initializeFaceLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
  )

  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
    },
    runningMode: "VIDEO",
    numFaces: 1,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
  })
}

function buildReferenceFrame(
  result: FaceLandmarkerResultLike,
  frameIndex: number,
  timeSec: number,
): IdealReferenceFrame {
  const landmarks = result.faceLandmarks[0] ?? []
  const blendshapes = (result.faceBlendshapes[0]?.categories ?? []).map((category) => ({
    categoryName: category.categoryName,
    score: category.score,
  }))
  const matrix = result.facialTransformationMatrixes[0]
  const hasFace = result.faceLandmarks.length > 0
  const validLandmarks = landmarks.length === REQUIRED_LANDMARK_COUNT
  const excludedReason = !hasFace ? "noFace" : validLandmarks ? null : "invalidLandmarks"
  const excluded = Boolean(excludedReason)
  const referenceLandmarks = validLandmarks ? mapLandmarks(landmarks) : []

  return {
    frameId: `model_frame_${String(frameIndex).padStart(6, "0")}`,
    frameIndex,
    timeSec,
    landmarks478: referenceLandmarks,
    pose: estimateNullablePose(matrix),
    blendshapes,
    expressionGroup: validLandmarks ? classifyExpressionGroup(blendshapes) : "unknown",
    qualityScore: validLandmarks ? 1 : 0,
    excluded,
    excludedReason,
  }
}

type FaceLandmarkerResultLike = ReturnType<FaceLandmarker["detectForVideo"]>

function mapLandmarks(landmarks: NormalizedLandmark[]): ReferenceLandmark[] {
  return landmarks.map((landmark, index) => ({
    index,
    x: landmark.x,
    y: landmark.y,
    z: landmark.z,
  }))
}

function estimateNullablePose(matrix: Matrix | undefined): ReferencePose {
  return estimateFacePoseFromMatrix(matrix) ?? {
    yaw: null,
    pitch: null,
    roll: null,
  }
}

function estimateFacePoseFromMatrix(matrix: Matrix | undefined): ReferencePose | null {
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

function classifyExpressionGroup(blendshapes: ReferenceBlendshape[]): ExpressionGroup {
  if (blendshapes.length === 0) {
    return "unknown"
  }

  const scores = new Map(blendshapes.map((item) => [item.categoryName, item.score]))
  const expressionScores: Array<[ExpressionGroup, number]> = [
    ["jawOpen", scores.get("jawOpen") ?? 0],
    [
      "mouthSmile",
      Math.max(scores.get("mouthSmileLeft") ?? 0, scores.get("mouthSmileRight") ?? 0),
    ],
    ["mouthPucker", scores.get("mouthPucker") ?? 0],
    [
      "eyeBlink",
      Math.max(scores.get("eyeBlinkLeft") ?? 0, scores.get("eyeBlinkRight") ?? 0),
    ],
    [
      "eyeSquint",
      Math.max(scores.get("eyeSquintLeft") ?? 0, scores.get("eyeSquintRight") ?? 0),
    ],
  ]
  const strongGroups = expressionScores.filter(([, score]) => score >= MIXED_EXPRESSION_THRESHOLD)

  if (strongGroups.length > 1) {
    return "mixedExpression"
  }

  const strongest = expressionScores.reduce((best, current) =>
    current[1] > best[1] ? current : best,
  )

  return strongest[1] >= STRONG_EXPRESSION_THRESHOLD ? strongest[0] : "neutral"
}

function handleExportLog() {
  addLog("現在の state summary を console に出力しました。")
  console.info("Ideal Reference Mesh Warp Lab state", getRawState())
  renderAll()
}

function handleToggleLandmarks478(checked: boolean) {
  state.overlay.showLandmarks478 = checked
  addLog(`478点 overlay 表示を ${checked ? "ON" : "OFF"} にしました。`)
  drawModelOverlay()
  renderAll()
}

function handleModelRangeInput(value: number) {
  if (hasAcceptedFrames()) {
    const acceptedFrames = getAcceptedFrames()
    state.currentAcceptedReviewIndex = clamp(Math.round(value), 0, acceptedFrames.length - 1)
    void seekToCurrentAcceptedFrame()
    renderAll()
    return
  }

  seekVideoTo("model", value)
}

function moveModelReview(delta: number) {
  if (hasAcceptedFrames()) {
    const acceptedFrames = getAcceptedFrames()
    state.currentAcceptedReviewIndex = clamp(
      (state.currentAcceptedReviewIndex ?? 0) + delta,
      0,
      acceptedFrames.length - 1,
    )
    void seekToCurrentAcceptedFrame()
    renderAll()
    return
  }

  seekVideoTo("model", modelVideoElement.currentTime + delta * FRAME_STEP_SEC)
}

async function seekToCurrentAcceptedFrame() {
  const frame = getCurrentAcceptedFrame()
  if (!frame) {
    clearModelOverlay()
    return
  }

  state.modelVideo.currentTimeSec = frame.timeSec
  state.modelVideo.currentReviewFrameIndex = frame.frameIndex
  await seekVideoElement(modelVideoElement, frame.timeSec)
  drawModelOverlay()
}

function seekVideoTo(kind: PreviewTab, targetSec: number) {
  const videoElement = kind === "model" ? modelVideoElement : liveVideoElement
  const videoState = kind === "model" ? state.modelVideo : state.liveVideo

  if (!videoState.loaded || !Number.isFinite(targetSec)) {
    return
  }

  const duration = videoState.durationSec ?? videoElement.duration
  const nextTime = clamp(targetSec, 0, Number.isFinite(duration) ? duration : targetSec)
  videoElement.currentTime = nextTime
  videoState.currentTimeSec = nextTime

  if (kind === "model") {
    state.modelVideo.currentReviewFrameIndex = getFrameIndex(nextTime)
    drawModelOverlay()
  }

  renderAll()
}

function syncMetadata(kind: PreviewTab) {
  const videoElement = kind === "model" ? modelVideoElement : liveVideoElement
  const videoState = kind === "model" ? state.modelVideo : state.liveVideo

  videoState.durationSec = Number.isFinite(videoElement.duration)
    ? videoElement.duration
    : null
  videoState.width = videoElement.videoWidth || null
  videoState.height = videoElement.videoHeight || null
  videoState.currentTimeSec = videoElement.currentTime || 0

  if (kind === "model") {
    state.modelVideo.currentReviewFrameIndex = getFrameIndex(videoState.currentTimeSec)
  }
}

function syncCurrentTime(kind: PreviewTab) {
  const videoElement = kind === "model" ? modelVideoElement : liveVideoElement
  const videoState = kind === "model" ? state.modelVideo : state.liveVideo

  videoState.currentTimeSec = videoElement.currentTime || 0

  if (kind === "model" && !hasAcceptedFrames()) {
    state.modelVideo.currentReviewFrameIndex = getFrameIndex(videoState.currentTimeSec)
  }
}

function resetModelScanResults() {
  state.rawIdealReferenceFrames = []
  state.currentAcceptedReviewIndex = null
  state.modelScan.scanStatus = "idle"
  state.modelScan.scanProgress = 0
  state.modelScan.plannedScanFrames = 0
  state.modelScan.totalScannedFrames = 0
  state.modelScan.acceptedFrames = 0
  state.modelScan.excludedFrames = 0
  state.modelScan.excludedReasonCounts = {}
  state.modelScan.lastError = null
  clearModelOverlay()
}

function updateScanCounters() {
  const acceptedFrames = getAcceptedFrames()
  const excludedFrames = state.rawIdealReferenceFrames.filter((frame) => frame.excluded)
  state.modelScan.totalScannedFrames = state.rawIdealReferenceFrames.length
  state.modelScan.acceptedFrames = acceptedFrames.length
  state.modelScan.excludedFrames = excludedFrames.length
  state.modelScan.excludedReasonCounts = countBy(
    excludedFrames.map((frame) => frame.excludedReason ?? "unknown"),
  )
}

function addLog(message: string) {
  const timestamp = new Date().toLocaleTimeString("ja-JP", {
    hour12: false,
  })
  state.logs = [`${timestamp} ${message}`, ...state.logs].slice(0, 20)
}

function renderAll() {
  renderPreviewTabs()
  renderPreviewPanels()
  renderControls()
  renderDebugTabs()
  renderDebugContent()
  drawModelOverlay()
}

function renderPreviewTabs() {
  app.querySelectorAll<HTMLButtonElement>("[data-tab-group='preview']").forEach((button) => {
    const isActive = button.dataset.tabValue === state.activePreviewTab
    button.classList.toggle("is-active", isActive)
    button.setAttribute("aria-selected", String(isActive))
  })
}

function renderPreviewPanels() {
  app.querySelectorAll<HTMLElement>("[data-preview-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.previewPanel !== state.activePreviewTab
  })

  const modelStage = getElement<HTMLElement>("[data-preview-panel='model'] .preview-stage")
  const liveStage = getElement<HTMLElement>("[data-preview-panel='live'] .preview-stage")

  modelStage.dataset.loaded = String(state.modelVideo.loaded)
  liveStage.dataset.loaded = String(state.liveVideo.loaded)
}

function renderControls() {
  const modelLoaded = state.modelVideo.loaded
  const liveLoaded = state.liveVideo.loaded
  const scanBusy =
    state.modelScan.scanStatus === "initializing" || state.modelScan.scanStatus === "running"

  setDisabled('[data-action="analyze"]', !modelLoaded || scanBusy)
  setDisabled('[data-action="model-prev"]', !modelLoaded || scanBusy || !canMoveModel(-1))
  setDisabled('[data-action="model-next"]', !modelLoaded || scanBusy || !canMoveModel(1))
  setDisabled('[data-range="model"]', !modelLoaded || scanBusy)
  setDisabled('[data-action="live-play"]', !liveLoaded || state.liveVideo.playbackStatus === "playing")
  setDisabled('[data-action="live-pause"]', !liveLoaded || state.liveVideo.playbackStatus !== "playing")
  setDisabled('[data-range="live"]', !liveLoaded)

  updateModelRange()
  updateRange("live")
  setText("[data-status='model-time']", formatModelTimeStatus())
  setText("[data-status='live-time']", formatTimeStatus(state.liveVideo))
  setText("[data-model-range-label]", hasAcceptedFrames() ? "accepted frame" : "シーク")
  setText(
    "[data-model-control-help]",
    hasAcceptedFrames()
      ? "解析後は accepted frame の index でレビューします。除外フレームは表示しません。"
      : "戻る / 進むは 1/30 秒ずつ移動します。",
  )
  getElement<HTMLInputElement>('[data-action="toggle-landmarks"]').checked =
    state.overlay.showLandmarks478
  renderModelReviewCard()
}

function renderModelReviewCard() {
  const reviewCard = getElement<HTMLElement>("[data-model-review]")
  const frame = getCurrentAcceptedFrame()

  if (!hasAcceptedFrames()) {
    if (state.modelScan.scanStatus === "done" && state.modelScan.acceptedFrames === 0) {
      reviewCard.innerHTML = `<p>accepted frame がありません。noFace / invalidLandmarks の内訳を Model Scan で確認してください。</p>`
      return
    }
    reviewCard.innerHTML = `<p>解析後は accepted frame review に切り替わります。</p>`
    return
  }

  if (!frame) {
    reviewCard.innerHTML = `<p>accepted frame を選択できません。</p>`
    return
  }

  reviewCard.innerHTML = `
    <dl class="review-grid">
      <div><dt>frameId</dt><dd>${escapeHtml(frame.frameId)}</dd></div>
      <div><dt>timeSec</dt><dd>${formatSeconds(frame.timeSec)} sec</dd></div>
      <div><dt>pose</dt><dd>${escapeHtml(formatPose(frame.pose))}</dd></div>
      <div><dt>expressionGroup</dt><dd>${frame.expressionGroup}</dd></div>
      <div><dt>qualityScore</dt><dd>${formatSeconds(frame.qualityScore)}</dd></div>
    </dl>
  `
}

function renderDebugTabs() {
  app.querySelectorAll<HTMLButtonElement>("[data-tab-group='debug']").forEach((button) => {
    const isActive = button.dataset.tabValue === state.activeDebugTab
    button.classList.toggle("is-active", isActive)
    button.setAttribute("aria-selected", String(isActive))
  })
}

function renderDebugContent() {
  const content = getElement<HTMLElement>("[data-debug-content]")
  content.innerHTML = ""

  if (state.activeDebugTab === "summary") {
    content.appendChild(createSummaryContent())
    return
  }

  if (state.activeDebugTab === "modelScan") {
    content.appendChild(createModelScanContent())
    return
  }

  if (state.activeDebugTab === "referenceLibrary") {
    content.appendChild(createReferenceLibraryContent())
    return
  }

  if (state.activeDebugTab === "raw") {
    const pre = document.createElement("pre")
    pre.className = "raw-state"
    pre.textContent = JSON.stringify(getRawState(), null, 2)
    content.appendChild(pre)
    return
  }

  const paragraph = document.createElement("p")
  paragraph.className = "placeholder-text"
  paragraph.textContent = getDebugPlaceholder(state.activeDebugTab)
  content.appendChild(paragraph)
}

function createSummaryContent() {
  const fragment = document.createDocumentFragment()
  const summaryList = document.createElement("dl")
  summaryList.className = "summary-list"
  const currentFrame = getCurrentAcceptedFrame()

  const items: Array<[string, string]> = [
    ["MediaPipe", state.modelScan.mediaPipeStatus],
    ["Model video", state.modelVideo.loaded ? "loaded" : "not loaded"],
    ["Model file", state.modelVideo.fileName ?? "-"],
    ["Model duration", formatDuration(state.modelVideo.durationSec)],
    ["Model size", formatSize(state.modelVideo.width, state.modelVideo.height)],
    ["Model scan", state.modelScan.scanStatus],
    ["Scan progress", `${state.modelScan.scanProgress} / ${state.modelScan.plannedScanFrames || state.modelScan.maxScanFrames}`],
    ["Raw reference frames", String(state.rawIdealReferenceFrames.length)],
    ["Accepted frames", String(state.modelScan.acceptedFrames)],
    ["Excluded frames", String(state.modelScan.excludedFrames)],
    ["Current accepted review", formatAcceptedReviewPosition()],
    ["Current model frame time", currentFrame ? `${formatSeconds(currentFrame.timeSec)} sec` : "-"],
    ["Current expression group", currentFrame?.expressionGroup ?? "-"],
    ["Live video", state.liveVideo.loaded ? "loaded" : "not loaded"],
    ["Live file", state.liveVideo.fileName ?? "-"],
    ["Live duration", formatDuration(state.liveVideo.durationSec)],
    ["Live size", formatSize(state.liveVideo.width, state.liveVideo.height)],
    ["Live current time", `${formatSeconds(state.liveVideo.currentTimeSec)} sec`],
    ["Live playback", state.liveVideo.playbackStatus],
    ["Overlay 478 landmarks", state.overlay.showLandmarks478 ? "on" : "off"],
  ]

  appendDefinitionItems(summaryList, items)

  const logSection = document.createElement("section")
  logSection.className = "log-section"
  logSection.setAttribute("aria-label", "ログ")
  const heading = document.createElement("h3")
  heading.textContent = "ログ"
  const list = document.createElement("ul")
  state.logs.forEach((log) => {
    const item = document.createElement("li")
    item.textContent = log
    list.appendChild(item)
  })
  logSection.append(heading, list)
  fragment.append(summaryList, logSection)

  return fragment
}

function createModelScanContent() {
  const list = document.createElement("dl")
  list.className = "summary-list"
  appendDefinitionItems(list, [
    ["scanStatus", state.modelScan.scanStatus],
    ["mediaPipeStatus", state.modelScan.mediaPipeStatus],
    ["mediaPipeError", state.modelScan.mediaPipeError ?? "-"],
    ["scanProgress", `${state.modelScan.scanProgress} / ${state.modelScan.plannedScanFrames}`],
    ["maxScanFrames", String(state.modelScan.maxScanFrames)],
    ["scanFrameStepSec", String(state.modelScan.scanFrameStepSec)],
    ["totalScannedFrames", String(state.modelScan.totalScannedFrames)],
    ["acceptedFrames", String(state.modelScan.acceptedFrames)],
    ["excludedFrames", String(state.modelScan.excludedFrames)],
    ["excludedReason counts", formatCounts(state.modelScan.excludedReasonCounts)],
    ["durationSec", formatSeconds(state.modelVideo.durationSec)],
    ["lastError", state.modelScan.lastError ?? "-"],
  ])
  return list
}

function createReferenceLibraryContent() {
  const stats = getReferenceLibraryStats()
  const list = document.createElement("dl")
  list.className = "summary-list"
  appendDefinitionItems(list, [
    ["rawIdealReferenceFrames count", String(state.rawIdealReferenceFrames.length)],
    ["accepted count", String(state.modelScan.acceptedFrames)],
    ["excluded count", String(state.modelScan.excludedFrames)],
    ["pose available count", String(stats.poseAvailableCount)],
    ["blendshapes available count", String(stats.blendshapesAvailableCount)],
    ["expression distribution", formatCounts(stats.expressionDistribution)],
    ["landmark count summary", formatCounts(stats.landmarkCountSummary)],
  ])
  return list
}

function appendDefinitionItems(list: HTMLDListElement, items: Array<[string, string]>) {
  items.forEach(([label, value]) => {
    const row = document.createElement("div")
    const dt = document.createElement("dt")
    const dd = document.createElement("dd")
    dt.textContent = label
    dd.textContent = value
    row.append(dt, dd)
    list.appendChild(row)
  })
}

function getRawState() {
  const currentFrame = getCurrentAcceptedFrame()
  return {
    activePreviewTab: state.activePreviewTab,
    activeDebugTab: state.activeDebugTab,
    overlay: state.overlay,
    modelVideo: {
      loaded: state.modelVideo.loaded,
      fileName: state.modelVideo.fileName,
      durationSec: roundForState(state.modelVideo.durationSec),
      width: state.modelVideo.width,
      height: state.modelVideo.height,
      currentTimeSec: roundForState(state.modelVideo.currentTimeSec),
      currentReviewFrameIndex: state.modelVideo.currentReviewFrameIndex,
      scanStatus: state.modelVideo.scanStatus,
    },
    modelScan: {
      mediaPipeStatus: state.modelScan.mediaPipeStatus,
      maxScanFrames: state.modelScan.maxScanFrames,
      scanFrameStepSec: state.modelScan.scanFrameStepSec,
      scanProgress: state.modelScan.scanProgress,
      plannedScanFrames: state.modelScan.plannedScanFrames,
      totalScannedFrames: state.modelScan.totalScannedFrames,
      acceptedFrames: state.modelScan.acceptedFrames,
      excludedFrames: state.modelScan.excludedFrames,
      excludedReasonCounts: state.modelScan.excludedReasonCounts,
      lastError: state.modelScan.lastError,
    },
    referenceLibrary: {
      rawIdealReferenceFrames: state.rawIdealReferenceFrames.length,
      acceptedFrames: state.modelScan.acceptedFrames,
      currentAcceptedFrame: currentFrame
        ? {
            frameId: currentFrame.frameId,
            frameIndex: currentFrame.frameIndex,
            timeSec: roundForState(currentFrame.timeSec),
            landmarkCount: currentFrame.landmarks478.length,
            pose: roundPose(currentFrame.pose),
            blendshapeCount: currentFrame.blendshapes.length,
            expressionGroup: currentFrame.expressionGroup,
            qualityScore: currentFrame.qualityScore,
            landmarksPreview: currentFrame.landmarks478
              .slice(0, LANDMARK_PREVIEW_COUNT)
              .map(roundLandmark),
          }
        : null,
    },
    liveVideo: {
      loaded: state.liveVideo.loaded,
      fileName: state.liveVideo.fileName,
      durationSec: roundForState(state.liveVideo.durationSec),
      width: state.liveVideo.width,
      height: state.liveVideo.height,
      currentTimeSec: roundForState(state.liveVideo.currentTimeSec),
      playbackStatus: state.liveVideo.playbackStatus,
    },
    logs: state.logs,
  }
}

function getDebugPlaceholder(tab: DebugTab) {
  switch (tab) {
    case "matching":
      return "live current frame と ideal reference frame の matching はまだ実行されていません。"
    case "warpMesh":
      return "mesh warp はまだ実行されていません。"
    case "modelScan":
    case "referenceLibrary":
    case "raw":
    case "summary":
      return ""
  }
}

function updateModelRange() {
  const range = getElement<HTMLInputElement>('[data-range="model"]')

  if (hasAcceptedFrames()) {
    const acceptedFrames = getAcceptedFrames()
    range.max = String(Math.max(acceptedFrames.length - 1, 0))
    range.step = "1"
    range.value = String(state.currentAcceptedReviewIndex ?? 0)
    return
  }

  const duration = state.modelVideo.durationSec ?? 0
  range.max = String(duration)
  range.step = "0.001"
  range.value = String(clamp(state.modelVideo.currentTimeSec, 0, duration))
}

function updateRange(kind: "live") {
  const videoState = state.liveVideo
  const range = getElement<HTMLInputElement>(`[data-range="${kind}"]`)
  const duration = videoState.durationSec ?? 0

  range.max = String(duration)
  range.value = String(clamp(videoState.currentTimeSec, 0, duration))
}

function drawModelOverlay() {
  const context = modelOverlayCanvas.getContext("2d")
  if (!context) {
    return
  }

  const rect = modelVideoElement.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  modelOverlayCanvas.width = Math.max(1, Math.round(rect.width * dpr))
  modelOverlayCanvas.height = Math.max(1, Math.round(rect.height * dpr))
  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  context.clearRect(0, 0, rect.width, rect.height)

  const frame = getCurrentAcceptedFrame()
  if (
    !state.overlay.showLandmarks478 ||
    state.activePreviewTab !== "model" ||
    !frame ||
    frame.landmarks478.length !== REQUIRED_LANDMARK_COUNT ||
    rect.width <= 0 ||
    rect.height <= 0
  ) {
    return
  }

  const drawRect = getVideoDrawRect(rect.width, rect.height)
  context.fillStyle = "rgba(32, 186, 165, 0.85)"
  for (const landmark of frame.landmarks478) {
    context.beginPath()
    context.arc(
      drawRect.x + landmark.x * drawRect.width,
      drawRect.y + landmark.y * drawRect.height,
      1.45,
      0,
      Math.PI * 2,
    )
    context.fill()
  }
}

function clearModelOverlay() {
  const context = modelOverlayCanvas.getContext("2d")
  if (!context) {
    return
  }
  context.clearRect(0, 0, modelOverlayCanvas.width, modelOverlayCanvas.height)
}

function getVideoDrawRect(containerWidth: number, containerHeight: number) {
  const videoWidth = state.modelVideo.width ?? modelVideoElement.videoWidth
  const videoHeight = state.modelVideo.height ?? modelVideoElement.videoHeight
  if (!videoWidth || !videoHeight) {
    return {
      x: 0,
      y: 0,
      width: containerWidth,
      height: containerHeight,
    }
  }

  const videoAspect = videoWidth / videoHeight
  const containerAspect = containerWidth / containerHeight

  if (containerAspect > videoAspect) {
    const width = containerHeight * videoAspect
    return {
      x: (containerWidth - width) / 2,
      y: 0,
      width,
      height: containerHeight,
    }
  }

  const height = containerWidth / videoAspect
  return {
    x: 0,
    y: (containerHeight - height) / 2,
    width: containerWidth,
    height,
  }
}

function formatModelTimeStatus() {
  if (!state.modelVideo.loaded) {
    return "current time: - / -"
  }

  if (hasAcceptedFrames()) {
    const frame = getCurrentAcceptedFrame()
    return frame
      ? `accepted frame: ${formatAcceptedReviewPosition()} / ${formatSeconds(frame.timeSec)} sec`
      : "accepted frame: -"
  }

  return formatTimeStatus(state.modelVideo)
}

function formatTimeStatus(videoState: VideoPreviewState) {
  if (!videoState.loaded) {
    return "current time: - / -"
  }

  return `current time: ${formatSeconds(videoState.currentTimeSec)} / ${formatSeconds(videoState.durationSec)} sec`
}

function formatDuration(value: number | null) {
  return value === null ? "-" : `${formatSeconds(value)} sec`
}

function formatSeconds(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "-"
  }

  return value.toFixed(2)
}

function formatSize(width: number | null, height: number | null) {
  return width === null || height === null ? "-" : `${width} x ${height}`
}

function formatCounts(counts: Record<string, number>) {
  const entries = Object.entries(counts)
  return entries.length === 0
    ? "-"
    : entries.map(([key, value]) => `${key}: ${value}`).join(" / ")
}

function formatAcceptedReviewPosition() {
  if (!hasAcceptedFrames()) {
    return "-"
  }

  return `${(state.currentAcceptedReviewIndex ?? 0) + 1} / ${state.modelScan.acceptedFrames}`
}

function formatPose(pose: ReferencePose) {
  return `yaw ${formatSeconds(pose.yaw)} / pitch ${formatSeconds(pose.pitch)} / roll ${formatSeconds(pose.roll)}`
}

function roundForState(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return value
  }

  return Math.round(value * 1000) / 1000
}

function roundPose(pose: ReferencePose) {
  return {
    yaw: roundForState(pose.yaw),
    pitch: roundForState(pose.pitch),
    roll: roundForState(pose.roll),
  }
}

function roundLandmark(landmark: ReferenceLandmark) {
  return {
    index: landmark.index,
    x: roundForState(landmark.x),
    y: roundForState(landmark.y),
    z: roundForState(landmark.z),
  }
}

function getFrameIndex(currentTimeSec: number) {
  return Math.max(0, Math.round(currentTimeSec / FRAME_STEP_SEC))
}

function getAcceptedFrames() {
  return state.rawIdealReferenceFrames.filter((frame) => !frame.excluded)
}

function hasAcceptedFrames() {
  return state.modelScan.acceptedFrames > 0
}

function getCurrentAcceptedFrame() {
  const acceptedFrames = getAcceptedFrames()
  const index = state.currentAcceptedReviewIndex
  return index === null ? null : acceptedFrames[index] ?? null
}

function canMoveModel(delta: number) {
  if (!state.modelVideo.loaded) {
    return false
  }

  if (!hasAcceptedFrames()) {
    return true
  }

  const nextIndex = (state.currentAcceptedReviewIndex ?? 0) + delta
  return nextIndex >= 0 && nextIndex < state.modelScan.acceptedFrames
}

function getReferenceLibraryStats() {
  const acceptedFrames = getAcceptedFrames()
  return {
    poseAvailableCount: acceptedFrames.filter(
      (frame) => frame.pose.yaw !== null && frame.pose.pitch !== null && frame.pose.roll !== null,
    ).length,
    blendshapesAvailableCount: acceptedFrames.filter((frame) => frame.blendshapes.length > 0).length,
    expressionDistribution: countBy(acceptedFrames.map((frame) => frame.expressionGroup)),
    landmarkCountSummary: countBy(
      state.rawIdealReferenceFrames.map((frame) => String(frame.landmarks478.length)),
    ),
  }
}

function getPreviewTabLabel(tab: PreviewTab) {
  return previewTabs.find((option) => option.value === tab)?.label ?? tab
}

function setDisabled(selector: string, disabled: boolean) {
  getElement<HTMLButtonElement | HTMLInputElement>(selector).disabled = disabled
}

function setText(selector: string, text: string) {
  getElement<HTMLElement>(selector).textContent = text
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1
    return counts
  }, {})
}

function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

function seekVideoElement(videoElement: HTMLVideoElement, timeSec: number) {
  return new Promise<void>((resolve) => {
    if (Math.abs(videoElement.currentTime - timeSec) < 0.0005) {
      resolve()
      return
    }

    let timeoutId: number | null = null
    const onSeeked = () => {
      videoElement.removeEventListener("seeked", onSeeked)
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
      resolve()
    }
    videoElement.addEventListener("seeked", onSeeked)
    timeoutId = window.setTimeout(onSeeked, 1200)
    videoElement.currentTime = timeSec
  })
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function cleanup() {
  revokeObjectUrls()
  faceLandmarker?.close()
  faceLandmarker = null
}

function revokeObjectUrls() {
  if (state.modelVideo.objectUrl) {
    URL.revokeObjectURL(state.modelVideo.objectUrl)
    state.modelVideo.objectUrl = null
  }

  if (state.liveVideo.objectUrl) {
    URL.revokeObjectURL(state.liveVideo.objectUrl)
    state.liveVideo.objectUrl = null
  }
}

function getElement<TElement extends Element>(selector: string) {
  const element = app.querySelector<TElement>(selector)

  if (!element) {
    throw new Error(`${selector} が見つかりません。`)
  }

  return element
}

function isPreviewTab(value: string | undefined): value is PreviewTab {
  return value === "model" || value === "live"
}

function isDebugTab(value: string | undefined): value is DebugTab {
  return debugTabs.some((tab) => tab.value === value)
}
