import "./style.css"

type PreviewTab = "obj" | "renderedIdeal" | "live"
type DebugTab = "summary" | "current" | "obj" | "renderedIdeal" | "warpMesh" | "raw"
type PlaybackStatus = "stopped" | "playing" | "paused"

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
  logs: ["ラボを初期化しました。OBJ parse / OBJ render / MediaPipe解析 / WebGL warp は未実装です。"],
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
      <div class="preview-stage">
        <div class="preview-placeholder">
          <h3>OBJプレビュー</h3>
          <p>OBJファイルを読み込むと、ここにOBJプレビューを表示します。OBJ解析・3D表示は未実装です。</p>
          <p class="file-summary" data-obj-preview-summary></p>
        </div>
      </div>
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
      loadObjFile(file)
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

function loadObjFile(file: File) {
  state.objFile = {
    loaded: true,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || "unknown",
  }
  state.activePreviewTab = "obj"
  addLog(`OBJファイル情報を読み込みました: ${file.name}`)
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

  const objSummary = getElement<HTMLElement>("[data-obj-preview-summary]")
  objSummary.textContent = state.objFile.loaded
    ? `${state.objFile.fileName} / ${formatBytes(state.objFile.fileSize)} / ${state.objFile.fileType}`
    : ""
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
  return [
    ["labName", LAB_NAME],
    ["liveVideoStatus", state.liveVideo.loaded ? "loaded" : "not_loaded"],
    ["objFileStatus", state.objFile.loaded ? "loaded" : "not_loaded"],
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
  return [
    ["fileName", state.objFile.fileName ?? "null"],
    ["fileSize", formatNullableCount(state.objFile.fileSize)],
    ["fileType", state.objFile.fileType ?? "null"],
    ["parseStatus", "not_implemented"],
    ["vertexCount", "null"],
    ["faceCount", "null"],
    ["bounds", "null"],
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

function formatSeconds(value: number | null) {
  return value === null ? "-" : `${value.toFixed(3)} sec`
}

function roundForState(value: number | null) {
  return value === null ? null : Number(value.toFixed(6))
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
