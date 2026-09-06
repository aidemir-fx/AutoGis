const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/id: "master-1",\s*name: "Алексей Смирнов",\s*phone: "\+7 \(999\) 111-22-33",/g, 'id: "master-1",\n            name: "Алексей Смирнов",\n            phone: "+7 (999) 111-22-33",\n            address: "ул. Ленина, д. 10, гараж 45",');

code = code.replace(/id: "master-2",\s*name: "СТО Авторитет",\s*phone: "\+7 \(800\) 555-35-35",/g, 'id: "master-2",\n            name: "СТО Авторитет",\n            phone: "+7 (800) 555-35-35",\n            address: "пр. Мира, 125, стр. 2",');

fs.writeFileSync('server.ts', code);
