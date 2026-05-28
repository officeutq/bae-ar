import type { FaceGeometry } from "../face/FaceGeometry"
import type { FaceLandmark, FacePose } from "../face/FaceFrame"
import type {
  IdealFace,
  IdealFaceLandmark3D,
  IdealFacePoint3D,
} from "./IdealFace"

export type IdealFaceProjectionStatus =
  | "projected"
  | "no_face_frame"
  | "face_not_detected"
  | "no_face_geometry"

export interface ProjectedIdealPoint {
  id: string
  x: number
  y: number
  z: number
  source: IdealFacePoint3D
}

export interface IdealFaceProjectionResult {
  status: IdealFaceProjectionStatus
  idealFaceId: string
  idealFaceVersion: string
  points: ProjectedIdealPoint[]
}

export interface ProjectedIdealLandmarkSameUnit {
  index: number
  x: number
  y: number
  z: number
  confidence: number
}

export interface ProjectedIdealLandmarkImageNormalized {
  index: number
  x: number
  y: number
  z: number
  confidence: number
}

/** @deprecated Use sameUnitLandmarks or imageLandmarks explicitly. */
export type ProjectedIdealLandmark2D = ProjectedIdealLandmarkImageNormalized

export type IdealLandmarks3DProjectionStatus =
  | "not_available"
  | "missing_face_pose"
  | "projected"

export interface IdealLandmarks3DProjectionSummary {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  zMin: number
  zMax: number
}

export interface Landmark2DBoundsSummary {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  width: number
  height: number
  aspectRatio: number | null
}

export interface Landmark3DBoundsSummary extends Landmark2DBoundsSummary {
  zMin: number
  zMax: number
  zRange: number
}

export interface IdealLandmarks3DProjectionAspectRatioDebug {
  asset?: number | null
  rotated?: number | null
  aligned?: number | null
  image?: number | null
  current?: number | null
  currentMinusAligned?: number | null
  currentMinusImage?: number | null
}

export type ProjectionCoordinateConversionMode =
  "same_unit_to_image_normalized_v1"

export interface ProjectionCoordinateDebug {
  sameUnitBounds?: Landmark3DBoundsSummary
  imageBounds?: Landmark3DBoundsSummary
  currentBounds?: Landmark2DBoundsSummary
  videoAspectRatio: number | null
  conversionMode: ProjectionCoordinateConversionMode
  fallbackUsed: boolean
  reason?: string
}

export interface IdealLandmarks3DProjectionDebug {
  assetBounds?: Landmark3DBoundsSummary
  rotatedBounds?: Landmark3DBoundsSummary
  alignedBounds?: Landmark3DBoundsSummary
  imageBounds?: Landmark3DBoundsSummary
  currentBounds?: Landmark2DBoundsSummary
  coordinate?: ProjectionCoordinateDebug
  aspectRatio: IdealLandmarks3DProjectionAspectRatioDebug
}

export type IdealLandmarks3DProjectionAlignmentMode =
  | "none"
  | "face_center_and_uniform_scale"

export interface IdealLandmarks3DProjectionPoint2D {
  x: number
  y: number
}

export interface ProjectionScaleBasisDebug {
  mode: "contain"
  currentWidth: number
  currentHeight: number
  projectedWidth: number
  projectedHeight: number
  widthRatio: number
  heightRatio: number
  chosenScale: number
  limitingAxis: "width" | "height"
}

export interface IdealLandmarks3DProjectionAlignment {
  mode: IdealLandmarks3DProjectionAlignmentMode
  scale: number | null
  translateX: number
  translateY: number
  currentCenter?: IdealLandmarks3DProjectionPoint2D
  projectedCenter?: IdealLandmarks3DProjectionPoint2D
  currentSize?: number
  projectedSize?: number
  currentAspectRatio?: number | null
  projectedAspectRatio?: number | null
  aspectRatioDifference?: number | null
  scaleBasis?: ProjectionScaleBasisDebug
  reason?: string
}

