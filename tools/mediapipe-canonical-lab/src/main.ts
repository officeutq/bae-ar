import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision"
import type { Matrix, NormalizedLandmark } from "@mediapipe/tasks-vision"
import "./style.css"

type CaptureBucket =
  | "front"
  | "yawPositiveSmall"
  | "yawPositiveMid"
  | "yawPositiveStrong"
  | "yawNegativeSmall"
  | "yawNegativeMid"
  | "yawNegativeStrong"
  | "pitchPositive"
  | "pitchNegative"
  | "mixedPose"
  | "unknown"

type StabilityBucket =
  | "front"
  | "yawPositive"
  | "yawNegative"
  | "pitchPositive"
  | "pitchNegative"
  | "mixedPose"
  | "unknown"

type TransformName =
  | "normalized_xyz_direct"
  | "image_centered_same_unit"
  | "face_bounds_centered"
  | "no_inverse_canonicalized_baseline"

interface Point3 {
  x: number
  y: number
  z: number
}

interface LandmarkPoint extends Point3 {
  index: number
}

interface Pose {
  yaw: number
  pitch: number
  roll: number
}

interface BlendshapeCapture {
  categoryName: string
  score: number
}

interface MatrixCapture {
  rows: number
  columns: number
  values: number[]
  metadata: {
    source: "MediaPipe FaceLandmarker facialTransformationMatrixes[0].data"
    ordering: "row-major"
    indexFormula: "values[row * columns + column]"
    maps: "MediaPipe canonical face to detected face"
  }
}

interface FrameSnapshot {
  detected: boolean
  timestamp: number
  videoTime: number
  videoWidth: number
  videoHeight: number
  landmarks: NormalizedLandmark[]
  facialTransformationMatrix: Matrix | null
  blendshapes: BlendshapeCapture[]
  pose: Pose | null
}

interface CaptureRecord {
  captureId: string
  capturedAt: string
  videoTime: number
  videoWidth: number
  videoHeight: number
  pose: Pose | null
  landmarks: LandmarkPoint[]
  facialTransformationMatrix: MatrixCapture | null
  blendshapes: BlendshapeCapture[]
  bucket: CaptureBucket
  notes: string[]
  warnings: string[]
  previewDataUrl: string | null
}

interface CapturesPayload {
  schemaVersion: "mediapipe_canonical_lab_captures_v1"
  createdAt: string
  tool?: {
    name: string
    version: string
  }
  source?: {
    detector: string
    landmarkCount: number
  }
  summary?: {
    captureCount: number
    bucketCounts: Record<string, number>
  }
  captures: CaptureRecord[]
}

interface BoundsSummary {
  xMin: number
  xMax: number
  width: number
  yMin: number
  yMax: number
  height: number
  zMin: number
  zMax: number
  zRange: number
  aspectRatio: number | null
}

interface SemanticPoints {
  noseTip: Point3 | null
  eyeCenter: Point3 | null
  mouthCenter: Point3 | null
  chin: Point3 | null
  leftCheek: Point3 | null
  rightCheek: Point3 | null
  leftContour: Point3 | null
  rightContour: Point3 | null
}

interface SemanticSummary {
  points: SemanticPoints
  z: {
    noseTipZ: number | null
    eyeCenterZ: number | null
    mouthCenterZ: number | null
    chinZ: number | null
    cheekDepthDelta: number | null
    contourDepthDelta: number | null
  }
}

interface CaptureRawAnalysis {
  captureId: string
  bucket: CaptureBucket
  landmarkCount: number
  bounds: BoundsSummary | null
  centroid: Point3 | null
  boundsCenter: Point3 | null
  semanticSummary: SemanticSummary
}

interface MatrixAnalysis {
  captureId: string
  available: boolean
  assumption: {
    ordering: "row-major"
    indexFormula: "values[row * columns + column]"
    vectorConvention: "column-vector point, pDetected = M * pCanonical"
    maps: "MediaPipe canonical face to detected face"
  }
  rawValues: number[] | null
  translation: Point3 | null
  approximateScale: number | null
  rotationBasis: {
    xAxis: Point3
    yAxis: Point3
    zAxis: Point3
  } | null
  determinant: number | null
  extractedPose: Pose | null
  capturePose: Pose | null
  poseDelta: Pose | null
  inverseAvailable: boolean
  warnings: string[]
}

interface SourceCaptureSummary {
  captureCount: number
  bucketCounts: Record<CaptureBucket, number>
  landmarkCount: {
    expected: number
    min: number | null
    max: number | null
    allExpected: boolean
  }
  matrixAvailableCount: number
  videoSizeSummary: {
    uniqueSizes: string[]
    minWidth: number | null
    maxWidth: number | null
    minHeight: number | null
    maxHeight: number | null
  }
  poseRange: {
    yaw: RangeSummary
    pitch: RangeSummary
    roll: RangeSummary
  }
}

interface RangeSummary {
  min: number | null
  max: number | null
}

interface CandidateDefinition {
  transformName: TransformName
  description: string
  assumptions: string[]
  usesInverseMatrix: boolean
}

interface PerCaptureCandidateSummary {
  captureId: string
  bucket: CaptureBucket
  pointCount: number
  canonicalLikeBounds: BoundsSummary | null
  centroid: Point3 | null
  warnings: string[]
}

interface PerLandmarkStability {
  index: number
  mean: Point3
  stdDevX: number
  stdDevY: number
  stdDevZ: number
  stdDev3D: number
  sampleCount: number
}

interface PointStability {
  mean: Point3 | null
  stdDevX: number | null
  stdDevY: number | null
  stdDevZ: number | null
  stdDev3D: number | null
  sampleCount: number
}

interface CandidateStability {
  perLandmarkMean: PerLandmarkStability[]
  averageStdDevX: number | null
  averageStdDevY: number | null
  averageStdDevZ: number | null
  averageStdDev3D: number | null
  maxStdDevLandmark: PerLandmarkStability | null
  semanticPointStability: {
    noseTip: PointStability
    eyeCenter: PointStability
    mouthCenter: PointStability
    chin: PointStability
    cheek: PointStability
  }
  bucketStability: Record<StabilityBucket, BucketStability>
}

interface BucketStability {
  sampleCount: number
  averageStdDev3D: number | null
}

interface TransformCandidateAnalysis {
  transformName: TransformName
  description: string
  assumptions: string[]
  perCaptureCanonicalLikeBounds: PerCaptureCandidateSummary[]
  averagedCanonicalLikeBounds: BoundsSummary | null
  frameToFrameStability: CandidateStability
  warnings: string[]
}

interface StabilityRankingEntry {
  transformName: TransformName
  averageStdDev3D: number | null
  averageStdDevX: number | null
  averageStdDevY: number | null
  averageStdDevZ: number | null
  noseStdDev3D: number | null
  zRangeStability: number | null
  sampleCount: number
}

interface EmpiricalCanonicalLandmark extends LandmarkPoint {
  stdDevX: number
  stdDevY: number
  stdDevZ: number
  sampleCount: number
}

interface EmpiricalCanonical478 {
  debugArtifact: true
  sourceTransformCandidate: TransformName
  landmarks: EmpiricalCanonicalLandmark[]
  summary: {
    bounds: BoundsSummary | null
    centroid: Point3 | null
    boundsCenter: Point3 | null
    zRange: number | null
    semanticSummary: SemanticSummary
  }
}

interface AnalysisResult {
  schemaVersion: "mediapipe_canonical_lab_analysis_v1"
  generatedAt: string
  sourceCaptureSummary: SourceCaptureSummary
  rawCaptureSummaries: CaptureRawAnalysis[]
  matrixSummaries: MatrixAnalysis[]
  transformCandidates: TransformCandidateAnalysis[]
  stabilityRanking: StabilityRankingEntry[]
  bestStabilityTransformCandidate: TransformName | null
  empiricalCanonical478: EmpiricalCanonical478 | null
  warnings: string[]
}

interface AppState {
  cameraStatus: "idle" | "starting" | "running" | "error"
  detectorStatus: "idle" | "initializing" | "ready" | "error"
  detectorError: string | null
  cameraError: string | null
  detectCount: number
  lastSkippedReason: string | null
  clipboardMessage: string | null
  importMessage: string | null
  analysisMessage: string | null
  latestFrame: FrameSnapshot | null
  captures: CaptureRecord[]
  importedCaptures: CaptureRecord[]
  importedFileName: string | null
  analysis: AnalysisResult | null
  loopStartedAt: number | null
}

const EXPECTED_LANDMARK_COUNT = 478
const RAD_TO_DEG = 180 / Math.PI
const EPSILON = 1e-9

const NOSE_TIP_INDEX = 4
const MOUTH_CENTER_INDICES = [13, 14]
const CHIN_INDEX = 152
const LEFT_CHEEK_INDEX = 234
const RIGHT_CHEEK_INDEX = 454
const LEFT_CONTOUR_INDEX = 127
const RIGHT_CONTOUR_INDEX = 356
const LEFT_IRIS_INDICES = [474, 475, 476, 477]
const RIGHT_IRIS_INDICES = [469, 470, 471, 472]
const LEFT_EYE_INDICES = [263, 362]
const RIGHT_EYE_INDICES = [33, 133]

