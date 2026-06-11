import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision"
import type { Matrix, NormalizedLandmark } from "@mediapipe/tasks-vision"
import "./style.css"

type PreviewTab = "obj" | "renderedIdeal" | "live"
type DebugTab =
  | "summary"
  | "current"
  | "obj"
  | "renderedIdeal"
  | "objPoseCalibration"
  | "realtime"
  | "modeComparison"
  | "warpMesh"
  | "raw"
type PlaybackStatus = "stopped" | "playing" | "paused"
type ObjParseStatus = "not_loaded" | "not_parsed" | "parsed" | "error"
type ObjPreviewMode = "points" | "wireframe" | "points_wireframe"
type ObjPreviewStatus = "not_ready" | "ready" | "error"
type RenderedIdealRenderStatus = "not_ready" | "ready" | "rendered" | "error"
type RenderedIdealDetectionStatus = "idle" | "detecting" | "detected" | "not_detected" | "error"
type RenderedIdealRenderMode = "shaded_faces"
type RenderedIdealBackgroundMode = "light" | "dark"
type RenderedIdealColorMode = "clay" | "grayscale"

type ObjRenderAppearanceProfileId =
  | "current"
  | "soft_light_no_shadow"
  | "camera_soft_light"
  | "high_contrast_background"
  | "yaw_edge_friendly"
  | "stable_crop_fov"

type ObjRenderAppearanceProfile = {
  id: ObjRenderAppearanceProfileId
  label: string
  description: string
  backgroundColor: string
  skinColor: string
  material: {
    mode: "matte" | "flat" | "lambert"
    diffuse: number
    ambient: number
    specular: number
  }
  lighting: {
    mode: "none" | "camera_front" | "fixed_directional" | "dual_soft"
    ambientIntensity: number
    keyLightIntensity: number
    fillLightIntensity?: number
    rimLightIntensity?: number
    keyLightDirection?: { x: number; y: number; z: number }
    fillLightDirection?: { x: number; y: number; z: number }
    rimLightDirection?: { x: number; y: number; z: number }
    castShadow: boolean
  }
  camera: {
    projection: "perspective" | "orthographic_like"
    fovDeg: number
    scale: number
    verticalOffset: number
  }
  renderResolution: {
    width: number
    height: number
  }
  notes?: string
}

type AppliedObjRenderAppearanceProfile = ObjRenderAppearanceProfile & {
  implementation: {
    backgroundColor: true
    skinColor: true
    materialMode: true
    diffuse: true
    ambient: true
    specular: false
    lightingMode: true
    castShadow: false
    projection: false
    fovDeg: false
    scale: true
    verticalOffset: true
    renderResolution: true
    notes: string[]
  }
}
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
  renderAppearanceProfileId: ObjRenderAppearanceProfileId
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

type ObjPoseSamplingPresetName = "quick" | "standard" | "dense"

type ObjPoseSamplingRange = {
  min: number
  max: number
  step: number
}

type ObjPoseSamplingPreset = {
  preset: ObjPoseSamplingPresetName
  yaw: ObjPoseSamplingRange
  pitch: ObjPoseSamplingRange
  roll: ObjPoseSamplingRange
}

