import React from "react";
import ProfileClient from "./ProfileClient";
import { requireAuth } from "@/lib/userAuth";
import type { Metadata } from "next";
import connectDB from "@/lib/connectDB";
import { User } from "@/lib/models/User";

interface PageProps {
  searchParams: Promise<{ username?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const username = resolvedParams.username;

  if (!username) {
    return {
      title: "My Profile",
      description: "Manage your personal profile, joined communities, and discussion charchas.",
    };
  }

  try {
    await connectDB();
    const user = await User.findOne({ 
      username: username.toLowerCase(), 
      isBanned: { $ne: true } 
    }).lean();

    if (!user) {
      return {
        title: "Profile Not Found",
        description: "The requested user profile does not exist on Chai Charcha.",
      };
    }

    const title = `${user.name} (@${user.username})`;
    const description = `Explore ${user.name}'s profile on Chai Charcha. ${user.bio || "Joined discussions and community charchas."} Active member with ${user.karma || 0} karma.`;

    return {
      title,
      description,
      alternates: {
        canonical: `https://chai-charcha.vercel.app/profile?username=${encodeURIComponent(user.username)}`,
      },
      openGraph: {
        title,
        description,
        url: `https://chai-charcha.vercel.app/profile?username=${encodeURIComponent(user.username)}`,
        images: user.avatar ? [user.avatar] : ["/chai.svg"],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: user.avatar ? [user.avatar] : ["/chai.svg"],
      },
    };
  } catch (err) {
    console.error("Error generating profile metadata:", err);
    return {
      title: `${username}'s Profile`,
    };
  }
}

export default async function ProfilePage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const username = resolvedParams.username;
  
  // If no username is provided, the user is trying to view their own profile.
  // In this case, we MUST enforce authentication.
  if (!username) {
    await requireAuth("/profile");
  }

  let userJsonLd = null;

  if (username) {
    try {
      await connectDB();
      const user = await User.findOne({ 
        username: username.toLowerCase(), 
        isBanned: { $ne: true } 
      }).lean();

      if (user) {
        userJsonLd = {
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          "mainEntity": {
            "@type": "Person",
            "name": user.name,
            "alternateName": user.username,
            "description": user.bio,
            "image": user.avatar,
            "interactionStatistic": [
              {
                "@type": "InteractionCounter",
                "interactionType": "https://schema.org/LikeAction",
                "userInteractionCount": user.karma || 0
              }
            ]
          }
        };
      }
    } catch (err) {
      console.error("Error generating profile JSON-LD:", err);
    }
  }

  return (
    <>
      {userJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(userJsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <ProfileClient />
    </>
  );
}
