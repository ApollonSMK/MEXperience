
import { NextResponse } from 'next/server';

// This API route is now deprecated as the new flow uses create-subscription-intent
// We leave it here to avoid breaking old references, but it should not be used.
export async function POST(req: Request) {
  console.warn("[API] /create-subscription is deprecated. Use /api/stripe/create-subscription-intent instead.");
  return NextResponse.json({ error: 'This endpoint is deprecated.' }, { status: 410 });
}
