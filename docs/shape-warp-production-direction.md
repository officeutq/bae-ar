# Shape Warp production direction

このドキュメントは、Shape Warp v1 debug prototype の次に進むための本番候補方針を整理します。

このドキュメントは docs / README / roadmap への反映として始まり、現在は Studio processed preview 限定の WebGL mesh warp v1 prototype まで進んでいます。Production Shape Warp、Runtime renderer integration、renderer lifecycle、shader hardening、MediaPipe face mesh topology の本番整理はまだ行いません。

新しい検証ラインとして、理想モデル動画から姿勢非依存 `idealLandmarks3D` 478点を作るのではなく、各フレームで MediaPipe が実際に返した 478 landmarks を pose / expression 付き reference library として使う [Ideal Reference Mesh Warp Lab](ideal-reference-mesh-warp-lab.md) を追加します。このドキュメントの既存 flow は Projection / CorrectionPlan 系の整理であり、新ラボの reference library / hybrid mesh / adaptive grid 方針は別 docs に分けます。

## 現在の位置づけ

現在の Shape Warp v1 debug prototype は、CorrectionPlan の補正ベクトルを Studio の Processed preview に仮反映するための debug 系統です。CPU radial warp debug に加えて、Studio processed preview 限定の WebGL mesh warp v1 prototype も実装済みです。

```text
CPU radial warp debug:
  - CorrectionPlan の補正ベクトルを画像に接続するための debug prototype
  - Studio processed preview 限定
  - 本番品質 warp ではない
  - 今後も検証・比較用として残す
```

CPU radial warp debug は、各 CorrectionVector の current point 周辺を半径付きでゆるく引っ張る方式です。CorrectionPlan が画像に効くか、補正ベクトルと見た目の関係を観察する目的には有効ですが、顔全体を自然に変形する本番方式としては限界があります。

## Production Shape Warp candidate

Production Shape Warp の本命候補は WebGL mesh warp とします。

```text
Production Shape Warp candidate:
  - WebGL mesh warp を本命候補にする
  - MediaPipe face mesh topology を使った triangle mesh warp を検討する
  - current landmarks を source mesh vertices として扱う
  - CorrectionPlan の target を target mesh vertices として扱う
  - video frame / source canvas を texture として使う
  - 三角形ごとに current -> target へ texture を貼り直す
```

WebGL mesh warp では、画像を直接ピクセル単位で radial に引っ張るのではなく、顔メッシュの三角形を source から target へ変形する方向で検討します。

ただし、MediaPipe 478点だけで warp すると、顔境界や背景の歪み、横向き時の不可視側 landmarks、表情 mismatch による局所破綻が問題になりやすいです。`Ideal Reference Mesh Warp Lab` では、current visible / weighted face landmarks、low-weight face landmarks、face boundary anchors、near-face grid、background grid、screen edge anchors を組み合わせた hybrid mesh / adaptive grid を検証します。

将来の `beauty_filter_asset_v1` では、WebGL mesh warp の mode、`meshWarpStrength`、`temporalSmoothing`、boundary / mask / feather などの実行設定候補を `shapeWarpSettings` セクションとして分離します。`shapeWarpSettings` は renderer / smoothing / boundary の公開設定であり、`idealFace` の形状データや `correctionProfile` の補正強度、`colorLayers` の色加工設定とは混ぜません。

`shapeWarpSettings` はフィルターごとの公開設定であり、WebGL shader、renderer lifecycle、GPU resource 管理、fallback 実装などの Engine 内部実装は含めません。Engine 側は `shapeWarpSettings` を読み取り、実際の renderer / smoothing / boundary 処理を実行します。

## Processing flow

想定する本番処理の流れは以下です。

```text
Camera / video frame
  -> MediaPipe current 478 landmarks
  -> IdealFace 478 Projection
  -> projected ideal imageLandmarks
  -> current-vs-ideal difference
  -> correctionProfile strength / clamp
  -> CorrectionPlan target 478 points
  -> WebGL mesh warp
       source vertices: current landmarks
       target vertices: CorrectionPlan target points
       texture: source video frame
       triangles: MediaPipe face mesh topology
  -> Processed preview / Runtime output
```

CorrectionPlan は姿勢補正を担当しません。顔姿勢への対応は IdealFace Projection の責務です。WebGL mesh warp は、Projection 後に image-normalized coordinate で得られた current landmarks と CorrectionPlan target を使います。

Reference library 方式の検証では、Projection 後の ideal 478 landmarks ではなく、current pose / expression に近い ideal reference frame または topK reference blend を使って target を作ります。この場合も最終的な WebGL mesh warp では、`finalSourceVertices[i]` と `finalTargetVertices[i]` が対応している必要があります。

## Source / target vertices

```text
source vertices:
  current image-normalized landmarks
  video frame 上の現在顔の位置

target vertices:
  CorrectionPlan target
  current + correctionDelta
  current から projected ideal へ少し寄せた位置

texture:
  source video frame / source canvas
```

