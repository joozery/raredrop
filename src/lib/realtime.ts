// Emit realtime events from Next route handlers to Socket.IO clients.
// The Socket.IO server instance is created in server.js and stored on globalThis.__io.
// This is a best-effort no-op if the socket server isn't available (e.g. during build
// or if the app is ever run without the custom server) — realtime is an enhancement,
// never a hard dependency of the request succeeding.

export interface RecentActivityPayload {
  _id: string;
  userName: string;
  userAvatar?: string;
  title: string;
  image?: string;
  price: number;
  kind: "shop" | "box" | "card";
  createdAt: string;
}

export function emitRecentActivity(activity: RecentActivityPayload) {
  try {
    const io = (globalThis as any).__io;
    if (io) io.emit("activity:new", activity);
  } catch (err) {
    console.error("emitRecentActivity failed:", err);
  }
}
