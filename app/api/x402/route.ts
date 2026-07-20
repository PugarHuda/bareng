// A REAL x402 (HTTP-402) endpoint. GET with no `X-PAYMENT` → 402 + PaymentRequirements. GET with a
// valid `X-PAYMENT` (an EIP-3009 authorization signed by the caller) → the facilitator verifies the
// signature (lib/x402pay verifyPayment) and returns 200 + the resource. This is the full x402
// handshake, server-side and real — not a mock. On-chain settlement is a facilitator broadcasting
// the same signed `transferWithAuthorization`; the authorization we verify here is settlement-ready.

import { NextResponse, type NextRequest } from "next/server";
import { verifyPayment } from "@/lib/x402pay";
import type { PaymentRequirement } from "@/lib/x402";

export const runtime = "nodejs";

const ARBITRUM_USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const SERVICE = "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955"; // the paid service's receiving address

function requirement(price: string): PaymentRequirement {
  const dollars = Math.max(0, Number(price) || 20);
  return {
    scheme: "exact",
    network: "arbitrum",
    maxAmountRequired: String(Math.round(dollars * 1_000_000)), // atomic USDC (6dp)
    asset: ARBITRUM_USDC,
    payTo: SERVICE,
    resource: "/api/x402",
    description: "Premium market insight",
    maxTimeoutSeconds: 600,
  };
}

export async function GET(request: NextRequest) {
  const price = request.nextUrl.searchParams.get("price") ?? "20";
  const req = requirement(price);
  const header = request.headers.get("X-PAYMENT");

  if (!header) {
    return NextResponse.json({ x402Version: 1, accepts: [req] }, { status: 402 });
  }
  const v = await verifyPayment(header, req);
  if (!v.valid) {
    return NextResponse.json({ x402Version: 1, accepts: [req], error: v.reason }, { status: 402 });
  }
  // Verified: the caller cryptographically authorized this exact USDC payment.
  return NextResponse.json({
    insight: "BTC regime: risk-on",
    paidBy: v.from,
    settlementReady: true, // a facilitator broadcasts the signed transferWithAuthorization to settle
  });
}
