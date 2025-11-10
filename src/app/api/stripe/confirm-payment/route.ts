
import { NextResponse } from 'next/server';

// This API route is now deprecated. The logic has been moved to the Stripe webhook.
// We leave it here to avoid breaking old references, but it should not be used.
export async function POST(req: Request) {
  console.warn("[API] /api/stripe/confirm-payment is deprecated. Logic is now handled by webhooks.");
  return NextResponse.json({ error: 'This endpoint is deprecated.' }, { status: 410 });
}
