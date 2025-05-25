import { WebSocketServer } from "ws";
import { notificationHandler } from "./notificationHandler.js"; // Fix the capitalization

export class WebSocketService {
  constructor(server) {
    this.wss = new WebSocketServer({ server }); // Initialize WebSocketServer
    this.clients = new Map();

    this.wss.on("connection", this.handleConnection.bind(this));
  }

  handleConnection(ws, req) {
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        this.handleMessage(ws, data);
      } catch (error) {
        ws.send(JSON.stringify({ error: "Invalid message format" }));
      }
    });
    ws.on("close", () => this.handleClose(ws));
  }

  handleMessage(ws, data) {
    switch (data.type) {
      case "register":
        this.clients.set(data.userId, ws);
        ws.send(JSON.stringify({ type: "register", success: true }));
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
        notificationHandler(ws, data, this.clients);
        break;
      default:
        ws.send(JSON.stringify({ error: "Unknown message type" }));
    }
  }

  handleClose(ws) {
    // Remove client from the map
    for (const [userId, client] of this.clients.entries()) {
      if (client === ws) {
        this.clients.delete(userId);
        break;
      }
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
