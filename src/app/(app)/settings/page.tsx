import { getSessionUser } from "@/lib/authz";
import { getHouseholdSettings } from "@/lib/queries/settings";
import { AccountSection } from "@/components/settings/account-section";
import { HouseholdSection } from "@/components/settings/household-section";

export default async function SettingsPage() {
  const [settings, sessionUser] = await Promise.all([
    getHouseholdSettings(),
    getSessionUser(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-3xl">Einstellungen</h1>
      <HouseholdSection settings={settings} />
      <AccountSection
        email={sessionUser!.email}
        name={sessionUser!.name ?? null}
      />
    </div>
  );
}
