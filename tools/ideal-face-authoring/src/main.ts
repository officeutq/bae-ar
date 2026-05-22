import {
  NATURAL_IDEAL_FACE_PRESET,
  type IdealFacePoint3D,
} from "@bae-ar/engine"

const idealFace = NATURAL_IDEAL_FACE_PRESET
const app = document.querySelector<HTMLDivElement>("#app")
const MAX_EXTRACTED_FRAME_COUNT = 20
const THUMBNAIL_WIDTH = 180

type FrameAnalysisStatus = "pending"

interface ExtractedVideoFrame {
  index: number
  timestamp: number
  status: FrameAnalysisStatus
  thumbnailUrl: string
  extractionTimeMs: number
}

interface VideoSourceState {
  fileName: string
  objectUrl: string
  duration: number | null
  videoWidth: number | null
  videoHeight: number | null
  extractedFrames: ExtractedVideoFrame[]
  isExtracting: boolean
  error: string | null
}

let videoSource: VideoSourceState | null = null
const extractionVideo = document.createElement("video")
const extractionCanvas = document.createElement("canvas")

if (!app) {
  throw new Error("IdealFace Authoring Tool app root was not found")
}

extractionVideo.muted = true
extractionVideo.playsInline = true
extractionVideo.preload = "metadata"

function formatNumber(value: number): string {
  return value.toFixed(3)
}

function formatSeconds(value: number | null): string {
  return value === null ? "未読み込み" : `${value.toFixed(1)}s`
}

