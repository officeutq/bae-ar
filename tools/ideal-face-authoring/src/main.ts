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
const INFERENCE_DATASET_LABELS: SelectableRepresentativeFrameLabel[] = [
  "front",
  "left",
  "right",
  "up",
  "down",
]
const INFERENCE_DATASET_LANDMARK_PREVIEW_COUNT = 5
const IDEAL_LANDMARKS_3D_PREVIEW_COUNT = 5
const POINT_CLOUD_PREVIEW_PADDING = 24
const POINT_CLOUD_DEPTH_DISPLAY_SCALE = 1.0
const POINT_CLOUD_MIN_ZOOM = 0.3
const POINT_CLOUD_MAX_ZOOM = 5
const POINT_CLOUD_ROTATION_SENSITIVITY = 0.01
const POINT_CLOUD_ZOOM_SENSITIVITY = 0.001
const POINT_CLOUD_MAX_PITCH = (Math.PI * 89) / 180
const POSE_AWARE_MIN_OBSERVATION_FRAME_COUNT = 5
const POSE_AWARE_MIN_YAW_OR_PITCH_RANGE = 10
const POSE_AWARE_YAW_COVERAGE_OK_RANGE = 15
const POSE_AWARE_PITCH_COVERAGE_OK_RANGE = 10
const POSE_AWARE_WEIGHT_POSE_STRENGTH_NORMALIZER = 20
const POSE_AWARE_WEIGHT_ROLL_PENALTY_DEG = 20
const POSE_AWARE_MIN_SCORE_WEIGHT = 0.2
const POSE_AWARE_ROLL_WARNING_ABS_DEG = 15
const MIXED_POSE_MIN_ABS_DEG = 8
const POSE_AWARE_DATASET_FRAME_PREVIEW_COUNT = 3
const POSE_AWARE_Z_MIN_COMPONENT_DEG = 5
const POSE_AWARE_Z_HINT_CLAMP = 0.35
const POSE_AWARE_LOW_CONFIDENCE_THRESHOLD = 0.45
const DEFAULT_POINT_CLOUD_CAMERA: PointCloudPreviewCamera = {
  yaw: 0,
  pitch: 0,
  zoom: 1,
  panX: 0,
  panY: 0,
}

type SelectableRepresentativeFrameLabel =
  | "front"
  | "left"
  | "right"
  | "up"
  | "down"

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

interface IdealLandmarks3DFrameSelection {
  frontReferenceFrameIds: string[]
  excludedFrameIds: string[]
}

type PoseAwareInferenceDatasetStatus =
  | "missing_front_reference"
  | "warning"
  | "ready"

type PoseAwareInferenceStatus = PoseAwareInferenceDatasetStatus

interface PoseAwareObservationFrame {
  frameId: string
  frameIndex: number
  timestamp: number
  landmarksCount: number
  pose: FacePose
  score: number | null
  thumbnailUrl: string
  role: "front_reference" | "observation"
  excluded: boolean
}

type PoseAwareCoverageStatus = "insufficient" | "ok"

interface PoseAwarePoseCoverageAxis {
  min: number | null
  max: number | null
  range: number
  status: PoseAwareCoverageStatus
}

interface PoseAwarePoseCoverageRollAxis {
  min: number | null
  max: number | null
  range: number
}

interface PoseAwarePoseCoverage {
  yaw: PoseAwarePoseCoverageAxis
  pitch: PoseAwarePoseCoverageAxis
  roll: PoseAwarePoseCoverageRollAxis
  mixedPoseFrameCount: number
}

interface PoseAwareInferenceFrame {
  frameId: string
  timestamp: number
  role: "front_reference" | "observation"
  pose: {
    yaw: number
    pitch: number
    roll: number
  }
  poseStrength: number
  weight: number
  score?: number
  landmarkCount: number
  landmarkPreview: LandmarkPreviewPoint[]
  landmarks: FaceLandmark[]
}

interface PoseAwareInferenceDataset {
  status: PoseAwareInferenceDatasetStatus
  frontReferenceFrames: PoseAwareInferenceFrame[]
  observationFrames: PoseAwareInferenceFrame[]
  excludedFrameCount: number
  poseCoverage: PoseAwarePoseCoverage
  warnings: string[]
}

interface PoseAwareBasePoint {
  index: number
  x: number
  y: number
}

interface PoseAwareCorrectedLandmark2D {
  index: number
  x: number
  y: number
}

interface PoseAwareZHint {
  value: number
  weight: number
  source: "yaw" | "pitch"
  frameId: string
}

interface PoseAwareMultiFrameSummary {
  status: PoseAwareInferenceStatus
  frontReferenceFrameCount: number
  selectedFrontReferenceFrameCount: number
  usableObservationFrameCount: number
  excludedFrameCount: number
  poseRange: {
    yaw: NumberRange | null
    pitch: NumberRange | null
    roll: NumberRange | null
  }
  warnings: string[]
  frontReferenceFrameIds: string[]
  excludedFrameIds: string[]
}

type IdealLandmarks3DCandidateStatus =
  | "not_ready"
  | "generated"
  | "insufficient_data"
  | "error"

type IdealLandmarks3DGenerationMethod =
  | "step_2_g_v1"
  | "pose_aware_weighted_z_v1"

type PointCloudPreviewPreset = "front" | "side" | "top" | "reset"

type PointCloudDragMode = "rotate" | "pan"

type PointCloudPreviewCamera = {
  yaw: number
  pitch: number
  zoom: number
  panX: number
  panY: number
}

interface PointCloudDragState {
  pointerId: number
  lastX: number
  lastY: number
  mode: PointCloudDragMode
}

interface PointCloudPreviewPoint {
  x: number
  y: number
  z: number
}

interface IdealLandmark3DCandidate {
  index: number
  x: number
  y: number
  z: number
  confidence: number
  source: "inferred_v1" | "pose_aware_weighted_z_v1"
}

interface IdealLandmarks3DCandidateResult {
  status: IdealLandmarks3DCandidateStatus
  generationMethod: IdealLandmarks3DGenerationMethod | null
  requiredLabels: SelectableRepresentativeFrameLabel[]
  readyLabels: SelectableRepresentativeFrameLabel[]
  missingLabels: SelectableRepresentativeFrameLabel[]
  landmarkCount: number
  landmarks: IdealLandmark3DCandidate[]
  landmarksPreview: IdealLandmark3DCandidate[]
  summary: {
    generatedCount: number
    averageConfidence: number
    minConfidence: number
    maxConfidence: number
    zMin: number
    zMax: number
    zAverage: number
    lowConfidenceLandmarkCount: number
    frontReferenceFrameCount: number
    observationFrameCount: number
    excludedFrameCount: number
  }
  message: string | null
}

interface NumberRange {
  min: number
  max: number
}

interface PointCloudPreviewSummary {
  landmarkCount: number
  xRange: NumberRange | null
  yRange: NumberRange | null
  zRange: NumberRange | null
  averageConfidence: number
  minConfidence: number
  maxConfidence: number
}

interface DetailedScanSummary {
  scanIntervalSec: number
  maxScanFrames: number
  scannedFrameCount: number
  analyzedFrameCount: number
  detectedFrameCount: number
  candidateSourceFrameCount: number
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
  detailedScanFrames: ExtractedVideoFrame[]
}

let videoSource: VideoSourceState | null = null
let faceLandmarker: FaceLandmarker | null = null
let faceLandmarkerInitialization: Promise<FaceLandmarker> | null = null
let isDebugFrameListOpen = false
let idealLandmarks3DFrameSelection: IdealLandmarks3DFrameSelection =
  createEmptyIdealLandmarks3DFrameSelection()
let idealLandmarks3DCandidateResult: IdealLandmarks3DCandidateResult =
  createInitialIdealLandmarks3DCandidateResult()
let pointCloudPreviewCamera: PointCloudPreviewCamera = {
  ...DEFAULT_POINT_CLOUD_CAMERA,
}
let pointCloudDragState: PointCloudDragState | null = null
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

