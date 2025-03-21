"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { DEFAULT_LIMIT } from "@/constants";
import { trpc } from "@/trpc/client";
import { SubscriptionItem } from "../components/subscription-item";

export const SubscriptionsSection = () => {
    return (
        <Suspense fallback={<SubscriptionsSectionSkeleton />}>
            <ErrorBoundary fallback={<div>Error</div>}>
                <SubscriptionsSectionSuspense />
            </ErrorBoundary>
        </Suspense>
    );
};

const SubscriptionsSectionSkeleton = () => {
    return (
        <div className="flex flex-col gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
                <SubscriptionsSectionSkeleton key={index} />
            ))}
        </div>
    )
};

const SubscriptionsSectionSuspense = () => {
    const utils = trpc.useUtils();
    const [subscriptions, query] = trpc.subscriptions.getMany.useSuspenseInfiniteQuery({
        limit: DEFAULT_LIMIT
    }, {
        getNextPageParam: (lastPage) => lastPage.nextCursor
    });

    const unsubscribe = trpc.subscriptions.remove.useMutation({
        onSuccess: (data) => {
            toast.success("Unsubscribed successfully!");

            utils.videos.getManySubscribed.invalidate();
            utils.users.getOne.invalidate({ id: data.creatorId });
            utils.subscriptions.getMany.invalidate();
        },
        onError: (error) => {
            toast.error("Failed to unsubscribe" + error.message);
        }
    });

    return (
        <div>
            <div className="flex flex-col gap-4">
                {subscriptions.pages
                    .flatMap((page) => page.items)
                    .map((subscription) => (
                        <Link prefetch
                            key={`${subscription.creatorId}-${subscription.viewerId}`}
                            href={`/users/${subscription.user.id}`}
                        >
                            <SubscriptionItem
                                name={subscription.user.name}
                                imageUrl={subscription.user.imageUrl}
                                subscriberCount={subscription.user.subscriberCount}
                                onUnsubscribe={() => unsubscribe.mutate({ userId: subscription.creatorId })}
                                disabled={unsubscribe.isPending}
                            />
                        </Link>
                    ))}
            </div>
            <InfiniteScroll
                hasNextPage={query.hasNextPage}
                isFetchingNextPage={query.isFetchingNextPage}
                fetchNextPage={query.fetchNextPage}
            />
        </div>
    )
}