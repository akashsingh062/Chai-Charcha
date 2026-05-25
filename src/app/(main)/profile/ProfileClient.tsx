"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  followers?: string[];
  following?: string[];
  createdAt: string;
}

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const { userData } = useAuth();
  
  const usernameParam = searchParams.get("username") || "";

  // States
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [postCount, setPostCount] = useState(0);



  // Fetch user profile details from the DB
  useEffect(() => {
    let active = true;

    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        // Query by username handle if parameter exists, otherwise retrieve current active session profile
        const endpoint = usernameParam 
          ? `/api/profile?username=${encodeURIComponent(usernameParam)}` 
          : "/api/profile";
        
        const res = await fetch(endpoint);
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
  }, [usernameParam, userData]);

  const isOwnProfile = !usernameParam || (userData && user && userData.id === user._id) || false;

  // Main layout grid
  return (
    <div className="min-h-screen bg-(--nav-bg) text-(--foreground) transition-all duration-300">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Profile Card Sidebar */}
          <aside className="lg:col-span-4">
            <ProfileDetails 
              user={user} 
              isLoading={isLoading} 
              postCount={postCount} 
              isOwnProfile={isOwnProfile} 
              onProfileUpdate={(updatedUser) => setUser(updatedUser)}
            />
          </aside>

          {/* Right Column: User Posts Discussion Feed */}
          <main className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between border-b border-(--divider-color) pb-3.5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-(--foreground)">
                  Discussions
                </h2>
                {user && (
                  <span className="rounded-full bg-(--profile-bg) border border-(--profile-border) px-2 py-0.5 text-2xs text-(--text-role) font-semibold">
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

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col flex-1 bg-(--background) items-center justify-center py-20 text-dust-grey gap-3">
        <svg className="animate-spin h-8 w-8 text-spicy-paprika" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs font-mono tracking-wider animate-pulse">Brewing user profile...</span>
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}