function getDetailedScanSummary(): DetailedScanSummary {
  if (!videoSource) {
    return createEmptyDetailedScanSummary()
  }

  return videoSource.scanSummary
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

function createEmptyDetailedScanSummary(): DetailedScanSummary {
  return {
    scanIntervalSec: DETAILED_SCAN_INTERVAL_SEC,
    maxScanFrames: MAX_DETAILED_SCAN_FRAME_COUNT,
    scannedFrameCount: 0,
    analyzedFrameCount: 0,
    detectedFrameCount: 0,
    candidateSourceFrameCount: 0,
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

function createEmptyIdealLandmarks3DFrameSelection(): IdealLandmarks3DFrameSelection {
  return {
    frontReferenceFrameIds: [],
    excludedFrameIds: [],
  }
}

function buildLandmarkPreview(
  landmarks: FaceLandmark[],
): LandmarkPreviewPoint[] {
  return landmarks
    .slice(0, INFERENCE_DATASET_LANDMARK_PREVIEW_COUNT)
    .map((landmark, index) => ({
      index,
      x: Number(landmark.x.toFixed(4)),
      y: Number(landmark.y.toFixed(4)),
      z: Number(landmark.z.toFixed(4)),
    }))
}

function createInitialIdealLandmarks3DCandidateResult(): IdealLandmarks3DCandidateResult {
  return {
    status: "not_ready",
    generationMethod: null,
    requiredLabels: [...INFERENCE_DATASET_LABELS],
    readyLabels: [],
    missingLabels: [...INFERENCE_DATASET_LABELS],
    landmarkCount: 0,
    landmarks: [],
    landmarksPreview: [],
    summary: {
      generatedCount: 0,
      averageConfidence: 0,
      minConfidence: 0,
      maxConfidence: 0,
      zMin: 0,
      zMax: 0,
      zAverage: 0,
      lowConfidenceLandmarkCount: 0,
      frontReferenceFrameCount: 0,
      observationFrameCount: 0,
      excludedFrameCount: 0,
    },
    message: null,
  }
}

function resetIdealLandmarks3DCandidateResult(): void {
  idealLandmarks3DCandidateResult =
    createInitialIdealLandmarks3DCandidateResult()
  pointCloudPreviewCamera = createPointCloudPreviewCamera()
}

function getReadyDatasetLabels(
  dataset: IdealLandmarks3DInferenceDataset,
): SelectableRepresentativeFrameLabel[] {
  return dataset.entries
    .filter((entry) => entry.status === "ready")
    .map((entry) => entry.label)
}

function getMissingDatasetLabels(
  dataset: IdealLandmarks3DInferenceDataset,
): SelectableRepresentativeFrameLabel[] {
  return INFERENCE_DATASET_LABELS.filter(
    (label) =>
      !dataset.entries.some(
        (entry) => entry.label === label && entry.status === "ready",
      ),
  )
}

function getReadyDatasetEntry(
  dataset: IdealLandmarks3DInferenceDataset,
  label: SelectableRepresentativeFrameLabel,
): RepresentativeFrameDatasetEntry | null {
  return (
    dataset.entries.find(
      (entry) => entry.label === label && entry.status === "ready",
    ) ?? null
  )
}

function isFiniteLandmark(landmark: FaceLandmark | undefined): landmark is FaceLandmark {
  return (
    landmark !== undefined &&
    Number.isFinite(landmark.x) &&
    Number.isFinite(landmark.y) &&
    Number.isFinite(landmark.z)
  )
}

function averageNumbers(values: number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((sum, value) => sum + value, 0) / values.length
}

function inferCandidateZ(
  index: number,
  frontLandmark: FaceLandmark,
  entriesByLabel: Partial<
    Record<SelectableRepresentativeFrameLabel, RepresentativeFrameDatasetEntry>
  >,
): number {
  const leftLandmark = entriesByLabel.left?.landmarks[index]
  const rightLandmark = entriesByLabel.right?.landmarks[index]
  const upLandmark = entriesByLabel.up?.landmarks[index]
  const downLandmark = entriesByLabel.down?.landmarks[index]
  const yawDeltas: number[] = []
  const pitchDeltas: number[] = []

  if (isFiniteLandmark(leftLandmark)) {
    yawDeltas.push(frontLandmark.x - leftLandmark.x)
  }

  if (isFiniteLandmark(rightLandmark)) {
    yawDeltas.push(rightLandmark.x - frontLandmark.x)
  }

  if (isFiniteLandmark(upLandmark)) {
    pitchDeltas.push(frontLandmark.y - upLandmark.y)
  }

  if (isFiniteLandmark(downLandmark)) {
    pitchDeltas.push(downLandmark.y - frontLandmark.y)
  }

  const z =
    averageNumbers(yawDeltas) * 0.7 +
    averageNumbers(pitchDeltas) * 0.45 +
    frontLandmark.z * 0.1

  return Number(clamp(z, -0.25, 0.25).toFixed(4))
}

function inferCandidateConfidence(
  index: number,
  entriesByLabel: Partial<
    Record<SelectableRepresentativeFrameLabel, RepresentativeFrameDatasetEntry>
  >,
): number {
  const supportingLabels: SelectableRepresentativeFrameLabel[] = [
    "left",
    "right",
    "up",
    "down",
  ]
  const supportCount = supportingLabels.filter((label) =>
    isFiniteLandmark(entriesByLabel[label]?.landmarks[index]),
  ).length
  const hasYawPair =
    isFiniteLandmark(entriesByLabel.left?.landmarks[index]) &&
    isFiniteLandmark(entriesByLabel.right?.landmarks[index])
  const hasPitchPair =
    isFiniteLandmark(entriesByLabel.up?.landmarks[index]) &&
    isFiniteLandmark(entriesByLabel.down?.landmarks[index])
  const pairBonus = (hasYawPair ? 0.04 : 0) + (hasPitchPair ? 0.03 : 0)

  const confidence = clamp(0.38 + supportCount * 0.12 + pairBonus, 0.35, 0.9)

  return Number(confidence.toFixed(4))
}

function buildIdealLandmarks3DCandidateSummary(
  landmarks: IdealLandmark3DCandidate[],
  counts: {
    frontReferenceFrameCount: number
    observationFrameCount: number
    excludedFrameCount: number
  },
): IdealLandmarks3DCandidateResult["summary"] {
  const confidenceValues = landmarks.map((landmark) => landmark.confidence)
  const zValues = landmarks.map((landmark) => landmark.z)

  return {
    generatedCount: landmarks.length,
    averageConfidence: Number(averageNumbers(confidenceValues).toFixed(4)),
    minConfidence:
      confidenceValues.length === 0
        ? 0
        : Number(Math.min(...confidenceValues).toFixed(4)),
    maxConfidence:
      confidenceValues.length === 0
        ? 0
        : Number(Math.max(...confidenceValues).toFixed(4)),
    zMin:
      zValues.length === 0 ? 0 : Number(Math.min(...zValues).toFixed(4)),
    zMax:
      zValues.length === 0 ? 0 : Number(Math.max(...zValues).toFixed(4)),
    zAverage: Number(averageNumbers(zValues).toFixed(4)),
    lowConfidenceLandmarkCount: confidenceValues.filter(
      (confidence) => confidence < POSE_AWARE_LOW_CONFIDENCE_THRESHOLD,
    ).length,
    frontReferenceFrameCount: counts.frontReferenceFrameCount,
    observationFrameCount: counts.observationFrameCount,
    excludedFrameCount: counts.excludedFrameCount,
  }
}

function buildIdealLandmarks3DCandidateResult(
  dataset: IdealLandmarks3DInferenceDataset,
): IdealLandmarks3DCandidateResult {
  const readyLabels = getReadyDatasetLabels(dataset)
  const missingLabels = getMissingDatasetLabels(dataset)
  const frontEntry = getReadyDatasetEntry(dataset, "front")

  if (!frontEntry) {
    return {
      ...createInitialIdealLandmarks3DCandidateResult(),
      status: "insufficient_data",
      readyLabels,
      missingLabels,
      message:
        "正面フレームが未選択、または解析済み 478 landmarks を参照できないため、3D候補を生成できません。",
    }
  }

  const entriesByLabel = Object.fromEntries(
    dataset.entries
      .filter((entry) => entry.status === "ready")
      .map((entry) => [entry.label, entry]),
  ) as Partial<
    Record<SelectableRepresentativeFrameLabel, RepresentativeFrameDatasetEntry>
  >
  const landmarks = frontEntry.landmarks.map((frontLandmark, index) => {
    const confidence = inferCandidateConfidence(index, entriesByLabel)

    return {
      index,
      x: Number(frontLandmark.x.toFixed(4)),
      y: Number(frontLandmark.y.toFixed(4)),
      z: inferCandidateZ(index, frontLandmark, entriesByLabel),
      confidence,
      source: "inferred_v1" as const,
    }
  })
  return {
    status: "generated",
    generationMethod: "step_2_g_v1",
    requiredLabels: [...INFERENCE_DATASET_LABELS],
    readyLabels,
    missingLabels,
    landmarkCount: landmarks.length,
    landmarks,
    landmarksPreview: landmarks.slice(0, IDEAL_LANDMARKS_3D_PREVIEW_COUNT),
    summary: buildIdealLandmarks3DCandidateSummary(landmarks, {
      frontReferenceFrameCount: 1,
      observationFrameCount: readyLabels.filter((label) => label !== "front")
        .length,
      excludedFrameCount: 0,
    }),
    message:
      "front の 2D 478 landmarks を x / y の基準にし、左右 / 上下フレームとの差分から z を簡易推定した候補です。",
  }
}

function toCurrentCandidatePreview(
  result: IdealLandmarks3DCandidateResult,
): unknown {
  return {
    status: result.status,
    generationMethod: result.generationMethod,
    landmarkCount: result.landmarkCount,
    readyLabels: result.readyLabels,
    missingLabels: result.missingLabels,
    frontReferenceFrameCount: result.summary.frontReferenceFrameCount,
    observationFrameCount: result.summary.observationFrameCount,
    excludedFrameCount: result.summary.excludedFrameCount,
    z: {
      min: result.summary.zMin,
      max: result.summary.zMax,
      average: result.summary.zAverage,
    },
    confidence: {
      average: result.summary.averageConfidence,
      min: result.summary.minConfidence,
      max: result.summary.maxConfidence,
      lowConfidenceLandmarkCount:
        result.summary.lowConfidenceLandmarkCount,
    },
    preview: result.landmarksPreview,
  }
}

function getNumberRange(values: number[]): NumberRange | null {
  if (values.length === 0) {
    return null
  }

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  }
}

function formatNumberRange(range: NumberRange | null): string {
  return range
    ? `${formatNumber(range.min)} / ${formatNumber(range.max)}`
    : "なし"
}

function getPointCloudPreviewSummary(
  landmarks: IdealLandmark3DCandidate[],
): PointCloudPreviewSummary {
  const confidenceValues = landmarks.map((landmark) => landmark.confidence)

  return {
    landmarkCount: landmarks.length,
    xRange: getNumberRange(landmarks.map((landmark) => landmark.x)),
    yRange: getNumberRange(landmarks.map((landmark) => landmark.y)),
    zRange: getNumberRange(landmarks.map((landmark) => landmark.z)),
    averageConfidence: Number(averageNumbers(confidenceValues).toFixed(4)),
    minConfidence:
      confidenceValues.length === 0
        ? 0
        : Number(Math.min(...confidenceValues).toFixed(4)),
    maxConfidence:
      confidenceValues.length === 0
        ? 0
        : Number(Math.max(...confidenceValues).toFixed(4)),
  }
}

function createPointCloudPreviewCamera(
  overrides: Partial<PointCloudPreviewCamera> = {},
): PointCloudPreviewCamera {
  return {
    ...DEFAULT_POINT_CLOUD_CAMERA,
    ...overrides,
  }
}

function getPointCloudPreviewPresetCamera(
  preset: PointCloudPreviewPreset,
): PointCloudPreviewCamera {
  if (preset === "side") {
    return createPointCloudPreviewCamera({
      yaw: Math.PI / 2,
    })
  }

  if (preset === "top") {
    return createPointCloudPreviewCamera({
      pitch: -POINT_CLOUD_MAX_PITCH,
    })
  }

  return createPointCloudPreviewCamera()
}

function formatPointCloudPreviewPreset(preset: PointCloudPreviewPreset): string {
  const labels: Record<PointCloudPreviewPreset, string> = {
    front: "正面に戻す",
    side: "横から見る",
    top: "上から見る",
    reset: "リセット",
  }

  return labels[preset]
}

function formatPointCloudCamera(camera: PointCloudPreviewCamera): string {
  return `yaw ${formatNumber(camera.yaw * RAD_TO_DEG)}° / pitch ${formatNumber(
    camera.pitch * RAD_TO_DEG,
  )}° / zoom ${formatNumber(camera.zoom)}x`
}

function getPointCloudPreviewDataCenter(
  landmarks: IdealLandmark3DCandidate[],
): PointCloudPreviewPoint {
  if (landmarks.length === 0) {
    return {
      x: 0,
      y: 0,
      z: 0,
    }
  }

  return {
    x: averageNumbers(landmarks.map((landmark) => landmark.x)),
    y: averageNumbers(landmarks.map((landmark) => landmark.y)),
    z: averageNumbers(landmarks.map((landmark) => landmark.z)),
  }
}

function toPointCloudPreviewLocalPoint(
  point: IdealLandmark3DCandidate,
  center: PointCloudPreviewPoint,
): PointCloudPreviewPoint {
  return {
    x: point.x - center.x,
    y: -(point.y - center.y),
    z: (point.z - center.z) * POINT_CLOUD_DEPTH_DISPLAY_SCALE,
  }
}

function rotatePointForPointCloudPreview(
  point: PointCloudPreviewPoint,
  camera: PointCloudPreviewCamera,
): PointCloudPreviewPoint {
  const sourceX = point.x
  const sourceY = point.y
  const sourceZ = point.z
  const cosYaw = Math.cos(camera.yaw)
  const sinYaw = Math.sin(camera.yaw)
  const yawX = sourceX * cosYaw + sourceZ * sinYaw
  const yawZ = -sourceX * sinYaw + sourceZ * cosYaw
  const cosPitch = Math.cos(camera.pitch)
  const sinPitch = Math.sin(camera.pitch)

  return {
    x: yawX,
    y: sourceY * cosPitch - yawZ * sinPitch,
    z: sourceY * sinPitch + yawZ * cosPitch,
  }
}

function getRotatedPointCloudBounds(
  rotatedPoints: PointCloudPreviewPoint[],
): {
  centerX: number
  centerY: number
  scale: number
} {
  const xRange = getNumberRange(rotatedPoints.map((point) => point.x))
  const yRange = getNumberRange(rotatedPoints.map((point) => point.y))

  if (!xRange || !yRange) {
    return {
      centerX: 0,
      centerY: 0,
      scale: 1,
    }
  }

  const horizontalSpan = Math.max(xRange.max - xRange.min, 0.001)
  const verticalSpan = Math.max(yRange.max - yRange.min, 0.001)

  return {
    centerX: (xRange.min + xRange.max) / 2,
    centerY: (yRange.min + yRange.max) / 2,
    scale: 1 / Math.max(horizontalSpan, verticalSpan),
  }
}

function getConfidenceOpacity(confidence: number): string {
  return (0.22 + clamp(confidence, 0, 1) * 0.68).toFixed(3)
}

function getFrameId(frameIndex: number): string {
  return String(frameIndex)
}

function getFrameIdFromFrame(frame: ExtractedVideoFrame): string {
  return getFrameId(frame.index)
}

function addUniqueId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids : [...ids, id]
}

function removeId(ids: string[], id: string): string[] {
  return ids.filter((value) => value !== id)
}

function isFrameExcludedForPoseAware(frameIndex: number): boolean {
  return idealLandmarks3DFrameSelection.excludedFrameIds.includes(
    getFrameId(frameIndex),
  )
}

function isFrameFrontReferenceForPoseAware(frameIndex: number): boolean {
  return idealLandmarks3DFrameSelection.frontReferenceFrameIds.includes(
    getFrameId(frameIndex),
  )
}

function getDetailedScanFrames(): ExtractedVideoFrame[] {
  return videoSource?.detailedScanFrames ?? []
}

function findPoseAwareFrameById(frameId: string): ExtractedVideoFrame | null {
  const frameIndex = Number(frameId)

  if (!Number.isFinite(frameIndex)) {
    return null
  }

  return (
    getDetailedScanFrames().find((frame) => frame.index === frameIndex) ??
    videoSource?.extractedFrames.find((frame) => frame.index === frameIndex) ??
    null
  )
}

function isUsableObservationSourceFrame(frame: ExtractedVideoFrame): boolean {
  const analysis = frame.analysis

  return (
    frame.status === "analyzed" &&
    analysis?.detected === true &&
    analysis.landmarks.length === REQUIRED_LANDMARK_COUNT &&
    hasCompletePose(analysis.pose)
  )
}

function getPoseAwareCandidateScore(frameIndex: number): number | null {
  const frame = getDetailedScanFrames().find(
    (scanFrame) => scanFrame.index === frameIndex,
  )
  const pose = frame?.analysis?.pose

  if (!pose || !hasCompletePose(pose)) {
    return null
  }

  const scores = [
    scoreFrontCandidate(pose),
    scoreYawPositiveCandidate(pose),
    scoreYawNegativeCandidate(pose),
    scorePitchPositiveCandidate(pose),
    scorePitchNegativeCandidate(pose),
  ].filter((score): score is number => score !== null)

  if (scores.length === 0) {
    return null
  }

  return Number(Math.max(...scores).toFixed(4))
}

function buildPoseAwareObservationFrame(
  frame: ExtractedVideoFrame,
  role: PoseAwareObservationFrame["role"],
): PoseAwareObservationFrame | null {
  const analysis = frame.analysis

  if (!analysis || !hasCompletePose(analysis.pose)) {
    return null
  }

  return {
    frameId: getFrameIdFromFrame(frame),
    frameIndex: frame.index,
    timestamp: frame.timestamp,
    landmarksCount: analysis.landmarks.length,
    pose: analysis.pose,
    score: getPoseAwareCandidateScore(frame.index),
    thumbnailUrl: frame.thumbnailUrl,
    role,
    excluded: isFrameExcludedForPoseAware(frame.index),
  }
}

function getPoseAwareFrontReferenceFrames(): PoseAwareObservationFrame[] {
  return idealLandmarks3DFrameSelection.frontReferenceFrameIds
    .map((frameId) => {
      const frame = findPoseAwareFrameById(frameId)

      return frame
        ? buildPoseAwareObservationFrame(frame, "front_reference")
        : null
    })
    .filter(
      (frame): frame is PoseAwareObservationFrame =>
        frame !== null &&
        frame.landmarksCount === REQUIRED_LANDMARK_COUNT &&
        hasCompletePose(frame.pose),
    )
    .sort((a, b) => a.frameIndex - b.frameIndex)
}

function getActivePoseAwareFrontReferenceFrames(): PoseAwareObservationFrame[] {
  return getUsableObservationFrames()
    .filter((frame) => isFrameFrontReferenceForPoseAware(frame.frameIndex))
    .map((frame) => ({
      ...frame,
      role: "front_reference" as const,
    }))
    .sort((a, b) => a.frameIndex - b.frameIndex)
}

function getUsableObservationFrames(): PoseAwareObservationFrame[] {
  return getDetailedScanFrames()
    .filter(
      (frame) =>
        isUsableObservationSourceFrame(frame) &&
        !isFrameExcludedForPoseAware(frame.index),
    )
    .map((frame) => buildPoseAwareObservationFrame(frame, "observation"))
    .filter(
      (frame): frame is PoseAwareObservationFrame => frame !== null,
    )
}

function getVisibleUsableObservationFrames(): PoseAwareObservationFrame[] {
  return getUsableObservationFrames().filter(
    (frame) => !isFrameFrontReferenceForPoseAware(frame.frameIndex),
  )
}

function getPoseAwareExcludedFrames(): PoseAwareObservationFrame[] {
  return idealLandmarks3DFrameSelection.excludedFrameIds
    .map((frameId) => {
      const frame = findPoseAwareFrameById(frameId)

      return frame ? buildPoseAwareObservationFrame(frame, "observation") : null
    })
    .filter(
      (frame): frame is PoseAwareObservationFrame => frame !== null,
    )
    .sort((a, b) => a.frameIndex - b.frameIndex)
}

function getPoseRangeFromPoseAwareFrames(
  frames: PoseAwareObservationFrame[],
  key: keyof FacePose,
): NumberRange | null {
  return getNumberRange(frames.map((frame) => frame.pose[key]))
}

function calculatePoseAwarePoseStrength(pose: FacePose): number {
  return Number(
    Math.sqrt(pose.yaw * pose.yaw + pose.pitch * pose.pitch).toFixed(4),
  )
}

function calculatePoseAwareFrameWeight(
  pose: FacePose,
  score: number | null,
): number {
  const poseStrength = calculatePoseAwarePoseStrength(pose)
  const poseWeight = clamp(
    poseStrength / POSE_AWARE_WEIGHT_POSE_STRENGTH_NORMALIZER,
    0,
    1,
  )
  const rollPenalty = clamp(
    1 - Math.abs(pose.roll) / POSE_AWARE_WEIGHT_ROLL_PENALTY_DEG,
    0.2,
    1,
  )
  const scoreWeight =
    score !== null ? clamp(score, POSE_AWARE_MIN_SCORE_WEIGHT, 1) : 1

  return Number((poseWeight * rollPenalty * scoreWeight).toFixed(4))
}

function buildPoseAwareInferenceFrame(
  frame: ExtractedVideoFrame,
  role: PoseAwareInferenceFrame["role"],
): PoseAwareInferenceFrame | null {
  const analysis = frame.analysis

  if (!isUsableObservationSourceFrame(frame) || !analysis) {
    return null
  }

  const score = getPoseAwareCandidateScore(frame.index)

  return {
    frameId: getFrameIdFromFrame(frame),
    timestamp: frame.timestamp,
    role,
    pose: {
      yaw: analysis.pose.yaw,
      pitch: analysis.pose.pitch,
      roll: analysis.pose.roll,
    },
    poseStrength: calculatePoseAwarePoseStrength(analysis.pose),
    weight: calculatePoseAwareFrameWeight(analysis.pose, score),
    score: score ?? undefined,
    landmarkCount: analysis.landmarks.length,
    landmarkPreview: buildLandmarkPreview(analysis.landmarks),
    landmarks: analysis.landmarks,
  }
}

function getPoseAwareDatasetFrontReferenceFrames(): PoseAwareInferenceFrame[] {
  return idealLandmarks3DFrameSelection.frontReferenceFrameIds
    .map((frameId) => {
      if (idealLandmarks3DFrameSelection.excludedFrameIds.includes(frameId)) {
        return null
      }

      const frame = findPoseAwareFrameById(frameId)

      return frame
        ? buildPoseAwareInferenceFrame(frame, "front_reference")
        : null
    })
    .filter(
      (frame): frame is PoseAwareInferenceFrame =>
        frame !== null && frame.landmarkCount === REQUIRED_LANDMARK_COUNT,
    )
    .sort((a, b) => Number(a.frameId) - Number(b.frameId))
}

function getPoseAwareDatasetObservationFrames(): PoseAwareInferenceFrame[] {
  return getDetailedScanFrames()
    .filter(
      (frame) =>
        isUsableObservationSourceFrame(frame) &&
        !isFrameExcludedForPoseAware(frame.index) &&
        !isFrameFrontReferenceForPoseAware(frame.index),
    )
    .map((frame) => buildPoseAwareInferenceFrame(frame, "observation"))
    .filter(
      (frame): frame is PoseAwareInferenceFrame =>
        frame !== null && frame.landmarkCount === REQUIRED_LANDMARK_COUNT,
    )
}

function buildPoseAwareCoverageAxis(
  values: number[],
  okRange: number,
): PoseAwarePoseCoverageAxis {
  const range = getNumberRange(values)
  const width = range ? Number((range.max - range.min).toFixed(4)) : 0

  return {
    min: range ? Number(range.min.toFixed(4)) : null,
    max: range ? Number(range.max.toFixed(4)) : null,
    range: width,
    status: width >= okRange ? "ok" : "insufficient",
  }
}

function buildPoseAwareRollCoverageAxis(
  values: number[],
): PoseAwarePoseCoverageRollAxis {
  const range = getNumberRange(values)

  return {
    min: range ? Number(range.min.toFixed(4)) : null,
    max: range ? Number(range.max.toFixed(4)) : null,
    range: range ? Number((range.max - range.min).toFixed(4)) : 0,
  }
}

function buildPoseAwarePoseCoverage(
  observationFrames: PoseAwareInferenceFrame[],
): PoseAwarePoseCoverage {
  return {
    yaw: buildPoseAwareCoverageAxis(
      observationFrames.map((frame) => frame.pose.yaw),
      POSE_AWARE_YAW_COVERAGE_OK_RANGE,
    ),
    pitch: buildPoseAwareCoverageAxis(
      observationFrames.map((frame) => frame.pose.pitch),
      POSE_AWARE_PITCH_COVERAGE_OK_RANGE,
    ),
    roll: buildPoseAwareRollCoverageAxis(
      observationFrames.map((frame) => frame.pose.roll),
    ),
    mixedPoseFrameCount: observationFrames.filter(
      (frame) =>
        Math.abs(frame.pose.yaw) >= MIXED_POSE_MIN_ABS_DEG &&
        Math.abs(frame.pose.pitch) >= MIXED_POSE_MIN_ABS_DEG,
    ).length,
  }
}

function getPoseAwareInferenceDataset(): PoseAwareInferenceDataset {
  const frontReferenceFrames = getPoseAwareDatasetFrontReferenceFrames()
  const observationFrames = getPoseAwareDatasetObservationFrames()
  const poseCoverage = buildPoseAwarePoseCoverage(observationFrames)
  const warnings: string[] = []

  if (frontReferenceFrames.length === 0) {
    warnings.push("正面基準候補を1件以上選んでください。")
  }

  if (observationFrames.length < POSE_AWARE_MIN_OBSERVATION_FRAME_COUNT) {
    warnings.push(
      "推定に使うフレームが少ないため、3D候補が不安定になる可能性があります。",
    )
  }

  if (
    poseCoverage.yaw.status === "insufficient" &&
    poseCoverage.pitch.status === "insufficient"
  ) {
    warnings.push(
      "yaw / pitch の角度幅が不足しているため、奥行き推定の confidence が低くなる可能性があります。",
    )
  }

  if (
    observationFrames.some(
      (frame) => Math.abs(frame.pose.roll) >= POSE_AWARE_ROLL_WARNING_ABS_DEG,
    )
  ) {
    warnings.push(
      "roll が大きいフレームが含まれています。必要に応じて除外してください。",
    )
  }

  const status: PoseAwareInferenceDatasetStatus =
    frontReferenceFrames.length === 0
      ? "missing_front_reference"
      : observationFrames.length >= POSE_AWARE_MIN_OBSERVATION_FRAME_COUNT &&
          (poseCoverage.yaw.status === "ok" ||
            poseCoverage.pitch.status === "ok")
        ? "ready"
        : "warning"

  return {
    status,
    frontReferenceFrames,
    observationFrames,
    excludedFrameCount: idealLandmarks3DFrameSelection.excludedFrameIds.length,
    poseCoverage,
    warnings,
  }
}

function getPoseAwareMultiFrameSummary(): PoseAwareMultiFrameSummary {
  const frontReferenceFrames = getActivePoseAwareFrontReferenceFrames()
  const selectedFrontReferenceFrames = getPoseAwareFrontReferenceFrames()
  const visibleUsableObservationFrames = getVisibleUsableObservationFrames()
  const yawRange = getPoseRangeFromPoseAwareFrames(
    visibleUsableObservationFrames,
    "yaw",
  )
  const pitchRange = getPoseRangeFromPoseAwareFrames(
    visibleUsableObservationFrames,
    "pitch",
  )
  const rollRange = getPoseRangeFromPoseAwareFrames(
    visibleUsableObservationFrames,
    "roll",
  )
  const warnings: string[] = []

  if (frontReferenceFrames.length === 0) {
    warnings.push("正面基準候補を1件以上選んでください。")
  }

  if (
    visibleUsableObservationFrames.length < POSE_AWARE_MIN_OBSERVATION_FRAME_COUNT
  ) {
    warnings.push(
      "推定に使うフレームが少ないため、3D候補が不安定になる可能性があります。",
    )
  }

  const yawWidth = yawRange ? yawRange.max - yawRange.min : 0
  const pitchWidth = pitchRange ? pitchRange.max - pitchRange.min : 0

  if (
    yawWidth < POSE_AWARE_MIN_YAW_OR_PITCH_RANGE &&
    pitchWidth < POSE_AWARE_MIN_YAW_OR_PITCH_RANGE
  ) {
    warnings.push(
      "yaw / pitch の角度幅が不足しているため、奥行き推定の confidence が低くなる可能性があります。",
    )
  }

  const status: PoseAwareInferenceStatus =
    frontReferenceFrames.length === 0
      ? "missing_front_reference"
      : warnings.length > 0
        ? "warning"
        : "ready"

  return {
    status,
    frontReferenceFrameCount: frontReferenceFrames.length,
    selectedFrontReferenceFrameCount: selectedFrontReferenceFrames.length,
    usableObservationFrameCount: visibleUsableObservationFrames.length,
    excludedFrameCount: idealLandmarks3DFrameSelection.excludedFrameIds.length,
    poseRange: {
      yaw: yawRange,
      pitch: pitchRange,
      roll: rollRange,
    },
    warnings,
    frontReferenceFrameIds: [
      ...idealLandmarks3DFrameSelection.frontReferenceFrameIds,
    ],
    excludedFrameIds: [...idealLandmarks3DFrameSelection.excludedFrameIds],
  }
}

function toPoseAwareMultiFrameInferencePreview(): unknown {
  const summary = getPoseAwareMultiFrameSummary()

  return {
    status: summary.status,
    frontReferenceFrameCount: summary.frontReferenceFrameCount,
    usableObservationFrameCount: summary.usableObservationFrameCount,
    excludedFrameCount: summary.excludedFrameCount,
    poseRange: {
      yaw: summary.poseRange.yaw,
      pitch: summary.poseRange.pitch,
      roll: summary.poseRange.roll,
    },
    frontReferenceFrameIds: summary.frontReferenceFrameIds,
    excludedFrameIds: summary.excludedFrameIds,
    displayMode: "exclusiveGroups",
    warnings: summary.warnings,
  }
}

function toPoseAwareInferenceFramePreview(
  frame: PoseAwareInferenceFrame,
): unknown {
  return {
    frameId: frame.frameId,
    timestamp: Number(frame.timestamp.toFixed(3)),
    role: frame.role,
    pose: frame.pose,
    poseStrength: frame.poseStrength,
    weight: frame.weight,
    score: frame.score ?? null,
    landmarkCount: frame.landmarkCount,
    landmarkPreview: frame.landmarkPreview,
  }
}

function getPoseAwareDatasetWeightSummary(
  frames: PoseAwareInferenceFrame[],
): { average: number; min: number; max: number } {
  const weights = frames.map((frame) => frame.weight)

  if (weights.length === 0) {
    return {
      average: 0,
      min: 0,
      max: 0,
    }
  }

  return {
    average: Number(averageNumbers(weights).toFixed(4)),
    min: Number(Math.min(...weights).toFixed(4)),
    max: Number(Math.max(...weights).toFixed(4)),
  }
}

function toPoseAwareInferenceDatasetPreview(): unknown {
  const dataset = getPoseAwareInferenceDataset()

  return {
    status: dataset.status,
    frontReferenceFrameCount: dataset.frontReferenceFrames.length,
    observationFrameCount: dataset.observationFrames.length,
    excludedFrameCount: dataset.excludedFrameCount,
    poseCoverage: dataset.poseCoverage,
    weight: getPoseAwareDatasetWeightSummary(dataset.observationFrames),
    frontReferenceFramePreview: dataset.frontReferenceFrames
      .slice(0, POSE_AWARE_DATASET_FRAME_PREVIEW_COUNT)
      .map(toPoseAwareInferenceFramePreview),
    observationFramePreview: dataset.observationFrames
      .slice(0, POSE_AWARE_DATASET_FRAME_PREVIEW_COUNT)
      .map(toPoseAwareInferenceFramePreview),
    warnings: dataset.warnings,
  }
}

function degreesToRadians(degrees: number): number {
  return degrees / RAD_TO_DEG
}

function rotatePoint2D(
  point: { x: number; y: number },
  center: { x: number; y: number },
  angleRad: number,
): { x: number; y: number } {
  const dx = point.x - center.x
  const dy = point.y - center.y
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)

  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  }
}

