import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const extractSupabasePath = (urlOrPath: string | null | undefined, bucket = 'educational_materials'): string | null => {
  if (!urlOrPath) return null;
  const raw = urlOrPath.trim();
  if (!/^https?:\/\//i.test(raw)) return raw; // sudah path
  const m = raw.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:\?|$)/);
  if (!m) return null;
  const [, bkt, path] = m;
  return bkt === bucket ? path : null;
};

export const toPublicImageUrl = (supabaseClient: any, value: string | null | undefined, bucket = 'educational_materials'): string | null => {
  if (!value) return null;
  const raw = value.trim();
  // Jika URL eksternal (unsplash, dll), langsung pakai
  if (/^https?:\/\//i.test(raw) && !raw.includes('/storage/v1/object/')) {
    return raw;
  }
  const path = extractSupabasePath(raw, bucket) ?? raw;
  const { data } = supabaseClient.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl ?? null;
};
