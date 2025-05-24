import SemesterController from "../controllers/semester.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";
import { cacheMiddleware } from "./../middlewares/cache.middleware.js";

export const semesterRoutes = async (fastify, options) => {
  const semesterSchema = {
    create: {
      body: {
        type: "object",
        required: ["semesterName", "semesterNumber", "startDate", "endDate"],
        properties: {
          name: { type: "string", pattern: "^[A-Z0-9]{5,}$" },
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
            pattern: "^[A-Z]{3}$",
          },
        },
      },
    },
    getByIds: {
      params: {
        type: "object",
        required: ["semesterId"],
        properties: {
          id: { type: "string", pattern: "^[0-9a-fA-F]{24}$" },
          subjectIds: {
            type: "array",
            items: {
              type: "string",
              pattern: "^[0-9a-fA-F]{24}$",
            },
          },
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
  };

  // routes
  fastify.post(
    "/:sessionId/create-semester",
    {
      schema: semesterSchema.create,
      preHandler: [auth, isAdmin],
    },
    SemesterController.createSemester
  );
  fastify.put(
    "/update-semester/:id",
    {
      schema: semesterSchema.update,
      preHandler: [auth, isAdmin],
    },
    SemesterController.updateSemester
  );
  fastify.get(
    "/get-semester/:id",
    {
      schema: semesterSchema.getById,
      preHandler: [auth, isAdmin, cacheMiddleware("semester")],
    },
    SemesterController.getSemesterById
  );
  fastify.get(
    "/get-all-semesters/:sessionId",
    {
      schema: semesterSchema.getAll,
      preHandler: [cacheMiddleware("semesters")],
    },
    SemesterController.getAllSemesters
  );
  fastify.delete(
    "/delete-semester/:id",
    {
      schema: semesterSchema.getById,
      preHandler: [auth, isAdmin],
    },
    SemesterController.deleteSemester
  );
  fastify.post(
    "/:semesterId/add-subjects",
    {
      schema: semesterSchema.getById,
      preHandler: [auth, isAdmin],
    },
    SemesterController.addSubjects
  );
  fastify.delete(
    "/:semesterId/remove-subject/:subjectId",
    {
      preHandler: [auth, isAdmin],
    },
    SemesterController.removeSubject
  );
  fastify.get(
    "/get-all-subjects/:semesterId",
    {
      preHandler: [auth, isAdmin, cacheMiddleware("subjects")],
    },
    SemesterController.getAllSubjects
  );
  fastify.patch(
    "/:semesterId/change-status",
    {
      preHandler: [auth, isAdmin],
    },
    SemesterController.changeStatus
  );
};
