import AppShell from "@/components/AppShell";
import GlassCard from "@/components/GlassCard";
import SectionHeader from "@/components/SectionHeader";
import Seo from "@/components/Seo";
import { useMe } from "@/hooks/use-me";
import { useConversations, useMessages, useSendMessage, useChatUsers, useMarkRead } from "@/hooks/use-messages";
import { cn } from "@/lib/utils";
import { MessageCircle, Send, User, ChevronLeft, CheckCheck } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";

export default function MessagesPage() {
    const { data: me } = useMe();
    const { data: conversations = [], isLoading: loadingConvs } = useConversations();
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const { data: messages = [], isLoading: loadingMsgs } = useMessages(selectedUserId ?? undefined);
    const sendMessage = useSendMessage();
    const markRead = useMarkRead();
    const { data: chatableUsers = [], isLoading: loadingUsers } = useChatUsers();

    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selectedUserId) {
            markRead.mutate(selectedUserId);
        }
    }, [selectedUserId, messages.length]); // Mark as read when opening or receiving new messages in active chat

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
    const selectedUser = selectedConversation?.otherUser || chatableUsers.find(u => u.id === selectedUserId);

    const content = (
        <>
            <Seo title="Messages — Pyramid Books" description="Messenger for communication between customers and staff." />

            <SectionHeader
                title="Messages"
                subtitle="Chat with staff and customers about orders and inquiries."
                badge={<span className="badge rounded-pill text-bg-primary">Messenger</span>}
            />

            <div className="row g-4" style={{ height: "calc(100vh - 250px)", minHeight: "500px" }}>
                {/* Conversations List */}
                <div className={cn("col-md-4 h-100", selectedUserId ? "d-none d-md-block" : "block")}>
                    <GlassCard className="h-100 p-0 overflow-hidden d-flex flex-column border-0 shadow-lg">
                        <div className="p-4 border-bottom bg-white/50 backdrop-blur-sm sticky-top z-10">
                            <h5 className="mb-0 fw-black text-dark">Conversations</h5>
                        </div>
                        <div className="flex-grow-1 overflow-auto p-3 custom-scrollbar">
                            {loadingConvs ? (
                                <div className="p-4 text-center">
                                    <div className="spinner-border spinner-border-sm text-primary opacity-50" />
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="p-5 text-center text-muted opacity-50">
                                    <MessageCircle size={32} className="mx-auto mb-2" />
                                    <p className="small">No message history yet.</p>
                                </div>
                            ) : (
                                conversations.map((conv) => (
                                    <button
                                        key={conv.otherUser.id}
                                        className={cn(
                                            "w-100 border-0 p-3 rounded-4 mb-3 text-start d-flex align-items-center gap-3 transition-all transform hover:scale-[1.02]",
                                            selectedUserId === conv.otherUser.id
                                                ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]"
                                                : "bg-white/40 hover:bg-white/80 shadow-sm"
                                        )}
                                        onClick={() => setSelectedUserId(conv.otherUser.id)}
                                    >
                                        <div className={cn(
                                            "rounded-circle fw-bold d-flex align-items-center justify-content-center shadow-inner",
                                            selectedUserId === conv.otherUser.id ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                                        )} style={{ width: 48, height: 48, flexShrink: 0 }}>
                                            <User size={24} />
                                        </div>
                                        <div className="overflow-hidden flex-grow-1">
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <div className="fw-bold text-truncate leading-tight">
                                                    {conv.otherUser.firstName} {conv.otherUser.lastName}
                                                </div>
                                                {conv.unreadCount > 0 && selectedUserId !== conv.otherUser.id && (
                                                    <span className="badge rounded-pill bg-danger border border-2 border-white animate-pulse">
                                                        {conv.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={cn("small text-truncate", selectedUserId === conv.otherUser.id ? "text-white/70" : "text-muted")}>
                                                {conv.lastMessage.content}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}

                            {/* Staff/User Discovery */}
                            <div className="mt-4">
                                <h6 className="small text-uppercase fw-black text-muted mb-3 px-2 tracking-wider">Start New Chat</h6>
                                {loadingUsers ? (
                                    <div className="text-center p-3 opacity-30"><div className="spinner-border spinner-border-sm" /></div>
                                ) : chatableUsers.filter(u => !conversations.some(c => c.otherUser.id === u.id)).length === 0 && conversations.length > 0 ? (
                                    <p className="small text-muted text-center py-2 italic">All active users listed above.</p>
                                ) : (
                                    chatableUsers.filter(u => !conversations.some(c => c.otherUser.id === u.id)).map(u => (
                                        <button
                                            key={u.id}
                                            className="w-100 border-0 p-3 rounded-4 mb-2 text-start d-flex align-items-center gap-3 bg-white/20 hover:bg-white/50 transition-colors"
                                            onClick={() => setSelectedUserId(u.id)}
                                        >
                                            <div className="rounded-circle bg-light d-flex align-items-center justify-content-center text-muted" style={{ width: 36, height: 36 }}>
                                                <User size={18} />
                                            </div>
                                            <div className="overflow-hidden">
                                                <div className="fw-bold small">{u.firstName} {u.lastName}</div>
                                                <div className="text-muted" style={{ fontSize: '10px' }}>{u.role.toUpperCase()}</div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Chat Window */}
                <div className={cn("col-md-8 h-100", selectedUserId ? "block" : "d-none d-md-block")}>
                    <GlassCard className="h-100 p-0 overflow-hidden d-flex flex-column border-0 shadow-lg">
                        {selectedUserId ? (
                            <>
                                {/* Header */}
                                <div className="p-4 border-bottom bg-white/50 backdrop-blur-sm d-flex align-items-center gap-3">
                                    <button className="btn btn-sm btn-light d-md-none rounded-circle h-10 w-10 p-0" onClick={() => setSelectedUserId(null)}>
                                        <ChevronLeft size={20} />
                                    </button>
                                    <div className="rounded-circle bg-primary shadow-sm text-white d-flex align-items-center justify-content-center" style={{ width: 44, height: 44 }}>
                                        <User size={22} />
                                    </div>
                                    <div className="flex-grow-1">
                                        <h6 className="mb-0 fw-black text-dark">{selectedUser?.firstName} {selectedUser?.lastName}</h6>
                                        <div className="d-flex align-items-center gap-1">
                                            <span className="small text-muted text-uppercase fw-bold" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>{selectedUser?.role}</span>
                                            <span className="rounded-circle bg-success mb-0" style={{ width: 6, height: 6 }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div
                                    ref={scrollRef}
                                    className="flex-grow-1 overflow-auto p-4 d-flex flex-column gap-3 bg-gradient-to-b from-slate-50 to-white/10"
                                >
                                    {loadingMsgs ? (
                                        <div className="my-auto text-center"><div className="spinner-border text-primary opacity-20" /></div>
                                    ) : messages.length === 0 ? (
                                        <div className="text-center text-muted my-auto opacity-40">
                                            <MessageCircle size={64} className="mx-auto mb-3" />
                                            <h5 className="fw-black">Say hello!</h5>
                                            <p className="small">Start your conversation with {selectedUser?.firstName}.</p>
                                        </div>
                                    ) : (
                                        messages.map((msg, idx) => {
                                            const isMe = msg.senderId === me?.id;
                                            const showDate = idx === 0 || new Date(messages[idx - 1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

                                            return (
                                                <div key={msg.id} className="w-100">
                                                    {showDate && (
                                                        <div className="text-center my-4">
                                                            <span className="small bg-white/60 px-3 py-1 rounded-pill text-muted fw-bold border" style={{ fontSize: '10px' }}>
                                                                {new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className={cn(
                                                        "max-w-75 d-flex flex-column",
                                                        isMe ? "ms-auto align-items-end" : "me-auto align-items-start"
                                                    )}>
                                                        <div
                                                            className={cn(
                                                                "p-3 shadow-md transition-all",
                                                                isMe
                                                                    ? "bg-primary text-white rounded-t-3xl rounded-bl-3xl rounded-br-none shadow-primary/10"
                                                                    : "bg-white text-dark rounded-t-3xl rounded-br-3xl rounded-bl-none border border-slate-100"
                                                            )}
                                                        >
                                                            <div className="mb-1 leading-relaxed">{msg.content}</div>
                                                            <div className={cn(
                                                                "d-flex align-items-center gap-1 justify-content-end",
                                                                isMe ? "text-white/60" : "text-muted"
                                                            )} style={{ fontSize: '10px' }}>
                                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                {isMe && (
                                                                    <CheckCheck size={12} className={msg.readAt ? "text-info" : ""} />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Input Field */}
                                <div className="p-4 border-top bg-white/80 backdrop-blur-md">
                                    <form onSubmit={handleSend} className="d-flex gap-3 align-items-center">
                                        <div className="position-relative flex-grow-1">
                                            <input
                                                className="form-control rounded-pill border-0 bg-slate-100 px-4 py-2.5 shadow-inner"
                                                placeholder="Type your message here..."
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="btn btn-primary rounded-full d-flex align-items-center justify-content-center h-11 w-11 p-0 shadow-lg shadow-primary/30 transition-transform active:scale-90"
                                            disabled={!input.trim() || sendMessage.isPending}
                                        >
                                            <Send size={20} className={sendMessage.isPending ? "animate-ping" : ""} />
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="m-auto text-center text-muted p-5 max-w-sm">
                                <div className="mb-5">
                                    <div className="rounded-full bg-gradient-to-br from-primary/10 to-primary/5 d-inline-flex align-items-center justify-content-center mb-4 shadow-inner" style={{ width: 120, height: 120 }}>
                                        <MessageCircle size={56} className="text-primary opacity-40" />
                                    </div>
                                    <h3 className="fw-black text-dark mb-2">Messenger</h3>
                                    <p className="small leading-relaxed">Select one of your colleagues or a support staff member to start a conversation.</p>
                                </div>
                                <div className="hstack gap-2 justify-content-center opacity-30">
                                    <div className="bg-slate-200 h-1 flex-grow-1 rounded"></div>
                                    <span className="small fw-bold">SECURE CHANNEL</span>
                                    <div className="bg-slate-200 h-1 flex-grow-1 rounded"></div>
                                </div>
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>
        </>
    );

    if (me?.role === "customer") {
        return content;
    }

    return <AppShell>{content}</AppShell>;
}
