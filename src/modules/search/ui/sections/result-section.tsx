"use client";

import { DEFAULT_LIMIT } from "@/constants";
import { trpc } from "@/trpc/client";

import { VideoRowCard, VideoRowCardSkeleton } from "@/modules/videos/ui/components/video-row-card";
import { VideoGridCard, VideoGridCardSkeleton } from "@/modules/videos/ui/components/video-grid-card";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface ResultSectionProps {
    query: string | undefined;
    categoryId: string | undefined;
};

export const ResultsSections = ({
    query,
    categoryId,

}: ResultSectionProps) => {
    return (
        <Suspense
            key={`${query}-${categoryId}`}
            fallback={<ResultsSectionsSkeleton />}
        >
            <ErrorBoundary fallback={<p>Error...</p>}>
                <ResultsSectionsSuspense
                    query={query}
                    categoryId={categoryId}
                />
            </ErrorBoundary>
        </Suspense>
    )
};

const ResultsSectionsSkeleton = () => {
    return (
        <div>
            <div className="hidden flex-col gap-4 md:flex">
                {Array.from({ length: 6 }).map((_, index) => (
                    <VideoRowCardSkeleton
                        key={index}
                        size="compact"
                    />
                ))}
            </div>
            <div className="flex flex-col gap-4 gap-y-10 pt-6 md:hidden">
                {Array.from({ length: 6 }).map((_, index) => (
                    <VideoGridCardSkeleton
                        key={index}
                    />
                ))}
            </div>
        </div>
    )
}

const ResultsSectionsSuspense = ({
    query,
    categoryId,

}: ResultSectionProps) => {

    const [results, resultQuery] = trpc.search.getMany.useSuspenseInfiniteQuery({
        query,
        categoryId,
        limit: DEFAULT_LIMIT,
    }, {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

    return (
        <>
            <div className="flex flex-col gap-4 gap-y-10 md:hidden">
                {results.pages
                    .flatMap((page) => page.items)
                    .map((video) => (
                        <VideoGridCard key={video.id} data={video} />
                    ))}
            </div>

            <div className="hidden flex-col gap-4 md:flex">
                {results.pages
                    .flatMap((page) => page.items)
                    .map((video) => (
                        <VideoRowCard key={video.id} data={video} size="default" />
                    ))}
            </div>

            <InfiniteScroll
                hasNextPage={resultQuery.hasNextPage}
                isFetchingNextPage={resultQuery.isFetchingNextPage}
                fetchNextPage={resultQuery.fetchNextPage}
            />
        </>
    )
}