const BUCKETS: CaptureBucket[] = [
  "front",
  "yawPositiveSmall",
  "yawPositiveMid",
  "yawPositiveStrong",
  "yawNegativeSmall",
  "yawNegativeMid",
  "yawNegativeStrong",
  "pitchPositive",
  "pitchNegative",
  "mixedPose",
  "unknown",
]

const STABILITY_BUCKETS: StabilityBucket[] = [
  "front",
  "yawPositive",
  "yawNegative",
  "pitchPositive",
  "pitchNegative",
  "mixedPose",
  "unknown",
]

const CANDIDATE_DEFINITIONS: CandidateDefinition[] = [
  {
    transformName: "normalized_xyz_direct",
    description:
      "landmark.x / y / z をそのまま 3D 点として扱い、facialTransformationMatrix の逆行列を適用します。",
    assumptions: [
      "normalized landmark と matrix が同じ座標系に近い可能性を試す",
      "row-major の 4x4 matrix を canonical -> detected とみなす",
    ],
    usesInverseMatrix: true,
  },
  {
    transformName: "image_centered_same_unit",
    description:
      "x/y を画像中心基準にし、video aspect を x に反映した same-unit 風座標へ変換してから逆行列を適用します。",
    assumptions: [
      "xSame = (x - 0.5) * videoAspect",
      "ySame = y - 0.5",
      "z は landmark.z をそのまま使う",
    ],
    usesInverseMatrix: true,
  },
  {
    transformName: "face_bounds_centered",
    description:
      "顔 bounds center を原点にし、顔サイズで x/y/z を正規化してから逆行列を適用します。",
    assumptions: [
      "scale は max(face width, face height)",
      "z も bounds center z からの差分を同じ scale で正規化する",
    ],
    usesInverseMatrix: true,
  },
  {
    transformName: "no_inverse_canonicalized_baseline",
    description:
      "逆行列を使わず、顔 bounds center / scale で current landmarks を正規化する比較用 baseline です。",
    assumptions: [
      "matrix なしでも計算できる",
      "inverse transform candidate の安定性比較用",
    ],
    usesInverseMatrix: false,
  },
]

const state: AppState = {
  cameraStatus: "idle",
  detectorStatus: "idle",
  detectorError: null,
  cameraError: null,
  detectCount: 0,
  lastSkippedReason: null,
  clipboardMessage: null,
  importMessage: null,
  analysisMessage: null,
  latestFrame: null,
  captures: [],
  importedCaptures: [],
  importedFileName: null,
  analysis: null,
  loopStartedAt: null,
}

const app = document.querySelector<HTMLDivElement>("#app")

if (!app) {
  throw new Error("#app is missing")
}

app.innerHTML = `
  <main class="app">
    <header class="header">
      <div class="title-block">
        <h1>MediaPipe Canonical Lab</h1>
        <p>Face Landmarker の capture JSON から canonical-like 478 と安定性を調査する debug tool です。</p>
      </div>
      <div class="status-pill" id="runStatus">初期化中</div>
    </header>

    <section class="layout">
      <div class="panel">
        <h2>カメラ / 検出器の状態</h2>
        <p class="panel-help">MediaPipe Face Landmarker の生データを保存し、解析用 JSON として export します。</p>
        <div class="status-grid" id="statusGrid"></div>
      </div>

      <div class="panel">
        <h2>ライブプレビュー</h2>
        <div class="preview-wrap">
          <video id="video" playsinline muted autoplay></video>
          <canvas id="overlay"></canvas>
        </div>
        <div class="controls">
          <button id="captureButton" class="primary" type="button">現在のフレームを保存</button>
          <button id="clearButton" type="button">保存データをクリア</button>
          <button id="copyButton" type="button">全データをコピー</button>
          <button id="exportButton" type="button">Capture JSON を書き出し</button>
        </div>
        <p class="copy-status" id="copyStatus"></p>
        <ul class="help-list">
          <li>正面・左右・上下を手動で保存し、bucket 別の capture を作ります。</li>
          <li>今回の canonical analysis は debug artifact であり、IdealFace / Runtime には反映しません。</li>
        </ul>
      </div>
    </section>

    <section class="panel">
      <h2>Captured JSON 解析</h2>
      <div class="controls">
        <input id="importFileInput" type="file" accept="application/json,.json" hidden />
        <button id="importButton" class="primary" type="button">Import captured JSON</button>
        <button id="analyzeButton" type="button">Analyze captures</button>
        <button id="clearAnalysisButton" type="button">Clear analysis</button>
        <button id="exportAnalysisButton" type="button">Export analysis JSON</button>
      </div>
      <p class="copy-status" id="importStatus"></p>
      <div class="analysis-grid">
        <section>
          <h3>imported capture summary</h3>
          <div class="status-grid" id="importedSummary"></div>
        </section>
        <section>
          <h3>pose range</h3>
          <div class="status-grid" id="poseSummary"></div>
        </section>
      </div>
    </section>

    <section class="analysis-results">
      <div class="panel">
        <h2>transform candidate list</h2>
        <div class="table-wrap" id="candidateList"></div>
      </div>

      <div class="panel">
        <h2>stability ranking</h2>
        <div class="table-wrap" id="stabilityRanking"></div>
      </div>
    </section>

    <section class="analysis-results">
      <div class="panel">
        <h2>best candidate / empirical canonical summary</h2>
        <div class="status-grid" id="bestCandidateSummary"></div>
      </div>

      <div class="panel">
        <h2>warnings</h2>
        <div class="latest-box" id="analysisWarnings">解析結果はまだありません。</div>
      </div>
    </section>

    <section class="panel">
      <h2>matrix summary preview</h2>
      <div class="table-wrap" id="matrixSummary"></div>
    </section>

    <section class="panel">
      <h2>raw JSON preview / copy debug</h2>
      <div class="controls">
        <button id="copyAnalysisButton" type="button">Analysis JSON をコピー</button>
      </div>
      <pre class="json-preview" id="analysisJsonPreview">解析結果はまだありません。</pre>
    </section>

    <section class="summary">
      <div class="panel">
        <h2>保存データの概要</h2>
        <div class="status-grid" id="captureSummary"></div>
        <h2>姿勢 bucket 別の件数</h2>
        <div class="bucket-grid" id="bucketCounts"></div>
      </div>

      <div class="panel">
        <h2>最新の保存データ</h2>
        <div class="latest-box" id="latestCapture">まだ保存されていません。</div>
      </div>
    </section>

    <section class="panel">
      <h2>保存したフレーム一覧</h2>
      <div class="preview-list" id="previewList"></div>
    </section>
  </main>
`

const video = getElement<HTMLVideoElement>("video")
const overlay = getElement<HTMLCanvasElement>("overlay")
const captureButton = getElement<HTMLButtonElement>("captureButton")
const clearButton = getElement<HTMLButtonElement>("clearButton")
const copyButton = getElement<HTMLButtonElement>("copyButton")
const exportButton = getElement<HTMLButtonElement>("exportButton")
const importButton = getElement<HTMLButtonElement>("importButton")
const importFileInput = getElement<HTMLInputElement>("importFileInput")
const analyzeButton = getElement<HTMLButtonElement>("analyzeButton")
const clearAnalysisButton = getElement<HTMLButtonElement>("clearAnalysisButton")
const exportAnalysisButton = getElement<HTMLButtonElement>("exportAnalysisButton")
const copyAnalysisButton = getElement<HTMLButtonElement>("copyAnalysisButton")

let faceLandmarker: FaceLandmarker | null = null

captureButton.addEventListener("click", () => {
  captureCurrentFrame()
})

clearButton.addEventListener("click", () => {
  state.captures = []
  state.lastSkippedReason = null
  state.clipboardMessage = null
  render()
})

copyButton.addEventListener("click", () => {
  void copyCapturesToClipboard()
})

exportButton.addEventListener("click", () => {
  exportCaptures()
})

importButton.addEventListener("click", () => {
  importFileInput.click()
})

importFileInput.addEventListener("change", () => {
  const file = importFileInput.files?.[0]
  if (file) {
    void importCapturedJson(file)
  }
  importFileInput.value = ""
})

analyzeButton.addEventListener("click", () => {
  analyzeCaptures()
})

clearAnalysisButton.addEventListener("click", () => {
  state.importedCaptures = []
  state.importedFileName = null
  state.analysis = null
  state.importMessage = null
  state.analysisMessage = null
  render()
})

exportAnalysisButton.addEventListener("click", () => {
  exportAnalysisJson()
})

copyAnalysisButton.addEventListener("click", () => {
  void copyAnalysisToClipboard()
})

void initialize()

async function initialize(): Promise<void> {
  render()
  await Promise.all([initializeCamera(), initializeDetector()])
  startDetectionLoop()
}

async function initializeCamera(): Promise<void> {
  state.cameraStatus = "starting"
  state.cameraError = null
  render()

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    })

    video.srcObject = stream
    await video.play()
    state.cameraStatus = "running"
  } catch (error) {
    state.cameraStatus = "error"
    state.cameraError = error instanceof Error ? error.message : String(error)
  }

  render()
}

async function initializeDetector(): Promise<void> {
  state.detectorStatus = "initializing"
  state.detectorError = null
  render()

  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
    )

    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      },
      runningMode: "VIDEO",
      numFaces: 1,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
    })

    state.detectorStatus = "ready"
  } catch (error) {
    state.detectorStatus = "error"
    state.detectorError = error instanceof Error ? error.message : String(error)
  }

  render()
}