export interface IdealLandmarks3DProjectionResult {
  status: IdealLandmarks3DProjectionStatus
  sameUnitLandmarks: ProjectedIdealLandmarkSameUnit[]
  imageLandmarks: ProjectedIdealLandmarkImageNormalized[]
  /** @deprecated Use sameUnitLandmarks or imageLandmarks explicitly. */
  landmarks: ProjectedIdealLandmark2D[]
  landmarkCount: number
  sourceIdealFaceId?: string
  sourceIdealFaceName?: string
  summary?: IdealLandmarks3DProjectionSummary
  alignment?: IdealLandmarks3DProjectionAlignment
  debug?: IdealLandmarks3DProjectionDebug
}

export interface ProjectIdealLandmarks3DOptions {
  detected?: boolean
  currentLandmarks?: FaceLandmark[]
  faceGeometry?: FaceGeometry
  videoWidth?: number
  videoHeight?: number
  debugPivotZ?: number
}

const DEG_TO_RAD = Math.PI / 180
const IDEAL_LANDMARKS_3D_COUNT = 478
const IDEAL_LANDMARKS_3D_CENTER = {
  x: 0,
  y: 0,
  z: 0,
}

interface RotatablePoint3D {
  x: number
  y: number
  z: number
}

interface PointBounds2D {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

interface AlignmentMetrics {
  center?: IdealLandmarks3DProjectionPoint2D
  bounds?: Landmark2DBoundsSummary
  aspectRatio?: number
}

interface CurrentFaceProjectionMetrics {
  image: AlignmentMetrics
  sameUnit: AlignmentMetrics
}

interface VideoAspectRatioResult {
  value: number
  debugValue: number | null
  fallbackUsed: boolean
  reason?: string
}

export function projectIdealFaceControlPoints(
  idealFace: IdealFace,
  pose: FacePose | undefined,
  geometry: FaceGeometry | undefined,
  detected: boolean,
): IdealFaceProjectionResult {
  const baseResult: Omit<IdealFaceProjectionResult, "status"> = {
    idealFaceId: idealFace.metadata.id,
    idealFaceVersion: idealFace.metadata.version,
    points: [],
  }

  if (!pose) {
    return {
      ...baseResult,
      status: "no_face_frame",
    }
  }

  if (!detected) {
    return {
      ...baseResult,
      status: "face_not_detected",
    }
  }

  if (!geometry?.faceCenter || !geometry.faceWidth || !geometry.faceHeight) {
    return {
      ...baseResult,
      status: "no_face_geometry",
    }
  }

  const scaleX = geometry.faceWidth * 1.3
  const scaleY = geometry.faceHeight

  return {
    ...baseResult,
    status: "projected",
    points: idealFace.model.controlPoints.map((point) => {
      const rotated = rotatePoint(point, pose)

      return {
        id: point.id,
        x: geometry.faceCenter!.x + rotated.x * scaleX,
        y: geometry.faceCenter!.y - rotated.y * scaleY,
        z: geometry.faceCenter!.z + rotated.z * Math.max(scaleX, scaleY),
        source: point,
      }
    }),
  }
}

export function projectIdealLandmarks3D(
  idealFace: IdealFace,
  facePose: FacePose | null | undefined,
  optionsOrDetected: ProjectIdealLandmarks3DOptions | boolean = {},
): IdealLandmarks3DProjectionResult {
  const options = normalizeProjectIdealLandmarks3DOptions(optionsOrDetected)
  const baseResult = {
    sourceIdealFaceId: idealFace.metadata.id,
    sourceIdealFaceName: idealFace.metadata.name,
  }
  const idealLandmarks3D = idealFace.model.idealLandmarks3D

  if (!idealLandmarks3D || idealLandmarks3D.length !== IDEAL_LANDMARKS_3D_COUNT) {
    return {
      ...baseResult,
      status: "not_available",
      sameUnitLandmarks: [],
      imageLandmarks: [],
      landmarks: [],
      landmarkCount: idealLandmarks3D?.length ?? 0,
      alignment: createNoAlignment("idealLandmarks3D 478 points are not available"),
      debug: createProjectionDebug({
        assetBounds: summarizeLandmark3DBounds(idealLandmarks3D),
        currentBounds: summarizeLandmark2DBounds(options.currentLandmarks),
      }),
    }
  }

  if (!facePose || options.detected === false) {
    return {
      ...baseResult,
      status: "missing_face_pose",
      sameUnitLandmarks: [],
      imageLandmarks: [],
      landmarks: [],
      landmarkCount: idealLandmarks3D.length,
      alignment: createNoAlignment("current face pose is missing"),
      debug: createProjectionDebug({
        assetBounds: summarizeLandmark3DBounds(idealLandmarks3D),
        currentBounds: summarizeLandmark2DBounds(options.currentLandmarks),
      }),
    }
  }

  const rotationCenter = getProjectionRotationCenter(options)
  const rotatedLandmarks = idealLandmarks3D.map((landmark) =>
    projectIdealLandmark3D(landmark, facePose, rotationCenter),
  )
  const videoAspectRatio = getVideoAspectRatio(options)
  const currentMetrics = getCurrentFaceProjectionMetrics(
    options,
    videoAspectRatio.value,
  )
  const alignmentResult = alignProjectedIdealLandmarks(
    rotatedLandmarks,
    currentMetrics,
  )
  const imageConversionResult = convertSameUnitLandmarksToImageNormalized(
    alignmentResult.sameUnitLandmarks,
    currentMetrics.image.center,
    videoAspectRatio,
  )
  const imageLandmarks = imageConversionResult.landmarks
  const sameUnitBounds = summarizeLandmark3DBounds(
    alignmentResult.sameUnitLandmarks,
  )
  const imageBounds = summarizeLandmark3DBounds(imageLandmarks)
  const currentBounds = summarizeLandmark2DBounds(options.currentLandmarks)

  return {
    ...baseResult,
    status: "projected",
    sameUnitLandmarks: alignmentResult.sameUnitLandmarks,
    imageLandmarks,
    landmarks: imageLandmarks,
    landmarkCount: imageLandmarks.length,
    summary: summarizeProjectedIdealLandmarks(imageLandmarks),
    alignment: alignmentResult.alignment,
    debug: createProjectionDebug({
      assetBounds: summarizeLandmark3DBounds(idealLandmarks3D),
      rotatedBounds: summarizeLandmark3DBounds(rotatedLandmarks),
      alignedBounds: sameUnitBounds,
      imageBounds,
      currentBounds,
      coordinate: {
        sameUnitBounds,
        imageBounds,
        currentBounds,
        videoAspectRatio: videoAspectRatio.debugValue,
        conversionMode: "same_unit_to_image_normalized_v1",
        fallbackUsed:
          videoAspectRatio.fallbackUsed || imageConversionResult.fallbackUsed,
        reason: [videoAspectRatio.reason, imageConversionResult.reason]
          .filter((reason): reason is string => Boolean(reason))
          .join("; ") || undefined,
      },
    }),
  }
}

function normalizeProjectIdealLandmarks3DOptions(
  optionsOrDetected: ProjectIdealLandmarks3DOptions | boolean,
): ProjectIdealLandmarks3DOptions {
  if (typeof optionsOrDetected === "boolean") {
    return {
      detected: optionsOrDetected,
    }
  }

  return optionsOrDetected
}

function alignProjectedIdealLandmarks(
  landmarks: ProjectedIdealLandmarkSameUnit[],
  currentFaceMetrics: CurrentFaceProjectionMetrics,
): {
  sameUnitLandmarks: ProjectedIdealLandmarkSameUnit[]
  alignment: IdealLandmarks3DProjectionAlignment
} {
  const currentMetrics = currentFaceMetrics.sameUnit
  const projectedMetrics = getProjectedIdealAlignmentMetrics(landmarks)
  const aspectRatioDifference = getAspectRatioDifference(
    currentMetrics.aspectRatio,
    projectedMetrics.aspectRatio,
  )

  if (!currentMetrics.center || !currentMetrics.bounds) {
    return {
      sameUnitLandmarks: landmarks,
      alignment: {
        ...createNoAlignment("current face bounds are unavailable"),
        currentCenter: currentMetrics.center,
        projectedCenter: projectedMetrics.center,
        currentAspectRatio: currentMetrics.aspectRatio ?? null,
        projectedAspectRatio: projectedMetrics.aspectRatio ?? null,
        aspectRatioDifference,
      },
    }
  }

  if (!projectedMetrics.center || !projectedMetrics.bounds) {
    return {
      sameUnitLandmarks: landmarks,
      alignment: {
        ...createNoAlignment("projected ideal bounds are unavailable"),
        currentCenter: currentMetrics.center,
        projectedCenter: projectedMetrics.center,
        currentAspectRatio: currentMetrics.aspectRatio ?? null,
        projectedAspectRatio: projectedMetrics.aspectRatio ?? null,
        aspectRatioDifference,
      },
    }
  }

  const widthRatio = currentMetrics.bounds.width / projectedMetrics.bounds.width
  const heightRatio = currentMetrics.bounds.height / projectedMetrics.bounds.height
  const limitingAxis = widthRatio <= heightRatio ? "width" : "height"
  const scale = Math.min(widthRatio, heightRatio)
  const currentSize =
    limitingAxis === "width"
      ? currentMetrics.bounds.width
      : currentMetrics.bounds.height
  const projectedSize =
    limitingAxis === "width"
      ? projectedMetrics.bounds.width
      : projectedMetrics.bounds.height
  const currentCenter = currentMetrics.center
  const projectedCenter = projectedMetrics.center
  const translateX = currentMetrics.center.x - projectedMetrics.center.x * scale
  const translateY = currentMetrics.center.y - projectedMetrics.center.y * scale

  return {
    sameUnitLandmarks: landmarks.map((landmark) => ({
      ...landmark,
      x: (landmark.x - projectedCenter.x) * scale + currentCenter.x,
      y: (landmark.y - projectedCenter.y) * scale + currentCenter.y,
      z: landmark.z * scale,
    })),
    alignment: {
      mode: "face_center_and_uniform_scale",
      scale,
      translateX,
      translateY,
      currentCenter: currentMetrics.center,
      projectedCenter: projectedMetrics.center,
      currentSize,
      projectedSize,
      currentAspectRatio: currentMetrics.aspectRatio ?? null,
      projectedAspectRatio: projectedMetrics.aspectRatio ?? null,
      aspectRatioDifference,
      scaleBasis: {
        mode: "contain",
        currentWidth: currentMetrics.bounds.width,
        currentHeight: currentMetrics.bounds.height,
        projectedWidth: projectedMetrics.bounds.width,
        projectedHeight: projectedMetrics.bounds.height,
        widthRatio,
        heightRatio,
        chosenScale: scale,
        limitingAxis,
      },
    },
  }
}

function getCurrentFaceProjectionMetrics(
  options: ProjectIdealLandmarks3DOptions,
  videoAspectRatio: number,
): CurrentFaceProjectionMetrics {
  const bounds = options.currentLandmarks
    ? calculatePointBounds(options.currentLandmarks)
    : null
  const imageCenter =
    getBoundsCenter(bounds) ??
    getAveragePoint(options.currentLandmarks) ??
    toPoint2D(options.faceGeometry?.faceCenter)
  const boundsSummary = bounds ? createLandmark2DBoundsSummary(bounds) : undefined
  const imageMetrics = {
    center: imageCenter,
    bounds: isUsableBoundsSummary(boundsSummary) ? boundsSummary : undefined,
    aspectRatio: boundsSummary?.aspectRatio ?? undefined,
  }
  const currentSameUnitLandmarks =
    options.currentLandmarks && imageCenter
      ? options.currentLandmarks.map((landmark) =>
          imageNormalizedPointToSameUnit(landmark, imageCenter, videoAspectRatio),
        )
      : undefined
  const sameUnitBounds = currentSameUnitLandmarks
    ? calculatePointBounds(currentSameUnitLandmarks)
    : null
  const sameUnitBoundsSummary = sameUnitBounds
    ? createLandmark2DBoundsSummary(sameUnitBounds)
    : undefined
  const sameUnitCenter =
    getBoundsCenter(sameUnitBounds) ??
    getAveragePoint(currentSameUnitLandmarks) ??
    (imageCenter ? { x: 0, y: 0 } : undefined)

  return {
    image: imageMetrics,
    sameUnit: {
      center: sameUnitCenter,
      bounds: isUsableBoundsSummary(sameUnitBoundsSummary)
        ? sameUnitBoundsSummary
        : undefined,
      aspectRatio: sameUnitBoundsSummary?.aspectRatio ?? undefined,
    },
  }
}

function getProjectedIdealAlignmentMetrics(
  landmarks: ProjectedIdealLandmarkSameUnit[],
): AlignmentMetrics {
  const bounds = calculatePointBounds(landmarks)
  const boundsSummary = bounds ? createLandmark2DBoundsSummary(bounds) : undefined

  return {
    center: getBoundsCenter(bounds),
    bounds: isUsableBoundsSummary(boundsSummary) ? boundsSummary : undefined,
    aspectRatio: boundsSummary?.aspectRatio ?? undefined,
  }
}

function imageNormalizedPointToSameUnit(
  point: { x: number; y: number },
  center: IdealLandmarks3DProjectionPoint2D,
  videoAspectRatio: number,
): IdealLandmarks3DProjectionPoint2D {
  return {
    x: (point.x - center.x) * videoAspectRatio,
    y: point.y - center.y,
  }
}

function convertSameUnitLandmarksToImageNormalized(
  landmarks: ProjectedIdealLandmarkSameUnit[],
  currentImageCenter: IdealLandmarks3DProjectionPoint2D | undefined,
  videoAspectRatio: VideoAspectRatioResult,
): {
  landmarks: ProjectedIdealLandmarkImageNormalized[]
  fallbackUsed: boolean
  reason?: string
} {
  const imageCenter = currentImageCenter ?? { x: 0.5, y: 0.5 }

  return {
    landmarks: landmarks.map((landmark) => ({
      ...landmark,
      x: imageCenter.x + landmark.x / videoAspectRatio.value,
      y: imageCenter.y + landmark.y,
    })),
    fallbackUsed: !currentImageCenter,
    reason: currentImageCenter
      ? undefined
      : "current face image-normalized center is unavailable; used 0.5 / 0.5",
  }
}

function getAveragePoint(
  points: Array<{ x: number; y: number }> | undefined,
): IdealLandmarks3DProjectionPoint2D | undefined {
  if (!points || points.length === 0) {
    return undefined
  }

  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  }
}