function getFaceCenter2D(
  landmarks: FaceLandmark[],
): { x: number; y: number } | null {
  const finiteLandmarks = landmarks.filter(isFiniteLandmark)

  if (finiteLandmarks.length === 0) {
    return null
  }

  return {
    x: averageNumbers(finiteLandmarks.map((landmark) => landmark.x)),
    y: averageNumbers(finiteLandmarks.map((landmark) => landmark.y)),
  }
}

function getRollCorrectedLandmarks2D(
  frame: PoseAwareInferenceFrame,
): PoseAwareCorrectedLandmark2D[] | null {
  const center = getFaceCenter2D(frame.landmarks)

  if (!center || frame.landmarks.length !== REQUIRED_LANDMARK_COUNT) {
    return null
  }

  const rollCorrectionRad = degreesToRadians(-frame.pose.roll)

  return frame.landmarks.map((landmark, index) => {
    const rotated = rotatePoint2D(landmark, center, rollCorrectionRad)

    return {
      index,
      x: rotated.x,
      y: rotated.y,
    }
  })
}

function buildPoseAwareBasePoints(
  frontReferenceFrames: PoseAwareInferenceFrame[],
): PoseAwareBasePoint[] | null {
  const correctedFrames = frontReferenceFrames
    .map(getRollCorrectedLandmarks2D)
    .filter(
      (landmarks): landmarks is PoseAwareCorrectedLandmark2D[] =>
        landmarks !== null && landmarks.length === REQUIRED_LANDMARK_COUNT,
    )

  if (correctedFrames.length === 0) {
    return null
  }

  return Array.from({ length: REQUIRED_LANDMARK_COUNT }, (_, index) => {
    const points = correctedFrames
      .map((landmarks) => landmarks[index])
      .filter((point): point is PoseAwareCorrectedLandmark2D =>
        Boolean(point) &&
        Number.isFinite(point.x) &&
        Number.isFinite(point.y),
      )

    return {
      index,
      x: Number(averageNumbers(points.map((point) => point.x)).toFixed(4)),
      y: Number(averageNumbers(points.map((point) => point.y)).toFixed(4)),
    }
  })
}

