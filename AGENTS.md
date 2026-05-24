# AGENTS.md

## プロジェクト概要

BAE AR は、リアルタイム顔加工・AR 表現を行う Beauty Engine Runtime と、その開発・検証・調整を行う Beauty Studio、将来の authoring tool 群を含むプロジェクトです。

目的は、本番サービスに組み込める自然で破綻しにくい Beauty Engine を開発することです。

## 全体構成

BAE AR は以下の 4 領域に分ける。

### Engine Runtime

- 本番でリアルタイム加工する中核 SDK
- UI を持たない
- 実行専用
- 定義済みの IdealFace / LayerMaskSpec を読み込んで使う
- IdealFace の作成、2D 動画からの 3D 顔生成、LayerMaskSpec の作成、mask の手作業編集、Studio / Authoring 用 UI は持たない

### Beauty Studio

- Engine を開発・検証・調整する開発ツール
- Engine の公開 API のみを使う
- Engine 内部実装へ直接依存しない
- 開発確認用として overlay や簡易調整 UI を持ってよい
- 本番配布対象には含めない

### IdealFace Authoring Tool

- 理想 3D 顔プリセットを作成する将来ツール
- 手作業、調整ツール、2D 動画 / 複数画像からのオフライン生成を想定
- リアルタイム Engine Runtime には含めない

### Layer Mask Authoring Tool

- 色加工用 LayerMaskSpec を作成する将来ツール
- どの landmarks で囲うか、除外領域、膨張・収縮、ぼかしなどを定義する
- リアルタイム Engine Runtime には含めない

## 想定構成

```text
packages/engine
  Engine Runtime として使う Beauty Engine SDK

apps/studio
  Engine Runtime を開発・検証・調整する Beauty Studio

docs
  設計・仕様ドキュメント

tools/ideal-face-authoring
  IdealFace Authoring Tool。Step 2-H まで実装済み

tools/layer-mask-authoring
  将来予定。Layer Mask Authoring Tool
```

## 開発ルール

* 1つのIssueでは、目的を絞って小さく実装する
* Engine Runtime に機能を追加した場合、必要に応じて Studio 側にも確認手段を追加する
* 仕様が不明な場合は、推測で大きく作り込まず、最小実装に留める
* 既存ドキュメントと矛盾する実装をしない
* 実装前に関連ドキュメントを確認する
* 不要な抽象化を増やさない
* デバッグ用 UI や一時的な検証機能を Engine Runtime 本体に入れない
* Authoring Tool の処理をリアルタイム Engine Runtime に混ぜない

## 確定仕様

### IdealFace

- IdealFace は独自の理想 3D 顔モデルを本体とする
- IdealFace は MediaPipe 478 landmarks そのものではない
- Engine Runtime で current face と比較するため、IdealFace から MediaPipe 478 landmarks と対応する ideal 478 landmarks を生成できる必要がある
- current 478 landmarks と ideal 478 landmarks を比較して shape processing へ進む
- 2D 動画 / 複数画像から IdealFace を作る処理は、リアルタイム処理ではなく IdealFace Authoring Tool の責務

### Shape Processing

Shape processing は個別パーツ加工ではない。

処理方針:

```text
現在顔から MediaPipe 478 landmarks を取得
  -> FacePose を推定
  -> IdealFace 3D model を現在姿勢へ投影
  -> ideal 2D landmarks 478 点を生成
  -> current 478 landmarks と ideal 478 landmarks の差分を取る
  -> CorrectionPlan を生成
  -> 顔全体として自然に少し warp
```

やらないこと:

- 目だけ大きくする
- 鼻だけ細くする
- 顎だけ削る
- 個別パーツ加工を主機能として増やす

### CorrectionPlan

- CorrectionPlan は姿勢補正を担当しない
- 顔姿勢への対応は、IdealFace 3D model を現在 FacePose に投影する IdealFace Projection の責務
- Projection 後の ideal 2D landmarks はすでに現在姿勢を反映している
- CorrectionPlan は current 2D landmarks と ideal 2D landmarks の差分を受け取る
- CorrectionPlan は実際に warp へ渡す安全な補正量を決める
- 補正強度、移動量上限、滑らかさ、過補正防止、信頼度などを扱う
- 個別パーツ加工命令セットにはしない

### FaceGeometry

- FaceGeometry は補助情報
- 用途は debug、overlay、顔サイズ確認、代表点確認、将来の安定化・正規化補助
- FaceGeometry は shape processing の中心ではない
- shape processing の中心は current 478 landmarks と IdealFace 由来の ideal 478 landmarks

### Layer System / LayerMask

