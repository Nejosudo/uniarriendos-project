'use server';

import cloudinary from '@/lib/cloudinary';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Server Action para subir imágenes a Cloudinary.
 * Aplica límites de peso y transformaciones de optimización automática.
 */
export async function uploadImageToCloudinary(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No se ha proporcionado ninguna imagen');
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      throw new Error('El archivo debe ser una imagen válida (JPG, PNG, WebP)');
    }

    // Validar peso máximo (5 MB)
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('La imagen es demasiado pesada. El límite máximo es de 5MB por foto.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir a Cloudinary con optimización al vuelo
    const secureUrl = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          folder: 'uniarriendos_propiedades',
          // Transformaciones: Auto formato (webp/avif), auto calidad, máximo 1920px de ancho (mantiene proporción)
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
            resolve(result.secure_url);
          } else {
            reject(new Error('Fallo al obtener la URL de la imagen'));
          }
        }
      ).end(buffer);
    });

    return { success: true, url: secureUrl };
  } catch (error: any) {
    console.error('Error en uploadImageToCloudinary:', error);
    return { success: false, error: error.message || 'Error desconocido al subir imagen' };
  }
}
