"""
Hyper AutoFarm Quest - Python FastAPI & Real-Time WebSocket Service v3.0.0
Provides REST endpoints and real-time live progress updates for Next.js Web Dashboard.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import asyncio
import datetime
import json
import os

app = FastAPI(
    title="Hyper AutoFarm Quest API",
    version="3.0.0",
    description="High-performance backend service & WebSocket broadcaster for Discord AutoFarm Quests"
)

# Enable CORS for Next.js web dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock in-memory state representing Discord Quests & Farming progress
state = {
    "user": {
        "id": "1552658898937446400",
        "username": "HyperFarmMaster",
        "avatar": "https://cdn.discordapp.com/embed/avatars/0.png",
        "nitro": "Nitro Booster",
    },
    "orbs": {
        "total": 350,
        "claimed_today": 75,
        "available_rewards": ["Cyber Neon Badge", "Speed Runner Deco", "Orb Trophy 2026"],
    },
    "proxy": {
        "current": "127.0.0.1:1080 (Dual-Stack IPv6 Enabled)",
        "protocol": "SOCKS5",
        "latency_ms": 32,
        "status": "HEALTHY",
    },
    "quests": [
        {
            "id": "quest_genshin_30m",
            "name": "Genshin Impact - Journey of Orbs",
            "task_type": "PLAY",
            "target_seconds": 900,
            "progress_seconds": 900,
            "percent": 100,
            "status": "COMPLETED",
            "reward_orbs": 100,
            "reward_deco": "Anemo Crest Frame",
        },
        {
            "id": "quest_valorant_stream",
            "name": "Valorant - Stream to Friends",
            "task_type": "STREAM",
            "target_seconds": 900,
            "progress_seconds": 450,
            "percent": 50,
            "status": "FARMING",
            "reward_orbs": 150,
            "reward_deco": "Vandal Spray Deco",
        },
        {
            "id": "quest_discord_watch_video",
            "name": "Discord Quest - Watch Highlight Reel",
            "task_type": "VIDEO",
            "target_seconds": 30,
            "progress_seconds": 0,
            "percent": 0,
            "status": "READY",
            "reward_orbs": 100,
            "reward_deco": "Wumpus Cyber Crown",
        },
    ],
}

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

# Background task simulating progress ticks
async def progress_broadcaster():
    while True:
        await asyncio.sleep(5)
        # Advance farming quests slightly
        for q in state["quests"]:
            if q["status"] == "FARMING" and q["percent"] < 100:
                q["progress_seconds"] = min(q["target_seconds"], q["progress_seconds"] + 30)
                q["percent"] = int((q["progress_seconds"] / q["target_seconds"]) * 100)
                if q["percent"] >= 100:
                    q["status"] = "COMPLETED"

        broadcast_data = {
            "type": "TICK",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "quests": state["quests"],
            "orbs": state["orbs"],
            "proxy": state["proxy"],
        }
        await manager.broadcast(broadcast_data)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(progress_broadcaster())

# REST Endpoints
@app.get("/")
def read_root():
    return {
        "service": "Hyper AutoFarm Quest - Python REST & WebSocket Engine",
        "version": "3.0.0",
        "status": "ONLINE",
        "docs_url": "/docs",
    }

@app.get("/api/status")
def get_status():
    return {
        "user": state["user"],
        "orbs": state["orbs"],
        "proxy": state["proxy"],
        "active_quests_count": sum(1 for q in state["quests"] if q["status"] == "FARMING"),
        "completed_quests_count": sum(1 for q in state["quests"] if q["status"] == "COMPLETED"),
    }

@app.get("/api/quests")
def get_quests():
    return {
        "count": len(state["quests"]),
        "quests": state["quests"],
    }

class FarmRequest(BaseModel):
    quest_id: Optional[str] = None

@app.post("/api/farm")
async def start_farming(req: FarmRequest):
    target_id = req.quest_id
    started = []
    for q in state["quests"]:
        if target_id is None or q["id"] == target_id:
            if q["status"] == "READY":
                q["status"] = "FARMING"
                started.append(q["id"])

    await manager.broadcast({
        "type": "FARM_STARTED",
        "started_quest_ids": started,
        "quests": state["quests"],
    })
    return {"success": True, "started": started, "message": f"Farming started for {len(started)} quest(s)"}

class ClaimRequest(BaseModel):
    quest_id: Optional[str] = None

@app.post("/api/claim")
async def claim_rewards(req: ClaimRequest):
    claimed_orbs = 0
    claimed_count = 0
    for q in state["quests"]:
        if (req.quest_id is None or q["id"] == req.quest_id) and q["status"] == "COMPLETED":
            q["status"] = "CLAIMED"
            claimed_orbs += q["reward_orbs"]
            claimed_count += 1

    state["orbs"]["total"] += claimed_orbs
    state["orbs"]["claimed_today"] += claimed_orbs

    await manager.broadcast({
        "type": "ORBS_CLAIMED",
        "claimed_orbs": claimed_orbs,
        "new_total": state["orbs"]["total"],
        "quests": state["quests"],
    })
    return {
        "success": True,
        "claimed_quests": claimed_count,
        "claimed_orbs": claimed_orbs,
        "total_orbs": state["orbs"]["total"],
    }

@app.get("/api/orbs")
def get_orbs():
    return state["orbs"]

@app.post("/api/proxy/rotate")
async def rotate_proxy():
    state["proxy"]["current"] = "192.168.1.100:9050 (IPv6 /64 Rotated)"
    state["proxy"]["latency_ms"] = 28
    await manager.broadcast({"type": "PROXY_ROTATED", "proxy": state["proxy"]})
    return {"success": True, "proxy": state["proxy"]}

# WebSocket Endpoint
@app.websocket("/ws/live")
async def websocket_live_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    # Send initial snapshot
    await websocket.send_text(json.dumps({
        "type": "SNAPSHOT",
        "state": state
    }))
    try:
        while True:
            data = await websocket.receive_text()
            # Respond to ping or incoming commands
            try:
                msg = json.loads(data)
                if msg.get("action") == "PING":
                    await websocket.send_text(json.dumps({"type": "PONG", "timestamp": datetime.datetime.utcnow().isoformat()}))
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
