# BAE AR Beauty Engine 仕様書 / ロードマップ 2026-05

## 1. プロジェクト目的

BAE AR は、本番サービスに組み込めるリアルタイム Beauty Engine SDK を開発するプロジェクトです。

目標は、顔を単純な 2D フィルターとして加工することではありません。現在の顔の landmarks、姿勢、表情を読み取り、理想顔との差分を自然に補正する Engine を育てます。

重要方針:

- Engine SDK は UI を持たない。
- Beauty Studio は Engine を育てるための開発ツールである。
- Studio は Engine の公開 API のみを使う。
- Studio から Engine 内部状態へ直接アクセスしない。
- Shape processing は個別パーツ加工を増やす方向にしない。
- `FaceGeometry` は補助情報であり、変形加工の主役ではない。

## 2. 全体構成

```text
BAE AR

├─ packages/engine
│  └─ Beauty Engine SDK
│
├─ apps/studio
│  └─ Beauty Studio
│
└─ docs
   └─ 設計・仕様・ロードマップ
```

配布対象は `packages/engine` の Engine SDK のみです。

## 3. 現在の実装状況

### 3.1 実装済み

Engine SDK:

- `BeautyEngine` class
- `BeautyEngineState`
- `BeautyEngineInput`
- `BeautyEngineOptions`
- `FaceDetector` interface
- `MediaPipeFaceDetector`
- `FaceFrame`
- `FaceLandmark`
- `FaceBlendshape`
- `FacePose` type
- `FaceDetectionResult`
- `FaceGeometry`
- `analyzeFaceGeometry()`
- FaceFrame loop debug 情報
- FaceDetector debug 情報の取得口

Studio:

- `CameraService`
- カメラ映像の `HTMLVideoElement` 化
- `BeautyEngine.setInput()` への接続
- `MediaPipeFaceDetector` の初期化と接続
- Engine / Camera / Detection / FPS / Loop / Detect の debug 表示
- FaceFrame debug
- FaceGeometry debug
- MediaPipe debug
- Loop / Timing debug
- landmarks overlay
- FaceGeometry point overlay
- Copy Debug

### 3.2 未実装

- FacePose の実推定
- IdealFace
- IdealFace プリセット
- IdealFace の現在姿勢への投影
- CorrectionPlan
- shape warp
- color processing
- Layer System
- renderer
- runtime quality control
- preset API
- 本番向け package build / test / lint script

### 3.3 現在の制限

- FaceFrame loop は 1 秒間隔の `setInterval` です。
- `MediaPipeFaceDetector` は 1 face のみを対象にしています。
- `FacePose` は型として存在しますが、現在は `pitch: 0` / `yaw: 0` / `roll: 0` の placeholder です。
- `FaceGeometry` は landmarks から代表点やサイズを計算する補助解析です。
- 実際の美容加工、warp、描画はまだありません。

## 4. 現在の処理パイプライン

現在実装済みの流れ:

```text
Camera input
  -> HTMLVideoElement
  -> BeautyEngine.setInput()
  -> MediaPipeFaceDetector
  -> FaceFrame loop
  -> FaceFrame 更新
  -> Studio debug / overlay
```

実コード上の主な経路:

```text
apps/studio/src/main.ts
  -> CameraService.start()
  -> CameraService.getVideo()
  -> BeautyEngine.setInput(video)
  -> MediaPipeFaceDetector.initialize()
  -> BeautyEngine.setFaceDetector(detector)
  -> BeautyEngine.start()
  -> FaceDetector.detect(input)
  -> BeautyEngine.currentFaceFrame 更新
  -> analyzeFaceGeometry(frame)
  -> BeautyEngine.currentFaceGeometry 更新
  -> BeautyEngine.onFaceFrame(...) listener 通知
```

`BeautyEngine` は `running` 状態、`HTMLVideoElement` 入力、`FaceDetector` 設定済み、video ready、video size 有効を確認してから検出します。

## 5. Public API 一覧

### 5.1 `BeautyEngine`

