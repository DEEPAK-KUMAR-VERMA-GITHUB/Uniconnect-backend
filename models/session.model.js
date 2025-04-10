import mongoose from "mongoose";

const sessionSchema = mongoose.Schema({
  startYear: {
    type: Number,
    required: [true, "Start year is required"],
    min: [2000, "Start year must be atleast 2000"],
    max: [2100, "Start year must be atleast 2100"],
  },
  endYear: {
    type: Number,
    required: [true, "End year is required"],
    min: [2000, "End year must be atleast 2000"],
    max: [2100, "End year must be atleast 2100"],
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: [true, "Course is required"],
  },
  semesters: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Session", sessionSchema);
