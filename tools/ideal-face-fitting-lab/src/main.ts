import "./style.css"

type CaptureBucket =
  | "front"
  | "yawPositive"
  | "yawNegative"
  | "pitchPositive"
  | "pitchNegative"
  | "mixedPose"
  | "unknown"

type SemanticPointName =
  | "headTop"
  | "chin"
  | "leftCheek"
  | "rightCheek"
  | "leftEye"
  | "rightEye"
  | "nose"
  | "mouth"

interface Point2 {
  x: number
  y: number
}

interface Point3 extends Point2 {
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
  rows?: number
  columns?: number
  values?: number[]
  data?: number[]
}

interface CaptureRecord {
  captureId: string
  videoWidth: number
  videoHeight: number
  landmarks: LandmarkPoint[]
  pose: Pose | null
  bucket: string
  blendshapes?: BlendshapeCapture[]
  facialTransformationMatrix?: MatrixCapture | null
  warnings?: string[]
}

interface CapturesPayload {
  schemaVersion?: string
  createdAt?: string
  captures?: CaptureRecord[]
}

interface Bounds2D {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  width: number
  height: number
  centerX: number
  centerY: number
}

interface Bounds2DWithAspectRatio extends Bounds2D {
  aspectRatio: number
}

interface SemanticDefinition {
  name: SemanticPointName
  label: string
  primaryIndices: number[]
  fallbackIndices?: number[]
  weight: number
}

interface SemanticPoint2D extends Point2 {
  name: SemanticPointName
}

type SemanticPointSet2D = Record<SemanticPointName, SemanticPoint2D>

interface NormalizedFrame {
  captureId: string
  bucket: CaptureBucket
  rawBucket: string
  videoWidth: number
  videoHeight: number
  aspectRatio: number
  landmarks: LandmarkPoint[]
  pose: Pose
  blendshapes: BlendshapeCapture[]
  semanticPoints: SemanticPointSet2D | null
  bounds: Bounds2D | null
  warnings: string[]
}

interface SearchSettings {
  maxFrames: number
  targets: Record<CaptureBucket, number>
  includeMixedPose: boolean
  rollWarningDeg: number
  blendshapeWarningScore: number
  zMin: number
  zMax: number
  zStep: number
  pivotZMin: number
  pivotZMax: number
  pivotZStep: number
  topN: number
  focalLength: number
}

interface SourceSummary {
  schemaVersion: string | null
  captureCount: number
  bucketCounts: Record<CaptureBucket, number>
  landmarkCount: {
    expected: number
    min: number | null
    max: number | null
    allExpected: boolean
  }
  matrixAvailableCount: number
  videoSizes: string[]
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

interface SelectedFrameSummary {
  selectedFrameCount: number
  bucketCounts: Record<CaptureBucket, number>
  selectedCaptureIds: string[]
  warnings: string[]
}

interface Base8Points2DSummary {
  sourceFrameCount: number
  bounds: Bounds2D | null
  points: SemanticPointSet2D | null
  semanticIndexDebug: Record<SemanticPointName, number[]>
}

interface Current8CoordinateSpace {
  rawImageNormalizedPoints: string
  sameUnitPoints: string
  points: string
}

interface Current8Metrics {
  aspectRatio: number
  eyeDistance: number
  cheekWidth: number
  noseToEyeCenterX: number
  noseToMouthY: number
  noseX: number
  mouthX: number
  leftCheekX: number
  rightCheekX: number
  leftEyeX: number
  rightEyeX: number
}

interface Current8PointsFrame {
  captureId: string
  bucket: CaptureBucket
  rawBucket: string
  pose: Pose
  videoWidth: number
  videoHeight: number
  coordinateSpace: Current8CoordinateSpace
  points: SemanticPointSet2D
  sameUnitPoints: SemanticPointSet2D
  rawImageNormalizedPoints: SemanticPointSet2D
}

interface Current8BoundsFrame {
  captureId: string
  bucket: CaptureBucket
  pose: Pose
  bounds: Bounds2DWithAspectRatio
}

interface Current8MetricsFrame {
  captureId: string
  bucket: CaptureBucket
  pose: Pose
  metrics: Current8Metrics
  warnings: string[]
}

interface Current8FrameDebug extends Current8PointsFrame {
  bounds: Bounds2DWithAspectRatio
  metrics: Current8Metrics
  warnings: string[]
}

interface Current8BucketSummaryEntry {
  sampleCount: number
  averageBounds: Bounds2DWithAspectRatio | null
  averageAspectRatio: number | null
  minAspectRatio: number | null
  maxAspectRatio: number | null
  averageEyeDistance: number | null
  averageCheekWidth: number | null
  averageNoseX: number | null
  averagePointPositions: Record<SemanticPointName, Point2 | null>
}

interface Current8PoseComparison {
  frontAspectRatio: number | null
  yawPositiveAspectRatio: number | null
  yawNegativeAspectRatio: number | null
  yawPositiveAspectRatioRatioToFront: number | null
  yawNegativeAspectRatioRatioToFront: number | null
  frontCheekWidth: number | null
  yawPositiveCheekWidth: number | null
  yawNegativeCheekWidth: number | null
  frontEyeDistance: number | null
  yawPositiveEyeDistance: number | null
  yawNegativeEyeDistance: number | null
  interpretation: {
    yawPositiveLooksNarrowerThanFront: boolean | null
    yawNegativeLooksNarrowerThanFront: boolean | null
  }
}

interface Current8DebugSummary {
  selectedFrameCount: number
  coordinateSpace: Current8CoordinateSpace
  current8PointsByFrame: Current8PointsFrame[]
  current8BoundsByFrame: Current8BoundsFrame[]
  current8MetricsByFrame: Current8MetricsFrame[]
  current8BucketSummary: Record<CaptureBucket, Current8BucketSummaryEntry>
  current8PoseComparison: Current8PoseComparison
  current8Warnings: string[]
}

interface DepthConvention {
  smallerZ: string
  largerZ: string
  note: string
}

interface FittingCandidate8 {
  zByPointId: Record<SemanticPointName, number>
  pivotZ: number
}

interface CandidateDefinition extends FittingCandidate8 {
  candidateId: string
}

interface FrameEvaluation {
  captureId: string
  bucket: CaptureBucket
  averageSemanticDistance: number
  weightedSemanticDistance: number
  perPointError: Record<SemanticPointName, number>
  totalScore: number
  warnings: string[]
}

type PoseBucketScores = Record<
  "front" | "yawPositive" | "yawNegative" | "pitchPositive" | "pitchNegative" | "mixedPose",
  number | null
>

interface FittingCandidate8Score {
  rank: number
  totalScore: number
  bucketScores: PoseBucketScores
  candidate: FittingCandidate8
}

interface CandidateResult extends CandidateDefinition {
  averageSemanticDistance: number
  weightedSemanticDistance: number
  perPointError: Record<SemanticPointName, number>
  bucketScores: PoseBucketScores
  totalScore: number
  sampleCount: number
  warnings: string[]
  perFrameResults: FrameEvaluation[]
}

interface RankingEntry extends FittingCandidate8Score {
  candidateId: string
  weightedSemanticDistance: number
  averageSemanticDistance: number
  sampleCount: number
  idealFace8Summary?: IdealFace8CandidateSummary
}

interface IdealFace8Source {
  type: "best_candidate"
  pivotZ: number
  zApplication: string
}

interface IdealFace8Point extends Point2 {
  name: SemanticPointName
  z: number
}

interface DepthRelation {
  noseZ: number
  leftCheekZ: number
  rightCheekZ: number
  averageCheekZ: number
  noseIsInFrontOfCheeks: boolean
  leftRightCheekZDelta: number
  leftRightEyeZDelta: number
}

interface IdealFace8CandidateSummary {
  pointCount: number
  zRange: number
  noseZ: number
  leftCheekZ: number
  rightCheekZ: number
  noseIsInFrontOfCheeks: boolean
}

interface IdealFace8Summary extends IdealFace8CandidateSummary {
  bounds: Bounds2D | null
  zMin: number | null
  zMax: number | null
  averageCheekZ: number
  depthRelation: DepthRelation
}

interface BestIdealFace8 {
  schemaVersion: "ideal_face_fitting_lab_ideal_face_8_v1"
  coordinateSpace: "bae_ar_fitting_lab_8point_same_unit_v1"
  depthConvention: DepthConvention
  source: IdealFace8Source
  metadata: {
    intendedNextStep: "interpolate_8point_depth_to_478_debug_candidate"
    semanticPointNames: SemanticPointName[]
    sourceBase2D: "front_bucket_average_same_unit"
    zSource: "candidate_8point_z_grid_search_best_candidate"
  }
  points: IdealFace8Point[]
  summary: IdealFace8Summary
}

interface AnalysisResult {
  schemaVersion: "ideal_face_fitting_lab_analysis_v1"
  analysisVersion: "eight_point_grid_search_v1"
  generatedAt: string
  sourceSummary: SourceSummary
  selectedFrameSummary: SelectedFrameSummary
  base8Points2DSummary: Base8Points2DSummary
  current8Debug: Current8DebugSummary
  current8PointsByFrame: Current8PointsFrame[]
  current8BoundsByFrame: Current8BoundsFrame[]
  current8MetricsByFrame: Current8MetricsFrame[]
  current8BucketSummary: Record<CaptureBucket, Current8BucketSummaryEntry>
  current8PoseComparison: Current8PoseComparison
  depthConvention: DepthConvention
  searchSettings: SearchSettings
  candidateCount: number
  processedCandidateCount: number
  estimatedCandidateCount: number
  topCandidates: RankingEntry[]
  bestCandidate: CandidateResult | null
  bestIdealFace8: BestIdealFace8 | null
  depthRelation: DepthRelation | null
  bucketRanking: Record<CaptureBucket, RankingEntry[]>
  perPointErrorSummary: Record<SemanticPointName, number | null>
  warnings: string[]
}

interface SummaryAnalysisResult {
  schemaVersion: "ideal_face_fitting_lab_analysis_summary_v1"
  analysisVersion: "eight_point_grid_search_v1"
  generatedAt: string
  sourceSummary: SourceSummary
  selectedFrameSummary: SelectedFrameSummary
  base8Points2DSummary: Base8Points2DSummary
  current8BucketSummary: Record<CaptureBucket, Current8BucketSummaryEntry>
  current8PoseComparison: Current8PoseComparison
  current8FrameSample: Current8FrameDebug[]
  depthConvention: DepthConvention
  searchSettings: SearchSettings
  processedCandidateCount: number
  estimatedCandidateCount: number
  topCandidates: RankingEntry[]
  bestCandidate: RankingEntry | null
  bestIdealFace8: BestIdealFace8 | null
  depthRelation: DepthRelation | null
  bucketRanking: Record<CaptureBucket, RankingEntry[]>
  perPointErrorSummary: Record<SemanticPointName, number | null>
  warnings: string[]
}

type SearchProgressStatus = "idle" | "running" | "completed" | "cancelled" | "error"

interface SearchProgressState {
  status: SearchProgressStatus
  processedCandidateCount: number
  estimatedCandidateCount: number
  progressRate: number
  startedAt: string | null
  updatedAt: string | null
  message: string | null
}

interface AppState {
  fileName: string | null
  payload: CapturesPayload | null
  frames: NormalizedFrame[]
  analysis: AnalysisResult | null
  searchWorker: Worker | null
  searchProgress: SearchProgressState
  importMessage: string | null
  copyMessage: string | null
}

const SEMANTIC_DEFINITIONS: SemanticDefinition[] = [
  {
    name: "headTop",
    label: "頭頂",
    primaryIndices: [10],
    weight: 0.75,
  },
  {
    name: "chin",
    label: "顎",
    primaryIndices: [152],
    weight: 1.0,
  },
  {
    name: "leftCheek",
    label: "左頬",
    primaryIndices: [234],
    weight: 1.0,
  },
  {
    name: "rightCheek",
    label: "右頬",
    primaryIndices: [454],
    weight: 1.0,
  },
  {
    name: "leftEye",
    label: "左目中心",
    primaryIndices: [474, 475, 476, 477],
    fallbackIndices: [263, 362],
    weight: 1.45,
  },
  {
    name: "rightEye",
    label: "右目中心",
    primaryIndices: [469, 470, 471, 472],
    fallbackIndices: [33, 133],
    weight: 1.45,
  },
  {
    name: "nose",
    label: "鼻",
    primaryIndices: [4],
    weight: 1.7,
  },
  {
    name: "mouth",
    label: "口中心",
    primaryIndices: [13, 14],
    weight: 1.2,
  },
]

const SEMANTIC_POINT_NAMES = SEMANTIC_DEFINITIONS.map(
  (definition) => definition.name,
) as SemanticPointName[]

const BUCKETS: CaptureBucket[] = [
  "front",
  "yawPositive",
  "yawNegative",
  "pitchPositive",
  "pitchNegative",
  "mixedPose",
  "unknown",
]

const REQUIRED_BUCKETS: CaptureBucket[] = [
  "front",
  "yawPositive",
  "yawNegative",
  "pitchPositive",
  "pitchNegative",
]

const DEFAULT_SETTINGS: SearchSettings = {
  maxFrames: 30,
  targets: {
    front: 5,
    yawPositive: 5,
    yawNegative: 5,
    pitchPositive: 5,
    pitchNegative: 5,
    mixedPose: 3,
    unknown: 0,
  },
  includeMixedPose: true,
  rollWarningDeg: 12,
  blendshapeWarningScore: 0.35,
  zMin: -0.24,
  zMax: 0.24,
  zStep: 0.24,
  pivotZMin: -0.48,
  pivotZMax: 0.48,
  pivotZStep: 0.24,
  topN: 20,
  focalLength: 2.6,
}

const EPSILON = 1e-8
const DEPTH_CONVENTION: DepthConvention = {
  smallerZ: "front / 手前",
  largerZ: "back / 奥",
  note: "このラボでは z が小さいほど手前、z が大きいほど奥として扱います。",
}
const CURRENT8_COORDINATE_SPACE: Current8CoordinateSpace = {
  rawImageNormalizedPoints: "mediapipe_image_normalized_xy_v1",
  sameUnitPoints: "bae_ar_fitting_lab_same_unit_xy_v1",
  points: "sameUnitPoints / fitting input space",
}

function createIdleSearchProgress(): SearchProgressState {
  return {
    status: "idle",
    processedCandidateCount: 0,
    estimatedCandidateCount: 0,
    progressRate: 0,
    startedAt: null,
    updatedAt: null,
    message: null,
  }
}

const state: AppState = {
  fileName: null,
  payload: null,
  frames: [],
  analysis: null,
  searchWorker: null,
  searchProgress: createIdleSearchProgress(),
  importMessage: null,
  copyMessage: null,
}

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <main class="app">
    <header class="header">
      <div class="title-block">
        <h1>理想顔フィッティング検証ラボ</h1>
        <p>正面基準 x / y を固定し、8 semantic points それぞれの z と pivotZ だけを探索して、capture frame の current 2D landmarks 8点との誤差でランキングする検証ラボです。</p>
      </div>
      <div class="status-pill">debug lab / production asset ではありません</div>
    </header>

