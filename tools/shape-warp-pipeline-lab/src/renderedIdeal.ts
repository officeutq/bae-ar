import { FaceLandmarker } from "@mediapipe/tasks-vision"
import type {
  FacePose,
  Landmark,
  ObjBounds,
  ObjEdge,
  ObjFace,
  ObjGeometry,
  ObjParseResult,
  ObjSummary,
  ObjVertex,
  PoseDiff,
  PoseMappingEvaluateResult,
  PoseMappingPose,
  PoseMappingProfile,
  PoseMappingProfileMetadata,
  PoseMappingProfileModel,
  PoseMappingScalarRange,
  RenderAppearance,
  RenderSettings,
  RenderedIdealState,
} from "./types"
import { REQUIRED_LANDMARK_COUNT } from "./types"
import {
  createEmptyPose,
  estimatePoseFromMatrix,
  mapLandmarks,
  summarizeFaceMatrix,
} from "./currentFace"

const DEFAULT_RENDER_WIDTH = 1179
const DEFAULT_RENDER_HEIGHT = 1179
const DEFAULT_RENDER_APPEARANCE: RenderAppearance = {
  backgroundColor: "#f5f7f9",
  skinColor: "#cdb197",
  scale: 1,
  verticalOffset: 0,
  ambient: 0.68,
  diffuse: 0.42,
  lightDirection: normalizeVector({ x: -0.35, y: -0.25, z: 0.9 }),
}

export type RenderedIdealDetectionResult = ReturnType<FaceLandmarker["detect"]>

export function createEmptyObjGeometry(): ObjGeometry {
  return {
    vertices: [],
    faces: [],
    edges: [],
  }
}

export function createEmptyObjSummary(): ObjSummary {
  return {
    fileName: null,
    fileSize: null,
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
    errorMessage: null,
  }
}

export function createEmptyRenderedIdealState(): RenderedIdealState {
  return {
    objLoaded: false,
    poseMappingProfileLoaded: false,
    P_camera: createEmptyPose(),
    pFromProfile: null,
    pForWebglRender: null,
    renderBackend: "canvas2d_obj_render_v1",
    renderResolution: null,
    renderedIdealStatus: "idle",
    renderedIdealLandmarkCount: 0,
    renderedIdeal478: null,
    P_confirm: createEmptyPose(),
    poseDiff: createEmptyPoseDiff(),
    renderMs: null,
    detectMs: null,
    warnings: [],
    imageDataUrl: null,
    errorMessage: null,
  }
}

export function parseObjText(objText: string): ObjParseResult {
  const vertices: ObjVertex[] = []
  const faces: ObjFace[] = []
  const warnings: string[] = []
  const lines = objText.split(/\r?\n/)

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) {
      return
    }

    const parts = trimmed.split(/\s+/)
    const keyword = parts[0]
    if (keyword === "v") {
      const values = parts.slice(1, 4).map(Number)
      if (values.length < 3 || values.some((value) => !Number.isFinite(value))) {
        warnings.push(`line ${lineIndex + 1}: invalid vertex`)
        return
      }
      vertices.push({ x: values[0], y: values[1], z: values[2] })
      return
    }

    if (keyword === "f") {
      const indices = parts.slice(1).map((token) => {
        const rawIndex = Number(token.split("/")[0])
        if (!Number.isInteger(rawIndex) || rawIndex === 0) {
          return Number.NaN
        }
        return rawIndex > 0 ? rawIndex - 1 : vertices.length + rawIndex
      })
      if (indices.length < 3 || indices.some((index) => !Number.isInteger(index))) {
        warnings.push(`line ${lineIndex + 1}: invalid face`)
        return
      }
      if (indices.some((index) => index < 0 || index >= vertices.length)) {
        warnings.push(`line ${lineIndex + 1}: face index out of range`)
        return
      }
      faces.push({ indices })
    }
  })

  if (vertices.length === 0) {
    throw new Error("OBJに頂点がありません。")
  }
  if (faces.length === 0) {
    warnings.push("OBJにfaceがありません。点描画のみになります。")
  }

  return { vertices, faces, warnings }
}

