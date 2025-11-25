import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const supabase = await createSupabaseRouteClient();
    const { data: smtpSettings } = await supabase.from('smtp_settings').select('*').single();

    if (!smtpSettings) {
        return NextResponse.json({ error: 'No SMTP settings found' });
    }

    const logs: string[] = [];
    const log = (msg: string) => {
        const entry = `[${new Date().toISOString()}] ${msg}`;
        console.log(entry);
        logs.push(entry);
    };

    log(`Starting SMTP Diagnostic for host: ${smtpSettings.host}:${smtpSettings.port}`);

    const isSecure = smtpSettings.port === 465 || smtpSettings.encryption === 'ssl';
    log(`Secure mode: ${isSecure}`);

    const transporter = nodemailer.createTransport({
        host: smtpSettings.host,
        port: smtpSettings.port,
        secure: isSecure,
        auth: {
            user: smtpSettings.user,
            pass: '***HIDDEN***'
        },
        tls: {
            rejectUnauthorized: false
        },
        debug: true, // Enable nodemailer debug output
        logger: true // Log to console
    });

    try {
        log('Attempting verify()...');
        const startVerify = Date.now();
        await transporter.verify();
        const verifyDuration = Date.now() - startVerify;
        log(`Verify success! Duration: ${verifyDuration}ms`);

        log('Attempting sendMail()...');
        const startSend = Date.now();
        const info = await transporter.sendMail({
            from: {
                name: 'Debug Test',
                address: smtpSettings.user
            },
            to: smtpSettings.user, // Send to self
            subject: 'SMTP Diagnostic Test ' + new Date().toISOString(),
            text: 'If you receive this quickly, the SMTP connection is fine.',
        });
        const sendDuration = Date.now() - startSend;
        log(`Send success! Duration: ${sendDuration}ms. MessageID: ${info.messageId}`);
        
        return NextResponse.json({
            success: true,
            timings: {
                verify: verifyDuration,
                send: sendDuration,
                total: verifyDuration + sendDuration
            },
            logs
        });

    } catch (error: any) {
        log(`ERROR: ${error.message}`);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack,
            logs
        }, { status: 500 });
    }
}