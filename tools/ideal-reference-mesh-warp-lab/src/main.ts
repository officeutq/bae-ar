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

type MediaPipeStatus =
  | "uninitialized"
  | "initializing"
  | "ready"
  | "scanning"
  | "disposed"
  | "error"
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

type CurrentLiveFrameAnalysis = {
  analyzed: boolean
  timeSec: number | null
  landmarks478: ReferenceLandmark[]
  pose: ReferencePose
  blendshapes: ReferenceBlendshape[]
  expressionGroup: ExpressionGroup
  qualityScore: number
  error: string | null
}

type ReferenceMatchResult = {
  matched: boolean
  idealFrameId: string | null
  idealFrameIndex: number | null
  idealTimeSec: number | null
  matchScore: number | null
  poseDistance: number | null
  expressionDistance: number | null
  qualityPenalty: number | null
  currentExpressionGroup: ExpressionGroup | null
  idealExpressionGroup: ExpressionGroup | null
  error: string | null
}

type Rect = {
  x: number
  y: number
  width: number
  height: number
}

type Point2D = {
  x: number
  y: number
}

type MeshVertexKind =
  | "faceLandmark"
  | "nearFaceGrid"
  | "backgroundGrid"
  | "screenEdgeAnchor"

type CurrentMeshLandmarkVertex = {
  id: string
  kind: "faceLandmark"
  index: number
  source: Point2D
  visibilityWeight: number
  safetyWeight: number
  usageWeight: number
  reasons: string[]
}

type MeshSourceVertex = {
  id: string
  kind: MeshVertexKind
  index?: number
  x: number
  y: number
  weight: number
  reasons: string[]
}

type MeshTargetVertex = {
  id: string
  kind: MeshVertexKind
  index?: number
  x: number
  y: number
  weight: number
  reasons: string[]
}

type MeshVertexPair = {
  id: string
  kind: MeshVertexKind
  index?: number
  source: Point2D
  target: Point2D
  usageWeight: number
  reasons: string[]
}

type MeshPrototypeSummary = {
  top1MatchedReferenceId: string | null
  currentLandmarkCount: number
  candidateAlignedIdealLandmarkCount: number
  visibleCurrentLandmarkCount: number
  excludedCurrentLandmarkCount: number
  faceSourceVertexCount: number
  nearFaceGridCount: number
  backgroundGridCount: number
  screenEdgeAnchorCount: number
  meshPairCount: number
  usageWeightAverage: number | null
  usageWeightMin: number | null
  usageWeightMax: number | null
  boundarySuppressedCount: number
  mouthSuppressedCount: number
  eyeSuppressedCount: number
  largeDisplacementSuppressedCount: number
  invalidExcludedCount: number
}

type CurrentIdealMeshPrototypeState = {
  candidateAlignedIdealLandmarks: ReferenceLandmark[]
  acceptedCurrentLandmarks: CurrentMeshLandmarkVertex[]
  excludedCurrentLandmarks: CurrentMeshLandmarkVertex[]
  currentMeshSourceVertices: MeshSourceVertex[]
  idealMeshTargetVertices: MeshTargetVertex[]
  currentIdealMeshPairs: MeshVertexPair[]
  summary: MeshPrototypeSummary
}

type ModelScanState = {
  mediaPipeStatus: MediaPipeStatus
  mediaPipeError: string | null
  modelTimestampMs: number
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
    showMeshSource: boolean
    showMeshTarget: boolean
    showMeshPairs: boolean
    showExcludedLandmarks: boolean
    showGridAnchors: boolean
  }
  modelVideo: VideoPreviewState & {
    currentReviewFrameIndex: number | null
    scanStatus: ScanStatus
  }
  liveVideo: VideoPreviewState & {
    playbackStatus: PlaybackStatus
  }
  liveMediaPipe: {
    status: MediaPipeStatus
    error: string | null
    liveTimestampMs: number
  }
  modelScan: ModelScanState
  rawIdealReferenceFrames: IdealReferenceFrame[]
  currentAcceptedReviewIndex: number | null
  currentLiveFrameAnalysis: CurrentLiveFrameAnalysis
  top1Match: ReferenceMatchResult
  currentIdealMeshPrototype: CurrentIdealMeshPrototypeState
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
const LIVE_AUTO_ANALYSIS_INTERVAL_SEC = 0.35
const MEDIAPIPE_TIMESTAMP_STEP_MS = SCAN_FRAME_STEP_SEC * 1000
const POSE_WEIGHT = 1
const EXPRESSION_WEIGHT = 1
const QUALITY_WEIGHT = 0.25
const POSE_MISSING_PENALTY = 1000
const HIDDEN_SIDE_YAW_THRESHOLD_DEG = 18
const FACE_BOUNDARY_USAGE_MULTIPLIER = 0.55
const HIDDEN_SIDE_USAGE_MULTIPLIER = 0.25
const EXPRESSION_REGION_USAGE_MULTIPLIER = 0.45
const LARGE_DISPLACEMENT_USAGE_MULTIPLIER = 0.4
const LARGE_DISPLACEMENT_THRESHOLD = 0.075
const EXCLUDE_USAGE_WEIGHT_THRESHOLD = 0.15
const NEAR_FACE_GRID_STEPS = 5
const BACKGROUND_GRID_STEPS = 5
const MATCH_BLENDSHAPE_KEYS = [
  "jawOpen",
  "mouthSmileLeft",
  "mouthSmileRight",
  "mouthPucker",
  "eyeBlinkLeft",
  "eyeBlinkRight",
  "eyeSquintLeft",
  "eyeSquintRight",
] as const
const FACE_BOUNDARY_LANDMARK_INDICES = new Set([
  0, 10, 21, 54, 58, 67, 93, 103, 109, 127, 132, 136, 148, 149, 150, 152, 162,
  172, 176, 234, 251, 284, 288, 297, 323, 332, 338, 356, 361, 365, 377, 378,
  379, 389, 397, 400, 454,
])
const MOUTH_LANDMARK_INDICES = new Set([
  0, 13, 14, 17, 37, 39, 40, 61, 78, 80, 81, 82, 84, 87, 88, 91, 95, 146, 178,
  181, 185, 191, 267, 269, 270, 291, 308, 310, 311, 312, 314, 317, 318, 321,
  324, 375, 402, 405, 409, 415,
])
const EYE_LANDMARK_INDICES = new Set([
  7, 33, 46, 52, 53, 55, 63, 65, 66, 70, 105, 107, 133, 144, 145, 153, 154,
  155, 157, 158, 159, 160, 161, 163, 173, 246, 249, 263, 276, 282, 283, 285,
  293, 295, 296, 300, 334, 336, 362, 373, 374, 380, 381, 382, 384, 385, 386,
  387, 388, 390, 398, 466, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477,
])

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
    showMeshSource: false,
    showMeshTarget: false,
    showMeshPairs: false,
    showExcludedLandmarks: false,
    showGridAnchors: false,
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
  liveMediaPipe: {
    status: "uninitialized",
    error: null,
    liveTimestampMs: 0,
  },
  modelScan: {
    mediaPipeStatus: "uninitialized",
    mediaPipeError: null,
    modelTimestampMs: 0,
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
  currentLiveFrameAnalysis: createEmptyCurrentLiveFrameAnalysis(),
  top1Match: createEmptyTop1Match(),
  currentIdealMeshPrototype: createEmptyCurrentIdealMeshPrototype(),
  logs: ["ラボを初期化しました。"],
}

const app = document.querySelector<HTMLDivElement>("#app")

if (!app) {
  throw new Error("#app が見つかりません。")
}

