import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxLength: 100,
    minLength: 2,
    validate: {
      validator: function (value) {
        return /^[a-zA-Z0-9\s]+$/.test(value);
      },
      message: "Title must contain only letters, numbers, and spaces",
    },
  },
  content: {
    type: String,
    required: [true, "Content is required"],
    trim: true,
    minLength: 2,
    validate: {
      validator: function (value) {
        return /^[a-zA-Z0-9\s]+$/.test(value);
      },
      message: "Content must contain only letters, numbers, and spaces",
    },
  },
  targetAudience: [
    {
      type: String,
      enum: ["all", "faculty", "student", "department", "course", "session"],
      required: [true, "Target audience is required"],
    },
  ],
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false, // Optional, for specific target
    validate: {
      validator: function (value) {
        return value === undefined || mongoose.Types.ObjectId.isValid(value);
      },
      message: "Invalid targetId",
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: [true, "Creation date is required"],
  },
});

export default mongoose.model("Notice", noticeSchema);
