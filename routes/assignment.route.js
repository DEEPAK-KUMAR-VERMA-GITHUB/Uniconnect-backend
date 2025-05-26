import AssignmentController from "../controllers/assignment.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { isFaculty } from "../middlewares/admin.middleware.js";
import { cacheMiddleware } from "./../middlewares/cache.middleware.js";

export const assignmentRoutes = (fastify, options) => {
  fastify.post(
    "/:assignmentId/submit-solution",
    {
      preHandler: [auth],
    },
    AssignmentController.submitSolution
  );
  fastify.get(
    "/:assignmentId/submissions",
    {
      preHandler: [auth, isFaculty, cacheMiddleware("solutions")],
    },
    AssignmentController.getAssignmentSubmissions
  );
};
