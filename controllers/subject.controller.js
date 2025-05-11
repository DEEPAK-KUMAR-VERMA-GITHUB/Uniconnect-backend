import Assignment from "../models/assignment.model.js";
import AssignmentSolution from "../models/assignmentSolution.model.js";
import Resource from "../models/resource.model.js";
import Subject from "../models/subject.model.js";
import User from "../models/user.model.js";
import CloudinaryService from "../services/Cloudinary.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { paginateResult } from "./../utils/pagination.util.js";

class SubjectController {
  /**
   * @rooute POST
   * @access private
   */

  async createSubject(request, reply) {
    try {
      const {
        name,
        code,
        credits,
        isElective,
        hasLab,
        isOnline,
        course,
        department,
        status,
      } = request.body;

      const isSubjectExists = await Subject.findOne({
        $or: [{ name }, { code }],
      });

      if (isSubjectExists) {
        return ApiError.conflict("Subject already exists");
      }

      const subject = await Subject.create({
        name,
        code,
        credits,
        course,
        department,
        status,
        metadata: {
          isElective,
          hasLab,
          isOnline,
        },
        createdBy: request.user._id,
      });

      return ApiResponse.created(subject, "Subject created successfully");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * @route GET
   * @access public
   */

  async getAllSubjects(request, reply) {
    try {
      const subjects = await paginateResult(
        Subject,
        {},
        [
          {
            path: "semester",
            select: "name",
          },
          {
            path: "course",
            select: "name",
          },
        ],
        1,
        100,
        { "course.name": 1 }
      );
      return ApiResponse.succeed(subjects, "Subjects fetched successfully");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * @route GET
   * @access public
   */
  async getAllAvailableSubjects(request, reply) {
    try {
      const { departmentId, courseId, semesterId } = request.query;

      const subjects = await Subject.find({
        department: departmentId,
        course: courseId,
        status: "ACTIVE",
      });

      if (!subjects || subjects.length === 0) {
        return ApiError.notFound(
          "No subjects found for this department and course"
        );
      }

      return ApiResponse.succeed(subjects, "Subjects fetched successfully");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }
  /**
   * @route GET
   * @access private
   */

  async getSubjectById(request, reply) {
    try {
      const { id } = request.params;

      const subject = await Subject.findById(id).populate(
        "createdBy",
        "name email"
      );

      if (!subject) {
        return ApiError.notFound("Subject not found or Invalid Subject ID");
      }

      return ApiResponse.succeed(subject, "Subject fetched successfully");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * @route GET
   * @access private
   */
  async getSubjectsBySemesterId(request, reply) {
    try {
      const { semesterId } = request.params;

      const subjects = await Subject.find({ semester: semesterId }).populate(
        "faculty",
        "name email profilePic"
      );

      if (!subjects) {
        return ApiError.notFound("No subjects found for this semester");
      }

      return ApiResponse.succeed(subjects, "Subjects fetched successfully");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }
  /**
   * @route PUT
   * @access private
   */

  async updateSubject(request, reply) {
    try {
      const { id } = request.params;
      const { name, code, credits, metadata } = request.body;

      const subject = await Subject.findById(id);

      if (!subject) {
        return ApiError.notFound("Subject not found or Invalid Subject ID");
      }

      subject.name = name || subject.name;
      subject.code = code || subject.code;
      subject.credits = credits || subject.credits;
      subject.metadata = metadata || subject.metadata;

      await subject.save();

      return ApiResponse.succeed(subject, "Subject updated successfully");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * @route DELETE
   * @access private
   */

  async deleteSubject(request, reply) {
    try {
      const { id } = request.params;

      const subject = await Subject.findById(id)
        .populate("semester", "subjects")
        .populate("faculty", "associations");

      if (!subject) {
        return ApiError.notFound("Subject not found or Invalid Subject ID");
      }

      // remove subject from the semester
      await subject.semester?.subjects.pull(subject._id);

      // remove subject from faculty associations
      await subject.faculty?.associations?.courses.pull(subject._id);

      // delete all the subject resources
      await Resource.deleteMany({ _id: { $in: subject.resources } });

      // remove all the uploaded files of assignemtns, resources and assignment solutions from cloudinary
      subject.assignments.forEach(async (assignment) => {
        const assignmentData = await Assignment.findById(assignment);
        if (assignmentData) {
          assignmentData?.submissions.forEach(async (submission) => {
            const submissionData = await AssignmentSolution.findById(
              submission
            );
            if (submissionData) {
              await CloudinaryService.deleteResource(submissionData.fileUrl);
            }
          });
          await CloudinaryService.deleteResource(assignmentData.fileUrl);
        }
      });

      subject.resources?.forEach(async (resource) => {
        const resourceData = await Resource.findById(resource);
        if (resourceData) {
          await CloudinaryService.deleteResource(resourceData.fileUrl);
        }
      });

      // delete all the subject assignment solutions
      await AssignmentSolution.deleteMany({
        assignment: { $in: subject.assignments },
      });

      await // delete all the subject assignments
      await Assignment.deleteMany({ _id: { $in: subject.assignments } });

      await Subject.findByIdAndDelete(id);

      return ApiResponse.succeed(null, "Subject deleted successfully");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * @route PUT
   * @access private
   */

  async assignFaculty(request, reply) {
    try {
      const { id } = request.params;
      const { facultyId } = request.body;

      const subject = await Subject.findById(id);

      if (!subject) {
        return ApiError.notFound("Subject not found or Invalid Subject ID");
      }

      const faculty = await User.findOne({ _id: facultyId, role: "faculty" });

      if (!faculty) {
        return ApiError.notFound("Faculty not found or Invalid Faculty ID");
      }

      // Remove existing faculty if any
      if (subject.faculty) {
        const existingFaculty = await User.findById(subject.faculty);
        if (existingFaculty) {
          existingFaculty.associations.courses.pull(subject._id);
          await existingFaculty.save();
        }
      }

      subject.faculty = facultyId;
      faculty.associations.courses.push(subject._id);

      await subject.save();
      await faculty.save();

      return ApiResponse.succeed(subject, "Faculty assigned successfully");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * @route PUT
   * @access private
   */

  async changeStatus(request, reply) {
    try {
      const { id } = request.params;
      const { status } = request.body;

      const subject = await Subject.findById(id);

      if (!subject) {
        return ApiError.notFound("Subject not found or Invalid Subject ID");
      }

      subject.status = status;

      await subject.save();

      return ApiResponse.succeed(
        subject,
        "Subject status changed successfully"
      );
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * @route GET
   * @access private
   */

  async getSubjectResources(request, reply) {
    try {
      const { id } = request.params;

      const subject = await Subject.findById(id)
        .populate("resources")
        .populate("assignments");

      if (!subject) {
        return ApiError.notFound("Subject not found or Invalid Subject ID");
      }

      return ApiResponse.succeed(
        { resources: subject.resources, assignments: subject.assignments },
        "Resources fetched successfully"
      );
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * @route put
   * @access private
   */

  async addResource(request, reply) {
    try {
      const { id } = request.params;
      const { file, title, type, year } = request.body;

      const subject = await Subject.findById(id);
      if (!subject) {
        return ApiError.notFound("Subject not found or Invalid Subject ID");
      }

      // validate if the user and the subject faculty is same
      if (subject.faculty.toString() !== request.user._id.toString()) {
        return ApiError.forbidden(
          "You are not allowed to add resource to this subject"
        );
      }

      // TODO : upload file to cloudinary and get the file url
      const { public_id } = await CloudinaryService.uploadResource(
        file,
        type.value
      );

      const resource = await Resource.create({
        title: title.value,
        type: type.value,
        year: year?.value,
        fileUrl: public_id,
        uploadedBy: request.user._id,
        subject: subject._id,
      });

      // add newly created resource to subject
      subject.resources.push(resource._id);
      await subject.save();

      return ApiResponse.succeed(resource, "Resource added successfully");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * @route put
   * @access private
   */

  async addAssignment(request, reply) {
    try {
      const { id } = request.params;
      const { file, title, dueDate } = request.body;

      const subject = await Subject.findById(id);
      if (!subject) {
        return ApiError.notFound("Subject not found or Invalid Subject ID");
      }

      // validate if the user and the subject faculty is same
      if (subject.faculty.toString() !== request.user._id.toString()) {
        return ApiError.forbidden(
          "You are not allowed to add assignment to this subject"
        );
      }

      // upload assignment to cloudinary and get file url
      const { public_id } = await CloudinaryService.uploadResource(
        file,
        "assignment"
      );

      const assignment = await Assignment.create({
        title: title.value,
        dueDate,
        file: public_id,
        subject: subject._id,
        assignedBy: request.user._id,
      });

      // add newly created assignment to subject
      subject.assignments.push(assignment._id);
      await subject.save();

      return ApiResponse.succeed(assignment, "Assignment added successfully");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * @route delete
   * @access private
   */
  async removeResource(request, reply) {
    try {
      const { id } = request.params;
      const { resourceId } = request.body;

      const subject = await Subject.findById(id);
      if (!subject) {
        return ApiError.notFound("Subject not found or Invalid Subject ID");
      }

      const resource = await Resource.findById(resourceId);
      if (!resource) {
        return ApiError.notFound("Resource not found or Invalid Resource ID");
      }

      // check if subject faculty and the resource uploadedBy is the same
      if (
        subject.faculty.toString() !== request.user._id.toString() ||
        subject.faculty.toString() !== resource.uploadedBy.toString()
      ) {
        return ApiError.forbidden(
          "You are not allowed to remove this resource"
        );
      }

      const result = await CloudinaryService.deleteResource(resourceId);
      if (!result) {
        return ApiError.internal("Error deleting resource");
      }

      // Remove resource from subject
      subject.resources = subject.resources.filter(
        (resource) => resource.toString() !== resourceId
      );

      await subject.save();

      // Remove the resource from the database
      await resource.remove();

      return ApiResponse.succeed({}, "Resource removed successfully");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * @route delete
   * @access private
   */
  async removeAssignment(request, reply) {
    try {
      const { id } = request.params;
      const { assignmentId } = request.body;

      const subject = await Subject.findById(id);
      if (!subject) {
        return ApiError.notFound("Subject not found or Invalid Subject ID");
      }

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return ApiError.notFound(
          "Assignment not found or Invalid Assignment ID"
        );
      }

      // TODO : Remove assignment Submissions from database

      // remove assignment from cloudinary
      const result = await CloudinaryService.deleteResource(assignmentId);
      if (!result) {
        return ApiError.internal("Error deleting assignment");
      }

      // Remove assignment from subject
      subject.assignments = subject.assignments.filter(
        (assignment) => assignment.toString() !== assignmentId
      );

      await subject.save();

      // Remove the assignment from the database
      await assignment.remove();

      return ApiResponse.succeed({}, "Assignment removed successfully");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }
}

export default new SubjectController();