function startDetectionLoop(): void {
  if (state.loopStartedAt !== null) {
    return
  }

  state.loopStartedAt = performance.now()

  const detect = (): void => {
    if (
      faceLandmarker &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      video.videoWidth > 0 &&
      video.videoHeight > 0
    ) {
      try {
        const timestamp = performance.now()
        const result = faceLandmarker.detectForVideo(video, timestamp)
        const landmarks = result.faceLandmarks[0] ?? []
        const matrix = result.facialTransformationMatrixes[0] ?? null
        const blendshapes =
          result.faceBlendshapes[0]?.categories.map((category) => ({
            categoryName: category.categoryName,
            score: category.score,
          })) ?? []

        state.detectCount += 1
        state.latestFrame = {
          detected: result.faceLandmarks.length > 0,
          timestamp,
          videoTime: video.currentTime,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          landmarks,
          facialTransformationMatrix: matrix,
          blendshapes,
          pose: estimateFacePoseFromMatrixObject(matrix),
        }

        drawOverlay(landmarks)
      } catch (error) {
        state.detectorStatus = "error"
        state.detectorError = error instanceof Error ? error.message : String(error)
      }
    }

    render()
    window.requestAnimationFrame(detect)
  }

  window.requestAnimationFrame(detect)
}

function captureCurrentFrame(): void {
  const frame = state.latestFrame
  const warnings: string[] = []
  const notes: string[] = []

  if (!frame) {
    state.lastSkippedReason = "まだ検出フレームがありません。"
    render()
    return
  }

  if (!frame.detected) {
    warnings.push("最新フレームで顔が検出されていません。")
  }

  if (frame.landmarks.length !== EXPECTED_LANDMARK_COUNT) {
    warnings.push(
      `landmarks は ${EXPECTED_LANDMARK_COUNT} 点を期待していますが、${frame.landmarks.length} 点でした。`,
    )
  }

  if (!frame.facialTransformationMatrix) {
    warnings.push("facialTransformationMatrix がありません。")
  }

  if (!frame.pose) {
    warnings.push("matrix から yaw / pitch / roll を推定できませんでした。")
  }

  notes.push("MediaPipe FaceLandmarker の最新結果を手動で保存しました。")

  const capture: CaptureRecord = {
    captureId: createCaptureId(state.captures.length + 1),
    capturedAt: new Date().toISOString(),
    videoTime: frame.videoTime,
    videoWidth: frame.videoWidth,
    videoHeight: frame.videoHeight,
    pose: frame.pose,
    landmarks: frame.landmarks.map((landmark, index) => ({
      index,
      x: landmark.x,
      y: landmark.y,
      z: landmark.z,
    })),
    facialTransformationMatrix: frame.facialTransformationMatrix
      ? captureMatrix(frame.facialTransformationMatrix)
      : null,
    blendshapes: frame.blendshapes,
    bucket: classifyBucket(frame.pose),
    notes,
    warnings,
    previewDataUrl: createPreviewDataUrl(),
  }

  state.captures = [capture, ...state.captures]
  state.lastSkippedReason = null
  state.clipboardMessage = null
  render()
}

async function importCapturedJson(file: File): Promise<void> {
  try {
    const payload = JSON.parse(await file.text()) as unknown
    const capturesPayload = parseCapturesPayload(payload)
    state.importedCaptures = capturesPayload.captures
    state.importedFileName = file.name
    state.analysis = null
    state.importMessage = `${file.name} から ${capturesPayload.captures.length} 件を import しました。`
    state.analysisMessage = null
  } catch (error) {
    state.importMessage =
      error instanceof Error ? `import に失敗しました: ${error.message}` : "import に失敗しました。"
  }

  render()
}

function analyzeCaptures(): void {
  const captures = getAnalysisInputCaptures()

  if (captures.length === 0) {
    state.analysisMessage = "解析できる capture がありません。"
    render()
    return
  }

  state.analysis = createAnalysis(captures)
  state.analysisMessage = `${captures.length} 件の capture を解析しました。`
  render()
}

function exportCaptures(): void {
  const createdAt = new Date()
  const payload = createExportPayload(createdAt)
  downloadJson(payload, `mediapipe_canonical_lab_captures_${formatFileTimestamp(createdAt)}.json`)
}

function exportAnalysisJson(): void {
  if (!state.analysis) {
    return
  }

  const createdAt = new Date()
  downloadJson(
    state.analysis,
    `mediapipe_canonical_lab_analysis_${formatFileTimestamp(createdAt)}.json`,
  )
}

async function copyCapturesToClipboard(): Promise<void> {
  if (state.captures.length === 0) {
    state.clipboardMessage = "コピーできる保存データがありません。"
    render()
    return
  }

  try {
    const payload = createExportPayload(new Date())
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
    state.clipboardMessage = "全データをクリップボードにコピーしました。"
  } catch (error) {
    state.clipboardMessage =
      error instanceof Error
        ? `クリップボードへのコピーに失敗しました: ${error.message}`
        : "クリップボードへのコピーに失敗しました。"
  }

  render()
}

async function copyAnalysisToClipboard(): Promise<void> {
  if (!state.analysis) {
    state.analysisMessage = "コピーできる解析結果がありません。"
    render()
    return
  }

  try {
    await navigator.clipboard.writeText(JSON.stringify(state.analysis, null, 2))
    state.analysisMessage = "Analysis JSON をクリップボードにコピーしました。"
  } catch (error) {
    state.analysisMessage =
      error instanceof Error
        ? `Analysis JSON のコピーに失敗しました: ${error.message}`
        : "Analysis JSON のコピーに失敗しました。"
  }

  render()
}

function createExportPayload(createdAt: Date): CapturesPayload {
  return {
    schemaVersion: "mediapipe_canonical_lab_captures_v1",
    createdAt: createdAt.toISOString(),
    tool: {
      name: "mediapipe-canonical-lab",
      version: "0.1.0",
    },
    source: {
      detector:
        "@mediapipe/tasks-vision FaceLandmarker 0.10.35, VIDEO mode, outputFaceBlendshapes=true, outputFacialTransformationMatrixes=true",
      landmarkCount: EXPECTED_LANDMARK_COUNT,
    },
    summary: {
      captureCount: state.captures.length,
      bucketCounts: countBuckets(state.captures),
    },
    captures: state.captures.map(({ previewDataUrl, ...capture }) => ({
      ...capture,
      previewDataUrl: null,
    })),
  }
}

function createAnalysis(captures: CaptureRecord[]): AnalysisResult {
  const warnings: string[] = []
  const sourceCaptureSummary = summarizeCaptures(captures)
  const rawCaptureSummaries = captures.map(analyzeRawCapture)
  const matrixSummaries = captures.map(analyzeMatrix)
  const transformCandidates = CANDIDATE_DEFINITIONS.map((definition) =>
    analyzeTransformCandidate(definition, captures),
  )
  const stabilityRanking = rankCandidates(transformCandidates)
  const bestStabilityTransformCandidate = stabilityRanking[0]?.transformName ?? null
  const bestCandidate = transformCandidates.find(
    (candidate) => candidate.transformName === bestStabilityTransformCandidate,
  )
  const empiricalCanonical478 =
    bestCandidate && bestStabilityTransformCandidate
      ? createEmpiricalCanonical478(bestCandidate, bestStabilityTransformCandidate)
      : null

  if (captures.length < 2) {
    warnings.push("フレーム間安定性を見るには capture が 2 件以上必要です。")
  }

  if (sourceCaptureSummary.matrixAvailableCount === 0) {
    warnings.push("facialTransformationMatrix がある capture がないため、inverse matrix candidate は評価できません。")
  }

  for (const candidate of transformCandidates) {
    warnings.push(...candidate.warnings.map((warning) => `${candidate.transformName}: ${warning}`))
  }

  return {
    schemaVersion: "mediapipe_canonical_lab_analysis_v1",
    generatedAt: new Date().toISOString(),
    sourceCaptureSummary,
    rawCaptureSummaries,
    matrixSummaries,
    transformCandidates,
    stabilityRanking,
    bestStabilityTransformCandidate,
    empiricalCanonical478,
    warnings,
  }
}

function analyzeTransformCandidate(
  definition: CandidateDefinition,
  captures: CaptureRecord[],
): TransformCandidateAnalysis {
  const warnings: string[] = []
  const transformedCaptures: Array<{
    capture: CaptureRecord
    points: LandmarkPoint[]
    summary: PerCaptureCandidateSummary
  }> = []

  for (const capture of captures) {
    const result = transformCaptureLandmarks(definition, capture)
    if (result.warnings.length > 0) {
      warnings.push(...result.warnings.map((warning) => `${capture.captureId}: ${warning}`))
    }

    if (result.points.length > 0) {
      transformedCaptures.push({
        capture,
        points: result.points,
        summary: {
          captureId: capture.captureId,
          bucket: capture.bucket,
          pointCount: result.points.length,
          canonicalLikeBounds: calculateBounds(result.points),
          centroid: calculateCentroid(result.points),
          warnings: result.warnings,
        },
      })
    }
  }

  if (transformedCaptures.length === 0) {
    warnings.push("有効な transformed capture がありません。")
  }

  return {
    transformName: definition.transformName,
    description: definition.description,
    assumptions: definition.assumptions,
    perCaptureCanonicalLikeBounds: transformedCaptures.map((item) => item.summary),
    averagedCanonicalLikeBounds: averageBounds(
      transformedCaptures
        .map((item) => item.summary.canonicalLikeBounds)
        .filter((bounds): bounds is BoundsSummary => Boolean(bounds)),
    ),
    frameToFrameStability: calculateCandidateStability(transformedCaptures),
    warnings,
  }
}

