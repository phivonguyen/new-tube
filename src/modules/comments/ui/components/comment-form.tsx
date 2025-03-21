import { useClerk, useUser } from "@clerk/nextjs";
import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { commentInsertSchema } from "@/db/schema";
import { trpc } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user-avatar";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";


interface CommentFormProps {
    videoId: string;
    parentId?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
    variant?: "reply" | "comment";
};

export const CommentForm = ({
    videoId,
    parentId,
    onCancel,
    variant = "comment",
    onSuccess,
}: CommentFormProps) => {
    const { user } = useUser();
    const clerk = useClerk();
    const utils = trpc.useUtils();
    const create = trpc.comments.create.useMutation({
        onSuccess: () => {
            utils.comments.getMany.invalidate({ videoId });
            form.reset();
            toast.success("Comment added");
            onSuccess?.();
        },
        onError: (error) => {
            if (error.data?.code === "UNAUTHORIZED") {
                clerk.openSignIn();
            }
        }
    });

    const form = useForm<z.infer<typeof commentInsertSchema>>({
        resolver: zodResolver(commentInsertSchema),
        defaultValues: {
            videoId: videoId,
            parentId: parentId,
            value: "",
        },
    });

    const handleSubmit = (values: z.infer<typeof commentInsertSchema>) => {
        create.mutate(values);
    };

    const handleCancel = () => {
        form.reset();
        onCancel?.();
    };

    return (
        <Form {...form}>

            <form
                className="flex gap-4 group"
                onSubmit={form.handleSubmit(handleSubmit)}
            >
                <UserAvatar
                    size="lg"
                    imageUrl={user?.imageUrl || "/user-placeholder.svg"}
                    name={user?.username || "User"}
                />

                <div className="flex-1">
                    <FormField
                        name="value"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        placeholder={
                                            variant === "reply"
                                                ? "Reply to this comment"
                                                : "Add a comment"
                                        }
                                        className="resize-none bg-transparent overflow-hidden min-h-0"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="justify-end gap-2 mt-2 flex">
                        {onCancel && (
                            <Button
                                variant="ghost"
                                type="button"
                                onClick={handleCancel}
                            >
                                Cancel
                            </Button>
                        )}
                        <Button
                            type="submit"
                            size="sm"
                            disabled={create.isPending}
                        >
                            {variant === "reply" ? "Reply" : "Comment"}
                        </Button>
                    </div>
                </div>
            </form>
        </Form>
    )
}