"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail } from "lucide-react";
import { requestLoginLink } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Bitte gib deine E-Mail-Adresse ein.")
    .email("Das sieht nicht nach einer gültigen E-Mail-Adresse aus."),
});

type LoginInput = z.infer<typeof loginSchema>;

type Status = "idle" | "sending" | "sent" | "error";

export function LoginForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: LoginInput) {
    setStatus("sending");
    setErrorMsg(null);

    const next = searchParams.get("next") ?? undefined;
    const result = await requestLoginLink({ email: values.email, next });

    if (!result.ok) {
      setStatus("error");
      setErrorMsg(result.error);
      return;
    }

    setSentTo(values.email);
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
          Wir haben dir einen Login-Link an <strong>{sentTo}</strong> geschickt.
          Klick ihn an, um dich anzumelden.
        </p>
        <Button
          variant="ghost"
          onClick={() => {
            setStatus("idle");
            setSentTo(null);
            form.reset();
          }}
        >
          Andere E-Mail verwenden
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-Mail</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="deine@mail.de"
                  disabled={status === "sending"}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {errorMsg ? (
          <p className="text-sm text-destructive" role="alert">
            {errorMsg}
          </p>
        ) : null}
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
            "Magic Link senden"
          )}
        </Button>
      </form>
    </Form>
  );
}
