const fs = require('fs');
let code = fs.readFileSync('src/screens/main-page/MainpPageScreen.tsx', 'utf8');

code = code.replace(
`                                {selectedMobileProvider && (
                                    <MobileProviderPeekCard
                                        provider={selectedMobileProvider}
                                        onClose={() => setSelectedMobileProvider(null)}
                                    />
                                )}`,
`                                {selectedMobileProvider && (
                                    <MobileProviderPeekCard
                                        provider={selectedMobileProvider}
                                        onClose={() => setSelectedMobileProvider(null)}
                                        onDetailsClick={(provider) => setSelectedProviderForDetails(provider)}
                                    />
                                )}`
);

fs.writeFileSync('src/screens/main-page/MainpPageScreen.tsx', code);
