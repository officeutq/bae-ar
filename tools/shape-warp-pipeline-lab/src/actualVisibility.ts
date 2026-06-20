import { FaceLandmarker } from "@mediapipe/tasks-vision"
import type {
  ActualVisibilityDebug,
  ActualVisibilityExcludedReason,
  ActualVisibleLandmarkSelection,
  Landmark,
  NumericSummary,
  Point2,
  Rect,
} from "./types"
import {
  IRIS_LANDMARK_END,
  IRIS_LANDMARK_START,
  MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT,
} from "./types"

type LandmarkConnection = {
  start: number
  end: number
}

const ACTUAL_VISIBLE_MIN_FRONT_FACING_TRIANGLE_COUNT = 1
const ACTUAL_VISIBLE_MIN_FRONT_FACING_RATIO = 0.25
const ACTUAL_VISIBLE_DEGENERATE_NORMAL_LENGTH_EPSILON = 0.000001
const ACTUAL_VISIBLE_CENTER_LANDMARK_INDICES = new Set([
  1, 4, 5, 6, 8, 9, 10, 151, 168, 195, 197,
])
const ACTUAL_VISIBLE_EXCLUDED_REASON_SAMPLE_LIMIT = 12

export const MEDIAPIPE_FACE_MESH_TRIANGLE_INDICES = buildTriangleIndicesFromTessellation(
  FaceLandmarker.FACE_LANDMARKS_TESSELATION as readonly LandmarkConnection[],
)
export const MEDIAPIPE_FACE_MESH_TRIANGLE_COUNT =
  MEDIAPIPE_FACE_MESH_TRIANGLE_INDICES.length / 3
export const MEDIAPIPE_FACE_MESH_TRIANGLE_ADJACENCY = buildTriangleAdjacency(
  MEDIAPIPE_FACE_MESH_TRIANGLE_INDICES,
  MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT,
)
export const FACE_CONTOUR_INDICES = buildOrderedLandmarkPathFromConnections(
  FaceLandmarker.FACE_LANDMARKS_FACE_OVAL as readonly LandmarkConnection[],
)

