# MediaPipe Canonical Effective Rotation Center Lab

# MediaPipe標準顔モデルから投影用有効回転中心関数を推測するラボ

## 目的

このラボは、`canonical_face_model.obj` を使って、MediaPipe の姿勢別の MediaPipe returned landmarks（MediaPipe返却ランドマーク）の癖を調べるための debug lab（検証用ラボ）です。

目的は、BAE AR の IdealFace（理想顔）を作ることではありません。目的は、yaw / pitch / roll（左右向き / 上下向き / 傾き）から `effectiveRotationCenter.y/z`（投影用有効回転中心 y/z）を返す関数の初期仮説を作ることです。

## 背景

- `canonical_face_model.obj` に yaw / pitch / roll（左右向き / 上下向き / 傾き）をかけて2D画像として render（レンダリング）する。
- その2D画像を MediaPipe Face Landmarker に通せば、MediaPipe returned landmarks（MediaPipe返却ランドマーク）が得られる。
- 2D画像を作らずにメッシュから直接出せるのは geometric projected landmarks（幾何投影ランドマーク）であり、MediaPipe returned landmarks（MediaPipe返却ランドマーク）ではない。
- MediaPipe の見え方を知るには、rendered image（レンダリング画像）を MediaPipe に再入力する必要がある。
- これにより、実写MP4の表情・ブレ・照明・手動調整誤差を避けて、MediaPipe の姿勢別の返却癖を調べられる。

## canonical_face_model.obj の位置づけ

- MediaPipe canonical face model（MediaPipe標準顔モデル）は、BAE AR の IdealFace（理想顔）そのものではない。
- BAE AR では MediaPipe標準顔モデルをそのまま理想顔として採用しない。
- このラボでは、MediaPipe標準顔モデルを、MediaPipe の検出特性を調べるための参照モデルとして使う。
- 生成する `effectiveRotationCenterFunction`（姿勢から投影用有効回転中心を返す関数）は production asset（本番用アセット）ではなく、Render Consistency Lab へ戻して実写MP4で検証するための仮説である。

## 最初は12点から始める

最初から478点ではなく、12点で始める。

理由:

- 478点は原因分析が難しい。
- 12点なら、回転中心の推測に必要な主要点に絞れる。
- 12点で傾向が出れば、その後478点へ広げる。
- 12点で傾向が出なければ、問題は有効回転中心ではなく局所ランドマークやレンダリング品質かもしれない。

12点は現行の `12pt_rotation_center`（回転中心推定向け12点）相当を使う想定です。

対象点:

```text
headTop
chin
leftCheek
rightCheek
leftEye
rightEye
nose
mouth
noseBridge
leftJaw
rightJaw
upperFaceCenter
```

## 基本フロー

```text
canonical_face_model.obj を読み込む
  -> 12点に対応する vertex / derived point を取得する
  -> yaw / pitch / roll を指定して canonical mesh を回転する
  -> カメラ投影して geometric projected 12pt（幾何投影12点）を作る
  -> 同じ姿勢で canonical mesh を2D画像として render（レンダリング）する
  -> rendered image（レンダリング画像）を MediaPipe Face Landmarker に再入力する
  -> MediaPipe returned landmarks 478（MediaPipe返却ランドマーク478点）を得る
  -> returned landmarks（返却ランドマーク）から同じ 12pt を作る
  -> geometric projected 12pt（幾何投影12点）と returned 12pt（返却12点）を比較する
  -> その姿勢で一番合う effectiveRotationCenter.y/z（投影用有効回転中心 y/z）を探索する
  -> yaw / pitch / roll -> y/z の対応表を作る
  -> 必要に応じて関数化する
```

## 姿勢 sweep

まずは粗い姿勢 sweep（姿勢の総当たり確認）から始める。

例:

```text
yaw:
  -40, -30, -20, -10, 0, 10, 20, 30, 40

pitch:
  -30, -20, -10, 0, 10, 20

roll:
  -20, -10, 0, 10, 20
```

