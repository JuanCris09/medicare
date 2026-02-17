import http from 'http';
import { URL } from 'url';
import { handler as sendEmail } from './api/send-email.js';
import { handler as sendTelegram } from './api/send-telegram.js';
import { handler as health } from './api/health.js';

const PORT = 5000;

const server = http.createServer(async (req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;

    console.log(`[API Server] ${req.method} ${path}`);

    // Helper to read body
    const getBody = (request) => new Promise((resolve) => {
        let body = '';
        request.on('data', chunk => body += chunk.toString());
        request.on('end', () => resolve(body));
    });

    // Mock Event for Lambda-style handlers
    const event = {
        httpMethod: req.method,
        path: path,
        headers: req.headers,
        body: await getBody(req)
    };

    let handler;
    if (path === '/api/send-email') handler = sendEmail;
    else if (path === '/api/send-telegram') handler = sendTelegram;
    else if (path === '/api/health') handler = health;

    if (handler) {
        try {
            const result = await handler(event);
            res.writeHead(result.statusCode, { 'Content-Type': 'application/json' });
            res.end(result.body);
        } catch (err) {
            console.error(err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error', details: err.message }));
        }
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Servidor API de Pruebas corriendo en http://localhost:${PORT}`);
    console.log(`Endpoints disponibles:`);
    console.log(`- POST http://localhost:${PORT}/api/send-email`);
    console.log(`- POST http://localhost:${PORT}/api/send-telegram`);
    console.log(`- GET  http://localhost:${PORT}/api/health`);
});
