# アーキテクチャ

## 基本構成

BAE AR は、Engine SDK と Beauty Studio を明確に分けて開発します。

```text
BAE AR

├─ packages/engine
│  └─ Beauty Engine SDK
│     - UI を持たない
│     - 本番サービスに組み込まれる
│     - 顔検出、FaceFrame 更新、将来の加工処理を担当する
│
└─ apps/studio
   └─ Beauty Studio
      - Engine を育てるための開発ツール
      - カメラ入力、debug 表示、overlay、調整 UI を担当する
      - Engine の公開 API のみを使う
```

## Engine SDK の責務

Engine SDK は UI を持たない中核ライブラリです。

現在実装済み:

- `BeautyEngine` の状態管理
- 入力の保持
- `FaceDetector` インターフェース
- `MediaPipeFaceDetector`
- FaceFrame loop
- `FaceFrame` の保持と購読
- `FaceGeometry` の補助解析
- debug 情報の公開

将来予定:

- FacePose の実推定
- IdealFace プリセット
- IdealFace の現在姿勢への投影
- CorrectionPlan 生成
- shape warp
- color processing
- Layer System
- rendering / runtime quality control

## Beauty Studio の責務

Beauty Studio は Engine SDK を開発・検証・調整するための開発ツールです。

現在実装済み:

- `CameraService` によるカメラ映像取得
- `HTMLVideoElement` を `BeautyEngine.setInput()` へ渡す接続
- `MediaPipeFaceDetector` の初期化と Engine への設定
- Engine 状態、カメラ状態、検出状態、FaceFrame、FaceGeometry、MediaPipe debug の表示
- landmarks / geometry point overlay
- Copy Debug 用の debug text 生成

Studio は Engine SDK の公開 API のみを利用します。Engine の private field や内部実装ファイルへ直接依存しません。

## 現在の呼び出し経路

```text
apps/studio/src/main.ts
  -> new BeautyEngine()
  -> new CameraService()
  -> new MediaPipeFaceDetector()
  -> engine.setFaceDetector(detector)
  -> detector.initialize()
  -> engine.initialize()
  -> engine.start()
  -> camera.start()
  -> engine.setInput(camera.getVideo())
  -> engine.onFaceFrame(...)
  -> engine.getFaceFrame()
  -> engine.getFaceGeometry()
  -> engine.getFaceFrameLoopDebugInfo()
  -> engine.getFaceDetectorDebugInfo()
```

Engine 側では、`BeautyEngine.startFaceFrameLoopIfReady()` が `running` 状態、`HTMLVideoElement` 入力、`FaceDetector` の存在を確認してから 1 秒間隔の検出ループを開始します。

## データモデル

`FaceFrame` は MediaPipe 由来の現在フレームの生データを表します。

```text
FaceFrame
  detected: boolean
  timestamp: number
  landmarks: FaceLandmark[]
  blendshapes?: FaceBlendshape[]
  pose: FacePose
```

現在、`pose` は `pitch: 0` / `yaw: 0` / `roll: 0` の placeholder です。実推定は未実装です。

`FaceGeometry` は landmarks から導出する補助情報です。

```text
FaceGeometry
  leftEyeCenter
  rightEyeCenter
  mouthCenter
  noseTip
  chin
  faceCenter
  faceWidth
  faceHeight
  eyeDistance
```

`FaceGeometry` は顔サイズ正規化、安定化、debug、overlay などに使う補助情報です。変形加工の中心として扱いません。

## 変形加工の設計方針

shape processing は、現在 landmarks と IdealFace 由来の理想 2D landmarks の差分を使って、顔全体を自然に少し寄せる方針です。

```text
現在 landmarks
  -> 現在姿勢の推定
  -> IdealFace 3D プリセットを現在姿勢へ投影
  -> 理想 2D landmarks
  -> 差分から CorrectionPlan を生成
  -> 顔全体として弱く warp
```

顎だけ、目だけ、鼻だけなどの個別パーツ加工を独立機能として増やす方向にはしません。

## 配布方針

配布対象は Engine SDK のみです。Studio、docs、開発用 debug UI、サンプル、検証ツールは本番配布物に含めません。
