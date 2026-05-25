# Shape Warp production direction

このドキュメントは、Shape Warp v1 debug prototype の次に進むための本番候補方針を整理します。

今回は docs / README / roadmap への反映だけを行います。WebGL 実装、mesh warp 実装、renderer 実装、shader 実装、MediaPipe face mesh topology の実装はまだ行いません。

## 現在の位置づけ

現在の Shape Warp v1 debug prototype は、CorrectionPlan の補正ベクトルを Studio の Processed preview に仮反映するための CPU radial warp debug です。

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

## Staged plan

### Step A: docs / direction

今回のステップです。

- CPU radial warp debug の位置づけを明確にする
- 本番候補を WebGL mesh warp として整理する
- WebGL / mesh / renderer はまだ実装しない

### Step B: Studio WebGL mesh warp prototype

次以降の実装候補です。

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

- WebGL 実装
- shader 実装
- triangle mesh warp 実装
- renderer 実装
- MediaPipe face mesh topology 実装
- CPU radial warp の修正
- CorrectionPlan の仕様変更
- correctionProfile の仕様変更
- Authoring Tool の変更
- Shape Warp の本番実装
- Layer System
- LayerMaskSpec
- Color Processing
