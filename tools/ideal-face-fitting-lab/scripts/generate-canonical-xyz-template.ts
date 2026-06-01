import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const EXPECTED_SOURCE_LANDMARK_COUNT = 468
const TARGET_LANDMARK_COUNT = 478
const COMPLETED_LANDMARK_INDICES = Array.from(
  { length: TARGET_LANDMARK_COUNT - EXPECTED_SOURCE_LANDMARK_COUNT },
  (_, index) => index + EXPECTED_SOURCE_LANDMARK_COUNT,
)

type Vertex = {
  x: number
  y: number
  z: number
}

type ParsedObj = {
  vertices: Vertex[]
  faceCount: number
}

type InterpolatedLandmarkSpec = {
  index: number
  sourceDetail: "iris_fallback"
  derivedFrom: [number, number]
}

const IRIS_FALLBACK_SPECS: InterpolatedLandmarkSpec[] = [
  { index: 468, sourceDetail: "iris_fallback", derivedFrom: [33, 133] },
  { index: 469, sourceDetail: "iris_fallback", derivedFrom: [33, 133] },
  { index: 470, sourceDetail: "iris_fallback", derivedFrom: [33, 133] },
  { index: 471, sourceDetail: "iris_fallback", derivedFrom: [33, 133] },
  { index: 472, sourceDetail: "iris_fallback", derivedFrom: [33, 133] },
  { index: 473, sourceDetail: "iris_fallback", derivedFrom: [263, 362] },
  { index: 474, sourceDetail: "iris_fallback", derivedFrom: [263, 362] },
  { index: 475, sourceDetail: "iris_fallback", derivedFrom: [263, 362] },
  { index: 476, sourceDetail: "iris_fallback", derivedFrom: [263, 362] },
  { index: 477, sourceDetail: "iris_fallback", derivedFrom: [263, 362] },
]

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const labRoot = path.resolve(scriptDir, "..")
const dataDir = path.join(labRoot, "data")
const sourceFileName = "canonical_face_model.obj"
const outputFileName = "canonical-face-xyz-template-v1.json"
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

function roundNumber(value: number): number {
  return Number(value.toFixed(9))
}

function averageVertices(vertices: Vertex[], derivedFrom: [number, number]): Vertex {
  const [firstIndex, secondIndex] = derivedFrom
  const first = vertices[firstIndex]
  const second = vertices[secondIndex]

  if (!first || !second) {
    throw new Error(`Cannot interpolate from missing vertices: ${derivedFrom.join(", ")}`)
  }

  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
    z: (first.z + second.z) / 2,
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

  const rawLandmarks = parsedObj.vertices.map((vertex, index) => ({
    index,
    x: roundNumber(vertex.x),
    y: roundNumber(vertex.y),
    z: roundNumber(vertex.z),
    source: "obj_raw" as const,
  }))

  const interpolatedLandmarks = IRIS_FALLBACK_SPECS.map((spec) => {
    const vertex = averageVertices(parsedObj.vertices, spec.derivedFrom)

    return {
      index: spec.index,
      x: roundNumber(vertex.x),
      y: roundNumber(vertex.y),
      z: roundNumber(vertex.z),
      source: "interpolated" as const,
      sourceDetail: spec.sourceDetail,
      derivedFrom: spec.derivedFrom,
    }
  })

  const landmarks = [...rawLandmarks, ...interpolatedLandmarks]

  if (landmarks.length !== TARGET_LANDMARK_COUNT) {
    throw new Error(`Expected 478 landmarks, got ${landmarks.length}`)
  }

  const template = {
    schemaVersion: "canonical_face_xyz_template_v1",
    generatedAt: new Date().toISOString(),
    source: {
      model: "mediapipe_canonical_face_model",
      sourceFile: sourceFileName,
      sourceLandmarkCount: EXPECTED_SOURCE_LANDMARK_COUNT,
      targetLandmarkCount: TARGET_LANDMARK_COUNT,
      mesh: {
        vertexCount: parsedObj.vertices.length,
        faceCount: parsedObj.faceCount,
      },
    },
    coordinateSystem: {
      space: "mediapipe_canonical_local",
      description: "canonical_face_model.obj の raw x/y/z を保持する標準顔ローカル座標",
      x: "obj_raw",
      y: "obj_raw",
      z: "obj_raw",
      zDirection: "as_obj",
      normalizationApplied: false,
    },
    completion: {
      enabled: true,
      completedLandmarkIndices: COMPLETED_LANDMARK_INDICES,
      method: "eye_proxy_interpolation",
      note: "468..477 are not raw OBJ vertices. They are interpolated fallback points.",
      interpolationSources: [
        {
          landmarkIndices: [468, 469, 470, 471, 472],
          eyeProxy: "rightEye",
          derivedFrom: [33, 133],
        },
        {
          landmarkIndices: [473, 474, 475, 476, 477],
          eyeProxy: "leftEye",
          derivedFrom: [263, 362],
        },
      ],
    },
    comparison: {
      defaultExcludedLandmarkIndices: COMPLETED_LANDMARK_INDICES,
    },
    landmarks,
  }

  await mkdir(dataDir, { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(template, null, 2)}\n`, "utf8")

  console.log(`Generated ${outputPath}`)
  console.log(`landmarks.length: ${template.landmarks.length}`)
  console.log(`obj_raw.length: ${rawLandmarks.length}`)
  console.log(`interpolated.length: ${interpolatedLandmarks.length}`)
  console.log(`normalizationApplied: ${template.coordinateSystem.normalizationApplied}`)
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(error.message)
  } else {
    console.error(error)
  }

  process.exitCode = 1
})
