import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision"
import type { Matrix, NormalizedLandmark } from "@mediapipe/tasks-vision"
import "./style.css"

type PreviewTab = "obj" | "renderedIdeal" | "live"
type DebugTab = "summary" | "current" | "obj" | "renderedIdeal" | "objPoseCalibration" | "realtime" | "warpMesh" | "raw"
type PlaybackStatus = "stopped" | "playing" | "paused"
type ObjParseStatus = "not_loaded" | "not_parsed" | "parsed" | "error"
type ObjPreviewMode = "points" | "wireframe" | "points_wireframe"
type ObjPreviewStatus = "not_ready" | "ready" | "error"
type RenderedIdealRenderStatus = "not_ready" | "ready" | "rendered" | "error"
type RenderedIdealDetectionStatus = "idle" | "detecting" | "detected" | "not_detected" | "error"
type RenderedIdealRenderMode = "shaded_faces"
type RenderedIdealBackgroundMode = "light" | "dark"
type RenderedIdealColorMode = "clay" | "grayscale"
type PoseCenterSearchStatus = "idle" | "running" | "completed" | "error"
type PoseCenterSearchMode = "single_frame" | "multi_frame"
type PoseSearchFrameBucket =
  | "front"
  | "yawLeft"
  | "yawRight"
  | "pitchUp"
  | "pitchDown"
  | "roll"
  | "mixed"
type LiveVideoStatus = "not_loaded" | "loaded" | "metadata_ready" | "error"
type LiveInputSourceType = "video_file" | "camera"
type LiveInputState = {
  sourceType: LiveInputSourceType | null
  status: string
  fileName: string | null
  width: number | null
  height: number | null
  durationSec: number | null
  currentTimeSec: number | null
  paused: boolean | null
  readyState: number | null
}
type CameraState = {
  status: "not_started" | "starting" | "running" | "stopped" | "error"
  errorMessage: string | null
  width: number | null
  height: number | null
  frameRate: number | null
  deviceLabel: string | null
}
type CurrentAnalysisStatus =
  | "not_ready"
  | "ready"
  | "analyzing"
  | "detected"
  | "no_face"
  | "error"
type MediaPipeStatus =
  | "uninitialized"
  | "initializing"
  | "ready"
  | "disposed"
  | "error"
type RealtimeMode =
  | "current_analysis_only"
  | "current_analysis_obj_render"
type RealtimeDriveMode =
  | "video_frame_callback"
  | "animation_frame_fallback"
  | "interval_legacy"
type RealtimeStatus =
  | "idle"
  | "running"
  | "stopped"
  | "error"
type ExpressionGroup =
  | "neutral"
  | "mouthSmile"
  | "jawOpen"
  | "mouthPucker"
  | "eyeBlink"
  | "eyeSquint"
  | "mixedExpression"
  | "unknown"

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

type ObjVertex = {
  x: number
  y: number
  z: number
}

type ObjFace = {
  indices: number[]
}

type ObjEdge = {
  a: number
  b: number
}

type ObjBounds = {
  minX: number
  minY: number
  minZ: number
  maxX: number
  maxY: number
  maxZ: number
}

type ObjSummary = {
  fileName: string
  fileSize: number
  fileType: string
  parseStatus: ObjParseStatus
  vertexCount: number
  faceCount: number
  triangleFaceCount: number
  polygonFaceCount: number
  bounds: ObjBounds | null
  center: { x: number; y: number; z: number } | null
  size: { x: number; y: number; z: number } | null
  maxDimension: number | null
  warningCount: number
  warningsPreview: string[]
}

type ObjParseResult = {
  vertices: ObjVertex[]
  faces: ObjFace[]
  warnings: string[]
}

type ObjGeometryState = {
  vertices: ObjVertex[]
  faces: ObjFace[]
  edges: ObjEdge[]
}

type ObjPreviewState = {
  yawDeg: number
  pitchDeg: number
  rollDeg: number
  zoom: number
  panX: number
  panY: number
  mode: ObjPreviewMode
  maxPoints: number
  maxEdges: number
}

type ObjPoseSyncState = {
  enabled: boolean
  yawSign: 1 | -1
  pitchSign: 1 | -1
  rollSign: 1 | -1
  yawOffsetDeg: number
  pitchOffsetDeg: number
  rollOffsetDeg: number
  rotationCenterX: number
  rotationCenterY: number
  rotationCenterZ: number
  appliedYawDeg: number | null
  appliedPitchDeg: number | null
  appliedRollDeg: number | null
  source: "none" | "current_frame"
}

type ObjPreviewStats = {
  sampledPointCount: number
  sampledEdgeCount: number
}

type RenderedIdealRenderSummary = {
  status: RenderedIdealRenderStatus
  canvasWidth: number
  canvasHeight: number
  renderMode: RenderedIdealRenderMode
  faceCount: number
  drawnFaceCount: number
  skippedFaceCount: number
  lightDirection: { x: number; y: number; z: number }
  appliedYawDeg: number | null
  appliedPitchDeg: number | null
  appliedRollDeg: number | null
  rotationCenter: { x: number; y: number; z: number }
  errorMessage: string | null
}

type RenderedIdealState = {
  backgroundMode: RenderedIdealBackgroundMode
  colorMode: RenderedIdealColorMode
  summary: RenderedIdealRenderSummary
  detection: RenderedIdealDetectionState
}

type ReferenceLandmark = {
  index: number
  x: number
  y: number
  z: number
}

type ReferencePose = {
  yaw: number | null
  pitch: number | null
  roll: number | null
}

type ReferenceBlendshape = {
  categoryName: string
  score: number
}

type ExpressionSummary = {
  group: ExpressionGroup
  topBlendshapes: ReferenceBlendshape[]
  missingBlendshapeKeys: string[]
}

type QualitySummary = {
  status: "not_ready" | "valid" | "no_face" | "invalid_landmarks" | "error"
  expectedLandmarkCount: number
  landmarkCount: number
  hasPose: boolean
}

type RenderedIdealDetectionState = {
  status: RenderedIdealDetectionStatus
  landmarks478: ReferenceLandmark[] | null
  detectMs: number | null
  averageDetectMs: number | null
  landmarkCount: number | null
  pose: ReferencePose
  expressionSummary: ExpressionSummary | null
  qualityScore: number | null
  errorMessage: string | null
  renderSeq: number | null
  detectedRenderSeq: number | null
  requestCount: number
  startedCount: number
  completedCount: number
  droppedCount: number
  errorCount: number
  skippedByPoseSearchCount: number
}

type PoseCenterSearchFrame = {
  id: string
  addedAt: string
  sourceType: LiveInputSourceType | null
  timeSec: number | null
  label: string
  autoPoseBucket: PoseSearchFrameBucket
  currentPose: {
    yaw: number
    pitch: number
    roll: number
  }
  expressionGroup: ExpressionGroup | null
  qualityScore: number | null
}

type PoseCenterSearchFrameResult = {
  frameId: string
  frameLabel: string
  sourceType: LiveInputSourceType | string | null
  timeSec: number | null
  currentPose: {
    yaw: number
    pitch: number
    roll: number
  }
  renderedPose: ReferencePose
  poseError: number | null
  yawError: number | null
  pitchError: number | null
  rollError: number | null
  detected: boolean
  detectMs: number | null
  errorMessage: string | null
}

type ObjPoseCalibrationStatus =
  | "idle"
  | "running"
  | "completed"
  | "error"

type ObjPoseCalibrationPose = {
  id: string
  label: string
  yawDeg: number
  pitchDeg: number
  rollDeg: number
}

type ObjPoseCalibrationPoseResult = {
  poseId: string
  poseLabel: string
  expectedPose: {
    yaw: number
    pitch: number
    roll: number
  }
  returnedPose: {
    yaw: number | null
    pitch: number | null
    roll: number | null
  }
  poseError: number | null
  yawError: number | null
  pitchError: number | null
  rollError: number | null
  detected: boolean
  detectMs: number | null
  errorMessage: string | null
}

type ObjPoseCalibrationCandidate = {
  rotationCenterX: number
  rotationCenterY: number
  rotationCenterZ: number
  score: number | null
  averagePoseError: number | null
  maxPoseError: number | null
  yawErrorAvg: number | null
  pitchErrorAvg: number | null
  rollErrorAvg: number | null
  yawErrorMax: number | null
  pitchErrorMax: number | null
  rollErrorMax: number | null
  failedPoseCount: number
  poseResultsPreview: ObjPoseCalibrationPoseResult[]
  detectMsTotal: number | null
  errorMessage: string | null
}

type ObjPoseCalibrationState = {
  status: ObjPoseCalibrationStatus
  startedAt: string | null
  completedAt: string | null
  elapsedMs: number | null
  estimatedRemainingMs: number | null
  poseCount: number
  candidateCount: number
  totalEvaluationCount: number
  evaluatedCandidateCount: number
  evaluatedPoseCount: number
  failedCandidateCount: number
  failedPoseEvaluationCount: number
  currentBestCandidate: ObjPoseCalibrationCandidate | null
  bestCandidate: ObjPoseCalibrationCandidate | null
  topCandidates: ObjPoseCalibrationCandidate[]
  errorMessage: string | null
}

type PoseCenterSearchCandidate = {
  rotationCenterX: number
  rotationCenterY: number
  rotationCenterZ: number
  score: number | null
  averagePoseError: number | null
  maxPoseError: number | null
  yawErrorAvg: number | null
  pitchErrorAvg: number | null
  rollErrorAvg: number | null
  yawErrorMax: number | null
  pitchErrorMax: number | null
  rollErrorMax: number | null
  failedFrameCount: number
  frameResultsPreview: PoseCenterSearchFrameResult[]
  yawError: number | null
  pitchError: number | null
  rollError: number | null
  renderedPose: ReferencePose
  detected: boolean
  detectMs: number | null
  errorMessage: string | null
}

type PoseCenterSearchState = {
  status: PoseCenterSearchStatus
  mode: PoseCenterSearchMode
  startedAt: string | null
  completedAt: string | null
  elapsedMs: number | null
  estimatedRemainingMs: number | null
  errorMessage: string | null
  range: {
    x: { fixed: true; value: 0 }
    y: { min: -0.3; max: 0.3; step: 0.05 }
    z: { min: -0.4; max: 0.1; step: 0.05 }
  }
  frameCount: number
  candidateCount: number
  totalEvaluationCount: number
  evaluatedCandidateCount: number
  evaluatedFrameCount: number
  failedFrameEvaluationCount: number
  evaluatedCount: number
  failedCandidateCount: number
  currentPose: ReferencePose
  currentBestCandidate: PoseCenterSearchCandidate | null
  bestCandidate: PoseCenterSearchCandidate | null
  topCandidates: PoseCenterSearchCandidate[]
  appliedBestAutomatically: boolean
  appliedBestManually: boolean
  appliedBestSourceMode: PoseCenterSearchMode | null
  bestAppliedAt: string | null
}

type LiveVideoState = {
  loaded: boolean
  fileName: string | null
  fileSize: number | null
  fileType: string | null
  objectUrl: string | null
  durationSec: number | null
  width: number | null
  height: number | null
  currentTimeSec: number | null
  playbackStatus: PlaybackStatus
  status: LiveVideoStatus
  errorMessage: string | null
}

type CurrentFrameAnalysis = {
  status: CurrentAnalysisStatus
  analyzedTimeSec: number | null
  landmarks478: ReferenceLandmark[]
  landmarkCount: number
  pose: ReferencePose
  blendshapes: ReferenceBlendshape[]
  expressionSummary: ExpressionSummary | null
  qualityScore: number | null
  qualitySummary: QualitySummary
  errorMessage: string | null
}

type CurrentAnalysisTimingBreakdown = {
  mediaPipeDetectMs: number | null
  buildCurrentAnalysisMs: number | null
  liveOverlayDrawMs: number | null
  debugUpdateMs: number | null
  currentAnalysisTotalMs: number | null
}

type RealtimeDebugState = {
  status: RealtimeStatus
  mode: RealtimeMode
  driveMode: RealtimeDriveMode
  targetFps: number
  frameCount: number
  skippedCount: number
  errorCount: number
  currentAnalysisMs: number | null
  objRenderMs: number | null
  mediaPipeRedetectMs: number | null
  totalMs: number | null
  currentAnalysisTimingBreakdown: CurrentAnalysisTimingBreakdown
  averageCurrentAnalysisTimingBreakdown: CurrentAnalysisTimingBreakdown
  averageObjRenderMs: number | null
  averageTotalMs: number | null
  effectiveFps: number | null
  lastUpdatedAt: string | null
  errorMessage: string | null
  timeupdateAnalysisRequestCount: number
  realtimeTickAnalysisRequestCount: number
  videoFrameCallbackCount: number
  animationFrameFallbackCount: number
  intervalLegacyTickCount: number
  processedVideoFrameCount: number
  skippedBySameVideoFrameCount: number
  skippedByInProgressCount: number
  skippedByNoVideoCount: number
  skippedByPausedVideoCount: number
  skippedTimeupdateDuringRealtimeCount: number
  videoFrameMetadataMediaTime: number | null
  videoFrameTimestampMs: number | null
  timestampFallbackUsed: boolean
  lastVideoFrameMediaTimeSec: number | null
  lastVideoFrameTimestampMs: number | null
  timestampFallbackUsedCount: number
}

type RealtimeTimingSample = {
  currentAnalysisTimingBreakdown: CurrentAnalysisTimingBreakdown
  objRenderMs: number | null
  totalMs: number | null
}

type RealtimeFrameTick = {
  driveMode: RealtimeDriveMode
  timestampMs: number
  mediaTimeSec: number | null
  timestampFallbackUsed: boolean
}

type RenderUpdateTiming = {
  liveOverlayDrawMs: number | null
  debugUpdateMs: number | null
}

type Rect = {
  x: number
  y: number
  width: number
  height: number
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
  objSummary: ObjSummary
  objGeometry: ObjGeometryState
  objPreview: ObjPreviewState
  objPreviewStats: ObjPreviewStats
  objPoseSync: ObjPoseSyncState
  objPoseSyncStats: ObjPreviewStats
  renderedIdeal: RenderedIdealState
  objPoseCalibration: ObjPoseCalibrationState
  poseSearchFrames: PoseCenterSearchFrame[]
  selectedPoseSearchFrameId: string | null
  poseCenterSearch: PoseCenterSearchState
  objErrorMessage: string | null
  liveVideo: LiveVideoState
  liveInput: LiveInputState
  camera: CameraState
  liveMediaPipe: {
    status: MediaPipeStatus
    error: string | null
    liveTimestampMs: number
  }
  currentAnalysis: CurrentFrameAnalysis
  realtimeDebug: RealtimeDebugState
  logs: string[]
}

type FaceLandmarkerResultLike = ReturnType<FaceLandmarker["detect"]>
type FaceLandmarkerOptions = Parameters<typeof FaceLandmarker.createFromOptions>[1]
type VideoFrameCallbackMetadataLike = {
  mediaTime?: number
}
type VideoElementWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (
    callback: (now: DOMHighResTimeStamp, metadata: VideoFrameCallbackMetadataLike) => void,
  ) => number
  cancelVideoFrameCallback?: (handle: number) => void
}

const LAB_NAME = "Ideal OBJ Render Warp Lab"
const MEDIAPIPE_WASM_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
const MEDIAPIPE_FACE_LANDMARKER_MODEL_ASSET_PATH =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
const REQUIRED_LANDMARK_COUNT = 478
const LANDMARK_PREVIEW_COUNT = 5
const MEDIAPIPE_TIMESTAMP_STEP_MS = 1000 / 30
const LIVE_AUTO_ANALYSIS_INTERVAL_SEC = 0.35
const REALTIME_TARGET_FPS_OPTIONS = [5, 10, 15, 30] as const
const REALTIME_AVERAGE_SAMPLE_COUNT = 30
const RAD_TO_DEG = 180 / Math.PI
const STRONG_EXPRESSION_THRESHOLD = 0.35
const MIXED_EXPRESSION_THRESHOLD = 0.28
const RENDERED_IDEAL_FALLBACK_CANVAS_SIZE = 640
const RENDERED_IDEAL_LIGHT_DIRECTION = normalizeVector({ x: -0.35, y: 0.55, z: 0.76 })
const POSE_CENTER_SEARCH_RANGE = {
  x: { fixed: true, value: 0 },
  y: { min: -0.3, max: 0.3, step: 0.05 },
  z: { min: -0.4, max: 0.1, step: 0.05 },
} as const
const POSE_CENTER_SEARCH_TOP_CANDIDATE_COUNT = 5
const POSE_CENTER_SEARCH_FRAME_RESULTS_PREVIEW_COUNT = 12
const OBJ_POSE_CALIBRATION_RANGE = {
  x: { fixed: true, value: 0 },
  y: { min: -0.3, max: 0.3, step: 0.05 },
  z: { min: -0.4, max: 0.1, step: 0.05 },
} as const
const OBJ_POSE_CALIBRATION_TOP_CANDIDATE_COUNT = 10
const OBJ_POSE_CALIBRATION_POSES: ObjPoseCalibrationPose[] = [
  { id: "front", label: "正面", yawDeg: 0, pitchDeg: 0, rollDeg: 0 },
  { id: "yaw_negative_15", label: "yaw負方向 15度", yawDeg: -15, pitchDeg: 0, rollDeg: 0 },
  { id: "yaw_positive_15", label: "yaw正方向 15度", yawDeg: 15, pitchDeg: 0, rollDeg: 0 },
  { id: "yaw_negative_30", label: "yaw負方向 30度", yawDeg: -30, pitchDeg: 0, rollDeg: 0 },
  { id: "yaw_positive_30", label: "yaw正方向 30度", yawDeg: 30, pitchDeg: 0, rollDeg: 0 },
  { id: "pitch_negative_10", label: "pitch負方向 10度", yawDeg: 0, pitchDeg: -10, rollDeg: 0 },
  { id: "pitch_positive_10", label: "pitch正方向 10度", yawDeg: 0, pitchDeg: 10, rollDeg: 0 },
  { id: "pitch_negative_20", label: "pitch負方向 20度", yawDeg: 0, pitchDeg: -20, rollDeg: 0 },
  { id: "pitch_positive_20", label: "pitch正方向 20度", yawDeg: 0, pitchDeg: 20, rollDeg: 0 },
  { id: "roll_negative_10", label: "roll負方向 10度", yawDeg: 0, pitchDeg: 0, rollDeg: -10 },
  { id: "roll_positive_10", label: "roll正方向 10度", yawDeg: 0, pitchDeg: 0, rollDeg: 10 },
  { id: "mixed_1", label: "複合姿勢 1", yawDeg: 20, pitchDeg: -10, rollDeg: 5 },
  { id: "mixed_2", label: "複合姿勢 2", yawDeg: -20, pitchDeg: -10, rollDeg: -5 },
]
const poseSearchFrameBucketLabels: Record<PoseSearchFrameBucket, string> = {
  front: "正面",
  yawLeft: "yaw負方向",
  yawRight: "yaw正方向",
  pitchUp: "pitch正方向",
  pitchDown: "pitch負方向",
  roll: "傾きあり",
  mixed: "混合姿勢",
}
const MATCH_BLENDSHAPE_KEYS = [
  "jawOpen",
  "mouthSmileLeft",
  "mouthSmileRight",
  "mouthPucker",
  "eyeBlinkLeft",
  "eyeBlinkRight",
  "eyeSquintLeft",
  "eyeSquintRight",
] as const

const previewTabs: TabOption<PreviewTab>[] = [
  { label: "OBJ", value: "obj" },
  { label: "レンダー理想", value: "renderedIdeal" },
  { label: "ライブ", value: "live" },
]

const debugTabs: TabOption<DebugTab>[] = [
  { label: "概要", value: "summary" },
  { label: "現在顔", value: "current" },
  { label: "OBJ", value: "obj" },
  { label: "レンダー理想", value: "renderedIdeal" },
  { label: "OBJ解析", value: "objPoseCalibration" },
  { label: "リアルタイム", value: "realtime" },
  { label: "ワープメッシュ", value: "warpMesh" },
  { label: "Raw Debug", value: "raw" },
]

const realtimeModeLabels: Record<RealtimeMode, string> = {
  current_analysis_only: "現在顔解析のみ",
  current_analysis_obj_render: "現在顔解析 + OBJレンダー",
}

