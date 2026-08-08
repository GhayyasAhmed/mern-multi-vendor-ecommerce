import crypto from "crypto";
import { redis } from "../config/redis.js";
import type { IUser } from "../models/user.model.js";
import type { IShop } from "../models/shop.model.js";

const TICKET_PREFIX = "socket_ticket:";
const TICKET_TTL_SECONDS = 30;

export type SocketIdentity =
  | { role: "user"; payload: IUser }
  | { role: "seller"; payload: IShop };

export async function createSocketTicket(identity: SocketIdentity): Promise<string> {
  const ticket = crypto.randomBytes(32).toString("hex");
  await redis.set(`${TICKET_PREFIX}${ticket}`, JSON.stringify(identity), "EX", TICKET_TTL_SECONDS);
  return ticket;
}

export async function consumeSocketTicket(ticket: string): Promise<SocketIdentity | null> {
  const key = `${TICKET_PREFIX}${ticket}`;
  const raw = await redis.get(key);
  if (!raw) {
    return null;
  }
  await redis.del(key);
  try {
    return JSON.parse(raw) as SocketIdentity;
  } catch {
    return null;
  }
}