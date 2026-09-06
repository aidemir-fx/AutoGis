const fs = require('fs');
let code = fs.readFileSync('src/screens/cabinet/Chats/Chats.tsx', 'utf8');

code = code.replace(
    /const handleEditMessage = \(msg: import\('@modules\/chats\/api'\)\.ChatMessage\) => \{[\s\S]*?\};/,
    `const handleEditMessage = (msg: import('@modules/chats/api').ChatMessage) => {
        if (!msg.id) {
            setEditingMessageId(null);
            setMessage("");
            return;
        }
        setEditingMessageId(msg.id);
        setMessage(msg.message);
    };`
);

fs.writeFileSync('src/screens/cabinet/Chats/Chats.tsx', code);
