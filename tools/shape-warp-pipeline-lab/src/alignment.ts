import type {
  AlignmentDebug,
  AlignmentMethod,
  AlignmentResult,
  CurrentFaceStatus,
  Landmark,
  Point2,
  Rect,
  RenderedIdealStatus,
} from "./types"
import {
  attachActualVisibleAlignedIdealLandmarks,
  buildActualVisibleLandmarkSelection,
  cloneLandmark,
  createDisplayedLandmarkPointsPx,
  distance2d,
  isFiniteLandmark,
  isFinitePoint2,
  normalizedLandmarkToRectPoint,
  rectPointToNormalizedLandmark,
} from "./actualVisibility"

const ALIGNMENT_METHOD: AlignmentMethod = "semantic_5pt_center_scale_v1"
const REQUIRED_ALIGNMENT_LANDMARK_COUNT = 478
const MIN_SCALE_LINE_LENGTH_PX = 1
const MIN_SCALE_RATIO = 0.5
const MAX_SCALE_RATIO = 2.0
const LINE_INTERSECTION_EPSILON = 0.000001

const SEMANTIC_FIXED_POINT_INDICES = {
  topCenter: 10,
  chinCenter: 152,
  leftSideCenter: 234,
  rightSideCenter: 454,
  eyeMid: 6,
} as const

type SemanticPointKey = keyof typeof SEMANTIC_FIXED_POINT_INDICES
type SemanticPointSet = Record<SemanticPointKey, Point2>
type ScaleLine = {
  minXIndex: number
  maxXIndex: number
  currentLengthPx: number
  idealLengthPx: number
}

