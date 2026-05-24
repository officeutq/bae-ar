# IdealFace Authoring Tool Cleanup Inventory

## Purpose

`tools/ideal-face-authoring` は Step 2-I-C までの検証実装が同じ `main.ts` と JSON preview に積み上がっている。次の削除、非表示化、legacy 隔離に入る前に、現時点の UI / state / helper / JSON preview / candidate generation を active / legacy / debug / remove candidate に分類する。

今回は調査のみで、UI 削除、state 削除、helper 削除、JSON preview 分割、生成ロジック変更は行わない。

## Checked Files

- `tools/ideal-face-authoring/src/main.ts`
- `README.md`
- `docs/overview.md`
- `docs/architecture.md`
- `docs/development-flow.md`
- `docs/repository-structure.md`
- `docs/bae_ar_beauty_engine_spec_and_roadmap_2026_05.md`

## Classification Rule

- active: 今後の主導線として使うもの。
- legacy: 過去方式として残すが、今後の主導線ではないもの。新機能を追加しない。
- debug: 確認用、reference 用として残すが、ユーザー操作の中心にしないもの。新機能を追加しない。
- remove candidate: 実コード上の未参照、または表示上の重複や混乱が大きいもの。削除は次PRで再確認してから行う。

重要方針: legacy / debug と分類した UI や helper には、今後の新機能を追加しない。新機能は active workflow 側に追加する。特に Step 2-I 系の操作を旧ポーズ別候補 UI や Step 1 / Step 2-A debug 表示へ混ぜない。

## Active

| Area | Item | Reason | Notes |
|---|---|---|---|
| Step 2-I-A UI | `renderPoseAwareMultiFramePanel()` の正面基準候補 / 推定に使うフレーム / 除外フレーム | 今後の pose-aware multi-frame inference の主導線 | 現在は `renderRepresentativeFrameCandidatesPanel()` 内に表示されるため、次PRで active workflow として上位へ独立させる候補 |
| Step 2-I-A state | `idealLandmarks3DFrameSelection.frontReferenceFrameIds` / `excludedFrameIds` | 正面基準候補と除外フレームを保持する active state | `usableObservationFrames` は state ではなく `detailedScanFrames` から派生 |
| Step 2-I-A helpers | `addPoseAwareFrontReferenceFrame()` / `removePoseAwareFrontReferenceFrame()` / `addPoseAwareExcludedFrame()` / `removePoseAwareExcludedFrame()` / `excludePoseAwareFrame()` | Step 2-I の操作だけを担当 | 旧 `selectedRepresentativeFrames` とは別系統 |
| Step 2-I-B dataset | `getPoseAwareInferenceDataset()` / `frontReferenceFrames` / `observationFrames` / `excludedFrameCount` / `poseCoverage` | Step 2-I-C の入力 dataset | `left / right / up / down` 固定ラベルを持たない active dataset |
| Step 2-I-B helpers | `getPoseAwareDatasetFrontReferenceFrames()` / `getPoseAwareDatasetObservationFrames()` / `buildPoseAwareInferenceFrame()` / coverage helpers | pose-aware dataset の構築 | `detailedScanFrames` を主要入力にする |
| Step 2-I-C generation | `buildPoseAwareIdealLandmarks3DCandidateResult()` | active candidate generation | `generationMethod: "pose_aware_weighted_z_v1"` |
| Step 2-I-C helpers | `getRollCorrectedLandmarks2D()` / `buildPoseAwareBasePoints()` / `collectPoseAwareZHintsForFrame()` / `mergePoseAwareZHints()` / `getWeightedAverageZ()` / `inferPoseAwareLandmarkConfidence()` / `centerPoseAwareZValues()` | roll 補正、weighted z inference、confidence を担当 | 今後の改善はこの系統へ追加する |
| Step 2-H preview | `renderIdealLandmarks3DPointCloudPreviewPanel()` / `drawPointCloudPreviewCanvas()` | active candidate preview として使う 3D 点群確認 | preview は確認用であり、candidate data 自体は変更しない |
| Frame flow | `detailedScanFrames` | Step 2-I の observation 候補の元 | 詳細スキャン済みの有効 frame から active dataset を派生する |
| Candidate state | `idealLandmarks3DCandidateResult` | Step 2-G v1 / Step 2-I-C の結果を保持し、Step 2-H が表示する | 現状は最後に生成した candidate が表示対象。次PRで active / legacy 表示の分離を検討 |

