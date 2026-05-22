"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ProfileDetails } from "@/components/profile/ProfileDetails";
import { ProfilePosts } from "@/components/profile/ProfilePosts";

interface UserProfileData {
  _id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  role: "member" | "moderator" | "admin";
  karma: number;
  joinedCommunities?: string[];
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user: isLoggedIn, userData } = useAuth();
  
  // States
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [postCount, setPostCount] = useState(0);

  // Redirection guard for logged-out users
  useEffect(() => {
    // If not logged in and not loading, redirect to signin
    const checkUser = localStorage.getItem("isLoggedIn");
    if (checkUser === "false" || (!isLoggedIn && checkUser !== "true")) {
      router.push("/auth/signin");
    }
  }, [isLoggedIn, router]);

  // Fetch full user profile details from the DB
  useEffect(() => {
    let active = true;

    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/about");
        if (!res.ok) {
          throw new Error("Failed to load user profile");
        }
        const data = await res.json();
        if (active && data?.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.error("Error loading user profile details:", err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchUserProfile();

    return () => {
      active = false;
    };
  }, [userData]);

  // Main layout grid
  return (
    <div className="min-h-screen bg-(--nav-bg) text-(--foreground) transition-all duration-300">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Profile Card Sidebar */}
          <aside className="lg:col-span-4">
            <ProfileDetails user={user} isLoading={isLoading} postCount={postCount} />
          </aside>

          {/* Right Column: User Posts Discussion Feed */}
          <main className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between border-b border-(--divider-color) pb-3.5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-(--foreground)">
                  Technical Discussions
                </h2>
                {user && (
                  <span className="rounded-full bg-(--profile-bg) border border-(--profile-border) px-2 py-0.5 text-2xs text-[var(--text-role)] font-semibold">
                    {postCount} {postCount === 1 ? "charcha" : "charchas"}
                  </span>
                )}
              </div>
            </div>

            <ProfilePosts user={user} onPostsCountChange={setPostCount} />
          </main>

        </div>
      </div>
    </div>
  );
}