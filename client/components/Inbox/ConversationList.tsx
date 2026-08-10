"use client";

import EmptyState from "@/components/ui/EmptyState";
import type { IConversation } from "@/features/messaging/conversationApiSlice";
import Image from "next/image";
import { AiOutlineMessage } from "react-icons/ai";

interface ConversationListProps {
  conversations: IConversation[];
  isLoading: boolean;
  isError: boolean;
  activeConversationId: string | null;
  role: "user" | "seller";
  onSelect: (conversationId: string) => void;
  onlineUserIds: string[];
}

export default function ConversationList({
  conversations,
  isLoading,
  isError,
  activeConversationId,
  role,
  onSelect,
  onlineUserIds,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <p className="p-4 text-sm text-muted-foreground">Loading conversations...</p>
    );
  }

  if (isError) {
    return (
      <p className="p-4 text-sm text-error">Could not load conversations.</p>
    );
  }

  if (conversations.length === 0) {
    return <EmptyState icon={<AiOutlineMessage size={24} />} title="No conversations yet" className="py-10" />;
  }

  return (
    <ul className="divide-y divide-border max-h-[70vh] overflow-y-auto">
      {conversations.map((conversation) => {
        const peer = role === "user" ? conversation.seller : conversation.user;
        const isActive = conversation._id === activeConversationId;
        const isOnline = peer?.id ? onlineUserIds.includes(peer.id) : false;

        return (
          <li key={conversation._id}>
            <button
              type="button"
              onClick={() => onSelect(conversation._id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer transition-colors ${
                isActive ? "bg-muted" : "hover:bg-surface-hover"
              }`}
            >
              <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 bg-muted">
                {peer?.avatar ? (
                  <Image
                    src={peer.avatar}
                    alt={peer.name || "User"}
                    fill
                    className="object-cover"
                  />
                ) : null}
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success border-2 border-surface" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm truncate text-foreground">
                    {peer?.name || "Unknown"}
                  </p>
                  {conversation.unreadCount > 0 && (
                    <span className="shrink-0 rounded-full bg-accent text-accent-foreground text-[11px] px-1.5 py-0.5 leading-none">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {conversation.lastMessage || "No messages yet"}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}