const fs = require('fs');
let code = fs.readFileSync('src/modules/chats/hooks/useRealtimeChat.ts', 'utf8');

// Let's remove the broken line and insert a proper return
code = code.replace(/const connect = useCallback\(\(\) => \{\\n        return; \/\/ Disabled WS to prevent proxy Rate exceeded/, 'const connect = useCallback(() => {');
code = code.replace(/const connect = useCallback\(\(\) => \{\n        return; \/\/ Disabled WS to prevent proxy Rate exceeded/, 'const connect = useCallback(() => {');
code = code.replace(/const connect = useCallback\(\(\) => \{/, 'const connect = useCallback(() => {\nreturn;');

fs.writeFileSync('src/modules/chats/hooks/useRealtimeChat.ts', code);
