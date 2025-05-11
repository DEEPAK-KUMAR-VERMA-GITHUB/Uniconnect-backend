import Department from "../models/department.model.js";
import User from "../models/user.model.js";
import cacheService from "../services/cache.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { paginateResult } from "../utils/pagination.util.js";
import { ApiError } from "../utils/ApiError.js";

class DepartmentController {
  /**
   * @route POST /api/v1/departments/create-department
   * @access Private (Admin)
   * @description Create a new department
   * @param {string} name - The Name of the department
   * @param {string} code - The Code of the department
   */

  async createDepartment(request, reply) {
    try {
      const { name, code } = request.body;

      // check for existing department
      const existingDepartment = await Department.findOne({
        $or: [{ name }, { code }],
      });

      if (existingDepartment) {
        return ApiError.conflict(
          "Department with this name or code already exists"
        );
      }

      const department = await Department.create({
        name,
        code,
        head: null, // Initially no head is assigned
        courses: [],
        createdBy: request.user._id,
        updatedBy: request.user._id,
      });

      // clear all department-related caches
      await cacheService.delPattern("department");

      return ApiResponse.created(department, "Department created successfully");
    } catch (error) {
      return ApiError.internal("Error in creating department", error.message);
    }
  }

  /**
   * @route PUT /api/v1/departments/:id
   * @access Private (Admin)
   * @description Update a department
   * @param {string} id - The ID of the department to update
   * @param {string} name - The new name of the department
   * @param {string} code - The new code of the department
   * @param {string} head - The ID of the new head of the department
   */

  async updateDepartment(request, reply) {
    try {
      const { id } = request.params;
      const { name, code, head, status } = request.body;

      // Check if department exists
      const department = await Department.findById(id);
      if (!department) {
        return ApiError.notFound("Department not found");
      }

      // Check if new head exists
      if (head) {
        const newHead = await User.findById(head);
        if (!newHead) {
          return ApiError.notFound("New head not found");
        }
      }

      // Update department
      department.name = name || department.name;
      department.code = code || department.code;
      department.head = head || department.head;
      department.status = status || department.status;

      department.updatedBy = request.user._id;

      await department.save();

      // clear all department-related caches
      await cacheService.delPattern("department");

      return ApiResponse.succeed(department, "Department updated successfully");
    } catch (error) {
      return ApiError.internal("Error in updating department", error.message);
    }
  }

  /**
   * Get all departments
   * @route GET /api/departments
   * @access Public
   * @query {number} page - Page number
   * @query {number} limit - Number of items per page
   * @query {string} search - Search query
   */

