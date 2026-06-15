# Ideal OBJ Render Warp Lab

## Live Alignment

MP4 再生中の Pose Mapping runtime は、live alignment を `direct_piecewise_ty3_linear_normalized_v1` に一本化する。
UI から alignment mode は選ばせず、debug には固定値として `alignmentMethod: direct_piecewise_ty3_linear_normalized_v1` を表示する。

現在の live alignment は以下の流れで行う。

```text
currentMatrix
  -> buildPlacementFunctionMatrixFeatures(currentMatrix)
  -> direct_piecewise_ty3_linear_normalized_v1
  -> scaleRatio
  -> translateAfterScaleImageX
  -> translateAfterScaleImageY
  -> renderedIdeal478 を live video image-normalized coordinate へ配置
  -> alignedRenderedIdeal478
  -> meshTargetVertices
```

placement function の適用対象は `renderedIdeal478` であり、OBJ coordinate、render canvas pixel coordinate、displayedContentRect pixel coordinate、aspect-corrected work coordinate はここに混ぜない。

```text
aligned.x = renderedIdeal.x * scaleRatio + translateAfterScaleImageX
aligned.y = renderedIdeal.y * scaleRatio + translateAfterScaleImageY
aligned.z = renderedIdeal.z
```

`facialTransformationMatrix` は、直接 center / scale として使わず、`matrixFeatures` を作るための入力として使う。matrix raw、column-major / row-major translation、bounds center との比較は debug-only の確認情報として残す。

placement function を評価できない場合は、旧 alignment へ fallback しない。`alignmentStatus = skipped_invalid_placement_function` とし、`placementFunctionStatus` に以下のいずれかを出す。

- `skipped_missing_matrix`
- `skipped_invalid_matrix_features`
- `skipped_invalid_candidate`
- `skipped_invalid_transform`
- `skipped_invalid_aligned_landmarks`

成功時は `placementFunctionStatus = applied` とし、debug / Copy Debug / JSON summary には以下を出す。

- `placementFunctionCandidateId`
- `placementFunctionStatus`
- `scaleRatio`
- `translateAfterScaleImageX`
- `translateAfterScaleImageY`
- `matrixFeatures`
- `currentBoundsImage`
- `renderedIdealBoundsImage`
- `alignedRenderedIdealBoundsImage`
- `alignedLandmarkCount`
- `invalidAlignedLandmarkCount`

`placement mapping samples` は session memory に frame ごとの small summary として保存し、JSON / CSV で export できる。sample には `frameId`、`mediaTimeSec`、`P_camera`、`p`、`P_confirm`、`poseDiffMagnitude`、matrix column-major translation / scale、current / rendered / aligned bounds、placement function candidate id / status、scale / translate、`matrixFeatures`、aspect ratio、`qualityUsable`、`skippedReason` を含める。

## Central Pane Coordinate Tabs（中央ペイン座標系タブ）

中央ペインは処理名ではなく coordinate system（座標系）ごとに tab（タブ）を分ける。

- `OBJ 3D（OBJ座標）`: OBJ coordinate（OBJ座標）で OBJ mesh / vertices / faces / raw OBJ bounds を確認する。`current478`、`renderedIdeal478`、`alignedRenderedIdeal478`、`meshSourceVertices`、`meshTargetVertices` は表示しない。
- `レンダー画像（render canvas座標）`: render canvas image-normalized coordinate / render canvas pixel coordinate（レンダーcanvas画像正規化座標 / レンダーcanvasピクセル座標）で rendered ideal image と `renderedIdeal478` を確認する。
- `ライブ座標（live image-normalized座標）`: live video image-normalized coordinate（ライブ映像の画像正規化座標）で `current478`、`alignedRenderedIdeal478`、`current478 -> alignedRenderedIdeal478` の対応線、`meshSourceVertices`、`meshTargetVertices` を確認する。
- `表示重ね描き（displayedContentRect pixel座標）`: displayedContentRect pixel coordinate / canvas pixel coordinate（表示領域ピクセル座標 / canvasピクセル座標）で live video と overlay canvas の表示ズレを確認する。
- `配置関数解析（placement analysis）`: placement analysis image-normalized coordinate / analysis render canvas coordinate（配置関数解析用の画像正規化座標 / 解析レンダーcanvas座標）で placement samples、candidate comparison、roundtrip validation を確認する。placement analysis の candidate は live runtime へ自動反映しない。

`renderedIdeal478`（レンダー理想478点）は render canvas coordinate（レンダーcanvas座標）の点であり、live video（ライブ映像）上に直接表示しない。live video 上に表示してよい理想点は、placement function（配置関数）で live video image-normalized coordinate（ライブ映像の画像正規化座標）へ変換済みの `alignedRenderedIdeal478`（位置合わせ済み理想478点）だけとする。

overlay（重ね表示）は displayedContentRect pixel coordinate（表示領域ピクセル座標）で扱う。live video の letterbox / pillarbox を含む表示領域は `displayedContentRect` で確認し、render canvas coordinate や OBJ coordinate を overlay canvas に混ぜない。

checkbox（チェックボックス）は各 coordinate tab（座標系タブ）内に置く。データがない checkbox は disabled（無効）にし、理由を表示する。例:

```text
alignedRenderedIdeal478（位置合わせ済み理想478点）
  status: not available（未生成）
  reason: placementFunctionStatus = skipped_invalid_candidate

meshTargetVertices（変形先メッシュ頂点）
  status: not available（未生成）
  reason: alignmentStatus = skipped_invalid_placement_function

renderedIdeal478（レンダー理想478点）
  status: not available（未生成）
  reason: renderedIdealStatus = no_face
```

## Removed Legacy Alignment

以下の旧 live alignment mode は廃止済みであり、fallback / 比較用としても runtime には残さない。

- `bounds_center_scale_v1`
- `mediapipe_placement_center_scale`

旧 `bounds_center_scale_v1` は current / rendered ideal bounds から center + scale を作る prototype だった。旧 `mediapipe_placement_center_scale` は `facialTransformationMatrix` の translation / scale をそのまま live alignment として扱う prototype だった。現在はどちらも `alignedRenderedIdeal478` / `meshTargetVertices` の生成には使わない。

## Placement Function Analysis（配置関数解析）

`Placement Function Analysis（配置関数解析）` は、理想 OBJ 顔だけを使う debug-only の検証機能です。目的は、WebGL で既知配置に置いた理想 OBJ 顔を MediaPipe に通し、返ってきた `facialTransformationMatrix` から `scaleRatio + translateAfterScale` を復元する placement function を求めることです。

詳細な検証履歴と候補選定の流れは
[Placement Function Analysis History](ideal-obj-render-warp-lab-placement-function-analysis-history.md)
に整理します。

処理の流れ:

```text
WebGLで既知配置に置いた理想OBJ顔
  -> 専用の解析用 canvas へ描画
  -> MediaPipe detect(canvas)
  -> facialTransformationMatrix
  -> placement function candidate
  -> knownTransform を復元できるか確認
```

解析用 canvas は live preview / live overlay とは別の `placementAnalysisRenderCanvas` と `placementAnalysisOverlayCanvas` を使います。`placementAnalysisRenderCanvas` は WebGL render された理想 OBJ 顔画像、`placementAnalysisOverlayCanvas` は MediaPipe が返した 478 点を重ねる 2D overlay です。理想顔レンダー本体は WebGL render のみを使い、Canvas 2D の `drawImage()` で理想顔画像を再配置する方式や render backend 比較は行いません。

座標系は CSS 表示サイズではなく drawing buffer を正とします。MediaPipe に渡す画像も解析用 canvas そのものです。

```ts
imageLandmarker.detect(placementAnalysisRenderCanvas)
```

`knownPlacement` は canvas 全体を 0..1 とする image-normalized coordinate で記録します。`centerImageX = 0.5` / `centerImageY = 0.5` が canvas 中央です。aspect-corrected work coordinate は以下で記録します。

```text
centerWorkX = centerImageX * renderAspectRatio
centerWorkY = centerImageY
```

初期 canvas は 16:9 の `960 x 540` です。解析用 canvas には letterbox を作らず、canvas 全体を MediaPipe 入力画像全体、かつ `knownPlacement` の 0..1 座標範囲として扱います。

初期 sweep は正面 pose のみで、`centerImageX` を `0.42, 0.46, 0.50, 0.54, 0.58`、`centerImageY` を `0.40, 0.42, 0.44, 0.46, 0.48, 0.50, 0.52, 0.54, 0.56, 0.58, 0.60`、`visualScaleInput` を `1.10, 1.15, 1.20, 1.25, 1.30` とします。角度は既存の pose mapping の責務であり、この解析では placement（中心・大きさ）だけを扱います。

同一条件の再現性を見るため、`repeatCount` を run option に持たせ、default は `2` とします。標準サンプル数は `5 x 11 x 5 x 2 = 550` です。各 sample には `repeatIndex`、`repeatCount`、`conditionKey` を保存し、`conditionKey` は `x=0.500_y=0.540_scale=1.200_pose=front` のように、同一 `centerImageX` / `centerImageY` / `visualScaleInput` / pose をグルーピングできる文字列にします。目的は、`centerImageY` による `tz` / `invNegTz` の系統的な動きと、同一条件を複数回実行したときのランダムな揺れを分けて見ることです。

