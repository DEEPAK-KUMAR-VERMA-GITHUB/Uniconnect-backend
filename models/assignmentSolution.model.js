import mongoose from "mongoose";

const assignmentSolutionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment",
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
  },
  submittedAt: {
    type: Date,
    default: Date.now,
    required: [true, "Submission date is required"],
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    required: [true, "Submission date is required"],
  },
});

export default mongoose.model("AssignmentSolution", assignmentSolutionSchema);
