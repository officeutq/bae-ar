import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision"
import {
  MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT,
  MEDIAPIPE_FACE_MESH_TRIANGLE_COUNT,
  MEDIAPIPE_FACE_MESH_TRIANGLES,
} from "@bae-ar/engine"
import type { Matrix, NormalizedLandmark } from "@mediapipe/tasks-vision"
import "./style.css"

type PreviewTab = "model" | "live"
type LivePreviewMode = "source" | "rawWarpOnly" | "sideBySide"
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

type LandmarkDisplacement = {
  index: number
  current: ReferenceLandmark
  alignedIdeal: ReferenceLandmark
  dx: number
  dy: number
  dz: number
  distance2D: number
}

type DisplacementSummary = {
  available: boolean
  count: number
  maxDistance2D: number | null
  averageDistance2D: number | null
  medianDistance2D: number | null
  p90Distance2D: number | null
  largeDisplacementCount: number
  largeDisplacementThreshold: number
  topDisplacementsPreview: Array<{
    index: number
    distance2D: number
    dx: number
    dy: number
  }>
  error: string | null
}

type DisplacementDebugState = {
  available: boolean
  displacements: LandmarkDisplacement[]
  summary: DisplacementSummary
}

type Rect = {
  x: number
  y: number
  width: number
  height: number
}

type SizeDebug = {
  width: number
  height: number
}

type NullableSizeDebug = {
  width: number | null
  height: number | null
}

type VideoCoordinateDebug = {
  videoIntrinsic: NullableSizeDebug
  previewElementRect: SizeDebug
  videoCssRect: SizeDebug
  rawWarpCanvasCssRect: SizeDebug
  displayedContentRect: Rect
  overlayCanvas: SizeDebug
  rawWarpCanvas: SizeDebug
}

type MeshMappingMode = "draw_target_triangles_sample_source_uv"
type CoordinateConversionMode = "normalized_to_displayed_content_pixel_to_clip_space"
type TextureUploadFlip = "off" | "on"
type TextureVFormula = "y" | "oneMinusY"

type RawWarpSummary = {
  enabled: boolean
  available: boolean
  mode: "unadjusted_current_to_aligned_ideal"
  strength: number
  previewMode: LivePreviewMode
  textureUploadFlip: TextureUploadFlip
  textureVFormula: TextureVFormula
  meshMapping: MeshMappingMode
  coordinateConversion: CoordinateConversionMode
  coordinateDebug: VideoCoordinateDebug
  sourceVertexCount: number
  targetVertexCount: number
  topology: "mediapipe_face_mesh"
  topologyLandmarkCount: number
  triangleCount: number
  alignment: "bounds_center_uniform_scale"
  meshWarp: "prototype"
  visibilityWeight: "not_implemented"
  warpSafetyWeight: "not_implemented"
  hybridMesh: "not_implemented"
  error: string | null
  webglStatus: "not_started" | "available" | "unavailable"
  renderTimeMs: number | null
}

type RawWarpDebugState = {
  strength: number
  textureUploadFlip: TextureUploadFlip
  textureVFormula: TextureVFormula
  summary: RawWarpSummary
}

type RawWarpWebglRenderer = {
  canvas: HTMLCanvasElement
  gl: WebGLRenderingContext
  program: WebGLProgram
  positionBuffer: WebGLBuffer
  texCoordBuffer: WebGLBuffer
  indexBuffer: WebGLBuffer
  texture: WebGLTexture
  positionLocation: number
  texCoordLocation: number
  textureLocation: WebGLUniformLocation
}

