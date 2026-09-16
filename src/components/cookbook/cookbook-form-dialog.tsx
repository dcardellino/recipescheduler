"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { createCookbook, updateCookbook } from "@/actions/cookbooks";
import {
  COOKBOOK_SUGGESTIONS,
  cookbookFormSchema,
  type CookbookFormInput,
} from "@/lib/schemas/cookbook";

type CookbookFormDialogProps =
  | { mode: "create"; cookbook?: undefined }
  | {
      mode: "edit";
      cookbook: { id: string; name: string; description: string | null };
    };

/**
 * Creates a cookbook or renames an existing one. On create it offers the
 * usual axes people sort by — meal, course, cuisine, diet — as one-tap names.
 */
export function CookbookFormDialog(props: CookbookFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<CookbookFormInput>({
    resolver: zodResolver(cookbookFormSchema),
    defaultValues: {
      name: props.mode === "edit" ? props.cookbook.name : "",
      description: props.mode === "edit" ? (props.cookbook.description ?? "") : "",
    },
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      form.reset({
        name: props.mode === "edit" ? props.cookbook.name : "",
        description:
          props.mode === "edit" ? (props.cookbook.description ?? "") : "",
      });
    }
    setOpen(next);
  }

  async function onSubmit(values: CookbookFormInput) {
    setIsPending(true);
    try {
      if (props.mode === "edit") {
        await updateCookbook({ ...values, id: props.cookbook.id });
        toast.success("Kochbuch gespeichert.");
        setOpen(false);
        router.refresh();
      } else {
        const { id } = await createCookbook(values);
        toast.success("Kochbuch angelegt.");
        setOpen(false);
        form.reset({ name: "", description: "" });
        router.push(`/cookbooks/${id}`);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          props.mode === "edit" ? (
            <Button variant="outline" size="sm">
              <Pencil className="size-4" />
              Bearbeiten
            </Button>
          ) : (
            <Button>
              <Plus className="size-4" />
              Neues Kochbuch
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {props.mode === "edit" ? "Kochbuch bearbeiten" : "Neues Kochbuch"}
          </DialogTitle>
          <DialogDescription>
            Sortiere deine Rezepte nach Mahlzeit, Gang, Küche, Ernährungsform —
            oder wonach du willst.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-2"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z.B. Frühstück"
                      autoFocus
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {props.mode === "create" && (
              <div className="flex flex-wrap gap-1.5">
                {COOKBOOK_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() =>
                      form.setValue("name", suggestion, {
                        shouldValidate: true,
                      })
                    }
                    className="rounded-sm border border-border bg-background px-2.5 py-0.5 text-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Wofür ist dieses Kochbuch?"
                      disabled={isPending}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {props.mode === "edit" ? "Speichern" : "Kochbuch anlegen"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
