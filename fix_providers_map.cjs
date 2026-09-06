const fs = require('fs');
let file = 'src/modules/providers/features/ProvidersMap/ProvidersMap.tsx';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/if\(window\.handleProviderClick\)/g, 'if((window as any).handleProviderClick)');
fs.writeFileSync(file, code);
