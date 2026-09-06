const fs = require('fs');
let code = fs.readFileSync('src/modules/chats/components/ChatInput.tsx', 'utf8');

if (!code.includes('import { theme } from "@common/theme"')) {
    code = code.replace(/import \{ Box, IconButton/g, 'import { theme } from "@common/theme";\nimport { Box, IconButton');
}

code = code.replace(/backgroundColor: "#ffffff"/g, 'backgroundColor: theme.palette.white');
code = code.replace(/color: "#262626"/g, 'color: theme.palette.text.primary');
code = code.replace(/color: "#7b8291"/g, 'color: theme.palette.text.hint');
code = code.replace(/color: "#ffffff"/g, 'color: theme.palette.text.white');
code = code.replace(
    /background: "linear-gradient\\(135deg, #4a7cff 0%, #3b82f6 100%\\)"/g,
    'backgroundColor: theme.palette.actions.brand'
);
code = code.replace(
    /boxShadow: "0 6px 14px -4px rgba\\(59,130,246,0.45\\)"/g,
    'boxShadow: "none"'
);
code = code.replace(
    /background:\n\s*"linear-gradient\\(135deg, #3b82f6 0%, #2563eb 100%\\)"/g,
    'backgroundColor: theme.palette.actions.brandHeavy'
);
code = code.replace(
    /background:\n\s*"linear-gradient\\(135deg, #c8d7ff 0%, #b4caff 100%\\)"/g,
    'backgroundColor: theme.palette.actions.inactive'
);

fs.writeFileSync('src/modules/chats/components/ChatInput.tsx', code);
