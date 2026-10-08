import { api } from '../api/client';

// Phone cameras produce 4–12 MB photos; a receipt is perfectly readable at 1600 px. Resized and
// re-encoded on the device before upload, which also strips the EXIF metadata (GPS position…).
export const resizeImage = (file: File, maxSide = 1600, quality = 0.78): Promise<string> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Impossible de traiter la photo.'));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Fichier image illisible.'));
    };
    img.src = url;
  });

export const uploadPhoto = async (file: File): Promise<string> => {
  const dataUrl = await resizeImage(file);
  const res = await api.post<{ name: string }>('/fichiers', { dataUrl });
  return res.name;
};

export const photoUrl = (name: string) => `/api/fichiers/${name}`;