export function buildActualVisibleLandmarkSelection(
  currentLandmarks: Landmark[] | null,
  displayedContentRect: Rect,
  currentYawDeg: number | null,
): ActualVisibleLandmarkSelection {
  const inputCount = currentLandmarks?.length ?? 0
  const selection = createEmptyActualVisibleLandmarkSelection(inputCount, currentYawDeg)
  const debug = selection.actualVisibilityDebug

  if (!currentLandmarks || currentLandmarks.length === 0) {
    return markActualVisibilitySelectionSkipped(selection, "missing_current_landmarks")
  }
  if (displayedContentRect.width <= 0 || displayedContentRect.height <= 0) {
    return markActualVisibilitySelectionSkipped(selection, "invalid_displayed_content_rect")
  }

  const workPoints = currentLandmarks.map((landmark, index) => {
    if (
      index >= MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT ||
      !isFiniteLandmark(landmark)
    ) {
      return null
    }
    return {
      x: landmark.x * displayedContentRect.width,
      y: landmark.y * displayedContentRect.height,
      z: landmark.z * displayedContentRect.width,
    }
  })
  const triangleRecords: Array<{
    indices: readonly [number, number, number]
    normalZ: number
    valid: boolean
    frontFacing: boolean
  }> = []
  const validNormalZValues: number[] = []
  let degenerateTriangleCount = 0

  for (let offset = 0; offset + 2 < MEDIAPIPE_FACE_MESH_TRIANGLE_INDICES.length; offset += 3) {
    const firstIndex = MEDIAPIPE_FACE_MESH_TRIANGLE_INDICES[offset]
    const secondIndex = MEDIAPIPE_FACE_MESH_TRIANGLE_INDICES[offset + 1]
    const thirdIndex = MEDIAPIPE_FACE_MESH_TRIANGLE_INDICES[offset + 2]
    const first = workPoints[firstIndex]
    const second = workPoints[secondIndex]
    const third = workPoints[thirdIndex]
    const indices = [firstIndex, secondIndex, thirdIndex] as const

    if (!first || !second || !third) {
      triangleRecords.push({ indices, normalZ: Number.NaN, valid: false, frontFacing: false })
      continue
    }

    const ab = {
      x: second.x - first.x,
      y: second.y - first.y,
      z: second.z - first.z,
    }
    const ac = {
      x: third.x - first.x,
      y: third.y - first.y,
      z: third.z - first.z,
    }
    const normal = {
      x: ab.y * ac.z - ab.z * ac.y,
      y: ab.z * ac.x - ab.x * ac.z,
      z: ab.x * ac.y - ab.y * ac.x,
    }
    const normalLength = Math.hypot(normal.x, normal.y, normal.z)
    if (
      !Number.isFinite(normalLength) ||
      normalLength <= ACTUAL_VISIBLE_DEGENERATE_NORMAL_LENGTH_EPSILON
    ) {
      degenerateTriangleCount += 1
      triangleRecords.push({ indices, normalZ: Number.NaN, valid: false, frontFacing: false })
      continue
    }

    validNormalZValues.push(normal.z)
    triangleRecords.push({ indices, normalZ: normal.z, valid: true, frontFacing: false })
  }

  const normalZSummary = summarizeNumbers(validNormalZValues)
  const centerNormalZValues = triangleRecords
    .filter((record) =>
      record.valid &&
      record.indices.some((index) => ACTUAL_VISIBLE_CENTER_LANDMARK_INDICES.has(index)),
    )
    .map((record) => record.normalZ)
  const centerSign = getActualVisibilityFrontFacingSign(centerNormalZValues)
  const allSign = centerSign ?? getActualVisibilityFrontFacingSign(validNormalZValues)
  const frontFacingSignSource =
    centerSign !== null
      ? "center_triangle_normal_z_median"
      : allSign !== null
        ? "all_triangle_normal_z_median"
        : "unavailable"

  debug.triangleNormalSummary = {
    totalTriangleCount: MEDIAPIPE_FACE_MESH_TRIANGLE_COUNT,
    validTriangleCount: validNormalZValues.length,
    frontFacingTriangleCount: 0,
    backFacingTriangleCount: 0,
    degenerateTriangleCount,
    frontFacingSign: allSign,
    frontFacingSignSource,
    normalZMin: normalZSummary.min,
    normalZMax: normalZSummary.max,
    normalZMean: normalZSummary.mean,
    normalZMedian: normalZSummary.p50,
  }

  if (allSign === null) {
    return markActualVisibilitySelectionSkipped(selection, "front_facing_sign_unavailable")
  }

  const validAdjacentTriangleCounts = Array.from({ length: currentLandmarks.length }, () => 0)
  const frontFacingAdjacentTriangleCounts = Array.from({ length: currentLandmarks.length }, () => 0)
  let frontFacingTriangleCount = 0
  let backFacingTriangleCount = 0

  for (const record of triangleRecords) {
    if (!record.valid) {
      continue
    }
    record.frontFacing = record.normalZ * allSign > 0
    if (record.frontFacing) {
      frontFacingTriangleCount += 1
    } else {
      backFacingTriangleCount += 1
    }
    for (const landmarkIndex of record.indices) {
      if (landmarkIndex < currentLandmarks.length) {
        validAdjacentTriangleCounts[landmarkIndex] += 1
        if (record.frontFacing) {
          frontFacingAdjacentTriangleCounts[landmarkIndex] += 1
        }
      }
    }
  }

  debug.triangleNormalSummary = {
    ...debug.triangleNormalSummary,
    frontFacingTriangleCount,
    backFacingTriangleCount,
  }

  const frontFacingRatios: number[] = []
  const frontFacingCountsForSummary: number[] = []
  for (let index = 0; index < currentLandmarks.length; index += 1) {
    const landmark = currentLandmarks[index]
    const topologyAdjacentTriangleCount =
      index < MEDIAPIPE_FACE_MESH_TRIANGLE_ADJACENCY.length
        ? MEDIAPIPE_FACE_MESH_TRIANGLE_ADJACENCY[index].length
        : 0
    const validAdjacentTriangleCount = validAdjacentTriangleCounts[index] ?? 0
    const frontFacingAdjacentTriangleCount = frontFacingAdjacentTriangleCounts[index] ?? 0
    const frontFacingRatio =
      validAdjacentTriangleCount > 0
        ? frontFacingAdjacentTriangleCount / validAdjacentTriangleCount
        : 0

    if (isIrisLandmarkIndex(index)) {
      addActualVisibilityExcludedLandmark(selection, index, "iris")
      continue
    }
    if (!isFiniteLandmark(landmark)) {
      addActualVisibilityExcludedLandmark(selection, index, "invalid")
      continue
    }
    if (topologyAdjacentTriangleCount === 0) {
      addActualVisibilityExcludedLandmark(selection, index, "noAdjacentTriangle")
      continue
    }
    if (validAdjacentTriangleCount === 0) {
      addActualVisibilityExcludedLandmark(selection, index, "degenerateTriangleOnly")
      continue
    }

    frontFacingRatios.push(frontFacingRatio)
    frontFacingCountsForSummary.push(frontFacingAdjacentTriangleCount)
    if (
      frontFacingAdjacentTriangleCount >= ACTUAL_VISIBLE_MIN_FRONT_FACING_TRIANGLE_COUNT &&
      frontFacingRatio >= ACTUAL_VISIBLE_MIN_FRONT_FACING_RATIO
    ) {
      selection.actualVisibleCurrentLandmarkIndices.push(index)
      selection.actualVisibleCurrentLandmarks.push(cloneLandmark(landmark))
    } else {
      addActualVisibilityExcludedLandmark(selection, index, "backFacingSurface")
    }
  }

  const ratioSummary = summarizeNumbers(frontFacingRatios)
  const countSummary = summarizeNumbers(frontFacingCountsForSummary)
  debug.landmarkVisibilitySummary = {
    minFrontFacingRatio: ratioSummary.min,
    maxFrontFacingRatio: ratioSummary.max,
    meanFrontFacingRatio: ratioSummary.mean,
    p50FrontFacingRatio: ratioSummary.p50,
    minFrontFacingTriangleCount: countSummary.min,
    maxFrontFacingTriangleCount: countSummary.max,
  }

  return finalizeActualVisibleLandmarkSelection(selection)
}

