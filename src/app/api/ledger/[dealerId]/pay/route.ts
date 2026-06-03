import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { fetchExternalDealer, getLedgerSnapshot } from "@/lib/ledgerSystem";

/**
 * POST /api/ledger/[dealerId]/pay
 * Record a payment/money received from dealer
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ dealerId: string }> }
) {
  try {
    const { dealerId } = await params;
    const body = await req.json();
    const { amount, paymentMode, narration, referenceId, paymentDate } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid amount is required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    const dealer = await fetchExternalDealer(dealerId).catch(async () => {
      const snapshot = await getLedgerSnapshot();
      return snapshot.dealers.find((item) => String(item.Dealer_Id) === String(dealerId)) ?? null;
    });

    if (!dealer) {
      return NextResponse.json(
        { success: false, message: "Dealer not found" },
        { status: 404 }
      );
    }

    // Create ledger transaction record
    const date = paymentDate ? new Date(paymentDate) : new Date();

    const transaction = {
      Dealer_Id: dealerId,
      type: "payment",
      amount: parseFloat(amount),
      paymentMode: paymentMode || "Cash",
      narration: narration || `Payment received - ${paymentMode || "Cash"}`,
      referenceId: referenceId || "",
      date: Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db
      .collection("ledger_transactions")
      .insertOne(transaction);

    return NextResponse.json({
      success: true,
      message: "Payment recorded successfully",
      transactionId: result.insertedId.toString(),
      transaction,
    });
  } catch (error: any) {
    console.error("[POST /api/ledger/[dealerId]/pay]", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