function transformCaptureLandmarks(
  definition: CandidateDefinition,
  capture: CaptureRecord,
): { points: LandmarkPoint[]; warnings: string[] } {
  const warnings: string[] = []

  if (capture.landmarks.length === 0) {
    return { points: [], warnings: ["landmarks が空です。"] }
  }

  const bounds = calculateBounds(capture.landmarks)
  const boundsCenter = bounds ? calculateBoundsCenter(bounds) : null
  const faceScale = bounds ? Math.max(bounds.width, bounds.height) : 0
  const videoAspect =
    capture.videoWidth > 0 && capture.videoHeight > 0
      ? capture.videoWidth / capture.videoHeight
      : 1

  let inverseMatrix: number[] | null = null
  if (definition.usesInverseMatrix) {
    const matrix = getMatrixValues4x4(capture.facialTransformationMatrix)
    inverseMatrix = matrix ? invertMatrix(matrix, 4) : null

    if (!inverseMatrix) {
      return {
        points: [],
        warnings: ["4x4 facialTransformationMatrix の逆行列を作れませんでした。"],
      }
    }
  }

  if (
    (definition.transformName === "face_bounds_centered" ||
      definition.transformName === "no_inverse_canonicalized_baseline") &&
    (!boundsCenter || faceScale <= EPSILON)
  ) {
    return { points: [], warnings: ["face bounds の center / scale を計算できませんでした。"] }
  }

  const points = capture.landmarks.map((landmark) => {
    const sourcePoint = toCandidateSourcePoint(
      definition.transformName,
      landmark,
      boundsCenter,
      faceScale,
      videoAspect,
    )
    const transformed = inverseMatrix ? applyMatrix4(inverseMatrix, sourcePoint) : sourcePoint

    return {
      index: landmark.index,
      x: transformed.x,
      y: transformed.y,
      z: transformed.z,
    }
  })

  return { points, warnings }
}

function toCandidateSourcePoint(
  transformName: TransformName,
  landmark: LandmarkPoint,
  boundsCenter: Point3 | null,
  faceScale: number,
  videoAspect: number,
): Point3 {
  switch (transformName) {
    case "normalized_xyz_direct":
      return {
        x: landmark.x,
        y: landmark.y,
        z: landmark.z,
      }
    case "image_centered_same_unit":
      return {
        x: (landmark.x - 0.5) * videoAspect,
        y: landmark.y - 0.5,
        z: landmark.z,
      }
    case "face_bounds_centered":
    case "no_inverse_canonicalized_baseline":
      return {
        x: (landmark.x - (boundsCenter?.x ?? 0)) / faceScale,
        y: (landmark.y - (boundsCenter?.y ?? 0)) / faceScale,
        z: (landmark.z - (boundsCenter?.z ?? 0)) / faceScale,
      }
  }
}

function calculateCandidateStability(
  transformedCaptures: Array<{ capture: CaptureRecord; points: LandmarkPoint[] }>,
): CandidateStability {
  const perLandmarkMean = calculatePerLandmarkStability(
    transformedCaptures.map((item) => item.points),
  )
  const stdDevItems = perLandmarkMean.filter((item) => item.sampleCount > 0)
  const averageStdDevX = averageNumber(stdDevItems.map((item) => item.stdDevX))
  const averageStdDevY = averageNumber(stdDevItems.map((item) => item.stdDevY))
  const averageStdDevZ = averageNumber(stdDevItems.map((item) => item.stdDevZ))
  const averageStdDev3D = averageNumber(stdDevItems.map((item) => item.stdDev3D))
  const maxStdDevLandmark =
    stdDevItems.length === 0
      ? null
      : [...stdDevItems].sort((a, b) => b.stdDev3D - a.stdDev3D)[0]

  const semanticSamples = transformedCaptures.map((item) => ({
    capture: item.capture,
    points: getSemanticPoints(item.points),
  }))

  return {
    perLandmarkMean,
    averageStdDevX,
    averageStdDevY,
    averageStdDevZ,
    averageStdDev3D,
    maxStdDevLandmark,
    semanticPointStability: {
      noseTip: calculatePointStability(
        semanticSamples.map((item) => item.points.noseTip),
      ),
      eyeCenter: calculatePointStability(
        semanticSamples.map((item) => item.points.eyeCenter),
      ),
      mouthCenter: calculatePointStability(
        semanticSamples.map((item) => item.points.mouthCenter),
      ),
      chin: calculatePointStability(semanticSamples.map((item) => item.points.chin)),
      cheek: calculatePointStability(
        semanticSamples
          .map((item) =>
            item.points.leftCheek && item.points.rightCheek
              ? averagePoints([item.points.leftCheek, item.points.rightCheek])
              : null,
          )
          .filter((point): point is Point3 => Boolean(point)),
      ),
    },
    bucketStability: calculateBucketStability(transformedCaptures),
  }
}

function calculatePerLandmarkStability(
  pointSets: LandmarkPoint[][],
): PerLandmarkStability[] {
  const result: PerLandmarkStability[] = []

  for (let index = 0; index < EXPECTED_LANDMARK_COUNT; index += 1) {
    const points = pointSets
      .map((set) => set.find((point) => point.index === index) ?? null)
      .filter((point): point is LandmarkPoint => Boolean(point))

    if (points.length === 0) {
      continue
    }

    const stability = calculatePointStability(points)
    if (!stability.mean) {
      continue
    }

    result.push({
      index,
      mean: stability.mean,
      stdDevX: stability.stdDevX ?? 0,
      stdDevY: stability.stdDevY ?? 0,
      stdDevZ: stability.stdDevZ ?? 0,
      stdDev3D: stability.stdDev3D ?? 0,
      sampleCount: stability.sampleCount,
    })
  }

  return result
}

function calculateBucketStability(
  transformedCaptures: Array<{ capture: CaptureRecord; points: LandmarkPoint[] }>,
): Record<StabilityBucket, BucketStability> {
  return STABILITY_BUCKETS.reduce(
    (summary, bucket) => {
      const pointSets = transformedCaptures
        .filter((item) => toStabilityBucket(item.capture.bucket) === bucket)
        .map((item) => item.points)
      const perLandmark = calculatePerLandmarkStability(pointSets)
      summary[bucket] = {
        sampleCount: pointSets.length,
        averageStdDev3D: averageNumber(perLandmark.map((item) => item.stdDev3D)),
      }
      return summary
    },
    {} as Record<StabilityBucket, BucketStability>,
  )
}

function rankCandidates(
  candidates: TransformCandidateAnalysis[],
): StabilityRankingEntry[] {
  return candidates
    .map((candidate) => {
      const zRanges = candidate.perCaptureCanonicalLikeBounds
        .map((item) => item.canonicalLikeBounds?.zRange ?? null)
        .filter((value): value is number => value !== null)
      return {
        transformName: candidate.transformName,
        averageStdDev3D: candidate.frameToFrameStability.averageStdDev3D,
        averageStdDevX: candidate.frameToFrameStability.averageStdDevX,
        averageStdDevY: candidate.frameToFrameStability.averageStdDevY,
        averageStdDevZ: candidate.frameToFrameStability.averageStdDevZ,
        noseStdDev3D:
          candidate.frameToFrameStability.semanticPointStability.noseTip.stdDev3D,
        zRangeStability: standardDeviation(zRanges),
        sampleCount: candidate.perCaptureCanonicalLikeBounds.length,
      }
    })
    .sort((a, b) => {
      if (a.averageStdDev3D === null && b.averageStdDev3D === null) {
        return 0
      }
      if (a.averageStdDev3D === null) {
        return 1
      }
      if (b.averageStdDev3D === null) {
        return -1
      }
      return a.averageStdDev3D - b.averageStdDev3D
    })
}

function createEmpiricalCanonical478(
  candidate: TransformCandidateAnalysis,
  transformName: TransformName,
): EmpiricalCanonical478 | null {
  const landmarks = candidate.frameToFrameStability.perLandmarkMean
    .filter((item) => item.sampleCount > 0)
    .map((item) => ({
      index: item.index,
      x: item.mean.x,
      y: item.mean.y,
      z: item.mean.z,
      stdDevX: item.stdDevX,
      stdDevY: item.stdDevY,
      stdDevZ: item.stdDevZ,
      sampleCount: item.sampleCount,
    }))

  if (landmarks.length === 0) {
    return null
  }

  const bounds = calculateBounds(landmarks)

  return {
    debugArtifact: true,
    sourceTransformCandidate: transformName,
    landmarks,
    summary: {
      bounds,
      centroid: calculateCentroid(landmarks),
      boundsCenter: bounds ? calculateBoundsCenter(bounds) : null,
      zRange: bounds?.zRange ?? null,
      semanticSummary: {
        points: getSemanticPoints(landmarks),
        z: getZSemanticSummary(getSemanticPoints(landmarks)),
      },
    },
  }
}

