"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axios";

interface NotificationItem {
  _id: string;
  recipient: string;
  sender: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
    role?: string;
    karma?: number;
  };
  type: "follow" | "message" | "post" | "comment" | "warning" | string;
  link: string;
  isRead: boolean;
  message?: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user: isLoggedIn } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get("/api/notifications");
      if (res.data?.notifications) {
        setNotifications(res.data.notifications);
      }
    } catch (err: unknown) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotifications();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string, link?: string) => {
    try {
      await axiosInstance.put("/api/notifications", { notificationId: id });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      if (link) {
        router.push(link);
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axiosInstance.put("/api/notifications", { markAllAsRead: true });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const formatNotificationText = (item: NotificationItem) => {
    const nameStr = item.sender?.name || "Someone";
    switch (item.type) {
      case "follow":
        return (
          <>
            <span className="font-extrabold text-(--foreground) hover:underline">
              {nameStr}
            </span>{" "}
            started following you.
          </>
        );
      case "message":
        return (
          <>
            <span className="font-extrabold text-(--foreground) hover:underline">
              {nameStr}
            </span>{" "}
            sent you a private message.
          </>
        );
      case "warning":
        return (
          <>
            <span className="font-extrabold text-red-500 mr-1.5 uppercase tracking-wide">
              [Warning]
            </span>
            <span className="font-medium text-floral-white/90">
              {item.message || "You received a moderation warning regarding community guidelines."}
            </span>
          </>
        );
      default:
        return (
          <>
            <span className="font-extrabold text-(--foreground) hover:underline">
              {nameStr}
            </span>{" "}
            interacted with your profile or activity.
          </>
        );
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "follow":
        return (
          <div className="p-2 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
          </div>
        );
      case "message":
        return (
          <div className="p-2 bg-orange/10 text-orange rounded-full border border-orange/20 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379L12 21l3.12-3.134c1.153-.086 2.294-.213 3.423-.379 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </div>
        );
      case "warning":
        return (
          <div className="p-2 bg-red-500/10 text-red-500 rounded-full border border-red-500/20 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-2 bg-spicy-paprika/10 text-spicy-paprika rounded-full border border-spicy-paprika/20 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>
        );
    }
  };

  const getUnreadCount = () => {
    return notifications.filter((n) => !n.isRead).length;
  };

  return (
    <div className="min-h-screen bg-(--nav-bg) text-(--foreground) transition-all duration-300">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Header Block */}
        <div className="mb-8 border-b border-(--divider-color) pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-(--foreground) flex items-center gap-3">
              <span>Charcha Notifications</span>
              {getUnreadCount() > 0 && (
                <span className="text-floral-white bg-spicy-paprika px-3 py-0.5 rounded-full text-xs font-bold font-mono">
                  {getUnreadCount()} New
                </span>
              )}
            </h1>
            <p className="text-xs text-dust-grey mt-1.5 font-medium">
              Keep track of replies, follows, and direct messages in real time.
            </p>
          </div>

          {getUnreadCount() > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 px-4 py-2 bg-linear-to-r from-orange/10 to-spicy-paprika/10 hover:from-orange/20 hover:to-spicy-paprika/20 border border-orange/20 hover:border-orange/40 rounded-xl text-xs font-bold text-orange hover:text-orange-600 transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap self-start sm:self-center"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        {/* Content Box */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-(--card-border) bg-(--card-background)/40 backdrop-blur-xs p-5 shadow-sm animate-pulse flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-(--profile-bg) shrink-0"></div>
                <div className="flex-1 space-y-2 mt-1">
                  <div className="h-4 bg-(--profile-bg) rounded-md w-3/4"></div>
                  <div className="h-3 bg-(--profile-bg) rounded-md w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center p-8 rounded-2xl border border-red-500/20 bg-red-950/20 text-red-200">
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-(--card-border) bg-(--card-background)/30 flex flex-col items-center justify-center p-6">
            <div className="text-orange mb-3 bg-orange/5 p-4 rounded-full border border-orange/10">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-(--foreground)">Clean desk!</h3>
            <p className="text-xs text-dust-grey mt-1.5 max-w-sm">
              You do not have any notifications at the moment. We will brew them when you get follow requests or direct messages.
            </p>
            <Link
              href="/"
              className="mt-6 rounded-full bg-orange hover:bg-orange-600 px-6 py-2.5 text-xs font-bold text-ink-black shadow-lg shadow-orange/10 transition-all cursor-pointer"
            >
              Explore Discussions
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <div
                key={item._id}
                onClick={() => handleMarkAsRead(item._id, item.link)}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  item.isRead
                    ? "border-(--card-border) bg-(--card-background)/20 hover:bg-(--card-background)/40"
                    : "border-orange/20 bg-orange/5 shadow-md shadow-orange/5 hover:bg-orange/10"
                }`}
              >
                {/* Visual Icon */}
                {getNotificationIcon(item.type)}

                {/* Sender Avatar */}
                <div className="w-10 h-10 rounded-full bg-(--profile-avatar-bg) border border-(--profile-border) flex items-center justify-center overflow-hidden shrink-0">
                  {item.sender?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.sender.avatar}
                      alt={item.sender.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://avatar.iran.liara.run/public/boy?username=${item.sender.username}`;
                      }}
                    />
                  ) : (
                    <span className="text-xs font-extrabold text-(--profile-avatar-text)">
                      {item.sender?.name?.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Text Context */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-(--text-secondary) leading-snug">
                    {formatNotificationText(item)}
                  </p>
                  
                  {/* Metadata line */}
                  <div className="flex items-center gap-2 mt-1.5 text-2xs text-dust-grey">
                    <span>@{item.sender?.username}</span>
                    <span>•</span>
                    <span>
                      {new Date(item.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {!item.isRead && (
                      <>
                        <span>•</span>
                        <span className="text-orange font-bold font-mono animate-pulse">
                          UNREAD
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Go To Arrow */}
                <div className="self-center text-dust-grey/40 hover:text-(--foreground) transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
