# 開発フロー

## 基本方針

BAE AR は、Engine Runtime、Beauty Studio、IdealFace Authoring Tool、Layer Mask Authoring Tool を分けて開発します。

- Engine Runtime は本番でリアルタイム加工する中核 SDK です。
- Beauty Studio は Engine Runtime を開発・検証・調整するための開発ツールです。
- Studio は Engine Runtime の公開 API のみを使います。
- Studio から Engine Runtime の内部実装へ直接依存しません。
- IdealFace Authoring Tool は Step 2-I-C まで実装済みです。
- Layer Mask Authoring Tool は将来予定です。
- Authoring Tool の処理を Runtime に混ぜません。
- 1 つの Issue では目的を絞って小さく実装します。

## 実装前に確認すること

症状や想像だけで原因を断定しません。修正前に必ず関連する実コードを確認します。

確認対象:

- 呼び出し元と呼び出し先の実装
- 型定義、インターフェース、公開 API
- 状態の所有者と更新箇所
- debug 値が、実行時に利用している同じインスタンスから来ているか
- `initialize` / `start` / `setInput` / `setFaceDetector` などのライフサイクル順序
- 既存の guard、early return、error handling

## 現在の開発サイクル

現在は基盤実装の段階です。

```text
1. Engine Runtime の公開 API を小さく追加する
2. Studio からその公開 API だけを使って確認する
3. Studio に debug / overlay / copyable debug を追加する
4. 実カメラまたは可能な範囲の構成確認を行う
5. ドキュメントへ実装済み / 未実装 / 将来予定を反映する
6. 次の小さな Issue へ進む
```

## 現在実装済みの確認経路

```text
CameraService.start()
  -> navigator.mediaDevices.getUserMedia()
  -> HTMLVideoElement
  -> BeautyEngine.setInput()
  -> BeautyEngine.setFaceDetector()
  -> MediaPipeFaceDetector.detect()
  -> FaceFrame 更新
  -> analyzeFaceGeometry()
  -> Studio debug / overlay
```

## Shape Processing の開発方針

個別パーツ加工を増やす方向にはしません。

shape processing は current 478 landmarks と IdealFace 由来の ideal 478 landmarks を比較し、顔全体として自然に少し warp する方針で進めます。

IdealFace は BAE AR 独自の canonical face / お面データです。MediaPipe canonical face model そのものではありません。MediaPipe の topology や landmark index は参考にする可能性がありますが、MediaPipe は検出側の基準、BAE AR IdealFace は補正・比較側の基準として分けて扱います。

Projection / Shape Processing の実装では座標系を 3 種類に分けます。IdealFace asset / `idealLandmarks3D` は same-unit coordinate として扱い、Projection 内部、`FacePose` rotation、uniform alignment に使います。MediaPipe current landmarks、Studio overlay、current-vs-ideal difference、`CorrectionPlan` 入力は image-normalized coordinate として扱います。最終的な描画や画像変形は pixel coordinate で行います。

same-unit の projected ideal landmarks を、そのまま `x * canvasWidth` / `y * canvasHeight` で描画しません。Projection result は、Projection / alignment / debug 用の `sameUnitLandmarks` と、overlay / difference / Shape Warp 入力用の `imageLandmarks` を分けて持ちます。Studio overlay は `imageLandmarks` を使います。

```text
現在顔から MediaPipe 478 landmarks を取得
  -> FacePose を推定
  -> IdealFace 3D model を same-unit coordinate で現在姿勢へ投影
  -> projected ideal 478 landmarks を image-normalized coordinate へ変換
  -> current image-normalized landmarks と projected ideal image-normalized landmarks の差分を取る
  -> CorrectionPlan を生成
  -> 顔全体として自然に少し warp
```

current 478 landmarks は MediaPipe 由来の image-normalized 座標です。projected ideal 478 landmarks は、IdealFace same-unit landmarks を `FacePose` へ投影し、alignment 後に image-normalized 座標へ変換したものです。差分は `deltaX = projectedIdealImageX - currentX`、`deltaY = projectedIdealImageY - currentY` として計算します。

現時点では、478点の current-vs-ideal difference debug、`correctionProfile` v1 foundation、CorrectionPlan v1 debug foundation、Studio 向け Shape Warp v1 debug prototype は実装済みです。Production Shape Warp は未実装です。

`correctionProfile` v1 は、将来 `ideal_face_asset_v1` の optional top-level field として追加する補正設定です。landmark ごとの `strength` を持ちますが、dx / dy は JSON に保存しません。dx / dy は current landmarks と projected ideal `imageLandmarks` から Engine が毎フレーム計算します。詳細は [correctionProfile v1](correction-profile-v1.md) を参照してください。

