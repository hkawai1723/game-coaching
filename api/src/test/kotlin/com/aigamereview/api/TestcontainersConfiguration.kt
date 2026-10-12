package com.aigamereview.api

import org.springframework.boot.test.context.TestConfiguration
import org.springframework.boot.testcontainers.service.connection.ServiceConnection
import org.springframework.context.annotation.Bean
import org.testcontainers.postgresql.PostgreSQLContainer

/**
 * 統合テスト用の PostgreSQL。
 *
 * JSONB など PostgreSQL 固有の機能を使うので H2 では代用しない。compose.yaml と同じメジャーバージョンに揃える。
 * `@Tag("integration")` のテストからだけ `@Import` する（`./gradlew unitTest` は Docker を必要としない）。
 */
@TestConfiguration(proxyBeanMethods = false)
class TestcontainersConfiguration {
    @Bean
    @ServiceConnection
    fun postgresContainer(): PostgreSQLContainer = PostgreSQLContainer("postgres:18-alpine")
}
