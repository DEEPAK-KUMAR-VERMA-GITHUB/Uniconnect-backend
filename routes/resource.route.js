import { isFaculty } from "../middlewares/admin.middleware.js";
import { auth } from "../middlewares/auth.middleware.js";
import ResourceController from "../controllers/resource.controller.js";
import { cacheMiddleware } from "./../middlewares/cache.middleware.js";

export const resourceRoutes = (fastify) => {
  fastify.get(
    "/resources-by-faculty/:facultyId",
    {
      preHandler: [auth, isFaculty, cacheMiddleware("faculty_resources")],
    },
    ResourceController.getResourcesByFaculty
  );
};
