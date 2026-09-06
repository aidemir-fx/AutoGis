const fs = require('fs');
let code = fs.readFileSync('src/modules/providers/features/ProviderShowcaseCard/ProviderShowcaseCard.tsx', 'utf8');

code = code.replace(
`type ProviderShowcaseCardProps = {
    provider: Provider;
    className?: string;
    onShowOnMap?: (provider: Provider) => void;
};`,
`type ProviderShowcaseCardProps = {
    provider: Provider;
    className?: string;
    onShowOnMap?: (provider: Provider) => void;
    onDetailsClick?: (provider: Provider) => void;
};
function getDetailsHref(provider: Provider): string {
    return \`/provider?id=\${provider.id}&type=\${provider.activityType}\`;
}`
);

fs.writeFileSync('src/modules/providers/features/ProviderShowcaseCard/ProviderShowcaseCard.tsx', code);
