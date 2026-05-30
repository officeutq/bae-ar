# IdealFace Fitting Lab

`tools/ideal-face-fitting-lab` は、IdealFace478 の z、rotationOrigin / pivotZ、zScale、semantic alignment、bounds constraint の仕様判断材料を作る debug lab です。

この tool は production 用 IdealFace asset を作る正式 authoring tool ではありません。`tools/ideal-face-authoring` の Step 2-I 生成フローにも、`tools/mediapipe-canonical-lab` の MediaPipe 座標系調査にも混ぜません。

## 入力

MediaPipe Canonical Lab が export した captured JSON を import します。

読み込む主な情報:

- capture id
- landmarks 478
- pose: yaw / pitch / roll
- bucket: front / yawPositive / yawNegative / pitchPositive / pitchNegative / mixedPose
- videoWidth / videoHeight
- blendshapes
- facialTransformationMatrix があれば保持

## semantic points

最初の version では 8 semantic points だけを扱います。

| point | index |
| --- | --- |
| headTop | 10 |
| chin | 152 |
| leftCheek | 234 |
| rightCheek | 454 |
| leftEye | 474, 475, 476, 477 |
| rightEye | 469, 470, 471, 472 |
| nose | 4 |
| mouth | 13, 14 |

leftEye / rightEye は iris が取得できない場合、既存 `FaceGeometry` と同じ eye corner fallback を使います。

## 処理

1. captured JSON を読み込む
2. bucket ごとに最大 frame 数まで selected frames を作る
3. front bucket の selected frames から base8Points2D を作る
4. zValues / pivotZ / zScale / rotationOrigin / alignment mode の候補を作る
5. 各 frame の yaw / pitch / roll で 8IdealFace3D を回転する
6. simple perspective で 2D 投影する
7. semantic alignment を行う
8. semantic error / bounds error / penalty / totalScore を計算する
9. overall ranking と bucket ranking を表示する
10. bestCandidate から `bestIdealFace8` を生成する

## alignment mode

- `semantic_center_scale`: 8点の weighted center と広がりを合わせる
- `eye_distance_scale`: 左右目距離を scale 基準にし、両目 / 鼻 / 口の weighted center を合わせる
- `weighted_similarity_2d`: 8点の weighted similarity fitting で translate / uniformScale / screenRotation を求める

x/y separate scale は入れません。基本方針は uniformScale です。

## score

`totalScore` は次の要素で構成します。

- weightedSemanticDistance
- averageSemanticDistance
- perPointError
- bounds center / width / height / edge error
- scalePenalty
- translationPenalty
- symmetryPenalty
- zPlausibilityPenalty

bounds error は主基準ではなく、外枠破綻を防ぐ制約として扱います。

## export

Full:

- `schemaVersion: ideal_face_fitting_lab_analysis_v1`
- allCandidates と perFrameResults を含む詳細検証用 JSON

Summary:

- `schemaVersion: ideal_face_fitting_lab_analysis_summary_v1`
- topCandidates 上位20件、bestCandidate、bucketRanking 上位5件、summary 類、warnings を含む軽量 JSON
- `zProfileDefinitions` 全件、`depthConvention`、`bestIdealFace8`、`depthRelation` を含む
- allCandidates 全件、perFrameResults 全件、landmarks 478 全文、captured frames 全文、data URL は含めません

## bestIdealFace8

`bestIdealFace8` は、grid search の `bestCandidate` から作る 8点だけの理想顔3D debug artifact です。production 用 IdealFace asset ではなく、`ideal_face_asset_v1` や `beauty_filter_asset_v1` の schema 変更も行いません。

- x / y は `front` bucket 由来の `base8Points2D` を使います。
- z は bestCandidate の `zProfile` を使います。
- `zRaw` は `zProfileDefinitions` にある奥行き形状そのものの値です。
- `zScaled` は `zRaw * zScale` です。
- `points[].z` は `zScaled` と同じ値です。
- `pivotZ` は grid search projection 用の値として `source` に残し、`points[].z` には焼き込みません。
- このラボでは smaller z が front / 手前、larger z が back / 奥です。

`depthRelation` では `noseZ`、左右頬の z、平均頬 z、`noseIsInFrontOfCheeks`、左右頬 / 左右目の奥行き差を確認できます。

次段では、`bestIdealFace8` の z を正面478点の x/y に補間して `provisionalIdealFace478` を作る予定です。今回は 478点への拡張、`provisionalIdealFace478` 生成、Runtime / Studio / Authoring Tool 連携は実装しません。

## 起動

```bash
npm run start:ideal-face-fitting-lab
```
