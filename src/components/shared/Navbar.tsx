"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SearchBar } from "@/components/search/SearchBar";
import axiosInstance from "@/lib/axios";

const Navbar = () => {
  const pathname = usePathname();
  const { user, userData, handelSignOut, setIsCreatePostOpen } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [avatarError, setAvatarError] = useState(false);
  const [prevAvatar, setPrevAvatar] = useState<string | undefined>(userData?.avatar);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  if (userData?.avatar !== prevAvatar) {
    setPrevAvatar(userData?.avatar);
    setAvatarError(false);
  }

  const dropdownRef = useRef<HTMLDivElement>(null);



  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuOpen]);

  // Poll notifications count
  useEffect(() => {
    if (!user) {
      if (unreadCount !== 0) {
        const timer = setTimeout(() => {
          setUnreadCount(0);
        }, 0);
        return () => clearTimeout(timer);
      }
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const res = await axiosInstance.get("/api/notifications");
        if (res.data?.notifications) {
          const count = res.data.notifications.filter((n: { isRead: boolean }) => !n.isRead).length;
          setUnreadCount(count);
        }
      } catch (err) {
        console.error("Error fetching unread notifications in navbar:", err);
      }
    };

    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 6000); // Poll every 6 seconds
    return () => clearInterval(interval);
  }, [user, unreadCount]);

  return (
    <nav className="sticky top-0 z-50 w-full bg-(--nav-bg) border-b border-(--nav-border) text-(--foreground) shadow-lg backdrop-blur-md transition-all duration-300">
      <Suspense fallback={null}>
        <NavigationWatcher onClose={() => setMobileMenuOpen(false)} />
      </Suspense>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          
          {/* Left Side: Logo and Title */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative w-12 h-12 transition-transform duration-300 group-hover:scale-110">
                <Image 
                  src="/chai.svg" 
                  alt="Chai Charcha Logo" 
                  fill
                  className="object-contain" 
                  priority 
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-(--foreground) group-hover:text-vivid-tangerine transition-colors duration-300 sm:text-2xl">
                  Chai <span className="text-spicy-paprika">Charcha</span>
                </span>
                <span className="hidden sm:inline text-[9px] font-mono tracking-widest text-(--nav-subtitle) uppercase">
                  Charcha Forum
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Search Bar (Hidden on Mobile) */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <SearchBar />
          </div>

          {/* Right Side: Action Zone (Desktop) */}
          <div className="hidden md:flex items-center gap-4">

            {/* Explore Communities Shortcut */}
            <Link 
              href="/communities"
              className="relative rounded-full p-2.5 text-(--btn-icon-text) hover:bg-(--btn-icon-hover-bg) hover:text-(--btn-icon-hover-text) transition-all duration-200 cursor-pointer"
              aria-label="Explore Communities"
              title="Explore Communities"
            >
              <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </Link>

            {user && userData ? (
              <div className="flex items-center gap-4">
                {/* Create Post Button */}
                <button 
                  onClick={() => setIsCreatePostOpen(true)}
                  className="flex items-center gap-1.5 rounded-full bg-spicy-paprika px-4 py-2 text-sm font-semibold text-floral-white shadow-lg shadow-spicy-paprika/20 transition-all duration-200 hover:bg-spicy-paprika-600 hover:shadow-spicy-paprika/30 active:scale-95 cursor-pointer"
                >
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span>New Post</span>
                </button>

                {/* Messages Shortcut Button */}
                <Link 
                  href="/messages"
                  className="relative rounded-full p-2.5 text-(--btn-icon-text) hover:bg-(--btn-icon-hover-bg) hover:text-(--btn-icon-hover-text) transition-all duration-200 cursor-pointer"
                  aria-label="Direct Messages"
                >
                  <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379L12 21l3.12-3.134c1.153-.086 2.294-.213 3.423-.379 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                </Link>

                {/* Notifications Button */}
                {unreadCount > 0 && (
                  <Link 
                    href="/notifications"
                    className="relative rounded-full p-2.5 text-(--btn-icon-text) hover:bg-(--btn-icon-hover-bg) hover:text-(--btn-icon-hover-text) transition-all duration-200 cursor-pointer"
                  >
                    <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-vivid-tangerine opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-vivid-tangerine"></span>
                    </span>
                  </Link>
                )}

                {/* User Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-2 rounded-full border border-(--profile-border) bg-(--profile-bg) p-1.5 pr-3 transition-all duration-200 hover:border-(--profile-hover-border) hover:bg-(--profile-hover-bg) cursor-pointer"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-(--profile-avatar-bg) text-xs font-bold text-(--profile-avatar-text) shadow-sm overflow-hidden">
                      {userData?.avatar && (userData.avatar.startsWith("http") || userData.avatar.startsWith("/")) && !avatarError ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={userData.avatar} 
                          alt={userData.name} 
                          className="h-full w-full object-cover" 
                          onError={() => setAvatarError(true)} 
                        />
                      ) : (
                        userData?.name ? userData.name.substring(0, 2).toUpperCase() : "JD"
                      )}
                    </div>
                    <span className="text-xs font-semibold text-(--text-role)">{userData?.name || "Developer"}</span>
                    <svg className={`h-3 w-3 text-(--btn-icon-text) transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {/* Profile Dropdown Menu */}
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-(--dropdown-border) bg-(--dropdown-bg) p-1 shadow-2xl backdrop-blur-lg">
                      <Link href="/" onClick={() => setProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-(--text-secondary) rounded-lg hover:bg-(--btn-icon-hover-bg) hover:text-(--btn-icon-hover-text) transition-colors">Home</Link>
                      <Link href="/profile" onClick={() => setProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-(--text-secondary) rounded-lg hover:bg-(--btn-icon-hover-bg) hover:text-(--btn-icon-hover-text) transition-colors">
                        My Profile
                      </Link>
                      <Link href="/followers" onClick={() => setProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-(--text-secondary) rounded-lg hover:bg-(--btn-icon-hover-bg) hover:text-(--btn-icon-hover-text) transition-colors">
                        My Connections
                      </Link>
                      <Link href="/messages" onClick={() => setProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-(--text-secondary) rounded-lg hover:bg-(--btn-icon-hover-bg) hover:text-(--btn-icon-hover-text) transition-colors">
                        My Messages
                      </Link>
                      <Link href="/notifications" onClick={() => setProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-(--text-secondary) rounded-lg hover:bg-(--btn-icon-hover-bg) hover:text-(--btn-icon-hover-text) transition-colors">
                        My Notifications
                      </Link>
                      <Link href="/post" onClick={() => setProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-(--text-secondary) rounded-lg hover:bg-(--btn-icon-hover-bg) hover:text-(--btn-icon-hover-text) transition-colors">
                        My Posts
                      </Link>
                      {userData?.role === "admin" && (
                        <Link href="/admin" onClick={() => setProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-orange hover:text-orange-600 rounded-lg hover:bg-(--btn-icon-hover-bg) transition-colors font-extrabold uppercase tracking-wider">
                          Admin Panel
                        </Link>
                      )}
                      <Link href="/settings" onClick={() => setProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-(--text-secondary) rounded-lg hover:bg-(--btn-icon-hover-bg) hover:text-(--btn-icon-hover-text) transition-colors">
                        Settings
                      </Link>
                      <button 
                        onClick={() => { handelSignOut(); setProfileMenuOpen(false); }}
                        className="w-full text-left block px-4 py-2 text-sm text-spicy-paprika hover:bg-(--btn-icon-hover-bg) rounded-lg transition-colors cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  href="/auth/signin"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-(--foreground) transition-all duration-200 hover:text-(--btn-icon-hover-text) hover:bg-(--btn-secondary-hover-bg)"
                >
                  Log In
                </Link>
                <Link 
                  href="/auth/signup"
                  className="rounded-full bg-orange px-5 py-2 text-sm font-bold text-ink-black shadow-lg shadow-orange/10 transition-all duration-200 hover:bg-orange-600 hover:shadow-orange/20 active:scale-95"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Hamburger Menu Toggle (Mobile) */}
          <div className="flex md:hidden items-center gap-3">
            


            {/* Pulsing notification dot even when menu is closed on mobile */}
            {user && unreadCount > 0 && (
              <span className="relative flex h-2.5 w-2.5 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-vivid-tangerine opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-vivid-tangerine"></span>
              </span>
            )}
            
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2.5 text-(--btn-icon-text) hover:bg-(--btn-icon-hover-bg) hover:text-(--btn-icon-hover-text) transition-colors duration-200 focus:outline-none cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Overlay / Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full max-h-[calc(100vh-5rem)] overflow-y-auto overscroll-contain border-t border-(--nav-border) bg-(--nav-bg) backdrop-blur-xl px-4 py-6 shadow-2xl transition-all duration-300">
          <div className="flex flex-col gap-5">
            
            {/* Mobile Search Bar */}
            <div className="w-full">
              <SearchBar />
            </div>

            {/* Mobile Actions Zone */}
            {user && userData ? (
              <div className="flex flex-col gap-4 pt-2">
                <div className="flex items-center gap-3 px-2 py-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-(--profile-avatar-bg) font-bold text-(--profile-avatar-text) text-sm overflow-hidden">
                    {userData?.avatar && (userData.avatar.startsWith("http") || userData.avatar.startsWith("/")) && !avatarError ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={userData.avatar} 
                        alt={userData.name} 
                        className="h-full w-full object-cover" 
                        onError={() => setAvatarError(true)} 
                      />
                    ) : (
                      userData?.name ? userData.name.substring(0, 2).toUpperCase() : "JD"
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-(--foreground) truncate">{userData?.name}</span>
                    <span className="text-xs text-(--text-secondary) truncate" title={userData?.email}>{userData?.email}</span>
                  </div>
                </div>

                <hr className="border-(--divider-color)" />

                <button 
                  onClick={() => { setIsCreatePostOpen(true); setMobileMenuOpen(false); }}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-spicy-paprika py-3 text-sm font-semibold text-floral-white shadow-md shadow-spicy-paprika/15 transition-all active:scale-95 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span>Create New Post</span>
                </button>



                <Link 
                  href="/" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center rounded-full border border-(--input-border) bg-(--input-bg) py-2.5 text-sm font-semibold text-(--text-secondary) hover:text-(--btn-icon-hover-text)"
                >
                  Home
                </Link>

                <Link 
                  href="/communities" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center rounded-full border border-(--input-border) bg-(--input-bg) py-2.5 text-sm font-semibold text-(--text-secondary) hover:text-(--btn-icon-hover-text)"
                >
                  Explore Communities
                </Link>

                <Link 
                  href="/notifications" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-(--input-border) bg-(--input-bg) py-2.5 text-sm font-semibold text-(--text-secondary) hover:text-(--btn-icon-hover-text)"
                >
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-spicy-paprika text-floral-white px-2 py-0.5 text-[10px] font-black font-mono">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                <Link 
                  href="/messages" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center rounded-full border border-(--input-border) bg-(--input-bg) py-2.5 text-sm font-semibold text-(--text-secondary) hover:text-(--btn-icon-hover-text)"
                >
                  Messages
                </Link>

                <Link 
                  href="/followers" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center rounded-full border border-(--input-border) bg-(--input-bg) py-2.5 text-sm font-semibold text-(--text-secondary) hover:text-(--btn-icon-hover-text)"
                >
                  My Connections
                </Link>

                <Link 
                  href="/profile" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center rounded-full border border-(--input-border) bg-(--input-bg) py-2.5 text-sm font-semibold text-(--text-secondary) hover:text-(--btn-icon-hover-text)"
                >
                  My Profile
                </Link>

                <Link 
                  href="/post" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center rounded-full border border-(--input-border) bg-(--input-bg) py-2.5 text-sm font-semibold text-(--text-secondary) hover:text-(--btn-icon-hover-text)"
                >
                  My Posts
                </Link>

                {userData?.role === "admin" && (
                  <Link 
                    href="/admin" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center rounded-full border border-orange/30 bg-orange/5 py-2.5 text-sm font-bold text-orange uppercase tracking-wider hover:text-orange-600"
                  >
                    Admin Panel
                  </Link>
                )}

                <Link 
                  href="/settings" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center rounded-full border border-(--input-border) bg-(--input-bg) py-2.5 text-sm font-semibold text-(--text-secondary) hover:text-(--btn-icon-hover-text)"
                >
                  Settings
                </Link>

                <button 
                   onClick={() => { handelSignOut(); setMobileMenuOpen(false); }}
                  className="flex w-full items-center justify-center rounded-full border border-spicy-paprika/20 bg-spicy-paprika/5 py-2.5 text-sm font-semibold text-spicy-paprika cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pt-2">
                <Link 
                  href="/communities"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-full border border-(--input-border) bg-(--input-bg) py-3 text-sm font-semibold text-(--foreground) transition-all hover:bg-(--btn-secondary-hover-bg) active:scale-95 animate-fade-in"
                >
                  Explore Communities
                </Link>
                <Link 
                  href="/auth/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-full border border-(--input-border) bg-(--input-bg) py-3 text-sm font-semibold text-(--foreground) transition-all hover:bg-(--btn-secondary-hover-bg) active:scale-95"
                >
                  Log In
                </Link>
                <Link 
                  href="/auth/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-full bg-orange py-3 text-sm font-bold text-ink-black shadow-lg shadow-orange/10 transition-all hover:bg-orange-600 active:scale-95"
                >
                  Sign Up
                </Link>
              </div>
            )}

          </div>
        </div>
      )}
    </nav>
  );
};

const NavigationWatcher = ({ onClose }: { onClose: () => void }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    onCloseRef.current();
  }, [pathname, searchParams]);

  return null;
};

export default Navbar;
