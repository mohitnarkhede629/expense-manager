@echo off
title Expense Manager Launcher
echo ========================================================
echo         Launching Expense & Wealth Manager
echo ========================================================
echo.

:: 1. Check & start MySQL service
echo [1/3] Checking MySQL service (MYSQL80)...
sc query MYSQL80 | find "RUNNING" >nul
if %ERRORLEVEL% NEQ 0 (
    echo Starting MYSQL80 service...
    net start MYSQL80
) else (
    echo MySQL service is already running.
)
echo.

:: 2. Start Spring Boot Backend in a separate window
echo [2/3] Starting Spring Boot Backend (Port 8080)...
start "Expense Manager Backend" cmd /k "cd /d %~dp0backend && mvnw.cmd spring-boot:run"
echo.

:: 3. Start React Frontend in a separate window
echo [3/3] Starting React PWA Frontend...
start "Expense Manager Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.

echo ========================================================
echo System is launching!
echo Backend will be available at: http://localhost:8080
echo Frontend will be available at: http://localhost:3000 (or 3001)
echo ========================================================
pause