export function attachActualVisibleAlignedIdealLandmarks(
  selection: ActualVisibleLandmarkSelection,
  alignedRenderedIdeal478: Landmark[] | null,
): ActualVisibleLandmarkSelection {
  const actualVisibleAlignedIdealLandmarks = alignedRenderedIdeal478
    ? selectLandmarksByIndices(alignedRenderedIdeal478, selection.actualVisibleCurrentLandmarkIndices)
    : []
  return {
    ...selection,
    actualVisibleAlignedIdealLandmarks,
    actualVisibilityDebug: {
      ...selection.actualVisibilityDebug,
      alignedIdealOverlayPointCount: actualVisibleAlignedIdealLandmarks.length,
    },
  }
}

export function createDisplayedLandmarkPointsPx(
  landmarks: readonly Landmark[],
  rect: Rect,
): Array<Point2 | null> {
  return landmarks.map((landmark) =>
    isFiniteLandmark(landmark) ? normalizedLandmarkToRectPoint(landmark, rect) : null,
  )
}

export function normalizedLandmarkToRectPoint(landmark: Landmark, rect: Rect): Point2 {
  return {
    x: rect.x + landmark.x * rect.width,
    y: rect.y + landmark.y * rect.height,
  }
}

export function rectPointToNormalizedLandmark(
  point: Point2,
  index: number,
  z: number,
  rect: Rect,
): Landmark {
  return {
    index,
    x: (point.x - rect.x) / rect.width,
    y: (point.y - rect.y) / rect.height,
    z,
  }
}

export function isFiniteLandmark(landmark: Landmark | null | undefined): landmark is Landmark {
  return Boolean(landmark) &&
    Number.isFinite(landmark.x) &&
    Number.isFinite(landmark.y) &&
    Number.isFinite(landmark.z)
}

export function isFinitePoint2(point: Point2 | null | undefined): point is Point2 {
  return Boolean(point) && Number.isFinite(point.x) && Number.isFinite(point.y)
}

export function distance2d(a: Point2, b: Point2): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function percentileSorted(sortedValues: readonly number[], percentile: number): number | null {
  if (sortedValues.length === 0) {
    return null
  }
  const clamped = Math.min(Math.max(percentile, 0), 1)
  const index = (sortedValues.length - 1) * clamped
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) {
    return sortedValues[lower]
  }
  const weight = index - lower
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight
}

export function summarizeNumbers(values: readonly number[]): NumericSummary {
  const finiteValues = values.filter(Number.isFinite).sort((a, b) => a - b)
  if (finiteValues.length === 0) {
    return createEmptyNumericSummary()
  }
  const sum = finiteValues.reduce((total, value) => total + value, 0)
  return {
    min: finiteValues[0],
    max: finiteValues[finiteValues.length - 1],
    mean: sum / finiteValues.length,
    p50: percentileSorted(finiteValues, 0.5),
    p95: percentileSorted(finiteValues, 0.95),
  }
}

