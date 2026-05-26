# usage-aware frame sampling v1

## 目的

`usage-aware frame sampling v1` は、IdealFace Authoring Tool の MP4 detailed scan / Step 2-I-A frame selection で、単純に一定数の frame を抽出するのではなく、用途別に必要な frame をバランスよく集めるための docs 方針です。

対象は IdealFace Authoring Tool の authoring workflow です。Engine Runtime、Beauty Studio、JSON export、validator、Runtime renderer、Layer System にはまだ実装しません。

## 背景

現在の IdealFace Authoring Tool では、MP4 input、detailed scan、Step 2-I-A frame selection、1フレーム1カード UI、Frame Review Carousel、`frontReference` / `useForInference` / `expressionGroup` / `excluded` の用途タグ管理まで実装済みです。

`frontReference` / `useForInference` / `expressionGroup` は重複可能な用途タグです。`excluded` だけは排他的で、除外済み frame は正面基準 / 推定 / 表情解析の処理対象から外れます。`poseOutOfRange` は自動除外ではなく warning / 注意タグとして扱い、pose-aware 3D 推定に使える可能性を残します。

現在の課題は、`maxScanFrames` が 150 程度だと、正面基準、IdealFace 本体生成用、pose coverage 用、表情解析用を十分にカバーしきれないことです。一方で、単純に frame 数を増やすだけでは、mouthSmile など特定表情ばかり大量に集まる可能性があります。noFace / invalidLandmarks など使えない frame も混ざります。

そのため v1 では、detailed scan した frame を `frontReferenceCandidate` と用途 bucket へ分類します。`frontReferenceCandidate` は正面基準に良さそうな自動候補の提示であり、最終的な `frontReference` はユーザーが Frame Review Carousel / frame card で手動選択します。

## 基本方針

```text
MP4 を順に detailed scan する
  -> 各 frame の face detection / landmarks / blendshapes / pose / confidence を確認する
  -> 使えない frame は excluded
  -> 使える frame を frontReferenceCandidate と用途候補に分類する
  -> frontReferenceCandidate は手動選択用の候補として提示する
  -> idealFaceInference / expression groups は用途別 bucket に必要数まで採用する
  -> ある用途が targetCount に達したら、その用途では以後採用しない
  -> ただし、同じ frame が他の不足用途に使える場合は、その用途には採用できる
  -> 全用途が十分に満たされたら早期終了できる
```

frame を単一カテゴリに分類しません。`frontReference` / `useForInference` / `expressionGroup` は用途タグとして重複可能です。`excluded` だけは排他的です。ただし `frontReference` は自動採用 bucket ではなく、手動選択される正面基準です。

ある bucket が `targetCount` に達していても、frame 自体を完全に捨てるわけではありません。その用途には採用しないだけで、他の不足している用途に使えるなら採用します。

## 正面基準候補と用途 bucket

```text
frontReferenceCandidate:
  自動で「正面基準に良さそう」と判定された候補

frontReference:
  ユーザーが手動選択した正面基準 frame
  正面姿勢・座標正規化・default face の土台に使う

idealFaceInference:
  pose-aware 3D candidate generation に使う observation frame

mouthPucker:
  expressionFollow mouthPucker rule 生成用

jawOpen:
  expressionFollow jawOpen rule 生成用

mouthSmile:
  expressionFollow mouthSmile rule 生成用

eyeBlinkLeft:
  expressionFollow eyeBlinkLeft rule 生成用

eyeBlinkRight:
  expressionFollow eyeBlinkRight rule 生成用

eyeSquintLeft:
  expressionFollow eyeSquintLeft rule 生成用

eyeSquintRight:
  expressionFollow eyeSquintRight rule 生成用
```

`idealFaceInference` は既存 UI の `useForInference` に相当します。将来的に UI 表示名は「IdealFace生成に使う」や「3D顔推定に使う」などへ見直す可能性があります。

`frontReferenceCandidate` は候補提示であり、自動採用 bucket ではありません。`frontReference` は候補や frame card を確認したユーザーが手動で選びます。

## 初期 target count / recommended count 案

```text
frontReference:
  recommended 5〜10

idealFaceInference:
  target 80

mouthPucker:
  target 20

jawOpen:
  target 20

mouthSmile:
  target 20

eyeBlinkLeft:
  target 10

eyeBlinkRight:
  target 10

eyeSquintLeft:
  target 10

eyeSquintRight:
  target 10
```

これは初期値候補です。動画の長さ、表情の出方、処理負荷、端末性能を見ながら調整します。

## 除外条件と warning

自動で `excluded = true` にしてよいものは、まず以下に限定します。

