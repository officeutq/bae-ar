import type {
  BackgroundGridDebug,
  BackgroundGridPointPx,
  BackgroundGridState,
  BackgroundGridTrianglePx,
  Landmark,
  Point2,
  Rect,
} from "./types"
import { MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT, REQUIRED_LANDMARK_COUNT } from "./types"
import {
  FACE_CONTOUR_INDICES,
  MEDIAPIPE_FACE_MESH_TRIANGLE_INDICES,
  createDisplayedLandmarkPointsPx,
  distance2d,
  isFinitePoint2,
  percentileSorted,
} from "./actualVisibility"

const BACKGROUND_GRID_MIN_CONTOUR_DISTANCE_COUNT = 4
const BACKGROUND_GRID_MAX_ALLOWED_GRID_POINT_COUNT = 20000
const BACKGROUND_GRID_MIN_FACE_TRIANGLE_AREA_PX2 = 0.05
const BACKGROUND_GRID_POINT_IN_TRIANGLE_EPSILON = 0.000001
const BACKGROUND_GRID_POSITION_EPSILON = 0.000001

export function createEmptyBackgroundGridState(skipReason: string | null = null): BackgroundGridState {
  return {
    debug: createEmptyBackgroundGridDebug(skipReason),
    sourceBackgroundGridPointsPx: [],
    targetBackgroundGridPointsPx: [],
    faceInteriorTrianglesPx: [],
  }
}

export function buildBackgroundGrid(input: {
  currentLandmarks: Landmark[] | null
  displayedContentRect: Rect
  actualVisibleCurrentLandmarkIndices: readonly number[]
  actualHiddenCurrentLandmarkIndices: readonly number[]
}): BackgroundGridState {
  const { currentLandmarks, displayedContentRect } = input
  if (displayedContentRect.width <= 0 || displayedContentRect.height <= 0) {
    return createSkippedBackgroundGridState("missing_display_rect")
  }

  if (!currentLandmarks || currentLandmarks.length !== REQUIRED_LANDMARK_COUNT) {
    return createSkippedBackgroundGridState("missing_current_landmarks")
  }
  if (input.actualVisibleCurrentLandmarkIndices.length === 0) {
    return createSkippedBackgroundGridState("missing_actual_visible_landmarks")
  }
  if (MEDIAPIPE_FACE_MESH_TRIANGLE_INDICES.length === 0) {
    return createSkippedBackgroundGridState("missing_face_triangle_topology")
  }

  const actualVisibleSet = new Set(input.actualVisibleCurrentLandmarkIndices)
  const currentPointsPx = createDisplayedLandmarkPointsPx(currentLandmarks, displayedContentRect)
  const contourDistancesPx = calculateActualVisibleContourDistancesPx(currentPointsPx, actualVisibleSet)
  const contourMedianSpacingPx = percentileSorted([...contourDistancesPx].sort((a, b) => a - b), 0.5)
  if (
    contourDistancesPx.length < BACKGROUND_GRID_MIN_CONTOUR_DISTANCE_COUNT ||
    contourMedianSpacingPx === null
  ) {
    return createSkippedBackgroundGridState("invalid_contour_distances", {
      gridStepPx: contourMedianSpacingPx,
    })
  }

  const gridStepPx = contourMedianSpacingPx
  if (!Number.isFinite(gridStepPx) || gridStepPx <= 0) {
    return createSkippedBackgroundGridState("invalid_grid_step", { gridStepPx })
  }

  const estimatedGridPointCount = estimateBackgroundGridPointCount(displayedContentRect, gridStepPx)
  if (!Number.isFinite(estimatedGridPointCount) || estimatedGridPointCount <= 0) {
    return createSkippedBackgroundGridState("invalid_grid_step", { gridStepPx })
  }
  if (estimatedGridPointCount > BACKGROUND_GRID_MAX_ALLOWED_GRID_POINT_COUNT) {
    return createSkippedBackgroundGridState("too_many_grid_points", {
      gridStepPx,
      generatedGridPointCount: estimatedGridPointCount,
    })
  }

  const faceInteriorTrianglesPx = buildFaceInteriorTrianglesForBackgroundGrid(
    currentPointsPx,
    actualVisibleSet,
  )
  if (faceInteriorTrianglesPx.length === 0) {
    return createSkippedBackgroundGridState("empty_face_interior_triangles", {
      gridStepPx,
      faceInteriorTriangleCount: 0,
    })
  }

  const generatedBackgroundGrid = generateBackgroundGridPointsPx(displayedContentRect, gridStepPx)
  const generatedGridPointsPx = generatedBackgroundGrid.pointsPx
  const backgroundGridBoundaryPointCount = generatedGridPointsPx.filter(isBackgroundGridBoundaryPoint).length
  const backgroundGridInteriorPointCount = generatedGridPointsPx.length - backgroundGridBoundaryPointCount
  const keptBackgroundGridPointsPx: BackgroundGridPointPx[] = []

  for (const point of generatedGridPointsPx) {
    if (
      !isBackgroundGridBoundaryPoint(point) &&
      isPointInsideAnyBackgroundGridTriangle(point, faceInteriorTrianglesPx)
    ) {
      continue
    }
    keptBackgroundGridPointsPx.push(point)
  }

  const excludedInsideFaceTrianglePointCount =
    generatedGridPointsPx.length - keptBackgroundGridPointsPx.length
  const sourceBackgroundGridPointsPx = keptBackgroundGridPointsPx.map(cloneBackgroundGridPoint)
  const targetBackgroundGridPointsPx = keptBackgroundGridPointsPx.map(cloneBackgroundGridPoint)
  const debug: BackgroundGridDebug = {
    backgroundGridStatus: keptBackgroundGridPointsPx.length > 0 ? "ready" : "skipped",
    skipReason: keptBackgroundGridPointsPx.length > 0 ? null : "empty_background_grid",
    gridStepPx,
    generatedGridPointCount: generatedGridPointsPx.length,
    backgroundGridBoundaryPointCount,
    backgroundGridInteriorPointCount,
    excludedInsideFaceTrianglePointCount,
    keptBackgroundGridPointCount: keptBackgroundGridPointsPx.length,
    faceInteriorTriangleCount: faceInteriorTrianglesPx.length,
    xPositionCount: generatedBackgroundGrid.xPositions.length,
    yPositionCount: generatedBackgroundGrid.yPositions.length,
  }

  return {
    debug,
    sourceBackgroundGridPointsPx,
    targetBackgroundGridPointsPx,
    faceInteriorTrianglesPx,
  }
}

