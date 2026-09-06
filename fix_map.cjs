const fs = require('fs');
let code = fs.readFileSync('src/modules/providers/features/ProvidersMap/ProvidersMap.tsx', 'utf8');

code = code.replace(
`function getDetailsHref(provider: Provider): string {
    return \`/provider?id=\${provider.id}&type=\${getProviderType(provider)}\`;
}`,
`function getDetailsHref(provider: Provider): string {
    return \`javascript:window.handleProviderClick('\${provider.id}', '\${getProviderType(provider)}')\`;
}`
);

fs.writeFileSync('src/modules/providers/features/ProvidersMap/ProvidersMap.tsx', code);