function createPoseAwareZHint(
  value: number,
  weight: number,
  source: PoseAwareZHint["source"],
  frameId: string,
): PoseAwareZHint | null {
  if (!Number.isFinite(value) || !Number.isFinite(weight) || weight <= 0) {
    return null
  }

  return {
    value: clamp(value, -POSE_AWARE_Z_HINT_CLAMP, POSE_AWARE_Z_HINT_CLAMP),
    weight,
    source,
    frameId,
  }
}

function collectPoseAwareZHintsForFrame(
  frame: PoseAwareInferenceFrame,
  basePoints: PoseAwareBasePoint[],
): PoseAwareZHint[][] {
  const hintsByLandmark = Array.from(
    { length: REQUIRED_LANDMARK_COUNT },
    () => [] as PoseAwareZHint[],
  )
  const correctedLandmarks = getRollCorrectedLandmarks2D(frame)

  if (!correctedLandmarks) {
    return hintsByLandmark
  }

  const yawRad = degreesToRadians(frame.pose.yaw)
  const pitchRad = degreesToRadians(frame.pose.pitch)
  const yawSin = Math.sin(yawRad)
  const pitchSin = Math.sin(pitchRad)
  const useYaw = Math.abs(frame.pose.yaw) >= POSE_AWARE_Z_MIN_COMPONENT_DEG
  const usePitch =
    Math.abs(frame.pose.pitch) >= POSE_AWARE_Z_MIN_COMPONENT_DEG
  const yawWeight = frame.weight * Math.abs(yawSin)
  const pitchWeight = frame.weight * Math.abs(pitchSin)

  correctedLandmarks.forEach((landmark, index) => {
    const basePoint = basePoints[index]

    if (!basePoint) {
      return
    }

    const dx = landmark.x - basePoint.x
    const dy = landmark.y - basePoint.y

    if (useYaw && Math.abs(yawSin) > 0.0001) {
      const hint = createPoseAwareZHint(
        dx / yawSin,
        yawWeight,
        "yaw",
        frame.frameId,
      )

      if (hint) {
        hintsByLandmark[index].push(hint)
      }
    }

    if (usePitch && Math.abs(pitchSin) > 0.0001) {
      const hint = createPoseAwareZHint(
        -dy / pitchSin,
        pitchWeight,
        "pitch",
        frame.frameId,
      )

      if (hint) {
        hintsByLandmark[index].push(hint)
      }
    }
  })

  return hintsByLandmark
}

