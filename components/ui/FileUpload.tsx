"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

async function resizeImage(
  file: File,
  targetWidth: number,
  targetHeight: number,
): Promise<Blob> {
  const img = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d")!;

  // cover-fit: scale to fill target box, crop overflow, centered
  const sourceRatio = img.width / img.height;
  const targetRatio = targetWidth / targetHeight;

  let sx = 0,
    sy = 0,
    sw = img.width,
    sh = img.height;

  if (sourceRatio > targetRatio) {
    sw = img.height * targetRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / targetRatio;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.85);
  });
}

export function FileUpload({
  bucket,
  accept,
  label,
  currentUrl,
  onUploaded,
  resizeTo,
}: {
  bucket: string;
  accept: string;
  label: string;
  currentUrl?: string | null;
  onUploaded: (url: string, originalName: string) => void;
  resizeTo?: { width: number; height: number };
}) {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(currentUrl || null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      let uploadBody: Blob = file;
      let ext = file.name.split(".").pop() || "jpg";

      if (resizeTo && accept.startsWith("image")) {
        uploadBody = await resizeImage(file, resizeTo.width, resizeTo.height);
        ext = "jpg";
      }

      const path = `${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, uploadBody);

      if (uploadError) {
        setUploading(false);
        setError(uploadError.message);
        return;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      setUploading(false);
      setPreview(data.publicUrl);
      onUploaded(data.publicUrl, file.name);
    } catch (err) {
      setUploading(false);
      setError("Failed to process image.");
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-foreground">
        {label}
      </label>

      {preview && accept.startsWith("image") && (
        <div className="relative w-full h-32 mb-2">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover rounded-md border border-border"
          />
        </div>
      )}
      {preview && accept.startsWith("video") && (
        <video
          src={preview}
          controls
          className="w-full rounded-md mb-2 border border-border"
        />
      )}

      <input
        type="file"
        accept={accept}
        onChange={handleFile}
        disabled={uploading}
        className="text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-accent-light hover:file:bg-accent hover:file:text-white file:cursor-pointer transition-colors"
      />

      {resizeTo && (
        <p className="text-xs text-gray-400 mt-1">
          Auto-cropped to {resizeTo.width}x{resizeTo.height}. Ensure the image
          is a 1280x720px PNG or JPG image for best results. If you upload a
          different size, it will be cropped to fit.
        </p>
      )}
      {uploading && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
