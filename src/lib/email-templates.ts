import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';

interface GetEmailContentParams {
  type: 'confirmation' | 'cancellation' | 'reschedule' | 'welcome' | 'invoice' | 'purchase';
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
  const { userName, serviceName, date, duration, planName, planPrice, planPeriod } = data;
  
  const timeZone = 'Europe/Paris';
  
  // CORREÇÃO: Usando formatInTimeZone para garantir o fuso horário correto
  const formattedDate = date ? formatInTimeZone(new Date(date), timeZone, "EEEE, d 'de' MMMM yyyy", { locale: fr }) : '';
  const formattedTime = date ? formatInTimeZone(new Date(date), timeZone, "HH:mm", { locale: fr }) : '';

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
        <a href="https://m-e.com/profile/appointments" class="button">Gérer mes rendez-vous</a>
      `;
      break;

    case 'cancellation':
      subject = `Annulation de votre rendez-vous`;
      content = `
        <h2>Rendez-vous Annulé</h2>
        <p>Bonjour ${userName},</p>
        <p>Nous vous confirmons l'annulation de votre rendez-vous pour le service <strong>${serviceName}</strong> qui était prévu le ${formattedDate} à ${formattedTime}.</p>
        <p>Si vous n'êtes pas à l'origine de cette annulation ou si vous souhaitez prendre un nouveau rendez-vous, n'hésitez pas à nous contacter ou à utiliser notre plateforme de réservation.</p>
        <a href="https://m-e.com/reserver" class="button">Prendre un nouveau RDV</a>
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
            <a href="https://m-e.com/profile/appointments" class="button">Voir mes rendez-vous</a>
        `;
        break;
    
    case 'welcome':
        subject = `Bienvenue chez M.E Experience !`;
        content = `
            <h2>Bienvenue, ${userName} !</h2>
            <p>Nous sommes ravis de vous compter parmi nous. Votre compte a été créé avec succès.</p>
            <p>Vous pouvez désormais gérer vos rendez-vous, consulter nos services et profiter de nos offres exclusives directement depuis votre espace personnel.</p>
            <a href="https://m-e.com/reserver" class="button">Prendre votre premier RDV</a>
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
            <a href="https://m-e.com/profile/subscription" class="button">Gérer mon abonnement</a>
        `;
        break;

    // Adicione outros tipos de e-mail aqui (invoice, etc.)
    default:
        return { subject: 'Notification M.E', body: '<p>Ceci est une notification.</p>' };
  }

  const body = generateEmailBody(subject, content);
  return { subject, body };
}