"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const net_1 = __importDefault(require("net"));
const path_1 = __importDefault(require("path"));
const express_2 = require("@trpc/server/adapters/express");
const oauth_1 = require("./oauth");
const routers_1 = require("../routers");
const context_1 = require("./context");
const vite_1 = require("./vite");
const socket_1 = require("../socket");
function isPortAvailable(port) {
    return new Promise(resolve => {
        const server = net_1.default.createServer();
        server.listen(port, () => {
            server.close(() => resolve(true));
        });
        server.on("error", () => resolve(false));
    });
}
async function findAvailablePort(startPort = 3000) {
    for (let port = startPort; port < startPort + 20; port++) {
        if (await isPortAvailable(port)) {
            return port;
        }
    }
    throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
    const app = (0, express_1.default)();
    const server = (0, http_1.createServer)(app);
    app.use(express_1.default.json({ limit: "50mb" }));
    app.use(express_1.default.urlencoded({ limit: "50mb", extended: true }));
    (0, oauth_1.registerOAuthRoutes)(app);
    app.use("/api/trpc", (0, express_2.createExpressMiddleware)({
        router: routers_1.appRouter,
        createContext: context_1.createContext,
    }));
    (0, socket_1.setupSocketIO)(server);
    if (process.env.NODE_ENV === "development") {
        await (0, vite_1.setupVite)(app, server);
    }
    else {
        // ✅ SERVE FRONTEND BUILD
        const clientDist = path_1.default.resolve(__dirname, "../../../../client/dist");
        app.use(express_1.default.static(clientDist));
        app.get("*", (_req, res) => {
            res.sendFile(path_1.default.join(clientDist, "index.html"));
        });
    }
    const preferredPort = parseInt(process.env.PORT || "3000");
    const port = await findAvailablePort(preferredPort);
    server.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}
startServer().catch(console.error);
