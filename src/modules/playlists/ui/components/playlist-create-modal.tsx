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

import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";
import { Input } from "@/components/ui/input";

interface PlaylistCreateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const formSchema = z.object({
    name: z.string().min(1),
});

export const PlaylistCreateModal = ({
    open,
    onOpenChange,
}: PlaylistCreateModalProps) => {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
        }
    });

    const utils = trpc.useUtils();

    const create = trpc.playlists.create.useMutation({
        onSuccess: () => {
            utils.playlists.getMany.invalidate();
            toast.success("Playlist created successfully");
            onOpenChange(false);
            form.reset();
        },
        onError: (error) => {
            toast.error("Something went wrong while generating thumbnail");
            console.error(error);
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        create.mutate(values);
    };

    return (
        <ResponsiveModal
            open={open}
            onOpenChange={onOpenChange}
            title="Generate Playlist"
        >
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="flex flex-col gap-4"
                >
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Prompt</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="Enter playlist name"
                                    />
                                </FormControl>
                                <FormMessage />

                            </FormItem>
                        )}
                    />
                    <div className="flex justify-end">
                        <Button
                            disabled={create.isPending}
                            type="submit"
                        >
                            Create Playlist
                        </Button>
                    </div>
                </form>
            </Form>
        </ResponsiveModal>
    );
};