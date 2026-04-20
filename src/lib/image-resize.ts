export type ResizeOptions = {
  maxWidth?: number;
  quality?: number;
  mimeType?: "image/jpeg" | "image/webp";
};

function readFileAsImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Bild konnte nicht geladen werden."));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Bild-Encoding fehlgeschlagen."));
      },
      type,
      quality,
    );
  });
}

export async function resizeImage(
  file: File,
  options: ResizeOptions = {},
): Promise<File> {
  const { maxWidth = 1600, quality = 0.85, mimeType = "image/jpeg" } = options;

  if (!file.type.startsWith("image/")) {
    throw new Error("Nur Bilddateien werden unterstützt.");
  }

  const img = await readFileAsImage(file);
  const scale = img.width > maxWidth ? maxWidth / img.width : 1;
  const targetWidth = Math.round(img.width * scale);
  const targetHeight = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas-Kontext nicht verfügbar.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const blob = await canvasToBlob(canvas, mimeType, quality);
  const ext = mimeType === "image/webp" ? "webp" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}.${ext}`, { type: mimeType });
}
