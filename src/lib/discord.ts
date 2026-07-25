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

interface InstallmentBillFields {
  billId: string;
  productCode: string;
  totalPrice: number;
  downAmount: number;
  planType: string;
  planCount: number;
  amountPerInstallment: number;
  paidViaWallet?: boolean;
}

const PLAN_NAME_TH: Record<string, string> = {
  daily: "รายวัน", weekly: "รายสัปดาห์", monthly: "รายเดือน",
};

/**
 * แจ้งเตือนแอดมินเมื่อมีบิลผ่อนชำระใหม่
 */
export async function sendDiscordInstallmentNotification(fields: InstallmentBillFields): Promise<boolean> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return false;

  const fmt = (n: number) => `฿${n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const planLabel = `${PLAN_NAME_TH[fields.planType] ?? fields.planType} × ${fields.planCount} งวด`;

  const paid = fields.paidViaWallet;
  const payload = {
    username: "LUXUSX Installment",
    embeds: [
      {
        title: paid
          ? `💳 ชำระเปิดบิลแล้ว (wallet): ${fields.billId}`
          : `📋 บิลผ่อนชำระใหม่: ${fields.billId}`,
        color: paid ? 0x22c55e : 0xef4444,
        fields: [
          { name: "รหัสสินค้า",    value: fields.productCode,              inline: true },
          { name: "ราคาสินค้า",    value: fmt(fields.totalPrice),          inline: true },
          { name: "เงินเปิดบิล",   value: fmt(fields.downAmount),          inline: true },
          { name: "แผนผ่อน",       value: planLabel,                        inline: true },
          { name: "ต่องวด",        value: fmt(fields.amountPerInstallment), inline: true },
        ],
        footer: {
          text: paid
            ? "✅ หักเหรียญ wallet แล้ว — รอแอดมินส่งไอดีให้ลูกค้าผ่าน chat"
            : "ลูกค้าสร้างบิลแล้ว — รอรับสลิปและยืนยันผ่าน LINE",
        },
        timestamp: new Date().toISOString(),
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
