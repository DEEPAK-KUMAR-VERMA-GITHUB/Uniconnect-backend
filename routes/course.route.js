import CourseController from "../controllers/course.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";
import { cacheMiddleware } from "./../middlewares/cache.middleware.js";

export const courseRoutes = (fastify, options) => {
  // schemas
  const courseSchema = {
    createCourse: {
      body: {
        type: "object",
        required: ["name", "code", "department", "duration", "type"],
        properties: {
          name: {
            type: "string",
            minLength: 1,
            maxLength: 100,
            pattern: "^[a-zA-Z0-9 ]+$",
            description: "Name must be a string",
          },
          code: {
            type: "string",
            minLength: 1,
            maxLength: 10,
            pattern: "^[a-zA-Z0-9]+$",
            description: "Code must be a string",
          },
          department: {
            type: "string",
            minLength: 1,
            maxLength: 255,
            pattern: "^[a-zA-Z0-9s]{24}$",
            description: "Department must be a string",
          },
          duration: {
            type: "number",
            minimum: 1,
            maximum: 5,
            multipleOf: 1,
          },
          type: {
            type: "string",
            enum: ["UG", "PG", "DIPLOMA", "CERTIFICATE"],
          },
        },
      },
    },
    getCourses: {
      querystring: {
        type: "object",
        properties: {
          page: { type: "number", minimum: 1 },
          limit: { type: "number", minimum: 1 },
          search: { type: "string" },
          department: { type: "string" },
          type: { type: "string" },
          duration: { type: "number" },
          sortBy: { type: "string" },
          sortOrder: { type: "string" },
        },
      },
    },
    updateCourse: {
      body: {
        type: "object",
        properties: {
          name: {
            type: "string",
            minLength: 1,
            maxLength: 100,
            pattern: "^[a-zA-Z0-9 ]+$",
            description: "Name must be a string",
          },
          code: {
            type: "string",
            minLength: 1,
            maxLength: 10,
            pattern: "^[a-zA-Z0-9]+$",
            description: "Code must be a string",
          },
          department: {
            type: "string",
            minLength: 1,
            maxLength: 255,
            pattern: "^[a-zA-Z0-9s]{24}$",
            description: "Department must be a string",
          },
          duration: {
            type: "number",
            minimum: 1,
            maximum: 5,
            multipleOf: 1,
          },
          type: {
            type: "string",
            enum: ["UG", "PG", "DIPLOMA", "CERTIFICATE"],
          },
        },
      },
    },
    getCourse: {
      params: {
        type: "object",
        properties: {
          id: {
            type: "string",
            minLength: 1,
            maxLength: 255,
            pattern: "^[a-zA-Z0-9s]{24}$",
            description: "Course ID must be a string",
          },
        },
      },
    },
    deleteCourse: {
      params: {
        type: "object",
        properties: {
          id: {
            type: "string",
            minLength: 1,
            maxLength: 255,
            pattern: "^[a-zA-Z0-9s]{24}$",
            description: "Course ID must be a string",
          },
        },
      },
    },
    changeCourseStatus: {
      params: {
        type: "object",
        properties: {
          id: {
            type: "string",
            minLength: 1,
            maxLength: 255,
            pattern: "^[a-zA-Z0-9s]{24}$",
            description: "Course ID must be a string",
          },
        },
      },
      body: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["ACTIVE", "INACTIVE", "DISCONTINUED"],
          },
        },
      },
    },
  };

  // routes
  fastify.post(
    "/create-course",
    {
      schema: courseSchema.createCourse,
      preHandler: [auth, isAdmin],
    },
    CourseController.createCourse
  );
  fastify.get(
    "/",
    {
      schema: courseSchema.getCourses,
      preHandler: [auth, cacheMiddleware("courses")],
    },
    CourseController.getCourses
  );
  fastify.get(
    "/get-course/:id",
    {
      schema: courseSchema.getCourse,
      preHandler: [auth, cacheMiddleware("course")],
    },
    CourseController.getCourseById
  );
  fastify.get(
    "/get-courses-by-department/:departmentId",
    {
      schema: courseSchema.getCourses,
      preHandler: [auth, cacheMiddleware("department-courses")],
    },
    CourseController.getCoursesByDepartment
  );
  fastify.patch(
    "/update-course-status/:id",
    {
      schema: courseSchema.changeCourseStatus,
      preHandler: [auth, isAdmin],
    },
    CourseController.changeCourseStatus
  );

  fastify.put(
    "/update-course/:id",
    {
      schema: courseSchema.createCourse,
      preHandler: [auth, isAdmin],
    },
    CourseController.updateCourse
  );
  fastify.delete(
    "/delete-course/:id",
    {
      schema: courseSchema.deleteCourse,
      preHandler: [auth, isAdmin],
    },
    CourseController.deleteCourse
  );
};
