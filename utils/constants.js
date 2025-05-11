export const StatusCode = {
  SUCCESS: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER: 500,
  SERVICE_UNAVAILABLE: 503,
  TOO_MANY_REQUESTS: 429,
};

export const StatusMessage = {
  SUCCESS: "Success",
  CREATED: "Resource created successfully",
  UPDATED: "Resource updated successfully",
  DELETED: "Resource deleted successfully",
  NOT_FOUND: "Resource not found",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Forbidden access",
  VALIDATION_ERROR: "Validation error",
  INTERNAL_SERVER: "Internal server error",
  BAD_REQUEST: "Bad request",
};

// utils/roles.constants.js

export const ROLES = {
  ADMIN: "admin",
  FACULTY: "faculty",
  STUDENT: "student",
};

export const PERMISSIONS = {
  CREATE_COURSE: "CREATE_COURSE",
  UPDATE_COURSE: "UPDATE_COURSE",
  DELETE_COURSE: "DELETE_COURSE",
  VIEW_COURSE: "VIEW_COURSE",
  MANAGE_USERS: "MANAGE_USERS",
  MANAGE_ENROLLMENTS: "MANAGE_ENROLLMENTS",
  VIEW_REPORTS: "VIEW_REPORTS",
};

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.FACULTY]: [
    PERMISSIONS.VIEW_COURSE,
    PERMISSIONS.UPDATE_COURSE,
    PERMISSIONS.VIEW_REPORTS,
  ],
  [ROLES.STUDENT]: [PERMISSIONS.VIEW_COURSE],
  [ROLES.STAFF]: [PERMISSIONS.VIEW_COURSE, PERMISSIONS.MANAGE_ENROLLMENTS],
};
