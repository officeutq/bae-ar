# Ideal Reference Mesh Warp Lab

## 目的

`Ideal Reference Mesh Warp Lab`（理想参照メッシュワープ検証ラボ）は、理想モデル動画から得られる実測 MediaPipe 478 landmarks を pose / expression 付き reference library として使い、ライブ current frame に近い reference を選んで mesh warp する方式を検証する debug / research lab です。

候補ディレクトリ名:

```text
tools/ideal-reference-mesh-warp-lab
```

このラボは production 用 authoring tool ではありません。Engine Runtime、Beauty Studio、IdealFace Authoring Tool、Runtime renderer へ直接統合する前に、方式の成立性、破綻条件、必要な debug 表示、library 圧縮方針を切り分けて確認するための検証場所です。

## 背景

これまでの検証では、理想モデル動画から `idealLandmarks3D` 478点を作成し、Runtime で現在顔の `FacePose` へ投影し、MediaPipe current 478 landmarks と projected ideal 478 landmarks の差分で Shape Warp する方針を扱ってきました。

ただし、理想モデル動画から MediaPipe に対応する理想顔 478点そのものを安定して作ることには難所があります。

- MediaPipe returned landmarks は、幾何投影 landmarks と一致するとは限らない。
- MediaPipe landmark.z は物理的な奥行きそのものではない。
- 横向き、上下向き、表情ありでは、478点すべてを同じ信頼度で扱えない。
- 見えていない側の cheek / jaw / boundary などを無理に warp に使うと破綻しやすい。
- 理想顔 3D478 を作り、それを任意 pose へ投影する方式は難所が多い。

このため、新しい検証ラインとして、理想顔 3D478 を作るのではなく、理想モデル動画の各フレームで MediaPipe が実際に返した 478 landmarks を reference frame として保存し、Runtime 実験では current frame に近い reference を選ぶ方式を整理します。

## 旧 IdealFace 3D478 方針との違い

旧方針:

```text
理想モデル動画
  -> 理想3D顔 / idealLandmarks3D 478点を作る
  -> Runtime で現在 pose へ投影
  -> current 478 と projected ideal 478 の差分で warp
```

新方針:

```text
理想モデル動画
  -> 全フレームを MediaPipe に通す
  -> 各フレームの実測 MediaPipe 478 landmarks / pose / blendshapes を保存
  -> ideal reference library を作る

ライブ中:
  -> current frame を MediaPipe に通す
  -> current 478 / pose / blendshapes を取得
  -> pose / expression が近い ideal reference frame を検索
  -> current visible / weighted landmarks と ideal reference landmarks を対応
  -> 必要に応じて顔外側 grid を追加
  -> hybrid mesh を作る
  -> WebGL mesh warp で加工する
```

このラボで扱う reference library は `IdealFace 3D478` ではありません。

NG:

```text
理想モデル動画から姿勢非依存の idealLandmarks3D 478点を作る
```

OK:

```text
理想モデル動画の各フレームで MediaPipe が実際に返した 478点を、
pose / expression 付き reference frame として保存する
```

つまり、旧方針は `ideal 3D model -> 任意 pose へ投影` でした。新方針は `ideal video frame library -> 近い pose / expression の実測 landmarks を参照` です。

重要:

- 理想顔メッシュを Runtime で回転・render・MediaPipe 再検出する方針ではない。
- 理想顔 3D478 を作る方針ではない。
- 理想モデル動画の各フレームで MediaPipe が実際に返した landmarks を、pose / expression 付き reference として使う。
- Runtime 実験では current frame に近い ideal reference を選ぶ。
- 478点すべてを同じ信頼度で使わない。
- 見えていそうな点 / 使えそうな点を中心にし、危険な点や triangle は変形を弱める。
- 顔外側と背景は grid / anchor で支える。
- 最終的な mesh warp では、source / target の対応頂点を作る。

## 新方針: ideal reference library

`ideal reference library` は、理想モデル動画を MediaPipe 解析した結果を frame 単位で保存したものです。各 frame は、landmarks だけでなく pose / expression / quality / visibility weights を持ちます。

保持する候補:

- `landmarks478`
- yaw / pitch / roll
- blendshapes
- `expressionGroup`
- `visibilityWeights`
- `qualityScore`
- frame index / timestamp

