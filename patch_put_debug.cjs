const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    /app\.put\("\/api\/chat-messages\/order\/:orderId\/messages\/:messageId", \(req: Request, res: Response\) => \{/,
    `app.put("/api/chat-messages/order/:orderId/messages/:messageId", (req: Request, res: Response) => {
        console.log("PUT chat message hit! orderId=", req.params.orderId, "messageId=", req.params.messageId);`
);

fs.writeFileSync('server.ts', code);
