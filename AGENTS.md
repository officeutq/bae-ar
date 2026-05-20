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

