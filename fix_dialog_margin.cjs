const fs = require('fs');
let code = fs.readFileSync('src/screens/main-page/MainpPageScreen.tsx', 'utf8');

code = code.replace(
`                        margin: '16px',
                        width: '100%',`,
`                        margin: '16px',
                        width: 'calc(100% - 32px)',`
);

fs.writeFileSync('src/screens/main-page/MainpPageScreen.tsx', code);
