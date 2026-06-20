import type {
  BackgroundGridPointKind,
  BackgroundGridPointPx,
  CombinedMeshDebug,
  CombinedMeshPointPx,
  CombinedMeshState,
  CombinedMeshVertexKind,
  CombinedVertexMetadata,
  Landmark,
  Point2,
  Rect,
} from "./types"
import { REQUIRED_LANDMARK_COUNT } from "./types"
import {
  createEmptyNumericSummary,
  distance2d,
  isFiniteLandmark,
  isFinitePoint2,
  normalizedLandmarkToRectPoint,
  summarizeNumbers,
} from "./actualVisibility"

const COMBINED_MESH_DEBUG_SAMPLE_LIMIT = 12
const COMBINED_MESH_DUPLICATE_EPSILON_PX = 0.25
const COMBINED_MESH_MIN_TRIANGLE_AREA_PX2 = 0.05
const COMBINED_MESH_LONG_EDGE_SOURCE_BOUNDS_RATIO = 0.35

export function createEmptyCombinedMeshState(skipReason: string | null = null): CombinedMeshState {
  return {
    combinedSourceVerticesPx: [],
    combinedTargetVerticesPx: [],
    combinedVertexMetadata: [],
    triangulationVertexIndices: [],
    triangleIndices: [],
    combinedMeshDebug: createEmptyCombinedMeshDebug(skipReason),
  }
}

