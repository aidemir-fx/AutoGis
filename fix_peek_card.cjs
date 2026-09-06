const fs = require('fs');
let code = fs.readFileSync('src/screens/main-page/MainpPageScreen.tsx', 'utf8');

// Move selectedMobileProvider rendering OUTSIDE MobileMapViewport
code = code.replace(
    /\{\s*selectedMobileProvider && \(\s*<MobileProviderPeekCard\s*provider=\{selectedMobileProvider\}\s*onClose=\{\(\) => setSelectedMobileProvider\(null\)\}\s*onDetailsClick=\{\(provider\) => setSelectedProviderForDetails\(provider\)\}\s*\/>\s*\)\s*\}\s*<\/MobileMapViewport>/,
    `</MobileMapViewport>
                            {selectedMobileProvider && (
                                <MobileProviderPeekCard
                                    provider={selectedMobileProvider}
                                    onClose={() => setSelectedMobileProvider(null)}
                                    onDetailsClick={(provider) => setSelectedProviderForDetails(provider)}
                                />
                            )}`
);

fs.writeFileSync('src/screens/main-page/MainpPageScreen.tsx', code);
