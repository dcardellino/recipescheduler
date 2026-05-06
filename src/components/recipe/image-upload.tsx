"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { resizeImage } from "@/lib/image-resize";
import { cn } from "@/lib/utils";

type ImageUploadProps = {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  disabled?: boolean;
};

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Nur Bilddateien sind erlaubt.");
      return;
    }
    setUploading(true);
    try {
      const resized = await resizeImage(file, {
        maxWidth: 1600,
        quality: 0.85,
      });
      const form = new FormData();
      form.append("file", resized);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error("Bild-Upload fehlgeschlagen.");
      const { publicUrl } = (await res.json()) as { publicUrl: string };
      onChange(publicUrl);
      toast.success("Bild hochgeladen.");
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Upload fehlgeschlagen.",
      );
    } finally {
      setUploading(false);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  if (value) {
    return (
      <div className="relative overflow-hidden rounded-md border">
        <div className="relative aspect-[16/9] w-full">
          <Image
            src={value}
            alt="Rezept-Bild"
            fill
            sizes="(max-width: 768px) 100vw, 600px"
            className="object-cover"
            unoptimized
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onChange(null)}
          disabled={disabled || uploading}
          className="absolute top-2 right-2"
        >
          <X className="size-4" />
          Entfernen
        </Button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "flex aspect-[16/9] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-muted/30 transition-colors hover:bg-muted/50",
        dragging && "border-primary bg-primary/5",
        (disabled || uploading) && "pointer-events-none opacity-60",
      )}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      {uploading ? (
        <>
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Wird hochgeladen…</p>
        </>
      ) : (
        <>
          <ImagePlus className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Klick oder Datei hierhin ziehen
          </p>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onInputChange}
        className="hidden"
      />
    </div>
  );
}
