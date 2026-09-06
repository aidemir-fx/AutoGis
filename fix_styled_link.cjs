const fs = require('fs');
let code = fs.readFileSync('src/screens/main-page/components/MobileProviderPeekCard.tsx', 'utf8');

code = code.replace(
`const PrimaryLink = styled(Link)\``,
`const PrimaryLink = styled.button\``
);
code = code.replace(
`const BookingLink = styled(Link)\``,
`const BookingLink = styled.button\``
);

fs.writeFileSync('src/screens/main-page/components/MobileProviderPeekCard.tsx', code);
