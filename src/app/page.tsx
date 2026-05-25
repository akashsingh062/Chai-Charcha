import type { Metadata } from "next";
import HomeClient from "./HomeClient";

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
    "Join India's premier open discussion community. Discuss career growth, startups, lifestyle, ideas, and more over virtual chai. Community-driven discussions, nested charcha threads, and honest conversations.",
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

export default function Home() {
  return <HomeClient />;
}
