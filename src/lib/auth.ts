import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

const client = new MongoClient(process.env.MONGO_URI! as string);
const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client
  }),
  emailAndPassword: { 
    enabled: true, 
  }, 
  
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: false,
      },
      avatar: {
        type: "string",
        required: false,
      },
      bio: {
        type: "string",
        required: false,
        defaultValue: "Hello, I'm new to chai and charcha",
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "member",
      },
      karma: {
        type: "number",
        required: false,
        defaultValue: 0,
      },
      joinedCommunities: {
        type: "string",
        required: false,
      },
    }
  },
  socialProviders: {
    google: { 
      clientId: process.env.GOOGLE_CLIENT_ID as string, 
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
    }, 
    github: { 
      clientId: process.env.GITHUB_CLIENT_ID as string, 
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string, 
    }, 
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          let baseUsername = "";
          if (user.name) {
            baseUsername = user.name.toLowerCase().replace(/[^a-z0-9_]/g, "");
          }
          if (!baseUsername && user.email) {
            baseUsername = user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
          }
          if (!baseUsername) {
            baseUsername = "user";
          }
          // Enforce only alphanumeric and underscores matching /^[a-zA-Z0-9_]+$/
          baseUsername = baseUsername.replace(/[^a-zA-Z0-9_]/g, "");
          
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          const finalUsername = user.username || `${baseUsername}_${randomSuffix}`;

          return {
            data: {
              ...user,
              username: finalUsername,
              avatar: user.avatar || user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${finalUsername}`,
              bio: user.bio || "Hello, I'm new to chai and charcha",
              role: user.role || "member",
              karma: typeof user.karma === 'number' ? user.karma : 0,
              joinedCommunities: user.joinedCommunities || "[]",
            }
          };
        }
      }
    }
  }

});