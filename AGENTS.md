# AGENTS.md

## プロジェクト概要

BAE AR は、リアルタイム顔加工・AR 表現を行うための Beauty Engine SDK と、その開発・検証を行う Studio を含むプロジェクトです。

目的は、本番サービスに組み込める自然で破綻しにくい Beauty Engine を開発することです。

## 基本方針

- Engine SDK は本番利用する中核ライブラリである
- Studio は Engine SDK を開発・検証・調整するためのアプリである
- Engine SDK は UI を持たない
- Studio は Engine SDK の公開 API のみを利用する
- Studio から Engine SDK の内部実装を直接参照・変更してはいけない
- 配布対象は Engine SDK のみとする

## 想定構成

```text
packages/engine
  本番利用する Beauty Engine SDK

apps/studio
  Engine SDK を開発・検証・調整するための Studio

docs
  設計・仕様ドキュメント
```

## 開発ルール

* 1つのIssueでは、目的を絞って小さく実装する
* Engine SDK に機能を追加した場合、必要に応じて Studio 側にも確認手段を追加する
* 仕様が不明な場合は、推測で大きく作り込まず、最小実装に留める
* 既存ドキュメントと矛盾する実装をしない
* 実装前に関連ドキュメントを確認する
* 不要な抽象化を増やさない
* デバッグ用 UI や一時的な検証機能を SDK 本体に入れない

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

## 禁止事項

* Engine SDK に画面 UI を持たせること
* Studio から Engine SDK の private/internal 実装へ依存すること
* Issue の範囲外の大規模リファクタリングを行うこと
* 実験用コードを本番 SDK に混ぜること
* 配布物に Studio / examples / docs を含めること

## コマンド

現時点では未定義。

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