export function buildCombinedMesh(input: {
  currentLandmarks: Landmark[] | null
  alignedRenderedIdeal478: Landmark[] | null
  displayedContentRect: Rect
  actualVisibleCurrentLandmarkIndices: readonly number[]
  sourceBackgroundGridPointsPx: readonly BackgroundGridPointPx[]
  targetBackgroundGridPointsPx: readonly BackgroundGridPointPx[]
}): CombinedMeshState {
  if (input.displayedContentRect.width <= 0 || input.displayedContentRect.height <= 0) {
    return createEmptyCombinedMeshState("missing_displayed_content_rect")
  }
  if (!input.currentLandmarks || input.currentLandmarks.length !== REQUIRED_LANDMARK_COUNT) {
    return createEmptyCombinedMeshState("missing_current_landmarks")
  }
  if (input.actualVisibleCurrentLandmarkIndices.length === 0) {
    return createEmptyCombinedMeshState("missing_actual_visible_landmarks")
  }
  if (!input.alignedRenderedIdeal478 || input.alignedRenderedIdeal478.length !== REQUIRED_LANDMARK_COUNT) {
    return createEmptyCombinedMeshState("missing_aligned_rendered_ideal")
  }
  if (
    input.sourceBackgroundGridPointsPx.length === 0 ||
    input.targetBackgroundGridPointsPx.length === 0
  ) {
    return createEmptyCombinedMeshState("missing_background_grid_points")
  }
  if (input.sourceBackgroundGridPointsPx.length !== input.targetBackgroundGridPointsPx.length) {
    return createEmptyCombinedMeshState("source_target_background_grid_mismatch")
  }

  const combinedSourceVerticesPx: CombinedMeshPointPx[] = []
  const combinedTargetVerticesPx: CombinedMeshPointPx[] = []
  const combinedVertexMetadata: CombinedVertexMetadata[] = []
  let invalidVertexCount = 0

  const pushVertex = (
    kind: CombinedMeshVertexKind,
    source: CombinedMeshPointPx | null,
    target: CombinedMeshPointPx | null,
    landmarkIndex: number | null,
    backgroundGridIndex: number | null,
  ) => {
    if (!isFinitePoint2(source) || !isFinitePoint2(target)) {
      invalidVertexCount += 1
      return
    }
    const index = combinedSourceVerticesPx.length
    combinedSourceVerticesPx.push(clonePoint(source))
    combinedTargetVerticesPx.push(clonePoint(target))
    combinedVertexMetadata.push({
      kind,
      sourceIndex: index,
      targetIndex: index,
      landmarkIndex,
      backgroundGridIndex,
    })
  }

  for (const landmarkIndex of input.actualVisibleCurrentLandmarkIndices) {
    if (
      landmarkIndex < 0 ||
      landmarkIndex >= REQUIRED_LANDMARK_COUNT ||
      !Number.isInteger(landmarkIndex)
    ) {
      invalidVertexCount += 1
      continue
    }
    const sourceLandmark = input.currentLandmarks[landmarkIndex]
    const targetLandmark = input.alignedRenderedIdeal478[landmarkIndex]
    const source = isFiniteLandmark(sourceLandmark)
      ? normalizedLandmarkToRectPoint(sourceLandmark, input.displayedContentRect)
      : null
    const target = isFiniteLandmark(targetLandmark)
      ? normalizedLandmarkToRectPoint(targetLandmark, input.displayedContentRect)
      : null
    pushVertex("faceLandmark", source, target, landmarkIndex, null)
  }

  const pushBackgroundGridVertices = (kind: BackgroundGridPointKind) => {
    for (let backgroundGridIndex = 0; backgroundGridIndex < input.sourceBackgroundGridPointsPx.length; backgroundGridIndex += 1) {
      const source = input.sourceBackgroundGridPointsPx[backgroundGridIndex]
      const target = input.targetBackgroundGridPointsPx[backgroundGridIndex]
      if (source.kind !== kind) {
        continue
      }
      if (target.kind !== kind) {
        invalidVertexCount += 1
        continue
      }
      pushVertex(kind, source, target, null, backgroundGridIndex)
    }
  }

  pushBackgroundGridVertices("backgroundGridInterior")
  pushBackgroundGridVertices("backgroundGridBoundary")

  const baseDebug = buildCombinedMeshBaseDebug({
    combinedSourceVerticesPx,
    combinedTargetVerticesPx,
    combinedVertexMetadata,
    invalidVertexCount,
  })
  if (
    combinedSourceVerticesPx.length === 0 ||
    combinedTargetVerticesPx.length === 0 ||
    !baseDebug.sourceTargetCountMatches ||
    !baseDebug.indexCorrespondenceValid
  ) {
    return {
      combinedSourceVerticesPx,
      combinedTargetVerticesPx,
      combinedVertexMetadata,
      triangulationVertexIndices: [],
      triangleIndices: [],
      combinedMeshDebug: {
        ...createEmptyCombinedMeshDebug("invalid_combined_vertices"),
        ...baseDebug,
      },
    }
  }

  const triangulationInput = buildTriangulationVertexIndices(
    combinedSourceVerticesPx,
    combinedTargetVerticesPx,
  )
  if (triangulationInput.triangulationVertexIndices.length < 3) {
    return {
      combinedSourceVerticesPx,
      combinedTargetVerticesPx,
      combinedVertexMetadata,
      triangulationVertexIndices: triangulationInput.triangulationVertexIndices,
      triangleIndices: [],
      combinedMeshDebug: {
        ...createEmptyCombinedMeshDebug("too_few_triangulation_vertices"),
        ...baseDebug,
        triangulationInputVertexCount: triangulationInput.triangulationVertexIndices.length,
        duplicateSkippedVertexCount: triangulationInput.duplicateSkippedVertexCount,
        invalidVertexCount: invalidVertexCount + triangulationInput.invalidVertexCount,
      },
    }
  }

  let rawTriangleIndices: Array<[number, number, number]>
  try {
    rawTriangleIndices = buildCombinedMeshDelaunayTriangleIndices(
      combinedSourceVerticesPx,
      triangulationInput.triangulationVertexIndices,
    )
  } catch {
    return {
      combinedSourceVerticesPx,
      combinedTargetVerticesPx,
      combinedVertexMetadata,
      triangulationVertexIndices: triangulationInput.triangulationVertexIndices,
      triangleIndices: [],
      combinedMeshDebug: {
        ...createEmptyCombinedMeshDebug("triangulation_failed"),
        ...baseDebug,
        triangulationInputVertexCount: triangulationInput.triangulationVertexIndices.length,
        duplicateSkippedVertexCount: triangulationInput.duplicateSkippedVertexCount,
        invalidVertexCount: invalidVertexCount + triangulationInput.invalidVertexCount,
      },
    }
  }

  const filtered = filterCombinedMeshTriangles(
    rawTriangleIndices,
    combinedSourceVerticesPx,
    combinedTargetVerticesPx,
  )
  if (filtered.triangleIndices.length === 0) {
    return {
      combinedSourceVerticesPx,
      combinedTargetVerticesPx,
      combinedVertexMetadata,
      triangulationVertexIndices: triangulationInput.triangulationVertexIndices,
      triangleIndices: [],
      combinedMeshDebug: {
        ...createEmptyCombinedMeshDebug("empty_triangle_indices"),
        ...baseDebug,
        triangulationInputVertexCount: triangulationInput.triangulationVertexIndices.length,
        duplicateSkippedVertexCount: triangulationInput.duplicateSkippedVertexCount,
        invalidVertexCount: invalidVertexCount + triangulationInput.invalidVertexCount,
        sourceDegenerateTriangleCount: filtered.sourceDegenerateTriangleCount,
      },
    }
  }

  return {
    combinedSourceVerticesPx,
    combinedTargetVerticesPx,
    combinedVertexMetadata,
    triangulationVertexIndices: triangulationInput.triangulationVertexIndices,
    triangleIndices: filtered.triangleIndices,
    combinedMeshDebug: {
      ...createEmptyCombinedMeshDebug(),
      ...baseDebug,
      combinedMeshStatus: "available",
      skipReason: null,
      triangulationInputVertexCount: triangulationInput.triangulationVertexIndices.length,
      duplicateSkippedVertexCount: triangulationInput.duplicateSkippedVertexCount,
      invalidVertexCount: invalidVertexCount + triangulationInput.invalidVertexCount,
      triangleCount: filtered.triangleIndices.length / 3,
      sourceDegenerateTriangleCount: filtered.sourceDegenerateTriangleCount,
      potentialTargetInversionTriangleCount: filtered.potentialTargetInversionTriangleCount,
      sourceTriangleAreaSummaryPx2: summarizeNumbers(filtered.sourceTriangleAreasPx2),
      targetTriangleAreaSummaryPx2: summarizeNumbers(filtered.targetTriangleAreasPx2),
      edgeLengthSummaryPx: summarizeNumbers(filtered.edgeLengthsPx),
      longTriangleCount: filtered.longTriangleCount,
      sampleTriangleIndices: filtered.sampleTriangleIndices,
    },
  }
}

