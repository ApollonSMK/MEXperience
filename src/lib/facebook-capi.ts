import { createHash } from 'crypto';

const PIXEL_ID = '4367923510121644';
const ACCESS_TOKEN = 'EAAWgNWF56nwBQHXpeHl9XvrXLrZCA0mTLdJSL8x7ZAQERadRjZCzPknCkMWUb2yV4B3DZBUCK1RZCCK2TXm5qn4yW5FLVFjeWnI2bliGG7j7uHBFU119nTtZCuXlA6Iv4j2wPKe4M7M5VQIsU0jjIO5xm4xxk0LtWdvkW5DSaGqpSSILmAz98HIvnH0WrpjQZDZD';

/**
 * Hash data using SHA-256 as required by Facebook CAPI
 */
const hashData = (data: string | undefined | null) => {
  if (!data) return null;
  return createHash('sha256').update(data.trim().toLowerCase()).digest('hex');
};

interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  clientIp?: string;
  userAgent?: string;
  fbc?: string;
  fbp?: string;
}

interface EventData {
  eventName: string;
  eventId?: string; // Para deduplicação
  eventSourceUrl: string;
  userData: UserData;
  customData?: any;
}

export const sendFacebookEvent = async (eventData: EventData) => {
  try {
    const currentTimestamp = Math.floor(Date.now() / 1000);

    const userDataPayload: any = {
      em: hashData(eventData.userData.email),
      ph: hashData(eventData.userData.phone),
      fn: hashData(eventData.userData.firstName),
      ln: hashData(eventData.userData.lastName),
      ct: hashData(eventData.userData.city),
      st: hashData(eventData.userData.state),
      zp: hashData(eventData.userData.zip),
      country: hashData(eventData.userData.country),
      client_ip_address: eventData.userData.clientIp,
      client_user_agent: eventData.userData.userAgent,
    };

    // Remover campos nulos
    Object.keys(userDataPayload).forEach(key => {
        if (userDataPayload[key] === null) delete userDataPayload[key];
    });

    const payload = {
      data: [
        {
          event_name: eventData.eventName,
          event_time: currentTimestamp,
          event_id: eventData.eventId,
          event_source_url: eventData.eventSourceUrl,
          action_source: 'website',
          user_data: userDataPayload,
          custom_data: eventData.customData,
        },
      ],
    };

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();
    
    if (result.error) {
        console.error('Facebook CAPI Error:', result.error);
    } else {
        console.log(`Facebook Event ${eventData.eventName} sent successfully.`);
    }
    
    return result;
  } catch (error) {
    console.error('Failed to send Facebook event:', error);
  }
};