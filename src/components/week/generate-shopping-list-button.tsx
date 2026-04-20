"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingBasket } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { generateShoppingList } from "@/actions/shopping";

type GenerateShoppingListButtonProps = {
  weekStartDate: string;
  listExists: boolean;
  entriesCount: number;
};

export function GenerateShoppingListButton({
  weekStartDate,
  listExists,
  entriesCount,
}: GenerateShoppingListButtonProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function trigger() {
    if (entriesCount === 0) {
      toast.error("Plane zuerst Rezepte in deiner Woche.");
      return;
    }
    if (listExists) {
      setConfirmOpen(true);
    } else {
      run();
    }
  }

  function run() {
    startTransition(async () => {
      try {
        await generateShoppingList({ weekStartDate });
        toast.success("Einkaufsliste erstellt.");
        setConfirmOpen(false);
        router.push("/shopping");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Erstellen fehlgeschlagen.",
        );
      }
    });
  }

  return (
    <>
      <Button
        variant="default"
        size="sm"
        onClick={trigger}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <ShoppingBasket />
        )}
        Einkaufsliste
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Liste überschreiben?</AlertDialogTitle>
            <AlertDialogDescription>
              Für diese Woche existiert bereits eine Einkaufsliste. Die
              automatisch erzeugten Einträge werden ersetzt. Selbst hinzugefügte
              Einträge bleiben erhalten.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                run();
              }}
              disabled={isPending}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Überschreiben
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
