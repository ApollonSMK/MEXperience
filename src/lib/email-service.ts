import { Resend } from 'resend';
import { getEmailContent } from '@/lib/email-templates';

// Instantiating outside might fail if env vars aren't loaded in some runtimes
// Alterado de 'onboarding@resend.dev' para o seu domínio verificado
const fromEmail = process.env.FROM_EMAIL || 'contact@me-experience.lu';

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

  try {
    const { subject, body } = getEmailContent({ type, data });

    console.log(`[Email Service] Tentando enviar e-mail para ${to} com assunto: ${subject}`);

    const { data: emailData, error } = await resend.emails.send({
      from: `M.E Experience <${fromEmail}>`,
      to: [to],
      subject: subject,
      html: body,
    });

    if (error) {
      console.error("[Email Service] Erro retornado pela API Resend:", error);
      throw new Error(`Erro Resend: ${error.message} - ${error.name}`);
    }

    console.log("[Email Service] E-mail enviado com sucesso. ID:", emailData?.id);
    return emailData;

  } catch (error: any) {
    console.error("[Email Service] Exceção não tratada:", error);
    throw error;
  }
}