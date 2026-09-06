const fs = require('fs');
let code = fs.readFileSync('src/screens/cabinet/Bookings/Bookings.tsx', 'utf8');

const oldEffect = `    useEffect(() => {
        setTab(initialTab);
    }, [initialTab]);`;

const newEffect = `    useEffect(() => {
        if (selectedOrderId && orders) {
            const order = orders.find((o) => o.id === selectedOrderId);
            if (order) {
                if (order.status === "scheduled") setTab("confirmed");
                else setTab(order.status as BookingTab);
                return;
            }
        }
        setTab(initialTab);
    }, [initialTab, selectedOrderId, orders]);`;

code = code.replace(oldEffect, newEffect);

fs.writeFileSync('src/screens/cabinet/Bookings/Bookings.tsx', code);
