import "./style.css"

type PreviewTab = "obj" | "renderedIdeal" | "live"
type DebugTab = "summary" | "current" | "obj" | "renderedIdeal" | "warpMesh" | "raw"
type PlaybackStatus = "stopped" | "playing" | "paused"
type ObjParseStatus = "not_loaded" | "not_parsed" | "parsed" | "error"
type ObjPreviewMode = "points" | "wireframe" | "points_wireframe"
type ObjPreviewStatus = "not_ready" | "ready" | "error"

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

type ObjPreviewStats = {
  sampledPointCount: number
  sampledEdgeCount: number
}

type VideoPreviewState = {
  loaded: boolean
  fileName: string | null
  objectUrl: string | null
  durationSec: number | null
  width: number | null
  height: number | null
  currentTimeSec: number
  playbackStatus: PlaybackStatus
}

type CurrentAnalysisState = {
  status: "not_ready"
  current478Count: null
  yaw: null
  pitch: null
  roll: null
  expressionSummary: "not ready"
  quality: "not ready"
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
  objErrorMessage: string | null
  liveVideo: VideoPreviewState
  currentAnalysis: CurrentAnalysisState
  logs: string[]
}

const LAB_NAME = "Ideal OBJ Render Warp Lab"

const previewTabs: TabOption<PreviewTab>[] = [
  { label: "OBJ", value: "obj" },
  { label: "レンダー理想", value: "renderedIdeal" },
  { label: "ライブ", value: "live" },
]