現状の WebGL レンダー条件では、`visualScaleInput` が `0.80` / `0.90` の小さい顔サイズになると MediaPipe が `no_face` になりやすいことが分かっています。そのため、初期 sweep から `0.80` / `0.90` を外し、検出できる顔サイズ寄りの `1.10` 以上を中心にします。`1.00` 付近は将来の boundary check（境界確認）用として別扱いにします。

WebGL 側では、既存の pose-baked vertices の renderer を再利用しつつ、最後段の clip-space transform で `visualScaleInput` と `centerImageX / centerImageY` を適用します。これは物理 camera 再現ではなく、「どこに、どの大きさで描いたか」を明確に制御して matrix と対応付けるための debug 実装です。

配置関数の主目的変数は、従来の `centerWorkX / centerWorkY / visualScaleInput` 直接復元ではなく、`basePlacement` から `targetPlacement` へ移る `knownTransform` です。変換順序は `scale_then_translate`（拡大縮小してから平行移動）で固定します。candidate function は production 側の画像 aspect ratio が固定とは限らないため、`aspect_corrected_work_coordinate` ではなく `image_normalized_coordinate` を主座標系にします。work coordinate は preview / debug / 適用時に必要な場合だけ aspect ratio から派生します。

```text
targetImageX = baseImageX * scaleRatio + translateAfterScaleImageX
targetImageY = baseImageY * scaleRatio + translateAfterScaleImageY

workX = imageX * renderAspectRatio
workY = imageY
```

sample には以下を保存します。

- `basePlacement`: WebGL の analysis placement transform をかける前の projected bounds
- `targetPlacement`: WebGL に指定した `knownPlacement` と base 幅から計算した目標配置
- `knownTransform`: `scaleRatio`、`translateAfterScaleImageX`、`translateAfterScaleImageY`、debug 用の `translateAfterScaleWorkX`、`translateAfterScaleWorkY`

`observedRenderedBounds` は MediaPipe returned478 から見た補助 debug であり、`knownTransform` の計算には使いません。

UI は以下の分担です。

- 左ペインには配置関数解析ボタンを置きません。OBJ loading や render settings など通常操作の領域として残します。
- 中央ペインに `配置関数解析プレビュー` tab を追加します。最新または選択中 sample の WebGL render image と MediaPipe returned 478 overlay を表示します。プレビューでは変換後の `target478` に加えて、位置・スケール変換前の `base478` も表示できます。`base478` は current478 ではなく、理想 OBJ 由来の変換前478点です。優先的には base render image を MediaPipe に通した `Base 478（pre-transform MediaPipe）` を使い、取得できない場合だけ `Base 478（inverse known transform）` として target478 を既知逆変換で戻した点を使います。
- 右ペインに `配置関数解析` tab を追加します。解析実行、停止、サンプル JSON / CSV download、candidate JSON download、compact debug summary を置きます。

sample には `repeatIndex`、`repeatCount`、`conditionKey`、`knownPlacement`、`basePlacement`、`targetPlacement`、`knownTransform`、front の `requestedPoseP`、MediaPipe の detected / returned pose / `facialTransformationMatrix`、matrix features、補助 debug としての `observedRenderedBounds`、`quality.usable` と `skippedReason` を保存します。JSON export には returned478 配列そのものは含めません。returned478 は中央プレビュー overlay 用の state としてのみ保持します。

右ペインの debug summary と JSON export には、`scaleDetectionSummary`（スケール別検出要約）と `skippedReasonCounts`（除外理由別件数）を含めます。これにより、失敗が小さすぎる顔サイズによる `no_face` なのか、`facialTransformationMatrix` 欠落や matrix feature 不正なのかを切り分けます。

JSON export の summary には、同一条件内の安定性を見る `repeatSummary`、scaleRatio ごとの `centerImageX` / `centerImageY` と `negTz = -tz` / `invNegTz` の相関を見る `positionCorrelationSummary`、`scaleRatio + centerImageY` ごとの `negTz` 平均・範囲を見る `verticalPositionSummary` を含めます。右ペインにも compact summary として、繰り返し要約、位置相関、縦位置別要約を表示します。

後続の anchor-based transform model（基準点ベース変換モデル）検証のため、配置関数解析 sample には `anchorLandmark` として index `0` の target / base 座標を保存します。`targetAnchor` は target render を MediaPipe に通して得た `returnedLandmarks[0]`、`baseAnchor` は base478 の `landmarks[0]` です。`baseAnchorSource` は `pre_transform_mediapipe` または `inverse_known_transform`、取得できない場合は `unavailable` とします。

`knownTransformDerived` では、既知の `scaleRatio` を使って anchor 由来の `translateAfterScaleImageX/Y` を計算します。

```text
anchorTranslateAfterScaleImageX =
  targetAnchorImageX - baseAnchorImageX * knownTransform.scaleRatio

anchorTranslateAfterScaleImageY =
  targetAnchorImageY - baseAnchorImageY * knownTransform.scaleRatio
```

この値と既存の `knownTransform.translateAfterScaleImageX/Y` の差を sample / JSON summary / CSV / UI に出します。`baseAnchorSource = inverse_known_transform` の場合は target478 を既知逆変換で戻しているため、anchor 由来の translate error がほぼ 0 になることがあります。これは正常であり、今回の変更では candidate function 自体は変更しません。

placement function candidate は、まず image-normalized coordinate の `targetCenter` と `scaleRatio` を推定し、`translateAfterScaleImage` を導出します。candidate 内では fixed aspect ratio を混ぜず、work coordinate は candidate の外側で必要に応じて `imageX * aspectRatio` として計算します。repeat sample が同一条件を過重にしないように、usable samples を `conditionKey` ごとに平均してから fitting する `condition_mean` を使います。candidate JSON の `source` には `sampleCount`、`usableSampleCount`、`uniqueConditionCount`、`fittingSampleCount`、`fittingAggregation` を含めます。

```text
estimatedTargetCenterImageX = a0 + a1 * txOverNegTz
estimatedTargetCenterImageY = b0 + b1 * tyOverNegTz
estimatedScaleRatio = c0 + c1 * invNegTz

estimatedTranslateAfterScaleImageX =
  estimatedTargetCenterImageX - basePlacement.centerImageX * estimatedScaleRatio

estimatedTranslateAfterScaleImageY =
  estimatedTargetCenterImageY - basePlacement.centerImageY * estimatedScaleRatio
```

matrix-to-knownTransform direct model（行列から既知変換を直接推定するモデル）も candidate JSON / UI の比較対象として出力します。目的は、currentMatrix と同じ `facialTransformationMatrix` を返すように、理想 OBJ 顔を image-normalized coordinate 上でどの `scaleRatio` / `translateAfterScaleImageX` / `translateAfterScaleImageY` に置くべきかを推定することです。

現行の center-derived model は比較基準として残します。追加 direct model では `targetCenter` を経由せず、`matrixFeatures` から `knownTransform.scaleRatio` / `knownTransform.translateAfterScaleImageX` / `knownTransform.translateAfterScaleImageY` を直接推定します。direct model の fitting も repeat sample が同一条件を過重にしないよう、usable samples を `conditionKey` ごとに平均する `condition_mean` を使います。

追加比較モデルは以下です。

- `direct_linear_normalized_v1`: `txOverNegTz` / `tyOverNegTz` / `invNegTz` を使う一次モデル
- `direct_linear_raw_matrix_v1`: `tx` / `ty` / `tz` を使う一次モデル
- `direct_linear_split_v1`: 出力ごとに `ty, tz`、`tx, tz`、`ty, tz` を使い分ける一次モデル
- `direct_quadratic_normalized_v1`: 正規化特徴量と二次・交差項を使う過学習確認用モデル

candidate JSON には既存 top-level の `features` / `models` / `metrics` を center-derived model のまま残し、追加 field として `directTransformCandidates` と `candidateComparison` を含めます。右ペインの配置関数解析にも候補比較 table を表示します。`candidateComparison.bestDirectCandidateId` は `weightedScore = maeScaleRatio + meanTranslateAfterScaleImageEuclidean` が最小の direct candidate を指します。

`anchorLandmark` は補助 debug として残しますが、`baseAnchorSource = inverse_known_transform` の場合は knownTransform と一致して当然です。そのため、anchor 由来の translate error は direct model の主評価には使いません。

Placement Function Analysis（配置関数解析）では、transform error（既知変換との差分）だけでなく、selected sample に対する roundtrip validation（再レンダー検証）も行います。roundtrip validation では、candidate が推定した `scaleRatio` / `translateAfterScaleImageX` / `translateAfterScaleImageY` で理想 OBJ 顔を再レンダーし、MediaPipe に再入力します。目的は、再入力で得た `predictedMatrix` / `predictedMatrixFeatures` が、元 sample の `facialTransformationMatrix` / `matrixFeatures` とどれくらい一致するかを確認することです。

roundtrip validation の初期 candidate は `candidateComparison.bestDirectCandidateId` があればそれを使い、なければ `center_derived_linear_v1` に fallback します。右ペインでは selected sample のみを対象に実行し、全サンプル一括 validation は扱いません。結果 summary には estimated transform、matrix feature error、returnedPose error、可能な場合の 2D landmark diff を表示します。

