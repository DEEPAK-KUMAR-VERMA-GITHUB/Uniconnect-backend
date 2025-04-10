const executeQueryWithTimeout = async (query, timeout = 5000) => {
  return Promise.race([
    query,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Query timeout")), timeout)
    ),
  ]);
};

// Usage
const getResources = async (query) => {
  try {
    return await executeQueryWithTimeout(Resource.find(query).lean(), 5000);
  } catch (error) {
    if (error.message === "Query timeout") {
      // Handle timeout
      throw new Error("Request timed out");
    }
    throw error;
  }
};

export default executeQueryWithTimeout;
