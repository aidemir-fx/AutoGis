const fs = require('fs');

let code = fs.readFileSync('src/modules/chats/components/ChatList.tsx', 'utf8');

// I need to pull out the FOLDER_TABS box from inside the hasProfessionalChatAccess block.
// Currently it looks like:
//             {hasProfessionalChatAccess && (
//                 <Box ...>
//                     {PILL_TABS...}
//             <Box ... FOLDER_TABS ...>
//                 </Box>
//             )}

// Let's replace the block structurally.

const regex = /\{\s*PILL_TABS\.map\(\(pill\) => \{[\s\S]*?\}\)\}\s*(<Box[\s\S]*?\{FOLDER_TABS\.map\(\(f\) => \([\s\S]*?\}\)\}\s*<\/Box>)\s*<\/Box>\s*\)\}/m;

const match = code.match(regex);
if (match) {
    const newBlock = `
                    {PILL_TABS.map((pill) => {
                        const isActive = tab === pill.value;
                        return (
                            <Box
                                key={pill.value}
                                component="button"
                                onClick={() => onChangeTab(pill.value)}
                                sx={{
                                    padding: "8px 14px",
                                    borderRadius: "999px",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    whiteSpace: "nowrap",
                                    fontFamily: "inherit",
                                    transition: "all .18s ease",
                                    ...(isActive
                                        ? {
                                              background:
                                                  "linear-gradient(135deg, #4a7cff 0%, #3b82f6 100%)",
                                              color: "#ffffff",
                                              boxShadow:
                                                  "0 6px 14px -4px rgba(59,130,246,0.45)",
                                          }
                                        : {
                                              backgroundColor: theme.palette.white,
                                              color: theme.palette.text.secondary,
                                              boxShadow:
                                                  "0 1px 2px rgba(0,0,0,0.03)",
                                          }),
                                }}
                            >
                                {pill.label}
                            </Box>
                        );
                    })}
                </Box>
            )}
${match[1]}
`;
    
    code = code.replace(regex, newBlock);
    fs.writeFileSync('src/modules/chats/components/ChatList.tsx', code);
    console.log("Fixed successfully.");
} else {
    console.log("Regex not matched.");
}
