const fs = require('fs');

// 1. Update Chats.tsx
let chatsCode = fs.readFileSync('src/screens/cabinet/Chats/Chats.tsx', 'utf8');

const hiddenStateCode = `
    const [hiddenChats, setHiddenChats] = useState<Record<string, "archived" | "deleted">>(() => {
        try {
            return JSON.parse(localStorage.getItem("hiddenChats") || "{}");
        } catch {
            return {};
        }
    });

    const handleChatAction = (orderId: string, action: "archive" | "unarchive" | "delete") => {
        const next = { ...hiddenChats };
        if (action === "delete") {
            next[orderId] = "deleted";
        } else if (action === "archive") {
            next[orderId] = "archived";
        } else {
            delete next[orderId];
        }
        setHiddenChats(next);
        localStorage.setItem("hiddenChats", JSON.stringify(next));
    };

    const [folder, setFolder] = useState<"active" | "archived">("active");
`;

chatsCode = chatsCode.replace(
    'const [view, setView] = useState<ChatView>("list");',
    'const [view, setView] = useState<ChatView>("list");\n' + hiddenStateCode
);

const activeOrdersCode = `    const allOrders = tab === "professional" ? (providerOrders ?? []) : (customerOrders ?? []);

    const activeOrders = useMemo(() => {
        return allOrders.filter((order) => {
            const status = hiddenChats[order.id];
            if (status === "deleted") return false;
            if (folder === "archived") return status === "archived";
            return status !== "archived";
        });
    }, [allOrders, hiddenChats, folder]);`;

chatsCode = chatsCode.replace(
    /const activeOrders = useMemo\(\(\) => \{[\s\S]*?\}, \[customerOrders, providerOrders, tab\]\);/,
    activeOrdersCode
);

chatsCode = chatsCode.replace(
    'const selectedOrder = activeOrders.find((item) => item.id === selectedOrderId) ?? null;',
    'const selectedOrder = allOrders.find((item) => item.id === selectedOrderId) ?? null;'
);

const listProps = `                        orders={activeOrders}
                        isLoading={isCustomerOrdersLoading || isProviderOrdersLoading}
                        profileId={profile.id}
                        folder={folder}
                        onChangeFolder={setFolder}
                        onChatAction={handleChatAction}`;

chatsCode = chatsCode.replace(
    /orders=\{activeOrders\}\n\s*isLoading=\{isCustomerOrdersLoading \|\| isProviderOrdersLoading\}\n\s*profileId=\{profile\.id\}/,
    listProps
);

fs.writeFileSync('src/screens/cabinet/Chats/Chats.tsx', chatsCode);

// 2. Update ChatList.tsx
let listCode = fs.readFileSync('src/modules/chats/components/ChatList.tsx', 'utf8');

if (!listCode.includes('ChatFolder')) {
    listCode = listCode.replace(
        'type ChatTab = "ordinary" | "professional";',
        'type ChatTab = "ordinary" | "professional";\ntype ChatFolder = "active" | "archived";'
    );
}

const listPropsInterface = `    orders: ChatOrder[];
    isLoading: boolean;
    profileId: string;
    folder: ChatFolder;
    onChangeFolder: (folder: ChatFolder) => void;
    onChatAction: (orderId: string, action: "archive" | "unarchive" | "delete") => void;`;

listCode = listCode.replace(
    /orders: ChatOrder\[\];\n\s*isLoading: boolean;\n\s*profileId: string;/,
    listPropsInterface
);

const folderTabsConst = `const FOLDER_TABS: { value: ChatFolder; label: string }[] = [
    { value: "active", label: "Активные" },
    { value: "archived", label: "Архив" },
];`;

listCode = listCode.replace(
    /const PILL_TABS: \{ value: ChatTab; label: string \}\[\] = \[[\s\S]*?\];/,
    `$& \n\n${folderTabsConst}`
);

const listDestructure = `        orders,
        isLoading,
        profileId,
        folder,
        onChangeFolder,
        onChatAction,`;

listCode = listCode.replace(
    /orders,\n\s*isLoading,\n\s*profileId,/,
    listDestructure
);

const folderTabsRender = `
            <Box
                sx={{
                    px: 2,
                    pt: hasProfessionalChatAccess ? 0.5 : 1.5,
                    pb: 1,
                    display: "flex",
                    gap: 1.5,
                    borderBottom: \`1px solid \${theme.palette.base.generic}\`,
                }}
            >
                {FOLDER_TABS.map((f) => (
                    <Box
                        key={f.value}
                        component="button"
                        onClick={() => onChangeFolder(f.value)}
                        sx={{
                            background: "none",
                            border: "none",
                            padding: "4px 0",
                            cursor: "pointer",
                            fontSize: 14,
                            fontWeight: folder === f.value ? 700 : 500,
                            color: folder === f.value ? theme.palette.actions.brand : theme.palette.text.secondary,
                            position: "relative",
                            "&::after": {
                                content: '""',
                                position: "absolute",
                                bottom: -1,
                                left: 0,
                                right: 0,
                                height: 2,
                                backgroundColor: folder === f.value ? theme.palette.actions.brand : "transparent",
                                borderRadius: "2px 2px 0 0",
                                transition: "background-color 0.2s",
                            }
                        }}
                    >
                        {f.label}
                    </Box>
                ))}
            </Box>
`;

