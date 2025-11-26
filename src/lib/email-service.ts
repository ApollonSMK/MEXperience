import { Resend } from 'resend';
import { getEmailContent } from '@/lib/email-templates';

// Instantiating outside might fail if env vars aren't loaded in some runtimes
const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

interface SendEmailParams {
  type: 'confirmation' | 'cancellation' | 'reschedule' | 'welcome' | 'purchase';
  to: string;
  data: any;
}

export async function sendEmail({ type, to, data }: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("RESEND_API_KEY não configurado. Pulando envio de e-mail.");
    return;
  }

  const resend = new Resend(apiKey);

  try {
    const { subject, body } = getEmailContent({ type, data });

    const { data: emailData, error } = await resend.emails.send({
      from: `M.E Experience <${fromEmail}>`,
      to: [to],
      subject: subject,
      html: body,
    });

    if (error) {
      console.error("Erro ao enviar e-mail (Resend):", error);
      throw new Error(`Falha no envio do e-mail: ${error.message}`);
    }

    console.log("E-mail enviado com sucesso:", emailData?.id);
    return emailData;

  } catch (error) {
    console.error("Erro inesperado no serviço de e-mail:", error);
    throw error;
  }
}