`source vertices` は、MediaPipe Face Landmarker が検出した現在顔の 478 landmarks です。これは video frame 上の現在顔の位置を表します。

`target vertices` は、CorrectionPlan が各 landmark について計算した `target` です。`target` は `current + correctionDelta` であり、current から projected ideal へ correctionProfile の strength と clamp を通して少し寄せた位置です。

`texture` は source video frame または source canvas です。WebGL mesh warp では、この texture を MediaPipe face mesh topology の三角形ごとに source vertices から target vertices へ貼り直す方向で検討します。

## Coordinate policy

既存の 3 座標系方針と揃えます。

```text
same-unit coordinate:
  - idealLandmarks3D / Projection 内部
  - FacePose rotation / uniform alignment 用
  - WebGL mesh warp に直接使わない

image-normalized coordinate:
  - MediaPipe current landmarks
  - projected ideal imageLandmarks
  - current-vs-ideal difference
  - CorrectionPlan input / output
  - WebGL mesh warp の source / target vertices の元データ

pixel / clip coordinate:
  - WebGL へ渡す前に変換する
  - canvas / texture / viewport に合わせて扱う
```

same-unit landmarks を WebGL mesh warp に直接使ってはいけません。Projection / alignment の内部では same-unit coordinate を使い、Studio overlay / CorrectionPlan / Shape Warp 入力では image-normalized coordinate を使います。WebGL へ渡す直前に、canvas / texture / viewport に合わせて pixel coordinate または clip coordinate へ変換します。

Reference library 方式でも、MediaPipe が返した x / y は image-normalized coordinate として扱います。MediaPipe z は `visibilityWeight` や `warpSafetyWeight` の材料にはできますが、物理奥行きそのものとして絶対視しません。triangle normal、triangle area、triangle flip、source / target area ratio、pose、expression、landmark group を使って、危険な vertex / triangle の変形量を 0.0〜1.0 の連続値で弱めます。

## Staged plan

### Step A: docs / direction

完了済みの docs step です。

- CPU radial warp debug の位置づけを明確にする
- 本番候補を WebGL mesh warp として整理する
- Production renderer はまだ実装しない

### Step B: Studio WebGL mesh warp prototype

Studio processed preview 限定で実装済みの prototype です。

- Studio processed preview 限定
- Engine Runtime 本体への本格統合はまだしない
- current landmarks と CorrectionPlan target を使う
- MediaPipe face mesh topology の triangle indices を使う
- source video frame を texture として扱う
- まずは顔領域のみの mesh warp を試す
- Source preview は元映像のまま残す
- CPU radial debug と切り替え比較できるようにする

### Step C: Runtime renderer integration

さらに後段です。

- Engine Runtime 側の renderer として整理する
- Studio だけでなく本番 Runtime で使える構成を検討する
- WebGL renderer lifecycle / resource disposal / fallback を整理する
- Performance / memory / mobile 対応を検討する

### Step R: Ideal Reference Mesh Warp Lab

別検証ラインです。

- 理想モデル動画の実測 MediaPipe 478 reference library を作る docs 方針を整理する
- Step 1 full reference search、Step 2 weighted reference blend、Step 3 runtime compression を検証する
- `rawIdealReferenceFrames` と `runtimeIdealReferenceLibrary` を分ける
- Runtime 中はメモリ上の `runtimeIdealReferenceLibrary` だけを参照する
- IndexedDB / file / Cache Storage は Runtime 前後の保存・再利用に使い、毎フレーム処理では読まない
- localStorage は UI 設定や選択中 filter id など小さい値だけに使う
- TypeScript 実装、JSON export、validator、Runtime renderer integration はこの docs step では行わない

### Step D: Quality improvements

さらに後段です。

- temporal smoothing
- face boundary handling
- mask / feather
- background / hair / glasses handling
- seam 対策
- expression / pose stability
- correctionProfile authoring との連携

## Undecided / later work

以下はまだ未決定、または後段で扱います。

- MediaPipe topology をどの形で保持するか
- triangle indices の source をどこに置くか
- 顔外の背景をどう扱うか
- 髪・眼鏡・手など顔メッシュ外のものをどう扱うか
- mesh の境界をどう自然にするか
- WebGL1 / WebGL2 の対象
- fallback renderer
- mobile performance
- temporal smoothing の方式
- correctionProfile authoring UI

## Non-goals for this step

このステップでは以下を実装しません。

- Studio WebGL mesh warp v1 prototype の追加修正
- Production shader 実装
- Production triangle mesh warp 実装
- Runtime renderer 実装
- MediaPipe face mesh topology の本番整理
- CPU radial warp の修正
- CorrectionPlan の仕様変更
- correctionProfile の仕様変更
- shapeWarpSettings v1 実装
- beauty_filter_asset_v1 実装
- Authoring Tool の変更
- Shape Warp の本番実装
- Runtime renderer integration
- Layer System
- LayerMaskSpec
- Color Processing
