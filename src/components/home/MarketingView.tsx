import React from "react";
import Link from "next/link";

interface MarketingViewProps {
  login: () => void;
}

export const MarketingView: React.FC<MarketingViewProps> = ({ login }) => {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="relative w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-28 flex flex-col items-center text-center overflow-hidden">
        {/* Background Blur Accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-72 w-160 rounded-full bg-linear-to-r from-spicy-paprika/10 to-orange/15 blur-3xl opacity-60" />
        
        {/* Tagline Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-spicy-paprika/30 bg-spicy-paprika/5 px-4 py-1.5 text-xs font-semibold text-spicy-paprika mb-8 animate-pulse">
          <span>☕ India&apos;s Ultimate Dev Chai Club</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.15] max-w-4xl text-(--foreground)">
          Where Indian Developers Gather <br />
          Over <span className="bg-linear-to-r from-spicy-paprika to-orange bg-clip-text text-transparent">Chai & Code</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-(--text-secondary) max-w-2xl leading-relaxed">
          Skip the noise. Pull up a chair to discuss real system design architectures, remote career growth paths, FAANG prep, and tech ecosystem realities with Indian engineers.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 justify-center">
          <button
            onClick={login}
            className="flex items-center justify-center gap-2 rounded-full bg-spicy-paprika hover:bg-spicy-paprika-600 px-8 py-4 text-base font-bold text-floral-white shadow-xl shadow-spicy-paprika/20 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <span>Pull Up a Chair</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
          
          <Link
            href="#public-preview"
            className="flex items-center justify-center rounded-full border border-(--btn-secondary-border) hover:bg-(--btn-secondary-hover-bg) px-8 py-4 text-base font-semibold transition-all duration-200"
          >
            Browse Discussions
          </Link>
        </div>

        {/* Tech badging grid */}
        <div className="mt-16 flex flex-wrap justify-center gap-2.5 max-w-2xl">
          {["#nextjs15", "#react19", "#system-design", "#bangalore-remote", "#faang-prep", "#golang-architecture", "#tech-salaries"].map((tag) => (
            <span key={tag} className="rounded-full border border-(--card-border) bg-(--card-background) px-4 py-1.5 text-xs font-medium text-(--text-secondary) shadow-sm hover:border-orange transition-all duration-200 cursor-default">
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* Value Pillars Section */}
      <section className="w-full bg-(--card-background) border-y border-(--card-border) transition-all duration-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-(--foreground)">Why Indian Engineers Join Chai Charcha</h2>
            <p className="mt-3 text-sm sm:text-base text-(--text-secondary)">A community curated to elevate your technical craftsmanship and career.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="flex flex-col p-6 rounded-2xl border border-(--card-border) bg-(--background) hover:border-spicy-paprika/30 transition-all duration-300 group">
              <div className="h-12 w-12 rounded-xl bg-spicy-paprika/10 flex items-center justify-center text-2xl text-spicy-paprika mb-4 group-hover:scale-110 transition-transform duration-300">
                ☕
              </div>
              <h3 className="text-lg font-bold text-(--foreground)">Chai & Real Talks</h3>
              <p className="mt-2 text-sm text-(--text-secondary) leading-relaxed">
                Zero spam, zero vanity metrics. Enjoy high-quality nested threads on production bottlenecks, memory leaks, CSS architecture, and codebases.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="flex flex-col p-6 rounded-2xl border border-(--card-border) bg-(--background) hover:border-vivid-tangerine/30 transition-all duration-300 group">
              <div className="h-12 w-12 rounded-xl bg-vivid-tangerine/10 flex items-center justify-center text-2xl text-vivid-tangerine mb-4 group-hover:scale-110 transition-transform duration-300">
                💰
              </div>
              <h3 className="text-lg font-bold text-(--foreground)">Career Parity & Wages</h3>
              <p className="mt-2 text-sm text-(--text-secondary) leading-relaxed">
                Access honest discussions about salary benchmarks, remote negotiation tactics, resume critiques, and interview pipelines.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="flex flex-col p-6 rounded-2xl border border-(--card-border) bg-(--background) hover:border-stormy-teal/30 transition-all duration-300 group">
              <div className="h-12 w-12 rounded-xl bg-stormy-teal/10 flex items-center justify-center text-2xl text-stormy-teal mb-4 group-hover:scale-110 transition-transform duration-300">
                🇮🇳
              </div>
              <h3 className="text-lg font-bold text-(--foreground)">City Guilds & AMAs</h3>
              <p className="mt-2 text-sm text-(--text-secondary) leading-relaxed">
                Coordinate with local circles in Bengaluru, Delhi-NCR, Pune, Hyderabad, or Mumbai. Participate in live online AMAs with staff engineers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Public Preview Section */}
      <section id="public-preview" className="w-full max-w-4xl px-4 py-16 sm:py-24">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-(--foreground)">Trending Public Discussions</h2>
          <p className="mt-2 text-xs sm:text-sm text-(--text-secondary)">Take a peek at hot questions circulating in the developer ecosystem.</p>
        </div>

        {/* Blurred Preview Feed */}
        <div className="relative rounded-2xl border border-(--card-border) bg-(--card-background) p-4 sm:p-6 overflow-hidden">
          {/* Overlay Prompt */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-linear-to-t from-(--card-background) via-(--card-background)/90 to-(--card-background)/50 p-6 text-center">
            <div className="rounded-2xl border border-(--nav-border) bg-(--nav-bg) p-8 max-w-md shadow-2xl backdrop-blur-md">
              <span className="text-3xl">🔒</span>
              <h3 className="text-xl font-bold mt-4 text-(--foreground)">Join the Discussion</h3>
              <p className="mt-2 text-xs sm:text-sm text-(--text-secondary) leading-relaxed">
                Ready to share your experiences, upvote great ideas, or ask your own burning dev questions? Log in instantly.
              </p>
              <button
                onClick={login}
                className="w-full mt-6 rounded-full bg-spicy-paprika px-5 py-3 text-sm font-bold text-floral-white shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                Enter Chai Charcha
              </button>
            </div>
          </div>

          {/* Blurred Thread 1 */}
          <div className="mb-6 border-b border-(--divider-color) pb-6 blur-xs select-none pointer-events-none opacity-50">
            <span className="rounded-full bg-orange/10 text-orange border border-orange/20 px-2 py-0.5 text-xs font-semibold">Career Prep</span>
            <h3 className="text-lg font-bold mt-2 text-(--foreground)">Is there a real hiring slowdown in Bangalore for remote developers?</h3>
            <p className="mt-2 text-sm text-(--text-secondary)">Local Indian startups are offering roughly 30-40% lower compensation packages...</p>
          </div>

          {/* Blurred Thread 2 */}
          <div className="blur-xs select-none pointer-events-none opacity-30">
            <span className="rounded-full bg-stormy-teal/10 text-stormy-teal border border-stormy-teal/20 px-2 py-0.5 text-xs font-semibold">Tech & Architecture</span>
            <h3 className="text-lg font-bold mt-2 text-(--foreground)">Why we migrated our Next.js 15 site back to native CSS variables...</h3>
            <p className="mt-2 text-sm text-(--text-secondary)">Tailwind v4 is fantastic for core design systems, but we hit complex specificity overrides...</p>
          </div>
        </div>
      </section>
    </div>
  );
};