function createEmptyCombinedMeshDebug(skipReason: string | null = null): CombinedMeshDebug {
  return {
    combinedMeshStatus: "skipped",
    skipReason,
    combinedSourceVertexCount: 0,
    combinedTargetVertexCount: 0,
    sourceTargetCountMatches: true,
    indexCorrespondenceValid: true,
    faceLandmarkVertexCount: 0,
    backgroundGridInteriorVertexCount: 0,
    backgroundGridBoundaryVertexCount: 0,
    triangulationInputVertexCount: 0,
    duplicateSkippedVertexCount: 0,
    invalidVertexCount: 0,
    triangleCount: 0,
    potentialTargetInversionTriangleCount: 0,
    sourceDegenerateTriangleCount: 0,
    longTriangleCount: 0,
    sourceTriangleAreaSummaryPx2: createEmptyNumericSummary(),
    targetTriangleAreaSummaryPx2: createEmptyNumericSummary(),
    edgeLengthSummaryPx: createEmptyNumericSummary(),
    sampleCombinedVertices: [],
    sampleTriangleIndices: [],
  }
}

function buildCombinedMeshBaseDebug(input: {
  combinedSourceVerticesPx: readonly CombinedMeshPointPx[]
  combinedTargetVerticesPx: readonly CombinedMeshPointPx[]
  combinedVertexMetadata: readonly CombinedVertexMetadata[]
  invalidVertexCount: number
}): Partial<CombinedMeshDebug> {
  const sourceTargetCountMatches =
    input.combinedSourceVerticesPx.length === input.combinedTargetVerticesPx.length
  const indexCorrespondenceValid =
    sourceTargetCountMatches &&
    input.combinedVertexMetadata.length === input.combinedSourceVerticesPx.length &&
    input.combinedVertexMetadata.every((metadata, index) =>
      metadata.sourceIndex === index && metadata.targetIndex === index,
    )
  return {
    combinedSourceVertexCount: input.combinedSourceVerticesPx.length,
    combinedTargetVertexCount: input.combinedTargetVerticesPx.length,
    sourceTargetCountMatches,
    indexCorrespondenceValid,
    faceLandmarkVertexCount: input.combinedVertexMetadata.filter((metadata) => metadata.kind === "faceLandmark").length,
    backgroundGridInteriorVertexCount: input.combinedVertexMetadata.filter((metadata) => metadata.kind === "backgroundGridInterior").length,
    backgroundGridBoundaryVertexCount: input.combinedVertexMetadata.filter((metadata) => metadata.kind === "backgroundGridBoundary").length,
    invalidVertexCount: input.invalidVertexCount,
    sampleCombinedVertices: createCombinedMeshSampleVertices(
      input.combinedSourceVerticesPx,
      input.combinedTargetVerticesPx,
      input.combinedVertexMetadata,
    ),
  }
}

