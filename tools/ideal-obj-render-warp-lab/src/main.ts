import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision"
import type { Matrix, NormalizedLandmark } from "@mediapipe/tasks-vision"
import "./style.css"

type PreviewTab = "obj" | "renderedIdeal" | "live"
type DebugTab = "summary" | "current" | "obj" | "renderedIdeal" | "realtime" | "mediaPipeBenchmark" | "warpMesh" | "raw"
type PlaybackStatus = "stopped" | "playing" | "paused"
type ObjParseStatus = "not_loaded" | "not_parsed" | "parsed" | "error"
type ObjPreviewMode = "points" | "wireframe" | "points_wireframe"
type ObjPreviewStatus = "not_ready" | "ready" | "error"
type RenderedIdealRenderStatus = "not_ready" | "ready" | "rendered" | "error"
type RenderedIdealRenderMode = "shaded_faces"
type RenderedIdealBackgroundMode = "light" | "dark"
type RenderedIdealColorMode = "clay" | "grayscale"
type LiveVideoStatus = "not_loaded" | "loaded" | "metadata_ready" | "error"
type CurrentAnalysisStatus =
  | "not_ready"
  | "ready"
  | "analyzing"
  | "detected"
  | "no_face"
  | "error"
type MediaPipeStatus =
  | "uninitialized"
  | "initializing"
  | "ready"
  | "disposed"
  | "error"
type RealtimeMode =
  | "current_analysis_obj_render"
  | "current_analysis_obj_render_mediapipe_redetect"
type RealtimeStatus =
  | "idle"
  | "running"
  | "stopped"
  | "error"
type MediaPipeBenchmarkDelegate = "default" | "CPU" | "GPU"
type MediaPipeBenchmarkOutputMode =
  | "landmarks_only"
  | "landmarks_matrix"
  | "landmarks_blendshapes"
  | "landmarks_matrix_blendshapes"
type MediaPipeBenchmarkStatus =
  | "idle"
  | "running"
  | "done"
  | "error"
type ExpressionGroup =
  | "neutral"
  | "mouthSmile"
  | "jawOpen"
  | "mouthPucker"
  | "eyeBlink"
  | "eyeSquint"
  | "mixedExpression"
  | "unknown"

type TabOption<TValue extends string> = {
  label: string
  value: TValue
}

type ObjFileState = {
  loaded: boolean
  fileName: string | null
  fileSize: number | null
  fileType: string | null
}

type ObjVertex = {
  x: number
  y: number
  z: number
}

type ObjFace = {
  indices: number[]
}

type ObjEdge = {
  a: number
  b: number
}

type ObjBounds = {
  minX: number
  minY: number
  minZ: number
  maxX: number
  maxY: number
  maxZ: number
}

type ObjSummary = {
  fileName: string
  fileSize: number
  fileType: string
  parseStatus: ObjParseStatus
  vertexCount: number
  faceCount: number
  triangleFaceCount: number
  polygonFaceCount: number
  bounds: ObjBounds | null
  center: { x: number; y: number; z: number } | null
  size: { x: number; y: number; z: number } | null
  maxDimension: number | null
  warningCount: number
  warningsPreview: string[]
}

type ObjParseResult = {
  vertices: ObjVertex[]
  faces: ObjFace[]
  warnings: string[]
}

type ObjGeometryState = {
  vertices: ObjVertex[]
  faces: ObjFace[]
  edges: ObjEdge[]
}

type ObjPreviewState = {
  yawDeg: number
  pitchDeg: number
  rollDeg: number
  zoom: number
  panX: number
  panY: number
  mode: ObjPreviewMode
  maxPoints: number
  maxEdges: number
}

type ObjPoseSyncState = {
  enabled: boolean
  yawSign: 1 | -1
  pitchSign: 1 | -1
  rollSign: 1 | -1
  yawOffsetDeg: number
  pitchOffsetDeg: number
  rollOffsetDeg: number
  rotationCenterX: number
  rotationCenterY: number
  rotationCenterZ: number
  appliedYawDeg: number | null
  appliedPitchDeg: number | null
  appliedRollDeg: number | null
  source: "none" | "current_frame"
}

type ObjPreviewStats = {
  sampledPointCount: number
  sampledEdgeCount: number
}

type RenderedIdealRenderSummary = {
  status: RenderedIdealRenderStatus
  canvasWidth: number
  canvasHeight: number
  renderMode: RenderedIdealRenderMode
  faceCount: number
  drawnFaceCount: number
  skippedFaceCount: number
  lightDirection: { x: number; y: number; z: number }
  appliedYawDeg: number | null
  appliedPitchDeg: number | null
  appliedRollDeg: number | null
  rotationCenter: { x: number; y: number; z: number }
  errorMessage: string | null
}

type RenderedIdealState = {
  backgroundMode: RenderedIdealBackgroundMode
  colorMode: RenderedIdealColorMode
  summary: RenderedIdealRenderSummary
}

type ReferenceLandmark = {
  index: number
  x: number
  y: number
  z: number
}

type ReferencePose = {
  yaw: number | null
  pitch: number | null
  roll: number | null
}

type ReferenceBlendshape = {
  categoryName: string
  score: number
}

type ExpressionSummary = {
  group: ExpressionGroup
  topBlendshapes: ReferenceBlendshape[]
  missingBlendshapeKeys: string[]
}

type QualitySummary = {
  status: "not_ready" | "valid" | "no_face" | "invalid_landmarks" | "error"
  expectedLandmarkCount: number
  landmarkCount: number
  hasPose: boolean
}

type LiveVideoState = {
  loaded: boolean
  fileName: string | null
  fileSize: number | null
  fileType: string | null
  objectUrl: string | null
  durationSec: number | null
  width: number | null
  height: number | null
  currentTimeSec: number | null
  playbackStatus: PlaybackStatus
  status: LiveVideoStatus
  errorMessage: string | null
}

type CurrentFrameAnalysis = {
  status: CurrentAnalysisStatus
  analyzedTimeSec: number | null
  landmarks478: ReferenceLandmark[]
  landmarkCount: number
  pose: ReferencePose
  blendshapes: ReferenceBlendshape[]
  expressionSummary: ExpressionSummary | null
  qualityScore: number | null
  qualitySummary: QualitySummary
  errorMessage: string | null
}

type CurrentAnalysisTimingBreakdown = {
  mediaPipeDetectMs: number | null
  buildCurrentAnalysisMs: number | null
  liveOverlayDrawMs: number | null
  debugUpdateMs: number | null
  currentAnalysisTotalMs: number | null
}

type RealtimeDebugState = {
  status: RealtimeStatus
  mode: RealtimeMode
  targetFps: number
  frameCount: number
  skippedCount: number
  errorCount: number
  currentAnalysisMs: number | null
  objRenderMs: number | null
  mediaPipeRedetectMs: number | null
  totalMs: number | null
  currentAnalysisTimingBreakdown: CurrentAnalysisTimingBreakdown
  averageCurrentAnalysisTimingBreakdown: CurrentAnalysisTimingBreakdown
  averageObjRenderMs: number | null
  averageTotalMs: number | null
  effectiveFps: number | null
  lastUpdatedAt: string | null
  errorMessage: string | null
  timeupdateAnalysisRequestCount: number
  realtimeTickAnalysisRequestCount: number
  skippedByInProgressCount: number
  skippedByNoVideoCount: number
  skippedByPausedVideoCount: number
}

type RealtimeTimingSample = {
  currentAnalysisTimingBreakdown: CurrentAnalysisTimingBreakdown
  objRenderMs: number | null
  totalMs: number | null
}

type RenderUpdateTiming = {
  liveOverlayDrawMs: number | null
  debugUpdateMs: number | null
}

type MediaPipeBenchmarkResult = {
  id: string
  createdAt: string
  delegate: MediaPipeBenchmarkDelegate
  outputMode: MediaPipeBenchmarkOutputMode
  iterationCount: number
  initializationMs: number | null
  firstDetectMs: number | null
  averageDetectMs: number | null
  warmDetectAverageMs: number | null
  minDetectMs: number | null
  maxDetectMs: number | null
  successCount: number
  errorCount: number
  errorMessage: string | null
  videoWidth: number | null
  videoHeight: number | null
  videoCurrentTimeSec: number | null
}

type MediaPipeBenchmarkState = {
  status: MediaPipeBenchmarkStatus
  selectedDelegate: MediaPipeBenchmarkDelegate
  selectedOutputMode: MediaPipeBenchmarkOutputMode
  iterationCount: number
  latestResult: MediaPipeBenchmarkResult | null
  results: MediaPipeBenchmarkResult[]
  errorMessage: string | null
}

type Rect = {
  x: number
  y: number
  width: number
  height: number
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
    showTriangleMesh: boolean
  }
  objFile: ObjFileState
  objSummary: ObjSummary
  objGeometry: ObjGeometryState
  objPreview: ObjPreviewState
  objPreviewStats: ObjPreviewStats
  objPoseSync: ObjPoseSyncState
  objPoseSyncStats: ObjPreviewStats
  renderedIdeal: RenderedIdealState
  objErrorMessage: string | null
  liveVideo: LiveVideoState
  liveMediaPipe: {
    status: MediaPipeStatus
    error: string | null
    liveTimestampMs: number
  }
  currentAnalysis: CurrentFrameAnalysis
  realtimeDebug: RealtimeDebugState
  mediaPipeBenchmark: MediaPipeBenchmarkState
  logs: string[]
}

type FaceLandmarkerResultLike = ReturnType<FaceLandmarker["detectForVideo"]>
type FaceLandmarkerOptions = Parameters<typeof FaceLandmarker.createFromOptions>[1]

const LAB_NAME = "Ideal OBJ Render Warp Lab"
const MEDIAPIPE_WASM_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
const MEDIAPIPE_FACE_LANDMARKER_MODEL_ASSET_PATH =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
const REQUIRED_LANDMARK_COUNT = 478
const LANDMARK_PREVIEW_COUNT = 5
const MEDIAPIPE_TIMESTAMP_STEP_MS = 1000 / 30
const LIVE_AUTO_ANALYSIS_INTERVAL_SEC = 0.35
const REALTIME_TARGET_FPS_OPTIONS = [5, 10, 15, 30] as const
const REALTIME_AVERAGE_SAMPLE_COUNT = 30
const MEDIAPIPE_BENCHMARK_ITERATION_OPTIONS = [10, 30, 60] as const
const RAD_TO_DEG = 180 / Math.PI
const STRONG_EXPRESSION_THRESHOLD = 0.35
const MIXED_EXPRESSION_THRESHOLD = 0.28
const RENDERED_IDEAL_FALLBACK_CANVAS_SIZE = 640
const RENDERED_IDEAL_LIGHT_DIRECTION = normalizeVector({ x: -0.35, y: 0.55, z: 0.76 })
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
  { label: "OBJ", value: "obj" },
  { label: "レンダー理想", value: "renderedIdeal" },
  { label: "ライブ", value: "live" },
]

const debugTabs: TabOption<DebugTab>[] = [
  { label: "概要", value: "summary" },
  { label: "現在顔", value: "current" },
  { label: "OBJ", value: "obj" },
  { label: "レンダー理想", value: "renderedIdeal" },
  { label: "リアルタイム", value: "realtime" },
  { label: "MediaPipe比較", value: "mediaPipeBenchmark" },
  { label: "ワープメッシュ", value: "warpMesh" },
  { label: "Raw Debug", value: "raw" },
]

const realtimeModeLabels: Record<RealtimeMode, string> = {
  current_analysis_obj_render: "現在顔解析 + OBJレンダー",
  current_analysis_obj_render_mediapipe_redetect: "現在顔解析 + OBJレンダー + MediaPipe再検出",
}

const mediaPipeBenchmarkDelegateLabels: Record<MediaPipeBenchmarkDelegate, string> = {
  default: "未指定",
  CPU: "CPU（CPU実行）",
  GPU: "GPU（GPU実行）",
}

const mediaPipeBenchmarkOutputModeLabels: Record<MediaPipeBenchmarkOutputMode, string> = {
  landmarks_only: "478点のみ",
  landmarks_matrix: "478点 + matrix（顔姿勢行列）",
  landmarks_blendshapes: "478点 + blendshapes（表情係数）",
  landmarks_matrix_blendshapes: "478点 + matrix + blendshapes",
}

const state: LabState = {
  activePreviewTab: "obj",
  activeDebugTab: "summary",
  overlay: {
    showLandmarks478: true,
    showMeshSource: true,
    showMeshTarget: true,
    showMeshPairs: false,
    showExcludedLandmarks: false,
    showGridAnchors: true,
    showTriangleMesh: false,
  },
  objFile: {
    loaded: false,
    fileName: null,
    fileSize: null,
    fileType: null,
  },
  objSummary: createEmptyObjSummary(),
  objGeometry: createEmptyObjGeometry(),
  objPreview: createDefaultObjPreviewState(),
  objPreviewStats: {
    sampledPointCount: 0,
    sampledEdgeCount: 0,
  },
  objPoseSync: createDefaultObjPoseSyncState(),
  objPoseSyncStats: {
    sampledPointCount: 0,
    sampledEdgeCount: 0,
  },
  renderedIdeal: createDefaultRenderedIdealState(),
  objErrorMessage: null,
  liveVideo: createEmptyLiveVideoState(),
  liveMediaPipe: {
    status: "uninitialized",
    error: null,
    liveTimestampMs: 0,
  },
  currentAnalysis: createEmptyCurrentAnalysis(),
  realtimeDebug: createDefaultRealtimeDebugState(),
  mediaPipeBenchmark: createDefaultMediaPipeBenchmarkState(),
  logs: ["ラボを初期化しました。レンダー理想2D preview は使用できます。renderedIdeal478 / WebGL warp は未実装です。"],
}

const app = document.querySelector<HTMLDivElement>("#app")

if (!app) {
  throw new Error("#app が見つかりません。")
}

app.innerHTML = `
  <main class="lab-shell">
    <section class="panel left-panel" aria-label="操作">
      <div class="title-block">
        <p class="eyebrow">Ideal OBJ Render Warp Lab</p>
        <h1>理想OBJレンダー・ワープ検証ラボ</h1>
      </div>
      <div class="control-group">
        <button class="primary-button" type="button" data-action="load-obj">OBJ読込</button>
        <button class="primary-button" type="button" data-action="load-live">ライブ動画読込</button>
        <button class="secondary-button" type="button" data-action="export-debug">デバッグ出力</button>
      </div>
      <input class="visually-hidden" type="file" accept=".obj,text/plain,model/obj" data-input="obj-file" />
      <input class="visually-hidden" type="file" accept="video/*" data-input="live-video" />
      <div class="status-note">
        OBJ読込と Canvas 2D preview に加えて、ライブ動画の current frame を MediaPipe で解析します。今回は current478 overlay までを確認し、renderedIdeal478 や mesh warp はまだ接続しません。
      </div>
      <p class="export-status" data-debug-export-status></p>
    </section>

    <section class="panel center-panel" aria-label="プレビュー">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Preview</p>
          <h2>プレビュー</h2>
        </div>
        <div class="overlay-toggles">
          ${renderOverlayToggle("toggle-landmarks", "478点を表示")}
          ${renderOverlayToggle("toggle-mesh-source", "mesh sourceを表示")}
          ${renderOverlayToggle("toggle-mesh-target", "mesh targetを表示")}
          ${renderOverlayToggle("toggle-mesh-pairs", "対応線を表示")}
          ${renderOverlayToggle("toggle-excluded-landmarks", "除外landmarkを表示")}
          ${renderOverlayToggle("toggle-grid-anchors", "grid / anchorsを表示")}
          ${renderOverlayToggle("toggle-triangle-mesh", "triangle meshを表示")}
        </div>
      </div>
      ${renderTabs("preview", previewTabs, state.activePreviewTab)}
      <div class="preview-stack">
        ${renderObjPreview()}
        ${renderRenderedIdealPreview()}
        ${renderLivePreview()}
      </div>
    </section>

    <section class="panel right-panel" aria-label="デバッグ">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Debug</p>
          <h2>デバッグ</h2>
        </div>
      </div>
      ${renderTabs("debug", debugTabs, state.activeDebugTab)}
      <div class="debug-content" data-debug-content></div>
    </section>
  </main>
`

const objFileInput = getElement<HTMLInputElement>("[data-input='obj-file']")
const liveFileInput = getElement<HTMLInputElement>("[data-input='live-video']")
const liveVideoElement = getElement<HTMLVideoElement>("[data-video='live']")
const liveOverlayCanvas = getElement<HTMLCanvasElement>("[data-overlay='live']")
const objPreviewCanvas = getElement<HTMLCanvasElement>('[data-canvas="obj-preview"]')
const renderedIdealCanvas = getElement<HTMLCanvasElement>('[data-canvas="rendered-ideal"]')
const liveObjPosePreviewCanvas = getElement<HTMLCanvasElement>('[data-canvas="live-obj-pose-preview"]')
let liveFaceLandmarker: FaceLandmarker | null = null
let liveFaceLandmarkerPromise: Promise<FaceLandmarker> | null = null
let liveAnalysisInProgress = false
let liveAnalysisRequestId = 0
let lastAutoLiveAnalysisAtSec = Number.NEGATIVE_INFINITY
let realtimeTimerId: number | null = null
let realtimeRunStartedAtMs: number | null = null
let realtimeTickInProgress = false
let realtimeTimingSamples: RealtimeTimingSample[] = []
let objPreviewDrag:
  | {
      pointerId: number
      lastX: number
      lastY: number
      mode: "rotate" | "pan"
    }
  | null = null

bindEvents()
renderAll()

function renderOverlayToggle(action: string, label: string) {
  return `
    <label class="overlay-toggle">
      <input type="checkbox" data-action="${action}" />
      <span>${label}</span>
    </label>
  `
}

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

function renderObjPreview() {
  return `
    <div class="preview-card" data-preview-panel="obj">
      <div class="preview-stage obj-preview-stage" data-obj-stage data-preview-status="not_ready">
        <canvas class="obj-preview-canvas" data-canvas="obj-preview" aria-label="OBJ 3D preview"></canvas>
        <div class="preview-placeholder obj-preview-placeholder" data-obj-preview-placeholder>
          <h3>OBJプレビュー</h3>
          <p data-obj-preview-message>OBJファイルを読み込むと、ここに OBJ 3D preview を表示します。</p>
        </div>
      </div>
      <div class="obj-preview-controls" aria-label="OBJ 3D preview 操作">
        <label class="select-field">
          <span>表示モード</span>
          <select data-control="obj-preview-mode">
            <option value="points">点群</option>
            <option value="wireframe">ワイヤー</option>
            <option value="points_wireframe">点群 + ワイヤー</option>
          </select>
        </label>
        <div class="button-row">
          <button class="small-button" type="button" data-action="obj-preview-front">正面</button>
          <button class="small-button" type="button" data-action="obj-preview-left">左</button>
          <button class="small-button" type="button" data-action="obj-preview-right">右</button>
          <button class="small-button" type="button" data-action="obj-preview-top">上</button>
          <button class="small-button" type="button" data-action="obj-preview-side">横</button>
          <button class="small-button" type="button" data-action="obj-preview-reset">表示リセット</button>
        </div>
      </div>
      <div class="obj-preview-summary" data-obj-preview-summary></div>
    </div>
  `
}

function renderRenderedIdealPreview() {
  return `
    <div class="preview-card" data-preview-panel="renderedIdeal">
      <div class="preview-stage rendered-ideal-stage" data-rendered-ideal-stage data-render-status="not_ready">
        <canvas class="rendered-ideal-canvas" data-canvas="rendered-ideal" aria-label="レンダー理想 2D preview"></canvas>
        <div class="preview-placeholder">
          <h3>レンダー理想プレビュー</h3>
          <p data-rendered-ideal-message>OBJを読み込むと、ここにレンダー理想2Dプレビューを表示します。</p>
        </div>
      </div>
      <div class="obj-preview-controls rendered-ideal-controls" aria-label="レンダー理想 preview 操作">
        <div class="button-row">
          <button class="small-button" type="button" data-action="rendered-ideal-refresh">レンダー更新</button>
        </div>
        <label class="select-field">
          <span>背景色</span>
          <select data-control="rendered-ideal-background">
            <option value="light">light</option>
            <option value="dark">dark</option>
          </select>
        </label>
        <label class="select-field">
          <span>色</span>
          <select data-control="rendered-ideal-color">
            <option value="clay">clay</option>
            <option value="grayscale">grayscale</option>
          </select>
        </label>
      </div>
      <div class="review-card" data-rendered-ideal-summary>
        <p>OBJを読み込むと、ここにレンダー理想2Dプレビューを表示します。</p>
      </div>
    </div>
  `
}

