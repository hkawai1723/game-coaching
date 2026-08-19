---
paths:
  - "frontend/**"
---
# SPA パターン (frontend)

> ここに書いてあるライブラリ（TanStack Router / Query, Zustand, ky）は **まだ未導入**。
> 導入時にこのパターンに従う、という取り決め。詳細は [development.md](development.md) の構成表を参照。

## 認証パターン

auth-api（`../upagu-auth-api`）が発行する ES256 JWT を使う。access_token の有効期限は 30 分、
refresh_token は opaque token で HttpOnly Cookie として `api/web` が管理する。

### access_token のメモリ保持

```typescript
// stores/auth.ts
interface AuthState {
  accessToken: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setAuth: (accessToken, user) => set({ accessToken, user }),
  logout: () => set({ accessToken: null, user: null }),
}));
```

> **重要**: accessToken は localStorage / sessionStorage に保存しない。メモリのみ。

### ky interceptor による Authorization ヘッダー付与

```typescript
// lib/api.ts
import ky from 'ky';
import { useAuthStore } from '@/stores/auth';

export const api = ky.create({
  prefixUrl: import.meta.env.VITE_API_URL,
  credentials: 'include', // Cookie 送信（refresh_token 用）
  hooks: {
    beforeRequest: [
      (request) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        if (response.status === 401) {
          const refreshed = await tryRefreshToken();
          if (refreshed) {
            request.headers.set('Authorization', `Bearer ${refreshed}`);
            return ky(request);
          }
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
      },
    ],
  },
});
```

### ログアウト

```typescript
async function logout() {
  await api.post('auth/logout'); // api/web に通知（Cookie 削除）
  useAuthStore.getState().logout(); // メモリクリア
  // ログイン画面にリダイレクト
}
```

## API 通信パターン

### TanStack Query の query / mutation

```typescript
// features/auth/api/queries.ts
export const useCurrentUser = () =>
  useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.get('users/me').json<User>(),
  });

// features/auth/api/mutations.ts
export const useLogin = () =>
  useMutation({
    mutationFn: (body: LoginRequest) =>
      api.post('auth/login', { json: body }).json<LoginResponse>(),
    onSuccess: (data) => {
      useAuthStore.getState().setAuth(data.accessToken, data.user);
    },
  });
```

### 非同期ジョブ（動画解析）のポーリング

解析は数十秒〜数分かかる。**アップロードのレスポンスは解析結果ではなくジョブ**。

```typescript
// features/upload/api/queries.ts
export const useAnalysisJob = (jobId: string) =>
  useQuery({
    queryKey: ['analysisJob', jobId],
    queryFn: () => api.get(`analyses/${jobId}`).json<AnalysisJob>(),
    // 完了 / 失敗したらポーリングを止める
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'COMPLETED' || status === 'FAILED' ? false : 5000;
    },
  });
```

- 状態は `PENDING | ANALYZING | COMPLETED | FAILED` をサーバーが持つ。クライアントで推測しない
- ポーリング間隔をむやみに短くしない（サーバー負荷と LLM コストに直結する）
- 画面を離れても解析は継続する。復帰時はジョブ ID から状態を引き直す

### エラーハンドリング

- **グローバル**: React Error Boundary でアプリ全体の未処理エラーをキャッチ
- **per-query**: 各 query/mutation の `onError` で個別ハンドリング
- **TanStack Query のグローバル設定**: `QueryClient` の `defaultOptions` で共通エラー処理
- サーバーは RFC 9457 (`application/problem+json`) を返す。`title` / `detail` を表示に使い、
  `type` で分岐する。HTTP ステータスだけで判断しない

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      onError: (error) => {
        // グローバルなエラー通知（toast 等）
      },
    },
  },
});
```

### ローディング状態

- TanStack Query の `isPending`, `isFetching` を活用
- Suspense + `useSuspenseQuery` でローディング UI を宣言的に管理
- ただし解析ジョブは「待たせる」のではなく進捗を見せる。スピナーだけで済ませない

## ルーティングパターン

### TanStack Router file-based routing

```
src/routes/
├── __root.tsx         # ルートレイアウト
├── index.tsx          # /
├── (auth)/            # 認証ページ（グループ化のみ、URL に影響なし）
│   ├── login.tsx      # /login
│   └── register.tsx   # /register
└── _authenticated/    # 認証必須レイアウト（pathless layout）
    ├── route.tsx      # 認証ガード
    ├── upload.tsx     # /upload      動画アップロード
    ├── reviews/       # /reviews     解析済みの試合一覧・詳細
    └── subscription.tsx # /subscription
```

- `()` ディレクトリ: ファイル整理のみ（URL に反映しない）
- `_` prefix: pathless layout route（共通レイアウト適用）

### 認証ガード

```typescript
// routes/_authenticated/route.tsx
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    const { accessToken } = useAuthStore.getState();
    if (!accessToken) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }
  },
  component: AuthenticatedLayout,
});
```

### Code Splitting

- TanStack Router の file-based routing で自動的に lazy route になる
- 重いコンポーネント（動画プレイヤー等）は `React.lazy()` + `Suspense` で分割
