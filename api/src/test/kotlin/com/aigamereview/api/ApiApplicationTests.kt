package com.aigamereview.api

import org.flywaydb.core.Flyway
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.junit.jupiter.api.Tag
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/**
 * Spring コンテキストが PostgreSQL 込みで起動し、マイグレーションが適用されることを確認する。
 *
 * Spring を起動するテストは必ず `@Tag("integration")` を付ける。
 * ドメイン層のテストは Spring を使わない純粋な Kotlin テストとして書き、`./gradlew unitTest` で回す。
 */
@Tag("integration")
@SpringBootTest
@Import(TestcontainersConfiguration::class)
class ApiApplicationTests(@Autowired private val flyway: Flyway) {
    @Test
    fun `migrations are applied on startup`() {
        val applied = flyway.info().applied()

        assertTrue(applied.isNotEmpty())
        assertTrue(applied.all { it.state.isApplied && !it.state.isFailed })
    }

    @Test
    fun `exposed is connected to the datasource`() {
        val result = transaction { exec("SELECT 1") { rs -> rs.next() && rs.getInt(1) == 1 } }

        assertEquals(true, result)
    }
}
