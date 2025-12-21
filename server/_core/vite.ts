import path from "path";
import express from "express";

export function serveStatic(app: express.Express) {
  const distPath = path.resolve(process.cwd(), "dist");

  app.use(express.static(distPath));

  app.get("*", (_, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}
