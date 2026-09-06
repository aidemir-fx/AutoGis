const fs = require('fs');
let code = fs.readFileSync('src/screens/cabinet/Bookings/Bookings.tsx', 'utf8');

code = code.replace(
    /function DetailRow\(props: \{ icon: ReactNode; label: string; value: string \}\) \{/,
    'function DetailRow(props: { icon: ReactNode; label: string; value: string; multiline?: boolean }) {'
);

code = code.replace(
    /overflow: "hidden",\s*textOverflow: "ellipsis",\s*whiteSpace: "nowrap",/,
    `...(props.multiline ? { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } : { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }),`
);

code = code.replace(
    /<DetailRow\n\s*icon=\{<MapPinIcon \/>\}\n\s*label="Адрес"\n\s*value=\{\(order\.provider as any\)\.address\}\n\s*\/>/,
    '<DetailRow icon={<MapPinIcon />} label="Адрес" value={(order.provider as any).address} multiline />'
);

fs.writeFileSync('src/screens/cabinet/Bookings/Bookings.tsx', code);
