import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Create a direct admin client to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function GET(req: Request) {
    // Use supabaseAdmin instead of createSupabaseRouteClient
    const { data: smtpSettings, error } = await supabaseAdmin.from('smtp_settings').select('*').single();

    if (error || !smtpSettings) {
        return NextResponse.json({ error: 'No SMTP settings found or Access Denied', details: error });
    }

    const logs: string[] = [];
    const log = (msg: string) => {
        const entry = `[${new Date().toISOString()}] ${msg}`;
        console.log(entry);
        logs.push(entry);
    };

    log(`Starting SMTP Diagnostic for host: ${smtpSettings.host}:${smtpSettings.port}`);

    const isSecure = smtpSettings.port === 465 || smtpSettings.encryption === 'ssl';
    log(`Secure mode: ${isSecure} (Port: ${smtpSettings.port}, Encryption: ${smtpSettings.encryption})`);
    log(`User: ${smtpSettings.user}`);
    // Não mostramos a senha, mas verificamos o comprimento para garantir que não está vazia
    log(`Password length: ${smtpSettings.password ? smtpSettings.password.length : 0}`);

    const transporter = nodemailer.createTransport({
        host: smtpSettings.host,
        port: smtpSettings.port,
        secure: isSecure,
        auth: {
            user: smtpSettings.user,
            pass: smtpSettings.password // Use the real password from DB
        },
        tls: {
            rejectUnauthorized: false,
            ciphers: 'SSLv3' // Tentar forçar compatibilidade antiga se necessário, ou remover se falhar
        },
        debug: true, 
        logger: true 
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