const getResourcesWithDetails = async (subjectId) => {
  return await Resource.find({ subject: subjectId })
    .populate({
      path: "faculty",
      select: "name email", // Only select needed fields
    })
    .populate({
      path: "subject",
      select: "name code",
      populate: {
        path: "semester",
        select: "number",
        populate: {
          path: "session",
          select: "startYear endYear",
        },
      },
    })
    .lean();
};

export default getResourcesWithDetails;