// modelFaceLandmarker は authoring / library creation 用です。
// rawIdealReferenceFrames 作成後は破棄し、Runtime 相当の処理では liveFaceLandmarker と
// memory 上の reference library だけを使います。
let modelFaceLandmarker: FaceLandmarker | null = null
let modelFaceLandmarkerPromise: Promise<FaceLandmarker> | null = null
let liveFaceLandmarker: FaceLandmarker | null = null
let liveFaceLandmarkerPromise: Promise<FaceLandmarker> | null = null
let liveAnalysisInProgress = false
let lastAutoLiveAnalysisAtSec = Number.NEGATIVE_INFINITY
let liveAnalysisRequestId = 0

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
        モデル動画解析用 MediaPipe とライブ current 解析用 MediaPipe を分離し、各 stream の単調増加 timestamp で解析します。調整なしメッシュワープ試作は distortion 確認用です。topK、safety weight、hybrid mesh はまだ行いません。
      </div>
    </section>

    <section class="panel center-panel" aria-label="プレビュー系">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Preview</p>
          <h2>プレビュー</h2>
        </div>
        <div class="overlay-toggles">
          <label class="overlay-toggle">
            <input type="checkbox" data-action="toggle-landmarks" />
            <span>478点を表示</span>
          </label>
          <label class="overlay-toggle">
            <input type="checkbox" data-action="toggle-mesh-source" />
            <span>mesh sourceを表示</span>
          </label>
          <label class="overlay-toggle">
            <input type="checkbox" data-action="toggle-mesh-target" />
            <span>mesh targetを表示</span>
          </label>
          <label class="overlay-toggle">
            <input type="checkbox" data-action="toggle-mesh-pairs" />
            <span>対応線を表示</span>
          </label>
          <label class="overlay-toggle">
            <input type="checkbox" data-action="toggle-excluded-landmarks" />
            <span>除外landmarkを表示</span>
          </label>
          <label class="overlay-toggle">
            <input type="checkbox" data-action="toggle-grid-anchors" />
            <span>grid / anchorsを表示</span>
          </label>
        </div>
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
const liveOverlayCanvas = getElement<HTMLCanvasElement>("[data-overlay='live']")
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
        <canvas class="landmark-overlay" data-overlay="live"></canvas>
        <div class="preview-placeholder" data-placeholder="live">
          <h3>ライブ動画プレビュー</h3>
          <p>ライブ動画読込からローカル動画を選択すると、ここに current face 代わりの preview を表示します。</p>
        </div>
      </div>
      <div class="timeline-controls live-controls" aria-label="ライブ動画操作">
        <button class="small-button" type="button" data-action="live-play">再生</button>
        <button class="small-button" type="button" data-action="live-pause">一時停止</button>
        <button class="small-button" type="button" data-action="live-analyze-current">現在フレーム解析</button>
        <label class="range-field">
          <span>シーク</span>
          <input type="range" min="0" step="0.001" value="0" data-range="live" />
        </label>
        <p class="frame-status" data-status="live-time">current time: - / -</p>
      </div>
      <div class="review-card" data-live-analysis>
        <p>ライブ動画の current frame 解析結果はまだありません。</p>
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
  bindOverlayToggle("toggle-mesh-source", "showMeshSource")
  bindOverlayToggle("toggle-mesh-target", "showMeshTarget")
  bindOverlayToggle("toggle-mesh-pairs", "showMeshPairs")
  bindOverlayToggle("toggle-excluded-landmarks", "showExcludedLandmarks")
  bindOverlayToggle("toggle-grid-anchors", "showGridAnchors")
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
  getElement<HTMLButtonElement>('[data-action="live-analyze-current"]').addEventListener(
    "click",
    () => {
      void analyzeCurrentLiveFrame("manual")
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
    drawLiveOverlay()
    maybeAnalyzeLiveFrame("timeupdate")
    renderAll()
  })
  liveVideoElement.addEventListener("seeked", () => {
    syncCurrentTime("live")
    void analyzeCurrentLiveFrame("seeked")
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
    if (state.liveVideo.loaded) {
      void analyzeCurrentLiveFrame("pause")
    }
    renderAll()
  })
  liveVideoElement.addEventListener("ended", () => {
    state.liveVideo.playbackStatus = "stopped"
    if (state.liveVideo.loaded) {
      void analyzeCurrentLiveFrame("ended")
    }
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

  window.addEventListener("resize", drawAllOverlays)
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
    resetLiveAnalysisResults()
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
  disposeModelFaceLandmarker("uninitialized")
  resetModelTimestamp()
  updateScanCounters()
  addLog("モデル動画解析を開始します。")
  renderAll()

  try {
    const detector = await getModelFaceLandmarker()
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
    state.modelScan.mediaPipeStatus = "scanning"
    renderAll()

    for (let frameIndex = 0; frameIndex < plannedFrames; frameIndex += 1) {
      const timeSec = Math.min(frameIndex * state.modelScan.scanFrameStepSec, durationSec)
      await seekVideoElement(modelVideoElement, timeSec)
      const result = detector.detectForVideo(modelVideoElement, nextModelTimestampMs())
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
    updateTop1Match()
    disposeModelFaceLandmarker("disposed")
    addLog(
      `モデル動画解析が完了しました。accepted ${state.modelScan.acceptedFrames} / excluded ${state.modelScan.excludedFrames}`,
    )
    await seekToCurrentAcceptedFrame()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    state.modelScan.scanStatus = "error"
    state.modelVideo.scanStatus = "error"
    state.modelScan.mediaPipeStatus = "error"
    state.modelScan.lastError = message
    disposeModelFaceLandmarker("error")
    addLog(`モデル動画解析でエラーが発生しました: ${message}`)
  }

  updateScanCounters()
  renderAll()
}

async function getModelFaceLandmarker() {
  if (modelFaceLandmarker) {
    return modelFaceLandmarker
  }

  if (modelFaceLandmarkerPromise) {
    return modelFaceLandmarkerPromise
  }

  state.modelScan.mediaPipeStatus = "initializing"
  state.modelScan.mediaPipeError = null
  resetModelTimestamp()
  renderAll()

  modelFaceLandmarkerPromise = initializeFaceLandmarker()
  try {
    modelFaceLandmarker = await modelFaceLandmarkerPromise
    state.modelScan.mediaPipeStatus = "ready"
    return modelFaceLandmarker
  } catch (error) {
    state.modelScan.mediaPipeStatus = "error"
    state.modelScan.mediaPipeError = error instanceof Error ? error.message : String(error)
    throw error
  } finally {
    modelFaceLandmarkerPromise = null
    renderAll()
  }
}

async function getLiveFaceLandmarker() {
  if (liveFaceLandmarker) {
    return liveFaceLandmarker
  }

  if (liveFaceLandmarkerPromise) {
    return liveFaceLandmarkerPromise
  }

  state.liveMediaPipe.status = "initializing"
  state.liveMediaPipe.error = null
  resetLiveTimestamp()
  renderAll()

  liveFaceLandmarkerPromise = initializeFaceLandmarker()
  try {
    liveFaceLandmarker = await liveFaceLandmarkerPromise
    state.liveMediaPipe.status = "ready"
    return liveFaceLandmarker
  } catch (error) {
    state.liveMediaPipe.status = "error"
    state.liveMediaPipe.error = error instanceof Error ? error.message : String(error)
    throw error
  } finally {
    liveFaceLandmarkerPromise = null
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

function buildCurrentLiveFrameAnalysis(
  result: FaceLandmarkerResultLike,
  timeSec: number,
): CurrentLiveFrameAnalysis {
  const landmarks = result.faceLandmarks[0] ?? []
  const blendshapes = (result.faceBlendshapes[0]?.categories ?? []).map((category) => ({
    categoryName: category.categoryName,
    score: category.score,
  }))
  const matrix = result.facialTransformationMatrixes[0]
  const hasFace = result.faceLandmarks.length > 0
  const validLandmarks = landmarks.length === REQUIRED_LANDMARK_COUNT
  const error = !hasFace ? "noFace" : validLandmarks ? null : "invalidLandmarks"

  return {
    analyzed: true,
    timeSec,
    landmarks478: validLandmarks ? mapLandmarks(landmarks) : [],
    pose: estimateNullablePose(matrix),
    blendshapes,
    expressionGroup: validLandmarks ? classifyExpressionGroup(blendshapes) : "unknown",
    qualityScore: validLandmarks ? 1 : 0,
    error,
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

function updateTop1Match() {
  const current = state.currentLiveFrameAnalysis
  if (!current.analyzed) {
    state.top1Match = {
      ...createEmptyTop1Match(),
      error: "currentNotAnalyzed",
    }
    updateCurrentIdealMeshPrototype()
    return
  }

  if (current.error || current.landmarks478.length !== REQUIRED_LANDMARK_COUNT) {
    state.top1Match = {
      ...createEmptyTop1Match(),
      currentExpressionGroup: current.expressionGroup,
      error: `current analysis failed / matching skipped: ${current.error ?? "invalidCurrentLandmarks"}`,
    }
    updateCurrentIdealMeshPrototype()
    return
  }

  const candidates = getAcceptedFrames().filter(
    (frame) => frame.landmarks478.length === REQUIRED_LANDMARK_COUNT,
  )
  if (candidates.length === 0) {
    state.top1Match = {
      ...createEmptyTop1Match(),
      currentExpressionGroup: current.expressionGroup,
      error: "noReferenceFrames",
    }
    updateCurrentIdealMeshPrototype()
    return
  }

  let best: {
    frame: IdealReferenceFrame
    poseDistance: number
    expressionDistance: number
    qualityPenalty: number
    matchScore: number
  } | null = null

  for (const frame of candidates) {
    const poseDistance = calculatePoseDistance(current.pose, frame.pose)
    const expressionDistance = calculateExpressionDistance(
      current.blendshapes,
      frame.blendshapes,
    )
    const qualityPenalty = Math.max(0, 1 - frame.qualityScore)
    const matchScore =
      poseDistance * POSE_WEIGHT +
      expressionDistance * EXPRESSION_WEIGHT +
      qualityPenalty * QUALITY_WEIGHT

    if (!best || matchScore < best.matchScore) {
      best = {
        frame,
        poseDistance,
        expressionDistance,
        qualityPenalty,
        matchScore,
      }
    }
  }

  if (!best) {
    state.top1Match = {
      ...createEmptyTop1Match(),
      currentExpressionGroup: current.expressionGroup,
      error: "noReferenceFrames",
    }
    updateCurrentIdealMeshPrototype()
    return
  }

  state.top1Match = {
    matched: true,
    idealFrameId: best.frame.frameId,
    idealFrameIndex: best.frame.frameIndex,
    idealTimeSec: best.frame.timeSec,
    matchScore: best.matchScore,
    poseDistance: best.poseDistance,
    expressionDistance: best.expressionDistance,
    qualityPenalty: best.qualityPenalty,
    currentExpressionGroup: current.expressionGroup,
    idealExpressionGroup: best.frame.expressionGroup,
    error: null,
  }
  updateCurrentIdealMeshPrototype()
}

function updateCurrentIdealMeshPrototype() {
  const current = state.currentLiveFrameAnalysis
  const idealFrame = getMatchedIdealFrame()

  if (
    current.error ||
    current.landmarks478.length !== REQUIRED_LANDMARK_COUNT ||
    !idealFrame ||
    idealFrame.landmarks478.length !== REQUIRED_LANDMARK_COUNT
  ) {
    state.currentIdealMeshPrototype = {
      ...createEmptyCurrentIdealMeshPrototype(),
      summary: {
        ...createEmptyMeshPrototypeSummary(),
        top1MatchedReferenceId: state.top1Match.idealFrameId,
        currentLandmarkCount: current.landmarks478.length,
      },
    }
    return
  }

  const candidateAlignedIdealLandmarks = alignIdealLandmarksToCurrentFace(
    idealFrame.landmarks478,
    current.landmarks478,
  )
  const { acceptedCurrentLandmarks, excludedCurrentLandmarks } =
    selectCurrentMeshLandmarkVertices(current, candidateAlignedIdealLandmarks)
  const currentMeshSourceVertices = buildCurrentMeshSourceVertices(
    acceptedCurrentLandmarks,
    current.landmarks478,
  )
  const { idealMeshTargetVertices, currentIdealMeshPairs } = buildIdealMeshTargetVertices(
    currentMeshSourceVertices,
    candidateAlignedIdealLandmarks,
  )
  const summary = summarizeCurrentIdealMeshPrototype({
    currentLandmarkCount: current.landmarks478.length,
    top1MatchedReferenceId: state.top1Match.idealFrameId,
    candidateAlignedIdealLandmarkCount: candidateAlignedIdealLandmarks.length,
    acceptedCurrentLandmarks,
    excludedCurrentLandmarks,
    currentMeshSourceVertices,
    currentIdealMeshPairs,
  })

  state.currentIdealMeshPrototype = {
    candidateAlignedIdealLandmarks,
    acceptedCurrentLandmarks,
    excludedCurrentLandmarks,
    currentMeshSourceVertices,
    idealMeshTargetVertices,
    currentIdealMeshPairs,
    summary,
  }
}

function alignIdealLandmarksToCurrentFace(
  idealLandmarks: ReferenceLandmark[],
  currentLandmarks: ReferenceLandmark[],
): ReferenceLandmark[] {
  const idealBounds = getLandmarkBounds(idealLandmarks)
  const currentBounds = getLandmarkBounds(currentLandmarks)
  const idealCenter = getRectCenter(idealBounds)
  const currentCenter = getRectCenter(currentBounds)
  const widthScale = idealBounds.width > 0 ? currentBounds.width / idealBounds.width : 1
  const heightScale = idealBounds.height > 0 ? currentBounds.height / idealBounds.height : 1
  const uniformScale = Number.isFinite(widthScale + heightScale)
    ? Math.min(widthScale, heightScale)
    : 1

  return idealLandmarks.map((landmark) => ({
    index: landmark.index,
    x: currentCenter.x + (landmark.x - idealCenter.x) * uniformScale,
    y: currentCenter.y + (landmark.y - idealCenter.y) * uniformScale,
    z: landmark.z * uniformScale,
  }))
}

function selectCurrentMeshLandmarkVertices(
  current: CurrentLiveFrameAnalysis,
  candidateAlignedIdealLandmarks: ReferenceLandmark[],
) {
  const bounds = getLandmarkBounds(current.landmarks478)
  const center = getRectCenter(bounds)
  const acceptedCurrentLandmarks: CurrentMeshLandmarkVertex[] = []
  const excludedCurrentLandmarks: CurrentMeshLandmarkVertex[] = []
  const blendshapeScores = getBlendshapeScoreMap(current.blendshapes)
  const mouthActivity = Math.max(
    getScore(blendshapeScores, "jawOpen"),
    getScore(blendshapeScores, "mouthPucker"),
    averageScores(blendshapeScores, "mouthSmileLeft", "mouthSmileRight"),
  )
  const eyeActivity = Math.max(
    averageScores(blendshapeScores, "eyeBlinkLeft", "eyeBlinkRight"),
    averageScores(blendshapeScores, "eyeSquintLeft", "eyeSquintRight"),
  )

  for (const landmark of current.landmarks478) {
    const reasons: string[] = []
    let visibilityWeight = 1
    let safetyWeight = 1

    if (!isValidNormalizedPoint(landmark)) {
      excludedCurrentLandmarks.push({
        id: `face:${landmark.index}`,
        kind: "faceLandmark",
        index: landmark.index,
        source: { x: landmark.x, y: landmark.y },
        visibilityWeight: 0,
        safetyWeight: 0,
        usageWeight: 0,
        reasons: ["invalidExcluded"],
      })
      continue
    }

    if (FACE_BOUNDARY_LANDMARK_INDICES.has(landmark.index)) {
      safetyWeight *= FACE_BOUNDARY_USAGE_MULTIPLIER
      reasons.push("boundarySuppressed")
    }

    if (isPoseHiddenSideLandmark(landmark, center, current.pose)) {
      visibilityWeight *= HIDDEN_SIDE_USAGE_MULTIPLIER
      reasons.push("boundarySuppressed")
    }

    if (mouthActivity >= MIXED_EXPRESSION_THRESHOLD && MOUTH_LANDMARK_INDICES.has(landmark.index)) {
      safetyWeight *= EXPRESSION_REGION_USAGE_MULTIPLIER
      reasons.push("mouthSuppressed")
    }

    if (eyeActivity >= MIXED_EXPRESSION_THRESHOLD && EYE_LANDMARK_INDICES.has(landmark.index)) {
      safetyWeight *= EXPRESSION_REGION_USAGE_MULTIPLIER
      reasons.push("eyeSuppressed")
    }

    const candidate = candidateAlignedIdealLandmarks[landmark.index]
    if (candidate && isValidPoint(candidate)) {
      const distance = Math.hypot(candidate.x - landmark.x, candidate.y - landmark.y)
      if (distance > LARGE_DISPLACEMENT_THRESHOLD) {
        safetyWeight *= LARGE_DISPLACEMENT_USAGE_MULTIPLIER
        reasons.push("largeDisplacementSuppressed")
      }
    }

    const usageWeight = clamp(visibilityWeight * safetyWeight, 0, 1)
    const vertex: CurrentMeshLandmarkVertex = {
      id: `face:${landmark.index}`,
      kind: "faceLandmark",
      index: landmark.index,
      source: { x: landmark.x, y: landmark.y },
      visibilityWeight,
      safetyWeight,
      usageWeight: usageWeight <= EXCLUDE_USAGE_WEIGHT_THRESHOLD ? 0 : usageWeight,
      reasons: reasons.length > 0 ? uniqueStrings(reasons) : ["visibleSafe"],
    }

    if (usageWeight <= EXCLUDE_USAGE_WEIGHT_THRESHOLD) {
      excludedCurrentLandmarks.push({
        ...vertex,
        usageWeight: 0,
        reasons: uniqueStrings([...vertex.reasons, "usageWeightExcluded"]),
      })
    } else {
      acceptedCurrentLandmarks.push(vertex)
    }
  }

  return { acceptedCurrentLandmarks, excludedCurrentLandmarks }
}

function buildCurrentMeshSourceVertices(
  acceptedCurrentLandmarks: CurrentMeshLandmarkVertex[],
  currentLandmarks: ReferenceLandmark[],
): MeshSourceVertex[] {
  const faceVertices: MeshSourceVertex[] = acceptedCurrentLandmarks.map((landmark) => ({
    id: landmark.id,
    kind: "faceLandmark",
    index: landmark.index,
    x: landmark.source.x,
    y: landmark.source.y,
    weight: landmark.usageWeight,
    reasons: landmark.reasons,
  }))
  const faceBounds = getLandmarkBounds(currentLandmarks)
  const nearFaceGrid = buildNearFaceGridVertices(faceBounds)
  const backgroundGrid = buildBackgroundGridVertices(faceBounds)
  const screenEdgeAnchors = buildScreenEdgeAnchorVertices()

  return [...faceVertices, ...nearFaceGrid, ...backgroundGrid, ...screenEdgeAnchors]
}

function buildIdealMeshTargetVertices(
  currentMeshSourceVertices: MeshSourceVertex[],
  candidateAlignedIdealLandmarks: ReferenceLandmark[],
) {
  const idealMeshTargetVertices: MeshTargetVertex[] = []
  const currentIdealMeshPairs: MeshVertexPair[] = []

  for (const sourceVertex of currentMeshSourceVertices) {
    let target = { x: sourceVertex.x, y: sourceVertex.y }
    let usageWeight = 0

    if (sourceVertex.kind === "faceLandmark" && sourceVertex.index !== undefined) {
      const candidate = candidateAlignedIdealLandmarks[sourceVertex.index]
      usageWeight = sourceVertex.weight
      if (candidate && isValidPoint(candidate)) {
        target = lerpPoint({ x: sourceVertex.x, y: sourceVertex.y }, candidate, usageWeight)
      }
    }

    idealMeshTargetVertices.push({
      id: sourceVertex.id,
      kind: sourceVertex.kind,
      index: sourceVertex.index,
      x: target.x,
      y: target.y,
      weight: usageWeight,
      reasons: sourceVertex.kind === "faceLandmark" ? sourceVertex.reasons : ["fixedGridAnchor"],
    })
    currentIdealMeshPairs.push({
      id: sourceVertex.id,
      kind: sourceVertex.kind,
      index: sourceVertex.index,
      source: { x: sourceVertex.x, y: sourceVertex.y },
      target,
      usageWeight,
      reasons: sourceVertex.kind === "faceLandmark" ? sourceVertex.reasons : ["fixedGridAnchor"],
    })
  }

  return { idealMeshTargetVertices, currentIdealMeshPairs }
}

function buildNearFaceGridVertices(faceBounds: Rect): MeshSourceVertex[] {
  const expanded = expandRect(faceBounds, 0.12)
  const vertices: MeshSourceVertex[] = []

  for (let yIndex = 0; yIndex < NEAR_FACE_GRID_STEPS; yIndex += 1) {
    for (let xIndex = 0; xIndex < NEAR_FACE_GRID_STEPS; xIndex += 1) {
      const isPerimeter =
        xIndex === 0 ||
        yIndex === 0 ||
        xIndex === NEAR_FACE_GRID_STEPS - 1 ||
        yIndex === NEAR_FACE_GRID_STEPS - 1
      if (!isPerimeter) {
        continue
      }

      const x = interpolate(expanded.x, expanded.x + expanded.width, xIndex / (NEAR_FACE_GRID_STEPS - 1))
      const y = interpolate(expanded.y, expanded.y + expanded.height, yIndex / (NEAR_FACE_GRID_STEPS - 1))
      vertices.push({
        id: `grid:near:${vertices.length}`,
        kind: "nearFaceGrid",
        x: clamp(x, 0, 1),
        y: clamp(y, 0, 1),
        weight: 0,
        reasons: ["fixedGridAnchor"],
      })
    }
  }

  return vertices
}

function buildBackgroundGridVertices(faceBounds: Rect): MeshSourceVertex[] {
  const expandedFaceBounds = expandRect(faceBounds, 0.18)
  const vertices: MeshSourceVertex[] = []

  for (let yIndex = 0; yIndex < BACKGROUND_GRID_STEPS; yIndex += 1) {
    for (let xIndex = 0; xIndex < BACKGROUND_GRID_STEPS; xIndex += 1) {
      const x = xIndex / (BACKGROUND_GRID_STEPS - 1)
      const y = yIndex / (BACKGROUND_GRID_STEPS - 1)
      if (isPointInsideRect({ x, y }, expandedFaceBounds)) {
        continue
      }

      vertices.push({
        id: `grid:background:${vertices.length}`,
        kind: "backgroundGrid",
        x,
        y,
        weight: 0,
        reasons: ["fixedGridAnchor"],
      })
    }
  }

  return vertices
}

function buildScreenEdgeAnchorVertices(): MeshSourceVertex[] {
  return [
    { x: 0, y: 0 },
    { x: 0.5, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 0.5 },
    { x: 1, y: 0.5 },
    { x: 0, y: 1 },
    { x: 0.5, y: 1 },
    { x: 1, y: 1 },
  ].map((point, index) => ({
    id: `anchor:screen:${index}`,
    kind: "screenEdgeAnchor",
    x: point.x,
    y: point.y,
    weight: 0,
    reasons: ["fixedGridAnchor"],
  }))
}

function summarizeCurrentIdealMeshPrototype({
  currentLandmarkCount,
  top1MatchedReferenceId,
  candidateAlignedIdealLandmarkCount,
  acceptedCurrentLandmarks,
  excludedCurrentLandmarks,
  currentMeshSourceVertices,
  currentIdealMeshPairs,
}: {
  currentLandmarkCount: number
  top1MatchedReferenceId: string | null
  candidateAlignedIdealLandmarkCount: number
  acceptedCurrentLandmarks: CurrentMeshLandmarkVertex[]
  excludedCurrentLandmarks: CurrentMeshLandmarkVertex[]
  currentMeshSourceVertices: MeshSourceVertex[]
  currentIdealMeshPairs: MeshVertexPair[]
}): MeshPrototypeSummary {
  const usageWeights = currentIdealMeshPairs.map((pair) => pair.usageWeight)
  const allLandmarkVertices = [...acceptedCurrentLandmarks, ...excludedCurrentLandmarks]

  return {
    top1MatchedReferenceId,
    currentLandmarkCount,
    candidateAlignedIdealLandmarkCount,
    visibleCurrentLandmarkCount: acceptedCurrentLandmarks.length,
    excludedCurrentLandmarkCount: excludedCurrentLandmarks.length,
    faceSourceVertexCount: countVerticesByKind(currentMeshSourceVertices, "faceLandmark"),
    nearFaceGridCount: countVerticesByKind(currentMeshSourceVertices, "nearFaceGrid"),
    backgroundGridCount: countVerticesByKind(currentMeshSourceVertices, "backgroundGrid"),
    screenEdgeAnchorCount: countVerticesByKind(currentMeshSourceVertices, "screenEdgeAnchor"),
    meshPairCount: currentIdealMeshPairs.length,
    usageWeightAverage: usageWeights.length > 0 ? averageNumbers(usageWeights) : null,
    usageWeightMin: usageWeights.length > 0 ? Math.min(...usageWeights) : null,
    usageWeightMax: usageWeights.length > 0 ? Math.max(...usageWeights) : null,
    boundarySuppressedCount: countVerticesWithReason(allLandmarkVertices, "boundarySuppressed"),
    mouthSuppressedCount: countVerticesWithReason(allLandmarkVertices, "mouthSuppressed"),
    eyeSuppressedCount: countVerticesWithReason(allLandmarkVertices, "eyeSuppressed"),
    largeDisplacementSuppressedCount: countVerticesWithReason(
      allLandmarkVertices,
      "largeDisplacementSuppressed",
    ),
    invalidExcludedCount: countVerticesWithReason(excludedCurrentLandmarks, "invalidExcluded"),
  }
}

function calculatePoseDistance(current: ReferencePose, ideal: ReferencePose) {
  if (
    current.yaw === null ||
    current.pitch === null ||
    current.roll === null ||
    ideal.yaw === null ||
    ideal.pitch === null ||
    ideal.roll === null
  ) {
    return POSE_MISSING_PENALTY
  }

  const yawDiff = current.yaw - ideal.yaw
  const pitchDiff = current.pitch - ideal.pitch
  const rollDiff = current.roll - ideal.roll
  return yawDiff * yawDiff + pitchDiff * pitchDiff + rollDiff * rollDiff
}

function calculateExpressionDistance(
  currentBlendshapes: ReferenceBlendshape[],
  idealBlendshapes: ReferenceBlendshape[],
) {
  const currentScores = getBlendshapeScoreMap(currentBlendshapes)
  const idealScores = getBlendshapeScoreMap(idealBlendshapes)
  const currentSmile = averageScores(currentScores, "mouthSmileLeft", "mouthSmileRight")
  const idealSmile = averageScores(idealScores, "mouthSmileLeft", "mouthSmileRight")
  const currentBlink = averageScores(currentScores, "eyeBlinkLeft", "eyeBlinkRight")
  const idealBlink = averageScores(idealScores, "eyeBlinkLeft", "eyeBlinkRight")
  const currentSquint = averageScores(currentScores, "eyeSquintLeft", "eyeSquintRight")
  const idealSquint = averageScores(idealScores, "eyeSquintLeft", "eyeSquintRight")
  const diffs = [
    getScore(currentScores, "jawOpen") - getScore(idealScores, "jawOpen"),
    currentSmile - idealSmile,
    getScore(currentScores, "mouthPucker") - getScore(idealScores, "mouthPucker"),
    currentBlink - idealBlink,
    currentSquint - idealSquint,
  ]

  return diffs.reduce((sum, diff) => sum + diff * diff, 0)
}

function getBlendshapeScoreMap(blendshapes: ReferenceBlendshape[]) {
  return new Map(blendshapes.map((item) => [item.categoryName, item.score]))
}

function getScore(scores: Map<string, number>, key: string) {
  return scores.get(key) ?? 0
}

function averageScores(scores: Map<string, number>, leftKey: string, rightKey: string) {
  return (getScore(scores, leftKey) + getScore(scores, rightKey)) / 2
}

function getLandmarkBounds(landmarks: Array<{ x: number; y: number }>): Rect {
  const validPoints = landmarks.filter(isValidPoint)
  if (validPoints.length === 0) {
    return {
      x: 0.35,
      y: 0.25,
      width: 0.3,
      height: 0.5,
    }
  }

  const xs = validPoints.map((point) => point.x)
  const ys = validPoints.map((point) => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  return {
    x: minX,
    y: minY,
    width: Math.max(0.001, maxX - minX),
    height: Math.max(0.001, maxY - minY),
  }
}

function getRectCenter(rect: Rect): Point2D {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  }
}

function expandRect(rect: Rect, margin: number): Rect {
  return {
    x: clamp(rect.x - margin, 0, 1),
    y: clamp(rect.y - margin, 0, 1),
    width: clamp(rect.width + margin * 2, 0, 1),
    height: clamp(rect.height + margin * 2, 0, 1),
  }
}

function isPointInsideRect(point: Point2D, rect: Rect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}

function isValidPoint(point: { x: number; y: number }) {
  return Number.isFinite(point.x) && Number.isFinite(point.y)
}

function isValidNormalizedPoint(point: { x: number; y: number }) {
  return isValidPoint(point) && point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1
}

function isPoseHiddenSideLandmark(
  landmark: ReferenceLandmark,
  center: Point2D,
  pose: ReferencePose,
) {
  if (pose.yaw === null || Math.abs(pose.yaw) < HIDDEN_SIDE_YAW_THRESHOLD_DEG) {
    return false
  }

  const leftSide = landmark.x < center.x - 0.08
  const rightSide = landmark.x > center.x + 0.08
  return pose.yaw > 0 ? leftSide : rightSide
}

function lerpPoint(source: Point2D, target: Point2D, amount: number): Point2D {
  return {
    x: interpolate(source.x, target.x, amount),
    y: interpolate(source.y, target.y, amount),
  }
}

function interpolate(start: number, end: number, amount: number) {
  return start + (end - start) * amount
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values))
}

function countVerticesByKind(vertices: MeshSourceVertex[], kind: MeshVertexKind) {
  return vertices.filter((vertex) => vertex.kind === kind).length
}

function countVerticesWithReason(
  vertices: Array<{ reasons: string[] }>,
  reason: string,
) {
  return vertices.filter((vertex) => vertex.reasons.includes(reason)).length
}

function averageNumbers(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function getMissingBlendshapeKeys(blendshapes: ReferenceBlendshape[]) {
  const scores = getBlendshapeScoreMap(blendshapes)
  return MATCH_BLENDSHAPE_KEYS.filter((key) => !scores.has(key))
}

function handleExportLog() {
  addLog("現在の state summary を console に出力しました。")
  console.info("Ideal Reference Mesh Warp Lab state", getRawState())
  renderAll()
}

async function analyzeCurrentLiveFrame(reason: "manual" | "timeupdate" | "seeked" | "pause" | "ended") {
  if (!state.liveVideo.loaded || liveAnalysisInProgress) {
    return
  }

  const requestId = liveAnalysisRequestId + 1
  liveAnalysisRequestId = requestId
  liveAnalysisInProgress = true
  renderAll()

  try {
    const detector = await getLiveFaceLandmarker()
    if (requestId !== liveAnalysisRequestId) {
      return
    }

    const timeSec = liveVideoElement.currentTime || state.liveVideo.currentTimeSec
    const result = detector.detectForVideo(liveVideoElement, nextLiveTimestampMs())
    state.currentLiveFrameAnalysis = buildCurrentLiveFrameAnalysis(result, timeSec)
    lastAutoLiveAnalysisAtSec = timeSec
    updateTop1Match()

    if (reason === "manual") {
      addLog(
        state.currentLiveFrameAnalysis.error
          ? `ライブ動画 current frame 解析で ${state.currentLiveFrameAnalysis.error} を検出しました。`
          : "ライブ動画 current frame を解析しました。",
      )
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    state.currentLiveFrameAnalysis = {
      ...createEmptyCurrentLiveFrameAnalysis(),
      analyzed: true,
      timeSec: state.liveVideo.currentTimeSec,
      error: `MediaPipe error: ${message}`,
    }
    state.liveMediaPipe.status = "error"
    state.liveMediaPipe.error = message
    disposeLiveFaceLandmarker("error")
    state.top1Match = {
      ...createEmptyTop1Match(),
      error: `current analysis failed / matching skipped: ${state.currentLiveFrameAnalysis.error}`,
    }
    updateCurrentIdealMeshPrototype()
    addLog(`ライブ動画 current frame 解析でエラーが発生しました: ${message}`)
  } finally {
    liveAnalysisInProgress = false
    renderAll()
  }
}

function maybeAnalyzeLiveFrame(reason: "timeupdate") {
  if (
    !state.liveVideo.loaded ||
    state.liveVideo.playbackStatus !== "playing" ||
    liveAnalysisInProgress
  ) {
    return
  }

  const currentTimeSec = liveVideoElement.currentTime || state.liveVideo.currentTimeSec
  if (currentTimeSec - lastAutoLiveAnalysisAtSec < LIVE_AUTO_ANALYSIS_INTERVAL_SEC) {
    return
  }

  void analyzeCurrentLiveFrame(reason)
}

function handleToggleLandmarks478(checked: boolean) {
  state.overlay.showLandmarks478 = checked
  addLog(`478点 overlay 表示を ${checked ? "ON" : "OFF"} にしました。`)
  drawAllOverlays()
  renderAll()
}

function bindOverlayToggle(
  action: string,
  key: Exclude<keyof LabState["overlay"], "showLandmarks478">,
) {
  getElement<HTMLInputElement>(`[data-action="${action}"]`).addEventListener(
    "change",
    (event) => {
      state.overlay[key] = event.currentTarget.checked
      drawAllOverlays()
      renderAll()
    },
  )
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
  disposeModelFaceLandmarker("uninitialized")
  resetModelTimestamp()
  state.rawIdealReferenceFrames = []
  state.currentAcceptedReviewIndex = null
  state.top1Match = createEmptyTop1Match()
  state.currentIdealMeshPrototype = createEmptyCurrentIdealMeshPrototype()
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

function resetLiveAnalysisResults() {
  disposeLiveFaceLandmarker("uninitialized")
  resetLiveTimestamp()
  state.currentLiveFrameAnalysis = createEmptyCurrentLiveFrameAnalysis()
  state.top1Match = createEmptyTop1Match()
  state.currentIdealMeshPrototype = createEmptyCurrentIdealMeshPrototype()
  liveAnalysisRequestId += 1
  liveAnalysisInProgress = false
  lastAutoLiveAnalysisAtSec = Number.NEGATIVE_INFINITY
  clearLiveOverlay()
}

function disposeModelFaceLandmarker(nextStatus: MediaPipeStatus = "disposed") {
  modelFaceLandmarker?.close()
  modelFaceLandmarker = null
  modelFaceLandmarkerPromise = null
  state.modelScan.mediaPipeStatus = nextStatus
}

function disposeLiveFaceLandmarker(nextStatus: MediaPipeStatus = "disposed") {
  liveFaceLandmarker?.close()
  liveFaceLandmarker = null
  liveFaceLandmarkerPromise = null
  state.liveMediaPipe.status = nextStatus
}

function resetModelTimestamp() {
  state.modelScan.modelTimestampMs = 0
}

function resetLiveTimestamp() {
  state.liveMediaPipe.liveTimestampMs = 0
}

function nextModelTimestampMs() {
  state.modelScan.modelTimestampMs += MEDIAPIPE_TIMESTAMP_STEP_MS
  return state.modelScan.modelTimestampMs
}

function nextLiveTimestampMs() {
  state.liveMediaPipe.liveTimestampMs += MEDIAPIPE_TIMESTAMP_STEP_MS
  return state.liveMediaPipe.liveTimestampMs
}

function createEmptyCurrentLiveFrameAnalysis(): CurrentLiveFrameAnalysis {
  return {
    analyzed: false,
    timeSec: null,
    landmarks478: [],
    pose: {
      yaw: null,
      pitch: null,
      roll: null,
    },
    blendshapes: [],
    expressionGroup: "unknown",
    qualityScore: 0,
    error: null,
  }
}

function createEmptyTop1Match(): ReferenceMatchResult {
  return {
    matched: false,
    idealFrameId: null,
    idealFrameIndex: null,
    idealTimeSec: null,
    matchScore: null,
    poseDistance: null,
    expressionDistance: null,
    qualityPenalty: null,
    currentExpressionGroup: null,
    idealExpressionGroup: null,
    error: null,
  }
}

function createEmptyMeshPrototypeSummary(): MeshPrototypeSummary {
  return {
    top1MatchedReferenceId: null,
    currentLandmarkCount: 0,
    candidateAlignedIdealLandmarkCount: 0,
    visibleCurrentLandmarkCount: 0,
    excludedCurrentLandmarkCount: 0,
    faceSourceVertexCount: 0,
    nearFaceGridCount: 0,
    backgroundGridCount: 0,
    screenEdgeAnchorCount: 0,
    meshPairCount: 0,
    usageWeightAverage: null,
    usageWeightMin: null,
    usageWeightMax: null,
    boundarySuppressedCount: 0,
    mouthSuppressedCount: 0,
    eyeSuppressedCount: 0,
    largeDisplacementSuppressedCount: 0,
    invalidExcludedCount: 0,
  }
}

function createEmptyCurrentIdealMeshPrototype(): CurrentIdealMeshPrototypeState {
  return {
    candidateAlignedIdealLandmarks: [],
    acceptedCurrentLandmarks: [],
    excludedCurrentLandmarks: [],
    currentMeshSourceVertices: [],
    idealMeshTargetVertices: [],
    currentIdealMeshPairs: [],
    summary: createEmptyMeshPrototypeSummary(),
  }
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
  drawAllOverlays()
  renderDebugContent()
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
  setDisabled('[data-action="live-analyze-current"]', !liveLoaded || liveAnalysisInProgress)
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
  getElement<HTMLInputElement>('[data-action="toggle-mesh-source"]').checked =
    state.overlay.showMeshSource
  getElement<HTMLInputElement>('[data-action="toggle-mesh-target"]').checked =
    state.overlay.showMeshTarget
  getElement<HTMLInputElement>('[data-action="toggle-mesh-pairs"]').checked =
    state.overlay.showMeshPairs
  getElement<HTMLInputElement>('[data-action="toggle-excluded-landmarks"]').checked =
    state.overlay.showExcludedLandmarks
  getElement<HTMLInputElement>('[data-action="toggle-grid-anchors"]').checked =
    state.overlay.showGridAnchors
  renderModelReviewCard()
  renderLiveAnalysisCard()
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

function renderLiveAnalysisCard() {
  const card = getElement<HTMLElement>("[data-live-analysis]")
  const analysis = state.currentLiveFrameAnalysis
  const match = state.top1Match

  if (!analysis.analyzed) {
    card.innerHTML = `<p>ライブ動画の current frame 解析結果はまだありません。</p>`
    return
  }

  card.innerHTML = `
    <dl class="review-grid">
      <div><dt>timeSec</dt><dd>${formatSeconds(analysis.timeSec)} sec</dd></div>
      <div><dt>landmarks</dt><dd>${analysis.landmarks478.length}</dd></div>
      <div><dt>pose</dt><dd>${escapeHtml(formatPose(analysis.pose))}</dd></div>
      <div><dt>expressionGroup</dt><dd>${analysis.expressionGroup}</dd></div>
      <div><dt>qualityScore</dt><dd>${formatSeconds(analysis.qualityScore)}</dd></div>
      <div><dt>error</dt><dd>${escapeHtml(analysis.error ?? "-")}</dd></div>
      <div><dt>top1</dt><dd>${escapeHtml(match.idealFrameId ?? "-")}</dd></div>
      <div><dt>matchScore</dt><dd>${formatSeconds(match.matchScore)}</dd></div>
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

  if (state.activeDebugTab === "matching") {
    content.appendChild(createMatchingContent())
    return
  }

  if (state.activeDebugTab === "warpMesh") {
    content.appendChild(createMeshPrototypeContent())
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
  const meshSummary = state.currentIdealMeshPrototype.summary

  const items: Array<[string, string]> = [
    ["Model MediaPipe", state.modelScan.mediaPipeStatus],
    ["Live MediaPipe", state.liveMediaPipe.status],
    ["modelTimestampMs", formatSeconds(state.modelScan.modelTimestampMs)],
    ["liveTimestampMs", formatSeconds(state.liveMediaPipe.liveTimestampMs)],
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
    ["Live current analysis", formatLiveAnalysisStatus()],
    ["Live current expression", state.currentLiveFrameAnalysis.analyzed ? state.currentLiveFrameAnalysis.expressionGroup : "-"],
    ["Top1 reference", state.top1Match.idealFrameId ?? "none"],
    ["Match score", formatSeconds(state.top1Match.matchScore)],
    ["Pose distance", formatSeconds(state.top1Match.poseDistance)],
    ["Expression distance", formatSeconds(state.top1Match.expressionDistance)],
    ["top1MatchedReferenceId", meshSummary.top1MatchedReferenceId ?? "-"],
    ["currentLandmarkCount", String(meshSummary.currentLandmarkCount)],
    ["visibleCurrentLandmarkCount", String(meshSummary.visibleCurrentLandmarkCount)],
    ["excludedCurrentLandmarkCount", String(meshSummary.excludedCurrentLandmarkCount)],
    ["faceSourceVertexCount", String(meshSummary.faceSourceVertexCount)],
    ["nearFaceGridCount", String(meshSummary.nearFaceGridCount)],
    ["backgroundGridCount", String(meshSummary.backgroundGridCount)],
    ["screenEdgeAnchorCount", String(meshSummary.screenEdgeAnchorCount)],
    ["meshPairCount", String(meshSummary.meshPairCount)],
    [
      "usageWeight average / min / max",
      `${formatMetric(meshSummary.usageWeightAverage)} / ${formatMetric(meshSummary.usageWeightMin)} / ${formatMetric(meshSummary.usageWeightMax)}`,
    ],
    ["boundarySuppressedCount", String(meshSummary.boundarySuppressedCount)],
    ["mouthSuppressedCount", String(meshSummary.mouthSuppressedCount)],
    ["eyeSuppressedCount", String(meshSummary.eyeSuppressedCount)],
    [
      "largeDisplacementSuppressedCount",
      String(meshSummary.largeDisplacementSuppressedCount),
    ],
    ["invalidExcludedCount", String(meshSummary.invalidExcludedCount)],
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
    ["modelTimestampMs", formatSeconds(state.modelScan.modelTimestampMs)],
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

function createMatchingContent() {
  const fragment = document.createDocumentFragment()
  const acceptedFrames = getAcceptedFrames().filter(
    (frame) => frame.landmarks478.length === REQUIRED_LANDMARK_COUNT,
  )
  const current = state.currentLiveFrameAnalysis
  const match = state.top1Match
  const idealFrame = getMatchedIdealFrame()

  if (acceptedFrames.length === 0) {
    const message = document.createElement("p")
    message.className = "placeholder-text"
    message.textContent = "モデル動画を解析して raw ideal reference frames を作成してください。"
    fragment.appendChild(message)
  }

  if (!current.analyzed) {
    const message = document.createElement("p")
    message.className = "placeholder-text"
    message.textContent = "ライブ動画の current frame はまだ解析されていません。"
    fragment.appendChild(message)
  }

  const currentHeading = document.createElement("h3")
  currentHeading.textContent = "Current live frame"
  const currentList = document.createElement("dl")
  currentList.className = "summary-list"
  appendDefinitionItems(currentList, [
    ["Live MediaPipe status", state.liveMediaPipe.status],
    ["liveTimestampMs", formatSeconds(state.liveMediaPipe.liveTimestampMs)],
    ["analyzed", current.analyzed ? "yes" : "no"],
    ["timeSec", current.timeSec === null ? "-" : `${formatSeconds(current.timeSec)} sec`],
    ["pose yaw / pitch / roll", formatPose(current.pose)],
    ["expressionGroup", current.analyzed ? current.expressionGroup : "-"],
    ["qualityScore", formatSeconds(current.qualityScore)],
    ["landmarkCount", String(current.landmarks478.length)],
    ["missingBlendshapes", formatMissingBlendshapes(current.blendshapes)],
    ["error", current.error ?? "-"],
    ["matching", match.error?.includes("matching skipped") ? "skipped" : match.matched ? "matched" : "not matched"],
  ])

  const idealHeading = document.createElement("h3")
  idealHeading.textContent = "Top1 ideal reference"
  const idealList = document.createElement("dl")
  idealList.className = "summary-list"
  appendDefinitionItems(idealList, [
    ["matched", match.matched ? "yes" : "no"],
    ["frameId", match.idealFrameId ?? "-"],
    ["frameIndex", match.idealFrameIndex === null ? "-" : String(match.idealFrameIndex)],
    ["timeSec", match.idealTimeSec === null ? "-" : `${formatSeconds(match.idealTimeSec)} sec`],
    ["pose yaw / pitch / roll", idealFrame ? formatPose(idealFrame.pose) : "-"],
    ["expressionGroup", idealFrame?.expressionGroup ?? "-"],
    ["qualityScore", idealFrame ? formatSeconds(idealFrame.qualityScore) : "-"],
    ["missingBlendshapes", idealFrame ? formatMissingBlendshapes(idealFrame.blendshapes) : "-"],
    ["error", match.error ?? "-"],
  ])

  const scoreHeading = document.createElement("h3")
  scoreHeading.textContent = "Scores"
  const scoreList = document.createElement("dl")
  scoreList.className = "summary-list"
  appendDefinitionItems(scoreList, [
    ["matchScore", formatSeconds(match.matchScore)],
    ["poseDistance", formatSeconds(match.poseDistance)],
    ["expressionDistance", formatSeconds(match.expressionDistance)],
    ["qualityPenalty", formatSeconds(match.qualityPenalty)],
    ["pose unit", "degree squared"],
    ["weights", `pose ${POSE_WEIGHT} / expression ${EXPRESSION_WEIGHT} / quality ${QUALITY_WEIGHT}`],
  ])

  fragment.append(
    currentHeading,
    currentList,
    idealHeading,
    idealList,
    scoreHeading,
    scoreList,
  )
  return fragment
}

function createMeshPrototypeContent() {
  const fragment = document.createDocumentFragment()
  const mesh = state.currentIdealMeshPrototype
  const summary = mesh.summary

  const heading = document.createElement("h3")
  heading.textContent = "Warp Mesh"

  const status = document.createElement("p")
  status.className = "placeholder-text"
  status.textContent =
    "visible current landmarks + grid / anchors の mesh pair prototype を確認します。WebGL warp と raw displacement warp はまだ行いません。"

  const sourceHeading = document.createElement("h3")
  sourceHeading.textContent = "Current Mesh Source"
  const sourceList = document.createElement("dl")
  sourceList.className = "summary-list"
  appendDefinitionItems(sourceList, [
    ["currentLiveFrameAnalysis", state.currentLiveFrameAnalysis.analyzed ? "available" : "not analyzed"],
    ["top1 reference matching", state.top1Match.matched ? "matched" : "not matched"],
    ["top1MatchedReferenceId", summary.top1MatchedReferenceId ?? "-"],
    ["candidateAlignedIdealLandmarkCount", String(summary.candidateAlignedIdealLandmarkCount)],
    ["currentLandmarkCount", String(summary.currentLandmarkCount)],
    ["visibleCurrentLandmarkCount", String(summary.visibleCurrentLandmarkCount)],
    ["excludedCurrentLandmarkCount", String(summary.excludedCurrentLandmarkCount)],
    ["faceSourceVertexCount", String(summary.faceSourceVertexCount)],
    ["nearFaceGridCount", String(summary.nearFaceGridCount)],
    ["backgroundGridCount", String(summary.backgroundGridCount)],
    ["screenEdgeAnchorCount", String(summary.screenEdgeAnchorCount)],
  ])

  const targetHeading = document.createElement("h3")
  targetHeading.textContent = "Ideal Mesh Target"
  const targetList = document.createElement("dl")
  targetList.className = "summary-list"
  appendDefinitionItems(targetList, [
    ["meshPairCount", String(summary.meshPairCount)],
    [
      "usageWeight average / min / max",
      `${formatMetric(summary.usageWeightAverage)} / ${formatMetric(summary.usageWeightMin)} / ${formatMetric(summary.usageWeightMax)}`,
    ],
    ["alignedIdeal rule", "candidate only; not final target for all 478 landmarks"],
    ["faceLandmark target", "selected current landmark index -> same candidate aligned ideal index"],
    ["grid / anchors target", "fixed source position"],
  ])

  const reasonHeading = document.createElement("h3")
  reasonHeading.textContent = "Suppression / Exclusion"
  const reasonList = document.createElement("dl")
  reasonList.className = "summary-list"
  appendDefinitionItems(reasonList, [
    ["boundarySuppressedCount", String(summary.boundarySuppressedCount)],
    ["mouthSuppressedCount", String(summary.mouthSuppressedCount)],
    ["eyeSuppressedCount", String(summary.eyeSuppressedCount)],
    ["largeDisplacementSuppressedCount", String(summary.largeDisplacementSuppressedCount)],
    ["invalidExcludedCount", String(summary.invalidExcludedCount)],
    ["accepted landmark preview", formatMeshLandmarkPreview(mesh.acceptedCurrentLandmarks)],
    ["excluded landmark preview", formatMeshLandmarkPreview(mesh.excludedCurrentLandmarks)],
  ])

  fragment.append(heading, status, sourceHeading, sourceList, targetHeading, targetList, reasonHeading, reasonList)
  return fragment
}

function createWarpMeshContent() {
  const fragment = document.createDocumentFragment()
  const warpHeading = document.createElement("h3")
  warpHeading.textContent = "Warp Mesh"

  const status = document.createElement("p")
  status.className = "placeholder-text"
  status.textContent =
    "本線は未実装です。PR5以降の alignedIdeal 478点全体 displacement / raw displacement mesh warp は本線から外しました。"

  const currentHeading = document.createElement("h3")
  currentHeading.textContent = "現時点で残っているもの"
  const currentList = document.createElement("dl")
  currentList.className = "summary-list"
  appendDefinitionItems(currentList, [
    ["currentLiveFrameAnalysis", state.currentLiveFrameAnalysis.analyzed ? "available" : "not analyzed"],
    ["top1 reference matching", state.top1Match.matched ? "matched" : "not matched"],
  ])

  const nextHeading = document.createElement("h3")
  nextHeading.textContent = "次の本線"
  const nextList = document.createElement("dl")
  nextList.className = "summary-list"
  appendDefinitionItems(nextList, [
    ["prototype", "current mesh source / ideal mesh target pairs"],
    ["candidateAlignedIdealLandmarks", "top1 reference を current face へ位置合わせした ideal candidate"],
    ["selectedFaceTargets", "source 側で採用された landmark index だけに対応する target 候補"],
    ["mesh pairs", "selected face landmarks と grid / anchors を同順対応で確認する debug 入力"],
  ])

  const missingHeading = document.createElement("h3")
  missingHeading.textContent = "未実装"
  const missingList = document.createElement("dl")
  missingList.className = "summary-list"
  appendDefinitionItems(missingList, [
    ["precise visibilityWeight", "not implemented"],
    ["production warpSafetyWeight", "not implemented"],
    ["face boundary anchors", "not implemented"],
    ["WebGL warp", "not implemented"],
    ["hybrid mesh", "not implemented"],
    ["production mesh warp", "not implemented"],
  ])

  fragment.append(warpHeading, status, currentHeading, currentList, nextHeading, nextList, missingHeading, missingList)
  return fragment
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
      mediaPipeError: state.modelScan.mediaPipeError,
      modelTimestampMs: roundForState(state.modelScan.modelTimestampMs),
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
    liveMediaPipe: {
      status: state.liveMediaPipe.status,
      error: state.liveMediaPipe.error,
      liveTimestampMs: roundForState(state.liveMediaPipe.liveTimestampMs),
    },
    currentLiveFrameAnalysis: getCurrentLiveFrameRawState(),
    top1Match: {
      matched: state.top1Match.matched,
      idealFrameId: state.top1Match.idealFrameId,
      idealFrameIndex: state.top1Match.idealFrameIndex,
      idealTimeSec: roundForState(state.top1Match.idealTimeSec),
      matchScore: roundForState(state.top1Match.matchScore),
      poseDistance: roundForState(state.top1Match.poseDistance),
      expressionDistance: roundForState(state.top1Match.expressionDistance),
      qualityPenalty: roundForState(state.top1Match.qualityPenalty),
      currentExpressionGroup: state.top1Match.currentExpressionGroup,
      idealExpressionGroup: state.top1Match.idealExpressionGroup,
      error: state.top1Match.error,
    },
    currentIdealMeshPrototype: getCurrentIdealMeshPrototypeRawState(),
    logs: state.logs,
  }
}

function getCurrentIdealMeshPrototypeRawState() {
  const mesh = state.currentIdealMeshPrototype
  return {
    summary: {
      ...mesh.summary,
      usageWeightAverage: roundMetricForState(mesh.summary.usageWeightAverage),
      usageWeightMin: roundMetricForState(mesh.summary.usageWeightMin),
      usageWeightMax: roundMetricForState(mesh.summary.usageWeightMax),
    },
    candidateAlignedIdealLandmarkPreview: mesh.candidateAlignedIdealLandmarks
      .slice(0, LANDMARK_PREVIEW_COUNT)
      .map(roundLandmark),
    acceptedCurrentLandmarkPreview: mesh.acceptedCurrentLandmarks
      .slice(0, LANDMARK_PREVIEW_COUNT)
      .map(roundCurrentMeshLandmarkVertex),
    excludedCurrentLandmarkPreview: mesh.excludedCurrentLandmarks
      .slice(0, LANDMARK_PREVIEW_COUNT)
      .map(roundCurrentMeshLandmarkVertex),
    meshPairPreview: mesh.currentIdealMeshPairs
      .slice(0, LANDMARK_PREVIEW_COUNT)
      .map(roundMeshVertexPair),
  }
}

function getCurrentLiveFrameRawState() {
  const current = state.currentLiveFrameAnalysis
  return {
    analyzed: current.analyzed,
    timeSec: roundForState(current.timeSec),
    landmarkCount: current.landmarks478.length,
    pose: roundPose(current.pose),
    blendshapeCount: current.blendshapes.length,
    expressionGroup: current.expressionGroup,
    qualityScore: current.qualityScore,
    error: current.error,
    landmarksPreview: current.landmarks478.slice(0, LANDMARK_PREVIEW_COUNT).map(roundLandmark),
  }
}

function getDebugPlaceholder(tab: DebugTab) {
  switch (tab) {
    case "matching":
      return "live current frame と ideal reference frame の matching はまだ実行されていません。"
    case "warpMesh":
      return "調整なし mesh warp prototype の状態は Warp Mesh タブに表示します。"
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
  const frame = getCurrentAcceptedFrame()
  drawLandmarkOverlay({
    canvas: modelOverlayCanvas,
    videoElement: modelVideoElement,
    videoState: state.modelVideo,
    landmarks: frame?.landmarks478 ?? [],
    shouldDraw:
      state.overlay.showLandmarks478 &&
      state.activePreviewTab === "model" &&
      Boolean(frame) &&
      (frame?.landmarks478.length ?? 0) === REQUIRED_LANDMARK_COUNT,
    color: "rgba(32, 186, 165, 0.85)",
  })
}

function drawLiveOverlay() {
  const context = liveOverlayCanvas.getContext("2d")
  if (!context) {
    return
  }

  const rect = liveOverlayCanvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  liveOverlayCanvas.width = Math.max(1, Math.round(rect.width * dpr))
  liveOverlayCanvas.height = Math.max(1, Math.round(rect.height * dpr))
  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  context.clearRect(0, 0, rect.width, rect.height)

  if (
    state.activePreviewTab !== "live" ||
    rect.width <= 0 ||
    rect.height <= 0 ||
    state.currentLiveFrameAnalysis.landmarks478.length !== REQUIRED_LANDMARK_COUNT
  ) {
    return
  }

  const displayedContentRect = getDisplayedContentRect(
    state.liveVideo,
    liveVideoElement,
    rect.width,
    rect.height,
  )

  if (state.overlay.showLandmarks478) {
    drawLandmarkPoints(
      context,
      displayedContentRect,
      state.currentLiveFrameAnalysis.landmarks478,
      "rgba(79, 128, 255, 0.85)",
      1.45,
    )
  }

  drawMeshPrototypeOverlay(context, displayedContentRect)
}

function drawAllOverlays() {
  drawModelOverlay()
  drawLiveOverlay()
}

function drawLandmarkOverlay({
  canvas,
  videoElement,
  videoState,
  landmarks,
  shouldDraw,
  color,
}: {
  canvas: HTMLCanvasElement
  videoElement: HTMLVideoElement
  videoState: VideoPreviewState
  landmarks: ReferenceLandmark[]
  shouldDraw: boolean
  color: string
}) {
  const context = canvas.getContext("2d")
  if (!context) {
    return
  }

  const rect = videoElement.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.max(1, Math.round(rect.width * dpr))
  canvas.height = Math.max(1, Math.round(rect.height * dpr))
  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  context.clearRect(0, 0, rect.width, rect.height)

  if (
    !shouldDraw ||
    landmarks.length !== REQUIRED_LANDMARK_COUNT ||
    rect.width <= 0 ||
    rect.height <= 0
  ) {
    return
  }

  const displayedContentRect = getDisplayedContentRect(
    videoState,
    videoElement,
    rect.width,
    rect.height,
  )
  drawLandmarkPoints(context, displayedContentRect, landmarks, color, 1.45)
}

function drawLandmarkPoints(
  context: CanvasRenderingContext2D,
  displayedContentRect: Rect,
  landmarks: ReferenceLandmark[],
  color: string,
  radius: number,
) {
  context.fillStyle = color
  for (const landmark of landmarks) {
    const point = normalizedLandmarkToPreviewPixel(landmark, displayedContentRect)
    context.beginPath()
    context.arc(point.x, point.y, radius, 0, Math.PI * 2)
    context.fill()
  }
}

function drawMeshPrototypeOverlay(
  context: CanvasRenderingContext2D,
  displayedContentRect: Rect,
) {
  const mesh = state.currentIdealMeshPrototype
  const showAnyMeshOverlay =
    state.overlay.showMeshSource ||
    state.overlay.showMeshTarget ||
    state.overlay.showMeshPairs ||
    state.overlay.showExcludedLandmarks ||
    state.overlay.showGridAnchors

  if (!showAnyMeshOverlay || mesh.currentIdealMeshPairs.length === 0) {
    return
  }

  if (state.overlay.showMeshPairs) {
    context.strokeStyle = "rgba(241, 126, 39, 0.55)"
    context.lineWidth = 1
    for (const pair of mesh.currentIdealMeshPairs) {
      if (pair.kind !== "faceLandmark") {
        continue
      }
      const source = normalizedLandmarkToPreviewPixel(pair.source, displayedContentRect)
      const target = normalizedLandmarkToPreviewPixel(pair.target, displayedContentRect)
      context.beginPath()
      context.moveTo(source.x, source.y)
      context.lineTo(target.x, target.y)
      context.stroke()
    }
  }

  if (state.overlay.showGridAnchors) {
    drawMeshVertexPoints(
      context,
      displayedContentRect,
      mesh.currentIdealMeshPairs.filter((pair) => pair.kind !== "faceLandmark"),
      "source",
      "rgba(105, 114, 126, 0.75)",
      2.2,
      "square",
    )
  }

  if (state.overlay.showMeshSource) {
    drawMeshVertexPoints(
      context,
      displayedContentRect,
      mesh.currentIdealMeshPairs.filter((pair) => pair.kind === "faceLandmark"),
      "source",
      "rgba(20, 170, 130, 0.9)",
      2,
      "circle",
    )
  }

  if (state.overlay.showMeshTarget) {
    drawMeshVertexPoints(
      context,
      displayedContentRect,
      mesh.currentIdealMeshPairs.filter((pair) => pair.kind === "faceLandmark"),
      "target",
      "rgba(244, 86, 120, 0.9)",
      2,
      "circle",
    )
  }

  if (state.overlay.showExcludedLandmarks) {
    drawCurrentMeshLandmarkPoints(
      context,
      displayedContentRect,
      mesh.excludedCurrentLandmarks,
      "rgba(32, 38, 45, 0.55)",
      2.1,
    )
  }
}

function drawMeshVertexPoints(
  context: CanvasRenderingContext2D,
  displayedContentRect: Rect,
  pairs: MeshVertexPair[],
  side: "source" | "target",
  color: string,
  radius: number,
  shape: "circle" | "square",
) {
  context.fillStyle = color
  for (const pair of pairs) {
    const point = normalizedLandmarkToPreviewPixel(pair[side], displayedContentRect)
    if (shape === "square") {
      context.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2)
      continue
    }
    context.beginPath()
    context.arc(point.x, point.y, radius, 0, Math.PI * 2)
    context.fill()
  }
}

function drawCurrentMeshLandmarkPoints(
  context: CanvasRenderingContext2D,
  displayedContentRect: Rect,
  vertices: CurrentMeshLandmarkVertex[],
  color: string,
  radius: number,
) {
  context.strokeStyle = color
  context.lineWidth = 1.5
  for (const vertex of vertices) {
    const point = normalizedLandmarkToPreviewPixel(vertex.source, displayedContentRect)
    context.beginPath()
    context.moveTo(point.x - radius, point.y - radius)
    context.lineTo(point.x + radius, point.y + radius)
    context.moveTo(point.x + radius, point.y - radius)
    context.lineTo(point.x - radius, point.y + radius)
    context.stroke()
  }
}

function clearModelOverlay() {
  clearOverlay(modelOverlayCanvas)
}

function clearLiveOverlay() {
  clearOverlay(liveOverlayCanvas)
}

function clearOverlay(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d")
  if (!context) {
    return
  }
  context.clearRect(0, 0, canvas.width, canvas.height)
}

function getDisplayedContentRect(
  videoState: VideoPreviewState,
  videoElement: HTMLVideoElement,
  containerWidth: number,
  containerHeight: number,
): Rect {
  const videoWidth = videoState.width ?? videoElement.videoWidth
  const videoHeight = videoState.height ?? videoElement.videoHeight
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

function normalizedLandmarkToPreviewPixel(
  landmark: { x: number; y: number },
  displayedContentRect: Rect,
) {
  return {
    x: displayedContentRect.x + landmark.x * displayedContentRect.width,
    y: displayedContentRect.y + landmark.y * displayedContentRect.height,
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

function formatMetric(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "-"
  }

  return value.toFixed(4)
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

function formatMeshLandmarkPreview(vertices: CurrentMeshLandmarkVertex[]) {
  if (vertices.length === 0) {
    return "-"
  }

  return vertices
    .slice(0, LANDMARK_PREVIEW_COUNT)
    .map((vertex) => `${vertex.index}:${formatMetric(vertex.usageWeight)}:${vertex.reasons.join("|")}`)
    .join(" / ")
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

function formatLiveAnalysisStatus() {
  if (!state.currentLiveFrameAnalysis.analyzed) {
    return "not analyzed"
  }

  return state.currentLiveFrameAnalysis.error ? "error" : "analyzed"
}

function formatMissingBlendshapes(blendshapes: ReferenceBlendshape[]) {
  if (blendshapes.length === 0) {
    return "all"
  }

  const missing = getMissingBlendshapeKeys(blendshapes)
  return missing.length === 0 ? "-" : missing.join(" / ")
}

function roundForState(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return value
  }

  return Math.round(value * 1000) / 1000
}

function roundMetricForState(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return value
  }

  return Math.round(value * 10000) / 10000
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

function roundCurrentMeshLandmarkVertex(vertex: CurrentMeshLandmarkVertex) {
  return {
    id: vertex.id,
    kind: vertex.kind,
    index: vertex.index,
    source: roundPoint(vertex.source),
    visibilityWeight: roundMetricForState(vertex.visibilityWeight),
    safetyWeight: roundMetricForState(vertex.safetyWeight),
    usageWeight: roundMetricForState(vertex.usageWeight),
    reasons: vertex.reasons,
  }
}

function roundMeshVertexPair(pair: MeshVertexPair) {
  return {
    id: pair.id,
    kind: pair.kind,
    index: pair.index,
    source: roundPoint(pair.source),
    target: roundPoint(pair.target),
    usageWeight: roundMetricForState(pair.usageWeight),
    reasons: pair.reasons,
  }
}

function roundPoint(point: Point2D) {
  return {
    x: roundForState(point.x),
    y: roundForState(point.y),
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

function getMatchedIdealFrame() {
  const frameId = state.top1Match.idealFrameId
  return frameId === null
    ? null
    : state.rawIdealReferenceFrames.find((frame) => frame.frameId === frameId) ?? null
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
  getElement<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>(selector).disabled =
    disabled
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
  disposeModelFaceLandmarker("disposed")
  disposeLiveFaceLandmarker("disposed")
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
