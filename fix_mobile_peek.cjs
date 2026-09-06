const fs = require('fs');
let code = fs.readFileSync('src/screens/main-page/components/MobileProviderPeekCard.tsx', 'utf8');

code = code.replace(
`export type MobileProviderPeekCardProps = {
    provider: Provider;
    onClose: () => void;
};`,
`export type MobileProviderPeekCardProps = {
    provider: Provider;
    onClose: () => void;
    onDetailsClick?: (provider: Provider) => void;
};`
);

code = code.replace(
`export const MobileProviderPeekCard = ({
    provider,
    onClose,
}: MobileProviderPeekCardProps) => {`,
`export const MobileProviderPeekCard = ({
    provider,
    onClose,
    onDetailsClick,
}: MobileProviderPeekCardProps) => {`
);

code = code.replace(
`                {provider.onlineBookingEnabled ? (
                    <BookingLink to={detailsUrl}>
                        <CalendarIcon />
                        Записаться
                    </BookingLink>
                ) : (
                    <PrimaryLink to={detailsUrl}>Подробнее</PrimaryLink>
                )}`,
`                {provider.onlineBookingEnabled ? (
                    <BookingLink as="button" onClick={(e) => { e.preventDefault(); if (onDetailsClick) onDetailsClick(provider); else window.location.href = detailsUrl; }}>
                        <CalendarIcon />
                        Записаться
                    </BookingLink>
                ) : (
                    <PrimaryLink as="button" onClick={(e) => { e.preventDefault(); if (onDetailsClick) onDetailsClick(provider); else window.location.href = detailsUrl; }}>Подробнее</PrimaryLink>
                )}`
);

fs.writeFileSync('src/screens/main-page/components/MobileProviderPeekCard.tsx', code);
