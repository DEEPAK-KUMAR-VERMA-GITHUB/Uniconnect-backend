class ApiResponse {
  constructor(statusCode = 200, data = null, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
    this.timestamp = new Date().toISOString();
  }

  static succeed(data, message = "") {
    return new ApiResponse(200, data, message);
  }

  static created(data, message = "") {
    return new ApiResponse(201, data, message);
  }

  static noContent(message = "") {
    return new ApiResponse(204, null, message);
  }

  toJSON() {
    return {
      success: this.success,
      message: this.message,
      data: this.data,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
    };
  }
}

export { ApiResponse };