export function createEmptyNumericSummary(): NumericSummary {
  return {
    min: null,
    max: null,
    mean: null,
    p50: null,
    p95: null,
  }
}

export function cloneLandmark(landmark: Landmark): Landmark {
  return {
    index: landmark.index,
    x: landmark.x,
    y: landmark.y,
    z: landmark.z,
  }
}

function buildTriangleIndicesFromTessellation(
  connections: readonly LandmarkConnection[],
): number[] {
  const triangleIndices: number[] = []

  for (let index = 0; index + 2 < connections.length; index += 3) {
    const first = connections[index]
    const second = connections[index + 1]
    const third = connections[index + 2]

    if (
      first.end !== second.start ||
      second.end !== third.start ||
      third.end !== first.start
    ) {
      continue
    }

    if (
      first.start >= MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT ||
      first.end >= MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT ||
      second.end >= MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT
    ) {
      continue
    }

    triangleIndices.push(first.start, first.end, second.end)
  }

  return triangleIndices
}

function buildOrderedLandmarkPathFromConnections(
  connections: readonly LandmarkConnection[],
): number[] {
  if (connections.length === 0) {
    return []
  }

  const ordered = [connections[0].start, connections[0].end]
  const usedConnectionIndices = new Set([0])
  while (usedConnectionIndices.size < connections.length) {
    const tail = ordered[ordered.length - 1]
    const head = ordered[0]
    let nextConnectionIndex = -1
    let nextIndex: number | null = null
    for (let index = 0; index < connections.length; index += 1) {
      if (usedConnectionIndices.has(index)) {
        continue
      }
      const connection = connections[index]
      if (connection.start === tail) {
        nextConnectionIndex = index
        nextIndex = connection.end
        break
      }
      if (connection.end === tail) {
        nextConnectionIndex = index
        nextIndex = connection.start
        break
      }
    }
    if (nextConnectionIndex < 0 || nextIndex === null) {
      break
    }
    usedConnectionIndices.add(nextConnectionIndex)
    if (nextIndex === head) {
      continue
    }
    ordered.push(nextIndex)
  }

  return ordered.filter(
    (index) => index >= 0 && index < MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT,
  )
}

function buildTriangleAdjacency(
  triangleIndices: readonly number[],
  landmarkCount: number,
): number[][] {
  const adjacency = Array.from({ length: landmarkCount }, () => [] as number[])
  for (let offset = 0; offset + 2 < triangleIndices.length; offset += 3) {
    const triangleIndex = offset / 3
    for (const landmarkIndex of [
      triangleIndices[offset],
      triangleIndices[offset + 1],
      triangleIndices[offset + 2],
    ]) {
      if (landmarkIndex >= 0 && landmarkIndex < landmarkCount) {
        adjacency[landmarkIndex].push(triangleIndex)
      }
    }
  }
  return adjacency
}

function createEmptyActualVisibleLandmarkSelection(
  inputLandmarkCount = 0,
  currentYawDeg: number | null = null,
): ActualVisibleLandmarkSelection {
  return {
    actualVisibleCurrentLandmarkIndices: [],
    actualHiddenCurrentLandmarkIndices: [],
    actualVisibleCurrentLandmarks: [],
    actualVisibleAlignedIdealLandmarks: [],
    landmarkExcludedReasons: Array.from(
      { length: Math.max(0, inputLandmarkCount) },
      () => [] as ActualVisibilityExcludedReason[],
    ),
    actualVisibilityDebug: createEmptyActualVisibilityDebug(inputLandmarkCount, currentYawDeg),
  }
}

