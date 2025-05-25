import mongoose from "mongoose";

export const NotificationTypes = Object.freeze({
  NOTE: "NOTE",
  ASSIGNMENT: "ASSIGNMENT",
  PYQ: "PYQ",
  NOTICE: "NOTICE",
  SYSTEM: "SYSTEM",
});

export const NotificationRoles = Object.freeze({
  ADMIN: "admin",
  FACULTY: "faculty",
  STUDENT: "student",
});

export const NotificationStatus = Object.freeze({
  READ: "READ",
  UNREAD: "UNREAD",
  ARCHIVED: "ARCHIVED",
});

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["NOTE", "ASSIGNMENT", "PYQ", "NOTICE", "SYSTEM"],
      default: "SYSTEM",
    },
    status: {
      type: String,
      enum: ["READ", "UNREAD", "ARCHIVED"],
      default: "UNREAD",
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipients: {
      type: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          readAt: {
            type: Date,
            default: null,
          },
        },
      ],
      default: [],
    },
    targetGroups: {
      roles: {
        type: [String],
        enum: ["admin", "faculty", "student"],
        default: [],
      },
      departments: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Department",
        default: [],
      },
      courses: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Course",
        default: [],
      },
    },
    metadata: {
      resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resource",
      },
      assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assignment",
      },
      subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    },
    expiresAt: {
      type: Date,
      default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  },
  { timestamps: true }
);

// Index for faster queries
notificationSchema.index({ "recipients.user": 1, "recipients.readAt": 1 });
notificationSchema.index({ "targetGroups.roles": 1 });
notificationSchema.index({ "targetGroups.departments": 1 });
notificationSchema.index({ "targetGroups.courses": 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
