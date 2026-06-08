import "./style.css"

type PreviewTab = "model" | "live"
type DebugTab =
  | "summary"
  | "modelScan"
  | "referenceLibrary"
  | "matching"
  | "warpMesh"
  | "raw"

type ScanStatus = "idle" | "running" | "done" | "error"
type PlaybackStatus = "stopped" | "playing" | "paused"

type VideoPreviewState = {
  loaded: boolean
  fileName: string | null
  objectUrl: string | null
  durationSec: number | null
  width: number | null
  height: number | null
  currentTimeSec: number
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
  logs: string[]
}

type TabOption<TValue extends string> = {
  label: string
  value: TValue
}

const FRAME_STEP_SEC = 1 / 30

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
  logs: ["ラボを初期化しました。"],
}

const app = document.querySelector<HTMLDivElement>("#app")

if (!app) {
  throw new Error("#app が見つかりません。")
}

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
        PR2 ではローカル動画の読み込みと preview までを扱います。MediaPipe 解析、reference library 作成、matching、mesh warp はまだ行いません。
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
        <div class="preview-placeholder" data-placeholder="model">
          <h3>モデル動画プレビュー</h3>
          <p>モデル動画読込からローカル動画を選択すると、ここに frame review 用 preview を表示します。</p>
        </div>
      </div>
      <div class="timeline-controls" aria-label="モデル動画操作">
        <button class="small-button" type="button" data-action="model-prev">戻る</button>
        <button class="small-button" type="button" data-action="model-next">進む</button>
        <label class="range-field">
          <span>シーク</span>
          <input type="range" min="0" step="0.001" value="0" data-range="model" />
        </label>
        <p class="frame-status" data-status="model-time">current time: - / -</p>
      </div>
      <p class="control-help">戻る / 進むは PR2 の仮操作として 1/30 秒ずつ移動します。</p>
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
    handleAnalyzeModelVideo,
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
    () => seekModelBy(-FRAME_STEP_SEC),
  )
  getElement<HTMLButtonElement>('[data-action="model-next"]').addEventListener(
    "click",
    () => seekModelBy(FRAME_STEP_SEC),
  )
  getElement<HTMLInputElement>('[data-range="model"]').addEventListener(
    "input",
    (event) => {
      seekVideoTo("model", Number(event.currentTarget.value))
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

  window.addEventListener("beforeunload", revokeObjectUrls)
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

function handleAnalyzeModelVideo() {
  addLog("解析は PR2 では未実装です。MediaPipe 解析はまだ行いません。")
  renderAll()
}

function handleExportLog() {
  addLog("現在の state snapshot を console に出力しました。")
  console.info("Ideal Reference Mesh Warp Lab state", getRawState())
  renderAll()
}

function handleToggleLandmarks478(checked: boolean) {
  state.overlay.showLandmarks478 = checked
  addLog(`478点 overlay 表示を ${checked ? "ON" : "OFF"} にしました。`)
  renderAll()
}

function seekModelBy(deltaSec: number) {
  seekVideoTo("model", modelVideoElement.currentTime + deltaSec)
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

  if (kind === "model") {
    state.modelVideo.currentReviewFrameIndex = getFrameIndex(videoState.currentTimeSec)
  }
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

  setDisabled('[data-action="model-prev"]', !modelLoaded)
  setDisabled('[data-action="model-next"]', !modelLoaded)
  setDisabled('[data-range="model"]', !modelLoaded)
  setDisabled('[data-action="live-play"]', !liveLoaded || state.liveVideo.playbackStatus === "playing")
  setDisabled('[data-action="live-pause"]', !liveLoaded || state.liveVideo.playbackStatus !== "playing")
  setDisabled('[data-range="live"]', !liveLoaded)

  updateRange("model")
  updateRange("live")
  setText("[data-status='model-time']", formatTimeStatus(state.modelVideo))
  setText("[data-status='live-time']", formatTimeStatus(state.liveVideo))
  getElement<HTMLInputElement>('[data-action="toggle-landmarks"]').checked =
    state.overlay.showLandmarks478
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

  const items: Array<[string, string]> = [
    ["Model video", state.modelVideo.loaded ? "loaded" : "not loaded"],
    ["Model file", state.modelVideo.fileName ?? "-"],
    ["Model duration", formatDuration(state.modelVideo.durationSec)],
    ["Model size", formatSize(state.modelVideo.width, state.modelVideo.height)],
    ["Model current time", `${formatSeconds(state.modelVideo.currentTimeSec)} sec`],
    ["Model frame step", "1/30 sec"],
    ["Model review frame", formatNullableNumber(state.modelVideo.currentReviewFrameIndex)],
    ["Model scan", state.modelVideo.scanStatus],
    ["Reference frames", "0"],
    ["Live video", state.liveVideo.loaded ? "loaded" : "not loaded"],
    ["Live file", state.liveVideo.fileName ?? "-"],
    ["Live duration", formatDuration(state.liveVideo.durationSec)],
    ["Live size", formatSize(state.liveVideo.width, state.liveVideo.height)],
    ["Live current time", `${formatSeconds(state.liveVideo.currentTimeSec)} sec`],
    ["Live playback", state.liveVideo.playbackStatus],
    ["Overlay 478 landmarks", state.overlay.showLandmarks478 ? "on" : "off"],
  ]

  items.forEach(([label, value]) => {
    const row = document.createElement("div")
    const dt = document.createElement("dt")
    const dd = document.createElement("dd")
    dt.textContent = label
    dd.textContent = value
    row.append(dt, dd)
    summaryList.appendChild(row)
  })

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

function getRawState() {
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
    case "modelScan":
      return "モデル動画解析結果はまだありません。"
    case "referenceLibrary":
      return "ideal reference library はまだ作成されていません。"
    case "matching":
      return "live current frame と ideal reference frame の matching はまだ実行されていません。"
    case "warpMesh":
      return "mesh warp はまだ実行されていません。"
    case "raw":
    case "summary":
      return ""
  }
}

function updateRange(kind: PreviewTab) {
  const videoState = kind === "model" ? state.modelVideo : state.liveVideo
  const range = getElement<HTMLInputElement>(`[data-range="${kind}"]`)
  const duration = videoState.durationSec ?? 0

  range.max = String(duration)
  range.value = String(clamp(videoState.currentTimeSec, 0, duration))
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

function formatNullableNumber(value: number | null) {
  return value === null ? "-" : String(value)
}

function roundForState(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return value
  }

  return Math.round(value * 1000) / 1000
}

function getFrameIndex(currentTimeSec: number) {
  return Math.max(0, Math.round(currentTimeSec / FRAME_STEP_SEC))
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
