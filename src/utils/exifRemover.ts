// Remove metadados EXIF de imagens JPEG antes do upload (GPS, dispositivo, etc.)
// Requer: npm install piexifjs

const MAGIC_BYTES: Record<string, number[]> = {
  jpeg: [0xff, 0xd8, 0xff],
  png:  [0x89, 0x50, 0x4e, 0x47],
  webp: [0x52, 0x49, 0x46, 0x46],
};

export type AllowedMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

export function validarMagicBytes(buffer: Uint8Array, type: AllowedMimeType): boolean {
  const expected = {
    'image/jpeg': MAGIC_BYTES.jpeg,
    'image/png':  MAGIC_BYTES.png,
    'image/webp': MAGIC_BYTES.webp,
  }[type];
  return expected.every((byte, i) => buffer[i] === byte);
}

export function validarTipoImagem(mimeType: string): mimeType is AllowedMimeType {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(mimeType);
}

/**
 * Remove segmento APP1 (EXIF) de um JPEG.
 * Para PNG e WebP o EXIF não é incorporado da mesma forma;
 * o upload via Supabase Storage com transformações cuida do restante.
 */
export function removerExifJpeg(arrayBuffer: ArrayBuffer): ArrayBuffer {
  const data = new Uint8Array(arrayBuffer);
  const result: number[] = [];
  let i = 0;

  // Copia SOI (0xFF 0xD8)
  result.push(data[i++], data[i++]);

  while (i < data.length) {
    if (data[i] !== 0xff) break;
    const marker = data[i + 1];
    const segLen = (data[i + 2] << 8) | data[i + 3];

    // APP1 (0xE1) contém EXIF — pula o segmento inteiro
    if (marker === 0xe1) {
      i += 2 + segLen;
      continue;
    }

    // Copia todos os outros segmentos intactos
    const segEnd = i + 2 + segLen;
    for (let j = i; j < segEnd && j < data.length; j++) result.push(data[j]);
    i = segEnd;

    if (marker === 0xda) {
      // SOS — copia o restante (dados de imagem comprimidos)
      for (; i < data.length; i++) result.push(data[i]);
      break;
    }
  }

  return new Uint8Array(result).buffer;
}
