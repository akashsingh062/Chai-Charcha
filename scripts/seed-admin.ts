/**
 * One-time script to promote an existing user to admin role.
 * 
 * Usage:
 *   npx tsx scripts/seed-admin.ts --email="admin@example.com"
 *   npx tsx scripts/seed-admin.ts --username="admin_user"
 */

import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Load environment variables from .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8");
  envConfig.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const firstEqual = trimmed.indexOf("=");
      if (firstEqual !== -1) {
        const key = trimmed.substring(0, firstEqual).trim();
        const value = trimmed.substring(firstEqual + 1).trim().replace(/^['"]|['"]$/g, "");
        process.env[key] = value;
      }
    }
  });
}

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGODB_URI or MONGO_URI not found in .env.local");
  process.exit(1);
}

// Parse CLI arguments
const args = process.argv.slice(2);
let email: string | null = null;
let username: string | null = null;

for (const arg of args) {
  if (arg.startsWith("--email=")) {
    email = arg.split("=")[1];
  } else if (arg.startsWith("--username=")) {
    username = arg.split("=")[1];
  }
}

if (!email && !username) {
  console.error("❌ Please provide --email or --username");
  console.log('Example: npx tsx scripts/seed-admin.ts --email="admin@example.com"');
  process.exit(1);
}

async function seedAdmin() {
  try {
    await mongoose.connect(MONGO_URI!);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    if (!db) {
      console.error("❌ Database connection not established");
      process.exit(1);
    }

    // Query the user collection directly (better-auth uses 'user' collection)
    const userCollection = db.collection("user");

    const query = email ? { email: email.toLowerCase() } : { username: username!.toLowerCase() };
    const user = await userCollection.findOne(query);

    if (!user) {
      console.error(`❌ User not found with ${email ? `email: ${email}` : `username: ${username}`}`);
      process.exit(1);
    }

    if (user.role === "admin") {
      console.log(`ℹ️  User "${user.name}" (${user.email}) is already an admin.`);
      process.exit(0);
    }

    await userCollection.updateOne({ _id: user._id }, { $set: { role: "admin" } });
    console.log(`✅ Successfully promoted "${user.name}" (${user.email}) to admin!`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Role: member → admin`);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("📡 Disconnected from MongoDB");
  }
}

seedAdmin();
