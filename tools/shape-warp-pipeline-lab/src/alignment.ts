import type {
  ActualVisibleLandmarkSelection,
  AlignmentDebug,
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
  const emptyDebugBase = {
    currentFaceStatus: input.currentFaceStatus,
    renderedIdealStatus: input.renderedIdealStatus,
    alignmentMethod: "visible_bounds_center_scale_v1",
    actualVisibleIndexCount:
      actualVisibilitySelection.actualVisibleCurrentLandmarkIndices.length,
    currentOverlayPointCount:
      actualVisibilitySelection.actualVisibilityDebug.currentOverlayPointCount,
    alignedIdealOverlayPointCount: 0,
    overlayLifecycle: {
      alignedRenderedIdealVisible: false,
      frameId: input.frameId,
      skippedReason: null,
      staleFrameRejected: false,
    },
  }

  const skipped = (reason: string): AlignmentResult => ({
    alignedRenderedIdeal478: null,
    actualVisibilitySelection,
    debug: {
      ...emptyDebugBase,
      alignmentStatus: "skipped",
      alignmentSkippedReason: reason,
      currentCenter: null,
      idealCenter: null,
      scaleRatio: null,
      overlayLifecycle: {
        ...emptyDebugBase.overlayLifecycle,
        skippedReason: reason,
      },
    },
  })

  if (!input.current478) {
    return skipped("missing_current_landmarks")
  }
  if (actualVisibilitySelection.actualVisibleCurrentLandmarkIndices.length === 0) {
    return skipped("missing_actual_visible_landmarks")
  }
  if (!input.renderedIdeal478) {
    return skipped("missing_rendered_ideal_landmarks")
  }

  const idealOverlayRect = createEqualAxisRectInsideRect(input.displayedContentRect)
  const currentPointsPx = createDisplayedLandmarkPointsPx(input.current478, input.displayedContentRect)
  const idealPointsPx = createDisplayedLandmarkPointsPx(input.renderedIdeal478, idealOverlayRect)
  const pairIndices = actualVisibilitySelection.actualVisibleCurrentLandmarkIndices.filter((index) =>
    isFinitePoint2(currentPointsPx[index]) && isFinitePoint2(idealPointsPx[index]),
  )
  if (pairIndices.length < 3) {
    return skipped("too_few_visible_pairs")
  }

  const currentBounds = calculatePointBounds(pairIndices.map((index) => currentPointsPx[index]).filter(isFinitePoint2))
  const idealBounds = calculatePointBounds(pairIndices.map((index) => idealPointsPx[index]).filter(isFinitePoint2))
  if (!currentBounds || !idealBounds) {
    return skipped("invalid_visible_bounds")
  }

  const currentCenter = getRectCenter(currentBounds)
  const idealCenter = getRectCenter(idealBounds)
  const currentScaleLength = Math.max(currentBounds.width, currentBounds.height)
  const idealScaleLength = Math.max(idealBounds.width, idealBounds.height)
  if (currentScaleLength <= 0 || idealScaleLength <= 0) {
    return skipped("invalid_scale_length")
  }

  const scaleRatio = currentScaleLength / idealScaleLength
  if (!Number.isFinite(scaleRatio) || scaleRatio <= 0) {
    return skipped("invalid_scale_ratio")
  }

  const translatePxX = currentCenter.x - idealCenter.x * scaleRatio
  const translatePxY = currentCenter.y - idealCenter.y * scaleRatio
  const alignedRenderedIdeal478 = input.renderedIdeal478.map((landmark, index) => {
    if (!isFiniteLandmark(landmark)) {
      return cloneLandmark(landmark)
    }
    const idealPoint = normalizedLandmarkToRectPoint(landmark, idealOverlayRect)
    const alignedPoint = {
      x: idealPoint.x * scaleRatio + translatePxX,
      y: idealPoint.y * scaleRatio + translatePxY,
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
    debug: {
      currentFaceStatus: input.currentFaceStatus,
      renderedIdealStatus: input.renderedIdealStatus,
      alignmentStatus: "skipped",
      alignmentSkippedReason: input.reason,
      alignmentMethod: "visible_bounds_center_scale_v1",
      currentCenter: null,
      idealCenter: null,
      scaleRatio: null,
      actualVisibleIndexCount:
        actualVisibilitySelection.actualVisibleCurrentLandmarkIndices.length,
      currentOverlayPointCount:
        actualVisibilitySelection.actualVisibilityDebug.currentOverlayPointCount,
      alignedIdealOverlayPointCount: 0,
      overlayLifecycle: {
        alignedRenderedIdealVisible: false,
        frameId: input.frameId,
        skippedReason: input.reason,
        staleFrameRejected: false,
      },
    },
  }
}

export function createEqualAxisRectInsideRect(rect: Rect): Rect {
  const size = Math.min(rect.width, rect.height)
  return {
    x: rect.x + (rect.width - size) / 2,
    y: rect.y + (rect.height - size) / 2,
    width: size,
    height: size,
  }
}

function calculatePointBounds(points: readonly Point2[]): Rect | null {
  const finitePoints = points.filter(isFinitePoint2)
  if (finitePoints.length === 0) {
    return null
  }
  const xValues = finitePoints.map((point) => point.x)
  const yValues = finitePoints.map((point) => point.y)
  const minX = Math.min(...xValues)
  const maxX = Math.max(...xValues)
  const minY = Math.min(...yValues)
  const maxY = Math.max(...yValues)
  return {
    x: minX,
    y: minY,
    width: Math.max(distance2d({ x: minX, y: 0 }, { x: maxX, y: 0 }), 0),
    height: Math.max(distance2d({ x: 0, y: minY }, { x: 0, y: maxY }), 0),
  }
}

function getRectCenter(rect: Rect): Point2 {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  }
}
