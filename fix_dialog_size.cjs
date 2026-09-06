const fs = require('fs');
let code = fs.readFileSync('src/screens/main-page/MainpPageScreen.tsx', 'utf8');

code = code.replace(
`maxWidth="md"`,
`maxWidth="sm"`
);

code = code.replace(
`                        maxHeight: '90vh',`,
`                        maxHeight: '90vh',
                        margin: '16px',
                        width: '100%',`
);

fs.writeFileSync('src/screens/main-page/MainpPageScreen.tsx', code);