type ObjPoseCalibrationPoseResult = {
  poseId: string
  poseLabel: string
  basePose: {
    yaw: number
    pitch: number
    roll: number
  }
  renderPoseOffset: {
    yawDeg: number
    pitchDeg: number
    rollDeg: number
  }
  renderPose: {
    yaw: number
    pitch: number
    roll: number
  }
  expectedPoseForComparison: {
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
  renderPoseOffset: {
    yawDeg: number
    pitchDeg: number
    rollDeg: number
  }
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

type ObjPoseCalibrationPoseWiseBestCandidate = {
  rotationCenterX: number
  rotationCenterY: number
  rotationCenterZ: number
  renderPoseOffset: {
    yawDeg: number
    pitchDeg: number
    rollDeg: number
  }
  renderPose: {
    yaw: number
    pitch: number
    roll: number
  }
  expectedPoseForComparison: {
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

type ObjPoseCalibrationPoseWiseTopCandidate = {
  rank: number
  rotationCenterX: number
  rotationCenterY: number
  rotationCenterZ: number
  renderPoseOffset: {
    yawDeg: number
    pitchDeg: number
    rollDeg: number
  }
  poseError: number | null
  yawError: number | null
  pitchError: number | null
  rollError: number | null
  returnedPose: {
    yaw: number | null
    pitch: number | null
    roll: number | null
  }
  detected: boolean
}

type ObjPoseCalibrationPoseWiseBest = {
  poseId: string
  poseLabel: string
  basePose: {
    yaw: number
    pitch: number
    roll: number
  }
  bestCandidate: ObjPoseCalibrationPoseWiseBestCandidate | null
  topCandidates: ObjPoseCalibrationPoseWiseTopCandidate[]
}

type ObjPoseCalibrationPoseWiseGroupSummary = {
  groupId: string
  label: string
  poseIds: string[]
  averageBestPoseError: number | null
  averageBestYawError: number | null
  averageBestPitchError: number | null
  averageBestRollError: number | null
  rotationCenterYRange: {
    min: number | null
    max: number | null
  }
  rotationCenterZRange: {
    min: number | null
    max: number | null
  }
  pitchOffsetDegRange: {
    min: number | null
    max: number | null
  }
}

type ObjPoseCalibrationPosePairSummary = {
  pairId: string
  label: string
  negativePoseId: string
  positivePoseId: string
  negativeBest: {
    rotationCenterY: number | null
    rotationCenterZ: number | null
    pitchOffsetDeg: number | null
    poseError: number | null
  }
  positiveBest: {
    rotationCenterY: number | null
    rotationCenterZ: number | null
    pitchOffsetDeg: number | null
    poseError: number | null
  }
  delta: {
    rotationCenterY: number | null
    rotationCenterZ: number | null
    pitchOffsetDeg: number | null
    poseError: number | null
  }
}

type ObjPoseMappingPose = {
  yaw: number
  pitch: number
  roll: number
}

type ObjPoseMappingNullablePose = {
  yaw: number | null
  pitch: number | null
  roll: number | null
}

type ObjPoseMappingSample = {
  sampleId: string
  candidateId: string
  poseId: string
  poseLabel: string
  p: ObjPoseMappingPose
  P: ObjPoseMappingNullablePose
  auxiliary: {
    basePose: ObjPoseMappingPose
    renderPoseOffset: {
      yawDeg: number
      pitchDeg: number
      rollDeg: number
    }
    rotationCenter: ObjVertex
    expectedPoseForComparison: ObjPoseMappingPose
  }
  errors: {
    poseError: number | null
    yawError: number | null
    pitchError: number | null
    rollError: number | null
  }
  detected: boolean
  detectMs: number | null
  errorMessage: string | null
}

type ObjPoseMappingDataset = {
  schemaVersion: "obj_pose_mapping_dataset_v1"
  createdAt: string
  tool: {
    id: "ideal-obj-render-warp-lab"
    purpose: string
  }
  objSummary: {
    fileName: string | null
    vertexCount: number | null
    faceCount: number | null
    bounds: ObjBounds | null
  }
  primaryVariables: {
    inputCandidate: "p = renderPose"
    observedOutput: "P = MediaPipe returnedPose"
    intendedInverseFunction: "p = g(P_camera)"
  }
  comparisonSign: {
    yaw: number
    pitch: number
    roll: number
  }
  searchRange: ObjPoseCalibrationSearchRange
  counts: {
    sampleCount: number
    detectedCount: number
    failedCount: number
  }
  samples: ObjPoseMappingSample[]
}

type ObjPoseMappingDetectedSampleV2 = {
  sampleId: string
  poseId: string
  p: ObjPoseMappingPose
  P: ObjPoseMappingPose
  detected: true
  detectMs: number | null
}

type ObjPoseMappingFailedSampleV2 = {
  sampleId: string
  poseId: string
  p: ObjPoseMappingPose
  detected: false
  detectMs: number | null
  failureReason: string
}

type ObjPoseMappingDatasetV2 = {
  schemaVersion: "obj_pose_mapping_dataset_v2"
  createdAt: string
  source: {
    objFileName: string | null
    vertexCount: number | null
    faceCount: number | null
  }
  renderSettings: {
    canvasWidth: number
    canvasHeight: number
    rotationCenter: ObjVertex
    notes: "rotationCenter is fixed render setting, not an estimated value"
  }
  renderAppearance: {
    profileId: ObjRenderAppearanceProfileId
    profileLabel: string
    applied: AppliedObjRenderAppearanceProfile
    notes: string
  }
  mediapipeSettings: {
    runningMode: "IMAGE"
    numFaces: 1
    outputFaceBlendshapes: false
    outputFacialTransformationMatrixes: true
  }
  poseSampling: ObjPoseSamplingPreset
  summary: {
    sampleCount: number
    detectedCount: number
    failedCount: number
  }
  samples: ObjPoseMappingDetectedSampleV2[]
  failedSamples: ObjPoseMappingFailedSampleV2[]
}

type NumericSummary = {
  min: number
  max: number
  mean: number
  median: number
  stdDev: number
}

type ObjPoseMappingSampleCompact = {
  sampleId: string
  poseId: string
  poseLabel: string
  p: ObjPoseMappingPose
  P: ObjPoseMappingNullablePose
  errors: ObjPoseMappingSample["errors"]
  auxiliary: ObjPoseMappingSample["auxiliary"]
}

type ObjPoseMappingStatistics = {
  schemaVersion: "obj_pose_mapping_statistics_v1"
  createdAt: string
  sampleCount: number
  detectedCount: number
  failedCount: number
  globalErrorSummary: {
    poseError: NumericSummary | null
    yawError: NumericSummary | null
    pitchError: NumericSummary | null
    rollError: NumericSummary | null
  }
  byPose: Array<{
    poseId: string
    poseLabel: string
    sampleCount: number
    detectedCount: number
    bestSample: ObjPoseMappingSampleCompact | null
    errorSummary: {
      poseError: NumericSummary | null
      yawError: NumericSummary | null
      pitchError: NumericSummary | null
      rollError: NumericSummary | null
    }
  }>
  byGroup: Array<{
    groupId: string
    label: string
    poseIds: string[]
    sampleCount: number
    bestSample: ObjPoseMappingSampleCompact | null
    averageBestPoseError: number | null
    rotationCenterYRange: { min: number | null; max: number | null }
    rotationCenterZRange: { min: number | null; max: number | null }
    pitchOffsetDegRange: { min: number | null; max: number | null }
  }>
  pairSummary: Array<{
    pairId: string
    label: string
    negativePoseId: string
    positivePoseId: string
    negativeBest: ObjPoseMappingSampleCompact | null
    positiveBest: ObjPoseMappingSampleCompact | null
    delta: {
      rotationCenterY: number | null
      rotationCenterZ: number | null
      pitchOffsetDeg: number | null
      poseError: number | null
    }
  }>
  topSamples: ObjPoseMappingSampleCompact[]
  representativeSamples: ObjPoseMappingSampleCompact[]
}

type ObjPoseMappingDatasetSummary = {
  sampleCount: number
  detectedCount: number
  failedCount: number
  lastGeneratedAt: string | null
}

type ObjPoseMappingState = {
  dataset: ObjPoseMappingDatasetSummary
  poseSamplingPreset: ObjPoseSamplingPresetName
  statistics: ObjPoseMappingStatistics | null
  statusMessage: string | null
}

type ObjPoseCalibrationCandidatePoint = {
  rotationCenter: ObjVertex
  renderPoseOffset: {
    yawDeg: number
    pitchDeg: number
    rollDeg: number
  }
}

type ObjPoseCalibrationSearchRange = {
  rotationCenterX: { fixed: true; value: 0 }
  rotationCenterY: { min: -0.3; max: 0.3; step: 0.05 }
  rotationCenterZ: { min: -0.4; max: 0.1; step: 0.05 }
  pitchOffsetDeg: { min: -10; max: 10; step: 2 }
}

type ObjPoseCalibrationState = {
  status: ObjPoseCalibrationStatus
  startedAt: string | null
  completedAt: string | null
  elapsedMs: number | null
  estimatedRemainingMs: number | null
  searchRange: ObjPoseCalibrationSearchRange
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
  poseWiseBest: ObjPoseCalibrationPoseWiseBest[]
  poseWiseGroupSummary: ObjPoseCalibrationPoseWiseGroupSummary[]
  posePairSummary: ObjPoseCalibrationPosePairSummary[]
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

type ModeComparisonStatus = "idle" | "running" | "completed" | "canceled" | "error"

type TimingDistribution = {
  average: number | null
  p50: number | null
  p95: number | null
  max: number | null
}

type ModeComparisonImportantFrameRef = {
  frameIndex: number
  mediaTimeSec: number
  timestampMs: number
} | null

type ModeComparisonImportantFrames = {
  worstYawDiffFrame: ModeComparisonImportantFrameRef
  worstPitchDiffFrame: ModeComparisonImportantFrameRef
  worstRollDiffFrame: ModeComparisonImportantFrameRef
  worstPoseMagnitudeDiffFrame: ModeComparisonImportantFrameRef
  worstMean2dDistanceFrame: ModeComparisonImportantFrameRef
  worstMax2dDistanceFrame: ModeComparisonImportantFrameRef
  firstMismatchFrame: ModeComparisonImportantFrameRef
  latestFrame: ModeComparisonImportantFrameRef
}

type ModeComparisonPreviewKind =
  | "latest"
  | "worst_pose_diff"
  | "worst_landmark_diff"
  | "first_mismatch"

type ModeComparisonPreviewSnapshot = {
  kind: ModeComparisonPreviewKind
  frameIndex: number
  mediaTimeSec: number
  timestampMs: number
  dataUrl: string
  createdAt: string
}

type ModeComparisonPoseDiff = {
  yaw: number | null
  pitch: number | null
  roll: number | null
  absYaw: number | null
  absPitch: number | null
  absRoll: number | null
}

type ModeComparisonLandmarkDiff = {
  mean2dDistance: number | null
  max2dDistance: number | null
  mean3dDistance: number | null
  max3dDistance: number | null
  mean2dDistanceNoIris: number | null
  mean2dDistanceIris: number | null
  landmarkDeltas: Array<{
    index: number
    dx: number
    dy: number
    dz: number
  }>
}

type ModeComparisonFrameResult = {
  frameIndex: number
  mediaTimeSec: number
  timestampMs: number
  timestampSource: "metadata.mediaTime"
  presentedFrames: number | null
  presentedFramesDelta: number | null
  drawImageMs: number | null
  imageDetectMs: number | null
  videoDetectMs: number | null
  totalFrameProcessingMs: number | null
  imageDetectSuccess: boolean
  videoDetectSuccess: boolean
  imageDetected: boolean
  videoDetected: boolean
  imageLandmarkCount: number
  videoLandmarkCount: number
  imagePose: ReferencePose
  videoPose: ReferencePose
  poseDiff: ModeComparisonPoseDiff
  absPoseDiff: {
    yaw: number | null
    pitch: number | null
    roll: number | null
  }
  mean2dDistance: number | null
  max2dDistance: number | null
  mean3dDistance: number | null
  max3dDistance: number | null
  landmarkDiff: ModeComparisonLandmarkDiff | null
  errorMessage: string | null
}

type ModeComparisonSummary = {
  processedFrameCount: number
  skippedFrameCount: number
  imageDetectSuccessCount: number
  videoDetectSuccessCount: number
  bothSuccessCount: number
  imageOnlySuccessCount: number
  videoOnlySuccessCount: number
  bothFailedCount: number
  mismatchCount: number
  timing: {
    drawImageMs: TimingDistribution
    imageDetectMs: TimingDistribution
    videoDetectMs: TimingDistribution
    totalFrameProcessingMs: TimingDistribution
  }
  poseDiff: {
    yaw: TimingDistribution
    pitch: TimingDistribution
    roll: TimingDistribution
    absYaw: TimingDistribution
    absPitch: TimingDistribution
    absRoll: TimingDistribution
    magnitude: TimingDistribution
  }
  landmarkDiff: {
    mean2dDistance: TimingDistribution
    max2dDistance: TimingDistribution
    mean3dDistance: TimingDistribution
    max3dDistance: TimingDistribution
    mean2dDistanceNoIris: TimingDistribution
    mean2dDistanceIris: TimingDistribution
  }
  presentedFramesDelta: TimingDistribution
  importantFrames: ModeComparisonImportantFrames
}

type ModeComparisonExport = {
  type: "mediapipe_mode_comparison_v1"
  createdAt: string
  source: {
    filename: string | null
    durationSec: number | null
    videoWidth: number | null
    videoHeight: number | null
    readyState: number | null
  }
  runOptions: {
    maxFrames: number
    delegate: "GPU"
    frameDriver: "requestVideoFrameCallback"
    imageMode: "IMAGE"
    videoMode: "VIDEO"
    timestampSource: "metadata.mediaTime"
    sameCanvasFrame: true
  }
  summary: ModeComparisonSummary
  frames: ModeComparisonFrameResult[]
}

type ModeComparisonState = {
  status: ModeComparisonStatus
  startedAt: string | null
  completedAt: string | null
  progressFrameCount: number
  maxFrames: number
  skippedFrameCount: number
  lastTimestampMs: number | null
  lastMediaTimeSec: number | null
  lastPresentedFrames: number | null
  errorMessage: string | null
  result: ModeComparisonExport | null
  previewSnapshots: Record<ModeComparisonPreviewKind, ModeComparisonPreviewSnapshot | null>
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
  objPoseMapping: ObjPoseMappingState
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
  modeComparison: ModeComparisonState
  logs: string[]
}

type FaceLandmarkerResultLike = ReturnType<FaceLandmarker["detect"]>
type FaceLandmarkerOptions = Parameters<typeof FaceLandmarker.createFromOptions>[1]
type VideoFrameCallbackMetadataLike = {
  mediaTime?: number
  presentedFrames?: number
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
const MODE_COMPARISON_MAX_FRAMES = 10000
const MODE_COMPARISON_MAX_PREVIEW_SNAPSHOTS = 20
const RAD_TO_DEG = 180 / Math.PI
const STRONG_EXPRESSION_THRESHOLD = 0.35
const MIXED_EXPRESSION_THRESHOLD = 0.28
const RENDERED_IDEAL_FALLBACK_CANVAS_SIZE = 640
const RENDERED_IDEAL_LIGHT_DIRECTION = normalizeVector({ x: -0.35, y: 0.55, z: 0.76 })
const RENDERED_IDEAL_DEFAULT_RESOLUTION = { width: 640, height: 640 } as const
const OBJ_RENDER_APPEARANCE_PROFILES: Record<ObjRenderAppearanceProfileId, ObjRenderAppearanceProfile> = {
  current: {
    id: "current",
    label: "current（現在のレンダー条件）",
    description: "既存挙動との比較基準です。背景色と顔色は既存のレンダー理想preview設定を使います。",
    backgroundColor: "#f5f7f9",
    skinColor: "#cdb197",
    material: {
      mode: "lambert",
      diffuse: 0.65,
      ambient: 0.35,
      specular: 0,
    },
    lighting: {
      mode: "fixed_directional",
      ambientIntensity: 1,
      keyLightIntensity: 1,
      keyLightDirection: RENDERED_IDEAL_LIGHT_DIRECTION,
      castShadow: false,
    },
    camera: {
      projection: "orthographic_like",
      fovDeg: 28,
      scale: 1,
      verticalOffset: 0,
    },
    renderResolution: { ...RENDERED_IDEAL_DEFAULT_RESOLUTION },
    notes: "Existing Canvas2D baseline. Background/color controls are reflected only for this profile.",
  },
  soft_light_no_shadow: {
    id: "soft_light_no_shadow",
    label: "soft_light_no_shadow（影なし・柔らかい光）",
    description: "MediaPipe が形状を読みやすいように、環境光を強めて影を弱くした条件です。",
    backgroundColor: "#f2f2f2",
    skinColor: "#d8b6a0",
    material: {
      mode: "matte",
      diffuse: 0.28,
      ambient: 0.72,
      specular: 0,
    },
    lighting: {
      mode: "fixed_directional",
      ambientIntensity: 0.9,
      keyLightIntensity: 0.28,
      keyLightDirection: { x: -0.2, y: 0.35, z: 0.92 },
      castShadow: false,
    },
    camera: {
      projection: "orthographic_like",
      fovDeg: 24,
      scale: 1,
      verticalOffset: 0,
    },
    renderResolution: { ...RENDERED_IDEAL_DEFAULT_RESOLUTION },
  },
  camera_soft_light: {
    id: "camera_soft_light",
    label: "camera_soft_light（カメラ正面固定ライト）",
    description: "OBJ姿勢が変わっても影方向が大きく変わりにくいカメラ正面ライト条件です。",
    backgroundColor: "#f3f4f5",
    skinColor: "#d6b39c",
    material: {
      mode: "matte",
      diffuse: 0.24,
      ambient: 0.76,
      specular: 0,
    },
    lighting: {
      mode: "camera_front",
      ambientIntensity: 0.9,
      keyLightIntensity: 0.22,
      keyLightDirection: { x: 0, y: 0, z: 1 },
      castShadow: false,
    },
    camera: {
      projection: "orthographic_like",
      fovDeg: 24,
      scale: 1,
      verticalOffset: 0,
    },
    renderResolution: { ...RENDERED_IDEAL_DEFAULT_RESOLUTION },
  },
  high_contrast_background: {
    id: "high_contrast_background",
    label: "high_contrast_background（背景コントラスト確認）",
    description: "横向きや輪郭で顔が背景に溶けないか確認する条件です。",
    backgroundColor: "#e6ebef",
    skinColor: "#d3aa91",
    material: {
      mode: "matte",
      diffuse: 0.34,
      ambient: 0.66,
      specular: 0,
    },
    lighting: {
      mode: "fixed_directional",
      ambientIntensity: 0.82,
      keyLightIntensity: 0.36,
      keyLightDirection: { x: -0.25, y: 0.35, z: 0.9 },
      castShadow: false,
    },
    camera: {
      projection: "orthographic_like",
      fovDeg: 24,
      scale: 1,
      verticalOffset: 0,
    },
    renderResolution: { ...RENDERED_IDEAL_DEFAULT_RESOLUTION },
  },
  yaw_edge_friendly: {
    id: "yaw_edge_friendly",
    label: "yaw_edge_friendly（横向き輪郭補助）",
    description: "yaw端の輪郭・鼻・頬が読みやすくなるかを見るため、弱いrim lightを足した条件です。",
    backgroundColor: "#f2f2f2",
    skinColor: "#d8b6a0",
    material: {
      mode: "matte",
      diffuse: 0.28,
      ambient: 0.7,
      specular: 0,
    },
    lighting: {
      mode: "dual_soft",
      ambientIntensity: 0.86,
      keyLightIntensity: 0.24,
      fillLightIntensity: 0.12,
      rimLightIntensity: 0.16,
      keyLightDirection: { x: -0.2, y: 0.35, z: 0.92 },
      fillLightDirection: { x: 0.35, y: 0.2, z: 0.9 },
      rimLightDirection: { x: 0, y: 0.1, z: -1 },
      castShadow: false,
    },
    camera: {
      projection: "orthographic_like",
      fovDeg: 24,
      scale: 1,
      verticalOffset: 0,
    },
    renderResolution: { ...RENDERED_IDEAL_DEFAULT_RESOLUTION },
  },
  stable_crop_fov: {
    id: "stable_crop_fov",
    label: "stable_crop_fov（安定した顔サイズ・視野角）",
    description: "最大姿勢でも額・顎・輪郭が切れにくいように、顔サイズと視野角を安定させる条件です。",
    backgroundColor: "#f2f2f2",
    skinColor: "#d8b6a0",
    material: {
      mode: "matte",
      diffuse: 0.28,
      ambient: 0.72,
      specular: 0,
    },
    lighting: {
      mode: "fixed_directional",
      ambientIntensity: 0.9,
      keyLightIntensity: 0.26,
      keyLightDirection: { x: -0.2, y: 0.35, z: 0.92 },
      castShadow: false,
    },
    camera: {
      projection: "orthographic_like",
      fovDeg: 20,
      scale: 0.82,
      verticalOffset: -0.02,
    },
    renderResolution: { width: 720, height: 720 },
    notes: "Canvas2D renderer uses orthographic-like scale/crop. fovDeg is recorded but not physically projected yet.",
  },
} as const
const POSE_CENTER_SEARCH_RANGE = {
  x: { fixed: true, value: 0 },
  y: { min: -0.3, max: 0.3, step: 0.05 },
  z: { min: -0.4, max: 0.1, step: 0.05 },
} as const
const POSE_CENTER_SEARCH_TOP_CANDIDATE_COUNT = 5
const POSE_CENTER_SEARCH_FRAME_RESULTS_PREVIEW_COUNT = 12
const OBJ_POSE_CALIBRATION_RANGE = {
  rotationCenterX: { fixed: true, value: 0 },
  rotationCenterY: { min: -0.3, max: 0.3, step: 0.05 },
  rotationCenterZ: { min: -0.4, max: 0.1, step: 0.05 },
  pitchOffsetDeg: { min: -10, max: 10, step: 2 },
} as const
const OBJ_POSE_CALIBRATION_TOP_CANDIDATE_COUNT = 10
const OBJ_POSE_MAPPING_TOP_SAMPLE_COUNT = 20
const OBJ_POSE_MAPPING_INTERVAL_SAMPLE_TARGET_COUNT = 50
const OBJ_POSE_MAPPING_MAX_REPRESENTATIVE_SAMPLE_COUNT = 100
const OBJ_POSE_SAMPLING_PRESETS: Record<ObjPoseSamplingPresetName, ObjPoseSamplingPreset> = {
  quick: {
    preset: "quick",
    yaw: { min: -30, max: 30, step: 10 },
    pitch: { min: -20, max: 20, step: 10 },
    roll: { min: -10, max: 10, step: 10 },
  },
  standard: {
    preset: "standard",
    yaw: { min: -35, max: 35, step: 5 },
    pitch: { min: -25, max: 25, step: 5 },
    roll: { min: -15, max: 15, step: 5 },
  },
  dense: {
    preset: "dense",
    yaw: { min: -35, max: 35, step: 2.5 },
    pitch: { min: -25, max: 25, step: 2.5 },
    roll: { min: -15, max: 15, step: 5 },
  },
} as const
const OBJ_POSE_COMPARISON_SIGN = {
  yaw: -1,
  pitch: -1,
  roll: -1,
} as const
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
const OBJ_POSE_WISE_TOP_CANDIDATE_COUNT = 3
const OBJ_POSE_WISE_GROUPS = [
  { groupId: "front", label: "正面", poseIds: ["front"] },
  {
    groupId: "yaw",
    label: "yaw",
    poseIds: ["yaw_negative_15", "yaw_positive_15", "yaw_negative_30", "yaw_positive_30"],
  },
  {
    groupId: "pitch",
    label: "pitch",
    poseIds: ["pitch_negative_10", "pitch_positive_10", "pitch_negative_20", "pitch_positive_20"],
  },
  { groupId: "roll", label: "roll", poseIds: ["roll_negative_10", "roll_positive_10"] },
  { groupId: "mixed", label: "複合姿勢", poseIds: ["mixed_1", "mixed_2"] },
] as const
const OBJ_POSE_PAIR_SUMMARY_PAIRS = [
  {
    pairId: "yaw_15",
    label: "yaw -15 / +15",
    negativePoseId: "yaw_negative_15",
    positivePoseId: "yaw_positive_15",
  },
  {
    pairId: "yaw_30",
    label: "yaw -30 / +30",
    negativePoseId: "yaw_negative_30",
    positivePoseId: "yaw_positive_30",
  },
  {
    pairId: "roll_10",
    label: "roll -10 / +10",
    negativePoseId: "roll_negative_10",
    positivePoseId: "roll_positive_10",
  },
  {
    pairId: "pitch_10",
    label: "pitch -10 / +10",
    negativePoseId: "pitch_negative_10",
    positivePoseId: "pitch_positive_10",
  },
  {
    pairId: "pitch_20",
    label: "pitch -20 / +20",
    negativePoseId: "pitch_negative_20",
    positivePoseId: "pitch_positive_20",
  },
] as const
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
  { label: "p,Pデータ", value: "objPoseCalibration" },
  { label: "リアルタイム", value: "realtime" },
  { label: "モード比較", value: "modeComparison" },
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
  objPoseMapping: createDefaultObjPoseMappingState(),
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
  modeComparison: createDefaultModeComparisonState(),
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
        <button class="secondary-button" type="button" data-action="load-live-video">MP4読込</button>
        <div class="mode-comparison-panel" data-mode-comparison-panel>
          <div class="mode-comparison-header">
            <h3>モード比較</h3>
            <p>IMAGE mode（静止画モード）と VIDEO mode（動画モード）を、同じ canvas frame（同一キャンバスフレーム）で比較します。</p>
          </div>
          <div class="button-row">
            <button class="primary-button" type="button" data-action="mode-comparison-start">モード比較</button>
            <button class="secondary-button" type="button" data-action="mode-comparison-cancel">停止 / cancel</button>
          </div>
        </div>
        <label class="select-field">
          <span>姿勢サンプリング</span>
          <select data-control="obj-pose-sampling-preset">
            <option value="quick">quick（簡易）</option>
            <option value="standard">standard（標準）</option>
            <option value="dense">dense（高密度）</option>
          </select>
        </label>
        <button class="primary-button" type="button" data-action="obj-pose-calibration-start">p,Pデータ生成</button>
        <button class="secondary-button" type="button" data-action="export-obj-pose-mapping-dataset">p,P Dataset JSONをダウンロード</button>
        <button class="secondary-button" type="button" data-action="export-debug">デバッグ出力</button>
      </div>
      <input class="visually-hidden" type="file" accept=".obj,text/plain,model/obj" data-input="obj-file" />
      <input class="visually-hidden" type="file" accept="video/*" data-input="live-video" />
      <div class="status-note">
        OBJ Pose Dataset（OBJ姿勢データ）を生成します。OBJに与えた renderPose を p、MediaPipe の returnedPose を P としてJSONに保存します。
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
let modeComparisonImageLandmarker: FaceLandmarker | null = null
let modeComparisonVideoLandmarker: FaceLandmarker | null = null
let modeComparisonLandmarkerPromise: Promise<{
  imageLandmarker: FaceLandmarker
  videoLandmarker: FaceLandmarker
}> | null = null
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
let modeComparisonVideoFrameCallbackId: number | null = null
let modeComparisonRunId = 0
let modeComparisonFrames: ModeComparisonFrameResult[] = []
const modeComparisonCanvas = document.createElement("canvas")
let realtimeRunStartedAtMs: number | null = null
let realtimeTickInProgress = false
let realtimeTimingSamples: RealtimeTimingSample[] = []
let lastRealtimeAnimationFrameCurrentTimeSec: number | null = null
let cameraStream: MediaStream | null = null
let objPoseMappingDatasetSamples: ObjPoseMappingSample[] = []
let objPoseMappingDataset: ObjPoseMappingDatasetV2 | null = null
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
          <span>Render Appearance（レンダー見た目）</span>
          <select data-control="render-appearance-profile">
            <option value="current">current（現在の条件）</option>
            <option value="soft_light_no_shadow">soft_light_no_shadow（影なし・柔らかい光）</option>
            <option value="camera_soft_light">camera_soft_light（カメラ正面固定ライト）</option>
            <option value="high_contrast_background">high_contrast_background（背景コントラスト確認）</option>
            <option value="yaw_edge_friendly">yaw_edge_friendly（横向き輪郭補助）</option>
            <option value="stable_crop_fov">stable_crop_fov（安定した顔サイズ・視野角）</option>
          </select>
        </label>
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

  getElement<HTMLButtonElement>('[data-action="load-live-video"]').addEventListener("click", () => {
    if (isPoseCenterSearchRunning() || state.modeComparison.status === "running") {
      return
    }
    liveFileInput.click()
  })

  getElement<HTMLButtonElement>('[data-action="obj-pose-calibration-start"]').addEventListener("click", () => {
    void startObjPoseCalibration()
  })

  getElement<HTMLButtonElement>('[data-action="export-debug"]').addEventListener("click", () => {
    void exportDebug()
  })

  getElement<HTMLButtonElement>('[data-action="export-obj-pose-mapping-dataset"]').addEventListener("click", () => {
    void exportObjPoseMappingDataset()
  })

  getElement<HTMLButtonElement>('[data-action="mode-comparison-start"]').addEventListener("click", () => {
    void startModeComparison()
  })

  getElement<HTMLButtonElement>('[data-action="mode-comparison-cancel"]').addEventListener("click", () => {
    cancelModeComparison()
  })

  objFileInput.addEventListener("change", (event) => {
    const file = getSelectedFile(event)
    if (file && !isObjPoseCalibrationRunning()) {
      void loadObjFile(file)
    }
  })

  liveFileInput.addEventListener("change", (event) => {
    const file = getSelectedFile(event)
    if (file && !isPoseCenterSearchRunning() && state.modeComparison.status !== "running") {
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
    if (state.modeComparison.status !== "running") {
      maybeAnalyzeLiveFrame()
    }
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
    if (
      state.liveVideo.loaded &&
      state.realtimeDebug.status !== "running" &&
      state.modeComparison.status !== "running" &&
      !isPoseCenterSearchRunning()
    ) {
      void analyzeCurrentLiveFrame("pause")
    }
    renderAll()
  })

  liveVideoElement.addEventListener("ended", () => {
    state.liveVideo.playbackStatus = "stopped"
    syncLiveInputState()
    if (state.modeComparison.status === "running") {
      finishModeComparison("completed")
      return
    }
    if (
      state.liveVideo.loaded &&
      state.realtimeDebug.status !== "running" &&
      state.modeComparison.status !== "running" &&
      !isPoseCenterSearchRunning()
    ) {
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

  getElement<HTMLSelectElement>('[data-control="render-appearance-profile"]').addEventListener("change", (event) => {
    const value = event.currentTarget.value
    if (isObjRenderAppearanceProfileId(value)) {
      state.renderedIdeal.renderAppearanceProfileId = value
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

  getElement<HTMLSelectElement>('[data-control="obj-pose-sampling-preset"]').addEventListener("change", (event) => {
    const value = event.currentTarget.value
    if (isObjPoseSamplingPresetName(value)) {
      state.objPoseMapping = {
        ...state.objPoseMapping,
        poseSamplingPreset: value,
      }
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

  app.addEventListener("click", (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) {
      return
    }
    const action = target.closest<HTMLElement>("[data-action]")?.dataset.action
    if (action === "mode-comparison-download-json") {
      exportModeComparisonJson()
    }
    if (action === "mode-comparison-download-csv") {
      exportModeComparisonCsv()
    }
    if (isModeComparisonPreviewDownloadAction(action)) {
      exportModeComparisonPreview(action.replace("mode-comparison-download-preview-", "") as ModeComparisonPreviewKind)
    }
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
  cancelModeComparison()
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
  cancelModeComparison()
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

async function getModeComparisonLandmarkers() {
  if (modeComparisonImageLandmarker && modeComparisonVideoLandmarker) {
    return {
      imageLandmarker: modeComparisonImageLandmarker,
      videoLandmarker: modeComparisonVideoLandmarker,
    }
  }

  if (modeComparisonLandmarkerPromise) {
    return modeComparisonLandmarkerPromise
  }

  modeComparisonLandmarkerPromise = initializeModeComparisonLandmarkers()
  try {
    const landmarks = await modeComparisonLandmarkerPromise
    modeComparisonImageLandmarker = landmarks.imageLandmarker
    modeComparisonVideoLandmarker = landmarks.videoLandmarker
    return landmarks
  } finally {
    modeComparisonLandmarkerPromise = null
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

async function initializeModeComparisonLandmarkers() {
  const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH)
  const [imageLandmarker, videoLandmarker] = await Promise.all([
    FaceLandmarker.createFromOptions(vision, createModeComparisonImageLandmarkerOptions()),
    FaceLandmarker.createFromOptions(vision, createModeComparisonVideoLandmarkerOptions()),
  ])

  return {
    imageLandmarker,
    videoLandmarker,
  }
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
      poseCount: 0,
      errorMessage: "OBJ読込を完了してからp,Pデータ生成を実行してください。",
    }
    addLog("p,Pデータ生成を開始できません。OBJ読込を完了してください。")
    renderAll()
    return
  }

  stopRealtimeValidation("stopped")
  const poseSampling = getCurrentObjPoseSamplingPreset()
  const poses = createObjPoseSamplingPoses(poseSampling)
  const renderSettings = getFixedObjPoseRenderSettings()
  const startedAtMs = performance.now()
  resetObjPoseMappingDataset()
  state.activeDebugTab = "objPoseCalibration"
  state.objPoseCalibration = {
    ...createDefaultObjPoseCalibrationState(),
    status: "running",
    startedAt: new Date().toISOString(),
    poseCount: poses.length,
    candidateCount: 0,
    totalEvaluationCount: poses.length,
  }
  addLog(`p,Pデータ生成を開始しました: ${poseSampling.preset} / ${poses.length} pose`)
  renderAll()

  try {
    const detectionIdle = await waitForRenderedIdealDetectionIdle()
    if (!detectionIdle) {
      throw new Error("rendered ideal detection is still running")
    }

    const detector = await getRenderedIdealFaceLandmarker()
    for (const [index, pose] of poses.entries()) {
      const result = evaluateObjPoseCalibrationCandidateOnPose(detector, renderSettings, pose)
      updateObjPoseMappingGenerationProgress(result, index + 1, poses.length, startedAtMs, renderSettings.rotationCenter)
      renderRenderedIdealSummaryCard()
      renderDebugContent()

      if (index % 10 === 0) {
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
    objPoseMappingDataset = buildObjPoseMappingDataset(objPoseMappingDatasetSamples)
    updateObjPoseMappingDatasetSummary()
    addLog(`p,Pデータ生成が完了しました: ${state.objPoseMapping.dataset.detectedCount} detected / ${state.objPoseMapping.dataset.failedCount} failed`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("OBJ pose dataset generation failed", error)
    state.objPoseCalibration = {
      ...state.objPoseCalibration,
      status: "error",
      completedAt: new Date().toISOString(),
      elapsedMs: performance.now() - startedAtMs,
      errorMessage: message,
    }
    addLog(`p,Pデータ生成でエラーが発生しました: ${message}`)
  } finally {
    renderAll()
  }
}

function evaluateObjPoseCalibrationCandidate(
  detector: FaceLandmarker,
  candidatePoint: ObjPoseCalibrationCandidatePoint,
): ObjPoseCalibrationCandidate {
  const poseResults = OBJ_POSE_CALIBRATION_POSES.map((pose) =>
    evaluateObjPoseCalibrationCandidateOnPose(detector, candidatePoint, pose),
  )
  return buildObjPoseCalibrationCandidate(candidatePoint, poseResults)
}

function getCurrentObjPoseSamplingPreset(): ObjPoseSamplingPreset {
  return OBJ_POSE_SAMPLING_PRESETS[state.objPoseMapping.poseSamplingPreset]
}

function createObjPoseSamplingPoses(preset: ObjPoseSamplingPreset): ObjPoseCalibrationPose[] {
  const yawValues = createSteppedValues(preset.yaw.min, preset.yaw.max, preset.yaw.step)
  const pitchValues = createSteppedValues(preset.pitch.min, preset.pitch.max, preset.pitch.step)
  const rollValues = createSteppedValues(preset.roll.min, preset.roll.max, preset.roll.step)
  const poses: ObjPoseCalibrationPose[] = []

  yawValues.forEach((yaw) => {
    pitchValues.forEach((pitch) => {
      rollValues.forEach((roll) => {
        const sampleIndex = poses.length + 1
        poses.push({
          id: `pose_${String(sampleIndex).padStart(6, "0")}`,
          label: `yaw ${formatNumber(yaw)} / pitch ${formatNumber(pitch)} / roll ${formatNumber(roll)}`,
          yawDeg: yaw,
          pitchDeg: pitch,
          rollDeg: roll,
        })
      })
    })
  })

  return poses
}

function getFixedObjPoseRenderSettings(): ObjPoseCalibrationCandidatePoint {
  return {
    rotationCenter: {
      x: state.objPoseSync.rotationCenterX,
      y: state.objPoseSync.rotationCenterY,
      z: state.objPoseSync.rotationCenterZ,
    },
    renderPoseOffset: {
      yawDeg: 0,
      pitchDeg: 0,
      rollDeg: 0,
    },
  }
}

function evaluateObjPoseCalibrationCandidateOnPose(
  detector: FaceLandmarker,
  candidatePoint: ObjPoseCalibrationCandidatePoint,
  pose: ObjPoseCalibrationPose,
): ObjPoseCalibrationPoseResult {
  const basePose = {
    yaw: pose.yawDeg,
    pitch: pose.pitchDeg,
    roll: pose.rollDeg,
  }
  const renderPose = {
    yaw: basePose.yaw + candidatePoint.renderPoseOffset.yawDeg,
    pitch: basePose.pitch + candidatePoint.renderPoseOffset.pitchDeg,
    roll: basePose.roll + candidatePoint.renderPoseOffset.rollDeg,
  }
  const expectedPoseForComparison = applyObjPoseComparisonSign(basePose)
  const baseResult: ObjPoseCalibrationPoseResult = {
    poseId: pose.id,
    poseLabel: pose.label,
    basePose,
    renderPoseOffset: candidatePoint.renderPoseOffset,
    renderPose,
    expectedPoseForComparison,
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
    const renderSummary = renderRenderedIdealCanvasTo(renderedIdealCanvas, candidatePoint.rotationCenter, renderPose)
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
        returnedPose: clonePose(returnedPose),
        detectMs,
        errorMessage: detection.errorMessage ?? detection.status,
      }
    }

    return {
      ...baseResult,
      returnedPose: clonePose(returnedPose),
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
  candidatePoint: ObjPoseCalibrationCandidatePoint,
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
    rotationCenterX: roundForState(candidatePoint.rotationCenter.x) ?? 0,
    rotationCenterY: roundForState(candidatePoint.rotationCenter.y) ?? 0,
    rotationCenterZ: roundForState(candidatePoint.rotationCenter.z) ?? 0,
    renderPoseOffset: roundObjPoseRenderOffset(candidatePoint.renderPoseOffset),
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

function updateObjPoseMappingGenerationProgress(
  result: ObjPoseCalibrationPoseResult,
  sampleNumber: number,
  totalSampleCount: number,
  startedAtMs: number,
  rotationCenter: ObjVertex,
) {
  appendObjPoseMappingResult(result, sampleNumber, rotationCenter)
  const elapsedMs = performance.now() - startedAtMs
  const averageSampleMs = elapsedMs / Math.max(1, sampleNumber)
  const remainingSampleCount = Math.max(0, totalSampleCount - sampleNumber)

  state.objPoseCalibration = {
    ...state.objPoseCalibration,
    evaluatedPoseCount: sampleNumber,
    failedPoseEvaluationCount:
      state.objPoseMapping.dataset.failedCount,
    elapsedMs,
    estimatedRemainingMs: averageSampleMs * remainingSampleCount,
  }
}

function appendObjPoseMappingResult(result: ObjPoseCalibrationPoseResult, sampleNumber: number, rotationCenter: ObjVertex) {
  const sample = createObjPoseMappingSampleFromResult(result, sampleNumber, rotationCenter)
  objPoseMappingDatasetSamples = [
    ...objPoseMappingDatasetSamples,
    sample,
  ]
  updateObjPoseMappingDatasetSummary()
}

function createObjPoseMappingSampleFromResult(
  result: ObjPoseCalibrationPoseResult,
  sampleNumber: number,
  rotationCenter: ObjVertex,
): ObjPoseMappingSample {
  const sampleId = `sample_${String(sampleNumber).padStart(6, "0")}`
  return {
    sampleId,
    candidateId: "fixed_render_settings",
    poseId: result.poseId,
    poseLabel: result.poseLabel,
    p: {
      yaw: result.renderPose.yaw,
      pitch: result.renderPose.pitch,
      roll: result.renderPose.roll,
    },
    P: clonePose(result.returnedPose),
    auxiliary: {
      basePose: {
        yaw: result.basePose.yaw,
        pitch: result.basePose.pitch,
        roll: result.basePose.roll,
      },
      renderPoseOffset: {
        yawDeg: 0,
        pitchDeg: 0,
        rollDeg: 0,
      },
      rotationCenter: { ...rotationCenter },
      expectedPoseForComparison: {
        yaw: result.expectedPoseForComparison.yaw,
        pitch: result.expectedPoseForComparison.pitch,
        roll: result.expectedPoseForComparison.roll,
      },
    },
    errors: {
      poseError: null,
      yawError: null,
      pitchError: null,
      rollError: null,
    },
    detected: result.detected,
    detectMs: result.detectMs,
    errorMessage: result.errorMessage,
  }
}

function updateObjPoseCalibrationProgress(candidate: ObjPoseCalibrationCandidate, startedAtMs: number) {
  const candidateNumber = state.objPoseCalibration.evaluatedCandidateCount + 1
  appendObjPoseMappingSamples(candidate, candidateNumber)
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
  const poseWiseBest = updateObjPoseCalibrationPoseWiseBest(
    state.objPoseCalibration.poseWiseBest,
    candidate,
  )

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
    poseWiseBest,
    poseWiseGroupSummary: buildObjPoseWiseGroupSummary(poseWiseBest),
    posePairSummary: buildObjPosePairSummary(poseWiseBest),
    elapsedMs,
    estimatedRemainingMs: averageCandidateMs * remainingCandidateCount,
  }
}

function updateObjPoseCalibrationPoseWiseBest(
  currentPoseWiseBest: ObjPoseCalibrationPoseWiseBest[],
  candidate: ObjPoseCalibrationCandidate,
): ObjPoseCalibrationPoseWiseBest[] {
  const currentByPoseId = new Map(currentPoseWiseBest.map((item) => [item.poseId, item]))

  return OBJ_POSE_CALIBRATION_POSES.map((pose) => {
    const current = currentByPoseId.get(pose.id) ?? createDefaultObjPoseWiseBestForPose(pose)
    const result = candidate.poseResultsPreview.find((item) => item.poseId === pose.id)
    if (!result || !result.detected || result.poseError === null) {
      return current
    }

    const topCandidates = [
      ...current.topCandidates,
      createObjPoseWiseTopCandidate(candidate, result, 0),
    ]
      .filter((item) => item.detected && item.poseError !== null)
      .sort((a, b) => (a.poseError ?? Number.POSITIVE_INFINITY) - (b.poseError ?? Number.POSITIVE_INFINITY))
      .slice(0, OBJ_POSE_WISE_TOP_CANDIDATE_COUNT)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }))
    const bestCandidate =
      current.bestCandidate === null ||
      (result.poseError ?? Number.POSITIVE_INFINITY) <
        (current.bestCandidate.poseError ?? Number.POSITIVE_INFINITY)
        ? createObjPoseWiseBestCandidate(candidate, result)
        : current.bestCandidate

    return {
      ...current,
      bestCandidate,
      topCandidates,
    }
  })
}

function createObjPoseWiseTopCandidate(
  candidate: ObjPoseCalibrationCandidate,
  result: ObjPoseCalibrationPoseResult,
  rank: number,
): ObjPoseCalibrationPoseWiseTopCandidate {
  return {
    rank,
    rotationCenterX: candidate.rotationCenterX,
    rotationCenterY: candidate.rotationCenterY,
    rotationCenterZ: candidate.rotationCenterZ,
    renderPoseOffset: candidate.renderPoseOffset,
    poseError: result.poseError,
    yawError: result.yawError,
    pitchError: result.pitchError,
    rollError: result.rollError,
    returnedPose: result.returnedPose,
    detected: result.detected,
  }
}

function createObjPoseWiseBestCandidate(
  candidate: ObjPoseCalibrationCandidate,
  result: ObjPoseCalibrationPoseResult,
): ObjPoseCalibrationPoseWiseBestCandidate {
  return {
    rotationCenterX: candidate.rotationCenterX,
    rotationCenterY: candidate.rotationCenterY,
    rotationCenterZ: candidate.rotationCenterZ,
    renderPoseOffset: candidate.renderPoseOffset,
    renderPose: result.renderPose,
    expectedPoseForComparison: result.expectedPoseForComparison,
    returnedPose: result.returnedPose,
    poseError: result.poseError,
    yawError: result.yawError,
    pitchError: result.pitchError,
    rollError: result.rollError,
    detected: result.detected,
    detectMs: result.detectMs,
    errorMessage: result.errorMessage,
  }
}

function createObjPoseCalibrationCandidatePoints(): ObjPoseCalibrationCandidatePoint[] {
  const yValues = createSteppedValues(
    OBJ_POSE_CALIBRATION_RANGE.rotationCenterY.min,
    OBJ_POSE_CALIBRATION_RANGE.rotationCenterY.max,
    OBJ_POSE_CALIBRATION_RANGE.rotationCenterY.step,
  )
  const zValues = createSteppedValues(
    OBJ_POSE_CALIBRATION_RANGE.rotationCenterZ.min,
    OBJ_POSE_CALIBRATION_RANGE.rotationCenterZ.max,
    OBJ_POSE_CALIBRATION_RANGE.rotationCenterZ.step,
  )
  const pitchOffsetValues = createSteppedValues(
    OBJ_POSE_CALIBRATION_RANGE.pitchOffsetDeg.min,
    OBJ_POSE_CALIBRATION_RANGE.pitchOffsetDeg.max,
    OBJ_POSE_CALIBRATION_RANGE.pitchOffsetDeg.step,
  )

  return yValues.flatMap((y) =>
    zValues.flatMap((z) =>
      pitchOffsetValues.map((pitchDeg) => ({
        rotationCenter: {
          x: OBJ_POSE_CALIBRATION_RANGE.rotationCenterX.value,
          y,
          z,
        },
        renderPoseOffset: {
          yawDeg: 0,
          pitchDeg,
          rollDeg: 0,
        },
      })),
    ),
  )
}

function resetObjPoseMappingDataset() {
  const poseSamplingPreset = state.objPoseMapping.poseSamplingPreset
  objPoseMappingDatasetSamples = []
  objPoseMappingDataset = null
  state.objPoseMapping = {
    ...createDefaultObjPoseMappingState(),
    poseSamplingPreset,
  }
}

function appendObjPoseMappingSamples(candidate: ObjPoseCalibrationCandidate, candidateNumber: number) {
  const candidateId = `candidate_${String(candidateNumber).padStart(5, "0")}`
  const samples = candidate.poseResultsPreview.map((result) =>
    createObjPoseMappingSample(candidate, result, candidateId),
  )
  objPoseMappingDatasetSamples = [
    ...objPoseMappingDatasetSamples,
    ...samples,
  ]
  updateObjPoseMappingDatasetSummary()
}

function createObjPoseMappingSample(
  candidate: ObjPoseCalibrationCandidate,
  result: ObjPoseCalibrationPoseResult,
  candidateId: string,
): ObjPoseMappingSample {
  return {
    sampleId: `${candidateId}_${result.poseId}`,
    candidateId,
    poseId: result.poseId,
    poseLabel: result.poseLabel,
    p: {
      yaw: roundForState(result.renderPose.yaw) ?? 0,
      pitch: roundForState(result.renderPose.pitch) ?? 0,
      roll: roundForState(result.renderPose.roll) ?? 0,
    },
    P: clonePose(result.returnedPose),
    auxiliary: {
      basePose: {
        yaw: roundForState(result.basePose.yaw) ?? 0,
        pitch: roundForState(result.basePose.pitch) ?? 0,
        roll: roundForState(result.basePose.roll) ?? 0,
      },
      renderPoseOffset: roundObjPoseRenderOffset(result.renderPoseOffset),
      rotationCenter: {
        x: roundForState(candidate.rotationCenterX) ?? 0,
        y: roundForState(candidate.rotationCenterY) ?? 0,
        z: roundForState(candidate.rotationCenterZ) ?? 0,
      },
      expectedPoseForComparison: {
        yaw: roundForState(result.expectedPoseForComparison.yaw) ?? 0,
        pitch: roundForState(result.expectedPoseForComparison.pitch) ?? 0,
        roll: roundForState(result.expectedPoseForComparison.roll) ?? 0,
      },
    },
    errors: {
      poseError: roundForState(result.poseError),
      yawError: roundForState(result.yawError),
      pitchError: roundForState(result.pitchError),
      rollError: roundForState(result.rollError),
    },
    detected: result.detected,
    detectMs: roundForState(result.detectMs),
    errorMessage: result.errorMessage,
  }
}

function updateObjPoseMappingDatasetSummary() {
  const detectedCount = objPoseMappingDatasetSamples.filter((sample) => sample.detected).length
  state.objPoseMapping = {
    ...state.objPoseMapping,
    dataset: {
      sampleCount: objPoseMappingDatasetSamples.length,
      detectedCount,
      failedCount: objPoseMappingDatasetSamples.length - detectedCount,
      lastGeneratedAt: objPoseMappingDataset?.createdAt ?? state.objPoseMapping.dataset.lastGeneratedAt,
    },
  }
}

function buildObjPoseMappingDataset(samples: ObjPoseMappingSample[]): ObjPoseMappingDatasetV2 {
  const detectedSamples = samples.filter((sample) => sample.detected && hasFullPose(sample.P))
  const failedSamples = samples.filter((sample) => !sample.detected || !hasFullPose(sample.P))
  const rotationCenter = getFixedObjPoseRenderSettings().rotationCenter
  const appliedAppearance = getAppliedObjRenderAppearanceProfile({
    width: renderedIdealCanvas.width,
    height: renderedIdealCanvas.height,
  })

  return {
    schemaVersion: "obj_pose_mapping_dataset_v2",
    createdAt: new Date().toISOString(),
    source: {
      objFileName: state.objFile.fileName,
      vertexCount: state.objFile.loaded ? state.objSummary.vertexCount : null,
      faceCount: state.objFile.loaded ? state.objSummary.faceCount : null,
    },
    renderSettings: {
      canvasWidth: renderedIdealCanvas.width,
      canvasHeight: renderedIdealCanvas.height,
      rotationCenter: { ...rotationCenter },
      notes: "rotationCenter is fixed render setting, not an estimated value",
    },
    renderAppearance: {
      profileId: appliedAppearance.id,
      profileLabel: appliedAppearance.label,
      applied: appliedAppearance,
      notes: [
        appliedAppearance.description,
        appliedAppearance.notes ?? "",
        ...appliedAppearance.implementation.notes,
      ].filter(Boolean).join(" "),
    },
    mediapipeSettings: {
      runningMode: "IMAGE",
      numFaces: 1,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: true,
    },
    poseSampling: getCurrentObjPoseSamplingPreset(),
    summary: {
      sampleCount: samples.length,
      detectedCount: detectedSamples.length,
      failedCount: failedSamples.length,
    },
    samples: detectedSamples.map((sample) => ({
      sampleId: sample.sampleId,
      poseId: sample.poseId,
      p: { ...sample.p },
      P: {
        yaw: sample.P.yaw!,
        pitch: sample.P.pitch!,
        roll: sample.P.roll!,
      },
      detected: true,
      detectMs: sample.detectMs,
    })),
    failedSamples: failedSamples.map((sample) => ({
      sampleId: sample.sampleId,
      poseId: sample.poseId,
      p: { ...sample.p },
      detected: false,
      detectMs: sample.detectMs,
      failureReason: sample.errorMessage ?? "unknown",
    })),
  }
}

function cloneObjPoseMappingSample(sample: ObjPoseMappingSample): ObjPoseMappingSample {
  return {
    ...sample,
    p: { ...sample.p },
    P: { ...sample.P },
    auxiliary: {
      basePose: { ...sample.auxiliary.basePose },
      renderPoseOffset: { ...sample.auxiliary.renderPoseOffset },
      rotationCenter: { ...sample.auxiliary.rotationCenter },
      expectedPoseForComparison: { ...sample.auxiliary.expectedPoseForComparison },
    },
    errors: { ...sample.errors },
  }
}

function buildAndStoreObjPoseMappingStatistics(): ObjPoseMappingStatistics | null {
  const message = "統計要約は廃止しました。Colab側で解析してください。"
  setObjPoseMappingStatusMessage(message)
  addLog(message)
  return null
}

function ensureObjPoseMappingDataset(): ObjPoseMappingDatasetV2 | null {
  if (objPoseMappingDataset) {
    return objPoseMappingDataset
  }
  if (objPoseMappingDatasetSamples.length === 0) {
    return null
  }
  objPoseMappingDataset = buildObjPoseMappingDataset(objPoseMappingDatasetSamples)
  updateObjPoseMappingDatasetSummary()
  return objPoseMappingDataset
}

function buildObjPoseMappingStatistics(dataset: ObjPoseMappingDataset): ObjPoseMappingStatistics {
  const samples = dataset.samples
  const detectedSamples = getDetectedObjPoseMappingSamples(samples)
  const bestSampleByPose = new Map<string, ObjPoseMappingSample>()

  OBJ_POSE_CALIBRATION_POSES.forEach((pose) => {
    const best = getBestObjPoseMappingSample(samples.filter((sample) => sample.poseId === pose.id))
    if (best) {
      bestSampleByPose.set(pose.id, best)
    }
  })

  const byPose = OBJ_POSE_CALIBRATION_POSES.map((pose) => {
    const poseSamples = samples.filter((sample) => sample.poseId === pose.id)
    const poseDetectedSamples = getDetectedObjPoseMappingSamples(poseSamples)
    return {
      poseId: pose.id,
      poseLabel: pose.label,
      sampleCount: poseSamples.length,
      detectedCount: poseDetectedSamples.length,
      bestSample: compactObjPoseMappingSample(bestSampleByPose.get(pose.id) ?? null),
      errorSummary: buildObjPoseMappingErrorSummary(poseDetectedSamples),
    }
  })

  const topSamples = detectedSamples
    .slice()
    .sort(compareObjPoseMappingSamplesByPoseError)
    .slice(0, OBJ_POSE_MAPPING_TOP_SAMPLE_COUNT)
    .map((sample) => compactObjPoseMappingSample(sample)!)
  const byGroup = OBJ_POSE_WISE_GROUPS.map((group) => {
    const groupPoseIds = group.poseIds as readonly string[]
    const groupSamples = samples.filter((sample) => groupPoseIds.includes(sample.poseId))
    const groupBestSamples = group.poseIds
      .map((poseId) => bestSampleByPose.get(poseId) ?? null)
      .filter((sample): sample is ObjPoseMappingSample => sample !== null)
    const bestSample = getBestObjPoseMappingSample(groupBestSamples)
    return {
      groupId: group.groupId,
      label: group.label,
      poseIds: [...group.poseIds],
      sampleCount: groupSamples.length,
      bestSample: compactObjPoseMappingSample(bestSample),
      averageBestPoseError: roundForState(averageNumbers(groupBestSamples.map((sample) => sample.errors.poseError))),
      rotationCenterYRange: createNullableRange(groupBestSamples.map((sample) => sample.auxiliary.rotationCenter.y)),
      rotationCenterZRange: createNullableRange(groupBestSamples.map((sample) => sample.auxiliary.rotationCenter.z)),
      pitchOffsetDegRange: createNullableRange(groupBestSamples.map((sample) => sample.auxiliary.renderPoseOffset.pitchDeg)),
    }
  })
  const pairSummary = OBJ_POSE_PAIR_SUMMARY_PAIRS.map((pair) => {
    const negativeBest = bestSampleByPose.get(pair.negativePoseId) ?? null
    const positiveBest = bestSampleByPose.get(pair.positivePoseId) ?? null
    return {
      pairId: pair.pairId,
      label: pair.label,
      negativePoseId: pair.negativePoseId,
      positivePoseId: pair.positivePoseId,
      negativeBest: compactObjPoseMappingSample(negativeBest),
      positiveBest: compactObjPoseMappingSample(positiveBest),
      delta: {
        rotationCenterY: subtractNullable(
          positiveBest?.auxiliary.rotationCenter.y ?? null,
          negativeBest?.auxiliary.rotationCenter.y ?? null,
        ),
        rotationCenterZ: subtractNullable(
          positiveBest?.auxiliary.rotationCenter.z ?? null,
          negativeBest?.auxiliary.rotationCenter.z ?? null,
        ),
        pitchOffsetDeg: subtractNullable(
          positiveBest?.auxiliary.renderPoseOffset.pitchDeg ?? null,
          negativeBest?.auxiliary.renderPoseOffset.pitchDeg ?? null,
        ),
        poseError: subtractNullable(
          positiveBest?.errors.poseError ?? null,
          negativeBest?.errors.poseError ?? null,
        ),
      },
    }
  })

  return {
    schemaVersion: "obj_pose_mapping_statistics_v1",
    createdAt: new Date().toISOString(),
    sampleCount: samples.length,
    detectedCount: detectedSamples.length,
    failedCount: samples.length - detectedSamples.length,
    globalErrorSummary: buildObjPoseMappingErrorSummary(detectedSamples),
    byPose,
    byGroup,
    pairSummary,
    topSamples,
    representativeSamples: buildObjPoseMappingRepresentativeSamples(samples, topSamples, bestSampleByPose, byGroup),
  }
}

function getDetectedObjPoseMappingSamples(samples: ObjPoseMappingSample[]) {
  return samples.filter((sample) => sample.detected && sample.errors.poseError !== null)
}

function buildObjPoseMappingErrorSummary(samples: ObjPoseMappingSample[]) {
  return {
    poseError: summarizeNumbers(samples.map((sample) => sample.errors.poseError)),
    yawError: summarizeNumbers(samples.map((sample) => sample.errors.yawError)),
    pitchError: summarizeNumbers(samples.map((sample) => sample.errors.pitchError)),
    rollError: summarizeNumbers(samples.map((sample) => sample.errors.rollError)),
  }
}

function summarizeNumbers(values: Array<number | null>): NumericSummary | null {
  const finiteValues = values
    .filter((value): value is number => value !== null && Number.isFinite(value))
    .sort((a, b) => a - b)
  if (finiteValues.length === 0) {
    return null
  }

  const mean = averageNumbers(finiteValues) ?? 0
  const variance = averageNumbers(finiteValues.map((value) => (value - mean) ** 2)) ?? 0
  const medianIndex = Math.floor(finiteValues.length / 2)
  const median = finiteValues.length % 2 === 0
    ? (finiteValues[medianIndex - 1] + finiteValues[medianIndex]) / 2
    : finiteValues[medianIndex]
  return {
    min: roundForState(finiteValues[0]) ?? 0,
    max: roundForState(finiteValues[finiteValues.length - 1]) ?? 0,
    mean: roundForState(mean) ?? 0,
    median: roundForState(median) ?? 0,
    stdDev: roundForState(Math.sqrt(variance)) ?? 0,
  }
}

function getBestObjPoseMappingSample(samples: ObjPoseMappingSample[]): ObjPoseMappingSample | null {
  return getDetectedObjPoseMappingSamples(samples)
    .slice()
    .sort(compareObjPoseMappingSamplesByPoseError)[0] ?? null
}

function compareObjPoseMappingSamplesByPoseError(a: ObjPoseMappingSample, b: ObjPoseMappingSample) {
  return (a.errors.poseError ?? Number.POSITIVE_INFINITY) - (b.errors.poseError ?? Number.POSITIVE_INFINITY)
}

function compactObjPoseMappingSample(sample: ObjPoseMappingSample | null): ObjPoseMappingSampleCompact | null {
  if (!sample) {
    return null
  }
  return {
    sampleId: sample.sampleId,
    poseId: sample.poseId,
    poseLabel: sample.poseLabel,
    p: { ...sample.p },
    P: { ...sample.P },
    errors: { ...sample.errors },
    auxiliary: {
      basePose: { ...sample.auxiliary.basePose },
      renderPoseOffset: { ...sample.auxiliary.renderPoseOffset },
      rotationCenter: { ...sample.auxiliary.rotationCenter },
      expectedPoseForComparison: { ...sample.auxiliary.expectedPoseForComparison },
    },
  }
}

function buildObjPoseMappingRepresentativeSamples(
  samples: ObjPoseMappingSample[],
  topSamples: ObjPoseMappingSampleCompact[],
  bestSampleByPose: Map<string, ObjPoseMappingSample>,
  byGroup: ObjPoseMappingStatistics["byGroup"],
): ObjPoseMappingSampleCompact[] {
  const representatives = new Map<string, ObjPoseMappingSampleCompact>()
  const addSample = (sample: ObjPoseMappingSample | ObjPoseMappingSampleCompact | null) => {
    if (!sample || representatives.has(sample.sampleId)) {
      return
    }
    representatives.set(
      sample.sampleId,
      "detected" in sample ? compactObjPoseMappingSample(sample)! : sample,
    )
  }

  topSamples.forEach(addSample)
  bestSampleByPose.forEach(addSample)
  byGroup.forEach((group) => addSample(group.bestSample))

  addExtremeObjPoseMappingSamples(samples, "yaw", addSample)
  addExtremeObjPoseMappingSamples(samples, "pitch", addSample)
  addExtremeObjPoseMappingSamples(samples, "roll", addSample)

  if (samples.length > 0) {
    const interval = Math.max(1, Math.floor(samples.length / OBJ_POSE_MAPPING_INTERVAL_SAMPLE_TARGET_COUNT))
    for (let index = 0; index < samples.length; index += interval) {
      addSample(samples[index])
      if (representatives.size >= OBJ_POSE_MAPPING_MAX_REPRESENTATIVE_SAMPLE_COUNT) {
        break
      }
    }
  }

  return [...representatives.values()].slice(0, OBJ_POSE_MAPPING_MAX_REPRESENTATIVE_SAMPLE_COUNT)
}

function addExtremeObjPoseMappingSamples(
  samples: ObjPoseMappingSample[],
  axis: keyof ObjPoseMappingPose,
  addSample: (sample: ObjPoseMappingSample | null) => void,
) {
  const detectedSamples = getDetectedObjPoseMappingSamples(samples)
  if (detectedSamples.length === 0) {
    return
  }
  const sorted = detectedSamples.slice().sort((a, b) => a.p[axis] - b.p[axis])
  addSample(sorted[0])
  addSample(sorted[sorted.length - 1])
}

function applyObjPoseComparisonSign(pose: { yaw: number; pitch: number; roll: number }) {
  return {
    yaw: pose.yaw * OBJ_POSE_COMPARISON_SIGN.yaw,
    pitch: pose.pitch * OBJ_POSE_COMPARISON_SIGN.pitch,
    roll: pose.roll * OBJ_POSE_COMPARISON_SIGN.roll,
  }
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

async function startModeComparison() {
  if (state.modeComparison.status === "running") {
    return
  }

  if (!isVideoFileInput() || !state.liveVideo.loaded) {
    state.modeComparison = {
      ...createDefaultModeComparisonState(),
      status: "error",
      completedAt: new Date().toISOString(),
      errorMessage: "MP4読込を完了してからモード比較を開始してください。",
    }
    addLog("モード比較を開始できません。先にMP4読込を実行してください。")
    renderAll()
    return
  }

  if (!liveVideoElement.requestVideoFrameCallback) {
    state.modeComparison = {
      ...createDefaultModeComparisonState(),
      status: "error",
      completedAt: new Date().toISOString(),
      errorMessage: "このブラウザでは requestVideoFrameCallback（動画フレーム単位コールバック）が使えないため、比較実験は実行できません。",
    }
    addLog("requestVideoFrameCallback が使えないため、モード比較を実行できません。")
    renderAll()
    return
  }

  stopRealtimeValidation("stopped")
  liveAnalysisRequestId += 1
  liveAnalysisInProgress = false
  modeComparisonRunId += 1
  const runId = modeComparisonRunId
  modeComparisonFrames = []
  state.modeComparison = {
    ...createDefaultModeComparisonState(),
    status: "running",
    startedAt: new Date().toISOString(),
  }
  state.activePreviewTab = "live"
  addLog("モード比較を開始しました。IMAGE mode（静止画モード）と VIDEO mode（動画モード）を同じ canvas frame で比較します。")
  renderAll()

  try {
    const { imageLandmarker, videoLandmarker } = await getModeComparisonLandmarkers()
    if (state.modeComparison.status !== "running" || runId !== modeComparisonRunId) {
      return
    }

    await prepareModeComparisonVideo()
    if (state.modeComparison.status !== "running" || runId !== modeComparisonRunId) {
      return
    }

    const width = liveVideoElement.videoWidth || state.liveVideo.width || 0
    const height = liveVideoElement.videoHeight || state.liveVideo.height || 0
    if (width <= 0 || height <= 0) {
      throw new Error("videoWidth / videoHeight が取得できません。")
    }
    modeComparisonCanvas.width = width
    modeComparisonCanvas.height = height
    state.modeComparison = {
      ...state.modeComparison,
      lastTimestampMs: null,
      lastMediaTimeSec: null,
      lastPresentedFrames: null,
      errorMessage: null,
    }
    syncLiveVideoMetadata()
    renderAll()

    registerModeComparisonFrameCallback(runId, imageLandmarker, videoLandmarker)
    await liveVideoElement.play()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Mode comparison failed", error)
    finishModeComparison("error", message)
  }
}

async function prepareModeComparisonVideo() {
  liveVideoElement.pause()
  liveVideoElement.muted = true
  liveVideoElement.playsInline = true
  liveVideoElement.playbackRate = 1.0
  await waitForLiveVideoMetadataReady()
  liveVideoElement.currentTime = 0
  await waitForLiveVideoSeekedOrReady()
  syncLiveCurrentTime()
}

function waitForLiveVideoMetadataReady() {
  if (liveVideoElement.readyState >= HTMLMediaElement.HAVE_METADATA) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    const onLoadedMetadata = () => {
      cleanupListeners()
      resolve()
    }
    const onError = () => {
      cleanupListeners()
      reject(new Error(liveVideoElement.error?.message || "MP4 metadata の取得に失敗しました。"))
    }
    const cleanupListeners = () => {
      liveVideoElement.removeEventListener("loadedmetadata", onLoadedMetadata)
      liveVideoElement.removeEventListener("error", onError)
    }
    liveVideoElement.addEventListener("loadedmetadata", onLoadedMetadata, { once: true })
    liveVideoElement.addEventListener("error", onError, { once: true })
  })
}

function waitForLiveVideoSeekedOrReady() {
  if (Math.abs(liveVideoElement.currentTime) < 0.001 && liveVideoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve) => {
    const onSeeked = () => {
      cleanupListeners()
      resolve()
    }
    const onLoadedData = () => {
      cleanupListeners()
      resolve()
    }
    const cleanupListeners = () => {
      liveVideoElement.removeEventListener("seeked", onSeeked)
      liveVideoElement.removeEventListener("loadeddata", onLoadedData)
    }
    liveVideoElement.addEventListener("seeked", onSeeked, { once: true })
    liveVideoElement.addEventListener("loadeddata", onLoadedData, { once: true })
  })
}

function registerModeComparisonFrameCallback(
  runId: number,
  imageLandmarker: FaceLandmarker,
  videoLandmarker: FaceLandmarker,
) {
  const requestVideoFrameCallback = liveVideoElement.requestVideoFrameCallback
  if (!requestVideoFrameCallback) {
    finishModeComparison("error", "requestVideoFrameCallback が利用できません。")
    return
  }

  modeComparisonVideoFrameCallbackId = requestVideoFrameCallback.call(
    liveVideoElement,
    (_now, metadata) => {
      processModeComparisonFrame(runId, metadata, imageLandmarker, videoLandmarker)
    },
  )
}

function processModeComparisonFrame(
  runId: number,
  metadata: VideoFrameCallbackMetadataLike,
  imageLandmarker: FaceLandmarker,
  videoLandmarker: FaceLandmarker,
) {
  if (runId !== modeComparisonRunId || state.modeComparison.status !== "running") {
    return
  }

  if (modeComparisonFrames.length >= MODE_COMPARISON_MAX_FRAMES) {
    finishModeComparison("completed")
    return
  }

  const mediaTimeSec = metadata.mediaTime
  if (!Number.isFinite(mediaTimeSec)) {
    state.modeComparison = {
      ...state.modeComparison,
      skippedFrameCount: state.modeComparison.skippedFrameCount + 1,
      errorMessage: "metadata.mediaTime が取得できないフレームを skip しました。",
    }
    registerModeComparisonFrameCallback(runId, imageLandmarker, videoLandmarker)
    return
  }

  const timestampMs = mediaTimeSec * 1000
  if (
    state.modeComparison.lastTimestampMs !== null &&
    timestampMs <= state.modeComparison.lastTimestampMs
  ) {
    state.modeComparison = {
      ...state.modeComparison,
      skippedFrameCount: state.modeComparison.skippedFrameCount + 1,
      lastMediaTimeSec: mediaTimeSec,
      errorMessage: "同一または巻き戻り timestamp のフレームを skip しました。",
    }
    renderModeComparisonControls()
    registerModeComparisonFrameCallback(runId, imageLandmarker, videoLandmarker)
    return
  }

  try {
    const frameStartMs = performance.now()
    const context = modeComparisonCanvas.getContext("2d")
    if (!context) {
      throw new Error("mode comparison canvas context を取得できません。")
    }

    const drawStartMs = performance.now()
    context.drawImage(liveVideoElement, 0, 0, modeComparisonCanvas.width, modeComparisonCanvas.height)
    const drawImageMs = performance.now() - drawStartMs

    const imageDetectStartMs = performance.now()
    const imageResult = imageLandmarker.detect(modeComparisonCanvas)
    const imageDetectMs = performance.now() - imageDetectStartMs

    const videoDetectStartMs = performance.now()
    const videoResult = videoLandmarker.detectForVideo(modeComparisonCanvas, timestampMs)
    const videoDetectMs = performance.now() - videoDetectStartMs
    const totalFrameProcessingMs = performance.now() - frameStartMs

    const presentedFrames = Number.isFinite(metadata.presentedFrames)
      ? metadata.presentedFrames ?? null
      : null
    const presentedFramesDelta =
      presentedFrames !== null && state.modeComparison.lastPresentedFrames !== null
        ? presentedFrames - state.modeComparison.lastPresentedFrames
        : null

    const frame = buildModeComparisonFrameResult({
      frameIndex: modeComparisonFrames.length + 1,
      mediaTimeSec,
      timestampMs,
      presentedFrames,
      presentedFramesDelta,
      drawImageMs,
      imageDetectMs,
      videoDetectMs,
      totalFrameProcessingMs,
      imageResult,
      videoResult,
    })
    modeComparisonFrames.push(frame)
    updateModeComparisonPreviewSnapshots(frame)

    state.modeComparison = {
      ...state.modeComparison,
      progressFrameCount: modeComparisonFrames.length,
      lastTimestampMs: timestampMs,
      lastMediaTimeSec: mediaTimeSec,
      lastPresentedFrames: presentedFrames,
      errorMessage: null,
    }

    if (modeComparisonFrames.length % 10 === 0) {
      renderModeComparisonControls()
      if (state.activeDebugTab === "modeComparison") {
        renderDebugContent()
      }
    }

    if (modeComparisonFrames.length >= MODE_COMPARISON_MAX_FRAMES || liveVideoElement.ended) {
      finishModeComparison("completed")
      return
    }

    registerModeComparisonFrameCallback(runId, imageLandmarker, videoLandmarker)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    finishModeComparison("error", message)
  }
}

function buildModeComparisonFrameResult(input: {
  frameIndex: number
  mediaTimeSec: number
  timestampMs: number
  presentedFrames: number | null
  presentedFramesDelta: number | null
  drawImageMs: number
  imageDetectMs: number
  videoDetectMs: number
  totalFrameProcessingMs: number
  imageResult: FaceLandmarkerResultLike
  videoResult: FaceLandmarkerResultLike
}): ModeComparisonFrameResult {
  const imageLandmarks = input.imageResult.faceLandmarks[0] ?? []
  const videoLandmarks = input.videoResult.faceLandmarks[0] ?? []
  const imageDetected = input.imageResult.faceLandmarks.length > 0
  const videoDetected = input.videoResult.faceLandmarks.length > 0
  const imagePose = estimateNullablePose(input.imageResult.facialTransformationMatrixes[0])
  const videoPose = estimateNullablePose(input.videoResult.facialTransformationMatrixes[0])
  const poseDiff = calculateModeComparisonPoseDiff(imagePose, videoPose)
  const landmarkDiff =
    imageLandmarks.length === REQUIRED_LANDMARK_COUNT && videoLandmarks.length === REQUIRED_LANDMARK_COUNT
      ? calculateModeComparisonLandmarkDiff(imageLandmarks, videoLandmarks)
      : null

  return {
    frameIndex: input.frameIndex,
    mediaTimeSec: input.mediaTimeSec,
    timestampMs: input.timestampMs,
    timestampSource: "metadata.mediaTime",
    presentedFrames: input.presentedFrames,
    presentedFramesDelta: input.presentedFramesDelta,
    drawImageMs: input.drawImageMs,
    imageDetectMs: input.imageDetectMs,
    videoDetectMs: input.videoDetectMs,
    totalFrameProcessingMs: input.totalFrameProcessingMs,
    imageDetectSuccess: imageDetected,
    videoDetectSuccess: videoDetected,
    imageDetected,
    videoDetected,
    imageLandmarkCount: imageLandmarks.length,
    videoLandmarkCount: videoLandmarks.length,
    imagePose,
    videoPose,
    poseDiff,
    absPoseDiff: {
      yaw: poseDiff.absYaw,
      pitch: poseDiff.absPitch,
      roll: poseDiff.absRoll,
    },
    mean2dDistance: landmarkDiff?.mean2dDistance ?? null,
    max2dDistance: landmarkDiff?.max2dDistance ?? null,
    mean3dDistance: landmarkDiff?.mean3dDistance ?? null,
    max3dDistance: landmarkDiff?.max3dDistance ?? null,
    landmarkDiff,
    errorMessage: null,
  }
}

function updateModeComparisonPreviewSnapshots(frame: ModeComparisonFrameResult) {
  const nextSnapshots = {
    ...state.modeComparison.previewSnapshots,
  }
  nextSnapshots.latest = createModeComparisonPreviewSnapshot("latest", frame)

  const currentWorstPoseFrame = findFrameBySnapshot(nextSnapshots.worst_pose_diff)
  const framePoseMagnitude = getModeComparisonPoseMagnitude(frame)
  if (
    framePoseMagnitude !== null &&
    (!currentWorstPoseFrame ||
      framePoseMagnitude > (getModeComparisonPoseMagnitude(currentWorstPoseFrame) ?? Number.NEGATIVE_INFINITY))
  ) {
    nextSnapshots.worst_pose_diff = createModeComparisonPreviewSnapshot("worst_pose_diff", frame)
  }

  const currentWorstLandmarkFrame = findFrameBySnapshot(nextSnapshots.worst_landmark_diff)
  if (
    frame.max2dDistance !== null &&
    (!currentWorstLandmarkFrame ||
      frame.max2dDistance > (currentWorstLandmarkFrame.max2dDistance ?? Number.NEGATIVE_INFINITY))
  ) {
    nextSnapshots.worst_landmark_diff = createModeComparisonPreviewSnapshot("worst_landmark_diff", frame)
  }

  if (!nextSnapshots.first_mismatch && frame.imageDetected !== frame.videoDetected) {
    nextSnapshots.first_mismatch = createModeComparisonPreviewSnapshot("first_mismatch", frame)
  }

  state.modeComparison = {
    ...state.modeComparison,
    previewSnapshots: enforceModeComparisonPreviewSnapshotLimit(nextSnapshots),
  }
}

function createModeComparisonPreviewSnapshot(
  kind: ModeComparisonPreviewKind,
  frame: ModeComparisonFrameResult,
): ModeComparisonPreviewSnapshot {
  return {
    kind,
    frameIndex: frame.frameIndex,
    mediaTimeSec: frame.mediaTimeSec,
    timestampMs: frame.timestampMs,
    dataUrl: modeComparisonCanvas.toDataURL("image/png"),
    createdAt: new Date().toISOString(),
  }
}

function enforceModeComparisonPreviewSnapshotLimit(
  snapshots: Record<ModeComparisonPreviewKind, ModeComparisonPreviewSnapshot | null>,
) {
  const storedCount = Object.values(snapshots).filter(Boolean).length
  if (storedCount <= MODE_COMPARISON_MAX_PREVIEW_SNAPSHOTS) {
    return snapshots
  }
  return {
    latest: snapshots.latest,
    worst_pose_diff: snapshots.worst_pose_diff,
    worst_landmark_diff: snapshots.worst_landmark_diff,
    first_mismatch: snapshots.first_mismatch,
  }
}

function findFrameBySnapshot(snapshot: ModeComparisonPreviewSnapshot | null) {
  if (!snapshot) {
    return null
  }
  return modeComparisonFrames.find((frame) => frame.frameIndex === snapshot.frameIndex) ?? null
}

function getModeComparisonPoseMagnitude(frame: ModeComparisonFrameResult) {
  const values = [
    frame.absPoseDiff.yaw,
    frame.absPoseDiff.pitch,
    frame.absPoseDiff.roll,
  ]
  if (values.every((value) => value === null)) {
    return null
  }
  return Math.hypot(...values.map((value) => value ?? 0))
}

function calculateModeComparisonPoseDiff(
  imagePose: ReferencePose,
  videoPose: ReferencePose,
): ModeComparisonPoseDiff {
  const yaw = subtractNullable(videoPose.yaw, imagePose.yaw)
  const pitch = subtractNullable(videoPose.pitch, imagePose.pitch)
  const roll = subtractNullable(videoPose.roll, imagePose.roll)
  return {
    yaw,
    pitch,
    roll,
    absYaw: yaw === null ? null : Math.abs(yaw),
    absPitch: pitch === null ? null : Math.abs(pitch),
    absRoll: roll === null ? null : Math.abs(roll),
  }
}

function calculateModeComparisonLandmarkDiff(
  imageLandmarks: NormalizedLandmark[],
  videoLandmarks: NormalizedLandmark[],
): ModeComparisonLandmarkDiff {
  let sum2d = 0
  let sum3d = 0
  let max2d = 0
  let max3d = 0
  let noIrisSum2d = 0
  let noIrisCount = 0
  let irisSum2d = 0
  let irisCount = 0
  const landmarkDeltas: ModeComparisonLandmarkDiff["landmarkDeltas"] = []

  for (let index = 0; index < REQUIRED_LANDMARK_COUNT; index += 1) {
    const imageLandmark = imageLandmarks[index]
    const videoLandmark = videoLandmarks[index]
    const dx = videoLandmark.x - imageLandmark.x
    const dy = videoLandmark.y - imageLandmark.y
    const dz = videoLandmark.z - imageLandmark.z
    const distance2d = Math.hypot(dx, dy)
    const distance3d = Math.hypot(dx, dy, dz)
    sum2d += distance2d
    sum3d += distance3d
    max2d = Math.max(max2d, distance2d)
    max3d = Math.max(max3d, distance3d)
    if (index >= 468 && index <= 477) {
      irisSum2d += distance2d
      irisCount += 1
    } else {
      noIrisSum2d += distance2d
      noIrisCount += 1
    }
    landmarkDeltas.push({ index, dx, dy, dz })
  }

  return {
    mean2dDistance: sum2d / REQUIRED_LANDMARK_COUNT,
    max2dDistance: max2d,
    mean3dDistance: sum3d / REQUIRED_LANDMARK_COUNT,
    max3dDistance: max3d,
    mean2dDistanceNoIris: noIrisCount > 0 ? noIrisSum2d / noIrisCount : null,
    mean2dDistanceIris: irisCount > 0 ? irisSum2d / irisCount : null,
    landmarkDeltas,
  }
}

function cancelModeComparison() {
  if (state.modeComparison.status !== "running") {
    return
  }
  finishModeComparison("canceled", "ユーザー操作で cancel しました。")
}

function finishModeComparison(status: ModeComparisonStatus, errorMessage: string | null = null) {
  if (modeComparisonVideoFrameCallbackId !== null && liveVideoElement.cancelVideoFrameCallback) {
    liveVideoElement.cancelVideoFrameCallback(modeComparisonVideoFrameCallbackId)
  }
  modeComparisonVideoFrameCallbackId = null
  liveVideoElement.pause()
  syncLiveCurrentTime()
  const result = buildModeComparisonExport(modeComparisonFrames, state.modeComparison.skippedFrameCount)
  state.modeComparison = {
    ...state.modeComparison,
    status,
    completedAt: new Date().toISOString(),
    progressFrameCount: modeComparisonFrames.length,
    errorMessage,
    result,
  }
  addLog(`モード比較を終了しました: ${formatModeComparisonStatus(status)} / processed ${modeComparisonFrames.length} / skipped ${state.modeComparison.skippedFrameCount}`)
  renderAll()
}

function buildModeComparisonExport(
  frames: ModeComparisonFrameResult[],
  skippedFrameCount: number,
): ModeComparisonExport {
  const createdAt = new Date().toISOString()
  return {
    type: "mediapipe_mode_comparison_v1",
    createdAt,
    source: {
      filename: state.liveVideo.fileName,
      durationSec: state.liveVideo.durationSec,
      videoWidth: state.liveVideo.width,
      videoHeight: state.liveVideo.height,
      readyState: liveVideoElement.readyState,
    },
    runOptions: {
      maxFrames: MODE_COMPARISON_MAX_FRAMES,
      delegate: "GPU",
      frameDriver: "requestVideoFrameCallback",
      imageMode: "IMAGE",
      videoMode: "VIDEO",
      timestampSource: "metadata.mediaTime",
      sameCanvasFrame: true,
    },
    summary: summarizeModeComparisonFrames(frames, skippedFrameCount),
    frames,
  }
}

function summarizeModeComparisonFrames(
  frames: ModeComparisonFrameResult[],
  skippedFrameCount: number,
): ModeComparisonSummary {
  const bothSuccessCount = frames.filter((frame) => frame.imageDetected && frame.videoDetected).length
  const imageOnlySuccessCount = frames.filter((frame) => frame.imageDetected && !frame.videoDetected).length
  const videoOnlySuccessCount = frames.filter((frame) => !frame.imageDetected && frame.videoDetected).length
  const bothFailedCount = frames.filter((frame) => !frame.imageDetected && !frame.videoDetected).length
  return {
    processedFrameCount: frames.length,
    skippedFrameCount,
    imageDetectSuccessCount: frames.filter((frame) => frame.imageDetected).length,
    videoDetectSuccessCount: frames.filter((frame) => frame.videoDetected).length,
    bothSuccessCount,
    imageOnlySuccessCount,
    videoOnlySuccessCount,
    bothFailedCount,
    mismatchCount: frames.filter((frame) => frame.imageDetected !== frame.videoDetected).length,
    timing: {
      drawImageMs: summarizeNullableNumbers(frames.map((frame) => frame.drawImageMs)),
      imageDetectMs: summarizeNullableNumbers(frames.map((frame) => frame.imageDetectMs)),
      videoDetectMs: summarizeNullableNumbers(frames.map((frame) => frame.videoDetectMs)),
      totalFrameProcessingMs: summarizeNullableNumbers(frames.map((frame) => frame.totalFrameProcessingMs)),
    },
    poseDiff: {
      yaw: summarizeNullableNumbers(frames.map((frame) => frame.poseDiff.yaw)),
      pitch: summarizeNullableNumbers(frames.map((frame) => frame.poseDiff.pitch)),
      roll: summarizeNullableNumbers(frames.map((frame) => frame.poseDiff.roll)),
      absYaw: summarizeNullableNumbers(frames.map((frame) => frame.poseDiff.absYaw)),
      absPitch: summarizeNullableNumbers(frames.map((frame) => frame.poseDiff.absPitch)),
      absRoll: summarizeNullableNumbers(frames.map((frame) => frame.poseDiff.absRoll)),
      magnitude: summarizeNullableNumbers(frames.map(getModeComparisonPoseMagnitude)),
    },
    landmarkDiff: {
      mean2dDistance: summarizeNullableNumbers(frames.map((frame) => frame.landmarkDiff?.mean2dDistance ?? null)),
      max2dDistance: summarizeNullableNumbers(frames.map((frame) => frame.landmarkDiff?.max2dDistance ?? null)),
      mean3dDistance: summarizeNullableNumbers(frames.map((frame) => frame.landmarkDiff?.mean3dDistance ?? null)),
      max3dDistance: summarizeNullableNumbers(frames.map((frame) => frame.landmarkDiff?.max3dDistance ?? null)),
      mean2dDistanceNoIris: summarizeNullableNumbers(frames.map((frame) => frame.landmarkDiff?.mean2dDistanceNoIris ?? null)),
      mean2dDistanceIris: summarizeNullableNumbers(frames.map((frame) => frame.landmarkDiff?.mean2dDistanceIris ?? null)),
    },
    presentedFramesDelta: summarizeNullableNumbers(frames.map((frame) => frame.presentedFramesDelta)),
    importantFrames: getModeComparisonImportantFrames(frames),
  }
}

function getModeComparisonImportantFrames(frames: ModeComparisonFrameResult[]): ModeComparisonImportantFrames {
  return {
    worstYawDiffFrame: createModeComparisonFrameRef(findMaxModeComparisonFrame(frames, (frame) => frame.poseDiff.absYaw)),
    worstPitchDiffFrame: createModeComparisonFrameRef(findMaxModeComparisonFrame(frames, (frame) => frame.poseDiff.absPitch)),
    worstRollDiffFrame: createModeComparisonFrameRef(findMaxModeComparisonFrame(frames, (frame) => frame.poseDiff.absRoll)),
    worstPoseMagnitudeDiffFrame: createModeComparisonFrameRef(findMaxModeComparisonFrame(frames, getModeComparisonPoseMagnitude)),
    worstMean2dDistanceFrame: createModeComparisonFrameRef(findMaxModeComparisonFrame(frames, (frame) => frame.mean2dDistance)),
    worstMax2dDistanceFrame: createModeComparisonFrameRef(findMaxModeComparisonFrame(frames, (frame) => frame.max2dDistance)),
    firstMismatchFrame: createModeComparisonFrameRef(frames.find((frame) => frame.imageDetected !== frame.videoDetected) ?? null),
    latestFrame: createModeComparisonFrameRef(frames[frames.length - 1] ?? null),
  }
}

function findMaxModeComparisonFrame(
  frames: ModeComparisonFrameResult[],
  getValue: (frame: ModeComparisonFrameResult) => number | null,
) {
  let bestFrame: ModeComparisonFrameResult | null = null
  let bestValue = Number.NEGATIVE_INFINITY
  frames.forEach((frame) => {
    const value = getValue(frame)
    if (value !== null && Number.isFinite(value) && value > bestValue) {
      bestFrame = frame
      bestValue = value
    }
  })
  return bestFrame
}

function createModeComparisonFrameRef(
  frame: ModeComparisonFrameResult | null,
): ModeComparisonImportantFrameRef {
  if (!frame) {
    return null
  }
  return {
    frameIndex: frame.frameIndex,
    mediaTimeSec: frame.mediaTimeSec,
    timestampMs: frame.timestampMs,
  }
}

function summarizeNullableNumbers(values: Array<number | null>): TimingDistribution {
  const finiteValues = values.filter((value): value is number => Number.isFinite(value))
  if (finiteValues.length === 0) {
    return createEmptyTimingDistribution()
  }
  const sortedValues = [...finiteValues].sort((a, b) => a - b)
  const total = finiteValues.reduce((sum, value) => sum + value, 0)
  return {
    average: total / finiteValues.length,
    p50: getPercentile(sortedValues, 0.5),
    p95: getPercentile(sortedValues, 0.95),
    max: sortedValues[sortedValues.length - 1],
  }
}

function getPercentile(sortedValues: number[], percentile: number) {
  if (sortedValues.length === 0) {
    return null
  }
  const index = Math.min(sortedValues.length - 1, Math.max(0, Math.ceil(sortedValues.length * percentile) - 1))
  return sortedValues[index]
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
  const canUseMp4Debug =
    isVideoFileInput() &&
    state.realtimeDebug.status !== "running" &&
    state.modeComparison.status !== "running" &&
    !poseSearchRunning
  range.max = String(duration)
  range.value = String(clamp(state.liveVideo.currentTimeSec ?? 0, 0, duration))
  range.disabled = !canUseMp4Debug

  setDisabled('[data-action="load-obj"]', poseSearchRunning)
  setDisabled(
    '[data-action="load-live-video"]',
    poseSearchRunning || isObjPoseCalibrationRunning() || state.modeComparison.status === "running",
  )
  setDisabled(
    '[data-action="obj-pose-calibration-start"]',
    poseSearchRunning || state.modeComparison.status === "running" || !canRenderRenderedIdealGeometry(),
  )
  getElement<HTMLSelectElement>('[data-control="obj-pose-sampling-preset"]').value = state.objPoseMapping.poseSamplingPreset
  setDisabled('[data-control="obj-pose-sampling-preset"]', poseSearchRunning || isObjPoseCalibrationRunning())
  objFileInput.disabled = poseSearchRunning
  liveFileInput.disabled = poseSearchRunning || state.modeComparison.status === "running"
  setDisabled('[data-action="live-play"]', poseSearchRunning || state.modeComparison.status === "running" || !isVideoFileInput() || state.liveVideo.playbackStatus === "playing")
  setDisabled('[data-action="live-pause"]', poseSearchRunning || state.modeComparison.status === "running" || !isVideoFileInput() || state.liveVideo.playbackStatus !== "playing")
  setDisabled('[data-action="live-analyze-current"]', !canUseMp4Debug || liveAnalysisInProgress || state.modeComparison.status === "running")

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
  getElement<HTMLSelectElement>('[data-control="render-appearance-profile"]').value =
    state.renderedIdeal.renderAppearanceProfileId
  setDisabled('[data-action="rendered-ideal-refresh"]', poseSearchRunning || !canRenderRenderedIdealGeometry())

  renderLiveAnalysisCard()
  renderModeComparisonControls()
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

function renderModeComparisonControls() {
  const modeComparison = state.modeComparison
  setDisabled(
    '[data-action="mode-comparison-start"]',
    isPoseCenterSearchRunning() ||
      isObjPoseCalibrationRunning() ||
      state.realtimeDebug.status === "running" ||
      modeComparison.status === "running" ||
      !isVideoFileInput(),
  )
  setDisabled('[data-action="mode-comparison-cancel"]', modeComparison.status !== "running")
}

function renderModeComparisonDebugTab() {
  const container = document.createElement("div")
  container.className = "mode-comparison-debug"
  const comparison = state.modeComparison
  const result = comparison.result
  const summary =
    result?.summary ?? summarizeModeComparisonFrames(modeComparisonFrames, comparison.skippedFrameCount)
  const frames = result?.frames ?? modeComparisonFrames
  const latestFrame = getModeComparisonFrameByRef(frames, summary.importantFrames.latestFrame)
  const worstPoseFrame = getModeComparisonFrameByRef(frames, summary.importantFrames.worstPoseMagnitudeDiffFrame)
  const worstLandmarkFrame = getModeComparisonFrameByRef(frames, summary.importantFrames.worstMax2dDistanceFrame)
  const firstMismatchFrame = getModeComparisonFrameByRef(frames, summary.importantFrames.firstMismatchFrame)
  const hasResult = result !== null

  container.innerHTML = `
    <section class="debug-section">
      <h3>Source（入力情報）</h3>
      <dl class="summary-list">
        <div><dt>MP4 filename（MP4ファイル名）</dt><dd>${escapeHtml(state.liveInput.fileName ?? "未選択")}</dd></div>
        <div><dt>duration（長さ）</dt><dd>${formatNullableNumber(state.liveInput.durationSec)}</dd></div>
        <div><dt>videoWidth / videoHeight（動画幅 / 高さ）</dt><dd>${formatNullableCount(state.liveInput.width)} / ${formatNullableCount(state.liveInput.height)}</dd></div>
        <div><dt>readyState（状態）</dt><dd>${formatNullableCount(state.liveInput.readyState)}</dd></div>
        <div><dt>liveVideoStatus</dt><dd>${escapeHtml(state.liveVideo.status)}</dd></div>
      </dl>
    </section>

    <section class="debug-section">
      <h3>Run status（実行状態）</h3>
      <dl class="summary-list">
        <div><dt>modeComparisonStatus</dt><dd>${formatModeComparisonStatus(comparison.status)} (${comparison.status})</dd></div>
        <div><dt>progress（進捗）</dt><dd>${comparison.progressFrameCount} / ${comparison.maxFrames}</dd></div>
        <div><dt>processedFrameCount（比較済みフレーム数）</dt><dd>${summary.processedFrameCount}</dd></div>
        <div><dt>skippedFrameCount（スキップ数）</dt><dd>${summary.skippedFrameCount}</dd></div>
        <div><dt>maxFrames</dt><dd>${comparison.maxFrames}</dd></div>
        <div><dt>startedAt</dt><dd>${escapeHtml(comparison.startedAt ?? "-")}</dd></div>
        <div><dt>completedAt</dt><dd>${escapeHtml(comparison.completedAt ?? "-")}</dd></div>
        <div><dt>errorMessage</dt><dd>${escapeHtml(comparison.errorMessage ?? "-")}</dd></div>
      </dl>
    </section>

    <section class="debug-section">
      <h3>Run options（実行条件）</h3>
      <dl class="summary-list">
        <div><dt>delegate GPU（GPU実行）</dt><dd>GPU</dd></div>
        <div><dt>frameDriver</dt><dd>requestVideoFrameCallback（動画フレーム単位コールバック）</dd></div>
        <div><dt>imageMode</dt><dd>IMAGE mode（静止画モード） / detect(canvas)</dd></div>
        <div><dt>videoMode</dt><dd>VIDEO mode（動画モード） / detectForVideo(canvas, timestampMs)</dd></div>
        <div><dt>timestampSource</dt><dd>metadata.mediaTime</dd></div>
        <div><dt>sameCanvasFrame（同一キャンバスフレーム）</dt><dd>true</dd></div>
        <div><dt>同一フレーム保証</dt><dd>MP4現在フレームを1回だけ固定 canvas に drawImage し、その同じ canvas を detect() と detectForVideo() に渡します。</dd></div>
      </dl>
    </section>

    <section class="debug-section">
      <h3>Detection summary（検出結果要約）</h3>
      <dl class="summary-list">
        <div><dt>imageDetectSuccessCount</dt><dd>${summary.imageDetectSuccessCount}</dd></div>
        <div><dt>videoDetectSuccessCount</dt><dd>${summary.videoDetectSuccessCount}</dd></div>
        <div><dt>bothSuccessCount</dt><dd>${summary.bothSuccessCount}</dd></div>
        <div><dt>imageOnlySuccessCount</dt><dd>${summary.imageOnlySuccessCount}</dd></div>
        <div><dt>videoOnlySuccessCount</dt><dd>${summary.videoOnlySuccessCount}</dd></div>
        <div><dt>bothFailedCount</dt><dd>${summary.bothFailedCount}</dd></div>
        <div><dt>mismatchCount</dt><dd>${summary.mismatchCount}</dd></div>
      </dl>
    </section>

    <section class="debug-section">
      <h3>Timing summary（速度要約）</h3>
      <dl class="summary-list">
        <div><dt>detect() ms</dt><dd>${formatTimingDistribution(summary.timing.imageDetectMs)}</dd></div>
        <div><dt>detectForVideo() ms</dt><dd>${formatTimingDistribution(summary.timing.videoDetectMs)}</dd></div>
        <div><dt>drawImage ms</dt><dd>${formatTimingDistribution(summary.timing.drawImageMs)}</dd></div>
        <div><dt>total frame processing ms</dt><dd>${formatTimingDistribution(summary.timing.totalFrameProcessingMs)}</dd></div>
      </dl>
    </section>

    <section class="debug-section">
      <h3>Pose diff（姿勢差分）</h3>
      <p class="control-note">差分方向は VIDEO mode（動画モード） - IMAGE mode（静止画モード）です。</p>
      <dl class="summary-list">
        <div><dt>yaw diff（yaw差分）</dt><dd>${formatTimingDistribution(summary.poseDiff.yaw)}</dd></div>
        <div><dt>pitch diff（pitch差分）</dt><dd>${formatTimingDistribution(summary.poseDiff.pitch)}</dd></div>
        <div><dt>roll diff（roll差分）</dt><dd>${formatTimingDistribution(summary.poseDiff.roll)}</dd></div>
        <div><dt>absolute yaw diff（絶対yaw差分）</dt><dd>${formatTimingDistribution(summary.poseDiff.absYaw)}</dd></div>
        <div><dt>absolute pitch diff（絶対pitch差分）</dt><dd>${formatTimingDistribution(summary.poseDiff.absPitch)}</dd></div>
        <div><dt>absolute roll diff（絶対roll差分）</dt><dd>${formatTimingDistribution(summary.poseDiff.absRoll)}</dd></div>
        <div><dt>pose magnitude diff（姿勢差分量）</dt><dd>${formatTimingDistribution(summary.poseDiff.magnitude)}</dd></div>
      </dl>
    </section>

    <section class="debug-section">
      <h3>Landmark diff（ランドマーク差分）</h3>
      <dl class="summary-list">
        <div><dt>mean2dDistance</dt><dd>${formatTimingDistribution(summary.landmarkDiff.mean2dDistance)}</dd></div>
        <div><dt>max2dDistance</dt><dd>${formatTimingDistribution(summary.landmarkDiff.max2dDistance)}</dd></div>
        <div><dt>mean3dDistance</dt><dd>${formatTimingDistribution(summary.landmarkDiff.mean3dDistance)}</dd></div>
        <div><dt>max3dDistance</dt><dd>${formatTimingDistribution(summary.landmarkDiff.max3dDistance)}</dd></div>
      </dl>
    </section>

    <section class="debug-section">
      <h3>Frame consistency（フレーム整合性）</h3>
      <dl class="summary-list">
        <div><dt>presentedFramesDelta summary</dt><dd>${formatTimingDistribution(summary.presentedFramesDelta)}</dd></div>
        <div><dt>dropped / skipped らしきフレーム数</dt><dd>${formatNullableCount(countLikelyDroppedModeComparisonFrames(frames))}</dd></div>
        <div><dt>timestamp monotonic skip count</dt><dd>${summary.skippedFrameCount}</dd></div>
        <div><dt>0.41秒ズレ対策</dt><dd>別々に video を読ませず、same canvas frame（同一キャンバスフレーム）を両方の API に渡します。</dd></div>
      </dl>
    </section>

    <section class="debug-section">
      <h3>Download（ダウンロード）</h3>
      <div class="button-row">
        <button class="small-button" type="button" data-action="mode-comparison-download-json" ${hasResult ? "" : "disabled"}>JSON download（JSONダウンロード）</button>
        <button class="small-button" type="button" data-action="mode-comparison-download-csv" ${hasResult ? "" : "disabled"}>CSV download（CSVダウンロード）</button>
      </div>
    </section>

    <section class="debug-section">
      <h3>Important frames（重要フレーム）</h3>
      <div class="mode-comparison-card-grid">
        ${renderModeComparisonFrameCard("latest frame result（最新フレーム結果）", latestFrame)}
        ${renderModeComparisonFrameCard("worst pose diff frame（姿勢差分最大フレーム）", worstPoseFrame)}
        ${renderModeComparisonFrameCard("worst landmark diff frame（ランドマーク差分最大フレーム）", worstLandmarkFrame)}
        ${renderModeComparisonFrameCard("first mismatch frame（最初の検出不一致フレーム）", firstMismatchFrame)}
      </div>
    </section>

    <section class="debug-section">
      <h3>preview export（プレビュー書き出し）</h3>
      <p class="control-note">全フレーム画像は保持せず、同じ canvas frame から作った重要フレーム preview snapshot のみ最大 ${MODE_COMPARISON_MAX_PREVIEW_SNAPSHOTS} 枚まで保持します。現在の実装では latest / worst pose diff / worst landmark diff / first mismatch の最大4枚です。</p>
      <div class="button-row preview-export-buttons">
        ${renderModeComparisonPreviewDownloadButton("latest", "Download latest preview（最新プレビューをダウンロード）")}
        ${renderModeComparisonPreviewDownloadButton("worst_pose_diff", "Download worst pose diff preview（姿勢差分最大プレビューをダウンロード）")}
        ${renderModeComparisonPreviewDownloadButton("worst_landmark_diff", "Download worst landmark diff preview（ランドマーク差分最大プレビューをダウンロード）")}
        ${renderModeComparisonPreviewDownloadButton("first_mismatch", "Download first mismatch preview（最初の不一致プレビューをダウンロード）")}
      </div>
      <p class="control-note">overlay preview（重ね表示プレビュー）は未実装です。現時点では raw frame preview（元フレーム画像）を保存します。</p>
    </section>
  `

  return container
}

function renderModeComparisonFrameCard(title: string, frame: ModeComparisonFrameResult | null) {
  if (!frame) {
    return `
      <article class="mode-comparison-frame-card">
        <h4>${escapeHtml(title)}</h4>
        <p class="placeholder-text">該当フレームはまだありません。</p>
      </article>
    `
  }

  return `
    <article class="mode-comparison-frame-card">
      <h4>${escapeHtml(title)}</h4>
      <dl class="summary-list">
        <div><dt>frameIndex</dt><dd>${frame.frameIndex}</dd></div>
        <div><dt>mediaTimeSec</dt><dd>${formatNumber(frame.mediaTimeSec)}</dd></div>
        <div><dt>timestampMs</dt><dd>${formatNumber(frame.timestampMs)}</dd></div>
        <div><dt>imagePose</dt><dd>${escapeHtml(formatPose(frame.imagePose))}</dd></div>
        <div><dt>videoPose</dt><dd>${escapeHtml(formatPose(frame.videoPose))}</dd></div>
        <div><dt>poseDiff</dt><dd>${escapeHtml(formatModeComparisonPoseDiff(frame.poseDiff))}</dd></div>
        <div><dt>absPoseDiff</dt><dd>${escapeHtml(formatModeComparisonAbsPoseDiff(frame.absPoseDiff))}</dd></div>
        <div><dt>mean2dDistance / max2dDistance</dt><dd>${formatNullableNumber(frame.mean2dDistance)} / ${formatNullableNumber(frame.max2dDistance)}</dd></div>
        <div><dt>imageDetectMs / videoDetectMs</dt><dd>${formatNullableNumber(frame.imageDetectMs)} / ${formatNullableNumber(frame.videoDetectMs)}</dd></div>
        <div><dt>imageDetectSuccess / videoDetectSuccess</dt><dd>${String(frame.imageDetectSuccess)} / ${String(frame.videoDetectSuccess)}</dd></div>
      </dl>
    </article>
  `
}

function renderModeComparisonPreviewDownloadButton(
  kind: ModeComparisonPreviewKind,
  label: string,
) {
  const snapshot = state.modeComparison.previewSnapshots[kind]
  return `
    <button class="small-button" type="button" data-action="mode-comparison-download-preview-${kind}" ${snapshot ? "" : "disabled"}>
      ${escapeHtml(label)}
    </button>
  `
}

function getModeComparisonFrameByRef(
  frames: ModeComparisonFrameResult[],
  ref: ModeComparisonImportantFrameRef,
) {
  if (!ref) {
    return null
  }
  return frames.find((frame) => frame.frameIndex === ref.frameIndex) ?? null
}

function countLikelyDroppedModeComparisonFrames(frames: ModeComparisonFrameResult[]) {
  const dropped = frames.filter((frame) =>
    frame.presentedFramesDelta !== null && frame.presentedFramesDelta > 1
  ).length
  return dropped
}

function formatModeComparisonPoseDiff(diff: ModeComparisonPoseDiff) {
  return `yaw ${formatNullableNumber(diff.yaw)} / pitch ${formatNullableNumber(diff.pitch)} / roll ${formatNullableNumber(diff.roll)}`
}

function formatModeComparisonAbsPoseDiff(diff: { yaw: number | null; pitch: number | null; roll: number | null }) {
  return `yaw ${formatNullableNumber(diff.yaw)} / pitch ${formatNullableNumber(diff.pitch)} / roll ${formatNullableNumber(diff.roll)}`
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

  const appearance = getAppliedObjRenderAppearanceProfile()
  const rect = canvas.getBoundingClientRect()
  const fallbackCssWidth = rect.width > 0 ? rect.width : RENDERED_IDEAL_FALLBACK_CANVAS_SIZE
  const fallbackCssHeight = rect.height > 0 ? rect.height : RENDERED_IDEAL_FALLBACK_CANVAS_SIZE
  const dpr = window.devicePixelRatio || 1
  const useProfileResolution = appearance.id !== "current"
  const cssWidth = useProfileResolution ? appearance.renderResolution.width : fallbackCssWidth
  const cssHeight = useProfileResolution ? appearance.renderResolution.height : fallbackCssHeight
  const targetWidth = Math.max(1, Math.round(useProfileResolution ? appearance.renderResolution.width : cssWidth * dpr))
  const targetHeight = Math.max(1, Math.round(useProfileResolution ? appearance.renderResolution.height : cssHeight * dpr))
  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth
    canvas.height = targetHeight
  }

  context.setTransform(useProfileResolution ? 1 : dpr, 0, 0, useProfileResolution ? 1 : dpr, 0, 0)
  drawRenderedIdealBackground(context, cssWidth, cssHeight, appearance)

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
    centerY: cssHeight / 2 + cssHeight * appearance.camera.verticalOffset,
    scale: Math.max(1, Math.min(cssWidth, cssHeight) * 0.44 * appearance.camera.scale),
  }
  const transformedVertices = state.objGeometry.vertices.map((vertex) =>
    transformObjVertexForRender(vertex, summary.center!, summary.maxDimension!, previewState, rotationCenter),
  )
  const faceDrawItems = createRenderedIdealFaceDrawItems(transformedVertices, viewport, previewState, appearance)

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
    context.fillStyle = getRenderedIdealFaceColor(item.brightness, appearance)
    context.strokeStyle = getRenderedIdealFaceStrokeColor(item.brightness, appearance)
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
  appearance: AppliedObjRenderAppearanceProfile,
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

    const brightness = calculateRenderedIdealBrightness(normal, appearance)
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
  appearance: AppliedObjRenderAppearanceProfile,
) {
  context.fillStyle = appearance.backgroundColor
  context.fillRect(0, 0, width, height)
}

function renderRenderedIdealSummaryCard() {
  const card = getElement<HTMLElement>("[data-rendered-ideal-summary]")
  const summary = state.renderedIdeal.summary
  const detection = state.renderedIdeal.detection
  const calibration = state.objPoseCalibration
  const appearance = getAppliedObjRenderAppearanceProfile({
    width: summary.canvasWidth || getAppliedObjRenderAppearanceProfile().renderResolution.width,
    height: summary.canvasHeight || getAppliedObjRenderAppearanceProfile().renderResolution.height,
  })
  card.innerHTML = `
    <p>${escapeHtml(getRenderedIdealMessage())}</p>
    <dl class="review-grid">
      <div><dt>Render Appearance</dt><dd>${escapeHtml(appearance.label)}</dd></div>
      <div><dt>background</dt><dd>${escapeHtml(appearance.backgroundColor)}</dd></div>
      <div><dt>skin</dt><dd>${escapeHtml(appearance.skinColor)}</dd></div>
      <div><dt>lighting</dt><dd>${escapeHtml(formatRenderAppearanceLighting(appearance))}</dd></div>
      <div><dt>camera</dt><dd>${escapeHtml(formatRenderAppearanceCamera(appearance))}</dd></div>
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
      <div><dt>p,Pデータ生成状態</dt><dd>${calibration.status}</dd></div>
      <div><dt>姿勢サンプリング</dt><dd>${state.objPoseMapping.poseSamplingPreset}</dd></div>
      <div><dt>pose数</dt><dd>${formatNullableCount(calibration.poseCount)}</dd></div>
      <div><dt>総評価数</dt><dd>${formatNullableCount(calibration.totalEvaluationCount)}</dd></div>
      <div><dt>評価済みpose数</dt><dd>${formatNullableCount(calibration.evaluatedPoseCount)}</dd></div>
      <div><dt>失敗pose評価数</dt><dd>${formatNullableCount(calibration.failedPoseEvaluationCount)}</dd></div>
      <div><dt>経過時間ms</dt><dd>${formatRealtimeNullableNumber(calibration.elapsedMs)}</dd></div>
      <div><dt>推定残り時間ms</dt><dd>${formatRealtimeNullableNumber(calibration.estimatedRemainingMs)}</dd></div>
      <div><dt>p,P dataset sampleCount</dt><dd>${formatNullableCount(state.objPoseMapping.dataset.sampleCount)}</dd></div>
      <div><dt>p,P dataset detectedCount</dt><dd>${formatNullableCount(state.objPoseMapping.dataset.detectedCount)}</dd></div>
      <div><dt>p,P dataset failedCount</dt><dd>${formatNullableCount(state.objPoseMapping.dataset.failedCount)}</dd></div>
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

  if (state.activeDebugTab === "modeComparison") {
    content.appendChild(renderModeComparisonDebugTab())
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
  return [
    ["labName", LAB_NAME],
    ["liveInputSourceType", state.liveInput.sourceType ?? "null"],
    ["liveVideoStatus", state.liveVideo.status],
    ["modeComparisonStatus", state.modeComparison.status],
    ["modeComparisonProcessedFrameCount", formatNullableCount(state.modeComparison.result?.summary.processedFrameCount ?? state.modeComparison.progressFrameCount)],
    ["modeComparisonSkippedFrameCount", formatNullableCount(state.modeComparison.result?.summary.skippedFrameCount ?? state.modeComparison.skippedFrameCount)],
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
    ["renderAppearanceProfile", state.renderedIdeal.renderAppearanceProfileId],
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
    ["objPoseDatasetGenerationStatus", state.objPoseCalibration.status],
    ["objPoseSamplingPreset", state.objPoseMapping.poseSamplingPreset],
    ["objPoseSamplingRange", formatObjPoseSamplingPreset(getCurrentObjPoseSamplingPreset())],
    ["objPoseDatasetPoseCount", formatNullableCount(state.objPoseCalibration.poseCount)],
    ["objPoseDatasetTotalEvaluationCount", formatNullableCount(state.objPoseCalibration.totalEvaluationCount)],
    ["objPoseDatasetEvaluatedPoseCount", formatNullableCount(state.objPoseCalibration.evaluatedPoseCount)],
    ["objPoseDatasetFailedPoseCount", formatNullableCount(state.objPoseCalibration.failedPoseEvaluationCount)],
    ["objPoseDatasetSampleCount", formatNullableCount(state.objPoseMapping.dataset.sampleCount)],
    ["objPoseDatasetDetectedCount", formatNullableCount(state.objPoseMapping.dataset.detectedCount)],
    ["objPoseDatasetFailedCount", formatNullableCount(state.objPoseMapping.dataset.failedCount)],
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
  const appearance = getAppliedObjRenderAppearanceProfile({
    width: summary.canvasWidth || getAppliedObjRenderAppearanceProfile().renderResolution.width,
    height: summary.canvasHeight || getAppliedObjRenderAppearanceProfile().renderResolution.height,
  })
  return [
    ["status", summary.status],
    ["renderAppearance profile", appearance.label],
    ["renderAppearance background", appearance.backgroundColor],
    ["renderAppearance skin", appearance.skinColor],
    ["renderAppearance lighting", formatRenderAppearanceLighting(appearance)],
    ["renderAppearance camera", formatRenderAppearanceCamera(appearance)],
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
  const mapping = state.objPoseMapping
  return [
    ["状態", calibration.status],
    ["役割", "OBJを複数のrenderPose pでレンダーし、MediaPipe returnedPose Pを取得してp,P dataset JSONを生成します。"],
    ["関数推定の主データ", "p=renderPose, P=returnedPose"],
    ["推定・統計", "ラボ側では実行しません。Colab側で解析します。"],
    ["姿勢サンプリング", mapping.poseSamplingPreset],
    ["姿勢サンプリング範囲", formatObjPoseSamplingPreset(getCurrentObjPoseSamplingPreset())],
    ["固定rotationCenter", formatPoint(getFixedObjPoseRenderSettings().rotationCenter)],
    ["pose数", formatNullableCount(calibration.poseCount)],
    ["総評価数", formatNullableCount(calibration.totalEvaluationCount)],
    ["評価済みpose数", formatNullableCount(calibration.evaluatedPoseCount)],
    ["失敗pose評価数", formatNullableCount(calibration.failedPoseEvaluationCount)],
    ["経過時間ms", formatRealtimeNullableNumber(calibration.elapsedMs)],
    ["推定残り時間ms", formatRealtimeNullableNumber(calibration.estimatedRemainingMs)],
    ["p,P dataset sampleCount", formatNullableCount(mapping.dataset.sampleCount)],
    ["p,P dataset detectedCount", formatNullableCount(mapping.dataset.detectedCount)],
    ["p,P dataset failedCount", formatNullableCount(mapping.dataset.failedCount)],
    ["p,P dataset lastGeneratedAt", mapping.dataset.lastGeneratedAt ?? "未生成"],
    ["dataset message", mapping.statusMessage ?? "null"],
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
    modeComparisonState: getModeComparisonRawSummary(),
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
    objPoseDatasetGenerationState: getObjPoseCalibrationRawSummary(),
    objPoseMapping: getObjPoseMappingDebugExport(),
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
    renderAppearanceProfileId: "current",
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
  const poseWiseBest = createDefaultObjPoseCalibrationPoseWiseBest()
  return {
    status: "idle",
    startedAt: null,
    completedAt: null,
    elapsedMs: null,
    estimatedRemainingMs: null,
    searchRange: createObjPoseCalibrationSearchRange(),
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
    poseWiseBest,
    poseWiseGroupSummary: buildObjPoseWiseGroupSummary(poseWiseBest),
    posePairSummary: buildObjPosePairSummary(poseWiseBest),
    errorMessage: null,
  }
}

function createDefaultObjPoseMappingState(): ObjPoseMappingState {
  return {
    dataset: {
      sampleCount: 0,
      detectedCount: 0,
      failedCount: 0,
      lastGeneratedAt: null,
    },
    poseSamplingPreset: "standard",
    statistics: null,
    statusMessage: null,
  }
}

function createObjPoseCalibrationSearchRange(): ObjPoseCalibrationSearchRange {
  return {
    rotationCenterX: { fixed: true, value: OBJ_POSE_CALIBRATION_RANGE.rotationCenterX.value },
    rotationCenterY: {
      min: OBJ_POSE_CALIBRATION_RANGE.rotationCenterY.min,
      max: OBJ_POSE_CALIBRATION_RANGE.rotationCenterY.max,
      step: OBJ_POSE_CALIBRATION_RANGE.rotationCenterY.step,
    },
    rotationCenterZ: {
      min: OBJ_POSE_CALIBRATION_RANGE.rotationCenterZ.min,
      max: OBJ_POSE_CALIBRATION_RANGE.rotationCenterZ.max,
      step: OBJ_POSE_CALIBRATION_RANGE.rotationCenterZ.step,
    },
    pitchOffsetDeg: {
      min: OBJ_POSE_CALIBRATION_RANGE.pitchOffsetDeg.min,
      max: OBJ_POSE_CALIBRATION_RANGE.pitchOffsetDeg.max,
      step: OBJ_POSE_CALIBRATION_RANGE.pitchOffsetDeg.step,
    },
  }
}

function createDefaultObjPoseCalibrationPoseWiseBest(): ObjPoseCalibrationPoseWiseBest[] {
  return OBJ_POSE_CALIBRATION_POSES.map(createDefaultObjPoseWiseBestForPose)
}

function createDefaultObjPoseWiseBestForPose(
  pose: ObjPoseCalibrationPose,
): ObjPoseCalibrationPoseWiseBest {
  return {
    poseId: pose.id,
    poseLabel: pose.label,
    basePose: {
      yaw: pose.yawDeg,
      pitch: pose.pitchDeg,
      roll: pose.rollDeg,
    },
    bestCandidate: null,
    topCandidates: [],
  }
}

function buildObjPoseWiseGroupSummary(
  poseWiseBest: ObjPoseCalibrationPoseWiseBest[],
): ObjPoseCalibrationPoseWiseGroupSummary[] {
  return OBJ_POSE_WISE_GROUPS.map((group) => {
    const bestCandidates = group.poseIds
      .map((poseId) => poseWiseBest.find((item) => item.poseId === poseId)?.bestCandidate ?? null)
      .filter((candidate): candidate is ObjPoseCalibrationPoseWiseBestCandidate => candidate !== null)

    return {
      groupId: group.groupId,
      label: group.label,
      poseIds: [...group.poseIds],
      averageBestPoseError: roundForState(averageNumbers(bestCandidates.map((candidate) => candidate.poseError ?? Number.NaN))),
      averageBestYawError: roundForState(averageNumbers(bestCandidates.map((candidate) => candidate.yawError ?? Number.NaN))),
      averageBestPitchError: roundForState(averageNumbers(bestCandidates.map((candidate) => candidate.pitchError ?? Number.NaN))),
      averageBestRollError: roundForState(averageNumbers(bestCandidates.map((candidate) => candidate.rollError ?? Number.NaN))),
      rotationCenterYRange: createNullableRange(bestCandidates.map((candidate) => candidate.rotationCenterY)),
      rotationCenterZRange: createNullableRange(bestCandidates.map((candidate) => candidate.rotationCenterZ)),
      pitchOffsetDegRange: createNullableRange(bestCandidates.map((candidate) => candidate.renderPoseOffset.pitchDeg)),
    }
  })
}

function buildObjPosePairSummary(
  poseWiseBest: ObjPoseCalibrationPoseWiseBest[],
): ObjPoseCalibrationPosePairSummary[] {
  return OBJ_POSE_PAIR_SUMMARY_PAIRS.map((pair) => {
    const negativeBest = poseWiseBest.find((item) => item.poseId === pair.negativePoseId)?.bestCandidate ?? null
    const positiveBest = poseWiseBest.find((item) => item.poseId === pair.positivePoseId)?.bestCandidate ?? null
    const negativeSummary = createObjPosePairBestSummary(negativeBest)
    const positiveSummary = createObjPosePairBestSummary(positiveBest)

    return {
      pairId: pair.pairId,
      label: pair.label,
      negativePoseId: pair.negativePoseId,
      positivePoseId: pair.positivePoseId,
      negativeBest: negativeSummary,
      positiveBest: positiveSummary,
      delta: {
        rotationCenterY: subtractNullable(positiveSummary.rotationCenterY, negativeSummary.rotationCenterY),
        rotationCenterZ: subtractNullable(positiveSummary.rotationCenterZ, negativeSummary.rotationCenterZ),
        pitchOffsetDeg: subtractNullable(positiveSummary.pitchOffsetDeg, negativeSummary.pitchOffsetDeg),
        poseError: subtractNullable(positiveSummary.poseError, negativeSummary.poseError),
      },
    }
  })
}

function createObjPosePairBestSummary(candidate: ObjPoseCalibrationPoseWiseBestCandidate | null) {
  return {
    rotationCenterY: roundForState(candidate?.rotationCenterY ?? null),
    rotationCenterZ: roundForState(candidate?.rotationCenterZ ?? null),
    pitchOffsetDeg: roundForState(candidate?.renderPoseOffset.pitchDeg ?? null),
    poseError: roundForState(candidate?.poseError ?? null),
  }
}

function createNullableRange(values: number[]) {
  const finiteValues = values.filter((value) => Number.isFinite(value))
  if (finiteValues.length === 0) {
    return {
      min: null,
      max: null,
    }
  }
  return {
    min: roundForState(Math.min(...finiteValues)),
    max: roundForState(Math.max(...finiteValues)),
  }
}

function subtractNullable(a: number | null, b: number | null) {
  return a === null || b === null ? null : roundForState(a - b)
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
    lightDirection: overrides.lightDirection ?? getPrimaryRenderAppearanceLightDirection(),
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

function createDefaultModeComparisonState(): ModeComparisonState {
  return {
    status: "idle",
    startedAt: null,
    completedAt: null,
    progressFrameCount: 0,
    maxFrames: MODE_COMPARISON_MAX_FRAMES,
    skippedFrameCount: 0,
    lastTimestampMs: null,
    lastMediaTimeSec: null,
    lastPresentedFrames: null,
    errorMessage: null,
    result: null,
    previewSnapshots: createEmptyModeComparisonPreviewSnapshots(),
  }
}

function createEmptyModeComparisonPreviewSnapshots(): Record<ModeComparisonPreviewKind, ModeComparisonPreviewSnapshot | null> {
  return {
    latest: null,
    worst_pose_diff: null,
    worst_landmark_diff: null,
    first_mismatch: null,
  }
}

function createEmptyTimingDistribution(): TimingDistribution {
  return {
    average: null,
    p50: null,
    p95: null,
    max: null,
  }
}

function createEmptyModeComparisonSummary(): ModeComparisonSummary {
  return {
    processedFrameCount: 0,
    skippedFrameCount: 0,
    imageDetectSuccessCount: 0,
    videoDetectSuccessCount: 0,
    bothSuccessCount: 0,
    imageOnlySuccessCount: 0,
    videoOnlySuccessCount: 0,
    bothFailedCount: 0,
    mismatchCount: 0,
    timing: {
      drawImageMs: createEmptyTimingDistribution(),
      imageDetectMs: createEmptyTimingDistribution(),
      videoDetectMs: createEmptyTimingDistribution(),
      totalFrameProcessingMs: createEmptyTimingDistribution(),
    },
    poseDiff: {
      yaw: createEmptyTimingDistribution(),
      pitch: createEmptyTimingDistribution(),
      roll: createEmptyTimingDistribution(),
      absYaw: createEmptyTimingDistribution(),
      absPitch: createEmptyTimingDistribution(),
      absRoll: createEmptyTimingDistribution(),
      magnitude: createEmptyTimingDistribution(),
    },
    landmarkDiff: {
      mean2dDistance: createEmptyTimingDistribution(),
      max2dDistance: createEmptyTimingDistribution(),
      mean3dDistance: createEmptyTimingDistribution(),
      max3dDistance: createEmptyTimingDistribution(),
      mean2dDistanceNoIris: createEmptyTimingDistribution(),
      mean2dDistanceIris: createEmptyTimingDistribution(),
    },
    presentedFramesDelta: createEmptyTimingDistribution(),
    importantFrames: createEmptyModeComparisonImportantFrames(),
  }
}

function createEmptyModeComparisonImportantFrames(): ModeComparisonImportantFrames {
  return {
    worstYawDiffFrame: null,
    worstPitchDiffFrame: null,
    worstRollDiffFrame: null,
    worstPoseMagnitudeDiffFrame: null,
    worstMean2dDistanceFrame: null,
    worstMax2dDistanceFrame: null,
    firstMismatchFrame: null,
    latestFrame: null,
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

function createModeComparisonImageLandmarkerOptions(): FaceLandmarkerOptions {
  return {
    baseOptions: {
      modelAssetPath: MEDIAPIPE_FACE_LANDMARKER_MODEL_ASSET_PATH,
      delegate: "GPU",
    },
    runningMode: "IMAGE",
    numFaces: 1,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: true,
  }
}

function createModeComparisonVideoLandmarkerOptions(): FaceLandmarkerOptions {
  return {
    baseOptions: {
      modelAssetPath: MEDIAPIPE_FACE_LANDMARKER_MODEL_ASSET_PATH,
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numFaces: 1,
    outputFaceBlendshapes: false,
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

  downloadTextFile("ideal-obj-render-warp-lab-debug-export.json", json, "application/json;charset=utf-8")
  status.textContent = "デバッグJSONをダウンロードしました。"
  addLog("デバッグJSONをダウンロードしました。")

  renderAll()
}

async function exportObjPoseMappingDataset() {
  const dataset = ensureObjPoseMappingDataset()
  const status = getElement<HTMLElement>("[data-debug-export-status]")
  if (!dataset) {
    const message = "p,Pデータがありません。先にp,Pデータ生成を実行してください。"
    setObjPoseMappingStatusMessage(message)
    status.textContent = message
    addLog(message)
    renderAll()
    return
  }

  const json = JSON.stringify(dataset, null, 2)
  const fileName = `obj-pose-mapping-dataset-${dataset.renderAppearance.profileId}-${formatTimestampForFileName(dataset.createdAt)}.json`
  downloadTextFile(fileName, json, "application/json;charset=utf-8")
  status.textContent = "p,P dataset JSONをダウンロードしました。"
  addLog("p,P dataset JSONをダウンロードしました。")

  setObjPoseMappingStatusMessage(status.textContent ?? "")
  renderAll()
}

function exportModeComparisonJson() {
  const result = state.modeComparison.result
  const status = getElement<HTMLElement>("[data-debug-export-status]")
  if (!result) {
    status.textContent = "モード比較結果がありません。先にモード比較を実行してください。"
    renderAll()
    return
  }

  const json = JSON.stringify(result, null, 2)
  downloadTextFile(
    createModeComparisonFileName(result.createdAt, "json"),
    json,
    "application/json;charset=utf-8",
  )
  status.textContent = "モード比較JSONをダウンロードしました。"
  addLog("モード比較JSONをダウンロードしました。")
  renderAll()
}

function exportModeComparisonCsv() {
  const result = state.modeComparison.result
  const status = getElement<HTMLElement>("[data-debug-export-status]")
  if (!result) {
    status.textContent = "モード比較結果がありません。先にモード比較を実行してください。"
    renderAll()
    return
  }

  const csv = buildModeComparisonCsv(result.frames)
  downloadTextFile(
    createModeComparisonFileName(result.createdAt, "csv"),
    csv,
    "text/csv;charset=utf-8",
  )
  status.textContent = "モード比較CSVをダウンロードしました。"
  addLog("モード比較CSVをダウンロードしました。")
  renderAll()
}

function exportModeComparisonPreview(kind: ModeComparisonPreviewKind) {
  const snapshot = state.modeComparison.previewSnapshots[kind]
  const status = getElement<HTMLElement>("[data-debug-export-status]")
  if (!snapshot) {
    status.textContent = "preview snapshot（プレビュー画像）がありません。先にモード比較を実行してください。"
    renderAll()
    return
  }

  downloadDataUrlFile(createModeComparisonPreviewFileName(snapshot), snapshot.dataUrl)
  status.textContent = "モード比較 preview image（プレビュー画像）をダウンロードしました。"
  addLog(`モード比較 preview image をダウンロードしました: ${snapshot.kind} / frame ${snapshot.frameIndex}`)
  renderAll()
}

function createModeComparisonPreviewFileName(snapshot: ModeComparisonPreviewSnapshot) {
  const frameIndex = String(snapshot.frameIndex).padStart(5, "0")
  const mediaTime = formatNumber(snapshot.mediaTimeSec).replaceAll(".", "_")
  return `mode_comparison_${snapshot.kind}_frame_${frameIndex}_time_${mediaTime}_${formatTimestampForFileName(snapshot.createdAt)}.png`
}

function downloadDataUrlFile(fileName: string, dataUrl: string) {
  const link = document.createElement("a")
  link.href = dataUrl
  link.download = fileName
  link.click()
}

function createModeComparisonFileName(createdAt: string, extension: "json" | "csv") {
  return `mode_comparison_gpu_request_video_frame_callback_${formatTimestampForFileName(createdAt)}.${extension}`
}

function buildModeComparisonCsv(frames: ModeComparisonFrameResult[]) {
  const headers = [
    "frameIndex",
    "mediaTimeSec",
    "timestampMs",
    "presentedFrames",
    "presentedFramesDelta",
    "drawImageMs",
    "imageDetectMs",
    "videoDetectMs",
    "totalFrameProcessingMs",
    "imageDetected",
    "videoDetected",
    "imageLandmarkCount",
    "videoLandmarkCount",
    "yawDiffVideoMinusImage",
    "pitchDiffVideoMinusImage",
    "rollDiffVideoMinusImage",
    "mean2dDistance",
    "max2dDistance",
    "mean3dDistance",
    "max3dDistance",
  ]
  const rows = frames.map((frame) => [
    frame.frameIndex,
    frame.mediaTimeSec,
    frame.timestampMs,
    frame.presentedFrames ?? "",
    frame.presentedFramesDelta ?? "",
    frame.drawImageMs ?? "",
    frame.imageDetectMs ?? "",
    frame.videoDetectMs ?? "",
    frame.totalFrameProcessingMs ?? "",
    frame.imageDetected,
    frame.videoDetected,
    frame.imageLandmarkCount,
    frame.videoLandmarkCount,
    frame.poseDiff.yaw ?? "",
    frame.poseDiff.pitch ?? "",
    frame.poseDiff.roll ?? "",
    frame.landmarkDiff?.mean2dDistance ?? "",
    frame.landmarkDiff?.max2dDistance ?? "",
    frame.landmarkDiff?.mean3dDistance ?? "",
    frame.landmarkDiff?.max3dDistance ?? "",
  ])

  return [
    headers.join(","),
    ...rows.map((row) => row.map(formatCsvCell).join(",")),
  ].join("\n")
}

function formatCsvCell(value: string | number | boolean) {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text
}

async function exportObjPoseMappingCompactReport() {
  const status = getElement<HTMLElement>("[data-debug-export-status]")
  const message = "compact report は廃止しました。p,P Dataset JSONをColab側で解析してください。"
  status.textContent = message
  setObjPoseMappingStatusMessage(message)
  addLog(message)
  renderAll()
}

function setObjPoseMappingStatusMessage(message: string) {
  state.objPoseMapping = {
    ...state.objPoseMapping,
    statusMessage: message,
  }
}

function downloadTextFile(fileName: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  link.click()
  URL.revokeObjectURL(link.href)
}

function buildObjPoseMappingCompactReport(
  dataset: ObjPoseMappingDataset,
  statistics: ObjPoseMappingStatistics,
) {
  return [
    "# OBJ Pose Mapping Compact Report",
    "",
    "## Purpose",
    "",
    "このレポートは、OBJに最終的に与えた renderPose を `p`、MediaPipe が返した pose を `P` として、p と P の対応関係を整理したものです。",
    "",
    "目的は、カメラ側の MediaPipe pose `P_camera` を入力したときに、MediaPipe が同じ姿勢として読めるような OBJ renderPose `p` を推定することです。",
    "",
    "最終的に欲しい関数は以下です。",
    "",
    "```text",
    "p = g(P_camera)",
    "```",
    "",
    "ここで `p` は `renderPose` です。",
    "",
    "`pitchOffsetDeg` は探索時の補助情報であり、関数の主入力・主出力ではありません。`basePose` から `p=renderPose` を作った経路として auxiliary に残しています。",
    "",
    "## Dataset Conditions",
    "",
    `* OBJ file: ${dataset.objSummary.fileName ?? "null"}`,
    `* vertex count: ${formatNullableCount(dataset.objSummary.vertexCount)}`,
    `* face count: ${formatNullableCount(dataset.objSummary.faceCount)}`,
    "* primary variables:",
    "  * p = renderPose",
    "  * P = MediaPipe returnedPose",
    "  * intended inverse function = p = g(P_camera)",
    `* comparisonSign: yaw=${dataset.comparisonSign.yaw}, pitch=${dataset.comparisonSign.pitch}, roll=${dataset.comparisonSign.roll}`,
    `* searchRange: ${formatObjPoseMappingSearchRange(dataset.searchRange)}`,
    `* sampleCount: ${dataset.counts.sampleCount}`,
    `* detectedCount: ${dataset.counts.detectedCount}`,
    `* failedCount: ${dataset.counts.failedCount}`,
    "",
    "## Global Error Summary",
    "",
    formatObjPoseMappingErrorSummaryMarkdown(statistics.globalErrorSummary),
    "",
    "## Best Samples",
    "",
    formatObjPoseMappingSamplesMarkdown(statistics.topSamples),
    "",
    "## Pose-wise Best",
    "",
    formatObjPoseMappingPoseWiseMarkdown(statistics),
    "",
    "## Group Summary",
    "",
    formatObjPoseMappingGroupSummaryMarkdown(statistics),
    "",
    "## Pair Summary",
    "",
    formatObjPoseMappingPairSummaryMarkdown(statistics),
    "",
    "## Representative Samples",
    "",
    formatObjPoseMappingSamplesMarkdown(statistics.representativeSamples),
    "",
    "## Request for Generative AI",
    "",
    "この p -> P の対応から、カメラ側の MediaPipe pose `P_camera` を入力したときに、OBJに与えるべき `p = renderPose` を返す近似式、または pose bucket 別ルールを提案してください。",
    "",
    "重要:",
    "",
    "* 関数の主入力は `P_camera` の yaw / pitch / roll です。",
    "* 関数の主出力は `p = renderPose` の yaw / pitch / roll です。",
    "* `pitchOffsetDeg` は探索時の補助情報であり、関数の主出力にしないでください。",
    "* `basePose` と `renderPoseOffset` は分析の参考にはして構いませんが、最終的な推定対象は `renderPose` です。",
    "* TypeScriptで実装しやすい形を優先してください。",
    "* まずは piecewise rule、linear / quadratic regression、nearest-neighbor / weighted interpolation を比較してください。",
    "",
  ].join("\n")
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
    modeComparison: getModeComparisonRawSummary(),
    renderedIdealDetection: getRenderedIdealDetectionDebugExport(),
    objPoseDatasetGeneration: getObjPoseCalibrationDebugExport(),
    objPoseMapping: getObjPoseMappingDebugExport(),
    mediaPipeOptions: {
      currentLiveOptions: getCurrentLiveMediaPipeOptionsDebug(),
      renderedIdealOptions: getRenderedIdealMediaPipeOptionsDebug(),
      modeComparisonImageOptions: getModeComparisonImageMediaPipeOptionsDebug(),
      modeComparisonVideoOptions: getModeComparisonVideoMediaPipeOptionsDebug(),
    },
    notes: [
      "vertices/faces/current478/renderedIdeal478/MediaPipe result/canvas data URL/all pose result arrays/full objPoseMapping dataset samples are intentionally omitted.",
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

function disposeModeComparisonLandmarkers() {
  modeComparisonImageLandmarker?.close()
  modeComparisonVideoLandmarker?.close()
  modeComparisonImageLandmarker = null
  modeComparisonVideoLandmarker = null
  modeComparisonLandmarkerPromise = null
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
  cancelModeComparison()
  stopRealtimeValidation("stopped")
  stopCameraInput()
  if (state.liveVideo.objectUrl) {
    URL.revokeObjectURL(state.liveVideo.objectUrl)
    state.liveVideo.objectUrl = null
  }
  disposeLiveFaceLandmarker("disposed")
  disposeRenderedIdealFaceLandmarker()
  disposeModeComparisonLandmarkers()
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

function getModeComparisonRawSummary() {
  const comparison = state.modeComparison
  const summary =
    comparison.result?.summary ??
    summarizeModeComparisonFrames(modeComparisonFrames, comparison.skippedFrameCount)
  return {
    status: comparison.status,
    startedAt: comparison.startedAt,
    completedAt: comparison.completedAt,
    progressFrameCount: comparison.progressFrameCount,
    maxFrames: comparison.maxFrames,
    skippedFrameCount: comparison.skippedFrameCount,
    lastTimestampMs: roundForState(comparison.lastTimestampMs),
    lastMediaTimeSec: roundForState(comparison.lastMediaTimeSec),
    lastPresentedFrames: comparison.lastPresentedFrames,
    errorMessage: comparison.errorMessage,
    runOptions: comparison.result?.runOptions ?? {
      maxFrames: MODE_COMPARISON_MAX_FRAMES,
      delegate: "GPU",
      frameDriver: "requestVideoFrameCallback",
      imageMode: "IMAGE",
      videoMode: "VIDEO",
      timestampSource: "metadata.mediaTime",
      sameCanvasFrame: true,
    },
    summary,
    frameCount: comparison.result?.frames.length ?? modeComparisonFrames.length,
    previewSnapshots: Object.fromEntries(
      Object.entries(comparison.previewSnapshots).map(([key, snapshot]) => [
        key,
        snapshot
          ? {
              kind: snapshot.kind,
              frameIndex: snapshot.frameIndex,
              mediaTimeSec: roundForState(snapshot.mediaTimeSec),
              timestampMs: roundForState(snapshot.timestampMs),
              createdAt: snapshot.createdAt,
              hasDataUrl: true,
            }
          : null,
      ]),
    ),
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
    poseSamplingPreset: state.objPoseMapping.poseSamplingPreset,
    poseSampling: getCurrentObjPoseSamplingPreset(),
    selectedRenderAppearanceProfileId: state.renderedIdeal.renderAppearanceProfileId,
    renderAppearance: getRenderAppearanceDebugSummary(),
    fixedRotationCenter: getFixedObjPoseRenderSettings().rotationCenter,
    startedAt: state.objPoseCalibration.startedAt,
    completedAt: state.objPoseCalibration.completedAt,
    elapsedMs: roundForState(state.objPoseCalibration.elapsedMs),
    estimatedRemainingMs: roundForState(state.objPoseCalibration.estimatedRemainingMs),
    poseCount: state.objPoseCalibration.poseCount,
    totalEvaluationCount: state.objPoseCalibration.totalEvaluationCount,
    evaluatedPoseCount: state.objPoseCalibration.evaluatedPoseCount,
    failedPoseEvaluationCount: state.objPoseCalibration.failedPoseEvaluationCount,
    sampleCount: state.objPoseMapping.dataset.sampleCount,
    detectedCount: state.objPoseMapping.dataset.detectedCount,
    failedCount: state.objPoseMapping.dataset.failedCount,
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

function isObjPoseSamplingPresetName(value: string): value is ObjPoseSamplingPresetName {
  return value === "quick" || value === "standard" || value === "dense"
}

function isObjRenderAppearanceProfileId(value: string): value is ObjRenderAppearanceProfileId {
  return value in OBJ_RENDER_APPEARANCE_PROFILES
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

function isModeComparisonPreviewDownloadAction(
  action: string | undefined,
): action is `mode-comparison-download-preview-${ModeComparisonPreviewKind}` {
  return (
    action === "mode-comparison-download-preview-latest" ||
    action === "mode-comparison-download-preview-worst_pose_diff" ||
    action === "mode-comparison-download-preview-worst_landmark_diff" ||
    action === "mode-comparison-download-preview-first_mismatch"
  )
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

function formatTimingDistribution(value: TimingDistribution) {
  if (value.average === null) {
    return "未計測"
  }
  return `avg ${formatNullableNumber(value.average)} / p50 ${formatNullableNumber(value.p50)} / p95 ${formatNullableNumber(value.p95)} / max ${formatNullableNumber(value.max)}`
}

function formatModeComparisonStatus(status: ModeComparisonStatus) {
  const labels: Record<ModeComparisonStatus, string> = {
    idle: "未実行",
    running: "実行中",
    completed: "完了",
    canceled: "キャンセル済み",
    error: "エラー",
  }
  return labels[status]
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

function formatObjPoseComparisonSign() {
  return `yaw=${formatNumber(OBJ_POSE_COMPARISON_SIGN.yaw)} / pitch=${formatNumber(OBJ_POSE_COMPARISON_SIGN.pitch)} / roll=${formatNumber(OBJ_POSE_COMPARISON_SIGN.roll)}`
}

function formatPitchOffsetSearchRange() {
  const range = state.objPoseCalibration.searchRange.pitchOffsetDeg
  return `min=${formatNumber(range.min)} / max=${formatNumber(range.max)} / step=${formatNumber(range.step)}`
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
      `${index + 1}. rotationCenter x=${formatNumber(candidate.rotationCenterX)}, y=${formatNumber(candidate.rotationCenterY)}, z=${formatNumber(candidate.rotationCenterZ)}, pitchOffsetDeg=${formatNumber(candidate.renderPoseOffset.pitchDeg)}, score=${formatNullableNumber(candidate.score)}, avg=${formatNullableNumber(candidate.averagePoseError)}, max=${formatNullableNumber(candidate.maxPoseError)}, failedPoses=${candidate.failedPoseCount}`,
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

function formatObjPoseRenderOffset(offset: { yawDeg: number; pitchDeg: number; rollDeg: number }) {
  return `yawDeg ${formatNumber(offset.yawDeg)} / pitchDeg ${formatNumber(offset.pitchDeg)} / rollDeg ${formatNumber(offset.rollDeg)}`
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
      `${result.poseLabel}: base ${formatPose(result.basePose)} / offset ${formatObjPoseRenderOffset(result.renderPoseOffset)} / render ${formatPose(result.renderPose)} / expectedForComparison ${formatPose(result.expectedPoseForComparison)} / returned ${formatPose(result.returnedPose)} / yaw/pitch/roll error ${formatPoseErrorTriple(result.yawError, result.pitchError, result.rollError)} / poseError ${formatNullableNumber(result.poseError)} / detected ${String(result.detected)}`,
    )
    .join("\n")
}

function formatObjPoseWiseBestText() {
  if (state.objPoseCalibration.poseWiseBest.length === 0) {
    return "[]"
  }

  return state.objPoseCalibration.poseWiseBest
    .map((item) => {
      const best = item.bestCandidate
      if (!best) {
        return `${item.poseId} (${item.poseLabel})\n  basePose: ${formatPose(item.basePose)}\n  best: null`
      }
      return [
        `${item.poseId} (${item.poseLabel})`,
        `  basePose: ${formatPose(item.basePose)}`,
        `  best: center x=${formatNumber(best.rotationCenterX)}, y=${formatNumber(best.rotationCenterY)}, z=${formatNumber(best.rotationCenterZ)}, pitchOffsetDeg=${formatNumber(best.renderPoseOffset.pitchDeg)}`,
        `  returned: ${formatPose(best.returnedPose)}`,
        `  error: pose=${formatNullableNumber(best.poseError)} / yaw=${formatNullableNumber(best.yawError)} / pitch=${formatNullableNumber(best.pitchError)} / roll=${formatNullableNumber(best.rollError)}`,
      ].join("\n")
    })
    .join("\n\n")
}

function formatObjPoseWiseGroupSummaryText() {
  if (state.objPoseCalibration.poseWiseGroupSummary.length === 0) {
    return "[]"
  }

  return state.objPoseCalibration.poseWiseGroupSummary
    .map((group) =>
      [
        `${group.label} (${group.poseIds.join(", ")})`,
        `  average error: pose=${formatNullableNumber(group.averageBestPoseError)} / yaw=${formatNullableNumber(group.averageBestYawError)} / pitch=${formatNullableNumber(group.averageBestPitchError)} / roll=${formatNullableNumber(group.averageBestRollError)}`,
        `  centerY range: ${formatNullableRange(group.rotationCenterYRange)}`,
        `  centerZ range: ${formatNullableRange(group.rotationCenterZRange)}`,
        `  pitchOffsetDeg range: ${formatNullableRange(group.pitchOffsetDegRange)}`,
      ].join("\n"),
    )
    .join("\n\n")
}

function formatObjPosePairSummaryText() {
  if (state.objPoseCalibration.posePairSummary.length === 0) {
    return "[]"
  }

  return state.objPoseCalibration.posePairSummary
    .map((pair) =>
      [
        `${pair.label}`,
        `  negative(${pair.negativePoseId}): y=${formatNullableNumber(pair.negativeBest.rotationCenterY)} / z=${formatNullableNumber(pair.negativeBest.rotationCenterZ)} / pitchOffset=${formatNullableNumber(pair.negativeBest.pitchOffsetDeg)} / error=${formatNullableNumber(pair.negativeBest.poseError)}`,
        `  positive(${pair.positivePoseId}): y=${formatNullableNumber(pair.positiveBest.rotationCenterY)} / z=${formatNullableNumber(pair.positiveBest.rotationCenterZ)} / pitchOffset=${formatNullableNumber(pair.positiveBest.pitchOffsetDeg)} / error=${formatNullableNumber(pair.positiveBest.poseError)}`,
        `  delta(pos-neg): y=${formatNullableNumber(pair.delta.rotationCenterY)} / z=${formatNullableNumber(pair.delta.rotationCenterZ)} / pitchOffset=${formatNullableNumber(pair.delta.pitchOffsetDeg)} / error=${formatNullableNumber(pair.delta.poseError)}`,
      ].join("\n"),
    )
    .join("\n\n")
}

function formatObjPoseMappingSearchRange(range: ObjPoseCalibrationSearchRange) {
  return [
    `rotationCenterX fixed=${String(range.rotationCenterX.fixed)} value=${formatNumber(range.rotationCenterX.value)}`,
    `rotationCenterY min=${formatNumber(range.rotationCenterY.min)} max=${formatNumber(range.rotationCenterY.max)} step=${formatNumber(range.rotationCenterY.step)}`,
    `rotationCenterZ min=${formatNumber(range.rotationCenterZ.min)} max=${formatNumber(range.rotationCenterZ.max)} step=${formatNumber(range.rotationCenterZ.step)}`,
    `pitchOffsetDeg min=${formatNumber(range.pitchOffsetDeg.min)} max=${formatNumber(range.pitchOffsetDeg.max)} step=${formatNumber(range.pitchOffsetDeg.step)}`,
  ].join(" / ")
}

function formatObjPoseSamplingPreset(preset: ObjPoseSamplingPreset) {
  return [
    `yaw min=${formatNumber(preset.yaw.min)} max=${formatNumber(preset.yaw.max)} step=${formatNumber(preset.yaw.step)}`,
    `pitch min=${formatNumber(preset.pitch.min)} max=${formatNumber(preset.pitch.max)} step=${formatNumber(preset.pitch.step)}`,
    `roll min=${formatNumber(preset.roll.min)} max=${formatNumber(preset.roll.max)} step=${formatNumber(preset.roll.step)}`,
  ].join(" / ")
}

function formatRenderAppearanceLighting(appearance: AppliedObjRenderAppearanceProfile) {
  return [
    appearance.lighting.mode,
    `ambient ${formatNumber(appearance.lighting.ambientIntensity)}`,
    `key ${formatNumber(appearance.lighting.keyLightIntensity)}`,
    `shadow ${appearance.lighting.castShadow ? "on" : "off"}`,
  ].join(" / ")
}

function formatRenderAppearanceCamera(appearance: AppliedObjRenderAppearanceProfile) {
  return [
    appearance.camera.projection,
    `fov ${formatNumber(appearance.camera.fovDeg)}`,
    `scale ${formatNumber(appearance.camera.scale)}`,
    `verticalOffset ${formatNumber(appearance.camera.verticalOffset)}`,
  ].join(" / ")
}

function formatObjPoseMappingErrorSummaryMarkdown(
  summary: ObjPoseMappingStatistics["globalErrorSummary"],
) {
  return [
    `* poseError: ${formatNumericSummaryMarkdown(summary.poseError)}`,
    `* yawError: ${formatNumericSummaryMarkdown(summary.yawError)}`,
    `* pitchError: ${formatNumericSummaryMarkdown(summary.pitchError)}`,
    `* rollError: ${formatNumericSummaryMarkdown(summary.rollError)}`,
  ].join("\n")
}

function formatNumericSummaryMarkdown(summary: NumericSummary | null) {
  if (!summary) {
    return "null"
  }
  return `min=${formatNumber(summary.min)}, max=${formatNumber(summary.max)}, mean=${formatNumber(summary.mean)}, median=${formatNumber(summary.median)}, stdDev=${formatNumber(summary.stdDev)}`
}

function formatObjPoseMappingSamplesMarkdown(samples: ObjPoseMappingSampleCompact[]) {
  if (samples.length === 0) {
    return "[]"
  }
  return samples.map(formatObjPoseMappingSampleMarkdown).join("\n\n")
}

function formatObjPoseMappingSampleMarkdown(sample: ObjPoseMappingSampleCompact) {
  return [
    `### ${sample.sampleId}`,
    "",
    "p = renderPose:",
    `- yaw: ${formatNumber(sample.p.yaw)}`,
    `- pitch: ${formatNumber(sample.p.pitch)}`,
    `- roll: ${formatNumber(sample.p.roll)}`,
    "",
    "P = MediaPipe returnedPose:",
    `- yaw: ${formatNullableNumber(sample.P.yaw)}`,
    `- pitch: ${formatNullableNumber(sample.P.pitch)}`,
    `- roll: ${formatNullableNumber(sample.P.roll)}`,
    "",
    "error:",
    `- poseError: ${formatNullableNumber(sample.errors.poseError)}`,
    `- yawError: ${formatNullableNumber(sample.errors.yawError)}`,
    `- pitchError: ${formatNullableNumber(sample.errors.pitchError)}`,
    `- rollError: ${formatNullableNumber(sample.errors.rollError)}`,
    "",
    "auxiliary:",
    `- basePose: ${formatPose(sample.auxiliary.basePose)}`,
    `- renderPoseOffset: ${formatObjPoseRenderOffset(sample.auxiliary.renderPoseOffset)}`,
    `- rotationCenter: ${formatPoint(sample.auxiliary.rotationCenter)}`,
    `- expectedPoseForComparison: ${formatPose(sample.auxiliary.expectedPoseForComparison)}`,
  ].join("\n")
}

function formatObjPoseMappingPoseWiseMarkdown(statistics: ObjPoseMappingStatistics) {
  if (statistics.byPose.length === 0) {
    return "[]"
  }
  return statistics.byPose
    .map((item) =>
      [
        `### ${item.poseId} (${item.poseLabel})`,
        "",
        `* sampleCount: ${item.sampleCount}`,
        `* detectedCount: ${item.detectedCount}`,
        `* poseError: ${formatNumericSummaryMarkdown(item.errorSummary.poseError)}`,
        item.bestSample ? formatObjPoseMappingSampleMarkdown(item.bestSample) : "bestSample: null",
      ].join("\n"),
    )
    .join("\n\n")
}

function formatObjPoseMappingGroupSummaryMarkdown(statistics: ObjPoseMappingStatistics) {
  if (statistics.byGroup.length === 0) {
    return "[]"
  }
  return statistics.byGroup
    .map((group) =>
      [
        `### ${group.groupId} (${group.label})`,
        "",
        `* poseIds: ${group.poseIds.join(", ")}`,
        `* sampleCount: ${group.sampleCount}`,
        `* averageBestPoseError: ${formatNullableNumber(group.averageBestPoseError)}`,
        `* rotationCenterYRange: ${formatNullableRange(group.rotationCenterYRange)}`,
        `* rotationCenterZRange: ${formatNullableRange(group.rotationCenterZRange)}`,
        `* pitchOffsetDegRange: ${formatNullableRange(group.pitchOffsetDegRange)}`,
        "",
        group.bestSample ? formatObjPoseMappingSampleMarkdown(group.bestSample) : "bestSample: null",
      ].join("\n"),
    )
    .join("\n\n")
}

function formatObjPoseMappingPairSummaryMarkdown(statistics: ObjPoseMappingStatistics) {
  if (statistics.pairSummary.length === 0) {
    return "[]"
  }
  return statistics.pairSummary
    .map((pair) =>
      [
        `### ${pair.pairId} (${pair.label})`,
        "",
        `* negativePoseId: ${pair.negativePoseId}`,
        `* positivePoseId: ${pair.positivePoseId}`,
        `* delta rotationCenterY: ${formatNullableNumber(pair.delta.rotationCenterY)}`,
        `* delta rotationCenterZ: ${formatNullableNumber(pair.delta.rotationCenterZ)}`,
        `* delta pitchOffsetDeg: ${formatNullableNumber(pair.delta.pitchOffsetDeg)}`,
        `* delta poseError: ${formatNullableNumber(pair.delta.poseError)}`,
        "",
        "#### negativeBest",
        pair.negativeBest ? formatObjPoseMappingSampleMarkdown(pair.negativeBest) : "null",
        "",
        "#### positiveBest",
        pair.positiveBest ? formatObjPoseMappingSampleMarkdown(pair.positiveBest) : "null",
      ].join("\n"),
    )
    .join("\n\n")
}

function formatTimestampForFileName(isoString: string) {
  const date = new Date(isoString)
  const pad = (value: number) => String(value).padStart(2, "0")
  if (Number.isNaN(date.getTime())) {
    return "unknown-time"
  }
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("")
}

function formatNullableRange(range: { min: number | null; max: number | null }) {
  return `min=${formatNullableNumber(range.min)} / max=${formatNullableNumber(range.max)}`
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
    objPoseDatasetGeneration: debugExport.objPoseDatasetGeneration,
    objPoseMapping: debugExport.objPoseMapping,
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

function getModeComparisonImageMediaPipeOptionsDebug() {
  return {
    runningMode: "IMAGE",
    api: "detect(canvas)",
    numFaces: 1,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: true,
    delegate: "GPU",
    modelAssetPath: MEDIAPIPE_FACE_LANDMARKER_MODEL_ASSET_PATH,
    wasmPath: MEDIAPIPE_WASM_PATH,
  }
}

function getModeComparisonVideoMediaPipeOptionsDebug() {
  return {
    runningMode: "VIDEO",
    api: "detectForVideo(canvas, timestampMs)",
    numFaces: 1,
    outputFaceBlendshapes: false,
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

function getObjPoseComparisonSignDebug() {
  return {
    yaw: OBJ_POSE_COMPARISON_SIGN.yaw,
    pitch: OBJ_POSE_COMPARISON_SIGN.pitch,
    roll: OBJ_POSE_COMPARISON_SIGN.roll,
  }
}

function getRenderAppearanceDebugSummary() {
  const appearance = getAppliedObjRenderAppearanceProfile({
    width: renderedIdealCanvas.width || getAppliedObjRenderAppearanceProfile().renderResolution.width,
    height: renderedIdealCanvas.height || getAppliedObjRenderAppearanceProfile().renderResolution.height,
  })
  return {
    profileId: appearance.id,
    profileLabel: appearance.label,
    backgroundColor: appearance.backgroundColor,
    skinColor: appearance.skinColor,
    material: appearance.material,
    lighting: appearance.lighting,
    camera: appearance.camera,
    renderResolution: appearance.renderResolution,
    implementation: appearance.implementation,
  }
}

function getObjPoseCalibrationDebugExport() {
  return {
    status: state.objPoseCalibration.status,
    poseSamplingPreset: state.objPoseMapping.poseSamplingPreset,
    poseSampling: getCurrentObjPoseSamplingPreset(),
    selectedRenderAppearanceProfileId: state.renderedIdeal.renderAppearanceProfileId,
    renderAppearance: getRenderAppearanceDebugSummary(),
    fixedRotationCenter: getFixedObjPoseRenderSettings().rotationCenter,
    poseCount: state.objPoseCalibration.poseCount,
    totalEvaluationCount: state.objPoseCalibration.totalEvaluationCount,
    evaluatedPoseCount: state.objPoseCalibration.evaluatedPoseCount,
    failedPoseEvaluationCount: state.objPoseCalibration.failedPoseEvaluationCount,
    elapsedMs: roundForState(state.objPoseCalibration.elapsedMs),
    estimatedRemainingMs: roundForState(state.objPoseCalibration.estimatedRemainingMs),
    errorMessage: state.objPoseCalibration.errorMessage,
  }
}

function getObjPoseMappingDebugExport() {
  const dataset = objPoseMappingDataset
  return {
    selectedRenderAppearanceProfileId: state.renderedIdeal.renderAppearanceProfileId,
    renderAppearance: getRenderAppearanceDebugSummary(),
    dataset: {
      schemaVersion: "obj_pose_mapping_dataset_v2",
      sampleCount: state.objPoseMapping.dataset.sampleCount,
      detectedCount: state.objPoseMapping.dataset.detectedCount,
      failedCount: state.objPoseMapping.dataset.failedCount,
      lastGeneratedAt: state.objPoseMapping.dataset.lastGeneratedAt,
      poseSamplingPreset: state.objPoseMapping.poseSamplingPreset,
      lastGeneratedDatasetMetadata: dataset
        ? {
            createdAt: dataset.createdAt,
            source: dataset.source,
            renderSettings: dataset.renderSettings,
            renderAppearance: dataset.renderAppearance,
            mediapipeSettings: dataset.mediapipeSettings,
            poseSampling: dataset.poseSampling,
            summary: dataset.summary,
          }
        : null,
      primaryVariables: {
        input: "P_camera yaw / pitch / roll",
        output: "p renderPose yaw / pitch / roll",
        intendedInverseFunction: "p = g(P_camera)",
      },
    },
    statusMessage: state.objPoseMapping.statusMessage,
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

function averageNumbers(values: Array<number | null>) {
  const finiteValues = values.filter((value): value is number =>
    value !== null && Number.isFinite(value),
  )
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

function clonePose(pose: ReferencePose): ReferencePose {
  return {
    yaw: pose.yaw,
    pitch: pose.pitch,
    roll: pose.roll,
  }
}

function roundObjPoseRenderOffset(offset: { yawDeg: number; pitchDeg: number; rollDeg: number }) {
  return {
    yawDeg: roundForState(offset.yawDeg) ?? 0,
    pitchDeg: roundForState(offset.pitchDeg) ?? 0,
    rollDeg: roundForState(offset.rollDeg) ?? 0,
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
    renderPoseOffset: roundObjPoseRenderOffset(candidate.renderPoseOffset),
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
    renderPoseOffset: roundObjPoseRenderOffset(candidate.renderPoseOffset),
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

function roundObjPoseWiseBest(item: ObjPoseCalibrationPoseWiseBest): ObjPoseCalibrationPoseWiseBest {
  return {
    poseId: item.poseId,
    poseLabel: item.poseLabel,
    basePose: {
      yaw: roundForState(item.basePose.yaw) ?? 0,
      pitch: roundForState(item.basePose.pitch) ?? 0,
      roll: roundForState(item.basePose.roll) ?? 0,
    },
    bestCandidate: item.bestCandidate ? roundObjPoseWiseBestCandidate(item.bestCandidate) : null,
    topCandidates: item.topCandidates.map(roundObjPoseWiseTopCandidate),
  }
}

function roundObjPoseWiseBestCandidate(
  candidate: ObjPoseCalibrationPoseWiseBestCandidate,
): ObjPoseCalibrationPoseWiseBestCandidate {
  return {
    rotationCenterX: roundForState(candidate.rotationCenterX) ?? 0,
    rotationCenterY: roundForState(candidate.rotationCenterY) ?? 0,
    rotationCenterZ: roundForState(candidate.rotationCenterZ) ?? 0,
    renderPoseOffset: roundObjPoseRenderOffset(candidate.renderPoseOffset),
    renderPose: {
      yaw: roundForState(candidate.renderPose.yaw) ?? 0,
      pitch: roundForState(candidate.renderPose.pitch) ?? 0,
      roll: roundForState(candidate.renderPose.roll) ?? 0,
    },
    expectedPoseForComparison: {
      yaw: roundForState(candidate.expectedPoseForComparison.yaw) ?? 0,
      pitch: roundForState(candidate.expectedPoseForComparison.pitch) ?? 0,
      roll: roundForState(candidate.expectedPoseForComparison.roll) ?? 0,
    },
    returnedPose: roundPoseForState(candidate.returnedPose),
    poseError: roundForState(candidate.poseError),
    yawError: roundForState(candidate.yawError),
    pitchError: roundForState(candidate.pitchError),
    rollError: roundForState(candidate.rollError),
    detected: candidate.detected,
    detectMs: roundForState(candidate.detectMs),
    errorMessage: candidate.errorMessage,
  }
}

function roundObjPoseWiseTopCandidate(
  candidate: ObjPoseCalibrationPoseWiseTopCandidate,
): ObjPoseCalibrationPoseWiseTopCandidate {
  return {
    rank: candidate.rank,
    rotationCenterX: roundForState(candidate.rotationCenterX) ?? 0,
    rotationCenterY: roundForState(candidate.rotationCenterY) ?? 0,
    rotationCenterZ: roundForState(candidate.rotationCenterZ) ?? 0,
    renderPoseOffset: roundObjPoseRenderOffset(candidate.renderPoseOffset),
    poseError: roundForState(candidate.poseError),
    yawError: roundForState(candidate.yawError),
    pitchError: roundForState(candidate.pitchError),
    rollError: roundForState(candidate.rollError),
    returnedPose: roundPoseForState(candidate.returnedPose),
    detected: candidate.detected,
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
    basePose: {
      yaw: roundForState(result.basePose.yaw) ?? 0,
      pitch: roundForState(result.basePose.pitch) ?? 0,
      roll: roundForState(result.basePose.roll) ?? 0,
    },
    renderPoseOffset: roundObjPoseRenderOffset(result.renderPoseOffset),
    renderPose: {
      yaw: roundForState(result.renderPose.yaw) ?? 0,
      pitch: roundForState(result.renderPose.pitch) ?? 0,
      roll: roundForState(result.renderPose.roll) ?? 0,
    },
    expectedPoseForComparison: {
      yaw: roundForState(result.expectedPoseForComparison.yaw) ?? 0,
      pitch: roundForState(result.expectedPoseForComparison.pitch) ?? 0,
      roll: roundForState(result.expectedPoseForComparison.roll) ?? 0,
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

function getAppliedObjRenderAppearanceProfile(
  renderResolutionOverride?: { width: number; height: number },
): AppliedObjRenderAppearanceProfile {
  const base = OBJ_RENDER_APPEARANCE_PROFILES[state.renderedIdeal.renderAppearanceProfileId]
  const profile = base.id === "current"
    ? {
        ...base,
        backgroundColor: state.renderedIdeal.backgroundMode === "dark" ? "#1a2028" : "#f5f7f9",
        skinColor: state.renderedIdeal.colorMode === "grayscale" ? "#b8bcc0" : "#cdb197",
      }
    : base

  return {
    ...profile,
    material: { ...profile.material },
    lighting: {
      ...profile.lighting,
      keyLightDirection: profile.lighting.keyLightDirection ? normalizeVector(profile.lighting.keyLightDirection) : undefined,
      fillLightDirection: profile.lighting.fillLightDirection ? normalizeVector(profile.lighting.fillLightDirection) : undefined,
      rimLightDirection: profile.lighting.rimLightDirection ? normalizeVector(profile.lighting.rimLightDirection) : undefined,
    },
    camera: { ...profile.camera },
    renderResolution: renderResolutionOverride ? { ...renderResolutionOverride } : { ...profile.renderResolution },
    implementation: {
      backgroundColor: true,
      skinColor: true,
      materialMode: true,
      diffuse: true,
      ambient: true,
      specular: false,
      lightingMode: true,
      castShadow: false,
      projection: false,
      fovDeg: false,
      scale: true,
      verticalOffset: true,
      renderResolution: true,
      notes: [
        "Canvas2D renderer applies backgroundColor, skinColor, material ambient/diffuse, lighting intensities/directions, scale, verticalOffset, and renderResolution.",
        "specular, castShadow, physical perspective projection, and fovDeg are recorded for comparison metadata but are not physically implemented yet.",
      ],
    },
  }
}

function calculateRenderedIdealBrightness(
  normal: ObjVertex,
  appearance: AppliedObjRenderAppearanceProfile,
) {
  if (appearance.material.mode === "flat" || appearance.lighting.mode === "none") {
    return clamp(appearance.material.ambient * appearance.lighting.ambientIntensity, 0.35, 1)
  }

  const keyDirection = appearance.lighting.mode === "camera_front"
    ? { x: 0, y: 0, z: 1 }
    : appearance.lighting.keyLightDirection ?? RENDERED_IDEAL_LIGHT_DIRECTION
  const fillDirection = appearance.lighting.fillLightDirection ?? { x: 0.35, y: 0.15, z: 0.92 }
  const key = Math.max(0, dotVector(normal, normalizeVector(keyDirection))) * appearance.lighting.keyLightIntensity
  const fill = Math.max(0, dotVector(normal, normalizeVector(fillDirection))) * (appearance.lighting.fillLightIntensity ?? 0)
  const cameraFacing = Math.max(0, dotVector(normal, { x: 0, y: 0, z: 1 }))
  const rim = (1 - cameraFacing) * (appearance.lighting.rimLightIntensity ?? 0)

  return clamp(
    appearance.material.ambient * appearance.lighting.ambientIntensity +
      appearance.material.diffuse * (key + fill + rim),
    0.25,
    1,
  )
}

function getPrimaryRenderAppearanceLightDirection() {
  const appearance = getAppliedObjRenderAppearanceProfile()
  const direction = appearance.lighting.mode === "camera_front"
    ? { x: 0, y: 0, z: 1 }
    : appearance.lighting.keyLightDirection ?? RENDERED_IDEAL_LIGHT_DIRECTION
  return {
    x: roundForState(direction.x) ?? 0,
    y: roundForState(direction.y) ?? 0,
    z: roundForState(direction.z) ?? 0,
  }
}

function getRenderedIdealFaceColor(brightness: number, appearance: AppliedObjRenderAppearanceProfile) {
  const base = hexToRgb(appearance.skinColor) ?? { r: 205, g: 177, b: 151 }
  return rgbToCss({
    r: Math.round(base.r * brightness),
    g: Math.round(base.g * brightness),
    b: Math.round(base.b * brightness),
  })
}

function getRenderedIdealFaceStrokeColor(brightness: number, appearance: AppliedObjRenderAppearanceProfile) {
  const background = hexToRgb(appearance.backgroundColor)
  const isDarkBackground = background ? (background.r + background.g + background.b) / 3 < 120 : false
  const alpha = isDarkBackground ? 0.38 : appearance.id === "yaw_edge_friendly" ? 0.24 : 0.16
  const channel = Math.round(40 + 60 * brightness)
  return `rgba(${channel}, ${channel}, ${channel}, ${alpha})`
}

function hexToRgb(value: string) {
  const match = value.trim().match(/^#?([0-9a-fA-F]{6})$/)
  if (!match) {
    return null
  }
  const hex = match[1]
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  }
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
