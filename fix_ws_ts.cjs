const fs = require('fs');
let code = fs.readFileSync('src/modules/chats/hooks/useRealtimeChat.ts', 'utf8');

code = code.replace(/const ws = new WebSocket\(wsUrl, \["bearer", accessToken\]\);/, 'const ws = new WebSocket(wsUrl, ["bearer", accessToken as string]);');

fs.writeFileSync('src/modules/chats/hooks/useRealtimeChat.ts', code);
