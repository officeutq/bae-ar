import type {
  AlignmentDebug,
  BackgroundGridDebug,
  CombinedMeshDebug,
  CurrentFaceFrame,
  RenderedIdealState,
} from "./types"

export function downloadJson(fileName: string, payload: unknown): void {
  downloadText(fileName, `${JSON.stringify(payload, null, 2)}\n`, "application/json")
}

export function downloadText(
  fileName: string,
  content: string,
  mimeType = "text/plain",
): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = fileName
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export async function copyText(content: string): Promise<void> {
  await navigator.clipboard.writeText(content)
}

export function formatDebugSummary(payload: Record<string, unknown>): string {
  return Object.entries(payload)
    .map(([key, value]) => `${key}: ${formatSummaryValue(value)}`)
    .join("\n")
}

export function buildCurrentFaceDebugJson(
  currentFace: CurrentFaceFrame,
  actualVisibilityDebug: unknown,
): Record<string, unknown> {
  return {
    schemaVersion: "current_face_preview_debug_v1",
    summary: {
      currentFaceStatus: currentFace.currentFaceStatus,
      frameId: currentFace.frameId,
      mediaTimeSec: roundValue(currentFace.mediaTimeSec),
      landmarkCount: currentFace.landmarkCount,
      P_camera: roundDebugValue(currentFace.P_camera),
      qualityScore: currentFace.qualityScore,
      actualVisibilityDebug: roundDebugValue(actualVisibilityDebug),
      excludedReasonCounts: getNestedValue(
        actualVisibilityDebug,
        "excludedReasonCounts",
      ),
      errorMessage: currentFace.errorMessage,
    },
    sample: {
      current478: currentFace.current478?.slice(0, 12).map(roundDebugValue) ?? [],
    },
  }
}

export function buildRenderedIdealDebugJson(
  renderedIdeal: RenderedIdealState,
): Record<string, unknown> {
  return {
    schemaVersion: "rendered_ideal_preview_debug_v1",
    summary: {
      objLoaded: renderedIdeal.objLoaded,
      poseMappingProfileLoaded: renderedIdeal.poseMappingProfileLoaded,
      P_camera: roundDebugValue(renderedIdeal.P_camera),
      pForWebglRender: roundDebugValue(renderedIdeal.pForWebglRender),
      renderBackend: renderedIdeal.renderBackend,
      renderResolution: renderedIdeal.renderResolution,
      renderedIdealStatus: renderedIdeal.renderedIdealStatus,
      renderedIdealLandmarkCount: renderedIdeal.renderedIdealLandmarkCount,
      P_confirm: roundDebugValue(renderedIdeal.P_confirm),
      poseDiff: roundDebugValue(renderedIdeal.poseDiff),
      renderMs: roundValue(renderedIdeal.renderMs),
      detectMs: roundValue(renderedIdeal.detectMs),
      warnings: renderedIdeal.warnings,
      errorMessage: renderedIdeal.errorMessage,
    },
    sample: {
      renderedIdeal478: renderedIdeal.renderedIdeal478?.slice(0, 12).map(roundDebugValue) ?? [],
    },
  }
}

export function buildAlignmentDebugJson(
  alignmentDebug: AlignmentDebug,
): Record<string, unknown> {
  return {
    schemaVersion: "alignment_overlay_preview_debug_v1",
    summary: roundDebugValue(alignmentDebug),
  }
}

export function buildBackgroundGridDebugJson(
  debug: BackgroundGridDebug,
): Record<string, unknown> {
  return {
    schemaVersion: "background_grid_preview_debug_v1",
    summary: roundDebugValue(debug),
  }
}

