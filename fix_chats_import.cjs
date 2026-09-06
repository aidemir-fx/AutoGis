const fs = require('fs');
let code = fs.readFileSync('src/screens/cabinet/Chats/Chats.tsx', 'utf8');

if (!code.includes('import { theme } from "@common/theme"')) {
    code = code.replace(/import \{ useUserProfile \} from "@common\/hooks";/, 'import { useUserProfile } from "@common/hooks";\nimport { theme } from "@common/theme";');
}

fs.writeFileSync('src/screens/cabinet/Chats/Chats.tsx', code);
