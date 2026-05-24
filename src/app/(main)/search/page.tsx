import type { Metadata } from "next";
import SearchClient from "./SearchClient";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const baseUrl = "https://chai-charcha.vercel.app";

  if (query) {
    return {
      title: `Search: "${query}" | Chai Charcha`,
      description: `Browse discussions, communities, and developer profiles matching "${query}" on Chai Charcha — India's premier developer forum.`,
      alternates: {
        canonical: `${baseUrl}/search?q=${encodeURIComponent(query)}`,
      },
      openGraph: {
        title: `Search: "${query}" | Chai Charcha`,
        description: `Browse discussions, communities, and developer profiles matching "${query}" on Chai Charcha.`,
        url: `${baseUrl}/search?q=${encodeURIComponent(query)}`,
        images: ["/chai.svg"],
      },
      twitter: {
        card: "summary",
        title: `Search: "${query}" | Chai Charcha`,
        description: `Browse discussions, communities, and developer profiles matching "${query}" on Chai Charcha.`,
      },
    };
  }

  return {
    title: "Search Discussions, Communities & Profiles | Chai Charcha",
    description: "Search across all discussions, communities, and developer profiles on Chai Charcha — India's premier developer forum for chai and charcha.",
    alternates: {
      canonical: `${baseUrl}/search`,
    },
    openGraph: {
      title: "Search | Chai Charcha",
      description: "Search across all discussions, communities, and developer profiles on Chai Charcha.",
      url: `${baseUrl}/search`,
      images: ["/chai.svg"],
    },
  };
}

export default function SearchPage() {
  return <SearchClient />;
}
