import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision"
import type { Matrix, NormalizedLandmark } from "@mediapipe/tasks-vision"
import "./style.css"

type PreviewTab = "obj" | "renderedIdeal" | "live" | "placementAnalysis"
type DebugTab =
  | "summary"
  | "current"
  | "obj"
  | "renderedIdeal"
  | "poseMapping"
  | "objPoseCalibration"
  | "realtime"
  | "modeComparison"
  | "placementAnalysis"
  | "warpMesh"
  | "raw"
type PlaybackStatus = "stopped" | "playing" | "paused"
type ObjParseStatus = "not_loaded" | "not_parsed" | "parsed" | "error"
type ObjPreviewMode = "points" | "wireframe" | "points_wireframe"
type ObjPreviewStatus = "not_ready" | "ready" | "error"
type RenderedIdealRenderStatus = "not_ready" | "ready" | "rendered" | "error"
type RenderedIdealDetectionStatus = "idle" | "detecting" | "detected" | "not_detected" | "error"
type RenderedIdealStatus = "detected" | "missing" | "invalid"
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

type MatrixDebugSummary = {
  translation: { x: number; y: number; z: number } | null
  scale: { x: number; y: number; z: number; uniform: number } | null
  rotationDeg: ReferencePose
  raw: MatrixRawDebug
  columnMajor: MatrixPlacementCandidate
  rowMajor: MatrixPlacementCandidate
}

type MatrixRawDebug = {
  exists: boolean
  constructorName: string | null
  isArray: boolean
  keys: string[]
  data: number[] | null
  values: number[] | null
  rows: number | null
  columns: number | null
  rawObjectPreview: string | null
}

type MatrixPlacementCandidate = {
  translation: { x: number; y: number; z: number } | null
  scale: { x: number; y: number; z: number; uniform: number } | null
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
  matrix: MatrixDebugSummary | null
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

type WebglObjRendererMetadata = {
  kind: "webgl"
  version: "webgl_obj_renderer_v1"
  rendererSignature: string
  contextType: "webgl" | "experimental-webgl"
  projectionMode: "orthographic"
  renderResolution: {
    width: number
    height: number
  }
  rendererInfo: string | null
  vendorInfo: string | null
}

type ObjPoseMappingSampleRendererMetadata = {
  renderBackend: "webgl"
  rendererSignature: string
  rendererVersion: "webgl_obj_renderer_v1"
  projectionMode: "orthographic"
  renderResolution: {
    width: number
    height: number
  }
}

type ObjPoseMappingDatasetV2 = {
  schemaVersion: "obj_pose_mapping_dataset_v2" | "obj_pose_mapping_dataset_v3"
  createdAt: string
  renderBackend?: "webgl"
  renderer?: WebglObjRendererMetadata
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
    notAppliedRenderAppearanceFields?: string[]
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
  samples: Array<ObjPoseMappingDetectedSampleV2 & { renderer?: ObjPoseMappingSampleRendererMetadata }>
  failedSamples: Array<ObjPoseMappingFailedSampleV2 & { renderer?: ObjPoseMappingSampleRendererMetadata }>
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

type PoseMappingScalarRange = {
  min: number | null
  max: number | null
}

type PoseMappingProfileModel = {
  degree: number
  featureNames: string[]
  scaler: {
    mean: number[]
    scale: number[]
  }
  ridge: {
    alpha: number | null
    coef: number[][]
    intercept: number[]
  }
}

type PoseMappingRenderSettings = {
  detectCanvasWidth: number
  detectCanvasHeight: number
  previewCanvasWidth: number
  previewCanvasHeight: number
  renderResolutionSource: "profile.renderAppearance.applied.renderResolution" | "profile.renderSettings.canvasWidthHeight" | "fallbackDefault"
  detectCanvasMatchesProfile: boolean
  profileCanvasWidth: number | null
  profileCanvasHeight: number | null
}

type PoseMappingRenderAppearanceApplied = {
  backgroundColor: string
  skinColor: string
  material: AppliedObjRenderAppearanceProfile["material"]
  lighting: AppliedObjRenderAppearanceProfile["lighting"]
  camera: AppliedObjRenderAppearanceProfile["camera"]
  renderResolution: AppliedObjRenderAppearanceProfile["renderResolution"]
  notAppliedRenderAppearanceFields: string[]
}

type PoseMappingProfileMetadata = {
  renderAppearanceApplied: Record<string, unknown> | null
  renderSettings: Record<string, unknown> | null
  renderBackend: string | null
  renderer: Record<string, unknown> | null
  datasetSchemaVersion: string | null
  renderAppearance: Record<string, unknown> | null
}

type PoseMappingProfile = {
  schemaVersion: "pose_mapping_profile_candidate_v1" | "pose_mapping_profile_candidate_v2"
  modelType: "decision_tree_gate_polynomial_degree2_ridge"
  modelName: string | null
  datasetKind: string | null
  requiredRenderBackend: string | null
  requiredRenderer: Record<string, unknown> | null
  datasetSchemaVersion: string | null
  datasetMetadata: PoseMappingProfileMetadata
  inputFeatures: string[]
  target: string[]
  tree: {
    childrenLeft: number[]
    childrenRight: number[]
    feature: number[]
    threshold: number[]
  }
  experts: Record<string, PoseMappingProfileModel>
  fallbackModel: PoseMappingProfileModel
  errorSummary: Record<string, unknown>
  outlierFilterSummary: Record<string, unknown>
  poseRangeAfter: Record<string, PoseMappingScalarRange> | null
  raw: Record<string, unknown>
}

type PoseMappingProfileState = {
  loaded: boolean
  fileName: string | null
  fileSize: number | null
  profile: PoseMappingProfile | null
  errorMessage: string | null
  warnings: string[]
}

type PoseMappingEvaluateResult = {
  p: ObjPoseMappingPose
  P_camera: ObjPoseMappingPose
  P_cameraClamped: ObjPoseMappingPose
  clampApplied: boolean
  selectedLeaf: number | null
  usedExpert: string | null
  usedFallback: boolean
  warnings: string[]
}

type PoseMappingQualityGate = {
  usable: boolean
  reasons: string[]
}

type PoseMappingPoseDiff = {
  yaw: number | null
  pitch: number | null
  roll: number | null
  magnitude: number | null
}

type PoseMappingCurrentFaceStatus = "detected" | "missing" | "invalid"
type PoseMappingAlignmentMode =
  | "mediapipe_placement_center_scale"
  | "bounds_center_scale_v1"
type PlacementLandmarkSet =
  | "all_non_iris"
  | "stable_non_expression"
type BoundsScaleBasis =
  | "height"
  | "width"
  | "diag"
type PoseMappingAlignmentStatus =
  | "completed"
  | "skipped_no_current_face"
  | "skipped_no_rendered_ideal"
  | "skipped_missing_obj"
  | "skipped_missing_profile"
  | "skipped_profile_mismatch"
  | "skipped_generation_mismatch"
  | "skipped_missing_current_placement"
  | "skipped_missing_ideal_placement"
  | "skipped_invalid_placement"
  | "skipped_invalid_bounds"
  | "skipped_invalid_scale"
  | "stale"
  | "error"
type PoseMappingAlignmentSkippedReason =
  | "none"
  | "no_current_face"
  | "no_rendered_ideal"
  | "missing_obj"
  | "missing_profile"
  | "profile_mismatch"
  | "generation_mismatch"
  | "missing_current_placement"
  | "missing_ideal_placement"
  | "invalid_placement"
  | "invalid_bounds"
  | "invalid_scale"
  | "stale"
  | "error"
type PoseMappingStatus =
  | "ready"
  | "skipped_no_current_face"
  | "skipped_invalid_pose"
  | "running"
  | "completed"
  | "error"
type PoseMappingSkippedReason =
  | "none"
  | "no_current_face"
  | "invalid_pose"
  | "profile_mismatch"
type AssetStatus = "ready" | "missing" | "loading" | "invalid" | "error"
type AssetGeneration = {
  objGenerationId: number
  profileGenerationId: number
  renderSettingsGenerationId: number
  rendererGenerationId: number
}
type FrameGeneration = {
  frameId: number
  mediaTimeSec: number | null
  startedAtMs: number
}
type RenderedIdealFrameToken = AssetGeneration & {
  frameId: number
  mediaTimeSec: number | null
  p: ObjPoseMappingPose
}
type RenderPoseSource =
  | "pose_mapping_profile"
  | "fallback_zero_pose"
  | "preview_state"
  | "unknown"
type RenderPoseLifecycleDebug = {
  requestedPoseP: { yaw: number; pitch: number; roll: number } | null
  renderCallPoseP: { yaw: number; pitch: number; roll: number } | null
  previewStatePoseP: { yaw: number; pitch: number; roll: number } | null
  bufferBuildPoseP: { yaw: number; pitch: number; roll: number } | null
  webglUniformPoseP: { yaw: number; pitch: number; roll: number } | null
  actualRenderPoseP: { yaw: number; pitch: number; roll: number } | null
  renderPoseSource: RenderPoseSource
  buffer: RenderBufferPoseDebug
  detectCanvas: DetectCanvasPoseState
  recovery: PoseRecoveryDebug
  renderPoseAppliedToWebGL: boolean
  renderPoseMatchesToken: boolean
  renderPoseMismatchReason: string | null
}
type WebglProjectedImageBounds = {
  centerImageX: number
  centerImageY: number
  centerWorkX: number
  centerWorkY: number
  widthImage: number
  heightImage: number
  widthWork: number
  heightWork: number
  diagWork: number
  renderAspectRatio: number
  canvasWidth: number
  canvasHeight: number
}
type RenderBufferPoseDebug = {
  bufferPoseMode: "baked_vertices" | "shader_uniform" | "unknown"
  bufferPoseP: { yaw: number; pitch: number; roll: number } | null
  bufferGenerationId: number | null
  bufferReused: boolean
  bufferReuseReason: string | null
  baseProjectedBounds?: WebglProjectedImageBounds | null
}
type DetectCanvasPoseState = {
  canvasGenerationId: number
  canvasLastRenderedToken: RenderedIdealFrameToken | null
  canvasLastRenderedPoseP: { yaw: number; pitch: number; roll: number } | null
  canvasPoseMatchesRenderToken: boolean
  canvasWasClearedBeforeRender: boolean
  drawCompletedForToken: boolean
}
type PoseRecoveryDebug = {
  previousFrameStatus: string | null
  currentFrameStatus: string
  recoveredFromNoCurrentFace: boolean
  recoveredFromNoRenderedIdeal: boolean
  recoveredFromAlignmentSkip: boolean
  recoveryFrameId: number | null
  recoveryMediaTimeSec: number | null
  poseBeforeSkip: { yaw: number; pitch: number; roll: number } | null
  poseAfterRecovery: { yaw: number; pitch: number; roll: number } | null
  rendererWasReinitialized: boolean
  webglContextWasRecreated: boolean
  buffersWereRebuiltAfterRecovery: boolean
  uniformsWereResetAfterRecovery: boolean
}
type RenderedIdealLifecycle = {
  renderAttempted: boolean
  renderSucceeded: boolean
  detectAttempted: boolean
  detectSucceeded: boolean
  renderToken: RenderedIdealFrameToken | null
  detectTokenMatchesRenderToken: boolean
  detectCanvasWasClearedBeforeRender: boolean
  staleCanvasDetected: boolean
  fallbackRenderedIdealUsed: boolean
  renderPose: RenderPoseLifecycleDebug
}
type OverlayLifecycle = {
  current478Visible: boolean
  alignedRenderedIdealVisible: boolean
  correspondenceLinesVisible: boolean
  meshTargetVisible: boolean
  triangleTargetVisible: boolean
  lastGoodUsedForOverlay: boolean
  generationMatch: boolean
  tokenMatch: boolean
  renderPoseValid: boolean
  skippedReason: string
}
type AssetLifecycle = AssetGeneration & {
  objStatus: AssetStatus
  profileStatus: AssetStatus
  rendererStatus: AssetStatus
  profileRendererMatch: boolean
}
type FrameLifecycle = FrameGeneration & {
  currentFaceStatus: PoseMappingCurrentFaceStatus
  poseMappingStatus: PoseMappingStatus
  renderedIdealStatus: RenderedIdealStatus
  alignmentStatus: PoseMappingAlignmentStatus
  overlayIdealVisible: boolean
  overlaySkippedReason: string
}
type PoseMappingLastGoodState = {
  hasLastGood: boolean
  P_camera: ObjPoseMappingPose | null
  p: ObjPoseMappingPose | null
  P_confirm: ReferencePose
  renderedIdeal478: ReferenceLandmark[] | null
  alignedRenderedIdeal478: ReferenceLandmark[] | null
  updatedAtMs: number | null
  mediaTimeSec: number | null
  frameIndex: number | null
  ageMs: number | null
}
type PoseMappingStaleState = {
  isStale: boolean
  staleReason: string | null
  staleMs: number | null
}
type PoseMappingNoFaceCounters = {
  currentFaceMissingCount: number
  poseMappingSkippedNoCurrentFaceCount: number
  recoveredFromNoCurrentFaceCount: number
}
type PoseMappingExcludedReason =
  | "iris"
  | "expressionSensitive"
  | "invalid"
  | "unsafe"
  | "missingCurrent"
  | "missingIdeal"
  | "largeDisplacement"
type PoseMappingExcludedReasonCounts = Record<PoseMappingExcludedReason, number>
type PoseMappingDisplacementSummary = {
  mean: number | null
  p50: number | null
  p95: number | null
  max: number | null
}
type PoseMappingBounds = {
  minX: number
  maxX: number
  minY: number
  maxY: number
  width: number
  height: number
}
type BoundsPlacement = {
  center: { x: number; y: number }
  width: number
  height: number
  scaleByHeight: number
  scaleByWidth: number
  scaleByDiag: number
}
type BoundsCenterScaleAlignmentDebug = {
  mode: "bounds_center_scale_v1"
  placementLandmarkSet: PlacementLandmarkSet
  scaleBasis: BoundsScaleBasis
  rotationApplied: false
  currentBoundsWork: BoundsPlacement
  idealBoundsWork: BoundsPlacement
  currentCenterWork: { x: number; y: number }
  idealCenterWork: { x: number; y: number }
  currentScale: number
  idealScale: number
  scaleRatio: number
  translationWork: {
    x: number
    y: number
  }
  currentBoundsImage: BoundsPlacement
  renderedIdealBoundsImage: BoundsPlacement
  alignedRenderedIdealBoundsImage: BoundsPlacement
  alignedLandmarkCount: number
}
type PlacementDebugSide = {
  matrixRaw: MatrixRawDebug
  matrixColumnMajor: MatrixPlacementCandidate
  matrixRowMajor: MatrixPlacementCandidate
  boundsPlacement: BoundsPlacement | null
}
type PlacementDebugComparison = {
  columnMajorTranslationVsBoundsCenter: {
    currentDx: number | null
    currentDy: number | null
    idealDx: number | null
    idealDy: number | null
  }
  rowMajorTranslationVsBoundsCenter: {
    currentDx: number | null
    currentDy: number | null
    idealDx: number | null
    idealDy: number | null
  }
  matrixScaleVsBoundsScale: {
    currentColumnMajorScaleToBoundsHeight: number | null
    idealColumnMajorScaleToBoundsHeight: number | null
    currentRowMajorScaleToBoundsHeight: number | null
    idealRowMajorScaleToBoundsHeight: number | null
  }
}
type PlacementDebugState = {
  current: PlacementDebugSide
  ideal: PlacementDebugSide
  comparison: PlacementDebugComparison
}
type MediaPipeFacePlacement = {
  status: "detected" | "missing" | "invalid"
  source: "facialTransformationMatrix" | "faceDetectorBoundingBox" | "landmarkBounds" | "unknown"
  center: { x: number; y: number } | null
  scale: number | null
  raw?: {
    matrixTranslation?: { x: number; y: number; z: number } | null
    matrixScale?: { x: number; y: number; z: number; uniform: number } | null
    matrixRotationDeg?: ReferencePose
    boundsImage?: PoseMappingBounds | null
  }
  warnings: string[]
}
type PoseMappingAlignmentState = {
  status: PoseMappingAlignmentStatus
  mode: PoseMappingAlignmentMode
  rotationApplied: false
  placementLandmarkSet: PlacementLandmarkSet
  scaleBasis: BoundsScaleBasis
  placementSource: MediaPipeFacePlacement["source"]
  alignmentSkippedReason: PoseMappingAlignmentSkippedReason
  currentPlacement: MediaPipeFacePlacement
  idealPlacement: MediaPipeFacePlacement
  placementScaleRatio: number | null
  renderedIdealStatus: RenderedIdealStatus
  anchorCount: number
  currentCenter: { x: number; y: number } | null
  idealCenter: { x: number; y: number } | null
  scale: number | null
  videoAspectRatio: number | null
  renderAspectRatio: number | null
  currentBoundsImage: PoseMappingBounds | null
  renderedIdealBoundsImage: PoseMappingBounds | null
  currentBoundsAspectWork: PoseMappingBounds | null
  renderedIdealBoundsAspectWork: PoseMappingBounds | null
  alignedIdealBoundsAspectWork: PoseMappingBounds | null
  alignedRenderedIdealBoundsImage: PoseMappingBounds | null
  displayedContentRect: Rect | null
  placementDebug: PlacementDebugState
  boundsCenterScaleDebug: BoundsCenterScaleAlignmentDebug | null
  excludedReasonCounts: PoseMappingExcludedReasonCounts
  displacementSummary: PoseMappingDisplacementSummary
  anchorIndices: number[]
  landmarkReasons: Array<PoseMappingExcludedReason[]>
}

type PoseMappingRuntimeState = {
  status: "idle" | "running" | "completed" | "error"
  currentFaceStatus: PoseMappingCurrentFaceStatus
  renderedIdealStatus: RenderedIdealStatus
  alignmentStatus: PoseMappingAlignmentStatus
  alignmentSkippedReason: PoseMappingAlignmentSkippedReason
  poseMappingStatus: PoseMappingStatus
  poseMappingSkippedReason: PoseMappingSkippedReason
  fallbackPoseUsed: boolean
  fallbackRenderedIdealUsed: boolean
  lastGood: PoseMappingLastGoodState
  stale: PoseMappingStaleState
  noFaceCounters: PoseMappingNoFaceCounters
  lastUpdatedAt: string | null
  P_camera: ObjPoseMappingPose | null
  P_cameraClamped: ObjPoseMappingPose | null
  qualityGate: PoseMappingQualityGate
  p: ObjPoseMappingPose | null
  selectedLeaf: number | null
  usedExpert: string | null
  usedFallback: boolean
  warnings: string[]
  P_confirm: ReferencePose
  poseDiff: PoseMappingPoseDiff
  renderedIdealDetected: boolean
  renderedIdealLandmarkCount: number | null
  renderedIdeal478: ReferenceLandmark[] | null
  renderedIdealToken: RenderedIdealFrameToken | null
  alignedRenderedIdeal478: ReferenceLandmark[] | null
  alignedRenderedIdealToken: RenderedIdealFrameToken | null
  current478: ReferenceLandmark[] | null
  meshSourceVertices: ReferenceLandmark[] | null
  meshTargetVertices: ReferenceLandmark[] | null
  alignment: PoseMappingAlignmentState
  canvasWidth: number
  canvasHeight: number
  detectCanvasWidth: number
  detectCanvasHeight: number
  previewCanvasWidth: number
  previewCanvasHeight: number
  renderSettings: PoseMappingRenderSettings | null
  renderAppearanceApplied: PoseMappingRenderAppearanceApplied | null
  renderBackend: "webgl"
  renderer: WebglObjRendererMetadata | null
  profileRendererMatch: boolean
  profileMismatchError: string | null
  assetLifecycle: AssetLifecycle
  frameLifecycle: FrameLifecycle | null
  renderedIdealLifecycle: RenderedIdealLifecycle
  overlayLifecycle: OverlayLifecycle
  profileEvaluateMs: number | null
  renderMs: number | null
  detectMs: number | null
  totalMs: number | null
  previewDataUrl: string | null
  errorMessage: string | null
}

type DetectPerformanceStatus = "idle" | "running" | "completed" | "cancelled" | "error"
type DetectPerformancePhase = "warmup" | "measured"

type DetectPerformanceOptions = {
  warmupRuns: number
  measuredRuns: number
  resolutionList: number[]
}

type DetectPerformanceTimingSummary = {
  avgMs: number | null
  p50Ms: number | null
  p95Ms: number | null
  minMs: number | null
  maxMs: number | null
}

type DetectPerformanceSample = {
  runIndex: number
  phase: DetectPerformancePhase
  renderMs: number | null
  detectMs: number | null
  previewMs: number | null
  overlayMs: number | null
  toDataUrlMs: number | null
  totalMs: number | null
  detected: boolean | null
  landmarkCount: number | null
  errorMessage: string | null
}

type DetectPerformanceCaseResult = {
  caseId: string
  label: string
  sourceKind: string
  canvasWidth: number
  canvasHeight: number
  warmupRuns: number
  measuredRuns: number
  detectedCount: number
  failedCount: number
  summary: DetectPerformanceTimingSummary
  renderMs?: DetectPerformanceTimingSummary
  detectMs?: DetectPerformanceTimingSummary
  previewMs?: DetectPerformanceTimingSummary
  overlayMs?: DetectPerformanceTimingSummary
  toDataUrlMs?: DetectPerformanceTimingSummary
  totalMs?: DetectPerformanceTimingSummary
  samples: DetectPerformanceSample[]
}

type DetectPerformanceLandmarkerSummary = {
  runningMode: "IMAGE"
  requestedDelegate: string
  instanceReused: boolean
  createCount: number
}

type DetectPerformanceRenderSettingsSummary = {
  detectCanvasWidth: number
  detectCanvasHeight: number
  renderResolutionSource: PoseMappingRenderSettings["renderResolutionSource"] | null
  detectCanvasMatchesProfile: boolean
}

type DetectPerformanceExport = {
  type: "pose_mapping_detect_performance_debug_v1"
  createdAt: string
  source: {
    objFileName: string | null
    mp4FileName: string | null
    profileFileName: string | null
  }
  profile: {
    schemaVersion: string | null
    modelType: string | null
    modelName: string | null
    datasetKind: string | null
  }
  runtime: {
    P_camera: ObjPoseMappingPose | null
    p: ObjPoseMappingPose | null
    P_confirm: ReferencePose
    poseDiff: PoseMappingPoseDiff
  }
  landmarker: DetectPerformanceLandmarkerSummary
  renderSettings: DetectPerformanceRenderSettingsSummary
  benchmarkOptions: DetectPerformanceOptions
  cases: DetectPerformanceCaseResult[]
  notes: string[]
}

type DetectPerformanceState = {
  status: DetectPerformanceStatus
  startedAt: string | null
  completedAt: string | null
  errorMessage: string | null
  options: DetectPerformanceOptions
  result: DetectPerformanceExport | null
  notes: string[]
}

type RenderDetectHandoffStatus = DetectPerformanceStatus
type RenderDetectHandoffPhase = DetectPerformancePhase
type RenderDetectHandoffTimingField =
  | "renderMs"
  | "waitMs"
  | "bitmapCreateMs"
  | "copyMs"
  | "readbackMs"
  | "detectMs"
  | "totalMs"

type RenderDetectHandoffOptions = {
  warmupRuns: number
  measuredRuns: number
}

type RenderDetectHandoffSample = {
  runIndex: number
  phase: RenderDetectHandoffPhase
  renderMs: number | null
  waitMs: number | null
  bitmapCreateMs: number | null
  copyMs: number | null
  readbackMs: number | null
  detectMs: number | null
  totalMs: number | null
  detected: boolean | null
  landmarkCount: number | null
  errorMessage: string | null
}

type RenderDetectHandoffCaseSummary = Record<RenderDetectHandoffTimingField, DetectPerformanceTimingSummary>

type RenderDetectHandoffCaseResult = {
  caseId: string
  label: string
  handoffStrategy: string
  canvasWidth: number
  canvasHeight: number
  warmupRuns: number
  measuredRuns: number
  detectedCount: number
  failedCount: number
  summary: RenderDetectHandoffCaseSummary
  samples: RenderDetectHandoffSample[]
  notes: string[]
}

type RenderDetectHandoffConclusionHints = {
  detectOnlyAvgMs: number | null
  immediateRenderDetectAvgMs: number | null
  bestHandoffStrategy: string | null
  bestHandoffTotalAvgMs: number | null
  bestHandoffDetectAvgMs: number | null
}

type RenderDetectHandoffExport = {
  type: "pose_mapping_render_detect_handoff_debug_v1"
  createdAt: string
  source: DetectPerformanceExport["source"]
  profile: DetectPerformanceExport["profile"]
  runtime: DetectPerformanceExport["runtime"]
  landmarker: DetectPerformanceLandmarkerSummary
  renderSettings: DetectPerformanceRenderSettingsSummary
  benchmarkOptions: RenderDetectHandoffOptions
  cases: RenderDetectHandoffCaseResult[]
  conclusionHints: RenderDetectHandoffConclusionHints
  notes: string[]
}

type RenderDetectHandoffState = {
  status: RenderDetectHandoffStatus
  startedAt: string | null
  completedAt: string | null
  errorMessage: string | null
  options: RenderDetectHandoffOptions
  result: RenderDetectHandoffExport | null
  notes: string[]
}

type WebglObjBenchmarkStatus = DetectPerformanceStatus
type WebglObjBenchmarkPhase = DetectPerformancePhase
type WebglObjBenchmarkTimingField =
  | "webglRenderMs"
  | "finishMs"
  | "readPixelsMs"
  | "bitmapCreateMs"
  | "copyTo2dMs"
  | "detectMs"
  | "totalMs"

type WebglObjBenchmarkOptions = {
  warmupRuns: number
  measuredRuns: number
}

type WebglObjBenchmarkSupport = {
  supported: boolean
  contextType: "webgl" | "experimental-webgl" | null
  rendererInfo: string | null
  vendorInfo: string | null
  shaderCompileStatus: "ok" | "error" | "not_initialized"
  bufferStatus: "ok" | "error" | "not_initialized"
  projectionMode: "orthographic" | "perspective" | "unknown"
  cameraScale: number | null
  cameraVerticalOffset: number | null
  renderResolution: { width: number; height: number } | null
  notAppliedRenderAppearanceFields: string[]
  errorMessage: string | null
}

type WebglObjBenchmarkSample = {
  runIndex: number
  phase: WebglObjBenchmarkPhase
  webglRenderMs: number | null
  finishMs: number | null
  readPixelsMs: number | null
  bitmapCreateMs: number | null
  copyTo2dMs: number | null
  detectMs: number | null
  totalMs: number | null
  detected: boolean | null
  landmarkCount: number | null
  P_confirm: ReferencePose
  poseDiff: PoseMappingPoseDiff
  errorMessage: string | null
}

type WebglObjBenchmarkCaseSummary = Record<WebglObjBenchmarkTimingField, DetectPerformanceTimingSummary> & {
  poseDiffMagnitude: DetectPerformanceTimingSummary
}

type WebglObjBenchmarkCaseResult = {
  caseId: string
  label: string
  rendererKind: "webgl" | "canvas2d"
  handoffStrategy: string
  canvasWidth: number
  canvasHeight: number
  warmupRuns: number
  measuredRuns: number
  detectedCount: number
  failedCount: number
  summary: WebglObjBenchmarkCaseSummary
  samples: WebglObjBenchmarkSample[]
  notes: string[]
}

type WebglObjBenchmarkConclusionHints = {
  bestWebglTotalAvgMs: number | null
  bestWebglStrategy: string | null
  canvas2dImmediateTotalAvgMs: number | null
  canvas2dExplicitReadbackTotalAvgMs: number | null
  webglPoseDiffP95: number | null
  recommendation: string
}

type WebglObjBenchmarkExport = {
  type: "pose_mapping_webgl_obj_render_benchmark_v1"
  createdAt: string
  source: DetectPerformanceExport["source"]
  profile: DetectPerformanceExport["profile"]
  runtime: {
    P_camera: ObjPoseMappingPose | null
    p: ObjPoseMappingPose | null
    canvas2dConfirm: {
      P_confirm: ReferencePose
      poseDiff: PoseMappingPoseDiff
    }
  }
  landmarker: DetectPerformanceLandmarkerSummary
  renderSettings: {
    canvasWidth: number
    canvasHeight: number
    renderResolutionSource: PoseMappingRenderSettings["renderResolutionSource"] | null
    detectCanvasMatchesProfile: boolean
  }
  webgl: WebglObjBenchmarkSupport
  benchmarkOptions: WebglObjBenchmarkOptions
  cases: WebglObjBenchmarkCaseResult[]
  conclusionHints: WebglObjBenchmarkConclusionHints
  notes: string[]
}

type WebglObjBenchmarkState = {
  status: WebglObjBenchmarkStatus
  startedAt: string | null
  completedAt: string | null
  errorMessage: string | null
  options: WebglObjBenchmarkOptions
  result: WebglObjBenchmarkExport | null
  notes: string[]
}

type RenderPoseProbeStatus = "idle" | "running" | "completed" | "error"
type RenderPoseProbeSample = {
  id: string
  label: string
  requestedPoseP: ObjPoseMappingPose
  renderCallPoseP: ObjPoseMappingPose | null
  bufferBuildPoseP: ObjPoseMappingPose | null
  webglUniformPoseP: ObjPoseMappingPose | null
  actualRenderPoseP: ObjPoseMappingPose | null
  P_confirm: ReferencePose
  poseDiff: PoseMappingPoseDiff
  detected: boolean
  landmarkCount: number | null
  renderMs: number | null
  detectMs: number | null
  totalMs: number | null
  warning: string | null
  errorMessage: string | null
}
type RenderPoseProbeState = {
  status: RenderPoseProbeStatus
  runAfterNextRecovery: boolean
  lastRunTrigger: "manual" | "after_next_recovery" | null
  startedAt: string | null
  completedAt: string | null
  errorMessage: string | null
  samples: RenderPoseProbeSample[]
}

const RENDER_POSE_PROBE_POSES: Array<{
  id: string
  label: string
  p: ObjPoseMappingPose
}> = [
  { id: "front", label: "A: yaw 0 / pitch 0 / roll 0", p: { yaw: 0, pitch: 0, roll: 0 } },
  { id: "yaw_plus_25", label: "B: yaw 25 / pitch 0 / roll 0", p: { yaw: 25, pitch: 0, roll: 0 } },
  { id: "yaw_minus_25", label: "C: yaw -25 / pitch 0 / roll 0", p: { yaw: -25, pitch: 0, roll: 0 } },
  { id: "pitch_plus_20", label: "D: yaw 0 / pitch 20 / roll 0", p: { yaw: 0, pitch: 20, roll: 0 } },
  { id: "roll_plus_15", label: "E: yaw 0 / pitch 0 / roll 15", p: { yaw: 0, pitch: 0, roll: 15 } },
]

type WebglObjRenderer = {
  canvas: HTMLCanvasElement
  gl: WebGLRenderingContext
  contextType: "webgl" | "experimental-webgl"
  program: WebGLProgram
  positionBuffer: WebGLBuffer
  colorBuffer: WebGLBuffer
  positionLocation: number
  colorLocation: number
  clipScaleLocation: WebGLUniformLocation | null
  clipTranslateLocation: WebGLUniformLocation | null
  rendererInfo: string | null
  vendorInfo: string | null
}

type WebglClipPlacementTransform = {
  scaleX: number
  scaleY: number
  translateX: number
  translateY: number
}

type WebglObjRenderResult = {
  actualRenderPoseP: ObjPoseMappingPose
  renderCallPoseP: ObjPoseMappingPose
  previewStatePoseP: ObjPoseMappingPose
  bufferBuildPoseP: ObjPoseMappingPose
  webglUniformPoseP: ObjPoseMappingPose | null
  buffer: RenderBufferPoseDebug
}

type WebglObjRenderContext = {
  renderSettings: Pick<PoseMappingRenderSettings, "detectCanvasWidth" | "detectCanvasHeight">
  appearance: AppliedObjRenderAppearanceProfile
  p: ObjPoseMappingPose
  rotationCenter: ObjVertex
  clipPlacementTransform?: WebglClipPlacementTransform
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
  matrix: MatrixDebugSummary | null
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

type ModeComparisonDebugOptions = {
  previewSnapshotEnabled: boolean
  uiUpdateIntervalFrames: number
  summaryUpdateIntervalFrames: number
}

type ModeComparisonDebugCounters = {
  rvfcCallbackCount: number
  processedFrameCount: number
  intentionalSkipCount: number
  timestampSkipCount: number
  busySkipCount: number
  missingMediaTimeSkipCount: number
  presentedFramesDeltaSummary: TimingDistribution
  callbackWallDeltaMs: TimingDistribution
  mediaTimeDeltaMs: TimingDistribution
  processingMeasuredMs: TimingDistribution
  unmeasuredOverheadEstimateMs: TimingDistribution
  latestCallbackWallDeltaMs: number | null
  latestMediaTimeDeltaMs: number | null
  latestProcessingMeasuredMs: number | null
  latestUnmeasuredOverheadEstimateMs: number | null
  nextCallbackRegistrationTiming: "beforeProcessing" | "afterProcessing"
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
  callbackWallDeltaMs: number | null
  mediaTimeDeltaMs: number | null
  drawImageMs: number | null
  imageDetectMs: number | null
  videoDetectMs: number | null
  totalFrameProcessingMs: number | null
  processingMeasuredMs: number | null
  unmeasuredOverheadEstimateMs: number | null
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
  debugCounters: ModeComparisonDebugCounters
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

type PlacementMappingSample = {
  frameId: number
  mediaTimeSec: number | null
  P_camera: { yaw: number; pitch: number; roll: number } | null
  p: { yaw: number; pitch: number; roll: number } | null
  P_confirm: { yaw: number | null; pitch: number | null; roll: number | null } | null
  poseDiffMagnitude: number | null
  currentMatrixColumnMajorTranslation: { x: number; y: number; z: number } | null
  currentMatrixColumnMajorScale: { x: number; y: number; z: number; uniform: number } | null
  idealMatrixColumnMajorTranslation: { x: number; y: number; z: number } | null
  idealMatrixColumnMajorScale: { x: number; y: number; z: number; uniform: number } | null
  currentBoundsImage: BoundsPlacement | null
  idealBoundsImage: BoundsPlacement | null
  currentBoundsWork: BoundsPlacement | null
  idealBoundsWork: BoundsPlacement | null
  boundsScaleBasis: BoundsScaleBasis
  boundsScaleRatio: number | null
  videoAspectRatio: number | null
  renderAspectRatio: number | null
  qualityUsable: boolean
  skippedReason: string | null
}

type PlacementFunctionAnalysisRunStatus = "idle" | "running" | "stopped" | "completed" | "failed"
type PlacementFunctionAnalysisSkippedReason =
  | "no_face"
  | "invalid_landmarks"
  | "missing_matrix"
  | "invalid_matrix_values"
  | "render_pose_not_applied"
  | "render_pose_invalid"
  | "detect_error"

type PlacementFunctionScaleDetectionSummary = {
  visualScaleInput: number
  sampleCount: number
  detectedCount: number
  usableCount: number
  noFaceCount: number
  failedCount: number
}

type KnownPlacement = {
  centerImageX: number
  centerImageY: number
  centerWorkX: number
  centerWorkY: number
  visualScaleInput: number
  renderAspectRatio: number
  canvasWidth: number
  canvasHeight: number
}

type BasePlacement = WebglProjectedImageBounds
type TargetPlacement = WebglProjectedImageBounds

type KnownTransform = {
  transformOrder: "scale_then_translate"
  coordinateSpace: "aspect_corrected_work_coordinate"
  scaleBasis: "width"
  scaleRatio: number
  translateAfterScaleWorkX: number
  translateAfterScaleWorkY: number
}

type PlacementFunctionMatrixMajorSummary = {
  tx: number
  ty: number
  tz: number
  scaleX: number
  scaleY: number
  scaleZ: number
  uniformScale: number
}

type PlacementFunctionMatrixFeatures = {
  tx: number | null
  ty: number | null
  tz: number | null
  negTz: number | null
  invNegTz: number | null
  txOverNegTz: number | null
  tyOverNegTz: number | null
  matrixUniformScale: number | null
}

type PlacementFunctionObservedBounds = {
  centerImageX: number
  centerImageY: number
  centerWorkX: number
  centerWorkY: number
  scaleDiag: number
  scaleHeight: number
  scaleWidth: number
}

type PlacementFunctionAnalysisSample = {
  schemaVersion: "ideal_obj_render_warp_placement_function_sample_v1"
  sampleId: string
  sampleIndex: number
  capturedAtMs: number
  knownPlacement: KnownPlacement
  basePlacement: BasePlacement
  targetPlacement: TargetPlacement
  knownTransform: KnownTransform
  requestedPoseP: {
    yaw: number
    pitch: number
    roll: number
  }
  renderPoseDebug?: {
    renderPoseAppliedToWebGL?: boolean
    renderPoseValid?: boolean
    actualRenderPoseP?: {
      yaw: number
      pitch: number
      roll: number
    } | null
  }
  mediaPipeResult: {
    detected: boolean
    returnedLandmarkCount: number
    returnedPose?: {
      yaw: number
      pitch: number
      roll: number
    } | null
    poseDiffMagnitude?: number | null
  }
  facialTransformationMatrix: {
    available: boolean
    rows?: number
    columns?: number
    raw16?: number[]
    columnMajor?: PlacementFunctionMatrixMajorSummary
    rowMajor?: PlacementFunctionMatrixMajorSummary
  }
  matrixFeatures: PlacementFunctionMatrixFeatures
  observedRenderedBounds?: PlacementFunctionObservedBounds | null
  preview?: {
    hasSnapshot: boolean
  }
  quality: {
    usable: boolean
    skippedReason?: PlacementFunctionAnalysisSkippedReason
  }
}

type PlacementFunctionAnalysisSampleState = PlacementFunctionAnalysisSample & {
  previewLandmarks478: ReferenceLandmark[] | null
}

type PlacementFunctionAnalysisRunOptions = {
  centerImageXValues: number[]
  centerImageYValues: number[]
  visualScaleInputValues: number[]
  poseSet: "front"
  renderAspectRatio: number
  canvasWidth: number
  canvasHeight: number
}

type PlacementFunctionAnalysisExport = {
  schemaVersion: "ideal_obj_render_warp_placement_function_analysis_v1"
  exportedAt: string
  source: {
    tool: "ideal-obj-render-warp-lab"
    purpose: "matrix_to_known_transform_function_analysis"
  }
  renderAppearance: unknown
  runOptions: PlacementFunctionAnalysisRunOptions
  summary: {
    sampleCount: number
    usableSampleCount: number
    detectedCount: number
    matrixAvailableCount: number
    failedCount: number
    scaleDetectionSummary: PlacementFunctionScaleDetectionSummary[]
    skippedReasonCounts: Record<string, number>
    transformSummary: PlacementFunctionTransformSummary | null
  }
  samples: PlacementFunctionAnalysisSample[]
}

type PlacementFunctionCandidate = {
  schemaVersion: "matrix_to_known_transform_function_candidate_v1"
  createdAt: string
  source: {
    tool: "ideal-obj-render-warp-lab"
    sampleCount: number
    usableSampleCount: number
  }
  targetCoordinateSpace: "aspect_corrected_work_coordinate"
  transformOrder: "scale_then_translate"
  scaleBasis: "width"
  modelType: "linear_v1"
  features: {
    scaleRatio: ["intercept", "invNegTz"]
    translateAfterScaleWorkX: ["intercept", "txOverNegTz"]
    translateAfterScaleWorkY: ["intercept", "tyOverNegTz"]
  }
  models: {
    scaleRatio: {
      intercept: number
      coefficients: {
        invNegTz: number
      }
    }
    translateAfterScaleWorkX: {
      intercept: number
      coefficients: {
        txOverNegTz: number
      }
    }
    translateAfterScaleWorkY: {
      intercept: number
      coefficients: {
        tyOverNegTz: number
      }
    }
  }
  metrics: {
    maeScaleRatio: number
    maxScaleRatio: number
    maeTranslateAfterScaleWork: number
    maxTranslateAfterScaleWork: number
  }
  trainingDataSummary?: {
    scaleBasis: "width"
    transformOrder: "scale_then_translate"
    scaleRatioRange: [number, number] | null
    scaleRatioValues: number[]
    sampleCountByScaleRatio: Record<string, number>
  }
}

type PlacementFunctionAnalysisRange = {
  min: number
  max: number
}

type PlacementFunctionTransformSummary = {
  transformOrder: "scale_then_translate"
  scaleBasis: "width"
  scaleRatioMin: number
  scaleRatioMax: number
  translateAfterScaleWorkXMin: number
  translateAfterScaleWorkXMax: number
  translateAfterScaleWorkYMin: number
  translateAfterScaleWorkYMax: number
}

type PlacementFunctionAnalysisSummary = {
  sampleCount: number
  usableSampleCount: number
  detectedCount: number
  matrixAvailableCount: number
  failedCount: number
  featureRanges: {
    tx: PlacementFunctionAnalysisRange | null
    ty: PlacementFunctionAnalysisRange | null
    tz: PlacementFunctionAnalysisRange | null
    txOverNegTz: PlacementFunctionAnalysisRange | null
    tyOverNegTz: PlacementFunctionAnalysisRange | null
    invNegTz: PlacementFunctionAnalysisRange | null
  }
  knownPlacementRanges: {
    centerWorkX: PlacementFunctionAnalysisRange | null
    centerWorkY: PlacementFunctionAnalysisRange | null
    visualScaleInput: PlacementFunctionAnalysisRange | null
  }
  scaleDetectionSummary: PlacementFunctionScaleDetectionSummary[]
  skippedReasonCounts: Record<string, number>
  transformSummary: PlacementFunctionTransformSummary | null
}

type PlacementFunctionAnalysisState = {
  status: PlacementFunctionAnalysisRunStatus
  startedAt: string | null
  completedAt: string | null
  latestError: string | null
  runOptions: PlacementFunctionAnalysisRunOptions
  samples: PlacementFunctionAnalysisSampleState[]
  selectedSampleIndex: number | null
  showOverlay: boolean
  summary: PlacementFunctionAnalysisSummary
  candidate: PlacementFunctionCandidate | null
  candidateUnavailableReason: string | null
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
  debugOptions: ModeComparisonDebugOptions
  debugCounters: ModeComparisonDebugCounters
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
  poseMappingSettings: {
    alignmentMode: PoseMappingAlignmentMode
    placementLandmarkSet: PlacementLandmarkSet
    boundsScaleBasis: BoundsScaleBasis
    hideIdealOverlayWhenRenderPoseNotApplied: boolean
  }
  overlay: {
    showCurrentLandmarks478: boolean
    showAlignedIdealLandmarks478: boolean
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
  poseMappingProfile: PoseMappingProfileState
  poseMappingRuntime: PoseMappingRuntimeState
  assetGeneration: AssetGeneration
  nextFrameId: number
  detectPerformance: DetectPerformanceState
  renderDetectHandoff: RenderDetectHandoffState
  webglObjBenchmark: WebglObjBenchmarkState
  renderPoseProbe: RenderPoseProbeState
  placementAnalysis: PlacementFunctionAnalysisState
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
const IRIS_LANDMARK_START = 468
const IRIS_LANDMARK_END = 477
const EXPRESSION_SENSITIVE_LANDMARK_INDICES = new Set([
  0, 7, 13, 14, 17, 33, 37, 39, 40, 61, 78, 80, 81, 82, 84, 87, 88, 91, 95,
  133, 144, 145, 146, 153, 154, 155, 157, 158, 159, 160, 161, 163, 173, 178,
  181, 185, 191, 246, 249, 263, 267, 269, 270, 291, 308, 310, 311, 312, 314,
  317, 318, 321, 324, 362, 373, 374, 375, 380, 381, 382, 384, 385, 386, 387,
  388, 390, 398, 402, 405, 409, 415, 466,
])
const ALIGNMENT_MIN_ANCHOR_COUNT = 24
const ALIGNMENT_UNSAFE_MIN = -0.25
const ALIGNMENT_UNSAFE_MAX = 1.25
const ALIGNMENT_LARGE_DISPLACEMENT_THRESHOLD = 0.18
const PLACEMENT_MATRIX_BOUNDS_CENTER_MISMATCH_THRESHOLD = 0.05
const PLACEMENT_IDENTITY_EPSILON = 1e-6
const MEDIAPIPE_TIMESTAMP_STEP_MS = 1000 / 30
const LIVE_AUTO_ANALYSIS_INTERVAL_SEC = 0.35
const DETECT_PERFORMANCE_DEFAULT_OPTIONS: DetectPerformanceOptions = {
  warmupRuns: 3,
  measuredRuns: 20,
  resolutionList: [1179, 1024, 768, 640, 512],
}
const RENDER_DETECT_HANDOFF_DEFAULT_OPTIONS: RenderDetectHandoffOptions = {
  warmupRuns: 3,
  measuredRuns: 20,
}
const WEBGL_OBJ_BENCHMARK_DEFAULT_OPTIONS: WebglObjBenchmarkOptions = {
  warmupRuns: 3,
  measuredRuns: 20,
}
const PLACEMENT_ANALYSIS_DEFAULT_CANVAS_SIZE = { width: 960, height: 540 } as const
const PLACEMENT_ANALYSIS_CENTER_VALUES = [0.42, 0.46, 0.5, 0.54, 0.58] as const
const PLACEMENT_ANALYSIS_SCALE_VALUES = [1.1, 1.15, 1.2, 1.25, 1.3] as const
const PLACEMENT_ANALYSIS_FRONT_POSE: ObjPoseMappingPose = { yaw: 0, pitch: 0, roll: 0 }
const PLACEMENT_ANALYSIS_SKIPPED_REASONS: PlacementFunctionAnalysisSkippedReason[] = [
  "no_face",
  "invalid_landmarks",
  "missing_matrix",
  "invalid_matrix_values",
  "render_pose_not_applied",
  "render_pose_invalid",
  "detect_error",
]
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
const WEBGL_OBJ_RENDERER_VERSION = "webgl_obj_renderer_v1" as const
const WEBGL_OBJ_RENDERER_PROJECTION_MODE = "orthographic" as const
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
  { label: "配置関数解析プレビュー", value: "placementAnalysis" },
]

const debugTabs: TabOption<DebugTab>[] = [
  { label: "概要", value: "summary" },
  { label: "現在顔", value: "current" },
  { label: "OBJ", value: "obj" },
  { label: "レンダー理想", value: "renderedIdeal" },
  { label: "Pose Mapping（姿勢対応）", value: "poseMapping" },
  { label: "p,Pデータ", value: "objPoseCalibration" },
  { label: "リアルタイム", value: "realtime" },
  { label: "モード比較", value: "modeComparison" },
  { label: "配置関数解析", value: "placementAnalysis" },
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

const DEFAULT_POSE_MAPPING_SETTINGS: LabState["poseMappingSettings"] = {
  alignmentMode: "bounds_center_scale_v1",
  placementLandmarkSet: "all_non_iris",
  boundsScaleBasis: "diag",
  hideIdealOverlayWhenRenderPoseNotApplied: true,
}

const state: LabState = {
  activePreviewTab: "obj",
  activeDebugTab: "summary",
  poseMappingSettings: { ...DEFAULT_POSE_MAPPING_SETTINGS },
  overlay: {
    showCurrentLandmarks478: true,
    showAlignedIdealLandmarks478: true,
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
  poseMappingProfile: createDefaultPoseMappingProfileState(),
  poseMappingRuntime: createDefaultPoseMappingRuntimeState(),
  assetGeneration: createDefaultAssetGeneration(),
  nextFrameId: 1,
  detectPerformance: createDefaultDetectPerformanceState(),
  renderDetectHandoff: createDefaultRenderDetectHandoffState(),
  webglObjBenchmark: createDefaultWebglObjBenchmarkState(),
  renderPoseProbe: createDefaultRenderPoseProbeState(),
  placementAnalysis: createDefaultPlacementFunctionAnalysisState(),
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
  logs: ["ラボを初期化しました。renderedIdeal478 を current478 に位置合わせし、ライブ映像上の overlay で確認します。"],
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
        <button class="secondary-button" type="button" data-action="load-pose-mapping-profile">poseMappingProfile読込（関数読込）</button>
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
        <button class="secondary-button" type="button" data-action="export-placement-mapping-samples-json">Placement samples JSON</button>
        <button class="secondary-button" type="button" data-action="export-placement-mapping-samples-csv">Placement samples CSV</button>
      </div>
      <input class="visually-hidden" type="file" accept=".obj,text/plain,model/obj" data-input="obj-file" />
      <input class="visually-hidden" type="file" accept=".json,application/json" data-input="pose-mapping-profile-file" />
      <input class="visually-hidden" type="file" accept="video/*" data-input="live-video" />
      <div class="status-note">
        OBJ Pose Dataset（OBJ姿勢データ）を生成します。OBJに与えた renderPose を p、MediaPipe の returnedPose を P としてJSONに保存します。
      </div>
      <p class="export-status" data-debug-export-status></p>
            <div class="review-card pose-mapping-controls" aria-label="Pose Mapping alignment controls">
              <label class="select-field">
                <span>Alignment mode（位置合わせ）</span>
                <select data-control="pose-mapping-alignment-mode">
                  <option value="mediapipe_placement_center_scale">Matrix placement（行列配置）</option>
                  <option value="bounds_center_scale_v1">Bounds center + scale（外枠中心と拡大率）</option>
                </select>
              </label>
              <label class="select-field">
                <span>Bounds landmarks（外枠計算点）</span>
                <select data-control="pose-mapping-placement-landmark-set">
                  <option value="all_non_iris">all_non_iris</option>
                  <option value="stable_non_expression">stable_non_expression</option>
                </select>
              </label>
              <label class="select-field">
                <span>Scale basis（拡大率基準）</span>
                <select data-control="pose-mapping-bounds-scale-basis">
                  <option value="height">height</option>
                  <option value="width">width</option>
                  <option value="diag">diag</option>
                </select>
              </label>
              <label class="overlay-toggle">
                <input type="checkbox" data-control="pose-mapping-hide-overlay-on-render-pose-not-applied" />
                <span>Hide ideal overlay when render pose not applied</span>
              </label>
            </div>
          </section>

    <section class="panel center-panel" aria-label="プレビュー">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Preview</p>
          <h2>プレビュー</h2>
        </div>
        <div class="overlay-toggles">
          <fieldset class="overlay-toggle-group">
            <legend>Live Overlay（ライブ重ね表示）</legend>
            ${renderOverlayToggle("toggle-current-landmarks", "現在顔478点を表示")}
            ${renderOverlayToggle("toggle-aligned-ideal-landmarks", "位置合わせ済み理想478点を表示")}
            ${renderOverlayToggle("toggle-mesh-pairs", "対応線を表示")}
            ${renderOverlayToggle("toggle-excluded-landmarks", "除外 / 固定 landmark を表示")}
          </fieldset>
          <fieldset class="overlay-toggle-group">
            <legend>Mesh Debug（メッシュデバッグ）</legend>
            ${renderOverlayToggle("toggle-mesh-source", "mesh sourceを表示")}
            ${renderOverlayToggle("toggle-mesh-target", "mesh targetを表示")}
            ${renderOverlayToggle("toggle-grid-anchors", "grid / anchorsを表示")}
            ${renderOverlayToggle("toggle-triangle-mesh", "triangle meshを表示")}
          </fieldset>
        </div>
      </div>
      ${renderTabs("preview", previewTabs, state.activePreviewTab)}
      <div class="preview-stack">
        ${renderObjPreview()}
        ${renderRenderedIdealPreview()}
        ${renderLivePreview()}
        ${renderPlacementAnalysisPreview()}
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
const poseMappingProfileFileInput = getElement<HTMLInputElement>("[data-input='pose-mapping-profile-file']")
const liveFileInput = getElement<HTMLInputElement>("[data-input='live-video']")
const liveVideoElement = getElement<HTMLVideoElement>("[data-video='live']")
const liveOverlayCanvas = getElement<HTMLCanvasElement>("[data-overlay='live']")
const objPreviewCanvas = getElement<HTMLCanvasElement>('[data-canvas="obj-preview"]')
const renderedIdealCanvas = getElement<HTMLCanvasElement>('[data-canvas="rendered-ideal"]')
const renderedIdealOverlayCanvas = getElement<HTMLCanvasElement>('[data-overlay="rendered-ideal"]')
const placementAnalysisRenderCanvas = getElement<HTMLCanvasElement>('[data-canvas="placement-analysis-render"]')
const placementAnalysisOverlayCanvas = getElement<HTMLCanvasElement>('[data-overlay="placement-analysis"]')
const liveObjPosePreviewCanvas = document.createElement("canvas")
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
let poseMappingRuntimeInProgress = false
let detectPerformanceCancelRequested = false
let renderDetectHandoffCancelRequested = false
let webglObjBenchmarkCancelRequested = false
let webglObjBenchmarkRenderer: WebglObjRenderer | null = null
let placementAnalysisCancelRequested = false
let placementAnalysisRenderer: WebglObjRenderer | null = null
let webglRenderBufferGenerationId = 0
let webglDetectCanvasGenerationId = 0
let renderedIdealFaceLandmarkerCreateCount = 0
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
let modeComparisonProcessing = false
let modeComparisonLastCallbackWallMs: number | null = null
let modeComparisonLastCallbackMediaTimeSec: number | null = null
let modeComparisonCallbackWallDeltaSamples: number[] = []
let modeComparisonMediaTimeDeltaSamples: number[] = []
let modeComparisonProcessingMeasuredSamples: number[] = []
let modeComparisonUnmeasuredOverheadSamples: number[] = []
const modeComparisonCanvas = document.createElement("canvas")
let realtimeRunStartedAtMs: number | null = null
let realtimeTickInProgress = false
let realtimeTimingSamples: RealtimeTimingSample[] = []
let lastRealtimeAnimationFrameCurrentTimeSec: number | null = null
let cameraStream: MediaStream | null = null
let objPoseMappingDatasetSamples: ObjPoseMappingSample[] = []
let objPoseMappingDataset: ObjPoseMappingDatasetV2 | null = null
let placementMappingSamples: PlacementMappingSample[] = []
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
          <div class="review-card" data-pose-mapping-live-summary>
            <p>poseMappingProfile を読み込むと、P_camera -> p -> render -> detect -> P_confirm の確認結果を表示します。</p>
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

function renderPlacementAnalysisPreview() {
  return `
    <div class="preview-card placement-analysis-preview-card" data-preview-panel="placementAnalysis">
      <div class="preview-stage placement-analysis-stage" data-placement-analysis-stage data-analysis-status="empty">
        <canvas class="placement-analysis-render-canvas" data-canvas="placement-analysis-render" aria-label="配置関数解析 WebGL render image"></canvas>
        <canvas class="placement-analysis-overlay-canvas" data-overlay="placement-analysis" aria-label="配置関数解析 MediaPipe returned 478 overlay"></canvas>
        <div class="preview-placeholder" data-placement-analysis-placeholder>
          <h3>配置関数解析プレビュー</h3>
          <p>右ペインの配置関数解析タブで解析を実行すると、専用 canvas の WebGL レンダー画像と MediaPipe 返却478点 overlay を表示します。</p>
        </div>
      </div>
      <div class="obj-preview-controls placement-analysis-preview-controls" aria-label="配置関数解析プレビュー操作">
        <div class="button-row">
          <button class="small-button" type="button" data-action="placement-analysis-prev-sample">前のサンプル</button>
          <button class="small-button" type="button" data-action="placement-analysis-next-sample">次のサンプル</button>
        </div>
        <label class="select-field">
          <span>サンプル番号</span>
          <input type="number" min="0" step="1" value="0" data-control="placement-analysis-sample-index" />
        </label>
        <label class="overlay-toggle">
          <input type="checkbox" data-control="placement-analysis-show-overlay" checked />
          <span>478点表示</span>
        </label>
      </div>
      <div class="review-card" data-placement-analysis-preview-summary>
        <p>解析結果はまだありません。</p>
      </div>
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

  getElement<HTMLButtonElement>('[data-action="load-pose-mapping-profile"]').addEventListener("click", () => {
    poseMappingProfileFileInput.click()
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

  getElement<HTMLButtonElement>('[data-action="export-obj-pose-mapping-dataset"]').addEventListener("click", () => {
    void exportObjPoseMappingDataset()
  })

  getElement<HTMLButtonElement>('[data-action="export-placement-mapping-samples-json"]').addEventListener("click", () => {
    exportPlacementMappingSamplesJson()
  })

  getElement<HTMLButtonElement>('[data-action="export-placement-mapping-samples-csv"]').addEventListener("click", () => {
    exportPlacementMappingSamplesCsv()
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

  poseMappingProfileFileInput.addEventListener("change", (event) => {
    const file = getSelectedFile(event)
    if (file) {
      void loadPoseMappingProfileFile(file)
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
      incrementRenderSettingsGeneration()
      clearRuntimeRenderArtifacts("render_settings_changed")
      renderAll()
    }
  })

  getElement<HTMLSelectElement>('[data-control="rendered-ideal-color"]').addEventListener("change", (event) => {
    const value = event.currentTarget.value
    if (isRenderedIdealColorMode(value)) {
      state.renderedIdeal.colorMode = value
      incrementRenderSettingsGeneration()
      clearRuntimeRenderArtifacts("render_settings_changed")
      renderAll()
    }
  })

  getElement<HTMLSelectElement>('[data-control="render-appearance-profile"]').addEventListener("change", (event) => {
    const value = event.currentTarget.value
    if (isObjRenderAppearanceProfileId(value)) {
      state.renderedIdeal.renderAppearanceProfileId = value
      incrementRenderSettingsGeneration()
      clearRuntimeRenderArtifacts("render_settings_changed")
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

  getElement<HTMLSelectElement>('[data-control="pose-mapping-alignment-mode"]').addEventListener("change", (event) => {
    const value = event.currentTarget.value
    if (isPoseMappingAlignmentMode(value)) {
      state.poseMappingSettings.alignmentMode = value
      clearRuntimeRenderArtifacts("alignment_settings_changed")
      renderAll()
    }
  })

  getElement<HTMLSelectElement>('[data-control="pose-mapping-placement-landmark-set"]').addEventListener("change", (event) => {
    const value = event.currentTarget.value
    if (isPlacementLandmarkSet(value)) {
      state.poseMappingSettings.placementLandmarkSet = value
      clearRuntimeRenderArtifacts("alignment_settings_changed")
      renderAll()
    }
  })

  getElement<HTMLSelectElement>('[data-control="pose-mapping-bounds-scale-basis"]').addEventListener("change", (event) => {
    const value = event.currentTarget.value
    if (isBoundsScaleBasis(value)) {
      state.poseMappingSettings.boundsScaleBasis = value
      clearRuntimeRenderArtifacts("alignment_settings_changed")
      renderAll()
    }
  })

  getElement<HTMLInputElement>('[data-control="pose-mapping-hide-overlay-on-render-pose-not-applied"]').addEventListener("change", (event) => {
    state.poseMappingSettings.hideIdealOverlayWhenRenderPoseNotApplied = event.currentTarget.checked
    renderAll({ skipObjRender: true })
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

  app.addEventListener("change", (event) => {
    const target = event.target
    if (!(target instanceof HTMLInputElement)) {
      return
    }
    if (target.dataset.control === "mode-comparison-preview-snapshot-enabled") {
      state.modeComparison = {
        ...state.modeComparison,
        debugOptions: {
          ...state.modeComparison.debugOptions,
          previewSnapshotEnabled: target.checked,
        },
      }
      renderDebugContent()
    }
  })

  app.addEventListener("input", (event) => {
    const target = event.target
    if (!(target instanceof HTMLInputElement)) {
      return
    }
    if (target.dataset.control === "mode-comparison-ui-update-interval") {
      updateModeComparisonDebugOptionNumber("uiUpdateIntervalFrames", target.value)
    }
    if (target.dataset.control === "mode-comparison-summary-update-interval") {
      updateModeComparisonDebugOptionNumber("summaryUpdateIntervalFrames", target.value)
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
    if (action === "pose-mapping-download-debug") {
      exportPoseMappingDebug()
    }
    if (action === "render-pose-probe-run") {
      void runRenderPoseProbe()
    }
    if (action === "render-pose-probe-after-recovery") {
      armRenderPoseProbeAfterNextRecovery()
    }
    if (action === "detect-performance-run") {
      void startDetectPerformanceBenchmark()
    }
    if (action === "detect-performance-stop") {
      stopDetectPerformanceBenchmark()
    }
    if (action === "detect-performance-download-json") {
      exportDetectPerformanceJson()
    }
    if (action === "detect-performance-download-csv") {
      exportDetectPerformanceCsv()
    }
    if (action === "handoff-benchmark-run") {
      void startRenderDetectHandoffBenchmark()
    }
    if (action === "handoff-benchmark-stop") {
      stopRenderDetectHandoffBenchmark()
    }
    if (action === "handoff-benchmark-download-json") {
      exportRenderDetectHandoffJson()
    }
    if (action === "handoff-benchmark-download-csv") {
      exportRenderDetectHandoffCsv()
    }
    if (action === "webgl-obj-benchmark-run") {
      void startWebglObjBenchmark()
    }
    if (action === "webgl-obj-benchmark-stop") {
      stopWebglObjBenchmark()
    }
    if (action === "webgl-obj-benchmark-download-json") {
      exportWebglObjBenchmarkJson()
    }
    if (action === "webgl-obj-benchmark-download-csv") {
      exportWebglObjBenchmarkCsv()
    }
    if (action === "placement-analysis-run") {
      void startPlacementFunctionAnalysis()
    }
    if (action === "placement-analysis-stop") {
      stopPlacementFunctionAnalysis()
    }
    if (action === "placement-analysis-download-json") {
      exportPlacementFunctionAnalysisJson()
    }
    if (action === "placement-analysis-download-csv") {
      exportPlacementFunctionAnalysisCsv()
    }
    if (action === "placement-analysis-download-candidate-json") {
      exportPlacementFunctionCandidateJson()
    }
    if (action === "placement-analysis-prev-sample") {
      selectPlacementAnalysisSample((state.placementAnalysis.selectedSampleIndex ?? 0) - 1)
    }
    if (action === "placement-analysis-next-sample") {
      selectPlacementAnalysisSample((state.placementAnalysis.selectedSampleIndex ?? -1) + 1)
    }
  })

  bindOverlayToggle("toggle-current-landmarks", "showCurrentLandmarks478")
  bindOverlayToggle("toggle-aligned-ideal-landmarks", "showAlignedIdealLandmarks478")
  bindOverlayToggle("toggle-mesh-source", "showMeshSource")
  bindOverlayToggle("toggle-mesh-target", "showMeshTarget")
  bindOverlayToggle("toggle-mesh-pairs", "showMeshPairs")
  bindOverlayToggle("toggle-excluded-landmarks", "showExcludedLandmarks")
  bindOverlayToggle("toggle-grid-anchors", "showGridAnchors")
  bindOverlayToggle("toggle-triangle-mesh", "showTriangleMesh")

  getElement<HTMLInputElement>('[data-control="placement-analysis-show-overlay"]').addEventListener("change", (event) => {
    state.placementAnalysis.showOverlay = event.currentTarget.checked
    renderPlacementAnalysisPreviewPanel()
  })

  getElement<HTMLInputElement>('[data-control="placement-analysis-sample-index"]').addEventListener("input", (event) => {
    selectPlacementAnalysisSample(Math.round(Number(event.currentTarget.value)))
  })
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

function updateModeComparisonDebugOptionNumber(
  key: "uiUpdateIntervalFrames" | "summaryUpdateIntervalFrames",
  valueText: string,
) {
  const value = Math.max(1, Math.round(Number(valueText) || 1))
  state.modeComparison = {
    ...state.modeComparison,
    debugOptions: {
      ...state.modeComparison.debugOptions,
      [key]: value,
    },
  }
  if (state.activeDebugTab === "modeComparison") {
    renderDebugContent()
  }
}

async function loadObjFile(file: File) {
  incrementObjGeneration()
  clearRuntimeRenderArtifacts("obj_loading")
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
    incrementObjGeneration()
    clearRuntimeRenderArtifacts("obj_ready")
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
    incrementObjGeneration()
    clearRuntimeRenderArtifacts("obj_error")
    addLog(`OBJ解析に失敗しました: ${message}`)
  }

  renderAll()
}

async function loadPoseMappingProfileFile(file: File) {
  incrementProfileGeneration()
  clearRuntimeRenderArtifacts("profile_loading")
  state.poseMappingProfile = {
    ...createDefaultPoseMappingProfileState(),
    fileName: file.name,
    fileSize: file.size,
  }
  state.activeDebugTab = "poseMapping"
  renderAll()

  try {
    const text = await file.text()
    const json = JSON.parse(text) as unknown
    const profile = parsePoseMappingProfile(json)
    state.poseMappingProfile = {
      loaded: true,
      fileName: file.name,
      fileSize: file.size,
      profile,
      errorMessage: null,
      warnings: [],
    }
    incrementProfileGeneration()
    addLog(`poseMappingProfileを読み込みました: ${file.name}`)
    await updatePoseMappingRuntimeFromCurrentAnalysis()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    state.poseMappingProfile = {
      loaded: false,
      fileName: file.name,
      fileSize: file.size,
      profile: null,
      errorMessage: message,
      warnings: [],
    }
    state.poseMappingRuntime = {
      ...createDefaultPoseMappingRuntimeState(),
      status: "error",
      errorMessage: message,
      lastUpdatedAt: formatUpdatedAt(),
    }
    incrementProfileGeneration()
    clearRuntimeRenderArtifacts("profile_error")
    addLog(`poseMappingProfileの読み込みに失敗しました: ${message}`)
    renderAll()
  }
}

function parsePoseMappingProfile(json: unknown): PoseMappingProfile {
  const source = requireRecord(json, "poseMappingProfile")
  const schemaVersion = requireString(source, "schemaVersion")
  const modelType = requireString(source, "modelType")
  const inputFeatures = requireStringArray(source, "inputFeatures")
  const target = requireStringArray(source, "target")
  const tree = requireRecord(source.tree, "tree")
  const expertsSource = requireRecord(source.experts, "experts")

  if (schemaVersion !== "pose_mapping_profile_candidate_v1" && schemaVersion !== "pose_mapping_profile_candidate_v2") {
    throw new Error(`unsupported schemaVersion: ${schemaVersion}`)
  }
  if (modelType !== "decision_tree_gate_polynomial_degree2_ridge") {
    throw new Error(`unsupported modelType: ${modelType}`)
  }
  for (const feature of ["P_yaw", "P_pitch", "P_roll"]) {
    if (!inputFeatures.includes(feature)) {
      throw new Error(`inputFeatures must include ${feature}`)
    }
  }
  for (const output of ["p_yaw", "p_pitch", "p_roll"]) {
    if (!target.includes(output)) {
      throw new Error(`target must include ${output}`)
    }
  }
  if (!isRecord(source.fallbackModel)) {
    throw new Error("fallbackModel is required")
  }
  if (!isRecord(source.errorSummary)) {
    throw new Error("errorSummary is required")
  }
  if (!isRecord(source.outlierFilterSummary)) {
    throw new Error("outlierFilterSummary is required")
  }

  const experts: Record<string, PoseMappingProfileModel> = {}
  Object.entries(expertsSource).forEach(([leaf, model]) => {
    experts[leaf] = parsePoseMappingProfileModel(model, `experts.${leaf}`)
  })

  return {
    schemaVersion,
    modelType,
    modelName: getOptionalString(source.modelName),
    datasetKind: getOptionalString(source.datasetKind),
    requiredRenderBackend: getOptionalString(source.requiredRenderBackend),
    requiredRenderer: isRecord(source.requiredRenderer) ? source.requiredRenderer : null,
    datasetSchemaVersion: getOptionalString(source.datasetSchemaVersion),
    datasetMetadata: parsePoseMappingProfileMetadata(source),
    inputFeatures,
    target,
    tree: {
      childrenLeft: requireNumberArray(tree, "childrenLeft"),
      childrenRight: requireNumberArray(tree, "childrenRight"),
      feature: requireNumberArray(tree, "feature"),
      threshold: requireNumberArray(tree, "threshold"),
    },
    experts,
    fallbackModel: parsePoseMappingProfileModel(source.fallbackModel, "fallbackModel"),
    errorSummary: source.errorSummary,
    outlierFilterSummary: source.outlierFilterSummary,
    poseRangeAfter: parsePoseRangeAfter(source.poseRangeAfter ?? source.outlierFilterSummary.poseRangeAfter),
    raw: source,
  }
}

function parsePoseMappingProfileModel(value: unknown, label: string): PoseMappingProfileModel {
  const source = requireRecord(value, label)
  const scaler = requireRecord(source.scaler, `${label}.scaler`)
  const ridge = requireRecord(source.ridge, `${label}.ridge`)
  const coef = source.ridge && isRecord(source.ridge)
    ? parseCoefficientMatrix(source.ridge.coef, `${label}.ridge.coef`)
    : []
  return {
    degree: requireFiniteNumber(source, "degree"),
    featureNames: requireStringArray(source, "featureNames"),
    scaler: {
      mean: requireNumberArray(scaler, "mean"),
      scale: requireNumberArray(scaler, "scale"),
    },
    ridge: {
      alpha: getOptionalFiniteNumber(ridge.alpha),
      coef,
      intercept: requireNumberArray(ridge, "intercept"),
    },
  }
}

function parseCoefficientMatrix(value: unknown, label: string): number[][] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`)
  }
  if (value.every((item) => typeof item === "number")) {
    return [value.map((item) => requireFiniteNumberValue(item, label))]
  }
  return value.map((row, index) => {
    if (!Array.isArray(row)) {
      throw new Error(`${label}[${index}] must be an array`)
    }
    return row.map((item) => requireFiniteNumberValue(item, `${label}[${index}]`))
  })
}

function parsePoseRangeAfter(value: unknown): Record<string, PoseMappingScalarRange> | null {
  if (!isRecord(value)) {
    return null
  }
  const range: Record<string, PoseMappingScalarRange> = {}
  for (const [key, rawRange] of Object.entries(value)) {
    if (!isRecord(rawRange)) {
      continue
    }
    range[key] = {
      min: getOptionalFiniteNumber(rawRange.min),
      max: getOptionalFiniteNumber(rawRange.max),
    }
  }
  return Object.keys(range).length > 0 ? range : null
}

function parsePoseMappingProfileMetadata(source: Record<string, unknown>): PoseMappingProfileMetadata {
  const datasetMetadata = isRecord(source.datasetMetadata) ? source.datasetMetadata : null
  const renderAppearance = datasetMetadata && isRecord(datasetMetadata.renderAppearance)
    ? datasetMetadata.renderAppearance
    : isRecord(source.renderAppearance)
      ? source.renderAppearance
      : null
  const renderAppearanceApplied = renderAppearance && isRecord(renderAppearance.applied)
    ? renderAppearance.applied
    : isRecord(source.renderAppearanceApplied)
      ? source.renderAppearanceApplied
      : null
  const renderSettings = datasetMetadata && isRecord(datasetMetadata.renderSettings)
    ? datasetMetadata.renderSettings
    : isRecord(source.renderSettings)
      ? source.renderSettings
      : null
  const renderer = isRecord(source.requiredRenderer)
    ? source.requiredRenderer
    : datasetMetadata && isRecord(datasetMetadata.renderer)
      ? datasetMetadata.renderer
      : null

  return {
    renderAppearanceApplied,
    renderSettings,
    renderBackend: getOptionalString(source.requiredRenderBackend) ?? (datasetMetadata ? getOptionalString(datasetMetadata.renderBackend) : null),
    renderer,
    datasetSchemaVersion: getOptionalString(source.datasetSchemaVersion) ?? (datasetMetadata ? getOptionalString(datasetMetadata.schemaVersion) : null),
    renderAppearance: renderAppearance && isRecord(renderAppearance) ? renderAppearance : null,
  }
}

function evaluatePoseMappingProfile(
  profile: PoseMappingProfile,
  P_camera: ObjPoseMappingPose,
): PoseMappingEvaluateResult {
  const warnings: string[] = []
  if (!isFinitePose(P_camera)) {
    throw new Error("P_camera yaw / pitch / roll must be finite numbers")
  }

  const P_cameraClamped = clampPoseByProfileRange(profile, P_camera, warnings)
  const clampApplied =
    P_cameraClamped.yaw !== P_camera.yaw ||
    P_cameraClamped.pitch !== P_camera.pitch ||
    P_cameraClamped.roll !== P_camera.roll
  const selectedLeaf = selectPoseMappingLeaf(profile, P_cameraClamped, warnings)
  const expert = selectedLeaf === null ? null : profile.experts[String(selectedLeaf)] ?? null
  const model = expert ?? profile.fallbackModel
  const usedFallback = !expert
  if (usedFallback) {
    warnings.push("selected leaf expert was not found; fallbackModel was used")
  }

  const featureValues = buildPoseMappingFeatureValues(model.featureNames, P_cameraClamped, warnings)
  const scaledFeatures = featureValues.map((value, index) => {
    const mean = model.scaler.mean[index]
    const scale = model.scaler.scale[index]
    if (!Number.isFinite(mean) || !Number.isFinite(scale) || scale === 0) {
      warnings.push(`invalid scaler at feature ${model.featureNames[index] ?? index}; scaled value was set to 0`)
      return 0
    }
    return (value - mean) / scale
  })
  const output = multiplyRidge(model, scaledFeatures, warnings)

  return {
    p: {
      yaw: getTargetOutput(profile, output, "p_yaw"),
      pitch: getTargetOutput(profile, output, "p_pitch"),
      roll: getTargetOutput(profile, output, "p_roll"),
    },
    P_camera: { ...P_camera },
    P_cameraClamped,
    clampApplied,
    selectedLeaf,
    usedExpert: expert ? String(selectedLeaf) : "fallbackModel",
    usedFallback,
    warnings,
  }
}

function clampPoseByProfileRange(
  profile: PoseMappingProfile,
  pose: ObjPoseMappingPose,
  warnings: string[],
): ObjPoseMappingPose {
  const clamped = { ...pose }
  const mapping: Array<[keyof ObjPoseMappingPose, string]> = [
    ["yaw", "P_yaw"],
    ["pitch", "P_pitch"],
    ["roll", "P_roll"],
  ]
  for (const [axis, key] of mapping) {
    const range = profile.poseRangeAfter?.[key]
    if (!range) {
      continue
    }
    const before = clamped[axis]
    const min = range.min
    const max = range.max
    if (min !== null && clamped[axis] < min) {
      clamped[axis] = min
    }
    if (max !== null && clamped[axis] > max) {
      clamped[axis] = max
    }
    if (clamped[axis] !== before) {
      warnings.push(`${key} was clamped from ${formatNumber(before)} to ${formatNumber(clamped[axis])}`)
    }
  }
  return clamped
}

function selectPoseMappingLeaf(
  profile: PoseMappingProfile,
  pose: ObjPoseMappingPose,
  warnings: string[],
): number | null {
  const tree = profile.tree
  const inputValues = profile.inputFeatures.map((feature) => getPoseMappingBaseFeature(feature, pose))
  let node = 0
  let guard = 0
  while (guard < tree.childrenLeft.length) {
    const left = tree.childrenLeft[node]
    const right = tree.childrenRight[node]
    if (left === undefined || right === undefined) {
      warnings.push(`tree node ${node} is missing; fallbackModel was used`)
      return null
    }
    if (left < 0 && right < 0) {
      return node
    }
    const featureIndex = tree.feature[node]
    const threshold = tree.threshold[node]
    const featureValue = inputValues[featureIndex]
    if (!Number.isFinite(featureValue) || !Number.isFinite(threshold)) {
      warnings.push(`tree node ${node} has invalid feature or threshold; fallbackModel was used`)
      return null
    }
    node = featureValue <= threshold ? left : right
    guard += 1
  }
  warnings.push("tree traversal exceeded node count; fallbackModel was used")
  return null
}

function buildPoseMappingFeatureValues(
  featureNames: string[],
  pose: ObjPoseMappingPose,
  warnings: string[],
): number[] {
  return featureNames.map((name) => {
    const trimmed = name.trim()
    if (trimmed.includes(" ")) {
      return trimmed
        .split(/\s+/)
        .map((part) => getPoseMappingFeaturePart(part, pose, warnings))
        .reduce((product, value) => product * value, 1)
    }
    return getPoseMappingFeaturePart(trimmed, pose, warnings)
  })
}

function getPoseMappingFeaturePart(
  featureName: string,
  pose: ObjPoseMappingPose,
  warnings: string[],
): number {
  const squaredSuffix = "^2"
  if (featureName.endsWith(squaredSuffix)) {
    const base = getPoseMappingBaseFeature(featureName.slice(0, -squaredSuffix.length), pose)
    return base * base
  }
  const value = getPoseMappingBaseFeature(featureName, pose)
  if (!Number.isFinite(value)) {
    warnings.push(`unsupported featureName ${featureName}; value was set to 0`)
    return 0
  }
  return value
}

function getPoseMappingBaseFeature(featureName: string, pose: ObjPoseMappingPose) {
  if (featureName === "P_yaw") {
    return pose.yaw
  }
  if (featureName === "P_pitch") {
    return pose.pitch
  }
  if (featureName === "P_roll") {
    return pose.roll
  }
  return Number.NaN
}

function multiplyRidge(
  model: PoseMappingProfileModel,
  scaledFeatures: number[],
  warnings: string[],
) {
  return model.ridge.intercept.map((intercept, outputIndex) => {
    const coef = model.ridge.coef[outputIndex] ?? model.ridge.coef[0] ?? []
    if (coef.length !== scaledFeatures.length) {
      warnings.push(`ridge coef length mismatch at output ${outputIndex}`)
    }
    return scaledFeatures.reduce((sum, value, featureIndex) => {
      const weight = coef[featureIndex] ?? 0
      return sum + value * weight
    }, intercept)
  })
}

function getTargetOutput(profile: PoseMappingProfile, output: number[], targetName: string) {
  const index = profile.target.indexOf(targetName)
  const value = output[index]
  if (!Number.isFinite(value)) {
    throw new Error(`profile output ${targetName} is not finite`)
  }
  return value
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

  renderedIdealFaceLandmarkerCreateCount += 1
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
    if (!options.skipFinalRender) {
      void updatePoseMappingRuntimeFromCurrentAnalysis()
    }
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

async function updatePoseMappingRuntimeFromCurrentAnalysis(
  options: { skipFinalRender?: boolean } = {},
) {
  if (poseMappingRuntimeInProgress) {
    return null
  }

  const profile = state.poseMappingProfile.profile
  const qualityGate = buildPoseMappingQualityGate()
  const currentFaceStatus = getPoseMappingCurrentFaceStatus()
  const skippedReason = getPoseMappingSkippedReasonForCurrentFace()
  const previousRuntime = state.poseMappingRuntime
  const assetLifecycle = createAssetLifecycle(previousRuntime.profileRendererMatch)
  if (profile && canRenderRenderedIdealGeometry() && skippedReason !== "none") {
    state.poseMappingRuntime = createSkippedPoseMappingRuntimeState({
      previousRuntime,
      qualityGate,
      currentFaceStatus,
      skippedReason,
    })
    renderPoseMappingLiveSummaryCard()
    if (!options.skipFinalRender) {
      renderDebugContent()
    }
    return null
  }
  if (!profile || !qualityGate.usable) {
    state.poseMappingRuntime = {
      ...createDefaultPoseMappingRuntimeState(),
      status: "idle",
      currentFaceStatus,
      renderedIdealStatus: "missing",
      alignmentStatus: skippedReason === "none" ? "skipped_missing_profile" : "skipped_no_current_face",
      alignmentSkippedReason: skippedReason === "none" ? "missing_profile" : "no_current_face",
      poseMappingStatus: skippedReason === "none" ? "ready" : getPoseMappingSkippedStatus(skippedReason),
      poseMappingSkippedReason: skippedReason,
      fallbackPoseUsed: false,
      fallbackRenderedIdealUsed: false,
      lastUpdatedAt: formatUpdatedAt(),
      qualityGate,
      assetLifecycle,
      frameLifecycle: null,
      renderedIdealLifecycle: createEmptyRenderedIdealLifecycle(),
      overlayLifecycle: createOverlayLifecycle(false, qualityGate.reasons.join("; ") || "not_ready"),
      P_camera: getCurrentPoseForPoseMapping(),
      current478: state.currentAnalysis.landmarks478.length === REQUIRED_LANDMARK_COUNT
        ? state.currentAnalysis.landmarks478
        : null,
      errorMessage: qualityGate.reasons.join("; ") || null,
    }
    clearPoseMappingPreviewCanvas()
    renderPoseMappingLiveSummaryCard()
    if (!options.skipFinalRender) {
      renderDebugContent()
    }
    return null
  }

  poseMappingRuntimeInProgress = true
  const totalStartMs = performance.now()
  const frameGeneration = createFrameGeneration()
  state.poseMappingRuntime = {
    ...state.poseMappingRuntime,
    status: "running",
    currentFaceStatus: "detected",
    frameLifecycle: createFrameLifecycle(frameGeneration, "detected", "running", "missing", "stale", false, "running"),
    poseMappingStatus: "running",
    poseMappingSkippedReason: "none",
    fallbackPoseUsed: false,
    fallbackRenderedIdealUsed: false,
    lastGood: updatePoseMappingLastGoodAge(state.poseMappingRuntime.lastGood),
    stale: createEmptyPoseMappingStaleState(),
    qualityGate,
    errorMessage: null,
    lastUpdatedAt: formatUpdatedAt(),
  }
  if (!options.skipFinalRender) {
    renderPoseMappingLiveSummaryCard()
    renderDebugContent()
  }

  try {
    const P_camera = getCurrentPoseForPoseMapping()
    if (!P_camera) {
      throw new Error("P_camera is not available")
    }

    const evaluateStartMs = performance.now()
    const evaluateResult = evaluatePoseMappingProfile(profile, P_camera)
    const profileEvaluateMs = performance.now() - evaluateStartMs

    const renderSettings = resolvePoseMappingRenderSettings(profile, liveObjPosePreviewCanvas)
    const { appearance, debug: renderAppearanceApplied } = createPoseMappingRenderAppearance(
      profile,
      renderSettings,
    )
    const rendererGenerationBefore = state.assetGeneration.rendererGenerationId
    const renderer = getOrCreateWebglObjBenchmarkRenderer()
    const rendererWasReinitialized = state.assetGeneration.rendererGenerationId !== rendererGenerationBefore
    const rendererMetadata = buildWebglObjRendererMetadata(renderer, appearance)
    const renderToken = createRenderedIdealFrameToken(frameGeneration, evaluateResult.p)
    let detectCanvasPoseState = createEmptyDetectCanvasPoseState()
    let recoveryDebug = buildPoseRecoveryDebug({
      previousRuntime,
      frameGeneration,
      poseAfterRecovery: evaluateResult.p,
      rendererWasReinitialized,
      webglContextWasRecreated: rendererWasReinitialized,
      buffersWereRebuiltAfterRecovery: false,
      uniformsWereResetAfterRecovery: false,
    })
    let renderPoseLifecycle = createRenderPoseLifecycleDebug({
      requestedPoseP: evaluateResult.p,
      renderResult: null,
      renderPoseSource: "pose_mapping_profile",
      renderToken,
      detectCanvas: detectCanvasPoseState,
      recovery: recoveryDebug,
    })
    const profileRendererMatch = validatePoseMappingRendererMatch(profile, rendererMetadata, appearance)
    if (!profileRendererMatch.match) {
      clearWebglRendererCanvas(renderer)
      state.poseMappingRuntime = {
        ...state.poseMappingRuntime,
        renderBackend: "webgl",
        renderer: rendererMetadata,
        renderSettings,
        renderAppearanceApplied,
        profileRendererMatch: false,
        profileMismatchError: profileRendererMatch.errorMessage,
        assetLifecycle: createAssetLifecycle(false),
        renderedIdealLifecycle: {
          ...createEmptyRenderedIdealLifecycle(),
          renderToken,
          detectCanvasWasClearedBeforeRender: true,
          renderPose: renderPoseLifecycle,
        },
        overlayLifecycle: createOverlayLifecycle(false, "profile_mismatch"),
        frameLifecycle: createFrameLifecycle(
          frameGeneration,
          "detected",
          "error",
          "missing",
          "skipped_profile_mismatch",
          false,
          "profile_mismatch",
        ),
        alignmentStatus: "skipped_profile_mismatch",
        alignmentSkippedReason: "profile_mismatch",
        poseMappingStatus: "error",
        poseMappingSkippedReason: "profile_mismatch",
        fallbackPoseUsed: false,
        errorMessage: profileRendererMatch.errorMessage,
      }
      throw new Error(profileRendererMatch.errorMessage ?? "Profile renderer mismatch")
    }
    resizeWebglObjBenchmarkRenderer(renderer, renderSettings.detectCanvasWidth, renderSettings.detectCanvasHeight)
    clearWebglRendererCanvas(renderer)
    const renderContext: WebglObjRenderContext = {
      renderSettings,
      appearance,
      p: evaluateResult.p,
      rotationCenter: getObjPoseSyncRotationCenter(),
    }
    const renderStartMs = performance.now()
    const renderResult = renderWebglObjToCanvas(renderer, renderContext)
    const renderMs = performance.now() - renderStartMs
    recoveryDebug = buildPoseRecoveryDebug({
      previousRuntime,
      frameGeneration,
      poseAfterRecovery: evaluateResult.p,
      rendererWasReinitialized,
      webglContextWasRecreated: rendererWasReinitialized,
      buffersWereRebuiltAfterRecovery: renderResult.buffer.bufferPoseMode === "baked_vertices",
      uniformsWereResetAfterRecovery: renderResult.webglUniformPoseP !== null,
    })
    detectCanvasPoseState = createDetectCanvasPoseState(renderToken, renderResult, true, true)
    renderPoseLifecycle = createRenderPoseLifecycleDebug({
      requestedPoseP: evaluateResult.p,
      renderResult,
      renderPoseSource: "pose_mapping_profile",
      renderToken,
      detectCanvas: detectCanvasPoseState,
      recovery: recoveryDebug,
    })
    let renderedIdealLifecycle: RenderedIdealLifecycle = {
      ...createEmptyRenderedIdealLifecycle(),
      renderAttempted: true,
      renderSucceeded: true,
      renderToken,
      detectCanvasWasClearedBeforeRender: true,
      renderPose: renderPoseLifecycle,
    }

    if (!detectCanvasPoseState.canvasPoseMatchesRenderToken || !detectCanvasPoseState.drawCompletedForToken) {
      renderedIdealLifecycle = {
        ...renderedIdealLifecycle,
        renderSucceeded: false,
      }
      state.poseMappingRuntime = {
        ...state.poseMappingRuntime,
        renderedIdealStatus: "stale",
        alignmentStatus: "skipped_generation_mismatch",
        alignmentSkippedReason: "generation_mismatch",
        renderedIdealLifecycle,
        overlayLifecycle: createOverlayLifecycle(false, "detect_canvas_pose_mismatch"),
      }
      throw new Error("detect_canvas_pose_mismatch")
    }

    const detector = await getRenderedIdealFaceLandmarker()
    if (!isRenderedIdealFrameTokenCurrent(renderToken)) {
      state.poseMappingRuntime = {
        ...state.poseMappingRuntime,
        renderedIdealStatus: "stale",
        alignmentStatus: "skipped_generation_mismatch",
        alignmentSkippedReason: "generation_mismatch",
        renderedIdealLifecycle: {
          ...renderedIdealLifecycle,
          staleCanvasDetected: true,
        },
        overlayLifecycle: createOverlayLifecycle(false, "generation_mismatch"),
      }
      return null
    }
    const detectStartMs = performance.now()
    const result = detector.detect(renderer.canvas)
    const detectMs = performance.now() - detectStartMs
    renderedIdealLifecycle = {
      ...renderedIdealLifecycle,
      detectAttempted: true,
      detectTokenMatchesRenderToken: true,
    }
    if (!isRenderedIdealFrameTokenCurrent(renderToken)) {
      state.poseMappingRuntime = {
        ...state.poseMappingRuntime,
        renderedIdealStatus: "stale",
        alignmentStatus: "skipped_generation_mismatch",
        alignmentSkippedReason: "generation_mismatch",
        renderedIdealLifecycle: {
          ...renderedIdealLifecycle,
          staleCanvasDetected: true,
        },
        overlayLifecycle: createOverlayLifecycle(false, "generation_mismatch"),
      }
      return null
    }
    const detection = buildRenderedIdealDetectionState(result, -1, detectMs, null)
    renderedIdealLifecycle = {
      ...renderedIdealLifecycle,
      detectSucceeded: detection.status === "detected",
      renderPose: finalizeRenderPoseLifecycleDebug(renderPoseLifecycle, detection.pose),
    }
    const renderPoseWarning = renderedIdealLifecycle.renderPose.renderPoseMismatchReason
    const poseDiff = calculatePoseMappingPoseDiff(P_camera, detection.pose)
    const alignmentResult = buildPoseMappingAlignment(
      state.currentAnalysis.landmarks478,
      state.currentAnalysis.matrix,
      detection.landmarks478,
      detection.matrix,
      renderer.canvas.width / Math.max(1, renderer.canvas.height),
    )
    const previewSize = drawPoseMappingPreviewFromDetectCanvas(renderer.canvas, detection.landmarks478)
    renderSettings.previewCanvasWidth = previewSize.width
    renderSettings.previewCanvasHeight = previewSize.height

    const totalMs = performance.now() - totalStartMs
    const renderedIdealStatus = getRenderedIdealStatusFromDetection(detection.status)
    const renderedIdealToken = renderedIdealStatus === "detected" ? renderToken : null
    const alignedRenderedIdealToken =
      alignmentResult.alignedRenderedIdeal478 && renderedIdealStatus === "detected"
        ? renderToken
        : null
    const completedFrameLifecycle = createFrameLifecycle(
      frameGeneration,
      "detected",
      "completed",
      renderedIdealStatus,
      alignmentResult.alignment.status,
      false,
      "pending",
    )
    const completedRuntime: PoseMappingRuntimeState = {
      status: "completed",
      currentFaceStatus: "detected",
      renderedIdealStatus,
      alignmentStatus: alignmentResult.alignment.status,
      alignmentSkippedReason: alignmentResult.alignment.alignmentSkippedReason,
      poseMappingStatus: "completed",
      poseMappingSkippedReason: "none",
      fallbackPoseUsed: false,
      fallbackRenderedIdealUsed: false,
      lastGood: updatePoseMappingLastGoodAge(previousRuntime.lastGood),
      stale: createEmptyPoseMappingStaleState(),
      noFaceCounters: {
        ...previousRuntime.noFaceCounters,
        recoveredFromNoCurrentFaceCount:
          previousRuntime.noFaceCounters.recoveredFromNoCurrentFaceCount +
          (previousRuntime.poseMappingSkippedReason === "no_current_face" ? 1 : 0),
      },
      lastUpdatedAt: formatUpdatedAt(),
      P_camera: evaluateResult.P_camera,
      P_cameraClamped: evaluateResult.P_cameraClamped,
      qualityGate,
      p: evaluateResult.p,
      selectedLeaf: evaluateResult.selectedLeaf,
      usedExpert: evaluateResult.usedExpert,
      usedFallback: evaluateResult.usedFallback,
      warnings: renderPoseWarning
        ? [...evaluateResult.warnings, renderPoseWarning]
        : evaluateResult.warnings,
      P_confirm: renderedIdealStatus === "detected" ? detection.pose : previousRuntime.P_confirm,
      poseDiff: renderedIdealStatus === "detected" ? poseDiff : previousRuntime.poseDiff,
      renderedIdealDetected: detection.status === "detected",
      renderedIdealLandmarkCount: detection.landmarkCount,
      renderedIdeal478: detection.landmarks478,
      renderedIdealToken,
      alignedRenderedIdeal478: alignmentResult.alignedRenderedIdeal478,
      alignedRenderedIdealToken,
      current478: state.currentAnalysis.landmarks478,
      meshSourceVertices: alignmentResult.meshSourceVertices,
      meshTargetVertices: alignmentResult.meshTargetVertices,
      alignment: alignmentResult.alignment,
      canvasWidth: renderer.canvas.width,
      canvasHeight: renderer.canvas.height,
      detectCanvasWidth: renderer.canvas.width,
      detectCanvasHeight: renderer.canvas.height,
      previewCanvasWidth: previewSize.width,
      previewCanvasHeight: previewSize.height,
      renderSettings,
      renderAppearanceApplied,
      renderBackend: "webgl",
      renderer: rendererMetadata,
      profileRendererMatch: true,
      profileMismatchError: null,
      assetLifecycle: createAssetLifecycle(true),
      frameLifecycle: completedFrameLifecycle,
      renderedIdealLifecycle,
      overlayLifecycle: createInitialOverlayLifecycle(),
      profileEvaluateMs,
      renderMs,
      detectMs,
      totalMs,
      previewDataUrl: liveObjPosePreviewCanvas.toDataURL("image/png"),
      errorMessage: detection.status === "detected" ? null : detection.errorMessage ?? detection.status,
    }
    const overlayLifecycle = createOverlayLifecycleFromRuntime(completedRuntime)
    state.poseMappingRuntime = {
      ...completedRuntime,
      overlayLifecycle,
      frameLifecycle: createFrameLifecycle(
        frameGeneration,
        completedRuntime.currentFaceStatus,
        completedRuntime.poseMappingStatus,
        completedRuntime.renderedIdealStatus,
        completedRuntime.alignmentStatus,
        overlayLifecycle.alignedRenderedIdealVisible,
        overlayLifecycle.skippedReason,
      ),
      lastGood: detection.status === "detected"
        ? createPoseMappingLastGoodState(completedRuntime, state.currentAnalysis.analyzedTimeSec)
        : updatePoseMappingLastGoodAge(previousRuntime.lastGood),
    }
    recordPlacementMappingSample(state.poseMappingRuntime)
    if (!options.skipFinalRender) {
      renderAll({ skipObjRender: true })
    }
    if (state.renderPoseProbe.runAfterNextRecovery && isPoseRecoveryFrame(recoveryDebug)) {
      void runRenderPoseProbe("after_next_recovery")
    }
    return state.poseMappingRuntime
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    state.poseMappingRuntime = {
      ...state.poseMappingRuntime,
      status: "error",
      poseMappingStatus: "error",
      poseMappingSkippedReason: message.startsWith("Profile renderer mismatch")
        ? "profile_mismatch"
        : state.poseMappingRuntime.poseMappingSkippedReason,
      fallbackPoseUsed: false,
      fallbackRenderedIdealUsed: false,
      lastUpdatedAt: formatUpdatedAt(),
      qualityGate,
      renderedIdealStatus: "stale",
      alignmentStatus: "error",
      alignmentSkippedReason: "error",
      renderedIdealToken: null,
      alignedRenderedIdeal478: null,
      alignedRenderedIdealToken: null,
      renderedIdealLifecycle: {
        ...state.poseMappingRuntime.renderedIdealLifecycle,
        staleCanvasDetected: true,
      },
      overlayLifecycle: createOverlayLifecycle(false, message),
      assetLifecycle: createAssetLifecycle(false),
      totalMs: performance.now() - totalStartMs,
      errorMessage: message,
    }
    addLog(`Pose Mapping確認でエラーが発生しました: ${message}`)
    if (!options.skipFinalRender) {
      renderAll({ skipObjRender: true })
    }
    return null
  } finally {
    poseMappingRuntimeInProgress = false
  }
}

async function startDetectPerformanceBenchmark() {
  if (state.detectPerformance.status === "running") {
    return
  }

  detectPerformanceCancelRequested = false
  const options = {
    warmupRuns: state.detectPerformance.options.warmupRuns,
    measuredRuns: state.detectPerformance.options.measuredRuns,
    resolutionList: [...state.detectPerformance.options.resolutionList],
  }
  state.detectPerformance = {
    status: "running",
    startedAt: new Date().toISOString(),
    completedAt: null,
    errorMessage: null,
    options,
    result: null,
    notes: [
      "detect only: MediaPipe detect() 呼び出しだけを測る",
      "render only: OBJ renderだけを測る",
      "render + detect: OBJ render と detect() を測る",
      "preview: debug snapshot用の画像生成 / overlay / toDataURL を測る",
      "UI state update: 原則として計測外。完了後にまとめて state へ反映する",
    ],
  }
  renderDebugContent()

  const cases: DetectPerformanceCaseResult[] = []
  const notes = [...state.detectPerformance.notes]
  try {
    const context = await prepareDetectPerformanceBenchmarkContext()
    cases.push(await runDetectOnlyBenchmarkCase({
      caseId: `detect_only_rendered_ideal_${context.detectCanvas.width}`,
      label: `detect only / rendered ideal / ${context.detectCanvas.width}`,
      sourceKind: "renderedIdealCanvas",
      canvas: context.detectCanvas,
      detector: context.detector,
      options,
    }))
    await throwIfDetectPerformanceCancelled()

    cases.push(await runRenderOnlyBenchmarkCase({
      caseId: `render_only_rendered_ideal_${context.renderSettings.detectCanvasWidth}`,
      label: `render only / rendered ideal / ${context.renderSettings.detectCanvasWidth}`,
      sourceKind: "renderedIdealCanvas",
      width: context.renderSettings.detectCanvasWidth,
      height: context.renderSettings.detectCanvasHeight,
      p: context.p,
      appearance: context.appearance,
      options,
    }))
    await throwIfDetectPerformanceCancelled()

    cases.push(await runRenderDetectBenchmarkCase({
      caseId: `render_detect_rendered_ideal_${context.renderSettings.detectCanvasWidth}`,
      label: `render + detect / rendered ideal / ${context.renderSettings.detectCanvasWidth}`,
      sourceKind: "renderedIdealCanvas",
      width: context.renderSettings.detectCanvasWidth,
      height: context.renderSettings.detectCanvasHeight,
      p: context.p,
      appearance: context.appearance,
      detector: context.detector,
      options,
    }))
    await throwIfDetectPerformanceCancelled()

    cases.push(await runPreviewBenchmarkCase({
      caseId: `preview_overlay_rendered_ideal_${context.detectCanvas.width}`,
      label: `preview generation / overlay / ${context.detectCanvas.width}`,
      sourceKind: "renderedIdealCanvas",
      canvas: context.detectCanvas,
      landmarks478: context.renderedIdeal478,
      options,
    }))
    await throwIfDetectPerformanceCancelled()

    for (const resolution of options.resolutionList) {
      const scaledCanvas = createScaledDetectBenchmarkCanvas(context.detectCanvas, resolution, resolution)
      cases.push(await runDetectOnlyBenchmarkCase({
        caseId: `detect_only_scaled_rendered_ideal_${resolution}`,
        label: `detect only / scaled rendered ideal / ${resolution}`,
        sourceKind: "scaledRenderedIdealCanvas",
        canvas: scaledCanvas,
        detector: context.detector,
        options,
      }))
      await throwIfDetectPerformanceCancelled()
    }

    const controlCanvas = createControlMp4DetectCanvas(context.renderSettings.detectCanvasWidth, context.renderSettings.detectCanvasHeight)
    if (controlCanvas) {
      cases.push(await runDetectOnlyBenchmarkCase({
        caseId: `detect_only_control_mp4_${controlCanvas.width}x${controlCanvas.height}`,
        label: `detect only / control MP4 canvas / ${controlCanvas.width}x${controlCanvas.height}`,
        sourceKind: "controlMp4Canvas",
        canvas: controlCanvas,
        detector: context.detector,
        options,
      }))
    } else {
      notes.push("control MP4 canvas detect は、MP4 current frame が利用できないため未実行")
    }

    const result = buildDetectPerformanceExport(context, cases, notes, options)
    state.detectPerformance = {
      ...state.detectPerformance,
      status: detectPerformanceCancelRequested ? "cancelled" : "completed",
      completedAt: new Date().toISOString(),
      result,
      notes,
    }
    addLog(`Detect Performance benchmark が完了しました: ${cases.length} cases`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const status: DetectPerformanceStatus = message === "cancelled" ? "cancelled" : "error"
    state.detectPerformance = {
      ...state.detectPerformance,
      status,
      completedAt: new Date().toISOString(),
      errorMessage: status === "error" ? message : null,
      notes,
    }
    if (status === "error") {
      addLog(`Detect Performance benchmark でエラーが発生しました: ${message}`)
    } else {
      addLog("Detect Performance benchmark を停止しました。")
    }
  } finally {
    detectPerformanceCancelRequested = false
    renderAll({ skipObjRender: true })
  }
}

function stopDetectPerformanceBenchmark() {
  if (state.detectPerformance.status === "running") {
    detectPerformanceCancelRequested = true
  }
}

async function throwIfDetectPerformanceCancelled() {
  await waitForBenchmarkUiTick()
  if (detectPerformanceCancelRequested) {
    throw new Error("cancelled")
  }
}

function waitForBenchmarkUiTick() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0)
  })
}

async function prepareDetectPerformanceBenchmarkContext() {
  const profile = state.poseMappingProfile.profile
  const runtime = state.poseMappingRuntime
  if (!profile || runtime.status !== "completed" || !runtime.P_camera || !runtime.p) {
    throw new Error("先にOBJ、poseMappingProfile、MP4を読み込み、Liveタブで位置合わせ済み理想478点 overlay を生成してください。")
  }

  const renderSettings = resolvePoseMappingRenderSettings(profile, liveObjPosePreviewCanvas)
  const { appearance } = createPoseMappingRenderAppearance(profile, renderSettings)
  const detectCanvas = document.createElement("canvas")
  const renderSummary = renderRenderedIdealCanvasTo(
    detectCanvas,
    getObjPoseSyncRotationCenter(),
    runtime.p,
    {
      directPose: true,
      appearanceOverride: appearance,
      forceRenderResolution: true,
    },
  )
  if (renderSummary.status !== "rendered") {
    throw new Error(renderSummary.errorMessage ?? renderSummary.status)
  }

  const createCountBefore = renderedIdealFaceLandmarkerCreateCount
  const detector = await getRenderedIdealFaceLandmarker()
  const createCountAfter = renderedIdealFaceLandmarkerCreateCount
  const result = detector.detect(detectCanvas)
  const detection = buildRenderedIdealDetectionState(result, -1, null, null)
  const poseDiff = calculatePoseMappingPoseDiff(runtime.P_camera, detection.pose)

  return {
    profile,
    detector,
    detectCanvas,
    renderSettings,
    appearance,
    P_camera: runtime.P_camera,
    p: runtime.p,
    rotationCenter: getObjPoseSyncRotationCenter(),
    P_confirm: detection.pose,
    poseDiff,
    renderedIdeal478: detection.landmarks478,
    landmarker: {
      runningMode: "IMAGE" as const,
      requestedDelegate: getRenderedIdealRequestedDelegate(),
      instanceReused: createCountAfter - createCountBefore <= 1,
      createCount: renderedIdealFaceLandmarkerCreateCount,
    },
  }
}

async function runDetectOnlyBenchmarkCase(input: {
  caseId: string
  label: string
  sourceKind: string
  canvas: HTMLCanvasElement
  detector: FaceLandmarker
  options: DetectPerformanceOptions
}): Promise<DetectPerformanceCaseResult> {
  const samples: DetectPerformanceSample[] = []
  await runBenchmarkPhases(input.options, async (phase, runIndex) => {
    const sample = createEmptyDetectPerformanceSample(phase, runIndex)
    try {
      const detectStartMs = performance.now()
      const result = input.detector.detect(input.canvas)
      sample.detectMs = performance.now() - detectStartMs
      sample.totalMs = sample.detectMs
      sample.detected = result.faceLandmarks.length > 0
      sample.landmarkCount = result.faceLandmarks[0]?.length ?? 0
    } catch (error) {
      sample.detected = false
      sample.landmarkCount = 0
      sample.errorMessage = error instanceof Error ? error.message : String(error)
    }
    samples.push(sample)
  })

  return buildDetectPerformanceCaseResult({
    caseId: input.caseId,
    label: input.label,
    sourceKind: input.sourceKind,
    canvasWidth: input.canvas.width,
    canvasHeight: input.canvas.height,
    options: input.options,
    samples,
    summaryField: "detectMs",
    detectSummary: true,
  })
}

async function runRenderOnlyBenchmarkCase(input: {
  caseId: string
  label: string
  sourceKind: string
  width: number
  height: number
  p: ObjPoseMappingPose
  appearance: AppliedObjRenderAppearanceProfile
  options: DetectPerformanceOptions
}): Promise<DetectPerformanceCaseResult> {
  const canvas = document.createElement("canvas")
  canvas.width = input.width
  canvas.height = input.height
  const samples: DetectPerformanceSample[] = []
  await runBenchmarkPhases(input.options, async (phase, runIndex) => {
    const sample = createEmptyDetectPerformanceSample(phase, runIndex)
    try {
      const renderStartMs = performance.now()
      const renderSummary = renderRenderedIdealCanvasTo(
        canvas,
        getObjPoseSyncRotationCenter(),
        input.p,
        {
          directPose: true,
          appearanceOverride: input.appearance,
          forceRenderResolution: true,
        },
      )
      sample.renderMs = performance.now() - renderStartMs
      sample.totalMs = sample.renderMs
      if (renderSummary.status !== "rendered") {
        sample.errorMessage = renderSummary.errorMessage ?? renderSummary.status
      }
    } catch (error) {
      sample.errorMessage = error instanceof Error ? error.message : String(error)
    }
    samples.push(sample)
  })

  return buildDetectPerformanceCaseResult({
    caseId: input.caseId,
    label: input.label,
    sourceKind: input.sourceKind,
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    options: input.options,
    samples,
    summaryField: "renderMs",
    renderSummary: true,
  })
}

async function runRenderDetectBenchmarkCase(input: {
  caseId: string
  label: string
  sourceKind: string
  width: number
  height: number
  p: ObjPoseMappingPose
  appearance: AppliedObjRenderAppearanceProfile
  detector: FaceLandmarker
  options: DetectPerformanceOptions
}): Promise<DetectPerformanceCaseResult> {
  const canvas = document.createElement("canvas")
  canvas.width = input.width
  canvas.height = input.height
  const samples: DetectPerformanceSample[] = []
  await runBenchmarkPhases(input.options, async (phase, runIndex) => {
    const sample = createEmptyDetectPerformanceSample(phase, runIndex)
    const totalStartMs = performance.now()
    try {
      const renderStartMs = performance.now()
      const renderSummary = renderRenderedIdealCanvasTo(
        canvas,
        getObjPoseSyncRotationCenter(),
        input.p,
        {
          directPose: true,
          appearanceOverride: input.appearance,
          forceRenderResolution: true,
        },
      )
      sample.renderMs = performance.now() - renderStartMs
      if (renderSummary.status !== "rendered") {
        throw new Error(renderSummary.errorMessage ?? renderSummary.status)
      }

      const detectStartMs = performance.now()
      const result = input.detector.detect(canvas)
      sample.detectMs = performance.now() - detectStartMs
      sample.detected = result.faceLandmarks.length > 0
      sample.landmarkCount = result.faceLandmarks[0]?.length ?? 0
    } catch (error) {
      sample.detected = false
      sample.landmarkCount = 0
      sample.errorMessage = error instanceof Error ? error.message : String(error)
    } finally {
      sample.totalMs = performance.now() - totalStartMs
    }
    samples.push(sample)
  })

  return buildDetectPerformanceCaseResult({
    caseId: input.caseId,
    label: input.label,
    sourceKind: input.sourceKind,
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    options: input.options,
    samples,
    summaryField: "totalMs",
    renderSummary: true,
    detectSummary: true,
    totalSummary: true,
  })
}

async function runPreviewBenchmarkCase(input: {
  caseId: string
  label: string
  sourceKind: string
  canvas: HTMLCanvasElement
  landmarks478: ReferenceLandmark[] | null
  options: DetectPerformanceOptions
}): Promise<DetectPerformanceCaseResult> {
  const samples: DetectPerformanceSample[] = []
  await runBenchmarkPhases(input.options, async (phase, runIndex) => {
    const sample = createEmptyDetectPerformanceSample(phase, runIndex)
    try {
      const measured = measurePoseMappingPreviewGeneration(input.canvas, input.landmarks478)
      sample.previewMs = measured.previewMs
      sample.overlayMs = measured.overlayMs
      sample.toDataUrlMs = measured.toDataUrlMs
      sample.totalMs = measured.totalMs
    } catch (error) {
      sample.errorMessage = error instanceof Error ? error.message : String(error)
    }
    samples.push(sample)
  })

  return buildDetectPerformanceCaseResult({
    caseId: input.caseId,
    label: input.label,
    sourceKind: input.sourceKind,
    canvasWidth: input.canvas.width,
    canvasHeight: input.canvas.height,
    options: input.options,
    samples,
    summaryField: "totalMs",
    previewSummary: true,
    overlaySummary: true,
    toDataUrlSummary: true,
    totalSummary: true,
  })
}

async function runBenchmarkPhases(
  options: DetectPerformanceOptions,
  runSample: (phase: DetectPerformancePhase, runIndex: number) => Promise<void> | void,
) {
  for (const phase of ["warmup", "measured"] as const) {
    const runCount = phase === "warmup" ? options.warmupRuns : options.measuredRuns
    for (let runIndex = 0; runIndex < runCount; runIndex += 1) {
      if (detectPerformanceCancelRequested) {
        throw new Error("cancelled")
      }
      await runSample(phase, runIndex)
      await waitForBenchmarkUiTick()
    }
  }
}

function measurePoseMappingPreviewGeneration(
  sourceCanvas: HTMLCanvasElement,
  landmarks: ReferenceLandmark[] | null,
) {
  const totalStartMs = performance.now()
  const context = liveObjPosePreviewCanvas.getContext("2d")
  if (!context) {
    throw new Error("preview canvas context を取得できません。")
  }

  const previewSize = getPoseMappingLivePreviewPixelSize()
  if (liveObjPosePreviewCanvas.width !== previewSize.width || liveObjPosePreviewCanvas.height !== previewSize.height) {
    liveObjPosePreviewCanvas.width = previewSize.width
    liveObjPosePreviewCanvas.height = previewSize.height
  }

  const previewStartMs = performance.now()
  context.setTransform(1, 0, 0, 1, 0, 0)
  context.clearRect(0, 0, liveObjPosePreviewCanvas.width, liveObjPosePreviewCanvas.height)
  const scale = Math.min(
    liveObjPosePreviewCanvas.width / sourceCanvas.width,
    liveObjPosePreviewCanvas.height / sourceCanvas.height,
  )
  const drawWidth = sourceCanvas.width * scale
  const drawHeight = sourceCanvas.height * scale
  const offsetX = (liveObjPosePreviewCanvas.width - drawWidth) / 2
  const offsetY = (liveObjPosePreviewCanvas.height - drawHeight) / 2
  context.drawImage(sourceCanvas, offsetX, offsetY, drawWidth, drawHeight)
  const previewMs = performance.now() - previewStartMs

  const overlayStartMs = performance.now()
  drawPoseMappingPreviewOverlay(landmarks, { x: offsetX, y: offsetY, width: drawWidth, height: drawHeight })
  const overlayMs = performance.now() - overlayStartMs

  const dataUrlStartMs = performance.now()
  liveObjPosePreviewCanvas.toDataURL("image/png")
  const toDataUrlMs = performance.now() - dataUrlStartMs

  return {
    previewMs,
    overlayMs,
    toDataUrlMs,
    totalMs: performance.now() - totalStartMs,
  }
}

function createScaledDetectBenchmarkCanvas(
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
) {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("resolution sweep canvas context を取得できません。")
  }
  context.drawImage(sourceCanvas, 0, 0, width, height)
  return canvas
}

function createControlMp4DetectCanvas(width: number, height: number) {
  if (!isVideoFileInput() || liveVideoElement.videoWidth <= 0 || liveVideoElement.videoHeight <= 0) {
    return null
  }
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  if (!context) {
    return null
  }
  context.drawImage(liveVideoElement, 0, 0, width, height)
  return canvas
}

function createEmptyDetectPerformanceSample(
  phase: DetectPerformancePhase,
  runIndex: number,
): DetectPerformanceSample {
  return {
    runIndex,
    phase,
    renderMs: null,
    detectMs: null,
    previewMs: null,
    overlayMs: null,
    toDataUrlMs: null,
    totalMs: null,
    detected: null,
    landmarkCount: null,
    errorMessage: null,
  }
}

function buildDetectPerformanceCaseResult(input: {
  caseId: string
  label: string
  sourceKind: string
  canvasWidth: number
  canvasHeight: number
  options: DetectPerformanceOptions
  samples: DetectPerformanceSample[]
  summaryField: keyof Pick<DetectPerformanceSample, "renderMs" | "detectMs" | "previewMs" | "overlayMs" | "toDataUrlMs" | "totalMs">
  renderSummary?: boolean
  detectSummary?: boolean
  previewSummary?: boolean
  overlaySummary?: boolean
  toDataUrlSummary?: boolean
  totalSummary?: boolean
}): DetectPerformanceCaseResult {
  const measuredSamples = input.samples.filter((sample) => sample.phase === "measured")
  const detectedCount = measuredSamples.filter((sample) => sample.detected === true).length
  const failedCount = measuredSamples.filter((sample) => sample.errorMessage || sample.detected === false).length
  const result: DetectPerformanceCaseResult = {
    caseId: input.caseId,
    label: input.label,
    sourceKind: input.sourceKind,
    canvasWidth: input.canvasWidth,
    canvasHeight: input.canvasHeight,
    warmupRuns: input.options.warmupRuns,
    measuredRuns: input.options.measuredRuns,
    detectedCount,
    failedCount,
    summary: summarizeDetectPerformanceSamples(measuredSamples, input.summaryField),
    samples: input.samples,
  }
  if (input.renderSummary) {
    result.renderMs = summarizeDetectPerformanceSamples(measuredSamples, "renderMs")
  }
  if (input.detectSummary) {
    result.detectMs = summarizeDetectPerformanceSamples(measuredSamples, "detectMs")
  }
  if (input.previewSummary) {
    result.previewMs = summarizeDetectPerformanceSamples(measuredSamples, "previewMs")
  }
  if (input.overlaySummary) {
    result.overlayMs = summarizeDetectPerformanceSamples(measuredSamples, "overlayMs")
  }
  if (input.toDataUrlSummary) {
    result.toDataUrlMs = summarizeDetectPerformanceSamples(measuredSamples, "toDataUrlMs")
  }
  if (input.totalSummary) {
    result.totalMs = summarizeDetectPerformanceSamples(measuredSamples, "totalMs")
  }
  return result
}

function summarizeDetectPerformanceSamples(
  samples: DetectPerformanceSample[],
  field: keyof Pick<DetectPerformanceSample, "renderMs" | "detectMs" | "previewMs" | "overlayMs" | "toDataUrlMs" | "totalMs">,
): DetectPerformanceTimingSummary {
  const values = samples
    .map((sample) => sample[field])
    .filter((value): value is number => value !== null && Number.isFinite(value))
    .sort((a, b) => a - b)
  if (values.length === 0) {
    return { avgMs: null, p50Ms: null, p95Ms: null, minMs: null, maxMs: null }
  }
  return {
    avgMs: roundForState(averageNumbers(values)) ?? null,
    p50Ms: roundForState(getPercentile(values, 0.5)) ?? null,
    p95Ms: roundForState(getPercentile(values, 0.95)) ?? null,
    minMs: roundForState(values[0]) ?? null,
    maxMs: roundForState(values[values.length - 1]) ?? null,
  }
}

function buildDetectPerformanceExport(
  context: Awaited<ReturnType<typeof prepareDetectPerformanceBenchmarkContext>>,
  cases: DetectPerformanceCaseResult[],
  notes: string[],
  options: DetectPerformanceOptions,
): DetectPerformanceExport {
  const profile = getPoseMappingProfileRawSummary()
  return {
    type: "pose_mapping_detect_performance_debug_v1",
    createdAt: new Date().toISOString(),
    source: {
      objFileName: state.objFile.fileName,
      mp4FileName: state.liveVideo.fileName,
      profileFileName: state.poseMappingProfile.fileName,
    },
    profile: {
      schemaVersion: profile.schemaVersion,
      modelType: profile.modelType,
      modelName: profile.modelName,
      datasetKind: profile.datasetKind,
    },
    runtime: {
      P_camera: roundPoseMappingPose(context.P_camera),
      p: roundPoseMappingPose(context.p),
      P_confirm: roundPoseForState(context.P_confirm),
      poseDiff: roundPoseMappingDiff(context.poseDiff),
    },
    landmarker: context.landmarker,
    renderSettings: {
      detectCanvasWidth: context.detectCanvas.width,
      detectCanvasHeight: context.detectCanvas.height,
      renderResolutionSource: context.renderSettings.renderResolutionSource,
      detectCanvasMatchesProfile: context.renderSettings.detectCanvasMatchesProfile,
    },
    benchmarkOptions: options,
    cases,
    notes,
  }
}

function getRenderedIdealRequestedDelegate() {
  const delegate = createRenderedIdealFaceLandmarkerOptions().baseOptions?.delegate
  return typeof delegate === "string" ? delegate : "-"
}

async function startRenderDetectHandoffBenchmark() {
  if (state.renderDetectHandoff.status === "running") {
    return
  }

  renderDetectHandoffCancelRequested = false
  const options = {
    warmupRuns: state.renderDetectHandoff.options.warmupRuns,
    measuredRuns: state.renderDetectHandoff.options.measuredRuns,
  }
  state.renderDetectHandoff = {
    status: "running",
    startedAt: new Date().toISOString(),
    completedAt: null,
    errorMessage: null,
    options,
    result: null,
    notes: [
      "Render -> Detect Handoff は Canvas2D OBJ render 直後の MediaPipe detect() に描画同期 / GPU同期 / readback コストが乗るかを切り分ける",
      "各caseに preview生成、overlay、toDataURL、毎runごとのDOM更新は含めない",
      "Handoff benchmark は legacy Canvas2D baseline の比較用で、通常 runtime の WebGL render -> detect 経路には影響しない",
    ],
  }
  renderDebugContent()

  const cases: RenderDetectHandoffCaseResult[] = []
  const notes = [...state.renderDetectHandoff.notes]
  try {
    const context = await prepareDetectPerformanceBenchmarkContext()
    cases.push(await runRenderDetectHandoffCase({
      caseId: `handoff_immediate_render_detect_${context.renderSettings.detectCanvasWidth}`,
      label: `immediate render -> detect / ${context.renderSettings.detectCanvasWidth}`,
      handoffStrategy: "immediate",
      context,
      options,
      runMeasuredSample: async (sample, canvas) => {
        const totalStartMs = performance.now()
        measureHandoffRender(sample, canvas, context)
        measureHandoffDetect(sample, canvas, context.detector)
        sample.totalMs = performance.now() - totalStartMs
      },
    }))
    await throwIfRenderDetectHandoffCancelled()

    cases.push(await runRenderDetectHandoffCase({
      caseId: `handoff_raf1_render_detect_${context.renderSettings.detectCanvasWidth}`,
      label: `render -> requestAnimationFrame 1回 -> detect / ${context.renderSettings.detectCanvasWidth}`,
      handoffStrategy: "requestAnimationFrame_1",
      context,
      options,
      runMeasuredSample: async (sample, canvas) => {
        const totalStartMs = performance.now()
        measureHandoffRender(sample, canvas, context)
        const waitStartMs = performance.now()
        await waitForAnimationFrameOnce()
        sample.waitMs = performance.now() - waitStartMs
        measureHandoffDetect(sample, canvas, context.detector)
        sample.totalMs = performance.now() - totalStartMs
      },
    }))
    await throwIfRenderDetectHandoffCancelled()

    cases.push(await runRenderDetectHandoffCase({
      caseId: `handoff_raf2_render_detect_${context.renderSettings.detectCanvasWidth}`,
      label: `render -> requestAnimationFrame 2回 -> detect / ${context.renderSettings.detectCanvasWidth}`,
      handoffStrategy: "requestAnimationFrame_2",
      context,
      options,
      runMeasuredSample: async (sample, canvas) => {
        const totalStartMs = performance.now()
        measureHandoffRender(sample, canvas, context)
        const waitStartMs = performance.now()
        await waitForAnimationFrameOnce()
        await waitForAnimationFrameOnce()
        sample.waitMs = performance.now() - waitStartMs
        measureHandoffDetect(sample, canvas, context.detector)
        sample.totalMs = performance.now() - totalStartMs
      },
    }))
    await throwIfRenderDetectHandoffCancelled()

    cases.push(await runRenderDetectHandoffCase({
      caseId: `handoff_timeout0_render_detect_${context.renderSettings.detectCanvasWidth}`,
      label: `render -> setTimeout(0) -> detect / ${context.renderSettings.detectCanvasWidth}`,
      handoffStrategy: "setTimeout_0",
      context,
      options,
      runMeasuredSample: async (sample, canvas) => {
        const totalStartMs = performance.now()
        measureHandoffRender(sample, canvas, context)
        const waitStartMs = performance.now()
        await waitForTimeoutZero()
        sample.waitMs = performance.now() - waitStartMs
        measureHandoffDetect(sample, canvas, context.detector)
        sample.totalMs = performance.now() - totalStartMs
      },
    }))
    await throwIfRenderDetectHandoffCancelled()

    cases.push(await runRenderDetectHandoffCase({
      caseId: `handoff_image_bitmap_render_detect_${context.renderSettings.detectCanvasWidth}`,
      label: `render -> createImageBitmap -> detect(bitmap) / ${context.renderSettings.detectCanvasWidth}`,
      handoffStrategy: "createImageBitmap",
      context,
      options,
      runMeasuredSample: async (sample, canvas) => {
        const totalStartMs = performance.now()
        measureHandoffRender(sample, canvas, context)
        if (typeof createImageBitmap !== "function") {
          sample.errorMessage = "createImageBitmap unsupported"
          sample.totalMs = performance.now() - totalStartMs
          return
        }
        const bitmapStartMs = performance.now()
        const bitmap = await createImageBitmap(canvas)
        sample.bitmapCreateMs = performance.now() - bitmapStartMs
        try {
          measureHandoffDetect(sample, bitmap as Parameters<FaceLandmarker["detect"]>[0], context.detector)
        } catch (error) {
          sample.errorMessage = `ImageBitmap detect unsupported: ${error instanceof Error ? error.message : String(error)}`
          sample.detected = false
          sample.landmarkCount = 0
        } finally {
          bitmap.close()
        }
        sample.totalMs = performance.now() - totalStartMs
      },
    }))
    await throwIfRenderDetectHandoffCancelled()

    cases.push(await runRenderDetectHandoffCase({
      caseId: `handoff_copy_canvas_render_detect_${context.renderSettings.detectCanvasWidth}`,
      label: `render -> copy to second canvas -> detect / ${context.renderSettings.detectCanvasWidth}`,
      handoffStrategy: "copy_to_second_canvas",
      context,
      options,
      runMeasuredSample: async (sample, canvas) => {
        const totalStartMs = performance.now()
        measureHandoffRender(sample, canvas, context)
        const copiedCanvas = createBenchmarkCanvas(context.renderSettings.detectCanvasWidth, context.renderSettings.detectCanvasHeight)
        const copyStartMs = performance.now()
        const copyContext = copiedCanvas.getContext("2d")
        if (!copyContext) {
          throw new Error("copy canvas context を取得できません。")
        }
        copyContext.drawImage(canvas, 0, 0)
        sample.copyMs = performance.now() - copyStartMs
        measureHandoffDetect(sample, copiedCanvas, context.detector)
        sample.totalMs = performance.now() - totalStartMs
      },
    }))
    await throwIfRenderDetectHandoffCancelled()

    cases.push(await runDoubleBufferHandoffCase(context, options))
    await throwIfRenderDetectHandoffCancelled()

    cases.push(await runRenderDetectHandoffCase({
      caseId: `handoff_readback_render_detect_${context.renderSettings.detectCanvasWidth}`,
      label: `render -> getImageData(1x1) -> detect / ${context.renderSettings.detectCanvasWidth}`,
      handoffStrategy: "explicit_readback",
      context,
      options,
      runMeasuredSample: async (sample, canvas) => {
        const totalStartMs = performance.now()
        measureHandoffRender(sample, canvas, context)
        const readbackStartMs = performance.now()
        const canvasContext = canvas.getContext("2d")
        if (!canvasContext) {
          throw new Error("readback canvas context を取得できません。")
        }
        canvasContext.getImageData(0, 0, 1, 1)
        sample.readbackMs = performance.now() - readbackStartMs
        measureHandoffDetect(sample, canvas, context.detector)
        sample.totalMs = performance.now() - totalStartMs
      },
    }))

    const result = buildRenderDetectHandoffExport(context, cases, notes, options)
    state.renderDetectHandoff = {
      ...state.renderDetectHandoff,
      status: renderDetectHandoffCancelRequested ? "cancelled" : "completed",
      completedAt: new Date().toISOString(),
      result,
      notes,
    }
    addLog(`Render -> Detect Handoff benchmark が完了しました: ${cases.length} cases`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const status: RenderDetectHandoffStatus = message === "cancelled" ? "cancelled" : "error"
    state.renderDetectHandoff = {
      ...state.renderDetectHandoff,
      status,
      completedAt: new Date().toISOString(),
      errorMessage: status === "error" ? message : null,
      notes,
    }
    if (status === "error") {
      addLog(`Render -> Detect Handoff benchmark でエラーが発生しました: ${message}`)
    } else {
      addLog("Render -> Detect Handoff benchmark を停止しました。")
    }
  } finally {
    renderDetectHandoffCancelRequested = false
    renderAll({ skipObjRender: true })
  }
}

function stopRenderDetectHandoffBenchmark() {
  if (state.renderDetectHandoff.status === "running") {
    renderDetectHandoffCancelRequested = true
  }
}

async function throwIfRenderDetectHandoffCancelled() {
  await waitForBenchmarkUiTick()
  if (renderDetectHandoffCancelRequested) {
    throw new Error("cancelled")
  }
}

async function runRenderDetectHandoffCase(input: {
  caseId: string
  label: string
  handoffStrategy: string
  context: Awaited<ReturnType<typeof prepareDetectPerformanceBenchmarkContext>>
  options: RenderDetectHandoffOptions
  runMeasuredSample: (sample: RenderDetectHandoffSample, canvas: HTMLCanvasElement) => Promise<void>
}): Promise<RenderDetectHandoffCaseResult> {
  const canvas = createBenchmarkCanvas(
    input.context.renderSettings.detectCanvasWidth,
    input.context.renderSettings.detectCanvasHeight,
  )
  const samples: RenderDetectHandoffSample[] = []
  await runRenderDetectHandoffPhases(input.options, async (phase, runIndex) => {
    const sample = createEmptyRenderDetectHandoffSample(phase, runIndex)
    try {
      await input.runMeasuredSample(sample, canvas)
    } catch (error) {
      sample.detected = false
      sample.landmarkCount = 0
      sample.errorMessage = error instanceof Error ? error.message : String(error)
    }
    samples.push(sample)
  })

  return buildRenderDetectHandoffCaseResult({
    caseId: input.caseId,
    label: input.label,
    handoffStrategy: input.handoffStrategy,
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    options: input.options,
    samples,
    notes: [],
  })
}

async function runDoubleBufferHandoffCase(
  context: Awaited<ReturnType<typeof prepareDetectPerformanceBenchmarkContext>>,
  options: RenderDetectHandoffOptions,
): Promise<RenderDetectHandoffCaseResult> {
  const canvasA = createBenchmarkCanvas(context.renderSettings.detectCanvasWidth, context.renderSettings.detectCanvasHeight)
  const canvasB = createBenchmarkCanvas(context.renderSettings.detectCanvasWidth, context.renderSettings.detectCanvasHeight)
  measureHandoffRender(createEmptyRenderDetectHandoffSample("warmup", -1), canvasA, context)
  let detectCanvas = canvasA
  let renderCanvas = canvasB
  const samples: RenderDetectHandoffSample[] = []

  await runRenderDetectHandoffPhases(options, async (phase, runIndex) => {
    const sample = createEmptyRenderDetectHandoffSample(phase, runIndex)
    const totalStartMs = performance.now()
    try {
      // Double buffer case intentionally detects the previously rendered canvas and renders the next buffer separately.
      measureHandoffDetect(sample, detectCanvas, context.detector)
      measureHandoffRender(sample, renderCanvas, context)
      sample.totalMs = performance.now() - totalStartMs
      const nextDetectCanvas = renderCanvas
      renderCanvas = detectCanvas
      detectCanvas = nextDetectCanvas
    } catch (error) {
      sample.detected = false
      sample.landmarkCount = 0
      sample.totalMs = performance.now() - totalStartMs
      sample.errorMessage = error instanceof Error ? error.message : String(error)
    }
    samples.push(sample)
  })

  return buildRenderDetectHandoffCaseResult({
    caseId: `handoff_double_buffer_previous_frame_${context.renderSettings.detectCanvasWidth}`,
    label: `double buffer / previous frame detect / ${context.renderSettings.detectCanvasWidth}`,
    handoffStrategy: "double_buffer_previous_frame",
    canvasWidth: canvasA.width,
    canvasHeight: canvasA.height,
    options,
    samples,
    notes: ["detectMs は前回render済みcanvas、renderMs は次bufferへのOBJ renderを測る"],
  })
}

async function runRenderDetectHandoffPhases(
  options: RenderDetectHandoffOptions,
  runSample: (phase: RenderDetectHandoffPhase, runIndex: number) => Promise<void> | void,
) {
  for (const phase of ["warmup", "measured"] as const) {
    const runCount = phase === "warmup" ? options.warmupRuns : options.measuredRuns
    for (let runIndex = 0; runIndex < runCount; runIndex += 1) {
      if (renderDetectHandoffCancelRequested) {
        throw new Error("cancelled")
      }
      await runSample(phase, runIndex)
      await waitForBenchmarkUiTick()
    }
  }
}

function measureHandoffRender(
  sample: RenderDetectHandoffSample,
  canvas: HTMLCanvasElement,
  context: Awaited<ReturnType<typeof prepareDetectPerformanceBenchmarkContext>>,
) {
  const renderStartMs = performance.now()
  const renderSummary = renderRenderedIdealCanvasTo(
    canvas,
    getObjPoseSyncRotationCenter(),
    context.p,
    {
      directPose: true,
      appearanceOverride: context.appearance,
      forceRenderResolution: true,
    },
  )
  sample.renderMs = performance.now() - renderStartMs
  if (renderSummary.status !== "rendered") {
    throw new Error(renderSummary.errorMessage ?? renderSummary.status)
  }
}

function measureHandoffDetect(
  sample: RenderDetectHandoffSample,
  imageSource: Parameters<FaceLandmarker["detect"]>[0],
  detector: FaceLandmarker,
) {
  const detectStartMs = performance.now()
  const result = detector.detect(imageSource)
  sample.detectMs = performance.now() - detectStartMs
  sample.detected = result.faceLandmarks.length > 0
  sample.landmarkCount = result.faceLandmarks[0]?.length ?? 0
}

function createBenchmarkCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  return canvas
}

function createEmptyRenderDetectHandoffSample(
  phase: RenderDetectHandoffPhase,
  runIndex: number,
): RenderDetectHandoffSample {
  return {
    runIndex,
    phase,
    renderMs: null,
    waitMs: null,
    bitmapCreateMs: null,
    copyMs: null,
    readbackMs: null,
    detectMs: null,
    totalMs: null,
    detected: null,
    landmarkCount: null,
    errorMessage: null,
  }
}

function buildRenderDetectHandoffCaseResult(input: {
  caseId: string
  label: string
  handoffStrategy: string
  canvasWidth: number
  canvasHeight: number
  options: RenderDetectHandoffOptions
  samples: RenderDetectHandoffSample[]
  notes: string[]
}): RenderDetectHandoffCaseResult {
  const measuredSamples = input.samples.filter((sample) => sample.phase === "measured")
  return {
    caseId: input.caseId,
    label: input.label,
    handoffStrategy: input.handoffStrategy,
    canvasWidth: input.canvasWidth,
    canvasHeight: input.canvasHeight,
    warmupRuns: input.options.warmupRuns,
    measuredRuns: input.options.measuredRuns,
    detectedCount: measuredSamples.filter((sample) => sample.detected === true).length,
    failedCount: measuredSamples.filter((sample) => sample.errorMessage || sample.detected === false).length,
    summary: buildRenderDetectHandoffCaseSummary(measuredSamples),
    samples: input.samples,
    notes: input.notes,
  }
}

function buildRenderDetectHandoffCaseSummary(
  samples: RenderDetectHandoffSample[],
): RenderDetectHandoffCaseSummary {
  return {
    renderMs: summarizeRenderDetectHandoffSamples(samples, "renderMs"),
    waitMs: summarizeRenderDetectHandoffSamples(samples, "waitMs"),
    bitmapCreateMs: summarizeRenderDetectHandoffSamples(samples, "bitmapCreateMs"),
    copyMs: summarizeRenderDetectHandoffSamples(samples, "copyMs"),
    readbackMs: summarizeRenderDetectHandoffSamples(samples, "readbackMs"),
    detectMs: summarizeRenderDetectHandoffSamples(samples, "detectMs"),
    totalMs: summarizeRenderDetectHandoffSamples(samples, "totalMs"),
  }
}

function summarizeRenderDetectHandoffSamples(
  samples: RenderDetectHandoffSample[],
  field: RenderDetectHandoffTimingField,
): DetectPerformanceTimingSummary {
  const values = samples
    .map((sample) => sample[field])
    .filter((value): value is number => value !== null && Number.isFinite(value))
    .sort((a, b) => a - b)
  if (values.length === 0) {
    return { avgMs: null, p50Ms: null, p95Ms: null, minMs: null, maxMs: null }
  }
  return {
    avgMs: roundForState(averageNumbers(values)) ?? null,
    p50Ms: roundForState(getPercentile(values, 0.5)) ?? null,
    p95Ms: roundForState(getPercentile(values, 0.95)) ?? null,
    minMs: roundForState(values[0]) ?? null,
    maxMs: roundForState(values[values.length - 1]) ?? null,
  }
}

function buildRenderDetectHandoffExport(
  context: Awaited<ReturnType<typeof prepareDetectPerformanceBenchmarkContext>>,
  cases: RenderDetectHandoffCaseResult[],
  notes: string[],
  options: RenderDetectHandoffOptions,
): RenderDetectHandoffExport {
  const profile = getPoseMappingProfileRawSummary()
  return {
    type: "pose_mapping_render_detect_handoff_debug_v1",
    createdAt: new Date().toISOString(),
    source: {
      objFileName: state.objFile.fileName,
      mp4FileName: state.liveVideo.fileName,
      profileFileName: state.poseMappingProfile.fileName,
    },
    profile: {
      schemaVersion: profile.schemaVersion,
      modelType: profile.modelType,
      modelName: profile.modelName,
      datasetKind: profile.datasetKind,
    },
    runtime: {
      P_camera: roundPoseMappingPose(context.P_camera),
      p: roundPoseMappingPose(context.p),
      P_confirm: roundPoseForState(context.P_confirm),
      poseDiff: roundPoseMappingDiff(context.poseDiff),
    },
    landmarker: context.landmarker,
    renderSettings: {
      detectCanvasWidth: context.detectCanvas.width,
      detectCanvasHeight: context.detectCanvas.height,
      renderResolutionSource: context.renderSettings.renderResolutionSource,
      detectCanvasMatchesProfile: context.renderSettings.detectCanvasMatchesProfile,
    },
    benchmarkOptions: options,
    cases,
    conclusionHints: buildRenderDetectHandoffConclusionHints(cases),
    notes,
  }
}

function buildRenderDetectHandoffConclusionHints(
  cases: RenderDetectHandoffCaseResult[],
): RenderDetectHandoffConclusionHints {
  const detectOnlyAvgMs = findDetectOnlyRenderedIdealAvgMs()
  const immediateCase = cases.find((caseResult) => caseResult.handoffStrategy === "immediate") ?? null
  const bestCase = cases
    .filter((caseResult) => caseResult.summary.totalMs.avgMs !== null)
    .slice()
    .sort((a, b) => (a.summary.totalMs.avgMs ?? Infinity) - (b.summary.totalMs.avgMs ?? Infinity))[0] ?? null
  return {
    detectOnlyAvgMs,
    immediateRenderDetectAvgMs: immediateCase?.summary.detectMs.avgMs ?? null,
    bestHandoffStrategy: bestCase?.handoffStrategy ?? null,
    bestHandoffTotalAvgMs: bestCase?.summary.totalMs.avgMs ?? null,
    bestHandoffDetectAvgMs: bestCase?.summary.detectMs.avgMs ?? null,
  }
}

function findDetectOnlyRenderedIdealAvgMs() {
  const caseResult = state.detectPerformance.result?.cases.find((item) =>
    item.caseId.startsWith("detect_only_rendered_ideal_"),
  )
  return caseResult?.summary.avgMs ?? null
}

function waitForAnimationFrameOnce() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve())
  })
}

function waitForTimeoutZero() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0)
  })
}

async function startWebglObjBenchmark() {
  if (state.webglObjBenchmark.status === "running") {
    return
  }

  webglObjBenchmarkCancelRequested = false
  const options = {
    warmupRuns: state.webglObjBenchmark.options.warmupRuns,
    measuredRuns: state.webglObjBenchmark.options.measuredRuns,
  }
  state.webglObjBenchmark = {
    status: "running",
    startedAt: new Date().toISOString(),
    completedAt: null,
    errorMessage: null,
    options,
    result: null,
    notes: [
      "WebGL OBJ Renderer は通常 runtime と p,P dataset 生成の本線です。この benchmark は比較 / debug 用です。",
      "WebGL renderer 条件が変わった場合は、WebGL 条件で p,P dataset と poseMappingProfile を作り直します。",
      "各caseに preview生成、overlay、toDataURL、毎runごとのDOM更新は含めない",
    ],
  }
  renderDebugContent()

  const cases: WebglObjBenchmarkCaseResult[] = []
  const notes = [...state.webglObjBenchmark.notes]
  try {
    const context = await prepareDetectPerformanceBenchmarkContext()
    const renderer = getOrCreateWebglObjBenchmarkRenderer()
    resizeWebglObjBenchmarkRenderer(renderer, context.renderSettings.detectCanvasWidth, context.renderSettings.detectCanvasHeight)

    cases.push(await runWebglObjBenchmarkCase({
      caseId: `webgl_render_only_${context.renderSettings.detectCanvasWidth}`,
      label: `WebGL render only / ${context.renderSettings.detectCanvasWidth}`,
      rendererKind: "webgl",
      handoffStrategy: "render_only",
      context,
      renderer,
      options,
      runMeasuredSample: async (sample) => {
        const totalStartMs = performance.now()
        sample.webglRenderMs = measureWebglObjRender(renderer, context)
        sample.totalMs = performance.now() - totalStartMs
      },
    }))
    await throwIfWebglObjBenchmarkCancelled()

    cases.push(await runWebglObjBenchmarkCase({
      caseId: `webgl_render_detect_${context.renderSettings.detectCanvasWidth}`,
      label: `WebGL render -> detect / ${context.renderSettings.detectCanvasWidth}`,
      rendererKind: "webgl",
      handoffStrategy: "direct_webgl_canvas",
      context,
      renderer,
      options,
      runMeasuredSample: async (sample) => {
        const totalStartMs = performance.now()
        sample.webglRenderMs = measureWebglObjRender(renderer, context)
        measureWebglObjBenchmarkDetect(sample, renderer.canvas, context)
        sample.totalMs = performance.now() - totalStartMs
      },
    }))
    await throwIfWebglObjBenchmarkCancelled()

    cases.push(await runWebglObjBenchmarkCase({
      caseId: `webgl_finish_render_detect_${context.renderSettings.detectCanvasWidth}`,
      label: `WebGL render -> gl.finish() -> detect / ${context.renderSettings.detectCanvasWidth}`,
      rendererKind: "webgl",
      handoffStrategy: "gl_finish",
      context,
      renderer,
      options,
      runMeasuredSample: async (sample) => {
        const totalStartMs = performance.now()
        sample.webglRenderMs = measureWebglObjRender(renderer, context)
        const finishStartMs = performance.now()
        renderer.gl.finish()
        sample.finishMs = performance.now() - finishStartMs
        measureWebglObjBenchmarkDetect(sample, renderer.canvas, context)
        sample.totalMs = performance.now() - totalStartMs
      },
    }))
    await throwIfWebglObjBenchmarkCancelled()

    cases.push(await runWebglObjBenchmarkCase({
      caseId: `webgl_read_pixels_render_detect_${context.renderSettings.detectCanvasWidth}`,
      label: `WebGL render -> readPixels(1x1) -> detect / ${context.renderSettings.detectCanvasWidth}`,
      rendererKind: "webgl",
      handoffStrategy: "read_pixels_1x1",
      context,
      renderer,
      options,
      runMeasuredSample: async (sample) => {
        const totalStartMs = performance.now()
        sample.webglRenderMs = measureWebglObjRender(renderer, context)
        const readStartMs = performance.now()
        const pixel = new Uint8Array(4)
        renderer.gl.readPixels(0, 0, 1, 1, renderer.gl.RGBA, renderer.gl.UNSIGNED_BYTE, pixel)
        sample.readPixelsMs = performance.now() - readStartMs
        measureWebglObjBenchmarkDetect(sample, renderer.canvas, context)
        sample.totalMs = performance.now() - totalStartMs
      },
    }))
    await throwIfWebglObjBenchmarkCancelled()

    cases.push(await runWebglObjBenchmarkCase({
      caseId: `webgl_image_bitmap_render_detect_${context.renderSettings.detectCanvasWidth}`,
      label: `WebGL render -> createImageBitmap -> detect(bitmap) / ${context.renderSettings.detectCanvasWidth}`,
      rendererKind: "webgl",
      handoffStrategy: "createImageBitmap",
      context,
      renderer,
      options,
      runMeasuredSample: async (sample) => {
        const totalStartMs = performance.now()
        sample.webglRenderMs = measureWebglObjRender(renderer, context)
        if (typeof createImageBitmap !== "function") {
          sample.errorMessage = "createImageBitmap unsupported"
          sample.totalMs = performance.now() - totalStartMs
          return
        }
        const bitmapStartMs = performance.now()
        const bitmap = await createImageBitmap(renderer.canvas)
        sample.bitmapCreateMs = performance.now() - bitmapStartMs
        try {
          measureWebglObjBenchmarkDetect(sample, bitmap as Parameters<FaceLandmarker["detect"]>[0], context)
        } catch (error) {
          sample.errorMessage = `ImageBitmap detect unsupported: ${error instanceof Error ? error.message : String(error)}`
          sample.detected = false
          sample.landmarkCount = 0
        } finally {
          bitmap.close()
        }
        sample.totalMs = performance.now() - totalStartMs
      },
    }))
    await throwIfWebglObjBenchmarkCancelled()

    cases.push(await runWebglObjBenchmarkCase({
      caseId: `webgl_copy_2d_render_detect_${context.renderSettings.detectCanvasWidth}`,
      label: `WebGL render -> copy to 2D canvas -> detect / ${context.renderSettings.detectCanvasWidth}`,
      rendererKind: "webgl",
      handoffStrategy: "copy_to_2d_canvas",
      context,
      renderer,
      options,
      runMeasuredSample: async (sample) => {
        const totalStartMs = performance.now()
        sample.webglRenderMs = measureWebglObjRender(renderer, context)
        const canvas2d = createBenchmarkCanvas(context.renderSettings.detectCanvasWidth, context.renderSettings.detectCanvasHeight)
        const copyContext = canvas2d.getContext("2d")
        if (!copyContext) {
          throw new Error("copy to 2D canvas context を取得できません。")
        }
        const copyStartMs = performance.now()
        copyContext.drawImage(renderer.canvas, 0, 0)
        sample.copyTo2dMs = performance.now() - copyStartMs
        measureWebglObjBenchmarkDetect(sample, canvas2d, context)
        sample.totalMs = performance.now() - totalStartMs
      },
    }))
    await throwIfWebglObjBenchmarkCancelled()

    cases.push(await runCanvas2dBaselineWebglBenchmarkCase(context, options, "immediate"))
    await throwIfWebglObjBenchmarkCancelled()
    cases.push(await runCanvas2dBaselineWebglBenchmarkCase(context, options, "explicit_readback"))

    const support = getWebglObjBenchmarkSupport(renderer, context.appearance)
    const result = buildWebglObjBenchmarkExport(context, cases, support, notes, options)
    state.webglObjBenchmark = {
      ...state.webglObjBenchmark,
      status: webglObjBenchmarkCancelRequested ? "cancelled" : "completed",
      completedAt: new Date().toISOString(),
      result,
      notes,
    }
    addLog(`WebGL OBJ benchmark が完了しました: ${cases.length} cases`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const status: WebglObjBenchmarkStatus = message === "cancelled" ? "cancelled" : "error"
    state.webglObjBenchmark = {
      ...state.webglObjBenchmark,
      status,
      completedAt: new Date().toISOString(),
      errorMessage: status === "error" ? message : null,
      notes,
    }
    if (status === "error") {
      addLog(`WebGL OBJ benchmark でエラーが発生しました: ${message}`)
    } else {
      addLog("WebGL OBJ benchmark を停止しました。")
    }
  } finally {
    webglObjBenchmarkCancelRequested = false
    renderAll({ skipObjRender: true })
  }
}

function stopWebglObjBenchmark() {
  if (state.webglObjBenchmark.status === "running") {
    webglObjBenchmarkCancelRequested = true
  }
}

async function throwIfWebglObjBenchmarkCancelled() {
  await waitForBenchmarkUiTick()
  if (webglObjBenchmarkCancelRequested) {
    throw new Error("cancelled")
  }
}

function armRenderPoseProbeAfterNextRecovery() {
  state.renderPoseProbe = {
    ...state.renderPoseProbe,
    runAfterNextRecovery: true,
    errorMessage: null,
  }
  renderDebugContent()
}

async function runRenderPoseProbe(trigger: RenderPoseProbeState["lastRunTrigger"] = "manual") {
  if (state.renderPoseProbe.status === "running") {
    return
  }
  const startedAt = new Date().toISOString()
  state.renderPoseProbe = {
    status: "running",
    runAfterNextRecovery: trigger === "after_next_recovery" ? false : state.renderPoseProbe.runAfterNextRecovery,
    lastRunTrigger: trigger,
    startedAt,
    completedAt: null,
    errorMessage: null,
    samples: [],
  }
  renderDebugContent()

  try {
    const profile = state.poseMappingProfile.profile
    const runtime = state.poseMappingRuntime
    if (
      !profile ||
      runtime.status !== "completed" ||
      runtime.poseMappingStatus !== "completed" ||
      !runtime.P_camera ||
      !canRenderRenderedIdealGeometry()
    ) {
      throw new Error("Render pose probe requires loaded OBJ, PoseMappingProfile, and completed runtime.")
    }

    const renderSettings = resolvePoseMappingRenderSettings(profile, liveObjPosePreviewCanvas)
    const { appearance } = createPoseMappingRenderAppearance(profile, renderSettings)
    const renderer = getOrCreateWebglObjBenchmarkRenderer()
    const rendererMetadata = buildWebglObjRendererMetadata(renderer, appearance)
    const profileRendererMatch = validatePoseMappingRendererMatch(profile, rendererMetadata, appearance)
    if (!profileRendererMatch.match) {
      throw new Error(profileRendererMatch.errorMessage ?? "Profile renderer mismatch")
    }

    resizeWebglObjBenchmarkRenderer(renderer, renderSettings.detectCanvasWidth, renderSettings.detectCanvasHeight)
    const detector = await getRenderedIdealFaceLandmarker()
    const samples: RenderPoseProbeSample[] = []

    for (const probe of RENDER_POSE_PROBE_POSES) {
      const totalStartMs = performance.now()
      let sample: RenderPoseProbeSample = {
        id: probe.id,
        label: probe.label,
        requestedPoseP: roundPoseMappingPose(probe.p) ?? probe.p,
        renderCallPoseP: null,
        bufferBuildPoseP: null,
        webglUniformPoseP: null,
        actualRenderPoseP: null,
        P_confirm: { yaw: null, pitch: null, roll: null },
        poseDiff: { yaw: null, pitch: null, roll: null, magnitude: null },
        detected: false,
        landmarkCount: null,
        renderMs: null,
        detectMs: null,
        totalMs: null,
        warning: null,
        errorMessage: null,
      }

      try {
        clearWebglRendererCanvas(renderer)
        const renderStartMs = performance.now()
        const renderResult = renderWebglObjToCanvas(renderer, {
          renderSettings,
          appearance,
          p: probe.p,
          rotationCenter: getObjPoseSyncRotationCenter(),
        })
        const renderMs = performance.now() - renderStartMs
        const detectStartMs = performance.now()
        const result = detector.detect(renderer.canvas)
        const detectMs = performance.now() - detectStartMs
        const detection = buildRenderedIdealDetectionState(result, -1, detectMs, null)
        const warning = getRenderPoseNotAppliedWarning(probe.p, detection.pose)
        sample = {
          ...sample,
          renderCallPoseP: roundPoseMappingPose(renderResult.renderCallPoseP),
          bufferBuildPoseP: roundPoseMappingPose(renderResult.bufferBuildPoseP),
          webglUniformPoseP: roundPoseMappingPose(renderResult.webglUniformPoseP),
          actualRenderPoseP: roundPoseMappingPose(renderResult.actualRenderPoseP),
          P_confirm: roundPoseForState(detection.pose),
          poseDiff: roundPoseMappingDiff(calculatePoseMappingPoseDiff(runtime.P_camera, detection.pose)),
          detected: detection.status === "detected",
          landmarkCount: detection.landmarkCount,
          renderMs: roundForState(renderMs),
          detectMs: roundForState(detectMs),
          totalMs: roundForState(performance.now() - totalStartMs),
          warning,
          errorMessage: detection.status === "detected" ? null : detection.errorMessage ?? detection.status,
        }
      } catch (error) {
        sample = {
          ...sample,
          totalMs: roundForState(performance.now() - totalStartMs),
          errorMessage: error instanceof Error ? error.message : String(error),
        }
      }

      samples.push(sample)
      state.renderPoseProbe = {
        ...state.renderPoseProbe,
        samples,
      }
      renderDebugContent()
      await waitForBenchmarkUiTick()
    }

    state.renderPoseProbe = {
      status: "completed",
      runAfterNextRecovery: false,
      lastRunTrigger: trigger,
      startedAt,
      completedAt: new Date().toISOString(),
      errorMessage: null,
      samples,
    }
    addLog("Render pose probe completed.")
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    state.renderPoseProbe = {
      ...state.renderPoseProbe,
      status: "error",
      runAfterNextRecovery: trigger === "after_next_recovery" ? false : state.renderPoseProbe.runAfterNextRecovery,
      lastRunTrigger: trigger,
      completedAt: new Date().toISOString(),
      errorMessage: message,
    }
    addLog(`Render pose probe failed: ${message}`)
  } finally {
    renderAll({ skipObjRender: true })
  }
}

async function runWebglObjBenchmarkCase(input: {
  caseId: string
  label: string
  rendererKind: "webgl" | "canvas2d"
  handoffStrategy: string
  context: Awaited<ReturnType<typeof prepareDetectPerformanceBenchmarkContext>>
  renderer: WebglObjRenderer
  options: WebglObjBenchmarkOptions
  runMeasuredSample: (sample: WebglObjBenchmarkSample) => Promise<void>
}): Promise<WebglObjBenchmarkCaseResult> {
  const samples: WebglObjBenchmarkSample[] = []
  await runWebglObjBenchmarkPhases(input.options, async (phase, runIndex) => {
    const sample = createEmptyWebglObjBenchmarkSample(phase, runIndex)
    try {
      await input.runMeasuredSample(sample)
    } catch (error) {
      sample.detected = false
      sample.landmarkCount = 0
      sample.errorMessage = error instanceof Error ? error.message : String(error)
    }
    samples.push(sample)
  })

  return buildWebglObjBenchmarkCaseResult({
    caseId: input.caseId,
    label: input.label,
    rendererKind: input.rendererKind,
    handoffStrategy: input.handoffStrategy,
    canvasWidth: input.renderer.canvas.width,
    canvasHeight: input.renderer.canvas.height,
    options: input.options,
    samples,
    notes: [],
  })
}

async function runCanvas2dBaselineWebglBenchmarkCase(
  context: Awaited<ReturnType<typeof prepareDetectPerformanceBenchmarkContext>>,
  options: WebglObjBenchmarkOptions,
  strategy: "immediate" | "explicit_readback",
): Promise<WebglObjBenchmarkCaseResult> {
  const canvas = createBenchmarkCanvas(context.renderSettings.detectCanvasWidth, context.renderSettings.detectCanvasHeight)
  const samples: WebglObjBenchmarkSample[] = []
  await runWebglObjBenchmarkPhases(options, async (phase, runIndex) => {
    const sample = createEmptyWebglObjBenchmarkSample(phase, runIndex)
    const totalStartMs = performance.now()
    try {
      // Canvas2D baseline stores the existing renderer's render time in webglRenderMs to keep CSV columns comparable.
      sample.webglRenderMs = measureCanvas2dBaselineRender(canvas, context)
      if (strategy === "explicit_readback") {
        const readStartMs = performance.now()
        const canvasContext = canvas.getContext("2d")
        if (!canvasContext) {
          throw new Error("Canvas2D baseline context を取得できません。")
        }
        canvasContext.getImageData(0, 0, 1, 1)
        sample.readPixelsMs = performance.now() - readStartMs
      }
      measureWebglObjBenchmarkDetect(sample, canvas, context)
      sample.totalMs = performance.now() - totalStartMs
    } catch (error) {
      sample.detected = false
      sample.landmarkCount = 0
      sample.totalMs = performance.now() - totalStartMs
      sample.errorMessage = error instanceof Error ? error.message : String(error)
    }
    samples.push(sample)
  })

  return buildWebglObjBenchmarkCaseResult({
    caseId: `canvas2d_${strategy}_reference_${context.renderSettings.detectCanvasWidth}`,
    label: `Canvas2D ${strategy === "immediate" ? "immediate render -> detect" : "explicit readback -> detect"} / ${context.renderSettings.detectCanvasWidth}`,
    rendererKind: "canvas2d",
    handoffStrategy: strategy,
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    options,
    samples,
    notes: ["Canvas2D baseline reference。CSVの webglRenderMs には Canvas2D renderMs 相当を保存する"],
  })
}

async function runWebglObjBenchmarkPhases(
  options: WebglObjBenchmarkOptions,
  runSample: (phase: WebglObjBenchmarkPhase, runIndex: number) => Promise<void> | void,
) {
  for (const phase of ["warmup", "measured"] as const) {
    const runCount = phase === "warmup" ? options.warmupRuns : options.measuredRuns
    for (let runIndex = 0; runIndex < runCount; runIndex += 1) {
      if (webglObjBenchmarkCancelRequested) {
        throw new Error("cancelled")
      }
      await runSample(phase, runIndex)
      await waitForBenchmarkUiTick()
    }
  }
}

function measureCanvas2dBaselineRender(
  canvas: HTMLCanvasElement,
  context: Awaited<ReturnType<typeof prepareDetectPerformanceBenchmarkContext>>,
) {
  const renderStartMs = performance.now()
  const renderSummary = renderRenderedIdealCanvasTo(
    canvas,
    getObjPoseSyncRotationCenter(),
    context.p,
    {
      directPose: true,
      appearanceOverride: context.appearance,
      forceRenderResolution: true,
    },
  )
  const renderMs = performance.now() - renderStartMs
  if (renderSummary.status !== "rendered") {
    throw new Error(renderSummary.errorMessage ?? renderSummary.status)
  }
  return renderMs
}

function measureWebglObjBenchmarkDetect(
  sample: WebglObjBenchmarkSample,
  imageSource: Parameters<FaceLandmarker["detect"]>[0],
  context: Awaited<ReturnType<typeof prepareDetectPerformanceBenchmarkContext>>,
) {
  const detectStartMs = performance.now()
  const result = context.detector.detect(imageSource)
  sample.detectMs = performance.now() - detectStartMs
  const detection = buildRenderedIdealDetectionState(result, -1, sample.detectMs, null)
  sample.detected = detection.status === "detected"
  sample.landmarkCount = detection.landmarkCount
  sample.P_confirm = roundPoseForState(detection.pose)
  sample.poseDiff = roundPoseMappingDiff(calculatePoseMappingPoseDiff(context.P_camera, detection.pose))
  sample.errorMessage = detection.status === "detected" ? sample.errorMessage : detection.errorMessage ?? detection.status
}

function createEmptyWebglObjBenchmarkSample(
  phase: WebglObjBenchmarkPhase,
  runIndex: number,
): WebglObjBenchmarkSample {
  return {
    runIndex,
    phase,
    webglRenderMs: null,
    finishMs: null,
    readPixelsMs: null,
    bitmapCreateMs: null,
    copyTo2dMs: null,
    detectMs: null,
    totalMs: null,
    detected: null,
    landmarkCount: null,
    P_confirm: { yaw: null, pitch: null, roll: null },
    poseDiff: { yaw: null, pitch: null, roll: null, magnitude: null },
    errorMessage: null,
  }
}

function buildWebglObjBenchmarkCaseResult(input: {
  caseId: string
  label: string
  rendererKind: "webgl" | "canvas2d"
  handoffStrategy: string
  canvasWidth: number
  canvasHeight: number
  options: WebglObjBenchmarkOptions
  samples: WebglObjBenchmarkSample[]
  notes: string[]
}): WebglObjBenchmarkCaseResult {
  const measuredSamples = input.samples.filter((sample) => sample.phase === "measured")
  return {
    caseId: input.caseId,
    label: input.label,
    rendererKind: input.rendererKind,
    handoffStrategy: input.handoffStrategy,
    canvasWidth: input.canvasWidth,
    canvasHeight: input.canvasHeight,
    warmupRuns: input.options.warmupRuns,
    measuredRuns: input.options.measuredRuns,
    detectedCount: measuredSamples.filter((sample) => sample.detected === true).length,
    failedCount: measuredSamples.filter((sample) => sample.errorMessage || sample.detected === false).length,
    summary: buildWebglObjBenchmarkCaseSummary(measuredSamples),
    samples: input.samples,
    notes: input.notes,
  }
}

function buildWebglObjBenchmarkCaseSummary(
  samples: WebglObjBenchmarkSample[],
): WebglObjBenchmarkCaseSummary {
  return {
    webglRenderMs: summarizeWebglObjBenchmarkSamples(samples, "webglRenderMs"),
    finishMs: summarizeWebglObjBenchmarkSamples(samples, "finishMs"),
    readPixelsMs: summarizeWebglObjBenchmarkSamples(samples, "readPixelsMs"),
    bitmapCreateMs: summarizeWebglObjBenchmarkSamples(samples, "bitmapCreateMs"),
    copyTo2dMs: summarizeWebglObjBenchmarkSamples(samples, "copyTo2dMs"),
    detectMs: summarizeWebglObjBenchmarkSamples(samples, "detectMs"),
    totalMs: summarizeWebglObjBenchmarkSamples(samples, "totalMs"),
    poseDiffMagnitude: summarizeWebglObjBenchmarkPoseDiff(samples),
  }
}

function summarizeWebglObjBenchmarkSamples(
  samples: WebglObjBenchmarkSample[],
  field: WebglObjBenchmarkTimingField,
): DetectPerformanceTimingSummary {
  const values = samples
    .map((sample) => sample[field])
    .filter((value): value is number => value !== null && Number.isFinite(value))
    .sort((a, b) => a - b)
  return summarizeWebglNumbers(values)
}

function summarizeWebglObjBenchmarkPoseDiff(samples: WebglObjBenchmarkSample[]) {
  const values = samples
    .map((sample) => sample.poseDiff.magnitude)
    .filter((value): value is number => value !== null && Number.isFinite(value))
    .sort((a, b) => a - b)
  return summarizeWebglNumbers(values)
}

function summarizeWebglNumbers(values: number[]): DetectPerformanceTimingSummary {
  if (values.length === 0) {
    return { avgMs: null, p50Ms: null, p95Ms: null, minMs: null, maxMs: null }
  }
  return {
    avgMs: roundForState(averageNumbers(values)) ?? null,
    p50Ms: roundForState(getPercentile(values, 0.5)) ?? null,
    p95Ms: roundForState(getPercentile(values, 0.95)) ?? null,
    minMs: roundForState(values[0]) ?? null,
    maxMs: roundForState(values[values.length - 1]) ?? null,
  }
}

function buildWebglObjBenchmarkExport(
  context: Awaited<ReturnType<typeof prepareDetectPerformanceBenchmarkContext>>,
  cases: WebglObjBenchmarkCaseResult[],
  support: WebglObjBenchmarkSupport,
  notes: string[],
  options: WebglObjBenchmarkOptions,
): WebglObjBenchmarkExport {
  const profile = getPoseMappingProfileRawSummary()
  return {
    type: "pose_mapping_webgl_obj_render_benchmark_v1",
    createdAt: new Date().toISOString(),
    source: {
      objFileName: state.objFile.fileName,
      mp4FileName: state.liveVideo.fileName,
      profileFileName: state.poseMappingProfile.fileName,
    },
    profile: {
      schemaVersion: profile.schemaVersion,
      modelType: profile.modelType,
      modelName: profile.modelName,
      datasetKind: profile.datasetKind,
    },
    runtime: {
      P_camera: roundPoseMappingPose(context.P_camera),
      p: roundPoseMappingPose(context.p),
      canvas2dConfirm: {
        P_confirm: roundPoseForState(state.poseMappingRuntime.P_confirm),
        poseDiff: roundPoseMappingDiff(state.poseMappingRuntime.poseDiff),
      },
    },
    landmarker: context.landmarker,
    renderSettings: {
      canvasWidth: context.detectCanvas.width,
      canvasHeight: context.detectCanvas.height,
      renderResolutionSource: context.renderSettings.renderResolutionSource,
      detectCanvasMatchesProfile: context.renderSettings.detectCanvasMatchesProfile,
    },
    webgl: support,
    benchmarkOptions: options,
    cases,
    conclusionHints: buildWebglObjBenchmarkConclusionHints(cases),
    notes,
  }
}

function buildWebglObjBenchmarkConclusionHints(
  cases: WebglObjBenchmarkCaseResult[],
): WebglObjBenchmarkConclusionHints {
  const webglCases = cases.filter((caseResult) => caseResult.rendererKind === "webgl")
  const bestWebgl = webglCases
    .filter((caseResult) => caseResult.summary.totalMs.avgMs !== null)
    .slice()
    .sort((a, b) => (a.summary.totalMs.avgMs ?? Infinity) - (b.summary.totalMs.avgMs ?? Infinity))[0] ?? null
  const canvas2dImmediate =
    state.renderDetectHandoff.result?.cases.find((caseResult) => caseResult.handoffStrategy === "immediate")?.summary.totalMs.avgMs ??
    cases.find((caseResult) => caseResult.rendererKind === "canvas2d" && caseResult.handoffStrategy === "immediate")?.summary.totalMs.avgMs ??
    null
  const canvas2dReadback =
    state.renderDetectHandoff.result?.cases.find((caseResult) => caseResult.handoffStrategy === "explicit_readback")?.summary.totalMs.avgMs ??
    cases.find((caseResult) => caseResult.rendererKind === "canvas2d" && caseResult.handoffStrategy === "explicit_readback")?.summary.totalMs.avgMs ??
    null
  const webglPoseDiffP95 = webglCases
    .map((caseResult) => caseResult.summary.poseDiffMagnitude.p95Ms)
    .filter((value): value is number => value !== null && Number.isFinite(value))
    .sort((a, b) => b - a)[0] ?? null

  return {
    bestWebglTotalAvgMs: bestWebgl?.summary.totalMs.avgMs ?? null,
    bestWebglStrategy: bestWebgl?.handoffStrategy ?? null,
    canvas2dImmediateTotalAvgMs: canvas2dImmediate,
    canvas2dExplicitReadbackTotalAvgMs: canvas2dReadback,
    webglPoseDiffP95,
    recommendation: buildWebglObjBenchmarkRecommendation(bestWebgl?.summary.totalMs.avgMs ?? null, canvas2dImmediate, webglPoseDiffP95),
  }
}

function buildWebglObjBenchmarkRecommendation(
  bestWebglTotalAvgMs: number | null,
  canvas2dImmediateTotalAvgMs: number | null,
  webglPoseDiffP95: number | null,
) {
  if (bestWebglTotalAvgMs === null) {
    return "WebGL benchmark の有効な結果がありません。"
  }
  if (canvas2dImmediateTotalAvgMs !== null && bestWebglTotalAvgMs < canvas2dImmediateTotalAvgMs * 0.7) {
    return webglPoseDiffP95 !== null && webglPoseDiffP95 > 5
      ? "WebGL は速い可能性がありますが poseDiff が大きいため、WebGL 条件で p,P dataset / poseMappingProfile の再作成が必要です。"
      : "WebGL renderer 本線化を検討する価値があります。"
  }
  return "WebGL でも total が大きい場合、毎フレーム OBJ render -> detect 方式以外も検討してください。"
}

function getOrCreateWebglObjBenchmarkRenderer() {
  if (webglObjBenchmarkRenderer) {
    return webglObjBenchmarkRenderer
  }
  webglObjBenchmarkRenderer = createWebglObjBenchmarkRenderer()
  incrementRendererGeneration()
  return webglObjBenchmarkRenderer
}

function getOrCreatePlacementAnalysisRenderer() {
  if (placementAnalysisRenderer) {
    return placementAnalysisRenderer
  }
  placementAnalysisRenderer = createWebglObjBenchmarkRenderer(placementAnalysisRenderCanvas)
  return placementAnalysisRenderer
}

function createWebglObjBenchmarkRenderer(canvas: HTMLCanvasElement = document.createElement("canvas")): WebglObjRenderer {
  let context = canvas.getContext("webgl", { preserveDrawingBuffer: true }) as WebGLRenderingContext | null
  let contextType: "webgl" | "experimental-webgl" = "webgl"
  if (!context) {
    context = canvas.getContext("experimental-webgl", { preserveDrawingBuffer: true }) as WebGLRenderingContext | null
    contextType = "experimental-webgl"
  }
  if (!context) {
    throw new Error("WebGL context を取得できません。")
  }
  const gl = context as WebGLRenderingContext
  const vertexShader = compileWebglShader(gl, gl.VERTEX_SHADER, `
    attribute vec2 a_position;
    attribute vec3 a_color;
    uniform vec2 u_clipScale;
    uniform vec2 u_clipTranslate;
    varying vec3 v_color;
    void main() {
      gl_Position = vec4(a_position * u_clipScale + u_clipTranslate, 0.0, 1.0);
      v_color = a_color;
    }
  `)
  const fragmentShader = compileWebglShader(gl, gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec3 v_color;
    void main() {
      gl_FragColor = vec4(v_color, 1.0);
    }
  `)
  const program = linkWebglProgram(gl, vertexShader, fragmentShader)
  const positionBuffer = gl.createBuffer()
  const colorBuffer = gl.createBuffer()
  if (!positionBuffer || !colorBuffer) {
    throw new Error("WebGL buffer を作成できません。")
  }
  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info")
  return {
    canvas,
    gl,
    contextType,
    program,
    positionBuffer,
    colorBuffer,
    positionLocation: gl.getAttribLocation(program, "a_position"),
    colorLocation: gl.getAttribLocation(program, "a_color"),
    clipScaleLocation: gl.getUniformLocation(program, "u_clipScale"),
    clipTranslateLocation: gl.getUniformLocation(program, "u_clipTranslate"),
    rendererInfo: debugInfo
      ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
      : String(gl.getParameter(gl.RENDERER)),
    vendorInfo: debugInfo
      ? String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL))
      : String(gl.getParameter(gl.VENDOR)),
  }
}

function compileWebglShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) {
    throw new Error("WebGL shader を作成できません。")
  }
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "unknown shader compile error"
    gl.deleteShader(shader)
    throw new Error(message)
  }
  return shader
}

function linkWebglProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
  const program = gl.createProgram()
  if (!program) {
    throw new Error("WebGL program を作成できません。")
  }
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? "unknown program link error"
    gl.deleteProgram(program)
    throw new Error(message)
  }
  return program
}

function resizeWebglObjBenchmarkRenderer(renderer: WebglObjRenderer, width: number, height: number) {
  if (renderer.canvas.width !== width || renderer.canvas.height !== height) {
    renderer.canvas.width = width
    renderer.canvas.height = height
  }
}

function measureWebglObjRender(
  renderer: WebglObjRenderer,
  context: WebglObjRenderContext,
) {
  const renderStartMs = performance.now()
  renderWebglObjToCanvas(renderer, context)
  return performance.now() - renderStartMs
}

function renderWebglObjToCanvas(
  renderer: WebglObjRenderer,
  context: WebglObjRenderContext,
): WebglObjRenderResult {
  const renderCallPoseP = cloneObjPoseMappingPose(context.p)
  const { positions, colors, debug } = buildWebglObjRenderBuffers(context)
  const actualRenderPoseP = cloneObjPoseMappingPose(debug.bufferPoseP ?? renderCallPoseP)
  const gl = renderer.gl
  const background = hexToRgb(context.appearance.backgroundColor) ?? { r: 245, g: 247, b: 249 }
  gl.viewport(0, 0, renderer.canvas.width, renderer.canvas.height)
  gl.clearColor(background.r / 255, background.g / 255, background.b / 255, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.useProgram(renderer.program)
  const clipTransform = context.clipPlacementTransform ?? {
    scaleX: 1,
    scaleY: 1,
    translateX: 0,
    translateY: 0,
  }
  if (renderer.clipScaleLocation) {
    gl.uniform2f(renderer.clipScaleLocation, clipTransform.scaleX, clipTransform.scaleY)
  }
  if (renderer.clipTranslateLocation) {
    gl.uniform2f(renderer.clipTranslateLocation, clipTransform.translateX, clipTransform.translateY)
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, renderer.positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW)
  gl.enableVertexAttribArray(renderer.positionLocation)
  gl.vertexAttribPointer(renderer.positionLocation, 2, gl.FLOAT, false, 0, 0)

  gl.bindBuffer(gl.ARRAY_BUFFER, renderer.colorBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW)
  gl.enableVertexAttribArray(renderer.colorLocation)
  gl.vertexAttribPointer(renderer.colorLocation, 3, gl.FLOAT, false, 0, 0)

  gl.drawArrays(gl.TRIANGLES, 0, positions.length / 2)
  return {
    actualRenderPoseP,
    renderCallPoseP,
    previewStatePoseP: cloneObjPoseMappingPose(debug.bufferPoseP ?? actualRenderPoseP),
    bufferBuildPoseP: cloneObjPoseMappingPose(debug.bufferPoseP ?? actualRenderPoseP),
    webglUniformPoseP: null,
    buffer: debug,
  }
}

function buildWebglObjRenderBuffers(context: WebglObjRenderContext) {
  const summary = state.objSummary
  if (!summary.center || !summary.maxDimension || summary.maxDimension <= 0) {
    throw new Error("OBJ bounds が不足しています。")
  }
  const poseState = getDirectObjPosePreviewState(context.p)
  const bufferPoseP = poseFromObjPreviewState(poseState)
  const rotationCenter = context.rotationCenter
  const width = context.renderSettings.detectCanvasWidth
  const height = context.renderSettings.detectCanvasHeight
  const viewport = {
    centerX: width / 2,
    centerY: height / 2 + height * context.appearance.camera.verticalOffset,
    scale: Math.max(1, Math.min(width, height) * 0.44 * context.appearance.camera.scale),
  }
  const transformedVertices = state.objGeometry.vertices.map((vertex) =>
    transformObjVertexForRender(vertex, summary.center!, summary.maxDimension!, poseState, rotationCenter),
  )
  const faceItems = createRenderedIdealFaceDrawItems(transformedVertices, viewport, poseState, context.appearance)
  faceItems.sort((a, b) => a.averageZ - b.averageZ)

  const positionValues: number[] = []
  const colorValues: number[] = []
  const baseColor = hexToRgb(context.appearance.skinColor) ?? { r: 205, g: 177, b: 151 }
  for (const item of faceItems) {
    if (item.points.length < 3) {
      continue
    }
    const color = parseRenderedIdealColorToRgb(getRenderedIdealFaceColor(item.brightness, context.appearance), baseColor)
    for (let index = 1; index < item.points.length - 1; index += 1) {
      for (const point of [item.points[0], item.points[index], item.points[index + 1]]) {
        positionValues.push((point.x / width) * 2 - 1, 1 - (point.y / height) * 2)
        colorValues.push(color.r / 255, color.g / 255, color.b / 255)
      }
    }
  }
  webglRenderBufferGenerationId += 1
  const baseProjectedBounds = calculateWebglProjectedImageBoundsFromClipPositions(
    positionValues,
    width,
    height,
  )
  return {
    positions: new Float32Array(positionValues),
    colors: new Float32Array(colorValues),
    debug: {
      bufferPoseMode: "baked_vertices" as const,
      bufferPoseP,
      bufferGenerationId: webglRenderBufferGenerationId,
      bufferReused: false,
      bufferReuseReason: null,
      baseProjectedBounds,
    },
  }
}

function calculateWebglProjectedImageBoundsFromClipPositions(
  positions: number[],
  canvasWidth: number,
  canvasHeight: number,
): WebglProjectedImageBounds | null {
  if (positions.length < 2 || canvasWidth <= 0 || canvasHeight <= 0) {
    return null
  }
  let minImageX = Number.POSITIVE_INFINITY
  let maxImageX = Number.NEGATIVE_INFINITY
  let minImageY = Number.POSITIVE_INFINITY
  let maxImageY = Number.NEGATIVE_INFINITY
  for (let index = 0; index < positions.length - 1; index += 2) {
    const clipX = positions[index]
    const clipY = positions[index + 1]
    if (!Number.isFinite(clipX) || !Number.isFinite(clipY)) {
      continue
    }
    const imageX = (clipX + 1) / 2
    const imageY = (1 - clipY) / 2
    minImageX = Math.min(minImageX, imageX)
    maxImageX = Math.max(maxImageX, imageX)
    minImageY = Math.min(minImageY, imageY)
    maxImageY = Math.max(maxImageY, imageY)
  }
  if (
    !Number.isFinite(minImageX) ||
    !Number.isFinite(maxImageX) ||
    !Number.isFinite(minImageY) ||
    !Number.isFinite(maxImageY)
  ) {
    return null
  }
  const renderAspectRatio = canvasWidth / canvasHeight
  const centerImageX = (minImageX + maxImageX) / 2
  const centerImageY = (minImageY + maxImageY) / 2
  const widthImage = maxImageX - minImageX
  const heightImage = maxImageY - minImageY
  const widthWork = widthImage * renderAspectRatio
  const heightWork = heightImage
  return {
    centerImageX,
    centerImageY,
    centerWorkX: centerImageX * renderAspectRatio,
    centerWorkY: centerImageY,
    widthImage,
    heightImage,
    widthWork,
    heightWork,
    diagWork: Math.hypot(widthWork, heightWork),
    renderAspectRatio,
    canvasWidth,
    canvasHeight,
  }
}

function parseRenderedIdealColorToRgb(value: string, fallback: { r: number; g: number; b: number }) {
  const match = value.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
  if (!match) {
    return fallback
  }
  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
  }
}

function getWebglObjBenchmarkSupport(
  renderer: WebglObjRenderer,
  appearance: AppliedObjRenderAppearanceProfile,
): WebglObjBenchmarkSupport {
  return {
    supported: true,
    contextType: renderer.contextType,
    rendererInfo: renderer.rendererInfo,
    vendorInfo: renderer.vendorInfo,
    shaderCompileStatus: "ok",
    bufferStatus: "ok",
    projectionMode: "orthographic",
    cameraScale: appearance.camera.scale,
    cameraVerticalOffset: appearance.camera.verticalOffset,
    renderResolution: { ...appearance.renderResolution },
    notAppliedRenderAppearanceFields: getWebglObjNotAppliedRenderAppearanceFields(appearance),
    errorMessage: null,
  }
}

function getWebglObjNotAppliedRenderAppearanceFields(appearance: AppliedObjRenderAppearanceProfile) {
  const fields = ["material.specular", "lighting.castShadow", "camera.fovDeg", "camera.projection"]
  if (appearance.material.mode !== "flat" && appearance.material.mode !== "matte" && appearance.material.mode !== "lambert") {
    fields.push("material.mode")
  }
  return fields
}

function buildWebglObjRendererMetadata(
  renderer: WebglObjRenderer,
  appearance: AppliedObjRenderAppearanceProfile,
): WebglObjRendererMetadata {
  return {
    kind: "webgl",
    version: WEBGL_OBJ_RENDERER_VERSION,
    rendererSignature: createWebglObjRendererSignature(appearance),
    contextType: renderer.contextType,
    projectionMode: WEBGL_OBJ_RENDERER_PROJECTION_MODE,
    renderResolution: { ...appearance.renderResolution },
    rendererInfo: renderer.rendererInfo,
    vendorInfo: renderer.vendorInfo,
  }
}

function createWebglObjRendererSignature(appearance: AppliedObjRenderAppearanceProfile) {
  const light = appearance.lighting.keyLightDirection ?? { x: 0, y: 0, z: 0 }
  return [
    WEBGL_OBJ_RENDERER_VERSION,
    WEBGL_OBJ_RENDERER_PROJECTION_MODE,
    `${appearance.renderResolution.width}x${appearance.renderResolution.height}`,
    appearance.id,
    appearance.backgroundColor,
    appearance.skinColor,
    `material=${appearance.material.mode}:${formatSignatureNumber(appearance.material.diffuse)}:${formatSignatureNumber(appearance.material.ambient)}`,
    `lighting=${appearance.lighting.mode}:${formatSignatureNumber(appearance.lighting.ambientIntensity)}:${formatSignatureNumber(appearance.lighting.keyLightIntensity)}:${formatSignatureNumber(light.x)},${formatSignatureNumber(light.y)},${formatSignatureNumber(light.z)}`,
    `scale=${formatSignatureNumber(appearance.camera.scale)}`,
    `verticalOffset=${formatSignatureNumber(appearance.camera.verticalOffset)}`,
  ].join("|")
}

function formatSignatureNumber(value: number) {
  return Number.isFinite(value) ? Number(value.toFixed(6)).toString() : "null"
}

function createObjPoseMappingSampleRendererMetadata(renderer: WebglObjRendererMetadata): ObjPoseMappingSampleRendererMetadata {
  return {
    renderBackend: "webgl",
    rendererSignature: renderer.rendererSignature,
    rendererVersion: renderer.version,
    projectionMode: renderer.projectionMode,
    renderResolution: { ...renderer.renderResolution },
  }
}

function validatePoseMappingRendererMatch(
  profile: PoseMappingProfile,
  currentRenderer: WebglObjRendererMetadata,
  currentAppearance: AppliedObjRenderAppearanceProfile,
) {
  const errors: string[] = []
  const requiredRenderBackend = profile.requiredRenderBackend ?? profile.datasetMetadata.renderBackend
  const requiredRenderer = profile.requiredRenderer ?? profile.datasetMetadata.renderer
  const requiredResolution = getRenderResolutionFromRecord(requiredRenderer?.renderResolution)
  const profileAppearanceResolution = getRenderResolutionFromRecord(
    profile.datasetMetadata.renderAppearanceApplied?.renderResolution,
  )
  const requiredProjectionMode = getOptionalString(requiredRenderer?.projectionMode)
  const requiredKind = getOptionalString(requiredRenderer?.kind)
  const requiredVersion = getOptionalString(requiredRenderer?.version)
  const requiredSignature = getOptionalString(requiredRenderer?.rendererSignature)

  if (requiredRenderBackend !== "webgl") {
    errors.push(`profile requires renderBackend = ${requiredRenderBackend ?? "missing"}, current renderBackend = webgl`)
  }
  if (!requiredRenderer) {
    errors.push("profile requiredRenderer is missing")
  }
  if (requiredKind !== currentRenderer.kind) {
    errors.push(`profile requires renderer.kind = ${requiredKind ?? "missing"}, current renderer.kind = ${currentRenderer.kind}`)
  }
  if (requiredVersion !== currentRenderer.version) {
    errors.push(`profile requires renderer.version = ${requiredVersion ?? "missing"}, current renderer.version = ${currentRenderer.version}`)
  }
  if (requiredSignature !== currentRenderer.rendererSignature) {
    errors.push(`profile requires WebGL rendererSignature = ${requiredSignature ?? "missing"}, current rendererSignature = ${currentRenderer.rendererSignature}`)
  }
  if (requiredProjectionMode !== WEBGL_OBJ_RENDERER_PROJECTION_MODE) {
    errors.push(`profile requires projectionMode = ${requiredProjectionMode ?? "missing"}, current projectionMode = ${WEBGL_OBJ_RENDERER_PROJECTION_MODE}`)
  }
  if (
    !requiredResolution ||
    requiredResolution.width !== currentAppearance.renderResolution.width ||
    requiredResolution.height !== currentAppearance.renderResolution.height
  ) {
    errors.push(`profile requiredRenderer.renderResolution = ${formatRendererResolution(requiredResolution)}, current renderResolution = ${currentAppearance.renderResolution.width} x ${currentAppearance.renderResolution.height}`)
  }
  if (
    !profileAppearanceResolution ||
    profileAppearanceResolution.width !== currentAppearance.renderResolution.width ||
    profileAppearanceResolution.height !== currentAppearance.renderResolution.height
  ) {
    errors.push(`profile renderAppearance.applied.renderResolution = ${formatRendererResolution(profileAppearanceResolution)}, current renderResolution = ${currentAppearance.renderResolution.width} x ${currentAppearance.renderResolution.height}`)
  }

  return {
    match: errors.length === 0,
    errorMessage: errors.length > 0 ? `Profile renderer mismatch:\n  ${errors.join("\n  ")}` : null,
  }
}

function formatRendererResolution(resolution: { width: number; height: number } | null) {
  return resolution ? `${resolution.width} x ${resolution.height}` : "missing"
}

function buildPoseMappingQualityGate(): PoseMappingQualityGate {
  const reasons: string[] = []
  const profile = state.poseMappingProfile.profile
  const currentPose = getCurrentPoseForPoseMapping()
  if (!profile) {
    reasons.push("poseMappingProfile が読み込まれていません")
  }
  if (!canRenderRenderedIdealGeometry()) {
    reasons.push("OBJ が読み込まれていません")
  }
  if (state.currentAnalysis.status !== "detected") {
    reasons.push("current face が検出されていません")
  }
  if (!currentPose || !isFinitePose(currentPose)) {
    reasons.push("P_camera が finite number ではありません")
  }
  if (profile && currentPose && isPoseFarOutsideProfileRange(profile, currentPose)) {
    reasons.push("P_camera が poseRangeAfter から大きく外れています")
  }
  return {
    usable: reasons.length === 0,
    reasons,
  }
}

function getCurrentPoseForPoseMapping(): ObjPoseMappingPose | null {
  if (state.currentAnalysis.status !== "detected") {
    return null
  }
  const pose = state.currentAnalysis.pose
  if (!hasFullPose(pose)) {
    return null
  }
  return {
    yaw: pose.yaw!,
    pitch: pose.pitch!,
    roll: pose.roll!,
  }
}

function getPoseMappingCurrentFaceStatus(): PoseMappingCurrentFaceStatus {
  if (
    state.currentAnalysis.status === "detected" &&
    state.currentAnalysis.landmarks478.length === REQUIRED_LANDMARK_COUNT &&
    hasFullPose(state.currentAnalysis.pose)
  ) {
    return "detected"
  }
  if (
    state.currentAnalysis.status === "no_face" ||
    state.currentAnalysis.status === "not_ready" ||
    state.currentAnalysis.status === "ready" ||
    state.currentAnalysis.status === "analyzing"
  ) {
    return "missing"
  }
  return "invalid"
}

function getPoseMappingSkippedReasonForCurrentFace(): PoseMappingSkippedReason {
  const currentFaceStatus = getPoseMappingCurrentFaceStatus()
  if (currentFaceStatus === "missing") {
    return "no_current_face"
  }
  if (currentFaceStatus === "invalid") {
    return "invalid_pose"
  }
  return "none"
}

function getPoseMappingSkippedStatus(reason: PoseMappingSkippedReason): PoseMappingStatus {
  if (reason === "no_current_face") {
    return "skipped_no_current_face"
  }
  if (reason === "invalid_pose") {
    return "skipped_invalid_pose"
  }
  return "ready"
}

function buildPoseMappingAlignment(
  currentLandmarksImage: ReferenceLandmark[] | null,
  currentMatrix: MatrixDebugSummary | null,
  renderedIdealLandmarksImage: ReferenceLandmark[] | null,
  idealMatrix: MatrixDebugSummary | null,
  renderAspectRatio: number,
): {
  alignedRenderedIdeal478: ReferenceLandmark[] | null
  meshSourceVertices: ReferenceLandmark[] | null
  meshTargetVertices: ReferenceLandmark[] | null
  alignment: PoseMappingAlignmentState
} {
  const videoAspectRatio = getLiveVideoAspectRatio()
  const emptyPlacementDebug = buildPlacementDebugState(currentMatrix, null, idealMatrix, null)
  if (!currentLandmarksImage || currentLandmarksImage.length !== REQUIRED_LANDMARK_COUNT) {
    return {
      alignedRenderedIdeal478: null,
      meshSourceVertices: null,
      meshTargetVertices: null,
      alignment: {
        ...createEmptyPoseMappingAlignmentState("skipped_no_current_face", "no_current_face"),
        mode: state.poseMappingSettings.alignmentMode,
        placementLandmarkSet: state.poseMappingSettings.placementLandmarkSet,
        scaleBasis: state.poseMappingSettings.boundsScaleBasis,
        videoAspectRatio,
        renderAspectRatio,
        renderedIdealStatus: getRenderedIdealStatusFromLandmarks(renderedIdealLandmarksImage),
        placementDebug: emptyPlacementDebug,
      },
    }
  }
  const currentBoundsImage = calculateLandmarkBounds(currentLandmarksImage)
  const currentOnlyPlacementDebug = buildPlacementDebugState(currentMatrix, currentBoundsImage, idealMatrix, null)
  if (!renderedIdealLandmarksImage || renderedIdealLandmarksImage.length !== REQUIRED_LANDMARK_COUNT) {
    return {
      alignedRenderedIdeal478: null,
      meshSourceVertices: currentLandmarksImage.map(cloneReferenceLandmark),
      meshTargetVertices: null,
      alignment: {
        ...createEmptyPoseMappingAlignmentState("skipped_no_rendered_ideal", "no_rendered_ideal"),
        mode: state.poseMappingSettings.alignmentMode,
        placementLandmarkSet: state.poseMappingSettings.placementLandmarkSet,
        scaleBasis: state.poseMappingSettings.boundsScaleBasis,
        videoAspectRatio,
        renderAspectRatio,
        currentBoundsImage,
        currentPlacement: buildMediaPipePlacementFromMatrix(currentMatrix, currentBoundsImage),
        renderedIdealStatus: getRenderedIdealStatusFromLandmarks(renderedIdealLandmarksImage),
        placementDebug: currentOnlyPlacementDebug,
      },
    }
  }

  const renderedIdealBoundsImage = calculateLandmarkBounds(renderedIdealLandmarksImage)
  const currentPlacement = buildMediaPipePlacementFromMatrix(currentMatrix, currentBoundsImage)
  const idealPlacement = buildMediaPipePlacementFromMatrix(idealMatrix, renderedIdealBoundsImage)
  const placementDebug = buildPlacementDebugState(
    currentMatrix,
    currentBoundsImage,
    idealMatrix,
    renderedIdealBoundsImage,
  )
  const reasons = Array.from({ length: REQUIRED_LANDMARK_COUNT }, () => [] as PoseMappingExcludedReason[])
  const reasonCounts = createEmptyPoseMappingExcludedReasonCounts()

  for (let index = 0; index < REQUIRED_LANDMARK_COUNT; index += 1) {
    const current = currentLandmarksImage[index]
    const ideal = renderedIdealLandmarksImage[index]
    const landmarkReasons = getInitialAlignmentExcludedReasons(current, ideal, index)
    reasons[index].push(...landmarkReasons)
    for (const reason of landmarkReasons) {
      reasonCounts[reason] += 1
    }
  }

  if (state.poseMappingSettings.alignmentMode === "bounds_center_scale_v1") {
    return buildBoundsCenterScalePoseMappingAlignment({
      currentLandmarksImage,
      renderedIdealLandmarksImage,
      currentMatrix,
      idealMatrix,
      videoAspectRatio,
      renderAspectRatio,
      placementDebug,
      reasons,
      reasonCounts,
    })
  }

  const skipPlacementResult = getPlacementAlignmentSkip(currentPlacement, idealPlacement)
  if (skipPlacementResult) {
    return {
      alignedRenderedIdeal478: null,
      meshSourceVertices: currentLandmarksImage.map(cloneReferenceLandmark),
      meshTargetVertices: null,
      alignment: {
        ...createEmptyPoseMappingAlignmentState(skipPlacementResult.status, skipPlacementResult.reason),
        mode: "mediapipe_placement_center_scale",
        placementLandmarkSet: state.poseMappingSettings.placementLandmarkSet,
        scaleBasis: state.poseMappingSettings.boundsScaleBasis,
        placementSource: currentPlacement.source !== "unknown" ? currentPlacement.source : idealPlacement.source,
        currentPlacement,
        idealPlacement,
        videoAspectRatio,
        renderAspectRatio,
        currentBoundsImage,
        renderedIdealBoundsImage,
        placementDebug,
        excludedReasonCounts: reasonCounts,
        landmarkReasons: reasons,
        renderedIdealStatus: "detected",
      },
    }
  }

  const placementScaleRatio = currentPlacement.scale! / idealPlacement.scale!
  const alignedRenderedIdealLandmarksImage = renderedIdealLandmarksImage.map((landmark) => {
    const alignedX =
      (landmark.x - idealPlacement.center!.x) * placementScaleRatio +
      currentPlacement.center!.x
    const alignedY =
      (landmark.y - idealPlacement.center!.y) * placementScaleRatio +
      currentPlacement.center!.y
    return {
      index: landmark.index,
      x: alignedX,
      y: alignedY,
      z: landmark.z,
    }
  })

  const displacementValues: number[] = []
  for (let index = 0; index < REQUIRED_LANDMARK_COUNT; index += 1) {
    const current = currentLandmarksImage[index]
    const aligned = alignedRenderedIdealLandmarksImage[index]
    if (!isFiniteLandmark(current) || !isFiniteLandmark(aligned)) {
      continue
    }
    const distance = calculateAspectCorrectedDistance(current, aligned, videoAspectRatio)
    displacementValues.push(distance)
    if (
      distance > ALIGNMENT_LARGE_DISPLACEMENT_THRESHOLD &&
      !reasons[index].includes("largeDisplacement")
    ) {
      reasons[index].push("largeDisplacement")
      reasonCounts.largeDisplacement += 1
    }
  }

  const meshSourceVertices = currentLandmarksImage.map(cloneReferenceLandmark)
  const meshTargetVertices = currentLandmarksImage.map((current, index) => {
    const aligned = alignedRenderedIdealLandmarksImage[index]
    return reasons[index].length > 0 || !isFiniteLandmark(aligned)
      ? cloneReferenceLandmark(current)
      : cloneReferenceLandmark(aligned)
  })

  return {
    alignedRenderedIdeal478: alignedRenderedIdealLandmarksImage,
    meshSourceVertices,
    meshTargetVertices,
    alignment: {
      status: "completed",
      mode: "mediapipe_placement_center_scale",
      rotationApplied: false,
      placementLandmarkSet: state.poseMappingSettings.placementLandmarkSet,
      scaleBasis: state.poseMappingSettings.boundsScaleBasis,
      placementSource: currentPlacement.source,
      alignmentSkippedReason: "none",
      currentPlacement,
      idealPlacement,
      placementScaleRatio,
      renderedIdealStatus: "detected",
      anchorCount: 0,
      currentCenter: currentPlacement.center,
      idealCenter: idealPlacement.center,
      scale: placementScaleRatio,
      videoAspectRatio,
      renderAspectRatio,
      currentBoundsImage,
      renderedIdealBoundsImage,
      currentBoundsAspectWork: null,
      renderedIdealBoundsAspectWork: null,
      alignedIdealBoundsAspectWork: null,
      alignedRenderedIdealBoundsImage: calculateLandmarkBounds(alignedRenderedIdealLandmarksImage),
      displayedContentRect: null,
      placementDebug,
      boundsCenterScaleDebug: null,
      excludedReasonCounts: reasonCounts,
      displacementSummary: summarizeDisplacements(displacementValues),
      anchorIndices: [],
      landmarkReasons: reasons,
    },
  }
}

function poseFromObjPreviewState(poseState: ObjPreviewState): ObjPoseMappingPose {
  return {
    yaw: poseState.yawDeg,
    pitch: poseState.pitchDeg,
    roll: poseState.rollDeg,
  }
}

function cloneObjPoseMappingPose(pose: ObjPoseMappingPose): ObjPoseMappingPose {
  return {
    yaw: pose.yaw,
    pitch: pose.pitch,
    roll: pose.roll,
  }
}

function buildBoundsCenterScalePoseMappingAlignment(params: {
  currentLandmarksImage: ReferenceLandmark[]
  renderedIdealLandmarksImage: ReferenceLandmark[]
  currentMatrix: MatrixDebugSummary | null
  idealMatrix: MatrixDebugSummary | null
  videoAspectRatio: number
  renderAspectRatio: number
  placementDebug: PlacementDebugState
  reasons: Array<PoseMappingExcludedReason[]>
  reasonCounts: PoseMappingExcludedReasonCounts
}): {
  alignedRenderedIdeal478: ReferenceLandmark[] | null
  meshSourceVertices: ReferenceLandmark[] | null
  meshTargetVertices: ReferenceLandmark[] | null
  alignment: PoseMappingAlignmentState
} {
  const placementLandmarkSet = state.poseMappingSettings.placementLandmarkSet
  const scaleBasis = state.poseMappingSettings.boundsScaleBasis
  const placementIndices = getPlacementLandmarkIndices(placementLandmarkSet)
  const currentPlacementLandmarksImage = getLandmarksByIndices(params.currentLandmarksImage, placementIndices)
  const idealPlacementLandmarksImage = getLandmarksByIndices(params.renderedIdealLandmarksImage, placementIndices)
  const currentBoundsImage = calculateLandmarkBounds(currentPlacementLandmarksImage)
  const renderedIdealBoundsImage = calculateLandmarkBounds(idealPlacementLandmarksImage)
  const currentBoundsImagePlacement = buildBoundsPlacement(currentBoundsImage)
  const renderedIdealBoundsImagePlacement = buildBoundsPlacement(renderedIdealBoundsImage)
  const currentLandmarksWork = currentPlacementLandmarksImage.map((landmark) =>
    toAspectWorkLandmark(landmark, params.videoAspectRatio),
  )
  const idealLandmarksWork = idealPlacementLandmarksImage.map((landmark) =>
    toAspectWorkLandmark(landmark, params.renderAspectRatio),
  )
  const currentBoundsWork = calculateLandmarkBounds(currentLandmarksWork)
  const idealBoundsWork = calculateLandmarkBounds(idealLandmarksWork)
  const currentBoundsWorkPlacement = buildBoundsPlacement(currentBoundsWork)
  const idealBoundsWorkPlacement = buildBoundsPlacement(idealBoundsWork)
  const currentPlacement = buildBoundsMediaPipePlacement(currentBoundsImage, "current")
  const idealPlacement = buildBoundsMediaPipePlacement(renderedIdealBoundsImage, "ideal")

  if (
    !currentBoundsImage ||
    !renderedIdealBoundsImage ||
    !currentBoundsImagePlacement ||
    !renderedIdealBoundsImagePlacement ||
    !currentBoundsWork ||
    !idealBoundsWork ||
    !currentBoundsWorkPlacement ||
    !idealBoundsWorkPlacement
  ) {
    return {
      alignedRenderedIdeal478: null,
      meshSourceVertices: params.currentLandmarksImage.map(cloneReferenceLandmark),
      meshTargetVertices: null,
      alignment: {
        ...createEmptyPoseMappingAlignmentState("skipped_invalid_bounds", "invalid_bounds"),
        mode: "bounds_center_scale_v1",
        placementLandmarkSet,
        scaleBasis,
        placementSource: "landmarkBounds",
        currentPlacement,
        idealPlacement,
        videoAspectRatio: params.videoAspectRatio,
        renderAspectRatio: params.renderAspectRatio,
        currentBoundsImage,
        renderedIdealBoundsImage,
        currentBoundsAspectWork: currentBoundsWork,
        renderedIdealBoundsAspectWork: idealBoundsWork,
        placementDebug: params.placementDebug,
        excludedReasonCounts: params.reasonCounts,
        landmarkReasons: params.reasons,
        renderedIdealStatus: "detected",
      },
    }
  }

  const currentScale = getBoundsPlacementScale(currentBoundsWorkPlacement, scaleBasis)
  const idealScale = getBoundsPlacementScale(idealBoundsWorkPlacement, scaleBasis)
  const scaleRatio = currentScale / idealScale
  if (!Number.isFinite(currentScale) || !Number.isFinite(idealScale) || !Number.isFinite(scaleRatio) || scaleRatio <= 0) {
    return {
      alignedRenderedIdeal478: null,
      meshSourceVertices: params.currentLandmarksImage.map(cloneReferenceLandmark),
      meshTargetVertices: null,
      alignment: {
        ...createEmptyPoseMappingAlignmentState("skipped_invalid_scale", "invalid_scale"),
        mode: "bounds_center_scale_v1",
        placementLandmarkSet,
        scaleBasis,
        placementSource: "landmarkBounds",
        currentPlacement,
        idealPlacement,
        videoAspectRatio: params.videoAspectRatio,
        renderAspectRatio: params.renderAspectRatio,
        currentBoundsImage,
        renderedIdealBoundsImage,
        currentBoundsAspectWork: currentBoundsWork,
        renderedIdealBoundsAspectWork: idealBoundsWork,
        placementDebug: params.placementDebug,
        excludedReasonCounts: params.reasonCounts,
        landmarkReasons: params.reasons,
        renderedIdealStatus: "detected",
      },
    }
  }

  const alignedRenderedIdealLandmarksImage = params.renderedIdealLandmarksImage.map((landmark) => {
    const idealWork = toAspectWorkLandmark(landmark, params.renderAspectRatio)
    const alignedWork = {
      index: landmark.index,
      x: (idealWork.x - idealBoundsWorkPlacement.center.x) * scaleRatio + currentBoundsWorkPlacement.center.x,
      y: (idealWork.y - idealBoundsWorkPlacement.center.y) * scaleRatio + currentBoundsWorkPlacement.center.y,
      z: landmark.z,
    }
    return fromAspectWorkLandmark(alignedWork, params.videoAspectRatio)
  })
  const alignedPlacementLandmarksImage = getLandmarksByIndices(alignedRenderedIdealLandmarksImage, placementIndices)
  const alignedRenderedIdealBoundsImage = calculateLandmarkBounds(alignedPlacementLandmarksImage)
  const alignedRenderedIdealBoundsImagePlacement = buildBoundsPlacement(alignedRenderedIdealBoundsImage)
  const alignedIdealBoundsAspectWork = calculateLandmarkBounds(
    alignedPlacementLandmarksImage.map((landmark) => toAspectWorkLandmark(landmark, params.videoAspectRatio)),
  )
  const alignedIdealBoundsAspectWorkPlacement = buildBoundsPlacement(alignedIdealBoundsAspectWork)

  if (!alignedRenderedIdealBoundsImage || !alignedRenderedIdealBoundsImagePlacement || !alignedIdealBoundsAspectWork || !alignedIdealBoundsAspectWorkPlacement) {
    return {
      alignedRenderedIdeal478: null,
      meshSourceVertices: params.currentLandmarksImage.map(cloneReferenceLandmark),
      meshTargetVertices: null,
      alignment: {
        ...createEmptyPoseMappingAlignmentState("skipped_invalid_bounds", "invalid_bounds"),
        mode: "bounds_center_scale_v1",
        placementLandmarkSet,
        scaleBasis,
        placementSource: "landmarkBounds",
        currentPlacement,
        idealPlacement,
        videoAspectRatio: params.videoAspectRatio,
        renderAspectRatio: params.renderAspectRatio,
        currentBoundsImage,
        renderedIdealBoundsImage,
        currentBoundsAspectWork: currentBoundsWork,
        renderedIdealBoundsAspectWork: idealBoundsWork,
        placementDebug: params.placementDebug,
        excludedReasonCounts: params.reasonCounts,
        landmarkReasons: params.reasons,
        renderedIdealStatus: "detected",
      },
    }
  }

  const displacementValues: number[] = []
  for (let index = 0; index < REQUIRED_LANDMARK_COUNT; index += 1) {
    const current = params.currentLandmarksImage[index]
    const aligned = alignedRenderedIdealLandmarksImage[index]
    if (!isFiniteLandmark(current) || !isFiniteLandmark(aligned)) {
      continue
    }
    const distance = calculateAspectCorrectedDistance(current, aligned, params.videoAspectRatio)
    displacementValues.push(distance)
    if (
      distance > ALIGNMENT_LARGE_DISPLACEMENT_THRESHOLD &&
      !params.reasons[index].includes("largeDisplacement")
    ) {
      params.reasons[index].push("largeDisplacement")
      params.reasonCounts.largeDisplacement += 1
    }
  }

  const meshSourceVertices = params.currentLandmarksImage.map(cloneReferenceLandmark)
  const meshTargetVertices = params.currentLandmarksImage.map((current, index) => {
    const aligned = alignedRenderedIdealLandmarksImage[index]
    return params.reasons[index].length > 0 || !isFiniteLandmark(aligned)
      ? cloneReferenceLandmark(current)
      : cloneReferenceLandmark(aligned)
  })

  const translationWork = {
    x: currentBoundsWorkPlacement.center.x - idealBoundsWorkPlacement.center.x * scaleRatio,
    y: currentBoundsWorkPlacement.center.y - idealBoundsWorkPlacement.center.y * scaleRatio,
  }

  return {
    alignedRenderedIdeal478: alignedRenderedIdealLandmarksImage,
    meshSourceVertices,
    meshTargetVertices,
    alignment: {
      status: "completed",
      mode: "bounds_center_scale_v1",
      rotationApplied: false,
      placementLandmarkSet,
      scaleBasis,
      placementSource: "landmarkBounds",
      alignmentSkippedReason: "none",
      currentPlacement,
      idealPlacement,
      placementScaleRatio: scaleRatio,
      renderedIdealStatus: "detected",
      anchorCount: placementIndices.length,
      currentCenter: currentBoundsWorkPlacement.center,
      idealCenter: idealBoundsWorkPlacement.center,
      scale: scaleRatio,
      videoAspectRatio: params.videoAspectRatio,
      renderAspectRatio: params.renderAspectRatio,
      currentBoundsImage,
      renderedIdealBoundsImage,
      currentBoundsAspectWork: currentBoundsWork,
      renderedIdealBoundsAspectWork: idealBoundsWork,
      alignedIdealBoundsAspectWork,
      alignedRenderedIdealBoundsImage,
      displayedContentRect: null,
      placementDebug: params.placementDebug,
      boundsCenterScaleDebug: {
        mode: "bounds_center_scale_v1",
        placementLandmarkSet,
        scaleBasis,
        rotationApplied: false,
        currentBoundsWork: currentBoundsWorkPlacement,
        idealBoundsWork: idealBoundsWorkPlacement,
        currentCenterWork: currentBoundsWorkPlacement.center,
        idealCenterWork: idealBoundsWorkPlacement.center,
        currentScale,
        idealScale,
        scaleRatio,
        translationWork,
        currentBoundsImage: currentBoundsImagePlacement,
        renderedIdealBoundsImage: renderedIdealBoundsImagePlacement,
        alignedRenderedIdealBoundsImage: alignedRenderedIdealBoundsImagePlacement,
        alignedLandmarkCount: alignedRenderedIdealLandmarksImage.length,
      },
      excludedReasonCounts: params.reasonCounts,
      displacementSummary: summarizeDisplacements(displacementValues),
      anchorIndices: placementIndices,
      landmarkReasons: params.reasons,
    },
  }
}

function getRenderedIdealStatusFromLandmarks(
  landmarks: ReferenceLandmark[] | null,
): RenderedIdealStatus {
  if (!landmarks) {
    return "missing"
  }
  return landmarks.length === REQUIRED_LANDMARK_COUNT ? "detected" : "invalid"
}

function getRenderedIdealStatusFromDetection(status: RenderedIdealDetectionStatus): RenderedIdealStatus {
  if (status === "detected") {
    return "detected"
  }
  if (status === "error") {
    return "invalid"
  }
  return "missing"
}

function buildMediaPipePlacementFromMatrix(
  matrix: MatrixDebugSummary | null,
  boundsImage: PoseMappingBounds | null,
): MediaPipeFacePlacement {
  if (!matrix) {
    return createMissingMediaPipeFacePlacement("facialTransformationMatrix", "matrix_missing")
  }

  const raw = {
    matrixTranslation: matrix.translation,
    matrixScale: matrix.scale,
    matrixRotationDeg: matrix.rotationDeg,
    boundsImage,
  }
  if (!matrix.raw.values || matrix.raw.values.length < 16) {
    return createInvalidMediaPipeFacePlacement(
      "facialTransformationMatrix",
      "matrix_raw_16_values_missing",
      raw,
    )
  }
  if (!matrix.translation || !matrix.scale) {
    return createInvalidMediaPipeFacePlacement(
      "facialTransformationMatrix",
      "matrix_translation_or_scale_missing",
      raw,
    )
  }

  const center = {
    x: matrix.translation.x,
    y: matrix.translation.y,
  }
  const scale = matrix.scale.uniform
  const warnings: string[] = []
  if (!isImageNormalizedPoint(center)) {
    warnings.push("matrix_translation_is_not_image_normalized")
  }
  if (!Number.isFinite(scale) || scale <= 0) {
    warnings.push("matrix_uniform_scale_invalid")
  }
  if (isIdentityMatrixPlacement(matrix.rowMajor) && hasMatrixBoundsCenterMismatch(matrix.rowMajor, boundsImage)) {
    warnings.push("matrix_identity_placement_mismatches_bounds")
  }
  if (warnings.length > 0) {
    return {
      status: "invalid",
      source: "facialTransformationMatrix",
      center,
      scale,
      raw,
      warnings,
    }
  }

  return {
    status: "detected",
    source: "facialTransformationMatrix",
    center,
    scale,
    raw,
    warnings: [],
  }
}

function isIdentityMatrixPlacement(candidate: MatrixPlacementCandidate) {
  const translation = candidate.translation
  const scale = candidate.scale
  return Boolean(
    translation &&
      scale &&
      Math.abs(translation.x) <= PLACEMENT_IDENTITY_EPSILON &&
      Math.abs(translation.y) <= PLACEMENT_IDENTITY_EPSILON &&
      Math.abs(translation.z) <= PLACEMENT_IDENTITY_EPSILON &&
      Math.abs(scale.x - 1) <= PLACEMENT_IDENTITY_EPSILON &&
      Math.abs(scale.y - 1) <= PLACEMENT_IDENTITY_EPSILON &&
      Math.abs(scale.z - 1) <= PLACEMENT_IDENTITY_EPSILON,
  )
}

function hasMatrixBoundsCenterMismatch(
  candidate: MatrixPlacementCandidate,
  boundsImage: PoseMappingBounds | null,
) {
  const boundsPlacement = buildBoundsPlacement(boundsImage)
  if (!candidate.translation || !boundsPlacement) {
    return false
  }
  const dx = candidate.translation.x - boundsPlacement.center.x
  const dy = candidate.translation.y - boundsPlacement.center.y
  return Math.hypot(dx, dy) > PLACEMENT_MATRIX_BOUNDS_CENTER_MISMATCH_THRESHOLD
}

function buildPlacementDebugState(
  currentMatrix: MatrixDebugSummary | null,
  currentBoundsImage: PoseMappingBounds | null,
  idealMatrix: MatrixDebugSummary | null,
  renderedIdealBoundsImage: PoseMappingBounds | null,
): PlacementDebugState {
  const current = buildPlacementDebugSide(currentMatrix, currentBoundsImage)
  const ideal = buildPlacementDebugSide(idealMatrix, renderedIdealBoundsImage)
  return {
    current,
    ideal,
    comparison: {
      columnMajorTranslationVsBoundsCenter: {
        currentDx: calculatePlacementDebugDx(current.matrixColumnMajor, current.boundsPlacement),
        currentDy: calculatePlacementDebugDy(current.matrixColumnMajor, current.boundsPlacement),
        idealDx: calculatePlacementDebugDx(ideal.matrixColumnMajor, ideal.boundsPlacement),
        idealDy: calculatePlacementDebugDy(ideal.matrixColumnMajor, ideal.boundsPlacement),
      },
      rowMajorTranslationVsBoundsCenter: {
        currentDx: calculatePlacementDebugDx(current.matrixRowMajor, current.boundsPlacement),
        currentDy: calculatePlacementDebugDy(current.matrixRowMajor, current.boundsPlacement),
        idealDx: calculatePlacementDebugDx(ideal.matrixRowMajor, ideal.boundsPlacement),
        idealDy: calculatePlacementDebugDy(ideal.matrixRowMajor, ideal.boundsPlacement),
      },
      matrixScaleVsBoundsScale: {
        currentColumnMajorScaleToBoundsHeight: calculateMatrixScaleToBoundsHeight(
          current.matrixColumnMajor,
          current.boundsPlacement,
        ),
        idealColumnMajorScaleToBoundsHeight: calculateMatrixScaleToBoundsHeight(
          ideal.matrixColumnMajor,
          ideal.boundsPlacement,
        ),
        currentRowMajorScaleToBoundsHeight: calculateMatrixScaleToBoundsHeight(
          current.matrixRowMajor,
          current.boundsPlacement,
        ),
        idealRowMajorScaleToBoundsHeight: calculateMatrixScaleToBoundsHeight(
          ideal.matrixRowMajor,
          ideal.boundsPlacement,
        ),
      },
    },
  }
}

function buildPlacementDebugSide(
  matrix: MatrixDebugSummary | null,
  boundsImage: PoseMappingBounds | null,
): PlacementDebugSide {
  return {
    matrixRaw: matrix?.raw ?? createEmptyMatrixRawDebug(),
    matrixColumnMajor: matrix?.columnMajor ?? createEmptyMatrixPlacementCandidate(),
    matrixRowMajor: matrix?.rowMajor ?? createEmptyMatrixPlacementCandidate(),
    boundsPlacement: buildBoundsPlacement(boundsImage),
  }
}

function buildBoundsPlacement(bounds: PoseMappingBounds | null): BoundsPlacement | null {
  if (!bounds) {
    return null
  }
  return {
    center: {
      x: bounds.minX + bounds.width / 2,
      y: bounds.minY + bounds.height / 2,
    },
    width: bounds.width,
    height: bounds.height,
    scaleByHeight: bounds.height,
    scaleByWidth: bounds.width,
    scaleByDiag: Math.hypot(bounds.width, bounds.height),
  }
}

function getBoundsPlacementScale(placement: BoundsPlacement, scaleBasis: BoundsScaleBasis) {
  if (scaleBasis === "height") {
    return placement.scaleByHeight
  }
  if (scaleBasis === "width") {
    return placement.scaleByWidth
  }
  return placement.scaleByDiag
}

function buildBoundsMediaPipePlacement(
  boundsImage: PoseMappingBounds | null,
  label: "current" | "ideal",
): MediaPipeFacePlacement {
  const boundsPlacement = buildBoundsPlacement(boundsImage)
  if (!boundsPlacement) {
    return createInvalidMediaPipeFacePlacement("landmarkBounds", `${label}_bounds_invalid`, {
      matrixTranslation: null,
      matrixScale: null,
      boundsImage,
    })
  }
  const scale = getBoundsPlacementScale(boundsPlacement, state.poseMappingSettings.boundsScaleBasis)
  const warnings: string[] = []
  if (!isImageNormalizedPoint(boundsPlacement.center)) {
    warnings.push(`${label}_bounds_center_is_not_image_normalized`)
  }
  if (!Number.isFinite(scale) || scale <= 0) {
    warnings.push(`${label}_bounds_scale_invalid`)
  }
  return {
    status: warnings.length === 0 ? "detected" : "invalid",
    source: "landmarkBounds",
    center: boundsPlacement.center,
    scale,
    raw: {
      matrixTranslation: null,
      matrixScale: null,
      boundsImage,
    },
    warnings,
  }
}

function getPlacementLandmarkIndices(placementLandmarkSet: PlacementLandmarkSet) {
  return Array.from({ length: REQUIRED_LANDMARK_COUNT }, (_, index) => index).filter((index) => {
    if (isIrisLandmarkIndex(index)) {
      return false
    }
    if (placementLandmarkSet === "stable_non_expression" && EXPRESSION_SENSITIVE_LANDMARK_INDICES.has(index)) {
      return false
    }
    return true
  })
}

function getLandmarksByIndices(landmarks: ReferenceLandmark[], indices: number[]) {
  return indices
    .map((index) => landmarks[index])
    .filter(isFiniteLandmark)
}

function createEmptyMatrixRawDebug(): MatrixRawDebug {
  return {
    exists: false,
    constructorName: null,
    isArray: false,
    keys: [],
    data: null,
    values: null,
    rows: null,
    columns: null,
    rawObjectPreview: null,
  }
}

function calculatePlacementDebugDx(
  matrixPlacement: MatrixPlacementCandidate,
  boundsPlacement: BoundsPlacement | null,
) {
  return matrixPlacement.translation && boundsPlacement
    ? matrixPlacement.translation.x - boundsPlacement.center.x
    : null
}

function calculatePlacementDebugDy(
  matrixPlacement: MatrixPlacementCandidate,
  boundsPlacement: BoundsPlacement | null,
) {
  return matrixPlacement.translation && boundsPlacement
    ? matrixPlacement.translation.y - boundsPlacement.center.y
    : null
}

function calculateMatrixScaleToBoundsHeight(
  matrixPlacement: MatrixPlacementCandidate,
  boundsPlacement: BoundsPlacement | null,
) {
  return matrixPlacement.scale && boundsPlacement && boundsPlacement.scaleByHeight > 0
    ? matrixPlacement.scale.uniform / boundsPlacement.scaleByHeight
    : null
}

function isImageNormalizedPoint(point: { x: number; y: number }) {
  return (
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    point.x >= 0 &&
    point.x <= 1 &&
    point.y >= 0 &&
    point.y <= 1
  )
}

function getPlacementAlignmentSkip(
  currentPlacement: MediaPipeFacePlacement,
  idealPlacement: MediaPipeFacePlacement,
): { status: PoseMappingAlignmentStatus; reason: PoseMappingAlignmentSkippedReason } | null {
  if (currentPlacement.status === "missing") {
    return {
      status: "skipped_missing_current_placement",
      reason: "missing_current_placement",
    }
  }
  if (idealPlacement.status === "missing") {
    return {
      status: "skipped_missing_ideal_placement",
      reason: "missing_ideal_placement",
    }
  }
  if (currentPlacement.status === "invalid" || idealPlacement.status === "invalid") {
    return {
      status: "skipped_invalid_placement",
      reason: "invalid_placement",
    }
  }
  return null
}

function getInitialAlignmentExcludedReasons(
  current: ReferenceLandmark | undefined,
  ideal: ReferenceLandmark | undefined,
  index: number,
): PoseMappingExcludedReason[] {
  const reasons: PoseMappingExcludedReason[] = []
  if (!current) {
    reasons.push("missingCurrent")
  } else if (!isFiniteLandmark(current)) {
    reasons.push("invalid")
  } else if (isUnsafeImageLandmark(current)) {
    reasons.push("unsafe")
  }
  if (!ideal) {
    reasons.push("missingIdeal")
  } else if (!isFiniteLandmark(ideal)) {
    reasons.push("invalid")
  } else if (isUnsafeImageLandmark(ideal)) {
    reasons.push("unsafe")
  }
  if (isIrisLandmarkIndex(index)) {
    reasons.push("iris")
  }
  if (EXPRESSION_SENSITIVE_LANDMARK_INDICES.has(index)) {
    reasons.push("expressionSensitive")
  }
  return Array.from(new Set(reasons))
}

function cloneReferenceLandmark(landmark: ReferenceLandmark): ReferenceLandmark {
  return {
    index: landmark.index,
    x: landmark.x,
    y: landmark.y,
    z: landmark.z,
  }
}

function toAspectWorkLandmark(
  landmark: ReferenceLandmark,
  aspectRatio: number,
): ReferenceLandmark {
  return {
    index: landmark.index,
    x: landmark.x * aspectRatio,
    y: landmark.y,
    z: landmark.z,
  }
}

function fromAspectWorkLandmark(
  landmark: ReferenceLandmark,
  aspectRatio: number,
): ReferenceLandmark {
  return {
    index: landmark.index,
    x: landmark.x / aspectRatio,
    y: landmark.y,
    z: landmark.z,
  }
}

function calculateLandmarkBounds(landmarks: ReferenceLandmark[]): PoseMappingBounds | null {
  const finiteLandmarks = landmarks.filter(isFiniteLandmark)
  if (finiteLandmarks.length === 0) {
    return null
  }
  const minX = Math.min(...finiteLandmarks.map((landmark) => landmark.x))
  const maxX = Math.max(...finiteLandmarks.map((landmark) => landmark.x))
  const minY = Math.min(...finiteLandmarks.map((landmark) => landmark.y))
  const maxY = Math.max(...finiteLandmarks.map((landmark) => landmark.y))
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

function isIrisLandmarkIndex(index: number) {
  return index >= IRIS_LANDMARK_START && index <= IRIS_LANDMARK_END
}

function isFiniteLandmark(landmark: ReferenceLandmark | undefined): landmark is ReferenceLandmark {
  return Boolean(
    landmark &&
      Number.isFinite(landmark.x) &&
      Number.isFinite(landmark.y) &&
      Number.isFinite(landmark.z),
  )
}

function isUnsafeImageLandmark(landmark: ReferenceLandmark) {
  return (
    landmark.x < ALIGNMENT_UNSAFE_MIN ||
    landmark.x > ALIGNMENT_UNSAFE_MAX ||
    landmark.y < ALIGNMENT_UNSAFE_MIN ||
    landmark.y > ALIGNMENT_UNSAFE_MAX
  )
}

function calculateAspectCorrectedCenter(
  landmarks: ReferenceLandmark[],
  indices: number[],
  videoAspectRatio: number,
) {
  const sum = indices.reduce(
    (acc, index) => {
      acc.x += landmarks[index].x * videoAspectRatio
      acc.y += landmarks[index].y
      return acc
    },
    { x: 0, y: 0 },
  )
  return {
    x: sum.x / indices.length,
    y: sum.y / indices.length,
  }
}

function calculateAspectWorkCenter(
  landmarks: ReferenceLandmark[],
  indices: number[],
) {
  const sum = indices.reduce(
    (acc, index) => {
      acc.x += landmarks[index].x
      acc.y += landmarks[index].y
      return acc
    },
    { x: 0, y: 0 },
  )
  return {
    x: sum.x / indices.length,
    y: sum.y / indices.length,
  }
}

function calculateAspectWorkScale(
  landmarks: ReferenceLandmark[],
  indices: number[],
  center: { x: number; y: number },
) {
  const meanSquared = indices.reduce((sum, index) => {
    const dx = landmarks[index].x - center.x
    const dy = landmarks[index].y - center.y
    return sum + dx * dx + dy * dy
  }, 0) / indices.length
  return Math.sqrt(meanSquared)
}

function calculateAspectCorrectedScale(
  landmarks: ReferenceLandmark[],
  indices: number[],
  center: { x: number; y: number },
  videoAspectRatio: number,
) {
  const meanSquared = indices.reduce((sum, index) => {
    const dx = landmarks[index].x * videoAspectRatio - center.x
    const dy = landmarks[index].y - center.y
    return sum + dx * dx + dy * dy
  }, 0) / indices.length
  return Math.sqrt(meanSquared)
}

function calculateAspectCorrectedDistance(
  a: ReferenceLandmark,
  b: ReferenceLandmark,
  videoAspectRatio: number,
) {
  const dx = (a.x - b.x) * videoAspectRatio
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

function summarizeDisplacements(values: number[]): PoseMappingDisplacementSummary {
  if (values.length === 0) {
    return createEmptyPoseMappingDisplacementSummary()
  }
  const sorted = [...values].sort((a, b) => a - b)
  const sum = sorted.reduce((acc, value) => acc + value, 0)
  return {
    mean: sum / sorted.length,
    p50: percentileSorted(sorted, 0.5),
    p95: percentileSorted(sorted, 0.95),
    max: sorted[sorted.length - 1],
  }
}

function percentileSorted(values: number[], percentile: number) {
  if (values.length === 0) {
    return null
  }
  const index = clamp(Math.ceil(values.length * percentile) - 1, 0, values.length - 1)
  return values[index]
}

function getLiveVideoAspectRatio() {
  const width = state.liveVideo.width ?? liveVideoElement.videoWidth
  const height = state.liveVideo.height ?? liveVideoElement.videoHeight
  return width && height ? width / height : 1
}

function updatePoseMappingLastGoodAge(lastGood: PoseMappingLastGoodState): PoseMappingLastGoodState {
  return {
    ...lastGood,
    ageMs: lastGood.updatedAtMs === null ? null : Math.max(0, performance.now() - lastGood.updatedAtMs),
  }
}

function createPoseMappingLastGoodState(
  runtime: PoseMappingRuntimeState,
  mediaTimeSec: number | null,
): PoseMappingLastGoodState {
  return {
    hasLastGood: true,
    P_camera: runtime.P_camera ? { ...runtime.P_camera } : null,
    p: runtime.p ? { ...runtime.p } : null,
    P_confirm: { ...runtime.P_confirm },
    renderedIdeal478: runtime.renderedIdeal478 ? runtime.renderedIdeal478.map((landmark) => ({ ...landmark })) : null,
    alignedRenderedIdeal478: runtime.alignedRenderedIdeal478
      ? runtime.alignedRenderedIdeal478.map((landmark) => ({ ...landmark }))
      : null,
    updatedAtMs: performance.now(),
    mediaTimeSec,
    frameIndex: state.realtimeDebug.processedVideoFrameCount,
    ageMs: 0,
  }
}

function createSkippedPoseMappingRuntimeState(params: {
  previousRuntime: PoseMappingRuntimeState
  qualityGate: PoseMappingQualityGate
  currentFaceStatus: PoseMappingCurrentFaceStatus
  skippedReason: PoseMappingSkippedReason
}): PoseMappingRuntimeState {
  const previousRuntime = params.previousRuntime
  const lastGood = updatePoseMappingLastGoodAge(previousRuntime.lastGood)
  const staleMs = lastGood.updatedAtMs === null ? null : Math.max(0, performance.now() - lastGood.updatedAtMs)
  const noFaceSkipped = params.skippedReason === "no_current_face"
  return {
    ...previousRuntime,
    status: previousRuntime.previewDataUrl ? "completed" : "idle",
    currentFaceStatus: params.currentFaceStatus,
    renderedIdealStatus: "stale",
    alignmentStatus: "stale",
    alignmentSkippedReason: "stale",
    poseMappingStatus: getPoseMappingSkippedStatus(params.skippedReason),
    poseMappingSkippedReason: params.skippedReason,
    fallbackPoseUsed: false,
    fallbackRenderedIdealUsed: false,
    lastGood,
    stale: {
      isStale: lastGood.hasLastGood,
      staleReason: lastGood.hasLastGood ? params.skippedReason : null,
      staleMs: lastGood.hasLastGood ? staleMs : null,
    },
    noFaceCounters: {
      ...previousRuntime.noFaceCounters,
      currentFaceMissingCount:
        previousRuntime.noFaceCounters.currentFaceMissingCount +
        (params.currentFaceStatus === "missing" ? 1 : 0),
      poseMappingSkippedNoCurrentFaceCount:
        previousRuntime.noFaceCounters.poseMappingSkippedNoCurrentFaceCount +
        (noFaceSkipped ? 1 : 0),
    },
    lastUpdatedAt: formatUpdatedAt(),
    qualityGate: params.qualityGate,
    renderedIdealDetected: false,
    renderedIdealLandmarkCount: null,
    renderedIdeal478: null,
    renderedIdealToken: null,
    alignedRenderedIdeal478: null,
    alignedRenderedIdealToken: null,
    current478: null,
    meshSourceVertices: null,
    meshTargetVertices: null,
    assetLifecycle: createAssetLifecycle(previousRuntime.profileRendererMatch),
    frameLifecycle: null,
    renderedIdealLifecycle: {
      ...createEmptyRenderedIdealLifecycle(),
      staleCanvasDetected: lastGood.hasLastGood,
    },
    overlayLifecycle: createOverlayLifecycle(false, params.skippedReason),
    profileEvaluateMs: null,
    renderMs: null,
    detectMs: null,
    totalMs: null,
    errorMessage: params.skippedReason,
  }
}

function isPoseFarOutsideProfileRange(profile: PoseMappingProfile, pose: ObjPoseMappingPose) {
  const mapping: Array<[keyof ObjPoseMappingPose, string]> = [
    ["yaw", "P_yaw"],
    ["pitch", "P_pitch"],
    ["roll", "P_roll"],
  ]
  return mapping.some(([axis, key]) => {
    const range = profile.poseRangeAfter?.[key]
    if (!range || range.min === null || range.max === null) {
      return false
    }
    const span = Math.max(1, range.max - range.min)
    const margin = Math.max(5, span * 0.25)
    return pose[axis] < range.min - margin || pose[axis] > range.max + margin
  })
}

function calculatePoseMappingPoseDiff(
  P_camera: ObjPoseMappingPose,
  P_confirm: ReferencePose,
): PoseMappingPoseDiff {
  const yaw = subtractNullable(P_confirm.yaw, P_camera.yaw)
  const pitch = subtractNullable(P_confirm.pitch, P_camera.pitch)
  const roll = subtractNullable(P_confirm.roll, P_camera.roll)
  const values = [yaw, pitch, roll]
  return {
    yaw,
    pitch,
    roll,
    magnitude: values.every((value) => value === null)
      ? null
      : roundForState(Math.hypot(...values.map((value) => value ?? 0))),
  }
}

function resolvePoseMappingRenderSettings(
  profile: PoseMappingProfile,
  previewCanvas: HTMLCanvasElement,
): PoseMappingRenderSettings {
  const appearanceResolution = getRenderResolutionFromRecord(
    profile.datasetMetadata.renderAppearanceApplied?.renderResolution,
  )
  const renderSettingsResolution = getCanvasResolutionFromRenderSettings(profile.datasetMetadata.renderSettings)
  const selected = appearanceResolution ?? renderSettingsResolution ?? {
    width: 1179,
    height: 1179,
    source: "fallbackDefault" as const,
  }
  const profileResolution = appearanceResolution ?? renderSettingsResolution

  return {
    detectCanvasWidth: selected.width,
    detectCanvasHeight: selected.height,
    previewCanvasWidth: previewCanvas.width,
    previewCanvasHeight: previewCanvas.height,
    renderResolutionSource: selected.source,
    detectCanvasMatchesProfile:
      profileResolution !== null &&
      selected.width === profileResolution.width &&
      selected.height === profileResolution.height,
    profileCanvasWidth: profileResolution?.width ?? null,
    profileCanvasHeight: profileResolution?.height ?? null,
  }
}

function getRenderResolutionFromRecord(value: unknown) {
  if (!isRecord(value)) {
    return null
  }
  const width = getPositiveInteger(value.width)
  const height = getPositiveInteger(value.height)
  if (width === null || height === null) {
    return null
  }
  return {
    width,
    height,
    source: "profile.renderAppearance.applied.renderResolution" as const,
  }
}

function getCanvasResolutionFromRenderSettings(value: Record<string, unknown> | null) {
  if (!value) {
    return null
  }
  const width = getPositiveInteger(value.canvasWidth)
  const height = getPositiveInteger(value.canvasHeight)
  if (width === null || height === null) {
    return null
  }
  return {
    width,
    height,
    source: "profile.renderSettings.canvasWidthHeight" as const,
  }
}

function getPositiveInteger(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : null
}

function createPoseMappingRenderAppearance(
  profile: PoseMappingProfile,
  renderSettings: PoseMappingRenderSettings,
): {
  appearance: AppliedObjRenderAppearanceProfile
  debug: PoseMappingRenderAppearanceApplied
} {
  const base = getAppliedObjRenderAppearanceProfile({
    width: renderSettings.detectCanvasWidth,
    height: renderSettings.detectCanvasHeight,
  })
  const source = profile.datasetMetadata.renderAppearanceApplied
  const notAppliedRenderAppearanceFields: string[] = []
  const material = { ...base.material }
  const lighting = { ...base.lighting }
  const camera = { ...base.camera }

  if (source) {
    const materialSource = isRecord(source.material) ? source.material : null
    const lightingSource = isRecord(source.lighting) ? source.lighting : null
    const cameraSource = isRecord(source.camera) ? source.camera : null

    material.mode = getRenderAppearanceEnum(materialSource?.mode, ["matte", "flat", "lambert"], material.mode)
    material.diffuse = getRenderAppearanceNumber(materialSource?.diffuse, material.diffuse)
    material.ambient = getRenderAppearanceNumber(materialSource?.ambient, material.ambient)
    if (materialSource && "specular" in materialSource) {
      notAppliedRenderAppearanceFields.push("material.specular")
    }

    lighting.mode = getRenderAppearanceEnum(
      lightingSource?.mode,
      ["none", "camera_front", "fixed_directional", "dual_soft"],
      lighting.mode,
    )
    lighting.ambientIntensity = getRenderAppearanceNumber(
      lightingSource?.ambientIntensity,
      lighting.ambientIntensity,
    )
    lighting.keyLightIntensity = getRenderAppearanceNumber(
      lightingSource?.keyLightIntensity,
      lighting.keyLightIntensity,
    )
    const keyLightDirection = getRenderAppearanceVector(lightingSource?.keyLightDirection)
    if (keyLightDirection) {
      lighting.keyLightDirection = normalizeVector(keyLightDirection)
    }
    if (lightingSource && "castShadow" in lightingSource) {
      notAppliedRenderAppearanceFields.push("lighting.castShadow")
    }

    camera.scale = getRenderAppearanceNumber(cameraSource?.scale, camera.scale)
    camera.verticalOffset = getRenderAppearanceNumber(cameraSource?.verticalOffset, camera.verticalOffset)
    if (cameraSource && "projection" in cameraSource) {
      notAppliedRenderAppearanceFields.push("camera.projection")
    }
    if (cameraSource && "fovDeg" in cameraSource) {
      notAppliedRenderAppearanceFields.push("camera.fovDeg")
    }
  }

  const backgroundColor = getRenderAppearanceColor(source?.backgroundColor, base.backgroundColor)
  const skinColor = getRenderAppearanceColor(source?.skinColor, base.skinColor)
  const appearance: AppliedObjRenderAppearanceProfile = {
    ...base,
    label: "poseMappingProfile renderAppearance",
    backgroundColor,
    skinColor,
    material,
    lighting,
    camera,
    renderResolution: {
      width: renderSettings.detectCanvasWidth,
      height: renderSettings.detectCanvasHeight,
    },
  }
  const debug: PoseMappingRenderAppearanceApplied = {
    backgroundColor,
    skinColor,
    material: { ...material },
    lighting: { ...lighting },
    camera: { ...camera },
    renderResolution: { ...appearance.renderResolution },
    notAppliedRenderAppearanceFields,
  }

  return { appearance, debug }
}

function getRenderAppearanceColor(value: unknown, fallback: string) {
  return typeof value === "string" && hexToRgb(value) ? value : fallback
}

function getRenderAppearanceNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function getRenderAppearanceEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
) {
  return typeof value === "string" && allowed.includes(value as T) ? value as T : fallback
}

function getRenderAppearanceVector(value: unknown): ObjVertex | null {
  if (!isRecord(value)) {
    return null
  }
  const x = getOptionalFiniteNumber(value.x)
  const y = getOptionalFiniteNumber(value.y)
  const z = getOptionalFiniteNumber(value.z)
  return x === null || y === null || z === null ? null : { x, y, z }
}

function drawPoseMappingPreviewFromDetectCanvas(
  sourceCanvas: HTMLCanvasElement,
  landmarks: ReferenceLandmark[] | null,
) {
  const context = liveObjPosePreviewCanvas.getContext("2d")
  if (!context) {
    return { width: liveObjPosePreviewCanvas.width, height: liveObjPosePreviewCanvas.height }
  }
  const previewSize = getPoseMappingLivePreviewPixelSize()
  const targetWidth = previewSize.width
  const targetHeight = previewSize.height
  if (liveObjPosePreviewCanvas.width !== targetWidth || liveObjPosePreviewCanvas.height !== targetHeight) {
    liveObjPosePreviewCanvas.width = targetWidth
    liveObjPosePreviewCanvas.height = targetHeight
  }

  context.setTransform(1, 0, 0, 1, 0, 0)
  context.clearRect(0, 0, liveObjPosePreviewCanvas.width, liveObjPosePreviewCanvas.height)
  const scale = Math.min(
    liveObjPosePreviewCanvas.width / sourceCanvas.width,
    liveObjPosePreviewCanvas.height / sourceCanvas.height,
  )
  const drawWidth = sourceCanvas.width * scale
  const drawHeight = sourceCanvas.height * scale
  const offsetX = (liveObjPosePreviewCanvas.width - drawWidth) / 2
  const offsetY = (liveObjPosePreviewCanvas.height - drawHeight) / 2
  context.drawImage(sourceCanvas, offsetX, offsetY, drawWidth, drawHeight)
  drawPoseMappingPreviewOverlay(landmarks, { x: offsetX, y: offsetY, width: drawWidth, height: drawHeight })

  return { width: liveObjPosePreviewCanvas.width, height: liveObjPosePreviewCanvas.height }
}

function drawPoseMappingPreviewOverlay(
  landmarks: ReferenceLandmark[] | null,
  viewport: { x: number; y: number; width: number; height: number } = {
    x: 0,
    y: 0,
    width: liveObjPosePreviewCanvas.width,
    height: liveObjPosePreviewCanvas.height,
  },
) {
  if (!landmarks || landmarks.length !== REQUIRED_LANDMARK_COUNT) {
    return
  }
  const context = liveObjPosePreviewCanvas.getContext("2d")
  if (!context) {
    return
  }
  context.save()
  context.setTransform(1, 0, 0, 1, 0, 0)
  drawLandmarkPoints(
    context,
    viewport,
    landmarks,
    "rgba(219, 68, 85, 0.9)",
    1.45,
  )
  context.restore()
}

function clearPoseMappingPreviewCanvas() {
  const context = liveObjPosePreviewCanvas.getContext("2d")
  if (!context) {
    return
  }
  context.clearRect(0, 0, liveObjPosePreviewCanvas.width, liveObjPosePreviewCanvas.height)
}

function renderPoseMappingLivePreviewImage() {
  const previewSize = getPoseMappingLivePreviewPixelSize()
  state.poseMappingRuntime.previewCanvasWidth = previewSize.width
  state.poseMappingRuntime.previewCanvasHeight = previewSize.height
  if (state.poseMappingRuntime.renderSettings) {
    state.poseMappingRuntime.renderSettings.previewCanvasWidth = previewSize.width
    state.poseMappingRuntime.renderSettings.previewCanvasHeight = previewSize.height
  }
}

function getPoseMappingLivePreviewPixelSize() {
  const dpr = window.devicePixelRatio || 1
  const sourceWidth = liveOverlayCanvas.clientWidth || liveObjPosePreviewCanvas.width || 640
  const sourceHeight = liveOverlayCanvas.clientHeight || liveObjPosePreviewCanvas.height || 640
  return {
    width: Math.max(1, Math.round(sourceWidth * dpr)),
    height: Math.max(1, Math.round(sourceHeight * dpr)),
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
  const matrix = summarizeFaceMatrix(result.facialTransformationMatrixes[0])
  const pose = matrix?.rotationDeg ?? estimateNullablePose(result.facialTransformationMatrixes[0])
  const hasFace = result.faceLandmarks.length > 0
  const validLandmarks = landmarks.length === REQUIRED_LANDMARK_COUNT

  if (!hasFace) {
    return {
      ...createEmptyCurrentAnalysis(),
      status: "no_face",
      analyzedTimeSec: timeSec,
      landmarkCount: 0,
      pose,
      matrix,
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
      matrix,
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
    matrix,
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
    matrix: null,
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
        matrix: nextDetection.matrix,
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
      matrix: null,
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
  const matrix = summarizeFaceMatrix(result.facialTransformationMatrixes[0])
  const pose = matrix?.rotationDeg ?? estimateNullablePose(result.facialTransformationMatrixes[0])
  const hasFace = result.faceLandmarks.length > 0
  const validLandmarks = landmarks.length === REQUIRED_LANDMARK_COUNT

  if (!hasFace) {
    return {
      status: "not_detected",
      landmarks478: null,
      matrix,
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
      matrix,
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
    matrix,
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

async function startPlacementFunctionAnalysis() {
  if (state.placementAnalysis.status === "running") {
    return
  }

  if (!canRenderRenderedIdealGeometry()) {
    state.placementAnalysis = {
      ...state.placementAnalysis,
      status: "failed",
      latestError: "OBJ読込を完了してから解析を実行してください。",
      completedAt: new Date().toISOString(),
    }
    renderAll()
    return
  }

  placementAnalysisCancelRequested = false
  const runOptions = createDefaultPlacementFunctionAnalysisRunOptions()
  ensurePlacementAnalysisCanvasSize(runOptions)
  state.placementAnalysis = {
    ...createDefaultPlacementFunctionAnalysisState(),
    status: "running",
    startedAt: new Date().toISOString(),
    runOptions,
  }
  state.activePreviewTab = "placementAnalysis"
  state.activeDebugTab = "placementAnalysis"
  addLog("配置関数解析を開始しました。")
  renderAll()

  try {
    const detector = await getRenderedIdealFaceLandmarker()
    const renderer = getOrCreatePlacementAnalysisRenderer()
    resizeWebglObjBenchmarkRenderer(renderer, runOptions.canvasWidth, runOptions.canvasHeight)
    const appearance = getAppliedWebglObjRenderAppearanceProfile({
      width: runOptions.canvasWidth,
      height: runOptions.canvasHeight,
    })
    const plans = createPlacementFunctionAnalysisPlans(runOptions)

    for (const plan of plans) {
      if (placementAnalysisCancelRequested) {
        state.placementAnalysis = {
          ...state.placementAnalysis,
          status: "stopped",
          completedAt: new Date().toISOString(),
        }
        break
      }

      const sample = runPlacementFunctionAnalysisSample({
        detector,
        renderer,
        appearance,
        sampleIndex: plan.sampleIndex,
        knownPlacement: plan.knownPlacement,
        requestedPoseP: PLACEMENT_ANALYSIS_FRONT_POSE,
      })
      appendPlacementFunctionAnalysisSample(sample)
      renderPlacementAnalysisPreviewPanel()
      renderDebugContent()
      await waitForNextFrame()
    }

    if (state.placementAnalysis.status === "running") {
      state.placementAnalysis = {
        ...state.placementAnalysis,
        status: "completed",
        completedAt: new Date().toISOString(),
      }
      addLog("配置関数解析が完了しました。")
    } else if (state.placementAnalysis.status === "stopped") {
      addLog("配置関数解析を停止しました。")
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Placement function analysis failed", error)
    state.placementAnalysis = {
      ...state.placementAnalysis,
      status: "failed",
      latestError: message,
      completedAt: new Date().toISOString(),
    }
    addLog(`配置関数解析でエラーが発生しました: ${message}`)
  } finally {
    placementAnalysisCancelRequested = false
    renderAll()
  }
}

function stopPlacementFunctionAnalysis() {
  if (state.placementAnalysis.status !== "running") {
    return
  }
  placementAnalysisCancelRequested = true
}

function createPlacementFunctionAnalysisPlans(options: PlacementFunctionAnalysisRunOptions) {
  const plans: Array<{ sampleIndex: number; knownPlacement: KnownPlacement }> = []
  for (const centerImageY of options.centerImageYValues) {
    for (const centerImageX of options.centerImageXValues) {
      for (const visualScaleInput of options.visualScaleInputValues) {
        plans.push({
          sampleIndex: plans.length,
          knownPlacement: createKnownPlacement({
            centerImageX,
            centerImageY,
            visualScaleInput,
            options,
          }),
        })
      }
    }
  }
  return plans
}

function createKnownPlacement(input: {
  centerImageX: number
  centerImageY: number
  visualScaleInput: number
  options: PlacementFunctionAnalysisRunOptions
}): KnownPlacement {
  return {
    centerImageX: input.centerImageX,
    centerImageY: input.centerImageY,
    centerWorkX: input.centerImageX * input.options.renderAspectRatio,
    centerWorkY: input.centerImageY,
    visualScaleInput: input.visualScaleInput,
    renderAspectRatio: input.options.renderAspectRatio,
    canvasWidth: input.options.canvasWidth,
    canvasHeight: input.options.canvasHeight,
  }
}

function createPlacementAnalysisClipTransform(knownPlacement: KnownPlacement): WebglClipPlacementTransform {
  return {
    scaleX: knownPlacement.visualScaleInput,
    scaleY: knownPlacement.visualScaleInput,
    translateX: knownPlacement.centerImageX * 2 - 1,
    translateY: 1 - knownPlacement.centerImageY * 2,
  }
}

function runPlacementFunctionAnalysisSample(input: {
  detector: FaceLandmarker
  renderer: WebglObjRenderer
  appearance: AppliedObjRenderAppearanceProfile
  sampleIndex: number
  knownPlacement: KnownPlacement
  requestedPoseP: ObjPoseMappingPose
}): PlacementFunctionAnalysisSampleState {
  const capturedAtMs = Date.now()
  const sampleId = `placement_analysis_${capturedAtMs}_${input.sampleIndex}`
  try {
    const renderResult = renderWebglObjToCanvas(input.renderer, {
      renderSettings: {
        detectCanvasWidth: input.knownPlacement.canvasWidth,
        detectCanvasHeight: input.knownPlacement.canvasHeight,
      },
      appearance: input.appearance,
      p: input.requestedPoseP,
      rotationCenter: getObjPoseSyncRotationCenter(),
      clipPlacementTransform: createPlacementAnalysisClipTransform(input.knownPlacement),
    })
    const result = input.detector.detect(input.renderer.canvas)
    return buildPlacementFunctionAnalysisSample({
      sampleId,
      sampleIndex: input.sampleIndex,
      capturedAtMs,
      knownPlacement: input.knownPlacement,
      requestedPoseP: input.requestedPoseP,
      renderResult,
      result,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    state.placementAnalysis.latestError = message
    return createPlacementFunctionAnalysisFailureSample({
      sampleId,
      sampleIndex: input.sampleIndex,
      capturedAtMs,
      knownPlacement: input.knownPlacement,
      requestedPoseP: input.requestedPoseP,
      skippedReason: "detect_error",
    })
  }
}

function buildPlacementFunctionAnalysisSample(input: {
  sampleId: string
  sampleIndex: number
  capturedAtMs: number
  knownPlacement: KnownPlacement
  requestedPoseP: ObjPoseMappingPose
  renderResult: WebglObjRenderResult
  result: FaceLandmarkerResultLike
}): PlacementFunctionAnalysisSampleState {
  const landmarks = input.result.faceLandmarks[0] ?? []
  const returnedLandmarks = mapLandmarks(landmarks)
  const matrix = summarizeFaceMatrix(input.result.facialTransformationMatrixes[0])
  const returnedPose = matrix?.rotationDeg ?? estimateNullablePose(input.result.facialTransformationMatrixes[0])
  const poseDiff = calculatePoseMappingPoseDiff(input.requestedPoseP, returnedPose)
  const renderPoseValid = isFinitePose(input.renderResult.actualRenderPoseP)
  const renderPoseAppliedToWebGL =
    renderPoseValid &&
    poseMappingPosesApproximatelyEqual(input.renderResult.actualRenderPoseP, input.requestedPoseP)
  const facialTransformationMatrix = buildPlacementFunctionMatrixSummary(matrix)
  const matrixFeatures = buildPlacementFunctionMatrixFeatures(matrix)
  const detected = input.result.faceLandmarks.length > 0
  const observedRenderedBounds = calculatePlacementFunctionObservedBounds(
    returnedLandmarks,
    input.knownPlacement.renderAspectRatio,
  )
  const basePlacement = createPlacementFunctionBasePlacement(
    input.knownPlacement,
    input.renderResult.buffer.baseProjectedBounds ?? null,
  )
  const targetPlacement = createPlacementFunctionTargetPlacement(input.knownPlacement, basePlacement)
  const knownTransform = createPlacementFunctionKnownTransform(basePlacement, targetPlacement)
  const skippedReason = getPlacementFunctionAnalysisSkippedReason({
    detected,
    returnedLandmarkCount: landmarks.length,
    matrixAvailable: facialTransformationMatrix.available,
    matrixFeatures,
    knownPlacement: input.knownPlacement,
    basePlacement,
    targetPlacement,
    knownTransform,
    renderPoseAppliedToWebGL,
    renderPoseValid,
  })

  return {
    schemaVersion: "ideal_obj_render_warp_placement_function_sample_v1",
    sampleId: input.sampleId,
    sampleIndex: input.sampleIndex,
    capturedAtMs: input.capturedAtMs,
    knownPlacement: roundKnownPlacement(input.knownPlacement),
    basePlacement: roundPlacementFunctionPlacement(basePlacement),
    targetPlacement: roundPlacementFunctionPlacement(targetPlacement),
    knownTransform: roundPlacementFunctionKnownTransform(knownTransform),
    requestedPoseP: cloneObjPoseMappingPose(input.requestedPoseP),
    renderPoseDebug: {
      renderPoseAppliedToWebGL,
      renderPoseValid,
      actualRenderPoseP: roundPoseMappingPose(input.renderResult.actualRenderPoseP),
    },
    mediaPipeResult: {
      detected,
      returnedLandmarkCount: landmarks.length,
      returnedPose: hasFullPose(returnedPose)
        ? {
            yaw: returnedPose.yaw!,
            pitch: returnedPose.pitch!,
            roll: returnedPose.roll!,
          }
        : null,
      poseDiffMagnitude: poseDiff.magnitude,
    },
    facialTransformationMatrix,
    matrixFeatures: roundPlacementFunctionMatrixFeatures(matrixFeatures),
    observedRenderedBounds,
    preview: {
      hasSnapshot: true,
    },
    quality: skippedReason
      ? {
          usable: false,
          skippedReason,
        }
      : {
          usable: true,
        },
    previewLandmarks478: returnedLandmarks.length > 0 ? returnedLandmarks : null,
  }
}

function createPlacementFunctionAnalysisFailureSample(input: {
  sampleId: string
  sampleIndex: number
  capturedAtMs: number
  knownPlacement: KnownPlacement
  requestedPoseP: ObjPoseMappingPose
  skippedReason: PlacementFunctionAnalysisSkippedReason
}): PlacementFunctionAnalysisSampleState {
  const basePlacement = createPlacementFunctionBasePlacement(input.knownPlacement, null)
  const targetPlacement = createPlacementFunctionTargetPlacement(input.knownPlacement, basePlacement)
  const knownTransform = createPlacementFunctionKnownTransform(basePlacement, targetPlacement)
  return {
    schemaVersion: "ideal_obj_render_warp_placement_function_sample_v1",
    sampleId: input.sampleId,
    sampleIndex: input.sampleIndex,
    capturedAtMs: input.capturedAtMs,
    knownPlacement: roundKnownPlacement(input.knownPlacement),
    basePlacement: roundPlacementFunctionPlacement(basePlacement),
    targetPlacement: roundPlacementFunctionPlacement(targetPlacement),
    knownTransform: roundPlacementFunctionKnownTransform(knownTransform),
    requestedPoseP: cloneObjPoseMappingPose(input.requestedPoseP),
    renderPoseDebug: {
      renderPoseAppliedToWebGL: false,
      renderPoseValid: false,
      actualRenderPoseP: null,
    },
    mediaPipeResult: {
      detected: false,
      returnedLandmarkCount: 0,
      returnedPose: null,
      poseDiffMagnitude: null,
    },
    facialTransformationMatrix: {
      available: false,
    },
    matrixFeatures: createEmptyPlacementFunctionMatrixFeatures(),
    observedRenderedBounds: null,
    preview: {
      hasSnapshot: false,
    },
    quality: {
      usable: false,
      skippedReason: input.skippedReason,
    },
    previewLandmarks478: null,
  }
}

function appendPlacementFunctionAnalysisSample(sample: PlacementFunctionAnalysisSampleState) {
  const samples = [...state.placementAnalysis.samples, sample]
  const candidateResult = buildPlacementFunctionCandidate(samples)
  state.placementAnalysis = {
    ...state.placementAnalysis,
    samples,
    selectedSampleIndex: sample.sampleIndex,
    summary: createPlacementFunctionAnalysisSummary(samples),
    candidate: candidateResult.candidate,
    candidateUnavailableReason: candidateResult.reason,
  }
}

function buildPlacementFunctionMatrixSummary(
  matrix: MatrixDebugSummary | null,
): PlacementFunctionAnalysisSample["facialTransformationMatrix"] {
  const raw16 = matrix?.raw.values?.slice(0, 16)
  return {
    available: Boolean(matrix?.raw.exists && raw16?.length === 16),
    rows: matrix?.raw.rows ?? undefined,
    columns: matrix?.raw.columns ?? undefined,
    raw16: raw16?.length === 16 ? raw16.map((value) => roundForState(value) ?? 0) : undefined,
    columnMajor: matrix?.columnMajor.translation && matrix.columnMajor.scale
      ? matrixPlacementCandidateToAnalysisSummary(matrix.columnMajor)
      : undefined,
    rowMajor: matrix?.rowMajor.translation && matrix.rowMajor.scale
      ? matrixPlacementCandidateToAnalysisSummary(matrix.rowMajor)
      : undefined,
  }
}

function matrixPlacementCandidateToAnalysisSummary(
  candidate: MatrixPlacementCandidate,
): PlacementFunctionMatrixMajorSummary {
  return {
    tx: roundForState(candidate.translation?.x ?? null) ?? 0,
    ty: roundForState(candidate.translation?.y ?? null) ?? 0,
    tz: roundForState(candidate.translation?.z ?? null) ?? 0,
    scaleX: roundForState(candidate.scale?.x ?? null) ?? 0,
    scaleY: roundForState(candidate.scale?.y ?? null) ?? 0,
    scaleZ: roundForState(candidate.scale?.z ?? null) ?? 0,
    uniformScale: roundForState(candidate.scale?.uniform ?? null) ?? 0,
  }
}

function buildPlacementFunctionMatrixFeatures(matrix: MatrixDebugSummary | null): PlacementFunctionMatrixFeatures {
  const translation = matrix?.columnMajor.translation ?? null
  const scale = matrix?.columnMajor.scale ?? null
  const tx = translation?.x ?? null
  const ty = translation?.y ?? null
  const tz = translation?.z ?? null
  const negTz = tz !== null && Number.isFinite(tz) ? -tz : null
  const invNegTz = negTz !== null && Math.abs(negTz) > 1e-12 ? 1 / negTz : null
  return {
    tx,
    ty,
    tz,
    negTz,
    invNegTz,
    txOverNegTz: tx !== null && negTz !== null && Math.abs(negTz) > 1e-12 ? tx / negTz : null,
    tyOverNegTz: ty !== null && negTz !== null && Math.abs(negTz) > 1e-12 ? ty / negTz : null,
    matrixUniformScale: scale?.uniform ?? null,
  }
}

function createEmptyPlacementFunctionMatrixFeatures(): PlacementFunctionMatrixFeatures {
  return {
    tx: null,
    ty: null,
    tz: null,
    negTz: null,
    invNegTz: null,
    txOverNegTz: null,
    tyOverNegTz: null,
    matrixUniformScale: null,
  }
}

function roundKnownPlacement(knownPlacement: KnownPlacement): KnownPlacement {
  return {
    centerImageX: roundForState(knownPlacement.centerImageX) ?? 0,
    centerImageY: roundForState(knownPlacement.centerImageY) ?? 0,
    centerWorkX: roundForState(knownPlacement.centerWorkX) ?? 0,
    centerWorkY: roundForState(knownPlacement.centerWorkY) ?? 0,
    visualScaleInput: roundForState(knownPlacement.visualScaleInput) ?? 0,
    renderAspectRatio: roundForState(knownPlacement.renderAspectRatio) ?? 0,
    canvasWidth: knownPlacement.canvasWidth,
    canvasHeight: knownPlacement.canvasHeight,
  }
}

function createPlacementFunctionBasePlacement(
  knownPlacement: KnownPlacement,
  baseProjectedBounds: WebglProjectedImageBounds | null,
): BasePlacement {
  if (baseProjectedBounds && isFinitePlacementFunctionPlacement(baseProjectedBounds)) {
    return baseProjectedBounds
  }
  const renderAspectRatio = knownPlacement.renderAspectRatio
  const widthWork = 1
  const heightWork = 1
  const widthImage = renderAspectRatio > 0 ? widthWork / renderAspectRatio : 1
  return {
    centerImageX: 0.5,
    centerImageY: 0.5,
    centerWorkX: 0.5 * renderAspectRatio,
    centerWorkY: 0.5,
    widthImage,
    heightImage: heightWork,
    widthWork,
    heightWork,
    diagWork: Math.hypot(widthWork, heightWork),
    renderAspectRatio,
    canvasWidth: knownPlacement.canvasWidth,
    canvasHeight: knownPlacement.canvasHeight,
  }
}

function createPlacementFunctionTargetPlacement(
  knownPlacement: KnownPlacement,
  basePlacement: BasePlacement,
): TargetPlacement {
  const scaleRatio = knownPlacement.visualScaleInput
  const widthWork = basePlacement.widthWork * scaleRatio
  const heightWork = basePlacement.heightWork * scaleRatio
  const widthImage = knownPlacement.renderAspectRatio > 0 ? widthWork / knownPlacement.renderAspectRatio : 0
  return {
    centerImageX: knownPlacement.centerImageX,
    centerImageY: knownPlacement.centerImageY,
    centerWorkX: knownPlacement.centerWorkX,
    centerWorkY: knownPlacement.centerWorkY,
    widthImage,
    heightImage: heightWork,
    widthWork,
    heightWork,
    diagWork: Math.hypot(widthWork, heightWork),
    renderAspectRatio: knownPlacement.renderAspectRatio,
    canvasWidth: knownPlacement.canvasWidth,
    canvasHeight: knownPlacement.canvasHeight,
  }
}

function createPlacementFunctionKnownTransform(
  basePlacement: BasePlacement,
  targetPlacement: TargetPlacement,
): KnownTransform {
  const scaleRatio = basePlacement.widthWork > 1e-12
    ? targetPlacement.widthWork / basePlacement.widthWork
    : 0
  return {
    transformOrder: "scale_then_translate",
    coordinateSpace: "aspect_corrected_work_coordinate",
    scaleBasis: "width",
    scaleRatio,
    translateAfterScaleWorkX: targetPlacement.centerWorkX - basePlacement.centerWorkX * scaleRatio,
    translateAfterScaleWorkY: targetPlacement.centerWorkY - basePlacement.centerWorkY * scaleRatio,
  }
}

function roundPlacementFunctionPlacement<T extends WebglProjectedImageBounds>(placement: T): T {
  return {
    centerImageX: roundForState(placement.centerImageX) ?? 0,
    centerImageY: roundForState(placement.centerImageY) ?? 0,
    centerWorkX: roundForState(placement.centerWorkX) ?? 0,
    centerWorkY: roundForState(placement.centerWorkY) ?? 0,
    widthImage: roundForState(placement.widthImage) ?? 0,
    heightImage: roundForState(placement.heightImage) ?? 0,
    widthWork: roundForState(placement.widthWork) ?? 0,
    heightWork: roundForState(placement.heightWork) ?? 0,
    diagWork: roundForState(placement.diagWork) ?? 0,
    renderAspectRatio: roundForState(placement.renderAspectRatio) ?? 0,
    canvasWidth: placement.canvasWidth,
    canvasHeight: placement.canvasHeight,
  } as T
}

function roundPlacementFunctionKnownTransform(transform: KnownTransform): KnownTransform {
  return {
    transformOrder: transform.transformOrder,
    coordinateSpace: transform.coordinateSpace,
    scaleBasis: transform.scaleBasis,
    scaleRatio: roundForState(transform.scaleRatio) ?? 0,
    translateAfterScaleWorkX: roundForState(transform.translateAfterScaleWorkX) ?? 0,
    translateAfterScaleWorkY: roundForState(transform.translateAfterScaleWorkY) ?? 0,
  }
}

function roundPlacementFunctionMatrixFeatures(
  features: PlacementFunctionMatrixFeatures,
): PlacementFunctionMatrixFeatures {
  return {
    tx: roundForState(features.tx),
    ty: roundForState(features.ty),
    tz: roundForState(features.tz),
    negTz: roundForState(features.negTz),
    invNegTz: roundForState(features.invNegTz),
    txOverNegTz: roundForState(features.txOverNegTz),
    tyOverNegTz: roundForState(features.tyOverNegTz),
    matrixUniformScale: roundForState(features.matrixUniformScale),
  }
}

function isFiniteKnownPlacement(knownPlacement: KnownPlacement) {
  return [
    knownPlacement.centerImageX,
    knownPlacement.centerImageY,
    knownPlacement.centerWorkX,
    knownPlacement.centerWorkY,
    knownPlacement.visualScaleInput,
    knownPlacement.renderAspectRatio,
    knownPlacement.canvasWidth,
    knownPlacement.canvasHeight,
  ].every((value) => Number.isFinite(value))
}

function isFinitePlacementFunctionPlacement(placement: WebglProjectedImageBounds) {
  return [
    placement.centerImageX,
    placement.centerImageY,
    placement.centerWorkX,
    placement.centerWorkY,
    placement.widthImage,
    placement.heightImage,
    placement.widthWork,
    placement.heightWork,
    placement.diagWork,
    placement.renderAspectRatio,
    placement.canvasWidth,
    placement.canvasHeight,
  ].every((value) => Number.isFinite(value))
}

function isFinitePlacementFunctionKnownTransform(transform: KnownTransform) {
  return [
    transform.scaleRatio,
    transform.translateAfterScaleWorkX,
    transform.translateAfterScaleWorkY,
  ].every((value) => Number.isFinite(value))
}

function getPlacementFunctionAnalysisSkippedReason(input: {
  detected: boolean
  returnedLandmarkCount: number
  matrixAvailable: boolean
  matrixFeatures: PlacementFunctionMatrixFeatures
  knownPlacement: KnownPlacement
  basePlacement: BasePlacement
  targetPlacement: TargetPlacement
  knownTransform: KnownTransform
  renderPoseAppliedToWebGL: boolean
  renderPoseValid: boolean
}): PlacementFunctionAnalysisSkippedReason | null {
  if (!input.detected) {
    return "no_face"
  }
  if (input.returnedLandmarkCount < 468) {
    return "invalid_landmarks"
  }
  if (!input.matrixAvailable) {
    return "missing_matrix"
  }
  if (
    input.matrixFeatures.tx === null ||
    input.matrixFeatures.ty === null ||
    input.matrixFeatures.tz === null ||
    !Number.isFinite(input.matrixFeatures.tx) ||
    !Number.isFinite(input.matrixFeatures.ty) ||
    !Number.isFinite(input.matrixFeatures.tz)
  ) {
    return "invalid_matrix_values"
  }
  if (
    !isFiniteKnownPlacement(input.knownPlacement) ||
    !isFinitePlacementFunctionPlacement(input.basePlacement) ||
    !isFinitePlacementFunctionPlacement(input.targetPlacement) ||
    !isFinitePlacementFunctionKnownTransform(input.knownTransform)
  ) {
    return "invalid_matrix_values"
  }
  if (!input.renderPoseAppliedToWebGL) {
    return "render_pose_not_applied"
  }
  if (!input.renderPoseValid) {
    return "render_pose_invalid"
  }
  return null
}

function calculatePlacementFunctionObservedBounds(
  landmarks: ReferenceLandmark[],
  renderAspectRatio: number,
): PlacementFunctionObservedBounds | null {
  const bounds = calculateLandmarkBounds(landmarks)
  if (!bounds) {
    return null
  }
  const centerImageX = bounds.minX + bounds.width / 2
  const centerImageY = bounds.minY + bounds.height / 2
  return {
    centerImageX: roundForState(centerImageX) ?? 0,
    centerImageY: roundForState(centerImageY) ?? 0,
    centerWorkX: roundForState(centerImageX * renderAspectRatio) ?? 0,
    centerWorkY: roundForState(centerImageY) ?? 0,
    scaleDiag: roundForState(Math.hypot(bounds.width * renderAspectRatio, bounds.height)) ?? 0,
    scaleHeight: roundForState(bounds.height) ?? 0,
    scaleWidth: roundForState(bounds.width * renderAspectRatio) ?? 0,
  }
}

function createPlacementFunctionAnalysisSummary(
  samples: PlacementFunctionAnalysisSampleState[],
): PlacementFunctionAnalysisSummary {
  return {
    sampleCount: samples.length,
    usableSampleCount: samples.filter((sample) => sample.quality.usable).length,
    detectedCount: samples.filter((sample) => sample.mediaPipeResult.detected).length,
    matrixAvailableCount: samples.filter((sample) => sample.facialTransformationMatrix.available).length,
    failedCount: samples.filter((sample) => !sample.quality.usable).length,
    featureRanges: {
      tx: calculatePlacementAnalysisRange(samples.map((sample) => sample.matrixFeatures.tx)),
      ty: calculatePlacementAnalysisRange(samples.map((sample) => sample.matrixFeatures.ty)),
      tz: calculatePlacementAnalysisRange(samples.map((sample) => sample.matrixFeatures.tz)),
      txOverNegTz: calculatePlacementAnalysisRange(samples.map((sample) => sample.matrixFeatures.txOverNegTz)),
      tyOverNegTz: calculatePlacementAnalysisRange(samples.map((sample) => sample.matrixFeatures.tyOverNegTz)),
      invNegTz: calculatePlacementAnalysisRange(samples.map((sample) => sample.matrixFeatures.invNegTz)),
    },
    knownPlacementRanges: {
      centerWorkX: calculatePlacementAnalysisRange(samples.map((sample) => sample.knownPlacement.centerWorkX)),
      centerWorkY: calculatePlacementAnalysisRange(samples.map((sample) => sample.knownPlacement.centerWorkY)),
      visualScaleInput: calculatePlacementAnalysisRange(samples.map((sample) => sample.knownPlacement.visualScaleInput)),
    },
    scaleDetectionSummary: buildPlacementFunctionScaleDetectionSummary(samples),
    skippedReasonCounts: buildPlacementFunctionSkippedReasonCounts(samples),
    transformSummary: buildPlacementFunctionTransformSummary(samples),
  }
}

function calculatePlacementAnalysisRange(values: Array<number | null | undefined>): PlacementFunctionAnalysisRange | null {
  const finiteValues = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value))
  if (finiteValues.length === 0) {
    return null
  }
  return {
    min: roundForState(Math.min(...finiteValues)) ?? 0,
    max: roundForState(Math.max(...finiteValues)) ?? 0,
  }
}

function buildPlacementFunctionScaleDetectionSummary(
  samples: PlacementFunctionAnalysisSampleState[],
): PlacementFunctionScaleDetectionSummary[] {
  const byScale = new Map<string, PlacementFunctionScaleDetectionSummary>()
  for (const sample of samples) {
    const visualScaleInput = sample.knownPlacement.visualScaleInput
    const key = formatPlacementScaleKey(visualScaleInput)
    const current = byScale.get(key) ?? {
      visualScaleInput,
      sampleCount: 0,
      detectedCount: 0,
      usableCount: 0,
      noFaceCount: 0,
      failedCount: 0,
    }
    current.sampleCount += 1
    current.detectedCount += sample.mediaPipeResult.detected ? 1 : 0
    current.usableCount += sample.quality.usable ? 1 : 0
    current.noFaceCount += sample.quality.skippedReason === "no_face" ? 1 : 0
    current.failedCount += sample.quality.usable ? 0 : 1
    byScale.set(key, current)
  }
  return Array.from(byScale.values())
    .map((item) => ({
      ...item,
      visualScaleInput: roundForState(item.visualScaleInput) ?? item.visualScaleInput,
    }))
    .sort((a, b) => a.visualScaleInput - b.visualScaleInput)
}

function buildPlacementFunctionSkippedReasonCounts(
  samples: PlacementFunctionAnalysisSampleState[],
): Record<string, number> {
  const counts: Record<string, number> = Object.fromEntries(
    PLACEMENT_ANALYSIS_SKIPPED_REASONS.map((reason) => [reason, 0]),
  )
  for (const sample of samples) {
    const reason = sample.quality.skippedReason
    if (!reason) {
      continue
    }
    counts[reason] = (counts[reason] ?? 0) + 1
  }
  return counts
}

function buildPlacementFunctionTransformSummary(
  samples: PlacementFunctionAnalysisSampleState[],
): PlacementFunctionTransformSummary | null {
  const scaleRatioRange = calculatePlacementAnalysisRange(
    samples.map((sample) => sample.knownTransform.scaleRatio),
  )
  const translateXRange = calculatePlacementAnalysisRange(
    samples.map((sample) => sample.knownTransform.translateAfterScaleWorkX),
  )
  const translateYRange = calculatePlacementAnalysisRange(
    samples.map((sample) => sample.knownTransform.translateAfterScaleWorkY),
  )
  if (!scaleRatioRange || !translateXRange || !translateYRange) {
    return null
  }
  return {
    transformOrder: "scale_then_translate",
    scaleBasis: "width",
    scaleRatioMin: scaleRatioRange.min,
    scaleRatioMax: scaleRatioRange.max,
    translateAfterScaleWorkXMin: translateXRange.min,
    translateAfterScaleWorkXMax: translateXRange.max,
    translateAfterScaleWorkYMin: translateYRange.min,
    translateAfterScaleWorkYMax: translateYRange.max,
  }
}

function formatPlacementScaleKey(value: number) {
  return Number.isFinite(value) ? Number(value.toFixed(6)).toString() : "invalid"
}

function buildPlacementFunctionCandidate(samples: PlacementFunctionAnalysisSampleState[]): {
  candidate: PlacementFunctionCandidate | null
  reason: string | null
} {
  const usableSamples = samples.filter((sample) => sample.quality.usable)
  if (usableSamples.length < 2) {
    return { candidate: null, reason: "usable sample count too small" }
  }
  const scaleRatioModel = fitSimpleLinearModel(
    usableSamples.map((sample) => ({
      x: sample.matrixFeatures.invNegTz,
      y: sample.knownTransform.scaleRatio,
    })),
  )
  const translateAfterScaleWorkXModel = fitSimpleLinearModel(
    usableSamples.map((sample) => ({
      x: sample.matrixFeatures.txOverNegTz,
      y: sample.knownTransform.translateAfterScaleWorkX,
    })),
  )
  const translateAfterScaleWorkYModel = fitSimpleLinearModel(
    usableSamples.map((sample) => ({
      x: sample.matrixFeatures.tyOverNegTz,
      y: sample.knownTransform.translateAfterScaleWorkY,
    })),
  )
  if (!scaleRatioModel || !translateAfterScaleWorkXModel || !translateAfterScaleWorkYModel) {
    return { candidate: null, reason: "singular matrix" }
  }
  const metrics = calculatePlacementFunctionCandidateMetrics(
    usableSamples,
    scaleRatioModel,
    translateAfterScaleWorkXModel,
    translateAfterScaleWorkYModel,
  )
  return {
    reason: null,
    candidate: {
      schemaVersion: "matrix_to_known_transform_function_candidate_v1",
      createdAt: new Date().toISOString(),
      source: {
        tool: "ideal-obj-render-warp-lab",
        sampleCount: samples.length,
        usableSampleCount: usableSamples.length,
      },
      targetCoordinateSpace: "aspect_corrected_work_coordinate",
      transformOrder: "scale_then_translate",
      scaleBasis: "width",
      modelType: "linear_v1",
      features: {
        scaleRatio: ["intercept", "invNegTz"],
        translateAfterScaleWorkX: ["intercept", "txOverNegTz"],
        translateAfterScaleWorkY: ["intercept", "tyOverNegTz"],
      },
      models: {
        scaleRatio: {
          intercept: roundForState(scaleRatioModel.intercept) ?? 0,
          coefficients: {
            invNegTz: roundForState(scaleRatioModel.slope) ?? 0,
          },
        },
        translateAfterScaleWorkX: {
          intercept: roundForState(translateAfterScaleWorkXModel.intercept) ?? 0,
          coefficients: {
            txOverNegTz: roundForState(translateAfterScaleWorkXModel.slope) ?? 0,
          },
        },
        translateAfterScaleWorkY: {
          intercept: roundForState(translateAfterScaleWorkYModel.intercept) ?? 0,
          coefficients: {
            tyOverNegTz: roundForState(translateAfterScaleWorkYModel.slope) ?? 0,
          },
        },
      },
      metrics,
      trainingDataSummary: buildPlacementFunctionCandidateTrainingDataSummary(usableSamples),
    },
  }
}

function buildPlacementFunctionCandidateTrainingDataSummary(
  samples: PlacementFunctionAnalysisSampleState[],
): PlacementFunctionCandidate["trainingDataSummary"] {
  const sampleCountByScaleRatio: Record<string, number> = {}
  for (const sample of samples) {
    const key = formatPlacementScaleKey(sample.knownTransform.scaleRatio)
    sampleCountByScaleRatio[key] = (sampleCountByScaleRatio[key] ?? 0) + 1
  }
  const scaleRatioValues = Object.keys(sampleCountByScaleRatio)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b)
    .map((value) => roundForState(value) ?? value)
  return {
    scaleBasis: "width",
    transformOrder: "scale_then_translate",
    scaleRatioRange: scaleRatioValues.length > 0
      ? [
          scaleRatioValues[0],
          scaleRatioValues[scaleRatioValues.length - 1],
        ]
      : null,
    scaleRatioValues,
    sampleCountByScaleRatio,
  }
}

function fitSimpleLinearModel(points: Array<{ x: number | null; y: number | null }>) {
  const validPoints = points.filter(
    (point): point is { x: number; y: number } =>
      point.x !== null &&
      point.y !== null &&
      Number.isFinite(point.x) &&
      Number.isFinite(point.y),
  )
  if (validPoints.length < 2) {
    return null
  }
  const meanX = validPoints.reduce((sum, point) => sum + point.x, 0) / validPoints.length
  const meanY = validPoints.reduce((sum, point) => sum + point.y, 0) / validPoints.length
  const denominator = validPoints.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0)
  if (!Number.isFinite(denominator) || denominator <= 1e-12) {
    return null
  }
  const numerator = validPoints.reduce((sum, point) => sum + (point.x - meanX) * (point.y - meanY), 0)
  const slope = numerator / denominator
  const intercept = meanY - slope * meanX
  return Number.isFinite(intercept) && Number.isFinite(slope) ? { intercept, slope } : null
}

function calculatePlacementFunctionCandidateMetrics(
  samples: PlacementFunctionAnalysisSampleState[],
  scaleRatioModel: { intercept: number; slope: number },
  translateAfterScaleWorkXModel: { intercept: number; slope: number },
  translateAfterScaleWorkYModel: { intercept: number; slope: number },
): PlacementFunctionCandidate["metrics"] {
  const scaleErrors: number[] = []
  const translateErrors: number[] = []
  for (const sample of samples) {
    const predictedScaleRatio = predictSimpleLinearModel(scaleRatioModel, sample.matrixFeatures.invNegTz)
    const predictedTranslateX = predictSimpleLinearModel(
      translateAfterScaleWorkXModel,
      sample.matrixFeatures.txOverNegTz,
    )
    const predictedTranslateY = predictSimpleLinearModel(
      translateAfterScaleWorkYModel,
      sample.matrixFeatures.tyOverNegTz,
    )
    if (predictedScaleRatio !== null) {
      scaleErrors.push(Math.abs(predictedScaleRatio - sample.knownTransform.scaleRatio))
    }
    if (predictedTranslateX !== null && predictedTranslateY !== null) {
      translateErrors.push(Math.hypot(
        predictedTranslateX - sample.knownTransform.translateAfterScaleWorkX,
        predictedTranslateY - sample.knownTransform.translateAfterScaleWorkY,
      ))
    }
  }
  return {
    maeScaleRatio: roundForState(averageFiniteNumbers(scaleErrors) ?? 0) ?? 0,
    maxScaleRatio: roundForState(maxNumbers(scaleErrors) ?? 0) ?? 0,
    maeTranslateAfterScaleWork: roundForState(averageFiniteNumbers(translateErrors) ?? 0) ?? 0,
    maxTranslateAfterScaleWork: roundForState(maxNumbers(translateErrors) ?? 0) ?? 0,
  }
}

function predictSimpleLinearModel(model: { intercept: number; slope: number }, value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return null
  }
  return model.intercept + model.slope * value
}

function averageFiniteNumbers(values: number[]) {
  const finiteValues = values.filter((value) => Number.isFinite(value))
  if (finiteValues.length === 0) {
    return null
  }
  return finiteValues.reduce((sum, value) => sum + value, 0) / finiteValues.length
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
    const renderer = getOrCreateWebglObjBenchmarkRenderer()
    const appearance = getAppliedObjRenderAppearanceProfile()
    resizeWebglObjBenchmarkRenderer(renderer, appearance.renderResolution.width, appearance.renderResolution.height)
    for (const [index, pose] of poses.entries()) {
      const result = evaluateObjPoseCalibrationCandidateOnPose(detector, renderSettings, pose, renderer, appearance)
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
  const renderer = getOrCreateWebglObjBenchmarkRenderer()
  const appearance = getAppliedObjRenderAppearanceProfile()
  resizeWebglObjBenchmarkRenderer(renderer, appearance.renderResolution.width, appearance.renderResolution.height)
  const poseResults = OBJ_POSE_CALIBRATION_POSES.map((pose) =>
    evaluateObjPoseCalibrationCandidateOnPose(detector, candidatePoint, pose, renderer, appearance),
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
  renderer: WebglObjRenderer,
  appearance: AppliedObjRenderAppearanceProfile,
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
    resizeWebglObjBenchmarkRenderer(renderer, appearance.renderResolution.width, appearance.renderResolution.height)
    renderWebglObjToCanvas(renderer, {
      renderSettings: {
        detectCanvasWidth: appearance.renderResolution.width,
        detectCanvasHeight: appearance.renderResolution.height,
      },
      appearance,
      p: renderPose,
      rotationCenter: candidatePoint.rotationCenter,
    })

    const detectStartMs = performance.now()
    const result = detector.detect(renderer.canvas)
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
  const appliedAppearance = getAppliedWebglObjRenderAppearanceProfile()
  const renderer = getOrCreateWebglObjBenchmarkRenderer()
  resizeWebglObjBenchmarkRenderer(renderer, appliedAppearance.renderResolution.width, appliedAppearance.renderResolution.height)
  const rendererMetadata = buildWebglObjRendererMetadata(renderer, appliedAppearance)
  const sampleRenderer = createObjPoseMappingSampleRendererMetadata(rendererMetadata)

  return {
    schemaVersion: "obj_pose_mapping_dataset_v3",
    createdAt: new Date().toISOString(),
    renderBackend: "webgl",
    renderer: rendererMetadata,
    source: {
      objFileName: state.objFile.fileName,
      vertexCount: state.objFile.loaded ? state.objSummary.vertexCount : null,
      faceCount: state.objFile.loaded ? state.objSummary.faceCount : null,
    },
    renderSettings: {
      canvasWidth: appliedAppearance.renderResolution.width,
      canvasHeight: appliedAppearance.renderResolution.height,
      rotationCenter: { ...rotationCenter },
      notes: "rotationCenter is fixed render setting, not an estimated value",
    },
    renderAppearance: {
      profileId: appliedAppearance.id,
      profileLabel: appliedAppearance.label,
      applied: appliedAppearance,
      notAppliedRenderAppearanceFields: getWebglObjNotAppliedRenderAppearanceFields(appliedAppearance),
      notes: [
        appliedAppearance.description,
        appliedAppearance.notes ?? "",
        ...appliedAppearance.implementation.notes,
        "OBJ render backend is WebGL. Canvas2D is legacy baseline only for this dataset flow.",
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
      renderer: sampleRenderer,
    })),
    failedSamples: failedSamples.map((sample) => ({
      sampleId: sample.sampleId,
      poseId: sample.poseId,
      p: { ...sample.p },
      detected: false,
      detectMs: sample.detectMs,
      failureReason: sample.errorMessage ?? "unknown",
      renderer: sampleRenderer,
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

function summarizeFaceMatrix(matrix: Matrix | undefined): MatrixDebugSummary | null {
  if (!matrix) {
    return null
  }

  const raw = createMatrixRawDebug(matrix)
  const values = raw.values
  const candidates = values && values.length >= 16
    ? extractMatrixPlacementCandidates(values)
    : {
        columnMajor: createEmptyMatrixPlacementCandidate(),
        rowMajor: createEmptyMatrixPlacementCandidate(),
      }

  return {
    translation: candidates.rowMajor.translation,
    scale: candidates.rowMajor.scale,
    rotationDeg: estimateNullablePose(matrix),
    raw,
    columnMajor: candidates.columnMajor,
    rowMajor: candidates.rowMajor,
  }
}

function createMatrixRawDebug(matrix: Matrix | undefined): MatrixRawDebug {
  const rawData = matrix ? (matrix as { data?: unknown }).data : null
  const data = extractFiniteNumberArray(rawData)
  return {
    exists: Boolean(matrix),
    constructorName: matrix?.constructor?.name ?? null,
    isArray: Array.isArray(matrix),
    keys: matrix ? Object.keys(matrix as Record<string, unknown>) : [],
    data,
    values: data,
    rows: typeof matrix?.rows === "number" ? matrix.rows : null,
    columns: typeof matrix?.columns === "number" ? matrix.columns : null,
    rawObjectPreview: safePreview(matrix),
  }
}

function extractFiniteNumberArray(value: unknown): number[] | null {
  const rawValues = Array.isArray(value) || ArrayBuffer.isView(value)
    ? Array.from(value as ArrayLike<unknown>)
    : null
  if (!rawValues) {
    return null
  }
  const numbers = rawValues.map((item) => Number(item))
  return numbers.every(Number.isFinite) ? numbers : null
}

function extractMatrixPlacementCandidates(values: number[]) {
  const columnMajorScale = createMatrixScale(
    Math.hypot(values[0], values[1], values[2]),
    Math.hypot(values[4], values[5], values[6]),
    Math.hypot(values[8], values[9], values[10]),
  )
  const rowMajorScale = createMatrixScale(
    Math.hypot(values[0], values[4], values[8]),
    Math.hypot(values[1], values[5], values[9]),
    Math.hypot(values[2], values[6], values[10]),
  )
  return {
    columnMajor: {
      translation: createFinitePoint3(values[12], values[13], values[14]),
      scale: columnMajorScale,
    },
    rowMajor: {
      translation: createFinitePoint3(values[3], values[7], values[11]),
      scale: rowMajorScale,
    },
  }
}

function createEmptyMatrixPlacementCandidate(): MatrixPlacementCandidate {
  return {
    translation: null,
    scale: null,
  }
}

function createFinitePoint3(
  x: number | undefined,
  y: number | undefined,
  z: number | undefined,
): { x: number; y: number; z: number } | null {
  return [x, y, z].every((value) => Number.isFinite(value))
    ? { x: x!, y: y!, z: z! }
    : null
}

function createMatrixScale(
  x: number,
  y: number,
  z: number,
): { x: number; y: number; z: number; uniform: number } | null {
  const values = [x, y, z]
  return values.every((value) => Number.isFinite(value) && value > 0)
    ? {
        x,
        y,
        z,
        uniform: values.reduce((sum, value) => sum + value, 0) / values.length,
      }
    : null
}

function safePreview(value: unknown, maxLength = 600): string | null {
  if (value === null || value === undefined) {
    return null
  }
  try {
    const seen = new WeakSet<object>()
    const json = JSON.stringify(value, (_key, item: unknown) => {
      if (typeof item === "function") {
        return `[Function ${(item as Function).name || "anonymous"}]`
      }
      if (ArrayBuffer.isView(item)) {
        return Array.from(item as ArrayLike<unknown>).slice(0, 32)
      }
      if (item && typeof item === "object") {
        if (seen.has(item)) {
          return "[Circular]"
        }
        seen.add(item)
      }
      return item
    })
    if (!json) {
      return String(value)
    }
    return json.length > maxLength ? `${json.slice(0, maxLength)}...` : json
  } catch {
    return Object.prototype.toString.call(value)
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
  resetModeComparisonRuntimeDebugSamples()
  state.modeComparison = {
    ...createDefaultModeComparisonState(),
    debugOptions: state.modeComparison.debugOptions,
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

function resetModeComparisonRuntimeDebugSamples() {
  modeComparisonProcessing = false
  modeComparisonLastCallbackWallMs = null
  modeComparisonLastCallbackMediaTimeSec = null
  modeComparisonCallbackWallDeltaSamples = []
  modeComparisonMediaTimeDeltaSamples = []
  modeComparisonProcessingMeasuredSamples = []
  modeComparisonUnmeasuredOverheadSamples = []
}

function processModeComparisonFrame(
  runId: number,
  metadata: VideoFrameCallbackMetadataLike,
  imageLandmarker: FaceLandmarker,
  videoLandmarker: FaceLandmarker,
) {
  const callbackWallMs = performance.now()
  const mediaTimeSec = metadata.mediaTime
  const callbackWallDeltaMs =
    modeComparisonLastCallbackWallMs === null ? null : callbackWallMs - modeComparisonLastCallbackWallMs
  const mediaTimeDeltaMs =
    Number.isFinite(mediaTimeSec) && modeComparisonLastCallbackMediaTimeSec !== null
      ? (mediaTimeSec - modeComparisonLastCallbackMediaTimeSec) * 1000
      : null
  modeComparisonLastCallbackWallMs = callbackWallMs
  if (Number.isFinite(mediaTimeSec)) {
    modeComparisonLastCallbackMediaTimeSec = mediaTimeSec
  }
  recordModeComparisonDebugCallback(callbackWallDeltaMs, mediaTimeDeltaMs)

  if (runId !== modeComparisonRunId || state.modeComparison.status !== "running") {
    return
  }

  if (modeComparisonProcessing) {
    state.modeComparison = {
      ...state.modeComparison,
      debugCounters: {
        ...state.modeComparison.debugCounters,
        busySkipCount: state.modeComparison.debugCounters.busySkipCount + 1,
      },
    }
    registerModeComparisonFrameCallback(runId, imageLandmarker, videoLandmarker)
    return
  }

  if (modeComparisonFrames.length >= MODE_COMPARISON_MAX_FRAMES) {
    finishModeComparison("completed")
    return
  }

  if (!Number.isFinite(mediaTimeSec)) {
    state.modeComparison = {
      ...state.modeComparison,
      skippedFrameCount: state.modeComparison.skippedFrameCount + 1,
      debugCounters: {
        ...state.modeComparison.debugCounters,
        missingMediaTimeSkipCount: state.modeComparison.debugCounters.missingMediaTimeSkipCount + 1,
      },
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
      debugCounters: {
        ...state.modeComparison.debugCounters,
        timestampSkipCount: state.modeComparison.debugCounters.timestampSkipCount + 1,
      },
      lastMediaTimeSec: mediaTimeSec,
      errorMessage: "同一または巻き戻り timestamp のフレームを skip しました。",
    }
    renderModeComparisonControls()
    registerModeComparisonFrameCallback(runId, imageLandmarker, videoLandmarker)
    return
  }

  try {
    modeComparisonProcessing = true
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
    const unmeasuredOverheadEstimateMs =
      callbackWallDeltaMs === null ? null : callbackWallDeltaMs - totalFrameProcessingMs
    recordModeComparisonProcessingDebugSample(totalFrameProcessingMs, unmeasuredOverheadEstimateMs)

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
      callbackWallDeltaMs,
      mediaTimeDeltaMs,
      drawImageMs,
      imageDetectMs,
      videoDetectMs,
      totalFrameProcessingMs,
      unmeasuredOverheadEstimateMs,
      imageResult,
      videoResult,
    })
    modeComparisonFrames.push(frame)
    updateModeComparisonPreviewSnapshots(frame)

    const nextDebugCounters = buildModeComparisonDebugCounters()
    state.modeComparison = {
      ...state.modeComparison,
      progressFrameCount: shouldUpdateModeComparisonState(frame.frameIndex)
        ? modeComparisonFrames.length
        : state.modeComparison.progressFrameCount,
      lastTimestampMs: timestampMs,
      lastMediaTimeSec: mediaTimeSec,
      lastPresentedFrames: presentedFrames,
      debugCounters: nextDebugCounters,
      errorMessage: null,
    }

    if (shouldRenderModeComparisonControls(frame.frameIndex)) {
      renderModeComparisonControls()
    }
    if (state.activeDebugTab === "modeComparison" && shouldRenderModeComparisonSummary(frame.frameIndex)) {
      renderDebugContent()
    }

    if (modeComparisonFrames.length >= MODE_COMPARISON_MAX_FRAMES || liveVideoElement.ended) {
      finishModeComparison("completed")
      return
    }

    registerModeComparisonFrameCallback(runId, imageLandmarker, videoLandmarker)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    finishModeComparison("error", message)
  } finally {
    modeComparisonProcessing = false
  }
}

function buildModeComparisonFrameResult(input: {
  frameIndex: number
  mediaTimeSec: number
  timestampMs: number
  presentedFrames: number | null
  presentedFramesDelta: number | null
  callbackWallDeltaMs: number | null
  mediaTimeDeltaMs: number | null
  drawImageMs: number
  imageDetectMs: number
  videoDetectMs: number
  totalFrameProcessingMs: number
  unmeasuredOverheadEstimateMs: number | null
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
    callbackWallDeltaMs: input.callbackWallDeltaMs,
    mediaTimeDeltaMs: input.mediaTimeDeltaMs,
    drawImageMs: input.drawImageMs,
    imageDetectMs: input.imageDetectMs,
    videoDetectMs: input.videoDetectMs,
    totalFrameProcessingMs: input.totalFrameProcessingMs,
    processingMeasuredMs: input.totalFrameProcessingMs,
    unmeasuredOverheadEstimateMs: input.unmeasuredOverheadEstimateMs,
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

function recordModeComparisonDebugCallback(
  callbackWallDeltaMs: number | null,
  mediaTimeDeltaMs: number | null,
) {
  if (callbackWallDeltaMs !== null && Number.isFinite(callbackWallDeltaMs)) {
    modeComparisonCallbackWallDeltaSamples.push(callbackWallDeltaMs)
  }
  if (mediaTimeDeltaMs !== null && Number.isFinite(mediaTimeDeltaMs)) {
    modeComparisonMediaTimeDeltaSamples.push(mediaTimeDeltaMs)
  }
  state.modeComparison = {
    ...state.modeComparison,
    debugCounters: {
      ...state.modeComparison.debugCounters,
      rvfcCallbackCount: state.modeComparison.debugCounters.rvfcCallbackCount + 1,
      latestCallbackWallDeltaMs: callbackWallDeltaMs,
      latestMediaTimeDeltaMs: mediaTimeDeltaMs,
      callbackWallDeltaMs: summarizeNullableNumbers(modeComparisonCallbackWallDeltaSamples),
      mediaTimeDeltaMs: summarizeNullableNumbers(modeComparisonMediaTimeDeltaSamples),
    },
  }
}

function recordModeComparisonProcessingDebugSample(
  processingMeasuredMs: number,
  unmeasuredOverheadEstimateMs: number | null,
) {
  modeComparisonProcessingMeasuredSamples.push(processingMeasuredMs)
  if (unmeasuredOverheadEstimateMs !== null && Number.isFinite(unmeasuredOverheadEstimateMs)) {
    modeComparisonUnmeasuredOverheadSamples.push(unmeasuredOverheadEstimateMs)
  }
}

function buildModeComparisonDebugCounters(): ModeComparisonDebugCounters {
  return {
    ...state.modeComparison.debugCounters,
    processedFrameCount: modeComparisonFrames.length,
    presentedFramesDeltaSummary: summarizeNullableNumbers(
      modeComparisonFrames.map((frame) => frame.presentedFramesDelta),
    ),
    callbackWallDeltaMs: summarizeNullableNumbers(modeComparisonCallbackWallDeltaSamples),
    mediaTimeDeltaMs: summarizeNullableNumbers(modeComparisonMediaTimeDeltaSamples),
    processingMeasuredMs: summarizeNullableNumbers(modeComparisonProcessingMeasuredSamples),
    unmeasuredOverheadEstimateMs: summarizeNullableNumbers(modeComparisonUnmeasuredOverheadSamples),
    latestProcessingMeasuredMs: modeComparisonProcessingMeasuredSamples.at(-1) ?? null,
    latestUnmeasuredOverheadEstimateMs: modeComparisonUnmeasuredOverheadSamples.at(-1) ?? null,
    nextCallbackRegistrationTiming: "afterProcessing",
  }
}

function shouldUpdateModeComparisonState(frameIndex: number) {
  return frameIndex === 1 || frameIndex % state.modeComparison.debugOptions.uiUpdateIntervalFrames === 0
}

function shouldRenderModeComparisonControls(frameIndex: number) {
  return frameIndex === 1 || frameIndex % state.modeComparison.debugOptions.uiUpdateIntervalFrames === 0
}

function shouldRenderModeComparisonSummary(frameIndex: number) {
  return frameIndex === 1 || frameIndex % state.modeComparison.debugOptions.summaryUpdateIntervalFrames === 0
}

function updateModeComparisonPreviewSnapshots(frame: ModeComparisonFrameResult) {
  if (!state.modeComparison.debugOptions.previewSnapshotEnabled) {
    return
  }
  const nextSnapshots = {
    ...state.modeComparison.previewSnapshots,
  }
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
  updateLatestModeComparisonPreviewSnapshot()
  const result = buildModeComparisonExport(modeComparisonFrames, state.modeComparison.skippedFrameCount)
  state.modeComparison = {
    ...state.modeComparison,
    status,
    completedAt: new Date().toISOString(),
    progressFrameCount: modeComparisonFrames.length,
    debugCounters: buildModeComparisonDebugCounters(),
    errorMessage,
    result,
  }
  addLog(`モード比較を終了しました: ${formatModeComparisonStatus(status)} / processed ${modeComparisonFrames.length} / skipped ${state.modeComparison.skippedFrameCount}`)
  renderAll()
}

function updateLatestModeComparisonPreviewSnapshot() {
  if (!state.modeComparison.debugOptions.previewSnapshotEnabled) {
    return
  }
  const latestFrame = modeComparisonFrames[modeComparisonFrames.length - 1]
  if (!latestFrame) {
    return
  }
  state.modeComparison = {
    ...state.modeComparison,
    previewSnapshots: {
      ...state.modeComparison.previewSnapshots,
      latest: createModeComparisonPreviewSnapshot("latest", latestFrame),
    },
  }
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
    debugCounters: {
      ...buildModeComparisonDebugCounters(),
      processedFrameCount: frames.length,
      presentedFramesDeltaSummary: summarizeNullableNumbers(frames.map((frame) => frame.presentedFramesDelta)),
    },
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
      await updatePoseMappingRuntimeFromCurrentAnalysis({ skipFinalRender: true })
      objRenderMs = state.poseMappingRuntime.renderMs
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
      mediaPipeRedetectMs: state.poseMappingRuntime.detectMs,
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
    const totalMs = sumNullableTimings(
      currentAnalysisMs,
      state.realtimeDebug.mode === "current_analysis_obj_render"
        ? state.poseMappingRuntime.totalMs
        : objRenderMs,
    )
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

  const poseMappingStatus = getPoseMappingPreviewStatus()
  renderPoseMappingLiveSummaryCard()
  if (poseMappingStatus !== "ready" && !options.skipObjRender) {
    clearPoseMappingPreviewCanvas()
  }

  renderPlacementAnalysisPreviewPanel()
}

function renderControls() {
  const poseSearchRunning = isPoseCenterSearchRunning()

  setChecked("toggle-current-landmarks", state.overlay.showCurrentLandmarks478)
  setChecked("toggle-aligned-ideal-landmarks", state.overlay.showAlignedIdealLandmarks478)
  setChecked("toggle-mesh-source", state.overlay.showMeshSource)
  setChecked("toggle-mesh-target", state.overlay.showMeshTarget)
  setChecked("toggle-mesh-pairs", state.overlay.showMeshPairs)
  setChecked("toggle-excluded-landmarks", state.overlay.showExcludedLandmarks)
  setChecked("toggle-grid-anchors", state.overlay.showGridAnchors)
  setChecked("toggle-triangle-mesh", state.overlay.showTriangleMesh)
  setDisabled(
    '[data-action="toggle-mesh-source"]',
    state.currentAnalysis.landmarks478.length !== REQUIRED_LANDMARK_COUNT,
  )
  setDisabled(
    '[data-action="toggle-mesh-target"]',
    !state.poseMappingRuntime.meshTargetVertices ||
      state.poseMappingRuntime.meshTargetVertices.length !== REQUIRED_LANDMARK_COUNT,
  )
  setDisabled(
    '[data-action="toggle-grid-anchors"]',
    state.poseMappingRuntime.alignment.anchorCount <= 0,
  )
  setDisabled('[data-action="toggle-triangle-mesh"]', true)

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
  setDisabled('[data-action="load-pose-mapping-profile"]', poseSearchRunning || isObjPoseCalibrationRunning())
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
  getElement<HTMLSelectElement>('[data-control="pose-mapping-alignment-mode"]').value =
    state.poseMappingSettings.alignmentMode
  getElement<HTMLSelectElement>('[data-control="pose-mapping-placement-landmark-set"]').value =
    state.poseMappingSettings.placementLandmarkSet
  getElement<HTMLSelectElement>('[data-control="pose-mapping-bounds-scale-basis"]').value =
    state.poseMappingSettings.boundsScaleBasis
  getElement<HTMLInputElement>('[data-control="pose-mapping-hide-overlay-on-render-pose-not-applied"]').checked =
    state.poseMappingSettings.hideIdealOverlayWhenRenderPoseNotApplied
  objFileInput.disabled = poseSearchRunning
  poseMappingProfileFileInput.disabled = poseSearchRunning || isObjPoseCalibrationRunning()
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
  renderPoseMappingLiveSummaryCard()

  getElement<HTMLSelectElement>('[data-control="rendered-ideal-background"]').value = state.renderedIdeal.backgroundMode
  getElement<HTMLSelectElement>('[data-control="rendered-ideal-color"]').value = state.renderedIdeal.colorMode
  getElement<HTMLSelectElement>('[data-control="render-appearance-profile"]').value =
    state.renderedIdeal.renderAppearanceProfileId
  setDisabled('[data-action="rendered-ideal-refresh"]', poseSearchRunning || !canRenderRenderedIdealGeometry())

  renderLiveAnalysisCard()
  renderModeComparisonControls()
  getElement<HTMLSelectElement>('[data-control="obj-preview-mode"]').value = state.objPreview.mode
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

function renderPoseMappingLiveSummaryCard() {
  const card = getElement<HTMLElement>("[data-pose-mapping-live-summary]")
  const runtime = state.poseMappingRuntime
  card.innerHTML = `
    <p>${escapeHtml(getPoseMappingPreviewMessage())}</p>
    <dl class="review-grid">
      <div><dt>profile</dt><dd>${state.poseMappingProfile.loaded ? "loaded" : "not loaded"}</dd></div>
      <div><dt>currentFaceStatus</dt><dd>${escapeHtml(runtime.currentFaceStatus)}</dd></div>
      <div><dt>renderedIdealStatus</dt><dd>${escapeHtml(runtime.renderedIdealStatus)}</dd></div>
      <div><dt>alignmentStatus</dt><dd>${escapeHtml(runtime.alignmentStatus)}</dd></div>
      <div><dt>poseMappingStatus</dt><dd>${escapeHtml(runtime.poseMappingStatus)}</dd></div>
      <div><dt>poseMappingSkippedReason</dt><dd>${escapeHtml(runtime.poseMappingSkippedReason)}</dd></div>
      <div><dt>fallbackPoseUsed</dt><dd>${String(runtime.fallbackPoseUsed)}</dd></div>
      <div><dt>fallbackRenderedIdealUsed</dt><dd>${String(runtime.fallbackRenderedIdealUsed)}</dd></div>
      <div><dt>assetLifecycle</dt><dd>OBJ ${escapeHtml(runtime.assetLifecycle.objStatus)} / profile ${escapeHtml(runtime.assetLifecycle.profileStatus)} / renderer ${escapeHtml(runtime.assetLifecycle.rendererStatus)}</dd></div>
      <div><dt>generation</dt><dd>obj ${runtime.assetLifecycle.objGenerationId} / profile ${runtime.assetLifecycle.profileGenerationId} / render ${runtime.assetLifecycle.renderSettingsGenerationId} / renderer ${runtime.assetLifecycle.rendererGenerationId}</dd></div>
      <div><dt>render lifecycle</dt><dd>render ${String(runtime.renderedIdealLifecycle.renderSucceeded)} / detect ${String(runtime.renderedIdealLifecycle.detectSucceeded)} / stale ${String(runtime.renderedIdealLifecycle.staleCanvasDetected)}</dd></div>
      <div><dt>render pose</dt><dd>applied ${String(runtime.renderedIdealLifecycle.renderPose.renderPoseAppliedToWebGL)} / source ${escapeHtml(runtime.renderedIdealLifecycle.renderPose.renderPoseSource)} / ${escapeHtml(runtime.renderedIdealLifecycle.renderPose.renderPoseMismatchReason ?? "-")}</dd></div>
      <div><dt>overlay lifecycle</dt><dd>visible ${String(runtime.overlayLifecycle.alignedRenderedIdealVisible)} / gen ${String(runtime.overlayLifecycle.generationMatch)} / token ${String(runtime.overlayLifecycle.tokenMatch)} / renderPose ${String(runtime.overlayLifecycle.renderPoseValid)} / ${escapeHtml(runtime.overlayLifecycle.skippedReason)}</dd></div>
      <div><dt>lastGood</dt><dd>${String(runtime.lastGood.hasLastGood)} / ageMs ${formatRealtimeNullableNumber(runtime.lastGood.ageMs)}</dd></div>
      <div><dt>stale</dt><dd>${String(runtime.stale.isStale)} / ${escapeHtml(runtime.stale.staleReason ?? "-")} / ${formatRealtimeNullableNumber(runtime.stale.staleMs)}ms</dd></div>
      <div><dt>loop busy</dt><dd>${String(poseMappingRuntimeInProgress)}</dd></div>
      <div><dt>P_camera</dt><dd>${escapeHtml(formatPoseMappingPose(runtime.P_camera))}</dd></div>
      <div><dt>p</dt><dd>${escapeHtml(formatPoseMappingPose(runtime.p))}</dd></div>
      <div><dt>P_confirm</dt><dd>${escapeHtml(formatPose(runtime.P_confirm))}</dd></div>
      <div><dt>pose diff</dt><dd>${escapeHtml(formatPoseMappingDiff(runtime.poseDiff))}</dd></div>
      <div><dt>renderedIdeal478</dt><dd>${runtime.renderedIdealDetected ? "detected" : "not detected"} / ${formatNullableCount(runtime.renderedIdealLandmarkCount)}</dd></div>
      <div><dt>alignedRenderedIdeal478</dt><dd>${formatNullableCount(runtime.alignedRenderedIdeal478?.length ?? null)}</dd></div>
      <div><dt>alignment</dt><dd>${escapeHtml(runtime.alignment.status)} / ${escapeHtml(runtime.alignment.mode)} / scale ${formatRealtimeNullableNumber(runtime.alignment.placementScaleRatio)}</dd></div>
      <div><dt>bounds settings</dt><dd>${escapeHtml(runtime.alignment.placementLandmarkSet)} / ${escapeHtml(runtime.alignment.scaleBasis)}</dd></div>
      <div><dt>Placement source debug（位置・大きさ取得元デバッグ）</dt><dd>current raw ${String(runtime.alignment.placementDebug.current.matrixRaw.exists)} / ideal raw ${String(runtime.alignment.placementDebug.ideal.matrixRaw.exists)}</dd></div>
      <div><dt>Current matrix column-major（現在顔の列優先候補）</dt><dd>${escapeHtml(formatMatrixPlacementCandidate(runtime.alignment.placementDebug.current.matrixColumnMajor))}</dd></div>
      <div><dt>Current bounds center / size（現在顔の外枠）</dt><dd>${escapeHtml(formatBoundsPlacement(runtime.alignment.placementDebug.current.boundsPlacement))}</dd></div>
      <div><dt>Matrix translation vs bounds center delta（行列と外枠中心の差）</dt><dd>${escapeHtml(formatPlacementDelta(runtime.alignment.placementDebug.comparison.columnMajorTranslationVsBoundsCenter))}</dd></div>
      <div><dt>Render backend</dt><dd>${escapeHtml(runtime.renderBackend)}</dd></div>
      <div><dt>Renderer signature</dt><dd>${escapeHtml(runtime.renderer?.rendererSignature ?? "-")}</dd></div>
      <div><dt>Profile renderer match</dt><dd>${String(runtime.profileRendererMatch)}</dd></div>
    </dl>
  `
}

function renderPoseMappingDebugTab() {
  const container = document.createElement("div")
  container.className = "pose-mapping-debug"
  const profileState = state.poseMappingProfile
  const profile = profileState.profile
  const runtime = state.poseMappingRuntime
  const canDownload = profileState.loaded && runtime.status !== "idle"
  const detectPerformance = state.detectPerformance
  const handoff = state.renderDetectHandoff
  const webglBenchmark = state.webglObjBenchmark
  const renderPoseProbe = state.renderPoseProbe
  const canRunDetectPerformance =
    detectPerformance.status !== "running" &&
    handoff.status !== "running" &&
    webglBenchmark.status !== "running" &&
    renderPoseProbe.status !== "running" &&
    profileState.loaded &&
    runtime.status === "completed" &&
    runtime.poseMappingStatus === "completed" &&
    runtime.p !== null
  const canDownloadDetectPerformance = detectPerformance.result !== null
  const canRunHandoff =
    handoff.status !== "running" &&
    detectPerformance.status !== "running" &&
    webglBenchmark.status !== "running" &&
    renderPoseProbe.status !== "running" &&
    profileState.loaded &&
    runtime.status === "completed" &&
    runtime.poseMappingStatus === "completed" &&
    runtime.p !== null
  const canDownloadHandoff = handoff.result !== null
  const canRunWebglBenchmark =
    webglBenchmark.status !== "running" &&
    detectPerformance.status !== "running" &&
    handoff.status !== "running" &&
    renderPoseProbe.status !== "running" &&
    profileState.loaded &&
    runtime.status === "completed" &&
    runtime.poseMappingStatus === "completed" &&
    runtime.p !== null
  const canDownloadWebglBenchmark = webglBenchmark.result !== null
  const canRunRenderPoseProbe =
    renderPoseProbe.status !== "running" &&
    webglBenchmark.status !== "running" &&
    detectPerformance.status !== "running" &&
    handoff.status !== "running" &&
    profileState.loaded &&
    runtime.status === "completed" &&
    runtime.poseMappingStatus === "completed" &&
    runtime.p !== null
  const canArmRenderPoseProbeAfterRecovery =
    renderPoseProbe.status !== "running" &&
    webglBenchmark.status !== "running" &&
    detectPerformance.status !== "running" &&
    handoff.status !== "running" &&
    profileState.loaded &&
    canRenderRenderedIdealGeometry()
  const requiredRendererResolution = getRenderResolutionFromRecord(profile?.requiredRenderer?.renderResolution)

  container.innerHTML = `
    <section class="debug-section">
      <h3>Profile info（プロファイル情報）</h3>
      <dl class="summary-list">
        <div><dt>loaded</dt><dd>${profileState.loaded ? "loaded" : "not loaded"}</dd></div>
        <div><dt>filename</dt><dd>${escapeHtml(profileState.fileName ?? "-")}</dd></div>
        <div><dt>schemaVersion</dt><dd>${escapeHtml(profile?.schemaVersion ?? "-")}</dd></div>
        <div><dt>modelType</dt><dd>${escapeHtml(profile?.modelType ?? "-")}</dd></div>
        <div><dt>modelName</dt><dd>${escapeHtml(profile?.modelName ?? "-")}</dd></div>
        <div><dt>datasetKind</dt><dd>${escapeHtml(profile?.datasetKind ?? "-")}</dd></div>
        <div><dt>requiredRenderBackend</dt><dd>${escapeHtml(profile?.requiredRenderBackend ?? "-")}</dd></div>
        <div><dt>requiredRendererKind</dt><dd>${escapeHtml(getOptionalString(profile?.requiredRenderer?.kind) ?? "-")}</dd></div>
        <div><dt>requiredRendererVersion</dt><dd>${escapeHtml(getOptionalString(profile?.requiredRenderer?.version) ?? "-")}</dd></div>
        <div><dt>requiredRendererSignature</dt><dd>${escapeHtml(getOptionalString(profile?.requiredRenderer?.rendererSignature) ?? "-")}</dd></div>
        <div><dt>requiredRendererResolution</dt><dd>${escapeHtml(formatRendererResolution(requiredRendererResolution))}</dd></div>
        <div><dt>datasetSchemaVersion</dt><dd>${escapeHtml(profile?.datasetSchemaVersion ?? "-")}</dd></div>
        <div><dt>inputFeatures</dt><dd>${escapeHtml(profile?.inputFeatures.join(", ") ?? "-")}</dd></div>
        <div><dt>target</dt><dd>${escapeHtml(profile?.target.join(", ") ?? "-")}</dd></div>
        <div><dt>errorSummary</dt><dd>${escapeHtml(formatPoseMappingSummary(profile?.errorSummary, ["poseMAE", "poseP95", "poseMAX", "continuityJumpMax"]))}</dd></div>
        <div><dt>outlierFilterSummary</dt><dd>${escapeHtml(formatPoseMappingSummary(profile?.outlierFilterSummary, ["rawSampleCount", "filteredSampleCount", "excludedSampleCount", "excludedRatio"]))}</dd></div>
        <div><dt>poseRangeAfter</dt><dd>${escapeHtml(formatPoseMappingRange(profile?.poseRangeAfter))}</dd></div>
        <div><dt>error</dt><dd>${escapeHtml(profileState.errorMessage ?? "-")}</dd></div>
      </dl>
    </section>

    <section class="debug-section">
      <h3>Runtime input（実行時入力）</h3>
      <dl class="summary-list">
        <div><dt>currentFaceStatus</dt><dd>${escapeHtml(runtime.currentFaceStatus)}</dd></div>
        <div><dt>Rendered ideal status（レンダー理想検出状態）</dt><dd>${escapeHtml(runtime.renderedIdealStatus)}</dd></div>
        <div><dt>Alignment status（位置合わせ状態）</dt><dd>${escapeHtml(runtime.alignmentStatus)}</dd></div>
        <div><dt>poseMappingStatus</dt><dd>${escapeHtml(runtime.poseMappingStatus)}</dd></div>
        <div><dt>poseMappingSkippedReason</dt><dd>${escapeHtml(runtime.poseMappingSkippedReason)}</dd></div>
        <div><dt>fallbackPoseUsed</dt><dd>${String(runtime.fallbackPoseUsed)}</dd></div>
        <div><dt>Fallback rendered ideal used（レンダー理想のフォールバック使用有無）</dt><dd>${String(runtime.fallbackRenderedIdealUsed)}</dd></div>
        <div><dt>assetLifecycle</dt><dd>${escapeHtml(JSON.stringify(runtime.assetLifecycle))}</dd></div>
        <div><dt>frameLifecycle</dt><dd>${escapeHtml(JSON.stringify(runtime.frameLifecycle ?? null))}</dd></div>
        <div><dt>renderedIdealLifecycle</dt><dd>${escapeHtml(JSON.stringify(runtime.renderedIdealLifecycle))}</dd></div>
        <div><dt>overlayLifecycle</dt><dd>${escapeHtml(JSON.stringify(runtime.overlayLifecycle))}</dd></div>
        <div><dt>loop running</dt><dd>${String(state.realtimeDebug.status === "running")}</dd></div>
        <div><dt>loop busy</dt><dd>${String(poseMappingRuntimeInProgress)}</dd></div>
        <div><dt>loop lastFrameIndex</dt><dd>${formatNullableCount(state.realtimeDebug.processedVideoFrameCount)}</dd></div>
        <div><dt>loop lastMediaTimeSec</dt><dd>${formatRealtimeNullableNumber(state.realtimeDebug.lastVideoFrameMediaTimeSec)}</dd></div>
        <div><dt>lastGood</dt><dd>${String(runtime.lastGood.hasLastGood)} / ageMs ${formatRealtimeNullableNumber(runtime.lastGood.ageMs)} / mediaTimeSec ${formatRealtimeNullableNumber(runtime.lastGood.mediaTimeSec)} / frameIndex ${formatNullableCount(runtime.lastGood.frameIndex)}</dd></div>
        <div><dt>stale</dt><dd>${String(runtime.stale.isStale)} / ${escapeHtml(runtime.stale.staleReason ?? "-")} / staleMs ${formatRealtimeNullableNumber(runtime.stale.staleMs)}</dd></div>
        <div><dt>noFaceCounters</dt><dd>${escapeHtml(JSON.stringify(runtime.noFaceCounters))}</dd></div>
        <div><dt>P_camera</dt><dd>${escapeHtml(formatPoseMappingPose(runtime.P_camera))}</dd></div>
        <div><dt>P_camera clamped</dt><dd>${escapeHtml(formatPoseMappingPose(runtime.P_cameraClamped))}</dd></div>
        <div><dt>clampApplied</dt><dd>${String(runtime.P_camera !== null && runtime.P_cameraClamped !== null && !posesEqual(runtime.P_camera, runtime.P_cameraClamped))}</dd></div>
        <div><dt>quality gate</dt><dd>${runtime.qualityGate.usable ? "usable" : "not usable"}</dd></div>
        <div><dt>quality reasons</dt><dd>${escapeHtml(runtime.qualityGate.reasons.join(", ") || "-")}</dd></div>
      </dl>
    </section>

    <section class="debug-section">
      <h3>Profile output（関数出力）</h3>
      <dl class="summary-list">
        <div><dt>p</dt><dd>${escapeHtml(formatPoseMappingPose(runtime.p))}</dd></div>
        <div><dt>selectedLeaf</dt><dd>${formatNullableCount(runtime.selectedLeaf)}</dd></div>
        <div><dt>used expert</dt><dd>${escapeHtml(runtime.usedExpert ?? "-")}</dd></div>
        <div><dt>usedFallback</dt><dd>${String(runtime.usedFallback)}</dd></div>
        <div><dt>evaluator warnings</dt><dd>${escapeHtml(runtime.warnings.join(", ") || "-")}</dd></div>
      </dl>
    </section>

    <section class="debug-section">
      <h3>Render confirm（レンダー確認）</h3>
      <dl class="summary-list">
        <div><dt>Render backend</dt><dd>${escapeHtml(runtime.renderBackend)}</dd></div>
        <div><dt>Renderer kind</dt><dd>${escapeHtml(runtime.renderer?.kind ?? "-")}</dd></div>
        <div><dt>Renderer version</dt><dd>${escapeHtml(runtime.renderer?.version ?? "-")}</dd></div>
        <div><dt>Renderer signature</dt><dd>${escapeHtml(runtime.renderer?.rendererSignature ?? "-")}</dd></div>
        <div><dt>Projection mode</dt><dd>${escapeHtml(runtime.renderer?.projectionMode ?? "-")}</dd></div>
        <div><dt>Render resolution</dt><dd>${formatNullableCount(runtime.renderSettings?.detectCanvasWidth ?? runtime.detectCanvasWidth)} x ${formatNullableCount(runtime.renderSettings?.detectCanvasHeight ?? runtime.detectCanvasHeight)}</dd></div>
        <div><dt>Profile renderer match</dt><dd>${String(runtime.profileRendererMatch)}</dd></div>
        <div><dt>Profile mismatch error</dt><dd>${escapeHtml(runtime.profileMismatchError ?? "-")}</dd></div>
        <div><dt>requestedPoseP</dt><dd>${escapeHtml(formatPoseMappingPose(runtime.renderedIdealLifecycle.renderPose.requestedPoseP))}</dd></div>
        <div><dt>renderCallPoseP</dt><dd>${escapeHtml(formatPoseMappingPose(runtime.renderedIdealLifecycle.renderPose.renderCallPoseP))}</dd></div>
        <div><dt>previewStatePoseP</dt><dd>${escapeHtml(formatPoseMappingPose(runtime.renderedIdealLifecycle.renderPose.previewStatePoseP))}</dd></div>
        <div><dt>bufferBuildPoseP</dt><dd>${escapeHtml(formatPoseMappingPose(runtime.renderedIdealLifecycle.renderPose.bufferBuildPoseP))}</dd></div>
        <div><dt>webglUniformPoseP</dt><dd>${escapeHtml(formatPoseMappingPose(runtime.renderedIdealLifecycle.renderPose.webglUniformPoseP))}</dd></div>
        <div><dt>actualRenderPoseP</dt><dd>${escapeHtml(formatPoseMappingPose(runtime.renderedIdealLifecycle.renderPose.actualRenderPoseP))}</dd></div>
        <div><dt>bufferPoseDebug</dt><dd>${escapeHtml(JSON.stringify(runtime.renderedIdealLifecycle.renderPose.buffer))}</dd></div>
        <div><dt>detectCanvasPoseState</dt><dd>${escapeHtml(JSON.stringify(runtime.renderedIdealLifecycle.renderPose.detectCanvas))}</dd></div>
        <div><dt>poseRecoveryDebug</dt><dd>${escapeHtml(JSON.stringify(runtime.renderedIdealLifecycle.renderPose.recovery))}</dd></div>
        <div><dt>renderPoseSource</dt><dd>${escapeHtml(runtime.renderedIdealLifecycle.renderPose.renderPoseSource)}</dd></div>
        <div><dt>renderPoseAppliedToWebGL</dt><dd>${String(runtime.renderedIdealLifecycle.renderPose.renderPoseAppliedToWebGL)}</dd></div>
        <div><dt>renderPoseMatchesToken</dt><dd>${String(runtime.renderedIdealLifecycle.renderPose.renderPoseMatchesToken)}</dd></div>
        <div><dt>renderPoseMismatchReason</dt><dd>${escapeHtml(runtime.renderedIdealLifecycle.renderPose.renderPoseMismatchReason ?? "-")}</dd></div>
        <div><dt>detectCanvasWidth</dt><dd>${formatNullableCount(runtime.renderSettings?.detectCanvasWidth ?? runtime.detectCanvasWidth)}</dd></div>
        <div><dt>detectCanvasHeight</dt><dd>${formatNullableCount(runtime.renderSettings?.detectCanvasHeight ?? runtime.detectCanvasHeight)}</dd></div>
        <div><dt>previewCanvasWidth</dt><dd>${formatNullableCount(runtime.renderSettings?.previewCanvasWidth ?? runtime.previewCanvasWidth)}</dd></div>
        <div><dt>previewCanvasHeight</dt><dd>${formatNullableCount(runtime.renderSettings?.previewCanvasHeight ?? runtime.previewCanvasHeight)}</dd></div>
        <div><dt>renderResolutionSource</dt><dd>${escapeHtml(runtime.renderSettings?.renderResolutionSource ?? "-")}</dd></div>
        <div><dt>detectCanvasMatchesProfile</dt><dd>${String(runtime.renderSettings?.detectCanvasMatchesProfile ?? false)}</dd></div>
        <div><dt>profileCanvasWidth</dt><dd>${formatNullableCount(runtime.renderSettings?.profileCanvasWidth ?? null)}</dd></div>
        <div><dt>profileCanvasHeight</dt><dd>${formatNullableCount(runtime.renderSettings?.profileCanvasHeight ?? null)}</dd></div>
        <div><dt>backgroundColor</dt><dd>${escapeHtml(runtime.renderAppearanceApplied?.backgroundColor ?? "-")}</dd></div>
        <div><dt>skinColor</dt><dd>${escapeHtml(runtime.renderAppearanceApplied?.skinColor ?? "-")}</dd></div>
        <div><dt>material</dt><dd>${escapeHtml(runtime.renderAppearanceApplied ? JSON.stringify(runtime.renderAppearanceApplied.material) : "-")}</dd></div>
        <div><dt>lighting</dt><dd>${escapeHtml(runtime.renderAppearanceApplied ? JSON.stringify(runtime.renderAppearanceApplied.lighting) : "-")}</dd></div>
        <div><dt>camera</dt><dd>${escapeHtml(runtime.renderAppearanceApplied ? JSON.stringify(runtime.renderAppearanceApplied.camera) : "-")}</dd></div>
        <div><dt>notAppliedRenderAppearanceFields</dt><dd>${escapeHtml(runtime.renderAppearanceApplied?.notAppliedRenderAppearanceFields.join(", ") || "-")}</dd></div>
        <div><dt>P_confirm</dt><dd>${escapeHtml(formatPose(runtime.P_confirm))}</dd></div>
        <div><dt>pose diff</dt><dd>${escapeHtml(formatPoseMappingDiff(runtime.poseDiff))}</dd></div>
        <div><dt>renderedIdeal478 status</dt><dd>${runtime.renderedIdealDetected ? "detected" : "not detected"} / landmarkCount ${formatNullableCount(runtime.renderedIdealLandmarkCount)}</dd></div>
        <div><dt>profileEvaluateMs</dt><dd>${formatRealtimeNullableNumber(runtime.profileEvaluateMs)}</dd></div>
        <div><dt>renderMs</dt><dd>${formatRealtimeNullableNumber(runtime.renderMs)}</dd></div>
        <div><dt>detectMs</dt><dd>${formatRealtimeNullableNumber(runtime.detectMs)}</dd></div>
        <div><dt>totalMs</dt><dd>${formatRealtimeNullableNumber(runtime.totalMs)}</dd></div>
        <div><dt>errorMessage</dt><dd>${escapeHtml(runtime.errorMessage ?? "-")}</dd></div>
      </dl>
    </section>

    <section class="debug-section">
      <h3>Render pose probe（レンダー姿勢プローブ）</h3>
      <div class="button-row">
        <button class="small-button" type="button" data-action="render-pose-probe-run" ${canRunRenderPoseProbe ? "" : "disabled"}>Render pose probe（レンダー姿勢プローブ）</button>
        <button class="small-button" type="button" data-action="render-pose-probe-after-recovery" ${canArmRenderPoseProbeAfterRecovery ? "" : "disabled"}>Run probe after next recovery</button>
      </div>
      ${renderRenderPoseProbeSummaryHtml()}
    </section>

    <section class="debug-section">
      <h3>Alignment coordinate debug（位置合わせ座標デバッグ）</h3>
      <dl class="summary-list">
        <div><dt>status</dt><dd>${escapeHtml(runtime.alignment.status)}</dd></div>
        <div><dt>Alignment mode（位置合わせ方式）</dt><dd>${escapeHtml(runtime.alignment.mode)}</dd></div>
        <div><dt>Placement landmark set</dt><dd>${escapeHtml(runtime.alignment.placementLandmarkSet)}</dd></div>
        <div><dt>Scale basis</dt><dd>${escapeHtml(runtime.alignment.scaleBasis)}</dd></div>
        <div><dt>Placement source（位置・大きさ取得元）</dt><dd>${escapeHtml(runtime.alignment.placementSource)}</dd></div>
        <div><dt>Rotation applied（回転適用有無）</dt><dd>${String(runtime.alignment.rotationApplied)}</dd></div>
        <div><dt>alignmentSkippedReason</dt><dd>${escapeHtml(runtime.alignment.alignmentSkippedReason)}</dd></div>
        <div><dt>Current placement center / scale（現在顔の位置・大きさ）</dt><dd>${escapeHtml(formatPlacement(runtime.alignment.currentPlacement))}</dd></div>
        <div><dt>Ideal placement center / scale（理想顔の位置・大きさ）</dt><dd>${escapeHtml(formatPlacement(runtime.alignment.idealPlacement))}</dd></div>
        <div><dt>Placement scale ratio（大きさ比率）</dt><dd>${formatRealtimeNullableNumber(runtime.alignment.placementScaleRatio)}</dd></div>
        <div><dt>anchorCount</dt><dd>${formatNullableCount(runtime.alignment.anchorCount)}</dd></div>
        <div><dt>videoAspectRatio</dt><dd>${formatRealtimeNullableNumber(runtime.alignment.videoAspectRatio)}</dd></div>
        <div><dt>renderAspectRatio</dt><dd>${formatRealtimeNullableNumber(runtime.alignment.renderAspectRatio)}</dd></div>
        <div><dt>currentCenter</dt><dd>${escapeHtml(formatPoint2(runtime.alignment.currentCenter))}</dd></div>
        <div><dt>idealCenter</dt><dd>${escapeHtml(formatPoint2(runtime.alignment.idealCenter))}</dd></div>
        <div><dt>scale</dt><dd>${formatRealtimeNullableNumber(runtime.alignment.scale)}</dd></div>
        <div><dt>current bounds image</dt><dd>${escapeHtml(formatPoseMappingBounds(runtime.alignment.currentBoundsImage))}</dd></div>
        <div><dt>rendered ideal bounds image</dt><dd>${escapeHtml(formatPoseMappingBounds(runtime.alignment.renderedIdealBoundsImage))}</dd></div>
        <div><dt>current bounds aspect work</dt><dd>${escapeHtml(formatPoseMappingBounds(runtime.alignment.currentBoundsAspectWork))}</dd></div>
        <div><dt>rendered ideal bounds aspect work</dt><dd>${escapeHtml(formatPoseMappingBounds(runtime.alignment.renderedIdealBoundsAspectWork))}</dd></div>
        <div><dt>aligned ideal bounds aspect work</dt><dd>${escapeHtml(formatPoseMappingBounds(runtime.alignment.alignedIdealBoundsAspectWork))}</dd></div>
        <div><dt>aligned ideal bounds image</dt><dd>${escapeHtml(formatPoseMappingBounds(runtime.alignment.alignedRenderedIdealBoundsImage))}</dd></div>
        <div><dt>aligned ideal image bounds width / height</dt><dd>${formatRealtimeNullableNumber(runtime.alignment.alignedRenderedIdealBoundsImage?.width ?? null)} / ${formatRealtimeNullableNumber(runtime.alignment.alignedRenderedIdealBoundsImage?.height ?? null)}</dd></div>
        <div><dt>displayedContentRect</dt><dd>${escapeHtml(formatRect(runtime.alignment.displayedContentRect))}</dd></div>
        <div><dt>excludedReasonCounts</dt><dd>${escapeHtml(JSON.stringify(runtime.alignment.excludedReasonCounts))}</dd></div>
        <div><dt>displacementSummary</dt><dd>${escapeHtml(JSON.stringify(roundDisplacementSummary(runtime.alignment.displacementSummary)))}</dd></div>
        <div><dt>boundsCenterScaleDebug</dt><dd>${escapeHtml(JSON.stringify(roundBoundsCenterScaleDebugForState(runtime.alignment.boundsCenterScaleDebug)))}</dd></div>
        <div><dt>alignedRenderedIdeal478</dt><dd>${formatNullableCount(runtime.alignedRenderedIdeal478?.length ?? null)}</dd></div>
        <div><dt>meshSourceVertices</dt><dd>${formatNullableCount(runtime.meshSourceVertices?.length ?? null)}</dd></div>
        <div><dt>meshTargetVertices</dt><dd>${formatNullableCount(runtime.meshTargetVertices?.length ?? null)}</dd></div>
      </dl>
      <div class="debug-subsection">
        <h4>Placement source debug（位置・大きさ取得元デバッグ）</h4>
        <dl class="summary-list">
          <div><dt>Current matrix raw available（現在顔 matrix raw 有無）</dt><dd>${escapeHtml(formatMatrixRawAvailable(runtime.alignment.placementDebug.current.matrixRaw))}</dd></div>
          <div><dt>Ideal matrix raw available（理想顔 matrix raw 有無）</dt><dd>${escapeHtml(formatMatrixRawAvailable(runtime.alignment.placementDebug.ideal.matrixRaw))}</dd></div>
          <div><dt>Current matrix column-major translation / scale（現在顔の列優先候補）</dt><dd>${escapeHtml(formatMatrixPlacementCandidate(runtime.alignment.placementDebug.current.matrixColumnMajor))}</dd></div>
          <div><dt>Ideal matrix column-major translation / scale（理想顔の列優先候補）</dt><dd>${escapeHtml(formatMatrixPlacementCandidate(runtime.alignment.placementDebug.ideal.matrixColumnMajor))}</dd></div>
          <div><dt>Current matrix row-major translation / scale（現在顔の行優先候補）</dt><dd>${escapeHtml(formatMatrixPlacementCandidate(runtime.alignment.placementDebug.current.matrixRowMajor))}</dd></div>
          <div><dt>Ideal matrix row-major translation / scale（理想顔の行優先候補）</dt><dd>${escapeHtml(formatMatrixPlacementCandidate(runtime.alignment.placementDebug.ideal.matrixRowMajor))}</dd></div>
          <div><dt>Current bounds center / size（現在顔の外枠）</dt><dd>${escapeHtml(formatBoundsPlacement(runtime.alignment.placementDebug.current.boundsPlacement))}</dd></div>
          <div><dt>Ideal bounds center / size（理想顔の外枠）</dt><dd>${escapeHtml(formatBoundsPlacement(runtime.alignment.placementDebug.ideal.boundsPlacement))}</dd></div>
          <div><dt>Column-major matrix translation vs bounds center delta（列優先候補と外枠中心の差）</dt><dd>${escapeHtml(formatPlacementDelta(runtime.alignment.placementDebug.comparison.columnMajorTranslationVsBoundsCenter))}</dd></div>
          <div><dt>Row-major matrix translation vs bounds center delta（行優先候補と外枠中心の差）</dt><dd>${escapeHtml(formatPlacementDelta(runtime.alignment.placementDebug.comparison.rowMajorTranslationVsBoundsCenter))}</dd></div>
          <div><dt>Matrix scale vs bounds scale（行列 scale と外枠 height の比）</dt><dd>${escapeHtml(formatPlacementScaleComparison(runtime.alignment.placementDebug.comparison.matrixScaleVsBoundsScale))}</dd></div>
        </dl>
      </div>
    </section>

    <section class="debug-section">
      <h3>Preview（プレビュー）</h3>
      <p class="placeholder-text">現姿勢理想478プレビューは廃止し、ライブ映像上の overlay に統合しました。</p>
      <p class="control-note">${escapeHtml(formatPoseMappingPreviewNote())}</p>
    </section>

    <section class="debug-section">
      <h3>Detect Performance（検出速度）</h3>
      <div class="button-row">
        <button class="small-button" type="button" data-action="detect-performance-run" ${canRunDetectPerformance ? "" : "disabled"}>Run Detect Performance Benchmark（検出速度ベンチマーク実行）</button>
        <button class="small-button" type="button" data-action="detect-performance-stop" ${detectPerformance.status === "running" ? "" : "disabled"}>Stop Benchmark（ベンチマーク停止）</button>
        <button class="small-button" type="button" data-action="detect-performance-download-json" ${canDownloadDetectPerformance ? "" : "disabled"}>Download Detect Performance JSON（検出速度JSONダウンロード）</button>
        <button class="small-button" type="button" data-action="detect-performance-download-csv" ${canDownloadDetectPerformance ? "" : "disabled"}>Download Detect Performance CSV（検出速度CSVダウンロード）</button>
      </div>
      ${renderDetectPerformanceSummaryHtml()}
      <div class="debug-subsection">
        <h4>Render -> Detect Handoff（レンダーから検出への受け渡し）</h4>
        <div class="button-row">
          <button class="small-button" type="button" data-action="handoff-benchmark-run" ${canRunHandoff ? "" : "disabled"}>Run Handoff Benchmark（受け渡しベンチマーク実行）</button>
          <button class="small-button" type="button" data-action="handoff-benchmark-stop" ${handoff.status === "running" ? "" : "disabled"}>Stop Handoff Benchmark（受け渡しベンチマーク停止）</button>
          <button class="small-button" type="button" data-action="handoff-benchmark-download-json" ${canDownloadHandoff ? "" : "disabled"}>Download Handoff JSON（受け渡しJSONダウンロード）</button>
          <button class="small-button" type="button" data-action="handoff-benchmark-download-csv" ${canDownloadHandoff ? "" : "disabled"}>Download Handoff CSV（受け渡しCSVダウンロード）</button>
        </div>
        ${renderRenderDetectHandoffSummaryHtml()}
      </div>
      <div class="debug-subsection">
        <h4>WebGL OBJ Render Benchmark（WebGL OBJレンダーベンチマーク）</h4>
        <div class="button-row">
          <button class="small-button" type="button" data-action="webgl-obj-benchmark-run" ${canRunWebglBenchmark ? "" : "disabled"}>Run WebGL OBJ Benchmark（WebGL OBJベンチマーク実行）</button>
          <button class="small-button" type="button" data-action="webgl-obj-benchmark-stop" ${webglBenchmark.status === "running" ? "" : "disabled"}>Stop WebGL Benchmark（WebGLベンチマーク停止）</button>
          <button class="small-button" type="button" data-action="webgl-obj-benchmark-download-json" ${canDownloadWebglBenchmark ? "" : "disabled"}>Download WebGL Benchmark JSON（WebGLベンチマークJSONダウンロード）</button>
          <button class="small-button" type="button" data-action="webgl-obj-benchmark-download-csv" ${canDownloadWebglBenchmark ? "" : "disabled"}>Download WebGL Benchmark CSV（WebGLベンチマークCSVダウンロード）</button>
        </div>
        ${renderWebglObjBenchmarkSummaryHtml()}
      </div>
    </section>

    <section class="debug-section">
      <h3>Download（ダウンロード）</h3>
      <div class="button-row">
        <button class="small-button" type="button" data-action="pose-mapping-download-debug" ${canDownload ? "" : "disabled"}>Download Pose Mapping Debug（姿勢対応デバッグをダウンロード）</button>
      </div>
    </section>
  `
  return container
}

function renderRenderPoseProbeSummaryHtml() {
  const probe = state.renderPoseProbe
  const sampleRows =
    probe.samples.length > 0
      ? probe.samples.map((sample) => `
          <tr>
            <td>${escapeHtml(sample.label)}</td>
            <td>${escapeHtml(formatPoseMappingPose(sample.requestedPoseP))}</td>
            <td>${escapeHtml(formatPoseMappingPose(sample.renderCallPoseP))}</td>
            <td>${escapeHtml(formatPoseMappingPose(sample.bufferBuildPoseP))}</td>
            <td>${escapeHtml(formatPoseMappingPose(sample.webglUniformPoseP))}</td>
            <td>${escapeHtml(formatPoseMappingPose(sample.actualRenderPoseP))}</td>
            <td>${escapeHtml(formatPose(sample.P_confirm))}</td>
            <td>${escapeHtml(formatPoseMappingDiff(sample.poseDiff))}</td>
            <td>${sample.detected ? "detected" : "not detected"} / ${formatNullableCount(sample.landmarkCount)}</td>
            <td>${escapeHtml(sample.warning ?? "-")}</td>
            <td>${escapeHtml(sample.errorMessage ?? "-")}</td>
          </tr>
        `).join("")
      : `
          <tr>
            <td colspan="11" class="placeholder-text">Render pose probe はまだ実行されていません。</td>
          </tr>
        `

  return `
    <dl class="summary-list">
      <div><dt>probe status</dt><dd>${escapeHtml(probe.status)}</dd></div>
      <div><dt>runAfterNextRecovery</dt><dd>${String(probe.runAfterNextRecovery)}</dd></div>
      <div><dt>lastRunTrigger</dt><dd>${escapeHtml(probe.lastRunTrigger ?? "-")}</dd></div>
      <div><dt>startedAt</dt><dd>${escapeHtml(probe.startedAt ?? "-")}</dd></div>
      <div><dt>completedAt</dt><dd>${escapeHtml(probe.completedAt ?? "-")}</dd></div>
      <div><dt>error</dt><dd>${escapeHtml(probe.errorMessage ?? "-")}</dd></div>
    </dl>
    <div class="table-scroll">
      <table class="debug-table">
        <thead>
          <tr>
            <th>sample</th>
            <th>requestedPoseP</th>
            <th>renderCallPoseP</th>
            <th>bufferBuildPoseP</th>
            <th>webglUniformPoseP</th>
            <th>actualRenderPoseP</th>
            <th>P_confirm</th>
            <th>poseDiff</th>
            <th>detected</th>
            <th>warning</th>
            <th>error</th>
          </tr>
        </thead>
        <tbody>${sampleRows}</tbody>
      </table>
    </div>
  `
}

function renderDetectPerformanceSummaryHtml() {
  const perf = state.detectPerformance
  const result = perf.result
  const runtime = result?.runtime ?? {
    P_camera: roundPoseMappingPose(state.poseMappingRuntime.P_camera),
    p: roundPoseMappingPose(state.poseMappingRuntime.p),
    P_confirm: roundPoseForState(state.poseMappingRuntime.P_confirm),
    poseDiff: roundPoseMappingDiff(state.poseMappingRuntime.poseDiff),
  }
  const landmarker = result?.landmarker ?? {
    runningMode: "IMAGE" as const,
    requestedDelegate: getRenderedIdealRequestedDelegate(),
    instanceReused: renderedIdealFaceLandmarker !== null,
    createCount: renderedIdealFaceLandmarkerCreateCount,
  }
  const renderSettings = result?.renderSettings ?? {
    detectCanvasWidth: state.poseMappingRuntime.detectCanvasWidth,
    detectCanvasHeight: state.poseMappingRuntime.detectCanvasHeight,
    renderResolutionSource: state.poseMappingRuntime.renderSettings?.renderResolutionSource ?? null,
    detectCanvasMatchesProfile: state.poseMappingRuntime.renderSettings?.detectCanvasMatchesProfile ?? false,
  }
  const optionText =
    `warmup ${perf.options.warmupRuns} / measured ${perf.options.measuredRuns} / resolutions ${perf.options.resolutionList.join(", ")}`

  return `
    <dl class="summary-list">
      <div><dt>benchmark status</dt><dd>${escapeHtml(perf.status)}</dd></div>
      <div><dt>benchmark options</dt><dd>${escapeHtml(optionText)}</dd></div>
      <div><dt>error</dt><dd>${escapeHtml(perf.errorMessage ?? "-")}</dd></div>
      <div><dt>landmarker runningMode</dt><dd>${escapeHtml(landmarker.runningMode)}</dd></div>
      <div><dt>requested delegate</dt><dd>${escapeHtml(landmarker.requestedDelegate)}</dd></div>
      <div><dt>instance reused</dt><dd>${String(landmarker.instanceReused)}</dd></div>
      <div><dt>create count</dt><dd>${formatNullableCount(landmarker.createCount)}</dd></div>
      <div><dt>detectCanvasWidth</dt><dd>${formatNullableCount(renderSettings.detectCanvasWidth)}</dd></div>
      <div><dt>detectCanvasHeight</dt><dd>${formatNullableCount(renderSettings.detectCanvasHeight)}</dd></div>
      <div><dt>renderResolutionSource</dt><dd>${escapeHtml(renderSettings.renderResolutionSource ?? "-")}</dd></div>
      <div><dt>detectCanvasMatchesProfile</dt><dd>${String(renderSettings.detectCanvasMatchesProfile)}</dd></div>
      <div><dt>P_camera</dt><dd>${escapeHtml(formatPoseMappingPose(runtime.P_camera))}</dd></div>
      <div><dt>p</dt><dd>${escapeHtml(formatPoseMappingPose(runtime.p))}</dd></div>
      <div><dt>P_confirm</dt><dd>${escapeHtml(formatPose(runtime.P_confirm))}</dd></div>
      <div><dt>poseDiff magnitude</dt><dd>${formatRealtimeNullableNumber(runtime.poseDiff.magnitude)}</dd></div>
    </dl>
    ${renderDetectPerformanceCaseSummariesHtml(result?.cases ?? [])}
    <p class="control-note">detect only は MediaPipe detect() 呼び出しのみ、render only は OBJ render のみ、preview は画像生成 / overlay / toDataURL を個別に測ります。UI state update は測定外です。</p>
  `
}

function renderDetectPerformanceCaseSummariesHtml(cases: DetectPerformanceCaseResult[]) {
  if (cases.length === 0) {
    return `<p class="placeholder-text">検出速度ベンチマーク結果はまだありません。</p>`
  }

  return cases.map((caseResult) => `
    <div class="debug-subsection">
      <h4>${escapeHtml(caseResult.label)}</h4>
      <dl class="summary-list">
        <div><dt>caseName</dt><dd>${escapeHtml(caseResult.caseId)}</dd></div>
        <div><dt>canvas</dt><dd>${formatNullableCount(caseResult.canvasWidth)} x ${formatNullableCount(caseResult.canvasHeight)}</dd></div>
        <div><dt>warmupRuns</dt><dd>${formatNullableCount(caseResult.warmupRuns)}</dd></div>
        <div><dt>measuredRuns</dt><dd>${formatNullableCount(caseResult.measuredRuns)}</dd></div>
        <div><dt>detectedCount</dt><dd>${formatNullableCount(caseResult.detectedCount)}</dd></div>
        <div><dt>failedCount</dt><dd>${formatNullableCount(caseResult.failedCount)}</dd></div>
        <div><dt>summary</dt><dd>${escapeHtml(formatDetectPerformanceTimingSummary(caseResult.summary))}</dd></div>
        ${caseResult.renderMs ? `<div><dt>renderMs</dt><dd>${escapeHtml(formatDetectPerformanceTimingSummary(caseResult.renderMs))}</dd></div>` : ""}
        ${caseResult.detectMs ? `<div><dt>detectMs</dt><dd>${escapeHtml(formatDetectPerformanceTimingSummary(caseResult.detectMs))}</dd></div>` : ""}
        ${caseResult.previewMs ? `<div><dt>previewMs</dt><dd>${escapeHtml(formatDetectPerformanceTimingSummary(caseResult.previewMs))}</dd></div>` : ""}
        ${caseResult.overlayMs ? `<div><dt>overlayMs</dt><dd>${escapeHtml(formatDetectPerformanceTimingSummary(caseResult.overlayMs))}</dd></div>` : ""}
        ${caseResult.toDataUrlMs ? `<div><dt>toDataURLMs</dt><dd>${escapeHtml(formatDetectPerformanceTimingSummary(caseResult.toDataUrlMs))}</dd></div>` : ""}
        ${caseResult.totalMs ? `<div><dt>totalMs</dt><dd>${escapeHtml(formatDetectPerformanceTimingSummary(caseResult.totalMs))}</dd></div>` : ""}
      </dl>
    </div>
  `).join("")
}

function formatDetectPerformanceTimingSummary(summary: DetectPerformanceTimingSummary) {
  return `avg ${formatRealtimeNullableNumber(summary.avgMs)} / p50 ${formatRealtimeNullableNumber(summary.p50Ms)} / p95 ${formatRealtimeNullableNumber(summary.p95Ms)} / min ${formatRealtimeNullableNumber(summary.minMs)} / max ${formatRealtimeNullableNumber(summary.maxMs)}`
}

function renderRenderDetectHandoffSummaryHtml() {
  const handoff = state.renderDetectHandoff
  const result = handoff.result
  const runtime = result?.runtime ?? {
    P_camera: roundPoseMappingPose(state.poseMappingRuntime.P_camera),
    p: roundPoseMappingPose(state.poseMappingRuntime.p),
    P_confirm: roundPoseForState(state.poseMappingRuntime.P_confirm),
    poseDiff: roundPoseMappingDiff(state.poseMappingRuntime.poseDiff),
  }
  const landmarker = result?.landmarker ?? {
    runningMode: "IMAGE" as const,
    requestedDelegate: getRenderedIdealRequestedDelegate(),
    instanceReused: renderedIdealFaceLandmarker !== null,
    createCount: renderedIdealFaceLandmarkerCreateCount,
  }
  const renderSettings = result?.renderSettings ?? {
    detectCanvasWidth: state.poseMappingRuntime.detectCanvasWidth,
    detectCanvasHeight: state.poseMappingRuntime.detectCanvasHeight,
    renderResolutionSource: state.poseMappingRuntime.renderSettings?.renderResolutionSource ?? null,
    detectCanvasMatchesProfile: state.poseMappingRuntime.renderSettings?.detectCanvasMatchesProfile ?? false,
  }

  return `
    <dl class="summary-list">
      <div><dt>status</dt><dd>${escapeHtml(handoff.status)}</dd></div>
      <div><dt>warmupRuns</dt><dd>${formatNullableCount(handoff.options.warmupRuns)}</dd></div>
      <div><dt>measuredRuns</dt><dd>${formatNullableCount(handoff.options.measuredRuns)}</dd></div>
      <div><dt>detectCanvasWidth</dt><dd>${formatNullableCount(renderSettings.detectCanvasWidth)}</dd></div>
      <div><dt>detectCanvasHeight</dt><dd>${formatNullableCount(renderSettings.detectCanvasHeight)}</dd></div>
      <div><dt>renderResolutionSource</dt><dd>${escapeHtml(renderSettings.renderResolutionSource ?? "-")}</dd></div>
      <div><dt>detectCanvasMatchesProfile</dt><dd>${String(renderSettings.detectCanvasMatchesProfile)}</dd></div>
      <div><dt>landmarker runningMode</dt><dd>${escapeHtml(landmarker.runningMode)}</dd></div>
      <div><dt>requestedDelegate</dt><dd>${escapeHtml(landmarker.requestedDelegate)}</dd></div>
      <div><dt>instanceReused</dt><dd>${String(landmarker.instanceReused)}</dd></div>
      <div><dt>createCount</dt><dd>${formatNullableCount(landmarker.createCount)}</dd></div>
      <div><dt>P_camera</dt><dd>${escapeHtml(formatPoseMappingPose(runtime.P_camera))}</dd></div>
      <div><dt>p</dt><dd>${escapeHtml(formatPoseMappingPose(runtime.p))}</dd></div>
      <div><dt>P_confirm</dt><dd>${escapeHtml(formatPose(runtime.P_confirm))}</dd></div>
      <div><dt>poseDiff magnitude</dt><dd>${formatRealtimeNullableNumber(runtime.poseDiff.magnitude)}</dd></div>
      <div><dt>error</dt><dd>${escapeHtml(handoff.errorMessage ?? "-")}</dd></div>
    </dl>
    ${renderRenderDetectHandoffCaseSummariesHtml(result?.cases ?? [])}
    ${renderRenderDetectHandoffInterpretationHtml(result?.conclusionHints ?? null)}
  `
}

function renderRenderDetectHandoffCaseSummariesHtml(cases: RenderDetectHandoffCaseResult[]) {
  if (cases.length === 0) {
    return `<p class="placeholder-text">受け渡しベンチマーク結果はまだありません。</p>`
  }

  return cases.map((caseResult) => `
    <div class="debug-subsection">
      <h4>${escapeHtml(caseResult.label)}</h4>
      <dl class="summary-list">
        <div><dt>caseId</dt><dd>${escapeHtml(caseResult.caseId)}</dd></div>
        <div><dt>handoffStrategy</dt><dd>${escapeHtml(caseResult.handoffStrategy)}</dd></div>
        <div><dt>canvas</dt><dd>${formatNullableCount(caseResult.canvasWidth)} x ${formatNullableCount(caseResult.canvasHeight)}</dd></div>
        <div><dt>detectedCount</dt><dd>${formatNullableCount(caseResult.detectedCount)}</dd></div>
        <div><dt>failedCount</dt><dd>${formatNullableCount(caseResult.failedCount)}</dd></div>
        <div><dt>renderMs</dt><dd>${escapeHtml(formatDetectPerformanceTimingSummary(caseResult.summary.renderMs))}</dd></div>
        <div><dt>waitMs</dt><dd>${escapeHtml(formatDetectPerformanceTimingSummary(caseResult.summary.waitMs))}</dd></div>
        <div><dt>bitmapCreateMs</dt><dd>${escapeHtml(formatDetectPerformanceTimingSummary(caseResult.summary.bitmapCreateMs))}</dd></div>
        <div><dt>copyMs</dt><dd>${escapeHtml(formatDetectPerformanceTimingSummary(caseResult.summary.copyMs))}</dd></div>
        <div><dt>readbackMs</dt><dd>${escapeHtml(formatDetectPerformanceTimingSummary(caseResult.summary.readbackMs))}</dd></div>
        <div><dt>detectMs</dt><dd>${escapeHtml(formatDetectPerformanceTimingSummary(caseResult.summary.detectMs))}</dd></div>
        <div><dt>totalMs</dt><dd>${escapeHtml(formatDetectPerformanceTimingSummary(caseResult.summary.totalMs))}</dd></div>
        <div><dt>notes</dt><dd>${escapeHtml(caseResult.notes.join(", ") || "-")}</dd></div>
      </dl>
    </div>
  `).join("")
}

function renderRenderDetectHandoffInterpretationHtml(hints: RenderDetectHandoffConclusionHints | null) {
  const best = hints?.bestHandoffStrategy
    ? `現在の最速候補: ${hints.bestHandoffStrategy} / total avg ${formatRealtimeNullableNumber(hints.bestHandoffTotalAvgMs)} / detect avg ${formatRealtimeNullableNumber(hints.bestHandoffDetectAvgMs)}`
    : "benchmark 実行後に最速候補を表示します。"
  return `
    <div class="debug-subsection">
      <h4>Interpretation（解釈）</h4>
      <p class="control-note">${escapeHtml(best)}</p>
      <ul class="debug-note-list">
        <li>detect only は軽いが immediate render -> detect が重い場合、render後の描画同期コストが detect 側に乗っている可能性が高いです。</li>
        <li>requestAnimationFrame 後に軽くなる場合、1フレーム遅延または double buffer で本番可能性があります。</li>
        <li>createImageBitmap で軽くなる場合、canvas から bitmap 化する受け渡しを検討できます。</li>
        <li>double buffer で軽くなる場合、前フレームの renderedIdeal478 を使う構成を検討できます。</li>
        <li>どの handoff でも重い場合、Canvas2D render + MediaPipe再検出の毎フレーム方式は厳しく、WebGL render または事前 profile 化を検討します。</li>
      </ul>
    </div>
  `
}

function renderWebglObjBenchmarkSummaryHtml() {
  const benchmark = state.webglObjBenchmark
  const result = benchmark.result
  const runtime = result?.runtime ?? {
    P_camera: roundPoseMappingPose(state.poseMappingRuntime.P_camera),
    p: roundPoseMappingPose(state.poseMappingRuntime.p),
    canvas2dConfirm: {
      P_confirm: roundPoseForState(state.poseMappingRuntime.P_confirm),
      poseDiff: roundPoseMappingDiff(state.poseMappingRuntime.poseDiff),
    },
  }
  const renderSettings = result?.renderSettings ?? {
    canvasWidth: state.poseMappingRuntime.detectCanvasWidth,
    canvasHeight: state.poseMappingRuntime.detectCanvasHeight,
    renderResolutionSource: state.poseMappingRuntime.renderSettings?.renderResolutionSource ?? null,
    detectCanvasMatchesProfile: state.poseMappingRuntime.renderSettings?.detectCanvasMatchesProfile ?? false,
  }
  const landmarker = result?.landmarker ?? {
    runningMode: "IMAGE" as const,
    requestedDelegate: getRenderedIdealRequestedDelegate(),
    instanceReused: renderedIdealFaceLandmarker !== null,
    createCount: renderedIdealFaceLandmarkerCreateCount,
  }
  const webgl = result?.webgl ?? createWebglObjBenchmarkSupportPreview()
  const latestWebglCase = result?.cases.find((caseResult) => caseResult.rendererKind === "webgl" && caseResult.detectedCount > 0)
  const latestWebglSample = latestWebglCase?.samples
    .filter((sample) => sample.phase === "measured" && sample.detected)
    .slice(-1)[0] ?? null

  return `
    <dl class="summary-list">
      <div><dt>status</dt><dd>${escapeHtml(benchmark.status)}</dd></div>
      <div><dt>warmupRuns</dt><dd>${formatNullableCount(benchmark.options.warmupRuns)}</dd></div>
      <div><dt>measuredRuns</dt><dd>${formatNullableCount(benchmark.options.measuredRuns)}</dd></div>
      <div><dt>canvasWidth</dt><dd>${formatNullableCount(renderSettings.canvasWidth)}</dd></div>
      <div><dt>canvasHeight</dt><dd>${formatNullableCount(renderSettings.canvasHeight)}</dd></div>
      <div><dt>supported</dt><dd>${String(webgl.supported)}</dd></div>
      <div><dt>contextType</dt><dd>${escapeHtml(webgl.contextType ?? "-")}</dd></div>
      <div><dt>rendererInfo</dt><dd>${escapeHtml(webgl.rendererInfo ?? "-")}</dd></div>
      <div><dt>shaderCompileStatus</dt><dd>${escapeHtml(webgl.shaderCompileStatus)}</dd></div>
      <div><dt>bufferStatus</dt><dd>${escapeHtml(webgl.bufferStatus)}</dd></div>
      <div><dt>projectionMode</dt><dd>${escapeHtml(webgl.projectionMode)}</dd></div>
      <div><dt>notAppliedRenderAppearanceFields</dt><dd>${escapeHtml(webgl.notAppliedRenderAppearanceFields.join(", ") || "-")}</dd></div>
      <div><dt>landmarker runningMode</dt><dd>${escapeHtml(landmarker.runningMode)}</dd></div>
      <div><dt>requestedDelegate</dt><dd>${escapeHtml(landmarker.requestedDelegate)}</dd></div>
      <div><dt>instanceReused</dt><dd>${String(landmarker.instanceReused)}</dd></div>
      <div><dt>createCount</dt><dd>${formatNullableCount(landmarker.createCount)}</dd></div>
      <div><dt>P_camera</dt><dd>${escapeHtml(formatPoseMappingPose(runtime.P_camera))}</dd></div>
      <div><dt>p</dt><dd>${escapeHtml(formatPoseMappingPose(runtime.p))}</dd></div>
      <div><dt>Canvas2D P_confirm</dt><dd>${escapeHtml(formatPose(runtime.canvas2dConfirm.P_confirm))}</dd></div>
      <div><dt>Canvas2D poseDiff</dt><dd>${escapeHtml(formatPoseMappingDiff(runtime.canvas2dConfirm.poseDiff))}</dd></div>
      <div><dt>WebGL P_confirm</dt><dd>${escapeHtml(formatPose(latestWebglSample?.P_confirm ?? { yaw: null, pitch: null, roll: null }))}</dd></div>
      <div><dt>WebGL poseDiff</dt><dd>${escapeHtml(formatPoseMappingDiff(latestWebglSample?.poseDiff ?? { yaw: null, pitch: null, roll: null, magnitude: null }))}</dd></div>
      <div><dt>error</dt><dd>${escapeHtml(benchmark.errorMessage ?? webgl.errorMessage ?? "-")}</dd></div>
    </dl>
    ${renderWebglObjBenchmarkCaseSummariesHtml(result?.cases ?? [])}
    ${renderWebglObjBenchmarkInterpretationHtml(result?.conclusionHints ?? null)}
    <p class="control-note">WebGL renderer は通常 runtime と p,P dataset 生成の本線です。renderer 条件が変わった場合は WebGL 条件で p,P dataset と poseMappingProfile を作り直します。</p>
  `
}

function renderWebglObjBenchmarkCaseSummariesHtml(cases: WebglObjBenchmarkCaseResult[]) {
  if (cases.length === 0) {
    return `<p class="placeholder-text">WebGL OBJ benchmark 結果はまだありません。</p>`
  }

  return cases.map((caseResult) => `
    <div class="debug-subsection">
      <h4>${escapeHtml(caseResult.label)}</h4>
      <dl class="summary-list">
        <div><dt>caseId</dt><dd>${escapeHtml(caseResult.caseId)}</dd></div>
        <div><dt>rendererKind</dt><dd>${escapeHtml(caseResult.rendererKind)}</dd></div>
        <div><dt>handoffStrategy</dt><dd>${escapeHtml(caseResult.handoffStrategy)}</dd></div>
        <div><dt>detectedCount</dt><dd>${formatNullableCount(caseResult.detectedCount)}</dd></div>
        <div><dt>failedCount</dt><dd>${formatNullableCount(caseResult.failedCount)}</dd></div>
        <div><dt>webglRenderMs</dt><dd>${escapeHtml(formatDetectPerformanceTimingSummary(caseResult.summary.webglRenderMs))}</dd></div>
        <div><dt>finishMs</dt><dd>${escapeHtml(formatDetectPerformanceTimingSummary(caseResult.summary.finishMs))}</dd></div>
        <div><dt>readPixelsMs</dt><dd>${escapeHtml(formatDetectPerformanceTimingSummary(caseResult.summary.readPixelsMs))}</dd></div>
        <div><dt>bitmapCreateMs</dt><dd>${escapeHtml(formatDetectPerformanceTimingSummary(caseResult.summary.bitmapCreateMs))}</dd></div>
        <div><dt>copyTo2dMs</dt><dd>${escapeHtml(formatDetectPerformanceTimingSummary(caseResult.summary.copyTo2dMs))}</dd></div>
        <div><dt>detectMs</dt><dd>${escapeHtml(formatDetectPerformanceTimingSummary(caseResult.summary.detectMs))}</dd></div>
        <div><dt>totalMs</dt><dd>${escapeHtml(formatDetectPerformanceTimingSummary(caseResult.summary.totalMs))}</dd></div>
        <div><dt>poseDiff magnitude</dt><dd>${escapeHtml(formatDetectPerformanceTimingSummary(caseResult.summary.poseDiffMagnitude))}</dd></div>
        <div><dt>notes</dt><dd>${escapeHtml(caseResult.notes.join(", ") || "-")}</dd></div>
      </dl>
    </div>
  `).join("")
}

function renderWebglObjBenchmarkInterpretationHtml(hints: WebglObjBenchmarkConclusionHints | null) {
  const summary = hints
    ? `${hints.recommendation} bestWebgl=${hints.bestWebglStrategy ?? "-"} / total avg ${formatRealtimeNullableNumber(hints.bestWebglTotalAvgMs)} / Canvas2D immediate avg ${formatRealtimeNullableNumber(hints.canvas2dImmediateTotalAvgMs)}`
    : "benchmark 実行後に WebGL と Canvas2D baseline の比較を表示します。"
  return `
    <div class="debug-subsection">
      <h4>Interpretation（解釈）</h4>
      <p class="control-note">${escapeHtml(summary)}</p>
      <ul class="debug-note-list">
        <li>WebGL render -> detect が Canvas2D immediate より大幅に軽い場合、WebGL renderer 本線化を検討する価値があります。</li>
        <li>WebGL render only は軽いが detect が重い場合、WebGL canvas から MediaPipe への受け渡しで同期コストが残っています。</li>
        <li>WebGL readPixels / gl.finish で detect が軽くなる場合、同期コストの位置を制御できる可能性があります。</li>
        <li>WebGL が速いが poseDiff が悪い場合、WebGL見た目条件で p,P dataset / poseMappingProfile の再作成が必要です。</li>
        <li>WebGL でも total が大きい場合、毎フレーム OBJ render -> detect 方式以外を検討します。</li>
      </ul>
    </div>
  `
}

function createWebglObjBenchmarkSupportPreview(): WebglObjBenchmarkSupport {
  const info = getWebglInfo()
  return {
    supported: info.available,
    contextType: info.available ? "webgl" : null,
    rendererInfo: info.renderer,
    vendorInfo: info.vendor,
    shaderCompileStatus: webglObjBenchmarkRenderer ? "ok" : "not_initialized",
    bufferStatus: webglObjBenchmarkRenderer ? "ok" : "not_initialized",
    projectionMode: "orthographic",
    cameraScale: state.poseMappingRuntime.renderAppearanceApplied?.camera.scale ?? null,
    cameraVerticalOffset: state.poseMappingRuntime.renderAppearanceApplied?.camera.verticalOffset ?? null,
    renderResolution: state.poseMappingRuntime.renderAppearanceApplied?.renderResolution ?? null,
    notAppliedRenderAppearanceFields: ["material.specular", "lighting.castShadow", "camera.fovDeg", "camera.projection"],
    errorMessage: null,
  }
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
      <h3>デバッグカウンタ（Debug counters）</h3>
      <dl class="summary-list">
        <div><dt>rvfcCallbackCount</dt><dd>${summary.debugCounters.rvfcCallbackCount}</dd></div>
        <div><dt>processedFrameCount</dt><dd>${summary.debugCounters.processedFrameCount}</dd></div>
        <div><dt>intentionalSkipCount</dt><dd>${summary.debugCounters.intentionalSkipCount}</dd></div>
        <div><dt>timestampSkipCount</dt><dd>${summary.debugCounters.timestampSkipCount}</dd></div>
        <div><dt>busySkipCount</dt><dd>${summary.debugCounters.busySkipCount}</dd></div>
        <div><dt>missingMediaTimeSkipCount</dt><dd>${summary.debugCounters.missingMediaTimeSkipCount}</dd></div>
        <div><dt>presentedFramesDeltaSummary</dt><dd>${formatTimingDistribution(summary.debugCounters.presentedFramesDeltaSummary)}</dd></div>
        <div><dt>callbackWallDeltaMs</dt><dd>${formatTimingDistribution(summary.debugCounters.callbackWallDeltaMs)}</dd></div>
        <div><dt>mediaTimeDeltaMs</dt><dd>${formatTimingDistribution(summary.debugCounters.mediaTimeDeltaMs)}</dd></div>
        <div><dt>processingMeasuredMs</dt><dd>${formatTimingDistribution(summary.debugCounters.processingMeasuredMs)}</dd></div>
        <div><dt>unmeasuredOverheadEstimateMs</dt><dd>${formatTimingDistribution(summary.debugCounters.unmeasuredOverheadEstimateMs)}</dd></div>
        <div><dt>latest callbackWallDeltaMs</dt><dd>${formatNullableNumber(summary.debugCounters.latestCallbackWallDeltaMs)}</dd></div>
        <div><dt>latest mediaTimeDeltaMs</dt><dd>${formatNullableNumber(summary.debugCounters.latestMediaTimeDeltaMs)}</dd></div>
        <div><dt>latest processingMeasuredMs</dt><dd>${formatNullableNumber(summary.debugCounters.latestProcessingMeasuredMs)}</dd></div>
        <div><dt>latest unmeasuredOverheadEstimateMs</dt><dd>${formatNullableNumber(summary.debugCounters.latestUnmeasuredOverheadEstimateMs)}</dd></div>
        <div><dt>nextCallbackRegistrationTiming</dt><dd>${summary.debugCounters.nextCallbackRegistrationTiming}</dd></div>
      </dl>
    </section>

    <section class="debug-section">
      <h3>デバッグオプション（Debug options）</h3>
      <div class="mode-comparison-debug-options">
        <label class="overlay-toggle">
          <input type="checkbox" data-control="mode-comparison-preview-snapshot-enabled" ${comparison.debugOptions.previewSnapshotEnabled ? "checked" : ""} ${comparison.status === "running" ? "disabled" : ""} />
          <span>preview snapshot（プレビュー画像保存）を有効化</span>
        </label>
        <label class="number-field">
          <span>UI state update interval（UI状態更新間隔frames）</span>
          <input type="number" min="1" step="1" data-control="mode-comparison-ui-update-interval" value="${comparison.debugOptions.uiUpdateIntervalFrames}" ${comparison.status === "running" ? "disabled" : ""} />
        </label>
        <label class="number-field">
          <span>summary update interval（要約更新間隔frames）</span>
          <input type="number" min="1" step="1" data-control="mode-comparison-summary-update-interval" value="${comparison.debugOptions.summaryUpdateIntervalFrames}" ${comparison.status === "running" ? "disabled" : ""} />
        </label>
      </div>
      <p class="control-note">raw per-frame result（フレームごとの結果）は維持し、UI反映と summary 再描画だけを間引きます。</p>
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
        <div><dt>totalFrameProcessingMs の範囲</dt><dd>drawImage、detect()、detectForVideo() を含みます。frame result構築、raw frames push、UI state update、summary再描画、preview snapshot toDataURL は含みません。</dd></div>
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
  options: {
    directPose?: boolean
    appearanceOverride?: AppliedObjRenderAppearanceProfile
    forceRenderResolution?: boolean
  } = {},
): RenderedIdealRenderSummary {
  const context = canvas.getContext("2d")
  if (!context) {
    return createRenderedIdealRenderSummary("error", {
      errorMessage: "2D canvas context を取得できませんでした。",
    })
  }

  const appearance = options.appearanceOverride ?? getAppliedObjRenderAppearanceProfile()
  const rect = canvas.getBoundingClientRect()
  const fallbackCssWidth = rect.width > 0 ? rect.width : RENDERED_IDEAL_FALLBACK_CANVAS_SIZE
  const fallbackCssHeight = rect.height > 0 ? rect.height : RENDERED_IDEAL_FALLBACK_CANVAS_SIZE
  const dpr = window.devicePixelRatio || 1
  const useProfileResolution = options.forceRenderResolution ?? appearance.id !== "current"
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

  const previewState = options.directPose
    ? getDirectObjPosePreviewState(renderPose)
    : getObjPoseSyncPreviewState(renderPose)
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
    rect.width <= 0 ||
    rect.height <= 0
  ) {
    return
  }

  const displayedContentRect = getDisplayedContentRect(
    state.liveVideo,
    liveVideoElement,
    rect.width,
    rect.height,
  )
  state.poseMappingRuntime.alignment = {
    ...state.poseMappingRuntime.alignment,
    displayedContentRect,
  }

  const current478 = state.currentAnalysis.landmarks478.length === REQUIRED_LANDMARK_COUNT
    ? state.currentAnalysis.landmarks478
    : null
  const alignedRenderedIdeal478 = state.poseMappingRuntime.alignedRenderedIdeal478
  const meshSourceVertices = state.poseMappingRuntime.meshSourceVertices
  const meshTargetVertices = state.poseMappingRuntime.meshTargetVertices
  const canDrawAlignedIdeal = canDrawPoseMappingAlignedIdealOverlay()

  if (
    canDrawAlignedIdeal &&
    state.overlay.showMeshPairs &&
    current478 &&
    alignedRenderedIdeal478 &&
    alignedRenderedIdeal478.length === REQUIRED_LANDMARK_COUNT
  ) {
    drawLandmarkPairLines(
      context,
      displayedContentRect,
      current478,
      alignedRenderedIdeal478,
      "rgba(48, 118, 92, 0.34)",
    )
  }

  if (
    state.overlay.showMeshSource &&
    meshSourceVertices &&
    meshSourceVertices.length === REQUIRED_LANDMARK_COUNT
  ) {
    drawLandmarkPoints(
      context,
      displayedContentRect,
      meshSourceVertices,
      "rgba(41, 92, 218, 0.55)",
      1.1,
    )
  }

  if (
    canDrawAlignedIdeal &&
    state.overlay.showMeshTarget &&
    meshTargetVertices &&
    meshTargetVertices.length === REQUIRED_LANDMARK_COUNT
  ) {
    drawLandmarkPoints(
      context,
      displayedContentRect,
      meshTargetVertices,
      "rgba(238, 142, 52, 0.58)",
      1.1,
    )
  }

  if (
    canDrawAlignedIdeal &&
    state.overlay.showAlignedIdealLandmarks478 &&
    alignedRenderedIdeal478 &&
    alignedRenderedIdeal478.length === REQUIRED_LANDMARK_COUNT
  ) {
    drawLandmarkPoints(
      context,
      displayedContentRect,
      alignedRenderedIdeal478,
      "rgba(220, 71, 94, 0.86)",
      1.35,
    )
  }

  if (state.overlay.showCurrentLandmarks478 && current478) {
    drawLandmarkPoints(
      context,
      displayedContentRect,
      current478,
      "rgba(79, 128, 255, 0.9)",
      1.45,
    )
  }

  if (state.overlay.showGridAnchors && current478) {
    if (canDrawAlignedIdeal) {
      drawPoseMappingBoundsDebug(context, displayedContentRect, state.poseMappingRuntime.alignment)
    }
    drawAlignmentAnchors(
      context,
      displayedContentRect,
      current478,
      state.poseMappingRuntime.alignment.anchorIndices,
    )
  }

  if (state.overlay.showExcludedLandmarks && current478) {
    drawExcludedLandmarks(
      context,
      displayedContentRect,
      current478,
      state.poseMappingRuntime.alignment.landmarkReasons,
    )
  }
}

function drawPoseMappingBoundsDebug(
  context: CanvasRenderingContext2D,
  displayedContentRect: Rect,
  alignment: PoseMappingAlignmentState,
) {
  if (alignment.mode !== "bounds_center_scale_v1") {
    return
  }
  drawNormalizedBounds(context, displayedContentRect, alignment.currentBoundsImage, "rgba(79, 128, 255, 0.72)")
  drawNormalizedBounds(context, displayedContentRect, alignment.renderedIdealBoundsImage, "rgba(220, 71, 94, 0.62)")
  drawNormalizedBounds(context, displayedContentRect, alignment.alignedRenderedIdealBoundsImage, "rgba(238, 142, 52, 0.72)")
  drawNormalizedCenter(context, displayedContentRect, alignment.currentBoundsImage, "rgba(79, 128, 255, 0.9)")
  drawNormalizedCenter(context, displayedContentRect, alignment.alignedRenderedIdealBoundsImage, "rgba(238, 142, 52, 0.9)")
}

function drawNormalizedBounds(
  context: CanvasRenderingContext2D,
  displayedContentRect: Rect,
  bounds: PoseMappingBounds | null,
  color: string,
) {
  if (!bounds) {
    return
  }
  const min = normalizedLandmarkToPreviewPixel({ x: bounds.minX, y: bounds.minY }, displayedContentRect)
  const max = normalizedLandmarkToPreviewPixel({ x: bounds.maxX, y: bounds.maxY }, displayedContentRect)
  context.save()
  context.strokeStyle = color
  context.lineWidth = 1.1
  context.strokeRect(min.x, min.y, max.x - min.x, max.y - min.y)
  context.restore()
}

function drawNormalizedCenter(
  context: CanvasRenderingContext2D,
  displayedContentRect: Rect,
  bounds: PoseMappingBounds | null,
  color: string,
) {
  if (!bounds) {
    return
  }
  const point = normalizedLandmarkToPreviewPixel(
    {
      x: bounds.minX + bounds.width / 2,
      y: bounds.minY + bounds.height / 2,
    },
    displayedContentRect,
  )
  context.save()
  context.fillStyle = color
  context.beginPath()
  context.arc(point.x, point.y, 3, 0, Math.PI * 2)
  context.fill()
  context.restore()
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
}

function canDrawPoseMappingAlignedIdealOverlay() {
  const runtime = state.poseMappingRuntime
  const overlayLifecycle = createOverlayLifecycleFromRuntime(runtime)
  return (
    overlayLifecycle.alignedRenderedIdealVisible &&
    runtime.overlayLifecycle.alignedRenderedIdealVisible &&
    runtime.overlayLifecycle.generationMatch &&
    runtime.overlayLifecycle.tokenMatch
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

function drawLandmarkPairLines(
  context: CanvasRenderingContext2D,
  displayedContentRect: Rect,
  source: ReferenceLandmark[],
  target: ReferenceLandmark[],
  color: string,
) {
  context.save()
  context.strokeStyle = color
  context.lineWidth = 0.8
  context.beginPath()
  for (let index = 0; index < Math.min(source.length, target.length); index += 1) {
    const sourcePoint = normalizedLandmarkToPreviewPixel(source[index], displayedContentRect)
    const targetPoint = normalizedLandmarkToPreviewPixel(target[index], displayedContentRect)
    context.moveTo(sourcePoint.x, sourcePoint.y)
    context.lineTo(targetPoint.x, targetPoint.y)
  }
  context.stroke()
  context.restore()
}

function drawAlignmentAnchors(
  context: CanvasRenderingContext2D,
  displayedContentRect: Rect,
  landmarks: ReferenceLandmark[],
  anchorIndices: number[],
) {
  if (anchorIndices.length === 0) {
    return
  }
  context.save()
  context.strokeStyle = "rgba(26, 132, 150, 0.82)"
  context.lineWidth = 1.1
  for (const index of anchorIndices) {
    const landmark = landmarks[index]
    if (!landmark) {
      continue
    }
    const point = normalizedLandmarkToPreviewPixel(landmark, displayedContentRect)
    context.beginPath()
    context.arc(point.x, point.y, 2.5, 0, Math.PI * 2)
    context.stroke()
  }
  context.restore()
}

function drawExcludedLandmarks(
  context: CanvasRenderingContext2D,
  displayedContentRect: Rect,
  landmarks: ReferenceLandmark[],
  landmarkReasons: Array<PoseMappingExcludedReason[]>,
) {
  if (landmarkReasons.length === 0) {
    return
  }
  context.save()
  context.fillStyle = "rgba(153, 80, 180, 0.9)"
  context.strokeStyle = "rgba(255, 255, 255, 0.9)"
  context.lineWidth = 0.8
  for (let index = 0; index < Math.min(landmarks.length, landmarkReasons.length); index += 1) {
    if (landmarkReasons[index].length === 0) {
      continue
    }
    const point = normalizedLandmarkToPreviewPixel(landmarks[index], displayedContentRect)
    context.beginPath()
    context.arc(point.x, point.y, 2.2, 0, Math.PI * 2)
    context.fill()
    context.stroke()
  }
  context.restore()
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

  if (state.activeDebugTab === "poseMapping") {
    content.appendChild(renderPoseMappingDebugTab())
    return
  }

  if (state.activeDebugTab === "placementAnalysis") {
    content.appendChild(renderPlacementFunctionAnalysisDebugTab())
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
  const rendererSignature = objPoseMappingDataset?.renderer?.rendererSignature
    ?? createWebglObjRendererSignature(getAppliedObjRenderAppearanceProfile())
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
    ["p,P dataset render backend", "webgl"],
    ["dataset schema", "obj_pose_mapping_dataset_v3"],
    ["renderer signature", rendererSignature],
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

function getPlacementFunctionAnalysisRawSummary() {
  return {
    status: state.placementAnalysis.status,
    startedAt: state.placementAnalysis.startedAt,
    completedAt: state.placementAnalysis.completedAt,
    latestError: state.placementAnalysis.latestError,
    runOptions: state.placementAnalysis.runOptions,
    summary: state.placementAnalysis.summary,
    selectedSampleIndex: state.placementAnalysis.selectedSampleIndex,
    latestSample: state.placementAnalysis.samples.length > 0
      ? stripPlacementFunctionAnalysisSampleState(state.placementAnalysis.samples[state.placementAnalysis.samples.length - 1])
      : null,
    candidateAvailable: Boolean(state.placementAnalysis.candidate),
    candidateMetrics: state.placementAnalysis.candidate?.metrics ?? null,
    candidateUnavailableReason: state.placementAnalysis.candidateUnavailableReason,
  }
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
    poseMappingProfile: getPoseMappingProfileRawSummary(),
    poseMappingRuntime: getPoseMappingRuntimeRawSummary(),
    renderedIdeal: {
      renderStatus: state.renderedIdeal.summary.status,
      renderMode: state.renderedIdeal.summary.renderMode,
      mediaPipeStatus: state.renderedIdeal.detection.status,
      renderedIdeal478Count: state.renderedIdeal.detection.landmarkCount,
      renderedIdealPose: roundPoseForState(state.renderedIdeal.detection.pose),
    },
    objPoseDatasetGenerationState: getObjPoseCalibrationRawSummary(),
    objPoseMapping: getObjPoseMappingDebugExport(),
    placementAnalysis: getPlacementFunctionAnalysisRawSummary(),
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
    matrix: null,
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

function createDefaultPoseMappingProfileState(): PoseMappingProfileState {
  return {
    loaded: false,
    fileName: null,
    fileSize: null,
    profile: null,
    errorMessage: null,
    warnings: [],
  }
}

function createDefaultAssetGeneration(): AssetGeneration {
  return {
    objGenerationId: 1,
    profileGenerationId: 1,
    renderSettingsGenerationId: 1,
    rendererGenerationId: 1,
  }
}

function createInitialAssetLifecycle(): AssetLifecycle {
  return {
    objStatus: "missing",
    profileStatus: "missing",
    rendererStatus: "missing",
    profileRendererMatch: false,
    ...createDefaultAssetGeneration(),
  }
}

function incrementObjGeneration() {
  state.assetGeneration.objGenerationId += 1
}

function incrementProfileGeneration() {
  state.assetGeneration.profileGenerationId += 1
}

function incrementRenderSettingsGeneration() {
  state.assetGeneration.renderSettingsGenerationId += 1
}

function incrementRendererGeneration() {
  state.assetGeneration.rendererGenerationId += 1
}

function createDefaultPoseMappingRuntimeState(): PoseMappingRuntimeState {
  return {
    status: "idle",
    currentFaceStatus: "missing",
    renderedIdealStatus: "missing",
    alignmentStatus: "skipped_no_current_face",
    alignmentSkippedReason: "no_current_face",
    poseMappingStatus: "ready",
    poseMappingSkippedReason: "none",
    fallbackPoseUsed: false,
    fallbackRenderedIdealUsed: false,
    lastGood: createEmptyPoseMappingLastGoodState(),
    stale: createEmptyPoseMappingStaleState(),
    noFaceCounters: createEmptyPoseMappingNoFaceCounters(),
    lastUpdatedAt: null,
    P_camera: null,
    P_cameraClamped: null,
    qualityGate: {
      usable: false,
      reasons: [],
    },
    p: null,
    selectedLeaf: null,
    usedExpert: null,
    usedFallback: false,
    warnings: [],
    P_confirm: {
      yaw: null,
      pitch: null,
      roll: null,
    },
    poseDiff: {
      yaw: null,
      pitch: null,
      roll: null,
      magnitude: null,
    },
    renderedIdealDetected: false,
    renderedIdealLandmarkCount: null,
    renderedIdeal478: null,
    renderedIdealToken: null,
    alignedRenderedIdeal478: null,
    alignedRenderedIdealToken: null,
    current478: null,
    meshSourceVertices: null,
    meshTargetVertices: null,
    alignment: createEmptyPoseMappingAlignmentState(),
    canvasWidth: 0,
    canvasHeight: 0,
    detectCanvasWidth: 0,
    detectCanvasHeight: 0,
    previewCanvasWidth: 0,
    previewCanvasHeight: 0,
    renderSettings: null,
    renderAppearanceApplied: null,
    renderBackend: "webgl",
    renderer: null,
    profileRendererMatch: false,
    profileMismatchError: null,
    assetLifecycle: createInitialAssetLifecycle(),
    frameLifecycle: null,
    renderedIdealLifecycle: createEmptyRenderedIdealLifecycle(),
    overlayLifecycle: createInitialOverlayLifecycle(),
    profileEvaluateMs: null,
    renderMs: null,
    detectMs: null,
    totalMs: null,
    previewDataUrl: null,
    errorMessage: null,
  }
}

function createEmptyPoseMappingLastGoodState(): PoseMappingLastGoodState {
  return {
    hasLastGood: false,
    P_camera: null,
    p: null,
    P_confirm: {
      yaw: null,
      pitch: null,
      roll: null,
    },
    renderedIdeal478: null,
    alignedRenderedIdeal478: null,
    updatedAtMs: null,
    mediaTimeSec: null,
    frameIndex: null,
    ageMs: null,
  }
}

function createEmptyPoseMappingStaleState(): PoseMappingStaleState {
  return {
    isStale: false,
    staleReason: null,
    staleMs: null,
  }
}

function createEmptyPoseMappingNoFaceCounters(): PoseMappingNoFaceCounters {
  return {
    currentFaceMissingCount: 0,
    poseMappingSkippedNoCurrentFaceCount: 0,
    recoveredFromNoCurrentFaceCount: 0,
  }
}

function createAssetLifecycle(profileRendererMatch: boolean): AssetLifecycle {
  return {
    objStatus: getObjAssetStatus(),
    profileStatus: getProfileAssetStatus(),
    rendererStatus: webglObjBenchmarkRenderer ? "ready" : "missing",
    profileRendererMatch,
    ...state.assetGeneration,
  }
}

function createFrameGeneration(): FrameGeneration {
  const mediaTimeSec =
    state.currentAnalysis.analyzedTimeSec ??
    state.liveVideo.currentTimeSec ??
    state.realtimeDebug.lastVideoFrameMediaTimeSec ??
    null
  const frame = {
    frameId: state.nextFrameId,
    mediaTimeSec,
    startedAtMs: performance.now(),
  }
  state.nextFrameId += 1
  return frame
}

function createRenderedIdealFrameToken(
  frame: FrameGeneration,
  p: ObjPoseMappingPose,
): RenderedIdealFrameToken {
  return {
    ...state.assetGeneration,
    frameId: frame.frameId,
    mediaTimeSec: frame.mediaTimeSec,
    p: { ...p },
  }
}

function renderedIdealFrameTokensEqual(
  first: RenderedIdealFrameToken | null,
  second: RenderedIdealFrameToken | null,
) {
  if (!first || !second) {
    return false
  }
  return (
    first.objGenerationId === second.objGenerationId &&
    first.profileGenerationId === second.profileGenerationId &&
    first.renderSettingsGenerationId === second.renderSettingsGenerationId &&
    first.rendererGenerationId === second.rendererGenerationId &&
    first.frameId === second.frameId &&
    first.mediaTimeSec === second.mediaTimeSec &&
    posesEqual(first.p, second.p)
  )
}

function renderedIdealFrameTokenMatchesFrame(
  token: RenderedIdealFrameToken | null,
  frame: FrameLifecycle | null,
) {
  return (
    token !== null &&
    frame !== null &&
    token.frameId === frame.frameId &&
    token.mediaTimeSec === frame.mediaTimeSec
  )
}

function isRenderedIdealFrameTokenCurrent(token: RenderedIdealFrameToken | null) {
  if (!token) {
    return false
  }
  return (
    token.objGenerationId === state.assetGeneration.objGenerationId &&
    token.profileGenerationId === state.assetGeneration.profileGenerationId &&
    token.renderSettingsGenerationId === state.assetGeneration.renderSettingsGenerationId &&
    token.rendererGenerationId === state.assetGeneration.rendererGenerationId
  )
}

function getObjAssetStatus(): AssetStatus {
  if (!state.objFile.loaded) {
    return "missing"
  }
  if (state.objSummary.parseStatus === "parsed") {
    return "ready"
  }
  if (state.objSummary.parseStatus === "error") {
    return "error"
  }
  return "loading"
}

function getProfileAssetStatus(): AssetStatus {
  if (state.poseMappingProfile.loaded && state.poseMappingProfile.profile) {
    return "ready"
  }
  return state.poseMappingProfile.errorMessage ? "error" : "missing"
}

function createFrameLifecycle(
  frame: FrameGeneration | null,
  currentFaceStatus: PoseMappingCurrentFaceStatus,
  poseMappingStatus: PoseMappingStatus,
  renderedIdealStatus: RenderedIdealStatus,
  alignmentStatus: PoseMappingAlignmentStatus,
  overlayIdealVisible: boolean,
  overlaySkippedReason: string,
): FrameLifecycle | null {
  return frame
    ? {
        ...frame,
        currentFaceStatus,
        poseMappingStatus,
        renderedIdealStatus,
        alignmentStatus,
        overlayIdealVisible,
        overlaySkippedReason,
      }
    : null
}

function createEmptyRenderedIdealLifecycle(): RenderedIdealLifecycle {
  return {
    renderAttempted: false,
    renderSucceeded: false,
    detectAttempted: false,
    detectSucceeded: false,
    renderToken: null,
    detectTokenMatchesRenderToken: false,
    detectCanvasWasClearedBeforeRender: false,
    staleCanvasDetected: false,
    fallbackRenderedIdealUsed: false,
    renderPose: createEmptyRenderPoseLifecycleDebug(),
  }
}

function createEmptyRenderPoseLifecycleDebug(): RenderPoseLifecycleDebug {
  return {
    requestedPoseP: null,
    renderCallPoseP: null,
    previewStatePoseP: null,
    bufferBuildPoseP: null,
    webglUniformPoseP: null,
    actualRenderPoseP: null,
    renderPoseSource: "unknown",
    buffer: createEmptyRenderBufferPoseDebug(),
    detectCanvas: createEmptyDetectCanvasPoseState(),
    recovery: createEmptyPoseRecoveryDebug(),
    renderPoseAppliedToWebGL: false,
    renderPoseMatchesToken: false,
    renderPoseMismatchReason: null,
  }
}

function createEmptyRenderBufferPoseDebug(): RenderBufferPoseDebug {
  return {
    bufferPoseMode: "unknown",
    bufferPoseP: null,
    bufferGenerationId: null,
    bufferReused: false,
    bufferReuseReason: null,
  }
}

function createEmptyDetectCanvasPoseState(): DetectCanvasPoseState {
  return {
    canvasGenerationId: 0,
    canvasLastRenderedToken: null,
    canvasLastRenderedPoseP: null,
    canvasPoseMatchesRenderToken: false,
    canvasWasClearedBeforeRender: false,
    drawCompletedForToken: false,
  }
}

function createEmptyPoseRecoveryDebug(): PoseRecoveryDebug {
  return {
    previousFrameStatus: null,
    currentFrameStatus: "not_ready",
    recoveredFromNoCurrentFace: false,
    recoveredFromNoRenderedIdeal: false,
    recoveredFromAlignmentSkip: false,
    recoveryFrameId: null,
    recoveryMediaTimeSec: null,
    poseBeforeSkip: null,
    poseAfterRecovery: null,
    rendererWasReinitialized: false,
    webglContextWasRecreated: false,
    buffersWereRebuiltAfterRecovery: false,
    uniformsWereResetAfterRecovery: false,
  }
}

function createRenderPoseLifecycleDebug(input: {
  requestedPoseP: ObjPoseMappingPose | null
  renderResult: WebglObjRenderResult | null
  renderPoseSource: RenderPoseSource
  renderToken: RenderedIdealFrameToken | null
  detectCanvas: DetectCanvasPoseState | null
  recovery: PoseRecoveryDebug | null
}): RenderPoseLifecycleDebug {
  const requestedPoseP = roundPoseMappingPose(input.requestedPoseP)
  const renderCallPoseP = roundPoseMappingPose(input.renderResult?.renderCallPoseP ?? null)
  const previewStatePoseP = roundPoseMappingPose(input.renderResult?.previewStatePoseP ?? null)
  const bufferBuildPoseP = roundPoseMappingPose(input.renderResult?.bufferBuildPoseP ?? null)
  const webglUniformPoseP = roundPoseMappingPose(input.renderResult?.webglUniformPoseP ?? null)
  const actualRenderPoseP = roundPoseMappingPose(input.renderResult?.actualRenderPoseP ?? null)
  const renderPoseMatchesToken =
    input.renderResult?.actualRenderPoseP !== null &&
    input.renderResult?.actualRenderPoseP !== undefined &&
    input.renderToken !== null &&
    poseMappingPosesApproximatelyEqual(input.renderResult.actualRenderPoseP, input.renderToken.p)
  const renderPoseMismatchReason =
    actualRenderPoseP && input.renderToken && !renderPoseMatchesToken
      ? "render_pose_mismatch_token"
      : null
  return {
    requestedPoseP,
    renderCallPoseP,
    previewStatePoseP,
    bufferBuildPoseP,
    webglUniformPoseP,
    actualRenderPoseP,
    renderPoseSource: input.renderPoseSource,
    buffer: roundRenderBufferPoseDebug(input.renderResult?.buffer ?? null),
    detectCanvas: input.detectCanvas ?? createEmptyDetectCanvasPoseState(),
    recovery: input.recovery ?? createEmptyPoseRecoveryDebug(),
    renderPoseAppliedToWebGL: actualRenderPoseP !== null && renderPoseMismatchReason === null,
    renderPoseMatchesToken,
    renderPoseMismatchReason,
  }
}

function poseMappingPosesApproximatelyEqual(
  a: ObjPoseMappingPose,
  b: ObjPoseMappingPose,
  epsilon = 0.000001,
) {
  return (
    Math.abs(a.yaw - b.yaw) <= epsilon &&
    Math.abs(a.pitch - b.pitch) <= epsilon &&
    Math.abs(a.roll - b.roll) <= epsilon
  )
}

function roundRenderBufferPoseDebug(debug: RenderBufferPoseDebug | null): RenderBufferPoseDebug {
  return debug
    ? {
        ...debug,
        bufferPoseP: roundPoseMappingPose(debug.bufferPoseP),
      }
    : createEmptyRenderBufferPoseDebug()
}

function createDetectCanvasPoseState(
  renderToken: RenderedIdealFrameToken | null,
  renderResult: WebglObjRenderResult | null,
  canvasWasClearedBeforeRender: boolean,
  drawCompletedForToken: boolean,
): DetectCanvasPoseState {
  if (drawCompletedForToken) {
    webglDetectCanvasGenerationId += 1
  }
  const canvasLastRenderedPoseP = roundPoseMappingPose(renderResult?.actualRenderPoseP ?? null)
  return {
    canvasGenerationId: webglDetectCanvasGenerationId,
    canvasLastRenderedToken: renderToken,
    canvasLastRenderedPoseP,
    canvasPoseMatchesRenderToken:
      renderToken !== null &&
      renderResult !== null &&
      poseMappingPosesApproximatelyEqual(renderResult.actualRenderPoseP, renderToken.p),
    canvasWasClearedBeforeRender,
    drawCompletedForToken,
  }
}

function buildPoseRecoveryDebug(input: {
  previousRuntime: PoseMappingRuntimeState
  frameGeneration: FrameGeneration | null
  poseAfterRecovery: ObjPoseMappingPose | null
  rendererWasReinitialized: boolean
  webglContextWasRecreated: boolean
  buffersWereRebuiltAfterRecovery: boolean
  uniformsWereResetAfterRecovery: boolean
}): PoseRecoveryDebug {
  const previous = input.previousRuntime
  const recoveredFromNoCurrentFace = previous.poseMappingSkippedReason === "no_current_face"
  const recoveredFromNoRenderedIdeal =
    previous.renderedIdealStatus !== "detected" &&
    previous.renderedIdealStatus !== "missing"
  const recoveredFromAlignmentSkip =
    previous.alignmentStatus !== "completed" &&
    previous.alignmentStatus !== "stale"
  const recovered = recoveredFromNoCurrentFace || recoveredFromNoRenderedIdeal || recoveredFromAlignmentSkip
  return {
    previousFrameStatus: previous.poseMappingStatus,
    currentFrameStatus: input.poseAfterRecovery ? "completed" : "running",
    recoveredFromNoCurrentFace,
    recoveredFromNoRenderedIdeal,
    recoveredFromAlignmentSkip,
    recoveryFrameId: recovered ? input.frameGeneration?.frameId ?? null : null,
    recoveryMediaTimeSec: recovered ? input.frameGeneration?.mediaTimeSec ?? null : null,
    poseBeforeSkip: roundPoseMappingPose(previous.p),
    poseAfterRecovery: roundPoseMappingPose(input.poseAfterRecovery),
    rendererWasReinitialized: input.rendererWasReinitialized,
    webglContextWasRecreated: input.webglContextWasRecreated,
    buffersWereRebuiltAfterRecovery: recovered && input.buffersWereRebuiltAfterRecovery,
    uniformsWereResetAfterRecovery: recovered && input.uniformsWereResetAfterRecovery,
  }
}

function isPoseRecoveryFrame(recovery: PoseRecoveryDebug) {
  return (
    recovery.recoveredFromNoCurrentFace ||
    recovery.recoveredFromNoRenderedIdeal ||
    recovery.recoveredFromAlignmentSkip
  )
}

function finalizeRenderPoseLifecycleDebug(
  lifecycle: RenderPoseLifecycleDebug,
  P_confirm: ReferencePose,
): RenderPoseLifecycleDebug {
  const renderPoseNotAppliedWarning = getRenderPoseNotAppliedWarning(lifecycle.requestedPoseP, P_confirm)
  return {
    ...lifecycle,
    renderPoseAppliedToWebGL:
      lifecycle.renderPoseAppliedToWebGL &&
      lifecycle.renderPoseMatchesToken &&
      renderPoseNotAppliedWarning === null,
    renderPoseMismatchReason: renderPoseNotAppliedWarning ?? lifecycle.renderPoseMismatchReason,
  }
}

function getRenderPoseNotAppliedWarning(
  requestedPoseP: ObjPoseMappingPose | null,
  P_confirm: ReferencePose,
) {
  if (!requestedPoseP || P_confirm.yaw === null || P_confirm.roll === null) {
    return null
  }
  const requestedMagnitude =
    Math.abs(requestedPoseP.yaw) +
    Math.abs(requestedPoseP.pitch) +
    Math.abs(requestedPoseP.roll)
  const confirmLooksNearFront = Math.abs(P_confirm.yaw) < 3 && Math.abs(P_confirm.roll) < 3
  return requestedMagnitude > 15 && confirmLooksNearFront ? "render_pose_not_applied" : null
}

function createInitialOverlayLifecycle(): OverlayLifecycle {
  return {
    current478Visible: false,
    alignedRenderedIdealVisible: false,
    correspondenceLinesVisible: false,
    meshTargetVisible: false,
    triangleTargetVisible: false,
    lastGoodUsedForOverlay: false,
    generationMatch: false,
    tokenMatch: false,
    renderPoseValid: false,
    skippedReason: "not_ready",
  }
}

function createOverlayLifecycle(visible: boolean, skippedReason: string): OverlayLifecycle {
  return {
    current478Visible: state.currentAnalysis.status === "detected",
    alignedRenderedIdealVisible: visible,
    correspondenceLinesVisible: visible && state.overlay.showMeshPairs,
    meshTargetVisible: visible && state.overlay.showMeshTarget,
    triangleTargetVisible: false,
    lastGoodUsedForOverlay: false,
    generationMatch: visible,
    tokenMatch: visible,
    renderPoseValid: visible,
    skippedReason,
  }
}

function createOverlayLifecycleFromRuntime(
  runtime: Pick<
    PoseMappingRuntimeState,
    | "currentFaceStatus"
    | "renderedIdealStatus"
    | "alignmentStatus"
    | "fallbackRenderedIdealUsed"
    | "alignedRenderedIdeal478"
    | "renderedIdealToken"
    | "alignedRenderedIdealToken"
    | "profileRendererMatch"
    | "frameLifecycle"
    | "renderedIdealLifecycle"
  >,
): OverlayLifecycle {
  const generationMatch =
    isRenderedIdealFrameTokenCurrent(runtime.renderedIdealToken) &&
    isRenderedIdealFrameTokenCurrent(runtime.alignedRenderedIdealToken)
  const tokenMatch =
    renderedIdealFrameTokensEqual(runtime.renderedIdealToken, runtime.alignedRenderedIdealToken) &&
    renderedIdealFrameTokenMatchesFrame(runtime.renderedIdealToken, runtime.frameLifecycle) &&
    renderedIdealFrameTokenMatchesFrame(runtime.alignedRenderedIdealToken, runtime.frameLifecycle)
  const assetsReady = getObjAssetStatus() === "ready" && getProfileAssetStatus() === "ready"
  const renderPoseValid =
    !state.poseMappingSettings.hideIdealOverlayWhenRenderPoseNotApplied ||
    runtime.renderedIdealLifecycle.renderPose.renderPoseAppliedToWebGL
  const visible =
    runtime.currentFaceStatus === "detected" &&
    assetsReady &&
    runtime.profileRendererMatch &&
    runtime.renderedIdealStatus === "detected" &&
    runtime.alignmentStatus === "completed" &&
    runtime.alignedRenderedIdeal478 !== null &&
    !runtime.fallbackRenderedIdealUsed &&
    generationMatch &&
    tokenMatch &&
    renderPoseValid
  return {
    current478Visible: runtime.currentFaceStatus === "detected",
    alignedRenderedIdealVisible: visible,
    correspondenceLinesVisible: visible && state.overlay.showMeshPairs,
    meshTargetVisible: visible && state.overlay.showMeshTarget,
    triangleTargetVisible: false,
    lastGoodUsedForOverlay: false,
    generationMatch,
    tokenMatch,
    renderPoseValid,
    skippedReason: visible ? "none" : getOverlayLifecycleSkippedReason(runtime, assetsReady, generationMatch, tokenMatch, renderPoseValid),
  }
}

function getOverlayLifecycleSkippedReason(
  runtime: Pick<
    PoseMappingRuntimeState,
    | "currentFaceStatus"
    | "renderedIdealStatus"
    | "alignmentStatus"
    | "fallbackRenderedIdealUsed"
    | "alignedRenderedIdeal478"
    | "profileRendererMatch"
  >,
  assetsReady: boolean,
  generationMatch: boolean,
  tokenMatch: boolean,
  renderPoseValid: boolean,
) {
  if (runtime.currentFaceStatus !== "detected") {
    return "current_face_not_detected"
  }
  if (getObjAssetStatus() !== "ready") {
    return "obj_not_ready"
  }
  if (getProfileAssetStatus() !== "ready") {
    return "profile_not_ready"
  }
  if (!assetsReady) {
    return "asset_not_ready"
  }
  if (!runtime.profileRendererMatch) {
    return "profile_mismatch"
  }
  if (runtime.renderedIdealStatus !== "detected") {
    return "rendered_ideal_not_detected"
  }
  if (runtime.alignmentStatus !== "completed") {
    return runtime.alignmentStatus
  }
  if (runtime.fallbackRenderedIdealUsed) {
    return "fallback_rendered_ideal"
  }
  if (!runtime.alignedRenderedIdeal478) {
    return "aligned_ideal_missing"
  }
  if (!generationMatch) {
    return "generation_mismatch"
  }
  if (!tokenMatch) {
    return "token_mismatch"
  }
  if (!renderPoseValid) {
    return "render_pose_not_applied"
  }
  return "not_ready"
}

function clearWebglRendererCanvas(renderer: WebglObjRenderer) {
  const gl = renderer.gl
  gl.viewport(0, 0, Math.max(1, renderer.canvas.width), Math.max(1, renderer.canvas.height))
  gl.clearColor(0, 0, 0, 0)
  gl.clear(gl.COLOR_BUFFER_BIT)
}

function clearRuntimeRenderArtifacts(reason: string) {
  state.poseMappingRuntime = {
    ...state.poseMappingRuntime,
    renderedIdealStatus: "missing",
    alignmentStatus: reason === "profile_mismatch" ? "skipped_profile_mismatch" : "stale",
    alignmentSkippedReason: reason === "profile_mismatch" ? "profile_mismatch" : "stale",
    renderedIdealDetected: false,
    renderedIdealLandmarkCount: null,
    renderedIdeal478: null,
    renderedIdealToken: null,
    alignedRenderedIdeal478: null,
    alignedRenderedIdealToken: null,
    meshTargetVertices: null,
    renderedIdealLifecycle: createEmptyRenderedIdealLifecycle(),
    overlayLifecycle: createOverlayLifecycle(false, reason),
    assetLifecycle: createAssetLifecycle(false),
    fallbackRenderedIdealUsed: false,
    errorMessage: reason,
  }
  clearPoseMappingPreviewCanvas()
}

function createEmptyPoseMappingExcludedReasonCounts(): PoseMappingExcludedReasonCounts {
  return {
    iris: 0,
    expressionSensitive: 0,
    invalid: 0,
    unsafe: 0,
    missingCurrent: 0,
    missingIdeal: 0,
    largeDisplacement: 0,
  }
}

function createEmptyPoseMappingDisplacementSummary(): PoseMappingDisplacementSummary {
  return {
    mean: null,
    p50: null,
    p95: null,
    max: null,
  }
}

function createMissingMediaPipeFacePlacement(
  source: MediaPipeFacePlacement["source"],
  reason: string,
): MediaPipeFacePlacement {
  return {
    status: "missing",
    source,
    center: null,
    scale: null,
    warnings: [reason],
  }
}

function createInvalidMediaPipeFacePlacement(
  source: MediaPipeFacePlacement["source"],
  reason: string,
  raw?: MediaPipeFacePlacement["raw"],
): MediaPipeFacePlacement {
  return {
    status: "invalid",
    source,
    center: null,
    scale: null,
    raw,
    warnings: [reason],
  }
}

function createEmptyPoseMappingAlignmentState(
  status: PoseMappingAlignmentStatus = "skipped_no_current_face",
  alignmentSkippedReason: PoseMappingAlignmentSkippedReason = "no_current_face",
): PoseMappingAlignmentState {
  return {
    status,
    mode: DEFAULT_POSE_MAPPING_SETTINGS.alignmentMode,
    rotationApplied: false,
    placementLandmarkSet: DEFAULT_POSE_MAPPING_SETTINGS.placementLandmarkSet,
    scaleBasis: DEFAULT_POSE_MAPPING_SETTINGS.boundsScaleBasis,
    placementSource: "unknown",
    alignmentSkippedReason,
    currentPlacement: createMissingMediaPipeFacePlacement("unknown", "not_ready"),
    idealPlacement: createMissingMediaPipeFacePlacement("unknown", "not_ready"),
    placementScaleRatio: null,
    renderedIdealStatus: "missing",
    anchorCount: 0,
    currentCenter: null,
    idealCenter: null,
    scale: null,
    videoAspectRatio: null,
    renderAspectRatio: null,
    currentBoundsImage: null,
    renderedIdealBoundsImage: null,
    currentBoundsAspectWork: null,
    renderedIdealBoundsAspectWork: null,
    alignedIdealBoundsAspectWork: null,
    alignedRenderedIdealBoundsImage: null,
    displayedContentRect: null,
    placementDebug: buildPlacementDebugState(null, null, null, null),
    boundsCenterScaleDebug: null,
    excludedReasonCounts: createEmptyPoseMappingExcludedReasonCounts(),
    displacementSummary: createEmptyPoseMappingDisplacementSummary(),
    anchorIndices: [],
    landmarkReasons: [],
  }
}

function createDefaultDetectPerformanceState(): DetectPerformanceState {
  return {
    status: "idle",
    startedAt: null,
    completedAt: null,
    errorMessage: null,
    options: {
      warmupRuns: DETECT_PERFORMANCE_DEFAULT_OPTIONS.warmupRuns,
      measuredRuns: DETECT_PERFORMANCE_DEFAULT_OPTIONS.measuredRuns,
      resolutionList: [...DETECT_PERFORMANCE_DEFAULT_OPTIONS.resolutionList],
    },
    result: null,
    notes: [],
  }
}

function createDefaultRenderDetectHandoffState(): RenderDetectHandoffState {
  return {
    status: "idle",
    startedAt: null,
    completedAt: null,
    errorMessage: null,
    options: {
      warmupRuns: RENDER_DETECT_HANDOFF_DEFAULT_OPTIONS.warmupRuns,
      measuredRuns: RENDER_DETECT_HANDOFF_DEFAULT_OPTIONS.measuredRuns,
    },
    result: null,
    notes: [],
  }
}

function createDefaultWebglObjBenchmarkState(): WebglObjBenchmarkState {
  return {
    status: "idle",
    startedAt: null,
    completedAt: null,
    errorMessage: null,
    options: {
      warmupRuns: WEBGL_OBJ_BENCHMARK_DEFAULT_OPTIONS.warmupRuns,
      measuredRuns: WEBGL_OBJ_BENCHMARK_DEFAULT_OPTIONS.measuredRuns,
    },
    result: null,
    notes: [],
  }
}

function createDefaultRenderPoseProbeState(): RenderPoseProbeState {
  return {
    status: "idle",
    runAfterNextRecovery: false,
    lastRunTrigger: null,
    startedAt: null,
    completedAt: null,
    errorMessage: null,
    samples: [],
  }
}

function createDefaultPlacementFunctionAnalysisState(): PlacementFunctionAnalysisState {
  const runOptions = createDefaultPlacementFunctionAnalysisRunOptions()
  return {
    status: "idle",
    startedAt: null,
    completedAt: null,
    latestError: null,
    runOptions,
    samples: [],
    selectedSampleIndex: null,
    showOverlay: true,
    summary: createPlacementFunctionAnalysisSummary([]),
    candidate: null,
    candidateUnavailableReason: "usable sample count too small",
  }
}

function createDefaultPlacementFunctionAnalysisRunOptions(): PlacementFunctionAnalysisRunOptions {
  const canvasWidth = PLACEMENT_ANALYSIS_DEFAULT_CANVAS_SIZE.width
  const canvasHeight = PLACEMENT_ANALYSIS_DEFAULT_CANVAS_SIZE.height
  return {
    centerImageXValues: [...PLACEMENT_ANALYSIS_CENTER_VALUES],
    centerImageYValues: [...PLACEMENT_ANALYSIS_CENTER_VALUES],
    visualScaleInputValues: [...PLACEMENT_ANALYSIS_SCALE_VALUES],
    poseSet: "front",
    renderAspectRatio: canvasWidth / canvasHeight,
    canvasWidth,
    canvasHeight,
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
    matrix: null,
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
    debugOptions: createDefaultModeComparisonDebugOptions(),
    debugCounters: createEmptyModeComparisonDebugCounters(),
  }
}

function createDefaultModeComparisonDebugOptions(): ModeComparisonDebugOptions {
  return {
    previewSnapshotEnabled: true,
    uiUpdateIntervalFrames: 30,
    summaryUpdateIntervalFrames: 30,
  }
}

function createEmptyModeComparisonDebugCounters(): ModeComparisonDebugCounters {
  return {
    rvfcCallbackCount: 0,
    processedFrameCount: 0,
    intentionalSkipCount: 0,
    timestampSkipCount: 0,
    busySkipCount: 0,
    missingMediaTimeSkipCount: 0,
    presentedFramesDeltaSummary: createEmptyTimingDistribution(),
    callbackWallDeltaMs: createEmptyTimingDistribution(),
    mediaTimeDeltaMs: createEmptyTimingDistribution(),
    processingMeasuredMs: createEmptyTimingDistribution(),
    unmeasuredOverheadEstimateMs: createEmptyTimingDistribution(),
    latestCallbackWallDeltaMs: null,
    latestMediaTimeDeltaMs: null,
    latestProcessingMeasuredMs: null,
    latestUnmeasuredOverheadEstimateMs: null,
    nextCallbackRegistrationTiming: "afterProcessing",
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
    debugCounters: createEmptyModeComparisonDebugCounters(),
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

function getPoseMappingPreviewStatus(): ObjPreviewStatus {
  if (
    state.poseMappingRuntime.previewDataUrl &&
    (state.poseMappingRuntime.status === "completed" || state.poseMappingRuntime.stale.isStale)
  ) {
    return "ready"
  }
  if (state.poseMappingRuntime.status === "error") {
    return "error"
  }
  return "not_ready"
}

function getPoseMappingPreviewMessage() {
  const runtime = state.poseMappingRuntime
  if (
    state.poseMappingProfile.loaded &&
    state.objFile.loaded &&
    getObjPreviewStatus() === "ready" &&
    runtime.poseMappingStatus === "skipped_no_current_face"
  ) {
    return runtime.stale.isStale
      ? "現在顔が未検出のため姿勢対応をスキップし、最後に成功した位置合わせ済み理想478点を保持しています。"
      : "現在顔が未検出のため姿勢対応をスキップしています。現在顔が戻ると再開します。"
  }
  if (
    state.poseMappingProfile.loaded &&
    state.objFile.loaded &&
    getObjPreviewStatus() === "ready" &&
    runtime.poseMappingStatus === "skipped_invalid_pose"
  ) {
    return runtime.stale.isStale
      ? "現在姿勢が不正なため姿勢対応をスキップし、最後に成功した位置合わせ済み理想478点を保持しています。"
      : "現在姿勢が不正なため姿勢対応をスキップしています。"
  }
  if (!state.poseMappingProfile.loaded) {
    return "poseMappingProfileを読み込むと、位置合わせ済み理想478点をライブ映像上に表示できます。"
  }
  if (!state.objFile.loaded || getObjPreviewStatus() !== "ready") {
    return "OBJを読み込むと、位置合わせ済み理想478点をライブ映像上に表示できます。"
  }
  if (state.currentAnalysis.status !== "detected" || !hasFullPose(state.currentAnalysis.pose)) {
    return "現在顔を検出すると、P_camera から p を計算して理想OBJをレンダーします。"
  }
  if (state.poseMappingRuntime.status === "error") {
    return `Pose Mapping確認でエラーが発生しました: ${state.poseMappingRuntime.errorMessage ?? "unknown"}`
  }
  if (state.poseMappingRuntime.status === "completed") {
    return "P_camera -> p -> render -> detect -> P_confirm から alignedRenderedIdeal478 を生成し、ライブ映像上に表示しています。"
  }
  return "位置合わせ済み理想478点 overlay を準備しています。"
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

function renderPlacementAnalysisPreviewPanel() {
  const stage = getElement<HTMLElement>("[data-placement-analysis-stage]")
  const summary = getElement<HTMLElement>("[data-placement-analysis-preview-summary]")
  const sampleIndexInput = getElement<HTMLInputElement>('[data-control="placement-analysis-sample-index"]')
  const showOverlayInput = getElement<HTMLInputElement>('[data-control="placement-analysis-show-overlay"]')
  const selectedSample = getSelectedPlacementAnalysisSample()
  const hasSamples = state.placementAnalysis.samples.length > 0

  stage.dataset.analysisStatus = selectedSample ? "ready" : "empty"
  showOverlayInput.checked = state.placementAnalysis.showOverlay
  sampleIndexInput.max = String(Math.max(0, state.placementAnalysis.samples.length - 1))
  sampleIndexInput.value = String(state.placementAnalysis.selectedSampleIndex ?? 0)
  setDisabled('[data-action="placement-analysis-prev-sample"]', !hasSamples || (state.placementAnalysis.selectedSampleIndex ?? 0) <= 0)
  setDisabled(
    '[data-action="placement-analysis-next-sample"]',
    !hasSamples ||
      (state.placementAnalysis.selectedSampleIndex ?? -1) >= state.placementAnalysis.samples.length - 1,
  )
  sampleIndexInput.disabled = !hasSamples
  showOverlayInput.disabled = !hasSamples

  if (!selectedSample) {
    clearPlacementAnalysisPreviewCanvas()
    summary.innerHTML = `<p>解析結果はまだありません。</p>`
    return
  }

  try {
    renderPlacementAnalysisSamplePreview(selectedSample)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    summary.innerHTML = `<p>配置関数解析プレビューを描画できません: ${escapeHtml(message)}</p>`
    return
  }

  const known = selectedSample.knownPlacement
  const transform = selectedSample.knownTransform
  summary.innerHTML = `
    <dl class="obj-preview-list placement-analysis-preview-list">
      <div><dt>sampleIndex</dt><dd>${selectedSample.sampleIndex}</dd></div>
      <div><dt>knownPlacement</dt><dd>${escapeHtml(formatKnownPlacementShort(known))}</dd></div>
      <div><dt>knownTransform</dt><dd>${escapeHtml(formatKnownTransformShort(transform))}</dd></div>
      <div><dt>detected</dt><dd>${String(selectedSample.mediaPipeResult.detected)}</dd></div>
      <div><dt>matrixAvailable</dt><dd>${String(selectedSample.facialTransformationMatrix.available)}</dd></div>
      <div><dt>quality</dt><dd>${selectedSample.quality.usable ? "usable" : `skipped: ${escapeHtml(selectedSample.quality.skippedReason ?? "-")}`}</dd></div>
    </dl>
  `
}

function getSelectedPlacementAnalysisSample() {
  const selectedIndex = state.placementAnalysis.selectedSampleIndex
  if (selectedIndex === null) {
    return null
  }
  return state.placementAnalysis.samples[selectedIndex] ?? null
}

function selectPlacementAnalysisSample(index: number) {
  if (state.placementAnalysis.samples.length === 0) {
    state.placementAnalysis.selectedSampleIndex = null
    renderPlacementAnalysisPreviewPanel()
    renderDebugContent()
    return
  }
  const selectedSampleIndex = clamp(
    Number.isFinite(index) ? index : 0,
    0,
    state.placementAnalysis.samples.length - 1,
  )
  state.placementAnalysis.selectedSampleIndex = Math.round(selectedSampleIndex)
  renderPlacementAnalysisPreviewPanel()
  renderDebugContent()
}

function renderPlacementAnalysisSamplePreview(sample: PlacementFunctionAnalysisSampleState) {
  renderPlacementAnalysisKnownPlacementToCanvas(sample.knownPlacement, sample.requestedPoseP)
  drawPlacementAnalysisOverlay(sample.previewLandmarks478)
}

function renderPlacementAnalysisKnownPlacementToCanvas(
  knownPlacement: KnownPlacement,
  requestedPoseP: ObjPoseMappingPose,
) {
  const renderer = getOrCreatePlacementAnalysisRenderer()
  resizeWebglObjBenchmarkRenderer(renderer, knownPlacement.canvasWidth, knownPlacement.canvasHeight)
  const appearance = getAppliedWebglObjRenderAppearanceProfile({
    width: knownPlacement.canvasWidth,
    height: knownPlacement.canvasHeight,
  })
  renderWebglObjToCanvas(renderer, {
    renderSettings: {
      detectCanvasWidth: knownPlacement.canvasWidth,
      detectCanvasHeight: knownPlacement.canvasHeight,
    },
    appearance,
    p: requestedPoseP,
    rotationCenter: getObjPoseSyncRotationCenter(),
    clipPlacementTransform: createPlacementAnalysisClipTransform(knownPlacement),
  })
}

function clearPlacementAnalysisPreviewCanvas() {
  ensurePlacementAnalysisCanvasSize(state.placementAnalysis.runOptions)
  const renderer = placementAnalysisRenderer
  if (renderer) {
    clearWebglRendererCanvas(renderer)
  } else {
    placementAnalysisRenderCanvas.width = state.placementAnalysis.runOptions.canvasWidth
    placementAnalysisRenderCanvas.height = state.placementAnalysis.runOptions.canvasHeight
  }
  clearPlacementAnalysisOverlay()
}

function ensurePlacementAnalysisCanvasSize(options: PlacementFunctionAnalysisRunOptions) {
  if (placementAnalysisRenderCanvas.width !== options.canvasWidth) {
    placementAnalysisRenderCanvas.width = options.canvasWidth
  }
  if (placementAnalysisRenderCanvas.height !== options.canvasHeight) {
    placementAnalysisRenderCanvas.height = options.canvasHeight
  }
  if (placementAnalysisOverlayCanvas.width !== options.canvasWidth) {
    placementAnalysisOverlayCanvas.width = options.canvasWidth
  }
  if (placementAnalysisOverlayCanvas.height !== options.canvasHeight) {
    placementAnalysisOverlayCanvas.height = options.canvasHeight
  }
}

function drawPlacementAnalysisOverlay(landmarks: ReferenceLandmark[] | null) {
  ensurePlacementAnalysisCanvasSize(state.placementAnalysis.runOptions)
  clearPlacementAnalysisOverlay()
  if (!state.placementAnalysis.showOverlay || !landmarks || landmarks.length === 0) {
    return
  }
  const context = placementAnalysisOverlayCanvas.getContext("2d")
  if (!context) {
    return
  }
  context.save()
  drawLandmarkPoints(
    context,
    { x: 0, y: 0, width: placementAnalysisOverlayCanvas.width, height: placementAnalysisOverlayCanvas.height },
    landmarks,
    "rgba(14, 116, 144, 0.9)",
    1.6,
  )
  context.restore()
}

function clearPlacementAnalysisOverlay() {
  const context = placementAnalysisOverlayCanvas.getContext("2d")
  if (!context) {
    return
  }
  context.clearRect(0, 0, placementAnalysisOverlayCanvas.width, placementAnalysisOverlayCanvas.height)
}

function renderPlacementFunctionAnalysisDebugTab() {
  const analysis = state.placementAnalysis
  const summary = analysis.summary
  const canDownloadSamples = analysis.samples.length > 0
  const canDownloadCandidate = analysis.candidate !== null
  const container = document.createElement("div")
  container.className = "placement-analysis-debug-tab"
  container.innerHTML = `
    <section class="review-card">
      <h3>配置関数解析</h3>
      <div class="button-row placement-analysis-buttons">
        <button class="primary-button" type="button" data-action="placement-analysis-run" ${analysis.status === "running" || !canRenderRenderedIdealGeometry() ? "disabled" : ""}>解析実行</button>
        <button class="secondary-button" type="button" data-action="placement-analysis-stop" ${analysis.status === "running" ? "" : "disabled"}>解析停止</button>
        <button class="small-button" type="button" data-action="placement-analysis-download-json" ${canDownloadSamples ? "" : "disabled"}>サンプルJSONをダウンロード</button>
        <button class="small-button" type="button" data-action="placement-analysis-download-csv" ${canDownloadSamples ? "" : "disabled"}>サンプルCSVをダウンロード</button>
        <button class="small-button" type="button" data-action="placement-analysis-download-candidate-json" ${canDownloadCandidate ? "" : "disabled"}>配置関数候補JSONをダウンロード</button>
      </div>
      ${!canRenderRenderedIdealGeometry() ? `<p class="control-note">OBJ読込を完了してから解析を実行してください。</p>` : ""}
    </section>
    <section class="review-card">
      <dl class="review-grid">
        <div><dt>runStatus</dt><dd>${analysis.status}</dd></div>
        <div><dt>sampleCount</dt><dd>${formatNullableCount(summary.sampleCount)}</dd></div>
        <div><dt>usableSampleCount</dt><dd>${formatNullableCount(summary.usableSampleCount)}</dd></div>
        <div><dt>detectedCount</dt><dd>${formatNullableCount(summary.detectedCount)}</dd></div>
        <div><dt>matrixAvailableCount</dt><dd>${formatNullableCount(summary.matrixAvailableCount)}</dd></div>
        <div><dt>failedCount</dt><dd>${formatNullableCount(summary.failedCount)}</dd></div>
        <div><dt>selectedSampleIndex</dt><dd>${analysis.selectedSampleIndex ?? "-"}</dd></div>
        <div><dt>latestSamplePreview</dt><dd>${escapeHtml(formatLatestPlacementAnalysisSamplePreview())}</dd></div>
        <div><dt>latestError</dt><dd>${escapeHtml(analysis.latestError ?? "-")}</dd></div>
      </dl>
    </section>
    <section class="review-card">
      <h3>feature range</h3>
      <dl class="review-grid">
        <div><dt>tx range</dt><dd>${formatPlacementAnalysisRange(summary.featureRanges.tx)}</dd></div>
        <div><dt>ty range</dt><dd>${formatPlacementAnalysisRange(summary.featureRanges.ty)}</dd></div>
        <div><dt>tz range</dt><dd>${formatPlacementAnalysisRange(summary.featureRanges.tz)}</dd></div>
        <div><dt>txOverNegTz range</dt><dd>${formatPlacementAnalysisRange(summary.featureRanges.txOverNegTz)}</dd></div>
        <div><dt>tyOverNegTz range</dt><dd>${formatPlacementAnalysisRange(summary.featureRanges.tyOverNegTz)}</dd></div>
        <div><dt>invNegTz range</dt><dd>${formatPlacementAnalysisRange(summary.featureRanges.invNegTz)}</dd></div>
      </dl>
    </section>
    <section class="review-card">
      <h3>known placement range</h3>
      <dl class="review-grid">
        <div><dt>centerWorkX range</dt><dd>${formatPlacementAnalysisRange(summary.knownPlacementRanges.centerWorkX)}</dd></div>
        <div><dt>centerWorkY range</dt><dd>${formatPlacementAnalysisRange(summary.knownPlacementRanges.centerWorkY)}</dd></div>
        <div><dt>visualScaleInput range</dt><dd>${formatPlacementAnalysisRange(summary.knownPlacementRanges.visualScaleInput)}</dd></div>
      </dl>
    </section>
    <section class="review-card">
      <h3>既知変換</h3>
      ${renderPlacementTransformSummaryHtml(summary.transformSummary)}
    </section>
    <section class="review-card">
      <h3>スケール別検出要約</h3>
      ${renderPlacementScaleDetectionSummaryHtml(summary.scaleDetectionSummary)}
    </section>
    <section class="review-card">
      <h3>失敗理由</h3>
      ${renderPlacementSkippedReasonCountsHtml(summary.skippedReasonCounts)}
    </section>
    <section class="review-card">
      <h3>配置関数候補</h3>
      <dl class="review-grid">
        <div><dt>available</dt><dd>${String(Boolean(analysis.candidate))}</dd></div>
        <div><dt>modelType</dt><dd>${analysis.candidate?.modelType ?? "-"}</dd></div>
        <div><dt>reason</dt><dd>${escapeHtml(analysis.candidate ? "-" : analysis.candidateUnavailableReason ?? "-")}</dd></div>
      </dl>
      ${renderPlacementFunctionCandidateMetricsHtml(analysis.candidate)}
    </section>
  `
  return container
}

function formatKnownPlacementShort(known: KnownPlacement) {
  return `centerImage=(${formatNullableNumber(known.centerImageX)}, ${formatNullableNumber(known.centerImageY)}) / centerWork=(${formatNullableNumber(known.centerWorkX)}, ${formatNullableNumber(known.centerWorkY)}) / visualScaleInput=${formatNullableNumber(known.visualScaleInput)} / canvas=${known.canvasWidth}x${known.canvasHeight}`
}

function formatKnownTransformShort(transform: KnownTransform) {
  return `scaleRatio=${formatNullableNumber(transform.scaleRatio)} / translateAfterScaleWork=(${formatNullableNumber(transform.translateAfterScaleWorkX)}, ${formatNullableNumber(transform.translateAfterScaleWorkY)})`
}

function formatLatestPlacementAnalysisSamplePreview() {
  const sample = state.placementAnalysis.samples[state.placementAnalysis.samples.length - 1]
  if (!sample) {
    return "-"
  }
  return `#${sample.sampleIndex} ${formatKnownTransformShort(sample.knownTransform)} / ${formatKnownPlacementShort(sample.knownPlacement)} / detected=${String(sample.mediaPipeResult.detected)} / matrix=${String(sample.facialTransformationMatrix.available)}`
}

function formatPlacementAnalysisRange(range: PlacementFunctionAnalysisRange | null) {
  return range ? `${formatNullableNumber(range.min)} .. ${formatNullableNumber(range.max)}` : "-"
}

function renderPlacementTransformSummaryHtml(summary: PlacementFunctionTransformSummary | null) {
  if (!summary) {
    return `<p class="placeholder-text">解析実行後に knownTransform の範囲を表示します。</p>`
  }
  return `
    <dl class="review-grid">
      <div><dt>transformOrder</dt><dd>${summary.transformOrder}</dd></div>
      <div><dt>scaleBasis</dt><dd>${summary.scaleBasis}</dd></div>
      <div><dt>scaleRatio range</dt><dd>${formatNullableNumber(summary.scaleRatioMin)} .. ${formatNullableNumber(summary.scaleRatioMax)}</dd></div>
      <div><dt>translateAfterScaleWorkX range</dt><dd>${formatNullableNumber(summary.translateAfterScaleWorkXMin)} .. ${formatNullableNumber(summary.translateAfterScaleWorkXMax)}</dd></div>
      <div><dt>translateAfterScaleWorkY range</dt><dd>${formatNullableNumber(summary.translateAfterScaleWorkYMin)} .. ${formatNullableNumber(summary.translateAfterScaleWorkYMax)}</dd></div>
    </dl>
  `
}

function renderPlacementScaleDetectionSummaryHtml(summary: PlacementFunctionScaleDetectionSummary[]) {
  if (summary.length === 0) {
    return `<p class="placeholder-text">解析実行後にスケール別検出要約を表示します。</p>`
  }
  return `
    <div class="table-scroll">
      <table class="debug-table">
        <thead>
          <tr>
            <th>visualScaleInput</th>
            <th>detected</th>
            <th>usable</th>
            <th>no_face</th>
            <th>failed</th>
          </tr>
        </thead>
        <tbody>
          ${summary.map((item) => `
            <tr>
              <td>${formatNullableNumber(item.visualScaleInput)}</td>
              <td>${item.detectedCount} / ${item.sampleCount}</td>
              <td>${item.usableCount} / ${item.sampleCount}</td>
              <td>${item.noFaceCount}</td>
              <td>${item.failedCount}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `
}

function renderPlacementSkippedReasonCountsHtml(counts: Record<string, number>) {
  const entries = Object.entries(counts)
  if (entries.length === 0) {
    return `<p class="placeholder-text">解析実行後に失敗理由を表示します。</p>`
  }
  return `
    <dl class="review-grid">
      ${entries.map(([reason, count]) => `
        <div><dt>${escapeHtml(reason)}</dt><dd>${formatNullableCount(count)}</dd></div>
      `).join("")}
    </dl>
  `
}

function renderPlacementFunctionCandidateMetricsHtml(candidate: PlacementFunctionCandidate | null) {
  if (!candidate) {
    return `<p class="placeholder-text">候補生成後に Known Transform の Scale Ratio / Translate After Scale 評価を表示します。</p>`
  }
  const metrics = candidate.metrics
  return `
    <div class="placement-candidate-metrics">
      <h4>Known Transform（既知変換）</h4>
      <dl class="review-grid">
        <div><dt>Scale Ratio MAE</dt><dd>${formatNullableNumber(metrics.maeScaleRatio)}</dd></div>
        <div><dt>Scale Ratio Max</dt><dd>${formatNullableNumber(metrics.maxScaleRatio)}</dd></div>
        <div><dt>Translate After Scale MAE work</dt><dd>${formatNullableNumber(metrics.maeTranslateAfterScaleWork)}</dd></div>
        <div><dt>Translate After Scale Max work</dt><dd>${formatNullableNumber(metrics.maxTranslateAfterScaleWork)}</dd></div>
      </dl>
    </div>
  `
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

function exportPlacementMappingSamplesJson() {
  const status = getElement<HTMLElement>("[data-debug-export-status]")
  const createdAt = new Date().toISOString()
  const payload = {
    type: "placement_mapping_samples_v1",
    createdAt,
    source: {
      objFileName: state.objFile.fileName,
      mp4FileName: state.liveVideo.fileName,
      profileFileName: state.poseMappingProfile.fileName,
    },
    settings: state.poseMappingSettings,
    sampleCount: placementMappingSamples.length,
    samples: placementMappingSamples,
  }
  downloadTextFile(
    `placement-mapping-samples-${formatTimestampForFileName(createdAt)}.json`,
    JSON.stringify(payload, null, 2),
    "application/json;charset=utf-8",
  )
  status.textContent = "placement mapping samples JSONをダウンロードしました。"
  addLog(status.textContent)
  renderAll()
}

function exportPlacementMappingSamplesCsv() {
  const status = getElement<HTMLElement>("[data-debug-export-status]")
  const createdAt = new Date().toISOString()
  downloadTextFile(
    `placement-mapping-samples-${formatTimestampForFileName(createdAt)}.csv`,
    buildPlacementMappingSamplesCsv(placementMappingSamples),
    "text/csv;charset=utf-8",
  )
  status.textContent = "placement mapping samples CSVをダウンロードしました。"
  addLog(status.textContent)
  renderAll()
}

function exportPlacementFunctionAnalysisJson() {
  const status = getElement<HTMLElement>("[data-debug-export-status]")
  if (state.placementAnalysis.samples.length === 0) {
    status.textContent = "配置関数解析サンプルがありません。先に解析を実行してください。"
    renderAll()
    return
  }
  const payload = buildPlacementFunctionAnalysisExport()
  downloadTextFile(
    `placement-function-analysis-samples-${formatTimestampForFileName(payload.exportedAt)}.json`,
    JSON.stringify(payload, null, 2),
    "application/json;charset=utf-8",
  )
  status.textContent = "配置関数解析サンプルJSONをダウンロードしました。"
  addLog(status.textContent)
  renderAll()
}

function exportPlacementFunctionAnalysisCsv() {
  const status = getElement<HTMLElement>("[data-debug-export-status]")
  if (state.placementAnalysis.samples.length === 0) {
    status.textContent = "配置関数解析サンプルがありません。先に解析を実行してください。"
    renderAll()
    return
  }
  const createdAt = new Date().toISOString()
  downloadTextFile(
    `placement-function-analysis-samples-${formatTimestampForFileName(createdAt)}.csv`,
    buildPlacementFunctionAnalysisCsv(state.placementAnalysis.samples),
    "text/csv;charset=utf-8",
  )
  status.textContent = "配置関数解析サンプルCSVをダウンロードしました。"
  addLog(status.textContent)
  renderAll()
}

function exportPlacementFunctionCandidateJson() {
  const status = getElement<HTMLElement>("[data-debug-export-status]")
  const candidate = state.placementAnalysis.candidate
  if (!candidate) {
    status.textContent = `配置関数候補がありません: ${state.placementAnalysis.candidateUnavailableReason ?? "unknown"}`
    renderAll()
    return
  }
  downloadTextFile(
    `placement-function-candidate-${formatTimestampForFileName(candidate.createdAt)}.json`,
    JSON.stringify(candidate, null, 2),
    "application/json;charset=utf-8",
  )
  status.textContent = "配置関数候補JSONをダウンロードしました。"
  addLog(status.textContent)
  renderAll()
}

function buildPlacementFunctionAnalysisExport(): PlacementFunctionAnalysisExport {
  const exportedAt = new Date().toISOString()
  const options = state.placementAnalysis.runOptions
  return {
    schemaVersion: "ideal_obj_render_warp_placement_function_analysis_v1",
    exportedAt,
    source: {
      tool: "ideal-obj-render-warp-lab",
      purpose: "matrix_to_known_transform_function_analysis",
    },
    renderAppearance: getPlacementFunctionAnalysisRenderAppearanceSummary(options),
    runOptions: {
      centerImageXValues: [...options.centerImageXValues],
      centerImageYValues: [...options.centerImageYValues],
      visualScaleInputValues: [...options.visualScaleInputValues],
      poseSet: options.poseSet,
      renderAspectRatio: options.renderAspectRatio,
      canvasWidth: options.canvasWidth,
      canvasHeight: options.canvasHeight,
    },
    summary: {
      sampleCount: state.placementAnalysis.summary.sampleCount,
      usableSampleCount: state.placementAnalysis.summary.usableSampleCount,
      detectedCount: state.placementAnalysis.summary.detectedCount,
      matrixAvailableCount: state.placementAnalysis.summary.matrixAvailableCount,
      failedCount: state.placementAnalysis.summary.failedCount,
      scaleDetectionSummary: state.placementAnalysis.summary.scaleDetectionSummary,
      skippedReasonCounts: state.placementAnalysis.summary.skippedReasonCounts,
      transformSummary: state.placementAnalysis.summary.transformSummary,
    },
    samples: state.placementAnalysis.samples.map(stripPlacementFunctionAnalysisSampleState),
  }
}

function stripPlacementFunctionAnalysisSampleState(
  sample: PlacementFunctionAnalysisSampleState,
): PlacementFunctionAnalysisSample {
  const { previewLandmarks478: _previewLandmarks478, ...exportSample } = sample
  return exportSample
}

function getPlacementFunctionAnalysisRenderAppearanceSummary(options: PlacementFunctionAnalysisRunOptions) {
  const appearance = getAppliedWebglObjRenderAppearanceProfile({
    width: options.canvasWidth,
    height: options.canvasHeight,
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
    renderBackend: "webgl",
  }
}

function buildPlacementFunctionAnalysisCsv(samples: PlacementFunctionAnalysisSampleState[]) {
  const headers = [
    "sampleIndex",
    "qualityUsable",
    "skippedReason",
    "knownCenterImageX",
    "knownCenterImageY",
    "knownCenterWorkX",
    "knownCenterWorkY",
    "knownVisualScaleInput",
    "baseCenterWorkX",
    "baseCenterWorkY",
    "baseWidthWork",
    "baseHeightWork",
    "targetCenterWorkX",
    "targetCenterWorkY",
    "targetWidthWork",
    "targetHeightWork",
    "knownScaleRatio",
    "knownTranslateAfterScaleWorkX",
    "knownTranslateAfterScaleWorkY",
    "requestedYaw",
    "requestedPitch",
    "requestedRoll",
    "returnedYaw",
    "returnedPitch",
    "returnedRoll",
    "poseDiffMagnitude",
    "matrixAvailable",
    "tx",
    "ty",
    "tz",
    "negTz",
    "invNegTz",
    "txOverNegTz",
    "tyOverNegTz",
    "matrixUniformScale",
    "observedCenterImageX",
    "observedCenterImageY",
    "observedCenterWorkX",
    "observedCenterWorkY",
    "observedScaleDiag",
    "renderAspectRatio",
    "canvasWidth",
    "canvasHeight",
  ]
  const rows = samples.map((sample) => [
    sample.sampleIndex,
    sample.quality.usable,
    sample.quality.skippedReason ?? "",
    sample.knownPlacement.centerImageX,
    sample.knownPlacement.centerImageY,
    sample.knownPlacement.centerWorkX,
    sample.knownPlacement.centerWorkY,
    sample.knownPlacement.visualScaleInput,
    sample.basePlacement.centerWorkX,
    sample.basePlacement.centerWorkY,
    sample.basePlacement.widthWork,
    sample.basePlacement.heightWork,
    sample.targetPlacement.centerWorkX,
    sample.targetPlacement.centerWorkY,
    sample.targetPlacement.widthWork,
    sample.targetPlacement.heightWork,
    sample.knownTransform.scaleRatio,
    sample.knownTransform.translateAfterScaleWorkX,
    sample.knownTransform.translateAfterScaleWorkY,
    sample.requestedPoseP.yaw,
    sample.requestedPoseP.pitch,
    sample.requestedPoseP.roll,
    sample.mediaPipeResult.returnedPose?.yaw ?? "",
    sample.mediaPipeResult.returnedPose?.pitch ?? "",
    sample.mediaPipeResult.returnedPose?.roll ?? "",
    sample.mediaPipeResult.poseDiffMagnitude ?? "",
    sample.facialTransformationMatrix.available,
    sample.matrixFeatures.tx ?? "",
    sample.matrixFeatures.ty ?? "",
    sample.matrixFeatures.tz ?? "",
    sample.matrixFeatures.negTz ?? "",
    sample.matrixFeatures.invNegTz ?? "",
    sample.matrixFeatures.txOverNegTz ?? "",
    sample.matrixFeatures.tyOverNegTz ?? "",
    sample.matrixFeatures.matrixUniformScale ?? "",
    sample.observedRenderedBounds?.centerImageX ?? "",
    sample.observedRenderedBounds?.centerImageY ?? "",
    sample.observedRenderedBounds?.centerWorkX ?? "",
    sample.observedRenderedBounds?.centerWorkY ?? "",
    sample.observedRenderedBounds?.scaleDiag ?? "",
    sample.knownPlacement.renderAspectRatio,
    sample.knownPlacement.canvasWidth,
    sample.knownPlacement.canvasHeight,
  ])
  return [
    headers.join(","),
    ...rows.map((row) => row.map(formatCsvCell).join(",")),
  ].join("\n")
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

function recordPlacementMappingSample(runtime: PoseMappingRuntimeState) {
  const sample = buildPlacementMappingSample(runtime)
  if (!sample) {
    return
  }
  const existingIndex = placementMappingSamples.findIndex((item) => item.frameId === sample.frameId)
  if (existingIndex >= 0) {
    placementMappingSamples[existingIndex] = sample
  } else {
    placementMappingSamples.push(sample)
  }
  placementMappingSamples = placementMappingSamples.slice(-10000)
}

function buildPlacementMappingSample(runtime: PoseMappingRuntimeState): PlacementMappingSample | null {
  const frameLifecycle = runtime.frameLifecycle
  if (!frameLifecycle) {
    return null
  }
  const alignment = runtime.alignment
  const boundsDebug = alignment.boundsCenterScaleDebug
  return {
    frameId: frameLifecycle.frameId,
    mediaTimeSec: roundForState(frameLifecycle.mediaTimeSec),
    P_camera: roundPoseMappingPose(runtime.P_camera),
    p: roundPoseMappingPose(runtime.p),
    P_confirm: runtime.P_confirm ? roundPoseForState(runtime.P_confirm) : null,
    poseDiffMagnitude: roundForState(runtime.poseDiff.magnitude),
    currentMatrixColumnMajorTranslation: roundPoint3ForState(
      alignment.placementDebug.current.matrixColumnMajor.translation,
    ),
    currentMatrixColumnMajorScale: roundMatrixScaleForState(
      alignment.placementDebug.current.matrixColumnMajor.scale,
    ),
    idealMatrixColumnMajorTranslation: roundPoint3ForState(
      alignment.placementDebug.ideal.matrixColumnMajor.translation,
    ),
    idealMatrixColumnMajorScale: roundMatrixScaleForState(
      alignment.placementDebug.ideal.matrixColumnMajor.scale,
    ),
    currentBoundsImage: boundsDebug?.currentBoundsImage
      ? roundBoundsPlacementForState(boundsDebug.currentBoundsImage)
      : roundBoundsPlacementForState(alignment.placementDebug.current.boundsPlacement),
    idealBoundsImage: boundsDebug?.renderedIdealBoundsImage
      ? roundBoundsPlacementForState(boundsDebug.renderedIdealBoundsImage)
      : roundBoundsPlacementForState(alignment.placementDebug.ideal.boundsPlacement),
    currentBoundsWork: boundsDebug?.currentBoundsWork
      ? roundBoundsPlacementForState(boundsDebug.currentBoundsWork)
      : null,
    idealBoundsWork: boundsDebug?.idealBoundsWork
      ? roundBoundsPlacementForState(boundsDebug.idealBoundsWork)
      : null,
    boundsScaleBasis: alignment.scaleBasis,
    boundsScaleRatio: roundForState(alignment.placementScaleRatio),
    videoAspectRatio: roundForState(alignment.videoAspectRatio),
    renderAspectRatio: roundForState(alignment.renderAspectRatio),
    qualityUsable: runtime.qualityGate.usable,
    skippedReason:
      alignment.alignmentSkippedReason !== "none"
        ? alignment.alignmentSkippedReason
        : runtime.overlayLifecycle.alignedRenderedIdealVisible
          ? null
          : runtime.overlayLifecycle.skippedReason,
  }
}

function buildPlacementMappingSamplesCsv(samples: PlacementMappingSample[]) {
  const headers = [
    "frameId",
    "mediaTimeSec",
    "P_cameraYaw",
    "P_cameraPitch",
    "P_cameraRoll",
    "pYaw",
    "pPitch",
    "pRoll",
    "P_confirmYaw",
    "P_confirmPitch",
    "P_confirmRoll",
    "poseDiffMagnitude",
    "currentMatrixColumnMajorTranslation",
    "currentMatrixColumnMajorScale",
    "idealMatrixColumnMajorTranslation",
    "idealMatrixColumnMajorScale",
    "currentBoundsImage",
    "idealBoundsImage",
    "currentBoundsWork",
    "idealBoundsWork",
    "boundsScaleBasis",
    "boundsScaleRatio",
    "videoAspectRatio",
    "renderAspectRatio",
    "qualityUsable",
    "skippedReason",
  ]
  const rows = samples.map((sample) => [
    sample.frameId,
    sample.mediaTimeSec ?? "",
    sample.P_camera?.yaw ?? "",
    sample.P_camera?.pitch ?? "",
    sample.P_camera?.roll ?? "",
    sample.p?.yaw ?? "",
    sample.p?.pitch ?? "",
    sample.p?.roll ?? "",
    sample.P_confirm?.yaw ?? "",
    sample.P_confirm?.pitch ?? "",
    sample.P_confirm?.roll ?? "",
    sample.poseDiffMagnitude ?? "",
    formatCsvJson(sample.currentMatrixColumnMajorTranslation),
    formatCsvJson(sample.currentMatrixColumnMajorScale),
    formatCsvJson(sample.idealMatrixColumnMajorTranslation),
    formatCsvJson(sample.idealMatrixColumnMajorScale),
    formatCsvJson(sample.currentBoundsImage),
    formatCsvJson(sample.idealBoundsImage),
    formatCsvJson(sample.currentBoundsWork),
    formatCsvJson(sample.idealBoundsWork),
    sample.boundsScaleBasis,
    sample.boundsScaleRatio ?? "",
    sample.videoAspectRatio ?? "",
    sample.renderAspectRatio ?? "",
    sample.qualityUsable,
    sample.skippedReason ?? "",
  ])
  return [
    headers.join(","),
    ...rows.map((row) => row.map((value) => formatCsvCell(value)).join(",")),
  ].join("\n")
}

function formatCsvJson(value: unknown) {
  return value === null || value === undefined ? "" : JSON.stringify(value)
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

function exportPoseMappingDebug() {
  const debugExport = getPoseMappingRuntimeDebugExport()
  const fileName = `pose_mapping_runtime_debug_${formatTimestampForFileName(debugExport.createdAt)}.json`
  downloadTextFile(
    fileName,
    JSON.stringify(debugExport, null, 2),
    "application/json;charset=utf-8",
  )
  addLog("Pose Mapping debug JSONをダウンロードしました。")
  renderDebugContent()
}

function exportDetectPerformanceJson() {
  const result = state.detectPerformance.result
  const status = getElement<HTMLElement>("[data-debug-export-status]")
  if (!result) {
    status.textContent = "検出速度ベンチマーク結果がありません。先に実行してください。"
    renderAll()
    return
  }

  downloadTextFile(
    createDetectPerformanceFileName(result.createdAt, "json"),
    JSON.stringify(result, null, 2),
    "application/json;charset=utf-8",
  )
  status.textContent = "検出速度JSONをダウンロードしました。"
  addLog("検出速度JSONをダウンロードしました。")
  renderAll()
}

function exportDetectPerformanceCsv() {
  const result = state.detectPerformance.result
  const status = getElement<HTMLElement>("[data-debug-export-status]")
  if (!result) {
    status.textContent = "検出速度ベンチマーク結果がありません。先に実行してください。"
    renderAll()
    return
  }

  downloadTextFile(
    createDetectPerformanceFileName(result.createdAt, "csv"),
    buildDetectPerformanceCsv(result),
    "text/csv;charset=utf-8",
  )
  status.textContent = "検出速度CSVをダウンロードしました。"
  addLog("検出速度CSVをダウンロードしました。")
  renderAll()
}

function exportRenderDetectHandoffJson() {
  const result = state.renderDetectHandoff.result
  const status = getElement<HTMLElement>("[data-debug-export-status]")
  if (!result) {
    status.textContent = "受け渡しベンチマーク結果がありません。先に実行してください。"
    renderAll()
    return
  }

  downloadTextFile(
    createRenderDetectHandoffFileName(result.createdAt, "json"),
    JSON.stringify(result, null, 2),
    "application/json;charset=utf-8",
  )
  status.textContent = "受け渡しJSONをダウンロードしました。"
  addLog("受け渡しJSONをダウンロードしました。")
  renderAll()
}

function exportRenderDetectHandoffCsv() {
  const result = state.renderDetectHandoff.result
  const status = getElement<HTMLElement>("[data-debug-export-status]")
  if (!result) {
    status.textContent = "受け渡しベンチマーク結果がありません。先に実行してください。"
    renderAll()
    return
  }

  downloadTextFile(
    createRenderDetectHandoffFileName(result.createdAt, "csv"),
    buildRenderDetectHandoffCsv(result),
    "text/csv;charset=utf-8",
  )
  status.textContent = "受け渡しCSVをダウンロードしました。"
  addLog("受け渡しCSVをダウンロードしました。")
  renderAll()
}

function exportWebglObjBenchmarkJson() {
  const result = state.webglObjBenchmark.result
  const status = getElement<HTMLElement>("[data-debug-export-status]")
  if (!result) {
    status.textContent = "WebGL OBJ benchmark 結果がありません。先に実行してください。"
    renderAll()
    return
  }

  downloadTextFile(
    createWebglObjBenchmarkFileName(result.createdAt, "json"),
    JSON.stringify(result, null, 2),
    "application/json;charset=utf-8",
  )
  status.textContent = "WebGL benchmark JSONをダウンロードしました。"
  addLog("WebGL benchmark JSONをダウンロードしました。")
  renderAll()
}

function exportWebglObjBenchmarkCsv() {
  const result = state.webglObjBenchmark.result
  const status = getElement<HTMLElement>("[data-debug-export-status]")
  if (!result) {
    status.textContent = "WebGL OBJ benchmark 結果がありません。先に実行してください。"
    renderAll()
    return
  }

  downloadTextFile(
    createWebglObjBenchmarkFileName(result.createdAt, "csv"),
    buildWebglObjBenchmarkCsv(result),
    "text/csv;charset=utf-8",
  )
  status.textContent = "WebGL benchmark CSVをダウンロードしました。"
  addLog("WebGL benchmark CSVをダウンロードしました。")
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

function createDetectPerformanceFileName(createdAt: string, extension: "json" | "csv") {
  return `pose_mapping_detect_performance_${formatTimestampForFileName(createdAt)}.${extension}`
}

function createRenderDetectHandoffFileName(createdAt: string, extension: "json" | "csv") {
  return `pose_mapping_render_detect_handoff_${formatTimestampForFileName(createdAt)}.${extension}`
}

function createWebglObjBenchmarkFileName(createdAt: string, extension: "json" | "csv") {
  return `pose_mapping_webgl_obj_render_benchmark_${formatTimestampForFileName(createdAt)}.${extension}`
}

function buildWebglObjBenchmarkCsv(result: WebglObjBenchmarkExport) {
  const headers = [
    "caseId",
    "label",
    "rendererKind",
    "handoffStrategy",
    "canvasWidth",
    "canvasHeight",
    "runIndex",
    "phase",
    "webglRenderMs",
    "finishMs",
    "readPixelsMs",
    "bitmapCreateMs",
    "copyTo2dMs",
    "detectMs",
    "totalMs",
    "detected",
    "landmarkCount",
    "pConfirmYaw",
    "pConfirmPitch",
    "pConfirmRoll",
    "poseDiffYaw",
    "poseDiffPitch",
    "poseDiffRoll",
    "poseDiffMagnitude",
    "errorMessage",
  ]
  const rows = result.cases.flatMap((caseResult) =>
    caseResult.samples.map((sample) => [
      caseResult.caseId,
      caseResult.label,
      caseResult.rendererKind,
      caseResult.handoffStrategy,
      caseResult.canvasWidth,
      caseResult.canvasHeight,
      sample.runIndex,
      sample.phase,
      sample.webglRenderMs ?? "",
      sample.finishMs ?? "",
      sample.readPixelsMs ?? "",
      sample.bitmapCreateMs ?? "",
      sample.copyTo2dMs ?? "",
      sample.detectMs ?? "",
      sample.totalMs ?? "",
      sample.detected ?? "",
      sample.landmarkCount ?? "",
      sample.P_confirm.yaw ?? "",
      sample.P_confirm.pitch ?? "",
      sample.P_confirm.roll ?? "",
      sample.poseDiff.yaw ?? "",
      sample.poseDiff.pitch ?? "",
      sample.poseDiff.roll ?? "",
      sample.poseDiff.magnitude ?? "",
      sample.errorMessage ?? "",
    ]),
  )

  return [
    headers.join(","),
    ...rows.map((row) => row.map(formatCsvCell).join(",")),
  ].join("\n")
}

function buildRenderDetectHandoffCsv(result: RenderDetectHandoffExport) {
  const headers = [
    "caseId",
    "label",
    "handoffStrategy",
    "canvasWidth",
    "canvasHeight",
    "runIndex",
    "phase",
    "renderMs",
    "waitMs",
    "bitmapCreateMs",
    "copyMs",
    "readbackMs",
    "detectMs",
    "totalMs",
    "detected",
    "landmarkCount",
    "errorMessage",
  ]
  const rows = result.cases.flatMap((caseResult) =>
    caseResult.samples.map((sample) => [
      caseResult.caseId,
      caseResult.label,
      caseResult.handoffStrategy,
      caseResult.canvasWidth,
      caseResult.canvasHeight,
      sample.runIndex,
      sample.phase,
      sample.renderMs ?? "",
      sample.waitMs ?? "",
      sample.bitmapCreateMs ?? "",
      sample.copyMs ?? "",
      sample.readbackMs ?? "",
      sample.detectMs ?? "",
      sample.totalMs ?? "",
      sample.detected ?? "",
      sample.landmarkCount ?? "",
      sample.errorMessage ?? "",
    ]),
  )

  return [
    headers.join(","),
    ...rows.map((row) => row.map(formatCsvCell).join(",")),
  ].join("\n")
}

function buildDetectPerformanceCsv(result: DetectPerformanceExport) {
  const headers = [
    "caseId",
    "label",
    "sourceKind",
    "canvasWidth",
    "canvasHeight",
    "runIndex",
    "phase",
    "renderMs",
    "detectMs",
    "previewMs",
    "overlayMs",
    "toDataUrlMs",
    "totalMs",
    "detected",
    "landmarkCount",
    "errorMessage",
  ]
  const rows = result.cases.flatMap((caseResult) =>
    caseResult.samples.map((sample) => [
      caseResult.caseId,
      caseResult.label,
      caseResult.sourceKind,
      caseResult.canvasWidth,
      caseResult.canvasHeight,
      sample.runIndex,
      sample.phase,
      sample.renderMs ?? "",
      sample.detectMs ?? "",
      sample.previewMs ?? "",
      sample.overlayMs ?? "",
      sample.toDataUrlMs ?? "",
      sample.totalMs ?? "",
      sample.detected ?? "",
      sample.landmarkCount ?? "",
      sample.errorMessage ?? "",
    ]),
  )

  return [
    headers.join(","),
    ...rows.map((row) => row.map(formatCsvCell).join(",")),
  ].join("\n")
}

function buildModeComparisonCsv(frames: ModeComparisonFrameResult[]) {
  const headers = [
    "frameIndex",
    "mediaTimeSec",
    "timestampMs",
    "presentedFrames",
    "presentedFramesDelta",
    "callbackWallDeltaMs",
    "mediaTimeDeltaMs",
    "drawImageMs",
    "imageDetectMs",
    "videoDetectMs",
    "totalFrameProcessingMs",
    "processingMeasuredMs",
    "unmeasuredOverheadEstimateMs",
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
    frame.callbackWallDeltaMs ?? "",
    frame.mediaTimeDeltaMs ?? "",
    frame.drawImageMs ?? "",
    frame.imageDetectMs ?? "",
    frame.videoDetectMs ?? "",
    frame.totalFrameProcessingMs ?? "",
    frame.processingMeasuredMs ?? "",
    frame.unmeasuredOverheadEstimateMs ?? "",
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
    poseMapping: getPoseMappingRuntimeDebugExport(),
    objPoseDatasetGeneration: getObjPoseCalibrationDebugExport(),
    objPoseMapping: getObjPoseMappingDebugExport(),
    placementAnalysis: getPlacementFunctionAnalysisRawSummary(),
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
    matrix: roundMatrixDebugSummaryForState(state.currentAnalysis.matrix),
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
    matrix: roundMatrixDebugSummaryForState(detection.matrix),
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

function isPoseMappingAlignmentMode(value: string): value is PoseMappingAlignmentMode {
  return value === "mediapipe_placement_center_scale" || value === "bounds_center_scale_v1"
}

function isPlacementLandmarkSet(value: string): value is PlacementLandmarkSet {
  return value === "all_non_iris" || value === "stable_non_expression"
}

function isBoundsScaleBasis(value: string): value is BoundsScaleBasis {
  return value === "height" || value === "width" || value === "diag"
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

function formatPoseMappingPose(pose: ObjPoseMappingPose | null) {
  if (!pose) {
    return "null"
  }
  return `yaw ${formatNumber(pose.yaw)} / pitch ${formatNumber(pose.pitch)} / roll ${formatNumber(pose.roll)}`
}

function formatPoseMappingDiff(diff: PoseMappingPoseDiff) {
  return `yaw ${formatNullableNumber(diff.yaw)} / pitch ${formatNullableNumber(diff.pitch)} / roll ${formatNullableNumber(diff.roll)} / magnitude ${formatNullableNumber(diff.magnitude)}`
}

function formatPoint2(point: { x: number; y: number } | null) {
  return point
    ? `x ${formatNullableNumber(point.x)} / y ${formatNullableNumber(point.y)}`
    : "-"
}

function formatPoseMappingBounds(bounds: PoseMappingBounds | null) {
  if (!bounds) {
    return "-"
  }
  return `minX ${formatNullableNumber(bounds.minX)} / maxX ${formatNullableNumber(bounds.maxX)} / minY ${formatNullableNumber(bounds.minY)} / maxY ${formatNullableNumber(bounds.maxY)} / width ${formatNullableNumber(bounds.width)} / height ${formatNullableNumber(bounds.height)}`
}

function formatRect(rect: Rect | null) {
  if (!rect) {
    return "-"
  }
  return `x ${formatNullableNumber(rect.x)} / y ${formatNullableNumber(rect.y)} / width ${formatNullableNumber(rect.width)} / height ${formatNullableNumber(rect.height)}`
}

function formatPlacement(placement: MediaPipeFacePlacement) {
  const center = placement.center
    ? `center x ${formatNullableNumber(placement.center.x)} / y ${formatNullableNumber(placement.center.y)}`
    : "center -"
  return `${placement.status} / ${placement.source} / ${center} / scale ${formatNullableNumber(placement.scale)} / warnings ${placement.warnings.join(", ") || "-"}`
}

function formatMatrixPlacementCandidate(candidate: MatrixPlacementCandidate) {
  return `translation ${formatPoint3(candidate.translation)} / scale ${formatMatrixScale(candidate.scale)}`
}

function formatMatrixRawAvailable(raw: MatrixRawDebug) {
  return `${String(raw.exists)} / constructor ${raw.constructorName ?? "-"} / rows ${formatNullableCount(raw.rows)} / columns ${formatNullableCount(raw.columns)} / values ${formatNullableCount(raw.values?.length ?? null)} / keys ${raw.keys.join(", ") || "-"}`
}

function formatBoundsPlacement(placement: BoundsPlacement | null) {
  if (!placement) {
    return "-"
  }
  return `center ${formatPoint2(placement.center)} / width ${formatNullableNumber(placement.width)} / height ${formatNullableNumber(placement.height)} / scaleHeight ${formatNullableNumber(placement.scaleByHeight)} / scaleWidth ${formatNullableNumber(placement.scaleByWidth)} / scaleDiag ${formatNullableNumber(placement.scaleByDiag)}`
}

function formatPlacementDelta(
  delta: PlacementDebugComparison["columnMajorTranslationVsBoundsCenter"],
) {
  return `current dx ${formatNullableNumber(delta.currentDx)} / dy ${formatNullableNumber(delta.currentDy)} / ideal dx ${formatNullableNumber(delta.idealDx)} / dy ${formatNullableNumber(delta.idealDy)}`
}

function formatPlacementScaleComparison(comparison: PlacementDebugComparison["matrixScaleVsBoundsScale"]) {
  return `current column ${formatNullableNumber(comparison.currentColumnMajorScaleToBoundsHeight)} / ideal column ${formatNullableNumber(comparison.idealColumnMajorScaleToBoundsHeight)} / current row ${formatNullableNumber(comparison.currentRowMajorScaleToBoundsHeight)} / ideal row ${formatNullableNumber(comparison.idealRowMajorScaleToBoundsHeight)}`
}

function formatPoint3(point: { x: number; y: number; z: number } | null) {
  return point
    ? `x ${formatNullableNumber(point.x)} / y ${formatNullableNumber(point.y)} / z ${formatNullableNumber(point.z)}`
    : "-"
}

function formatMatrixScale(scale: { x: number; y: number; z: number; uniform: number } | null) {
  return scale
    ? `x ${formatNullableNumber(scale.x)} / y ${formatNullableNumber(scale.y)} / z ${formatNullableNumber(scale.z)} / uniform ${formatNullableNumber(scale.uniform)}`
    : "-"
}

function roundDisplacementSummary(summary: PoseMappingDisplacementSummary): PoseMappingDisplacementSummary {
  return {
    mean: roundForState(summary.mean),
    p50: roundForState(summary.p50),
    p95: roundForState(summary.p95),
    max: roundForState(summary.max),
  }
}

function formatPoseMappingSummary(
  value: Record<string, unknown> | undefined,
  keys: string[],
) {
  if (!value) {
    return "-"
  }
  return keys.map((key) => `${key}: ${formatUnknownDebugValue(value[key])}`).join(" / ")
}

function formatPoseMappingRange(range: Record<string, PoseMappingScalarRange> | null | undefined) {
  if (!range) {
    return "-"
  }
  return ["P_yaw", "P_pitch", "P_roll"]
    .map((key) => {
      const item = range[key]
      return `${key}: ${formatNullableNumber(item?.min ?? null)}..${formatNullableNumber(item?.max ?? null)}`
    })
    .join(" / ")
}

function formatPoseMappingPreviewNote() {
  return [
    `currentFaceStatus: ${state.poseMappingRuntime.currentFaceStatus}`,
    `poseMappingStatus: ${state.poseMappingRuntime.poseMappingStatus}`,
    `poseMappingSkippedReason: ${state.poseMappingRuntime.poseMappingSkippedReason}`,
    `fallbackPoseUsed: ${String(state.poseMappingRuntime.fallbackPoseUsed)}`,
    `lastGood: ${String(state.poseMappingRuntime.lastGood.hasLastGood)} / ageMs ${formatRealtimeNullableNumber(state.poseMappingRuntime.lastGood.ageMs)}`,
    `stale: ${String(state.poseMappingRuntime.stale.isStale)} / ${state.poseMappingRuntime.stale.staleReason ?? "-"}`,
    `detect canvas: ${formatNullableCount(state.poseMappingRuntime.detectCanvasWidth)} x ${formatNullableCount(state.poseMappingRuntime.detectCanvasHeight)}`,
    `preview canvas: ${formatNullableCount(state.poseMappingRuntime.previewCanvasWidth)} x ${formatNullableCount(state.poseMappingRuntime.previewCanvasHeight)}`,
    `detect result: ${state.poseMappingRuntime.renderedIdealDetected ? "detected" : "not detected"}`,
    `errorMessage: ${state.poseMappingRuntime.errorMessage ?? "-"}`,
    `P_camera: ${formatPoseMappingPose(state.poseMappingRuntime.P_camera)}`,
    `p: ${formatPoseMappingPose(state.poseMappingRuntime.p)}`,
    `P_confirm: ${formatPose(state.poseMappingRuntime.P_confirm)}`,
    `pose diff: ${formatPoseMappingDiff(state.poseMappingRuntime.poseDiff)}`,
  ].join(" / ")
}

function formatUnknownDebugValue(value: unknown) {
  if (typeof value === "number") {
    return formatNumber(value)
  }
  if (typeof value === "string") {
    return value
  }
  if (typeof value === "boolean") {
    return String(value)
  }
  if (value === null || value === undefined) {
    return "-"
  }
  return JSON.stringify(value)
}

function posesEqual(a: ObjPoseMappingPose, b: ObjPoseMappingPose) {
  return a.yaw === b.yaw && a.pitch === b.pitch && a.roll === b.roll
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

function getPoseMappingProfileRawSummary() {
  const profile = state.poseMappingProfile.profile
  return {
    loaded: state.poseMappingProfile.loaded,
    fileName: state.poseMappingProfile.fileName,
    fileSize: state.poseMappingProfile.fileSize,
    schemaVersion: profile?.schemaVersion ?? null,
    modelType: profile?.modelType ?? null,
    modelName: profile?.modelName ?? null,
    datasetKind: profile?.datasetKind ?? null,
    requiredRenderBackend: profile?.requiredRenderBackend ?? null,
    requiredRenderer: profile?.requiredRenderer ?? null,
    datasetSchemaVersion: profile?.datasetSchemaVersion ?? null,
    datasetMetadata: profile?.datasetMetadata ?? null,
    inputFeatures: profile?.inputFeatures ?? [],
    target: profile?.target ?? [],
    errorSummary: profile?.errorSummary ?? null,
    outlierFilterSummary: profile?.outlierFilterSummary ?? null,
    poseRangeAfter: profile?.poseRangeAfter ?? null,
    errorMessage: state.poseMappingProfile.errorMessage,
    warnings: state.poseMappingProfile.warnings,
  }
}

function getPoseMappingLastGoodDebugSummary(lastGood: PoseMappingLastGoodState) {
  return {
    hasLastGood: lastGood.hasLastGood,
    updatedAtMs: roundForState(lastGood.updatedAtMs),
    mediaTimeSec: roundForState(lastGood.mediaTimeSec),
    ageMs: roundForState(lastGood.ageMs),
    frameIndex: lastGood.frameIndex,
    P_camera: roundPoseMappingPose(lastGood.P_camera),
    p: roundPoseMappingPose(lastGood.p),
    P_confirm: roundPoseForState(lastGood.P_confirm),
    renderedIdealLandmarkCount: lastGood.renderedIdeal478?.length ?? null,
    alignedRenderedIdealLandmarkCount: lastGood.alignedRenderedIdeal478?.length ?? null,
  }
}

function getPoseMappingLoopDebugSummary() {
  return {
    running: state.realtimeDebug.status === "running",
    busy: poseMappingRuntimeInProgress,
    lastFrameIndex: state.realtimeDebug.processedVideoFrameCount,
    lastMediaTimeSec:
      state.realtimeDebug.lastVideoFrameMediaTimeSec ?? state.realtimeDebug.videoFrameMetadataMediaTime,
  }
}

function getPoseMappingAlignmentDebugSummary(alignment: PoseMappingAlignmentState) {
  return {
    status: alignment.status,
    mode: alignment.mode,
    rotationApplied: alignment.rotationApplied,
    placementLandmarkSet: alignment.placementLandmarkSet,
    scaleBasis: alignment.scaleBasis,
    placementSource: alignment.placementSource,
    alignmentSkippedReason: alignment.alignmentSkippedReason,
    currentPlacement: roundPlacementForState(alignment.currentPlacement),
    idealPlacement: roundPlacementForState(alignment.idealPlacement),
    placementScaleRatio: roundForState(alignment.placementScaleRatio),
    renderedIdealStatus: alignment.renderedIdealStatus,
    anchorCount: alignment.anchorCount,
    currentCenter: roundPoint2ForState(alignment.currentCenter),
    idealCenter: roundPoint2ForState(alignment.idealCenter),
    scale: roundForState(alignment.scale),
    videoAspectRatio: roundForState(alignment.videoAspectRatio),
    renderAspectRatio: roundForState(alignment.renderAspectRatio),
    currentBoundsImage: roundBoundsForState(alignment.currentBoundsImage),
    renderedIdealBoundsImage: roundBoundsForState(alignment.renderedIdealBoundsImage),
    currentBoundsAspectWork: roundBoundsForState(alignment.currentBoundsAspectWork),
    renderedIdealBoundsAspectWork: roundBoundsForState(alignment.renderedIdealBoundsAspectWork),
    alignedIdealBoundsAspectWork: roundBoundsForState(alignment.alignedIdealBoundsAspectWork),
    alignedRenderedIdealBoundsImage: roundBoundsForState(alignment.alignedRenderedIdealBoundsImage),
    displayedContentRect: roundRectForState(alignment.displayedContentRect),
    placementDebug: roundPlacementDebugForState(alignment.placementDebug),
    boundsCenterScaleDebug: roundBoundsCenterScaleDebugForState(alignment.boundsCenterScaleDebug),
    excludedReasonCounts: alignment.excludedReasonCounts,
    displacementSummary: roundDisplacementSummary(alignment.displacementSummary),
  }
}

function getPoseMappingRuntimeRawSummary() {
  const runtime = state.poseMappingRuntime
  return {
    status: runtime.status,
    currentFaceStatus: runtime.currentFaceStatus,
    renderedIdealStatus: runtime.renderedIdealStatus,
    alignmentStatus: runtime.alignmentStatus,
    alignmentSkippedReason: runtime.alignmentSkippedReason,
    poseMappingStatus: runtime.poseMappingStatus,
    poseMappingSkippedReason: runtime.poseMappingSkippedReason,
    fallbackPoseUsed: runtime.fallbackPoseUsed,
    fallbackRenderedIdealUsed: runtime.fallbackRenderedIdealUsed,
    lastGood: getPoseMappingLastGoodDebugSummary(runtime.lastGood),
    stale: {
      isStale: runtime.stale.isStale,
      staleReason: runtime.stale.staleReason,
      staleMs: roundForState(runtime.stale.staleMs),
    },
    loop: getPoseMappingLoopDebugSummary(),
    noFaceCounters: runtime.noFaceCounters,
    lastUpdatedAt: runtime.lastUpdatedAt,
    P_camera: roundPoseMappingPose(runtime.P_camera),
    P_cameraClamped: roundPoseMappingPose(runtime.P_cameraClamped),
    qualityGate: runtime.qualityGate,
    p: roundPoseMappingPose(runtime.p),
    selectedLeaf: runtime.selectedLeaf,
    usedExpert: runtime.usedExpert,
    usedFallback: runtime.usedFallback,
    warnings: runtime.warnings,
    P_confirm: roundPoseForState(runtime.P_confirm),
    poseDiff: roundPoseMappingDiff(runtime.poseDiff),
    renderedIdealDetected: runtime.renderedIdealDetected,
    renderedIdealLandmarkCount: runtime.renderedIdealLandmarkCount,
    renderedIdealToken: runtime.renderedIdealToken,
    alignedRenderedIdealToken: runtime.alignedRenderedIdealToken,
    alignedRenderedIdealLandmarkCount: runtime.alignedRenderedIdeal478?.length ?? null,
    meshSourceVertexCount: runtime.meshSourceVertices?.length ?? null,
    meshTargetVertexCount: runtime.meshTargetVertices?.length ?? null,
    alignment: getPoseMappingAlignmentDebugSummary(runtime.alignment),
    canvasWidth: runtime.canvasWidth,
    canvasHeight: runtime.canvasHeight,
    detectCanvasWidth: runtime.detectCanvasWidth,
    detectCanvasHeight: runtime.detectCanvasHeight,
    previewCanvasWidth: runtime.previewCanvasWidth,
    previewCanvasHeight: runtime.previewCanvasHeight,
    renderSettings: runtime.renderSettings,
    renderAppearanceApplied: runtime.renderAppearanceApplied,
    renderBackend: runtime.renderBackend,
    renderer: runtime.renderer,
    profileRendererMatch: runtime.profileRendererMatch,
    profileMismatchError: runtime.profileMismatchError,
    assetLifecycle: runtime.assetLifecycle,
    frameLifecycle: runtime.frameLifecycle,
    renderedIdealLifecycle: runtime.renderedIdealLifecycle,
    renderPoseProbe: state.renderPoseProbe,
    overlayLifecycle: runtime.overlayLifecycle,
    profileEvaluateMs: roundForState(runtime.profileEvaluateMs),
    renderMs: roundForState(runtime.renderMs),
    detectMs: roundForState(runtime.detectMs),
    totalMs: roundForState(runtime.totalMs),
    errorMessage: runtime.errorMessage,
  }
}

function getPoseMappingRuntimeDebugExport() {
  const createdAt = new Date().toISOString()
  const profile = getPoseMappingProfileRawSummary()
  const runtime = state.poseMappingRuntime
  return {
    type: "pose_mapping_runtime_debug_v1",
    createdAt,
    source: {
      objFileName: state.objFile.fileName,
      mp4FileName: state.liveVideo.fileName,
      profileFileName: state.poseMappingProfile.fileName,
    },
    profile: {
      schemaVersion: profile.schemaVersion,
      modelType: profile.modelType,
      modelName: profile.modelName,
      datasetKind: profile.datasetKind,
      requiredRenderBackend: profile.requiredRenderBackend,
      requiredRenderer: profile.requiredRenderer,
      datasetSchemaVersion: profile.datasetSchemaVersion,
      datasetMetadata: profile.datasetMetadata,
      inputFeatures: profile.inputFeatures,
      target: profile.target,
      errorSummary: profile.errorSummary,
      outlierFilterSummary: profile.outlierFilterSummary,
      poseRangeAfter: profile.poseRangeAfter,
    },
    runtime: {
      currentFaceStatus: runtime.currentFaceStatus,
      renderedIdealStatus: runtime.renderedIdealStatus,
      alignmentStatus: runtime.alignmentStatus,
      alignmentSkippedReason: runtime.alignmentSkippedReason,
      poseMappingStatus: runtime.poseMappingStatus,
      poseMappingSkippedReason: runtime.poseMappingSkippedReason,
      fallbackPoseUsed: runtime.fallbackPoseUsed,
      fallbackRenderedIdealUsed: runtime.fallbackRenderedIdealUsed,
      assetLifecycle: runtime.assetLifecycle,
      frameLifecycle: runtime.frameLifecycle,
      renderedIdealLifecycle: runtime.renderedIdealLifecycle,
      overlayLifecycle: runtime.overlayLifecycle,
      lastGood: getPoseMappingLastGoodDebugSummary(runtime.lastGood),
      stale: {
        isStale: runtime.stale.isStale,
        staleReason: runtime.stale.staleReason,
        staleMs: roundForState(runtime.stale.staleMs),
      },
      loop: getPoseMappingLoopDebugSummary(),
      noFaceCounters: runtime.noFaceCounters,
      P_camera: roundPoseMappingPose(runtime.P_camera),
      P_cameraClamped: roundPoseMappingPose(runtime.P_cameraClamped),
      clampApplied:
        runtime.P_camera !== null &&
        runtime.P_cameraClamped !== null &&
        !posesEqual(runtime.P_camera, runtime.P_cameraClamped),
      qualityGate: runtime.qualityGate,
      p: roundPoseMappingPose(runtime.p),
      P_confirm: roundPoseForState(runtime.P_confirm),
      poseDiff: roundPoseMappingDiff(runtime.poseDiff),
      selectedLeaf: runtime.selectedLeaf,
      usedFallback: runtime.usedFallback,
      warnings: runtime.warnings,
      alignment: getPoseMappingAlignmentDebugSummary(runtime.alignment),
      placementDebug: roundPlacementDebugForState(runtime.alignment.placementDebug),
    },
    alignment: getPoseMappingAlignmentDebugSummary(runtime.alignment),
    placementDebug: roundPlacementDebugForState(runtime.alignment.placementDebug),
    timing: {
      profileEvaluateMs: roundForState(runtime.profileEvaluateMs),
      renderMs: roundForState(runtime.renderMs),
      detectMs: roundForState(runtime.detectMs),
      totalMs: roundForState(runtime.totalMs),
    },
    renderSettings: runtime.renderSettings,
    renderAppearanceApplied: runtime.renderAppearanceApplied,
    renderBackend: runtime.renderBackend,
    renderer: runtime.renderer,
    profileRendererMatch: runtime.profileRendererMatch,
    profileMismatchError: runtime.profileMismatchError,
    renderedIdeal: {
      detected: runtime.renderedIdealDetected,
      landmarkCount: runtime.renderedIdealLandmarkCount,
      token: runtime.renderedIdealToken,
      alignedToken: runtime.alignedRenderedIdealToken,
      canvasWidth: runtime.canvasWidth,
      canvasHeight: runtime.canvasHeight,
      detectCanvasWidth: runtime.detectCanvasWidth,
      detectCanvasHeight: runtime.detectCanvasHeight,
      previewCanvasWidth: runtime.previewCanvasWidth,
      previewCanvasHeight: runtime.previewCanvasHeight,
      errorMessage: runtime.errorMessage,
    },
    renderPoseProbe: state.renderPoseProbe,
    current478: runtime.current478?.map(roundLandmarkForState) ?? null,
    renderedIdeal478: runtime.renderedIdeal478?.map(roundLandmarkForState) ?? null,
    alignedRenderedIdeal478: runtime.alignedRenderedIdeal478?.map(roundLandmarkForState) ?? null,
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
      schemaVersion: "obj_pose_mapping_dataset_v3",
      renderBackend: dataset?.renderBackend ?? "webgl",
      renderer: dataset?.renderer ?? null,
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

function roundPoint2ForState(point: { x: number; y: number } | null) {
  return point
    ? {
        x: roundForState(point.x) ?? 0,
        y: roundForState(point.y) ?? 0,
      }
    : null
}

function roundBoundsForState(bounds: PoseMappingBounds | null): PoseMappingBounds | null {
  return bounds
    ? {
        minX: roundForState(bounds.minX) ?? 0,
        maxX: roundForState(bounds.maxX) ?? 0,
        minY: roundForState(bounds.minY) ?? 0,
        maxY: roundForState(bounds.maxY) ?? 0,
        width: roundForState(bounds.width) ?? 0,
        height: roundForState(bounds.height) ?? 0,
      }
    : null
}

function roundRectForState(rect: Rect | null): Rect | null {
  return rect
    ? {
        x: roundForState(rect.x) ?? 0,
        y: roundForState(rect.y) ?? 0,
        width: roundForState(rect.width) ?? 0,
        height: roundForState(rect.height) ?? 0,
      }
    : null
}

function roundPlacementForState(placement: MediaPipeFacePlacement): MediaPipeFacePlacement {
  return {
    status: placement.status,
    source: placement.source,
    center: roundPoint2ForState(placement.center),
    scale: roundForState(placement.scale),
    raw: placement.raw
      ? {
          matrixTranslation: roundPoint3ForState(placement.raw.matrixTranslation ?? null),
          matrixScale: roundMatrixScaleForState(placement.raw.matrixScale ?? null),
          matrixRotationDeg: placement.raw.matrixRotationDeg
            ? roundPoseForState(placement.raw.matrixRotationDeg)
            : undefined,
          boundsImage: roundBoundsForState(placement.raw.boundsImage ?? null),
        }
      : undefined,
    warnings: placement.warnings,
  }
}

function roundMatrixDebugSummaryForState(summary: MatrixDebugSummary | null): MatrixDebugSummary | null {
  return summary
    ? {
        translation: roundPoint3ForState(summary.translation),
        scale: roundMatrixScaleForState(summary.scale),
        rotationDeg: roundPoseForState(summary.rotationDeg),
        raw: {
          ...summary.raw,
          data: summary.raw.data?.map((value) => roundForState(value) ?? 0) ?? null,
          values: summary.raw.values?.map((value) => roundForState(value) ?? 0) ?? null,
        },
        columnMajor: roundMatrixPlacementCandidateForState(summary.columnMajor),
        rowMajor: roundMatrixPlacementCandidateForState(summary.rowMajor),
      }
    : null
}

function roundPlacementDebugForState(debug: PlacementDebugState): PlacementDebugState {
  return {
    current: roundPlacementDebugSideForState(debug.current),
    ideal: roundPlacementDebugSideForState(debug.ideal),
    comparison: {
      columnMajorTranslationVsBoundsCenter: roundPlacementTranslationDeltaForState(
        debug.comparison.columnMajorTranslationVsBoundsCenter,
      ),
      rowMajorTranslationVsBoundsCenter: roundPlacementTranslationDeltaForState(
        debug.comparison.rowMajorTranslationVsBoundsCenter,
      ),
      matrixScaleVsBoundsScale: {
        currentColumnMajorScaleToBoundsHeight: roundForState(
          debug.comparison.matrixScaleVsBoundsScale.currentColumnMajorScaleToBoundsHeight,
        ),
        idealColumnMajorScaleToBoundsHeight: roundForState(
          debug.comparison.matrixScaleVsBoundsScale.idealColumnMajorScaleToBoundsHeight,
        ),
        currentRowMajorScaleToBoundsHeight: roundForState(
          debug.comparison.matrixScaleVsBoundsScale.currentRowMajorScaleToBoundsHeight,
        ),
        idealRowMajorScaleToBoundsHeight: roundForState(
          debug.comparison.matrixScaleVsBoundsScale.idealRowMajorScaleToBoundsHeight,
        ),
      },
    },
  }
}

function roundPlacementDebugSideForState(side: PlacementDebugSide): PlacementDebugSide {
  return {
    matrixRaw: {
      ...side.matrixRaw,
      data: side.matrixRaw.data?.map((value) => roundForState(value) ?? 0) ?? null,
      values: side.matrixRaw.values?.map((value) => roundForState(value) ?? 0) ?? null,
    },
    matrixColumnMajor: roundMatrixPlacementCandidateForState(side.matrixColumnMajor),
    matrixRowMajor: roundMatrixPlacementCandidateForState(side.matrixRowMajor),
    boundsPlacement: roundBoundsPlacementForState(side.boundsPlacement),
  }
}

function roundPlacementTranslationDeltaForState(
  delta: PlacementDebugComparison["columnMajorTranslationVsBoundsCenter"],
) {
  return {
    currentDx: roundForState(delta.currentDx),
    currentDy: roundForState(delta.currentDy),
    idealDx: roundForState(delta.idealDx),
    idealDy: roundForState(delta.idealDy),
  }
}

function roundMatrixPlacementCandidateForState(
  candidate: MatrixPlacementCandidate,
): MatrixPlacementCandidate {
  return {
    translation: roundPoint3ForState(candidate.translation),
    scale: roundMatrixScaleForState(candidate.scale),
  }
}

function roundBoundsPlacementForState(boundsPlacement: BoundsPlacement | null): BoundsPlacement | null {
  return boundsPlacement
    ? {
        center: roundPoint2ForState(boundsPlacement.center) ?? { x: 0, y: 0 },
        width: roundForState(boundsPlacement.width) ?? 0,
        height: roundForState(boundsPlacement.height) ?? 0,
        scaleByHeight: roundForState(boundsPlacement.scaleByHeight) ?? 0,
        scaleByWidth: roundForState(boundsPlacement.scaleByWidth) ?? 0,
        scaleByDiag: roundForState(boundsPlacement.scaleByDiag) ?? 0,
      }
    : null
}

function roundBoundsCenterScaleDebugForState(
  debug: BoundsCenterScaleAlignmentDebug | null,
): BoundsCenterScaleAlignmentDebug | null {
  return debug
    ? {
        mode: debug.mode,
        placementLandmarkSet: debug.placementLandmarkSet,
        scaleBasis: debug.scaleBasis,
        rotationApplied: false,
        currentBoundsWork: roundBoundsPlacementForState(debug.currentBoundsWork) ?? debug.currentBoundsWork,
        idealBoundsWork: roundBoundsPlacementForState(debug.idealBoundsWork) ?? debug.idealBoundsWork,
        currentCenterWork: roundPoint2ForState(debug.currentCenterWork) ?? debug.currentCenterWork,
        idealCenterWork: roundPoint2ForState(debug.idealCenterWork) ?? debug.idealCenterWork,
        currentScale: roundForState(debug.currentScale) ?? 0,
        idealScale: roundForState(debug.idealScale) ?? 0,
        scaleRatio: roundForState(debug.scaleRatio) ?? 0,
        translationWork: {
          x: roundForState(debug.translationWork.x) ?? 0,
          y: roundForState(debug.translationWork.y) ?? 0,
        },
        currentBoundsImage: roundBoundsPlacementForState(debug.currentBoundsImage) ?? debug.currentBoundsImage,
        renderedIdealBoundsImage:
          roundBoundsPlacementForState(debug.renderedIdealBoundsImage) ?? debug.renderedIdealBoundsImage,
        alignedRenderedIdealBoundsImage:
          roundBoundsPlacementForState(debug.alignedRenderedIdealBoundsImage) ??
          debug.alignedRenderedIdealBoundsImage,
        alignedLandmarkCount: debug.alignedLandmarkCount,
      }
    : null
}

function roundPoint3ForState(point: { x: number; y: number; z: number } | null) {
  return point
    ? {
        x: roundForState(point.x) ?? 0,
        y: roundForState(point.y) ?? 0,
        z: roundForState(point.z) ?? 0,
      }
    : null
}

function roundMatrixScaleForState(
  scale: { x: number; y: number; z: number; uniform: number } | null,
) {
  return scale
    ? {
        x: roundForState(scale.x) ?? 0,
        y: roundForState(scale.y) ?? 0,
        z: roundForState(scale.z) ?? 0,
        uniform: roundForState(scale.uniform) ?? 0,
      }
    : null
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

function roundPoseMappingPose(pose: ObjPoseMappingPose | null): ObjPoseMappingPose | null {
  if (!pose) {
    return null
  }
  return {
    yaw: roundForState(pose.yaw) ?? 0,
    pitch: roundForState(pose.pitch) ?? 0,
    roll: roundForState(pose.roll) ?? 0,
  }
}

function roundPoseMappingDiff(diff: PoseMappingPoseDiff): PoseMappingPoseDiff {
  return {
    yaw: roundForState(diff.yaw),
    pitch: roundForState(diff.pitch),
    roll: roundForState(diff.roll),
    magnitude: roundForState(diff.magnitude),
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

function getDirectObjPosePreviewState(pose: ReferencePose): ObjPreviewState {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object`)
  }
  return value
}

function requireString(source: Record<string, unknown>, key: string) {
  const value = source[key]
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${key} is required`)
  }
  return value
}

function getOptionalString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null
}

function requireStringArray(source: Record<string, unknown>, key: string) {
  const value = source[key]
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new Error(`${key} must be a string array`)
  }
  return [...value]
}

function requireNumberArray(source: Record<string, unknown>, key: string) {
  const value = source[key]
  if (!Array.isArray(value)) {
    throw new Error(`${key} must be a number array`)
  }
  return value.map((item) => requireFiniteNumberValue(item, key))
}

function requireFiniteNumber(source: Record<string, unknown>, key: string) {
  return requireFiniteNumberValue(source[key], key)
}

function requireFiniteNumberValue(value: unknown, label: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`)
  }
  return value
}

function getOptionalFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function isFinitePose(pose: ObjPoseMappingPose) {
  return Number.isFinite(pose.yaw) && Number.isFinite(pose.pitch) && Number.isFinite(pose.roll)
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

function getAppliedWebglObjRenderAppearanceProfile(
  renderResolutionOverride?: { width: number; height: number },
): AppliedObjRenderAppearanceProfile {
  const profile = getAppliedObjRenderAppearanceProfile(renderResolutionOverride)
  return {
    ...profile,
    material: { ...profile.material },
    lighting: { ...profile.lighting },
    camera: { ...profile.camera },
    renderResolution: { ...profile.renderResolution },
    implementation: {
      ...profile.implementation,
      notes: [
        "WebGL renderer applies backgroundColor, skinColor, material ambient/diffuse, lighting intensities/directions, scale, verticalOffset, and renderResolution.",
        "specular, castShadow, physical perspective projection, and fovDeg are recorded for comparison metadata but are not physically implemented by this WebGL orthographic renderer.",
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
