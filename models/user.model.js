import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      minLength: [2, "Name must contain at least 2 characters"],
      validate: {
        validator: function (name) {
          const nameRegex = /^[a-zA-Z\s]*$/;
          return nameRegex.test(name);
        },
        message: "Name must contain only letters and spaces",
      },
      required: [true, "Name is required"],
      trim: true,
      index: true, // index for faster name searches
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+(\.[^\s@]+)*$/;
          return emailRegex.test(email);
        },
        message: "Invalid email",
      },
      index: true, // index for faster email searches
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: [8, "Password must contain at least 8 characters"],
      validate: {
        validator: function (password) {
          const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
          return passwordRegex.test(password);
        },
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      },
      select: false, // Don't return password in queries by default
    },

    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      validate: {
        validator: function (phoneNumber) {
          const phoneRegex = /^\d{10}$/;
          return phoneRegex.test(phoneNumber);
        },
        message: "Invalid phone number",
      },
      index: true, // index for faster phone number searches
    },

    role: {
      type: String,
      enum: ["admin", "faculty", "student"],
      required: [true, "Role is required"],
      index: true, // index for role-based queries
    },

    // Common fields for both faculty and students
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
      index: true,
    },

    // Faculty-specific fields
    facultyId: {
      type: String,
      sparse: true, // Sparse index for faculty-only field
      validate: {
        validator: function (facultyId) {
          if (this.role !== "faculty") return true;
          const facultyIdRegex = /^[a-zA-Z0-9]{4,}$/;
          return facultyIdRegex.test(facultyId);
        },
        message: "Invalid faculty ID",
      },
      index: true,
    },

    designation: {
      type: String,
      enum: ["Associate Professor", "Assistant Professor", "Lecturer"],
      sparse: true, // Sparse index for faculty-only field
    },

    // Student-specific fields
    rollNumber: {
      type: String,
      sparse: true, // Sparse index for student-only field
      validate: {
        validator: function (rollNo) {
          if (this.role !== "student") return true;
          const rollNoRegex = /^[a-zA-Z0-9]{4,}$/;
          return rollNoRegex.test(rollNo);
        },
        message: "Invalid roll number",
      },
      index: true,
    },

    // Dynamic references based on role
    associations: {
      // For faculty: courses they teach
      // For students: their course, session, semester
      course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        sparse: true,
      },
      session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
        sparse: true,
      },
      semester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Semester",
        sparse: true,
      },
    },

    // Faculty-specific arrays
    teachingAssignments: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
        },
        session: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Session",
        },
        semester: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Semester",
        },
        subject: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Subject",
        },
      },
    ],

    // Status and security fields
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    isBlocked: {
      type: Boolean,
      default: false,
      index: true,
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date,

    lastLogin: {
      type: Date,
      default: null,
    },
    loginAttempts: {
      count: { type: Number, default: 0 },
      lastAttempt: { type: Date },
    },
    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for common queries
userSchema.index({ role: 1, department: 1 });
userSchema.index({ role: 1, "associations.course": 1 });
userSchema.index({ role: 1, isVerified: 1, isBlocked: 1 });

// Virtual fields
userSchema.virtual("isStudent").get(function () {
  return this.role === "student";
});

userSchema.virtual("isFaculty").get(function () {
  return this.role === "faculty";
});

// Middleware for role-based validation
userSchema.pre("validate", function (next) {
  if (this.role === "faculty" && !this.facultyId) {
    this.invalidate("facultyId", "Faculty ID is required for faculty members");
  }
  if (this.role === "student" && !this.rollNumber) {
    this.invalidate("rollNumber", "Roll number is required for students");
  }
  next();
});

// Password hashing middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
userSchema.methods = {
  // Compare password
  comparePassword: async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  },

  // Generate reset password token
  getResetPasswordToken: function () {
    const resetToken = crypto.randomBytes(20).toString("hex");
    this.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    this.resetPasswordExpire =
      Date.now() + process.env.RESET_PASSWORD_EXPIRES * 60 * 1000;
    return resetToken;
  },

  // Generate JWT tokens
  getSignedJwtToken: function () {
    const accessToken = jwt.sign(
      {
        id: this._id,
        role: this.role,
        name: this.fullName,
        email: this.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES,
      }
    );

    const refreshToken = jwt.sign(
      { id: this._id, role: this.role },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES,
      }
    );

    return { accessToken, refreshToken };
  },

  // Track login attempts
  updateLoginAttempts: async function () {
    this.loginAttempts.count += 1;
    this.loginAttempts.lastAttempt = new Date();
    await this.save();
  },

  // Reset login attempts
  resetLoginAttempts: async function () {
    this.loginAttempts.count = 0;
    this.loginAttempts.lastAttempt = null;
    this.lastLogin = new Date();
    await this.save();
  },
};

// Static methods
userSchema.statics = {
  // Find active users by role
  findActiveByRole: function (role) {
    return this.find({ role, isVerified: true, isBlocked: false });
  },

  // Find faculty members by department
  findFacultyByDepartment: function (departmentId) {
    return this.find({
      role: "faculty",
      department: departmentId,
      isVerified: true,
      isBlocked: false,
    });
  },

  // Find students by course and session
  findStudentsByCourseAndSession: function (courseId, sessionId) {
    return this.find({
      role: "student",
      "associations.course": courseId,
      "associations.session": sessionId,
      isVerified: true,
      isBlocked: false,
    });
  },
};

export default mongoose.model("User", userSchema);
