import notificationController from "../controllers/notification.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

export const notificationRoutes = (fastify, options) => {
  fastify.get(
    "/",
    { preHandler: [auth] },
    notificationController.getUserNotifications
  );

  fastify.patch(
    "/mark-as-read/:notificationId",
    { preHandler: [auth] },
    notificationController.markAsRead
  );

  fastify.post(
    "/",
    { preHandler: [auth] },
    notificationController.createNotifcaiton
  );

  fastify.patch(
    "/read-all",
    { preHandler: [auth] },
    notificationController.markAllAsRead
  );
};
