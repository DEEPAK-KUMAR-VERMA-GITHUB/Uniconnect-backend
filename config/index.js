import "dotenv/config";

export default {
  app: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || "development",
    apiVersion: "/api/v1",
  },
  db: {
    uri: process.env.MONGODB_URI,
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: "1d",
    refreshExpiresIn: "7d",
  },
  cookie: {
    accessCookieMaxAge: 15 * 60 * 60 * 1000,
    refreshCookieMaxAge: 7 * 24 * 60 * 60 * 1000,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    },
  },
  cache: {
    ttl: process.env.CACHE_TTL || 300,
    checkPeriod: process.env.CACHE_CHECK_PERIOD || 600,
  },
};
