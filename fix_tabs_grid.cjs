const fs = require('fs');
let code = fs.readFileSync('src/screens/cabinet/Bookings/Bookings.tsx', 'utf8');

code = code.replace(
    /<Stack direction="row" spacing=\{1\} useFlexGap flexWrap="wrap">/,
    `<Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, max-content)" }, gap: 1 }}>`
);

code = code.replace(
    /alignItems: "center",\s*gap: 0\.8,/g,
    `alignItems: "center", justifyContent: "center", width: "100%", gap: 0.8,`
);

code = code.replace(
    /\{\/TAB_CONFIG\.map\}[^]*?<\/Stack>/, // Wait, I didn't write a comment, it's just TAB_CONFIG.map end.
    // Let's use string replace for the exact closing tag
    // The structure is:
    //                                     >
    //                                         {activeCount}
    //                                     </Box>
    //                                 </Box>
    //                             );
    //                         })}
    //                     </Stack>
    `</Stack>`
);

fs.writeFileSync('fix_tabs_grid.cjs', 'done');
