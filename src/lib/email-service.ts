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
        // Usar Promise.allSettled para que se o template falhar, o SMTP não falhe
        const [smtpResult, templateResult] = await Promise.allSettled([
            supabaseAdmin.from('smtp_settings').select('*').single(),
            supabaseAdmin.from('email_templates').select('*').eq('id', type).single()
        ]);

        // Analisar resultado SMTP (Crítico)
        if (smtpResult.status === 'rejected' || (smtpResult.value.error && smtpResult.value.error.code !== 'PGRST116')) {
             console.error('[EmailService] SMTP Fetch Error:', smtpResult.status === 'rejected' ? smtpResult.reason : smtpResult.value.error);
             return { success: false, error: 'SMTP Configuration Error' };
        }
        
        const smtpSettings = smtpResult.status === 'fulfilled' ? smtpResult.value.data : null;

        if (!smtpSettings) {
            console.error('[EmailService] SMTP Settings not found (empty).');
            return { success: false, error: 'SMTP Configuration missing' };
        }

        // Analisar resultado Template (Opcional - Fallback disponível)
        let dbTemplate = null;
        if (templateResult.status === 'fulfilled' && templateResult.value.data) {
            dbTemplate = templateResult.value.data;
        } else {
            if (templateResult.status === 'rejected') {
                console.warn('[EmailService] Template fetch failed (using fallback):', templateResult.reason);
            } else if (templateResult.value.error) {
                console.warn('[EmailService] Template fetch returned error (using fallback):', templateResult.value.error.message);
            }
        }

        // 2. Configure Transporter
        // REVERTED POOLING for debugging stability issues.
        // Using standard connection settings.
        
        // AUTO-DETECT SECURE: Se a porta for 465, secure deve ser true.
        // Se for 587, secure deve ser false (usa STARTTLS).
        const isSecure = smtpSettings.port === 465 || smtpSettings.encryption === 'ssl';

        const transporter = nodemailer.createTransport({
            host: smtpSettings.host,
            port: smtpSettings.port,
            secure: isSecure, 
            auth: {
                user: smtpSettings.user,
                pass: smtpSettings.password,
            },
            tls: {
                rejectUnauthorized: false,
                // CRUCIAL: A mesma configuração que funcionou no diagnóstico
                minVersion: 'TLSv1',
                ciphers: 'HIGH:MEDIUM:!aNULL:!eNULL:@STRENGTH' 
            },
            // Removidos timeouts personalizados que podem causar erros prematuros
            debug: true 
        });

        // REMOVIDO: A verificação prévia (verify) duplica o tempo de conexão.
        // Vamos confiar que o sendMail vai falhar se a conexão estiver ruim, e tratamos o erro lá.
        
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
        
        // Gerar um Message-ID limpo baseado no domínio
        const domain = smtpSettings.user.split('@')[1] || 'me-experience.lu';
        
        // Criar versão em texto simples do HTML (remove tags)
        const textContent = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

        const info = await transporter.sendMail({
            from: {
                name: senderName,
                address: smtpSettings.user
            },
            to: to,
            subject: subject,
            text: textContent, // Adicionar versão TEXTO para reduzir score de spam
            html: htmlContent,
            // Adicionar cabeçalhos para melhorar reputação
            headers: {
                'X-Priority': '1', 
                'X-MSMail-Priority': 'High',
                'Importance': 'High'
            },
            messageId: `<${Date.now()}.${Math.random().toString(36).substring(2)}@${domain}>`,
        });

        console.log(`[EmailService] [${new Date().toISOString()}] E-mail ENTREGE AO SERVIDOR SMTP com sucesso. MessageID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };

    } catch (error: any) {
        console.error(`[EmailService] [${new Date().toISOString()}] Erro fatal ao enviar e-mail:`, error);
        return { success: false, error: error.message };
    }
}