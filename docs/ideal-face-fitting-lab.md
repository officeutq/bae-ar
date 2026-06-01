# IdealFace Fitting Lab

## Current Conclusion: 478 IdealFace Depth Generation / 現時点の結論: 478点 IdealFace 奥行き生成

現時点では、`tools/ideal-face-fitting-lab` の 478点 IdealFace 奥行き生成 prototype（試作）として、以下の組み合わせを最有力方針とする。

```text
canonical-face-depth-template-v1.json
  +
12pt_rotation_center
  +
canonicalDepthBased
  +
perLandmarkZSearch
```

これは MediaPipe canonical face model（MediaPipe標準顔モデル）から作った `canonical-face-depth-template-v1.json`（標準顔奥行きテンプレート）を基準にし、`12pt_rotation_center`（回転中心推定向け12点）で `rotationCenter`（回転中心） / `pivotZ`（投影基準奥行き） / 主要 z を推定し、`canonicalDepthBased`（標準顔奥行きベース方式）で 478点の仮 z を作り、`perLandmarkZSearch`（ランドマーク単位 z 探索）で各 landmark（ランドマーク）の z を微調整する方針である。

この章は Fitting Lab（フィッティング検証ラボ）の実験結果をまとめるものであり、Runtime（実行時SDK） / Studio（開発確認UI） / IdealFace Authoring Tool（理想顔作成ツール） / `beauty_filter_asset_v1` の仕様確定や production asset export（本番用アセット書き出し）ではない。

### Adopted Prototype / 採用中の試作方針

採用中の試作方針は以下とする。

- `canonical-face-depth-template-v1.json`（標準顔奥行きテンプレート）を 468点 canonical comparison（標準顔比較）の基準として使う。
- `12pt_rotation_center`（回転中心推定向け12点）を Quick Run（簡易実行）の本命 semanticPointSet（意味点セット）にする。
- `canonicalDepthBased`（標準顔奥行きベース方式）で、478点の仮 z を生成する。
- `perLandmarkZSearch`（ランドマーク単位 z 探索）で、各 landmark の z を `baseZ ± zRange` の 1次元探索として微調整する。
- 468〜477 の追加10点は iris（虹彩・目まわり追加点）として canonical comparison から除外し、暫定的に iris fallback（虹彩補完）で扱う。

最終確認時点の代表値は以下である。

```text
quickRun.status = passed
semanticPointSetId = 12pt_rotation_center
sourceSemanticPointSetId = 12pt_rotation_center

noseTipGroupZ = 0.005535
cheekGroupZ   = 0.013005
delta          = -0.00747
margin         = 0.005

averageProjectionError = 0.031754
rotationCenter.y = -0.14
rotationCenter.z = 0.04
```

このラボでは `z が小さい = 手前`、`z が大きい = 奥` と扱う。そのため `noseTipGroupZ < cheekGroupZ` であり、`delta = noseTipGroupZ - cheekGroupZ` が `-margin` より小さいので、鼻先が頬より十分手前という Depth Relation Debug（奥行き関係デバッグ）を満たしている。

### Why not brute-force 478 z values / 478点 z の同時総当たり探索をしない理由

478点すべての z を同時に brute-force（総当たり探索）すると、候補の組み合わせが爆発するため採用しない。これは探索時間だけでなく、候補評価・メモリ・debug 出力の扱いも現実的ではなくなる。

```text
NG:
478点すべての z の組み合わせを同時探索

OK:
canonical depth で仮 z を作り、
各 landmark ごとに baseZ ± range を1次元探索
```

`perLandmarkZSearch`（ランドマーク単位 z 探索）は、478点を同時に探索するものではない。`canonicalDepthBased`（標準顔奥行きベース方式）で作った `baseZ`（基準奥行き）を起点に、対象 landmark 1点だけの `candidateZ`（候補奥行き）を動かして score（スコア）を比較するため、組み合わせ爆発を避けられる。

### Why 12pt_rotation_center is currently preferred / 12pt_rotation_center を現時点で優先する理由

8点 / 12点 / 24点 semanticPointSet（意味点セット）の比較結果は以下の整理とする。

```text
8pt_basic:
  軽くて安定。
  安全な比較基準として残す。

12pt_rotation_center:
  rotationCenter / pivotZ / 主要z の推定に有効。
  depth relation を通過し、projection error も許容範囲。
  現時点の本命。

24pt_structure:
  顔構造点を増やした比較用。
  ただし、表情・検出ブレ・追加点の影響を拾いやすい。
  今回の結果では warning 扱いで、現時点の本命にはしない。
```

`8pt_basic`（基本8点）は、頭頂 / 顎 / 左右頬 / 左右目 / 鼻 / 口を使うため軽く、比較基準として扱いやすい。一方で、回転中心や顔構造の推定には粗さが残る。

`12pt_rotation_center`（回転中心推定向け12点）は、8点の安定性を大きく崩さずに、`rotationCenter`（回転中心）と `pivotZ`（投影基準奥行き）の推定に効く点を増やせる。Quick Run（簡易実行）で `passed` になり、Depth Relation Debug（奥行き関係デバッグ）と projection error（投影誤差）の両方が許容範囲に入ったため、現時点の推奨とする。

`24pt_structure`（構造確認向け24点）は、鼻横、目尻・目頭、こめかみ、口角、下顎などを増やすため、構造情報は増える。ただし、表情差、MediaPipe 検出ブレ、追加点の局所誤差も拾いやすい。比較用として残すが、今回の結論では本命にしない。

