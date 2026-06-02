# MediaPipe Render Consistency Lab

## 1. 目的

`tools/mediapipe-render-consistency-lab` は、production 用 IdealFace asset を直接作る正式 authoring tool ではありません。

この lab は、Fitting Lab で残った仮説を検証する debug lab（検証用ラボ）です。確認する流れは以下です。

```text
3D478 landmarks
  -> MediaPipe face mesh topology で mesh 化
  -> yaw / pitch / roll で render
  -> rendered image を MediaPipe Face Landmarker に再入力
  -> MediaPipe returned landmarks を取得
  -> geometric projected landmarks と比較
```

確認したい問いは以下です。

- 3D478 を幾何投影した landmarks と、その mesh をレンダリングして MediaPipe に再入力した returned landmarks は一致するのか
- 横向き時の `nose` / `noseBridge` residual は、Fitting Lab の z 推定問題なのか、MediaPipe の画像認識特性なのか
- BAE AR の ideal landmarks は、幾何投影 landmarks を採用すべきか、それとも MediaPipe が理想顔 render をどう認識したかを採用すべきか

この docs は方向性整理であり、Runtime / Studio / IdealFace Authoring Tool / Fitting Lab の実装変更、production asset export、`beauty_filter_asset_v1` schema 変更を伴いません。

現状の `tools/mediapipe-render-consistency-lab` は、MP4 import、auto scan（自動スキャン）、`acceptedFrames`、`thumbnailDataUrl`、MediaPipe metadata summary（MediaPipe メタデータ要約）、`acceptedFrames[].observed12pt`、pose（姿勢） / `expressionSummary`、`manualAdjustmentsByFrame`、`currentReviewIndex`、Debug Console（デバッグコンソール）、Current Frame（現在フレーム）タブ、`poseBucket125`、`frontCandidate` / `expressionTooStrong` badge（補助ラベル）までの debug lab です。production 用 IdealFace asset を作る正式 authoring tool（作成ツール）ではありません。

MediaPipe face mesh topology（顔メッシュ接続情報）での478点 mesh 化、yaw / pitch / roll 指定 render（姿勢指定レンダリング）、rendered image（レンダリング画像）の MediaPipe Face Landmarker 再入力、returned landmarks（返却ランドマーク）と geometric projected landmarks（幾何投影ランドマーク）の比較、alignment / residual evaluation（位置合わせ・残差評価）は未実装です。

## 2. Fitting Lab との違い

Fitting Lab（フィッティング検証ラボ）は、主に以下を評価しました。

```text
candidate 3D
  -> pose projection
  -> projected 2D landmarks
  -> capture current landmarks と比較
```

つまり、Fitting Lab の評価軸は `projectionFitZ`（投影2D landmarks が MediaPipe current landmarks に合うことを優先した z）です。

一方、Render Consistency Lab（レンダー一貫性検証ラボ）は以下を評価します。

```text
candidate 3D
  -> mesh 化
  -> render
  -> MediaPipe re-detection
  -> returned landmarks と geometric projected landmarks を比較
```

つまり、Render Consistency Lab の評価軸は `meshReadyZ`（mesh 化・render・MediaPipe 再検出の前提でも破綻しにくい z）です。

## 3. 用語定義

`projectionFitZ`（投影適合優先 z）:
投影2D landmarks が MediaPipe current landmarks に合うことを優先した z。Fitting Lab の `canonicalDepthBased`（標準顔奥行きベース方式） / `perLandmarkZSearch`（ランドマーク単位 z 探索）は主にこの評価軸で扱いました。

`meshReadyZ`（メッシュ前提 z）:
3D478 を mesh 化・render しても顔表面として破綻しにくく、rendered image（レンダリング画像）を MediaPipe に再入力しても安定して landmarks が返ることを目指した z。