function buildTriangulationVertexIndices(
  sourceVertices: readonly CombinedMeshPointPx[],
  targetVertices: readonly CombinedMeshPointPx[],
): {
  triangulationVertexIndices: number[]
  duplicateSkippedVertexCount: number
  invalidVertexCount: number
} {
  const triangulationVertexIndices: number[] = []
  const occupiedBuckets = new Map<string, number[]>()
  let duplicateSkippedVertexCount = 0
  let invalidVertexCount = 0

  for (let vertexIndex = 0; vertexIndex < sourceVertices.length; vertexIndex += 1) {
    const source = sourceVertices[vertexIndex]
    const target = targetVertices[vertexIndex]
    if (!isFinitePoint2(source) || !isFinitePoint2(target)) {
      invalidVertexCount += 1
      continue
    }
    if (hasNearbyTriangulationPoint(source, sourceVertices, occupiedBuckets)) {
      duplicateSkippedVertexCount += 1
      continue
    }
    const bucketKey = getTriangulationPointBucketKey(source)
    const bucket = occupiedBuckets.get(bucketKey) ?? []
    bucket.push(vertexIndex)
    occupiedBuckets.set(bucketKey, bucket)
    triangulationVertexIndices.push(vertexIndex)
  }

  return {
    triangulationVertexIndices,
    duplicateSkippedVertexCount,
    invalidVertexCount,
  }
}

function hasNearbyTriangulationPoint(
  point: CombinedMeshPointPx,
  sourceVertices: readonly CombinedMeshPointPx[],
  occupiedBuckets: ReadonlyMap<string, readonly number[]>,
): boolean {
  const bucketX = getTriangulationPointBucketPosition(point.x)
  const bucketY = getTriangulationPointBucketPosition(point.y)
  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      const bucket = occupiedBuckets.get(`${bucketX + offsetX}:${bucketY + offsetY}`)
      if (!bucket) {
        continue
      }
      for (const existingIndex of bucket) {
        const existing = sourceVertices[existingIndex]
        if (
          isFinitePoint2(existing) &&
          distance2d(point, existing) <= COMBINED_MESH_DUPLICATE_EPSILON_PX
        ) {
          return true
        }
      }
    }
  }
  return false
}

function buildCombinedMeshDelaunayTriangleIndices(
  sourceVertices: readonly CombinedMeshPointPx[],
  triangulationVertexIndices: readonly number[],
): Array<[number, number, number]> {
  const points = triangulationVertexIndices
    .map((combinedVertexIndex) => {
      const point = sourceVertices[combinedVertexIndex]
      return { x: point.x, y: point.y, combinedVertexIndex }
    })
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))

  if (points.length < 3) {
    return []
  }

  const bounds = calculatePointBounds(points)
  if (!bounds) {
    return []
  }
  const center = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  }
  const span = Math.max(bounds.width, bounds.height, 0.001) * 24
  const superPointStart = points.length
  const workingPoints = [
    ...points,
    { x: center.x - span, y: center.y - span, combinedVertexIndex: -1 },
    { x: center.x, y: center.y + span, combinedVertexIndex: -1 },
    { x: center.x + span, y: center.y - span, combinedVertexIndex: -1 },
  ]
  let triangles: Array<[number, number, number]> = [
    [superPointStart, superPointStart + 1, superPointStart + 2],
  ]

  for (let pointIndex = 0; pointIndex < points.length; pointIndex += 1) {
    const point = workingPoints[pointIndex]
    const badTriangles = triangles.filter((triangle) =>
      isPointInCircumcircle(point, triangle, workingPoints),
    )
    const boundaryEdges = getBoundaryEdges(badTriangles)
    triangles = triangles.filter((triangle) => !badTriangles.includes(triangle))
    triangles.push(
      ...boundaryEdges.map((edge) => [edge[0], edge[1], pointIndex] as [number, number, number]),
    )
  }

  return triangles
    .filter((triangle) => triangle.every((index) => index < superPointStart))
    .map((triangle) => {
      const indices = triangle.map((index) => workingPoints[index].combinedVertexIndex)
      return normalizeTriangleWinding(indices as [number, number, number], sourceVertices)
    })
    .filter((triangle) => new Set(triangle).size === 3)
}

