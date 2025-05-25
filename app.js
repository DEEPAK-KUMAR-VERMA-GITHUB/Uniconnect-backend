import "dotenv/config";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import initializeDB from "./config/db.config.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";
import { departmentRoutes } from "./routes/department.route.js";
import { subjectRoute } from "./routes/subject.route.js";
import { userRoutes } from "./routes/user.route.js";
import { courseRoutes } from "./routes/course.route.js";
import { sessionRoute } from "./routes/session.route.js";
import { semesterRoutes } from "./routes/semester.route.js";
import { resourceRoutes } from "./routes/resource.route.js";
import { notificationRoutes } from "./routes/notification.routes.js";
import fastifyWebsocket from "@fastify/websocket";
import { WebSocketService } from "./websocket/index.js";

const createServer = async () => {
  const fastify = Fastify({
    logger: true,
  });

  await initializeDB();
  await fastify.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
  });
  await fastify.register(cookie);
  await fastify.register(multipart, {
    limits: {
      fileSize: 10000000, // 10MB
      files: 1, // 1 file
    },
    attachFieldsToBody: true,
  });

  // register websocket plugin
  await fastify.register(fastifyWebsocket, {
    options: {
      clientTracking: true,
      maxPayload: 1048576, // 1MB
    },
  });

  // Register WebSocket route
  fastify.register(async function (fastify) {
    fastify.get("/ws", { websocket: true }, (connection) => {
      // This is a WebSocket connection
      const { socket } = connection;

      socket.on("message", (message) => {
        try {
          const data = JSON.parse(message.toString());

          if (data.type === "register") {
            // Handle registration
            wsService.clients.set(data.userId, socket);
            socket.send(JSON.stringify({ type: "register", success: true }));
          } else if (data.type === "notification") {
            // Handle notification
            notificationHandler(socket, data, wsService.clients);
          } else {
            socket.send(JSON.stringify({ error: "Unknown message type" }));
          }
        } catch (error) {
          socket.send(JSON.stringify({ error: "Invalid message format" }));
        }
      });

      socket.on("close", () => {
        // Handle disconnection
        for (const [userId, client] of wsService.clients.entries()) {
          if (client === socket) {
            wsService.clients.delete(userId);
            break;
          }
        }
      });
    });
  });

  await fastify.register(userRoutes, { prefix: "/api/v1/users" });
  await fastify.register(departmentRoutes, { prefix: "/api/v1/departments" });
  await fastify.register(courseRoutes, { prefix: "/api/v1/courses" });
  await fastify.register(sessionRoute, { prefix: "/api/v1/sessions" });
  await fastify.register(semesterRoutes, { prefix: "/api/v1/semesters" });
  await fastify.register(subjectRoute, { prefix: "/api/v1/subjects" });
  await fastify.register(resourceRoutes, { prefix: "/api/v1/resources" });
  await fastify.register(notificationRoutes, {
    prefix: "/api/v1/notifications",
  });

  fastify.setErrorHandler(errorHandler);
  fastify.setNotFoundHandler(notFound);

  return fastify;
};

const startServer = async () => {
  try {
    const app = await createServer();

    const server = app.server;

    // Initialize websocket service with the http server
    const wsService = new WebSocketService(server);
    wsService.startHeartbeat();

    app.listen({ port: process.env.PORT }, () => {
      console.log(
        `✅ Uniconnect server is running on port ${app.server.address().port}`
      );
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

startServer();
