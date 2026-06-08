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

type LabState = {
  activePreviewTab: PreviewTab
  activeDebugTab: DebugTab
  overlay: {
    showLandmarks478: boolean
  }
  modelVideo: {
    loaded: boolean
    scanStatus: ScanStatus
  }
  liveVideo: {
    loaded: boolean
  }
  logs: string[]
}

type TabOption<TValue extends string> = {
  label: string
  value: TValue
}

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
    scanStatus: "idle",
  },
  liveVideo: {
    loaded: false,
  },
  logs: ["ラボを初期化しました。"],
}

const app = document.querySelector<HTMLDivElement>("#app")

if (!app) {
  throw new Error("#app が見つかりません。")
}

function addLog(message: string) {
  const timestamp = new Date().toLocaleTimeString("ja-JP", {
    hour12: false,
  })
  state.logs = [`${timestamp} ${message}`, ...state.logs].slice(0, 20)
}

function setPreviewTab(tab: PreviewTab) {
  state.activePreviewTab = tab
  addLog(`${getPreviewTabLabel(tab)} タブに切り替えました。`)
  render()
}

function setDebugTab(tab: DebugTab) {
  state.activeDebugTab = tab
  render()
}

function handleLoadModelVideo() {
  addLog("モデル動画読込は placeholder です。実処理はまだ行いません。")
  render()
}

function handleAnalyzeModelVideo() {
  addLog("解析は placeholder です。MediaPipe 解析はまだ行いません。")
  render()
}

function handleLoadLiveVideo() {
  addLog("ライブ動画読込は placeholder です。実処理はまだ行いません。")
  render()
}

function handleExportLog() {
  addLog("ログ出力 placeholder: 現在の仮 state を console に出力しました。")
  console.info("Ideal Reference Mesh Warp Lab state", getRawState())
  render()
}

function handleToggleLandmarks478(checked: boolean) {
  state.overlay.showLandmarks478 = checked
  addLog(`478点 overlay 表示を ${checked ? "ON" : "OFF"} にしました。`)
  render()
}

function getPreviewTabLabel(tab: PreviewTab) {
  return previewTabs.find((option) => option.value === tab)?.label ?? tab
}

function getRawState() {
  return {
    activePreviewTab: state.activePreviewTab,
    activeDebugTab: state.activeDebugTab,
    overlay: state.overlay,
    modelVideo: state.modelVideo,
    liveVideo: state.liveVideo,
    logs: state.logs,
  }
}

function render() {
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
        <div class="status-note">
          この PR では MediaPipe 解析、動画解析、reference library 作成、matching、mesh warp は行いません。
        </div>
      </section>

      <section class="panel center-panel" aria-label="プレビュー系">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Preview</p>
            <h2>プレビュー</h2>
          </div>
          <label class="overlay-toggle">
            <input
              type="checkbox"
              data-action="toggle-landmarks"
              ${state.overlay.showLandmarks478 ? "checked" : ""}
            />
            <span>478点を表示</span>
          </label>
        </div>
        ${renderTabs("preview", previewTabs, state.activePreviewTab)}
        ${renderPreviewContent()}
      </section>

      <section class="panel right-panel" aria-label="ログ・デバッグ系">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Debug</p>
            <h2>ログ・デバッグ</h2>
          </div>
        </div>
        ${renderTabs("debug", debugTabs, state.activeDebugTab)}
        <div class="debug-content">
          ${renderDebugContent()}
        </div>
      </section>
    </main>
  `

  bindEvents()
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

function renderPreviewContent() {
  if (state.activePreviewTab === "live") {
    return `
      <div class="preview-card">
        <div class="preview-placeholder">
          <h3>ライブ動画プレビュー</h3>
          <p>ここに current face 代わりのライブ動画 preview / processed preview を表示します。</p>
        </div>
        <div class="timeline-controls" aria-label="ライブ動画操作 placeholder">
          <button class="small-button" type="button" disabled>再生</button>
          <button class="small-button" type="button" disabled>一時停止</button>
          <div class="seek-placeholder">シークバー placeholder</div>
          <p class="frame-status">current time: -</p>
        </div>
      </div>
    `
  }

  return `
    <div class="preview-card">
      <div class="preview-placeholder">
        <h3>モデル動画プレビュー</h3>
        <p>ここに理想モデル動画の accepted frame preview を表示します。</p>
      </div>
      <div class="timeline-controls" aria-label="モデル動画操作 placeholder">
        <button class="small-button" type="button" disabled>戻る</button>
        <button class="small-button" type="button" disabled>進む</button>
        <div class="seek-placeholder">シークバー placeholder</div>
        <p class="frame-status">現在フレーム: - / -</p>
      </div>
    </div>
  `
}

function renderDebugContent() {
  switch (state.activeDebugTab) {
    case "modelScan":
      return `<p class="placeholder-text">モデル動画解析結果はまだありません。</p>`
    case "referenceLibrary":
      return `<p class="placeholder-text">ideal reference library はまだ作成されていません。</p>`
    case "matching":
      return `<p class="placeholder-text">live current frame と ideal reference frame の matching はまだ実行されていません。</p>`
    case "warpMesh":
      return `<p class="placeholder-text">mesh warp はまだ実行されていません。</p>`
    case "raw":
      return `<pre class="raw-state">${JSON.stringify(getRawState(), null, 2)}</pre>`
    case "summary":
    default:
      return `
        <dl class="summary-list">
          <div><dt>Model video</dt><dd>${state.modelVideo.loaded ? "loaded" : "not loaded"}</dd></div>
          <div><dt>Model scan</dt><dd>${state.modelVideo.scanStatus}</dd></div>
          <div><dt>Reference frames</dt><dd>0</dd></div>
          <div><dt>Live video</dt><dd>${state.liveVideo.loaded ? "loaded" : "not loaded"}</dd></div>
          <div><dt>Overlay 478 landmarks</dt><dd>${state.overlay.showLandmarks478 ? "on" : "off"}</dd></div>
        </dl>
        <section class="log-section" aria-label="ログ">
          <h3>ログ</h3>
          <ul>
            ${state.logs.map((log) => `<li>${log}</li>`).join("")}
          </ul>
        </section>
      `
  }
}

function bindEvents() {
  app
    .querySelector<HTMLButtonElement>('[data-action="load-model"]')
    ?.addEventListener("click", handleLoadModelVideo)
  app
    .querySelector<HTMLButtonElement>('[data-action="analyze"]')
    ?.addEventListener("click", handleAnalyzeModelVideo)
  app
    .querySelector<HTMLButtonElement>('[data-action="load-live"]')
    ?.addEventListener("click", handleLoadLiveVideo)
  app
    .querySelector<HTMLButtonElement>('[data-action="export-log"]')
    ?.addEventListener("click", handleExportLog)
  app
    .querySelector<HTMLInputElement>('[data-action="toggle-landmarks"]')
    ?.addEventListener("change", (event) => {
      handleToggleLandmarks478(event.currentTarget.checked)
    })

  app.querySelectorAll<HTMLButtonElement>("[data-tab-group]").forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.dataset.tabGroup
      const value = button.dataset.tabValue

      if (group === "preview" && isPreviewTab(value)) {
        setPreviewTab(value)
      }

      if (group === "debug" && isDebugTab(value)) {
        setDebugTab(value)
      }
    })
  })
}

function isPreviewTab(value: string | undefined): value is PreviewTab {
  return value === "model" || value === "live"
}

function isDebugTab(value: string | undefined): value is DebugTab {
  return debugTabs.some((tab) => tab.value === value)
}

render()
