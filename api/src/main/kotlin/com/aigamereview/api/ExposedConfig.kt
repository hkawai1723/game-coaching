package com.aigamereview.api

import org.jetbrains.exposed.v1.jdbc.Database
import org.springframework.context.annotation.Configuration
import javax.sql.DataSource

/**
 * Exposed を Spring Boot の DataSource（HikariCP）に繋ぐ。
 *
 * 接続情報は `spring.datasource.*`（環境変数）が正。Exposed 側で別に接続を張らない。
 */
@Configuration(proxyBeanMethods = false)
class ExposedConfig(dataSource: DataSource) {
    init {
        Database.connect(dataSource)
    }
}
