const fs = require('fs');

let itemCode = fs.readFileSync('src/modules/chats/components/ChatListItem.tsx', 'utf8');

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
                                    background: theme.palette.actions.brand,
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

itemCode = itemCode.replace(/\{\s*unreadCount > 0 && \([\s\S]*?\}\s*\)\s*\}/m, badgeAndMenu);

fs.writeFileSync('src/modules/chats/components/ChatListItem.tsx', itemCode);
