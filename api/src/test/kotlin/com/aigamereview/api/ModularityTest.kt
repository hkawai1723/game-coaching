package com.aigamereview.api

import org.junit.jupiter.api.Test
import org.springframework.modulith.core.ApplicationModules
import org.springframework.modulith.docs.Documenter

/**
 * モジュール境界の検証。
 *
 * モジュール間の直接呼び出し・循環依存はレビューではなくビルドで落とす。
 * Spring コンテキストを起動しないのでタグは付けず、`./gradlew unitTest` でも実行される。
 *
 * 参照: `.claude/rules/api/patterns.md` の Module Boundaries
 */
class ModularityTest {
    private val modules = ApplicationModules.of(ApiApplication::class.java)

    @Test
    fun `module boundaries are respected`() {
        modules.verify()
    }

    @Test
    fun `write module documentation`() {
        Documenter(modules)
            .writeModulesAsPlantUml()
            .writeIndividualModulesAsPlantUml()
    }
}
