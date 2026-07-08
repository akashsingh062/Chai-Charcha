import type { Metadata } from "next";
import connectDB from "@/lib/connectDB";
import { Community } from "@/lib/models/Community";
import CommunityClient from "./CommunityClient";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!slug) {
    return {
      title: "Sub-community",
    };
  }

  try {
    await connectDB();
    const community = await Community.findOne({ 
      slug: slug.toLowerCase(), 
      isBanned: { $ne: true } 
    }).lean();

    if (!community) {
      return {
        title: "Community Not Found",
        description: "The requested sub-community does not exist on Chai Charcha.",
      };
    }

    const title = `c/${community.slug} - ${community.name}`;
    const description = `Join the c/${community.slug} community on Chai Charcha: ${community.description || "Share insights over hot chai and charcha."} Active discussion circle with ${community.membersCount || 0} members.`;

    return {
      title,
      description,
      alternates: {
        canonical: `https://chai-charcha.vercel.app/c/${community.slug}`,
      },
      openGraph: {
        title,
        description,
        url: `https://chai-charcha.vercel.app/c/${community.slug}`,
        images: community.avatar ? [community.avatar] : ["/chai.svg"],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: community.avatar ? [community.avatar] : ["/chai.svg"],
      },
    };
  } catch (err) {
    console.error("Error generating metadata for community:", err);
    return {
      title: `c/${slug} Community`,
    };
  }
}

export const unstable_instant = {
  prefetch: 'static',
  samples: [
    { params: { slug: 'general-charcha' } }
  ]
};

export default async function CommunityPage({ params }: PageProps) {
  return (
    <Suspense fallback={
      <div className="flex flex-col flex-1 bg-(--background) items-center justify-center py-20 text-dust-grey gap-3">
        <svg className="animate-spin h-8 w-8 text-spicy-paprika" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs font-mono tracking-wider animate-pulse">Brewing community page...</span>
      </div>
    }>
      {params.then(({ slug }) => (
        <CommunityPageContent slug={slug} />
      ))}
    </Suspense>
  );
}

async function CommunityPageContent({ slug }: { slug: string }) {
  await connectDB();
  const community = await Community.findOne({ 
    slug: slug.toLowerCase(), 
    isBanned: { $ne: true } 
  })
    .populate("creator", "name username avatar role karma")
    .lean();

  if (!community) {
    notFound();
  }

  // Serialize Mongoose models for Client Component safety
  const serializedCommunity = JSON.parse(JSON.stringify(community));

  const forumJsonLd = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    "headline": community.name,
    "description": community.description,
    "url": `https://chai-charcha.vercel.app/c/${community.slug}`,
    "about": {
      "@type": "Thing",
      "name": community.name,
      "description": community.description
    },
    "interactionStatistic": {
      "@type": "InteractionCounter",
      "interactionType": "https://schema.org/SubscribeAction",
      "userInteractionCount": community.membersCount || 0
    }
  };

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
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Communities",
        "item": "https://chai-charcha.vercel.app/communities"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": `c/${community.slug}`,
        "item": `https://chai-charcha.vercel.app/c/${community.slug}`
      }
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
      <CommunityClient initialCommunity={serializedCommunity} slug={slug} />
    </>
  );
}
