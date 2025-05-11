import cacheService from "../services/cache.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const cacheMiddleware = (prefix, ttl = 600) => {
  return async (request, reply) => {
    // only cache get requests
    if (request.method !== "GET") return;

    // generate cache key from prefix and query parameters
    const cacheKey = cacheService.generateKey(prefix, {
      url: request.url,
      query: request.query,
      params: request.params,
    });

    try {
      const cachedData = cacheService.get(cacheKey);

      if (cachedData) {
        reply.header("X-Cache", "HIT");
        return ApiResponse.succeed(cachedData);
      }

      // if not in cache, intercept the reply object
      const originalSend = reply.send;
      reply.send = function (payload) {
        // cache the response
        cacheService.set(cacheKey, payload, ttl);
        reply.header("X-Cache", "MISS");
        originalSend.call(this, payload);
      };
    } catch (error) {
      return ApiError.cacheError(error.message);
    }
  };
};
