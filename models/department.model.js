import mongoose from "mongoose";
const departmentSchema = new mongoose.Schema(
  {
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
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      unique: [true, "Department code already exists"],
      validate: {
        validator: function (code) {
          const codeRegex = /^[A-Z]{3,}$/;
          return codeRegex.test(code);
        },
        message: "Invalid department code",
      },
    },
    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Course creator is required"],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "INACTIVE", "DISCONTINUED"],
        message: "{VALUE} is not a valid status",
      },
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Department", departmentSchema);
