const fs = require('fs');
let code = fs.readFileSync('src/modules/chats/components/ChatRoom.tsx', 'utf8');

if (!code.includes('import { theme } from "@common/theme"')) {
    code = code.replace(/import \{ ChatInput \}/g, 'import { theme } from "@common/theme";\nimport { ChatInput }');
}

code = code.replace(/backgroundColor: "#f2f5fb"/g, 'backgroundColor: theme.palette.background[1]');
code = code.replace(/backgroundColor: "#ffffff"/g, 'backgroundColor: theme.palette.white');
code = code.replace(/color: "#262626"/g, 'color: theme.palette.text.primary');
code = code.replace(/color: "#1e40af"/g, 'color: theme.palette.actions.brand');
code = code.replace(/border: "1px solid #e4e8f0"/g, 'border: `1px solid ${theme.palette.base.generic}`');
code = code.replace(/borderTop: "1px solid rgba\\(228,232,240,0.6\\)"/g, 'borderTop: `1px solid ${theme.palette.base.generic}`');
code = code.replace(/color: "#5a6172"/g, 'color: theme.palette.text.secondary');
code = code.replace(/backgroundColor: "#8892a6"/g, 'backgroundColor: theme.palette.text.hint');
code = code.replace(/border: "1px solid rgba\\(228,232,240,0.8\\)"/g, 'border: `1px solid ${theme.palette.base.generic}`');
code = code.replace(/borderBottom: "1px solid #e4e8f0"/g, 'borderBottom: `1px solid ${theme.palette.base.generic}`');

fs.writeFileSync('src/modules/chats/components/ChatRoom.tsx', code);
