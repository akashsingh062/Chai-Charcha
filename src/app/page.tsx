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
  title: "Chai Charcha — India's Developer Discussion & Charcha Forum",
  description:
    "Join India's premier developer community. Discuss tech, career growth, startups, lifestyle, and more over virtual chai. Community-driven discussions, nested charcha threads, and honest conversations.",
  alternates: {
    canonical: "https://chai-charcha.vercel.app",
  },
  keywords: [
    "chai charcha",
    "developer forum india",
    "indian developer community",
    "career advice developers",
    "tech discussion forum",
    "startup discussions india",
    "software engineer community",
    "programming forum hindi",
    "developer charcha",
    "bangalore developer community",
  ],
  openGraph: {
    title: "Chai Charcha — India's Developer Discussion Forum",
    description:
      "Join India's premier developer community. Discuss tech, career growth, startups, and lifestyle over virtual chai.",
    url: "https://chai-charcha.vercel.app",
    images: ["/chai.svg"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chai Charcha — India's Developer Discussion Forum",
    description:
      "Join India's premier developer community for tech, career, and lifestyle discussions.",
    images: ["/chai.svg"],
  },
};

export default function Home() {
  return <HomeClient />;
}
