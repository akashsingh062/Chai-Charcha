import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Chai Charcha",
  description: "Read the Terms of Service for Chai Charcha. Understand your rights and responsibilities as a member of our discussion community.",
  alternates: { canonical: "https://chai-charcha.vercel.app/terms" },
};

const terms = [
  {
    title: "1. Acceptance of Terms",
    content: "By accessing or using Chai Charcha ('the Service'), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site. These Terms of Service apply to all users of the site, including without limitation users who are browsers, vendors, customers, merchants, and contributors of content.",
  },
  {
    title: "2. Your Account",
    content: "When you create an account, you must provide accurate and complete information. You are solely responsible for the activity that occurs on your account and you must keep your account password secure. You must notify Chai Charcha immediately of any breach of security or unauthorized use of your account. You may never use another member's account without permission.",
  },
  {
    title: "3. User-Generated Content",
    content: "You retain ownership of content you post on Chai Charcha. However, by posting content you grant us a non-exclusive, worldwide, royalty-free licence to use, reproduce, adapt, publish, and distribute such content in any and all media. You warrant that you have the necessary rights to grant this licence and that your content does not violate any third-party rights. We reserve the right to remove any content that violates these Terms or our Code of Conduct.",
  },
  {
    title: "4. Prohibited Activities",
    list: [
      "Posting spam, unsolicited advertisements, or repetitive low-quality content",
      "Impersonating another person or entity",
      "Harvesting or collecting email addresses or other contact information",
      "Using the Service for any unlawful purpose or in any way that could harm others",
      "Attempting to gain unauthorized access to any portion or feature of the Service",
      "Engaging in any conduct that restricts or inhibits anyone's use of the Service",
      "Reverse engineering, decompiling, or disassembling any part of the Service",
    ],
  },
  {
    title: "5. Intellectual Property",
    content: "The Service and its original content (excluding user-generated content), features, and functionality are and will remain the exclusive property of Chai Charcha and its licensors. The Service is protected by copyright, trademark, and other laws. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Chai Charcha.",
  },
  {
    title: "6. Limitation of Liability",
    content: "In no event shall Chai Charcha, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of (or inability to access or use) the Service.",
  },
  {
    title: "7. Termination",
    content: "We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including without limitation if you breach these Terms. Upon termination, your right to use the Service will cease immediately. All provisions of the Terms which by their nature should survive termination shall survive.",
  },
  {
    title: "8. Changes to Terms",
    content: "We reserve the right to modify or replace these Terms at any time. We will provide reasonable notice of any significant changes by updating the 'Last updated' date at the bottom of this page. Your continued use of the Service after any changes constitutes your acceptance of the new Terms.",
  },
  {
    title: "9. Governing Law",
    content: "These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes relating to these terms will be subject to the exclusive jurisdiction of the courts of India.",
  },
];

export default function TermsPage() {
  return (
    <div className="flex flex-col flex-1 bg-(--background) font-sans text-(--foreground)">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-dust-grey mb-8">
          <Link href="/" className="hover:text-spicy-paprika transition-colors">Home</Link>
          <span>/</span>
          <span className="text-(--foreground) font-semibold">Terms of Service</span>
        </nav>

        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-stormy-teal/10 border border-stormy-teal/20 mb-5">
            <svg className="w-8 h-8 text-stormy-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-(--foreground) mb-4">
            Terms of Service
          </h1>
          <p className="text-base text-(--text-secondary) max-w-2xl mx-auto leading-relaxed">
            Please read these Terms carefully before using Chai Charcha. By using our service, you agree to these terms.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-dust-grey border border-(--card-border) rounded-full px-4 py-1.5 bg-(--card-background)">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Effective date: 1 May 2026 · Last updated: 24 May 2026
          </div>
        </div>

        {/* Quick Nav */}
        <div className="rounded-2xl border border-(--card-border) bg-(--card-background) p-5 mb-8 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-dust-grey mb-3">Quick Navigation</p>
          <div className="flex flex-wrap gap-2">
            {terms.map((t) => (
              <a
                key={t.title}
                href={`#${t.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                className="text-xs rounded-full border border-(--input-border) bg-(--input-bg)/30 px-3 py-1.5 text-(--text-secondary) hover:text-spicy-paprika hover:border-spicy-paprika/30 transition-all"
              >
                {t.title}
              </a>
            ))}
          </div>
        </div>

        {/* Terms Sections */}
        <div className="flex flex-col gap-6">
          {terms.map((term) => (
            <div
              key={term.title}
              id={term.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
              className="rounded-2xl border border-(--card-border) bg-(--card-background) p-6 shadow-sm scroll-mt-6"
            >
              <h2 className="text-base font-bold text-(--foreground) mb-3">{term.title}</h2>
              {term.content && (
                <p className="text-sm text-(--text-secondary) leading-relaxed">{term.content}</p>
              )}
              {term.list && (
                <ul className="flex flex-col gap-2">
                  {term.list.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-(--text-secondary)">
                      <svg className="w-4 h-4 shrink-0 mt-0.5 text-stormy-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
        <div className="mt-10 rounded-2xl border border-(--card-border) bg-linear-to-r from-stormy-teal/5 to-orange/5 p-6 text-center">
          <p className="text-sm text-(--text-secondary) mb-4">Have questions about our Terms of Service?</p>
          <Link
            href="/feedback"
            className="inline-flex items-center gap-2 rounded-full bg-stormy-teal px-6 py-2.5 text-sm font-bold text-floral-white shadow-lg hover:opacity-90 transition-all hover:scale-105 active:scale-95"
          >
            Contact Us
          </Link>
        </div>

      </div>
    </div>
  );
}