function mergePoseAwareZHints(
  observationFrames: PoseAwareInferenceFrame[],
  basePoints: PoseAwareBasePoint[],
): PoseAwareZHint[][] {
  const mergedHints = Array.from(
    { length: REQUIRED_LANDMARK_COUNT },
    () => [] as PoseAwareZHint[],
  )

  observationFrames.forEach((frame) => {
    const frameHints = collectPoseAwareZHintsForFrame(frame, basePoints)

    frameHints.forEach((hints, index) => {
      mergedHints[index].push(...hints)
    })
  })

  return mergedHints
}

function getWeightedAverageZ(hints: PoseAwareZHint[]): number {
  const weightTotal = hints.reduce((sum, hint) => sum + hint.weight, 0)

  if (weightTotal <= 0) {
    return 0
  }

  return (
    hints.reduce((sum, hint) => sum + hint.value * hint.weight, 0) /
    weightTotal
  )
}

function getWeightedZVariance(hints: PoseAwareZHint[], average: number): number {
  const weightTotal = hints.reduce((sum, hint) => sum + hint.weight, 0)

  if (weightTotal <= 0) {
    return 0
  }

  return (
    hints.reduce(
      (sum, hint) => sum + (hint.value - average) ** 2 * hint.weight,
      0,
    ) / weightTotal
  )
}

function inferPoseAwareLandmarkConfidence(
  hints: PoseAwareZHint[],
  dataset: PoseAwareInferenceDataset,
  inferredZ: number,
): number {
  if (hints.length === 0) {
    return 0.18
  }

  const totalWeight = hints.reduce((sum, hint) => sum + hint.weight, 0)
  const variance = getWeightedZVariance(hints, inferredZ)
  const supportScore = clamp(hints.length / 12, 0, 1)
  const weightScore = clamp(totalWeight / 1.2, 0, 1)
  const coverageScore =
    (dataset.poseCoverage.yaw.status === "ok" ? 0.5 : 0) +
    (dataset.poseCoverage.pitch.status === "ok" ? 0.5 : 0)
  const varianceScore = 1 - clamp(Math.sqrt(variance) / 0.12, 0, 1)
  const frontReferenceScore = clamp(
    dataset.frontReferenceFrames.length / 3,
    0,
    1,
  )
  const observationScore = clamp(dataset.observationFrames.length / 20, 0, 1)

  return Number(
    clamp(
      supportScore * 0.24 +
        weightScore * 0.22 +
        coverageScore * 0.18 +
        varianceScore * 0.2 +
        frontReferenceScore * 0.08 +
        observationScore * 0.08,
      0,
      1,
    ).toFixed(4),
  )
}

function centerPoseAwareZValues(
  landmarks: IdealLandmark3DCandidate[],
): IdealLandmark3DCandidate[] {
  const zAverage = averageNumbers(landmarks.map((landmark) => landmark.z))

  return landmarks.map((landmark) => ({
    ...landmark,
    z: Number(
      clamp(
        landmark.z - zAverage,
        -POSE_AWARE_Z_HINT_CLAMP,
        POSE_AWARE_Z_HINT_CLAMP,
      ).toFixed(4),
    ),
  }))
}

function buildPoseAwareIdealLandmarks3DCandidateResult(
  dataset: PoseAwareInferenceDataset,
): IdealLandmarks3DCandidateResult {
  if (dataset.status === "missing_front_reference") {
    return {
      ...createInitialIdealLandmarks3DCandidateResult(),
      status: "insufficient_data",
      generationMethod: "pose_aware_weighted_z_v1",
      message:
        "正面基準候補がないため、pose-aware 3D候補を生成できません。",
    }
  }

  const basePoints = buildPoseAwareBasePoints(dataset.frontReferenceFrames)

  if (!basePoints || basePoints.length !== REQUIRED_LANDMARK_COUNT) {
    return {
      ...createInitialIdealLandmarks3DCandidateResult(),
      status: "insufficient_data",
      generationMethod: "pose_aware_weighted_z_v1",
      message:
        "正面基準候補の 478 landmarks を参照できないため、pose-aware 3D候補を生成できません。",
    }
  }

  const hintsByLandmark = mergePoseAwareZHints(
    dataset.observationFrames,
    basePoints,
  )
  const uncenteredLandmarks = basePoints.map((basePoint, index) => {
    const hints = hintsByLandmark[index] ?? []
    const z = getWeightedAverageZ(hints)
    const confidence = inferPoseAwareLandmarkConfidence(hints, dataset, z)

    return {
      index,
      x: basePoint.x,
      y: basePoint.y,
      z: Number(z.toFixed(4)),
      confidence,
      source: "pose_aware_weighted_z_v1" as const,
    }
  })
  const landmarks = centerPoseAwareZValues(uncenteredLandmarks)

  return {
    status: "generated",
    generationMethod: "pose_aware_weighted_z_v1",
    requiredLabels: [],
    readyLabels: [],
    missingLabels: [],
    landmarkCount: landmarks.length,
    landmarks,
    landmarksPreview: landmarks.slice(0, IDEAL_LANDMARKS_3D_PREVIEW_COUNT),
    summary: buildIdealLandmarks3DCandidateSummary(landmarks, {
      frontReferenceFrameCount: dataset.frontReferenceFrames.length,
      observationFrameCount: dataset.observationFrames.length,
      excludedFrameCount: dataset.excludedFrameCount,
    }),
    message:
      "Step 2-I-B dataset から、roll 補正済み observation の yaw / pitch z hint を weighted average して生成した pose-aware 3D候補です。",
  }
}

function toPoseAwareCandidatePreview(): unknown {
  const result = idealLandmarks3DCandidateResult
  const isCurrentPoseAwareCandidate =
    result.generationMethod === "pose_aware_weighted_z_v1"

  if (!isCurrentPoseAwareCandidate) {
    return {
      status: "not_generated",
      generationMethod: "pose_aware_weighted_z_v1",
      sameAsCurrentCandidate: false,
    }
  }

  return {
    status: result.status,
    generationMethod: result.generationMethod,
    landmarkCount: result.landmarkCount,
    frontReferenceFrameCount: result.summary.frontReferenceFrameCount,
    observationFrameCount: result.summary.observationFrameCount,
    excludedFrameCount: result.summary.excludedFrameCount,
    sameAsCurrentCandidate: true,
  }
}

function formatPoseAwareStatus(status: PoseAwareInferenceStatus): string {
  const labels: Record<PoseAwareInferenceStatus, string> = {
    missing_front_reference: "missing_front_reference",
    warning: "warning",
    ready: "ready",
  }

  return labels[status]
}

function formatPoseAwareScore(score: number | null): string {
  return score === null ? "なし" : formatScore(score)
}

function renderPoseAwareMultiFramePanel(): string {
  const summary = getPoseAwareMultiFrameSummary()
  const dataset = getPoseAwareInferenceDataset()
  const frontReferenceFrames = getActivePoseAwareFrontReferenceFrames()
  const visibleUsableObservationFrames = getVisibleUsableObservationFrames()
  const excludedFrames = getPoseAwareExcludedFrames()

  return `
    <div class="pose-aware-panel" aria-label="Step 2-I pose-aware multi-frame inference 準備">
      <div class="pose-aware-heading">
        <div>
          <h3>Step 2-I: pose-aware multi-frame inference 準備</h3>
          <p>正面基準候補は自動では選択されません。推定に使うフレームの中から、正面に近く、ブレや表情崩れの少ないフレームを「正面基準に追加」してください。使いたくないフレームは「除外」してください。Step 2-I-C では、この dataset から pose-aware 3D候補を生成できます。</p>
        </div>
      </div>
      ${renderPoseAwareSummary(summary)}
      ${renderPoseAwareInferenceDatasetSummary(dataset)}
      ${renderPoseAwareIdealLandmarks3DCandidatePanel(dataset)}
      <div class="pose-aware-columns">
        ${renderPoseAwareFrameGroup(
          "正面基準候補",
          frontReferenceFrames,
          "正面基準候補は複数選択できます。除外されたものは使用対象から外れます。",
          "正面基準候補はまだ選択されていません。",
          "front_reference",
        )}
        ${renderPoseAwareFrameGroup(
          "推定に使うフレーム",
          visibleUsableObservationFrames,
          "除外されていない解析成功フレームです。全件から正面基準への追加や除外を操作できます。",
          "推定に使える解析成功フレームはまだありません。",
          "observation",
        )}
        ${renderPoseAwareFrameGroup(
          "除外フレーム",
          excludedFrames,
          "3D 推定に使わないフレームです。pose に関係なく除外できます。",
          "除外フレームはありません。",
          "excluded",
        )}
      </div>
    </div>
  `
}

function formatPoseAwareCoverageStatus(status: PoseAwareCoverageStatus): string {
  return status
}

function formatNullableDegree(value: number | null): string {
  return value === null ? "なし" : `${formatNumber(value)}°`
}

function renderPoseAwareCoverageAxis(
  label: string,
  axis: PoseAwarePoseCoverageAxis,
): string {
  return `
    <li>
      ${label} range: ${formatNullableDegree(axis.min)} 〜 ${formatNullableDegree(axis.max)} / range ${formatNumber(axis.range)}° / ${formatPoseAwareCoverageStatus(axis.status)}
    </li>
  `
}

function renderPoseAwareRollCoverageAxis(
  axis: PoseAwarePoseCoverageRollAxis,
): string {
  return `
    <li>
      roll range: ${formatNullableDegree(axis.min)} 〜 ${formatNullableDegree(axis.max)} / range ${formatNumber(axis.range)}°
    </li>
  `
}

function renderPoseAwareInferenceDatasetSummary(
  dataset: PoseAwareInferenceDataset,
): string {
  return `
    <div class="pose-aware-dataset-summary">
      <h4>Step 2-I-B: pose-aware dataset</h4>
      <dl class="pose-aware-summary-list">
        <div>
          <dt>状態</dt>
          <dd>${formatPoseAwareStatus(dataset.status)}</dd>
        </div>
        <div>
          <dt>正面基準 frames</dt>
          <dd>${dataset.frontReferenceFrames.length}件</dd>
        </div>
        <div>
          <dt>observation frames</dt>
          <dd>${dataset.observationFrames.length}件</dd>
        </div>
        <div>
          <dt>除外 frames</dt>
          <dd>${dataset.excludedFrameCount}件</dd>
        </div>
      </dl>
      <div class="pose-aware-coverage">
        <strong>pose coverage</strong>
        <ul>
          ${renderPoseAwareCoverageAxis("yaw", dataset.poseCoverage.yaw)}
          ${renderPoseAwareCoverageAxis("pitch", dataset.poseCoverage.pitch)}
          ${renderPoseAwareRollCoverageAxis(dataset.poseCoverage.roll)}
          <li>mixed pose frames: ${dataset.poseCoverage.mixedPoseFrameCount}件</li>
        </ul>
      </div>
      <div class="pose-aware-coverage">
        <strong>warnings</strong>
        ${
          dataset.warnings.length === 0
            ? `<p class="pose-aware-ready-text">なし</p>`
            : `<ul class="pose-aware-warning-list">
                ${dataset.warnings
                  .map((warning) => `<li>${escapeHtml(warning)}</li>`)
                  .join("")}
              </ul>`
        }
      </div>
      <p class="pose-aware-dataset-note">この dataset は Step 2-I-C の入力です。Step 2-G v1 の旧簡易推定は別方式として残しています。</p>
    </div>
  `
}

