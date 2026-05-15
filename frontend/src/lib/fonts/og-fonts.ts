import { getPublicSiteOrigin } from '@/lib/site-config';

export async function getOgFonts() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || getPublicSiteOrigin();
  
  const [cinzelData, frauncesData] = await Promise.all([
    fetch(`${baseUrl}/fonts/Cinzel-Bold.ttf`).then((res) => res.arrayBuffer()),
    fetch(`${baseUrl}/fonts/Fraunces-Italic.ttf`).then((res) => res.arrayBuffer()),
  ]);

  return [
    {
      name: 'Cinzel',
      data: cinzelData,
      style: 'normal' as const,
      weight: 700 as const,
    },
    {
      name: 'Fraunces',
      data: frauncesData,
      style: 'italic' as const,
      weight: 400 as const,
    },
  ];
}
