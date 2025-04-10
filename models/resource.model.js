import mongoose from "mongoose";
import { Timestamp } from "./../node_modules/bson/src/timestamp";

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
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
    type: {
      type: String,
      enum: ["note", "assignment", "pyq"],
      required: [true, "type is required"],
    },
    fileUrl: { type: String, required: [true, "url is required"] },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
  },
  { timestamp: true }
);

export default mongoose.model("Resource", resourceSchema);
