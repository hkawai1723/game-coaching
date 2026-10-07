# user

ユーザープロフィールを担当する Bounded Context。

## 責務

- プレイヤーのプロフィール（表示名、対象タイトル、設定等）を保持する
- 認証（誰であるか）は持たない。**auth-api（別リポジトリ）が発行した JWT の `sub`（ULID）を
  参照するだけ**（ADR-0006）。IdentityProvider や Cognito をこのモジュールに持ち込まない

## 現状

未着手。

- `requirements/` — まだ無い
- `design/` — まだ無い

関連 ADR: [0006](../adr/0006-jwt-verification-only.md)（認証は auth-api に委ねる）
