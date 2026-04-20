"use client";

// NOTE: Diese Seite ist nur für Dev-Smoke-Tests und wird in Phase 3 entfernt.

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type State =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "done"; publicUrl: string }
  | { kind: "error"; message: string };

export default function UploadTestPage() {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function handleFile(file: File) {
    setState({ kind: "uploading" });
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Sign URL failed: ${res.status} ${err}`);
      }
      const { uploadUrl, publicUrl } = (await res.json()) as {
        uploadUrl: string;
        publicUrl: string;
      };

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!putRes.ok) {
        const err = await putRes.text();
        throw new Error(`PUT failed: ${putRes.status} ${err}`);
      }

      setState({ kind: "done", publicUrl });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Upload-Smoke-Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Datei wählen → signed URL von <code>/api/upload</code> holen →
            direkt zu Minio PUTen → Bild darunter laden.
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          {state.kind === "uploading" && (
            <p className="text-sm text-muted-foreground">Wird hochgeladen…</p>
          )}
          {state.kind === "error" && (
            <p className="text-sm text-destructive">Fehler: {state.message}</p>
          )}
          {state.kind === "done" && (
            <div className="space-y-2">
              <p className="text-sm">
                Public URL:{" "}
                <a
                  href={state.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  {state.publicUrl}
                </a>
              </p>
              {/* Use plain img — publicUrl host isn't in next.config.images.remotePatterns */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={state.publicUrl}
                alt="Uploaded preview"
                className="rounded-md border border-border"
              />
            </div>
          )}
          {state.kind === "done" && (
            <Button onClick={() => setState({ kind: "idle" })}>
              Nochmal
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
