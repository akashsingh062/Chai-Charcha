import type { Metadata } from "next";
import CommunitiesClient from "./CommunitiesClient";

export const metadata: Metadata = {
  title: "Explore Communities | Chai Charcha",
  description: "Discover active developer circles on Chai Charcha. Browse communities on tech, career growth, startups, gaming, lifestyle, and more. Join, create, and engage with your squad.",
  alternates: {
    canonical: "https://chai-charcha.vercel.app/communities",
  },
  openGraph: {
    title: "Explore Communities | Chai Charcha",
    description: "Discover active developer circles on Chai Charcha. Browse communities on tech, career growth, startups, gaming, lifestyle, and more.",
    url: "https://chai-charcha.vercel.app/communities",
    images: ["/chai.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Communities | Chai Charcha",
    description: "Discover active developer circles on Chai Charcha. Browse communities on tech, career growth, startups, gaming, lifestyle, and more.",
    images: ["/chai.svg"],
  },
};

export default function CommunitiesPage() {
  return <CommunitiesClient />;
}
