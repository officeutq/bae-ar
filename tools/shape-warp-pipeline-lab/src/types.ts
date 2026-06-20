export const REQUIRED_LANDMARK_COUNT = 478
export const MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT = 468
export const IRIS_LANDMARK_START = 468
export const IRIS_LANDMARK_END = 477

export type PreviewTab =
  | "currentFace"
  | "renderedIdeal"
  | "alignment"
  | "backgroundGrid"
  | "combinedMesh"

export type FacePose = {
  yaw: number | null
  pitch: number | null
  roll: number | null
}

export type Landmark = {
  index: number
  x: number
  y: number
  z: number
}

export type Point2 = {
  x: number
  y: number
}

export type Point3 = Point2 & {
  z: number
}

export type Rect = {
  x: number
  y: number
  width: number
  height: number
}

export type NumericSummary = {
  min: number | null
  max: number | null
  mean: number | null
  p50: number | null
  p95: number | null
}

export type ObjVertex = {
  x: number
  y: number
  z: number
}

export type ObjFace = {
  indices: number[]
}

export type ObjEdge = {
  a: number
  b: number
}

export type ObjBounds = {
  minX: number
  minY: number
  minZ: number
  maxX: number
  maxY: number
  maxZ: number
}

export type ObjGeometry = {
  vertices: ObjVertex[]
  faces: ObjFace[]
  edges: ObjEdge[]
}

export type ObjSummary = {
  fileName: string | null
  fileSize: number | null
  parseStatus: "not_loaded" | "parsed" | "error"
  vertexCount: number
  faceCount: number
  triangleFaceCount: number
  polygonFaceCount: number
  bounds: ObjBounds | null
  center: ObjVertex | null
  size: ObjVertex | null
  maxDimension: number | null
  warningCount: number
  warningsPreview: string[]
  errorMessage: string | null
}

export type ObjParseResult = {
  vertices: ObjVertex[]
  faces: ObjFace[]
  warnings: string[]
}

export type PoseMappingPose = {
  yaw: number
  pitch: number
  roll: number
}

export type PoseMappingScalarRange = {
  min: number | null
  max: number | null
}