function renderLivePreview() {
  return `
    <div class="preview-card live-preview-card" data-preview-panel="live">
      <div class="live-preview-grid">
        <section class="live-column-panel" aria-label="ライブ現在顔">
          <h3>ライブ現在顔</h3>
          <div class="preview-stage live-face-stage" data-live-stage data-loaded="false">
            <video class="video-preview" data-video="live" preload="metadata" playsinline controls></video>
            <canvas class="landmark-overlay" data-overlay="live"></canvas>
            <div class="preview-placeholder">
              <h3>ライブプレビュー</h3>
              <p>ライブ動画を読み込むと、ここにライブプレビューを表示します。</p>
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
            <p class="frame-status" data-status="live-time">現在時刻: - / -</p>
          </div>
          <div class="review-card" data-live-analysis>
            <p>ライブ動画の現在フレーム解析結果はまだありません。</p>
          </div>
        </section>

        <section class="live-column-panel" aria-label="現在姿勢OBJ">
          <h3>現在姿勢OBJ</h3>
          <div class="preview-stage obj-preview-stage live-obj-preview-stage" data-live-obj-stage data-preview-status="not_ready">
            <canvas class="obj-preview-canvas" data-canvas="live-obj-pose-preview" aria-label="現在姿勢 OBJ preview"></canvas>
            <div class="preview-placeholder obj-preview-placeholder">
              <h3>現在姿勢OBJ</h3>
              <p data-live-obj-preview-message>OBJを読み込むと、現在姿勢を反映したOBJ previewを表示します。</p>
            </div>
          </div>
          <div class="obj-preview-controls live-obj-controls" aria-label="現在姿勢 OBJ preview 操作">
            <p class="control-note">現在姿勢OBJは、姿勢同期確認用のワイヤー表示です。</p>
            <div class="button-row">
              <button class="small-button" type="button" data-action="live-obj-current-pose">現在姿勢</button>
              <button class="small-button" type="button" data-action="live-obj-reset-view">表示リセット</button>
            </div>
          </div>
          <div class="pose-sync-controls" aria-label="現在姿勢 OBJ 同期設定">
            <label class="overlay-toggle">
              <input type="checkbox" data-action="obj-pose-sync-enabled" />
              <span>姿勢同期</span>
            </label>
            <label class="overlay-toggle">
              <input type="checkbox" data-action="obj-pose-yaw-invert" />
              <span>yaw反転</span>
            </label>
            <label class="overlay-toggle">
              <input type="checkbox" data-action="obj-pose-pitch-invert" />
              <span>pitch反転</span>
            </label>
            <label class="overlay-toggle">
              <input type="checkbox" data-action="obj-pose-roll-invert" />
              <span>roll反転</span>
            </label>
            <label class="number-field">
              <span>yaw補正角度</span>
              <input type="number" step="0.1" data-control="obj-pose-yaw-offset" />
            </label>
            <label class="number-field">
              <span>pitch補正角度</span>
              <input type="number" step="0.1" data-control="obj-pose-pitch-offset" />
            </label>
            <label class="number-field">
              <span>roll補正角度</span>
              <input type="number" step="0.1" data-control="obj-pose-roll-offset" />
            </label>
            <label class="number-field">
              <span>回転中心X</span>
              <input type="number" min="-0.5" max="0.5" step="0.01" data-control="obj-pose-rotation-center-x" />
            </label>
            <label class="number-field">
              <span>回転中心Y</span>
              <input type="number" min="-0.5" max="0.5" step="0.01" data-control="obj-pose-rotation-center-y" />
            </label>
            <label class="number-field">
              <span>回転中心Z</span>
              <input type="number" min="-0.5" max="0.5" step="0.01" data-control="obj-pose-rotation-center-z" />
            </label>
            <button class="small-button pose-sync-button" type="button" data-action="obj-pose-rotation-center-reset">回転中心リセット</button>
          </div>
          <div class="review-card" data-live-obj-pose-summary>
            <p>OBJを読み込むと、現在姿勢を反映したOBJ previewを表示します。</p>
          </div>
        </section>
      </div>
      <section class="realtime-control-panel" aria-label="リアルタイム検証">
        <div class="realtime-control-header">
          <div>
            <h3>リアルタイム検証</h3>
            <p>動画を再生してから「開始」を押すと、再生中のフレームに対して現在顔解析とOBJレンダーを繰り返し、処理時間を測ります。</p>
            <p class="realtime-playback-note" data-realtime-playback-note></p>
          </div>
          <div class="button-row realtime-buttons">
            <button class="small-button" type="button" data-action="realtime-start">開始</button>
            <button class="small-button" type="button" data-action="realtime-stop">停止</button>
            <button class="small-button" type="button" data-action="realtime-reset">リセット</button>
          </div>
        </div>
        <div class="realtime-control-grid">
          <fieldset class="mode-fieldset">
            <legend>処理モード</legend>
            <label class="radio-option">
              <input type="radio" name="realtime-mode" value="current_analysis_obj_render" data-control="realtime-mode" />
              <span>Mode A（現在顔解析 + OBJレンダー）</span>
            </label>
            <label class="radio-option">
              <input type="radio" name="realtime-mode" value="current_analysis_obj_render_mediapipe_redetect" data-control="realtime-mode" disabled />
              <span>Mode B（現在顔解析 + OBJレンダー + MediaPipe再検出 / 未実装）</span>
            </label>
          </fieldset>
          <label class="select-field realtime-fps-field">
            <span>目標FPS</span>
            <select data-control="realtime-target-fps">
              ${REALTIME_TARGET_FPS_OPTIONS.map((fps) => `<option value="${fps}">${fps}</option>`).join("")}
            </select>
          </label>
          <div class="realtime-inline-status" data-realtime-inline-status>
            状態: idle / 実効FPS: 未計測
          </div>
        </div>
      </section>
      <section class="benchmark-control-panel" aria-label="MediaPipe性能比較">
        <div class="realtime-control-header">
          <div>
            <h3>MediaPipe性能比較</h3>
            <p>同じフルHD入力のまま、MediaPipeの出力オプションとdelegateを切り替えて detectForVideo（動画フレーム検出）の処理時間を比較します。</p>
            <p class="realtime-playback-note" data-mediapipe-benchmark-note></p>
          </div>
          <div class="button-row realtime-buttons">
            <button class="small-button" type="button" data-action="mediapipe-benchmark-run">比較実行</button>
            <button class="small-button" type="button" data-action="mediapipe-benchmark-run-all">全条件比較</button>
            <button class="small-button" type="button" data-action="mediapipe-benchmark-reset">結果リセット</button>
          </div>
        </div>
        <div class="benchmark-control-grid">
          <label class="select-field">
            <span>実行回数</span>
            <select data-control="mediapipe-benchmark-iteration-count">
              ${MEDIAPIPE_BENCHMARK_ITERATION_OPTIONS.map((count) => `<option value="${count}">${count}</option>`).join("")}
            </select>
          </label>
          <label class="select-field">
            <span>delegate（実行バックエンド）</span>
            <select data-control="mediapipe-benchmark-delegate">
              ${Object.entries(mediaPipeBenchmarkDelegateLabels).map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}
            </select>
          </label>
          <label class="select-field benchmark-output-field">
            <span>出力オプション</span>
            <select data-control="mediapipe-benchmark-output-mode">
              ${Object.entries(mediaPipeBenchmarkOutputModeLabels).map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}
            </select>
          </label>
          <div class="realtime-inline-status" data-mediapipe-benchmark-inline-status>
            状態: 未開始 / 最新結果: 未計測
          </div>
        </div>
      </section>
    </div>
  `
}

function bindEvents() {
  getElement<HTMLButtonElement>('[data-action="load-obj"]').addEventListener("click", () => {
    objFileInput.click()
  })

  getElement<HTMLButtonElement>('[data-action="load-live"]').addEventListener("click", () => {
    liveFileInput.click()
  })

  getElement<HTMLButtonElement>('[data-action="export-debug"]').addEventListener("click", () => {
    void exportDebug()
  })

  objFileInput.addEventListener("change", (event) => {
    const file = getSelectedFile(event)
    if (file) {
      void loadObjFile(file)
    }
  })

  liveFileInput.addEventListener("change", (event) => {
    const file = getSelectedFile(event)
    if (file) {
      loadLiveVideo(file)
    }
  })

  liveVideoElement.addEventListener("loadedmetadata", () => {
    syncLiveVideoMetadata()
    addLog("ライブ動画 metadata を取得しました。")
    renderAll()
  })

  liveVideoElement.addEventListener("timeupdate", () => {
    syncLiveCurrentTime()
    drawLiveOverlay()
    maybeAnalyzeLiveFrame()
    renderAll()
  })

  liveVideoElement.addEventListener("seeked", () => {
    syncLiveCurrentTime()
    void analyzeCurrentLiveFrame("seeked")
  })

  liveVideoElement.addEventListener("error", () => {
    const message = liveVideoElement.error?.message || "動画の読み込みに失敗しました。"
    state.liveVideo.status = "error"
    state.liveVideo.errorMessage = message
    addLog(`ライブ動画読み込みでエラーが発生しました: ${message}`)
    renderAll()
  })

  liveVideoElement.addEventListener("play", () => {
    state.liveVideo.playbackStatus = "playing"
    renderAll()
  })

  liveVideoElement.addEventListener("pause", () => {
    state.liveVideo.playbackStatus = state.liveVideo.loaded ? "paused" : "stopped"
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

  getElement<HTMLButtonElement>('[data-action="live-play"]').addEventListener("click", () => {
    if (!state.liveVideo.loaded) {
      addLog("ライブ動画が未読込のため再生できません。")
      renderAll()
      return
    }
    void liveVideoElement.play().catch((error) => {
      const message = error instanceof Error ? error.message : String(error)
      addLog(`ライブ動画の再生に失敗しました: ${message}`)
      renderAll()
    })
  })

  getElement<HTMLButtonElement>('[data-action="live-pause"]').addEventListener("click", () => {
    liveVideoElement.pause()
  })

  getElement<HTMLButtonElement>('[data-action="live-analyze-current"]').addEventListener(
    "click",
    () => {
      void analyzeCurrentLiveFrame("manual")
    },
  )

  getElement<HTMLButtonElement>('[data-action="rendered-ideal-refresh"]').addEventListener("click", () => {
    renderAll()
  })

  getElement<HTMLSelectElement>('[data-control="rendered-ideal-background"]').addEventListener("change", (event) => {
    const value = event.currentTarget.value
    if (isRenderedIdealBackgroundMode(value)) {
      state.renderedIdeal.backgroundMode = value
      renderAll()
    }
  })

  getElement<HTMLSelectElement>('[data-control="rendered-ideal-color"]').addEventListener("change", (event) => {
    const value = event.currentTarget.value
    if (isRenderedIdealColorMode(value)) {
      state.renderedIdeal.colorMode = value
      renderAll()
    }
  })

  getElement<HTMLInputElement>("[data-range='live']").addEventListener("input", (event) => {
    const value = Number(event.currentTarget.value)
    if (Number.isFinite(value)) {
      seekLiveVideoTo(value)
    }
  })

  getElement<HTMLSelectElement>('[data-control="obj-preview-mode"]').addEventListener("change", (event) => {
    const value = event.currentTarget.value
    if (isObjPreviewMode(value)) {
      state.objPreview.mode = value
      renderAll()
    }
  })

  getElement<HTMLInputElement>('[data-action="obj-pose-sync-enabled"]').addEventListener("change", (event) => {
    state.objPoseSync.enabled = event.currentTarget.checked
    updateObjPoseSyncFromCurrentAnalysis()
    renderAll()
  })

  bindObjPoseSignToggle("obj-pose-yaw-invert", "yawSign")
  bindObjPoseSignToggle("obj-pose-pitch-invert", "pitchSign")
  bindObjPoseSignToggle("obj-pose-roll-invert", "rollSign")
  bindObjPoseOffsetInput("obj-pose-yaw-offset", "yawOffsetDeg")
  bindObjPoseOffsetInput("obj-pose-pitch-offset", "pitchOffsetDeg")
  bindObjPoseOffsetInput("obj-pose-roll-offset", "rollOffsetDeg")
  bindObjPoseRotationCenterInput("obj-pose-rotation-center-x", "rotationCenterX")
  bindObjPoseRotationCenterInput("obj-pose-rotation-center-y", "rotationCenterY")
  bindObjPoseRotationCenterInput("obj-pose-rotation-center-z", "rotationCenterZ")

  getElement<HTMLButtonElement>('[data-action="live-obj-current-pose"]').addEventListener("click", () => {
    updateObjPoseSyncFromCurrentAnalysis()
    renderAll()
  })

  getElement<HTMLButtonElement>('[data-action="live-obj-reset-view"]').addEventListener("click", () => {
    state.objPoseSync = createDefaultObjPoseSyncState()
    updateObjPoseSyncFromCurrentAnalysis()
    renderAll()
  })

  getElement<HTMLButtonElement>('[data-action="obj-pose-rotation-center-reset"]').addEventListener("click", () => {
    state.objPoseSync = {
      ...state.objPoseSync,
      rotationCenterX: 0,
      rotationCenterY: 0,
      rotationCenterZ: 0,
    }
    renderAll()
  })

  getElement<HTMLButtonElement>('[data-action="realtime-start"]').addEventListener("click", () => {
    startRealtimeValidation()
  })

  getElement<HTMLButtonElement>('[data-action="realtime-stop"]').addEventListener("click", () => {
    stopRealtimeValidation("stopped")
    renderAll()
  })

  getElement<HTMLButtonElement>('[data-action="realtime-reset"]').addEventListener("click", () => {
    resetRealtimeValidation()
    renderAll()
  })

  app.querySelectorAll<HTMLInputElement>('[data-control="realtime-mode"]').forEach((input) => {
    input.addEventListener("change", (event) => {
      const value = event.currentTarget.value
      if (isRealtimeMode(value)) {
        state.realtimeDebug.mode = value
        state.realtimeDebug.errorMessage =
          value === "current_analysis_obj_render_mediapipe_redetect"
            ? "MediaPipe再検出は未実装です。"
            : null
        renderAll()
      }
    })
  })

  getElement<HTMLSelectElement>('[data-control="realtime-target-fps"]').addEventListener("change", (event) => {
    const value = Number(event.currentTarget.value)
    if (isRealtimeTargetFps(value)) {
      state.realtimeDebug.targetFps = value
      if (state.realtimeDebug.status === "running") {
        restartRealtimeTimer()
      }
      renderAll()
    }
  })

  getElement<HTMLButtonElement>('[data-action="mediapipe-benchmark-run"]').addEventListener("click", () => {
    void runSelectedMediaPipeBenchmark()
  })

  getElement<HTMLButtonElement>('[data-action="mediapipe-benchmark-run-all"]').addEventListener("click", () => {
    void runAllMediaPipeBenchmarks()
  })

  getElement<HTMLButtonElement>('[data-action="mediapipe-benchmark-reset"]').addEventListener("click", () => {
    resetMediaPipeBenchmarkResults()
    renderAll()
  })

  getElement<HTMLSelectElement>('[data-control="mediapipe-benchmark-iteration-count"]').addEventListener("change", (event) => {
    const value = Number(event.currentTarget.value)
    if (isMediaPipeBenchmarkIterationCount(value)) {
      state.mediaPipeBenchmark.iterationCount = value
      renderAll()
    }
  })

  getElement<HTMLSelectElement>('[data-control="mediapipe-benchmark-delegate"]').addEventListener("change", (event) => {
    const value = event.currentTarget.value
    if (isMediaPipeBenchmarkDelegate(value)) {
      state.mediaPipeBenchmark.selectedDelegate = value
      renderAll()
    }
  })

  getElement<HTMLSelectElement>('[data-control="mediapipe-benchmark-output-mode"]').addEventListener("change", (event) => {
    const value = event.currentTarget.value
    if (isMediaPipeBenchmarkOutputMode(value)) {
      state.mediaPipeBenchmark.selectedOutputMode = value
      renderAll()
    }
  })

  bindObjPreviewPreset("obj-preview-front", { yawDeg: 0, pitchDeg: 0, rollDeg: 0 })
  bindObjPreviewPreset("obj-preview-left", { yawDeg: -90, pitchDeg: 0, rollDeg: 0 })
  bindObjPreviewPreset("obj-preview-right", { yawDeg: 90, pitchDeg: 0, rollDeg: 0 })
  bindObjPreviewPreset("obj-preview-top", { yawDeg: 0, pitchDeg: -90, rollDeg: 0 })
  bindObjPreviewPreset("obj-preview-side", { yawDeg: 90, pitchDeg: 0, rollDeg: 0 })

  getElement<HTMLButtonElement>('[data-action="obj-preview-reset"]').addEventListener("click", () => {
    state.objPreview = createDefaultObjPreviewState()
    renderAll()
  })

  objPreviewCanvas.addEventListener("pointerdown", (event) => {
    objPreviewDrag = {
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
      mode: event.shiftKey ? "pan" : "rotate",
    }
    objPreviewCanvas.setPointerCapture(event.pointerId)
  })

  objPreviewCanvas.addEventListener("pointermove", (event) => {
    if (!objPreviewDrag || objPreviewDrag.pointerId !== event.pointerId) {
      return
    }

    const dx = event.clientX - objPreviewDrag.lastX
    const dy = event.clientY - objPreviewDrag.lastY
    objPreviewDrag.lastX = event.clientX
    objPreviewDrag.lastY = event.clientY

    if (objPreviewDrag.mode === "pan") {
      state.objPreview.panX += dx / getObjCanvasScale()
      state.objPreview.panY -= dy / getObjCanvasScale()
    } else {
      state.objPreview.yawDeg = normalizeDegrees(state.objPreview.yawDeg + dx * 0.35)
      state.objPreview.pitchDeg = clamp(state.objPreview.pitchDeg + dy * 0.35, -180, 180)
    }

    renderAll()
  })

  objPreviewCanvas.addEventListener("pointerup", (event) => {
    if (objPreviewDrag?.pointerId === event.pointerId) {
      objPreviewDrag = null
    }
  })

  objPreviewCanvas.addEventListener("pointercancel", () => {
    objPreviewDrag = null
  })

  objPreviewCanvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault()
      const zoomDelta = event.deltaY < 0 ? 1.08 : 0.92
      state.objPreview.zoom = clamp(state.objPreview.zoom * zoomDelta, 0.15, 8)
      renderAll()
    },
    { passive: false },
  )

  window.addEventListener("resize", () => {
    renderObjPreviewCanvas()
    renderRenderedIdealCanvas()
    renderObjPoseSyncCanvas()
    drawLiveOverlay()
  })

  window.addEventListener("beforeunload", () => {
    cleanup()
  })

  app.querySelectorAll<HTMLButtonElement>("[data-tab-group]").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.dataset.tabGroup
      const value = button.dataset.tabValue
      if (group === "preview" && isPreviewTab(value)) {
        state.activePreviewTab = value
        renderAll()
      }
      if (group === "debug" && isDebugTab(value)) {
        state.activeDebugTab = value
        renderAll()
      }
    })
  })

  bindOverlayToggle("toggle-landmarks", "showLandmarks478")
  bindOverlayToggle("toggle-mesh-source", "showMeshSource")
  bindOverlayToggle("toggle-mesh-target", "showMeshTarget")
  bindOverlayToggle("toggle-mesh-pairs", "showMeshPairs")
  bindOverlayToggle("toggle-excluded-landmarks", "showExcludedLandmarks")
  bindOverlayToggle("toggle-grid-anchors", "showGridAnchors")
  bindOverlayToggle("toggle-triangle-mesh", "showTriangleMesh")
}

function bindObjPreviewPreset(
  action: string,
  preset: Pick<ObjPreviewState, "yawDeg" | "pitchDeg" | "rollDeg">,
) {
  getElement<HTMLButtonElement>(`[data-action="${action}"]`).addEventListener("click", () => {
    state.objPreview = {
      ...state.objPreview,
      ...preset,
      panX: 0,
      panY: 0,
    }
    renderAll()
  })
}

function bindOverlayToggle(
  action: string,
  key: keyof LabState["overlay"],
) {
  getElement<HTMLInputElement>(`[data-action="${action}"]`).addEventListener("change", (event) => {
    state.overlay[key] = event.currentTarget.checked
    addLog(`${event.currentTarget.nextElementSibling?.textContent ?? action}を${event.currentTarget.checked ? "ON" : "OFF"}にしました。`)
    renderAll()
  })
}

function bindObjPoseSignToggle(
  action: string,
  key: "yawSign" | "pitchSign" | "rollSign",
) {
  getElement<HTMLInputElement>(`[data-action="${action}"]`).addEventListener("change", (event) => {
    state.objPoseSync[key] = event.currentTarget.checked ? -1 : 1
    updateObjPoseSyncFromCurrentAnalysis()
    renderAll()
  })
}

