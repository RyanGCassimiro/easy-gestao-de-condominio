import { supabase } from './supabaseClient';
import { removerExifJpeg, validarMagicBytes, validarTipoImagem, AllowedMimeType } from '../utils/exifRemover';

export async function uploadImagem(
  bucket: string,
  path: string,
  uri: string,
  mimeType: string,
): Promise<string> {
  if (!validarTipoImagem(mimeType)) {
    throw new Error('Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.');
  }

  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  if (!validarMagicBytes(bytes, mimeType as AllowedMimeType)) {
    throw new Error('Arquivo inválido: magic bytes não correspondem ao tipo declarado.');
  }

  // Remove EXIF apenas em JPEG
  const cleanBuffer = mimeType === 'image/jpeg'
    ? removerExifJpeg(arrayBuffer)
    : arrayBuffer;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, cleanBuffer, { contentType: mimeType, upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deletarImagem(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}
