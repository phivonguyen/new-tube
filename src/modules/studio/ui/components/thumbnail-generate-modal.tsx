import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResponsiveModal } from "@/components/responsive-modal";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";

interface ThumbnailGenerateModalProps {
    videoId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const formSchema = z.object({
    prompt: z.string().min(10),
});

export const ThumbnailGenerateModal = ({
    videoId,
    open,
    onOpenChange,
}: ThumbnailGenerateModalProps) => {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            prompt: "",
        }
    });

    const generateThumbnail = trpc.videos.generateThumbnail.useMutation({
        onSuccess: () => {
            toast.success("Background job started to generate thumbnail", {
                description: "This may take a few minutes. Refresh the page to see the updated status",
            });
            onOpenChange(false);
            form.reset();
        },
        onError: (error) => {
            toast.error("Something went wrong while generating thumbnail");
            console.error(error);
        }
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        generateThumbnail.mutate({
            id: videoId,
            prompt: values.prompt,
        });
    };

    return (
        <ResponsiveModal
            open={open}
            onOpenChange={onOpenChange}
            title="Generate Thumbnail"
        >
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="flex flex-col gap-4"
                >
                    <FormField
                        control={form.control}
                        name="prompt"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Prompt</FormLabel>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        className="resize-none"
                                        cols={30}
                                        rows={5}
                                        placeholder="A description of wanted thumbnail"
                                    />
                                </FormControl>
                                <FormMessage />

                            </FormItem>
                        )}
                    />
                    <div className="flex justify-end">
                        <Button
                            disabled={generateThumbnail.isPending}
                            type="submit"
                        >
                            Generate Thumbnail
                        </Button>
                    </div>
                </form>
            </Form>
        </ResponsiveModal>
    );
};