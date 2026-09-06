import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Paper,
    Stack,
    Typography,
    Avatar,
    Chip,
    Divider,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    CalendarIcon,
    ChatIcon,
    ClockIcon,
    PhoneIcon,
    WrenchIcon,
    CameraIcon,
    MapPinIcon,
} from "@common/icons";
import { useUserProfile } from "@common/hooks";
import { theme } from "@common/theme";
import { ChatOrder, getCustomerOrders } from "@modules/chats/api";
import { DashboardLayout } from "@modules/layout";

type BookingTab = "pending" | "confirmed" | "completed" | "cancelled";

type BookingGroup = Record<BookingTab, ChatOrder[]>;

const TAB_CONFIG: Array<{ value: BookingTab; label: string }> = [
    { value: "pending", label: "Ожидают" },
    { value: "confirmed", label: "Записаны" },
    { value: "completed", label: "Готово" },
    { value: "cancelled", label: "Отменены" },
];

const TIME_PREFERENCE_LABELS: Record<string, string> = {
    urgent: "Срочно",
    not_urgent: "Не срочно",
};

const STATUS_META: Record<
    ChatOrder["status"],
    {
        label: string;
        background: string;
        color: string;
        border: string;
    }
> = {
    pending: {
        label: "Ожидает",
        background: theme.palette.warning.light,
        color: theme.palette.warning.heavy,
        border: "rgba(189, 92, 10, 0.2)",
    },
    scheduled: {
        label: "Записан",
        background: theme.palette.success.light,
        color: theme.palette.success.heavy,
        border: "rgba(42, 136, 0, 0.18)",
    },
    completed: {
        label: "Выполнено",
        background: theme.palette.info.light,
        color: theme.palette.info.heavy,
        border: "rgba(48, 114, 179, 0.18)",
    },
    cancelled: {
        label: "Отменено",
        background: theme.palette.error.light,
        color: theme.palette.error.heavy,
        border: "rgba(189, 9, 53, 0.18)",
    },
};

