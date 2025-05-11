import { ApiError } from "../utils/apiError.js";

const errorHandler = (error, req, reply) => {
  req.log.error(error);

  console.log(error);

  // Handle Fastify validation errors
  if (error.validation) {
    return reply.code(400).send({
      success: false,
      message: "Validation Error",
      errors: error.validation.map((err) => ({
        field: err.params.missingProperty || err.params.propertyName,
        message: err.message,
      })),
    });
  }

  // mongodb duplacte key error
  if (error.code === 11000) {
    return reply.code(409).send({
      success: false,
      message: "Duplicate entry found",
      error: Object.keys(error.keyPattern).join(", ") + " already exists",
    });
  }

  // Mongoose Validation Error
  if (error.name === "ValidationError") {
    return reply.code(400).send({
      success: false,
      message: "Validation Error",
      errors: Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      })),
    });
  }

  // JWT Error
  if (error.name === "JsonWebTokenError") {
    return reply.code(401).send({
      success: false,
      message: "Invalid token",
      error: "Authentication failed",
    });
  }

  // JWT Expiration Error
  if (error.name === "TokenExpiredError") {
    return reply.code(401).send({
      success: false,
      message: "Token expired",
      error: "Authentication failed",
    });
  }

  // Cast Error (Invalid ObjectId)
  if (error.name === "CastError") {
    return reply.code(400).send({
      success: false,
      message: "Invalid ID format",
      error: `Invalid ${error.path}: ${error.value}`,
    });
  }

  // If error is not an instance of ApiError, convert it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Something went wrong";
    error = new ApiError(statusCode, message, error?.errors || []);
  }

  // Prepare error response
  const response = {
    success: false,
    message: error.message,
    errors: error.errors,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    ...(error.data && { data: error.data }),
  };

  return reply.code(error.statusCode).send(response);
};

// Handle 404 errors
const notFound = (req, reply) => {
  reply.code(404).send({
    success: false,
    message: `Route ${req.url} not found`,
    error: "Not Found",
  });
};

export { errorHandler, notFound };