`mesh-ready refinement`（メッシュ化・レンダリング前提で奥行きや形状を整える補正）:
`projectionFitZ` を初期値にしつつ、mesh / render / MediaPipe re-detection（MediaPipe 再検出）前提で奥行きや局所形状を整える補正。

`geometric projected landmarks`（幾何投影 landmarks）:
3D landmarks を yaw / pitch / roll と camera settings（カメラ設定）で機械的に2D投影した landmarks。

`MediaPipe returned landmarks`（MediaPipe 返却 landmarks）:
rendered image を MediaPipe Face Landmarker に通した結果として返ってきた landmarks。

`render consistency`（レンダー一貫性）:
geometric projected landmarks と MediaPipe returned landmarks がどれくらい一致するかを見る評価。

## 4. なぜ projectionFitZ だけでは足りないか

Fitting Lab の `perLandmarkZSearch` は、`canonicalDepthBased` の `baseZ` を起点に各 landmark を1点ずつ探索する debug refinement（検証用の微調整）です。

これは投影評価には有効です。ただし、mesh 前提では1点だけ z が動くと周囲の triangle（三角形ポリゴン）がねじれる可能性があります。projection（投影）では2D点が合っていても、mesh surface（メッシュ表面）として不自然な場合があります。

render image（レンダリング画像）が顔として不自然だと、MediaPipe re-detection（MediaPipe 再検出）で想定外の landmarks が返る可能性があります。そのため、z は projection 前提だけでなく、mesh / render / MediaPipe re-detection 前提でも評価する必要があります。

## 5. ただし smoothing だけではダメ

`meshReadyZ` は単純な smoothing（平滑化）ではありません。

鼻の付け根、鼻筋、唇、顎、目まわりなどには構造上の段差や折れがあります。顔全体をなめらかに均すと、鼻や口の構造が壊れます。

必要なのは `structure-aware mesh-ready depth`（構造認識付きメッシュ前提奥行き）です。局所スパイクや triangle のねじれは抑えますが、顔構造として必要な奥行き差は残します。

## 6. meshReadyZ の基本方針

`meshReadyZ` は `projectionFitZ` を捨ててゼロから作るのではなく、`projectionFitZ` を初期値として使います。

```text
projectionFitZ
  -> mesh-ready refinement
  -> meshReadyZ
```

理由は以下です。

- `meshReadyZ` も最終的には、現在姿勢へ投影したときに MediaPipe current landmarks と大きくズレない必要があります。
- 478点すべての z を同時に探索すると組み合わせ爆発するため、Fitting Lab と同様に同時総当たり探索は採用しません。
- まず `projectionFitZ` を初期値にし、破綻している局所だけを補正します。
- `canonicalDepth`（標準顔奥行き）は正解ではなく、z が暴れすぎないための prior / safety rail（事前分布・安全柵）として扱います。

## 7. meshReadyZ 候補

初期候補は以下です。

```text
Candidate A: projectionFitZ_raw
  Fitting Lab の projectionFitZ をそのまま mesh 化する。
  目的は、どこが破綻するか確認すること。

Candidate B: projectionFitZ_mesh_regularized_v1
  projectionFitZ を起点に、局所スパイクや triangle normal の破綻だけを抑える。
  投影精度を大きく落とさず、mesh としての破綻を減らせるかを見る。

Candidate C: canonical_projection_blend_mesh_ready_v1
  canonicalDepthZ と projectionFitZ を blend する。
  ただし全点同じ alpha ではなく、nose / cheek / boundary / mouth / noseBridge など group ごとに重みを変える余地を残す。
```

ここでいう `triangle normal`（三角形面法線）は、mesh の面の向きを診断するための debug 指標です。ここでいう `blend`（混合）は、production rule（本番採用ルール）ではなく候補比較のための方針です。

## 8. mesh diagnostics

MediaPipe 再解析前に、まず mesh としての診断を行います。この段階は production 判定ではなく debug diagnostic（検証用診断）です。

