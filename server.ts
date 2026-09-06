import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import http from "http";
import { createServer as createViteServer } from "vite";

interface ProviderData {
    id: string;
    userId: string;
    fullName: string;
    businessName?: string;
    providerType: "master" | "auto_service" | "auto_wash" | "auto_shop";
    activityTypeId: string;
    status: "available" | "busy" | "unavailable";
    address: string;
    coordinates: {
        type: "Point";
        coordinates: [number, number]; // [lng, lat]
    };
    phone: string;
    workingPhone: string;
    description: string;
    workFrom: string;
    workTo: string;
    workingDays: boolean[];
    professions: string[];
    autoMarks: string[];
    services: string[];
    onlineBookingEnabled: boolean;
    rating?: number;
    reviewsCount?: number;
    avatar?: string;
    brandSupport?: string[];
    hasParking?: boolean;
    liftCount?: number;
    warranty?: boolean;
    hotline?: string;
}

const SAMPLE_PROVIDERS: ProviderData[] = [
    {
        id: "master-1",
        userId: "user-1",
        fullName: "Алексей Смирнов",
        businessName: "Автомастер Алексей Смирнов",
        providerType: "master",
        activityTypeId: "2",
        status: "available",
        address: "Москва, Автозаводская ул., д. 16",
        coordinates: {
            type: "Point",
            coordinates: [37.6624, 55.7068],
        },
        phone: "+7 (999) 111-22-33",
        workingPhone: "+7 (999) 111-22-33",
        description: "Опыт работы более 12 лет. Специализируюсь на диагностике и ремонте автоэлектрики, ходовой части, двигателей.",
        workFrom: "09:00",
        workTo: "20:00",
        workingDays: [true, true, true, true, true, true, false],
        professions: ["Автоэлектрик", "Диагност", "Моторист"],
        autoMarks: ["Toyota", "Kia", "Hyundai", "Volkswagen", "LADA", "BMW"],
        services: ["Компьютерная диагностика", "Ремонт подвески", "Замена ГРМ", "Замена тормозных колодок"],
        onlineBookingEnabled: true,
        rating: 4.9,
        reviewsCount: 34,
    },
    {
        id: "service-1",
        userId: "user-2",
        fullName: "Автотехцентр «Мотор Сити»",
        businessName: "Автотехцентр «Мотор Сити»",
        providerType: "auto_service",
        activityTypeId: "1",
        status: "available",
        address: "Москва, Ленинградский проспект, 36с1",
        coordinates: {
            type: "Point",
            coordinates: [37.5532, 55.7925],
        },
        phone: "+7 (495) 789-01-23",
        workingPhone: "+7 (495) 789-01-23",
        description: "Полный комплекс услуг по обслуживанию и ремонту легковых авто и коммерческого транспорта. Сертифицированные мастера.",
        workFrom: "08:00",
        workTo: "21:00",
        workingDays: [true, true, true, true, true, true, true],
        professions: ["Автоэлектрик", "Кузовщик", "Маляр", "Моторист", "Ходовик"],
        autoMarks: ["Toyota", "BMW", "Mercedes-Benz", "Audi", "Kia", "Hyundai", "Renault"],
        services: ["Комплексное ТО", "Кузовной ремонт", "Покраска элементов", "Сход-развал 3D", "Ремонт ДВС"],
        onlineBookingEnabled: true,
        brandSupport: ["Toyota", "BMW", "Mercedes-Benz", "Audi"],
        hasParking: true,
        liftCount: 6,
        warranty: true,
        rating: 4.8,
        reviewsCount: 89,
    },
    {
        id: "wash-1",
        userId: "user-3",
        fullName: "Премиум Детейлинг & Мойка «АкваЛюкс»",
        businessName: "Премиум Детейлинг & Мойка «АкваЛюкс»",
        providerType: "auto_wash",
        activityTypeId: "3",
        status: "available",
        address: "Москва, Кутузовский проспект, 48",
        coordinates: {
            type: "Point",
            coordinates: [37.5028, 55.7335],
        },
        phone: "+7 (495) 555-44-33",
        workingPhone: "+7 (495) 555-44-33",
        description: "3-х фазная детейлинг-мойка кузова, химчистка салона паром, полировка и нанесение защитных керамических покрытий.",
        workFrom: "00:00",
        workTo: "24:00",
        workingDays: [true, true, true, true, true, true, true],
        professions: ["Детейлер", "Мойщик"],
        autoMarks: ["Все марки"],
        services: ["Бесконтактная мойка", "Химчистка салона", "Керамика и жидкое стекло", "Полировка фар", "Чернение резины"],
        onlineBookingEnabled: true,
        rating: 4.9,
        reviewsCount: 52,
    },
    {
        id: "shop-1",
        userId: "user-4",
        fullName: "Автозапчасти «АвтоДеталь»",
        businessName: "Автозапчасти «АвтоДеталь»",
        providerType: "auto_shop",
        activityTypeId: "4",
        status: "available",
        address: "Москва, Профсоюзная ул., 65",
        coordinates: {
            type: "Point",
            coordinates: [37.5385, 55.6568],
        },
        phone: "+7 (495) 321-65-43",
        workingPhone: "+7 (495) 321-65-43",
        description: "Оригинальные запчасти и качественные аналоги в наличии и под заказ за 1 день. Масла, фильтры, колодки, автохимия.",
        workFrom: "09:00",
        workTo: "21:00",
        workingDays: [true, true, true, true, true, true, true],
        professions: ["Консультант по подбору запчастей"],
        autoMarks: ["LADA", "Kia", "Hyundai", "Toyota", "Volkswagen", "Renault"],
        services: ["Подбор по VIN коду", "Продажа масел и жидкостей", "Заказ редких запчастей", "Доставка курьером"],
        onlineBookingEnabled: false,
        rating: 4.7,
        reviewsCount: 41,
    },
    {
        id: "master-2",
        userId: "user-5",
        fullName: "Дмитрий Ковалев (Шиномонтаж и балансировка)",
        businessName: "Выездной шиномонтаж",
        providerType: "master",
        activityTypeId: "2",
        status: "available",
        address: "Москва, Варшавское шоссе, 125",
        coordinates: {
            type: "Point",
            coordinates: [37.6183, 55.6321],
        },
        phone: "+7 (926) 777-88-99",
        workingPhone: "+7 (926) 777-88-99",
        description: "Быстрый выездной и стационарный шиномонтаж. Правка литых дисков, устранение проколов и боковых порезов, хранение резины.",
        workFrom: "08:00",
        workTo: "23:00",
        workingDays: [true, true, true, true, true, true, true],
        professions: ["Шиномонтаж"],
        autoMarks: ["Все марки"],
        services: ["Сезонная переобувка", "Ремонт прокола жгутом/грибком", "Правка дисков", "Балансировка колес"],
        onlineBookingEnabled: true,
        rating: 4.8,
        reviewsCount: 19,
    },
];

