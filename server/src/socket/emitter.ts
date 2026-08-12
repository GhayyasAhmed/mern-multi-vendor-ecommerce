import { publishSocketEvent } from "./index.js";
import type { NotificationPayload } from "./types.js";

export function emitNotification(recipientId: string, payload: NotificationPayload): void {
  void publishSocketEvent(recipientId, "notification", payload);
}