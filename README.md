# BAE AR

BAE AR は、リアルタイムの顔加工・AR 表現を行うための Beauty Engine SDK と、その開発・検証を行う Studio を含むプロジェクトです。

## 目的

BAE AR の目的は、単なるフィルターではなく、本番サービスに組み込める自然な Beauty Engine を開発することです。

特に、Butterflyve のようなライブ配信サービスで利用できる、自然で破綻しにくい顔加工エンジンを目指します。

## 構成方針

BAE AR は、以下の2つを中心に構成します。

```text
packages/engine
  本番利用する Beauty Engine SDK

apps/studio
  Engine SDK を開発・検証・調整するための Studio
```

現在は、npm workspaces を使って `packages/engine` と `apps/studio` を同一リポジトリ内で管理する土台を置いています。

## 基本方針

* Engine SDK は UI を持たない
* Studio は Engine SDK の公開 API のみを利用する
* Studio から Engine SDK の内部実装を直接触らない
* Engine SDK に機能を追加したら、Studio 側にも確認・調整できる機能を追加する
* 配布対象は Engine SDK のみとする

## 開発ドキュメント

* [概要](docs/overview.md)
* [開発の流れ](docs/development-flow.md)
* [アーキテクチャ](docs/architecture.md)
* [リポジトリ構成](docs/repository-structure.md)
