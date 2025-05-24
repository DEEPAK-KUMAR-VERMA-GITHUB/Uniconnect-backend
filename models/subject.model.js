import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (value) {
          return /^[a-zA-Z\s]+$/.test(value);
        },
        message: "Subject name must contain only letters and spaces",
      },
    },
    code: {
      type: String,
      required: true,
      validate: {
        validator: function (value) {
          return /^[a-zA-Z0-9]+$/.test(value);
        },
        message: "Subject code must contain only letters and numbers",
      },
    },
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
    },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    credits: {
      type: Number,
      required: [true, "Subject credits are required"],
      min: [1, "Credits must be at least 1"],
      max: [30, "Credits cannot exceed 30"],
    },
    metadata: {
      isElective: {
        type: Boolean,
        default: false,
      },
      hasLab: {
        type: Boolean,
        default: false,
      },
      isOnline: {
        type: Boolean,
        default: false,
      },
    },
    resources: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resource",
      },
    ],
    assignments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assignment",
      },
    ],
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export default mongoose.model("Subject", subjectSchema);
