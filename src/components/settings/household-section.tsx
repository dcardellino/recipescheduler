import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HouseholdNameForm } from "./household-name-form";
import { InviteMemberDialog } from "./invite-member-dialog";
import { MemberRow } from "./member-row";
import type { HouseholdSettings } from "@/lib/queries/settings";

export function HouseholdSection({
  settings,
}: {
  settings: HouseholdSettings;
}) {
  const isOwner = settings.currentUserRole === "owner";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Haushalt</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <HouseholdNameForm
          householdName={settings.householdName}
          isOwner={isOwner}
        />
        <Separator />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-muted-foreground">Mitglieder</p>
          {settings.members.map((m) => (
            <MemberRow
              key={m.userId}
              member={m}
              isOwner={isOwner}
              currentUserId={settings.currentUserId}
            />
          ))}
        </div>
        {isOwner && (
          <div className="pt-1">
            <InviteMemberDialog />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
