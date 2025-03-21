import { studioRouter } from "@/modules/studio/server/procedures";
import { categoriesRouter } from "@/modules/categories/procedures";
import { videosRouter } from "@/modules/videos/server/procedures";
import { videoViewsRouter } from "@/modules/video-views/server/procedures";
import { videoReactionsRouter } from "@/modules/video-reactions/server/procedures";
import { subscriptionsRouter } from "@/modules/subscriptions/server/procedures";
import { commentsRouter } from "@/modules/comments/server/procedures";
import { commentReactionsRouter } from "@/modules/comment-reactions/server/procedures";
import { suggestionsRouter } from "@/modules/suggestions/server/procedures";
import { searchRouter } from "@/modules/search/server/procedures";
import { playlistsRouter } from "@/modules/playlists/server/procedures";
import { usersRouter } from "@/modules/users/server/procedures";

import { createTRPCRouter } from "../init";


export const appRouter = createTRPCRouter({
  categories: categoriesRouter,

  comments: commentsRouter,
  commentReactions: commentReactionsRouter,

  search: searchRouter,

  studios: studioRouter,

  subscriptions: subscriptionsRouter,

  suggestions: suggestionsRouter,

  playlists: playlistsRouter,

  users: usersRouter,

  videos: videosRouter,
  videoViews: videoViewsRouter,
  videoReactions: videoReactionsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