export function buildAlignment(input: {
  currentFaceStatus: CurrentFaceStatus
  renderedIdealStatus: RenderedIdealStatus
  frameId: number | null
  current478: Landmark[] | null
  renderedIdeal478: Landmark[] | null
  currentYawDeg: number | null
  displayedContentRect: Rect
}): AlignmentResult {
  const actualVisibilitySelection = buildActualVisibleLandmarkSelection(
    input.current478,
    input.displayedContentRect,
    input.currentYawDeg,
  )
  const emptyDebugBase = createAlignmentDebugBase({
    currentFaceStatus: input.currentFaceStatus,
    renderedIdealStatus: input.renderedIdealStatus,
    frameId: input.frameId,
    skippedReason: null,
    actualVisibleIndexCount:
      actualVisibilitySelection.actualVisibleCurrentLandmarkIndices.length,
    currentOverlayPointCount:
      actualVisibilitySelection.actualVisibilityDebug.currentOverlayPointCount,
  })

  const skipped = (reason: string): AlignmentResult => ({
    alignedRenderedIdeal478: null,
    actualVisibilitySelection,
    debug: {
      ...emptyDebugBase,
      alignmentStatus: "skipped",
      alignmentSkippedReason: reason,
      overlayLifecycle: {
        ...emptyDebugBase.overlayLifecycle,
        skippedReason: reason,
      },
    },
  })

  if (!input.current478) {
    return skipped("missing_current_landmarks")
  }
  if (input.current478.length < REQUIRED_ALIGNMENT_LANDMARK_COUNT) {
    return skipped("current_landmark_count_below_478")
  }
  if (!input.renderedIdeal478) {
    return skipped("missing_rendered_ideal_landmarks")
  }
  if (input.renderedIdeal478.length < REQUIRED_ALIGNMENT_LANDMARK_COUNT) {
    return skipped("rendered_ideal_landmark_count_below_478")
  }
  if (actualVisibilitySelection.actualVisibleCurrentLandmarkIndices.length < 2) {
    return skipped("insufficient_actual_visible_current_landmarks")
  }

  const idealPreviewRect = createIdealPreviewRect(input.displayedContentRect)
  const currentPointsPx = createDisplayedLandmarkPointsPx(input.current478, input.displayedContentRect)
  const idealPointsPx = createDisplayedLandmarkPointsPx(input.renderedIdeal478, idealPreviewRect)

  const currentSemanticPoints = getSemanticPointSet(currentPointsPx, "current")
  if (currentSemanticPoints.reason) {
    return skipped(currentSemanticPoints.reason)
  }
  const idealSemanticPoints = getSemanticPointSet(idealPointsPx, "ideal")
  if (idealSemanticPoints.reason) {
    return skipped(idealSemanticPoints.reason)
  }

  const currentCenter = calculateSemanticCenter(currentSemanticPoints.points)
  if (!currentCenter) {
    return skipped("current_semantic_center_unavailable")
  }
  const idealCenter = calculateSemanticCenter(idealSemanticPoints.points)
  if (!idealCenter) {
    return skipped("ideal_semantic_center_unavailable")
  }

  const scaleLine = calculateScaleLine({
    currentPointsPx,
    idealPointsPx,
    actualVisibleCurrentLandmarkIndices:
      actualVisibilitySelection.actualVisibleCurrentLandmarkIndices,
  })
  if (scaleLine.reason) {
    return skipped(scaleLine.reason)
  }

  const scaleRatio = scaleLine.value.currentLengthPx / scaleLine.value.idealLengthPx
  if (!Number.isFinite(scaleRatio)) {
    return skipped("invalid_scale_ratio")
  }
  if (scaleRatio < MIN_SCALE_RATIO || scaleRatio > MAX_SCALE_RATIO) {
    return skipped("scale_ratio_out_of_range")
  }

  const alignedRenderedIdeal478 = input.renderedIdeal478.map((landmark, index) => {
    if (!isFiniteLandmark(landmark)) {
      return cloneLandmark(landmark)
    }
    const idealPoint = normalizedLandmarkToRectPoint(landmark, idealPreviewRect)
    const alignedPoint = {
      x: currentCenter.x + (idealPoint.x - idealCenter.x) * scaleRatio,
      y: currentCenter.y + (idealPoint.y - idealCenter.y) * scaleRatio,
    }
    return rectPointToNormalizedLandmark(
      alignedPoint,
      index,
      landmark.z,
      input.displayedContentRect,
    )
  })
  const visibleSelectionWithIdeal = attachActualVisibleAlignedIdealLandmarks(
    actualVisibilitySelection,
    alignedRenderedIdeal478,
  )

  return {
    alignedRenderedIdeal478,
    actualVisibilitySelection: visibleSelectionWithIdeal,
    debug: {
      ...emptyDebugBase,
      alignmentStatus: "completed",
      alignmentSkippedReason: null,
      currentCenter,
      idealCenter,
      scaleRatio,
      scaleLineCurrentMinXIndex: scaleLine.value.minXIndex,
      scaleLineCurrentMaxXIndex: scaleLine.value.maxXIndex,
      scaleLineCurrentLengthPx: scaleLine.value.currentLengthPx,
      scaleLineIdealLengthPx: scaleLine.value.idealLengthPx,
      actualVisibleIndexCount:
        visibleSelectionWithIdeal.actualVisibleCurrentLandmarkIndices.length,
      currentOverlayPointCount:
        visibleSelectionWithIdeal.actualVisibilityDebug.currentOverlayPointCount,
      alignedIdealOverlayPointCount:
        visibleSelectionWithIdeal.actualVisibilityDebug.alignedIdealOverlayPointCount,
      overlayLifecycle: {
        alignedRenderedIdealVisible: true,
        frameId: input.frameId,
        skippedReason: null,
        staleFrameRejected: false,
      },
    },
  }
}

