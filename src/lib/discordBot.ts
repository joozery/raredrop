import {
  Client,
  GatewayIntentBits,
  Events,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
  ButtonInteraction,
} from "discord.js";
import { connectToDatabase } from "@/lib/mongoose";
import Inventory from "@/models/Inventory";
import { notify } from "@/lib/notify";

const TICKET_CLAIM_PREFIX = "ticket_claim:";
const TICKET_CLOSE_PREFIX = "ticket_close:";

interface DeliveryTicketFields {
  inventoryId: string;
  ref: string;
  itemName: string;
  itemSku?: string;
  value?: number;
  rarity?: string;
  boxName?: string;
  customerName: string;
  customerContact?: string;
  uid?: string;
  ign?: string;
  imageUrl?: string;
}

interface DiscordBotCache {
  promise: Promise<Client> | null;
  listenerAttached: boolean;
}

const cached: DiscordBotCache = (global as any).__discordBot || { promise: null, listenerAttached: false };
(global as any).__discordBot = cached;

function buildTicketEmbed(fields: DeliveryTicketFields, claimedBy?: string): EmbedBuilder {
  const lines = [
    `**สินค้า:** ${fields.itemName}`,
    fields.itemSku ? `**เลขสินค้า (SKU):** \`${fields.itemSku}\`` : null,
    fields.value != null ? `**มูลค่า:** ฿${fields.value.toLocaleString()}` : null,
    fields.rarity ? `**ระดับ:** ${fields.rarity}` : null,
    fields.boxName ? `**จากกล่อง:** ${fields.boxName}` : null,
    `**ลูกค้า:** ${fields.customerName}`,
    fields.uid ? `**UID:** \`${fields.uid}\`` : null,
    fields.ign ? `**ชื่อในเกม (IGN):** ${fields.ign}` : null,
    fields.customerContact ? `**ติดต่อ:** ${fields.customerContact}` : null,
    `**Ref:** \`${fields.ref}\``,
  ].filter(Boolean) as string[];

  const validImage = fields.imageUrl && /^https?:\/\//i.test(fields.imageUrl) ? fields.imageUrl : undefined;

  const embed = new EmbedBuilder()
    .setTitle("🎫 คำขอรับของจริง (Delivery Ticket)")
    .setDescription(lines.join("\n"))
    .setColor(0xef4444);

  if (validImage) embed.setThumbnail(validImage);
  if (claimedBy) embed.addFields({ name: "รับงานโดย", value: claimedBy });

  return embed;
}

