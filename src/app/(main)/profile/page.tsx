import React from "react";
import ProfileClient from "./ProfileClient";
import { requireAuth } from "@/lib/userAuth";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ username?: string }>;
}) {
  const resolvedParams = await searchParams;
  
  // If no username is provided, the user is trying to view their own profile.
  // In this case, we MUST enforce authentication.
  if (!resolvedParams.username) {
    await requireAuth("/profile");
  }

  return <ProfileClient />;
}
