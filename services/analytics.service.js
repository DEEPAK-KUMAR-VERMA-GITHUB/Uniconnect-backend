const getResourceStatistics = async (departmentId) => {
  return await Resource.aggregate([
    {
      $lookup: {
        from: "subjects",
        localField: "subject",
        foreignField: "_id",
        as: "subject",
      },
    },
    {
      $unwind: "$subject",
    },
    {
      $match: {
        "subject.department": mongoose.Types.ObjectId(departmentId),
      },
    },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
        recentUploads: {
          $push: {
            $cond: [
              {
                $gte: [
                  "$createdAt",
                  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                ],
              },
              "$_id",
              "$$REMOVE",
            ],
          },
        },
      },
    },
  ]).allowDiskUse(true); // For large datasets
};

export default getResourceStatistics;
