const fs = require('fs');

const code = `import { theme } from "@common/theme";
import { Box, Typography, Menu, MenuItem } from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { ChatMessage } from "@modules/chats/api";
import { useState } from "react";

type MessageBubbleProps = {
    message: ChatMessage;
    isMine: boolean;
    footer: string;
    onEdit?: (message: ChatMessage) => void;
};

function StatusIcon({ status }: { status: ChatMessage["status"] }) {
    if (status === "sent") {
        return (
            <DoneIcon
                sx={{ fontSize: 14, color: "rgba(255,255,255,0.75)", ml: 0.3, flexShrink: 0 }}
            />
        );
    }
    if (status === "delivered") {
        return (
            <DoneAllIcon
                sx={{ fontSize: 14, color: "rgba(255,255,255,0.75)", ml: 0.3, flexShrink: 0 }}
            />
        );
    }
    // read
    return (
        <DoneAllIcon
            sx={{ fontSize: 14, color: theme.palette.text.white, ml: 0.3, flexShrink: 0 }}
        />
    );
}

export function MessageBubble(props: MessageBubbleProps) {
    const { message, isMine, footer, onEdit } = props;
    
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const handleContextMenu = (e: React.MouseEvent<HTMLElement>) => {
        if (!isMine || !onEdit) return;
        e.preventDefault();
        setAnchorEl(e.currentTarget);
    };
    
    const handleClose = () => setAnchorEl(null);
    const handleEdit = () => {
        handleClose();
        if (onEdit) onEdit(message);
    };

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: isMine ? "flex-end" : "flex-start",
            }}
        >
            <Box sx={{ maxWidth: "82%" }}>
                <Box
                    onContextMenu={handleContextMenu}
                    onClick={isMine ? (e) => setAnchorEl(e.currentTarget) : undefined}
                    sx={{
                        cursor: isMine ? "pointer" : "default",
                        px: 2,
                        py: 1.25,
                        borderRadius: isMine
                            ? "20px 20px 6px 20px"
                            : "20px 20px 20px 6px",
                        background: isMine
                            ? "linear-gradient(135deg, #4a7cff 0%, #3b82f6 100%)"
                            : "#ffffff",
                        color: isMine ? "#ffffff" : "#222738",
                        boxShadow: isMine
                            ? "0 6px 16px -6px rgba(59,130,246,0.4)"
                            : "0 1px 2px rgba(30,40,70,0.05)",
                        transition: "opacity 0.2s",
                        "&:active": {
                            opacity: isMine ? 0.85 : 1,
                        }
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: 15,
                            fontWeight: 500,
                            lineHeight: 1.4,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                        }}
                    >
                        {message.message}
                    </Typography>
                    {isMine && (
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                mt: 0.4,
                                gap: 0.3,
                            }}
                        >
                            {message.isEdited && (
                                <Typography
                                    sx={{
                                        fontSize: 10,
                                        color: "rgba(255,255,255,0.6)",
                                        lineHeight: 1,
                                        fontWeight: 500,
                                        mr: 0.5,
                                        fontStyle: "italic",
                                    }}
                                >
                                    изменено
                                </Typography>
                            )}
                            <Typography
                                sx={{
                                    fontSize: 10.5,
                                    color: "rgba(255,255,255,0.8)",
                                    lineHeight: 1,
                                    fontWeight: 500,
                                }}
                            >
                                {footer.split(" • ")[0]}
                            </Typography>
                            <StatusIcon status={message.status} />
                        </Box>
                    )}
                </Box>
                {!isMine && (
                    <Typography
                        sx={{
                            mt: 0.4,
                            px: 1,
                            fontSize: 10.5,
                            color: theme.palette.text.secondary,
                            textAlign: "left",
                            fontWeight: 500,
                        }}
                    >
                        {footer}
                        {message.isEdited && (
                            <Box component="span" sx={{ fontStyle: "italic", ml: 1, opacity: 0.7 }}>
                                изменено
                            </Box>
                        )}
                    </Typography>
                )}
                
                {isMine && onEdit && (
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                        PaperProps={{
                            elevation: 0,
                            sx: {
                                mt: 1,
                                borderRadius: "12px",
                                minWidth: 140,
                                border: \`1px solid \${theme.palette.base.generic}\`,
                                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                            }
                        }}
                    >
                        <MenuItem onClick={handleEdit} sx={{ fontSize: 14, fontWeight: 500 }}>
                            Изменить
                        </MenuItem>
                    </Menu>
                )}
            </Box>
        </Box>
    );
}
`;

fs.writeFileSync('src/modules/chats/components/MessageBubble.tsx', code);