function bindObjPoseOffsetInput(
  control: string,
  key: "yawOffsetDeg" | "pitchOffsetDeg" | "rollOffsetDeg",
) {
  getElement<HTMLInputElement>(`[data-control="${control}"]`).addEventListener("input", (event) => {
    const value = Number(event.currentTarget.value)
    state.objPoseSync[key] = Number.isFinite(value) ? value : 0
    updateObjPoseSyncFromCurrentAnalysis()
    renderAll()
  })
}

function bindObjPoseRotationCenterInput(
  control: string,
  key: "rotationCenterX" | "rotationCenterY" | "rotationCenterZ",
) {
  getElement<HTMLInputElement>(`[data-control="${control}"]`).addEventListener("input", (event) => {
    const value = Number(event.currentTarget.value)
    state.objPoseSync[key] = Number.isFinite(value) ? clamp(value, -0.5, 0.5) : 0
    renderAll()
  })
}

async function loadObjFile(file: File) {
  state.objFile = {
    loaded: true,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || "unknown",
  }
  state.objSummary = createFileObjSummary(file, "not_parsed")
  state.objGeometry = createEmptyObjGeometry()
  state.objPreviewStats = {
    sampledPointCount: 0,
    sampledEdgeCount: 0,
  }
  state.objErrorMessage = null
  state.activePreviewTab = "obj"
  addLog(`OBJファイル情報を読み込みました: ${file.name}`)
  renderAll()

  try {
    const objText = await file.text()
    const parseResult = parseObjText(objText)
    state.objSummary = createParsedObjSummary(file, parseResult)
    state.objGeometry = {
      vertices: parseResult.vertices,
      faces: parseResult.faces,
      edges: createUniqueEdges(parseResult.faces),
    }
    addLog(`OBJ解析が完了しました: 頂点 ${state.objSummary.vertexCount} / 面 ${state.objSummary.faceCount} / 警告 ${state.objSummary.warningCount}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("OBJ parse failed", error)
    state.objSummary = createFileObjSummary(file, "error")
    state.objGeometry = createEmptyObjGeometry()
    state.objPreviewStats = {
      sampledPointCount: 0,
      sampledEdgeCount: 0,
    }
    state.objErrorMessage = message
    addLog(`OBJ解析に失敗しました: ${message}`)
  }

  renderAll()
}

function loadLiveVideo(file: File) {
  if (state.liveVideo.objectUrl) {
    URL.revokeObjectURL(state.liveVideo.objectUrl)
  }

  stopRealtimeValidation("stopped")
  resetLiveAnalysisResults()
  const objectUrl = URL.createObjectURL(file)
  state.liveVideo = {
    loaded: true,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || "unknown",
    objectUrl,
    durationSec: null,
    width: null,
    height: null,
    currentTimeSec: 0,
    playbackStatus: "stopped",
    status: "loaded",
    errorMessage: null,
  }
  liveVideoElement.src = objectUrl
  liveVideoElement.load()
  state.activePreviewTab = "live"
  addLog(`ライブ動画を読み込みました: ${file.name}`)
  renderAll()
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
    const message = error instanceof Error ? error.message : String(error)
    console.error("MediaPipe initialization failed", error)
    state.liveMediaPipe.status = "error"
    state.liveMediaPipe.error = message
    throw error
  } finally {
    liveFaceLandmarkerPromise = null
    renderAll()
  }
}

async function initializeFaceLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH)

  return FaceLandmarker.createFromOptions(vision, createFaceLandmarkerOptions({
    delegate: "default",
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
  }))
}

async function analyzeCurrentLiveFrame(
  reason: "manual" | "timeupdate" | "seeked" | "pause" | "ended" | "realtime",
  options: { skipFinalRender?: boolean } = {},
): Promise<CurrentAnalysisTimingBreakdown | null> {
  if (!state.liveVideo.loaded || liveAnalysisInProgress) {
    if (!state.liveVideo.loaded) {
      state.realtimeDebug.skippedByNoVideoCount += 1
    }
    if (liveAnalysisInProgress) {
      state.realtimeDebug.skippedByInProgressCount += 1
    }
    return null
  }

  const analysisTiming = createEmptyCurrentAnalysisTimingBreakdown()
  const analysisStartMs = performance.now()

  if (liveVideoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    state.currentAnalysis = {
      ...createEmptyCurrentAnalysis(),
      status: "error",
      analyzedTimeSec: state.liveVideo.currentTimeSec,
      errorMessage: "動画フレームがまだ読み込まれていません。",
    }
    updateObjPoseSyncFromCurrentAnalysis()
    if (!options.skipFinalRender) {
      renderAll()
    }
    analysisTiming.currentAnalysisTotalMs = performance.now() - analysisStartMs
    return analysisTiming
  }

  const requestId = liveAnalysisRequestId + 1
  liveAnalysisRequestId = requestId
  liveAnalysisInProgress = true
  state.currentAnalysis = {
    ...state.currentAnalysis,
    status: "analyzing",
    errorMessage: null,
  }
  updateObjPoseSyncFromCurrentAnalysis()
  if (!options.skipFinalRender) {
    renderAll()
  }

  try {
    const detector = await getLiveFaceLandmarker()
    if (requestId !== liveAnalysisRequestId) {
      analysisTiming.currentAnalysisTotalMs = performance.now() - analysisStartMs
      return analysisTiming
    }

    const timeSec = liveVideoElement.currentTime || state.liveVideo.currentTimeSec || 0
    const detectStartMs = performance.now()
    const result = detector.detectForVideo(liveVideoElement, nextLiveTimestampMs())
    analysisTiming.mediaPipeDetectMs = performance.now() - detectStartMs

    const buildStartMs = performance.now()
    state.currentAnalysis = buildCurrentFrameAnalysis(result, timeSec)
    analysisTiming.buildCurrentAnalysisMs = performance.now() - buildStartMs
    updateObjPoseSyncFromCurrentAnalysis()
    lastAutoLiveAnalysisAtSec = timeSec

    if (reason === "manual") {
      addLog(
        state.currentAnalysis.status === "detected"
          ? "ライブ動画 current frame を解析しました。"
          : `ライブ動画 current frame 解析結果: ${state.currentAnalysis.status}`,
      )
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Current frame analysis failed", error)
    state.currentAnalysis = {
      ...createEmptyCurrentAnalysis(),
      status: "error",
      analyzedTimeSec: state.liveVideo.currentTimeSec,
      errorMessage: `MediaPipe error: ${message}`,
      qualitySummary: {
        ...createEmptyQualitySummary(),
        status: "error",
      },
    }
    updateObjPoseSyncFromCurrentAnalysis()
    state.liveMediaPipe.status = "error"
    state.liveMediaPipe.error = message
    disposeLiveFaceLandmarker("error")
    addLog(`ライブ動画 current frame 解析でエラーが発生しました: ${message}`)
  } finally {
    liveAnalysisInProgress = false
    analysisTiming.currentAnalysisTotalMs = sumNullableTimings(
      analysisTiming.mediaPipeDetectMs,
      analysisTiming.buildCurrentAnalysisMs,
      analysisTiming.liveOverlayDrawMs,
      analysisTiming.debugUpdateMs,
    ) ?? (performance.now() - analysisStartMs)
    if (!options.skipFinalRender) {
      renderAll()
    }
  }

  return analysisTiming
}

function maybeAnalyzeLiveFrame() {
  if (state.liveVideo.playbackStatus !== "playing") {
    state.realtimeDebug.skippedByPausedVideoCount += 1
  }

  if (
    !state.liveVideo.loaded ||
    state.liveVideo.playbackStatus !== "playing" ||
    liveAnalysisInProgress
  ) {
    if (!state.liveVideo.loaded) {
      state.realtimeDebug.skippedByNoVideoCount += 1
    }
    if (liveAnalysisInProgress) {
      state.realtimeDebug.skippedByInProgressCount += 1
    }
    return
  }

  const currentTimeSec = liveVideoElement.currentTime || state.liveVideo.currentTimeSec || 0
  if (currentTimeSec - lastAutoLiveAnalysisAtSec < LIVE_AUTO_ANALYSIS_INTERVAL_SEC) {
    return
  }

  state.realtimeDebug.timeupdateAnalysisRequestCount += 1
  void analyzeCurrentLiveFrame("timeupdate")
}

function updateObjPoseSyncFromCurrentAnalysis() {
  const pose = state.currentAnalysis.pose
  if (
    !state.objPoseSync.enabled ||
    state.currentAnalysis.status !== "detected" ||
    !hasFullPose(pose)
  ) {
    state.objPoseSync = {
      ...state.objPoseSync,
      appliedYawDeg: null,
      appliedPitchDeg: null,
      appliedRollDeg: null,
      source: "none",
    }
    return
  }

  state.objPoseSync = {
    ...state.objPoseSync,
    appliedYawDeg: (pose.yaw ?? 0) * state.objPoseSync.yawSign + state.objPoseSync.yawOffsetDeg,
    appliedPitchDeg:
      (pose.pitch ?? 0) * state.objPoseSync.pitchSign + state.objPoseSync.pitchOffsetDeg,
    appliedRollDeg: (pose.roll ?? 0) * state.objPoseSync.rollSign + state.objPoseSync.rollOffsetDeg,
    source: "current_frame",
  }
}

function buildCurrentFrameAnalysis(
  result: FaceLandmarkerResultLike,
  timeSec: number,
): CurrentFrameAnalysis {
  const landmarks = result.faceLandmarks[0] ?? []
  const blendshapes = (result.faceBlendshapes[0]?.categories ?? []).map((category) => ({
    categoryName: category.categoryName,
    score: category.score,
  }))
  const pose = estimateNullablePose(result.facialTransformationMatrixes[0])
  const hasFace = result.faceLandmarks.length > 0
  const validLandmarks = landmarks.length === REQUIRED_LANDMARK_COUNT

  if (!hasFace) {
    return {
      ...createEmptyCurrentAnalysis(),
      status: "no_face",
      analyzedTimeSec: timeSec,
      landmarkCount: 0,
      pose,
      blendshapes,
      expressionSummary: createExpressionSummary(blendshapes, "unknown"),
      qualityScore: 0,
      qualitySummary: {
        status: "no_face",
        expectedLandmarkCount: REQUIRED_LANDMARK_COUNT,
        landmarkCount: 0,
        hasPose: hasFullPose(pose),
      },
      errorMessage: "no_face",
    }
  }

  if (!validLandmarks) {
    return {
      ...createEmptyCurrentAnalysis(),
      status: "error",
      analyzedTimeSec: timeSec,
      landmarkCount: landmarks.length,
      pose,
      blendshapes,
      expressionSummary: createExpressionSummary(blendshapes, "unknown"),
      qualityScore: 0,
      qualitySummary: {
        status: "invalid_landmarks",
        expectedLandmarkCount: REQUIRED_LANDMARK_COUNT,
        landmarkCount: landmarks.length,
        hasPose: hasFullPose(pose),
      },
      errorMessage: `invalid_landmarks: ${landmarks.length}`,
    }
  }

  const expressionGroup = classifyExpressionGroup(blendshapes)
  return {
    status: "detected",
    analyzedTimeSec: timeSec,
    landmarks478: mapLandmarks(landmarks),
    landmarkCount: landmarks.length,
    pose,
    blendshapes,
    expressionSummary: createExpressionSummary(blendshapes, expressionGroup),
    qualityScore: 1,
    qualitySummary: {
      status: "valid",
      expectedLandmarkCount: REQUIRED_LANDMARK_COUNT,
      landmarkCount: landmarks.length,
      hasPose: hasFullPose(pose),
    },
    errorMessage: null,
  }
}

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

function createExpressionSummary(
  blendshapes: ReferenceBlendshape[],
  group: ExpressionGroup,
): ExpressionSummary {
  const scores = new Map(blendshapes.map((item) => [item.categoryName, item.score]))
  return {
    group,
    topBlendshapes: [...blendshapes]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => ({
        categoryName: item.categoryName,
        score: item.score,
      })),
    missingBlendshapeKeys: MATCH_BLENDSHAPE_KEYS.filter((key) => !scores.has(key)),
  }
}

function syncLiveVideoMetadata() {
  state.liveVideo.durationSec = Number.isFinite(liveVideoElement.duration)
    ? liveVideoElement.duration
    : null
  state.liveVideo.width = liveVideoElement.videoWidth || null
  state.liveVideo.height = liveVideoElement.videoHeight || null
  state.liveVideo.status = "metadata_ready"
  state.liveVideo.errorMessage = null
  syncLiveCurrentTime()
}

function syncLiveCurrentTime() {
  state.liveVideo.currentTimeSec = liveVideoElement.currentTime || 0
}

function seekLiveVideoTo(targetSec: number) {
  if (!state.liveVideo.loaded || !Number.isFinite(targetSec)) {
    return
  }

  const duration = state.liveVideo.durationSec ?? liveVideoElement.duration
  const nextTime = clamp(targetSec, 0, Number.isFinite(duration) ? duration : targetSec)
  liveVideoElement.currentTime = nextTime
  state.liveVideo.currentTimeSec = nextTime
  renderAll()
}

function startRealtimeValidation() {
  if (state.realtimeDebug.mode === "current_analysis_obj_render_mediapipe_redetect") {
    state.realtimeDebug = {
      ...state.realtimeDebug,
      status: "error",
      errorCount: state.realtimeDebug.errorCount + 1,
      errorMessage: "Mode B（現在顔解析 + OBJレンダー + MediaPipe再検出）は未実装です。",
      lastUpdatedAt: formatUpdatedAt(),
    }
    addLog("リアルタイム検証を開始できません。MediaPipe再検出は未実装です。")
    renderAll()
    return
  }

  if (!state.liveVideo.loaded) {
    state.realtimeDebug = {
      ...state.realtimeDebug,
      status: "error",
      errorCount: state.realtimeDebug.errorCount + 1,
      errorMessage: "ライブ動画を読み込んでから開始してください。",
      lastUpdatedAt: formatUpdatedAt(),
    }
    addLog("リアルタイム検証を開始できません。ライブ動画が未読込です。")
    renderAll()
    return
  }

  state.realtimeDebug = {
    ...state.realtimeDebug,
    status: "running",
    errorMessage: null,
    lastUpdatedAt: formatUpdatedAt(),
  }
  realtimeRunStartedAtMs = performance.now()
  restartRealtimeTimer()
  addLog("リアルタイム検証を開始しました。")
  renderAll()
  void runRealtimeTick()
}

function stopRealtimeValidation(nextStatus: Extract<RealtimeStatus, "idle" | "stopped" | "error">) {
  if (realtimeTimerId !== null) {
    window.clearInterval(realtimeTimerId)
    realtimeTimerId = null
  }
  realtimeTickInProgress = false
  realtimeRunStartedAtMs = null
  if (state.realtimeDebug.status === "running" || nextStatus !== "stopped") {
    state.realtimeDebug = {
      ...state.realtimeDebug,
      status: nextStatus,
      lastUpdatedAt: formatUpdatedAt(),
    }
  }
}

function resetRealtimeValidation() {
  const mode = state.realtimeDebug.mode
  const targetFps = state.realtimeDebug.targetFps
  stopRealtimeValidation("idle")
  realtimeTimingSamples = []
  state.realtimeDebug = createDefaultRealtimeDebugState({ mode, targetFps })
  addLog("リアルタイム検証をリセットしました。")
}

function addRealtimeTimingSample(sample: RealtimeTimingSample) {
  realtimeTimingSamples = [...realtimeTimingSamples, sample].slice(-REALTIME_AVERAGE_SAMPLE_COUNT)
}

function calculateRealtimeAverageTiming() {
  return {
    averageCurrentAnalysisTimingBreakdown: {
      mediaPipeDetectMs: averageNullableTiming(
        realtimeTimingSamples.map((sample) => sample.currentAnalysisTimingBreakdown.mediaPipeDetectMs),
      ),
      buildCurrentAnalysisMs: averageNullableTiming(
        realtimeTimingSamples.map((sample) => sample.currentAnalysisTimingBreakdown.buildCurrentAnalysisMs),
      ),
      liveOverlayDrawMs: averageNullableTiming(
        realtimeTimingSamples.map((sample) => sample.currentAnalysisTimingBreakdown.liveOverlayDrawMs),
      ),
      debugUpdateMs: averageNullableTiming(
        realtimeTimingSamples.map((sample) => sample.currentAnalysisTimingBreakdown.debugUpdateMs),
      ),
      currentAnalysisTotalMs: averageNullableTiming(
        realtimeTimingSamples.map((sample) => sample.currentAnalysisTimingBreakdown.currentAnalysisTotalMs),
      ),
    },
    averageObjRenderMs: averageNullableTiming(
      realtimeTimingSamples.map((sample) => sample.objRenderMs),
    ),
    averageTotalMs: averageNullableTiming(
      realtimeTimingSamples.map((sample) => sample.totalMs),
    ),
  }
}

async function runSelectedMediaPipeBenchmark() {
  await runMediaPipeBenchmarkCondition({
    delegate: state.mediaPipeBenchmark.selectedDelegate,
    outputMode: state.mediaPipeBenchmark.selectedOutputMode,
    iterationCount: state.mediaPipeBenchmark.iterationCount,
  })
}

async function runAllMediaPipeBenchmarks() {
  const delegates: MediaPipeBenchmarkDelegate[] = ["default", "CPU", "GPU"]
  const outputModes: MediaPipeBenchmarkOutputMode[] = [
    "landmarks_only",
    "landmarks_matrix",
    "landmarks_blendshapes",
    "landmarks_matrix_blendshapes",
  ]

  for (const delegate of delegates) {
    for (const outputMode of outputModes) {
      await runMediaPipeBenchmarkCondition({
        delegate,
        outputMode,
        iterationCount: state.mediaPipeBenchmark.iterationCount,
      })
    }
  }
}

async function runMediaPipeBenchmarkCondition(options: {
  delegate: MediaPipeBenchmarkDelegate
  outputMode: MediaPipeBenchmarkOutputMode
  iterationCount: number
}) {
  if (state.mediaPipeBenchmark.status === "running") {
    return
  }

  const videoReady = state.liveVideo.loaded &&
    liveVideoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
  if (!videoReady) {
    state.mediaPipeBenchmark = {
      ...state.mediaPipeBenchmark,
      status: "error",
      errorMessage: "ライブ動画を読み込み、現在フレームを表示してから比較してください。",
    }
    addLog("MediaPipe性能比較を開始できません。ライブ動画が未読込または未準備です。")
    renderAll()
    return
  }

  state.mediaPipeBenchmark = {
    ...state.mediaPipeBenchmark,
    status: "running",
    selectedDelegate: options.delegate,
    selectedOutputMode: options.outputMode,
    iterationCount: options.iterationCount,
    errorMessage: null,
  }
  renderAll()

  const result = await runMediaPipeBenchmarkDetector(options)
  state.mediaPipeBenchmark = {
    ...state.mediaPipeBenchmark,
    status: result.errorCount > 0 && result.successCount === 0 ? "error" : "done",
    latestResult: result,
    results: [result, ...state.mediaPipeBenchmark.results].slice(0, 40),
    errorMessage: result.errorMessage,
  }
  addLog(
    `MediaPipe性能比較: ${mediaPipeBenchmarkDelegateLabels[result.delegate]} / ${mediaPipeBenchmarkOutputModeLabels[result.outputMode]} / warm平均 ${formatRealtimeNullableNumber(result.warmDetectAverageMs)}`,
  )
  renderAll()
}

async function runMediaPipeBenchmarkDetector(options: {
  delegate: MediaPipeBenchmarkDelegate
  outputMode: MediaPipeBenchmarkOutputMode
  iterationCount: number
}): Promise<MediaPipeBenchmarkResult> {
  const createdAt = new Date().toISOString()
  const result: MediaPipeBenchmarkResult = {
    id: `mediapipe-benchmark-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt,
    delegate: options.delegate,
    outputMode: options.outputMode,
    iterationCount: options.iterationCount,
    initializationMs: null,
    firstDetectMs: null,
    averageDetectMs: null,
    warmDetectAverageMs: null,
    minDetectMs: null,
    maxDetectMs: null,
    successCount: 0,
    errorCount: 0,
    errorMessage: null,
    videoWidth: state.liveVideo.width ?? liveVideoElement.videoWidth ?? null,
    videoHeight: state.liveVideo.height ?? liveVideoElement.videoHeight ?? null,
    videoCurrentTimeSec: liveVideoElement.currentTime || state.liveVideo.currentTimeSec,
  }

  let detector: FaceLandmarker | null = null
  try {
    const initializationStartMs = performance.now()
    const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH)
    detector = await FaceLandmarker.createFromOptions(
      vision,
      createFaceLandmarkerOptions(getMediaPipeBenchmarkFaceLandmarkerConfig(options)),
    )
    result.initializationMs = performance.now() - initializationStartMs

    const detectTimes: number[] = []
    let benchmarkTimestampMs = 0
    for (let index = 0; index < options.iterationCount; index += 1) {
      benchmarkTimestampMs += MEDIAPIPE_TIMESTAMP_STEP_MS
      const detectStartMs = performance.now()
      detector.detectForVideo(liveVideoElement, benchmarkTimestampMs)
      const detectMs = performance.now() - detectStartMs
      detectTimes.push(detectMs)
      result.successCount += 1
      await yieldToBrowser()
    }

    result.firstDetectMs = detectTimes[0] ?? null
    result.averageDetectMs = averageNullableTiming(detectTimes)
    result.warmDetectAverageMs = averageNullableTiming(detectTimes.slice(1))
    result.minDetectMs = detectTimes.length > 0 ? Math.min(...detectTimes) : null
    result.maxDetectMs = detectTimes.length > 0 ? Math.max(...detectTimes) : null
  } catch (error) {
    result.errorCount += 1
    result.errorMessage = error instanceof Error ? error.message : String(error)
  } finally {
    detector?.close()
  }

  return result
}

