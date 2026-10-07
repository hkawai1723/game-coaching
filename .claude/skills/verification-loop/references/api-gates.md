# api Gates (Kotlin / Spring Boot)

`api/` に変更があるときだけ読む。すべて `api/` ディレクトリで実行する。

## Gates

| # | Gate | Command | 状態 | 失敗時 |
|---|------|---------|------|--------|
| 1 | 高速テスト（Spring 起動なし・**モジュール境界検証を含む**） | `./gradlew unitTest` | 利用可 | 報告して修正。ここが速いので最初に回す |
| 2 | Build + Test（統合含む） | `./gradlew build` | 利用可 | STOP。以降のゲートを回さず修正する |
| 3 | Lint | `./gradlew detekt` | 利用可 | 報告して修正（`autoCorrect = false` なので手で直す） |
| 4 | Format | `./gradlew spotlessCheck` | 利用可 | 報告。`--with-fix` 時のみ `spotlessApply` |
| 5 | Coverage (kover) | `./gradlew koverVerify` | 利用可 | 報告して修正。閾値は `build.gradle.kts` の `kover.reports.verify.rule.minBound` |

```bash
cd api

# まず高速テストだけ（数秒）。壊れていればここで分かる
./gradlew unitTest

# 通ったらまとめて
./gradlew build detekt spotlessCheck
```

出力が長いので、失敗時は `2>&1 | tail -40` で末尾だけ見る。通っているなら `BUILD SUCCESSFUL` の
1 行を確認すれば足りる。

## 注意点

- **`koverVerify` は `test` と `unitTest` の両方に依存する。** 統合テストも含めた実行結果を対象にカバレッジを
  測る。単独の高速ゲートではないので、実装中のループには含めず `build` の後にまとめて回す
- **`unitTest` と `test` は別物。** `unitTest` は `@Tag("integration")` を除外した高速テスト
  （Spring コンテキストを起動しない）。実装中の検証ループはこちらを回す
- **モジュール境界違反は `unitTest` で落ちる。** `ModularityTest` が `ApplicationModules.verify()` を
  実行する（Spring 起動なしなので速い）。「境界を壊していないか」を別途レビューで探さないこと
- **`@Tag("external")` は常に除外されている。** LLM 等を実際に叩くテストがゲートで課金を発生させない
  ようにするため。ここを緩めない
- **`build` は `test` を含む。** 別途 `./gradlew test` を回す必要はない。二重に回すと待ち時間が倍になる
- **Type check は独立したゲートではない。** Kotlin は型エラーがそのままコンパイルエラーなので、
  `build` が通れば型は通っている。`tsc --noEmit` 相当を探さないこと
- **Spring Modulith を入れたら 2 を必須ゲートにする。** モジュール境界違反はレビューで見つけるのではなく
  ビルドで落とす（`ApplicationModules.verify()`）
- **LLM を実際に叩くテストをここで回さない。** `@Tag("external")` を付けて通常のビルドから除外しておく。
  ゲートで課金が発生する状態にしない
- Gradle daemon が落ちていると初回が遅い。タイムアウトしたように見えても待つ

## pre-commit hook

`scripts/.githooks/pre-commit` が staged の `.kt` に対して `spotlessApply` → `spotlessCheck` + `detekt`
を実行する。`api/` で `./gradlew` を一度でも実行すれば `installGitHooks` タスクが `core.hooksPath` を
設定するので、クローン後の手作業は不要。

**hook が効いているなら Format ゲートは通って当然。** 落ちたら hook 未設定を疑う
（`git config core.hooksPath` が `scripts/.githooks` を返すか確認する）。

## --with-fix 時のみ

```bash
cd api && ./gradlew spotlessApply
```

detekt は `autoCorrect = false` なので自動修正しない。手で直す。

## ツール導入時にやること

kover を入れるときは `../upagu` の `core/build.gradle.kts` を土台にする。導入したら:

1. この表の「状態」を更新する
2. `.claude/rules/api/kotlin-coding-style.md` の Tooling 表を更新する
3. CI (`.github/workflows/`) を作る。以後は CI をゲート定義の権威とする
