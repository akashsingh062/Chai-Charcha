"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
  const { user, userData, handelSignOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  // Check is system theme is dark or light
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    const systemTheme = isDark ? "dark" : "light";
    
    // Update theme and mounted state asynchronously in the next tick to avoid cascading renders
    const timer = setTimeout(() => {
      setMounted(true);
      setTheme(systemTheme);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Toggle theme and store in local storage
  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains("dark");
    const newTheme = isDark ? "light" : "dark";
    
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    localStorage.setItem("theme", newTheme);
    setTheme(newTheme);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", searchQuery);
  };

  

  return (
    <nav className="sticky top-0 z-50 w-full bg-[var(--nav-bg)] border-b border-[var(--nav-border)] text-[var(--foreground)] shadow-lg backdrop-blur-md transition-all duration-300">
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
                <span className="text-xl font-bold tracking-tight text-[var(--foreground)] group-hover:text-vivid-tangerine transition-colors duration-300 sm:text-2xl">
                  Chai <span className="text-spicy-paprika">Charcha</span>
                </span>
                <span className="hidden sm:inline text-[9px] font-mono tracking-widest text-[var(--nav-subtitle)] uppercase">
                  Indian Developer Forum
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Search Bar (Hidden on Mobile) */}
          <form 
            onSubmit={handleSearchSubmit} 
            className="hidden md:flex flex-1 max-w-md mx-6"
          >
            <div className="relative w-full group">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg 
                  className="h-5 w-5 text-dust-grey group-focus-within:text-orange transition-colors duration-200" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search threads, tags, or developers..."
                className="block w-full rounded-full border border-[var(--input-border)] bg-[var(--input-bg)] py-2.5 pl-10 pr-4 text-sm text-[var(--foreground)] placeholder-dust-grey/70 outline-none transition-all duration-200 focus:border-[var(--input-focus-border)] focus:ring-2 focus:ring-[var(--input-focus-ring)] focus:bg-[var(--input-focus-bg)]"
              />
            </div>
          </form>

          {/* Right Side: Action Zone (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="rounded-full p-2.5 text-[var(--btn-icon-text)] hover:bg-[var(--btn-icon-hover-bg)] hover:text-[var(--btn-icon-hover-text)] transition-all duration-200 cursor-pointer"
              aria-label="Toggle Theme"
            >
              {!mounted ? (
                <div className="h-5.5 w-5.5" />
              ) : theme === "dark" ? (
                // Sun Icon
                <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.22 4.22l1.58 1.58m12.42 12.42l1.58 1.58M3 12h2.25m13.5 0H21M5.8 18.2l1.58-1.58m12.42-12.42l1.58-1.58M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
                </svg>
              ) : (
                // Moon Icon
                <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>

            {user && userData ? (
              <div className="flex items-center gap-4">
                {/* Create Post Button */}
                <button 
                  onClick={() => alert("Simulated: Create Post Clicked!")}
                  className="flex items-center gap-1.5 rounded-full bg-spicy-paprika px-4 py-2 text-sm font-semibold text-floral-white shadow-lg shadow-spicy-paprika/20 transition-all duration-200 hover:bg-spicy-paprika-600 hover:shadow-spicy-paprika/30 active:scale-95 cursor-pointer"
                >
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span>New Post</span>
                </button>

                {/* Notifications Button */}
                <button 
                  onClick={() => alert("Simulated: Notifications Clicked!")}
                  className="relative rounded-full p-2.5 text-[var(--btn-icon-text)] hover:bg-[var(--btn-icon-hover-bg)] hover:text-[var(--btn-icon-hover-text)] transition-all duration-200 cursor-pointer"
                >
                  <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-vivid-tangerine opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-vivid-tangerine"></span>
                  </span>
                </button>

                {/* User Profile Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-2 rounded-full border border-[var(--profile-border)] bg-[var(--profile-bg)] p-1.5 pr-3 transition-all duration-200 hover:border-[var(--profile-hover-border)] hover:bg-[var(--profile-hover-bg)] cursor-pointer"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--profile-avatar-bg)] text-xs font-bold text-[var(--profile-avatar-text)] shadow-sm overflow-hidden">
                      {userData?.avatar && (userData.avatar.startsWith("http") || userData.avatar.startsWith("/")) ? (
                        <img src={userData.avatar} alt={userData.name} className="h-full w-full object-cover" />
                      ) : (
                        userData?.avatar || "JD"
                      )}
                    </div>
                    <span className="text-xs font-semibold text-[var(--text-role)]">{userData?.name || "Developer"}</span>
                    <svg className={`h-3 w-3 text-[var(--btn-icon-text)] transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {/* Profile Dropdown Menu */}
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-[var(--dropdown-border)] bg-[var(--dropdown-bg)] p-1 shadow-2xl backdrop-blur-lg">
                      <div className="px-4 py-2 border-b border-[var(--divider-color)]">
                        <p className="text-xs text-dust-grey">Signed in as</p>
                        <p className="text-sm font-semibold truncate text-[var(--foreground)]">{userData?.email || "chai_lover@dev.in"}</p>
                      </div>
                      <Link href="#profile" className="block px-4 py-2 text-sm text-[var(--text-secondary)] rounded-lg hover:bg-[var(--btn-icon-hover-bg)] hover:text-[var(--btn-icon-hover-text)] transition-colors">Your Profile</Link>
                      <Link href="#settings" className="block px-4 py-2 text-sm text-[var(--text-secondary)] rounded-lg hover:bg-[var(--btn-icon-hover-bg)] hover:text-[var(--btn-icon-hover-text)] transition-colors">Settings</Link>
                      <button 
                        onClick={() => { handelSignOut(); setProfileMenuOpen(false); }}
                        className="w-full text-left block px-4 py-2 text-sm text-spicy-paprika hover:bg-[var(--btn-icon-hover-bg)] rounded-lg transition-colors cursor-pointer"
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
                  className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition-all duration-200 hover:text-[var(--btn-icon-hover-text)] hover:bg-[var(--btn-secondary-hover-bg)]"
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
            
            {/* Theme Toggle Button for Mobile */}
            <button 
              onClick={toggleTheme}
              className="rounded-full p-2.5 text-[var(--btn-icon-text)] hover:bg-[var(--btn-icon-hover-bg)] hover:text-[var(--btn-icon-hover-text)] transition-colors duration-200 cursor-pointer"
              aria-label="Toggle Theme"
            >
              {!mounted ? (
                <div className="h-6 w-6" />
              ) : theme === "dark" ? (
                // Sun Icon
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.22 4.22l1.58 1.58m12.42 12.42l1.58 1.58M3 12h2.25m13.5 0H21M5.8 18.2l1.58-1.58m12.42-12.42l1.58-1.58M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
                </svg>
              ) : (
                // Moon Icon
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>

            {/* Pulsing notification dot even when menu is closed on mobile */}
            {user && (
              <span className="relative flex h-2.5 w-2.5 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-vivid-tangerine opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-vivid-tangerine"></span>
              </span>
            )}
            
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2.5 text-[var(--btn-icon-text)] hover:bg-[var(--btn-icon-hover-bg)] hover:text-[var(--btn-icon-hover-text)] transition-colors duration-200 focus:outline-none cursor-pointer"
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
        <div className="md:hidden border-t border-[var(--nav-border)] bg-[var(--nav-bg)] backdrop-blur-xl px-4 py-6 shadow-2xl transition-all duration-300">
          <div className="flex flex-col gap-5">
            
            {/* Mobile Search Bar */}
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-dust-grey" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search threads, tags..."
                  className="block w-full rounded-full border border-[var(--input-border)] bg-[var(--input-bg)] py-2.5 pl-10 pr-4 text-sm text-[var(--foreground)] placeholder-dust-grey/70 outline-none focus:border-[var(--input-focus-border)] focus:bg-[var(--input-focus-bg)]"
                />
              </div>
            </form>

            {/* Mobile Actions Zone */}
            {user && userData ? (
              <div className="flex flex-col gap-4 pt-2">
                <div className="flex items-center gap-3 px-2 py-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--profile-avatar-bg)] font-bold text-[var(--profile-avatar-text)] text-sm overflow-hidden">
                    {userData?.avatar && (userData.avatar.startsWith("http") || userData.avatar.startsWith("/")) ? (
                      <img src={userData.avatar} alt={userData.name} className="h-full w-full object-cover" />
                    ) : (
                      userData?.avatar || userData.name.substring(0,2).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[var(--foreground)]">{userData?.name}</span>
                    <span className="text-xs text-[var(--text-secondary)]">{userData?.email}</span>
                  </div>
                </div>

                <hr className="border-[var(--divider-color)]" />

                <button 
                  onClick={() => { alert("Simulated: Create Post Clicked!"); setMobileMenuOpen(false); }}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-spicy-paprika py-3 text-sm font-semibold text-floral-white shadow-md shadow-spicy-paprika/15 transition-all active:scale-95 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span>Create New Post</span>
                </button>

                <Link 
                  href="#profile" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center rounded-full border border-[var(--input-border)] bg-[var(--input-bg)] py-2.5 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--btn-icon-hover-text)]"
                >
                  Your Profile
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
                  href="/auth/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-full border border-[var(--input-border)] bg-[var(--input-bg)] py-3 text-sm font-semibold text-[var(--foreground)] transition-all hover:bg-[var(--btn-secondary-hover-bg)] active:scale-95"
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

export default Navbar;
