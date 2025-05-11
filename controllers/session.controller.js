import Session from "../models/session.model.js";
import Course from "../models/course.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import cacheService from "../services/cache.service.js";
import { paginateResult } from "./../utils/pagination.util.js";

class SessionController {
  /**
   * Create new Session
   * @route /api/v1/sessions/create-session
   * @method POST
   * @access Admin only
   * @params {startYear, endYear, course} req.body
   * @returns {Session} session
   */

  async createSession(request, reply) {
    try {
      const { startYear, course } = request.body;

      // validate course
      const courseExists = await Course.findById(course);
      if (!courseExists) {
        return ApiError.notFound("Course not found");
      }

      const endYear = startYear + courseExists.duration;

      const isSessionExists = await Session.findOne({
        startYear,
        endYear,
        course,
      });
      if (isSessionExists) {
        return ApiError.conflict("Session already exists");
      }

      // create new session
      const session = await Session.create({
        startYear,
        endYear,
        course,
      });

      // add session to course
      courseExists.sessions.push(session._id);
      await courseExists.save();

      // clear all relavant caches
      await cacheService.delPattern("sessions");

      return ApiResponse.succeed(session, "Session created successfully");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * Get All Sessions of a course
   * @route /api/v1/sessions/get-sessions/:courseId
   * @method GET
   * @access Public
   * @params {courseId} req.params
   * @returns {Session[]} sessions
   */

  async getSessions(request, reply) {
    try {
      const { courseId } = request.params;

      // validate course
      const courseExists = await Course.findById(courseId);
      if (!courseExists) {
        return ApiError.notFound("Course not found");
      }

      // get all sessions of course
      const sessions = await paginateResult(Session, { course: courseId }, [
        { path: "course", select: "name duration" },
      ]);

      return ApiResponse.succeed(sessions, "Sessions fetched successfully");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * Update session
   * @route /api/v1/sessions/update-session/:sessionId
   * @method PUT
   * @access Admin only
   * @params {sessionId} req.params
   * @params {startYear, endYear, course} req.body
   * @returns {Session} session
   */

  async updateSession(request, reply) {
    try {
      const { sessionId } = request.params;
      const { name, startYear } = request.body;

      // validate session
      const session = await Session.findByIdAndUpdate(
        sessionId,
        { startYear, name },
        { new: true, runvalidators: true }
      );

      if (!session) {
        return ApiError.notFound("Session not found");
      }

      // clear all relavant caches
      await cacheService.delPattern("sessions");

      return ApiResponse.succeed(session, "Session updated successfully");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * Delete session
   * @route /api/v1/sessions/delete-session/:sessionId
   * @method DELETE
   * @access Admin only
   * @params {sessionId} req.params
   * @returns {Session} session
   */

  async deleteSession(request, reply) {
    try {
      const { sessionId } = request.params;

      // validate session
      const sessionExists = await Session.findById(sessionId);
      if (!sessionExists) {
        return ApiError.notFound("Session not found");
      }

      // if session status is active
      if (sessionExists.status === "ACTIVE") {
        return ApiError.badRequest("Active session cannot be deleted");
      }

      // delete session
      const deletedSession = await Session.findByIdAndDelete(sessionId);

      // remove session from course
      const course = await Course.findById(deletedSession.course);
      course.sessions.pull(sessionId);
      await course.save();

      // clear all relavant caches
      await cacheService.delPattern("sessions");
      await cacheService.delPattern("course");

      return ApiResponse.succeed(
        deletedSession,
        "Session deleted successfully"
      );
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * Get Session by Id
   * @route /api/v1/sessions/get-session/:sessionId
   * @method GET
   * @access Public
   * @params {sessionId} req.params
   * @returns {Session} session
   */

  async getSessionById(request, reply) {
    try {
      const { sessionId } = request.params;

      // validate session
      const sessionExists = await Session.findById(sessionId);

      if (!sessionExists) {
        return ApiError.notFound("Session not found");
      }

      return ApiResponse.succeed(sessionExists, "Session fetched successfully");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * Toggle session status
   * @route /api/v1/sessions/toggle-session-status/:sessionId
   * @method PUT
   * @access Admin only
   * @params {sessionId} req.params
   * @returns {Session} session
   */

  async toggleSessionStatus(request, reply) {
    try {
      const { sessionId } = request.params;
      const { status } = request.body;

      // validate session
      const sessionExists = await Session.findByIdAndUpdate(
        sessionId,
        { status },
        { new: true, runvalidators: true }
      );
      if (!sessionExists) {
        return ApiError.notFound("Session not found");
      }

      // clear all relavant caches
      await cacheService.delPattern("sessions");
      await cacheService.delPattern("course");

      return ApiResponse.succeed(
        sessionExists,
        "Session status toggled successfully"
      );
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }
}

export default new SessionController();