function formatDate(value?: string) {
    if (!value) return "Время уточняется";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Время уточняется";

    return new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function getServiceName(order: ChatOrder) {
    return order.activityType?.displayName || order.activityType?.name || "Услуга";
}

function getProviderName(order: ChatOrder) {
    return order.provider?.name || order.provider?.phone || "Исполнитель";
}

function getProviderPhone(order: ChatOrder) {
    return order.provider?.phone;
}

function getOrderTimeText(order: ChatOrder) {
    if (order.confirmedDateTime) return formatDate(order.confirmedDateTime);
    if (order.timePreference) {
        return TIME_PREFERENCE_LABELS[order.timePreference] || "Время уточняется";
    }
    return formatDate(order.createdAt);
}

function getNextOrder(groups: BookingGroup) {
    const scheduled = [...groups.confirmed].sort(
        (a, b) =>
            new Date(a.confirmedDateTime || a.createdAt).getTime() -
            new Date(b.confirmedDateTime || b.createdAt).getTime()
    );

    return scheduled[0] || groups.pending[0] || null;
}

function IconFrame(props: { children: ReactNode; compact?: boolean }) {
    const { children, compact = false } = props;

    return (
        <Box
            sx={{
                width: compact ? 30 : 38,
                height: compact ? 30 : 38,
                borderRadius: theme.shape.medium,
                backgroundColor: theme.palette.success.light,
                color: theme.palette.actions.brandHeavy,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                "& svg": {
                    width: compact ? 15 : 19,
                    height: compact ? 15 : 19,
                },
            }}
        >
            {children}
        </Box>
    );
}

function StatusPill(props: { status: ChatOrder["status"] }) {
    const status = STATUS_META[props.status];

    return (
        <Box
            component="span"
            sx={{
                alignSelf: "flex-start",
                px: 1,
                py: 0.45,
                borderRadius: "999px",
                border: `1px solid ${status.border}`,
                backgroundColor: status.background,
                color: status.color,
                fontSize: 12,
                fontWeight: 700,
                lineHeight: 1,
                whiteSpace: "nowrap",
            }}
        >
            {status.label}
        </Box>
    );
}

function DetailRow(props: { icon: ReactNode; label: string; value: string; multiline?: boolean }) {
    const { icon, label, value } = props;

    return (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
                sx={{
                    width: 24,
                    height: 24,
                    borderRadius: theme.shape.small,
                    backgroundColor: theme.palette.background[3],
                    color: theme.palette.text.secondary,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    "& svg": {
                        width: 14,
                        height: 14,
                    },
                }}
            >
                {icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography
                    sx={{
                        color: theme.palette.text.hint,
                        fontSize: 11,
                        fontWeight: 600,
                        lineHeight: 1.25,
                    }}
                >
                    {label}
                </Typography>
                <Typography
                    sx={{
                        color: theme.palette.text.primary,
                        fontSize: 13,
                        fontWeight: 600,
                        lineHeight: 1.3,
                        ...(props.multiline ? { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } : { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }),
                    }}
                >
                    {value}
                </Typography>
            </Box>
        </Stack>
    );
}

type BookingCardProps = {
    order: ChatOrder;
    selected: boolean;
    onOpenChat: (orderId: string) => void;
};

function BookingCard(props: BookingCardProps) {
    const { order, selected, onOpenChat } = props;
    const providerPhone = getProviderPhone(order);
    const hasPhotos = order.photoAssetIds && order.photoAssetIds.length > 0;
    const isUrgent = order.timePreference === "urgent" && order.status === "pending";

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                borderRadius: theme.shape.large,
                backgroundColor: theme.palette.white,
                border: selected
                    ? `2px solid ${theme.palette.actions.brand}`
                    : `1px solid ${theme.palette.base.generic}`,
                boxShadow: selected ? theme.shadows.hover : theme.shadows.separator,
                scrollMarginTop: 76,
                position: "relative",
                overflow: "hidden",
            }}
        >
            {isUrgent && (
                <Box
                    sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background: `linear-gradient(90deg, ${theme.palette.error.heavy}, ${theme.palette.error.light})`,
                    }}
                />
            )}
            <Stack spacing={1.6}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Avatar 
                        src={order.provider?.avatarUrl || undefined}
                        sx={{ 
                            width: 44, 
                            height: 44, 
                            backgroundColor: theme.palette.background[2],
                            color: theme.palette.text.secondary,
                            fontWeight: 800,
                            borderRadius: theme.shape.medium
                        }}
                    >
                        <WrenchIcon style={{ width: 20, height: 20 }} />
                    </Avatar>

                    <Box sx={{ minWidth: 0, flex: 1, pt: 0.2 }}>
                        <Typography
                            sx={{
                                color: theme.palette.text.primary,
                                fontSize: 16,
                                fontWeight: 800,
                                lineHeight: 1.2,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {getServiceName(order)}
                        </Typography>
                        <Typography
                            sx={{
                                mt: 0.35,
                                color: theme.palette.text.secondary,
                                fontSize: 13,
                                lineHeight: 1.3,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {getProviderName(order)}
                        </Typography>
                    </Box>
                    <StatusPill status={order.status} />
                </Stack>

                {(order.carBrand || hasPhotos || isUrgent) && (
                    <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                        {isUrgent && (
                            <Chip 
                                label="Срочно" 
                                size="small"
                                sx={{ 
                                    backgroundColor: theme.palette.error.light,
                                    color: theme.palette.error.heavy,
                                    fontWeight: 800,
                                    fontSize: 12,
                                    height: 24,
                                }} 
                            />
                        )}
                        {order.carBrand && (
                            <Chip 
                                label={`Авто: ${order.carBrand}`} 
                                size="small"
                                sx={{ 
                                    backgroundColor: theme.palette.background[2],
                                    color: theme.palette.text.secondary,
                                    fontWeight: 700,
                                    fontSize: 12,
                                    height: 24,
                                }} 
                            />
                        )}
                        {hasPhotos && (
                            <Chip 
                                icon={<CameraIcon style={{ width: 14, height: 14, color: 'inherit' }} />}
                                label={`Фото: ${order.photoAssetIds?.length}`} 
                                size="small"
                                sx={{ 
                                    backgroundColor: theme.palette.info.light,
                                    color: theme.palette.info.heavy,
                                    fontWeight: 700,
                                    fontSize: 12,
                                    height: 24,
                                    '& .MuiChip-icon': { ml: 1 }
                                }} 
                            />
                        )}
                    </Stack>
                )}

                <Stack
                    direction="column"
                    spacing={1}
                    sx={{
                        p: 1.2,
                        borderRadius: theme.shape.medium,
                        backgroundColor: theme.palette.background[3],
                    }}
                >
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <DetailRow
                                icon={<ClockIcon />}
                                label="Время"
                                value={getOrderTimeText(order)}
                            />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <DetailRow
                                icon={<CalendarIcon />}
                                label="Создана"
                                value={formatDate(order.createdAt)}
                            />
                        </Box>
                    </Stack>
                    {(order.provider as any).address && (
                        <Box sx={{ mt: { xs: 0.5, sm: 0 } }}>
                            <DetailRow icon={<MapPinIcon />} label="Адрес" value={(order.provider as any).address} multiline />
                        </Box>
                    )}
                </Stack>

                {order.description && (
                    <Typography
                        sx={{
                            color: theme.palette.text.secondary,
                            fontSize: 13,
                            lineHeight: 1.45,
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                        }}
                    >
                        {order.description}
                    </Typography>
                )}

                {order.status === "cancelled" && order.cancelReason && (
                    <Box sx={{ 
                        p: 1.2, 
                        borderRadius: theme.shape.small, 
                        backgroundColor: theme.palette.error.light,
                        border: `1px dashed rgba(189, 9, 53, 0.3)`
                    }}>
                        <Typography sx={{ color: theme.palette.error.heavy, fontSize: 12, fontWeight: 700, mb: 0.2 }}>
                            Причина отмены:
                        </Typography>
                        <Typography sx={{ color: theme.palette.error.heavy, fontSize: 13, lineHeight: 1.4 }}>
                            {order.cancelReason}
                        </Typography>
                    </Box>
                )}

                <Stack direction="row" spacing={1}>
                    <Button
                        type="button"
                        variant="contained"
                        onClick={() => onOpenChat(order.id)}
                        startIcon={<ChatIcon />}
                        aria-label={`Открыть чат по записи ${getServiceName(order)}`}
                        sx={{
                            flex: 1,
                            minHeight: 44,
                            borderRadius: theme.shape.medium,
                            backgroundColor: theme.palette.actions.brand,
                            color: theme.palette.text.white,
                            boxShadow: "none",
                            textTransform: "none",
                            fontSize: 14,
                            fontWeight: 800,
                            "&:hover": {
                                backgroundColor: theme.palette.actions.brandHeavy,
                                boxShadow: "none",
                            },
                            "& svg": {
                                width: 18,
                                height: 18,
                            },
                        }}
                    >
                        Чат
                    </Button>
                    {providerPhone && (
                        <Button
                            component="a"
                            href={`tel:${providerPhone}`}
                            variant="outlined"
                            startIcon={<PhoneIcon />}
                            aria-label={`Позвонить мастеру ${getProviderName(order)}`}
                            sx={{
                                flex: 1,
                                minHeight: 44,
                                borderRadius: theme.shape.medium,
                                borderColor: theme.palette.actions.inactive,
                                color: theme.palette.actions.brandHeavy,
                                backgroundColor: theme.palette.white,
                                textTransform: "none",
                                fontSize: 14,
                                fontWeight: 800,
                                "&:hover": {
                                    borderColor: theme.palette.actions.brand,
                                    backgroundColor: theme.palette.success.light,
                                },
                                "& svg": {
                                    width: 18,
                                    height: 18,
                                },
                            }}
                        >
                            Позвонить
                        </Button>
                    )}
                </Stack>
            </Stack>
        </Paper>
    );
}
function NextBookingPanel(props: {
    order: ChatOrder | null;
    activeCount: number;
    completedCount: number;
    onOpenChat: (orderId: string) => void;
}) {
    const { order, activeCount, completedCount, onOpenChat } = props;

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                borderRadius: theme.shape.large,
                color: theme.palette.text.white,
                background: `linear-gradient(135deg, ${theme.palette.actions.brandHeavy}, ${theme.palette.actions.brand})`,
                boxShadow: "0 12px 32px rgba(78, 153, 45, 0.18)",
                overflow: "hidden",
                position: "relative",
            }}
        >
            <Stack spacing={1.5} sx={{ position: "relative", zIndex: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <IconFrame compact>
                        <CalendarIcon />
                    </IconFrame>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                            sx={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: "rgba(255, 255, 255, 0.76)",
                                lineHeight: 1.2,
                            }}
                        >
                            Активная заявка
                        </Typography>
                        <Typography
                            sx={{
                                mt: 0.2,
                                fontSize: 18,
                                fontWeight: 900,
                                lineHeight: 1.16,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                            }}
                        >
                            {order ? getServiceName(order) : "Нет активных записей"}
                        </Typography>
                    </Box>
                    {order && <StatusPill status={order.status} />}
                </Stack>

                {order ? (
                    <Stack spacing={1.2}>
                        <Typography
                            sx={{
                                fontSize: 13,
                                lineHeight: 1.45,
                                color: "rgba(255, 255, 255, 0.86)",
                            }}
                        >
                            {getProviderName(order)} · {getOrderTimeText(order)}
                        </Typography>

                        <Button
                            type="button"
                            variant="contained"
                            onClick={() => onOpenChat(order.id)}
                            startIcon={<ChatIcon />}
                            sx={{
                                alignSelf: "flex-start",
                                minHeight: 44,
                                borderRadius: theme.shape.medium,
                                backgroundColor: theme.palette.white,
                                color: theme.palette.actions.brandHeavy,
                                boxShadow: "none",
                                textTransform: "none",
                                fontSize: 13,
                                fontWeight: 900,
                                px: 1.4,
                                "&:hover": {
                                    backgroundColor: theme.palette.success.light,
                                    boxShadow: "none",
                                },
                                "& svg": {
                                    width: 17,
                                    height: 17,
                                },
                            }}
                        >
                            Открыть чат
                        </Button>
                    </Stack>
                ) : (
                    <Typography
                        sx={{
                            color: "rgba(255, 255, 255, 0.82)",
                            fontSize: 13,
                            lineHeight: 1.45,
                        }}
                    >
                        Когда мастер подтвердит заявку, она появится здесь.
                    </Typography>
                )}

                <Stack direction="row" spacing={1}>
                    <Box
                        sx={{
                            flex: 1,
                            p: 1,
                            borderRadius: theme.shape.medium,
                            backgroundColor: "rgba(255, 255, 255, 0.13)",
                        }}
                    >
                        <Typography sx={{ fontSize: 20, fontWeight: 900, lineHeight: 1 }}>
                            {activeCount}
                        </Typography>
                        <Typography
                            sx={{
                                mt: 0.45,
                                fontSize: 11,
                                fontWeight: 700,
                                color: "rgba(255, 255, 255, 0.74)",
                            }}
                        >
                            активные
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            flex: 1,
                            p: 1,
                            borderRadius: theme.shape.medium,
                            backgroundColor: "rgba(255, 255, 255, 0.13)",
                        }}
                    >
                        <Typography sx={{ fontSize: 20, fontWeight: 900, lineHeight: 1 }}>
                            {completedCount}
                        </Typography>
                        <Typography
                            sx={{
                                mt: 0.45,
                                fontSize: 11,
                                fontWeight: 700,
                                color: "rgba(255, 255, 255, 0.74)",
                            }}
                        >
                            выполнены
                        </Typography>
                    </Box>
                </Stack>
            </Stack>
        </Paper>
    );
}