function resetMediaPipeBenchmarkResults() {
  state.mediaPipeBenchmark = createDefaultMediaPipeBenchmarkState({
    selectedDelegate: state.mediaPipeBenchmark.selectedDelegate,
    selectedOutputMode: state.mediaPipeBenchmark.selectedOutputMode,
    iterationCount: state.mediaPipeBenchmark.iterationCount,
  })
  addLog("MediaPipe性能比較結果をリセットしました。")
}

function restartRealtimeTimer() {
  if (realtimeTimerId !== null) {
    window.clearInterval(realtimeTimerId)
  }
  const intervalMs = Math.max(1, Math.round(1000 / state.realtimeDebug.targetFps))
  realtimeTimerId = window.setInterval(() => {
    void runRealtimeTick()
  }, intervalMs)
}

async function runRealtimeTick() {
  if (state.realtimeDebug.status !== "running") {
    return
  }

  if (realtimeTickInProgress || liveAnalysisInProgress) {
    state.realtimeDebug = {
      ...state.realtimeDebug,
      skippedCount: state.realtimeDebug.skippedCount + 1,
      lastUpdatedAt: formatUpdatedAt(),
    }
    renderAll()
    return
  }

  if (state.realtimeDebug.mode === "current_analysis_obj_render_mediapipe_redetect") {
    state.realtimeDebug = {
      ...state.realtimeDebug,
      status: "error",
      errorCount: state.realtimeDebug.errorCount + 1,
      errorMessage: "MediaPipe再検出は未実装です。",
      lastUpdatedAt: formatUpdatedAt(),
    }
    stopRealtimeValidation("error")
    renderAll()
    return
  }

  realtimeTickInProgress = true
  const totalStartMs = performance.now()
  let currentAnalysisMs: number | null = null
  let objRenderMs: number | null = null
  let currentAnalysisTimingBreakdown = createEmptyCurrentAnalysisTimingBreakdown()

  try {
    state.realtimeDebug.realtimeTickAnalysisRequestCount += 1
    currentAnalysisTimingBreakdown =
      await analyzeCurrentLiveFrame("realtime", { skipFinalRender: true }) ??
      createEmptyCurrentAnalysisTimingBreakdown()

    const renderStartMs = performance.now()
    renderRenderedIdealCanvas()
    objRenderMs = performance.now() - renderStartMs

    const frameCount = state.realtimeDebug.frameCount + 1
    const elapsedSec = realtimeRunStartedAtMs === null
      ? null
      : (performance.now() - realtimeRunStartedAtMs) / 1000

    state.realtimeDebug = {
      ...state.realtimeDebug,
      status: "running",
      frameCount,
      currentAnalysisMs: currentAnalysisTimingBreakdown.currentAnalysisTotalMs,
      objRenderMs,
      mediaPipeRedetectMs: null,
      totalMs: sumNullableTimings(currentAnalysisTimingBreakdown.currentAnalysisTotalMs, objRenderMs),
      currentAnalysisTimingBreakdown,
      effectiveFps: elapsedSec && elapsedSec > 0 ? frameCount / elapsedSec : null,
      lastUpdatedAt: formatUpdatedAt(),
      errorMessage: null,
    }

    const renderTiming = renderAll()
    currentAnalysisTimingBreakdown = {
      ...currentAnalysisTimingBreakdown,
      liveOverlayDrawMs: renderTiming.liveOverlayDrawMs,
      debugUpdateMs: renderTiming.debugUpdateMs,
    }
    currentAnalysisTimingBreakdown.currentAnalysisTotalMs = sumNullableTimings(
      currentAnalysisTimingBreakdown.mediaPipeDetectMs,
      currentAnalysisTimingBreakdown.buildCurrentAnalysisMs,
      currentAnalysisTimingBreakdown.liveOverlayDrawMs,
      currentAnalysisTimingBreakdown.debugUpdateMs,
    )
    currentAnalysisMs = currentAnalysisTimingBreakdown.currentAnalysisTotalMs
    const totalMs = sumNullableTimings(currentAnalysisMs, objRenderMs)
    addRealtimeTimingSample({
      currentAnalysisTimingBreakdown,
      objRenderMs,
      totalMs,
    })
    const averageTiming = calculateRealtimeAverageTiming()

    state.realtimeDebug = {
      ...state.realtimeDebug,
      currentAnalysisMs,
      totalMs,
      currentAnalysisTimingBreakdown,
      averageCurrentAnalysisTimingBreakdown: averageTiming.averageCurrentAnalysisTimingBreakdown,
      averageObjRenderMs: averageTiming.averageObjRenderMs,
      averageTotalMs: averageTiming.averageTotalMs,
      lastUpdatedAt: formatUpdatedAt(),
    }
    renderRealtimeControls()
    renderDebugContent()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    state.realtimeDebug = {
      ...state.realtimeDebug,
      status: "error",
      errorCount: state.realtimeDebug.errorCount + 1,
      currentAnalysisMs,
      objRenderMs,
      currentAnalysisTimingBreakdown,
      totalMs: performance.now() - totalStartMs,
      lastUpdatedAt: formatUpdatedAt(),
      errorMessage: message,
    }
    stopRealtimeValidation("error")
    addLog(`リアルタイム検証でエラーが発生しました: ${message}`)
  } finally {
    realtimeTickInProgress = false
    if (state.realtimeDebug.status === "error") {
      renderAll()
    }
  }
}

function renderAll(): RenderUpdateTiming {
  updateObjPoseSyncFromCurrentAnalysis()
  renderPreviewTabs()
  renderPreviewPanels()
  renderControls()
  renderDebugTabs()

  const debugStartMs = performance.now()
  renderDebugContent()
  const debugUpdateMs = performance.now() - debugStartMs

  const overlayStartMs = performance.now()
  drawLiveOverlay()
  const liveOverlayDrawMs = performance.now() - overlayStartMs

  return {
    liveOverlayDrawMs,
    debugUpdateMs,
  }
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

  const liveStage = getElement<HTMLElement>("[data-live-stage]")
  liveStage.dataset.loaded = String(state.liveVideo.loaded)

  const objPreviewStatus = getObjPreviewStatus()
  const objStage = getElement<HTMLElement>("[data-obj-stage]")
  objStage.dataset.previewStatus = objPreviewStatus
  getElement<HTMLElement>("[data-obj-preview-message]").textContent = getObjPreviewMessage(objPreviewStatus)
  renderObjPreviewCanvas()

  const objSummary = getElement<HTMLElement>("[data-obj-preview-summary]")
  objSummary.innerHTML = renderObjPreviewSummary()

  renderRenderedIdealCanvas()
  renderRenderedIdealSummaryCard()

  const liveObjStage = getElement<HTMLElement>("[data-live-obj-stage]")
  liveObjStage.dataset.previewStatus = objPreviewStatus
  getElement<HTMLElement>("[data-live-obj-preview-message]").textContent = getObjPoseSyncMessage()
  renderObjPoseSyncCanvas()
}

function renderControls() {
  setChecked("toggle-landmarks", state.overlay.showLandmarks478)
  setChecked("toggle-mesh-source", state.overlay.showMeshSource)
  setChecked("toggle-mesh-target", state.overlay.showMeshTarget)
  setChecked("toggle-mesh-pairs", state.overlay.showMeshPairs)
  setChecked("toggle-excluded-landmarks", state.overlay.showExcludedLandmarks)
  setChecked("toggle-grid-anchors", state.overlay.showGridAnchors)
  setChecked("toggle-triangle-mesh", state.overlay.showTriangleMesh)

  const duration = state.liveVideo.durationSec ?? 0
  const range = getElement<HTMLInputElement>("[data-range='live']")
  range.max = String(duration)
  range.value = String(clamp(state.liveVideo.currentTimeSec ?? 0, 0, duration))
  range.disabled = !state.liveVideo.loaded

  setDisabled('[data-action="live-play"]', !state.liveVideo.loaded || state.liveVideo.playbackStatus === "playing")
  setDisabled('[data-action="live-pause"]', !state.liveVideo.loaded || state.liveVideo.playbackStatus !== "playing")
  setDisabled('[data-action="live-analyze-current"]', !state.liveVideo.loaded || liveAnalysisInProgress)

  getElement<HTMLElement>("[data-status='live-time']").textContent = formatTimeStatus(
    state.liveVideo,
  )

  getElement<HTMLSelectElement>('[data-control="rendered-ideal-background"]').value = state.renderedIdeal.backgroundMode
  getElement<HTMLSelectElement>('[data-control="rendered-ideal-color"]').value = state.renderedIdeal.colorMode
  setDisabled('[data-action="rendered-ideal-refresh"]', !canRenderRenderedIdeal())

  renderLiveAnalysisCard()
  getElement<HTMLSelectElement>('[data-control="obj-preview-mode"]').value = state.objPreview.mode
  setChecked("obj-pose-sync-enabled", state.objPoseSync.enabled)
  setChecked("obj-pose-yaw-invert", state.objPoseSync.yawSign === -1)
  setChecked("obj-pose-pitch-invert", state.objPoseSync.pitchSign === -1)
  setChecked("obj-pose-roll-invert", state.objPoseSync.rollSign === -1)
  setNumberValue("obj-pose-yaw-offset", state.objPoseSync.yawOffsetDeg)
  setNumberValue("obj-pose-pitch-offset", state.objPoseSync.pitchOffsetDeg)
  setNumberValue("obj-pose-roll-offset", state.objPoseSync.rollOffsetDeg)
  setNumberValue("obj-pose-rotation-center-x", state.objPoseSync.rotationCenterX)
  setNumberValue("obj-pose-rotation-center-y", state.objPoseSync.rotationCenterY)
  setNumberValue("obj-pose-rotation-center-z", state.objPoseSync.rotationCenterZ)
  renderLiveObjPoseSummaryCard()
  renderRealtimeControls()
  renderMediaPipeBenchmarkControls()
}

function renderRealtimeControls() {
  app.querySelectorAll<HTMLInputElement>('[data-control="realtime-mode"]').forEach((input) => {
    input.checked = input.value === state.realtimeDebug.mode
  })

  getElement<HTMLSelectElement>('[data-control="realtime-target-fps"]').value = String(
    state.realtimeDebug.targetFps,
  )
  setDisabled('[data-action="realtime-start"]', state.realtimeDebug.status === "running")
  setDisabled('[data-action="realtime-stop"]', state.realtimeDebug.status !== "running")

  getElement<HTMLElement>("[data-realtime-inline-status]").textContent =
    `状態: ${formatRealtimeStatus(state.realtimeDebug.status)} / 実効FPS: ${formatRealtimeNullableNumber(state.realtimeDebug.effectiveFps)} / 判定: ${getRealtimeJudgement()}`
  getElement<HTMLElement>("[data-realtime-playback-note]").textContent = getRealtimePlaybackNote()
}

function renderMediaPipeBenchmarkControls() {
  getElement<HTMLSelectElement>('[data-control="mediapipe-benchmark-iteration-count"]').value = String(
    state.mediaPipeBenchmark.iterationCount,
  )
  getElement<HTMLSelectElement>('[data-control="mediapipe-benchmark-delegate"]').value =
    state.mediaPipeBenchmark.selectedDelegate
  getElement<HTMLSelectElement>('[data-control="mediapipe-benchmark-output-mode"]').value =
    state.mediaPipeBenchmark.selectedOutputMode

  const isRunning = state.mediaPipeBenchmark.status === "running"
  const canRun = state.liveVideo.loaded && liveVideoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
  setDisabled('[data-action="mediapipe-benchmark-run"]', isRunning || !canRun)
  setDisabled('[data-action="mediapipe-benchmark-run-all"]', isRunning || !canRun)
  setDisabled('[data-action="mediapipe-benchmark-reset"]', isRunning)

  getElement<HTMLElement>("[data-mediapipe-benchmark-inline-status]").textContent =
    `状態: ${formatMediaPipeBenchmarkStatus(state.mediaPipeBenchmark.status)} / 最新結果: ${formatMediaPipeBenchmarkLatestInline()}`
  getElement<HTMLElement>("[data-mediapipe-benchmark-note]").textContent = getMediaPipeBenchmarkNote()
}

function renderLiveAnalysisCard() {
  const card = getElement<HTMLElement>("[data-live-analysis]")
  const analysis = state.currentAnalysis

  if (!state.liveVideo.loaded) {
    card.innerHTML = `<p>ライブ動画を読み込むと、ここに動画メタデータと現在フレーム解析結果を表示します。</p>`
    return
  }

  card.innerHTML = `
    <dl class="review-grid">
      <div><dt>liveVideoStatus</dt><dd>${state.liveVideo.status}</dd></div>
      <div><dt>fileName</dt><dd>${escapeHtml(state.liveVideo.fileName ?? "-")}</dd></div>
      <div><dt>videoSize</dt><dd>${formatVideoSize()}</dd></div>
      <div><dt>durationSec</dt><dd>${formatNullableNumber(state.liveVideo.durationSec)}</dd></div>
      <div><dt>currentTimeSec</dt><dd>${formatNullableNumber(state.liveVideo.currentTimeSec)}</dd></div>
      <div><dt>currentAnalysisStatus</dt><dd>${analysis.status}</dd></div>
      <div><dt>landmarkCount</dt><dd>${formatNullableCount(analysis.status === "not_ready" ? null : analysis.landmarkCount)}</dd></div>
      <div><dt>pose</dt><dd>${escapeHtml(formatPose(analysis.pose))}</dd></div>
      <div><dt>expression</dt><dd>${escapeHtml(formatExpressionSummary(analysis.expressionSummary))}</dd></div>
      <div><dt>qualityScore</dt><dd>${formatNullableNumber(analysis.qualityScore)}</dd></div>
      <div><dt>errorMessage</dt><dd>${escapeHtml(analysis.errorMessage ?? "-")}</dd></div>
    </dl>
  `
}

function renderLiveObjPoseSummaryCard() {
  const card = getElement<HTMLElement>("[data-live-obj-pose-summary]")
  const poseSync = state.objPoseSync

  card.innerHTML = `
    <p>${escapeHtml(getObjPoseSyncMessage())}</p>
    <dl class="review-grid">
      <div><dt>同期状態</dt><dd>${getObjPoseSyncStatus()}</dd></div>
      <div><dt>姿勢ソース</dt><dd>${poseSync.source}</dd></div>
      <div><dt>姿勢同期</dt><dd>${String(poseSync.enabled)}</dd></div>
      <div><dt>現在yaw角度</dt><dd>${formatNullableNumber(state.currentAnalysis.pose.yaw)}</dd></div>
      <div><dt>現在pitch角度</dt><dd>${formatNullableNumber(state.currentAnalysis.pose.pitch)}</dd></div>
      <div><dt>現在roll角度</dt><dd>${formatNullableNumber(state.currentAnalysis.pose.roll)}</dd></div>
      <div><dt>appliedYawDeg</dt><dd>${formatNullableNumber(poseSync.appliedYawDeg)}</dd></div>
      <div><dt>appliedPitchDeg</dt><dd>${formatNullableNumber(poseSync.appliedPitchDeg)}</dd></div>
      <div><dt>appliedRollDeg</dt><dd>${formatNullableNumber(poseSync.appliedRollDeg)}</dd></div>
      <div><dt>yawSign</dt><dd>${poseSync.yawSign}</dd></div>
      <div><dt>pitchSign</dt><dd>${poseSync.pitchSign}</dd></div>
      <div><dt>rollSign</dt><dd>${poseSync.rollSign}</dd></div>
      <div><dt>yawOffsetDeg</dt><dd>${formatNumber(poseSync.yawOffsetDeg)}</dd></div>
      <div><dt>pitchOffsetDeg</dt><dd>${formatNumber(poseSync.pitchOffsetDeg)}</dd></div>
      <div><dt>rollOffsetDeg</dt><dd>${formatNumber(poseSync.rollOffsetDeg)}</dd></div>
      <div><dt>rotationCenterX</dt><dd>${formatNumber(poseSync.rotationCenterX)}</dd></div>
      <div><dt>rotationCenterY</dt><dd>${formatNumber(poseSync.rotationCenterY)}</dd></div>
      <div><dt>rotationCenterZ</dt><dd>${formatNumber(poseSync.rotationCenterZ)}</dd></div>
      <div><dt>sampledPointCount</dt><dd>${state.objPoseSyncStats.sampledPointCount}</dd></div>
      <div><dt>sampledEdgeCount</dt><dd>${state.objPoseSyncStats.sampledEdgeCount}</dd></div>
    </dl>
  `
}

function renderObjPreviewCanvas() {
  const status = getObjPreviewStatus()
  state.objPreviewStats = status === "ready" ? calculateObjPreviewStats(state.objPreview) : {
    sampledPointCount: 0,
    sampledEdgeCount: 0,
  }

  renderObjPreviewCanvasTo(objPreviewCanvas, state.objPreview)
}

function renderObjPoseSyncCanvas() {
  const status = getObjPreviewStatus()
  const previewState = getObjPoseSyncPreviewState()
  state.objPoseSyncStats = status === "ready" ? calculateObjPreviewStats(previewState) : {
    sampledPointCount: 0,
    sampledEdgeCount: 0,
  }

  renderObjPreviewCanvasTo(liveObjPosePreviewCanvas, previewState, getObjPoseSyncRotationCenter())
}

function renderRenderedIdealCanvas() {
  const stage = getElement<HTMLElement>("[data-rendered-ideal-stage]")
  const message = getElement<HTMLElement>("[data-rendered-ideal-message]")

  try {
    state.renderedIdeal.summary = renderRenderedIdealCanvasTo(renderedIdealCanvas)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Rendered ideal render failed", error)
    state.renderedIdeal.summary = createRenderedIdealRenderSummary("error", {
      errorMessage,
      canvasWidth: renderedIdealCanvas.width,
      canvasHeight: renderedIdealCanvas.height,
    })
  }

  stage.dataset.renderStatus = state.renderedIdeal.summary.status
  message.textContent = getRenderedIdealMessage()
}

function renderRenderedIdealCanvasTo(canvas: HTMLCanvasElement): RenderedIdealRenderSummary {
  const context = canvas.getContext("2d")
  if (!context) {
    return createRenderedIdealRenderSummary("error", {
      errorMessage: "2D canvas context を取得できませんでした。",
    })
  }

  const rect = canvas.getBoundingClientRect()
  const cssWidth = rect.width > 0 ? rect.width : RENDERED_IDEAL_FALLBACK_CANVAS_SIZE
  const cssHeight = rect.height > 0 ? rect.height : RENDERED_IDEAL_FALLBACK_CANVAS_SIZE
  const dpr = window.devicePixelRatio || 1
  const targetWidth = Math.max(1, Math.round(cssWidth * dpr))
  const targetHeight = Math.max(1, Math.round(cssHeight * dpr))
  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth
    canvas.height = targetHeight
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  drawRenderedIdealBackground(context, cssWidth, cssHeight)

  if (!state.objFile.loaded || getObjPreviewStatus() !== "ready") {
    return createRenderedIdealRenderSummary("not_ready", {
      canvasWidth: targetWidth,
      canvasHeight: targetHeight,
      errorMessage: null,
    })
  }

  if (state.currentAnalysis.status !== "detected" || !hasFullPose(state.currentAnalysis.pose)) {
    return createRenderedIdealRenderSummary("not_ready", {
      canvasWidth: targetWidth,
      canvasHeight: targetHeight,
      errorMessage: null,
    })
  }

  const summary = state.objSummary
  if (!summary.center || !summary.maxDimension || summary.maxDimension <= 0) {
    return createRenderedIdealRenderSummary("not_ready", {
      canvasWidth: targetWidth,
      canvasHeight: targetHeight,
      errorMessage: "OBJ bounds が不足しています。",
    })
  }

  const previewState = getObjPoseSyncPreviewState()
  const rotationCenter = getObjPoseSyncRotationCenter()
  const viewport = {
    centerX: cssWidth / 2,
    centerY: cssHeight / 2,
    scale: Math.max(1, Math.min(cssWidth, cssHeight) * 0.44),
  }
  const transformedVertices = state.objGeometry.vertices.map((vertex) =>
    transformObjVertexForRender(vertex, summary.center!, summary.maxDimension!, previewState, rotationCenter),
  )
  const faceDrawItems = createRenderedIdealFaceDrawItems(transformedVertices, viewport, previewState)

  faceDrawItems.sort((a, b) => a.averageZ - b.averageZ)

  let drawnFaceCount = 0
  let skippedFaceCount = 0

  context.save()
  context.lineJoin = "round"
  context.lineWidth = 0.65
  for (const item of faceDrawItems) {
    if (item.points.length < 3) {
      skippedFaceCount += 1
      continue
    }

    context.beginPath()
    context.moveTo(item.points[0].x, item.points[0].y)
    for (let index = 1; index < item.points.length; index += 1) {
      context.lineTo(item.points[index].x, item.points[index].y)
    }
    context.closePath()
    context.fillStyle = getRenderedIdealFaceColor(item.brightness)
    context.strokeStyle = getRenderedIdealFaceStrokeColor(item.brightness)
    context.fill()
    context.stroke()
    drawnFaceCount += 1
  }
  context.restore()

  skippedFaceCount += state.objGeometry.faces.length - faceDrawItems.length

  return createRenderedIdealRenderSummary("rendered", {
    canvasWidth: targetWidth,
    canvasHeight: targetHeight,
    drawnFaceCount,
    skippedFaceCount,
    errorMessage: null,
  })
}

