import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { GlobalCreatePostModal } from "@/components/shared/GlobalCreatePostModal";
import { ToastContainer } from "@/components/shared/ToastContainer";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://chai-charcha.vercel.app"),
  title: {
    default: "Chai Charcha - General Discussion & Charcha Forum",
    template: "%s | Chai Charcha",
  },
  description:
    "The premier community-driven hub for all topics. Join nested discussions, evaluate career growth, and share advice over hot chai and charcha.",
  keywords: [
    "chai charcha",
    "discussion community",
    "career advice",
    "discussion forum",
    "creative solutions",
    "diverse discussions",
    "nesting discussions",
    "open debates",
  ],
  icons: {
    icon: "/chai.svg",
    shortcut: "/chai.svg",
    apple: "/chai.svg",
  },
  openGraph: {
    title: "Chai Charcha - General Discussion & Charcha Forum",
    description: "The premier community-driven hub for all topics. Join nested discussions, evaluate career growth, and share advice over hot chai and charcha.",
    url: "https://chai-charcha.vercel.app",
    siteName: "Chai Charcha",
    images: [
      {
        url: "/chai.svg",
        width: 1200,
        height: 630,
        alt: "Chai Charcha Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chai Charcha - General Discussion & Charcha Forum",
    description: "The premier community-driven hub for all topics. Join nested discussions, evaluate career growth, and share advice over hot chai and charcha.",
    images: ["/chai.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const schemaJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://chai-charcha.vercel.app/#website",
        "name": "Chai Charcha",
        "url": "https://chai-charcha.vercel.app/",
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://chai-charcha.vercel.app/?s={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "Organization",
        "@id": "https://chai-charcha.vercel.app/#organization",
        "name": "Chai Charcha",
        "url": "https://chai-charcha.vercel.app/",
        "logo": {
          "@type": "ImageObject",
          "url": "https://chai-charcha.vercel.app/chai.svg"
        },
        "description": "India's premier open discussion community and charcha forum.",
        "sameAs": [
          "https://github.com/akashsingh062/coderun"
        ]
      }
    ]
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schemaJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.error('Service worker registration failed:', err);
                  });
                });
              }
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <AuthProvider>
            <Navbar />
            {children}
            <GlobalCreatePostModal />
            <ToastContainer />
            <Footer />
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
