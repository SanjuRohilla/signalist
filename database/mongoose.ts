
import dns from "node:dns";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

declare global {
    var mongooseCache: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    };
}

let cached = global.mongooseCache;

if (!cached) {
    cached = global.mongooseCache = {
        conn: null,
        promise: null,
    };
}

export const connectToDatabase = async () => {
    if (!MONGODB_URI) {
        throw new Error("MONGODB_URI must be set within .env");
    }

    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        // Set DNS before starting MongoDB connection
        dns.setServers(["1.1.1.1", "1.0.0.1"]);

        cached.promise = mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (err) {
        console.error("MongoDB connection failed:", err);
        cached.promise = null;
        throw err;
    }

    return cached.conn;
};
