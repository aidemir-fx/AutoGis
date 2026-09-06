const fs = require('fs');
let code = fs.readFileSync('src/screens/cabinet/Bookings/Bookings.tsx', 'utf8');

// 1. Tab buttons height
code = code.replace(
    /minHeight: 38,(.*?borderRadius: "999px",)/s,
    'minHeight: 42,$1'
);

// 2. NextBookingPanel button height
code = code.replace(
    /minHeight: 38,(.*?borderRadius: theme\.shape\.medium,.*?backgroundColor: theme\.palette\.white,)/s,
    'minHeight: 44,$1'
);

// 3. BookingCard buttons height (Чат and Позвонить)
code = code.replace(
    /minHeight: 42,(.*?borderRadius: theme\.shape\.medium,.*?backgroundColor: theme\.palette\.actions\.brand,)/s,
    'minHeight: 44,$1'
);
code = code.replace(
    /minHeight: 42,(.*?borderRadius: theme\.shape\.medium,.*?borderColor: theme\.palette\.actions\.inactive,)/s,
    'minHeight: 44,$1'
);

fs.writeFileSync('src/screens/cabinet/Bookings/Bookings.tsx', code);
