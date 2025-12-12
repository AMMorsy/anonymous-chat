"use strict";
// Temporary stub storage system for backend (file uploads, images, etc.)
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storagePut = storagePut;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function storagePut(filename, data) {
    const outputDir = path_1.default.join(process.cwd(), "storage");
    if (!fs_1.default.existsSync(outputDir)) {
        fs_1.default.mkdirSync(outputDir, { recursive: true });
    }
    const filepath = path_1.default.join(outputDir, filename);
    fs_1.default.writeFileSync(filepath, data);
    return filepath; // Return local path
}