function toPoint2D(
  point: { x: number; y: number } | null | undefined,
): IdealLandmarks3DProjectionPoint2D | undefined {
  if (!point) {
    return undefined
  }

  return {
    x: point.x,
    y: point.y,
  }
}

function calculatePointBounds(
  points: Array<{ x: number; y: number }>,
): PointBounds2D | null {
  const first = points[0]

  if (!first) {
    return null
  }

  return points.reduce(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      maxX: Math.max(bounds.maxX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxY: Math.max(bounds.maxY, point.y),
    }),
    {
      minX: first.x,
      maxX: first.x,
      minY: first.y,
      maxY: first.y,
    },
  )
}

function getBoundsCenter(
  bounds: ReturnType<typeof calculatePointBounds>,
): IdealLandmarks3DProjectionPoint2D | undefined {
  if (!bounds) {
    return undefined
  }

  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  }
}

function isUsableBoundsSummary(
  bounds: Landmark2DBoundsSummary | undefined,
): bounds is Landmark2DBoundsSummary {
  return Boolean(
    bounds &&
      getPositiveNumber(bounds.width) &&
      getPositiveNumber(bounds.height),
  )
}

function getAspectRatio(
  width: number | null | undefined,
  height: number | null | undefined,
): number | undefined {
  const positiveWidth = getPositiveNumber(width)
  const positiveHeight = getPositiveNumber(height)

  return positiveWidth && positiveHeight
    ? positiveWidth / positiveHeight
    : undefined
}