selected sample に対する roundtrip candidate comparison（再レンダー候補比較）では、`center_derived_linear_v1` と direct candidates を同じ sample の `matrixFeatures` からそれぞれ `estimatedTransform` に変換し、同じ render / MediaPipe detect 経路へ順番に通します。目的は `knownTransform` の数値一致だけを見ることではなく、再レンダー後に得られる `predictedMatrixFeatures` が元 sample の `matrixFeatures` にどれだけ近いかを比較することです。主な比較指標は `tx` / `ty` / `tz`、`txOverNegTz` / `tyOverNegTz` / `invNegTz`、returnedPose の yaw / pitch / roll、可能な場合の 478点 landmark diff です。

Placement Function Analysis（配置関数解析）では、selected sample の roundtrip candidate comparison に加えて、conditionKey 単位の batch roundtrip comparison（条件単位まとめ再レンダー比較）を行います。raw sample は repeat を含むため、そのまま全件を評価対象にしません。usable samples を `conditionKey` で group 化し、condition mean `matrixFeatures` を使って 1 condition につき 1 roundtrip input を作ります。これにより、`repeatCount=2` の同一条件を過重評価せず、candidate fitting の `condition_mean` と同じ粒度で roundtrip matrix 再現性を評価できます。

評価対象 candidate は `center_derived_linear_v1` と direct candidates です。主評価は `knownTransform` の数値一致ではなく、candidate が推定した transform で再レンダーした後に得られる `predictedMatrixFeatures` が元 condition の `matrixFeatures` にどれだけ近いかです。主な summary は candidate ごとの `matrixNormalizedScore` / `roundtripScore` の mean / p95 / max、win count、worst conditions です。

全 condition x 全 candidate の render / MediaPipe detect は重くなるため、condition batch roundtrip comparison は progress / cancel を持つ debug-only batch として扱います。`predictedLandmarks478` 配列は全 condition 分保持せず JSON export にも含めません。保存するのは summary、numeric condition results、worst conditions のみで、preview 用には最後に処理した condition の best candidate の predicted 478 だけを state に保持します。

Placement Function Analysis（配置関数解析）では、既存の `direct_quadratic_normalized_v1` だけでは二次式全般を検討したとは扱いません。Quadratic Candidate Expansion（二次式候補拡張）として、二次項の入れ方を変えた direct quadratic candidates、標準化した quadratic candidates、ridge 正則化付き quadratic candidates、center-derived quadratic candidates を追加比較します。

目的は、1本の一次関数で崩れる条件を二次式で吸収できるか、または二次式でも端条件に系統的な崩れが残るため piecewise linear（分割一次関数）へ進むべきかを判断することです。評価は transform error だけではなく、conditionKey batch roundtrip comparison による `predictedMatrixFeatures` の再現性を主評価にします。mean だけでなく p95 / max / worst conditions を重視します。

condition batch roundtrip comparison では candidate set を選択できます。`core` は既存5候補のみ、`quadratic_expanded` は既存5候補と expanded candidates、`quadratic_only` は expanded candidates のみを評価します。候補数が増えると render / MediaPipe detect 回数も増えるため、初期値は `core` のままにします。batch 完了後は `quadraticInterpretationSummary` に best mean / p95 / max candidate と、piecewise linear を次に試すべきかの仮判断理由を保存します。

Piecewise Linear Candidate Expansion（区分線形候補拡張）では、Quadratic Candidate Expansion の結果を受けて、単一の一次関数や単一の二次式では吸収しきれない scale edge / vertical position edge の崩れを、`matrixFeatures` の範囲分割で吸収できるかを検証します。piecewise candidate は `knownTransform.scaleRatio` や `knownPlacement.centerImageX/Y` を runtime gate として使いません。gate には MediaPipe matrix から得られる `invNegTz` / `tyOverNegTz` を使い、各 segment の fitting は raw repeat sample ではなく `condition_mean` fitting samples だけで行います。

追加する piecewise candidates は、`direct_piecewise_inv3_linear_normalized_v1`、`direct_piecewise_inv5_linear_normalized_v1`、`direct_piecewise_ty3_linear_normalized_v1`、`direct_piecewise_inv3_ty3_linear_normalized_v1`、`center_derived_piecewise_inv3_linear_normalized_v1`、`center_derived_piecewise_inv3_ty3_linear_normalized_v1` です。各 segment の最小 sample count は 12 とし、不足する segment は direct 系なら `direct_linear_normalized_v1`、center-derived 系なら `center_derived_linear_v1` に fallback します。candidate JSON には `piecewiseTransformCandidates`、`candidateComparison.piecewiseCandidates`、`bestPiecewiseCandidateId`、各 segment の threshold / sampleCount / usableForFit / metrics を保存します。

condition batch roundtrip comparison の candidate set には、`piecewise_linear_expanded`、`piecewise_linear_only`、`all_expanded` を追加します。`piecewise_linear_expanded` は core + piecewise candidates、`piecewise_linear_only` は piecewise candidates のみ、`all_expanded` は core + quadratic expanded + piecewise candidates を評価します。candidate set に応じて `totalRenderCount` は実際の candidate 数から計算します。

batch 完了後は `piecewiseInterpretationSummary` と `piecewiseSegmentBreakdown` を表示・export します。判断では mean だけでなく p95 / max / worst conditions / segment breakdown を重視します。piecewise で p95 / max が明確に改善する場合は piecewise linear を本命候補に近づけ、改善が mean に留まる場合や segment imbalance / fallback 多用がある場合は quadratic / ridge quadratic / direct linear と比較して慎重に判断します。`predictedLandmarks478` 配列は引き続き全 condition 分保持せず、JSON export にも含めません。

配置関数解析プレビューでは、known target 478 と predicted roundtrip 478 を重ねて比較します。roundtrip candidate comparison 後は、best candidate の predicted 478 だけを preview state に保持し、追加 toggle で表示できます。各 candidate の predicted 478 配列は JSON export には含めません。`base478` / `base bounds` は変換前478点の補助 debug であり、roundtrip validation / roundtrip candidate comparison の主対象ではないため、toggle は残しますがデフォルト非表示にします。

使える sample 数が足りない、特徴量が単一値で回帰が特異になる、matrix features が不正な場合は candidate を作らず、右ペインに理由を表示します。

candidate metrics は `Target Center Image`、`Scale Ratio`、`Derived Translate After Scale Image` に分けて表示します。candidate JSON の `schemaVersion` は `matrix_to_known_image_transform_function_candidate_v1`、`targetCoordinateSpace` は `image_normalized_coordinate` です。candidate JSON には optional field として `trainingDataSummary` を含め、学習に使った `scaleRatio` の範囲、値、scale 別 sample 数を記録します。

CSV export には既存の image coordinate 系の列を維持したうえで、`repeatIndex`、`repeatCount`、`conditionKey`、`conditionNegTzMean` / `StdDev` / `Range`、`conditionInvNegTzMean` / `StdDev` / `Range`、`scalePositionCorrCenterYNegTz`、`scalePositionCorrCenterXNegTz` を含めます。さらに anchor 検証用として `anchorLandmarkIndex`、target/base anchor の image / work coordinate、`baseAnchorSource`、anchor 由来の `translateAfterScale` と knownTransform の差分を出します。direct model については列の肥大化を避けるため、best direct candidate の推定値と誤差のみを追加します。

この解析では `current478`、`current478 bounds`、current face、live video、live overlay を一切使いません。`current478 bounds` は teacher data や reference placement として扱いません。通常の live overlay、`alignedRenderedIdeal478`、live alignment、stale / fallback / token mismatch guards、render pose debug、mesh warp、production Shape Warp へは接続しません。

## 目的

`tools/ideal-obj-render-warp-lab` は、FaceBuilder + Blender sculpt で作成した `テスト.obj` のような OBJ 3D 形状ファイルを、BAE AR の neutral ideal head（無表情基準の理想頭部）候補として使えるか検証する debug / research lab です。

日本語名は「理想OBJレンダー・ワープ検証ラボ」とします。より目的を明確にする別名として `tools/ideal-clay-head-render-warp-lab` / 「理想粘土頭部レンダー・ワープ検証ラボ」も候補ですが、この docs では `tools/ideal-obj-render-warp-lab` を仮称として扱います。

このラボは production 用 authoring tool ではありません。Engine Runtime、Beauty Studio、IdealFace Authoring Tool、Runtime renderer、production asset export へ直接接続しません。まずは、OBJ を current pose で render した画像から MediaPipe returned 478 landmarks を取得できるか、その 478点を既存の mesh warp 検証ラインへ接続できるかを確認する場です。

## 背景

`tools/ideal-reference-mesh-warp-lab` では、理想モデル動画を MediaPipe に通して `rawIdealReferenceFrames` を作り、live current frame に近い top1 reference を選び、`candidateAlignedIdealLandmarks` を作っていました。

しかし、同じ動画を model video と live video の両方に使っても、top1 reference matching は完全に同じ時刻のフレームを選ばず、pose が数度ズレることが分かりました。そのため、reference frame matching で選んだ 2D landmarks をそのまま target にする方式は、自然美顔の本線として危険です。

一方で、`ideal-reference-mesh-warp-lab` の以下の成果は有用です。

