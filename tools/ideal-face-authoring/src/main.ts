import {
  NATURAL_IDEAL_FACE_PRESET,
  type FaceLandmark,
  type FacePose,
  type IdealFacePoint3D,
} from "@bae-ar/engine"
import {
  FaceLandmarker,
  FilesetResolver,
  type Matrix,
} from "@mediapipe/tasks-vision"

const idealFace = NATURAL_IDEAL_FACE_PRESET
const app = document.querySelector<HTMLDivElement>("#app")
const MAX_EXTRACTED_FRAME_COUNT = 20
const THUMBNAIL_WIDTH = 180
const ANALYSIS_MAX_WIDTH = 640
const EMPTY_FACE_POSE: FacePose = {
  pitch: 0,
  yaw: 0,
  roll: 0,
}
const RAD_TO_DEG = 180 / Math.PI
const LEFT_EYE_OUTER_INDEX = 263
const RIGHT_EYE_OUTER_INDEX = 33
const NOSE_TIP_INDEX = 4
const MOUTH_CENTER_INDICES = [13, 14]
const REQUIRED_LANDMARK_COUNT = 478
const FRONT_POSE_LIMIT = {
  yaw: 8,
  pitch: 8,
  roll: 6,
}
const DIRECTIONAL_POSE_LIMIT = {
  yaw: 12,
  pitch: 10,
  roll: 8,
}
const YAW_CANDIDATE_MIN_ABS = 12
const PITCH_CANDIDATE_MIN_ABS = 10

type RepresentativeFrameCandidateKey =
  | "front"
  | "yawPositive"
  | "yawNegative"
  | "pitchPositive"
  | "pitchNegative"

type FrameAnalysisStatus =
  | "pending"
  | "analyzing"
  | "analyzed"
  | "no_face"
  | "error"

interface FrameAnalysisResult {
  detected: boolean
  landmarks: FaceLandmark[]
  pose: FacePose
  errorMessage: string | null
  analyzedAt: number
}

interface ExtractedVideoFrame {
  index: number
  timestamp: number
  status: FrameAnalysisStatus
  thumbnailUrl: string
  analysisImageUrl: string
  extractionTimeMs: number
  analysis?: FrameAnalysisResult
}

interface RepresentativeFrameCandidate {
  key: RepresentativeFrameCandidateKey
  frameIndex: number
  timestamp: number
  score: number
  detected: boolean
  landmarksCount: number
  status: FrameAnalysisStatus
  pose: FacePose
  yawAbs: number
  pitchAbs: number
  rollAbs: number
  thumbnailUrl: string
}

type RepresentativeFrameCandidates = Record<
  RepresentativeFrameCandidateKey,
  RepresentativeFrameCandidate | null
>

interface VideoSourceState {
  fileName: string
  objectUrl: string
  duration: number | null
  videoWidth: number | null
  videoHeight: number | null
  extractedFrames: ExtractedVideoFrame[]
  isExtracting: boolean
  isAnalyzing: boolean
  analysisError: string | null
  error: string | null
}

let videoSource: VideoSourceState | null = null
let faceLandmarker: FaceLandmarker | null = null
let faceLandmarkerInitialization: Promise<FaceLandmarker> | null = null
const extractionVideo = document.createElement("video")
const analysisCanvas = document.createElement("canvas")
const thumbnailCanvas = document.createElement("canvas")

if (!app) {
  throw new Error("IdealFace Authoring Tool app root was not found")
}

extractionVideo.muted = true
extractionVideo.playsInline = true
extractionVideo.preload = "metadata"

function formatNumber(value: number): string {
  return value.toFixed(3)
}

