"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
      <TriangleAlert className="size-10 text-destructive" />
      <div className="space-y-1">
        <h2 className="font-heading text-xl">Etwas ist schiefgelaufen.</h2>
        <p className="text-sm text-muted-foreground">
          Bitte versuche es erneut.
          {error.digest && (
            <>
              {" "}
              Fehler-ID:{" "}
              <code className="font-mono text-xs">{error.digest}</code>
            </>
          )}
        </p>
      </div>
      <Button onClick={reset} variant="outline">
        Erneut versuchen
      </Button>
    </div>
  );
}
