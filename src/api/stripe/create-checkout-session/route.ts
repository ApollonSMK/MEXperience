
import { NextResponse } from 'next/server';

// This API route is now deprecated as the new flow for appointments uses create-payment-intent.
// We leave it here to avoid breaking old references, but it should not be used.
export async function POST(req: Request) {
  console.warn("[API] /create-checkout-session is deprecated. Use /api/stripe/create-payment-intent for appointments.");
  return NextResponse.json({ error: 'This endpoint is deprecated.' }, { status: 410 });
}