    <section class="notice">
      この tool は正式な IdealFace asset 作成ツールではありません。alignmentMode / weighted_similarity_2d / zProfile / zScale は今回の主導線から外し、8点の z と pivotZ の候補を pose へ回転・投影して評価します。
      <ul>
        <li>対象は 8 semantic points: 頭頂、顎、左右頬、左右目、鼻、口です。</li>
        <li>Runtime Projection / Studio Projection / IdealFace Authoring Tool Step 2-I は変更しません。</li>
        <li>current 2D landmarks は各 frame の顔 bounds center を原点にした same-unit 座標で比較します。</li>
      </ul>
    </section>

    <div class="layout">
      <div class="stack">
        <section class="panel">
          <h2>入力</h2>
          <p class="panel-help">MediaPipe Canonical Lab の captured JSON を読み込みます。478 landmarks / pose / bucket / video size / blendshapes / matrix を解釈します。</p>
          <input id="capture-file-input" type="file" accept="application/json,.json" />
          <div class="controls-wide">
            <button id="run-analysis-button" class="primary" type="button" disabled>解析実行</button>
            <button id="cancel-analysis-button" type="button" disabled>キャンセル</button>
            <button id="copy-debug-button" type="button" disabled>デバッグ情報をコピー</button>
          </div>
          <p id="import-message" class="copy-status"></p>
          <p id="copy-message" class="copy-status"></p>
        </section>

        <section class="panel">
          <h2>探索設定</h2>
          <div class="controls">
            <label>maxFrames
              <input id="max-frames-input" type="number" min="1" max="120" value="${DEFAULT_SETTINGS.maxFrames}" />
            </label>
            <label>front target
              <input id="target-front-input" type="number" min="0" max="30" value="${DEFAULT_SETTINGS.targets.front}" />
            </label>
            <label>yawPositive target
              <input id="target-yaw-positive-input" type="number" min="0" max="30" value="${DEFAULT_SETTINGS.targets.yawPositive}" />
            </label>
            <label>yawNegative target
              <input id="target-yaw-negative-input" type="number" min="0" max="30" value="${DEFAULT_SETTINGS.targets.yawNegative}" />
            </label>
            <label>pitchPositive target
              <input id="target-pitch-positive-input" type="number" min="0" max="30" value="${DEFAULT_SETTINGS.targets.pitchPositive}" />
            </label>
            <label>pitchNegative target
              <input id="target-pitch-negative-input" type="number" min="0" max="30" value="${DEFAULT_SETTINGS.targets.pitchNegative}" />
            </label>
            <label>mixedPose target
              <input id="target-mixed-input" type="number" min="0" max="30" value="${DEFAULT_SETTINGS.targets.mixedPose}" />
            </label>
            <label>mixedPose
              <select id="include-mixed-select">
                <option value="true" selected>採用する</option>
                <option value="false">採用しない</option>
              </select>
            </label>
            <label>roll warning deg
              <input id="roll-warning-input" type="number" min="0" max="90" step="1" value="${DEFAULT_SETTINGS.rollWarningDeg}" />
            </label>
            <label>blendshape warning
              <input id="blendshape-warning-input" type="number" min="0" max="1" step="0.05" value="${DEFAULT_SETTINGS.blendshapeWarningScore}" />
            </label>
            <label>zMin
              <input id="z-min-input" type="number" min="-3" max="3" step="0.01" value="${DEFAULT_SETTINGS.zMin}" />
            </label>
            <label>zMax
              <input id="z-max-input" type="number" min="-3" max="3" step="0.01" value="${DEFAULT_SETTINGS.zMax}" />
            </label>
            <label>zStep
              <input id="z-step-input" type="number" min="0.001" max="3" step="0.01" value="${DEFAULT_SETTINGS.zStep}" />
            </label>
            <label>pivotZMin
              <input id="pivot-z-min-input" type="number" min="-3" max="3" step="0.01" value="${DEFAULT_SETTINGS.pivotZMin}" />
            </label>
            <label>pivotZMax
              <input id="pivot-z-max-input" type="number" min="-3" max="3" step="0.01" value="${DEFAULT_SETTINGS.pivotZMax}" />
            </label>
            <label>pivotZStep
              <input id="pivot-z-step-input" type="number" min="0.001" max="3" step="0.01" value="${DEFAULT_SETTINGS.pivotZStep}" />
            </label>
            <label>topN
              <input id="top-n-input" type="number" min="1" max="200" step="1" value="${DEFAULT_SETTINGS.topN}" />
            </label>
            <label>focalLength
              <input id="focal-length-input" type="number" min="0.5" max="10" step="0.1" value="${DEFAULT_SETTINGS.focalLength}" />
            </label>
          </div>
        </section>

        <section class="panel">
          <h2>semantic point mapping</h2>
          <div id="semantic-index-table" class="table-wrap"></div>
        </section>
      </div>

      <div class="stack">
        <section class="panel">
          <h2>入力概要</h2>
          <div id="source-summary" class="summary-grid"></div>
        </section>

        <section class="panel">
          <h2>探索進捗</h2>
          <div id="search-progress" class="summary-grid"></div>
        </section>

        <section class="panel">
          <h2>base8Points2D summary</h2>
          <div id="base-summary" class="summary-grid"></div>
        </section>

        <section class="panel">
          <h2>Current 8 Points Debug</h2>
          <p class="panel-help">current 8 points は MediaPipe が検出した現在顔478点から8つの意味点だけを取り出したものです。bestIdealFace8 ではありません。横向き時に現在顔8点が縦長になっているかを確認する debug です。</p>
          <div id="current8-overview" class="summary-grid"></div>
          <h3>front vs yaw comparison</h3>
          <div id="current8-pose-comparison" class="summary-grid"></div>
          <h3>bucket別 current8 summary</h3>
          <div id="current8-bucket-summary" class="table-wrap"></div>
          <h3>per-frame table</h3>
          <div id="current8-frame-table" class="table-wrap"></div>
        </section>

        <section class="panel">
          <h2>candidate ranking</h2>
          <div id="ranking-table" class="table-wrap"></div>
        </section>

        <section class="panel">
          <h2>best candidate</h2>
          <div id="best-candidate" class="summary-grid"></div>
        </section>

        <section class="panel">
          <h2>bestIdealFace8</h2>
          <p class="panel-help">正面基準 x / y と bestCandidate の z から作る 8点の IdealFace3D debug artifact です。</p>
          <div id="best-ideal-face8-summary" class="summary-grid"></div>
          <div id="best-ideal-face8-table" class="table-wrap"></div>
        </section>

        <section class="panel">
          <h2>depthRelation</h2>
          <div id="depth-relation" class="summary-grid"></div>
        </section>

        <section class="panel">
          <h2>bucket ranking</h2>
          <div id="bucket-ranking" class="table-wrap"></div>
        </section>

        <section class="panel">
          <h2>error summary</h2>
          <div id="error-summary" class="mini-grid"></div>
        </section>

        <section class="panel">
          <h2>warnings</h2>
          <div id="warnings" class="warning-list"></div>
        </section>

