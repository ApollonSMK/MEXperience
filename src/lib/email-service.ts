import { Resend } from 'resend';
import { getEmailContent } from '@/lib/email-templates';
import { createClient } from '@supabase/supabase-js';

// Instantiating outside might fail if env vars aren't loaded in some runtimes
// Alterado de 'onboarding@resend.dev' para o seu domínio verificado
const fromEmail = process.env.FROM_EMAIL || 'contact@me-experience.lu';

// Configuração do Supabase Admin para logs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Criar cliente apenas se as chaves existirem (para evitar erros em build time se envs faltarem)
const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

interface SendEmailParams {
  type: 'confirmation' | 'cancellation' | 'reschedule' | 'welcome' | 'purchase' | 'gift_card';
  to: string;
  data: any;
}

export async function sendEmail({ type, to, data }: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    const msg = "RESEND_API_KEY não configurado nas variáveis de ambiente.";
    console.error(msg);
    throw new Error(msg);
  }

  const resend = new Resend(apiKey);
  let subject = '';

  try {
    const content = getEmailContent({ type, data });
    subject = content.subject;
    const body = content.body;

    console.log(`[Email Service] Tentando enviar e-mail para ${to} com assunto: ${subject}`);

    const { data: emailData, error } = await resend.emails.send({
      from: `M.E Experience <${fromEmail}>`,
      to: [to],
      subject: subject,
      html: body,
    });

    if (error) {
      console.error("[Email Service] Erro retornado pela API Resend:", error);
      
      // LOG ERROR
      if (supabaseAdmin) {
        await supabaseAdmin.from('email_logs').insert({
          to_email: to,
          subject: subject || 'Unknown Subject',
          type: type,
          status: 'failed',
          error_message: error.message,
          metadata: { error_name: error.name }
        });
      }

      throw new Error(`Erro Resend: ${error.message} - ${error.name}`);
    }

    console.log("[Email Service] E-mail enviado com sucesso. ID:", emailData?.id);

    // LOG SUCCESS
    if (supabaseAdmin) {
      await supabaseAdmin.from('email_logs').insert({
        to_email: to,
        subject: subject,
        type: type,
        status: 'sent',
        metadata: { resend_id: emailData?.id }
      });
    }

    return emailData;

  } catch (error: any) {
    console.error("[Email Service] Exceção não tratada:", error);
    
    // LOG EXCEPTION
    if (supabaseAdmin) {
        try {
            await supabaseAdmin.from('email_logs').insert({
                to_email: to,
                subject: subject || 'Error before subject generation',
                type: type,
                status: 'failed',
                error_message: error.message || 'Unknown error'
            });
        } catch (logError) {
            console.error("Failed to log email error to Supabase", logError);
        }
    }

    throw error;
  }
}