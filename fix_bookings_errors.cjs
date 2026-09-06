const fs = require('fs');
let code = fs.readFileSync('src/screens/cabinet/Bookings/Bookings.tsx', 'utf8');

// Fix theme.palette.error.main to heavy
code = code.replace(/background: \`linear-gradient\\(90deg, \\\${theme.palette.error.main}, \\\${theme.palette.error.light}\\)\`,/g, 'background: `linear-gradient(90deg, ${theme.palette.error.heavy}, ${theme.palette.error.light})`,');

// Fix order.photoAssetIds
code = code.replace(/label=\{\`Фото: \$\{order\.photoAssetIds\.length\}\`\}/g, 'label={`Фото: ${order.photoAssetIds?.length}`}');

// Remove original useQuery
const useQueryCode = `    const { data: orders, isLoading } = useQuery({
        queryKey: ["customerBookings", profile?.id],
        queryFn: getCustomerOrders,
        enabled: !!profile?.id,
    });`;

code = code.replace(useQueryCode, '');

// Re-insert useQuery before useEffect
const useQueryPlacement = `    const [tab, setTab] = useState<BookingTab>("pending");`;

code = code.replace(useQueryPlacement, useQueryPlacement + '\n\n' + useQueryCode);

fs.writeFileSync('src/screens/cabinet/Bookings/Bookings.tsx', code);