## Legacy

| Area | Item | Reason | Notes |
|---|---|---|---|
| Step 2-C to 2-F UI | `representativeFrameCandidates` の front / yawPositive / yawNegative / pitchPositive / pitchNegative 候補 UI | 旧 5 ポーズ代表フレーム方式の入口 | Step 2-I は別 UI を持つ。旧 UI には Step 2-I 操作を追加しない |
| Step 2-D state | `selectedRepresentativeFrames` | front / left / right / up / down / excluded を手動確定する旧 state | Step 2-G v1 と regression check 用として残す可能性 |
| Step 2-E dataset | `idealLandmarks3DInferenceDataset` | 旧 5 ポーズ方式の 3D 推定用 dataset | 2D 478 landmarks と FacePose を持つ入力 dataset であり、完成した `idealLandmarks3D` ではない |
| Step 2-G v1 generation | `buildIdealLandmarks3DCandidateResult()` / `inferCandidateZ()` / `inferCandidateConfidence()` | 旧簡易推定方式 | `generationMethod: "step_2_g_v1"`。active の Step 2-I-C とは別方式 |
| Step 2-G v1 UI | `renderIdealLandmarks3DCandidatePanel()` | 旧 5 ポーズ dataset から candidate を生成する UI | すぐ削除せず、旧方式参照 / regression check 用として隔離候補 |
| Step 2-D handlers | `selectRepresentativeFrame()` / `clearSelectedRepresentativeFrame()` / `attachRepresentativeFrameSelectionHandler()` | 旧手動ラベル確定操作 | 新機能追加対象外 |
| Candidate category open state | `representativeCandidateCategoryOpenState` | 旧候補 UI の折りたたみ state | legacy section へ移す候補 |

## Debug

| Area | Item | Reason | Notes |
|---|---|---|---|
| Step 1 metadata | `idealFace` / `natural_v1` metadata summary | reference 表示 | `natural_v1` は projection debug / Step 1 reference。Step 2-I 主導線ではない |
| Step 1 controlPoints | `renderPreview()` / `renderControlPointRows()` / 6 controlPoints table | 6 controlPoints の確認用 | IdealFace 本体である `idealLandmarks3D` 478 点と混同しない表示整理が必要 |
| Step 2-A display extraction | `extractedFrames` / `renderDebugFrameListPanel()` / `renderFrameThumbnails()` | 粗い表示用フレーム抽出と metadata 確認 | 最大 20 件程度の preview。active observation の元ではない |
| Step 2-B analysis summary | `getAnalysisSummary()` と JSON の `videoSource.frames[*].landmarkPreview` | MediaPipe 解析確認 | JSON は先頭 5 点だけで、478 landmarks 全文や data URL 全文は出していない |
| Video metadata | `renderVideoMetadata()` / `renderVideoPreview()` / `renderExtractionStatus()` | 入力動画の確認 | workflow の入口だが、candidate generation の主導線ではない |
| Point cloud camera | `pointCloudPreviewCamera` / `pointCloudDragState` | Step 2-H 表示操作 | data を変更しない preview state |
| JSON preview | `buildAuthoringDebugPreview()` | 全体 debug / reference 表示 | 現状は active / legacy / debug が混在。次PRで目的別分割候補 |

## Remove Candidates

| Area | Item | Reason | Risk | Recommended Action |
|---|---|---|---|---|
| Helper | `formatPoseRange()` | `main.ts` 内で定義以外の参照なし | 低。ただし過去 summary 表示の復活予定がないか確認 | 次PRで `rg` と型チェック後に削除候補 |
| Helper | `getCandidateSourceFrames()` | `main.ts` 内で定義以外の参照なし。現在は `getCandidateSourceFramesFromFrames()` が使われる | 低。旧 Step 2-F 実装の名残の可能性 | 次PRで削除候補 |
| Helper | `updateExtractedFrame()` | `main.ts` 内で定義以外の参照なし | 中。過去の個別 frame analysis 更新用の名残に見えるが、今後再利用予定は未確認 | 次PRで削除候補 |
| JSON preview | `idealLandmarks3DCandidate` と `poseAwareIdealLandmarks3DCandidate` の並列表示 | 同じ `idealLandmarks3DCandidateResult` から派生し、pose-aware 生成時は情報が重複する | 中。active summary と legacy summary の切り分けが先 | 削除ではなく JSON preview 分割時に整理 |
| UI copy | 旧 5 ポーズ候補 UI と active Step 2-I UI の近接表示 | どちらが主導線か見えにくい | 中。表示順や見出し変更は UI 変更になる | 次PRで legacy 折りたたみ / 見出し変更候補 |
| JSON preview | `idealFace` 全体 | Step 1 reference と active Step 2-I data が同じ JSON に並ぶ | 低。controlPoints 数は少ないが主導線をぼかす | JSON preview 分割時に Step 1 reference へ移す |