function renderPoseAwareIdealLandmarks3DCandidatePanel(
  dataset: PoseAwareInferenceDataset,
): string {
  const result = idealLandmarks3DCandidateResult
  const isPoseAwareCandidate =
    result.generationMethod === "pose_aware_weighted_z_v1"
  const disabled = dataset.status === "missing_front_reference"
  const disabledMessage =
    "正面基準候補がないため、pose-aware 3D候補を生成できません。"

  return `
    <div class="pose-aware-candidate-summary">
      <div class="pose-aware-candidate-heading">
        <div>
          <h4>Step 2-I-C: pose-aware 3D候補</h4>
          <p>Step 2-I-B dataset を使い、roll 補正後の yaw / pitch z hint から 478点候補を生成します。</p>
        </div>
        <button
          class="candidate-generate-button"
          type="button"
          data-generate-pose-aware-ideal-landmarks-3d-candidate="true"
          ${disabled ? "disabled" : ""}
        >
          pose-aware 3D候補を生成
        </button>
      </div>
      ${
        disabled
          ? `<p class="pose-aware-warning-text">${disabledMessage}</p>`
          : ""
      }
      ${
        isPoseAwareCandidate
          ? renderGeneratedPoseAwareCandidateSummary(result)
          : `<p class="pose-aware-dataset-note">pose-aware 3D候補はまだ生成されていません。<br />先に Step 2-I-B dataset を ready にし、生成を実行してください。</p>`
      }
    </div>
  `
}

function renderGeneratedPoseAwareCandidateSummary(
  result: IdealLandmarks3DCandidateResult,
): string {
  return `
    <dl class="pose-aware-summary-list">
      <div>
        <dt>状態</dt>
        <dd>${result.status}</dd>
      </div>
      <div>
        <dt>生成方式</dt>
          <dd>${result.generationMethod ?? "none"}</dd>
      </div>
      <div>
        <dt>landmarks</dt>
        <dd>${result.landmarkCount}</dd>
      </div>
      <div>
        <dt>front reference frames</dt>
        <dd>${result.summary.frontReferenceFrameCount}</dd>
      </div>
      <div>
        <dt>observation frames</dt>
        <dd>${result.summary.observationFrameCount}</dd>
      </div>
      <div>
        <dt>excluded frames</dt>
        <dd>${result.summary.excludedFrameCount}</dd>
      </div>
      <div>
        <dt>z range</dt>
        <dd>${formatNumber(result.summary.zMin)} 〜 ${formatNumber(result.summary.zMax)}</dd>
      </div>
      <div>
        <dt>average confidence</dt>
        <dd>${formatNumber(result.summary.averageConfidence)}</dd>
      </div>
      <div>
        <dt>min / max confidence</dt>
        <dd>${formatNumber(result.summary.minConfidence)} / ${formatNumber(result.summary.maxConfidence)}</dd>
      </div>
      <div>
        <dt>low confidence landmarks</dt>
        <dd>${result.summary.lowConfidenceLandmarkCount}</dd>
      </div>
    </dl>
    <p class="candidate-result-note">${escapeHtml(result.message ?? "")}</p>
    ${renderIdealLandmarks3DCandidatePreview(result.landmarksPreview)}
  `
}

function renderPoseAwareSummary(
  summary: PoseAwareMultiFrameSummary,
): string {
  return `
    <div class="pose-aware-summary">
      <dl class="pose-aware-summary-list">
        <div>
          <dt>正面基準候補</dt>
          <dd>${summary.frontReferenceFrameCount}件</dd>
        </div>
        <div>
          <dt>推定に使うフレーム</dt>
          <dd>${summary.usableObservationFrameCount}件</dd>
        </div>
        <div>
          <dt>除外フレーム</dt>
          <dd>${summary.excludedFrameCount}件</dd>
        </div>
        <div>
          <dt>yaw range</dt>
          <dd>${formatNumberRange(summary.poseRange.yaw)}</dd>
        </div>
        <div>
          <dt>pitch range</dt>
          <dd>${formatNumberRange(summary.poseRange.pitch)}</dd>
        </div>
        <div>
          <dt>roll range</dt>
          <dd>${formatNumberRange(summary.poseRange.roll)}</dd>
        </div>
        <div>
          <dt>状態</dt>
          <dd>${formatPoseAwareStatus(summary.status)}</dd>
        </div>
      </dl>
      ${
        summary.warnings.length > 0
          ? `<ul class="pose-aware-warning-list">
              ${summary.warnings
                .map((warning) => `<li>${escapeHtml(warning)}</li>`)
                .join("")}
            </ul>`
          : `<p class="pose-aware-ready-text">Step 2-I の UI / state 基盤は ready です。</p>`
      }
    </div>
  `
}

function renderPoseAwareFrameGroup(
  title: string,
  frames: PoseAwareObservationFrame[],
  note: string,
  emptyText: string,
  groupRole: "front_reference" | "observation" | "excluded",
): string {
  return `
    <article class="pose-aware-frame-group">
      <h4>${escapeHtml(title)}（${frames.length}件）</h4>
      <p>${escapeHtml(note)}</p>
      ${
        frames.length === 0
          ? `<p class="pose-aware-empty">${escapeHtml(emptyText)}</p>`
          : `<div class="pose-aware-frame-list">
              ${frames
                .map((frame) => renderPoseAwareFrameItem(frame, groupRole))
                .join("")}
            </div>`
      }
    </article>
  `
}

function renderPoseAwareFrameItem(
  frame: PoseAwareObservationFrame,
  groupRole: "front_reference" | "observation" | "excluded",
): string {
  return `
    <div class="pose-aware-frame-item${frame.excluded ? " pose-aware-frame-item-excluded" : ""}">
      <img src="${escapeHtml(frame.thumbnailUrl)}" alt="Frame ${String(frame.frameIndex).padStart(3, "0")} / ${frame.timestamp.toFixed(1)}s" />
      <div>
        <strong>Frame ${String(frame.frameIndex).padStart(3, "0")} / ${frame.timestamp.toFixed(1)}s</strong>
        <span>yaw: ${formatNumber(frame.pose.yaw)} / pitch: ${formatNumber(frame.pose.pitch)} / roll: ${formatNumber(frame.pose.roll)}</span>
        <span>score: ${formatPoseAwareScore(frame.score)}</span>
        <span>landmarks 数: ${frame.landmarksCount}</span>
        <span>role: ${frame.role}</span>
        ${isFrameFrontReferenceForPoseAware(frame.frameIndex) ? "<span>正面基準に追加済み</span>" : ""}
        ${frame.excluded ? "<span>Step 2-I 除外中</span>" : ""}
        ${renderPoseAwareFrameActions(frame, groupRole)}
      </div>
    </div>
  `
}

function renderPoseAwareFrameActions(
  frame: PoseAwareObservationFrame,
  groupRole: "front_reference" | "observation" | "excluded",
): string {
  if (groupRole === "excluded") {
    return `
      <div class="pose-aware-frame-actions">
        ${renderPoseAwareFrameActionButton(frame, "excluded_remove", "除外解除")}
      </div>
    `
  }

  if (groupRole === "front_reference") {
    return `
      <div class="pose-aware-frame-actions">
        ${renderPoseAwareFrameActionButton(
          frame,
          "front_reference_remove",
          "正面基準から外す",
        )}
        ${renderPoseAwareFrameActionButton(frame, "excluded_add", "除外")}
      </div>
    `
  }

  const frontReferenceAction = isFrameFrontReferenceForPoseAware(frame.frameIndex)
    ? renderPoseAwareFrameActionButton(
        frame,
        "front_reference_remove",
        "正面基準から外す",
      )
    : renderPoseAwareFrameActionButton(
        frame,
        "front_reference_add",
        "正面基準に追加",
      )

  return `
    <div class="pose-aware-frame-actions">
      ${frontReferenceAction}
      ${renderPoseAwareFrameActionButton(frame, "excluded_add", "除外")}
    </div>
  `
}

function renderPoseAwareFrameActionButton(
  frame: PoseAwareObservationFrame,
  action:
    | "front_reference_add"
    | "front_reference_remove"
    | "excluded_add"
    | "excluded_remove",
  label: string,
): string {
  return `
    <button
      class="candidate-label-button pose-aware-inline-action"
      type="button"
      data-pose-aware-action="${action}"
      data-frame-index="${frame.frameIndex}"
    >
      ${label}
    </button>
  `
}

function renderIdealLandmarks3DCandidatePreview(
  landmarksPreview: IdealLandmark3DCandidate[],
): string {
  if (landmarksPreview.length === 0) {
    return `<p class="landmark-preview-empty">3D landmark preview: なし</p>`
  }

  return `
    <div class="ideal-3d-preview">
      <span>先頭 ${landmarksPreview.length} 点 preview</span>
      <ol>
        ${landmarksPreview
          .map(
            (landmark) => `
              <li>#${landmark.index}: x ${landmark.x} / y ${landmark.y} / z ${landmark.z} / confidence ${landmark.confidence}</li>
            `,
          )
          .join("")}
      </ol>
    </div>
  `
}

function renderPointCloudPresetButton(
  preset: PointCloudPreviewPreset,
): string {
  const isActive = isPointCloudPresetActive(preset)

  return `
    <button
      class="point-cloud-preset-button${isActive ? " point-cloud-preset-button-active" : ""}"
      type="button"
      data-point-cloud-preset="${preset}"
      aria-pressed="${isActive ? "true" : "false"}"
    >
      ${formatPointCloudPreviewPreset(preset)}
    </button>
  `
}

function isPointCloudPresetActive(preset: PointCloudPreviewPreset): boolean {
  if (preset === "reset") {
    return false
  }

  const presetCamera = getPointCloudPreviewPresetCamera(preset)

  return (
    Math.abs(pointCloudPreviewCamera.yaw - presetCamera.yaw) < 0.0001 &&
    Math.abs(pointCloudPreviewCamera.pitch - presetCamera.pitch) < 0.0001 &&
    pointCloudPreviewCamera.zoom === 1 &&
    pointCloudPreviewCamera.panX === 0 &&
    pointCloudPreviewCamera.panY === 0
  )
}

