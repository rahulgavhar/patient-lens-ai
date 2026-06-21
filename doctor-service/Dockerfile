FROM mcr.microsoft.com/openjdk/jdk:25-ubuntu

WORKDIR /app

COPY target/doctor-service-0.0.1-SNAPSHOT.jar ./app.jar

EXPOSE 4003

ENTRYPOINT ["java", "-jar", "app.jar"]
