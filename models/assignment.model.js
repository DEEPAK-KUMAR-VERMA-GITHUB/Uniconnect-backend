import mongoose from "mongoose";

const AssignmentSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      validate: {
        validator: function (value) {
          return value.length > 0;
        },
        message: "Title cannot be empty",
      },
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
      validate: {
        validator: function (value) {
          return value > new Date();
        },
        message: "Due date must be in the future",
      },
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject is required"],
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: [true, "Session is required"],
    },
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: [true, "Semester is required"],
    },
    file: {
      type: String,
      required: [true, "File is required"],
    },
    submissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AssignmentSolution",
      },
    ],
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assigned by is required"],
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "submitted", "graded"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Assignment", AssignmentSchema);
