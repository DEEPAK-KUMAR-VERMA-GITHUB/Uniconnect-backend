import mongoose from "mongoose";

const semesterSchema = new mongoose.Schema({
  semesterName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  semesterNumber: {
    type: Number,
    required: true,
    validate: {
      validator: function (semester) {
        return semester >= 1 && semester <= 8;
      },
      message: "Semester must be between 1 and 8",
    },
  },
  startDate: {
    type: Date,
    required: [true, "Start Date is required"],
  },
  endDate: {
    type: Date,
    required: [true, "End Date is required"],
    validate: {
      validator: function (endDate) {
        return endDate - this.startDate >= 12960000000;
      },
      message: "End Date must be after Start Date",
    },
  },
  session: {
    type: mongoose.Schema.ObjectId,
    ref: "Session",
    required: [true, "Semester must belong to a session"],
  },
  subjects: [{ type: mongoose.Schema.ObjectId, ref: "Subject" }],
  status: {
    type: String,
    enum: ["active", "upcomming", "completed"],
    default: "upcomming",
  },
});

export default mongoose.model("Semester", semesterSchema);
