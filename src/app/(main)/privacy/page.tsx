import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Chai Charcha",
  description: "Learn how Chai Charcha collects, uses, and protects your personal data. We are committed to full transparency about your privacy.",
  alternates: { canonical: "https://chai-charcha.vercel.app/privacy" },
};

const sections = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Information We Collect",
    subsections: [
      {
        subtitle: "Information you provide directly",
        items: [
          "Account information: name, username, email address, and password",
          "Profile information: bio, avatar, and optional social links",
          "Content you post: discussions, comments, and replies",
          "Communications: messages sent through our platform",
        ],
      },
      {
        subtitle: "Information collected automatically",
        items: [
          "Log data: IP address, browser type, pages visited, and access times",
          "Device information: hardware model, operating system, and browser version",
          "Usage data: features used, posts viewed, votes cast, and communities joined",
          "Cookies and similar tracking technologies for session management",
        ],
      },
    ],
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: "How We Use Your Information",
    list: [
      "To provide, maintain, and improve our services",
      "To personalise your experience and deliver relevant content",
      "To process transactions and send related information",
      "To send push notifications about activity related to your account",
      "To respond to comments, questions, and requests for support",
      "To monitor and analyse trends, usage, and activities in connection with our services",
      "To detect, investigate and prevent fraudulent transactions and other illegal activities",
      "To comply with legal obligations and enforce our Terms of Service",
    ],
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM6.75 10.5a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    title: "Information Sharing",
    content: "We do not sell, trade, or rent your personal information to third parties. We may share your information in the following limited circumstances:",
    list: [
      "With service providers who assist us in operating our website (e.g., MongoDB Atlas, Vercel hosting)",
      "With your consent or at your direction",
      "To comply with applicable laws, regulations, or legal processes",
      "To protect the rights, property, and safety of Chai Charcha, our users, and the public",
      "In connection with a merger, acquisition, or sale of assets (with prior notice)",
    ],
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Data Security",
    content: "We take the security of your personal information seriously. We implement appropriate technical and organisational measures to protect your personal information against unauthorised access, disclosure, alteration, and destruction. These measures include password hashing (bcrypt), HTTPS encryption for all data in transit, and access controls on our database systems. However, no security system is impenetrable and we cannot guarantee the absolute security of our systems.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    title: "Your Rights & Choices",
    list: [
      "Access: You can access and update your account information at any time from your Settings page",
      "Deletion: You can request deletion of your account and personal data via the Feedback Portal",
      "Data Portability: You can request a copy of your data in a machine-readable format",
      "Opt-out: You can opt out of non-essential email communications in your notification settings",
      "Cookies: You can configure your browser to refuse cookies, though some features may not work",
    ],
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    title: "Changes to this Policy",
    content: "We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the 'Last updated' date. For significant changes, we will also send a notification through the platform. Your continued use of Chai Charcha after any changes constitutes your acceptance of the new Privacy Policy.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex flex-col flex-1 bg-(--background) font-sans text-(--foreground)">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-dust-grey mb-8">
          <Link href="/" className="hover:text-spicy-paprika transition-colors">Home</Link>
          <span>/</span>
          <span className="text-(--foreground) font-semibold">Privacy Policy</span>
        </nav>

        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-vivid-tangerine/10 border border-vivid-tangerine/20 mb-5">
            <svg className="w-8 h-8 text-vivid-tangerine" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-(--foreground) mb-4">
            Privacy Policy
          </h1>
          <p className="text-base text-(--text-secondary) max-w-2xl mx-auto leading-relaxed">
            We believe privacy is a fundamental right. This policy explains exactly what data we collect, why we collect it, and how you can control it.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-dust-grey border border-(--card-border) rounded-full px-4 py-1.5 bg-(--card-background)">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Effective date: 1 May 2026 · Last updated: 24 May 2026
          </div>
        </div>

        {/* TLDR Card */}
        <div className="rounded-2xl border border-vivid-tangerine/20 bg-vivid-tangerine/5 p-5 mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-vivid-tangerine mb-2.5">TL;DR — The Short Version</p>
          <ul className="flex flex-col gap-1.5">
            {[
              "We never sell your personal data to advertisers or third parties",
              "We only collect what we need to run the platform",
              "You can delete your account and data at any time",
              "We use industry-standard encryption to protect your information",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-(--text-secondary)">
                <svg className="w-4 h-4 shrink-0 mt-0.5 text-vivid-tangerine" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-6">
          {sections.map((section) => (
            <div key={section.title} className="rounded-2xl border border-(--card-border) bg-(--card-background) p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-vivid-tangerine/10 border border-vivid-tangerine/20 flex items-center justify-center text-vivid-tangerine shrink-0">
                  {section.icon}
                </div>
                <h2 className="text-base font-bold text-(--foreground)">{section.title}</h2>
              </div>

              {section.content && (
                <p className="text-sm text-(--text-secondary) leading-relaxed mb-3">{section.content}</p>
              )}

              {section.subsections?.map((sub) => (
                <div key={sub.subtitle} className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-dust-grey mb-2">{sub.subtitle}</p>
                  <ul className="flex flex-col gap-1.5">
                    {sub.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-(--text-secondary)">
                        <svg className="w-3.5 h-3.5 shrink-0 mt-1 text-vivid-tangerine" fill="currentColor" viewBox="0 0 8 8">
                          <circle cx="4" cy="4" r="3" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {section.list && (
                <ul className="flex flex-col gap-1.5">
                  {section.list.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-(--text-secondary)">
                      <svg className="w-3.5 h-3.5 shrink-0 mt-1 text-vivid-tangerine" fill="currentColor" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-10 rounded-2xl border border-(--card-border) bg-linear-to-r from-vivid-tangerine/5 to-orange/5 p-6 text-center">
          <p className="text-sm font-semibold text-(--foreground) mb-1">Questions about your privacy?</p>
          <p className="text-xs text-dust-grey mb-4">We are committed to resolving any privacy concerns promptly.</p>
          <Link
            href="/feedback"
            className="inline-flex items-center gap-2 rounded-full bg-vivid-tangerine px-6 py-2.5 text-sm font-bold text-ink-black shadow-lg hover:opacity-90 transition-all hover:scale-105 active:scale-95"
          >
            Contact Our Privacy Team
          </Link>
        </div>

      </div>
    </div>
  );
}
