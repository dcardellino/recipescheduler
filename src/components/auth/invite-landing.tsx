"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { registerWithInvite } from "@/actions/auth";
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
import { Label } from "@/components/ui/label";

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Bitte gib deinen Namen ein.")
    .max(80),
  password: z.string().min(8, "Das Passwort muss mindestens 8 Zeichen lang sein."),
});

type RegisterInput = z.infer<typeof registerSchema>;

export function InviteLanding({
  invitedEmail,
  token,
}: {
  invitedEmail: string;
  token: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", password: "" },
  });

  async function onSubmit(values: RegisterInput) {
    setSubmitting(true);
    setErrorMsg(null);

    const result = await registerWithInvite({
      email: invitedEmail,
      password: values.password,
      name: values.name,
      inviteToken: token,
    });

    if (!result.ok) {
      setSubmitting(false);
      setErrorMsg(result.error);
      return;
    }

    // Full navigation so the fresh session cookie is sent; the invite page then
    // joins the household and redirects to /recipes.
    window.location.assign(`/invite?token=${encodeURIComponent(token)}`);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1 text-center">
        <h2 className="font-heading text-2xl">Du wurdest eingeladen</h2>
        <p className="text-muted-foreground">
          Leg ein Passwort fest, um deinem Haushalt beizutreten.
        </p>
      </div>
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    autoComplete="name"
                    placeholder="Dein Name"
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
                    autoComplete="new-password"
                    placeholder="Mindestens 8 Zeichen"
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
                Konto wird erstellt…
              </>
            ) : (
              "Beitreten"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