function formatOptionalNumber(value: number | null | undefined): string {
  return value === null || value === undefined ? "なし" : formatNumber(value)
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

function formatFrameAnalysisStatus(status: FrameAnalysisStatus): string {
  const labels: Record<FrameAnalysisStatus, string> = {
    pending: "未解析",
    analyzing: "解析中",
    analyzed: "解析済み",
    no_face: "顔検出なし",
    error: "解析エラー",
  }

  return labels[status]
}

function formatScore(value: number): string {
  return value.toFixed(2)
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

interface AnalysisSummary {
  extractedFrameCount: number
  analyzedFrameCount: number
  detectedFrameCount: number
  noFaceFrameCount: number
  failedFrameCount: number
  pitchRange: { min: number; max: number } | null
  yawRange: { min: number; max: number } | null
  rollRange: { min: number; max: number } | null
}

function getAnalysisSummary(): AnalysisSummary {
  const frames = videoSource?.extractedFrames ?? []
  const analyzedFrames = frames.filter((frame) =>
    ["analyzed", "no_face", "error"].includes(frame.status),
  )
  const detectedFrames = frames.filter((frame) => frame.analysis?.detected)
  const noFaceFrames = frames.filter((frame) => frame.status === "no_face")
  const failedFrames = frames.filter((frame) => frame.status === "error")

  return {
    extractedFrameCount: frames.length,
    analyzedFrameCount: analyzedFrames.length,
    detectedFrameCount: detectedFrames.length,
    noFaceFrameCount: noFaceFrames.length,
    failedFrameCount: failedFrames.length,
    pitchRange: getPoseRange(detectedFrames, "pitch"),
    yawRange: getPoseRange(detectedFrames, "yaw"),
    rollRange: getPoseRange(detectedFrames, "roll"),
  }
}

function getPoseRange(
  frames: ExtractedVideoFrame[],
  key: keyof FacePose,
): { min: number; max: number } | null {
  const values = frames
    .map((frame) => frame.analysis?.pose[key])
    .filter((value): value is number => value !== undefined)

  if (values.length === 0) {
    return null
  }

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  }
}

function formatPoseRange(range: { min: number; max: number } | null): string {
  return range ? `${formatNumber(range.min)} / ${formatNumber(range.max)}` : "なし"
}

function getRepresentativeFrameCandidates(): RepresentativeFrameCandidates {
  const candidates = getCandidateSourceFrames()

  return {
    front: selectBestCandidate(candidates, "front", scoreFrontCandidate),
    yawPositive: selectBestCandidate(
      candidates,
      "yawPositive",
      scoreYawPositiveCandidate,
    ),
    yawNegative: selectBestCandidate(
      candidates,
      "yawNegative",
      scoreYawNegativeCandidate,
    ),
    pitchPositive: selectBestCandidate(
      candidates,
      "pitchPositive",
      scorePitchPositiveCandidate,
    ),
    pitchNegative: selectBestCandidate(
      candidates,
      "pitchNegative",
      scorePitchNegativeCandidate,
    ),
  }
}

function getCandidateSourceFrames(): ExtractedVideoFrame[] {
  return (videoSource?.extractedFrames ?? []).filter((frame) => {
    const analysis = frame.analysis

    return (
      frame.status === "analyzed" &&
      analysis?.detected === true &&
      analysis.landmarks.length === REQUIRED_LANDMARK_COUNT
    )
  })
}

function selectBestCandidate(
  frames: ExtractedVideoFrame[],
  key: RepresentativeFrameCandidateKey,
  scoreCandidate: (pose: FacePose) => number | null,
): RepresentativeFrameCandidate | null {
  const scoredCandidates = frames
    .map((frame) => {
      const pose = frame.analysis?.pose

      if (!pose) {
        return null
      }

      const score = scoreCandidate(pose)

      if (score === null) {
        return null
      }

      return buildRepresentativeFrameCandidate(frame, key, score)
    })
    .filter(
      (candidate): candidate is RepresentativeFrameCandidate =>
        candidate !== null,
    )

  if (scoredCandidates.length === 0) {
    return null
  }

  return scoredCandidates.reduce((bestCandidate, candidate) =>
    candidate.score > bestCandidate.score ? candidate : bestCandidate,
  )
}

function buildRepresentativeFrameCandidate(
  frame: ExtractedVideoFrame,
  key: RepresentativeFrameCandidateKey,
  score: number,
): RepresentativeFrameCandidate {
  const pose = frame.analysis?.pose ?? { ...EMPTY_FACE_POSE }

  return {
    key,
    frameIndex: frame.index,
    timestamp: frame.timestamp,
    score: Number(clamp(score, 0, 1).toFixed(4)),
    detected: frame.analysis?.detected ?? false,
    landmarksCount: frame.analysis?.landmarks.length ?? 0,
    status: frame.status,
    pose,
    yawAbs: Math.abs(pose.yaw),
    pitchAbs: Math.abs(pose.pitch),
    rollAbs: Math.abs(pose.roll),
    thumbnailUrl: frame.thumbnailUrl,
  }
}

function scoreFrontCandidate(pose: FacePose): number | null {
  const yawAbs = Math.abs(pose.yaw)
  const pitchAbs = Math.abs(pose.pitch)
  const rollAbs = Math.abs(pose.roll)

  if (
    yawAbs > FRONT_POSE_LIMIT.yaw ||
    pitchAbs > FRONT_POSE_LIMIT.pitch ||
    rollAbs > FRONT_POSE_LIMIT.roll
  ) {
    return null
  }

  return (
    1 -
    (yawAbs / FRONT_POSE_LIMIT.yaw +
      pitchAbs / FRONT_POSE_LIMIT.pitch +
      rollAbs / FRONT_POSE_LIMIT.roll) /
      3
  )
}

function scoreYawPositiveCandidate(pose: FacePose): number | null {
  if (
    pose.yaw < YAW_CANDIDATE_MIN_ABS ||
    Math.abs(pose.pitch) > DIRECTIONAL_POSE_LIMIT.pitch ||
    Math.abs(pose.roll) > DIRECTIONAL_POSE_LIMIT.roll
  ) {
    return null
  }

  return scoreDirectionalCandidate(
    Math.abs(pose.yaw),
    Math.abs(pose.pitch),
    Math.abs(pose.roll),
    YAW_CANDIDATE_MIN_ABS,
    DIRECTIONAL_POSE_LIMIT.pitch,
    DIRECTIONAL_POSE_LIMIT.roll,
  )
}

function scoreYawNegativeCandidate(pose: FacePose): number | null {
  if (
    pose.yaw > -YAW_CANDIDATE_MIN_ABS ||
    Math.abs(pose.pitch) > DIRECTIONAL_POSE_LIMIT.pitch ||
    Math.abs(pose.roll) > DIRECTIONAL_POSE_LIMIT.roll
  ) {
    return null
  }

  return scoreDirectionalCandidate(
    Math.abs(pose.yaw),
    Math.abs(pose.pitch),
    Math.abs(pose.roll),
    YAW_CANDIDATE_MIN_ABS,
    DIRECTIONAL_POSE_LIMIT.pitch,
    DIRECTIONAL_POSE_LIMIT.roll,
  )
}

function scorePitchPositiveCandidate(pose: FacePose): number | null {
  if (
    pose.pitch < PITCH_CANDIDATE_MIN_ABS ||
    Math.abs(pose.yaw) > DIRECTIONAL_POSE_LIMIT.yaw ||
    Math.abs(pose.roll) > DIRECTIONAL_POSE_LIMIT.roll
  ) {
    return null
  }

  return scoreDirectionalCandidate(
    Math.abs(pose.pitch),
    Math.abs(pose.yaw),
    Math.abs(pose.roll),
    PITCH_CANDIDATE_MIN_ABS,
    DIRECTIONAL_POSE_LIMIT.yaw,
    DIRECTIONAL_POSE_LIMIT.roll,
  )
}

function scorePitchNegativeCandidate(pose: FacePose): number | null {
  if (
    pose.pitch > -PITCH_CANDIDATE_MIN_ABS ||
    Math.abs(pose.yaw) > DIRECTIONAL_POSE_LIMIT.yaw ||
    Math.abs(pose.roll) > DIRECTIONAL_POSE_LIMIT.roll
  ) {
    return null
  }

  return scoreDirectionalCandidate(
    Math.abs(pose.pitch),
    Math.abs(pose.yaw),
    Math.abs(pose.roll),
    PITCH_CANDIDATE_MIN_ABS,
    DIRECTIONAL_POSE_LIMIT.yaw,
    DIRECTIONAL_POSE_LIMIT.roll,
  )
}

function scoreDirectionalCandidate(
  primaryAbs: number,
  secondaryAbs: number,
  rollAbs: number,
  primaryMinAbs: number,
  secondaryLimit: number,
  rollLimit: number,
): number {
  const primaryScore = clamp((primaryAbs - primaryMinAbs) / 24, 0, 1)
  const secondaryScore = 1 - clamp(secondaryAbs / secondaryLimit, 0, 1)
  const rollScore = 1 - clamp(rollAbs / rollLimit, 0, 1)

  return primaryScore * 0.65 + secondaryScore * 0.22 + rollScore * 0.13
}

function toRepresentativeCandidatePreview(
  candidate: RepresentativeFrameCandidate | null,
): unknown {
  if (!candidate) {
    return null
  }

  return {
    frameIndex: candidate.frameIndex,
    timestamp: Number(candidate.timestamp.toFixed(3)),
    score: candidate.score,
    status: candidate.status,
    detected: candidate.detected,
    landmarksCount: candidate.landmarksCount,
    pose: {
      pitch: candidate.pose.pitch,
      yaw: candidate.pose.yaw,
      roll: candidate.pose.roll,
    },
    evaluation: {
      yawAbs: Number(candidate.yawAbs.toFixed(3)),
      pitchAbs: Number(candidate.pitchAbs.toFixed(3)),
      rollAbs: Number(candidate.rollAbs.toFixed(3)),
    },
  }
}

function toRepresentativeCandidatesPreview(
  candidates: RepresentativeFrameCandidates,
): unknown {
  return {
    front: toRepresentativeCandidatePreview(candidates.front),
    yawPositive: toRepresentativeCandidatePreview(candidates.yawPositive),
    yawNegative: toRepresentativeCandidatePreview(candidates.yawNegative),
    pitchPositive: toRepresentativeCandidatePreview(candidates.pitchPositive),
    pitchNegative: toRepresentativeCandidatePreview(candidates.pitchNegative),
  }
}

function renderRepresentativeFrameCandidatesPanel(): string {
  const candidates = getRepresentativeFrameCandidates()

  return `
    <section class="representative-panel" aria-label="代表フレーム候補">
      <div class="panel-heading">
        <div>
          <h2>代表フレーム候補</h2>
          <p>解析済みフレームの yaw / pitch / roll から候補を自動抽出します。</p>
        </div>
      </div>
      <p class="candidate-note">左右・上下の最終ラベルは未確定です。現時点では MediaPipe 推定値の正負方向として確認します。</p>
      <div class="candidate-grid">
        ${renderRepresentativeCandidateCard("正面候補", candidates.front)}
        ${renderRepresentativeCandidateCard("yaw 正方向候補", candidates.yawPositive)}
        ${renderRepresentativeCandidateCard("yaw 負方向候補", candidates.yawNegative)}
        ${renderRepresentativeCandidateCard("pitch 正方向候補", candidates.pitchPositive)}
        ${renderRepresentativeCandidateCard("pitch 負方向候補", candidates.pitchNegative)}
      </div>
    </section>
  `
}

function renderRepresentativeCandidateCard(
  title: string,
  candidate: RepresentativeFrameCandidate | null,
): string {
  if (!candidate) {
    return `
      <article class="candidate-card candidate-card-empty">
        <h3>${escapeHtml(title)}</h3>
        <strong>候補なし</strong>
        <p>該当する解析済みフレームがありません。</p>
      </article>
    `
  }

  return `
    <article class="candidate-card">
      <img src="${escapeHtml(candidate.thumbnailUrl)}" alt="${escapeHtml(title)} Frame ${String(candidate.frameIndex).padStart(3, "0")}" />
      <div>
        <h3>${escapeHtml(title)}</h3>
        <strong>Frame ${String(candidate.frameIndex).padStart(3, "0")} / ${candidate.timestamp.toFixed(1)}s</strong>
        <span>yaw: ${formatNumber(candidate.pose.yaw)} / pitch: ${formatNumber(candidate.pose.pitch)} / roll: ${formatNumber(candidate.pose.roll)}</span>
        <span>score: ${formatScore(candidate.score)}</span>
        <span>landmarks 数: ${candidate.landmarksCount}</span>
      </div>
    </article>
  `
}

function renderAnalysisPanel(): string {
  const summary = getAnalysisSummary()
  const hasFrames = summary.extractedFrameCount > 0
  const isAnalyzing = videoSource?.isAnalyzing ?? false
  const disabled = !hasFrames || isAnalyzing
  const statusText = videoSource?.analysisError
    ? videoSource.analysisError
    : isAnalyzing
      ? "MediaPipe 解析中です。"
      : hasFrames
        ? "抽出済みフレームを MediaPipe Face Landmarker で解析できます。"
        : "フレーム抽出後に解析できます。"

  return `
    <section class="analysis-panel" aria-label="フレーム解析">
      <div class="panel-heading">
        <div>
          <h2>フレーム解析</h2>
          <p>抽出済みフレームから 2D 478 landmarks と FacePose を取得します。</p>
        </div>
        <button id="analyze-frames-button" class="analysis-button" type="button" ${disabled ? "disabled" : ""}>
          MediaPipe 解析を実行
        </button>
      </div>
      <p class="status-text">${escapeHtml(statusText)}</p>
      <dl class="analysis-summary">
        <div>
          <dt>抽出フレーム数</dt>
          <dd>${summary.extractedFrameCount}</dd>
        </div>
        <div>
          <dt>解析済みフレーム数</dt>
          <dd>${summary.analyzedFrameCount}</dd>
        </div>
        <div>
          <dt>顔検出あり</dt>
          <dd>${summary.detectedFrameCount}</dd>
        </div>
        <div>
          <dt>顔検出なし</dt>
          <dd>${summary.noFaceFrameCount}</dd>
        </div>
        <div>
          <dt>解析エラー数</dt>
          <dd>${summary.failedFrameCount}</dd>
        </div>
        <div>
          <dt>pitch 範囲</dt>
          <dd>${formatPoseRange(summary.pitchRange)}</dd>
        </div>
        <div>
          <dt>yaw 範囲</dt>
          <dd>${formatPoseRange(summary.yawRange)}</dd>
        </div>
        <div>
          <dt>roll 範囲</dt>
          <dd>${formatPoseRange(summary.rollRange)}</dd>
        </div>
      </dl>
    </section>
  `
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
                <span>解析状態: ${formatFrameAnalysisStatus(frame.status)}</span>
                <span>landmarks 数: ${frame.analysis?.landmarks.length ?? 0}</span>
                <span>pose pitch / yaw / roll: ${formatOptionalNumber(frame.analysis?.pose.pitch)} / ${formatOptionalNumber(frame.analysis?.pose.yaw)} / ${formatOptionalNumber(frame.analysis?.pose.roll)}</span>
                ${frame.analysis?.errorMessage ? `<span>error: ${escapeHtml(frame.analysis.errorMessage)}</span>` : ""}
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
  const analysisSummary = getAnalysisSummary()
  const representativeFrameCandidates = getRepresentativeFrameCandidates()

  return {
    idealFace,
    representativeFrameCandidates: toRepresentativeCandidatesPreview(
      representativeFrameCandidates,
    ),
    videoSource: videoSource
      ? {
          fileName: videoSource.fileName,
          duration: videoSource.duration,
          videoWidth: videoSource.videoWidth,
          videoHeight: videoSource.videoHeight,
          extractedFrameCount: videoSource.extractedFrames.length,
          analyzedFrameCount: analysisSummary.analyzedFrameCount,
          detectedFrameCount: analysisSummary.detectedFrameCount,
          failedFrameCount: analysisSummary.failedFrameCount,
          noFaceFrameCount: analysisSummary.noFaceFrameCount,
          poseRange: {
            pitch: analysisSummary.pitchRange,
            yaw: analysisSummary.yawRange,
            roll: analysisSummary.rollRange,
          },
          frames: videoSource.extractedFrames.map((frame) => ({
            frameIndex: frame.index,
            timestamp: frame.timestamp,
            status: frame.status,
            detected: frame.analysis?.detected ?? false,
            landmarksCount: frame.analysis?.landmarks.length ?? 0,
            posePreview: frame.analysis
              ? {
                  pitch: frame.analysis.pose.pitch,
                  yaw: frame.analysis.pose.yaw,
                  roll: frame.analysis.pose.roll,
                }
              : null,
            landmarkPreview:
              frame.analysis?.landmarks.slice(0, 5).map((landmark) => ({
                x: Number(landmark.x.toFixed(4)),
                y: Number(landmark.y.toFixed(4)),
                z: Number(landmark.z.toFixed(4)),
              })) ?? [],
            errorMessage: frame.analysis?.errorMessage ?? null,
            extractionTimeMs: Number(frame.extractionTimeMs.toFixed(1)),
            thumbnail: "omitted",
            analysisImage: "omitted",
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

function attachAnalysisHandler(): void {
  document
    .querySelector<HTMLButtonElement>("#analyze-frames-button")
    ?.addEventListener("click", async () => {
      await analyzeExtractedFrames()
    })
}

async function analyzeExtractedFrames(): Promise<void> {
  if (!videoSource || videoSource.extractedFrames.length === 0) {
    return
  }

  updateVideoSource({
    isAnalyzing: true,
    analysisError: null,
    extractedFrames: videoSource.extractedFrames.map((frame) => ({
      ...frame,
      status: "pending",
      analysis: undefined,
    })),
  })
  render()

  try {
    const landmarker = await getFaceLandmarker()

    for (const frame of videoSource.extractedFrames) {
      updateExtractedFrame(frame.index, {
        status: "analyzing",
        analysis: undefined,
      })
      render()

      try {
        const image = await loadFrameImage(frame.analysisImageUrl)
        const result = landmarker.detect(image)
        const landmarks = (result.faceLandmarks[0] ?? []).map((landmark) => ({
          x: landmark.x,
          y: landmark.y,
          z: landmark.z,
        }))
        const detected = result.faceLandmarks.length > 0

        updateExtractedFrame(frame.index, {
          status: detected ? "analyzed" : "no_face",
          analysis: {
            detected,
            landmarks,
            pose: detected
              ? estimateFacePose(
                  landmarks,
                  result.facialTransformationMatrixes[0],
                )
              : { ...EMPTY_FACE_POSE },
            errorMessage: null,
            analyzedAt: Date.now(),
          },
        })
      } catch (error) {
        updateExtractedFrame(frame.index, {
          status: "error",
          analysis: {
            detected: false,
            landmarks: [],
            pose: { ...EMPTY_FACE_POSE },
            errorMessage:
              error instanceof Error ? error.message : String(error),
            analyzedAt: Date.now(),
          },
        })
      }

      render()
    }
  } catch (error) {
    updateVideoSource({
      analysisError:
        error instanceof Error
          ? error.message
          : "MediaPipe 解析の初期化に失敗しました。",
    })
  }

  updateVideoSource({
    isAnalyzing: false,
  })
  render()
}

function updateExtractedFrame(
  frameIndex: number,
  nextFrameState: Partial<ExtractedVideoFrame>,
): void {
  if (!videoSource) {
    return
  }

  updateVideoSource({
    extractedFrames: videoSource.extractedFrames.map((frame) =>
      frame.index === frameIndex
        ? {
            ...frame,
            ...nextFrameState,
          }
        : frame,
    ),
  })
}

async function getFaceLandmarker(): Promise<FaceLandmarker> {
  if (faceLandmarker) {
    return faceLandmarker
  }

  if (!faceLandmarkerInitialization) {
    faceLandmarkerInitialization = initializeFaceLandmarker()
  }

  faceLandmarker = await faceLandmarkerInitialization

  return faceLandmarker
}

async function initializeFaceLandmarker(): Promise<FaceLandmarker> {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
  )

  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
    },
    runningMode: "IMAGE",
    numFaces: 1,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: true,
  })
}

async function loadFrameImage(src: string): Promise<HTMLImageElement> {
  const image = new Image()

  image.src = src

  if (image.decode) {
    await image.decode()
    return image
  }

  await new Promise<void>((resolve, reject) => {
    image.addEventListener("load", () => resolve(), { once: true })
    image.addEventListener(
      "error",
      () => reject(new Error("解析用フレーム画像を読み込めませんでした。")),
      { once: true },
    )
  })

  return image
}

function estimateFacePose(
  landmarks: FaceLandmark[],
  facialTransformationMatrix: Matrix | undefined,
): FacePose {
  return (
    estimateFacePoseFromMatrix(facialTransformationMatrix) ??
    estimateFacePoseFromLandmarks(landmarks) ?? { ...EMPTY_FACE_POSE }
  )
}

function estimateFacePoseFromMatrix(
  matrix: Matrix | undefined,
): FacePose | null {
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

function estimateFacePoseFromLandmarks(
  landmarks: FaceLandmark[],
): FacePose | null {
  const leftEye = landmarks[LEFT_EYE_OUTER_INDEX]
  const rightEye = landmarks[RIGHT_EYE_OUTER_INDEX]
  const noseTip = landmarks[NOSE_TIP_INDEX]
  const mouthCenter = averageLandmarks(landmarks, MOUTH_CENTER_INDICES)

  if (!leftEye || !rightEye || !noseTip || !mouthCenter) {
    return null
  }

  const eyeCenter = {
    x: (leftEye.x + rightEye.x) / 2,
    y: (leftEye.y + rightEye.y) / 2,
    z: (leftEye.z + rightEye.z) / 2,
  }
  const eyeDistance = Math.hypot(leftEye.x - rightEye.x, leftEye.y - rightEye.y)
  const eyeToMouthDistance = Math.hypot(
    mouthCenter.x - eyeCenter.x,
    mouthCenter.y - eyeCenter.y,
  )

  if (eyeDistance === 0 || eyeToMouthDistance === 0) {
    return null
  }

  return {
    pitch: clamp(
      ((noseTip.y - eyeCenter.y) / eyeToMouthDistance - 0.6) * 60,
      -45,
      45,
    ),
    yaw: clamp(((noseTip.x - eyeCenter.x) / eyeDistance) * 70, -45, 45),
    roll:
      Math.atan2(leftEye.y - rightEye.y, leftEye.x - rightEye.x) * RAD_TO_DEG,
  }
}

function averageLandmarks(
  landmarks: FaceLandmark[],
  indices: number[],
): FaceLandmark | null {
  const points = indices
    .map((index) => landmarks[index])
    .filter((landmark): landmark is FaceLandmark => Boolean(landmark))

  if (points.length !== indices.length) {
    return null
  }

  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
    z: points.reduce((sum, point) => sum + point.z, 0) / points.length,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
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
      isAnalyzing: false,
      analysisError: null,
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
    isAnalyzing: false,
    analysisError: null,
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
  const analysisContext = analysisCanvas.getContext("2d")
  const thumbnailContext = thumbnailCanvas.getContext("2d")

  if (
    !analysisContext ||
    !thumbnailContext ||
    video.videoWidth === 0 ||
    video.videoHeight === 0
  ) {
    throw new Error("動画フレームを canvas に描画できませんでした。")
  }

  const analysisWidth = Math.min(video.videoWidth, ANALYSIS_MAX_WIDTH)
  const analysisHeight = Math.round(
    (analysisWidth * video.videoHeight) / video.videoWidth,
  )
  const thumbnailHeight = Math.round(
    (THUMBNAIL_WIDTH * video.videoHeight) / video.videoWidth,
  )
  analysisCanvas.width = analysisWidth
  analysisCanvas.height = analysisHeight
  thumbnailCanvas.width = THUMBNAIL_WIDTH
  thumbnailCanvas.height = thumbnailHeight

  const frames: ExtractedVideoFrame[] = []

  for (const [index, timestamp] of timestamps.entries()) {
    const startedAt = performance.now()

    if (Math.abs(video.currentTime - timestamp) > 0.001) {
      video.currentTime = timestamp
      await waitForVideoEvent("seeked")
    } else if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      await waitForVideoEvent("loadeddata")
    }

    analysisContext.drawImage(video, 0, 0, analysisWidth, analysisHeight)
    thumbnailContext.drawImage(
      analysisCanvas,
      0,
      0,
      THUMBNAIL_WIDTH,
      thumbnailHeight,
    )

    frames.push({
      index: index + 1,
      timestamp,
      status: "pending",
      thumbnailUrl: thumbnailCanvas.toDataURL("image/jpeg", 0.82),
      analysisImageUrl: analysisCanvas.toDataURL("image/jpeg", 0.9),
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
        <span>Step 2-C</span>
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

      ${renderAnalysisPanel()}

      ${renderRepresentativeFrameCandidatesPanel()}

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
  attachAnalysisHandler()
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
  .analysis-panel,
  .representative-panel,
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

  .file-button,
  .analysis-button {
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

  .analysis-button {
    font-family: inherit;
  }

  .analysis-button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .file-button:focus-visible,
  .analysis-button:focus-visible {
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

  .candidate-note {
    margin: 0 0 12px;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
    padding: 12px 14px;
    color: #5d675f;
    font-size: 13px;
    font-weight: 700;
  }

  .analysis-summary {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin-top: 12px;
  }

  .candidate-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 12px;
  }

  .candidate-card {
    min-width: 0;
    overflow: hidden;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
  }

  .candidate-card img {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    background: #1f2824;
  }

  .candidate-card div,
  .candidate-card-empty {
    display: grid;
    gap: 6px;
    padding: 12px;
  }

  .candidate-card h3,
  .candidate-card strong,
  .candidate-card span,
  .candidate-card p {
    min-width: 0;
    margin: 0;
    overflow-wrap: anywhere;
    line-height: 1.35;
  }

  .candidate-card h3 {
    color: #17201b;
    font-size: 14px;
  }

  .candidate-card strong {
    color: #25342e;
    font-size: 13px;
  }

  .candidate-card span,
  .candidate-card p {
    color: #5d675f;
    font-size: 12px;
    font-weight: 700;
  }

  .candidate-card-empty {
    min-height: 180px;
    align-content: start;
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
window.addEventListener("beforeunload", () => {
  faceLandmarker?.close()
})
render()
