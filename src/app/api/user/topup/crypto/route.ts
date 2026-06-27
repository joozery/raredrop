import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Setting from "@/models/Setting";
import { notify } from "@/lib/notify";
import { awardXp, getExpPerBaht } from "@/lib/xp";

const EXPLORER_APIS: Record<string, string> = {
  eth: "https://api.etherscan.io",
  bsc: "https://api.bscscan.com",
  polygon: "https://api.polygonscan.com",
};

const NETWORK_LABELS: Record<string, string> = {
  eth: "ETH",
  bsc: "BNB",
  polygon: "MATIC",
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" }, { status: 401 });
    }

    const { txHash } = await req.json();
    if (!txHash || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return NextResponse.json({ error: "TX Hash ไม่ถูกต้อง" }, { status: 400 });
    }

    await connectToDatabase();

    const settings = await Setting.find({
      key: {
        $in: [
          "crypto_enabled",
          "crypto_wallet_address",
          "crypto_network",
          "crypto_rate_per_unit",
          "crypto_explorer_api_key",
        ],
      },
    }).lean();

    const getSetting = (key: string) => settings.find((s: any) => s.key === key)?.value;

    const cryptoEnabled = getSetting("crypto_enabled");
    if (!cryptoEnabled) {
      return NextResponse.json({ error: "ระบบเติมเงิน Crypto ยังไม่เปิดใช้งาน" }, { status: 400 });
    }

    const walletAddress = String(getSetting("crypto_wallet_address") || "").toLowerCase();
    const network = String(getSetting("crypto_network") || "eth");
    const ratePerUnit = parseFloat(String(getSetting("crypto_rate_per_unit") || "0"));
    const apiKey = String(getSetting("crypto_explorer_api_key") || "");

    if (!walletAddress || ratePerUnit <= 0) {
      return NextResponse.json({ error: "ระบบ Crypto ยังไม่ได้ตั้งค่า" }, { status: 400 });
    }

    // Reject duplicate TX hash
    const duplicate = await Transaction.findOne({
      description: { $regex: txHash, $options: "i" },
    }).lean();
    if (duplicate) {
      return NextResponse.json({ error: "TX Hash นี้ถูกใช้งานไปแล้ว" }, { status: 400 });
    }

    // Verify TX on blockchain explorer
    const explorerBase = EXPLORER_APIS[network] ?? EXPLORER_APIS.eth;
    const apiUrl =
      `${explorerBase}/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}` +
      (apiKey ? `&apikey=${apiKey}` : "");

    const explorerRes = await fetch(apiUrl, { next: { revalidate: 0 } });
    const explorerData = await explorerRes.json();
    const tx = explorerData?.result;

    if (!tx || tx === null) {
      return NextResponse.json({ error: "ไม่พบ Transaction นี้บน Blockchain" }, { status: 400 });
    }
    if ((tx.to ?? "").toLowerCase() !== walletAddress) {
      return NextResponse.json({ error: "Transaction นี้ไม่ได้โอนมายังกระเป๋าของเรา" }, { status: 400 });
    }
    if (!tx.blockNumber) {
      return NextResponse.json(
        { error: "Transaction ยังไม่ได้รับการยืนยัน กรุณารอสักครู่แล้วลองใหม่" },
        { status: 400 }
      );
    }

    // Convert value from wei to native token amount
    const valueWei = BigInt(tx.value ?? "0x0");
    const valueNative = Number(valueWei) / 1e18;
    const coins = Math.floor(valueNative * ratePerUnit);

    if (coins <= 0) {
      return NextResponse.json({ error: "จำนวนเงินที่โอนน้อยเกินไป" }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(
      (session.user as any)?.id,
      { $inc: { coins } },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }

    const tokenLabel = NETWORK_LABELS[network] ?? network.toUpperCase();
    await Transaction.create({
      userId: user._id,
      type: "topup",
      amount: coins,
      balanceAfter: user.coins,
      description: `เติมเงินผ่าน Crypto (${valueNative.toFixed(6)} ${tokenLabel}) TX: ${txHash}`,
    });

    await notify(
      user._id.toString(),
      "เติมเงินสำเร็จ! 💰",
      `ได้รับ ฿${coins.toLocaleString()} จากการโอน ${valueNative.toFixed(6)} ${tokenLabel}`,
      "success"
    );

    const expRate = await getExpPerBaht();
    const xpToAdd = Math.floor(coins * expRate);
    if (xpToAdd > 0) await awardXp(user._id.toString(), xpToAdd);

    return NextResponse.json({ success: true, amount: coins, valueNative, tokenLabel });
  } catch (error: any) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด: " + error.message }, { status: 500 });
  }
}
