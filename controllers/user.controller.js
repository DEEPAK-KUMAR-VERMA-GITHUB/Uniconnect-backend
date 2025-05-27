import { generateTokensAndSetCookies } from "../middlewares/auth.middleware.js";
import User from "../models/user.model.js";
import { ROLES, StatusCode } from "../utils/constants.js";
import Department from "../models/department.model.js";
import Course from "./../models/course.model.js";
import { paginateResult } from "../utils/pagination.util.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mailService from "../services/mail.service.js";
import { welcomeEmailTemplate } from "../mails/welcome.template.js";
import { verifiedEmailTemplate } from "../mails/verified.template.js";
import { blockedEmailTemplate } from "../mails/blocked.template.js";
import { unblockedEmailTemplate } from "../mails/unblocked.template.js";
import { ApiError } from "../utils/apiError.js";
import Session from "../models/session.model.js";
import Semester from "../models/semester.model.js";
import Subject from "../models/subject.model.js";
import resourceModel from "../models/resource.model.js";
import assignmentModel from "../models/assignment.model.js";

class UserController {
  /**
   * @route   POST /api/v1/users/register
   * @desc    Register a new user
   * @access  Public
   * @param   {Object} request.body - User registration data
   * @returns {Object} - User registration response
   */

  async registerUser(request, reply) {
    try {
      const {
        fullName,
        email,
        password,
        phoneNumber,
        role,
        department,
        course,
        session,
        semester,
        facultyId,
        designation,
        rollNumber,
      } = request.body;

      // check if user already exists
      const userExists = await User.findOne({
        $or: [{ email }, { phoneNumber }],
      });

      if (userExists) {
        return ApiError.conflict("User already exists");
      }

      // validate department
      const departmentExists = await Department.findById(department);
      if (!departmentExists) {
        return ApiError.notFound("Department not found");
      }

      let subjects = [];

      // validate if that course exists in that department or not
      if (role === "student") {
        const isSemesterActive = await Semester.findOne({
          _id: semester,
          status: "active",
        });
        if (!isSemesterActive) {
          return ApiError.notFound("Semester is not active");
        }

        // add all the subjects in that semester
        subjects = await Subject.find({
          semester: semester,
        });
      }

      // create user based on role
      const userData = {
        fullName,
        email,
        password,
        phoneNumber,
        role,
        department,
      };

      // add role specific fields
      if (role === ROLES.FACULTY) {
        if (!facultyId || !designation) {
          return ApiError.badRequest(
            "Faculty ID and Designation both are required"
          );
        }
        userData.facultyId = facultyId;
        userData.designation = designation;
      } else if (role === ROLES.STUDENT) {
        if (!rollNumber) {
          return ApiError.badRequest("Roll Number is required");
        }
        userData.rollNumber = rollNumber;
      }

      const user = new User(userData);

      user.associations.courses.push(course);
      user.associations.sessions.push(session);
      user.associations.semesters.push(semester);
      user.associations.subjects = subjects;

      await user.save();

      // send registration email
      await mailService.sendMail(
        user.email,
        "Registration Confirmation",
        welcomeEmailTemplate(user)
      );

      return ApiResponse.created(
        {
          user,
        },
        "User registered successfully"
      );
    } catch (error) {
      return ApiError.internal("Error during registration" + error.message);
    }
  }

  /**
   * Login user
   * @route POST
   * @access Public
   */

