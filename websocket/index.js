import { WebSocketServer } from "ws";

export class WebSocketService {
  constructor(server) {
    this.wss = new WebSocketServer({ server });
    this.clients = new Map();

    this.wss.on("connection", this.handleConnection);
  }

  handleConnection(ws, req) {
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });
    ws.on("message", this.handleMessage.bind(this, ws));
    ws.on("close", () => this.handleClose(ws));
  }

  handleMessage(ws, message) {
    const data = JSON.parse(message);
    switch (data.type) {
      case "register":
        this.clients.set(data.userId, ws);
        break;
      case "unregister":
        this.clients.delete(data.userId);
        break;
      case "message":
        const recipientWs = this.clients.get(data.recipientId);
        if (recipientWs) {
          recipientWs.send(JSON.stringify(data));
        }
        break;
      case "notification":
        notificationhandler(ws, data, this.clients);
        break;
      case "resource":
        resourceHandler(ws, data, this.clients);
        break;
      default:
        ws.send(JSON.stringify({ error: "Unknown message type" }));
    }
  }

  startHeartbeat() {
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (!ws.isAlive) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }
}