export function createEmptyAlignmentResult(input: {
  currentFaceStatus: CurrentFaceStatus
  renderedIdealStatus: RenderedIdealStatus
  frameId: number | null
  displayedContentRect: Rect
  current478: Landmark[] | null
  currentYawDeg: number | null
  reason: string
}): AlignmentResult {
  const actualVisibilitySelection = buildActualVisibleLandmarkSelection(
    input.current478,
    input.displayedContentRect,
    input.currentYawDeg,
  )
  return {
    alignedRenderedIdeal478: null,
    actualVisibilitySelection,
    debug: createAlignmentDebugBase({
      currentFaceStatus: input.currentFaceStatus,
      renderedIdealStatus: input.renderedIdealStatus,
      frameId: input.frameId,
      skippedReason: input.reason,
      actualVisibleIndexCount:
        actualVisibilitySelection.actualVisibleCurrentLandmarkIndices.length,
      currentOverlayPointCount:
        actualVisibilitySelection.actualVisibilityDebug.currentOverlayPointCount,
    }),
  }
}

function createAlignmentDebugBase(input: {
  currentFaceStatus: CurrentFaceStatus
  renderedIdealStatus: RenderedIdealStatus
  frameId: number | null
  skippedReason: string | null
  actualVisibleIndexCount: number
  currentOverlayPointCount: number
}): AlignmentDebug {
  return {
    currentFaceStatus: input.currentFaceStatus,
    renderedIdealStatus: input.renderedIdealStatus,
    alignmentStatus: "skipped",
    alignmentSkippedReason: input.skippedReason,
    alignmentMethod: ALIGNMENT_METHOD,
    currentCenter: null,
    idealCenter: null,
    scaleRatio: null,
    semanticFixedPointIndices: SEMANTIC_FIXED_POINT_INDICES,
    scaleLineCurrentMinXIndex: null,
    scaleLineCurrentMaxXIndex: null,
    scaleLineCurrentLengthPx: null,
    scaleLineIdealLengthPx: null,
    actualVisibleIndexCount: input.actualVisibleIndexCount,
    currentOverlayPointCount: input.currentOverlayPointCount,
    alignedIdealOverlayPointCount: 0,
    overlayLifecycle: {
      alignedRenderedIdealVisible: false,
      frameId: input.frameId,
      skippedReason: input.skippedReason,
      staleFrameRejected: false,
    },
  }
}

function getSemanticPointSet(
  pointsPx: readonly Array<Point2 | null>,
  side: "current" | "ideal",
): { points: SemanticPointSet; reason: null } | { points: SemanticPointSet; reason: string } {
  const points = {} as SemanticPointSet
  for (const [key, index] of Object.entries(SEMANTIC_FIXED_POINT_INDICES) as Array<
    [SemanticPointKey, number]
  >) {
    const point = pointsPx[index]
    if (!isFinitePoint2(point)) {
      return {
        points,
        reason: `${side}_semantic_fixed_point_${key}_${index}_missing_or_invalid`,
      }
    }
    points[key] = point
  }
  return { points, reason: null }
}

function calculateSemanticCenter(points: SemanticPointSet): Point2 | null {
  return calculateLineIntersection(
    points.topCenter,
    points.chinCenter,
    points.leftSideCenter,
    points.rightSideCenter,
  )
}

