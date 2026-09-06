const fs = require('fs');
let code = fs.readFileSync('src/modules/chats/api/index.ts', 'utf8');

code = code.replace(
    /const response = await http\.put\(\`\/chat-messages\/order\/\$\{orderId\}\/messages\/\$\{messageId\}\`, \{ message \}\);/,
    'const response = await http.patch(`/chat-messages/order/${orderId}/messages/${messageId}`, { message });'
);

fs.writeFileSync('src/modules/chats/api/index.ts', code);
