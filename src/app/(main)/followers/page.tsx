import type { Metadata } from "next";
import { headers } from "next/headers";
import connectDB from "@/lib/connectDB";
import { User } from "@/lib/models/User";
import { auth } from "@/lib/auth";
import FollowersClient from "./FollowersClient";

interface PageProps {
  searchParams: Promise<{ userId?: string; username?: string; tab?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const { userId, username, tab } = resolvedParams;
  const activeTab = tab === "following" ? "Following" : "Followers";
  const baseUrl = "https://chai-charcha.vercel.app";

  let targetUser: { name: string; username: string; avatar?: string } | null = null;

  try {
    await connectDB();
    if (userId) {
      const u = await User.findById(userId).lean();
      if (u) {
        targetUser = {
          name: u.name,
          username: u.username,
          avatar: u.avatar
        };
      }
    } else if (username) {
      const u = await User.findOne({ username: username.toLowerCase() }).lean();
      if (u) {
        targetUser = {
          name: u.name,
          username: u.username,
          avatar: u.avatar
        };
      }
    } else {
      // Get logged-in user session
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      if (session?.user?.id) {
        const u = await User.findById(session.user.id).lean();
        if (u) {
          targetUser = {
            name: u.name,
            username: u.username,
            avatar: u.avatar
          };
        }
      }
    }
  } catch (err) {
    console.error("Error fetching target user for followers metadata:", err);
  }

  const name = targetUser ? targetUser.name : "Member";
  const handle = targetUser ? ` (@${targetUser.username})` : "";
  const title = `${activeTab} of ${name}${handle} | Chai Charcha`;
  const description = targetUser
    ? `View who ${name} follows and who follows them on Chai Charcha. Connect, share ideas, and participate in discussions.`
    : `Browse member followers and followings on Chai Charcha.`;
  
  // Construct canonical URL
  let canonicalUrl = `${baseUrl}/followers`;
  const queryParams: string[] = [];
  if (userId) queryParams.push(`userId=${encodeURIComponent(userId)}`);
  if (username) queryParams.push(`username=${encodeURIComponent(username)}`);
  if (tab) queryParams.push(`tab=${encodeURIComponent(tab)}`);
  if (queryParams.length > 0) {
    canonicalUrl += `?${queryParams.join("&")}`;
  }

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: targetUser?.avatar ? [targetUser.avatar] : ["/chai.svg"],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: targetUser?.avatar ? [targetUser.avatar] : ["/chai.svg"],
    },
  };
}

export default async function FollowersPage() {
  return <FollowersClient />;
}
