import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { Message } from "@shared/schema";

export function useConversations() {
    return useQuery({
        queryKey: [api.messages.conversations.path],
        queryFn: async () => {
            const res = await fetch(api.messages.conversations.path, { credentials: "include" });
            if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
            return (await res.json()) as Array<{ otherUser: any, lastMessage: Message }>;
        },
        refetchInterval: 10000,
    });
}

export function useMessages(otherUserId: string | undefined) {
    return useQuery({
        queryKey: [api.messages.list.path, otherUserId],
        queryFn: async () => {
            if (!otherUserId) return [];
            const url = buildUrl(api.messages.list.path, { otherUserId });
            const res = await fetch(url, { credentials: "include" });
            if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
            return (await res.json()) as Message[];
        },
        enabled: !!otherUserId,
        refetchInterval: 5000,
    });
}

export function useSendMessage() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ receiverId, content }: { receiverId: string; content: string }) => {
            const res = await fetch(api.messages.send.path, {
                method: api.messages.send.method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ receiverId, content }),
            });
            if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
            return (await res.json()) as Message;
        },
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: [api.messages.conversations.path] });
            qc.invalidateQueries({ queryKey: [api.messages.list.path, data.receiverId] });
        },
    });
}