function getAspectRatioDifference(
  currentAspectRatio: number | undefined,
  projectedAspectRatio: number | undefined,
): number | null {
  return currentAspectRatio !== undefined && projectedAspectRatio !== undefined
    ? currentAspectRatio - projectedAspectRatio
    : null
}

function getVideoAspectRatio(
  options: ProjectIdealLandmarks3DOptions,
): VideoAspectRatioResult {
  const positiveWidth = getPositiveNumber(options.videoWidth)
  const positiveHeight = getPositiveNumber(options.videoHeight)

  if (positiveWidth && positiveHeight) {
    return {
      value: positiveWidth / positiveHeight,
      debugValue: positiveWidth / positiveHeight,
      fallbackUsed: false,
    }
  }

  return {
    value: 1,
    debugValue: null,
    fallbackUsed: true,
    reason: "runtime video size is unavailable; used video aspect ratio 1",
  }
}

function createProjectionDebug(input: {
  assetBounds?: Landmark3DBoundsSummary
  rotatedBounds?: Landmark3DBoundsSummary
  alignedBounds?: Landmark3DBoundsSummary
  imageBounds?: Landmark3DBoundsSummary
  currentBounds?: Landmark2DBoundsSummary
  coordinate?: ProjectionCoordinateDebug
}): IdealLandmarks3DProjectionDebug {
  return {
    assetBounds: input.assetBounds,
    rotatedBounds: input.rotatedBounds,
    alignedBounds: input.alignedBounds,
    imageBounds: input.imageBounds,
    currentBounds: input.currentBounds,
    coordinate: input.coordinate,
    aspectRatio: {
      asset: input.assetBounds?.aspectRatio ?? null,
      rotated: input.rotatedBounds?.aspectRatio ?? null,
      aligned: input.alignedBounds?.aspectRatio ?? null,
      image: input.imageBounds?.aspectRatio ?? null,
      current: input.currentBounds?.aspectRatio ?? null,
      currentMinusAligned:
        input.currentBounds?.aspectRatio !== null &&
        input.currentBounds?.aspectRatio !== undefined &&
        input.alignedBounds?.aspectRatio !== null &&
        input.alignedBounds?.aspectRatio !== undefined
          ? input.currentBounds.aspectRatio - input.alignedBounds.aspectRatio
          : null,
      currentMinusImage:
        input.currentBounds?.aspectRatio !== null &&
        input.currentBounds?.aspectRatio !== undefined &&
        input.imageBounds?.aspectRatio !== null &&
        input.imageBounds?.aspectRatio !== undefined
          ? input.currentBounds.aspectRatio - input.imageBounds.aspectRatio
          : null,
    },
  }
}