  async loginUser(request, reply) {
    try {
      const { email, password, deviceId } = request.body;

      // check if user exists
      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return ApiError.unauthorized("Invalid credentials");
      }

      // check is user if blocked
      if (user.isBlocked) {
        return ApiError.unauthorized(
          "Your account has been blocked. Please contact administrator."
        );
      }
      // if user is unverified
      if (!user.isVerified) {
        return ApiError.unauthorized(
          "Your account is not verified. Please contact administrator."
        );
      }

      // if user crossed the maximum try limit
      if (user.loginAttempts.count > 3) {
        await User.findByIdAndUpdate(user._id, {
          $set: { isBlocked: true },
        });
        return ApiError.unauthorized(
          "Account is locked. Please contact administrator."
        );
      }

      // check if password is correct
      const isPasswordMatch = await user.comparePassword(password);

      if (!isPasswordMatch) {
        user.updateLoginAttempts();
        return ApiError.unauthorized("Invalid credentials");
      }

      user.deviceToken = deviceId;
      await user.save({ validateBeforeSave: false });

      // generate tokens
      const { accessToken, refreshToken } = await generateTokensAndSetCookies(
        user,
        reply
      );

      return ApiResponse.succeed(
        {
          user,
          accessToken,
          refreshToken,
        },
        "Logged in successfully"
      );
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * Get user profile
   * @route GET
   * @access Private
   */

  async getUserProfile(request, reply) {
    try {
      // First get the user with basic population
      const user = await User.findById(request.user._id)
        .populate("department", "name")
        .populate("associations.courses")
        .populate("associations.sessions")
        .populate("associations.semesters")
        .populate("associations.subjects");

      if (!user) {
        return new ApiError(StatusCode.NOT_FOUND, "User not found");
      }

      // Now fetch the complete details for teaching assignments
      if (user.teachingAssignments) {
        // Fetch notes details
        if (
          user.teachingAssignments.notes &&
          user.teachingAssignments.notes.length > 0
        ) {
          const notes = await resourceModel
            .find({
              _id: { $in: user.teachingAssignments.notes },
            })
            .populate("subject", "name code")
            .select("title fileUrl updatedAt type")
            .sort({ updatedAt: -1 })
            .limit(3);
          user.teachingAssignments.notes = notes;
        }

        // Fetch assignments details
        if (
          user.teachingAssignments.assignments &&
          user.teachingAssignments.assignments.length > 0
        ) {
          const assignments = await assignmentModel
            .find({
              _id: { $in: user.teachingAssignments.assignments },
            })
            .populate("submissions", "student")
            .populate("subject", "name code")
            .select("title file assignedAt dueDate status")
            .sort({ dueDate: -1 })
            .limit(3);

          user.teachingAssignments.assignments = assignments;
        }

        // Fetch PYQs details
        if (
          user.teachingAssignments.pyqs &&
          user.teachingAssignments.pyqs.length > 0
        ) {
          const pyqs = await resourceModel
            .find({
              _id: { $in: user.teachingAssignments.pyqs },
            })
            .populate("subject", "name code")
            .select("title fileUrl type year updatedAt")
            .sort({ updatedAt: -1 })
            .limit(3);
          user.teachingAssignments.pyqs = pyqs;
        }
      }

      return ApiResponse.succeed(user, "User profile fetched successfully");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * Update user profile
   * @route PUT
   * @access Private
   */

  async updateProfile(request, reply) {
    try {
      const updates = request.body;
      const userId = request.user._id;

      // Remove sensitive fields
      delete updates.password;
      delete updates.email;
      delete updates.role;
      delete updates.isVerified;
      delete updates.isBlocked;

      // validate department
      const departmentExists = await Department.findById(updates.department);
      if (!departmentExists) {
        return ApiError.notFound("Department not found");
      }

      // check if user exists
      const user = await User.findById(userId);

      if (!user) {
        return ApiError.notFound("User not found");
      }

      // update user
      user.fullName = updates.fullName || user.fullName;
      user.phoneNumber = updates.phoneNumber || user.phoneNumber;
      user.department = updates.department || user.department;
      user.updatedAt = new Date();

      // if user want to update his semester
      if (updates.semester) {
        user.associations.semesters = updates.semester;
        user.associations.subjects = [];

        // add all the subjects in that semester
        const subjects = await Subject.find({
          semester: updates.semester,
          course: user.associations.courses[0],
          session: user.associations.sessions[0],
          department: user.department,
        });

        user.associations.subjects = subjects;
      }

      await user.save();

      return ApiResponse.succeed(user, "User profile updated successfully");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * Get all users
   * @route Get /api/v1/users/get-all-users
   * @access Private
   * @returns {Object} - All users response
   */

  async getAllUsers(request, reply) {
    const {
      page = 1,
      limit = 100,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = request.query;

    try {
      const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 },
      };

      const users = await paginateResult(
        User,
        {},
        [
          {
            path: "department",
            select: "name",
          },
        ],
        options
      );

      return ApiResponse.succeed(users, "Users fetched successfully");
    } catch (error) {
      return;
    }
  }

  /**
   * Toggle user verification status
   * @route put /api/v1/users/verity/:id
   * @access Private
   * @return {Object} - Updated user
   */
  async verifyUser(request, reply) {
    try {
      const { id } = request.params;

      const user = await User.findById(id);

      if (!user) {
        return ApiError.notFound("User not found");
      }

      user.isVerified = !user.isVerified;
      user.updatedAt = new Date();
      await user.save();

      // send verification email
      if (user.isVerified) {
        await mailService.sendMail(
          user.email,
          "✅ Account Verification Confirmation",
          verifiedEmailTemplate(user)
        );
      }

      return ApiResponse.succeed(
        user,
        "User verification updated successfully"
      );
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  /**
   * Toggle user status
   * @route put /api/v1/users/change-status/:id
   * @description make user blocked or unblocked
   * @params {id} - The ID of the user
   * @access Private
   * @return {Object} - Updated user
   */
  async toggleUserStatus(request, reply) {
    try {
      const { id } = request.params;

      const user = await User.findById(id);

      if (!user) {
        return ApiError.notFound("User not found");
      }

      user.isBlocked = !user.isBlocked;

      if (user.isBlocked) {
        //send blocked email
        await mailService.sendMail(
          user.email,
          "🚫 Account Suspension Notice",
          blockedEmailTemplate(user)
        );
      } else {
        //send unblocked email
        await mailService.sendMail(
          user.email,
          "🟢 Account Unblocked Notice",
          unblockedEmailTemplate(user)
        );
      }

      user.updatedAt = new Date();
      await user.resetLoginAttempts();

      await user.save();

      return ApiResponse.succeed(user, "User status updated successfully");
    } catch (error) {
      return ApiError.internal("Error in updating user" + error.message);
    }
  }

  /**
   * Delete User
   * @route DELETE /api/v1/delete-user/:id
   * @description Delete a user
   * @access Private
   * @param {string} id - The ID of the user
   * @returns {object} - The deleted user
   */

  async deleteUser(request, reply) {
    try {
      const { id } = request.params;

      const user = await User.findById(id);

      //if user is already assigned with any course then can't remove
      if (user.associations.courses.length > 0) {
        return ApiError.badRequest("User is already assigned with courses");
      }

      if (!user) {
        return ApiError.notFound("User not found");
      }

      await user.deleteOne();

      return ApiResponse.succeed(user, "User deleted successfully");
    } catch (error) {
      return ApiError.internal("Error in deleting user" + error.message);
    }
  }

  /**
   * Get faculty members by department
   * @route GET /api/v1/users/faculty/:departmentId
   * @access Private
   * @returns {Object} - Faculty members in the department
   */
  async getFacultyByDepartment(request, reply) {
    try {
      const { departmentId } = request.params;

      // Validate department exists
      const departmentExists = await Department.findById(departmentId);
      if (!departmentExists) {
        return ApiError.notFound("Department not found");
      }

      const facultyMembers = await User.find({
        role: "faculty",
        department: departmentId,
        isVerified: true,
        isBlocked: false,
      })
        .select("facultyId fullName email")
        .sort({ fullName: 1 });

      return ApiResponse.succeed(
        facultyMembers,
        "Faculty members fetched successfully"
      );
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }
}

export default new UserController();
