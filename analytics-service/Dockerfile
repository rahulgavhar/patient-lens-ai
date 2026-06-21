# Stage 1: Build using Microsoft's JDK 25 image + manual Maven setup
FROM mcr.microsoft.com/openjdk/jdk:25-ubuntu AS builder

# Install Maven manually since there is no official Maven-JDK25 image yet
RUN apt-get update && apt-get install -y maven

WORKDIR /app

COPY pom.xml .

RUN mvn dependency:go-offline -B

COPY src ./src

RUN mvn clean package -DskipTests

# Stage 2: Runtime using Microsoft's optimized JDK 25 image
FROM mcr.microsoft.com/openjdk/jdk:25-ubuntu AS runner

WORKDIR /app

COPY --from=builder /app/target/analytics-service-0.0.1-SNAPSHOT.jar ./app.jar

EXPOSE 4009

ENTRYPOINT ["java", "-jar", "app.jar"]