function formatPixels(
  width: number | null,
  height: number | null,
): string {
  return width === null || height === null ? "未読み込み" : `${width} x ${height}`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function getPreviewBounds(points: IdealFacePoint3D[]): {
  minX: number
  maxX: number
  minY: number
  maxY: number
} {
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const padding = 0.16

  return {
    minX: Math.min(...xs) - padding,
    maxX: Math.max(...xs) + padding,
    minY: Math.min(...ys) - padding,
    maxY: Math.max(...ys) + padding,
  }
}

function mapPointToPreview(
  point: IdealFacePoint3D,
  bounds: ReturnType<typeof getPreviewBounds>,
): { x: number; y: number } {
  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY

  return {
    x: ((point.x - bounds.minX) / width) * 100,
    y: 100 - ((point.y - bounds.minY) / height) * 100,
  }
}

function renderPreview(points: IdealFacePoint3D[]): string {
  const bounds = getPreviewBounds(points)
  const axisOrigin = mapPointToPreview(
    { id: "origin", x: 0, y: 0, z: 0 },
    bounds,
  )
  const pointMarkup = points
    .map((point) => {
      const previewPoint = mapPointToPreview(point, bounds)
      const label = point.semantic ?? point.id

      return `
        <g class="preview-point">
          <circle cx="${previewPoint.x}" cy="${previewPoint.y}" r="1.7">
            <title>${escapeHtml(point.id)}</title>
          </circle>
          <text x="${previewPoint.x + 2.5}" y="${previewPoint.y - 2.5}">
            ${escapeHtml(label)}
          </text>
        </g>
      `
    })
    .join("")

  return `
    <svg class="preview" viewBox="0 0 100 100" role="img" aria-label="natural_v1 controlPoints preview">
      <line class="axis" x1="4" y1="${axisOrigin.y}" x2="96" y2="${axisOrigin.y}" />
      <line class="axis" x1="${axisOrigin.x}" y1="4" x2="${axisOrigin.x}" y2="96" />
      ${pointMarkup}
    </svg>
  `
}

function renderControlPointRows(points: IdealFacePoint3D[]): string {
  return points
    .map(
      (point) => `
        <tr>
          <td>${escapeHtml(point.id)}</td>
          <td>${escapeHtml(point.semantic ?? "")}</td>
          <td>${formatNumber(point.x)}</td>
          <td>${formatNumber(point.y)}</td>
          <td>${formatNumber(point.z)}</td>
        </tr>
      `,
    )
    .join("")
}

function renderVideoMetadata(): string {
  const fileName = videoSource?.fileName ?? "未選択"
  const duration = videoSource?.duration ?? null
  const videoWidth = videoSource?.videoWidth ?? null
  const videoHeight = videoSource?.videoHeight ?? null
  const frameCount = videoSource?.extractedFrames.length ?? 0

  return `
    <dl>
      <div>
        <dt>選択中の動画</dt>
        <dd>${escapeHtml(fileName)}</dd>
      </div>
      <div>
        <dt>動画の長さ</dt>
        <dd>${formatSeconds(duration)}</dd>
      </div>
      <div>
        <dt>動画サイズ</dt>
        <dd>${formatPixels(videoWidth, videoHeight)}</dd>
      </div>
      <div>
        <dt>抽出フレーム数</dt>
        <dd>${frameCount}</dd>
      </div>
    </dl>
  `
}

function renderVideoPreview(): string {
  if (!videoSource?.objectUrl) {
    return `
      <div class="video-empty">
        <p>MP4 動画を選択すると、メタデータと抽出フレームがここに表示されます。</p>
      </div>
    `
  }

  return `
    <video class="video-preview" src="${escapeHtml(videoSource.objectUrl)}" controls muted playsinline></video>
  `
}

function renderExtractionStatus(): string {
  if (!videoSource) {
    return "動画は未選択です。"
  }

  if (videoSource.error) {
    return videoSource.error
  }

  if (videoSource.isExtracting) {
    return "フレーム抽出中です。"
  }

  if (videoSource.extractedFrames.length === 0) {
    return "metadata 読み込み後にフレームを抽出します。"
  }

  return "フレーム抽出が完了しました。"
}

function renderFrameThumbnails(): string {
  const frames = videoSource?.extractedFrames ?? []

  if (frames.length === 0) {
    return `
      <div class="frame-empty">
        <p>抽出済みフレームはまだありません。</p>
      </div>
    `
  }

  return `
    <div class="frame-grid">
      ${frames
        .map(
          (frame) => `
            <article class="frame-card">
              <img src="${escapeHtml(frame.thumbnailUrl)}" alt="Frame ${String(frame.index).padStart(3, "0")} / ${frame.timestamp.toFixed(1)}s" />
              <div>
                <strong>Frame ${String(frame.index).padStart(3, "0")} / ${frame.timestamp.toFixed(1)}s</strong>
                <span>状態: ${frame.status === "pending" ? "未解析" : frame.status}</span>
                <span>抽出時間: ${frame.extractionTimeMs.toFixed(1)}ms</span>
              </div>
            </article>
          `,
        )
        .join("")}
    </div>
  `
}

function buildAuthoringDebugPreview(): unknown {
  return {
    idealFace,
    videoSource: videoSource
      ? {
          fileName: videoSource.fileName,
          duration: videoSource.duration,
          videoWidth: videoSource.videoWidth,
          videoHeight: videoSource.videoHeight,
          extractedFrameCount: videoSource.extractedFrames.length,
          frames: videoSource.extractedFrames.map((frame) => ({
            frameIndex: frame.index,
            timestamp: frame.timestamp,
            status: frame.status,
            extractionTimeMs: Number(frame.extractionTimeMs.toFixed(1)),
            thumbnail: "omitted",
          })),
        }
      : null,
  }
}

function attachVideoInputHandler(): void {
  document
    .querySelector<HTMLInputElement>("#video-file-input")
    ?.addEventListener("change", async (event) => {
      const input = event.currentTarget
      const file = input.files?.[0]

      if (!file) {
        return
      }

      await handleVideoFileSelection(file)
    })
}

async function handleVideoFileSelection(file: File): Promise<void> {
  if (file.type !== "video/mp4" && !file.name.toLowerCase().endsWith(".mp4")) {
    replaceVideoSource({
      fileName: file.name,
      objectUrl: "",
      duration: null,
      videoWidth: null,
      videoHeight: null,
      extractedFrames: [],
      isExtracting: false,
      error: "初期対応は MP4 動画のみです。",
    })
    render()
    return
  }

  const objectUrl = URL.createObjectURL(file)

  replaceVideoSource({
    fileName: file.name,
    objectUrl,
    duration: null,
    videoWidth: null,
    videoHeight: null,
    extractedFrames: [],
    isExtracting: true,
    error: null,
  })
  render()

  try {
    extractionVideo.src = objectUrl
    extractionVideo.load()
    await waitForVideoEvent("loadedmetadata")

    if (!Number.isFinite(extractionVideo.duration)) {
      throw new Error("動画の長さを取得できませんでした。")
    }

    updateVideoSource({
      duration: extractionVideo.duration,
      videoWidth: extractionVideo.videoWidth,
      videoHeight: extractionVideo.videoHeight,
    })
    render()

    const frames = await extractFramesFromVideo(extractionVideo)

    updateVideoSource({
      extractedFrames: frames,
      isExtracting: false,
    })
  } catch (error) {
    updateVideoSource({
      isExtracting: false,
      error:
        error instanceof Error
          ? error.message
          : "動画の読み込みまたはフレーム抽出に失敗しました。",
    })
  }

  render()
}

function replaceVideoSource(nextSource: VideoSourceState): void {
  if (videoSource?.objectUrl) {
    URL.revokeObjectURL(videoSource.objectUrl)
  }

  videoSource = nextSource
}

function updateVideoSource(nextState: Partial<VideoSourceState>): void {
  if (!videoSource) {
    return
  }

  videoSource = {
    ...videoSource,
    ...nextState,
  }
}

function waitForVideoEvent(
  eventName: "loadedmetadata" | "loadeddata" | "seeked",
): Promise<void> {
  return new Promise((resolve, reject) => {
    const handleEvent = (): void => {
      cleanup()
      resolve()
    }
    const handleError = (): void => {
      cleanup()
      reject(new Error("動画を読み込めませんでした。"))
    }
    const cleanup = (): void => {
      extractionVideo.removeEventListener(eventName, handleEvent)
      extractionVideo.removeEventListener("error", handleError)
    }

    extractionVideo.addEventListener(eventName, handleEvent, { once: true })
    extractionVideo.addEventListener("error", handleError, { once: true })
  })
}

function getExtractionTimestamps(duration: number): number[] {
  const safeDuration = Math.max(0, duration)
  const maxTimestamp = Math.max(0, safeDuration - 0.05)
  const interval =
    safeDuration <= MAX_EXTRACTED_FRAME_COUNT - 1
      ? 1
      : safeDuration / (MAX_EXTRACTED_FRAME_COUNT - 1)
  const frameCount = Math.min(
    MAX_EXTRACTED_FRAME_COUNT,
    Math.max(1, Math.floor(safeDuration / interval) + 1),
  )

  return Array.from({ length: frameCount }, (_, index) =>
    Math.min(maxTimestamp, Number((index * interval).toFixed(3))),
  )
}

async function extractFramesFromVideo(
  video: HTMLVideoElement,
): Promise<ExtractedVideoFrame[]> {
  const duration = video.duration
  const timestamps = getExtractionTimestamps(duration)
  const context = extractionCanvas.getContext("2d")

  if (!context || video.videoWidth === 0 || video.videoHeight === 0) {
    throw new Error("動画フレームを canvas に描画できませんでした。")
  }

  const thumbnailHeight = Math.round(
    (THUMBNAIL_WIDTH * video.videoHeight) / video.videoWidth,
  )
  extractionCanvas.width = THUMBNAIL_WIDTH
  extractionCanvas.height = thumbnailHeight

  const frames: ExtractedVideoFrame[] = []

  for (const [index, timestamp] of timestamps.entries()) {
    const startedAt = performance.now()

    if (Math.abs(video.currentTime - timestamp) > 0.001) {
      video.currentTime = timestamp
      await waitForVideoEvent("seeked")
    } else if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      await waitForVideoEvent("loadeddata")
    }

    context.drawImage(video, 0, 0, THUMBNAIL_WIDTH, thumbnailHeight)

    frames.push({
      index: index + 1,
      timestamp,
      status: "pending",
      thumbnailUrl: extractionCanvas.toDataURL("image/jpeg", 0.82),
      extractionTimeMs: performance.now() - startedAt,
    })

    updateVideoSource({
      extractedFrames: [...frames],
    })
    render()
  }

  return frames
}

