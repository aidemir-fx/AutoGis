const fs = require('fs');
let code = fs.readFileSync('src/screens/master-details/MasterDetails.tsx', 'utf8');

code = code.replace(
`    if (isLoading) {
        return (
            <AuthLayout title={title}>
                <div>Загрузка...</div>
            </AuthLayout>
        );
    }`,
`    if (isLoading) {
        return isModal ? (
            <Container style={{ padding: 24, textAlign: 'center' }}>
                <div>Загрузка...</div>
            </Container>
        ) : (
            <AuthLayout title={title}>
                <div>Загрузка...</div>
            </AuthLayout>
        );
    }`
);

code = code.replace(
`    if (error || !provider) {
        return (
            <AuthLayout title={title}>
                <div>Ошибка загрузки профиля</div>
            </AuthLayout>
        );
    }`,
`    if (error || !provider) {
        return isModal ? (
            <Container style={{ padding: 24, textAlign: 'center' }}>
                <div>Ошибка загрузки профиля</div>
            </Container>
        ) : (
            <AuthLayout title={title}>
                <div>Ошибка загрузки профиля</div>
            </AuthLayout>
        );
    }`
);

fs.writeFileSync('src/screens/master-details/MasterDetails.tsx', code);
