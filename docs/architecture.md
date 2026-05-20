# アーキテクチャ

## 基本構成

BAE AR は、Engine SDK と Studio を中心に構成します。

Engine SDK は、本番アプリケーションに組み込むための中核ライブラリです。

Studio は、Engine SDK を開発・検証・調整するためのアプリです。

```text
BAE AR

├ Engine SDK
│  └ 本番アプリケーションから利用する Beauty Engine SDK
│
└ Studio
   └ Engine SDK を開発・検証・調整するための開発用アプリ
```

## Engine SDK

Engine SDK は、リアルタイムの顔加工・AR 表現を本番サービスに組み込むためのライブラリです。

Engine SDK は UI を持ちません。

Engine SDK の責務は、顔検出、顔構造の解析、加工処理、描画、実行状態の管理など、Beauty Engine として必要な処理を提供することです。

## Studio

Studio は、Engine SDK を育てるための開発・検証環境です。

Studio は、カメラ映像での動作確認、加工結果の確認、パラメータ調整、プリセット確認などを行うために利用します。

Studio が利用してよいのは、Engine SDK の公開 API のみです。

Studio から Engine SDK の内部実装へ直接依存してはいけません。

これにより、Studio での確認が本番アプリケーションからの利用に近い形になるようにします。

## 配布方針

配布対象は Engine SDK のみです。

Studio、開発用 UI、デバッグ機能、サンプル、ドキュメントは配布対象に含めません。

## 将来的な拡張

将来的には、理想顔作成やプリセット作成の機能を扱う可能性があります。

ただし、初期設計では Engine SDK と Studio を優先します。

まずは、Engine SDK と Studio が責務を分離した状態で接続できることを重視します。
