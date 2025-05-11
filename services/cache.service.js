import NodeCache from "node-cache";

class CacheService {
  #cache;

  constructor() {
    this.#cache = new NodeCache({
      stdTTL: 600, //Default TTL 10 minutes
      checkperiod: 120, //Default check period 2 minutes
      useClones: false, //Default false
    });
  }

  // get cached data
  async get(key) {
    return Promise.resolve(this.#cache.get(key));
  }

  // set cached data
  async set(key, value, ttl = 600) {
    return Promise.resolve(this.#cache.set(key, value, ttl));
  }

  // delete cached data
  async del(key) {
    return Promise.resolve(this.#cache.del(key));
  }

  // delete multiple keys
  async delMany(keys) {
    return Promise.resolve(this.#cache.del(keys));
  }

  // delete all keys with a pattern
  async delPattern(pattern) {
    const keys = this.#cache.keys();
    const keysToDelete = keys.filter((key) => key.includes(pattern));
    return Promise.resolve(this.#cache.del(keysToDelete));
  }

  // clear all cache
  async flush() {
    return Promise.resolve(this.#cache.flushAll());
  }

  // generate cache key
  generateKey(prefix, params) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((obj, key) => {
        obj[key] = params[key];
        return obj;
      }, {});

    return `${prefix}:${JSON.stringify(sortedParams)}`;
  }
}

export default new CacheService();
