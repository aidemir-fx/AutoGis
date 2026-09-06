const fs = require('fs');

const code = `import {
    Alert,
    Box,
    CircularProgress,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { ChatMessage, ChatOrder } from "@modules/chats/api";
import { theme } from "@common/theme";
import { ChatListItem } from "./ChatListItem";

type ChatTab = "ordinary" | "professional";
type ChatFolder = "active" | "archived";

type ChatListMeta = {
    lastMessage?: ChatMessage;
    unreadCount: number;
};

type ChatListProps = {
    hasProfessionalChatAccess: boolean;
    tab: ChatTab;
    onChangeTab: (value: ChatTab) => void;
    onBack: () => void;
    orders: ChatOrder[];
    isLoading: boolean;
    profileId: string;
    folder: ChatFolder;
    onChangeFolder: (folder: ChatFolder) => void;
    onChatAction: (orderId: string, action: "archive" | "unarchive" | "delete") => void;
    getMeta: (orderId: string) => ChatListMeta;
    onOpenChat: (orderId: string) => void;
    formatRelativeTime: (value: string) => string;
};

const PILL_TABS: { value: ChatTab; label: string }[] = [
    { value: "ordinary", label: "Обычный" },
    { value: "professional", label: "Проф." },
];

const FOLDER_TABS: { value: ChatFolder; label: string }[] = [
    { value: "active", label: "Активные" },
    { value: "archived", label: "Архив" },
];

export function ChatList(props: ChatListProps) {
    const {
        hasProfessionalChatAccess,
        tab,
        onChangeTab,
        onBack,
        orders,
        isLoading,
        profileId,
        folder,
        onChangeFolder,
        onChatAction,
        getMeta,
        onOpenChat,
        formatRelativeTime,
    } = props;

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
                backgroundColor: theme.palette.background[1],
            }}
        >
            <Box
                sx={{
                    px: 2,
                    pt: 2,
                    pb: 1,
                    backgroundColor: "transparent",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                }}
            >
                <IconButton
                    aria-label="Назад"
                    onClick={onBack}
                    sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "14px",
                        backgroundColor: theme.palette.white,
                        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                        color: theme.palette.text.primary,
                        "&:hover": { backgroundColor: theme.palette.background[2] },
                    }}
                >
                    <ArrowBackRoundedIcon fontSize="small" />
                </IconButton>
                <Typography
                    sx={{
                        fontWeight: 800,
                        fontSize: 22,
                        letterSpacing: "-0.02em",
                        color: theme.palette.text.primary,
                    }}
                >
                    Чаты
                </Typography>
            </Box>
            
            {hasProfessionalChatAccess && (
                <Box
                    sx={{
                        px: 2,
                        pt: 1.5,
                        pb: 0.5,
                        display: "flex",
                        gap: 1,
                        overflowX: "auto",
                        "&::-webkit-scrollbar": { display: "none" },
                        scrollbarWidth: "none",
                    }}
                >
                    {PILL_TABS.map((pill) => {
                        const isActive = tab === pill.value;
                        return (
                            <Box
                                key={pill.value}
                                component="button"
                                onClick={() => onChangeTab(pill.value)}
                                sx={{
                                    padding: "8px 14px",
                                    borderRadius: "999px",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    whiteSpace: "nowrap",
                                    fontFamily: "inherit",
                                    transition: "all .18s ease",
                                    ...(isActive
                                        ? {
                                              background:
                                                  "linear-gradient(135deg, #4a7cff 0%, #3b82f6 100%)",
                                              color: "#ffffff",
                                              boxShadow:
                                                  "0 6px 14px -4px rgba(59,130,246,0.45)",
                                          }
                                        : {
                                              backgroundColor: theme.palette.white,
                                              color: theme.palette.text.secondary,
                                              boxShadow:
                                                  "0 1px 2px rgba(0,0,0,0.03)",
                                          }),
                                }}
                            >
                                {pill.label}
                            </Box>
                        );
                    })}
                </Box>
            )}

            <Box
                sx={{
                    px: 2,
                    pt: hasProfessionalChatAccess ? 0.5 : 1.5,
                    pb: 1,
                    display: "flex",
                    gap: 1.5,
                    borderBottom: \`1px solid \${theme.palette.base.generic}\`,
                }}
            >
                {FOLDER_TABS.map((f) => (
                    <Box
                        key={f.value}
                        component="button"
                        onClick={() => onChangeFolder(f.value)}
                        sx={{
                            background: "none",
                            border: "none",
                            padding: "4px 0",
                            cursor: "pointer",
                            fontSize: 14,
                            fontWeight: folder === f.value ? 700 : 500,
                            color: folder === f.value ? theme.palette.actions.brand : theme.palette.text.secondary,
                            position: "relative",
                            "&::after": {
                                content: '""',
                                position: "absolute",
                                bottom: -1,
                                left: 0,
                                right: 0,
                                height: 2,
                                backgroundColor: folder === f.value ? theme.palette.actions.brand : "transparent",
                                borderRadius: "2px 2px 0 0",
                                transition: "background-color 0.2s",
                            }
                        }}
                    >
                        {f.label}
                    </Box>
                ))}
            </Box>

            <Box
                sx={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: "auto",
                    px: 1.5,
                    pt: 1,
                    pb: 2,
                }}
            >
                {isLoading && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress size={26} />
                    </Box>
                )}
                {!isLoading && orders.length === 0 && (
                    <Alert
                        severity="info"
                        sx={{
                            borderRadius: "14px",
                            backgroundColor: theme.palette.white,
                            border: \`1px solid \${theme.palette.base.generic}\`,
                        }}
                    >
                        Здесь появятся чаты по вашим заявкам.
                    </Alert>
                )}
                <Stack spacing={1}>
                    {orders.map((order) => {
                        const meta = getMeta(order.id);
                        return (
                            <ChatListItem
                                key={order.id}
                                order={order}
                                profileId={profileId}
                                lastMessage={meta.lastMessage}
                                unreadCount={meta.unreadCount}
                                onOpen={onOpenChat}
                                formatRelativeTime={formatRelativeTime}
                                isArchived={folder === "archived"}
                                onAction={onChatAction}
                            />
                        );
                    })}
                </Stack>
            </Box>
        </Box>
    );
}
`;

fs.writeFileSync('src/modules/chats/components/ChatList.tsx', code);
