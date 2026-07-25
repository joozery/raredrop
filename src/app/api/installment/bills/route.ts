import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import InstallmentBill from "@/models/InstallmentBill";
import ShopListing from "@/models/ShopListing";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { sendDiscordInstallmentNotification } from "@/lib/discord";

// POST /api/installment/bills — บันทึกบิลใหม่ (ถ้า deductCoins=true จะหักเหรียญด้วย)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bill, deviceId, deductCoins, listingId } = body as { bill: any; deviceId: string; deductCoins?: boolean; listingId?: string };

    if (!bill?.id || !deviceId) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
    }

    await connectToDatabase();

    // ── หักเหรียญก่อนบันทึกบิล (เฉพาะ flow จาก shop) ──────────────────────────
    if (deductCoins) {
      const session = await getServerSession(authOptions);
      const userId = (session?.user as any)?.id;
      if (!userId) {
        return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนชำระเงิน" }, { status: 401 });
      }

      const downAmount = Number(bill.downAmount);
      if (!downAmount || downAmount <= 0) {
        return NextResponse.json({ error: "ยอดเงินเปิดบิลไม่ถูกต้อง" }, { status: 400 });
      }

      // ── จอง stock ก่อน (ถ้ามี listingId) ───────────────────────────────────
      let reservedAccountId: any = undefined;
      let shopListingDoc: any = null;

      if (listingId) {
        shopListingDoc = await ShopListing.findById(listingId);
        if (!shopListingDoc || shopListingDoc.status !== "active") {
          return NextResponse.json({ error: "ไม่พบสินค้าหรือสินค้าถูกปิดแล้ว" }, { status: 404 });
        }
        const freeAccount = shopListingDoc.accounts.find((a: any) => !a.sold);
        if (!freeAccount) {
          return NextResponse.json({ error: "สินค้าหมดแล้ว ไม่สามารถเปิดบิลผ่อนได้" }, { status: 400 });
        }
        // จอง account ทันที
        freeAccount.sold = true;
        freeAccount.soldTo = userId;
        freeAccount.soldAt = new Date();
        await shopListingDoc.save();
        reservedAccountId = freeAccount._id;
      }

      // ── ตัดเงิน atomic — ถ้าเหรียญไม่พอ findOneAndUpdate คืน null ──────────
      const updatedUser = await User.findOneAndUpdate(
        { _id: userId, coins: { $gte: downAmount } },
        { $inc: { coins: -downAmount } },
        { new: true },
      );

      if (!updatedUser) {
        // คืน stock ที่จองไว้
        if (shopListingDoc && reservedAccountId) {
          const acc = shopListingDoc.accounts.find((a: any) => String(a._id) === String(reservedAccountId));
          if (acc) { acc.sold = false; acc.soldTo = undefined; acc.soldAt = undefined; }
          await shopListingDoc.save().catch(() => {});
        }
        return NextResponse.json({ error: "เหรียญในกระเป๋าไม่เพียงพอ" }, { status: 400 });
      }

      // ── บันทึกบิล ────────────────────────────────────────────────────────────
      const savedBill = await InstallmentBill.findOneAndUpdate(
        { billId: bill.id },
        {
          billId:               bill.id,
          productCode:          bill.productCode,
          totalPrice:           bill.totalPrice,
          downPercent:          bill.downPercent,
          downAmount:           bill.downAmount,
          remainingAmount:      bill.remainingAmount,
          planType:             bill.planType,
          planCount:            bill.planCount,
          amountPerInstallment: bill.amountPerInstallment,
          installments:         bill.installments,
          status:               bill.status ?? "pending",
          deviceId,
          userId,
          ...(listingId ? { shopListingId: listingId, reservedAccountId } : {}),
        },
        { upsert: true, new: true },
      ).catch(async (err) => {
        // บิลล้มเหลว — คืนเหรียญ + คืน stock
        await User.findOneAndUpdate({ _id: userId }, { $inc: { coins: downAmount } });
        if (shopListingDoc && reservedAccountId) {
          const acc = shopListingDoc.accounts.find((a: any) => String(a._id) === String(reservedAccountId));
          if (acc) { acc.sold = false; acc.soldTo = undefined; acc.soldAt = undefined; }
          await shopListingDoc.save().catch(() => {});
        }
        throw err;
      });

      // ── บันทึก Transaction ────────────────────────────────────────────────────
      await Transaction.create({
        userId,
        type: "installment_down",
        amount: -downAmount,
        balanceAfter: updatedUser.coins,
        description: `เงินเปิดบิลผ่อนชำระ ${bill.productCode} (${bill.id})`,
        referenceId: savedBill._id,
      });

      // แจ้งเตือน Discord (best-effort)
      sendDiscordInstallmentNotification({
        billId:               bill.id,
        productCode:          bill.productCode,
        totalPrice:           bill.totalPrice,
        downAmount:           bill.downAmount,
        planType:             bill.planType,
        planCount:            bill.planCount,
        amountPerInstallment: bill.amountPerInstallment,
        paidViaWallet:        true,
      }).catch(() => {});

      return NextResponse.json({ ok: true, coinsDeducted: true, balanceAfter: updatedUser.coins });
    }

    // ── flow ปกติ — ไม่หักเงิน ────────────────────────────────────────────────
    await InstallmentBill.findOneAndUpdate(
      { billId: bill.id },
      {
        billId:               bill.id,
        productCode:          bill.productCode,
        totalPrice:           bill.totalPrice,
        downPercent:          bill.downPercent,
        downAmount:           bill.downAmount,
        remainingAmount:      bill.remainingAmount,
        planType:             bill.planType,
        planCount:            bill.planCount,
        amountPerInstallment: bill.amountPerInstallment,
        installments:         bill.installments,
        status:               bill.status ?? "pending",
        deviceId,
      },
      { upsert: true, new: true },
    );

    sendDiscordInstallmentNotification({
      billId:               bill.id,
      productCode:          bill.productCode,
      totalPrice:           bill.totalPrice,
      downAmount:           bill.downAmount,
      planType:             bill.planType,
      planCount:            bill.planCount,
      amountPerInstallment: bill.amountPerInstallment,
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/installment/bills?q=...&deviceId=... — ค้นหาบิล
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q        = searchParams.get("q")?.trim().toUpperCase() ?? "";
    const deviceId = searchParams.get("deviceId") ?? "";

    if (!q) return NextResponse.json({ bills: [] });

    await connectToDatabase();

    // ค้นด้วย billId หรือ productCode — ถ้าใส่ deviceId จะค้นเฉพาะบิลของเครื่องนี้
    const filter: Record<string, any> = {
      $or: [
        { billId:      { $regex: q, $options: "i" } },
        { productCode: { $regex: q, $options: "i" } },
      ],
    };
    if (deviceId) filter.deviceId = deviceId;

    const bills = await InstallmentBill.find(filter)
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({ bills });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