function EmptyState(props: { tab: BookingTab }) {
    const copy: Record<BookingTab, string> = {
        pending: "Новых заявок пока нет.",
        confirmed: "Подтвержденных записей пока нет.",
        completed: "Выполненных записей пока нет.",
        cancelled: "Отмененных записей пока нет.",
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2.5,
                borderRadius: theme.shape.large,
                backgroundColor: theme.palette.white,
                border: `1px solid ${theme.palette.base.generic}`,
                textAlign: "center",
            }}
        >
            <Stack spacing={1.2} alignItems="center">
                <IconFrame>
                    <CalendarIcon />
                </IconFrame>
                <Typography
                    sx={{
                        color: theme.palette.text.primary,
                        fontSize: 16,
                        fontWeight: 800,
                        lineHeight: 1.2,
                    }}
                >
                    {copy[props.tab]}
                </Typography>
                <Typography
                    sx={{
                        maxWidth: 300,
                        color: theme.palette.text.secondary,
                        fontSize: 13,
                        lineHeight: 1.45,
                    }}
                >
                    Здесь будут отображаться заявки и записи к мастерам.
                </Typography>
            </Stack>
        </Paper>
    );
}

export function Bookings() {
    const navigate = useNavigate();
    const { profile } = useUserProfile();
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get("tab");
    const selectedOrderId = searchParams.get("orderId");
    const initialTab: BookingTab =
        tabParam === "confirmed" ||
        tabParam === "completed" ||
        tabParam === "cancelled"
            ? tabParam
            : "pending";
    const [tab, setTab] = useState<BookingTab>("pending");

    const { data: orders, isLoading } = useQuery({
        queryKey: ["customerBookings", profile?.id],
        queryFn: getCustomerOrders,
        enabled: !!profile?.id,
    });

    useEffect(() => {
        if (selectedOrderId && orders) {
            const order = orders.find((o) => o.id === selectedOrderId);
            if (order) {
                if (order.status === "scheduled") setTab("confirmed");
                else setTab(order.status as BookingTab);
                return;
            }
        }
        setTab(initialTab);
    }, [initialTab, selectedOrderId, orders]);



    const sortedOrders = useMemo(() => {
        return [...(orders ?? [])].sort(
            (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }, [orders]);

    const grouped = useMemo<BookingGroup>(() => {
        return {
            pending: sortedOrders.filter((order) => order.status === "pending"),
            confirmed: sortedOrders.filter(
                (order) => order.status === "scheduled"
            ),
            completed: sortedOrders.filter(
                (order) => order.status === "completed"
            ),
            cancelled: sortedOrders.filter(
                (order) => order.status === "cancelled"
            ),
        };
    }, [sortedOrders]);

    const activeOrders = grouped[tab];
    const nextOrder = useMemo(() => getNextOrder(grouped), [grouped]);
    const activeCount = grouped.pending.length + grouped.confirmed.length;
    const completedCount = grouped.completed.length;

    const handleTabChange = (value: BookingTab) => {
        setTab(value);
        setSearchParams({ tab: value });
    };

    const handleOpenChat = (orderId: string) => {
        navigate(`/cabinet/chats?tab=ordinary&orderId=${orderId}`);
    };

    if (!profile) return null;

    return (
        <DashboardLayout title="Записи">
            <Stack
                spacing={2}
                sx={{
                    width: "100%",
                    maxWidth: 760,
                    mx: "auto",
                    pb: { xs: 9, md: 3 },
                    "@media (min-width: 1025px)": {
                        mx: 0,
                        maxWidth: 860,
                    },
                }}
            >
                <Box
                    sx={{
                        pt: 1.5,
                        "@media (min-width: 1025px)": {
                            pt: 0,
                        },
                    }}
                >
                    <Typography
                        sx={{
                            color: theme.palette.text.primary,
                            fontSize: 22,
                            fontWeight: 900,
                            lineHeight: 1.15,
                        }}
                    >
                        Мои записи
                    </Typography>
                    <Typography
                        sx={{
                            mt: 0.6,
                            color: theme.palette.text.secondary,
                            fontSize: 13,
                            lineHeight: 1.45,
                        }}
                    >
                        Заявки, подтвержденные визиты и история обращений к мастерам.
                    </Typography>
                </Box>

                <NextBookingPanel
                    order={nextOrder}
                    activeCount={activeCount}
                    completedCount={completedCount}
                    onOpenChat={handleOpenChat}
                />

                <Box
                    sx={{ mt: 1 }}
                >
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, minmax(0, 1fr))" }, gap: 1 }}>
                        {TAB_CONFIG.map((item) => {
                            const selected = tab === item.value;

                            return (
                                <Box
                                    key={item.value}
                                    component="button"
                                    type="button"
                                    onClick={() => handleTabChange(item.value)}
                                    aria-pressed={selected}
                                    sx={{
                                        minHeight: 44,
                                        px: 1.35,
                                        borderRadius: "999px",
                                        border: selected
                                            ? `1px solid ${theme.palette.actions.brand}`
                                            : `1px solid ${theme.palette.base.generic}`,
                                        backgroundColor: selected
                                            ? theme.palette.success.light
                                            : theme.palette.white,
                                        color: selected
                                            ? theme.palette.actions.brandHeavy
                                            : theme.palette.text.compliment,
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: "100%",
                                        gap: 0.8,
                                        fontSize: 13,
                                        fontWeight: 800,
                                        boxShadow: selected ? theme.shadows.separator : "none",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {item.label}
                                    <Box
                                        component="span"
                                        sx={{
                                            minWidth: 22,
                                            height: 22,
                                            px: 0.65,
                                            borderRadius: "999px",
                                            backgroundColor: selected
                                                ? theme.palette.actions.brand
                                                : theme.palette.background[3],
                                            color: selected
                                                ? theme.palette.text.white
                                                : theme.palette.text.secondary,
                                            display: "grid",
                                            placeItems: "center",
                                            fontSize: 12,
                                            fontWeight: 900,
                                            lineHeight: 1,
                                        }}
                                    >
                                        {grouped[item.value].length}
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>

                {isLoading && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress
                            size={28}
                            sx={{ color: theme.palette.actions.brand }}
                        />
                    </Box>
                )}

                {!isLoading && activeOrders.length === 0 && <EmptyState tab={tab} />}

                {!isLoading && activeOrders.length > 0 && (
                    <Stack spacing={1.2}>
                        {activeOrders.map((order) => (
                            <BookingCard
                                key={order.id}
                                order={order}
                                selected={order.id === selectedOrderId}
                                onOpenChat={handleOpenChat}
                            />
                        ))}
                    </Stack>
                )}

                {!isLoading && tab === "cancelled" && activeOrders.length > 0 && (
                    <Alert
                        severity="info"
                        sx={{
                            borderRadius: theme.shape.large,
                            backgroundColor: theme.palette.info.light,
                            color: theme.palette.info.heavy,
                            "& .MuiAlert-icon": {
                                color: theme.palette.info.heavy,
                            },
                        }}
                    >
                        Здесь отображаются записи, которые были отменены.
                    </Alert>
                )}
            </Stack>
        </DashboardLayout>
    );
}
