"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { IngredientsInput } from "@/components/recipe/ingredients-input";
import { ComponentsInput } from "@/components/recipe/components-input";
import { StepsInput } from "@/components/recipe/steps-input";
import { ImageUpload } from "@/components/recipe/image-upload";
import { TagInput } from "@/components/recipe/tag-input";
import { RatingInput } from "@/components/recipe/rating-input";
import {
  recipeFormSchema,
  type RecipeFormValues,
} from "@/lib/schemas/recipe";
import { createRecipe, updateRecipe } from "@/actions/recipes";

type RecipeFormProps = {
  mode: "create" | "edit";
  recipeId?: string;
  defaultValues?: Partial<RecipeFormValues>;
  availableTags: { id: string; name: string }[];
};

const EMPTY_DEFAULTS: RecipeFormValues = {
  title: "",
  description: null,
  sourceUrl: null,
  imageUrl: null,
  servings: 2,
  prepMinutes: null,
  cookMinutes: null,
  rating: null,
  notes: null,
  ingredients: [
    { name: "", quantity: null, unit: null, note: null, category: "andere" },
  ],
  steps: [],
  tagNames: [],
  components: [],
} satisfies RecipeFormValues;

export function RecipeForm({
  mode,
  recipeId,
  defaultValues,
  availableTags,
}: RecipeFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: { ...EMPTY_DEFAULTS, ...defaultValues },
    mode: "onBlur",
  });

  async function onSubmit(values: RecipeFormValues) {
    setSubmitting(true);
    try {
      if (mode === "edit" && recipeId) {
        await updateRecipe(recipeId, values);
        toast.success("Rezept aktualisiert.");
        router.push(`/recipes/${recipeId}`);
        router.refresh();
      } else {
        const { id } = await createRecipe(values);
        toast.success("Rezept gespeichert.");
        router.push(`/recipes/${id}`);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Speichern fehlgeschlagen.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 pb-24"
        >
          <section className="space-y-4">
            <h2 className="font-heading text-xl">Basisinfo</h2>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titel</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Pasta Pomodoro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Kurz in einem Satz…"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Foto</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-2">
              <FormField
                control={form.control}
                name="servings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portionen</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={99}
                        {...field}
                        value={field.value ?? 2}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value) || 1)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prepMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vorb.</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={1440}
                        placeholder="15"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cookMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kochen</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={1440}
                        placeholder="30"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="font-heading text-xl">Zutaten</h2>
            <IngredientsInput />
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="font-heading text-xl">Teig-Komponenten (optional)</h2>
            <ComponentsInput />
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="font-heading text-xl">Zubereitung</h2>
            <StepsInput />
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="font-heading text-xl">Tags & Notizen</h2>

            <FormField
              control={form.control}
              name="tagNames"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <TagInput
                      value={field.value ?? []}
                      onChange={field.onChange}
                      availableTags={availableTags}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bewertung</FormLabel>
                  <FormControl>
                    <div>
                      <RatingInput
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notizen</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Persönliche Anpassungen, Varianten…"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sourceUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quelle (URL, optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://…"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <div className="sticky bottom-20 md:bottom-4 flex justify-end gap-2 rounded-md bg-background/95 p-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {mode === "edit" ? "Speichern" : "Rezept anlegen"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </Form>
  );
}

export { Controller };
