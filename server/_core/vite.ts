import express from "express";
import http from "http";

// Stub for dev-only Vite integration – not used in production
export async function setupVite(app: express.Express, server: http.Server) {
  return;
}

export function serveStatic(app: express.Express) {
  return;
}
