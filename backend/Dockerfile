# syntax=docker/dockerfile:1
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY .mvn/ .mvn/
COPY mvnw ./
COPY backend/pom.xml backend/pom.xml
RUN chmod +x mvnw && ./mvnw -B -f backend/pom.xml dependency:go-offline
COPY backend/src backend/src
RUN ./mvnw -B -f backend/pom.xml -DskipTests package

FROM eclipse-temurin:21-jre-jammy AS runtime
WORKDIR /app
RUN groupadd --system spring && useradd --system --gid spring --home-dir /app spring
COPY --from=build /workspace/backend/target/portfolio-api-0.1.0-SNAPSHOT.jar /app/app.jar
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=65 -XX:InitialRAMPercentage=25 -XX:+UseSerialGC -Djava.security.egd=file:/dev/./urandom"
EXPOSE 10000
USER spring:spring
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
