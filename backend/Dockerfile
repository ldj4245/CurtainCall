FROM gradle:8.6-jdk17-alpine AS builder
WORKDIR /app
COPY build.gradle .
COPY settings.gradle .
COPY src src
RUN gradle build -x test --no-daemon

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "app.jar"]
