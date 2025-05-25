import Notification, {
  NotificationStatus,
  NotificationTypes,
} from "../models/notification.model.js";
import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mailService from "./mail.service.js";

class NotificationService {
  async createNotification({
    title,
    message,
    type = NotificationTypes.SYSTEM,
    sender,
    recipients = [],
    targetGroups = {},
    metadata = {},
  }) {
    try {
      const notification = await Notification.create({
        title,
        message,
        type,
        sender,
        recipients: recipients.map((userId) => ({ user: userId })),
        targetGroups,
        metadata,
      });

      return notification;
    } catch (error) {
      throw ApiError.internal(error);
    }
  }

  async getNotificationsForUsers(userId, status) {
    try {
      const query = {
        $or: [
          { "recipients.user": userId },
          { "targetGroups.faculty": userId },
          { "targetGroups.student": userId },
        ],
      };
      if (status) {
        query.status = status;
      }

      const notifications = await Notification.find(query)
        .populate("sender", "name")
        .populate("recipients.user", "name")
        .populate("targetGroups.departments", "name")
        .populate("targetGroups.courses", "name")
        .sort({ createdAt: -1 });

      return ApiResponse.succeed(notifications);
    } catch (error) {
      return ApiError.internal(error);
    }
  }

  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          "recipients.user": userId,
          "recipients.readAt": null,
        },
        {
          $set: {
            "recipients.$.readAt": new Date(),
            status: NotificationStatus.READ,
          },
        },
        { new: true }
      );
      return ApiResponse.succeed(notification, "Notification marked as read");
    } catch (error) {
      return ApiError.internal(error);
    }
  }

  async sendNotficationToGroups(notification) {
    try {
      const { targetGroups } = notification;

      let userQuery = {};

      // build query based on target groups
      if (targetGroups.roles?.length) {
        userQuery.roles = { $in: targetGroups.roles };
      }

      if (targetGroups.departments?.length) {
        userQuery.department = { $in: targetGroups.departments };
      }

      if (targetGroups.courses?.length) {
        userQuery.courses = { $in: targetGroups.courses };
      }

      const users = await User.find(userQuery).select("_id");
      const userIds = users.map((user) => user._id);

      // Add these users to recipients
      notification.recipients = userIds.map((userId) => ({ user: userId }));

      // save and return the notification
      return await notification.save();
    } catch (error) {
      return ApiError.internal(error);
    }
  }
}

export default new NotificationService();
