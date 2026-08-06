"use client";

import Image from "next/image";
import type { IConversation } from "@/features/messaging/conversationApiSlice";

interface ConversationListProps {
  conversations: IConversation[];
  isLoading: boolean;
  isError: boolean;
  activeConversationId: string | null;
  role: "user" | "seller";
  onSelect: (conversationId: string) => void;
}

export default function ConversationList({
  conversations,
  isLoading,
  isError,
  activeConversationId,
  role,
  onSelect,
}: ConversationListProps) {
  if (isLoading) {
    return <p className="p-4 text-sm text-[#00000082]">Loading conversations...</p>;
  }

  if (isError) {
    return <p className="p-4 text-sm text-red-500">Could not load conversations.</p>;
  }

  if (conversations.length === 0) {
    return <p className="p-4 text-sm text-[#00000082]">No conversations yet.</p>;
  }

  return (
    <ul className="divide-y max-h-[70vh] overflow-y-auto">
      {conversations.map((conversation) => {
        const peer = role === "user" ? conversation.seller : conversation.user;
        const isActive = conversation._id === activeConversationId;

        return (
          <li key={conversation._id}>
            <button
              type="button"
              onClick={() => onSelect(conversation._id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer ${
                isActive ? "bg-slate-100" : "hover:bg-slate-50"
              }`}
            >
              <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 bg-slate-200">
                {peer?.avatar ? (
                  <Image src={peer.avatar} alt={peer.name || "User"} fill className="object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm truncate">{peer?.name || "Unknown"}</p>
                  {conversation.unreadCount > 0 && (
                    <span className="shrink-0 rounded-full bg-[#3bc177] text-white text-[11px] px-1.5 py-0.5 leading-none">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#00000082] truncate">
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