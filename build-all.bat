@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo Building all PatientLens AI Spring Boot Services
echo ===================================================

set SERVICES=auth-service api-gateway patient-service doctor-service appointment-service billing-service analytics-service payment-service notification-service medical-record-service

for %%s in (%SERVICES%) do (
    echo.
    echo ---------------------------------------------------
    echo Building %%s...
    echo ---------------------------------------------------
    cd %%s
    call mvn package -DskipTests
    if !errorlevel! neq 0 (
        echo [ERROR] Failed to build %%s
        exit /b !errorlevel!
    )
    cd ..
)

echo.
echo ===================================================
echo All services built successfully!
echo ===================================================
