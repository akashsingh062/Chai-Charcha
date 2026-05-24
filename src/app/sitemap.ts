import type { MetadataRoute } from "next";
import connectDB from "@/lib/connectDB";
import { Community } from "@/lib/models/Community";
import { User } from "@/lib/models/User";

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

  return routes;
}