やらないこと:

- 目だけ大きくする
- 鼻だけ細くする
- 顎だけ削る
- 個別パーツ加工を主機能として増やす

## CorrectionPlan の開発方針

CorrectionPlan は姿勢補正を担当しません。姿勢への対応は IdealFace Projection の責務です。

CorrectionPlan は Projection 後の current image-normalized landmarks と projected ideal image-normalized landmarks の差分を受け取り、`correctionProfile` の `strength` を掛け、`maxCorrectionDistance` で clamp して、実際に warp へ渡す安全な補正量を決めます。

扱うもの:

- 補正強度
- 移動量上限
- `correctionProfile` fallback
- 滑らかさ
- 過補正防止
- 信頼度

扱わないもの:

- FacePose の推定
- IdealFace の現在姿勢への投影
- 個別パーツ加工命令

CorrectionPlan は same-unit projection 後、image-normalized に変換された current-vs-ideal 差分を受け取ります。CorrectionPlan は `FacePose` の推定や IdealFace projection を担当しません。

## Color Processing / Layer System の開発方針

Layer System は shape warp ではなく color processing 用に使います。

対象:

- skin smoothing
- whitening
- brightness
- tone
- blood color
- shadow / highlight
- cheek / lip / eye area などの色補正

Layer は色加工範囲、効果、強度、合成順を整理する仕組みです。変形加工には使いません。

## LayerMaskSpec の開発方針

LayerMask は FaceLandmarks から生成する 2D mask です。

基本仕様:

- どの landmarks で囲われた範囲かを定義する
- landmarks を polygon 化する
- polygon から mask を生成する
- 必要に応じて除外領域を持つ
- 必要に応じて膨張・収縮する
- 境界は feather / blur して自然にする
- mask 値は 0.0〜1.0 の強度マップとする

LayerMaskSpec の作成や手作業編集は Layer Mask Authoring Tool の責務です。Engine Runtime は定義済み LayerMaskSpec を読み込んで使います。

## Runtime と Authoring の分離

Engine Runtime で行わないこと:

- IdealFace の作成
- MediaPipe canonical face model の生成・編集
- 2D 動画からの 3D 顔生成
- LayerMaskSpec の作成
- mask の手作業編集
- Studio / Authoring 用 UI

Runtime Projection alignment では x/y 別 scale を行いません。IdealFace の縦横比を現在顔に合わせて歪めず、縦横比や形状そのものの調整は将来の IdealFace Authoring Tool manual adjustment UI で扱います。Authoring Tool は `video_aspect_same_unit_v1` による video aspect 補正、pose-aware generation、manual adjustment、same-unit `idealLandmarks3D` 生成を担当します。Runtime は完成済み IdealFace asset の読み込み、same-unit projection、overlay / difference / warp 用の image-normalized / pixel 座標変換を担当し、Authoring generation logic は持ちません。

Beauty Studio では、開発確認用として overlay や簡易調整 UI を持ってよいです。ただし、本番配布対象には含めません。

`correctionProfile` v1 の責務分離:

```text
IdealFace Authoring Tool
  - correctionProfile を作成・編集する
  - landmark index ごとの strength を設定する
  - dx / dy は持たない

Engine Runtime
  - correctionProfile を読み込む
  - correctionProfile がない場合は fallback default を使う
  - dx / dy を毎フレーム計算する
  - strength と maxCorrectionDistance から CorrectionPlan を生成する

Beauty Studio
  - Engine の公開 API から correctionProfile / CorrectionPlan を確認する
  - Engine 内部実装や private field に直接依存しない
```

## IdealFace Authoring Tool の開発方針

今後の IdealFace Authoring Tool の開発は Step 2-I active workflow を中心に進めます。

Current active workflow:

```text
MP4 input
  -> detailed scan
  -> Step 2-I-A frame selection
       正面基準候補 / 推定に使うフレーム / 除外フレーム
  -> Step 2-I-B pose-aware inference dataset
  -> Step 2-I-C pose_aware_weighted_z_v1 candidate generation
       roll 補正
       yaw / pitch / weight による z hint
       idealLandmarks3D 478点候補生成
  -> Step 2-H currentCandidate point cloud preview
```

Removed legacy workflow:

旧 Step 2-C〜2-G v1 の 5ポーズ方式は過去の実装です。現在コードからは UI / state / JSON preview / generation helper を削除済みで、必要な場合は Git 履歴を参照します。現在の docs では、旧方式を現行の authoring 主導線として扱いません。

