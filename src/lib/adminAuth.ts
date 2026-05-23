import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/connectDB";
import { User } from "@/lib/models/User";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  username?: string;
  avatar?: string;
}

/**
 * Server-side admin authorization guard.
 * Call this at the top of every admin API route and server component.
 * Throws a structured error object if the user is not authenticated or not an admin.
 */
export async function requireAdmin(): Promise<{ user: AdminUser }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    throw { status: 401, message: "Unauthorized — no active session" };
  }

  await connectDB();

  const dbUser = await User.findById(session.user.id).select(
    "name email role username avatar isBanned"
  );

  if (!dbUser) {
    throw { status: 404, message: "User not found in database" };
  }

  if (dbUser.isBanned) {
    throw { status: 403, message: "Account is banned" };
  }

  if (dbUser.role !== "admin") {
    throw { status: 403, message: "Forbidden — admin access required" };
  }

  return {
    user: {
      id: dbUser._id.toString(),
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      username: dbUser.username,
      avatar: dbUser.avatar,
    },
  };
}

/**
 * Helper to create a JSON error response from requireAdmin() exceptions
 */
export function adminErrorResponse(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    "message" in error
  ) {
    const e = error as { status: number; message: string };
    return Response.json({ error: e.message }, { status: e.status });
  }
  const message =
    error instanceof Error ? error.message : "Internal Server Error";
  return Response.json({ error: message }, { status: 500 });
}

/**
 * Verifies if the user is currently banned or muted.
 * If a temporary ban/mute has expired, it automatically lifts it in the database.
 */
export async function checkUserStatus(userId: string): Promise<{
  isBanned: boolean;
  banExpiresAt: Date | null;
  isMuted: boolean;
  muteExpiresAt: Date | null;
}> {
  await connectDB();
  const user = await User.findById(userId);

  if (!user) {
    return { isBanned: false, banExpiresAt: null, isMuted: false, muteExpiresAt: null };
  }

  const now = new Date();
  let updated = false;

  let isBanned = !!user.isBanned;
  let banExpiresAt = user.banExpiresAt || null;
  if (isBanned && banExpiresAt && now > new Date(banExpiresAt)) {
    user.isBanned = false;
    user.banExpiresAt = null;
    isBanned = false;
    banExpiresAt = null;
    updated = true;
  }

  let isMuted = !!user.isMuted;
  let muteExpiresAt = user.muteExpiresAt || null;
  if (isMuted && muteExpiresAt && now > new Date(muteExpiresAt)) {
    user.isMuted = false;
    user.muteExpiresAt = null;
    isMuted = false;
    muteExpiresAt = null;
    updated = true;
  }

  if (updated) {
    await user.save();
  }

  return {
    isBanned,
    banExpiresAt,
    isMuted,
    muteExpiresAt,
  };
}

