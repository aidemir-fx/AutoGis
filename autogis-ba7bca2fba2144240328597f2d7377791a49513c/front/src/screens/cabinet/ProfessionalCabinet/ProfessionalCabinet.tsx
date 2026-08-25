import React from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Stack,
    Typography,
} from "@mui/material";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { hasCapability } from "@common/lib/userAccess";
import { useUserProfile } from "@common/hooks";
import { http } from "@common/lib/http";
import { DashboardLayout } from "@modules/layout/features/UserCabinetLayout/DashboardLayout";
import { ChatOrder, getProviderOrders } from "@modules/chats/api";
import { ORDER_TIME_PREFERENCE_LABELS } from "@modules/orders/api";
import { palette as applicationsPalette } from "../Applications/components/styles";

interface ActivityType {
    id: string;
    name: string;
    displayName: string;
    description?: string;
    isActive: boolean;
}

interface UserActivityTypeItem {
    id: string;
    activityType: ActivityType;
}

type Tone = {
    accent: string;
    accentSoft: string;
    accentText: string;
};

const ui = {
    page: "#ffffff",
    surface: applicationsPalette.surface,
    border: applicationsPalette.border,
    text: applicationsPalette.textPrimary,
    textMuted: applicationsPalette.textSecondary,
    red: applicationsPalette.urgent,
    redSoft: applicationsPalette.urgentSoft,
};

const cabinetPalette = {
    accent: "#2f6fb3",
    accentSoft: "#f4f8ff",
    accentText: "#2d5f99",
    panel: "#f8faff",
    timeBg: "#f8fafc",
    timeBorder: "#e2e8f0",
    timeText: "#334155",
    currentBg: "#f4f8ff",
    currentBorder: "#bfdbfe",
    currentText: "#2d5f99",
};

const cabinetTone: Tone = {
    accent: cabinetPalette.accent,
    accentSoft: cabinetPalette.accentSoft,
    accentText: cabinetPalette.accentText,
};

const REQUEST_PREVIEW_LIMIT = 3;
const DAY_FEED_LIMIT = 4;
const SCHEDULE_PREVIEW_LIMIT = 3;

function pluralRu(count: number, one: string, few: string, many: string) {
    const mod10 = count % 10;
    const mod100 = count % 100;

    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
}

function getClientName(order: ChatOrder) {
    return order.name || order.customer?.name || order.customer?.phone || "Без имени";
}

function getVehicleLabel(order: ChatOrder) {
    return order.carBrand || order.activityType?.displayName || "Авто не указано";
}

function getTimePreferenceLabel(value?: string) {
    if (!value) return null;
    return (
        ORDER_TIME_PREFERENCE_LABELS[
            value as keyof typeof ORDER_TIME_PREFERENCE_LABELS
        ] || value
    );
}

function getOrderNote(order: ChatOrder) {
    const details = [
        order.description,
        order.photoAssetIds?.length ? `${order.photoAssetIds.length} фото` : null,
        getTimePreferenceLabel(order.timePreference),
    ].filter(Boolean);

    return details.join(" · ") || "Описание не указано";
}

function formatTime(value: string) {
    return new Date(value).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatHeaderDate(date: Date) {
    return date.toLocaleDateString("ru-RU", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });
}

function isSameDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function isCurrentSlot(dateTime: string) {
    const start = new Date(dateTime).getTime();
    const now = Date.now();
    const end = start + 60 * 60_000;
    return now >= start && now <= end;
}

function IconBox({
    children,
    tone,
    size = 36,
}: {
    children: React.ReactNode;
    tone: Tone;
    size?: number;
}) {
    return (
        <Box
            sx={{
                width: size,
                height: size,
                borderRadius: "8px",
                background: tone.accentSoft,
                color: tone.accentText,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                "& svg": { fontSize: Math.max(16, size / 2) },
            }}
        >
            {children}
        </Box>
    );
}