function summarizeCaptures(captures: CaptureRecord[]): SourceCaptureSummary {
  const landmarkCounts = captures.map((capture) => capture.landmarks.length)
  const widths = captures.map((capture) => capture.videoWidth).filter(isFiniteNumber)
  const heights = captures.map((capture) => capture.videoHeight).filter(isFiniteNumber)
  const poses = captures.map((capture) => capture.pose).filter((pose): pose is Pose => Boolean(pose))

  return {
    captureCount: captures.length,
    bucketCounts: countBuckets(captures),
    landmarkCount: {
      expected: EXPECTED_LANDMARK_COUNT,
      min: minOrNull(landmarkCounts),
      max: maxOrNull(landmarkCounts),
      allExpected: landmarkCounts.every((count) => count === EXPECTED_LANDMARK_COUNT),
    },
    matrixAvailableCount: captures.filter((capture) => Boolean(capture.facialTransformationMatrix))
      .length,
    videoSizeSummary: {
      uniqueSizes: [...new Set(captures.map((capture) => `${capture.videoWidth}x${capture.videoHeight}`))],
      minWidth: minOrNull(widths),
      maxWidth: maxOrNull(widths),
      minHeight: minOrNull(heights),
      maxHeight: maxOrNull(heights),
    },
    poseRange: {
      yaw: {
        min: minOrNull(poses.map((pose) => pose.yaw)),
        max: maxOrNull(poses.map((pose) => pose.yaw)),
      },
      pitch: {
        min: minOrNull(poses.map((pose) => pose.pitch)),
        max: maxOrNull(poses.map((pose) => pose.pitch)),
      },
      roll: {
        min: minOrNull(poses.map((pose) => pose.roll)),
        max: maxOrNull(poses.map((pose) => pose.roll)),
      },
    },
  }
}

function analyzeRawCapture(capture: CaptureRecord): CaptureRawAnalysis {
  const bounds = calculateBounds(capture.landmarks)
  const semanticPoints = getSemanticPoints(capture.landmarks)

  return {
    captureId: capture.captureId,
    bucket: capture.bucket,
    landmarkCount: capture.landmarks.length,
    bounds,
    centroid: calculateCentroid(capture.landmarks),
    boundsCenter: bounds ? calculateBoundsCenter(bounds) : null,
    semanticSummary: {
      points: semanticPoints,
      z: getZSemanticSummary(semanticPoints),
    },
  }
}

function analyzeMatrix(capture: CaptureRecord): MatrixAnalysis {
  const matrix = getMatrixValues4x4(capture.facialTransformationMatrix)
  const warnings: string[] = []

  if (!matrix) {
    warnings.push("4x4 matrix がありません。")
    return {
      captureId: capture.captureId,
      available: false,
      assumption: createMatrixAssumption(),
      rawValues: capture.facialTransformationMatrix?.values ?? null,
      translation: null,
      approximateScale: null,
      rotationBasis: null,
      determinant: null,
      extractedPose: null,
      capturePose: capture.pose,
      poseDelta: null,
      inverseAvailable: false,
      warnings,
    }
  }

  const xAxis = { x: matrix[0], y: matrix[4], z: matrix[8] }
  const yAxis = { x: matrix[1], y: matrix[5], z: matrix[9] }
  const zAxis = { x: matrix[2], y: matrix[6], z: matrix[10] }
  const approximateScale = averageNumber([
    vectorLength(xAxis),
    vectorLength(yAxis),
    vectorLength(zAxis),
  ])
  const determinant = determinant3x3(matrix)
  const extractedPose = estimateFacePoseFromMatrixValues(matrix, 4)
  const inverseAvailable = Boolean(invertMatrix(matrix, 4))

  if (!inverseAvailable) {
    warnings.push("逆行列を作れませんでした。")
  }

  return {
    captureId: capture.captureId,
    available: true,
    assumption: createMatrixAssumption(),
    rawValues: matrix,
    translation: {
      x: matrix[3],
      y: matrix[7],
      z: matrix[11],
    },
    approximateScale,
    rotationBasis: {
      xAxis,
      yAxis,
      zAxis,
    },
    determinant,
    extractedPose,
    capturePose: capture.pose,
    poseDelta:
      extractedPose && capture.pose
        ? {
            yaw: extractedPose.yaw - capture.pose.yaw,
            pitch: extractedPose.pitch - capture.pose.pitch,
            roll: extractedPose.roll - capture.pose.roll,
          }
        : null,
    inverseAvailable,
    warnings,
  }
}

function createMatrixAssumption(): MatrixAnalysis["assumption"] {
  return {
    ordering: "row-major",
    indexFormula: "values[row * columns + column]",
    vectorConvention: "column-vector point, pDetected = M * pCanonical",
    maps: "MediaPipe canonical face to detected face",
  }
}

function render(): void {
  const frame = state.latestFrame
  const matrixAvailable = Boolean(frame?.facialTransformationMatrix)
  const fps =
    state.loopStartedAt === null
      ? 0
      : state.detectCount / Math.max((performance.now() - state.loopStartedAt) / 1000, 1)
  const inputCaptures = getAnalysisInputCaptures()
  const importedSummary = summarizeCaptures(inputCaptures)
  const analysis = state.analysis

  getElement("runStatus").textContent =
    state.cameraStatus === "running" && state.detectorStatus === "ready"
      ? "準備完了"
      : `カメラ: ${formatLifecycleStatus(state.cameraStatus)} / 検出器: ${formatLifecycleStatus(
          state.detectorStatus,
        )}`

  getElement("statusGrid").innerHTML = renderStatusItems([
    ["カメラ状態", formatLifecycleStatus(state.cameraStatus)],
    ["検出器状態", formatLifecycleStatus(state.detectorStatus)],
    ["顔検出", frame?.detected ? "検出あり" : "未検出"],
    ["landmarks 数", `${frame?.landmarks.length ?? 0} 点`],
    ["facialTransformationMatrix", matrixAvailable ? "取得あり" : "未取得"],
    ["blendshapes 数", `${frame?.blendshapes.length ?? 0} 件`],
    ["現在の yaw / pitch / roll", formatPose(frame?.pose ?? null)],
    ["映像サイズ", `${frame?.videoWidth ?? 0} x ${frame?.videoHeight ?? 0}`],
    ["FPS / 検出回数", `${fps.toFixed(1)} / ${state.detectCount}`],
    ["検出器エラー", state.detectorError ?? "-"],
    ["カメラエラー", state.cameraError ?? "-"],
  ])

  getElement("captureSummary").innerHTML = renderStatusItems([
    ["保存件数", `${state.captures.length} 件`],
    ["最新 bucket", state.captures[0] ? formatBucket(state.captures[0].bucket) : "-"],
    ["最後に保存できなかった理由", state.lastSkippedReason ?? "-"],
  ])

  getElement("bucketCounts").innerHTML = BUCKETS.map((bucket) => {
    const count = state.captures.filter((capture) => capture.bucket === bucket).length
    return `<div class="bucket-item"><span>${formatBucket(bucket)}</span><strong>${count}</strong></div>`
  }).join("")

  getElement("importStatus").textContent =
    [state.importMessage, state.analysisMessage].filter(Boolean).join(" / ") || ""

  getElement("importedSummary").innerHTML = renderStatusItems([
    ["入力ソース", state.importedCaptures.length > 0 ? state.importedFileName ?? "imported JSON" : "保存済み captures"],
    ["capture count", `${importedSummary.captureCount}`],
    ["bucket counts", formatBucketCounts(importedSummary.bucketCounts)],
    [
      "landmark count",
      `${importedSummary.landmarkCount.min ?? "-"} - ${
        importedSummary.landmarkCount.max ?? "-"
      } / expected ${EXPECTED_LANDMARK_COUNT}`,
    ],
    ["matrix available count", `${importedSummary.matrixAvailableCount}`],
    ["video size summary", importedSummary.videoSizeSummary.uniqueSizes.join(", ") || "-"],
  ])

  getElement("poseSummary").innerHTML = renderStatusItems([
    ["yaw min / max", formatRange(importedSummary.poseRange.yaw)],
    ["pitch min / max", formatRange(importedSummary.poseRange.pitch)],
    ["roll min / max", formatRange(importedSummary.poseRange.roll)],
  ])

  getElement("candidateList").innerHTML = renderCandidateList(analysis)
  getElement("stabilityRanking").innerHTML = renderStabilityRanking(analysis)
  getElement("bestCandidateSummary").innerHTML = renderBestCandidateSummary(analysis)
  getElement("analysisWarnings").textContent =
    analysis?.warnings.length ? analysis.warnings.join("\n") : "解析 warning はありません。"
  getElement("matrixSummary").innerHTML = renderMatrixSummary(analysis)
  getElement("analysisJsonPreview").textContent = analysis
    ? JSON.stringify(
        {
          schemaVersion: analysis.schemaVersion,
          generatedAt: analysis.generatedAt,
          sourceCaptureSummary: analysis.sourceCaptureSummary,
          stabilityRanking: analysis.stabilityRanking,
          bestStabilityTransformCandidate: analysis.bestStabilityTransformCandidate,
          empiricalCanonical478: analysis.empiricalCanonical478
            ? {
                sourceTransformCandidate:
                  analysis.empiricalCanonical478.sourceTransformCandidate,
                landmarkCount: analysis.empiricalCanonical478.landmarks.length,
                summary: analysis.empiricalCanonical478.summary,
              }
            : null,
          warnings: analysis.warnings,
        },
        null,
        2,
      )
    : "解析結果はまだありません。"

  const latest = state.captures[0]
  getElement("latestCapture").textContent = latest
    ? JSON.stringify(
        {
          保存ID: latest.captureId,
          保存日時: latest.capturedAt,
          bucket: formatBucket(latest.bucket),
          姿勢: latest.pose,
          landmarks数: latest.landmarks.length,
          matrix取得: Boolean(latest.facialTransformationMatrix),
          blendshapes数: latest.blendshapes.length,
          warnings: latest.warnings,
        },
        null,
        2,
      )
    : "まだ保存されていません。"

  getElement("previewList").innerHTML =
    state.captures.length === 0
      ? `<p class="note">保存したフレームはまだありません。</p>`
      : state.captures
          .map(
            (capture) => `
              <article class="capture-card">
                ${
                  capture.previewDataUrl
                    ? `<img src="${capture.previewDataUrl}" alt="${escapeHtml(capture.captureId)}" />`
                    : ""
                }
                <dl>
                  <dt>ID</dt><dd>${escapeHtml(capture.captureId)}</dd>
                  <dt>bucket</dt><dd>${formatBucket(capture.bucket)}</dd>
                  <dt>姿勢</dt><dd>${escapeHtml(formatPose(capture.pose))}</dd>
                  <dt>点数</dt><dd>${capture.landmarks.length}</dd>
                </dl>
              </article>
            `,
          )
          .join("")

  getElement("copyStatus").textContent = state.clipboardMessage ?? ""
  captureButton.disabled = !state.latestFrame
  copyButton.disabled = state.captures.length === 0
  exportButton.disabled = state.captures.length === 0
  clearButton.disabled = state.captures.length === 0
  analyzeButton.disabled = inputCaptures.length === 0
  clearAnalysisButton.disabled =
    state.importedCaptures.length === 0 && state.analysis === null && !state.importMessage
  exportAnalysisButton.disabled = !state.analysis
  copyAnalysisButton.disabled = !state.analysis
}

