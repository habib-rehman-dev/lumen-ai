"use client";

import Link from "next/link";

import { ChatView } from "@/components/chat/chat-view";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { toUIMessages } from "@/hooks/use-rag-chat";
import { useChatDetail } from "@/hooks/use-chats";

export function ExistingChat({ chatId }: { chatId: string }) {
    const { data, isLoading } = useChatDetail(chatId);

    if (isLoading) {
        return (
            <div className="flex h-svh flex-col">
                <AppHeader title="Loading…" />
                <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
                    <Skeleton className="ml-auto h-10 w-2/3" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="ml-auto h-10 w-1/2" />
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex h-svh flex-col">
                <AppHeader title="Chat not found" />
                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                    <p className="text-sm text-muted-foreground">This chat doesn&apos;t exist or was deleted.</p>
                    <Button render={
                        () => <Link href="/">Start a new chat</Link>
                    } />
                </div>
            </div>
        );
    }

    // key = chat id, so switching chats gives a completely fresh useChat state
    return <ChatView key={data.id} chatId={data.id} title={data.title} initialMessages={toUIMessages(data)} />;
}