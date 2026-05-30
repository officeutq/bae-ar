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

type AlignmentMode =
  | "semantic_center_scale"
  | "eye_distance_scale"
  | "weighted_similarity_2d"

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
  zGroup: keyof ZGroupValues
}

interface SemanticPoint2D extends Point2 {
  name: SemanticPointName
}

type SemanticPointSet2D = Record<SemanticPointName, SemanticPoint2D>
type SemanticPointSet3D = Record<SemanticPointName, Point3>

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
  semanticWeight: number
  boundsWeight: number
  rotationOriginX: number
  rotationOriginY: number
  focalLength: number
  screenRotationMode: "fixed_zero" | "fine_search"
  alignmentModes: AlignmentMode[]
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

interface ZGroupValues {
  noseZ: number
  cheekZ: number
  eyeZ: number
  mouthZ: number
  chinZ: number
  headTopZ: number
}

interface ZProfile {
  name: string
  label: string
  description: string
  values: ZGroupValues
}

interface ZProfileDefinition {
  name: string
  label: string
  description: string
  points: Record<SemanticPointName, number>
}

interface DepthConvention {
  smallerZ: string
  largerZ: string
  note: string
}

interface CandidateDefinition {
  candidateId: string
  zProfileName: string
  zValues: Record<SemanticPointName, number>
  pivotZ: number
  zScale: number
  rotationOriginX: number
  rotationOriginY: number
  alignmentMode: AlignmentMode
  screenRotationDeg: number
}

interface AlignmentResult {
  translateX: number
  translateY: number
  uniformScale: number
  screenRotationDeg: number
}

interface FrameEvaluation {
  captureId: string
  bucket: CaptureBucket
  alignment: AlignmentResult
  averageSemanticDistance: number
  weightedSemanticDistance: number
  perPointError: Record<SemanticPointName, number>
  boundsError: BoundsErrorSummary
  scalePenalty: number
  translationPenalty: number
  totalScore: number
  warnings: string[]
}

interface BoundsErrorSummary {
  centerError: number
  widthError: number
  heightError: number
  edgeError: number
  total: number
}

interface CandidateResult extends CandidateDefinition {
  averageSemanticDistance: number
  weightedSemanticDistance: number
  perPointError: Record<SemanticPointName, number>
  boundsError: BoundsErrorSummary
  scalePenalty: number
  translationPenalty: number
  symmetryPenalty: number
  zPlausibilityPenalty: number
  totalScore: number
  sampleCount: number
  warnings: string[]
  perFrameResults: FrameEvaluation[]
}

interface RankingEntry {
  candidateId: string
  zProfileName: string
  pivotZ: number
  zScale: number
  alignmentMode: AlignmentMode
  screenRotationDeg: number
  totalScore: number
  weightedSemanticDistance: number
  averageSemanticDistance: number
  boundsError: number
  sampleCount: number
  idealFace8Summary?: IdealFace8CandidateSummary
}

interface IdealFace8Source {
  type: "best_candidate"
  zProfileName: string
  pivotZ: number
  zScale: number
  alignmentMode: AlignmentMode
  screenRotationDeg: number
  zApplication: string
}

interface IdealFace8Point extends Point2 {
  name: SemanticPointName
  z: number
  zRaw: number
  zScale: number
  zScaled: number
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
    zSource: "z_profile_grid_search_best_candidate"
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
  zProfileDefinitions: ZProfileDefinition[]
  depthConvention: DepthConvention
  searchSettings: SearchSettings
  candidateCount: number
  allCandidates: CandidateResult[]
  topCandidates: RankingEntry[]
  bestCandidate: CandidateResult | null
  bestIdealFace8: BestIdealFace8 | null
  depthRelation: DepthRelation | null
  bucketRanking: Record<CaptureBucket, RankingEntry[]>
  perPointErrorSummary: Record<SemanticPointName, number | null>
  boundsErrorSummary: BoundsErrorSummary | null
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
  zProfileDefinitions: ZProfileDefinition[]
  depthConvention: DepthConvention
  searchSettings: SearchSettings
  topCandidates: RankingEntry[]
  bestCandidate: RankingEntry | null
  bestIdealFace8: BestIdealFace8 | null
  depthRelation: DepthRelation | null
  bucketRanking: Record<CaptureBucket, RankingEntry[]>
  perPointErrorSummary: Record<SemanticPointName, number | null>
  boundsErrorSummary: BoundsErrorSummary | null
  warnings: string[]
}

interface AppState {
  fileName: string | null
  payload: CapturesPayload | null
  frames: NormalizedFrame[]
  analysis: AnalysisResult | null
  importMessage: string | null
  copyMessage: string | null
}