- live video / current frame MediaPipe analysis
- `current478` / pose / expression
- visible / safe current landmarks
- dynamic nearFaceGrid
- backgroundGrid
- screenEdgeAnchors
- current source vertices
- ideal target vertices
- triangle indices
- WebGL mesh warp preview
- mesh pair preview
- image-normalized coordinate
- aspect-corrected image coordinate
- `displayedContentRect` を使った overlay 変換

`tools/ideal-obj-render-warp-lab` では、これらの座標系・メッシュ生成・WebGL mesh warp を踏襲し、理想側 landmarks の供給元だけを差し替えます。

## MediaPipe mode comparison

このラボには、同じ MP4 フレームを MediaPipe FaceLandmarker の `detect()` と
`detectForVideo()` の両方に通し、pose / 478 landmarks / 実行時間の差を比較する
`モード比較` 実験を追加します。

実運用では current face（現在顔）は動画またはカメラ入力から取得するため
`detectForVideo()` になりやすく、rendered ideal face（レンダー理想顔）は OBJ を
canvas にレンダーした静止画像として扱うため `detect()` になりやすいです。
そのため、両モードの pose / 478 landmarks に系統差があるかを確認します。

比較では、以前の 0.41秒ズレ問題を避けるため、MP4 の現在フレームを一度だけ
固定 canvas に `drawImage()` し、その同じ canvas frame を `detect(canvas)` と
`detectForVideo(canvas, timestampMs)` の両方へ渡します。`detectForVideo(video, timestampMs)`
のように video element を直接渡す比較は行いません。

実験条件:

- `imageLandmarker`: `runningMode: "IMAGE"` / `detect(canvas)` / `delegate: "GPU"`
- `videoLandmarker`: `runningMode: "VIDEO"` / `detectForVideo(canvas, timestampMs)` / `delegate: "GPU"`
- IMAGE mode と VIDEO mode は別インスタンスにし、runningMode の切り替えは行わない
- frame driver は `requestVideoFrameCallback（動画フレーム単位コールバック）`
- timestamp は `metadata.mediaTime * 1000`
- timestamp が同一または巻き戻った frame は skip する
- `requestVideoFrameCallback()` が使えないブラウザでは実験不可として表示し、fallback しない
- 最大 10000 frames まで比較する
- 現時点の `モード比較` では、`frameIndex % 3`、`sampleStep`、`frameStride`、
  `targetFps`、`minFrameIntervalMs`、`presentedFramesDelta` による意図的な間引きは行わない
- 次回 `requestVideoFrameCallback()` 登録は、`drawImage()`、`detect()`、
  `detectForVideo()`、frame result 作成、debug counter 更新、必要な UI 反映の後に行う。
  そのため、callback 内処理が重い場合は結果的に動画フレームを取り逃がす可能性がある

出力:

- UI summary: 右ペイン Debug（デバッグ）の `モード比較` タブに表示する。
  左ペインは `MP4読込`、短い説明、`モード比較`、`停止 / cancel` の操作中心にする。
- `モード比較` タブ: source、run status、run options、detection summary、timing summary、
  pose diff（姿勢差分）、landmark diff（ランドマーク差分）、frame consistency、
  debug counters、debug options、JSON / CSV download を表示する。
- JSON download: raw per-frame result と summary を含める。summary には
  `worstYawDiffFrame`、`worstPitchDiffFrame`、`worstRollDiffFrame`、
  `worstPoseMagnitudeDiffFrame`、`worstMean2dDistanceFrame`、
  `worstMax2dDistanceFrame`、`firstMismatchFrame`、`latestFrame` を含める。
- CSV download: 主要列のみの per-frame summary。`callbackWallDeltaMs`、
  `mediaTimeDeltaMs`、`processingMeasuredMs`、`unmeasuredOverheadEstimateMs` も含める。
- preview export（プレビュー書き出し）: 全 frames の画像は保持しない。`detect()` と
  `detectForVideo()` に渡した同一 canvas frame から、latest frame、worst pose diff frame、
  worst landmark diff frame、first mismatch frame の preview snapshot だけを保持して
  PNG download できるようにする。保持上限は最大20枚、現時点の実装では最大4枚。
  `latest` は完了時に作成し、実行中の every-frame `toDataURL()` は行わない。

計測範囲:

- `totalFrameProcessingMs` / `processingMeasuredMs` は、canvas context 取得、
  `drawImage()`、`detect()`、`detectForVideo()` を含む。
- `totalFrameProcessingMs` / `processingMeasuredMs` は、frame result 構築、
  raw frames 配列への追加、debug counter 集計、UI state 更新、summary 再描画、
  preview snapshot の `toDataURL()` を含まない。
- `unmeasuredOverheadEstimateMs` は `callbackWallDeltaMs - processingMeasuredMs` として、
  callback 間隔に対して計測外処理や待ち時間がどれくらい見えているかを切り分ける参考値とする。

デバッグカウンタ:

- `rvfcCallbackCount`: `requestVideoFrameCallback()` callback が呼ばれた回数
- `processedFrameCount`: 実際に比較処理した frame 数
- `intentionalSkipCount`: 意図的な間引き skip 数。現時点では意図的間引きがないため 0 の想定
- `timestampSkipCount`: timestamp が同一または巻き戻ったため skip した数
- `busySkipCount`: 処理中だったため skip した数
- `missingMediaTimeSkipCount`: `metadata.mediaTime` が取得できず skip した数
- `presentedFramesDeltaSummary`: `presentedFramesDelta` の分布
- `callbackWallDeltaMs`: 前回 callback から今回 callback までの wall-clock 時間分布
- `mediaTimeDeltaMs`: 前回 `metadata.mediaTime` から今回までの動画時間差分布
- `processingMeasuredMs`: 現在計測している処理時間分布
- `unmeasuredOverheadEstimateMs`: 計測外 overhead の推定分布
- `nextCallbackRegistrationTiming`: 次回 callback 登録タイミング。現時点では `afterProcessing`

デバッグオプション:

- preview snapshot（プレビュー画像保存）を無効化できる
- UI 反映を N frames に1回へ間引ける
- summary 再描画を N frames に1回へ間引ける
- download 用 raw per-frame result は維持し、UI 反映だけを間引く

TODO:

- preview overlay（重ね表示プレビュー）は未実装。現時点では raw frame preview（元フレーム画像）
  のみを保存する。将来、IMAGE mode / VIDEO mode の landmarks、pose diff、frameIndex /
  mediaTimeSec を重ねる。

## 基本方針

最重要方針は、座標系を新設しないことです。

`ideal-reference-mesh-warp-lab` と同じ coordinate lifecycle を使います。

current478:

```text
live video
  -> MediaPipe
  -> current478
  -> image-normalized coordinate
```

renderedIdeal478:

```text
OBJ
  -> current yaw / pitch / roll で render
  -> rendered ideal image
  -> MediaPipe
  -> renderedIdeal478
  -> image-normalized coordinate
```

## p,P dataset と renderAppearanceProfile

現在のラボの主な役割は、OBJ を複数の `renderPose p` でレンダーし、その画像を
MediaPipe に通して `P = MediaPipe returnedPose` を取得し、p,P dataset JSON として
ダウンロードすることです。統計要約、関数推定、model tree / regression / KNN 比較、
`poseMappingProfile` 候補作成は Google Colab / Python 側で行います。

MediaPipe が見ているのは OBJ の 3D 形状そのものではなく、レンダリングされた 2D 画像です。
そのため、p,P mapping は光、影、背景色、顔色、FOV、scale / crop、canvas 解像度に依存します。
ラボでは `renderAppearanceProfile` を選択し、同じ pose sampling に対して見た目条件だけを
変えた dataset を取り直せるようにします。

dataset JSON には、選択した profile id だけでなく、実際に適用した
`backgroundColor`、`skinColor`、`material`、`lighting`、`camera`、`renderResolution` を
`renderAppearance.applied` として保存します。Canvas2D renderer でまだ物理的に実装していない
specular、cast shadow、perspective projection、FOV は `implementation` notes に未実装として
記録し、解析側で適用済み条件と誤解しないようにします。

p,P dataset 解析用 Python は
`tools/ideal-obj-render-warp-lab/analysis/obj_pose_mapping_colab_analysis.py` に置きます。
Colab では `# %%` 区切りをセルとして実行できます。入力は `obj_pose_mapping_dataset_v3`
WebGL JSON を想定します。旧 v1 / v2 JSON は読み取り対象には残しますが、WebGL runtime 用
`pose_mapping_profile_candidate` は出力しません。

解析では raw dataset を `raw_df` として保持し、hard filter と residual outlier detection
後の dataset を `filtered_df`、除外サンプルを `excluded_df` として理由付きで出力します。
hard filter は MediaPipe 検出失敗、p / P の NaN / Infinity、returnedPose の極端な範囲外、
landmarks が含まれる場合の 478 点欠損、landmark bounds / x/y/z 分布異常を除外対象にします。
端姿勢は実運用上の学習対象なので、yaw端 / pitch端 / roll端という理由だけでは除外しません。

