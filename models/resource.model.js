import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxLength: [100, "Title cannot exceed 100 characters"],
      minLength: [2, "Title must be at least 2 characters"],
      validate: {
        validator: function (value) {
          return /^[a-zA-Z0-9\s]+$/.test(value);
        },
        message: "Title must contain only letters, numbers, and spaces",
      },
    },
    type: {
      type: String,
      enum: ["note", "pyq"],
      required: [true, "type is required"],
    },
    fileUrl: {
      type: String,
      required: [true, "url is required"],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject is required"],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Faculty is required"],
    },
    year: {
      type: Number,
      validate: {
        validator: function (value) {
          return value >= 2000 && value <= new Date().getFullYear();
        },
        message: "Invalid year",
      },
      required: function () {
        return this.type === "pyq";
      },
      default: function () {
        return this.type === "pyq" ? new Date().getFullYear() : undefined;
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },

  { timestamp: true }
);

export default mongoose.model("Resource", resourceSchema);