候補:

```text
neighborZDelta:
  隣接点同士の z 差が大きすぎないか

triangleNormalFlip:
  三角形の面の向きが不自然に反転していないか

localSpike:
  1点だけ針のように飛び出していないか

noseBridgeContinuity:
  鼻筋が途中で不自然に折れていないか

faceBoundaryDepth:
  顔輪郭が手前に出すぎたり奥に行きすぎたりしていないか

depthRelation:
  noseTip は cheek より手前、face center は boundary より手前、などの奥行き関係が守られているか
```

これらの診断は、候補 z を即座に production asset へ昇格するための合否判定ではありません。Render Consistency Lab の中で、破綻箇所を見つけるための debug 指標として扱います。

## 9. render consistency evaluation

mesh diagnostics の次の段階として、render consistency evaluation（レンダー一貫性評価）を行います。

```text
candidate 3D478
  -> mesh 化
  -> render
  -> MediaPipe Face Landmarker に再入力
  -> returned landmarks を取得
  -> geometric projected landmarks と alignment
  -> residual evaluation
```

評価項目:

```text
renderDetectionSuccess:
  MediaPipe が顔を検出できたか

averageResidual:
  平均 residual

maxResidual:
  最大 residual

topResidualLandmarks:
  residual が大きい landmark

noseResidual:
  nose group の residual

noseBridgeResidual:
  noseBridge group の residual

yawPositive / yawNegative comparison:
  左右向きで residual 傾向が変わるか
```

`alignment`（位置合わせ）は、geometric projected landmarks と MediaPipe returned landmarks を比較可能な座標系へ揃える処理です。`residual`（残差）は、対応する landmark 同士のズレ量です。

## 10. 初期マイルストン

初期マイルストンは以下です。

```text
RC-0:
  docs direction / lab responsibility

RC-0.5:
  MP4 import / auto scan / acceptedFrames / thumbnailDataUrl / MediaPipe metadata summary

RC-0.6:
  12pt landmark summary overlay / overlay show-hide toggle

RC-0.7:
  12pt landmark summary manual drag adjustment / observed12pt / adjusted12pt / manualAdjustments

RC-0.8:
  frame navigation prototype / currentFrameIndex / currentTimeSec / manual excludedFrames

RC-1:
  canonical / Fitting Lab candidate 3D478 を読み込み、topology で mesh 化する

RC-2:
  geometric projection と mesh diagnostics を表示する

RC-3:
  simple render を行う

RC-4:
  MediaPipe re-detection を行う

RC-5:
  alignment / residual evaluation を行う

RC-6:
  meshReadyZ candidates を比較する

RC-7:
  pose sweep / batch evaluation を行う
```

RC-0 は docs 整理、RC-0.5〜RC-0.8 の土台と Debug Console / Current Frame / poseBucket125 周辺の review 補助は `tools/mediapipe-render-consistency-lab` に実装済みです。現在は以下を扱います。

