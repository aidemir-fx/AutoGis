const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/id: "service-1",\s*name: "Автотехцентр «Мотор Сити»",\s*phone: "\+7 \(495\) 789-01-23",/g, 'id: "service-1",\n            name: "Автотехцентр «Мотор Сити»",\n            phone: "+7 (495) 789-01-23",\n            address: "ш. Энтузиастов, 56",');

code = code.replace(/id: "wash-1",\s*name: "АкваБлеск",\s*phone: "\+7 \(926\) 000-11-22",/g, 'id: "wash-1",\n            name: "АкваБлеск",\n            phone: "+7 (926) 000-11-22",\n            address: "ул. Строителей, 12А",');

fs.writeFileSync('server.ts', code);
