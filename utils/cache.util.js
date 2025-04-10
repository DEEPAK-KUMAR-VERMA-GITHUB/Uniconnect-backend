import NodeCache from "node-cache";
const cache = new NodeCache({ stdTTL: 600 }); // default time for 10 minutes cache

const cacheMiddleware = (duration) => {
  return async (request, reply) => {
    if (request.method !== "GET") {
      return reply.continue();
    }

    const key = request.url.pathname;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      reply.send(cachedResponse);
    }

    reply.send = (payload) => {
      cache.set(key, payload, duration);
      reply.header("Cache-Control", `public, max-age=${duration}`);
      reply.send(payload);
    };
  };
};

export default cache;
