"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axios";
import { ConfirmModal } from "@/components/shared/ConfirmModal";

interface UserInfo {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
}

interface MessageItem {
  _id: string;
  sender: UserInfo;
  recipient: UserInfo;
  content: string;
  isRead: boolean;
  isEdited?: boolean;
  createdAt: string;
  isSending?: boolean;
  isFailed?: boolean;
}

interface ChatThread {
  user: UserInfo;
  lastMessage: MessageItem;
  unreadCount: number;
}

function MessagesPageContent() {
  const { userData } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [isDeleteMessageConfirmOpen, setIsDeleteMessageConfirmOpen] = useState(false);
  
  const chatWithParam = searchParams.get("chatWith") || "";

  // States
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeUser, setActiveUser] = useState<UserInfo | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [typedMessage, setTypedMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [currentTime, setCurrentTime] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);



  // Scroll to bottom helper
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Fetch threads (conversations list)
  const fetchThreads = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/api/messages");
      if (res.data?.threads) {
        setThreads(res.data.threads);
      }
    } catch (err) {
      console.error("Error loading chat threads:", err);
    } finally {
      setIsLoadingThreads(false);
    }
  }, []);

  // Fetch history for active conversation
  const fetchMessages = useCallback(async (targetId: string, showLoading = false) => {
    if (!targetId) return;
    try {
      if (showLoading) {
        setTimeout(() => setIsLoadingMessages(true), 0);
      }
      const res = await axiosInstance.get(`/api/messages?chatWith=${targetId}`);
      if (res.data?.messages) {
        setMessages(res.data.messages);
        
        // Refresh threads list in background to clear unread counts immediately
        const threadsRes = await axiosInstance.get("/api/messages");
        if (threadsRes.data?.threads) {
          setThreads(threadsRes.data.threads);
        }
      }
    } catch (err) {
      console.error("Error loading messages history:", err);
    } finally {
      if (showLoading) {
        setTimeout(() => setIsLoadingMessages(false), 0);
      }
    }
  }, []);

  // Initial mount load
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchThreads();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchThreads]);

  // Keep a ref of active user ID to prevent stale closures in polling interval
  const activeUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeUserIdRef.current = activeUser?._id || null;
  }, [activeUser?._id]);

  // Synchronize URL query parameter with activeUser state
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (chatWithParam) {
      if (!activeUser || activeUser._id !== chatWithParam) {
        const found = threads.find(t => t.user._id === chatWithParam);
        if (found) {
          timer = setTimeout(() => {
            setActiveUser(prev => prev?._id === found.user._id ? prev : found.user);
          }, 0);
        } else if (!isLoadingThreads) {
          // Fetch target user details directly from profile API only when threads are loaded
          axiosInstance.get("/api/profile?all=true")
            .then(res => {
              if (res.data?.users) {
                const target = res.data.users.find((u: UserInfo) => u._id === chatWithParam);
                if (target) {
                  setActiveUser(prev => prev?._id === target._id ? prev : {
                    _id: target._id,
                    name: target.name,
                    username: target.username,
                    avatar: target.avatar
                  });
                }
              }
            })
            .catch(err => console.error("Error syncing active user from profile:", err));
        }
      }
    } else {
      if (activeUser !== null) {
        timer = setTimeout(() => {
          setActiveUser(null);
        }, 0);
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [chatWithParam, threads, isLoadingThreads, activeUser]);

  // Fetch messages when active user changes
  useEffect(() => {
    const targetId = activeUser?._id;
    if (targetId) {
      const timer = setTimeout(() => {
        fetchMessages(targetId, true);
      }, 0);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setMessages([]);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activeUser?._id, fetchMessages]);

  // Auto-scroll on new messages (avoid scrolling if the last message is identical)
  const lastMessageIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg._id !== lastMessageIdRef.current) {
        lastMessageIdRef.current = lastMsg._id;
        scrollToBottom();
      }
    } else {
      lastMessageIdRef.current = null;
    }
  }, [messages]);

  // Set current time on client mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentTime(Date.now());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // 3-second polling loop for messages and threads updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
      const currentActiveId = activeUserIdRef.current;
      if (currentActiveId) {
        fetchMessages(currentActiveId, false);
      }
      // Update thread list in background
      axiosInstance.get("/api/messages").then((res) => {
        if (res.data?.threads) {
          setThreads(res.data.threads);
        }
      }).catch(err => console.error(err));
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser || !typedMessage.trim() || isSending) return;

    const content = typedMessage.trim();
    setTypedMessage("");

    // Create optimistic temporary message
    const tempId = `temp-${Date.now()}`;
    const tempMessage: MessageItem = {
      _id: tempId,
      sender: {
        _id: userData?.id || "",
        name: userData?.name || "",
        username: "",
        avatar: userData?.avatar,
      },
      recipient: {
        _id: activeUser._id,
        name: activeUser.name,
        username: activeUser.username,
        avatar: activeUser.avatar,
      },
      content: content,
      isRead: false,
      createdAt: new Date().toISOString(),
      isSending: true,
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      setIsSending(true);
      const res = await axiosInstance.post("/api/messages", {
        recipientId: activeUser._id,
        content: content
      });

      if (res.data?.success && res.data?.message) {
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? res.data.message : m))
        );
        
        // Update threads locally
        fetchThreads();
      }
    } catch (err) {
      console.error("Error sending message:", err);
      // Mark temporary message as failed (single tick failed)
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? { ...m, isSending: false, isFailed: true } : m))
      );
    } finally {
      setIsSending(false);
    }
  };

  // Mark all messages as read
  const handleMarkAllRead = async () => {
    try {
      await axiosInstance.put("/api/messages");
      fetchThreads();
      if (activeUser) {
        fetchMessages(activeUser._id, false);
      }
    } catch (err) {
      console.error("Error marking all messages as read:", err);
    }
  };

  // Edit direct message
  const handleEditMessage = async (messageId: string) => {
    if (!editingContent.trim()) return;
    try {
      const res = await axiosInstance.put(`/api/messages/${messageId}`, {
        content: editingContent.trim()
      });
      if (res.data?.success && res.data?.message) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? res.data.message : m))
        );
        setEditingMessageId(null);
        setEditingContent("");
      }
    } catch (err) {
      console.error("Error editing message:", err);
    }
  };

  // Delete direct message
  const handleDeleteMessage = (messageId: string) => {
    setMessageToDelete(messageId);
    setIsDeleteMessageConfirmOpen(true);
  };

  const executeDeleteMessage = async () => {
    if (!messageToDelete) return;
    try {
      const res = await axiosInstance.delete(`/api/messages/${messageToDelete}`);
      if (res.data?.success) {
        setMessages((prev) => prev.filter((m) => m._id !== messageToDelete));
      }
    } catch (err) {
      console.error("Error deleting message:", err);
    } finally {
      setMessageToDelete(null);
      setIsDeleteMessageConfirmOpen(false);
    }
  };

  // Filter threads by search query
  const filteredThreads = threads.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      t.user.name.toLowerCase().includes(q) ||
      t.user.username.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-(--background) font-sans text-(--foreground) transition-all duration-300 min-h-0">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 flex flex-col min-h-0 h-full overflow-hidden">
        
        {/* Main Interface Layout grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 rounded-3xl border border-(--card-border) bg-(--card-background)/40 backdrop-blur-xs shadow-xl overflow-hidden flex-1 min-h-0 h-full">
          
          {/* LEFT SIDEBAR: Conversations List (5 columns) */}
          <aside className={`md:col-span-4 border-r border-(--divider-color) flex flex-col h-full bg-(--card-background)/20 min-h-0 overflow-hidden ${activeUser ? "hidden md:flex" : "flex"}`}>
            {/* Sidebar search box */}
            <div className="p-4 border-b border-(--divider-color) space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-(--foreground) tracking-tight">Direct Chats</h2>
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-bold text-orange hover:underline cursor-pointer"
                  title="Mark all as read"
                >
                  Mark all read
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search developers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-(--input-border) bg-(--input-bg) py-2 pl-9 pr-4 text-xs font-semibold text-(--foreground) placeholder-dust-grey focus:border-orange focus:outline-hidden"
                />
                <svg className="absolute left-3 top-2.5 h-4 w-4 text-dust-grey" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
            </div>

            {/* List area */}
            <div className="flex-1 overflow-y-auto divide-y divide-(--divider-color)/30">
              {isLoadingThreads ? (
                <div className="p-6 text-center text-xs text-dust-grey font-mono animate-pulse">
                  Loading chats...
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="p-6 text-center text-xs text-dust-grey italic">
                  No active conversations.
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const isActive = activeUser?._id === thread.user._id;
                  const formattedDate = new Date(thread.lastMessage.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric"
                  });

                  return (
                    <div
                      key={thread.user._id}
                      onClick={() => {
                        setActiveUser(thread.user);
                        router.push(`/messages?chatWith=${thread.user._id}`);
                      }}
                      className={`flex items-start gap-3 p-4 transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "bg-spicy-paprika/10 text-spicy-paprika border-l-4 border-spicy-paprika"
                          : "hover:bg-(--btn-icon-hover-bg) text-(--text-secondary) hover:text-(--foreground)"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-(--profile-avatar-bg) border border-(--profile-border) flex items-center justify-center overflow-hidden shrink-0">
                        {thread.user.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thread.user.avatar}
                            alt={thread.user.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://avatar.iran.liara.run/public/boy?username=${thread.user.username}`;
                            }}
                          />
                        ) : (
                          <span className="text-xs font-extrabold text-(--profile-avatar-text)">
                            {thread.user.name.substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Info snippet */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold truncate pr-1 text-(--foreground)">{thread.user.name}</span>
                          <span className="text-[10px] text-dust-grey shrink-0">{formattedDate}</span>
                        </div>
                        <p className="text-xs text-dust-grey truncate pr-4">
                          {thread.lastMessage.sender._id === userData?.id ? "You: " : ""}
                          {thread.lastMessage.content}
                        </p>
                      </div>

                      {/* Unread dot */}
                      {thread.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-spicy-paprika text-floral-white flex items-center justify-center text-[9px] font-black font-mono shrink-0">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* RIGHT VIEW: Conversational Bubble log (8 columns) */}
          <main className={`md:col-span-8 flex flex-col h-full bg-(--card-background)/10 min-h-0 overflow-hidden ${!activeUser ? "hidden md:flex" : "flex"}`}>
            {activeUser ? (
              <>
                {/* Active Chat Header */}
                <div className="p-4 border-b border-(--divider-color) flex items-center justify-between bg-(--card-background)/20">
                  <div className="flex items-center gap-3">
                    {/* Back Arrow for Mobile View */}
                    <button
                      onClick={() => {
                        setActiveUser(null);
                        router.push("/messages");
                      }}
                      className="md:hidden p-1.5 hover:bg-(--btn-icon-hover-bg) rounded-full cursor-pointer text-dust-grey"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-(--profile-avatar-bg) border border-(--profile-border) flex items-center justify-center overflow-hidden shrink-0">
                      {activeUser.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={activeUser.avatar}
                          alt={activeUser.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://avatar.iran.liara.run/public/boy?username=${activeUser.username}`;
                          }}
                        />
                      ) : (
                        <span className="text-xs font-extrabold text-(--profile-avatar-text)">
                          {activeUser.name.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-black text-(--foreground) truncate">{activeUser.name}</span>
                      <span className="text-xs text-dust-grey font-semibold font-mono truncate">@{activeUser.username}</span>
                    </div>
                  </div>

                  {/* View profile link */}
                  <Link
                    href={`/profile?username=${activeUser.username}`}
                    className="text-xs font-bold text-orange hover:underline px-3 py-1.5 rounded-lg hover:bg-orange/5"
                  >
                    View Profile
                  </Link>
                </div>

                {/* Bubbles Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                  {isLoadingMessages ? (
                    <div className="text-center py-20 text-xs text-dust-grey font-mono animate-pulse">
                      Brewing message log...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-20 text-xs text-dust-grey italic">
                      This is the beginning of your conversation with {activeUser.name}. Say hello!
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isMe = msg.sender._id === userData?.id;
                      const formattedTime = new Date(msg.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit"
                      });
                      const isEditing = editingMessageId === msg._id;
                      const isEditable = currentTime > 0
                        ? (currentTime - new Date(msg.createdAt).getTime() < 2 * 60 * 60 * 1000)
                        : false;

                      return (
                        <div key={`${msg._id || index}-${index}`} className={`flex ${isMe ? "justify-end" : "justify-start"} group`}>
                          <div className={`flex items-center gap-2 max-w-[85%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                            {isEditing ? (
                              <div className="bg-(--card-background) border border-(--card-border) p-3 rounded-2xl flex flex-col gap-2 min-w-[280px]">
                                <textarea
                                  value={editingContent}
                                  onChange={(e) => setEditingContent(e.target.value)}
                                  className="w-full text-xs font-semibold p-2 bg-(--input-bg) border border-(--input-border) rounded-xl text-(--foreground) focus:border-orange focus:outline-hidden"
                                  rows={2}
                                />
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setEditingMessageId(null);
                                      setEditingContent("");
                                    }}
                                    className="px-2.5 py-1 text-[10px] font-bold text-dust-grey hover:underline cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleEditMessage(msg._id)}
                                    className="px-3 py-1 bg-orange text-ink-black text-[10px] font-bold rounded-lg cursor-pointer hover:bg-orange-600 transition-all"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className={`relative rounded-2xl p-3 px-4 shadow-sm border ${
                                isMe
                                  ? "bg-spicy-paprika border-spicy-paprika/30 text-floral-white rounded-br-none"
                                  : "bg-(--card-background) border-(--card-border) text-(--foreground) rounded-bl-none"
                              }`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                 <div className="flex items-center justify-end gap-1 mt-1 text-[9px] font-semibold">
                                  {msg.isEdited && (
                                    <span className={isMe ? "text-floral-white/50 italic" : "text-dust-grey/60 italic"}>
                                      edited •
                                    </span>
                                  )}
                                  <span className={isMe ? "text-floral-white/70" : "text-dust-grey"}>
                                    {formattedTime}
                                  </span>
                                  {isMe && (
                                    msg.isSending || msg.isFailed ? (
                                      <svg className="w-3 h-3 text-floral-white/40 inline-block align-middle ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                        <title>Not Sent</title>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                      </svg>
                                    ) : msg.isRead ? (
                                      <svg className="w-3.5 h-3.5 text-sky-400 inline-block align-middle ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <title>Read</title>
                                        <path d="M2 12L7 17L17 7" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M8 12L12 16L22 6" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    ) : (
                                      <svg className="w-3.5 h-3.5 text-floral-white/55 inline-block align-middle ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <title>Sent (Unread)</title>
                                        <path d="M2 12L7 17L17 7" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M8 12L12 16L22 6" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Toolbar actions on hover */}
                            {isMe && !isEditing && (
                              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-(--card-background) border border-(--card-border) p-1 rounded-xl shadow-xs shrink-0 self-center">
                                {isEditable && (
                                  <button
                                    onClick={() => {
                                      setEditingMessageId(msg._id);
                                      setEditingContent(msg.content);
                                    }}
                                    className="p-1 hover:bg-(--btn-icon-hover-bg) text-dust-grey hover:text-orange rounded-md cursor-pointer transition-colors"
                                    title="Edit Message"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                    </svg>
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteMessage(msg._id)}
                                  className="p-1 hover:bg-red-500/10 text-dust-grey hover:text-red-400 rounded-md cursor-pointer transition-colors"
                                  title="Delete Message"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Send Message Input form */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-(--divider-color) bg-(--card-background)/20 flex items-center gap-3">
                  <input
                    type="text"
                    placeholder={`Write your message to ${activeUser.name}...`}
                    value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value)}
                    disabled={isSending}
                    className="flex-1 rounded-xl border border-(--input-border) bg-(--input-bg) py-3 px-4 text-xs font-semibold text-(--foreground) placeholder-dust-grey focus:border-orange focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={!typedMessage.trim() || isSending}
                    className="rounded-xl bg-orange hover:bg-orange-600 disabled:bg-orange/50 px-5 py-3 text-xs font-bold text-ink-black shadow-md shadow-orange/15 cursor-pointer transition-all active:scale-95 shrink-0 flex items-center gap-1.5"
                  >
                    <span>Send</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-dust-grey">
                <div className="p-4 bg-orange/5 text-orange rounded-full border border-orange/10 mb-4">
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 18.97a5.969 5.969 0 01-.75-3.033C4.162 14.68 3 13.446 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-(--foreground)">Your Inbox</h3>
                <p className="text-xs max-w-sm mt-2 leading-relaxed">
                  Select a developer from your conversations list, or explore public developer profiles to start a new charcha conversation!
                </p>
              </div>
            )}
          </main>

        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteMessageConfirmOpen}
        title="Delete Message"
        message="Are you sure you want to delete this message?"
        onConfirm={executeDeleteMessage}
        onCancel={() => {
          setIsDeleteMessageConfirmOpen(false);
          setMessageToDelete(null);
        }}
      />
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col flex-1 bg-(--background) items-center justify-center py-20 text-dust-grey gap-3">
        <svg className="animate-spin h-8 w-8 text-spicy-paprika" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs font-mono tracking-wider animate-pulse">Brewing messages page...</span>
      </div>
    }>
      <MessagesPageContent />
    </Suspense>
  );
}
