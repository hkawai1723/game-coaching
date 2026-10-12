# Architecture Decision Records

リポジトリ全体に関わる技術的意思決定の記録。**「なぜそうしたか」を残すのが目的**で、
「どうやるか」は `docs/<context>/design/` に書く。

## いつ書くか

- アーキテクチャの選択（モジュール構成、同期/非同期、永続化方式）
- **LLM のプロバイダー選定・モデル選定・プロンプト設計の変更**（必須。品質とコストに直結する）
- 外部サービスへの依存を増やす / 減らす
- 後から覆すのが高くつく決定

逆に、ライブラリのマイナーバージョン更新や 1 モジュール内で閉じる実装判断は ADR にしない。

## 命名

`NNNN-<kebab-case-title>.md`（連番は再利用しない）。

## ステータス

| Status | 意味 |
|--------|------|
| `Proposed` | 提案中。まだ実装してよい状態ではない |
| `Accepted` | 採用。実装がこれに従う |
| `Superseded by ADR-NNNN` | 後続の ADR に置き換えられた。**内容は書き換えず残す** |
| `Deferred` | 決定自体は今も妥当だが、前提（対象タイトル・入力経路など）が当面外れたので保留。前提が戻ったら見直す |
| `Deprecated` | 採用をやめたが置き換え先が無い |

決定を覆すときは既存の ADR を書き換えず、新しい ADR を書いて古い方を `Superseded` にする。
履歴が消えると「なぜ変えたか」が失われる。

## 一覧

| # | タイトル | Status |
|---|---------|--------|
| [0001](0001-modular-monolith-with-spring-modulith.md) | モジュラーモノリスを Spring Modulith で機械的に強制する | Accepted |
| [0002](0002-video-only-match-data-input.md) | 試合データの入力経路を動画のみとする | Superseded by ADR-0012 |
| [0003](0003-gemini-for-play-narration.md) | 動画 → プレイ行動の言語化に Gemini を使う | Deferred（COACH-17 で見直す。ADR-0015） |
| [0004](0004-three-tier-test-strategy.md) | テストを 3 層に分け、ドメイン層は Spring を使わない | Accepted |
| [0005](0005-payment-as-reusable-module.md) | payment をプロダクト非依存の再利用モジュールとして扱う | Accepted |
| [0006](0006-jwt-verification-only.md) | 認証は別リポジトリの auth-api に委ね、api は JWT を検証するだけにする | Accepted |
| [0007](0007-perception-pipeline-with-deterministic-grounding.md) | 知覚層を決定論的抽出で接地した多段パイプラインにする | Deferred（COACH-17 で見直す。ADR-0015） |
| [0008](0008-direct-llm-provider-apis-in-phase-1.md) | Phase 1 は LLM プロバイダーの API を直接叩き、マネージド基盤を採らない | Accepted |
| [0009](0009-build-wild-rift-knowledge-ourselves.md) | Wild Rift ナレッジは自作する。LoL (PC) のデータを流用しない | Deferred |
| [0010](0010-deterministic-combat-model-with-gank-risk-outside.md) | 戦闘勝率は決定論的な数値計算で求め、ガンクリスクをモデル外に置く | Accepted |
| [0011](0011-staged-modifier-pipeline-for-combat-effects.md) | 戦闘効果の合成を段階パイプラインと宣言的モディファイアで表現する | Proposed |
| [0012](0012-lol-pc-as-first-title.md) | 最初の対象タイトルを LoL (PC) にし、Wild Rift を保留する | Accepted（動画の扱いは ADR-0015 で改めた） |
| [0013](0013-gemini-for-coaching-generation-in-mvp.md) | MVP のコーチング生成には Gemini を使い、差し替えられる形にしておく | Accepted |
| [0014](0014-postgresql-with-exposed-and-flyway.md) | 永続化は PostgreSQL + Exposed + Flyway にし、テーブルはモジュール名を頭に付けて所有する | Accepted |
| [0015](0015-recording-input-in-mvp-and-module-rename.md) | MVP で録画も入力にし、モジュールを `ingestion` / `playlog` に改名する | Accepted |

> ADR-0001〜0014 の `match` は `ingestion`、`analysis` は `playlog` を指す（ADR-0015 で改名）。

## テンプレート

[template.md](template.md) をコピーして使う。
