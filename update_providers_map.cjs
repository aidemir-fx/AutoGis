const fs = require('fs');
let code = fs.readFileSync('src/modules/providers/features/ProvidersMap/ProvidersMap.tsx', 'utf8');

code = code.replace(
    /properties=\{\{\s*iconCaption: m\.address,\s*balloonContent: buildBalloonHtml\(m\),\s*\}\}/g,
    `properties={{
        iconCaption: m.address,
        ...( (typeof window !== 'undefined' && window.innerWidth < 768) ? {} : { balloonContent: buildBalloonHtml(m) } )
    }}`
);

fs.writeFileSync('src/modules/providers/features/ProvidersMap/ProvidersMap.tsx', code);
