FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM gradle:8.6-jdk17-alpine AS builder
WORKDIR /app
COPY build.gradle settings.gradle ./
COPY backend/build.gradle backend/build.gradle
COPY backend/src backend/src
COPY --from=frontend-builder /app/frontend/dist frontend/dist
RUN gradle :backend:bootJar --no-daemon

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/backend/build/libs/app.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Dfile.encoding=UTF-8", "-jar", "-Dspring.profiles.active=prod", "app.jar"]
