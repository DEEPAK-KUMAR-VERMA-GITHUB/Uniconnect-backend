const paginateResult = async (model, query, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    model.find(query).skip(skip).limit(limit).lean(),
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

export default paginateResult;
