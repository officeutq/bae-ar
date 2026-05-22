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
const DETAILED_SCAN_INTERVAL_SEC = 0.1
const MAX_DETAILED_SCAN_FRAME_COUNT = 150
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
  yaw: 12,
  pitch: 12,
  roll: 9,
}
const DIRECTIONAL_POSE_LIMIT = {
  yaw: 24,
  pitch: 24,
  roll: 14,
}
const YAW_CANDIDATE_MIN_ABS = 6
const PITCH_CANDIDATE_MIN_ABS = 5
const MAX_CANDIDATES_PER_CATEGORY = 30
const INFERENCE_DATASET_LABELS: SelectableRepresentativeFrameLabel[] = [
  "front",
  "left",
  "right",
  "up",
  "down",
]
const INFERENCE_DATASET_LANDMARK_PREVIEW_COUNT = 5

type RepresentativeFrameCandidateKey =
  | "front"
  | "yawPositive"
  | "yawNegative"
  | "pitchPositive"
  | "pitchNegative"

type ManualRepresentativeFrameLabel =
  | "front"
  | "left"
  | "right"
  | "up"
  | "down"
  | "excluded"

type SelectableRepresentativeFrameLabel = Exclude<
  ManualRepresentativeFrameLabel,
  "excluded"
>

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

interface LandmarkPreviewPoint {
  index: number
  x: number
  y: number
  z: number
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
  landmarkPreview: LandmarkPreviewPoint[]
}

type RepresentativeFrameCandidates = Record<
  RepresentativeFrameCandidateKey,
  RepresentativeFrameCandidate[]
>

type RepresentativeCandidateCategoryOpenState = Record<
  RepresentativeFrameCandidateKey,
  boolean
>

interface SelectedRepresentativeFrame {
  label: ManualRepresentativeFrameLabel
  frameIndex: number
  timestamp: number
  pose: FacePose
  score: number
  landmarksCount: number
  status: "selected" | "excluded"
  thumbnailUrl: string
  landmarkPreview: LandmarkPreviewPoint[]
}

type SelectedRepresentativeFrames = Record<
  SelectableRepresentativeFrameLabel,
  SelectedRepresentativeFrame | null
> & {
  excluded: SelectedRepresentativeFrame[]
}

type InferenceDatasetEntryStatus = "ready" | "missing" | "invalid"

interface RepresentativeFrameDatasetEntry {
  label: SelectableRepresentativeFrameLabel
  frameIndex: number | null
  timestamp: number | null
  pose: FacePose | null
  landmarksCount: number
  landmarkPreview: LandmarkPreviewPoint[]
  status: InferenceDatasetEntryStatus
  landmarks: FaceLandmark[]
  thumbnailUrl: string | null
}

interface IdealLandmarks3DInferenceDataset {
  readyCount: number
  requiredCount: number
  entries: RepresentativeFrameDatasetEntry[]
}

interface DetailedScanSummary {
  scanIntervalSec: number
  maxScanFrames: number
  maxCandidatesPerCategory: number
  scannedFrameCount: number
  analyzedFrameCount: number
  detectedFrameCount: number
  candidateSourceFrameCount: number
  candidateCounts: Record<RepresentativeFrameCandidateKey, number>
  candidateCategoryCount: number
  excludedCandidateCount: number
}

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
  scanSummary: DetailedScanSummary
  representativeFrameCandidates: RepresentativeFrameCandidates
  representativeCandidateFrames: ExtractedVideoFrame[]
}

let videoSource: VideoSourceState | null = null
let faceLandmarker: FaceLandmarker | null = null
let faceLandmarkerInitialization: Promise<FaceLandmarker> | null = null
let isDebugFrameListOpen = false
let representativeCandidateCategoryOpenState =
  createDefaultRepresentativeCandidateCategoryOpenState()
let selectedRepresentativeFrames: SelectedRepresentativeFrames =
  createEmptySelectedRepresentativeFrames()
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

function formatManualRepresentativeFrameLabel(
  label: ManualRepresentativeFrameLabel,
): string {
  const labels: Record<ManualRepresentativeFrameLabel, string> = {
    front: "正面",
    left: "左向き",
    right: "右向き",
    up: "上向き",
    down: "下向き",
    excluded: "除外",
  }

  return labels[label]
}

