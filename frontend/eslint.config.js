import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  // Orval 生成物は lint 対象外（手で直さない。再生成で上書きされる）
  globalIgnores(['dist', 'src/api']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      // 書式系ルールは Prettier に任せる。必ず最後に置くこと
      prettier,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
]);
