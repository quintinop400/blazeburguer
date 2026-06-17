import { supabase } from "@/integrations/supabase/client";

const YEAR = 60 * 60 * 24 * 365;
const MEDIA_BUCKET = "media";

export type UploadedMedia = {
  id: string;
  url: string;
  storage_path: string;
  name: string;
  mime_type: string | null;
};

export async function uploadMedia(file: File, categoryId?: string): Promise<UploadedMedia> {
  const ext = file.name.split(".").pop() || "bin";
  const path = `${crypto.randomUUID()}.${ext}`;

  console.log("[UPLOAD] Iniciando upload", { file: file.name, size: file.size, type: file.type });

  const { error: upErr } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (upErr) {
    console.error("[UPLOAD] Erro ao fazer upload no storage", upErr);
    throw upErr;
  }
  console.log("[UPLOAD] Arquivo enviado com sucesso ao storage", { path });

  const { data: signed, error: sErr } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(path, YEAR);
  if (sErr || !signed) {
    console.error("[UPLOAD] Erro ao gerar URL assinada", sErr);
    throw sErr ?? new Error("Falha ao gerar URL");
  }
  console.log("[UPLOAD] URL assinada gerada com sucesso");

  const insertPayload: any = {
    bucket: MEDIA_BUCKET,
    path,
    public_url: signed.signedUrl,
    filename: file.name,
    mime_type: file.type || null,
    size_bytes: file.size,
  };
  
  // Só adiciona category_id se for fornecido
  if (categoryId) {
    insertPayload.category_id = categoryId;
  }

  console.log("[UPLOAD] Tentando inserir no banco de dados", { categoryId });

  let row: any;
  const { data: rowData, error: insErr } = await supabase
    .from("media_assets")
    .insert(insertPayload)
    .select("*")
    .single();

  if (insErr) {
    console.error("[UPLOAD] Erro ao inserir - tentando fallback", { error: insErr.message });
    const message = insErr.message?.toLowerCase() ?? "";
    if (message.includes("column public_url") || message.includes("column filename") || message.includes("column category_id") || message.includes("column bucket") || message.includes("column path")) {
      console.log("[UPLOAD] Usando schema antigo (fallback)");
      const fallbackPayload: any = {
        storage_path: path,
        url: signed.signedUrl,
        name: file.name,
        mime_type: file.type || null,
        size_bytes: file.size,
      };
      if (categoryId) {
        fallbackPayload.category_id = categoryId;
      }
      const { data: fallbackRow, error: fallbackErr } = await supabase
        .from("media_assets")
        .insert(fallbackPayload)
        .select("*")
        .single();
      if (fallbackErr) {
        console.error("[UPLOAD] Erro no fallback também", fallbackErr);
        throw fallbackErr;
      }
      row = fallbackRow;
    } else {
      console.error("[UPLOAD] Erro que não é de schema", insErr);
      throw insErr;
    }
  } else {
    row = rowData;
  }

  console.log("[UPLOAD] Sucesso! Arquivo registrado no banco", { id: row?.id });

  return {
    id: row.id,
    url: row.public_url ?? row.url ?? signed.signedUrl,
    storage_path: row.path ?? row.storage_path,
    name: row.filename ?? row.name ?? file.name,
    mime_type: row.mime_type,
  };
}

export async function deleteMedia(asset: { id: string; storage_path: string }) {
  const { error: storageError } = await supabase.storage.from(MEDIA_BUCKET).remove([asset.storage_path]);
  if (storageError) throw storageError;

  const { error: rowError } = await supabase.from("media_assets").delete().eq("id", asset.id);
  if (rowError) throw rowError;
}