## UI Section Inventory

| UI Section | Step | Classification | Current Role | Recommended Action |
|---|---|---|---|---|
| Header / step badge | 全体 | debug | 現在の実装段階表示 | `Step 2-I-C` と実装済み範囲の表示差があれば次PRで文言確認 |
| IdealFace metadata summary | Step 1 | debug | `natural_v1` metadata / control point count 確認 | Step 1 reference へ移す |
| Video material panel | Step 2-A | debug / input | MP4 選択、metadata、video preview | 入力欄としては必要。表示用抽出との役割を明記する候補 |
| Detailed scan panel | Step 2-F / 2-I source | active | 動画全体の詳細スキャン、candidate source 作成 | active workflow の入口として残す |
| Pose-aware multi-frame panel | Step 2-I-A/B/C | active | 正面基準、observation、除外、dataset、pose-aware candidate 生成 | active workflow の主導線として上位へ独立候補 |
| Selected representative frames panel | Step 2-D | legacy | 旧 5 ポーズ手動確定 | legacy section へ移す候補 |
| Readiness panel | Step 2-E | legacy | 旧 5 ポーズ dataset readiness | legacy section へ移す候補 |
| Inference dataset panel | Step 2-E | legacy | 旧 5 ポーズ dataset entry 確認 | legacy section へ移す候補 |
| Step 2-G v1 candidate panel | Step 2-G | legacy | 旧簡易 3D candidate 生成 | regression check 用に隔離候補 |
| Step 2-H point cloud preview | Step 2-H | active preview | 最後に生成された candidate を点群表示 | `generationMethod` を目立たせる候補 |
| Representative candidate category cards | Step 2-C/D/F | legacy | front / yaw / pitch 候補と旧ラベル選択 | Step 2-I 操作を追加しない |
| Debug extracted frame list | Step 2-A/B | debug | 表示用抽出フレーム一覧 | 折りたたみ維持。active workflow から距離を置く |
| 2D preview / controlPoints table | Step 1 | debug | 6 controlPoints の 2D reference | Step 2-I 主導線から外す |
| JSON preview | 全体 | debug | active / legacy / debug の summary をまとめて表示 | 次PRで目的別分割候補 |

## State Inventory

| State | Classification | Current Role | Used By | Notes |
|---|---|---|---|---|
| `videoSource` | active / debug mixed | 入力動画、表示用抽出、詳細スキャン、候補、summary の所有者 | ほぼ全 UI / helper | `extractedFrames` は debug、`detailedScanFrames` は active source |
| `videoSource.extractedFrames` | debug | 表示用抽出フレーム、metadata / debug frame list / JSON preview | `renderFrameThumbnails()` / `buildAuthoringDebugPreview()` | active observation の元ではない |
| `videoSource.detailedScanFrames` | active | Step 2-I observation source | `getUsableObservationFrames()` / pose-aware dataset | 詳細スキャンの結果 |
| `videoSource.representativeFrameCandidates` | legacy | 旧 5 ポーズ候補 UI と score 表示 | representative UI / `getPoseAwareCandidateScore()` | Step 2-I では score 参照のみ |
| `videoSource.representativeCandidateFrames` | legacy / bridge | 旧候補に採用された frame の参照 | `findPoseAwareFrameById()` fallback | active 本線は `detailedScanFrames` |
| `selectedRepresentativeFrames` | legacy | 旧 5 ポーズ手動確定 | Step 2-D/E/G v1 | Step 2-I state と混ぜない |
| `idealLandmarks3DFrameSelection` | active | Step 2-I front reference / excluded ids | pose-aware UI / dataset / candidate | 新機能追加先 |
| `idealLandmarks3DCandidateResult` | active / legacy mixed | 最後に生成された 3D candidate | Step 2-G UI / Step 2-I-C UI / Step 2-H / JSON | `generationMethod` で active / legacy を判別 |
| `pointCloudPreviewCamera` | debug | Step 2-H viewport state | point cloud UI / handlers | candidate data は変更しない |
| `pointCloudDragState` | debug | pointer interaction state | canvas handlers | 表示操作専用 |
| `isDebugFrameListOpen` | debug | 表示用抽出フレーム一覧の折りたたみ | debug frame list | active workflow ではない |
| `representativeCandidateCategoryOpenState` | legacy | 旧候補カテゴリの折りたたみ | representative candidate UI | legacy section へ移す候補 |

