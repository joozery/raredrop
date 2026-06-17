import Notification from "@/models/Notification";

export async function notify(
  userId: string,
  title: string,
  message: string,
  type: "info" | "success" | "warning" = "info",
  link?: string
) {
  try {
    await Notification.create({ userId, title, message, type, link });
  } catch {}
}
