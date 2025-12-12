"use strict";
/**
 * Image generation helper using internal ImageService
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateImage = generateImage;
const storage_1 = require("server/storage");
const env_1 = require("./env");
async function generateImage(options) {
    if (!env_1.ENV.forgeApiUrl) {
        throw new Error("BUILT_IN_FORGE_API_URL is not configured");
    }
    if (!env_1.ENV.forgeApiKey) {
        throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
    }
    const baseUrl = env_1.ENV.forgeApiUrl.endsWith("/")
        ? env_1.ENV.forgeApiUrl
        : `${env_1.ENV.forgeApiUrl}/`;
    const fullUrl = new URL("images.v1.ImageService/GenerateImage", baseUrl).toString();
    const response = await fetch(fullUrl, {
        method: "POST",
        headers: {
            accept: "application/json",
            "content-type": "application/json",
            "connect-protocol-version": "1",
            authorization: `Bearer ${env_1.ENV.forgeApiKey}`,
        },
        body: JSON.stringify({
            prompt: options.prompt,
            original_images: options.originalImages || [],
        }),
    });
    if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(`Image generation failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`);
    }
    // Extract base64 image
    const result = (await response.json());
    const base64Data = result.image.b64Json;
    const buffer = Buffer.from(base64Data, "base64");
    // Generate a filename
    const filename = `image_${Date.now()}.png`;
    // Save to storage (correct param order)
    const storedPath = await (0, storage_1.storagePut)(filename, buffer);
    // Return URL/path
    return { url: storedPath };
}