モデル比較は raw / filtered の両方で実行し、Linear Regression、Polynomial degree 2 + Ridge、
KNN、Decision Tree + per-leaf Polynomial degree 2 + Ridge、高次 Polynomial degree 3-5 + RidgeCV、
GMM soft gate + Polynomial degree 2 expert を比較します。採用 candidate は pose p95、pose MAX、
continuityJumpMax、軸別破綻、端姿勢、TypeScript 移植性を見て選び、単純な MAE だけでは選びません。
出力は `obj_pose_mapping_analysis_summary.md`、`obj_pose_mapping_model_comparison.csv`、
`obj_pose_mapping_posewise_evaluation.csv`、`obj_pose_mapping_excluded_samples.csv`、
`obj_pose_mapping_filtered_samples.csv`、`pose_mapping_profile_candidate.json` です。

## poseMappingProfile runtime 検証

ラボでは Colab / Python 側で作成した `pose_mapping_profile_candidate.json` を
`poseMappingProfile（姿勢対応プロファイル）` として JSON 読み込みできます。
現在対応する `schemaVersion` は `pose_mapping_profile_candidate_v1` / `pose_mapping_profile_candidate_v2`、`modelType` は
`decision_tree_gate_polynomial_degree2_ridge` のみです。未対応 `modelType` は UI 上の error として
表示し、アプリ全体は落としません。

検証フローは以下です。

```text
P_camera（現在顔の姿勢）
  -> poseMappingProfile.evaluate()
  -> p（OBJ に与える描画姿勢）
  -> OBJ render
  -> MediaPipe detect() / IMAGE mode（静止画モード）
  -> P_confirm / renderedIdeal478
```

### current face missing 時の runtime state

current face / current478 / `P_camera` が取得できないフレームでは、pose mapping runtime は
`poseMappingProfile.evaluate()`、WebGL OBJ render、rendered ideal の `detect()` を実行しません。
この場合は `poseMappingStatus` を `skipped_no_current_face` または `skipped_invalid_pose` にし、
`poseMappingSkippedReason` に `no_current_face` / `invalid_pose` を記録します。
`fallbackPoseUsed` は常に `false` とし、`yaw: 0, pitch: 0, roll: 0` の fallback pose で
frontal face をレンダーしません。

skip 中は、最後に成功した `p` / `P_confirm` / `renderedIdeal478` / preview を `lastGood` として保持します。
新しい `p`、`P_confirm`、`renderedIdeal478` へ更新せず、UI では stale / no current face として表示します。
current face が復帰したフレームでは最新の `P_camera` から通常の
`P_camera -> p -> OBJ render -> detect -> P_confirm` 経路を再開し、
`poseMappingStatus` を `completed` に戻します。

debug JSON には以下を含めます。

- `currentFaceStatus`: `detected` / `missing` / `invalid`
- `poseMappingStatus`: `ready` / `skipped_no_current_face` / `skipped_invalid_pose` / `running` / `completed` / `error`
- `poseMappingSkippedReason`: `none` / `no_current_face` / `invalid_pose` / `profile_mismatch`
- `fallbackPoseUsed`
- `lastGood`: `hasLastGood`、`updatedAtMs`、`mediaTimeSec`、`ageMs`、`frameIndex`
- `loop`: `running`、`busy`、`lastFrameIndex`、`lastMediaTimeSec`
- `noFaceCounters`: `currentFaceMissingCount`、`poseMappingSkippedNoCurrentFaceCount`、`recoveredFromNoCurrentFaceCount`

runtime 検証では、MediaPipe `detect()` に渡す canvas と UI preview canvas を分離します。
`detect()` 用 canvas は画面表示サイズに追従させず、profile / dataset metadata のレンダー条件で固定します。
renderResolution の優先順は以下です。

1. `poseMappingProfile.datasetMetadata.renderAppearance.applied.renderResolution.width / height`
2. `poseMappingProfile.datasetMetadata.renderSettings.canvasWidth / canvasHeight`
3. fallback default `1179 x 1179`

`P_confirm` は、この detect 用 offscreen canvas に `p` で理想 OBJ をレンダーし、その画像を
MediaPipe `detect()` / IMAGE mode に渡して取得します。独立した `現姿勢理想478プレビュー` UI は
廃止し、`renderedIdeal478` は `current478` へ alignment して `alignedRenderedIdeal478` として
ライブ映像上の overlay に統合します。`renderedIdeal478` は detect canvas 基準の normalized landmark
として保持し、alignment 後の `alignedRenderedIdeal478` は live video image-normalized coordinate
として扱います。preview canvas に変換済みの座標だけを debug JSON に保存しません。

runtime 側で適用する renderAppearance は、profile metadata に存在する範囲で
`backgroundColor`、`skinColor`、`material.mode`、`material.diffuse`、`material.ambient`、
`lighting.mode`、`lighting.ambientIntensity`、`lighting.keyLightIntensity`、
`lighting.keyLightDirection`、`camera.scale`、`camera.verticalOffset`、`renderResolution` です。
Canvas2D renderer がまだ物理的に実装していない `material.specular`、`lighting.castShadow`、
`camera.projection`、`camera.fovDeg` は `notAppliedRenderAppearanceFields` に記録します。

現在顔の解析は `detectForVideo()` / VIDEO mode（動画モード）を使います。レンダー理想顔の再検出は、
OBJ を canvas にレンダーした静止画に対して `detect()` / IMAGE mode（静止画モード）を使います。
この使い分けは、現在顔入力とレンダー画像入力の実行条件を混同しないための固定ルールです。

左ペインは操作中心です。置くものは `OBJ読込`、`poseMappingProfile読込（関数読込）`、`MP4読込`、
必要な実行 / 停止 / cancel 操作、既存の `モード比較` 操作です。`poseMappingProfile` の詳細、
`P_camera / p / P_confirm`、`pose diff`、`renderedIdeal478` 詳細、専用 debug download は左ペインに置きません。

右ペイン Debug には `Pose Mapping（姿勢対応）` タブを置き、以下を集約します。

- Profile info: loaded、filename、schemaVersion、modelType、modelName、datasetKind、inputFeatures、target、errorSummary、outlierFilterSummary、poseRangeAfter
- Runtime input: `P_camera`、範囲制限後の `P_camera`、clampApplied、quality gate
- Profile output: `pFromProfile（プロファイル出力姿勢）`、selectedLeaf、used expert、usedFallback、evaluator warnings
- Render pose: `pForWebglRender（WebGL描画用姿勢）`、`poseSignConvention（姿勢符号規約）`、`renderPoseConversion（描画姿勢変換）`
- Render confirm: detectCanvasWidth / detectCanvasHeight、previewCanvasWidth / previewCanvasHeight、renderResolutionSource、detectCanvasMatchesProfile、profileCanvasWidth / profileCanvasHeight、適用 renderAppearance、notAppliedRenderAppearanceFields、`P_confirm`、`P_confirm - P_camera` の pose diff、renderedIdeal478 status、profileEvaluateMs、renderMs、detectMs、totalMs
- Alignment: status、mode、rotationApplied、anchorCount、currentCenter、idealCenter、scale、videoAspectRatio、renderAspectRatio、座標系別 bounds、displayedContentRect、excludedReasonCounts、displacementSummary、alignedRenderedIdeal478 count、mesh source / target count
- Download: `pose_mapping_runtime_debug_v1` JSON download

`Pose Mapping（姿勢対応）` タブには専用の
`Download Pose Mapping Debug（姿勢対応デバッグをダウンロード）` を置きます。この export は既存の
`モード比較` タブの JSON / CSV download とは別の `pose_mapping_runtime_debug_v1` JSON です。
`renderSettings` には detectCanvasWidth / detectCanvasHeight、previewCanvasWidth / previewCanvasHeight、
renderResolutionSource、detectCanvasMatchesProfile、profileCanvasWidth / profileCanvasHeight を含めます。
`renderAppearanceApplied` には runtime 側で適用したレンダー見た目条件と
notAppliedRenderAppearanceFields を含めます。最新フレームの `current478`、`renderedIdeal478`、
`alignedRenderedIdeal478` は必要最小限の確認用として含めてよいですが、毎フレーム履歴として大量に
保存しません。

Live タブの旧 `現姿勢OBJ` 欄と独立した `現姿勢理想478プレビュー` は使いません。
`poseMappingProfile` で得た `p` により理想OBJをレンダーし、そのレンダー画像から得た
`renderedIdeal478` を `current478` に alignment したうえで、ライブ映像上に以下を overlay 表示します。

- `current478`
- `alignedRenderedIdeal478`
- `current478 -> alignedRenderedIdeal478` の対応線
- 除外 / 固定 landmark
- mesh source / mesh target
- alignment anchors

Live overlay の描画は必ず `displayedContentRect` を使い、動画の letterbox / pillarbox でズレないようにします。
未位置合わせの `renderedIdeal478` をライブ映像上に直接表示しません。`renderedIdeal478` が missing / invalid
の場合は `alignedRenderedIdeal478`、対応線、mesh target を描画せず、fallback 正面顔も表示しません。
この段階ではまだ WebGL mesh warp（変形加工）は行いません。

overlay controls は中央ペイン上部の共通領域には置かず、対象 coordinate tab（座標系タブ）内に置きます。
`current478` / `alignedRenderedIdeal478` / 対応線 / `meshSourceVertices` / `meshTargetVertices` は
`ライブ座標（live image-normalized座標）` で確認し、実際の video element と overlay canvas 上の表示ズレは
`表示重ね描き（displayedContentRect pixel座標）` で確認します。実体がまだない no-op checkbox は残さず、
未対応のものは disabled または非表示にします。現時点では triangle mesh と grid / anchors は未生成なので
disabled とします。

