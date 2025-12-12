// Temporary stub storage system for backend (file uploads, images, etc.)

import fs from "fs";
import path from "path";

export async function storagePut(filename: string, data: Buffer | string): Promise<string> {
  const outputDir = path.join(process.cwd(), "storage");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, data);

  return filepath; // Return local path
}
