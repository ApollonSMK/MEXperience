import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import nodemailer from 'nodemailer';
import { getConfirmationTemplate, getCancellationTemplate, getRescheduleTemplate } from '@/lib/email-templates';

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseRouteClient();
    const body = await req.json();
    const { type, to, data } = body;

    if (!to || !type || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Fetch SMTP Settings from DB
    const { data: smtpSettings, error: smtpError } = await supabase
      .from('smtp_settings')
      .select('*')
      .single();

    if (smtpError || !smtpSettings) {
      console.error('SMTP Settings not found:', smtpError);
      return NextResponse.json({ error: 'SMTP Configuration missing' }, { status: 500 });
    }

    // 2. Configure Transporter
    const transporter = nodemailer.createTransport({
      host: smtpSettings.host,
      port: smtpSettings.port,
      secure: smtpSettings.encryption === 'ssl', // true for 465, false for other ports
      auth: {
        user: smtpSettings.user,
        pass: smtpSettings.password,
      },
    });

    // 3. Generate HTML Content
    let htmlContent = '';
    let subject = '';

    switch (type) {
      case 'confirmation':
        htmlContent = getConfirmationTemplate(data);
        subject = 'Confirmation de votre rendez-vous - M.E Experience';
        break;
      case 'cancellation':
        htmlContent = getCancellationTemplate(data);
        subject = 'Annulation de votre rendez-vous - M.E Experience';
        break;
      case 'reschedule':
        htmlContent = getRescheduleTemplate(data);
        subject = 'Modification de votre rendez-vous - M.E Experience';
        break;
      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    // 4. Send Email
    const info = await transporter.sendMail({
      from: `"${smtpSettings.user}" <${smtpSettings.user}>`, // Sender address
      to: to,
      subject: subject,
      html: htmlContent,
    });

    return NextResponse.json({ success: true, messageId: info.messageId });

  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}