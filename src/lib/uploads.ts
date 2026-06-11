import { supabase } from "@/integrations/supabase/client";

const YEAR = 60 * 60 * 24 * 365;

export type UploadedMedia = {
  id: string;
  url: string;
  storage_path: string;
  name: string;
  mime_type: string | null;
};

export async function uploadMedia(file: File): Promise<UploadedMedia> {
  const ext = file.name.split(".").pop() || "bin";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (upErr) throw upErr;

  const { data: signed, error: sErr } = await supabase.storage.from("media").createSignedUrl(path, YEAR);
  if (sErr || !signed) throw sErr ?? new Error("Falha ao gerar URL");

  const { data: row, error: insErr } = await supabase
    .from("media_assets")
    .insert({
      path,
      public_url: signed.signedUrl,
      filename: file.name,
      mime_type: file.type || null,
      size_bytes: file.size,
    })
    .select("id, public_url, path, filename, mime_type")
    .single();
  if (insErr) throw insErr;
  return {
    id: row.id,
    url: row.public_url ?? signed.signedUrl,
    storage_path: row.path,
    name: row.filename ?? file.name,
    mime_type: row.mime_type,
  };
}

export async function deleteMedia(asset: { id: string; storage_path: string }) {
  await supabase.storage.from("media").remove([asset.storage_path]);
  await supabase.from("media_assets").delete().eq("id", asset.id);
}
