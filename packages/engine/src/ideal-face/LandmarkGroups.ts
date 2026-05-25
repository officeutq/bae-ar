import type { IdealFace } from "./IdealFace"

export type LandmarkGroupsSchemaVersion = "landmark_groups_v1"

export type LandmarkGroupPurpose =
  | "expression_safety"
  | "shape_boundary_safety"
  | "color_mask"
  | "debug"

export interface LandmarkGroup {
  id: string
  label: string
  purpose?: LandmarkGroupPurpose | string
  indices: number[]
}

export interface LandmarkGroups {
  schemaVersion: LandmarkGroupsSchemaVersion
  topology: "mediapipe_face_landmarker_478"
  groups: LandmarkGroup[]
}

export type LandmarkGroupsSource = "asset" | "fallback"

export type LandmarkGroupsDebugStatus =
  | "available"
  | "fallback"
  | "not_available"

export interface LandmarkGroupDebugSummary {
  id: string
  label: string
  purpose?: string
  indexCount: number
  previewIndices: number[]
}

export interface LandmarkGroupsDebugSummary {
  status: LandmarkGroupsDebugStatus
  source: LandmarkGroupsSource | null
  schemaVersion: LandmarkGroupsSchemaVersion | null
  topology: LandmarkGroups["topology"] | null
  groupCount: number
  groups: LandmarkGroupDebugSummary[]
}

export interface LandmarkGroupsResolution {
  source: LandmarkGroupsSource
  groups: LandmarkGroups
}

export const DEFAULT_LANDMARK_GROUPS_V1: LandmarkGroups = {
  schemaVersion: "landmark_groups_v1",
  topology: "mediapipe_face_landmarker_478",
  groups: [
    {
      id: "mouth",
      label: "Mouth",
      purpose: "expression_safety",
      indices: [
        0, 13, 14, 17, 37, 39, 40, 61, 78, 80, 81, 82, 84, 87, 88, 91, 95,
        146, 178, 181, 185, 191, 267, 269, 270, 291, 308, 310, 311, 312,
        314, 317, 318, 321, 324, 375, 402, 405, 409, 415,
      ],
    },
    {
      id: "left_eye",
      label: "Left Eye",
      purpose: "expression_safety",
      indices: [
        7, 33, 133, 144, 145, 153, 154, 155, 157, 158, 159, 160, 161, 163,
        173, 246,
      ],
    },
    {
      id: "right_eye",
      label: "Right Eye",
      purpose: "expression_safety",
      indices: [
        249, 263, 362, 373, 374, 380, 381, 382, 384, 385, 386, 387, 388,
        390, 398, 466,
      ],
    },
    {
      id: "face_boundary",
      label: "Face Boundary",
      purpose: "shape_boundary_safety",
      indices: [
        10, 21, 54, 58, 67, 93, 103, 109, 127, 132, 136, 148, 149, 150,
        152, 162, 172, 176, 234, 251, 284, 288, 297, 323, 332, 338, 356,
        361, 365, 377, 378, 379, 389, 397, 400, 454,
      ],
    },
  ],
}

export const DEFAULT_LANDMARK_GROUP_IDS = DEFAULT_LANDMARK_GROUPS_V1.groups.map(
  (group) => group.id,
)

export function getLandmarkGroupsOrDefault(
  idealFace: IdealFace,
): LandmarkGroupsResolution {
  if (idealFace.model.landmarkGroups) {
    return {
      source: "asset",
      groups: idealFace.model.landmarkGroups,
    }
  }

  return {
    source: "fallback",
    groups: DEFAULT_LANDMARK_GROUPS_V1,
  }
}

export function getLandmarkGroupsDebugSummary(
  idealFace: IdealFace,
): LandmarkGroupsDebugSummary {
  return createLandmarkGroupsDebugSummary(getLandmarkGroupsOrDefault(idealFace))
}

export function createLandmarkGroupsDebugSummary(
  resolution: LandmarkGroupsResolution | undefined,
): LandmarkGroupsDebugSummary {
  if (!resolution) {
    return {
      status: "not_available",
      source: null,
      schemaVersion: null,
      topology: null,
      groupCount: 0,
      groups: [],
    }
  }

  return {
    status: resolution.source === "asset" ? "available" : "fallback",
    source: resolution.source,
    schemaVersion: resolution.groups.schemaVersion,
    topology: resolution.groups.topology,
    groupCount: resolution.groups.groups.length,
    groups: resolution.groups.groups.map((group) => ({
      id: group.id,
      label: group.label,
      purpose: group.purpose,
      indexCount: group.indices.length,
      previewIndices: group.indices.slice(0, 8),
    })),
  }
}

export function getLandmarkGroupIds(groups: LandmarkGroups): string[] {
  return groups.groups.map((group) => group.id)
}

export function getLandmarkGroupsForIndex(
  index: number,
  groups: LandmarkGroups,
): string[] {
  return groups.groups
    .filter((group) => group.indices.includes(index))
    .map((group) => group.id)
}

export function cloneLandmarkGroups(
  groups: LandmarkGroups | undefined,
): LandmarkGroups | undefined {
  if (!groups) {
    return undefined
  }

  return {
    ...groups,
    groups: groups.groups.map((group) => ({
      ...group,
      indices: [...group.indices],
    })),
  }
}
