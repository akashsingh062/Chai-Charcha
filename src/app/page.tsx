import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import connectDB from "@/lib/connectDB";
import { Post } from "@/lib/models/Post";
import { Community } from "@/lib/models/Community";
import "@/lib/models/User"; // Ensure the User model is registered for populate
import { MarketingPost, MarketingCommunity } from "@/components/home/MarketingView";
import { headers } from "next/headers";

/**
 * Homepage — Server Component
 *
 * Renders as a Server Component so Google's crawler receives the full
 * marketing content as static HTML (including <h1>, value pillars, and
 * the public preview section) without needing to execute JavaScript.
 *
 * The full interactive feed (logged-in state) is handled inside HomeClient
 * which is a Client Component loaded after hydration.
 */

export const metadata: Metadata = {
  title: "Chai Charcha — India's Open Discussion & Charcha Forum",
  description:
    "Join India's Open Discussion Forum, Chai Charcha, for vibrant conversations on career, startups, lifestyle & ideas. Engage in nested threads & honest discussions.",
  alternates: {
    canonical: "https://chai-charcha.vercel.app",
  },
  keywords: [
    "chai charcha",
    "discussion forum india",
    "indian community board",
    "career advice and guidance",
    "open discussion forum",
    "startup discussions india",
    "general discussions community",
    "ideas forum hindi",
    "open charcha",
    "bangalore community group",
  ],
  openGraph: {
    title: "Chai Charcha — India's Open Discussion Forum",
    description:
      "Join India's premier community. Discuss career growth, startups, lifestyle, and ideas over virtual chai.",
    url: "https://chai-charcha.vercel.app",
    images: ["/chai.svg"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chai Charcha — India's Open Discussion Forum",
    description:
      "Join India's premier community for career, lifestyle, and general discussions.",
    images: ["/chai.svg"],
  },
};

export default async function Home() {
  await headers();
  let initialPosts: MarketingPost[] = [];
  let initialCommunities: MarketingCommunity[] = [];

  try {
    await connectDB();

    const postsResult = await Post.find(
      { isSoftDeleted: { $ne: true }, isCommunityOnly: { $ne: true } },
      { title: 1, content: 1, category: 1, author: 1, createdAt: 1 }
    )
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("author", "username name avatar")
      .lean();

    initialPosts = JSON.parse(JSON.stringify(postsResult));

    const communitiesResult = await Community.find(
      { isBanned: { $ne: true } },
      { name: 1, slug: 1, description: 1 }
    )
      .sort({ membersCount: -1 })
      .limit(4)
      .lean();

    initialCommunities = JSON.parse(JSON.stringify(communitiesResult));
  } catch (err) {
    console.error("Error loading server-side data for homepage SEO:", err);
  }

  return (
    <HomeClient
      initialPosts={initialPosts}
      initialCommunities={initialCommunities}
    />
  );
}
