const fs = require('fs');
let code = fs.readFileSync('src/screens/main-page/MainpPageScreen.tsx', 'utf8');

// There seem to be multiple copies now because of the sed replacement failing or multiplying
const regex = /const \[selectedProviderForDetails, setSelectedProviderForDetails\] = useState<Provider \| null>\(null\);\s*(?:useEffect\(\(\) => \{\s*\(window as any\)\.handleProviderClick = \(id: string, type: string\) => \{\s*setSelectedProviderForDetails\(\{ id, activityType: type \} as any\);\s*\};\s*return \(\) => \{\s*delete \(window as any\)\.handleProviderClick;\s*\};\s*\}, \[\]\);\s*)+/gm;

const replaceWith = `const [selectedProviderForDetails, setSelectedProviderForDetails] = useState<Provider | null>(null);

    useEffect(() => {
        (window as any).handleProviderClick = (id: string, type: string) => {
            setSelectedProviderForDetails({ id, activityType: type } as any);
        };
        return () => {
            delete (window as any).handleProviderClick;
        };
    }, []);
`;

code = code.replace(regex, replaceWith);

fs.writeFileSync('src/screens/main-page/MainpPageScreen.tsx', code);
