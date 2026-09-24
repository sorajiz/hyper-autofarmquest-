@echo off
title Auto Hyper - Farm Orb
echo ==============================================================
echo    ⚡ HYPER AUTO FARM QUEST - 1-CLICK LAUNCHER v3.2.0 ⚡
echo ==============================================================
cd /d "%~dp0"

if not exist "node_modules\" (
    echo [Setup] Phat hien thieu thu vien, dang tu dong cai dat (npm install)...
    call npm install
)

echo [Launch] Dang khoi dong Universal Launcher...
call npm start
