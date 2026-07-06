"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { removeMember } from "@/actions/household";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { HouseholdMemberInfo } from "@/lib/queries/settings";

export function MemberRow({
  member,
  isOwner,
  currentUserId,
}: {
  member: HouseholdMemberInfo;
  isOwner: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const initials = (
    member.name?.trim().slice(0, 1) || member.email.slice(0, 1)
  ).toUpperCase();
  const canRemove = isOwner && member.userId !== currentUserId;

  async function handleRemove() {
    setRemoving(true);
    try {
      await removeMember(member.userId);
      toast.success(`${member.name ?? member.email} entfernt.`);
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Entfernen fehlgeschlagen.",
      );
      setRemoving(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md py-2">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          {member.name && (
            <p className="truncate text-sm font-medium">{member.name}</p>
          )}
          <p className="truncate text-sm text-muted-foreground">
            {member.email}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant={member.role === "owner" ? "default" : "secondary"}>
          {member.role === "owner" ? "Eigentümer" : "Mitglied"}
        </Badge>
        {canRemove && (
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`${member.name ?? member.email} entfernen`}
                >
                  <UserMinus className="size-4" />
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Mitglied entfernen?</AlertDialogTitle>
                <AlertDialogDescription>
                  {member.name ?? member.email} wird aus diesem Haushalt
                  entfernt und verliert den Zugriff auf alle Rezepte und Pläne.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={removing}>
                  Abbrechen
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    void handleRemove();
                  }}
                  disabled={removing}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {removing && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Entfernen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