function formatInferenceDatasetEntryStatus(
  status: InferenceDatasetEntryStatus,
): string {
  const labels: Record<InferenceDatasetEntryStatus, string> = {
    ready: "準備済み",
    missing: "未選択",
    invalid: "無効",
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

function getDetailedScanSummary(): DetailedScanSummary {
  if (!videoSource) {
    return createEmptyDetailedScanSummary()
  }

  const candidates = getRepresentativeFrameCandidates()

  return {
    ...videoSource.scanSummary,
    candidateCounts: getCandidateCounts(candidates),
    candidateCategoryCount: getCandidateCategoryCount(candidates),
    excludedCandidateCount: selectedRepresentativeFrames.excluded.length,
  }
}

function getCandidateCounts(
  candidates: RepresentativeFrameCandidates,
): Record<RepresentativeFrameCandidateKey, number> {
  return {
    front: candidates.front.length,
    yawPositive: candidates.yawPositive.length,
    yawNegative: candidates.yawNegative.length,
    pitchPositive: candidates.pitchPositive.length,
    pitchNegative: candidates.pitchNegative.length,
  }
}

function getCandidateCategoryCount(
  candidates: RepresentativeFrameCandidates,
): number {
  return Object.values(candidates).filter((category) => category.length > 0)
    .length
}

function getRepresentativeFrameCandidates(): RepresentativeFrameCandidates {
  const candidates =
    videoSource?.representativeFrameCandidates ??
    createEmptyRepresentativeFrameCandidates()
  const excludedFrameIndexes = getExcludedCandidateFrameIndexes()

  if (excludedFrameIndexes.size === 0) {
    return candidates
  }

  return {
    front: filterExcludedCandidates(candidates.front, excludedFrameIndexes),
    yawPositive: filterExcludedCandidates(
      candidates.yawPositive,
      excludedFrameIndexes,
    ),
    yawNegative: filterExcludedCandidates(
      candidates.yawNegative,
      excludedFrameIndexes,
    ),
    pitchPositive: filterExcludedCandidates(
      candidates.pitchPositive,
      excludedFrameIndexes,
    ),
    pitchNegative: filterExcludedCandidates(
      candidates.pitchNegative,
      excludedFrameIndexes,
    ),
  }
}

function getExcludedCandidateFrameIndexes(): Set<number> {
  return new Set(
    selectedRepresentativeFrames.excluded.map((frame) => frame.frameIndex),
  )
}

function filterExcludedCandidates(
  candidates: RepresentativeFrameCandidate[],
  excludedFrameIndexes: Set<number>,
): RepresentativeFrameCandidate[] {
  return candidates.filter(
    (candidate) => !excludedFrameIndexes.has(candidate.frameIndex),
  )
}

function buildRepresentativeFrameCandidatesFromFrames(
  frames: ExtractedVideoFrame[],
): RepresentativeFrameCandidates {
  return {
    front: collectCategoryCandidates(frames, "front", scoreFrontCandidate),
    yawPositive: collectCategoryCandidates(
      frames,
      "yawPositive",
      scoreYawPositiveCandidate,
    ),
    yawNegative: collectCategoryCandidates(
      frames,
      "yawNegative",
      scoreYawNegativeCandidate,
    ),
    pitchPositive: collectCategoryCandidates(
      frames,
      "pitchPositive",
      scorePitchPositiveCandidate,
    ),
    pitchNegative: collectCategoryCandidates(
      frames,
      "pitchNegative",
      scorePitchNegativeCandidate,
    ),
  }
}

function getCandidateSourceFrames(): ExtractedVideoFrame[] {
  return getCandidateSourceFramesFromFrames(
    videoSource?.representativeCandidateFrames ?? [],
  )
}

function getCandidateSourceFramesFromFrames(
  frames: ExtractedVideoFrame[],
): ExtractedVideoFrame[] {
  return frames.filter((frame) => {
    const analysis = frame.analysis

    return (
      frame.status === "analyzed" &&
      analysis?.detected === true &&
      analysis.landmarks.length === REQUIRED_LANDMARK_COUNT &&
      hasCompletePose(analysis.pose)
    )
  })
}

function createEmptyRepresentativeFrameCandidates(): RepresentativeFrameCandidates {
  return {
    front: [],
    yawPositive: [],
    yawNegative: [],
    pitchPositive: [],
    pitchNegative: [],
  }
}

function createEmptyDetailedScanSummary(): DetailedScanSummary {
  return {
    scanIntervalSec: DETAILED_SCAN_INTERVAL_SEC,
    maxScanFrames: MAX_DETAILED_SCAN_FRAME_COUNT,
    maxCandidatesPerCategory: MAX_CANDIDATES_PER_CATEGORY,
    scannedFrameCount: 0,
    analyzedFrameCount: 0,
    detectedFrameCount: 0,
    candidateSourceFrameCount: 0,
    candidateCounts: getCandidateCounts(
      createEmptyRepresentativeFrameCandidates(),
    ),
    candidateCategoryCount: 0,
    excludedCandidateCount: 0,
  }
}

function hasCompletePose(pose: FacePose | undefined): pose is FacePose {
  return (
    pose !== undefined &&
    Number.isFinite(pose.pitch) &&
    Number.isFinite(pose.yaw) &&
    Number.isFinite(pose.roll)
  )
}

function collectCategoryCandidates(
  frames: ExtractedVideoFrame[],
  key: RepresentativeFrameCandidateKey,
  scoreCandidate: (pose: FacePose) => number | null,
): RepresentativeFrameCandidate[] {
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
    .sort((a, b) => b.score - a.score || a.frameIndex - b.frameIndex)
    .slice(0, MAX_CANDIDATES_PER_CATEGORY)

  return scoredCandidates
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
    landmarkPreview: buildLandmarkPreview(frame.analysis?.landmarks ?? []),
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
  const primaryScore = clamp((primaryAbs - primaryMinAbs) / 30, 0, 1)
  const secondaryScore = 1 - clamp(secondaryAbs / secondaryLimit, 0, 1)
  const rollScore = 1 - clamp(rollAbs / rollLimit, 0, 1)

  return primaryScore * 0.7 + secondaryScore * 0.18 + rollScore * 0.12
}

function toRepresentativeCandidatePreview(
  candidate: RepresentativeFrameCandidate,
): unknown {
  return {
    frameIndex: candidate.frameIndex,
    timestamp: Number(candidate.timestamp.toFixed(3)),
    score: candidate.score,
    pose: {
      pitch: candidate.pose.pitch,
      yaw: candidate.pose.yaw,
      roll: candidate.pose.roll,
    },
    landmarksCount: candidate.landmarksCount,
    status: candidate.status,
  }
}

function toRepresentativeCandidatesPreview(
  candidates: RepresentativeFrameCandidates,
): unknown {
  return {
    front: candidates.front.map(toRepresentativeCandidatePreview),
    yawPositive: candidates.yawPositive.map(toRepresentativeCandidatePreview),
    yawNegative: candidates.yawNegative.map(toRepresentativeCandidatePreview),
    pitchPositive: candidates.pitchPositive.map(toRepresentativeCandidatePreview),
    pitchNegative: candidates.pitchNegative.map(toRepresentativeCandidatePreview),
  }
}

function createEmptySelectedRepresentativeFrames(): SelectedRepresentativeFrames {
  return {
    front: null,
    left: null,
    right: null,
    up: null,
    down: null,
    excluded: [],
  }
}

function createDefaultRepresentativeCandidateCategoryOpenState(): RepresentativeCandidateCategoryOpenState {
  return {
    front: true,
    yawPositive: false,
    yawNegative: false,
    pitchPositive: false,
    pitchNegative: false,
  }
}

function toSelectedRepresentativeFramePreview(
  frame: SelectedRepresentativeFrame | null,
): unknown {
  if (!frame) {
    return null
  }

  return {
    label: frame.label,
    frameIndex: frame.frameIndex,
    timestamp: Number(frame.timestamp.toFixed(3)),
    pose: {
      pitch: frame.pose.pitch,
      yaw: frame.pose.yaw,
      roll: frame.pose.roll,
    },
    score: frame.score,
    landmarksCount: frame.landmarksCount,
    status: frame.status,
    landmarkPreview: frame.landmarkPreview,
  }
}

function toSelectedRepresentativeFramesPreview(): unknown {
  return {
    front: toSelectedRepresentativeFramePreview(
      selectedRepresentativeFrames.front,
    ),
    left: toSelectedRepresentativeFramePreview(
      selectedRepresentativeFrames.left,
    ),
    right: toSelectedRepresentativeFramePreview(
      selectedRepresentativeFrames.right,
    ),
    up: toSelectedRepresentativeFramePreview(selectedRepresentativeFrames.up),
    down: toSelectedRepresentativeFramePreview(
      selectedRepresentativeFrames.down,
    ),
    excluded: selectedRepresentativeFrames.excluded.map((frame) =>
      toSelectedRepresentativeFramePreview(frame),
    ),
  }
}

function buildLandmarkPreview(
  landmarks: FaceLandmark[],
): RepresentativeFrameDatasetEntry["landmarkPreview"] {
  return landmarks
    .slice(0, INFERENCE_DATASET_LANDMARK_PREVIEW_COUNT)
    .map((landmark, index) => ({
      index,
      x: Number(landmark.x.toFixed(4)),
      y: Number(landmark.y.toFixed(4)),
      z: Number(landmark.z.toFixed(4)),
    }))
}

function findExtractedVideoFrame(frameIndex: number): ExtractedVideoFrame | null {
  return (
    videoSource?.representativeCandidateFrames.find(
      (frame) => frame.index === frameIndex,
    ) ??
    videoSource?.extractedFrames.find((frame) => frame.index === frameIndex) ??
    null
  )
}

function buildMissingDatasetEntry(
  label: SelectableRepresentativeFrameLabel,
): RepresentativeFrameDatasetEntry {
  return {
    label,
    frameIndex: null,
    timestamp: null,
    pose: null,
    landmarksCount: 0,
    landmarkPreview: [],
    status: "missing",
    landmarks: [],
    thumbnailUrl: null,
  }
}

function buildInvalidDatasetEntry(
  label: SelectableRepresentativeFrameLabel,
  selectedFrame: SelectedRepresentativeFrame,
): RepresentativeFrameDatasetEntry {
  return {
    label,
    frameIndex: selectedFrame.frameIndex,
    timestamp: selectedFrame.timestamp,
    pose: selectedFrame.pose,
    landmarksCount: selectedFrame.landmarksCount,
    landmarkPreview: [],
    status: "invalid",
    landmarks: [],
    thumbnailUrl: selectedFrame.thumbnailUrl,
  }
}

function buildReadyDatasetEntry(
  label: SelectableRepresentativeFrameLabel,
  selectedFrame: SelectedRepresentativeFrame,
  extractedFrame: ExtractedVideoFrame,
): RepresentativeFrameDatasetEntry {
  const analysis = extractedFrame.analysis

  if (
    !analysis ||
    analysis.detected !== true ||
    analysis.landmarks.length !== REQUIRED_LANDMARK_COUNT ||
    !hasCompletePose(analysis.pose)
  ) {
    return buildInvalidDatasetEntry(label, selectedFrame)
  }

  return {
    label,
    frameIndex: selectedFrame.frameIndex,
    timestamp: selectedFrame.timestamp,
    pose: analysis.pose,
    landmarksCount: analysis.landmarks.length,
    landmarkPreview: buildLandmarkPreview(analysis.landmarks),
    status: "ready",
    landmarks: analysis.landmarks,
    thumbnailUrl: selectedFrame.thumbnailUrl,
  }
}

function getIdealLandmarks3DInferenceDataset(): IdealLandmarks3DInferenceDataset {
  const entries = INFERENCE_DATASET_LABELS.map((label) => {
    const selectedFrame = selectedRepresentativeFrames[label]

    if (!selectedFrame) {
      return buildMissingDatasetEntry(label)
    }

    const extractedFrame = findExtractedVideoFrame(selectedFrame.frameIndex)

    if (!extractedFrame) {
      return buildInvalidDatasetEntry(label, selectedFrame)
    }

    return buildReadyDatasetEntry(label, selectedFrame, extractedFrame)
  })
  const readyCount = entries.filter((entry) => entry.status === "ready").length

  return {
    readyCount,
    requiredCount: INFERENCE_DATASET_LABELS.length,
    entries,
  }
}

function toInferenceDatasetEntryPreview(
  entry: RepresentativeFrameDatasetEntry,
): unknown {
  return {
    label: entry.label,
    frameIndex: entry.frameIndex,
    timestamp:
      entry.timestamp === null ? null : Number(entry.timestamp.toFixed(3)),
    status: entry.status,
    pose: entry.pose
      ? {
          pitch: entry.pose.pitch,
          yaw: entry.pose.yaw,
          roll: entry.pose.roll,
        }
      : null,
    landmarksCount: entry.landmarksCount,
    landmarkPreview: entry.landmarkPreview,
  }
}

function toInferenceDatasetPreview(
  dataset: IdealLandmarks3DInferenceDataset,
): unknown {
  return {
    readyCount: dataset.readyCount,
    requiredCount: dataset.requiredCount,
    entries: dataset.entries.map(toInferenceDatasetEntryPreview),
  }
}

function getAllRepresentativeCandidates(
  candidates: RepresentativeFrameCandidates,
): RepresentativeFrameCandidate[] {
  return [
    ...candidates.front,
    ...candidates.yawPositive,
    ...candidates.yawNegative,
    ...candidates.pitchPositive,
    ...candidates.pitchNegative,
  ]
}

function findRepresentativeCandidate(
  candidateKey: RepresentativeFrameCandidateKey,
  frameIndex: number,
): RepresentativeFrameCandidate | null {
  const candidates = getRepresentativeFrameCandidates()

  return (
    getAllRepresentativeCandidates(candidates).find(
      (candidate) =>
        candidate.key === candidateKey && candidate.frameIndex === frameIndex,
    ) ?? null
  )
}

function buildSelectedRepresentativeFrame(
  label: ManualRepresentativeFrameLabel,
  candidate: RepresentativeFrameCandidate,
): SelectedRepresentativeFrame {
  return {
    label,
    frameIndex: candidate.frameIndex,
    timestamp: candidate.timestamp,
    pose: candidate.pose,
    score: candidate.score,
    landmarksCount: candidate.landmarksCount,
    status: label === "excluded" ? "excluded" : "selected",
    thumbnailUrl: candidate.thumbnailUrl,
    landmarkPreview: candidate.landmarkPreview,
  }
}

function removeFrameFromSelectedRepresentativeFrames(frameIndex: number): void {
  const selectableLabels: SelectableRepresentativeFrameLabel[] = [
    "front",
    "left",
    "right",
    "up",
    "down",
  ]

  for (const label of selectableLabels) {
    if (selectedRepresentativeFrames[label]?.frameIndex === frameIndex) {
      selectedRepresentativeFrames[label] = null
    }
  }

  selectedRepresentativeFrames.excluded =
    selectedRepresentativeFrames.excluded.filter(
      (frame) => frame.frameIndex !== frameIndex,
    )
}

function selectRepresentativeFrame(
  label: ManualRepresentativeFrameLabel,
  candidate: RepresentativeFrameCandidate,
): void {
  removeFrameFromSelectedRepresentativeFrames(candidate.frameIndex)

  const selectedFrame = buildSelectedRepresentativeFrame(label, candidate)

  if (label === "excluded") {
    selectedRepresentativeFrames.excluded = [
      ...selectedRepresentativeFrames.excluded,
      selectedFrame,
    ].sort((a, b) => a.frameIndex - b.frameIndex)
    return
  }

  selectedRepresentativeFrames[label] = selectedFrame
}

function clearSelectedRepresentativeFrame(
  label: ManualRepresentativeFrameLabel,
  frameIndex?: number,
): void {
  if (label === "excluded") {
    selectedRepresentativeFrames.excluded =
      selectedRepresentativeFrames.excluded.filter(
        (frame) => frame.frameIndex !== frameIndex,
      )
    return
  }

  selectedRepresentativeFrames[label] = null
}

function renderRepresentativeFrameCandidatesPanel(): string {
  const candidates = getRepresentativeFrameCandidates()
  const categories: Array<{
    key: RepresentativeFrameCandidateKey
    title: string
    candidates: RepresentativeFrameCandidate[]
  }> = [
    {
      key: "front",
      title: "正面候補",
      candidates: candidates.front,
    },
    {
      key: "yawPositive",
      title: "yaw 正方向候補",
      candidates: candidates.yawPositive,
    },
    {
      key: "yawNegative",
      title: "yaw 負方向候補",
      candidates: candidates.yawNegative,
    },
    {
      key: "pitchPositive",
      title: "pitch 正方向候補",
      candidates: candidates.pitchPositive,
    },
    {
      key: "pitchNegative",
      title: "pitch 負方向候補",
      candidates: candidates.pitchNegative,
    },
  ]

  return `
    <section class="representative-panel" aria-label="代表フレーム候補">
      <div class="panel-heading">
        <div>
          <h2>代表フレーム候補</h2>
          <p>詳細スキャン済みフレームの yaw / pitch / roll から候補を自動抽出します。</p>
        </div>
      </div>
      <p class="candidate-note">左右・上下の最終ラベルはユーザーが手動で確定します。Step 2-F では候補抽出用に動画全体を 0.1 秒間隔で詳細スキャンし、候補カテゴリごとに複数候補を保持します。3D推測、3D点群 preview、手動微調整、保存 / export はまだ行いません。</p>
      ${renderSelectedRepresentativeFramesPanel()}
      ${renderReadinessPanel()}
      ${renderInferenceDatasetPanel()}
      <div class="candidate-category-stack">
        ${categories
          .map((category) =>
            renderRepresentativeCandidateCategory(
              category.key,
              category.title,
              category.candidates,
            ),
          )
          .join("")}
      </div>
    </section>
  `
}

function renderRepresentativeCandidateCategory(
  key: RepresentativeFrameCandidateKey,
  title: string,
  candidates: RepresentativeFrameCandidate[],
): string {
  const isOpen = representativeCandidateCategoryOpenState[key]
  const toggleLabel = isOpen ? "閉じる" : "開く"
  const countText = `${candidates.length}件`

  if (candidates.length === 0) {
    return `
      <article class="candidate-card candidate-card-empty" data-candidate-category="${key}">
        <div class="candidate-category-toggle-row">
          <div>
            <h3>${escapeHtml(title)}（${countText}）</h3>
            <p>該当する解析済みフレームがありません。</p>
          </div>
          <button
            class="candidate-category-toggle-button"
            type="button"
            aria-expanded="${isOpen}"
            data-candidate-category-key="${key}"
          >
            ${toggleLabel}
          </button>
        </div>
      </article>
    `
  }

  return `
    <article class="candidate-card" data-candidate-category="${key}">
      <div class="candidate-category-toggle-row">
        <div>
          <h3>${escapeHtml(title)}（${countText}）</h3>
          <span>候補 ${candidates.length} 件</span>
        </div>
        <button
          class="candidate-category-toggle-button"
          type="button"
          aria-expanded="${isOpen}"
          data-candidate-category-key="${key}"
        >
          ${toggleLabel}
        </button>
      </div>
      ${
        isOpen
          ? `<div class="candidate-list">
              ${candidates.map((candidate) => renderRepresentativeCandidateItem(title, candidate)).join("")}
            </div>`
          : `<p class="candidate-collapsed-text">この候補カテゴリは閉じています。</p>`
      }
    </article>
  `
}

function renderRepresentativeCandidateItem(
  title: string,
  candidate: RepresentativeFrameCandidate,
): string {
  return `
    <div class="candidate-item">
      <img src="${escapeHtml(candidate.thumbnailUrl)}" alt="${escapeHtml(title)} Frame ${String(candidate.frameIndex).padStart(3, "0")}" />
      <div class="candidate-item-body">
        <strong>score: ${formatScore(candidate.score)}</strong>
        <span>frame index: ${candidate.frameIndex}</span>
        <span>timestamp: ${candidate.timestamp.toFixed(1)}s</span>
        <span>yaw: ${formatNumber(candidate.pose.yaw)} / pitch: ${formatNumber(candidate.pose.pitch)} / roll: ${formatNumber(candidate.pose.roll)}</span>
        <span>landmarks 数: ${candidate.landmarksCount}</span>
        <span>解析状態: ${formatFrameAnalysisStatus(candidate.status)}</span>
        <div class="candidate-action-group" aria-label="手動ラベル確定">
          <span>この候補を:</span>
          ${renderCandidateSelectionButton(candidate, "front")}
          ${renderCandidateSelectionButton(candidate, "left")}
          ${renderCandidateSelectionButton(candidate, "right")}
          ${renderCandidateSelectionButton(candidate, "up")}
          ${renderCandidateSelectionButton(candidate, "down")}
          ${renderCandidateSelectionButton(candidate, "excluded")}
        </div>
      </div>
    </div>
  `
}

function renderCandidateSelectionButton(
  candidate: RepresentativeFrameCandidate,
  label: ManualRepresentativeFrameLabel,
): string {
  const buttonLabel =
    label === "excluded"
      ? "除外"
      : `${formatManualRepresentativeFrameLabel(label)}にする`

  return `
    <button
      class="candidate-label-button"
      type="button"
      data-selection-label="${label}"
      data-candidate-key="${candidate.key}"
      data-frame-index="${candidate.frameIndex}"
    >
      ${buttonLabel}
    </button>
  `
}

function renderSelectedRepresentativeFramesPanel(): string {
  return `
    <div class="selected-representative-panel">
      <h3>確定済み代表フレーム</h3>
      <div class="selected-frame-grid">
        ${renderSingleSelectedRepresentativeFrame("front")}
        ${renderSingleSelectedRepresentativeFrame("left")}
        ${renderSingleSelectedRepresentativeFrame("right")}
        ${renderSingleSelectedRepresentativeFrame("up")}
        ${renderSingleSelectedRepresentativeFrame("down")}
      </div>
    </div>
  `
}

function renderSingleSelectedRepresentativeFrame(
  label: SelectableRepresentativeFrameLabel,
): string {
  const selectedFrame = selectedRepresentativeFrames[label]
  const labelText = formatManualRepresentativeFrameLabel(label)

  if (!selectedFrame) {
    return `
      <article class="selected-frame-card selected-frame-empty">
        <h4>${labelText}</h4>
        <p>未選択</p>
      </article>
    `
  }

  return renderSelectedRepresentativeFrameCard(selectedFrame, labelText)
}

function renderSelectedRepresentativeFrameCard(
  frame: SelectedRepresentativeFrame,
  title: string,
): string {
  return `
    <article class="selected-frame-card selected-frame-detail">
      <img src="${escapeHtml(frame.thumbnailUrl)}" alt="${escapeHtml(title)} Frame ${String(frame.frameIndex).padStart(3, "0")}" />
      <div>
        <h4>${escapeHtml(title)}</h4>
        <strong>Frame ${String(frame.frameIndex).padStart(3, "0")} / ${frame.timestamp.toFixed(1)}s</strong>
        <span>yaw: ${formatNumber(frame.pose.yaw)} / pitch: ${formatNumber(frame.pose.pitch)} / roll: ${formatNumber(frame.pose.roll)}</span>
        <span>score: ${formatScore(frame.score)}</span>
        <span>landmarks 数: ${frame.landmarksCount}</span>
        <button
          class="selected-clear-button"
          type="button"
          data-clear-label="${frame.label}"
          data-frame-index="${frame.frameIndex}"
        >
          解除
        </button>
      </div>
    </article>
  `
}

function renderReadinessPanel(): string {
  const dataset = getIdealLandmarks3DInferenceDataset()

  return `
    <div class="readiness-panel">
      <h3>3D推測用データセット</h3>
      <dl class="readiness-list">
        ${dataset.entries
          .map(
            (entry) => `
              <div>
                <dt>${formatManualRepresentativeFrameLabel(entry.label)}</dt>
                <dd>${formatInferenceDatasetEntryStatus(entry.status)}</dd>
              </div>
            `,
          )
          .join("")}
      </dl>
      <p class="dataset-ready-count">準備済み: ${dataset.readyCount} / ${dataset.requiredCount}</p>
      <p class="dataset-note">3D推測は未実装です。次のステップで、準備済みデータセットから idealLandmarks3D 478点候補を推測します。</p>
    </div>
  `
}

function renderInferenceDatasetPanel(): string {
  const dataset = getIdealLandmarks3DInferenceDataset()

  return `
    <div class="inference-dataset-panel">
      <h3>推測に使う代表フレーム</h3>
      <div class="dataset-entry-grid">
        ${dataset.entries.map(renderInferenceDatasetEntry).join("")}
      </div>
    </div>
  `
}

function renderInferenceDatasetEntry(
  entry: RepresentativeFrameDatasetEntry,
): string {
  const labelText = formatManualRepresentativeFrameLabel(entry.label)
  const frameIndexText =
    entry.frameIndex === null
      ? "なし"
      : String(entry.frameIndex).padStart(3, "0")
  const timestampText =
    entry.timestamp === null ? "なし" : `${entry.timestamp.toFixed(1)}s`
  const poseText = entry.pose
    ? `pitch: ${formatNumber(entry.pose.pitch)} / yaw: ${formatNumber(entry.pose.yaw)} / roll: ${formatNumber(entry.pose.roll)}`
    : "pose: なし"
  const thumbnailMarkup = entry.thumbnailUrl
    ? `<img src="${escapeHtml(entry.thumbnailUrl)}" alt="${escapeHtml(labelText)} Frame ${frameIndexText}" />`
    : `<div class="dataset-thumbnail-empty">未選択</div>`

  return `
    <article class="dataset-entry-card dataset-entry-${entry.status}">
      ${thumbnailMarkup}
      <div class="dataset-entry-body">
        <h4>${escapeHtml(labelText)}</h4>
        <strong>status: ${formatInferenceDatasetEntryStatus(entry.status)}</strong>
        <span>frame index: ${frameIndexText}</span>
        <span>timestamp: ${timestampText}</span>
        <span>${poseText}</span>
        <span>landmarks 数: ${entry.landmarksCount}</span>
        ${renderLandmarkPreview(entry.landmarkPreview)}
      </div>
    </article>
  `
}

function renderLandmarkPreview(
  landmarkPreview: RepresentativeFrameDatasetEntry["landmarkPreview"],
): string {
  if (landmarkPreview.length === 0) {
    return `<p class="landmark-preview-empty">landmark preview: なし</p>`
  }

  return `
    <div class="landmark-preview">
      <span>landmark preview</span>
      <ol>
        ${landmarkPreview
          .map(
            (landmark) => `
              <li>#${landmark.index}: x ${landmark.x} / y ${landmark.y} / z ${landmark.z}</li>
            `,
          )
          .join("")}
      </ol>
    </div>
  `
}

function renderAnalysisPanel(): string {
  const summary = getDetailedScanSummary()
  const displayFrameCount = videoSource?.extractedFrames.length ?? 0
  const hasVideo = Boolean(videoSource?.objectUrl && !videoSource.error)
  const isAnalyzing = videoSource?.isAnalyzing ?? false
  const isExtracting = videoSource?.isExtracting ?? false
  const disabled = !hasVideo || isAnalyzing || isExtracting
  const statusText = videoSource?.analysisError
    ? videoSource.analysisError
    : isAnalyzing
      ? "動画全体を詳細スキャン中です。"
      : isExtracting
        ? "表示用フレーム抽出後に詳細スキャンできます。"
      : hasVideo
        ? "動画全体を細かくスキャンし、代表フレーム候補を抽出できます。"
        : "MP4 動画の選択後に詳細スキャンできます。"

  return `
    <section class="analysis-panel" aria-label="フレーム解析">
      <div class="panel-heading">
        <div>
          <h2>詳細スキャン</h2>
          <p>表示用抽出とは別に、候補抽出用として動画全体を細かく解析します。</p>
        </div>
        <button id="analyze-frames-button" class="analysis-button" type="button" ${disabled ? "disabled" : ""}>
          詳細スキャンを実行
        </button>
      </div>
      <p class="status-text">${escapeHtml(statusText)}</p>
      <dl class="analysis-summary">
        <div>
          <dt>スキャン間隔</dt>
          <dd>${summary.scanIntervalSec.toFixed(3)}s</dd>
        </div>
        <div>
          <dt>最大スキャン数</dt>
          <dd>${summary.maxScanFrames}</dd>
        </div>
        <div>
          <dt>表示用抽出フレーム数</dt>
          <dd>${displayFrameCount}</dd>
        </div>
        <div>
          <dt>解析対象フレーム数</dt>
          <dd>${summary.scannedFrameCount}</dd>
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
          <dt>候補抽出対象</dt>
          <dd>${summary.candidateSourceFrameCount}</dd>
        </div>
        <div>
          <dt>候補カテゴリ</dt>
          <dd>${summary.candidateCategoryCount}</dd>
        </div>
        <div>
          <dt>front 候補</dt>
          <dd>${summary.candidateCounts.front}</dd>
        </div>
        <div>
          <dt>yawPositive 候補</dt>
          <dd>${summary.candidateCounts.yawPositive}</dd>
        </div>
        <div>
          <dt>yawNegative 候補</dt>
          <dd>${summary.candidateCounts.yawNegative}</dd>
        </div>
        <div>
          <dt>pitchPositive 候補</dt>
          <dd>${summary.candidateCounts.pitchPositive}</dd>
        </div>
        <div>
          <dt>pitchNegative 候補</dt>
          <dd>${summary.candidateCounts.pitchNegative}</dd>
        </div>
        <div>
          <dt>除外候補</dt>
          <dd>${summary.excludedCandidateCount}</dd>
        </div>
      </dl>
      <p class="candidate-note">候補以外の詳細スキャンフレームは表示しません。</p>
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

function renderDebugFrameListPanel(): string {
  return `
    <section class="frames-panel frames-panel-debug" aria-label="抽出フレーム一覧 debug">
      <div class="debug-panel-heading">
        <div>
          <h2>表示用抽出フレーム一覧（debug）</h2>
          <p>最大20件程度の表示確認用フレームです。詳細スキャン全件は表示しません。</p>
        </div>
        <button id="toggle-debug-frames-button" class="debug-toggle-button" type="button" aria-expanded="${isDebugFrameListOpen}">
          ${isDebugFrameListOpen ? "表示用フレームを隠す" : "表示用フレームを表示"}
        </button>
      </div>
      ${
        isDebugFrameListOpen
          ? renderFrameThumbnails()
          : `<p class="debug-collapsed-text">表示用抽出フレーム一覧は閉じています。候補以外の詳細スキャンフレームは表示しません。</p>`
      }
    </section>
  `
}

function buildAuthoringDebugPreview(): unknown {
  const analysisSummary = getAnalysisSummary()
  const scanSummary = getDetailedScanSummary()
  const representativeFrameCandidates = getRepresentativeFrameCandidates()
  const idealLandmarks3DInferenceDataset =
    getIdealLandmarks3DInferenceDataset()

  return {
    idealFace,
    scanSummary: {
      scanIntervalSec: scanSummary.scanIntervalSec,
      maxScanFrames: scanSummary.maxScanFrames,
      maxCandidatesPerCategory: scanSummary.maxCandidatesPerCategory,
      scannedFrameCount: scanSummary.scannedFrameCount,
      analyzedFrameCount: scanSummary.analyzedFrameCount,
      detectedFrameCount: scanSummary.detectedFrameCount,
      candidateSourceFrameCount: scanSummary.candidateSourceFrameCount,
      candidateCounts: scanSummary.candidateCounts,
      candidateCategoryCount: scanSummary.candidateCategoryCount,
      excludedCandidateCount: scanSummary.excludedCandidateCount,
    },
    representativeFrameCandidates: toRepresentativeCandidatesPreview(
      representativeFrameCandidates,
    ),
    selectedRepresentativeFrames: toSelectedRepresentativeFramesPreview(),
    idealLandmarks3DInferenceDataset: toInferenceDatasetPreview(
      idealLandmarks3DInferenceDataset,
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

function attachDebugFrameListHandler(): void {
  document
    .querySelector<HTMLButtonElement>("#toggle-debug-frames-button")
    ?.addEventListener("click", () => {
      isDebugFrameListOpen = !isDebugFrameListOpen
      render()
    })
}

function attachRepresentativeCandidateCategoryToggleHandler(): void {
  document
    .querySelectorAll<HTMLButtonElement>("[data-candidate-category-key]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset
          .candidateCategoryKey as RepresentativeFrameCandidateKey

        if (!key) {
          return
        }

        representativeCandidateCategoryOpenState = {
          ...representativeCandidateCategoryOpenState,
          [key]: !representativeCandidateCategoryOpenState[key],
        }
        render()
      })
    })
}

function attachRepresentativeFrameSelectionHandler(): void {
  document
    .querySelectorAll<HTMLButtonElement>("[data-selection-label]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const label = button.dataset
          .selectionLabel as ManualRepresentativeFrameLabel
        const candidateKey = button.dataset
          .candidateKey as RepresentativeFrameCandidateKey
        const frameIndex = Number(button.dataset.frameIndex)

        if (!label || !candidateKey || !Number.isFinite(frameIndex)) {
          return
        }

        const candidate = findRepresentativeCandidate(candidateKey, frameIndex)

        if (!candidate) {
          return
        }

        selectRepresentativeFrame(label, candidate)
        render()
      })
    })

  document
    .querySelectorAll<HTMLButtonElement>("[data-clear-label]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const label = button.dataset.clearLabel as ManualRepresentativeFrameLabel
        const frameIndex = Number(button.dataset.frameIndex)

        if (!label) {
          return
        }

        clearSelectedRepresentativeFrame(label, frameIndex)
        render()
      })
    })
}

async function analyzeExtractedFrames(): Promise<void> {
  if (!videoSource || !videoSource.objectUrl) {
    return
  }

  selectedRepresentativeFrames = createEmptySelectedRepresentativeFrames()
  representativeCandidateCategoryOpenState =
    createDefaultRepresentativeCandidateCategoryOpenState()
  updateVideoSource({
    isAnalyzing: true,
    analysisError: null,
    scanSummary: createEmptyDetailedScanSummary(),
    representativeFrameCandidates: createEmptyRepresentativeFrameCandidates(),
    representativeCandidateFrames: [],
  })
  render()

  try {
    const landmarker = await getFaceLandmarker()
    const scanResult = await scanVideoForRepresentativeCandidates(
      extractionVideo,
      landmarker,
    )

    updateVideoSource({
      scanSummary: scanResult.scanSummary,
      representativeFrameCandidates: scanResult.representativeFrameCandidates,
      representativeCandidateFrames: scanResult.representativeCandidateFrames,
    })
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

interface DetailedScanResult {
  scanSummary: DetailedScanSummary
  representativeFrameCandidates: RepresentativeFrameCandidates
  representativeCandidateFrames: ExtractedVideoFrame[]
}

async function scanVideoForRepresentativeCandidates(
  video: HTMLVideoElement,
  landmarker: FaceLandmarker,
): Promise<DetailedScanResult> {
  const scanPlan = getDetailedScanPlan(video.duration)
  const analysisContext = analysisCanvas.getContext("2d")
  const thumbnailContext = thumbnailCanvas.getContext("2d")

  if (
    !analysisContext ||
    !thumbnailContext ||
    video.videoWidth === 0 ||
    video.videoHeight === 0
  ) {
    throw new Error("詳細スキャン用フレームを canvas に描画できませんでした。")
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

  const scannedFrames: ExtractedVideoFrame[] = []
  let detectedFrameCount = 0

  for (const [index, timestamp] of scanPlan.timestamps.entries()) {
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

    const frame = analyzeScannedCanvasFrame(
      landmarker,
      index + 1,
      timestamp,
      startedAt,
    )
    scannedFrames.push(frame)

    if (frame.analysis?.detected) {
      detectedFrameCount += 1
    }

    updateVideoSource({
      scanSummary: {
        scanIntervalSec: scanPlan.intervalSec,
        maxScanFrames: MAX_DETAILED_SCAN_FRAME_COUNT,
        maxCandidatesPerCategory: MAX_CANDIDATES_PER_CATEGORY,
        scannedFrameCount: scanPlan.timestamps.length,
        analyzedFrameCount: scannedFrames.length,
        detectedFrameCount,
        candidateSourceFrameCount: getCandidateSourceFramesFromFrames(
          scannedFrames,
        ).length,
        candidateCounts: getCandidateCounts(
          createEmptyRepresentativeFrameCandidates(),
        ),
        candidateCategoryCount: 0,
        excludedCandidateCount: selectedRepresentativeFrames.excluded.length,
      },
    })
    render()
  }

  const candidateSourceFrames =
    getCandidateSourceFramesFromFrames(scannedFrames)
  const representativeFrameCandidates =
    buildRepresentativeFrameCandidatesFromFrames(candidateSourceFrames)
  const representativeCandidateFrames = pickRepresentativeCandidateFrames(
    candidateSourceFrames,
    representativeFrameCandidates,
  )
  const scanSummary: DetailedScanSummary = {
    scanIntervalSec: scanPlan.intervalSec,
    maxScanFrames: MAX_DETAILED_SCAN_FRAME_COUNT,
    maxCandidatesPerCategory: MAX_CANDIDATES_PER_CATEGORY,
    scannedFrameCount: scanPlan.timestamps.length,
    analyzedFrameCount: scannedFrames.length,
    detectedFrameCount,
    candidateSourceFrameCount: candidateSourceFrames.length,
    candidateCounts: getCandidateCounts(representativeFrameCandidates),
    candidateCategoryCount: getCandidateCategoryCount(
      representativeFrameCandidates,
    ),
    excludedCandidateCount: selectedRepresentativeFrames.excluded.length,
  }

  return {
    scanSummary,
    representativeFrameCandidates,
    representativeCandidateFrames,
  }
}

function analyzeScannedCanvasFrame(
  landmarker: FaceLandmarker,
  frameIndex: number,
  timestamp: number,
  startedAt: number,
): ExtractedVideoFrame {
  try {
    const result = landmarker.detect(analysisCanvas)
    const landmarks = (result.faceLandmarks[0] ?? []).map((landmark) => ({
      x: landmark.x,
      y: landmark.y,
      z: landmark.z,
    }))
    const detected = result.faceLandmarks.length > 0

    return {
      index: frameIndex,
      timestamp,
      status: detected ? "analyzed" : "no_face",
      thumbnailUrl: thumbnailCanvas.toDataURL("image/jpeg", 0.82),
      analysisImageUrl: analysisCanvas.toDataURL("image/jpeg", 0.9),
      extractionTimeMs: performance.now() - startedAt,
      analysis: {
        detected,
        landmarks,
        pose: detected
          ? estimateFacePose(landmarks, result.facialTransformationMatrixes[0])
          : { ...EMPTY_FACE_POSE },
        errorMessage: null,
        analyzedAt: Date.now(),
      },
    }
  } catch (error) {
    return {
      index: frameIndex,
      timestamp,
      status: "error",
      thumbnailUrl: thumbnailCanvas.toDataURL("image/jpeg", 0.82),
      analysisImageUrl: analysisCanvas.toDataURL("image/jpeg", 0.9),
      extractionTimeMs: performance.now() - startedAt,
      analysis: {
        detected: false,
        landmarks: [],
        pose: { ...EMPTY_FACE_POSE },
        errorMessage: error instanceof Error ? error.message : String(error),
        analyzedAt: Date.now(),
      },
    }
  }
}

function pickRepresentativeCandidateFrames(
  sourceFrames: ExtractedVideoFrame[],
  candidates: RepresentativeFrameCandidates,
): ExtractedVideoFrame[] {
  const candidateFrameIndexes = new Set(
    getAllRepresentativeCandidates(candidates).map(
      (candidate) => candidate.frameIndex,
    ),
  )

  return sourceFrames.filter((frame) => candidateFrameIndexes.has(frame.index))
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
  selectedRepresentativeFrames = createEmptySelectedRepresentativeFrames()
  representativeCandidateCategoryOpenState =
    createDefaultRepresentativeCandidateCategoryOpenState()

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
      scanSummary: createEmptyDetailedScanSummary(),
      representativeFrameCandidates: createEmptyRepresentativeFrameCandidates(),
      representativeCandidateFrames: [],
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
    scanSummary: createEmptyDetailedScanSummary(),
    representativeFrameCandidates: createEmptyRepresentativeFrameCandidates(),
    representativeCandidateFrames: [],
  })
  isDebugFrameListOpen = false
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

function getDetailedScanPlan(duration: number): {
  intervalSec: number
  timestamps: number[]
} {
  const safeDuration = Math.max(0, duration)
  const maxTimestamp = Math.max(0, safeDuration - 0.05)
  const estimatedFrameCount =
    Math.floor(maxTimestamp / DETAILED_SCAN_INTERVAL_SEC) + 1
  const frameCount = Math.min(
    MAX_DETAILED_SCAN_FRAME_COUNT,
    Math.max(1, estimatedFrameCount),
  )
  const intervalSec =
    frameCount <= 1
      ? DETAILED_SCAN_INTERVAL_SEC
      : Math.max(
          DETAILED_SCAN_INTERVAL_SEC,
          maxTimestamp / Math.max(1, frameCount - 1),
        )

  return {
    intervalSec: Number(intervalSec.toFixed(3)),
    timestamps: Array.from({ length: frameCount }, (_, index) =>
      Math.min(maxTimestamp, Number((index * intervalSec).toFixed(3))),
    ),
  }
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
        <span>Step 2-F</span>
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

      ${renderDebugFrameListPanel()}

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
  attachRepresentativeCandidateCategoryToggleHandler()
  attachRepresentativeFrameSelectionHandler()
  attachDebugFrameListHandler()
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
  .analysis-button,
  .debug-toggle-button,
  .candidate-category-toggle-button,
  .candidate-label-button,
  .selected-clear-button {
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

  .analysis-button,
  .debug-toggle-button,
  .candidate-category-toggle-button,
  .candidate-label-button,
  .selected-clear-button {
    font-family: inherit;
  }

  .analysis-button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .file-button:focus-visible,
  .analysis-button:focus-visible,
  .debug-toggle-button:focus-visible,
  .candidate-category-toggle-button:focus-visible,
  .candidate-label-button:focus-visible,
  .selected-clear-button:focus-visible {
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

  .selected-representative-panel,
  .readiness-panel,
  .inference-dataset-panel {
    margin-bottom: 14px;
  }

  .selected-frame-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 10px;
  }

  .selected-frame-card {
    min-width: 0;
    overflow: hidden;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
  }

  .selected-frame-empty {
    display: grid;
    min-height: 126px;
    align-content: start;
    gap: 8px;
    padding: 12px;
  }

  .selected-frame-detail {
    display: grid;
    grid-template-columns: 96px minmax(0, 1fr);
    gap: 10px;
    padding: 10px;
  }

  .selected-frame-detail img {
    display: block;
    width: 96px;
    aspect-ratio: 16 / 9;
    border-radius: 6px;
    object-fit: contain;
    background: #1f2824;
  }

  .selected-frame-detail div {
    display: grid;
    min-width: 0;
    gap: 4px;
    align-content: start;
  }

  .selected-frame-card h4,
  .selected-frame-card strong,
  .selected-frame-card span,
  .selected-frame-card p {
    min-width: 0;
    margin: 0;
    overflow-wrap: anywhere;
    line-height: 1.35;
  }

  .selected-frame-card h4 {
    color: #17201b;
    font-size: 13px;
  }

  .selected-frame-card strong,
  .selected-frame-card span,
  .selected-frame-card p {
    color: #5d675f;
    font-size: 12px;
    font-weight: 700;
  }

  .selected-clear-button {
    min-height: 30px;
    justify-self: start;
    margin-top: 3px;
    background: #5f6c66;
    padding: 5px 9px;
    font-size: 12px;
  }

  .readiness-list {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .dataset-ready-count,
  .dataset-note {
    margin: 8px 0 0;
    color: #25342e;
    font-size: 13px;
    font-weight: 800;
  }

  .dataset-note {
    color: #5d675f;
  }

  .dataset-entry-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 10px;
  }

  .dataset-entry-card {
    display: grid;
    grid-template-columns: 104px minmax(0, 1fr);
    gap: 10px;
    min-width: 0;
    overflow: hidden;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
    padding: 10px;
  }

  .dataset-entry-card img,
  .dataset-thumbnail-empty {
    display: block;
    width: 104px;
    aspect-ratio: 16 / 9;
    border-radius: 6px;
    object-fit: contain;
    background: #1f2824;
  }

  .dataset-thumbnail-empty {
    display: grid;
    place-items: center;
    color: #f2f7f4;
    font-size: 12px;
    font-weight: 800;
  }

  .dataset-entry-body {
    display: grid;
    min-width: 0;
    gap: 4px;
    align-content: start;
  }

  .dataset-entry-card h4,
  .dataset-entry-card strong,
  .dataset-entry-card span,
  .dataset-entry-card p,
  .dataset-entry-card li {
    min-width: 0;
    margin: 0;
    overflow-wrap: anywhere;
    line-height: 1.35;
  }

  .dataset-entry-card h4 {
    color: #17201b;
    font-size: 13px;
  }

  .dataset-entry-card strong,
  .dataset-entry-card span,
  .dataset-entry-card p,
  .dataset-entry-card li {
    color: #5d675f;
    font-size: 12px;
    font-weight: 700;
  }

  .dataset-entry-ready {
    border-color: #9fc8bd;
  }

  .dataset-entry-invalid {
    border-color: #d69a94;
  }

  .landmark-preview {
    display: grid;
    gap: 3px;
    padding-top: 2px;
  }

  .landmark-preview ol {
    display: grid;
    gap: 2px;
    margin: 0;
    padding-left: 18px;
  }

  .analysis-summary {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin-top: 12px;
  }

  .candidate-category-stack {
    display: grid;
    gap: 12px;
  }

  .candidate-card {
    min-width: 0;
    overflow: hidden;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
  }

  .candidate-category-toggle-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
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

  .candidate-category-toggle-button {
    min-height: 32px;
    padding: 6px 11px;
    font-size: 12px;
  }

  .candidate-collapsed-text {
    margin: 0;
    border-top: 1px solid #dde6e2;
    padding: 12px;
  }

  .candidate-list {
    display: grid;
    gap: 1px;
    background: #dde6e2;
  }

  .candidate-item {
    display: grid;
    grid-template-columns: 116px minmax(0, 1fr);
    gap: 10px;
    background: #ffffff;
    padding: 10px 12px;
  }

  .candidate-item img {
    display: block;
    width: 116px;
    aspect-ratio: 16 / 9;
    border-radius: 6px;
    object-fit: contain;
    background: #1f2824;
  }

  .candidate-item-body {
    display: grid;
    min-width: 0;
    gap: 4px;
    align-content: start;
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

  .candidate-action-group {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding-top: 6px;
  }

  .candidate-action-group > span {
    flex-basis: 100%;
  }

  .candidate-label-button {
    min-height: 30px;
    background: #edf4f1;
    color: #25342e;
    border: 1px solid #b7c7c2;
    padding: 5px 8px;
    font-size: 12px;
  }

  .frames-panel-debug {
    border-top: 1px solid #ccd8d3;
    padding-top: 16px;
  }

  .debug-panel-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
  }

  .debug-panel-heading p,
  .debug-collapsed-text {
    margin: 5px 0 0;
    color: #5d675f;
    font-size: 13px;
    font-weight: 700;
  }

  .debug-collapsed-text {
    margin: 0;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
    padding: 14px;
  }

  @media (max-width: 520px) {
    .candidate-item,
    .dataset-entry-card {
      grid-template-columns: 1fr;
    }

    .candidate-item img,
    .dataset-entry-card img,
    .dataset-thumbnail-empty {
      width: 100%;
    }
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
    object-fit: contain;
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

    .panel-heading,
    .debug-panel-heading {
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
