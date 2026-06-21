FROM mcr.microsoft.com/openjdk/jdk:25-ubuntu

WORKDIR /app

COPY target/payment-service-0.0.1-SNAPSHOT.jar ./app.jar

EXPOSE 4006
EXPOSE 9006

ENTRYPOINT ["java", "-jar", "app.jar"]
