import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
    appId: "com.example.myapp",
    appName: "My React App",
    webDir: "dist",

    server: {
        androidScheme: "https",
        cleartext: true, // Разрешить HTTP
        allowNavigation: ["*"], // Разрешить навигацию
    },
    android: {
        allowMixedContent: true, // Разрешить смешанный контент
    },
};

export default config;
