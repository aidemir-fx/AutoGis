const fs = require('fs');
let code = fs.readFileSync('src/screens/master-details/MasterDetails.tsx', 'utf8');

code = code.replace(
`    if (isLoading) {
        const content = (
            <AuthLayout title={title}>
                <div>Загрузка...</div>
            </AuthLayout>
        );
    }`,
`    if (isLoading) {
        return (
            <AuthLayout title={title}>
                <div>Загрузка...</div>
            </AuthLayout>
        );
    }`
);

code = code.replace(
`    if (error || !provider) {
        const content = (
            <AuthLayout title={title}>
                <div>Ошибка загрузки профиля</div>
            </AuthLayout>
        );
    }`,
`    if (error || !provider) {
        return (
            <AuthLayout title={title}>
                <div>Ошибка загрузки профиля</div>
            </AuthLayout>
        );
    }`
);

code = code.replace(
`    const content = (
        <AuthLayout title={title}>
            <Container>`,
`    const content = (
            <Container>`
);

code = code.replace(
`            </Container>
        </AuthLayout>
    );
};`,
`            </Container>
    );

    if (isModal) {
        return content;
    }
    return (
        <AuthLayout title={title}>
            {content}
        </AuthLayout>
    );
};`
);

fs.writeFileSync('src/screens/master-details/MasterDetails.tsx', code);
