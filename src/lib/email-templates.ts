import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';

interface GetEmailContentParams {
  type: 'confirmation' | 'cancellation' | 'reschedule' | 'welcome' | 'invoice' | 'purchase' | 'gift_card';
  data: any;
}

// Função para gerar o corpo do e-mail com um layout padrão
const generateEmailBody = (title: string, content: string) => `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
            background-color: #f4f4f7;
            color: #333;
            line-height: 1.6;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        .header {
            background-color: #1a1a1a;
            color: #ffffff;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 30px 40px;
        }
        .content h2 {
            font-size: 22px;
            color: #1a1a1a;
            margin-top: 0;
        }
        .content p {
            font-size: 16px;
            margin-bottom: 1em;
        }
        .details {
            background-color: #f9f9fb;
            border: 1px solid #e1e1e6;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        .details .item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e1e1e6;
        }
        .details .item:last-child {
            border-bottom: none;
        }
        .details .item strong {
            color: #555;
        }
        .footer {
            background-color: #f4f4f7;
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #888;
        }
        .button {
            display: inline-block;
            background-color: #7c3aed;
            color: #ffffff;
            padding: 12px 25px;
            border-radius: 5px;
            text-decoration: none;
            font-weight: 500;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>M.E Experience</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} M.E Experience. Tous droits réservés.</p>
            <p>Ceci est un e-mail automatisé, veuillez ne pas y répondre.</p>
        </div>
    </div>
</body>
</html>
`;

export function getEmailContent({ type, data }: GetEmailContentParams) {
  const { userName, serviceName, date, duration, planName, planPrice, planPeriod, giftCode, giftAmount } = data;
  
  const timeZone = 'Europe/Paris';
  
  let formattedDate = '';
  let formattedTime = '';

  if (date) {
    try {
        const d = new Date(date);
        const zonedDate = toZonedTime(d, timeZone);
        
        formattedDate = format(zonedDate, "EEEE d MMMM yyyy", { locale: fr });
        // Capitalize first letter
        formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

        formattedTime = format(zonedDate, "HH:mm", { locale: fr });
        
    } catch (e) {
        console.error("Error formatting date:", e);
        formattedDate = String(date); 
        formattedTime = '';
    }
  }

  let subject = '';
  let content = '';

  switch (type) {
    case 'confirmation':
      subject = `Confirmation de votre rendez-vous - ${serviceName}`;
      content = `
        <h2>Rendez-vous Confirmé !</h2>
        <p>Bonjour ${userName},</p>
        <p>Votre rendez-vous est bien confirmé. Voici les détails :</p>
        <div class="details">
            <div class="item">
                <strong>Service:</strong>
                <span>${serviceName}</span>
            </div>
            <div class="item">
                <strong>Date:</strong>
                <span>${formattedDate}</span>
            </div>
            <div class="item">
                <strong>Heure:</strong>
                <span>${formattedTime}</span>
            </div>
            <div class="item">
                <strong>Durée:</strong>
                <span>${duration} minutes</span>
            </div>
        </div>
        <p>Nous avons hâte de vous accueillir !</p>
        <a href="https://me-experience.lu/profile/appointments" class="button">Gérer mes rendez-vous</a>
      `;
      break;

    case 'cancellation':
      subject = `Annulation de votre rendez-vous`;
      content = `
        <h2>Rendez-vous Annulé</h2>
        <p>Bonjour ${userName},</p>
        <p>Nous vous confirmons l'annulation de votre rendez-vous pour le service <strong>${serviceName}</strong> qui était prévu le ${formattedDate} à ${formattedTime}.</p>
        <p>Si vous n'êtes pas à l'origine de cette annulation ou si vous souhaitez prendre un nouveau rendez-vous, n'hésitez pas à nous contacter ou à utiliser notre plateforme de réservation.</p>
        <a href="https://me-experience.lu/reserver" class="button">Prendre un nouveau RDV</a>
      `;
      break;

    case 'reschedule':
        subject = `Replanification de votre rendez-vous - ${serviceName}`;
        content = `
            <h2>Rendez-vous Replanifié !</h2>
            <p>Bonjour ${userName},</p>
            <p>Votre rendez-vous a bien été replanifié. Voici les nouveaux détails :</p>
            <div class="details">
                <div class="item">
                    <strong>Service:</strong>
                    <span>${serviceName}</span>
                </div>
                <div class="item">
                    <strong>Nouvelle Date:</strong>
                    <span>${formattedDate}</span>
                </div>
                <div class="item">
                    <strong>Nouvelle Heure:</strong>
                    <span>${formattedTime}</span>
                </div>
                <div class="item">
                    <strong>Durée:</strong>
                    <span>${duration} minutes</span>
                </div>
            </div>
            <p>Nous avons hâte de vous voir à cette nouvelle date !</p>
            <a href="https://me-experience.lu/profile/appointments" class="button">Voir mes rendez-vous</a>
        `;
        break;
    
    case 'welcome':
        subject = `Bienvenue chez M.E Experience !`;
        content = `
            <h2>Bienvenue, ${userName} !</h2>
            <p>Nous sommes ravis de vous compter parmi nous. Votre compte a été créé avec succès.</p>
            <p>Vous pouvez désormais gérer vos rendez-vous, consulter nos services et profiter de nos offres exclusives directement depuis votre espace personnel.</p>
            <a href="https://me-experience.lu/reserver" class="button">Prendre votre premier RDV</a>
        `;
        break;

    case 'purchase':
        subject = `Confirmation de votre abonnement - ${planName}`;
        content = `
            <h2>Abonnement Confirmé !</h2>
            <p>Bonjour ${userName},</p>
            <p>Félicitations ! Votre souscription à l'abonnement <strong>${planName}</strong> a été traitée avec succès.</p>
            <div class="details">
                <div class="item">
                    <strong>Abonnement:</strong>
                    <span>${planName}</span>
                </div>
                <div class="item">
                    <strong>Prix:</strong>
                    <span>${planPrice} ${planPeriod ? `/ ${planPeriod}` : ''}</span>
                </div>
            </div>
            <p>Vous pouvez désormais profiter de tous les avantages inclus dans votre abonnement.</p>
            <a href="https://me-experience.lu/profile/subscription" class="button">Gérer mon abonnement</a>
        `;
        break;

    case 'gift_card':
        subject = `Vous avez reçu un Chèque Cadeau ! 🎁`;
        content = `
            <h2>Félicitations ${userName || ''} !</h2>
            <p>Vous avez reçu un chèque cadeau d'une valeur de <strong>${giftAmount}€</strong> à utiliser chez M.E Experience.</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                <p style="margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280;">Votre Code Cadeau</p>
                <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: 700; color: #7c3aed; letter-spacing: 2px; font-family: monospace;">${giftCode}</p>
            </div>
            <p>Vous pouvez utiliser ce code lors de votre prochaine réservation en ligne ou directement au salon.</p>
            <div class="details">
                <div class="item">
                    <strong>Montant:</strong>
                    <span>${giftAmount}€</span>
                </div>
                <div class="item">
                    <strong>Code:</strong>
                    <span>${giftCode}</span>
                </div>
            </div>
            <a href="https://me-experience.lu/reserver" class="button">Réserver maintenant</a>
        `;
        break;

    default:
        return { subject: 'Notification M.E', body: '<p>Ceci est une notification.</p>' };
  }

  const body = generateEmailBody(subject, content);
  return { subject, body };
}