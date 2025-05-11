import semesterModel from "../models/semester.model.js";
import sessionModel from "../models/session.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { paginateResult } from "./../utils/pagination.util.js";
import subjectModel from "../models/subject.model.js";

class SemesterController {
  /**
   * @route POST /api/v1/semesters/:sessionId/create-semester
   * @description Create a new semester
   * @access Private
   * @param {string} sessionId - The ID of the session
   * @param {number} semesterNumber - The number of the semester
   * @returns {object} - The created semester
   */

  async createSemester(request, reply) {
    try {
      const { sessionId } = request.params;
      const { semesterName, semesterNumber, startDate, endDate } = request.body;

      //validate session
      const session = await sessionModel.findById(sessionId);
      if (!session) {
        return ApiError.notFound("Session not found or invalid session id");
      }

      // check if semester already exists
      const semesterExists = await semesterModel.findOne({ semesterName });

      if (semesterExists) {
        return ApiError.conflict("Semester already exists");
      }

      const semester = await semesterModel.create({
        semesterName,
        semesterNumber,
        startDate,
        endDate,
        session: sessionId,
      });

      // add semester to session
      session.semesters.push(semester._id);
      await session.save();

      return ApiResponse.created("Semester created successfully", semester);
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * Update semester
   * @route PUT /api/v1/semester/:semesterId
   * @description Update a semester
   * @access Admin Only
   * @param {string} semesterId - The ID of the semester
   * @param {number} semesterNumber - The number of the semester
   * @returns {object} - The updated semester
   */
  async updateSemester(request, reply) {
    const { semesterId } = request.params;
    const { semesterNumber, sessionId } = request.body;
    try {
      const semester = await semesterModel.findById(semesterId);
      if (!semester) {
        return ApiError.notFound("Semester not found or invalid semester id");
      }

      const newSemester = await semesterModel.findByIdAndUpdate(
        semesterId,
        {
          semesterNumber,
          session: sessionId,
        },
        { new: true, runValidators: true }
      );

      // if semester's previous session is different from the new session, update the semester's session
      if (newSemester.session.toString() !== semester.session.toString()) {
        const oldSession = await sessionModel.findById(semester.session);
        oldSession.semesters = oldSession.semesters.filter(
          (id) => id.toString() !== semester._id.toString()
        );
        await oldSession.save();

        const newSession = await Session.findById(sessionId);
        newSession.semesters.push(newSemester._id);
        await newSession.save();
      }

      return ApiResponse.succeed(newSemester, "Semester updated successfully");
    } catch (error) {
      return ApiError.internal("Error in updating semester" + error.message);
    }
  }

  /**
   * @route POST /api/v1/semester/:semesterId/add-subject
   * @description Add a subject to a semester
   * @access Private
   * @param {string} semesterId - The ID of the semester
   * @param {string} subjectId - The ID of the subject
   * @returns {object} - The updated semester
   */

  async addSubjects(request, reply) {
    const { semesterId } = request.params;
    const { subjectIds } = request.body;
    try {
      const semester = await semesterModel.findById(semesterId);
      if (!semester) {
        return ApiError.notFound("Semester not found or invalid semester id");
      }

      // check if subject is already added
      if (semester.subjects.includes(...subjectIds)) {
        return ApiError.conflict("Subject already added");
      }

      semester.subjects.push(...subjectIds);
      await semester.save();
      return ApiResponse.succeed(semester, "Subject added successfully");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * @route Delete /api/v1/semester/:semesterID/remove-subject
   * @description Remove a subject from semester
   * @access Private
   * @param {string} semeesterId - The ID of the semester
   * @param {string} subjectId - The ID of the subject
   * @returns {object} - The updated semester
   */

  async removeSubject(request, reply) {
    const { semesterId, subjectId } = request.params;

    try {
      const semester = await semesterModel.findById(semesterId);
      if (!semester) {
        return ApiError.notFound("Semester not found or invalid semester id");
      }

      // check if subject is present int that semester
      if (!semester.subjects.includes(subjectId)) {
        return ApiError.notFound("Subject not found in semester");
      }

      semester.subjects.pull(subjectId);
      await semester.save();

      return ApiResponse.succeed(semester, "Subject removed successfully");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * Delete semester
   * @route DELETE /api/v1/semesters/:semesterId
   * @description Delete a semester
   * @access Admin Only
   * @param {string} semesterId - The ID of the semester
   * @returns {object} - The deleted semester
   */

  async deleteSemester(request, reply) {
    const { id } = request.params;
    try {
      const semester = await semesterModel.findById(id);
      if (!semester) {
        return ApiError.notFound("Semester not found or invalid semester id");
      }

      // if subject present in semester, then can't be deleted
      if (semester.subjects.length > 0) {
        return ApiError.conflict("Semester has subjects, can't delete");
      }

      // remove semester from session
      const session = await sessionModel.findById(semester.session);
      session.semesters.pull(semester._id);
      await session.save();

      await semesterModel.findByIdAndDelete(id);
      return ApiResponse.succeed(semester, "Semester deleted successfully");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * @route GET /api/v1/semester/:semesterId
   * @description Get a semester by ID
   * @access Public
   * @param {string} semesterId - The ID of the semester
   * @returns {object} - The semester
   */

  async getSemesterById(request, reply) {
    const { id } = request.params;
    try {
      const semester = await semesterModel
        .findById(id)
        .populate("subjects", "subjectName subjectCode subjectType")
        .populate({
          path: "session",
          select: "course",
          populate: {
            path: "course",
            select: "courseName department",
          },
        });

      if (!semester) {
        return ApiError.notFound("Semester not found or invalid semester id");
      }

      return ApiResponse.succeed(semester, "Semester found successfully");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * @route GET /api/v1/semester
   * @description Get all semesters
   * @access Public
   * @returns {object} - The semesters
   * @query {number} page - The page number
   * @query {number} limit - The number of semesters per page
   * @query {string} search - The search query
   * @query {string} sortBy - The field to sort by
   * @query {string} sortOrder - The sort order
   */
  async getAllSemesters(request, reply) {
    try {
      const { sessionId } = request.params;

      const sessionExist = await sessionModel.findById(sessionId);
      if (!sessionExist) {
        return ApiError.notFound("Session not found or invalid course id");
      }

      const semesters = await paginateResult(
        semesterModel,
        { session: sessionId },
        []
      );

      return ApiResponse.succeed(semesters, "Semesters fetched successfully");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * Get all subjects
   * @route GET /api/v1/semester/:semesterId/subjects
   * @description Get all subjects
   * @access Public
   * @param {string} semesterId - The ID of the semester
   * @returns {object} - The subjects
   * @query {number} page - The page number
   * @query {number} limit - The number of subjects per page
   * @query {string} search - The search query
   * @query {string} sortBy - The field to sort by
   * @query {string} sortOrder - The sort order
   */
  async getAllSubjects(request, reply) {
    const { semesterId } = request.params;
    try {
      const semesterExists = await semesterModel.findById(semesterId);
      if (!semesterExists) {
        return ApiError.notFound("Semester not found or invalid semester id");
      }
      const page = parseInt(request.query.page) || 1;
      const limit = parseInt(request.query.limit) || 10;

      const subjectsResult = await paginateResult(
        subjectModel,
        { _id: { $in: semesterExists.subjects } },
        [
          {
            path: "department",
            select: "name",
          },
          {
            path: "course",
            select: "name code",
          },
          {
            path: "faculty",
            select: "fullName email profilePic",
          },
        ],
        page,
        limit
      );

      return ApiResponse.succeed(subjectsResult, "Subjects found successfully");
    } catch (error) {
      return ApiError.internal("Error in getting subjects" + error.message);
    }
  }
}

export default new SemesterController();