```ts
new BeautyEngine(options?: BeautyEngineOptions)

initialize(): Promise<void>
start(): Promise<void>
stop(): Promise<void>
dispose(): void

getState(): BeautyEngineState

setInput(input: BeautyEngineInput): void
getInput(): BeautyEngineInput | undefined

setFaceDetector(detector: FaceDetector): void
getFaceDetector(): FaceDetector | undefined
getFaceDetectorDebugInfo(): unknown | null

getFaceFrame(): FaceFrame | undefined
getFaceGeometry(): FaceGeometry | undefined
onFaceFrame(callback: (frame: FaceFrame) => void): void

getFaceFrameLoopDebugInfo(): FaceFrameLoopDebugInfo
```

### 5.2 `FaceDetector`

```ts
interface FaceDetector {
  initialize(): Promise<void>
  detect(input: HTMLVideoElement): Promise<FaceDetectionResult>
  dispose(): Promise<void>
  getDebugInfo?(): unknown
}
```

### 5.3 Export 済み module

`packages/engine/src/index.ts` から以下を export しています。

```text
BeautyEngine
types
FaceDetector
FaceGeometry
FaceFrame
MediaPipeFaceDetector
face/types
```

## 6. データモデル

### 6.1 FaceFrame

`FaceFrame` は MediaPipe 由来の現在フレームの生データです。

```ts
interface FaceFrame {
  detected: boolean
  timestamp: number
  landmarks: FaceLandmark[]
  blendshapes?: FaceBlendshape[]
  pose: FacePose
}
```

含まれる情報:

- detect state
- timestamp
- landmarks
- blendshapes
- pose

現在、pose は placeholder です。FacePose の実推定は今後実装予定です。

### 6.2 FaceGeometry

`FaceGeometry` は landmarks から導出する補助情報です。

```ts
type FaceGeometry = {
  leftEyeCenter: FaceGeometryPoint | null
  rightEyeCenter: FaceGeometryPoint | null
  mouthCenter: FaceGeometryPoint | null
  noseTip: FaceGeometryPoint | null
  chin: FaceGeometryPoint | null
  faceCenter: FaceGeometryPoint | null
  faceWidth: number | null
  faceHeight: number | null
  eyeDistance: number | null
}
```

用途:

- debug
- overlay
- 顔サイズや代表点の確認
- 将来の安定化・正規化の補助

重要: `FaceGeometry` は変形加工の中心ではありません。

## 7. 変形加工方針

shape processing は、現在 landmarks を理想 2D landmarks に少し寄せる方針です。

```text
現在 landmarks
  -> 現在姿勢を推定
  -> IdealFace 3D プリセットを現在姿勢へ投影
  -> 理想 2D landmarks を得る
  -> 現在 landmarks との差分を計算
  -> CorrectionPlan を生成
  -> 顔全体として弱く warp
```

やること:

- 顔全体として自然に寄せる。
- 現在姿勢を考慮する。
- 強すぎる補正を避ける。
- 複数の IdealFace プリセットを持てる設計にする。

やらないこと:

- 顎だけを細くする。
- 目だけを大きくする。
- 鼻だけを細くする。
- 個別パーツ加工を独立した主機能として増やす。

## 8. IdealFace / CorrectionPlan / Layer System の位置づけ

### 8.1 IdealFace

未実装です。

IdealFace は、将来導入する理想 3D 顔プリセットです。`Natural`、`Sharp`、`Round` など複数プリセットを持つ想定ですが、具体的な型・データ構造・プリセット内容は未確定です。

IdealFace は現在姿勢へ投影され、理想 2D landmarks を生成するために使います。

### 8.2 CorrectionPlan

未実装です。

CorrectionPlan は、現在 landmarks と IdealFace 投影後の理想 2D landmarks の差分から、どの方向へどの程度寄せるかを表す将来予定の中間表現です。

CorrectionPlan は個別パーツ加工の命令セットではなく、顔全体の自然な補正量を扱う設計にします。

### 8.3 Layer System

未実装です。

Layer System は、将来の color processing や shape processing の効果範囲・減衰・合成を整理するための仕組みとして検討します。ただし、個別パーツ加工を増やすための仕組みにはしません。

## 9. Engine / Studio の責務分離

### 9.1 Engine SDK

Engine SDK の責務:

