import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import NotificationService from "../services/notification.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

class NotficationController {
  async createNotifcaiton(request, reply) {
    try {
      const { title, message, type, recipients, targetGroups, metadata } =
        request.body;

      const sender = request.user._id;

      const notification = await NotificationService.createNotification({
        title,
        message,
        type,
        sender,
        recipients,
        targetGroups,
        metadata,
      });

      // if targeting groups, process groups recipients
      if (
        targetGroups &&
        Object.keys(targetGroups).some((key) => targetGroups[key]?.length)
      ) {
        await NotificationService.sendNotficationToGroups(notification);
      }

      return ApiResponse.created(
        notification,
        "Notification created successfully"
      );
    } catch (error) {
      return ApiError.internal(error.message || "Internal server error");
    }
  }

  async getUserNotifications(request, reply) {
    try {
      const userId = request.user._id;
      const { status } = request.query;

      const result = await NotificationService.getNotificationsForUsers(
        userId,
        status
      );

      return ApiResponse.succeed(result, "Notifications fetched successfully");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  async markAsRead(request, reply) {
    try {
      const { notificationId } = request.params;
      const userId = request.user._id;

      const notification = await NotificationService.markAsRead(
        notificationId,
        userId
      );

      if (!notification) {
        return ApiError.notFound("Notification not found or already read");
      }

      return ApiResponse.succeed({}, "Notification marked as read");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }

  async markAllAsRead(request, reply) {
    try {
      const userId = request.user._id;

      await Notification.updateMany(
        {
          "recipients.user": userId,
          "recipients.readAt": null,
        },
        {
          $set: {
            "recipients.$[elem].readAt": new Date(),
          },
        },
        {
          arrayFilters: [{ "elem.user": userId, "elem.readAt": null }],
        }
      );

      return ApiResponse.succeed({}, "All notifications marked as read");
    } catch (error) {
      return ApiError.internal(error.message);
    }
  }
}

export default new NotficationController();