function renderCandidateList(analysis: AnalysisResult | null): string {
  const candidates = analysis?.transformCandidates ?? CANDIDATE_DEFINITIONS

  return `
    <table>
      <thead>
        <tr>
          <th>candidate</th>
          <th>inverse</th>
          <th>description</th>
          <th>samples</th>
        </tr>
      </thead>
      <tbody>
        ${candidates
          .map((candidate) => {
            const definition = CANDIDATE_DEFINITIONS.find(
              (item) => item.transformName === candidate.transformName,
            )
            const sampleCount =
              "perCaptureCanonicalLikeBounds" in candidate
                ? candidate.perCaptureCanonicalLikeBounds.length
                : "-"
            return `
              <tr>
                <td><code>${candidate.transformName}</code></td>
                <td>${definition?.usesInverseMatrix ? "yes" : "no"}</td>
                <td>${escapeHtml(candidate.description)}</td>
                <td>${sampleCount}</td>
              </tr>
            `
          })
          .join("")}
      </tbody>
    </table>
  `
}

function renderStabilityRanking(analysis: AnalysisResult | null): string {
  const ranking = analysis?.stabilityRanking ?? []

  if (ranking.length === 0) {
    return `<p class="note">Analyze captures を実行すると ranking が表示されます。</p>`
  }

  return `
    <table>
      <thead>
        <tr>
          <th>candidate</th>
          <th>avgStdDev3D</th>
          <th>avgStdDevX</th>
          <th>avgStdDevY</th>
          <th>avgStdDevZ</th>
          <th>noseStdDev</th>
          <th>zRangeStability</th>
        </tr>
      </thead>
      <tbody>
        ${ranking
          .map(
            (entry) => `
              <tr>
                <td><code>${entry.transformName}</code></td>
                <td>${formatNullableNumber(entry.averageStdDev3D)}</td>
                <td>${formatNullableNumber(entry.averageStdDevX)}</td>
                <td>${formatNullableNumber(entry.averageStdDevY)}</td>
                <td>${formatNullableNumber(entry.averageStdDevZ)}</td>
                <td>${formatNullableNumber(entry.noseStdDev3D)}</td>
                <td>${formatNullableNumber(entry.zRangeStability)}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `
}

function renderBestCandidateSummary(analysis: AnalysisResult | null): string {
  if (!analysis) {
    return renderStatusItems([
      ["best candidate", "-"],
      ["empiricalCanonical478", "-"],
    ])
  }

  const empirical = analysis.empiricalCanonical478

  return renderStatusItems([
    ["best candidate", analysis.bestStabilityTransformCandidate ?? "-"],
    ["empiricalCanonical478 landmarks", `${empirical?.landmarks.length ?? 0}`],
    ["bounds width / height", formatBoundsSize(empirical?.summary.bounds ?? null)],
    ["zRange", formatNullableNumber(empirical?.summary.zRange ?? null)],
    [
      "semantic nose / mouth / chin z",
      [
        empirical?.summary.semanticSummary.z.noseTipZ,
        empirical?.summary.semanticSummary.z.mouthCenterZ,
        empirical?.summary.semanticSummary.z.chinZ,
      ]
        .map(formatNullableNumber)
        .join(" / "),
    ],
    ["debug artifact", empirical?.debugArtifact ? "true" : "-"],
  ])
}

function renderMatrixSummary(analysis: AnalysisResult | null): string {
  const matrixSummaries = analysis?.matrixSummaries.slice(0, 8) ?? []

  if (matrixSummaries.length === 0) {
    return `<p class="note">Analyze captures を実行すると matrix summary が表示されます。</p>`
  }

  return `
    <table>
      <thead>
        <tr>
          <th>capture</th>
          <th>ordering</th>
          <th>translation</th>
          <th>scale</th>
          <th>determinant</th>
          <th>matrix yaw / pitch / roll</th>
          <th>pose delta</th>
        </tr>
      </thead>
      <tbody>
        ${matrixSummaries
          .map(
            (matrix) => `
              <tr>
                <td><code>${escapeHtml(matrix.captureId)}</code></td>
                <td>${matrix.assumption.ordering}<br /><small>${matrix.assumption.indexFormula}</small></td>
                <td>${formatPoint(matrix.translation)}</td>
                <td>${formatNullableNumber(matrix.approximateScale)}</td>
                <td>${formatNullableNumber(matrix.determinant)}</td>
                <td>${escapeHtml(formatPose(matrix.extractedPose))}</td>
                <td>${escapeHtml(formatPose(matrix.poseDelta))}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `
}

function drawOverlay(landmarks: NormalizedLandmark[]): void {
  const rect = overlay.getBoundingClientRect()
  const width = Math.max(1, Math.floor(rect.width))
  const height = Math.max(1, Math.floor(rect.height))

  if (overlay.width !== width || overlay.height !== height) {
    overlay.width = width
    overlay.height = height
  }

  const ctx = overlay.getContext("2d")
  if (!ctx) {
    return
  }

  ctx.clearRect(0, 0, width, height)
  if (landmarks.length === 0 || video.videoWidth === 0 || video.videoHeight === 0) {
    return
  }

  const videoAspect = video.videoWidth / video.videoHeight
  const canvasAspect = width / height
  const drawWidth = canvasAspect > videoAspect ? height * videoAspect : width
  const drawHeight = canvasAspect > videoAspect ? height : width / videoAspect
  const offsetX = (width - drawWidth) / 2
  const offsetY = (height - drawHeight) / 2

  ctx.fillStyle = "rgba(82, 218, 173, 0.9)"
  for (const point of landmarks) {
    ctx.beginPath()
    ctx.arc(offsetX + point.x * drawWidth, offsetY + point.y * drawHeight, 1.2, 0, Math.PI * 2)
    ctx.fill()
  }
}

function createPreviewDataUrl(): string | null {
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    return null
  }

  const canvas = document.createElement("canvas")
  const targetWidth = 320
  const targetHeight = Math.round((targetWidth / video.videoWidth) * video.videoHeight)
  canvas.width = targetWidth
  canvas.height = targetHeight

  const ctx = canvas.getContext("2d")
  if (!ctx) {
    return null
  }

  ctx.drawImage(video, 0, 0, targetWidth, targetHeight)
  return canvas.toDataURL("image/jpeg", 0.72)
}

function captureMatrix(matrix: Matrix): MatrixCapture {
  return {
    rows: matrix.rows,
    columns: matrix.columns,
    values: Array.from(matrix.data),
    metadata: {
      source: "MediaPipe FaceLandmarker facialTransformationMatrixes[0].data",
      ordering: "row-major",
      indexFormula: "values[row * columns + column]",
      maps: "MediaPipe canonical face to detected face",
    },
  }
}

function estimateFacePoseFromMatrixObject(matrix: Matrix | null): Pose | null {
  if (
    !matrix ||
    matrix.rows < 3 ||
    matrix.columns < 3 ||
    matrix.data.length < matrix.columns * 3
  ) {
    return null
  }

  return estimateFacePoseFromMatrixValues(Array.from(matrix.data), matrix.columns)
}

function estimateFacePoseFromMatrixValues(values: number[], columns: number): Pose | null {
  if (values.length < columns * 3) {
    return null
  }

  const m00 = values[0 * columns + 0]
  const m10 = values[1 * columns + 0]
  const m20 = values[2 * columns + 0]
  const m21 = values[2 * columns + 1]
  const m22 = values[2 * columns + 2]

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

function classifyBucket(pose: Pose | null): CaptureBucket {
  if (!pose) {
    return "unknown"
  }

  const yawAbs = Math.abs(pose.yaw)
  const pitchAbs = Math.abs(pose.pitch)

  if (yawAbs >= 15 && pitchAbs >= 10) {
    return "mixedPose"
  }

  if (pitchAbs >= 10 && yawAbs < 15) {
    return pose.pitch >= 0 ? "pitchPositive" : "pitchNegative"
  }

  if (yawAbs < 8 && pitchAbs < 8) {
    return "front"
  }

  if (pose.yaw >= 0) {
    if (yawAbs < 15) {
      return "yawPositiveSmall"
    }
    if (yawAbs < 30) {
      return "yawPositiveMid"
    }
    return "yawPositiveStrong"
  }

  if (yawAbs < 15) {
    return "yawNegativeSmall"
  }
  if (yawAbs < 30) {
    return "yawNegativeMid"
  }
  return "yawNegativeStrong"
}

function parseCapturesPayload(payload: unknown): CapturesPayload {
  if (!isRecord(payload)) {
    throw new Error("JSON root が object ではありません。")
  }

  if (payload.schemaVersion !== "mediapipe_canonical_lab_captures_v1") {
    throw new Error("schemaVersion が mediapipe_canonical_lab_captures_v1 ではありません。")
  }

  if (!Array.isArray(payload.captures)) {
    throw new Error("captures が配列ではありません。")
  }

  return {
    schemaVersion: "mediapipe_canonical_lab_captures_v1",
    createdAt: typeof payload.createdAt === "string" ? payload.createdAt : "",
    tool: isRecord(payload.tool)
      ? {
          name: String(payload.tool.name ?? ""),
          version: String(payload.tool.version ?? ""),
        }
      : undefined,
    source: isRecord(payload.source)
      ? {
          detector: String(payload.source.detector ?? ""),
          landmarkCount: Number(payload.source.landmarkCount ?? EXPECTED_LANDMARK_COUNT),
        }
      : undefined,
    summary: undefined,
    captures: payload.captures.map(parseCaptureRecord),
  }
}

function parseCaptureRecord(value: unknown, fallbackIndex: number): CaptureRecord {
  if (!isRecord(value)) {
    throw new Error(`captures[${fallbackIndex}] が object ではありません。`)
  }

  const landmarksValue = value.landmarks
  if (!Array.isArray(landmarksValue)) {
    throw new Error(`captures[${fallbackIndex}].landmarks が配列ではありません。`)
  }

  return {
    captureId: typeof value.captureId === "string" ? value.captureId : `imported_${fallbackIndex}`,
    capturedAt: typeof value.capturedAt === "string" ? value.capturedAt : "",
    videoTime: toNumber(value.videoTime),
    videoWidth: toNumber(value.videoWidth),
    videoHeight: toNumber(value.videoHeight),
    pose: parsePose(value.pose),
    landmarks: landmarksValue.map(parseLandmarkPoint).filter(Boolean),
    facialTransformationMatrix: parseMatrixCapture(value.facialTransformationMatrix),
    blendshapes: Array.isArray(value.blendshapes)
      ? value.blendshapes.map(parseBlendshape).filter(Boolean)
      : [],
    bucket: parseBucket(value.bucket),
    notes: Array.isArray(value.notes) ? value.notes.map(String) : [],
    warnings: Array.isArray(value.warnings) ? value.warnings.map(String) : [],
    previewDataUrl: typeof value.previewDataUrl === "string" ? value.previewDataUrl : null,
  }
}

function parseLandmarkPoint(value: unknown, fallbackIndex: number): LandmarkPoint {
  if (!isRecord(value)) {
    return { index: fallbackIndex, x: 0, y: 0, z: 0 }
  }

  return {
    index: Number.isInteger(value.index) ? Number(value.index) : fallbackIndex,
    x: toNumber(value.x),
    y: toNumber(value.y),
    z: toNumber(value.z),
  }
}

function parsePose(value: unknown): Pose | null {
  if (!isRecord(value)) {
    return null
  }

  return {
    yaw: toNumber(value.yaw),
    pitch: toNumber(value.pitch),
    roll: toNumber(value.roll),
  }
}

function parseBlendshape(value: unknown): BlendshapeCapture {
  if (!isRecord(value)) {
    return { categoryName: "", score: 0 }
  }

  return {
    categoryName: String(value.categoryName ?? ""),
    score: toNumber(value.score),
  }
}

function parseMatrixCapture(value: unknown): MatrixCapture | null {
  if (!isRecord(value) || !Array.isArray(value.values)) {
    return null
  }

  return {
    rows: toNumber(value.rows),
    columns: toNumber(value.columns),
    values: value.values.map(toNumber),
    metadata: {
      source: "MediaPipe FaceLandmarker facialTransformationMatrixes[0].data",
      ordering: "row-major",
      indexFormula: "values[row * columns + column]",
      maps: "MediaPipe canonical face to detected face",
    },
  }
}

function parseBucket(value: unknown): CaptureBucket {
  return BUCKETS.includes(value as CaptureBucket) ? (value as CaptureBucket) : "unknown"
}

function getAnalysisInputCaptures(): CaptureRecord[] {
  return state.importedCaptures.length > 0 ? state.importedCaptures : state.captures
}

function getMatrixValues4x4(matrix: MatrixCapture | null): number[] | null {
  if (!matrix || matrix.rows !== 4 || matrix.columns !== 4 || matrix.values.length < 16) {
    return null
  }

  return matrix.values.slice(0, 16)
}

function applyMatrix4(matrix: number[], point: Point3): Point3 {
  const x = matrix[0] * point.x + matrix[1] * point.y + matrix[2] * point.z + matrix[3]
  const y = matrix[4] * point.x + matrix[5] * point.y + matrix[6] * point.z + matrix[7]
  const z = matrix[8] * point.x + matrix[9] * point.y + matrix[10] * point.z + matrix[11]
  const w = matrix[12] * point.x + matrix[13] * point.y + matrix[14] * point.z + matrix[15]

  if (Number.isFinite(w) && Math.abs(w) > EPSILON && Math.abs(w - 1) > EPSILON) {
    return {
      x: x / w,
      y: y / w,
      z: z / w,
    }
  }

  return { x, y, z }
}

function invertMatrix(matrix: number[], size: number): number[] | null {
  const augmented = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size * 2 }, (_, column) => {
      if (column < size) {
        return matrix[row * size + column]
      }
      return column - size === row ? 1 : 0
    }),
  )

  for (let pivot = 0; pivot < size; pivot += 1) {
    let pivotRow = pivot
    for (let row = pivot + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][pivot]) > Math.abs(augmented[pivotRow][pivot])) {
        pivotRow = row
      }
    }

    if (Math.abs(augmented[pivotRow][pivot]) < EPSILON) {
      return null
    }

    if (pivotRow !== pivot) {
      const current = augmented[pivot]
      augmented[pivot] = augmented[pivotRow]
      augmented[pivotRow] = current
    }

    const pivotValue = augmented[pivot][pivot]
    for (let column = 0; column < size * 2; column += 1) {
      augmented[pivot][column] /= pivotValue
    }

    for (let row = 0; row < size; row += 1) {
      if (row === pivot) {
        continue
      }
      const factor = augmented[row][pivot]
      for (let column = 0; column < size * 2; column += 1) {
        augmented[row][column] -= factor * augmented[pivot][column]
      }
    }
  }

  return augmented.flatMap((row) => row.slice(size))
}

