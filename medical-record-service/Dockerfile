FROM mcr.microsoft.com/openjdk/jdk:25-ubuntu

WORKDIR /app

COPY target/medical-record-service-0.0.1-SNAPSHOT.jar ./app.jar

EXPOSE 4007

ENTRYPOINT ["java", "-jar", "app.jar"]
