import Department from "../models/department.model.js";
import Course from "../models/course.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import cacheService from "../services/cache.service.js";
import { paginateResult } from "./../utils/pagination.util.js";
import { ApiError } from "../utils/apiError.js";

class CourseController {
  /**
   * @route POST /api/v1/courses/create-course
   * @access Private/Admin
   * @param {Object} request.body - Course details
   * @param {string} request.body.name - Course name
   * @param {string} request.body.code - Course code
   * @param {string} request.body.department - Department ID
   * @param {number} request.body.duration - Course duration
   * @param {string} request.body.type - Course type
   * @returns {Object} - Success response with created course data
   */

  async createCourse(request, reply) {
    try {
      const { name, code, department, duration, type } = request.body;

      // Validate department
      const departmentExists = await Department.findById(department);
      if (!departmentExists) {
        return ApiError.notFound("Department not found");
      }

      // Check for existing course
      const courseExists = await Course.findOne({
        $or: [
          { code, department },
          { name, department },
        ],
      });

      if (courseExists) {
        return ApiError.conflict("Course already exists");
      }

      // Create course
      const course = await Course.create({
        name,
        code,
        department,
        duration,
        type,
        createdBy: request.user._id,
        updatedBy: request.user._id,
      });

      // Update department's courses array
      departmentExists.courses.push(course._id);
      await departmentExists.save();

      // Clear relevant caches
      await cacheService.delPattern("course");

      return ApiResponse.succeed(course, "Course created successfully");
    } catch (error) {
      return ApiError.internal("Error in creating Course : " + error.message);
    }
  }

  /**
   * @route GET /api/v1/courses
   * @access Public
   * @param {Object} request.query - Query parameters
   * @param {number} request.query.page - Page number
   * @param {number} request.query.limit - Number of items per page
   * @param {string} request.query.search - Search query
   * @param {string} request.query.department - Department ID
   * @param {string} request.query.type - Course type
   * @param {number} request.query.duration - Course duration
   * @param {string} request.query.sortBy - Field to sort by
   * @param {string} request.query.sortOrder - Sort order (asc or desc)
   * @returns {Object} - Success response with paginated courses data
   */
  async getCourses(request, reply) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        department = "",
        type = "",
        duration = "",
        sortBy = "createdAt",
        sortOrder = "desc",
      } = request.query;

      // Build query
      const query = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { code: { $regex: search, $options: "i" } },
        ];
      }
      if (department) query.department = department;
      if (type) query.type = type;
      if (duration) query.duration = duration;

      // Execute query using paginateResult
      const result = await paginateResult(
        Course,
        query,
        [{ path: "department", select: "name code status" }],
        parseInt(page),
        parseInt(limit),
        { [sortBy]: sortOrder === "asc" ? 1 : -1 }
      );

      return ApiResponse.succeed(result, "Courses fetched successfully");
    } catch (error) {
      return ApiError.internal("Error in fetching courses :" + error.message);
    }
  }

  /**
   * Get Courses by Department ID
   * @route GET /api/v1/courses/department/:departmentId
   * @access Public
   * @param {string} request.params.departmentId - Department ID
   * @returns {Object} - Success response with courses data for department
   */
  async getCoursesByDepartment(request, reply) {
    try {
      const { departmentId } = request.params;

      // Validate department exists
      const department = await Department.findById(departmentId);
      if (!department || department.status !== "ACTIVE") {
        return ApiError.notFound("Department not found or invalid department");
      }

      const courses = await paginateResult(
        Course,
        { department: departmentId },
        [{ path: "department", select: "name code status" }],
        1,
        100,
        { createdAt: -1 }
      );

      return ApiResponse.succeed(courses, "Courses fetched successfully");
    } catch (error) {
      return ApiError.internal(
        "Error in fetching courses by department: " + error.message
      );
    }
  }

  /**
   * Get Course using ID
   * @route GET /api/v1/courses/get-course/:id
   * @access Public
   * @param {string} request.params.id - Course ID
   * @returns {Object} - Success response with course data
   */
  async getCourseById(request, reply) {
    try {
      const { id } = request.params;

      const course = await Course.findById(id);

      if (!course) return ApiError.notFound("Course not found");

      return ApiResponse.succeed(course, "Course fetched successfully");
    } catch (error) {
      return ApiError.internal("Error in fetching course :" + error.message);
    }
  }

  /**
   * Update Course
   * @route PUT /api/v1/courses/update-course/:id
   * @access Admin only
   * @param {string} request.params.id - Course ID
   * @param {Object} request.body - Updated course details
   * @returns {Object} - Success response with updated course data
   */
  async updateCourse(request, reply) {
    try {
      const { id } = request.params;
      const updates = request.body;

      // Validate department if being updated
      if (updates.department) {
        const departmentExists = await Department.findById(updates.department);
        if (!departmentExists) {
          return ApiError.notFound("Department not found");
        }
      }

      const course = await Course.findByIdAndUpdate(
        id,
        {
          ...updates,
          updatedAt: Date.now(),
          updatedBy: request.user._id,
        },
        { new: true, runValidators: true }
      ).populate("department", "name code");

      if (!course) {
        return ApiError.notFound("Course not found");
      }

      //clear relavant caches
      await cacheService.delPattern(course);

      return ApiResponse.succeed(course, "Course updated successfully");
    } catch (error) {
      return ApiError.internal("Error in updating course :" + error.message);
    }
  }

  /**
   * Change Course Status
   * @route PATCH /api/v1/courses/change-status/:id
   * @access Admin only
   * @param {string} request.params.id - Course ID
   * @param {string} request.body.status - New status (ACTIVE/INACTIVE)
   * @returns {Object} - Success response with updated course data
   */
  async changeCourseStatus(request, reply) {
    try {
      const { id } = request.params;
      const { status } = request.body;

      const course = await Course.findByIdAndUpdate(
        id,
        {
          status,
          updatedAt: Date.now(),
          updatedBy: request.user._id,
        },
        { new: true, runValidators: true }
      ).populate("department", "name code");

      if (!course) {
        return ApiError.notFound("Course not found");
      }

      // Clear relevant caches
      await cacheService.delPattern(course);

      return ApiResponse.succeed(course, "Course status updated successfully");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * Delete Course
   * @route DELETE /api/v1/courses/delete-course/:id
   * @access Admin only
   * @param {string} request.params.id - Course ID
   * @returns {Object} - Success response with deleted course data
   */
  async deleteCourse(request, reply) {
    try {
      const { id } = request.params;

      const course = await Course.findById(id);
      if (!course) {
        return ApiError.notFound("Course not found");
      }

      // Check if course has active sessions
      const hasActiveSessions = await Session.exists({
        course: id,
        endYear: { $gte: new Date().getFullYear() },
      });

      if (hasActiveSessions) {
        return ApiError.badRequest("Cannot delete course with active sessions");
      }

      // Remove course from department
      await Department.findByIdAndUpdate(course.department, {
        $pull: { courses: course._id },
      });

      // Delete course
      await course.remove();

      // Clear relevant caches
      await cacheService.delPattern(course);

      return ApiResponse.succeed(course, "Course deleted successfully");
    } catch (error) {
      return ApiError.internal("Error in deleting course :" + error.message);
    }
  }
}

export default new CourseController();