function determinant3x3(matrix: number[]): number {
  const a = matrix[0]
  const b = matrix[1]
  const c = matrix[2]
  const d = matrix[4]
  const e = matrix[5]
  const f = matrix[6]
  const g = matrix[8]
  const h = matrix[9]
  const i = matrix[10]

  return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g)
}

function calculateBounds(points: Point3[]): BoundsSummary | null {
  const first = points[0]
  if (!first) {
    return null
  }

  const raw = points.reduce(
    (bounds, point) => ({
      xMin: Math.min(bounds.xMin, point.x),
      xMax: Math.max(bounds.xMax, point.x),
      yMin: Math.min(bounds.yMin, point.y),
      yMax: Math.max(bounds.yMax, point.y),
      zMin: Math.min(bounds.zMin, point.z),
      zMax: Math.max(bounds.zMax, point.z),
    }),
    {
      xMin: first.x,
      xMax: first.x,
      yMin: first.y,
      yMax: first.y,
      zMin: first.z,
      zMax: first.z,
    },
  )

  const width = raw.xMax - raw.xMin
  const height = raw.yMax - raw.yMin

  return {
    ...raw,
    width,
    height,
    zRange: raw.zMax - raw.zMin,
    aspectRatio: height === 0 ? null : width / height,
  }
}

function calculateBoundsCenter(bounds: BoundsSummary): Point3 {
  return {
    x: (bounds.xMin + bounds.xMax) / 2,
    y: (bounds.yMin + bounds.yMax) / 2,
    z: (bounds.zMin + bounds.zMax) / 2,
  }
}

function calculateCentroid(points: Point3[]): Point3 | null {
  return averagePoints(points)
}