## Helper Function Inventory

| Helper Group | Classification | Current Role | Notes |
|---|---|---|---|
| Step 1 render helpers | debug | `renderPreview()` / `renderControlPointRows()` | 6 controlPoints reference |
| Video / extraction helpers | debug / input | `handleVideoFileSelection()` / `extractFramesFromVideo()` / `getExtractionTimestamps()` | 表示用抽出。active observation ではない |
| Detailed scan helpers | active | `scanVideoForRepresentativeCandidates()` / `getDetailedScanPlan()` / `analyzeScannedCanvasFrame()` | Step 2-I の source を作る |
| Candidate scoring helpers | legacy | `scoreFrontCandidate()` / yaw / pitch scoring / `buildRepresentativeFrameCandidate()` | 旧 5 ポーズ候補 UI 用。Step 2-I では score 表示にも使う |
| Step 2-D/E helpers | legacy | selected frame preview / dataset entry build | 旧 dataset 用 |
| Step 2-G v1 helpers | legacy | `inferCandidateZ()` / `inferCandidateConfidence()` / `buildIdealLandmarks3DCandidateResult()` | 新機能追加対象外 |
| Pose-aware frame helpers | active | frame id、front reference、excluded、observation 派生 | 新機能追加先 |
| Pose-aware dataset helpers | active | dataset / coverage / weight summary | 新機能追加先 |
| Pose-aware candidate helpers | active | roll correction / z hint / weighted z / confidence | 新機能追加先 |
| Point cloud helpers | active preview / debug | preview bounds、camera、draw canvas | 表示専用 |
| JSON preview helpers | debug | `buildAuthoringDebugPreview()` と各 `to...Preview()` | 分割候補 |
| Attach handlers | mixed | video, scan, legacy selection, pose-aware selection, generation, point cloud | handler も active / legacy / debug に分ける候補 |

## JSON Preview Inventory

| Section | Classification | Current Role | Recommended Action |
|---|---|---|---|
| `idealFace` | debug / Step 1 reference | `natural_v1` metadata と 6 controlPoints | Step 1 reference へ分ける |
| `scanSummary` | active / debug | 詳細スキャン summary。Step 2-I source の状態確認にも使う | Active summary に残す |
| `representativeFrameCandidates` | legacy | 旧 5 ポーズ候補一覧の preview | Legacy debug へ分ける |
| `selectedRepresentativeFrames` | legacy | 旧手動ラベル結果 | Legacy debug へ分ける |
| `poseAwareMultiFrameInference` | active | Step 2-I-A summary | Active summary へ分ける |
| `poseAwareInferenceDataset` | active | Step 2-I-B dataset summary | Pose-aware dataset へ分ける |
| `idealLandmarks3DInferenceDataset` | legacy | Step 2-E 旧 5 ポーズ dataset | Legacy debug へ分ける |
| `idealLandmarks3DCandidate` | active / legacy mixed | 最後に生成された candidate の共通 summary | `generationMethod` を基準に Generated candidate へ分ける |
| `poseAwareIdealLandmarks3DCandidate` | active / duplicate | pose-aware 生成時の追加 summary | `idealLandmarks3DCandidate` との重複を次PRで整理 |
| `videoSource` | debug | 入力動画、表示用抽出 frames、先頭 5 landmark preview | Debug / source summary へ分ける |

現状の JSON preview は 478 landmarks 全文や thumbnail / analysis image data URL 全文を出していない。`thumbnail` と `analysisImage` は `"omitted"` として出している。

## Frame Flow Inventory

