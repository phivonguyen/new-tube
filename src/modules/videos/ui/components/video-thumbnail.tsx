import { formatDuration } from "@/lib/utils";
import Image from "next/image"
import { THUMBNAIL_FALLBACK } from "@/modules/videos/constants";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoThumbnailProps {
    title: string;
    duration: number;
    imageUrl?: string | null;
    previewUrl?: string | null;
};

export const VideoThumbnailSkeleton = () => {
    return (
        <div className="relative w-full overflow-hidden transition-all group-hover:rounded-none rounded-xl aspect-video">
            <Skeleton className="size-full" />
        </div>
    );
};

export const VideoThumbnail = ({
    title,
    duration,
    imageUrl,
    previewUrl,
}: VideoThumbnailProps) => {
    return (
        <div className="relative">
            <div className="relative w-full overflow-hidden rounded-xl aspect-video">
                <Image
                    src={imageUrl || THUMBNAIL_FALLBACK}
                    alt={title}
                    fill
                    className="h-full w-full object-cover hover:opacity-0"
                />
                <Image
                    unoptimized={!!previewUrl}
                    src={previewUrl || THUMBNAIL_FALLBACK}
                    alt={title}
                    fill
                    className="h-full w-full object-cover opacity-0 hover:opacity-100"
                />
            </div>

            {/* Video duration box */}
            <div className="absolute bottom-2 right-2 px-1 py-0.5 bg-black/80 text-white text-xs font-medium">
                {formatDuration(duration)}
            </div>
        </div>
    )
}