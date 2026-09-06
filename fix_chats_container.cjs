const fs = require('fs');
let code = fs.readFileSync('src/screens/cabinet/Chats/Chats.tsx', 'utf8');

code = code.replace(/backgroundColor: "#eff1f5"/g, 'backgroundColor: theme.palette.background[1]');
code = code.replace(/border: "1px solid #e5e7eb"/g, 'border: `1px solid ${theme.palette.base.generic}`');

if (!code.includes('import { theme } from "@common/theme"')) {
    code = code.replace(/import \{ DashboardLayout \} from "@modules\/layout";/, 'import { DashboardLayout } from "@modules/layout";\nimport { theme } from "@common/theme";');
}

fs.writeFileSync('src/screens/cabinet/Chats/Chats.tsx', code);
