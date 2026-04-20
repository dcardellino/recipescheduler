"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AccountSection({
  email,
  name,
}: {
  email: string;
  name: string | null;
}) {
  const router = useRouter();

  async function handleSignOut() {
    try {
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Abmelden fehlgeschlagen. Bitte versuch es erneut.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          {name && (
            <p className="font-medium">{name}</p>
          )}
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
        <div>
          <Button variant="outline" onClick={() => void handleSignOut()}>
            <LogOut className="mr-2 size-4" />
            Abmelden
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
