const fs = require('fs');
let code = fs.readFileSync('src/modules/chats/components/ChatListItem.tsx', 'utf8');

if (!code.includes('import { theme } from "@common/theme"')) {
    code = code.replace(/import \{ getAvatarGradient/g, 'import { theme } from "@common/theme";\nimport { getAvatarGradient');
}

code = code.replace(/backgroundColor: "#ffffff"/g, 'backgroundColor: theme.palette.white');
code = code.replace(/borderColor: "#e4e8f0"/g, 'borderColor: theme.palette.actions.hover');
code = code.replace(/color: "#ffffff"/g, 'color: theme.palette.text.white');
code = code.replace(/color: "#212737"/g, 'color: theme.palette.text.primary');
code = code.replace(/color: "#7b8291"/g, 'color: theme.palette.text.hint');
code = code.replace(/color: "#5a6172"/g, 'color: theme.palette.text.secondary');
code = code.replace(/color: "#262626"/g, 'color: theme.palette.text.primary');
code = code.replace(/color: "#475569"/g, 'color: theme.palette.text.secondary');
code = code.replace(/backgroundColor: "#f1f5f9"/g, 'backgroundColor: theme.palette.background[2]');

code = code.replace(
    /background: "linear-gradient\\(135deg, #4a7cff 0%, #3b82f6 100%\\)"/,
    'backgroundColor: theme.palette.actions.brand'
);
code = code.replace(
    /boxShadow: "0 4px 10px -2px rgba\\(59,130,246,0.4\\)"/,
    'boxShadow: "none"'
);

fs.writeFileSync('src/modules/chats/components/ChatListItem.tsx', code);
