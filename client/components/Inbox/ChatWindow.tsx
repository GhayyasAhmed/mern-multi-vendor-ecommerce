"use client";
import EmptyState from "@/components/ui/EmptyState";
import { ProductGridSkeleton } from "@/components/ui/ProductCardSkeleton";
import { SOCKET_EVENTS } from "@/constants";
import { getErrorMessage } from "@/features/auth/utils";
import {
  useGetMessagesQuery,
  useLazyGetMessagesQuery,
  useSendMessageMutation,
  type IConversation,
  type IMessage,
} from "@/features/messaging/conversationApiSlice";
import { useSocket } from "@/hooks/use-socket";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { AiOutlineArrowLeft, AiOutlineMessage } from "react-icons/ai";

interface ChatWindowProps {
  conversation: IConversation;
  identityId: string;
  role: "user" | "seller";
  isPeerOnline?: boolean;
  onBack?: () => void;
}

export default function ChatWindow({
  conversation,
  identityId,
  role,
  isPeerOnline,
  onBack,
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

      // const displayMessage = trimmed || "[Image]";
      // socket.emit(SOCKET_EVENTS.SEND_MESSAGE, {
      //   receiverId: peerId,
      //   text: displayMessage,
      // });
      // socket.emit(SOCKET_EVENTS.UPDATE_LAST_MESSAGE, {
      //   receiverId: peerId,
      //   lastMessage: displayMessage,
      //   lastMessageId: conversation._id,
      // });
    } catch (error) {
      setFormError(
        getErrorMessage(error, "Could not send message. Please try again."),
      );
    }
  };

  return (
    <div className="flex h-full min-h-[60vh] flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to conversations"
            className="md:hidden -ml-2 min-h-11 min-w-11 flex items-center justify-center text-muted-foreground cursor-pointer"
          >
            <AiOutlineArrowLeft size={20} />
          </button>
        )}
        <div className="relative w-9 h-9 rounded-full overflow-hidden bg-muted shrink-0">
          {peer?.avatar ? (
            <Image
              src={peer.avatar}
              alt={peer.name || "User"}
              fill
              className="object-cover"
            />
          ) : null}
        </div>
        <p className="font-medium text-sm text-foreground">
          {peer?.name || "Unknown"}
        </p>
        <p className="text-xs text-muted-foreground">
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
              className="text-xs text-primary hover:underline disabled:opacity-60 cursor-pointer"
            >
              {isLoadingOlder ? "Loading..." : "Load earlier messages"}
            </button>
          </div>
        )}
        {isLoading ? (
          <ProductGridSkeleton count={12} />
        ) : isError ? (
          <p className="text-sm text-error">Could not load messages.</p>
        ) : messages.length === 0 ? (
          <EmptyState
            icon={<AiOutlineMessage size={26} />}
            title=" Say hello to start the conversation."
          />
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
                      ? "bg-primary text-white"
                      : "bg-muted text-foreground"
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
                      <span className="block text-[10px] text-primary-foreground/70 mt-0.5">
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
        <p className="px-4 pb-2 text-sm text-error">{formError}</p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col border-t border-border">
        {image && (
          <div className="px-4 py-2 bg-muted flex items-center gap-3 border-b border-border">
            <div className="relative w-12 h-12 rounded-md overflow-hidden border border-border shrink-0">
              <Image src={image} alt="Preview" fill className="object-cover" />
            </div>
            <div className="flex-1 text-xs text-muted-foreground truncate">
              Image attached
            </div>
            <button
              type="button"
              onClick={() => {
                setImage(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-xs text-error hover:opacity-80 font-medium cursor-pointer"
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
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-surface-hover cursor-pointer shrink-0"
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
            className="flex-1 border border-border bg-surface text-foreground placeholder-muted-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-focus-ring focus:border-primary"
          />
          <button
            type="submit"
            disabled={isSending || (!text.trim() && !image)}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary-hover transition-colors disabled:opacity-60 cursor-pointer shrink-0"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