const SEMANTIC_DEFINITIONS: SemanticDefinition[] = [
  {
    name: "headTop",
    label: "頭頂",
    primaryIndices: [10],
    weight: 0.75,
    zGroup: "headTopZ",
  },
  {
    name: "chin",
    label: "顎",
    primaryIndices: [152],
    weight: 1.0,
    zGroup: "chinZ",
  },
  {
    name: "leftCheek",
    label: "左頬",
    primaryIndices: [234],
    weight: 1.0,
    zGroup: "cheekZ",
  },
  {
    name: "rightCheek",
    label: "右頬",
    primaryIndices: [454],
    weight: 1.0,
    zGroup: "cheekZ",
  },
  {
    name: "leftEye",
    label: "左目中心",
    primaryIndices: [474, 475, 476, 477],
    fallbackIndices: [263, 362],
    weight: 1.45,
    zGroup: "eyeZ",
  },
  {
    name: "rightEye",
    label: "右目中心",
    primaryIndices: [469, 470, 471, 472],
    fallbackIndices: [33, 133],
    weight: 1.45,
    zGroup: "eyeZ",
  },
  {
    name: "nose",
    label: "鼻",
    primaryIndices: [4],
    weight: 1.7,
    zGroup: "noseZ",
  },
  {
    name: "mouth",
    label: "口中心",
    primaryIndices: [13, 14],
    weight: 1.2,
    zGroup: "mouthZ",
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
  semanticWeight: 1,
  boundsWeight: 0.35,
  rotationOriginX: 0,
  rotationOriginY: 0,
  focalLength: 2.6,
  screenRotationMode: "fine_search",
  alignmentModes: [
    "semantic_center_scale",
    "eye_distance_scale",
    "weighted_similarity_2d",
  ],
}

const Z_PROFILES: ZProfile[] = [
  {
    name: "balanced_shallow",
    label: "Balanced Shallow / 浅めでバランス型の奥行き",
    description: "鼻を手前、頬を奥に置きつつ、全体の奥行きを浅めにした候補です。",
    values: {
      noseZ: -0.18,
      cheekZ: 0.12,
      eyeZ: 0.0,
      mouthZ: -0.06,
      chinZ: 0.06,
      headTopZ: 0.04,
    },
  },
  {
    name: "nose_forward",
    label: "Nose Forward / 鼻を強めに手前へ置く奥行き",
    description: "鼻の手前方向を強め、横向き時の鼻先投影差を見やすくする候補です。",
    values: {
      noseZ: -0.34,
      cheekZ: 0.16,
      eyeZ: 0.0,
      mouthZ: -0.1,
      chinZ: 0.1,
      headTopZ: 0.06,
    },
  },
  {
    name: "deep_cheek",
    label: "Deep Cheek / 頬を深めに置く奥行き",
    description: "頬を奥に置き、左右向きで頬の奥行き差が効きやすいかを見る候補です。",
    values: {
      noseZ: -0.24,
      cheekZ: 0.28,
      eyeZ: 0.04,
      mouthZ: -0.08,
      chinZ: 0.14,
      headTopZ: 0.08,
    },
  },
  {
    name: "flat_reference",
    label: "Flat Reference / 奥行きなし基準",
    description: "すべての意味点の z を 0 にする基準候補です。",
    values: {
      noseZ: 0,
      cheekZ: 0,
      eyeZ: 0,
      mouthZ: 0,
      chinZ: 0,
      headTopZ: 0,
    },
  },
  {
    name: "chin_back",
    label: "Chin Back / 顎を奥へ置く奥行き",
    description: "顎をやや奥に置き、輪郭下部の投影差を確認する候補です。",
    values: {
      noseZ: -0.22,
      cheekZ: 0.16,
      eyeZ: 0.02,
      mouthZ: -0.02,
      chinZ: 0.22,
      headTopZ: 0.04,
    },
  },
]

const PIVOT_Z_CANDIDATES = [-1, -0.5, 0, 0.5, 1]
const Z_SCALE_CANDIDATES = [0.5, 1, 1.5, 2]
const SCREEN_ROTATION_FINE_CANDIDATES = [-3, 0, 3]
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

const state: AppState = {
  fileName: null,
  payload: null,
  frames: [],
  analysis: null,
  importMessage: null,
  copyMessage: null,
}

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <main class="app">
    <header class="header">
      <div class="title-block">
        <h1>理想顔フィッティング検証ラボ</h1>
        <p>8 semantic points を使って z / pivotZ / zScale / alignment 候補を grid search し、IdealFace 478 の仕様判断材料を作る debug lab です。</p>
      </div>
      <div class="status-pill">debug lab / production asset ではありません</div>
    </header>

    <section class="notice">
      この tool は正式な IdealFace asset 作成ツールではなく、MediaPipe 標準顔478を確定する tool でもありません。検証結果は production へ直接使わず、docs と今後の IdealFace Authoring Tool の仕様判断に使います。
      <ul>
        <li>対象は 8 semantic points: 頭頂、顎、左右頬、左右目、鼻、口です。</li>
        <li>Runtime Projection / Studio Projection / IdealFace Authoring Tool Step 2-I は変更しません。</li>
        <li>bounds は主基準ではなく、破綻防止の制約として評価します。</li>
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
            <button id="copy-debug-button" type="button" disabled>デバッグ情報コピー</button>
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
            <label>semanticWeight
              <input id="semantic-weight-input" type="number" min="0" max="10" step="0.1" value="${DEFAULT_SETTINGS.semanticWeight}" />
            </label>
            <label>boundsWeight
              <input id="bounds-weight-input" type="number" min="0" max="10" step="0.05" value="${DEFAULT_SETTINGS.boundsWeight}" />
            </label>
            <label>rotationOriginX
              <input id="rotation-origin-x-input" type="number" min="-2" max="2" step="0.05" value="${DEFAULT_SETTINGS.rotationOriginX}" />
            </label>
            <label>rotationOriginY
              <input id="rotation-origin-y-input" type="number" min="-2" max="2" step="0.05" value="${DEFAULT_SETTINGS.rotationOriginY}" />
            </label>
            <label>screenRotation
              <select id="screen-rotation-select">
                <option value="fine_search" selected>-3 / 0 / +3 度</option>
                <option value="fixed_zero">0 度固定</option>
              </select>
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
          <h2>zProfileDefinitions</h2>
          <p class="panel-help">z は奥行き値です。このラボでは小さい z が手前、大きい z が奥です。</p>
          <div id="z-profile-definitions" class="table-wrap"></div>
        </section>

        <section class="panel">
          <h2>bestIdealFace8</h2>
          <p class="panel-help">zRaw は zProfile そのもの、zScaled は zScale 適用後です。3DIdealFace8 の実値としては zScaled を見ます。</p>
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
bindEvents()

function bindEvents(): void {
  getElement<HTMLInputElement>("capture-file-input").addEventListener("change", handleFileImport)
  getElement<HTMLButtonElement>("run-analysis-button").addEventListener("click", runAnalysis)
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

  try {
    const payload = JSON.parse(await file.text()) as unknown
    const captures = extractCaptures(payload)
    const settings = readSettings()
    const frames = captures.map((capture) => normalizeFrame(capture, settings))

    state.fileName = file.name
    state.payload = isRecord(payload) ? (payload as CapturesPayload) : { captures }
    state.frames = frames
    state.analysis = null
    state.importMessage = `${file.name} を読み込みました: ${captures.length} captures`
    state.copyMessage = null
    setButtons()
    renderSourceOnly()
  } catch (error) {
    state.importMessage = `読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`
    state.payload = null
    state.frames = []
    state.analysis = null
    setButtons()
    renderEmptyState()
  }
}

function runAnalysis(): void {
  if (state.frames.length === 0) {
    return
  }

  const settings = readSettings()
  const sourceSummary = summarizeSource(state.payload, state.frames)
  const selected = selectFrames(state.frames, settings)
  const base8Points2DSummary = buildBase8Points2D(selected.frames)
  const current8Debug = buildCurrent8Debug(selected.frames, settings)
  const zProfileDefinitions = createZProfileDefinitions()
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
      zProfileDefinitions,
      depthConvention: DEPTH_CONVENTION,
      searchSettings: settings,
      candidateCount: 0,
      allCandidates: [],
      topCandidates: [],
      bestCandidate: null,
      bestIdealFace8: null,
      depthRelation: null,
      bucketRanking: emptyBucketRanking(),
      perPointErrorSummary: emptyPointSummary(),
      boundsErrorSummary: null,
      warnings: [...warnings, "front bucket の usable frame が不足しているため base8Points2D を作れません。"],
    }
    renderAnalysis()
    return
  }

  const candidates = buildCandidateDefinitions(base8Points2DSummary.points, settings)
  const evaluated = candidates
    .map((candidate) =>
      evaluateCandidate(candidate, base8Points2DSummary.points!, selected.frames, settings),
    )
    .sort((a, b) => a.totalScore - b.totalScore)

  const topCandidates = evaluated.slice(0, 50).map(toRankingEntry)
  const bestCandidate = evaluated[0] ?? null
  const bestIdealFace8 = bestCandidate
    ? buildBestIdealFace8(base8Points2DSummary.points!, bestCandidate)
    : null

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
    zProfileDefinitions,
    depthConvention: DEPTH_CONVENTION,
    searchSettings: settings,
    candidateCount: evaluated.length,
    allCandidates: evaluated,
    topCandidates: topCandidates.map((candidate) =>
      attachIdealFace8Summary(candidate, base8Points2DSummary.points!),
    ),
    bestCandidate,
    bestIdealFace8,
    depthRelation: bestIdealFace8?.summary.depthRelation ?? null,
    bucketRanking: buildBucketRanking(evaluated, base8Points2DSummary.points!),
    perPointErrorSummary: bestCandidate ? bestCandidate.perPointError : emptyPointSummary(),
    boundsErrorSummary: bestCandidate ? bestCandidate.boundsError : null,
    warnings: [
      ...new Set([
        ...warnings,
        "z / pivotZ / zScale は debug 探索候補です。production IdealFace478 の確定値ではありません。",
      ]),
    ],
  }

  state.importMessage = `${evaluated.length} candidates を評価しました。`
  setButtons()
  renderAnalysis()
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
    semanticWeight: readNumber("semantic-weight-input", DEFAULT_SETTINGS.semanticWeight),
    boundsWeight: readNumber("bounds-weight-input", DEFAULT_SETTINGS.boundsWeight),
    rotationOriginX: readNumber("rotation-origin-x-input", DEFAULT_SETTINGS.rotationOriginX),
    rotationOriginY: readNumber("rotation-origin-y-input", DEFAULT_SETTINGS.rotationOriginY),
    focalLength: readNumber("focal-length-input", DEFAULT_SETTINGS.focalLength),
    screenRotationMode: getElement<HTMLSelectElement>("screen-rotation-select")
      .value as SearchSettings["screenRotationMode"],
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

