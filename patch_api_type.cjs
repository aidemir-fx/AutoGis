const fs = require('fs');
let code = fs.readFileSync('src/modules/chats/api/index.ts', 'utf8');
code = code.replace(
    /status: "sent" \| "delivered" \| "read";/,
    'status: "sent" | "delivered" | "read";\n    isEdited?: boolean;'
);
// Also add the edit function
code += `
export async function editOrderMessage(orderId: string, messageId: string, message: string): Promise<ChatMessage> {
    const response = await http.put(\`/chat-messages/order/\${orderId}/messages/\${messageId}\`, { message });
    return response.data;
}
`;
fs.writeFileSync('src/modules/chats/api/index.ts', code);
