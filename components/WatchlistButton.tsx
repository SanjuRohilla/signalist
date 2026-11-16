
"use client";

import React, { useState } from "react";
import { toggleWatchlist } from "@/lib/actions/watchlist.actions";

interface WatchlistButtonProps {
    symbol: string;
    company: string;
    isInWatchlist: boolean;
    showTrashIcon?: boolean;
    type?: "button" | "icon";
    onWatchlistChange?: (symbol: string, added: boolean) => void;
}

const WatchlistButton = ({
                             symbol,
                             company,
                             isInWatchlist,
                             showTrashIcon = false,
                             type = "button",
                             onWatchlistChange,
                         }: WatchlistButtonProps) => {
    const [added, setAdded] = useState(isInWatchlist);
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        if (loading) return;

        setLoading(true);

        try {
            const next = !added;

            const result = await toggleWatchlist(
                symbol,
                company,
                next
            );

            if (!result.success) {
                alert(result.error || "Unable to update watchlist");
                return;
            }

            setAdded(next);
            onWatchlistChange?.(symbol, next);
        } catch (error) {
            console.error("Watchlist button error:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (type === "icon") {
        return (
            <button
                type="button"
                onClick={handleClick}
                disabled={loading}
                title={added ? "Remove from watchlist" : "Add to watchlist"}
                aria-label={added ? "Remove from watchlist" : "Add to watchlist"}
                className={`watchlist-icon-btn ${
                    added ? "watchlist-icon-added" : ""
                }`}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill={added ? "#FACC15" : "none"}
                    stroke="#FACC15"
                    strokeWidth="1.5"
                    className="watchlist-star"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557L3.04 10.385a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.125-5.111z"
                    />
                </svg>
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={loading}
            className={`watchlist-btn ${
                added ? "watchlist-remove" : ""
            }`}
        >
            {loading
                ? "Please wait..."
                : added
                    ? "Remove from Watchlist"
                    : "Add to Watchlist"}
        </button>
    );
};

export default WatchlistButton;
