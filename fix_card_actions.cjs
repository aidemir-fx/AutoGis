const fs = require('fs');
let code = fs.readFileSync('src/modules/providers/features/ProviderShowcaseCard/ProviderShowcaseCard.tsx', 'utf8');

code = code.replace(
`function CardActions({ provider }: { provider: Provider }) {`,
`function CardActions({ provider, onDetailsClick }: { provider: Provider; onDetailsClick?: (provider: Provider) => void }) {`
);

code = code.replace(
`                <ActionLink href={getDetailsHref(provider)} $variant="booking">`,
`                <ActionLink as="button" onClick={(e) => { e.preventDefault(); if (onDetailsClick) onDetailsClick(provider); else window.location.href = getDetailsHref(provider); }} $variant="booking">`
);

code = code.replace(
`            <ActionLink href={getDetailsHref(provider)} $variant="outline">`,
`            <ActionLink as="button" onClick={(e) => { e.preventDefault(); if (onDetailsClick) onDetailsClick(provider); else window.location.href = getDetailsHref(provider); }} $variant="outline">`
);

code = code.replace(
`                <CardActions provider={provider} />`,
`                <CardActions provider={provider} onDetailsClick={onDetailsClick} />`
);
code = code.replace(
`                <CardActions provider={provider} />`,
`                <CardActions provider={provider} onDetailsClick={onDetailsClick} />`
);

code = code.replace(
`function MasterCard({
    provider,
    onShowOnMap,
}: ProviderShowcaseCardProps) {`,
`function MasterCard({
    provider,
    onShowOnMap,
    onDetailsClick,
}: ProviderShowcaseCardProps) {`
);

code = code.replace(
`function OrganizationCard({
    provider,
    onShowOnMap,
}: ProviderShowcaseCardProps) {`,
`function OrganizationCard({
    provider,
    onShowOnMap,
    onDetailsClick,
}: ProviderShowcaseCardProps) {`
);

code = code.replace(
`export const ProviderShowcaseCard = ({
    provider,
    className,
    onShowOnMap,
}: ProviderShowcaseCardProps) => {`,
`export const ProviderShowcaseCard = ({
    provider,
    className,
    onShowOnMap,
    onDetailsClick,
}: ProviderShowcaseCardProps) => {`
);

code = code.replace(
`                <MasterCard provider={provider} onShowOnMap={onShowOnMap} />`,
`                <MasterCard provider={provider} onShowOnMap={onShowOnMap} onDetailsClick={onDetailsClick} />`
);

code = code.replace(
`                <OrganizationCard
                    provider={provider}
                    onShowOnMap={onShowOnMap}
                />`,
`                <OrganizationCard
                    provider={provider}
                    onShowOnMap={onShowOnMap}
                    onDetailsClick={onDetailsClick}
                />`
);


fs.writeFileSync('src/modules/providers/features/ProviderShowcaseCard/ProviderShowcaseCard.tsx', code);
