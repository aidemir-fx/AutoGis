const fs = require('fs');
let code = fs.readFileSync('src/screens/cabinet/Bookings/Bookings.tsx', 'utf8');

// Find the start and end of BookingCard function
const startIndex = code.indexOf('function BookingCard(props: BookingCardProps) {');
if (startIndex !== -1) {
    // Find the end of it (it ends before function EmptyState or function NextBookingPanel)
    let endIndex = code.indexOf('function NextBookingPanel(', startIndex);
    if (endIndex === -1) {
        endIndex = code.indexOf('function EmptyState(', startIndex);
    }
    
    if (endIndex !== -1) {
        const newBookingCard = `function BookingCard(props: BookingCardProps) {
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
                    ? \`2px solid \${theme.palette.actions.brand}\`
                    : \`1px solid \${theme.palette.base.generic}\`,
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
                        background: \`linear-gradient(90deg, \${theme.palette.error.main}, \${theme.palette.error.light})\`,
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
                                label={\`Авто: \${order.carBrand}\`} 
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
                                label={\`Фото: \${order.photoAssetIds.length}\`} 
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
                            <DetailRow
                                icon={<MapPinIcon />}
                                label="Адрес"
                                value={(order.provider as any).address}
                            />
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
                        border: \`1px dashed rgba(189, 9, 53, 0.3)\`
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
                        aria-label={\`Открыть чат по записи \${getServiceName(order)}\`}
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
                            href={\`tel:\${providerPhone}\`}
                            variant="outlined"
                            startIcon={<PhoneIcon />}
                            aria-label={\`Позвонить мастеру \${getProviderName(order)}\`}
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
`;
        code = code.substring(0, startIndex) + newBookingCard + code.substring(endIndex);
        fs.writeFileSync('src/screens/cabinet/Bookings/Bookings.tsx', code);
    } else {
        console.log("Could not find end of BookingCard");
    }
} else {
    console.log("Could not find start of BookingCard");
}
