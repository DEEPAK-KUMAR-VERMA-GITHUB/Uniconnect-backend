import { auth } from "../middlewares/auth.middleware.js";
import { isAdmin, isFaculty } from "./../middlewares/admin.middleware.js";
import SubjectController from "../controllers/subject.controller.js";

export const subjectRoute = (fastify, options) => {
  const subjectSchema = {
    create: {
      type: "object",
      required: ["name", "code", "credits"],
      properties: {
        name: { type: "string" },
        code: { type: "string" },
        credits: { type: "number" },
        isElective: { type: "boolean" },
        hasLab: { type: "boolean" },
        isOnline: { type: "boolean" },
      },
    },
    update: {
      type: "object",
      properties: {
        name: { type: "string" },
        code: { type: "string" },
        creditPoints: { type: "number" },
        isElective: { type: "boolean" },
        hasLab: { type: "boolean" },
        isOnline: { type: "boolean" },
      },
    },
    assignFaculty: {
      type: "object",
      properties: {
        facultyId: { type: "string" },
      },
    },
    changeStatus: {
      type: "object",
      properties: {
        status: { type: "string" },
      },
    },
    addResource: {
      body: {
        type: "object",
        required: ["title", "type"],
        properties: {
          title: { type: "string" },
          type: { type: "string" },
          year: { type: "number" },
        },
      },
    },
  };

  // routes
  fastify.post(
    "/create",
    { schema: subjectSchema.create, preHandler: [auth, isAdmin] },
    SubjectController.createSubject
  );
  fastify.get("/", { preHandler: [auth] }, SubjectController.getAllSubjects);
  fastify.get(
    "/available",
    { preHandler: [auth, isAdmin] },
    SubjectController.getAllAvailableSubjects
  );

  fastify.put(
    "/:id",
    { preHandler: [auth, isAdmin] },
    SubjectController.updateSubject
  );
  fastify.delete(
    "/:id",
    { preHandler: [auth, isAdmin] },
    SubjectController.deleteSubject
  );
  fastify.put(
    "/change-status/:id",
    { preHandler: [auth, isAdmin] },
    SubjectController.changeStatus
  );
  fastify.get(
    "/semester/:semesterId",
    { preHandler: [auth] },
    SubjectController.getSubjectsBySemesterId
  );

  fastify.patch(
    "/:id/assign-faculty",
    { preHandler: [auth, isAdmin] },
    SubjectController.assignFaculty
  );
  // ================================ Untested Yet ================

  fastify.get("/:id", { preHandler: [auth] }, SubjectController.getSubjectById);

  fastify.get(
    "/:id/resources",
    { preHandler: [auth] },
    SubjectController.getSubjectResources
  );

  fastify.post(
    "/:id/add-resource",
    {
      preHandler: [auth],
    },
    SubjectController.addResource
  );
};
