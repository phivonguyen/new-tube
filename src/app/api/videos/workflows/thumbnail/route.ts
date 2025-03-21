//http://localhost:3000/api/videos/workflows/title

import { db } from "@/db";
import { videos } from "@/db/schema";
import { serve } from "@upstash/workflow/nextjs"
import { and, eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";

interface InputType {
    userId: string;
    videoId: string;
    prompt: string;
}

const TITLE_SYSTEM_PROMPT = `Your task is to generate an SEO-focused title for a YouTube video based on its transcript. Please follow these guidelines:
- Be concise but descriptive, using relevant keywords to improve discoverability.
- Highlight the most compelling or unique aspect of the video content.
- Avoid jargon or overly complex language unless it directly supports searchability.
- Use action-oriented phrasing or clear value propositions where applicable.
- Ensure the title is 3-8 words long and no more than 100 characters.
- ONLY return the title as plain text. Do not add quotes or any additional formatting.`;

export const { POST } = serve(
    async (context) => {
        const utapi = new UTApi();
        const input = await context.requestPayload as InputType;
        const { videoId, userId, prompt } = input;

        const video = await context.run("get-video", async () => {
            const [existingVideo] = await db
                .select()
                .from(videos)
                .where(
                    and(
                        eq(videos.id, videoId),
                        eq(videos.userId, userId)
                    )
                );

            if (!existingVideo) {
                throw new Error("Video not found")
            }

            return existingVideo
        });

        const { body } = await context.call<{ data: Array<{ url: string }> }>(
            "generate-thumbnail",
            {
                url: "https://api.openai.com/v1/images/generations",
                method: "POST",
                body: {
                    prompt: prompt || TITLE_SYSTEM_PROMPT,
                    n: 1,
                    model: "dall-e-3",
                    size: "1792x1024",
                },
                headers: {
                    authorization: `Bearer ${process.env.OPENAI_API_KEY}`
                }
            }
        );

        const tempThumbnailUrl = body.data[0].url;

        if (!tempThumbnailUrl) {
            throw new Error("Thumbnail not generated")
        };

        await context.run("cleanup-thumbnail", async () => {
            if (video.thumbnailKey) {
                await utapi.deleteFiles(video.thumbnailKey);
                await db
                    .update(videos)
                    .set({
                        thumbnailKey: null,
                        thumbnailUrl: null,
                    })
                    .where(and(
                        eq(videos.id, videoId),
                        eq(videos.userId, userId)
                    ));
            }
        });

        const uploadedThumbnail = await context.run("upload-thumbnail", async () => {
            const { data, error } = await utapi.uploadFilesFromUrl(tempThumbnailUrl);

            if (!data) {
                throw new Error(error.message)
            }

            return data;
        });

        await context.run("update-video", async () => {
            await db
                .update(videos)
                .set({
                    thumbnailKey: uploadedThumbnail.key,
                    thumbnailUrl: uploadedThumbnail.url,
                })
                .where(
                    and(
                        eq(videos.id, videoId),
                        eq(videos.userId, userId)
                    )
                );
        })

    }
)