const realtimeDriveModeLabels: Record<RealtimeDriveMode, string> = {
  video_frame_callback: "動画フレーム同期 requestVideoFrameCallback",
  animation_frame_fallback: "画面描画同期 fallback requestAnimationFrame",
  interval_legacy: "旧setInterval 一定間隔タイマー",
}

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
  objSummary: createEmptyObjSummary(),
  objGeometry: createEmptyObjGeometry(),
  objPreview: createDefaultObjPreviewState(),
  objPreviewStats: {
    sampledPointCount: 0,
    sampledEdgeCount: 0,
  },
  objPoseSync: createDefaultObjPoseSyncState(),
  objPoseSyncStats: {
    sampledPointCount: 0,
    sampledEdgeCount: 0,
  },
  renderedIdeal: createDefaultRenderedIdealState(),
  objPoseCalibration: createDefaultObjPoseCalibrationState(),
  poseSearchFrames: [],
  selectedPoseSearchFrameId: null,
  poseCenterSearch: createDefaultPoseCenterSearchState(),
  objErrorMessage: null,
  liveVideo: createEmptyLiveVideoState(),
  liveInput: createEmptyLiveInputState(),
  camera: createEmptyCameraState(),
  liveMediaPipe: {
    status: "uninitialized",
    error: null,
    liveTimestampMs: 0,
  },
  currentAnalysis: createEmptyCurrentAnalysis(),
  realtimeDebug: createDefaultRealtimeDebugState(),
  logs: ["ラボを初期化しました。レンダー理想2D preview は使用できます。renderedIdeal478 / WebGL warp は未実装です。"],
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
        <button class="primary-button" type="button" data-action="obj-pose-calibration-start">OBJ解析</button>
        <button class="secondary-button" type="button" data-action="export-debug">デバッグ出力</button>
      </div>
      <input class="visually-hidden" type="file" accept=".obj,text/plain,model/obj" data-input="obj-file" />
      <input class="visually-hidden" type="file" accept="video/*" data-input="live-video" />
      <div class="status-note">
        OBJ単体に基準姿勢を与えてレンダーし、IMAGE mode の MediaPipe で返却姿勢を評価します。MP4 / カメラ入力には依存しません。
      </div>
      <p class="export-status" data-debug-export-status></p>
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
const liveOverlayCanvas = getElement<HTMLCanvasElement>("[data-overlay='live']")
const objPreviewCanvas = getElement<HTMLCanvasElement>('[data-canvas="obj-preview"]')
const renderedIdealCanvas = getElement<HTMLCanvasElement>('[data-canvas="rendered-ideal"]')
const renderedIdealOverlayCanvas = getElement<HTMLCanvasElement>('[data-overlay="rendered-ideal"]')
const liveObjPosePreviewCanvas = getElement<HTMLCanvasElement>('[data-canvas="live-obj-pose-preview"]')
let liveFaceLandmarker: FaceLandmarker | null = null
let liveFaceLandmarkerPromise: Promise<FaceLandmarker> | null = null
let renderedIdealFaceLandmarker: FaceLandmarker | null = null
let renderedIdealFaceLandmarkerPromise: Promise<FaceLandmarker> | null = null
let liveAnalysisInProgress = false
let liveAnalysisRequestId = 0
let renderedIdealDetectInProgress = false
let renderedIdealTimestampMs = 0
let renderedIdealRenderSeq = 0
let renderedIdealDetectionTimingSamples: number[] = []
let lastAutoLiveAnalysisAtSec = Number.NEGATIVE_INFINITY
let realtimeTimerId: number | null = null
let realtimeVideoFrameCallbackId: number | null = null
let realtimeAnimationFrameId: number | null = null
let realtimeRunStartedAtMs: number | null = null
let realtimeTickInProgress = false
let realtimeTimingSamples: RealtimeTimingSample[] = []
let lastRealtimeAnimationFrameCurrentTimeSec: number | null = null
let cameraStream: MediaStream | null = null
let objPreviewDrag:
  | {
      pointerId: number
      lastX: number
      lastY: number
      mode: "rotate" | "pan"
    }
  | null = null

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
      <div class="preview-stage obj-preview-stage" data-obj-stage data-preview-status="not_ready">
        <canvas class="obj-preview-canvas" data-canvas="obj-preview" aria-label="OBJ 3D preview"></canvas>
        <div class="preview-placeholder obj-preview-placeholder" data-obj-preview-placeholder>
          <h3>OBJプレビュー</h3>
          <p data-obj-preview-message>OBJファイルを読み込むと、ここに OBJ 3D preview を表示します。</p>
        </div>
      </div>
      <div class="obj-preview-controls" aria-label="OBJ 3D preview 操作">
        <label class="select-field">
          <span>表示モード</span>
          <select data-control="obj-preview-mode">
            <option value="points">点群</option>
            <option value="wireframe">ワイヤー</option>
            <option value="points_wireframe">点群 + ワイヤー</option>
          </select>
        </label>
        <div class="button-row">
          <button class="small-button" type="button" data-action="obj-preview-front">正面</button>
          <button class="small-button" type="button" data-action="obj-preview-left">左</button>
          <button class="small-button" type="button" data-action="obj-preview-right">右</button>
          <button class="small-button" type="button" data-action="obj-preview-top">上</button>
          <button class="small-button" type="button" data-action="obj-preview-side">横</button>
          <button class="small-button" type="button" data-action="obj-preview-reset">表示リセット</button>
        </div>
      </div>
      <div class="obj-preview-summary" data-obj-preview-summary></div>
    </div>
  `
}

function renderRenderedIdealPreview() {
  return `
    <div class="preview-card" data-preview-panel="renderedIdeal">
      <div class="preview-stage rendered-ideal-stage" data-rendered-ideal-stage data-render-status="not_ready">
        <canvas class="rendered-ideal-canvas" data-canvas="rendered-ideal" aria-label="レンダー理想 2D preview"></canvas>
        <canvas class="rendered-ideal-landmark-overlay" data-overlay="rendered-ideal" aria-label="レンダー理想478点 overlay"></canvas>
        <div class="preview-placeholder">
          <h3>レンダー理想プレビュー</h3>
          <p data-rendered-ideal-message>OBJを読み込むと、ここにレンダー理想2Dプレビューを表示します。</p>
        </div>
      </div>
      <div class="obj-preview-controls rendered-ideal-controls" aria-label="レンダー理想 preview 操作">
        <div class="button-row">
          <button class="small-button" type="button" data-action="rendered-ideal-refresh">レンダー更新</button>
        </div>
        <label class="select-field">
          <span>背景色</span>
          <select data-control="rendered-ideal-background">
            <option value="light">light</option>
            <option value="dark">dark</option>
          </select>
        </label>
        <label class="select-field">
          <span>色</span>
          <select data-control="rendered-ideal-color">
            <option value="clay">clay</option>
            <option value="grayscale">grayscale</option>
          </select>
        </label>
      </div>
      <div class="review-card" data-rendered-ideal-summary>
        <p>OBJを読み込むと、ここにレンダー理想2Dプレビューを表示します。</p>
      </div>
    </div>
  `
}

function renderLivePreview() {
  return `
    <div class="preview-card live-preview-card" data-preview-panel="live">
      <div class="live-preview-grid">
        <section class="live-column-panel" aria-label="ライブ現在顔">
          <h3>ライブ現在顔</h3>
          <div class="preview-stage live-face-stage" data-live-stage data-loaded="false">
            <video class="video-preview" data-video="live" preload="metadata" playsinline controls></video>
            <canvas class="landmark-overlay" data-overlay="live"></canvas>
            <div class="preview-placeholder">
              <h3>ライブプレビュー</h3>
              <p>ライブ動画を読み込むと、ここにライブプレビューを表示します。</p>
            </div>
          </div>
          <div class="review-card live-input-source-card" data-live-input-source>
            <p>入力ソース: 未選択</p>
          </div>
          <div class="timeline-controls live-controls" aria-label="MP4再生操作">
            <button class="small-button" type="button" data-action="live-play">MP4再生</button>
            <button class="small-button" type="button" data-action="live-pause">MP4停止</button>
          </div>
          <details class="mp4-debug-details" data-mp4-debug-details>
            <summary>詳細MP4デバッグ</summary>
            <p class="control-note" data-mp4-debug-note>MP4入力時のみ使用できます。</p>
            <div class="timeline-controls live-controls" aria-label="詳細MP4デバッグ操作">
              <button class="small-button" type="button" data-action="live-analyze-current">現在フレーム解析</button>
              <label class="range-field">
                <span>シーク</span>
                <input type="range" min="0" step="0.001" value="0" data-range="live" />
              </label>
              <p class="frame-status" data-status="live-time">現在時刻: - / -</p>
            </div>
          </details>
          <div class="review-card" data-live-analysis>
            <p>ライブ動画の現在フレーム解析結果はまだありません。</p>
          </div>
        </section>

        <section class="live-column-panel" aria-label="現在姿勢OBJ">
          <h3>現在姿勢OBJ</h3>
          <div class="preview-stage obj-preview-stage live-obj-preview-stage" data-live-obj-stage data-preview-status="not_ready">
            <canvas class="obj-preview-canvas" data-canvas="live-obj-pose-preview" aria-label="現在姿勢 OBJ preview"></canvas>
            <div class="preview-placeholder obj-preview-placeholder">
              <h3>現在姿勢OBJ</h3>
              <p data-live-obj-preview-message>OBJを読み込むと、現在姿勢を反映したOBJ previewを表示します。</p>
            </div>
          </div>
          <div class="obj-preview-controls live-obj-controls" aria-label="現在姿勢 OBJ preview 操作">
            <p class="control-note">現在姿勢OBJは、姿勢同期確認用のワイヤー表示です。</p>
            <div class="button-row">
              <button class="small-button" type="button" data-action="live-obj-current-pose">現在姿勢</button>
              <button class="small-button" type="button" data-action="live-obj-reset-view">表示リセット</button>
            </div>
          </div>
          <div class="pose-sync-controls" aria-label="現在姿勢 OBJ 同期設定">
            <label class="overlay-toggle">
              <input type="checkbox" data-action="obj-pose-sync-enabled" />
              <span>姿勢同期</span>
            </label>
            <label class="overlay-toggle">
              <input type="checkbox" data-action="obj-pose-yaw-invert" />
              <span>yaw反転</span>
            </label>
            <label class="overlay-toggle">
              <input type="checkbox" data-action="obj-pose-pitch-invert" />
              <span>pitch反転</span>
            </label>
            <label class="overlay-toggle">
              <input type="checkbox" data-action="obj-pose-roll-invert" />
              <span>roll反転</span>
            </label>
            <label class="number-field">
              <span>yaw補正角度</span>
              <input type="number" step="0.1" data-control="obj-pose-yaw-offset" />
            </label>
            <label class="number-field">
              <span>pitch補正角度</span>
              <input type="number" step="0.1" data-control="obj-pose-pitch-offset" />
            </label>
            <label class="number-field">
              <span>roll補正角度</span>
              <input type="number" step="0.1" data-control="obj-pose-roll-offset" />
            </label>
            <label class="number-field">
              <span>回転中心X</span>
              <input type="number" min="-0.5" max="0.5" step="0.01" data-control="obj-pose-rotation-center-x" />
            </label>
            <label class="number-field">
              <span>回転中心Y</span>
              <input type="number" min="-0.5" max="0.5" step="0.01" data-control="obj-pose-rotation-center-y" />
            </label>
            <label class="number-field">
              <span>回転中心Z</span>
              <input type="number" min="-0.5" max="0.5" step="0.01" data-control="obj-pose-rotation-center-z" />
            </label>
            <button class="small-button pose-sync-button" type="button" data-action="obj-pose-rotation-center-reset">回転中心リセット</button>
          </div>
          <div class="review-card" data-live-obj-pose-summary>
            <p>OBJを読み込むと、現在姿勢を反映したOBJ previewを表示します。</p>
          </div>
        </section>
      </div>
      <section class="realtime-control-panel" aria-label="リアルタイム検証">
        <div class="realtime-control-header">
          <div>
            <h3>リアルタイム検証</h3>
            <p>MediaPipe検出は GPU delegate 固定で実行します。<br />入力ソースが MP4 の場合は、MP4デコード負荷を含む参考値です。入力ソースがカメラの場合は、本番想定に近い値として確認します。まず「現在顔解析のみ」で MediaPipe検出ms を確認し、その後「現在顔解析 + OBJレンダー」を確認してください。</p>
            <p class="realtime-drive-note">リアルタイム検証は、通常 requestVideoFrameCallback（動画フレーム更新コールバック）で実フレーム更新に同期して実行します。requestVideoFrameCallback が使えない場合のみ requestAnimationFrame（画面描画タイミング）へ fallback します。</p>
            <p class="realtime-playback-note" data-realtime-playback-note></p>
          </div>
          <div class="button-row realtime-buttons">
            <button class="small-button" type="button" data-action="realtime-start">開始</button>
            <button class="small-button" type="button" data-action="realtime-stop">停止</button>
            <button class="small-button" type="button" data-action="realtime-reset">リセット</button>
          </div>
        </div>
        <div class="realtime-control-grid">
          <fieldset class="mode-fieldset">
            <legend>処理モード</legend>
            <label class="radio-option">
              <input type="radio" name="realtime-mode" value="current_analysis_only" data-control="realtime-mode" />
              <span>現在顔解析のみ</span>
            </label>
            <label class="radio-option">
              <input type="radio" name="realtime-mode" value="current_analysis_obj_render" data-control="realtime-mode" />
              <span>現在顔解析 + OBJレンダー</span>
            </label>
          </fieldset>
          <label class="select-field realtime-fps-field">
            <span>目標FPS</span>
            <select data-control="realtime-target-fps">
              ${REALTIME_TARGET_FPS_OPTIONS.map((fps) => `<option value="${fps}">${fps}</option>`).join("")}
            </select>
          </label>
          <div class="realtime-inline-status" data-realtime-inline-status>
            状態: idle / 実効FPS: 未計測
          </div>
        </div>
      </section>
    </div>
  `
}

function bindEvents() {
  getElement<HTMLButtonElement>('[data-action="load-obj"]').addEventListener("click", () => {
    if (isObjPoseCalibrationRunning()) {
      return
    }
    objFileInput.click()
  })

  getElement<HTMLButtonElement>('[data-action="obj-pose-calibration-start"]').addEventListener("click", () => {
    void startObjPoseCalibration()
  })

  getElement<HTMLButtonElement>('[data-action="export-debug"]').addEventListener("click", () => {
    void exportDebug()
  })

  objFileInput.addEventListener("change", (event) => {
    const file = getSelectedFile(event)
    if (file && !isObjPoseCalibrationRunning()) {
      void loadObjFile(file)
    }
  })

  liveFileInput.addEventListener("change", (event) => {
    const file = getSelectedFile(event)
    if (file && !isPoseCenterSearchRunning()) {
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
    drawLiveOverlay()
    maybeAnalyzeLiveFrame()
    renderAll()
  })

  liveVideoElement.addEventListener("seeked", () => {
    if (state.liveInput.sourceType !== "video_file" || state.realtimeDebug.status === "running") {
      return
    }
    syncLiveCurrentTime()
    void analyzeCurrentLiveFrame("seeked")
  })

  liveVideoElement.addEventListener("error", () => {
    const message = liveVideoElement.error?.message || "動画の読み込みに失敗しました。"
    state.liveVideo.status = "error"
    state.liveVideo.errorMessage = message
    syncLiveInputState()
    addLog(`ライブ動画読み込みでエラーが発生しました: ${message}`)
    renderAll()
  })

  liveVideoElement.addEventListener("play", () => {
    state.liveVideo.playbackStatus = "playing"
    syncLiveInputState()
    renderAll()
  })

  liveVideoElement.addEventListener("pause", () => {
    state.liveVideo.playbackStatus = state.liveVideo.loaded ? "paused" : "stopped"
    syncLiveInputState()
    if (state.liveVideo.loaded && state.realtimeDebug.status !== "running" && !isPoseCenterSearchRunning()) {
      void analyzeCurrentLiveFrame("pause")
    }
    renderAll()
  })

  liveVideoElement.addEventListener("ended", () => {
    state.liveVideo.playbackStatus = "stopped"
    syncLiveInputState()
    if (state.liveVideo.loaded && state.realtimeDebug.status !== "running" && !isPoseCenterSearchRunning()) {
      void analyzeCurrentLiveFrame("ended")
    }
    renderAll()
  })

  getElement<HTMLButtonElement>('[data-action="live-play"]').addEventListener("click", () => {
    if (isPoseCenterSearchRunning()) {
      return
    }
    if (!isVideoFileInput()) {
      addLog("MP4ファイル入力時のみ再生できます。")
      renderAll()
      return
    }
    void liveVideoElement.play().catch((error) => {
      const message = error instanceof Error ? error.message : String(error)
      addLog(`ライブ動画の再生に失敗しました: ${message}`)
      renderAll()
    })
  })

  getElement<HTMLButtonElement>('[data-action="live-pause"]').addEventListener("click", () => {
    if (isPoseCenterSearchRunning()) {
      return
    }
    if (!isVideoFileInput()) {
      return
    }
    liveVideoElement.pause()
  })

  getElement<HTMLButtonElement>('[data-action="live-analyze-current"]').addEventListener(
    "click",
    () => {
      if (isPoseCenterSearchRunning()) {
        return
      }
      void analyzeCurrentLiveFrame("manual")
    },
  )

  getElement<HTMLButtonElement>('[data-action="rendered-ideal-refresh"]').addEventListener("click", () => {
    renderAll()
  })

  getElement<HTMLSelectElement>('[data-control="rendered-ideal-background"]').addEventListener("change", (event) => {
    const value = event.currentTarget.value
    if (isRenderedIdealBackgroundMode(value)) {
      state.renderedIdeal.backgroundMode = value
      renderAll()
    }
  })

  getElement<HTMLSelectElement>('[data-control="rendered-ideal-color"]').addEventListener("change", (event) => {
    const value = event.currentTarget.value
    if (isRenderedIdealColorMode(value)) {
      state.renderedIdeal.colorMode = value
      renderAll()
    }
  })

  getElement<HTMLInputElement>("[data-range='live']").addEventListener("input", (event) => {
    const value = Number(event.currentTarget.value)
    if (Number.isFinite(value)) {
      seekLiveVideoTo(value)
    }
  })

  getElement<HTMLSelectElement>('[data-control="obj-preview-mode"]').addEventListener("change", (event) => {
    const value = event.currentTarget.value
    if (isObjPreviewMode(value)) {
      state.objPreview.mode = value
      renderAll()
    }
  })

  getElement<HTMLInputElement>('[data-action="obj-pose-sync-enabled"]').addEventListener("change", (event) => {
    state.objPoseSync.enabled = event.currentTarget.checked
    updateObjPoseSyncFromCurrentAnalysis()
    renderAll()
  })

  bindObjPoseSignToggle("obj-pose-yaw-invert", "yawSign")
  bindObjPoseSignToggle("obj-pose-pitch-invert", "pitchSign")
  bindObjPoseSignToggle("obj-pose-roll-invert", "rollSign")
  bindObjPoseOffsetInput("obj-pose-yaw-offset", "yawOffsetDeg")
  bindObjPoseOffsetInput("obj-pose-pitch-offset", "pitchOffsetDeg")
  bindObjPoseOffsetInput("obj-pose-roll-offset", "rollOffsetDeg")
  bindObjPoseRotationCenterInput("obj-pose-rotation-center-x", "rotationCenterX")
  bindObjPoseRotationCenterInput("obj-pose-rotation-center-y", "rotationCenterY")
  bindObjPoseRotationCenterInput("obj-pose-rotation-center-z", "rotationCenterZ")

  getElement<HTMLButtonElement>('[data-action="live-obj-current-pose"]').addEventListener("click", () => {
    updateObjPoseSyncFromCurrentAnalysis()
    renderAll()
  })

  getElement<HTMLButtonElement>('[data-action="live-obj-reset-view"]').addEventListener("click", () => {
    state.objPoseSync = createDefaultObjPoseSyncState()
    updateObjPoseSyncFromCurrentAnalysis()
    renderAll()
  })

  getElement<HTMLButtonElement>('[data-action="obj-pose-rotation-center-reset"]').addEventListener("click", () => {
    state.objPoseSync = {
      ...state.objPoseSync,
      rotationCenterX: 0,
      rotationCenterY: 0,
      rotationCenterZ: 0,
    }
    renderAll()
  })

  getElement<HTMLButtonElement>('[data-action="realtime-start"]').addEventListener("click", () => {
    startRealtimeValidation()
  })

  getElement<HTMLButtonElement>('[data-action="realtime-stop"]').addEventListener("click", () => {
    stopRealtimeValidation("stopped")
    renderAll()
  })

  getElement<HTMLButtonElement>('[data-action="realtime-reset"]').addEventListener("click", () => {
    resetRealtimeValidation()
    renderAll()
  })

  app.querySelectorAll<HTMLInputElement>('[data-control="realtime-mode"]').forEach((input) => {
    input.addEventListener("change", (event) => {
      const value = event.currentTarget.value
      if (isRealtimeMode(value)) {
        state.realtimeDebug.mode = value
        state.realtimeDebug.errorMessage = null
        renderAll()
      }
    })
  })

  getElement<HTMLSelectElement>('[data-control="realtime-target-fps"]').addEventListener("change", (event) => {
    const value = Number(event.currentTarget.value)
    if (isRealtimeTargetFps(value)) {
      state.realtimeDebug.targetFps = value
      if (
        state.realtimeDebug.status === "running" &&
        state.realtimeDebug.driveMode === "interval_legacy"
      ) {
        restartRealtimeDrive()
      }
      renderAll()
    }
  })

  bindObjPreviewPreset("obj-preview-front", { yawDeg: 0, pitchDeg: 0, rollDeg: 0 })
  bindObjPreviewPreset("obj-preview-left", { yawDeg: -90, pitchDeg: 0, rollDeg: 0 })
  bindObjPreviewPreset("obj-preview-right", { yawDeg: 90, pitchDeg: 0, rollDeg: 0 })
  bindObjPreviewPreset("obj-preview-top", { yawDeg: 0, pitchDeg: -90, rollDeg: 0 })
  bindObjPreviewPreset("obj-preview-side", { yawDeg: 90, pitchDeg: 0, rollDeg: 0 })

  getElement<HTMLButtonElement>('[data-action="obj-preview-reset"]').addEventListener("click", () => {
    state.objPreview = createDefaultObjPreviewState()
    renderAll()
  })

  objPreviewCanvas.addEventListener("pointerdown", (event) => {
    objPreviewDrag = {
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
      mode: event.shiftKey ? "pan" : "rotate",
    }
    objPreviewCanvas.setPointerCapture(event.pointerId)
  })

  objPreviewCanvas.addEventListener("pointermove", (event) => {
    if (!objPreviewDrag || objPreviewDrag.pointerId !== event.pointerId) {
      return
    }

    const dx = event.clientX - objPreviewDrag.lastX
    const dy = event.clientY - objPreviewDrag.lastY
    objPreviewDrag.lastX = event.clientX
    objPreviewDrag.lastY = event.clientY

    if (objPreviewDrag.mode === "pan") {
      state.objPreview.panX += dx / getObjCanvasScale()
      state.objPreview.panY -= dy / getObjCanvasScale()
    } else {
      state.objPreview.yawDeg = normalizeDegrees(state.objPreview.yawDeg + dx * 0.35)
      state.objPreview.pitchDeg = clamp(state.objPreview.pitchDeg + dy * 0.35, -180, 180)
    }

    renderAll()
  })

  objPreviewCanvas.addEventListener("pointerup", (event) => {
    if (objPreviewDrag?.pointerId === event.pointerId) {
      objPreviewDrag = null
    }
  })

  objPreviewCanvas.addEventListener("pointercancel", () => {
    objPreviewDrag = null
  })

  objPreviewCanvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault()
      const zoomDelta = event.deltaY < 0 ? 1.08 : 0.92
      state.objPreview.zoom = clamp(state.objPreview.zoom * zoomDelta, 0.15, 8)
      renderAll()
    },
    { passive: false },
  )

  window.addEventListener("resize", () => {
    renderObjPreviewCanvas()
    renderRenderedIdealCanvas()
    renderObjPoseSyncCanvas()
    drawLiveOverlay()
    drawRenderedIdealOverlay()
  })

  window.addEventListener("beforeunload", () => {
    cleanup()
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

function bindObjPreviewPreset(
  action: string,
  preset: Pick<ObjPreviewState, "yawDeg" | "pitchDeg" | "rollDeg">,
) {
  getElement<HTMLButtonElement>(`[data-action="${action}"]`).addEventListener("click", () => {
    state.objPreview = {
      ...state.objPreview,
      ...preset,
      panX: 0,
      panY: 0,
    }
    renderAll()
  })
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

function bindObjPoseSignToggle(
  action: string,
  key: "yawSign" | "pitchSign" | "rollSign",
) {
  getElement<HTMLInputElement>(`[data-action="${action}"]`).addEventListener("change", (event) => {
    state.objPoseSync[key] = event.currentTarget.checked ? -1 : 1
    updateObjPoseSyncFromCurrentAnalysis()
    renderAll()
  })
}

function bindObjPoseOffsetInput(
  control: string,
  key: "yawOffsetDeg" | "pitchOffsetDeg" | "rollOffsetDeg",
) {
  getElement<HTMLInputElement>(`[data-control="${control}"]`).addEventListener("input", (event) => {
    const value = Number(event.currentTarget.value)
    state.objPoseSync[key] = Number.isFinite(value) ? value : 0
    updateObjPoseSyncFromCurrentAnalysis()
    renderAll()
  })
}

function bindObjPoseRotationCenterInput(
  control: string,
  key: "rotationCenterX" | "rotationCenterY" | "rotationCenterZ",
) {
  getElement<HTMLInputElement>(`[data-control="${control}"]`).addEventListener("input", (event) => {
    const value = Number(event.currentTarget.value)
    state.objPoseSync[key] = Number.isFinite(value) ? clamp(value, -0.5, 0.5) : 0
    renderAll()
  })
}

async function loadObjFile(file: File) {
  state.objFile = {
    loaded: true,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || "unknown",
  }
  state.objSummary = createFileObjSummary(file, "not_parsed")
  state.objGeometry = createEmptyObjGeometry()
  state.objPreviewStats = {
    sampledPointCount: 0,
    sampledEdgeCount: 0,
  }
  state.objErrorMessage = null
  state.activePreviewTab = "obj"
  addLog(`OBJファイル情報を読み込みました: ${file.name}`)
  renderAll()

  try {
    const objText = await file.text()
    const parseResult = parseObjText(objText)
    state.objSummary = createParsedObjSummary(file, parseResult)
    state.objGeometry = {
      vertices: parseResult.vertices,
      faces: parseResult.faces,
      edges: createUniqueEdges(parseResult.faces),
    }
    addLog(`OBJ解析が完了しました: 頂点 ${state.objSummary.vertexCount} / 面 ${state.objSummary.faceCount} / 警告 ${state.objSummary.warningCount}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("OBJ parse failed", error)
    state.objSummary = createFileObjSummary(file, "error")
    state.objGeometry = createEmptyObjGeometry()
    state.objPreviewStats = {
      sampledPointCount: 0,
      sampledEdgeCount: 0,
    }
    state.objErrorMessage = message
    addLog(`OBJ解析に失敗しました: ${message}`)
  }

  renderAll()
}

function loadLiveVideo(file: File) {
  stopCameraInput()
  if (state.liveVideo.objectUrl) {
    URL.revokeObjectURL(state.liveVideo.objectUrl)
  }

  stopRealtimeValidation("stopped")
  resetLiveAnalysisResults()
  const objectUrl = URL.createObjectURL(file)
  state.liveVideo = {
    loaded: true,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || "unknown",
    objectUrl,
    durationSec: null,
    width: null,
    height: null,
    currentTimeSec: 0,
    playbackStatus: "stopped",
    status: "loaded",
    errorMessage: null,
  }
  state.liveInput = {
    sourceType: "video_file",
    status: "loaded",
    fileName: file.name,
    width: null,
    height: null,
    durationSec: null,
    currentTimeSec: 0,
    paused: true,
    readyState: liveVideoElement.readyState,
  }
  state.camera = createEmptyCameraState()
  liveVideoElement.srcObject = null
  liveVideoElement.src = objectUrl
  liveVideoElement.load()
  state.activePreviewTab = "live"
  addLog(`MP4ファイルを読み込みました: ${file.name}`)
  renderAll()
}

async function startCameraInput() {
  stopRealtimeValidation("stopped")
  resetLiveAnalysisResults()
  stopCameraInput({ preserveCameraState: false })
  if (state.liveVideo.objectUrl) {
    URL.revokeObjectURL(state.liveVideo.objectUrl)
  }

  state.camera = {
    ...createEmptyCameraState(),
    status: "starting",
  }
  state.liveVideo = {
    loaded: false,
    fileName: null,
    fileSize: null,
    fileType: null,
    objectUrl: null,
    durationSec: null,
    width: null,
    height: null,
    currentTimeSec: null,
    playbackStatus: "stopped",
    status: "loaded",
    errorMessage: null,
  }
  state.liveInput = {
    ...createEmptyLiveInputState(),
    sourceType: "camera",
    status: "starting",
  }
  state.activePreviewTab = "live"
  renderAll()

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 },
      },
      audio: false,
    })
    cameraStream = stream
    liveVideoElement.removeAttribute("src")
    liveVideoElement.srcObject = stream
    liveVideoElement.muted = true
    liveVideoElement.playsInline = true
    state.liveVideo = {
      loaded: true,
      fileName: null,
      fileSize: null,
      fileType: "camera",
      objectUrl: null,
      durationSec: null,
      width: null,
      height: null,
      currentTimeSec: 0,
      playbackStatus: "playing",
      status: "loaded",
      errorMessage: null,
    }
    syncCameraSettings()
    syncLiveInputState()
    await liveVideoElement.play()
    state.liveVideo.playbackStatus = "playing"
    state.camera.status = "running"
    syncLiveVideoMetadata()
    addLog("カメラ入力を開始しました。")
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    stopCameraInput({ preserveCameraState: true })
    state.camera = {
      ...state.camera,
      status: "error",
      errorMessage: "カメラを開始できませんでした。ブラウザの権限または接続状態を確認してください。",
    }
    state.liveVideo = {
      ...createEmptyLiveVideoState(),
      status: "error",
      errorMessage: state.camera.errorMessage,
    }
    state.liveInput = {
      ...createEmptyLiveInputState(),
      sourceType: "camera",
      status: "error",
    }
    addLog(`カメラ開始に失敗しました: ${message}`)
  } finally {
    renderAll()
  }
}

function stopCameraInput(options: { preserveCameraState?: boolean } = {}) {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop())
    cameraStream = null
  }

  if (state.liveInput.sourceType === "camera" || liveVideoElement.srcObject) {
    stopRealtimeValidation("stopped")
    liveVideoElement.pause()
    liveVideoElement.srcObject = null
    liveVideoElement.removeAttribute("src")
    liveVideoElement.load()
    state.liveVideo = createEmptyLiveVideoState()
    state.liveInput = createEmptyLiveInputState()
    resetLiveAnalysisResults()
  }

  if (!options.preserveCameraState) {
    state.camera = {
      ...createEmptyCameraState(),
      status: "stopped",
    }
  }
}

async function getLiveFaceLandmarker() {
  if (liveFaceLandmarker) {
    return liveFaceLandmarker
  }

  if (liveFaceLandmarkerPromise) {
    return liveFaceLandmarkerPromise
  }

  state.liveMediaPipe.status = "initializing"
  state.liveMediaPipe.error = null
  resetLiveTimestamp()
  renderAll()

  liveFaceLandmarkerPromise = initializeFaceLandmarker()
  try {
    liveFaceLandmarker = await liveFaceLandmarkerPromise
    state.liveMediaPipe.status = "ready"
    return liveFaceLandmarker
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("MediaPipe initialization failed", error)
    state.liveMediaPipe.status = "error"
    state.liveMediaPipe.error = message
    throw error
  } finally {
    liveFaceLandmarkerPromise = null
    renderAll()
  }
}

async function getRenderedIdealFaceLandmarker() {
  if (renderedIdealFaceLandmarker) {
    return renderedIdealFaceLandmarker
  }

  if (renderedIdealFaceLandmarkerPromise) {
    return renderedIdealFaceLandmarkerPromise
  }

  renderedIdealFaceLandmarkerPromise = initializeRenderedIdealFaceLandmarker()
  try {
    renderedIdealFaceLandmarker = await renderedIdealFaceLandmarkerPromise
    return renderedIdealFaceLandmarker
  } finally {
    renderedIdealFaceLandmarkerPromise = null
  }
}

async function initializeFaceLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH)

  return FaceLandmarker.createFromOptions(vision, createLiveFaceLandmarkerOptions())
}

async function initializeRenderedIdealFaceLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH)

  return FaceLandmarker.createFromOptions(vision, createRenderedIdealFaceLandmarkerOptions())
}