- MP4 import
- auto scan（自動スキャン）
- acceptedFrames
- accepted frame ごとの thumbnailDataUrl
- MediaPipe metadata summary
- 12pt landmark summary overlay
- overlay show / hide toggle
- 12pt landmark summary の手動ドラッグ調整
- `acceptedFrames[].observed12pt` / adjusted12pt / manualAdjustments の一時保持
- reset selected / reset all
- frame navigation prototype
- currentFrameIndex / currentTimeSec
- manual excludedFrames
- previous / delete / next controls
- manualAdjustmentsByFrame によるフレーム別手動調整の一時保持
- フレーム移動時に調整済み12点を復元
- `acceptedFrames[].observed12pt` による accepted frame ごとの MediaPipe 解析結果保持
- 同じ accepted frame に戻った場合、`acceptedFrames[].observed12pt` を再利用
- browEyeAnchor 固定による leftEye / rightEye の安定化
- browEyeAnchor を z 推定 / 顔形状推定用の初期推奨 eye point として扱う
- 右側 debug 表示は Debug Console（デバッグコンソール）に統合する
- Console tabs: Summary / 12pt / Adjustments / Scan / Pose / Raw
- 中央はサムネイルと手動調整の作業エリアに寄せる
- auto scan の状態は Scan tab で扱う
- 左ペインは Input / Controls（入力・操作）に整理する
- 状態表示、動画メタ情報、MediaPipe summary は Debug Console に集約する
- Summary タブに File / Video、Status、Current frame、MediaPipe の要約を表示する
- Scan 関連の詳細は Scan タブへ集約する
- MP4 読み込み直後の auto scan prototype
- maxScanDurationSec = 300
- maxScanFrames = 9000
- acceptedFrames
- currentReviewIndex による accepted frame review
- 顔なし / invalid landmarks の破棄
- accepted frame の thumbnail snapshot + observed12pt 保持
- Debug Console の Scan tab
- Debug Console の Pose tab
- 粗い poseBucket 分類は廃止
- yaw / pitch / roll をそれぞれ5分類し、poseBucket125 として扱う
- 125 bucket は将来、姿勢バランスよくフレーム採用するための土台
- frontCandidate は poseBucket125 の center / center / center に付く badge として扱う
- Pose タブは poseBucket125 の全125 bucket を 0件 bucket も含めて表示する
- non-empty bucket は summary count として表示する
- acceptedFrames の expressionSummary
- 表情が大きい frame は excluded にせず、expressionTooStrong badge を付ける

RC-1 以降で実装する場合も、Runtime / Studio / IdealFace Authoring Tool / Fitting Lab の実装を直接変更せず、`tools/mediapipe-render-consistency-lab` の責務として切り分けます。MediaPipe face mesh topology での478点 mesh 化、yaw / pitch / roll 指定 render、rendered image の MediaPipe Face Landmarker 再入力、returned landmarks と geometric projected landmarks の比較、alignment / residual evaluation、mesh diagnostics、`meshReadyZ` candidate 比較、保存 / export / localStorage / JSON download、478点 full landmarks の保持・表示・ドラッグはまだ未実装です。

### eyePointMode

`irisCenter` は従来方式で、虹彩・眼球中心を使います。視線移動に追随するため、z 推定用の eye point としては不安定ですが、比較用として残します。

`eyeContourCenter` は目頭・目尻の目輪郭中心を使います。虹彩中心より安定しますが、まばたきや目の開きには影響されます。

`browEyeAnchor` は目輪郭中心から眉代表点へ少し寄せた、眉と目の間くらいの固定点です。z 推定 / 顔形状推定用の初期推奨とします。

Render Consistency Lab では UI の肥大化を避けるため、現在は `browEyeAnchor` を固定で使います。これは debug lab 側だけの変更であり、`tools/ideal-face-fitting-lab` の既存実装は変更しません。

`frontCandidate` は `frontReference` ではありません。`frontCandidate` は `poseBucket125` が `yaw_center__pitch_center__roll_center` の frame に付く自動判定 badge であり、手動で基準フレームとして確定したものではありません。

`表情を除外` button は廃止しました。`expressionTooStrong` は production の除外判定ではありません。Render Consistency Lab 内で accepted frame をレビューしやすくするための debug / review 補助 badge として扱い、auto scan 時点で `expressionSummary` から判定します。表情が大きい frame でも自動では `excluded=true` にしません。

## Coordinate policy for 12pt and rotationCenter estimation

次回以降の `rotationCenter(0, y, z)`（投影用回転中心）推定では、Render Consistency Lab 内の 12pt（12点要約）と overlay（重ね描画）の座標系を混同しないことを前提にする。

### 1. MediaPipe coordinate

MediaPipe Face Landmarker が返す landmarks は、現コードでは `NormalizedLandmark` として扱う。

