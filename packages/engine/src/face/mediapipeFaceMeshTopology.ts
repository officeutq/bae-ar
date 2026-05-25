import { FaceLandmarker } from "@mediapipe/tasks-vision"

type LandmarkConnection = {
  start: number
  end: number
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

    triangleIndices.push(first.start, first.end, second.end)
  }

  return triangleIndices
}

export const MEDIAPIPE_FACE_MESH_TRIANGLES: readonly number[] =
  buildTriangleIndicesFromTessellation(
    FaceLandmarker.FACE_LANDMARKS_TESSELATION as readonly LandmarkConnection[],
  )

export const MEDIAPIPE_FACE_MESH_TOPOLOGY_LANDMARK_COUNT = 468

export const MEDIAPIPE_FACE_MESH_TRIANGLE_COUNT =
  MEDIAPIPE_FACE_MESH_TRIANGLES.length / 3
