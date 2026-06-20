async function postDiscordWebhook(url: string, payload: object): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error("[discord] webhook ตอบกลับไม่ ok:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[discord] ส่ง webhook ล้มเหลว:", err);
    return false;
  }
}

// Phase 2 — บรอดแคสต์แจ้งสินค้าใหม่ / อัปเดตสต็อก เข้าห้องประกาศ Discord
// ใช้ webhook คนละตัวกับ ticket (DISCORD_BROADCAST_WEBHOOK_URL) เพื่อแยกห้องแจ้งทีมงานกับห้องประกาศลูกค้า

type ProductType = "item" | "shop";

const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  item: "กล่องสุ่ม",
  shop: "ร้านค้า",
};

interface NewProductFields {
  name: string;
  price: number;
  image?: string;
  productType: ProductType;
  stock?: number;
  unlimitedStock?: boolean;
}

/**
 * แจ้งเตือนสินค้าใหม่เข้าห้องประกาศ Discord
 */
export async function sendDiscordNewProductBroadcast(fields: NewProductFields): Promise<boolean> {
  const url = process.env.DISCORD_BROADCAST_WEBHOOK_URL;
  if (!url) {
    console.warn("[discord] DISCORD_BROADCAST_WEBHOOK_URL ไม่ได้ตั้งค่า — ข้ามการ broadcast");
    return false;
  }

  const lines = [
    `**ราคา:** ฿${fields.price.toLocaleString()}`,
    `**ประเภท:** ${PRODUCT_TYPE_LABEL[fields.productType]}`,
    fields.unlimitedStock
      ? `**สต็อก:** ไม่จำกัด`
      : fields.stock != null
        ? `**สต็อก:** ${fields.stock}`
        : null,
  ].filter(Boolean);

  const validImage = fields.image && /^https?:\/\//i.test(fields.image) ? fields.image : undefined;

  const payload = {
    username: "LUXUSX",
    embeds: [
      {
        title: `🆕 สินค้าใหม่: ${fields.name}`,
        description: lines.join("\n"),
        color: 0x22c55e,
        ...(validImage ? { thumbnail: { url: validImage } } : {}),
      },
    ],
  };

  return postDiscordWebhook(url, payload);
}

interface StockUpdateFields {
  name: string;
  newStock: number;
  addedQty?: number;
  image?: string;
  productType: ProductType;
}

/**
 * แจ้งเตือนอัปเดตสต็อกเข้าห้องประกาศ Discord
 */
export async function sendDiscordStockUpdateBroadcast(fields: StockUpdateFields): Promise<boolean> {
  const url = process.env.DISCORD_BROADCAST_WEBHOOK_URL;
  if (!url) {
    console.warn("[discord] DISCORD_BROADCAST_WEBHOOK_URL ไม่ได้ตั้งค่า — ข้ามการ broadcast");
    return false;
  }

  const lines = [
    fields.addedQty ? `**เพิ่มเข้ามา:** +${fields.addedQty}` : null,
    `**สต็อกปัจจุบัน:** ${fields.newStock}`,
    `**ประเภท:** ${PRODUCT_TYPE_LABEL[fields.productType]}`,
  ].filter(Boolean);

  const validImage = fields.image && /^https?:\/\//i.test(fields.image) ? fields.image : undefined;

  const payload = {
    username: "LUXUSX",
    embeds: [
      {
        title: `📦 อัปเดตสต็อก: ${fields.name}`,
        description: lines.join("\n"),
        color: 0x3b82f6,
        ...(validImage ? { thumbnail: { url: validImage } } : {}),
      },
    ],
  };

  return postDiscordWebhook(url, payload);
}