const debugTabs: TabOption<DebugTab>[] = [
  { label: "Summary", value: "summary" },
  { label: "Current", value: "current" },
  { label: "OBJ", value: "obj" },
  { label: "Rendered Ideal", value: "renderedIdeal" },
  { label: "Warp Mesh", value: "warpMesh" },
  { label: "Raw", value: "raw" },
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
  objErrorMessage: null,
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
  currentAnalysis: {
    status: "not_ready",
    current478Count: null,
    yaw: null,
    pitch: null,
    roll: null,
    expressionSummary: "not ready",
    quality: "not ready",
  },
  logs: ["ラボを初期化しました。OBJ render / MediaPipe解析 / WebGL warp は未実装です。"],
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
        OBJを現在姿勢でrenderし、MediaPipe returned 478を理想側候補として使う検証ラボです。座標系・mesh・warpはIdeal Reference Mesh Warp Labを踏襲します。
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
const objPreviewCanvas = getElement<HTMLCanvasElement>('[data-canvas="obj-preview"]')
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
          <p data-obj-preview-message>OBJファイルを読み込むと、ここにOBJ 3D previewを表示します。</p>
        </div>
      </div>
      <div class="obj-preview-controls" aria-label="OBJ 3D preview 操作">
        <label class="select-field">
          <span>表示モード</span>
          <select data-control="obj-preview-mode">
            <option value="points">points</option>
            <option value="wireframe">wireframe</option>
            <option value="points_wireframe">points + wireframe</option>
          </select>
        </label>
        <div class="button-row">
          <button class="small-button" type="button" data-action="obj-preview-front">Front</button>
          <button class="small-button" type="button" data-action="obj-preview-left">Left</button>
          <button class="small-button" type="button" data-action="obj-preview-right">Right</button>
          <button class="small-button" type="button" data-action="obj-preview-top">Top</button>
          <button class="small-button" type="button" data-action="obj-preview-side">Side</button>
          <button class="small-button" type="button" data-action="obj-preview-reset">Reset View</button>
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
          <p>OBJを現在姿勢でレンダリングした画像をここに表示します。OBJレンダー・MediaPipe解析は未実装です。</p>
        </div>
      </div>
    </div>
  `
}

function renderLivePreview() {
  return `
    <div class="preview-card" data-preview-panel="live">
      <div class="preview-stage" data-live-stage data-loaded="false">
        <video class="video-preview" data-video="live" preload="metadata" playsinline controls></video>
        <canvas class="landmark-overlay" data-overlay="live"></canvas>
        <div class="preview-placeholder">
          <h3>ライブプレビュー</h3>
          <p>ライブ動画を読み込むと、ここに現在顔プレビューを表示します。</p>
        </div>
      </div>
      <div class="timeline-controls live-controls" aria-label="ライブ動画操作">
        <button class="small-button" type="button" data-action="live-play">再生</button>
        <button class="small-button" type="button" data-action="live-pause">一時停止</button>
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
    renderAll()
  })

  liveVideoElement.addEventListener("play", () => {
    state.liveVideo.playbackStatus = "playing"
    renderAll()
  })

  liveVideoElement.addEventListener("pause", () => {
    state.liveVideo.playbackStatus = state.liveVideo.loaded ? "paused" : "stopped"
    renderAll()
  })

  getElement<HTMLButtonElement>('[data-action="live-play"]').addEventListener("click", () => {
    if (!state.liveVideo.loaded) {
      addLog("ライブ動画が未読込のため再生できません。")
      renderAll()
      return
    }
    void liveVideoElement.play().catch(() => {
      addLog("ライブ動画の再生に失敗しました。")
      renderAll()
    })
  })

  getElement<HTMLButtonElement>('[data-action="live-pause"]').addEventListener("click", () => {
    liveVideoElement.pause()
  })

  getElement<HTMLInputElement>("[data-range='live']").addEventListener("input", (event) => {
    const value = Number(event.currentTarget.value)
    if (Number.isFinite(value)) {
      liveVideoElement.currentTime = value
      state.liveVideo.currentTimeSec = value
      renderAll()
    }
  })

  getElement<HTMLSelectElement>('[data-control="obj-preview-mode"]').addEventListener("change", (event) => {
    const value = event.currentTarget.value
    if (isObjPreviewMode(value)) {
      state.objPreview.mode = value
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

  const objectUrl = URL.createObjectURL(file)
  state.liveVideo = {
    loaded: true,
    fileName: file.name,
    objectUrl,
    durationSec: null,
    width: null,
    height: null,
    currentTimeSec: 0,
    playbackStatus: "stopped",
  }
  state.currentAnalysis = createEmptyCurrentAnalysis()
  liveVideoElement.src = objectUrl
  state.activePreviewTab = "live"
  addLog(`ライブ動画を読み込みました: ${file.name}`)
  renderAll()
}

function syncLiveVideoMetadata() {
  state.liveVideo.durationSec = Number.isFinite(liveVideoElement.duration)
    ? liveVideoElement.duration
    : null
  state.liveVideo.width = liveVideoElement.videoWidth || null
  state.liveVideo.height = liveVideoElement.videoHeight || null
  syncLiveCurrentTime()
}

function syncLiveCurrentTime() {
  state.liveVideo.currentTimeSec = liveVideoElement.currentTime || 0
}

function renderAll() {
  renderPreviewTabs()
  renderPreviewPanels()
  renderControls()
  renderDebugTabs()
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

  const liveStage = getElement<HTMLElement>("[data-live-stage]")
  liveStage.dataset.loaded = String(state.liveVideo.loaded)

  const objPreviewStatus = getObjPreviewStatus()
  const objStage = getElement<HTMLElement>("[data-obj-stage]")
  objStage.dataset.previewStatus = objPreviewStatus
  getElement<HTMLElement>("[data-obj-preview-message]").textContent = getObjPreviewMessage(objPreviewStatus)
  renderObjPreviewCanvas()

  const objSummary = getElement<HTMLElement>("[data-obj-preview-summary]")
  objSummary.innerHTML = renderObjPreviewSummary()
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
  range.value = String(clamp(state.liveVideo.currentTimeSec, 0, duration))
  range.disabled = !state.liveVideo.loaded

  getElement<HTMLElement>("[data-status='live-time']").textContent = formatTimeStatus(
    state.liveVideo,
  )

  getElement<HTMLElement>("[data-live-analysis]").innerHTML = `
    <p>ライブ動画の current frame 解析結果はまだありません。MediaPipe解析はこのPRでは接続していません。</p>
  `

  getElement<HTMLSelectElement>('[data-control="obj-preview-mode"]').value = state.objPreview.mode
}

function renderObjPreviewCanvas() {
  const status = getObjPreviewStatus()
  state.objPreviewStats = status === "ready" ? calculateObjPreviewStats() : {
    sampledPointCount: 0,
    sampledEdgeCount: 0,
  }

  const context = objPreviewCanvas.getContext("2d")
  if (!context) {
    return
  }

  const rect = objPreviewCanvas.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) {
    return
  }

  const dpr = window.devicePixelRatio || 1
  const targetWidth = Math.round(rect.width * dpr)
  const targetHeight = Math.round(rect.height * dpr)
  if (objPreviewCanvas.width !== targetWidth || objPreviewCanvas.height !== targetHeight) {
    objPreviewCanvas.width = targetWidth
    objPreviewCanvas.height = targetHeight
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
    scale: getObjCanvasScale(),
  }

  context.save()
  context.lineCap = "round"
  context.lineJoin = "round"

  if (state.objPreview.mode === "wireframe" || state.objPreview.mode === "points_wireframe") {
    drawObjWireframe(context, summary.center, summary.maxDimension, viewport)
  }

  if (state.objPreview.mode === "points" || state.objPreview.mode === "points_wireframe") {
    drawObjPoints(context, summary.center, summary.maxDimension, viewport)
  }

  drawObjAxisGuide(context, rect.height)
  context.restore()
}

function drawObjWireframe(
  context: CanvasRenderingContext2D,
  center: ObjVertex,
  maxDimension: number,
  viewport: { centerX: number; centerY: number; scale: number },
) {
  const edgeStep = getSampleStep(state.objGeometry.edges.length, state.objPreview.maxEdges)
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

    const p1 = projectObjVertex(from, center, maxDimension, viewport)
    const p2 = projectObjVertex(to, center, maxDimension, viewport)
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
) {
  const pointStep = getSampleStep(state.objGeometry.vertices.length, state.objPreview.maxPoints)
  context.fillStyle = "rgba(18, 31, 44, 0.64)"

  for (let index = 0; index < state.objGeometry.vertices.length; index += pointStep) {
    const point = projectObjVertex(
      state.objGeometry.vertices[index],
      center,
      maxDimension,
      viewport,
    )
    context.beginPath()
    context.arc(point.x, point.y, 1.35, 0, Math.PI * 2)
    context.fill()
  }
}

function drawObjAxisGuide(
  context: CanvasRenderingContext2D,
  canvasHeight: number,
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
    const rotated = rotateObjPoint(axis.vertex)
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
) {
  const normalized = {
    x: (vertex.x - center.x) / maxDimension,
    y: (vertex.y - center.y) / maxDimension,
    z: (vertex.z - center.z) / maxDimension,
  }
  const rotated = rotateObjPoint(normalized)

  return {
    x: viewport.centerX + (rotated.x * state.objPreview.zoom + state.objPreview.panX) * viewport.scale,
    y: viewport.centerY - (rotated.y * state.objPreview.zoom + state.objPreview.panY) * viewport.scale,
    z: rotated.z,
  }
}

function rotateObjPoint(point: ObjVertex): ObjVertex {
  const yaw = degreesToRadians(state.objPreview.yawDeg)
  const pitch = degreesToRadians(state.objPreview.pitchDeg)
  const roll = degreesToRadians(state.objPreview.rollDeg)
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
    message.textContent = "not ready"
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
    ["liveVideoStatus", state.liveVideo.loaded ? "loaded" : "not_loaded"],
    ["objFileStatus", objFileStatus],
    ["objVertexCount", formatNullableCount(state.objFile.loaded ? state.objSummary.vertexCount : null)],
    ["objFaceCount", formatNullableCount(state.objFile.loaded ? state.objSummary.faceCount : null)],
    ["objWarningCount", formatNullableCount(state.objFile.loaded ? state.objSummary.warningCount : null)],
    ["objPreviewStatus", getObjPreviewStatus()],
    ["objPreviewMode", state.objPreview.mode],
    ["objSampledPointCount", formatNullableCount(state.objPreviewStats.sampledPointCount)],
    ["objSampledEdgeCount", formatNullableCount(state.objPreviewStats.sampledEdgeCount)],
    ["objErrorMessage", state.objErrorMessage ?? "null"],
    ["currentAnalysisStatus", state.currentAnalysis.status],
    ["renderedIdealStatus", "not_implemented"],
    ["warpStatus", "not_implemented"],
  ]
}

