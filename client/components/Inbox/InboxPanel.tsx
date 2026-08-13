"use client";

import Pagination from "@/components/ui/Pagination";
import { SOCKET_EVENTS } from "@/constants";
import {
  conversationApiSlice,
  useGetSellerConversationsQuery,
  useGetUserConversationsQuery,
} from "@/features/messaging/conversationApiSlice";
import { useSocket } from "@/hooks/use-socket";
import { useAppDispatch } from "@/store/hooks";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ChatWindow from "./ChatWindow";
import ConversationList from "./ConversationList";

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
  const [page, setPage] = useState(1);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  const userConversationsQuery = useGetUserConversationsQuery(
    { id: identityId ?? "", page },
    { skip: role !== "user" || !identityId },
  );
  const sellerConversationsQuery = useGetSellerConversationsQuery(
    { id: identityId ?? "", page },
    { skip: role !== "seller" || !identityId },
  );

  const { data, isLoading, isError } =
    role === "user" ? userConversationsQuery : sellerConversationsQuery;
  const conversations = data?.conversations ?? [];
  const pagination = data?.pagination;

  const activeConversation =
    conversations.find((c) => c._id === activeConversationId) ?? null;

  useEffect(() => {
    if (!activeConversationId || !identityId) return;
    const listEndpoint =
      role === "user" ? "getUserConversations" : "getSellerConversations";

    dispatch(
      conversationApiSlice.util.updateQueryData(
        listEndpoint,
        { id: identityId, page },
        (draft) => {
          const conv = draft?.conversations?.find(
            (c) => c._id === activeConversationId,
          );
          if (conv && conv.unreadCount !== 0) conv.unreadCount = 0;
        },
      ),
    );
  }, [activeConversationId, identityId, role, page, dispatch]);

  useEffect(() => {
    if (!identityId) return;
    const listEndpoint = role === "user" ? "getUserConversations" : "getSellerConversations";

    const handleLastMessage = (payload: {
      conversationId: string;
      lastMessage: string;
      lastMessageId: string;
      updatedAt: string;
    }) => {
      dispatch(
        conversationApiSlice.util.updateQueryData(
          listEndpoint,
          { id: identityId, page },
          (draft) => {
            const conv = draft?.conversations?.find(
              (c) => c._id === payload.conversationId,
            );
            if (!conv) return;
            conv.lastMessage = payload.lastMessage;
            conv.lastMessageId = payload.lastMessageId;
            conv.updatedAt = payload.updatedAt;
          },
        ),
      );
    };

    const handleGetMessage = (payload: { conversationId: string }) => {
      if (payload.conversationId === activeConversationId) return;
      dispatch(
          conversationApiSlice.util.updateQueryData(
            listEndpoint,
            { id: identityId, page },
            (draft) => {
              const conv = draft?.conversations?.find(
                (c) => c._id === payload.conversationId,
              );
              if (conv) conv.unreadCount = (conv.unreadCount ?? 0) + 1;
            },
          ),
        );
    };

    socket.on(SOCKET_EVENTS.GET_MESSAGE, handleGetMessage);
    socket.on(SOCKET_EVENTS.GET_LAST_MESSAGE, handleLastMessage);
    return () => {
      socket.off(SOCKET_EVENTS.GET_MESSAGE, handleGetMessage);
      socket.off(SOCKET_EVENTS.GET_LAST_MESSAGE, handleLastMessage);
    };
  }, [socket, dispatch, identityId, role, page, activeConversationId]);

  useEffect(() => {
    if (!identityId) return;
    const handleGetUsers = (ids: string[]) => setOnlineUserIds(ids);
    socket.on(SOCKET_EVENTS.GET_USERS, handleGetUsers);
    return () => {
      socket.off(SOCKET_EVENTS.GET_USERS, handleGetUsers);
    };
  }, [socket, identityId]);

  const handleSelect = (conversationId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("conversation", conversationId);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleBack = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("conversation");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col md:flex-row bg-surface rounded-lg shadow-sm overflow-hidden min-h-[60vh]">
      <div
        className={`w-full md:w-1/3 border-r border-border ${
          activeConversationId ? "hidden md:block" : "block"
        }`}
      >
        <ConversationList
          conversations={conversations}
          isLoading={isLoading}
          isError={isError}
          activeConversationId={activeConversationId}
          role={role}
          onSelect={handleSelect}
          onlineUserIds={onlineUserIds}
        />
        {pagination && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
      <div className="w-full md:w-2/3">
        {activeConversation && identityId ? (
          <ChatWindow
            conversation={activeConversation}
            identityId={identityId}
            role={role}
            isPeerOnline={onlineUserIds.includes(
              role === "user"
                ? activeConversation.sellerId
                : activeConversation.userId,
            )}
            onBack={handleBack}
          />
        ) : (
          <div className="flex h-full min-h-[50vh] items-center justify-center p-6 text-center">
            <p className="text-[15px] text-muted-foreground">
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
