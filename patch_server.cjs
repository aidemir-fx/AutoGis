const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const editEndpoint = `
    app.put("/api/chat-messages/order/:orderId/messages/:messageId", (req: Request, res: Response) => {
        const { orderId, messageId } = req.params;
        const { message } = req.body;
        
        if (!sampleMessages[orderId]) {
            return res.status(404).json({ error: "Order not found" });
        }
        
        const msg = sampleMessages[orderId].find((m: any) => m.id === messageId);
        if (!msg) {
            return res.status(404).json({ error: "Message not found" });
        }
        
        msg.message = message;
        msg.isEdited = true;
        
        res.json(msg);
    });
`;

code = code.replace(
    /app\.get\("\/api\/chat-messages\/unread-count",/,
    editEndpoint + '\n    app.get("/api/chat-messages/unread-count",'
);

fs.writeFileSync('server.ts', code);
