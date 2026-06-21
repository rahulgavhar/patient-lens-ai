FROM mcr.microsoft.com/openjdk/jdk:25-ubuntu

WORKDIR /app

COPY target/notification-service-0.0.1-SNAPSHOT.jar ./app.jar

EXPOSE 4008
EXPOSE 9008

ENTRYPOINT ["java", "-jar", "app.jar"]
