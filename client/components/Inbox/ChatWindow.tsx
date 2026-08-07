"use client";
import { useEffect, useRef, useState, useMemo, type FormEvent } from "react";
import Image from "next/image";
import {
  useGetMessagesQuery,
  useLazyGetMessagesQuery,
  useSendMessageMutation,
  type IConversation,
  type IMessage,
} from "@/features/messaging/conversationApiSlice";
import { useSocket } from "@/hooks/use-socket";
import { getErrorMessage } from "@/features/auth/utils";
import { SOCKET_EVENTS } from "@/constants";

interface ChatWindowProps {
  conversation: IConversation;
  identityId: string;
  role: "user" | "seller";
  isPeerOnline?: boolean;
}

export default function ChatWindow({
  conversation,
  identityId,
  role,
  isPeerOnline,
}: ChatWindowProps) {
  const peerId = role === "user" ? conversation.sellerId : conversation.userId;
  const peer = role === "user" ? conversation.seller : conversation.user;
  const [seenMessageIds, setSeenMessageIds] = useState<Set<string>>(new Set());

  const { data, isLoading, isError, refetch } = useGetMessagesQuery({
    conversationId: conversation._id,
  });
  const [loadOlderMessages, { isFetching: isLoadingOlder }] =
    useLazyGetMessagesQuery();
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [olderMessages, setOlderMessages] = useState<IMessage[]>([]);
  const [prevConversationId, setPrevConversationId] = useState(
    conversation._id,
  );
  const [manualNextCursor, setManualNextCursor] = useState<string | null>(null);
  const [manualHasMore, setManualHasMore] = useState<boolean | null>(null);

  // Handle conversation switching safely during render without cascading effects
  if (prevConversationId !== conversation._id) {
    setPrevConversationId(conversation._id);
    setOlderMessages([]);
    setManualNextCursor(null);
    setManualHasMore(null);
  }

  const nextCursor = manualNextCursor ?? data?.nextCursor ?? null;
  const hasMore = manualHasMore ?? data?.hasMore ?? false;

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const socket = useSocket(true);

  const messages = useMemo(() => {
    return [...olderMessages, ...(data?.messages ?? [])];
  }, [olderMessages, data?.messages]);

  const handleLoadOlder = async () => {
    if (!nextCursor) return;
    try {
      const result = await loadOlderMessages({
        conversationId: conversation._id,
        before: nextCursor,
      }).unwrap();
      setOlderMessages((prev) => [...result.messages, ...prev]);
      setManualHasMore(result.hasMore);
      setManualNextCursor(result.nextCursor);
    } catch {
      // best-effort: user can retry the "Load earlier messages" click
    }
  };

  useEffect(() => {
    const handleMessageSeen = (payload: {
      senderId: string;
      receiverId: string;
      messageId: string;
    }) => {
      if (payload.receiverId === peerId) {
        setSeenMessageIds((prev) => new Set(prev).add(payload.messageId));
      }
    };
    socket.on(SOCKET_EVENTS.MESSAGE_SEEN, handleMessageSeen);
    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_SEEN, handleMessageSeen);
    };
  }, [socket, peerId]);

  useEffect(() => {
    const lastFromPeer = [...messages]
      .reverse()
      .find((m) => m.sender === peerId);
    if (lastFromPeer) {
      socket.emit(SOCKET_EVENTS.MESSAGE_SEEN, {
        senderId: peerId,
        messageId: lastFromPeer._id,
      });
    }
  }, [messages, peerId, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const handleGetMessage = (payload: {
      senderId: string;
      receiverId: string;
    }) => {
      if (payload.senderId === peerId && payload.receiverId === identityId) {
        refetch();
      }
    };

    socket.on(SOCKET_EVENTS.GET_MESSAGE, handleGetMessage);
    return () => {
      socket.off(SOCKET_EVENTS.GET_MESSAGE, handleGetMessage);
    };
  }, [socket, peerId, identityId, refetch]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.readyState === 2) {
        setImage(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmed = text.trim();
    if (!trimmed && !image) return;

    try {
      await sendMessage({
        conversationId: conversation._id,
        ...(trimmed ? { text: trimmed } : {}),
        ...(image ? { images: image } : {}),
      }).unwrap();

      setText("");
      setImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      const displayMessage = trimmed || "[Image]";
      socket.emit(SOCKET_EVENTS.SEND_MESSAGE, {
        receiverId: peerId,
        text: displayMessage,
      });
      socket.emit(SOCKET_EVENTS.UPDATE_LAST_MESSAGE, {
        receiverId: peerId,
        lastMessage: displayMessage,
        lastMessageId: conversation._id,
      });
    } catch (error) {
      setFormError(
        getErrorMessage(error, "Could not send message. Please try again."),
      );
    }
  };

  return (
    <div className="flex h-full min-h-[60vh] flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-200 shrink-0">
          {peer?.avatar ? (
            <Image
              src={peer.avatar}
              alt={peer.name || "User"}
              fill
              className="object-cover"
            />
          ) : null}
        </div>
        <p className="font-medium text-sm">{peer?.name || "Unknown"}</p>
        <p className="text-xs text-[#00000082]">
          {isPeerOnline ? "Online" : "Offline"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {hasMore && (
          <div className="flex justify-center pb-2">
            <button
              type="button"
              onClick={handleLoadOlder}
              disabled={isLoadingOlder}
              className="text-xs text-[#3957db] hover:underline disabled:opacity-60 cursor-pointer"
            >
              {isLoadingOlder ? "Loading..." : "Load earlier messages"}
            </button>
          </div>
        )}
        {isLoading ? (
          <p className="text-sm text-[#00000082]">Loading messages...</p>
        ) : isError ? (
          <p className="text-sm text-red-500">Could not load messages.</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-[#00000082]">
            Say hello to start the conversation.
          </p>
        ) : (
          messages.map((message) => {
            const isMine = message.sender === identityId;
            return (
              <div
                key={message._id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    isMine
                      ? "bg-[#3957db] text-white"
                      : "bg-slate-100 text-[#333]"
                  }`}
                >
                  {message.images?.url && (
                    <div className="relative w-40 h-40 mb-1">
                      <Image
                        src={message.images.url}
                        alt="attachment"
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                  )}
                  {message.text && <p>{message.text}</p>}
                  {isMine &&
                    message.text &&
                    seenMessageIds.has(message._id) && (
                      <span className="block text-[10px] text-white/70 mt-0.5">
                        Seen
                      </span>
                    )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {formError && (
        <p className="px-4 pb-2 text-sm text-red-600">{formError}</p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col border-t">
        {image && (
          <div className="px-4 py-2 bg-slate-50 flex items-center gap-3 border-b">
            <div className="relative w-12 h-12 rounded-md overflow-hidden border shrink-0">
              <Image src={image} alt="Preview" fill className="object-cover" />
            </div>
            <div className="flex-1 text-xs text-slate-600 truncate">
              Image attached
            </div>
            <button
              type="button"
              onClick={() => {
                setImage(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-xs text-red-600 hover:text-red-800 font-medium cursor-pointer"
            >
              Remove
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 px-4 py-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 transition rounded-full hover:bg-gray-100 cursor-pointer shrink-0"
            title="Attach image"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </button>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={isSending || (!text.trim() && !image)}
            className="px-4 py-2 rounded-md bg-[#3957db] text-white text-sm disabled:opacity-60 cursor-pointer shrink-0"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}