export interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  content: string;
  upvotes: number;
  timeAgo: string;
  replies?: Comment[];
}

export interface Thread {
  id: string;
  title: string;
  excerpt: string;
  author: {
    id?: string;
    username?: string;
    name: string;
    avatar: string;
    role: string;
    reputation: number;
  };
  category: string;
  tags: string[];
  upvotes: number;
  commentsCount: number;
  views: number;
  timeAgo: string;
  userVoted?: "up" | "down" | null;
  comments?: Comment[];
}

export const SAMPLE_POSTS: Thread[] = [
  {
    id: "p1",
    title: "Is migrating from Next.js Pages router to App router worth the complexity in 2026?",
    excerpt: "We spent 3 months transitioning our core discussion dashboard. While React Server Components improved initial load times significantly, routing state and layouts introduced edge cases in client-side context state. Here is our checklist before you make the jump.",
    author: {
      name: "Akash Singh",
      avatar: "AS",
      role: "Lead Engineer",
      reputation: 490,
    },
    category: "Tech & Architecture",
    tags: ["nextjs", "react", "architecture"],
    upvotes: 42,
    commentsCount: 2,
    views: 320,
    timeAgo: "3 hours ago",
    comments: [
      {
        id: "c1_1",
        author: {
          name: "Priya Patel",
          avatar: "PP",
          role: "Frontend Lead",
        },
        content: "We had this exact debate last week. The layout specificity issues are real when dealing with dynamic styling overlays. Found that wrapping layout routes in simple, isolated client-side providers saved us.",
        upvotes: 14,
        timeAgo: "2 hours ago",
        replies: [
          {
            id: "r1_1_1",
            author: {
              name: "Akash Singh",
              avatar: "AS",
              role: "Lead Engineer",
            },
            content: "Completely agree, Priya! Standardizing layout providers also makes hydrating local client stores a breeze.",
            upvotes: 4,
            timeAgo: "1 hour ago",
          }
        ]
      },
      {
        id: "c1_2",
        author: {
          name: "Rajesh Kumar",
          avatar: "RK",
          role: "CTO, ChaiTech",
        },
        content: "Agreed. Pages router is solid, but RSCs are really powerful if you start from scratch. For older, massive codebases, wait it out.",
        upvotes: 9,
        timeAgo: "1 hour ago",
        replies: []
      }
    ]
  },
  {
    id: "p2",
    title: "How I set up safe MongoDB connection pooling on serverless deployments (Vercel & AWS Lambda)",
    excerpt: "Serverless functions scale down to zero, causing Mongoose to constantly open and leak connections if initialized incorrectly. I built a simple helper wrapping mongoose.connect with global cache checks that completely solved our 'too many connections' database crashes.",
    author: {
      name: "Akash Singh",
      avatar: "AS",
      role: "Lead Engineer",
      reputation: 490,
    },
    category: "Tech & Architecture",
    tags: ["mongodb", "serverless", "node"],
    upvotes: 28,
    commentsCount: 2,
    views: 180,
    timeAgo: "1 day ago",
    comments: [
      {
        id: "c2_1",
        author: {
          name: "Karan Johar",
          avatar: "KJ",
          role: "Principal Architect",
        },
        content: "This global caching helper is standard practice now. Thanks for sharing the detailed code breakdown! Extremely valuable for serverless developers.",
        upvotes: 12,
        timeAgo: "18 hours ago",
        replies: [
          {
            id: "r2_1_1",
            author: {
              name: "Akash Singh",
              avatar: "AS",
              role: "Lead Engineer",
            },
            content: "Thanks Karan! I spent days debugging connection leaks before setting this up.",
            upvotes: 3,
            timeAgo: "15 hours ago",
          }
        ]
      },
      {
        id: "c2_2",
        author: {
          name: "Neha Krishnan",
          avatar: "NK",
          role: "Database Architect",
        },
        content: "I ran into the same issue with AWS Lambda. Setting standard pool sizes on serverless is essential to prevent spikes from locking up MongoDB Atlas.",
        upvotes: 7,
        timeAgo: "12 hours ago",
        replies: []
      }
    ]
  },
  {
    id: "p3",
    title: "A realistic breakdown of developer interview prep for Indian startups vs MAANG in 2026",
    excerpt: "Indian unicorn startups like Razorpay and Swiggy have completely pivoted their rounds to focus on production-ready systems engineering, low-level design patterns, and live debugging instead of pure Leetcode puzzles. Here is my 6-month study path.",
    author: {
      name: "Akash Singh",
      avatar: "AS",
      role: "Lead Engineer",
      reputation: 490,
    },
    category: "Career Prep",
    tags: ["career", "interview", "systemdesign"],
    upvotes: 56,
    commentsCount: 1,
    views: 512,
    timeAgo: "2 days ago",
    comments: [
      {
        id: "c3_1",
        author: {
          name: "Amit Sharma",
          avatar: "AS",
          role: "Staff Engineer",
        },
        content: "So true! Our team in Bangalore stopped asking brain-teaser puzzles entirely. We ask candidates to do a real system design review and a mini code refinement session instead.",
        upvotes: 22,
        timeAgo: "1 day ago",
        replies: []
      }
    ]
  },
  {
    id: "p4",
    title: "Why we chose Better-Auth for our new startup project over NextAuth / Auth.js",
    excerpt: "Better-Auth has built-in support for multiple active sessions, automatic token database hooks, robust social OAuth handlers, and extremely type-safe schema mapping. It saved us weeks of writing custom token renewal logic and session validation guards.",
    author: {
      name: "Akash Singh",
      avatar: "AS",
      role: "Lead Engineer",
      reputation: 490,
    },
    category: "Tech & Architecture",
    tags: ["auth", "better-auth", "startup"],
    upvotes: 37,
    commentsCount: 0,
    views: 290,
    timeAgo: "4 days ago",
    comments: []
  }
];

export const CATEGORIES = [
  "All",
  "Tech & Architecture",
  "Career Prep",
  "General Charcha",
  "Showcase",
];
