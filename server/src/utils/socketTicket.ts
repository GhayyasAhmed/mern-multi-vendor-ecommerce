import crypto from "crypto";
import { redis } from "../config/redis.js";
import type { SocketIdentity } from "../socket/types.js";

const TICKET_PREFIX = "socket_ticket:";
const TICKET_TTL_SECONDS = 30;

export async function createSocketTicket(identity: SocketIdentity): Promise<string> {
  const ticket = crypto.randomBytes(32).toString("hex");
  await redis.set(`${TICKET_PREFIX}${ticket}`, JSON.stringify(identity), "EX", TICKET_TTL_SECONDS);
  return ticket;
}