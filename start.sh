#!/usr/bin/env bash
echo "=============================================================="
echo "   ⚡ HYPER AUTO FARM QUEST - 1-CLICK LAUNCHER v3.2.0 ⚡"
echo "=============================================================="

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

if [ ! -d "node_modules" ]; then
    echo "[Setup] Thiếu node_modules, đang tự động cài đặt (npm install)..."
    npm install
fi

echo "[Launch] Đang khởi động Universal Launcher..."
npm start
