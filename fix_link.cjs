const fs = require('fs');
let code = fs.readFileSync('src/modules/providers/features/ProvidersMap/ProvidersMap.tsx', 'utf8');

code = code.replace(
    /return \`javascript:void\\(window\.handleProviderClick\\('\$\{provider\.id\}', '\$\{getProviderType\\(provider\\)\}'\\)\\)\`;/g,
    `return "#";`
);

code = code.replace(
    /<BalloonAction href=\{getDetailsHref\(provider\)\} \$variant="booking">/g,
    `<BalloonAction href="#" onClick={(e) => { e.preventDefault(); if(window.handleProviderClick) window.handleProviderClick(provider.id, getProviderType(provider)); }} $variant="booking">`
);

code = code.replace(
    /<BalloonAction href=\{getDetailsHref\(provider\)\} \$variant="outline">/g,
    `<BalloonAction href="#" onClick={(e) => { e.preventDefault(); if(window.handleProviderClick) window.handleProviderClick(provider.id, getProviderType(provider)); }} $variant="outline">`
);

fs.writeFileSync('src/modules/providers/features/ProvidersMap/ProvidersMap.tsx', code);