### Role of canonical-face-depth-template-v1.json / canonical-face-depth-template-v1.json の役割

`canonical-face-depth-template-v1.json`（標準顔奥行きテンプレート）は、MediaPipe canonical face model（MediaPipe標準顔モデル）から作った Fitting Lab 用の depth template（奥行きテンプレート）である。

役割は以下である。

```text
canonical-face-depth-template-v1.json を読み、
標準顔の 468点 z を Fitting Lab 用の基準として使い、
scale / offset で現在の候補に合わせ、
478点の仮 z を生成する。
```

これは IdealFace（理想顔）そのものを確定するものではない。MediaPipe canonical face model（MediaPipe標準顔モデル）をそのまま IdealFace として採用するわけではなく、Fitting Lab で 478点 z の debug candidate（デバッグ候補）を作るための基準として使う。

MediaPipe canonical face model は 468点版であるため、canonical comparison（標準顔比較）の対象は `0..467` の 468点とする。Face Landmarker / Fitting Lab の 478 landmarks に含まれる `468..477` の追加10点は iris（虹彩・目まわり追加点）として比較対象から除外し、現時点では iris fallback（虹彩補完）で扱う。

### Role of perLandmarkZSearch / perLandmarkZSearch の役割

`perLandmarkZSearch`（ランドマーク単位 z 探索）は、`canonicalDepthBased`（標準顔奥行きベース方式）で作った仮 z を起点に、各 landmark（ランドマーク）の z を独立に 1次元探索する方式である。

```text
baseZ = canonicalDepthBased で作った仮 z
candidateZ = baseZ ± zRange
score = projectionError + canonicalDeviationPenalty
```

`projectionError`（投影誤差）は selectedFrames（選択フレーム）へ投影した結果と current 2D landmark（現在顔2Dランドマーク）の差を評価する。`canonicalDeviationPenalty`（標準顔からの逸脱ペナルティ）は、2D に合うためだけに canonical depth（標準顔奥行き）から離れすぎる z を抑制する。

この方式により、478点 z の同時総当たり探索をせずに、各点の z を微調整できる。ただし、現状では大きな改善を生む確定工程というより、`canonicalDepthBased` の候補を少し整える debug refinement（デバッグ用微調整）として機能している段階である。

### Depth relation status / 奥行き関係ステータス

8点探索側では、`nose_tip_in_front_of_cheeks`（鼻先が頬より手前）を `hardReject`（完全除外）として使うのは有効だった。

一方で、478点側では group median（グループ中央値）で評価するため、微小な margin（余白）未達だけで即 rejected（却下）にしない方針にする。現時点の 478点 Depth Relation Debug（奥行き関係デバッグ）は以下の 3段階で扱う。

```text
passed:
  方向も margin も満たす

warning:
  方向は正しいが margin に少し足りない

rejected:
  方向自体が逆
```

今回の最終候補は `passed` である。`warning`（警告）は production candidate（本番候補）として採用する意味ではなく、debug 比較で原因を確認するための状態である。

### Current limitations / 現在の制約

- 478点 z の最終値はまだ debug candidate（デバッグ候補）であり、production asset（本番用アセット）ではない。
- `canonical-face-depth-template-v1.json`（標準顔奥行きテンプレート）は参照基準であり、IdealFace（理想顔）そのものではない。
- `perLandmarkZSearch`（ランドマーク単位 z 探索）は現時点では微調整であり、最終品質を保証する工程ではない。
- `24pt_structure`（構造確認向け24点）は比較用として残すが、表情・検出ブレ・追加点の影響を拾いやすいため現時点の本命にはしない。
- `8pt_basic`（基本8点）は安全な比較基準として残す。
- 現時点の推奨 semanticPointSet（意味点セット）は `12pt_rotation_center`（回転中心推定向け12点）である。

### Not production export yet / まだ本番用 export ではない

この結論は Fitting Lab（フィッティング検証ラボ）の実験結果であり、production asset export（本番用アセット書き出し）ではない。

今回の方針は、Runtime（実行時SDK） / Studio（開発確認UI） / IdealFace Authoring Tool（理想顔作成ツール） / `beauty_filter_asset_v1` には反映しない。Engine Runtime（実行時エンジン）に authoring（作成・編集）処理を混ぜず、Fitting Lab の debug candidate（デバッグ候補）として切り分けて扱う。

## perLandmarkZSearch（ランドマーク単位 z 探索）

`perLandmarkZSearch`（ランドマーク単位 z 探索）は、`canonicalDepthBased`（標準顔奥行きベース方式）で作った仮の 478 点 z を起点に、各 landmark（ランドマーク）の z だけを独立に 1 次元探索する debug prototype（試作）である。478 点を同時に総当たり探索するものではないため、組み合わせ爆発は起きない。

処理は `baseZ`（基準奥行き）を中心に `candidateZ`（候補奥行き）を作り、対象 landmark 1 点だけを selectedFrames（選択フレーム）へ回転・投影して current 2D landmark と比較する。score（スコア）は `projectionError`（投影誤差）に `canonicalDeviationPenalty`（標準顔からの逸脱ペナルティ）を足したものを使い、2D には合うが標準顔奥行きから離れすぎる z を抑制する。

`rotationCenter`（回転中心）と `pivotZ`（投影基準奥行き）は、既存の 8 点探索結果を使う。初期実装では Quick Run（クイック実行）の対象は `canonical468Only`、つまり `0..467` の canonical 468 点を主対象にし、`468..477` は iris fallback（虹彩補完）の値を維持する。

