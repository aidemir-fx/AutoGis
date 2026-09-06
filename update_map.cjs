const fs = require('fs');
let code = fs.readFileSync('src/screens/main-page/MainpPageScreen.tsx', 'utf8');

code = code.replace(
    /<ProvidersMap\s+masters=\{displayedAllProviders\}\s+mastersRef=\{mastersRef\}\s+mapInstanceRef=\{yandexMapRef\}\s+isLoading=\{isLoading\}\s+height="100%"\s*\/>/g,
    `<ProvidersMap
        masters={displayedAllProviders}
        mastersRef={mastersRef}
        mapInstanceRef={yandexMapRef}
        isLoading={isLoading}
        height="100%"
        onSelectMaster={(provider) => {
            if (isMobile) {
                setSelectedMobileProvider(provider);
            }
        }}
    />`
);

fs.writeFileSync('src/screens/main-page/MainpPageScreen.tsx', code);
