const fs = require('fs');
let code = fs.readFileSync('src/modules/chats/components/MessageBubble.tsx', 'utf8');

if (!code.includes('import { theme } from "@common/theme"')) {
    code = code.replace(/import \{ Box, Typography/g, 'import { theme } from "@common/theme";\nimport { Box, Typography');
}

code = code.replace(/color: "#ffffff"/g, 'color: theme.palette.text.white');
code = code.replace(/color: "#222738"/g, 'color: theme.palette.text.primary');
code = code.replace(/color: "#7b8291"/g, 'color: theme.palette.text.secondary');
code = code.replace(
    /background: isMine\n\s*\? "linear-gradient\\(135deg, #4a7cff 0%, #3b82f6 100%\\)"\n\s*: "#ffffff"/g,
    'backgroundColor: isMine ? theme.palette.actions.brand : theme.palette.white'
);
code = code.replace(
    /boxShadow: isMine\n\s*\? "0 6px 16px -6px rgba\\(59,130,246,0.4\\)"\n\s*: "0 1px 2px rgba\\(30,40,70,0.05\\)"/g,
    'boxShadow: "0 1px 2px rgba(0,0,0,0.05)"'
);

fs.writeFileSync('src/modules/chats/components/MessageBubble.tsx', code);
