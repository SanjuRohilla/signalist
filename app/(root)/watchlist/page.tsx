
import { Suspense } from "react";
import { connection } from "next/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import { getAuth } from "@/lib/better-auth/auth";
import { connectToDatabase } from "@/database/mongoose";
import { Watchlist } from "@/database/models/watchlist.model";
import { removeWatchlistStock } from "@/lib/actions/watchlist.actions";

async function WatchlistContent() {
    await connection();

    const auth = await getAuth();

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user?.id) {
        redirect("/sign-in");
    }

    await connectToDatabase();

    const stocks = await Watchlist.find({
        userId: session.user.id,
    })
        .sort({ addedAt: -1 })
        .lean();

    return (
        <main className="min-h-screen px-5 py-8 text-white md:px-10">
            <div className="mx-auto max-w-7xl">

                <div className="mb-10">
                    <p className="mb-2 text-sm font-medium text-green-400">
                        YOUR PERSONAL PORTFOLIO
                    </p>
                    <h1 className="text-3xl font-bold md:text-4xl">
                        My Watchlist
                    </h1>
                    <p className="mt-3 text-gray-400">
                        Keep track of the stocks that matter to you.
                    </p>
                </div>

                <div className="mb-8 rounded-xl border border-white/10 bg-[#111] p-6">
                    <p className="text-sm text-gray-400">
                        Total Stocks Tracking
                    </p>
                    <p className="mt-2 text-3xl font-bold">
                        {stocks.length}
                    </p>
                </div>

                <div className="overflow-hidden rounded-xl border border-white/10 bg-[#111]">
                    <div className="flex items-center justify-between border-b border-white/10 p-5">
                        <h2 className="text-lg font-semibold">Your Stocks</h2>
                        <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-400">
              {stocks.length} Assets
            </span>
                    </div>

                    {stocks.length === 0 ? (
                        <div className="px-5 py-20 text-center">
                            <div className="mb-4 text-5xl">☆</div>
                            <h3 className="text-xl font-semibold">
                                Your watchlist is empty
                            </h3>
                            <p className="mt-2 text-sm text-gray-400">
                                Search for stocks and add them to your watchlist.
                            </p>
                            <Link
                                href="/search"
                                className="mt-6 inline-block rounded-lg bg-green-500 px-5 py-3 font-medium text-black hover:bg-green-400"
                            >
                                Explore Stocks
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.03] text-xs uppercase text-gray-400">
                                <tr>
                                    <th className="px-6 py-4">Company</th>
                                    <th className="px-6 py-4">Symbol</th>
                                    <th className="px-6 py-4">Date Added</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                                </thead>

                                <tbody className="divide-y divide-white/10">
                                {stocks.map((stock) => (
                                    <tr
                                        key={stock._id.toString()}
                                        className="transition hover:bg-white/[0.03]"
                                    >
                                        <td className="px-6 py-5 font-medium">
                                            {stock.company}
                                        </td>
                                        <td className="px-6 py-5">
                                            <Link
                                                href={`/stocks/${encodeURIComponent(stock.symbol)}`}
                                                className="rounded-md bg-white/10 px-3 py-1 text-sm font-semibold hover:text-green-400"
                                            >
                                                {stock.symbol}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-5 text-sm text-gray-400">
                                            {new Date(stock.addedAt).toLocaleDateString(
                                                "en-IN",
                                                {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                }
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <form action={removeWatchlistStock}>
                                                <input
                                                    type="hidden"
                                                    name="symbol"
                                                    value={stock.symbol}
                                                />
                                                <button
                                                    type="submit"
                                                    className="rounded-lg border border-red-500/20 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
                                                >
                                                    Remove
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

export default function WatchlistPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen p-10 text-white">
                    Loading your watchlist...
                </div>
            }
        >
            <WatchlistContent />
        </Suspense>
    );
}


