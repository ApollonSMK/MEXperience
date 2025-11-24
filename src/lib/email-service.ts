import { createSupabaseRouteClient } from '@/lib/supabase/route-handler-client';
import nodemailer from 'nodemailer';
import { getConfirmationTemplate, getCancellationTemplate, getRescheduleTemplate, getPurchaseTemplate } from '@/lib/email-templates';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createClient } from '@supabase/supabase-js';

// Usamos o Admin Client aqui para garantir acesso às configurações SMTP
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function sendEmail(type: 'confirmation' | 'cancellation' | 'reschedule' | 'purchase', to: string, data: any) {
    console.log(`[EmailService] Tentando enviar e-mail do tipo: ${type} para: ${to}`);
    
    try {
        // 1. Fetch SMTP Settings AND Template
        const smtpPromise = supabaseAdmin.from('smtp_settings').select('*').single();
        const templatePromise = supabaseAdmin.from('email_templates').select('*').eq('id', type).single();

        const [smtpResult, templateResult] = await Promise.all([smtpPromise, templatePromise]);
        
        const smtpSettings = smtpResult.data;
        const dbTemplate = templateResult.data;

        if (smtpResult.error || !smtpSettings) {
            console.error('[EmailService] SMTP Settings not found or error:', smtpResult.error);
            return { success: false, error: 'SMTP Configuration missing' };
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

        // Helper to replace variables in DB Templates
        const processTemplate = (html: string, variables: any) => {
            let processed = html;
            // Common replacements
            processed = processed.replace(/{{userName}}/g, variables.userName || '');
            
            // Date handling
            if (variables.date) {
                const formattedDate = format(new Date(variables.date), "EEEE d MMMM 'à' HH:mm", { locale: fr });
                processed = processed.replace(/{{date}}/g, formattedDate);
            }
            
            // Other variables
            processed = processed.replace(/{{serviceName}}/g, variables.serviceName || '');
            processed = processed.replace(/{{planName}}/g, variables.planName || '');
            processed = processed.replace(/{{price}}/g, variables.price || '');
            processed = processed.replace(/{{duration}}/g, variables.duration?.toString() || '');
            
            return processed;
        };

        if (dbTemplate) {
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
                case 'purchase':
                    htmlContent = getPurchaseTemplate(data);
                    subject = 'Confirmation de votre achat - M.E Experience';
                    break;
                default:
                    return { success: false, error: 'Invalid email type' };
            }
        }

        // 4. Send Email
        const senderName = smtpSettings.sender_name || process.env.NEXT_PUBLIC_APP_NAME || 'M.E Experience';
        
        const info = await transporter.sendMail({
            from: `"${senderName}" <${smtpSettings.user}>`,
            to: to,
            subject: subject,
            html: htmlContent,
        });

        console.log(`[EmailService] E-mail enviado com sucesso. MessageID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };

    } catch (error: any) {
        console.error('[EmailService] Erro fatal ao enviar e-mail:', error);
        return { success: false, error: error.message };
    }
}