function createEmptyBackgroundGridDebug(skipReason: string | null = null): BackgroundGridDebug {
  return {
    backgroundGridStatus: "skipped",
    skipReason,
    gridStepPx: null,
    generatedGridPointCount: 0,
    backgroundGridBoundaryPointCount: 0,
    backgroundGridInteriorPointCount: 0,
    excludedInsideFaceTrianglePointCount: 0,
    keptBackgroundGridPointCount: 0,
    faceInteriorTriangleCount: 0,
    xPositionCount: 0,
    yPositionCount: 0,
  }
}

function createSkippedBackgroundGridState(
  skipReason: string,
  overrides: Partial<BackgroundGridDebug> = {},
): BackgroundGridState {
  return {
    ...createEmptyBackgroundGridState(skipReason),
    debug: {
      ...createEmptyBackgroundGridDebug(skipReason),
      ...overrides,
      backgroundGridStatus: "skipped",
      skipReason,
    },
  }
}

function calculateActualVisibleContourDistancesPx(
  currentPointsPx: Array<Point2 | null>,
  actualVisibleSet: ReadonlySet<number>,
): number[] {
  const distances: number[] = []
  for (let index = 0; index < FACE_CONTOUR_INDICES.length; index += 1) {
    const startIndex = FACE_CONTOUR_INDICES[index]
    const endIndex = FACE_CONTOUR_INDICES[(index + 1) % FACE_CONTOUR_INDICES.length]
    if (!actualVisibleSet.has(startIndex) || !actualVisibleSet.has(endIndex)) {
      continue
    }
    const start = currentPointsPx[startIndex]
    const end = currentPointsPx[endIndex]
    if (!isFinitePoint2(start) || !isFinitePoint2(end)) {
      continue
    }
    const distance = distance2d(start, end)
    if (Number.isFinite(distance) && distance > 0) {
      distances.push(distance)
    }
  }
  return distances
}

function estimateBackgroundGridPointCount(rect: Rect, gridStepPx: number): number {
  const columnCount = estimateBackgroundGridPositionCount(rect.width, gridStepPx)
  const rowCount = estimateBackgroundGridPositionCount(rect.height, gridStepPx)
  const count = columnCount * rowCount
  return Number.isFinite(count) && count > 0 ? count : Number.POSITIVE_INFINITY
}

