import { Skeleton } from "@/components/ui/skeleton";
import { PlaylistGetManyOutput } from "@/modules/playlists/types";

interface PlaylistInfoProps {
    data: PlaylistGetManyOutput["items"][number];
};

export const PlaylistInfoSkeleton = () => {
    return (
        <div className="flex gap-3">
            <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="w-3/4 h-4" />
                <Skeleton className="w-1/2 h-3" />
                <Skeleton className="w-1/3 h-3" />
            </div>
        </div>
    )
}

export const PlaylistInfo = ({ data }: PlaylistInfoProps) => {
    return (
        <div className="flex gap-3">
            <div className="min-w-0 flex-1">
                <h3 className="font-medium line-clamp-1 lg:line-clamp-2 text-sm break-words">
                    {data.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                    Playlist
                </p>
                <p className="text-xs text-muted-foreground font-semibold hover:text-primary">
                    View full playlist
                </p>
            </div>
        </div>
    );
}