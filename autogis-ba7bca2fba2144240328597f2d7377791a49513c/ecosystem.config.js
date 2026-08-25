module.exports = {
    apps: [
        {
            name: "backend",
            cwd: "./backend",
            script: "go",
            args: "run ./cmd/server",
            env: {
                NODE_ENV: "production",
            },
        },
        {
            name: "frontend",
            cwd: "./front",
            script: "npm",
            args: "run preview -- --port 5173",
            env: {
                NODE_ENV: "production",
            },
        },
    ],
};
