const fs = require('fs');
let itemCode = fs.readFileSync('src/modules/chats/components/ChatListItem.tsx', 'utf8');

// There might be a duplicate badge if the regex didn't match perfectly. Let's check.
const matches = itemCode.match(/<Badge/g);
if (matches && matches.length > 1) {
    // Oops, we duplicated or messed up.
    console.log("Found multiple badges!");
}
