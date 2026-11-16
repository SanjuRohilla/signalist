

'use server';

import { headers } from "next/headers";
import { getAuth } from "@/lib/better-auth/auth";
import { inngest } from "@/lib/inngest/client";
import { connectToDatabase } from "@/database/mongoose";

export type UserForNewsEmail = {
    id: string;
    email: string;
    name: string;
};

export const getAllUsersForNewsEmail = async (): Promise<UserForNewsEmail[]> => {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;

        if (!db) {
            throw new Error("Mongoose connection not connected");
        }

        const users = await db.collection("user").find(
            {
                email: { $exists: true, $ne: null },
            },
            {
                projection: {
                    _id: 1,
                    id: 1,
                    email: 1,
                    name: 1,
                },
            }
        ).toArray();

        return users
            .filter(
                (user) =>
                    typeof user.email === "string" &&
                    typeof user.name === "string"
            )
            .map((user) => ({
                id: String(user.id || user._id),
                email: user.email as string,
                name: user.name as string,
            }));
    } catch (error) {
        console.error("Error fetching users for news email:", error);
        return [];
    }
};

export const signUpWithEmail = async ({
                                          email,
                                          password,
                                          fullName,
                                          country,
                                          investmentGoals,
                                          riskTolerance,
                                          preferredIndustry,
                                      }: SignUpFormData) => {
    try {
        const auth = await getAuth();

        const response = await auth.api.signUpEmail({
            body: {
                email,
                password,
                name: fullName,
            },
            headers: await headers(),
        });

        if (response) {
            await inngest.send({
                name: "app/user.created",
                data: {
                    email,
                    name: fullName,
                    country,
                    investmentGoals,
                    riskTolerance,
                    preferredIndustry,
                },
            });
        }

        return {
            success: true,
            data: response,
        };
    } catch (error) {
        console.error("Sign up failed", error);

        return {
            success: false,
            error: "Sign up failed",
        };
    }
};

export const signInWithEmail = async ({
                                          email,
                                          password,
                                      }: SignInFormData) => {
    try {
        const auth = await getAuth();

        const response = await auth.api.signInEmail({
            body: {
                email,
                password,
            },
            headers: await headers(),
        });

        return {
            success: true,
            data: response,
        };
    } catch (error) {
        console.error("Sign in failed", error);

        return {
            success: false,
            error: "Sign in failed",
        };
    }
};

export const signOut = async () => {
    try {
        const auth = await getAuth();

        await auth.api.signOut({
            headers: await headers(),
        });

        return {
            success: true,
        };
    } catch (error) {
        console.error("Sign out failed", error);

        return {
            success: false,
            error: "Sign out failed",
        };
    }
};
