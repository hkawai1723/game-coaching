import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

// Orval 生成物 (src/api/**) はここでもカバレッジの分母から除外する。
// 理由は eslint.config.js / .prettierignore と同じ: 再生成で上書きされる生成物のため。
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // e2e/ は Playwright のテスト。Vitest が拾うと test() の呼び出しで落ちるので src/ に限定する
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        exclude: ['src/api/**', 'src/main.tsx', '**/*.d.ts'],
        // 現状はテストが無いためカバレッジ実体もゼロ。
        // コードが増えるたびに閾値を上げるラチェット運用にする（api の kover と同じ方針）。
        thresholds: {
          lines: 0,
          statements: 0,
          branches: 0,
          functions: 0,
        },
      },
    },
  }),
);
