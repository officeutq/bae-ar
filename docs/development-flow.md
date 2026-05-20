# 開発の流れ

## 基本方針

BAE AR は、Engine SDK と Studio を並行して育てます。

Engine SDK だけを先に作り込まず、Studio だけを先に作り込まず、機能単位で小さく反復しながら開発します。

## 開発サイクル

基本的な開発サイクルは以下です。

```text
1. Engine SDK の基本 API を作る
2. Studio の基本 UI を作る
3. Engine SDK に加工機能を1つ追加する
4. Studio に、その加工を確認・調整できる機能を追加する
5. Studio で実際の映像を確認する
6. 必要に応じて Engine SDK の API や内部設計を見直す
7. 次の加工機能へ進む
```

## 重要な考え方

Beauty Engine は、コード上の正しさだけでは品質を判断できません。

実際のカメラ映像で確認しながら、以下を検証する必要があります。

```text
- 自然に見えるか
- 顔の向きで破綻しないか
- 加工が強すぎないか
- 弱・中・強の調整がしやすいか
- 本番アプリに組み込みやすい API になっているか
```

## Studio の役割

Studio は開発用アプリですが、Engine SDK の内部には依存しません。

Studio が利用してよいのは、Engine SDK の公開 API のみです。

```text
OK:
engine.start()
engine.stop()
engine.setPreset()
engine.setIdealFace()
engine.getRuntimeSnapshot()

NG:
engine 内部状態を直接変更する
private な処理を呼び出す
SDK 内部の一時実装に依存する
```

## 最初のマイルストーン

最初は、以下を目標にします。

```text
- Engine SDK の空の基本構造を作る
- Studio の空の基本構造を作る
- カメラ映像を取得する
- canvas に映像を描画する
- start / stop / dispose のライフサイクルを確認する
```

この段階では、美顔加工の完成度は求めません。

まずは、Engine SDK と Studio が分離された状態で接続できることを重視します。

````

作成コマンドは PowerShell ならこれでいけます。

```powershell
cd C:\dev\bae-ar

mkdir docs

notepad README.md
notepad docs\overview.md
notepad docs\development-flow.md