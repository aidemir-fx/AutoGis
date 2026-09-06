const fs = require('fs');
let code = fs.readFileSync('src/modules/chats/components/ChatListItem.tsx', 'utf8');

code = code.replace(/const handleMenuClose = \(event\?: React.MouseEvent\) => \{/, 'const handleMenuClose = (event?: any) => {');

fs.writeFileSync('src/modules/chats/components/ChatListItem.tsx', code);
