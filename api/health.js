export const handler = async (event) => {
    return {
        statusCode: 200,
        body: JSON.stringify({
            status: 'ok',
            time: new Date().toISOString(),
            platform: 'custom-dev-server'
        })
    };
};
