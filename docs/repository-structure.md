# リポジトリ構成

## 想定構成

BAE AR のリポジトリは、以下の構成を想定します。

```text
bae-ar/
├ packages/
│  └ engine/
│     └ 本番配布対象の Beauty Engine SDK
│
├ apps/
│  └ studio/
│     └ Engine SDK を確認・調整する開発用アプリ
│
└ docs/
   └ 設計・仕様ドキュメント
```

## packages/engine

`packages/engine` は、本番アプリケーションから利用する Beauty Engine SDK を配置する場所です。

将来的には npm package 化することを想定します。

配布対象に含めるのは、原則としてこの Engine SDK です。

## apps/studio

`apps/studio` は、Engine SDK を確認・調整するための開発用アプリを配置する場所です。

Studio は配布対象に含めません。

Studio は Engine SDK の公開 API のみを利用し、Engine SDK の内部実装へ直接依存しないようにします。

## docs

`docs` は、設計判断や仕様を残す場所です。

実装前の判断、開発の進め方、リポジトリ構成、アーキテクチャ上の制約などを記録します。

## 開発方針

Engine SDK と Studio は同一リポジトリ内に置きます。

ただし、責務は分離します。

Engine SDK は本番利用する中核ライブラリとして扱い、Studio は開発・検証・調整のためのアプリとして扱います。

実装を追加するときは、原則として Issue 単位で目的を絞り、小さく進めます。