function getCurrentItems(): Array<[string, string]> {
  return [
    ["current478Count", formatNullableCount(state.currentAnalysis.current478Count)],
    ["yaw", formatNullableCount(state.currentAnalysis.yaw)],
    ["pitch", formatNullableCount(state.currentAnalysis.pitch)],
    ["roll", formatNullableCount(state.currentAnalysis.roll)],
    ["expressionSummary", state.currentAnalysis.expressionSummary],
    ["quality", state.currentAnalysis.quality],
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
    verticesPreview: state.objGeometry.vertices.slice(0, 5).map(roundPointForState),
    facesPreview: state.objGeometry.faces.slice(0, 5),
    sampledPointCount: state.objPreviewStats.sampledPointCount,
    sampledEdgeCount: state.objPreviewStats.sampledEdgeCount,
    objErrorMessage: state.objErrorMessage,
    liveVideo: {
      loaded: state.liveVideo.loaded,
      fileName: state.liveVideo.fileName,
      durationSec: roundForState(state.liveVideo.durationSec),
      width: state.liveVideo.width,
      height: state.liveVideo.height,
      currentTimeSec: roundForState(state.liveVideo.currentTimeSec),
      playbackStatus: state.liveVideo.playbackStatus,
    },
    currentAnalysis: state.currentAnalysis,
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
        warnings.push(`line ${lineNumber}: face の頂点数が3未満のため skip しました。`)
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
    return "OBJ解析は完了。簡易3D previewを表示しています。"
  }
  if (status === "error") {
    return "OBJ解析に失敗したため、3D previewを表示できません。"
  }
  return "OBJファイルを読み込むと、ここにOBJ 3D previewを表示します。"
}