export function createObjGeometry(parseResult: ObjParseResult): ObjGeometry {
  return {
    vertices: parseResult.vertices,
    faces: parseResult.faces,
    edges: createUniqueEdges(parseResult.faces),
  }
}

export function createObjSummary(
  fileName: string,
  fileSize: number,
  parseResult: ObjParseResult,
): ObjSummary {
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
  const maxDimension = size ? Math.max(size.x, size.y, size.z) : null

  return {
    fileName,
    fileSize,
    parseStatus: "parsed",
    vertexCount: parseResult.vertices.length,
    faceCount: parseResult.faces.length,
    triangleFaceCount: parseResult.faces.filter((face) => face.indices.length === 3).length,
    polygonFaceCount: parseResult.faces.filter((face) => face.indices.length > 3).length,
    bounds,
    center,
    size,
    maxDimension,
    warningCount: parseResult.warnings.length,
    warningsPreview: parseResult.warnings.slice(0, 8),
    errorMessage: null,
  }
}

export function createObjErrorSummary(
  fileName: string,
  fileSize: number,
  error: unknown,
): ObjSummary {
  const message = error instanceof Error ? error.message : String(error)
  return {
    ...createEmptyObjSummary(),
    fileName,
    fileSize,
    parseStatus: "error",
    errorMessage: message,
  }
}

export function parsePoseMappingProfile(json: unknown): PoseMappingProfile {
  const root = requireRecord(json, "poseMappingProfile")
  const source = isRecord(root.poseMappingProfile)
    ? root.poseMappingProfile
    : root
  const schemaVersion = requireString(source, "schemaVersion")
  const modelType = requireString(source, "modelType")
  const inputFeatures = requireStringArray(source, "inputFeatures")
  const target = requireStringArray(source, "target")
  const tree = requireRecord(source.tree, "tree")
  const expertsSource = requireRecord(source.experts, "experts")

  if (
    schemaVersion !== "pose_mapping_profile_candidate_v1" &&
    schemaVersion !== "pose_mapping_profile_candidate_v2"
  ) {
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
    poseRangeAfter: parsePoseRangeAfter(
      source.poseRangeAfter ?? source.outlierFilterSummary.poseRangeAfter,
    ),
    raw: source,
  }
}

