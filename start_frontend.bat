@echo off
title StockWise Next.js Frontend
echo ========================================================
echo Starting StockWise Frontend (Next.js)
echo ========================================================
echo.
cd /d "%~dp0\frontend"
if not exist node_modules (
    echo [INFO] Installing frontend dependencies (one-time setup)...
    call npm install
)
call npm run dev
pause
