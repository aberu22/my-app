import websocket

ws_url = "wss://p4kvq6h5v8u568-8188.proxy.runpod.net/ws"

try:
    ws = websocket.create_connection(ws_url)
    print("✅ WebSocket connected successfully!")
    ws.close()
except Exception as e:
    print("❌ WebSocket connection failed:", str(e))
