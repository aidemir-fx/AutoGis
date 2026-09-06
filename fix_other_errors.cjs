const fs = require('fs');

let file1 = 'src/screens/main-page/components/MobileProviderPeekCard.tsx';
let code1 = fs.readFileSync(file1, 'utf8');
if (!code1.includes('onDetailsClick: (provider: Provider) => void;')) {
    code1 = code1.replace(/onClose: \(\) => void;/g, 'onClose: () => void;\n    onDetailsClick?: (provider: Provider) => void;');
    fs.writeFileSync(file1, code1);
}

let file2 = 'src/modules/providers/features/ProvidersMap/ProvidersMap.tsx';
let code2 = fs.readFileSync(file2, 'utf8');
code2 = code2.replace(/window\.handleProviderClick\(/g, '(window as any).handleProviderClick(');
fs.writeFileSync(file2, code2);