async function analyzeCurrentLiveFrame(
  reason: "manual" | "timeupdate" | "seeked" | "pause" | "ended" | "realtime",
  options: { skipFinalRender?: boolean; timestampMs?: number } = {},
): Promise<CurrentAnalysisTimingBreakdown | null> {
  if (isPoseCenterSearchRunning()) {
    return null
  }

  if (!state.liveVideo.loaded || liveAnalysisInProgress) {
    if (!state.liveVideo.loaded) {
      state.realtimeDebug.skippedByNoVideoCount += 1
    }
    if (liveAnalysisInProgress) {
      state.realtimeDebug.skippedByInProgressCount += 1
    }
    return null
  }

  const analysisTiming = createEmptyCurrentAnalysisTimingBreakdown()
  const analysisStartMs = performance.now()

  if (liveVideoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    state.currentAnalysis = {
      ...createEmptyCurrentAnalysis(),
      status: "error",
      analyzedTimeSec: state.liveVideo.currentTimeSec,
      errorMessage: "動画フレームがまだ読み込まれていません。",
    }
    updateObjPoseSyncFromCurrentAnalysis()
    if (!options.skipFinalRender) {
      renderAll()
    }
    analysisTiming.currentAnalysisTotalMs = performance.now() - analysisStartMs
    return analysisTiming
  }

  const requestId = liveAnalysisRequestId + 1
  liveAnalysisRequestId = requestId
  liveAnalysisInProgress = true
  state.currentAnalysis = {
    ...state.currentAnalysis,
    status: "analyzing",
    errorMessage: null,
  }
  updateObjPoseSyncFromCurrentAnalysis()
  if (!options.skipFinalRender) {
    renderAll()
  }

  try {
    const detector = await getLiveFaceLandmarker()
    if (requestId !== liveAnalysisRequestId) {
      analysisTiming.currentAnalysisTotalMs = performance.now() - analysisStartMs
      return analysisTiming
    }

    const timeSec = liveVideoElement.currentTime || state.liveVideo.currentTimeSec || 0
    const timestampMs = options.timestampMs ?? nextLiveTimestampMs()
    state.liveMediaPipe.liveTimestampMs = timestampMs
    const detectStartMs = performance.now()
    const result = detector.detectForVideo(liveVideoElement, timestampMs)
    analysisTiming.mediaPipeDetectMs = performance.now() - detectStartMs

    const buildStartMs = performance.now()
    state.currentAnalysis = buildCurrentFrameAnalysis(result, timeSec)
    analysisTiming.buildCurrentAnalysisMs = performance.now() - buildStartMs
    updateObjPoseSyncFromCurrentAnalysis()
    lastAutoLiveAnalysisAtSec = timeSec

    if (reason === "manual") {
      addLog(
        state.currentAnalysis.status === "detected"
          ? "ライブ動画 current frame を解析しました。"
          : `ライブ動画 current frame 解析結果: ${state.currentAnalysis.status}`,
      )
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Current frame analysis failed", error)
    state.currentAnalysis = {
      ...createEmptyCurrentAnalysis(),
      status: "error",
      analyzedTimeSec: state.liveVideo.currentTimeSec,
      errorMessage: `MediaPipe error: ${message}`,
      qualitySummary: {
        ...createEmptyQualitySummary(),
        status: "error",
      },
    }
    updateObjPoseSyncFromCurrentAnalysis()
    state.liveMediaPipe.status = "error"
    state.liveMediaPipe.error = message
    disposeLiveFaceLandmarker("error")
    addLog(`ライブ動画 current frame 解析でエラーが発生しました: ${message}`)
  } finally {
    liveAnalysisInProgress = false
    analysisTiming.currentAnalysisTotalMs = sumNullableTimings(
      analysisTiming.mediaPipeDetectMs,
      analysisTiming.buildCurrentAnalysisMs,
      analysisTiming.liveOverlayDrawMs,
      analysisTiming.debugUpdateMs,
    ) ?? (performance.now() - analysisStartMs)
    if (!options.skipFinalRender) {
      renderAll()
    }
  }

  return analysisTiming
}

function maybeAnalyzeLiveFrame() {
  if (isPoseCenterSearchRunning()) {
    return
  }

  if (state.realtimeDebug.status === "running") {
    state.realtimeDebug.skippedTimeupdateDuringRealtimeCount += 1
    return
  }

  if (state.liveVideo.playbackStatus !== "playing") {
    state.realtimeDebug.skippedByPausedVideoCount += 1
  }

  if (
    !state.liveVideo.loaded ||
    state.liveVideo.playbackStatus !== "playing" ||
    liveAnalysisInProgress
  ) {
    if (!state.liveVideo.loaded) {
      state.realtimeDebug.skippedByNoVideoCount += 1
    }
    if (liveAnalysisInProgress) {
      state.realtimeDebug.skippedByInProgressCount += 1
    }
    return
  }

  const currentTimeSec = liveVideoElement.currentTime || state.liveVideo.currentTimeSec || 0
  if (currentTimeSec - lastAutoLiveAnalysisAtSec < LIVE_AUTO_ANALYSIS_INTERVAL_SEC) {
    return
  }

  state.realtimeDebug.timeupdateAnalysisRequestCount += 1
  void analyzeCurrentLiveFrame("timeupdate")
}

function updateObjPoseSyncFromCurrentAnalysis() {
  const pose = state.currentAnalysis.pose
  if (
    !state.objPoseSync.enabled ||
    state.currentAnalysis.status !== "detected" ||
    !hasFullPose(pose)
  ) {
    state.objPoseSync = {
      ...state.objPoseSync,
      appliedYawDeg: null,
      appliedPitchDeg: null,
      appliedRollDeg: null,
      source: "none",
    }
    return
  }

  state.objPoseSync = {
    ...state.objPoseSync,
    appliedYawDeg: (pose.yaw ?? 0) * state.objPoseSync.yawSign + state.objPoseSync.yawOffsetDeg,
    appliedPitchDeg:
      (pose.pitch ?? 0) * state.objPoseSync.pitchSign + state.objPoseSync.pitchOffsetDeg,
    appliedRollDeg: (pose.roll ?? 0) * state.objPoseSync.rollSign + state.objPoseSync.rollOffsetDeg,
    source: "current_frame",
  }
}

function buildCurrentFrameAnalysis(
  result: FaceLandmarkerResultLike,
  timeSec: number,
): CurrentFrameAnalysis {
  const landmarks = result.faceLandmarks[0] ?? []
  const blendshapes = (result.faceBlendshapes[0]?.categories ?? []).map((category) => ({
    categoryName: category.categoryName,
    score: category.score,
  }))
  const pose = estimateNullablePose(result.facialTransformationMatrixes[0])
  const hasFace = result.faceLandmarks.length > 0
  const validLandmarks = landmarks.length === REQUIRED_LANDMARK_COUNT

  if (!hasFace) {
    return {
      ...createEmptyCurrentAnalysis(),
      status: "no_face",
      analyzedTimeSec: timeSec,
      landmarkCount: 0,
      pose,
      blendshapes,
      expressionSummary: createExpressionSummary(blendshapes, "unknown"),
      qualityScore: 0,
      qualitySummary: {
        status: "no_face",
        expectedLandmarkCount: REQUIRED_LANDMARK_COUNT,
        landmarkCount: 0,
        hasPose: hasFullPose(pose),
      },
      errorMessage: "no_face",
    }
  }

  if (!validLandmarks) {
    return {
      ...createEmptyCurrentAnalysis(),
      status: "error",
      analyzedTimeSec: timeSec,
      landmarkCount: landmarks.length,
      pose,
      blendshapes,
      expressionSummary: createExpressionSummary(blendshapes, "unknown"),
      qualityScore: 0,
      qualitySummary: {
        status: "invalid_landmarks",
        expectedLandmarkCount: REQUIRED_LANDMARK_COUNT,
        landmarkCount: landmarks.length,
        hasPose: hasFullPose(pose),
      },
      errorMessage: `invalid_landmarks: ${landmarks.length}`,
    }
  }

  const expressionGroup = classifyExpressionGroup(blendshapes)
  return {
    status: "detected",
    analyzedTimeSec: timeSec,
    landmarks478: mapLandmarks(landmarks),
    landmarkCount: landmarks.length,
    pose,
    blendshapes,
    expressionSummary: createExpressionSummary(blendshapes, expressionGroup),
    qualityScore: 1,
    qualitySummary: {
      status: "valid",
      expectedLandmarkCount: REQUIRED_LANDMARK_COUNT,
      landmarkCount: landmarks.length,
      hasPose: hasFullPose(pose),
    },
    errorMessage: null,
  }
}

function requestRenderedIdealDetection(renderSeq: number) {
  state.renderedIdeal.detection = {
    ...state.renderedIdeal.detection,
    renderSeq,
    requestCount: state.renderedIdeal.detection.requestCount + 1,
  }

  if (isPoseCenterSearchRunning()) {
    state.renderedIdeal.detection = {
      ...state.renderedIdeal.detection,
      skippedByPoseSearchCount: state.renderedIdeal.detection.skippedByPoseSearchCount + 1,
    }
    return
  }

  if (renderedIdealDetectInProgress) {
    state.renderedIdeal.detection = {
      ...state.renderedIdeal.detection,
      droppedCount: state.renderedIdeal.detection.droppedCount + 1,
    }
    return
  }

  void detectRenderedIdealCanvas(renderSeq)
}

async function detectRenderedIdealCanvas(renderSeq: number) {
  renderedIdealDetectInProgress = true
  state.renderedIdeal.detection = {
    ...state.renderedIdeal.detection,
    status: "detecting",
    landmarks478: null,
    landmarkCount: null,
    pose: {
      yaw: null,
      pitch: null,
      roll: null,
    },
    expressionSummary: null,
    qualityScore: null,
    errorMessage: null,
    detectedRenderSeq: null,
    renderSeq,
    startedCount: state.renderedIdeal.detection.startedCount + 1,
  }
  renderRenderedIdealSummaryCard()
  renderDebugContent()

  try {
    const detector = await getRenderedIdealFaceLandmarker()
    const detectStartMs = performance.now()
    const result = detector.detect(renderedIdealCanvas)
    const detectMs = performance.now() - detectStartMs
    addRenderedIdealDetectionTimingSample(detectMs)
    const averageDetectMs = averageNullableTiming(renderedIdealDetectionTimingSamples)
    const nextDetection = buildRenderedIdealDetectionState(result, renderSeq, detectMs, averageDetectMs)
    const currentDetection = state.renderedIdeal.detection

    if (currentDetection.renderSeq !== renderSeq) {
      state.renderedIdeal.detection = {
        ...currentDetection,
        status: "not_detected",
        landmarks478: null,
        detectMs,
        averageDetectMs,
        landmarkCount: null,
        pose: nextDetection.pose,
        expressionSummary: nextDetection.expressionSummary,
        qualityScore: null,
        errorMessage: "stale_render_seq",
        detectedRenderSeq: renderSeq,
        completedCount: currentDetection.completedCount + 1,
      }
    } else {
      state.renderedIdeal.detection = {
        ...currentDetection,
        ...nextDetection,
        completedCount: currentDetection.completedCount + 1,
      }
    }
    state.realtimeDebug.mediaPipeRedetectMs = detectMs
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Rendered ideal MediaPipe detection failed", error)
    state.renderedIdeal.detection = {
      ...state.renderedIdeal.detection,
      status: "error",
      landmarks478: null,
      landmarkCount: null,
      qualityScore: null,
      errorMessage: `MediaPipe error: ${message}`,
      detectedRenderSeq: renderSeq,
      errorCount: state.renderedIdeal.detection.errorCount + 1,
    }
  } finally {
    renderedIdealDetectInProgress = false
    drawRenderedIdealOverlay()
    renderRenderedIdealSummaryCard()
    renderRealtimeControls()
    renderDebugContent()
  }
}

function buildRenderedIdealDetectionState(
  result: FaceLandmarkerResultLike,
  renderSeq: number,
  detectMs: number,
  averageDetectMs: number | null,
): Omit<
  RenderedIdealDetectionState,
  "requestCount" | "startedCount" | "completedCount" | "droppedCount" | "errorCount"
> {
  const landmarks = result.faceLandmarks[0] ?? []
  const blendshapes = (result.faceBlendshapes[0]?.categories ?? []).map((category) => ({
    categoryName: category.categoryName,
    score: category.score,
  }))
  const pose = estimateNullablePose(result.facialTransformationMatrixes[0])
  const hasFace = result.faceLandmarks.length > 0
  const validLandmarks = landmarks.length === REQUIRED_LANDMARK_COUNT

  if (!hasFace) {
    return {
      status: "not_detected",
      landmarks478: null,
      detectMs,
      averageDetectMs,
      landmarkCount: 0,
      pose,
      expressionSummary: createExpressionSummary(blendshapes, "unknown"),
      qualityScore: 0,
      errorMessage: "no_face",
      renderSeq,
      detectedRenderSeq: renderSeq,
    }
  }

  if (!validLandmarks) {
    return {
      status: "error",
      landmarks478: null,
      detectMs,
      averageDetectMs,
      landmarkCount: landmarks.length,
      pose,
      expressionSummary: createExpressionSummary(blendshapes, "unknown"),
      qualityScore: 0,
      errorMessage: `invalid_landmarks: ${landmarks.length}`,
      renderSeq,
      detectedRenderSeq: renderSeq,
    }
  }

  return {
    status: "detected",
    landmarks478: mapLandmarks(landmarks),
    detectMs,
    averageDetectMs,
    landmarkCount: landmarks.length,
    pose,
    expressionSummary: createExpressionSummary(blendshapes, classifyExpressionGroup(blendshapes)),
    qualityScore: 1,
    errorMessage: null,
    renderSeq,
    detectedRenderSeq: renderSeq,
  }
}

function addRenderedIdealDetectionTimingSample(detectMs: number) {
  renderedIdealDetectionTimingSamples = [
    detectMs,
    ...renderedIdealDetectionTimingSamples,
  ].slice(0, REALTIME_AVERAGE_SAMPLE_COUNT)
}

async function startObjPoseCalibration() {
  if (isObjPoseCalibrationRunning()) {
    return
  }

  if (!canRenderRenderedIdealGeometry()) {
    state.objPoseCalibration = {
      ...createDefaultObjPoseCalibrationState(),
      status: "error",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      poseCount: OBJ_POSE_CALIBRATION_POSES.length,
      errorMessage: "OBJ読込を完了してからOBJ解析を実行してください。",
    }
    addLog("OBJ解析を開始できません。OBJ読込を完了してください。")
    renderAll()
    return
  }

  stopRealtimeValidation("stopped")
  const candidates = createObjPoseCalibrationCandidatePoints()
  const startedAtMs = performance.now()
  state.activeDebugTab = "objPoseCalibration"
  state.objPoseCalibration = {
    ...createDefaultObjPoseCalibrationState(),
    status: "running",
    startedAt: new Date().toISOString(),
    poseCount: OBJ_POSE_CALIBRATION_POSES.length,
    candidateCount: candidates.length,
    totalEvaluationCount: candidates.length * OBJ_POSE_CALIBRATION_POSES.length,
  }
  addLog(`OBJ解析を開始しました: ${candidates.length}候補 / ${OBJ_POSE_CALIBRATION_POSES.length} pose`)
  renderAll()

  try {
    const detectionIdle = await waitForRenderedIdealDetectionIdle()
    if (!detectionIdle) {
      throw new Error("rendered ideal detection is still running")
    }

    const detector = await getRenderedIdealFaceLandmarker()
    for (const [index, rotationCenter] of candidates.entries()) {
      const candidate = evaluateObjPoseCalibrationCandidate(detector, rotationCenter)
      updateObjPoseCalibrationProgress(candidate, startedAtMs)
      renderRenderedIdealSummaryCard()
      renderDebugContent()

      if (index % 1 === 0) {
        await waitForNextFrame()
      }
    }

    state.objPoseCalibration = {
      ...state.objPoseCalibration,
      status: "completed",
      completedAt: new Date().toISOString(),
      elapsedMs: performance.now() - startedAtMs,
      estimatedRemainingMs: 0,
      errorMessage: null,
    }
    addLog(
      state.objPoseCalibration.bestCandidate
        ? `OBJ解析が完了しました。best score: ${formatNullableNumber(state.objPoseCalibration.bestCandidate.score)}`
        : "OBJ解析が完了しましたが、検出できた候補がありませんでした。",
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("OBJ pose calibration failed", error)
    state.objPoseCalibration = {
      ...state.objPoseCalibration,
      status: "error",
      completedAt: new Date().toISOString(),
      elapsedMs: performance.now() - startedAtMs,
      errorMessage: message,
    }
    addLog(`OBJ解析でエラーが発生しました: ${message}`)
  } finally {
    renderAll()
  }
}

function evaluateObjPoseCalibrationCandidate(
  detector: FaceLandmarker,
  rotationCenter: ObjVertex,
): ObjPoseCalibrationCandidate {
  const poseResults = OBJ_POSE_CALIBRATION_POSES.map((pose) =>
    evaluateObjPoseCalibrationCandidateOnPose(detector, rotationCenter, pose),
  )
  return buildObjPoseCalibrationCandidate(rotationCenter, poseResults)
}

function evaluateObjPoseCalibrationCandidateOnPose(
  detector: FaceLandmarker,
  rotationCenter: ObjVertex,
  pose: ObjPoseCalibrationPose,
): ObjPoseCalibrationPoseResult {
  const expectedPose = {
    yaw: pose.yawDeg,
    pitch: pose.pitchDeg,
    roll: pose.rollDeg,
  }
  const baseResult: ObjPoseCalibrationPoseResult = {
    poseId: pose.id,
    poseLabel: pose.label,
    expectedPose,
    returnedPose: {
      yaw: null,
      pitch: null,
      roll: null,
    },
    poseError: null,
    yawError: null,
    pitchError: null,
    rollError: null,
    detected: false,
    detectMs: null,
    errorMessage: null,
  }

  try {
    const renderSummary = renderRenderedIdealCanvasTo(renderedIdealCanvas, rotationCenter, expectedPose)
    if (renderSummary.status !== "rendered") {
      return {
        ...baseResult,
        errorMessage: renderSummary.errorMessage ?? renderSummary.status,
      }
    }

    const detectStartMs = performance.now()
    const result = detector.detect(renderedIdealCanvas)
    const detectMs = performance.now() - detectStartMs
    const detection = buildRenderedIdealDetectionState(result, -1, detectMs, null)
    const returnedPose = detection.pose

    if (detection.status !== "detected" || !hasFullPose(returnedPose)) {
      return {
        ...baseResult,
        returnedPose: roundPoseForState(returnedPose),
        detectMs,
        errorMessage: detection.errorMessage ?? detection.status,
      }
    }

    const yawError = Math.abs(expectedPose.yaw - returnedPose.yaw!)
    const pitchError = Math.abs(expectedPose.pitch - returnedPose.pitch!)
    const rollError = Math.abs(expectedPose.roll - returnedPose.roll!)
    const poseError = yawError + pitchError + rollError

    return {
      ...baseResult,
      returnedPose: roundPoseForState(returnedPose),
      poseError: roundForState(poseError),
      yawError: roundForState(yawError),
      pitchError: roundForState(pitchError),
      rollError: roundForState(rollError),
      detected: true,
      detectMs,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ...baseResult,
      errorMessage: message,
    }
  }
}

function buildObjPoseCalibrationCandidate(
  rotationCenter: ObjVertex,
  poseResults: ObjPoseCalibrationPoseResult[],
): ObjPoseCalibrationCandidate {
  const detectedResults = poseResults.filter((result) => result.detected && result.poseError !== null)
  const failedPoseCount = poseResults.length - detectedResults.length
  const poseErrors = detectedResults.map((result) => result.poseError!)
  const yawErrors = detectedResults.map((result) => result.yawError!)
  const pitchErrors = detectedResults.map((result) => result.pitchError!)
  const rollErrors = detectedResults.map((result) => result.rollError!)
  const averagePoseError = averageNumbers(poseErrors)
  const maxPoseError = maxNumbers(poseErrors)
  const yawErrorAvg = averageNumbers(yawErrors)
  const pitchErrorAvg = averageNumbers(pitchErrors)
  const rollErrorAvg = averageNumbers(rollErrors)
  const yawErrorMax = maxNumbers(yawErrors)
  const pitchErrorMax = maxNumbers(pitchErrors)
  const rollErrorMax = maxNumbers(rollErrors)
  const score = averagePoseError === null || maxPoseError === null
    ? failedPoseCount * 100
    : averagePoseError + maxPoseError + failedPoseCount * 100

  return {
    rotationCenterX: roundForState(rotationCenter.x) ?? 0,
    rotationCenterY: roundForState(rotationCenter.y) ?? 0,
    rotationCenterZ: roundForState(rotationCenter.z) ?? 0,
    score: roundForState(score),
    averagePoseError: roundForState(averagePoseError),
    maxPoseError: roundForState(maxPoseError),
    yawErrorAvg: roundForState(yawErrorAvg),
    pitchErrorAvg: roundForState(pitchErrorAvg),
    rollErrorAvg: roundForState(rollErrorAvg),
    yawErrorMax: roundForState(yawErrorMax),
    pitchErrorMax: roundForState(pitchErrorMax),
    rollErrorMax: roundForState(rollErrorMax),
    failedPoseCount,
    poseResultsPreview: poseResults.map(roundObjPoseCalibrationPoseResult),
    detectMsTotal: roundForState(sumNumbers(poseResults.map((result) => result.detectMs))),
    errorMessage: failedPoseCount > 0 ? `${failedPoseCount}件のpose評価に失敗しました。` : null,
  }
}

function updateObjPoseCalibrationProgress(candidate: ObjPoseCalibrationCandidate, startedAtMs: number) {
  const rankedCandidates = [
    ...state.objPoseCalibration.topCandidates,
    candidate,
  ].filter((item) => item.score !== null)
  const topCandidates = rankedCandidates
    .sort((a, b) => (a.score ?? Number.POSITIVE_INFINITY) - (b.score ?? Number.POSITIVE_INFINITY))
    .slice(0, OBJ_POSE_CALIBRATION_TOP_CANDIDATE_COUNT)
  const bestCandidate = topCandidates[0] ?? state.objPoseCalibration.bestCandidate
  const evaluatedCandidateCount = state.objPoseCalibration.evaluatedCandidateCount + 1
  const evaluatedPoseCount =
    state.objPoseCalibration.evaluatedPoseCount + state.objPoseCalibration.poseCount
  const elapsedMs = performance.now() - startedAtMs
  const averageCandidateMs = elapsedMs / Math.max(1, evaluatedCandidateCount)
  const remainingCandidateCount = Math.max(0, state.objPoseCalibration.candidateCount - evaluatedCandidateCount)

  state.objPoseCalibration = {
    ...state.objPoseCalibration,
    evaluatedCandidateCount,
    evaluatedPoseCount,
    failedCandidateCount:
      state.objPoseCalibration.failedCandidateCount + (candidate.failedPoseCount > 0 ? 1 : 0),
    failedPoseEvaluationCount:
      state.objPoseCalibration.failedPoseEvaluationCount + candidate.failedPoseCount,
    currentBestCandidate: bestCandidate,
    bestCandidate,
    topCandidates,
    elapsedMs,
    estimatedRemainingMs: averageCandidateMs * remainingCandidateCount,
  }
}

function createObjPoseCalibrationCandidatePoints(): ObjVertex[] {
  const yValues = createSteppedValues(
    OBJ_POSE_CALIBRATION_RANGE.y.min,
    OBJ_POSE_CALIBRATION_RANGE.y.max,
    OBJ_POSE_CALIBRATION_RANGE.y.step,
  )
  const zValues = createSteppedValues(
    OBJ_POSE_CALIBRATION_RANGE.z.min,
    OBJ_POSE_CALIBRATION_RANGE.z.max,
    OBJ_POSE_CALIBRATION_RANGE.z.step,
  )

  return yValues.flatMap((y) =>
    zValues.map((z) => ({
      x: OBJ_POSE_CALIBRATION_RANGE.x.value,
      y,
      z,
    })),
  )
}

function addCurrentPoseSearchFrame() {
  if (isPoseCenterSearchRunning()) {
    return
  }

  if (state.currentAnalysis.status !== "detected" || !hasFullPose(state.currentAnalysis.pose)) {
    addLog("探索フレームに追加できません。現在フレーム解析で顔姿勢を取得してください。")
    return
  }

  const frame = createPoseCenterSearchFrameFromCurrentAnalysis()
  state.poseSearchFrames = [frame, ...state.poseSearchFrames].slice(0, 20)
  state.selectedPoseSearchFrameId = frame.id
  addLog(`探索フレームに追加しました: ${frame.label}`)
  renderAll()
}

function clearPoseSearchFrames() {
  if (isPoseCenterSearchRunning()) {
    return
  }
  state.poseSearchFrames = []
  state.selectedPoseSearchFrameId = null
  addLog("探索フレームをクリアしました。")
  renderAll()
}

function deleteSelectedPoseSearchFrame() {
  if (isPoseCenterSearchRunning() || !state.selectedPoseSearchFrameId) {
    return
  }
  const selectedId = state.selectedPoseSearchFrameId
  const selectedIndex = state.poseSearchFrames.findIndex((frame) => frame.id === selectedId)
  state.poseSearchFrames = state.poseSearchFrames.filter((frame) => frame.id !== selectedId)
  state.selectedPoseSearchFrameId =
    state.poseSearchFrames[Math.max(0, selectedIndex - 1)]?.id ?? state.poseSearchFrames[0]?.id ?? null
  addLog("選択フレームを削除しました。")
  renderAll()
}

function createPoseCenterSearchFrameFromCurrentAnalysis(): PoseCenterSearchFrame {
  const pose = state.currentAnalysis.pose
  const bucket = classifyPoseSearchFrameBucket({
    yaw: pose.yaw!,
    pitch: pose.pitch!,
    roll: pose.roll!,
  })
  const timeSec = state.liveInput.sourceType === "video_file"
    ? state.liveVideo.currentTimeSec
    : null
  const label = `${poseSearchFrameBucketLabels[bucket]} #${state.poseSearchFrames.length + 1}`

  return {
    id: `frame-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    addedAt: new Date().toISOString(),
    sourceType: state.liveInput.sourceType,
    timeSec: roundForState(timeSec),
    label,
    autoPoseBucket: bucket,
    currentPose: {
      yaw: roundForState(pose.yaw) ?? 0,
      pitch: roundForState(pose.pitch) ?? 0,
      roll: roundForState(pose.roll) ?? 0,
    },
    expressionGroup: state.currentAnalysis.expressionSummary?.group ?? null,
    qualityScore: roundForState(state.currentAnalysis.qualityScore),
  }
}

function createPoseCenterSearchFrameFromCurrentPose(): PoseCenterSearchFrame | null {
  if (!hasFullPose(state.currentAnalysis.pose)) {
    return null
  }
  const pose = state.currentAnalysis.pose
  const bucket = classifyPoseSearchFrameBucket({
    yaw: pose.yaw!,
    pitch: pose.pitch!,
    roll: pose.roll!,
  })

  return {
    id: "current-frame",
    addedAt: new Date().toISOString(),
    sourceType: state.liveInput.sourceType,
    timeSec: state.liveInput.sourceType === "video_file" ? roundForState(state.liveVideo.currentTimeSec) : null,
    label: `現在フレーム（${poseSearchFrameBucketLabels[bucket]}）`,
    autoPoseBucket: bucket,
    currentPose: {
      yaw: pose.yaw!,
      pitch: pose.pitch!,
      roll: pose.roll!,
    },
    expressionGroup: state.currentAnalysis.expressionSummary?.group ?? null,
    qualityScore: roundForState(state.currentAnalysis.qualityScore),
  }
}

function classifyPoseSearchFrameBucket(pose: { yaw: number; pitch: number; roll: number }): PoseSearchFrameBucket {
  const yawAbs = Math.abs(pose.yaw)
  const pitchAbs = Math.abs(pose.pitch)
  const rollAbs = Math.abs(pose.roll)
  const strongAxes = [yawAbs >= 10, pitchAbs >= 8, rollAbs >= 8].filter(Boolean).length

  if (strongAxes >= 2) {
    return "mixed"
  }
  if (rollAbs >= 8) {
    return "roll"
  }
  if (yawAbs >= 10) {
    return pose.yaw < 0 ? "yawLeft" : "yawRight"
  }
  if (pitchAbs >= 8) {
    return pose.pitch < 0 ? "pitchDown" : "pitchUp"
  }
  return "front"
}

async function startPoseCenterSearch(mode: PoseCenterSearchMode) {
  if (isPoseCenterSearchRunning()) {
    return
  }

  const searchFrames = mode === "single_frame"
    ? [createPoseCenterSearchFrameFromCurrentPose()].filter((frame): frame is PoseCenterSearchFrame => frame !== null)
    : state.poseSearchFrames

  if (mode === "multi_frame" && searchFrames.length === 0) {
    state.poseCenterSearch = {
      ...createDefaultPoseCenterSearchState(),
      status: "error",
      mode,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      errorMessage: "探索フレームが未登録です。まず「探索フレームに追加」を押してください。",
    }
    addLog("探索フレームが未登録です。まず「探索フレームに追加」を押してください。")
    renderAll()
    return
  }

  const canRenderForSearch = mode === "multi_frame"
    ? canRenderRenderedIdealGeometry()
    : canRenderRenderedIdeal()

  if (!canRenderForSearch || searchFrames.length === 0) {
    state.poseCenterSearch = {
      ...createDefaultPoseCenterSearchState(),
      status: "error",
      mode,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    errorMessage: mode === "multi_frame"
      ? "OBJ読込を完了してから探索してください。"
      : "OBJ読込と現在フレーム解析を完了してから探索してください。",
      currentPose: roundPoseForState(state.currentAnalysis.pose),
    }
    addLog("ポーズ固定値探索を開始できません。OBJ読込と現在フレーム解析を確認してください。")
    renderAll()
    return
  }

  stopRealtimeValidation("stopped")

  const candidates = createPoseCenterSearchCandidatePoints()
  const searchStartedAtMs = performance.now()
  state.poseCenterSearch = {
    ...createDefaultPoseCenterSearchState(),
    status: "running",
    mode,
    startedAt: new Date().toISOString(),
    frameCount: searchFrames.length,
    candidateCount: candidates.length,
    totalEvaluationCount: candidates.length * searchFrames.length,
    currentPose: roundPoseForState(searchFrames[0].currentPose),
  }
  addLog(`ポーズ固定値探索を開始しました: ${candidates.length}候補 / ${searchFrames.length}フレーム`)
  renderAll()

  try {
    const detectionIdle = await waitForRenderedIdealDetectionIdle()
    if (!detectionIdle) {
      throw new Error("rendered ideal detection is still running")
    }

    const detector = await getRenderedIdealFaceLandmarker()
    for (const [index, candidatePoint] of candidates.entries()) {
      const candidate = evaluatePoseCenterCandidate(detector, searchFrames, candidatePoint)
      updatePoseCenterSearchProgress(candidate, searchStartedAtMs)

      renderRenderedIdealSummaryCard()
      renderDebugContent()

      if (index % 5 === 4) {
        await waitForNextFrame()
      }
    }

    state.poseCenterSearch = {
      ...state.poseCenterSearch,
      status: "completed",
      completedAt: new Date().toISOString(),
      elapsedMs: performance.now() - searchStartedAtMs,
      estimatedRemainingMs: 0,
      errorMessage: null,
      appliedBestAutomatically: false,
    }
    addLog(
      state.poseCenterSearch.bestCandidate
        ? `ポーズ固定値探索が完了しました。best score: ${formatNullableNumber(state.poseCenterSearch.bestCandidate.score)}`
        : "ポーズ固定値探索が完了しましたが、検出できた候補がありませんでした。",
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Pose center search failed", error)
    state.poseCenterSearch = {
      ...state.poseCenterSearch,
      status: "error",
      completedAt: new Date().toISOString(),
      elapsedMs: performance.now() - searchStartedAtMs,
      errorMessage: message,
    }
    addLog(`ポーズ固定値探索でエラーが発生しました: ${message}`)
  } finally {
    renderAll()
  }
}

function evaluatePoseCenterCandidate(
  detector: FaceLandmarker,
  frames: PoseCenterSearchFrame[],
  rotationCenter: ObjVertex,
): PoseCenterSearchCandidate {
  const baseCandidate = createPoseCenterSearchCandidate(rotationCenter)
  const frameResults = frames.map((frame) =>
    evaluatePoseCenterCandidateOnFrame(detector, frame, rotationCenter),
  )
  return buildPoseCenterSearchCandidateFromFrameResults(baseCandidate, frameResults)
}

function evaluatePoseCenterCandidateOnFrame(
  detector: FaceLandmarker,
  frame: PoseCenterSearchFrame,
  rotationCenter: ObjVertex,
): PoseCenterSearchFrameResult {
  const baseResult: PoseCenterSearchFrameResult = {
    frameId: frame.id,
    frameLabel: frame.label,
    sourceType: frame.sourceType,
    timeSec: frame.timeSec,
    currentPose: frame.currentPose,
    renderedPose: {
      yaw: null,
      pitch: null,
      roll: null,
    },
    poseError: null,
    yawError: null,
    pitchError: null,
    rollError: null,
    detected: false,
    detectMs: null,
    errorMessage: null,
  }

  try {
    const renderSummary = renderRenderedIdealCanvasTo(renderedIdealCanvas, rotationCenter, frame.currentPose)
    if (renderSummary.status !== "rendered") {
      return {
        ...baseResult,
        detected: false,
        errorMessage: renderSummary.errorMessage ?? renderSummary.status,
      }
    }

    const detectStartMs = performance.now()
    const result = detector.detect(renderedIdealCanvas)
    const detectMs = performance.now() - detectStartMs
    const detection = buildRenderedIdealDetectionState(result, -1, detectMs, null)
    const renderedPose = detection.pose

    if (detection.status !== "detected" || !hasFullPose(renderedPose)) {
      return {
        ...baseResult,
        detected: false,
        detectMs,
        renderedPose: roundPoseForState(renderedPose),
        errorMessage: detection.errorMessage ?? detection.status,
      }
    }

    const yawError = Math.abs(frame.currentPose.yaw - renderedPose.yaw!)
    const pitchError = Math.abs(frame.currentPose.pitch - renderedPose.pitch!)
    const rollError = Math.abs(frame.currentPose.roll - renderedPose.roll!)
    const poseError = yawError + pitchError + rollError

    return {
      ...baseResult,
      detected: true,
      detectMs,
      renderedPose: roundPoseForState(renderedPose),
      poseError: roundForState(poseError),
      yawError: roundForState(yawError),
      pitchError: roundForState(pitchError),
      rollError: roundForState(rollError),
      errorMessage: null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ...baseResult,
      detected: false,
      errorMessage: message,
    }
  }
}

function buildPoseCenterSearchCandidateFromFrameResults(
  baseCandidate: PoseCenterSearchCandidate,
  frameResults: PoseCenterSearchFrameResult[],
): PoseCenterSearchCandidate {
  const detectedResults = frameResults.filter((result) => result.detected && result.poseError !== null)
  const failedFrameCount = frameResults.length - detectedResults.length
  const poseErrors = detectedResults.map((result) => result.poseError!)
  const yawErrors = detectedResults.map((result) => result.yawError!)
  const pitchErrors = detectedResults.map((result) => result.pitchError!)
  const rollErrors = detectedResults.map((result) => result.rollError!)
  const averagePoseError = averageNumbers(poseErrors)
  const maxPoseError = maxNumbers(poseErrors)
  const yawErrorAvg = averageNumbers(yawErrors)
  const pitchErrorAvg = averageNumbers(pitchErrors)
  const rollErrorAvg = averageNumbers(rollErrors)
  const yawErrorMax = maxNumbers(yawErrors)
  const pitchErrorMax = maxNumbers(pitchErrors)
  const rollErrorMax = maxNumbers(rollErrors)
  const score = averagePoseError === null || maxPoseError === null
    ? failedFrameCount * 100
    : averagePoseError + maxPoseError + failedFrameCount * 100
  const firstDetected = detectedResults[0]

  return {
    ...baseCandidate,
    score: roundForState(score),
    averagePoseError: roundForState(averagePoseError),
    maxPoseError: roundForState(maxPoseError),
    yawErrorAvg: roundForState(yawErrorAvg),
    pitchErrorAvg: roundForState(pitchErrorAvg),
    rollErrorAvg: roundForState(rollErrorAvg),
    yawErrorMax: roundForState(yawErrorMax),
    pitchErrorMax: roundForState(pitchErrorMax),
    rollErrorMax: roundForState(rollErrorMax),
    failedFrameCount,
    frameResultsPreview: frameResults
      .slice(0, POSE_CENTER_SEARCH_FRAME_RESULTS_PREVIEW_COUNT)
      .map(roundPoseCenterSearchFrameResult),
    yawError: roundForState(yawErrorAvg),
    pitchError: roundForState(pitchErrorAvg),
    rollError: roundForState(rollErrorAvg),
    renderedPose: firstDetected?.renderedPose ?? baseCandidate.renderedPose,
    detected: detectedResults.length > 0,
    detectMs: roundForState(sumNumbers(frameResults.map((result) => result.detectMs))),
    errorMessage: failedFrameCount > 0 ? `${failedFrameCount}件のフレーム評価に失敗しました。` : null,
  }
}

function updatePoseCenterSearchProgress(candidate: PoseCenterSearchCandidate, startedAtMs: number) {
  const detectedCandidates = [
    ...state.poseCenterSearch.topCandidates,
    candidate,
  ].filter((item) => item.score !== null)
  const topCandidates = detectedCandidates
    .sort((a, b) => (a.score ?? Number.POSITIVE_INFINITY) - (b.score ?? Number.POSITIVE_INFINITY))
    .slice(0, POSE_CENTER_SEARCH_TOP_CANDIDATE_COUNT)
  const bestCandidate = topCandidates[0] ?? state.poseCenterSearch.bestCandidate
  const evaluatedCandidateCount = state.poseCenterSearch.evaluatedCandidateCount + 1
  const evaluatedFrameCount =
    state.poseCenterSearch.evaluatedFrameCount + state.poseCenterSearch.frameCount
  const elapsedMs = performance.now() - startedAtMs
  const averageCandidateMs = elapsedMs / Math.max(1, evaluatedCandidateCount)
  const remainingCandidateCount = Math.max(0, state.poseCenterSearch.candidateCount - evaluatedCandidateCount)

  state.poseCenterSearch = {
    ...state.poseCenterSearch,
    evaluatedCandidateCount,
    evaluatedFrameCount,
    evaluatedCount: state.poseCenterSearch.evaluatedCount + 1,
    failedCandidateCount: state.poseCenterSearch.failedCandidateCount + (candidate.failedFrameCount > 0 ? 1 : 0),
    failedFrameEvaluationCount:
      state.poseCenterSearch.failedFrameEvaluationCount + candidate.failedFrameCount,
    currentBestCandidate: bestCandidate,
    bestCandidate,
    topCandidates,
    elapsedMs,
    estimatedRemainingMs: averageCandidateMs * remainingCandidateCount,
  }
}

function applyPoseCenterSearchBest() {
  const bestCandidate = state.poseCenterSearch.bestCandidate
  if (!bestCandidate || isPoseCenterSearchRunning()) {
    return
  }

  state.objPoseSync = {
    ...state.objPoseSync,
    rotationCenterX: bestCandidate.rotationCenterX,
    rotationCenterY: bestCandidate.rotationCenterY,
    rotationCenterZ: bestCandidate.rotationCenterZ,
  }
  state.poseCenterSearch = {
    ...state.poseCenterSearch,
    appliedBestManually: true,
    appliedBestSourceMode: state.poseCenterSearch.mode,
    bestAppliedAt: new Date().toISOString(),
  }
  addLog(
    `ポーズ固定値探索のbestを適用しました: X ${formatNumber(bestCandidate.rotationCenterX)} / Y ${formatNumber(bestCandidate.rotationCenterY)} / Z ${formatNumber(bestCandidate.rotationCenterZ)}`,
  )
  renderAll()
}

function createPoseCenterSearchCandidatePoints(): ObjVertex[] {
  const yValues = createSteppedValues(
    POSE_CENTER_SEARCH_RANGE.y.min,
    POSE_CENTER_SEARCH_RANGE.y.max,
    POSE_CENTER_SEARCH_RANGE.y.step,
  )
  const zValues = createSteppedValues(
    POSE_CENTER_SEARCH_RANGE.z.min,
    POSE_CENTER_SEARCH_RANGE.z.max,
    POSE_CENTER_SEARCH_RANGE.z.step,
  )

  return yValues.flatMap((y) =>
    zValues.map((z) => ({
      x: POSE_CENTER_SEARCH_RANGE.x.value,
      y,
      z,
    })),
  )
}

function createSteppedValues(min: number, max: number, step: number) {
  const count = Math.round((max - min) / step)
  return Array.from({ length: count + 1 }, (_, index) => roundForState(min + step * index) ?? 0)
}

function createPoseCenterSearchCandidate(rotationCenter: ObjVertex): PoseCenterSearchCandidate {
  return {
    rotationCenterX: roundForState(rotationCenter.x) ?? 0,
    rotationCenterY: roundForState(rotationCenter.y) ?? 0,
    rotationCenterZ: roundForState(rotationCenter.z) ?? 0,
    score: null,
    averagePoseError: null,
    maxPoseError: null,
    yawErrorAvg: null,
    pitchErrorAvg: null,
    rollErrorAvg: null,
    yawErrorMax: null,
    pitchErrorMax: null,
    rollErrorMax: null,
    failedFrameCount: 0,
    frameResultsPreview: [],
    yawError: null,
    pitchError: null,
    rollError: null,
    renderedPose: {
      yaw: null,
      pitch: null,
      roll: null,
    },
    detected: false,
    detectMs: null,
    errorMessage: null,
  }
}

function waitForNextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

async function waitForRenderedIdealDetectionIdle() {
  for (let frame = 0; frame < 120; frame += 1) {
    if (!renderedIdealDetectInProgress) {
      return true
    }
    await waitForNextFrame()
  }
  return false
}

function mapLandmarks(landmarks: NormalizedLandmark[]): ReferenceLandmark[] {
  return landmarks.map((landmark, index) => ({
    index,
    x: landmark.x,
    y: landmark.y,
    z: landmark.z,
  }))
}

function estimateNullablePose(matrix: Matrix | undefined): ReferencePose {
  return estimateFacePoseFromMatrix(matrix) ?? {
    yaw: null,
    pitch: null,
    roll: null,
  }
}

function estimateFacePoseFromMatrix(matrix: Matrix | undefined): ReferencePose | null {
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

function classifyExpressionGroup(blendshapes: ReferenceBlendshape[]): ExpressionGroup {
  if (blendshapes.length === 0) {
    return "unknown"
  }

  const scores = new Map(blendshapes.map((item) => [item.categoryName, item.score]))
  const expressionScores: Array<[ExpressionGroup, number]> = [
    ["jawOpen", scores.get("jawOpen") ?? 0],
    [
      "mouthSmile",
      Math.max(scores.get("mouthSmileLeft") ?? 0, scores.get("mouthSmileRight") ?? 0),
    ],
    ["mouthPucker", scores.get("mouthPucker") ?? 0],
    [
      "eyeBlink",
      Math.max(scores.get("eyeBlinkLeft") ?? 0, scores.get("eyeBlinkRight") ?? 0),
    ],
    [
      "eyeSquint",
      Math.max(scores.get("eyeSquintLeft") ?? 0, scores.get("eyeSquintRight") ?? 0),
    ],
  ]
  const strongGroups = expressionScores.filter(([, score]) => score >= MIXED_EXPRESSION_THRESHOLD)

  if (strongGroups.length > 1) {
    return "mixedExpression"
  }

  const strongest = expressionScores.reduce((best, current) =>
    current[1] > best[1] ? current : best,
  )

  return strongest[1] >= STRONG_EXPRESSION_THRESHOLD ? strongest[0] : "neutral"
}

function createExpressionSummary(
  blendshapes: ReferenceBlendshape[],
  group: ExpressionGroup,
): ExpressionSummary {
  const scores = new Map(blendshapes.map((item) => [item.categoryName, item.score]))
  return {
    group,
    topBlendshapes: [...blendshapes]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => ({
        categoryName: item.categoryName,
        score: item.score,
      })),
    missingBlendshapeKeys: MATCH_BLENDSHAPE_KEYS.filter((key) => !scores.has(key)),
  }
}

function syncLiveVideoMetadata() {
  state.liveVideo.durationSec = Number.isFinite(liveVideoElement.duration)
    ? liveVideoElement.duration
    : null
  state.liveVideo.width = liveVideoElement.videoWidth || null
  state.liveVideo.height = liveVideoElement.videoHeight || null
  state.liveVideo.status = "metadata_ready"
  state.liveVideo.errorMessage = null
  if (state.liveInput.sourceType === "camera") {
    state.camera.status = "running"
    syncCameraSettings()
  }
  syncLiveCurrentTime()
  syncLiveInputState()
}

function syncLiveCurrentTime() {
  state.liveVideo.currentTimeSec = liveVideoElement.currentTime || 0
  syncLiveInputState()
}

function seekLiveVideoTo(targetSec: number) {
  if (
    !isVideoFileInput() ||
    state.realtimeDebug.status === "running" ||
    isPoseCenterSearchRunning() ||
    !Number.isFinite(targetSec)
  ) {
    return
  }

  const duration = state.liveVideo.durationSec ?? liveVideoElement.duration
  const nextTime = clamp(targetSec, 0, Number.isFinite(duration) ? duration : targetSec)
  liveVideoElement.currentTime = nextTime
  state.liveVideo.currentTimeSec = nextTime
  syncLiveInputState()
  renderAll()
}

function syncLiveInputState() {
  const sourceType = state.liveInput.sourceType
  state.liveInput = {
    sourceType,
    status: state.liveVideo.status,
    fileName: sourceType === "video_file" ? state.liveVideo.fileName : null,
    width: state.liveVideo.width,
    height: state.liveVideo.height,
    durationSec: state.liveVideo.durationSec,
    currentTimeSec: state.liveVideo.currentTimeSec,
    paused: state.liveVideo.loaded ? liveVideoElement.paused : null,
    readyState: state.liveVideo.loaded ? liveVideoElement.readyState : null,
  }
}

function syncCameraSettings() {
  const track = cameraStream?.getVideoTracks()[0]
  const settings = track?.getSettings()
  state.camera = {
    ...state.camera,
    width: settings?.width ?? state.liveVideo.width,
    height: settings?.height ?? state.liveVideo.height,
    frameRate: settings?.frameRate ?? null,
    deviceLabel: track?.label || null,
  }
  state.liveVideo.width = state.liveVideo.width ?? state.camera.width
  state.liveVideo.height = state.liveVideo.height ?? state.camera.height
}

function startRealtimeValidation() {
  if (isPoseCenterSearchRunning()) {
    return
  }

  if (!state.liveVideo.loaded) {
    state.realtimeDebug = {
      ...state.realtimeDebug,
      status: "error",
      errorCount: state.realtimeDebug.errorCount + 1,
      errorMessage: "ライブ動画を読み込んでから開始してください。",
      lastUpdatedAt: formatUpdatedAt(),
    }
    addLog("リアルタイム検証を開始できません。ライブ動画が未読込です。")
    renderAll()
    return
  }

  state.realtimeDebug = {
    ...state.realtimeDebug,
    status: "running",
    driveMode: resolveRealtimeDriveMode(state.realtimeDebug.driveMode),
    errorMessage: null,
    lastUpdatedAt: formatUpdatedAt(),
  }
  realtimeRunStartedAtMs = performance.now()
  lastRealtimeAnimationFrameCurrentTimeSec = null
  restartRealtimeDrive()
  addLog("リアルタイム検証を開始しました。")
  renderAll()
}

function stopRealtimeValidation(nextStatus: Extract<RealtimeStatus, "idle" | "stopped" | "error">) {
  cancelRealtimeDrive()
  realtimeTickInProgress = false
  realtimeRunStartedAtMs = null
  lastRealtimeAnimationFrameCurrentTimeSec = null
  if (state.realtimeDebug.status === "running" || nextStatus !== "stopped") {
    state.realtimeDebug = {
      ...state.realtimeDebug,
      status: nextStatus,
      lastUpdatedAt: formatUpdatedAt(),
    }
  }
}

function resetRealtimeValidation() {
  const mode = state.realtimeDebug.mode
  const driveMode = state.realtimeDebug.driveMode
  const targetFps = state.realtimeDebug.targetFps
  stopRealtimeValidation("idle")
  realtimeTimingSamples = []
  state.realtimeDebug = createDefaultRealtimeDebugState({ mode, driveMode, targetFps })
  addLog("リアルタイム検証をリセットしました。")
}

function addRealtimeTimingSample(sample: RealtimeTimingSample) {
  realtimeTimingSamples = [...realtimeTimingSamples, sample].slice(-REALTIME_AVERAGE_SAMPLE_COUNT)
}

function calculateRealtimeAverageTiming() {
  return {
    averageCurrentAnalysisTimingBreakdown: {
      mediaPipeDetectMs: averageNullableTiming(
        realtimeTimingSamples.map((sample) => sample.currentAnalysisTimingBreakdown.mediaPipeDetectMs),
      ),
      buildCurrentAnalysisMs: averageNullableTiming(
        realtimeTimingSamples.map((sample) => sample.currentAnalysisTimingBreakdown.buildCurrentAnalysisMs),
      ),
      liveOverlayDrawMs: averageNullableTiming(
        realtimeTimingSamples.map((sample) => sample.currentAnalysisTimingBreakdown.liveOverlayDrawMs),
      ),
      debugUpdateMs: averageNullableTiming(
        realtimeTimingSamples.map((sample) => sample.currentAnalysisTimingBreakdown.debugUpdateMs),
      ),
      currentAnalysisTotalMs: averageNullableTiming(
        realtimeTimingSamples.map((sample) => sample.currentAnalysisTimingBreakdown.currentAnalysisTotalMs),
      ),
    },
    averageObjRenderMs: averageNullableTiming(
      realtimeTimingSamples.map((sample) => sample.objRenderMs),
    ),
    averageTotalMs: averageNullableTiming(
      realtimeTimingSamples.map((sample) => sample.totalMs),
    ),
  }
}

function restartRealtimeDrive() {
  cancelRealtimeDrive()
  scheduleRealtimeDrive()
}

function cancelRealtimeDrive() {
  const video = liveVideoElement as VideoElementWithFrameCallback
  if (realtimeVideoFrameCallbackId !== null) {
    video.cancelVideoFrameCallback?.(realtimeVideoFrameCallbackId)
    realtimeVideoFrameCallbackId = null
  }
  if (realtimeAnimationFrameId !== null) {
    window.cancelAnimationFrame(realtimeAnimationFrameId)
    realtimeAnimationFrameId = null
  }
  if (realtimeTimerId !== null) {
    window.clearInterval(realtimeTimerId)
    realtimeTimerId = null
  }
}

function scheduleRealtimeDrive() {
  if (state.realtimeDebug.status !== "running") {
    return
  }

  if (state.realtimeDebug.driveMode === "video_frame_callback") {
    const video = liveVideoElement as VideoElementWithFrameCallback
    if (!video.requestVideoFrameCallback) {
      state.realtimeDebug = {
        ...state.realtimeDebug,
        driveMode: "animation_frame_fallback",
        lastUpdatedAt: formatUpdatedAt(),
      }
      scheduleRealtimeDrive()
      return
    }

    realtimeVideoFrameCallbackId = video.requestVideoFrameCallback((_now, metadata) => {
      realtimeVideoFrameCallbackId = null
      state.realtimeDebug.videoFrameCallbackCount += 1
      if (shouldSkipRealtimeVideoFrame(metadata)) {
        recordRealtimeSkip("same_video_frame")
        scheduleRealtimeDrive()
        return
      }
      const tick = createRealtimeFrameTick("video_frame_callback", metadata)
      void runRealtimeTick(tick).finally(() => {
        scheduleRealtimeDrive()
      })
    })
    return
  }

  if (state.realtimeDebug.driveMode === "animation_frame_fallback") {
    realtimeAnimationFrameId = window.requestAnimationFrame(() => {
      realtimeAnimationFrameId = null
      state.realtimeDebug.animationFrameFallbackCount += 1
      const currentTimeSec = liveVideoElement.currentTime || state.liveVideo.currentTimeSec || 0
      if (
        lastRealtimeAnimationFrameCurrentTimeSec !== null &&
        Math.abs(currentTimeSec - lastRealtimeAnimationFrameCurrentTimeSec) < 0.000001
      ) {
        recordRealtimeSkip("same_video_frame")
        scheduleRealtimeDrive()
        return
      }
      lastRealtimeAnimationFrameCurrentTimeSec = currentTimeSec
      const tick = createRealtimeFrameTick("animation_frame_fallback")
      void runRealtimeTick(tick).finally(() => {
        scheduleRealtimeDrive()
      })
    })
    return
  }

  if (realtimeTimerId !== null) {
    return
  }
  const intervalMs = Math.max(1, Math.round(1000 / state.realtimeDebug.targetFps))
  realtimeTimerId = window.setInterval(() => {
    state.realtimeDebug.intervalLegacyTickCount += 1
    const tick = createRealtimeFrameTick("interval_legacy")
    void runRealtimeTick(tick)
  }, intervalMs)
}

function shouldSkipRealtimeVideoFrame(metadata: VideoFrameCallbackMetadataLike) {
  const mediaTimeSec = Number.isFinite(metadata.mediaTime) ? metadata.mediaTime ?? null : null
  return (
    mediaTimeSec !== null &&
    state.realtimeDebug.lastVideoFrameMediaTimeSec !== null &&
    Math.abs(mediaTimeSec - state.realtimeDebug.lastVideoFrameMediaTimeSec) < 0.000001
  )
}

function recordRealtimeSkip(reason: "same_video_frame" | "in_progress" | "no_video" | "paused_video") {
  state.realtimeDebug = {
    ...state.realtimeDebug,
    skippedCount: state.realtimeDebug.skippedCount + 1,
    skippedBySameVideoFrameCount:
      state.realtimeDebug.skippedBySameVideoFrameCount + (reason === "same_video_frame" ? 1 : 0),
    skippedByInProgressCount:
      state.realtimeDebug.skippedByInProgressCount + (reason === "in_progress" ? 1 : 0),
    skippedByNoVideoCount:
      state.realtimeDebug.skippedByNoVideoCount + (reason === "no_video" ? 1 : 0),
    skippedByPausedVideoCount:
      state.realtimeDebug.skippedByPausedVideoCount + (reason === "paused_video" ? 1 : 0),
    lastUpdatedAt: formatUpdatedAt(),
  }
  renderRealtimeControls()
  renderDebugContent()
}

function createRealtimeFrameTick(
  driveMode: RealtimeDriveMode,
  metadata: VideoFrameCallbackMetadataLike | null = null,
): RealtimeFrameTick {
  const mediaTimeSec =
    metadata && Number.isFinite(metadata.mediaTime)
      ? metadata.mediaTime ?? null
      : null
  const timestampFallbackUsed = mediaTimeSec === null
  const rawTimestampMs = timestampFallbackUsed ? performance.now() : mediaTimeSec * 1000
  const lastTimestampMs = Math.max(
    state.realtimeDebug.lastVideoFrameTimestampMs ?? Number.NEGATIVE_INFINITY,
    state.liveMediaPipe.liveTimestampMs,
  )
  const timestampMs = rawTimestampMs <= lastTimestampMs ? lastTimestampMs + 1 : rawTimestampMs
  return {
    driveMode,
    timestampMs,
    mediaTimeSec,
    timestampFallbackUsed,
  }
}

function resolveRealtimeDriveMode(preferredMode: RealtimeDriveMode): RealtimeDriveMode {
  if (preferredMode === "interval_legacy") {
    return "interval_legacy"
  }
  if (preferredMode === "animation_frame_fallback") {
    return "animation_frame_fallback"
  }
  return (liveVideoElement as VideoElementWithFrameCallback).requestVideoFrameCallback
    ? "video_frame_callback"
    : "animation_frame_fallback"
}

async function runRealtimeTick(frameTick: RealtimeFrameTick) {
  if (state.realtimeDebug.status !== "running") {
    return
  }

  if (realtimeTickInProgress || liveAnalysisInProgress) {
    recordRealtimeSkip("in_progress")
    return
  }

  if (!state.liveVideo.loaded || liveVideoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    recordRealtimeSkip("no_video")
    return
  }

  if (state.liveVideo.playbackStatus !== "playing") {
    recordRealtimeSkip("paused_video")
    return
  }

  realtimeTickInProgress = true
  const totalStartMs = performance.now()
  let currentAnalysisMs: number | null = null
  let objRenderMs: number | null = null
  let currentAnalysisTimingBreakdown = createEmptyCurrentAnalysisTimingBreakdown()

  try {
    state.realtimeDebug.realtimeTickAnalysisRequestCount += 1
    state.realtimeDebug = {
      ...state.realtimeDebug,
      driveMode: frameTick.driveMode,
      videoFrameMetadataMediaTime: frameTick.mediaTimeSec,
      videoFrameTimestampMs: frameTick.timestampMs,
      timestampFallbackUsed: frameTick.timestampFallbackUsed,
      lastVideoFrameMediaTimeSec: frameTick.mediaTimeSec,
      lastVideoFrameTimestampMs: frameTick.timestampMs,
      timestampFallbackUsedCount:
        state.realtimeDebug.timestampFallbackUsedCount + (frameTick.timestampFallbackUsed ? 1 : 0),
    }
    currentAnalysisTimingBreakdown =
      await analyzeCurrentLiveFrame("realtime", {
        skipFinalRender: true,
        timestampMs: frameTick.timestampMs,
      }) ??
      createEmptyCurrentAnalysisTimingBreakdown()

    if (state.realtimeDebug.mode === "current_analysis_obj_render") {
      const renderStartMs = performance.now()
      renderRenderedIdealCanvas()
      objRenderMs = performance.now() - renderStartMs
    }

    const frameCount = state.realtimeDebug.frameCount + 1
    const processedVideoFrameCount = state.realtimeDebug.processedVideoFrameCount + 1
    const elapsedSec = realtimeRunStartedAtMs === null
      ? null
      : (performance.now() - realtimeRunStartedAtMs) / 1000

    state.realtimeDebug = {
      ...state.realtimeDebug,
      status: "running",
      frameCount,
      processedVideoFrameCount,
      currentAnalysisMs: currentAnalysisTimingBreakdown.currentAnalysisTotalMs,
      objRenderMs,
      mediaPipeRedetectMs: null,
      totalMs: sumNullableTimings(currentAnalysisTimingBreakdown.currentAnalysisTotalMs, objRenderMs),
      currentAnalysisTimingBreakdown,
      effectiveFps: elapsedSec && elapsedSec > 0 ? frameCount / elapsedSec : null,
      lastUpdatedAt: formatUpdatedAt(),
      errorMessage: null,
    }

    const renderTiming = renderAll({
      skipObjRender: true,
    })
    currentAnalysisTimingBreakdown = {
      ...currentAnalysisTimingBreakdown,
      liveOverlayDrawMs: renderTiming.liveOverlayDrawMs,
      debugUpdateMs: renderTiming.debugUpdateMs,
    }
    currentAnalysisTimingBreakdown.currentAnalysisTotalMs = sumNullableTimings(
      currentAnalysisTimingBreakdown.mediaPipeDetectMs,
      currentAnalysisTimingBreakdown.buildCurrentAnalysisMs,
      currentAnalysisTimingBreakdown.liveOverlayDrawMs,
      currentAnalysisTimingBreakdown.debugUpdateMs,
    )
    currentAnalysisMs = currentAnalysisTimingBreakdown.currentAnalysisTotalMs
    const totalMs = sumNullableTimings(currentAnalysisMs, objRenderMs)
    addRealtimeTimingSample({
      currentAnalysisTimingBreakdown,
      objRenderMs,
      totalMs,
    })
    const averageTiming = calculateRealtimeAverageTiming()

    state.realtimeDebug = {
      ...state.realtimeDebug,
      currentAnalysisMs,
      totalMs,
      currentAnalysisTimingBreakdown,
      averageCurrentAnalysisTimingBreakdown: averageTiming.averageCurrentAnalysisTimingBreakdown,
      averageObjRenderMs: averageTiming.averageObjRenderMs,
      averageTotalMs: averageTiming.averageTotalMs,
      lastUpdatedAt: formatUpdatedAt(),
    }
    renderRealtimeControls()
    renderDebugContent()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    state.realtimeDebug = {
      ...state.realtimeDebug,
      status: "error",
      errorCount: state.realtimeDebug.errorCount + 1,
      currentAnalysisMs,
      objRenderMs,
      currentAnalysisTimingBreakdown,
      totalMs: performance.now() - totalStartMs,
      lastUpdatedAt: formatUpdatedAt(),
      errorMessage: message,
    }
    stopRealtimeValidation("error")
    addLog(`リアルタイム検証でエラーが発生しました: ${message}`)
  } finally {
    realtimeTickInProgress = false
    if (state.realtimeDebug.status === "error") {
      renderAll()
    }
  }
}

function renderAll(options: { skipObjRender?: boolean } = {}): RenderUpdateTiming {
  updateObjPoseSyncFromCurrentAnalysis()
  renderPreviewTabs()
  renderPreviewPanels(options)
  renderControls()
  renderDebugTabs()

  const debugStartMs = performance.now()
  renderDebugContent()
  const debugUpdateMs = performance.now() - debugStartMs

  const overlayStartMs = performance.now()
  drawLiveOverlay()
  drawRenderedIdealOverlay()
  const liveOverlayDrawMs = performance.now() - overlayStartMs

  return {
    liveOverlayDrawMs,
    debugUpdateMs,
  }
}

function renderPreviewTabs() {
  app.querySelectorAll<HTMLButtonElement>("[data-tab-group='preview']").forEach((button) => {
    const isActive = button.dataset.tabValue === state.activePreviewTab
    button.classList.toggle("is-active", isActive)
    button.setAttribute("aria-selected", String(isActive))
  })
}

function renderPreviewPanels(options: { skipObjRender?: boolean } = {}) {
  app.querySelectorAll<HTMLElement>("[data-preview-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.previewPanel !== state.activePreviewTab
  })

  const liveStage = getElement<HTMLElement>("[data-live-stage]")
  liveStage.dataset.loaded = String(state.liveVideo.loaded)

  const objPreviewStatus = getObjPreviewStatus()
  const objStage = getElement<HTMLElement>("[data-obj-stage]")
  objStage.dataset.previewStatus = objPreviewStatus
  getElement<HTMLElement>("[data-obj-preview-message]").textContent = getObjPreviewMessage(objPreviewStatus)
  renderObjPreviewCanvas()

  const objSummary = getElement<HTMLElement>("[data-obj-preview-summary]")
  objSummary.innerHTML = renderObjPreviewSummary()

  if (!options.skipObjRender) {
    renderRenderedIdealCanvas()
  }
  renderRenderedIdealSummaryCard()

  const liveObjStage = getElement<HTMLElement>("[data-live-obj-stage]")
  liveObjStage.dataset.previewStatus = objPreviewStatus
  getElement<HTMLElement>("[data-live-obj-preview-message]").textContent = getObjPoseSyncMessage()
  if (!options.skipObjRender) {
    renderObjPoseSyncCanvas()
  }
}

function renderControls() {
  const poseSearchRunning = isPoseCenterSearchRunning()

  setChecked("toggle-landmarks", state.overlay.showLandmarks478)
  setChecked("toggle-mesh-source", state.overlay.showMeshSource)
  setChecked("toggle-mesh-target", state.overlay.showMeshTarget)
  setChecked("toggle-mesh-pairs", state.overlay.showMeshPairs)
  setChecked("toggle-excluded-landmarks", state.overlay.showExcludedLandmarks)
  setChecked("toggle-grid-anchors", state.overlay.showGridAnchors)
  setChecked("toggle-triangle-mesh", state.overlay.showTriangleMesh)

  const duration = state.liveVideo.durationSec ?? 0
  const range = getElement<HTMLInputElement>("[data-range='live']")
  const canUseMp4Debug = isVideoFileInput() && state.realtimeDebug.status !== "running" && !poseSearchRunning
  range.max = String(duration)
  range.value = String(clamp(state.liveVideo.currentTimeSec ?? 0, 0, duration))
  range.disabled = !canUseMp4Debug

  setDisabled('[data-action="load-obj"]', poseSearchRunning)
  setDisabled(
    '[data-action="obj-pose-calibration-start"]',
    poseSearchRunning || !canRenderRenderedIdealGeometry(),
  )
  objFileInput.disabled = poseSearchRunning
  liveFileInput.disabled = poseSearchRunning
  setDisabled('[data-action="live-play"]', poseSearchRunning || !isVideoFileInput() || state.liveVideo.playbackStatus === "playing")
  setDisabled('[data-action="live-pause"]', poseSearchRunning || !isVideoFileInput() || state.liveVideo.playbackStatus !== "playing")
  setDisabled('[data-action="live-analyze-current"]', !canUseMp4Debug || liveAnalysisInProgress)

  getElement<HTMLElement>("[data-status='live-time']").textContent = formatTimeStatus(
    state.liveVideo,
  )
  getElement<HTMLElement>("[data-mp4-debug-note]").textContent =
    state.liveInput.sourceType === "camera"
      ? "MP4入力時のみ使用できます。"
      : state.realtimeDebug.status === "running"
        ? "リアルタイム検証中はシークと現在フレーム解析を無効にしています。"
        : "MP4入力時のみ使用できます。"
  getElement<HTMLDetailsElement>("[data-mp4-debug-details]").classList.toggle(
    "is-disabled",
    state.liveInput.sourceType !== "video_file",
  )
  renderLiveInputSourceCard()

  getElement<HTMLSelectElement>('[data-control="rendered-ideal-background"]').value = state.renderedIdeal.backgroundMode
  getElement<HTMLSelectElement>('[data-control="rendered-ideal-color"]').value = state.renderedIdeal.colorMode
  setDisabled('[data-action="rendered-ideal-refresh"]', poseSearchRunning || !canRenderRenderedIdealGeometry())

  renderLiveAnalysisCard()
  getElement<HTMLSelectElement>('[data-control="obj-preview-mode"]').value = state.objPreview.mode
  setChecked("obj-pose-sync-enabled", state.objPoseSync.enabled)
  setChecked("obj-pose-yaw-invert", state.objPoseSync.yawSign === -1)
  setChecked("obj-pose-pitch-invert", state.objPoseSync.pitchSign === -1)
  setChecked("obj-pose-roll-invert", state.objPoseSync.rollSign === -1)
  setNumberValue("obj-pose-yaw-offset", state.objPoseSync.yawOffsetDeg)
  setNumberValue("obj-pose-pitch-offset", state.objPoseSync.pitchOffsetDeg)
  setNumberValue("obj-pose-roll-offset", state.objPoseSync.rollOffsetDeg)
  setNumberValue("obj-pose-rotation-center-x", state.objPoseSync.rotationCenterX)
  setNumberValue("obj-pose-rotation-center-y", state.objPoseSync.rotationCenterY)
  setNumberValue("obj-pose-rotation-center-z", state.objPoseSync.rotationCenterZ)
  renderLiveObjPoseSummaryCard()
  renderRealtimeControls()
}

function renderRealtimeControls() {
  app.querySelectorAll<HTMLInputElement>('[data-control="realtime-mode"]').forEach((input) => {
    input.checked = input.value === state.realtimeDebug.mode
  })

  getElement<HTMLSelectElement>('[data-control="realtime-target-fps"]').value = String(
    state.realtimeDebug.targetFps,
  )
  setDisabled('[data-action="realtime-start"]', isPoseCenterSearchRunning() || state.realtimeDebug.status === "running")
  setDisabled('[data-action="realtime-stop"]', state.realtimeDebug.status !== "running")

  getElement<HTMLElement>("[data-realtime-inline-status]").textContent =
    `状態: ${formatRealtimeStatus(state.realtimeDebug.status)} / 駆動: ${realtimeDriveModeLabels[state.realtimeDebug.driveMode]} / 実効FPS: ${formatRealtimeNullableNumber(state.realtimeDebug.effectiveFps)} / 判定: ${getRealtimeJudgement()}`
  getElement<HTMLElement>("[data-realtime-playback-note]").textContent = getRealtimePlaybackNote()
}

function renderLiveInputSourceCard() {
  const card = getElement<HTMLElement>("[data-live-input-source]")
  card.innerHTML = `
    <dl class="review-grid">
      <div><dt>入力ソース</dt><dd>${formatLiveInputSourceLabel(state.liveInput.sourceType)}</dd></div>
      <div><dt>状態</dt><dd>${escapeHtml(state.liveInput.status)}</dd></div>
      <div><dt>幅</dt><dd>${formatNullableCount(state.liveInput.width)}</dd></div>
      <div><dt>高さ</dt><dd>${formatNullableCount(state.liveInput.height)}</dd></div>
      <div><dt>カメラFPS</dt><dd>${formatNullableNumber(state.camera.frameRate)}</dd></div>
      <div><dt>カメラエラー</dt><dd>${escapeHtml(state.camera.errorMessage ?? "-")}</dd></div>
    </dl>
  `
}

function renderLiveAnalysisCard() {
  const card = getElement<HTMLElement>("[data-live-analysis]")
  const analysis = state.currentAnalysis

  if (!state.liveVideo.loaded) {
    card.innerHTML = `<p>ライブ動画を読み込むと、ここに動画メタデータと現在フレーム解析結果を表示します。</p>`
    return
  }

  card.innerHTML = `
    <dl class="review-grid">
      <div><dt>liveVideoStatus</dt><dd>${state.liveVideo.status}</dd></div>
      <div><dt>fileName</dt><dd>${escapeHtml(state.liveVideo.fileName ?? "-")}</dd></div>
      <div><dt>videoSize</dt><dd>${formatVideoSize()}</dd></div>
      <div><dt>durationSec</dt><dd>${formatNullableNumber(state.liveVideo.durationSec)}</dd></div>
      <div><dt>currentTimeSec</dt><dd>${formatNullableNumber(state.liveVideo.currentTimeSec)}</dd></div>
      <div><dt>currentAnalysisStatus</dt><dd>${analysis.status}</dd></div>
      <div><dt>landmarkCount</dt><dd>${formatNullableCount(analysis.status === "not_ready" ? null : analysis.landmarkCount)}</dd></div>
      <div><dt>pose</dt><dd>${escapeHtml(formatPose(analysis.pose))}</dd></div>
      <div><dt>expression</dt><dd>${escapeHtml(formatExpressionSummary(analysis.expressionSummary))}</dd></div>
      <div><dt>qualityScore</dt><dd>${formatNullableNumber(analysis.qualityScore)}</dd></div>
      <div><dt>errorMessage</dt><dd>${escapeHtml(analysis.errorMessage ?? "-")}</dd></div>
    </dl>
  `
}

function renderPoseSearchFramesCard() {
  const card = getElement<HTMLElement>("[data-pose-search-frames]")
  const frames = state.poseSearchFrames

  if (frames.length === 0) {
    card.innerHTML = `
      <p>探索フレームはまだ登録されていません。</p>
      <div class="pose-search-frame-controls">
        <label class="select-field">
          <span>選択フレーム</span>
          <select data-control="pose-search-frame-select" disabled>
            <option value="">未登録</option>
          </select>
        </label>
      </div>
    `
    return
  }

  const selectedId = state.selectedPoseSearchFrameId ?? frames[0]?.id ?? ""
  card.innerHTML = `
    <div class="pose-search-frame-header">
      <div>
        <h3>探索フレーム</h3>
        <p>登録数: ${frames.length}</p>
      </div>
      <label class="select-field">
        <span>選択フレーム</span>
        <select data-control="pose-search-frame-select">
          ${frames.map((frame) => `
            <option value="${escapeHtml(frame.id)}" ${frame.id === selectedId ? "selected" : ""}>
              ${escapeHtml(frame.label)}
            </option>
          `).join("")}
        </select>
      </label>
    </div>
    <div class="pose-search-frame-table-wrap">
      <table class="pose-search-frame-table">
        <thead>
          <tr>
            <th>ラベル</th>
            <th>sourceType</th>
            <th>timeSec</th>
            <th>yaw / pitch / roll</th>
            <th>expressionGroup</th>
            <th>qualityScore</th>
          </tr>
        </thead>
        <tbody>
          ${frames.map((frame) => `
            <tr class="${frame.id === selectedId ? "is-selected" : ""}">
              <td>${escapeHtml(frame.label)}</td>
              <td>${formatLiveInputSourceLabel(frame.sourceType)}</td>
              <td>${formatNullableNumber(frame.timeSec)}</td>
              <td>${escapeHtml(formatPose(frame.currentPose))}</td>
              <td>${escapeHtml(frame.expressionGroup ?? "null")}</td>
              <td>${formatNullableNumber(frame.qualityScore)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `
}

function renderLiveObjPoseSummaryCard() {
  const card = getElement<HTMLElement>("[data-live-obj-pose-summary]")
  const poseSync = state.objPoseSync

  card.innerHTML = `
    <p>${escapeHtml(getObjPoseSyncMessage())}</p>
    <dl class="review-grid">
      <div><dt>同期状態</dt><dd>${getObjPoseSyncStatus()}</dd></div>
      <div><dt>姿勢ソース</dt><dd>${poseSync.source}</dd></div>
      <div><dt>姿勢同期</dt><dd>${String(poseSync.enabled)}</dd></div>
      <div><dt>現在yaw角度</dt><dd>${formatNullableNumber(state.currentAnalysis.pose.yaw)}</dd></div>
      <div><dt>現在pitch角度</dt><dd>${formatNullableNumber(state.currentAnalysis.pose.pitch)}</dd></div>
      <div><dt>現在roll角度</dt><dd>${formatNullableNumber(state.currentAnalysis.pose.roll)}</dd></div>
      <div><dt>appliedYawDeg</dt><dd>${formatNullableNumber(poseSync.appliedYawDeg)}</dd></div>
      <div><dt>appliedPitchDeg</dt><dd>${formatNullableNumber(poseSync.appliedPitchDeg)}</dd></div>
      <div><dt>appliedRollDeg</dt><dd>${formatNullableNumber(poseSync.appliedRollDeg)}</dd></div>
      <div><dt>yawSign</dt><dd>${poseSync.yawSign}</dd></div>
      <div><dt>pitchSign</dt><dd>${poseSync.pitchSign}</dd></div>
      <div><dt>rollSign</dt><dd>${poseSync.rollSign}</dd></div>
      <div><dt>yawOffsetDeg</dt><dd>${formatNumber(poseSync.yawOffsetDeg)}</dd></div>
      <div><dt>pitchOffsetDeg</dt><dd>${formatNumber(poseSync.pitchOffsetDeg)}</dd></div>
      <div><dt>rollOffsetDeg</dt><dd>${formatNumber(poseSync.rollOffsetDeg)}</dd></div>
      <div><dt>rotationCenterX</dt><dd>${formatNumber(poseSync.rotationCenterX)}</dd></div>
      <div><dt>rotationCenterY</dt><dd>${formatNumber(poseSync.rotationCenterY)}</dd></div>
      <div><dt>rotationCenterZ</dt><dd>${formatNumber(poseSync.rotationCenterZ)}</dd></div>
      <div><dt>sampledPointCount</dt><dd>${state.objPoseSyncStats.sampledPointCount}</dd></div>
      <div><dt>sampledEdgeCount</dt><dd>${state.objPoseSyncStats.sampledEdgeCount}</dd></div>
    </dl>
  `
}

function renderObjPreviewCanvas() {
  const status = getObjPreviewStatus()
  state.objPreviewStats = status === "ready" ? calculateObjPreviewStats(state.objPreview) : {
    sampledPointCount: 0,
    sampledEdgeCount: 0,
  }

  renderObjPreviewCanvasTo(objPreviewCanvas, state.objPreview)
}

function renderObjPoseSyncCanvas() {
  const status = getObjPreviewStatus()
  const previewState = getObjPoseSyncPreviewState()
  state.objPoseSyncStats = status === "ready" ? calculateObjPreviewStats(previewState) : {
    sampledPointCount: 0,
    sampledEdgeCount: 0,
  }

  renderObjPreviewCanvasTo(liveObjPosePreviewCanvas, previewState, getObjPoseSyncRotationCenter())
}

function renderRenderedIdealCanvas() {
  const stage = getElement<HTMLElement>("[data-rendered-ideal-stage]")
  const message = getElement<HTMLElement>("[data-rendered-ideal-message]")

  try {
    state.renderedIdeal.summary = renderRenderedIdealCanvasTo(renderedIdealCanvas)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Rendered ideal render failed", error)
    state.renderedIdeal.summary = createRenderedIdealRenderSummary("error", {
      errorMessage,
      canvasWidth: renderedIdealCanvas.width,
      canvasHeight: renderedIdealCanvas.height,
    })
  }

  if (state.renderedIdeal.summary.status === "rendered") {
    renderedIdealRenderSeq += 1
    state.renderedIdeal.detection = {
      ...state.renderedIdeal.detection,
      renderSeq: renderedIdealRenderSeq,
    }
    requestRenderedIdealDetection(renderedIdealRenderSeq)
  } else {
    state.renderedIdeal.detection = {
      ...state.renderedIdeal.detection,
      status: "idle",
      landmarks478: null,
      landmarkCount: null,
      pose: {
        yaw: null,
        pitch: null,
        roll: null,
      },
      expressionSummary: null,
      qualityScore: null,
      errorMessage: null,
      renderSeq: renderedIdealRenderSeq > 0 ? renderedIdealRenderSeq : null,
      detectedRenderSeq: null,
    }
    drawRenderedIdealOverlay()
  }

  stage.dataset.renderStatus = state.renderedIdeal.summary.status
  message.textContent = getRenderedIdealMessage()
}

function renderRenderedIdealCanvasTo(
  canvas: HTMLCanvasElement,
  rotationCenterOverride: ObjVertex | null = null,
  poseOverride: ReferencePose | null = null,
): RenderedIdealRenderSummary {
  const context = canvas.getContext("2d")
  if (!context) {
    return createRenderedIdealRenderSummary("error", {
      errorMessage: "2D canvas context を取得できませんでした。",
    })
  }

  const rect = canvas.getBoundingClientRect()
  const cssWidth = rect.width > 0 ? rect.width : RENDERED_IDEAL_FALLBACK_CANVAS_SIZE
  const cssHeight = rect.height > 0 ? rect.height : RENDERED_IDEAL_FALLBACK_CANVAS_SIZE
  const dpr = window.devicePixelRatio || 1
  const targetWidth = Math.max(1, Math.round(cssWidth * dpr))
  const targetHeight = Math.max(1, Math.round(cssHeight * dpr))
  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth
    canvas.height = targetHeight
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  drawRenderedIdealBackground(context, cssWidth, cssHeight)

  if (!state.objFile.loaded || getObjPreviewStatus() !== "ready") {
    return createRenderedIdealRenderSummary("not_ready", {
      canvasWidth: targetWidth,
      canvasHeight: targetHeight,
      errorMessage: null,
    })
  }

  const renderPose = poseOverride ?? getRenderedIdealPreviewPose()
  if (!hasFullPose(renderPose)) {
    return createRenderedIdealRenderSummary("not_ready", {
      canvasWidth: targetWidth,
      canvasHeight: targetHeight,
      errorMessage: null,
    })
  }

  const summary = state.objSummary
  if (!summary.center || !summary.maxDimension || summary.maxDimension <= 0) {
    return createRenderedIdealRenderSummary("not_ready", {
      canvasWidth: targetWidth,
      canvasHeight: targetHeight,
      errorMessage: "OBJ bounds が不足しています。",
    })
  }

  const previewState = getObjPoseSyncPreviewState(renderPose)
  const rotationCenter = rotationCenterOverride ?? getObjPoseSyncRotationCenter()
  const viewport = {
    centerX: cssWidth / 2,
    centerY: cssHeight / 2,
    scale: Math.max(1, Math.min(cssWidth, cssHeight) * 0.44),
  }
  const transformedVertices = state.objGeometry.vertices.map((vertex) =>
    transformObjVertexForRender(vertex, summary.center!, summary.maxDimension!, previewState, rotationCenter),
  )
  const faceDrawItems = createRenderedIdealFaceDrawItems(transformedVertices, viewport, previewState)

  faceDrawItems.sort((a, b) => a.averageZ - b.averageZ)

  let drawnFaceCount = 0
  let skippedFaceCount = 0

  context.save()
  context.lineJoin = "round"
  context.lineWidth = 0.65
  for (const item of faceDrawItems) {
    if (item.points.length < 3) {
      skippedFaceCount += 1
      continue
    }

    context.beginPath()
    context.moveTo(item.points[0].x, item.points[0].y)
    for (let index = 1; index < item.points.length; index += 1) {
      context.lineTo(item.points[index].x, item.points[index].y)
    }
    context.closePath()
    context.fillStyle = getRenderedIdealFaceColor(item.brightness)
    context.strokeStyle = getRenderedIdealFaceStrokeColor(item.brightness)
    context.fill()
    context.stroke()
    drawnFaceCount += 1
  }
  context.restore()

  skippedFaceCount += state.objGeometry.faces.length - faceDrawItems.length

  return createRenderedIdealRenderSummary("rendered", {
    canvasWidth: targetWidth,
    canvasHeight: targetHeight,
    drawnFaceCount,
    skippedFaceCount,
    appliedYawDeg: previewState.yawDeg,
    appliedPitchDeg: previewState.pitchDeg,
    appliedRollDeg: previewState.rollDeg,
    rotationCenter: {
      x: roundForState(rotationCenter.x) ?? 0,
      y: roundForState(rotationCenter.y) ?? 0,
      z: roundForState(rotationCenter.z) ?? 0,
    },
    errorMessage: null,
  })
}

function createRenderedIdealFaceDrawItems(
  transformedVertices: ObjVertex[],
  viewport: { centerX: number; centerY: number; scale: number },
  previewState: ObjPreviewState,
) {
  return state.objGeometry.faces.flatMap((face) => {
    const vertices: ObjVertex[] = []
    face.indices.forEach((index) => {
      const vertex = transformedVertices[index]
      if (vertex) {
        vertices.push(vertex)
      }
    })
    if (vertices.length < 3) {
      return []
    }

    const normal = orientNormalToCamera(calculateFaceNormal(vertices))
    if (!normal) {
      return []
    }

    const brightness = clamp(
      0.35 + 0.65 * Math.max(0, dotVector(normal, RENDERED_IDEAL_LIGHT_DIRECTION)),
      0.25,
      1,
    )
    const averageZ = vertices.reduce((sum, vertex) => sum + vertex.z, 0) / vertices.length
    const points = vertices.map((vertex) => ({
      x: viewport.centerX + (vertex.x * previewState.zoom + previewState.panX) * viewport.scale,
      y: viewport.centerY - (vertex.y * previewState.zoom + previewState.panY) * viewport.scale,
    }))

    return [{ averageZ, brightness, points }]
  })
}

function transformObjVertexForRender(
  vertex: ObjVertex,
  center: ObjVertex,
  maxDimension: number,
  previewState: ObjPreviewState,
  rotationCenter: ObjVertex,
): ObjVertex {
  const normalized = {
    x: (vertex.x - center.x) / maxDimension,
    y: (vertex.y - center.y) / maxDimension,
    z: (vertex.z - center.z) / maxDimension,
  }
  const shifted = {
    x: normalized.x - rotationCenter.x,
    y: normalized.y - rotationCenter.y,
    z: normalized.z - rotationCenter.z,
  }
  const rotatedShifted = rotateObjPoint(shifted, previewState)

  return {
    x: rotatedShifted.x + rotationCenter.x,
    y: rotatedShifted.y + rotationCenter.y,
    z: rotatedShifted.z + rotationCenter.z,
  }
}

function drawRenderedIdealBackground(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  context.fillStyle = state.renderedIdeal.backgroundMode === "dark" ? "#1a2028" : "#f5f7f9"
  context.fillRect(0, 0, width, height)
}

function renderRenderedIdealSummaryCard() {
  const card = getElement<HTMLElement>("[data-rendered-ideal-summary]")
  const summary = state.renderedIdeal.summary
  const detection = state.renderedIdeal.detection
  const calibration = state.objPoseCalibration
  card.innerHTML = `
    <p>${escapeHtml(getRenderedIdealMessage())}</p>
    <dl class="review-grid">
      <div><dt>render status</dt><dd>${summary.status}</dd></div>
      <div><dt>faceCount</dt><dd>${summary.faceCount}</dd></div>
      <div><dt>drawnFaceCount</dt><dd>${summary.drawnFaceCount}</dd></div>
      <div><dt>skippedFaceCount</dt><dd>${summary.skippedFaceCount}</dd></div>
      <div><dt>render mode</dt><dd>${summary.renderMode}</dd></div>
      <div><dt>light direction</dt><dd>${escapeHtml(formatPoint(summary.lightDirection))}</dd></div>
      <div><dt>pose source</dt><dd>${state.objPoseSync.source}</dd></div>
      <div><dt>applied yaw / pitch / roll</dt><dd>${escapeHtml(formatAppliedObjPose())}</dd></div>
      <div><dt>rotation center</dt><dd>${escapeHtml(formatPoint(summary.rotationCenter))}</dd></div>
      <div><dt>レンダー理想検出状態</dt><dd>${detection.status}</dd></div>
      <div><dt>レンダー理想検出ms</dt><dd>${formatRealtimeNullableNumber(detection.detectMs)}</dd></div>
      <div><dt>レンダー理想ランドマーク数</dt><dd>${formatNullableCount(detection.landmarkCount)}</dd></div>
      <div><dt>レンダー理想drop数</dt><dd>${formatNullableCount(detection.droppedCount)}</dd></div>
      <div><dt>OBJ解析状態</dt><dd>${calibration.status}</dd></div>
      <div><dt>pose数</dt><dd>${formatNullableCount(calibration.poseCount)}</dd></div>
      <div><dt>候補数</dt><dd>${formatNullableCount(calibration.candidateCount)}</dd></div>
      <div><dt>総評価数</dt><dd>${formatNullableCount(calibration.totalEvaluationCount)}</dd></div>
      <div><dt>評価済み候補数</dt><dd>${formatNullableCount(calibration.evaluatedCandidateCount)}</dd></div>
      <div><dt>評価済みpose数</dt><dd>${formatNullableCount(calibration.evaluatedPoseCount)}</dd></div>
      <div><dt>失敗候補数</dt><dd>${formatNullableCount(calibration.failedCandidateCount)}</dd></div>
      <div><dt>失敗pose評価数</dt><dd>${formatNullableCount(calibration.failedPoseEvaluationCount)}</dd></div>
      <div><dt>経過時間ms</dt><dd>${formatRealtimeNullableNumber(calibration.elapsedMs)}</dd></div>
      <div><dt>推定残り時間ms</dt><dd>${formatRealtimeNullableNumber(calibration.estimatedRemainingMs)}</dd></div>
      <div><dt>best rotationCenter</dt><dd>${escapeHtml(formatObjPoseCalibrationBestRotationCenter())}</dd></div>
      <div><dt>best score</dt><dd>${formatNullableNumber(calibration.bestCandidate?.score ?? null)}</dd></div>
      <div><dt>averagePoseError</dt><dd>${formatNullableNumber(calibration.bestCandidate?.averagePoseError ?? null)}</dd></div>
      <div><dt>maxPoseError</dt><dd>${formatNullableNumber(calibration.bestCandidate?.maxPoseError ?? null)}</dd></div>
      <div><dt>errorMessage</dt><dd>${escapeHtml(summary.errorMessage ?? "null")}</dd></div>
    </dl>
  `
}

function renderObjPreviewCanvasTo(
  canvas: HTMLCanvasElement,
  previewState: ObjPreviewState,
  rotationCenter: ObjVertex = { x: 0, y: 0, z: 0 },
) {
  const status = getObjPreviewStatus()
  const context = canvas.getContext("2d")
  if (!context) {
    return
  }

  const rect = canvas.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) {
    return
  }

  const dpr = window.devicePixelRatio || 1
  const targetWidth = Math.round(rect.width * dpr)
  const targetHeight = Math.round(rect.height * dpr)
  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth
    canvas.height = targetHeight
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  context.clearRect(0, 0, rect.width, rect.height)

  if (status !== "ready") {
    return
  }

  const summary = state.objSummary
  if (!summary.center || !summary.maxDimension || summary.maxDimension <= 0) {
    return
  }

  const viewport = {
    centerX: rect.width / 2,
    centerY: rect.height / 2,
    scale: getObjCanvasScale(canvas),
  }

  context.save()
  context.lineCap = "round"
  context.lineJoin = "round"

  if (previewState.mode === "wireframe" || previewState.mode === "points_wireframe") {
    drawObjWireframe(context, summary.center, summary.maxDimension, viewport, previewState, rotationCenter)
  }

  if (previewState.mode === "points" || previewState.mode === "points_wireframe") {
    drawObjPoints(context, summary.center, summary.maxDimension, viewport, previewState, rotationCenter)
  }

  drawObjAxisGuide(context, rect.height, previewState)
  context.restore()
}

function drawObjWireframe(
  context: CanvasRenderingContext2D,
  center: ObjVertex,
  maxDimension: number,
  viewport: { centerX: number; centerY: number; scale: number },
  previewState: ObjPreviewState,
  rotationCenter: ObjVertex,
) {
  const edgeStep = getSampleStep(state.objGeometry.edges.length, previewState.maxEdges)
  context.strokeStyle = "rgba(67, 99, 132, 0.32)"
  context.lineWidth = 1
  context.beginPath()

  for (let index = 0; index < state.objGeometry.edges.length; index += edgeStep) {
    const edge = state.objGeometry.edges[index]
    const from = state.objGeometry.vertices[edge.a]
    const to = state.objGeometry.vertices[edge.b]
    if (!from || !to) {
      continue
    }

    const p1 = projectObjVertex(from, center, maxDimension, viewport, previewState, rotationCenter)
    const p2 = projectObjVertex(to, center, maxDimension, viewport, previewState, rotationCenter)
    context.moveTo(p1.x, p1.y)
    context.lineTo(p2.x, p2.y)
  }

  context.stroke()
}

function drawObjPoints(
  context: CanvasRenderingContext2D,
  center: ObjVertex,
  maxDimension: number,
  viewport: { centerX: number; centerY: number; scale: number },
  previewState: ObjPreviewState,
  rotationCenter: ObjVertex,
) {
  const pointStep = getSampleStep(state.objGeometry.vertices.length, previewState.maxPoints)
  context.fillStyle = "rgba(18, 31, 44, 0.64)"

  for (let index = 0; index < state.objGeometry.vertices.length; index += pointStep) {
    const point = projectObjVertex(
      state.objGeometry.vertices[index],
      center,
      maxDimension,
      viewport,
      previewState,
      rotationCenter,
    )
    context.beginPath()
    context.arc(point.x, point.y, 1.35, 0, Math.PI * 2)
    context.fill()
  }
}

function drawObjAxisGuide(
  context: CanvasRenderingContext2D,
  canvasHeight: number,
  previewState: ObjPreviewState,
) {
  const originX = 18
  const originY = canvasHeight - 18
  const length = 34
  const axes: Array<{ label: string; color: string; vertex: ObjVertex }> = [
    { label: "x", color: "#cf3f3f", vertex: { x: 1, y: 0, z: 0 } },
    { label: "y", color: "#268053", vertex: { x: 0, y: 1, z: 0 } },
    { label: "z", color: "#3159b7", vertex: { x: 0, y: 0, z: 1 } },
  ]

  context.font = "700 11px Inter, system-ui, sans-serif"
  axes.forEach((axis) => {
    const rotated = rotateObjPoint(axis.vertex, previewState)
    const x = originX + rotated.x * length
    const y = originY - rotated.y * length
    context.strokeStyle = axis.color
    context.fillStyle = axis.color
    context.lineWidth = 2
    context.beginPath()
    context.moveTo(originX, originY)
    context.lineTo(x, y)
    context.stroke()
    context.fillText(axis.label, x + 4, y + 4)
  })
}

function projectObjVertex(
  vertex: ObjVertex,
  center: ObjVertex,
  maxDimension: number,
  viewport: { centerX: number; centerY: number; scale: number },
  previewState: ObjPreviewState,
  rotationCenter: ObjVertex,
) {
  const normalized = {
    x: (vertex.x - center.x) / maxDimension,
    y: (vertex.y - center.y) / maxDimension,
    z: (vertex.z - center.z) / maxDimension,
  }
  const shifted = {
    x: normalized.x - rotationCenter.x,
    y: normalized.y - rotationCenter.y,
    z: normalized.z - rotationCenter.z,
  }
  const rotatedShifted = rotateObjPoint(shifted, previewState)
  const rotated = {
    x: rotatedShifted.x + rotationCenter.x,
    y: rotatedShifted.y + rotationCenter.y,
    z: rotatedShifted.z + rotationCenter.z,
  }

  return {
    x: viewport.centerX + (rotated.x * previewState.zoom + previewState.panX) * viewport.scale,
    y: viewport.centerY - (rotated.y * previewState.zoom + previewState.panY) * viewport.scale,
    z: rotated.z,
  }
}

function rotateObjPoint(point: ObjVertex, previewState: ObjPreviewState): ObjVertex {
  const yaw = degreesToRadians(previewState.yawDeg)
  const pitch = degreesToRadians(previewState.pitchDeg)
  const roll = degreesToRadians(previewState.rollDeg)
  const cosYaw = Math.cos(yaw)
  const sinYaw = Math.sin(yaw)
  const cosPitch = Math.cos(pitch)
  const sinPitch = Math.sin(pitch)
  const cosRoll = Math.cos(roll)
  const sinRoll = Math.sin(roll)

  const yawX = point.x * cosYaw + point.z * sinYaw
  const yawY = point.y
  const yawZ = -point.x * sinYaw + point.z * cosYaw

  const pitchX = yawX
  const pitchY = yawY * cosPitch - yawZ * sinPitch
  const pitchZ = yawY * sinPitch + yawZ * cosPitch

  return {
    x: pitchX * cosRoll - pitchY * sinRoll,
    y: pitchX * sinRoll + pitchY * cosRoll,
    z: pitchZ,
  }
}

function drawLiveOverlay() {
  const context = liveOverlayCanvas.getContext("2d")
  if (!context) {
    return
  }

  const rect = liveOverlayCanvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  liveOverlayCanvas.width = Math.max(1, Math.round(rect.width * dpr))
  liveOverlayCanvas.height = Math.max(1, Math.round(rect.height * dpr))
  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  context.clearRect(0, 0, rect.width, rect.height)

  if (
    state.activePreviewTab !== "live" ||
    !state.overlay.showLandmarks478 ||
    rect.width <= 0 ||
    rect.height <= 0 ||
    state.currentAnalysis.landmarks478.length !== REQUIRED_LANDMARK_COUNT
  ) {
    return
  }

  const displayedContentRect = getDisplayedContentRect(
    state.liveVideo,
    liveVideoElement,
    rect.width,
    rect.height,
  )

  drawLandmarkPoints(
    context,
    displayedContentRect,
    state.currentAnalysis.landmarks478,
    "rgba(79, 128, 255, 0.85)",
    1.45,
  )
}

function drawRenderedIdealOverlay() {
  const context = renderedIdealOverlayCanvas.getContext("2d")
  if (!context) {
    return
  }

  const rect = renderedIdealOverlayCanvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  renderedIdealOverlayCanvas.width = Math.max(1, Math.round(rect.width * dpr))
  renderedIdealOverlayCanvas.height = Math.max(1, Math.round(rect.height * dpr))
  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  context.clearRect(0, 0, rect.width, rect.height)

  const landmarks = state.renderedIdeal.detection.landmarks478
  if (
    state.activePreviewTab !== "renderedIdeal" ||
    !state.overlay.showLandmarks478 ||
    state.renderedIdeal.summary.status !== "rendered" ||
    !landmarks ||
    landmarks.length !== REQUIRED_LANDMARK_COUNT ||
    rect.width <= 0 ||
    rect.height <= 0
  ) {
    return
  }

  drawLandmarkPoints(
    context,
    {
      x: 0,
      y: 0,
      width: rect.width,
      height: rect.height,
    },
    landmarks,
    "rgba(219, 68, 85, 0.9)",
    1.35,
  )
}

function drawLandmarkPoints(
  context: CanvasRenderingContext2D,
  displayedContentRect: Rect,
  landmarks: ReferenceLandmark[],
  color: string,
  radius: number,
) {
  context.fillStyle = color
  for (const landmark of landmarks) {
    const point = normalizedLandmarkToPreviewPixel(landmark, displayedContentRect)
    context.beginPath()
    context.arc(point.x, point.y, radius, 0, Math.PI * 2)
    context.fill()
  }
}

function getDisplayedContentRect(
  videoState: LiveVideoState,
  videoElement: HTMLVideoElement,
  containerWidth: number,
  containerHeight: number,
): Rect {
  const videoWidth = videoState.width ?? videoElement.videoWidth
  const videoHeight = videoState.height ?? videoElement.videoHeight
  if (!videoWidth || !videoHeight) {
    return {
      x: 0,
      y: 0,
      width: containerWidth,
      height: containerHeight,
    }
  }

  const videoAspect = videoWidth / videoHeight
  const containerAspect = containerWidth / containerHeight

  if (containerAspect > videoAspect) {
    const width = containerHeight * videoAspect
    return {
      x: (containerWidth - width) / 2,
      y: 0,
      width,
      height: containerHeight,
    }
  }

  const height = containerWidth / videoAspect
  return {
    x: 0,
    y: (containerHeight - height) / 2,
    width: containerWidth,
    height,
  }
}

function normalizedLandmarkToPreviewPixel(
  landmark: { x: number; y: number },
  displayedContentRect: Rect,
) {
  return {
    x: displayedContentRect.x + landmark.x * displayedContentRect.width,
    y: displayedContentRect.y + landmark.y * displayedContentRect.height,
  }
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
    message.textContent = "not_ready"
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
  if (state.activeDebugTab === "objPoseCalibration") {
    appendDefinitionItems(list, getObjPoseCalibrationItems())
  }
  if (state.activeDebugTab === "realtime") {
    appendDefinitionItems(list, getRealtimeItems())
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
  const objFileStatus = getObjFileStatus()
  const bestObjPoseCalibrationCandidate = state.objPoseCalibration.bestCandidate
  return [
    ["labName", LAB_NAME],
    ["liveInputSourceType", state.liveInput.sourceType ?? "null"],
    ["liveVideoStatus", state.liveVideo.status],
    ["realtimeMode", state.realtimeDebug.mode],
    ["realtimeDriveMode", state.realtimeDebug.driveMode],
    ["currentAnalysisOnlySupported", "true"],
    ["cameraStatus", state.camera.status],
    ["cameraWidth", formatNullableCount(state.camera.width)],
    ["cameraHeight", formatNullableCount(state.camera.height)],
    ["cameraFrameRate", formatNullableNumber(state.camera.frameRate)],
    ["currentAnalysisStatus", state.currentAnalysis.status],
    ["currentLandmarkCount", formatNullableCount(state.currentAnalysis.status === "not_ready" ? null : state.currentAnalysis.landmarkCount)],
    ["currentPoseYaw", formatNullableNumber(state.currentAnalysis.pose.yaw)],
    ["currentPosePitch", formatNullableNumber(state.currentAnalysis.pose.pitch)],
    ["currentPoseRoll", formatNullableNumber(state.currentAnalysis.pose.roll)],
    ["currentQualityScore", formatNullableNumber(state.currentAnalysis.qualityScore)],
    ["objFileStatus", objFileStatus],
    ["objVertexCount", formatNullableCount(state.objFile.loaded ? state.objSummary.vertexCount : null)],
    ["objFaceCount", formatNullableCount(state.objFile.loaded ? state.objSummary.faceCount : null)],
    ["objWarningCount", formatNullableCount(state.objFile.loaded ? state.objSummary.warningCount : null)],
    ["objPreviewStatus", getObjPreviewStatus()],
    ["objPreviewMode", state.objPreview.mode],
    ["objSampledPointCount", formatNullableCount(state.objPreviewStats.sampledPointCount)],
    ["objSampledEdgeCount", formatNullableCount(state.objPreviewStats.sampledEdgeCount)],
    ["objPoseSyncEnabled", String(state.objPoseSync.enabled)],
    ["objPoseSyncSource", state.objPoseSync.source],
    ["appliedYawDeg", formatNullableNumber(state.objPoseSync.appliedYawDeg)],
    ["appliedPitchDeg", formatNullableNumber(state.objPoseSync.appliedPitchDeg)],
    ["appliedRollDeg", formatNullableNumber(state.objPoseSync.appliedRollDeg)],
    ["yawSign", String(state.objPoseSync.yawSign)],
    ["pitchSign", String(state.objPoseSync.pitchSign)],
    ["rollSign", String(state.objPoseSync.rollSign)],
    ["yawOffsetDeg", formatNumber(state.objPoseSync.yawOffsetDeg)],
    ["pitchOffsetDeg", formatNumber(state.objPoseSync.pitchOffsetDeg)],
    ["rollOffsetDeg", formatNumber(state.objPoseSync.rollOffsetDeg)],
    ["rotationCenterX", formatNumber(state.objPoseSync.rotationCenterX)],
    ["rotationCenterY", formatNumber(state.objPoseSync.rotationCenterY)],
    ["rotationCenterZ", formatNumber(state.objPoseSync.rotationCenterZ)],
    ["objErrorMessage", state.objErrorMessage ?? "null"],
    ["renderedIdealStatus", state.renderedIdeal.summary.status],
    ["renderedIdealRenderMode", state.renderedIdeal.summary.renderMode],
    ["renderedIdealDrawnFaceCount", formatNullableCount(state.renderedIdeal.summary.drawnFaceCount)],
    ["renderedIdealSkippedFaceCount", formatNullableCount(state.renderedIdeal.summary.skippedFaceCount)],
    ["renderedIdealDetectionStatus", state.renderedIdeal.detection.status],
    ["renderedIdealDetectMs", formatRealtimeNullableNumber(state.renderedIdeal.detection.detectMs)],
    ["renderedIdealAverageDetectMs", formatRealtimeNullableNumber(state.renderedIdeal.detection.averageDetectMs)],
    ["renderedIdealLandmarkCount", formatNullableCount(state.renderedIdeal.detection.landmarkCount)],
    ["renderedIdealDroppedCount", formatNullableCount(state.renderedIdeal.detection.droppedCount)],
    ["renderedIdealErrorCount", formatNullableCount(state.renderedIdeal.detection.errorCount)],
    ["renderedIdealRenderSeq", formatNullableCount(state.renderedIdeal.detection.renderSeq)],
    ["renderedIdealDetectedRenderSeq", formatNullableCount(state.renderedIdeal.detection.detectedRenderSeq)],
    ["objPoseCalibrationStatus", state.objPoseCalibration.status],
    ["objPoseCalibrationPoseCount", formatNullableCount(state.objPoseCalibration.poseCount)],
    ["objPoseCalibrationCandidateCount", formatNullableCount(state.objPoseCalibration.candidateCount)],
    ["objPoseCalibrationBestRotationCenterX", formatNullableNumber(bestObjPoseCalibrationCandidate?.rotationCenterX ?? null)],
    ["objPoseCalibrationBestRotationCenterY", formatNullableNumber(bestObjPoseCalibrationCandidate?.rotationCenterY ?? null)],
    ["objPoseCalibrationBestRotationCenterZ", formatNullableNumber(bestObjPoseCalibrationCandidate?.rotationCenterZ ?? null)],
    ["objPoseCalibrationBestScore", formatNullableNumber(bestObjPoseCalibrationCandidate?.score ?? null)],
    ["objPoseCalibrationAveragePoseError", formatNullableNumber(bestObjPoseCalibrationCandidate?.averagePoseError ?? null)],
    ["objPoseCalibrationMaxPoseError", formatNullableNumber(bestObjPoseCalibrationCandidate?.maxPoseError ?? null)],
    ["realtimeStatus", state.realtimeDebug.status],
    ["realtimeTargetFps", formatNumber(state.realtimeDebug.targetFps)],
    ["realtimeEffectiveFps", formatRealtimeNullableNumber(state.realtimeDebug.effectiveFps)],
    ["realtimeTotalMs", formatRealtimeNullableNumber(state.realtimeDebug.totalMs)],
    ["mediaPipeDetectMs", formatRealtimeNullableNumber(state.realtimeDebug.currentAnalysisTimingBreakdown.mediaPipeDetectMs)],
    ["buildCurrentAnalysisMs", formatRealtimeNullableNumber(state.realtimeDebug.currentAnalysisTimingBreakdown.buildCurrentAnalysisMs)],
    ["liveOverlayDrawMs", formatRealtimeNullableNumber(state.realtimeDebug.currentAnalysisTimingBreakdown.liveOverlayDrawMs)],
    ["debugUpdateMs", formatRealtimeNullableNumber(state.realtimeDebug.currentAnalysisTimingBreakdown.debugUpdateMs)],
    ["videoFrameCallbackCount", formatNullableCount(state.realtimeDebug.videoFrameCallbackCount)],
    ["animationFrameFallbackCount", formatNullableCount(state.realtimeDebug.animationFrameFallbackCount)],
    ["processedVideoFrameCount", formatNullableCount(state.realtimeDebug.processedVideoFrameCount)],
    ["videoFrameMetadataMediaTime", formatRealtimeNullableNumber(state.realtimeDebug.videoFrameMetadataMediaTime)],
    ["videoFrameTimestampMs", formatRealtimeNullableNumber(state.realtimeDebug.videoFrameTimestampMs)],
    ["timestampFallbackUsed", String(state.realtimeDebug.timestampFallbackUsed)],
    ["timestampFallbackUsedCount", formatNullableCount(state.realtimeDebug.timestampFallbackUsedCount)],
    ["timeupdateAnalysisRequestCount", formatNullableCount(state.realtimeDebug.timeupdateAnalysisRequestCount)],
    ["realtimeTickAnalysisRequestCount", formatNullableCount(state.realtimeDebug.realtimeTickAnalysisRequestCount)],
    ["skippedByInProgressCount", formatNullableCount(state.realtimeDebug.skippedByInProgressCount)],
    ["skippedByNoVideoCount", formatNullableCount(state.realtimeDebug.skippedByNoVideoCount)],
    ["skippedByPausedVideoCount", formatNullableCount(state.realtimeDebug.skippedByPausedVideoCount)],
    ["warpStatus", "not_implemented"],
  ]
}

function getCurrentItems(): Array<[string, string]> {
  return [
    ["liveInputSourceType", state.liveInput.sourceType ?? "null"],
    ["liveVideoStatus", state.liveVideo.status],
    ["fileName", state.liveVideo.fileName ?? "null"],
    ["width", formatNullableCount(state.liveVideo.width)],
    ["height", formatNullableCount(state.liveVideo.height)],
    ["durationSec", formatNullableNumber(state.liveVideo.durationSec)],
    ["currentTimeSec", formatNullableNumber(state.liveVideo.currentTimeSec)],
    ["currentAnalysisStatus", state.currentAnalysis.status],
    ["detected", String(state.currentAnalysis.status === "detected")],
    ["no_face", String(state.currentAnalysis.status === "no_face")],
    ["currentLandmarkCount", formatNullableCount(state.currentAnalysis.status === "not_ready" ? null : state.currentAnalysis.landmarkCount)],
    ["yaw", formatNullableNumber(state.currentAnalysis.pose.yaw)],
    ["pitch", formatNullableNumber(state.currentAnalysis.pose.pitch)],
    ["roll", formatNullableNumber(state.currentAnalysis.pose.roll)],
    ["expressionSummary", formatExpressionSummary(state.currentAnalysis.expressionSummary)],
    ["qualityScore", formatNullableNumber(state.currentAnalysis.qualityScore)],
    ["qualitySummary", formatQualitySummary(state.currentAnalysis.qualitySummary)],
    ["objPoseSyncSource", state.objPoseSync.source],
    ["objAppliedPose", formatAppliedObjPose()],
    ["liveMediaPipeStatus", state.liveMediaPipe.status],
    ["liveTimestampMs", formatNullableNumber(state.liveMediaPipe.liveTimestampMs)],
    ["errorMessage", state.currentAnalysis.errorMessage ?? state.liveVideo.errorMessage ?? "null"],
  ]
}

function getObjItems(): Array<[string, string]> {
  const summary = state.objSummary
  return [
    ["fileName", state.objFile.fileName ?? "null"],
    ["fileSize", state.objFile.fileSize === null ? "null" : formatBytes(state.objFile.fileSize)],
    ["fileType", state.objFile.fileType ?? "null"],
    ["parseStatus", summary.parseStatus],
    ["vertexCount", formatNullableCount(state.objFile.loaded ? summary.vertexCount : null)],
    ["faceCount", formatNullableCount(state.objFile.loaded ? summary.faceCount : null)],
    ["triangleFaceCount", formatNullableCount(state.objFile.loaded ? summary.triangleFaceCount : null)],
    ["polygonFaceCount", formatNullableCount(state.objFile.loaded ? summary.polygonFaceCount : null)],
    ["bounds", formatBounds(summary.bounds)],
    ["center", formatPoint(summary.center)],
    ["size", formatPoint(summary.size)],
    ["maxDimension", formatNullableNumber(summary.maxDimension)],
    ["warningCount", formatNullableCount(state.objFile.loaded ? summary.warningCount : null)],
    ["warningsPreview", formatStringList(summary.warningsPreview)],
    ["previewYawDeg", formatNumber(state.objPreview.yawDeg)],
    ["previewPitchDeg", formatNumber(state.objPreview.pitchDeg)],
    ["previewRollDeg", formatNumber(state.objPreview.rollDeg)],
    ["previewZoom", formatNumber(state.objPreview.zoom)],
    ["previewPanX", formatNumber(state.objPreview.panX)],
    ["previewPanY", formatNumber(state.objPreview.panY)],
    ["previewMode", state.objPreview.mode],
    ["sampledPointCount", formatNullableCount(state.objPreviewStats.sampledPointCount)],
    ["sampledEdgeCount", formatNullableCount(state.objPreviewStats.sampledEdgeCount)],
    ["objPoseSyncEnabled", String(state.objPoseSync.enabled)],
    ["objPoseSyncSource", state.objPoseSync.source],
    ["objAppliedPose", formatAppliedObjPose()],
    ["appliedYawDeg", formatNullableNumber(state.objPoseSync.appliedYawDeg)],
    ["appliedPitchDeg", formatNullableNumber(state.objPoseSync.appliedPitchDeg)],
    ["appliedRollDeg", formatNullableNumber(state.objPoseSync.appliedRollDeg)],
    ["yawSign", String(state.objPoseSync.yawSign)],
    ["pitchSign", String(state.objPoseSync.pitchSign)],
    ["rollSign", String(state.objPoseSync.rollSign)],
    ["yawOffsetDeg", formatNumber(state.objPoseSync.yawOffsetDeg)],
    ["pitchOffsetDeg", formatNumber(state.objPoseSync.pitchOffsetDeg)],
    ["rollOffsetDeg", formatNumber(state.objPoseSync.rollOffsetDeg)],
    ["rotationCenterX", formatNumber(state.objPoseSync.rotationCenterX)],
    ["rotationCenterY", formatNumber(state.objPoseSync.rotationCenterY)],
    ["rotationCenterZ", formatNumber(state.objPoseSync.rotationCenterZ)],
    ["objPoseSyncSampledPointCount", formatNullableCount(state.objPoseSyncStats.sampledPointCount)],
    ["objPoseSyncSampledEdgeCount", formatNullableCount(state.objPoseSyncStats.sampledEdgeCount)],
    ["errorMessage", state.objErrorMessage ?? "null"],
  ]
}

function getRenderedIdealItems(): Array<[string, string]> {
  const summary = state.renderedIdeal.summary
  const detection = state.renderedIdeal.detection
  return [
    ["status", summary.status],
    ["canvasWidth", formatNullableCount(summary.canvasWidth)],
    ["canvasHeight", formatNullableCount(summary.canvasHeight)],
    ["faceCount", formatNullableCount(summary.faceCount)],
    ["drawnFaceCount", formatNullableCount(summary.drawnFaceCount)],
    ["skippedFaceCount", formatNullableCount(summary.skippedFaceCount)],
    ["renderMode", summary.renderMode],
    ["lightDirection", formatPoint(summary.lightDirection)],
    ["appliedYawDeg", formatNullableNumber(summary.appliedYawDeg)],
    ["appliedPitchDeg", formatNullableNumber(summary.appliedPitchDeg)],
    ["appliedRollDeg", formatNullableNumber(summary.appliedRollDeg)],
    ["rotationCenter", formatPoint(summary.rotationCenter)],
    ["Rendered Ideal MediaPipe再検出", ""],
    ["レンダー理想検出状態", detection.status],
    ["レンダー理想検出中", String(renderedIdealDetectInProgress)],
    ["レンダー理想検出ms", formatRealtimeNullableNumber(detection.detectMs)],
    ["レンダー理想平均検出ms", formatRealtimeNullableNumber(detection.averageDetectMs)],
    ["レンダー理想ランドマーク数", formatNullableCount(detection.landmarkCount)],
    ["renderSeq", formatNullableCount(detection.renderSeq)],
    ["detectedRenderSeq", formatNullableCount(detection.detectedRenderSeq)],
    ["request count", formatNullableCount(detection.requestCount)],
    ["started count", formatNullableCount(detection.startedCount)],
    ["completed count", formatNullableCount(detection.completedCount)],
    ["dropped count", formatNullableCount(detection.droppedCount)],
    ["error count", formatNullableCount(detection.errorCount)],
    ["pose search skip count", formatNullableCount(detection.skippedByPoseSearchCount)],
    ["pose yaw", formatNullableNumber(detection.pose.yaw)],
    ["pose pitch", formatNullableNumber(detection.pose.pitch)],
    ["pose roll", formatNullableNumber(detection.pose.roll)],
    ["expression summary", formatExpressionSummary(detection.expressionSummary)],
    ["quality score", formatNullableNumber(detection.qualityScore)],
    ["errorMessage", summary.errorMessage ?? "null"],
    ["レンダー理想検出error message", detection.errorMessage ?? "null"],
  ]
}

function getObjPoseCalibrationItems(): Array<[string, string]> {
  const calibration = state.objPoseCalibration
  const best = calibration.bestCandidate
  return [
    ["状態", calibration.status],
    ["pose数", formatNullableCount(calibration.poseCount)],
    ["候補数", formatNullableCount(calibration.candidateCount)],
    ["総評価数", formatNullableCount(calibration.totalEvaluationCount)],
    ["評価済み候補数", formatNullableCount(calibration.evaluatedCandidateCount)],
    ["評価済みpose数", formatNullableCount(calibration.evaluatedPoseCount)],
    ["失敗候補数", formatNullableCount(calibration.failedCandidateCount)],
    ["失敗pose評価数", formatNullableCount(calibration.failedPoseEvaluationCount)],
    ["経過時間ms", formatRealtimeNullableNumber(calibration.elapsedMs)],
    ["推定残り時間ms", formatRealtimeNullableNumber(calibration.estimatedRemainingMs)],
    ["best rotationCenterX", formatNullableNumber(best?.rotationCenterX ?? null)],
    ["best rotationCenterY", formatNullableNumber(best?.rotationCenterY ?? null)],
    ["best rotationCenterZ", formatNullableNumber(best?.rotationCenterZ ?? null)],
    ["best score", formatNullableNumber(best?.score ?? null)],
    ["averagePoseError", formatNullableNumber(best?.averagePoseError ?? null)],
    ["maxPoseError", formatNullableNumber(best?.maxPoseError ?? null)],
    ["yawErrorAvg / pitchErrorAvg / rollErrorAvg", formatPoseErrorTriple(best?.yawErrorAvg ?? null, best?.pitchErrorAvg ?? null, best?.rollErrorAvg ?? null)],
    ["yawErrorMax / pitchErrorMax / rollErrorMax", formatPoseErrorTriple(best?.yawErrorMax ?? null, best?.pitchErrorMax ?? null, best?.rollErrorMax ?? null)],
    ["failedPoseCount", formatNullableCount(best?.failedPoseCount ?? null)],
    ["detectMsTotal", formatRealtimeNullableNumber(best?.detectMsTotal ?? null)],
    ["top candidates", formatObjPoseCalibrationTopCandidatesText()],
    ["best poseResultsPreview", formatObjPoseCalibrationPoseResultsText(best?.poseResultsPreview ?? [])],
    ["errorMessage", calibration.errorMessage ?? "null"],
  ]
}

function getRealtimeItems(): Array<[string, string]> {
  const breakdown = state.realtimeDebug.currentAnalysisTimingBreakdown
  const averageBreakdown = state.realtimeDebug.averageCurrentAnalysisTimingBreakdown
  return [
    ["入力ソース", formatLiveInputSourceLabel(state.liveInput.sourceType)],
    ["リアルタイムモード", realtimeModeLabels[state.realtimeDebug.mode]],
    ["駆動方式", realtimeDriveModeLabels[state.realtimeDebug.driveMode]],
    ["video frame callback 回数", formatNullableCount(state.realtimeDebug.videoFrameCallbackCount)],
    ["animation frame fallback 回数", formatNullableCount(state.realtimeDebug.animationFrameFallbackCount)],
    ["処理済み video frame 数", formatNullableCount(state.realtimeDebug.processedVideoFrameCount)],
    ["同一フレームskip数", formatNullableCount(state.realtimeDebug.skippedBySameVideoFrameCount)],
    ["inProgress skip数", formatNullableCount(state.realtimeDebug.skippedByInProgressCount)],
    ["timestamp fallback 使用回数", formatNullableCount(state.realtimeDebug.timestampFallbackUsedCount)],
    ["videoFrameMetadataMediaTime", formatRealtimeNullableNumber(state.realtimeDebug.videoFrameMetadataMediaTime)],
    ["videoFrameTimestampMs", formatRealtimeNullableNumber(state.realtimeDebug.videoFrameTimestampMs)],
    ["timestampFallbackUsed", String(state.realtimeDebug.timestampFallbackUsed)],
    ["last mediaTime", formatRealtimeNullableNumber(state.realtimeDebug.lastVideoFrameMediaTimeSec)],
    ["last timestampMs", formatRealtimeNullableNumber(state.realtimeDebug.lastVideoFrameTimestampMs)],
    ["MediaPipe検出ms", formatRealtimeNullableNumber(breakdown.mediaPipeDetectMs)],
    ["解析結果整形ms", formatRealtimeNullableNumber(breakdown.buildCurrentAnalysisMs)],
    ["ライブ重ね描画ms", formatRealtimeNullableNumber(breakdown.liveOverlayDrawMs)],
    ["デバッグ更新ms", formatRealtimeNullableNumber(breakdown.debugUpdateMs)],
    ["OBJレンダーms", formatRealtimeObjRenderMs()],
    ["Rendered Ideal 再検出ms", formatRealtimeNullableNumber(state.renderedIdeal.detection.detectMs)],
    ["Rendered Ideal drop数", formatNullableCount(state.renderedIdeal.detection.droppedCount)],
    ["Rendered Ideal landmark数", formatNullableCount(state.renderedIdeal.detection.landmarkCount)],
    ["合計ms", formatRealtimeNullableNumber(state.realtimeDebug.totalMs)],
    ["実効FPS", formatRealtimeNullableNumber(state.realtimeDebug.effectiveFps)],
    ["ボトルネック", getRealtimeBottleneck()],
    ["timeupdate / realtime tick counters", `${state.realtimeDebug.timeupdateAnalysisRequestCount} / ${state.realtimeDebug.realtimeTickAnalysisRequestCount}`],
    ["video frame / animation frame / interval counters", `${state.realtimeDebug.videoFrameCallbackCount} / ${state.realtimeDebug.animationFrameFallbackCount} / ${state.realtimeDebug.intervalLegacyTickCount}`],
    ["状態", formatRealtimeStatus(state.realtimeDebug.status)],
    ["目標FPS", formatNumber(state.realtimeDebug.targetFps)],
    ["処理フレーム数", formatNullableCount(state.realtimeDebug.frameCount)],
    ["スキップ数", formatNullableCount(state.realtimeDebug.skippedCount)],
    ["エラー数", formatNullableCount(state.realtimeDebug.errorCount)],
    ["現在顔解析ms", formatRealtimeNullableNumber(state.realtimeDebug.currentAnalysisMs)],
    ["現在顔解析合計ms", formatRealtimeNullableNumber(breakdown.currentAnalysisTotalMs)],
    ["平均MediaPipe検出ms", formatRealtimeNullableNumber(averageBreakdown.mediaPipeDetectMs)],
    ["平均解析結果整形ms", formatRealtimeNullableNumber(averageBreakdown.buildCurrentAnalysisMs)],
    ["平均ライブ重ね描画ms", formatRealtimeNullableNumber(averageBreakdown.liveOverlayDrawMs)],
    ["平均デバッグ更新ms", formatRealtimeNullableNumber(averageBreakdown.debugUpdateMs)],
    ["平均現在顔解析合計ms", formatRealtimeNullableNumber(averageBreakdown.currentAnalysisTotalMs)],
    ["平均OBJレンダーms", formatRealtimeAverageObjRenderMs()],
    ["timeupdate解析要求数", formatNullableCount(state.realtimeDebug.timeupdateAnalysisRequestCount)],
    ["リアルタイム中timeupdate skip数", formatNullableCount(state.realtimeDebug.skippedTimeupdateDuringRealtimeCount)],
    ["realtime tick解析要求数", formatNullableCount(state.realtimeDebug.realtimeTickAnalysisRequestCount)],
    ["処理中skip数", formatNullableCount(state.realtimeDebug.skippedByInProgressCount)],
    ["入力なしskip数", formatNullableCount(state.realtimeDebug.skippedByNoVideoCount)],
    ["停止中skip数", formatNullableCount(state.realtimeDebug.skippedByPausedVideoCount)],
    ["最終更新時刻", state.realtimeDebug.lastUpdatedAt ?? "未計測"],
    ["エラーメッセージ", state.realtimeDebug.errorMessage ?? "なし"],
    ["判定", getRealtimeJudgement()],
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
    objSummary: state.objSummary,
    objPreviewState: getRoundedObjPreviewState(),
    debugExportPreview: getDebugExportPreview(),
    objPoseSyncState: getRoundedObjPoseSyncState(),
    currentPoseSummary: roundPoseForState(state.currentAnalysis.pose),
    appliedPoseSummary: {
      yaw: roundForState(state.objPoseSync.appliedYawDeg),
      pitch: roundForState(state.objPoseSync.appliedPitchDeg),
      roll: roundForState(state.objPoseSync.appliedRollDeg),
      yawSign: state.objPoseSync.yawSign,
      pitchSign: state.objPoseSync.pitchSign,
      rollSign: state.objPoseSync.rollSign,
      yawOffsetDeg: roundForState(state.objPoseSync.yawOffsetDeg),
      pitchOffsetDeg: roundForState(state.objPoseSync.pitchOffsetDeg),
      rollOffsetDeg: roundForState(state.objPoseSync.rollOffsetDeg),
      rotationCenterX: roundForState(state.objPoseSync.rotationCenterX),
      rotationCenterY: roundForState(state.objPoseSync.rotationCenterY),
      rotationCenterZ: roundForState(state.objPoseSync.rotationCenterZ),
      source: state.objPoseSync.source,
      enabled: state.objPoseSync.enabled,
    },
    verticesPreview: state.objGeometry.vertices.slice(0, 5).map(roundPointForState),
    facesPreview: state.objGeometry.faces.slice(0, 5),
    sampledPointCount: state.objPreviewStats.sampledPointCount,
    sampledEdgeCount: state.objPreviewStats.sampledEdgeCount,
    poseSyncSampledPointCount: state.objPoseSyncStats.sampledPointCount,
    poseSyncSampledEdgeCount: state.objPoseSyncStats.sampledEdgeCount,
    objErrorMessage: state.objErrorMessage,
    liveInputState: getLiveInputRawSummary(),
    cameraState: getCameraRawSummary(),
    realtimeDebugState: getRoundedRealtimeDebugState(),
    currentAnalysisTimingBreakdown: roundCurrentAnalysisTimingBreakdown(
      state.realtimeDebug.currentAnalysisTimingBreakdown,
    ),
    liveVideo: getLiveVideoRawSummary(),
    liveMediaPipe: {
      status: state.liveMediaPipe.status,
      error: state.liveMediaPipe.error,
      liveTimestampMs: roundForState(state.liveMediaPipe.liveTimestampMs),
    },
    currentAnalysis: getCurrentAnalysisRawSummary(),
    currentLandmarksPreview: state.currentAnalysis.landmarks478
      .slice(0, LANDMARK_PREVIEW_COUNT)
      .map(roundLandmarkForState),
    renderedIdealRenderSummary: state.renderedIdeal.summary,
    renderedIdealDetectionState: getRenderedIdealDetectionRawSummary(),
    renderedIdealLandmarkPreview: getRenderedIdealLandmarkPreview(),
    renderedIdeal: {
      renderStatus: state.renderedIdeal.summary.status,
      renderMode: state.renderedIdeal.summary.renderMode,
      mediaPipeStatus: state.renderedIdeal.detection.status,
      renderedIdeal478Count: state.renderedIdeal.detection.landmarkCount,
      renderedIdealPose: roundPoseForState(state.renderedIdeal.detection.pose),
    },
    objPoseCalibrationState: getObjPoseCalibrationRawSummary(),
    objPoseCalibrationTopCandidates: state.objPoseCalibration.topCandidates.map(roundObjPoseCalibrationCandidate),
    objPoseCalibrationPoseSet: OBJ_POSE_CALIBRATION_POSES.map((pose) => ({ ...pose })),
    warpMesh: {
      sourceVerticesStatus: "not_ready",
      targetVerticesStatus: "not_ready",
      triangleIndicesStatus: "not_ready",
      webglWarpStatus: "not_implemented",
    },
    logs: state.logs.slice(-20),
  }
}

function parseObjText(objText: string): ObjParseResult {
  const vertices: ObjVertex[] = []
  const pendingFaces: Array<{ lineNumber: number; tokens: string[] }> = []
  const warnings: string[] = []
  const lines = objText.split(/\r?\n/)

  lines.forEach((sourceLine, index) => {
    const lineNumber = index + 1
    const line = sourceLine.split("#", 1)[0].trim()
    if (!line) {
      return
    }

    const parts = line.split(/\s+/)
    const command = parts[0]

    if (command === "v") {
      const values = parts.slice(1, 4).map((value) => Number(value))
      if (values.length < 3 || values.some((value) => !Number.isFinite(value))) {
        warnings.push(`line ${lineNumber}: 不正な vertex 座標を skip しました。`)
        return
      }
      vertices.push({ x: values[0], y: values[1], z: values[2] })
      return
    }

    if (command === "f") {
      const tokens = parts.slice(1)
      if (tokens.length < 3) {
        warnings.push(`line ${lineNumber}: face の頂点数が不足しているため skip しました。`)
        return
      }
      pendingFaces.push({ lineNumber, tokens })
    }
  })

  const faces = pendingFaces.flatMap(({ lineNumber, tokens }) => {
    const indices: number[] = []

    for (const token of tokens) {
      const rawIndex = token.split("/")[0]
      if (!/^-?\d+$/.test(rawIndex)) {
        warnings.push(`line ${lineNumber}: face index "${token}" が不正なため face を skip しました。`)
        return []
      }

      const objIndex = Number(rawIndex)
      if (objIndex < 0) {
        warnings.push(`line ${lineNumber}: 負の face index は未対応のため face を skip しました。`)
        return []
      }
      if (objIndex === 0) {
        warnings.push(`line ${lineNumber}: OBJ index 0 は無効なため face を skip しました。`)
        return []
      }

      const zeroBasedIndex = objIndex - 1
      if (zeroBasedIndex < 0 || zeroBasedIndex >= vertices.length) {
        warnings.push(`line ${lineNumber}: face index ${objIndex} が頂点範囲外のため face を skip しました。`)
        return []
      }

      indices.push(zeroBasedIndex)
    }

    return [{ indices }]
  })

  return { vertices, faces, warnings }
}

function createUniqueEdges(faces: ObjFace[]): ObjEdge[] {
  const edgeKeys = new Set<string>()
  const edges: ObjEdge[] = []

  faces.forEach((face) => {
    for (let index = 0; index < face.indices.length; index += 1) {
      const a = face.indices[index]
      const b = face.indices[(index + 1) % face.indices.length]
      const min = Math.min(a, b)
      const max = Math.max(a, b)
      const key = `${min}:${max}`
      if (!edgeKeys.has(key)) {
        edgeKeys.add(key)
        edges.push({ a: min, b: max })
      }
    }
  })

  return edges
}

function createEmptyObjSummary(): ObjSummary {
  return {
    fileName: "",
    fileSize: 0,
    fileType: "",
    parseStatus: "not_loaded",
    vertexCount: 0,
    faceCount: 0,
    triangleFaceCount: 0,
    polygonFaceCount: 0,
    bounds: null,
    center: null,
    size: null,
    maxDimension: null,
    warningCount: 0,
    warningsPreview: [],
  }
}

function createEmptyObjGeometry(): ObjGeometryState {
  return {
    vertices: [],
    faces: [],
    edges: [],
  }
}

function createDefaultObjPreviewState(): ObjPreviewState {
  return {
    yawDeg: 0,
    pitchDeg: 0,
    rollDeg: 0,
    zoom: 1,
    panX: 0,
    panY: 0,
    mode: "points_wireframe",
    maxPoints: 8000,
    maxEdges: 12000,
  }
}

function createDefaultObjPoseSyncState(): ObjPoseSyncState {
  return {
    enabled: true,
    yawSign: 1,
    pitchSign: 1,
    rollSign: 1,
    yawOffsetDeg: 0,
    pitchOffsetDeg: 0,
    rollOffsetDeg: 0,
    rotationCenterX: 0,
    rotationCenterY: 0,
    rotationCenterZ: 0,
    appliedYawDeg: null,
    appliedPitchDeg: null,
    appliedRollDeg: null,
    source: "none",
  }
}

function createDefaultRenderedIdealState(): RenderedIdealState {
  return {
    backgroundMode: "light",
    colorMode: "clay",
    detection: createEmptyRenderedIdealDetectionState(),
    summary: {
      status: "not_ready",
      canvasWidth: 0,
      canvasHeight: 0,
      renderMode: "shaded_faces",
      faceCount: 0,
      drawnFaceCount: 0,
      skippedFaceCount: 0,
      lightDirection: {
        x: roundForState(RENDERED_IDEAL_LIGHT_DIRECTION.x) ?? 0,
        y: roundForState(RENDERED_IDEAL_LIGHT_DIRECTION.y) ?? 0,
        z: roundForState(RENDERED_IDEAL_LIGHT_DIRECTION.z) ?? 0,
      },
      appliedYawDeg: null,
      appliedPitchDeg: null,
      appliedRollDeg: null,
      rotationCenter: { x: 0, y: 0, z: 0 },
      errorMessage: null,
    },
  }
}

function createEmptyRenderedIdealDetectionState(): RenderedIdealDetectionState {
  return {
    status: "idle",
    landmarks478: null,
    detectMs: null,
    averageDetectMs: null,
    landmarkCount: null,
    pose: {
      yaw: null,
      pitch: null,
      roll: null,
    },
    expressionSummary: null,
    qualityScore: null,
    errorMessage: null,
    renderSeq: null,
    detectedRenderSeq: null,
    requestCount: 0,
    startedCount: 0,
    completedCount: 0,
    droppedCount: 0,
    errorCount: 0,
    skippedByPoseSearchCount: 0,
  }
}

function createDefaultObjPoseCalibrationState(): ObjPoseCalibrationState {
  return {
    status: "idle",
    startedAt: null,
    completedAt: null,
    elapsedMs: null,
    estimatedRemainingMs: null,
    poseCount: OBJ_POSE_CALIBRATION_POSES.length,
    candidateCount: 0,
    totalEvaluationCount: 0,
    evaluatedCandidateCount: 0,
    evaluatedPoseCount: 0,
    failedCandidateCount: 0,
    failedPoseEvaluationCount: 0,
    currentBestCandidate: null,
    bestCandidate: null,
    topCandidates: [],
    errorMessage: null,
  }
}

function createDefaultPoseCenterSearchState(): PoseCenterSearchState {
  return {
    status: "idle",
    mode: "single_frame",
    startedAt: null,
    completedAt: null,
    elapsedMs: null,
    estimatedRemainingMs: null,
    errorMessage: null,
    range: createPoseCenterSearchRange(),
    frameCount: 0,
    candidateCount: 0,
    totalEvaluationCount: 0,
    evaluatedCandidateCount: 0,
    evaluatedFrameCount: 0,
    failedFrameEvaluationCount: 0,
    evaluatedCount: 0,
    failedCandidateCount: 0,
    currentPose: {
      yaw: null,
      pitch: null,
      roll: null,
    },
    currentBestCandidate: null,
    bestCandidate: null,
    topCandidates: [],
    appliedBestAutomatically: false,
    appliedBestManually: false,
    appliedBestSourceMode: null,
    bestAppliedAt: null,
  }
}

function createPoseCenterSearchRange(): PoseCenterSearchState["range"] {
  return {
    x: { fixed: true, value: POSE_CENTER_SEARCH_RANGE.x.value },
    y: {
      min: POSE_CENTER_SEARCH_RANGE.y.min,
      max: POSE_CENTER_SEARCH_RANGE.y.max,
      step: POSE_CENTER_SEARCH_RANGE.y.step,
    },
    z: {
      min: POSE_CENTER_SEARCH_RANGE.z.min,
      max: POSE_CENTER_SEARCH_RANGE.z.max,
      step: POSE_CENTER_SEARCH_RANGE.z.step,
    },
  }
}

function createRenderedIdealRenderSummary(
  status: RenderedIdealRenderStatus,
  overrides: Partial<RenderedIdealRenderSummary> = {},
): RenderedIdealRenderSummary {
  return {
    status,
    canvasWidth: overrides.canvasWidth ?? 0,
    canvasHeight: overrides.canvasHeight ?? 0,
    renderMode: "shaded_faces",
    faceCount: state.objGeometry.faces.length,
    drawnFaceCount: overrides.drawnFaceCount ?? 0,
    skippedFaceCount: overrides.skippedFaceCount ?? 0,
    lightDirection: {
      x: roundForState(RENDERED_IDEAL_LIGHT_DIRECTION.x) ?? 0,
      y: roundForState(RENDERED_IDEAL_LIGHT_DIRECTION.y) ?? 0,
      z: roundForState(RENDERED_IDEAL_LIGHT_DIRECTION.z) ?? 0,
    },
    appliedYawDeg: roundForState(overrides.appliedYawDeg ?? state.objPoseSync.appliedYawDeg),
    appliedPitchDeg: roundForState(overrides.appliedPitchDeg ?? state.objPoseSync.appliedPitchDeg),
    appliedRollDeg: roundForState(overrides.appliedRollDeg ?? state.objPoseSync.appliedRollDeg),
    rotationCenter: overrides.rotationCenter ?? {
      x: roundForState(state.objPoseSync.rotationCenterX) ?? 0,
      y: roundForState(state.objPoseSync.rotationCenterY) ?? 0,
      z: roundForState(state.objPoseSync.rotationCenterZ) ?? 0,
    },
    errorMessage: overrides.errorMessage ?? null,
  }
}

function createEmptyLiveVideoState(): LiveVideoState {
  return {
    loaded: false,
    fileName: null,
    fileSize: null,
    fileType: null,
    objectUrl: null,
    durationSec: null,
    width: null,
    height: null,
    currentTimeSec: null,
    playbackStatus: "stopped",
    status: "not_loaded",
    errorMessage: null,
  }
}

function createEmptyLiveInputState(): LiveInputState {
  return {
    sourceType: null,
    status: "not_loaded",
    fileName: null,
    width: null,
    height: null,
    durationSec: null,
    currentTimeSec: null,
    paused: null,
    readyState: null,
  }
}

function createEmptyCameraState(): CameraState {
  return {
    status: "not_started",
    errorMessage: null,
    width: null,
    height: null,
    frameRate: null,
    deviceLabel: null,
  }
}

function createEmptyQualitySummary(): QualitySummary {
  return {
    status: "not_ready",
    expectedLandmarkCount: REQUIRED_LANDMARK_COUNT,
    landmarkCount: 0,
    hasPose: false,
  }
}

function createEmptyCurrentAnalysis(): CurrentFrameAnalysis {
  return {
    status: "not_ready",
    analyzedTimeSec: null,
    landmarks478: [],
    landmarkCount: 0,
    pose: {
      yaw: null,
      pitch: null,
      roll: null,
    },
    blendshapes: [],
    expressionSummary: null,
    qualityScore: null,
    qualitySummary: createEmptyQualitySummary(),
    errorMessage: null,
  }
}

function createEmptyCurrentAnalysisTimingBreakdown(): CurrentAnalysisTimingBreakdown {
  return {
    mediaPipeDetectMs: null,
    buildCurrentAnalysisMs: null,
    liveOverlayDrawMs: null,
    debugUpdateMs: null,
    currentAnalysisTotalMs: null,
  }
}

function createDefaultRealtimeDebugState(
  overrides: Partial<Pick<RealtimeDebugState, "mode" | "driveMode" | "targetFps">> = {},
): RealtimeDebugState {
  return {
    status: "idle",
    mode: overrides.mode ?? "current_analysis_only",
    driveMode: overrides.driveMode ?? "video_frame_callback",
    targetFps: overrides.targetFps ?? 10,
    frameCount: 0,
    skippedCount: 0,
    errorCount: 0,
    currentAnalysisMs: null,
    objRenderMs: null,
    mediaPipeRedetectMs: null,
    totalMs: null,
    currentAnalysisTimingBreakdown: createEmptyCurrentAnalysisTimingBreakdown(),
    averageCurrentAnalysisTimingBreakdown: createEmptyCurrentAnalysisTimingBreakdown(),
    averageObjRenderMs: null,
    averageTotalMs: null,
    effectiveFps: null,
    lastUpdatedAt: null,
    errorMessage: null,
    timeupdateAnalysisRequestCount: 0,
    realtimeTickAnalysisRequestCount: 0,
    videoFrameCallbackCount: 0,
    animationFrameFallbackCount: 0,
    intervalLegacyTickCount: 0,
    processedVideoFrameCount: 0,
    skippedBySameVideoFrameCount: 0,
    skippedByInProgressCount: 0,
    skippedByNoVideoCount: 0,
    skippedByPausedVideoCount: 0,
    skippedTimeupdateDuringRealtimeCount: 0,
    videoFrameMetadataMediaTime: null,
    videoFrameTimestampMs: null,
    timestampFallbackUsed: false,
    lastVideoFrameMediaTimeSec: null,
    lastVideoFrameTimestampMs: null,
    timestampFallbackUsedCount: 0,
  }
}

function createLiveFaceLandmarkerOptions(): FaceLandmarkerOptions {
  return {
    baseOptions: {
      modelAssetPath: MEDIAPIPE_FACE_LANDMARKER_MODEL_ASSET_PATH,
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numFaces: 1,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
  }
}

function createRenderedIdealFaceLandmarkerOptions(): FaceLandmarkerOptions {
  return {
    baseOptions: {
      modelAssetPath: MEDIAPIPE_FACE_LANDMARKER_MODEL_ASSET_PATH,
      delegate: "GPU",
    },
    runningMode: "IMAGE",
    numFaces: 1,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
  }
}

function createFileObjSummary(file: File, parseStatus: ObjParseStatus): ObjSummary {
  return {
    ...createEmptyObjSummary(),
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || "unknown",
    parseStatus,
  }
}

function createParsedObjSummary(file: File, parseResult: ObjParseResult): ObjSummary {
  const bounds = calculateObjBounds(parseResult.vertices)
  const size = bounds
    ? {
        x: bounds.maxX - bounds.minX,
        y: bounds.maxY - bounds.minY,
        z: bounds.maxZ - bounds.minZ,
      }
    : null
  const center = bounds
    ? {
        x: (bounds.minX + bounds.maxX) / 2,
        y: (bounds.minY + bounds.maxY) / 2,
        z: (bounds.minZ + bounds.maxZ) / 2,
      }
    : null
  const triangleFaceCount = parseResult.faces.filter((face) => face.indices.length === 3).length
  const polygonFaceCount = parseResult.faces.filter((face) => face.indices.length > 3).length

  return {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || "unknown",
    parseStatus: "parsed",
    vertexCount: parseResult.vertices.length,
    faceCount: parseResult.faces.length,
    triangleFaceCount,
    polygonFaceCount,
    bounds,
    center,
    size,
    maxDimension: size ? Math.max(size.x, size.y, size.z) : null,
    warningCount: parseResult.warnings.length,
    warningsPreview: parseResult.warnings.slice(0, 20),
  }
}

function calculateObjBounds(vertices: ObjVertex[]): ObjBounds | null {
  if (vertices.length === 0) {
    return null
  }

  return vertices.reduce<ObjBounds>(
    (bounds, vertex) => ({
      minX: Math.min(bounds.minX, vertex.x),
      minY: Math.min(bounds.minY, vertex.y),
      minZ: Math.min(bounds.minZ, vertex.z),
      maxX: Math.max(bounds.maxX, vertex.x),
      maxY: Math.max(bounds.maxY, vertex.y),
      maxZ: Math.max(bounds.maxZ, vertex.z),
    }),
    {
      minX: vertices[0].x,
      minY: vertices[0].y,
      minZ: vertices[0].z,
      maxX: vertices[0].x,
      maxY: vertices[0].y,
      maxZ: vertices[0].z,
    },
  )
}

function getObjFileStatus() {
  if (!state.objFile.loaded) {
    return "not_loaded"
  }
  if (state.objSummary.parseStatus === "not_parsed") {
    return "loaded_not_parsed"
  }
  return state.objSummary.parseStatus
}

function getObjPreviewStatus(): ObjPreviewStatus {
  if (state.objSummary.parseStatus === "error") {
    return "error"
  }
  if (state.objSummary.parseStatus === "parsed" && state.objGeometry.vertices.length > 0) {
    return "ready"
  }
  return "not_ready"
}

function getObjPreviewMessage(status: ObjPreviewStatus) {
  if (status === "ready") {
    return "OBJ解析が完了しました。簡易 3D preview を表示しています。"
  }
  if (status === "error") {
    return "OBJ解析に失敗したため、3D preview を表示できません。"
  }
  return "OBJファイルを読み込むと、ここに OBJ 3D preview を表示します。"
}

function getObjPoseSyncMessage() {
  if (getObjPreviewStatus() !== "ready") {
    return "OBJを読み込むと、現在姿勢を反映したOBJ previewを表示します。"
  }
  if (state.currentAnalysis.status !== "detected" || !hasFullPose(state.currentAnalysis.pose)) {
    return "現在フレーム解析を実行すると、OBJに現在姿勢を反映します。"
  }
  if (!state.objPoseSync.enabled) {
    return "姿勢同期がOFFのため、現在姿勢はOBJ previewへ反映していません。"
  }
  return "現在姿勢を反映したOBJ previewを表示しています。"
}

function getObjPoseSyncStatus() {
  if (getObjPreviewStatus() !== "ready") {
    return "obj_not_ready"
  }
  if (!state.objPoseSync.enabled) {
    return "disabled"
  }
  return state.objPoseSync.source === "current_frame" ? "synced" : "waiting_current_frame"
}

function canRenderRenderedIdeal() {
  return canRenderRenderedIdealGeometry()
}

function canRenderRenderedIdealGeometry() {
  return state.objFile.loaded && getObjPreviewStatus() === "ready"
}

function isPoseCenterSearchRunning() {
  return state.poseCenterSearch.status === "running" || isObjPoseCalibrationRunning()
}

function isObjPoseCalibrationRunning() {
  return state.objPoseCalibration.status === "running"
}

function getRenderedIdealMessage() {
  if (!state.objFile.loaded || getObjPreviewStatus() !== "ready") {
    return "OBJを読み込むと、ここにレンダー理想2Dプレビューを表示します。"
  }
  if (state.renderedIdeal.summary.status === "error") {
    return "レンダー中にエラーが発生しました。"
  }
  if (state.currentAnalysis.status !== "detected" || !hasFullPose(state.currentAnalysis.pose)) {
    return "現在顔がないため、OBJを正面基準姿勢でレンダリングしています。"
  }
  return "現在姿勢を反映したOBJの2Dレンダーを表示しています。"
}

function getRenderedIdealPreviewPose(): ReferencePose {
  if (state.currentAnalysis.status === "detected" && hasFullPose(state.currentAnalysis.pose)) {
    return state.currentAnalysis.pose
  }
  return {
    yaw: 0,
    pitch: 0,
    roll: 0,
  }
}

function renderObjPreviewSummary() {
  const summary = state.objSummary
  if (!state.objFile.loaded) {
    return ""
  }

  if (summary.parseStatus === "error") {
    return `
      <p class="obj-preview-message">OBJ解析に失敗したため、3D preview を表示できません。</p>
      <dl class="obj-preview-list">
        <div><dt>fileName</dt><dd>${escapeHtml(summary.fileName)}</dd></div>
        <div><dt>parseStatus</dt><dd>error</dd></div>
        <div><dt>errorMessage</dt><dd>${escapeHtml(state.objErrorMessage ?? "null")}</dd></div>
      </dl>
    `
  }

  if (summary.parseStatus !== "parsed") {
    return `
      <p class="obj-preview-message">OBJファイルを読み込み中です。</p>
      <dl class="obj-preview-list">
        <div><dt>fileName</dt><dd>${escapeHtml(summary.fileName)}</dd></div>
        <div><dt>fileSize</dt><dd>${escapeHtml(formatBytes(summary.fileSize))}</dd></div>
        <div><dt>parseStatus</dt><dd>${summary.parseStatus}</dd></div>
      </dl>
    `
  }

  return `
    <p class="obj-preview-message">OBJ解析が完了しました。簡易 3D preview を表示しています。</p>
    <dl class="obj-preview-list">
      <div><dt>fileName</dt><dd>${escapeHtml(summary.fileName)}</dd></div>
      <div><dt>vertexCount</dt><dd>${summary.vertexCount}</dd></div>
      <div><dt>faceCount</dt><dd>${summary.faceCount}</dd></div>
      <div><dt>previewMode</dt><dd>${state.objPreview.mode}</dd></div>
      <div><dt>sampledPointCount</dt><dd>${state.objPreviewStats.sampledPointCount}</dd></div>
      <div><dt>sampledEdgeCount</dt><dd>${state.objPreviewStats.sampledEdgeCount}</dd></div>
      <div><dt>bounds</dt><dd>${escapeHtml(formatBounds(summary.bounds))}</dd></div>
      <div><dt>center</dt><dd>${escapeHtml(formatPoint(summary.center))}</dd></div>
      <div><dt>size</dt><dd>${escapeHtml(formatPoint(summary.size))}</dd></div>
    </dl>
  `
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

async function exportDebug() {
  const debugExport = buildDebugExport()
  const json = JSON.stringify(debugExport, null, 2)
  const status = getElement<HTMLElement>("[data-debug-export-status]")

  try {
    await navigator.clipboard.writeText(json)
    status.textContent = "デバッグJSONをクリップボードにコピーしました。"
    addLog("デバッグJSONをクリップボードにコピーしました。")
  } catch {
    downloadTextFile("ideal-obj-render-warp-lab-debug-export.json", json, "application/json;charset=utf-8")
    status.textContent = "クリップボードにコピーできなかったため、デバッグJSONをダウンロードしました。"
    addLog("デバッグJSONをダウンロードしました。")
  }

  renderAll()
}

function downloadTextFile(fileName: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  link.click()
  URL.revokeObjectURL(link.href)
}

function buildDebugExport() {
  return {
    schemaVersion: "ideal_obj_render_warp_lab_debug_export_v1",
    createdAt: new Date().toISOString(),
    tool: {
      id: "ideal-obj-render-warp-lab",
      purpose: "OBJ render warp lab debugging",
    },
    environment: getEnvironmentDebugExport(),
    input: {
      obj: {
        fileName: state.objFile.fileName,
        vertexCount: state.objFile.loaded ? state.objSummary.vertexCount : null,
        faceCount: state.objFile.loaded ? state.objSummary.faceCount : null,
        bounds: state.objSummary.bounds,
      },
      liveVideo: {
        fileName: state.liveVideo.fileName,
        width: state.liveVideo.width,
        height: state.liveVideo.height,
        durationSec: roundForState(state.liveVideo.durationSec),
        currentTimeSec: roundForState(state.liveVideo.currentTimeSec),
        paused: state.liveVideo.loaded ? liveVideoElement.paused : null,
        readyState: state.liveVideo.loaded ? liveVideoElement.readyState : null,
      },
      liveInput: getLiveInputRawSummary(),
      camera: getCameraRawSummary(),
    },
    currentFace: {
      status: state.currentAnalysis.status,
      landmarkCount: state.currentAnalysis.status === "not_ready" ? null : state.currentAnalysis.landmarkCount,
      pose: roundPoseForState(state.currentAnalysis.pose),
      expressionSummary: getCurrentAnalysisRawSummary().expressionSummary,
      qualityScore: roundForState(state.currentAnalysis.qualityScore),
    },
    realtime: {
      state: getRoundedRealtimeDebugState(),
      timingBreakdown: getRoundedRealtimeDebugState().currentAnalysisTimingBreakdown,
      bottleneck: getRealtimeBottleneck(),
    },
    renderedIdealDetection: getRenderedIdealDetectionDebugExport(),
    objPoseCalibration: getObjPoseCalibrationDebugExport(),
    mediaPipeOptions: {
      currentLiveOptions: getCurrentLiveMediaPipeOptionsDebug(),
      renderedIdealOptions: getRenderedIdealMediaPipeOptionsDebug(),
    },
    notes: [
      "vertices/faces/current478/renderedIdeal478/MediaPipe result/canvas data URL/all pose result arrays are intentionally omitted.",
    ],
  }
}

function addLog(message: string) {
  const timestamp = new Date().toLocaleTimeString("ja-JP", { hour12: false })
  state.logs = [`${timestamp} ${message}`, ...state.logs].slice(0, 40)
}

function resetLiveAnalysisResults() {
  disposeLiveFaceLandmarker("uninitialized")
  resetLiveTimestamp()
  state.currentAnalysis = createEmptyCurrentAnalysis()
  updateObjPoseSyncFromCurrentAnalysis()
  liveAnalysisRequestId += 1
  liveAnalysisInProgress = false
  lastAutoLiveAnalysisAtSec = Number.NEGATIVE_INFINITY
  clearLiveOverlay()
}

function disposeLiveFaceLandmarker(nextStatus: MediaPipeStatus = "disposed") {
  liveFaceLandmarker?.close()
  liveFaceLandmarker = null
  liveFaceLandmarkerPromise = null
  state.liveMediaPipe.status = nextStatus
}

function disposeRenderedIdealFaceLandmarker() {
  renderedIdealFaceLandmarker?.close()
  renderedIdealFaceLandmarker = null
  renderedIdealFaceLandmarkerPromise = null
}

function resetLiveTimestamp() {
  state.liveMediaPipe.liveTimestampMs = 0
}

function nextLiveTimestampMs() {
  state.liveMediaPipe.liveTimestampMs += MEDIAPIPE_TIMESTAMP_STEP_MS
  return state.liveMediaPipe.liveTimestampMs
}

function resetRenderedIdealTimestamp() {
  renderedIdealTimestampMs = 0
}

function nextRenderedIdealTimestampMs() {
  renderedIdealTimestampMs += MEDIAPIPE_TIMESTAMP_STEP_MS
  return renderedIdealTimestampMs
}

function clearLiveOverlay() {
  const context = liveOverlayCanvas.getContext("2d")
  if (!context) {
    return
  }
  context.clearRect(0, 0, liveOverlayCanvas.width, liveOverlayCanvas.height)
}

function cleanup() {
  stopRealtimeValidation("stopped")
  stopCameraInput()
  if (state.liveVideo.objectUrl) {
    URL.revokeObjectURL(state.liveVideo.objectUrl)
    state.liveVideo.objectUrl = null
  }
  disposeLiveFaceLandmarker("disposed")
  disposeRenderedIdealFaceLandmarker()
}

function getLiveVideoRawSummary() {
  return {
    status: state.liveVideo.status,
    fileName: state.liveVideo.fileName,
    fileSize: state.liveVideo.fileSize,
    fileType: state.liveVideo.fileType,
    durationSec: roundForState(state.liveVideo.durationSec),
    width: state.liveVideo.width,
    height: state.liveVideo.height,
    currentTimeSec: roundForState(state.liveVideo.currentTimeSec),
    playbackStatus: state.liveVideo.playbackStatus,
    errorMessage: state.liveVideo.errorMessage,
  }
}

function getLiveInputRawSummary() {
  return {
    sourceType: state.liveInput.sourceType,
    status: state.liveInput.status,
    fileName: state.liveInput.fileName,
    width: state.liveInput.width,
    height: state.liveInput.height,
    durationSec: roundForState(state.liveInput.durationSec),
    currentTimeSec: roundForState(state.liveInput.currentTimeSec),
    paused: state.liveInput.paused,
    readyState: state.liveInput.readyState,
  }
}

function getCameraRawSummary() {
  return {
    status: state.camera.status,
    errorMessage: state.camera.errorMessage,
    width: state.camera.width,
    height: state.camera.height,
    frameRate: roundForState(state.camera.frameRate),
    deviceLabel: state.camera.deviceLabel,
  }
}

function getCurrentAnalysisRawSummary() {
  return {
    status: state.currentAnalysis.status,
    analyzedTimeSec: roundForState(state.currentAnalysis.analyzedTimeSec),
    landmarkCount: state.currentAnalysis.landmarkCount,
    pose: roundPoseForState(state.currentAnalysis.pose),
    blendshapeCount: state.currentAnalysis.blendshapes.length,
    expressionSummary: state.currentAnalysis.expressionSummary
      ? {
          group: state.currentAnalysis.expressionSummary.group,
          topBlendshapes: state.currentAnalysis.expressionSummary.topBlendshapes.map(
            roundBlendshapeForState,
          ),
          missingBlendshapeKeys: state.currentAnalysis.expressionSummary.missingBlendshapeKeys,
        }
      : null,
    qualityScore: roundForState(state.currentAnalysis.qualityScore),
    qualitySummary: state.currentAnalysis.qualitySummary,
    errorMessage: state.currentAnalysis.errorMessage,
  }
}

function getRenderedIdealDetectionRawSummary() {
  const detection = state.renderedIdeal.detection
  return {
    status: detection.status,
    detectMs: roundForState(detection.detectMs),
    averageDetectMs: roundForState(detection.averageDetectMs),
    landmarkCount: detection.landmarkCount,
    pose: roundPoseForState(detection.pose),
    expressionSummary: detection.expressionSummary
      ? {
          group: detection.expressionSummary.group,
          topBlendshapes: detection.expressionSummary.topBlendshapes.map(roundBlendshapeForState),
          missingBlendshapeKeys: detection.expressionSummary.missingBlendshapeKeys,
        }
      : null,
    qualityScore: roundForState(detection.qualityScore),
    errorMessage: detection.errorMessage,
    renderSeq: detection.renderSeq,
    detectedRenderSeq: detection.detectedRenderSeq,
    requestCount: detection.requestCount,
    startedCount: detection.startedCount,
    completedCount: detection.completedCount,
    droppedCount: detection.droppedCount,
    errorCount: detection.errorCount,
    skippedByPoseSearchCount: detection.skippedByPoseSearchCount,
  }
}

function getObjPoseCalibrationRawSummary() {
  return {
    status: state.objPoseCalibration.status,
    startedAt: state.objPoseCalibration.startedAt,
    completedAt: state.objPoseCalibration.completedAt,
    elapsedMs: roundForState(state.objPoseCalibration.elapsedMs),
    estimatedRemainingMs: roundForState(state.objPoseCalibration.estimatedRemainingMs),
    poseCount: state.objPoseCalibration.poseCount,
    candidateCount: state.objPoseCalibration.candidateCount,
    totalEvaluationCount: state.objPoseCalibration.totalEvaluationCount,
    evaluatedCandidateCount: state.objPoseCalibration.evaluatedCandidateCount,
    evaluatedPoseCount: state.objPoseCalibration.evaluatedPoseCount,
    failedCandidateCount: state.objPoseCalibration.failedCandidateCount,
    failedPoseEvaluationCount: state.objPoseCalibration.failedPoseEvaluationCount,
    currentBestCandidate: state.objPoseCalibration.currentBestCandidate
      ? roundObjPoseCalibrationCandidate(state.objPoseCalibration.currentBestCandidate)
      : null,
    bestCandidate: state.objPoseCalibration.bestCandidate
      ? roundObjPoseCalibrationCandidate(state.objPoseCalibration.bestCandidate)
      : null,
    topCandidates: state.objPoseCalibration.topCandidates.map(roundObjPoseCalibrationCandidate),
    errorMessage: state.objPoseCalibration.errorMessage,
  }
}

function getPoseCenterSearchRawSummary() {
  return {
    status: state.poseCenterSearch.status,
    mode: state.poseCenterSearch.mode,
    startedAt: state.poseCenterSearch.startedAt,
    completedAt: state.poseCenterSearch.completedAt,
    elapsedMs: roundForState(state.poseCenterSearch.elapsedMs),
    estimatedRemainingMs: roundForState(state.poseCenterSearch.estimatedRemainingMs),
    errorMessage: state.poseCenterSearch.errorMessage,
    range: state.poseCenterSearch.range,
    frameCount: state.poseCenterSearch.frameCount,
    candidateCount: state.poseCenterSearch.candidateCount,
    totalEvaluationCount: state.poseCenterSearch.totalEvaluationCount,
    evaluatedCandidateCount: state.poseCenterSearch.evaluatedCandidateCount,
    evaluatedFrameCount: state.poseCenterSearch.evaluatedFrameCount,
    failedFrameEvaluationCount: state.poseCenterSearch.failedFrameEvaluationCount,
    evaluatedCount: state.poseCenterSearch.evaluatedCount,
    failedCandidateCount: state.poseCenterSearch.failedCandidateCount,
    currentPose: roundPoseForState(state.poseCenterSearch.currentPose),
    currentBestCandidate: state.poseCenterSearch.currentBestCandidate
      ? roundPoseCenterSearchCandidate(state.poseCenterSearch.currentBestCandidate)
      : null,
    bestCandidate: state.poseCenterSearch.bestCandidate
      ? roundPoseCenterSearchCandidate(state.poseCenterSearch.bestCandidate)
      : null,
    topCandidates: state.poseCenterSearch.topCandidates.map(roundPoseCenterSearchCandidate),
    appliedBestAutomatically: state.poseCenterSearch.appliedBestAutomatically,
    appliedBestManually: state.poseCenterSearch.appliedBestManually,
    appliedBestSourceMode: state.poseCenterSearch.appliedBestSourceMode,
    bestAppliedAt: state.poseCenterSearch.bestAppliedAt,
  }
}

function getRenderedIdealLandmarkPreview() {
  return (state.renderedIdeal.detection.landmarks478 ?? [])
    .slice(0, LANDMARK_PREVIEW_COUNT)
    .map(roundLandmarkForState)
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

function setChecked(action: string, checked: boolean) {
  getElement<HTMLInputElement>(`[data-action="${action}"]`).checked = checked
}

function setNumberValue(control: string, value: number) {
  getElement<HTMLInputElement>(`[data-control="${control}"]`).value = formatNumber(value)
}

function setDisabled(selector: string, disabled: boolean) {
  getElement<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>(selector).disabled = disabled
}

function isPreviewTab(value: string | undefined): value is PreviewTab {
  return previewTabs.some((tab) => tab.value === value)
}

function isDebugTab(value: string | undefined): value is DebugTab {
  return debugTabs.some((tab) => tab.value === value)
}

function isObjPreviewMode(value: string): value is ObjPreviewMode {
  return value === "points" || value === "wireframe" || value === "points_wireframe"
}

function isRealtimeMode(value: string): value is RealtimeMode {
  return value === "current_analysis_only" || value === "current_analysis_obj_render"
}

function isVideoFileInput() {
  return state.liveInput.sourceType === "video_file" && state.liveVideo.loaded
}

function isCameraInput() {
  return state.liveInput.sourceType === "camera" && state.liveVideo.loaded
}

function isRealtimeTargetFps(value: number): value is typeof REALTIME_TARGET_FPS_OPTIONS[number] {
  return REALTIME_TARGET_FPS_OPTIONS.some((fps) => fps === value)
}

function isRenderedIdealBackgroundMode(value: string): value is RenderedIdealBackgroundMode {
  return value === "light" || value === "dark"
}

function isRenderedIdealColorMode(value: string): value is RenderedIdealColorMode {
  return value === "clay" || value === "grayscale"
}

function formatTimeStatus(videoState: LiveVideoState) {
  if (!videoState.loaded) {
    return "現在時刻: - / -"
  }
  return `現在時刻: ${formatSeconds(videoState.currentTimeSec)} / ${formatSeconds(videoState.durationSec)}`
}

function formatVideoSize() {
  return state.liveVideo.width === null || state.liveVideo.height === null
    ? "-"
    : `${state.liveVideo.width} x ${state.liveVideo.height}`
}

function formatLiveInputSourceLabel(sourceType: LiveInputSourceType | null) {
  if (sourceType === "video_file") {
    return "MP4ファイル"
  }
  if (sourceType === "camera") {
    return "カメラ"
  }
  return "未選択"
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

function formatNullableNumber(value: number | null) {
  return value === null || !Number.isFinite(value) ? "null" : formatNumber(value)
}

function formatBounds(bounds: ObjBounds | null) {
  if (!bounds) {
    return "null"
  }
  return `min(${formatNumber(bounds.minX)}, ${formatNumber(bounds.minY)}, ${formatNumber(bounds.minZ)}) / max(${formatNumber(bounds.maxX)}, ${formatNumber(bounds.maxY)}, ${formatNumber(bounds.maxZ)})`
}

function formatPoint(point: { x: number; y: number; z: number } | null) {
  if (!point) {
    return "null"
  }
  return `x=${formatNumber(point.x)}, y=${formatNumber(point.y)}, z=${formatNumber(point.z)}`
}

function formatStringList(values: string[]) {
  if (values.length === 0) {
    return "[]"
  }
  return values.join("\n")
}

function formatPose(pose: ReferencePose) {
  return `yaw ${formatNullableNumber(pose.yaw)} / pitch ${formatNullableNumber(pose.pitch)} / roll ${formatNullableNumber(pose.roll)}`
}

function formatPoseCenterSearchMode(mode: PoseCenterSearchMode) {
  return mode === "multi_frame" ? "複数姿勢" : "現在フレーム"
}

function formatAppliedObjPose() {
  return `yaw ${formatNullableNumber(state.objPoseSync.appliedYawDeg)} / pitch ${formatNullableNumber(state.objPoseSync.appliedPitchDeg)} / roll ${formatNullableNumber(state.objPoseSync.appliedRollDeg)}`
}

function formatPoseCenterSearchBestRotationCenter() {
  const best = state.poseCenterSearch.bestCandidate
  if (!best) {
    return "null"
  }
  return `x=${formatNumber(best.rotationCenterX)}, y=${formatNumber(best.rotationCenterY)}, z=${formatNumber(best.rotationCenterZ)}`
}

function formatObjPoseCalibrationBestRotationCenter() {
  const best = state.objPoseCalibration.bestCandidate
  if (!best) {
    return "null"
  }
  return `x=${formatNumber(best.rotationCenterX)}, y=${formatNumber(best.rotationCenterY)}, z=${formatNumber(best.rotationCenterZ)}`
}

function formatObjPoseCalibrationTopCandidatesText() {
  if (state.objPoseCalibration.topCandidates.length === 0) {
    return "[]"
  }

  return state.objPoseCalibration.topCandidates
    .map((candidate, index) =>
      `${index + 1}. x=${formatNumber(candidate.rotationCenterX)}, y=${formatNumber(candidate.rotationCenterY)}, z=${formatNumber(candidate.rotationCenterZ)}, score=${formatNullableNumber(candidate.score)}, avg=${formatNullableNumber(candidate.averagePoseError)}, max=${formatNullableNumber(candidate.maxPoseError)}, failedPoses=${candidate.failedPoseCount}`,
    )
    .join("\n")
}

function formatPoseCenterSearchTopCandidatesText() {
  if (state.poseCenterSearch.topCandidates.length === 0) {
    return "[]"
  }

  return state.poseCenterSearch.topCandidates
    .map((candidate, index) =>
      `${index + 1}. x=${formatNumber(candidate.rotationCenterX)}, y=${formatNumber(candidate.rotationCenterY)}, z=${formatNumber(candidate.rotationCenterZ)}, score=${formatNullableNumber(candidate.score)}, avg=${formatNullableNumber(candidate.averagePoseError)}, max=${formatNullableNumber(candidate.maxPoseError)}, failedFrames=${candidate.failedFrameCount}`,
    )
    .join("\n")
}

function formatPoseErrorTriple(yaw: number | null, pitch: number | null, roll: number | null) {
  return `yaw ${formatNullableNumber(yaw)} / pitch ${formatNullableNumber(pitch)} / roll ${formatNullableNumber(roll)}`
}

function formatPoseCenterSearchFrameResultsText(results: PoseCenterSearchFrameResult[]) {
  if (results.length === 0) {
    return "[]"
  }
  return results
    .map((result) =>
      `${result.frameLabel}: current ${formatPose(result.currentPose)} / rendered ${formatPose(result.renderedPose)} / poseError ${formatNullableNumber(result.poseError)}`,
    )
    .join("\n")
}

function formatObjPoseCalibrationPoseResultsText(results: ObjPoseCalibrationPoseResult[]) {
  if (results.length === 0) {
    return "[]"
  }
  return results
    .map((result) =>
      `${result.poseLabel}: expected ${formatPose(result.expectedPose)} / returned ${formatPose(result.returnedPose)} / poseError ${formatNullableNumber(result.poseError)} / detected ${String(result.detected)}`,
    )
    .join("\n")
}

function getPoseCenterSearchApplyMessage() {
  if (state.poseCenterSearch.appliedBestAutomatically) {
    return "bestを自動適用済み"
  }
  if (state.poseCenterSearch.appliedBestManually) {
    const sourceMode = state.poseCenterSearch.appliedBestSourceMode
      ? ` / ${formatPoseCenterSearchMode(state.poseCenterSearch.appliedBestSourceMode)}`
      : ""
    return `bestを手動適用済み${sourceMode}`
  }
  if (state.poseCenterSearch.bestCandidate) {
    return "bestは自動適用しません。bestを適用ボタンで反映します。"
  }
  return "best未検出"
}

function formatExpressionSummary(summary: ExpressionSummary | null) {
  if (!summary) {
    return "not_ready"
  }

  const top = summary.topBlendshapes
    .map((item) => `${item.categoryName}:${formatNumber(item.score)}`)
    .join(" / ")
  const missing = summary.missingBlendshapeKeys.length > 0
    ? ` / missing ${summary.missingBlendshapeKeys.join(",")}`
    : ""
  return `${summary.group}${top ? ` / ${top}` : ""}${missing}`
}

function formatQualitySummary(summary: QualitySummary) {
  return `${summary.status} / landmarks ${summary.landmarkCount}/${summary.expectedLandmarkCount} / pose ${summary.hasPose ? "available" : "missing"}`
}

function formatRealtimeStatus(status: RealtimeStatus) {
  if (status === "idle") {
    return "未開始"
  }
  if (status === "running") {
    return "実行中"
  }
  if (status === "stopped") {
    return "停止"
  }
  return "エラー"
}

function formatRealtimeNullableNumber(value: number | null) {
  return value === null || !Number.isFinite(value) ? "未計測" : formatNumber(value)
}

function formatRealtimeObjRenderMs() {
  return state.realtimeDebug.mode === "current_analysis_only"
    ? "未実行"
    : formatRealtimeNullableNumber(state.realtimeDebug.objRenderMs)
}

function formatRealtimeAverageObjRenderMs() {
  return state.realtimeDebug.mode === "current_analysis_only"
    ? "未実行"
    : formatRealtimeNullableNumber(state.realtimeDebug.averageObjRenderMs)
}

function getRealtimeJudgement() {
  if (state.realtimeDebug.status === "error") {
    return "エラー"
  }
  const effectiveFps = state.realtimeDebug.effectiveFps
  if (effectiveFps === null || !Number.isFinite(effectiveFps)) {
    return "未計測"
  }
  if (effectiveFps >= 15) {
    return "良好"
  }
  if (effectiveFps >= 10) {
    return "警告"
  }
  return "厳しい"
}

function getRealtimeBottleneck() {
  const breakdown = state.realtimeDebug.currentAnalysisTimingBreakdown
  const candidates: Array<[string, number | null]> = [
    ["MediaPipe検出", breakdown.mediaPipeDetectMs],
    ["解析結果整形", breakdown.buildCurrentAnalysisMs],
    ["OBJレンダー", state.realtimeDebug.objRenderMs],
    ["ライブ重ね描画", breakdown.liveOverlayDrawMs],
    ["デバッグ更新", breakdown.debugUpdateMs],
  ]
  const measuredCandidates = candidates.filter((candidate): candidate is [string, number] =>
    candidate[1] !== null && Number.isFinite(candidate[1]),
  )
  if (measuredCandidates.length === 0) {
    return "未判定"
  }
  return measuredCandidates.reduce((largest, current) =>
    current[1] > largest[1] ? current : largest,
  )[0]
}

function getDebugExportPreview() {
  const debugExport = buildDebugExport()
  return {
    schemaVersion: debugExport.schemaVersion,
    createdAt: debugExport.createdAt,
    environment: debugExport.environment,
    input: debugExport.input,
    mediaPipeOptions: debugExport.mediaPipeOptions,
    realtime: debugExport.realtime,
    renderedIdealDetection: debugExport.renderedIdealDetection,
    objPoseCalibration: debugExport.objPoseCalibration,
    notes: debugExport.notes,
  }
}

function getCurrentLiveMediaPipeOptionsDebug() {
  return {
    runningMode: "VIDEO",
    numFaces: 1,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
    delegate: "GPU",
    modelAssetPath: MEDIAPIPE_FACE_LANDMARKER_MODEL_ASSET_PATH,
    wasmPath: MEDIAPIPE_WASM_PATH,
  }
}

function getRenderedIdealMediaPipeOptionsDebug() {
  return {
    runningMode: "IMAGE",
    numFaces: 1,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
    delegate: "GPU",
    modelAssetPath: MEDIAPIPE_FACE_LANDMARKER_MODEL_ASSET_PATH,
    wasmPath: MEDIAPIPE_WASM_PATH,
  }
}

function getRenderedIdealDetectionDebugExport() {
  const detection = getRenderedIdealDetectionRawSummary()
  return {
    status: detection.status,
    detectMs: detection.detectMs,
    averageDetectMs: detection.averageDetectMs,
    landmarkCount: detection.landmarkCount,
    renderSeq: detection.renderSeq,
    detectedRenderSeq: detection.detectedRenderSeq,
    requestCount: detection.requestCount,
    startedCount: detection.startedCount,
    completedCount: detection.completedCount,
    droppedCount: detection.droppedCount,
    errorCount: detection.errorCount,
    skippedByPoseSearchCount: detection.skippedByPoseSearchCount,
    pose: detection.pose,
  }
}

function getObjPoseCalibrationDebugExport() {
  return {
    status: state.objPoseCalibration.status,
    poseCount: state.objPoseCalibration.poseCount,
    candidateCount: state.objPoseCalibration.candidateCount,
    totalEvaluationCount: state.objPoseCalibration.totalEvaluationCount,
    evaluatedCandidateCount: state.objPoseCalibration.evaluatedCandidateCount,
    evaluatedPoseCount: state.objPoseCalibration.evaluatedPoseCount,
    failedCandidateCount: state.objPoseCalibration.failedCandidateCount,
    failedPoseEvaluationCount: state.objPoseCalibration.failedPoseEvaluationCount,
    elapsedMs: roundForState(state.objPoseCalibration.elapsedMs),
    estimatedRemainingMs: roundForState(state.objPoseCalibration.estimatedRemainingMs),
    bestCandidate: state.objPoseCalibration.bestCandidate
      ? roundObjPoseCalibrationCandidateForExport(state.objPoseCalibration.bestCandidate)
      : null,
    topCandidates: state.objPoseCalibration.topCandidates.map(roundObjPoseCalibrationCandidateForExport),
    errorMessage: state.objPoseCalibration.errorMessage,
  }
}

function getPoseCenterSearchDebugExport() {
  return {
    mode: state.poseCenterSearch.mode,
    status: state.poseCenterSearch.status,
    frameCount: state.poseCenterSearch.frameCount,
    candidateCount: state.poseCenterSearch.candidateCount,
    totalEvaluationCount: state.poseCenterSearch.totalEvaluationCount,
    evaluatedCandidateCount: state.poseCenterSearch.evaluatedCandidateCount,
    evaluatedFrameCount: state.poseCenterSearch.evaluatedFrameCount,
    failedCandidateCount: state.poseCenterSearch.failedCandidateCount,
    failedFrameEvaluationCount: state.poseCenterSearch.failedFrameEvaluationCount,
    elapsedMs: roundForState(state.poseCenterSearch.elapsedMs),
    estimatedRemainingMs: roundForState(state.poseCenterSearch.estimatedRemainingMs),
    currentPose: roundPoseForState(state.poseCenterSearch.currentPose),
    bestCandidate: state.poseCenterSearch.bestCandidate
      ? roundPoseCenterSearchCandidateForExport(state.poseCenterSearch.bestCandidate)
      : null,
    topCandidates: state.poseCenterSearch.topCandidates.map(roundPoseCenterSearchCandidateForExport),
    appliedBestAutomatically: state.poseCenterSearch.appliedBestAutomatically,
    appliedBestManually: state.poseCenterSearch.appliedBestManually,
    appliedBestSourceMode: state.poseCenterSearch.appliedBestSourceMode,
    errorMessage: state.poseCenterSearch.errorMessage,
  }
}

function getEnvironmentDebugExport() {
  const webglInfo = getWebglInfo()
  return {
    userAgent: navigator.userAgent,
    devicePixelRatio: window.devicePixelRatio || 1,
    hardwareConcurrency: Number.isFinite(navigator.hardwareConcurrency)
      ? navigator.hardwareConcurrency
      : null,
    crossOriginIsolated: typeof window.crossOriginIsolated === "boolean"
      ? window.crossOriginIsolated
      : null,
    webglAvailable: webglInfo.available,
    webglRenderer: webglInfo.renderer,
    webglVendor: webglInfo.vendor,
  }
}

function getWebglInfo() {
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl")
  if (!context) {
    return {
      available: false,
      renderer: null,
      vendor: null,
    }
  }
  const debugInfo = context.getExtension("WEBGL_debug_renderer_info")
  return {
    available: true,
    renderer: debugInfo
      ? String(context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
      : String(context.getParameter(context.RENDERER)),
    vendor: debugInfo
      ? String(context.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL))
      : String(context.getParameter(context.VENDOR)),
  }
}

function formatNumber(value: number) {
  return Number(value.toFixed(6)).toString()
}

function formatUpdatedAt() {
  return new Date().toLocaleTimeString("ja-JP", { hour12: false })
}

function sumNullableTimings(...values: Array<number | null>) {
  const measuredValues = values.filter((value): value is number =>
    value !== null && Number.isFinite(value),
  )
  if (measuredValues.length === 0) {
    return null
  }
  return measuredValues.reduce((sum, value) => sum + value, 0)
}

function averageNullableTiming(values: Array<number | null>) {
  const measuredValues = values.filter((value): value is number =>
    value !== null && Number.isFinite(value),
  )
  if (measuredValues.length === 0) {
    return null
  }
  return measuredValues.reduce((sum, value) => sum + value, 0) / measuredValues.length
}

function averageNumbers(values: number[]) {
  const finiteValues = values.filter((value) => Number.isFinite(value))
  if (finiteValues.length === 0) {
    return null
  }
  return finiteValues.reduce((sum, value) => sum + value, 0) / finiteValues.length
}

function maxNumbers(values: number[]) {
  const finiteValues = values.filter((value) => Number.isFinite(value))
  if (finiteValues.length === 0) {
    return null
  }
  return Math.max(...finiteValues)
}

function sumNumbers(values: Array<number | null>) {
  const finiteValues = values.filter((value): value is number =>
    value !== null && Number.isFinite(value),
  )
  if (finiteValues.length === 0) {
    return null
  }
  return finiteValues.reduce((sum, value) => sum + value, 0)
}

function getRealtimePlaybackNote() {
  if (!state.liveVideo.loaded) {
    return ""
  }
  if (state.realtimeDebug.status === "running" && state.liveVideo.playbackStatus !== "playing") {
    return "ライブ動画が停止中のため、現在表示中のフレームを繰り返し解析しています。"
  }
  if (state.liveVideo.playbackStatus !== "playing") {
    return "ライブ動画が停止中です。再生してから開始してください。"
  }
  return ""
}

function formatSeconds(value: number | null) {
  return value === null || !Number.isFinite(value) ? "-" : `${value.toFixed(3)} sec`
}

function roundForState(value: number | null) {
  return value === null || !Number.isFinite(value) ? value : Number(value.toFixed(6))
}

function roundPointForState(point: ObjVertex): ObjVertex {
  return {
    x: roundForState(point.x) ?? 0,
    y: roundForState(point.y) ?? 0,
    z: roundForState(point.z) ?? 0,
  }
}

function roundLandmarkForState(landmark: ReferenceLandmark): ReferenceLandmark {
  return {
    index: landmark.index,
    x: roundForState(landmark.x) ?? 0,
    y: roundForState(landmark.y) ?? 0,
    z: roundForState(landmark.z) ?? 0,
  }
}

function roundPoseForState(pose: ReferencePose): ReferencePose {
  return {
    yaw: roundForState(pose.yaw),
    pitch: roundForState(pose.pitch),
    roll: roundForState(pose.roll),
  }
}

function roundPoseCenterSearchCandidate(candidate: PoseCenterSearchCandidate): PoseCenterSearchCandidate {
  return {
    rotationCenterX: roundForState(candidate.rotationCenterX) ?? 0,
    rotationCenterY: roundForState(candidate.rotationCenterY) ?? 0,
    rotationCenterZ: roundForState(candidate.rotationCenterZ) ?? 0,
    score: roundForState(candidate.score),
    averagePoseError: roundForState(candidate.averagePoseError),
    maxPoseError: roundForState(candidate.maxPoseError),
    yawErrorAvg: roundForState(candidate.yawErrorAvg),
    pitchErrorAvg: roundForState(candidate.pitchErrorAvg),
    rollErrorAvg: roundForState(candidate.rollErrorAvg),
    yawErrorMax: roundForState(candidate.yawErrorMax),
    pitchErrorMax: roundForState(candidate.pitchErrorMax),
    rollErrorMax: roundForState(candidate.rollErrorMax),
    failedFrameCount: candidate.failedFrameCount,
    frameResultsPreview: candidate.frameResultsPreview.map(roundPoseCenterSearchFrameResult),
    yawError: roundForState(candidate.yawError),
    pitchError: roundForState(candidate.pitchError),
    rollError: roundForState(candidate.rollError),
    renderedPose: roundPoseForState(candidate.renderedPose),
    detected: candidate.detected,
    detectMs: roundForState(candidate.detectMs),
    errorMessage: candidate.errorMessage,
  }
}

function roundObjPoseCalibrationCandidate(
  candidate: ObjPoseCalibrationCandidate,
): ObjPoseCalibrationCandidate {
  return {
    rotationCenterX: roundForState(candidate.rotationCenterX) ?? 0,
    rotationCenterY: roundForState(candidate.rotationCenterY) ?? 0,
    rotationCenterZ: roundForState(candidate.rotationCenterZ) ?? 0,
    score: roundForState(candidate.score),
    averagePoseError: roundForState(candidate.averagePoseError),
    maxPoseError: roundForState(candidate.maxPoseError),
    yawErrorAvg: roundForState(candidate.yawErrorAvg),
    pitchErrorAvg: roundForState(candidate.pitchErrorAvg),
    rollErrorAvg: roundForState(candidate.rollErrorAvg),
    yawErrorMax: roundForState(candidate.yawErrorMax),
    pitchErrorMax: roundForState(candidate.pitchErrorMax),
    rollErrorMax: roundForState(candidate.rollErrorMax),
    failedPoseCount: candidate.failedPoseCount,
    poseResultsPreview: candidate.poseResultsPreview.map(roundObjPoseCalibrationPoseResult),
    detectMsTotal: roundForState(candidate.detectMsTotal),
    errorMessage: candidate.errorMessage,
  }
}

function roundObjPoseCalibrationCandidateForExport(candidate: ObjPoseCalibrationCandidate) {
  return {
    rotationCenterX: roundForState(candidate.rotationCenterX),
    rotationCenterY: roundForState(candidate.rotationCenterY),
    rotationCenterZ: roundForState(candidate.rotationCenterZ),
    score: roundForState(candidate.score),
    averagePoseError: roundForState(candidate.averagePoseError),
    maxPoseError: roundForState(candidate.maxPoseError),
    yawErrorAvg: roundForState(candidate.yawErrorAvg),
    pitchErrorAvg: roundForState(candidate.pitchErrorAvg),
    rollErrorAvg: roundForState(candidate.rollErrorAvg),
    yawErrorMax: roundForState(candidate.yawErrorMax),
    pitchErrorMax: roundForState(candidate.pitchErrorMax),
    rollErrorMax: roundForState(candidate.rollErrorMax),
    failedPoseCount: candidate.failedPoseCount,
    detectMsTotal: roundForState(candidate.detectMsTotal),
    errorMessage: candidate.errorMessage,
  }
}

function roundPoseCenterSearchCandidateForExport(candidate: PoseCenterSearchCandidate) {
  return {
    rotationCenterX: roundForState(candidate.rotationCenterX),
    rotationCenterY: roundForState(candidate.rotationCenterY),
    rotationCenterZ: roundForState(candidate.rotationCenterZ),
    score: roundForState(candidate.score),
    averagePoseError: roundForState(candidate.averagePoseError),
    maxPoseError: roundForState(candidate.maxPoseError),
    yawErrorAvg: roundForState(candidate.yawErrorAvg),
    pitchErrorAvg: roundForState(candidate.pitchErrorAvg),
    rollErrorAvg: roundForState(candidate.rollErrorAvg),
    yawErrorMax: roundForState(candidate.yawErrorMax),
    pitchErrorMax: roundForState(candidate.pitchErrorMax),
    rollErrorMax: roundForState(candidate.rollErrorMax),
    failedFrameCount: candidate.failedFrameCount,
    frameResultsPreview: candidate.frameResultsPreview.map(roundPoseCenterSearchFrameResult),
    yawError: roundForState(candidate.yawError),
    pitchError: roundForState(candidate.pitchError),
    rollError: roundForState(candidate.rollError),
    renderedPose: roundPoseForState(candidate.renderedPose),
    detected: candidate.detected,
    detectMs: roundForState(candidate.detectMs),
    errorMessage: candidate.errorMessage,
  }
}

function roundPoseCenterSearchFrame(frame: PoseCenterSearchFrame): PoseCenterSearchFrame {
  return {
    ...frame,
    timeSec: roundForState(frame.timeSec),
    currentPose: {
      yaw: roundForState(frame.currentPose.yaw) ?? 0,
      pitch: roundForState(frame.currentPose.pitch) ?? 0,
      roll: roundForState(frame.currentPose.roll) ?? 0,
    },
    qualityScore: roundForState(frame.qualityScore),
  }
}

function roundPoseCenterSearchFrameResult(
  result: PoseCenterSearchFrameResult,
): PoseCenterSearchFrameResult {
  return {
    ...result,
    timeSec: roundForState(result.timeSec),
    currentPose: {
      yaw: roundForState(result.currentPose.yaw) ?? 0,
      pitch: roundForState(result.currentPose.pitch) ?? 0,
      roll: roundForState(result.currentPose.roll) ?? 0,
    },
    renderedPose: roundPoseForState(result.renderedPose),
    poseError: roundForState(result.poseError),
    yawError: roundForState(result.yawError),
    pitchError: roundForState(result.pitchError),
    rollError: roundForState(result.rollError),
    detectMs: roundForState(result.detectMs),
  }
}

function roundObjPoseCalibrationPoseResult(
  result: ObjPoseCalibrationPoseResult,
): ObjPoseCalibrationPoseResult {
  return {
    ...result,
    expectedPose: {
      yaw: roundForState(result.expectedPose.yaw) ?? 0,
      pitch: roundForState(result.expectedPose.pitch) ?? 0,
      roll: roundForState(result.expectedPose.roll) ?? 0,
    },
    returnedPose: roundPoseForState(result.returnedPose),
    poseError: roundForState(result.poseError),
    yawError: roundForState(result.yawError),
    pitchError: roundForState(result.pitchError),
    rollError: roundForState(result.rollError),
    detectMs: roundForState(result.detectMs),
  }
}

function roundBlendshapeForState(blendshape: ReferenceBlendshape): ReferenceBlendshape {
  return {
    categoryName: blendshape.categoryName,
    score: roundForState(blendshape.score) ?? 0,
  }
}

function getRoundedObjPreviewState() {
  return {
    yawDeg: roundForState(state.objPreview.yawDeg),
    pitchDeg: roundForState(state.objPreview.pitchDeg),
    rollDeg: roundForState(state.objPreview.rollDeg),
    zoom: roundForState(state.objPreview.zoom),
    panX: roundForState(state.objPreview.panX),
    panY: roundForState(state.objPreview.panY),
    mode: state.objPreview.mode,
    maxPoints: state.objPreview.maxPoints,
    maxEdges: state.objPreview.maxEdges,
  }
}

function getRoundedObjPoseSyncState() {
  return {
    enabled: state.objPoseSync.enabled,
    yawSign: state.objPoseSync.yawSign,
    pitchSign: state.objPoseSync.pitchSign,
    rollSign: state.objPoseSync.rollSign,
    yawOffsetDeg: roundForState(state.objPoseSync.yawOffsetDeg),
    pitchOffsetDeg: roundForState(state.objPoseSync.pitchOffsetDeg),
    rollOffsetDeg: roundForState(state.objPoseSync.rollOffsetDeg),
    rotationCenterX: roundForState(state.objPoseSync.rotationCenterX),
    rotationCenterY: roundForState(state.objPoseSync.rotationCenterY),
    rotationCenterZ: roundForState(state.objPoseSync.rotationCenterZ),
    appliedYawDeg: roundForState(state.objPoseSync.appliedYawDeg),
    appliedPitchDeg: roundForState(state.objPoseSync.appliedPitchDeg),
    appliedRollDeg: roundForState(state.objPoseSync.appliedRollDeg),
    source: state.objPoseSync.source,
  }
}

function getRoundedRealtimeDebugState(): RealtimeDebugState {
  return {
    ...state.realtimeDebug,
    currentAnalysisMs: roundForState(state.realtimeDebug.currentAnalysisMs),
    objRenderMs: roundForState(state.realtimeDebug.objRenderMs),
    mediaPipeRedetectMs: roundForState(state.realtimeDebug.mediaPipeRedetectMs),
    totalMs: roundForState(state.realtimeDebug.totalMs),
    currentAnalysisTimingBreakdown: roundCurrentAnalysisTimingBreakdown(
      state.realtimeDebug.currentAnalysisTimingBreakdown,
    ),
    averageCurrentAnalysisTimingBreakdown: roundCurrentAnalysisTimingBreakdown(
      state.realtimeDebug.averageCurrentAnalysisTimingBreakdown,
    ),
    averageObjRenderMs: roundForState(state.realtimeDebug.averageObjRenderMs),
    averageTotalMs: roundForState(state.realtimeDebug.averageTotalMs),
    effectiveFps: roundForState(state.realtimeDebug.effectiveFps),
    videoFrameMetadataMediaTime: roundForState(state.realtimeDebug.videoFrameMetadataMediaTime),
    videoFrameTimestampMs: roundForState(state.realtimeDebug.videoFrameTimestampMs),
    lastVideoFrameMediaTimeSec: roundForState(state.realtimeDebug.lastVideoFrameMediaTimeSec),
    lastVideoFrameTimestampMs: roundForState(state.realtimeDebug.lastVideoFrameTimestampMs),
  }
}

function roundCurrentAnalysisTimingBreakdown(
  breakdown: CurrentAnalysisTimingBreakdown,
): CurrentAnalysisTimingBreakdown {
  return {
    mediaPipeDetectMs: roundForState(breakdown.mediaPipeDetectMs),
    buildCurrentAnalysisMs: roundForState(breakdown.buildCurrentAnalysisMs),
    liveOverlayDrawMs: roundForState(breakdown.liveOverlayDrawMs),
    debugUpdateMs: roundForState(breakdown.debugUpdateMs),
    currentAnalysisTotalMs: roundForState(breakdown.currentAnalysisTotalMs),
  }
}

function getObjPoseSyncRotationCenter(): ObjVertex {
  return {
    x: state.objPoseSync.rotationCenterX,
    y: state.objPoseSync.rotationCenterY,
    z: state.objPoseSync.rotationCenterZ,
  }
}

function getObjPoseSyncPreviewState(poseOverride: ReferencePose | null = null): ObjPreviewState {
  const pose = poseOverride
    ? {
      yaw: (poseOverride.yaw ?? 0) * state.objPoseSync.yawSign + state.objPoseSync.yawOffsetDeg,
      pitch: (poseOverride.pitch ?? 0) * state.objPoseSync.pitchSign + state.objPoseSync.pitchOffsetDeg,
      roll: (poseOverride.roll ?? 0) * state.objPoseSync.rollSign + state.objPoseSync.rollOffsetDeg,
    }
    : {
      yaw: state.objPoseSync.appliedYawDeg,
      pitch: state.objPoseSync.appliedPitchDeg,
      roll: state.objPoseSync.appliedRollDeg,
    }
  return {
    ...state.objPreview,
    yawDeg: pose.yaw ?? 0,
    pitchDeg: pose.pitch ?? 0,
    rollDeg: pose.roll ?? 0,
    zoom: 1,
    panX: 0,
    panY: 0,
    mode: "wireframe",
  }
}

function calculateObjPreviewStats(previewState: ObjPreviewState): ObjPreviewStats {
  return {
    sampledPointCount:
      previewState.mode === "wireframe"
        ? 0
        : getSampledCount(state.objGeometry.vertices.length, previewState.maxPoints),
    sampledEdgeCount:
      previewState.mode === "points"
        ? 0
        : getSampledCount(state.objGeometry.edges.length, previewState.maxEdges),
  }
}

function getSampleStep(total: number, maxCount: number) {
  if (total <= 0) {
    return 1
  }
  return Math.max(1, Math.ceil(total / Math.max(1, maxCount)))
}

function getSampledCount(total: number, maxCount: number) {
  if (total <= 0) {
    return 0
  }
  return Math.ceil(total / getSampleStep(total, maxCount))
}

function getObjCanvasScale(canvas: HTMLCanvasElement = objPreviewCanvas) {
  const rect = canvas.getBoundingClientRect()
  return Math.max(1, Math.min(rect.width, rect.height) * 0.42)
}

function hasFullPose(pose: ReferencePose) {
  return pose.yaw !== null && pose.pitch !== null && pose.roll !== null
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180
}

function normalizeDegrees(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }
  return ((value + 180) % 360 + 360) % 360 - 180
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function calculateFaceNormal(vertices: ObjVertex[]): ObjVertex | null {
  const a = vertices[0]
  for (let bIndex = 1; bIndex < vertices.length - 1; bIndex += 1) {
    const b = vertices[bIndex]
    const c = vertices[bIndex + 1]
    const normal = normalizeVector(crossVector(subtractVector(b, a), subtractVector(c, a)))
    if (normal.x !== 0 || normal.y !== 0 || normal.z !== 0) {
      return normal
    }
  }
  return null
}

function orientNormalToCamera(normal: ObjVertex | null): ObjVertex | null {
  if (!normal) {
    return null
  }
  return normal.z < 0 ? { x: -normal.x, y: -normal.y, z: -normal.z } : normal
}

function subtractVector(a: ObjVertex, b: ObjVertex): ObjVertex {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  }
}

function crossVector(a: ObjVertex, b: ObjVertex): ObjVertex {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  }
}

function dotVector(a: ObjVertex, b: ObjVertex) {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

function normalizeVector(vector: ObjVertex): ObjVertex {
  const length = Math.hypot(vector.x, vector.y, vector.z)
  if (!Number.isFinite(length) || length <= 0) {
    return { x: 0, y: 0, z: 0 }
  }

  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  }
}

function getRenderedIdealFaceColor(brightness: number) {
  const base = state.renderedIdeal.colorMode === "grayscale"
    ? { r: 184, g: 188, b: 192 }
    : { r: 205, g: 177, b: 151 }
  return rgbToCss({
    r: Math.round(base.r * brightness),
    g: Math.round(base.g * brightness),
    b: Math.round(base.b * brightness),
  })
}

function getRenderedIdealFaceStrokeColor(brightness: number) {
  const alpha = state.renderedIdeal.backgroundMode === "dark" ? 0.38 : 0.18
  const channel = Math.round(40 + 60 * brightness)
  return `rgba(${channel}, ${channel}, ${channel}, ${alpha})`
}

function rgbToCss(color: { r: number; g: number; b: number }) {
  return `rgb(${clamp(color.r, 0, 255)}, ${clamp(color.g, 0, 255)}, ${clamp(color.b, 0, 255)})`
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}
