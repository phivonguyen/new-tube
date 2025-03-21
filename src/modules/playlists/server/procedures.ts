import { z } from "zod";
import { and, desc, eq, getTableColumns, lt, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { playlists, playlistVideos, users, videoReactions, videos, videoViews } from "@/db/schema";

import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

export const playlistsRouter = createTRPCRouter({
  remove: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { id } = input;


      const [deletedPlaylist] = await db
        .delete(playlists)
        .where(and(
          eq(playlists.userId, userId),
          eq(playlists.id, id),
        ))
        .returning();

      if (!deletedPlaylist) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Playlist not found",
        })
      };

      return deletedPlaylist;
    }),
  getOne: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { id } = input;

      const [existingPlaylist] = await db
        .select()
        .from(playlists)
        .where(and(
          eq(playlists.userId, userId),
          eq(playlists.id, id),
        ));

      if (!existingPlaylist) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Playlist not found",
        })
      }

      return existingPlaylist;
    }),
  getVideos: baseProcedure
    .input(
      z.object({
        playlistId: z.string().uuid(),
        cursor: z.object({
          id: z.string().uuid(),
          updatedAt: z.date(),
        })
          .nullish(),
        limit: z.number().min(1).max(100),
      }),
    )
    .query(async ({ input }) => {

      const { playlistId, cursor, limit } = input;

      const videosFromPlaylist = db.$with("playlist_videos").as(
        db
          .select({
            videoId: playlistVideos.videoId,
          })
          .from(playlistVideos)
          .where(eq(playlistVideos.playlistId, playlistId))
      );

      const data = await db
        .with(videosFromPlaylist)
        .select({
          ...getTableColumns(videos),
          user: users,
          viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
          likeCount: db.$count(videoReactions, and(
            eq(videoReactions.videoId, videos.id),
            eq(videoReactions.type, "like")
          )),
          dislikeCount: db.$count(videoReactions, and(
            eq(videoReactions.videoId, videos.id),
            eq(videoReactions.type, "dislike")
          )),
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .innerJoin(videosFromPlaylist, eq(videosFromPlaylist.videoId, videos.id))
        .where(and(
          eq(videos.visibility, "public"),
          cursor
            ? or(
              lt(videos.updatedAt, cursor.updatedAt),
              and(
                eq(videos.updatedAt, cursor.updatedAt),
                lt(videos.id, cursor.id)
              )
            )
            : undefined,
        ))
        .orderBy(desc(videos.updatedAt), desc(videos.id))
        // Add 1 to limit to check if there are more pages
        .limit(limit + 1);

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
        nextCursor,
      };

    }),
  removeVideo: protectedProcedure
    .input(
      z.object({
        playlistId: z.string().uuid(),
        videoId: z.string().uuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { playlistId, videoId } = input;

      const [existingPlaylists] = await db
        .select()
        .from(playlists)
        .where(
          and(
            eq(playlists.id, playlistId),
            eq(playlists.userId, userId),
          ),
        )

      if (!existingPlaylists) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Playlist not found",
        })
      };

      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(eq(videos.id, videoId));

      if (!existingVideo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Video not found",
        })
      };

      const [existingPlaylistVideo] = await db
        .select()
        .from(playlistVideos)
        .where(
          and(
            eq(playlistVideos.playlistId, playlistId),
            eq(playlistVideos.videoId, videoId),
          ),
        )

      if (!existingPlaylistVideo) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Video not in playlist",
        })
      }

      const [deletedPlaylistVideo] = await db
        .delete(playlistVideos)
        .where(
          and(
            eq(playlistVideos.playlistId, playlistId),
            eq(playlistVideos.videoId, videoId),
          ),
        )
        .returning();

      return deletedPlaylistVideo;

    }),
  addVideo: protectedProcedure
    .input(
      z.object({
        playlistId: z.string().uuid(),
        videoId: z.string().uuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { playlistId, videoId } = input;

      const [existingPlaylists] = await db
        .select()
        .from(playlists)
        .where(
          and(
            eq(playlists.id, playlistId),
            eq(playlists.userId, userId),
          ),
        )

      if (!existingPlaylists) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Playlist not found",
        })
      };

      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(eq(videos.id, videoId));

      if (!existingVideo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Video not found",
        })
      };

      const [existingPlaylistVideo] = await db
        .select()
        .from(playlistVideos)
        .where(
          and(
            eq(playlistVideos.playlistId, playlistId),
            eq(playlistVideos.videoId, videoId),
          ),
        )

      if (existingPlaylistVideo) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Video already in playlist",
        })
      }

      const [createdPlaylistVideo] = await db
        .insert(playlistVideos)
        .values({
          playlistId,
          videoId,
        })
        .returning();

      return createdPlaylistVideo;

    }),
  getManyForVideo: protectedProcedure
    .input(
      z.object({
        videoId: z.string().uuid(),
        cursor: z.object({
          id: z.string().uuid(),
          updatedAt: z.date(),
        })
          .nullish(),
        limit: z.number().min(1).max(100),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { videoId, cursor, limit } = input;

      const data = await db
        .select({
          ...getTableColumns(playlists),
          videoCount: db.$count(
            playlistVideos,
            eq(playlistVideos.playlistId, playlists.id),
          ),
          user: users,
          containsVideo: videoId
            ? sql<boolean>`(
              SELECT EXISTS (
                SELECT 1
                FROM ${playlistVideos} pv
                WHERE pv.playlist_id = ${playlists.id}
                AND pv.video_id = ${videoId}
              )
           )`
            : sql<boolean>`false`,
        })
        .from(playlists)
        .innerJoin(users, eq(playlists.userId, users.id))
        .where(and(
          eq(playlists.userId, userId),
          cursor
            ? or(
              lt(playlists.updatedAt, cursor.updatedAt),
              and(
                eq(playlists.updatedAt, cursor.updatedAt),
                lt(playlists.id, cursor.id)
              )
            )
            : undefined,
        ))
        .orderBy(desc(playlists.updatedAt), desc(playlists.id))
        // Add 1 to limit to check if there are more pages
        .limit(limit + 1);

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
        nextCursor,
      };

    }),
  getMany: protectedProcedure
    .input(
      z.object({
        cursor: z.object({
          id: z.string().uuid(),
          updatedAt: z.date(),
        })
          .nullish(),
        limit: z.number().min(1).max(100),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { cursor, limit } = input;

      const data = await db
        .select({
          ...getTableColumns(playlists),
          videoCount: db.$count(
            playlistVideos,
            eq(playlistVideos.playlistId, playlists.id),
          ),
          user: users,
          thumbnailUrl: sql<string | null>`(
            SELECT v.thumbnail_url
            FROM ${playlistVideos} pv
            INNER JOIN ${videos} v ON v.id = pv.video_id
            WHERE pv.playlist_id = ${playlists.id}
            ORDER BY pv.updated_at DESC
            LIMIT 1
          )`
        })
        .from(playlists)
        .innerJoin(users, eq(playlists.userId, users.id))
        .where(and(
          eq(playlists.userId, userId),
          cursor
            ? or(
              lt(playlists.updatedAt, cursor.updatedAt),
              and(
                eq(playlists.updatedAt, cursor.updatedAt),
                lt(playlists.id, cursor.id)
              )
            )
            : undefined,
        ))
        .orderBy(desc(playlists.updatedAt), desc(playlists.id))
        // Add 1 to limit to check if there are more pages
        .limit(limit + 1);

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
        nextCursor,
      };

    }),
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { name } = input;

      const [createdPlaylist] = await db
        .insert(playlists)
        .values({
          name,
          userId,
        })
        .returning();

      if (!createdPlaylist) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to create playlist",
        })
      }

      return createdPlaylist;
    }),
  getLiked: protectedProcedure
    .input(
      z.object({
        cursor: z.object({
          id: z.string().uuid(),
          likedAt: z.date(),
        })
          .nullish(),
        limit: z.number().min(1).max(100),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { cursor, limit } = input;

      const viewerVideoReactions = db.$with("viewer_video_reactions").as(
        db
          .select({
            videoId: videoReactions.videoId,
            likedAt: videoReactions.updatedAt,
          })
          .from(videoReactions)
          .where(and(
            eq(videoReactions.userId, userId),
            eq(videoReactions.type, "like")
          ))
      );

      const data = await db
        .with(viewerVideoReactions)
        .select({
          ...getTableColumns(videos),
          user: users,
          viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
          likeCount: db.$count(videoReactions, and(
            eq(videoReactions.videoId, videos.id),
            eq(videoReactions.type, "like")
          )),
          dislikeCount: db.$count(videoReactions, and(
            eq(videoReactions.videoId, videos.id),
            eq(videoReactions.type, "dislike")
          )),
          likedAt: viewerVideoReactions.likedAt,
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .innerJoin(viewerVideoReactions, eq(viewerVideoReactions.videoId, videos.id))
        .where(and(
          eq(videos.visibility, "public"),
          cursor
            ? or(
              lt(viewerVideoReactions.likedAt, cursor.likedAt),
              and(
                eq(viewerVideoReactions.likedAt, cursor.likedAt),
                lt(videos.id, cursor.id)
              )
            )
            : undefined,
        ))
        .orderBy(desc(viewerVideoReactions.likedAt), desc(videos.id))
        // Add 1 to limit to check if there are more pages
        .limit(limit + 1);

      const hasMore = data.length > limit;
      //Remove the extra item
      const items = hasMore ? data.slice(0, -1) : data;
      //Set the next cursor to the last item if there are more pages
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? {
          id: lastItem.id,
          likedAt: lastItem.likedAt,
        }
        : null;

      return {
        items,
        nextCursor,
      };

    }),
  getHistory: protectedProcedure
    .input(
      z.object({
        cursor: z.object({
          id: z.string().uuid(),
          viewedAt: z.date(),
        })
          .nullish(),
        limit: z.number().min(1).max(100),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { cursor, limit } = input;

      const viewerVideoViews = db.$with("viewer_video_views").as(
        db
          .select({
            videoId: videoViews.videoId,
            viewedAt: videoViews.updatedAt,
          })
          .from(videoViews)
          .where(eq(videoViews.userId, userId))
      );

      const data = await db
        .with(viewerVideoViews)
        .select({
          ...getTableColumns(videos),
          user: users,
          viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
          likeCount: db.$count(videoReactions, and(
            eq(videoReactions.videoId, videos.id),
            eq(videoReactions.type, "like")
          )),
          dislikeCount: db.$count(videoReactions, and(
            eq(videoReactions.videoId, videos.id),
            eq(videoReactions.type, "dislike")
          )),
          viewedAt: viewerVideoViews.viewedAt,
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .innerJoin(viewerVideoViews, eq(viewerVideoViews.videoId, videos.id))
        .where(and(
          eq(videos.visibility, "public"),
          cursor
            ? or(
              lt(viewerVideoViews.viewedAt, cursor.viewedAt),
              and(
                eq(viewerVideoViews.viewedAt, cursor.viewedAt),
                lt(videos.id, cursor.id)
              )
            )
            : undefined,
        ))
        .orderBy(desc(viewerVideoViews.viewedAt), desc(videos.id))
        // Add 1 to limit to check if there are more pages
        .limit(limit + 1);

      const hasMore = data.length > limit;
      //Remove the extra item
      const items = hasMore ? data.slice(0, -1) : data;
      //Set the next cursor to the last item if there are more pages
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore
        ? {
          id: lastItem.id,
          viewedAt: lastItem.viewedAt,
        }
        : null;

      return {
        items,
        nextCursor,
      };

    }),
});