```text
noFace:
  顔検出なし

invalidLandmarks:
  landmarks がない / 478点でない / 値が不正

manual:
  ユーザーが除外した frame
```

以下は自動除外ではなく warning / 注意タグとして扱います。

```text
poseOutOfRange:
  正面基準には不向きだが、pose-aware 3D 推定には使える可能性がある

mixedExpression:
  単一 expressionFollow rule 生成には不向きだが、pose-aware 3D 推定には使える可能性がある

pending:
  表情分類が不明。useForInference には使える可能性がある

missingBlendshapes:
  expressionGroup 自動判定には使えないが、landmarks / pose が有効なら IdealFace 生成には使える可能性がある
```

## 採用ロジック

擬似コード:

```ts
for (const frame of detailedScanFrames) {
  const analysis = analyzeFrame(frame)

  if (analysis.noFace || analysis.invalidLandmarks) {
    markExcluded(frame, analysis.reason)
    continue
  }

  const frontReferenceCandidate = isFrontReferenceCandidate(frame)
  const usageCandidates = classifyAutoUsageBucketCandidates(frame)

  if (frontReferenceCandidate) {
    addFrameToFrontReferenceCandidates(frame)
  }

  for (const usage of usageCandidates) {
    if (bucket[usage].count < bucket[usage].targetCount) {
      addFrameToUsage(frame, usage)
    }
  }

  if (allRequiredBucketsEnough()) {
    break
  }
}
```

ある用途が `targetCount` に達していても、frame 自体を完全に捨てるわけではありません。その用途には採用しないだけで、他の不足している用途に使えるなら採用します。

## 用途判定方針

### frontReferenceCandidate / frontReference

```text
frontReferenceCandidate:
  顔検出がある
  landmarks が 478
  excluded ではない
  正面に近い
  pose が極端ではない
  できれば表情が強すぎない

frontReference:
  ユーザーが手動選択した正面基準 frame
  姿勢・座標正規化・default face の土台に使う
```

`frontReferenceCandidate` の候補 threshold:

```text
正面に近い
pose が極端ではない
顔検出が安定している
できれば表情が強すぎない
abs(yaw) <= 15
abs(pitch) <= 20
abs(roll) <= 10
```

ただし、これは候補提示であり、最終的な `frontReference` ではありません。表情が多少あっても、ユーザーが確認して `frontReference` として手動選択可能とする方針は維持します。

### idealFaceInference

```text
顔検出がある
landmarks が 478
pose-aware 3D 推定の coverage に役立つ
poseOutOfRange でも自動除外しない
表情が強すぎる frame は初期値では useForInference を OFF または weight down 候補にできる
```

v1 の初期 implementation では ON/OFF で扱います。将来、以下のような `inferenceWeight` を導入する可能性があります。

```text
inferenceWeight:
  表情なし / 高品質 frame = 1.0
  軽い表情 = 0.5
  強い表情 = 0.0
```

今回は `inferenceWeight` を実装しません。

### expression groups

```text
mouthPucker:
  mouthPucker が高い

jawOpen:
  jawOpen が高い

mouthSmile:
  max(mouthSmileLeft, mouthSmileRight) が高い

eyeBlinkLeft:
  eyeBlinkLeft が高い

eyeBlinkRight:
  eyeBlinkRight が高い

eyeSquintLeft:
  eyeSquintLeft が高い

eyeSquintRight:
  eyeSquintRight が高い
```

v1 では、各 expression group は expression dropdown の `autoExpressionGroup` 初期値として使います。

## UI との関係

```text
usage-aware sampling:
  frontReferenceCandidate を提示し、idealFaceInference / expression groups の初期 frameUsage を作る

Frame Review Carousel / frame card:
  ユーザーが frontReference / useForInference / expressionGroup / excluded を確認・修正する
  frontReference はここで手動選択する

最終 frameUsage:
  Step 2-I-B pose-aware inference dataset
  Step 2-I-C candidate generation
  将来の MP4 expression 3D analysis
  に使う
```

usage-aware sampling は完全自動確定ではありません。自動初期値 + 手動確認・修正として扱います。

## JSON preview 方針

将来、JSON preview には以下のような summary を出す候補があります。

