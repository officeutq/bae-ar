import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const EXPECTED_SOURCE_LANDMARK_COUNT = 468
const TARGET_LANDMARK_COUNT = 478

const OPTIONS = {
  invertZ: true,
  center: "mean",
  scaleMode: "range",
  targetRange: 0.08,
} as const

type Vertex = {
  x: number
  y: number
  z: number
}

type DepthStats = {
  minZ: number
  maxZ: number
  meanZ: number
  rangeZ: number
}

type ParsedObj = {
  vertices: Vertex[]
  faceCount: number
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const labRoot = path.resolve(scriptDir, "..")
const dataDir = path.join(labRoot, "data")
const sourceFileName = "canonical_face_model.obj"
const outputFileName = "canonical-face-depth-template-v1.json"
const sourcePath = path.join(dataDir, sourceFileName)
const outputPath = path.join(dataDir, outputFileName)

function parseNumber(value: string, lineNumber: number, axis: string): number {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ${axis} value at OBJ line ${lineNumber}: ${value}`)
  }

  return parsed
}

function parseCanonicalFaceObj(text: string): ParsedObj {
  const vertices: Vertex[] = []
  let faceCount = 0

  const lines = text.split(/\r?\n/)

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1
    const line = lines[index]?.trim()

    if (!line || line.startsWith("#")) {
      continue
    }

    if (line.startsWith("v ")) {
      const parts = line.split(/\s+/)

      if (parts.length < 4) {
        throw new Error(`Invalid vertex line at OBJ line ${lineNumber}: ${line}`)
      }

      vertices.push({
        x: parseNumber(parts[1], lineNumber, "x"),
        y: parseNumber(parts[2], lineNumber, "y"),
        z: parseNumber(parts[3], lineNumber, "z"),
      })
      continue
    }

    if (line.startsWith("f ")) {
      faceCount += 1
    }
  }

  return {
    vertices,
    faceCount,
  }
}

function calculateDepthStats(values: number[]): DepthStats {
  if (values.length === 0) {
    throw new Error("Cannot calculate depth stats for an empty value list")
  }

  const minZ = Math.min(...values)
  const maxZ = Math.max(...values)
  const meanZ = values.reduce((sum, value) => sum + value, 0) / values.length

  return {
    minZ,
    maxZ,
    meanZ,
    rangeZ: maxZ - minZ,
  }
}

function roundNumber(value: number): number {
  return Number(value.toFixed(9))
}

function roundStats(stats: DepthStats): DepthStats {
  return {
    minZ: roundNumber(stats.minZ),
    maxZ: roundNumber(stats.maxZ),
    meanZ: roundNumber(stats.meanZ),
    rangeZ: roundNumber(stats.rangeZ),
  }
}

async function main(): Promise<void> {
  let objText: string

  try {
    objText = await readFile(sourcePath, "utf8")
  } catch (error) {
    throw new Error(
      `Missing ${sourceFileName}. Place it at ${sourcePath} before running this script.`,
      { cause: error },
    )
  }

  const parsedObj = parseCanonicalFaceObj(objText)

  if (parsedObj.vertices.length !== EXPECTED_SOURCE_LANDMARK_COUNT) {
    throw new Error(`Expected 468 vertices, got ${parsedObj.vertices.length}`)
  }

  if (OPTIONS.center !== "mean") {
    throw new Error(`Unsupported center option: ${OPTIONS.center}`)
  }

  if (OPTIONS.scaleMode !== "range") {
    throw new Error(`Unsupported scaleMode option: ${OPTIONS.scaleMode}`)
  }

  const rawDepth = parsedObj.vertices.map((vertex) => vertex.z)
  const rawStats = calculateDepthStats(rawDepth)
  const orientedDepth = OPTIONS.invertZ
    ? rawDepth.map((value) => -value)
    : rawDepth
  const orientedStats = calculateDepthStats(orientedDepth)

  if (orientedStats.rangeZ === 0) {
    throw new Error("Cannot normalize canonical depth because the OBJ z range is 0")
  }

  const scale = OPTIONS.targetRange / orientedStats.rangeZ
  const normalizedDepth = orientedDepth.map((value) => (value - orientedStats.meanZ) * scale)
  const normalizedStats = calculateDepthStats(normalizedDepth)
  const comparisonLandmarkIndices = Array.from(
    { length: EXPECTED_SOURCE_LANDMARK_COUNT },
    (_, index) => index,
  )
  const excludedLandmarkIndices = Array.from(
    { length: TARGET_LANDMARK_COUNT - EXPECTED_SOURCE_LANDMARK_COUNT },
    (_, index) => index + EXPECTED_SOURCE_LANDMARK_COUNT,
  )

  const template = {
    schemaVersion: "canonical_face_depth_template_v1",
    generatedAt: new Date().toISOString(),
    source: {
      type: "mediapipe_canonical_face_model_obj",
      file: sourceFileName,
      sourceLandmarkCount: EXPECTED_SOURCE_LANDMARK_COUNT,
      targetLandmarkCount: TARGET_LANDMARK_COUNT,
    },
    depthConvention: {
      smallerZ: "front / 手前",
      largerZ: "back / 奥",
      normalizedFor: "bae_ar_fitting_lab",
    },
    sourceLandmarkCount: EXPECTED_SOURCE_LANDMARK_COUNT,
    targetLandmarkCount: TARGET_LANDMARK_COUNT,
    normalization: OPTIONS,
    stats: {
      raw: roundStats(rawStats),
      normalized: roundStats(normalizedStats),
      mesh: {
        vertexCount: parsedObj.vertices.length,
        faceCount: parsedObj.faceCount,
      },
    },
    comparisonLandmarkIndices,
    excludedLandmarkIndices,
    canonicalDepth: rawDepth.map((rawZ, index) => ({
      index,
      rawZ: roundNumber(rawZ),
      z: roundNumber(normalizedDepth[index]),
    })),
  }

  await mkdir(dataDir, { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(template, null, 2)}\n`, "utf8")

  console.log(`Generated ${outputPath}`)
  console.log(`canonicalDepth.length: ${template.canonicalDepth.length}`)
  console.log(`comparisonLandmarkIndices.length: ${comparisonLandmarkIndices.length}`)
  console.log(`excludedLandmarkIndices.length: ${excludedLandmarkIndices.length}`)
  console.log(`normalized.rangeZ: ${template.stats.normalized.rangeZ}`)
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(error.message)
  } else {
    console.error(error)
  }

  process.exitCode = 1
})