  async getDepartments(request, reply) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        sortBy = "name",
        sortOrder = "asc",
      } = request.query;

      // Build query
      let query = {};
      if (search) {
        query = {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { code: { $regex: search, $options: "i" } },
            { status: { $regex: search, $options: "i" } },
          ],
        };
      }

      const departments = await paginateResult(
        Department,
        query,
        [
          { path: "head", select: "fullName email" },
          { path: "courses", select: "name code duration" },
          { path: "createdBy", select: "fullName email" },
          { path: "updatedBy", select: "fullName email" },
        ],
        parseInt(page),
        parseInt(limit),
        { [sortBy]: sortOrder === "asc" ? 1 : -1 }
      );

      if (!departments) return ApiError.notFound("No departments found");

      return ApiResponse.succeed(
        departments,
        "Departments fetched successfully"
      );
    } catch (error) {
      return ApiError.internal("Error in fetching departments", error.message);
    }
  }

  /**
   * @route GET /api/departments/:id
   * @access Public
   * @description Get a department by ID
   * @params {string} id - The ID of the department
   */

  async getDepartmentById(request, reply) {
    try {
      const { id } = request.params;
      const department = await Department.findById(id);

      if (!department) {
        return ApiError.notFound("Department not found");
      }

      return ApiResponse.succeed(department, "Department fetched successfully");
    } catch (error) {
      return ApiError.internal("Error in fetching department", error.message);
    }
  }

  /**
   * Update department
   * @route PUT /api/departments/:id
   * @access Admin only
   */
  async updateDepartment(request, reply) {
    try {
      const { id } = request.params;
      const updates = request.body;

      const department = await Department.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: Date.now() },
        { new: true, runValidators: true }
      );

      if (!department) {
        return ApiError.notFound("Department not found");
      }

      return ApiResponse.succeed(department, "Department updated successfully");
    } catch (error) {
      return ApiError.internal("Error in updating department", error.message);
    }
  }

  /**
   * Get department statistics
   * @route GET /api/departments/:id/stats
   * @access Admin and Department Head
   */
  async getDepartmentStats(request, reply) {
    try {
      const { id } = request.params;

      const [
        facultyCount,
        studentCount,
        courseCount,
        activeStudents,
        activeFaculty,
      ] = await Promise.all([
        User.countDocuments({ department: id, role: "faculty" }),
        User.countDocuments({ department: id, role: "student" }),
        Course.countDocuments({ department: id }),
        User.countDocuments({
          department: id,
          role: "student",
          isVerified: true,
          isBlocked: false,
        }),
        User.countDocuments({
          department: id,
          role: "faculty",
          isVerified: true,
          isBlocked: false,
        }),
      ]);

      const response = {
        success: true,
        data: {
          totalFaculty: facultyCount,
          totalStudents: studentCount,
          totalCourses: courseCount,
          activeStudents,
          activeFaculty,
          verificationRate: {
            students: (activeStudents / studentCount) * 100 || 0,
            faculty: (activeFaculty / facultyCount) * 100 || 0,
          },
        },
      };

      return ApiResponse.succeed(
        response,
        "Department statistics fetched successfully"
      );
    } catch (error) {
      return ApiError.internal(
        "Error in fetching department statistics",
        error.message
      );
    }
  }

  /**
   * Delete department
   * @route DELETE /api/departments/:id
   * @access Admin only
   */
  async deleteDepartment(request, reply) {
    try {
      const { id } = request.params;

      // Check for existing users in department
      const usersExist = await User.exists({ department: id });
      if (usersExist) {
        return ApiError.conflict(
          "Cannot delete department with existing users"
        );
      }

      const department = await Department.findByIdAndDelete(id);

      if (!department) {
        return ApiError.notFound("Department not found");
      }

      // Clear all department-related caches
      await cacheService.delPattern("department");

      return ApiResponse.succeed(department, "Department deleted successfully");
    } catch (error) {
      return ApiError.internal("Error in deleting department", error.message);
    }
  }

  // assignDepatmenthead
  async assignDepartmentHead(request, reply) {
    try {
      const { id } = request.params;
      const { head } = request.body;

      // Check if the user exists and is a faculty
      const user = await User.findById(head);
      if (!user || user.role !== "faculty") {
        return ApiError.badRequest("User not found or not a faculty");
      }

      // Check if the department exists
      const department = await Department.findById(id);
      if (!department) {
        return ApiError.notFound("Department not found");
      }

      // Assign the department head
      department.head = head;
      await department.save();

      // Clear all department-related caches
      await cacheService.delPattern("department");

      return ApiResponse.succeed(
        department,
        "Department head assigned successfully"
      );
    } catch (error) {
      return ApiError.internal(
        "Error in assigning department head",
        error.message
      );
    }
  }

  /**
   * Helper method to clear all department-related caches
   * @private
   */
  async clearDepartmentCaches() {
    // Get all cache keys
    const keys = await cacheService.keys();

    // Clear all department-related caches
    const keysToDelete = keys.filter(
      (key) => key.startsWith("department:") || key.startsWith("departments:")
    );
    await cacheService.delMany(keysToDelete);
  }
}

export default new DepartmentController();