export type PoseMappingProfileModel = {
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

export type PoseMappingProfileMetadata = {
  renderAppearanceApplied: Record<string, unknown> | null
  renderSettings: Record<string, unknown> | null
  renderBackend: string | null
  renderer: Record<string, unknown> | null
  datasetSchemaVersion: string | null
  renderAppearance: Record<string, unknown> | null
}

export type PoseMappingProfile = {
  schemaVersion: string
  modelType: string
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

export type PoseMappingEvaluateResult = {
  p: PoseMappingPose
  P_camera: PoseMappingPose
  P_cameraClamped: PoseMappingPose
  clampApplied: boolean
  selectedLeaf: number | null
  usedExpert: string
  usedFallback: boolean
  warnings: string[]
}

export type PoseDiff = {
  yaw: number | null
  pitch: number | null
  roll: number | null
  magnitude: number | null
}

export type RenderSettings = {
  width: number
  height: number
  source: string
}

export type RenderAppearance = {
  backgroundColor: string
  skinColor: string
  scale: number
  verticalOffset: number
  ambient: number
  diffuse: number
  lightDirection: ObjVertex
}

export type CurrentFaceStatus = "not_loaded" | "detecting" | "detected" | "missing" | "invalid" | "error"

export type CurrentFaceFrame = {
  currentFaceStatus: CurrentFaceStatus
  frameId: number
  mediaTimeSec: number | null
  landmarkCount: number
  current478: Landmark[] | null
  P_camera: FacePose
  qualityScore: number
  matrix: MatrixDebug | null
  errorMessage: string | null
}

export type MatrixDebug = {
  rows: number
  columns: number
  dataPreview: number[]
  rotationDeg: FacePose | null
}

export type RenderedIdealStatus =
  | "idle"
  | "rendering"
  | "detected"
  | "missing"
  | "invalid"
  | "skipped"
  | "error"

export type RenderedIdealState = {
  objLoaded: boolean
  poseMappingProfileLoaded: boolean
  P_camera: FacePose
  pFromProfile: PoseMappingPose | null
  pForWebglRender: PoseMappingPose | null
  renderBackend: string
  renderResolution: { width: number; height: number } | null
  renderedIdealStatus: RenderedIdealStatus
  renderedIdealLandmarkCount: number
  renderedIdeal478: Landmark[] | null
  P_confirm: FacePose
  poseDiff: PoseDiff
  renderMs: number | null
  detectMs: number | null
  warnings: string[]
  imageDataUrl: string | null
  errorMessage: string | null
}

export type ActualVisibilityExcludedReason =
  | "invalid"
  | "iris"
  | "backFacingSurface"
  | "noAdjacentTriangle"
  | "degenerateTriangleOnly"
  | "other"

export type ActualVisibilityDebug = {
  method: "actual_visible_triangle_normal_v1"
  inputLandmarkCount: number
  usedLandmarkCount: number
  excludedLandmarkCount: number
  currentOverlayPointCount: number
  alignedIdealOverlayPointCount: number
  excludedReasonCounts: Record<ActualVisibilityExcludedReason, number>
  excludedReasonSamples: Record<ActualVisibilityExcludedReason, number[]>
  triangleNormalSummary: {
    totalTriangleCount: number
    validTriangleCount: number
    frontFacingTriangleCount: number
    backFacingTriangleCount: number
    degenerateTriangleCount: number
    frontFacingSign: number | null
    frontFacingSignSource: string
    normalZMin: number | null
    normalZMax: number | null
    normalZMean: number | null
    normalZMedian: number | null
  }
  landmarkVisibilitySummary: {
    minFrontFacingRatio: number | null
    maxFrontFacingRatio: number | null
    meanFrontFacingRatio: number | null
    p50FrontFacingRatio: number | null
    minFrontFacingTriangleCount: number | null
    maxFrontFacingTriangleCount: number | null
  }
  thresholds: {
    minFrontFacingTriangleCount: number
    minFrontFacingRatio: number
  }
  currentYawDeg: number | null
  skippedReason: string | null
}

export type ActualVisibleLandmarkSelection = {
  actualVisibleCurrentLandmarkIndices: number[]
  actualHiddenCurrentLandmarkIndices: number[]
  actualVisibleCurrentLandmarks: Landmark[]
  actualVisibleAlignedIdealLandmarks: Landmark[]
  landmarkExcludedReasons: ActualVisibilityExcludedReason[][]
  actualVisibilityDebug: ActualVisibilityDebug
}

export type AlignmentStatus = "idle" | "completed" | "skipped" | "error"
export type AlignmentMethod = "semantic_5pt_center_scale_v1"

export type AlignmentDebug = {
  currentFaceStatus: CurrentFaceStatus
  renderedIdealStatus: RenderedIdealStatus
  alignmentStatus: AlignmentStatus
  alignmentSkippedReason: string | null
  alignmentMethod: AlignmentMethod
  currentCenter: Point2 | null
  idealCenter: Point2 | null
  scaleRatio: number | null
  semanticFixedPointIndices: {
    topCenter: 10
    chinCenter: 152
    leftSideCenter: 234
    rightSideCenter: 454
    eyeMid: 6
  }
  scaleLineCurrentMinXIndex: number | null
  scaleLineCurrentMaxXIndex: number | null
  scaleLineCurrentLengthPx: number | null
  scaleLineIdealLengthPx: number | null
  actualVisibleIndexCount: number
  currentOverlayPointCount: number
  alignedIdealOverlayPointCount: number
  overlayLifecycle: {
    alignedRenderedIdealVisible: boolean
    frameId: number | null
    skippedReason: string | null
    staleFrameRejected: boolean
  }
}

export type AlignmentResult = {
  alignedRenderedIdeal478: Landmark[] | null
  actualVisibilitySelection: ActualVisibleLandmarkSelection
  debug: AlignmentDebug
}

export type BackgroundGridStatus = "ready" | "skipped"
export type BackgroundGridPointKind = "backgroundGridInterior" | "backgroundGridBoundary"

export type BackgroundGridPointPx = Point2 & {
  kind: BackgroundGridPointKind
}

export type BackgroundGridTrianglePx = {
  a: Point2
  b: Point2
  c: Point2
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export type BackgroundGridDebug = {
  backgroundGridStatus: BackgroundGridStatus
  skipReason: string | null
  gridStepPx: number | null
  generatedGridPointCount: number
  backgroundGridBoundaryPointCount: number
  backgroundGridInteriorPointCount: number
  excludedInsideFaceTrianglePointCount: number
  keptBackgroundGridPointCount: number
  faceInteriorTriangleCount: number
  xPositionCount: number
  yPositionCount: number
}

export type BackgroundGridState = {
  debug: BackgroundGridDebug
  sourceBackgroundGridPointsPx: BackgroundGridPointPx[]
  targetBackgroundGridPointsPx: BackgroundGridPointPx[]
  faceInteriorTrianglesPx: BackgroundGridTrianglePx[]
}

export type CombinedMeshStatus = "available" | "skipped"
export type CombinedMeshVertexKind =
  | "faceLandmark"
  | "backgroundGridInterior"
  | "backgroundGridBoundary"

export type CombinedMeshPointPx = Point2

export type CombinedVertexMetadata = {
  kind: CombinedMeshVertexKind
  sourceIndex: number
  targetIndex: number
  landmarkIndex: number | null
  backgroundGridIndex: number | null
}

export type CombinedMeshDebug = {
  combinedMeshStatus: CombinedMeshStatus
  skipReason: string | null
  combinedSourceVertexCount: number
  combinedTargetVertexCount: number
  sourceTargetCountMatches: boolean
  indexCorrespondenceValid: boolean
  faceLandmarkVertexCount: number
  backgroundGridInteriorVertexCount: number
  backgroundGridBoundaryVertexCount: number
  triangulationInputVertexCount: number
  duplicateSkippedVertexCount: number
  invalidVertexCount: number
  triangleCount: number
  potentialTargetInversionTriangleCount: number
  sourceDegenerateTriangleCount: number
  longTriangleCount: number
  sourceTriangleAreaSummaryPx2: NumericSummary
  targetTriangleAreaSummaryPx2: NumericSummary
  edgeLengthSummaryPx: NumericSummary
  sampleCombinedVertices: Array<{
    index: number
    kind: CombinedMeshVertexKind
    landmarkIndex: number | null
    backgroundGridIndex: number | null
    source: CombinedMeshPointPx
    target: CombinedMeshPointPx
  }>
  sampleTriangleIndices: Array<[number, number, number]>
}

export type CombinedMeshState = {
  combinedSourceVerticesPx: CombinedMeshPointPx[]
  combinedTargetVerticesPx: CombinedMeshPointPx[]
  combinedVertexMetadata: CombinedVertexMetadata[]
  triangulationVertexIndices: number[]
  triangleIndices: number[]
  combinedMeshDebug: CombinedMeshDebug
}
