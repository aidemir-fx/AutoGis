const fs = require('fs');
let code = fs.readFileSync('src/modules/chats/components/ChatRoom.tsx', 'utf8');

const regex = /<Box\s+component="form"[\s\S]*?\}\s*\)\s*\}\s*<Box sx=\{\{ display: 'flex', gap: 1, alignItems: 'flex-end' \}\}>\s*<ChatInput\s+value=\{messageValue\}\s+onChange=\{onMessageChange\}\s+onBlur=\{onMessageBlur\}\s+isSending=\{isSending\}\s*\/>\s*<\/Box>\s*<\/Box>\s*\);\s*\}/m;

const newBottom = `            <Box
                component="form"
                onSubmit={onSubmit}
                sx={{
                    px: 1.5,
                    py: 1.25,
                    backgroundColor: "rgba(255,255,255,0.75)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    borderTop: "1px solid rgba(228,232,240,0.6)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                }}
            >
                {editingMessageId && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1, color: theme.palette.actions.brand }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <BuildRoundedIcon sx={{ fontSize: 14 }} /> Редактирование сообщения
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={() => onEditMessage?.({ id: "", message: "", status: "sent", createdAt: "", sender: { id: "", phone: "" } })}
                            sx={{ p: 0.5 }}
                        >
                            <span style={{ fontSize: 16 }}>✕</span>
                        </IconButton>
                    </Box>
                )}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    <ChatInput
                        value={messageValue}
                        onChange={onMessageChange}
                        onBlur={onMessageBlur}
                        isSending={isSending}
                    />
                </Box>
            </Box>
        </Box>
    );
}`;

code = code.replace(/<Box\s+component="form"[\s\S]*$/, newBottom);

fs.writeFileSync('src/modules/chats/components/ChatRoom.tsx', code);
