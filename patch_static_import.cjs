const fs = require('fs');
let code = fs.readFileSync('src/screens/cabinet/Chats/Chats.tsx', 'utf8');

code = code.replace(
    /sendOrderMessage,\n    getUnreadCounts,/,
    'sendOrderMessage,\n    editOrderMessage,\n    getUnreadCounts,'
);

code = code.replace(
    /mutationFn: \(variables: \{ orderId: string; messageId: string; text: string \}\) =>\n            import\('@modules\/chats\/api'\)\.then\(\(m\) => m\.editOrderMessage\(variables\.orderId, variables\.messageId, variables\.text\)\),/,
    'mutationFn: (variables: { orderId: string; messageId: string; text: string }) =>\n            editOrderMessage(variables.orderId, variables.messageId, variables.text),'
);

fs.writeFileSync('src/screens/cabinet/Chats/Chats.tsx', code);
