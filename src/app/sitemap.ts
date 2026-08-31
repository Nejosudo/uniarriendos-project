import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://uniarriendos-project.vercel.app';
  const supabase = await createClient();
  const { data } = await supabase.from('propiedades').select('id, updated_at').in('estado', ['disponible', 'ocupado']).order('updated_at', { ascending: false }).limit(1000);
  const statics: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/explorar`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${base}/nosotros`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];
  const props: MetadataRoute.Sitemap = (data || []).map(p => ({ url: `${base}/propiedades/${p.id}`, lastModified: p.updated_at ? new Date(p.updated_at) : new Date(), changeFrequency: 'weekly' as const, priority: 0.7 }));
  return [...statics, ...props];
}
