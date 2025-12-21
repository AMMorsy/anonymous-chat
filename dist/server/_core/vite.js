"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serveStatic = serveStatic;
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
function serveStatic(app) {
    const distPath = path_1.default.resolve(process.cwd(), "dist");
    app.use(express_1.default.static(distPath));
    app.get("*", (_, res) => {
        res.sendFile(path_1.default.join(distPath, "index.html"));
    });
}
