import mongoose from "mongoose";

const assignmentSolutionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Resource",
    required: [true, "Assignment is required"],
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Student is required"],
  },
  fileUrl: {
    type: String,
    required: [true, "File URL is required"],
    validate: {
      validator: function (value) {
        return /^[a-zA-Z0-9\s.-]+$/.test(value);
      },
      message:
        "File URL must contain only letters, numbers, spaces, and special characters",
    },
  },
  submittedAt: {
    type: Date,
    default: Date.now,
    required: [true, "Submission date is required"],
  },
});

export default mongoose.model("AssignmentSolution", assignmentSolutionSchema);
