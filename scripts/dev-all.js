import { spawn } from 'child_process';
import path from 'path';

console.log('🚀 Iniciando entorno MediCare (Vite + API Server)...');

// 1. Start API Server (Port 5000)
const apiServer = spawn('node', ['api-server.js'], {
    stdio: 'inherit',
    shell: true
});

// 2. Start Vite (Port 5173)
const viteServer = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
});

process.on('SIGINT', () => {
    apiServer.kill();
    viteServer.kill();
    process.exit();
});
