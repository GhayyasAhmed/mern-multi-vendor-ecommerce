import { redis } from "../config/redis.js";

export const SOCKET_EVENTS_CHANNEL = "socket_events";

export async function publishSocketEvent(
  identityId: string,
  event: string,
  payload: unknown
): Promise<void> {
  const envelope = JSON.stringify({ identityId, event, payload });
  await redis.publish(SOCKET_EVENTS_CHANNEL, envelope);
}