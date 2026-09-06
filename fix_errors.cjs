const fs = require('fs');

let codeHeader = fs.readFileSync('src/modules/chats/components/ChatHeader.tsx', 'utf8');
codeHeader = codeHeader.replace(/theme.palette.actions.hover/g, 'theme.palette.background[2]');
codeHeader = codeHeader.replace(/theme.palette.success.main/g, 'theme.palette.green.primary');
fs.writeFileSync('src/modules/chats/components/ChatHeader.tsx', codeHeader);

let codeList = fs.readFileSync('src/modules/chats/components/ChatList.tsx', 'utf8');
codeList = codeList.replace(/theme.palette.actions.hover/g, 'theme.palette.background[2]');
fs.writeFileSync('src/modules/chats/components/ChatList.tsx', codeList);

let codeListItem = fs.readFileSync('src/modules/chats/components/ChatListItem.tsx', 'utf8');
codeListItem = codeListItem.replace(/theme.palette.actions.hover/g, 'theme.palette.background[2]');
fs.writeFileSync('src/modules/chats/components/ChatListItem.tsx', codeListItem);

let codeChats = fs.readFileSync('src/screens/cabinet/Chats/Chats.tsx', 'utf8');
if (!codeChats.includes('import { theme } from "@common/theme"')) {
    codeChats = codeChats.replace(/import \{ DashboardLayout \} from "@modules\/layout";/, 'import { DashboardLayout } from "@modules/layout";\nimport { theme } from "@common/theme";');
}
fs.writeFileSync('src/screens/cabinet/Chats/Chats.tsx', codeChats);