function averageBounds(boundsItems: BoundsSummary[]): BoundsSummary | null {
  if (boundsItems.length === 0) {
    return null
  }

  return {
    xMin: averageNumber(boundsItems.map((bounds) => bounds.xMin)) ?? 0,
    xMax: averageNumber(boundsItems.map((bounds) => bounds.xMax)) ?? 0,
    width: averageNumber(boundsItems.map((bounds) => bounds.width)) ?? 0,
    yMin: averageNumber(boundsItems.map((bounds) => bounds.yMin)) ?? 0,
    yMax: averageNumber(boundsItems.map((bounds) => bounds.yMax)) ?? 0,
    height: averageNumber(boundsItems.map((bounds) => bounds.height)) ?? 0,
    zMin: averageNumber(boundsItems.map((bounds) => bounds.zMin)) ?? 0,
    zMax: averageNumber(boundsItems.map((bounds) => bounds.zMax)) ?? 0,
    zRange: averageNumber(boundsItems.map((bounds) => bounds.zRange)) ?? 0,
    aspectRatio: averageNumber(
      boundsItems
        .map((bounds) => bounds.aspectRatio)
        .filter((value): value is number => value !== null),
    ),
  }
}

function getSemanticPoints(points: Point3[]): SemanticPoints {
  const leftEyeCenter =
    averageByIndices(points, LEFT_IRIS_INDICES) ?? averageByIndices(points, LEFT_EYE_INDICES)
  const rightEyeCenter =
    averageByIndices(points, RIGHT_IRIS_INDICES) ?? averageByIndices(points, RIGHT_EYE_INDICES)

  return {
    noseTip: getPointByIndex(points, NOSE_TIP_INDEX),
    eyeCenter:
      leftEyeCenter && rightEyeCenter ? averagePoints([leftEyeCenter, rightEyeCenter]) : null,
    mouthCenter: averageByIndices(points, MOUTH_CENTER_INDICES),
    chin: getPointByIndex(points, CHIN_INDEX),
    leftCheek: getPointByIndex(points, LEFT_CHEEK_INDEX),
    rightCheek: getPointByIndex(points, RIGHT_CHEEK_INDEX),
    leftContour: getPointByIndex(points, LEFT_CONTOUR_INDEX),
    rightContour: getPointByIndex(points, RIGHT_CONTOUR_INDEX),
  }
}

function getZSemanticSummary(points: SemanticPoints): SemanticSummary["z"] {
  return {
    noseTipZ: points.noseTip?.z ?? null,
    eyeCenterZ: points.eyeCenter?.z ?? null,
    mouthCenterZ: points.mouthCenter?.z ?? null,
    chinZ: points.chin?.z ?? null,
    cheekDepthDelta:
      points.leftCheek && points.rightCheek ? points.leftCheek.z - points.rightCheek.z : null,
    contourDepthDelta:
      points.leftContour && points.rightContour
        ? points.leftContour.z - points.rightContour.z
        : null,
  }
}

function averageByIndices(points: Point3[], indices: number[]): Point3 | null {
  const indexedPoints = indices
    .map((index) => getPointByIndex(points, index))
    .filter((point): point is Point3 => Boolean(point))

  if (indexedPoints.length !== indices.length) {
    return null
  }

  return averagePoints(indexedPoints)
}

function getPointByIndex(points: Point3[], index: number): Point3 | null {
  const point = (points as LandmarkPoint[]).find((item) => item.index === index)
  return point ? { x: point.x, y: point.y, z: point.z } : null
}

function averagePoints(points: Point3[]): Point3 | null {
  if (points.length === 0) {
    return null
  }

  return {
    x: sum(points.map((point) => point.x)) / points.length,
    y: sum(points.map((point) => point.y)) / points.length,
    z: sum(points.map((point) => point.z)) / points.length,
  }
}

function calculatePointStability(points: Array<Point3 | null>): PointStability {
  const validPoints = points.filter((point): point is Point3 => Boolean(point))
  const mean = averagePoints(validPoints)

  if (!mean) {
    return {
      mean: null,
      stdDevX: null,
      stdDevY: null,
      stdDevZ: null,
      stdDev3D: null,
      sampleCount: 0,
    }
  }

  const stdDevX = standardDeviation(validPoints.map((point) => point.x)) ?? 0
  const stdDevY = standardDeviation(validPoints.map((point) => point.y)) ?? 0
  const stdDevZ = standardDeviation(validPoints.map((point) => point.z)) ?? 0

  return {
    mean,
    stdDevX,
    stdDevY,
    stdDevZ,
    stdDev3D: Math.hypot(stdDevX, stdDevY, stdDevZ),
    sampleCount: validPoints.length,
  }
}

function countBuckets(captures: CaptureRecord[]): Record<CaptureBucket, number> {
  return BUCKETS.reduce(
    (counts, bucket) => {
      counts[bucket] = captures.filter((capture) => capture.bucket === bucket).length
      return counts
    },
    {} as Record<CaptureBucket, number>,
  )
}

function toStabilityBucket(bucket: CaptureBucket): StabilityBucket {
  if (bucket.startsWith("yawPositive")) {
    return "yawPositive"
  }
  if (bucket.startsWith("yawNegative")) {
    return "yawNegative"
  }
  if (bucket === "front" || bucket === "pitchPositive" || bucket === "pitchNegative" || bucket === "mixedPose") {
    return bucket
  }
  return "unknown"
}

function renderStatusItems(items: Array<[string, string]>): string {
  return items
    .map(
      ([label, value]) => `
        <div class="status-item">
          <span class="status-label">${escapeHtml(label)}</span>
          <span class="status-value">${escapeHtml(value)}</span>
        </div>
      `,
    )
    .join("")
}

function downloadJson(payload: unknown, fileName: string): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  link.click()
  URL.revokeObjectURL(link.href)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : Number(value) || 0
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

function averageNumber(values: number[]): number | null {
  const validValues = values.filter((value) => Number.isFinite(value))
  return validValues.length === 0 ? null : sum(validValues) / validValues.length
}

function standardDeviation(values: number[]): number | null {
  const mean = averageNumber(values)
  if (mean === null) {
    return null
  }

  return Math.sqrt(
    sum(values.map((value) => (value - mean) ** 2)) / Math.max(values.length, 1),
  )
}

function minOrNull(values: number[]): number | null {
  const validValues = values.filter((value) => Number.isFinite(value))
  return validValues.length === 0 ? null : Math.min(...validValues)
}

function maxOrNull(values: number[]): number | null {
  const validValues = values.filter((value) => Number.isFinite(value))
  return validValues.length === 0 ? null : Math.max(...validValues)
}

function vectorLength(point: Point3): number {
  return Math.hypot(point.x, point.y, point.z)
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function formatPose(pose: Pose | null): string {
  if (!pose) {
    return "-"
  }

  return `yaw ${pose.yaw.toFixed(2)} / pitch ${pose.pitch.toFixed(2)} / roll ${pose.roll.toFixed(2)}`
}

function formatLifecycleStatus(status: AppState["cameraStatus"] | AppState["detectorStatus"]): string {
  switch (status) {
    case "idle":
      return "待機中"
    case "starting":
      return "起動中"
    case "running":
      return "起動済み"
    case "initializing":
      return "初期化中"
    case "ready":
      return "準備完了"
    case "error":
      return "エラー"
  }
}

function formatBucket(bucket: CaptureBucket): string {
  switch (bucket) {
    case "front":
      return "front（正面）"
    case "yawPositiveSmall":
      return "yawPositiveSmall（横向き 小）"
    case "yawPositiveMid":
      return "yawPositiveMid（横向き 中）"
    case "yawPositiveStrong":
      return "yawPositiveStrong（横向き 大）"
    case "yawNegativeSmall":
      return "yawNegativeSmall（反対向き 小）"
    case "yawNegativeMid":
      return "yawNegativeMid（反対向き 中）"
    case "yawNegativeStrong":
      return "yawNegativeStrong（反対向き 大）"
    case "pitchPositive":
      return "pitchPositive（上下向き +）"
    case "pitchNegative":
      return "pitchNegative（上下向き -）"
    case "mixedPose":
      return "mixedPose（横向き + 上下向き）"
    case "unknown":
      return "unknown（判定不可）"
  }
}

function formatBucketCounts(counts: Record<CaptureBucket, number>): string {
  return BUCKETS.map((bucket) => `${bucket}: ${counts[bucket] ?? 0}`).join(" / ")
}

function formatRange(range: RangeSummary): string {
  return `${formatNullableNumber(range.min)} / ${formatNullableNumber(range.max)}`
}

function formatNullableNumber(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(6) : "-"
}

function formatPoint(point: Point3 | null): string {
  if (!point) {
    return "-"
  }

  return `${formatNullableNumber(point.x)}, ${formatNullableNumber(point.y)}, ${formatNullableNumber(point.z)}`
}

function formatBoundsSize(bounds: BoundsSummary | null): string {
  if (!bounds) {
    return "-"
  }

  return `${formatNullableNumber(bounds.width)} / ${formatNullableNumber(bounds.height)}`
}

function formatFileTimestamp(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, "0")
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("_") + `_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}

function createCaptureId(index: number): string {
  return `capture_${String(index).padStart(4, "0")}_${Date.now()}`
}

function getElement<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id)
  if (!element) {
    throw new Error(`#${id} is missing`)
  }
  return element as T
}
