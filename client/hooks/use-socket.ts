"use client";

import { useEffect } from "react";
import type { Socket } from "socket.io-client";
import { getSocket, isSocketConfigured } from "@/lib/socket";

export function useSocket(enabled: boolean = true): Socket {
  const socket = getSocket();

  useEffect(() => {
    if (!enabled || !isSocketConfigured()) return;
    if (!socket.connected) {
      socket.connect();
    }
  }, [socket, enabled]);

  return socket;
}