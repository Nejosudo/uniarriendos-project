'use server';

import cloudinary from '@/lib/cloudinary';
import { headers } from 'next/headers';
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit';
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
    const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const rl = checkRateLimit(rateLimitKey(ip, user?.id || null, 'upload'), 10, 60 * 60 * 1000);
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
    if (!isJpeg && !isPng && !isWebp && file.type !== 'image/avif') {
      throw new Error('Archivo corrupto o MIME falsificado.');
    }

    const resultData: any = await new Promise((resolve, reject) => {
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
            resolve(result);
          } else {
            reject(new Error('Fallo al obtener la URL de la imagen'));
          }
        }
      ).end(buffer);
    });

    try {
      await supabase.from('fotos_validacion').insert({
        usuario_id: user?.id || null,
        resultado: 'aprobada',
        motivo: 'nsfwjs_cliente_aprobada',
        scores: null,
        foto_url: resultData.secure_url
      });
    } catch {}

    return { success: true, url: resultData.secure_url };
  } catch (error: any) {
    console.error('Error en uploadImageToCloudinary:', error);
    return { success: false, error: error.message || 'Error desconocido al subir imagen' };
  }
}
