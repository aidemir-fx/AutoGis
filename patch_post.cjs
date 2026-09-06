const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    /app\.patch\("\/api\/chat-messages\/order\/:orderId\/messages\/:messageId", \(req: Request, res: Response\) => \{/,
    `app.post("/api/chat-messages/order/:orderId/messages/:messageId", (req: Request, res: Response) => {`
);

fs.writeFileSync('server.ts', code);

code = fs.readFileSync('src/modules/chats/api/index.ts', 'utf8');
code = code.replace(
    /const response = await http\.patch\(\`\/chat-messages\/order\/\$\{orderId\}\/messages\/\$\{messageId\}\`, \{ message \}\);/,
    'const response = await http.post(`/chat-messages/order/${orderId}/messages/${messageId}`, { message });'
);
fs.writeFileSync('src/modules/chats/api/index.ts', code);
