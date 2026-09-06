const fs = require('fs');
let code = fs.readFileSync('src/screens/main-page/MainpPageScreen.tsx', 'utf8');

const injection = `
    useEffect(() => {
        (window as any).handleProviderClick = (id: string, type: string) => {
            setSelectedProviderForDetails({ id, activityType: type } as any);
        };
        return () => {
            delete (window as any).handleProviderClick;
        };
    }, []);
`;

code = code.replace(
    /const \[selectedProviderForDetails, setSelectedProviderForDetails\] = useState<Provider \| null>\(null\);/g,
    `const [selectedProviderForDetails, setSelectedProviderForDetails] = useState<Provider | null>(null);${injection}`
);

fs.writeFileSync('src/screens/main-page/MainpPageScreen.tsx', code);
