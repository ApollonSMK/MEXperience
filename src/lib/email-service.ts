import { Resend } from 'resend';
import { getEmailContent } from '@/lib/email-templates';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

interface SendEmailParams {
  type: 'confirmation' | 'cancellation' | 'reschedule' | 'welcome';
  to: string;
  data: any;
}

export async function sendEmail({ type, to, data }: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.log("RESEND_API_KEY não configurado. Pulando envio de e-mail.");
    return;
  }

  try {
    const { subject, body } = getEmailContent({ type, data });

    const { data: emailData, error } = await resend.emails.send({
      from: `M.E Experience <${fromEmail}>`,
      to: [to],
      subject: subject,
      html: body,
    });

    if (error) {
      console.error("Erro ao enviar e-mail:", error);
      throw new Error("Falha no envio do e-mail.");
    }

    console.log("E-mail enviado com sucesso:", emailData?.id);
    return emailData;

  } catch (error) {
    console.error("Erro inesperado no serviço de e-mail:", error);
    throw error;
  }
}