計算量の目安は `468 landmarks * 41 z candidates * 50 frames = 959,400 point projections` である。各 candidate では 478 点全体を投影せず、評価対象の 1 点だけを投影する。

478 点側の `Depth Relation Debug`（奥行き関係デバッグ）は、今後 `passed / warning / rejected` の 3 段階診断へ寄せる。`noseTipGroup.z < cheekGroup.z` の方向は正しいが margin（余白）に少し足りない場合は `warning` とし、方向自体が逆の場合を `rejected` とする。

## Canonical Face Depth Template

`canonical-face-depth-template-v1.json` は、MediaPipe canonical face model（MediaPipe標準顔モデル）の `canonical_face_model.obj` から生成する Fitting Lab 用の奥行き参照テンプレートです。これは IdealFace（理想顔）そのものではなく、production asset export（本番用アセット書き出し）でもありません。

生成は Fitting Lab 専用スクリプトで行います。

```bash
npm run generate:canonical-depth-template --workspace @bae-ar/ideal-face-fitting-lab
```

`canonical_face_model.obj` は MediaPipe の 468 点版であるため、canonical comparison（標準顔比較）はまず landmark index `0`〜`467` の 468 点だけを対象にします。Face Landmarker / Fitting Lab の 478 landmarks に含まれる `468`〜`477` の追加 10 点は iris（虹彩・目まわり追加点）として、現時点では比較対象外にします。

生成 JSON には以下を明示します。

```json
{
  "sourceLandmarkCount": 468,
  "targetLandmarkCount": 478,
  "comparisonLandmarkIndices": [0, 1, "...", 467],
  "excludedLandmarkIndices": [468, 469, 470, 471, 472, 473, 474, 475, 476, 477]
}
```

Quick Run（クイック実行）では、この JSON を読み、標準顔奥行きを基準に 478 Depth Prototype（478点奥行き試作）の debug candidate を生成できます。ただし、このテンプレートの canonicalZ は正解値として採用するものではなく、478 Depth Prototype の参照情報として扱います。

## Canonical Face XYZ Template

`canonical-face-xyz-template-v1.json`（標準顔XYZテンプレート）は、`canonical_face_model.obj` の raw x/y/z を保持する診断用テンプレートです。Fitting Lab 側で canonical face（標準顔）を 12点 candidate（12点候補）の x/y 座標系へ fit（当てはめ）し、その fit 結果を使って z の自然さを比較するための入力として使います。

このテンプレートでは x/y/z の正規化、scale（倍率）、offset（平行移動）は行いません。0〜467 は OBJ 由来の raw vertex として保持し、OBJ に存在しない 468〜477 は iris fallback（虹彩補完）として eye proxy（目代理点）から補完します。補完点は `comparison.defaultExcludedLandmarkIndices` に含め、構造比較の既定除外対象として扱います。

既存の `canonical-face-depth-template-v1.json`（標準顔奥行きテンプレート）は互換性のため残し、`canonicalDepthBased`（標準顔奥行きベース方式）などの既存処理では引き続き depth template を参照します。

生成は Fitting Lab 専用スクリプトで行います。

```bash
npm run generate:canonical-xyz-template --workspace @bae-ar/ideal-face-fitting-lab
```

## 8Point To 478 Depth Prototype

### canonicalDepthBased

`canonicalDepthBased`（標準顔奥行きベース方式）は、478 Depth Prototype 用の debug candidate 生成方式です。`tools/ideal-face-fitting-lab/data/canonical-face-depth-template-v1.json` を読み込み、`canonicalDepth[0..467].z` を標準顔奥行きの参照値として使います。これは IdealFace 確定ではなく、production asset export でもありません。

この方式では、既存の 8 semantic points のうち `0..467` に対応できる `nose -> 4`、`leftCheek -> 234`、`rightCheek -> 454`、`mouth -> 13 / 14`、`chin -> 152`、`headTop -> 10` を参照点にして、8点 candidate の z に対する `canonicalZ * scale + offset` を least squares で推定します。その変換後の canonical depth を 0〜467 の z 候補として使い、既存の `478 Projection Evaluation`、`478 Depth Relation Debug`、`478 Candidate Comparison` に流します。

`468..477` は MediaPipe Face Landmarker の追加10点（iris / 目まわり追加点）であり、MediaPipe canonical face model 由来の `canonicalDepth` には存在しません。そのため、この範囲は eye fallback の z で補完し、canonical comparison では比較対象外にします。JSON には `irisDepthFallback.excludedFromCanonicalComparison: true` として出力します。

既存の `inverseDistanceWeighting`（距離の逆数による重み付け補間）は残し、`canonicalDepthBased` とは別方式として比較可能にします。Quick Run の `Run 478 Depth Hard Reject Debug` では、`quickRun.settings.depth478GenerationMethod: "canonicalDepthBased"` を出力します。

`tools/ideal-face-fitting-lab` には、8 semantic points の候補を最終 IdealFace asset としてすぐ export するのではなく、478 landmarks の z を評価するための prototype を追加している。

現在の主導線は `Run 478 Depth Hard Reject Debug` です。このボタンは、capture JSON 読み込み後に `Balanced 10 each`、`Rotation Center Balanced Sequence`、Depth Relation `hardReject`、Outlier Filtering enabled の固定設定で 8点探索から 478点奥行き debug candidate 生成までを一括実行し、`depth478` debug JSON を自動ダウンロードする。

