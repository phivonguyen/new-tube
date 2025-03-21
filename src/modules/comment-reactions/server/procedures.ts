import { db } from "@/db";
import { commentReactions } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const commentReactionsRouter = createTRPCRouter({
    like: protectedProcedure
        .input(z.object({ commentId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { commentId } = input;
            const { id: userId } = ctx.user;

            const [existingCommentReaction] = await db
                .select()
                .from(commentReactions)
                .where(and(
                    eq(commentReactions.commentId, commentId),
                    eq(commentReactions.userId, userId),
                    eq(commentReactions.type, 'like')
                ));

            if (existingCommentReaction) {
                const [deletedCommentReaction] = await db
                    .delete(commentReactions)
                    .where(
                        and(
                            eq(commentReactions.commentId, commentId),
                            eq(commentReactions.userId, userId),
                        )
                    )
                    .returning();

                return deletedCommentReaction;
            }

            const [createdCommentReaction] = await db
                .insert(commentReactions)
                .values({
                    userId,
                    commentId,
                    type: 'like',
                })
                //When user already reacted with dislike, update the reaction to like
                .onConflictDoUpdate({
                    target: [commentReactions.commentId, commentReactions.userId],
                    set: { type: 'like' },
                })
                .returning();

            return createdCommentReaction;
        }),

    dislike: protectedProcedure
        .input(z.object({ commentId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const { commentId } = input;
            const { id: userId } = ctx.user;

            const [existingCommentReactionDislike] = await db
                .select()
                .from(commentReactions)
                .where(and(
                    eq(commentReactions.commentId, commentId),
                    eq(commentReactions.userId, userId),
                    eq(commentReactions.type, 'dislike')
                ));

            //If user already reacted with dislike, delete the reaction
            if (existingCommentReactionDislike) {
                const [deletedCommentReaction] = await db
                    .delete(commentReactions)
                    .where(
                        and(
                            eq(commentReactions.commentId, commentId),
                            eq(commentReactions.userId, userId),
                        )
                    )
                    .returning();

                return deletedCommentReaction;
            }

            //If user has not reacted with dislike, create a new reaction
            const [createdCommentReaction] = await db
                .insert(commentReactions)
                .values({
                    userId,
                    commentId,
                    type: 'dislike',
                })
                //When user already reacted with like, update the reaction to dislike
                .onConflictDoUpdate({
                    target: [commentReactions.commentId, commentReactions.userId],
                    set: { type: 'dislike' },
                })
                .returning();

            return createdCommentReaction;
        }),
});