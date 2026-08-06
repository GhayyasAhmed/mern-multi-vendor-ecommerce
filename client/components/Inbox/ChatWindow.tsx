"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import {
  useGetMessagesQuery,
  useSendMessageMutation,
  type IConversation,
} from "@/features/messaging/conversationApiSlice";
import { useSocket } from "@/hooks/use-socket";
import { getErrorMessage } from "@/features/auth/utils";
import { SOCKET_EVENTS } from "@/constants";

interface ChatWindowProps {
  conversation: IConversation;
  identityId: string;
  role: "user" | "seller";
}

export default function ChatWindow({ conversation, identityId, role }: ChatWindowProps) {
  const peerId = role === "user" ? conversation.sellerId : conversation.userId;
  const peer = role === "user" ? conversation.seller : conversation.user;

  const { data, isLoading, isError, refetch } = useGetMessagesQuery(conversation._id);
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [text, setText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const socket = useSocket(true);

  const messages = data?.messages ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const handleGetMessage = (payload: { senderId: string; receiverId: string }) => {
      if (payload.senderId === peerId && payload.receiverId === identityId) {
        refetch();
      }
    };

    socket.on(SOCKET_EVENTS.GET_MESSAGE, handleGetMessage);
    return () => {
      socket.off(SOCKET_EVENTS.GET_MESSAGE, handleGetMessage);
    };
  }, [socket, peerId, identityId, refetch]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmed = text.trim();
    if (!trimmed) return;

    try {
      await sendMessage({ conversationId: conversation._id, text: trimmed }).unwrap();
      setText("");
      socket.emit(SOCKET_EVENTS.SEND_MESSAGE, { receiverId: peerId, text: trimmed });
      socket.emit(SOCKET_EVENTS.UPDATE_LAST_MESSAGE, {
        receiverId: peerId,
        lastMessage: trimmed,
        lastMessageId: conversation._id,
      });
    } catch (error) {
      setFormError(getErrorMessage(error, "Could not send message. Please try again."));
    }
  };

  return (
    <div className="flex h-full min-h-[60vh] flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-200 shrink-0">
          {peer?.avatar ? (
            <Image src={peer.avatar} alt={peer.name || "User"} fill className="object-cover" />
          ) : null}
        </div>
        <p className="font-medium text-sm">{peer?.name || "Unknown"}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {isLoading ? (
          <p className="text-sm text-[#00000082]">Loading messages...</p>
        ) : isError ? (
          <p className="text-sm text-red-500">Could not load messages.</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-[#00000082]">Say hello to start the conversation.</p>
        ) : (
          messages.map((message) => {
            const isMine = message.sender === identityId;
            return (
              <div key={message._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    isMine ? "bg-[#3957db] text-white" : "bg-slate-100 text-[#333]"
                  }`}
                >
                  {message.images?.url && (
                    <div className="relative w-40 h-40 mb-1">
                      <Image src={message.images.url} alt="attachment" fill className="object-cover rounded-md" />
                    </div>
                  )}
                  {message.text && <p>{message.text}</p>}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {formError && <p className="px-4 pb-2 text-sm text-red-600">{formError}</p>}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t px-4 py-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={isSending || !text.trim()}
          className="px-4 py-2 rounded-md bg-[#3957db] text-white text-sm disabled:opacity-60 cursor-pointer"
        >
          Send
        </button>
      </form>
    </div>
  );
}