初期 profile:

- `current`: 既存レンダー条件の baseline
- `soft_light_no_shadow`: 影なし・柔らかい光
- `camera_soft_light`: カメラ正面固定ライト
- `high_contrast_background`: 背景コントラスト確認
- `yaw_edge_friendly`: 横向き輪郭補助
- `stable_crop_fov`: 安定した顔サイズ・視野角

alignment は landmark correspondence ではなく、MediaPipe placement ベースにします。理想顔の向きは
`P_camera -> poseMappingProfile -> pFromProfile -> pForWebglRender -> WebGL render -> MediaPipe detect -> P_confirm` で合わせるため、
alignment では回転を使いません。合わせるのは位置と大きさだけです。

placement にはまず `facialTransformationMatrix` を debug-only で検証します。matrix translation が
live video image-normalized coordinate の center として安全に扱えない場合は、alignment を
`skipped_invalid_placement` として skip し、理想点 overlay を出しません。旧 `current478` /
`renderedIdeal478` の対応点群から center / scale を推定する方式へ無言 fallback しません。

alignment work の座標確認では、aspect-corrected image coordinate を使います。

```text
x' = x * videoAspectRatio
y' = y
```

`current478` と `renderedIdeal478` は元の画像が異なるため、alignment 計算用の aspect-corrected coordinate
を別々に作ります。

```text
current478:
  live video image-normalized coordinate
  -> videoAspectRatio で aspect work coordinate へ変換

renderedIdeal478:
  render/detect canvas image-normalized coordinate
  -> renderAspectRatio で aspect work coordinate へ変換

alignedIdealWork:
  currentWork の座標系へ center + uniform scale で alignment した一時座標

alignedRenderedIdeal478:
  alignedIdealWork を videoAspectRatio で割り戻した live video image-normalized coordinate
```

bounds、center、uniform scale、distance、large displacement は aspect-corrected image coordinate で計算します。
ただし、alignment 計算用の aspect-corrected coordinate を overlay に直接使いません。
alignment 後の `alignedRenderedIdeal478` は必ず live video image-normalized coordinate として保持し、
live overlay / mesh target 入力へ戻します。

overlay は以下の変換で行います。

```text
image-normalized coordinate
  -> displayedContentRect pixel
```

pixel coordinate、OBJ vertex coordinate、WebGL clip space は、MediaPipe returned landmarks 取得後の alignment / mesh pair 処理には混ぜません。render image の pixel coordinate は MediaPipe 入力用に閉じ込めます。MediaPipe から戻ってきた `renderedIdeal478` は image-normalized coordinate として扱い、ライブ映像上には alignment 後の `alignedRenderedIdeal478` を表示します。

## 既存ラボから踏襲するもの

`ideal-reference-mesh-warp-lab` から以下を踏襲します。

- live video input
- current frame MediaPipe analysis
- current478 overlay
- pose / expression / quality debug
- visible / safe current landmarks
- iris landmarks 468..477 の除外または current 固定
- `faceMedianNearestDistance`
- dynamic nearFaceGrid
- backgroundGrid
- screenEdgeAnchors
- current source vertices
- ideal target vertices
- triangle indices
- mesh pair preview
- WebGL mesh warp preview
- summary / raw debug
- `displayedContentRect` を使った overlay 変換

## 差し替える核

旧方式:

```text
model video
  -> MediaPipe scan
  -> rawIdealReferenceFrames
  -> accepted / excluded frame 管理
  -> top1 reference matching
  -> candidateAlignedIdealLandmarks
```

新方式:

```text
OBJ
  -> current yaw / pitch / roll で render
  -> rendered ideal image
  -> MediaPipe analysis
  -> renderedIdeal478
  -> alignedRenderedIdeal478
```

top1 reference matching は使いません。current pose で render した OBJ を理想側の 1 フレームとして扱い、MediaPipe が返した `renderedIdeal478` を `rawIdealReferenceFrame` 相当の入力にします。

## 処理フロー

想定フローは以下です。

```text
1. live video / camera
   -> MediaPipe
   -> current478
   -> yaw / pitch / roll
   -> expression
   -> quality

2. current478 から visible / safe landmarks を選ぶ

3. visible / safe landmarks + dynamic nearFaceGrid + backgroundGrid + screenEdgeAnchors で
   current source mesh を作る

4. OBJ file を読み込む

5. OBJ を current yaw / pitch / roll で render する

6. rendered ideal image を MediaPipe に通す
   -> renderedIdeal478

7. renderedIdeal478 を current478 へ alignment する
   -> alignedRenderedIdeal478

8. current source mesh と同じ頂点構成で ideal target mesh を作る

9. triangle indices を作る

10. WebGL mesh warp で加工する

11. warped preview を表示する
```

## 表情部分の初期ルール

`テスト.obj` は neutral であり、カメラ映像と同じ表情を持ちません。そのため、初期ラボでは expression-sensitive landmarks は current をそのまま使います。

基本ルール:

```text
if landmark is expressionSensitive:
  target = current
else:
  target = lerp(current, alignedRenderedIdeal, usageWeight)
```

意味:

```text
口・目・虹彩など、表情で大きく動く点はカメラ映像を優先する。
顔の土台・輪郭・頬・鼻・額など、表情影響が比較的小さい点だけ理想OBJ方向へ寄せる。
```

初期の current 固定候補:

- mouth
- lips
- inner mouth
- left_eye
- right_eye
- eyelids
- iris 468..477
- jawOpen で大きく動く下口周辺

chin や jaw side は判断が難しいため、初期は弱く寄せるか、current 固定寄りで安全側に倒します。

これは `expressionFollow v1` の正式実装ではなく、Lab 内の debug rule として扱います。`expressionFollow v1` の schema、Engine 実装、Authoring Tool export へは入れません。

## Target vertices 生成ルール

ideal target vertices は、`ideal-reference-mesh-warp-lab` と同じく、source vertices と同じ頂点数・同じ順番で作ります。

```text
sourceVertices[i] と targetVertices[i] は必ず対応する
```

target rule:

```text
faceLandmark:
  if excluded or expressionSensitive or iris:
    target = current
  else:
    target = alignedRenderedIdeal478[index]

nearFaceGrid:
  target = source
  または後続検証で弱く face boundary に追従

backgroundGrid:
  target = source

screenEdgeAnchor:
  target = source
```

初期版では nearFaceGrid / backgroundGrid / screenEdgeAnchor は source = target を基本にします。現時点の
Live overlay では landmark ベースの mesh source / target debug を先に表示し、triangle mesh と実 warp は
まだ接続しません。

## 最初の成功判定

最初に確認することは、OBJ を current yaw / pitch / roll で render した画像を MediaPipe が顔として検出できるかです。

確認項目:

- `renderDetectionSuccess`
- `returnedLandmarkCount`
- `alignedRenderedIdeal478` live overlay
- renderedIdeal pose
- current pose と renderedIdeal pose の差
- `alignedRenderedIdeal478` の bounds / center / scale
- live overlay で current と target が破綻していないか
- expressionSensitive landmarks が current 固定になっているか
- 口・目が無表情 OBJ 側へ引っ張られていないか
- WebGL mesh warp preview で顔全体が自然に少しだけ寄るか

## 後続の実装単位案

次段階の実装単位案は以下です。

PR:

```text
expressionSensitive current固定 rule を入れる
finalSourceVertices / finalTargetVertices を作る
triangle indices を作る
WebGL mesh warp preview へ接続
```

## Non-goals

このラボでは以下を行いません。

- Engine Runtime への OBJ render 実装
- Engine Runtime への MediaPipe re-detection 実装
- Beauty Studio への接続
- IdealFace Authoring Tool への接続
- Layer Mask Authoring Tool への接続
- production asset export
- `expressionFollow v1` の正式実装
- OBJ vertex coordinate と MediaPipe image-normalized coordinate の混在
- render image pixel coordinate を alignment / mesh pair 処理へ持ち込むこと
- Runtime / Studio / Authoring Tool 本線への接続

## Pose Mapping detect performance debug

`Pose Mapping（姿勢対応）` runtime 検証に `Detect Performance（検出速度）` セクションを追加しました。

目的は、`MediaPipe mode comparison（モード比較）` では軽く見えていた `detect()` が、`Pose Mapping（姿勢対応）` 経路では重く見える理由を切り分けることです。方式を変える検証ではなく、計測範囲を分離して原因候補を確認します。

計測ケース:

- `detect only / rendered ideal`: 現在の profile 条件で render した detect canvas に対して、MediaPipe `detect()` 呼び出しだけを測る
- `render only`: 現在の `p` で detect 用 offscreen canvas に OBJ render する時間だけを測る
- `render + detect`: OBJ render と `detect()` を連続実行し、`renderMs` / `detectMs` / `totalMs` を分けて測る
- `preview generation / overlay`: detect 用 canvas から debug snapshot を生成し、`renderedIdeal478` overlay、`toDataURL()` を測る
- `resolution sweep`: `1179 / 1024 / 768 / 640 / 512` の縮小 canvas に対する `detect()` を比較する
- `control MP4 canvas detect`: 可能な場合、MP4 current frame を canvas に描画し、同じ IMAGE mode landmarker で `detect()` だけを測る

