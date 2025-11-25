import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, to, data } = body;

    if (!to || !type || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Call the unified email service (Resend)
    const result = await sendEmail(type as any, to, data);

    if (!result.success) {
      console.error('Email service error:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: result.messageId });

  } catch (error: any) {
    console.error('Error processing email request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}