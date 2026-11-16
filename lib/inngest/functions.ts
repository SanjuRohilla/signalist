
import { inngest } from "@/lib/inngest/client";

import {
    NEWS_SUMMARY_EMAIL_PROMPT,
    PERSONALIZED_WELCOME_EMAIL_PROMPT,
} from "@/lib/inngest/prompts";

import {
    sendNewsSummaryEmail,
    sendWelcomeEmail,
} from "@/lib/nodemailer";

import { getAllUsersForNewsEmail } from "@/lib/actions/user.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getNews } from "@/lib/actions/finnhub.actions";
import { getFormattedTodayDate } from "@/lib/utils";

// ==========================================
// FUNCTION 1: SEND SIGN-UP WELCOME EMAIL
// ==========================================

export const sendSignUpEmail = inngest.createFunction(
    {
        id: "sign-up-email",
        triggers: [{ event: "app/user.created" }],
    },

    async ({ event, step }) => {
        const userProfile = `
      - Country: ${event.data.country}
      - Investment goals: ${event.data.investmentGoals}
      - Risk tolerance: ${event.data.riskTolerance}
      - Preferred industry: ${event.data.preferredIndustry}
    `;

        const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
            "{{userProfile}}",
            userProfile
        );

        const response = await step.ai.infer("generate-welcome-intro", {
            model: step.ai.models.gemini({
                model: "gemini-3.5-flash-lite",
            }),
            body: {
                contents: [
                    {
                        role: "user",
                        parts: [{ text: prompt }],
                    },
                ],
            },
        });

        await step.run("send-welcome-email", async () => {
            const part = response.candidates?.[0]?.content?.parts?.[0];

            const introText =
                (part && "text" in part ? part.text : null) ||
                "Thanks for joining Signalist. You now have the tools to track markets and make smarter moves.";

            const { data: { email, name } } = event;

            return await sendWelcomeEmail({
                email,
                name,
                intro: introText,
            });
        });

        return {
            success: true,
            message: "Welcome email sent successfully",
        };
    }
);

// ==========================================
// FUNCTION 2: DAILY NEWS SUMMARY EMAIL
// ==========================================

export const sendDailyNewsSummary = inngest.createFunction(
    {
        id: "daily-news-summary",
        triggers: [
            { event: "app/send.daily.news" },
            { cron: "0 12 * * *" },
        ],
    },

    async ({ step }) => {
        // Step 1: Get all users for news delivery
        const users = await step.run(
            "get-all-users",
            getAllUsersForNewsEmail
        );

        if (!users || users.length === 0) {
            return {
                success: false,
                message: "No users found for news email",
            };
        }

        // Step 2: Fetch watchlist symbols and news for each user
        const results = await step.run(
            "fetch-user-news",
            async () => {
                const perUser: Array<{
                    user: UserForNewsEmail;
                    articles: MarketNewsArticle[];
                }> = [];

                for (const user of users as UserForNewsEmail[]) {
                    try {
                        const symbols = await getWatchlistSymbolsByEmail(
                            user.email
                        );

                        let articles = await getNews(symbols);

                        // Maximum 6 articles per user
                        articles = (articles || []).slice(0, 6);

                        // Fallback to general news if watchlist news is empty
                        if (!articles || articles.length === 0) {
                            articles = await getNews();
                            articles = (articles || []).slice(0, 6);
                        }

                        perUser.push({
                            user,
                            articles,
                        });
                    } catch (error) {
                        console.error(
                            "daily-news: error preparing user news",
                            user.email,
                            error
                        );

                        perUser.push({
                            user,
                            articles: [],
                        });
                    }
                }

                return perUser;
            }
        );

        // Step 3: Generate AI news summaries
        const userNewsSummaries: {
            user: UserForNewsEmail;
            newsContent: string | null;
        }[] = [];

        for (const { user, articles } of results) {
            try {
                const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
                    "{{newsData}}",
                    JSON.stringify(articles, null, 2)
                );

                const response = await step.ai.infer(
                    `summarize-news-${user.email}`,
                    {
                        model: step.ai.models.gemini({
                            model: "gemini-3.5-flash-lite",
                        }),
                        body: {
                            contents: [
                                {
                                    role: "user",
                                    parts: [{ text: prompt }],
                                },
                            ],
                        },
                    }
                );

                const part = response.candidates?.[0]?.content?.parts?.[0];

                const newsContent =
                    (part && "text" in part ? part.text : null) ||
                    "No market news.";

                userNewsSummaries.push({
                    user,
                    newsContent,
                });
            } catch (error) {
                console.error(
                    "Failed to summarize news for:",
                    user.email,
                    error
                );

                userNewsSummaries.push({
                    user,
                    newsContent: null,
                });
            }
        }

        // Step 4: Send news summary emails
        await step.run("send-news-emails", async () => {
            await Promise.all(
                userNewsSummaries.map(
                    async ({ user, newsContent }) => {
                        if (!newsContent) return false;

                        return await sendNewsSummaryEmail({
                            email: user.email,
                            date: getFormattedTodayDate(),
                            newsContent,
                        });
                    }
                )
            );
        });

        return {
            success: true,
            message: "Daily news summary emails sent successfully",
        };
    }
);
