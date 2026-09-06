const fs = require('fs');
let code = fs.readFileSync('src/modules/chats/components/ChatHeader.tsx', 'utf8');

if (!code.includes('import { theme } from "@common/theme"')) {
    code = code.replace(/import \{ getAvatarGradient/g, 'import { theme } from "@common/theme";\nimport { getAvatarGradient');
}

code = code.replace(/backgroundColor: "rgba\\(255,255,255,0.75\\)"/g, 'backgroundColor: "rgba(255,255,255,0.85)"');
code = code.replace(/borderBottom: "1px solid rgba\\(228,232,240,0.6\\)"/g, 'borderBottom: `1px solid ${theme.palette.base.generic}`');
code = code.replace(/backgroundColor: "#ffffff"/g, 'backgroundColor: theme.palette.white');
code = code.replace(/color: "#262626"/g, 'color: theme.palette.text.primary');
code = code.replace(/backgroundColor: "#f7f7f8"/g, 'backgroundColor: theme.palette.actions.hover');
code = code.replace(/color: "#ffffff"/g, 'color: theme.palette.text.white');
code = code.replace(/color: "#22c55e"/g, 'color: theme.palette.success.main');
code = code.replace(/backgroundColor: "#22c55e"/g, 'backgroundColor: theme.palette.success.main');
code = code.replace(/border: "2px solid #ffffff"/g, 'border: `2px solid ${theme.palette.white}`');
code = code.replace(/color: "#7b8291"/g, 'color: theme.palette.text.hint');
code = code.replace(/color: "#3b82f6"/g, 'color: theme.palette.actions.brand');

fs.writeFileSync('src/modules/chats/components/ChatHeader.tsx', code);
