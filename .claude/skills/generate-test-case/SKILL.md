---
name: generate-test-case
description: >-
  git diff を分析してブラックボックス E2E テストケースを導出し、テスト仕様書 MD を生成する。
  フィーチャーブランチやプルリクエストのテスト仕様書作成時に使用する。
context: fork
agent: general-purpose
model: opus
allowed-tools: Read Grep Glob Bash(git *)
argument-hint: [<base-branch>] [--scope <path>] [--help]
---

## ヘルプ

`$ARGUMENTS` に `--help` が含まれる場合、以下を表示して終了する:

```
使い方: /generate-test-case [<base-branch>] [--scope <path>]

引数:
  <base-branch>     差分比較のベースブランチ（デフォルト: main）

オプション:
  --scope <path>    分析対象を特定ディレクトリに限定
  --help            このヘルプを表示

例:
  /generate-test-case                     現在のブランチ vs main
  /generate-test-case develop             現在のブランチ vs develop
  /generate-test-case --scope src/user    src/user の変更のみ分析
```

## ゴール

現在のブランチとベースブランチの git diff を分析し、ブラックボックス E2E テストケースを導出する。
出力は [references/test-spec-format.md](references/test-spec-format.md) に定義されたフォーマットに従う。

テスターが GUI を操作して実施する手動テストであり、自動テストではない。
コードの内部実装ではなく、**ユーザーから見える振る舞い**に焦点を当てる。

## 手順

### 1. 引数の解析

- `<base-branch>`: デフォルト `main`
- `--scope <path>`: 指定時は diff 対象をそのパスに限定

### 2. 差分情報の収集

```bash
git branch --show-current
git diff --name-status <base-branch>...HEAD [-- <scope>]
git diff <base-branch>...HEAD [-- <scope>]
git log --oneline <base-branch>..HEAD [-- <scope>]
```

### 3. 設計ドキュメントの参照

変更に関連する設計ドキュメントを読み、画面名・ユースケース・業務フローを把握する:

- `docs/*/design/screen-transition.md` — 画面遷移図
- `docs/*/design/usecase.md` — ユースケース
- `docs/*/design/business-flow.md` — 業務フロー
- `docs/*/design/api-design.md` — API 設計
- `docs/*/requirements/*.md` — 要件定義

### 4. 変更内容の分析

diff と設計ドキュメントから以下を分析する:

- **新規追加された画面・機能**: 画面表示、操作、遷移
- **修正された既存機能**: 変更前後のユーザー体験の差異
- **API エンドポイントの追加・変更**: 画面上でのデータ表示・操作への影響
- **バリデーションの追加・変更**: 入力制約、エラーメッセージ
- **DB スキーマ変更**: データの表示・保存への影響

### 5. テストケースの導出

[references/test-spec-format.md](references/test-spec-format.md) のフォーマットに従い、テストケースを導出する。

導出の優先順:
1. **正常系** — 主要なユースケースの動作確認
2. **異常系** — エラーハンドリング、バリデーション、エラーメッセージ表示
3. **境界値** — 空入力、最大文字数、上限・下限
4. **セキュリティ** — 認証・認可（該当する場合）

注意:
- **テスト手順** は `--` のまま残す（generate-test-procedure が後から記入する）
- **操作概要** は抽象的に記載する（具体的な GUI 操作名は書かない）
- **画面名** は設計ドキュメントの名称と一致させる
- **期待結果** はテスターが画面上で確認できる具体的な条件にする

### 6. 出力

テスト仕様書を以下のパスに出力する:

```
docs/<bounded-context>/test-specs/<branch-name>_<YYYYMMDD>.md
```

- `<bounded-context>` は変更ファイルのパスから推定する（例: `src/.../hotstreak/` → `hotstreak`）
- 複数の Bounded Context にまたがる場合は `cross-module` を使用
- ディレクトリが存在しない場合は作成する

### 7. 完了報告

以下を表示する:

- 生成したファイルパス
- テストケース数（カテゴリ別の内訳）
- カバーした変更ファイル数