function createRenderedIdealFaceDrawItems(
  transformedVertices: ObjVertex[],
  viewport: { centerX: number; centerY: number; scale: number },
  previewState: ObjPreviewState,
) {
  return state.objGeometry.faces.flatMap((face) => {
    const vertices: ObjVertex[] = []
    face.indices.forEach((index) => {
      const vertex = transformedVertices[index]
      if (vertex) {
        vertices.push(vertex)
      }
    })
    if (vertices.length < 3) {
      return []
    }

    const normal = orientNormalToCamera(calculateFaceNormal(vertices))
    if (!normal) {
      return []
    }

    const brightness = clamp(
      0.35 + 0.65 * Math.max(0, dotVector(normal, RENDERED_IDEAL_LIGHT_DIRECTION)),
      0.25,
      1,
    )
    const averageZ = vertices.reduce((sum, vertex) => sum + vertex.z, 0) / vertices.length
    const points = vertices.map((vertex) => ({
      x: viewport.centerX + (vertex.x * previewState.zoom + previewState.panX) * viewport.scale,
      y: viewport.centerY - (vertex.y * previewState.zoom + previewState.panY) * viewport.scale,
    }))

    return [{ averageZ, brightness, points }]
  })
}

function transformObjVertexForRender(
  vertex: ObjVertex,
  center: ObjVertex,
  maxDimension: number,
  previewState: ObjPreviewState,
  rotationCenter: ObjVertex,
): ObjVertex {
  const normalized = {
    x: (vertex.x - center.x) / maxDimension,
    y: (vertex.y - center.y) / maxDimension,
    z: (vertex.z - center.z) / maxDimension,
  }
  const shifted = {
    x: normalized.x - rotationCenter.x,
    y: normalized.y - rotationCenter.y,
    z: normalized.z - rotationCenter.z,
  }
  const rotatedShifted = rotateObjPoint(shifted, previewState)

  return {
    x: rotatedShifted.x + rotationCenter.x,
    y: rotatedShifted.y + rotationCenter.y,
    z: rotatedShifted.z + rotationCenter.z,
  }
}

function drawRenderedIdealBackground(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  context.fillStyle = state.renderedIdeal.backgroundMode === "dark" ? "#1a2028" : "#f5f7f9"
  context.fillRect(0, 0, width, height)
}

function renderRenderedIdealSummaryCard() {
  const card = getElement<HTMLElement>("[data-rendered-ideal-summary]")
  const summary = state.renderedIdeal.summary
  card.innerHTML = `
    <p>${escapeHtml(getRenderedIdealMessage())}</p>
    <dl class="review-grid">
      <div><dt>render status</dt><dd>${summary.status}</dd></div>
      <div><dt>faceCount</dt><dd>${summary.faceCount}</dd></div>
      <div><dt>drawnFaceCount</dt><dd>${summary.drawnFaceCount}</dd></div>
      <div><dt>skippedFaceCount</dt><dd>${summary.skippedFaceCount}</dd></div>
      <div><dt>render mode</dt><dd>${summary.renderMode}</dd></div>
      <div><dt>light direction</dt><dd>${escapeHtml(formatPoint(summary.lightDirection))}</dd></div>
      <div><dt>pose source</dt><dd>${state.objPoseSync.source}</dd></div>
      <div><dt>applied yaw / pitch / roll</dt><dd>${escapeHtml(formatAppliedObjPose())}</dd></div>
      <div><dt>rotation center</dt><dd>${escapeHtml(formatPoint(summary.rotationCenter))}</dd></div>
      <div><dt>errorMessage</dt><dd>${escapeHtml(summary.errorMessage ?? "null")}</dd></div>
    </dl>
  `
}

function renderObjPreviewCanvasTo(
  canvas: HTMLCanvasElement,
  previewState: ObjPreviewState,
  rotationCenter: ObjVertex = { x: 0, y: 0, z: 0 },
) {
  const status = getObjPreviewStatus()
  const context = canvas.getContext("2d")
  if (!context) {
    return
  }

  const rect = canvas.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) {
    return
  }

  const dpr = window.devicePixelRatio || 1
  const targetWidth = Math.round(rect.width * dpr)
  const targetHeight = Math.round(rect.height * dpr)
  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth
    canvas.height = targetHeight
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  context.clearRect(0, 0, rect.width, rect.height)

  if (status !== "ready") {
    return
  }

  const summary = state.objSummary
  if (!summary.center || !summary.maxDimension || summary.maxDimension <= 0) {
    return
  }

  const viewport = {
    centerX: rect.width / 2,
    centerY: rect.height / 2,
    scale: getObjCanvasScale(canvas),
  }

  context.save()
  context.lineCap = "round"
  context.lineJoin = "round"

  if (previewState.mode === "wireframe" || previewState.mode === "points_wireframe") {
    drawObjWireframe(context, summary.center, summary.maxDimension, viewport, previewState, rotationCenter)
  }

  if (previewState.mode === "points" || previewState.mode === "points_wireframe") {
    drawObjPoints(context, summary.center, summary.maxDimension, viewport, previewState, rotationCenter)
  }

  drawObjAxisGuide(context, rect.height, previewState)
  context.restore()
}

function drawObjWireframe(
  context: CanvasRenderingContext2D,
  center: ObjVertex,
  maxDimension: number,
  viewport: { centerX: number; centerY: number; scale: number },
  previewState: ObjPreviewState,
  rotationCenter: ObjVertex,
) {
  const edgeStep = getSampleStep(state.objGeometry.edges.length, previewState.maxEdges)
  context.strokeStyle = "rgba(67, 99, 132, 0.32)"
  context.lineWidth = 1
  context.beginPath()

  for (let index = 0; index < state.objGeometry.edges.length; index += edgeStep) {
    const edge = state.objGeometry.edges[index]
    const from = state.objGeometry.vertices[edge.a]
    const to = state.objGeometry.vertices[edge.b]
    if (!from || !to) {
      continue
    }

    const p1 = projectObjVertex(from, center, maxDimension, viewport, previewState, rotationCenter)
    const p2 = projectObjVertex(to, center, maxDimension, viewport, previewState, rotationCenter)
    context.moveTo(p1.x, p1.y)
    context.lineTo(p2.x, p2.y)
  }

  context.stroke()
}

function drawObjPoints(
  context: CanvasRenderingContext2D,
  center: ObjVertex,
  maxDimension: number,
  viewport: { centerX: number; centerY: number; scale: number },
  previewState: ObjPreviewState,
  rotationCenter: ObjVertex,
) {
  const pointStep = getSampleStep(state.objGeometry.vertices.length, previewState.maxPoints)
  context.fillStyle = "rgba(18, 31, 44, 0.64)"

  for (let index = 0; index < state.objGeometry.vertices.length; index += pointStep) {
    const point = projectObjVertex(
      state.objGeometry.vertices[index],
      center,
      maxDimension,
      viewport,
      previewState,
      rotationCenter,
    )
    context.beginPath()
    context.arc(point.x, point.y, 1.35, 0, Math.PI * 2)
    context.fill()
  }
}

function drawObjAxisGuide(
  context: CanvasRenderingContext2D,
  canvasHeight: number,
  previewState: ObjPreviewState,
) {
  const originX = 18
  const originY = canvasHeight - 18
  const length = 34
  const axes: Array<{ label: string; color: string; vertex: ObjVertex }> = [
    { label: "x", color: "#cf3f3f", vertex: { x: 1, y: 0, z: 0 } },
    { label: "y", color: "#268053", vertex: { x: 0, y: 1, z: 0 } },
    { label: "z", color: "#3159b7", vertex: { x: 0, y: 0, z: 1 } },
  ]

  context.font = "700 11px Inter, system-ui, sans-serif"
  axes.forEach((axis) => {
    const rotated = rotateObjPoint(axis.vertex, previewState)
    const x = originX + rotated.x * length
    const y = originY - rotated.y * length
    context.strokeStyle = axis.color
    context.fillStyle = axis.color
    context.lineWidth = 2
    context.beginPath()
    context.moveTo(originX, originY)
    context.lineTo(x, y)
    context.stroke()
    context.fillText(axis.label, x + 4, y + 4)
  })
}

function projectObjVertex(
  vertex: ObjVertex,
  center: ObjVertex,
  maxDimension: number,
  viewport: { centerX: number; centerY: number; scale: number },
  previewState: ObjPreviewState,
  rotationCenter: ObjVertex,
) {
  const normalized = {
    x: (vertex.x - center.x) / maxDimension,
    y: (vertex.y - center.y) / maxDimension,
    z: (vertex.z - center.z) / maxDimension,
  }
  const shifted = {
    x: normalized.x - rotationCenter.x,
    y: normalized.y - rotationCenter.y,
    z: normalized.z - rotationCenter.z,
  }
  const rotatedShifted = rotateObjPoint(shifted, previewState)
  const rotated = {
    x: rotatedShifted.x + rotationCenter.x,
    y: rotatedShifted.y + rotationCenter.y,
    z: rotatedShifted.z + rotationCenter.z,
  }

  return {
    x: viewport.centerX + (rotated.x * previewState.zoom + previewState.panX) * viewport.scale,
    y: viewport.centerY - (rotated.y * previewState.zoom + previewState.panY) * viewport.scale,
    z: rotated.z,
  }
}

function rotateObjPoint(point: ObjVertex, previewState: ObjPreviewState): ObjVertex {
  const yaw = degreesToRadians(previewState.yawDeg)
  const pitch = degreesToRadians(previewState.pitchDeg)
  const roll = degreesToRadians(previewState.rollDeg)
  const cosYaw = Math.cos(yaw)
  const sinYaw = Math.sin(yaw)
  const cosPitch = Math.cos(pitch)
  const sinPitch = Math.sin(pitch)
  const cosRoll = Math.cos(roll)
  const sinRoll = Math.sin(roll)

  const yawX = point.x * cosYaw + point.z * sinYaw
  const yawY = point.y
  const yawZ = -point.x * sinYaw + point.z * cosYaw

  const pitchX = yawX
  const pitchY = yawY * cosPitch - yawZ * sinPitch
  const pitchZ = yawY * sinPitch + yawZ * cosPitch

  return {
    x: pitchX * cosRoll - pitchY * sinRoll,
    y: pitchX * sinRoll + pitchY * cosRoll,
    z: pitchZ,
  }
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
    !state.overlay.showLandmarks478 ||
    rect.width <= 0 ||
    rect.height <= 0 ||
    state.currentAnalysis.landmarks478.length !== REQUIRED_LANDMARK_COUNT
  ) {
    return
  }

  const displayedContentRect = getDisplayedContentRect(
    state.liveVideo,
    liveVideoElement,
    rect.width,
    rect.height,
  )

  drawLandmarkPoints(
    context,
    displayedContentRect,
    state.currentAnalysis.landmarks478,
    "rgba(79, 128, 255, 0.85)",
    1.45,
  )
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

function getDisplayedContentRect(
  videoState: LiveVideoState,
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

  if (state.activeDebugTab === "raw") {
    const pre = document.createElement("pre")
    pre.className = "raw-state"
    pre.textContent = JSON.stringify(getRawState(), null, 2)
    content.appendChild(pre)
    return
  }

  if (state.activeDebugTab === "current" && state.currentAnalysis.status === "not_ready") {
    const message = document.createElement("p")
    message.className = "placeholder-text"
    message.textContent = "not_ready"
    content.appendChild(message)
  }

  const list = document.createElement("dl")
  list.className = "summary-list"

  if (state.activeDebugTab === "summary") {
    appendDefinitionItems(list, getSummaryItems())
  }
  if (state.activeDebugTab === "current") {
    appendDefinitionItems(list, getCurrentItems())
  }
  if (state.activeDebugTab === "obj") {
    appendDefinitionItems(list, getObjItems())
  }
  if (state.activeDebugTab === "renderedIdeal") {
    appendDefinitionItems(list, getRenderedIdealItems())
  }
  if (state.activeDebugTab === "realtime") {
    appendDefinitionItems(list, getRealtimeItems())
  }
  if (state.activeDebugTab === "mediaPipeBenchmark") {
    appendDefinitionItems(list, getMediaPipeBenchmarkItems())
  }
  if (state.activeDebugTab === "warpMesh") {
    appendDefinitionItems(list, getWarpMeshItems())
  }

  content.appendChild(list)

  if (state.activeDebugTab === "summary") {
    content.appendChild(createLogSection())
  }
}

function getSummaryItems(): Array<[string, string]> {
  const objFileStatus = getObjFileStatus()
  return [
    ["labName", LAB_NAME],
    ["liveVideoStatus", state.liveVideo.status],
    ["currentAnalysisStatus", state.currentAnalysis.status],
    ["currentLandmarkCount", formatNullableCount(state.currentAnalysis.status === "not_ready" ? null : state.currentAnalysis.landmarkCount)],
    ["currentPoseYaw", formatNullableNumber(state.currentAnalysis.pose.yaw)],
    ["currentPosePitch", formatNullableNumber(state.currentAnalysis.pose.pitch)],
    ["currentPoseRoll", formatNullableNumber(state.currentAnalysis.pose.roll)],
    ["currentQualityScore", formatNullableNumber(state.currentAnalysis.qualityScore)],
    ["objFileStatus", objFileStatus],
    ["objVertexCount", formatNullableCount(state.objFile.loaded ? state.objSummary.vertexCount : null)],
    ["objFaceCount", formatNullableCount(state.objFile.loaded ? state.objSummary.faceCount : null)],
    ["objWarningCount", formatNullableCount(state.objFile.loaded ? state.objSummary.warningCount : null)],
    ["objPreviewStatus", getObjPreviewStatus()],
    ["objPreviewMode", state.objPreview.mode],
    ["objSampledPointCount", formatNullableCount(state.objPreviewStats.sampledPointCount)],
    ["objSampledEdgeCount", formatNullableCount(state.objPreviewStats.sampledEdgeCount)],
    ["objPoseSyncEnabled", String(state.objPoseSync.enabled)],
    ["objPoseSyncSource", state.objPoseSync.source],
    ["appliedYawDeg", formatNullableNumber(state.objPoseSync.appliedYawDeg)],
    ["appliedPitchDeg", formatNullableNumber(state.objPoseSync.appliedPitchDeg)],
    ["appliedRollDeg", formatNullableNumber(state.objPoseSync.appliedRollDeg)],
    ["yawSign", String(state.objPoseSync.yawSign)],
    ["pitchSign", String(state.objPoseSync.pitchSign)],
    ["rollSign", String(state.objPoseSync.rollSign)],
    ["yawOffsetDeg", formatNumber(state.objPoseSync.yawOffsetDeg)],
    ["pitchOffsetDeg", formatNumber(state.objPoseSync.pitchOffsetDeg)],
    ["rollOffsetDeg", formatNumber(state.objPoseSync.rollOffsetDeg)],
    ["rotationCenterX", formatNumber(state.objPoseSync.rotationCenterX)],
    ["rotationCenterY", formatNumber(state.objPoseSync.rotationCenterY)],
    ["rotationCenterZ", formatNumber(state.objPoseSync.rotationCenterZ)],
    ["objErrorMessage", state.objErrorMessage ?? "null"],
    ["renderedIdealStatus", state.renderedIdeal.summary.status],
    ["renderedIdealRenderMode", state.renderedIdeal.summary.renderMode],
    ["renderedIdealDrawnFaceCount", formatNullableCount(state.renderedIdeal.summary.drawnFaceCount)],
    ["renderedIdealSkippedFaceCount", formatNullableCount(state.renderedIdeal.summary.skippedFaceCount)],
    ["realtimeStatus", state.realtimeDebug.status],
    ["realtimeMode", state.realtimeDebug.mode],
    ["realtimeTargetFps", formatNumber(state.realtimeDebug.targetFps)],
    ["realtimeEffectiveFps", formatRealtimeNullableNumber(state.realtimeDebug.effectiveFps)],
    ["realtimeTotalMs", formatRealtimeNullableNumber(state.realtimeDebug.totalMs)],
    ["mediaPipeDetectMs", formatRealtimeNullableNumber(state.realtimeDebug.currentAnalysisTimingBreakdown.mediaPipeDetectMs)],
    ["buildCurrentAnalysisMs", formatRealtimeNullableNumber(state.realtimeDebug.currentAnalysisTimingBreakdown.buildCurrentAnalysisMs)],
    ["liveOverlayDrawMs", formatRealtimeNullableNumber(state.realtimeDebug.currentAnalysisTimingBreakdown.liveOverlayDrawMs)],
    ["debugUpdateMs", formatRealtimeNullableNumber(state.realtimeDebug.currentAnalysisTimingBreakdown.debugUpdateMs)],
    ["timeupdateAnalysisRequestCount", formatNullableCount(state.realtimeDebug.timeupdateAnalysisRequestCount)],
    ["realtimeTickAnalysisRequestCount", formatNullableCount(state.realtimeDebug.realtimeTickAnalysisRequestCount)],
    ["skippedByInProgressCount", formatNullableCount(state.realtimeDebug.skippedByInProgressCount)],
    ["skippedByNoVideoCount", formatNullableCount(state.realtimeDebug.skippedByNoVideoCount)],
    ["skippedByPausedVideoCount", formatNullableCount(state.realtimeDebug.skippedByPausedVideoCount)],
    ["mediaPipeBenchmarkLatestDelegate", state.mediaPipeBenchmark.latestResult?.delegate ?? "null"],
    ["mediaPipeBenchmarkLatestOutputMode", state.mediaPipeBenchmark.latestResult?.outputMode ?? "null"],
    ["mediaPipeBenchmarkLatestWarmAverageMs", formatRealtimeNullableNumber(state.mediaPipeBenchmark.latestResult?.warmDetectAverageMs ?? null)],
    ["mediaPipeBenchmarkBestWarmAverageMs", formatRealtimeNullableNumber(getBestMediaPipeBenchmarkResult()?.warmDetectAverageMs ?? null)],
    ["mediaPipeBenchmarkBestCondition", formatMediaPipeBenchmarkCondition(getBestMediaPipeBenchmarkResult())],
    ["warpStatus", "not_implemented"],
  ]
}

function getCurrentItems(): Array<[string, string]> {
  return [
    ["liveVideoStatus", state.liveVideo.status],
    ["fileName", state.liveVideo.fileName ?? "null"],
    ["width", formatNullableCount(state.liveVideo.width)],
    ["height", formatNullableCount(state.liveVideo.height)],
    ["durationSec", formatNullableNumber(state.liveVideo.durationSec)],
    ["currentTimeSec", formatNullableNumber(state.liveVideo.currentTimeSec)],
    ["currentAnalysisStatus", state.currentAnalysis.status],
    ["detected", String(state.currentAnalysis.status === "detected")],
    ["no_face", String(state.currentAnalysis.status === "no_face")],
    ["currentLandmarkCount", formatNullableCount(state.currentAnalysis.status === "not_ready" ? null : state.currentAnalysis.landmarkCount)],
    ["yaw", formatNullableNumber(state.currentAnalysis.pose.yaw)],
    ["pitch", formatNullableNumber(state.currentAnalysis.pose.pitch)],
    ["roll", formatNullableNumber(state.currentAnalysis.pose.roll)],
    ["expressionSummary", formatExpressionSummary(state.currentAnalysis.expressionSummary)],
    ["qualityScore", formatNullableNumber(state.currentAnalysis.qualityScore)],
    ["qualitySummary", formatQualitySummary(state.currentAnalysis.qualitySummary)],
    ["objPoseSyncSource", state.objPoseSync.source],
    ["objAppliedPose", formatAppliedObjPose()],
    ["liveMediaPipeStatus", state.liveMediaPipe.status],
    ["liveTimestampMs", formatNullableNumber(state.liveMediaPipe.liveTimestampMs)],
    ["errorMessage", state.currentAnalysis.errorMessage ?? state.liveVideo.errorMessage ?? "null"],
  ]
}

