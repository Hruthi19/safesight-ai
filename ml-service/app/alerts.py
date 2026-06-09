from fastapi import WebSocket

connections = []

async def connect(websocket: WebSocket):
    await websocket.accept()
    connections.append(websocket)
    print("Client connected")

async def broadcast(message):
    print("BROADCASTING ALERT:", message)
    for conn in connections:
        await conn.send_json(message)