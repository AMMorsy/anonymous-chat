"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const path_1 = __importDefault(require("path"));
const express_2 = require("@trpc/server/adapters/express");
const routers_1 = require("../routers");
const context_1 = require("./context");
const oauth_1 = require("./oauth");
const socket_1 = require("../socket");
async function startServer() {
    const app = (0, express_1.default)();
    const server = (0, http_1.createServer)(app);
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    const CLIENT_DIR = path_1.default.join(process.cwd(), "client");
    app.use(express_1.default.static(CLIENT_DIR));
    // OAuth
    (0, oauth_1.registerOAuthRoutes)(app);
    // tRPC
    app.use("/api/trpc", (0, express_2.createExpressMiddleware)({
        router: routers_1.appRouter,
        createContext: context_1.createContext,
    }));
    // Socket.IO
    (0, socket_1.setupSocketIO)(server);
    // Frontend (STATIC)
    const clientPath = path_1.default.join(process.cwd(), "client");
    app.use(express_1.default.static(clientPath));
    app.get("*", (_, res) => {
        res.sendFile(path_1.default.join(clientPath, "index.html"));
    });
    app.get("*", (_, res) => {
        res.sendFile(path_1.default.join(CLIENT_DIR, "index.html"));
    });
    const port = Number(process.env.PORT) || 3000;
    server.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}
startServer().catch(console.error);
