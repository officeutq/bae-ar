# IdealFace Authoring Tool Five-Pose UI Removal

## Purpose

This note records the cleanup status after removing the old Step 2-C to 2-G v1 five-pose UI, state, and JSON preview from `tools/ideal-face-authoring`.

## Active Workflow

The current authoring workflow is:

```text
MP4 input
  -> detailed scan
  -> Step 2-I-A frame selection
  -> Step 2-I-B pose-aware inference dataset
  -> Step 2-I-C pose_aware_weighted_z_v1 candidate generation
  -> Step 2-H currentCandidate point cloud preview
```

New features such as confidence debug, manual adjustment, save, and export should be added only to this Step 2-I active workflow.

## Removed From Current UI / State / JSON Preview

- Old five-pose candidate UI for `front`, `yawPositive`, `yawNegative`, `pitchPositive`, and `pitchNegative`
- Old manual representative frame label UI
- Selected representative frame list
- Old 3D inference readiness UI
- Old 3D inference dataset UI
- Old Step 2-G v1 candidate generation UI / summary
- `selectedRepresentativeFrames` state
- `idealLandmarks3DInferenceDataset` state and preview
- `representativeFrameCandidates` / `representativeCandidateFrames` UI and JSON preview
- `legacy.step2Gv1` JSON preview

The JSON preview now uses these top-level sections:

```text
activeSummary
poseAware
currentCandidate
reference
debug
```

`legacy` is no longer part of the JSON preview.

## Score Reference

Step 2-I score lookup is no longer tied to old representative candidate UI / JSON data. Score is derived from `detailedScanFrames` and pose-aware frame data so the active workflow can continue without `representativeFrameCandidates`.

## Remaining Follow-Up

The old Step 2-G v1 generation helper path is intentionally left for a later cleanup PR:

- `buildIdealLandmarks3DCandidateResult()`
- `inferCandidateZ()`
- `inferCandidateConfidence()`
- `generationMethod: "step_2_g_v1"`

After that follow-up, 3D candidate generation should be fully centered on `pose_aware_weighted_z_v1`.

## Rule

Legacy / debug paths must not receive new feature work. Future IdealFace Authoring Tool feature work should be added to the Step 2-I active workflow.
