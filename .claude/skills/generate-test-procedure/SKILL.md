---
name: generate-test-procedure
description: >-
  テスト仕様書のテストケースに具体的な GUI 操作手順を追記し、CSV ファイルを出力する。
  コードベースと設計ドキュメントを調査して画面名・ボタン名・入力フィールド名を特定する。
context: fork
agent: general-purpose
model: sonnet
allowed-tools: Read Grep Glob Edit Bash(node *) Bash(git *) Agent
argument-hint: <test-spec-path> [--skip-csv] [--help]
---

## ヘルプ

`$ARGUMENTS` に `--help` が含まれる場合、以下を表示して終了する:

```
使い方: /generate-test-procedure <test-spec-path> [--skip-csv]

引数:
  <test-spec-path>  テスト仕様書 MD ファイルのパス

オプション:
  --skip-csv        CSV 出力をスキップ
  --help            このヘルプを表示

例:
  /generate-test-procedure docs/hotstreak/test-specs/feature-deck-crud_20260814.md
  /generate-test-procedure docs/hotstreak/test-specs/feature-deck-crud_20260814.md --skip-csv
```

## ゴール

テスト仕様書 MD の各テストケースに具体的な GUI 操作手順を記入し、CSV ファイルを出力する。
テスターが迷わず操作できるよう、実際の画面名・ボタン名・入力フィールド名を使用する。

## 手順

### 1. テスト仕様書の読み込み

`$ARGUMENTS` で指定されたテスト仕様書 MD ファイルを読み込む。
メタ情報から対象機能・変更概要を把握する。

### 2. GUI 要素の調査

Explore エージェントを使って、コードベースと設計ドキュメントから GUI 要素を調査する。

#### 調査対象

以下のソースから画面名・ボタン名・入力フィールド名・ラベル・メッセージを収集する:

**設計ドキュメント（優先）:**
- `docs/*/design/screen-transition.md` — 画面名、遷移先
- `docs/*/design/usecase.md` — ユーザー操作フロー
- `docs/*/design/business-flow.md` — 業務フロー
- `docs/*/design/api-design.md` — API のリクエスト・レスポンス

**フロントエンドコード（利用可能な場合）:**
- コンポーネントファイル — ボタンラベル、入力フィールドの placeholder / label
- ルーティング定義 — 画面パス、画面名
- i18n / メッセージ定義 — 表示テキスト
- バリデーションメッセージ — エラーメッセージの文言

**バックエンドコード:**
- DTO / リクエストクラス — フィールド名、バリデーション制約
- エラーレスポンス定義 — エラーメッセージ
- コントローラー — エンドポイントパス

#### Explore エージェントの使い方

テストケースの画面ごとに Explore エージェントを呼び出す:

```
Agent(Explore): 「<画面名>」画面の GUI 要素を調査してください。
以下の情報を収集してください:
- 画面のコンポーネント名とファイルパス
- ボタンのラベルテキスト一覧
- 入力フィールドの名前・ラベル・placeholder 一覧
- エラーメッセージの文言一覧
- 画面遷移先（どのボタンでどこに遷移するか）
調査対象: docs/ ディレクトリの設計ドキュメントおよび src/ ディレクトリのソースコード
```

### 3. テスト手順の作成

各テストケースの `テスト手順` フィールド（`--` マーカー）を具体的な GUI 操作手順で置き換える。

#### 記述ルール

- 番号付きリストで、テスターが上から順に実行できる手順にする
- テーブル内では `\n` で改行を表現する
- 画面名・ボタン名・入力フィールド名は「」で囲む
- 入力値は具体的なテストデータを記載する
- 確認操作（目視確認）も手順に含める

#### 記述例

```
1. アプリを起動し「ホーム」画面を表示する\n2. 「デッキ作成」ボタンをタップする\n3. 「デッキ名」入力欄に「テストデッキ」と入力する\n4. 「説明」入力欄に「テスト用のデッキです」と入力する\n5. 「保存」ボタンをタップする
```

### 4. テスト仕様書の更新

Edit ツールを使い、テスト仕様書 MD ファイルの各テストケースのテスト手順を更新する。

### 5. CSV 出力

`--skip-csv` が指定されていない場合、CSV 変換スクリプトを実行する:

```bash
node ${CLAUDE_SKILL_DIR}/scripts/md-to-csv.mjs <test-spec-path>
```

CSV は入力ファイルと同じディレクトリに `.csv` 拡張子で出力される。

### 6. 完了報告

以下を表示する:

- 更新したテスト仕様書 MD ファイルパス
- テスト手順を記入したテストケース数
- CSV ファイルパス（出力した場合）
