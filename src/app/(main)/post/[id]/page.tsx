import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { headers } from "next/headers";
import mongoose from "mongoose";
import connectDB from "@/lib/connectDB";
import { Post, Comment, Community } from "@/lib/models";
import { formatPostForFrontend, DBPost, DBComment } from "@/lib/apiHelpers";
import { auth } from "@/lib/auth";
import ThreadDetailClient from "./ThreadDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface PopulatedCommunity {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  avatar?: string;
}

interface PopulatedUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  username: string;
  avatar?: string;
  role: string;
  karma: number;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    await connectDB();
    const post = await Post.findById(id)
      .populate("community", "name slug avatar")
      .lean();

    if (!post || post.isSoftDeleted) {
      return {
        title: "Charcha Not Found",
        description: "The requested discussion does not exist on Chai Charcha.",
      };
    }

    const title = `${post.title} - Chai Charcha`;
    const description = post.content.substring(0, 160) + (post.content.length > 160 ? "..." : "");

    // Parent community's avatar or fallback to /chai.svg
    let imageUrl = "/chai.svg";
    const communityDoc = post.community && typeof post.community === "object"
      ? (post.community as unknown as PopulatedCommunity)
      : null;
    if (communityDoc?.avatar) {
      imageUrl = communityDoc.avatar;
    }

    return {
      title,
      description,
      alternates: {
        canonical: `https://chai-charcha.vercel.app/post/${id}`,
      },
      openGraph: {
        title,
        description,
        url: `https://chai-charcha.vercel.app/post/${id}`,
        images: [imageUrl],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
      },
    };
  } catch (err) {
    console.error("Error generating metadata for post:", err);
    return {
      title: "Charcha Discussion",
    };
  }
}

export default async function ThreadPage({ params }: PageProps) {
  const { id } = await params;

  await connectDB();

  // Fetch the session
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const userId = session?.user?.id || null;
  const userRole = session?.user?.role || null;

  // Retrieve post and populate author & community
  const postDoc = await Post.findById(id)
    .populate("author", "name username avatar role karma")
    .populate("community", "name slug description avatar")
    .lean();

  if (!postDoc) {
    notFound();
  }

  // Handle soft deletion access controls
  if (postDoc.isSoftDeleted) {
    let isCurrentUserMod = false;
    if (postDoc.community && userId) {
      const communityDoc = postDoc.community as unknown as PopulatedCommunity;
      const comm = await Community.findById(communityDoc._id);
      if (comm) {
        const isAdmin = comm.creator.toString() === userId;
        const isMod = comm.moderators && comm.moderators.some(
          (mId: mongoose.Types.ObjectId) => mId.toString() === userId
        );
        isCurrentUserMod = isAdmin || isMod;
      }
    }

    const authorDoc = postDoc.author as unknown as PopulatedUser;
    const isAuthor = authorDoc && authorDoc._id?.toString() === userId;
    const isAdminRole = userRole === "admin";

    // If post is soft deleted and user has no privileges to see it, return 404
    if (!isAuthor && !isCurrentUserMod && !isAdminRole) {
      notFound();
    }
  }

  // Fetch comments
  const dbComments = await Comment.find({ postId: id })
    .populate("author", "name username avatar role karma")
    .sort({ createdAt: 1 })
    .lean() as unknown as DBComment[];

  // Format post for the frontend representation
  const formattedPost = formatPostForFrontend(postDoc as unknown as DBPost, dbComments, userId);

  // Safely serialize database model fields for Client Component compatibility
  const serializedPost = JSON.parse(JSON.stringify(formattedPost));

  // Build JSON-LD structured data for Google Rich Snippets
  const authorDoc = postDoc.author as unknown as PopulatedUser;
  const forumJsonLd = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    "headline": postDoc.title,
    "description": postDoc.content.substring(0, 160) + (postDoc.content.length > 160 ? "..." : ""),
    "articleBody": postDoc.content,
    "url": `https://chai-charcha.vercel.app/post/${id}`,
    "datePublished": postDoc.createdAt ? new Date(postDoc.createdAt).toISOString() : new Date().toISOString(),
    "author": {
      "@type": "Person",
      "name": authorDoc?.name || "Unknown",
    },
    "interactionStatistic": [
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/LikeAction",
        "userInteractionCount": (postDoc.upvotes?.length || 0) - (postDoc.downvotes?.length || 0),
      },
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/CommentAction",
        "userInteractionCount": dbComments.length,
      },
    ],
  };

  // Build BreadcrumbList for Google rich results
  const communityForBreadcrumb = postDoc.community as unknown as PopulatedCommunity | null;
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://chai-charcha.vercel.app"
      },
      ...(communityForBreadcrumb?.slug ? [
        {
          "@type": "ListItem",
          "position": 2,
          "name": `c/${communityForBreadcrumb.slug}`,
          "item": `https://chai-charcha.vercel.app/c/${communityForBreadcrumb.slug}`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": postDoc.title,
          "item": `https://chai-charcha.vercel.app/post/${id}`
        }
      ] : [
        {
          "@type": "ListItem",
          "position": 2,
          "name": postDoc.title,
          "item": `https://chai-charcha.vercel.app/post/${id}`
        }
      ])
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(forumJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Suspense fallback={
        <div className="w-full flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange"></div>
        </div>
      }>
        <ThreadDetailClient initialThread={serializedPost} />
      </Suspense>
    </>
  );
}
