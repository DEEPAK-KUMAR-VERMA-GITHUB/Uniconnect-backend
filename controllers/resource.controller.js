import Resource from "../models/resource.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {} from "../utils/ApiError.js";

class ResourceController {
  async getResourcesByFaculty(req, rep) {
    const { facultyId } = req.params;
    const resources = await Resource.findAll({
      where: {
        facultyId,
      },
    });
    return ApiResponse.succeed(resources, "Resources fetched successfully");
  }
}

export default new ResourceController();
