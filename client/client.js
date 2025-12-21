/* =========================================================
   Anon Chat Frontend (DEV)
   - Self-contained: creates UI if missing
   - Commands:
     /help
     /create <room_name>
     /join <room_id>
     /leave
   - Anything else => send message (after join)
========================================================= */

/* =========================================================
   Anon Chat Frontend (DEV)
========================================================= */

/* =========================================================
   Anon Chat Frontend (DEV)
   Terminal-style client
========================================================= */

(function () {
  // HARD GUARD — prevent double execution
  if (window.__ANON_CHAT_CLIENT__) return;
  window.__ANON_CHAT_CLIENT__ = true;

  // ---------- DOM ----------
  const log = document.getElementById("log");
  const input = document.getElementById("input");

  function print(text, cls = "") {
    const line = document.createElement("div");
    line.textContent = text;
    if (cls) line.className = cls;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
  }

  // ---------- Socket ----------
  if (typeof io === "undefined") {
    print("[SYSTEM] Socket.IO not loaded", "err");
    return;
  }

  let joinedRoom = null;

  const socket = io({
    path: "/socket.io/",
    transports: ["websocket"],
  });

  // Backend controls ALL system output
  socket.on("system", (msg) => {
    if (typeof msg === "string") {
      print(msg);
    }
  });

  socket.on("message", (msg) => {
    print(msg);
  });

  socket.on("disconnect", () => {
    joinedRoom = null;
    print("[SYSTEM] Disconnected", "err");
  });

  socket.on("error", (e) => {
    print("[SYSTEM] ERROR: " + (e?.message || e), "err");
  });

  // ---------- Input ----------
  input.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;

    const value = input.value.trim();
    input.value = "";
    if (!value) return;

    // Commands go RAW to backend
    if (value.startsWith("/")) {
      socket.emit("command", value);
      return;
    }

    // Messages
    socket.emit("message", value);
  });

  input.focus();
})();
