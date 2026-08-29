import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://uniarriendos-project.vercel.app';
  return {
    rules: [{ userAgent: '*', allow: ['/', '/explorar', '/propiedades/'], disallow: ['/dashboard', '/admin', '/api/'] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
