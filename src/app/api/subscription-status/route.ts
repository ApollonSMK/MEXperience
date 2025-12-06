// This file is no longer used in the new flow and can be removed or left empty.
// The new flow relies on the webhook to update the database and redirects the user
// to their profile page, where the updated state will be reflected.

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    // Deprecated: The new flow does not require polling this endpoint.
    return NextResponse.json({ status: 'deprecated' });
}