この出力は production asset export ではない。UI 表示は手動操作を減らすために簡略化し、詳細 debug result は UI ではなくダウンロードされる JSON を正とする。従来の探索設定、ranking、per-frame table、478 Projection / Depth Relation / Smoothness / Candidate Comparison の詳細表示は `Advanced Settings / Debug UI` に折りたたむ。

`hardReject` の結果、478 debug candidate が `rejected` になっても、原因確認のため JSON は出力する。JSON の `quickRun.status` が `rejected` の候補は production candidate として採用してはいけない。`hardReject` を満たす 8点 candidate が見つからない場合も silent fallback は行わず、`quickRun.status: "noCandidate"` と `fallbackUsed: false` を出力する。

この prototype では、8点候補を `depthAnchors` として扱う。

- `headTop.z`
- `chin.z`
- `leftCheek.z`
- `rightCheek.z`
- `leftEye.z`
- `rightEye.z`
- `nose.z`
- `mouth.z`

478点それぞれの z は個別探索しない。初期実装では、front bucket の selected frames から 478点の x / y を同じ座標系で平均し、8つの depth anchor から `inverseDistanceWeighting` で z を補間する。必要な微調整は、個別 landmark の自由探索ではなく `DepthGroupCorrection` による group correction として扱う。

8点から478点へ拡張した候補は、まだ production asset ではない。`Generated478DepthCandidate` は debug candidate であり、候補評価後に採用判断する。UI でも `Generate 478 Debug Candidate` / `Export 478 Debug JSON` として扱い、Final Export とは呼ばない。

処理フローの 5 と 6 の間には、以下の評価工程を置く。

- `478 Projection Evaluation`: 補正後478点候補を selected frames の pose へ投影し、current 478 landmarks と比較する。478 landmarks がない frame は評価から除外する。
- `478 Depth Relation Debug`: `noseTipGroup` が `cheekGroup` より手前、`faceCenterGroup` が `faceBoundaryGroup` より手前かを debug として確認する。
- `478 Smoothness Debug`: 近傍 landmark 間の z 差を見て、z が不自然にガタついていないかを確認する。
- `478 Candidate Comparison`: candidate id、元8点候補、投影誤差、奥行き関係違反数、smoothness の最大差としきい値超過数を比較する。

最終的な export は、478候補の評価・比較後に別工程で行う。現段階では Runtime、IdealFace Authoring Tool、asset schema、Standard Face、MediaPipe canonical face model との比較には組み込まない。

478候補の `depthRelationDebug` には、候補生成時の search settings 由来の Depth Relation Filtering summary を出す。`mode: hardReject` の場合、478 debug rule result でも `reject: true` を出せる。ただし 478 Depth Prototype は単一 debug candidate の評価であり、478点 z の個別自由探索や production asset export は行わない。

`tools/ideal-face-fitting-lab` は、production 用 IdealFace asset を直接作る正式ツールではありません。

まずは 8 semantic points について、正面基準 x / y を固定し、8点それぞれの z と pivotZ だけを未知数として探索する検証ラボです。正面2Dだけでは z は決められないため、複数姿勢の capture frame へ candidate を回転・投影し、current 2D landmarks 8点との誤差でランキングします。

今回の主導線から、`alignmentMode`、`weighted_similarity_2d`、`zProfile`、`zScale` は外します。MediaPipe の `facialTransformationMatrix` は capture frame の yaw / pitch / roll 取得に使ってよいですが、matrix inverse で current landmarks を IdealFace3D へ戻す処理は行いません。

## 入力

MediaPipe Canonical Lab が export した captured JSON を import します。

主に使う情報:

- `landmarks`: current landmarks 478
- `pose`: yaw / pitch / roll
- `bucket`: front / yawPositive / yawNegative / pitchPositive / pitchNegative / mixedPose
- `videoWidth` / `videoHeight`
- `blendshapes`
- `facialTransformationMatrix`: pose 取得元の debug 情報として保持される場合があります

## 8 Semantic Points

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

leftEye / rightEye は iris が取得できない場合、eye corner fallback を使います。

## Semantic Point Set Comparison

Quick Run（`Run 478 Depth Hard Reject Debug`）では、通常出力の `quickRun.settings.semanticPointSetId` は `12pt_rotation_center` のまま維持しつつ、追加 debug として `semanticPointSetComparison` を出力する。

比較対象は同じ capture JSON、同じ selected frames、同じ固定条件で実行する。

```text
8pt_basic
12pt_rotation_center
24pt_structure
```

固定条件は `bucketPreset: balanced_10_each`、`autoSearchSequence: rotation_center_balanced`、`depthRelationMode: hardReject`、`depth478GenerationMethod: canonicalDepthBased`、`perLandmarkZSearchEnabled: true`、`outlierFilteringEnabled: true` とする。

`24pt_structure` は顔構造確認向けの 24 点セットであり、production 確定ではない。`rotationCenter`（回転中心）と projection stability（投影安定性）を検証するための比較用 point set として扱う。24点は鼻横、目尻・目頭、こめかみ、口角、下顎を追加するため、顔構造の情報は増える一方で、表情や検出ブレも拾いやすい。必ず `8pt_basic` / `12pt_rotation_center` と比較して判断する。

`24pt_structure` の追加点と landmark index は以下。

