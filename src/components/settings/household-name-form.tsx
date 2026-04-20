"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { updateHouseholdName } from "@/actions/household";
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

const schema = z.object({
  name: z.string().trim().min(1, "Name darf nicht leer sein.").max(80),
});
type FormInput = z.infer<typeof schema>;

export function HouseholdNameForm({
  householdName,
  isOwner,
}: {
  householdName: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: { name: householdName },
  });

  async function onSubmit(values: FormInput) {
    try {
      await updateHouseholdName(values.name);
      toast.success("Haushalt gespeichert.");
      setEditing(false);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
      );
    }
  }

  if (!isOwner) {
    return (
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Haushaltsname
        </p>
        <p className="mt-1 font-medium">{householdName}</p>
      </div>
    );
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Haushaltsname
          </p>
          <p className="mt-1 font-medium">{householdName}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditing(true)}
          aria-label="Namen bearbeiten"
        >
          <Pencil className="size-4" />
          Bearbeiten
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Haushaltsname</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={form.formState.isSubmitting}
                  autoFocus
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <Button
            type="submit"
            size="sm"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            Speichern
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              form.reset({ name: householdName });
              setEditing(false);
            }}
          >
            Abbrechen
          </Button>
        </div>
      </form>
    </Form>
  );
}
