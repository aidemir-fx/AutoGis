const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    /app\.put\("\/api\/chat-messages\/order\/:orderId\/messages\/:messageId", \(req: Request, res: Response\) => \{/,
    `app.put("/api/chat-messages/order/:orderId/messages/:messageId", (req: Request, res: Response) => {
        try {`
);

code = code.replace(
    /        res\.json\(msg\);\n    \}\);/,
    `        res.json(msg);
        } catch (err: any) {
            console.error(err);
            res.status(500).send(err.message);
        }
    });`
);

fs.writeFileSync('server.ts', code);
