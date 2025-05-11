import { auth } from "../middlewares/auth.middleware.js";
import { isAdmin } from "./../middlewares/admin.middleware.js";
import { cacheMiddleware } from "./../middlewares/cache.middleware.js";
import sessionController from "./../controllers/session.controller.js";

export const sessionRoute = (fastify, options) => {
  // scshemas
  const sessionSchemas = {
    createSession: {
      body: {
        type: "object",
        required: ["startYear", "course"],
        properties: {
          startYear: { type: "number", minimum: 2000, maximum: 2100 },
          endYear: { type: "number", minimum: 2000, maximum: 2100 },
          course: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        },
      },
    },
    getSessions: {
      params: {
        type: "object",
        required: ["courseId"],
        properties: {
          courseId: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        },
      },
    },
    updateSession: {
      params: {
        type: "object",
        required: ["sessionId"],
        properties: {
          sessionId: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        },
      },
      body: {
        type: "object",
        required: ["startYear", "name"],
        properties: {
          startYear: { type: "number", minimum: 2000, maximum: 3100 },
        },
      },
    },
    deleteSession: {
      params: {
        type: "object",
        required: ["sessionId"],
        properties: {
          sessionId: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        },
      },
    },
    getSessionById: {
      params: {
        type: "object",
        required: ["sessionId"],
        properties: {
          sessionId: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        },
      },
    },
    toggleSessionStatus: {
      params: {
        type: "object",
        required: ["sessionId"],
        properties: {
          sessionId: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
        },
      },
    },
  };

  // routes

  fastify.post(
    "/create",
    {
      schema: sessionSchemas.createSession,
      preHandler: [auth, isAdmin],
    },
    sessionController.createSession
  );
  fastify.get(
    "/get-sessions/:courseId",
    { preHandler: [auth, cacheMiddleware("sessions")] },
    sessionController.getSessions
  );
  fastify.put(
    "/update/:sessionId",
    {
      schema: sessionSchemas.updateSession,
      preHandler: [auth, isAdmin],
    },
    sessionController.updateSession
  );
  fastify.delete(
    "/delete/:sessionId",
    {
      schema: sessionSchemas.deleteSession,
      preHandler: [auth, isAdmin],
    },
    sessionController.deleteSession
  );
  fastify.get(
    "/get-session/:sessionId",
    { preHandler: [auth, cacheMiddleware("session")] },
    sessionController.getSessionById
  );
  fastify.patch(
    "/toggle-session-status/:sessionId",
    {
      schema: sessionSchemas.toggleSessionStatus,
      preHandler: [auth, isAdmin],
    },
    sessionController.toggleSessionStatus
  );
};
