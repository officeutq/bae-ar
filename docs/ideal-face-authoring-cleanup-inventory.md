# IdealFace Authoring Tool Cleanup Inventory

## Purpose

Step 2-I-A/B/C と Step 2-H まで積み上がった IdealFace Authoring Tool の active / reference / debug / removed legacy を、現在のコード状態に合わせて整理します。

## Current Active Workflow

Current active workflow:

```text
MP4 input
  -> detailed scan
  -> Step 2-I-A frame selection
       正面基準候補 / 推定に使うフレーム / 除外フレーム
  -> Step 2-I-B pose-aware inference dataset
  -> Step 2-I-C pose_aware_weighted_z_v1 candidate generation
       roll 補正
       yaw / pitch / weight による z hint
       idealLandmarks3D 478点候補生成
  -> Step 2-H currentCandidate point cloud preview
```

## Active

| Area | Item | Reason | Notes |
|---|---|---|---|
| Step 2-I-A | `frontReferenceFrameIds` / `excludedFrameIds` | 正面基準候補、推定に使うフレーム、除外フレームを管理する現在の主導線 | 3分類は排他的に扱う |
| Step 2-I-B | `poseAwareInferenceDataset` | pose-aware multi-frame inference の入力 dataset | detailed scan frames 由来の observation を使う |
| Step 2-I-C | `pose_aware_weighted_z_v1` | 現在唯一の 3D candidate generation path | roll 補正、yaw / pitch / weight による z hint を使う |
| Step 2-H | `currentCandidate` point cloud preview | 現在生成された candidate の確認表示 | preview camera は表示専用で candidate data を変更しない |

`pose_aware_weighted_z_v1` が生成する `idealLandmarks3D` は same-unit coordinate として扱います。`video_aspect_same_unit_v1` による video aspect 補正、pose-aware generation、将来の manual adjustment UI は Authoring Tool の責務です。Runtime / Studio は完成済み asset を読み込み、Projection 後に overlay / difference / warp 用の image-normalized / pixel 座標へ変換します。Authoring generation logic は Runtime / Studio に混ぜません。

## Reference / Debug

| Area | Item | Classification | Notes |
|---|---|---|---|
| Step 1 | `natural_v1` / 6 controlPoints | reference | projection debug 用。IdealFace 本体ではない |
| Step 2-A | 表示用の粗いフレーム抽出 / video metadata | debug | observation source ではない。Step 2-I は detailed scan frames を使う |
| JSON preview | `reference` / `debug` | reference / debug | active workflow と分けて表示する |

## Removed Legacy Workflow

旧 Step 2-C〜2-G v1 の 5ポーズ方式は current code から削除済みです。必要な場合は Git 履歴を参照します。

削除済み:

- old five-pose candidate UI
- `selectedRepresentativeFrames`
- `idealLandmarks3DInferenceDataset`
- `representativeFrameCandidates` / representative candidate UI and JSON preview
- `legacy.step2Gv1` JSON preview
- `buildIdealLandmarks3DCandidateResult()`
- `inferCandidateZ()`
- `inferCandidateConfidence()`
- `generationMethod: "step_2_g_v1"`
- Step 2-G v1 用の `readyLabels` / `missingLabels` / `requiredLabels`

## JSON Preview Inventory

| Section | Classification | Current Role | Notes |
|---|---|---|---|
| `activeSummary` | active | 現在の workflow 状態概要 | active workflow と current candidate の有無を確認する |
| `poseAware` | active | Step 2-I-A/B/C の frame selection / dataset / candidate summary | observationFrames 全文は出さない |
| `currentCandidate` | active | Step 2-H preview に表示される candidate | `generationMethod` は `pose_aware_weighted_z_v1`。478 landmarks 全文は出さない |
| `reference` | reference | `natural_v1` / 6 controlPoints | IdealFace 本体ではない |
| `debug` | debug | video metadata / scanSummary など | data URL 全文は出さない |

## Development Rule

legacy / debug と分類した UI や helper には、今後の新機能を追加しません。新機能は Step 2-I active workflow 側に追加します。

## Next Plan

- confidence debug を Step 2-I active workflow 側に追加する
- manual adjustment UI を Step 2-I active workflow 側に追加する
- save / import と correctionProfile / landmarkGroups / beauty_filter_asset_v1 export を Step 2-I active workflow 側で扱う
- multiple image input は Step 2-I active workflow に接続する
