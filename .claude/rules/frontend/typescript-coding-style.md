---
paths:
  - "frontend/**/*.ts"
  - "frontend/**/*.tsx"
  - "frontend/**/*.js"
  - "frontend/**/*.jsx"
---
# TypeScript / React Coding Style (frontend)

## TypeScript

### strict mode 必須

- `any` 禁止。`unknown` を使って型を絞り込む
- 型推論が効く場合は明示的な型注釈を省略してよい
- 型定義の使い分け:
  - `type`: Union 型、Branded 型、関数型エイリアス
  - `interface`: それ以外（オブジェクト型、Props、State など）

### Immutability

```typescript
// NG: ミュータブル操作
function updateUser(user: User, name: string) {
  user.name = name;
  return user;
}

// OK: スプレッドで新しいオブジェクトを返す
function updateUser(user: User, name: string): User {
  return { ...user, name };
}
```

### エラーハンドリング

```typescript
import { HTTPError } from 'ky';

try {
  const result = await api.get('users/me').json<User>();
  return result;
} catch (error) {
  if (error instanceof HTTPError) {
    const body = await error.response.json();
    // エラーレスポンスに応じた処理
  }
  throw error;
}
```

### Validation (Zod)

```typescript
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type LoginRequest = z.infer<typeof loginSchema>;
```

## React

### コンポーネント

- 関数コンポーネント + hooks のみ（class コンポーネント禁止）
- `export default` は使わない。名前付きエクスポートを使う
- Props は interface で定義する

```typescript
interface LoginFormProps {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  // ...
}
```

### hooks

- カスタム hooks は `use` prefix を付ける
- hooks 内でのみ副作用を扱う。コンポーネントの JSX 部分はピュアに保つ

### console.log

- 本番コードに `console.log` を残さない
- デバッグ時のみ使用し、コミット前に削除する

## ESLint / Prettier

- ESLint: flat config (`eslint.config.js`)。**書式系ルールは持たない**（`eslint-config-prettier` で無効化済み）
- Prettier: 書式は Prettier が単独で決める。設定は `.prettierrc`
- import の並び順は `@ianvs/prettier-plugin-sort-imports` が自動整列する。手で並べ替えない
- `npm run format`（自動修正）/ `npm run format:check`（検査のみ）
- **commit 時に pre-commit hook が自動で走る**（`prettier --write` → `eslint --fix` → `eslint`）ので、
  手動フォーマットは不要。エディタの保存時フォーマットは任意
- Orval 生成物 `src/api/**` は ESLint / Prettier の対象外（`globalIgnores` と `.prettierignore`）