        <section class="panel">
          <h2>JSON preview</h2>
          <div class="controls-wide">
            <button id="export-full-button" type="button" disabled>Export Full Fitting JSON</button>
            <button id="export-summary-button" type="button" disabled>Export Summary JSON</button>
          </div>
          <pre id="json-preview" class="json-preview"></pre>
        </section>
      </div>
    </div>
  </main>
`

renderSemanticMapping()
renderEmptyState()
renderSearchProgress()
bindEvents()

function bindEvents(): void {
  getElement<HTMLInputElement>("capture-file-input").addEventListener("change", handleFileImport)
  getElement<HTMLButtonElement>("run-analysis-button").addEventListener("click", runAnalysis)
  getElement<HTMLButtonElement>("cancel-analysis-button").addEventListener("click", cancelAnalysis)
  getElement<HTMLButtonElement>("copy-debug-button").addEventListener("click", copySummaryJson)
  getElement<HTMLButtonElement>("export-full-button").addEventListener("click", () => {
    if (state.analysis) {
      downloadJson(state.analysis, createFileName("ideal-face-fitting-full"))
    }
  })
  getElement<HTMLButtonElement>("export-summary-button").addEventListener("click", () => {
    if (state.analysis) {
      downloadJson(createSummaryAnalysis(state.analysis), createFileName("ideal-face-fitting-summary"))
    }
  })
}

async function handleFileImport(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }

  terminateSearchWorker()
  state.searchProgress = createIdleSearchProgress()

  try {
    const payload = JSON.parse(await file.text()) as unknown
    const captures = extractCaptures(payload)
    const settings = readSettings()
    const frames = captures.map((capture) => normalizeFrame(capture, settings))

    state.fileName = file.name
    state.payload = isRecord(payload) ? (payload as CapturesPayload) : { captures }
    state.frames = frames
    state.analysis = null
    state.searchProgress = createIdleSearchProgress()
    state.importMessage = `${file.name} を読み込みました: ${captures.length} captures`
    state.copyMessage = null
    setButtons()
    renderSourceOnly()
    renderSearchProgress()
  } catch (error) {
    state.importMessage = `読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`
    state.payload = null
    state.frames = []
    state.analysis = null
    state.searchProgress = createIdleSearchProgress()
    setButtons()
    renderEmptyState()
    renderSearchProgress()
  }
}

function runAnalysis(): void {
  if (state.frames.length === 0 || state.searchProgress.status === "running") {
    return
  }

  const settings = readSettings()
  const sourceSummary = summarizeSource(state.payload, state.frames)
  const selected = selectFrames(state.frames, settings)
  const base8Points2DSummary = buildBase8Points2D(selected.frames)
  const current8Debug = buildCurrent8Debug(selected.frames, settings)
  const warnings = [
    ...selected.summary.warnings,
    ...state.frames.flatMap((frame) => frame.warnings),
    ...current8Debug.current8Warnings,
  ]

  if (!base8Points2DSummary.points) {
    state.analysis = {
      schemaVersion: "ideal_face_fitting_lab_analysis_v1",
      analysisVersion: "eight_point_grid_search_v1",
      generatedAt: new Date().toISOString(),
      sourceSummary,
      selectedFrameSummary: selected.summary,
      base8Points2DSummary,
      current8Debug,
      current8PointsByFrame: current8Debug.current8PointsByFrame,
      current8BoundsByFrame: current8Debug.current8BoundsByFrame,
      current8MetricsByFrame: current8Debug.current8MetricsByFrame,
      current8BucketSummary: current8Debug.current8BucketSummary,
      current8PoseComparison: current8Debug.current8PoseComparison,
      depthConvention: DEPTH_CONVENTION,
      searchSettings: settings,
      candidateCount: 0,
      processedCandidateCount: 0,
      estimatedCandidateCount: 0,
      topCandidates: [],
      bestCandidate: null,
      bestIdealFace8: null,
      depthRelation: null,
      bucketRanking: emptyBucketRanking(),
      perPointErrorSummary: emptyPointSummary(),
      warnings: [...warnings, "front bucket の usable frame が不足しているため base8Points2D を作れません。"],
    }
    state.searchProgress = createIdleSearchProgress()
    renderAnalysis()
    renderSearchProgress()
    return
  }

  const estimatedCandidateCount = estimateCandidateCount(settings)
  state.analysis = null
  state.searchProgress = {
    status: "running",
    processedCandidateCount: 0,
    estimatedCandidateCount,
    progressRate: 0,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    message: "Worker で探索中です。",
  }
  state.importMessage = `${estimatedCandidateCount} candidates を Worker で探索中です。`

  startSearchWorker({
    settings,
    selected,
    sourceSummary,
    base8Points2DSummary,
    current8Debug,
    warnings,
  })
  setButtons()
  renderSourceOnly()
  renderSearchProgress()
}
interface SearchWorkerContext {
  settings: SearchSettings
  selected: { frames: NormalizedFrame[]; summary: SelectedFrameSummary }
  sourceSummary: SourceSummary
  base8Points2DSummary: Base8Points2DSummary
  current8Debug: Current8DebugSummary
  warnings: string[]
}

function startSearchWorker(context: SearchWorkerContext): void {
  terminateSearchWorker()

  const worker = new Worker(new URL("./searchWorker.ts", import.meta.url), {
    type: "module",
  })
  state.searchWorker = worker

  worker.onmessage = (event: MessageEvent): void => {
    const message = event.data
    if (!isRecord(message) || typeof message.type !== "string") {
      return
    }

    if (message.type === "progress") {
      updateSearchProgressFromWorker(message)
      return
    }

    if (message.type === "cancelled") {
      updateSearchProgressFromWorker(message)
      state.searchProgress.status = "cancelled"
      state.searchProgress.message = "探索をキャンセルしました。"
      terminateSearchWorker()
      setButtons()
      renderSearchProgress()
      return
    }

    if (message.type === "error") {
      state.searchProgress = {
        ...state.searchProgress,
        status: "error",
        updatedAt: new Date().toISOString(),
        message: String(message.error ?? "Worker search failed"),
      }
      terminateSearchWorker()
      setButtons()
      renderSearchProgress()
      return
    }

    if (message.type === "complete") {
      completeSearchFromWorker(context, message)
    }
  }

  worker.onerror = (error): void => {
    state.searchProgress = {
      ...state.searchProgress,
      status: "error",
      updatedAt: new Date().toISOString(),
      message: error.message,
    }
    terminateSearchWorker()
    setButtons()
    renderSearchProgress()
  }

  worker.postMessage({
    type: "start",
    basePoints: context.base8Points2DSummary.points,
    frames: createWorkerFrames(context.selected.frames),
    settings: context.settings,
  })
}

function completeSearchFromWorker(context: SearchWorkerContext, message: Record<string, unknown>): void {
  const topCandidates = normalizeRankingEntries(message.topCandidates)
  const bucketRanking = normalizeBucketRanking(message.bucketRanking)
  const bestCandidate = isRecord(message.bestCandidate)
    ? (message.bestCandidate as unknown as CandidateResult)
    : null
  const bestIdealFace8 =
    bestCandidate && context.base8Points2DSummary.points
      ? buildBestIdealFace8(context.base8Points2DSummary.points, bestCandidate)
      : null
  const processedCandidateCount = toNumber(message.processedCandidateCount, 0)
  const estimatedCandidateCount = toNumber(message.estimatedCandidateCount, processedCandidateCount)

  state.analysis = {
    schemaVersion: "ideal_face_fitting_lab_analysis_v1",
    analysisVersion: "eight_point_grid_search_v1",
    generatedAt: new Date().toISOString(),
    sourceSummary: context.sourceSummary,
    selectedFrameSummary: context.selected.summary,
    base8Points2DSummary: context.base8Points2DSummary,
    current8Debug: context.current8Debug,
    current8PointsByFrame: context.current8Debug.current8PointsByFrame,
    current8BoundsByFrame: context.current8Debug.current8BoundsByFrame,
    current8MetricsByFrame: context.current8Debug.current8MetricsByFrame,
    current8BucketSummary: context.current8Debug.current8BucketSummary,
    current8PoseComparison: context.current8Debug.current8PoseComparison,
    depthConvention: DEPTH_CONVENTION,
    searchSettings: context.settings,
    candidateCount: estimatedCandidateCount,
    processedCandidateCount,
    estimatedCandidateCount,
    topCandidates: topCandidates.map((candidate) =>
      attachIdealFace8Summary(candidate, context.base8Points2DSummary.points),
    ),
    bestCandidate,
    bestIdealFace8,
    depthRelation: bestIdealFace8?.summary.depthRelation ?? null,
    bucketRanking: Object.fromEntries(
      BUCKETS.map((bucket) => [
        bucket,
        bucketRanking[bucket].map((candidate) =>
          attachIdealFace8Summary(candidate, context.base8Points2DSummary.points),
        ),
      ]),
    ) as Record<CaptureBucket, RankingEntry[]>,
    perPointErrorSummary: bestCandidate ? bestCandidate.perPointError : emptyPointSummary(),
    warnings: [
      ...new Set([
        ...context.warnings,
        ...normalizeStringArray(message.warnings),
        "8点の z / pivotZ は debug 探索候補です。production IdealFace478 の確定値ではありません。",
      ]),
    ],
  }

  state.searchProgress = {
    status: "completed",
    processedCandidateCount,
    estimatedCandidateCount,
    progressRate: calculateProgressRate(processedCandidateCount, estimatedCandidateCount),
    startedAt: state.searchProgress.startedAt,
    updatedAt: new Date().toISOString(),
    message: "探索が完了しました。",
  }
  state.importMessage = `${processedCandidateCount} candidates を評価しました。`
  terminateSearchWorker()
  setButtons()
  renderAnalysis()
  renderSearchProgress()
}

function cancelAnalysis(): void {
  if (state.searchProgress.status !== "running" || !state.searchWorker) {
    return
  }
  state.searchWorker.postMessage({ type: "cancel" })
  state.searchProgress = {
    ...state.searchProgress,
    updatedAt: new Date().toISOString(),
    message: "キャンセル中です。",
  }
  setButtons()
  renderSearchProgress()
}

function terminateSearchWorker(): void {
  if (state.searchWorker) {
    state.searchWorker.terminate()
    state.searchWorker = null
  }
}

function updateSearchProgressFromWorker(message: Record<string, unknown>): void {
  const processedCandidateCount = toNumber(message.processedCandidateCount, 0)
  const estimatedCandidateCount = toNumber(message.estimatedCandidateCount, 0)
  state.searchProgress = {
    ...state.searchProgress,
    status: "running",
    processedCandidateCount,
    estimatedCandidateCount,
    progressRate: calculateProgressRate(processedCandidateCount, estimatedCandidateCount),
    updatedAt: new Date().toISOString(),
    message: "Worker で探索中です。",
  }
  renderSearchProgress()
}

function createWorkerFrames(frames: NormalizedFrame[]): Array<{
  captureId: string
  bucket: CaptureBucket
  pose: Pose
  semanticPoints: SemanticPointSet2D
  bounds: Bounds2D
  warnings: string[]
}> {
  return frames
    .filter((frame) => frame.semanticPoints && frame.bounds)
    .map((frame) => ({
      captureId: frame.captureId,
      bucket: frame.bucket,
      pose: frame.pose,
      semanticPoints: frame.semanticPoints!,
      bounds: frame.bounds!,
      warnings: frame.warnings,
    }))
}

function normalizeRankingEntries(value: unknown): RankingEntry[] {
  return Array.isArray(value) ? (value as RankingEntry[]) : []
}

function normalizeBucketRanking(value: unknown): Record<CaptureBucket, RankingEntry[]> {
  const source = isRecord(value) ? value : {}
  return Object.fromEntries(
    BUCKETS.map((bucket) => [bucket, normalizeRankingEntries(source[bucket])]),
  ) as Record<CaptureBucket, RankingEntry[]>
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : []
}

function estimateCandidateCount(settings: SearchSettings): number {
  const zCount = createNumericCandidates(settings.zMin, settings.zMax, settings.zStep).length
  const pivotZCount = createNumericCandidates(
    settings.pivotZMin,
    settings.pivotZMax,
    settings.pivotZStep,
  ).length
  return zCount ** SEMANTIC_POINT_NAMES.length * pivotZCount
}

function calculateProgressRate(processed: number, total: number): number {
  if (total <= 0) {
    return 0
  }
  return round(Math.min(1, processed / total))
}
function readSettings(): SearchSettings {
  return {
    ...DEFAULT_SETTINGS,
    maxFrames: readNumber("max-frames-input", DEFAULT_SETTINGS.maxFrames),
    targets: {
      front: readNumber("target-front-input", DEFAULT_SETTINGS.targets.front),
      yawPositive: readNumber("target-yaw-positive-input", DEFAULT_SETTINGS.targets.yawPositive),
      yawNegative: readNumber("target-yaw-negative-input", DEFAULT_SETTINGS.targets.yawNegative),
      pitchPositive: readNumber(
        "target-pitch-positive-input",
        DEFAULT_SETTINGS.targets.pitchPositive,
      ),
      pitchNegative: readNumber(
        "target-pitch-negative-input",
        DEFAULT_SETTINGS.targets.pitchNegative,
      ),
      mixedPose: readNumber("target-mixed-input", DEFAULT_SETTINGS.targets.mixedPose),
      unknown: 0,
    },
    includeMixedPose: getElement<HTMLSelectElement>("include-mixed-select").value === "true",
    rollWarningDeg: readNumber("roll-warning-input", DEFAULT_SETTINGS.rollWarningDeg),
    blendshapeWarningScore: readNumber(
      "blendshape-warning-input",
      DEFAULT_SETTINGS.blendshapeWarningScore,
    ),
    zMin: readNumber("z-min-input", DEFAULT_SETTINGS.zMin),
    zMax: readNumber("z-max-input", DEFAULT_SETTINGS.zMax),
    zStep: readNumber("z-step-input", DEFAULT_SETTINGS.zStep),
    pivotZMin: readNumber("pivot-z-min-input", DEFAULT_SETTINGS.pivotZMin),
    pivotZMax: readNumber("pivot-z-max-input", DEFAULT_SETTINGS.pivotZMax),
    pivotZStep: readNumber("pivot-z-step-input", DEFAULT_SETTINGS.pivotZStep),
    topN: Math.max(1, Math.round(readNumber("top-n-input", DEFAULT_SETTINGS.topN))),
    focalLength: readNumber("focal-length-input", DEFAULT_SETTINGS.focalLength),
  }
}

function extractCaptures(payload: unknown): CaptureRecord[] {
  if (Array.isArray(payload)) {
    return payload.map(normalizeCaptureShape)
  }

  if (isRecord(payload) && Array.isArray(payload.captures)) {
    return payload.captures.map(normalizeCaptureShape)
  }

  throw new Error("captures 配列が見つかりません。")
}

function normalizeCaptureShape(value: unknown): CaptureRecord {
  if (!isRecord(value)) {
    throw new Error("capture record が object ではありません。")
  }

  const landmarks = Array.isArray(value.landmarks)
    ? value.landmarks.map((landmark, index) => normalizeLandmark(landmark, index))
    : []

  return {
    captureId: String(value.captureId ?? value.id ?? `capture_${Math.random().toString(16).slice(2)}`),
    videoWidth: toNumber(value.videoWidth, 0),
    videoHeight: toNumber(value.videoHeight, 0),
    landmarks,
    pose: normalizePose(value.pose),
    bucket: String(value.bucket ?? "unknown"),
    blendshapes: Array.isArray(value.blendshapes)
      ? value.blendshapes.map(normalizeBlendshape)
      : [],
    facialTransformationMatrix: isRecord(value.facialTransformationMatrix)
      ? (value.facialTransformationMatrix as MatrixCapture)
      : null,
    warnings: Array.isArray(value.warnings) ? value.warnings.map(String) : [],
  }
}

function normalizeFrame(capture: CaptureRecord, settings: SearchSettings): NormalizedFrame {
  const bucket = normalizeBucket(capture.bucket)
  const videoWidth = capture.videoWidth > 0 ? capture.videoWidth : 1
  const videoHeight = capture.videoHeight > 0 ? capture.videoHeight : 1
  const aspectRatio = videoWidth / videoHeight
  const pose = capture.pose ?? { yaw: 0, pitch: 0, roll: 0 }
  const bounds = calculateLandmarkBounds(capture.landmarks, aspectRatio)
  const semanticPoints = extractSemanticPoints2D(capture.landmarks, aspectRatio)
  const warnings = [...(capture.warnings ?? [])]

  if (capture.landmarks.length !== 478) {
    warnings.push(`${capture.captureId}: landmarks が 478 点ではありません (${capture.landmarks.length})。`)
  }
  if (!capture.pose) {
    warnings.push(`${capture.captureId}: pose がないため yaw/pitch/roll を 0 として扱います。`)
  }
  if (!semanticPoints) {
    warnings.push(`${capture.captureId}: 8 semantic points をすべて取得できません。`)
  }
  if (Math.abs(pose.roll) > settings.rollWarningDeg) {
    warnings.push(`${capture.captureId}: roll が大きいため alignment 評価に注意が必要です (${formatNumber(pose.roll)} deg)。`)
  }
  const maxBlendshape = Math.max(0, ...capture.blendshapes!.map((item) => item.score))
  if (maxBlendshape > settings.blendshapeWarningScore) {
    warnings.push(`${capture.captureId}: blendshape score が高めです (${formatNumber(maxBlendshape)})。`)
  }

  return {
    captureId: capture.captureId,
    bucket,
    rawBucket: capture.bucket,
    videoWidth,
    videoHeight,
    aspectRatio,
    landmarks: capture.landmarks,
    pose,
    blendshapes: capture.blendshapes ?? [],
    semanticPoints,
    bounds,
    warnings,
  }
}

function selectFrames(
  frames: NormalizedFrame[],
  settings: SearchSettings,
): { frames: NormalizedFrame[]; summary: SelectedFrameSummary } {
  const usableFrames = frames.filter((frame) => frame.semanticPoints && frame.bounds)
  const selected: NormalizedFrame[] = []
  const bucketOrder = settings.includeMixedPose
    ? [...REQUIRED_BUCKETS, "mixedPose" as CaptureBucket]
    : REQUIRED_BUCKETS

  for (const bucket of bucketOrder) {
    const target = settings.targets[bucket] ?? 0
    const bucketFrames = usableFrames.filter((frame) => frame.bucket === bucket).slice(0, target)
    selected.push(...bucketFrames)
  }

  if (selected.length < settings.maxFrames) {
    const selectedIds = new Set(selected.map((frame) => frame.captureId))
    selected.push(
      ...usableFrames
        .filter((frame) => !selectedIds.has(frame.captureId))
        .slice(0, settings.maxFrames - selected.length),
    )
  }

  const capped = selected.slice(0, settings.maxFrames)
  const bucketCounts = countFrameBuckets(capped)
  const warnings: string[] = []

  for (const bucket of REQUIRED_BUCKETS) {
    if (bucketCounts[bucket] < Math.min(settings.targets[bucket], 1)) {
      warnings.push(`${bucket} bucket の selected frame が不足しています。`)
    }
  }

  return {
    frames: capped,
    summary: {
      selectedFrameCount: capped.length,
      bucketCounts,
      selectedCaptureIds: capped.map((frame) => frame.captureId),
      warnings,
    },
  }
}

function buildBase8Points2D(frames: NormalizedFrame[]): Base8Points2DSummary {
  const frontFrames = frames.filter((frame) => frame.bucket === "front" && frame.semanticPoints && frame.bounds)

  if (frontFrames.length === 0) {
    return {
      sourceFrameCount: 0,
      bounds: null,
      points: null,
      semanticIndexDebug: buildSemanticIndexDebug(),
    }
  }

  const boundsCenter = averagePoint2D(
    frontFrames.map((frame) => ({
      x: frame.bounds!.centerX,
      y: frame.bounds!.centerY,
    })),
  )
  const points = {} as SemanticPointSet2D

  for (const name of SEMANTIC_POINT_NAMES) {
    const average = averagePoint2D(frontFrames.map((frame) => frame.semanticPoints![name]))
    points[name] = {
      name,
      x: average.x - boundsCenter.x,
      y: average.y - boundsCenter.y,
    }
  }

  return {
    sourceFrameCount: frontFrames.length,
    bounds: calculateBounds2D(Object.values(points)),
    points,
    semanticIndexDebug: buildSemanticIndexDebug(),
  }
}

function buildCurrent8Debug(
  frames: NormalizedFrame[],
  settings: SearchSettings,
): Current8DebugSummary {
  const frameDebug = frames
    .map((frame) => buildCurrent8FrameDebug(frame, settings))
    .filter((item): item is Current8FrameDebug => Boolean(item))
  const current8BucketSummary = buildCurrent8BucketSummary(frameDebug)
  const current8PoseComparison = buildCurrent8PoseComparison(current8BucketSummary)
  const current8Warnings = buildCurrent8Warnings(
    frameDebug,
    current8BucketSummary,
    current8PoseComparison,
    settings,
  )

  return {
    selectedFrameCount: frames.length,
    coordinateSpace: CURRENT8_COORDINATE_SPACE,
    current8PointsByFrame: frameDebug.map(
      ({
        captureId,
        bucket,
        rawBucket,
        pose,
        videoWidth,
        videoHeight,
        coordinateSpace,
        points,
        sameUnitPoints,
        rawImageNormalizedPoints,
      }) => ({
        captureId,
        bucket,
        rawBucket,
        pose,
        videoWidth,
        videoHeight,
        coordinateSpace,
        points,
        sameUnitPoints,
        rawImageNormalizedPoints,
      }),
    ),
    current8BoundsByFrame: frameDebug.map(({ captureId, bucket, pose, bounds }) => ({
      captureId,
      bucket,
      pose,
      bounds,
    })),
    current8MetricsByFrame: frameDebug.map(({ captureId, bucket, pose, metrics, warnings }) => ({
      captureId,
      bucket,
      pose,
      metrics,
      warnings,
    })),
    current8BucketSummary,
    current8PoseComparison,
    current8Warnings,
  }
}

function buildCurrent8FrameDebug(
  frame: NormalizedFrame,
  settings: SearchSettings,
): Current8FrameDebug | null {
  const sameUnitPoints = frame.semanticPoints
  const rawImageNormalizedPoints = extractRawSemanticPoints2D(frame.landmarks)
  if (!sameUnitPoints || !rawImageNormalizedPoints) {
    return null
  }
  const bounds = calculateBounds2DWithAspectRatio(Object.values(sameUnitPoints))
  const metrics = calculateCurrent8Metrics(sameUnitPoints, bounds)
  const warnings: string[] = []
  if (Math.abs(frame.pose.roll) > settings.rollWarningDeg) {
    warnings.push(
      `current8LargeRollFrame: ${frame.captureId} roll=${formatNumber(frame.pose.roll)}`,
    )
  }
  const maxBlendshape = Math.max(0, ...frame.blendshapes.map((item) => item.score))
  if (maxBlendshape > settings.blendshapeWarningScore) {
    warnings.push(
      `current8HighBlendshapeFrame: ${frame.captureId} maxBlendshape=${formatNumber(maxBlendshape)}`,
    )
  }

  return {
    captureId: frame.captureId,
    bucket: frame.bucket,
    rawBucket: frame.rawBucket,
    pose: roundPose(frame.pose),
    videoWidth: frame.videoWidth,
    videoHeight: frame.videoHeight,
    coordinateSpace: CURRENT8_COORDINATE_SPACE,
    points: roundSemanticPointSet(sameUnitPoints),
    sameUnitPoints: roundSemanticPointSet(sameUnitPoints),
    rawImageNormalizedPoints: roundSemanticPointSet(rawImageNormalizedPoints),
    bounds: roundBounds2DWithAspectRatio(bounds),
    metrics: roundCurrent8Metrics(metrics),
    warnings,
  }
}

function extractRawSemanticPoints2D(landmarks: LandmarkPoint[]): SemanticPointSet2D | null {
  const points = {} as SemanticPointSet2D
  for (const definition of SEMANTIC_DEFINITIONS) {
    const point =
      averageByIndices(landmarks, definition.primaryIndices) ??
      (definition.fallbackIndices ? averageByIndices(landmarks, definition.fallbackIndices) : null)
    if (!point) {
      return null
    }
    points[definition.name] = {
      name: definition.name,
      x: point.x,
      y: point.y,
    }
  }
  return points
}

function calculateBounds2DWithAspectRatio(points: Point2[]): Bounds2DWithAspectRatio {
  const bounds = calculateBounds2D(points)
  return {
    ...bounds,
    aspectRatio: bounds.height > EPSILON ? bounds.width / bounds.height : 0,
  }
}

function calculateCurrent8Metrics(
  points: SemanticPointSet2D,
  bounds: Bounds2DWithAspectRatio,
): Current8Metrics {
  const eyeCenterX = (points.leftEye.x + points.rightEye.x) / 2
  return {
    aspectRatio: bounds.aspectRatio,
    eyeDistance: distance2D(points.leftEye, points.rightEye),
    cheekWidth: Math.abs(points.rightCheek.x - points.leftCheek.x),
    noseToEyeCenterX: points.nose.x - eyeCenterX,
    noseToMouthY: points.mouth.y - points.nose.y,
    noseX: points.nose.x,
    mouthX: points.mouth.x,
    leftCheekX: points.leftCheek.x,
    rightCheekX: points.rightCheek.x,
    leftEyeX: points.leftEye.x,
    rightEyeX: points.rightEye.x,
  }
}

function buildCurrent8BucketSummary(
  frames: Current8FrameDebug[],
): Record<CaptureBucket, Current8BucketSummaryEntry> {
  return Object.fromEntries(
    BUCKETS.map((bucket) => {
      const bucketFrames = frames.filter((frame) => frame.bucket === bucket)
      return [bucket, summarizeCurrent8Bucket(bucketFrames)]
    }),
  ) as Record<CaptureBucket, Current8BucketSummaryEntry>
}

function summarizeCurrent8Bucket(frames: Current8FrameDebug[]): Current8BucketSummaryEntry {
  const aspectRatios = frames.map((frame) => frame.metrics.aspectRatio)
  return {
    sampleCount: frames.length,
    averageBounds: averageCurrent8Bounds(frames),
    averageAspectRatio: roundNullable(average(aspectRatios)),
    minAspectRatio: roundNullable(min(aspectRatios)),
    maxAspectRatio: roundNullable(max(aspectRatios)),
    averageEyeDistance: roundNullable(average(frames.map((frame) => frame.metrics.eyeDistance))),
    averageCheekWidth: roundNullable(average(frames.map((frame) => frame.metrics.cheekWidth))),
    averageNoseX: roundNullable(average(frames.map((frame) => frame.metrics.noseX))),
    averagePointPositions: averageCurrent8PointPositions(frames),
  }
}

function averageCurrent8Bounds(frames: Current8FrameDebug[]): Bounds2DWithAspectRatio | null {
  if (frames.length === 0) {
    return null
  }
  return roundBounds2DWithAspectRatio({
    xMin: average(frames.map((frame) => frame.bounds.xMin)) ?? 0,
    xMax: average(frames.map((frame) => frame.bounds.xMax)) ?? 0,
    yMin: average(frames.map((frame) => frame.bounds.yMin)) ?? 0,
    yMax: average(frames.map((frame) => frame.bounds.yMax)) ?? 0,
    width: average(frames.map((frame) => frame.bounds.width)) ?? 0,
    height: average(frames.map((frame) => frame.bounds.height)) ?? 0,
    centerX: average(frames.map((frame) => frame.bounds.centerX)) ?? 0,
    centerY: average(frames.map((frame) => frame.bounds.centerY)) ?? 0,
    aspectRatio: average(frames.map((frame) => frame.bounds.aspectRatio)) ?? 0,
  })
}

function averageCurrent8PointPositions(
  frames: Current8FrameDebug[],
): Record<SemanticPointName, Point2 | null> {
  return Object.fromEntries(
    SEMANTIC_POINT_NAMES.map((name) => {
      if (frames.length === 0) {
        return [name, null]
      }
      return [
        name,
        {
          x: round(average(frames.map((frame) => frame.points[name].x)) ?? 0),
          y: round(average(frames.map((frame) => frame.points[name].y)) ?? 0),
        },
      ]
    }),
  ) as Record<SemanticPointName, Point2 | null>
}

function buildCurrent8PoseComparison(
  summary: Record<CaptureBucket, Current8BucketSummaryEntry>,
): Current8PoseComparison {
  const frontAspectRatio = summary.front.averageAspectRatio
  const yawPositiveAspectRatio = summary.yawPositive.averageAspectRatio
  const yawNegativeAspectRatio = summary.yawNegative.averageAspectRatio
  const yawPositiveRatio = safeRatio(yawPositiveAspectRatio, frontAspectRatio)
  const yawNegativeRatio = safeRatio(yawNegativeAspectRatio, frontAspectRatio)

  return {
    frontAspectRatio,
    yawPositiveAspectRatio,
    yawNegativeAspectRatio,
    yawPositiveAspectRatioRatioToFront: yawPositiveRatio,
    yawNegativeAspectRatioRatioToFront: yawNegativeRatio,
    frontCheekWidth: summary.front.averageCheekWidth,
    yawPositiveCheekWidth: summary.yawPositive.averageCheekWidth,
    yawNegativeCheekWidth: summary.yawNegative.averageCheekWidth,
    frontEyeDistance: summary.front.averageEyeDistance,
    yawPositiveEyeDistance: summary.yawPositive.averageEyeDistance,
    yawNegativeEyeDistance: summary.yawNegative.averageEyeDistance,
    interpretation: {
      yawPositiveLooksNarrowerThanFront:
        yawPositiveRatio === null ? null : yawPositiveRatio < 1,
      yawNegativeLooksNarrowerThanFront:
        yawNegativeRatio === null ? null : yawNegativeRatio < 1,
    },
  }
}

function buildCurrent8Warnings(
  frames: Current8FrameDebug[],
  summary: Record<CaptureBucket, Current8BucketSummaryEntry>,
  poseComparison: Current8PoseComparison,
  settings: SearchSettings,
): string[] {
  const warnings: string[] = []
  if (
    poseComparison.yawPositiveAspectRatioRatioToFront === null ||
    poseComparison.yawNegativeAspectRatioRatioToFront === null
  ) {
    warnings.push("current8YawAspectRatioMissing: front / yawPositive / yawNegative の比較に必要な selected frame が不足しています。")
  }
  if (
    poseComparison.interpretation.yawPositiveLooksNarrowerThanFront ||
    poseComparison.interpretation.yawNegativeLooksNarrowerThanFront
  ) {
    warnings.push("current8YawNarrowerThanFront: 横向き bucket の current 8 points が front より細く見えます。")
  }
  for (const bucket of BUCKETS) {
    if (summary[bucket].sampleCount === 0) {
      warnings.push(`current8BucketInsufficientFrames: ${bucket} bucket の current 8 debug sample がありません。`)
    }
  }
  for (const frame of frames) {
    if (Math.abs(frame.pose.roll) > settings.rollWarningDeg) {
      warnings.push(`current8LargeRollFrame: ${frame.captureId}`)
    }
    if (frame.warnings.some((warning) => warning.startsWith("current8HighBlendshapeFrame"))) {
      warnings.push(`current8HighBlendshapeFrame: ${frame.captureId}`)
    }
  }
  return Array.from(new Set(warnings))
}

function createCurrent8FrameSample(
  frames: Current8FrameDebug[],
  maxPerBucket = 2,
): Current8FrameDebug[] {
  return BUCKETS.flatMap((bucket) =>
    frames.filter((frame) => frame.bucket === bucket).slice(0, maxPerBucket),
  )
}

function createNumericCandidates(minValue: number, maxValue: number, stepValue: number): number[] {
  const minCandidate = Math.min(minValue, maxValue)
  const maxCandidate = Math.max(minValue, maxValue)
  const step = Math.max(Math.abs(stepValue), EPSILON)
  const candidates: number[] = []

  for (
    let value = minCandidate, guard = 0;
    value <= maxCandidate + step * 0.5 && guard < 10000;
    value += step, guard += 1
  ) {
    candidates.push(round(value))
  }

  if (candidates.length === 0) {
    return [round(minCandidate)]
  }
  return Array.from(new Set(candidates))
}
function buildBestIdealFace8(
  basePoints: SemanticPointSet2D,
  candidate: CandidateDefinition,
): BestIdealFace8 {
  const points = SEMANTIC_POINT_NAMES.map((name) => {
    const z = candidate.zByPointId[name]
    return {
      name,
      x: round(basePoints[name].x),
      y: round(basePoints[name].y),
      z: round(z),
    }
  })

  return {
    schemaVersion: "ideal_face_fitting_lab_ideal_face_8_v1",
    coordinateSpace: "bae_ar_fitting_lab_8point_same_unit_v1",
    depthConvention: DEPTH_CONVENTION,
    source: {
      type: "best_candidate",
      pivotZ: round(candidate.pivotZ),
      zApplication:
        "points[].z は candidate.zByPointId の値です。pivotZ は projection 用の回転中心奥行きとして source に記録し、点の z には焼き込みません。",
    },
    metadata: {
      intendedNextStep: "interpolate_8point_depth_to_478_debug_candidate",
      semanticPointNames: [...SEMANTIC_POINT_NAMES],
      sourceBase2D: "front_bucket_average_same_unit",
      zSource: "candidate_8point_z_grid_search_best_candidate",
    },
    points,
    summary: summarizeIdealFace8(points),
  }
}

function summarizeIdealFace8(points: IdealFace8Point[]): IdealFace8Summary {
  const zValues = points.map((point) => point.z)
  const zMin = min(zValues)
  const zMax = max(zValues)
  const depthRelation = calculateDepthRelation(points)

  return {
    pointCount: points.length,
    bounds: points.length > 0 ? calculateBounds2D(points) : null,
    zMin,
    zMax,
    zRange: zMin === null || zMax === null ? 0 : round(zMax - zMin),
    noseZ: depthRelation.noseZ,
    leftCheekZ: depthRelation.leftCheekZ,
    rightCheekZ: depthRelation.rightCheekZ,
    averageCheekZ: depthRelation.averageCheekZ,
    noseIsInFrontOfCheeks: depthRelation.noseIsInFrontOfCheeks,
    depthRelation,
  }
}

function summarizeIdealFace8ForCandidate(points: IdealFace8Point[]): IdealFace8CandidateSummary {
  const summary = summarizeIdealFace8(points)
  return {
    pointCount: summary.pointCount,
    zRange: summary.zRange,
    noseZ: summary.noseZ,
    leftCheekZ: summary.leftCheekZ,
    rightCheekZ: summary.rightCheekZ,
    noseIsInFrontOfCheeks: summary.noseIsInFrontOfCheeks,
  }
}

function calculateDepthRelation(points: IdealFace8Point[]): DepthRelation {
  const byName = Object.fromEntries(points.map((point) => [point.name, point])) as Record<
    SemanticPointName,
    IdealFace8Point
  >
  const noseZ = byName.nose.z
  const leftCheekZ = byName.leftCheek.z
  const rightCheekZ = byName.rightCheek.z
  const averageCheekZ = (leftCheekZ + rightCheekZ) / 2

  return {
    noseZ: round(noseZ),
    leftCheekZ: round(leftCheekZ),
    rightCheekZ: round(rightCheekZ),
    averageCheekZ: round(averageCheekZ),
    noseIsInFrontOfCheeks: noseZ < leftCheekZ && noseZ < rightCheekZ,
    leftRightCheekZDelta: round(Math.abs(leftCheekZ - rightCheekZ)),
    leftRightEyeZDelta: round(Math.abs(byName.leftEye.z - byName.rightEye.z)),
  }
}

function attachIdealFace8Summary(
  entry: RankingEntry,
  basePoints: SemanticPointSet2D | null,
): RankingEntry {
  if (!basePoints) {
    return entry
  }
  const candidate: CandidateDefinition = {
    candidateId: entry.candidateId,
    zByPointId: entry.candidate.zByPointId,
    pivotZ: entry.candidate.pivotZ,
  }
  const idealFace8 = buildBestIdealFace8(basePoints, candidate)
  return {
    ...entry,
    idealFace8Summary: summarizeIdealFace8ForCandidate(idealFace8.points),
  }
}

function createSummaryAnalysis(analysis: AnalysisResult): SummaryAnalysisResult {
  return {
    schemaVersion: "ideal_face_fitting_lab_analysis_summary_v1",
    analysisVersion: analysis.analysisVersion,
    generatedAt: analysis.generatedAt,
    sourceSummary: analysis.sourceSummary,
    selectedFrameSummary: analysis.selectedFrameSummary,
    base8Points2DSummary: analysis.base8Points2DSummary,
    current8BucketSummary: analysis.current8BucketSummary,
    current8PoseComparison: analysis.current8PoseComparison,
    current8FrameSample: createCurrent8FrameSample(
      analysis.current8Debug.current8PointsByFrame.map((pointsFrame) => {
        const boundsFrame = analysis.current8BoundsByFrame.find(
          (item) => item.captureId === pointsFrame.captureId,
        )
        const metricsFrame = analysis.current8MetricsByFrame.find(
          (item) => item.captureId === pointsFrame.captureId,
        )
        return {
          ...pointsFrame,
          bounds: boundsFrame?.bounds ?? calculateBounds2DWithAspectRatio(Object.values(pointsFrame.points)),
          metrics:
            metricsFrame?.metrics ??
            calculateCurrent8Metrics(
              pointsFrame.points,
              calculateBounds2DWithAspectRatio(Object.values(pointsFrame.points)),
            ),
          warnings: metricsFrame?.warnings ?? [],
        }
      }),
    ),
    depthConvention: analysis.depthConvention,
    searchSettings: analysis.searchSettings,
    processedCandidateCount: analysis.processedCandidateCount,
    estimatedCandidateCount: analysis.estimatedCandidateCount,
    topCandidates: analysis.topCandidates.slice(0, 20),
    bestCandidate: analysis.bestCandidate
      ? attachIdealFace8Summary(toRankingEntry(analysis.bestCandidate, 1), analysis.base8Points2DSummary.points)
      : null,
    bestIdealFace8: analysis.bestIdealFace8,
    depthRelation: analysis.depthRelation,
    bucketRanking: Object.fromEntries(
      BUCKETS.map((bucket) => [bucket, analysis.bucketRanking[bucket].slice(0, 5)]),
    ) as Record<CaptureBucket, RankingEntry[]>,
    perPointErrorSummary: analysis.perPointErrorSummary,
    warnings: analysis.warnings,
  }
}

async function copySummaryJson(): Promise<void> {
  if (!state.analysis) {
    return
  }
  await navigator.clipboard.writeText(JSON.stringify(createSummaryAnalysis(state.analysis), null, 2))
  state.copyMessage = "Summary JSON をコピーしました。"
  getElement("copy-message").textContent = state.copyMessage
}

function summarizeSource(payload: CapturesPayload | null, frames: NormalizedFrame[]): SourceSummary {
  const landmarkCounts = frames.map((frame) => frame.landmarks.length)
  return {
    schemaVersion: payload?.schemaVersion ?? null,
    captureCount: frames.length,
    bucketCounts: countFrameBuckets(frames),
    landmarkCount: {
      expected: 478,
      min: min(landmarkCounts),
      max: max(landmarkCounts),
      allExpected: landmarkCounts.every((count) => count === 478),
    },
    matrixAvailableCount: frames.filter((frame) => {
      const source = state.payload?.captures?.find((capture) => capture.captureId === frame.captureId)
      return Boolean(source?.facialTransformationMatrix)
    }).length,
    videoSizes: Array.from(new Set(frames.map((frame) => `${frame.videoWidth}x${frame.videoHeight}`))),
    poseRange: {
      yaw: range(frames.map((frame) => frame.pose.yaw)),
      pitch: range(frames.map((frame) => frame.pose.pitch)),
      roll: range(frames.map((frame) => frame.pose.roll)),
    },
  }
}

function renderSourceOnly(): void {
  const sourceSummary = summarizeSource(state.payload, state.frames)
  getElement("import-message").textContent = state.importMessage ?? ""
  getElement("copy-message").textContent = ""
  getElement("source-summary").innerHTML = renderStatusItems([
    ["file", state.fileName ?? "-"],
    ["schemaVersion", sourceSummary.schemaVersion ?? "-"],
    ["frame count", String(sourceSummary.captureCount)],
    ["bucket counts", formatBucketCounts(sourceSummary.bucketCounts)],
    [
      "landmarks",
      `${sourceSummary.landmarkCount.min ?? "-"} - ${sourceSummary.landmarkCount.max ?? "-"}`,
    ],
    ["video sizes", sourceSummary.videoSizes.join(", ") || "-"],
  ])
  getElement("base-summary").innerHTML = `<p class="empty">解析実行後に表示します。</p>`
  getElement("current8-overview").innerHTML = `<p class="empty">解析実行後に表示します。</p>`
  getElement("current8-pose-comparison").innerHTML = `<p class="empty">解析実行後に表示します。</p>`
  getElement("current8-bucket-summary").innerHTML = `<p class="empty">解析実行後に表示します。</p>`
  getElement("current8-frame-table").innerHTML = `<p class="empty">解析実行後に表示します。</p>`
  getElement("ranking-table").innerHTML = `<p class="empty">解析実行後に表示します。</p>`
  getElement("best-candidate").innerHTML = `<p class="empty">解析実行後に表示します。</p>`
  getElement("best-ideal-face8-summary").innerHTML = `<p class="empty">解析実行後に表示します。</p>`
  getElement("best-ideal-face8-table").innerHTML = `<p class="empty">解析実行後に表示します。</p>`
  getElement("depth-relation").innerHTML = renderDepthConvention(DEPTH_CONVENTION)
  getElement("bucket-ranking").innerHTML = `<p class="empty">解析実行後に表示します。</p>`
  getElement("error-summary").innerHTML = `<p class="empty">解析実行後に表示します。</p>`
  getElement("warnings").textContent = state.frames.flatMap((frame) => frame.warnings).join("\n")
  getElement("json-preview").textContent = JSON.stringify(
    {
      importedFile: state.fileName,
      sourceSummary,
      depthConvention: DEPTH_CONVENTION,
      semanticIndexDebug: buildSemanticIndexDebug(),
    },
    null,
    2,
  )
}

function renderAnalysis(): void {
  if (!state.analysis) {
    renderEmptyState()
    return
  }

  const analysis = state.analysis
  getElement("import-message").textContent = state.importMessage ?? ""
  getElement("copy-message").textContent = state.copyMessage ?? ""
  getElement("source-summary").innerHTML = renderStatusItems([
    ["schemaVersion", analysis.sourceSummary.schemaVersion ?? "-"],
    ["frame count", String(analysis.sourceSummary.captureCount)],
    ["selected", String(analysis.selectedFrameSummary.selectedFrameCount)],
    ["bucket counts", formatBucketCounts(analysis.sourceSummary.bucketCounts)],
    ["selected buckets", formatBucketCounts(analysis.selectedFrameSummary.bucketCounts)],
    ["candidate count", String(analysis.candidateCount)],
    ["processed candidates", String(analysis.processedCandidateCount)],
    ["estimated candidates", String(analysis.estimatedCandidateCount)],
  ])
  getElement("base-summary").innerHTML = renderStatusItems([
    ["source frame count", String(analysis.base8Points2DSummary.sourceFrameCount)],
    ["bounds", formatBounds(analysis.base8Points2DSummary.bounds)],
    [
      "points",
      analysis.base8Points2DSummary.points
        ? SEMANTIC_POINT_NAMES.map(
            (name) => `${name}: ${formatNumber(analysis.base8Points2DSummary.points![name].x)}, ${formatNumber(analysis.base8Points2DSummary.points![name].y)}`,
          ).join(" / ")
        : "-",
    ],
    ["index", JSON.stringify(analysis.base8Points2DSummary.semanticIndexDebug)],
  ])
  getElement("current8-overview").innerHTML = renderCurrent8Overview(analysis.current8Debug)
  getElement("current8-pose-comparison").innerHTML = renderCurrent8PoseComparison(
    analysis.current8PoseComparison,
  )
  getElement("current8-bucket-summary").innerHTML = renderCurrent8BucketSummaryTable(
    analysis.current8BucketSummary,
  )
  getElement("current8-frame-table").innerHTML = renderCurrent8FrameTable(
    analysis.current8MetricsByFrame,
  )
  getElement("ranking-table").innerHTML = renderRankingTable(analysis.topCandidates.slice(0, 20))
  getElement("best-candidate").innerHTML = analysis.bestCandidate
    ? renderStatusItems([
        ["candidateId", analysis.bestCandidate.candidateId],
        ["totalScore", formatNumber(analysis.bestCandidate.totalScore)],
        ["weightedSemanticDistance", formatNumber(analysis.bestCandidate.weightedSemanticDistance)],
        ["frontScore", formatNumber(analysis.bestCandidate.bucketScores.front)],
        ["yawPositiveScore", formatNumber(analysis.bestCandidate.bucketScores.yawPositive)],
        ["yawNegativeScore", formatNumber(analysis.bestCandidate.bucketScores.yawNegative)],
        ["pitchPositiveScore", formatNumber(analysis.bestCandidate.bucketScores.pitchPositive)],
        ["pitchNegativeScore", formatNumber(analysis.bestCandidate.bucketScores.pitchNegative)],
        ["mixedPoseScore", formatNumber(analysis.bestCandidate.bucketScores.mixedPose)],
        ["zByPointId", JSON.stringify(roundRecord(analysis.bestCandidate.zByPointId))],
        ["pivotZ", formatNumber(analysis.bestCandidate.pivotZ)],
      ])
    : `<p class="empty">候補がありません。</p>`
  getElement("best-ideal-face8-summary").innerHTML = analysis.bestIdealFace8
    ? renderIdealFace8Summary(analysis.bestIdealFace8)
    : `<p class="empty">bestIdealFace8 はありません。</p>`
  getElement("best-ideal-face8-table").innerHTML = analysis.bestIdealFace8
    ? renderIdealFace8Table(analysis.bestIdealFace8.points)
    : `<p class="empty">bestIdealFace8 はありません。</p>`
  getElement("depth-relation").innerHTML = analysis.depthRelation
    ? renderDepthRelation(analysis.depthRelation, analysis.depthConvention)
    : renderDepthConvention(analysis.depthConvention)
  getElement("bucket-ranking").innerHTML = renderBucketRanking(analysis.bucketRanking)
  getElement("error-summary").innerHTML = renderStatusItems([
    ["perPointError", JSON.stringify(roundRecord(analysis.perPointErrorSummary))],
    [
      "bucketScores",
      analysis.bestCandidate ? JSON.stringify(roundRecord(analysis.bestCandidate.bucketScores)) : "-",
    ],
  ])
  getElement("warnings").textContent = analysis.warnings.length === 0 ? "警告はありません。" : analysis.warnings.join("\n")
  getElement("json-preview").textContent = JSON.stringify(createSummaryAnalysis(analysis), null, 2)
  setButtons()
}

function renderSearchProgress(): void {
  const progress = state.searchProgress
  getElement("search-progress").innerHTML = renderStatusItems([
    ["status", progress.status],
    ["progress", `${formatPercent(progress.progressRate)}%`],
    ["processed candidates", String(progress.processedCandidateCount)],
    ["estimated candidates", String(progress.estimatedCandidateCount)],
    ["startedAt", progress.startedAt ?? "-"],
    ["updatedAt", progress.updatedAt ?? "-"],
    ["message", progress.message ?? "-"],
  ])
}

function renderEmptyState(): void {
  getElement("source-summary").innerHTML = `<p class="empty">captured JSON を読み込んでください。</p>`
  getElement("base-summary").innerHTML = `<p class="empty">未解析です。</p>`
  getElement("current8-overview").innerHTML = `<p class="empty">未解析です。</p>`
  getElement("current8-pose-comparison").innerHTML = `<p class="empty">未解析です。</p>`
  getElement("current8-bucket-summary").innerHTML = `<p class="empty">未解析です。</p>`
  getElement("current8-frame-table").innerHTML = `<p class="empty">未解析です。</p>`
  getElement("ranking-table").innerHTML = `<p class="empty">未解析です。</p>`
  getElement("best-candidate").innerHTML = `<p class="empty">未解析です。</p>`
  getElement("best-ideal-face8-summary").innerHTML = `<p class="empty">未解析です。</p>`
  getElement("best-ideal-face8-table").innerHTML = `<p class="empty">未解析です。</p>`
  getElement("depth-relation").innerHTML = renderDepthConvention(DEPTH_CONVENTION)
  getElement("bucket-ranking").innerHTML = `<p class="empty">未解析です。</p>`
  getElement("error-summary").innerHTML = `<p class="empty">未解析です。</p>`
  getElement("warnings").textContent = ""
  getElement("json-preview").textContent = JSON.stringify(
    {
      schemaVersion: "ideal_face_fitting_lab_analysis_summary_v1",
      depthConvention: DEPTH_CONVENTION,
      semanticIndexDebug: buildSemanticIndexDebug(),
      note: "captured JSON import 後に summary を表示します。",
    },
    null,
    2,
  )
}

function renderSemanticMapping(): void {
  getElement("semantic-index-table").innerHTML = `
    <table>
      <thead>
        <tr>
          <th>semantic point</th>
          <th>表示名</th>
          <th>primary index</th>
          <th>fallback index</th>
          <th>weight</th>
        </tr>
      </thead>
      <tbody>
        ${SEMANTIC_DEFINITIONS.map(
          (definition) => `
            <tr>
              <td><code>${definition.name}</code></td>
              <td>${definition.label}</td>
              <td><code>${definition.primaryIndices.join(", ")}</code></td>
              <td><code>${definition.fallbackIndices?.join(", ") ?? "-"}</code></td>
              <td>${definition.weight}</td>
            </tr>
          `,
        ).join("")}
      </tbody>
    </table>
  `
}

function renderCurrent8Overview(debug: Current8DebugSummary): string {
  return renderStatusItems([
    ["selected frame count", String(debug.selectedFrameCount)],
    ["current8 frame count", String(debug.current8PointsByFrame.length)],
    ["points coordinate", debug.coordinateSpace.points],
    ["rawImageNormalizedPoints", debug.coordinateSpace.rawImageNormalizedPoints],
    ["sameUnitPoints", debug.coordinateSpace.sameUnitPoints],
    ["warnings", debug.current8Warnings.length === 0 ? "-" : debug.current8Warnings.join(" / ")],
  ])
}

function renderCurrent8PoseComparison(comparison: Current8PoseComparison): string {
  return renderStatusItems([
    ["front aspectRatio", formatNumber(comparison.frontAspectRatio)],
    ["yawPositive aspectRatio", formatNumber(comparison.yawPositiveAspectRatio)],
    ["yawNegative aspectRatio", formatNumber(comparison.yawNegativeAspectRatio)],
    [
      "yawPositive / front",
      formatNumber(comparison.yawPositiveAspectRatioRatioToFront),
    ],
    [
      "yawNegative / front",
      formatNumber(comparison.yawNegativeAspectRatioRatioToFront),
    ],
    ["front cheekWidth", formatNumber(comparison.frontCheekWidth)],
    ["yawPositive cheekWidth", formatNumber(comparison.yawPositiveCheekWidth)],
    ["yawNegative cheekWidth", formatNumber(comparison.yawNegativeCheekWidth)],
    ["front eyeDistance", formatNumber(comparison.frontEyeDistance)],
    ["yawPositive eyeDistance", formatNumber(comparison.yawPositiveEyeDistance)],
    ["yawNegative eyeDistance", formatNumber(comparison.yawNegativeEyeDistance)],
    [
      "yawPositive narrower",
      formatBooleanOrNull(comparison.interpretation.yawPositiveLooksNarrowerThanFront),
    ],
    [
      "yawNegative narrower",
      formatBooleanOrNull(comparison.interpretation.yawNegativeLooksNarrowerThanFront),
    ],
  ])
}

function renderCurrent8BucketSummaryTable(
  summary: Record<CaptureBucket, Current8BucketSummaryEntry>,
): string {
  return `
    <table>
      <thead>
        <tr>
          <th>bucket</th>
          <th>sampleCount</th>
          <th>aspectRatio avg</th>
          <th>aspectRatio min</th>
          <th>aspectRatio max</th>
          <th>cheekWidth</th>
          <th>eyeDistance</th>
          <th>noseX</th>
        </tr>
      </thead>
      <tbody>
        ${BUCKETS.map((bucket) => {
          const item = summary[bucket]
          return `
            <tr>
              <td><code>${bucket}</code></td>
              <td>${item.sampleCount}</td>
              <td>${formatNumber(item.averageAspectRatio)}</td>
              <td>${formatNumber(item.minAspectRatio)}</td>
              <td>${formatNumber(item.maxAspectRatio)}</td>
              <td>${formatNumber(item.averageCheekWidth)}</td>
              <td>${formatNumber(item.averageEyeDistance)}</td>
              <td>${formatNumber(item.averageNoseX)}</td>
            </tr>
          `
        }).join("")}
      </tbody>
    </table>
  `
}

function renderCurrent8FrameTable(entries: Current8MetricsFrame[]): string {
  if (entries.length === 0) {
    return `<p class="empty">current 8 frame はありません。</p>`
  }
  return `
    <table>
      <thead>
        <tr>
          <th>captureId</th>
          <th>bucket</th>
          <th>yaw</th>
          <th>pitch</th>
          <th>roll</th>
          <th>aspectRatio</th>
          <th>cheekWidth</th>
          <th>eyeDistance</th>
          <th>noseX</th>
        </tr>
      </thead>
      <tbody>
        ${entries.map(
          (entry) => `
            <tr>
              <td><code>${entry.captureId}</code></td>
              <td><code>${entry.bucket}</code></td>
              <td>${formatNumber(entry.pose.yaw)}</td>
              <td>${formatNumber(entry.pose.pitch)}</td>
              <td>${formatNumber(entry.pose.roll)}</td>
              <td>${formatNumber(entry.metrics.aspectRatio)}</td>
              <td>${formatNumber(entry.metrics.cheekWidth)}</td>
              <td>${formatNumber(entry.metrics.eyeDistance)}</td>
              <td>${formatNumber(entry.metrics.noseX)}</td>
            </tr>
          `,
        ).join("")}
      </tbody>
    </table>
  `
}

function renderIdealFace8Summary(idealFace8: BestIdealFace8): string {
  return renderStatusItems([
    ["schemaVersion", idealFace8.schemaVersion],
    ["coordinateSpace", idealFace8.coordinateSpace],
    ["zApplication", idealFace8.source.zApplication],
    ["pivotZ", formatNumber(idealFace8.source.pivotZ)],
    ["pointCount", String(idealFace8.summary.pointCount)],
    ["bounds", formatBounds(idealFace8.summary.bounds)],
    ["zRange", formatNumber(idealFace8.summary.zRange)],
    ["nextStep", idealFace8.metadata.intendedNextStep],
  ])
}

function renderIdealFace8Table(points: IdealFace8Point[]): string {
  if (points.length === 0) {
    return `<p class="empty">points はありません。</p>`
  }
  return `
    <table>
      <thead>
        <tr>
          <th>name</th>
          <th>x</th>
          <th>y</th>
          <th>z</th>
        </tr>
      </thead>
      <tbody>
        ${points.map(
          (point) => `
            <tr>
              <td><code>${point.name}</code></td>
              <td>${formatNumber(point.x)}</td>
              <td>${formatNumber(point.y)}</td>
              <td>${formatNumber(point.z)}</td>
            </tr>
          `,
        ).join("")}
      </tbody>
    </table>
  `
}

function renderDepthRelation(
  depthRelation: DepthRelation,
  depthConvention: DepthConvention,
): string {
  return renderStatusItems([
    ["depthConvention", `${depthConvention.smallerZ} / ${depthConvention.largerZ}`],
    ["note", depthConvention.note],
    ["noseZ", formatNumber(depthRelation.noseZ)],
    ["leftCheekZ", formatNumber(depthRelation.leftCheekZ)],
    ["rightCheekZ", formatNumber(depthRelation.rightCheekZ)],
    ["averageCheekZ", formatNumber(depthRelation.averageCheekZ)],
    ["noseIsInFrontOfCheeks", String(depthRelation.noseIsInFrontOfCheeks)],
    ["leftRightCheekZDelta", formatNumber(depthRelation.leftRightCheekZDelta)],
    ["leftRightEyeZDelta", formatNumber(depthRelation.leftRightEyeZDelta)],
  ])
}

function renderDepthConvention(depthConvention: DepthConvention): string {
  return renderStatusItems([
    ["smallerZ", depthConvention.smallerZ],
    ["largerZ", depthConvention.largerZ],
    ["note", depthConvention.note],
  ])
}

function renderRankingTable(entries: RankingEntry[]): string {
  if (entries.length === 0) {
    return `<p class="empty">ranking はありません。</p>`
  }
  return `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>candidateId</th>
          <th>totalScore</th>
          <th>front</th>
          <th>yaw+</th>
          <th>yaw-</th>
          <th>pitch+</th>
          <th>pitch-</th>
          <th>mixed</th>
          <th>pivotZ</th>
          ${SEMANTIC_POINT_NAMES.map((name) => `<th>${name}.z</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${entries.map(
          (entry, index) => `
            <tr>
              <td>${entry.rank || index + 1}</td>
              <td><code>${entry.candidateId}</code></td>
              <td>${formatNumber(entry.totalScore)}</td>
              <td>${formatNumber(entry.bucketScores.front)}</td>
              <td>${formatNumber(entry.bucketScores.yawPositive)}</td>
              <td>${formatNumber(entry.bucketScores.yawNegative)}</td>
              <td>${formatNumber(entry.bucketScores.pitchPositive)}</td>
              <td>${formatNumber(entry.bucketScores.pitchNegative)}</td>
              <td>${formatNumber(entry.bucketScores.mixedPose)}</td>
              <td>${formatNumber(entry.candidate.pivotZ)}</td>
              ${SEMANTIC_POINT_NAMES.map(
                (name) => `<td>${formatNumber(entry.candidate.zByPointId[name])}</td>`,
              ).join("")}
            </tr>
          `,
        ).join("")}
      </tbody>
    </table>
  `
}

function renderBucketRanking(bucketRanking: Record<CaptureBucket, RankingEntry[]>): string {
  return `
    <table>
      <thead>
        <tr>
          <th>bucket</th>
          <th>top candidates</th>
        </tr>
      </thead>
      <tbody>
        ${BUCKETS.map(
          (bucket) => `
            <tr>
              <td><code>${bucket}</code></td>
              <td>${bucketRanking[bucket]
                .map(
                  (entry, index) =>
                    `${index + 1}. ${entry.candidateId} / score ${formatNumber(entry.totalScore)}`,
                )
                .join("<br />") || "-"}</td>
            </tr>
          `,
        ).join("")}
      </tbody>
    </table>
  `
}

function setButtons(): void {
  const isRunning = state.searchProgress.status === "running"
  getElement<HTMLButtonElement>("run-analysis-button").disabled = state.frames.length === 0 || isRunning
  getElement<HTMLButtonElement>("cancel-analysis-button").disabled = !isRunning
  getElement<HTMLButtonElement>("copy-debug-button").disabled = !state.analysis || isRunning
  getElement<HTMLButtonElement>("export-full-button").disabled = !state.analysis || isRunning
  getElement<HTMLButtonElement>("export-summary-button").disabled = !state.analysis || isRunning
}

function extractSemanticPoints2D(
  landmarks: LandmarkPoint[],
  aspectRatio: number,
): SemanticPointSet2D | null {
  const points = {} as SemanticPointSet2D
  for (const definition of SEMANTIC_DEFINITIONS) {
    const point =
      averageByIndices(landmarks, definition.primaryIndices) ??
      (definition.fallbackIndices ? averageByIndices(landmarks, definition.fallbackIndices) : null)
    if (!point) {
      return null
    }
    points[definition.name] = {
      name: definition.name,
      x: toSameUnitX(point.x, aspectRatio),
      y: point.y - 0.5,
    }
  }
  return points
}

function calculateLandmarkBounds(landmarks: LandmarkPoint[], aspectRatio: number): Bounds2D | null {
  if (landmarks.length === 0) {
    return null
  }
  return calculateBounds2D(
    landmarks.map((landmark) => ({
      x: toSameUnitX(landmark.x, aspectRatio),
      y: landmark.y - 0.5,
    })),
  )
}

function normalizeBucket(bucket: string): CaptureBucket {
  if (bucket.startsWith("yawPositive")) {
    return "yawPositive"
  }
  if (bucket.startsWith("yawNegative")) {
    return "yawNegative"
  }
  if (
    bucket === "front" ||
    bucket === "pitchPositive" ||
    bucket === "pitchNegative" ||
    bucket === "mixedPose"
  ) {
    return bucket
  }
  return "unknown"
}

function normalizeLandmark(value: unknown, fallbackIndex: number): LandmarkPoint {
  if (!isRecord(value)) {
    return { index: fallbackIndex, x: 0, y: 0, z: 0 }
  }
  return {
    index: toNumber(value.index, fallbackIndex),
    x: toNumber(value.x, 0),
    y: toNumber(value.y, 0),
    z: toNumber(value.z, 0),
  }
}

function normalizePose(value: unknown): Pose | null {
  if (!isRecord(value)) {
    return null
  }
  return {
    yaw: toNumber(value.yaw, 0),
    pitch: toNumber(value.pitch, 0),
    roll: toNumber(value.roll, 0),
  }
}

function normalizeBlendshape(value: unknown): BlendshapeCapture {
  if (!isRecord(value)) {
    return { categoryName: "unknown", score: 0 }
  }
  return {
    categoryName: String(value.categoryName ?? value.name ?? "unknown"),
    score: toNumber(value.score, 0),
  }
}

function toRankingEntry(candidate: CandidateResult, rank: number): RankingEntry {
  return {
    rank,
    candidateId: candidate.candidateId,
    totalScore: round(candidate.totalScore),
    bucketScores: roundRecord(candidate.bucketScores),
    candidate: {
      pivotZ: round(candidate.pivotZ),
      zByPointId: roundRecord(candidate.zByPointId),
    },
    weightedSemanticDistance: round(candidate.weightedSemanticDistance),
    averageSemanticDistance: round(candidate.averageSemanticDistance),
    sampleCount: candidate.sampleCount,
  }
}

function emptyBucketRanking(): Record<CaptureBucket, RankingEntry[]> {
  return {
    front: [],
    yawPositive: [],
    yawNegative: [],
    pitchPositive: [],
    pitchNegative: [],
    mixedPose: [],
    unknown: [],
  }
}

function emptyPointSummary(): Record<SemanticPointName, null> {
  return {
    headTop: null,
    chin: null,
    leftCheek: null,
    rightCheek: null,
    leftEye: null,
    rightEye: null,
    nose: null,
    mouth: null,
  }
}

function buildSemanticIndexDebug(): Record<SemanticPointName, number[]> {
  return Object.fromEntries(
    SEMANTIC_DEFINITIONS.map((definition) => [definition.name, definition.primaryIndices]),
  ) as Record<SemanticPointName, number[]>
}

function averageByIndices(points: LandmarkPoint[], indices: number[]): Point3 | null {
  const indexedPoints = indices
    .map((index) => points.find((point) => point.index === index))
    .filter((point): point is LandmarkPoint => Boolean(point))

  if (indexedPoints.length !== indices.length) {
    return null
  }

  return {
    x: average(indexedPoints.map((point) => point.x)) ?? 0,
    y: average(indexedPoints.map((point) => point.y)) ?? 0,
    z: average(indexedPoints.map((point) => point.z)) ?? 0,
  }
}

function averagePoint2D(points: Point2[]): Point2 {
  return {
    x: average(points.map((point) => point.x)) ?? 0,
    y: average(points.map((point) => point.y)) ?? 0,
  }
}

function calculateBounds2D(points: Point2[]): Bounds2D {
  const xValues = points.map((point) => point.x)
  const yValues = points.map((point) => point.y)
  const xMin = min(xValues) ?? 0
  const xMax = max(xValues) ?? 0
  const yMin = min(yValues) ?? 0
  const yMax = max(yValues) ?? 0
  return {
    xMin,
    xMax,
    yMin,
    yMax,
    width: xMax - xMin,
    height: yMax - yMin,
    centerX: (xMin + xMax) / 2,
    centerY: (yMin + yMax) / 2,
  }
}

function countFrameBuckets(frames: NormalizedFrame[]): Record<CaptureBucket, number> {
  return BUCKETS.reduce(
    (counts, bucket) => {
      counts[bucket] = frames.filter((frame) => frame.bucket === bucket).length
      return counts
    },
    {} as Record<CaptureBucket, number>,
  )
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

function formatBucketCounts(counts: Record<CaptureBucket, number>): string {
  return BUCKETS.map((bucket) => `${bucket}: ${counts[bucket] ?? 0}`).join(" / ")
}

function formatBounds(bounds: Bounds2D | null): string {
  if (!bounds) {
    return "-"
  }
  return `center ${formatNumber(bounds.centerX)}, ${formatNumber(bounds.centerY)} / size ${formatNumber(bounds.width)} x ${formatNumber(bounds.height)}`
}

function toSameUnitX(x: number, aspectRatio: number): number {
  return (x - 0.5) * aspectRatio
}

function safeRatio(value: number | null, base: number | null): number | null {
  if (value === null || base === null || Math.abs(base) <= EPSILON) {
    return null
  }
  return round(value / base)
}

function distance2D(current: Point2, next: Point2): number {
  return Math.hypot(current.x - next.x, current.y - next.y)
}

function range(values: number[]): RangeSummary {
  return {
    min: min(values),
    max: max(values),
  }
}

function min(values: number[]): number | null {
  const finite = values.filter(Number.isFinite)
  return finite.length === 0 ? null : Math.min(...finite)
}

function max(values: number[]): number | null {
  const finite = values.filter(Number.isFinite)
  return finite.length === 0 ? null : Math.max(...finite)
}

function average(values: number[]): number | null {
  const finite = values.filter(Number.isFinite)
  return finite.length === 0
    ? null
    : finite.reduce((total, value) => total + value, 0) / finite.length
}

function readNumber(id: string, fallback: number): number {
  const value = Number(getElement<HTMLInputElement>(id).value)
  return Number.isFinite(value) ? value : fallback
}

function toNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : Number(value) || fallback
}

function round(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : value
}

function roundNullable(value: number | null): number | null {
  return value === null ? null : round(value)
}

function roundPose(pose: Pose): Pose {
  return {
    yaw: round(pose.yaw),
    pitch: round(pose.pitch),
    roll: round(pose.roll),
  }
}

function roundSemanticPointSet(points: SemanticPointSet2D): SemanticPointSet2D {
  const result = {} as SemanticPointSet2D
  for (const name of SEMANTIC_POINT_NAMES) {
    result[name] = {
      name,
      x: round(points[name].x),
      y: round(points[name].y),
    }
  }
  return result
}

function roundBounds2DWithAspectRatio(bounds: Bounds2DWithAspectRatio): Bounds2DWithAspectRatio {
  return {
    xMin: round(bounds.xMin),
    xMax: round(bounds.xMax),
    yMin: round(bounds.yMin),
    yMax: round(bounds.yMax),
    width: round(bounds.width),
    height: round(bounds.height),
    centerX: round(bounds.centerX),
    centerY: round(bounds.centerY),
    aspectRatio: round(bounds.aspectRatio),
  }
}

function roundCurrent8Metrics(metrics: Current8Metrics): Current8Metrics {
  return {
    aspectRatio: round(metrics.aspectRatio),
    eyeDistance: round(metrics.eyeDistance),
    cheekWidth: round(metrics.cheekWidth),
    noseToEyeCenterX: round(metrics.noseToEyeCenterX),
    noseToMouthY: round(metrics.noseToMouthY),
    noseX: round(metrics.noseX),
    mouthX: round(metrics.mouthX),
    leftCheekX: round(metrics.leftCheekX),
    rightCheekX: round(metrics.rightCheekX),
    leftEyeX: round(metrics.leftEyeX),
    rightEyeX: round(metrics.rightEyeX),
  }
}

function roundRecord<T extends Record<string, number | null>>(record: T): T {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      typeof value === "number" ? round(value) : value,
    ]),
  ) as T
}

function formatNumber(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(6) : "-"
}

function formatPercent(value: number): string {
  return Number.isFinite(value) ? (value * 100).toFixed(2) : "0.00"
}

function formatBooleanOrNull(value: boolean | null): string {
  return value === null ? "-" : String(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
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

function createFileName(prefix: string): string {
  const date = new Date()
  const pad = (value: number): string => String(value).padStart(2, "0")
  return `${prefix}_${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}.json`
}

function getElement<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id)
  if (!element) {
    throw new Error(`#${id} is missing`)
  }
  return element as T
}
