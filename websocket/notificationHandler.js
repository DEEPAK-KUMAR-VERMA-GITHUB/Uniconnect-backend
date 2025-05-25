import NotificationService from "../services/notification.service.js";

export const notificationHandler = async (ws, data, clients) => {
  try {
    const { action, payload } = data;

    switch (action) {
      case "send":
        await handleSendNotification(ws, payload, clients);
        break;
      case "markAsRead":
        await handleMarkAsRead(ws, payload);
        break;
      default:
        ws.send(JSON.stringify({ error: "Invalid notification action" }));
    }
  } catch (error) {
    ws.send(
      JSON.stringify({ error: error.message || "Unknown Notification error" })
    );
  }
};

const handleSendNotification = async (ws, payload, clients) => {
  const { title, message, type, senderId, recipients, targetGroups, metadata } =
    payload;

  const notification = await NotificationService.createNotification({
    title,
    message,
    type,
    sender: senderId,
    recipients,
    targetGroups,
    metadata,
  });

  if (
    targetGroups &&
    Object.keys(targetGroups).some((key) => targetGroups[key]?.length)
  ) {
    await NotificationService.sendNotificationToGroups(notification);
  }

  // Send real-time notification to connected users
  const notificationData = {
    type: "notification",
    action: "new",
    notification: {
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      createdAt: notification.createdAt,
      metadata: notification.metadata,
    },
  };

  // Send to specific recipients
  if (recipients?.length) {
    recipients.forEach((userId) => {
      const recipientWs = clients.get(userId.toString());
      if (recipientWs) {
        recipientWs.send(JSON.stringify(notificationData));
      }
    });
  }

  // Confirm to sender
  ws.send(
    JSON.stringify({
      type: "notification",
      action: "sent",
      success: true,
      notificationId: notification._id,
    })
  );
};

const handleMarkAsRead = async (ws, payload) => {
  const { notificationId, userId } = payload;

  const updatedNotification = await NotificationService.markAsRead(
    notificationId,
    userId
  );

  ws.send(
    JSON.stringify({
      type: "notification",
      action: "marked",
      success: true,
      notificationId,
    })
  );
};
