@echo off
title Stop Expense Manager
echo Stopping Expense Manager processes...

:: Stop any process on port 8080 (backend)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8080" ^| find "LISTENING"') do (
    echo Terminating backend process PID: %%a
    taskkill /F /PID %%a
)

:: Stop any process on port 3000 / 3001 (frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    echo Terminating frontend process PID: %%a
    taskkill /F /PID %%a
)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do (
    echo Terminating frontend process PID: %%a
    taskkill /F /PID %%a
)

echo All application services have been stopped.
pause