function render(): void {
  app.innerHTML = `
    <main>
      <header class="app-header">
        <div>
          <p class="eyebrow">BAE AR</p>
          <h1>IdealFace Authoring Tool</h1>
        </div>
        <span>Step 2-A</span>
      </header>

      <section class="summary" aria-label="IdealFace metadata">
        <dl>
          <div>
            <dt>preset id</dt>
            <dd>${escapeHtml(idealFace.metadata.id)}</dd>
          </div>
          <div>
            <dt>name</dt>
            <dd>${escapeHtml(idealFace.metadata.name)}</dd>
          </div>
          <div>
            <dt>version</dt>
            <dd>${escapeHtml(idealFace.metadata.version)}</dd>
          </div>
          <div>
            <dt>coordinateSpace</dt>
            <dd>${escapeHtml(idealFace.model.coordinateSpace)}</dd>
          </div>
          <div>
            <dt>control point count</dt>
            <dd>${idealFace.model.controlPoints.length}</dd>
          </div>
        </dl>
      </section>

      <section class="video-panel" aria-label="動画素材">
        <div class="panel-heading">
          <div>
            <h2>動画素材</h2>
            <p>推奨: MP4 / H.264 / 5〜15秒 / 720p程度</p>
          </div>
          <label class="file-button" for="video-file-input">MP4 動画を選択</label>
          <input id="video-file-input" type="file" accept="video/mp4,.mp4" />
        </div>
        ${renderVideoMetadata()}
        <div class="video-workspace">
          ${renderVideoPreview()}
          <div>
            <h3>抽出状態</h3>
            <p class="status-text">${escapeHtml(renderExtractionStatus())}</p>
          </div>
        </div>
      </section>

      <section class="frames-panel" aria-label="抽出フレーム">
        <h2>抽出フレーム</h2>
        ${renderFrameThumbnails()}
      </section>

      <section class="workspace">
        <div class="preview-panel">
          <h2>2D preview</h2>
          ${renderPreview(idealFace.model.controlPoints)}
        </div>

        <div class="table-panel">
          <h2>controlPoints</h2>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>id</th>
                  <th>label</th>
                  <th>x</th>
                  <th>y</th>
                  <th>z</th>
                </tr>
              </thead>
              <tbody>
                ${renderControlPointRows(idealFace.model.controlPoints)}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="json-panel">
        <h2>JSON preview</h2>
        <pre>${escapeHtml(JSON.stringify(buildAuthoringDebugPreview(), null, 2))}</pre>
      </section>
    </main>
  `

  attachVideoInputHandler()
}

