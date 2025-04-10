import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Course name is required"],
    trim: true,
    validate: {
      validator: function (name) {
        const nameRegex = /^[a-zA-Z\s]*$/;
        return nameRegex.test(name);
      },
      message: "Course name must contain only letters and spaces",
    },
  },
  code: {
    type: String,
    required: [true, "Course code is required"],
    unique: true,
    trim: true,
    validate: {
      validator: function (code) {
        const codeRegex = /^[a-zA-Z0-9\s.-]*$/;
        return codeRegex.test(code);
      },
      message: "Course code must contain only letters, numbers, and spaces",
    },
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: [true, "Department is required"],
  },
  duration: {
    type: Number,
    required: [true, "Course duration is required"],
    min: [1, "Course duration must be atleast 1 year"],
  },
  sessions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
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

export default mongoose.model("Course", courseSchema);