function estimateBackgroundGridPositionCount(sizePx: number, gridStepPx: number): number {
  if (!Number.isFinite(gridStepPx) || gridStepPx <= 0 || !Number.isFinite(sizePx) || sizePx < 0) {
    return Number.POSITIVE_INFINITY
  }
  if (sizePx === 0) {
    return 1
  }
  const nearestStepCount = Math.round(sizePx / gridStepPx)
  if (Math.abs(nearestStepCount * gridStepPx - sizePx) <= BACKGROUND_GRID_POSITION_EPSILON) {
    return nearestStepCount + 1
  }
  return Math.floor(sizePx / gridStepPx) + 2
}

function generateBackgroundGridPointsPx(
  rect: Rect,
  gridStepPx: number,
): {
  pointsPx: BackgroundGridPointPx[]
  xPositions: number[]
  yPositions: number[]
} {
  const points: BackgroundGridPointPx[] = []
  const xPositions = buildBackgroundGridPositionList(rect.width, gridStepPx)
  const yPositions = buildBackgroundGridPositionList(rect.height, gridStepPx)
  const seenLocalPointKeys = new Set<string>()
  for (const localY of yPositions) {
    for (const localX of xPositions) {
      const dedupeKey = getBackgroundGridLocalPointDedupeKey(localX, localY)
      if (seenLocalPointKeys.has(dedupeKey)) {
        continue
      }
      seenLocalPointKeys.add(dedupeKey)
      points.push({
        x: rect.x + localX,
        y: rect.y + localY,
        kind: isBackgroundGridBoundaryLocalPoint(localX, localY, rect.width, rect.height)
          ? "backgroundGridBoundary"
          : "backgroundGridInterior",
      })
    }
  }
  return { pointsPx: points, xPositions, yPositions }
}

function buildBackgroundGridPositionList(sizePx: number, gridStepPx: number): number[] {
  if (!Number.isFinite(sizePx) || sizePx < 0 || !Number.isFinite(gridStepPx) || gridStepPx <= 0) {
    return []
  }
  const positions: number[] = [0]
  if (sizePx === 0) {
    return positions
  }
  for (let position = gridStepPx; position < sizePx; position += gridStepPx) {
    if (!Number.isFinite(position) || isBackgroundGridEdgeValue(position, sizePx)) {
      break
    }
    positions.push(position)
  }
  const lastIndex = positions.length - 1
  if (isBackgroundGridEdgeValue(positions[lastIndex], sizePx)) {
    positions[lastIndex] = sizePx
  } else {
    positions.push(sizePx)
  }
  return dedupeBackgroundGridPositions(positions)
}

function dedupeBackgroundGridPositions(positions: readonly number[]): number[] {
  const deduped: number[] = []
  const seen = new Set<string>()
  for (const position of positions) {
    const key = getBackgroundGridPositionDedupeKey(position)
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    deduped.push(position)
  }
  return deduped
}

function buildFaceInteriorTrianglesForBackgroundGrid(
  currentPointsPx: Array<Point2 | null>,
  actualVisibleSet: ReadonlySet<number>,
): BackgroundGridTrianglePx[] {
  const triangles: BackgroundGridTrianglePx[] = []
  for (let offset = 0; offset + 2 < MEDIAPIPE_FACE_MESH_TRIANGLE_INDICES.length; offset += 3) {
    const firstIndex = MEDIAPIPE_FACE_MESH_TRIANGLE_INDICES[offset]
    const secondIndex = MEDIAPIPE_FACE_MESH_TRIANGLE_INDICES[offset + 1]
    const thirdIndex = MEDIAPIPE_FACE_MESH_TRIANGLE_INDICES[offset + 2]
    if (
      firstIndex < 0 ||
      secondIndex < 0 ||
      thirdIndex < 0 ||
      firstIndex >= MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT ||
      secondIndex >= MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT ||
      thirdIndex >= MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT ||
      !actualVisibleSet.has(firstIndex) ||
      !actualVisibleSet.has(secondIndex) ||
      !actualVisibleSet.has(thirdIndex)
    ) {
      continue
    }
    const first = currentPointsPx[firstIndex]
    const second = currentPointsPx[secondIndex]
    const third = currentPointsPx[thirdIndex]
    if (!isFinitePoint2(first) || !isFinitePoint2(second) || !isFinitePoint2(third)) {
      continue
    }
    if (calculateTriangleAreaPx2(first, second, third) <= BACKGROUND_GRID_MIN_FACE_TRIANGLE_AREA_PX2) {
      continue
    }
    triangles.push({
      a: clonePoint(first),
      b: clonePoint(second),
      c: clonePoint(third),
      minX: Math.min(first.x, second.x, third.x),
      maxX: Math.max(first.x, second.x, third.x),
      minY: Math.min(first.y, second.y, third.y),
      maxY: Math.max(first.y, second.y, third.y),
    })
  }
  return triangles
}

