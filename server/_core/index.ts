import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

import { appRouter } from "../routers";
import { createContext } from "./context";
import { registerOAuthRoutes } from "./oauth";
import { setupSocketIO } from "../socket";

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));


const CLIENT_DIR = path.join(process.cwd(), "client");

app.use(express.static(CLIENT_DIR));

  // OAuth
  registerOAuthRoutes(app);

  // tRPC
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Socket.IO
  setupSocketIO(server);

  // Frontend (STATIC)
  const clientPath = path.join(process.cwd(), "client");
  app.use(express.static(clientPath));

  app.get("*", (_, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });

app.get("*", (_, res) => {
  res.sendFile(path.join(CLIENT_DIR, "index.html"));
});

  const port = Number(process.env.PORT) || 3000;
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer().catch(console.error);
