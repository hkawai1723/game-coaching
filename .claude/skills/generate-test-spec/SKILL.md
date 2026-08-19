---
name: generate-test-spec
description: >-
  テスト仕様書ワークフローを実行する。テストケース生成 → レビュー → テスト手順作成を順番に実行し、
  最終的な MD + CSV を出力する。テスト仕様書の作成を依頼されたときに使用する。
argument-hint: [<base-branch>] [--scope <path>] [--help]
---

## ヘルプ

`$ARGUMENTS` に `--help` が含まれる場合、以下を表示して終了する:

```
使い方: /generate-test-spec [<base-branch>] [--scope <path>]

引数:
  <base-branch>     差分比較のベースブランチ（デフォルト: main）

オプション:
  --scope <path>    分析対象を特定ディレクトリに限定
  --help            このヘルプを表示

例:
  /generate-test-spec                     現在のブランチ vs main
  /generate-test-spec develop             現在のブランチ vs develop
  /generate-test-spec --scope src/user    src/user の変更のみ分析
```

## ゴール

以下の 3 つのスキルを順番に実行し、テスト仕様書（MD + CSV）を生成する。

## ワークフロー

### ステップ 1: テストケース生成（Opus）

`/generate-test-case $ARGUMENTS` を実行する。

- git diff を分析し、ブラックボックス E2E テストケースを導出
- テスト仕様書 MD ファイルが出力される
- 出力されたファイルパスを記録する

### ステップ 2: テストケースレビュー（Opus）

`/review-test-case <ステップ 1 の MD ファイルパス>` を実行する。

- テストケースの網羅性・品質をレビュー
- 問題があればテスト仕様書を直接修正
- レビュー結果が表示される

### ステップ 3: テスト手順作成 + CSV 出力（Sonnet）

`/generate-test-procedure <ステップ 1 の MD ファイルパス>` を実行する。

- コードベースと設計ドキュメントを調査して GUI 要素を特定
- 各テストケースに具体的な操作手順を追記
- CSV ファイルを出力

### 完了報告

すべてのステップが完了したら、以下を表示する:

- テスト仕様書 MD ファイルパス
- CSV ファイルパス
- テストケース総数（カテゴリ別内訳）
- レビュー結果サマリ
