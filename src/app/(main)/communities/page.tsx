import type { Metadata } from "next";
import CommunitiesClient from "./CommunitiesClient";

export const metadata: Metadata = {
  title: "Explore Communities | Chai Charcha",
  description: "Discover active community circles on Chai Charcha. Browse communities on career growth, startups, gaming, lifestyle, learning, and more. Join, create, and engage with your squad.",
  alternates: {
    canonical: "https://chai-charcha.vercel.app/communities",
  },
  openGraph: {
    title: "Explore Communities | Chai Charcha",
    description: "Discover active community circles on Chai Charcha. Browse communities on career growth, startups, gaming, lifestyle, learning, and more.",
    url: "https://chai-charcha.vercel.app/communities",
    images: ["/chai.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Communities | Chai Charcha",
    description: "Discover active community circles on Chai Charcha. Browse communities on career growth, startups, gaming, lifestyle, learning, and more.",
    images: ["/chai.svg"],
  },
};

export default function CommunitiesPage() {
  return <CommunitiesClient />;
}
