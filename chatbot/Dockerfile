# Multi-stage build for Spring Boot chatbot
FROM gradle:8.5-jdk17-alpine AS builder

WORKDIR /app

# Copy gradle files first for caching
COPY build.gradle settings.gradle ./
COPY gradle gradle

# Download dependencies
RUN gradle dependencies --no-daemon || true

# Copy source code
COPY src src

# Build the application
RUN gradle bootJar --no-daemon

# Production stage
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S spring && \
    adduser -S spring -u 1001

# Copy jar from builder
COPY --from=builder --chown=spring:spring /app/build/libs/*.jar app.jar

USER spring

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