- `x` / `y` は image-normalized coordinate（画像正規化座標）であり、画像の左上を基準に `0..1` の範囲で扱う。
- `z` は MediaPipe の `NormalizedLandmark.z` であり、まだ IdealFace Fitting Lab の depth convention（奥行き規約）へ変換していない。
- 現時点の Render Consistency Lab は、MediaPipe canonical face model（MediaPipe 標準顔モデル）を BAE AR の IdealFace として扱わない。

### 2. observed12pt / adjusted12pt

`observed12pt` は MediaPipe 478 landmarks から作る 12pt summary（12点要約）である。

- `observed12pt.x` / `observed12pt.y` は image-normalized coordinate のまま保存する。
- `adjusted12pt` は `observed12pt + manualAdjustmentsByFrame` で作るが、これも image-normalized coordinate のまま扱う。
- `manualAdjustmentsByFrame.dx` / `manualAdjustmentsByFrame.dy` は pixel delta（画面上のピクセル単位の移動量）ではなく、normalized delta（画像幅・高さを `0..1` とした正規化座標での移動量）である。

例: 横幅 1000px の動画で点を 10px 右へ動かした場合、`dx` は `10` ではなく `0.01` になる。

### 3. Canvas overlay

12pt overlay を canvas に描画するときだけ、image-normalized coordinate から canvas pixel coordinate（canvas 内部ピクセル座標）へ変換する。

```ts
canvasX = point.x * canvas.width
canvasY = point.y * canvas.height
```

MP4 frame（MP4 フレーム）を解析する場合、canvas 内部サイズは `video.videoWidth` / `video.videoHeight` に合わせ、`drawImage(video, 0, 0, canvas.width, canvas.height)` で canvas 全域へ描画する。サムネイル復元時も image natural size（画像本来の幅・高さ）を canvas 内部サイズにして全域描画する。

保存値、Debug Console（デバッグコンソール）、Raw JSON（生 JSON）は、この overlay 用 pixel coordinate ではない。

### 4. Raw JSON

Debug Console / Raw JSON に出る 12pt は image-normalized coordinate である。

- `observed12pt` は pixel coordinate（ピクセル座標）へ変換済みではない。
- `adjustedLandmarkSummary` も pixel coordinate へ変換済みではない。
- `manualAdjustments` / `manualAdjustmentsByFramePreview` の `dx` / `dy` も normalized delta のままである。

### 5. rotationCenter estimation

`rotationCenter(0, y, z)` 推定では、screen pixel coordinate（画面ピクセル座標）を入力に使わない。

- 入力元は normalized（正規化済み）の `adjusted12pt` とする。
- 推定時は `x` に video aspect ratio（動画の横幅÷高さ）を掛けた aspect-corrected image coordinate（横縦比補正済み画像座標）を使う。
- 今回の rotationCenter / 12pt z simultaneous estimation（回転中心と12点奥行きの同時推定）では、face bounds center（顔外枠中心）を引かず、顔幅でも割らない。
- `rotationCenter.y` / `rotationCenter.z` は screen pixel coordinate ではなく、base12pt 3D candidate（基準12点3D候補）と同じ local candidate coordinate（候補内ローカル座標）の pivot（回転軸点）として扱う。

このため、overlay 用に `point.x * canvas.width` / `point.y * canvas.height` した値を、そのまま `rotationCenter` 推定の比較入力へ渡してはいけない。

### 6. 危険な混同ポイント

- Raw JSON の 12pt を pixel coordinate と誤解しない。
- `manualAdjustmentsByFrame.dx` / `manualAdjustmentsByFrame.dy` を pixel delta と誤解しない。
- overlay 用 pixel 変換値を `rotationCenter` 推定入力に使わない。
- MediaPipe `NormalizedLandmark.z` を、そのまま Fitting Lab の depth convention と同一視しない。
- 16:9 以外の動画では、CSS display size（CSS 表示サイズ）、canvas backing size（canvas 内部サイズ）、pointer mapping（ポインター位置変換）、`object-fit: contain`（表示領域への収め方）の差に注意する。

