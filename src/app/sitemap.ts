import type { MetadataRoute } from "next";
import connectDB from "@/lib/connectDB";
import { Community } from "@/lib/models/Community";
import { User } from "@/lib/models/User";
import { Post } from "@/lib/models/Post";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://chai-charcha.vercel.app";

  // Establish Database Connection
  try {
    await connectDB();
  } catch (err) {
    console.error("Sitemap failed to connect to database:", err);
  }

  // Define static routing list
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/communities`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/code-of-conduct`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/feedback`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Retrieve dynamic community endpoints
  try {
    const communities = await Community.find(
      { isBanned: { $ne: true } },
      { slug: 1, updatedAt: 1 }
    ).lean() as unknown as Array<{ slug: string; updatedAt?: Date | string }>;

    communities.forEach((comm) => {
      if (comm.slug) {
        routes.push({
          url: `${baseUrl}/c/${comm.slug}`,
          lastModified: comm.updatedAt ? new Date(comm.updatedAt) : new Date(),
          changeFrequency: "daily",
          priority: 0.9,
        });
      }
    });
  } catch (err) {
    console.error("Failed to query communities for sitemap:", err);
  }

  // Retrieve public profile search endpoints
  try {
    const users = await User.find(
      { isBanned: { $ne: true } },
      { username: 1, updatedAt: 1 }
    ).lean() as unknown as Array<{ username: string; updatedAt?: Date | string }>;

    users.forEach((usr) => {
      if (usr.username) {
        routes.push({
          url: `${baseUrl}/profile?username=${encodeURIComponent(usr.username)}`,
          lastModified: usr.updatedAt ? new Date(usr.updatedAt) : new Date(),
          changeFrequency: "weekly",
          priority: 0.5,
        });
      }
    });
  } catch (err) {
    console.error("Failed to query user profiles for sitemap:", err);
  }

  // Retrieve dynamic public post detail endpoints
  try {
    const posts = await Post.find(
      { isSoftDeleted: { $ne: true }, isCommunityOnly: { $ne: true } },
      { _id: 1, updatedAt: 1 }
    )
      .sort({ createdAt: -1 })
      .lean() as unknown as Array<{ _id: string; updatedAt?: Date | string }>;

    posts.forEach((post) => {
      if (post._id) {
        routes.push({
          url: `${baseUrl}/post/${post._id.toString()}`,
          lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
          changeFrequency: "daily",
          priority: 0.8,
        });
      }
    });
  } catch (err) {
    console.error("Failed to query posts for sitemap:", err);
  }

  // Retrieve distinct trending tags for search routes
  try {
    const tags = await Post.distinct("tags", {
      isSoftDeleted: { $ne: true },
      isCommunityOnly: { $ne: true },
    }) as string[];

    tags.forEach((tag) => {
      const cleanTag = tag?.trim();
      if (cleanTag) {
        routes.push({
          url: `${baseUrl}/search?q=${encodeURIComponent(cleanTag)}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    });
  } catch (err) {
    console.error("Failed to query tags for sitemap:", err);
  }

  return routes;
}

