const fs = require('fs');
let code = fs.readFileSync('src/screens/cabinet/Chats/Chats.tsx', 'utf8');

code = code.replace(
    /        onSuccess: \(updatedMessage, variables\) => \{/,
    `        onError: (err) => {
            console.error("Edit message error:", err);
            alert("Ошибка при редактировании сообщения. Попробуйте еще раз.");
        },
        onSuccess: (updatedMessage, variables) => {`
);

code = code.replace(
    /isSending=\{sendMessageMutation\.isPending\}/,
    'isSending={sendMessageMutation.isPending || editMessageMutation.isPending}'
);

fs.writeFileSync('src/screens/cabinet/Chats/Chats.tsx', code);
