const fs = require('fs');
let code = fs.readFileSync('src/screens/main-page/components/MobileProviderPeekCard.tsx', 'utf8');

code = code.replace(
    /z-index: 9999;/g,
    `z-index: 100000;` // Ensure it sits on top of everything, even the map
);

fs.writeFileSync('src/screens/main-page/components/MobileProviderPeekCard.tsx', code);