function buildCandidateDefinitions(
  basePoints: SemanticPointSet2D,
  settings: SearchSettings,
): CandidateDefinition[] {
  const screenRotationCandidates =
    settings.screenRotationMode === "fine_search" ? SCREEN_ROTATION_FINE_CANDIDATES : [0]

  const definitions: CandidateDefinition[] = []

  for (const zProfile of Z_PROFILES) {
    const zValues = mapZValuesToSemanticPoints(zProfile.values)
    for (const pivotZ of PIVOT_Z_CANDIDATES) {
      for (const zScale of Z_SCALE_CANDIDATES) {
        for (const alignmentMode of settings.alignmentModes) {
          for (const screenRotationDeg of screenRotationCandidates) {
            definitions.push({
              candidateId: [
                zProfile.name,
                `pivot${pivotZ}`,
                `scale${zScale}`,
                alignmentMode,
                `rot${screenRotationDeg}`,
              ].join("__"),
              zProfileName: zProfile.name,
              zValues,
              pivotZ,
              zScale,
              rotationOriginX: settings.rotationOriginX,
              rotationOriginY: settings.rotationOriginY,
              alignmentMode,
              screenRotationDeg,
            })
          }
        }
      }
    }
  }

  if (Object.keys(basePoints).length !== SEMANTIC_POINT_NAMES.length) {
    return []
  }

  return definitions
}

