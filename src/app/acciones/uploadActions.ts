'use server';

import cloudinary from '@/lib/cloudinary';
import { headers } from 'next/headers';
import { checkRateLimit, rateLimitKey, getClientIp } from '@/lib/rateLimit';
import { createClient } from '@/lib/supabase/server';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

/**
 * Server Action para subir imágenes a Cloudinary.
 * Aplica límites de peso y transformaciones de optimización automática.
 */
export async function uploadImageToCloudinary(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Debes iniciar sesión para subir imágenes' };
    }
    const ip = getClientIp(await headers());
    const rl = checkRateLimit(rateLimitKey(ip, user.id, 'upload'), 10, 60 * 60 * 1000);
    if (!rl.ok) return { success: false, error: 'Límite de subidas alcanzado (10/h). Intenta más tarde.' };

    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No se ha proporcionado ninguna imagen');
    }

    if (!ALLOWED_MIME.has(file.type)) {
      throw new Error('Formato no permitido. Usa JPG, PNG, WebP o AVIF.');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('La imagen es demasiado pesada. El límite máximo es de 5MB por foto.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const header = buffer.subarray(0, 8).toString('hex');
    const isJpeg = header.startsWith('ffd8ff');
    const isPng = header.startsWith('89504e47');
    const isWebp = buffer.subarray(8, 12).toString() === 'WEBP';
    const isAvif = buffer.subarray(4, 8).toString() === 'ftyp' &&
      /avif|avis/.test(buffer.subarray(8, 32).toString());

    const detectedMime = isJpeg
      ? 'image/jpeg'
      : isPng
        ? 'image/png'
        : isWebp
          ? 'image/webp'
          : isAvif
            ? 'image/avif'
            : null;

    if (!detectedMime) {
      throw new Error('Archivo corrupto o MIME falsificado.');
    }
    if (file.type !== detectedMime) {
      throw new Error('El tipo declarado no coincide con el contenido del archivo.');
    }

    const resultData = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          folder: 'uniarriendos_propiedades',
          transformation: [
            { width: 1920, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Error subiendo a Cloudinary:', error);
            reject(new Error('Error de conexión con Cloudinary'));
            return;
          }
          if (result && result.secure_url) {
            resolve(result as { secure_url: string });
          } else {
            reject(new Error('Fallo al obtener la URL de la imagen'));
          }
        }
      ).end(buffer);
    });

    try {
      const contextoRaw = String(formData.get('contexto') || 'general').toLowerCase();
      const contexto = ['propiedad', 'perfil', 'pqrs'].includes(contextoRaw) ? contextoRaw : 'general';
      if (contexto !== 'propiedad') {
        await supabase.from('fotos_validacion').insert({
          usuario_id: user.id,
          resultado: 'pendiente',
          motivo: `${contexto}:pendiente_revision_servidor`,
          scores: null,
          foto_url: resultData.secure_url
        });
      }
    } catch {}

    return { success: true, url: resultData.secure_url };
  } catch (error) {
    console.error('Error en uploadImageToCloudinary:', error);
    const message = error instanceof Error ? error.message : '';
    if (message.startsWith('Formato no permitido') ||
        message.startsWith('La imagen es demasiado') ||
        message.startsWith('Archivo corrupto') ||
        message.startsWith('El tipo declarado') ||
        message.startsWith('No se ha proporcionado')) {
      return { success: false, error: message };
    }
    return { success: false, error: 'No se pudo subir la imagen' };
  }
}
