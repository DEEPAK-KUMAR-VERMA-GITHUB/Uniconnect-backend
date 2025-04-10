const mongoose = require("mongoose");

const monitorDBMetrics = () => {
  mongoose.connection.on("error", (error) => {
    console.error("MongoDB error:", error);
    //TODO: Send alert to monitoring system
  });

  setInterval(() => {
    const stats = mongoose.connection.db.stats();
    console.log("DB Stats:", {
      collections: stats.collections,
      objects: stats.objects,
      avgObjSize: stats.avgObjSize,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize,
    });
  }, 300000); // Every 5 minutes
};

// Add performance monitoring middleware
const performanceMiddleware = async (req, reply) => {
  const start = process.hrtime();

  reply.after(() => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1000000;

    if (duration > 1000) {
      // Log slow queries (>1s)
      console.warn(`Slow query detected: ${req.url} took ${duration}ms`);
    }
  });
};

export default { monitorDBMetrics, performanceMiddleware };
