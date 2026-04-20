import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getHouseholdSettings } from "@/lib/queries/settings";
import { AccountSection } from "@/components/settings/account-section";
import { HouseholdSection } from "@/components/settings/household-section";

export default async function SettingsPage() {
  const [settings, session] = await Promise.all([
    getHouseholdSettings(),
    auth.api.getSession({ headers: await headers() }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-3xl">Einstellungen</h1>
      <HouseholdSection settings={settings} />
      <AccountSection
        email={session!.user.email}
        name={session!.user.name ?? null}
      />
    </div>
  );
}
