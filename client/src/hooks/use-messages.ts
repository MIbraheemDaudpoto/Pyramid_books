import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { Message, User } from "@shared/schema";

export function useConversations() {
    return useQuery({
        queryKey: ["/api/messages/conversations"],
        queryFn: async () => {
            const res = await fetch("/api/messages/conversations");
            if (!res.ok) throw new Error("Failed to fetch conversations");
            return res.json() as Promise<Array<{ otherUser: any, lastMessage: Message, unreadCount: number }>>;
        },
        refetchInterval: 5000,
    });
}

export function useMessages(otherUserId?: string) {
    return useQuery({
        queryKey: ["/api/messages", otherUserId],
        queryFn: async () => {
            if (!otherUserId) return [];
            const res = await fetch(buildUrl("/api/messages/:otherUserId", { otherUserId }));
            if (!res.ok) throw new Error("Failed to fetch messages");
            return res.json() as Promise<Message[]>;
        },
        enabled: !!otherUserId,
        refetchInterval: 3000,
    });
}

export function useSendMessage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ receiverId, content }: { receiverId: string; content: string }) => {
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ receiverId, content }),
            });
            if (!res.ok) throw new Error("Failed to send message");
            return res.json() as Promise<Message>;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["/api/messages", variables.receiverId] });
            queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
        },
    });
}

export function useChatUsers() {
    return useQuery({
        queryKey: ["/api/messages/users"],
        queryFn: async () => {
            const res = await fetch("/api/messages/users");
            if (!res.ok) throw new Error("Failed to fetch chat users");
            return res.json() as Promise<User[]>;
        },
    });
}

export function useUnreadCount() {
    return useQuery({
        queryKey: ["/api/messages/unread-count"],
        queryFn: async () => {
            const res = await fetch("/api/messages/unread-count");
            if (!res.ok) throw new Error("Failed to fetch unread count");
            const data = await res.json();
            return data.count as number;
        },
        refetchInterval: 10000,
    });
}

export function useMarkRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (otherUserId: string) => {
            await fetch(buildUrl("/api/messages/:otherUserId/read", { otherUserId }), {
                method: "POST",
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
            queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
        },
    });
}
