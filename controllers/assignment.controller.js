import assignmentModel from "../models/assignment.model.js";
import assignmentSolutionModel from "../models/assignmentSolution.model.js";
import CloudinaryService from "../services/Cloudinary.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/apiError.js";

class AssignmentController {
  /**
   * @route /assignments/:assignmentId/submit-solution
   * @access private
   */

  async submitSolution(req, res) {
    try {
      const { assignmentId } = req.params;
      const { file } = req.body;
      const userId = req.user._id;

      const assignment = await assignmentModel.findById(assignmentId);
      if (!assignment) {
        return ApiError.notFound("Assignment not found");
      }

      // upload file to cloudinary and get url
      const { url } = await CloudinaryService.uploadResource(
        file,
        "assignmentSolution"
      );

      const submission = new assignmentSolutionModel({
        assignment: assignmentId,
        student: userId,
        fileUrl: url,
      });

      await submission.save();

      console.log("Assignment : ", assignment);
      console.log("Submission : ", submission);

      // check if not present then only push
      if (!assignment.submissions.includes(submission.id)) {
        assignment.submissions.push(submission.id);
        await assignment.save();
      }
      await assignment.save();

      return ApiResponse.succeed(submission, "Solution submitted");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * @route  /assignments/:assignmentId/submissions
   * @access private
   */

  async getAssignmentSubmissions(req, res) {
    try {
      const { assignmentId } = req.params;

      const assignment = await assignmentModel
        .findById(assignmentId)
        .populate({
          path: "submissions",
          select: "fileUrl student createdAt updatedAt",
          populate: {
            path: "student",
            select: "fullName email rollNumber",
          },
        })
        .exec();

      if (!assignment) {
        return ApiError.notFound("Invalid Assignment id");
      }

      return ApiResponse.succeed(assignment);
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }
}

export default new AssignmentController();
