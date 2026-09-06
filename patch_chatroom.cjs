const fs = require('fs');
let code = fs.readFileSync('src/modules/chats/components/ChatRoom.tsx', 'utf8');

// Update Props
code = code.replace(
    /isSending: boolean;/,
    'isSending: boolean;\n    onEditMessage?: (message: ChatMessage) => void;\n    editingMessageId?: string | null;'
);

// Destructure new props
code = code.replace(
    /        getStatusLabel,/,
    '        getStatusLabel,\n        onEditMessage,\n        editingMessageId,'
);

// Pass onEdit to MessageBubble
code = code.replace(
    /message=\{chatMessage\}\n                                        isMine=\{isMine\}\n                                        footer=\{footer\}/,
    'message={chatMessage}\n                                        isMine={isMine}\n                                        footer={footer}\n                                        onEdit={onEditMessage}'
);

fs.writeFileSync('src/modules/chats/components/ChatRoom.tsx', code);
