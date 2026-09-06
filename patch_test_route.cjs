const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    /app\.put\("\/api\/chat-messages\/order\/:orderId\/messages\/:messageId", \(req: Request, res: Response\) => \{/,
    `app.put("/api/test-put", (req: Request, res: Response) => { res.json({ success: true, body: req.body }); });
    app.put("/api/chat-messages/order/:orderId/messages/:messageId", (req: Request, res: Response) => {`
);

fs.writeFileSync('server.ts', code);
