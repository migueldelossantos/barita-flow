import { createClient } from "../supabase/client";

const BUCKET = "company-assets";

export async function uploadCompanyImage(
  companyId: string,
  file: File,
  folder: "logo" | "banner" | "products"
): Promise<string | null> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${companyId}/${folder}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if (error) {
    console.error("upload error:", error);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
