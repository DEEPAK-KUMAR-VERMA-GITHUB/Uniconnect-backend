import mongoose from "mongoose";

const semesterSchema = new mongoose.Schema({
  semester: {
    type: Number,
    required: true,
    validate: {
      validator: function (semester) {
        return semester >= 1 && semester <= 8;
      },
      message: "Semester must be between 1 and 8",
    },
  },
  session: {
    type: mongoose.Schema.ObjectId,
    ref: "Session",
  },
  subjects: [{ type: mongoose.Schema.ObjectId, ref: "Subject" }],
});

export default mongoose.model("Semester", semesterSchema);