function SectionCard({
    children,
    icon,
    title,
    subtitle,
    action,
    onAction,
}: {
    children?: React.ReactNode;
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    action?: string;
    onAction?: () => void;
}) {
    return (
        <Box
            sx={{
                background: ui.surface,
                border: `1px solid ${ui.border}`,
                borderRadius: "8px",
                p: 1.25,
                minWidth: 0,
                boxShadow: "0 12px 32px -28px rgba(15, 23, 42, 0.45)",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    mb: children ? 1.1 : 0,
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        minWidth: 0,
                    }}
                >
                    <IconBox tone={cabinetTone} size={32}>
                        {icon}
                    </IconBox>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            sx={{
                                color: ui.text,
                                fontSize: 15,
                                fontWeight: 850,
                                lineHeight: 1.15,
                            }}
                        >
                            {title}
                        </Typography>
                        {subtitle ? (
                            <Typography
                                sx={{
                                    color: ui.textMuted,
                                    fontSize: 12,
                                    lineHeight: 1.25,
                                    mt: 0.2,
                                }}
                            >
                                {subtitle}
                            </Typography>
                        ) : null}
                    </Box>
                </Box>
                {action && onAction ? (
                    <Button
                        size="small"
                        endIcon={<ChevronRightRoundedIcon />}
                        onClick={onAction}
                        sx={{
                            minWidth: 0,
                            px: 0.5,
                            color: cabinetTone.accentText,
                            fontSize: 12,
                            fontWeight: 700,
                            borderRadius: "8px",
                            whiteSpace: "nowrap",
                            textTransform: "none",
                        }}
                    >
                        {action}
                    </Button>
                ) : null}
            </Box>
            {children ? children : null}
        </Box>
    );
}

function LoadingState() {
    return (
        <Box
            sx={{
                minHeight: 68,
                display: "grid",
                placeItems: "center",
                color: ui.textMuted,
            }}
        >
            <CircularProgress size={22} />
        </Box>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <Box
            sx={{
                border: `1px dashed ${cabinetPalette.timeBorder}`,
                borderRadius: "8px",
                background: cabinetPalette.timeBg,
                color: ui.textMuted,
                px: 1,
                py: 1.1,
                fontSize: 13,
                lineHeight: 1.35,
            }}
        >
            {text}
        </Box>
    );
}

function DayFeed({
    orders,
    onOpenOrder,
}: {
    orders: ChatOrder[];
    onOpenOrder: (orderId: string) => void;
}) {
    if (orders.length === 0) {
        return <EmptyState text="На сегодня подтверждённых записей нет." />;
    }

    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: {
                    xs: "repeat(4, minmax(64px, 1fr))",
                    sm: "repeat(4, minmax(96px, 1fr))",
                },
                gap: 0.75,
                overflowX: "auto",
                pb: 0.25,
            }}
        >
            {orders.slice(0, DAY_FEED_LIMIT).map((order) => {
                const isActive = isCurrentSlot(order.confirmedDateTime as string);
                return (
                    <Box
                        key={order.id}
                        component="button"
                        type="button"
                        onClick={() => onOpenOrder(order.id)}
                        sx={{
                            minWidth: 64,
                            borderRadius: "8px",
                            border: `1px solid ${
                                isActive
                                    ? cabinetPalette.currentBorder
                                    : cabinetPalette.timeBorder
                            }`,
                            background: isActive
                                ? cabinetPalette.currentBg
                                : cabinetPalette.timeBg,
                            p: 0.85,
                            cursor: "pointer",
                            textAlign: "left",
                            font: "inherit",
                            transition:
                                "border-color 0.16s ease, background 0.16s ease",
                            "&:hover": {
                                borderColor: cabinetPalette.currentBorder,
                                background: cabinetPalette.currentBg,
                            },
                        }}
                    >
                        <Typography
                            sx={{
                                color: isActive
                                    ? cabinetPalette.currentText
                                    : cabinetPalette.timeText,
                                fontSize: 12,
                                fontWeight: isActive ? 800 : 750,
                                lineHeight: 1.25,
                            }}
                        >
                            {formatTime(order.confirmedDateTime as string)}
                        </Typography>
                        <Typography
                            sx={{
                                color: isActive
                                    ? cabinetPalette.currentText
                                    : ui.textMuted,
                                fontSize: 11,
                                fontWeight: isActive ? 650 : 500,
                                mt: 0.2,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {getClientName(order)}
                        </Typography>
                    </Box>
                );
            })}
        </Box>
    );
}

