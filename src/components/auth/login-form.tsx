"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { signIn } from "@/actions/auth";
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
  password: z.string().min(1, "Bitte gib dein Passwort ein."),
});

type LoginInput = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setSubmitting(true);
    setErrorMsg(null);

    const result = await signIn({ email: values.email, password: values.password });

    if (!result.ok) {
      setSubmitting(false);
      setErrorMsg(result.error);
      return;
    }

    const next = searchParams.get("next");
    router.push(next && next.startsWith("/") ? next : "/recipes");
    router.refresh();
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
                  disabled={submitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Passwort</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  disabled={submitting}
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
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Anmelden…
            </>
          ) : (
            "Anmelden"
          )}
        </Button>
      </form>
    </Form>
  );
}
