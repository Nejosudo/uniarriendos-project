'use server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminAction } from '@/lib/admin/auth';
import { sanitizeText } from '@/lib/validation';

export async function logAdminAction(accion: string, entidad: string, entidadId?: string, detalle?: unknown) {
  const auth = await verifyAdminAction();
  if (!auth.success) return;

  try {
    const supabase = await createClient();
    await supabase.from('admin_audit_log').insert({
      admin_id: auth.user.id,
      accion: sanitizeText(accion || '', 100),
      entidad: sanitizeText(entidad || '', 100),
      entidad_id: entidadId ? String(entidadId).slice(0, 100) : null,
      detalle: detalle ?? null
    });
  } catch (error) {
    console.error('No se pudo registrar la auditoría admin:', error);
  }
}

export async function exportCsvAdmin() {
  return { success: false, error: 'Usa el botón Exportar en el panel admin (client-side CSV sin PII)' };
}