- Layer System は shape warp ではなく、color processing 用に使う
- 対象は skin smoothing、whitening、brightness、tone、blood color、shadow / highlight、cheek / lip / eye area などの色補正
- Layer System は変形加工には使わない
- `jaw_layer` で顎を削る、`eye_layer` で目を大きくする、`nose_layer` で鼻を細くする、のような使い方はしない
- Layer は色加工範囲、効果、強度、合成順を整理する仕組み
- LayerMask は FaceLandmarks から生成する 2D mask
- mask 値は 0.0〜1.0 の強度マップとする

## 実コード確認の方針

症状だけから原因を断定せず、修正前に必ず関連する実コードを確認すること。

特にバグ調査、デバッグ表示追加、設計判断では、以下を確認する。

* 呼び出し元と呼び出し先の実装
* 型定義、インターフェース、公開 API
* 状態の所有者と更新箇所
* 表示している debug 値が、実行時に利用している同じインスタンスから来ているか
* initialize / start / setInput / setDetector などのライフサイクル順序
* 既存の guard、early return、error handling

現在の実装と矛盾する原因断定、提案、修正をしないこと。

完了報告では、確認した主なファイルや呼び出し経路を簡潔に記載すること。

## Studio表示ルール

Studio の UI 表示は原則として日本語にする。

表示文言の例は以下とする。

```text
エンジン状態
入力状態
カメラ状態
カメラエラー
プレビュー
```

API 名、型名、コード識別子は英語のままとする。

```ts
BeautyEngine
CameraService
getState()
```

日本語化の対象は UI 表示のみとする。

英語と日本語が混在する画面を避ける。

## 実機確認ルール

Codex 環境では、ブラウザのカメラ許可や実映像確認ができない場合がある。

その場合は、以下を可能な範囲で確認する。

* 実装確認
* ビルド確認
* 構成確認

実カメラ確認は手動確認事項として PR 本文へ記載する。

```md
## Manual Testing

- カメラ権限許可
- カメラ映像確認
- Input: connected 確認
```

## Git運用ルール

* 作業開始前に、必ず目的に応じた作業ブランチを作成する
* main ブランチへ直接コミットしない
* ブランチ名は以下の形式を基本とする

```text
docs/内容
feature/内容
fix/内容
chore/内容
```

* 変更後はコミットする
* コミット後、リモートへ push する
* push 後、Pull Request を作成する
* PR本文には変更内容と確認結果を記載する
* Issue がある場合は `Closes #xxx` を含める

## Pull Request 作成ルール

Pull Request 作成時は、まずローカルの `gh` CLI 認証を利用すること。

`gh` を試す前に、GitHub App ベースの PR 作成を試行しないこと。

推奨フロー:

```bash
git push -u origin <branch-name>
gh pr create --title "<title>" --body "<body>"
```

`gh` の認証が利用できない、または失敗した場合は、エラー内容を明確に報告すること。

## GitHub CLI 文字化け防止ルール

PR タイトル、PR 本文、Issue コメントなど日本語を `gh` CLI に渡す場合は、PowerShell の pipe や既定エンコーディングに依存しない。

推奨フロー:

```bash
gh pr create --title "日本語タイトル" --body-file pr-body.md
gh pr edit <number> --body-file pr-body.md
```

Codex が PR 本文を作る場合は、UTF-8 の本文ファイルを作成して `--body-file` を使うこと。PowerShell here-string をそのまま `gh` へ pipe しないこと。

## 言語ルール

PR タイトル、PR 本文、Issue コメント、完了報告、Studio UI 表示は原則として日本語で記載する。

例:

- Summary → 変更内容
- Testing → 確認内容
- Manual Testing → 手動確認事項

ただし、API 名、型名、コード識別子、CLI コマンド、package 名、npm script 名は英語のままとする。

例:

```ts
BeautyEngine
FaceGeometry
getIdealFaceProjection()
npm run start
```

コミットメッセージも原則として日本語で記載する。


## 禁止事項

* Engine Runtime に画面 UI を持たせること
* Studio から Engine Runtime の private/internal 実装へ依存すること
* Authoring Tool の生成・編集処理を Runtime に混ぜること
* Shape processing と color processing を混同すること
* Layer System を個別パーツ変形用にすること
* Issue の範囲外の大規模リファクタリングを行うこと
* 実験用コードを本番 SDK に混ぜること
* 配布物に Studio / examples / docs / authoring tools を含めること

## コマンド

現時点では root には `start` のみ定義済み。

```text
npm run start
```

実装環境を作成した後、以下を定義する予定。

```text
npm run build
npm run test
npm run lint
```

## Codexへの依頼方針

Codexへの依頼は、原則として以下の形式で行う。

```text
目的
実装内容
変更してよい範囲
変更してはいけない範囲
確認コマンド
完了条件
```

## 完了報告

作業完了時は、以下を報告する。

```text
Summary
- 変更内容

Testing
- 実行した確認コマンド
```