function RequestPreview({
    orders,
    pendingCount,
    onOpenOrder,
    onOpenPending,
}: {
    orders: ChatOrder[];
    pendingCount: number;
    onOpenOrder: (orderId: string) => void;
    onOpenPending: () => void;
}) {
    const visibleOrders = orders.slice(0, REQUEST_PREVIEW_LIMIT);
    const remainingCount = Math.max(0, pendingCount - visibleOrders.length);

    if (pendingCount === 0) {
        return <EmptyState text="Новых заявок без решения мастера пока нет." />;
    }

    return (
        <Stack spacing={0.75}>
            {visibleOrders.map((order) => {
                const isUrgent = order.timePreference === "urgent";
                return (
                    <Box
                        key={order.id}
                        component="button"
                        type="button"
                        onClick={() => onOpenOrder(order.id)}
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "1fr auto",
                            gap: 1,
                            alignItems: "start",
                            border: `1px solid ${ui.border}`,
                            borderRadius: "8px",
                            background: ui.page,
                            p: 0.9,
                            minWidth: 0,
                            cursor: "pointer",
                            textAlign: "left",
                            font: "inherit",
                            transition:
                                "border-color 0.16s ease, background 0.16s ease",
                            "&:hover": {
                                borderColor: cabinetPalette.currentBorder,
                                background: cabinetPalette.accentSoft,
                            },
                        }}
                    >
                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                sx={{
                                    color: ui.text,
                                    fontSize: 13,
                                    fontWeight: 850,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {getClientName(order)} · {getVehicleLabel(order)}
                            </Typography>
                            <Typography
                                sx={{
                                    color: ui.textMuted,
                                    fontSize: 12,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {getOrderNote(order)}
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                borderRadius: "8px",
                                background: isUrgent
                                    ? ui.redSoft
                                    : cabinetPalette.timeBg,
                                color: isUrgent ? ui.red : cabinetPalette.timeText,
                                px: 0.8,
                                py: 0.3,
                                fontSize: 10,
                                fontWeight: 850,
                                textTransform: "uppercase",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {isUrgent ? "срочно" : "новая"}
                        </Box>
                    </Box>
                );
            })}
            {remainingCount > 0 ? (
                <Box
                    component="button"
                    type="button"
                    onClick={onOpenPending}
                    sx={{
                        minHeight: 36,
                        borderRadius: "8px",
                        border: `1px dashed ${cabinetPalette.currentBorder}`,
                        background: cabinetPalette.accentSoft,
                        color: cabinetPalette.accentText,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0.35,
                        px: 1,
                        cursor: "pointer",
                        font: "inherit",
                        fontSize: 12,
                        fontWeight: 750,
                        transition:
                            "border-color 0.16s ease, background 0.16s ease",
                        "& svg": { fontSize: 18 },
                        "&:hover": {
                            borderColor: cabinetPalette.accent,
                            background: ui.surface,
                        },
                    }}
                >
                    Ещё {remainingCount}
                    <ChevronRightRoundedIcon />
                </Box>
            ) : null}
        </Stack>
    );
}

function SchedulePreview({
    orders,
    onOpenOrder,
}: {
    orders: ChatOrder[];
    onOpenOrder: (orderId: string) => void;
}) {
    if (orders.length === 0) {
        return <EmptyState text="Ближайших подтверждённых записей нет." />;
    }

    return (
        <Stack spacing={0.75}>
            {orders.slice(0, SCHEDULE_PREVIEW_LIMIT).map((order) => (
                <Box
                    key={order.id}
                    component="button"
                    type="button"
                    onClick={() => onOpenOrder(order.id)}
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "48px 1fr",
                        gap: 1,
                        alignItems: "start",
                        minWidth: 0,
                        border: 0,
                        background: "transparent",
                        p: 0,
                        cursor: "pointer",
                        textAlign: "left",
                        font: "inherit",
                    }}
                >
                    <Box
                        sx={{
                            borderRadius: "8px",
                            background: cabinetPalette.timeBg,
                            border: `1px solid ${cabinetPalette.timeBorder}`,
                            color: cabinetPalette.timeText,
                            px: 0.7,
                            py: 0.55,
                            textAlign: "center",
                            fontSize: 12,
                            fontWeight: 850,
                            lineHeight: 1.2,
                        }}
                    >
                        {formatTime(order.confirmedDateTime as string)}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            sx={{
                                color: ui.text,
                                fontSize: 13,
                                fontWeight: 820,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {getVehicleLabel(order)}
                            {order.activityType?.displayName
                                ? ` · ${order.activityType.displayName}`
                                : ""}
                        </Typography>
                        <Typography
                            sx={{
                                color: ui.textMuted,
                                fontSize: 12,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {getClientName(order)}
                        </Typography>
                    </Box>
                </Box>
            ))}
        </Stack>
    );
}

export function ProfessionalCabinet() {
    const navigate = useNavigate();
    const { profile } = useUserProfile();
    const hasProfessionalCabinetAccess = hasCapability(
        profile,
        "professionalCabinet",
    );
    const hasApplicationsAccess = hasCapability(profile, "applications");
    const hasCalendarAccess = hasCapability(profile, "calendar");
    const hasAnyCrmAccess = hasApplicationsAccess || hasCalendarAccess;

    const { data: userActivityTypes } = useQuery<UserActivityTypeItem[]>({
        queryKey: ["userActivityTypes", profile?.id],
        queryFn: async () => {
            const response = await http.get("/user-activity-types/my");
            return response.data;
        },
        enabled: !!profile?.id && hasProfessionalCabinetAccess,
        retry: false,
    });

    const activityList = React.useMemo(
        () =>
            (userActivityTypes ?? [])
                .map((item) => item.activityType)
                .filter(Boolean),
        [userActivityTypes],
    );

    const { data: orders, isLoading: isOrdersLoading } = useQuery<ChatOrder[]>({
        queryKey: ["providerOrders", profile?.id],
        queryFn: getProviderOrders,
        enabled: !!profile?.id && hasAnyCrmAccess,
        retry: false,
    });

    const pendingOrders = React.useMemo(() => {
        return (orders ?? [])
            .filter((order) => order.status === "pending")
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
            );
    }, [orders]);

    const scheduleOrders = React.useMemo(() => {
        const now = Date.now();
        return (orders ?? [])
            .filter(
                (order) => order.status === "scheduled" && order.confirmedDateTime,
            )
            .filter(
                (order) =>
                    new Date(order.confirmedDateTime as string).getTime() >=
                    now - 3600_000,
            )
            .sort(
                (a, b) =>
                    new Date(a.confirmedDateTime as string).getTime() -
                    new Date(b.confirmedDateTime as string).getTime(),
            );
    }, [orders]);

    const todayOrders = React.useMemo(() => {
        const today = new Date();
        return scheduleOrders.filter((order) =>
            isSameDay(new Date(order.confirmedDateTime as string), today),
        );
    }, [scheduleOrders]);

    const pendingCount = pendingOrders.length;
    const today = React.useMemo(() => new Date(), []);
    const headerDate = formatHeaderDate(today);
    const activitySubtitle =
        activityList.length > 0
            ? `${activityList.length} ${pluralRu(
                  activityList.length,
                  "тип",
                  "типа",
                  "типов",
              )} добавлено`
            : "направления и настройки";

    const openOrder = (orderId: string) => {
        navigate(`/cabinet/applications?orderId=${orderId}`);
    };

    if (!profile) return null;

    if (!hasProfessionalCabinetAccess) {
        return (
            <DashboardLayout title="Кабинет">
                <Typography variant="body1" color="text.secondary">
                    Профессиональный кабинет недоступен. Подайте заявку на
                    активацию на странице «Для бизнеса».
                </Typography>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Кабинет">
            <Box
                sx={{
                    maxWidth: 760,
                    mx: "auto",
                    pb: {
                        xs: "calc(80px + env(safe-area-inset-bottom, 0px))",
                        md: 3,
                    },
                    display: "grid",
                    gap: 1.25,
                }}
            >
                {!hasAnyCrmAccess && (
                    <Alert severity="info">
                        Профессиональный кабинет активен. CRM mini доступна всем
                        подтипам частного исполнителя, а бизнес-CRM будет
                        подключаться отдельно, по подписке.
                    </Alert>
                )}

                <Box
                    sx={{
                        background: ui.surface,
                        border: `1px solid ${ui.border}`,
                        borderRadius: "8px",
                        px: 1.5,
                        py: 1.25,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1.25,
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            minWidth: 0,
                        }}
                    >
                        <IconBox tone={cabinetTone} size={38}>
                            <RouteRoundedIcon />
                        </IconBox>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                component="h1"
                                sx={{
                                    color: ui.text,
                                    fontSize: 18,
                                    fontWeight: 900,
                                    lineHeight: 1.1,
                                }}
                            >
                                Кабинет
                            </Typography>
                            <Typography
                                sx={{
                                    color: ui.textMuted,
                                    fontSize: 12,
                                    mt: 0.25,
                                    textTransform: "lowercase",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {headerDate}
                            </Typography>
                        </Box>
                    </Box>
                    <Chip
                        label={`${todayOrders.length} ${pluralRu(
                            todayOrders.length,
                            "запись",
                            "записи",
                            "записей",
                        )}`}
                        size="small"
                        sx={{
                            borderRadius: "8px",
                            background: cabinetPalette.currentBg,
                            color: cabinetPalette.currentText,
                            border: `1px solid ${cabinetPalette.currentBorder}`,
                            fontWeight: 650,
                            flexShrink: 0,
                        }}
                    />
                </Box>

                {hasCalendarAccess && (
                    <SectionCard
                        icon={<RouteRoundedIcon />}
                        title="Лента дня"
                        subtitle="записи, привязанные к заявкам"
                    >
                        {isOrdersLoading ? (
                            <LoadingState />
                        ) : (
                            <DayFeed orders={todayOrders} onOpenOrder={openOrder} />
                        )}
                    </SectionCard>
                )}

                {hasApplicationsAccess && (
                    <SectionCard
                        icon={<AssignmentTurnedInRoundedIcon />}
                        title="Заявки"
                        subtitle={
                            pendingCount
                                ? `${pendingCount} без решения мастера`
                                : "новых заявок нет"
                        }
                        action="Все заявки"
                        onAction={() => navigate("/cabinet/applications")}
                    >
                        {isOrdersLoading ? (
                            <LoadingState />
                        ) : (
                            <RequestPreview
                                orders={pendingOrders}
                                pendingCount={pendingCount}
                                onOpenOrder={openOrder}
                                onOpenPending={() =>
                                    navigate("/cabinet/applications?status=pending")
                                }
                            />
                        )}
                    </SectionCard>
                )}

                {hasCalendarAccess && (
                    <SectionCard
                        icon={<CalendarMonthRoundedIcon />}
                        title="Расписание"
                        subtitle="ближайшие подтверждённые записи"
                        action="Неделя"
                        onAction={() => navigate("/cabinet/calendar")}
                    >
                        {isOrdersLoading ? (
                            <LoadingState />
                        ) : (
                            <SchedulePreview
                                orders={scheduleOrders}
                                onOpenOrder={openOrder}
                            />
                        )}
                    </SectionCard>
                )}

                <SectionCard
                    icon={<CategoryRoundedIcon />}
                    title="Типы деятельности"
                    subtitle={activitySubtitle}
                    action="Открыть"
                    onAction={() => navigate("/cabinet/activity-types")}
                />
            </Box>
        </DashboardLayout>
    );
}
