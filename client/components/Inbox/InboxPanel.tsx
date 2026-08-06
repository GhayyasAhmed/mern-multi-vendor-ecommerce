"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  useGetUserConversationsQuery,
  useGetSellerConversationsQuery,
} from "@/features/messaging/conversationApiSlice";
import { useSocket } from "@/hooks/use-socket";
import { useAppDispatch } from "@/store/hooks";
import { apiSlice } from "@/lib/api/apiSlice";
import { SOCKET_EVENTS } from "@/constants";
import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";

interface InboxPanelProps {
  role: "user" | "seller";
  identityId?: string;
}

export default function InboxPanel({ role, identityId }: InboxPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeConversationId = searchParams.get("conversation");
  const dispatch = useAppDispatch();
  const socket = useSocket(Boolean(identityId));

  const userConversationsQuery = useGetUserConversationsQuery(identityId ?? "", {
    skip: role !== "user" || !identityId,
  });
  const sellerConversationsQuery = useGetSellerConversationsQuery(identityId ?? "", {
    skip: role !== "seller" || !identityId,
  });

  const { data, isLoading, isError } = role === "user" ? userConversationsQuery : sellerConversationsQuery;
  const conversations = data?.conversations ?? [];

  const activeConversation = conversations.find((c) => c._id === activeConversationId) ?? null;

  useEffect(() => {
    if (!identityId) return;

    const listTag = { type: "Conversation" as const, id: role === "user" ? "USER-LIST" : "SELLER-LIST" };
    const refreshList = () => dispatch(apiSlice.util.invalidateTags([listTag]));

    socket.on(SOCKET_EVENTS.GET_MESSAGE, refreshList);
    socket.on(SOCKET_EVENTS.GET_LAST_MESSAGE, refreshList);

    return () => {
      socket.off(SOCKET_EVENTS.GET_MESSAGE, refreshList);
      socket.off(SOCKET_EVENTS.GET_LAST_MESSAGE, refreshList);
    };
  }, [socket, dispatch, identityId, role]);

  const handleSelect = (conversationId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("conversation", conversationId);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col md:flex-row bg-white rounded-lg shadow-sm overflow-hidden min-h-[60vh]">
      <div className="w-full md:w-1/3 border-r">
        <ConversationList
          conversations={conversations}
          isLoading={isLoading}
          isError={isError}
          activeConversationId={activeConversationId}
          role={role}
          onSelect={handleSelect}
        />
      </div>
      <div className="w-full md:w-2/3">
        {activeConversation && identityId ? (
          <ChatWindow conversation={activeConversation} identityId={identityId} role={role} />
        ) : (
          <div className="flex h-full min-h-[50vh] items-center justify-center p-6 text-center">
            <p className="text-[15px] text-[#00000082]">
              {conversations.length === 0
                ? "You have no conversations yet."
                : "Select a conversation to start chatting."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}