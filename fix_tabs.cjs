const fs = require('fs');
let code = fs.readFileSync('src/screens/cabinet/Bookings/Bookings.tsx', 'utf8');

code = code.replace(
    /sx=\{\{\s*mx: \{ xs: -2, sm: 0 \},\s*px: \{ xs: 2, sm: 0 \},\s*overflowX: "auto",\s*WebkitOverflowScrolling: "touch",\s*scrollbarWidth: "none",\s*"&::-webkit-scrollbar": \{\s*display: "none",\s*\},\s*\}\}/,
    'sx={{ mt: 1 }}'
);

code = code.replace(
    /<Stack direction="row" spacing=\{1\} sx=\{\{ minWidth: "max-content" \}\}>/,
    '<Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">'
);

fs.writeFileSync('src/screens/cabinet/Bookings/Bookings.tsx', code);