function renderIdealLandmarks3DPointCloudPreviewPanel(): string {
  const result = idealLandmarks3DCandidateResult
  const hasGeneratedLandmarks =
    result.status === "generated" && result.landmarks.length > 0
  const summary = getPointCloudPreviewSummary(
    hasGeneratedLandmarks ? result.landmarks : [],
  )

  return `
    <section class="point-cloud-preview-panel" aria-label="3D点群 preview">
      <div class="panel-heading">
        <div>
          <h2>3D点群 preview</h2>
          <p>生成された idealLandmarks3D 候補を 1 つの viewport で確認します。</p>
        </div>
      </div>
      <div class="point-cloud-controls" aria-label="preview camera">
        <span>視点 preset:</span>
        ${renderPointCloudPresetButton("front")}
        ${renderPointCloudPresetButton("side")}
        ${renderPointCloudPresetButton("top")}
        ${renderPointCloudPresetButton("reset")}
      </div>
      <p class="point-cloud-preview-note">この preview は確認用表示です。マウス操作で視点を変更できますが、生成済み 3D 候補データ自体は変更していません。</p>
      ${
        hasGeneratedLandmarks
          ? renderIdealLandmarks3DPointCloudCanvas()
          : `<div class="point-cloud-empty">
              <p>3D 478点候補がまだ生成されていません。<br />先に「3D候補を生成」を実行してください。</p>
            </div>`
      }
      <dl class="point-cloud-summary-list">
        <div>
          <dt>landmark count</dt>
          <dd>${summary.landmarkCount}</dd>
        </div>
        <div>
          <dt>generation method</dt>
          <dd>${result.generationMethod ?? "none"}</dd>
        </div>
        <div>
          <dt>視点</dt>
          <dd data-point-cloud-camera-label>${formatPointCloudCamera(pointCloudPreviewCamera)}</dd>
        </div>
        <div>
          <dt>x min / max</dt>
          <dd>${formatNumberRange(summary.xRange)}</dd>
        </div>
        <div>
          <dt>y min / max</dt>
          <dd>${formatNumberRange(summary.yRange)}</dd>
        </div>
        <div>
          <dt>z min / max</dt>
          <dd>${formatNumberRange(summary.zRange)}</dd>
        </div>
        <div>
          <dt>average confidence</dt>
          <dd>${formatNumber(summary.averageConfidence)}</dd>
        </div>
        <div>
          <dt>min / max confidence</dt>
          <dd>${formatNumber(summary.minConfidence)} / ${formatNumber(summary.maxConfidence)}</dd>
        </div>
      </dl>
    </section>
  `
}

function renderIdealLandmarks3DPointCloudCanvas(): string {
  return `
    <canvas
      class="point-cloud-preview"
      data-point-cloud-canvas="true"
      aria-label="3D 478点候補 interactive preview"
    ></canvas>
  `
}

function updatePointCloudCameraLabel(): void {
  const label = document.querySelector<HTMLElement>(
    "[data-point-cloud-camera-label]",
  )

  if (label) {
    label.textContent = formatPointCloudCamera(pointCloudPreviewCamera)
  }

  document
    .querySelectorAll<HTMLButtonElement>("[data-point-cloud-preset]")
    .forEach((button) => {
      const preset = button.dataset.pointCloudPreset
      const isActive =
        isPointCloudPreviewPreset(preset) && isPointCloudPresetActive(preset)

      button.classList.toggle("point-cloud-preset-button-active", isActive)
      button.setAttribute("aria-pressed", isActive ? "true" : "false")
    })
}

function drawPointCloudPreviewCanvas(): void {
  const canvas = document.querySelector<HTMLCanvasElement>(
    "[data-point-cloud-canvas]",
  )
  const result = idealLandmarks3DCandidateResult

  if (
    !canvas ||
    result.status !== "generated" ||
    result.landmarks.length === 0
  ) {
    return
  }

  const context = canvas.getContext("2d")

  if (!context) {
    return
  }

  const rect = canvas.getBoundingClientRect()
  const width = Math.max(1, rect.width)
  const height = Math.max(1, rect.height)
  const devicePixelRatio = window.devicePixelRatio || 1

  canvas.width = Math.round(width * devicePixelRatio)
  canvas.height = Math.round(height * devicePixelRatio)
  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
  context.clearRect(0, 0, width, height)
  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, width, height)
  drawPointCloudPreviewGuide(context, width, height)

  const previewCenter = getPointCloudPreviewDataCenter(result.landmarks)
  const rotatedPoints = result.landmarks.map((landmark) =>
    rotatePointForPointCloudPreview(
      toPointCloudPreviewLocalPoint(landmark, previewCenter),
      pointCloudPreviewCamera,
    ),
  )
  const bounds = getRotatedPointCloudBounds(rotatedPoints)
  const drawableSize =
    Math.min(width, height) - POINT_CLOUD_PREVIEW_PADDING * 2
  const scale = drawableSize * bounds.scale * pointCloudPreviewCamera.zoom
  const centerX = width / 2 + pointCloudPreviewCamera.panX
  const centerY = height / 2 + pointCloudPreviewCamera.panY
  const pointsToDraw = result.landmarks
    .map((landmark, index) => {
      const rotated = rotatedPoints[index]

      return {
        landmark,
        depth: rotated.z,
        x: centerX + (rotated.x - bounds.centerX) * scale,
        y: centerY - (rotated.y - bounds.centerY) * scale,
      }
    })
    .sort((a, b) => a.depth - b.depth)

  for (const point of pointsToDraw) {
    context.beginPath()
    context.arc(point.x, point.y, 2.3, 0, Math.PI * 2)
    context.fillStyle = `rgba(217, 79, 69, ${getConfidenceOpacity(
      point.landmark.confidence,
    )})`
    context.fill()
  }

  updatePointCloudCameraLabel()
}

function drawPointCloudPreviewGuide(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const centerX = width / 2 + pointCloudPreviewCamera.panX
  const centerY = height / 2 + pointCloudPreviewCamera.panY

  context.strokeStyle = "#d9e4df"
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(POINT_CLOUD_PREVIEW_PADDING, centerY)
  context.lineTo(width - POINT_CLOUD_PREVIEW_PADDING, centerY)
  context.moveTo(centerX, POINT_CLOUD_PREVIEW_PADDING)
  context.lineTo(centerX, height - POINT_CLOUD_PREVIEW_PADDING)
  context.stroke()

  context.fillStyle = "#5d675f"
  context.font = "700 12px system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
  context.fillText(
    `z preview x${POINT_CLOUD_DEPTH_DISPLAY_SCALE.toFixed(1)}`,
    POINT_CLOUD_PREVIEW_PADDING,
    height - POINT_CLOUD_PREVIEW_PADDING,
  )
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
      </dl>
      <p class="candidate-note">詳細スキャン済みの有効フレームは Step 2-I の正面基準候補 / 推定に使うフレーム / 除外フレームとして扱います。</p>
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

function toScanSummaryPreview(scanSummary: DetailedScanSummary): unknown {
  return {
    scanIntervalSec: scanSummary.scanIntervalSec,
    maxScanFrames: scanSummary.maxScanFrames,
    scannedFrameCount: scanSummary.scannedFrameCount,
    analyzedFrameCount: scanSummary.analyzedFrameCount,
    detectedFrameCount: scanSummary.detectedFrameCount,
    candidateSourceFrameCount: scanSummary.candidateSourceFrameCount,
  }
}

function toActiveSummaryPreview(
  poseAwareFrameSelection: PoseAwareMultiFrameSummary,
  poseAwareDataset: PoseAwareInferenceDataset,
  currentCandidate: IdealLandmarks3DCandidateResult,
): unknown {
  return {
    activeWorkflow: "step_2_i_pose_aware",
    currentCandidateGenerationMethod: currentCandidate.generationMethod,
    hasDetailedScanFrames: getDetailedScanFrames().length > 0,
    hasPoseAwareDataset:
      poseAwareDataset.frontReferenceFrames.length > 0 ||
      poseAwareDataset.observationFrames.length > 0,
    hasGeneratedCandidate: currentCandidate.status === "generated",
    currentCandidateLandmarkCount: currentCandidate.landmarkCount,
    poseAwareStatus: poseAwareDataset.status,
    frontReferenceFrameCount:
      poseAwareFrameSelection.frontReferenceFrameCount,
    usableObservationFrameCount:
      poseAwareFrameSelection.usableObservationFrameCount,
    excludedFrameCount: poseAwareFrameSelection.excludedFrameCount,
  }
}

function toNaturalV1ReferencePreview(): unknown {
  return {
    metadata: {
      id: idealFace.metadata.id,
      name: idealFace.metadata.name,
      version: idealFace.metadata.version,
    },
    model: {
      coordinateSpace: idealFace.model.coordinateSpace,
      controlPointCount: idealFace.model.controlPoints.length,
      role: "reference_projection_debug",
      note:
        "6 controlPoints are reference data. The IdealFace body is idealLandmarks3D 478 points.",
      controlPoints: idealFace.model.controlPoints.map((point) => ({
        id: point.id,
        semantic: point.semantic ?? null,
        x: point.x,
        y: point.y,
        z: point.z,
      })),
    },
  }
}

function toVideoSourceDebugPreview(
  analysisSummary: AnalysisSummary,
): unknown {
  if (!videoSource) {
    return null
  }

  return {
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
}

function buildAuthoringDebugPreview(): unknown {
  const analysisSummary = getAnalysisSummary()
  const scanSummary = getDetailedScanSummary()
  const poseAwareFrameSelection = getPoseAwareMultiFrameSummary()
  const poseAwareDataset = getPoseAwareInferenceDataset()
  const currentCandidate = idealLandmarks3DCandidateResult

  return {
    activeSummary: toActiveSummaryPreview(
      poseAwareFrameSelection,
      poseAwareDataset,
      currentCandidate,
    ),
    poseAware: {
      frameSelection: toPoseAwareMultiFrameInferencePreview(),
      inferenceDataset: toPoseAwareInferenceDatasetPreview(),
      candidate: toPoseAwareCandidatePreview(),
    },
    currentCandidate: toCurrentCandidatePreview(currentCandidate),
    reference: {
      naturalV1: toNaturalV1ReferencePreview(),
    },
    debug: {
      videoSource: toVideoSourceDebugPreview(analysisSummary),
      scanSummary: toScanSummaryPreview(scanSummary),
    },
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

function attachPoseAwareFrameSelectionHandler(): void {
  document
    .querySelectorAll<HTMLButtonElement>("[data-pose-aware-action]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.poseAwareAction
        const frameIndex = Number(button.dataset.frameIndex)

        if (!Number.isFinite(frameIndex)) {
          return
        }

        if (action === "front_reference_add") {
          addPoseAwareFrontReferenceFrame(frameIndex)
          render()
          return
        }

        if (action === "front_reference_remove") {
          removePoseAwareFrontReferenceFrame(frameIndex)
          render()
          return
        }

        if (action === "excluded_add") {
          excludePoseAwareFrame(frameIndex)
          render()
          return
        }

        if (action === "excluded_remove") {
          removePoseAwareExcludedFrame(frameIndex)
          render()
        }
      })
    })
}

function attachIdealLandmarks3DCandidateHandler(): void {
  document
    .querySelector<HTMLButtonElement>(
      "[data-generate-pose-aware-ideal-landmarks-3d-candidate]",
    )
    ?.addEventListener("click", () => {
      const dataset = getPoseAwareInferenceDataset()

      idealLandmarks3DCandidateResult =
        buildPoseAwareIdealLandmarks3DCandidateResult(dataset)
      pointCloudPreviewCamera = createPointCloudPreviewCamera()
      render()
    })

  document
    .querySelectorAll<HTMLButtonElement>("[data-point-cloud-preset]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const preset = button.dataset.pointCloudPreset

        if (!isPointCloudPreviewPreset(preset)) {
          return
        }

        pointCloudPreviewCamera = getPointCloudPreviewPresetCamera(preset)
        render()
      })
    })

  attachPointCloudCanvasInteractionHandler()
  drawPointCloudPreviewCanvas()
}

