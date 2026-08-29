'use client';

let model: any = null;
let loading: Promise<any> | null = null;

async function loadModel() {
  if (model) return model;
  if (loading) return loading;
  loading = (async () => {
    const nsfwjs = await import('nsfwjs');
    const m = await nsfwjs.load();
    model = m;
    return m;
  })();
  return loading;
}

export type NsfwResult = { label: string; score: number; blocked: boolean; predictions: { className: string; probability: number }[] };

export async function checkNsfw(file: File): Promise<NsfwResult> {
  const img = await fileToImage(file);
  const m = await loadModel();
  const preds = await m.classify(img);
  const top = preds[0];
  const pornScore = preds.find((p: any) => p.className === 'Porn')?.probability || 0;
  const hentaiScore = preds.find((p: any) => p.className === 'Hentai')?.probability || 0;
  const sexyScore = preds.find((p: any) => p.className === 'Sexy')?.probability || 0;
  const blocked = pornScore > 0.6 || hentaiScore > 0.6 || (pornScore + hentaiScore) > 0.7;
  return { label: top.className, score: top.probability, blocked, predictions: preds };
}

function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo cargar imagen')); };
    img.src = url;
  });
}

export function isAllowedMime(type: string): boolean {
  return ['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(type);
}
