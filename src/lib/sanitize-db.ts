import fs from "fs";
import path from "path";
import { MongoClient } from "mongodb";

// Parse .env.local manually
const envPath = path.join(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error(".env.local file not found at:", envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf8");
const envVars: Record<string, string> = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : "";
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    envVars[match[1]] = value;
  }
});

const uri = envVars.MONGO_URI || envVars.MONGODB_URI;
if (!uri) {
  console.error("MONGO_URI or MONGODB_URI not found in envVars.");
  process.exit(1);
}

async function run() {
  console.log("Connecting to database at:", uri);
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const postsCol = db.collection("posts");

    console.log("Checking for posts with invalid or undefined categories...");
    
    const badPosts = await postsCol.find({
      $or: [
        { category: "undefined" },
        { category: "null" },
        { category: null },
        { category: { $exists: false } }
      ]
    }).toArray();

    console.log(`Found ${badPosts.length} posts requiring sanitization.`);

    if (badPosts.length > 0) {
      const result = await postsCol.updateMany(
        {
          $or: [
            { category: "undefined" },
            { category: "null" },
            { category: null },
            { category: { $exists: false } }
          ]
        },
        { $set: { category: "General Charcha" } }
      );
      console.log(`Successfully updated ${result.modifiedCount} posts to "General Charcha".`);
    } else {
      console.log("Database is already fully sanitized.");
    }
  } catch (err) {
    console.error("Error during database sanitization:", err);
  } finally {
    await client.close();
  }
}

run();
