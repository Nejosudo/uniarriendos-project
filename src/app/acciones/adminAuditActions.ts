'use server';
import { createClient } from '@/lib/supabase/server';
export async function logAdminAction(accion: string, entidad: string, entidadId?: string, detalle?: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('admin_audit_log').insert({ admin_id: user.id, accion, entidad, entidad_id: entidadId || null, detalle: detalle || null });
}
export async function exportCsvAdmin(tipo: 'usuarios' | 'propiedades') {
  return { success: false, error: 'Usa el botón Exportar en el panel admin (client-side CSV sin PII)' };
}