| point | index |
| --- | --- |
| leftNoseSide | 98 |
| rightNoseSide | 327 |
| leftEyeOuter | 263 |
| rightEyeOuter | 33 |
| leftEyeInner | 362 |
| rightEyeInner | 133 |
| leftTemple | 356 |
| rightTemple | 127 |
| leftMouthCorner | 291 |
| rightMouthCorner | 61 |
| lowerJawLeft | 365 |
| lowerJawRight | 136 |

左右の命名は Fitting Lab 既存の `leftEyeGroup` / `rightEyeGroup` と同じ向きに揃える。JSON では `analysisSummary.semanticPointSet.indexMapping` と、比較対象ごとの `semanticPointSetComparison.runs[].semanticPointSetId` / `pointCount` を確認する。

`semanticPointSetComparison` の見方:

- `runs[]`: 各 point set の Quick Run summary。`averageProjectionError`、`maxBucketScore`、`rotationCenter`、`pivotZ`、`depthRelationStatus`、`noseTipGroupZ`、`cheekGroupZ`、`perLandmarkAverageErrorBefore/After` を比較する。
- `depthRelationStatus`: `passed` を優先する。`warning` は margin 不足、`rejected` は hardReject 違反として扱う。
- `noseCheekDelta`: `noseTipGroupZ - cheekGroupZ`。このラボでは z が小さいほど手前なので、負の値は noseTipGroup が cheekGroup より手前であることを示す。
- `recommendedSemanticPointSetId`: 単純な推奨ルールの結果。depth relation が通り、projection error と maxBucketScore が大きく悪化しないものを優先する。12点と24点が近い場合は、表情影響を拾いにくい `12pt_rotation_center` を優先する。

## 処理

1. captured JSON を読み込む
2. bucket ごとの target 数に従って capture frame を選ぶ
3. front bucket の selected frames から `base8Points2D` を作る
4. `zMin` / `zMax` / `zStep` から 8点それぞれの z 候補を作る
5. `pivotZMin` / `pivotZMax` / `pivotZStep` から pivotZ 候補を作る
6. 8点 z + pivotZ の組み合わせを `FittingCandidate8` として作る
7. candidate ごとに正面基準 x / y と z から IdealFace3D 8点を作る
8. capture frame の yaw / pitch / roll で 3D 点を回転し、2Dへ投影する
9. frame の current 2D landmarks 8点と比較する
10. frameScore と bucketScores を集計し、totalScore で ranking を作る
11. bestCandidate から `bestIdealFace8` を出力する

current 2D landmarks は各 frame の顔 bounds center を原点にした same-unit 座標へ揃えて比較します。これは candidate に合わせる 2D 再フィットではなく、front 基準 x / y と frame-local current 2D を比較可能にするための座標正規化です。

## Candidate

```ts
type FittingCandidate8 = {
  zByPointId: {
    headTop: number
    chin: number
    leftCheek: number
    rightCheek: number
    leftEye: number
    rightEye: number
    nose: number
    mouth: number
  }
  pivotZ: number
  rotationCenter?: {
    x: number
    y: number
    z: number
  }
}
```

探索範囲は UI から調整できます。

- `zMin`
- `zMax`
- `zStep`
- `pivotZMin`
- `pivotZMax`
- `pivotZStep`
- `topN`

## Search Mode

`eight_point_grid_search_v1` は、8 semantic points（8つの意味点）の z（奥行き値）と pivotZ（回転中心の奥行き）を探索する検証ラボです。

`fullGrid`（全組み合わせ格子探索）は粗探索用です。8点すべての z と pivotZ を全組み合わせで確認するため、`zStep`（奥行き刻み幅）を細かくしすぎると候補数が爆発します。

細かい調整では、`bestCandidate`（最良候補）を `baseCandidate`（基準候補）にして、`localOneDimensional`（1変数局所探索）または `coordinateDescent`（座標降下法）を使います。

現時点の安定した `baseCandidate`（基準候補）は、`pivotZ=0.12`、`leftCheek.z/rightCheek.z=0.12`、その他 z=0 です。ただし、これは debug（検証）候補であり production（本番）確定値ではありません。

```ts
type SearchMode =
  | "fullGrid"
  | "localOneDimensional"
  | "coordinateDescent"
```

`localOneDimensional` は `baseCandidate` を固定し、`pivotZ` / `headTop.z` / `chin.z` / `leftCheek.z` / `rightCheek.z` / `leftEye.z` / `rightEye.z` / `nose.z` / `mouth.z` のうち指定した 1 parameter だけを `localMin` 〜 `localMax`、`localStep` で動かします。

`coordinateDescent` は `baseCandidate` から開始し、デフォルトでは `pivotZ -> leftCheek.z -> rightCheek.z -> nose.z -> mouth.z -> leftEye.z -> rightEye.z -> headTop.z -> chin.z` の順番で 1変数局所探索を行い、各 parameter の best value で baseCandidate を更新します。初期の `coordinateDescentIterations` は `2` です。

`coordinateDescent` は `fullGrid` と異なり、`baseCandidate` を起点に parameter ごとに局所探索するため、候補数は少なく短時間で完了します。

`includeMixedPose=false` または `mixedPose target=0` の場合、`mixedPose` frame は selected frames / evaluation input に含めません。

`topCandidates` / `bucketRanking` は candidate 値で dedupe し、同一 candidate を複数表示しません。

## Local Search Preset

local search preset は、8 semantic points の z と pivotZ を手動入力なしで試すための UI 補助である。

fullGrid は粗探索用。
coordinateDescent は baseCandidate 周辺の自動微調整用。
localOneDimensional は pivotZ / nose.z / cheek.z など、1パラメータの感度確認用。

