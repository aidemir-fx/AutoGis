const fs = require('fs');
let code = fs.readFileSync('src/screens/main-page/components/MobileProviderPeekCard.tsx', 'utf8');

// Ensure that we don't accidentally navigate
code = code.replace(
    /if \(onDetailsClick\) onDetailsClick\(provider\); else window\.location\.href = detailsUrl;/g,
    `if (onDetailsClick) { onDetailsClick(provider); } else { window.location.href = detailsUrl; }`
);

// We need to double check how onDetailsClick is handled on mobile peek card in MainPageScreen
fs.writeFileSync('src/screens/main-page/components/MobileProviderPeekCard.tsx', code);
