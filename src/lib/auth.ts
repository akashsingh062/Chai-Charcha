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
  }
});