export function evaluatePoseMappingProfile(
  profile: PoseMappingProfile,
  P_camera: PoseMappingPose,
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

  const featureValues = buildPoseMappingFeatureValues(
    model.featureNames,
    P_cameraClamped,
    warnings,
  )
  const scaledFeatures = featureValues.map((value, index) => {
    const mean = model.scaler.mean[index]
    const scale = model.scaler.scale[index]
    if (!Number.isFinite(mean) || !Number.isFinite(scale) || scale === 0) {
      warnings.push(`invalid scaler at feature ${model.featureNames[index] ?? index}`)
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

export function convertProfilePoseToWebglRenderPose(
  pFromProfile: PoseMappingPose,
): PoseMappingPose {
  return { ...pFromProfile }
}

export function resolveRenderSettings(profile: PoseMappingProfile): RenderSettings {
  const appearanceResolution = getRenderResolutionFromRecord(
    profile.datasetMetadata.renderAppearanceApplied?.renderResolution,
  )
  const renderSettingsResolution = getCanvasResolutionFromRenderSettings(
    profile.datasetMetadata.renderSettings,
  )
  return appearanceResolution ?? renderSettingsResolution ?? {
    width: DEFAULT_RENDER_WIDTH,
    height: DEFAULT_RENDER_HEIGHT,
    source: "fallbackDefault",
  }
}

export function resolveRenderAppearance(profile: PoseMappingProfile): RenderAppearance {
  const source = profile.datasetMetadata.renderAppearanceApplied
  const material = isRecord(source?.material) ? source.material : null
  const lighting = isRecord(source?.lighting) ? source.lighting : null
  const camera = isRecord(source?.camera) ? source.camera : null
  const lightDirection = readVector(lighting?.keyLightDirection) ?? DEFAULT_RENDER_APPEARANCE.lightDirection

  return {
    backgroundColor: readColor(source?.backgroundColor, DEFAULT_RENDER_APPEARANCE.backgroundColor),
    skinColor: readColor(source?.skinColor, DEFAULT_RENDER_APPEARANCE.skinColor),
    scale: readFiniteNumber(camera?.scale, DEFAULT_RENDER_APPEARANCE.scale),
    verticalOffset: readFiniteNumber(
      camera?.verticalOffset,
      DEFAULT_RENDER_APPEARANCE.verticalOffset,
    ),
    ambient: readFiniteNumber(material?.ambient, DEFAULT_RENDER_APPEARANCE.ambient),
    diffuse: readFiniteNumber(material?.diffuse, DEFAULT_RENDER_APPEARANCE.diffuse),
    lightDirection: normalizeVector(lightDirection),
  }
}

export function renderObjToCanvas(input: {
  canvas: HTMLCanvasElement
  geometry: ObjGeometry
  summary: ObjSummary
  pose: PoseMappingPose
  settings: RenderSettings
  appearance: RenderAppearance
}): void {
  const { canvas, geometry, summary, pose, settings, appearance } = input
  canvas.width = settings.width
  canvas.height = settings.height
  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("Canvas2D contextを作成できません。")
  }

  context.setTransform(1, 0, 0, 1, 0, 0)
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = appearance.backgroundColor
  context.fillRect(0, 0, canvas.width, canvas.height)

  if (!summary.center || !summary.maxDimension || summary.maxDimension <= 0) {
    throw new Error("OBJ boundsが不正です。")
  }

  const projected = geometry.vertices.map((vertex) =>
    projectObjVertex(vertex, summary.center!, summary.maxDimension!, pose, canvas, appearance),
  )
  const triangles = triangulateFaces(geometry.faces)
    .map((indices) => {
      const points = indices.map((index) => projected[index])
      if (points.some((point) => !point)) {
        return null
      }
      const faceVertices = indices.map((index) => {
        const centered = subtractVector(geometry.vertices[index], summary.center!)
        return rotateVector(centered, pose)
      })
      const normal = orientNormalToCamera(
        normalizeVector(crossVector(
          subtractVector(faceVertices[1], faceVertices[0]),
          subtractVector(faceVertices[2], faceVertices[0]),
        )),
      )
      return {
        indices,
        points: points as Array<ObjVertex & { screenX: number; screenY: number }>,
        depth: points.reduce((sum, point) => sum + point.z, 0) / points.length,
        brightness: calculateBrightness(normal, appearance),
      }
    })
    .filter((triangle): triangle is NonNullable<typeof triangle> => Boolean(triangle))
    .sort((a, b) => a.depth - b.depth)

  for (const triangle of triangles) {
    context.beginPath()
    context.moveTo(triangle.points[0].screenX, triangle.points[0].screenY)
    context.lineTo(triangle.points[1].screenX, triangle.points[1].screenY)
    context.lineTo(triangle.points[2].screenX, triangle.points[2].screenY)
    context.closePath()
    context.fillStyle = shadeColor(appearance.skinColor, triangle.brightness)
    context.fill()
    context.strokeStyle = "rgba(34, 42, 51, 0.08)"
    context.lineWidth = 0.5
    context.stroke()
  }

  if (triangles.length === 0) {
    context.fillStyle = appearance.skinColor
    for (const point of projected) {
      context.beginPath()
      context.arc(point.screenX, point.screenY, 1.2, 0, Math.PI * 2)
      context.fill()
    }
  }
}

export function buildRenderedIdealStateFromDetection(input: {
  result: RenderedIdealDetectionResult
  P_camera: FacePose
  pFromProfile: PoseMappingPose
  pForWebglRender: PoseMappingPose
  renderSettings: RenderSettings
  renderMs: number
  detectMs: number
  warnings: string[]
  imageDataUrl: string
}): RenderedIdealState {
  const landmarks = input.result.faceLandmarks[0] ?? []
  const matrix = summarizeFaceMatrix(input.result.facialTransformationMatrixes[0])
  const pose = matrix?.rotationDeg ?? estimatePoseFromMatrix(input.result.facialTransformationMatrixes[0]) ?? createEmptyPose()
  const hasFace = input.result.faceLandmarks.length > 0
  const validLandmarks = landmarks.length === REQUIRED_LANDMARK_COUNT
  const renderedIdeal478 = hasFace && validLandmarks ? mapLandmarks(landmarks) : null
  const renderedIdealStatus = !hasFace
    ? "missing"
    : validLandmarks
      ? "detected"
      : "invalid"

  return {
    objLoaded: true,
    poseMappingProfileLoaded: true,
    P_camera: input.P_camera,
    pFromProfile: input.pFromProfile,
    pForWebglRender: input.pForWebglRender,
    renderBackend: "canvas2d_obj_render_v1",
    renderResolution: {
      width: input.renderSettings.width,
      height: input.renderSettings.height,
    },
    renderedIdealStatus,
    renderedIdealLandmarkCount: landmarks.length,
    renderedIdeal478,
    P_confirm: pose,
    poseDiff: calculatePoseDiff(input.P_camera, pose),
    renderMs: input.renderMs,
    detectMs: input.detectMs,
    warnings: input.warnings,
    imageDataUrl: input.imageDataUrl,
    errorMessage: renderedIdealStatus === "detected" ? null : renderedIdealStatus,
  }
}

export function createRenderedIdealErrorState(input: {
  P_camera: FacePose
  pFromProfile: PoseMappingPose | null
  pForWebglRender: PoseMappingPose | null
  error: unknown
}): RenderedIdealState {
  const message = input.error instanceof Error ? input.error.message : String(input.error)
  return {
    ...createEmptyRenderedIdealState(),
    objLoaded: true,
    poseMappingProfileLoaded: true,
    P_camera: input.P_camera,
    pFromProfile: input.pFromProfile,
    pForWebglRender: input.pForWebglRender,
    renderedIdealStatus: "error",
    errorMessage: message,
  }
}

export function calculatePoseDiff(
  P_camera: FacePose,
  P_confirm: FacePose,
): PoseDiff {
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
      : Math.hypot(...values.map((value) => value ?? 0)),
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
    renderBackend: getOptionalString(source.requiredRenderBackend) ??
      (datasetMetadata ? getOptionalString(datasetMetadata.renderBackend) : null),
    renderer,
    datasetSchemaVersion: getOptionalString(source.datasetSchemaVersion) ??
      (datasetMetadata ? getOptionalString(datasetMetadata.schemaVersion) : null),
    renderAppearance: renderAppearance && isRecord(renderAppearance) ? renderAppearance : null,
  }
}

function clampPoseByProfileRange(
  profile: PoseMappingProfile,
  pose: PoseMappingPose,
  warnings: string[],
): PoseMappingPose {
  const clamped = { ...pose }
  const mapping: Array<[keyof PoseMappingPose, string]> = [
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
    if (range.min !== null && clamped[axis] < range.min) {
      clamped[axis] = range.min
    }
    if (range.max !== null && clamped[axis] > range.max) {
      clamped[axis] = range.max
    }
    if (clamped[axis] !== before) {
      warnings.push(`${key} was clamped from ${before} to ${clamped[axis]}`)
    }
  }
  return clamped
}

function selectPoseMappingLeaf(
  profile: PoseMappingProfile,
  pose: PoseMappingPose,
  warnings: string[],
): number | null {
  const tree = profile.tree
  const inputValues = profile.inputFeatures.map((feature) =>
    getPoseMappingBaseFeature(feature, pose),
  )
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
      warnings.push(`tree node ${node} has invalid feature or threshold`)
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
  pose: PoseMappingPose,
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
  pose: PoseMappingPose,
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

function getPoseMappingBaseFeature(featureName: string, pose: PoseMappingPose): number {
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
): number[] {
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

function getTargetOutput(
  profile: PoseMappingProfile,
  output: number[],
  targetName: string,
): number {
  const index = profile.target.indexOf(targetName)
  const value = output[index]
  if (!Number.isFinite(value)) {
    throw new Error(`profile output ${targetName} is not finite`)
  }
  return value
}

function createUniqueEdges(faces: readonly ObjFace[]): ObjEdge[] {
  const edges = new Map<string, ObjEdge>()
  for (const face of faces) {
    for (let index = 0; index < face.indices.length; index += 1) {
      const a = face.indices[index]
      const b = face.indices[(index + 1) % face.indices.length]
      const key = a < b ? `${a}:${b}` : `${b}:${a}`
      if (!edges.has(key)) {
        edges.set(key, { a, b })
      }
    }
  }
  return [...edges.values()]
}

function calculateObjBounds(vertices: readonly ObjVertex[]): ObjBounds | null {
  if (vertices.length === 0) {
    return null
  }
  const xValues = vertices.map((vertex) => vertex.x)
  const yValues = vertices.map((vertex) => vertex.y)
  const zValues = vertices.map((vertex) => vertex.z)
  return {
    minX: Math.min(...xValues),
    minY: Math.min(...yValues),
    minZ: Math.min(...zValues),
    maxX: Math.max(...xValues),
    maxY: Math.max(...yValues),
    maxZ: Math.max(...zValues),
  }
}

function triangulateFaces(faces: readonly ObjFace[]): Array<[number, number, number]> {
  const triangles: Array<[number, number, number]> = []
  for (const face of faces) {
    for (let index = 1; index + 1 < face.indices.length; index += 1) {
      triangles.push([face.indices[0], face.indices[index], face.indices[index + 1]])
    }
  }
  return triangles
}

function projectObjVertex(
  vertex: ObjVertex,
  center: ObjVertex,
  maxDimension: number,
  pose: PoseMappingPose,
  canvas: HTMLCanvasElement,
  appearance: RenderAppearance,
) {
  const normalized = {
    x: (vertex.x - center.x) / maxDimension,
    y: (vertex.y - center.y) / maxDimension,
    z: (vertex.z - center.z) / maxDimension,
  }
  const rotated = rotateVector(normalized, pose)
  const canvasScale = Math.min(canvas.width, canvas.height) * 0.86 * appearance.scale
  return {
    ...rotated,
    screenX: canvas.width / 2 + rotated.x * canvasScale,
    screenY: canvas.height / 2 - (rotated.y + appearance.verticalOffset) * canvasScale,
  }
}

function rotateVector(vertex: ObjVertex, pose: PoseMappingPose): ObjVertex {
  const yaw = degreesToRadians(pose.yaw)
  const pitch = degreesToRadians(pose.pitch)
  const roll = degreesToRadians(pose.roll)
  const cosY = Math.cos(yaw)
  const sinY = Math.sin(yaw)
  const yawed = {
    x: vertex.x * cosY + vertex.z * sinY,
    y: vertex.y,
    z: -vertex.x * sinY + vertex.z * cosY,
  }
  const cosX = Math.cos(pitch)
  const sinX = Math.sin(pitch)
  const pitched = {
    x: yawed.x,
    y: yawed.y * cosX - yawed.z * sinX,
    z: yawed.y * sinX + yawed.z * cosX,
  }
  const cosZ = Math.cos(roll)
  const sinZ = Math.sin(roll)
  return {
    x: pitched.x * cosZ - pitched.y * sinZ,
    y: pitched.x * sinZ + pitched.y * cosZ,
    z: pitched.z,
  }
}

function calculateBrightness(normal: ObjVertex, appearance: RenderAppearance): number {
  const ambient = clamp(appearance.ambient, 0, 1)
  const diffuse = Math.max(0, dotVector(normal, appearance.lightDirection)) *
    clamp(appearance.diffuse, 0, 1)
  return clamp(ambient + diffuse, 0.28, 1)
}

function shadeColor(hex: string, brightness: number): string {
  const color = hexToRgb(hex) ?? hexToRgb(DEFAULT_RENDER_APPEARANCE.skinColor)!
  return `rgb(${Math.round(color.r * brightness)}, ${Math.round(color.g * brightness)}, ${Math.round(color.b * brightness)})`
}

function readColor(value: unknown, fallback: string): string {
  return typeof value === "string" && hexToRgb(value) ? value : fallback
}

function hexToRgb(value: string): { r: number; g: number; b: number } | null {
  const match = value.trim().match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i)
  if (!match) {
    return null
  }
  return {
    r: Number.parseInt(match[1], 16),
    g: Number.parseInt(match[2], 16),
    b: Number.parseInt(match[3], 16),
  }
}

function readVector(value: unknown): ObjVertex | null {
  if (!isRecord(value)) {
    return null
  }
  const x = getOptionalFiniteNumber(value.x)
  const y = getOptionalFiniteNumber(value.y)
  const z = getOptionalFiniteNumber(value.z)
  return x === null || y === null || z === null ? null : { x, y, z }
}

function getRenderResolutionFromRecord(value: unknown): RenderSettings | null {
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
    source: "profile.renderAppearance.applied.renderResolution",
  }
}

function getCanvasResolutionFromRenderSettings(value: Record<string, unknown> | null): RenderSettings | null {
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
    source: "profile.renderSettings.canvasWidthHeight",
  }
}

function getPositiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : null
}

