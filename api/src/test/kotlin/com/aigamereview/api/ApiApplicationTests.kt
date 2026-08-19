package com.aigamereview.api

import org.junit.jupiter.api.Tag
import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest

/**
 * Spring コンテキストが起動することだけを確認する。
 *
 * Spring を起動するテストは必ず `@Tag("integration")` を付ける。
 * ドメイン層のテストは Spring を使わない純粋な Kotlin テストとして書き、`./gradlew unitTest` で回す。
 */
@Tag("integration")
@SpringBootTest
class ApiApplicationTests {
    @Test
    fun contextLoads() {
    }
}