function filterCombinedMeshTriangles(
  rawTriangleIndices: readonly Array<[number, number, number]>,
  sourceVertices: readonly CombinedMeshPointPx[],
  targetVertices: readonly CombinedMeshPointPx[],
): {
  triangleIndices: number[]
  sourceDegenerateTriangleCount: number
  potentialTargetInversionTriangleCount: number
  sourceTriangleAreasPx2: number[]
  targetTriangleAreasPx2: number[]
  edgeLengthsPx: number[]
  longTriangleCount: number
  sampleTriangleIndices: Array<[number, number, number]>
} {
  const triangleIndices: number[] = []
  const sourceTriangleAreasPx2: number[] = []
  const targetTriangleAreasPx2: number[] = []
  const edgeLengthsPx: number[] = []
  const sampleTriangleIndices: Array<[number, number, number]> = []
  const sourceBounds = calculatePointBounds(sourceVertices)
  const longEdgeThresholdPx = sourceBounds
    ? Math.hypot(sourceBounds.width, sourceBounds.height) * COMBINED_MESH_LONG_EDGE_SOURCE_BOUNDS_RATIO
    : Number.POSITIVE_INFINITY
  let sourceDegenerateTriangleCount = 0
  let potentialTargetInversionTriangleCount = 0
  let longTriangleCount = 0

  for (const indices of rawTriangleIndices) {
    if (
      indices.some((index) => !Number.isInteger(index) || index < 0 || index >= sourceVertices.length) ||
      new Set(indices).size !== 3
    ) {
      continue
    }
    const sourceA = sourceVertices[indices[0]]
    const sourceB = sourceVertices[indices[1]]
    const sourceC = sourceVertices[indices[2]]
    const targetA = targetVertices[indices[0]]
    const targetB = targetVertices[indices[1]]
    const targetC = targetVertices[indices[2]]
    if (
      !isFinitePoint2(sourceA) ||
      !isFinitePoint2(sourceB) ||
      !isFinitePoint2(sourceC) ||
      !isFinitePoint2(targetA) ||
      !isFinitePoint2(targetB) ||
      !isFinitePoint2(targetC)
    ) {
      continue
    }

    const sourceSignedAreaPx2 = signedTriangleAreaPx2(sourceA, sourceB, sourceC)
    const targetSignedAreaPx2 = signedTriangleAreaPx2(targetA, targetB, targetC)
    const sourceAreaPx2 = Math.abs(sourceSignedAreaPx2)
    if (!Number.isFinite(sourceAreaPx2) || sourceAreaPx2 <= COMBINED_MESH_MIN_TRIANGLE_AREA_PX2) {
      sourceDegenerateTriangleCount += 1
      continue
    }

    const edgeLengths = [
      distance2d(sourceA, sourceB),
      distance2d(sourceB, sourceC),
      distance2d(sourceC, sourceA),
    ]
    edgeLengthsPx.push(...edgeLengths)
    if (edgeLengths.some((edgeLength) => edgeLength > longEdgeThresholdPx)) {
      longTriangleCount += 1
    }

    if (Math.sign(sourceSignedAreaPx2) !== Math.sign(targetSignedAreaPx2)) {
      potentialTargetInversionTriangleCount += 1
    }

    triangleIndices.push(indices[0], indices[1], indices[2])
    sourceTriangleAreasPx2.push(sourceAreaPx2)
    targetTriangleAreasPx2.push(Math.abs(targetSignedAreaPx2))
    if (sampleTriangleIndices.length < COMBINED_MESH_DEBUG_SAMPLE_LIMIT) {
      sampleTriangleIndices.push(indices)
    }
  }

  return {
    triangleIndices,
    sourceDegenerateTriangleCount,
    potentialTargetInversionTriangleCount,
    sourceTriangleAreasPx2,
    targetTriangleAreasPx2,
    edgeLengthsPx,
    longTriangleCount,
    sampleTriangleIndices,
  }
}

