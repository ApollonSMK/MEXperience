import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EmailData {
  userName: string;
  serviceName: string;
  date: string;
  duration?: number;
  location?: string;
}

const baseStyles = `
  font-family: sans-serif;
  color: #333;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
`;

const headerStyle = `
  background-color: #000;
  color: #fff;
  padding: 20px;
  text-align: center;
`;

const contentStyle = `
  padding: 20px;
`;

const footerStyle = `
  background-color: #f9f9f9;
  padding: 15px;
  text-align: center;
  font-size: 12px;
  color: #666;
`;

export const getConfirmationTemplate = (data: EmailData) => {
  const formattedDate = format(new Date(data.date), "EEEE d MMMM 'à' HH:mm", { locale: fr });
  
  return `
    <div style="${baseStyles}">
      <div style="${headerStyle}">
        <h1 style="margin:0; font-size: 24px;">Confirmation de Rendez-vous</h1>
      </div>
      <div style="${contentStyle}">
        <p>Bonjour <strong>${data.userName}</strong>,</p>
        <p>Votre rendez-vous a été confirmé avec succès !</p>
        
        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Service :</strong> ${data.serviceName}</p>
          <p style="margin: 5px 0;"><strong>Date :</strong> ${formattedDate}</p>
          <p style="margin: 5px 0;"><strong>Durée :</strong> ${data.duration} minutes</p>
        </div>

        <p>Si vous souhaitez annuler ou replanifier, veuillez le faire via votre profil au moins 24h à l'avance.</p>
        <p>À bientôt !</p>
      </div>
      <div style="${footerStyle}">
        <p>Ceci est un message automatique, merci de ne pas y répondre.</p>
      </div>
    </div>
  `;
};

export const getCancellationTemplate = (data: EmailData) => {
  const formattedDate = format(new Date(data.date), "EEEE d MMMM 'à' HH:mm", { locale: fr });

  return `
    <div style="${baseStyles}">
      <div style="${headerStyle}">
        <h1 style="margin:0; font-size: 24px;">Annulation Confirmée</h1>
      </div>
      <div style="${contentStyle}">
        <p>Bonjour <strong>${data.userName}</strong>,</p>
        <p>Nous confirmons l'annulation de votre rendez-vous suivant :</p>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Service :</strong> ${data.serviceName}</p>
          <p style="margin: 5px 0;"><strong>Date :</strong> ${formattedDate}</p>
        </div>

        <p>Nous espérons vous revoir bientôt.</p>
      </div>
      <div style="${footerStyle}">
        <p>Ceci est un message automatique, merci de ne pas y répondre.</p>
      </div>
    </div>
  `;
};

export const getRescheduleTemplate = (data: EmailData) => {
  const formattedDate = format(new Date(data.date), "EEEE d MMMM 'à' HH:mm", { locale: fr });

  return `
    <div style="${baseStyles}">
      <div style="${headerStyle}">
        <h1 style="margin:0; font-size: 24px;">Rendez-vous Modifié</h1>
      </div>
      <div style="${contentStyle}">
        <p>Bonjour <strong>${data.userName}</strong>,</p>
        <p>Votre rendez-vous a été replanifié avec succès.</p>
        
        <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Nouvel horaire :</strong></p>
          <p style="margin: 5px 0;"><strong>Service :</strong> ${data.serviceName}</p>
          <p style="margin: 5px 0;"><strong>Date :</strong> ${formattedDate}</p>
          <p style="margin: 5px 0;"><strong>Durée :</strong> ${data.duration} minutes</p>
        </div>

        <p>À bientôt !</p>
      </div>
      <div style="${footerStyle}">
        <p>Ceci est un message automatique, merci de ne pas y répondre.</p>
      </div>
    </div>
  `;
};