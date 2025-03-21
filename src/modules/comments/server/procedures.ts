import { db } from "@/db";
import { commentReactions, comments, users } from "@/db/schema";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, getTableColumns, inArray, isNotNull, isNull, lt, or } from "drizzle-orm";
import { z } from "zod";

export const commentsRouter = createTRPCRouter({
    remove: protectedProcedure
        .input(z.object({
            id: z.string().uuid(),
        }))
        .mutation(async ({ input, ctx }) => {
            const { id } = input;
            const { id: userId } = ctx.user;

            const [deletedComment] = await db
                .delete(comments)
                .where(and(
                    eq(comments.userId, userId),
                    eq(comments.id, id),
                ))
                .returning();

            if (!deletedComment) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Comment not found",
                });
            }

            return deletedComment;
        }),
    create: protectedProcedure
        .input(z.object({
            parentId: z.string().uuid().nullish(),
            videoId: z.string().uuid(),
            value: z.string(),
        }))
        .mutation(async ({ input, ctx }) => {
            const { parentId, videoId, value } = input;
            const { id: userId } = ctx.user;

            const [existingComment] = await db
                .select()
                .from(comments)
                .where(inArray(comments.id, parentId ? [parentId] : []));

            if (!existingComment && parentId) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Parent comment not found",
                });
            }

            if (parentId && existingComment.parentId) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Parent comment already has a parent",
                });
            }

            const [createdComment] = await db
                .insert(comments)
                .values({ userId, parentId, videoId, value })
                .returning();

            return createdComment;
        }),
    getMany: baseProcedure
        .input(
            z.object({
                videoId: z.string().uuid(),
                parentId: z.string().uuid().nullish(),
                cursor: z.object({
                    id: z.string().uuid(),
                    updatedAt: z.date(),
                }).nullish(),
                limit: z.number().min(1).max(100),
            }),
        )
        .query(async ({ input, ctx }) => {
            const { clerkUserId } = ctx;
            const { videoId, parentId, cursor, limit } = input;

            let userId;

            const [user] = await db
                .select()
                .from(users)
                .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []));
            // Wrong because this query all users existed in the database
            // .where(clerkUserId ? eq(users.clerkId, clerkUserId) : undefined);

            if (user) {
                userId = user.id;
            }

            const viewerReactions = db.$with("viewer_reactions").as(
                db.select({
                    commentId: commentReactions.commentId,
                    type: commentReactions.type,
                })
                    .from(commentReactions)
                    .where(inArray(commentReactions.userId, userId ? [userId] : []))
            );

            const replies = db.$with("replies").as(
                db
                    .select({
                        parentId: comments.parentId,
                        replyCount: count(comments.id)
                            //count is raw SQL query so have to use alias to access it
                            .as("replyCount"),

                    })
                    .from(comments)
                    .where(isNotNull(comments.parentId))
                    //Aggregate queries with raw SQL (count) must be grouped by
                    .groupBy(comments.parentId)
            )

            const [totalData, data] = await Promise.all([
                db
                    .select({
                        count: count(),
                    })
                    .from(comments)
                    .where(and(
                        eq(comments.videoId, videoId),
                        // If reply comment is not counted with so use following condition
                        // isNull(comments.parentId),
                    )),
                db
                    .with(viewerReactions, replies)
                    .select({
                        ...getTableColumns(comments),
                        user: users,
                        viewerReaction: viewerReactions.type,
                        replyCount: replies.replyCount,
                        likeCount: db.$count(
                            commentReactions,
                            and(
                                eq(commentReactions.type, "like"),
                                eq(commentReactions.commentId, comments.id),
                            )
                        ),
                        dislikeCount: db.$count(
                            commentReactions,
                            and(
                                eq(commentReactions.type, "dislike"),
                                eq(commentReactions.commentId, comments.id),
                            )
                        )
                    })
                    .from(comments)
                    .where(and(
                        eq(comments.videoId, videoId,),
                        parentId
                            ? eq(comments.parentId, parentId)
                            : isNull(comments.parentId),
                        cursor
                            ? or(
                                lt(comments.updatedAt, cursor.updatedAt),
                                and(
                                    eq(comments.updatedAt, cursor.updatedAt),
                                    lt(comments.id, cursor.id)
                                )
                            )
                            : undefined),
                    )
                    .innerJoin(users, eq(comments.userId, users.id))
                    .leftJoin(viewerReactions, eq(comments.id, viewerReactions.commentId))
                    .leftJoin(replies, eq(comments.id, replies.parentId))
                    .orderBy(desc(comments.updatedAt), desc(comments.id))
                    .limit(limit + 1),
            ]);

            const hasMore = data.length > limit;
            //Remove the extra item
            const items = hasMore ? data.slice(0, -1) : data;
            //Set the next cursor to the last item if there are more pages
            const lastItem = items[items.length - 1];
            const nextCursor = hasMore
                ? {
                    id: lastItem.id,
                    updatedAt: lastItem.updatedAt,
                }
                : null;

            return {
                items,
                totalCount: totalData[0].count,
                nextCursor,
            };
        })
});