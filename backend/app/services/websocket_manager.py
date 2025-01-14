# backend/app/services/websocket_manager.py
from fastapi import WebSocket
from typing import Dict

class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"User {user_id} connected to WebSocket")

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"User {user_id} disconnected from WebSocket")

    def is_connected(self, user_id: str) -> bool:
        return user_id in self.active_connections

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            if "timestamp" not in message:
                message["timestamp"] = datetime.now(timezone.utc).isoformat()
            await self.active_connections[user_id].send_json(message)
ws_manager = WebSocketManager()