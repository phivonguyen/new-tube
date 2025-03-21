import { VideoView } from "@/modules/studio/ui/views/video-view";
import { HydrateClient, trpc } from "@/trpc/server";

interface PageProps {
    params: Promise<{ videoId: string }>;
}

const Page = async ({ params }: PageProps) => {
    const { videoId } = await params;

    void trpc.studios.getOne.prefetch({ id: videoId });
    void trpc.categories.getMany.prefetch();

    return (
        <HydrateClient>
            <VideoView videoId={videoId} />
        </HydrateClient>
    );
}

export default Page;