推奨手順は、Coordinate Descent Fine で大まかに微調整し、その後 PivotZ Fine / NoseZ Fine / CheekZ Fine などで個別確認すること。

Search Preset には Coordinate Descent Fine / PivotZ Fine / NoseZ Fine / LeftCheekZ Fine / RightCheekZ Fine / MouthZ Fine / Yaw Focus Fine / Pitch Focus Fine を用意する。
Base Candidate Preset には Baseline Cheek Depth / Current Fine Best / Current bestCandidate を用意する。

プリセット適用時は maxFrames=30、front / yawPositive / yawNegative / pitchPositive / pitchNegative target=5、mixedPose target=0、mixedPose 不採用、roll warning deg=12、blendshape warning=0.35、topN=100、focalLength=2.6 を基本値としてフォームへ反映する。

## Auto Search Sequence

Auto Search Sequence は、複数の local search preset を順番に実行し、各 step の bestCandidate を次 step の baseCandidate に自動反映する UI 補助である。

Fine Sequence は、Baseline Cheek Depth を起点に Coordinate Descent Fine → PivotZ Fine → NoseZ Fine → LeftCheekZ Fine → RightCheekZ Fine → MouthZ Fine の順で実行する。

Current Best Fine Sequence は、現在の bestCandidate を起点に PivotZ Fine → NoseZ Fine → LeftCheekZ Fine → RightCheekZ Fine → MouthZ Fine を実行する。

Yaw Focus Sequence は、Baseline Cheek Depth を起点に Yaw Focus Fine → PivotZ Fine → NoseZ Fine を実行する。

Pitch Focus Sequence は、Current Fine Best を起点に Pitch Focus Fine → PivotZ Fine → MouthZ Fine → NoseZ Fine を実行する。

Auto Sequence は production 用 IdealFace を確定するものではなく、8 semantic points の z / pivotZ を効率よく検証するための debug workflow である。

## Score

まずはシンプルに、投影後2D点と current 2D landmarks 8点の距離を使います。

- `pointError`: projectedIdeal2D と current2D の距離
- `frameScore`: 8点の weighted average
- `totalScore`: usable capture frames の frameScore 平均
- `bucketScores`: front / yawPositive / yawNegative / pitchPositive / pitchNegative / mixedPose ごとの frameScore 平均

派生 debug 指標として `yawAverageScore`、`pitchAverageScore`、`maxBucketScore`、`balancedScore = totalScore + maxBucketScore * 0.25` も summary に出します。これは候補比較用の検証指標であり、現時点の最終評価指標ではありません。

点ごとの weight は既存の semantic point weight を使います。

## Output

Full / Summary JSON と UI で以下を確認できます。

- candidate count
- capture frame count
- ranking top N
- bestCandidate
- bestIdealFace8
- bucketScores
- pivotZ
- headTop.z / chin.z / leftCheek.z / rightCheek.z / leftEye.z / rightEye.z / nose.z / mouth.z
- current8BucketSummary
- current8PoseComparison
- current8FrameSample

## Projection Sign Debug

Projection Sign Debug は、8点 z / pivotZ 探索で得られた候補について、z の符号や yaw / pitch 回転方向が期待通りに projection へ反映されているかを確認するための debug 機能です。

この debug は selected frames のうち `front` / `yawPositive` / `yawNegative` / `pitchPositive` / `pitchNegative` の各 bucket 先頭フレームを使います。`mixedPose` は使いません。現在の `bestCandidate` を baseCandidate とし、`nose.z` だけを `-0.04` / `-0.02` / `0` / `0.02` / `0.04` / `0.06` / `0.08` に差し替えて、projected nose / current nose / error と、leftCheek / rightCheek / mouth の詳細を出力します。

2D 誤差最小候補で `nose.z` が `cheek.z` より大きくなる場合、それが自然な顔形状を意味するとは限りません。まず projection sign / pose sign / pitch-yaw response を確認する必要があります。

この debug は score 式、bestCandidate 選定ロジック、depth prior を変更しません。候補選定前の原因切り分けに使います。

Full JSON / Summary JSON には以下が追加されます。

```ts
projectionSignDebug?: {
  baseCandidate: FittingCandidate8
  noseZCandidates: number[]
  rows: ProjectionSignDebugRow[]
  summary: ProjectionSignDebugSummary
}
```

## Rotation Center Debug

Rotation Center Debug は、8点 z / pivotZ 探索で得られた候補について、回転中心を `(0, 0, pivotZ)` 固定と仮定することが pitch / yaw の投影誤差にどのような影響を与えるかを確認するための debug 機能である。

実際の頭部回転中心は顔表面中心ではなく、頭部内部・眼窩奥・耳の間・首寄りに存在する可能性がある。

回転中心が誤っている場合、探索された z は顔形状の奥行きではなく、回転中心誤差を吸収した値になる可能性がある。

この debug は score や探索ロジックを変更せず、pivotY / pivotZ の影響を切り分けるために使う。`pivotX` はまず `0` 固定とし、`pivotY` と `pivotZ` の候補を組み合わせて selected frames に対する score を比較する。

Full JSON / Summary JSON には以下が追加される。

```ts
rotationCenterDebug?: {
  baseCandidate: FittingCandidate8
  baseCandidateName: string
  pivotXCandidates: number[]
  pivotYCandidates: number[]
  pivotZCandidates: number[]
  results: RotationCenterDebugResult[]
  summary: RotationCenterDebugSummary
}
```

