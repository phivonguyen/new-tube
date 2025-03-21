"use client";

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from "@/components/ui/sidebar";
import { useAuth, useClerk } from "@clerk/nextjs";
import { FlameIcon, HomeIcon, PlaySquareIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
    {
        title: "Home",
        url: "/",
        icon: HomeIcon,
        auth: true,
    },
    {
        title: "Subscriptions",
        url: "/feed/subscribed",
        icon: PlaySquareIcon,
        auth: true,
    },
    {
        title: "Trending",
        url: "/feed/trending",
        icon: FlameIcon,
        auth: false,
    }
]

export const MainSection = () => {
    const { isSignedIn } = useAuth();
    const pathname = usePathname();
    const clerk = useClerk();

    return (
        <SidebarGroup>
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title} >
                            <SidebarMenuButton
                                tooltip={item.title}
                                asChild
                                isActive={pathname === item.url}
                                onClick={(e) => {
                                    if (!isSignedIn && item.auth) {
                                        e.preventDefault();
                                        return clerk.openSignIn();
                                    }
                                }}
                            >
                                <Link prefetch href={item.url}>
                                    <item.icon />
                                    <span className="text-sm">
                                        {item.title}
                                    </span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}