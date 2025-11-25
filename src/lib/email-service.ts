import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { getConfirmationTemplate, getCancellationTemplate, getRescheduleTemplate, getPurchaseTemplate } from '@/lib/email-templates';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Initialize Resend with the provided API Key from environment
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
    console.warn('[EmailService] AVISO: RESEND_API_KEY não está definida. Os e-mails não serão enviados.');
}
const resend = new Resend(resendApiKey);

// Configurable sender address
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'M.E Experience <contact@me-experience.lu>';

// Supabase Admin Client for fetching templates
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function sendEmail(type: 'confirmation' | 'cancellation' | 'reschedule' | 'purchase', to: string, data: any) {
    console.log(`[EmailService] Iniciando envio. Tipo: ${type}, Para: ${to}, Remetente: ${SENDER_EMAIL}`);
    
    try {
        // 1. Fetch Template (Fail-safe)
        let dbTemplate = null;
        try {
            const { data: templateData, error } = await supabaseAdmin.from('email_templates').select('*').eq('id', type).single();
            if (templateData) {
                dbTemplate = templateData;
                console.log(`[EmailService] Template carregado do banco de dados: ${type}`);
            }
        } catch (err) {
            console.warn('[EmailService] Erro ao buscar template do DB (usando fallback):', err);
        }

        // 2. Prepare Content
        let htmlContent = '';
        let subject = '';

        // Helper to replace variables
        const processTemplate = (html: string, variables: any) => {
            let processed = html;
            processed = processed.replace(/{{userName}}/g, variables.userName || '');
            if (variables.date) {
                const formattedDate = format(new Date(variables.date), "EEEE d MMMM 'à' HH:mm", { locale: fr });
                processed = processed.replace(/{{date}}/g, formattedDate);
            }
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
            console.log(`[EmailService] Usando template padrão (arquivo) para: ${type}`);
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

        // 3. Send Email via Resend API
        const { data: emailData, error: emailError } = await resend.emails.send({
            from: SENDER_EMAIL, 
            to: [to],
            subject: subject,
            html: htmlContent,
        });

        if (emailError) {
            console.error('[EmailService] ERRO CRÍTICO Resend:', JSON.stringify(emailError, null, 2));
            return { success: false, error: emailError.message };
        }

        console.log(`[EmailService] Sucesso! E-mail enviado. ID: ${emailData?.id}`);
        return { success: true, messageId: emailData?.id };

    } catch (error: any) {
        console.error('[EmailService] Exceção não tratada:', error);
        return { success: false, error: error.message };
    }
}