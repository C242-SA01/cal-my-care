import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const extractSupabasePath = (
  urlOrPath: string | null | undefined,
  bucket = "educational_materials"
): string | null => {
  if (!urlOrPath) return null;
  const raw = urlOrPath.trim();
  if (!/^https?:\/\//i.test(raw)) return raw; // already a path
  const m = raw.match(
    /\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:\?|$)/
  );
  if (!m) return null;
  const [, bkt, path] = m;
  return bkt === bucket ? path : null;
};

export const normalizeStoragePath = (
  urlOrPath: string | null | undefined,
  bucket = "educational_materials"
): string | null => {
  if (!urlOrPath) return null;
  const raw = urlOrPath.trim();
  // external http(s) => return as is
  if (/^https?:\/\//i.test(raw) && !raw.includes("/storage/v1/object/"))
    return raw;
  // supabase public/sign url => extract path
  const path = extractSupabasePath(raw, bucket) ?? raw;
  // our files live under the "public/" folder in this bucket
  return path.startsWith("public/") ? path : `public/${path}`;
};

export const toPublicImageUrl = (
  supabaseClient: any,
  value: string | null | undefined,
  bucket = "educational_materials"
): string | null => {
  if (!value) return null;

  const raw = value.trim();

  // URL eksternal (unsplash/dll) -> pakai apa adanya
  if (/^https?:\/\//i.test(raw) && !raw.includes("/storage/v1/object/")) {
    return raw;
  }

  // Normalisasi path Supabase + pastikan prefix 'public/'
  const path = normalizeStoragePath(raw, bucket);
  if (!path) return null;

  // 1) Coba via SDK
  const { data } = supabaseClient.storage.from(bucket).getPublicUrl(path);
  if (data?.publicUrl) return data.publicUrl;

  // 2) Fallback manual (menghindari null)
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
};