- 入力を受け取る。
- 顔検出を実行する。
- `FaceFrame` を更新する。
- 補助情報を計算する。
- 将来の加工処理、描画、品質制御を提供する。
- UI を持たない。

### 9.2 Beauty Studio

Beauty Studio の責務:

- カメラ入力を用意する。
- Engine の公開 API を呼び出す。
- Engine の状態を確認する。
- debug / overlay / tuning UI を提供する。
- 実装検証を助ける。

Studio は Engine の private field、内部状態、内部実装へ直接アクセスしません。

## 10. ロードマップ

### Milestone 0: 現在完了済みの基盤

状態: 実装済み

- monorepo / npm workspace
- `packages/engine`
- `apps/studio`
- `BeautyEngine` lifecycle
- `FaceDetector` interface
- `MediaPipeFaceDetector`
- `FaceFrame`
- `FaceGeometry`
- Studio camera preview
- Studio debug / overlay

### Milestone 1: ドキュメントと現状整理

状態: 実装中

- 現在実装済み API の明文化
- 実装済み / 未実装 / 将来予定の整理
- 変形加工方針の明文化
- Engine / Studio 責務分離の明文化

### Milestone 2: FacePose v1

状態: 未実装

目的:

- 現在顔の pitch / yaw / roll を推定する。
- IdealFace の現在姿勢への投影準備を行う。

完了条件:

- `FaceFrame.pose` が placeholder ではなく実推定値になる。
- Studio で pose の値を確認できる。

### Milestone 3: IdealFace v1

状態: 未実装

目的:

- 理想 3D 顔のプリセット構造を定義する。
- 最小プリセットを 1 つ以上持つ。

完了条件:

- Engine SDK の公開 API として扱える。
- Studio から公開 API 経由で選択・確認できる。

### Milestone 4: IdealFace Projection v1

状態: 未実装

目的:

- IdealFace 3D プリセットを現在姿勢へ投影し、理想 2D landmarks を得る。

完了条件:

- 現在 landmarks と理想 2D landmarks を比較できる。
- Studio overlay で差分を確認できる。

### Milestone 5: CorrectionPlan v1

状態: 未実装

目的:

- 現在 landmarks と理想 2D landmarks の差分から補正計画を生成する。

完了条件:

- 顔全体として弱く寄せる補正量を表現できる。
- 個別パーツ加工に寄せた設計になっていない。

### Milestone 6: Shape Warp v1

状態: 未実装

目的:

- CorrectionPlan に基づき、顔全体として自然に少し寄せる warp を行う。

完了条件:

- Studio で加工前後を比較できる。
- 過補正や破綻を debug できる。

### Milestone 7: Color Processing v1

状態: 未実装

目的:

- 肌補正、明るさ、トーンなどの color processing を検討する。

完了条件:

- Engine 側で処理される。
- Studio は公開 API 経由で確認・調整する。

### Milestone 8: Layer System v1

状態: 未実装

目的:

- shape / color processing の効果範囲、減衰、合成を整理する。

完了条件:

- 個別パーツ加工を増やす設計になっていない。
- Engine の内部表現として整理され、必要な公開 API のみが外へ出る。

### Milestone 9: 本番 SDK 化

状態: 未実装

目的:

- Engine SDK を本番サービスへ組み込める形に整える。

完了条件:

- build / test / lint script が定義される。
- Studio / docs / debug 専用コードが配布物に含まれない。
- 手動確認項目が PR に記載される。

## 11. 開発方針

実装前に必ず関連する実コードを確認します。

確認対象:

- 呼び出し元と呼び出し先
- 型定義、インターフェース、公開 API
- 状態の所有者と更新箇所
- debug 値が実行時に利用している同じインスタンスから来ているか
- `initialize` / `start` / `setInput` / `setFaceDetector` のライフサイクル順序
- guard / early return / error handling

Studio UI 表示は原則として日本語にします。API 名、型名、コード識別子は英語のままとします。

## 12. 手動確認方針

Codex 環境ではブラウザのカメラ許可や実映像確認ができない場合があります。

その場合、PR には次のような手動確認事項を残します。

```md
## Manual Testing

- カメラ権限許可
- カメラ映像確認
- Input: connected 確認
```
