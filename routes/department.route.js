import departmentController from "../controllers/department.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";
import { cacheMiddleware } from "./../middlewares/cache.middleware.js";

export const departmentRoutes = async (fastify, options) => {
  const departmentSchema = {
    create: {
      body: {
        type: "object",
        required: ["name", "code"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 100 },
          code: {
            type: "string",
            pattern: "^[A-Z]{3,}$",
            description: "Must be atleast 3 uppercase characters",
          },
        },
      },
    },
    update: {
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", pattern: "^[0-9a-fA-F]{24}$" },
        },
      },
      body: {
        type: "object",
        minProperties: 1,
        properties: {
          name: { type: "string", minLength: 2, maxLength: 100 },
          code: {
            type: "string",
            pattern: "^[A-Z]{3,}$",
          },
          head: {
            type: "string",
            pattern: "^[0-9a-fA-F]{24}$",
            description: "Faculty ID to be assigned as department head",
          },
        },
      },
    },
    getById: {
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", pattern: "^[0-9a-fA-F]{24}$" },
        },
      },
    },
    getAll: {
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", minimum: 1, default: 1 },
          limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
          search: { type: "string", minLength: 1 },
          sortBy: { type: "string", enum: ["name", "code", "createdAt"] },
          sortOrder: { type: "string", enum: ["asc", "desc"] },
        },
      },
    },
    assignHead: {
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", pattern: "^[0-9a-fA-F]{24}$" },
        },
      },
      body: {
        type: "object",
        required: ["head"],
        properties: {
          head: { type: "string", pattern: "^[0-9a-fA-F]{24}$" },
        },
      },
    },
  };

  // routes
  fastify.post(
    "/create-department",
    {
      schema: departmentSchema.create,
      preHandler: [auth, isAdmin],
    },
    departmentController.createDepartment
  );

  fastify.put(
    "/:id",
    { schema: departmentSchema.update, preHandler: [auth, isAdmin] },
    departmentController.updateDepartment
  );

  fastify.get(
    "/:id",
    {
      schema: departmentSchema.getById,
      preHandler: [auth, cacheMiddleware("department", 300)],
    },
    departmentController.getDepartmentById
  );

  fastify.get(
    "/",
    {
      schema: departmentSchema.getAll,
      preHandler: [cacheMiddleware("departments", 300)],
    },
    departmentController.getDepartments
  );

  fastify.delete(
    "/:id",
    { schema: departmentSchema.getById, preHandler: [auth, isAdmin] },
    departmentController.deleteDepartment
  );

  fastify.put(
    "/:id/assign-head",
    { schema: departmentSchema.assignHead, preHandler: [auth, isAdmin] },
    departmentController.assignDepartmentHead
  );

  fastify.get(
    "/:id/stats",
    {
      schema: departmentSchema.getById,
      preHandler: [auth, isAdmin],
    },
    departmentController.getDepartmentStats
  );
};
