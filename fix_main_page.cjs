const fs = require('fs');

let file = 'src/screens/main-page/MainpPageScreen.tsx';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/onDetailsClick=\{\(provider\) => \{/g, 'onDetailsClick={(provider: any) => {');
fs.writeFileSync(file, code);