function attachPointCloudCanvasInteractionHandler(): void {
  const canvas = document.querySelector<HTMLCanvasElement>(
    "[data-point-cloud-canvas]",
  )

  if (!canvas) {
    return
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return
    }

    pointCloudDragState = {
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
      mode: event.shiftKey ? "pan" : "rotate",
    }
    canvas.setPointerCapture(event.pointerId)
  })

  canvas.addEventListener("pointermove", (event) => {
    if (!pointCloudDragState || pointCloudDragState.pointerId !== event.pointerId) {
      return
    }

    const dx = event.clientX - pointCloudDragState.lastX
    const dy = event.clientY - pointCloudDragState.lastY

    pointCloudDragState = {
      ...pointCloudDragState,
      lastX: event.clientX,
      lastY: event.clientY,
    }

    if (pointCloudDragState.mode === "pan") {
      pointCloudPreviewCamera = {
        ...pointCloudPreviewCamera,
        panX: pointCloudPreviewCamera.panX + dx,
        panY: pointCloudPreviewCamera.panY + dy,
      }
    } else {
      pointCloudPreviewCamera = {
        ...pointCloudPreviewCamera,
        yaw: pointCloudPreviewCamera.yaw + dx * POINT_CLOUD_ROTATION_SENSITIVITY,
        pitch: clamp(
          pointCloudPreviewCamera.pitch + dy * POINT_CLOUD_ROTATION_SENSITIVITY,
          -POINT_CLOUD_MAX_PITCH,
          POINT_CLOUD_MAX_PITCH,
        ),
      }
    }

    drawPointCloudPreviewCanvas()
  })

  canvas.addEventListener("pointerup", (event) => {
    if (pointCloudDragState?.pointerId === event.pointerId) {
      pointCloudDragState = null
      canvas.releasePointerCapture(event.pointerId)
    }
  })

  canvas.addEventListener("pointercancel", () => {
    pointCloudDragState = null
  })

  canvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault()
      pointCloudPreviewCamera = {
        ...pointCloudPreviewCamera,
        zoom: clamp(
          pointCloudPreviewCamera.zoom *
            Math.exp(-event.deltaY * POINT_CLOUD_ZOOM_SENSITIVITY),
          POINT_CLOUD_MIN_ZOOM,
          POINT_CLOUD_MAX_ZOOM,
        ),
      }
      drawPointCloudPreviewCanvas()
    },
    { passive: false },
  )

  canvas.addEventListener("dblclick", () => {
    pointCloudPreviewCamera = createPointCloudPreviewCamera()
    drawPointCloudPreviewCanvas()
  })
}

function isPointCloudPreviewPreset(
  value: string | undefined,
): value is PointCloudPreviewPreset {
  return (
    value === "front" ||
    value === "side" ||
    value === "top" ||
    value === "reset"
  )
}

async function analyzeExtractedFrames(): Promise<void> {
  if (!videoSource || !videoSource.objectUrl) {
    return
  }

  idealLandmarks3DFrameSelection = createEmptyIdealLandmarks3DFrameSelection()
  resetIdealLandmarks3DCandidateResult()
  updateVideoSource({
    isAnalyzing: true,
    analysisError: null,
    scanSummary: createEmptyDetailedScanSummary(),
    detailedScanFrames: [],
  })
  render()

  try {
    const landmarker = await getFaceLandmarker()
    const scanResult = await scanVideoForPoseAwareFrames(
      extractionVideo,
      landmarker,
    )

    updateVideoSource({
      scanSummary: scanResult.scanSummary,
      detailedScanFrames: scanResult.detailedScanFrames,
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
  detailedScanFrames: ExtractedVideoFrame[]
}

async function scanVideoForPoseAwareFrames(
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
      detailedScanFrames: [...scannedFrames],
      scanSummary: {
        scanIntervalSec: scanPlan.intervalSec,
        maxScanFrames: MAX_DETAILED_SCAN_FRAME_COUNT,
        scannedFrameCount: scanPlan.timestamps.length,
        analyzedFrameCount: scannedFrames.length,
        detectedFrameCount,
        candidateSourceFrameCount: getCandidateSourceFramesFromFrames(
          scannedFrames,
        ).length,
      },
    })
    render()
  }

  const candidateSourceFrames =
    getCandidateSourceFramesFromFrames(scannedFrames)
  const scanSummary: DetailedScanSummary = {
    scanIntervalSec: scanPlan.intervalSec,
    maxScanFrames: MAX_DETAILED_SCAN_FRAME_COUNT,
    scannedFrameCount: scanPlan.timestamps.length,
    analyzedFrameCount: scannedFrames.length,
    detectedFrameCount,
    candidateSourceFrameCount: candidateSourceFrames.length,
  }

  return {
    scanSummary,
    detailedScanFrames: scannedFrames,
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
  idealLandmarks3DFrameSelection = createEmptyIdealLandmarks3DFrameSelection()
  resetIdealLandmarks3DCandidateResult()

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
      detailedScanFrames: [],
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
    detailedScanFrames: [],
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
        <span>Step 2-I-C</span>
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

      ${renderPoseAwareMultiFramePanel()}

      ${renderIdealLandmarks3DPointCloudPreviewPanel()}

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
  attachPoseAwareFrameSelectionHandler()
  attachIdealLandmarks3DCandidateHandler()
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
  .selected-clear-button,
  .candidate-generate-button,
  .point-cloud-preset-button {
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
  .selected-clear-button,
  .candidate-generate-button {
    font-family: inherit;
  }

  .point-cloud-preset-button {
    font-family: inherit;
  }

  .analysis-button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .candidate-generate-button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .file-button:focus-visible,
  .analysis-button:focus-visible,
  .debug-toggle-button:focus-visible,
  .candidate-category-toggle-button:focus-visible,
  .candidate-label-button:focus-visible,
  .selected-clear-button:focus-visible,
  .candidate-generate-button:focus-visible,
  .point-cloud-preset-button:focus-visible {
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
  .pose-aware-panel,
  .readiness-panel,
  .inference-dataset-panel {
    margin-bottom: 14px;
  }

  .pose-aware-panel {
    display: grid;
    gap: 12px;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
    padding: 14px;
  }

  .pose-aware-heading p,
  .pose-aware-frame-group p,
  .pose-aware-dataset-note,
  .pose-aware-ready-text,
  .pose-aware-empty {
    margin: 4px 0 0;
    color: #5d675f;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.45;
  }

  .pose-aware-summary {
    display: grid;
    gap: 8px;
  }

  .pose-aware-summary-list {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .pose-aware-dataset-summary {
    display: grid;
    gap: 10px;
    border: 1px solid #dce6e1;
    border-radius: 8px;
    background: #fbfdfc;
    padding: 12px;
  }

  .pose-aware-dataset-summary h4,
  .pose-aware-coverage strong {
    margin: 0;
    color: #17201b;
    font-size: 14px;
    line-height: 1.25;
  }

  .pose-aware-coverage {
    display: grid;
    gap: 6px;
  }

  .pose-aware-coverage ul {
    display: grid;
    gap: 4px;
    margin: 0;
    padding-left: 18px;
    color: #5d675f;
    font-size: 13px;
    font-weight: 800;
    line-height: 1.45;
  }

  .pose-aware-warning-list {
    display: grid;
    gap: 4px;
    margin: 0;
    border: 1px solid #d8b46d;
    border-radius: 8px;
    background: #fff8e8;
    padding: 10px 12px 10px 28px;
    color: #654c14;
    font-size: 13px;
    font-weight: 800;
  }

  .pose-aware-ready-text {
    border: 1px solid #9fc8bd;
    border-radius: 8px;
    background: #edf8f4;
    padding: 10px 12px;
    color: #27594c;
  }

  .pose-aware-columns {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .pose-aware-frame-group {
    min-width: 0;
    border: 1px solid #dde6e2;
    border-radius: 8px;
    background: #fbfdfc;
    padding: 12px;
  }

  .pose-aware-frame-group h4 {
    margin: 0;
    color: #17201b;
    font-size: 14px;
    line-height: 1.25;
  }

  .pose-aware-frame-list {
    display: grid;
    gap: 8px;
    margin-top: 10px;
  }

  .pose-aware-frame-item {
    display: grid;
    grid-template-columns: 84px minmax(0, 1fr);
    gap: 8px;
    border: 1px solid #dde6e2;
    border-radius: 7px;
    background: #ffffff;
    padding: 8px;
  }

  .pose-aware-frame-item-excluded {
    border-color: #d69a94;
    background: #fff7f6;
  }

  .pose-aware-frame-item img {
    display: block;
    width: 84px;
    aspect-ratio: 16 / 9;
    border-radius: 5px;
    object-fit: contain;
    background: #1f2824;
  }

  .pose-aware-frame-item div {
    display: grid;
    min-width: 0;
    gap: 3px;
    align-content: start;
  }

  .pose-aware-frame-item strong,
  .pose-aware-frame-item span {
    min-width: 0;
    overflow-wrap: anywhere;
    line-height: 1.35;
  }

  .pose-aware-frame-item strong {
    color: #25342e;
    font-size: 12px;
  }

  .pose-aware-frame-item span {
    color: #5d675f;
    font-size: 11px;
    font-weight: 700;
  }

  .pose-aware-frame-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 4px;
  }

  .pose-aware-inline-action {
    min-height: 28px;
    justify-self: start;
    margin-top: 3px;
    padding: 4px 8px;
    font-size: 11px;
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

  .ideal-3d-candidate-panel {
    display: grid;
    gap: 10px;
    margin-bottom: 16px;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
    padding: 14px;
  }

  .ideal-3d-candidate-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .ideal-3d-candidate-heading p,
  .candidate-result-note {
    margin: 5px 0 0;
    color: #5d675f;
    font-size: 13px;
    font-weight: 700;
  }

  .candidate-summary-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .ideal-3d-preview {
    display: grid;
    gap: 4px;
    color: #5d675f;
    font-size: 12px;
    font-weight: 700;
  }

  .ideal-3d-preview ol {
    display: grid;
    gap: 3px;
    margin: 0;
    padding-left: 18px;
  }

  .point-cloud-preview-panel {
    display: grid;
    gap: 12px;
    margin-bottom: 16px;
  }

  .point-cloud-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    color: #25342e;
    font-size: 13px;
    font-weight: 800;
  }

  .point-cloud-preview-note {
    margin: 0;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #edf4f1;
    padding: 10px 12px;
    color: #5d675f;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.5;
  }

  .point-cloud-preset-button {
    min-height: 34px;
    border: 1px solid #b7c7c2;
    background: #edf4f1;
    color: #25342e;
    padding: 6px 11px;
    font-size: 13px;
  }

  .point-cloud-preset-button-active {
    border-color: #27594c;
    background: #27594c;
    color: #ffffff;
  }

  .point-cloud-preview,
  .point-cloud-empty {
    width: 100%;
    border: 1px solid #ccd8d3;
    border-radius: 8px;
    background: #ffffff;
  }

  .point-cloud-preview {
    display: block;
    height: min(56vw, 520px);
    min-height: 280px;
    cursor: grab;
    touch-action: none;
  }

  .point-cloud-empty {
    display: grid;
    min-height: 220px;
    place-items: center;
    padding: 18px;
    color: #5d675f;
    text-align: center;
    font-size: 14px;
    font-weight: 700;
  }

  .point-cloud-empty p {
    margin: 0;
    line-height: 1.6;
  }

  .point-cloud-summary-list {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
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
    .dataset-entry-card,
    .pose-aware-frame-item {
      grid-template-columns: 1fr;
    }

    .candidate-item img,
    .dataset-entry-card img,
    .pose-aware-frame-item img,
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
    .debug-panel-heading,
    .ideal-3d-candidate-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .candidate-summary-list {
      grid-template-columns: 1fr;
    }

    .pose-aware-columns {
      grid-template-columns: 1fr;
    }
  }
`

document.head.append(style)
window.addEventListener("beforeunload", () => {
  faceLandmarker?.close()
})
render()
