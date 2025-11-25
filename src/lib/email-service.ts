import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { getConfirmationTemplate, getCancellationTemplate, getRescheduleTemplate, getPurchaseTemplate } from '@/lib/email-templates';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Initialize Resend with the provided API Key
// NOTE: In production, this should be in process.env.RESEND_API_KEY
const resend = new Resend('re_WS6uESRX_DdJhsZJR6HQk6SMk6JwTJYZf');

// Supabase Admin Client for fetching templates (optional now, but good to keep logic)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function sendEmail(type: 'confirmation' | 'cancellation' | 'reschedule' | 'purchase', to: string, data: any) {
    console.log(`[EmailService] [Resend] Tentando enviar e-mail do tipo: ${type} para: ${to}`);
    
    try {
        // 1. Fetch Template (Fail-safe)
        let dbTemplate = null;
        try {
            const { data: templateData, error } = await supabaseAdmin.from('email_templates').select('*').eq('id', type).single();
            if (templateData) {
                dbTemplate = templateData;
            } else if (error && error.code !== 'PGRST116') {
                console.warn('[EmailService] Failed to fetch template from DB:', error.message);
            }
        } catch (err) {
            console.warn('[EmailService] Error checking templates table (might not exist yet):', err);
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
        // IMPORTANT: Until you verify your domain in Resend dashboard, you can only send to your own email
        // or use 'onboarding@resend.dev' as the FROM address.
        // Once verified, you can use 'contact@me-experience.lu'.
        
        const { data: emailData, error: emailError } = await resend.emails.send({
            from: 'M.E Experience <onboarding@resend.dev>', // Change to your domain once verified (e.g., contact@me-experience.lu)
            to: [to],
            subject: subject,
            html: htmlContent,
        });

        if (emailError) {
            console.error('[EmailService] [Resend] Error sending email:', emailError);
            return { success: false, error: emailError.message };
        }

        console.log(`[EmailService] [Resend] E-mail enviado com sucesso. ID: ${emailData?.id}`);
        return { success: true, messageId: emailData?.id };

    } catch (error: any) {
        console.error('[EmailService] [Resend] Fatal error:', error);
        return { success: false, error: error.message };
    }
}