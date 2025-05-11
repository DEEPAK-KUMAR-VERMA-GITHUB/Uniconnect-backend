import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
      validate: {
        validator: function (name) {
          // Allow letters, numbers, spaces, and basic punctuation
          return /^[a-zA-Z0-9\s\-.,()&]+$/.test(name);
        },
        message: "Course name contains invalid characters",
      },
    },
    code: {
      type: String,
      required: [true, "Course code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
      index: true,
    },
    duration: {
      type: Number,
      required: [true, "Course duration is required"],
      min: [1, "Course duration must be at least 1 year"],
      max: [5, "Course duration cannot exceed 5 years"],
    },
    type: {
      type: String,
      enum: {
        values: ["UG", "PG", "DIPLOMA", "CERTIFICATE"],
        message: "{VALUE} is not a valid course type",
      },
      required: [true, "Course type is required"],
    },
    sessions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
      },
    ],
    totalSemesters: {
      type: Number,
      default: function () {
        return parseInt(this.duration * 2);
      },
    },
    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "INACTIVE", "DISCONTINUED"],
        message: "{VALUE} is not a valid status",
      },
      default: "ACTIVE",
    },
    // Audit fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
courseSchema.index({ department: 1, status: 1 });
courseSchema.index({ "metadata.isElective": 1 });

// Virtual for getting current session
courseSchema.virtual("currentSession", {
  ref: "Session",
  localField: "sessions",
  foreignField: "_id",
  justOne: true,
  match: {
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
  },
});

// Pre-save middleware to ensure code is uppercase
courseSchema.pre("save", function (next) {
  if (this.isModified("code")) {
    this.code = this.code.toUpperCase();
  }
  next();
});

// Static method to find active courses in a department
courseSchema.statics.findActiveDepartmentCourses = function (departmentId) {
  return this.find({
    department: departmentId,
    status: "ACTIVE",
  }).populate("department", "name code");
};

const Course = mongoose.model("Course", courseSchema);

export default Course;