listCode = listCode.replace(
    /(\{\s*hasProfessionalChatAccess && \([\s\S]*?\}\s*\)\s*\})/,
    `$1\n${folderTabsRender}`
);

const listItemRender = `                            <ChatListItem
                                key={order.id}
                                order={order}
                                profileId={profileId}
                                lastMessage={meta.lastMessage}
                                unreadCount={meta.unreadCount}
                                onOpen={onOpenChat}
                                formatRelativeTime={formatRelativeTime}
                                isArchived={folder === "archived"}
                                onAction={onChatAction}
                            />`;

listCode = listCode.replace(
    /<ChatListItem[\s\S]*?\/>/,
    listItemRender
);

fs.writeFileSync('src/modules/chats/components/ChatList.tsx', listCode);

// 3. Update ChatListItem.tsx
let itemCode = fs.readFileSync('src/modules/chats/components/ChatListItem.tsx', 'utf8');

if (!itemCode.includes('Menu, MenuItem, IconButton')) {
    itemCode = itemCode.replace(
        /import \{ Avatar, Badge, Box, Paper, Stack, Typography \} from "@mui\/material";/,
        'import { Avatar, Badge, Box, Paper, Stack, Typography, Menu, MenuItem, IconButton } from "@mui/material";\nimport { useState } from "react";\nimport MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";'
    );
}

const itemProps = `    onOpen: (orderId: string) => void;
    formatRelativeTime: (value: string) => string;
    isArchived: boolean;
    onAction: (orderId: string, action: "archive" | "unarchive" | "delete") => void;`;

itemCode = itemCode.replace(
    /onOpen: \(orderId: string\) => void;\n\s*formatRelativeTime: \(value: string\) => string;/,
    itemProps
);

const itemDestructure = `    const { order, profileId, lastMessage, unreadCount, onOpen, formatRelativeTime, isArchived, onAction } = props;`;

itemCode = itemCode.replace(
    /const \{ order, profileId, lastMessage, unreadCount, onOpen, formatRelativeTime \} = props;/,
    itemDestructure
);

const menuState = `    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = (event?: React.MouseEvent) => {
        if (event) event.stopPropagation();
        setAnchorEl(null);
    };

    const handleAction = (event: React.MouseEvent, action: "archive" | "unarchive" | "delete") => {
        event.stopPropagation();
        onAction(order.id, action);
        handleMenuClose();
    };`;

itemCode = itemCode.replace(
    '    const companion = getCompanion(order, profileId);',
    `${menuState}\n    const companion = getCompanion(order, profileId);`
);

const badgeAndMenu = `                    {unreadCount > 0 && (
                        <Badge
                            badgeContent={unreadCount}
                            sx={{
                                "& .MuiBadge-badge": {
                                    position: "static",
                                    transform: "none",
                                    minWidth: 20,
                                    height: 20,
                                    fontWeight: 700,
                                    fontSize: 11,
                                    background:
                                        "linear-gradient(135deg, #4a7cff 0%, #3b82f6 100%)",
                                    color: theme.palette.text.white,
                                    boxShadow: "none",
                                    padding: "0 6px",
                                },
                            }}
                        />
                    )}
                    <IconButton size="small" onClick={handleMenuOpen} sx={{ mt: 0.5, color: theme.palette.text.hint }}>
                        <MoreVertRoundedIcon fontSize="small" />
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        onClick={(e) => e.stopPropagation()}
                        PaperProps={{
                            elevation: 0,
                            sx: {
                                mt: 1,
                                borderRadius: "12px",
                                minWidth: 140,
                                border: \`1px solid \${theme.palette.base.generic}\`,
                                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                            }
                        }}
                    >
                        {isArchived ? (
                            <MenuItem onClick={(e) => handleAction(e, "unarchive")} sx={{ fontSize: 14, fontWeight: 500 }}>
                                Восстановить
                            </MenuItem>
                        ) : (
                            <MenuItem onClick={(e) => handleAction(e, "archive")} sx={{ fontSize: 14, fontWeight: 500 }}>
                                В архив
                            </MenuItem>
                        )}
                        <MenuItem onClick={(e) => handleAction(e, "delete")} sx={{ fontSize: 14, fontWeight: 500, color: theme.palette.error.heavy }}>
                            Удалить
                        </MenuItem>
                    </Menu>`;

itemCode = itemCode.replace(
    /\{\s*unreadCount > 0 && \([\s\S]*?\}\s*\)\s*\}/,
    badgeAndMenu
);

fs.writeFileSync('src/modules/chats/components/ChatListItem.tsx', itemCode);