## Rotation Center Search

Rotation Center Search は、Rotation Center Debug で有望になった `rotationCenter.y` / `rotationCenter.z` を、local search / coordinateDescent / Auto Sequence の探索対象に昇格したものです。

従来は回転中心を `(0, 0, pivotZ)` と仮定していましたが、この仮定では pitch 誤差を `nose.z` / `mouth.z` などが吸収する可能性があります。

Rotation Center Search では、`rotationCenter.y` / `rotationCenter.z` を先に調整し、その後 8 semantic points の z を再探索します。

`rotationCenter` は projection 用の回転中心であり、IdealFace8 `points[].z` に焼き込む値ではありません。既存互換のため `pivotZ` は残しますが、`rotationCenter.z` を探索する candidate では `pivotZ` も同じ値に揃えます。

local search / coordinateDescent の parameter には以下を追加します。

```text
rotationCenter.y
rotationCenter.z
```

Rotation Center Search 用の preset は以下です。

- `Rotation Center Fine`: `rotationCenter.y` / `rotationCenter.z` だけを coordinateDescent で調整する。
- `Rotation Center + 8Point Fine`: `rotationCenter.y` / `rotationCenter.z` を先に調整し、その後 8 semantic points の z を調整する。

Auto Sequence には以下を追加します。

- `Rotation Center Fine Sequence`: `Rotation Center Debug Best` を起点に、Rotation Center Fine → Rotation Center + 8Point Fine → NoseZ Fine → MouthZ Fine を実行する。
- `Natural Nose Rotation Center Sequence`: `Natural Nose With Rotation Center` を起点に、同じ手順で nose.z が自然寄りでも score が出るか確認する。

## Objective Mode

Objective Mode は、探索中にどの評価指標を最小化するかを切り替えるための設定である。

`totalScore` は従来挙動で、全体の 2D 誤差を最小化する。

`balancedScore` は `totalScore` と `maxBucketScore` を組み合わせた既存 debug 指標を最小化する。

`maxBucketScore` は `front` / `yawPositive` / `yawNegative` / `pitchPositive` / `pitchNegative` のうち、最も悪い bucket score を最小化する。これにより、総合平均は良いが一部姿勢だけ破綻する候補を見つけやすくする。

`pitchAverageScore` は `pitchPositive` / `pitchNegative` の平均を、`yawAverageScore` は `yawPositive` / `yawNegative` の平均を最小化する確認用の objective である。

`bestCandidate` と `topCandidates` の ranking は選択中の `objectiveMode` で比較する。JSON には比較に使った `objectiveMode` / `objectiveScore` を出しつつ、従来どおり `totalScore` / `bucketScores` / `scoreDebug` も保持する。

Rotation Center Search の初期確認で `rotationCenter.y` が探索範囲下限に張り付いたため、default range は `rotationCenter.y = -0.24 .. 0.00 / step 0.01`、`rotationCenter.z = 0.02 .. 0.12 / step 0.01` に拡張する。`Rotation Center Fine` 系 preset では `rotationCenter.y = -0.24 .. 0.00 / step 0.005`、`rotationCenter.z = 0.02 .. 0.12 / step 0.005` を使う。

Objective Mode 付き preset として、以下を追加する。

- `Rotation Center Fine - Balanced`
- `Rotation Center Fine - MaxBucket`
- `Rotation Center + 8Point Fine - Balanced`
- `Rotation Center + 8Point Fine - MaxBucket`

Auto Sequence には、以下を追加する。

- `Rotation Center Balanced Sequence`
- `Rotation Center MaxBucket Sequence`
- `Natural Nose Balanced Sequence`
- `Natural Nose MaxBucket Sequence`

## Worker Grid Search

grid search はブラウザ main thread ではなく Web Worker で実行します。
UI thread は import、設定入力、進捗表示、cancel 操作、完了後の結果表示だけを担当します。

- candidate は chunk 単位で処理し、全 candidate の配列は作りません。
- Worker は z 候補 index と pivotZ 候補 index の cursor を進めながら `FittingCandidate8` を逐次生成します。
- main thread へは進捗率、処理済み candidate 数、推定総 candidate 数を返します。
- cancel は Worker へ cancel message を送り、chunk 境界で処理を止めます。
- overall ranking は `topN` 件だけ保持します。
- `bucketRanking` も bucket ごとに `topN` 件だけ保持します。
- Full / Summary JSON export は search completed 後だけ有効にします。
- 処理中の JSON preview は source summary / semantic mapping など軽い情報に留め、巨大な候補配列は生成しません。

GPU / WebGPU による探索はまだ実装しません。現時点では CPU Worker の chunked search を前提にします。

## 今回行わないこと

- alignmentMode による 2D 再フィット
- `weighted_similarity_2d`
- `zProfile`
- `zScale`
- matrix inverse で current landmarks を標準顔座標へ戻す処理
- 478点への拡張
- Runtime への組み込み
- production 用 asset 出力
- Engine schema 変更
- Beauty Studio 変更
- GPU / WebGPU search

## 起動

```bash
npm run start:ideal-face-fitting-lab
```

## Candidate Stability Debug

Candidate Stability Debug は、同じ Auto Sequence を異なる bucket target 数で実行し、候補がフレーム数に対して安定するかを確認するための debug 機能である。

