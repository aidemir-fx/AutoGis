const fs = require('fs');
let code = fs.readFileSync('src/common/components/CustomModal/index.tsx', 'utf8');

code = code.replace(
    /\{children\}/,
    `<div style={{ paddingTop: "40px" }}>{children}</div>`
);

fs.writeFileSync('src/common/components/CustomModal/index.tsx', code);