function summarizeLandmark2DBounds(
  points: Array<{ x: number; y: number }> | undefined,
): Landmark2DBoundsSummary | undefined {
  const bounds = points ? calculatePointBounds(points) : null

  if (!bounds) {
    return undefined
  }

  return createLandmark2DBoundsSummary(bounds)
}

function summarizeLandmark3DBounds(
  points: Array<{ x: number; y: number; z: number }> | undefined,
): Landmark3DBoundsSummary | undefined {
  const first = points?.[0]

  if (!points || !first) {
    return undefined
  }

  const bounds = points.reduce(
    (currentBounds, point) => ({
      minX: Math.min(currentBounds.minX, point.x),
      maxX: Math.max(currentBounds.maxX, point.x),
      minY: Math.min(currentBounds.minY, point.y),
      maxY: Math.max(currentBounds.maxY, point.y),
      minZ: Math.min(currentBounds.minZ, point.z),
      maxZ: Math.max(currentBounds.maxZ, point.z),
    }),
    {
      minX: first.x,
      maxX: first.x,
      minY: first.y,
      maxY: first.y,
      minZ: first.z,
      maxZ: first.z,
    },
  )
  const xySummary = createLandmark2DBoundsSummary(bounds)

  return {
    ...xySummary,
    zMin: bounds.minZ,
    zMax: bounds.maxZ,
    zRange: bounds.maxZ - bounds.minZ,
  }
}