function getObjItems(): Array<[string, string]> {
  const summary = state.objSummary
  return [
    ["fileName", state.objFile.fileName ?? "null"],
    ["fileSize", state.objFile.fileSize === null ? "null" : formatBytes(state.objFile.fileSize)],
    ["fileType", state.objFile.fileType ?? "null"],
    ["parseStatus", summary.parseStatus],
    ["vertexCount", formatNullableCount(state.objFile.loaded ? summary.vertexCount : null)],
    ["faceCount", formatNullableCount(state.objFile.loaded ? summary.faceCount : null)],
    ["triangleFaceCount", formatNullableCount(state.objFile.loaded ? summary.triangleFaceCount : null)],
    ["polygonFaceCount", formatNullableCount(state.objFile.loaded ? summary.polygonFaceCount : null)],
    ["bounds", formatBounds(summary.bounds)],
    ["center", formatPoint(summary.center)],
    ["size", formatPoint(summary.size)],
    ["maxDimension", formatNullableNumber(summary.maxDimension)],
    ["warningCount", formatNullableCount(state.objFile.loaded ? summary.warningCount : null)],
    ["warningsPreview", formatStringList(summary.warningsPreview)],
    ["previewYawDeg", formatNumber(state.objPreview.yawDeg)],
    ["previewPitchDeg", formatNumber(state.objPreview.pitchDeg)],
    ["previewRollDeg", formatNumber(state.objPreview.rollDeg)],
    ["previewZoom", formatNumber(state.objPreview.zoom)],
    ["previewPanX", formatNumber(state.objPreview.panX)],
    ["previewPanY", formatNumber(state.objPreview.panY)],
    ["previewMode", state.objPreview.mode],
    ["sampledPointCount", formatNullableCount(state.objPreviewStats.sampledPointCount)],
    ["sampledEdgeCount", formatNullableCount(state.objPreviewStats.sampledEdgeCount)],
    ["objPoseSyncEnabled", String(state.objPoseSync.enabled)],
    ["objPoseSyncSource", state.objPoseSync.source],
    ["objAppliedPose", formatAppliedObjPose()],
    ["appliedYawDeg", formatNullableNumber(state.objPoseSync.appliedYawDeg)],
    ["appliedPitchDeg", formatNullableNumber(state.objPoseSync.appliedPitchDeg)],
    ["appliedRollDeg", formatNullableNumber(state.objPoseSync.appliedRollDeg)],
    ["yawSign", String(state.objPoseSync.yawSign)],
    ["pitchSign", String(state.objPoseSync.pitchSign)],
    ["rollSign", String(state.objPoseSync.rollSign)],
    ["yawOffsetDeg", formatNumber(state.objPoseSync.yawOffsetDeg)],
    ["pitchOffsetDeg", formatNumber(state.objPoseSync.pitchOffsetDeg)],
    ["rollOffsetDeg", formatNumber(state.objPoseSync.rollOffsetDeg)],
    ["rotationCenterX", formatNumber(state.objPoseSync.rotationCenterX)],
    ["rotationCenterY", formatNumber(state.objPoseSync.rotationCenterY)],
    ["rotationCenterZ", formatNumber(state.objPoseSync.rotationCenterZ)],
    ["objPoseSyncSampledPointCount", formatNullableCount(state.objPoseSyncStats.sampledPointCount)],
    ["objPoseSyncSampledEdgeCount", formatNullableCount(state.objPoseSyncStats.sampledEdgeCount)],
    ["errorMessage", state.objErrorMessage ?? "null"],
  ]
}

function getRenderedIdealItems(): Array<[string, string]> {
  const summary = state.renderedIdeal.summary
  return [
    ["status", summary.status],
    ["canvasWidth", formatNullableCount(summary.canvasWidth)],
    ["canvasHeight", formatNullableCount(summary.canvasHeight)],
    ["faceCount", formatNullableCount(summary.faceCount)],
    ["drawnFaceCount", formatNullableCount(summary.drawnFaceCount)],
    ["skippedFaceCount", formatNullableCount(summary.skippedFaceCount)],
    ["renderMode", summary.renderMode],
    ["lightDirection", formatPoint(summary.lightDirection)],
    ["appliedYawDeg", formatNullableNumber(summary.appliedYawDeg)],
    ["appliedPitchDeg", formatNullableNumber(summary.appliedPitchDeg)],
    ["appliedRollDeg", formatNullableNumber(summary.appliedRollDeg)],
    ["rotationCenter", formatPoint(summary.rotationCenter)],
    ["errorMessage", summary.errorMessage ?? "null"],
  ]
}

function getRealtimeItems(): Array<[string, string]> {
  const breakdown = state.realtimeDebug.currentAnalysisTimingBreakdown
  const averageBreakdown = state.realtimeDebug.averageCurrentAnalysisTimingBreakdown
  return [
    ["状態", formatRealtimeStatus(state.realtimeDebug.status)],
    ["処理モード", realtimeModeLabels[state.realtimeDebug.mode]],
    ["目標FPS", formatNumber(state.realtimeDebug.targetFps)],
    ["実効FPS", formatRealtimeNullableNumber(state.realtimeDebug.effectiveFps)],
    ["処理フレーム数", formatNullableCount(state.realtimeDebug.frameCount)],
    ["スキップ数", formatNullableCount(state.realtimeDebug.skippedCount)],
    ["エラー数", formatNullableCount(state.realtimeDebug.errorCount)],
    ["現在顔解析ms", formatRealtimeNullableNumber(state.realtimeDebug.currentAnalysisMs)],
    ["OBJレンダーms", formatRealtimeNullableNumber(state.realtimeDebug.objRenderMs)],
    ["MediaPipe再検出ms", formatRealtimeNullableNumber(state.realtimeDebug.mediaPipeRedetectMs)],
    ["合計ms", formatRealtimeNullableNumber(state.realtimeDebug.totalMs)],
    ["平均合計ms", formatRealtimeNullableNumber(state.realtimeDebug.averageTotalMs)],
    ["現在顔解析 内訳", ""],
    ["MediaPipe検出ms", formatRealtimeNullableNumber(breakdown.mediaPipeDetectMs)],
    ["解析結果整形ms", formatRealtimeNullableNumber(breakdown.buildCurrentAnalysisMs)],
    ["ライブ重ね描画ms", formatRealtimeNullableNumber(breakdown.liveOverlayDrawMs)],
    ["デバッグ更新ms", formatRealtimeNullableNumber(breakdown.debugUpdateMs)],
    ["現在顔解析合計ms", formatRealtimeNullableNumber(breakdown.currentAnalysisTotalMs)],
    ["平均MediaPipe検出ms", formatRealtimeNullableNumber(averageBreakdown.mediaPipeDetectMs)],
    ["平均解析結果整形ms", formatRealtimeNullableNumber(averageBreakdown.buildCurrentAnalysisMs)],
    ["平均ライブ重ね描画ms", formatRealtimeNullableNumber(averageBreakdown.liveOverlayDrawMs)],
    ["平均デバッグ更新ms", formatRealtimeNullableNumber(averageBreakdown.debugUpdateMs)],
    ["平均現在顔解析合計ms", formatRealtimeNullableNumber(averageBreakdown.currentAnalysisTotalMs)],
    ["平均OBJレンダーms", formatRealtimeNullableNumber(state.realtimeDebug.averageObjRenderMs)],
    ["ボトルネック", getRealtimeBottleneck()],
    ["timeupdate解析要求数", formatNullableCount(state.realtimeDebug.timeupdateAnalysisRequestCount)],
    ["realtime tick解析要求数", formatNullableCount(state.realtimeDebug.realtimeTickAnalysisRequestCount)],
    ["処理中skip数", formatNullableCount(state.realtimeDebug.skippedByInProgressCount)],
    ["動画なしskip数", formatNullableCount(state.realtimeDebug.skippedByNoVideoCount)],
    ["停止中skip数", formatNullableCount(state.realtimeDebug.skippedByPausedVideoCount)],
    ["最終更新時刻", state.realtimeDebug.lastUpdatedAt ?? "未計測"],
    ["エラーメッセージ", state.realtimeDebug.errorMessage ?? "なし"],
    ["判定", getRealtimeJudgement()],
  ]
}

function getMediaPipeBenchmarkItems(): Array<[string, string]> {
  const latest = state.mediaPipeBenchmark.latestResult
  const best = getBestMediaPipeBenchmarkResult()
  return [
    ["状態", formatMediaPipeBenchmarkStatus(state.mediaPipeBenchmark.status)],
    ["選択delegate", mediaPipeBenchmarkDelegateLabels[state.mediaPipeBenchmark.selectedDelegate]],
    ["選択出力オプション", mediaPipeBenchmarkOutputModeLabels[state.mediaPipeBenchmark.selectedOutputMode]],
    ["実行回数", formatNullableCount(state.mediaPipeBenchmark.iterationCount)],
    ["最新結果", latest ? formatMediaPipeBenchmarkCondition(latest) : "未計測"],
    ["delegate", latest ? mediaPipeBenchmarkDelegateLabels[latest.delegate] : "未計測"],
    ["出力オプション", latest ? mediaPipeBenchmarkOutputModeLabels[latest.outputMode] : "未計測"],
    ["初期化ms", formatRealtimeNullableNumber(latest?.initializationMs ?? null)],
    ["初回detect ms", formatRealtimeNullableNumber(latest?.firstDetectMs ?? null)],
    ["2回目以降平均ms", formatRealtimeNullableNumber(latest?.warmDetectAverageMs ?? null)],
    ["平均detect ms", formatRealtimeNullableNumber(latest?.averageDetectMs ?? null)],
    ["最小detect ms", formatRealtimeNullableNumber(latest?.minDetectMs ?? null)],
    ["最大detect ms", formatRealtimeNullableNumber(latest?.maxDetectMs ?? null)],
    ["成功回数", formatNullableCount(latest?.successCount ?? null)],
    ["エラー回数", formatNullableCount(latest?.errorCount ?? null)],
    ["エラーメッセージ", latest?.errorMessage ?? state.mediaPipeBenchmark.errorMessage ?? "なし"],
    ["最良条件", formatMediaPipeBenchmarkCondition(best)],
    ["最良warm平均ms", formatRealtimeNullableNumber(best?.warmDetectAverageMs ?? null)],
    ["比較履歴", formatMediaPipeBenchmarkHistory()],
  ]
}

function getWarpMeshItems(): Array<[string, string]> {
  return [
    ["sourceVerticesStatus", "not_ready"],
    ["targetVerticesStatus", "not_ready"],
    ["triangleIndicesStatus", "not_ready"],
    ["webglWarpStatus", "not_implemented"],
  ]
}

function getRawState() {
  return {
    labName: LAB_NAME,
    activePreviewTab: state.activePreviewTab,
    activeDebugTab: state.activeDebugTab,
    overlay: state.overlay,
    objFile: state.objFile,
    objSummary: state.objSummary,
    objPreviewState: getRoundedObjPreviewState(),
    realtimeDebugState: getRoundedRealtimeDebugState(),
    mediaPipeBenchmarkState: getMediaPipeBenchmarkRawState(),
    mediaPipeBenchmarkResultsPreview: state.mediaPipeBenchmark.results.slice(0, 8).map(roundMediaPipeBenchmarkResult),
    debugExportPreview: getDebugExportPreview(),
    objPoseSyncState: getRoundedObjPoseSyncState(),
    currentPoseSummary: roundPoseForState(state.currentAnalysis.pose),
    appliedPoseSummary: {
      yaw: roundForState(state.objPoseSync.appliedYawDeg),
      pitch: roundForState(state.objPoseSync.appliedPitchDeg),
      roll: roundForState(state.objPoseSync.appliedRollDeg),
      yawSign: state.objPoseSync.yawSign,
      pitchSign: state.objPoseSync.pitchSign,
      rollSign: state.objPoseSync.rollSign,
      yawOffsetDeg: roundForState(state.objPoseSync.yawOffsetDeg),
      pitchOffsetDeg: roundForState(state.objPoseSync.pitchOffsetDeg),
      rollOffsetDeg: roundForState(state.objPoseSync.rollOffsetDeg),
      rotationCenterX: roundForState(state.objPoseSync.rotationCenterX),
      rotationCenterY: roundForState(state.objPoseSync.rotationCenterY),
      rotationCenterZ: roundForState(state.objPoseSync.rotationCenterZ),
      source: state.objPoseSync.source,
      enabled: state.objPoseSync.enabled,
    },
    verticesPreview: state.objGeometry.vertices.slice(0, 5).map(roundPointForState),
    facesPreview: state.objGeometry.faces.slice(0, 5),
    sampledPointCount: state.objPreviewStats.sampledPointCount,
    sampledEdgeCount: state.objPreviewStats.sampledEdgeCount,
    poseSyncSampledPointCount: state.objPoseSyncStats.sampledPointCount,
    poseSyncSampledEdgeCount: state.objPoseSyncStats.sampledEdgeCount,
    objErrorMessage: state.objErrorMessage,
    liveVideo: getLiveVideoRawSummary(),
    liveMediaPipe: {
      status: state.liveMediaPipe.status,
      error: state.liveMediaPipe.error,
      liveTimestampMs: roundForState(state.liveMediaPipe.liveTimestampMs),
    },
    currentAnalysis: getCurrentAnalysisRawSummary(),
    currentLandmarksPreview: state.currentAnalysis.landmarks478
      .slice(0, LANDMARK_PREVIEW_COUNT)
      .map(roundLandmarkForState),
    renderedIdealRenderSummary: state.renderedIdeal.summary,
    renderedIdeal: {
      renderStatus: state.renderedIdeal.summary.status,
      renderMode: state.renderedIdeal.summary.renderMode,
      mediaPipeStatus: "not_implemented",
      renderedIdeal478Count: null,
      renderedIdealPose: null,
    },
    warpMesh: {
      sourceVerticesStatus: "not_ready",
      targetVerticesStatus: "not_ready",
      triangleIndicesStatus: "not_ready",
      webglWarpStatus: "not_implemented",
    },
    logs: state.logs.slice(-20),
  }
}

function parseObjText(objText: string): ObjParseResult {
  const vertices: ObjVertex[] = []
  const pendingFaces: Array<{ lineNumber: number; tokens: string[] }> = []
  const warnings: string[] = []
  const lines = objText.split(/\r?\n/)

  lines.forEach((sourceLine, index) => {
    const lineNumber = index + 1
    const line = sourceLine.split("#", 1)[0].trim()
    if (!line) {
      return
    }

    const parts = line.split(/\s+/)
    const command = parts[0]

    if (command === "v") {
      const values = parts.slice(1, 4).map((value) => Number(value))
      if (values.length < 3 || values.some((value) => !Number.isFinite(value))) {
        warnings.push(`line ${lineNumber}: 不正な vertex 座標を skip しました。`)
        return
      }
      vertices.push({ x: values[0], y: values[1], z: values[2] })
      return
    }

    if (command === "f") {
      const tokens = parts.slice(1)
      if (tokens.length < 3) {
        warnings.push(`line ${lineNumber}: face の頂点数が不足しているため skip しました。`)
        return
      }
      pendingFaces.push({ lineNumber, tokens })
    }
  })

  const faces = pendingFaces.flatMap(({ lineNumber, tokens }) => {
    const indices: number[] = []

    for (const token of tokens) {
      const rawIndex = token.split("/")[0]
      if (!/^-?\d+$/.test(rawIndex)) {
        warnings.push(`line ${lineNumber}: face index "${token}" が不正なため face を skip しました。`)
        return []
      }

      const objIndex = Number(rawIndex)
      if (objIndex < 0) {
        warnings.push(`line ${lineNumber}: 負の face index は未対応のため face を skip しました。`)
        return []
      }
      if (objIndex === 0) {
        warnings.push(`line ${lineNumber}: OBJ index 0 は無効なため face を skip しました。`)
        return []
      }

      const zeroBasedIndex = objIndex - 1
      if (zeroBasedIndex < 0 || zeroBasedIndex >= vertices.length) {
        warnings.push(`line ${lineNumber}: face index ${objIndex} が頂点範囲外のため face を skip しました。`)
        return []
      }

      indices.push(zeroBasedIndex)
    }

    return [{ indices }]
  })

  return { vertices, faces, warnings }
}

function createUniqueEdges(faces: ObjFace[]): ObjEdge[] {
  const edgeKeys = new Set<string>()
  const edges: ObjEdge[] = []

  faces.forEach((face) => {
    for (let index = 0; index < face.indices.length; index += 1) {
      const a = face.indices[index]
      const b = face.indices[(index + 1) % face.indices.length]
      const min = Math.min(a, b)
      const max = Math.max(a, b)
      const key = `${min}:${max}`
      if (!edgeKeys.has(key)) {
        edgeKeys.add(key)
        edges.push({ a: min, b: max })
      }
    }
  })

  return edges
}

function createEmptyObjSummary(): ObjSummary {
  return {
    fileName: "",
    fileSize: 0,
    fileType: "",
    parseStatus: "not_loaded",
    vertexCount: 0,
    faceCount: 0,
    triangleFaceCount: 0,
    polygonFaceCount: 0,
    bounds: null,
    center: null,
    size: null,
    maxDimension: null,
    warningCount: 0,
    warningsPreview: [],
  }
}

function createEmptyObjGeometry(): ObjGeometryState {
  return {
    vertices: [],
    faces: [],
    edges: [],
  }
}

function createDefaultObjPreviewState(): ObjPreviewState {
  return {
    yawDeg: 0,
    pitchDeg: 0,
    rollDeg: 0,
    zoom: 1,
    panX: 0,
    panY: 0,
    mode: "points_wireframe",
    maxPoints: 8000,
    maxEdges: 12000,
  }
}

function createDefaultObjPoseSyncState(): ObjPoseSyncState {
  return {
    enabled: true,
    yawSign: 1,
    pitchSign: 1,
    rollSign: 1,
    yawOffsetDeg: 0,
    pitchOffsetDeg: 0,
    rollOffsetDeg: 0,
    rotationCenterX: 0,
    rotationCenterY: 0,
    rotationCenterZ: 0,
    appliedYawDeg: null,
    appliedPitchDeg: null,
    appliedRollDeg: null,
    source: "none",
  }
}

function createDefaultRenderedIdealState(): RenderedIdealState {
  return {
    backgroundMode: "light",
    colorMode: "clay",
    summary: {
      status: "not_ready",
      canvasWidth: 0,
      canvasHeight: 0,
      renderMode: "shaded_faces",
      faceCount: 0,
      drawnFaceCount: 0,
      skippedFaceCount: 0,
      lightDirection: {
        x: roundForState(RENDERED_IDEAL_LIGHT_DIRECTION.x) ?? 0,
        y: roundForState(RENDERED_IDEAL_LIGHT_DIRECTION.y) ?? 0,
        z: roundForState(RENDERED_IDEAL_LIGHT_DIRECTION.z) ?? 0,
      },
      appliedYawDeg: null,
      appliedPitchDeg: null,
      appliedRollDeg: null,
      rotationCenter: { x: 0, y: 0, z: 0 },
      errorMessage: null,
    },
  }
}

function createRenderedIdealRenderSummary(
  status: RenderedIdealRenderStatus,
  overrides: Partial<RenderedIdealRenderSummary> = {},
): RenderedIdealRenderSummary {
  return {
    status,
    canvasWidth: overrides.canvasWidth ?? 0,
    canvasHeight: overrides.canvasHeight ?? 0,
    renderMode: "shaded_faces",
    faceCount: state.objGeometry.faces.length,
    drawnFaceCount: overrides.drawnFaceCount ?? 0,
    skippedFaceCount: overrides.skippedFaceCount ?? 0,
    lightDirection: {
      x: roundForState(RENDERED_IDEAL_LIGHT_DIRECTION.x) ?? 0,
      y: roundForState(RENDERED_IDEAL_LIGHT_DIRECTION.y) ?? 0,
      z: roundForState(RENDERED_IDEAL_LIGHT_DIRECTION.z) ?? 0,
    },
    appliedYawDeg: roundForState(state.objPoseSync.appliedYawDeg),
    appliedPitchDeg: roundForState(state.objPoseSync.appliedPitchDeg),
    appliedRollDeg: roundForState(state.objPoseSync.appliedRollDeg),
    rotationCenter: {
      x: roundForState(state.objPoseSync.rotationCenterX) ?? 0,
      y: roundForState(state.objPoseSync.rotationCenterY) ?? 0,
      z: roundForState(state.objPoseSync.rotationCenterZ) ?? 0,
    },
    errorMessage: overrides.errorMessage ?? null,
  }
}