const ACTIVITY_TYPES = [
    { id: "1", name: "auto_service", displayName: "Автосервис" },
    { id: "2", name: "master", displayName: "Частный мастер" },
    { id: "3", name: "auto_wash", displayName: "Автомойка" },
    { id: "4", name: "auto_shop", displayName: "Магазин автозапчастей" },
];

interface Order {
    id: string;
    customer: {
        id: string;
        name: string;
        phone: string;
        avatarUrl?: string | null;
        address?: string;
    };
    provider: {
        id: string;
        name: string;
        phone: string;
        avatarUrl?: string | null;
        address?: string;
    };
    activityType: {
        id: string;
        name: string;
        displayName: string;
    };
    status: "pending" | "scheduled" | "completed" | "cancelled";
    name: string;
    phone: string;
    carBrand: string;
    description: string;
    timePreference?: "urgent" | "not_urgent";
    photoAssetIds?: string[];
    confirmedDateTime?: string;
    cancelReason?: string;
    chatId?: string;
    price?: number;
    createdAt: string;
    updatedAt: string;
}

const sampleOrders: Order[] = [
    {
        id: "order-101",
        customer: {
            id: "demo-user-1",
            name: "Иван Петров",
            phone: "+7 (903) 123-45-67",
        },
        provider: {
            id: "master-1",
            name: "Алексей Смирнов",
            phone: "+7 (999) 111-22-33",
            address: "ул. Ленина, д. 10, гараж 45",
        },
        activityType: {
            id: "2",
            name: "master",
            displayName: "Частный мастер",
        },
        status: "pending",
        name: "Иван Петров",
        phone: "+7 (903) 123-45-67",
        carBrand: "Toyota Camry 2018",
        description: "Стучит при повороте руля на малой скорости, требуется диагностика подвески.",
        timePreference: "urgent",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
        id: "order-102",
        customer: {
            id: "demo-user-1",
            name: "Иван Петров",
            phone: "+7 (903) 123-45-67",
        },
        provider: {
            id: "service-1",
            name: "Автотехцентр «Мотор Сити»",
            phone: "+7 (495) 789-01-23",
            address: "ш. Энтузиастов, 56",
        },
        activityType: {
            id: "1",
            name: "auto_service",
            displayName: "Автосервис",
        },
        status: "scheduled",
        name: "Иван Петров",
        phone: "+7 (903) 123-45-67",
        carBrand: "Kia Rio 2020",
        description: "Плановое ТО: замена моторного масла, масляного, салонного и воздушного фильтров.",
        timePreference: "not_urgent",
        confirmedDateTime: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 40000000).toISOString(),
    },
];

