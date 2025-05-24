/**
 * Paginates and populates results from a Mongoose model
 * @param {Model} model - Mongoose model to query
 * @param {Object} query - Query object for filtering
 * @param {Array|Object|String} populate - Population options (can be string, array, or object with nested populate)
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 10)
 * @returns {Promise<{data: Array, pagination: Object}>}
 */
export const paginateResult = async (
  model,
  query,
  populate = [],
  page = 1,
  limit = 100,
  sort = {}
) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    model
      .find(query)
      .populate(populate)
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .lean(),
    model.countDocuments(query),
  ]);

  return {
    data,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      hasNext: skip + data.length < total,
      hasPrev: page > 1,
    },
  };
};