function evaluateCandidate(
  candidate: CandidateDefinition,
  basePoints: SemanticPointSet2D,
  frames: NormalizedFrame[],
  settings: SearchSettings,
): CandidateResult {
  const ideal3D = buildIdeal3D(basePoints, candidate)
  const perFrameResults = frames
    .filter((frame) => frame.semanticPoints && frame.bounds)
    .map((frame) => evaluateCandidateOnFrame(candidate, ideal3D, frame, settings))

  const perPointError = averagePerPointError(perFrameResults)
  const averageSemanticDistance =
    average(perFrameResults.map((result) => result.averageSemanticDistance)) ?? Number.POSITIVE_INFINITY
  const weightedSemanticDistance =
    average(perFrameResults.map((result) => result.weightedSemanticDistance)) ?? Number.POSITIVE_INFINITY
  const boundsError = averageBoundsErrors(perFrameResults.map((result) => result.boundsError))
  const scalePenalty = average(perFrameResults.map((result) => result.scalePenalty)) ?? 0
  const translationPenalty =
    average(perFrameResults.map((result) => result.translationPenalty)) ?? 0
  const symmetryPenalty = calculateSymmetryPenalty(candidate.zValues)
  const zPlausibilityPenalty = calculateZPlausibilityPenalty(candidate.zValues)
  const totalScore =
    weightedSemanticDistance * settings.semanticWeight +
    boundsError.total * settings.boundsWeight +
    scalePenalty +
    translationPenalty +
    symmetryPenalty +
    zPlausibilityPenalty

  return {
    ...candidate,
    averageSemanticDistance,
    weightedSemanticDistance,
    perPointError,
    boundsError,
    scalePenalty,
    translationPenalty,
    symmetryPenalty,
    zPlausibilityPenalty,
    totalScore,
    sampleCount: perFrameResults.length,
    warnings: Array.from(new Set(perFrameResults.flatMap((result) => result.warnings))),
    perFrameResults,
  }
}

function evaluateCandidateOnFrame(
  candidate: CandidateDefinition,
  ideal3D: SemanticPointSet3D,
  frame: NormalizedFrame,
  settings: SearchSettings,
): FrameEvaluation {
  const projected = projectIdealPoints(ideal3D, frame.pose, candidate, settings)
  const alignment = alignProjectedPoints(
    projected,
    frame.semanticPoints!,
    candidate.alignmentMode,
    candidate.screenRotationDeg,
  )
  const aligned = applyAlignment(projected, alignment)
  const perPointError = calculatePerPointErrors(aligned, frame.semanticPoints!)
  const averageSemanticDistance =
    average(SEMANTIC_POINT_NAMES.map((name) => perPointError[name])) ?? Number.POSITIVE_INFINITY
  const weightedSemanticDistance = weightedAverage(
    SEMANTIC_DEFINITIONS.map((definition) => ({
      value: perPointError[definition.name],
      weight: definition.weight,
    })),
  )
  const boundsError = calculateBoundsError(aligned, frame.semanticPoints!)
  const scalePenalty = Math.max(0, Math.abs(alignment.uniformScale - 1) - 0.15) * 0.04
  const translationPenalty =
    Math.max(0, Math.hypot(alignment.translateX, alignment.translateY) - 0.08) * 0.03

  return {
    captureId: frame.captureId,
    bucket: frame.bucket,
    alignment,
    averageSemanticDistance,
    weightedSemanticDistance,
    perPointError,
    boundsError,
    scalePenalty,
    translationPenalty,
    totalScore:
      weightedSemanticDistance * settings.semanticWeight +
      boundsError.total * settings.boundsWeight +
      scalePenalty +
      translationPenalty,
    warnings: frame.warnings,
  }
}

function buildIdeal3D(
  basePoints: SemanticPointSet2D,
  candidate: CandidateDefinition,
): SemanticPointSet3D {
  const points = {} as SemanticPointSet3D
  for (const name of SEMANTIC_POINT_NAMES) {
    points[name] = {
      x: basePoints[name].x,
      y: basePoints[name].y,
      z: candidate.zValues[name],
    }
  }
  return points
}

function createZProfileDefinitions(): ZProfileDefinition[] {
  return Z_PROFILES.map((profile) => ({
    name: profile.name,
    label: profile.label,
    description: profile.description,
    points: mapZValuesToSemanticPoints(profile.values),
  }))
}

