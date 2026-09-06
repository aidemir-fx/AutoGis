const fs = require('fs');
let code = fs.readFileSync('src/screens/main-page/components/MobileProviderPeekCard.tsx', 'utf8');

code = code.replace(
    /position: absolute;\s*bottom: calc\(56px \+ env\(safe-area-inset-bottom, 0px\) \+ 64px\);\s*left: 12px;\s*right: 12px;\s*max-width: 480px;\s*margin: 0 auto;\s*z-index: 1100;/g,
    `position: fixed;
    bottom: max(24px, env(safe-area-inset-bottom, 24px));
    left: 12px;
    right: 12px;
    max-width: 480px;
    margin: 0 auto;
    z-index: 9999;`
);

fs.writeFileSync('src/screens/main-page/components/MobileProviderPeekCard.tsx', code);
