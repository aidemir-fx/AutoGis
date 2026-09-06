const fs = require('fs');
let itemCode = fs.readFileSync('src/modules/chats/components/ChatListItem.tsx', 'utf8');

itemCode = itemCode.replace(
    /background:\n\s*"linear-gradient\\(135deg, #4a7cff 0%, #3b82f6 100%\\)"/,
    'backgroundColor: theme.palette.actions.brand'
);
itemCode = itemCode.replace(
    /boxShadow: "0 4px 10px -2px rgba\\(59,130,246,0.4\\)"/,
    'boxShadow: "none"'
);
fs.writeFileSync('src/modules/chats/components/ChatListItem.tsx', itemCode);
