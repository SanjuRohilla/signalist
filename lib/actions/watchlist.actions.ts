
'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { getAuth } from '@/lib/better-auth/auth';

// 1. Get watchlist symbols using user's email
// Used by Inngest for personalized daily news emails
export async function getWatchlistSymbolsByEmail(
    email: string
): Promise<string[]> {
    if (!email) return [];

    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;

        if (!db) {
            throw new Error('MongoDB connection not found');
        }

        // Find user from Better Auth collection
        const user = await db.collection('user').findOne<{
            _id?: unknown;
            id?: string;
            email?: string;
        }>({ email });

        if (!user) return [];

        const userId = user.id || String(user._id || '');

        if (!userId) return [];

        // Fetch user's watchlist symbols
        const items = await Watchlist.find(
            { userId },
            { symbol: 1, _id: 0 }
        ).lean();

        return items.map((item) => String(item.symbol));
    } catch (error) {
        console.error('getWatchlistSymbolsByEmail error:', error);
        return [];
    }
}

// 2. Get current logged-in user's watchlist
export async function getUserWatchlist() {
    try {
        const auth = await getAuth();

        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return [];
        }

        await connectToDatabase();

        const stocks = await Watchlist.find({
            userId: session.user.id,
        })
            .sort({ addedAt: -1 })
            .lean();

        return stocks.map((stock) => ({
            id: stock._id.toString(),
            symbol: stock.symbol,
            company: stock.company,
            addedAt: stock.addedAt
                ? new Date(stock.addedAt).toISOString()
                : null,
        }));
    } catch (error) {
        console.error('getUserWatchlist error:', error);
        return [];
    }
}

// 3. Remove stock from current user's watchlist
export async function removeWatchlistStock(formData: FormData) {
    try {
        const symbol = String(formData.get('symbol') || '')
            .trim()
            .toUpperCase();

        if (!symbol) {
            throw new Error('Invalid stock symbol');
        }

        const auth = await getAuth();

        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            throw new Error('Please sign in first');
        }

        await connectToDatabase();

        const result = await Watchlist.deleteOne({
            userId: session.user.id,
            symbol,
        });

        revalidatePath('/watchlist');

        return {
            success: true,
            deleted: result.deletedCount > 0,
        };
    } catch (error) {
        console.error('removeWatchlistStock error:', error);

        return {
            success: false,
            error: 'Failed to remove stock from watchlist',
        };
    }
}

export async function toggleWatchlist(
    symbol: string,
    company: string,
    add: boolean
) {
    try {
        const auth = await getAuth();

        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            throw new Error("Please sign in first");
        }

        await connectToDatabase();

        const normalizedSymbol = symbol.trim().toUpperCase();

        if (add) {
            await Watchlist.updateOne(
                {
                    userId: session.user.id,
                    symbol: normalizedSymbol,
                },
                {
                    $set: { company },
                    $setOnInsert: {
                        userId: session.user.id,
                        symbol: normalizedSymbol,
                        addedAt: new Date(),
                    },
                },
                { upsert: true }
            );
        } else {
            await Watchlist.deleteOne({
                userId: session.user.id,
                symbol: normalizedSymbol,
            });
        }

        revalidatePath("/watchlist");

        return { success: true };
    } catch (error) {
        console.error("toggleWatchlist error:", error);
        return { success: false, error: "Unable to update watchlist" };
    }
}
