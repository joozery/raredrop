export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initDiscordBot } = await import("@/lib/discordBot");
    await initDiscordBot();
  }
}
