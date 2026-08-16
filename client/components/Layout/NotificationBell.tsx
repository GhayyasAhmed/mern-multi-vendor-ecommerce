"use client";
import EmptyState from "@/components/ui/EmptyState";
import { NOTIFICATION_SOUND, SOCKET_EVENTS } from "@/constants";
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/features/notifications/notificationApiSlice";
import { useSocket } from "@/hooks/use-socket";
import { apiSlice } from "@/lib/api/apiSlice";
import { useAppDispatch } from "@/store/hooks";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AiOutlineBell } from "react-icons/ai";

export default function NotificationBell({
  enabled,
  // iconColor = "#333",
}: {
  enabled: boolean;
  // iconColor?: string;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dispatch = useAppDispatch();
  const socket = useSocket(enabled);

  const { data } = useGetNotificationsQuery({ limit: 10 }, { skip: !enabled });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio(NOTIFICATION_SOUND);
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    audioRef.current?.play().catch(() => {});
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const handleNotification = () => {
      dispatch(
        apiSlice.util.invalidateTags([{ type: "Notification", id: "LIST" }]),
      );
      playNotificationSound();
    };
    socket.on(SOCKET_EVENTS.NOTIFICATION, handleNotification);
    return () => {
      socket.off(SOCKET_EVENTS.NOTIFICATION, handleNotification);
    };
  }, [socket, enabled, dispatch, playNotificationSound]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!enabled) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative cursor-pointer mt-1"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
      >
        <AiOutlineBell size={24} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 rounded-full bg-accent w-4 h-4 flex items-center justify-center text-accent-foreground text-[10px] font-semibold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-10 w-80 max-h-96 overflow-y-auto bg-surface rounded-md shadow-sm py-2 z-30 text-foreground"
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-border">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead()}
                className="text-xs text-primary hover:underline cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <EmptyState
              icon={<AiOutlineBell size={22} />}
              title="No notifications yet"
              className="py-8"
            />
          ) : (
            notifications.map((notification) => (
              <Link
                key={notification._id}
                href={notification.link || "#"}
                onClick={() => {
                  if (!notification.read) markRead(notification._id);
                  setOpen(false);
                }}
                className={`block px-4 py-2.5 text-sm border-b last:border-b-0 hover:bg-muted ${notification.read ? "text-muted-foreground" : "font-medium text-foreground"}`}
              >
                <p>{notification.message}</p>
                <p className="text-xs mt-0.5">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
