export const executeQueryWithTimeout = async (query, timeout = 5000) => {
  return Promise.race([
    query,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Query timeout")), timeout)
    ),
  ]);
};
