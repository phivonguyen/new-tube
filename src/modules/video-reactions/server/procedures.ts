import { db } from "@/db";
import { videoReactions } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const videoReactionsRouter = createTRPCRouter({
    like: protectedProcedure
        .input(z.object({ videoId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { videoId } = input;
            const { id: userId } = ctx.user;

            const [existingVideoReaction] = await db
                .select()
                .from(videoReactions)
                .where(and(
                    eq(videoReactions.videoId, videoId),
                    eq(videoReactions.userId, userId),
                    eq(videoReactions.type, 'like')
                ));

            if (existingVideoReaction) {
                const [deletedVideoReaction] = await db
                    .delete(videoReactions)
                    .where(
                        and(
                            eq(videoReactions.videoId, videoId),
                            eq(videoReactions.userId, userId),
                        )
                    )
                    .returning();

                return deletedVideoReaction;
            }

            const [createdVideoReaction] = await db
                .insert(videoReactions)
                .values({
                    userId,
                    videoId,
                    type: 'like',
                })
                //When user already reacted with dislike, update the reaction to like
                .onConflictDoUpdate({
                    target: [videoReactions.videoId, videoReactions.userId],
                    set: { type: 'like' },
                })
                .returning();

            return createdVideoReaction;
        }),

    dislike: protectedProcedure
        .input(z.object({ videoId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { videoId } = input;
            const { id: userId } = ctx.user;

            const [existingVideoReactionDislike] = await db
                .select()
                .from(videoReactions)
                .where(and(
                    eq(videoReactions.videoId, videoId),
                    eq(videoReactions.userId, userId),
                    eq(videoReactions.type, 'dislike')
                ));

            if (existingVideoReactionDislike) {
                const [deletedVideoReaction] = await db
                    .delete(videoReactions)
                    .where(
                        and(
                            eq(videoReactions.videoId, videoId),
                            eq(videoReactions.userId, userId),
                        )
                    )
                    .returning();

                return deletedVideoReaction;
            }

            const [createdVideoReaction] = await db
                .insert(videoReactions)
                .values({
                    userId,
                    videoId,
                    type: 'dislike',
                })
                //When user already reacted with like, update the reaction to dislike
                .onConflictDoUpdate({
                    target: [videoReactions.videoId, videoReactions.userId],
                    set: { type: 'dislike' },
                })
                .returning();

            return createdVideoReaction;
        }),
});