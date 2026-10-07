# ADR-0006: 認証は別リポジトリの auth-api に委ね、api は JWT を検証するだけにする

- **Status**: Accepted
- **Date**: 2026-08-19
- **Deciders**: h.kawai

## Context

認証基盤（IdentityProvider の抽象化、トークン発行、RBAC）は、このプロダクトと `../upagu` の
両方で必要になる。認証は **間違えるとセキュリティ事故に直結する** 領域なので、
プロダクトごとに実装を持つのは避けたい。

`upagu-auth-api` が既に存在し、Cognito を内部実装として隠蔽したうえで独自 JWT を発行している。

## Decision

**認証は `../upagu-auth-api`（別リポジトリ）に委ねる。このリポジトリの api は JWT を検証するだけにする。**

- JWT は auth-api が発行する（ES256 / ECDSA P-256）。api は **発行しない**
- api は auth-api の EC 公開鍵で署名を検証する。**Cognito を直接知らない**
- access_token の有効期限は 30 分、`iss` = `upagu-auth`、`sub` = ULID（26 文字）
- refresh_token は JWT ではなく opaque token（32 バイト）。auth-api が PostgreSQL で管理する
- refresh_token の HttpOnly Cookie 管理は `api/web` の責務
- 仕様の正は `../upagu-auth-api/docs/auth-api-specification.md`。**このリポジトリに写経しない**（ドリフトするため）

## Consequences

### 良くなること

- 認証の実装が 1 か所に集約される。脆弱性対応も 1 か所で済む
- api は公開鍵検証だけを持てばよく、秘密鍵を持たない。**鍵の漏洩面が減る**
- IdentityProvider（現状 Cognito）の差し替えが api に影響しない

### 悪くなること / 引き受けるリスク

- **別リポジトリへの依存が発生する。** auth-api の仕様変更がこちらのビルドに現れない
  （型で守られていない）ので、破壊的変更に気付くのが実行時になりうる
- ローカル開発で auth-api を立てるか、検証をバイパスする仕組みが要る
- 認証の障害がこのプロダクトの障害になる。可用性が auth-api に引きずられる

### この決定を覆すときのコスト

高い。api 側に認証を持たせ直すと、Cognito 連携・トークン発行・RBAC・鍵管理をすべて抱えることになる。
覆す想定はしていない。

## Alternatives Considered

| 案 | 却下理由 |
|----|---------|
| api が Cognito を直接叩く | IdentityProvider に密結合する。upagu と実装が二重になる |
| api が独自に JWT を発行する | 秘密鍵を持つ必要がある。鍵管理とローテーションを 2 か所で運用することになる |
| auth-api をこのリポジトリに取り込む | 共有基盤なので、取り込むと upagu 側と二重管理になる |
