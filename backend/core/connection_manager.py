from fastapi import WebSocket
from typing import List, Dict

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket:WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        self.active_connections.pop(user_id, None)
    
    async def send_personal_message(self, message: dict, user_id: int):
        websocket = self.active_connections.get(user_id)
        if websocket:
            await websocket.send_json(message)

    async def broadcast_to_users(self, message: dict, user_ids: List[int]):
        for user_id in user_ids:
            await self.send_personal_message(message, user_id)

    def is_online(self, user_id: int) ->bool:
        return user_id in self.active_connections
    
    
manager = ConnectionManager()