import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'M.E Experience',
    short_name: 'M.E Experience',
    description: 'Votre sanctuaire de bien-être à Luxembourg.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    orientation: 'any',
    prefer_related_applications: false,
    categories: ["lifestyle", "health", "beauty"],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable' as any,
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable' as any,
      },
    ],
  };
}