function createEmptyLiveVideoState(): LiveVideoState {
  return {
    loaded: false,
    fileName: null,
    fileSize: null,
    fileType: null,
    objectUrl: null,
    durationSec: null,
    width: null,
    height: null,
    currentTimeSec: null,
    playbackStatus: "stopped",
    status: "not_loaded",
    errorMessage: null,
  }
}

function createEmptyQualitySummary(): QualitySummary {
  return {
    status: "not_ready",
    expectedLandmarkCount: REQUIRED_LANDMARK_COUNT,
    landmarkCount: 0,
    hasPose: false,
  }
}

function createEmptyCurrentAnalysis(): CurrentFrameAnalysis {
  return {
    status: "not_ready",
    analyzedTimeSec: null,
    landmarks478: [],
    landmarkCount: 0,
    pose: {
      yaw: null,
      pitch: null,
      roll: null,
    },
    blendshapes: [],
    expressionSummary: null,
    qualityScore: null,
    qualitySummary: createEmptyQualitySummary(),
    errorMessage: null,
  }
}

function createEmptyCurrentAnalysisTimingBreakdown(): CurrentAnalysisTimingBreakdown {
  return {
    mediaPipeDetectMs: null,
    buildCurrentAnalysisMs: null,
    liveOverlayDrawMs: null,
    debugUpdateMs: null,
    currentAnalysisTotalMs: null,
  }
}

function createDefaultRealtimeDebugState(
  overrides: Partial<Pick<RealtimeDebugState, "mode" | "targetFps">> = {},
): RealtimeDebugState {
  return {
    status: "idle",
    mode: overrides.mode ?? "current_analysis_obj_render",
    targetFps: overrides.targetFps ?? 10,
    frameCount: 0,
    skippedCount: 0,
    errorCount: 0,
    currentAnalysisMs: null,
    objRenderMs: null,
    mediaPipeRedetectMs: null,
    totalMs: null,
    currentAnalysisTimingBreakdown: createEmptyCurrentAnalysisTimingBreakdown(),
    averageCurrentAnalysisTimingBreakdown: createEmptyCurrentAnalysisTimingBreakdown(),
    averageObjRenderMs: null,
    averageTotalMs: null,
    effectiveFps: null,
    lastUpdatedAt: null,
    errorMessage: null,
    timeupdateAnalysisRequestCount: 0,
    realtimeTickAnalysisRequestCount: 0,
    skippedByInProgressCount: 0,
    skippedByNoVideoCount: 0,
    skippedByPausedVideoCount: 0,
  }
}

function createDefaultMediaPipeBenchmarkState(
  overrides: Partial<Pick<MediaPipeBenchmarkState, "selectedDelegate" | "selectedOutputMode" | "iterationCount">> = {},
): MediaPipeBenchmarkState {
  return {
    status: "idle",
    selectedDelegate: overrides.selectedDelegate ?? "default",
    selectedOutputMode: overrides.selectedOutputMode ?? "landmarks_matrix_blendshapes",
    iterationCount: overrides.iterationCount ?? 10,
    latestResult: null,
    results: [],
    errorMessage: null,
  }
}

function createFaceLandmarkerOptions(config: {
  delegate: MediaPipeBenchmarkDelegate
  outputFaceBlendshapes: boolean
  outputFacialTransformationMatrixes: boolean
}): FaceLandmarkerOptions {
  const baseOptions: FaceLandmarkerOptions["baseOptions"] = {
    modelAssetPath: MEDIAPIPE_FACE_LANDMARKER_MODEL_ASSET_PATH,
  }
  if (config.delegate !== "default") {
    baseOptions.delegate = config.delegate
  }

  return {
    baseOptions,
    runningMode: "VIDEO",
    numFaces: 1,
    outputFaceBlendshapes: config.outputFaceBlendshapes,
    outputFacialTransformationMatrixes: config.outputFacialTransformationMatrixes,
  }
}

function getMediaPipeBenchmarkFaceLandmarkerConfig(options: {
  delegate: MediaPipeBenchmarkDelegate
  outputMode: MediaPipeBenchmarkOutputMode
}) {
  return {
    delegate: options.delegate,
    outputFaceBlendshapes:
      options.outputMode === "landmarks_blendshapes" ||
      options.outputMode === "landmarks_matrix_blendshapes",
    outputFacialTransformationMatrixes:
      options.outputMode === "landmarks_matrix" ||
      options.outputMode === "landmarks_matrix_blendshapes",
  }
}

function createFileObjSummary(file: File, parseStatus: ObjParseStatus): ObjSummary {
  return {
    ...createEmptyObjSummary(),
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || "unknown",
    parseStatus,
  }
}

function createParsedObjSummary(file: File, parseResult: ObjParseResult): ObjSummary {
  const bounds = calculateObjBounds(parseResult.vertices)
  const size = bounds
    ? {
        x: bounds.maxX - bounds.minX,
        y: bounds.maxY - bounds.minY,
        z: bounds.maxZ - bounds.minZ,
      }
    : null
  const center = bounds
    ? {
        x: (bounds.minX + bounds.maxX) / 2,
        y: (bounds.minY + bounds.maxY) / 2,
        z: (bounds.minZ + bounds.maxZ) / 2,
      }
    : null
  const triangleFaceCount = parseResult.faces.filter((face) => face.indices.length === 3).length
  const polygonFaceCount = parseResult.faces.filter((face) => face.indices.length > 3).length

  return {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || "unknown",
    parseStatus: "parsed",
    vertexCount: parseResult.vertices.length,
    faceCount: parseResult.faces.length,
    triangleFaceCount,
    polygonFaceCount,
    bounds,
    center,
    size,
    maxDimension: size ? Math.max(size.x, size.y, size.z) : null,
    warningCount: parseResult.warnings.length,
    warningsPreview: parseResult.warnings.slice(0, 20),
  }
}

function calculateObjBounds(vertices: ObjVertex[]): ObjBounds | null {
  if (vertices.length === 0) {
    return null
  }

  return vertices.reduce<ObjBounds>(
    (bounds, vertex) => ({
      minX: Math.min(bounds.minX, vertex.x),
      minY: Math.min(bounds.minY, vertex.y),
      minZ: Math.min(bounds.minZ, vertex.z),
      maxX: Math.max(bounds.maxX, vertex.x),
      maxY: Math.max(bounds.maxY, vertex.y),
      maxZ: Math.max(bounds.maxZ, vertex.z),
    }),
    {
      minX: vertices[0].x,
      minY: vertices[0].y,
      minZ: vertices[0].z,
      maxX: vertices[0].x,
      maxY: vertices[0].y,
      maxZ: vertices[0].z,
    },
  )
}

function getObjFileStatus() {
  if (!state.objFile.loaded) {
    return "not_loaded"
  }
  if (state.objSummary.parseStatus === "not_parsed") {
    return "loaded_not_parsed"
  }
  return state.objSummary.parseStatus
}

function getObjPreviewStatus(): ObjPreviewStatus {
  if (state.objSummary.parseStatus === "error") {
    return "error"
  }
  if (state.objSummary.parseStatus === "parsed" && state.objGeometry.vertices.length > 0) {
    return "ready"
  }
  return "not_ready"
}

function getObjPreviewMessage(status: ObjPreviewStatus) {
  if (status === "ready") {
    return "OBJ解析が完了しました。簡易 3D preview を表示しています。"
  }
  if (status === "error") {
    return "OBJ解析に失敗したため、3D preview を表示できません。"
  }
  return "OBJファイルを読み込むと、ここに OBJ 3D preview を表示します。"
}

function getObjPoseSyncMessage() {
  if (getObjPreviewStatus() !== "ready") {
    return "OBJを読み込むと、現在姿勢を反映したOBJ previewを表示します。"
  }
  if (state.currentAnalysis.status !== "detected" || !hasFullPose(state.currentAnalysis.pose)) {
    return "現在フレーム解析を実行すると、OBJに現在姿勢を反映します。"
  }
  if (!state.objPoseSync.enabled) {
    return "姿勢同期がOFFのため、現在姿勢はOBJ previewへ反映していません。"
  }
  return "現在姿勢を反映したOBJ previewを表示しています。"
}

function getObjPoseSyncStatus() {
  if (getObjPreviewStatus() !== "ready") {
    return "obj_not_ready"
  }
  if (!state.objPoseSync.enabled) {
    return "disabled"
  }
  return state.objPoseSync.source === "current_frame" ? "synced" : "waiting_current_frame"
}

function canRenderRenderedIdeal() {
  return (
    state.objFile.loaded &&
    getObjPreviewStatus() === "ready" &&
    state.currentAnalysis.status === "detected" &&
    hasFullPose(state.currentAnalysis.pose)
  )
}

function getRenderedIdealMessage() {
  if (!state.objFile.loaded || getObjPreviewStatus() !== "ready") {
    return "OBJを読み込むと、ここにレンダー理想2Dプレビューを表示します。"
  }
  if (state.currentAnalysis.status !== "detected" || !hasFullPose(state.currentAnalysis.pose)) {
    return "現在フレーム解析を実行すると、現在姿勢でOBJをレンダリングできます。"
  }
  if (state.renderedIdeal.summary.status === "error") {
    return "レンダー中にエラーが発生しました。"
  }
  return "現在姿勢を反映したOBJの2Dレンダーを表示しています。"
}