## 11. 今回やらないこと

今回は以下を行いません。

- Runtime 実装変更
- Studio 実装変更
- IdealFace Authoring Tool 実装変更
- Fitting Lab 実装変更
- production asset export
- `beauty_filter_asset_v1` schema 変更
- 12点手動調整の保存 / export
- 除外フレームの保存 / export
- localStorage / JSON download
- 無制限の全フレーム事前スキャン
- 478点 full landmarks の保持・表示・ドラッグ
- MediaPipe face mesh topology（顔メッシュ接続情報）での478点 mesh 化
- yaw / pitch / roll 指定 render（姿勢指定レンダリング）
- rendered image（レンダリング画像）の MediaPipe Face Landmarker 再入力
- returned landmarks（返却ランドマーク）と geometric projected landmarks（幾何投影ランドマーク）の比較
- alignment / residual evaluation（位置合わせ・残差評価）
- mesh diagnostics（メッシュ診断）
- `meshReadyZ` candidate 比較
- FLAME / 3DMM 導入
- NeRF / Gaussian Splatting 導入

Render Consistency Lab は、最初から production asset を作る工程ではありません。まず、Fitting Lab の `projectionFitZ` と、mesh / render / MediaPipe re-detection 前提の `meshReadyZ` の違いを観察できる debug lab として扱います。

## 12. 既存 docs との整合性

この方針は以下の既存 docs と整合させます。

- [IdealFace Fitting Lab Experiment Summary](ideal-face-fitting-lab-experiment-summary.md)
- [IdealFace Fitting Lab](ideal-face-fitting-lab.md)
- [MediaPipe Render Consistency Lab rotationCenter study](mediapipe-render-consistency-lab-rotation-center-study.md)
- [MediaPipe Render Consistency Lab rotationCenter / 12pt z simultaneous estimation design](mediapipe-render-consistency-lab-rotation-center-z-estimation-design.md)
- [MediaPipe Canonical Lab](mediapipe-canonical-lab.md)
- [開発フロー](development-flow.md)
- [アーキテクチャ](architecture.md)
- [README](../README.md)

特に、以下の既存方針を崩しません。

- Fitting Lab は production asset を作る正式 authoring tool ではありません。
- Render Consistency Lab も最初は debug lab です。
- Engine Runtime に authoring / generation logic（作成・生成ロジック）を入れません。
- IdealFace Authoring Tool の Step 2-I production 本線を直接変更しません。
- MediaPipe canonical face model そのものを BAE AR IdealFace として採用しません。
- MediaPipe returned landmarks を検証しますが、それを即 production asset に昇格しません。

## UI 方針: Debug Console の役割整理

- Debug Console に Current Frame（現在フレーム）タブを追加
- 現在表示中フレームの review position / badges / pose / MediaPipe summary / expression summary / 12pt count / manual adjustment count を Current Frame タブへ集約
- Summary は全体要約、Pose は姿勢集計、Scan は auto scan 状態、12pt は12点詳細、Adjustments は手動調整詳細に役割分担する

## UI 方針: poseBucket125

- 粗い poseBucket 分類は廃止
- yaw / pitch / roll をそれぞれ5分類し、poseBucket125 として扱う
- 125 bucket は将来、姿勢バランスよくフレーム採用するための土台
- frontCandidate は poseBucket125 の center / center / center に付く badge として扱う
- Pose タブでは poseBucket125 の全125 bucket を 0件 bucket も含めて表示する
- nonEmptyBucketCount は summary count として表示する
- 125 bucket の一覧は将来の均等採用の確認用であり、現時点では採用処理は行わない
- poseBucket125 の center は正面候補の意味を保つため、yaw / pitch / roll とも ±3 に固定する
- small / large の境界は yaw / pitch / roll 個別に設定できる
- 現在の `poseBucket125` 閾値は、yaw: `centerAbsMax = 3`, `negativeSmallMax = 10`, `positiveSmallMax = 10`
- 現在の `poseBucket125` 閾値は、pitch: `centerAbsMax = 3`, `negativeSmallMax = 10`, `positiveSmallMax = 6`
- 現在の `poseBucket125` 閾値は、roll: `centerAbsMax = 3`, `negativeSmallMax = 10`, `positiveSmallMax = 10`
- この閾値は review / coverage 診断用であり、production の最終分類ではない