| Flow | Classification | Current Role | Recommended Action |
|---|---|---|---|
| 表示用フレーム抽出 | debug | MP4 metadata 確認、サムネイル一覧、簡易解析 preview | active workflow からは一段下げる |
| 詳細スキャン | active | 動画全体を 0.1s 間隔で解析し、Step 2-I observation source を作る | active workflow の入口として明確化 |
| 代表フレーム候補 | legacy | 旧 front / left / right / up / down ラベル確定の候補 | legacy section へ移す |
| Step 2-I observation | active | 除外されていない詳細スキャン frame から派生 | active workflow の中心 |

## Landmark Data Inventory

| Data | Classification | Current Role | Recommended Action |
|---|---|---|---|
| `natural_v1` 6 controlPoints | debug / Step 1 reference | projection debug / reference | Step 2-I 主導線に入れない |
| MediaPipe 478 landmarks | active input | detailed scan、pose-aware dataset、candidate generation の入力 | active workflow の中心 |
| `idealLandmarks3DInferenceDataset` entries | legacy input | 旧 5 ポーズ方式の 2D 478 landmarks + FacePose dataset | legacy debug へ移す |
| pose-aware `frontReferenceFrames` | active input | base x / y を作る | active workflow |
| pose-aware `observationFrames` | active input | weighted z inference の観測 | active workflow |
| `idealLandmarks3DCandidateResult.landmarks` | active / legacy output | Step 2-G v1 または Step 2-I-C が生成した 478 点候補 | `generationMethod` を UI / JSON で明確化 |

## Candidate Generation Inventory

| Generation | Classification | Input | Output | Notes |
|---|---|---|---|---|
| Step 2-G v1 | legacy | `idealLandmarks3DInferenceDataset` の front / left / right / up / down | `idealLandmarks3DCandidateResult` with `generationMethod: "step_2_g_v1"` | 旧簡易推定 / regression check 用として残す |
| Step 2-I-C | active | `poseAwareInferenceDataset` | `idealLandmarks3DCandidateResult` with `generationMethod: "pose_aware_weighted_z_v1"` | 今後詰める主導線 |
| Step 2-H preview | active preview | `idealLandmarks3DCandidateResult` | canvas point cloud | どちらの candidate でも最後に生成された結果を表示する |

## Cleanup Applied

- `formatPoseRange()` / `getCandidateSourceFrames()` / `updateExtractedFrame()` は未使用 helper として削除済み。
- JSON preview は `activeSummary` / `poseAware` / `currentCandidate` / `legacy` / `reference` / `debug` の目的別構造へ整理済み。
- 現在 Step 2-H preview に表示される candidate は `currentCandidate` に一本化し、`generationMethod` を必ず含める。
- 旧 `idealLandmarks3DCandidate` / `poseAwareIdealLandmarks3DCandidate` の重複表示は削除済み。
- Step 2-G v1 は `legacy.step2Gv1` に整理し、Step 2-I-C の pose-aware data は `poseAware` 配下に整理済み。
- `natural_v1` / 6 controlPoints は `reference.naturalV1` に整理し、表示用の粗い抽出 frame と video metadata は `debug.videoSource` に整理済み。

## Next Refactor Plan

1. active workflow を `Step 2-I` として画面上位へ独立させ、詳細スキャン、front reference、observation、excluded、pose-aware dataset、pose-aware candidate、Step 2-H preview を一連の導線にする。
2. Step 2-C to 2-G v1 を legacy section へ折りたたみ、旧 5 ポーズ方式 / regression check 用であることを見出しと JSON に明記する。
3. Step 1 の `natural_v1` / 6 controlPoints と Step 2-A 表示用抽出フレーム一覧を debug / reference section へ移す。
4. JSON preview を Active summary、Pose-aware dataset、Generated candidate、Legacy debug、Step 1 reference に分ける。今回は実装しない。
5. `generationMethod` を Step 2-H preview と candidate summary でより目立たせ、Step 2-G v1 と Step 2-I-C の混同を避ける。
6. remove candidate の `formatPoseRange()`、`getCandidateSourceFrames()`、`updateExtractedFrame()` は次PRで `rg` と型チェック後に削除可否を判断する。
7. 以後の新機能は Step 2-I active workflow に追加し、legacy / debug UI や helper には追加しない。