function renderObjPreviewSummary() {
  const summary = state.objSummary
  if (!state.objFile.loaded) {
    return ""
  }

  if (summary.parseStatus === "error") {
    return `
      <p class="obj-preview-message">OBJ解析に失敗したため、3D preview を表示できません。</p>
      <dl class="obj-preview-list">
        <div><dt>fileName</dt><dd>${escapeHtml(summary.fileName)}</dd></div>
        <div><dt>parseStatus</dt><dd>error</dd></div>
        <div><dt>errorMessage</dt><dd>${escapeHtml(state.objErrorMessage ?? "null")}</dd></div>
      </dl>
    `
  }

  if (summary.parseStatus !== "parsed") {
    return `
      <p class="obj-preview-message">OBJファイルを読み込み中です。</p>
      <dl class="obj-preview-list">
        <div><dt>fileName</dt><dd>${escapeHtml(summary.fileName)}</dd></div>
        <div><dt>fileSize</dt><dd>${escapeHtml(formatBytes(summary.fileSize))}</dd></div>
        <div><dt>parseStatus</dt><dd>${summary.parseStatus}</dd></div>
      </dl>
    `
  }

  return `
    <p class="obj-preview-message">OBJ解析が完了しました。簡易 3D preview を表示しています。</p>
    <dl class="obj-preview-list">
      <div><dt>fileName</dt><dd>${escapeHtml(summary.fileName)}</dd></div>
      <div><dt>vertexCount</dt><dd>${summary.vertexCount}</dd></div>
      <div><dt>faceCount</dt><dd>${summary.faceCount}</dd></div>
      <div><dt>previewMode</dt><dd>${state.objPreview.mode}</dd></div>
      <div><dt>sampledPointCount</dt><dd>${state.objPreviewStats.sampledPointCount}</dd></div>
      <div><dt>sampledEdgeCount</dt><dd>${state.objPreviewStats.sampledEdgeCount}</dd></div>
      <div><dt>bounds</dt><dd>${escapeHtml(formatBounds(summary.bounds))}</dd></div>
      <div><dt>center</dt><dd>${escapeHtml(formatPoint(summary.center))}</dd></div>
      <div><dt>size</dt><dd>${escapeHtml(formatPoint(summary.size))}</dd></div>
    </dl>
  `
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

function createLogSection() {
  const section = document.createElement("section")
  section.className = "log-section"
  section.setAttribute("aria-label", "ログ")
  const heading = document.createElement("h3")
  heading.textContent = "ログ"
  const list = document.createElement("ul")
  state.logs.forEach((log) => {
    const item = document.createElement("li")
    item.textContent = log
    list.appendChild(item)
  })
  section.append(heading, list)
  return section
}

async function exportDebug() {
  const debugExport = buildDebugExport()
  const json = JSON.stringify(debugExport, null, 2)
  const status = getElement<HTMLElement>("[data-debug-export-status]")

  try {
    await navigator.clipboard.writeText(json)
    status.textContent = "デバッグJSONをクリップボードにコピーしました。"
    addLog("デバッグJSONをクリップボードにコピーしました。")
  } catch {
    downloadTextFile("ideal-obj-render-warp-lab-debug-export.json", json, "application/json;charset=utf-8")
    status.textContent = "クリップボードにコピーできなかったため、デバッグJSONをダウンロードしました。"
    addLog("デバッグJSONをダウンロードしました。")
  }

  renderAll()
}

function downloadTextFile(fileName: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  link.click()
  URL.revokeObjectURL(link.href)
}

function buildDebugExport() {
  return {
    schemaVersion: "ideal_obj_render_warp_lab_debug_export_v1",
    createdAt: new Date().toISOString(),
    tool: {
      id: "ideal-obj-render-warp-lab",
      purpose: "MediaPipe detectForVideo performance comparison and OBJ render warp lab debugging",
    },
    environment: getEnvironmentDebugExport(),
    input: {
      obj: {
        fileName: state.objFile.fileName,
        vertexCount: state.objFile.loaded ? state.objSummary.vertexCount : null,
        faceCount: state.objFile.loaded ? state.objSummary.faceCount : null,
        bounds: state.objSummary.bounds,
      },
      liveVideo: {
        fileName: state.liveVideo.fileName,
        width: state.liveVideo.width,
        height: state.liveVideo.height,
        durationSec: roundForState(state.liveVideo.durationSec),
        currentTimeSec: roundForState(state.liveVideo.currentTimeSec),
        paused: state.liveVideo.loaded ? liveVideoElement.paused : null,
        readyState: state.liveVideo.loaded ? liveVideoElement.readyState : null,
      },
    },
    currentFace: {
      status: state.currentAnalysis.status,
      landmarkCount: state.currentAnalysis.status === "not_ready" ? null : state.currentAnalysis.landmarkCount,
      pose: roundPoseForState(state.currentAnalysis.pose),
      expressionSummary: getCurrentAnalysisRawSummary().expressionSummary,
      qualityScore: roundForState(state.currentAnalysis.qualityScore),
    },
    realtime: {
      state: getRoundedRealtimeDebugState(),
      timingBreakdown: getRoundedRealtimeDebugState().currentAnalysisTimingBreakdown,
      bottleneck: getRealtimeBottleneck(),
    },
    mediaPipeOptions: {
      currentLiveOptions: getCurrentLiveMediaPipeOptionsDebug(),
    },
    mediaPipeBenchmark: {
      latestResult: state.mediaPipeBenchmark.latestResult
        ? roundMediaPipeBenchmarkResult(state.mediaPipeBenchmark.latestResult)
        : null,
      results: state.mediaPipeBenchmark.results.map(roundMediaPipeBenchmarkResult),
      summary: getMediaPipeBenchmarkSummary(),
    },
    notes: [
      "vertices/faces/current478/MediaPipe result/canvas data URL are intentionally omitted.",
      "Benchmark initializationMs is measured separately from detectForVideo timings.",
    ],
  }
}

function addLog(message: string) {
  const timestamp = new Date().toLocaleTimeString("ja-JP", { hour12: false })
  state.logs = [`${timestamp} ${message}`, ...state.logs].slice(0, 40)
}

function resetLiveAnalysisResults() {
  disposeLiveFaceLandmarker("uninitialized")
  resetLiveTimestamp()
  state.currentAnalysis = createEmptyCurrentAnalysis()
  updateObjPoseSyncFromCurrentAnalysis()
  liveAnalysisRequestId += 1
  liveAnalysisInProgress = false
  lastAutoLiveAnalysisAtSec = Number.NEGATIVE_INFINITY
  clearLiveOverlay()
}

function disposeLiveFaceLandmarker(nextStatus: MediaPipeStatus = "disposed") {
  liveFaceLandmarker?.close()
  liveFaceLandmarker = null
  liveFaceLandmarkerPromise = null
  state.liveMediaPipe.status = nextStatus
}

function resetLiveTimestamp() {
  state.liveMediaPipe.liveTimestampMs = 0
}

function nextLiveTimestampMs() {
  state.liveMediaPipe.liveTimestampMs += MEDIAPIPE_TIMESTAMP_STEP_MS
  return state.liveMediaPipe.liveTimestampMs
}

function clearLiveOverlay() {
  const context = liveOverlayCanvas.getContext("2d")
  if (!context) {
    return
  }
  context.clearRect(0, 0, liveOverlayCanvas.width, liveOverlayCanvas.height)
}

function cleanup() {
  stopRealtimeValidation("stopped")
  if (state.liveVideo.objectUrl) {
    URL.revokeObjectURL(state.liveVideo.objectUrl)
    state.liveVideo.objectUrl = null
  }
  disposeLiveFaceLandmarker("disposed")
}

function getLiveVideoRawSummary() {
  return {
    status: state.liveVideo.status,
    fileName: state.liveVideo.fileName,
    fileSize: state.liveVideo.fileSize,
    fileType: state.liveVideo.fileType,
    durationSec: roundForState(state.liveVideo.durationSec),
    width: state.liveVideo.width,
    height: state.liveVideo.height,
    currentTimeSec: roundForState(state.liveVideo.currentTimeSec),
    playbackStatus: state.liveVideo.playbackStatus,
    errorMessage: state.liveVideo.errorMessage,
  }
}

function getCurrentAnalysisRawSummary() {
  return {
    status: state.currentAnalysis.status,
    analyzedTimeSec: roundForState(state.currentAnalysis.analyzedTimeSec),
    landmarkCount: state.currentAnalysis.landmarkCount,
    pose: roundPoseForState(state.currentAnalysis.pose),
    blendshapeCount: state.currentAnalysis.blendshapes.length,
    expressionSummary: state.currentAnalysis.expressionSummary
      ? {
          group: state.currentAnalysis.expressionSummary.group,
          topBlendshapes: state.currentAnalysis.expressionSummary.topBlendshapes.map(
            roundBlendshapeForState,
          ),
          missingBlendshapeKeys: state.currentAnalysis.expressionSummary.missingBlendshapeKeys,
        }
      : null,
    qualityScore: roundForState(state.currentAnalysis.qualityScore),
    qualitySummary: state.currentAnalysis.qualitySummary,
    errorMessage: state.currentAnalysis.errorMessage,
  }
}

function getElement<TElement extends Element>(selector: string): TElement {
  const element = app.querySelector<TElement>(selector)
  if (!element) {
    throw new Error(`${selector} が見つかりません。`)
  }
  return element
}

function getSelectedFile(event: Event) {
  return event.currentTarget instanceof HTMLInputElement
    ? event.currentTarget.files?.[0] ?? null
    : null
}

function setChecked(action: string, checked: boolean) {
  getElement<HTMLInputElement>(`[data-action="${action}"]`).checked = checked
}

function setNumberValue(control: string, value: number) {
  getElement<HTMLInputElement>(`[data-control="${control}"]`).value = formatNumber(value)
}

function setDisabled(selector: string, disabled: boolean) {
  getElement<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>(selector).disabled = disabled
}

function isPreviewTab(value: string | undefined): value is PreviewTab {
  return previewTabs.some((tab) => tab.value === value)
}

function isDebugTab(value: string | undefined): value is DebugTab {
  return debugTabs.some((tab) => tab.value === value)
}

function isObjPreviewMode(value: string): value is ObjPreviewMode {
  return value === "points" || value === "wireframe" || value === "points_wireframe"
}

function isRealtimeMode(value: string): value is RealtimeMode {
  return value === "current_analysis_obj_render" ||
    value === "current_analysis_obj_render_mediapipe_redetect"
}

function isRealtimeTargetFps(value: number): value is typeof REALTIME_TARGET_FPS_OPTIONS[number] {
  return REALTIME_TARGET_FPS_OPTIONS.some((fps) => fps === value)
}

function isMediaPipeBenchmarkIterationCount(
  value: number,
): value is typeof MEDIAPIPE_BENCHMARK_ITERATION_OPTIONS[number] {
  return MEDIAPIPE_BENCHMARK_ITERATION_OPTIONS.some((count) => count === value)
}

function isMediaPipeBenchmarkDelegate(value: string): value is MediaPipeBenchmarkDelegate {
  return value === "default" || value === "CPU" || value === "GPU"
}

function isMediaPipeBenchmarkOutputMode(value: string): value is MediaPipeBenchmarkOutputMode {
  return value === "landmarks_only" ||
    value === "landmarks_matrix" ||
    value === "landmarks_blendshapes" ||
    value === "landmarks_matrix_blendshapes"
}

function isRenderedIdealBackgroundMode(value: string): value is RenderedIdealBackgroundMode {
  return value === "light" || value === "dark"
}

function isRenderedIdealColorMode(value: string): value is RenderedIdealColorMode {
  return value === "clay" || value === "grayscale"
}

function formatTimeStatus(videoState: LiveVideoState) {
  if (!videoState.loaded) {
    return "現在時刻: - / -"
  }
  return `現在時刻: ${formatSeconds(videoState.currentTimeSec)} / ${formatSeconds(videoState.durationSec)}`
}

function formatVideoSize() {
  return state.liveVideo.width === null || state.liveVideo.height === null
    ? "-"
    : `${state.liveVideo.width} x ${state.liveVideo.height}`
}

function formatBytes(value: number | null) {
  if (value === null) {
    return "null"
  }
  if (value < 1024) {
    return `${value} B`
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`
  }
  return `${(value / 1024 / 1024).toFixed(2)} MB`
}

function formatNullableCount(value: number | null) {
  return value === null ? "null" : String(value)
}

function formatNullableNumber(value: number | null) {
  return value === null || !Number.isFinite(value) ? "null" : formatNumber(value)
}

function formatBounds(bounds: ObjBounds | null) {
  if (!bounds) {
    return "null"
  }
  return `min(${formatNumber(bounds.minX)}, ${formatNumber(bounds.minY)}, ${formatNumber(bounds.minZ)}) / max(${formatNumber(bounds.maxX)}, ${formatNumber(bounds.maxY)}, ${formatNumber(bounds.maxZ)})`
}

function formatPoint(point: { x: number; y: number; z: number } | null) {
  if (!point) {
    return "null"
  }
  return `x=${formatNumber(point.x)}, y=${formatNumber(point.y)}, z=${formatNumber(point.z)}`
}

function formatStringList(values: string[]) {
  if (values.length === 0) {
    return "[]"
  }
  return values.join("\n")
}

function formatPose(pose: ReferencePose) {
  return `yaw ${formatNullableNumber(pose.yaw)} / pitch ${formatNullableNumber(pose.pitch)} / roll ${formatNullableNumber(pose.roll)}`
}

function formatAppliedObjPose() {
  return `yaw ${formatNullableNumber(state.objPoseSync.appliedYawDeg)} / pitch ${formatNullableNumber(state.objPoseSync.appliedPitchDeg)} / roll ${formatNullableNumber(state.objPoseSync.appliedRollDeg)}`
}

function formatExpressionSummary(summary: ExpressionSummary | null) {
  if (!summary) {
    return "not_ready"
  }

  const top = summary.topBlendshapes
    .map((item) => `${item.categoryName}:${formatNumber(item.score)}`)
    .join(" / ")
  const missing = summary.missingBlendshapeKeys.length > 0
    ? ` / missing ${summary.missingBlendshapeKeys.join(",")}`
    : ""
  return `${summary.group}${top ? ` / ${top}` : ""}${missing}`
}

function formatQualitySummary(summary: QualitySummary) {
  return `${summary.status} / landmarks ${summary.landmarkCount}/${summary.expectedLandmarkCount} / pose ${summary.hasPose ? "available" : "missing"}`
}

function formatRealtimeStatus(status: RealtimeStatus) {
  if (status === "idle") {
    return "未開始"
  }
  if (status === "running") {
    return "実行中"
  }
  if (status === "stopped") {
    return "停止"
  }
  return "エラー"
}

function formatRealtimeNullableNumber(value: number | null) {
  return value === null || !Number.isFinite(value) ? "未計測" : formatNumber(value)
}

function getRealtimeJudgement() {
  if (state.realtimeDebug.status === "error") {
    return "エラー"
  }
  const effectiveFps = state.realtimeDebug.effectiveFps
  if (effectiveFps === null || !Number.isFinite(effectiveFps)) {
    return "未計測"
  }
  if (effectiveFps >= 15) {
    return "良好"
  }
  if (effectiveFps >= 10) {
    return "警告"
  }
  return "厳しい"
}

function getRealtimeBottleneck() {
  const breakdown = state.realtimeDebug.currentAnalysisTimingBreakdown
  const candidates: Array<[string, number | null]> = [
    ["MediaPipe検出", breakdown.mediaPipeDetectMs],
    ["解析結果整形", breakdown.buildCurrentAnalysisMs],
    ["OBJレンダー", state.realtimeDebug.objRenderMs],
    ["ライブ重ね描画", breakdown.liveOverlayDrawMs],
    ["デバッグ更新", breakdown.debugUpdateMs],
  ]
  const measuredCandidates = candidates.filter((candidate): candidate is [string, number] =>
    candidate[1] !== null && Number.isFinite(candidate[1]),
  )
  if (measuredCandidates.length === 0) {
    return "未判定"
  }
  return measuredCandidates.reduce((largest, current) =>
    current[1] > largest[1] ? current : largest,
  )[0]
}

function getBestMediaPipeBenchmarkResult() {
  return state.mediaPipeBenchmark.results
    .filter((result) => result.warmDetectAverageMs !== null && result.successCount > 0)
    .reduce<MediaPipeBenchmarkResult | null>((best, result) => {
      if (!best) {
        return result
      }
      return (result.warmDetectAverageMs ?? Number.POSITIVE_INFINITY) <
        (best.warmDetectAverageMs ?? Number.POSITIVE_INFINITY)
        ? result
        : best
    }, null)
}

function formatMediaPipeBenchmarkStatus(status: MediaPipeBenchmarkStatus) {
  if (status === "idle") {
    return "未開始"
  }
  if (status === "running") {
    return "実行中"
  }
  if (status === "done") {
    return "完了"
  }
  return "エラー"
}

function formatMediaPipeBenchmarkLatestInline() {
  const latest = state.mediaPipeBenchmark.latestResult
  if (!latest) {
    return "未計測"
  }
  return `${mediaPipeBenchmarkDelegateLabels[latest.delegate]} / ${mediaPipeBenchmarkOutputModeLabels[latest.outputMode]} / warm平均 ${formatRealtimeNullableNumber(latest.warmDetectAverageMs)}`
}

function formatMediaPipeBenchmarkCondition(result: MediaPipeBenchmarkResult | null) {
  if (!result) {
    return "未計測"
  }
  return `${mediaPipeBenchmarkDelegateLabels[result.delegate]} / ${mediaPipeBenchmarkOutputModeLabels[result.outputMode]}`
}

function formatMediaPipeBenchmarkHistory() {
  if (state.mediaPipeBenchmark.results.length === 0) {
    return "未計測"
  }
  return state.mediaPipeBenchmark.results
    .slice(0, 12)
    .map((result) =>
      `${formatMediaPipeBenchmarkCondition(result)} / warm平均 ${formatRealtimeNullableNumber(result.warmDetectAverageMs)} / 初回 ${formatRealtimeNullableNumber(result.firstDetectMs)} / 成功 ${result.successCount} / エラー ${result.errorCount}`,
    )
    .join("\n")
}

function getMediaPipeBenchmarkSummary() {
  const best = getBestMediaPipeBenchmarkResult()
  return {
    resultCount: state.mediaPipeBenchmark.results.length,
    latestCondition: formatMediaPipeBenchmarkCondition(state.mediaPipeBenchmark.latestResult),
    latestWarmDetectAverageMs: roundForState(state.mediaPipeBenchmark.latestResult?.warmDetectAverageMs ?? null),
    bestCondition: formatMediaPipeBenchmarkCondition(best),
    bestWarmDetectAverageMs: roundForState(best?.warmDetectAverageMs ?? null),
  }
}

function getMediaPipeBenchmarkRawState() {
  return {
    status: state.mediaPipeBenchmark.status,
    selectedDelegate: state.mediaPipeBenchmark.selectedDelegate,
    selectedOutputMode: state.mediaPipeBenchmark.selectedOutputMode,
    iterationCount: state.mediaPipeBenchmark.iterationCount,
    latestResult: state.mediaPipeBenchmark.latestResult
      ? roundMediaPipeBenchmarkResult(state.mediaPipeBenchmark.latestResult)
      : null,
    resultCount: state.mediaPipeBenchmark.results.length,
    errorMessage: state.mediaPipeBenchmark.errorMessage,
    summary: getMediaPipeBenchmarkSummary(),
  }
}

function getDebugExportPreview() {
  const debugExport = buildDebugExport()
  return {
    schemaVersion: debugExport.schemaVersion,
    createdAt: debugExport.createdAt,
    environment: debugExport.environment,
    mediaPipeBenchmark: debugExport.mediaPipeBenchmark.summary,
    notes: debugExport.notes,
  }
}

function getCurrentLiveMediaPipeOptionsDebug() {
  return {
    runningMode: "VIDEO",
    numFaces: 1,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
    delegate: null,
    modelAssetPath: MEDIAPIPE_FACE_LANDMARKER_MODEL_ASSET_PATH,
    wasmPath: MEDIAPIPE_WASM_PATH,
  }
}

function getEnvironmentDebugExport() {
  const webglInfo = getWebglInfo()
  return {
    userAgent: navigator.userAgent,
    devicePixelRatio: window.devicePixelRatio || 1,
    hardwareConcurrency: Number.isFinite(navigator.hardwareConcurrency)
      ? navigator.hardwareConcurrency
      : null,
    crossOriginIsolated: typeof window.crossOriginIsolated === "boolean"
      ? window.crossOriginIsolated
      : null,
    webglAvailable: webglInfo.available,
    webglRenderer: webglInfo.renderer,
    webglVendor: webglInfo.vendor,
  }
}

function getWebglInfo() {
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl")
  if (!context) {
    return {
      available: false,
      renderer: null,
      vendor: null,
    }
  }
  const debugInfo = context.getExtension("WEBGL_debug_renderer_info")
  return {
    available: true,
    renderer: debugInfo
      ? String(context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
      : String(context.getParameter(context.RENDERER)),
    vendor: debugInfo
      ? String(context.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL))
      : String(context.getParameter(context.VENDOR)),
  }
}

function getMediaPipeBenchmarkNote() {
  if (!state.liveVideo.loaded) {
    return "ライブ動画を読み込むと比較できます。"
  }
  if (liveVideoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    return "ライブ動画の現在フレームがまだ準備できていません。"
  }
  if (state.mediaPipeBenchmark.status === "running") {
    return "比較実行中です。benchmark専用 detector を使うため、通常の live current detector は壊しません。"
  }
  return ""
}

function formatNumber(value: number) {
  return Number(value.toFixed(6)).toString()
}

function formatUpdatedAt() {
  return new Date().toLocaleTimeString("ja-JP", { hour12: false })
}

function sumNullableTimings(...values: Array<number | null>) {
  const measuredValues = values.filter((value): value is number =>
    value !== null && Number.isFinite(value),
  )
  if (measuredValues.length === 0) {
    return null
  }
  return measuredValues.reduce((sum, value) => sum + value, 0)
}

function averageNullableTiming(values: Array<number | null>) {
  const measuredValues = values.filter((value): value is number =>
    value !== null && Number.isFinite(value),
  )
  if (measuredValues.length === 0) {
    return null
  }
  return measuredValues.reduce((sum, value) => sum + value, 0) / measuredValues.length
}

function getRealtimePlaybackNote() {
  if (!state.liveVideo.loaded) {
    return ""
  }
  if (state.realtimeDebug.status === "running" && state.liveVideo.playbackStatus !== "playing") {
    return "ライブ動画が停止中のため、現在表示中のフレームを繰り返し解析しています。"
  }
  if (state.liveVideo.playbackStatus !== "playing") {
    return "ライブ動画が停止中です。再生してから開始してください。"
  }
  return ""
}

function formatSeconds(value: number | null) {
  return value === null || !Number.isFinite(value) ? "-" : `${value.toFixed(3)} sec`
}

function roundForState(value: number | null) {
  return value === null || !Number.isFinite(value) ? value : Number(value.toFixed(6))
}

function roundPointForState(point: ObjVertex): ObjVertex {
  return {
    x: roundForState(point.x) ?? 0,
    y: roundForState(point.y) ?? 0,
    z: roundForState(point.z) ?? 0,
  }
}

function roundLandmarkForState(landmark: ReferenceLandmark): ReferenceLandmark {
  return {
    index: landmark.index,
    x: roundForState(landmark.x) ?? 0,
    y: roundForState(landmark.y) ?? 0,
    z: roundForState(landmark.z) ?? 0,
  }
}

function roundPoseForState(pose: ReferencePose): ReferencePose {
  return {
    yaw: roundForState(pose.yaw),
    pitch: roundForState(pose.pitch),
    roll: roundForState(pose.roll),
  }
}

function roundBlendshapeForState(blendshape: ReferenceBlendshape): ReferenceBlendshape {
  return {
    categoryName: blendshape.categoryName,
    score: roundForState(blendshape.score) ?? 0,
  }
}

function getRoundedObjPreviewState() {
  return {
    yawDeg: roundForState(state.objPreview.yawDeg),
    pitchDeg: roundForState(state.objPreview.pitchDeg),
    rollDeg: roundForState(state.objPreview.rollDeg),
    zoom: roundForState(state.objPreview.zoom),
    panX: roundForState(state.objPreview.panX),
    panY: roundForState(state.objPreview.panY),
    mode: state.objPreview.mode,
    maxPoints: state.objPreview.maxPoints,
    maxEdges: state.objPreview.maxEdges,
  }
}

function getRoundedObjPoseSyncState() {
  return {
    enabled: state.objPoseSync.enabled,
    yawSign: state.objPoseSync.yawSign,
    pitchSign: state.objPoseSync.pitchSign,
    rollSign: state.objPoseSync.rollSign,
    yawOffsetDeg: roundForState(state.objPoseSync.yawOffsetDeg),
    pitchOffsetDeg: roundForState(state.objPoseSync.pitchOffsetDeg),
    rollOffsetDeg: roundForState(state.objPoseSync.rollOffsetDeg),
    rotationCenterX: roundForState(state.objPoseSync.rotationCenterX),
    rotationCenterY: roundForState(state.objPoseSync.rotationCenterY),
    rotationCenterZ: roundForState(state.objPoseSync.rotationCenterZ),
    appliedYawDeg: roundForState(state.objPoseSync.appliedYawDeg),
    appliedPitchDeg: roundForState(state.objPoseSync.appliedPitchDeg),
    appliedRollDeg: roundForState(state.objPoseSync.appliedRollDeg),
    source: state.objPoseSync.source,
  }
}

function getRoundedRealtimeDebugState(): RealtimeDebugState {
  return {
    ...state.realtimeDebug,
    currentAnalysisMs: roundForState(state.realtimeDebug.currentAnalysisMs),
    objRenderMs: roundForState(state.realtimeDebug.objRenderMs),
    mediaPipeRedetectMs: roundForState(state.realtimeDebug.mediaPipeRedetectMs),
    totalMs: roundForState(state.realtimeDebug.totalMs),
    currentAnalysisTimingBreakdown: roundCurrentAnalysisTimingBreakdown(
      state.realtimeDebug.currentAnalysisTimingBreakdown,
    ),
    averageCurrentAnalysisTimingBreakdown: roundCurrentAnalysisTimingBreakdown(
      state.realtimeDebug.averageCurrentAnalysisTimingBreakdown,
    ),
    averageObjRenderMs: roundForState(state.realtimeDebug.averageObjRenderMs),
    averageTotalMs: roundForState(state.realtimeDebug.averageTotalMs),
    effectiveFps: roundForState(state.realtimeDebug.effectiveFps),
  }
}

function roundCurrentAnalysisTimingBreakdown(
  breakdown: CurrentAnalysisTimingBreakdown,
): CurrentAnalysisTimingBreakdown {
  return {
    mediaPipeDetectMs: roundForState(breakdown.mediaPipeDetectMs),
    buildCurrentAnalysisMs: roundForState(breakdown.buildCurrentAnalysisMs),
    liveOverlayDrawMs: roundForState(breakdown.liveOverlayDrawMs),
    debugUpdateMs: roundForState(breakdown.debugUpdateMs),
    currentAnalysisTotalMs: roundForState(breakdown.currentAnalysisTotalMs),
  }
}

function roundMediaPipeBenchmarkResult(result: MediaPipeBenchmarkResult): MediaPipeBenchmarkResult {
  return {
    ...result,
    initializationMs: roundForState(result.initializationMs),
    firstDetectMs: roundForState(result.firstDetectMs),
    averageDetectMs: roundForState(result.averageDetectMs),
    warmDetectAverageMs: roundForState(result.warmDetectAverageMs),
    minDetectMs: roundForState(result.minDetectMs),
    maxDetectMs: roundForState(result.maxDetectMs),
    videoCurrentTimeSec: roundForState(result.videoCurrentTimeSec),
  }
}

function getObjPoseSyncRotationCenter(): ObjVertex {
  return {
    x: state.objPoseSync.rotationCenterX,
    y: state.objPoseSync.rotationCenterY,
    z: state.objPoseSync.rotationCenterZ,
  }
}

function getObjPoseSyncPreviewState(): ObjPreviewState {
  return {
    ...state.objPreview,
    yawDeg: state.objPoseSync.appliedYawDeg ?? 0,
    pitchDeg: state.objPoseSync.appliedPitchDeg ?? 0,
    rollDeg: state.objPoseSync.appliedRollDeg ?? 0,
    zoom: 1,
    panX: 0,
    panY: 0,
    mode: "wireframe",
  }
}

function calculateObjPreviewStats(previewState: ObjPreviewState): ObjPreviewStats {
  return {
    sampledPointCount:
      previewState.mode === "wireframe"
        ? 0
        : getSampledCount(state.objGeometry.vertices.length, previewState.maxPoints),
    sampledEdgeCount:
      previewState.mode === "points"
        ? 0
        : getSampledCount(state.objGeometry.edges.length, previewState.maxEdges),
  }
}

function getSampleStep(total: number, maxCount: number) {
  if (total <= 0) {
    return 1
  }
  return Math.max(1, Math.ceil(total / Math.max(1, maxCount)))
}

function getSampledCount(total: number, maxCount: number) {
  if (total <= 0) {
    return 0
  }
  return Math.ceil(total / getSampleStep(total, maxCount))
}

function yieldToBrowser() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0)
  })
}

function getObjCanvasScale(canvas: HTMLCanvasElement = objPreviewCanvas) {
  const rect = canvas.getBoundingClientRect()
  return Math.max(1, Math.min(rect.width, rect.height) * 0.42)
}

function hasFullPose(pose: ReferencePose) {
  return pose.yaw !== null && pose.pitch !== null && pose.roll !== null
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180
}

function normalizeDegrees(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }
  return ((value + 180) % 360 + 360) % 360 - 180
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function calculateFaceNormal(vertices: ObjVertex[]): ObjVertex | null {
  const a = vertices[0]
  for (let bIndex = 1; bIndex < vertices.length - 1; bIndex += 1) {
    const b = vertices[bIndex]
    const c = vertices[bIndex + 1]
    const normal = normalizeVector(crossVector(subtractVector(b, a), subtractVector(c, a)))
    if (normal.x !== 0 || normal.y !== 0 || normal.z !== 0) {
      return normal
    }
  }
  return null
}

function orientNormalToCamera(normal: ObjVertex | null): ObjVertex | null {
  if (!normal) {
    return null
  }
  return normal.z < 0 ? { x: -normal.x, y: -normal.y, z: -normal.z } : normal
}

function subtractVector(a: ObjVertex, b: ObjVertex): ObjVertex {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  }
}

function crossVector(a: ObjVertex, b: ObjVertex): ObjVertex {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  }
}

function dotVector(a: ObjVertex, b: ObjVertex) {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

function normalizeVector(vector: ObjVertex): ObjVertex {
  const length = Math.hypot(vector.x, vector.y, vector.z)
  if (!Number.isFinite(length) || length <= 0) {
    return { x: 0, y: 0, z: 0 }
  }

  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  }
}

function getRenderedIdealFaceColor(brightness: number) {
  const base = state.renderedIdeal.colorMode === "grayscale"
    ? { r: 184, g: 188, b: 192 }
    : { r: 205, g: 177, b: 151 }
  return rgbToCss({
    r: Math.round(base.r * brightness),
    g: Math.round(base.g * brightness),
    b: Math.round(base.b * brightness),
  })
}

function getRenderedIdealFaceStrokeColor(brightness: number) {
  const alpha = state.renderedIdeal.backgroundMode === "dark" ? 0.38 : 0.18
  const channel = Math.round(40 + 60 * brightness)
  return `rgba(${channel}, ${channel}, ${channel}, ${alpha})`
}

function rgbToCss(color: { r: number; g: number; b: number }) {
  return `rgb(${clamp(color.r, 0, 255)}, ${clamp(color.g, 0, 255)}, ${clamp(color.b, 0, 255)})`
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}
