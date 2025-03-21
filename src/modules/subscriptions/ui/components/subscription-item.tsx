import { UserAvatar } from "@/components/user-avatar";
import { SubscriptionButton } from "./subscription-button";
import { Skeleton } from "@/components/ui/skeleton";

interface SubscriptionItemProps {
    name: string;
    imageUrl: string;
    subscriberCount: number;
    onUnsubscribe: () => void;
    disabled: boolean;
};

export const SubscriptionItemSkeleton = () => {
    return (
        <div className="flex items-start gap-4">
            <Skeleton className="size-10 rounded-full" />

            <div className="flex-1">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-4 w-1/2 bg-gray-200 rounded" />
                        <Skeleton className="h-3 w-1/3 bg-gray-200 rounded mt-1" />
                    </div>

                    <Skeleton className="h-8 w-20 rounded-full" />
                </div>
            </div>
        </div>
    )
};

export const SubscriptionItem = ({
    name,
    imageUrl,
    subscriberCount,
    onUnsubscribe,
    disabled,
}: SubscriptionItemProps) => {
    return (
        <div className="flex items-start gap-4">
            <UserAvatar
                size="lg"
                imageUrl={imageUrl}
                name={name}
            />

            <div className="flex-1">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm">{name}</h3>
                        <p className="text-xs text-muted-foreground">
                            {subscriberCount.toLocaleString()} subscribers
                        </p>
                    </div>

                    <SubscriptionButton
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onUnsubscribe();
                        }}
                        disabled={disabled}
                        isSubscribed
                    />
                </div>
            </div>
        </div>
    )
}