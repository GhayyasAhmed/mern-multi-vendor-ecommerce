"use client";

import { useEffect } from "react";
import type { Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket";

export function useSocket(enabled: boolean = true): Socket {
  const socket = getSocket();

  useEffect(() => {
    if (!enabled) return;
    if (!socket.connected) {
      socket.connect();
    }
  }, [socket, enabled]);

  return socket;
}