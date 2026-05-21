# BAE AR Beauty Engine 仕様書 / ロードマップ

## 1. プロジェクト目的

BAE AR は、Butterflyve に組み込み可能なリアルタイム Beauty Engine SDK を開発するプロジェクトである。

目的は単なるフィルタアプリではなく、以下を実現すること。

```text
顔の構造・姿勢を理解し、
理想顔との差分を自然に補正する
リアルタイム Beauty Engine を育てる
```

目標イメージ:

```text
TikTok系に近い自然な美顔補正
```

重要方針:

```text
- 2Dの点を雑に動かさない
- 顔を立体構造として扱う
- 顔角度や姿勢を考慮する
- 個別パーツ加工を増やしすぎない
- 理想顔との差分補正として扱う
```

---

# 2. 全体構成

```text
BAE AR

├ packages/engine
│  └ Beauty Engine SDK
│
├ apps/studio
│  └ Beauty Studio
│
├ IdealFace tools（将来）
├ Preset tools（将来）
└ Butterflyve integration（将来）
```

---

# 3. Beauty Engine の責務

Beauty Engine は UI を持たない SDK とする。

責務:

```text
入力映像を受け取る
↓
顔検出
↓
顔構造解析
↓
顔姿勢解析
↓
理想顔との差分計算
↓
補正計画生成
↓
加工
↓
描画
↓
加工済み映像出力
```

Engine は以下を責務に含む。

```text
- Face detection
- Face landmarks
- Face geometry
- Face pose
- Ideal face projection
- Correction planning
- Warp processing
- Color processing
- Layer processing
- Rendering
- Runtime quality control
```

---

# 4. Beauty Studio の責務

Beauty Studio は Engine を育てるための開発ツール。

Studio は Engine API のみ使用する。

OK:

```ts
engine.setPreset()
engine.setIdealFace()
engine.getRuntimeSnapshot()
```

NG:

```text
Engine内部状態へ直接アクセス
```

Studio の責務:

```text
- Camera preview
- Runtime debug
- Overlay visualization
- Profiler
- Compare
- Timeline
- Tuning UI
- Preset debug
- IdealFace debug
```

Studio UI は日本語。

API名・型名・コード識別子は英語。

---

# 5. 現在の処理パイプライン

現在実装済みの流れ:

```text
Camera input
↓
HTMLVideoElement
↓
BeautyEngine.setInput()
↓
MediaPipeFaceDetector
↓
FaceFrame loop
↓
FaceFrame 更新
↓
Studio debug / overlay
```

現在取得できているもの:

```text
- landmarks: 478
- blendshapes
- timestamp
- detect state
```

---

# 6. データモデル

## FaceFrame

MediaPipe由来の生データ。

```text
FaceFrame

├ detected
├ timestamp
├ landmarks
├ blendshapes
└ pose（暫定）
```

FaceFrame は「現在検出された状態」を表す。

意味構造はまだ含めない。

---

## FaceGeometry（補助情報）

FaceGeometry は landmark 群から導出される補助的な顔情報。

```text
FaceGeometry

├ faceCenter
├ faceWidth
├ faceHeight
├ eyeDistance
└ contour metadata
```

目的:

```text
- 顔サイズ正規化
- 安全制御
- pose補助
- debug
```

重要:

```text
FaceGeometry は変形加工の主役ではない
```

変形加工は:

```text
現在 landmarks
↓
理想3D顔を現在姿勢へ投影
↓
理想2D landmarks
↓
差分
↓
warp
```

を基本とする。

---

## FacePose

顔姿勢。

```text
FacePose

├ pitch
├ yaw
└ roll
```

用途:

```text
- 顔角度補正
- Warp減衰
- 理想顔投影
- 安全制御
```

---

## IdealFace

理想3D顔定義。

```text
IdealFace

├ meaning points
├ meaning regions
├ face surface
└ shape metadata
```

例:

```text
- Natural
- Sharp
- Round
- V-line
```

IdealFace は検出しない。

定義済みデータとして保持する。

---

## CorrectionPlan

現在顔と理想顔との差分。

```text
Current face
↓
Ideal face projected to current pose
↓
Difference
↓
CorrectionPlan
```

CorrectionPlan は:

```text
- どこを
- どれだけ
- どの範囲へ
- どの強さで
```

動かすかを表す。

---

# 7. 加工の分類

加工は2種類。

```text
- Color processing
- Shape processing
```

## Color processing

例:

```text
- Skin smoothing
- Whitening
- Brightness
- Tone
- Blood color
```

## Shape processing

重要方針:

```text
個別パーツ加工は行わない
```

NG:

```text
- 目だけ大きくする
- 鼻だけ細くする
- 顎だけ削る
```

基本仕様:

```text
現在顔 landmarks
↓
理想3D顔を現在姿勢へ投影
↓
理想2D landmarks
↓
現在 landmarks を少し寄せる
↓
warp
```

変形加工は:

```text
顔全体を自然に少し寄せる
```

思想とする。
```

---

# 8. Layer System

Layer は意味的な加工範囲。

```text
Layer

├ region
├ attenuation
├ effect
└ blend mode
```

例:

```text
- eye_layer
- cheek_layer
- jaw_layer
- skin_layer
```

特徴:

```text
- 重ね可能
- 外側ほど効果減衰
- 意味領域ベース
```

---

# 9. Renderer 方針

最終的な Renderer は Engine 側責務。

候補:

```text
- WebGL renderer
- Canvas2D debug renderer
- CPU debug renderer
```

Studio は:

```text
video/canvas を Engine に渡すだけ
```

にする。

---

# 10. Butterflyve 組み込み方針

Butterflyve は Engine の利用者。

重要:

```text
Lab機能は持ち込まない
```

Butterflyve 側:

```text
- 輪郭タイプ選択
- 補正度
- 色プリセット
```

程度の UI のみ持つ。

---

# 11. ロードマップ

## Milestone A

### FacePose v1

目的:

```text
現在顔の姿勢を取得する
```

やること:

```text
- pitch
- yaw
- roll
```

完了条件:

```text
理想3D顔を現在姿勢へ投影できる
```

---

## Milestone G

### Layer color processing

目的:

```text
色加工を Layer 化する
```

対象:

```text
- whitening
- skin smoothing
- tone
- brightness
```

---

## Milestone H

### Butterflyve integration

目的:

```text
Butterflyve から Beauty Engine を利用する
```

最終目標:

```text
Butterflyve に自然なリアルタイム Beauty を提供する
```

---

# 13. 開発方針

## 実コード確認

症状だけから推測で実装しない。

変更前に:

```text
- 呼び出し経路
- 型定義
- state ownership
- lifecycle
- guard / early return
```

を確認する。

---

## デバッグ方針

Debug は:

```text
- compact
- copyable
- reproducible
```

を重視する。

Studio は screenshot 前提ではなく:

```text
Copy Debug
```

を重視する。

---

## Git運用

PR 作成は最初から `gh` CLI を使用する。

推奨:

```bash
 git push -u origin <branch>
 gh pr create --title "..." --body "..."
```

---

# 13. 開発方針

## 実コード確認

症状だけから推測で実装しない。

変更前に:

```text
- 呼び出し経路
- 型定義
- state ownership
- lifecycle
- guard / early return
```

を確認する。

---

## デバッグ方針

Debug は:

```text
- compact
- copyable
- reproducible
```

を重視する。

Studio は screenshot 前提ではなく:

```text
Copy Debug
```

を重視する。

---

## Git運用

PR 作成は最初から `gh` CLI を使用する。

推奨:

```bash
 git push -u origin <branch>
 gh pr create --title "..." --body "..."
```