function createLandmark2DBoundsSummary(
  bounds: PointBounds2D,
): Landmark2DBoundsSummary {
  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY

  return {
    xMin: bounds.minX,
    xMax: bounds.maxX,
    yMin: bounds.minY,
    yMax: bounds.maxY,
    width,
    height,
    aspectRatio: getAspectRatio(width, height) ?? null,
  }
}

function getPositiveNumber(value: number | null | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined
}

function createNoAlignment(reason: string): IdealLandmarks3DProjectionAlignment {
  return {
    mode: "none",
    scale: null,
    translateX: 0,
    translateY: 0,
    currentAspectRatio: null,
    projectedAspectRatio: null,
    aspectRatioDifference: null,
    reason,
  }
}

function projectIdealLandmark3D(
  landmark: IdealFaceLandmark3D,
  pose: FacePose,
  rotationCenter: RotatablePoint3D,
): ProjectedIdealLandmarkSameUnit {
  const centered = {
    x: landmark.x - rotationCenter.x,
    y: landmark.y - rotationCenter.y,
    z: landmark.z - rotationCenter.z,
  }
  const rotated = rotatePoint(centered, pose)

  return {
    index: landmark.index,
    x: rotated.x + rotationCenter.x,
    y: rotated.y + rotationCenter.y,
    z: rotated.z + rotationCenter.z,
    confidence: landmark.confidence,
  }
}

