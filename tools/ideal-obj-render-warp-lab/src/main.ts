import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision"
import type { Matrix, NormalizedLandmark } from "@mediapipe/tasks-vision"
import "./style.css"

type PreviewTab = "obj" | "renderedIdeal" | "live"
type DebugTab = "summary" | "current" | "obj" | "renderedIdeal" | "warpMesh" | "raw"
type PlaybackStatus = "stopped" | "playing" | "paused"
type ObjParseStatus = "not_loaded" | "not_parsed" | "parsed" | "error"
type ObjPreviewMode = "points" | "wireframe" | "points_wireframe"
type ObjPreviewStatus = "not_ready" | "ready" | "error"
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
  objErrorMessage: string | null
  liveVideo: LiveVideoState
  liveMediaPipe: {
    status: MediaPipeStatus
    error: string | null
    liveTimestampMs: number
  }
  currentAnalysis: CurrentFrameAnalysis
  logs: string[]
}

type FaceLandmarkerResultLike = ReturnType<FaceLandmarker["detectForVideo"]>

const LAB_NAME = "Ideal OBJ Render Warp Lab"
const REQUIRED_LANDMARK_COUNT = 478
const LANDMARK_PREVIEW_COUNT = 5
const MEDIAPIPE_TIMESTAMP_STEP_MS = 1000 / 30
const LIVE_AUTO_ANALYSIS_INTERVAL_SEC = 0.35
const RAD_TO_DEG = 180 / Math.PI
const STRONG_EXPRESSION_THRESHOLD = 0.35
const MIXED_EXPRESSION_THRESHOLD = 0.28
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
  { label: "ワープメッシュ", value: "warpMesh" },
  { label: "Raw Debug", value: "raw" },
]

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
  objErrorMessage: null,
  liveVideo: createEmptyLiveVideoState(),
  liveMediaPipe: {
    status: "uninitialized",
    error: null,
    liveTimestampMs: 0,
  },
  currentAnalysis: createEmptyCurrentAnalysis(),
  logs: ["ラボを初期化しました。OBJ render / renderedIdeal478 / WebGL warp は未実装です。"],
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
        <button class="secondary-button" type="button" data-action="export-log">ログ出力</button>
      </div>
      <input class="visually-hidden" type="file" accept=".obj,text/plain,model/obj" data-input="obj-file" />
      <input class="visually-hidden" type="file" accept="video/*" data-input="live-video" />
      <div class="status-note">
        OBJ読込と Canvas 2D preview に加えて、ライブ動画の current frame を MediaPipe で解析します。今回は current478 overlay までを確認し、renderedIdeal478 や mesh warp はまだ接続しません。
      </div>
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
const liveObjPosePreviewCanvas = getElement<HTMLCanvasElement>('[data-canvas="live-obj-pose-preview"]')
let liveFaceLandmarker: FaceLandmarker | null = null
let liveFaceLandmarkerPromise: Promise<FaceLandmarker> | null = null
let liveAnalysisInProgress = false
let liveAnalysisRequestId = 0
let lastAutoLiveAnalysisAtSec = Number.NEGATIVE_INFINITY
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
      <div class="preview-stage">
        <div class="preview-placeholder">
          <h3>レンダー理想プレビュー</h3>
          <p>OBJ を現在姿勢でレンダリングした画像をここに表示します。OBJ render / renderedIdeal478 取得はまだ未実装です。</p>
        </div>
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
            <label class="select-field">
              <span>表示モード</span>
              <select data-control="live-obj-preview-mode">
                <option value="points">点群</option>
                <option value="wireframe">ワイヤー</option>
                <option value="points_wireframe">点群 + ワイヤー</option>
              </select>
            </label>
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

  getElement<HTMLButtonElement>('[data-action="export-log"]').addEventListener("click", () => {
    exportLog()
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

  getElement<HTMLSelectElement>('[data-control="live-obj-preview-mode"]').addEventListener("change", (event) => {
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

async function analyzeCurrentLiveFrame(
  reason: "manual" | "timeupdate" | "seeked" | "pause" | "ended",
) {
  if (!state.liveVideo.loaded || liveAnalysisInProgress) {
    return
  }

  if (liveVideoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    state.currentAnalysis = {
      ...createEmptyCurrentAnalysis(),
      status: "error",
      analyzedTimeSec: state.liveVideo.currentTimeSec,
      errorMessage: "動画フレームがまだ読み込まれていません。",
    }
    updateObjPoseSyncFromCurrentAnalysis()
    renderAll()
    return
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
  renderAll()

  try {
    const detector = await getLiveFaceLandmarker()
    if (requestId !== liveAnalysisRequestId) {
      return
    }

    const timeSec = liveVideoElement.currentTime || state.liveVideo.currentTimeSec || 0
    const result = detector.detectForVideo(liveVideoElement, nextLiveTimestampMs())
    state.currentAnalysis = buildCurrentFrameAnalysis(result, timeSec)
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
    renderAll()
  }
}

function maybeAnalyzeLiveFrame() {
  if (
    !state.liveVideo.loaded ||
    state.liveVideo.playbackStatus !== "playing" ||
    liveAnalysisInProgress
  ) {
    return
  }

  const currentTimeSec = liveVideoElement.currentTime || state.liveVideo.currentTimeSec || 0
  if (currentTimeSec - lastAutoLiveAnalysisAtSec < LIVE_AUTO_ANALYSIS_INTERVAL_SEC) {
    return
  }

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

function renderAll() {
  updateObjPoseSyncFromCurrentAnalysis()
  renderPreviewTabs()
  renderPreviewPanels()
  renderControls()
  renderDebugTabs()
  renderDebugContent()
  drawLiveOverlay()
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

  renderLiveAnalysisCard()
  getElement<HTMLSelectElement>('[data-control="obj-preview-mode"]').value = state.objPreview.mode
  getElement<HTMLSelectElement>('[data-control="live-obj-preview-mode"]').value = state.objPreview.mode
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
    ["renderedIdealStatus", "not_implemented"],
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
  return [
    ["renderStatus", "not_implemented"],
    ["mediaPipeStatus", "not_implemented"],
    ["renderedIdeal478Count", "null"],
    ["renderedIdealPose", "null"],
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
    renderedIdeal: {
      renderStatus: "not_implemented",
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

function exportLog() {
  const blob = new Blob([state.logs.join("\n")], { type: "text/plain;charset=utf-8" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = "ideal-obj-render-warp-lab-log.txt"
  link.click()
  URL.revokeObjectURL(link.href)
  addLog("ログを出力しました。")
  renderAll()
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

function formatNumber(value: number) {
  return Number(value.toFixed(6)).toString()
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}
