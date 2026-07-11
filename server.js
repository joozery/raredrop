// Custom Next.js server that also hosts a Socket.IO server for realtime features
// (e.g. the homepage "คำสั่งซื้อล่าสุด" live feed). Runs Next + Socket.IO in one
// Node process so route handlers can emit via globalThis.__io (see src/lib/realtime.ts).
//
// NOTE: this file does NOT go through the Next.js compiler — keep it plain CommonJS.
const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  // Socket.IO shares the HTTP server on its own path (/socket.io), so it does not
  // collide with Next's HMR websocket.
  const io = new Server(httpServer, {
    path: "/socket.io",
    cors: { origin: true, credentials: true },
  });

  io.on("connection", (socket) => {
    // Feed is public/read-only for now — clients just listen for "activity:new".
    socket.on("disconnect", () => {});
  });

  // Expose to Next route handlers running in this same process.
  globalThis.__io = io;

  httpServer.listen(port, () => {
    console.log(
      `> Ready on http://localhost:${port} (${dev ? "development" : "production"}) with Socket.IO`
    );
  });
});
