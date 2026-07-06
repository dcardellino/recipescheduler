import { getSessionUser } from "@/lib/authz";
import { getHouseholdSettings } from "@/lib/queries/settings";
import { PageHeader } from "@/components/layout/page-header";
import { AccountSection } from "@/components/settings/account-section";
import { HouseholdSection } from "@/components/settings/household-section";

export default async function SettingsPage() {
  const [settings, sessionUser] = await Promise.all([
    getHouseholdSettings(),
    getSessionUser(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Konto" title="Einstellungen" />
      <HouseholdSection settings={settings} />
      <AccountSection
        email={sessionUser!.email}
        name={sessionUser!.name ?? null}
      />
    </div>
  );
}
