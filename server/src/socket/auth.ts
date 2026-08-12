// import type { ExtendedError } from "socket.io";
// import { consumeSocketTicket } from "../utils/socketTicket.js";
// import type { AppSocket } from "./types.js";

// export const socketAuthMiddleware = async (
//   socket: AppSocket,
//   next: (err?: ExtendedError) => void
// ): Promise<void> => {
//   try {
//     const ticket = socket.handshake.auth?.ticket as string | undefined;

//     if (!ticket) {
//       return next(new Error("Please login to access this resource"));
//     }

//     const identity = await consumeSocketTicket(ticket);

//     if (!identity) {
//       return next(new Error("Session expired. Please login again"));
//     }

//     socket.data.role = identity.role;
//     if (identity.role === "user") {
//       socket.data.user = identity.payload;
//     } else {
//       socket.data.seller = identity.payload;
//     }

//     return next();
//   } catch {
//     return next(new Error("Invalid or expired authentication"));
//   }
// };