function renderObjPreviewSummary() {
  const summary = state.objSummary
  if (!state.objFile.loaded) {
    return ""
  }

  if (summary.parseStatus === "error") {
    return `
      <p class="obj-preview-message">OBJ解析に失敗したため、3D previewを表示できません。</p>
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
    <p class="obj-preview-message">OBJ解析は完了。簡易3D previewを表示しています。</p>
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

function createEmptyCurrentAnalysis(): CurrentAnalysisState {
  return {
    status: "not_ready",
    current478Count: null,
    yaw: null,
    pitch: null,
    roll: null,
    expressionSummary: "not ready",
    quality: "not ready",
  }
}

function setChecked(action: string, checked: boolean) {
  getElement<HTMLInputElement>(`[data-action="${action}"]`).checked = checked
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

function formatTimeStatus(videoState: VideoPreviewState) {
  if (!videoState.loaded) {
    return "current time: - / -"
  }
  return `current time: ${formatSeconds(videoState.currentTimeSec)} / ${formatSeconds(videoState.durationSec)}`
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
  return value === null ? "null" : formatNumber(value)
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

function formatNumber(value: number) {
  return Number(value.toFixed(6)).toString()
}

function formatSeconds(value: number | null) {
  return value === null ? "-" : `${value.toFixed(3)} sec`
}

function roundForState(value: number | null) {
  return value === null ? null : Number(value.toFixed(6))
}

function roundPointForState(point: ObjVertex): ObjVertex {
  return {
    x: roundForState(point.x) ?? 0,
    y: roundForState(point.y) ?? 0,
    z: roundForState(point.z) ?? 0,
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

function calculateObjPreviewStats(): ObjPreviewStats {
  return {
    sampledPointCount:
      state.objPreview.mode === "wireframe"
        ? 0
        : getSampledCount(state.objGeometry.vertices.length, state.objPreview.maxPoints),
    sampledEdgeCount:
      state.objPreview.mode === "points"
        ? 0
        : getSampledCount(state.objGeometry.edges.length, state.objPreview.maxEdges),
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

function getObjCanvasScale() {
  const rect = objPreviewCanvas.getBoundingClientRect()
  return Math.max(1, Math.min(rect.width, rect.height) * 0.42)
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
