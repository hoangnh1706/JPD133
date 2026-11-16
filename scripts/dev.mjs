import { spawn } from 'node:child_process';

const backend = spawn(process.execPath, ['server/index.mjs'], { stdio: 'inherit', env: process.env });
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { stdio: 'inherit', env: process.env });
const stop = () => { backend.kill(); vite.kill(); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
backend.on('exit', code => { if (code) { vite.kill(); process.exitCode = code; } });
vite.on('exit', code => { backend.kill(); process.exitCode = code || 0; });
