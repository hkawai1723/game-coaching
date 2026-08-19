plugins {
    kotlin("jvm") version "2.3.21"
    kotlin("plugin.spring") version "2.3.21"
    id("org.springframework.boot") version "4.1.0"
    id("io.spring.dependency-management") version "1.1.7"
    id("com.diffplug.spotless") version "7.0.4"
    id("dev.detekt") version "2.0.0-alpha.3"
}

group = "com.aigamereview"
version = "0.0.1-SNAPSHOT"
description = "api"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict", "-Xannotation-default-target=param-property")
    }
}

// テストは 3 層に分ける。AI 駆動開発では「速い検証ループ」が生産性を直接決めるため、
// ドメインのテストは Spring コンテキストを起動せず純粋な Kotlin テストとして実行する。
//
//   ./gradlew unitTest  … ドメイン/アプリケーション層。Spring 起動なし。数秒で終わる
//   ./gradlew test      … 上記 + @Tag("integration") の Spring テスト
//   @Tag("external")    … 実際に外部 API (LLM 等) を叩くテスト。常に除外。明示的に指定して実行する
tasks.withType<Test> {
    useJUnitPlatform {
        // 課金・ネットワークが発生するテストは通常のビルドから常に外す
        excludeTags("external")
    }
}

tasks.register<Test>("unitTest") {
    description = "Spring コンテキストを起動しない高速テストのみ実行する（ドメイン層の検証ループ用）"
    group = "verification"
    testClassesDirs = sourceSets["test"].output.classesDirs
    classpath = sourceSets["test"].runtimeClasspath
    useJUnitPlatform {
        excludeTags("integration", "external")
    }
}

// Formatter: ktlint 経由。書式のルールは .editorconfig が正。
spotless {
    kotlin {
        target("src/**/*.kt")
        targetExclude("build/**")
        ktlint("1.5.0")
    }
    kotlinGradle {
        target("*.gradle.kts")
        ktlint("1.5.0")
    }
    json {
        target("src/**/*.json", "config/**/*.json")
        gson()
            .indentWithSpaces(2)
            .sortByKeys()
    }
}

// Linter: 書式系ルールは ktlint に任せ、detekt はコード品質のみを見る。
detekt {
    toolVersion = "2.0.0-alpha.3"
    config.setFrom(files("$rootDir/config/detekt/detekt.yml"))
    buildUponDefaultConfig = true
    autoCorrect = false
}

// リポジトリルートの scripts/.githooks を hooks パスに設定する。
// api/ で ./gradlew を一度でも実行すれば pre-commit hook が有効になる（クローン後の手作業を無くすため）。
tasks.register<Exec>("installGitHooks") {
    description = "Configure core.hooksPath to use the repository root's scripts/.githooks/"
    commandLine("git", "config", "core.hooksPath", "scripts/.githooks")
    onlyIf { File(rootDir.parentFile, ".git").exists() }
    doLast {
        println("Git hooks path set to scripts/.githooks")
    }
}

tasks.named("compileKotlin") {
    dependsOn("installGitHooks")
}