計測範囲:

- `detect only` には debug snapshot 生成、overlay、`toDataURL()`、DOM update、state update を混ぜない
- `render only` には `detect()`、debug snapshot 生成、overlay、`toDataURL()`、DOM update、state update を混ぜない
- `render + detect` は OBJ render と `detect()` を測るが、debug snapshot 生成と UI update は含めない
- `preview generation / overlay` は、detect 用 canvas から debug snapshot 用画像を作る処理、overlay、`toDataURL()` を detectMs とは別に測る
- UI state update は原則として計測外とし、benchmark 完了後にまとめて state へ反映する

FaceLandmarker は benchmark 中に毎回作り直さず、既存の IMAGE mode（静止画モード）用 `renderedIdealFaceLandmarker` を再利用します。debug summary / JSON には `runningMode`、requested delegate、instance reused、create count を出します。

`resolution sweep（解像度比較）` は速度確認用です。通常の `P_confirm` 検証は profile 条件の detect canvas、たとえば `1179 x 1179` を維持し、runtime 本線の detect canvas を低解像度へ変更しません。

`Download Detect Performance JSON（検出速度JSONダウンロード）` は `pose_mapping_detect_performance_debug_v1` として、source、profile、runtime pose、landmarker、render settings、benchmark options、case summaries、per-run timing samples を出力します。各 sample には時間と検出結果だけを保存し、478点配列は保存しません。

`Download Detect Performance CSV（検出速度CSVダウンロード）` は 1 行 1 sample で、`caseId`、`label`、`sourceKind`、canvas size、`runIndex`、`phase`、`renderMs`、`detectMs`、`previewMs`、`overlayMs`、`toDataUrlMs`、`totalMs`、`detected`、`landmarkCount`、`errorMessage` を出力します。

## Render -> Detect Handoff debug

`Detect Performance（検出速度）` の結果、`detect only / rendered ideal` は軽い一方、`render + detect` では render 直後の `detectMs` が大きくなる可能性が見えました。

そのため、`Pose Mapping（姿勢対応）` Debug タブの `Detect Performance（検出速度）` セクション内に、`Render -> Detect Handoff（レンダーから検出への受け渡し）` benchmark を追加しました。

目的は、Canvas2D OBJ render 直後に MediaPipe `detect()` を呼ぶことで、描画確定、GPU同期、ピクセル転送、readback 系の待ち時間がどこに乗っているかを切り分けることです。通常の poseMapping runtime は profile 条件の detect canvas を維持し、`render -> detect` 経路を勝手に非同期化しません。

比較する handoff strategy:

- `immediate`: OBJ render 後、同じ tick で即 `detect()`
- `requestAnimationFrame_1`: OBJ render 後、`requestAnimationFrame` を1回待ってから `detect()`
- `requestAnimationFrame_2`: OBJ render 後、`requestAnimationFrame` を2回待ってから `detect()`
- `setTimeout_0`: OBJ render 後、`setTimeout(0)` を待ってから `detect()`
- `createImageBitmap`: OBJ render 後、`createImageBitmap(detectCanvas)` を作成し、可能なら `detect(imageBitmap)`
- `copy_to_second_canvas`: OBJ render 後、別 canvas へ `drawImage()` でコピーしてから `detect(secondCanvas)`
- `double_buffer_previous_frame`: 2つの offscreen canvas を交互に使い、前回 render 済み canvas を `detect()` しながら次 buffer に render
- `explicit_readback`: OBJ render 後、`getImageData(0, 0, 1, 1)` で小範囲 readback を測ってから `detect()`

計測範囲:

- 各 case は `renderMs`、`waitMs`、`bitmapCreateMs`、`copyMs`、`readbackMs`、`detectMs`、`totalMs` を分けて保存する
- preview 生成、overlay、`toDataURL()`、毎 run ごとの DOM update は含めない
- FaceLandmarker は既存の IMAGE mode 用 `renderedIdealFaceLandmarker` を再利用し、benchmark 中に毎回作り直さない
- GPU delegate 指定は既存の `delegate: "GPU"` を維持する
- raw 478 landmarks は sample ごとに保存せず、timing、detected、landmarkCount、errorMessage を保存する

`Download Handoff JSON（受け渡しJSONダウンロード）` は `pose_mapping_render_detect_handoff_debug_v1` として、source、profile、runtime pose、landmarker、render settings、benchmark options、case summaries、per-run timing samples、簡易 conclusion hints を出力します。

`Download Handoff CSV（受け渡しCSVダウンロード）` は 1 行 1 sample で、`caseId`、`label`、`handoffStrategy`、canvas size、`runIndex`、`phase`、`renderMs`、`waitMs`、`bitmapCreateMs`、`copyMs`、`readbackMs`、`detectMs`、`totalMs`、`detected`、`landmarkCount`、`errorMessage` を出力します。

この検証は速度確認用であり、poseMappingProfile evaluator、p,P dataset 生成、mode comparison には影響させません。実運用への適用判断は handoff benchmark の結果を見てから行います。

## WebGL OBJ Render Benchmark

## WebGL OBJ renderer 本線化

通常 runtime の `P_camera -> p -> OBJ render -> MediaPipe detect() -> P_confirm / renderedIdeal478` 経路は、
Canvas2D OBJ renderer ではなく WebGL OBJ renderer を使います。MediaPipe `detect()` には WebGL canvas を
そのまま渡し、`renderedIdeal478` は従来通り detect canvas 基準の normalized landmark として保持します。
preview 表示時だけ `displayedContentRect` に合わせて overlay 座標へ変換します。

p,P dataset 生成も WebGL renderer に固定します。出力 dataset は `obj_pose_mapping_dataset_v3` とし、
最低限 `renderBackend: "webgl"`、`renderer.version`、`renderer.rendererSignature`、
`renderer.projectionMode`、`renderer.renderResolution`、`renderAppearance.applied.renderResolution` を保存します。Canvas2D renderer は
legacy baseline / debug 比較としてのみ残し、新しい p,P dataset 生成には使いません。

Colab / Python 解析は WebGL dataset だけから `pose_mapping_profile_candidate_v2` を出力します。
candidate には `requiredRenderBackend: "webgl"`、`requiredRenderer.rendererSignature`、
`requiredRenderer.kind`、`requiredRenderer.version`、`requiredRenderer.projectionMode`、
`requiredRenderer.renderResolution`、`datasetSchemaVersion` を含めます。runtime は profile 読み込み後、
現在の WebGL renderer 条件と一致しない場合に warning ではなく error として停止します。

Canvas2D render -> detect では、render 直後の canvas 同期、描画確定、readback コストが `detectMs` 側に乗る可能性があります。OBJ render 頻度を落とす案は `renderedIdeal478` の追従品質が下がりやすいため、通常 runtime と p,P dataset 生成の OBJ render 本線を WebGL OBJ Renderer に切り替えます。

Canvas2D renderer は legacy baseline / debug 比較として維持します。WebGL renderer は、同じ `p` を WebGL で描画した場合に、OBJ render が速くなるか、render -> detect の同期コストが下がるか、MediaPipe が顔として検出できるか、`P_confirm` が `P_camera` に近いかを確認しつつ、通常 runtime と p,P dataset 生成で使う renderer です。

比較する case:

- `WebGL render only`: WebGL で OBJ を描画するだけ
- `WebGL render -> detect`: WebGL canvas をそのまま MediaPipe `detect()` に渡す
- `WebGL render -> gl.finish() -> detect`: WebGL 描画完了を明示してから `detect()`
- `WebGL render -> readPixels(1x1) -> detect`: WebGL 側で小範囲 readback を前倒ししてから `detect()`
- `WebGL render -> createImageBitmap -> detect`: WebGL canvas から ImageBitmap を作成し、可能なら `detect(imageBitmap)`
- `WebGL render -> copy to 2D canvas -> detect`: WebGL canvas を 2D canvas にコピーしてから `detect(2dCanvas)`
- `Canvas2D baseline reference`: Canvas2D immediate render -> detect と explicit readback -> detect の簡易比較

WebGL renderer は既存 OBJ parser / OBJ mesh data を再利用します。見た目を Canvas2D renderer に近づけるため、orthographic 相当の投影、profile renderAppearance の `backgroundColor`、`skinColor`、material diffuse / ambient、ambient + key light の簡易 Lambert、camera scale / verticalOffset / renderResolution を使います。`material.specular`、`lighting.castShadow`、`camera.fovDeg`、`camera.projection` は未対応の比較 metadata として記録します。

WebGL context、shader、buffer は benchmark 用 renderer インスタンスで再利用し、毎 run ごとには作り直しません。FaceLandmarker も既存 IMAGE mode 用 `renderedIdealFaceLandmarker` を再利用し、GPU delegate 指定を維持します。各 sample には timing、detected、landmarkCount、`P_confirm`、poseDiff summary を保存し、478点配列は保存しません。

WebGL renderer は通常 runtime と p,P dataset 生成の本線です。MediaPipe は OBJ 形状そのものではなくレンダリングされた 2D 画像を見ているため、WebGL renderer の見た目条件が変わった場合は WebGL 条件で p,P dataset と poseMappingProfile を作り直します。mode comparison と既存 benchmark は比較 / debug 用として維持します。

