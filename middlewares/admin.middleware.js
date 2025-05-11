import { StatusCode } from "./../utils/constants.js";
import { ApiError } from "./../utils/apiError.js";

export const isAdmin = async (request, reply) => {
  try {
    // check if user exists in request
    if (!request.user) {
      throw new ApiError(StatusCode.UNAUTHORIZED, "Authentication required");
    }

    // check if user is admin
    if (request.user.role !== "admin") {
      throw new ApiError(StatusCode.FORBIDDEN, "Admin access required");
    }
  } catch (error) {
    reply.code(error.statusCode || StatusCode.INTERNAL_SERVER).send(error);
  }
};

export const isFaculty = async (request, reply) => {
  try {
    // check if user exists in request
    if (!request.user) {
      throw new ApiError(StatusCode.UNAUTHORIZED, "Authentication required");
    }

    // check if user is admin
    if (request.user.role !== "faculty") {
      throw new ApiError(StatusCode.FORBIDDEN, "Faculty access required");
    }
  } catch (error) {
    reply.code(error.statusCode || StatusCode.INTERNAL_SERVER).send(error);
  }
};

export const isAuthorized = async (request, reply) => {
  try {
    // check if user exists in request
    if (!request.user) {
      throw new ApiError(StatusCode.UNAUTHORIZED, "Authentication required");
    }

    // check if user is admin
    if (request.user.role !== "admin" && request.user.role !== "faculty") {
      throw new ApiError(
        StatusCode.FORBIDDEN,
        "Admin or Faculty access required"
      );
    }
  } catch (error) {
    reply.code(error.statusCode || StatusCode.INTERNAL_SERVER).send(error);
  }
};
