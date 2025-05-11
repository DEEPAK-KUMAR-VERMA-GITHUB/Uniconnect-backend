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

      // validate if that course exists in that department or not
      if (course) {
        if (!departmentExists.courses.includes(course)) {
          return ApiError.notFound("Course not found in department");
        }
      }

      // check for the session in that course
      if (session) {
        const sessionExists = await Course.findOne({
          _id: course,
          sessions: session,
        });
        if (!sessionExists) {
          return ApiError.notFound("Session not found in course");
        }
      }

      // create user based on role
      const userData = {
        fullName,
        email,
        password,
        phoneNumber,
        role,
        department,
        associations: {
          course,
          session,
          semester,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
        loginAttempts: {
          count: 0,
          lastAttempt: null,
        },
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

      const user = await User.create(userData);

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
          user: {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            department: user.department,
          },
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
      const user = await User.findById(request.user._id).populate(
        "department",
        "name, code"
      );

      if (!user) {
        return new ApiError(StatusCode.NOT_FOUND, "User not found");
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
        return new ApiError(StatusCode.NOT_FOUND, "Department not found");
      }

      // check if user exists
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!user) {
        return new ApiError(StatusCode.NOT_FOUND, "User not found");
      }

      // update user
      user.fullName = updates.fullName || user.fullName;
      user.phoneNumber = updates.phoneNumber || user.phoneNumber;
      user.department = updates.department || user.department;
      user.updatedAt = new Date();

      await user.save();

      return new ApiResponse.success(
        {
          user: {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            department: user.department,
          },
        },
        "User profile updated successfully"
      );
    } catch (error) {
      return new ApiError(StatusCode.INTERNAL_SERVER, error.message);
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
      return ApiError.internal(
        "Error fetching faculty members: " + error.message
      );
    }
  }
}

export default new UserController();
