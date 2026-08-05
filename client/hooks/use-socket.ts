"use client";

import { useEffect } from "react";
import type { Socket } from "socket.io-client";
// import { getSocket, disconnectSocket } from "@/lib/socket";
import { getSocket } from "@/lib/socket";

/**
 * Connects the shared socket on mount and disconnects on unmount.
 * Feature code should call this once near the auth root, not per-component.
 */
export function useSocket(): Socket {
  const socket = getSocket();

  useEffect(() => {
    socket.connect();

    // return () => {
    //   disconnectSocket();
    // };
  }, [socket]);

  return socket;
}