export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || '4367923510121644';

export const pageview = () => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', 'PageView');
  }
};

// https://developers.facebook.com/docs/facebook-pixel/advanced/
export const event = (name: string, options = {}, eventId?: string) => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    const params = eventId ? { ...options, eventID: eventId } : options;
    (window as any).fbq('track', name, params);
  }
};