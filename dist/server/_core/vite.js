"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupVite = setupVite;
exports.serveStatic = serveStatic;
// Stub for dev-only Vite integration – not used in production
async function setupVite(app, server) {
    return;
}
function serveStatic(app) {
    return;
}
