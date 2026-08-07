import mongoose, { Document, Schema, Model } from "mongoose";

export type NotificationRecipientRole = "user" | "seller" | "admin";

export interface INotification extends Document {
  recipientId: string;
  recipientRole: NotificationRecipientRole;
  type: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

const notificationSchema: Schema<INotification> = new mongoose.Schema(
  {
    recipientId: { type: String, required: true },
    recipientRole: { type: String, enum: ["user", "seller", "admin"], required: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, read: 1 });

const NotificationModel: Model<INotification> = mongoose.model<INotification>("Notification", notificationSchema);
export default NotificationModel;