function buildTicketRow(inventoryId: string, claimDisabled: boolean): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${TICKET_CLAIM_PREFIX}${inventoryId}`)
      .setLabel("รับงาน")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(claimDisabled),
    new ButtonBuilder()
      .setCustomId(`${TICKET_CLOSE_PREFIX}${inventoryId}`)
      .setLabel("ปิด Ticket")
      .setStyle(ButtonStyle.Danger),
  );
}

async function handleClaim(interaction: ButtonInteraction, inventoryId: string) {
  await connectToDatabase();
  const claimedBy = `${interaction.user.username} (${interaction.user.id})`;

  const updated = await Inventory.findOneAndUpdate(
    { _id: inventoryId, ticketStatus: "open" },
    { $set: { ticketStatus: "claimed", claimedBy, claimedAt: new Date() } },
  );

  if (!updated) {
    const current = await Inventory.findById(inventoryId).select("ticketStatus claimedBy");
    const msg =
      current?.ticketStatus === "closed"
        ? "Ticket นี้ถูกปิดไปแล้ว"
        : `Ticket นี้ถูกรับงานไปแล้วโดย ${current?.claimedBy ?? "คนอื่น"}`;
    await interaction.reply({ content: msg, ephemeral: true });
    return;
  }

  await interaction.deferUpdate();

  const embed = EmbedBuilder.from(interaction.message.embeds[0]).addFields({ name: "รับงานโดย", value: claimedBy });
  await interaction.editReply({ embeds: [embed], components: [buildTicketRow(inventoryId, true)] });

  await notify(
    String(updated.userId),
    "ทีมงานกำลังดูแลคำขอของคุณ 👀",
    "ทีมงานรับเรื่องคำขอรับของจริงของคุณแล้ว กรุณารอการติดต่อกลับผ่าน Discord",
    "info",
  );
}

async function handleClose(interaction: ButtonInteraction, inventoryId: string) {
  await connectToDatabase();

  const updated = await Inventory.findOneAndUpdate(
    { _id: inventoryId, ticketStatus: { $ne: "closed" } },
    { $set: { ticketStatus: "closed", closedAt: new Date() } },
  );

  if (!updated) {
    await interaction.reply({ content: "Ticket นี้ถูกปิดไปแล้ว", ephemeral: true });
    return;
  }

  await interaction.deferUpdate();

  await notify(
    String(updated.userId),
    "ปิดคำขอรับของจริงแล้ว 📦",
    "ทีมงานปิดคำขอรับของจริงของคุณแล้ว หากมีข้อสงสัยติดต่อทีมงานผ่าน Discord ได้เลย",
    "info",
  );

  if (interaction.channel?.isThread()) {
    await interaction.channel.delete().catch((err: unknown) => console.error("[discord-bot] ลบ thread ล้มเหลว:", err));
  }
}

async function handleInteraction(interaction: any) {
  if (!interaction.isButton()) return;
  const customId: string = interaction.customId;

  try {
    if (customId.startsWith(TICKET_CLAIM_PREFIX)) {
      await handleClaim(interaction, customId.slice(TICKET_CLAIM_PREFIX.length));
    } else if (customId.startsWith(TICKET_CLOSE_PREFIX)) {
      await handleClose(interaction, customId.slice(TICKET_CLOSE_PREFIX.length));
    }
  } catch (err) {
    console.error("[discord-bot] interaction ล้มเหลว:", err);
  }
}

export async function initDiscordBot(): Promise<Client> {
  if (cached.promise) return cached.promise;

  cached.promise = (async () => {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) throw new Error("DISCORD_BOT_TOKEN ไม่ได้ตั้งค่า");

    const client = new Client({ intents: [GatewayIntentBits.Guilds] });

    if (!cached.listenerAttached) {
      cached.listenerAttached = true;
      client.on(Events.InteractionCreate, handleInteraction);
    }

    await client.login(token);
    if (!client.isReady()) {
      await new Promise<void>((resolve) => client.once(Events.ClientReady, () => resolve()));
    }

    console.log("[discord-bot] เชื่อมต่อสำเร็จ:", client.user?.tag);
    return client;
  })().catch((err) => {
    cached.promise = null;
    throw err;
  });

  return cached.promise;
}

export async function createDeliveryTicket(
  fields: DeliveryTicketFields,
): Promise<{ threadId: string; threadUrl: string } | null> {
  try {
    const client = await initDiscordBot();
    const guildId = process.env.DISCORD_GUILD_ID;
    const channelId = process.env.DISCORD_TICKET_CHANNEL_ID;
    if (!guildId || !channelId) {
      console.warn("[discord-bot] DISCORD_GUILD_ID หรือ DISCORD_TICKET_CHANNEL_ID ไม่ได้ตั้งค่า");
      return null;
    }

    const channel = await client.channels.fetch(channelId);
    if (!channel || channel.type !== ChannelType.GuildText) {
      console.warn("[discord-bot] ห้อง ticket ไม่ใช่ text channel หรือไม่พบ");
      return null;
    }

    const threadName = `🎫 ${fields.ref} · ${fields.itemName}`.slice(0, 100);
    const thread = await (channel as TextChannel).threads.create({
      name: threadName,
      type: ChannelType.PrivateThread,
      reason: "Delivery ticket",
    });

    await thread.send({
      embeds: [buildTicketEmbed(fields)],
      components: [buildTicketRow(fields.inventoryId, false)],
    });

    return { threadId: thread.id, threadUrl: `https://discord.com/channels/${guildId}/${thread.id}` };
  } catch (err) {
    console.error("[discord-bot] สร้าง ticket ล้มเหลว:", err);
    return null;
  }
}