function getProjectionRotationCenter(
  options: ProjectIdealLandmarks3DOptions,
): RotatablePoint3D {
  return {
    ...IDEAL_LANDMARKS_3D_CENTER,
    z:
      typeof options.debugPivotZ === "number" &&
      Number.isFinite(options.debugPivotZ)
        ? options.debugPivotZ
        : IDEAL_LANDMARKS_3D_CENTER.z,
  }
}

function summarizeProjectedIdealLandmarks(
  landmarks: Array<{ x: number; y: number; z: number }>,
): IdealLandmarks3DProjectionSummary {
  return landmarks.reduce<IdealLandmarks3DProjectionSummary>(
    (summary, landmark) => ({
      xMin: Math.min(summary.xMin, landmark.x),
      xMax: Math.max(summary.xMax, landmark.x),
      yMin: Math.min(summary.yMin, landmark.y),
      yMax: Math.max(summary.yMax, landmark.y),
      zMin: Math.min(summary.zMin, landmark.z),
      zMax: Math.max(summary.zMax, landmark.z),
    }),
    {
      xMin: Number.POSITIVE_INFINITY,
      xMax: Number.NEGATIVE_INFINITY,
      yMin: Number.POSITIVE_INFINITY,
      yMax: Number.NEGATIVE_INFINITY,
      zMin: Number.POSITIVE_INFINITY,
      zMax: Number.NEGATIVE_INFINITY,
    },
  )
}

function rotatePoint<T extends RotatablePoint3D>(point: T, pose: FacePose): T {
  const pitch = pose.pitch * DEG_TO_RAD
  const yaw = pose.yaw * DEG_TO_RAD
  const roll = pose.roll * DEG_TO_RAD

  const yawed = rotateAroundY(point, yaw)
  const pitched = rotateAroundX(yawed, pitch)

  return rotateAroundZ(pitched, roll)
}

function rotateAroundX<T extends RotatablePoint3D>(point: T, angle: number): T {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  return {
    ...point,
    y: point.y * cos - point.z * sin,
    z: point.y * sin + point.z * cos,
  }
}

function rotateAroundY<T extends RotatablePoint3D>(point: T, angle: number): T {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  return {
    ...point,
    x: point.x * cos + point.z * sin,
    z: -point.x * sin + point.z * cos,
  }
}

function rotateAroundZ<T extends RotatablePoint3D>(point: T, angle: number): T {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  return {
    ...point,
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  }
}