この library は、理想顔の姿勢非依存 canonical 形状ではなく、MediaPipe が実際の画像から返した pose 付き観測値の集合です。

## 事前処理: ideal model video scan

事前処理では、理想モデル動画の全フレームまたは十分なサンプルを MediaPipe Face Landmarker に通します。初期 prototype では最大10000フレーム程度の raw library を許容し、速度や容量よりも debug しやすさを優先します。

処理:

```text
ideal model video
  -> MediaPipe Face Landmarker
  -> landmarks478 / pose / blendshapes
  -> expressionGroup 推定
  -> visibilityWeights 推定
  -> qualityScore 計算
  -> rawIdealReferenceFrames へ保存
```

この段階では、Runtime 用に最適化しません。まずは「近い reference が見つかると current face に対して自然な target を作れるか」を確認します。

## Runtime flow

ライブ中の検証 flow:

```text
current frame
  -> MediaPipe Face Landmarker
  -> current landmarks478 / pose / blendshapes
  -> pose / expression が近い ideal reference frame を検索
  -> current landmarks と ideal reference landmarks を対応させる
  -> visibilityWeight / warpSafetyWeight を使って補正を重み付けする
  -> 必要に応じて face boundary anchors / near-face grid / background grid を追加する
  -> finalSourceVertices / finalTargetVertices を作る
  -> WebGL mesh warp
```

Runtime 中に IndexedDB / localStorage を毎フレーム読みません。ライブ開始前に `runtimeIdealReferenceLibrary` をメモリへ展開し、毎フレーム処理ではメモリ上の TypedArray / JS object だけを参照します。

## Visibility / warp safety weights

docs では「見えている / 見えていない」と「信頼できる / 信頼できない」を混同しません。以下の2つを分けて扱います。

```text
visibilityWeight:
  その vertex / triangle が現在姿勢で画像上に見えていそうかを表す近似スコア。
  厳密な可視判定ではない。

warpSafetyWeight:
  その vertex / triangle を変形に使って破綻しにくいかを表す安全係数。
  真の信頼度ではなく、危険条件で変形量を弱めるための係数。
```

`visibilityWeight` は、MediaPipe の x / y / 仮 z から計算した triangle normal や triangle area を材料にできます。ただし MediaPipe z は物理奥行きそのものではないため、絶対視しません。

`warpSafetyWeight` には、yaw / pitch / roll、triangle area、triangle flip、source / target area ratio、landmark group、expression state、temporal stability などを使います。最初から二値で「使う / 使わない」にせず、0.0〜1.0 の連続値で扱います。

例:

```text
visibilityWeight:
  1.0 = かなり見えていそう
  0.5 = 見えているが不安定そう
  0.1 = かなり危険
  0.0 = 使わない

warpSafetyWeight:
  pose / expression / triangle shape / region / temporal stability から計算する破綻回避係数
```

設計上の注意:

- MediaPipe z は visibility / safety の材料の1つであり、物理奥行きの正解ではない。
- 横向き時の反対側 cheek / jaw / boundary は低 weight または変形弱めにする。
- mouth / eye 周辺は expression mismatch の影響が強いため、pose が近くても expression が遠い場合は補正を弱める。
- triangle flip や source / target area ratio の急変は、強い破綻シグナルとして扱う。

## Hybrid mesh / adaptive grid

MediaPipe 478点だけで mesh warp するのではなく、顔外側と背景を含む hybrid mesh を検討します。

```text
Hybrid Warp Mesh

├─ current visible / weighted face landmarks
├─ low-weight face landmarks
├─ face boundary anchors
├─ near-face grid
├─ background grid
└─ screen edge anchors
```

grid は最初から source / target で個別に作る必要はありません。最終的な mesh warp 前に adaptive に追加してよい方針です。

重要:

- `finalSourceVertices[i]` と `finalTargetVertices[i]` は最終的に対応している必要がある。
- grid 点は顔内部の変形を背景へなだらかに逃がすために使う。
- 顔内部は強く変形してよい。
- 顔境界は中程度にする。
- 顔のすぐ外側は弱く追従させる。
- 背景はほぼ固定する。
- 画面端は固定する。
- 背景を大きく歪ませない。

