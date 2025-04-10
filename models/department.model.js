import mongoose from "mongoose";
const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: [true, "Department name already exists"],
    validate: {
      validator: function (name) {
        const nameRegex = /^[a-zA-Z\s]*$/;
        return nameRegex.test(name);
      },
      message: "Department name must contain only letters and spaces",
    },
  },
  code: {
    type: String,
    required: true,
    unique: [true, "Department code already exists"],
    validate: {
      validator: function (code) {
        const codeRegex = /^[A-Z]{3}$/;
        return codeRegex.test(code);
      },
      message: "Invalid department code",
    },
  },
  head: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Faculty",
  },
  courses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
  events: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },
  ],
  announcements: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Announcement",
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

export default mongoose.model("Department", departmentSchema);
