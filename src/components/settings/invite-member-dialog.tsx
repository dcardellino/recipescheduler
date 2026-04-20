"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { inviteMember } from "@/actions/household";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const schema = z.object({
  email: z
    .string()
    .min(1, "Bitte gib eine E-Mail-Adresse ein.")
    .email("Das sieht nicht nach einer gültigen E-Mail-Adresse aus."),
});
type FormInput = z.infer<typeof schema>;

type Status = "idle" | "sending" | "sent" | "error";

export function InviteMemberDialog() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      setStatus("idle");
      setSentTo(null);
      form.reset();
    }
    setOpen(next);
  }

  async function onSubmit(values: FormInput) {
    setStatus("sending");
    try {
      await inviteMember(values.email);
      setSentTo(values.email);
      setStatus("sent");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Einladung fehlgeschlagen.";
      toast.error(msg);
      setStatus("error");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <UserPlus className="mr-2 size-4" />
            Einladen
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mitglied einladen</DialogTitle>
          <DialogDescription>
            Gib die E-Mail-Adresse der Person ein, die du einladen möchtest. Sie
            erhält einen Einladungslink per E-Mail.
          </DialogDescription>
        </DialogHeader>

        {status === "sent" ? (
          <div className="space-y-4 text-center py-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Mail className="h-6 w-6" />
            </div>
            <p className="text-sm">
              Einladung an <strong>{sentTo}</strong> gesendet.
            </p>
            <Button onClick={() => handleOpenChange(false)}>Schließen</Button>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 pt-2"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail-Adresse</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="partner@example.de"
                        disabled={status === "sending"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={status === "sending"}
              >
                {status === "sending" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Einladung wird gesendet…
                  </>
                ) : (
                  "Einladung senden"
                )}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