ただし、最初から全組み合わせを大きくしすぎない。最初は以下のように段階的に進める。

Stage 1:

```text
roll = 0 固定
yaw × pitch sweep
```

Stage 2:

```text
代表 yaw / pitch に対して roll を変える
```

Stage 3:

```text
必要なら yaw × pitch × roll の粗い grid（格子）を作る
```

## 探索するもの

各姿勢で探索するものは以下です。

```text
effectiveRotationCenter.y
effectiveRotationCenter.z
```

最初は12点 z は canonical 側の値、または固定の参照値として扱い、いきなり12点 z まで探索しない。

理由:

- 目的は関数 `yaw / pitch / roll -> effectiveRotationCenter.y/z`（姿勢から投影用有効回転中心 y/z への関数）を調べること。
- 12点 z まで同時に動かすと、回転中心の効果と形状の効果が混ざる。
- まずは中心だけで MediaPipe returned 12pt（MediaPipe返却12点）にどこまで近づくか見る。

## 出力

この新ラボは、最終的に以下の debug JSON（検証用 JSON）を出す方針とします。

```json
{
  "schemaVersion": "mediapipe_canonical_effective_rotation_center_lab_v1",
  "sourceModel": "canonical_face_model.obj",
  "landmarkSet": "12pt_rotation_center",
  "coordinateSystem": "...",
  "sweepSettings": {
    "yawValues": [],
    "pitchValues": [],
    "rollValues": []
  },
  "samples": [
    {
      "yaw": 0,
      "pitch": 0,
      "roll": 0,
      "bestEffectiveRotationCenter": {
        "y": 0,
        "z": 0
      },
      "score": {
        "totalScore": 0,
        "maxPointError": 0
      },
      "geometricProjected12pt": {},
      "mediaPipeReturned12pt": {}
    }
  ],
  "functionCandidates": [
    {
      "type": "lookup_table",
      "description": "姿勢ごとの y/z 対応表"
    },
    {
      "type": "interpolated_grid",
      "description": "姿勢グリッドを補間して y/z を返す関数"
    }
  ]
}
```

## 関数化の考え方

`effectiveRotationCenterFunction`（姿勢から投影用有効回転中心を返す関数）は、必ずしも直線ではありません。

候補:

```text
lookup table（対応表）:
  yaw / pitch / roll の格子点ごとに y/z を持つ

interpolated grid（補間グリッド）:
  近い格子点の y/z を補間して返す

piecewise function（区間別関数）:
  pitch が一定以上下向きになった場合だけ別の変化を使う

simple regression（単純回帰）:
  もし分布が単純なら後で検討する
```

最初から一次関数にしない。まずは対応表と補間グリッドで十分です。

## Render Consistency Lab との関係

このラボで作った関数は、Render Consistency Lab に戻って実写MP4で検証します。

比較するもの:

```text
固定 rotationCenter
vs
effectiveRotationCenterFunction（姿勢から投影用有効回転中心を返す関数）
```

Render Consistency Lab 側で見るもの:

```text
totalScore（全体平均誤差）
maxFrameScore（最大フレーム誤差）
pitch negativeLarge（強い下向き）の誤差
yaw × pitch の bucket score（姿勢分類ごとの誤差）
worstFrame（最悪フレーム）
worstPoint（最悪点）
```

## やらないこと

- production export（本番書き出し）はしない。
- BAE AR IdealFace（理想顔）を作らない。
- MediaPipe canonical face model（MediaPipe標準顔モデル）を BAE AR IdealFace（理想顔）として採用しない。
- Runtime / Studio / IdealFace Authoring Tool は変更しない。
- いきなり478点最適化はしない。
- いきなり 12点 z + `effectiveRotationCenter.y/z`（投影用有効回転中心 y/z）の同時探索はしない。
- `expressionFollow`（表情追従）や `correctionProfile`（補正プロファイル）は扱わない。
- Shape Warp や WebGL mesh warp の本番実装はしない。