```json
{
  "usageAwareSampling": {
    "status": "ready",
    "sourceFrameCount": 500,
    "scannedFrameCount": 312,
    "earlyStopped": true,
    "frontReference": {
      "selectedCount": 6,
      "candidateCount": 18,
      "recommendedMin": 5,
      "recommendedMax": 10,
      "status": "ok",
      "candidateFrameIdPreview": ["179", "182", "183"]
    },
    "buckets": [
      {
        "id": "idealFaceInference",
        "targetCount": 80,
        "selectedCount": 80
      },
      {
        "id": "mouthPucker",
        "targetCount": 20,
        "selectedCount": 8,
        "warning": "not_enough_frames"
      }
    ],
    "excludedReasonCounts": {
      "noFace": 31,
      "invalidLandmarks": 0,
      "manual": 0
    },
    "warningReasonCounts": {
      "poseOutOfRange": 52,
      "mixedExpression": 8,
      "pending": 10,
      "missingBlendshapes": 0
    }
  }
}
```

これは preview 方針の候補であり、今回は JSON export / validator 変更は行いません。

## detailed scan / max frames との関係

usage-aware sampling では、単純な `maxScanFrames` だけではなく、bucket の充足状況を見ながら scan を続けます。ただし無制限にはしないため、`maxScanFrames` または `maxScanSeconds` は残します。

候補:

```text
quick:
  maxScanFrames 150

standard:
  maxScanFrames 300

detailed:
  maxScanFrames 500

adaptive:
  bucket target を満たすまで scan。ただし maxScanFrames 上限あり。
```

v1 prototype では、scan preset とは別に adaptive sampling を ON/OFF できます。OFF の場合は従来通り preset の `maxScanFrames` まで scan します。ON の場合は bucket target に基づいて用途ごとに frame を採用し、required bucket が満たされた時点で早期終了できます。

`frontReference` は `buckets` には含めず、手動選択された正面基準の summary として別 section にします。

## 早期終了条件

すべての required bucket が `targetCount` を満たした場合、scan を早期終了できます。v1 prototype では required bucket が満たされたら early stop し、optional bucket の不足は warning として表示します。`frontReferenceCandidate` / `frontReference` は自動採用 bucket ではないため、早期終了の bucket target には含めません。

required / optional の候補:

```text
required:
  idealFaceInference

optional:
  mouthPucker
  jawOpen
  mouthSmile
  eyeBlinkLeft
  eyeBlinkRight
  eyeSquintLeft
  eyeSquintRight
```

expressionFollow を生成したい場合は、対象 expression bucket を required に切り替える可能性があります。

## 責務分離

```text
IdealFace Authoring Tool:
  MP4 detailed scan
  usage-aware sampling
  初期 frameUsage 作成
  Frame Review Carousel / frame card での手動確認・修正
  Step 2-I-B / Step 2-I-C / 将来の MP4 expression 3D analysis への入力作成

Engine Runtime:
  完成済み IdealFace / correctionProfile / expressionFollow asset を読み込んで実行する
  usage-aware sampling implementation は持たない

Beauty Studio:
  Engine の公開 API 経由で Runtime の状態を確認する
  Authoring generation logic は持たない
```

## 今回やらないこと

- Engine 実装
- Studio 実装
- validator 変更
- inferenceWeight implementation
- neutral 3D 478 generation
- expression 3D 478 generation
- neutral vs expression 3D comparison
- landmarkFollowStrengths auto generation
- expressionFollow Engine implementation
- Production Shape Warp
- Runtime renderer integration
- Color Processing
- Layer System

## Prototype implementation note

IdealFace Authoring Tool には、`usage-aware frame sampling v1` の prototype として scan preset、usage bucket summary、adaptive scan / early stop を追加済みです。

- `quick` / `standard` / `detailed` で `maxScanFrames` を切り替えます。
- `frontReference` は自動 bucket から分離し、手動選択数 / 自動候補数 / recommended count / status を summary 表示します。
- `idealFaceInference` / expression groups の `selectedCount` / `targetCount` / `status` を bucket summary 表示します。
- adaptive sampling を ON にすると、bucket が targetCount に達した用途にはそれ以上採用せず、同じ frame が他の不足用途に使える場合はそちらへ採用できます。
- v1 の required bucket は `idealFaceInference` です。`idealFaceInference` が target 80 に達した場合、`earlyStopReason: "required_buckets_satisfied"` で early stop できます。
- expression groups は optional bucket として扱い、不足時は warning を表示します。
- `frontReferenceCandidate` / `frontReference` は early stop 条件に含めません。`frontReference` は引き続きユーザーが手動選択します。
- JSON preview に `adaptiveSamplingImplemented` / `adaptiveSamplingEnabled` / `earlyStopped` / `earlyStopReason` を含む `usageAwareSampling` summary を表示します。
- 3D比較、`landmarkFollowStrengths` 自動生成、`expressionFollow` export、Engine 実装、Studio 実装は未実装です。