`Download WebGL Benchmark JSON（WebGLベンチマークJSONダウンロード）` は `pose_mapping_webgl_obj_render_benchmark_v1` として、source、profile、runtime pose、landmarker、render settings、WebGL support、benchmark options、case summaries、per-run timing samples、conclusion hints を出力します。

`Download WebGL Benchmark CSV（WebGLベンチマークCSVダウンロード）` は 1 行 1 sample で、`caseId`、`label`、`rendererKind`、`handoffStrategy`、canvas size、`runIndex`、`phase`、`webglRenderMs`、`finishMs`、`readPixelsMs`、`bitmapCreateMs`、`copyTo2dMs`、`detectMs`、`totalMs`、`detected`、`landmarkCount`、`P_confirm`、poseDiff、`errorMessage` を出力します。

## 関連ドキュメント

- [Ideal Reference Mesh Warp Lab](ideal-reference-mesh-warp-lab.md)
- [Ideal Reference Coordinate Lifecycle Investigation](ideal-reference-coordinate-lifecycle-investigation.md)
- [Shape Warp production direction](shape-warp-production-direction.md)
- [アーキテクチャ](architecture.md)
- [リポジトリ構成](repository-structure.md)

## Runtime lifecycle / token

## Render pose lifecycle debug

Live alignment は position / scale の配置だけを行います。rendered ideal の向きは alignment では補正せず、`P_camera -> poseMappingProfile -> pFromProfile -> pForWebglRender -> WebGL render -> MediaPipe detect -> P_confirm` の render generation 側で姿勢が反映されている必要があります。

Pose Mapping runtime では、`pFromProfile（プロファイル出力姿勢）` と `pForWebglRender（WebGL描画用姿勢）` を分けて扱います。`pFromProfile` は `poseMappingProfile（姿勢対応プロファイル）` が返した生の姿勢で、`pForWebglRender` は WebGL render（WebGL描画）へ実際に渡す姿勢です。

`poseSignConvention（姿勢符号規約）` は、profile 出力をどの符号系として解釈するかを明示します。`profile_output_is_webgl_render_pose` は profile 出力をそのまま WebGL render に渡す規約、`profile_output_is_mediapipe_returned_pose` は profile 出力が MediaPipe returned pose（MediaPipe返却姿勢）寄りであるため、WebGL render 前に `OBJ_POSE_COMPARISON_SIGN` 相当の `renderPoseConversion（描画姿勢変換）` を適用する規約です。

現在の runtime 既定は `poseSignConvention: profile_output_is_mediapipe_returned_pose`、`renderPoseConversion: applyObjPoseComparisonSign` です。これにより `pForWebglRender.yaw / pitch / roll` は `pFromProfile.yaw / pitch / roll` に OBJ render pose（OBJ描画姿勢）と MediaPipe returned pose（MediaPipe返却姿勢）の比較符号を適用して決めます。評価では見た目だけでなく、`P_confirm（確認姿勢） - P_camera（カメラ顔姿勢）` の yaw / pitch / roll / magnitude が小さくなることを主に確認します。

Pose Mapping runtime の `renderedIdealLifecycle.renderPose` では、`renderToken.p` 由来の `requestedPoseP` を `pForWebglRender（WebGL描画用姿勢）` として扱い、WebGL renderer が実際に使った `actualRenderPoseP` と別々に記録します。`renderPoseMatchesToken` は token と WebGL 適用値の一致確認、`renderPoseAppliedToWebGL` は token 一致に加えて `P_confirm` が requested pose に対して front 固定に見えないことを確認する debug flag です。

`Render pose probe（レンダー姿勢プローブ）` は、同じ OBJ / poseMappingProfile / render settings で fixed pose A-E を WebGL render -> detect し、それぞれの `P_confirm` を表示します。probe は WebGL render（WebGL描画）の素の規約確認であり、profile output conversion（プロファイル出力変換）を混ぜません。指定した fixed pose（固定姿勢）はそのまま `pForWebglRender（WebGL描画用姿勢）` として渡します。yaw / pitch / roll を変えても `P_confirm` がほぼ同じ front pose に固定される場合、runtime warning として `render_pose_not_applied` を記録します。

`render_pose_not_applied` は、`abs(pForWebglRender.yaw) + abs(pForWebglRender.pitch) + abs(pForWebglRender.roll) > 15` かつ `abs(P_confirm.yaw) < 3`、`abs(P_confirm.roll) < 3` のときに出します。この状態では `alignmentStatus === "completed"` でも、`renderPoseAppliedToWebGL` は `false` として扱います。

WebGL renderer の pose は shader uniform ではなく、CPU 側の `buildWebglObjRenderBuffers()` で pose-baked vertices として buffer に焼き込みます。そのため render pose lifecycle では、`renderCallPoseP`、`previewStatePoseP`、`bufferBuildPoseP`、`webglUniformPoseP`、`canvasLastRenderedPoseP` を分けて記録します。通常は `webglUniformPoseP` は `null`、`buffer.bufferPoseMode` は `baked_vertices` です。

skip / recovery 後の切り分け用に、`recovery` debug では `recoveredFromNoCurrentFace`、`recoveredFromNoRenderedIdeal`、`recoveredFromAlignmentSkip`、`buffersWereRebuiltAfterRecovery`、`uniformsWereResetAfterRecovery` を記録します。`Run probe after next recovery` は、次に noFace / rendered ideal skip / alignment skip から復帰した直後に Render pose probe を自動実行します。

`Hide ideal overlay when render pose not applied` は既定で有効です。`render_pose_not_applied` のときは `overlayLifecycle.renderPoseValid = false` とし、理想 overlay を正常表示として扱わず `overlayLifecycle.skippedReason = render_pose_not_applied` を残します。

Live overlay では、古い rendered ideal や fallback frontal face を表示しないため、runtime に以下の lifecycle を持たせます。

- `assetLifecycle`: OBJ / profile / renderer / render settings の generation と ready 状態を記録します。
- `frameLifecycle`: current frame の `frameId` / `mediaTimeSec` と、その frame の runtime status を記録します。
- `renderedIdealLifecycle`: OBJ render の成功 token、detect 実行有無、detect token 一致、stale canvas 検出を記録します。
- `overlayLifecycle`: current478 / aligned rendered ideal / correspondence line / mesh target の表示可否と skipped reason を記録します。

Live overlay の current overlay（現在顔重ね表示）は、最新 frame の `current478`（現在顔478点）の有無だけに依存します。`noFace`（顔未検出）や `no_current_face`（現在顔なし）は frame-local（一時状態）として扱い、次の detected frame（検出成功フレーム）で `current478` が戻ったら current overlay も復帰します。current overlay checkbox（現在顔重ね表示チェックボックス）は一時的な `noFace` では disabled（無効）にせず、ON のまま保持します。

aligned ideal overlay（位置合わせ済み理想顔重ね表示）の `placementFunctionStatus` / `alignmentStatus` / `renderedIdealStatus` / token match / render pose gate の失敗は、current overlay（現在顔重ね表示）の表示可否には影響させません。これらの gate は aligned ideal overlay、correspondence line、mesh target の表示可否にだけ使います。

`表示重ね描き（displayedContentRect pixel座標）` tab（タブ）は、active（有効）になったタイミングで最新 state（状態）から redraw（再描画）します。tab switch（タブ切替）で戻った直後は `requestAnimationFrame`（次描画フレーム待ち）後に overlay canvas（重ね描き canvas）の表示サイズを再計測し、`displayedContentRect`（表示領域矩形）を再計算してから描画します。hidden（非表示）状態の tab で計算した 0 size（ゼロサイズ）由来の `displayedContentRect` は使い回しません。

tab switch（タブ切替）後の current overlay（現在顔重ね表示）は、次の video frame（動画フレーム）や `timeupdate`（時間更新イベント）を待たず、最新の `currentAnalysis.landmarks478`（現在解析478点）が 478 点そろっていれば復帰します。current overlay は aligned ideal overlay（位置合わせ済み理想顔重ね表示）の `skippedReason`（スキップ理由）に依存しません。

OBJ、poseMappingProfile、render appearance、renderer が変わった場合は generation を進めます。rendered ideal の render 成功後に `RenderedIdealFrameToken` を作り、同じ token が current generation と一致する場合だけ MediaPipe detect 結果と alignment 結果を採用します。WebGL canvas は detect 前に clear し、render 成功 token がない canvas に対して detect を進めません。

Live overlay の aligned rendered ideal は、以下をすべて満たす場合だけ表示します。

- `currentFaceStatus === "detected"`
- OBJ と poseMappingProfile が ready
- `profileRendererMatch === true`
- `renderedIdealStatus === "detected"`
- `alignmentStatus === "completed"`
- `fallbackRenderedIdealUsed === false`
- `alignedRenderedIdeal478` が存在する
- `renderedIdealToken` と `alignedRenderedIdealToken` が current asset generation と一致する
- `renderedIdealToken` と `alignedRenderedIdealToken` が同一 frame / pose を指す

`lastGood` は debug 記録として保持できますが、overlay 表示には使いません。current face missing、generation mismatch、profile mismatch、OBJ / profile reload 中は `renderedIdeal478` / `alignedRenderedIdeal478` / token を runtime 表示対象から外し、`overlayLifecycle.skippedReason` に理由を残します。
