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

      // get subject and populate everything
      const subject = await Subject.findById(id)
        .populate("semester", "name")
        .populate("course", "name")
        .populate("department", "name")
        .populate("faculty", "name email profilePic")
        .populate({
          path: "assignments",
          populate: [
            {
              path: "createdBy",
              select: "name email profilePic",
            },
            {
              path: "resources",
              select: "name url",
            },
          ],
        })
        .populate({
          path: "resources",
          select: "name url",
        });

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

      const subject = await Subject.findById(id).populate(
        "faculty",
        "associations"
      );

      if (!subject) {
        return ApiError.notFound("Subject not found or Invalid Subject ID");
      }

      // remove subject from the semester
      if (subject.semesters) {
        // remove subject from all the semesters
        subject.semesters.forEach(async (semester) => {
          const semesterData = await Semester.findById(semester);
          if (semesterData) {
            semesterData.subjects.pull(subject._id);
            await semesterData.save();
          }
        });
      }

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

      const subject = await Subject.find({ _id: id, status: "ACTIVE" });

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
        if (existingFaculty.id.toString() === subject.faculty.toString()) {
          return ApiError.conflict("Subject already assigned to this faculty");
        } else {
          existingFaculty.associations.subjects.pull(subject.id);
          await existingFaculty.save();
        }
      }

      // check if the subject is already associated with the faculty

      faculty.associations.courses.push(subject.course);
      faculty.associations.sessions.push(subject.session);
      faculty.associations.subjects.push(id);
      subject.faculty = facultyId;

      const updatedSubject = await Subject.findOneAndUpdate(
        { _id: id, status: "ACTIVE" },
        {
          $set: {
            faculty: facultyId,
          },
        },
        { new: true }
      );

      await faculty.save();

      return ApiResponse.succeed(
        updatedSubject,
        "Faculty assigned successfully"
      );
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
      const { facultyId } = request.query;

      let subject;

      if (facultyId) {
        subject = await Subject.findById(id).populate({
          path: "resources",
          match: { uploadedBy: facultyId },
          populate: {
            path: "uploadedBy",
            select: "fullName email profilePic",
          },
        });
      } else {
        subject = await Subject.findById(id).populate({
          path: "resources",
          populate: {
            path: "uploadedBy",
            select: "fullName email profilePic",
          },
        });
      }

      if (!subject) {
        return ApiError.notFound("Subject not found or Invalid Subject ID");
      }

      return ApiResponse.succeed(
        { resources: subject.resources },
        "Resources fetched successfully"
      );
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * @route GET
   * @access private
   */

  async getSubjectAssignments(request, reply) {
    try {
      const { id } = request.params;
      const { facultyId } = request.query;

      let subject;

      if (facultyId) {
        subject = await Subject.findById(id).populate({
          path: "assignments",
          match: { assignedBy: facultyId },
          populate: {
            path: "assignedBy",
            select: "fullName email profilePic",
          },
        });
      } else {
        subject = await Subject.findById(id).populate({
          path: "assignments",
          populate: {
            path: "assignedBy",
            select: "fullName email profilePic",
          },
        });
      }

      if (!subject) {
        return ApiError.notFound("Subject not found or Invalid Subject ID");
      }

      return ApiResponse.succeed(
        { assignments: subject.assignments },
        "Assignments fetched successfully"
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

      // upload file to cloudinary and get the file url
      const { url } = await CloudinaryService.uploadResource(file, type.value);

      const resource = await Resource.create({
        title: title.value,
        type: type.value,
        year: year?.value,
        fileUrl: url,
        uploadedBy: request.user.id,
        subject: subject.id,
      });

      // add newly created resource to subject
      subject.resources.push(resource.id);
      await subject.save();

      // add resources to associate users which contains that subject
      const users = await User.find({
        "associations.subjects": subject.id,
      });

      if (resource.type === "note") {
        users.forEach(async (user) => {
          user.teachingAssignments.notes.push(resource.id);
          await user.save();
        });
      } else {
        users.forEach(async (user) => {
          user.teachingAssignments.pyqs.push(resource.id);
          await user.save();
        });
      }

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
      const { subjectId } = request.params;
      const { file, title, dueDate } = request.body;

      const subject = await Subject.findById(subjectId);
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
      const { url } = await CloudinaryService.uploadResource(
        file,
        "assignment"
      );

      const assignment = await Assignment.create({
        title: title.value,
        dueDate: dueDate.value,
        file: url,
        subject: subject.id,
        assignedBy: request.user.id,
        session: subject.session,
        semester: subject.semester,
      });

      // add newly created assignment to subject
      subject.assignments.push(assignment.id);
      await subject.save();

      // add assignment to associate users which contains that subject
      const users = await User.find({
        "associations.subjects": subject.id,
      });

      users.forEach(async (user) => {
        user.teachingAssignments.assignments.push(assignment.id);
        await user.save();
      });

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
      const { subjectId, resourceId } = request.params;

      const subject = await Subject.findById(subjectId);
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

      // remove resource from associate users which contains that subject
      const users = await User.find({
        "associations.subjects": subject._id,
      });
      if (resource.type === "note") {
        users.forEach(async (user) => {
          user.teachingAssignments.notes.pull(resource.id);
          await user.save();
        });
      } else {
        users.forEach(async (user) => {
          user.teachingAssignments.pyqs.pull(resource.id);
          await user.save();
        });
      }

      await subject.save();
      await Resource.findByIdAndDelete({ _id: resource.id });

      return ApiResponse.succeed(null, "Resource removed successfully");
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
      const { subjectId, assignmentId } = request.params;

      const subject = await Subject.findById(subjectId);
      if (!subject) {
        return ApiError.notFound("Subject not found or Invalid Subject ID");
      }

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return ApiError.notFound(
          "Assignment not found or Invalid Assignment ID"
        );
      }

      // remove assignment from cloudinary
      const result = await CloudinaryService.deleteResource(assignmentId);
      if (!result) {
        return ApiError.internal("Error deleting assignment");
      }

      // Remove assignment from subject
      subject.assignments = subject.assignments.filter(
        (assignment) => assignment.toString() !== assignmentId
      );

      // remove assignment from associate users which contains that subject
      const users = await User.find({
        "associations.subjects": subject._id,
      });

      users.forEach(async (user) => {
        user.teachingAssignments.assignments.pull(assignment.id);
        await user.save();
      });

      await subject.save();

      // Remove the assignment from the database
      await Assignment.findByIdAndDelete({ _id: assignmentId });

      return ApiResponse.succeed(null, "Assignment removed successfully");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * @route /api/v1/subjects/:userId
   * @access private
   */

  async getFacultySubjects(request, reply) {
    try {
      const { facultyId } = request.params;

      const subjects = await Subject.find({ faculty: facultyId })
        .populate("faculty", "fullName email profilePic")
        .populate("semester", "semesterName")
        .populate("course", "name")
        .populate("session", "name startDate endDate")
        .populate({
          path: "resources",
          select: "title type year fileUrl uploadedBy",
          populate: {
            path: "uploadedBy",
            select: "name email profilePic",
          },
        })
        .populate({
          path: "assignments",
          select: "title dueDate file assignedBy submissions assignedAt status",
          populate: [
            {
              path: "assignedBy",
              select: "fullName email profilePic",
            },
          ],
        })
        .select("name code status");

      if (!subjects || subjects.length === 0) {
        return ApiError.notFound("No subjects found for this faculty");
      }

      return ApiResponse.succeed({ subjects }, "Subjects fetched successfully");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }
}

export default new SubjectController();