重みの直感:

```text
face inner landmarks:
  correction strength high

face boundary:
  correction strength medium

near-face grid:
  weak follow

background grid:
  nearly fixed

screen edge anchors:
  fixed
```

## Step 1: Full Reference Search

目的:

```text
最大10000フレームの ideal reference frames を保持し、
ライブ current frame に対して pose / expression が近い ideal frame を全探索する。
```

内容:

- 理想モデル動画の全フレームを MediaPipe 解析する。
- 各 frame について `landmarks478`、yaw / pitch / roll、blendshapes、`expressionGroup`、`visibilityWeights`、`qualityScore`、frame index / timestamp を保存する。
- Runtime 実験では current pose / expression に近い ideal frame を top1 または topK で検索する。
- この段階では最適化しない。
- 速度ではなく、方式の成立性を見る。

debug で見るもの:

- selected ideal frame
- `poseDistance`
- `expressionDistance`
- `qualityScore`
- current vs ideal difference
- visible / weighted subset
- warp result
- reference coverage

Step 1 では、検索が重くてもよいです。成立性が見えない段階で premature optimization を行わず、どの pose / expression で破綻するかを先に調べます。

## Step 2: Weighted Reference Blend

目的:

```text
top1 ideal frame だけでは切り替わりが不安定になるため、
pose / expression の近さに応じて topK reference frames を重み付き合成する。
```

内容:

- `matchScore` を計算する。
- topK frame を選ぶ。
- 近い frame ほど大きい weight を持つ。
- weighted average で ideal reference landmarks を作る。
- match confidence が低い場合は shape correction strength を弱める。
- expression が近い reference がない場合は mouth / eye 周辺の補正を弱める。
- pose が近い reference がない場合は全体 shape 補正を弱める。

例:

```text
matchScore =
  poseDistance
+ expressionDistance
+ qualityPenalty
+ visibilityMismatchPenalty
```

weighted blend の出力は、姿勢非依存の理想顔ではなく、current frame に対する一時的な target reference です。表情 mismatch がある領域は、topK blend 後でも `warpSafetyWeight` で弱めます。

## Step 3: Runtime Compression

目的:

```text
最大10000フレームの raw library をそのまま Runtime へ載せず、
使用頻度・pose coverage・expression coverage・quality に基づいて代表フレームへ圧縮する。
```

内容:

- Step 1 / Step 2 の実験ログから、実際に使われた ideal frames を集計する。
- 似た frame を clustering する。
- pose / expression bucket ごとに代表 frame を残す。
- runtime library は 100〜300 frames 程度を目標にする。
- `rawIdealReferenceFrames` と `runtimeIdealReferenceLibrary` を分ける。

代表 frame 選抜の候補軸:

- 使用頻度
- pose coverage
- expression coverage
- `qualityScore`
- visibility coverage
- mouth / eye など expression-sensitive region の安定性
- compression 後の match confidence 低下量

## Raw library と runtime library の分離

```text
rawIdealReferenceFrames:
  理想モデル動画の全解析結果。
  最大10000フレームを想定。
  Authoring / debug / 再選抜用。
  大きくてよい。

runtimeIdealReferenceLibrary:
  Runtime で使う代表フレームだけ。
  100〜300フレーム程度を目標。
  ライブ中はメモリへ展開して使う。
```

`rawIdealReferenceFrames` は検証と再選抜のために保持し、Runtime 配布物へそのまま載せる前提にはしません。`runtimeIdealReferenceLibrary` は、ライブ中の参照に必要な最小代表集合として別に作ります。

## Storage policy: memory / IndexedDB / localStorage

Runtime 中:

```text
メモリ一択
```

Runtime 前後:

```text
IndexedDB / file / Cache Storage などで保存・再利用
```

方針:

- ライブ中の Runtime 処理ではメモリ上の `runtimeIdealReferenceLibrary` だけを参照する。
- 毎フレーム処理で IndexedDB / localStorage を読まない。
- localStorage には MediaPipe 478 library を保存しない。
- localStorage は UI 設定や選択中 filter id など小さい値だけに使う。
- raw / runtime library の保存には IndexedDB またはファイル保存を検討する。
- ライブ開始前に `runtimeIdealReferenceLibrary` を読み込み、TypedArray / JS object としてメモリ展開する。

