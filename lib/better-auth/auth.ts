

import { betterAuth } from "better-auth";
import type { BetterAuthOptions } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";

import { connectToDatabase } from "@/database/mongoose";

export const getAuth = async () => {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) {
        throw new Error("MongoDB connection not found");
    }

    const authOptions: BetterAuthOptions = {
        database: mongodbAdapter(db as any),

        secret: process.env.BETTER_AUTH_SECRET,
        baseURL: process.env.BETTER_AUTH_URL,

        emailAndPassword: {
            enabled: true,
            disableSignUp: false,
            requireEmailVerification: false,
            minPasswordLength: 8,
            maxPasswordLength: 128,
            autoSignIn: true,
        },

        plugins: [nextCookies()],
    };

    return betterAuth(authOptions);
};