function createEmptyActualVisibilityDebug(
  inputLandmarkCount = 0,
  currentYawDeg: number | null = null,
): ActualVisibilityDebug {
  return {
    method: "actual_visible_triangle_normal_v1",
    inputLandmarkCount,
    usedLandmarkCount: 0,
    excludedLandmarkCount: inputLandmarkCount,
    currentOverlayPointCount: 0,
    alignedIdealOverlayPointCount: 0,
    excludedReasonCounts: createEmptyActualVisibilityExcludedReasonCounts(),
    excludedReasonSamples: createEmptyActualVisibilityExcludedReasonSamples(),
    triangleNormalSummary: {
      totalTriangleCount: MEDIAPIPE_FACE_MESH_TRIANGLE_COUNT,
      validTriangleCount: 0,
      frontFacingTriangleCount: 0,
      backFacingTriangleCount: 0,
      degenerateTriangleCount: 0,
      frontFacingSign: null,
      frontFacingSignSource: "not_computed",
      normalZMin: null,
      normalZMax: null,
      normalZMean: null,
      normalZMedian: null,
    },
    landmarkVisibilitySummary: {
      minFrontFacingRatio: null,
      maxFrontFacingRatio: null,
      meanFrontFacingRatio: null,
      p50FrontFacingRatio: null,
      minFrontFacingTriangleCount: null,
      maxFrontFacingTriangleCount: null,
    },
    thresholds: {
      minFrontFacingTriangleCount: ACTUAL_VISIBLE_MIN_FRONT_FACING_TRIANGLE_COUNT,
      minFrontFacingRatio: ACTUAL_VISIBLE_MIN_FRONT_FACING_RATIO,
    },
    currentYawDeg,
    skippedReason: null,
  }
}

function createEmptyActualVisibilityExcludedReasonCounts(): Record<ActualVisibilityExcludedReason, number> {
  return {
    invalid: 0,
    iris: 0,
    backFacingSurface: 0,
    noAdjacentTriangle: 0,
    degenerateTriangleOnly: 0,
    other: 0,
  }
}

function createEmptyActualVisibilityExcludedReasonSamples(): Record<ActualVisibilityExcludedReason, number[]> {
  return {
    invalid: [],
    iris: [],
    backFacingSurface: [],
    noAdjacentTriangle: [],
    degenerateTriangleOnly: [],
    other: [],
  }
}

function markActualVisibilitySelectionSkipped(
  selection: ActualVisibleLandmarkSelection,
  reason: string,
): ActualVisibleLandmarkSelection {
  selection.actualVisibilityDebug.skippedReason = reason
  for (let index = 0; index < selection.actualVisibilityDebug.inputLandmarkCount; index += 1) {
    if (isIrisLandmarkIndex(index)) {
      addActualVisibilityExcludedLandmark(selection, index, "iris")
    } else {
      addActualVisibilityExcludedLandmark(selection, index, "other")
    }
  }
  return finalizeActualVisibleLandmarkSelection(selection)
}

function addActualVisibilityExcludedLandmark(
  selection: ActualVisibleLandmarkSelection,
  index: number,
  reason: ActualVisibilityExcludedReason,
): void {
  selection.actualHiddenCurrentLandmarkIndices.push(index)
  selection.landmarkExcludedReasons[index] = [reason]
  selection.actualVisibilityDebug.excludedReasonCounts[reason] += 1
  const samples = selection.actualVisibilityDebug.excludedReasonSamples[reason]
  if (samples.length < ACTUAL_VISIBLE_EXCLUDED_REASON_SAMPLE_LIMIT) {
    samples.push(index)
  }
}

function finalizeActualVisibleLandmarkSelection(
  selection: ActualVisibleLandmarkSelection,
): ActualVisibleLandmarkSelection {
  const debug = selection.actualVisibilityDebug
  debug.usedLandmarkCount = selection.actualVisibleCurrentLandmarkIndices.length
  debug.excludedLandmarkCount = Math.max(0, debug.inputLandmarkCount - debug.usedLandmarkCount)
  debug.currentOverlayPointCount = debug.usedLandmarkCount
  return selection
}

function selectLandmarksByIndices(
  landmarks: readonly Landmark[],
  indices: readonly number[],
): Landmark[] {
  const selected: Landmark[] = []
  for (const index of indices) {
    const landmark = landmarks[index]
    if (landmark) {
      selected.push(cloneLandmark(landmark))
    }
  }
  return selected
}

function getActualVisibilityFrontFacingSign(values: readonly number[]): number | null {
  const summary = summarizeNumbers(values)
  const median = summary.p50
  if (median !== null && Math.abs(median) > ACTUAL_VISIBLE_DEGENERATE_NORMAL_LENGTH_EPSILON) {
    return median > 0 ? 1 : -1
  }
  const mean = summary.mean
  if (mean !== null && Math.abs(mean) > ACTUAL_VISIBLE_DEGENERATE_NORMAL_LENGTH_EPSILON) {
    return mean > 0 ? 1 : -1
  }
  return null
}

function isIrisLandmarkIndex(index: number): boolean {
  return index >= IRIS_LANDMARK_START && index <= IRIS_LANDMARK_END
}