## Storage / compression policy

初期 prototype:

```text
- JSON でよい
- 最大10000 frame の raw library を保持してよい
- 速度より検証しやすさを優先する
```

後段:

```text
- 小数丸め
- face-local normalized coordinate
- Float32Array / Int16Array
- quantized binary
- thumbnail は Runtime asset に含めない
- visibilityWeight は uint8 などで圧縮可能
```

prototype では、読みやすさ、diff しやすさ、debug しやすさを優先します。production candidate では、Runtime memory、download size、decode cost、mobile performance を見て binary / quantization を検討します。

## Data model sketch

短い JSON 例:

```json
{
  "schemaVersion": "ideal_reference_library_v1",
  "source": {
    "type": "ideal_model_video",
    "frameCount": 10000
  },
  "frames": [
    {
      "frameId": "frame_000001",
      "timeSec": 0.033,
      "pose": {
        "yaw": 1.2,
        "pitch": -0.5,
        "roll": 0.3
      },
      "expression": {
        "group": "neutral",
        "blendshapes": {}
      },
      "landmarks478": [],
      "visibilityWeights": [],
      "qualityScore": 0.92
    }
  ],
  "runtimeSelection": {
    "targetFrameCount": 300,
    "strategy": "pose_expression_quality_coverage"
  }
}
```

これは data model sketch であり、今回の PR では JSON export、validator、schema、Runtime parser は実装しません。

## Debug views

初期 debug で見たいもの:

- current frame landmarks overlay
- selected ideal reference frame
- topK reference frames
- `poseDistance`
- `expressionDistance`
- `qualityScore`
- match confidence
- current vs ideal difference vectors
- visibility / weighted subset overlay
- triangle normal / triangle area diagnostics
- source / target area ratio
- low safety triangle highlight
- hybrid mesh vertices / anchors / grid
- finalSourceVertices / finalTargetVertices correspondence
- warp result
- reference coverage map
- raw library vs runtime library の frame count

Studio / Authoring Tool へ入れる前に、Lab 内の debug UI で「何が選ばれ、どの点がどの重みで使われ、どの triangle が危険か」を確認できるようにします。

## 未実装項目

今回の docs 方針整理では、以下を実装しません。

- 新 tool の実装
- MediaPipe 実行処理
- WebGL mesh warp 実装
- Runtime renderer integration
- JSON export 実装
- IndexedDB 実装
- compression 実装
- validator 実装
- TypeScript 実装
- Engine 実装
- Studio 実装
- Authoring Tool UI 実装

## 今後の検証ポイント

- top1 reference search だけで成立する pose / expression 範囲はどこか。
- topK weighted blend で reference 切り替わりの揺れを減らせるか。
- expression mismatch 時に mouth / eye 周辺をどれくらい弱めるべきか。
- visibilityWeight と warpSafetyWeight を分けることで破綻が減るか。
- 478点のうち、横向き時に使うと危険な group / triangle はどこか。
- face boundary anchors / near-face grid / background grid で背景歪みを抑えられるか。
- raw 10000 frames から runtime 100〜300 frames へ圧縮しても match confidence を維持できるか。
- Runtime 前の library load / decode / memory 展開が mobile で許容できるか。
- localStorage を小さい UI 設定だけに限定し、library 保存を IndexedDB / file / Cache Storage へ分けられるか。
- 既存の `IdealFace` / `correctionProfile` / `shapeWarpSettings` / `beauty_filter_asset_v1` 方針とどう接続するか。

## 関連ドキュメント

- [概要](overview.md)
- [アーキテクチャ](architecture.md)
- [Shape Warp production direction](shape-warp-production-direction.md)
- [MediaPipe Render Consistency Lab](mediapipe-render-consistency-lab.md)
- [usage-aware frame sampling v1](usage-aware-frame-sampling-v1.md)
- [beauty_filter_asset_v1 direction](beauty-filter-asset-v1.md)
- [BAE AR Beauty Engine 仕様書 / ロードマップ 2026-05](bae_ar_beauty_engine_spec_and_roadmap_2026_05.md)
