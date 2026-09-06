const fs = require('fs');
let code = fs.readFileSync('src/modules/chats/hooks/useRealtimeChat.ts', 'utf8');

// Revert the naive patch
code = code.replace(/return; \/\/ Disabled WS to prevent proxy Rate exceeded/, 'const ws = new WebSocket(wsUrl, ["bearer", accessToken]);');

// Add a proper early return at the very top of `connect` to disable websocket
code = code.replace(/const connect = useCallback\(\(\) => \{/, 'const connect = useCallback(() => {\\n        return; // Disabled WS to prevent proxy Rate exceeded');

fs.writeFileSync('src/modules/chats/hooks/useRealtimeChat.ts', code);
