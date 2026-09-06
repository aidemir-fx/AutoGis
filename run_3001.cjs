const fs = require('fs');
let code = fs.readFileSync('dist/server.cjs', 'utf8');
code = code.replace(/PORT = 3000/g, 'PORT = 3001');
fs.writeFileSync('dist/server_3001.cjs', code);