type LandmarkBounds = {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
  centerX: number
  centerY: number
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
  livePreviewMode: LivePreviewMode
  overlay: {
    showLandmarks478: boolean
    showDisplacement: boolean
    showRawWarp: boolean
    showRawWarpCoordinateDebug: boolean
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
  displacementDebug: DisplacementDebugState
  rawWarpDebug: RawWarpDebugState
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
const DISPLACEMENT_PREVIEW_COUNT = 8
const DISPLACEMENT_DRAW_STEP = 8
const WARP_COORDINATE_DEBUG_DRAW_STEP = 8
const WARP_SAMPLE_INDICES = [0, 1, 33, 61, 199] as const
const LARGE_DISPLACEMENT_THRESHOLD = 0.03
const DEFAULT_RAW_WARP_STRENGTH = 1
const RAW_WARP_STRENGTH_OPTIONS = [0.25, 0.5, 1] as const
const DEFAULT_LIVE_PREVIEW_MODE: LivePreviewMode = "source"
const DEFAULT_TEXTURE_UPLOAD_FLIP: TextureUploadFlip = "on"
const DEFAULT_TEXTURE_V_FORMULA: TextureVFormula = "oneMinusY"
const SCAN_RENDER_INTERVAL = 8
const LIVE_AUTO_ANALYSIS_INTERVAL_SEC = 0.35
const MEDIAPIPE_TIMESTAMP_STEP_MS = SCAN_FRAME_STEP_SEC * 1000
const POSE_WEIGHT = 1
const EXPRESSION_WEIGHT = 1
const QUALITY_WEIGHT = 0.25
const POSE_MISSING_PENALTY = 1000
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
  livePreviewMode: DEFAULT_LIVE_PREVIEW_MODE,
  overlay: {
    showLandmarks478: false,
    showDisplacement: false,
    showRawWarp: false,
    showRawWarpCoordinateDebug: false,
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
  displacementDebug: createEmptyDisplacementDebug(),
  rawWarpDebug: createEmptyRawWarpDebug(),
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
            <input type="checkbox" data-action="toggle-displacement" />
            <span>displacement を表示</span>
          </label>
          <label class="overlay-toggle">
            <input type="checkbox" data-action="toggle-raw-warp" />
            <span>warp を表示</span>
          </label>
          <label class="overlay-toggle">
            <input type="checkbox" data-action="toggle-warp-coordinate-debug" />
            <span>warp座標debugを表示</span>
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
const liveRawWarpCanvas = getElement<HTMLCanvasElement>("[data-raw-warp='live']")
const modelFileInput = getElement<HTMLInputElement>("[data-input='model-video']")
const liveFileInput = getElement<HTMLInputElement>("[data-input='live-video']")

let rawWarpRenderer: RawWarpWebglRenderer | null = null
let rawWarpRendererError: string | null = null

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
        <canvas class="raw-warp-canvas" data-raw-warp="live"></canvas>
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
        <label class="range-field compact-field">
          <span>Preview mode</span>
          <select data-action="live-preview-mode">
            <option value="source" ${state.livePreviewMode === "source" ? "selected" : ""}>Source</option>
            <option value="rawWarpOnly" ${state.livePreviewMode === "rawWarpOnly" ? "selected" : ""}>Raw warp only</option>
            <option value="sideBySide" ${state.livePreviewMode === "sideBySide" ? "selected" : ""}>Side by side</option>
          </select>
        </label>
        <label class="range-field compact-field">
          <span>raw warp strength</span>
          <select data-action="raw-warp-strength">
            ${RAW_WARP_STRENGTH_OPTIONS.map(
              (strength) =>
                `<option value="${strength}" ${strength === state.rawWarpDebug.strength ? "selected" : ""}>${strength}</option>`,
            ).join("")}
          </select>
        </label>
        <label class="range-field compact-field">
          <span>texture upload flip</span>
          <select data-action="texture-upload-flip">
            <option value="off" ${state.rawWarpDebug.textureUploadFlip === "off" ? "selected" : ""}>off</option>
            <option value="on" ${state.rawWarpDebug.textureUploadFlip === "on" ? "selected" : ""}>on</option>
          </select>
        </label>
        <label class="range-field compact-field">
          <span>texture V formula</span>
          <select data-action="texture-v-formula">
            <option value="y" ${state.rawWarpDebug.textureVFormula === "y" ? "selected" : ""}>y</option>
            <option value="oneMinusY" ${state.rawWarpDebug.textureVFormula === "oneMinusY" ? "selected" : ""}>1 - y</option>
          </select>
        </label>
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
  getElement<HTMLInputElement>('[data-action="toggle-displacement"]').addEventListener(
    "change",
    (event) => {
      handleToggleDisplacement(event.currentTarget.checked)
    },
  )
  getElement<HTMLInputElement>('[data-action="toggle-raw-warp"]').addEventListener(
    "change",
    (event) => {
      handleToggleRawWarp(event.currentTarget.checked)
    },
  )
  getElement<HTMLInputElement>('[data-action="toggle-warp-coordinate-debug"]').addEventListener(
    "change",
    (event) => {
      handleToggleWarpCoordinateDebug(event.currentTarget.checked)
    },
  )
  getElement<HTMLSelectElement>('[data-action="live-preview-mode"]').addEventListener(
    "change",
    (event) => {
      handleLivePreviewModeChange(event.currentTarget.value)
    },
  )
  getElement<HTMLSelectElement>('[data-action="raw-warp-strength"]').addEventListener(
    "change",
    (event) => {
      handleRawWarpStrengthChange(Number(event.currentTarget.value))
    },
  )
  getElement<HTMLSelectElement>('[data-action="texture-upload-flip"]').addEventListener(
    "change",
    (event) => {
      handleTextureUploadFlipChange(event.currentTarget.value)
    },
  )
  getElement<HTMLSelectElement>('[data-action="texture-v-formula"]').addEventListener(
    "change",
    (event) => {
      handleTextureVFormulaChange(event.currentTarget.value)
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
  state.displacementDebug = createEmptyDisplacementDebug("noReferenceFrames")
  updateRawWarpSummary()
  clearRawWarpCanvas()
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
    updateDisplacementDebug()
    return
  }

  if (current.error || current.landmarks478.length !== REQUIRED_LANDMARK_COUNT) {
    state.top1Match = {
      ...createEmptyTop1Match(),
      currentExpressionGroup: current.expressionGroup,
      error: `current analysis failed / matching skipped: ${current.error ?? "invalidCurrentLandmarks"}`,
    }
    updateDisplacementDebug()
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
    updateDisplacementDebug()
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
    updateDisplacementDebug()
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
  updateDisplacementDebug()
}

function updateDisplacementDebug() {
  const current = state.currentLiveFrameAnalysis
  const match = state.top1Match
  const idealFrame = getMatchedIdealFrame()

  if (!match.matched) {
    state.displacementDebug = createEmptyDisplacementDebug(
      match.error ?? "top1MatchUnavailable",
    )
    updateRawWarpSummary()
    return
  }

  if (current.landmarks478.length !== REQUIRED_LANDMARK_COUNT) {
    state.displacementDebug = createEmptyDisplacementDebug("invalidCurrentLandmarks")
    updateRawWarpSummary()
    return
  }

  if (!idealFrame || idealFrame.landmarks478.length !== REQUIRED_LANDMARK_COUNT) {
    state.displacementDebug = createEmptyDisplacementDebug("invalidIdealLandmarks")
    updateRawWarpSummary()
    return
  }

  const alignedIdeal = alignIdealLandmarksToCurrentBounds(
    idealFrame.landmarks478,
    current.landmarks478,
  )

  if (!alignedIdeal) {
    state.displacementDebug = createEmptyDisplacementDebug("invalidLandmarkBounds")
    updateRawWarpSummary()
    return
  }

  const displacements = current.landmarks478.map((currentLandmark, index) => {
    const alignedIdealLandmark = alignedIdeal[index]
    const dx = alignedIdealLandmark.x - currentLandmark.x
    const dy = alignedIdealLandmark.y - currentLandmark.y
    const dz = alignedIdealLandmark.z - currentLandmark.z
    return {
      index: currentLandmark.index,
      current: currentLandmark,
      alignedIdeal: alignedIdealLandmark,
      dx,
      dy,
      dz,
      distance2D: Math.hypot(dx, dy),
    }
  })

  state.displacementDebug = {
    available: true,
    displacements,
    summary: createDisplacementSummary(displacements),
  }
  updateRawWarpSummary()
}

function alignIdealLandmarksToCurrentBounds(
  idealLandmarks: ReferenceLandmark[],
  currentLandmarks: ReferenceLandmark[],
) {
  const idealBounds = calculateLandmarkBounds(idealLandmarks)
  const currentBounds = calculateLandmarkBounds(currentLandmarks)

  if (!idealBounds || !currentBounds) {
    return null
  }

  const idealSize = Math.max(idealBounds.width, idealBounds.height)
  const currentSize = Math.max(currentBounds.width, currentBounds.height)

  if (idealSize <= 0 || currentSize <= 0) {
    return null
  }

  const scale = currentSize / idealSize
  return idealLandmarks.map((landmark) => ({
    index: landmark.index,
    x: currentBounds.centerX + (landmark.x - idealBounds.centerX) * scale,
    y: currentBounds.centerY + (landmark.y - idealBounds.centerY) * scale,
    z: landmark.z,
  }))
}

function calculateLandmarkBounds(landmarks: ReferenceLandmark[]): LandmarkBounds | null {
  if (landmarks.length === 0) {
    return null
  }

  const initial = landmarks[0]
  const bounds = landmarks.reduce(
    (result, landmark) => ({
      minX: Math.min(result.minX, landmark.x),
      minY: Math.min(result.minY, landmark.y),
      maxX: Math.max(result.maxX, landmark.x),
      maxY: Math.max(result.maxY, landmark.y),
    }),
    {
      minX: initial.x,
      minY: initial.y,
      maxX: initial.x,
      maxY: initial.y,
    },
  )
  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY
  return {
    ...bounds,
    width,
    height,
    centerX: bounds.minX + width / 2,
    centerY: bounds.minY + height / 2,
  }
}

function createDisplacementSummary(displacements: LandmarkDisplacement[]): DisplacementSummary {
  if (displacements.length === 0) {
    return createEmptyDisplacementSummary("emptyDisplacements")
  }

  const distances = displacements.map((displacement) => displacement.distance2D)
  const sortedDistances = [...distances].sort((a, b) => a - b)
  const totalDistance = distances.reduce((sum, value) => sum + value, 0)
  const topDisplacementsPreview = [...displacements]
    .sort((a, b) => b.distance2D - a.distance2D)
    .slice(0, DISPLACEMENT_PREVIEW_COUNT)
    .map((displacement) => ({
      index: displacement.index,
      distance2D: displacement.distance2D,
      dx: displacement.dx,
      dy: displacement.dy,
    }))

  return {
    available: true,
    count: displacements.length,
    maxDistance2D: sortedDistances[sortedDistances.length - 1],
    averageDistance2D: totalDistance / displacements.length,
    medianDistance2D: calculateMedian(sortedDistances),
    p90Distance2D: calculatePercentile(sortedDistances, 0.9),
    largeDisplacementCount: distances.filter(
      (distance) => distance >= LARGE_DISPLACEMENT_THRESHOLD,
    ).length,
    largeDisplacementThreshold: LARGE_DISPLACEMENT_THRESHOLD,
    topDisplacementsPreview,
    error: null,
  }
}

function calculateMedian(sortedValues: number[]) {
  if (sortedValues.length === 0) {
    return null
  }

  const center = Math.floor(sortedValues.length / 2)
  return sortedValues.length % 2 === 0
    ? (sortedValues[center - 1] + sortedValues[center]) / 2
    : sortedValues[center]
}

function calculatePercentile(sortedValues: number[], percentile: number) {
  if (sortedValues.length === 0) {
    return null
  }

  const index = clamp(
    Math.ceil(sortedValues.length * percentile) - 1,
    0,
    sortedValues.length - 1,
  )
  return sortedValues[index]
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
    updateDisplacementDebug()
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

function handleToggleDisplacement(checked: boolean) {
  state.overlay.showDisplacement = checked
  addLog(`displacement overlay 表示を ${checked ? "ON" : "OFF"} にしました。`)
  drawAllOverlays()
  renderAll()
}

function handleToggleRawWarp(checked: boolean) {
  state.overlay.showRawWarp = checked
  updateRawWarpSummary()
  addLog(`調整なし warp 表示を ${checked ? "ON" : "OFF"} にしました。`)
  drawAllOverlays()
  renderAll()
}

function handleToggleWarpCoordinateDebug(checked: boolean) {
  state.overlay.showRawWarpCoordinateDebug = checked
  updateRawWarpSummary()
  addLog(`warp 座標 debug 表示を ${checked ? "ON" : "OFF"} にしました。`)
  drawAllOverlays()
  renderAll()
}

function handleLivePreviewModeChange(value: string) {
  if (!isLivePreviewMode(value)) {
    return
  }

  state.livePreviewMode = value
  updateRawWarpSummary()
  addLog(`Live preview mode を ${value} にしました。`)
  drawAllOverlays()
  renderAll()
}

function handleRawWarpStrengthChange(strength: number) {
  if (!RAW_WARP_STRENGTH_OPTIONS.includes(strength as (typeof RAW_WARP_STRENGTH_OPTIONS)[number])) {
    return
  }

  state.rawWarpDebug.strength = strength
  updateRawWarpSummary()
  addLog(`raw warp strength を ${formatMetric(strength)} にしました。`)
  drawAllOverlays()
  renderAll()
}

function handleTextureUploadFlipChange(value: string) {
  if (!isTextureUploadFlip(value)) {
    return
  }

  state.rawWarpDebug.textureUploadFlip = value
  updateRawWarpSummary()
  addLog(`texture upload flip を ${value} にしました。`)
  drawAllOverlays()
  renderAll()
}

function handleTextureVFormulaChange(value: string) {
  if (!isTextureVFormula(value)) {
    return
  }

  state.rawWarpDebug.textureVFormula = value
  updateRawWarpSummary()
  addLog(`texture V formula を ${value} にしました。`)
  drawAllOverlays()
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
  disposeModelFaceLandmarker("uninitialized")
  resetModelTimestamp()
  state.rawIdealReferenceFrames = []
  state.currentAcceptedReviewIndex = null
  state.top1Match = createEmptyTop1Match()
  state.displacementDebug = createEmptyDisplacementDebug()
  updateRawWarpSummary()
  clearRawWarpCanvas()
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
  state.displacementDebug = createEmptyDisplacementDebug()
  updateRawWarpSummary()
  clearRawWarpCanvas()
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

function createEmptyDisplacementDebug(error: string | null = null): DisplacementDebugState {
  return {
    available: false,
    displacements: [],
    summary: createEmptyDisplacementSummary(error),
  }
}

function createEmptyDisplacementSummary(error: string | null = null): DisplacementSummary {
  return {
    available: false,
    count: 0,
    maxDistance2D: null,
    averageDistance2D: null,
    medianDistance2D: null,
    p90Distance2D: null,
    largeDisplacementCount: 0,
    largeDisplacementThreshold: LARGE_DISPLACEMENT_THRESHOLD,
    topDisplacementsPreview: [],
    error,
  }
}

function createEmptyRawWarpDebug(): RawWarpDebugState {
  return {
    strength: DEFAULT_RAW_WARP_STRENGTH,
    textureUploadFlip: DEFAULT_TEXTURE_UPLOAD_FLIP,
    textureVFormula: DEFAULT_TEXTURE_V_FORMULA,
    summary: {
      enabled: false,
      available: false,
      mode: "unadjusted_current_to_aligned_ideal",
      strength: DEFAULT_RAW_WARP_STRENGTH,
      previewMode: DEFAULT_LIVE_PREVIEW_MODE,
      textureUploadFlip: DEFAULT_TEXTURE_UPLOAD_FLIP,
      textureVFormula: DEFAULT_TEXTURE_V_FORMULA,
      meshMapping: "draw_target_triangles_sample_source_uv",
      coordinateConversion: "normalized_to_displayed_content_pixel_to_clip_space",
      coordinateDebug: createEmptyVideoCoordinateDebug(),
      sourceVertexCount: 0,
      targetVertexCount: 0,
      topology: "mediapipe_face_mesh",
      topologyLandmarkCount: MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT,
      triangleCount: 0,
      alignment: "bounds_center_uniform_scale",
      meshWarp: "prototype",
      visibilityWeight: "not_implemented",
      warpSafetyWeight: "not_implemented",
      hybridMesh: "not_implemented",
      error: "displacementUnavailable",
      webglStatus: "not_started",
      renderTimeMs: null,
    },
  }
}

function createRawWarpSummary({
  available,
  error,
  webglStatus,
  renderTimeMs,
}: {
  available: boolean
  error: string | null
  webglStatus: RawWarpSummary["webglStatus"]
  renderTimeMs: number | null
}): RawWarpSummary {
  const vertexCount = available ? MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT : 0
  return {
    enabled: state.overlay.showRawWarp,
    available,
    mode: "unadjusted_current_to_aligned_ideal",
    strength: state.rawWarpDebug?.strength ?? DEFAULT_RAW_WARP_STRENGTH,
    previewMode: state.livePreviewMode,
    textureUploadFlip: state.rawWarpDebug?.textureUploadFlip ?? DEFAULT_TEXTURE_UPLOAD_FLIP,
    textureVFormula: state.rawWarpDebug?.textureVFormula ?? DEFAULT_TEXTURE_V_FORMULA,
    meshMapping: "draw_target_triangles_sample_source_uv",
    coordinateConversion: "normalized_to_displayed_content_pixel_to_clip_space",
    coordinateDebug: getLiveVideoCoordinateDebug(),
    sourceVertexCount: vertexCount,
    targetVertexCount: vertexCount,
    topology: "mediapipe_face_mesh",
    topologyLandmarkCount: MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT,
    triangleCount: available ? MEDIAPIPE_FACE_MESH_TRIANGLE_COUNT : 0,
    alignment: "bounds_center_uniform_scale",
    meshWarp: "prototype",
    visibilityWeight: "not_implemented",
    warpSafetyWeight: "not_implemented",
    hybridMesh: "not_implemented",
    error,
    webglStatus,
    renderTimeMs,
  }
}

function updateRawWarpSummary(
  override?: Partial<Pick<RawWarpSummary, "error" | "webglStatus" | "renderTimeMs">>,
) {
  const availabilityError = getRawWarpAvailabilityError()
  const webglUnavailable = override?.webglStatus === "unavailable"
  state.rawWarpDebug.summary = createRawWarpSummary({
    available: availabilityError === null && !webglUnavailable,
    error: override?.error ?? availabilityError,
    webglStatus: override?.webglStatus ?? state.rawWarpDebug.summary.webglStatus,
    renderTimeMs: override?.renderTimeMs ?? state.rawWarpDebug.summary.renderTimeMs,
  })
}

function getRawWarpAvailabilityError() {
  if (!state.liveVideo.loaded) {
    return "liveVideoNotLoaded"
  }

  if (!state.top1Match.matched) {
    return state.top1Match.error ?? "top1MatchUnavailable"
  }

  if (!state.displacementDebug.available) {
    return state.displacementDebug.summary.error ?? "displacementUnavailable"
  }

  if (state.displacementDebug.displacements.length < MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT) {
    return "insufficientDisplacementVertices"
  }

  if (state.currentLiveFrameAnalysis.landmarks478.length < MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT) {
    return "insufficientCurrentVertices"
  }

  if (MEDIAPIPE_FACE_MESH_TRIANGLES.length === 0) {
    return "emptyTopology"
  }

  return null
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
  liveStage.dataset.livePreviewMode = state.livePreviewMode
  liveStage.dataset.rawWarpVisible = String(state.overlay.showRawWarp)
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
  setDisabled('[data-action="raw-warp-strength"]', !liveLoaded)

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
  getElement<HTMLInputElement>('[data-action="toggle-displacement"]').checked =
    state.overlay.showDisplacement
  getElement<HTMLInputElement>('[data-action="toggle-raw-warp"]').checked =
    state.overlay.showRawWarp
  getElement<HTMLInputElement>('[data-action="toggle-warp-coordinate-debug"]').checked =
    state.overlay.showRawWarpCoordinateDebug
  getElement<HTMLSelectElement>('[data-action="live-preview-mode"]').value =
    state.livePreviewMode
  getElement<HTMLSelectElement>('[data-action="raw-warp-strength"]').value = String(
    state.rawWarpDebug.strength,
  )
  getElement<HTMLSelectElement>('[data-action="texture-upload-flip"]').value =
    state.rawWarpDebug.textureUploadFlip
  getElement<HTMLSelectElement>('[data-action="texture-v-formula"]').value =
    state.rawWarpDebug.textureVFormula
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
    content.appendChild(createWarpMeshContent())
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
  const displacementSummary = state.displacementDebug.summary
  const rawWarpSummary = state.rawWarpDebug.summary
  const coordinateDebug = rawWarpSummary.coordinateDebug

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
    ["Displacement", displacementSummary.available ? "available" : "unavailable"],
    ["Avg displacement", formatMetric(displacementSummary.averageDistance2D)],
    ["Max displacement", formatMetric(displacementSummary.maxDistance2D)],
    ["Large displacement count", String(displacementSummary.largeDisplacementCount)],
    ["Raw warp", rawWarpSummary.enabled ? "enabled" : "disabled"],
    ["Raw warp strength", formatMetric(rawWarpSummary.strength)],
    ["Warp available", rawWarpSummary.available ? "yes" : "no"],
    ["Triangle count", String(rawWarpSummary.triangleCount)],
    ["Preview mode", rawWarpSummary.previewMode],
    ["Warp coordinate debug", state.overlay.showRawWarpCoordinateDebug ? "on" : "off"],
    ["Texture upload flip", rawWarpSummary.textureUploadFlip],
    ["Texture V formula", rawWarpSummary.textureVFormula],
    ["Displayed content rect", formatRect(coordinateDebug.displayedContentRect)],
    ["Video rect", formatSize(coordinateDebug.videoCssRect.width, coordinateDebug.videoCssRect.height)],
    [
      "Raw warp canvas rect",
      formatSize(
        coordinateDebug.rawWarpCanvasCssRect.width,
        coordinateDebug.rawWarpCanvasCssRect.height,
      ),
    ],
    ["Raw warp canvas", formatSize(coordinateDebug.rawWarpCanvas.width, coordinateDebug.rawWarpCanvas.height)],
    ["Match score", formatSeconds(state.top1Match.matchScore)],
    ["Pose distance", formatSeconds(state.top1Match.poseDistance)],
    ["Expression distance", formatSeconds(state.top1Match.expressionDistance)],
    ["Overlay 478 landmarks", state.overlay.showLandmarks478 ? "on" : "off"],
    ["Overlay displacement", state.overlay.showDisplacement ? "on" : "off"],
    ["Overlay raw warp", state.overlay.showRawWarp ? "on" : "off"],
    ["Overlay warp coordinate debug", state.overlay.showRawWarpCoordinateDebug ? "on" : "off"],
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

  const displacementHeading = document.createElement("h3")
  displacementHeading.textContent = "Displacement"
  const displacementList = document.createElement("dl")
  displacementList.className = "summary-list"
  appendDefinitionItems(displacementList, [
    ["available", state.displacementDebug.summary.available ? "yes" : "no"],
    ["averageDistance2D", formatMetric(state.displacementDebug.summary.averageDistance2D)],
    ["maxDistance2D", formatMetric(state.displacementDebug.summary.maxDistance2D)],
    ["error", state.displacementDebug.summary.error ?? "-"],
  ])

  fragment.append(
    currentHeading,
    currentList,
    idealHeading,
    idealList,
    scoreHeading,
    scoreList,
    displacementHeading,
    displacementList,
  )
  return fragment
}

function createWarpMeshContent() {
  const fragment = document.createDocumentFragment()
  const warpHeading = document.createElement("h3")
  warpHeading.textContent = "Unadjusted Mesh Warp"
  const rawWarpSummary = state.rawWarpDebug.summary
  const coordinateDebug = rawWarpSummary.coordinateDebug
  const rawWarpList = document.createElement("dl")
  rawWarpList.className = "summary-list"
  appendDefinitionItems(rawWarpList, [
    ["warp available", rawWarpSummary.available ? "yes" : "no"],
    ["warp enabled", rawWarpSummary.enabled ? "yes" : "no"],
    ["rawWarpStrength", formatMetric(rawWarpSummary.strength)],
    ["preview mode", rawWarpSummary.previewMode],
    ["texture upload flip", rawWarpSummary.textureUploadFlip],
    ["texture V formula", rawWarpSummary.textureVFormula],
    ["sourceVertexCount", String(rawWarpSummary.sourceVertexCount)],
    ["targetVertexCount", String(rawWarpSummary.targetVertexCount)],
    ["topology", rawWarpSummary.topology],
    ["topologyLandmarkCount", String(rawWarpSummary.topologyLandmarkCount)],
    ["triangleCount", String(rawWarpSummary.triangleCount)],
    ["mode", rawWarpSummary.mode],
    ["alignment", "bounds center + uniform scale"],
    ["mesh mapping", "draw target triangles / sample source UVs"],
    ["coordinate conversion", "normalized -> displayed content pixel -> clip space"],
    ["mesh warp", rawWarpSummary.meshWarp],
    ["grid / hybrid mesh", rawWarpSummary.hybridMesh],
    ["visibilityWeight", rawWarpSummary.visibilityWeight],
    ["warpSafetyWeight", rawWarpSummary.warpSafetyWeight],
    ["webglStatus", rawWarpSummary.webglStatus],
    ["renderTimeMs", formatMetric(rawWarpSummary.renderTimeMs)],
    ["error", rawWarpSummary.error ?? "-"],
  ])

  const warning = document.createElement("p")
  warning.className = "warning-note"
  warning.textContent =
    "注意: このワープは safety weight なしで raw displacement をそのまま適用します。顔が大きく歪む可能性があります。"

  const coordinateHeading = document.createElement("h3")
  coordinateHeading.textContent = "Coordinate debug"
  const coordinateList = document.createElement("dl")
  coordinateList.className = "summary-list"
  appendDefinitionItems(coordinateList, [
    [
      "video intrinsic",
      formatSize(coordinateDebug.videoIntrinsic.width, coordinateDebug.videoIntrinsic.height),
    ],
    [
      "preview rect",
      formatSize(coordinateDebug.previewElementRect.width, coordinateDebug.previewElementRect.height),
    ],
    ["displayed content rect", formatRect(coordinateDebug.displayedContentRect)],
    [
      "video rect",
      formatSize(coordinateDebug.videoCssRect.width, coordinateDebug.videoCssRect.height),
    ],
    [
      "raw warp canvas rect",
      formatSize(
        coordinateDebug.rawWarpCanvasCssRect.width,
        coordinateDebug.rawWarpCanvasCssRect.height,
      ),
    ],
    [
      "overlay canvas",
      formatSize(coordinateDebug.overlayCanvas.width, coordinateDebug.overlayCanvas.height),
    ],
    [
      "raw warp canvas",
      formatSize(coordinateDebug.rawWarpCanvas.width, coordinateDebug.rawWarpCanvas.height),
    ],
    ["coordinate conversion", "normalized -> displayed content pixel -> clip space"],
    ["texture upload flip", rawWarpSummary.textureUploadFlip],
    ["texture V formula", rawWarpSummary.textureVFormula],
    ["mesh mapping", "draw target triangles / sample source UVs"],
    ["source vertices vs overlay", "expected to match current478 overlay"],
  ])

  const experimentHeading = document.createElement("h3")
  experimentHeading.textContent = "Coordinate policy experiment"
  const experimentList = document.createElement("dl")
  experimentList.className = "summary-list"
  appendDefinitionItems(experimentList, [
    ["coordinate policy", "image-normalized -> displayedContentRect pixel -> clip space"],
    ["texture source", "HTMLVideoElement"],
    ["position", "target displayed pixel -> clip"],
    ["uv", "source image-normalized"],
    ["preview mode", rawWarpSummary.previewMode],
    ["texture upload flip", rawWarpSummary.textureUploadFlip],
    ["texture V formula", rawWarpSummary.textureVFormula],
    [
      "video rect",
      formatSize(coordinateDebug.videoCssRect.width, coordinateDebug.videoCssRect.height),
    ],
    [
      "raw warp canvas rect",
      formatSize(
        coordinateDebug.rawWarpCanvasCssRect.width,
        coordinateDebug.rawWarpCanvasCssRect.height,
      ),
    ],
  ])

  const heading = document.createElement("h3")
  heading.textContent = "Displacement debug"
  const summary = state.displacementDebug.summary
  const summaryList = document.createElement("dl")
  summaryList.className = "summary-list"
  appendDefinitionItems(summaryList, [
    ["available", summary.available ? "yes" : "no"],
    ["count", String(summary.count)],
    ["maxDistance2D", formatMetric(summary.maxDistance2D)],
    ["averageDistance2D", formatMetric(summary.averageDistance2D)],
    ["medianDistance2D", formatMetric(summary.medianDistance2D)],
    ["p90Distance2D", formatMetric(summary.p90Distance2D)],
    ["largeDisplacementCount", String(summary.largeDisplacementCount)],
    ["largeDisplacementThreshold", formatMetric(summary.largeDisplacementThreshold)],
    ["error", summary.error ?? "-"],
    ["alignment", "bounds center + uniform scale"],
    ["mesh warp", "prototype"],
    ["grid / hybrid mesh", "not implemented"],
  ])

  const topHeading = document.createElement("h3")
  topHeading.textContent = "Top displacements"
  const topList = document.createElement("dl")
  topList.className = "summary-list"
  const topItems =
    summary.topDisplacementsPreview.length === 0
      ? [["preview", "-"] as [string, string]]
      : summary.topDisplacementsPreview.map(
          (item) =>
            [
              `#${item.index}`,
              `distance ${formatMetric(item.distance2D)} / dx ${formatMetric(item.dx)} / dy ${formatMetric(item.dy)}`,
            ] as [string, string],
        )
  appendDefinitionItems(topList, topItems)
  fragment.append(
    warpHeading,
    warning,
    rawWarpList,
    coordinateHeading,
    coordinateList,
    experimentHeading,
    experimentList,
    heading,
    summaryList,
    topHeading,
    topList,
  )
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
    livePreviewMode: state.livePreviewMode,
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
    displacement: getDisplacementRawState(),
    rawWarp: getRawWarpRawState(),
    warpCoordinateDebug: getWarpCoordinateDebugRawState(),
    rawWarpCoordinateExperiment: getRawWarpCoordinateExperimentRawState(),
    logs: state.logs,
  }
}

function getDisplacementRawState() {
  const summary = state.displacementDebug.summary
  return {
    available: summary.available,
    count: summary.count,
    maxDistance2D: roundMetricForState(summary.maxDistance2D),
    averageDistance2D: roundMetricForState(summary.averageDistance2D),
    medianDistance2D: roundMetricForState(summary.medianDistance2D),
    p90Distance2D: roundMetricForState(summary.p90Distance2D),
    largeDisplacementCount: summary.largeDisplacementCount,
    largeDisplacementThreshold: roundMetricForState(summary.largeDisplacementThreshold),
    topDisplacementsPreview: summary.topDisplacementsPreview.map((item) => ({
      index: item.index,
      distance2D: roundMetricForState(item.distance2D),
      dx: roundMetricForState(item.dx),
      dy: roundMetricForState(item.dy),
    })),
    error: summary.error,
  }
}

function getRawWarpRawState() {
  const summary = state.rawWarpDebug.summary
  return {
    enabled: summary.enabled,
    available: summary.available,
    mode: summary.mode,
    strength: roundMetricForState(summary.strength),
    previewMode: summary.previewMode,
    textureUploadFlip: summary.textureUploadFlip,
    textureVFormula: summary.textureVFormula,
    meshMapping: summary.meshMapping,
    coordinateConversion: summary.coordinateConversion,
    sourceVertexCount: summary.sourceVertexCount,
    targetVertexCount: summary.targetVertexCount,
    topology: summary.topology,
    topologyLandmarkCount: summary.topologyLandmarkCount,
    triangleCount: summary.triangleCount,
    alignment: summary.alignment,
    meshWarp: summary.meshWarp,
    visibilityWeight: summary.visibilityWeight,
    warpSafetyWeight: summary.warpSafetyWeight,
    hybridMesh: summary.hybridMesh,
    webglStatus: summary.webglStatus,
    renderTimeMs: roundMetricForState(summary.renderTimeMs),
    error: summary.error,
  }
}

function getWarpCoordinateDebugRawState() {
  const summary = state.rawWarpDebug.summary
  const coordinateDebug = summary.coordinateDebug
  return {
    videoIntrinsic: coordinateDebug.videoIntrinsic,
    previewElementRect: roundSizeDebug(coordinateDebug.previewElementRect),
    displayedContentRect: roundRectDebug(coordinateDebug.displayedContentRect),
    videoCssRect: roundSizeDebug(coordinateDebug.videoCssRect),
    rawWarpCanvasCssRect: roundSizeDebug(coordinateDebug.rawWarpCanvasCssRect),
    overlayCanvas: roundSizeDebug(coordinateDebug.overlayCanvas),
    rawWarpCanvas: roundSizeDebug(coordinateDebug.rawWarpCanvas),
    textureUploadFlip: summary.textureUploadFlip,
    textureVFormula: summary.textureVFormula,
    meshMapping: summary.meshMapping,
  }
}

function getRawWarpCoordinateExperimentRawState() {
  const summary = state.rawWarpDebug.summary
  const coordinateDebug = summary.coordinateDebug
  return {
    previewMode: state.livePreviewMode,
    coordinatePolicy: "image_normalized_to_displayed_content_pixel_to_clip_space",
    textureSource: "HTMLVideoElement",
    positionSource: "target_displayed_pixel_clip",
    uvSource: "source_image_normalized",
    textureUploadFlip: summary.textureUploadFlip,
    textureVFormula: summary.textureVFormula,
    videoCssRect: roundSizeDebug(coordinateDebug.videoCssRect),
    rawWarpCanvasCssRect: roundSizeDebug(coordinateDebug.rawWarpCanvasCssRect),
    sampleVertices: getWarpCoordinateSamplePreview(),
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

  if (state.overlay.showDisplacement && state.displacementDebug.available) {
    drawDisplacementOverlay(context, displayedContentRect, state.displacementDebug.displacements)
  }

  if (state.overlay.showRawWarpCoordinateDebug && state.displacementDebug.available) {
    drawRawWarpCoordinateDebugOverlay(
      context,
      displayedContentRect,
      rect.width,
      rect.height,
      state.displacementDebug.displacements,
    )
  }
}

function drawAllOverlays() {
  drawRawWarpPreview()
  drawModelOverlay()
  drawLiveOverlay()
}

function drawRawWarpPreview() {
  if (!state.overlay.showRawWarp) {
    clearRawWarpCanvas()
    updateRawWarpSummary()
    return
  }

  const availabilityError = getRawWarpAvailabilityError()
  const rect = liveRawWarpCanvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  liveRawWarpCanvas.width = Math.max(1, Math.round(rect.width * dpr))
  liveRawWarpCanvas.height = Math.max(1, Math.round(rect.height * dpr))

  if (
    availabilityError ||
    state.activePreviewTab !== "live" ||
    rect.width <= 0 ||
    rect.height <= 0 ||
    liveRawWarpCanvas.width <= 1 ||
    liveRawWarpCanvas.height <= 1
  ) {
    clearRawWarpCanvas()
    updateRawWarpSummary({
      error: availabilityError ?? "rawWarpCanvasUnavailable",
      webglStatus: state.rawWarpDebug.summary.webglStatus,
      renderTimeMs: null,
    })
    return
  }

  const renderer = getRawWarpRenderer()
  if (!renderer) {
    clearRawWarpCanvas()
    updateRawWarpSummary({
      error: rawWarpRendererError ?? "WebGL renderer unavailable",
      webglStatus: "unavailable",
      renderTimeMs: null,
    })
    return
  }

  const displayedContentRect = getDisplayedContentRect(
    state.liveVideo,
    liveVideoElement,
    rect.width,
    rect.height,
  )
  const frame = buildRawWarpFrame(displayedContentRect, rect.width, rect.height)

  if (!frame) {
    clearRawWarpCanvas()
    updateRawWarpSummary({
      error: "rawWarpFrameUnavailable",
      webglStatus: "available",
      renderTimeMs: null,
    })
    return
  }

  const startedAt = performance.now()
  const renderError = drawRawWarpWebglFrame(
    renderer,
    liveVideoElement,
    frame.targetPositions,
    frame.textureCoordinates,
  )

  if (renderError) {
    updateRawWarpSummary({
      error: renderError,
      webglStatus: "unavailable",
      renderTimeMs: null,
    })
    return
  }

  updateRawWarpSummary({
    error: null,
    webglStatus: "available",
    renderTimeMs: performance.now() - startedAt,
  })
}

function buildRawWarpFrame(
  displayedContentRect: Rect,
  containerWidth: number,
  containerHeight: number,
) {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return null
  }

  const targetPositions = new Float32Array(MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT * 2)
  const textureCoordinates = new Float32Array(MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT * 2)

  for (let index = 0; index < MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT; index += 1) {
    const displacement = state.displacementDebug.displacements[index]

    if (!displacement) {
      return null
    }

    const targetX =
      displacement.current.x + displacement.dx * state.rawWarpDebug.strength
    const targetY =
      displacement.current.y + displacement.dy * state.rawWarpDebug.strength
    const targetPixel = normalizedLandmarkToPreviewPixel(
      { x: targetX, y: targetY },
      displayedContentRect,
    )
    const offset = index * 2

    const targetClip = previewPixelToClip(targetPixel, containerWidth, containerHeight)

    targetPositions[offset] = targetClip.x
    targetPositions[offset + 1] = targetClip.y
    textureCoordinates[offset] = displacement.current.x
    textureCoordinates[offset + 1] = getTextureVCoordinate(displacement.current.y)
  }

  return {
    targetPositions,
    textureCoordinates,
  }
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

function drawDisplacementOverlay(
  context: CanvasRenderingContext2D,
  displayedContentRect: Rect,
  displacements: LandmarkDisplacement[],
) {
  context.save()
  context.lineWidth = 1

  for (let index = 0; index < displacements.length; index += DISPLACEMENT_DRAW_STEP) {
    const displacement = displacements[index]
    const current = normalizedLandmarkToPreviewPixel(displacement.current, displayedContentRect)
    const ideal = normalizedLandmarkToPreviewPixel(displacement.alignedIdeal, displayedContentRect)
    const isLarge = displacement.distance2D >= LARGE_DISPLACEMENT_THRESHOLD

    context.strokeStyle = isLarge ? "rgba(244, 67, 54, 0.82)" : "rgba(255, 213, 79, 0.72)"
    context.beginPath()
    context.moveTo(current.x, current.y)
    context.lineTo(ideal.x, ideal.y)
    context.stroke()

    context.fillStyle = "rgba(79, 128, 255, 0.92)"
    context.beginPath()
    context.arc(current.x, current.y, 2, 0, Math.PI * 2)
    context.fill()

    context.fillStyle = "rgba(255, 145, 0, 0.92)"
    context.beginPath()
    context.arc(ideal.x, ideal.y, 2, 0, Math.PI * 2)
    context.fill()
  }

  context.restore()
}

function drawRawWarpCoordinateDebugOverlay(
  context: CanvasRenderingContext2D,
  displayedContentRect: Rect,
  canvasWidth: number,
  canvasHeight: number,
  displacements: LandmarkDisplacement[],
) {
  context.save()
  context.lineWidth = 1

  context.strokeStyle = "rgba(0, 200, 180, 0.9)"
  context.setLineDash([5, 4])
  context.strokeRect(
    displayedContentRect.x,
    displayedContentRect.y,
    displayedContentRect.width,
    displayedContentRect.height,
  )

  context.strokeStyle = "rgba(200, 80, 255, 0.65)"
  context.setLineDash([2, 5])
  context.strokeRect(0.5, 0.5, Math.max(0, canvasWidth - 1), Math.max(0, canvasHeight - 1))
  context.setLineDash([])

  for (
    let index = 0;
    index < MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT;
    index += WARP_COORDINATE_DEBUG_DRAW_STEP
  ) {
    const displacement = displacements[index]
    if (!displacement) {
      continue
    }

    const source = normalizedLandmarkToPreviewPixel(displacement.current, displayedContentRect)
    const target = normalizedLandmarkToPreviewPixel(
      {
        x: displacement.current.x + displacement.dx * state.rawWarpDebug.strength,
        y: displacement.current.y + displacement.dy * state.rawWarpDebug.strength,
      },
      displayedContentRect,
    )

    context.strokeStyle = "rgba(255, 255, 255, 0.65)"
    context.beginPath()
    context.moveTo(source.x, source.y)
    context.lineTo(target.x, target.y)
    context.stroke()

    context.fillStyle = "rgba(79, 128, 255, 0.96)"
    context.beginPath()
    context.arc(source.x, source.y, 2.2, 0, Math.PI * 2)
    context.fill()

    context.fillStyle = "rgba(255, 145, 0, 0.96)"
    context.beginPath()
    context.arc(target.x, target.y, 2.2, 0, Math.PI * 2)
    context.fill()
  }

  context.restore()
}

function getRawWarpRenderer(): RawWarpWebglRenderer | null {
  if (rawWarpRenderer) {
    return rawWarpRenderer
  }

  if (rawWarpRendererError) {
    return null
  }

  const gl = liveRawWarpCanvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    premultipliedAlpha: false,
  })

  if (!gl) {
    rawWarpRendererError = "WebGL context is unavailable"
    return null
  }

  const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;

    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_texCoord = a_texCoord;
    }
  `
  const fragmentShaderSource = `
    precision mediump float;

    uniform sampler2D u_texture;
    varying vec2 v_texCoord;

    void main() {
      gl_FragColor = texture2D(u_texture, v_texCoord);
    }
  `
  const vertexShader = compileRawWarpShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
  const fragmentShader = compileRawWarpShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)

  if (!vertexShader || !fragmentShader) {
    rawWarpRendererError = rawWarpRendererError ?? "WebGL shader compile failed"
    return null
  }

  const program = gl.createProgram()
  if (!program) {
    rawWarpRendererError = "WebGL program creation failed"
    return null
  }

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    rawWarpRendererError = gl.getProgramInfoLog(program) ?? "WebGL program link failed"
    return null
  }

  const positionBuffer = gl.createBuffer()
  const texCoordBuffer = gl.createBuffer()
  const indexBuffer = gl.createBuffer()
  const texture = gl.createTexture()
  const textureLocation = gl.getUniformLocation(program, "u_texture")
  const positionLocation = gl.getAttribLocation(program, "a_position")
  const texCoordLocation = gl.getAttribLocation(program, "a_texCoord")

  if (
    !positionBuffer ||
    !texCoordBuffer ||
    !indexBuffer ||
    !texture ||
    !textureLocation
  ) {
    rawWarpRendererError = "WebGL buffer, texture, or uniform creation failed"
    return null
  }

  if (positionLocation < 0 || texCoordLocation < 0) {
    rawWarpRendererError = "WebGL attribute location is unavailable"
    return null
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(MEDIAPIPE_FACE_MESH_TRIANGLES),
    gl.STATIC_DRAW,
  )

  rawWarpRenderer = {
    canvas: liveRawWarpCanvas,
    gl,
    program,
    positionBuffer,
    texCoordBuffer,
    indexBuffer,
    texture,
    positionLocation,
    texCoordLocation,
    textureLocation,
  }

  return rawWarpRenderer
}

function compileRawWarpShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type)

  if (!shader) {
    rawWarpRendererError = "WebGL shader creation failed"
    return null
  }

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    rawWarpRendererError = gl.getShaderInfoLog(shader) ?? "WebGL shader compile failed"
    gl.deleteShader(shader)
    return null
  }

  return shader
}

function drawRawWarpWebglFrame(
  renderer: RawWarpWebglRenderer,
  videoElement: HTMLVideoElement,
  targetPositions: Float32Array,
  textureCoordinates: Float32Array,
) {
  const { gl } = renderer

  try {
    gl.viewport(0, 0, renderer.canvas.width, renderer.canvas.height)
    gl.clearColor(0, 0, 0, state.livePreviewMode === "source" ? 0 : 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(renderer.program)
    gl.disable(gl.BLEND)

    gl.bindBuffer(gl.ARRAY_BUFFER, renderer.positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, targetPositions, gl.DYNAMIC_DRAW)
    gl.enableVertexAttribArray(renderer.positionLocation)
    gl.vertexAttribPointer(renderer.positionLocation, 2, gl.FLOAT, false, 0, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, renderer.texCoordBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, textureCoordinates, gl.DYNAMIC_DRAW)
    gl.enableVertexAttribArray(renderer.texCoordLocation)
    gl.vertexAttribPointer(renderer.texCoordLocation, 2, gl.FLOAT, false, 0, 0)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, renderer.texture)
    gl.pixelStorei(
      gl.UNPACK_FLIP_Y_WEBGL,
      state.rawWarpDebug.textureUploadFlip === "on",
    )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoElement)
    gl.uniform1i(renderer.textureLocation, 0)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, renderer.indexBuffer)
    gl.drawElements(
      gl.TRIANGLES,
      MEDIAPIPE_FACE_MESH_TRIANGLES.length,
      gl.UNSIGNED_SHORT,
      0,
    )
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }

  const webglError = gl.getError()
  return webglError === gl.NO_ERROR ? null : `WebGL error ${webglError}`
}

function clearModelOverlay() {
  clearOverlay(modelOverlayCanvas)
}

function clearLiveOverlay() {
  clearOverlay(liveOverlayCanvas)
  clearRawWarpCanvas()
}

function clearRawWarpCanvas() {
  if (rawWarpRenderer) {
    const { gl } = rawWarpRenderer
    gl.viewport(0, 0, liveRawWarpCanvas.width, liveRawWarpCanvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    return
  }

  liveRawWarpCanvas.width = liveRawWarpCanvas.width
}

function clearOverlay(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d")
  if (!context) {
    return
  }
  context.clearRect(0, 0, canvas.width, canvas.height)
}

function createEmptyVideoCoordinateDebug(): VideoCoordinateDebug {
  return {
    videoIntrinsic: {
      width: null,
      height: null,
    },
    previewElementRect: {
      width: 0,
      height: 0,
    },
    videoCssRect: {
      width: 0,
      height: 0,
    },
    rawWarpCanvasCssRect: {
      width: 0,
      height: 0,
    },
    displayedContentRect: {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    },
    overlayCanvas: {
      width: 0,
      height: 0,
    },
    rawWarpCanvas: {
      width: 0,
      height: 0,
    },
  }
}

function getLiveVideoCoordinateDebug(): VideoCoordinateDebug {
  if (typeof liveVideoElement === "undefined") {
    return createEmptyVideoCoordinateDebug()
  }

  const previewStageRect = getElement<HTMLElement>(
    "[data-preview-panel='live'] .preview-stage",
  ).getBoundingClientRect()
  const videoRect = liveVideoElement.getBoundingClientRect()
  const rawWarpCanvasRect = liveRawWarpCanvas.getBoundingClientRect()
  const displayedContentRect = getDisplayedContentRect(
    state.liveVideo,
    liveVideoElement,
    rawWarpCanvasRect.width,
    rawWarpCanvasRect.height,
  )

  return {
    videoIntrinsic: {
      width: (state.liveVideo.width ?? liveVideoElement.videoWidth) || null,
      height: (state.liveVideo.height ?? liveVideoElement.videoHeight) || null,
    },
    previewElementRect: {
      width: previewStageRect.width,
      height: previewStageRect.height,
    },
    videoCssRect: {
      width: videoRect.width,
      height: videoRect.height,
    },
    rawWarpCanvasCssRect: {
      width: rawWarpCanvasRect.width,
      height: rawWarpCanvasRect.height,
    },
    displayedContentRect,
    overlayCanvas: {
      width: liveOverlayCanvas.width,
      height: liveOverlayCanvas.height,
    },
    rawWarpCanvas: {
      width: liveRawWarpCanvas.width,
      height: liveRawWarpCanvas.height,
    },
  }
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

function getTextureVCoordinate(sourceY: number) {
  return state.rawWarpDebug.textureVFormula === "oneMinusY" ? 1 - sourceY : sourceY
}

function previewPixelToClip(
  point: { x: number; y: number },
  canvasWidth: number,
  canvasHeight: number,
) {
  return {
    x: (point.x / canvasWidth) * 2 - 1,
    y: 1 - (point.y / canvasHeight) * 2,
  }
}

function getWarpCoordinateSamplePreview() {
  if (!state.displacementDebug.available) {
    return []
  }

  const rawWarpCanvasRect = liveRawWarpCanvas.getBoundingClientRect()
  if (rawWarpCanvasRect.width <= 0 || rawWarpCanvasRect.height <= 0) {
    return []
  }

  const displayedContentRect = getDisplayedContentRect(
    state.liveVideo,
    liveVideoElement,
    rawWarpCanvasRect.width,
    rawWarpCanvasRect.height,
  )

  return WARP_SAMPLE_INDICES.flatMap((sampleIndex) => {
    const displacement = state.displacementDebug.displacements[sampleIndex]
    if (!displacement) {
      return []
    }

    const sourceNormalized = {
      x: displacement.current.x,
      y: displacement.current.y,
    }
    const targetNormalized = {
      x: displacement.current.x + displacement.dx * state.rawWarpDebug.strength,
      y: displacement.current.y + displacement.dy * state.rawWarpDebug.strength,
    }
    const sourceDisplayedPixel = normalizedLandmarkToPreviewPixel(
      sourceNormalized,
      displayedContentRect,
    )
    const targetDisplayedPixel = normalizedLandmarkToPreviewPixel(
      targetNormalized,
      displayedContentRect,
    )
    const targetClip = previewPixelToClip(
      targetDisplayedPixel,
      rawWarpCanvasRect.width,
      rawWarpCanvasRect.height,
    )

    return [
      {
        index: sampleIndex,
        sourceNormalized: roundPointForState(sourceNormalized),
        targetNormalized: roundPointForState(targetNormalized),
        sourceDisplayedPixel: roundPointForState(sourceDisplayedPixel),
        targetDisplayedPixel: roundPointForState(targetDisplayedPixel),
        targetClip: roundPointForState(targetClip),
        uv: roundUvForState({
          u: displacement.current.x,
          v: getTextureVCoordinate(displacement.current.y),
        }),
      },
    ]
  })
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

function formatRect(rect: Rect) {
  return `x ${formatMetric(rect.x)} / y ${formatMetric(rect.y)} / width ${formatMetric(rect.width)} / height ${formatMetric(rect.height)}`
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

function roundSizeDebug(size: SizeDebug): SizeDebug {
  return {
    width: roundMetricForState(size.width) ?? 0,
    height: roundMetricForState(size.height) ?? 0,
  }
}

function roundRectDebug(rect: Rect): Rect {
  return {
    x: roundMetricForState(rect.x) ?? 0,
    y: roundMetricForState(rect.y) ?? 0,
    width: roundMetricForState(rect.width) ?? 0,
    height: roundMetricForState(rect.height) ?? 0,
  }
}

function roundPointForState(point: { x: number; y: number }) {
  return {
    x: roundMetricForState(point.x) ?? 0,
    y: roundMetricForState(point.y) ?? 0,
  }
}

function roundUvForState(point: { u: number; v: number }) {
  return {
    u: roundMetricForState(point.u) ?? 0,
    v: roundMetricForState(point.v) ?? 0,
  }
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

function isLivePreviewMode(value: string | undefined): value is LivePreviewMode {
  return value === "source" || value === "rawWarpOnly" || value === "sideBySide"
}

function isTextureUploadFlip(value: string | undefined): value is TextureUploadFlip {
  return value === "off" || value === "on"
}

function isTextureVFormula(value: string | undefined): value is TextureVFormula {
  return value === "y" || value === "oneMinusY"
}

function isDebugTab(value: string | undefined): value is DebugTab {
  return debugTabs.some((tab) => tab.value === value)
}
