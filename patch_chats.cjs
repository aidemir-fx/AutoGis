const fs = require('fs');
let code = fs.readFileSync('src/screens/cabinet/Chats/Chats.tsx', 'utf8');

// 1. Add editingMessageId state
code = code.replace(
    /const \[message, setMessage\] = useState\(""\);/,
    'const [message, setMessage] = useState("");\n    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);'
);

// 2. Add editMessageMutation
const editMutationCode = `
    const editMessageMutation = useMutation({
        mutationFn: (variables: { orderId: string; messageId: string; text: string }) =>
            import('@modules/chats/api').then((m) => m.editOrderMessage(variables.orderId, variables.messageId, variables.text)),
        onSuccess: (updatedMessage, variables) => {
            setEditingMessageId(null);
            setMessage("");
            queryClient.setQueryData<OrderChatResponse | undefined>(
                ["orderChat", variables.orderId],
                (current) => {
                    if (!current) return current;
                    return {
                        ...current,
                        messages: current.messages.map((m) =>
                            m.id === updatedMessage.id ? updatedMessage : m
                        ),
                    };
                }
            );
        },
    });
`;

code = code.replace(
    /const sendMessageMutation = useMutation\(\{/,
    editMutationCode + '\n    const sendMessageMutation = useMutation({'
);

// 3. Update handleSend
const handleSendCode = `    const handleSend = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmed = message.trim();
        if (!trimmed || !selectedOrderId) return;

        stopTyping();
        
        if (editingMessageId) {
            editMessageMutation.mutate({ orderId: selectedOrderId, messageId: editingMessageId, text: trimmed });
        } else {
            sendMessageMutation.mutate({ orderId: selectedOrderId, text: trimmed });
        }
    };

    const handleEditMessage = (msg: import('@modules/chats/api').ChatMessage) => {
        setEditingMessageId(msg.id);
        setMessage(msg.message);
    };`;

code = code.replace(
    /const handleSend = \(event: FormEvent<HTMLFormElement>\) => \{[\s\S]*?    \};/m,
    handleSendCode
);

// 4. Update ChatRoom props
code = code.replace(
    /onMessageBlur=\{stopTyping\}/,
    'onMessageBlur={stopTyping}\n                        onEditMessage={handleEditMessage}\n                        editingMessageId={editingMessageId}'
);

fs.writeFileSync('src/screens/cabinet/Chats/Chats.tsx', code);