削除済みの代表例:

- old five-pose candidate UI
- `selectedRepresentativeFrames`
- `idealLandmarks3DInferenceDataset`
- `representativeFrameCandidates` / representative candidate UI and JSON preview
- `legacy.step2Gv1` JSON preview
- `buildIdealLandmarks3DCandidateResult()`
- `inferCandidateZ()`
- `inferCandidateConfidence()`
- `generationMethod: "step_2_g_v1"`

Current JSON preview:

```text
activeSummary
poseAware
currentCandidate
reference
debug
```

`currentCandidate` は Step 2-H preview に表示される現在の candidate です。`generationMethod` は `pose_aware_weighted_z_v1` で、478 landmarks 全文は出さず、summary と先頭数点 preview に留めます。`natural_v1` の 6 controlPoints は reference / projection debug 用であり、IdealFace 本体は `idealLandmarks3D` 478点です。

legacy / debug と分類した UI や helper には、今後の新機能を追加しません。confidence debug、手動微調整 UI、保存 / export は Step 2-I active workflow 側に追加します。

次の feature work は confidence debug、手動微調整 UI、保存 / export、複数画像入力を Step 2-I active workflow 側に追加する方向で進めます。

## Studio UI 表示

Studio の UI 表示は原則として日本語にします。

例:

```text
エンジン状態
入力状態
カメラ状態
カメラエラー
プレビュー
```

API 名、型名、コード識別子は英語のままとします。

```ts
BeautyEngine
CameraService
getState()
```

## 確認コマンド

現時点で root の `package.json` には `start` と `start:ideal-face-authoring` が定義されています。

```bash
npm run start
npm run start:ideal-face-authoring
```

build / test / lint script は未定義です。追加後は、このドキュメントにも反映します。

## PR に書くこと

PR 本文には、変更内容と確認結果を記載します。

実カメラ確認が Codex 環境でできない場合は、手動確認事項として明記します。

```md
## Summary

- 変更内容

## Testing

- 実行した確認コマンド

## Manual Testing

- カメラ権限許可
- カメラ映像確認
- Input: connected 確認
```

## IdealFace Authoring Tool active workflow の確認

確認対象は現在の active workflow に絞ります。

- MP4 を選択できる
- 動画 preview と metadata を確認できる
- 詳細スキャンを実行できる
- Step 2-I-A で正面基準候補 / 推定に使うフレーム / 除外フレームを操作できる
- Step 2-I-B の pose-aware inference dataset summary が更新される
- Step 2-I-C で `pose_aware_weighted_z_v1` candidate を生成できる
- Step 2-H で `currentCandidate` point cloud preview を確認できる
- JSON preview の top-level が `activeSummary` / `poseAware` / `currentCandidate` / `reference` / `debug` である
- JSON preview に 478 landmarks 全文、thumbnail data URL 全文、canvas data URL 全文を出さない
- Engine Runtime / Beauty Studio に authoring generation logic を追加していない

旧 Step 2-C〜2-G v1 の 5ポーズ方式は current code から削除済みのため、通常確認項目に含めません。

## IdealFace Authoring Tool Cleanup Status

The old Step 2-G v1 five-pose generation helper path has been removed. New IdealFace Authoring Tool feature work should target Step 2-I-A/B/C: frame selection, pose-aware inference dataset, and `pose_aware_weighted_z_v1` candidate generation. Legacy/debug paths should not receive new feature work.

## Shape Warp production direction flow

Shape Warp v1 debug prototype は、CorrectionPlan の補正ベクトルを画像へ接続するための Studio processed preview 限定 prototype として扱います。本番候補は WebGL mesh warp です。

今後の開発は次の段階で進めます。

```text
Step A: docs / direction
  CPU radial warp debug の位置づけと WebGL mesh warp 本命候補を整理する

Step B: Studio WebGL mesh warp prototype
  Studio processed preview 限定で current landmarks / CorrectionPlan target / texture / topology を接続する

Step C: Runtime renderer integration
  Engine Runtime renderer として lifecycle / disposal / fallback / performance を整理する

Step D: Quality improvements
  temporal smoothing / mask / boundary / glasses / hair / seam / stability を扱う
```

詳細は [Shape Warp production direction](shape-warp-production-direction.md) を参照してください。WebGL 実装、mesh warp 実装、renderer 実装、shader 実装、MediaPipe topology 実装はこの docs step では行いません。