function calculateScaleLine(input: {
  currentPointsPx: readonly Array<Point2 | null>
  idealPointsPx: readonly Array<Point2 | null>
  actualVisibleCurrentLandmarkIndices: readonly number[]
}): { value: ScaleLine; reason: null } | { value: ScaleLine; reason: string } {
  let minXIndex: number | null = null
  let maxXIndex: number | null = null
  let minX = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY

  for (const index of input.actualVisibleCurrentLandmarkIndices) {
    const point = input.currentPointsPx[index]
    if (!isFinitePoint2(point)) {
      continue
    }
    if (point.x < minX) {
      minX = point.x
      minXIndex = index
    }
    if (point.x > maxX) {
      maxX = point.x
      maxXIndex = index
    }
  }

  if (minXIndex === null || maxXIndex === null) {
    return {
      value: createEmptyScaleLine(),
      reason: "insufficient_actual_visible_current_landmarks",
    }
  }
  if (minXIndex === maxXIndex) {
    return {
      value: createEmptyScaleLine(),
      reason: "scale_line_current_min_max_index_same",
    }
  }

  const currentMin = input.currentPointsPx[minXIndex]
  const currentMax = input.currentPointsPx[maxXIndex]
  const idealMin = input.idealPointsPx[minXIndex]
  const idealMax = input.idealPointsPx[maxXIndex]
  if (!isFinitePoint2(currentMin) || !isFinitePoint2(currentMax)) {
    return {
      value: createEmptyScaleLine(),
      reason: "current_scale_line_landmark_missing_or_invalid",
    }
  }
  if (!isFinitePoint2(idealMin) || !isFinitePoint2(idealMax)) {
    return {
      value: createEmptyScaleLine(),
      reason: "ideal_scale_line_landmark_missing_or_invalid",
    }
  }

  const currentLengthPx = distance2d(currentMin, currentMax)
  const idealLengthPx = distance2d(idealMin, idealMax)
  if (!Number.isFinite(currentLengthPx) || currentLengthPx <= MIN_SCALE_LINE_LENGTH_PX) {
    return {
      value: createEmptyScaleLine(),
      reason: "current_scale_line_too_short",
    }
  }
  if (!Number.isFinite(idealLengthPx) || idealLengthPx <= MIN_SCALE_LINE_LENGTH_PX) {
    return {
      value: createEmptyScaleLine(),
      reason: "ideal_scale_line_too_short",
    }
  }

  return {
    value: {
      minXIndex,
      maxXIndex,
      currentLengthPx,
      idealLengthPx,
    },
    reason: null,
  }
}

function createEmptyScaleLine(): ScaleLine {
  return {
    minXIndex: -1,
    maxXIndex: -1,
    currentLengthPx: 0,
    idealLengthPx: 0,
  }
}

function calculateLineIntersection(
  firstStart: Point2,
  firstEnd: Point2,
  secondStart: Point2,
  secondEnd: Point2,
): Point2 | null {
  const denominator =
    (firstStart.x - firstEnd.x) * (secondStart.y - secondEnd.y) -
    (firstStart.y - firstEnd.y) * (secondStart.x - secondEnd.x)
  if (!Number.isFinite(denominator) || Math.abs(denominator) <= LINE_INTERSECTION_EPSILON) {
    return null
  }

  const firstCross = firstStart.x * firstEnd.y - firstStart.y * firstEnd.x
  const secondCross = secondStart.x * secondEnd.y - secondStart.y * secondEnd.x
  const point = {
    x:
      (firstCross * (secondStart.x - secondEnd.x) -
        (firstStart.x - firstEnd.x) * secondCross) /
      denominator,
    y:
      (firstCross * (secondStart.y - secondEnd.y) -
        (firstStart.y - firstEnd.y) * secondCross) /
      denominator,
  }

  if (!isFinitePoint2(point)) {
    return null
  }
  if (
    !isPointOnSegment(point, firstStart, firstEnd) ||
    !isPointOnSegment(point, secondStart, secondEnd)
  ) {
    return null
  }
  return point
}

function isPointOnSegment(point: Point2, start: Point2, end: Point2): boolean {
  const minX = Math.min(start.x, end.x) - LINE_INTERSECTION_EPSILON
  const maxX = Math.max(start.x, end.x) + LINE_INTERSECTION_EPSILON
  const minY = Math.min(start.y, end.y) - LINE_INTERSECTION_EPSILON
  const maxY = Math.max(start.y, end.y) + LINE_INTERSECTION_EPSILON
  return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY
}

function createIdealPreviewRect(rect: Rect): Rect {
  const size = Math.min(rect.width, rect.height)
  return {
    x: rect.x + (rect.width - size) / 2,
    y: rect.y + (rect.height - size) / 2,
    width: size,
    height: size,
  }
}
