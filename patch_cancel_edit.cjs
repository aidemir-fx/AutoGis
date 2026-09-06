const fs = require('fs');
let code = fs.readFileSync('src/modules/chats/components/ChatRoom.tsx', 'utf8');

// I will find the 'component="form"' Box and add something before ChatInput
const formRegex = /<Box\s+component="form"\s+onSubmit=\{onSubmit\}[\s\S]*?>/;

const match = code.match(formRegex);
if (match) {
    const editBar = `
            <Box
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
`;

    // We replace the form opening with the new wrapper
    // We also need to add a closing </Box> at the end.
    
    code = code.replace(
        /<Box\s+component="form"\s+onSubmit=\{onSubmit\}\s+sx=\{\{[\s\S]*?\}\s*\}\s*>\s*<ChatInput/m,
        editBar + '                <ChatInput'
    );
    
    // add closing box
    code = code.replace(
        /<\/ChatInput>\s*<\/Box>\s*<\/Box>/m,
        '</ChatInput>\n                </Box>\n            </Box>\n        </Box>'
    );
    
    fs.writeFileSync('src/modules/chats/components/ChatRoom.tsx', code);
    console.log("Patched successfully");
} else {
    console.log("Not found");
}

