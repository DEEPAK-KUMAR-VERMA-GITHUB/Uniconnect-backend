import mongoose from "mongoose";

const sessionSchema = mongoose.Schema(
  {
    name: {
      type: String,
      default: function () {
        return `${this.startYear}-${this.endYear}`;
      },
    },
    startYear: {
      type: Number,
      required: [true, "Start year is required"],
      min: [2000, "Start year must be atleast 2000"],
      max: [2100, "Start year must be atleast 2100"],
    },
    endYear: {
      type: Number,
      required: [true, "End year is required"],
      vallidate: {
        validator: function (value) {
          return value > this.startYear;
        },
        message: "End year must be greater than start year",
      },
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
    currentSemester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
    },
    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "INACTIVE", "UPCOMING", "COMPLETED"],
        message: "{VALUE} is not a valid status",
      },
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Session", sessionSchema);
