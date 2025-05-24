import userController from "../controllers/user.controller.js";
import { isAdmin } from "../middlewares/admin.middleware.js";
import { auth, handleLogout, handleRefreshToken } from "../middlewares/auth.middleware.js";
import { cacheMiddleware } from "../middlewares/cache.middleware.js";

export const userRoutes = async (fastify, options) => {
  // Route schemas
  const userSchema = {
    register: {
      body: {
        type: "object",
        required: [
          "fullName",
          "email",
          "password",
          "phoneNumber",
          "role",
          "department",
        ],
        properties: {
          fullName: { type: "string", minLength: 2 },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          phoneNumber: { type: "string", pattern: "^\\d{10}$" },
          role: { type: "string", enum: ["student", "faculty", "admin"] },
          department: { type: "string", pattern: "^[0-9a-fA-F]{24}$" },
          facultyId: { type: "string" },
          designation: { type: "string" },
          rollNumber: { type: "string" },
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
          fullName: { type: "string", minLength: 2 },
          phoneNumber: { type: "string", pattern: "^\\d{10}$" },
          department: { type: "string", pattern: "^[0-9a-fA-F]{24}$" },
        },
      },
    },
    login: {
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
        },
      },
    },
    verify: {
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", pattern: "^[0-9a-fA-F]{24}$" },
        },
      },
    },
    status: {
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", pattern: "^[0-9a-fA-F]{24}$" },
        },
      },
    },
    delete: {
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string", pattern: "^[0-9a-fA-F]{24}$" },
        },
      },
    },
    faculty: {
      params: {
        type: "object",
        required: ["departmentId"],
        properties: {
          departmentId: { type: "string", pattern: "^[0-9a-fA-F]{24}$" },
        },
      },
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", minimum: 1, default: 1 },
          limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
          sortBy: {
            type: "string",
            enum: ["fullName", "email", "createdAt"],
          },
          sortOrder: { type: "string", enum: ["asc", "desc"] },
        },
      },
    },
  };

  // Routes
  fastify.post(
    "/register",
    { schema: userSchema.register },
    userController.registerUser
  );
  fastify.post(
    "/login",
    { schema: userSchema.login },
    userController.loginUser
  );
  fastify.get("/me", { preHandler: [auth] }, userController.getUserProfile);
  fastify.put(
    "/me",
    {
      schema: userSchema.update,
      preHandler: [auth],
    },
    userController.updateProfile
  );
  fastify.get(
    "/",
    { preHandler: [auth, isAdmin, cacheMiddleware("users")] },
    userController.getAllUsers
  );
  fastify.patch(
    "/:id/verify",
    { schema: userSchema.verify, preHandler: [auth, isAdmin] },
    userController.verifyUser
  );
  fastify.patch(
    "/:id/status",
    { schema: userSchema.status, preHandler: [auth, isAdmin] },
    userController.toggleUserStatus
  );
  fastify.delete(
    "/delete-user/:id",
    { schema: userSchema.delete, preHandler: [auth, isAdmin] },
    userController.deleteUser
  );
  fastify.post("/logout", { preHandler: [auth] }, handleLogout);
  fastify.post("/refresh-token",{preHandler:[auth]}, handleRefreshToken)
  fastify.get(
    "/faculty/:departmentId",
    {
      preHandler: [auth],
      schema: userSchema.faculty,
    },
    userController.getFacultyByDepartment
  );
};