export function buildCombinedMeshDebugJson(
  debug: CombinedMeshDebug,
): Record<string, unknown> {
  return {
    schemaVersion: "combined_mesh_preview_debug_v1",
    summary: roundDebugValue({
      combinedMeshStatus: debug.combinedMeshStatus,
      combinedSourceVertexCount: debug.combinedSourceVertexCount,
      combinedTargetVertexCount: debug.combinedTargetVertexCount,
      sourceTargetCountMatches: debug.sourceTargetCountMatches,
      indexCorrespondenceValid: debug.indexCorrespondenceValid,
      faceLandmarkVertexCount: debug.faceLandmarkVertexCount,
      backgroundGridInteriorVertexCount: debug.backgroundGridInteriorVertexCount,
      backgroundGridBoundaryVertexCount: debug.backgroundGridBoundaryVertexCount,
      triangleCount: debug.triangleCount,
      potentialTargetInversionTriangleCount: debug.potentialTargetInversionTriangleCount,
      sourceDegenerateTriangleCount: debug.sourceDegenerateTriangleCount,
      longTriangleCount: debug.longTriangleCount,
      sourceTriangleAreaSummaryPx2: debug.sourceTriangleAreaSummaryPx2,
      targetTriangleAreaSummaryPx2: debug.targetTriangleAreaSummaryPx2,
      edgeLengthSummaryPx: debug.edgeLengthSummaryPx,
    }),
    sample: roundDebugValue({
      sampleCombinedVertices: debug.sampleCombinedVertices,
      sampleTriangleIndices: debug.sampleTriangleIndices,
    }),
  }
}

export function buildCombinedMeshSummaryCsv(debug: CombinedMeshDebug): string {
  const rows: Array<[string, string | number | boolean | null]> = [
    ["combinedMeshStatus", debug.combinedMeshStatus],
    ["skipReason", debug.skipReason],
    ["combinedSourceVertexCount", debug.combinedSourceVertexCount],
    ["combinedTargetVertexCount", debug.combinedTargetVertexCount],
    ["sourceTargetCountMatches", debug.sourceTargetCountMatches],
    ["indexCorrespondenceValid", debug.indexCorrespondenceValid],
    ["faceLandmarkVertexCount", debug.faceLandmarkVertexCount],
    ["backgroundGridInteriorVertexCount", debug.backgroundGridInteriorVertexCount],
    ["backgroundGridBoundaryVertexCount", debug.backgroundGridBoundaryVertexCount],
    ["triangleCount", debug.triangleCount],
    ["potentialTargetInversionTriangleCount", debug.potentialTargetInversionTriangleCount],
    ["sourceDegenerateTriangleCount", debug.sourceDegenerateTriangleCount],
    ["longTriangleCount", debug.longTriangleCount],
    ["sourceTriangleAreaMeanPx2", debug.sourceTriangleAreaSummaryPx2.mean],
    ["sourceTriangleAreaP95Px2", debug.sourceTriangleAreaSummaryPx2.p95],
    ["targetTriangleAreaMeanPx2", debug.targetTriangleAreaSummaryPx2.mean],
    ["targetTriangleAreaP95Px2", debug.targetTriangleAreaSummaryPx2.p95],
    ["edgeLengthMeanPx", debug.edgeLengthSummaryPx.mean],
    ["edgeLengthP95Px", debug.edgeLengthSummaryPx.p95],
  ]
  return [
    "key,value",
    ...rows.map(([key, value]) => `${csvEscape(key)},${csvEscape(value)}`),
  ].join("\n") + "\n"
}

export function roundDebugValue(value: unknown): unknown {
  if (typeof value === "number") {
    return roundValue(value)
  }
  if (Array.isArray(value)) {
    return value.map(roundDebugValue)
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, roundDebugValue(nestedValue)]),
    )
  }
  return value
}

function roundValue(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null
  }
  return Math.round(value * 1000) / 1000
}

function formatSummaryValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "null"
  }
  if (typeof value === "number") {
    return String(roundValue(value))
  }
  if (typeof value === "string" || typeof value === "boolean") {
    return String(value)
  }
  return JSON.stringify(roundDebugValue(value))
}

function csvEscape(value: string | number | boolean | null): string {
  const text = value === null ? "" : String(value)
  if (!/[",\n]/.test(text)) {
    return text
  }
  return `"${text.replace(/"/g, '""')}"`
}

function getNestedValue(source: unknown, key: string): unknown {
  if (!source || typeof source !== "object") {
    return null
  }
  return (source as Record<string, unknown>)[key] ?? null
}