function isFinitePose(pose: PoseMappingPose): boolean {
  return Number.isFinite(pose.yaw) && Number.isFinite(pose.pitch) && Number.isFinite(pose.roll)
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

function requireString(source: Record<string, unknown>, key: string): string {
  const value = source[key]
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${key} is required`)
  }
  return value
}

function getOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null
}

function requireStringArray(source: Record<string, unknown>, key: string): string[] {
  const value = source[key]
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new Error(`${key} must be a string array`)
  }
  return [...value]
}

function requireNumberArray(source: Record<string, unknown>, key: string): number[] {
  const value = source[key]
  if (!Array.isArray(value)) {
    throw new Error(`${key} must be a number array`)
  }
  return value.map((item) => requireFiniteNumberValue(item, key))
}

function requireFiniteNumber(source: Record<string, unknown>, key: string): number {
  return requireFiniteNumberValue(source[key], key)
}

function requireFiniteNumberValue(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`)
  }
  return value
}

function getOptionalFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function readFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function subtractNullable(a: number | null, b: number | null): number | null {
  return a === null || b === null ? null : a - b
}

function createEmptyPoseDiff(): PoseDiff {
  return {
    yaw: null,
    pitch: null,
    roll: null,
    magnitude: null,
  }
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180
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

function dotVector(a: ObjVertex, b: ObjVertex): number {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

function normalizeVector(vector: ObjVertex): ObjVertex {
  const length = Math.hypot(vector.x, vector.y, vector.z)
  if (!Number.isFinite(length) || length <= 0) {
    return { x: 0, y: 0, z: 1 }
  }
  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  }
}

function orientNormalToCamera(normal: ObjVertex): ObjVertex {
  return normal.z < 0 ? { x: -normal.x, y: -normal.y, z: -normal.z } : normal
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
