import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Paper, useMediaQuery } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { hasCapability } from "@common/lib/userAccess";
import { goBackOrNavigate } from "@common/lib/navigation";
import { useUserProfile } from "@common/hooks";
import { theme } from "@common/theme";
import {
    ChatMessage,
    getCustomerOrders,
    getOrderChat,
    OrderChatResponse,
    getProviderOrders,
    sendOrderMessage,
    editOrderMessage,
    getUnreadCounts,
    UnreadCount,
} from "@modules/chats/api";
import {
    ChatList,
    ChatRoom,
    formatRelativeTime,
    getCompanion,
    getStatusLabel,
} from "@modules/chats/components";
import {
    ChatMessageStatusEvent,
    ChatRealtimeEvent,
    useChatTyping,
    useRealtimeChat,
} from "@modules/chats/hooks";
import { COMPACT_LAYOUT_MEDIA_QUERY } from "@modules/layout/features/layoutViewport";

type ChatTab = "ordinary" | "professional";
type ChatView = "list" | "chat";

export function Chats() {
    const navigate = useNavigate();
    const isMobile = useMediaQuery(COMPACT_LAYOUT_MEDIA_QUERY);
    const [searchParams, setSearchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const { profile } = useUserProfile();

    const hasExplicitTab = searchParams.has("tab");
    const requestedOrderId = searchParams.get("orderId");
    const tabParam =
        searchParams.get("tab") === "professional" ? "professional" : "ordinary";

    const [message, setMessage] = useState("");
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [tab, setTab] = useState<ChatTab>(tabParam);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [view, setView] = useState<ChatView>("list");

    const [hiddenChats, setHiddenChats] = useState<Record<string, "archived" | "deleted">>(() => {
        try {
            return JSON.parse(localStorage.getItem("hiddenChats") || "{}");
        } catch {
            return {};
        }
    });

    const handleChatAction = (orderId: string, action: "archive" | "unarchive" | "delete") => {
        const next = { ...hiddenChats };
        if (action === "delete") {
            next[orderId] = "deleted";
        } else if (action === "archive") {
            next[orderId] = "archived";
        } else {
            delete next[orderId];
        }
        setHiddenChats(next);
        localStorage.setItem("hiddenChats", JSON.stringify(next));
    };

    const [folder, setFolder] = useState<"active" | "archived">("active");


    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const hasProfessionalChatAccess = hasCapability(
        profile,
        "professionalChat",
    );

    const { data: customerOrders, isLoading: isCustomerOrdersLoading } = useQuery({
        queryKey: ["customerOrdersForChat", profile?.id],
        queryFn: getCustomerOrders,
        enabled: !!profile?.id,
    });

    const { data: providerOrders, isLoading: isProviderOrdersLoading } = useQuery({
        queryKey: ["providerOrdersForChat", profile?.id],
        queryFn: getProviderOrders,
        enabled: !!profile?.id && hasProfessionalChatAccess,
    });

    const { data: serverUnreadCounts } = useQuery<UnreadCount[]>({
        queryKey: ["unreadCounts"],
        queryFn: getUnreadCounts,
        enabled: !!profile?.id,
        refetchInterval: 30_000,
        staleTime: 15_000,
        retry: false,
    });

    const serverUnreadMap = useMemo(
        () => new Map<string, number>((serverUnreadCounts ?? []).map((c) => [c.orderId, c.count])),
        [serverUnreadCounts]
    );

    const customerOrderIds = useMemo(
        () => new Set((customerOrders ?? []).map((order) => order.id)),
        [customerOrders]
    );

    const providerOrderIds = useMemo(
        () => new Set((providerOrders ?? []).map((order) => order.id)),
        [providerOrders]
    );

    const unreadProviderCount = useMemo(() => {
        let total = 0;
        serverUnreadMap.forEach((count, orderId) => {
            if (providerOrderIds.has(orderId)) total += count;
        });
        return total;
    }, [providerOrderIds, serverUnreadMap]);

        const allOrders = tab === "professional" ? (providerOrders ?? []) : (customerOrders ?? []);

    const activeOrders = useMemo(() => {
        return allOrders.filter((order) => {
            const status = hiddenChats[order.id];
            if (status === "deleted") return false;
            if (folder === "archived") return status === "archived";
            return status !== "archived";
        });
    }, [allOrders, hiddenChats, folder]);

    useEffect(() => {
        if (!hasProfessionalChatAccess && tab !== "ordinary") {
            setTab("ordinary");
        }
    }, [hasProfessionalChatAccess, tab]);

    useEffect(() => {
        if (!hasExplicitTab) return;

        if (tabParam === "professional" && !hasProfessionalChatAccess) {
            if (tab !== "ordinary") {
                setTab("ordinary");
            }
            setSearchParams({ tab: "ordinary" }, { replace: true });
            return;
        }

        if (tabParam !== tab) {
            setTab(tabParam);
        }
    }, [hasExplicitTab, hasProfessionalChatAccess, setSearchParams, tab, tabParam]);

    useEffect(() => {
        if (hasExplicitTab || !hasProfessionalChatAccess) return;
        if (unreadProviderCount > 0 && tab !== "professional") {
            setTab("professional");
        }
    }, [
        hasExplicitTab,
        hasProfessionalChatAccess,
        tab,
        unreadProviderCount,
    ]);

    useEffect(() => {
        if (!requestedOrderId) return;

        if (
            hasProfessionalChatAccess &&
            providerOrderIds.has(requestedOrderId) &&
            tab !== "professional"
        ) {
            setTab("professional");
            return;
        }

        if (customerOrderIds.has(requestedOrderId) && tab !== "ordinary") {
            setTab("ordinary");
        }
    }, [
        customerOrderIds,
        hasProfessionalChatAccess,
        providerOrderIds,
        requestedOrderId,
        tab,
    ]);

    useEffect(() => {
        if (activeOrders.length === 0) {
            setSelectedOrderId(null);
            setView("list");
            return;
        }

        if (requestedOrderId) {
            const hasRequested = activeOrders.some((order) => order.id === requestedOrderId);
            if (hasRequested) {
                if (selectedOrderId !== requestedOrderId) {
                    setSelectedOrderId(requestedOrderId);
                }
                setView("chat");
            } else {
                setSelectedOrderId(null);
                setView("list");
            }
            return;
        }

        if (!selectedOrderId) {
            if (!isMobile) {
                setSelectedOrderId(activeOrders[0].id);
                setView("chat");
            }
            return;
        }

        const hasSelected = activeOrders.some((order) => order.id === selectedOrderId);
        if (!hasSelected) {
            setSelectedOrderId(isMobile ? null : activeOrders[0].id);
            setView("list");
        }
    }, [activeOrders, isMobile, requestedOrderId, selectedOrderId]);

    useEffect(() => {
        if (!profile?.id || !serverUnreadCounts?.length) return;

        const knownOrderIds = new Set<string>([
            ...(customerOrders ?? []).map((order) => order.id),
            ...(providerOrders ?? []).map((order) => order.id),
        ]);
        const hasUnknownUnreadOrder = serverUnreadCounts.some(
            (item) => item.count > 0 && !knownOrderIds.has(item.orderId)
        );

        if (!hasUnknownUnreadOrder) return;

        queryClient.invalidateQueries({
            queryKey: ["customerOrdersForChat", profile.id],
        });
        queryClient.invalidateQueries({
            queryKey: ["providerOrdersForChat", profile.id],
        });
        queryClient.invalidateQueries({ queryKey: ["providerOrders", profile.id] });
    }, [customerOrders, profile?.id, providerOrders, queryClient, serverUnreadCounts]);

    const { data: orderChat, isLoading: isChatLoading } = useQuery({
        queryKey: ["orderChat", selectedOrderId],
        queryFn: () => getOrderChat(selectedOrderId as string),
        enabled: !!selectedOrderId,
    });

    const updateMessageStatusInCache = useCallback(
        (orderId: string, messageId: string, status: ChatMessage["status"]) => {
            queryClient.setQueryData<OrderChatResponse>(["orderChat", orderId], (current) => {
                if (!current) return current;

                return {
                    ...current,
                    messages: current.messages.map((item) =>
                        item.id === messageId ? { ...item, status } : item
                    ),
                };
            });
        },
        [queryClient]
    );

    const handleNewOrderMessage = useCallback(
        (payload: ChatRealtimeEvent) => {
            const cached = queryClient.getQueryData<OrderChatResponse>(
                ["orderChat", payload.orderId]
            );

            if (profile?.id) {
                queryClient.invalidateQueries({
                    queryKey: ["customerOrdersForChat", profile.id],
                });
                queryClient.invalidateQueries({
                    queryKey: ["providerOrdersForChat", profile.id],
                });
                queryClient.invalidateQueries({ queryKey: ["providerOrders", profile.id] });
            }

            if (cached) {
                // Чат уже в кэше — обновляем его напрямую
                queryClient.setQueryData<OrderChatResponse>(
                    ["orderChat", payload.orderId],
                    (current) => {
                        if (!current) return current;
                        const alreadyExists = current.messages.some(
                            (item) => item.id === payload.message.id
                        );
                        if (alreadyExists) return current;
                        return {
                            ...current,
                            messages: [...current.messages, payload.message],
                        };
                    }
                );
            } else {
                // Чат не открывался — инвалидируем серверный счётчик
                // чтобы badge в BottomNav обновился без ожидания polling'а
                queryClient.invalidateQueries({ queryKey: ["unreadCounts"] });
            }
        },
        [profile?.id, queryClient]
    );

    const handleMessageStatusUpdated = useCallback(
        (payload: ChatMessageStatusEvent) => {
            updateMessageStatusInCache(payload.orderId, payload.messageId, payload.status);
        },
        [updateMessageStatusInCache]
    );

    const {
        isRealtimeConnected,
        typingByOrder,
        emitTypingEvent,
        sendMessageViaSocket,
    } = useRealtimeChat({
        profileId: profile?.id,
        selectedOrderId,
        onNewOrderMessage: handleNewOrderMessage,
        onMessageStatusUpdated: handleMessageStatusUpdated,
    });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [orderChat?.messages.length, selectedOrderId]);

    const { onInputChange: handleTypingInputChange, stopTyping } = useChatTyping({
        selectedOrderId,
        emitTypingEvent,
    });

    const handleMessageChange = (nextValue: string) => {
        setMessage(nextValue);
        handleTypingInputChange(nextValue);
    };

    
    const editMessageMutation = useMutation({
        mutationFn: (variables: { orderId: string; messageId: string; text: string }) =>
            editOrderMessage(variables.orderId, variables.messageId, variables.text),
        onError: (err) => {
            console.error("Edit message error:", err);
            alert("Ошибка при редактировании сообщения. Попробуйте еще раз.");
        },
        onSuccess: (updatedMessage, variables) => {
            setEditingMessageId(null);
            setMessage("");
            queryClient.setQueryData<OrderChatResponse | undefined>(
                ["orderChat", variables.orderId],
                (current) => {
                    if (!current) return current;
                    return {
                        ...current,
                        messages: current.messages.map((m) =>
                            m.id === updatedMessage.id ? updatedMessage : m
                        ),
                    };
                }
            );
        },
    });

    const sendMessageMutation = useMutation({
        mutationFn: async ({ orderId, text }: { orderId: string; text: string }) => {
            try {
                return await sendMessageViaSocket(orderId, text);
            } catch {
                return sendOrderMessage(orderId, text);
            }
        },
        onSuccess: (newMessage: ChatMessage, variables) => {
            setMessage("");
            queryClient.setQueryData<OrderChatResponse>(
                ["orderChat", variables.orderId],
                (current) => {
                    if (!current) return current;
                    const alreadyExists = current.messages.some(
                        (item) => item.id === newMessage.id
                    );
                    if (alreadyExists) return current;

                    return {
                        ...current,
                        messages: [...current.messages, newMessage],
                    };
                }
            );
        },
    });

    const openChat = async (orderId: string) => {
        setSelectedOrderId(orderId);
        setView("chat");

        await queryClient.prefetchQuery({
            queryKey: ["orderChat", orderId],
            queryFn: () => getOrderChat(orderId),
        });

        // После загрузки чата сервер пометил сообщения как read —
        // инвалидируем серверный счётчик, чтобы badge сразу упал
        queryClient.invalidateQueries({ queryKey: ["unreadCounts"] });
    };

        const handleSend = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmed = message.trim();
        if (!trimmed || !selectedOrderId) return;

        stopTyping();
        
        if (editingMessageId) {
            editMessageMutation.mutate({ orderId: selectedOrderId, messageId: editingMessageId, text: trimmed });
        } else {
            sendMessageMutation.mutate({ orderId: selectedOrderId, text: trimmed });
        }
    };

    const handleEditMessage = (msg: import('@modules/chats/api').ChatMessage) => {
        if (!msg.id) {
            setEditingMessageId(null);
            setMessage("");
            return;
        }
        setEditingMessageId(msg.id);
        setMessage(msg.message);
    };

    if (!profile) return null;

    const selectedOrder = allOrders.find((item) => item.id === selectedOrderId) ?? null;
    const selectedCompanion = selectedOrder ? getCompanion(selectedOrder, profile.id) : null;

    const isChatVisible = view === "chat" && !!selectedOrderId && !!selectedCompanion;
    const isListVisible = !isChatVisible;

    const getOrderMeta = (orderId: string) => {
        const cachedChat = queryClient.getQueryData<OrderChatResponse>(["orderChat", orderId]);
        const lastMessage = cachedChat?.messages[cachedChat.messages.length - 1];

        let unreadCount: number;
        if (cachedChat) {
            // Чат загружен — считаем точно из кэша (обновляется по WS)
            unreadCount = cachedChat.messages.filter(
                (item) => item.sender.id !== profile.id && item.status !== "read"
            ).length;
        } else {
            // Чат не открывался — берём из серверного счётчика
            unreadCount = serverUnreadMap.get(orderId) ?? 0;
        }

        return { lastMessage, unreadCount };
    };

    return (
        <Box
            sx={{
                minHeight: "calc(100vh - 80px)",
                display: "flex",
                justifyContent: "center",
                py: { xs: 1, md: 3 },
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    width: "100%",
                    maxWidth: 460,
                    borderRadius: 6,
                    overflow: "hidden",
                    backgroundColor: theme.palette.background[1],
                    border: `1px solid ${theme.palette.base.generic}`,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: { xs: "calc(100vh - 96px)", md: "84vh" },
                }}
            >
                {isListVisible && (
                    <ChatList
                        hasProfessionalChatAccess={hasProfessionalChatAccess}
                        tab={tab}
                        onChangeTab={(value) => {
                            setTab(value);
                            setSearchParams({ tab: value });
                        }}
                        onBack={() => goBackOrNavigate(navigate, "/cabinet")}
                                                orders={activeOrders}
                        isLoading={isCustomerOrdersLoading || isProviderOrdersLoading}
                        profileId={profile.id}
                        folder={folder}
                        onChangeFolder={setFolder}
                        onChatAction={handleChatAction}
                        getMeta={getOrderMeta}
                        onOpenChat={(orderId) => {
                            void openChat(orderId);
                        }}
                        formatRelativeTime={formatRelativeTime}
                    />
                )}

                {isChatVisible && selectedCompanion && selectedOrderId && (
                    <ChatRoom
                        companion={selectedCompanion}
                        isOnline={isRealtimeConnected}
                        onBack={() => setView("list")}
                        isLoading={isChatLoading}
                        orderChat={orderChat}
                        profileId={profile.id}
                        isTypingVisible={
                            Boolean(typingByOrder[selectedOrderId]) &&
                            typingByOrder[selectedOrderId] !== profile.id
                        }
                        messagesEndRef={messagesEndRef}
                        messageValue={message}
                        onMessageChange={handleMessageChange}
                        onMessageBlur={stopTyping}
                        onEditMessage={handleEditMessage}
                        editingMessageId={editingMessageId}
                        onSubmit={handleSend}
                        isSending={sendMessageMutation.isPending || editMessageMutation.isPending}
                        formatRelativeTime={formatRelativeTime}
                        getStatusLabel={getStatusLabel}
                    />
                )}
            </Paper>
        </Box>
    );
}
