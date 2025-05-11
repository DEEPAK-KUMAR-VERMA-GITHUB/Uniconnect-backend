class ApiError extends Error {
  constructor(statusCode, message = "Something went wrong", errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;
    this.data = null;

    Error.captureStackTrace(this, this.constructor);
  }
  static badRequest(message, errors = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = "Unauthorized", errors = []) {
    return new ApiError(401, message, errors);
  }

  static forbidden(message = "Forbidden", errors = []) {
    return new ApiError(403, message, errors);
  }

  static notFound(message = "Not found", errors = []) {
    return new ApiError(404, message, errors);
  }

  static conflict(message, errors = []) {
    return new ApiError(409, message, errors);
  }

  static internal(message = "Internal server error", errors = []) {
    return new ApiError(500, message, errors);
  }

  // cache error
  static cacheError(message = "Cache error", errors = []) {
    return new ApiError(500, `Cache Error : ${message}`, errors);
  }
}

export { ApiError };
