const fs = require('fs');
let code = fs.readFileSync('src/modules/chats/hooks/useRealtimeChat.ts', 'utf8');

// Disable websocket connection logic to prevent Rate exceeded proxy errors
code = code.replace(/const ws = new WebSocket\(wsUrl, \["bearer", accessToken\]\);/, 'return; // Disabled WS to prevent proxy Rate exceeded');

fs.writeFileSync('src/modules/chats/hooks/useRealtimeChat.ts', code);
