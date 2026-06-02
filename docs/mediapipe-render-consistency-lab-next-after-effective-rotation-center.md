# MediaPipe Render Consistency Lab next step after effective rotation center study

# 投影用有効回転中心関数の検証後に Render Consistency Lab で続けること

## 目的

この docs は、`tools/mediapipe-render-consistency-lab` で現在進めていた Rotation Fit（回転中心評価）の続き方針を保存するためのメモです。

今後いったん別ラボで `effectiveRotationCenterFunction`（姿勢から投影用有効回転中心を返す関数）を作る可能性があるため、Render Consistency Lab に戻ったときに何を比較すべきかを明確にします。

## 現在までに分かったこと

- Render Consistency Lab は production 用 IdealFace asset（本番用 IdealFace アセット）を直接作る正式 authoring tool（作成ツール）ではなく、debug lab（検証用ラボ）である。
- 現在は MP4 import（MP4 読み込み）、auto scan（自動スキャン）、`acceptedFrames`、12pt overlay（12点重ね表示）、manual adjustments（手動調整）、Debug Console（デバッグコンソール）、`poseBucket125`、pose review candidates（姿勢レビュー候補）、Rotation Fit（回転中心評価）まで進んでいる。
- Rotation Fit（回転中心評価）では、実写MP4から抽出した `adjusted12pt`（手動調整後12点）を使い、12点 z と `rotationCenter.y/z`（回転中心 y/z）を推定していた。
- 評価座標は `x = adjusted12pt.x * videoAspectRatio`、`y = adjusted12pt.y` の aspect-corrected image coordinate（横縦比補正済み画像座標）である。
- `pixel coordinate`（ピクセル座標）、`face bounds center`（顔外枠中心）、顔幅 normalization（顔幅正規化）は使わない。
- Fitting Lab から使っているのは coordinate descent（座標降下探索）の手順だけであり、Fitting Lab の座標系・探索範囲は使わない。
- 左右対称 z 探索、coarse search（粗探索）、fine search（細かい追加探索）、two-pass base rectification（2週目の正面基準補正）まで試した。
- 2週目の正面基準補正では大きく改善しなかった。
- 下向き + 傾き大を除外する候補モードも試したが、平均誤差は大きく改善しなかった。
- 強い下向き、右向き + 下向き、特定フレームで誤差が大きく残る傾向がある。
- これは1つの固定 `rotationCenter`（回転中心）で全姿勢を説明する前提に限界がある可能性を示す。

## 新しい仮説

固定の `rotationCenter.y/z`（回転中心 y/z）を全姿勢で使うのではなく、yaw / pitch / roll（左右向き / 上下向き / 傾き）を入力して、その姿勢で使う `effectiveRotationCenter.y/z`（投影用有効回転中心 y/z）を返す関数として扱う。

概念:

```text
effectiveRotationCenterY = fY(yaw, pitch, roll)
effectiveRotationCenterZ = fZ(yaw, pitch, roll)
```

日本語では、これは「現在の顔の向きから、その姿勢で MediaPipe の見え方に一番合う投影中心 y/z を返す関数」です。

重要:

- これは実際の人間の物理的な回転中心を当てるものではない。
- MediaPipe returned landmarks（MediaPipe返却ランドマーク）に理想顔を投影して合わせるための有効中心である。
- 固定点ではない。
- 直線関数とは限らない。
- pitch（上下向き）が強く下向きになったときだけ急に変わる可能性もある。
- yaw × pitch（左右向き × 上下向き）の組み合わせで変わる可能性もある。
- roll（傾き）が影響する可能性もある。

## 戻ってきたときにやること

新ラボで `effectiveRotationCenterFunction`（姿勢から投影用有効回転中心を返す関数）ができたら、Render Consistency Lab に戻って以下を比較します。

比較対象:

```text
A. 固定 rotationCenter
B. effectiveRotationCenterFunction（姿勢から投影用有効回転中心を返す関数）
```

比較項目:

```text
totalScore（全体平均誤差）
maxFrameScore（最大フレーム誤差）
yaw bucket score（左右向き分類ごとの誤差）
pitch bucket score（上下向き分類ごとの誤差）
roll bucket score（傾き分類ごとの誤差）
yaw × pitch bucket score（左右向き × 上下向き分類ごとの誤差）
worstFrame（最悪フレーム）
worstPoint（最悪点）
```

特に見る分類:

```text
pitch negativeLarge（強い下向き）
yaw positive x pitch negative（右向き寄り + 下向き寄り）
yaw negative x pitch negative（左向き寄り + 下向き寄り）
roll large（強い傾き）
```

## 実装方針メモ

この docs では実装はしません。戻ってきたときの実装方針は以下です。

- Rotation Fit（回転中心評価）の評価時に、固定 `rotationCenter`（回転中心）の代わりに `effectiveRotationCenterFunction(yaw, pitch, roll)`（姿勢から投影用有効回転中心を返す関数）の返す y/z を使えるようにする。
- 12点 z はまず固定する。
- 12点 x/y も正面顔でほぼ誤差がなかったため、まずは固定する。
- まずは12点評価で比較する。
- 478点への拡張は、12点で傾向が確認できてから行う。
- production export（本番書き出し）はしない。
- Runtime / Studio / IdealFace Authoring Tool はこの段階では変更しない。

## 注意点

- `effectiveRotationCenterFunction`（姿勢から投影用有効回転中心を返す関数）は MediaPipe canonical face model（MediaPipe標準顔モデル）から得た初期仮説であり、そのまま production 仕様（本番仕様）ではない。
- 実写MP4での検証が必要である。
- 実写MP4には表情、ブレ、手動調整誤差、個人差が混ざる。
- canonical ラボでよくても、実写MP4で改善しない可能性がある。
- 改善しない場合は、回転中心ではなく MediaPipe の局所ランドマーク検出ブレ、表情、遮蔽、または12点モデルの限界を疑う。
