# Ideal Reference Mesh Warp Lab

## 目的

`tools/ideal-reference-mesh-warp-lab` は、理想モデル動画から作る実測 MediaPipe 478 reference library と、ライブ動画を current face 代わりにした matching 検証のための debug / research lab です。

このラボは production 用 authoring tool ではありません。Engine Runtime、Beauty Studio、IdealFace Authoring Tool、Runtime renderer へ直接統合する前に、reference library と matching の成立性を確認するための検証場所です。

## 現在の本線

現在の本線として残す範囲は PR4b 相当です。

```text
model video
  -> MediaPipe scan
  -> rawIdealReferenceFrames
  -> accepted / excluded frame 管理
  -> accepted frame review
  -> 478点 overlay

live video
  -> current frame MediaPipe analysis
  -> current478 / pose / expression
  -> current478 overlay

current
  -> accepted raw ideal reference frames から top1 reference matching
```

実装済みとして扱うもの:

- 3ペインUI
- モデル動画読み込み
- ライブ動画読み込み
- モデル動画 MediaPipe 解析
- `rawIdealReferenceFrames` 作成
- accepted / excluded frame 管理
- モデル動画 accepted frame review
- モデル動画 478点 overlay
- ライブ動画 current frame 解析
- `currentLiveFrameAnalysis`
- ライブ動画 current478 overlay
- top1 reference matching
- Matching / Summary / Raw の top1 matching debug
- `modelFaceLandmarker` / `liveFaceLandmarker` 分離
- stream ごとの単調増加 timestamp counter
- モデル動画解析後の `modelFaceLandmarker` dispose

## 本線から外したもの

PR5 以降で試した以下は、本線から撤去します。

- `alignedIdeal` 478点を最終 target として扱う処理
- current -> aligned ideal の 478点全体 displacement debug
- displacement overlay
- raw displacement mesh warp
- `rawWarpOnly` / `sideBySide` preview
- raw warp strength UI
- texture upload flip / texture V formula UI
- raw warp coordinate debug
- sample vertex debug
- WebGL raw warp renderer helper

`alignedIdealLandmarks` は最終 warp target ではありません。top1 / topK ideal reference を current face へ位置合わせした target 候補です。

## 用語

```text
alignedIdealLandmarks:
  top1 / topK ideal reference を current face へ位置合わせした target 候補。
  最終 warp target ではない。

weightedFaceTargets:
  visibility / safety / expression / boundary を反映して、実際に顔側で使う target 候補。

finalSourceVertices / finalTargetVertices:
  weightedFaceTargets と grid / anchors を統合した、最終 mesh warp 入力。
```

禁止:

- `alignedIdeal` 478点をそのまま `finalTargetVertices` として使わない。
- 478点すべてを同じ信頼度で raw displacement warp に流さない。

## 次の本線

Next mainline prototype:

```text
finalSourceVertices / finalTargetVertices prototype
```

Step 1:

```text
top1 ideal reference から alignedIdealLandmarks を作る
```

Step 2:

```text
current landmarks ごとに landmarkUsageWeight を計算する

初期実装では簡易でよい:
  - face boundary は弱める
  - mouth / eyes は表情時に弱める
  - 大きすぎる displacement は弱める
  - 危険点は current 維持
```

Step 3:

```text
weightedFaceTargets を作る
target = lerp(current, alignedIdeal, landmarkUsageWeight)
```

Step 4:

```text
near-face grid / background grid / screen edge anchors を追加する
```

Step 5:

```text
finalSourceVertices / finalTargetVertices を作る
```

Step 6:

```text
まずは warp せず、final vertices の overlay / summary を確認する
```

## 未実装

- `finalSourceVertices` / `finalTargetVertices` prototype
- `visibilityWeight` / `warpSafetyWeight`
- grid / anchor
- topK weighted blend
- production mesh warp
- WebGL warp 修正
- full-frame processed preview
- Runtime renderer integration
- Engine Runtime 変更
- Beauty Studio 変更
- IdealFace Authoring Tool 変更
- IndexedDB 保存
- JSON export / import
- validator

## 関連ドキュメント

- [概要](overview.md)
- [開発フロー](development-flow.md)
- [Repository structure](repository-structure.md)
- [Shape Warp production direction](shape-warp-production-direction.md)