function createCombinedMeshSampleVertices(
  sourceVertices: readonly CombinedMeshPointPx[],
  targetVertices: readonly CombinedMeshPointPx[],
  metadata: readonly CombinedVertexMetadata[],
): CombinedMeshDebug["sampleCombinedVertices"] {
  const samples: CombinedMeshDebug["sampleCombinedVertices"] = []
  for (
    let index = 0;
    index < sourceVertices.length &&
      index < targetVertices.length &&
      index < metadata.length &&
      samples.length < COMBINED_MESH_DEBUG_SAMPLE_LIMIT;
    index += 1
  ) {
    samples.push({
      index,
      kind: metadata[index].kind,
      landmarkIndex: metadata[index].landmarkIndex,
      backgroundGridIndex: metadata[index].backgroundGridIndex,
      source: clonePoint(sourceVertices[index]),
      target: clonePoint(targetVertices[index]),
    })
  }
  return samples
}

function getBoundaryEdges(triangles: Array<[number, number, number]>): Array<[number, number]> {
  const edgeCounts = new Map<string, { edge: [number, number]; count: number }>()
  for (const triangle of triangles) {
    const edges: Array<[number, number]> = [
      [triangle[0], triangle[1]],
      [triangle[1], triangle[2]],
      [triangle[2], triangle[0]],
    ]
    for (const edge of edges) {
      const key = [...edge].sort((a, b) => a - b).join(":")
      const current = edgeCounts.get(key)
      if (current) {
        current.count += 1
      } else {
        edgeCounts.set(key, { edge, count: 1 })
      }
    }
  }
  return Array.from(edgeCounts.values())
    .filter((entry) => entry.count === 1)
    .map((entry) => entry.edge)
}

function isPointInCircumcircle(
  point: Point2,
  triangle: [number, number, number],
  points: readonly Point2[],
): boolean {
  const a = points[triangle[0]]
  const b = points[triangle[1]]
  const c = points[triangle[2]]
  const ax = a.x - point.x
  const ay = a.y - point.y
  const bx = b.x - point.x
  const by = b.y - point.y
  const cx = c.x - point.x
  const cy = c.y - point.y
  const determinant =
    (ax * ax + ay * ay) * (bx * cy - cx * by) -
    (bx * bx + by * by) * (ax * cy - cx * ay) +
    (cx * cx + cy * cy) * (ax * by - bx * ay)
  const orientation = signedTriangleAreaPx2(a, b, c)
  return orientation > 0 ? determinant > 0 : determinant < 0
}

function normalizeTriangleWinding(
  indices: [number, number, number],
  sourceVertices: readonly CombinedMeshPointPx[],
): [number, number, number] {
  const a = sourceVertices[indices[0]]
  const b = sourceVertices[indices[1]]
  const c = sourceVertices[indices[2]]
  return signedTriangleAreaPx2(a, b, c) >= 0
    ? indices
    : [indices[0], indices[2], indices[1]]
}

function signedTriangleAreaPx2(a: Point2, b: Point2, c: Point2): number {
  return ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) / 2
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
    width: maxX - minX,
    height: maxY - minY,
  }
}

function getTriangulationPointBucketPosition(value: number): number {
  return Math.floor(value / COMBINED_MESH_DUPLICATE_EPSILON_PX)
}

function getTriangulationPointBucketKey(point: CombinedMeshPointPx): string {
  return `${getTriangulationPointBucketPosition(point.x)}:${getTriangulationPointBucketPosition(point.y)}`
}

function clonePoint(point: Point2): Point2 {
  return {
    x: point.x,
    y: point.y,
  }
}