function isPointInsideAnyBackgroundGridTriangle(
  point: BackgroundGridPointPx,
  triangles: readonly BackgroundGridTrianglePx[],
): boolean {
  return triangles.some((triangle) => isPointInsideBackgroundGridTriangle(point, triangle))
}

function isPointInsideBackgroundGridTriangle(
  point: BackgroundGridPointPx,
  triangle: BackgroundGridTrianglePx,
): boolean {
  if (
    point.x < triangle.minX - BACKGROUND_GRID_POINT_IN_TRIANGLE_EPSILON ||
    point.x > triangle.maxX + BACKGROUND_GRID_POINT_IN_TRIANGLE_EPSILON ||
    point.y < triangle.minY - BACKGROUND_GRID_POINT_IN_TRIANGLE_EPSILON ||
    point.y > triangle.maxY + BACKGROUND_GRID_POINT_IN_TRIANGLE_EPSILON
  ) {
    return false
  }
  const d1 = signedTriangleEdge(point, triangle.a, triangle.b)
  const d2 = signedTriangleEdge(point, triangle.b, triangle.c)
  const d3 = signedTriangleEdge(point, triangle.c, triangle.a)
  const hasNegative =
    d1 < -BACKGROUND_GRID_POINT_IN_TRIANGLE_EPSILON ||
    d2 < -BACKGROUND_GRID_POINT_IN_TRIANGLE_EPSILON ||
    d3 < -BACKGROUND_GRID_POINT_IN_TRIANGLE_EPSILON
  const hasPositive =
    d1 > BACKGROUND_GRID_POINT_IN_TRIANGLE_EPSILON ||
    d2 > BACKGROUND_GRID_POINT_IN_TRIANGLE_EPSILON ||
    d3 > BACKGROUND_GRID_POINT_IN_TRIANGLE_EPSILON
  return !(hasNegative && hasPositive)
}

function signedTriangleEdge(point: Point2, a: Point2, b: Point2): number {
  return (point.x - b.x) * (a.y - b.y) - (a.x - b.x) * (point.y - b.y)
}

function calculateTriangleAreaPx2(a: Point2, b: Point2, c: Point2): number {
  const area = Math.abs(
    (b.x - a.x) * (c.y - a.y) -
      (b.y - a.y) * (c.x - a.x),
  ) / 2
  return Number.isFinite(area) ? area : 0
}

function getBackgroundGridPositionDedupeKey(position: number): string {
  return String(Math.round(position / BACKGROUND_GRID_POSITION_EPSILON))
}

function getBackgroundGridLocalPointDedupeKey(localX: number, localY: number): string {
  return `${getBackgroundGridPositionDedupeKey(localX)}:${getBackgroundGridPositionDedupeKey(localY)}`
}

function isBackgroundGridEdgeValue(value: number, edgeValue: number): boolean {
  return Math.abs(value - edgeValue) <= BACKGROUND_GRID_POSITION_EPSILON
}

function isBackgroundGridBoundaryLocalPoint(
  localX: number,
  localY: number,
  width: number,
  height: number,
): boolean {
  return (
    isBackgroundGridEdgeValue(localX, 0) ||
    isBackgroundGridEdgeValue(localX, width) ||
    isBackgroundGridEdgeValue(localY, 0) ||
    isBackgroundGridEdgeValue(localY, height)
  )
}

function isBackgroundGridBoundaryPoint(point: BackgroundGridPointPx): boolean {
  return point.kind === "backgroundGridBoundary"
}

function cloneBackgroundGridPoint(point: BackgroundGridPointPx): BackgroundGridPointPx {
  return {
    x: point.x,
    y: point.y,
    kind: point.kind,
  }
}

function clonePoint(point: Point2): Point2 {
  return {
    x: point.x,
    y: point.y,
  }
}
