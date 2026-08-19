---
name: review-test-case
description: >-
  テスト仕様書 MD をレビューし、テストケースの網羅性・品質を検証する。
  問題があれば修正してテスト仕様書を改善する。
context: fork
agent: general-purpose
model: opus
allowed-tools: Read Grep Glob Edit Bash(git *)
argument-hint: <test-spec-path> [--help]
---

## ヘルプ

`$ARGUMENTS` に `--help` が含まれる場合、以下を表示して終了する:

```
使い方: /review-test-case <test-spec-path>

引数:
  <test-spec-path>  テスト仕様書 MD ファイルのパス

オプション:
  --help            このヘルプを表示

例:
  /review-test-case docs/hotstreak/test-specs/feature-deck-crud_20260814.md
```

## ゴール

テスト仕様書 MD を [references/review-criteria.md](references/review-criteria.md) の基準に従ってレビューし、
問題があればテスト仕様書を直接修正して品質を改善する。

## 手順

### 1. テスト仕様書の読み込み

`$ARGUMENTS` で指定されたテスト仕様書 MD ファイルを読み込む。

### 2. 関連情報の収集

テスト仕様書のメタ情報（ブランチ名、変更概要）から、以下を確認する:

```bash
# 変更されたファイル一覧
git diff --name-status <base-branch>...HEAD

# 設計ドキュメントの確認
```

関連する設計ドキュメントを読み、テストケースの網羅性を検証する:

- `docs/*/design/screen-transition.md`
- `docs/*/design/usecase.md`
- `docs/*/requirements/*.md`

### 3. レビュー基準に基づく検証

[references/review-criteria.md](references/review-criteria.md) の各観点について検証する:

1. **網羅性** — 変更箇所がすべてカバーされているか
2. **カテゴリバランス** — 正常系・異常系・境界値のバランス
3. **テストケースの独立性** — 単独実行可能か
4. **前提条件の明確さ** — 再現可能か
5. **期待結果の検証可能性** — 曖昧な表現がないか
6. **優先度の妥当性** — リスクに応じた設定か
7. **重複の排除** — 不要な重複がないか
8. **セキュリティ観点** — 認証・認可のテストがあるか
9. **画面名・用語の一貫性** — 設計ドキュメントと一致しているか
10. **フォーマット準拠** — テスト仕様書フォーマットに従っているか

### 4. 問題の修正

発見した問題に応じてテスト仕様書を直接修正する:

- **テストケースの欠落** → テストケースを追加する
- **期待結果の曖昧さ** → 具体的な表現に書き換える
- **前提条件の不足** → 必要な前提条件を追記する
- **重複** → 統合または削除する
- **画面名の不一致** → 設計ドキュメントの名称に統一する
- **フォーマット違反** → フォーマットに合わせて修正する

テストケースを追加した場合、ID の連番を適切に振り直す。

### 5. レビュー結果の報告

以下のフォーマットで報告する:

```
## レビュー結果

| 観点 | 判定 | 備考 |
|------|------|------|
| 網羅性 | PASS/WARN/FAIL | <詳細> |
| カテゴリバランス | PASS/WARN/FAIL | <詳細> |
| ... | ... | ... |

### 総合判定: PASS / WARN / FAIL

### 修正内容
- <修正1>
- <修正2>

### テストケース数
- 修正前: X 件
- 修正後: Y 件（追加 Z 件、削除 W 件）
```
