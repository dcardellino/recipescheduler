"use client";

import { useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { optimizeShoppingListWithAi } from "@/actions/shopping";

type OptimizeShoppingListButtonProps = {
  listId: string;
};

export function OptimizeShoppingListButton({
  listId,
}: OptimizeShoppingListButtonProps) {
  const [isPending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      try {
        await optimizeShoppingListWithAi(listId);
        toast.success("Liste mit KI aufgeräumt.");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "KI-Optimierung fehlgeschlagen.",
        );
      }
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={run}
      disabled={isPending}
      className="w-full"
    >
      {isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
      Mit KI aufräumen
    </Button>
  );
}