const style = document.createElement("style")

style.textContent = `
  :root {
    color: #17201b;
    background: #f4f7f6;
    font-family:
      Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
      "Segoe UI", sans-serif;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
  }

  main {
    width: min(1180px, calc(100% - 32px));
    margin: 0 auto;
    padding: 24px 0 32px;
  }

  .app-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
    border-bottom: 1px solid #ccd8d3;
    padding-bottom: 16px;
  }

  .app-header h1 {
    margin: 0;
    font-size: 28px;
    line-height: 1.15;
    letter-spacing: 0;
  }

  .app-header span {
    color: #f4f7f6;
    background: #27594c;
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
  }

  .eyebrow {
    margin: 0 0 5px;
    color: #6d756c;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .summary {
    margin-bottom: 22px;
  }

  dl {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 1px;
    margin: 0;
    overflow: hidden;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ccd8d3;
  }

  dl div {
    min-width: 0;
    background: #ffffff;
    padding: 14px;
  }

  dt {
    color: #6d756c;
    font-size: 12px;
    font-weight: 700;
  }

  dd {
    margin: 5px 0 0;
    overflow-wrap: anywhere;
    font-size: 15px;
    font-weight: 700;
  }

  .video-panel,
  .frames-panel {
    margin-bottom: 24px;
  }

  .panel-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
  }

  .panel-heading p {
    margin: 5px 0 0;
    color: #5d675f;
    font-size: 13px;
  }

  #video-file-input {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  .file-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 40px;
    border: 0;
    border-radius: 6px;
    background: #27594c;
    color: #ffffff;
    padding: 9px 13px;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
    white-space: nowrap;
  }

  .file-button:focus-visible {
    outline: 3px solid #9fc8bd;
    outline-offset: 2px;
  }

  .video-workspace {
    display: grid;
    grid-template-columns: minmax(320px, 0.9fr) minmax(260px, 1.1fr);
    gap: 18px;
    align-items: stretch;
    margin-top: 14px;
  }

  .video-preview,
  .video-empty,
  .frame-empty {
    width: 100%;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
  }

  .video-preview {
    display: block;
    aspect-ratio: 16 / 9;
    object-fit: contain;
  }

  .video-empty,
  .frame-empty {
    display: grid;
    min-height: 160px;
    place-items: center;
    padding: 18px;
    color: #5d675f;
    text-align: center;
  }

  .video-empty p,
  .frame-empty p,
  .status-text {
    margin: 0;
  }

  h3 {
    margin: 0 0 8px;
    font-size: 15px;
    line-height: 1.25;
    letter-spacing: 0;
  }

  .status-text {
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
    padding: 14px;
    color: #25342e;
    font-size: 14px;
    font-weight: 700;
  }

  .frame-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
  }

  .frame-card {
    min-width: 0;
    overflow: hidden;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
  }

  .frame-card img {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    background: #1f2824;
  }

  .frame-card div {
    display: grid;
    gap: 5px;
    padding: 10px;
  }

  .frame-card strong,
  .frame-card span {
    min-width: 0;
    overflow-wrap: anywhere;
    line-height: 1.35;
  }

  .frame-card strong {
    color: #17201b;
    font-size: 13px;
  }

  .frame-card span {
    color: #5d675f;
    font-size: 12px;
    font-weight: 700;
  }

  .workspace {
    display: grid;
    grid-template-columns: minmax(300px, 0.85fr) minmax(420px, 1.15fr);
    gap: 20px;
    align-items: start;
  }

  .preview-panel,
  .table-panel,
  .json-panel {
    min-width: 0;
  }

  h2 {
    margin: 0 0 10px;
    font-size: 17px;
    line-height: 1.25;
    letter-spacing: 0;
  }

  .preview {
    display: block;
    width: 100%;
    aspect-ratio: 1;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
  }

  .axis {
    stroke: #b7c7c2;
    stroke-width: 0.35;
  }

  .preview-point circle {
    fill: #d94f45;
    stroke: #7d2a28;
    stroke-width: 0.45;
  }

  .preview-point text {
    fill: #25342e;
    font-size: 3.4px;
    font-weight: 700;
  }

  .table-scroll {
    overflow-x: auto;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
  }

  table {
    width: 100%;
    min-width: 560px;
    border-collapse: collapse;
  }

  th,
  td {
    border-bottom: 1px solid #dde6e2;
    padding: 11px 12px;
    text-align: left;
    font-size: 13px;
  }

  th {
    color: #5d675f;
    background: #edf4f1;
    font-weight: 800;
  }

  td:nth-child(3),
  td:nth-child(4),
  td:nth-child(5) {
    font-variant-numeric: tabular-nums;
  }

  tr:last-child td {
    border-bottom: 0;
  }

  .json-panel {
    margin-top: 24px;
  }

  pre {
    margin: 0;
    max-height: 480px;
    overflow: auto;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #1f2824;
    color: #f2f7f4;
    padding: 14px;
    font-size: 12px;
    line-height: 1.5;
  }

  @media (max-width: 840px) {
    main {
      width: min(100% - 24px, 680px);
      padding-top: 18px;
    }

    .app-header {
      align-items: flex-start;
      flex-direction: column;
    }

    dl,
    .video-workspace,
    .workspace {
      grid-template-columns: 1fr;
    }

    .panel-heading {
      align-items: flex-start;
      flex-direction: column;
    }
  }
`

document.head.append(style)
render()
