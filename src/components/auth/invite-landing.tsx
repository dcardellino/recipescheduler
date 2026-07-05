"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { requestLoginLink } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Status = "idle" | "sending" | "sent" | "error";

export function InviteLanding({
  invitedEmail,
  token,
}: {
  invitedEmail: string;
  token: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg(null);

    const result = await requestLoginLink({
      email: invitedEmail,
      inviteToken: token,
      next: `/invite?token=${encodeURIComponent(token)}`,
    });

    if (!result.ok) {
      setStatus("error");
      setErrorMsg(result.error);
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Mail className="h-6 w-6" />
        </div>
        <h2 className="font-heading text-2xl">Check dein Postfach</h2>
        <p className="text-muted-foreground">
          Wir haben dir einen Link an <strong>{invitedEmail}</strong> geschickt.
          Klick ihn an, um der Einladung beizutreten.
        </p>
        <p className="text-xs text-muted-foreground">
          Keine Mail bekommen? In der lokalen Entwicklung wird die URL im
          Server-Terminal ausgegeben.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1 text-center">
        <h2 className="font-heading text-2xl">Du wurdest eingeladen</h2>
        <p className="text-muted-foreground">
          Melde dich an, um der Einladung beizutreten.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="invite-email">E-Mail</Label>
          <Input
            id="invite-email"
            type="email"
            value={invitedEmail}
            readOnly
            className="bg-muted"
          />
        </div>
        {errorMsg && (
          <p className="text-sm text-destructive" role="alert">
            {errorMsg}
          </p>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={status === "sending"}
        >
          {status === "sending" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Link wird gesendet…
            </>
          ) : (
            "Login-Link senden"
          )}
        </Button>
      </form>
    </div>
  );
}
