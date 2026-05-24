import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Code of Conduct | Chai Charcha",
  description: "Our community standards and Code of Conduct for Chai Charcha. Learn how we keep discussions respectful, constructive, and safe for all members.",
  alternates: { canonical: "https://chai-charcha.vercel.app/code-of-conduct" },
};

const sections = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    color: "text-spicy-paprika",
    bg: "bg-spicy-paprika/10",
    border: "border-spicy-paprika/20",
    title: "Our Pledge",
    content: "We as members, contributors, and leaders pledge to make participation in Chai Charcha a harassment-free experience for everyone, regardless of age, body size, visible or invisible disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "text-stormy-teal",
    bg: "bg-stormy-teal/10",
    border: "border-stormy-teal/20",
    title: "Standards of Positive Behaviour",
    list: [
      "Using welcoming and inclusive language",
      "Being respectful of differing viewpoints and experiences",
      "Gracefully accepting constructive criticism",
      "Focusing on what is best for the community",
      "Showing empathy towards other community members",
      "Sharing honest, unbiased career and salary insights",
      "Keeping discussions on-topic and high signal-to-noise",
    ],
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    color: "text-vivid-tangerine",
    bg: "bg-vivid-tangerine/10",
    border: "border-vivid-tangerine/20",
    title: "Unacceptable Behaviour",
    list: [
      "Trolling, insulting or derogatory comments, and personal or political attacks",
      "Public or private harassment of any kind",
      "Publishing others' private information without explicit permission",
      "Spam, unsolicited self-promotion, or repetitive low-effort posts",
      "Sexualized language, imagery, or unwelcome sexual attention",
      "Any conduct reasonably considered inappropriate in a professional community",
    ],
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
    color: "text-orange",
    bg: "bg-orange/10",
    border: "border-orange/20",
    title: "Enforcement",
    content: "Community leaders are responsible for clarifying and enforcing our standards of acceptable behaviour. They will take appropriate and fair corrective action in response to any behaviour they deem inappropriate, threatening, offensive, or harmful. Actions include a warning, temporary suspension, or permanent ban from the community.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    color: "text-spicy-paprika",
    bg: "bg-spicy-paprika/10",
    border: "border-spicy-paprika/20",
    title: "Reporting",
    content: "Instances of abusive, harassing, or otherwise unacceptable behaviour may be reported to the community leaders responsible for enforcement via the Feedback Portal or by using the in-app report button. All complaints will be reviewed and investigated promptly and fairly. Community leaders are obligated to respect the privacy and security of the reporter of any incident.",
  },
];

export default function CodeOfConductPage() {
  return (
    <div className="flex flex-col flex-1 bg-(--background) font-sans text-(--foreground)">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-dust-grey mb-8">
          <Link href="/" className="hover:text-spicy-paprika transition-colors">Home</Link>
          <span>/</span>
          <span className="text-(--foreground) font-semibold">Code of Conduct</span>
        </nav>

        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-spicy-paprika/10 border border-spicy-paprika/20 mb-5">
            <svg className="w-8 h-8 text-spicy-paprika" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-(--foreground) mb-4">
            Code of Conduct
          </h1>
          <p className="text-base text-(--text-secondary) max-w-2xl mx-auto leading-relaxed">
            Chai Charcha is a space built on mutual respect, honest conversations, and the shared love of learning. These guidelines keep our community safe and welcoming for everyone.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-dust-grey border border-(--card-border) rounded-full px-4 py-1.5 bg-(--card-background)">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Last updated: May 2026 — Adapted from the Contributor Covenant v2.1
          </div>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-6">
          {sections.map((section) => (
            <div key={section.title} className={`rounded-2xl border ${section.border} bg-(--card-background) p-6 shadow-sm`}>
              <div className="flex items-start gap-4">
                <div className={`shrink-0 w-11 h-11 rounded-xl ${section.bg} border ${section.border} flex items-center justify-center ${section.color}`}>
                  {section.icon}
                </div>
                <div className="flex-1">
                  <h2 className={`text-lg font-bold mb-3 ${section.color}`}>{section.title}</h2>
                  {section.content && (
                    <p className="text-sm text-(--text-secondary) leading-relaxed">{section.content}</p>
                  )}
                  {section.list && (
                    <ul className="flex flex-col gap-2">
                      {section.list.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm text-(--text-secondary)">
                          <svg className={`w-4 h-4 shrink-0 mt-0.5 ${section.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 rounded-2xl border border-(--card-border) bg-linear-to-r from-spicy-paprika/5 to-orange/5 p-6 text-center">
          <p className="text-sm text-(--text-secondary) mb-4">See something that violates our Code of Conduct?</p>
          <Link
            href="/feedback"
            className="inline-flex items-center gap-2 rounded-full bg-spicy-paprika px-6 py-2.5 text-sm font-bold text-floral-white shadow-lg hover:bg-spicy-paprika-600 transition-all hover:scale-105 active:scale-95"
          >
            Report a Violation
          </Link>
        </div>

      </div>
    </div>
  );
}
