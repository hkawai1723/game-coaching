---
paths:
  - "api/**"
---
# Development Rules (api)

## Test-Driven Development (TDD)

全ての機能追加・バグ修正で TDD を実践する:

1. テストを先に書く（RED）
2. テスト実行 → 失敗を確認
3. 最小限の実装（GREEN）
4. テスト実行 → 成功を確認
5. リファクタリング（IMPROVE）
6. カバレッジ 80%+ を維持

### テストの階層とタグ

AI 駆動で開発するため、**検証ループの速さがそのまま開発速度になる**。ドメインのテストで
Spring コンテキストを起動しない。

| 層 | 書き方 | タグ | コマンド | 速度 |
|----|--------|------|----------|------|
| ドメイン / アプリケーション | **純粋な Kotlin テスト**。`@SpringBootTest` 禁止 | なし | `./gradlew unitTest` | 秒 |
| モジュール統合 | `@ApplicationModuleTest`。DB は `@Import(TestcontainersConfiguration::class)` | `@Tag("integration")` | `./gradlew test`（**Docker 必須**） | 十数秒〜 |
| 外部 API 実呼び出し | LLM / auth-api を実際に叩く | `@Tag("external")` | 明示指定時のみ | 分 |

- **`unitTest` が第一の検証ループ。** 実装中はこれを回す。`test` は commit 前・PR 前
- `@Tag("external")` は `build.gradle.kts` で常に除外している。**ゲートで課金を発生させない**
- ドメイン層が Spring を必要としている時点で設計が間違っている。DI コンテナ無しでインスタンス化
  できないドメインモデルを作らない（constructor injection と port の徹底で自然にそうなる）
- 時刻・ID 生成・乱数は port 化して注入する。`Clock` / `IdGenerator` を差し替えられれば
  ドメインテストは決定論的になり、Spring も DB も要らなくなる

**LLM を叩く箇所はテストで実際に呼ばない。** port をモックする（[patterns.md](patterns.md) の LLM Provider 抽象を参照）。

## Domain-Driven Design (DDD)

- Bounded Context でモジュールを分割する。モジュール境界は Spring Modulith で機械的に強制する
- Entity / Value Object / Aggregate / Repository / Domain Service を適切に使い分ける
- Application Layer / Domain Layer / Infrastructure Layer を明確に分離する
- **ドメイン層は Gemini / Claude / Riot / S3 の型を一切知らない。** 外部依存は port（interface）で反転する

## OOP & SOLID

- SOLID を厳格に遵守する
- 継承より合成
- 単一責務: 1 クラス 1 責務
- イミュータブルを優先。ミュータブルな操作を避ける

## Code Quality

- 依存性逆転のために interface / abstract class を積極的に使う
- 適切な箇所でデザインパターンを適用する（Strategy, Factory, Observer 等）
- 拡張性・保守性のためのオーバーエンジニアリングは意図的に許容する

## Module Integration Rules

- **モジュール間の直接呼び出しは禁止。** 公開 API（named interface）かドメインイベント経由のみ
- テーブルはモジュールが所有する。他モジュールのテーブルを直接読まない・FK を張らない
- 他モジュールのエンティティを参照するときは ID（ULID 文字列）だけを持つ
- `payment` モジュールは他プロダクト（upagu）でも再利用する。依存の向きに特別な制約があるので
  [patterns.md](patterns.md) の Reusable Module (payment) を必ず読むこと

## Auth Design (api 側)

- **api は JWT を検証するだけ。発行はしない。** トークン発行は auth-api（`../upagu-auth-api`）が担う
- auth-api の EC 公開鍵で ES256 署名を検証する。Cognito は auth-api の内部実装であり api は知らない
- 検証する claim: `iss` = `upagu-auth`, `exp`, `sub`（ULID 26 文字のユーザー ID）
- SecurityFilter で JWT を検証し、認証済みユーザー情報をコンテキストに設定する
- refresh_token は opaque token。api は保持せず、`api/web` が HttpOnly Cookie として中継するだけ

## Failure Design

- 外部依存（Gemini / Claude API、auth-api、オブジェクトストレージ、MCP サーバー）の障害時は
  グレースフルデグラデーション。解析結果の一部が欠けても、取得済みの部分は返す
- リトライ・サーキットブレーカー・タイムアウトを必ず設定する。LLM 呼び出しはデフォルトで長時間かかる前提
- **動画解析は非同期。** リクエストスレッドを占有しない。ジョブの状態遷移（受付 → 解析中 → 完了 / 失敗）を
  永続化し、再実行可能にする
- LLM 呼び出しは冪等に設計する。同じ動画・同じプロンプトで再実行してもコストを二重に払わない
  （content hash によるキャッシュ。`content-hash-cache-pattern` スキル参照）
