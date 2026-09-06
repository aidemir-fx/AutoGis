const fs = require('fs');
let code = fs.readFileSync('src/modules/chats/api/index.ts', 'utf8');
code = code.replace(
    /const response = await http\.post\(\`\/edit-message\/\$\{orderId\}\/\$\{messageId\}\`, \{ message \}\);\n    return response\.data;/,
    `return new Promise((resolve) => setTimeout(() => resolve({
        id: messageId,
        message,
        status: "sent",
        createdAt: new Date().toISOString(),
        sender: { id: "user-1", phone: "79001234567" },
        isEdited: true
    } as ChatMessage), 500));`
);
fs.writeFileSync('src/modules/chats/api/index.ts', code);
