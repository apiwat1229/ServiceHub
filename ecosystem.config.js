module.exports = {
    apps: [
        {
            name: 'nestjs-api',
            script: 'npm',
            args: 'run start:prod --workspace=apps/api',
            env: {
                API_PORT: 2530,
                NODE_ENV: 'production',
            },
        },
    ],
};
