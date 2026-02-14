import AppShell from "@/components/AppShell";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import Seo from "@/components/Seo";
import { useMe } from "@/hooks/use-me";
import { useConversations, useMessages, useSendMessage } from "@/hooks/use-messages";
import { useUsers } from "@/hooks/use-users";
import { cn } from "@/lib/utils";
import { MessageCircle, Send, User, ChevronLeft } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";

export default function MessagesPage() {
    const { data: me } = useMe();
    const { data: conversations = [], isLoading: loadingConvs } = useConversations();
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const { data: messages = [], isLoading: loadingMsgs } = useMessages(selectedUserId ?? undefined);
    const sendMessage = useSendMessage();
    const { data: allUsers = [] } = useUsers();

    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Filter users that are not the current user for starting new chats
    const chatableUsers = useMemo(() => {
        return allUsers.filter(u => u.id !== me?.id);
    }, [allUsers, me]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !selectedUserId) return;
        sendMessage.mutate({ receiverId: selectedUserId, content: input.trim() });
        setInput("");
    };

    const selectedConversation = conversations.find(c => c.otherUser.id === selectedUserId);
    const selectedUser = selectedConversation?.otherUser || allUsers.find(u => u.id === selectedUserId);

    return (
        <AppShell>
            <Seo title="Messages — Pyramid Books" description="Messenger for communication between customers and staff." />

            <SectionHeader
                title="Messages"
                subtitle="Chat with staff and customers about orders and inquiries."
                badge={<span className="badge rounded-pill text-bg-primary">Messenger</span>}
            />

            <div className="row g-4" style={{ height: "calc(100vh - 250px)", minHeight: "500px" }}>
                {/* Conversations List */}
                <div className={cn("col-md-4 h-100", selectedUserId ? "d-none d-md-block" : "block")}>
                    <GlassCard className="h-100 p-0 overflow-hidden d-flex flex-column">
                        <div className="p-3 border-bottom pb-glass">
                            <h6 className="mb-0 fw-bold">Conversations</h6>
                        </div>
                        <div className="flex-grow-1 overflow-auto p-2">
                            {loadingConvs ? (
                                <div className="p-4 text-center text-muted">Loading...</div>
                            ) : conversations.length === 0 ? (
                                <div className="p-4 text-center text-muted">No conversations yet.</div>
                            ) : (
                                conversations.map((conv) => (
                                    <button
                                        key={conv.otherUser.id}
                                        className={cn(
                                            "w-100 border-0 p-3 rounded-4 mb-2 text-start d-flex align-items-center gap-3 transition-all",
                                            selectedUserId === conv.otherUser.id
                                                ? "bg-primary text-white shadow-primary"
                                                : "bg-light-subtle hover-bg-light"
                                        )}
                                        onClick={() => setSelectedUserId(conv.otherUser.id)}
                                    >
                                        <div className="rounded-circle bg-white text-primary fw-bold d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, flexShrink: 0 }}>
                                            <User size={20} />
                                        </div>
                                        <div className="overflow-hidden">
                                            <div className="fw-semibold text-truncate">
                                                {conv.otherUser.firstName} {conv.otherUser.lastName}
                                            </div>
                                            <div className={cn("small text-truncate", selectedUserId === conv.otherUser.id ? "text-white-50" : "text-muted")}>
                                                {conv.lastMessage.content}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}

                            {/* Quick start new chat */}
                            {chatableUsers.length > 0 && (
                                <div className="mt-4 p-2">
                                    <div className="small text-muted mb-2 px-2">Staff & Users</div>
                                    {chatableUsers.filter(u => !conversations.some(c => c.otherUser.id === u.id)).map(u => (
                                        <button
                                            key={u.id}
                                            className="w-100 border-0 p-2 rounded-3 mb-1 text-start d-flex align-items-center gap-2 bg-transparent hover-bg-light"
                                            onClick={() => setSelectedUserId(u.id)}
                                        >
                                            <User size={14} className="text-muted" />
                                            <span className="small">{u.firstName} {u.lastName} ({u.role})</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>

                {/* Chat Window */}
                <div className={cn("col-md-8 h-100", selectedUserId ? "block" : "d-none d-md-block")}>
                    <GlassCard className="h-100 p-0 overflow-hidden d-flex flex-column">
                        {selectedUserId ? (
                            <>
                                {/* Header */}
                                <div className="p-3 border-bottom pb-glass d-flex align-items-center gap-3">
                                    <button className="btn btn-sm btn-light d-md-none" onClick={() => setSelectedUserId(null)}>
                                        <ChevronLeft size={20} />
                                    </button>
                                    <div className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h6 className="mb-0 fw-bold">{selectedUser?.firstName} {selectedUser?.lastName}</h6>
                                        <span className="small text-muted capitalize">{selectedUser?.role}</span>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div
                                    ref={scrollRef}
                                    className="flex-grow-1 overflow-auto p-4 d-flex flex-column gap-3 bg-light-subtle"
                                >
                                    {loadingMsgs ? (
                                        <div className="text-center text-muted">Loading messages...</div>
                                    ) : messages.length === 0 ? (
                                        <div className="text-center text-muted my-auto">
                                            <MessageCircle size={48} className="mb-2 opacity-20" />
                                            <p>Start a conversation!</p>
                                        </div>
                                    ) : (
                                        messages.map((msg) => {
                                            const isMe = msg.senderId === me?.id;
                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={cn(
                                                        "max-w-75 d-flex flex-column",
                                                        isMe ? "align-self-end text-end" : "align-self-start"
                                                    )}
                                                >
                                                    <div
                                                        className={cn(
                                                            "p-3 rounded-4 shadow-sm",
                                                            isMe ? "bg-primary text-white" : "bg-white text-dark"
                                                        )}
                                                        style={{
                                                            borderRadius: isMe ? "20px 20px 4px 20px" : "20px 20px 20px 4px"
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </div>
                                                    <span className="small text-muted mt-1 px-1" style={{ fontSize: "10px" }}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Input */}
                                <div className="p-3 border-top pb-glass mt-auto">
                                    <form onSubmit={handleSend} className="d-flex gap-2">
                                        <input
                                            className="form-control rounded-pill border-0 bg-light px-4"
                                            placeholder="Type a message..."
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                        />
                                        <button
                                            type="submit"
                                            className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center p-0"
                                            style={{ width: 40, height: 40 }}
                                            disabled={!input.trim() || sendMessage.isPending}
                                        >
                                            <Send size={18} />
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="m-auto text-center text-muted p-5">
                                <div className="mb-4">
                                    <div className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 100, height: 100 }}>
                                        <MessageCircle size={48} className="text-muted opacity-50" />
                                    </div>
                                    <h4 className="fw-bold">Messenger</h4>
                                    <p className="max-w-xs mx-auto">Select a user to start chatting or view your conversation history.</p>
                                </div>
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>
        </AppShell>
    );
}
