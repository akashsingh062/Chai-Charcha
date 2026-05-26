"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Footer = () => {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname === "/messages") return null;
  return (
    <footer className="w-full bg-(--nav-bg) border-t border-(--nav-border) text-(--foreground) transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-8 border-b border-(--divider-color)">
          
          <div className="lg:col-span-4 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <div className="relative w-9 h-9 transition-transform duration-300 group-hover:rotate-12">
                <Image 
                  src="/chai.svg" 
                  alt="Chai Charcha Logo" 
                  fill
                  className="object-contain" 
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-(--foreground) group-hover:text-vivid-tangerine transition-colors">
                  Chai <span className="text-spicy-paprika">Charcha</span>
                </span>
                <span className="text-[8px] font-mono tracking-widest text-(--nav-subtitle) uppercase">
                  Charcha Forum
                </span>
              </div>
            </Link>
            
            <p className="text-xs text-(--text-secondary) leading-relaxed max-w-sm">
              The premier community-driven hub for all topics. Join nested discussions, evaluate career growth, and share advice over hot chai and charcha.
            </p>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-dust-grey">Community</h3>
            <ul className="flex flex-col gap-2 text-xs">
              <li>
                <Link href="/" className="text-(--text-secondary) hover:text-spicy-paprika transition-colors">
                  All Discussions
                </Link>
              </li>
              <li>
                <Link href="/communities" className="text-(--text-secondary) hover:text-spicy-paprika transition-colors flex items-center gap-1">
                  <span>Explore Communities</span>
                  <svg className="w-3 h-3 text-dust-grey shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582" />
                  </svg>
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-(--text-secondary) hover:text-spicy-paprika transition-colors">
                  Search Discussions
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-dust-grey">Resources</h3>
            <ul className="flex flex-col gap-2 text-xs">
              <li>
                <Link href="/code-of-conduct" className="text-(--text-secondary) hover:text-stormy-teal transition-colors">
                  Code of Conduct
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-(--text-secondary) hover:text-stormy-teal transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-(--text-secondary) hover:text-stormy-teal transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/feedback" className="text-(--text-secondary) hover:text-stormy-teal transition-colors">
                  Feedback Portal
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-dust-grey">Connect with the Club</h3>
            <p className="text-xs text-(--text-secondary) leading-relaxed">
              Stay in the loop with dev AMAs, newsletter releases, and trending community discussions.
            </p>
            
            <div className="flex items-center gap-3 mt-2">
              
              <Link 
                href="https://github.com/akashsingh062" 
                target="_blank" 
                rel="noopener noreferrer"
                className="rounded-full border border-(--input-border) bg-(--input-bg) p-2.5 text-(--btn-icon-text) hover:text-(--btn-icon-hover-text) hover:bg-(--btn-icon-hover-bg) hover:scale-110 active:scale-95 transition-all duration-200"
                aria-label="GitHub"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" stroke="none">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
              </Link>

              <Link 
                href="https://twitter.com/akashsingh062" 
                target="_blank" 
                rel="noopener noreferrer"
                className="rounded-full border border-(--input-border) bg-(--input-bg) p-2.5 text-(--btn-icon-text) hover:text-(--btn-icon-hover-text) hover:bg-(--btn-icon-hover-bg) hover:scale-110 active:scale-95 transition-all duration-200"
                aria-label="Twitter"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" stroke="none">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </Link>

              <Link 
                href="https://linkedin.com/in/akashsingh062" 
                target="_blank" 
                rel="noopener noreferrer"
                className="rounded-full border border-(--input-border) bg-(--input-bg) p-2.5 text-(--btn-icon-text) hover:text-(--btn-icon-hover-text) hover:bg-(--btn-icon-hover-bg) hover:scale-110 active:scale-95 transition-all duration-200"
                aria-label="LinkedIn"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" stroke="none">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </Link>

            </div>
          </div>

        </div>

        <div className="mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-dust-grey">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              © 2026 Chai Charcha. Crafted with
              <svg className="w-3.5 h-3.5 text-orange shrink-0 inline-block align-text-bottom mx-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v2a2 2 0 01-2 2h-2v-4z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h14v7a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v2M10 3v2M14 3v2" />
              </svg>
              for Charcha & Community.
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline border border-(--card-border) bg-(--background) px-2 py-0.5 rounded-md font-mono text-[9px]">
              Next.js 16.2.6 & React 19
            </span>
            <Link 
              href="https://github.com/akashsingh062/coderun" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-(--foreground) transition-colors"
            >
              Repository
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;