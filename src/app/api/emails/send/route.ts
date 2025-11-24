import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import nodemailer from 'nodemailer';
import { getConfirmationTemplate, getCancellationTemplate, getRescheduleTemplate } from '@/lib/email-templates';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseRouteClient();
    const body = await req.json();
    const { type, to, data } = body;

    if (!to || !type || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Fetch SMTP Settings AND Email Template from DB in parallel
    const smtpPromise = supabase.from('smtp_settings').select('*').single();
    const templatePromise = supabase.from('email_templates').select('*').eq('id', type).single();

    const [smtpResult, templateResult] = await Promise.all([smtpPromise, templatePromise]);
    
    const smtpSettings = smtpResult.data;
    const dbTemplate = templateResult.data;

    if (smtpResult.error || !smtpSettings) {
      console.error('SMTP Settings not found:', smtpResult.error);
      return NextResponse.json({ error: 'SMTP Configuration missing' }, { status: 500 });
    }

    // 2. Configure Transporter
    const transporter = nodemailer.createTransport({
      host: smtpSettings.host,
      port: smtpSettings.port,
      secure: smtpSettings.encryption === 'ssl',
      auth: {
        user: smtpSettings.user,
        pass: smtpSettings.password,
      },
    });

    // 3. Prepare Content
    let htmlContent = '';
    let subject = '';

    // Helper to replace variables
    const processTemplate = (html: string, variables: any) => {
        const formattedDate = format(new Date(variables.date), "EEEE d MMMM 'à' HH:mm", { locale: fr });
        return html
            .replace(/{{userName}}/g, variables.userName)
            .replace(/{{serviceName}}/g, variables.serviceName)
            .replace(/{{date}}/g, formattedDate)
            .replace(/{{duration}}/g, variables.duration?.toString() || '');
    };

    if (dbTemplate) {
        // Use DB Template
        htmlContent = processTemplate(dbTemplate.body_html, data);
        subject = dbTemplate.subject;
    } else {
        // Fallback to file templates
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
    }

    // 4. Send Email
    const info = await transporter.sendMail({
      from: `"${smtpSettings.user}" <${smtpSettings.user}>`,
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