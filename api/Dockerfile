# syntax=docker/dockerfile:1

# --- build ---
FROM eclipse-temurin:25-jdk AS build
WORKDIR /workspace

# 依存解決を先に済ませてレイヤーキャッシュを効かせる（ソース変更だけなら再ダウンロードしない）
COPY gradlew settings.gradle.kts build.gradle.kts ./
COPY gradle gradle
RUN --mount=type=cache,target=/root/.gradle ./gradlew dependencies --no-daemon -q > /dev/null

COPY config config
COPY src src
# テスト・Lint はホスト側の Quality Gates で回す。イメージビルドでは実行可能 jar を作るだけ
RUN --mount=type=cache,target=/root/.gradle ./gradlew bootJar --no-daemon -x test \
    && cp build/libs/*-SNAPSHOT.jar app.jar

# --- runtime ---
FROM eclipse-temurin:25-jre
WORKDIR /app

RUN groupadd --system app && useradd --system --gid app app
COPY --from=build /workspace/app.jar app.jar
USER app

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
