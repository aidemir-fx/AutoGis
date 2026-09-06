const fs = require('fs');
let code = fs.readFileSync('src/modules/chats/components/ChatList.tsx', 'utf8');

if (!code.includes('import { theme } from "@common/theme"')) {
    code = code.replace(/import \{ ChatListItem \}/g, 'import { theme } from "@common/theme";\nimport { ChatListItem }');
}

code = code.replace(/backgroundColor: "#f2f5fb"/g, 'backgroundColor: theme.palette.background[1]');
code = code.replace(/backgroundColor: "#ffffff"/g, 'backgroundColor: theme.palette.white');
code = code.replace(/color: "#262626"/g, 'color: theme.palette.text.primary');
code = code.replace(/backgroundColor: "#f7f7f8"/g, 'backgroundColor: theme.palette.actions.hover');

code = code.replace(
    /background: "linear-gradient\\(135deg, #4a7cff 0%, #3b82f6 100%\\)"/,
    'backgroundColor: theme.palette.actions.brand'
);
code = code.replace(
    /boxShadow: "0 6px 14px -4px rgba\\(59,130,246,0.45\\)"/,
    'boxShadow: "none"'
);
code = code.replace(/color: "#5a6172"/g, 'color: theme.palette.text.secondary');
code = code.replace(/border: "1px solid #e4e8f0"/g, 'border: `1px solid ${theme.palette.base.generic}`');

fs.writeFileSync('src/modules/chats/components/ChatList.tsx', code);