5件 / 8件 / 10件のように評価フレーム数を変えたとき、rotationCenter.y / rotationCenter.z / nose.z / score が大きく揺れる候補は、少数フレームへの過適合または評価データ不足の影響を受けている可能性がある。

最終候補としては、単に少数フレームで score が良い候補ではなく、フレーム数を増やしても rotationCenter と z が安定する候補を優先する。

bucket target preset を指定しても、sourceSummary.bucketCounts が不足している bucket では selected frame 数が不足する。その不足は UI / JSON に記録する。

## Outlier Frame Debug

Outlier Frame Debug は、maxBucketScore を極端に悪化させているフレームを検出するための debug 機能である。

maxBucketScore は候補ランキングの主指標ではなく、外れフレーム検出・品質確認用の指標として扱う。

外れフレーム除外は、スコアを良く見せるためではなく、MediaPipe の検出ズレ、強い表情、ブレ、pose誤差などにより、理想3D顔推定に使うべきでない観測値を取り除くために行う。

外れフレーム除外後も、rawScore と filteredScore の両方を表示・JSON出力する。

初期状態では debugOnly とし、外れ値除外はランキングに反映しない。

## Depth Relation Rule

Depth Relation Rule（奥行き関係ルール）は、2D score だけでは良く見えるが 3D 構造として不自然な候補を検出するための debug / scoring / candidate filtering 機能である。

このラボでは、`z が小さい = 手前`、`z が大きい = 奥` として扱う。そのため、中心側の group は境界側の group より手前にあるべき、という相対的な関係を確認する。

今回は Standard Face（標準顔）や Depth Template（奥行きテンプレート）は使わない。標準顔との差分ではなく、candidate 内の group 同士の相対関係だけを見る。

8 semantic points では以下の group から開始する。

```ts
DEFAULT_DEPTH_RELATION_GROUPS_8 = [
  { id: "noseTip", label: "鼻先", pointIds: ["nose"], aggregation: "median" },
  { id: "cheeks", label: "左右頬", pointIds: ["leftCheek", "rightCheek"], aggregation: "mean" },
  { id: "faceCenter", label: "顔中心", pointIds: ["nose", "mouth", "leftEye", "rightEye"], aggregation: "median" },
  { id: "faceBoundary", label: "顔境界", pointIds: ["leftCheek", "rightCheek", "chin", "headTop"], aggregation: "median" },
]
```

初期 rule は以下である。

- `nose_tip_in_front_of_cheeks`: 鼻先は左右頬より手前。`noseTip.z < cheeks.z - 0.005` を満たさない場合は `hardReject` 対象。
- `face_center_in_front_of_boundary`: 顔中心は顔境界より手前。初期状態では `debugOnly` で、ランキング除外には使わない。

判定式は以下とする。

- `inFrontOf`: `subjectZ < referenceZ - margin`
- `behind`: `subjectZ > referenceZ + margin`
- `near`: `Math.abs(subjectZ - referenceZ) <= margin`

`delta` は `subjectZ - referenceZ` で記録する。`noseTip` vs `cheeks` では、`delta >= -margin` が違反である。

Depth Relation Filtering は Outlier Filtering の後に適用する。スコアの流れは以下である。

1. `rawScore`: 全 frame から計算した生スコア
2. `filteredScore`: Outlier Filtering による外れフレーム除外後スコア
3. `depthFilteredRanking`: Depth Relation Filtering 後のランキング

mode の挙動は以下である。

- `debugOnly`: ランキングには影響しない。`depthRelationDebug` だけを出す。
- `penalty`: `applyToObjectiveScore = true` のときだけ、`objectiveScore = baseObjectiveScore + depthRelationPenalty` とする。
- `hardReject`: `applyToObjectiveScore` とは独立して、`hardReject` rule 違反候補を ranking / local search / coordinateDescent の候補選択から除外する。`applyToObjectiveScore` は penalty を score に加えるかどうかの設定であり、reject の有効・無効には使わない。

除外候補は捨てず、`depthRelationDebug.rejectedCandidates` に最大20件まで保持する。すべて除外された場合、`bestCandidate` は `null` になり、UI は no valid candidate として落ちずに表示する。

Full JSON / Summary JSON には以下を出力する。

```ts
searchSettings.depthRelationFiltering
rawRanking
depthFilteredRanking
bestCandidate.depthRelationDebug
depthRelationDebug.bestCandidateDepthRelation
depthRelationDebug.rejectedCandidateCount
depthRelationDebug.rejectedCandidates
autoSequenceSummary.steps[].depthRelationSummary
autoSequenceSummary.finalCandidate.depthRelationDebug
candidateStabilityDebug.history[].depthRelationSummary
```

Auto Sequence では各 step に現在の Depth Relation Filtering settings を渡す。`mode: hardReject` の場合、各 step の bestCandidate 選択にも反映される。

Natural Nose Balanced Sequence / Natural Nose MaxBucket Sequence は、nose depth relation を自然寄りに保つ確認用 sequence として、step 実行時に以下を明示する。

```text
Depth Relation Filtering enabled = true
Depth Relation mode = hardReject
Depth Relation applyToObjectiveScore = false
```

この設定では penalty は objective score に加えないが、`nose_tip_in_front_of_cheeks` の `hardReject` 違反候補は除外する。

Candidate Stability Debug でも同じ設定を使い、5件 / 8件 / 10件の比較で Depth Relation Rule を満たす候補へ安定して収束するか確認できる。

478 landmarks へ拡張するときも、個別点専用ロジックではなく、group / rule の定義を増やして同じ評価器を使う。
