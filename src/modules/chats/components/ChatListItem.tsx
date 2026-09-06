import { Avatar, Badge, Box, Paper, Stack, Typography, Menu, MenuItem, IconButton } from "@mui/material";
import { useState } from "react";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import { ChatMessage, ChatOrder } from "@modules/chats/api";
import { theme } from "@common/theme";
import { getAvatarGradient, getCompanion, getInitialLabel } from "./utils";

type ChatListItemProps = {
    order: ChatOrder;
    profileId: string;
    lastMessage?: ChatMessage;
    unreadCount: number;
        onOpen: (orderId: string) => void;
    formatRelativeTime: (value: string) => string;
    isArchived: boolean;
    onAction: (orderId: string, action: "archive" | "unarchive" | "delete") => void;
};

export function ChatListItem(props: ChatListItemProps) {
        const { order, profileId, lastMessage, unreadCount, onOpen, formatRelativeTime, isArchived, onAction } = props;
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = (event?: any) => {
        if (event) event.stopPropagation();
        setAnchorEl(null);
    };

    const handleAction = (event: React.MouseEvent, action: "archive" | "unarchive" | "delete") => {
        event.stopPropagation();
        onAction(order.id, action);
        handleMenuClose();
    };
    const companion = getCompanion(order, profileId);
    const displayName = companion.name || companion.phone;
    const avatarGradient = getAvatarGradient(displayName + companion.id);
    const previewText =
        lastMessage?.message || order.description || "Откройте чат";
    const isMineLast = lastMessage && lastMessage.sender.id === profileId;

    return (
        <Paper
            elevation={0}
            onClick={() => onOpen(order.id)}
            sx={{
                p: 1.5,
                borderRadius: "18px",
                cursor: "pointer",
                backgroundColor: theme.palette.white,
                border: "1px solid transparent",
                transition:
                    "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
                "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 6px 16px -8px rgba(30,40,70,0.18)",
                    borderColor: theme.palette.background[2],
                },
            }}
        >
            <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ position: "relative", flexShrink: 0 }}>
                    <Avatar
                        src={companion.avatarUrl ?? undefined}
                        alt={displayName}
                        sx={{
                            width: 52,
                            height: 52,
                            borderRadius: "18px",
                            background: companion.avatarUrl ? "#d2d5dd" : avatarGradient,
                            color: theme.palette.text.white,
                            fontWeight: 700,
                            fontSize: 17,
                            letterSpacing: "-0.01em",
                        }}
                        variant="rounded"
                    >
                        {getInitialLabel(displayName)}
                    </Avatar>
                </Box>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={1}
                        sx={{ mb: 0.3 }}
                    >
                        <Typography
                            sx={{
                                fontWeight: 700,
                                fontSize: 15,
                                color: theme.palette.text.primary,
                                letterSpacing: "-0.01em",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {displayName}
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: 11,
                                color: theme.palette.text.hint,
                                flexShrink: 0,
                                fontWeight: 500,
                            }}
                        >
                            {formatRelativeTime(lastMessage?.createdAt || order.createdAt)}
                        </Typography>
                    </Stack>

                    <Typography
                        sx={{
                            fontSize: 13,
                            color: theme.palette.text.secondary,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            lineHeight: 1.4,
                        }}
                    >
                        {isMineLast && (
                            <Box component="span" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                                Вы:{" "}
                            </Box>
                        )}
                        {previewText}
                    </Typography>
                </Box>

                <Stack
                    direction="column"
                    alignItems="flex-end"
                    spacing={0.8}
                    sx={{ flexShrink: 0 }}
                >
                    {order.carBrand && (
                        <Box
                            component="span"
                            sx={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: theme.palette.text.secondary,
                                backgroundColor: theme.palette.background[2],
                                padding: "2px 7px",
                                borderRadius: "6px",
                                maxWidth: 90,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {order.carBrand}
                        </Box>
                    )}
                    {unreadCount > 0 && (
                        <Badge
                            badgeContent={unreadCount}
                            sx={{
                                "& .MuiBadge-badge": {
                                    position: "static",
                                    transform: "none",
                                    minWidth: 20,
                                    height: 20,
                                    fontWeight: 700,
                                    fontSize: 11,
                                    background:
                                        "linear-gradient(135deg, #4a7cff 0%, #3b82f6 100%)",
                                    color: theme.palette.text.white,
                                    boxShadow: "0 4px 10px -2px rgba(59,130,246,0.4)",
                                    padding: "0 6px",
                                },
                            }}
                        />
                    )}
                
                    <IconButton size="small" onClick={handleMenuOpen} sx={{ mt: 0.5, color: theme.palette.text.hint }}>
                        <MoreVertRoundedIcon fontSize="small" />
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        onClick={(e) => e.stopPropagation()}
                        PaperProps={{
                            elevation: 0,
                            sx: {
                                mt: 1,
                                borderRadius: "12px",
                                minWidth: 140,
                                border: `1px solid ${theme.palette.base.generic}`,
                                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                            }
                        }}
                    >
                        {isArchived ? (
                            <MenuItem onClick={(e) => handleAction(e, "unarchive")} sx={{ fontSize: 14, fontWeight: 500 }}>
                                Восстановить
                            </MenuItem>
                        ) : (
                            <MenuItem onClick={(e) => handleAction(e, "archive")} sx={{ fontSize: 14, fontWeight: 500 }}>
                                В архив
                            </MenuItem>
                        )}
                        <MenuItem onClick={(e) => handleAction(e, "delete")} sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.error.heavy }}>
                            Удалить
                        </MenuItem>
                    </Menu>
                </Stack>
            </Stack>
        </Paper>
    );
}
