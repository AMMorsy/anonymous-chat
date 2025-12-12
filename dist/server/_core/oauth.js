"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerOAuthRoutes = registerOAuthRoutes;
const const_1 = require("../../shared/const");
const db = __importStar(require("../db"));
const cookies_1 = require("./cookies");
const sdk_1 = require("./sdk");
function getQueryParam(req, key) {
    const value = req.query[key];
    return typeof value === "string" ? value : undefined;
}
function registerOAuthRoutes(app) {
    app.get("/api/oauth/callback", async (req, res) => {
        const code = getQueryParam(req, "code");
        const state = getQueryParam(req, "state");
        if (!code || !state) {
            res.status(400).json({ error: "code and state are required" });
            return;
        }
        try {
            const tokenResponse = await sdk_1.sdk.exchangeCodeForToken(code, state);
            const userInfo = await sdk_1.sdk.getUserInfo(tokenResponse.accessToken);
            if (!userInfo.openId) {
                res.status(400).json({ error: "openId missing from user info" });
                return;
            }
            await db.upsertUser({
                openId: userInfo.openId,
                name: userInfo.name || null,
                email: userInfo.email ?? null,
                loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
                lastSignedIn: new Date(),
            });
            const sessionToken = await sdk_1.sdk.createSessionToken(userInfo.openId, {
                name: userInfo.name || "",
                expiresInMs: const_1.ONE_YEAR_MS,
            });
            const cookieOptions = (0, cookies_1.getSessionCookieOptions)(req);
            res.cookie(const_1.COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: const_1.ONE_YEAR_MS });
            res.redirect(302, "/");
        }
        catch (error) {
            console.error("[OAuth] Callback failed", error);
            res.status(500).json({ error: "OAuth callback failed" });
        }
    });
}
