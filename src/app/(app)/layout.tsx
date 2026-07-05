import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/authz";
import { TopNav } from "@/components/layout/top-nav";
import { BottomNav } from "@/components/layout/bottom-nav";
import { OfflineBanner } from "@/components/layout/offline-banner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav user={{ name: sessionUser.name, email: sessionUser.email }} />
      <OfflineBanner />
      <main className="flex-1 pb-20 md:pb-8">
        <div className="mx-auto w-full max-w-screen-2xl px-4 py-6">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
