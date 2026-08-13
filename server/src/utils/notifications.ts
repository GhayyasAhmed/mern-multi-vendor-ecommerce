import NotificationModel, { NotificationRecipientRole } from "../models/notification.model.js";
import { emitNotification } from "../socket/emitter.js";

export async function createNotification(
  recipientId: string,
  recipientRole: NotificationRecipientRole,
  type: string,
  message: string,
  link?: string,
  data?: Record<string, unknown>
): Promise<void> {
  const notification = await NotificationModel.create({ recipientId, recipientRole, type, message, link });
  emitNotification(recipientId, {
    _id: String(notification._id),
    type: notification.type,
    message: notification.message,
    link: notification.link,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
    data,
  });
}