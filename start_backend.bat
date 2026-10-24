@echo off
title StockWise FastAPI Backend
echo ========================================================
echo Starting StockWise Inventory API (FastAPI + MySQL)
echo ========================================================
echo.
cd /d "%~dp0"
call .\venv\Scripts\activate.bat
python main.py
pause