## UI 方針: pose review candidates

- `125候補フレーム抽出` は、acceptedFrames から pose review candidate（姿勢レビュー候補）を作る debug / review 補助です。
- selectionMode（選択モード）は `balanced` を基本にします。
- yaw × pitch の25 bucket を primaryGrouping（主分類）とし、`maxTargetPerBucket = 5` から `4`、`minBalancedTargetPerBucket = 3` の順に試します。
- 全25 bucket が満たせた最初の `actualTargetPerBucket` を採用し、満たせない場合は target 3 の partial balanced result（部分均等結果）として shortage bucket（不足bucket）を表示します。
- `expressionTooStrong` は常に除外し、fallback（補充）にも使いません。
- pose review candidate 抽出は rotationCenter(0, y, z) 推定向けの候補作成として扱います。
- primary grouping（主分類）は yaw × pitch の25 bucket のままにします。125 bucket は Pose タブの coverage map（姿勢カバレッジ確認）として残し、必須採用単位にはしません。
- roll は完全除外や単純 fallback ではなく、`roll_negative` / `roll_center` / `roll_positive` の3 group（グループ）でバランスを取ります。
- `roll_negative` は `negativeLarge` / `negativeSmall`、`roll_center` は `center`、`roll_positive` は `positiveSmall` / `positiveLarge` として扱います。
- 候補過多の bucket では `pickEvenlySpaced` により timeSec（秒）方向に均等抽出します。
- Candidates tab（候補タブ）には Shortage buckets（不足bucket）診断を表示し、不足した yaw / pitch bucket だけを集約して確認できるようにします。
- Shortage buckets（不足bucket）診断では、acceptedFrames 件数、`expressionTooStrong` 除外後の usable frame（利用可能フレーム）件数、roll group（rollグループ）別の available / selected count（利用可能 / 選択件数）を表示します。
- `shortageReason` は `not_enough_pose_frames`（その姿勢のフレーム不足）、`not_enough_non_expression_frames`（表情が強くないフレーム不足）、`unknown`（原因未分類）を使います。
- この診断は rotationCenter(0, y, z) 推定に使う候補フレームの品質確認用で、`expressionTooStrong` 除外後に不足する bucket を見つけるための表示です。
- この機能は候補抽出と Debug Console（デバッグコンソール）表示までを扱い、mesh / render / MediaPipe re-detection / residual evaluation には進みません。

## UI 方針: Rotation Fit debug UI

- `Rotation Fit（回転中心評価）` タブは一時的な debug UI（検証用 UI）です。
- 固定 `rotationCenter` と `rotationFitDebugPreset_provisional_v1` の固定 12pt z preset（12点奥行きプリセット）を使い、projected12pt（投影後12点）と adjusted12pt（手動調整後12点）の score evaluator（スコア評価器）が接続できるかを確認します。
- 評価座標は aspect-corrected image coordinate（横縦比補正済み画像座標）で、`x = adjusted12pt.x * videoAspectRatio`、`y = adjusted12pt.y` とします。pixel coordinate（ピクセル座標）、face bounds center（顔外枠中心）、顔幅 normalization（正規化）は使いません。
- rotationCenter.y/z 探索、12pt z 探索、coordinate descent（座標降下法）などの本格探索は後段で扱います。