const sampleMessages: Record<string, any[]> = {
    "order-101": [
        {
            id: "msg-1",
            message: "Здравствуйте! Подскажите, когда можно подъехать на диагностику?",
            createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
            status: "read",
            sender: {
                id: "demo-user-1",
                name: "Иван Петров",
                phone: "+7 (903) 123-45-67",
            },
        },
        {
            id: "msg-2",
            message: "Добрый день! Могу принять сегодня после 16:00 или завтра с утра. Какая именно модель?",
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            status: "read",
            sender: {
                id: "master-1",
            name: "Алексей Смирнов",
            phone: "+7 (999) 111-22-33",
            address: "ул. Ленина, д. 10, гараж 45",
            },
        },
    ],
};

async function startServer() {
    const app = express();
    const PORT = 3000;

    app.use(cors({ origin: true, credentials: true }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Request logging
    app.use((req, res, next) => {
        if (req.path.startsWith("/api")) {
            console.log(`[API] ${req.method} ${req.path}`);
        }
        next();
    });

    // ───────────────── API ROUTES ─────────────────

    app.get("/api/health", (req: Request, res: Response) => {
        res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // Activity types
    app.get("/api/activity-types", (req: Request, res: Response) => {
        res.json(ACTIVITY_TYPES);
    });

    // Combined Search
    app.get("/api/search/combined", (req: Request, res: Response) => {
        const { lat, lng, radius, activityTypes } = req.query;
        let results = [...SAMPLE_PROVIDERS];

        if (activityTypes) {
            const types = Array.isArray(activityTypes) ? activityTypes : [activityTypes];
            results = results.filter((p) => types.includes(p.providerType));
        }

        res.json({
            allProviders: results,
            nearbyProviders: results,
        });
    });

    // Single Provider Search
    app.get("/api/search/provider/:activityType/:id", (req: Request, res: Response) => {
        const { activityType, id } = req.params;
        const provider = SAMPLE_PROVIDERS.find(
            (p) => p.id === id || p.userId === id
        );
        if (!provider) {
            return res.status(404).json({ error: "Provider not found" });
        }
        res.json(provider);
    });

    // Masters list and detail
    app.get("/api/masters", (req: Request, res: Response) => {
        const query = req.query.query;
        let list = SAMPLE_PROVIDERS.filter((p) => p.providerType === "master");
        if (query) {
            const q = String(query).toLowerCase();
            list = list.filter(
                (p) =>
                    p.fullName.toLowerCase().includes(q) ||
                    p.services.some((s) => s.toLowerCase().includes(q)) ||
                    p.professions.some((pr) => pr.toLowerCase().includes(q))
            );
        }
        res.json(list);
    });

    app.get("/api/masters/profile/me", (req: Request, res: Response) => {
        const master = SAMPLE_PROVIDERS[0];
        res.json(master);
    });

    app.put("/api/masters/profile/me", (req: Request, res: Response) => {
        const updated = { ...SAMPLE_PROVIDERS[0], ...req.body };
        SAMPLE_PROVIDERS[0] = updated;
        res.json(updated);
    });

    app.patch("/api/masters/profile/me/status", (req: Request, res: Response) => {
        const { status } = req.body;
        if (status) {
            SAMPLE_PROVIDERS[0].status = status;
        }
        res.json({ success: true, status: SAMPLE_PROVIDERS[0].status });
    });

    app.get("/api/masters/:id", (req: Request, res: Response) => {
        const master = SAMPLE_PROVIDERS.find((p) => p.id === req.params.id);
        if (!master) {
            return res.status(404).json({ error: "Master not found" });
        }
        res.json(master);
    });

    // Auto Wash profile
    app.get("/api/auto_washes/profile/me", (req: Request, res: Response) => {
        const wash = SAMPLE_PROVIDERS.find((p) => p.providerType === "auto_wash") || SAMPLE_PROVIDERS[2];
        res.json({
            id: wash.id,
            phone: wash.phone,
            name: wash.fullName,
            role: "auto_wash",
            profile: wash,
        });
    });

    app.put("/api/auto_washes/profile/me", (req: Request, res: Response) => {
        res.json(SAMPLE_PROVIDERS[2]);
    });

    app.put("/api/auto_washes/status", (req: Request, res: Response) => {
        res.json({ success: true });
    });

    app.get("/api/auto_washes/additional-services", (req: Request, res: Response) => {
        res.json([
            { id: "1", name: "Химчистка багажника", price: 1500 },
            { id: "2", name: "Антидождь на лобовое", price: 1200 },
            { id: "3", name: "Озонирование салона", price: 1000 },
        ]);
    });

    // Auto Shop profile
    app.get("/api/auto_shops/profile/me", (req: Request, res: Response) => {
        const shop = SAMPLE_PROVIDERS.find((p) => p.providerType === "auto_shop") || SAMPLE_PROVIDERS[3];
        res.json({
            id: shop.id,
            phone: shop.phone,
            name: shop.fullName,
            role: "auto_shop",
            profile: shop,
        });
    });

    app.put("/api/auto_shops/profile/me", (req: Request, res: Response) => {
        res.json(SAMPLE_PROVIDERS[3]);
    });

    app.put("/api/auto_shops/status", (req: Request, res: Response) => {
        res.json({ success: true });
    });

    app.get("/api/auto_shops/additional-services", (req: Request, res: Response) => {
        res.json([
            { id: "1", name: "Экспресс доставка", price: 500 },
            { id: "2", name: "Подбор по каталогам", price: 0 },
        ]);
    });

    // Auto Service profile
    app.get("/api/auto_services/profile/me", (req: Request, res: Response) => {
        const service = SAMPLE_PROVIDERS.find((p) => p.providerType === "auto_service") || SAMPLE_PROVIDERS[1];
        res.json({
            id: service.id,
            phone: service.phone,
            name: service.fullName,
            role: "auto_service",
            profile: service,
        });
    });

    app.put("/api/auto_services/profile/me", (req: Request, res: Response) => {
        res.json(SAMPLE_PROVIDERS[1]);
    });

    app.put("/api/auto_services/status", (req: Request, res: Response) => {
        res.json({ success: true });
    });

    // Auth
    const demoUser = {
        id: "demo-user-1",
        phone: "+7 (903) 123-45-67",
        name: "Иван Петров",
        role: "customer",
        avatar: null,
        capabilities: {
            professionalCabinet: true,
            calendar: true,
            applications: true,
        },
    };

    app.post("/api/auth/register", (req: Request, res: Response) => {
        const { phone, name, role } = req.body;
        const user = {
            ...demoUser,
            phone: phone || demoUser.phone,
            name: name || demoUser.name,
            role: role || demoUser.role,
        };
        res.json({
            accessToken: "mock-access-token-" + Date.now(),
            refreshToken: "mock-refresh-token-" + Date.now(),
            user,
        });
    });

    app.post("/api/auth/login", (req: Request, res: Response) => {
        const { phone } = req.body;
        const user = { ...demoUser, phone: phone || demoUser.phone };
        res.json({
            accessToken: "mock-access-token-" + Date.now(),
            refreshToken: "mock-refresh-token-" + Date.now(),
            user,
        });
    });

    app.post("/api/auth/refresh", (req: Request, res: Response) => {
        res.json({
            accessToken: "mock-access-token-refreshed-" + Date.now(),
            refreshToken: "mock-refresh-token-refreshed-" + Date.now(),
            user: demoUser,
        });
    });

    app.get("/api/users/me", (req: Request, res: Response) => {
        res.json(demoUser);
    });

    // Orders
    app.post("/api/orders", (req: Request, res: Response) => {
        const { providerId, activityTypeId, name, phone, carBrand, description, timePreference, photoAssetIds } = req.body;
        const provider = SAMPLE_PROVIDERS.find((p) => p.id === providerId) || SAMPLE_PROVIDERS[0];
        const activity = ACTIVITY_TYPES.find((a) => a.id === activityTypeId) || ACTIVITY_TYPES[1];

        const newOrder: Order = {
            id: `order-${Date.now()}`,
            customer: {
                id: demoUser.id,
                name: name || demoUser.name,
                phone: phone || demoUser.phone,
            },
            provider: {
                id: provider.id,
                name: provider.fullName,
                phone: provider.phone,
            },
            activityType: activity,
            status: "pending",
            name: name || demoUser.name,
            phone: phone || demoUser.phone,
            carBrand: carBrand || "Автомобиль",
            description: description || "",
            timePreference: timePreference || "not_urgent",
            photoAssetIds: photoAssetIds || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        sampleOrders.unshift(newOrder);
        sampleMessages[newOrder.id] = [
            {
                id: `msg-${Date.now()}`,
                message: description || "Создана новая заявка",
                createdAt: new Date().toISOString(),
                status: "delivered",
                sender: newOrder.customer,
            },
        ];

        res.status(201).json(newOrder);
    });

    app.get("/api/orders/my", (req: Request, res: Response) => {
        res.json(sampleOrders);
    });

    app.get("/api/orders/provider", (req: Request, res: Response) => {
        res.json(sampleOrders);
    });

    app.get("/api/orders/:id", (req: Request, res: Response) => {
        const order = sampleOrders.find((o) => o.id === req.params.id);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        res.json(order);
    });

    app.put("/api/orders/:id/status", (req: Request, res: Response) => {
        const order = sampleOrders.find((o) => o.id === req.params.id);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        if (req.body.status) order.status = req.body.status;
        if (req.body.confirmedDateTime) order.confirmedDateTime = req.body.confirmedDateTime;
        if (req.body.cancelReason) order.cancelReason = req.body.cancelReason;
        order.updatedAt = new Date().toISOString();
        res.json(order);
    });

    // Chat messages
    app.get("/api/chat-messages/order/:id", (req: Request, res: Response) => {
        const order = sampleOrders.find((o) => o.id === req.params.id) || sampleOrders[0];
        const messages = sampleMessages[req.params.id] || [];
        res.json({ order, messages });
    });

    app.post("/api/chat-messages/order/:id", (req: Request, res: Response) => {
        const { message } = req.body;
        const newMsg = {
            id: `msg-${Date.now()}`,
            message: message || "",
            createdAt: new Date().toISOString(),
            status: "delivered",
            sender: demoUser,
        };
        if (!sampleMessages[req.params.id]) {
            sampleMessages[req.params.id] = [];
        }
        sampleMessages[req.params.id].push(newMsg);
        res.json(newMsg);
    });

    
    app.put("/api/test-put", (req: Request, res: Response) => { res.json({ success: true, body: req.body }); });
    app.post("/api/edit-message/:orderId/:messageId", (req: Request, res: Response) => {
        console.log("PUT chat message hit! orderId=", req.params.orderId, "messageId=", req.params.messageId);
        try {
        const { orderId, messageId } = req.params;
        const { message } = req.body;
        
        if (!sampleMessages[orderId]) {
            return res.status(404).json({ error: "Order not found" });
        }
        
        const msg = sampleMessages[orderId].find((m: any) => m.id === messageId);
        if (!msg) {
            return res.status(404).json({ error: "Message not found" });
        }
        
        msg.message = message;
        msg.isEdited = true;
        
        res.json(msg);
        } catch (err: any) {
            require('fs').writeFileSync('debug_error.log', String(err.stack || err));
            res.status(500).send(String(err));
        }
    });

    app.get("/api/chat-messages/unread-count", (req: Request, res: Response) => {
        res.json([
            { orderId: "order-101", count: 1 },
        ]);
    });

    // Media
    app.post("/api/v1/media/upload-intent", (req: Request, res: Response) => {
        res.json({
            intentId: `intent-${Date.now()}`,
            uploadUrl: "/api/v1/media/upload-mock",
            stagingKey: `key-${Date.now()}`,
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            headers: {},
        });
    });

    app.all("/api/v1/media/upload-mock", (req: Request, res: Response) => {
        res.status(200).send("OK");
    });

    app.post("/api/v1/media/confirm-upload", (req: Request, res: Response) => {
        res.json({
            assetId: `asset-${Date.now()}`,
            status: "ready",
        });
    });

    app.get("/api/v1/media/assets/:id", (req: Request, res: Response) => {
        res.json({
            assetId: req.params.id,
            category: "photo",
            status: "ready",
            width: 800,
            height: 600,
            sizeBytes: 102400,
            mimeType: "image/jpeg",
            createdAt: new Date().toISOString(),
            urls: {
                original: "/car_service_icon.png",
            },
        });
    });

    app.get("/api/v1/media/:entityType/:entityId", (req: Request, res: Response) => {
        res.json({ assets: [] });
    });

    app.delete("/api/v1/media/assets/:id", (req: Request, res: Response) => {
        res.json({ success: true });
    });

    // Admin moderation
    app.get("/api/admin/moderation/cases", (req: Request, res: Response) => {
        res.json({ items: [], total: 0 });
    });

    app.get("/api/admin/moderation/cases/:id", (req: Request, res: Response) => {
        res.status(404).json({ error: "Case not found" });
    });

    app.post("/api/admin/moderation/cases/:id/assign", (req: Request, res: Response) => {
        res.json({ success: true });
    });

    app.post("/api/admin/professional-applications/:id/decision", (req: Request, res: Response) => {
        res.json({ success: true });
    });

    app.post("/api/admin/moderation/cases/:id/release", (req: Request, res: Response) => {
        res.json({ success: true });
    });

    // Reference endpoints
    app.get("/api/reference/professions", (req: Request, res: Response) => {
        res.json([
            "Автоэлектрик",
            "Диагност",
            "Моторист",
            "Ходовик",
            "Маляр",
            "Кузовщик",
            "Шиномонтаж",
            "Мастер по кондиционерам",
        ]);
    });

    app.get("/api/reference/auto-marks", (req: Request, res: Response) => {
        res.json([
            { name: "LADA", internationalName: "lada" },
            { name: "Toyota", internationalName: "toyota" },
            { name: "Hyundai", internationalName: "hyundai" },
            { name: "Kia", internationalName: "kia" },
            { name: "Volkswagen", internationalName: "volkswagen" },
            { name: "BMW", internationalName: "bmw" },
            { name: "Mercedes-Benz", internationalName: "mercedes-benz" },
            { name: "Renault", internationalName: "renault" },
        ]);
    });

    // ───────────────── VITE / STATIC SERVING ─────────────────

    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), "dist");
        app.use(express.static(distPath));
        app.get("*", (req: Request, res: Response) => {
            res.sendFile(path.join(distPath, "index.html"));
        });
    }

    const server = http.createServer(app);

    server.listen(PORT, "0.0.0.0", () => {
        console.log(`AutoGIS Server is running on port ${PORT}`);
    });
}

startServer().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
