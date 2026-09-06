const fs = require('fs');

let code = fs.readFileSync('src/modules/chats/components/ChatList.tsx', 'utf8');

const regex = /(\s*)\{PILL_TABS\.map\(\(pill\) => \{[\s\S]*?\}\)\}(\s*)(<Box[\s\S]*?\{FOLDER_TABS\.map\(\(f\) => \([\s\S]*?\)\)\}\s*<\/Box>)(\s*)<\/Box>(\s*)\)\}/m;

code = code.replace(regex, (match, p1, p2, folderTabsBox, p4, p5) => {
    return `${p1}{PILL_TABS.map((pill) => {${p2}})}${p4}</Box>${p5})}${p1}${folderTabsBox}`;
});

fs.writeFileSync('src/modules/chats/components/ChatList.tsx', code);
