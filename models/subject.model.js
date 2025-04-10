import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
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
  semester: { type: mongoose.Schema.Types.ObjectId, ref: "Semester" },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
});

export default mongoose.model("Subject", subjectSchema);