function buildBestIdealFace8(
  basePoints: SemanticPointSet2D,
  candidate: CandidateDefinition,
): BestIdealFace8 {
  const points = SEMANTIC_POINT_NAMES.map((name) => {
    const zRaw = candidate.zValues[name]
    const zScaled = zRaw * candidate.zScale
    return {
      name,
      x: round(basePoints[name].x),
      y: round(basePoints[name].y),
      z: round(zScaled),
      zRaw: round(zRaw),
      zScale: round(candidate.zScale),
      zScaled: round(zScaled),
    }
  })

  return {
    schemaVersion: "ideal_face_fitting_lab_ideal_face_8_v1",
    coordinateSpace: "bae_ar_fitting_lab_8point_same_unit_v1",
    depthConvention: DEPTH_CONVENTION,
    source: {
      type: "best_candidate",
      zProfileName: candidate.zProfileName,
      pivotZ: round(candidate.pivotZ),
      zScale: round(candidate.zScale),
      alignmentMode: candidate.alignmentMode,
      screenRotationDeg: round(candidate.screenRotationDeg),
      zApplication:
        "points[].z は zScaled と同じ値です。zScaled = zRaw * zScale。pivotZ は grid search projection 用に source へ記録し、点の z には焼き込みません。",
    },
    metadata: {
      intendedNextStep: "interpolate_8point_depth_to_478_debug_candidate",
      semanticPointNames: [...SEMANTIC_POINT_NAMES],
      sourceBase2D: "front_bucket_average_same_unit",
      zSource: "z_profile_grid_search_best_candidate",
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
  const zProfile = Z_PROFILES.find((profile) => profile.name === entry.zProfileName)
  if (!zProfile) {
    return entry
  }
  const candidate: CandidateDefinition = {
    candidateId: entry.candidateId,
    zProfileName: entry.zProfileName,
    zValues: mapZValuesToSemanticPoints(zProfile.values),
    pivotZ: entry.pivotZ,
    zScale: entry.zScale,
    rotationOriginX: 0,
    rotationOriginY: 0,
    alignmentMode: entry.alignmentMode,
    screenRotationDeg: entry.screenRotationDeg,
  }
  const idealFace8 = buildBestIdealFace8(basePoints, candidate)
  return {
    ...entry,
    idealFace8Summary: summarizeIdealFace8ForCandidate(idealFace8.points),
  }
}

function projectIdealPoints(
  ideal3D: SemanticPointSet3D,
  pose: Pose,
  candidate: CandidateDefinition,
  settings: SearchSettings,
): SemanticPointSet2D {
  const points = {} as SemanticPointSet2D
  for (const name of SEMANTIC_POINT_NAMES) {
    const rotated = rotatePoint3D(
      {
        x: ideal3D[name].x - candidate.rotationOriginX,
        y: ideal3D[name].y - candidate.rotationOriginY,
        z: (ideal3D[name].z - candidate.pivotZ) * candidate.zScale,
      },
      pose,
    )
    const z = rotated.z + candidate.pivotZ
    const perspective = settings.focalLength / Math.max(settings.focalLength + z, 0.2)
    points[name] = {
      name,
      x: (rotated.x + candidate.rotationOriginX) * perspective,
      y: (rotated.y + candidate.rotationOriginY) * perspective,
    }
  }
  return points
}

function alignProjectedPoints(
  projected: SemanticPointSet2D,
  current: SemanticPointSet2D,
  mode: AlignmentMode,
  screenRotationDeg: number,
): AlignmentResult {
  if (mode === "eye_distance_scale") {
    return alignByEyeDistance(projected, current, screenRotationDeg)
  }
  if (mode === "weighted_similarity_2d") {
    return alignByWeightedSimilarity(projected, current, screenRotationDeg)
  }
  return alignBySemanticCenter(projected, current, screenRotationDeg)
}

function alignBySemanticCenter(
  projected: SemanticPointSet2D,
  current: SemanticPointSet2D,
  screenRotationDeg: number,
): AlignmentResult {
  const projectedCenter = weightedCenter(projected, SEMANTIC_DEFINITIONS)
  const currentCenter = weightedCenter(current, SEMANTIC_DEFINITIONS)
  const projectedRadius = weightedRadius(projected, projectedCenter)
  const currentRadius = weightedRadius(current, currentCenter)
  const uniformScale = safeScale(currentRadius, projectedRadius)
  const rotatedCenter = rotatePoint2D(projectedCenter, screenRotationDeg)

  return {
    uniformScale,
    screenRotationDeg,
    translateX: currentCenter.x - rotatedCenter.x * uniformScale,
    translateY: currentCenter.y - rotatedCenter.y * uniformScale,
  }
}

function alignByEyeDistance(
  projected: SemanticPointSet2D,
  current: SemanticPointSet2D,
  screenRotationDeg: number,
): AlignmentResult {
  const projectedEyeDistance = distance2D(projected.leftEye, projected.rightEye)
  const currentEyeDistance = distance2D(current.leftEye, current.rightEye)
  const uniformScale = safeScale(currentEyeDistance, projectedEyeDistance)
  const weights = [
    { name: "leftEye" as SemanticPointName, weight: 1.5 },
    { name: "rightEye" as SemanticPointName, weight: 1.5 },
    { name: "nose" as SemanticPointName, weight: 1.4 },
    { name: "mouth" as SemanticPointName, weight: 0.8 },
  ]
  const projectedCenter = weightedCenterByName(projected, weights)
  const currentCenter = weightedCenterByName(current, weights)
  const rotatedCenter = rotatePoint2D(projectedCenter, screenRotationDeg)

  return {
    uniformScale,
    screenRotationDeg,
    translateX: currentCenter.x - rotatedCenter.x * uniformScale,
    translateY: currentCenter.y - rotatedCenter.y * uniformScale,
  }
}

function alignByWeightedSimilarity(
  projected: SemanticPointSet2D,
  current: SemanticPointSet2D,
  screenRotationDeg: number,
): AlignmentResult {
  const projectedCenter = weightedCenter(projected, SEMANTIC_DEFINITIONS)
  const currentCenter = weightedCenter(current, SEMANTIC_DEFINITIONS)
  let a = 0
  let b = 0
  let denominator = 0

  for (const definition of SEMANTIC_DEFINITIONS) {
    const source = projected[definition.name]
    const target = current[definition.name]
    const sx = source.x - projectedCenter.x
    const sy = source.y - projectedCenter.y
    const tx = target.x - currentCenter.x
    const ty = target.y - currentCenter.y
    a += definition.weight * (sx * tx + sy * ty)
    b += definition.weight * (sx * ty - sy * tx)
    denominator += definition.weight * (sx * sx + sy * sy)
  }

  const fittedRotationDeg = radiansToDegrees(Math.atan2(b, a))
  const uniformScale =
    denominator <= EPSILON ? 1 : Math.sqrt(a * a + b * b) / denominator
  const screenRotation = fittedRotationDeg + screenRotationDeg
  const rotatedCenter = rotatePoint2D(projectedCenter, screenRotation)

  return {
    uniformScale,
    screenRotationDeg: screenRotation,
    translateX: currentCenter.x - rotatedCenter.x * uniformScale,
    translateY: currentCenter.y - rotatedCenter.y * uniformScale,
  }
}

function applyAlignment(
  projected: SemanticPointSet2D,
  alignment: AlignmentResult,
): SemanticPointSet2D {
  const result = {} as SemanticPointSet2D
  for (const name of SEMANTIC_POINT_NAMES) {
    const rotated = rotatePoint2D(projected[name], alignment.screenRotationDeg)
    result[name] = {
      name,
      x: rotated.x * alignment.uniformScale + alignment.translateX,
      y: rotated.y * alignment.uniformScale + alignment.translateY,
    }
  }
  return result
}

function calculatePerPointErrors(
  aligned: SemanticPointSet2D,
  current: SemanticPointSet2D,
): Record<SemanticPointName, number> {
  const result = {} as Record<SemanticPointName, number>
  for (const name of SEMANTIC_POINT_NAMES) {
    result[name] = distance2D(aligned[name], current[name])
  }
  return result
}

function calculateBoundsError(
  aligned: SemanticPointSet2D,
  current: SemanticPointSet2D,
): BoundsErrorSummary {
  const projectedBounds = calculateBounds2D(Object.values(aligned))
  const currentBounds = calculateBounds2D(Object.values(current))
  const centerError = Math.hypot(
    projectedBounds.centerX - currentBounds.centerX,
    projectedBounds.centerY - currentBounds.centerY,
  )
  const widthError = Math.abs(projectedBounds.width - currentBounds.width)
  const heightError = Math.abs(projectedBounds.height - currentBounds.height)
  const edgeError =
    (Math.abs(projectedBounds.xMin - currentBounds.xMin) +
      Math.abs(projectedBounds.xMax - currentBounds.xMax) +
      Math.abs(projectedBounds.yMin - currentBounds.yMin) +
      Math.abs(projectedBounds.yMax - currentBounds.yMax)) /
    4

  return {
    centerError,
    widthError,
    heightError,
    edgeError,
    total: centerError + widthError + heightError + edgeError,
  }
}

function buildBucketRanking(
  candidates: CandidateResult[],
  basePoints: SemanticPointSet2D,
): Record<CaptureBucket, RankingEntry[]> {
  const ranking = emptyBucketRanking()

  for (const bucket of BUCKETS) {
    const entries = candidates
      .map((candidate) => {
        const frameResults = candidate.perFrameResults.filter((result) => result.bucket === bucket)
        if (frameResults.length === 0) {
          return null
        }
        return attachIdealFace8Summary({
          ...toRankingEntry(candidate),
          totalScore: average(frameResults.map((result) => result.totalScore)) ?? candidate.totalScore,
          weightedSemanticDistance:
            average(frameResults.map((result) => result.weightedSemanticDistance)) ??
            candidate.weightedSemanticDistance,
          averageSemanticDistance:
            average(frameResults.map((result) => result.averageSemanticDistance)) ??
            candidate.averageSemanticDistance,
          boundsError:
            average(frameResults.map((result) => result.boundsError.total)) ??
            candidate.boundsError.total,
          sampleCount: frameResults.length,
        }, basePoints)
      })
      .filter((entry): entry is RankingEntry => Boolean(entry))
      .sort((a, b) => a.totalScore - b.totalScore)
      .slice(0, 5)
    ranking[bucket] = entries
  }

  return ranking
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
    zProfileDefinitions: analysis.zProfileDefinitions,
    depthConvention: analysis.depthConvention,
    searchSettings: analysis.searchSettings,
    topCandidates: analysis.topCandidates.slice(0, 20),
    bestCandidate: analysis.bestCandidate
      ? attachIdealFace8Summary(toRankingEntry(analysis.bestCandidate), analysis.base8Points2DSummary.points)
      : null,
    bestIdealFace8: analysis.bestIdealFace8,
    depthRelation: analysis.depthRelation,
    bucketRanking: Object.fromEntries(
      BUCKETS.map((bucket) => [bucket, analysis.bucketRanking[bucket].slice(0, 5)]),
    ) as Record<CaptureBucket, RankingEntry[]>,
    perPointErrorSummary: analysis.perPointErrorSummary,
    boundsErrorSummary: analysis.boundsErrorSummary,
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
  getElement("z-profile-definitions").innerHTML = renderZProfileDefinitionsTable(createZProfileDefinitions())
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
      zProfileDefinitions: createZProfileDefinitions(),
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
        ["boundsError", formatNumber(analysis.bestCandidate.boundsError.total)],
        ["zProfile", analysis.bestCandidate.zProfileName],
        ["zValues", JSON.stringify(roundRecord(analysis.bestCandidate.zValues))],
        ["pivotZ", formatNumber(analysis.bestCandidate.pivotZ)],
        ["zScale", formatNumber(analysis.bestCandidate.zScale)],
        ["alignmentMode", analysis.bestCandidate.alignmentMode],
      ])
    : `<p class="empty">候補がありません。</p>`
  getElement("z-profile-definitions").innerHTML = renderZProfileDefinitionsTable(analysis.zProfileDefinitions)
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
    ["boundsError", analysis.boundsErrorSummary ? JSON.stringify(roundRecord(analysis.boundsErrorSummary)) : "-"],
  ])
  getElement("warnings").textContent = analysis.warnings.length === 0 ? "警告はありません。" : analysis.warnings.join("\n")
  getElement("json-preview").textContent = JSON.stringify(createSummaryAnalysis(analysis), null, 2)
  setButtons()
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
  getElement("z-profile-definitions").innerHTML = renderZProfileDefinitionsTable(createZProfileDefinitions())
  getElement("best-ideal-face8-summary").innerHTML = `<p class="empty">未解析です。</p>`
  getElement("best-ideal-face8-table").innerHTML = `<p class="empty">未解析です。</p>`
  getElement("depth-relation").innerHTML = renderDepthConvention(DEPTH_CONVENTION)
  getElement("bucket-ranking").innerHTML = `<p class="empty">未解析です。</p>`
  getElement("error-summary").innerHTML = `<p class="empty">未解析です。</p>`
  getElement("warnings").textContent = ""
  getElement("json-preview").textContent = JSON.stringify(
    {
      schemaVersion: "ideal_face_fitting_lab_analysis_summary_v1",
      zProfileDefinitions: createZProfileDefinitions(),
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
          <th>z group</th>
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
              <td><code>${definition.zGroup}</code></td>
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

function renderZProfileDefinitionsTable(definitions: ZProfileDefinition[]): string {
  return `
    <table>
      <thead>
        <tr>
          <th>name</th>
          <th>label</th>
          <th>description</th>
          ${SEMANTIC_POINT_NAMES.map((name) => `<th>${name}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${definitions.map(
          (definition) => `
            <tr>
              <td><code>${definition.name}</code></td>
              <td>${escapeHtml(definition.label)}</td>
              <td>${escapeHtml(definition.description)}</td>
              ${SEMANTIC_POINT_NAMES.map(
                (name) => `<td>${formatNumber(definition.points[name])}</td>`,
              ).join("")}
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
    ["zProfileName", idealFace8.source.zProfileName],
    ["pivotZ", formatNumber(idealFace8.source.pivotZ)],
    ["zScale", formatNumber(idealFace8.source.zScale)],
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
          <th>zRaw</th>
          <th>zScale</th>
          <th>zScaled</th>
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
              <td>${formatNumber(point.zRaw)}</td>
              <td>${formatNumber(point.zScale)}</td>
              <td>${formatNumber(point.zScaled)}</td>
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
          <th>candidate</th>
          <th>score</th>
          <th>semantic</th>
          <th>bounds</th>
          <th>pivotZ</th>
          <th>zScale</th>
          <th>alignment</th>
          <th>roll</th>
        </tr>
      </thead>
      <tbody>
        ${entries.map(
          (entry, index) => `
            <tr>
              <td>${index + 1}</td>
              <td><code>${entry.zProfileName}</code></td>
              <td>${formatNumber(entry.totalScore)}</td>
              <td>${formatNumber(entry.weightedSemanticDistance)}</td>
              <td>${formatNumber(entry.boundsError)}</td>
              <td>${formatNumber(entry.pivotZ)}</td>
              <td>${formatNumber(entry.zScale)}</td>
              <td><code>${entry.alignmentMode}</code></td>
              <td>${formatNumber(entry.screenRotationDeg)}</td>
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
                    `${index + 1}. ${entry.zProfileName} / ${entry.alignmentMode} / score ${formatNumber(entry.totalScore)}`,
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
  getElement<HTMLButtonElement>("run-analysis-button").disabled = state.frames.length === 0
  getElement<HTMLButtonElement>("copy-debug-button").disabled = !state.analysis
  getElement<HTMLButtonElement>("export-full-button").disabled = !state.analysis
  getElement<HTMLButtonElement>("export-summary-button").disabled = !state.analysis
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

function rotatePoint3D(point: Point3, pose: Pose): Point3 {
  const yaw = degreesToRadians(pose.yaw)
  const pitch = degreesToRadians(pose.pitch)
  const roll = degreesToRadians(pose.roll)

  const cosY = Math.cos(yaw)
  const sinY = Math.sin(yaw)
  const yawed = {
    x: point.x * cosY + point.z * sinY,
    y: point.y,
    z: -point.x * sinY + point.z * cosY,
  }

  const cosP = Math.cos(pitch)
  const sinP = Math.sin(pitch)
  const pitched = {
    x: yawed.x,
    y: yawed.y * cosP - yawed.z * sinP,
    z: yawed.y * sinP + yawed.z * cosP,
  }

  const cosR = Math.cos(roll)
  const sinR = Math.sin(roll)
  return {
    x: pitched.x * cosR - pitched.y * sinR,
    y: pitched.x * sinR + pitched.y * cosR,
    z: pitched.z,
  }
}

function rotatePoint2D(point: Point2, degrees: number): Point2 {
  const radians = degreesToRadians(degrees)
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  }
}

function mapZValuesToSemanticPoints(values: ZGroupValues): Record<SemanticPointName, number> {
  const result = {} as Record<SemanticPointName, number>
  for (const definition of SEMANTIC_DEFINITIONS) {
    result[definition.name] = values[definition.zGroup]
  }
  return result
}

function calculateSymmetryPenalty(zValues: Record<SemanticPointName, number>): number {
  return (
    Math.abs(zValues.leftCheek - zValues.rightCheek) +
    Math.abs(zValues.leftEye - zValues.rightEye)
  ) * 0.03
}

function calculateZPlausibilityPenalty(zValues: Record<SemanticPointName, number>): number {
  let penalty = 0
  if (zValues.nose >= zValues.leftCheek || zValues.nose >= zValues.rightCheek) {
    penalty += 0.08
  }
  const zRange = max(Object.values(zValues))! - min(Object.values(zValues))!
  penalty += Math.max(0, zRange - 1.2) * 0.05
  penalty += Math.abs(zValues.leftCheek - zValues.rightCheek) * 0.04
  penalty += Math.abs(zValues.leftEye - zValues.rightEye) * 0.04
  return penalty
}

function averagePerPointError(results: FrameEvaluation[]): Record<SemanticPointName, number> {
  const summary = {} as Record<SemanticPointName, number>
  for (const name of SEMANTIC_POINT_NAMES) {
    summary[name] = average(results.map((result) => result.perPointError[name])) ?? 0
  }
  return summary
}

function averageBoundsErrors(items: BoundsErrorSummary[]): BoundsErrorSummary {
  return {
    centerError: average(items.map((item) => item.centerError)) ?? 0,
    widthError: average(items.map((item) => item.widthError)) ?? 0,
    heightError: average(items.map((item) => item.heightError)) ?? 0,
    edgeError: average(items.map((item) => item.edgeError)) ?? 0,
    total: average(items.map((item) => item.total)) ?? 0,
  }
}

function toRankingEntry(candidate: CandidateResult): RankingEntry {
  return {
    candidateId: candidate.candidateId,
    zProfileName: candidate.zProfileName,
    pivotZ: round(candidate.pivotZ),
    zScale: round(candidate.zScale),
    alignmentMode: candidate.alignmentMode,
    screenRotationDeg: round(candidate.screenRotationDeg),
    totalScore: round(candidate.totalScore),
    weightedSemanticDistance: round(candidate.weightedSemanticDistance),
    averageSemanticDistance: round(candidate.averageSemanticDistance),
    boundsError: round(candidate.boundsError.total),
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

function weightedCenter(
  points: SemanticPointSet2D,
  definitions: SemanticDefinition[],
): Point2 {
  return weightedCenterByName(
    points,
    definitions.map((definition) => ({
      name: definition.name,
      weight: definition.weight,
    })),
  )
}

function weightedCenterByName(
  points: SemanticPointSet2D,
  weights: Array<{ name: SemanticPointName; weight: number }>,
): Point2 {
  const weightTotal = weights.reduce((total, item) => total + item.weight, 0)
  return {
    x: weights.reduce((total, item) => total + points[item.name].x * item.weight, 0) / weightTotal,
    y: weights.reduce((total, item) => total + points[item.name].y * item.weight, 0) / weightTotal,
  }
}

function weightedRadius(points: SemanticPointSet2D, center: Point2): number {
  return weightedAverage(
    SEMANTIC_DEFINITIONS.map((definition) => ({
      value: distance2D(points[definition.name], center),
      weight: definition.weight,
    })),
  )
}

function weightedAverage(items: Array<{ value: number; weight: number }>): number {
  const weightTotal = items.reduce((total, item) => total + item.weight, 0)
  if (weightTotal <= EPSILON) {
    return 0
  }
  return items.reduce((total, item) => total + item.value * item.weight, 0) / weightTotal
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

function safeScale(current: number, projected: number): number {
  if (Math.abs(projected) <= EPSILON) {
    return 1
  }
  return current / projected
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

function formatBooleanOrNull(value: boolean | null): string {
  return value === null ? "-" : String(value)
}

function degreesToRadians(degrees: number): number {
  return (degrees / 180) * Math.PI
}

function radiansToDegrees(radians: number): number {
  return (radians / Math.PI) * 180
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
