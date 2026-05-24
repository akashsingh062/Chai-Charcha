# ☕ Chai Charcha

<div align="center">

  **The Digital Coffeehouse for People to Connect, Discuss, and Collaborate.**

  [![Live Demo](https://img.shields.io/badge/Live_Demo-Active-orange?style=for-the-badge&logo=vercel)](https://chai-charcha.vercel.app)
  [![Next.js Version](https://img.shields.io/badge/Next.js-16.2-orange?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
  [![React Version](https://img.shields.io/badge/React-19.0-blue?style=for-the-badge&logo=react)](https://react.dev)
  [![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)
  [![Better Auth](https://img.shields.io/badge/Better--Auth-Secure-8b5cf6?style=for-the-badge)](https://better-auth.com)
  [![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](https://opensource.org/licenses/MIT)

  Live Application: [**chai-charcha.vercel.app**](https://chai-charcha.vercel.app)

</div>

---

## 📖 Introduction

**Chai Charcha** is a modern, full-stack, community-driven discussion platform inspired by classic forums and modern social network ecosystems. Built with the cutting-edge **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **MongoDB**, Chai Charcha is optimized for swift, responsive interactions enveloped in a premium glassmorphic UI.

Whether you want to share a hot take over a virtual cup of tea (Chai), join specialized interest guilds (Communities), upvote insightful discussions (Charchas), follow fellow users, or send real-time direct messages, Chai Charcha delivers an immersive, robust digital hub for any community to gather.

---

## 🚀 Key Highlights & Feature Set

### 💬 Discussion Engine (Charchas)
- **Rich Thread Creation**: Create posts inside community guilds with formatting support.
- **Nested Discussions**: Multi-level nested comments and replies to keep conversation threads clean and logical.
- **Dynamic Voting**: Custom upvote/downvote engine for both threads and comments, directly affecting the author's overall **Karma** reputation.

### 👥 Social Network & Connection Layer
- **Guilds / Communities**: Create, customize, and join niche interest groups to curate your personalized home feed.
- **Social Connection**: Robust Follower/Following system to network with peers.
- **User Profiles**: Sleek, customizable personal portfolios highlighting bio, social links, karma levels, and recent activity.
- **Direct Messaging**: Connect 1-on-1 with an inline, real-time message stream.

### 🛡️ Enterprise-Grade Moderation & Role System (RBAC)
- **Tri-Tier Role System**: Native support for `Member`, `Moderator`, and `Admin` roles.
- **Secure Route Protection**: Specialized server-side logic (`requireAuth`, `requireAdmin`, `requireMod`) and client-side guards to keep unauthorized users out of admin/moderator sections.
- **Mod Panel & Admin Panel**: Fully dedicated dashboards for managing users, promoting moderators, managing communities, and inspecting user profiles.
- **Reporting Workflow**: Flag inappropriate content for review by moderators.
- **Immutable Audit Logs**: Automatically track and document all critical admin and moderator actions (bans, role changes, community deletions).

### ⚡ Technical Performance & UX
- **No More Stale Auth States**: Safe `userData` guards prevent unauthenticated API requests (preventing stray 401s in console) and gracefully trigger toast warnings.
- **Polling-Based Alerts**: Instant unread count indicators in the Navigation Bar for new notifications and inbox messages.
- **Stunning UI Aesthetics**: Micro-animations, harmonic HSL palettes, smooth gradients, and border gradients.

---

## 🏗️ System Architecture

```mermaid
graph TD
    Client[Next.js Client Components] <--> Zustand[Zustand Stores / Toast]
    Client <--> Context[AuthContext / useAuth]
    Client -- HTTP Request / Axios --> API[Next.js API Routes /src/app/api]
    Context <--> BetterAuthClient[Better Auth Client SDK]
    BetterAuthClient <--> BetterAuthServer[Better Auth Server Engine]
    API <--> Middleware[Auth Guards / userAuth & adminAuth]
    API <--> Mongoose[Mongoose Models]
    BetterAuthServer <--> Database[(MongoDB Database)]
    Mongoose <--> Database
```

---

## 🗄️ Database Schemas & Data Model

Chai Charcha leverages a highly structured **Mongoose** modeling paradigm to manage relational structures inside MongoDB.

| Model | Source File | Description |
| :--- | :--- | :--- |
| **User** | `src/lib/models/User.ts` | Stores credentials, profile details, bio, links, followers/following array, role, and karma rating. |
| **Community** | `src/lib/models/Community.ts` | Defines interest guilds, containing moderator arrays, rules, description, and list of joined member IDs. |
| **Post** | `src/lib/models/Post.ts` | Represents discussions (Charchas) containing references to community, author, tags, upvotes/downvotes lists. |
| **Comment** | `src/lib/models/Comment.ts` | Manages nested comments/replies inside threads, upvote tracking, and parent-child relations. |
| **Message** | `src/lib/models/Message.ts` | Stores 1-on-1 conversation elements between two authenticated users. |
| **Notification** | `src/lib/models/Notification.ts` | Stores dynamic notification alerts (replies, likes, follows, role updates) with read/unread statuses. |
| **Report** | `src/lib/models/Report.ts` | Records reports submitted by users for inappropriate posts/comments/profiles. |
| **AuditLog** | `src/lib/models/AuditLog.ts` | Immutable, automated ledger logging critical administrator and moderator events. |

---

## 🔌 API Endpoints Reference

All API routes are served securely under `/api/*` utilizing Next.js Dynamic Route Handlers.

### Authentication & Profiles
*   `GET /api/profile` - Retrieve targeted profile information.
*   `POST /api/profile/update` - Update account details (avatar, bio, links).

### Social Network
*   `POST /api/follow` - Toggle follow/unfollow status for a target user.
*   `GET /api/follow/list` - Fetch followers or following arrays.
*   `GET /api/follow/status` - Read the active follow relationship between two users.

### Discussions & Feed
*   `GET /api/posts` - Fetch combined or community-specific thread feeds.
*   `POST /api/posts` - Publish a new thread.
*   `POST /api/votes` - Cast upvote or downvote.
*   `POST /api/comments` - Submit comments and nested replies.

### Real-Time Alerts & Chats
*   `GET /api/notifications` - Fetch user notification inbox.
*   `POST /api/messages` - Send a direct message.
*   `GET /api/messages` - Retrieve message history with a specific user.

### Moderation & Administration
*   `GET /api/admin/audit-logs` - Inspect system-wide moderator actions (restricted).
*   `POST /api/admin/users/role` - Appoint moderators or update system privileges.
*   `POST /api/reports` - Report content for moderator review.

---

## 📂 Folder Directory Layout

```text
chai-charcha/
├── src/
│   ├── app/                      # Next.js App Router root
│   │   ├── (main)/               # Authenticated user spaces (feed, profile, search)
│   │   │   ├── c/[slug]/         # Community-specific thread pages
│   │   │   ├── followers/        # Network connection network UI
│   │   │   ├── messages/         # Direct messages inbox
│   │   │   └── profile/          # User profiles
│   │   ├── admin/                # Admin Panel & Mod Panel dashboards
│   │   ├── api/                  # REST API Endpoints
│   │   ├── auth/                 # Sign In, Sign Up pages
│   │   ├── globals.css           # Global core layout rules
│   │   └── layout.tsx            # Main HTML layout wrapper
│   ├── components/               # Custom modular component ecosystem
│   │   ├── admin/                # Moderation audit, user control tables
│   │   ├── profile/              # Profile cards, post lists
│   │   └── shared/               # Navbar, sidebar, report modals, toast lists
│   ├── context/                  # React Contexts (AuthContext)
│   ├── hooks/                    # Global stateful React hooks
│   ├── lib/                      # Core helpers & database configs
│   │   ├── models/               # Mongoose MongoDB schemas
│   │   ├── connectDB.ts          # Mongoose DB connector
│   │   ├── userAuth.ts           # Server-side auth requirements
│   │   └── axios.ts              # Custom pre-configured Axios instance
│   ├── store/                    # Zustand Store definitions (Toast notifications)
│   └── types/                    # Common TypeScript type definitions
├── README.md                     # Application overview document
├── tailwind.config.ts            # Tailwind configuration (v4)
└── package.json                  # Dependencies manifest
```

---

## ⚙️ Installation & Local Setup

Get Chai Charcha running on your machine in just a few steps:

### 1. Prerequisite Installations
- Ensure you have **Node.js (v20+)** installed.
- Setup a local or cloud-based **MongoDB Instance** (e.g. MongoDB Atlas).

### 2. Clone and Install
```bash
git clone https://github.com/your-username/chai-charcha.git
cd chai-charcha
npm install
```

### 3. Local Environment Variables Configuration
Create a `.env.local` file at the root folder of your project and configure the variables:

```env
# Database Credentials
MONGODB_URI=mongodb+srv://<db_user>:<db_password>@cluster.mongodb.net/chai-charcha?retryWrites=true&w=majority

# Better-Auth Secret (Generate a secure key via `openssl rand -hex 32`)
BETTER_AUTH_SECRET=your_super_strong_custom_random_hex_secret

# Base URLs
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Running the Dev Environment
```bash
npm run dev
```
Open your browser and point it to [**`http://localhost:3000`**](http://localhost:3000).

---

## 🎨 Visual Preview

Below is a gallery of the Chai Charcha application interface.

### 🏠 Home Feed & Interactive Discussions
<p align="center">
  <img src="appScreenShots/screenshot_01.png" width="48%" alt="Home Dashboard" />
  <img src="appScreenShots/screenshot_02.png" width="48%" alt="Discussion Feed" />
</p>
<p align="center">
  <img src="appScreenShots/screenshot_03.png" width="48%" alt="Guild Posts" />
  <img src="appScreenShots/screenshot_04.png" width="48%" alt="Create Post Dialog" />
</p>

### 💬 Nested Comments, Replies & Active Communities
<p align="center">
  <img src="appScreenShots/screenshot_05.png" width="48%" alt="Nested Comments" />
  <img src="appScreenShots/screenshot_06.png" width="48%" alt="Guild Navigation" />
</p>
<p align="center">
  <img src="appScreenShots/screenshot_07.png" width="48%" alt="User Interaction" />
  <img src="appScreenShots/screenshot_08.png" width="48%" alt="Community Guild Page" />
</p>

### 👥 User Profiles, Network Connections & Messaging
<p align="center">
  <img src="appScreenShots/screenshot_09.png" width="48%" alt="User Profile Details" />
  <img src="appScreenShots/screenshot_10.png" width="48%" alt="Message Thread" />
</p>
<p align="center">
  <img src="appScreenShots/screenshot_11.png" width="48%" alt="Direct Message Chatbox" />
  <img src="appScreenShots/screenshot_12.png" width="48%" alt="Followers Network" />
</p>
<p align="center">
  <img src="appScreenShots/screenshot_13.png" width="48%" alt="User Connections" />
  <img src="appScreenShots/screenshot_14.png" width="48%" alt="Profile Activity" />
</p>

### 🛡️ Moderation Boards & Administration Dashboards
<p align="center">
  <img src="appScreenShots/screenshot_15.png" width="48%" alt="Mod Panel" />
  <img src="appScreenShots/screenshot_16.png" width="48%" alt="User Management Panel" />
</p>
<p align="center">
  <img src="appScreenShots/screenshot_17.png" width="48%" alt="Ban / Suspend Form" />
  <img src="appScreenShots/screenshot_18.png" width="48%" alt="Immutable Audit Logs" />
</p>
<p align="center">
  <img src="appScreenShots/screenshot_19.png" width="48%" alt="System Reports" />
  <img src="appScreenShots/screenshot_20.png" width="48%" alt="Detailed User Inspection" />
</p>

---

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
