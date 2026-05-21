import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside your env configuration.");
}

// Declare global type definitions to prevent TypeScript compilation conflicts
declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

// Retrieve cached connection details from the Node.js global scope
// Retrieve or initialize cached connection details from the Node.js global scope
const cached = (global.mongoose || (global.mongoose = { conn: null, promise: null })) as {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log("MongoDB connection initialized successfully");
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }

  return cached.conn;
};

export default connectDB;